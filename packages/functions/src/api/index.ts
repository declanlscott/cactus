import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BadRequestError, HttpError } from "@cactus/core/errors";
import * as R from "remeda";
import { v7 } from "uuid";

import forms from "./routes/forms";
import sites from "./routes/sites";
import submissions from "./routes/submissions";

import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import type { Primitive } from "@cactus/core/schemas";

declare module "hono" {
  interface ContextVariableMap {
    ddb: DynamoDBClient;
    attributeValue: (value: Primitive) => {
      [key in keyof AttributeValue]: Primitive;
    };
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

    c.set("attributeValue", (value) => {
      if (R.isString(value)) return { S: value };
      if (R.isNumber(value)) return { N: value };
      if (R.isBoolean(value)) return { BOOL: value };
      if (R.isNullish(value)) return { NULL: true };
      if (R.isPlainObject(value)) return { M: value };
      if (R.isArray(value) && R.pipe(value, R.forEach(R.isString)))
        return { SS: value };
      if (R.isArray(value) && R.pipe(value, R.forEach(R.isNumber)))
        return { NS: value };
      if (R.isArray(value)) return { L: value };

      throw new BadRequestError(`Unknown value type: ${value}`);
    });

    await next();
  })
  .route("/sites", sites)
  .route("/forms", forms)
  .route("/submissions", submissions)
  .onError((e, c) => {
    console.error(e);

    if (e instanceof HTTPException) return e.getResponse();
    if (e instanceof HttpError)
      return c.json({ message: e.message }, { status: e.statusCode });

    return c.json({ message: e.message }, { status: 500 });
  });

export const handler = handle(api);
