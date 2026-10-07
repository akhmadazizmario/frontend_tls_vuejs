<template>
  <div class="vh-100 d-flex flex-column p-0 bg-light-gray overflow-hidden font-industrial">
    
    <div class="header-factory d-flex align-items-center justify-content-between px-4 bg-white border-bottom-blue">
      <div class="d-flex align-items-center">
        <div class="badge-tlsi shadow-sm">PT Tri Lestari Sandang Industri</div>
        <div class="ms-3">
          <h1 class="m-0 text-navy fw-bold tracking-tight uppercase fs-2">EXPEDISI DEPT</h1>
          <p class="m-0 text-muted small fw-bold uppercase">Production EXPEDISI</p>
        </div>
      </div>
      <div class="text-end">
        <div class="text-navy fs-1 fw-black lh-1">{{ currentTime }}</div>
        <div class="text-blue-main fw-bold">{{ totalPages > 1 ? `Halaman ${currentPage} / ${totalPages}` : 'Semua Data' }}</div>
      </div>
    </div>

    <div class="flex-grow-1 p-3">
      <div class="table-responsive h-100 shadow rounded-3 bg-white">
        <table class="table-factory w-100 h-100">
          <thead>
            <tr class="bg-navy text-white header-main">
              <th rowspan="2" class="col-idp border-light text-white fs-2 fw-bold">STYLE</th>
              <th colspan="2" class="border-light text-white fs-2 fw-bold">A1 TO A2</th>
              <th colspan="3" class="border-light bg-blue-shade text-white fs-3 fw-bold">WH to LK</th>
              <th colspan="3" class="border-light text-white fs-3 fw-bold">A2P TO A2I (PACKING)</th>
              <th colspan="2" class="border-light bg-blue-shade text-white fs-3 fw-bold">A2I TO A1 (TRANSFER)</th>
              <th rowspan="2" class="col-status border-light text-white fs-3 fw-bold">NOT YET TF</th>
              <th rowspan="2" class="col-balance border-light bg-dark-gray text-white fs-3 fw-bold">BALANCE</th>
            </tr>
            <tr class="bg-navy-light text-white header-sub">
              <th class="border-light text-white fs-3 fw-bold">YEST</th>
              <th class="border-light text-white fs-3 fw-bold">TOTAL</th>
              <th class="border-light text-white fs-3 fw-bold">TODAY</th>
              <th class="border-light text-white fs-3 fw-bold">TOTAL</th>
              <th class="border-light text-white fs-3 fw-bold">+/-</th>
              <th class="border-light text-white fs-3 fw-bold">TODAY</th>
              <th class="border-light text-white fs-3 fw-bold">TOTAL</th>
              <th class="border-light text-white fs-3 fw-bold">+/-</th>
              <th class="border-light text-white fs-3 fw-bold">TODAY</th>
              <th class="border-light text-white fs-3 fw-bold">TOTAL</th>
            </tr>
          </thead>

          <tbody class="text-center align-middle">
            <tr v-for="(row, index) in paginatedData" :key="row.idp || index" class="row-data">
              <td class="text-start px-3 fw-bold text-navy border-gray bg-light-blue fs-2 fw-bold">{{ row.idp }}</td>
              <td class="border-gray text-muted">{{ format(row.yesterday_ltxtoa2) }}</td>
              <td class="border-gray fw-bold">{{ format(row.ttl_ltxtoa2) }}</td>
              <td class="border-gray text-blue-main fw-bold">{{ format(row.today_a2tolinking) }}</td>
              <td class="border-gray fw-bold">{{ format(row.ttl_a2tolinking) }}</td>
              <td class="border-gray" :class="row.kurang_a2tolinking > 0 ? 'text-danger fw-bold' : 'text-muted'">
                {{ format(row.kurang_a2tolinking) }}
              </td>
              <td class="border-gray text-blue-main fw-bold">{{ format(row.today_a2ptoa2i) }}</td>
              <td class="border-gray fw-bold">{{ format(row.ttl_a2ptoa2i) }}</td>
              <td class="border-gray" :class="row.kurang_a2ptoa2i > 0 ? 'text-danger fw-bold' : 'text-muted'">
                {{ format(row.kurang_a2ptoa2i) }}
              </td>
              <td class="border-gray text-success fw-bold">{{ format(row.today_a2itoltx) }}</td>
              <td class="border-gray text-success fw-bold">{{ format(row.ttl_a2itoltx) }}</td>
              <td class="border-gray" :class="row.blm_transfer > 0 ? 'bg-soft-red text-danger fw-bold' : ''">
                {{ format(row.blm_transfer) }}
              </td>
              <td class="border-gray bg-dark-gray text-white fw-black fw-bold fs-2 shadow-inner">{{ format(row.balance) }}</td>
            </tr>
            <tr v-for="n in (itemsPerPage - (paginatedData?.length || 0))" :key="'f-'+n" class="row-filler">
              <td colspan="13" class="border-gray bg-white"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer-factory bg-white border-top-gray">
      <div class="d-flex h-100">
        <div class="summary-box flex-fill border-end">
          <span class="sum-label text-muted text-black fs-3 fw-bold">Total A1-A2</span>
          <span class="sum-value text-navy">{{ format(total.txC1) }}</span>
        </div>
        <div class="summary-box flex-fill border-end">
          <span class="sum-label text-muted text-black fs-3 fw-bold">WH to LK</span>
          <span class="sum-value text-navy">{{ format(total.txC2) }}</span>
        </div>
        <div class="summary-box flex-fill border-end bg-light-blue">
          <span class="sum-label text-blue-main text-black fs-3 fw-bold">Packing (A2P)</span>
          <span class="sum-value text-blue-main">{{ format(total.txC3) }} <small class="fs-2 fw-normal">({{ percent(total.txC3) }}%)</small></span>
        </div>
        <div class="summary-box flex-fill border-end bg-light-green">
          <span class="sum-label text-success text-black fs-3 fw-bold">Transfer (A2I)</span>
          <span class="sum-value text-success">{{ format(total.txC4) }} <small class="fs-2 fw-normal">({{ percent(total.txC4) }}%)</small></span>
        </div>
        <div class="summary-box flex-fill bg-danger text-white shadow-inner">
          <span class="sum-label opacity-75 text-white fs-3 fw-bold">Not Yet TF</span>
          <span class="sum-value fw-black">{{ format(total.total_belum_transfer) }}</span>
        </div>
      </div>
      <div class="target-ribbon bg-navy text-white text-center fw-bold py-1">
        TARGET PRODUKSI HARIAN: {{ format(target) }} PCS
      </div>
    </div>

    <div class="auto-scroll-indicator">
      <div class="indicator-bar" :style="{ width: scrollProgress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const data = ref([]);
