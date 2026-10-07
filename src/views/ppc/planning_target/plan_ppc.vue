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
        <!-- ============================================================ -->
        <div class="sticky-toolbar">
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
                          <label class="form-check-label small" :for="col.key+'f-'+opt">{{ opt }}</label>
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

              <!-- Ringkasan filter aktif -->
              <div v-if="hasAnyFilterActive" class="active-filter-chips">
                <template v-for="col in FILTER_COLUMNS" :key="'chips-'+col.key">
                  <span v-for="val in selectedFilters[col.key]" :key="col.key+'-'+val" class="filter-chip">
                    <span class="filter-chip-label">{{ col.label }}:</span> {{ val }}
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

        <div v-if="adjustedDateInfo" class="alert-modern-info mb-3">
          <i class="bi bi-info-circle-fill"></i>
          <span class="small flex-grow-1">{{ adjustedDateInfo }}</span>
          <button type="button" class="btn-close-modern" @click="adjustedDateInfo = null">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

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
                <!-- Baris 1: Header Dept & Kolom Tetap -->
                <tr>
                  <th rowspan="4" class="sticky-col sticky-col-header text-center" style="min-width:160px;">Style</th>
                  <th rowspan="4" class="text-center" style="min-width:100px;">Order Qty</th>
                  <th rowspan="4" class="text-center" style="min-width:120px;">
                    Sisa Qty
                    <div class="small text-muted fw-normal lh-sm">(Hasil Linking primary - kirim)</div>
                  </th>
                  <th rowspan="4" class="text-center" style="min-width:130px;">Tanggal</th>
                  <th rowspan="4" class="text-center" style="min-width:90px;">Worker Day</th>
                  <th rowspan="4" class="text-center" style="min-width:110px;">Gedung</th>
                  <th rowspan="4" class="text-center" style="min-width:100px;">Qty Plan</th>

                  <!-- Kolom per Dept (group) -->
                  <template v-for="grp in visibleProsesGrouped" :key="'deptgrp-'+grp.groupDept">
                    <th :colspan="grp.proses.length * 6" class="text-center dept-group-header" :class="'dept-header--' + deptGroupClass(grp.groupDept)">
                      {{ grp.groupDept }}
                    </th>
                  </template>

                  <!-- Team dipindah ke paling belakang -->
                  <th rowspan="4" class="text-center text-dark" style="min-width:180px; background-color: #f8f9fb; z-index: 10;">Team / Kapasitas</th>
                </tr>
                <!-- Baris 2: Header Proses/xWorkName -->
                <tr>
                  <template v-for="proses in visibleProsesKeys" :key="'header-'+proses">
                    <th :colspan="6" class="text-center dept-header" :class="'dept-header--' + deptClass(proses)">
                      <span class="badge-dept" :class="'badge-dept--' + deptClass(proses)">{{ proses }}</span>
                    </th>
                  </template>
                </tr>
                <!-- Baris 3: Sub Header -->
                <tr>
                  <template v-for="proses in visibleProsesKeys" :key="'subheader-'+proses">
                    <th :colspan="3" class="text-center small subheader-target">Target / Worker</th>
                    <th :colspan="3" class="text-center small subheader-org">Jml Org / Sisa</th>
                  </template>
                </tr>
                <!-- Baris 4: Detail Header -->
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
                <template v-for="style in processedStyleData" :key="style.xMark">
                  <!-- Looping data team di dalam style -->
                  <tr v-for="(team, idx) in (style.teams.length ? style.teams : [{}])" :key="style.xMark + '-' + (team.teamId || idx)">
                    
                    <!-- Kumpulan Kolom Kiri (Hanya muncul 1 kali per style dan di-rowspan) -->
                    <td v-if="idx === 0" :rowspan="style.teams.length || 1" class="sticky-col fw-bold text-dark align-middle text-center style-cell" style="font-size: 0.95rem;">
                      {{ style.xMark }}
                    </td>
                    <td v-if="idx === 0" :rowspan="style.teams.length || 1" class="text-center num-cell">{{ style.orderQty }}</td>
                    <td v-if="idx === 0" :rowspan="style.teams.length || 1" class="text-center num-cell" :class="{ 'text-danger fw-bold': (style.hasilLinkingMinusKirim || 0) < 0 }">{{ style.hasilLinkingMinusKirim }}</td>
                    <td v-if="idx === 0" :rowspan="style.teams.length || 1" class="text-center small text-muted">{{ style.tanggalRange }}</td>
                    <td v-if="idx === 0" :rowspan="style.teams.length || 1" class="text-center">{{ style.effectiveWorkerDays }} Day</td>
                    <td v-if="idx === 0" :rowspan="style.teams.length || 1" class="text-center small">{{ style.gedung || '-' }}</td>
                    <td v-if="idx === 0" :rowspan="style.teams.length || 1" class="text-center num-cell fw-bold text-primary">{{ style.qty_plan_total }}</td>

                    <!-- Data Proses per Team -->
                    <template v-for="proses in visibleProsesKeys" :key="'data-'+proses">
                      <td class="text-center num-cell">{{ team.byProses?.[proses]?.xTarget ?? '-' }}</td>
                      <td class="text-center num-cell">{{ team.byProses?.[proses]?.worker_7jam ?? '-' }}</td>
                      <td class="text-center num-cell">{{ team.byProses?.[proses]?.worker_14jam ?? '-' }}</td>
                      <td class="text-center num-cell">{{ team.byProses?.[proses]?.jml_org ?? '-' }}</td>
                      <td class="text-center num-cell">{{ team.byProses?.[proses]?.terpakai ?? '-' }}</td>
                      <td class="text-center num-cell" :class="{ 'text-danger fw-bold': (team.byProses?.[proses]?.sisa || 0) < 0 }">
                        {{ team.byProses?.[proses]?.sisa ?? '-' }}
                      </td>
                    </template>
                    
                    <!-- Kolom Team di Paling Kanan -->
                    <td class="fw-bold text-dark align-top team-cell text-start">
                      <div v-if="team.namaTeam">
                        <div>{{ team.namaTeam }}</div>
                        <div class="small fw-normal text-muted mt-1 lh-sm">
                          Jml Org: <strong>{{ team.jmlOrgCapacity }}</strong><br>
                          Terpakai: <strong>{{ team.terpakaiTotal }}</strong><br>
                          Sisa: <strong :class="{ 'text-danger': team.sisaTotal < 0, 'text-success': team.sisaTotal > 0 }">{{ team.sisaTotal }}</strong>
                        </div>
                      </div>
                      <div v-else class="text-muted fst-italic text-center">-</div>
                    </td>

                  </tr>
                </template>
                <tr v-if="processedStyleData.length === 0">
                  <td :colspan="8 + visibleProsesKeys.length * 6" class="text-center text-muted py-4">
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

