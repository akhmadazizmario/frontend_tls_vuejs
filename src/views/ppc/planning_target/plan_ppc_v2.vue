<template>
  <div class="d-flex flex-column min-vh-100 bg-light mt-3">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-5 transition-all" :style="{ marginLeft: sidebarOpen ? '16rem' : '0' }">

        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div class="d-flex align-items-center gap-3">
            <div class="page-title-icon">
              <i class="bi bi-calendar2-week-fill"></i>
            </div>
            <div>
              <h2 class="h4 fw-bold text-dark mb-0">Planning PPC Target</h2>
              <p class="text-muted small mb-0">Kelola dan pantau target produksi Finishing &amp; Linking</p>
            </div>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-2">
            <div class="sync-bar">
              <i class="bi bi-arrow-left-right sync-bar-icon"></i>
              <span class="sync-bar-label">Sinkronisasi Target</span>
              <button class="btn btn-sync" @click="handleSync" :disabled="syncLoading">
                <span v-if="syncLoading" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="bi bi-arrow-repeat"></i>
                {{ syncLoading ? 'Proses...' : 'Jalankan' }}
              </button>
            </div>

            <a href="/update_plan_ppc" class="btn btn-update-qty">
              <i class="bi bi-pencil-square"></i> Update Qty Plan
            </a>
          </div>
        </div>

        <!-- ============================================================ -->
        <!-- STICKY TOOLBAR: tab, tanggal, aksi, & semua filter checkbox   -->
        <!-- Tetap kelihatan pas scroll ke bawah supaya user gak perlu    -->
        <!-- scroll balik ke atas cuma buat ganti filter/export.          -->
        <!-- ============================================================ -->
        <div class="sticky-toolbar">
          <!-- TAB / SLIDE: FINISHING | LINKING -->
          <div class="tab-pill-group mb-3">
            <button type="button" class="tab-pill" :class="{ active: activeTab === 'finishing' }" @click="activeTab = 'finishing'">
              <i class="bi bi-scissors"></i> Finishing
            </button>
            <button type="button" class="tab-pill" :class="{ active: activeTab === 'linking' }" @click="activeTab = 'linking'">
              <i class="bi bi-link-45deg"></i> Linking
            </button>
            <a href="/teamtarget" class="btn btn-success ms-auto ms-sm-0"><i class="bi bi-people"></i> Team</a>
          </div>

          <div class="card border-0 shadow-sm mb-3 rounded-4 filter-card">
            <div class="card-body p-3 p-md-4">
              <div class="toolbar-row">
                <div class="toolbar-date-group">
                  <div>
                    <label class="form-label-modern">Tgl Tampilan Mulai</label>
                    <input type="date" v-model="filters.startDate" class="form-control form-control-modern" />
                  </div>
                  <div>
                    <label class="form-label-modern">Tgl Tampilan Selesai</label>
                    <input type="date" v-model="filters.endDate" class="form-control form-control-modern" />
                  </div>
                </div>
                <div class="toolbar-action-group">
                  <button class="btn btn-reload" @click="fetchData" :disabled="dataLoading">
                    <i class="bi bi-arrow-clockwise"></i> Reload Data
                  </button>
                  <div class="dropdown">
                    <button class="btn btn-export" data-bs-toggle="dropdown" :disabled="!hasFetchedData">
                      <i class="bi bi-filetype-xlsx"></i> Export Excel <i class="bi bi-chevron-down small ms-1"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end p-2 shadow-lg border-0 mt-1 rounded-3">
                      <button type="button" class="dropdown-item rounded-2 py-2" @click="exportToExcel(false)">
                        <i class="bi bi-file-earmark-excel me-2 text-success"></i>
                        Export Sesuai Filter
                        <div class="small text-muted">1 sheet, gedung ikut digabung/dipisah kalau filter mengizinkan</div>
                      </button>
                      <button type="button" class="dropdown-item rounded-2 py-2" @click="exportToExcel(true)">
                        <i class="bi bi-file-earmark-excel-fill me-2 text-primary"></i>
                        Export Pisah per Gedung
                        <div class="small text-muted">Tiap Gedung jadi sheet terpisah dalam 1 file</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- FILTER BAR: generik, loop dari FILTER_COLUMNS -->
          <div class="card border-0 shadow-sm mb-3 rounded-4 filter-card" v-if="hasFetchedData || dataLoading">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                <span class="filter-bar-title"><i class="bi bi-funnel-fill me-1"></i>Filter Data</span>
                <button v-if="hasAnyFilterActive" type="button" class="btn btn-reset-all" @click="resetAllFilters">
                  <i class="bi bi-x-circle me-1"></i>Reset Semua Filter
                </button>
              </div>
              <div class="filter-grid">
                <div class="filter-grid-item" v-for="col in FILTER_COLUMNS" :key="col.key">
                  <label class="form-label-modern">Filter {{ col.label }}</label>
                  <div class="dropdown w-100">
                    <button type="button" class="btn btn-filter-dropdown w-100" data-bs-toggle="dropdown">
                      <span class="text-truncate">
                        {{ selectedFilters[col.key].length ? selectedFilters[col.key].length + ' ' + col.label.toLowerCase() + ' dipilih' : 'Semua ' + col.label }}
                      </span>
                      <i class="bi bi-chevron-down flex-shrink-0"></i>
                    </button>
                    <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 filter-dropdown-panel w-100">
                      <div class="input-group input-group-sm mb-2">
                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                        <input type="text" v-model="searchTerms[col.key]" class="form-control border-start-0" :placeholder="'Cari ' + col.label.toLowerCase() + '...'">
                      </div>
                      <div class="filter-scroll custom-scrollbar">
                        <div v-if="getUniqueOptions(col.key, searchTerms[col.key]).length === 0" class="small text-muted text-center py-2">Tidak ada data</div>
                        <div v-for="opt in getUniqueOptions(col.key, searchTerms[col.key])" :key="opt" class="form-check mb-1">
                          <input type="checkbox" class="form-check-input" :id="col.key+'f-'+opt" :value="opt" v-model="selectedFilters[col.key]">
                          <label class="form-check-label small" :for="col.key+'f-'+opt">{{ col.key === 'dept' ? prosesLabel(opt) : opt }}</label>
                        </div>
                      </div>
                      <div v-if="selectedFilters[col.key].length" class="dropdown-divider"></div>
                      <button v-if="selectedFilters[col.key].length" class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center fw-bold" @click="selectedFilters[col.key] = []">
                        <i class="bi bi-arrow-counterclockwise me-1"></i>RESET
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ringkasan filter aktif (chip yang bisa langsung dihapus) -->
              <div v-if="hasAnyFilterActive" class="active-filter-chips">
                <template v-for="col in FILTER_COLUMNS" :key="'chips-'+col.key">
                  <span v-for="val in selectedFilters[col.key]" :key="col.key+'-'+val" class="filter-chip">
                    <span class="filter-chip-label">{{ col.label }}:</span> {{ col.key === 'dept' ? prosesLabel(val) : val }}
                    <button type="button" class="filter-chip-remove" @click="selectedFilters[col.key] = selectedFilters[col.key].filter(v => v !== val)">
                      <i class="bi bi-x"></i>
                    </button>
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="dataLoading" class="loading-overlay rounded-4">
          <div class="loading-content">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
            <div class="fw-semibold text-primary">Memuat data...</div>
            <div class="text-muted small mt-1">Sedang memindai tanggal yang tersedia</div>
          </div>
        </div>

        <!-- Info banner jika tanggal di-adjust -->
        <div v-if="adjustedDateInfo" class="alert-modern-info mb-3">
          <i class="bi bi-info-circle-fill"></i>
          <span class="small flex-grow-1">{{ adjustedDateInfo }}</span>
          <button type="button" class="btn-close-modern" @click="adjustedDateInfo = null">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Placeholder sebelum data pertama kali di-load -->
        <div v-if="!hasFetchedData && !dataLoading" class="card border-0 shadow-sm rounded-4 mb-4 empty-state-card">
          <div class="card-body text-center py-5">
            <div class="empty-state-icon">
              <i class="bi bi-table"></i>
            </div>
            <p class="text-muted mt-3 mb-0">Data belum ditampilkan. Klik <strong class="text-dark">Reload Data</strong> untuk memuat data.</p>
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-4 overflow-hidden" v-if="hasFetchedData || dataLoading">
          <div class="table-container custom-scrollbar">
            <div class="table-legend">
              <span class="legend-item"><i class="shift-dot shift-dot--1"></i> Shift 1 &middot; 7 Jam</span>
              <span class="legend-item"><i class="shift-dot shift-dot--2"></i> Shift 2 &middot; 14 Jam</span>
              <span class="legend-item"><i class="bi bi-arrow-down-up text-success"></i> Sisa Team &gt; 0 bisa dimutasi ke team lain</span>
              <span class="legend-item legend-item--muted"><i class="bi bi-arrows"></i> Geser tabel untuk lihat semua kolom</span>
            </div>
            <table class="table table-bordered align-middle mb-0 planning-table planning-table--pivot">
              <thead class="table-light sticky-header">
                <!-- Baris 1: Header Utama -->
                <tr>
                  <th rowspan="3" class="sticky-col sticky-col-header text-center" style="min-width:160px;">Team</th>
                  <th rowspan="3" class="text-center" style="min-width:120px;">Style</th>
                  <th rowspan="3" class="text-center" style="min-width:100px;">Order Qty</th>
                  <th rowspan="3" class="text-center" style="min-width:130px;">Tanggal</th>
                  <th rowspan="3" class="text-center" style="min-width:90px;">Worker Day</th>
                  <th rowspan="3" class="text-center" style="min-width:110px;">Gedung</th>
                  <th rowspan="3" class="text-center" style="min-width:100px;">Qty Plan</th>

                  <!-- Kolom per Proses - 6 kolom per proses -->
                  <template v-for="proses in visibleProsesKeys" :key="'header-'+proses">
                    <th :colspan="6" class="text-center dept-header" :class="'dept-header--' + deptClass(proses)">
                      <span class="badge-dept" :class="'badge-dept--' + deptClass(proses)">{{ proses }}</span>
                    </th>
                  </template>
                </tr>
                <!-- Baris 2: Sub Header -->
                <tr>
                  <template v-for="proses in visibleProsesKeys" :key="'subheader-'+proses">
                    <th :colspan="3" class="text-center small subheader-target">Target / Worker</th>
                    <th :colspan="3" class="text-center small subheader-org">Jml Org / Sisa</th>
                  </template>
                </tr>
                <!-- Baris 3: Detail Header -->
                <tr>
                  <template v-for="proses in visibleProsesKeys" :key="'detailheader-'+proses">
                    <th class="text-center small">Target</th>
                    <th class="text-center small">Worker 7J</th>
                    <th class="text-center small">Worker 14J</th>
                    <th class="text-center small">Jml Org</th>
                    <th class="text-center small">Terpakai</th>
                    <th class="text-center small">Sisa</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <template v-for="team in processedTeamData" :key="team.teamId ?? team.namaTeam">
                  <tr v-for="(style, idx) in team.styles" :key="(team.teamId ?? team.namaTeam) + '-' + style.xMark">
                    <!-- Kolom Team di-merge (rowspan) sepanjang jumlah style yang dikerjakan team ini -->
                    <td v-if="idx === 0" :rowspan="team.styles.length" class="sticky-col fw-bold text-dark align-top team-cell">
                      <div>{{ team.namaTeam }}</div>
                      <div class="small fw-normal text-muted mt-1 lh-sm">
                        Jml Org: <strong>{{ team.jmlOrgCapacity }}</strong><br>
                        Terpakai: <strong>{{ team.terpakaiTotal }}</strong><br>
                        Sisa: <strong :class="{ 'text-danger': team.sisaTotal < 0, 'text-success': team.sisaTotal > 0 }">{{ team.sisaTotal }}</strong>
                      </div>
                    </td>

                    <td class="text-center fw-semibold">{{ style.xMark }}</td>
                    <td class="text-center num-cell">{{ style.orderQty }}</td>
                    <td class="text-center small text-muted">{{ style.tanggalRange }}</td>
                    <td class="text-center">{{ style.effectiveWorkerDays }} Day</td>
                    <td class="text-center small">{{ style.gedung || '-' }}</td>
                    <td class="text-center num-cell fw-bold text-primary">{{ style.qty_plan_total }}</td>

                    <!-- Data per Proses -->
                    <template v-for="proses in visibleProsesKeys" :key="'data-'+proses">
                      <td class="text-center num-cell">{{ style.byProses[proses]?.xTarget ?? '-' }}</td>
                      <td class="text-center num-cell">{{ style.byProses[proses]?.worker_7jam ?? '-' }}</td>
                      <td class="text-center num-cell">{{ style.byProses[proses]?.worker_14jam ?? '-' }}</td>
                      <td class="text-center num-cell">{{ style.byProses[proses]?.jml_org ?? '-' }}</td>
                      <td class="text-center num-cell">{{ style.byProses[proses]?.terpakai ?? '-' }}</td>
                      <td class="text-center num-cell" :class="{ 'text-danger fw-bold': (style.byProses[proses]?.sisa || 0) < 0 }">
                        {{ style.byProses[proses]?.sisa ?? '-' }}
                      </td>
                    </template>
                  </tr>
                </template>
                <tr v-if="processedTeamData.length === 0">
                  <td :colspan="7 + visibleProsesKeys.length * 6" class="text-center text-muted py-4">
                    Tidak ada data untuk ditampilkan.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    <Footer/>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import axios from "axios";
