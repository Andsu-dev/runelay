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
