<template>
  <div class="tv-display-container vh-100 overflow-hidden bg-silver select-none">
    
    <div v-if="isLoading" class="vh-100 d-flex flex-column align-items-center justify-content-center bg-navy text-white">
      <div class="spinner-border text-warning mb-3" style="width: 4rem; height: 4rem;" role="status"></div>
      <h2 class="fw-bold tracking-wider text-uppercase">Memuat Data TV Display...</h2>
    </div>

    <template v-else>
      <Transition name="fade-slide">
        <div v-if="activeView === 'under60'" class="vh-100 d-flex flex-column p-2">
          
          <div class="header-danger-custom p-3 mb-2 rounded shadow border border-dark d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <div>
              <h1 class="fw-black m-0 display-4 text-white tracking-tight">LOW PERFORMANCE</h1>
              <p class="m-0 text-white fs-5 fw-bold opacity-75">Monitoring Kinerja Operator Masa kerja >4 Bulan hasil &lt; 50 %</p>
            </div>
            
            <div class="d-flex flex-column align-items-end gap-1.5 min-w-sm-250">
              <span class="badge bg-white text-danger fs-3 border border-dark px-3 py-1.5 shadow text-uppercase fw-black w-100 text-center text-truncate">
                {{ currentPageDeptLabel }}
              </span>
              <div class="date-input-wrapper w-100 shadow-sm border border-dark rounded">
                <input 
                  type="date" 
                  v-model="selectedDate" 
                  @change="handleDateChange" 
                  class="form-control text-center fw-black text-uppercase border-0"
                />
              </div>
            </div>
          </div>
          
          <div class="table-frame flex-grow-1 bg-white border border-4 border-dark shadow overflow-hidden d-flex flex-column rounded-1">
            
            <div v-if="under60Data.length === 0" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
              <p class="fs-1 text-muted text-uppercase text-dark fw-black">Tidak ada data operator di bawah target.</p>
            </div>

            <table v-else class="table-custom table-fixed m-0">
              <thead class="bg-navy text-white">
                <tr class="header-text-white border-bottom-dark">
                  <th style="width: 80px;" class="text-center text-white">NO</th>
                  <th style="width: 250px;" class="text-start px-3 text-white">DEPT / LINE</th>
                  <th class="text-start px-4 text-white">NAMA OPERATOR</th>
                  <th style="width: 230px;" class="text-center text-white">MASA KERJA</th>
                  <th style="width: 200px;" class="text-center bg-warning text-dark border-start-dark">RATE %</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in paginatedUnder60" :key="index" class="border-bottom-dark align-middle">
                  <td class="fs-1 bg-light fw-black border-end-dark text-center">
                    {{ (currentUnder60Page - 1) * itemsPerPage + index + 1 }}
                  </td>
                  
                  <td class="fs-2 fw-black border-end-dark text-start px-3 text-truncate">
                    <span 
                      class="badge px-2 py-1 me-2 text-white text-uppercase shadow-sm fw-black" 
                      :class="{
                        'bg-primary': item.xDeptLabel === 'LINKING',
                        'bg-success': item.xDeptLabel === 'SONTEX' || item.xDeptLabel === 'STEAM' || item.xDeptLabel === 'SEWING',
                        'bg-info text-dark': item.xDeptLabel === 'SEWING LO',
                        'bg-secondary': item.xDeptLabel === 'QC LAMPU',
                        'bg-dark': item.xDeptLabel === 'SULAM'
                      }" 
                      style="font-size: 13px; min-width: 95px; display: inline-block; text-align: center;"
                    >
                      {{ item.xDeptLabel }}
                    </span>
                    {{ cleanLineName(item.xGroup || item.xLine) }}
                  </td>
                  
                  <td class="fs-1 text-start px-4 text-uppercase fw-black text-dark border-end-dark text-truncate">
                    {{ item.xEmplName }}
                  </td>
                  
                  <td class="fs-2 text-primary fw-black border-end-dark bg-light-blue text-center">
                    {{ formatLOS(item.xJoinMonth) }}
                  </td>
                  
                  <td class="display-3 text-danger bg-yellow-soft fw-black text-center">
                    {{ Math.round(item.xTRealRate) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </Transition>

      <div class="fixed-bottom bg-dark" style="height: 6px; z-index: 9999;">
        <div class="bg-warning h-100 transition-all" :style="{ width: scrollProgress + '%' }"></div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isLoading = ref(true);
const under60Data = ref([]);
const activeView = ref('under60');
const currentUnder60Page = ref(1);
const itemsPerPage = ref(6);
const scrollProgress = ref(0);

// State filter tanggal
const selectedDate = ref('');
let displayLoopTimeout = null;
let refreshInterval = null;
let isInterrupted = false;

// Fungsi pembantu membuat format tanggal kemarin (H-1) sesuai zona waktu lokal PC/TV
const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formatter Panjang Masa Kerja
const formatLOS = (m) => {
  if (!m) return '0Bln';
  const years = Math.floor(m / 12);
  const months = m % 12;
  return (years > 0 ? `${years}Thn ` : '') + (months > 0 ? `${months}Bln` : (years > 0 ? '' : '0Bln'));
};

// Pembersih Nama Grup/Line
const cleanLineName = (name) => {
  if (!name) return '-';
  return name.toUpperCase()
    .replace('LINKING', '')
    .replace('SOOM SONTEX', '')
    .replace('STEAM', '')
    .replace('STICK', '')
    .replace('L.O', '')
    .replace('QC. LAMPU', '')
    .replace('SULAM', '')
    .replace('LINE', '')
    .replace('LIE', '')
    .trim();
};

// Computed property label banner atas
const currentPageDeptLabel = computed(() => {
  if (paginatedUnder60.value.length === 0) return 'NO DATA';
  const labels = [...new Set(paginatedUnder60.value.map(item => item.xDeptLabel))];
  return labels.join(' & ');
});

// Paginasi Array Data Penampil Layar TV
const paginatedUnder60 = computed(() => under60Data.value.slice((currentUnder60Page.value - 1) * itemsPerPage.value, currentUnder60Page.value * itemsPerPage.value));

// Ambil data dari server
const fetchAllData = async (dateParam = '') => {
  try {
    const url = dateParam 
      ? `${API_BASE_URL}/tv-baru/officereport-slide2?pDate=${dateParam}`
      : `${API_BASE_URL}/tv-baru/officereport-slide2?pDate=${selectedDate.value}`;
      
    const resU = await axios.get(url);
    if (resU.data.success) {
      under60Data.value = resU.data.data;
      // Jika backend melempar validasi tanggal aktif yang berbeda, sinkronisasikan kembali
      if (resU.data.activeDate) {
        selectedDate.value = resU.data.activeDate.slice(0, 10);
      }
    } else {
      under60Data.value = [];
    }
  } catch (e) { 
    console.error("Gagal memuat data TV Display:", e); 
    under60Data.value = [];
  }
};

const runTimer = (ms) => new Promise(res => {
  const start = Date.now();
  const timer = setInterval(() => {
    if (isInterrupted) {
      clearInterval(timer);
      res();
      return;
    }
    const elapsed = Date.now() - start;
    scrollProgress.value = (elapsed / ms) * 100;
    if (elapsed >= ms) { 
      clearInterval(timer); 
      res(); 
    }
  }, 50);
});

// Rekursif Loop Slider Kontrol halaman
const startDisplayLoop = async () => {
  isInterrupted = false;
  
  // Menggunakan pendekatan perulangan berbasis kondisi dinamis agar jika data bertambah/berkurang di latar belakang, slider tidak melompat error
  while (!isInterrupted) {
    const uPageCount = Math.ceil(under60Data.value.length / itemsPerPage.value) || 1;
    
    if (currentUnder60Page.value > uPageCount) {
      currentUnder60Page.value = 1;
    }

    await runTimer(15000); // Tahan per halaman selama 15 detik

    if (isInterrupted) break;

    // Naikkan halaman, jika melewati batas maksimal, kembalikan ke halaman 1
    if (currentUnder60Page.value >= uPageCount) {
      currentUnder60Page.value = 1;
    } else {
      currentUnder60Page.value++;
    }
  }
};

// Event handler ketika user mengubah widget kalender picker secara paksa
const handleDateChange = async () => {
  isInterrupted = true;
  clearTimeout(displayLoopTimeout);
  isLoading.value = true; // Munculkan loading hanya saat ganti tanggal secara manual
  
  currentUnder60Page.value = 1;
  scrollProgress.value = 0;
  
  await fetchAllData(selectedDate.value);
  isLoading.value = false;
  
  startDisplayLoop();
};

onMounted(async () => {
  // 1. Ambil default tanggal kemarin langsung saat aplikasi dimuat pertama kali
  selectedDate.value = getYesterdayDateString();

  // 2. Tarik data pertama kali ke API
  await fetchAllData(selectedDate.value);
  isLoading.value = false;
  
  // 3. Jalankan loop slider penjelajah halaman
  startDisplayLoop();

  // 4. SILENT AUTO-REFRESH (Setiap 1 Jam): Mengambil data baru di background tanpa merusak animasi slider atau memunculkan layar hitam loading
  refreshInterval = setInterval(async () => {
    console.log("Melakukan refresh data berkala di latar belakang...");
    await fetchAllData(selectedDate.value);
  }, 60 * 60 * 1000);
});

onUnmounted(() => {
  isInterrupted = true;
  clearTimeout(displayLoopTimeout);
  clearInterval(refreshInterval);
});
</script>

<style scoped>
.bg-silver { background-color: #f4f5f7; }
.bg-navy { background-color: #1a252f; }
.bg-light-blue { background-color: #eef5ff; }
.bg-yellow-soft { background-color: #fffde7; }
.fw-black { font-weight: 900 !important; }
.select-none { user-select: none; }
.transition-all { transition: width 0.05s linear; }

.border-bottom-dark { border-bottom: 3px solid #2c3e50 !important; }
.border-end-dark { border-right: 3px solid #2c3e50 !important; }
.border-start-dark { border-left: 3px solid #2c3e50 !important; }
.table-fixed { table-layout: fixed; width: 100%; }

.table-custom th {
  padding: 18px 10px;
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.table-custom td { padding: 15px 10px; }
.header-danger-custom { background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); }

.date-input-wrapper {
  background-color: #ffffff;
  padding: 2px;
}
.date-input-wrapper input[type="date"] {
  font-size: 1.3rem;
  color: #b71c1c;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 10px;
}
.date-input-wrapper input[type="date"]:focus {
  box-shadow: none;
  background-color: #fffde7;
}

@media (min-width: 576px) {
  .min-w-sm-250 { min-width: 250px; }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.5s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(30px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-30px); }
</style>