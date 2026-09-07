import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * The preview harness: the real screens against fake clients, in a browser,
 * with no Disney session.
 *
 * A separate config rather than a mode on the production one, so nothing in
 * `harness/` can reach the bundle the bookmarklet loads. `root` is absolute so
 * `npm run harness` works from any directory. Plain http: the certificate in
 * `tls/` exists for injection into Disney's https page, which is not what this
 * does.
 */
export default defineConfig({
  root: path.join(__dirname, 'harness'),
  resolve: {
    alias: [
      // No clock sync against the upstream time server from a dev page.
      {
        find: /^@\/timesync$/,
        replacement: path.join(__dirname, 'harness/fakes/timesync.ts'),
      },
      // The same substitution jest.config.js makes. The fakes never send a
      // request, so this module is never called; the alias keeps it out of
      // the page altogether.
      {
        find: /^\.\/sensor-data$/,
        replacement: path.join(__dirname, 'src/api/__mocks__/sensor-data.ts'),
      },
      { find: /^@\/(.*)$/, replacement: path.join(__dirname, 'src') + '/$1' },
    ],
  },
  server: { port: 5174, strictPort: true, open: false },
  plugins: [react(), tailwindcss()],
});
