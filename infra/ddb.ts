import { gsi1, PK, SK } from "@cactus/core/constants";

export const table = new sst.aws.Dynamo("Table", {
  fields: {
    [PK]: "string",
    [SK]: "string",
    [gsi1.pk]: "string",
    [gsi1.sk]: "string",
  },
  primaryIndex: { hashKey: PK, rangeKey: SK },
  globalIndexes: {
    [gsi1.name]: {
      hashKey: gsi1.pk,
      rangeKey: gsi1.sk,
    },
  },
  stream: "new-image",
});
