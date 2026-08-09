<template>
  <div class="main-hub">
    <nav class="navbar navbar-expand-lg navbar-dark bg-navy sticky-top shadow-lg">
      <div class="container-fluid px-4">
        <span class="navbar-brand d-flex align-items-center">
          <div class="brand-icon me-3">
            <i class="bi bi-cpu-fill text-warning"></i>
          </div>
          <div class="brand-text">
            <h1 class="fs-5 fw-bold mb-0 tracking-tight">TV DISPLAY SYSTEM</h1>
            <small class="text-warning-50 fw-semibold opacity-75">PT. TRI LESTARI SANDANG INDUSTRI</small>
          </div>
        </span>
        
        <div class="ms-auto text-end d-none d-md-block border-start border-secondary ps-4">
          <div class="clock-text fw-bold text-white fs-4">{{ currentTime }}</div>
          <div class="date-text text-warning small text-uppercase tracking-widest">{{ currentDate }}</div>
        </div>
      </div>
    </nav>

    <div class="container py-5">
      <div class="header-section text-center mb-5">
        <h2 class="fw-black text-navy display-6 mb-2">TV DISPLAY PRODUCTION</h2>
        <p class="text-muted">Pilih departemen untuk membuka tampilan monitoring real-time</p>
        <div class="divider-custom mx-auto"></div>
      </div>

      <div class="row g-4">
        <div class="col-12 col-md-6 col-lg-4" v-for="dept in departments" :key="dept.name">
          <div class="dept-card" @click="navigateTo(dept.path)">
            <div :class="['card-accent', dept.colorClass]"></div>
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-start mb-4">
                <div :class="['icon-wrapper shadow-sm', dept.bgLightClass]">
                  <i :class="['bi', dept.icon, dept.textClass]"></i>
                </div>
                <div class="status-indicator">
                  <span class="pulse-icon"></span>
                  <span class="small fw-bold text-success">LIVE</span>
                </div>
              </div>
              
              <div class="content">
                <span class="category-label text-uppercase">{{ dept.category }}</span>
                <h3 class="dept-title">{{ dept.name }}</h3>
                
                <div class="line-container mt-3">
                  <span v-for="line in dept.lines" :key="line" class="line-badge">
                    <i class="bi bi-geo-alt-fill me-1"></i> {{ line }}
                  </span>
                </div>
              </div>

              <div class="card-footer-action mt-4 pt-3 border-top">
                <span class="action-text">Buka Dashboard</span>
                <i class="bi bi-chevron-right arrow-icon"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="text-center py-4 text-muted small opacity-75">
      &copy; 2026 IT Team - PT. Tri Lestari Sandang Industri | v2.0.4
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// Jika Anda menggunakan Vue Router, aktifkan ini:
// import { useRouter } from 'vue-router'; 
// const router = useRouter();

const currentTime = ref('');
const currentDate = ref('');

/**
 * MODIFIKASI LINK DI SINI
 * Ubah properti 'path' sesuai dengan route/slash yang Anda inginkan.
 */
