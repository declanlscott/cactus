import { table } from "./ddb";
import { jwtSecret } from "./secrets";

export const api = new sst.aws.Function("Api", {
  handler: "packages/functions/src/api/index.handler",
  url: true,
  link: [table, jwtSecret],
});
