import type { GoogleFetch } from "@/modules/google/types/google.types";
import { guardedFetch } from "@/modules/sources/utils/guarded-fetch";

export const googleTransport: { fetch: GoogleFetch } = { fetch: guardedFetch };

export const googleFetch: GoogleFetch = (input, init) => googleTransport.fetch(input, init);
