// Backend base URL. Set VITE_BACKEND_URL in the frontend env; falls back to the
// local dev backend so `npm run dev` works out of the box.
export const API_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";
