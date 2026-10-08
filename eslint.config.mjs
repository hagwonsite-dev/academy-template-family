import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
export default defineConfig([
 ...nextVitals,...nextTypescript,
 globalIgnores(['.next/**','dist/**','node_modules/**','public/**','tests/browser.spec.mjs','playwright.config.mjs','scripts.mjs','next-env.d.ts','src/server.ts','src/validation.ts','src/*-driver.d.ts']),
 {rules:{'@next/next/no-img-element':'off'}}, // User-supplied HTTPS artwork URLs must not be proxied through the server.
]);
