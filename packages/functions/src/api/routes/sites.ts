import { Hono } from "hono";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PK, prefix, SK } from "@cactus/core/constants";
import { JwtPayload, SiteName } from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { vValidator } from "@hono/valibot-validator";
import { Resource } from "sst";
import * as v from "valibot";

import { authorization } from "../middleware";

import type { AttributeValue } from "@aws-sdk/client-dynamodb";

export default new Hono()
  .use(authorization)
  .post("/", vValidator("json", v.object({ name: SiteName })), async (c) => {
    const { sub: email } = v.parse(JwtPayload, c.get("jwtPayload"));

    const { client, marshall } = c.get("ddb");

    const siteId = c.get("requestId");

    await client.send(
      new PutItemCommand({
        TableName: Resource.Table.name,
        Item: {
          [PK]: marshall(pk({ prefix: prefix.email, value: email })),
          [SK]: marshall(sk([{ prefix: prefix.site, value: siteId }])),
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

    return c.json({ siteId }, { status: 201 });
  });
