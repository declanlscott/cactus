import { Hono } from "hono";
import { jwt } from "hono/jwt";
import {
  AttributeValue,
  PutItemCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
  GSI1PK,
  GSI1SK,
  jwtAlgorithm,
  PK,
  prefix,
  SK,
} from "@cactus/core/constants";
import { FormEmails, FormName, FormSchema, Uuid } from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { vValidator } from "@hono/valibot-validator";
import { Resource } from "sst";
import * as v from "valibot";

export default new Hono()
  .use(
    jwt({
      secret: Resource.JwtSecret.privateKeyPem,
      alg: jwtAlgorithm.hono,
      cookie: "jwt",
    }),
  )
  .post(
    "/",
    vValidator("query", v.object({ siteId: Uuid })),
    vValidator(
      "json",
      v.objectAsync({
        name: FormName,
        schema: FormSchema,
        emails: v.optional(FormEmails),
      }),
    ),
    async (c) => {
      const { sub: email } = c.get("jwtPayload");

      const { siteId } = c.req.valid("query");
      const formId = c.get("requestId");

      const { client, marshall } = c.get("ddb");

      client.send(
        new PutItemCommand({
          TableName: Resource.Table.name,
          Item: {
            [PK]: marshall(pk({ prefix: prefix.email, value: email })),
            [SK]: marshall(
              sk([
                { prefix: prefix.site, value: siteId },
                { prefix: prefix.form, value: formId },
              ]),
            ),
            [GSI1PK]: marshall(pk({ prefix: prefix.site, value: siteId })),
            [GSI1SK]: marshall(sk([{ prefix: prefix.form, value: formId }])),
            ...Object.entries(c.req.valid("json")).reduce(
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

      return c.json({ formId }, { status: 201 });
    },
  )
  .patch(
    "/:formId",
    vValidator("param", v.object({ formId: Uuid })),
    vValidator("query", v.object({ siteId: Uuid })),
    vValidator(
      "json",
      v.pipeAsync(
        v.partialAsync(
          v.objectAsync({
            name: FormName,
            schema: FormSchema,
            emails: FormEmails,
          }),
        ),
        v.checkAsync(
          (input) => Object.values(input).some((value) => value !== undefined),
          "At least one field is required",
        ),
      ),
    ),
    async (c) => {
      const { sub: email } = c.get("jwtPayload");

      const { client, marshall } = c.get("ddb");

      const { siteId } = c.req.valid("query");
      const { formId } = c.req.valid("param");

      client.send(
        new UpdateItemCommand({
          TableName: Resource.Table.name,
          Key: {
            [PK]: marshall(pk({ prefix: prefix.email, value: email })),
            [SK]: marshall(
              sk([
                { prefix: prefix.site, value: siteId },
                { prefix: prefix.form, value: formId },
              ]),
            ),
            [GSI1PK]: marshall(pk({ prefix: prefix.site, value: siteId })),
            [GSI1SK]: marshall(sk([{ prefix: prefix.form, value: formId }])),
          },
          ...Object.entries(c.req.valid("json")).reduce(
            (input, [key, value]) => {
              if (value) {
                const set = `SET #${key} = :${key}`;
                input.UpdateExpression = input.UpdateExpression
                  ? input.UpdateExpression.concat(` AND ${set}`)
                  : set;

                input.ExpressionAttributeNames[`#${key}`] = key;
                input.ExpressionAttributeValues[`:${key}`] = marshall(value);
              }

              return input;
            },
            {} as Required<
              Pick<
                UpdateItemCommandInput,
                | "UpdateExpression"
                | "ExpressionAttributeNames"
                | "ExpressionAttributeValues"
              >
            >,
          ),
        }),
      );
    },
  );
