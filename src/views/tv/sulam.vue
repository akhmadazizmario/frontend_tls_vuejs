<template>
  <div class="container-fluid bg-dark vh-100 p-0 main-wrapper overflow-hidden text-white">
    
    <Transition name="fade">
      <div v-if="activeView === 'summary'" class="vh-100 d-flex flex-column justify-content-center align-items-center bg-navy-gradient p-5">
        <div class="text-center mb-5">
          <h1 class="display-1 fw-black letter-spacing-2 mb-2">PRODUCTION SUMMARY <br> SULAM DEPT</h1>
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
        <div class="mb-3 p-3 rounded-4 bg-danger text-white text-center shadow-lg">
          <h2 class="fw-black display-6 m-0">⚠️ KARYAWAN Hasil < 50% </h2>
          <p class="mb-0 fw-bold">DEPT SULAM</p>
        </div>
        <div class="flex-grow-1 shadow-2xl rounded-4 overflow-hidden border border-3 bg-white">
          <table class="table table-bordered m-0 h-100 text-center">
            <thead class="bg-dark text-white">
              <tr class="align-middle">
                <th style="width:5%" class="fs-3">NO</th>
                <th style="width:10%" class="fs-3">LINE</th>
                <th style="width:25%" class="fs-3">NAMA</th>
                <th style="width:15%" class="fs-3">MASA KERJA</th>
                <th style="width:10%" class="fs-3">RATE</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in paginatedUnder60" :key="index" class="align-middle">
                <td class="fw-bold text-muted">{{ (currentUnder60Page - 1) * itemsPerPage + index + 1 }}</td>
                <td class="fw-bold text-navy fs-2">{{ formatLineName(item.xLine) }}</td>
                <td class="text-start fw-black fs-2 text-black text-uppercase">{{ item.xEmplName }}</td>
                <td class="fw-bold text-primary fs-2">{{ formatLOS(item.xJoinMonth) }}</td>
                <td class="fw-black text-white fs-1" :class="item.xRealRate < 50 ? 'bg-danger' : 'bg-warning text-dark'">
                  {{ Math.round(item.xTRealRate) }}%
                </td>
              </tr>
              <tr v-if="under60Data.length === 0">
                <td colspan="7" class="text-center text-muted fw-bold py-5 fs-2">✅ Tidak ada karyawan di bawah 50%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="activeView === 'summary-table'" class="vh-100 d-flex flex-column p-2 bg-navy-gradient overflow-hidden">
        <div class="mb-2 p-2 rounded-4 bg-white shadow-lg text-center border-bottom border-warning border-4">
          <h2 class="fw-black text-navy mb-0">📊 SUMMARY ALL LINES SULAM</h2>
          <p class="text-muted fw-bold fs-5 mb-0">{{ dateRangeText }}</p>
        </div>
        <div class="flex-grow-1 rounded-3 shadow-2xl overflow-hidden bg-white">
          <table class="table table-bordered m-0 w-100 h-100 layout-fixed" style="border-color: black;">
            <thead>
              <tr class="bg-navy text-white text-center">
                <th class="align-middle fs-5" style="width: 15%">LINE NAME</th>
                <th class="align-middle fs-6" style="width: 5%">ORG</th>
                <th v-for="d in dateHeaders" :key="d" class="align-middle border-light fs-5">{{ formatDate(d) }}</th>
                <th class="align-middle fs-5 bg-dark text-warning" style="width: 7%">AVG</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in paginatedSummaryTable" :key="i" class="align-middle text-center">
                <td class="fs-2 fw-black text-navy text-start px-2 bg-light">{{ formatLineName(row.lineName) }}</td>
                <td class="fs-4 fw-bold text-dark">{{ row.totalEmployees }}</td>
                <td v-for="(_, idx) in dateHeaders" :key="idx" class="fs-4 fw-bold" :class="getHealthClasses(row[`g${String(idx + 1).padStart(2, '0')}`])">
                  {{ Math.round(row[`g${String(idx + 1).padStart(2, '0')}`] || 0) }}%
                </td>
                <td class="fs-4 fw-black" :class="getHealthClasses(row.avgEfficiency)">
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
      <h2 class="m-0 fw-black text-navy display-6 text-uppercase">Data Hasil Produksi Operator <br> SULAM</h2>
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

