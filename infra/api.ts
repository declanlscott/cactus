import { table } from "./ddb";

export const api = new sst.aws.Function("Api", {
  handler: "packages/functions/src/api/index.handler",
  url: true,
  link: [table],
});
