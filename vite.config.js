import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Fail loudly instead of silently sliding to 3001 when 3000 is taken.
    // The backend only trusts port 3000 as a CORS origin, so a fallback port
    // produced a dashboard that loaded fine and then failed every API call
    // with an unexplained "Failed to fetch" — an error far harder to trace
    // than "port already in use".
    strictPort: true,
    open: true
  }
});
