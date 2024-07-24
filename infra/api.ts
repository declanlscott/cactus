import { table } from "./ddb";
import { jwtSecret } from "./secrets";
import { email } from "./ses";

export const api = new sst.aws.Function("Api", {
  handler: "packages/functions/src/api/index.handler",
  url: true,
  link: [table, jwtSecret, email],
  permissions: $dev
    ? [
        {
          actions: ["ses:SendEmail"],
          resources: [
            $interpolate`arn:aws:ses:${aws.getRegionOutput().name}:${aws.getCallerIdentityOutput().accountId}:identity/*`,
          ],
        },
      ]
    : [],
});
