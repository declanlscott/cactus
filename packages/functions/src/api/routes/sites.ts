import { Hono } from "hono";
import { validator } from "hono/validator";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PK, prefix, SK } from "@cactus/core/constants";
import { BadRequestError } from "@cactus/core/errors";
import { PostSiteJson, vValidator } from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { Resource } from "sst";

import forms from "./forms";

export default new Hono()
  .post(
    "/",
    validator(
      "json",
      vValidator(PostSiteJson, {
        Error: BadRequestError,
        message: "Invalid request body",
      }),
    ),
    async (c) => {
      const siteId = c.get("requestId");

      c.get("ddb").send(
        new PutItemCommand({
          TableName: Resource.Table.name,
          Item: {
            [PK]: pk({ prefix: prefix.site, value: siteId }),
            [SK]: sk([{ prefix: prefix.site, value: siteId }]),
            name: { S: c.req.valid("json").name },
            createdAt: { S: new Date().toISOString() },
          },
        }),
      );

      return c.json({ siteId }, { status: 201 });
    },
  )
  .route("/:siteId/forms", forms);
