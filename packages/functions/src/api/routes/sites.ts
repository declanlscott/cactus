import { Hono } from "hono";
import { validator as honoValidator } from "hono/validator";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PK, prefix, SK } from "@cactus/core/constants";
import { BadRequestError } from "@cactus/core/errors";
import { NewSite, validator } from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { Resource } from "sst";

export default new Hono().post(
  "/",
  honoValidator(
    "json",
    validator(NewSite, {
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
          [PK]: { S: pk({ prefix: prefix.site, value: siteId }) },
          [SK]: { S: sk([{ prefix: prefix.site, value: siteId }]) },
          name: { S: c.req.valid("json").name },
          createdAt: { S: new Date().toISOString() },
        },
      }),
    );

    return c.json({ siteId }, { status: 201 });
  },
);
