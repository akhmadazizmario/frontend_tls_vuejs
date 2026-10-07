<template>
  <div class="container-fluid bg-dark vh-100 p-0 main-wrapper overflow-hidden text-white">
    
    <Transition name="fade">
      <div v-if="activeView === 'summary'" class="vh-100 d-flex flex-column justify-content-center align-items-center bg-navy-gradient p-5">
        <div class="text-center mb-5">
          <h1 class="display-1 fw-black letter-spacing-2 mb-2">PRODUCTION SUMMARY <br> SONTEX DEPT</h1>
          <!-- <h3 class="display-4 text-warning fw-bold">TIME : {{ currentDateTime }}</h3> -->
           <h3 class="display-4 text-warning fw-bold">{{ currentDateTime }}</h3>
        </div>
        <div class="row w-100 g-5 justify-content-center">
          <div v-for="(val, label) in summaryCards" :key="label" class="col-md-3">
            <div class="summary-box p-5 rounded-5 bg-white text-navy shadow-2xl text-center border-bottom border-warning border-5">
              <i :class="val.icon" class="display-1 d-block mb-4"></i>
              <span class="fs-1 fw-bold opacity-75 text-uppercase">{{ label }}</span>
              <div class="display-1 fw-black text-dark">{{ val.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

<Transition name="fade">
  <div v-if="activeView === 'under60'" class="vh-100 d-flex flex-column p-3 bg-white text-dark overflow-hidden">
    <!-- HEADER -->
    <div class="mb-3 p-3 rounded-4 bg-danger text-white text-center shadow-lg">
      <h2 class="fw-black display-6 m-0">
        ⚠️ KARYAWAN Hasil < 50% 
      </h2>
      <p class="mb-0">DEPT SONTEX</p>
    </div>

    <!-- TABLE -->
    <div class="flex-grow-1 shadow-2xl rounded-4 overflow-hidden border border-3 bg-white">
      <table class="table table-bordered m-0 h-100 text-center">
        <!-- THEAD -->
        <thead class="bg-dark text-white">
          <tr>
            <th style="width:5%" class="fs-2">NO</th>
            <th style="width:10%" class="fs-2">LINE</th>
            <th style="width:25%" class="fs-2">NAMA</th>
            <th style="width:15%" class="fs-2">MASA KERJA</th>
            <!-- <th style="width:20%" class="fs-2">PROSES</th>
            <th style="width:15%" class="fs-2">STYLE / PO</th> -->
            <th style="width:10%" class="fs-2">RATE</th>
          </tr>
        </thead>
        <!-- BODY -->
        <tbody>
          <tr 
            v-for="(item, index) in paginatedUnder60" 
            :key="index"
            class="align-middle"
          >
            <!-- NO -->
            <td class="fw-bold text-muted ">
              {{ (currentUnder60Page - 1) * itemsPerPage + index + 1 }}
            </td>

            <!-- LINE -->
            <td class="fw-bold text-navy fs-2">
              {{ formatLineName(item.xLine) }}
            </td>

            <!-- NAMA -->
            <td class="text-start fw-black fs-2 text-black text-uppercase">
              {{ item.xEmplName }}
            </td>

            <!-- MASA KERJA -->
            <td class="fw-bold text-primary fs-2">
              {{ formatLOS(item.xJoinMonth) }}
            </td>

            <!-- PROSES -->
            <!-- <td class="fw-bold text-muted fs-2 text-truncate">
              {{ item.xWorkName }}
            </td>

            <td class="fw-bold text-dark fs-2 text-truncate">
              {{ item.xPO }}
            </td> -->

            <!-- RATE -->
            <td 
              class="fw-black text-white fs-1"
              :class="{
                'bg-danger': item.xTRealRate < 50,
                'bg-warning text-dark': item.xTRealRate >= 50 && item.xTRealRate < 50
              }"
            >
              {{ Math.round(item.xTRealRate) }}%
            </td>
          </tr>

          <!-- EMPTY STATE -->
          <tr v-if="paginatedUnder60.length === 0">
            <td colspan="7" class="text-center text-muted fw-bold py-5">
              ✅ Tidak ada karyawan di bawah 60%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</Transition>


    <Transition name="fade">
      <div v-if="activeView === 'summary-table'" class="vh-100 d-flex flex-column p-2 bg-navy-gradient overflow-hidden">
        <div class="mb-2 p-2 rounded-4 bg-white shadow-lg text-center border-bottom border-warning border-4">
          <h2 class="fw-black text-navy mb-0">📊 SUMMARY ALL LINES SONTEX</h2>
          <p class="text-muted fw-bold fs-5 mb-0">{{ dateRangeText || "Memuat Periode..." }}</p>
        </div>

        <div class="flex-grow-1 rounded-3 shadow-2xl overflow-hidden bg-white">
          <table class="table table-bordered m-0 w-100 h-100 layout-fixed" style="border-color: black;">
            <thead>
              <tr class="bg-navy text-white text-center">
                <th class="align-middle fs-5 py-2" style="width: 15%">LINE NAME</th>
                <th class="align-middle fs-6 py-2" style="width: 5%">ORG</th>
                <th v-for="d in dateHeaders" :key="d" class="align-middle border-light date-col">
                  <div class="date-text fs-5">{{ formatDate(d) }}</div>
                </th>
                <th class="align-middle fs-5 py-2 bg-dark text-warning" style="width: 7%">AVG</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in paginatedSummaryTable" :key="i" class="align-middle text-center">
                <td class="fs-2 fw-black text-navy text-start px-2 bg-light border-light text-truncate">
                  <!-- {{ row.lineName }} -->
                    {{ formatLineName(row.lineName) }}
                </td>
                <td class="fs-4 fw-bold text-dark border-light">
                  {{ row.totalEmployees }}
                </td>
                <td v-for="(_, idx) in dateHeaders" :key="idx" 
                    class="fs-4 fw-bold border-light cell-data"
                    :class="getHealthClasses(row[`g${String(idx + 1).padStart(2, '0')}`])">
                  {{ Math.round(row[`g${String(idx + 1).padStart(2, '0')}`] || 0) }}%
                </td>
                <td class="fs-4 fw-black border-light shadow-inner" 
                    :class="getHealthClasses(row.avgEfficiency)">
                  {{ Math.round(row.avgEfficiency || 0) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
  <div v-if="activeView === 'table'" class="vh-100 d-flex flex-column p-3 bg-white text-dark overflow-hidden">
    <div class="d-flex justify-content-between align-items-center mb-3 px-5 py-2 bg-light rounded-pill border-start border-warning border-10 shadow-sm">
      <h2 class="m-0 fw-black text-navy display-6 text-uppercase">Data Hasil Produksi Operator <br> SONTEX</h2>
      <div class="text-end">
        <div class="badge bg-navy px-4 py-2 fs-4 mb-1 d-block">Tanggal: {{ currentDateTime }}</div>
      </div>
    </div>

    <div class="flex-grow-1 shadow-2xl rounded-4 overflow-hidden border border-3 bg-white">
      <table class="table table-bordered m-0 h-100 layout-fixed">
        <thead class="bg-navy text-white text-center">
          <tr>
            <th rowspan="2" class="fs-4 align-middle" style="width: 4%">NO</th>
            <th rowspan="2" class="fs-4 align-middle" style="width: 5%">LINE</th>
            <th rowspan="2" class="fs-4 align-middle" style="width: 15%">OPERATOR NAMA</th>
            <!-- <th rowspan="2" class="fs-4 align-middle" style="width: 8%">TGL JOIN</th> -->
            <th rowspan="2" class="fs-4 align-middle" style="width: 8%">MASA KERJA</th>
            <th rowspan="2" class="fs-4 align-middle" style="width: 12%">STYLE</th>
            <th rowspan="2" class="fs-4 align-middle" style="width: 14%">PROSES</th>
             <th rowspan="2" class="fs-4 align-middle" style="width: 8%">TARGET </th>
            <th :colspan="activePeriodeHeaders.length" class="bg-navy-light text-white fs-5 py-2">
              OUTPUT PER PERIODE
            </th>
            <th rowspan="2" class="bg-dark text-warning fs-5 align-middle" style="width: 7%">TOTAL</th>
          </tr>
          <tr class="bg-light text-navy">
            <th v-for="periode in activePeriodeHeaders" :key="periode" class="fs-5 py-1">
              {{ periode }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedData" :key="index" class="align-middle border-2 text-center">
            <td class="fw-bold fs-5 text-muted">
              {{ (currentPage - 1) * itemsPerPage + index + 1 }}
            </td>
            <td class="fs-3 text-muted fw-bold">
              {{ formatLineName(item.xGroup) }}
            </td>
            <td class="fw-black text-navy fs-2 text-uppercase text-start px-3 text-truncate">
              {{ item.xEmplName }}
            </td>
            <!-- <td class="fs-3 text-muted fw-bold">
              {{ formatJoinDate(item.xJoinDate) }}
            </td> -->
            <td class="fw-bold text-primary fs-3">
              {{ formatLOS(item.xJoinMonth) }}
            </td>
            <td class="fs-3 fw-bold text-truncate text-muted">
              {{ item.xMark }}
            </td>
            <td class="fs-3 fw-bold text-truncate text-muted">
              {{ item.xWorkName }}
            </td>
            <td class="fs-3 fw-bold text-danger">
      {{ item.xTarget3Jam }}
    </td>
            
            <td v-for="periode in activePeriodeHeaders" :key="periode"
                class="fs-1 fw-black border-start"
                :class="{'bg-warning-light': item.periodeQty[periode]}">
              {{ item.periodeQty[periode] || '-' }}
            </td>

            <td class="fw-black bg-navy text-white display-6 fs-1">
              {{ item.currentTotal }}
            </td>
          </tr>

          <tr v-if="paginatedData.length === 0">
            <td :colspan="8 + activePeriodeHeaders.length" class="text-center py-5 fs-2 fw-bold text-muted">
              Belum ada data produksi untuk periode ini.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</Transition>

    <div class="fixed-bottom p-1">
      <div class="progress bg-dark" style="height: 10px; border-radius: 10px;">
        <div class="progress-bar bg-warning" :style="{ width: scrollProgress + '%', transition: 'width 0.1s linear' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- STATE ---
const rawData = ref([]);
const summaryData = ref({});
const summaryLines = ref([]);
const dateHeaders = ref([]);
const dateRangeText = ref("");

const activeView = ref('summary');
const currentPage = ref(1);
const currentSummaryPage = ref(1);
const currentUnder60Page = ref(1);

const itemsPerPage = ref(8); 
const scrollProgress = ref(0);
const currentDateTime = ref('');
const onlyDate = ref('');

const under60Data = ref([]);

// --- HELPER / NORMALIZATION ---
const normalizeGroup = (group) => {
  if (!group) return "-";
  const g = group.toUpperCase();
  const match = g.match(/LINE\s+([A-Z])(\d{2})/);
  if (match) {
    return `SOOM SONTEX LINE ${match[1]}${match[2]}`;
  }
  return g;
};

// --- LOGIKA PERIODE (MENGIKUTI LINKING) ---
const activePeriodeHeaders = computed(() => {
  const periods = new Set();
  rawData.value.forEach(row => {
    if (row.xPeriode) periods.add(row.xPeriode);
  });
  // Mengurutkan periode (misal: JAM 08 AM, JAM 10 AM, dst)
  return Array.from(periods).sort(); 
});

// --- GROUPING DATA ---
const groupedData = computed(() => {
  const groups = {};

  // Filter data khusus Sontex dan line yang valid
  const filtered = rawData.value.filter(r => {
    const work = (r.xWorkName || "").toUpperCase();
    const group = (r.xGroup || "").toUpperCase();
    
    const isValidWork = work.includes("STKB - KOMPLIT") || work.includes("STIK");
    const isValidLine = group.includes("SOOM SONTEX");

    return r.xLine === "SONTEX" && isValidWork && isValidLine;
  });

  filtered.forEach(row => {
    // Key unik gabungan Nama, Style(Mark), dan Proses
    const key = `${row.xEmplName}_${row.xMark}_${row.xWorkName}`;

    if (!groups[key]) {
      groups[key] = {
        xEmplCode: row.xEmplCode,
        xEmplName: row.xEmplName,
        xTarget3Jam: row.xTarget3Jam || 0,
        xJoinDate: row.xJoinDate,
        xJoinMonth: row.xJoinMonth,
        xGroup: normalizeGroup(row.xGroup),
        xWorkName: row.xWorkName,
        xMark: row.xMark,
        xtRealRate: row.xtRealRate || 0,
        periodeQty: {} // Objek untuk menyimpan qty per periode
      };
    }

    if (row.xPeriode) {
      // Akumulasi qty berdasarkan periode dari API
      groups[key].periodeQty[row.xPeriode] = (groups[key].periodeQty[row.xPeriode] || 0) + row.xQty;
    }
  });

  return Object.values(groups);
});

// --- FINAL CALCULATION ---
const filteredByActiveHours = computed(() => {
  return groupedData.value.map(item => {
    const total = Object.values(item.periodeQty).reduce((a, b) => a + b, 0);
    return { 
      ...item, 
      currentTotal: total,
      computedRate: item.xtRealRate 
    };
  }).filter(item => item.currentTotal > 0);
});

// --- FORMATTERS ---
const formatLineName = (name) => {
  if (!name) return "-";
  const match = name.match(/LINE\s+([A-Z0-9]+)/);
  return match ? match[1] : name;
};

const formatLOS = (m) => {
  if (m === null || m === undefined || m < 0) return '-';
  if (m === 0) return 'Baru';
  const y = Math.floor(m / 12);
  const mm = m % 12;
  return `${y ? y + 'th ' : ''}${mm ? mm + 'bln' : ''}`.trim();
};

const formatJoinDate = (dStr) => {
  if (!dStr) return '-';
  const d = new Date(dStr);
  return isNaN(d.getTime()) ? dStr : d.toLocaleDateString('id-ID');
};

const formatDate = (dStr) =>
  dStr ? `${new Date(dStr).getDate()}/${new Date(dStr).getMonth() + 1}` : "";

const getHealthClasses = (val) => {
  const v = Math.round(val || 0);
  if (v === 0) return 'text-secondary opacity-25 bg-light';
  if (v < 50) return 'bg-danger text-white';
  if (v <= 70) return 'bg-warning text-dark';
  return 'bg-success text-white';
};

// --- DATA FETCHING ---
const fetchAllData = async () => {
  try {
    // 1. SUMMARY (Sama dengan Linking untuk data tabel summary)
    const resSummary = await axios.get(`${API_BASE_URL}/tv-target-linkinga/summary-linking`);
    if (resSummary.data.success) {
      const dept = resSummary.data.departments.find(d => d.deptName === "SONTEX");
      if (dept) {
        summaryLines.value = dept.lines.filter(l =>
          l.lineName.toUpperCase().includes("SOOM SONTEX")
        ).map(l => ({
          ...l,
          lineName: normalizeGroup(l.lineName)
        }));
      }
      dateHeaders.value = resSummary.data.meta.dateHeaders || [];
      dateRangeText.value = `PERIODE: ${resSummary.data.meta.sbDate} S/D ${resSummary.data.meta.seDate}`;
    }

    // 2. CARDS (Hasil Sontex)
    const resCards = await axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-sontex`);
    summaryData.value = resCards.data;

    // 3. DETAIL PRODUKSI (Endpoint Sontex yang baru)
    const resDetail = await axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-produksi-sontex`);
    if (resDetail.data && resDetail.data.status === "success") {
      rawData.value = resDetail.data.data || [];
    }

    // 4. UNDER 60 (Endpoint khusus Sontex)
    const resUnder60 = await axios.get(`${API_BASE_URL}/tv-target-linkinga/karayawansontexunder60persen`);
    if (resUnder60.data.success) {
      under60Data.value = resUnder60.data.data
  .filter(x => x.xJoinMonth > 4 && x.xTRealRate < 50 && x.xTRealRate > 0)
  .map(x => ({
    xLine: x.xGroup, // atau x.xLine (lihat mana yg benar)
    xGroup: normalizeGroup(x.xGroup),
    xEmplName: x.xEmplName,
    xJoinMonth: x.xJoinMonth,
    xTRealRate: x.xTRealRate
  }))
  .sort((a, b) => a.xTRealRate - b.xTRealRate);
    }
  } catch (e) {
    console.error("Gagal fetch data:", e);
  }
};

// --- DISPLAY LOGIC / LOOP ---
const animate = (time) => new Promise(res => {
  const start = Date.now();
  const int = setInterval(() => {
    const elapsed = Date.now() - start;
    scrollProgress.value = (elapsed / time) * 100;
    if (elapsed >= time) {
      clearInterval(int);
      res();
    }
  }, 50);
});

const startDisplayLoop = async () => {
  const DURATION = 15000;

  while (true) {
    activeView.value = 'summary';
    await animate(DURATION);

    activeView.value = 'summary-table';
    const totalSumPages = Math.ceil(summaryLines.value.length / itemsPerPage.value) || 1;
    for (let p = 1; p <= totalSumPages; p++) {
      currentSummaryPage.value = p;
      await animate(DURATION);
    }

    activeView.value = 'under60';
    const uPages = Math.ceil(under60Data.value.length / itemsPerPage.value) || 1;
    for (let p = 1; p <= uPages; p++) {
      currentUnder60Page.value = p;
      await animate(DURATION);
    }

    activeView.value = 'table';
    const totalPages = Math.ceil(filteredByActiveHours.value.length / itemsPerPage.value) || 1;
    for (let p = 1; p <= totalPages; p++) {
      currentPage.value = p;
      await animate(DURATION);
    }
  }
};

// --- PAGINATION COMPUTED ---
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredByActiveHours.value.slice(start, start + itemsPerPage.value);
});

const paginatedSummaryTable = computed(() => {
  const start = (currentSummaryPage.value - 1) * itemsPerPage.value;
  return summaryLines.value.slice(start, start + itemsPerPage.value);
});

const paginatedUnder60 = computed(() => {
  const start = (currentUnder60Page.value - 1) * itemsPerPage.value;
  return under60Data.value.slice(start, start + itemsPerPage.value);
});

const summaryCards = computed(() => ({
  "QTY Finish": { value: summaryData.value.today_finish || 0, icon: "bi-check-circle-fill text-success" },
  "Employee": { value: summaryData.value.attendance || 0, icon: "bi-people-fill text-info" }
}));

// --- INIT ---
onMounted(async () => {
  setInterval(() => {
    const now = new Date();
    currentDateTime.value = `${now.toLocaleDateString('id-ID')} (${now.toLocaleTimeString('id-ID')})`;
    onlyDate.value = now.toLocaleDateString('id-ID');
  }, 1000);

  await fetchAllData();
  startDisplayLoop();

  // Refresh data setiap 5 menit
  setInterval(fetchAllData, 300000);
});
</script>

<style scoped>
.bg-dark { background-color: #020617 !important; }
.bg-navy-gradient { background: linear-gradient(135deg, #0a2647 0%, #144272 100%) !important; }
.bg-navy { background-color: #0a2647 !important; }
.bg-navy-light { background-color: #1a3a5f !important; }
.bg-warning-light { background-color: #fff9e6 !important; }
.text-navy { color: #0a2647 !important; }
.fw-black { font-weight: 900 !important; }
.letter-spacing-2 { letter-spacing: 4px; }
.shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
.layout-fixed { table-layout: fixed; border-collapse: collapse; }
.layout-fixed td, .layout-fixed th { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease; position: absolute; width: 100%; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.main-wrapper { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
</style>