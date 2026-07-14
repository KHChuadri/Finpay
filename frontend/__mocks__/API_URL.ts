// Jest mock for src/constants/API_URL.ts. The real module reads
// import.meta.env.VITE_BACKEND_URL, which ts-jest (CommonJS) can't compile.
// Tests only need a stable base URL — mirror the real default.
export const API_URL = 'http://localhost:3000';
