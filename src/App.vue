<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { io } from 'socket.io-client'

const router = useRouter()

// Ambil Base URL Socket dari .env
const SOCKET_URL = new URL(import.meta.env.VITE_API_BASE_URL).origin

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
})

onMounted(() => {
  // 1. Ambil data user dari LocalStorage
  const userData = localStorage.getItem('user')
  
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user && user.id) {
        console.log('[SOCKET] Registering user room:', `user_${user.id}`)
        // Mendaftar ke room socket user_${user.id}
        socket.emit('register', user.id)
      } else {
        console.warn('[SOCKET] User ID tidak ditemukan di localStorage!')
      }
    } catch (e) {
      console.error('[SOCKET] Error parsing user data:', e)
    }
  }

  // 2. Dengarkan perubahan UAC secara Realtime dari Backend
  socket.on('uac_updated', (data) => {
    console.log('🔥 [REALTIME UAC] Akses diperbarui oleh Admin:', data.pages)

    // Update LocalStorage dengan daftar pages yang baru
    localStorage.setItem('pages', JSON.stringify(data.pages))
    localStorage.setItem('user_pages', JSON.stringify(data.pages)) // jaga-jaga kalau key beda

    // Cek route yang sedang aktif sekarang
    const currentRouteCode = router.currentRoute.value.meta?.code || router.currentRoute.value.name

    // Jika user sedang berada di halaman yang dicabut aksesnya, tendang ke /
    if (currentRouteCode && !data.pages.includes(currentRouteCode)) {
      alert('Akses Anda ke halaman ini telah dicabut oleh Admin.')
      router.push('/')
      setTimeout(() => window.location.reload(), 300)
    } else {
      // Reload cepat untuk menyegarkan komponen Sidebar / Navbar
      window.location.reload()
    }
  })
})

onUnmounted(() => {
  socket.off('uac_updated')
})
</script>