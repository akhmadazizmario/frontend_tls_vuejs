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
          
          <div class="d-flex align-items-center mb-5 border-bottom pb-3">
            <h2 class="mb-0 text-primary fw-bolder">
              <i class="bi bi-grid-fill me-2"></i> Dashboard Menu Scan Barcode Detail
            </h2>
            <span class="ms-3 text-secondary">
              Pilih menu input atau laporan yang ingin diakses
            </span>
          </div>
          
          <div class="row g-4">
            
            <div class="col-sm-6 col-md-4 col-lg-3">
              <div class="menu-card shadow-sm border-0 d-flex flex-column" @click="goTo('/scan-barcode-linking-issue')">
                <div class="card-body text-center d-flex flex-column flex-grow-1">
                  <i class="bi bi-qr-code-scan display-4 text-primary mb-3"></i>
                  <h5 class="card-title fw-bold text-dark mb-3">Scan Barcode Issue Linking TLS</h5>
                  <!-- <p class="card-text text-muted small flex-grow-1">Input data barcode PO dan Quantity untuk proses linking.</p> -->
                  <button class="btn btn-sm btn-outline-primary mt-auto ">Masuk <i class="bi bi-arrow-right"></i></button>
                </div>
              </div>
            </div>

            <div class="col-sm-6 col-md-4 col-lg-3">
              <div class="menu-card shadow-sm border-0 d-flex flex-column" @click="goTo('/scan-barcode-linking-return')">
                <div class="card-body text-center d-flex flex-column flex-grow-1">
                  <i class="bi bi-x-square-fill display-4 text-danger mb-3"></i> 
                  <h5 class="card-title fw-bold text-dark mb-3">Scan Barcode Return Linking TLS</h5>
                  <!-- <p class="card-text text-muted small flex-grow-1">Lihat riwayat pembatalan/pengembalian data linking.</p> -->
                  <button class="btn btn-sm btn-outline-danger mt-auto">Masuk <i class="bi bi-arrow-right"></i></button>
                </div>
              </div>
            </div>

             <div class="col-sm-6 col-md-4 col-lg-3">
              <div class="menu-card shadow-sm border-0 d-flex flex-column" @click="goTo('/scan-barcode-linking-receive')">
                <div class="card-body text-center d-flex flex-column flex-grow-1">
                  <i class="bi bi-menu-button-wide display-4 text-success mb-3"></i> 
                  <h5 class="card-title fw-bold text-dark mb-3">Scan Barcode Received TLS</h5>
                  <!-- <p class="card-text text-muted small flex-grow-1">Lihat riwayat pembatalan/pengembalian data linking.</p> -->
                  <button class="btn btn-sm btn-outline-success mt-auto">Masuk <i class="bi bi-arrow-right"></i></button>
                </div>
              </div>
            </div>

             <div class="col-sm-6 col-md-4 col-lg-3">
              <div class="menu-card shadow-sm border-0 d-flex flex-column" @click="goTo('/scan-barcode-linking-transfer')">
                <div class="card-body text-center d-flex flex-column flex-grow-1">
                  <i class="bi bi-book display-4 text-warning mb-3"></i> 
                  <h5 class="card-title fw-bold text-dark mb-3">Scan Barcode Transfer TLS</h5>
                  <!-- <p class="card-text text-muted small flex-grow-1">Lihat riwayat pembatalan/pengembalian data linking.</p> -->
                  <button class="btn btn-sm btn-outline-warning mt-auto">Masuk <i class="bi bi-arrow-right"></i></button>
                </div>
              </div>
            </div>
            
             <div class="col-sm-6 col-md-4 col-lg-3">
              <div class="menu-card shadow-sm border-0 d-flex flex-column" @click="goTo('/piece-transfer')">
                <div class="card-body text-center d-flex flex-column flex-grow-1">
                  <i class="bi bi-card-heading display-4 text-dark mb-3"></i> 
                  <h5 class="card-title fw-bold text-dark mb-3">Piece Transfer WHA2I</h5>
                  <!-- <p class="card-text text-muted small flex-grow-1">Lihat riwayat pembatalan/pengembalian data linking.</p> -->
                  <button class="btn btn-sm btn-outline-primary mt-auto">Masuk <i class="bi bi-arrow-right"></i></button>
                </div>
              </div>
            </div>
            
            </div>
        </div>
      </main>
    </div>
    <Footer />
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

// Pastikan path komponen ini benar
import Header from '../../components/Header.vue' 
import Sidebar from '../../components/Sidebar.vue'
import Footer from '../../components/Footer.vue'

const user = ref({})
const router = useRouter()
const sidebarOpen = ref(false)
const windowWidth = ref(window.innerWidth)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function handleResize() {
  windowWidth.value = window.innerWidth
  // Otomatis buka sidebar pada layar besar
  if (windowWidth.value >= 768) {
    sidebarOpen.value = true
  } else {
    sidebarOpen.value = false
  }
}

// Fungsi untuk navigasi (dipanggil saat card diklik)
function goTo(path) {
    router.push(path)
}

window.addEventListener('resize', handleResize)

onMounted(() => {
  handleResize()
  // Cek otentikasi
  const userData = localStorage.getItem('user')
  if (!userData) {
    // Jika tidak ada user, redirect ke halaman login
    router.push('/') 
  } else {
    user.value = JSON.parse(userData)
  }
})

async function logout() {
  try {
    // Sesuaikan endpoint dan cara logout API Anda
    await axios.post(import.meta.env.VITE_API_BASE_URL + '/auth/logout', {}, { withCredentials: true })
    localStorage.removeItem('user')
    router.push('/')
  } catch {
    alert('Logout gagal')
  }
}
</script>


<style scoped>
/* Gaya untuk setiap Card Menu (Membuatnya interaktif dan cantik) */
.menu-card {
    background-color: #ffffff;
    border-radius: 12px; 
    padding: 20px;
    height: 100%; /* PENTING: Memastikan semua card dalam row memiliki tinggi yang sama */
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Efek saat kursor di atas card (Hover Effect) */
.menu-card:hover {
    transform: translateY(-5px); 
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15); /* Bayangan sedikit diperkuat */
    background-color: #f8f9fa; 
}

/* Mengatur Card Body (padding 0 agar ikon & tombol lebih dekat ke tepi) */
.menu-card .card-body {
    padding: 0; 
}

/* Kunci penyesuaian: Menghapus margin bawah standar yang mungkin mengganggu Flexbox */
.menu-card .card-text {
    margin-bottom: 1rem !important; /* Memberi ruang di atas tombol */
    line-height: 1.4;
}

/* Sedikit meredupkan ikon saat normal */
.menu-card i.display-4 {
    opacity: 0.85;
}
</style>