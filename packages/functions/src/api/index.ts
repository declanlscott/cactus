import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { HttpError } from "@cactus/core/errors";
import * as R from "remeda";
import { v7 } from "uuid";

import sites from "./routes/sites";

import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import type { JSONSchemaType } from "@cactus/core/schemas";

declare module "hono" {
  interface ContextVariableMap {
    ddb: DynamoDBClient;
    attributeValue: (value: unknown) => AttributeValue;
    schema?: JSONSchemaType<unknown>;
  }
}

const api = new Hono()
  .use(logger())
  .use(requestId({ generator: () => v7() }))
  .use(async (c, next) => {
    console.log("Request ID:", c.get("requestId"));

    await next();
  })
  .use(cors())
  .use(async (c, next) => {
    c.set("ddb", new DynamoDBClient());

    c.set("attributeValue", (value: unknown) => {
      if (R.isString(value)) return { S: value };
      if (R.isNumber(value)) return { N: value.toString() };
      if (value instanceof Uint8Array) return { B: value };
      if (R.isArray(value) && R.pipe(value, R.forEach(R.isString)))
        return { SS: value.map(String) };
      if (R.isArray(value) && R.pipe(value, R.forEach(R.isNumber)))
        return { NS: value.map(String) };
      if (
        R.isArray(value) &&
        R.pipe(
          value,
          R.forEach((v) => v instanceof Uint8Array),
        )
      )
        return { BS: value as Array<Uint8Array> };
      if (R.isPlainObject(value))
        return { M: value as Record<string, AttributeValue> };
      if (R.isArray(value)) return { L: value as Array<AttributeValue> };
      if (R.isNullish(value)) return { NULL: true };
      if (R.isBoolean(value)) return { BOOL: value };
      return { $unknown: value as [string, any] };
    });

    await next();
  })
  .route("/sites", sites)
  .onError((e, c) => {
    console.error(e);

    if (e instanceof HTTPException) return e.getResponse();
    if (e instanceof HttpError)
      return c.json({ message: e.message }, { status: e.statusCode });

    return c.json({ message: e.message }, { status: 500 });
  });

export const handler = handle(api);
