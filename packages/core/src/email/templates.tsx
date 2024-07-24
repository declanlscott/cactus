import { Body, Html, Link, Preview, Text } from "jsx-email";

export type MagicLinkTemplateProps = {
  magicLink: URL;
};
export function MagicLinkTemplate(props: MagicLinkTemplateProps) {
  return (
    <Html>
      <Preview>Login to Cactus with this magic link.</Preview>

      <Body>
        <Text>
          <Link href={props.magicLink.href}>👉 Click here to login 👈</Link>
        </Text>

        <Text>
          If you didn't request this, you can safely ignore this email.
        </Text>
      </Body>
    </Html>
  );
}
