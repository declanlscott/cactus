import { Body, Html, Link, Preview, Text } from "jsx-email";

export type LoginTemplateProps = {
  magicLink: URL;
};
export function LoginTemplate(props: LoginTemplateProps) {
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