const rawData = ref([]);
const orderData = ref([]); 
const orderQtyData = ref([]); 

const activeTab = ref('finishing');

const filters = reactive({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
});

const FILTER_COLUMNS = [
  { key: 'style', label: 'Style', type: 'scalar', getValue: (item) => item.xMark },
  { key: 'dept', label: 'Dept', type: 'scalar', getValue: (item) => groupDeptOf(item.dept) },
  { key: 'proses', label: 'Proses', type: 'scalar', getValue: (item) => canonicalProsesKey(item) },
  { key: 'gedung', label: 'Gedung', type: 'scalar', getValue: (item) => item.gedung },
  { key: 'team', label: 'Team', type: 'nested', getValue: (detail) => detail.nama_team }
];

const searchTerms = reactive({ style: '', dept: '', proses: '', gedung: '', team: '' });
const selectedFilters = reactive({ style: [], dept: [], proses: [], gedung: [], team: [] });

const itemMatchesFilterColumn = (item, colKey) => {
  const col = FILTER_COLUMNS.find(c => c.key === colKey);
  const selected = selectedFilters[colKey];
  if (!selected || selected.length === 0) return true;

  if (col.type === 'nested') {
    const details = item.details && item.details.length > 0 ? item.details : [];
    return details.some(d => selected.includes(String(col.getValue(d))));
  }
  return selected.includes(String(col.getValue(item)));
};

watch(activeTab, () => {
  Object.keys(selectedFilters).forEach(k => { selectedFilters[k] = []; });
});

const hasAnyFilterActive = computed(() =>
  Object.keys(selectedFilters).some(k => selectedFilters[k].length > 0)
);
const resetAllFilters = () => {
  Object.keys(selectedFilters).forEach(k => { selectedFilters[k] = []; });
};

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

