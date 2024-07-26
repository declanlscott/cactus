import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { gsi, KEY_DELIMITER, PK, prefix, SK } from "@cactus/core/constants";
import { render, SubmissionTemplate } from "@cactus/core/emails";
import { Form, SiteName, Uuid } from "@cactus/core/schemas";
import { sk } from "@cactus/core/utils";
import { DynamoDBStreamHandler } from "aws-lambda";
import { Resource } from "sst";
import * as v from "valibot";

const ddb = new DynamoDBClient();
const ses = new SESv2Client();

export const handler: DynamoDBStreamHandler = async (event) => {
  const result = v.safeParse(
    v.array(
      v.looseObject({
        [PK]: v.string(),
        [SK]: v.string(),
        [gsi.one.pk]: v.string(),
        [gsi.one.sk]: v.string(),
        createdAt: v.pipe(v.string(), v.isoTimestamp()),
        emailSent: v.boolean(),
        submissionId: Uuid,
      }),
    ),
    event.Records.map((record) => record.dynamodb?.NewImage)
      .filter(Boolean)
      .map((newImage) =>
        unmarshall(newImage as Record<string, AttributeValue>, {
          convertWithoutMapWrapper: true,
        }),
      ),
  );

  if (!result.success) return;

  const data = await Promise.allSettled(
    result.output.map(
      async ({
        pk: partitionKey,
        sk: sortKey,
        gsi1pk,
        gsi1sk,
        createdAt,
        emailSent,
        submissionId,
        ...submission
      }) => {
        const skSegments = sortKey.split(KEY_DELIMITER);
        const siteId = skSegments.at(1);
        const formId = skSegments.at(3);
        if (!formId || !siteId) throw new Error(`Invalid ${[SK]}: ${sortKey}`);

        const [{ Item: siteItem }, { Item: formItem }] = await Promise.all([
          ddb.send(
            new GetItemCommand({
              TableName: Resource.Table.name,
              Key: {
                [PK]: marshall(partitionKey),
                [SK]: marshall(sk([{ prefix: prefix.site, value: siteId }])),
              },
            }),
          ),
          ddb.send(
            new GetItemCommand({
              TableName: Resource.Table.name,
              Key: {
                [PK]: marshall(partitionKey),
                [SK]: marshall(
                  sk([
                    { prefix: prefix.site, value: siteId },
                    { prefix: prefix.form, value: formId },
                  ]),
                ),
              },
            }),
          ),
        ]);
        if (!siteItem) throw new Error(`Site not found: ${siteId}`);
        if (!formItem) throw new Error(`Form not found: ${formId}`);

        const site = v.parse(
          v.looseObject({ name: SiteName }),
          Object.entries(siteItem).reduce(
            (site, [key, value]) => ({
              ...site,
              [key]: unmarshall(value),
            }),
            {} as Record<string, unknown>,
          ),
        );

        const form = await v
          .parseAsync(
            Form,
            Object.entries(formItem).reduce(
              (form, [key, value]) => {
                const unmarshalled = unmarshall(value);

                form[key] =
                  unmarshalled instanceof Set
                    ? [...unmarshalled]
                    : unmarshalled;

                return form;
              },
              {} as Record<string, unknown>,
            ),
          )
          .then((form) => {
            if (!form.emails) throw new Error(`Emails not found: ${formId}`);

            return {
              name: form.name,
              emails: form.emails.filter(Boolean),
            };
          });

        return {
          submission,
          form,
          site: {
            name: site.name,
          },
        };
      },
    ),
  );

  data
    .filter((result) => result.status === "rejected")
    .forEach(({ reason }) => console.error(reason));

  const outputs = await Promise.allSettled(
    data
      .filter((result) => result.status === "fulfilled")
      .map(async ({ value }) =>
        ses.send(
          new SendEmailCommand({
            FromEmailAddress: `cactus@${Resource.Sender.value}`,
            Destination: {
              ToAddresses: value.form.emails,
            },
            Content: {
              Simple: {
                Subject: {
                  Data: `New submission from ${value.site.name}: ${value.form.name}`,
                },
                Body: {
                  Html: {
                    Charset: "UTF-8",
                    Data: await render(
                      <SubmissionTemplate
                        siteName={value.site.name}
                        formName={value.form.name}
                        submission={value.submission}
                      />,
                    ),
                  },
                },
              },
            },
          }),
        ),
      ),
  );

  outputs
    .filter((result) => result.status === "rejected")
    .forEach(({ reason }) => console.error(reason));
};
