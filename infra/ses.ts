import { sender } from "./secrets";

export const email = new sst.aws.Email("Email", {
  sender: sender.value,
});
