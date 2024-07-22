import { Hono } from "hono";
import { validator } from "hono/validator";
import { PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { PK, prefix, SK } from "@cactus/core/constants";
import { BadRequestError } from "@cactus/core/errors";
import {
  PatchFormJson,
  PatchFormPathParams,
  PostFormJson,
  PostFormPathParams,
  vValidator,
} from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { Resource } from "sst";

import submissions from "./submissions";

export default new Hono()
  .post(
    "/",
    validator(
      "param",
      vValidator(PostFormPathParams, {
        Error: BadRequestError,
        message: "Invalid path parameters",
      }),
    ),
    validator(
      "json",
      vValidator(PostFormJson, {
        Error: BadRequestError,
        message: "Invalid request body",
      }),
    ),
    async (c) => {
      const { siteId } = c.req.valid("param");
      const formId = c.get("requestId");
      const { name, schema } = c.req.valid("json");

      c.get("ddb").send(
        new PutItemCommand({
          TableName: Resource.Table.name,
          Item: {
            [PK]: pk({ prefix: prefix.site, value: siteId }),
            [SK]: sk([{ prefix: prefix.form, value: formId }]),
            name: { S: name },
            schema: c.get("attributeValue")(schema),
            createdAt: { S: new Date().toISOString() },
          },
        }),
      );

      return c.json({ formId }, { status: 201 });
    },
  )
  .patch(
    "/:formId",
    validator(
      "param",
      vValidator(PatchFormPathParams, {
        Error: BadRequestError,
        message: "Invalid path parameters",
      }),
    ),
    validator(
      "json",
      vValidator(PatchFormJson, {
        Error: BadRequestError,
        message: "Invalid request body",
      }),
    ),
    async (c) => {
      const { siteId, formId } = c.req.valid("param");
      const { name, schema } = c.req.valid("json");

      c.get("ddb").send(
        new UpdateItemCommand({
          TableName: Resource.Table.name,
          Key: {
            [PK]: pk({ prefix: prefix.site, value: siteId }),
            [SK]: sk([{ prefix: prefix.form, value: formId }]),
          },
          UpdateExpression: name
            ? "SET #name = :name AND SET #schema = :schema"
            : "SET #schema = :schema",
          ExpressionAttributeNames: {
            "#name": "name",
            "#schema": "schema",
          },
          ExpressionAttributeValues: name
            ? {
                ":name": { S: name },
                ":schema": c.get("attributeValue")(schema),
              }
            : {
                ":schema": c.get("attributeValue")(schema),
              },
        }),
      );
    },
  )
  .route("/:formId/submissions", submissions);