import * as XLSX from 'xlsx-js-style';
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sidebarOpen = ref(true);
const syncLoading = ref(false);
const dataLoading = ref(false);
const user = ref({ name: "User" });
const adjustedDateInfo = ref(null);
const hasFetchedData = ref(false);

// Data mentah dari API
const rawData = ref([]);
const orderData = ref([]);

// Tab aktif: 'finishing' | 'linking'
const activeTab = ref('finishing');

const filters = reactive({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
});

// Filter
// type 'scalar'  -> nilai langsung ada di item[field] (style, dept, gedung)
// type 'nested'  -> nilai ada di dalam item.details[].field (team, karena 1
//                   header/style bisa dikerjakan lebih dari 1 team sekaligus)
const FILTER_COLUMNS = [
  { key: 'style', label: 'Style', type: 'scalar', field: 'xMark' },
  { key: 'dept', label: 'Proses', type: 'scalar', field: 'dept' },
  { key: 'gedung', label: 'Gedung', type: 'scalar', field: 'gedung' },
  { key: 'team', label: 'Team', type: 'nested', field: 'nama_team' }
];

const searchTerms = reactive({ style: '', dept: '', gedung: '', team: '' });
const selectedFilters = reactive({ style: [], dept: [], gedung: [], team: [] });

// Cek apakah 1 item (header/style) lolos filter kolom tertentu
const itemMatchesFilterColumn = (item, colKey) => {
  const col = FILTER_COLUMNS.find(c => c.key === colKey);
  const selected = selectedFilters[colKey];
  if (!selected || selected.length === 0) return true;

  if (col.type === 'nested') {
    const details = item.details && item.details.length > 0 ? item.details : [];
    return details.some(d => selected.includes(String(d[col.field])));
  }
  return selected.includes(String(item[col.field]));
};

