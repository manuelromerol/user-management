import { defineConfig } from '@playwright/test';

// Get the environment keyword, default to 'dev'
const env = (process.env.ENV || 'dev').toLowerCase();

// Map keywords to the full local paths
const address = 'http://localhost:3000';
const baseURLs: Record<string, string> = {
  dev: `${address}/dev/`,
  prod: `${address}/prod/`,
};

export default defineConfig({
  testDir: './tests',
  reporter: [
    ['list'],
    ['./utils/BugReporter.ts']
  ],
  use: {
    // Select the URL based on the ENV variable
    baseURL: baseURLs[env] || baseURLs.dev,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
});