import { jwt } from "hono/jwt";
import { Resource } from "sst";

export const authorization = jwt({
  secret: Resource.JwtSecret.value,
  alg: "RS256",
  cookie: "jwt",
});
