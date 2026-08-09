// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [vue()],
// })

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Tambahkan baris 'base' ini
  // base: '/frontend/',

  server: {
    host: '0.0.0.0', // biar bisa diakses dari LAN saat dev
    port: 5173
  }
})