const departments = ref([
  {
    id: '10161',
    name: 'LINKING LINE A',
    category: 'Linking Dept',
    path: '/tv-linkinga', // <-- Ganti link di sini
    icon: 'bi-intersect',
    colorClass: 'bg-primary',
    bgLightClass: 'bg-primary-light',
    textClass: 'text-primary',
    lines: ['Line A']
  },
  {
    id: '10161',
    name: 'LINKING LINE B',
    category: 'Linking Dept',
    path: '/tv-linkingb',
    icon: 'bi-intersect',
    colorClass: 'bg-primary',
    bgLightClass: 'bg-primary-light',
    textClass: 'text-primary',
    lines: ['Line B']
  },
  {
    id: '10161',
    name: 'LINKING LINE C',
    category: 'Linking Dept',
    path: '/tv-linkingc',
    icon: 'bi-intersect',
    colorClass: 'bg-primary',
    bgLightClass: 'bg-primary-light',
    textClass: 'text-primary',
    lines: ['Line C']
  },
   {
    id: '10161',
    name: 'LINKING LINE D',
    category: 'Linking Dept',
    path: '/tv-linkingd',
    icon: 'bi-intersect',
    colorClass: 'bg-primary',
    bgLightClass: 'bg-primary-light',
    textClass: 'text-primary',
    lines: ['Line D']
  },
  {
    id: '10221',
    name: 'SONTEX',
    category: 'Sontex Dept',
    path: '/tv-sontex',
    icon: 'bi-layers-half',
    colorClass: 'bg-indigo',
    bgLightClass: 'bg-indigo-light',
    textClass: 'text-indigo',
    lines: ['Sontex']
  },
  {
    id: '10221',
    name: 'SEWING & LO',
    category: 'Sewing & LO Dept',
    path: '/tv-lodansewing',
    icon: 'bi-scissors',
    colorClass: 'bg-success',
    bgLightClass: 'bg-success-light',
    textClass: 'text-success',
    lines: ['Sewing dan LO']
  },
  {
    id: '10180',
    name: 'SULAM',
    category: 'SULAM',
    path: '/tv-sulam',
    icon: 'bi-lightning-charge',
    colorClass: 'bg-orange',
    bgLightClass: 'bg-orange-light',
    textClass: 'text-orange',
    lines: ['SULAM']
  },
  {
    id: 'UTAMA',
    name: 'OFFICE',
    category: 'OFFICE',
    path: '/tv-office',
    icon: 'bi-lightning-charge',
    colorClass: 'bg-danger',
    bgLightClass: 'bg-danger-light',
    textClass: 'text-danger',
    lines: ['OFFICE']
  },
  {
    id: 'Expedisi',
    name: 'EXPEDISI',
    category: 'Expedisi',
    path: '/tv-expedisi',
    icon: 'bi-car-front',
    colorClass: 'bg-success',
    bgLightClass: 'bg-success-light',
    textClass: 'text-success',
    lines: ['EXPEDISI']
  }
]);

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentDate.value = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const navigateTo = (path) => {
  console.log("Navigating to:", path);
  // Opsi 1: Jika menggunakan Vue Router (Rekomendasi)
  // router.push(path);
  
  // Opsi 2: Jika pindah halaman HTML biasa / berbeda port
  window.location.href = path; 
};

onMounted(() => {
  updateClock();
  setInterval(updateClock, 1000);
});
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css');
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

.main-hub {
  min-height: 100vh;
  background-color: #f4f7fa;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Colors */
.bg-navy { background-color: #0f172a; }
.text-navy { color: #0f172a; }
.bg-indigo { background-color: #6366f1; }
.bg-indigo-light { background-color: #eef2ff; }
.text-indigo { color: #6366f1; }
.bg-orange { background-color: #f59e0b; }
.bg-orange-light { background-color: #fffbeb; }
.text-orange { color: #f59e0b; }
.bg-primary-light { background-color: #eff6ff; }
.bg-success-light { background-color: #f0fdf4; }

/* Navbar Brand */
.brand-icon {
  background: rgba(255,255,255,0.1);
  padding: 10px;
  border-radius: 12px;
  font-size: 1.5rem;
  border: 1px solid rgba(255,255,255,0.1);
}

/* Card Design */
.dept-card {
  background: white;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.dept-card:hover {
  transform: translateY(-12px);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.12);
  border-color: rgba(0,0,0,0.1);
}

.card-accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8px;
}

.icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

.category-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #94a3b8;
}

.dept-title {
  font-weight: 800;
  font-size: 1.5rem;
  color: #1e293b;
  margin-top: 4px;
}

/* Status Pulse */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
}

.pulse-icon {
  width: 8px;
  height: 8px;
  background-color: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

/* Badges */
.line-badge {
  display: inline-block;
  background: #f8fafc;
  color: #64748b;
  padding: 5px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-right: 8px;
  border: 1px solid #e2e8f0;
}

/* Card Action Area */
.action-text {
  font-weight: 700;
  font-size: 0.9rem;
  color: #6366f1;
}

.arrow-icon {
  float: right;
  transition: transform 0.3s;
  color: #6366f1;
}

.dept-card:hover .arrow-icon {
  transform: translateX(5px);
}

.divider-custom {
  width: 60px;
  height: 4px;
  background: #6366f1;
  border-radius: 10px;
}

.fw-black { font-weight: 900; }
</style>