import { Hono } from "hono";
import { validator } from "hono/validator";
import {
  AttributeValue,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { GSI1PK, GSI1SK, PK, prefix, SK } from "@cactus/core/constants";
import { NotFoundError } from "@cactus/core/errors";
import { ajvValidator, Form, Uuid } from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { vValidator } from "@hono/valibot-validator";
import { Resource } from "sst";
import * as v from "valibot";

export default new Hono().post(
  "/",
  vValidator("query", v.object({ siteId: Uuid, formId: Uuid })),
  async (c, next) => {
    const { client, marshall, unmarshall } = c.get("ddb");

    const { siteId, formId } = c.req.valid("query");

    const output = await client.send(
      new GetItemCommand({
        TableName: Resource.Table.name,
        Key: {
          [GSI1PK]: marshall(pk({ prefix: prefix.site, value: siteId })),
          [GSI1SK]: marshall(sk([{ prefix: prefix.form, value: formId }])),
        },
      }),
    );
    if (!output.Item) throw new NotFoundError("Form not found");

    c.set("form", await v.parseAsync(Form, unmarshall(output.Item)));

    await next();
  },
  validator("form", (data, c) => {
    const { schema } = c.get("form");
    if (!schema) return data;

    const validate = ajvValidator(schema);
    return validate(data);
  }),
  async (c) => {
    const { client, marshall } = c.get("ddb");

    const { siteId, formId } = c.req.valid("query");
    const submissionId = c.get("requestId");

    client.send(
      new PutItemCommand({
        TableName: Resource.Table.name,
        Item: {
          [PK]: marshall(c.get("form").pk),
          [SK]: marshall(
            sk([
              { prefix: prefix.site, value: siteId },
              { prefix: prefix.form, value: formId },
              { prefix: prefix.submission, value: submissionId },
            ]),
          ),
          [GSI1PK]: marshall(pk({ prefix: prefix.site, value: siteId })),
          [GSI1SK]: marshall(
            sk([
              { prefix: prefix.form, value: formId },
              { prefix: prefix.submission, value: submissionId },
            ]),
          ),
          ...Object.entries(c.req.valid("form")).reduce(
            (fields, [key, value]) => ({
              ...fields,
              [key]: marshall(value),
            }),
            {} as Record<string, AttributeValue>,
          ),
          createdAt: marshall(new Date().toISOString()),
        },
      }),
    );

    return c.json({ submissionId }, { status: 201 });
  },
);
