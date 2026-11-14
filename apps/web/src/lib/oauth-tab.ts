import { queryClient } from "./query-client";
import { toast } from "./toast";

interface OAuthDone {
  name: string;
  error?: string;
}

const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("runelay-oauth");

channel?.addEventListener("message", ({ data }: MessageEvent<OAuthDone>) => {
  queryClient.invalidateQueries();
  if (data.error) toast(`O login de ${data.name} falhou: ${data.error}`, "error");
  else toast(`${data.name} conectada.`);
});

export const openPendingTab = () => {
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  return tab;
};

export const sendTab = (tab: Window | null, url: string | null) => {
  if (!url) {
    tab?.close();
    return false;
  }
  if (tab) tab.location.href = url;
  else window.location.assign(url);
  return true;
};

export const finishOAuthTab = (done: OAuthDone) => {
  channel?.postMessage(done);
  window.close();
};
