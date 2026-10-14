import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
};
const configure = (phase: string): NextConfig => ({ ...config, distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next' });
export default configure;
