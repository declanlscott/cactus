import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { HttpError } from "@cactus/core/errors";
import { v7 } from "uuid";

import sites from "./routes/sites";

import type { JsonSchema } from "@cactus/core/schemas";

declare module "hono" {
  interface ContextVariableMap {
    ddb: {
      client: DynamoDBClient;
      marshall: typeof marshall;
      unmarshall: typeof unmarshall;
    };
    schema?: JsonSchema;
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
    c.set("ddb", { client: new DynamoDBClient(), marshall, unmarshall });

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
