import { getClient, getQueueFunctions } from "@/services/queue";
import { serve } from "inngest/express";

export const ingestRoute = serve({
  client: getClient(),
  functions: getQueueFunctions(),
});

export default ingestRoute;
