export interface VersionView {
  current: string;
  latest: string | null;
  notes: string | null;
  releaseUrl: string | null;
  updateAvailable: boolean;
  canUpdate: boolean;
}
