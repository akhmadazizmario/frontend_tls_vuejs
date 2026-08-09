<template>
  <div class="d-flex flex-column min-vh-100 bg-light">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-5"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px',
        }"
      >
        <div class="container-lg">
          <!-- HERO WELCOME -->
          <div class="hero-banner mb-4">
            <div class="hero-text">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="hero-icon">
                  <i class="bi bi-speedometer2"></i>
                </span>
                <h2 class="mb-0 fw-bold">Dashboard</h2>
              </div>
              <p class="mb-0 hero-sub">
                Selamat datang kembali,
                <span class="fw-semibold">{{ user.name }}</span>! Berikut ringkasan akun kamu hari ini.
              </p>
            </div>
            <div class="hero-deco d-none d-md-flex">
              <i class="bi bi-graph-up-arrow"></i>
            </div>
          </div>

          <!-- QUICK STATS -->
          <div class="row g-3 mb-1">
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon bg-blue">
                  <i class="bi bi-person-badge"></i>
                </div>
                <div>
                  <div class="stat-label">No Pegawai</div>
                  <div class="stat-value">{{ user.nopegawai || '-' }}</div>
                </div>
              </div>
            </div>

            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon bg-purple">
                  <i class="bi bi-diagram-3"></i>
                </div>
                <div>
                  <div class="stat-label">Departemen</div>
                  <div class="stat-value">{{ user.dept || '-' }}</div>
                </div>
              </div>
            </div>

            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon bg-green">
                  <i class="bi bi-check-circle"></i>
                </div>
                <div>
                  <div class="stat-label">Status Sistem</div>
                  <div class="stat-value">Aktif</div>
                </div>
              </div>
            </div>

            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon bg-amber">
                  <i class="bi bi-clock-history"></i>
                </div>
                <div>
                  <div class="stat-label">Akses Halaman</div>
                  <div class="stat-value">{{ pages.length }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-4 mt-2">
            <div class="col-lg-6">
              <div class="modern-card h-100">
                <div class="modern-card-header">
                  <span class="modern-card-icon bg-blue">
                    <i class="bi bi-person-circle"></i>
                  </span>
                  <h5 class="mb-0 fw-semibold">Detail Pengguna</h5>
                </div>

                <div class="modern-card-body">
                  <div class="detail-row">
                    <span class="detail-label">
                      <i class="bi bi-person me-2"></i>Nama
                    </span>
                    <strong>{{ user.name }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">
                      <i class="bi bi-credit-card-2-front me-2"></i>No Pegawai
                    </span>
                    <strong>{{ user.nopegawai }}</strong>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">
                      <i class="bi bi-diagram-3 me-2"></i>Departemen
                    </span>
                    <span class="dept-badge">{{ user.dept }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-6">
              <div class="modern-card h-100">
                <div class="modern-card-header">
                  <span class="modern-card-icon bg-green">
                    <i class="bi bi-gear-fill"></i>
                  </span>
                  <h5 class="mb-0 fw-semibold">Sistem Aktif</h5>
                </div>

                <div class="modern-card-body text-center">
                  <img
                    src="/images/hallo.gif"
                    class="img-fluid rounded-4 mb-3 system-img"
                  />
                  <p class="text-muted mb-0">
                    Sistem berjalan normal. Selamat bekerja 🚀
                  </p>
                </div>
              </div>
            </div>

            <div class="col-12 mt-4 text-center">
              <button @click="logout" class="logout-btn">
                <i class="bi bi-box-arrow-right me-2"></i> Logout
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

import Header from '../components/Header.vue'
import Sidebar from '../components/Sidebar.vue'
import Footer from '../components/Footer.vue'

/* ===============================
   STATE
================================ */
const user = ref({
  name: '',
  nopegawai: '',
  dept: ''
})

const pages = ref([])

const sidebarOpen = ref(false)
const windowWidth = ref(window.innerWidth)

const router = useRouter()

/* ===============================
   SIDEBAR
================================ */
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function handleResize() {
  windowWidth.value = window.innerWidth
  sidebarOpen.value = windowWidth.value >= 768
}

window.addEventListener('resize', handleResize)

/* ===============================
   MOUNTED
================================ */
onMounted(() => {
  handleResize()

  const rawUser = localStorage.getItem('user')
  const rawPages = localStorage.getItem('pages')

  // ❌ belum login
  if (!rawUser || !rawPages) {
    router.push('/')
    return
  }

  const parsedUser = JSON.parse(rawUser)

  /**
   * 🔥 FIX UTAMA DI SINI
   * support:
   * 1. user = { name, nopegawai, dept }
   * 2. user = { user: { name, nopegawai, dept } }
   */
  user.value = parsedUser.user ?? parsedUser

  pages.value = JSON.parse(rawPages)

  // ❌ tidak punya akses dashboard
  if (!pages.value.includes('dashboard')) {
    router.push('/unauthorized') // atau '/'
    return
  }

  // DEBUG (hapus kalau sudah yakin)
  console.log('USER DASHBOARD:', user.value)
  console.log('PAGES:', pages.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

/* ===============================
   LOGOUT
================================ */
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
    alert('Logout gagal')
  }
}

</script>


<style scoped>
.bg-light {
  background-color: #f4f6fb !important;
}

/* ===============================
   HERO BANNER
================================ */
.hero-banner {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.75rem 2rem;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #4f7cff 0%, #6a5cf0 100%);
  color: #fff;
  box-shadow: 0 10px 30px rgba(79, 124, 255, 0.25);
}

.hero-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.6rem;
  background: rgba(255, 255, 255, 0.18);
  font-size: 1.1rem;
}

.hero-sub {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.hero-deco {
  font-size: 4.5rem;
  color: rgba(255, 255, 255, 0.15);
  align-items: center;
}

/* ===============================
   STAT CARDS
================================ */
.stat-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #fff;
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
  border: 1px solid rgba(15, 23, 42, 0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.stat-icon {
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #fff;
}

.stat-icon.bg-blue { background: linear-gradient(135deg, #4f7cff, #6a93ff); }
.stat-icon.bg-purple { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
.stat-icon.bg-green { background: linear-gradient(135deg, #22c55e, #4ade80); }
.stat-icon.bg-amber { background: linear-gradient(135deg, #f59e0b, #fbbf24); }

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.15rem;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===============================
   MODERN CARD
================================ */
.modern-card {
  background: #fff;
  border-radius: 1.25rem;
  border: 1px solid rgba(15, 23, 42, 0.05);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.modern-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.modern-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.65rem;
  color: #fff;
  font-size: 1rem;
}

.modern-card-icon.bg-blue { background: linear-gradient(135deg, #4f7cff, #6a93ff); }
.modern-card-icon.bg-green { background: linear-gradient(135deg, #22c55e, #4ade80); }

.modern-card-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  font-size: 0.9rem;
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-label {
  color: #6b7280;
  display: flex;
  align-items: center;
}

.dept-badge {
  background: rgba(79, 124, 255, 0.12);
  color: #4f7cff;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}

.system-img {
  max-height: 190px;
  object-fit: contain;
}

/* ===============================
   LOGOUT BUTTON
================================ */
.logout-btn {
  display: inline-flex;
  align-items: center;
  border: none;
  background: linear-gradient(135deg, #ef4444, #f87171);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.7rem 2.25rem;
  border-radius: 999px;
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(239, 68, 68, 0.32);
  color: #fff;
}

.logout-btn:active {
  transform: translateY(0);
}

/* ===============================
   RESPONSIVE
================================ */
@media (max-width: 767px) {
  .hero-banner {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.5rem;
  }
}
</style>