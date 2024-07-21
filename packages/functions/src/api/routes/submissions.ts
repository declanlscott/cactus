import { Hono } from "hono";
import { validator as honoValidator } from "hono/validator";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { GSI1PK, GSI1SK, PK, prefix, SK } from "@cactus/core/constants";
import { BadRequestError } from "@cactus/core/errors";
import {
  NewSubmissionFormData,
  NewSubmissionQueryParams,
  validator,
} from "@cactus/core/schemas";
import { pk, sk } from "@cactus/core/utils";
import { Resource } from "sst";

export default new Hono().post(
  "/",
  honoValidator(
    "query",
    validator(NewSubmissionQueryParams, {
      Error: BadRequestError,
      message: "Invalid query parameters",
    }),
  ),
  honoValidator(
    "form",
    validator(NewSubmissionFormData, {
      Error: BadRequestError,
      message: "Invalid form data",
    }),
  ),
  async (c) => {
    const { siteId, formId } = c.req.valid("query");
    const submissionId = c.get("requestId");

    c.get("ddb").send(
      new PutItemCommand({
        TableName: Resource.Table.name,
        Item: {
          [PK]: { S: pk({ prefix: prefix.site, value: siteId }) },
          [SK]: {
            S: sk([
              { prefix: prefix.form, value: formId },
              { prefix: prefix.submission, value: submissionId },
            ]),
          },
          [GSI1PK]: { S: pk({ prefix: prefix.form, value: formId }) },
          [GSI1SK]: {
            S: sk([{ prefix: prefix.submission, value: submissionId }]),
          },
          ...Object.entries(c.req.valid("form")).reduce(
            (fields, [key, value]) => ({
              ...fields,
              [key]: c.get("attributeValue")(value),
            }),
            {},
          ),
        },
      }),
    );

    return c.json({ submissionId }, { status: 201 });
  },
);
