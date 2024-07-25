sst.Linkable.wrap(tls.PrivateKey, (privateKey) => ({
  properties: { value: privateKey.privateKeyPemPkcs8 },
}));

export * from "./api";
export * from "./ddb";
export * from "./secrets";
export * from "./ses";