const total = ref({ txC1: 0, txC2: 0, txC3: 0, txC4: 0, total_belum_transfer: 0 });
const target = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(6); // Diubah jadi 6 Data saja
const scrollProgress = ref(0);
const currentTime = ref("");

let displayTimer = null;

const totalPages = computed(() => {
  const len = data.value?.length || 0;
  return Math.ceil(len / itemsPerPage.value) || 1;
});

const paginatedData = computed(() => {
  if (!data.value) return [];
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return data.value.slice(start, start + itemsPerPage.value);
});

const updateClock = () => {
  currentTime.value = new Date().toLocaleTimeString('id-ID', { hour12: false });
};

const fetchHourlyData = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-ekspedisi`);
    const result = res.data.data || [];
    // Sort balance agar yang krusial naik ke atas
    data.value = result.sort((a, b) => a.balance - b.balance);
    total.value = res.data.total || total.value;
    target.value = res.data.target || 0;
  } catch (e) {
    console.error("Fetch Error:", e);
  }
};

const startPagination = () => {
  const CYCLE = 15000; // 15 Detik per slide
  let start = Date.now();
  displayTimer = setInterval(() => {
    const now = Date.now();
    scrollProgress.value = ((now - start) / CYCLE) * 100;
    if (now - start >= CYCLE) {
      currentPage.value = (currentPage.value % totalPages.value) + 1;
      start = Date.now();
    }
  }, 100);
};

const format = (v) => new Intl.NumberFormat('id-ID').format(v || 0);
const percent = (v) => target.value ? ((v / target.value) * 100).toFixed(1) : '0';

onMounted(() => {
  updateClock();
  fetchHourlyData();
  startPagination();
  setInterval(updateClock, 1000);
  setInterval(fetchHourlyData, 300000);
});

onBeforeUnmount(() => clearInterval(displayTimer));
</script>

<style scoped>
/* COLORS & STYLE */
.bg-light-gray { background-color: #f8fafc; }
.bg-navy { background-color: #1a237e; }
.bg-navy-light { background-color: #283593; }
.bg-blue-shade { background-color: #0d47a1 !important; } /* Biru Terang Solid */
.bg-dark-gray { background-color: #263238; }
.bg-light-blue { background-color: #f1f5f9; }
.bg-light-green { background-color: #f0fdf4; }
.bg-soft-red { background-color: #fef2f2; }
.text-navy { color: #1a237e; }
.text-blue-main { color: #1d4ed8; }
.border-bottom-blue { border-bottom: 5px solid #1a237e; }
.border-gray { border: 1px solid #e2e8f0 !important; }
.border-light { border: 1px solid rgba(255,255,255,0.2) !important; }

/* TYPOGRAPHY */
.font-industrial { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.fw-black { font-weight: 900; }

/* LAYOUT */
.badge-tlsi { background: #1a237e; color: white; padding: 8px 18px; font-weight: 900; font-size: 1.8rem; border-radius: 6px; }
.header-factory { height: 11vh; }

.table-factory { border-collapse: collapse; table-layout: fixed; }
.header-main th { font-size: 1.2rem; padding: 12px 5px; text-transform: uppercase; }
.header-sub th { font-size: 0.9rem; padding: 8px; font-weight: bold; }

/* Karena 6 baris, tingginya ditambah agar font bisa lebih besar */
.row-data { height: 11vh; font-size: 3.8vh; } 
.row-filler { height: 11vh; }

.footer-factory { height: 15vh; }
.summary-box { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.sum-label { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
.sum-value { font-size: 3.2rem; font-weight: 900; line-height: 1; }

.target-ribbon { font-size: 1.3rem; letter-spacing: 2px; }
.auto-scroll-indicator { height: 8px; background: #e2e8f0; }
.indicator-bar { height: 100%; background: #1a237e; transition: width 0.1s linear; }

.shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); }
</style>