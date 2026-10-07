<template>
  <div class="container-fluid bg-dark vh-100 p-0 main-wrapper overflow-hidden text-white">
    
    <div v-if="isLoading" class="vh-100 d-flex justify-content-center align-items-center bg-navy-gradient">
      <div class="text-center">
        <div class="spinner-border text-warning" style="width: 4rem; height: 4rem;"></div>
        <h2 class="mt-4 fw-black">MEMUAT DATA {{ activeDept }}...</h2>
      </div>
    </div>

    <template v-else>
      <Transition name="fade">
        <div v-if="activeView === 'summary'" class="vh-100 d-flex flex-column justify-content-center align-items-center bg-navy-gradient p-5">
          <div class="text-center mb-5">
            <h1 class="display-1 fw-black letter-spacing-2 mb-2 text-uppercase">
              PRODUCTION SUMMARY {{ activeDept }}
            </h1>
            <h3 class="display-4 text-warning fw-bold">{{ currentDateTime }}</h3>
            <span class="badge bg-danger fs-4 px-4 py-2 mt-2">SHIFT {{ new Date().getHours() < 14 ? '1' : '2' }} ACTIVE</span>
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
            <h2 class="fw-black display-6 m-0">⚠️ KARYAWAN {{ activeDept }} hasil < 50% </h2>
            <p class="mb-0 fw-bold"></p>
          </div>
          <div class="flex-grow-1 shadow-2xl rounded-4 overflow-hidden border border-3 bg-white">
            <table class="table table-bordered m-0 h-100 text-center">
              <thead class="bg-dark text-white">
                <tr class="align-middle">
                  <th style="width:5%" class="fs-3">NO</th>
                  <th style="width:10%" class="fs-3">LINE</th>
                  <th style="width:25%" class="fs-3">NAMA</th>
                  <th style="width:15%" class="fs-3">MASA KERJA</th>
                  <!-- <th style="width:20%" class="fs-3">PROSES</th>
                  <th style="width:15%" class="fs-3">STYLE / PO</th> -->
                  <th style="width:10%" class="fs-3">RATE</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in paginatedUnder60" :key="index" class="align-middle">
                  <td class="fw-bold text-muted">{{ (currentUnderPage - 1) * itemsPerPage + index + 1 }}</td>
                  <td class="fw-bold text-navy fs-2">{{ formatLineRingkas(item.xGroup) }}</td>
                  <td class="text-start fw-black fs-2 text-black text-uppercase">{{ item.xEmplName }}</td>
                  <td class="fw-bold text-primary fs-2">{{ formatLOS(item.xJoinMonth) }}</td>
                  <!-- <td class="fw-bold text-muted fs-2 text-truncate">{{ item.xWorkName }}</td>
                  <td class="fw-bold text-dark fs-2 text-truncate">{{ item.xPO || '-' }}</td> -->
                  <td class="fw-black text-white fs-1" :class="item.xTRealRate < 50 ? 'bg-danger' : 'bg-warning text-dark'">
                    {{ Math.round(item.xTRealRate) }}%
                  </td>
                </tr>
                <tr v-if="paginatedUnder60.length === 0">
                  <td colspan="7" class="text-center text-muted fw-bold py-5 fs-1">✅ Semua karyawan di atas 50%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="activeView === 'summary-table'" class="vh-100 d-flex flex-column p-2 bg-navy-gradient overflow-hidden">
          <div class="mb-2 p-2 rounded-4 bg-white shadow-lg text-center border-bottom border-warning border-4">
            <h2 class="fw-black text-navy mb-0 text-uppercase">📊 SUMMARY ALL LINES {{ activeDept }}</h2>
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
                  <td class="fs-2 fw-black text-navy text-start px-2 bg-light">{{ formatLineRingkas(row.lineName) }}</td>
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
  <div
    v-if="activeView === 'table'"
    class="vh-100 d-flex flex-column p-3 bg-white text-dark overflow-hidden"
  >
    <div
      class="d-flex justify-content-between align-items-center mb-3 px-5 py-2 bg-light rounded-pill border-start border-warning border-10 shadow-sm"
    >
      <h2 class="m-0 fw-black text-navy display-6 text-uppercase">
        Data Hasil Produksi Operator {{ activeDept }}
      </h2>

      <div class="badge bg-navy px-4 py-2 fs-4">
        {{ currentDateTime }}
      </div>
    </div>

    <div class="flex-grow-1 shadow-2xl rounded-4 overflow-hidden border border-3 bg-white">
      <table class="table table-bordered m-0 h-100 layout-fixed text-center">

        <!-- HEADER -->
        <thead class="bg-navy text-white text-center">
          <tr>
            <th rowspan="2" class="fs-4 align-middle" style="width:4%">NO</th>
            <th rowspan="2" class="fs-4 align-middle" style="width:5%">LINE</th>
            <th rowspan="2" class="fs-4 align-middle" style="width:15%">OPERATOR</th>
            <!-- <th rowspan="2" class="fs-4 align-middle" style="width:8%">JOIN</th> -->
            <th rowspan="2" class="fs-4 align-middle" style="width:8%">MASA KERJA</th>
            <th rowspan="2" class="fs-4 align-middle" style="width:12%">STYLE</th>
            <th rowspan="2" class="fs-4 align-middle" style="width:14%">PROSES</th>
            <th rowspan="2" class="fs-4 align-middle" style="width: 8%">TARGET </th>
            <th
              :colspan="activePeriodeHeaders.length"
              class="bg-navy-light text-white fs-5 py-2"
            >
              OUTPUT PER PERIODE
            </th>

            <th rowspan="2" class="bg-dark text-warning fs-5 align-middle" style="width:6%">
              TOTAL
            </th>
          </tr>

          <tr class="bg-light text-navy">
            <th
              v-for="periode in activePeriodeHeaders"
              :key="periode"
              class="fs-5 py-1"
            >
              {{ periode }}
            </th>
          </tr>
        </thead>

        <!-- BODY -->
        <tbody>
          <tr
            v-for="(item, index) in paginatedData"
            :key="index"
            class="align-middle border-2 text-center"
          >
            <td class="fw-bold fs-5 text-muted">
              {{ (currentPage - 1) * itemsPerPage + index + 1 }}
            </td>

            <td class="fs-3 text-muted fw-bold">
              {{ formatLineRingkas(item.xGroup) }}
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

            <!-- PERIODE -->
            <td
              v-for="periode in activePeriodeHeaders"
              :key="periode"
              class="fs-1 fw-black border-start"
              :class="{ 'bg-warning-light': item.periodeQty[periode] }"
            >
              {{ item.periodeQty[periode] || '-' }}
            </td>

            <!-- TOTAL -->
            <td class="fw-black bg-navy text-white display-6 fs-1">
              {{ item.currentTotal }}
            </td>
          </tr>

          <tr v-if="paginatedData.length === 0">
            <td
              :colspan="8 + activePeriodeHeaders.length"
              class="text-center py-5 fs-2 fw-bold text-muted"
            >
              Belum ada data produksi
            </td>
          </tr>
        </tbody>

      </table>
    </div>
  </div>
