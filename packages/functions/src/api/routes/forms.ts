import { Hono } from "hono";
import {
  AttributeValue,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { gsi, PK, prefix, SK } from "@cactus/core/constants";
import { NotFoundError } from "@cactus/core/errors";
import { FormEmails, FormName, FormSchema, Uuid } from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { vValidator } from "@hono/valibot-validator";
import { Resource } from "sst";
import * as v from "valibot";

import { authorization } from "../middleware";

export default new Hono()
  .use(authorization)
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

      await client.send(
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
            [gsi.one.pk]: marshall(pk({ prefix: prefix.site, value: siteId })),
            [gsi.one.sk]: marshall(
              sk([{ prefix: prefix.form, value: formId }]),
            ),
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
  .get("/", vValidator("query", v.object({ siteId: Uuid })), async (c) => {
    const { sub: email } = c.get("jwtPayload");

    const { siteId } = c.req.valid("query");

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
            `${sk([{ prefix: prefix.site, value: siteId }])}${prefix.form}`,
          ),
        },
      }),
    );

    const forms = Items?.map((Item) =>
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

    return c.json({ forms });
  })
  .get(
    "/:formId",
    vValidator("param", v.object({ formId: Uuid })),
    vValidator("query", v.object({ siteId: Uuid })),
    async (c) => {
      const { sub: email } = c.get("jwtPayload");

      const { formId } = c.req.valid("param");
      const { siteId } = c.req.valid("query");

      const { client, marshall, unmarshall } = c.get("ddb");

      const { Item } = await client.send(
        new GetItemCommand({
          TableName: Resource.Table.name,
          Key: {
            [PK]: marshall(pk({ prefix: prefix.email, value: email })),
            [SK]: marshall(
              sk([
                { prefix: prefix.site, value: siteId },
                { prefix: prefix.form, value: formId },
              ]),
            ),
          },
        }),
      );
      if (!Item) throw new NotFoundError("Form not found");

      const form = Object.entries(Item).reduce(
        (form, [key, value]) => {
          const unmarshalled = unmarshall(value);

          form[key] =
            unmarshalled instanceof Set ? [...unmarshalled] : unmarshalled;

          return form;
        },
        {} as Record<string, unknown>,
      );

      return c.json({ form });
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

      const { client, marshall, unmarshall } = c.get("ddb");

      const { siteId } = c.req.valid("query");
      const { formId } = c.req.valid("param");

      const { Attributes } = await client.send(
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
          },
          ...Object.entries(c.req.valid("json")).reduce(
            (input, [key, value]) => {
              if (value) {
                const keyName = `#${key}`;
                const valueName = `:${key}`;
                const action = `${keyName} = ${valueName}`;

                return {
                  UpdateExpression: input.UpdateExpression
                    ? input.UpdateExpression.concat(`, ${action}`)
                    : `SET ${action}`,
                  ExpressionAttributeNames: {
                    ...input.ExpressionAttributeNames,
                    [keyName]: key,
                  },
                  ExpressionAttributeValues: {
                    ...input.ExpressionAttributeValues,
                    [valueName]: marshall(value),
                  },
                };
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
          ReturnValues: "ALL_NEW",
        }),
      );

      if (!Attributes) throw new NotFoundError("Form not found");

      const form = Object.entries(Attributes).reduce(
        (form, [key, value]) => {
          const unmarshalled = unmarshall(value);

          form[key] =
            unmarshalled instanceof Set ? [...unmarshalled] : unmarshalled;

          return form;
        },
        {} as Record<string, unknown>,
      );

      return c.json({ form });
    },
  );
