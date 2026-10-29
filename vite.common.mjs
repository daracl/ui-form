import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
export const MODULE_NAME = 'daracl.form';
export const topBanner = `/*! ${pkg.name} v${pkg.version} | Copyright 2023-${new Date().getUTCFullYear()} darainfo | ${pkg.license} */`;
export const createAssetFileNames = (isProd) => (asset) =>
  asset.names.some(name => name.endsWith('.css'))
    ? `${MODULE_NAME}${isProd ? '.min' : ''}.[ext]`
    : 'assets/[name].[ext]';

export const commonConfig = {
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@t': fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },
  css: { preprocessorOptions: { scss: { api: 'modern' } } },
  define: { APP_VERSION: JSON.stringify(pkg.version) },
  server: {
    host: '127.0.0.1', port: 5501, open: '/uitest/index.html',
    fs: { strict: true, allow: [root] },
  },
  preview: { host: '127.0.0.1' },
};

export const commonBuild = {
  // Preserve Vite 5's browser targets across the toolchain upgrade.
  target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  sourcemap: true,
  reportCompressedSize: false,
  copyPublicDir: false,
};
