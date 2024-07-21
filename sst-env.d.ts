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
