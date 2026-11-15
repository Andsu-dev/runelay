import { LOCAL_HOSTNAMES, TAILNET_DOMAIN_SUFFIX, TAILNET_IP } from "@/modules/settings/constants/settings.constants";

export const isAllowedServerUrl = (value: string) => {
  if (!URL.canParse(value)) return false;
  const { protocol, hostname } = new URL(value);
  if (protocol === "https:") return true;
  if (protocol !== "http:") return false;
  return LOCAL_HOSTNAMES.includes(hostname) || hostname.endsWith(TAILNET_DOMAIN_SUFFIX) || TAILNET_IP.test(hostname);
};
