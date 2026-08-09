<template>
  <div class="container-fluid bg-black vh-100 p-0 main-wrapper overflow-hidden text-white font-sans">
    
    <Transition name="fade">
      <div v-if="isLoading" class="loader-wrapper vh-100 w-100 d-flex flex-column justify-content-center align-items-center bg-black">
        <div class="text-center">
          <div class="spinner-border text-warning mb-4" style="width: 8rem; height: 8rem;" role="status"></div>
          <h1 class="display-1 fw-black text-yellow-400 animate-pulse italic">RESTORING DATA...</h1>
        </div>
      </div>
    </Transition>

    <Transition name="fade" mode="out-in">
      <div v-if="!isLoading" class="vh-100 d-flex flex-column p-4 bg-black">
        <div class="w-100 d-flex align-items-center justify-content-between mb-2 px-3">
          <span class="fs-1 fw-black text-emerald-400">● OUTPUT</span>
          <h1 class="text-center display-2 fw-black text-yellow-400 italic uppercase mb-0">📊 SUMMARY PRODUKSI</h1>
          <span class="fs-1 fw-black text-cyan-400">EMPLOYEE ●</span>
        </div>

        <div class="flex-grow-1 w-100 border-6 border-white rounded-5 bg-black overflow-hidden shadow-2xl">
          <table class="table table-dark m-0 w-100 h-100 layout-fixed">
            <thead class="bg-white text-black">
              <tr class="text-center align-middle">
                <th style="width: 14%" class="header-text">TANGGAL</th>
                <th style="width: 14%" class="header-text">PLANNING</th>
                <th style="width: 14%" class="header-text">TERIMA</th>
                <th style="width: 14%" class="header-text border-start-4 border-black">LINKING</th>
                <th style="width: 14%" class="header-text border-start-4 border-black">LO</th>
                <th style="width: 14%" class="header-text border-start-4 border-black">SEWING</th>
                <th style="width: 16%" class="header-text border-start-4 border-black">KIRIM</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="paginatedSummaryProduksi.length > 0">
                <template v-for="(row, i) in paginatedSummaryProduksi" :key="i">
                  <tr class="border-bottom-2 border-white align-middle text-center">
                    <td rowspan="2" class="bg-date-blue border-end-4 border-white">
                      <div class="text-date">{{ formatDateProduksi(row.xDate) }}</div>
                    </td>
                    <td rowspan="2" class="bg-planning-purple border-end-4 border-white">
                      <div class="text-val px-2">{{ row.planning?.toLocaleString() || '0' }}</div>
                    </td>
                    <td rowspan="2" class="bg-output-red border-end-4 border-white">
                      <div class="text-val px-2">{{ row.Terima?.toLocaleString() || '0' }}</div>
                    </td>
                    <td class="bg-output-red border-end-4 border-white">
                      <div class="text-val px-2">{{ (linkingMap[row.xDate?.substring(0,10)] || 0).toLocaleString() }}</div>
                    </td>
                    <td class="bg-output-red border-end-4 border-white">
                      <div class="text-val px-2">{{ row.Total_Hasil_LO?.toLocaleString() || '0' }}</div>
                    </td>
                    <td class="bg-output-red border-end-4 border-white">
                      <div class="text-val px-2">{{ row.Total_Hasil_Sontex?.toLocaleString() || '0' }}</div>
                    </td>
                    <td rowspan="2" class="bg-emerald-modern">
                      <div class="text-val px-2">{{ row.Total_Hasil_Kirim?.toLocaleString() || '0' }}</div>
                    </td>
                  </tr>
                  <tr class="border-bottom-8 border-white align-middle text-center">
                    <td v-for="dept in ['linking', 'lo', 'sontex']" :key="dept" class="bg-attend-green border-end-4 border-white">
                      <div class="text-emp"><span class="text-warning me-2">👤</span>{{ (employeeMap[row.xDate?.substring(0,10)]?.[dept] || 0) }}</div>
                    </td>
                  </tr>
                </template>
              </template>
              <tr v-else>
                <td colspan="7" class="text-center fs-1 fw-black text-danger pt-5">DATA TIDAK DITEMUKAN / LOADING...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>

    <div v-if="!isLoading" class="fixed-bottom p-1">
      <div class="progress bg-dark" style="height: 14px; border-radius: 10px; border: 2px solid white;">
        <div class="progress-bar bg-warning shadow-lg" :style="{ width: scrollProgress + '%', transition: 'width 0.1s linear' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const isLoading = ref(true);
