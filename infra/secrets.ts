import { jwtAlgorithm } from "@cactus/core/constants";

export const sender = new sst.Secret("Sender");

export const jwtSecret = new tls.PrivateKey("JwtSecret", {
  algorithm: jwtAlgorithm.tls,
});