</Transition>
    </template>

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

/* ==================================================
   STATE
================================================== */
const sewingData = ref({ cards: {}, summaryLines: [], operators: [], under80: [] });
const loData = ref({ cards: {}, summaryLines: [], operators: [], under80: [] });

const activeDept = ref('SEWING');
const activeView = ref('summary');
const isLoading = ref(true);

const dateHeaders = ref([]);
const dateRangeText = ref("");
const currentDateTime = ref('');

const currentPage = ref(1);
const currentSummaryPage = ref(1);
const currentUnderPage = ref(1);

const scrollProgress = ref(0);
const itemsPerPage = ref(8);

/* ==================================================
   FORMATTER
================================================== */
const formatJoinDate = (dStr) => {
  if (!dStr) return '-';
  const d = new Date(dStr);
  return isNaN(d.getTime()) ? dStr : d.toLocaleDateString('id-ID');
};

const formatLOS = (m) => {
  if (!m || m < 1) return '-';

  const y = Math.floor(m / 12);
  const mon = m % 12;

  return y > 0 ? `${y} Th ${mon} Bln` : `${mon} Bln`;
};

const formatDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const formatLineRingkas = (name) => {
  if (!name) return "-";

  const match = name.match(/([A-Z]\d{2})/);
  if (match) return match[1];

  return name
    .replace(/STICK LINE/gi, "")
    .replace(/L\.O LINE/gi, "")
    .replace(/LO LINE/gi, "")
    .trim();
};

