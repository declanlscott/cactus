import { GSI1PK, GSI1SK, PK, SK } from "@cactus/core/constants";

export const table = new sst.aws.Dynamo("Table", {
  fields: {
    [PK]: "string",
    [SK]: "string",
    [GSI1PK]: "string",
    [GSI1SK]: "string",
  },
  primaryIndex: { hashKey: PK, rangeKey: SK },
  globalIndexes: {
    Gsi1: {
      hashKey: GSI1PK,
      rangeKey: GSI1SK,
    },
  },
  stream: "new-image",
});
