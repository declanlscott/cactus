import { Hono } from "hono";
import { validator } from "hono/validator";
import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { GSI1PK, GSI1SK, PK, prefix, SK } from "@cactus/core/constants";
import { BadRequestError } from "@cactus/core/errors";
import {
  ajvValidator,
  JSONSchemaType,
  PostSubmissionQueryParams,
  vValidator,
} from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { Resource } from "sst";

export default new Hono().post(
  "/",
  validator(
    "query",
    vValidator(PostSubmissionQueryParams, {
      Error: BadRequestError,
      message: "Invalid query parameters",
    }),
  ),
  async (c, next) => {
    const { siteId, formId } = c.req.valid("query");

    const output = await c.get("ddb").send(
      new GetItemCommand({
        TableName: Resource.Table.name,
        Key: {
          [PK]: pk({ prefix: prefix.site, value: siteId }),
          [SK]: sk([{ prefix: prefix.form, value: formId }]),
        },
      }),
    );

    c.set("schema", output.Item?.schema.M as JSONSchemaType<unknown>);

    await next();
  },
  validator("form", (data, c) => {
    const schema = c.get("schema");

    if (schema) {
      const validate = ajvValidator(schema);

      return validate(data);
    }

    return data;
  }),
  async (c) => {
    const { siteId, formId } = c.req.valid("query");
    const submissionId = c.get("requestId");

    c.get("ddb").send(
      new PutItemCommand({
        TableName: Resource.Table.name,
        Item: {
          [PK]: pk({ prefix: prefix.site, value: siteId }),
          [SK]: sk([
            { prefix: prefix.form, value: formId },
            { prefix: prefix.submission, value: submissionId },
          ]),
          [GSI1PK]: pk({ prefix: prefix.form, value: formId }),
          [GSI1SK]: sk([{ prefix: prefix.submission, value: submissionId }]),
          ...Object.entries(c.req.valid("form")).reduce(
            (fields, [key, value]) => ({
              ...fields,
              [key]: c.get("attributeValue")(value),
            }),
            {},
          ),
        },
      }),
    );

    return c.json({ submissionId }, { status: 201 });
  },
);