const getHealthClasses = (v) => {
  v = Math.round(v || 0);

  if (v === 0) return 'text-secondary opacity-25 bg-light';
  if (v < 50) return 'bg-danger text-white';
  if (v <= 70) return 'bg-warning text-dark';

  return 'bg-success text-white';
};

/* ==================================================
   PERIODE MODE (SAMA KAYAK SULAM)
================================================== */
const activePeriodeHeaders = computed(() => {
  const rows =
    activeDept.value === 'SEWING'
      ? sewingData.value.operators
      : loData.value.operators;

  const periods = new Set();

  rows.forEach(row => {
    if (row.xPeriode) periods.add(row.xPeriode);
  });

  return Array.from(periods).sort();
});

/* ==================================================
   FILTER GROUP
================================================== */
const isValidDeptRow = (groupName, dept) => {
  const g = (groupName || "").toUpperCase();

  if (dept === 'SEWING') return g.includes("STICK");
  if (dept === 'LO') return g.includes("L.O") || g.includes("LO");

  return true;
};

/* ==================================================
   DATA PRODUKSI PAKAI PERIODE
================================================== */
const getFilteredOps = (data, dept) => {
  const groups = {};

  data.forEach(row => {
    if (!isValidDeptRow(row.xGroup, dept)) return;

    const key =
      `${row.xEmplCode}_${row.xMark}_${row.xWorkName}`;

    if (!groups[key]) {
      groups[key] = {
        xEmplCode: row.xEmplCode,
        xEmplName: row.xEmplName,
        xTarget3Jam: row.xTarget3Jam || 0,
        xJoinMonth: row.xJoinMonth,
        xGroup: row.xGroup,
        xWorkName: row.xWorkName,
        xMark: row.xMark,
        xRealRate: row.xRealRate,
        xtRealRate: row.xtRealRate || 0,
        periodeQty: {}
      };
    }

    if (row.xPeriode) {
      groups[key].periodeQty[row.xPeriode] =
        (groups[key].periodeQty[row.xPeriode] || 0) +
        (row.xQty || 0);
    }
  });

  return Object.values(groups)
    .map(item => {
      const total =
        Object.values(item.periodeQty)
          .reduce((a, b) => a + b, 0);

      return {
        ...item,
        currentTotal: total
      };
    })
    .filter(item => item.currentTotal > 0);
};

