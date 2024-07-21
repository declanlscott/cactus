import { Hono } from "hono";
import { validator as honoValidator } from "hono/validator";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PK, prefix, SK } from "@cactus/core/constants";
import { BadRequestError } from "@cactus/core/errors";
import { NewForm, validator } from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { Resource } from "sst";

export default new Hono().post(
  "/",
  honoValidator(
    "json",
    validator(NewForm, {
      Error: BadRequestError,
      message: "Invalid request body",
    }),
  ),
  async (c) => {
    const formId = c.get("requestId");
    const { siteId, name } = c.req.valid("json");

    c.get("ddb").send(
      new PutItemCommand({
        TableName: Resource.Table.name,
        Item: {
          [PK]: { S: pk({ prefix: prefix.site, value: siteId }) },
          [SK]: { S: sk([{ prefix: prefix.form, value: formId }]) },
          name: { S: name },
          createdAt: { S: new Date().toISOString() },
        },
      }),
    );

    return c.json({ formId }, { status: 201 });
  },
);
