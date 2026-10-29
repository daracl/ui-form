import { createServer } from 'vite';
import { commonConfig, root } from '../../vite.common.mjs';

export default async function globalSetup() {
  const server = await createServer({
    ...commonConfig, root, configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { ...commonConfig.server, port: 5515, strictPort: true, open: false, watch: null },
  });
  await server.listen();
  return () => server.close();
}
