import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:3000' } },
})

/*import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },

  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        employee: fileURLToPath(
          new URL('./employee-fulfillment.html', import.meta.url)
        ),
      },
    },
  },
});
*/

//adding in case delivery and curbside doesnt work, but it should be fine with the above proxy config
