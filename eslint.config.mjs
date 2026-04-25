import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific ignores:
    "_DEPRECATED_CRM-dev/**",
    "node_modules/next/dist/docs/**",
    "prisma/**",        // Mirrors tsconfig "exclude": ["prisma"]; seed.ts has intentional `any`s
    "src/test/**",      // Test setup may use loose types intentionally
    "**/__tests__/**",  // ditto for test files
    "e2e/**",           // Playwright tests
  ]),
]);

export default eslintConfig;
