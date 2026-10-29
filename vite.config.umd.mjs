import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { commonConfig, commonBuild, MODULE_NAME, createAssetFileNames, topBanner } from './vite.common.mjs';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    ...commonConfig,
    build: {
      ...commonBuild,
      outDir: isProd ? 'dist' : 'dist/unmin',
      emptyOutDir: false,
      minify: isProd ? 'esbuild' : false,
      lib: {
        entry: fileURLToPath(new URL('./src/index.umd.ts', import.meta.url)),
        name: 'Daracl', formats: ['umd'],
        fileName: () => `${MODULE_NAME}${isProd ? '.min' : ''}.umd.js`,
      },
      rollupOptions: {
        output: { banner: topBanner, assetFileNames: createAssetFileNames(isProd) },
      },
    },
  };
});
