sst.Linkable.wrap(tls.PrivateKey, ({ privateKeyPem }) => ({
  properties: { privateKeyPem },
}));

export * from "./api";
export * from "./ddb";
export * from "./secrets";
export * from "./ses";
