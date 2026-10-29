import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { commonConfig, commonBuild, createAssetFileNames, topBanner } from './vite.common.mjs';

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
        entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        name: 'Daracl', formats: ['es', 'cjs'],
        fileName: format => `index${isProd ? '.min' : ''}.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        external: id => !/\.(?:css|s[ac]ss)(?:\?|$)/.test(id) && ['@daracl/core', '@daracl/toast', '@daracl/datetimepicker']
          .some(name => id === name || id.startsWith(`${name}/`)),
        output: { banner: topBanner, assetFileNames: createAssetFileNames(isProd) },
      },
    },
  };
});