const scrollProgress = ref(0);
const summaryProduksiRaw = ref([]);
const employeeMap = ref({});
const linkingMap = ref({});

const currentPageProduksi = ref(1);
const itemsPerPageProduksi = 4;

const formatDateProduksi = (dStr) => dStr ? new Date(dStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-";

const fetchAllData = async () => {
  try {
    console.log("Fetching data from:", API_BASE_URL);
    // Kita hapus hit API resSummary karena data departemen sudah tidak dipakai lagi
    const [resLaporan, resKaryawan] = await Promise.all([
      axios.get(`${API_BASE_URL}/tv-office/laporan-office`),
      axios.get(`${API_BASE_URL}/tv-office/jml-karyawan`)
    ]);

    // Proses Data Summary Produksi
    if (resLaporan.data && resLaporan.data.query) {
      summaryProduksiRaw.value = resLaporan.data.query.sort((a, b) => new Date(b.xDate) - new Date(a.xDate));
      linkingMap.value = resLaporan.data.linking || {};
    }

    // Proses Data Karyawan
    if (resKaryawan.data && resKaryawan.data.data) {
      const eMap = {};
      resKaryawan.data.data.forEach(cur => { 
        if (cur.xDate) eMap[cur.xDate.substring(0,10)] = cur; 
      });
      employeeMap.value = eMap;
    }

    isLoading.value = false;
  } catch (e) {
    console.error("CRITICAL ERROR FETCHING DATA:", e);
    isLoading.value = false;
  }
};

const animate = (time) => new Promise(res => {
  const start = Date.now();
  const int = setInterval(() => {
    const elapsed = Date.now() - start;
    scrollProgress.value = Math.min((elapsed / time) * 100, 100);
    if (elapsed >= time) { clearInterval(int); res(); }
  }, 50);
});

// Master Loop dimodifikasi agar hanya melakukan pagination untuk Summary Produksi
const startMasterLoop = async () => {
  const DURATION = 15000;
  while (true) {
    const totalP = Math.ceil(summaryProduksiRaw.value.length / itemsPerPageProduksi) || 1;
    for (let p = 1; p <= totalP; p++) {
      currentPageProduksi.value = p;
      await animate(DURATION);
    }
  }
};

const paginatedSummaryProduksi = computed(() => {
  const start = (currentPageProduksi.value - 1) * itemsPerPageProduksi;
  return summaryProduksiRaw.value.slice(start, start + itemsPerPageProduksi);
});

onMounted(async () => {
  await fetchAllData();
  startMasterLoop();
  setInterval(fetchAllData, 300000); // Refresh data tiap 5 menit
});
</script>

<style scoped>
.header-text { font-size: 3vh !important; font-weight: 900; padding: 1.5vh 0 !important; }
.text-date { font-size: 5vh !important; font-weight: 900; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%; padding: 0 10px; }
.text-val { font-size: 7vh !important; font-weight: 900; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%; letter-spacing: -2px; }
.text-emp { font-size: 4vh !important; font-weight: 800; display: flex; align-items: center; justify-content: center; height: 100%; }
.layout-fixed { table-layout: fixed; border-collapse: collapse; }
.table { height: 100% !important; border-color: white !important; }
td, th { vertical-align: middle !important; overflow: hidden; position: relative; padding: 5px !important; }
.bg-date-blue { background-color: #002b5c !important; }
.bg-planning-purple { background-color: #3b006b !important; }
.bg-output-red { background-color: #7a0000 !important; }
.bg-attend-green { background-color: #004d26 !important; }
.bg-emerald-modern { background-color: #003d33 !important; }
.fw-black { font-weight: 900 !important; }
.border-6 { border-width: 6px !important; }
.border-start-4 { border-left-width: 4px !important; }
.border-end-4 { border-right-width: 4px !important; }
.border-bottom-8 { border-bottom-width: 8px !important; }
.shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; position: absolute; width: 100%; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<!-- <template>
  <div class="container-fluid bg-black vh-100 p-0 main-wrapper overflow-hidden text-white font-sans">
    
    <Transition name="fade">
      <div v-if="isLoading" class="loader-wrapper vh-100 w-100 d-flex flex-column justify-content-center align-items-center bg-black">
        <div class="text-center">
          <div class="spinner-border text-warning mb-4" style="width: 8rem; height: 8rem;" role="status"></div>
          <h1 class="display-1 fw-black text-yellow-400 animate-pulse italic">RESTORING DATA...</h1>
        </div>
      </div>
    </Transition>

    <Transition name="fade" mode="out-in">
      
      <div v-if="!isLoading && activeView === 'summary-produksi'" class="vh-100 d-flex flex-column p-4 bg-black">
        <div class="w-100 d-flex align-items-center justify-content-between mb-2 px-3">
          <span class="fs-1 fw-black text-emerald-400">● OUTPUT</span>
          <h1 class="text-center display-2 fw-black text-yellow-400 italic uppercase mb-0">📊 SUMMARY PRODUKSI</h1>
          <span class="fs-1 fw-black text-cyan-400">EMPLOYEE ●</span>
        </div>

        <div class="flex-grow-1 w-100 border-6 border-white rounded-5 bg-black overflow-hidden shadow-2xl">
          <table class="table table-dark m-0 w-100 h-100 layout-fixed">
            <thead class="bg-white text-black">
              <tr class="text-center align-middle">
                <th style="width: 14%" class="header-text">TANGGAL</th>
                <th style="width: 14%" class="header-text">PLANNING</th>
                <th style="width: 14%" class="header-text">TERIMA</th>
                <th style="width: 14%" class="header-text border-start-4 border-black">LINKING</th>
                <th style="width: 14%" class="header-text border-start-4 border-black">LO</th>
                <th style="width: 14%" class="header-text border-start-4 border-black">SEWING</th>
                <th style="width: 16%" class="header-text border-start-4 border-black">KIRIM</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="paginatedSummaryProduksi.length > 0">
                <template v-for="(row, i) in paginatedSummaryProduksi" :key="i">
                  <tr class="border-bottom-2 border-white align-middle text-center">
                    <td rowspan="2" class="bg-date-blue border-end-4 border-white">
                      <div class="text-date">{{ formatDateProduksi(row.xDate) }}</div>
                    </td>
                    <td rowspan="2" class="bg-planning-purple border-end-4 border-white">
                      <div class="text-val px-2">{{ row.planning?.toLocaleString() || '0' }}</div>
                    </td>
                    <td rowspan="2" class="bg-output-red border-end-4 border-white">
                      <div class="text-val px-2">{{ row.Terima?.toLocaleString() || '0' }}</div>
                    </td>
                    <td class="bg-output-red border-end-4 border-white">
                      <div class="text-val px-2">{{ (linkingMap[row.xDate?.substring(0,10)] || 0).toLocaleString() }}</div>
                    </td>
                    <td class="bg-output-red border-end-4 border-white">
                      <div class="text-val px-2">{{ row.Total_Hasil_LO?.toLocaleString() || '0' }}</div>
                    </td>
                    <td class="bg-output-red border-end-4 border-white">
                      <div class="text-val px-2">{{ row.Total_Hasil_Sontex?.toLocaleString() || '0' }}</div>
                    </td>
                    <td rowspan="2" class="bg-emerald-modern">
                      <div class="text-val px-2">{{ row.Total_Hasil_Kirim?.toLocaleString() || '0' }}</div>
                    </td>
                  </tr>
                  <tr class="border-bottom-8 border-white align-middle text-center">
                    <td v-for="dept in ['linking', 'lo', 'sontex']" :key="dept" class="bg-attend-green border-end-4 border-white">
                      <div class="text-emp"><span class="text-warning me-2">👤</span>{{ (employeeMap[row.xDate?.substring(0,10)]?.[dept] || 0) }}</div>
                    </td>
                  </tr>
                </template>
              </template>
              <tr v-else>
                <td colspan="7" class="text-center fs-1 fw-black text-danger pt-5">DATA TIDAK DITEMUKAN / LOADING...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="!isLoading && activeView === 'summary-dept'" class="vh-100 d-flex flex-column p-4 bg-navy-gradient overflow-hidden">
        <div class="mb-3 p-3 rounded-5 bg-white shadow-lg text-center border-bottom border-warning border-10">
          <h1 class="fw-black text-navy display-1 mb-0 uppercase">📊 {{ currentDeptTitle }}</h1>
          <p class="text-black fw-black display-6 mb-0">{{ periodLabel }} - {{ dateRangeText }}</p>
        </div>

        <div class="flex-grow-1 rounded-5 shadow-2xl overflow-hidden bg-white border border-5 border-dark">
          <table class="table table-bordered m-0 w-100 h-100 layout-fixed" style="border-color: black;">
            <thead>
              <tr class="bg-navy text-white text-center align-middle">
                <th class="header-text-dept" style="width: 15%">LINE NAME</th>
                <th class="header-text-dept" style="width: 10%">ORG</th>
                <th v-for="d in filteredDateHeaders" :key="d" class="header-text-dept border-start border-light border-2">{{ formatDate(d) }}</th>
                <th class="header-text-dept bg-dark text-warning" style="width: 15%">AVG</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in paginatedSummaryTable" :key="i" class="align-middle text-center h-20">
                <td class="text-navy bg-light text-start px-4 fw-black dept-line-text">{{ formatLineName(row.lineName) }}</td>
                <td class="text-dark fw-bold dept-val-text">{{ row.totalEmployees }}</td>
                <td v-for="d in filteredDateHeaders" :key="d" 
                    class="fw-black dept-val-text border-4" 
                    :class="getHealthClasses(getValueByDate(row, d))">
                  {{ Math.round(getValueByDate(row, d)) }}%
                </td>
                <td class="fw-black dept-val-text shadow-inner" :class="getHealthClasses(row.avgEfficiency)">
                  {{ Math.round(row.avgEfficiency || 0) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>

    <div v-if="!isLoading" class="fixed-bottom p-1">
      <div class="progress bg-dark" style="height: 14px; border-radius: 10px; border: 2px solid white;">
        <div class="progress-bar bg-warning shadow-lg" :style="{ width: scrollProgress + '%', transition: 'width 0.1s linear' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const isLoading = ref(true);
const activeView = ref('summary-produksi');
const scrollProgress = ref(0);
const summaryProduksiRaw = ref([]);
const employeeMap = ref({});
const linkingMap = ref({});
const allDeptsData = ref([]);
const dateHeaders = ref([]);
const dateRangeText = ref("");
const currentDeptTitle = ref("");
const activeLines = ref([]);

const currentPageProduksi = ref(1);
const itemsPerPageProduksi = 4;
const currentPageDept = ref(1);
const itemsPerPageDept = 5;
const periodLabel = ref("");

// FORMAT LINE: Link. A01-15, LO. A01, SEW. A01, SS. A01
const formatLineName = (name) => {
  if (!name) return "-";
  const n = name.toUpperCase();
  // Tangkap kode A01 atau A01-15
  const match = n.match(/([A-Z]\d{2}(?:-\d{2})?)/); 
  const code = match ? match[1] : n.replace(/STICK LINE|L.O LINE|LO LINE|LINKING|SONTEX|SOOM|LINE/gi, "").trim();

  if (n.includes("LINKING")) return ` ${code}`;
  if (n.includes("STICK")) return ` ${code}`;
  if (n.includes("SONTEX") || n.includes("SOOM")) return ` ${code}`;
  if (n.includes("LO") || n.includes("L.O")) return ` ${code}`;
  
  return code;
};

const formatDate = (dStr) => dStr ? `${new Date(dStr).getDate()}/${new Date(dStr).getMonth() + 1}` : "";
const formatDateProduksi = (dStr) => dStr ? new Date(dStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-";

const getHealthClasses = (val) => {
  const v = Math.round(val || 0);
  if (v === 0) return 'text-secondary opacity-25 bg-light';
  if (v < 50) return 'bg-danger text-white';
  if (v <= 70) return 'bg-warning text-dark';
  return 'bg-success text-white';
};

const filteredDateHeaders = computed(() => {
  if (!dateHeaders.value.length) return [];
  const today = new Date().getDate();
  let start, end;
  if (today <= 7) { start = 1; end = 7; periodLabel.value = "PERIODE 1"; }
  else if (today <= 15) { start = 8; end = 15; periodLabel.value = "PERIODE 2"; }
  else if (today <= 23) { start = 16; end = 23; periodLabel.value = "PERIODE 3"; }
  else { start = 24; end = 31; periodLabel.value = "PERIODE 4"; }
  return dateHeaders.value.filter(d => {
    const day = new Date(d).getDate();
    return day >= start && day <= end;
  });
});

const getValueByDate = (row, dateStr) => {
  const idx = dateHeaders.value.indexOf(dateStr);
  if (idx === -1) return 0;
  return row[`g${String(idx + 1).padStart(2, '0')}`] || 0;
};

const fetchAllData = async () => {
  try {
    console.log("Fetching data from:", API_BASE_URL);
    const [resLaporan, resKaryawan, resSummary] = await Promise.all([
      axios.get(`${API_BASE_URL}/tv-office/laporan-office`),
      axios.get(`${API_BASE_URL}/tv-office/jml-karyawan`),
      axios.get(`${API_BASE_URL}/tv-target-linkinga/summary-linking`)
    ]);

    // Proses Data Summary Produksi
    if (resLaporan.data && resLaporan.data.query) {
      summaryProduksiRaw.value = resLaporan.data.query.sort((a, b) => new Date(b.xDate) - new Date(a.xDate));
      linkingMap.value = resLaporan.data.linking || {};
    }

    // Proses Data Karyawan
    if (resKaryawan.data && resKaryawan.data.data) {
      const eMap = {};
      resKaryawan.data.data.forEach(cur => { 
        if (cur.xDate) eMap[cur.xDate.substring(0,10)] = cur; 
      });
      employeeMap.value = eMap;
    }

    // Proses Data Per Departemen
    if (resSummary.data && resSummary.data.success) {
      const depts = resSummary.data.departments || [];
      let combined = [];

      // LINKING
      const link = depts.find(d => d.deptName === "LINKING");
      if (link) combined.push({ title: "DEPT LINKING", lines: link.lines });

      // SS (SONTEX yang bukan STICK)
      const sontex = depts.find(d => d.deptName === "SONTEX");
      if (sontex) {
        const ssLines = sontex.lines.filter(l => !l.lineName.toUpperCase().includes("STICK"));
        if (ssLines.length > 0) combined.push({ title: "DEPT SOOM SONTEX ", lines: ssLines });
      }

      // SEWING (Cek di deptName "STICK" dulu, lalu fallback ke SONTEX)
      let stickLines = depts.find(d => d.deptName === "STICK")?.lines || [];
      if (stickLines.length === 0 && sontex) {
        stickLines = sontex.lines.filter(l => l.lineName.toUpperCase().includes("STICK"));
      }
      if (stickLines.length > 0) combined.push({ title: "DEPT SEWING (STICK)", lines: stickLines });

      // LO
      const lo = depts.find(d => d.deptName === "LO");
      if (lo) combined.push({ title: "DEPT LO", lines: lo.lines });

      allDeptsData.value = combined;
      dateHeaders.value = resSummary.data.meta?.dateHeaders || [];
      dateRangeText.value = `PERIODE: ${resSummary.data.meta?.sbDate || '-'} S/D ${resSummary.data.meta?.seDate || '-'}`;
    }

    isLoading.value = false;
  } catch (e) {
    console.error("CRITICAL ERROR FETCHING DATA:", e);
    // Jika error, tetap matikan loader agar tidak stuck
    isLoading.value = false;
  }
};

const animate = (time) => new Promise(res => {
  const start = Date.now();
  const int = setInterval(() => {
    const elapsed = Date.now() - start;
    scrollProgress.value = Math.min((elapsed / time) * 100, 100);
    if (elapsed >= time) { clearInterval(int); res(); }
  }, 50);
});

const startMasterLoop = async () => {
  const DURATION = 15000;
  while (true) {
    // Loop Summary Produksi
    activeView.value = 'summary-produksi';
    const totalP = Math.ceil(summaryProduksiRaw.value.length / itemsPerPageProduksi) || 1;
    for (let p = 1; p <= totalP; p++) {
      currentPageProduksi.value = p;
      await animate(DURATION);
    }

    // Loop Departemen
    activeView.value = 'summary-dept';
    if (allDeptsData.value.length > 0) {
      for (const dept of allDeptsData.value) {
        currentDeptTitle.value = dept.title;
        activeLines.value = dept.lines;
        const totalD = Math.ceil(dept.lines.length / itemsPerPageDept) || 1;
        for (let p = 1; p <= totalD; p++) {
          currentPageDept.value = p;
          await animate(DURATION);
        }
      }
    } else {
      await animate(DURATION); // Tunggu sebentar jika dept kosong
    }
  }
};

const paginatedSummaryProduksi = computed(() => {
  const start = (currentPageProduksi.value - 1) * itemsPerPageProduksi;
  return summaryProduksiRaw.value.slice(start, start + itemsPerPageProduksi);
});

const paginatedSummaryTable = computed(() => {
  const start = (currentPageDept.value - 1) * itemsPerPageDept;
  return activeLines.value.slice(start, start + itemsPerPageDept);
});

onMounted(async () => {
  await fetchAllData();
  startMasterLoop();
  setInterval(fetchAllData, 300000); // Refresh data tiap 5 menit
});
</script>

<style scoped>
/* CSS tetap sama dengan sebelumnya */
.header-text { font-size: 3vh !important; font-weight: 900; padding: 1.5vh 0 !important; }
.header-text-dept { font-size: 3vh !important; font-weight: 900; padding: 2vh 0 !important; }
.text-date { font-size: 5vh !important; font-weight: 900; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%; padding: 0 10px; }
.text-val { font-size: 7vh !important; font-weight: 900; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%; letter-spacing: -2px; }
.text-emp { font-size: 4vh !important; font-weight: 800; display: flex; align-items: center; justify-content: center; height: 100%; }
.dept-line-text { font-size: 5vh !important; line-height: 1.1; padding-left: 20px !important; }
.dept-val-text { font-size: 5vh !important; line-height: 1; padding: 10px !important; }
.layout-fixed { table-layout: fixed; border-collapse: collapse; }
.table { height: 100% !important; border-color: white !important; }
td, th { vertical-align: middle !important; overflow: hidden; position: relative; padding: 5px !important; }
.h-20 { height: 18% !important; }
.bg-date-blue { background-color: #002b5c !important; }
.bg-planning-purple { background-color: #3b006b !important; }
.bg-output-red { background-color: #7a0000 !important; }
.bg-attend-green { background-color: #004d26 !important; }
.bg-emerald-modern { background-color: #003d33 !important; }
.bg-navy-gradient { background: linear-gradient(135deg, #0a2647 0%, #144272 100%) !important; }
.bg-navy { background-color: #0a2647 !important; }
.text-navy { color: #0a2647 !important; }
.fw-black { font-weight: 900 !important; }
.border-6 { border-width: 6px !important; }
.border-10 { border-width: 10px !important; }
.border-start-4 { border-left-width: 4px !important; }
.border-end-4 { border-right-width: 4px !important; }
.border-bottom-8 { border-bottom-width: 8px !important; }
.shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease; position: absolute; width: 100%; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style> -->