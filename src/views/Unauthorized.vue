<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
// import api from '../api.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user')) || null)

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs'
  script.type = 'module'
  document.head.appendChild(script)
})

async function logout() {
  try {
    await axios.post(
      import.meta.env.VITE_API_BASE_URL + '/auth/logout',
      {},
      { withCredentials: true }
    )
    localStorage.removeItem('user')
    localStorage.removeItem('pages')
    router.push('/')
  } catch (err) {
    console.error('Logout gagal', err)
    // Tetap hapus storage jika API gagal agar tidak stuck
    localStorage.clear()
    router.push('/')
  }
}

const toggleSidebar = () => {}
</script>

<template>
  <div class="page-wrapper d-flex flex-column min-vh-100">
    
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <main class="flex-grow-1 d-flex align-items-center justify-content-center px-4">
      <div class="error-card text-center p-5 shadow-sm border-0 rounded-4 animate-in">
        
        <div class="animation-wrapper mx-auto mb-2">
          <dotlottie-player 
            src="https://lottie.host/80860243-7f76-466d-9653-3330689e4722/O8M7mX2r6c.json" 
            background="transparent" 
            speed="1" 
            style="width: 100%; height: 100%;" 
            loop 
            autoplay>
          </dotlottie-player>
        </div>

        <div class="content-text">
          <h1 class="fw-black text-dark mb-2 tracking-tight">Akses Terbatas</h1>
          <div class="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill mb-4 border border-danger-subtle">
            Error 403: Forbidden
          </div>
          
          <p class="text-secondary mb-5 fs-5">
            Maaf, akun Anda tidak memiliki izin untuk halaman ini. 
            Silakan gunakan <span class="fw-bold text-dark">Menu Profil di pojok kanan atas</span> untuk <strong>Logout</strong> dan gunakan akun yang sesuai.
          </p>

          <div class="instruction-box p-3 rounded-3 bg-light border d-inline-flex align-items-center">
            <span class="me-2 text-primary">
              <i class="bi bi-arrow-up-right-circle-fill"></i>
            </span>
            <span class="small text-muted fw-medium text-uppercase tracking-widest">Logout via Header Menu</span>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');

.page-wrapper {
  background-color: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  /* Background subtle pattern */
  background-image: radial-gradient(#e2e8f0 0.5px, transparent 0.5px);
  background-size: 24px 24px;
}

.error-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  max-width: 580px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.animation-wrapper {
  width: 320px;
  height: 320px;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.05));
}

.fw-black {
  font-weight: 800;
  font-size: 2.5rem;
  letter-spacing: -1px;
}

.tracking-tight { letter-spacing: -0.025em; }
.tracking-widest { letter-spacing: 0.1em; }

.instruction-box {
  animation: pulse 2s infinite;
}

/* Animations */
.animate-in {
  animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(30px) scale(0.98); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); background-color: #f0f7ff; }
  100% { transform: scale(1); }
}

/* Mobile Responsive */
@media (max-width: 576px) {
  .animation-wrapper {
    width: 240px;
    height: 240px;
  }
  .fw-black {
    font-size: 1.8rem;
  }
  .error-card {
    padding: 2rem !important;
  }
}
</style>