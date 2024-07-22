import { Hono } from "hono";
import { validator } from "hono/validator";
import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { GSI1PK, GSI1SK, PK, prefix, SK } from "@cactus/core/constants";
import { BadRequestError, NotFoundError } from "@cactus/core/errors";
import {
  ajvValidator,
  FormSchema,
  PostSubmissionPathParams,
  vValidator,
} from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { Resource } from "sst";

export default new Hono().post(
  "/",
  validator(
    "param",
    vValidator(PostSubmissionPathParams, {
      Error: BadRequestError,
      message: "Invalid query parameters",
    }),
  ),
  async (c, next) => {
    const { client, marshall, unmarshall } = c.get("ddb");

    const { siteId, formId } = c.req.valid("param");

    const output = await client.send(
      new GetItemCommand({
        TableName: Resource.Table.name,
        Key: {
          [PK]: marshall(pk({ prefix: prefix.site, value: siteId })),
          [SK]: marshall(sk([{ prefix: prefix.form, value: formId }])),
        },
      }),
    );

    if (!output.Item) throw new NotFoundError("Form not found");
    if (!output.Item.schema.M) return await next();

    const schema = unmarshall(output.Item.schema.M);
    c.set("schema", schema);

    await next();
  },
  validator("form", (data, c) => {
    const schema = c.get("schema");

    if (!schema) return data;

    const validate = ajvValidator(schema);
    return validate(data);
  }),
  async (c) => {
    const { client, marshall } = c.get("ddb");

    const { siteId, formId } = c.req.valid("param");
    const submissionId = c.get("requestId");

    client.send(
      new PutItemCommand({
        TableName: Resource.Table.name,
        Item: {
          [PK]: marshall(pk({ prefix: prefix.site, value: siteId })),
          [SK]: marshall(
            sk([
              { prefix: prefix.form, value: formId },
              { prefix: prefix.submission, value: submissionId },
            ]),
          ),
          [GSI1PK]: marshall(pk({ prefix: prefix.form, value: formId })),
          [GSI1SK]: marshall(
            sk([{ prefix: prefix.submission, value: submissionId }]),
          ),
          createdAt: marshall(new Date().toISOString()),
          ...Object.entries(c.req.valid("form")).reduce(
            (fields, [key, value]) => ({
              ...fields,
              [key]: marshall(value),
            }),
            {},
          ),
        },
      }),
    );

    return c.json({ submissionId }, { status: 201 });
  },
);
