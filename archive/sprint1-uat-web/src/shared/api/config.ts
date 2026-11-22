const configured = import.meta.env.VITE_API_BASE as string | undefined;

/** API prefix including `/api/v1`. Empty string uses same-origin (Vite proxy in dev). */
export const API_BASE = configured?.replace(/\/$/, '') ?? '/api/v1';
