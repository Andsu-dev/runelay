import { handleRequest } from "./broker";
import type { BrokerEnv } from "./providers";

export default {
  fetch: (request: Request, env: BrokerEnv) => handleRequest(request, env),
};