const isWithinFilterRange = (start, end) => {
  if (!start || !end) return false;
  const mulai = new Date(start);
  const selesai = new Date(end);
  return mulai <= new Date(filters.endDate) && selesai >= new Date(filters.startDate);
};

const getEffectiveDateRange = (start, end) => {
  const filterStart = new Date(filters.startDate);
  const filterEnd = new Date(filters.endDate);
  const rawStart = new Date(start);
  const rawEnd = new Date(end);
  const effectiveStart = rawStart < filterStart ? filters.startDate : start;
  const effectiveEnd = rawEnd > filterEnd ? filters.endDate : end;
  return { effectiveStart, effectiveEnd };
};

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-';

const fetchData = async () => {
  dataLoading.value = true;
  adjustedDateInfo.value = null;
  try {
    const [planRes, orderRes, orderQtyRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/planppc/view-target2`),
      axios.get(`${API_BASE_URL}/planppc/team-target-hasilprimarykurangkirim`),
      axios.get(`${API_BASE_URL}/planppc/view-targetorder`)
    ]);
    
    rawData.value = planRes.data?.data || planRes.data || [];
    orderData.value = orderRes.data?.data || orderRes.data || [];
    orderQtyData.value = orderQtyRes.data?.data || orderQtyRes.data || [];
  } catch (error) {
    Swal.fire('Error', 'Gagal memuat data.', 'error');
  } finally {
    dataLoading.value = false;
    hasFetchedData.value = true;
  }
};

const dataFinishing = computed(() => rawData.value.filter(item => String(item.dept || '').toLowerCase() !== 'linking'));
const dataLinking = computed(() => rawData.value.filter(item => String(item.dept || '').toLowerCase() === 'linking'));
const activeData = computed(() => activeTab.value === 'linking' ? dataLinking.value : dataFinishing.value);

const orderQtyMap = computed(() => {
  const map = new Map();
  orderData.value.forEach(o => { if (o.xMark) map.set(o.xMark, o.hasil_akumlinkingpdikurangkirim); });
  return map;
});

const orderQtyRealMap = computed(() => {
  const map = new Map();
  orderQtyData.value.forEach(o => { if (o.xMark) map.set(o.xMark, o.order_qty); });
  return map;
});

const RAW_DEPT_ORDER = ['Lo', 'CBS', 'Steam', 'Sewing', 'Sontex', 'Sontex Komplit', 'Soom Sontex', 'Soom', 'QC Lampu', 'Sulam', 'Linking'];

const RAW_DEPT_TO_GROUP = {
  'Lo': 'Lo', 'CBS': 'CBS', 'Steam': 'Steam', 'Sewing': 'Sewing',
  'Sontex': 'Soom Sontex', 'Sontex Komplit': 'Soom Sontex', 'Soom Sontex': 'Soom Sontex', 'Soom': 'Soom Sontex',
  'QC Lampu': 'QC Lampu', 'Sulam': 'Sulam', 'Linking': 'Linking'
};
const groupDeptOf = (rawDept) => RAW_DEPT_TO_GROUP[rawDept] || rawDept || '-';

const GROUP_DEPT_ORDER = [...new Set(RAW_DEPT_ORDER.map(groupDeptOf))];

const DEPT_COLOR_MAP = {
  linking: 'linking', lo: 'lo', cbs: 'cbs', steam: 'steam', sewing: 'sewing',
  'soom sontex': 'soomsontex', 'qc lampu': 'qclampu', sulam: 'sulam'
};
const deptGroupClass = (groupDept) => DEPT_COLOR_MAP[String(groupDept || '').toLowerCase()]
  || (activeTab.value === 'linking' ? 'linking' : 'default');

const prosesRawDeptMap = computed(() => {
  const map = new Map();
  activeData.value.forEach(item => {
    const key = canonicalProsesKey(item);
    if (key && !map.has(key)) map.set(key, item.dept);
  });
  return map;
});
const rawDeptOfProses = (proses) => prosesRawDeptMap.value.get(proses) || '';
const deptClass = (proses) => deptGroupClass(groupDeptOf(rawDeptOfProses(proses)));

const sortByFinishingOrder = (values) => {
  return [...values].sort((a, b) => {
    const rawA = rawDeptOfProses(a), rawB = rawDeptOfProses(b);
    const giA = GROUP_DEPT_ORDER.indexOf(groupDeptOf(rawA));
    const giB = GROUP_DEPT_ORDER.indexOf(groupDeptOf(rawB));
    if (giA !== giB) return (giA === -1 ? 999 : giA) - (giB === -1 ? 999 : giB);
    const riA = RAW_DEPT_ORDER.indexOf(rawA), riB = RAW_DEPT_ORDER.indexOf(rawB);
    if (riA !== riB) return (riA === -1 ? 999 : riA) - (riB === -1 ? 999 : riB);
    return a.localeCompare(b, undefined, { numeric: true });
  });
};

const sortByGroupDeptOrder = (values) => {
  return [...values].sort((a, b) => {
    const idxA = GROUP_DEPT_ORDER.indexOf(a);
    const idxB = GROUP_DEPT_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
};

const MERGED_TEAM_PROSES = ['sontex', 'sontex komplit', 'soom', 'soom sontex'];
const isMergedTeamProses = (deptValue) => MERGED_TEAM_PROSES.includes(String(deptValue || '').toLowerCase());

const canonicalProsesKey = (item) => item.xworkname || item.dept;

const filteredHeaderItems = computed(() => {
  return activeData.value.filter(item => {
    if (!isWithinFilterRange(item.tgl_mulai, item.tgl_selesai)) return false;
    return FILTER_COLUMNS.every(col => itemMatchesFilterColumn(item, col.key));
  });
});

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

const visibleProsesGrouped = computed(() => {
  const order = [];
  const map = new Map();
  visibleProsesKeys.value.forEach(proses => {
    const g = groupDeptOf(rawDeptOfProses(proses));
    if (!map.has(g)) { map.set(g, []); order.push(g); }
    map.get(g).push(proses);
  });
  return order.map(g => ({ groupDept: g, proses: map.get(g) }));
});

// Process Table Data berdasarkan STYLE di kiri dan TEAM di kanan
const processedStyleData = computed(() => {
  const styles = new Map();
  const globalTeamStats = new Map();

  filteredHeaderItems.value.forEach(item => {
    const xMark = item.xMark || 'Tanpa Style';
    const proses = canonicalProsesKey(item);

    // Setup Group Style
    if (!styles.has(xMark)) {
      const { effectiveStart, effectiveEnd } = getEffectiveDateRange(item.tgl_mulai, item.tgl_selesai);
      styles.set(xMark, {
        xMark: xMark,
        gedung: item.gedung,
        qty_plan_total: item.qty_plan_total || 0,
        tgl_mulai: item.tgl_mulai,
        tgl_selesai: item.tgl_selesai,
        tanggalRange: `${formatDate(effectiveStart)} - ${formatDate(effectiveEnd)}`,
        effectiveWorkerDays: calculateWorkingDays(effectiveStart, effectiveEnd),
        hasilLinkingMinusKirim: orderQtyMap.value.get(xMark) ?? 0,
        orderQty: orderQtyRealMap.value.get(xMark) || 0,
        teams: new Map()
      });
    }
    const styleEntry = styles.get(xMark);
    const details = item.details && item.details.length > 0 ? item.details : [];

    details.forEach(detail => {
      const teamKey = isMergedTeamProses(item.dept)
        ? `merged-name-${detail.nama_team || 'Tanpa Nama'}`
        : (detail.team_id !== null && detail.team_id !== undefined && detail.team_id !== '')
          ? `id-${detail.team_id}`
          : `name-${detail.nama_team || 'Tanpa Nama'}`;

      // Kalkulasi Global Capacity dari team
      if (!globalTeamStats.has(teamKey)) {
        globalTeamStats.set(teamKey, {
          namaTeam: detail.nama_team || '(Tanpa Nama)',
          jmlOrgCapacity: 0,
          terpakaiTotal: 0
        });
      }
      const gTeam = globalTeamStats.get(teamKey);
      const jmlOrgTeam = Number(detail.jml_org_team) || 0;
      if (jmlOrgTeam > gTeam.jmlOrgCapacity) gTeam.jmlOrgCapacity = jmlOrgTeam;
      gTeam.terpakaiTotal += (Number(detail.worker_7jam) || 0) + (Number(detail.worker_14jam) || 0);

      // Input kedalam List Teams di dalam Style
      if (!styleEntry.teams.has(teamKey)) {
        styleEntry.teams.set(teamKey, {
          teamId: detail.team_id,
          teamKey: teamKey,
          namaTeam: detail.nama_team || '(Tanpa Nama)',
          byProses: {}
        });
      }
      const teamEntry = styleEntry.teams.get(teamKey);

      if (!teamEntry.byProses[proses]) {
        teamEntry.byProses[proses] = {
          xTarget: 0, worker_7jam: 0, worker_14jam: 0, jml_org: 0, terpakai: 0, sisa: 0
        };
      }
      const cell = teamEntry.byProses[proses];
      cell.xTarget += Number(detail.qty_plan) || 0;
      cell.worker_7jam += Number(detail.worker_7jam) || 0;
      cell.worker_14jam += Number(detail.worker_14jam) || 0;
      cell.jml_org += Number(detail.jml_org_team) || 0;
      cell.terpakai = cell.worker_7jam + cell.worker_14jam;
      cell.sisa = cell.jml_org - cell.terpakai;
    });
  });

  return Array.from(styles.values())
    .map(style => ({
      ...style,
      teams: Array.from(style.teams.values())
        .map(team => {
           const gTeam = globalTeamStats.get(team.teamKey);
           return {
             ...team,
             jmlOrgCapacity: gTeam.jmlOrgCapacity,
             terpakaiTotal: gTeam.terpakaiTotal,
             sisaTotal: gTeam.jmlOrgCapacity - gTeam.terpakaiTotal
           };
        })
        .sort((a, b) => a.namaTeam.localeCompare(b.namaTeam, undefined, { numeric: true }))
    }))
    .sort((a, b) => a.xMark.localeCompare(b.xMark, undefined, { numeric: true }));
});

const getUniqueOptions = (key, search) => {
  const s = (search || '').toString().toLowerCase();
  const col = FILTER_COLUMNS.find(c => c.key === key);

  const source = activeData.value.filter(item => {
    if (!isWithinFilterRange(item.tgl_mulai, item.tgl_selesai)) return false;
    return FILTER_COLUMNS.every(c => c.key === key ? true : itemMatchesFilterColumn(item, c.key));
  });

  let values;
  if (col.type === 'nested') {
    const set = new Set();
    source.forEach(item => {
      (item.details || []).forEach(d => {
        const v = col.getValue(d);
        if (v) set.add(String(v));
      });
    });
    values = [...set];
  } else {
    values = [...new Set(source.map(item => col.getValue(item)).filter(Boolean))].map(String);
  }

  const filtered = values.filter(v => v.toLowerCase().includes(s));

  if (key === 'dept') return sortByGroupDeptOrder(filtered);
  if (key === 'proses') return activeTab.value === 'linking' ? filtered.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) : sortByFinishingOrder(filtered);
  return filtered.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

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

const buildExportFileName = () => {
  const tabLabel = activeTab.value === 'linking' ? 'Linking' : 'Finishing';
  const parts = [
    `Rekap Style ${tabLabel}`,
    `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
  ];
  if (selectedFilters.style.length > 0) parts.push(`Style ${selectedFilters.style.join('-')}`);
  if (selectedFilters.dept.length > 0) parts.push(`Dept ${selectedFilters.dept.join('-')}`);
  if (selectedFilters.proses.length > 0) parts.push(`Proses ${selectedFilters.proses.join('-')}`);
  return parts.join(' ').replace(/[\\/:*?"<>|]/g, '-') + '.xlsx';
};

const sanitizeSheetName = (name) => {
  return String(name || 'Sheet').replace(/[\\/?*\[\]:]/g, '-').slice(0, 31) || 'Sheet';
};

const exportToExcel = (splitByGedung = false) => {
  if (!processedStyleData.value || processedStyleData.value.length === 0) {
    Swal.fire('Info', 'Tidak ada data untuk diexport', 'warning');
    return;
  }

  const wb = XLSX.utils.book_new();
  const tabLabel = activeTab.value === 'linking' ? 'Linking' : 'Finishing';
  const prosesList = visibleProsesKeys.value;

  const allRows = [];
  processedStyleData.value.forEach(style => {
    if(style.teams.length === 0) {
       allRows.push({ style, team: {} });
    }
    style.teams.forEach(team => {
      allRows.push({ style, team });
    });
  });

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

// ============================================================
// LOGIKA PEMBANGUNAN STRUKTUR EXCEL (MERGED HEADERS & DATA)
// ============================================================
const buildSheetAoa = (rows, prosesList, tabLabel, gedungLabel) => {
  const thinBorder = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  const headerBorder = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  
  const styleTitle = { font: { name: 'Arial', sz: 14, bold: true }, alignment: { horizontal: 'center' } };
  const styleHeaderDept = { font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F4E78' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: headerBorder };
  const styleHeaderMain = { font: { name: 'Arial', sz: 9, bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2F5597' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: headerBorder };
  const styleSubHeader = { font: { name: 'Arial', sz: 8, bold: true }, fill: { fgColor: { rgb: 'D9E1F2' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: headerBorder };
  const cStyle = { font: { name: 'Arial', sz: 9 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: thinBorder };
  const nStyle = { font: { name: 'Arial', sz: 9 }, alignment: { horizontal: 'right', vertical: 'center' }, border: thinBorder, numFmt: '#,##0' };
  const teamStyle = { font: { name: 'Arial', sz: 9, bold: true }, alignment: { horizontal: 'left', vertical: 'top', wrapText: true }, border: thinBorder };

  const COLS_PER_PROSES = 6;
  const LEFT_FIXED_COLS = 7;
  const RIGHT_FIXED_COLS = 1;
  const FIXED_HEADERS = ['Style', 'Order Qty', 'Sisa Qty\n(Hasil Linking primary - kirim)', 'Tanggal', 'Worker Day', 'Gedung', 'Qty Plan'];
  
  const totalCols = LEFT_FIXED_COLS + (prosesList.length * COLS_PER_PROSES) + RIGHT_FIXED_COLS;
  const ws_data = [], merges = [];

  const titleText = gedungLabel
    ? `Rekap Target per Style ${tabLabel} - Gedung ${gedungLabel} (${formatDate(filters.startDate)} - ${formatDate(filters.endDate)})`
    : `Rekap Target per Style ${tabLabel} (${formatDate(filters.startDate)} - ${formatDate(filters.endDate)})`;
  ws_data.push([{ v: titleText, s: styleTitle }]);
  ws_data.push([]); 

  // Row Header
  const rowDept = [], rowProses = [], rowSub = [], rowDetail = [];
  
  // Kolom Kiri 
  FIXED_HEADERS.forEach(h => rowDept.push({ v: h, s: styleHeaderMain }));
  for(let i=0; i<LEFT_FIXED_COLS; i++) {
    rowProses.push({ v: '', s: styleHeaderMain });
    rowSub.push({ v: '', s: styleHeaderMain });
    rowDetail.push({ v: '', s: styleHeaderMain });
  }

  // Kolom Proses (Tengah)
  visibleProsesGrouped.value.forEach(grp => {
    const span = grp.proses.length * COLS_PER_PROSES;
    for (let i = 0; i < span; i++) rowDept.push({ v: i===0 ? grp.groupDept : '', s: styleHeaderDept });
  });

  prosesList.forEach(proses => {
    for (let i = 0; i < COLS_PER_PROSES; i++) rowProses.push({ v: i===0 ? proses : '', s: styleHeaderDept });
    rowSub.push({ v: 'Target / Worker', s: styleSubHeader }, { v: '', s: styleSubHeader }, { v: '', s: styleSubHeader }, { v: 'Jml Org / Sisa', s: styleSubHeader }, { v: '', s: styleSubHeader }, { v: '', s: styleSubHeader });
    ['Target', 'Worker 7J', 'Worker 14J', 'Jml Org', 'Terpakai', 'Sisa'].forEach(val => rowDetail.push({ v: val, s: styleHeaderMain }));
  });

  // Kolom Kanan (Team)
  rowDept.push({ v: 'Team / Kapasitas', s: styleHeaderMain });
  rowProses.push({ v: '', s: styleHeaderMain });
  rowSub.push({ v: '', s: styleHeaderMain });
  rowDetail.push({ v: '', s: styleHeaderMain });

  ws_data.push(rowDept, rowProses, rowSub, rowDetail);

  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });

  // Merge Fixed Header Kolom Kiri dan Kolom Paling Kanan
  for (let c = 0; c < LEFT_FIXED_COLS; c++) merges.push({ s: { r: 2, c: c }, e: { r: 5, c: c } });
  merges.push({ s: { r: 2, c: totalCols - 1 }, e: { r: 5, c: totalCols - 1 } }); 

  // Data Body
  let currentStyleRef = null;
  let styleStartRow = 6;

  rows.forEach(({ style, team }, idx) => {
    const currentRowIdx = 6 + idx;
    if (currentStyleRef !== style.xMark) {
      if (currentStyleRef !== null && styleStartRow < currentRowIdx - 1) {
        for(let c=0; c<LEFT_FIXED_COLS; c++) merges.push({ s: { r: styleStartRow, c: c }, e: { r: currentRowIdx - 1, c: c } });
      }
      currentStyleRef = style.xMark;
      styleStartRow = currentRowIdx;
    }

    const row = [
      { v: style.xMark || '', s: cStyle },
      { v: style.orderQty || 0, s: nStyle },
      { v: style.hasilLinkingMinusKirim || 0, s: nStyle },
      { v: style.tanggalRange || '', s: cStyle },
      { v: `${style.effectiveWorkerDays || 0} Day`, s: cStyle },
      { v: style.gedung || '-', s: cStyle },
      { v: style.qty_plan_total || 0, s: nStyle }
    ];

    prosesList.forEach(proses => {
      const d = team.byProses?.[proses] || {};
      row.push({ v: d.xTarget || 0, s: nStyle }, { v: d.worker_7jam || 0, s: nStyle }, { v: d.worker_14jam || 0, s: nStyle }, { v: d.jml_org || 0, s: nStyle }, { v: d.terpakai || 0, s: nStyle }, { v: d.sisa || 0, s: nStyle });
    });

    const teamText = team.namaTeam ? `${team.namaTeam}\nJml Org: ${team.jmlOrgCapacity}\nTerpakai: ${team.terpakaiTotal}\nSisa: ${team.sisaTotal}` : '-';
    row.push({ v: teamText, s: teamStyle });
    ws_data.push(row);
  });

  if (currentStyleRef !== null && styleStartRow < 6 + rows.length - 1) {
    for(let c=0; c<LEFT_FIXED_COLS; c++) merges.push({ s: { r: styleStartRow, c: c }, e: { r: 6 + rows.length - 1, c: c } });
  }

  // Pengaturan Lebar Kolom
  const colWidths = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
  prosesList.forEach(() => colWidths.push({ wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }));
  colWidths.push({ wch: 22 }); 

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

/* ===================== TAB / SLIDE ===================== */
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
.sticky-toolbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg);
  padding-top: 4px;
  padding-bottom: 2px;
  margin-bottom: 0.5rem;
}

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

/* ===================== FILTER GRID ===================== */
.filter-bar-title { font-size: 0.85rem; font-weight: 700; color: var(--ink); }
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

.filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; }
.filter-grid-item { min-width: 0; }

.active-filter-chips {
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 0.85rem;
  padding-top: 0.85rem; border-top: 1px dashed var(--border);
}
.filter-chip {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--primary-soft); color: var(--primary-dark);
  font-size: 0.74rem; font-weight: 600; padding: 4px 6px 4px 10px; border-radius: 30px;
}
.filter-chip-label { font-weight: 700; opacity: 0.75; }
.filter-chip-remove {
  background: rgba(18, 63, 75, 0.12); border: none; color: var(--primary-dark);
  width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 0.7rem; flex-shrink: 0;
}
.filter-chip-remove:hover { background: var(--primary-dark); color: #fff; }

@media (max-width: 767.98px) {
  .filter-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.6rem; }
  .toolbar-row { flex-direction: column; align-items: stretch; }
  .toolbar-action-group { justify-content: stretch; }
  .toolbar-action-group > * { flex: 1 1 auto; }
  .sticky-toolbar { position: static; }
}

.form-label-modern { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-soft); margin-bottom: 5px; display: block; }
.form-control-modern { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.5rem 0.85rem; font-weight: 600; color: var(--ink); }
.form-control-modern:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }

.btn-reload, .btn-export { border: none; border-radius: 12px; padding: 0.55rem 1.2rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; transition: 0.15s ease; }
.btn-reload { background: var(--primary-soft); color: var(--primary-dark); }
.btn-reload:hover:not(:disabled) { background: var(--primary); color: #fff; }
.btn-export { background: var(--success-soft); color: #157347; }
.btn-export:hover:not(:disabled) { background: var(--success); color: #fff; }

.btn-filter-dropdown { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.5rem 0.85rem; font-weight: 600; font-size: 0.85rem; color: var(--ink); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.btn-filter-dropdown:hover { border-color: var(--primary); }
.btn-filter-dropdown i { color: var(--ink-faint); font-size: 0.8rem; }

/* ===================== LOADING & ALERT ===================== */
.loading-overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(3px); z-index: 100; display: flex; align-items: center; justify-content: center; }
.loading-content { display: flex; flex-direction: column; align-items: center; background: white; padding: 2rem 3rem; border-radius: 1.25rem; box-shadow: 0 8px 32px rgba(16, 24, 40, 0.12); }
main { position: relative; min-width: 0; max-width: 100%; }

.alert-modern-info { display: flex; align-items: center; gap: 10px; background: var(--primary-soft); color: var(--primary-dark); border-radius: 14px; padding: 12px 16px; font-weight: 500; }
.alert-modern-info i.bi-info-circle-fill { font-size: 1.1rem; }
.btn-close-modern { background: none; border: none; color: var(--primary-dark); opacity: 0.6; display: flex; align-items: center; padding: 0; }
.btn-close-modern:hover { opacity: 1; }

.empty-state-card { background: #fff; }
.empty-state-icon { width: 64px; height: 64px; border-radius: 16px; background: var(--bg); color: var(--ink-faint); display: inline-flex; align-items: center; justify-content: center; font-size: 1.8rem; }

/* ===================== TABLE LEGEND ===================== */
.table-legend { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 18px; padding: 10px 18px; background: #fbfcfe; border-bottom: 1px solid var(--border); font-size: 0.76rem; font-weight: 600; color: var(--ink-soft); min-height: var(--legend-h, 42px); box-sizing: border-box; position: sticky; top: 0; z-index: 11; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-item--muted { margin-left: auto; font-weight: 500; color: var(--ink-faint); }

/* ===================== TABLE ===================== */
.table-container { --legend-h: 42px; min-height: clamp(350px, 55vh, 550px); max-height: 70vh; overflow-y: auto; overflow-x: auto; position: relative; -webkit-overflow-scrolling: touch; }
.sticky-header th { position: sticky; top: var(--legend-h, 42px); background-color: #f8f9fb; z-index: 10; box-shadow: 0 2px 2px -1px rgba(16, 24, 40, 0.08); }

.sticky-col { position: sticky; left: 0; background: #fff; z-index: 2; box-shadow: 2px 0 4px -2px rgba(16, 24, 40, 0.12); }
.sticky-col-header { z-index: 12; background-color: #f8f9fb; }
.planning-table tbody tr:hover .sticky-col { background: #f8f9fb; }

.style-cell { min-width: 140px; }
.team-cell { min-width: 180px; }
.team-cell .lh-sm { line-height: 1.35; }

.planning-table thead th { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--ink-soft); vertical-align: middle; padding: 0.65rem 0.5rem; }
.planning-table tbody td { font-size: 0.85rem; padding: 0.6rem 0.5rem; vertical-align: middle; border-color: var(--border); }
.planning-table tbody tr:hover { background: #f8f9fb; }

.filter-dropdown-panel { border-radius: 14px; }
.filter-scroll { max-height: 220px; overflow-y: auto; padding-right: 4px; }

/* ===================== DEPT HEADER & BADGE ===================== */
.dept-group-header { padding: 0.5rem 0.3rem; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink); border-bottom: 2px solid rgba(16, 24, 40, 0.12) !important; }
.dept-header { background: #f0f2f5; padding: 0.4rem 0.3rem; }
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

.subheader-target { background: #e8ecf1; color: #2c3e50; }
.subheader-org { background: #f0f2f5; color: #2c3e50; }

.badge-dept { font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 30px; white-space: nowrap; display: inline-block; }
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

/* ===================== SCROLLBAR ===================== */
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #c7ced9; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }

.shift-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; background: currentColor; }
.shift-dot--1 { background: var(--teal); }
.shift-dot--2 { background: var(--amber); }

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
  .table-container { --legend-h: 44px; } 
}
</style>