/* ==================================================
   FETCH DATA
================================================== */
const fetchAllData = async () => {
  try {
    const [
      resSum,

      resSewC,
      resSewD,
      resSewU,

      resLoC,
      resLoD,
      resLoU
    ] = await Promise.all([
      axios.get(`${API_BASE_URL}/tv-target-linkinga/summary-linking`),

      axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-sewing`),
      axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-produksi-sewing`),
      axios.get(`${API_BASE_URL}/tv-target-linkinga/karayawansontexunder60persen`),

      axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-lo`),
      axios.get(`${API_BASE_URL}/tv-target-linkinga/hasil-produksi-lo`),
      axios.get(`${API_BASE_URL}/tv-target-linkinga/karayawansewinglounder60persen`)
    ]);

    /* SUMMARY */
    if (resSum.data.success) {
      const depts = resSum.data.departments || [];

      sewingData.value.summaryLines =
        (depts.find(d => d.deptName === "STICK")?.lines || [])
          .filter(l =>
            (l.lineName || "")
              .toUpperCase()
              .includes("STICK")
          );

      loData.value.summaryLines =
        depts.find(d => d.deptName === "LO")?.lines || [];

      dateHeaders.value =
        resSum.data.meta?.dateHeaders || [];

      dateRangeText.value =
        `PERIODE: ${resSum.data.meta?.sbDate} S/D ${resSum.data.meta?.seDate}`;
    }

    /* SEWING */
    sewingData.value.cards = resSewC.data;

    sewingData.value.operators =
      resSewD.data.data || [];

    sewingData.value.under80 =
      (resSewU.data.data || [])
        .filter(x =>
          x.xJoinMonth > 4 &&
          x.xTRealRate < 50 &&
          isValidDeptRow(x.xGroup, 'SEWING')
        );

    /* LO */
    loData.value.cards = resLoC.data;

    loData.value.operators =
      resLoD.data.data || [];

    loData.value.under80 =
      (resLoU.data.data || [])
        .filter(x =>
          x.xJoinMonth > 4 &&
          x.xTRealRate < 50 &&
          isValidDeptRow(x.xGroup, 'LO')
        );

    isLoading.value = false;

  } catch (err) {
    console.error("Fetch Error:", err);
  }
};

/* ==================================================
   LOOP VIEW
================================================== */
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

const runCycle = async (dept) => {
  activeDept.value = dept;

  const currentSet =
    dept === 'SEWING'
      ? sewingData.value
      : loData.value;

  const DURATION = 12000;

  activeView.value = 'summary';
  await animate(DURATION);

  activeView.value = 'under60';

  const uPages =
    Math.ceil(
      currentSet.under80.length /
      itemsPerPage.value
    ) || 1;

  for (let p = 1; p <= uPages; p++) {
    currentUnderPage.value = p;
    await animate(DURATION);
  }

  activeView.value = 'summary-table';

  const sPages =
    Math.ceil(
      currentSet.summaryLines.length /
      itemsPerPage.value
    ) || 1;

  for (let p = 1; p <= sPages; p++) {
    currentSummaryPage.value = p;
    await animate(DURATION);
  }

  activeView.value = 'table';

  const ops =
    getFilteredOps(
      currentSet.operators,
      dept
    );

  const tPages =
    Math.ceil(
      ops.length /
      itemsPerPage.value
    ) || 1;

  for (let p = 1; p <= tPages; p++) {
    currentPage.value = p;
    await animate(DURATION);
  }
};

const startDisplayLoop = async () => {
  while (true) {
    await runCycle('SEWING');
    await runCycle('LO');
  }
};

/* ==================================================
   COMPUTED
================================================== */
const currentDeptSet = computed(() =>
  activeDept.value === 'SEWING'
    ? sewingData.value
    : loData.value
);

const summaryCards = computed(() => ({
  "QTY Finish": {
    value:
      currentDeptSet.value.cards?.today_finish || 0,
    icon: "bi-check-circle-fill text-success"
  },
  "Employee": {
    value:
      currentDeptSet.value.cards?.attendance || 0,
    icon: "bi-people-fill text-info"
  }
}));

const paginatedUnder60 = computed(() => {
  const start =
    (currentUnderPage.value - 1) *
    itemsPerPage.value;

  return currentDeptSet.value.under80.slice(
    start,
    start + itemsPerPage.value
  );
});

const paginatedSummaryTable = computed(() => {
  const start =
    (currentSummaryPage.value - 1) *
    itemsPerPage.value;

  return currentDeptSet.value.summaryLines.slice(
    start,
    start + itemsPerPage.value
  );
});

const paginatedData = computed(() => {
  const all =
    getFilteredOps(
      currentDeptSet.value.operators,
      activeDept.value
    );

  const start =
    (currentPage.value - 1) *
    itemsPerPage.value;

  return all.slice(
    start,
    start + itemsPerPage.value
  );
});

/* ==================================================
   INIT
================================================== */
onMounted(async () => {
  setInterval(() => {
    const now = new Date();

    currentDateTime.value =
      `${now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })} (time: ${now.toLocaleTimeString('id-ID')})`;
  }, 1000);

  await fetchAllData();

  if (!isLoading.value) {
    startDisplayLoop();
  }

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
.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease; position: absolute; width: 100%; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>