/* ===============================
   STATE
================================= */
const rawData = ref([]);
const summaryData = ref({});
const summaryLines = ref([]);
const under60Data = ref([]);

const dateHeaders = ref([]);
const dateRangeText = ref("");

const activeView = ref('summary');

const currentPage = ref(1);
const currentSummaryPage = ref(1);
const currentUnder60Page = ref(1);

const itemsPerPage = ref(8);
const scrollProgress = ref(0);
const currentDateTime = ref('');

/* ===============================
   NORMALIZE / FORMAT LINE
================================= */
const normalizeGroup = (name) => {
  if (!name) return "-";

  const g = name.toUpperCase();
  const match = g.match(/LINE\s+([A-Z])(\d{2})/);

  if (match) {
    return `SULAM LINE ${match[1]}${match[2]}`;
  }

  return g.replace("SULAM.", "").replace("SULAM", "").trim();
};

const formatLineName = (name) => {
  if (!name) return "-";

  const match = name.match(/LINE\s+([A-Z0-9]+)/);

  return match ? match[1] : name.replace("SULAM", "").trim();
};

/* ===============================
   PERIODE DINAMIS (MODEL SONTEX)
================================= */
const activePeriodeHeaders = computed(() => {
  const periods = new Set();

  rawData.value.forEach(row => {
    if (row.xPeriode) periods.add(row.xPeriode);
  });

  return Array.from(periods).sort();
});

/* ===============================
   GROUP DATA PRODUKSI
================================= */
const groupedData = computed(() => {
  const groups = {};

  rawData.value.forEach(row => {
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
      groups[key].periodeQty[row.xPeriode] =
        (groups[key].periodeQty[row.xPeriode] || 0) + Number(row.xQty || 0);
    }
  });

  return Object.values(groups);
});

/* ===============================
   TOTAL OUTPUT
================================= */
const filteredByActiveHours = computed(() => {
  return groupedData.value
    .map(item => {
      const total = Object.values(item.periodeQty)
        .reduce((a, b) => a + b, 0);

      return {
        ...item,
        currentTotal: total
      };
    })
    .filter(item => item.currentTotal > 0);
});

/* ===============================
   SUMMARY CARDS
================================= */
const summaryCards = computed(() => ({
  "QTY Finish": {
    value: summaryData.value.today_finish || 0,
    icon: "bi-check-circle-fill text-success"
  },
  "Employee": {
    value: summaryData.value.attendance || 0,
    icon: "bi-people-fill text-info"
  }
}));

/* ===============================
   PAGINATION
================================= */
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;

  return filteredByActiveHours.value.slice(
    start,
    start + itemsPerPage.value
  );
});

const paginatedSummaryTable = computed(() => {
  const start = (currentSummaryPage.value - 1) * itemsPerPage.value;

  return summaryLines.value.slice(
    start,
    start + itemsPerPage.value
  );
});

const paginatedUnder60 = computed(() => {
  const start = (currentUnder60Page.value - 1) * itemsPerPage.value;

  return under60Data.value.slice(
    start,
    start + itemsPerPage.value
  );
});

/* ===============================
   FORMATTERS
================================= */
const formatLOS = (m) => {
  if (m === null || m === undefined || m < 0) return '-';
  if (m === 0) return 'Baru';

  const y = Math.floor(m / 12);
  const mm = m % 12;

  return `${y ? y + ' Th ' : ''}${mm ? mm + ' Bln' : ''}`.trim();
};

const formatJoinDate = (d) => {
  if (!d) return '-';

  const dt = new Date(d);

  return isNaN(dt.getTime())
    ? '-'
    : dt.toLocaleDateString('id-ID');
};

