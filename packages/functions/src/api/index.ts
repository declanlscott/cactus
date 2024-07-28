import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { HttpError } from "@cactus/core/errors";
import { v7 } from "uuid";
import { isValiError } from "valibot";

import auth from "./routes/auth";
import forms from "./routes/forms";
import sites from "./routes/sites";
import submissions from "./routes/submissions";

import type { Form } from "@cactus/core/schemas";

declare module "hono" {
  interface ContextVariableMap {
    jwtPayload: {
      sub: string;
      exp: string;
    };
    ddb: {
      client: DynamoDBClient;
      marshall: (
        data: Parameters<typeof marshall>[0],
      ) => ReturnType<typeof marshall>;
      unmarshall: (
        data: Parameters<typeof unmarshall>[0],
      ) => ReturnType<typeof unmarshall>;
    };
    ses: {
      client: SESv2Client;
    };
    form: Form;
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
    c.set("ddb", {
      client: new DynamoDBClient(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      marshall: (data) => marshall(data, { convertTopLevelContainer: true }),
      unmarshall: (data) =>
        unmarshall(data, { convertWithoutMapWrapper: true }),
    });
    c.set("ses", { client: new SESv2Client() });

    await next();
  })
  .route("/auth", auth)
  .route("/sites", sites)
  .route("/forms", forms)
  .route("/submissions", submissions)
  .onError((e, c) => {
    console.error(e);

    if (e instanceof HTTPException) return e.getResponse();
    if (e instanceof HttpError)
      return c.json({ message: e.message }, { status: e.statusCode });
    if (isValiError(e)) return c.json({ message: e.message }, { status: 400 });

    return c.json({ message: e.message }, { status: 500 });
  });

export const handler = handle(api);
