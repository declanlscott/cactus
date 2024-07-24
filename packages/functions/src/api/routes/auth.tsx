import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import { jwtAlgorithm } from "@cactus/core/constants";
import { LoginTemplate, render } from "@cactus/core/email";
import { JwtPayload } from "@cactus/core/schemas";
import { vValidator } from "@hono/valibot-validator";
import { Resource } from "sst";
import * as v from "valibot";

import { authorization } from "../middleware";

export default new Hono()
  .get(
    "/authorize",
    vValidator("query", v.object({ email: v.pipe(v.string(), v.email()) })),
    async (c) => {
      const { email } = c.req.valid("query");

      const payload = {
        sub: email,
        exp: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes
      } satisfies JwtPayload;

      const jwt = await sign(
        payload,
        Resource.JwtSecret.privateKeyPem,
        jwtAlgorithm.hono,
      );

      const magicLink = new URL(new URL(c.req.url).origin);
      magicLink.pathname = "/auth/callback";
      magicLink.searchParams.set("jwt", jwt);

      c.get("ses").client.send(
        new SendEmailCommand({
          FromEmailAddress: Resource.Email.sender,
          Destination: {
            ToAddresses: [email],
          },
          Content: {
            Simple: {
              Subject: {
                Data: "Cactus Magic Link",
              },
              Body: {
                Html: {
                  Charset: "UTF-8",
                  Data: await render(<LoginTemplate magicLink={magicLink} />),
                },
              },
            },
          },
        }),
      );

      return c.json({ message: "Check your email for a magic link" });
    },
  )
  .get(
    "/callback",
    vValidator("query", v.object({ jwt: v.string() })),
    async (c) => {
      const { sub } = await verify(
        c.req.valid("query").jwt,
        Resource.JwtSecret.privateKeyPem,
        jwtAlgorithm.hono,
      ).then((payload) => v.parse(JwtPayload, payload));

      const payload = {
        sub,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      } satisfies JwtPayload;

      const jwt = await sign(
        payload,
        Resource.JwtSecret.privateKeyPem,
        jwtAlgorithm.hono,
      );

      setCookie(c, "jwt", jwt, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      return c.json({ payload, jwt });
    },
  )
  .post("/logout", authorization, async (c) => {
    setCookie(c, "jwt", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return c.body(null, { status: 204 });
  });
