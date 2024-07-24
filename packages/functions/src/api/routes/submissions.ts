import { Hono } from "hono";
import { validator } from "hono/validator";
import {
  AttributeValue,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { gsi1, PK, prefix, SK } from "@cactus/core/constants";
import { NotFoundError } from "@cactus/core/errors";
import { ajvValidator, Form, Uuid } from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { vValidator } from "@hono/valibot-validator";
import { Resource } from "sst";
import * as v from "valibot";

import { authorization } from "../middleware";

export default new Hono()
  .post(
    "/",
    vValidator("query", v.object({ siteId: Uuid, formId: Uuid })),
    async (c, next) => {
      const { client, marshall, unmarshall } = c.get("ddb");

      const { siteId, formId } = c.req.valid("query");

      const output = await client.send(
        new QueryCommand({
          TableName: Resource.Table.name,
          IndexName: gsi1.name,
          KeyConditionExpression: "#pk = :pk AND #sk = :sk",
          ExpressionAttributeNames: {
            "#pk": gsi1.pk,
            "#sk": gsi1.sk,
          },
          ExpressionAttributeValues: {
            ":pk": marshall(pk({ prefix: prefix.site, value: siteId })),
            ":sk": marshall(sk([{ prefix: prefix.form, value: formId }])),
          },
        }),
      );
      const item = output.Items?.at(0);
      if (!item) throw new NotFoundError("Form not found");

      c.set(
        "form",
        await v.parseAsync(
          Form,
          Object.entries(item).reduce(
            (form, [key, value]) => {
              const unmarshalled = unmarshall(value);

              return {
                ...form,
                [key]:
                  unmarshalled instanceof Set
                    ? [...unmarshalled]
                    : unmarshalled,
              };
            },
            {} as Record<string, unknown>,
          ),
        ),
      );

      await next();
    },
    validator("form", (data, c) => {
      const { schema } = c.get("form");
      if (!schema) return data;

      const validate = ajvValidator(schema);
      return validate(data);
    }),
    async (c) => {
      const { siteId, formId } = c.req.valid("query");
      const submissionId = c.get("requestId");

      const { client, marshall } = c.get("ddb");

      await client.send(
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
            [gsi1.pk]: marshall(pk({ prefix: prefix.site, value: siteId })),
            [gsi1.sk]: marshall(
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
  )
  .get(
    "/",
    authorization,
    vValidator("query", v.object({ siteId: Uuid, formId: Uuid })),
    async (c) => {
      const { sub: email } = c.get("jwtPayload");
      const { siteId, formId } = c.req.valid("query");

      const { client, marshall, unmarshall } = c.get("ddb");

      const { Items } = await client.send(
        new QueryCommand({
          TableName: Resource.Table.name,
          KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :sk)",
          ExpressionAttributeNames: {
            "#pk": PK,
            "#sk": SK,
          },
          ExpressionAttributeValues: {
            ":pk": marshall(pk({ prefix: prefix.email, value: email })),
            ":sk": marshall(
              `${sk([
                { prefix: prefix.site, value: siteId },
                { prefix: prefix.form, value: formId },
              ])}${prefix.submission}`,
            ),
          },
        }),
      );

      const submissions = Items?.map((Item) =>
        Object.entries(Item).reduce(
          (form, [key, value]) => {
            const unmarshalled = unmarshall(value);

            form[key] =
              unmarshalled instanceof Set ? [...unmarshalled] : unmarshalled;

            return form;
          },
          {} as Record<string, unknown>,
        ),
      );

      return c.json({ submissions });
    },
  );
