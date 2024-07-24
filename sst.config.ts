/// <reference path="./.sst/platform/config.d.ts" />

const AWS_ORG_NAME = process.env.AWS_ORG_NAME;
if (!AWS_ORG_NAME) throw new Error("AWS_ORG_NAME is not set");

export default $config({
  app(input) {
    return {
      name: "cactus",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile:
            input?.stage === "production"
              ? `${AWS_ORG_NAME}-production`
              : `${AWS_ORG_NAME}-dev`,
          region: "us-east-2",
        },
        cloudflare: true,
        tls: true,
      },
    };
  },
  async run() {
    const infra = await import("./infra");

    return {
      api: infra.api.url,
    };
  },
});
