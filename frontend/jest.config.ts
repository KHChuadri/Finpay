export default {
  preset: 'ts-jest',
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|svg)$': '<rootDir>/__mocks__/fileMock.ts',
    // API_URL reads import.meta.env, which ts-jest (CommonJS) can't compile —
    // map it to a mock. Must precede the generic '@/' rule.
    '^@/constants/API_URL$': '<rootDir>/__mocks__/API_URL.ts',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
};