const formatDate = (dStr) => {
  if (!dStr) return '';

  const d = new Date(dStr);

  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const getHealthClasses = (val) => {
  const v = Math.round(val || 0);

  if (v === 0) return 'text-secondary opacity-25 bg-light';
  if (v < 50) return 'bg-danger text-white';
  if (v <= 70) return 'bg-warning text-dark';

  return 'bg-success text-white';
};

/* ===============================
   FETCH DATA
================================= */
const fetchAllData = async () => {
  try {
    const [
      resSummary,
      resCards,
      resDetail,
      resUnder
    ] = await Promise.all([
      axios.get(`${API_BASE_URL}/tv-target-linkinga/summary-linking`),
      axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-sulam`),
      axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-produksi-sulam`),
      axios.get(`${API_BASE_URL}/tv-target-linkinga/karayawansulamunder60persen`)
    ]);

    /* SUMMARY TABLE */
    if (resSummary.data.success) {
      const dept = resSummary.data.departments.find(
        d => d.deptName === "SULAM"
      );

      if (dept) {
        summaryLines.value = dept.lines
          .filter(line =>
            line.lineName.toUpperCase().includes("SULAM")
          )
          .map(line => ({
            ...line,
            lineName: normalizeGroup(line.lineName)
          }));
      }

      dateHeaders.value =
        resSummary.data.meta.dateHeaders || [];

      dateRangeText.value =
        `PERIODE: ${resSummary.data.meta.sbDate} S/D ${resSummary.data.meta.seDate}`;
    }

    /* SUMMARY CARD */
    summaryData.value = resCards.data || {};

    /* DETAIL PRODUKSI */
    if (resDetail.data.status === "success") {
      rawData.value = (resDetail.data.data || []).map(row => ({
        ...row,
        xGroup: normalizeGroup(row.xGroup)
      }));
    }

    /* UNDER 50 */
    if (resUnder.data.success) {
      under60Data.value = (resUnder.data.data || [])
        .filter(x =>
          x.xJoinMonth > 4 &&
          x.xTRealRate < 50 &&
          x.xTRealRate > 0
        )
        .map(x => ({
          ...x,
          xLine: normalizeGroup(x.xGroup)
        }))
        .sort((a, b) => a.xTRealRate - b.xTRealRate);
    }

  } catch (error) {
    console.error("Error SULAM:", error);
  }
};

/* ===============================
   ANIMATION
================================= */
const animate = (time) =>
  new Promise(resolve => {
    const start = Date.now();

    const int = setInterval(() => {
      const elapsed = Date.now() - start;

      scrollProgress.value =
        (elapsed / time) * 100;

      if (elapsed >= time) {
        clearInterval(int);
        resolve();
      }
    }, 50);
  });

/* ===============================
   DISPLAY LOOP
================================= */
const startDisplayLoop = async () => {
  const DURATION = 12000;

  while (true) {

    activeView.value = 'summary';
    await animate(DURATION);

    activeView.value = 'under60';
    {
      const totalPages =
        Math.ceil(
          under60Data.value.length /
          itemsPerPage.value
        ) || 1;

      for (let p = 1; p <= totalPages; p++) {
        currentUnder60Page.value = p;
        await animate(DURATION);
      }
    }

    activeView.value = 'summary-table';
    {
      const totalPages =
        Math.ceil(
          summaryLines.value.length /
          itemsPerPage.value
        ) || 1;

      for (let p = 1; p <= totalPages; p++) {
        currentSummaryPage.value = p;
        await animate(DURATION);
      }
    }

    activeView.value = 'table';
    {
      const totalPages =
        Math.ceil(
          filteredByActiveHours.value.length /
          itemsPerPage.value
        ) || 1;

      for (let p = 1; p <= totalPages; p++) {
        currentPage.value = p;
        await animate(DURATION);
      }
    }
  }
};

/* ===============================
   INIT
================================= */
onMounted(async () => {

  setInterval(() => {
    const now = new Date();

    currentDateTime.value =
      `${now.toLocaleDateString('id-ID')} (${now.toLocaleTimeString('id-ID')})`;
  }, 1000);

  await fetchAllData();

  startDisplayLoop();

  /* refresh tiap 1 jam */
  setInterval(fetchAllData, 3600000);
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
</style>