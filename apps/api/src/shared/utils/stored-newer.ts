export const isStoredNewer = (stored: string | undefined, sent: string | undefined) =>
  stored !== undefined && sent !== undefined && Date.parse(stored) > Date.parse(sent);
