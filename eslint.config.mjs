import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals, ...nextTs,
  // Static export with unoptimized images: plain <img> is intentional.
  { rules: { '@next/next/no-img-element': 'off' } },
  globalIgnores(['out/**', '.next/**', '.next-dev/**', 'next-env.d.ts']),
]);
