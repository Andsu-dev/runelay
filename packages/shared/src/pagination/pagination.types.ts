export interface Page<T> {
  items: T[];
  total: number;
  nextCursor: number | null;
}
