import { gsi, PK, prefix, SK } from "@cactus/core/constants";

export const table = new sst.aws.Dynamo("Table", {
  fields: {
    [PK]: "string",
    [SK]: "string",
    [gsi.one.pk]: "string",
    [gsi.one.sk]: "string",
  },
  primaryIndex: { hashKey: PK, rangeKey: SK },
  globalIndexes: {
    [gsi.one.name]: {
      hashKey: gsi.one.pk,
      rangeKey: gsi.one.sk,
    },
  },
  stream: "new-image",
});

table.subscribe("sender.handler", {
  filters: [
    {
      dynamodb: {
        NewImage: {
          submissionId: {
            S: [{ exists: true }],
          },
          emailSent: {
            BOOL: [false],
          },
        },
      },
    },
  ],
});
