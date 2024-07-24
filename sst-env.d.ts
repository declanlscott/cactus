/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    Api: {
      name: string
      type: "sst.aws.Function"
      url: string
    }
    Email: {
      sender: string
      type: "sst.aws.Email"
    }
    JwtSecret: {
      privateKeyPem: string
      type: "tls.index/privateKey.PrivateKey"
    }
    Sender: {
      type: "sst.sst.Secret"
      value: string
    }
    Table: {
      name: string
      type: "sst.aws.Dynamo"
    }
  }
}
export {}