// Reset filter saat pindah tab
watch(activeTab, () => {
  Object.keys(selectedFilters).forEach(k => { selectedFilters[k] = []; });
});

const hasAnyFilterActive = computed(() =>
  Object.keys(selectedFilters).some(k => selectedFilters[k].length > 0)
);
const resetAllFilters = () => {
  Object.keys(selectedFilters).forEach(k => { selectedFilters[k] = []; });
};

// Hitung hari kerja
const calculateWorkingDays = (start, end) => {
  if (!start || !end) return 0;
  let count = 0;
  let cur = new Date(start);
  const stop = new Date(end);
  while (cur <= stop) {
    const day = cur.getDay();
    if (day !== 0) count += (day === 6 ? 0.5 : 1);
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const hasDateOverlap = (start, end) => {
  if (!start || !end) return false;
  return new Date(start) <= new Date(filters.endDate) && new Date(end) >= new Date(filters.startDate);
};

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';

// Fetch Data
const fetchData = async () => {
  dataLoading.value = true;
  adjustedDateInfo.value = null;
  try {
    const [planRes, orderRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/planppc/view-target2`),
      axios.get(`${API_BASE_URL}/planppc/view-targetorder`)
    ]);
    
    rawData.value = planRes.data?.data || planRes.data || [];
    orderData.value = orderRes.data || [];
  } catch (error) {
    Swal.fire('Error', 'Gagal memuat data.', 'error');
  } finally {
    dataLoading.value = false;
    hasFetchedData.value = true;
  }
};

// Split Finishing / Linking
const dataFinishing = computed(() => rawData.value.filter(item => String(item.dept || '').toLowerCase() !== 'linking'));
const dataLinking = computed(() => rawData.value.filter(item => String(item.dept || '').toLowerCase() === 'linking'));
const activeData = computed(() => activeTab.value === 'linking' ? dataLinking.value : dataFinishing.value);

// Order Qty Map (masih dipakai untuk info di filter/export lain bila diperlukan)
const orderQtyMap = computed(() => {
  const map = new Map();
  orderData.value.forEach(o => { if (o.xMark) map.set(o.xMark, o.order_qty); });
  return map;
});

// Urutan kolom Proses untuk tab FINISHING (fixed, sesuai permintaan).
// Sontex, Soom, dan Soom Sontex digabung tampil sebagai satu kolom "Soom Sontex".
const FINISHING_PROSES_ORDER = ['Lo', 'Steam', 'CBS', 'Sewing', 'Soom Sontex', 'Sontex', 'Sontex Komplit', 'Soom', 'QC Lampu', 'Sulam'];
const sortByFinishingOrder = (values) => {
  return [...values].sort((a, b) => {
    const idxA = FINISHING_PROSES_ORDER.indexOf(a);
    const idxB = FINISHING_PROSES_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
};

// Dept order dipakai untuk filter dropdown "Filter Proses" (tetap berdasarkan
// raw dept, bukan canonical key, karena filter itu level dept mentah)
const DEPT_ORDER = ['Lo', 'Steam', 'CBS', 'Sewing', 'Soom Sontex', 'Sontex', 'Sontex Komplit', 'Soom', 'QC Lampu', 'Sulam', 'Linking'];
const sortByDeptOrder = (values) => {
  return [...values].sort((a, b) => {
    const idxA = DEPT_ORDER.indexOf(a);
    const idxB = DEPT_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
};

// Dept color mapping
const DEPT_COLOR_MAP = {
  linking: 'linking', lo: 'lo', cbs: 'cbs', steam: 'steam', sewing: 'sewing',
  sontex: 'sontex', 'sontex komplit': 'sontexkomplit', 'soom sontex': 'soomsontex', soom: 'soom',
  'qc lampu': 'qclampu', sulam: 'sulam'
};
const deptClass = (name) => DEPT_COLOR_MAP[String(name || '').toLowerCase()]
  || (activeTab.value === 'linking' ? 'linking' : 'default');

// Label proses di filter dropdown pakai xworkname (bukan raw dept)
const prosesDisplayMap = computed(() => {
  const map = {};
  activeData.value.forEach(item => {
    if (item.dept && !map[item.dept]) map[item.dept] = item.xworkname || item.dept;
  });
  return map;
});
const prosesLabel = (deptValue) => prosesDisplayMap.value[deptValue] || deptValue;

// Proses yang kuota timnya digabung (Sontex, Soom, Soom Sontex dianggap SATU
// team yang sama meski muncul sebagai proses/record terpisah). Untuk proses
// ini, tim di-grouping berdasarkan NAMA (bukan team_id) supaya jml_org,
// terpakai, dan sisanya kehitung gabungan lintas ketiga proses tsb.
const MERGED_TEAM_PROSES = ['sontex', 'sontex komplit', 'soom', 'soom sontex'];
const isMergedTeamProses = (deptValue) => MERGED_TEAM_PROSES.includes(String(deptValue || '').toLowerCase());

// Key kolom Proses yang SEBENARNYA dipakai untuk pivot data (bukan sekadar
// label). Untuk Linking, `dept` selalu bernilai "Linking" untuk semua proses
// (Kerah + Plaket, LK Body, dst) jadi kalau dipakai sebagai key semua proses
// bakal ketiban jadi satu kolom - makanya untuk Linking key-nya pakai
// `xworkname` (nama proses linking yang sebenarnya). Untuk Finishing, kolom
// TETAP mengikuti xworkname/dept asli masing-masing (Sontex tetap "Sontex",
// Soom tetap "Soom", dst) - yang digabung cuma kuota TEAM-nya, bukan kolomnya.
const canonicalProsesKey = (item) => {
  if (String(item.dept || '').toLowerCase() === 'linking') {
    return item.xworkname || item.dept;
  }
  return item.dept;
};

// Header (style/proses) yang lolos filter tanggal, style, dept, gedung, & team
const filteredHeaderItems = computed(() => {
  return activeData.value.filter(item => {
    if (!hasDateOverlap(item.tgl_mulai, item.tgl_selesai)) return false;
    return FILTER_COLUMNS.every(col => itemMatchesFilterColumn(item, col.key));
  });
});

// Kolom Proses yang muncul (dinamis, sesuai data yang lolos filter).
// Finishing: urut fixed sesuai FINISHING_PROSES_ORDER.
// Linking: urut sesuai urutan kemunculan di data/query (tidak di-sort ulang).
const visibleProsesKeys = computed(() => {
  const seen = [];
  const seenSet = new Set();
  filteredHeaderItems.value.forEach(item => {
    const key = canonicalProsesKey(item);
    if (key && !seenSet.has(key)) {
      seenSet.add(key);
      seen.push(key);
    }
  });

  if (activeTab.value === 'linking') return seen;
  return sortByFinishingOrder(seen);
});

// Process Table Data - GROUP BY TEAM, lalu per Style yang dikerjakan team itu,
// lalu di-pivot lagi per Proses (Target/Worker7J/Worker14J/JmlOrg/Terpakai/Sisa).
// jml_org (kapasitas team) & sisa dihitung level TEAM (kolam bersama lintas
// style/proses), sehingga kalau ada sisa bisa dimutasi ke team lain.
const processedTeamData = computed(() => {
  const teams = new Map();

  filteredHeaderItems.value.forEach(item => {
    const details = item.details && item.details.length > 0 ? item.details : [];
    const proses = canonicalProsesKey(item);

    details.forEach(detail => {
      const teamKey = isMergedTeamProses(item.dept)
        ? `merged-name-${detail.nama_team || 'Tanpa Nama'}`
        : (detail.team_id !== null && detail.team_id !== undefined && detail.team_id !== '')
          ? `id-${detail.team_id}`
          : `name-${detail.nama_team || 'Tanpa Nama'}`;

      if (!teams.has(teamKey)) {
        teams.set(teamKey, {
          teamId: detail.team_id,
          namaTeam: detail.nama_team || '(Tanpa Nama)',
          jmlOrgCapacity: 0,
          terpakaiTotal: 0,
          styles: new Map()
        });
      }
      const team = teams.get(teamKey);

      // jml_org_team adalah kapasitas team (konstan), ambil nilai terbesar yang muncul
      const jmlOrgTeam = Number(detail.jml_org_team) || 0;
      if (jmlOrgTeam > team.jmlOrgCapacity) team.jmlOrgCapacity = jmlOrgTeam;

      if (!team.styles.has(item.xMark)) {
        team.styles.set(item.xMark, {
          xMark: item.xMark,
          gedung: item.gedung,
          qty_plan_total: item.qty_plan_total || 0,
          tgl_mulai: item.tgl_mulai,
          tgl_selesai: item.tgl_selesai,
          byProses: {}
        });
      }
      const styleEntry = team.styles.get(item.xMark);

      if (!styleEntry.byProses[proses]) {
        styleEntry.byProses[proses] = {
          xTarget: 0, worker_7jam: 0, worker_14jam: 0, jml_org: 0, terpakai: 0, sisa: 0
        };
      }
      const cell = styleEntry.byProses[proses];
      cell.xTarget += Number(detail.qty_plan) || 0;
      cell.worker_7jam += Number(detail.worker_7jam) || 0;
      cell.worker_14jam += Number(detail.worker_14jam) || 0;
      cell.jml_org += Number(detail.jml_org_team) || 0;
      cell.terpakai = cell.worker_7jam + cell.worker_14jam;
      cell.sisa = cell.jml_org - cell.terpakai;

      team.terpakaiTotal += (Number(detail.worker_7jam) || 0) + (Number(detail.worker_14jam) || 0);
    });
  });

  return Array.from(teams.values())
    .map(team => ({
      ...team,
      sisaTotal: team.jmlOrgCapacity - team.terpakaiTotal,
      styles: Array.from(team.styles.values())
        .sort((a, b) => a.xMark.localeCompare(b.xMark, undefined, { numeric: true }))
        .map(style => ({
          ...style,
          orderQty: orderQtyMap.value.get(style.xMark) || 0,
          tanggalRange: `${formatDate(style.tgl_mulai)} - ${formatDate(style.tgl_selesai)}`,
          effectiveWorkerDays: calculateWorkingDays(style.tgl_mulai, style.tgl_selesai)
        }))
    }))
    .sort((a, b) => a.namaTeam.localeCompare(b.namaTeam, undefined, { numeric: true }));
});

// Filter dropdown options — cross-filter: opsi yang muncul di 1 filter cuma
// yang datanya BENERAN ADA setelah filter lain (selain dirinya sendiri)
// diterapkan. Jadi kalau misal filter Gedung = 'A', opsi di Filter Team cuma
// nama team yang beneran kerja di Gedung A saja (bukan semua team).
const getUniqueOptions = (key, search) => {
  const s = (search || '').toString().toLowerCase();
  const col = FILTER_COLUMNS.find(c => c.key === key);

  const source = activeData.value.filter(item => {
    if (!hasDateOverlap(item.tgl_mulai, item.tgl_selesai)) return false;
    return FILTER_COLUMNS.every(c => c.key === key ? true : itemMatchesFilterColumn(item, c.key));
  });

  let values;
  if (col.type === 'nested') {
    const set = new Set();
    source.forEach(item => {
      (item.details || []).forEach(d => {
        if (d[col.field]) set.add(String(d[col.field]));
      });
    });
    values = [...set];
  } else {
    values = [...new Set(source.map(item => item[col.field]).filter(Boolean))].map(String);
  }

  const filtered = values.filter(v => v.toLowerCase().includes(s));

  if (key === 'dept') return sortByDeptOrder(filtered);
  return filtered.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

// Auto-cleanup filter
watch(
  () => [activeTab.value, ...Object.keys(selectedFilters).map(k => selectedFilters[k].join(','))],
  () => {
    Object.keys(selectedFilters).forEach(key => {
      if (selectedFilters[key].length === 0) return;
      const validOptions = new Set(getUniqueOptions(key, ''));
      const cleaned = selectedFilters[key].filter(v => validOptions.has(String(v)));
      if (cleaned.length !== selectedFilters[key].length) selectedFilters[key] = cleaned;
    });
  }
);

// Sinkronisasi
const handleSync = async () => {
  const result = await Swal.fire({
    title: 'Konfirmasi Sinkronisasi',
    text: 'Sinkronkan data target dari sumber aktif sekarang?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Sinkronkan'
  });

  if (result.isConfirmed) {
    syncLoading.value = true;
    try {
      await axios.post(`${API_BASE_URL}/planppc/sync-target`);
      Swal.fire('Sukses', 'Data berhasil tersinkronisasi.', 'success');
      fetchData();
    } catch (error) {
      Swal.fire('Error', 'Gagal melakukan sinkronisasi data: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      syncLoading.value = false;
    }
  }
};

// Export Excel
const buildExportFileName = () => {
  const tabLabel = activeTab.value === 'linking' ? 'Linking' : 'Finishing';
  const parts = [
    `Rekap Team ${tabLabel}`,
    `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
  ];
  if (selectedFilters.style.length > 0) parts.push(`Style ${selectedFilters.style.join('-')}`);
  if (selectedFilters.dept.length > 0) parts.push(`Dept ${selectedFilters.dept.join('-')}`);
  return parts.join(' ').replace(/[\\/:*?"<>|]/g, '-') + '.xlsx';
};

const sanitizeSheetName = (name) => {
  // Excel: max 31 char, no \ / ? * [ ] :
  return String(name || 'Sheet').replace(/[\\/?*\[\]:]/g, '-').slice(0, 31) || 'Sheet';
};

// exportToExcel(splitByGedung):
//  - splitByGedung = false -> 1 sheet berisi SEMUA data yang lolos filter saat ini
//    (kalau filter Gedung cuma pilih 1, otomatis cuma 1 gedung yang muncul di situ).
//  - splitByGedung = true  -> tiap Gedung yang ada di data hasil filter dipisah
//    jadi sheet sendiri-sendiri dalam 1 file (Gedung A & Gedung B jadi 2 sheet).
const exportToExcel = (splitByGedung = false) => {
  if (!processedTeamData.value || processedTeamData.value.length === 0) {
    Swal.fire('Info', 'Tidak ada data untuk diexport', 'warning');
    return;
  }

  const wb = XLSX.utils.book_new();
  const tabLabel = activeTab.value === 'linking' ? 'Linking' : 'Finishing';
  const prosesList = visibleProsesKeys.value;

  // Flatten: satu baris = satu (Team, Style). Kolom Team/Jml Org/Terpakai/Sisa
  // adalah nilai level TEAM (kolam bersama), diulang tiap baris style-nya
  // supaya gampang difilter/pivot langsung di Excel.
  const allRows = [];
  processedTeamData.value.forEach(team => {
    team.styles.forEach(style => {
      allRows.push({ team, style });
    });
  });

  // Kelompokkan berdasarkan Gedung kalau splitByGedung aktif. Kalau tidak,
  // semua baris jadi 1 kelompok (1 sheet).
  let groups;
  if (splitByGedung) {
    const map = new Map();
    allRows.forEach(row => {
      const g = row.style.gedung || 'Tanpa Gedung';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(row);
    });
    groups = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  } else {
    groups = [[null, allRows]];
  }

  groups.forEach(([gedungLabel, rows]) => {
    const { ws_data, merges, colWidths } = buildSheetAoa(rows, prosesList, tabLabel, gedungLabel);
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!merges'] = merges;
    ws['!cols'] = colWidths;

    const sheetName = gedungLabel
      ? sanitizeSheetName(`${tabLabel} - ${gedungLabel}`)
      : sanitizeSheetName(tabLabel);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fnameSuffix = splitByGedung ? ' (per Gedung)' : '';
  XLSX.writeFile(wb, buildExportFileName().replace('.xlsx', `${fnameSuffix}.xlsx`));
};

// Membangun 1 sheet (array-of-arrays + merges + lebar kolom) dari sekumpulan
// baris (Team x Style). Dipisah jadi fungsi sendiri supaya bisa dipanggil
// berkali-kali (1x per Gedung) tanpa duplikasi kode style/border/merge.
const buildSheetAoa = (rows, prosesList, tabLabel, gedungLabel) => {
  const thinBorder = {
    top: { style: 'thin', color: { rgb: 'D9D9D9' } },
    bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
    left: { style: 'thin', color: { rgb: 'D9D9D9' } },
    right: { style: 'thin', color: { rgb: 'D9D9D9' } }
  };
  const headerBorder = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };
  const styleTitle = {
    font: { name: 'Arial', sz: 14, bold: true, color: { rgb: '1F4E78' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };
  const styleHeaderDept = {
    font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1F4E78' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: headerBorder
  };
  const styleHeaderMain = {
    font: { name: 'Arial', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2F5597' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: headerBorder
  };
  const styleSubHeader = {
    font: { name: 'Arial', sz: 8, bold: true, color: { rgb: '1F4E78' } },
    fill: { fgColor: { rgb: 'D9E1F2' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: headerBorder
  };
  const getStyleDataCenter = (isEven) => ({
    font: { name: 'Arial', sz: 9 },
    fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder
  });
  const getStyleDataNum = (isEven) => ({
    font: { name: 'Arial', sz: 9 },
    fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: thinBorder,
    numFmt: '#,##0'
  });

  const COLS_PER_PROSES = 6;
  const FIXED_COLS = 10; // Team, Jml Org Team, Terpakai Team, Sisa Team, Style, Order Qty, Tanggal, Worker Day, Gedung, Qty Plan
  const totalCols = FIXED_COLS + (prosesList.length * COLS_PER_PROSES);

  const ws_data = [];
  const merges = [];

  const titleText = gedungLabel
    ? `Rekap Target per Team ${tabLabel} - Gedung ${gedungLabel} (${formatDate(filters.startDate)} - ${formatDate(filters.endDate)})`
    : `Rekap Target per Team ${tabLabel} (${formatDate(filters.startDate)} - ${formatDate(filters.endDate)})`;
  ws_data.push([{ v: titleText, s: styleTitle }]);
  ws_data.push([]);

  // Row 1: Proses header
  const rowProses = new Array(FIXED_COLS).fill('');
  prosesList.forEach(proses => {
    for (let i = 0; i < COLS_PER_PROSES; i++) {
      if (i === 0) rowProses.push({ v: proses, s: styleHeaderDept });
      else rowProses.push({ v: '', s: styleHeaderDept });
    }
  });
  ws_data.push(rowProses);

  // Row 2: Sub header (Target/Worker | Jml Org/Sisa)
  const rowSub = new Array(FIXED_COLS).fill('');
  prosesList.forEach(() => {
    rowSub.push({ v: 'Target / Worker', s: styleSubHeader });
    rowSub.push({ v: '', s: styleSubHeader });
    rowSub.push({ v: '', s: styleSubHeader });
    rowSub.push({ v: 'Jml Org / Sisa', s: styleSubHeader });
    rowSub.push({ v: '', s: styleSubHeader });
    rowSub.push({ v: '', s: styleSubHeader });
  });
  ws_data.push(rowSub);

  // Row 3: Detail header
  const rowDetail = [
    'Team', 'Jml Org Team', 'Terpakai Team', 'Sisa Team',
    'Style', 'Order Qty', 'Tanggal', 'Worker Day', 'Gedung', 'Qty Plan'
  ];
  prosesList.forEach(() => {
    rowDetail.push('Target', 'Worker 7J', 'Worker 14J', 'Jml Org', 'Terpakai', 'Sisa');
  });
  ws_data.push(rowDetail.map(val => ({ v: val, s: styleHeaderMain })));

  // Merges
  const titleRow = 0, prosesRow = 2, subRow = 3;
  merges.push({ s: { r: titleRow, c: 0 }, e: { r: titleRow, c: totalCols - 1 } });

  let colStart = FIXED_COLS;
  prosesList.forEach(() => {
    merges.push({ s: { r: prosesRow, c: colStart }, e: { r: prosesRow, c: colStart + COLS_PER_PROSES - 1 } });
    merges.push({ s: { r: subRow, c: colStart }, e: { r: subRow, c: colStart + 2 } });
    merges.push({ s: { r: subRow, c: colStart + 3 }, e: { r: subRow, c: colStart + 5 } });
    colStart += COLS_PER_PROSES;
  });

  // Data rows
  rows.forEach(({ team, style }, idx) => {
    const isEven = idx % 2 === 0;
    const c = getStyleDataCenter(isEven);
    const n = getStyleDataNum(isEven);
    const sisaTeamStyle = {
      ...n,
      font: { name: 'Arial', sz: 9, bold: true, color: { rgb: team.sisaTotal < 0 ? 'C0392B' : '1F8A5F' } }
    };

    const row = [
      { v: team.namaTeam || '', s: c },
      { v: team.jmlOrgCapacity || 0, s: n },
      { v: team.terpakaiTotal || 0, s: n },
      { v: team.sisaTotal || 0, s: sisaTeamStyle },
      { v: style.xMark || '', s: c },
      { v: style.orderQty || 0, s: n },
      { v: style.tanggalRange || '', s: c },
      { v: `${style.effectiveWorkerDays || 0} Day`, s: c },
      { v: style.gedung || '-', s: c },
      { v: style.qty_plan_total || 0, s: n }
    ];

    prosesList.forEach(proses => {
      const d = style.byProses[proses] || {};
      row.push(
        { v: d.xTarget || 0, s: n },
        { v: d.worker_7jam || 0, s: n },
        { v: d.worker_14jam || 0, s: n },
        { v: d.jml_org || 0, s: n },
        { v: d.terpakai || 0, s: n },
        { v: d.sisa || 0, s: n }
      );
    });

    ws_data.push(row);
  });

  const colWidths = [
    { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 12 }
  ];
  prosesList.forEach(() => {
    colWidths.push({ wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 });
  });

  return { ws_data, merges, colWidths };
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

/* ===================== DESIGN TOKENS ===================== */
.d-flex.flex-column.min-vh-100 {
  --ink: #101828;
  --ink-soft: #5b6472;
  --ink-faint: #8891a0;
  --surface: #ffffff;
  --bg: #f2f4f8;
  --border: #e3e7ee;
  --primary: #185c6e;
  --primary-dark: #123f4b;
  --primary-soft: #e3f0f2;
  --amber: #b8720a;
  --amber-soft: #fbeedd;
  --teal: #0f7d6b;
  --teal-soft: #e0f3ee;
  --success: #1f8a5f;
  --success-soft: #e3f6ec;
  --danger: #c4402a;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ink);
  background: var(--bg);
}
.font-mono, .num-cell { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace; font-variant-numeric: tabular-nums; }

/* ===================== HEADER & TITLE ===================== */
.page-title-icon {
  width: 46px; height: 46px;
  border-radius: 13px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 14px rgba(18, 63, 75, 0.28);
  flex-shrink: 0;
}
h2.h4 { letter-spacing: -0.01em; }

/* ===================== SYNC BAR ===================== */
.sync-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 8px 14px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  flex-wrap: wrap;
}
.sync-bar-icon { color: var(--primary); font-size: 0.95rem; }
.sync-bar-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
}
.btn-sync {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  border: none;
  border-radius: 30px;
  padding: 7px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-sync:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(18, 63, 75, 0.3); color: #fff; }
.btn-sync:disabled { opacity: 0.6; }

.btn-update-qty {
  background: linear-gradient(135deg, var(--success), #157347);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 11px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-update-qty:hover { color: #fff; transform: translateY(-1px); box-shadow: 0 6px 14px rgba(31, 138, 95, 0.3); }

/* ===================== TAB / SLIDE FINISHING-LINKING ===================== */
.tab-pill-group { display: flex; gap: 10px; flex-wrap: wrap; }
.tab-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid var(--border);
  color: var(--ink-soft);
  border-radius: 14px;
  padding: 10px 18px;
  font-weight: 700;
  font-size: 0.88rem;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.tab-pill:hover { border-color: var(--primary); color: var(--primary); }
.tab-pill.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-color: var(--primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(18, 63, 75, 0.25);
}
.btn-success { background: linear-gradient(135deg, var(--success), #157347); border: none; border-radius: 14px; }

/* ===================== STICKY TOOLBAR ===================== */
/* Tab, filter tanggal/aksi, dan filter checkbox tetap kelihatan pas scroll,
   jadi user gak perlu balik ke atas cuma buat ganti filter / export. */
.sticky-toolbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg);
  padding-top: 4px;
  padding-bottom: 2px;
  margin-bottom: 0.5rem;
}

/* ===================== TOOLBAR: TANGGAL + AKSI ===================== */
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}
.toolbar-date-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  flex: 1 1 320px;
  min-width: 0;
}
.toolbar-date-group > div { min-width: 150px; flex: 1 1 150px; }
.toolbar-action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

/* ===================== FILTER GRID (responsive, no horizontal scroll) === */
.filter-bar-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ink);
}
.btn-reset-all {
  background: transparent;
  border: 1.5px solid var(--border);
  color: var(--danger);
  border-radius: 30px;
  padding: 4px 12px;
  font-size: 0.76rem;
  font-weight: 600;
  transition: background-color 0.15s ease;
}
.btn-reset-all:hover { background: #fdecea; border-color: var(--danger); }

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.85rem;
}
.filter-grid-item { min-width: 0; }

.active-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--border);
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-soft);
  color: var(--primary-dark);
  font-size: 0.74rem;
  font-weight: 600;
  padding: 4px 6px 4px 10px;
  border-radius: 30px;
}
.filter-chip-label { font-weight: 700; opacity: 0.75; }
.filter-chip-remove {
  background: rgba(18, 63, 75, 0.12);
  border: none;
  color: var(--primary-dark);
  width: 18px; height: 18px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem;
  line-height: 1;
  flex-shrink: 0;
}
.filter-chip-remove:hover { background: var(--primary-dark); color: #fff; }
.filter-chip-remove i { font-size: 0.85rem; }

@media (max-width: 767.98px) {
  .filter-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.6rem; }
  .toolbar-row { flex-direction: column; align-items: stretch; }
  .toolbar-action-group { justify-content: stretch; }
  .toolbar-action-group > * { flex: 1 1 auto; }
  .sticky-toolbar { position: static; } /* di HP, sticky toolbar sepanjang ini kepanjangan & makan layar, jadi scroll biasa */
}


.form-label-modern {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  margin-bottom: 5px;
  display: block;
}
.form-control-modern {
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  font-weight: 600;
  color: var(--ink);
}
.form-control-modern:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }

.btn-reload {
  background: var(--primary-soft);
  color: var(--primary-dark);
  border: none;
  border-radius: 12px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.btn-reload:hover:not(:disabled) { background: var(--primary); color: #fff; }
.btn-reload:disabled { opacity: 0.6; }

.btn-export {
  background: var(--success-soft);
  color: #157347;
  border: none;
  border-radius: 12px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.btn-export:hover:not(:disabled) { background: var(--success); color: #fff; }
.btn-export:disabled { opacity: 0.6; }

.btn-filter-dropdown {
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.btn-filter-dropdown:hover { border-color: var(--primary); }
.btn-filter-dropdown i { color: var(--ink-faint); font-size: 0.8rem; }

/* ===================== LOADING & ALERT ===================== */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(3px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  padding: 2rem 3rem;
  border-radius: 1.25rem;
  box-shadow: 0 8px 32px rgba(16, 24, 40, 0.12);
}
main {
  position: relative;
  min-width: 0;   /* WAJIB: flex item defaultnya min-width:auto, jadi kalau ada
                     tabel lebar di dalamnya, main (dan filter di atasnya) ikut
                     melebar ngikutin tabel & mendorong page jadi scroll
                     horizontal. min-width:0 maksa main dibatasi lebar viewport,
                     sehingga tabel yang lebar itu discroll DI DALAM card-nya
                     sendiri (.table-container), bukan menggeser seluruh halaman. */
  max-width: 100%;
}


.alert-modern-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--primary-soft);
  color: var(--primary-dark);
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 500;
}
.alert-modern-info i.bi-info-circle-fill { font-size: 1.1rem; }
.btn-close-modern {
  background: none; border: none; color: var(--primary-dark); opacity: 0.6;
  display: flex; align-items: center; padding: 0;
}
.btn-close-modern:hover { opacity: 1; }

/* ===================== EMPTY STATE ===================== */
.empty-state-card { background: #fff; }
.empty-state-icon {
  width: 64px; height: 64px;
  border-radius: 16px;
  background: var(--bg);
  color: var(--ink-faint);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

/* ===================== TABLE LEGEND ===================== */
.table-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 18px;
  padding: 10px 18px;
  background: #fbfcfe;
  border-bottom: 1px solid var(--border);
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--ink-soft);
  min-height: var(--legend-h, 42px);
  box-sizing: border-box;
  /* Sticky nempel di ATAS area scroll tabel (table-container), di ATAS thead. */
  position: sticky;
  top: 0;
  z-index: 11;
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-item--muted { margin-left: auto; font-weight: 500; color: var(--ink-faint); }
.legend-item--muted i { font-size: 0.85rem; }

/* ===================== TABLE ===================== */
.table-container {
  --legend-h: 42px; /* tinggi legend, dipakai juga sebagai offset top thead di bawah -
                        cukup ubah 1 variabel ini kalau tinggi legend berubah */
  min-height: clamp(350px, 55vh, 550px);
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
}
.sticky-header th {
  position: sticky;
  top: var(--legend-h, 42px); /* nempel PERSIS di bawah legend, bukan di top:0,
                                  supaya gak numpuk/ketutupan legend */
  background-color: #f8f9fb;
  z-index: 10;
  box-shadow: 0 2px 2px -1px rgba(16, 24, 40, 0.08);
}

.sticky-col {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 2;
  box-shadow: 2px 0 4px -2px rgba(16, 24, 40, 0.12);
}
.sticky-col-header { z-index: 12; background-color: #f8f9fb; }
.planning-table tbody tr:hover .sticky-col { background: #f8f9fb; }
.team-cell { min-width: 160px; }
.team-cell .lh-sm { line-height: 1.35; }

.planning-table thead th {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--ink-soft);
  vertical-align: middle;
  padding: 0.65rem 0.5rem;
}
.planning-table tbody td {
  font-size: 0.85rem;
  padding: 0.6rem 0.5rem;
  vertical-align: middle;
  border-color: var(--border);
}
.planning-table tbody tr:hover { background: #f8f9fb; }

.filter-dropdown-panel { border-radius: 14px; }
.filter-scroll { max-height: 220px; overflow-y: auto; padding-right: 4px; }

/* ===================== DEPT HEADER ===================== */
.dept-header {
  background: #f0f2f5;
  padding: 0.4rem 0.3rem;
}

.dept-header--linking { background: #e7e9f8; }
.dept-header--lo { background: #dcf3ec; }
.dept-header--cbs { background: #f1e6fa; }
.dept-header--steam { background: #fbeedd; }
.dept-header--sewing { background: #e2eefc; }
.dept-header--sontex { background: #fbe3ec; }
.dept-header--sontexkomplit { background: #fcd9e7; }
.dept-header--soomsontex { background: #f6e7d6; }
.dept-header--soom { background: #def3f6; }
.dept-header--qclampu { background: #e3f4e6; }
.dept-header--sulam { background: #f5e2f4; }
.dept-header--default { background: #eceff3; }

.subheader-target {
  background: #e8ecf1;
  color: #2c3e50;
}

.subheader-org {
  background: #f0f2f5;
  color: #2c3e50;
}

/* ===================== DEPT BADGE ===================== */
.badge-dept {
  font-weight: 700;
  font-size: 0.72rem;
  padding: 4px 10px;
  border-radius: 30px;
  white-space: nowrap;
  display: inline-block;
}
.badge-dept--linking     { background: #e7e9f8; color: #3b4fa0; }
.badge-dept--lo          { background: #dcf3ec; color: #12806e; }
.badge-dept--cbs         { background: #f1e6fa; color: #7c3aad; }
.badge-dept--steam       { background: #fbeedd; color: #b8720a; }
.badge-dept--sewing      { background: #e2eefc; color: #1d63c4; }
.badge-dept--sontex      { background: #fbe3ec; color: #b33163; }
.badge-dept--sontexkomplit { background: #fcd9e7; color: #96214f; }
.badge-dept--soomsontex  { background: #f6e7d6; color: #9c5a1e; }
.badge-dept--soom        { background: #def3f6; color: #0e7c90; }
.badge-dept--qclampu     { background: #e3f4e6; color: #2e8b45; }
.badge-dept--sulam       { background: #f5e2f4; color: #a23e9e; }
.badge-dept--default     { background: #eceff3; color: #495057; }

/* ===================== SHIFT ===================== */
.shift-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; background: currentColor; }
.shift-dot--1 { background: var(--teal); }
.shift-dot--2 { background: var(--amber); }

/* ===================== SCROLLBAR ===================== */
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #c7ced9; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 991.98px) {
  .table-legend { padding: 8px 14px; }
  .table-container { --legend-h: 38px; }
  .legend-item--muted { display: none; }
}

@media (max-width: 767.98px) {
  .page-title-icon { width: 40px; height: 40px; font-size: 1.05rem; }
  h2.h4 { font-size: 1.05rem; }
  .sync-bar { width: 100%; justify-content: space-between; }
  .btn-update-qty { width: 100%; justify-content: center; }
  .tab-pill { padding: 8px 14px; font-size: 0.8rem; }

  .planning-table thead th { font-size: 0.6rem; padding: 0.4rem 0.3rem; }
  .planning-table tbody td { font-size: 0.72rem; padding: 0.4rem 0.3rem; }
  .badge-dept { font-size: 0.6rem; padding: 2px 6px; }
  .table-container { max-height: 65vh; --legend-h: 34px; }
}

@media (max-width: 479.98px) {
  .filter-card .card-body { padding: 1rem !important; }
  .table-legend { font-size: 0.7rem; gap: 4px 12px; }
  .table-container { --legend-h: 44px; } /* di layar sempit legend bisa wrap 2 baris karena banyak item, jadi butuh lebih tinggi */
}
</style>