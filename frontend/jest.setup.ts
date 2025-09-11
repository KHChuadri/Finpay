import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'node:util';

globalThis.IS_REACT_ACT_ENVIRONMENT = true; // act environment

// Polyfills (guarded)
if (typeof global.TextEncoder === 'undefined') {
  Object.defineProperty(global, 'TextEncoder', { value: TextEncoder });
}
if (typeof global.TextDecoder === 'undefined') {
  Object.defineProperty(global, 'TextDecoder', { value: TextDecoder });
}

// Stub URL.createObjectURL for image previews
Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:jest-mock'),
});
