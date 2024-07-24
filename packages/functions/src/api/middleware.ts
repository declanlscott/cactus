import { jwt } from "hono/jwt";
import { jwtAlgorithm } from "@cactus/core/constants";
import { Resource } from "sst";

export const authorization = jwt({
  secret: Resource.JwtSecret.privateKeyPem,
  alg: jwtAlgorithm.hono,
  cookie: "jwt",
});
