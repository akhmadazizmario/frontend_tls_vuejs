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
              <h2 class="h4 fw-bold text-dark mb-0">Report Plan PPC</h2>
              <!-- DIUBAH: Menampilkan Date Range yang sedang difilter pada sub-judul -->
              <p class="text-muted small mb-0">
                Date Range: <span class="fw-semibold text-primary">{{ formatDate(filters.tglDari) }} - {{ formatDate(filters.tglSampai) }}</span>
              </p>
            </div>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-2">
            <a href="/team_plan" class="btn btn-danger">
              <i class="bi bi-pencil-square"></i> TEAM
            </a>
            <a href="/plan_create" class="btn btn-primary">
              <i class="bi bi-pencil-square"></i> Update Qty Plan
            </a>
          </div>
        </div>

        <div class="sticky-toolbar">
          <div class="card border-0 shadow-sm mb-3 rounded-4 filter-card">
            <div class="card-body p-3 p-md-4">
              <div class="toolbar-row">
                <div class="toolbar-date-group">
                  <div>
                    <label class="form-label-modern">Tanggal Dari</label>
                    <input type="date" v-model="filters.tglDari" class="form-control form-control-modern" />
                  </div>
                  <div>
                    <label class="form-label-modern">Tanggal Sampai</label>
                    <input type="date" v-model="filters.tglSampai" class="form-control form-control-modern" />
                  </div>
                </div>
                <div class="toolbar-action-group">
                  <button class="btn btn-reload" @click="fetchData" :disabled="dataLoading">
                    <span v-if="dataLoading" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-arrow-clockwise"></i> Reload Data
                  </button>
                  <button class="btn btn-export" @click="exportToExcel" :disabled="!hasFetchedData || groupedData.length === 0">
                    <i class="bi bi-filetype-xlsx"></i> Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

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

        <div v-if="dataLoading" class="loading-overlay rounded-4">
          <div class="loading-content">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
            <div class="fw-semibold text-primary">Memuat data...</div>
          </div>
        </div>

        <div v-if="!hasFetchedData && !dataLoading" class="card border-0 shadow-sm rounded-4 mb-4 empty-state-card">
          <div class="card-body text-center py-5">
            <div class="empty-state-icon"><i class="bi bi-table"></i></div>
            <p class="text-muted mt-3 mb-0">Data belum ditampilkan. Klik <strong class="text-dark">Reload Data</strong> untuk memuat data.</p>
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-4 overflow-hidden" v-if="hasFetchedData || dataLoading">
          <div class="table-container custom-scrollbar">
            <table class="table table-bordered align-middle mb-0 planning-table">
              <thead class="table-light sticky-header">
                <tr>
                  <th rowspan="3" class="fz fz-1 hdr-top text-center">Style</th>
                  <th rowspan="3" class="fz fz-2 hdr-top text-center">Order Qty</th>
                  <th rowspan="3" class="fz fz-3 hdr-top text-center">Sisa Qty<div class="small text-muted fw-normal lh-sm">(Linking Primary - Kirim)</div></th>
                  <th rowspan="3" class="fz fz-4 hdr-top text-center">Date Range</th>
                  <th rowspan="3" class="fz fz-5 hdr-top text-center">Date</th>
                  <th rowspan="3" class="fz fz-6 hdr-top text-center">Worker Day</th>
                  <th rowspan="3" class="fz fz-7 hdr-top text-center">Gedung</th>
                  <th rowspan="3" class="fz fz-8 hdr-top text-center">PLAN Total</th>

                  <template v-for="grp in visibleProsesGrouped" :key="'deptgrp-'+grp.groupDept">
                    <th :colspan="grp.proses.length * 5" class="hdr-r1 text-center dept-group-header" :class="'dept-header--' + deptClassOf(grp.groupDept)">
                      {{ grp.groupDept }}
                    </th>
                  </template>

                  <th rowspan="3" class="hdr-top text-center" style="min-width:160px;">Team</th>
                </tr>
                <tr>
                  <template v-for="proses in visibleProsesKeys" :key="'header-'+proses">
                    <th :colspan="5" class="hdr-r2 text-center dept-header" :class="'dept-header--' + deptClass(proses)">
                      <span class="badge-dept" :class="'badge-dept--' + deptClass(proses)">{{ proses }}</span>
                    </th>
                  </template>
                </tr>
                <tr>
                  <template v-for="proses in visibleProsesKeys" :key="'sub-'+proses">
                    <th class="hdr-r3 text-center small subheader-target">Target</th>
                    <th class="hdr-r3 text-center small subheader-planteam">Plan Team</th>
                    <th class="hdr-r3 text-center small subheader-shift1">OP 1</th>
                    <th class="hdr-r3 text-center small subheader-shift2">OP 2</th>
                    <th class="hdr-r3 text-center small subheader-sisaorg">Sisa OP/Team</th> 
                  </template>
                </tr>
              </thead>
              <tbody>
                <template v-for="style in groupedData" :key="style.xMark">
                  <template v-for="(dateGroup, dIdx) in style.dates" :key="style.xMark + '-' + dateGroup.tglKey">
                    <tr v-for="(team, tIdx) in dateGroup.teams" :key="style.xMark + '-' + dateGroup.tglKey + '-' + team.namaTeam">

                      <!-- MERGE PER XMARK -->
                      <td v-if="dIdx === 0 && tIdx === 0" :rowspan="style.totalRows" class="fz fz-1 fw-bold text-dark align-top">
                        {{ style.xMark }}
                      </td>
                      <td v-if="dIdx === 0 && tIdx === 0" :rowspan="style.totalRows" class="fz fz-2 text-center num-cell align-top">{{ fmtNum(style.orderQty) }}</td>
                      <td v-if="dIdx === 0 && tIdx === 0" :rowspan="style.totalRows" class="fz fz-3 text-center num-cell align-top" :class="{ 'text-danger fw-bold': (style.sisaQty || 0) < 0 }">
                        {{ fmtNum(style.sisaQty) }}
                      </td>
                      <td v-if="dIdx === 0 && tIdx === 0" :rowspan="style.totalRows" class="fz fz-4 text-center small text-muted align-top">{{ style.delivery || '-' }}</td>

                      <!-- MERGE PER TANGGAL (kalau tanggal itu punya beberapa tim) -->
                      <td v-if="tIdx === 0" :rowspan="dateGroup.teams.length" class="fz fz-5 text-center small align-top">{{ formatDate(dateGroup.tglPlan) }}</td>

                      <td v-if="dIdx === 0 && tIdx === 0" :rowspan="style.totalRows" class="fz fz-6 text-center align-top">{{ style.workerDay || '-' }} Day</td>
                      <td v-if="dIdx === 0 && tIdx === 0" :rowspan="style.totalRows" class="fz fz-7 text-center small align-top">{{ style.gedung || '-' }}</td>

                      <!-- MERGE PER TANGGAL: QTY TOTAL -->
                      <td v-if="tIdx === 0" :rowspan="dateGroup.teams.length" class="fz fz-8 text-center num-cell fw-bold text-primary align-top">{{ fmtNum(dateGroup.qtyTotal) }}</td>

                      <!-- DATA PER PROSES (per tim) -->
                      <template v-for="proses in visibleProsesKeys" :key="'data-'+proses">
                        <td class="text-center num-cell">{{ fmtNum(team.byProses[proses]?.xTarget) ?? '-' }}</td>
                        <td class="text-center num-cell">{{ fmtNum(team.byProses[proses]?.qty_plan_perteam) ?? '-' }}</td>
                        <td class="text-center num-cell">{{ fmtNum(team.byProses[proses]?.worker_7jam) ?? '-' }}</td>
                        <td class="text-center num-cell">{{ fmtNum(team.byProses[proses]?.worker_14jam) ?? '-' }}</td>
                        <!-- KONDISI SISA OP/TEAM -->
                        <td class="text-center num-cell fw-bold" 
                            :class="{'text-danger': team.byProses[proses]?.sisa_org < 0, 'text-dark': team.byProses[proses]?.sisa_org > 0}">
                          {{ (!team.byProses[proses]?.sisa_org || team.byProses[proses]?.sisa_org === 0) ? '' : fmtNum(team.byProses[proses]?.sisa_org) }}
                        </td> 
                      </template>

                      <td class="fw-bold text-dark align-top" style="min-width:160px; background-color:#fafbfc;">
                        {{ team.namaTeam }}
                      </td>
                    </tr>
                  </template>
                </template>
                <tr v-if="groupedData.length === 0">
                  <td :colspan="8 + visibleProsesKeys.length * 5 + 1" class="text-center text-muted py-4">Tidak ada data untuk ditampilkan.</td>
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
const API = `${API_BASE_URL}/planppcbaru`;

const fmtNum = (v) => {
  if (v === null || v === undefined || v === '' || v === '-') return v;
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return Math.round(n * 10) / 10;
};

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const sidebarOpen = ref(true);
const dataLoading = ref(false);
const user = ref({ name: "User" });
const hasFetchedData = ref(false);
const rawData = ref([]);

const todayStr = new Date().toISOString().split('T')[0];
const filters = reactive({
  tglDari: todayStr,
  tglSampai: todayStr
});

const fetchData = async () => {
  if (!filters.tglDari || !filters.tglSampai) {
    Swal.fire('Info', 'Tanggal dari dan sampai wajib diisi.', 'warning');
    return;
  }
  dataLoading.value = true;
  try {
    const res = await axios.get(`${API}/report-plan`, {
      params: { tgl_dari: filters.tglDari, tgl_sampai: filters.tglSampai }
    });
    rawData.value = res.data?.data || [];
  } catch (error) {
    Swal.fire('Error', 'Gagal memuat data: ' + (error.response?.data?.message || error.message), 'error');
  } finally {
    dataLoading.value = false;
    hasFetchedData.value = true;
  }
};

// ==========================================
// FILTER: Style, Dept, Proses, Gedung, Team (multi-checkbox + search)
// ==========================================
const FILTER_COLUMNS = [
  { key: 'style', label: 'Style', getValue: (row) => row.xMark },
  { key: 'dept', label: 'Dept', getValue: (row) => groupDeptOf(row.dept) },
  { key: 'proses', label: 'Proses', getValue: (row) => canonicalProsesKey(row) },
  { key: 'gedung', label: 'Gedung', getValue: (row) => row.gedung },
  { key: 'team', label: 'Team', getValue: (row) => row.nama_team }
];

const searchTerms = reactive({ style: '', dept: '', proses: '', gedung: '', team: '' });
const selectedFilters = reactive({ style: [], dept: [], proses: [], gedung: [], team: [] });

const hasAnyFilterActive = computed(() => Object.keys(selectedFilters).some(k => selectedFilters[k].length > 0));
const resetAllFilters = () => { Object.keys(selectedFilters).forEach(k => { selectedFilters[k] = []; }); };

const rowMatchesFilterColumn = (row, colKey) => {
  const col = FILTER_COLUMNS.find(c => c.key === colKey);
  const selected = selectedFilters[colKey];
  if (!selected || selected.length === 0) return true;
  return selected.includes(String(col.getValue(row)));
};

const filteredRawData = computed(() => {
  return rawData.value.filter(row => FILTER_COLUMNS.every(col => rowMatchesFilterColumn(row, col.key)));
});

const getUniqueOptions = (key, search) => {
  const s = (search || '').toString().toLowerCase();
  const col = FILTER_COLUMNS.find(c => c.key === key);

  const source = rawData.value.filter(row => FILTER_COLUMNS.every(c => c.key === key ? true : rowMatchesFilterColumn(row, c.key)));

  let values = [...new Set(source.map(row => col.getValue(row)).filter(Boolean))].map(String);
  values = values.filter(v => v.toLowerCase().includes(s));

  if (key === 'dept') return values.sort((a, b) => GROUP_DEPT_ORDER.indexOf(a) - GROUP_DEPT_ORDER.indexOf(b));
  if (key === 'proses') return sortByFinishingOrder(values);
  return values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

watch(
  () => Object.keys(selectedFilters).map(k => selectedFilters[k].join(',')).join('|'),
  () => {
    Object.keys(selectedFilters).forEach(key => {
      if (selectedFilters[key].length === 0) return;
      const validOptions = new Set(getUniqueOptions(key, ''));
      const cleaned = selectedFilters[key].filter(v => validOptions.has(String(v)));
      if (cleaned.length !== selectedFilters[key].length) selectedFilters[key] = cleaned;
    });
  }
);

// ==========================================
// URUTAN & PENGELOMPOKAN DEPT
// ==========================================
const RAW_DEPT_ORDER = ['Linking', 'Lo', 'Steam', 'CBS', 'Sewing', 'Sontex', 'Sontex Komplit', 'Soom Sontex', 'Soom', 'QC Lampu', 'Sulam'];
const RAW_DEPT_TO_GROUP = {
  'linking': 'LINKING', 'lo': 'LO', 'steam': 'STEAM', 'cbs': 'CBS', 'sewing': 'SEWING',
  'sontex': 'SOOM SONTEX', 'sontex komplit': 'SOOM SONTEX', 'soom sontex': 'SOOM SONTEX', 'soom': 'SOOM SONTEX',
  'qc lampu': 'QC LAMPU', 'sulam': 'SULAM'
};
const GROUP_DEPT_ORDER = ['LINKING', 'LO', 'STEAM', 'CBS', 'SEWING', 'SOOM SONTEX', 'QC LAMPU', 'SULAM'];

const groupDeptOf = (rawDept) => {
  const key = String(rawDept || '').trim().toLowerCase();
  return RAW_DEPT_TO_GROUP[key] || String(rawDept || '-').toUpperCase();
};

const DEPT_CLASS_MAP = {
  'linking': 'linking', 'lo': 'lo', 'steam': 'steam', 'cbs': 'cbs', 'sewing': 'sewing',
  'soom sontex': 'soomsontex', 'qc lampu': 'qclampu', 'sulam': 'sulam'
};
const deptClassOf = (groupDept) => DEPT_CLASS_MAP[String(groupDept || '').toLowerCase()] || 'default';

const canonicalProsesKey = (row) => row.name_work || row.dept || '-';

const prosesRawDeptMap = computed(() => {
  const map = new Map();
  filteredRawData.value.forEach(row => {
    const key = canonicalProsesKey(row);
    if (key && !map.has(key)) map.set(key, row.dept);
  });
  return map;
});
const rawDeptOfProses = (proses) => prosesRawDeptMap.value.get(proses) || '';
const deptClass = (proses) => deptClassOf(groupDeptOf(rawDeptOfProses(proses)));

const sortByFinishingOrder = (values) => {
  return [...values].sort((a, b) => {
    const rawA = rawDeptOfProses(a), rawB = rawDeptOfProses(b);
    const giA = GROUP_DEPT_ORDER.indexOf(groupDeptOf(rawA));
    const giB = GROUP_DEPT_ORDER.indexOf(groupDeptOf(rawB));
    if (giA !== giB) return (giA === -1 ? 999 : giA) - (giB === -1 ? 999 : giB);
    const riA = RAW_DEPT_ORDER.findIndex(d => d.toLowerCase() === String(rawA).toLowerCase());
    const riB = RAW_DEPT_ORDER.findIndex(d => d.toLowerCase() === String(rawB).toLowerCase());
    if (riA !== riB) return (riA === -1 ? 999 : riA) - (riB === -1 ? 999 : riB);
    return a.localeCompare(b, undefined, { numeric: true });
  });
};

const visibleProsesKeys = computed(() => {
  const seen = [];
  const seenSet = new Set();
  filteredRawData.value.forEach(row => {
    const key = canonicalProsesKey(row);
    if (key && !seenSet.has(key)) { seenSet.add(key); seen.push(key); }
  });
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

// ==========================================
// GROUPING
// ==========================================
const groupedData = computed(() => {
  const styleMap = new Map();

  filteredRawData.value.forEach(row => {
    const xMark = row.xMark || '-';
    if (!styleMap.has(xMark)) {
      styleMap.set(xMark, {
        xMark,
        orderQty: row.order_qty,
        sisaQty: row.sisa_qty,
        delivery: row.delivery,
        workerDay: row.worker_day,
        gedung: row.gedung,
        dateMap: new Map()
      });
    }
    const style = styleMap.get(xMark);

    const tglKey = row.tgl_plan ? String(row.tgl_plan).split('T')[0] : '-';
    if (!style.dateMap.has(tglKey)) {
      style.dateMap.set(tglKey, {
        tglKey,
        tglPlan: row.tgl_plan,
        qtyTotal: row.qty_plan_total,
        teamMap: new Map()
      });
    }
    const dateGroup = style.dateMap.get(tglKey);

    const teamName = row.nama_team || '(Tanpa Nama)';
    if (!dateGroup.teamMap.has(teamName)) {
      dateGroup.teamMap.set(teamName, { namaTeam: teamName, byProses: {} });
    }
    const teamObj = dateGroup.teamMap.get(teamName);

    const proses = canonicalProsesKey(row);
    if (!teamObj.byProses[proses]) {
      teamObj.byProses[proses] = { xTarget: 0, qty_plan_perteam: 0, worker_7jam: 0, worker_14jam: 0, sisa_org: 0 };
    }
    teamObj.byProses[proses].xTarget += Number(row.xTarget) || 0;
    teamObj.byProses[proses].qty_plan_perteam += Number(row.qty_plan_perteam) || 0;
    teamObj.byProses[proses].worker_7jam += Number(row.worker_7jam) || 0;
    teamObj.byProses[proses].worker_14jam += Number(row.worker_14jam) || 0;
    teamObj.byProses[proses].sisa_org = row.sisa_org;
  });

  return Array.from(styleMap.values())
    .map(style => {
      const dates = Array.from(style.dateMap.values())
        .map(d => ({ ...d, teams: Array.from(d.teamMap.values()).sort((a, b) => a.namaTeam.localeCompare(b.namaTeam, undefined, { numeric: true })) }))
        .sort((a, b) => new Date(a.tglPlan) - new Date(b.tglPlan));
      const totalRows = dates.reduce((sum, d) => sum + d.teams.length, 0);
      return { ...style, dates, totalRows: totalRows || 1 };
    })
    .sort((a, b) => a.xMark.localeCompare(b.xMark, undefined, { numeric: true }));
});

// ==========================================
// EXPORT EXCEL DENGAN JUDUL DATE RANGE
// ==========================================
const buildExportFileName = () => {
  return `Report Plan PPC ${formatDate(filters.tglDari)} - ${formatDate(filters.tglSampai)}`
    .replace(/[\\/:*?"<>|]/g, '-') + '.xlsx';
};

const exportToExcel = () => {
  if (groupedData.value.length === 0) {
    Swal.fire('Info', 'Tidak ada data untuk diexport', 'warning');
    return;
  }

  const checkEmpty = (val) => {
    const res = fmtNum(val);
    if (res === 0 || res === '0' || res === '-' || res === null || res === undefined || res === '') {
      return '';
    }
    return res;
  };

  const thinBorder = { top: { style: 'thin', color: { rgb: 'D9D9D9' } }, bottom: { style: 'thin', color: { rgb: 'D9D9D9' } }, left: { style: 'thin', color: { rgb: 'D9D9D9' } }, right: { style: 'thin', color: { rgb: 'D9D9D9' } } };
  const headerBorder = { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } };
  
  const styleHeaderDept = { font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F4E78' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: headerBorder };
  const styleHeaderMain = { font: { name: 'Arial', sz: 9, bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2F5597' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: headerBorder };
  const styleSubHeader = { font: { name: 'Arial', sz: 8, bold: true, color: { rgb: '1F4E78' } }, fill: { fgColor: { rgb: 'D9E1F2' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: headerBorder };
  const getStyleDataCenter = (isEven) => ({ font: { name: 'Arial', sz: 9 }, fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: thinBorder });
  const getStyleDataNum = (isEven) => ({ font: { name: 'Arial', sz: 9 }, fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: thinBorder, numFmt: '#,##0' });
  const getStyleTeam = (isEven) => ({ font: { name: 'Arial', sz: 9, bold: true }, fill: { fgColor: { rgb: isEven ? 'F9FAFB' : 'FFFFFF' } }, alignment: { horizontal: 'left', vertical: 'top', wrapText: true }, border: thinBorder });

  // Styles khusus untuk Judul Baris Atas
  const styleTitle = { font: { name: 'Arial', sz: 14, bold: true }, alignment: { horizontal: 'center', vertical: 'center' } };
  const styleSubtitle = { font: { name: 'Arial', sz: 11, italic: true }, alignment: { horizontal: 'center', vertical: 'center' } };

  const FIXED_COLS = 8;
  const COLS_PER_PROSES = 5; 
  const prosesList = visibleProsesKeys.value;
  const totalCols = FIXED_COLS + prosesList.length * COLS_PER_PROSES + 1; 

  const ws_data = [];
  const merges = [];

  // --- DIUBAH: MENYISIPKAN 3 BARIS JUDUL DI AWAL ---

  // Baris 0: Judul Laporan
  const rowTitle = [{ v: `REPORT PLAN PPC`, s: styleTitle }];
  for (let i = 1; i < totalCols; i++) rowTitle.push({ v: '', s: {} });
  ws_data.push(rowTitle);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }); // Merge center panjang kolom

  // Baris 1: Date Range
  const rowDate = [{ v: `Date Range: ${formatDate(filters.tglDari)} - ${formatDate(filters.tglSampai)}`, s: styleSubtitle }];
  for (let i = 1; i < totalCols; i++) rowDate.push({ v: '', s: {} });
  ws_data.push(rowDate);
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }); 

  // Baris 2: Baris Kosong (Spasi)
  const rowEmpty = Array.from({ length: totalCols }, () => ({ v: '', s: {} }));
  ws_data.push(rowEmpty);


  // --- BARIS HEADER TABEL (Mulai dari indeks ke-3) ---

  // Baris header 1: fixed cols + dept group + Team
  const rowHead1 = [
    { v: 'Style', s: styleHeaderMain }, { v: 'Order Qty', s: styleHeaderMain },
    { v: 'Sisa Qty\n(Linking Primary - Kirim)', s: styleHeaderMain }, { v: 'Date Range', s: styleHeaderMain },
    { v: 'Date', s: styleHeaderMain }, { v: 'Worker Day', s: styleHeaderMain },
    { v: 'Gedung', s: styleHeaderMain }, { v: 'Qty Total', s: styleHeaderMain }
  ];
  visibleProsesGrouped.value.forEach(grp => {
    const span = grp.proses.length * COLS_PER_PROSES;
    for (let i = 0; i < span; i++) rowHead1.push({ v: i === 0 ? grp.groupDept : '', s: styleHeaderDept });
  });
  rowHead1.push({ v: 'Team', s: styleHeaderMain });
  ws_data.push(rowHead1);

  // Baris header 2: nama proses per kolom
  const rowHead2 = Array.from({ length: FIXED_COLS }, () => ({ v: '', s: styleHeaderMain }));
  prosesList.forEach(proses => {
    for (let i = 0; i < COLS_PER_PROSES; i++) rowHead2.push({ v: i === 0 ? proses : '', s: styleHeaderDept });
  });
  rowHead2.push({ v: '', s: styleHeaderMain });
  ws_data.push(rowHead2);

  // Baris header 3: Target / Plan Team / OP 1 / OP 2 / Sisa OP/Team
  const rowHead3 = Array.from({ length: FIXED_COLS }, () => ({ v: '', s: styleHeaderMain }));
  prosesList.forEach(() => {
    rowHead3.push(
      { v: 'Target', s: styleSubHeader }, 
      { v: 'Plan Team', s: styleSubHeader }, 
      { v: 'OP 1', s: styleSubHeader }, 
      { v: 'OP 2', s: styleSubHeader },
      { v: 'Sisa OP/Team', s: styleSubHeader }
    );
  });
  rowHead3.push({ v: '', s: styleHeaderMain });
  ws_data.push(rowHead3);

  // Penyesuaian Indeks Header (Karena 3 baris judul di atas)
  const headRow1 = 3, headRow2 = 4, headRow3 = 5;
  for (let c = 0; c < FIXED_COLS; c++) merges.push({ s: { r: headRow1, c }, e: { r: headRow3, c } });
  merges.push({ s: { r: headRow1, c: totalCols - 1 }, e: { r: headRow3, c: totalCols - 1 } });

  let deptColStart = FIXED_COLS;
  visibleProsesGrouped.value.forEach(grp => {
    const span = grp.proses.length * COLS_PER_PROSES;
    if (span > 1) merges.push({ s: { r: headRow1, c: deptColStart }, e: { r: headRow1, c: deptColStart + span - 1 } });
    deptColStart += span;
  });
  let colStart = FIXED_COLS;
  prosesList.forEach(() => {
    merges.push({ s: { r: headRow2, c: colStart }, e: { r: headRow2, c: colStart + COLS_PER_PROSES - 1 } });
    colStart += COLS_PER_PROSES;
  });

  // Indeks Data dimulai dari baris ke-6 (0,1,2 judul | 3,4,5 header)
  let currentStyleRef = null;
  let styleStartRow = 6;
  let currentDateKey = null;
  let dateStartRow = 6;
  let rowCounter = 0;

  groupedData.value.forEach(style => {
    style.dates.forEach(dateGroup => {
      dateGroup.teams.forEach(team => {
        const currentRowIdx = 6 + rowCounter; 
        const isEven = rowCounter % 2 === 0;
        const c = getStyleDataCenter(isEven);
        const n = getStyleDataNum(isEven);
        const t = getStyleTeam(isEven);

        if (currentStyleRef !== style.xMark) {
          if (currentStyleRef !== null && styleStartRow < currentRowIdx - 1) {
            [0, 1, 2, 3, 5, 6].forEach(col => merges.push({ s: { r: styleStartRow, c: col }, e: { r: currentRowIdx - 1, c: col } }));
          }
          currentStyleRef = style.xMark;
          styleStartRow = currentRowIdx;
        }

        const dateKey = `${style.xMark}|${dateGroup.tglKey}`;
        if (currentDateKey !== dateKey) {
          if (currentDateKey !== null && dateStartRow < currentRowIdx - 1) {
            [4, 7].forEach(col => merges.push({ s: { r: dateStartRow, c: col }, e: { r: currentRowIdx - 1, c: col } }));
          }
          currentDateKey = dateKey;
          dateStartRow = currentRowIdx;
        }

        const formattedDate = formatDate(dateGroup.tglPlan);
        const row = [
          { v: style.xMark || '', s: c },
          { v: checkEmpty(style.orderQty), s: n },
          { v: checkEmpty(style.sisaQty), s: n },
          { v: style.delivery || '', s: c },
          { v: formattedDate === '-' ? '' : formattedDate, s: c },
          { v: style.workerDay ? `${style.workerDay} Day` : '', s: c },
          { v: style.gedung || '', s: c },
          { v: checkEmpty(dateGroup.qtyTotal), s: n }
        ];

        prosesList.forEach(proses => {
          const d = team.byProses[proses] || {};
          row.push(
            { v: checkEmpty(d.xTarget), s: n },
            { v: checkEmpty(d.qty_plan_perteam), s: n },
            { v: checkEmpty(d.worker_7jam), s: n },
            { v: checkEmpty(d.worker_14jam), s: n },
            { v: checkEmpty(d.sisa_org), s: n } 
          );
        });

        row.push({ v: team.namaTeam, s: t });
        ws_data.push(row);
        rowCounter++;
      });
    });
  });

  const lastRow = 6 + rowCounter - 1;
  if (currentStyleRef !== null && styleStartRow < lastRow) {
    [0, 1, 2, 3, 5, 6].forEach(col => merges.push({ s: { r: styleStartRow, c: col }, e: { r: lastRow, c: col } }));
  }
  if (currentDateKey !== null && dateStartRow < lastRow) {
    [4, 7].forEach(col => merges.push({ s: { r: dateStartRow, c: col }, e: { r: lastRow, c: col } }));
  }

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!merges'] = merges;

  const colWidths = [
    { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  prosesList.forEach(() => { 
    colWidths.push({ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }); 
  });
  colWidths.push({ wch: 22 });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report Plan PPC');
  XLSX.writeFile(wb, buildExportFileName());
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

.d-flex.flex-column.min-vh-100 {
  --ink: #101828; --ink-soft: #5b6472; --ink-faint: #8891a0; --surface: #ffffff;
  --bg: #f2f4f8; --border: #e3e7ee; --primary: #185c6e; --primary-dark: #123f4b;
  --primary-soft: #e3f0f2; --amber: #b8720a; --amber-soft: #fbeedd; --teal: #0f7d6b;
  --teal-soft: #e0f3ee; --success: #1f8a5f; --success-soft: #e3f6ec; --danger: #c4402a;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ink); background: var(--bg);
}
.font-mono, .num-cell { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace; font-variant-numeric: tabular-nums; }
.page-title-icon { width: 46px; height: 46px; border-radius: 13px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(18, 63, 75, 0.28); flex-shrink: 0; }
h2.h4 { letter-spacing: -0.01em; }
.sticky-toolbar { position: sticky; top: 0; z-index: 40; background: var(--bg); padding-top: 4px; padding-bottom: 2px; margin-bottom: 0.5rem; }
.toolbar-row { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.toolbar-date-group { display: flex; flex-wrap: wrap; gap: 0.75rem; flex: 1 1 320px; min-width: 0; }
.toolbar-date-group > div { min-width: 150px; flex: 1 1 150px; }
.toolbar-action-group { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.form-label-modern { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-soft); margin-bottom: 5px; display: block; }
.form-control-modern { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.5rem 0.85rem; font-weight: 600; color: var(--ink); }
.form-control-modern:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
.btn-reload { background: var(--primary-soft); color: var(--primary-dark); border: none; border-radius: 12px; padding: 0.55rem 1.2rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
.btn-reload:hover:not(:disabled) { background: var(--primary); color: #fff; }
.btn-reload:disabled { opacity: 0.6; }
.btn-export { background: var(--success-soft); color: #157347; border: none; border-radius: 12px; padding: 0.55rem 1.2rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
.btn-export:hover:not(:disabled) { background: var(--success); color: #fff; }
.btn-export:disabled { opacity: 0.6; }
.loading-overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(3px); z-index: 100; display: flex; align-items: center; justify-content: center; }
.loading-content { display: flex; flex-direction: column; align-items: center; background: white; padding: 2rem 3rem; border-radius: 1.25rem; box-shadow: 0 8px 32px rgba(16, 24, 40, 0.12); }
main { position: relative; min-width: 0; max-width: 100%; }
.empty-state-card { background: #fff; }
.empty-state-icon { width: 64px; height: 64px; border-radius: 16px; background: var(--bg); color: var(--ink-faint); display: inline-flex; align-items: center; justify-content: center; font-size: 1.8rem; }
.table-container { min-height: clamp(350px, 55vh, 550px); max-height: 70vh; overflow-y: auto; overflow-x: auto; position: relative; -webkit-overflow-scrolling: touch; }
/* ===== Tabel: border-collapse separate agar border sticky tidak hilang saat scroll ===== */
.planning-table { --h1: 38px; --h2: 38px; --h3: 34px; border-collapse: separate; border-spacing: 0; border-top: 1px solid var(--border); border-left: 1px solid var(--border); }
.planning-table > :not(caption) > * > * { border-width: 0 1px 1px 0; }

/* ===== Header sticky VERTICAL (3 baris bertumpuk: Dept -> Proses -> Target/Plan Team/OP1/OP2/Sisa) ===== */
.planning-table thead th.hdr-top,
.planning-table thead th.hdr-r1,
.planning-table thead th.hdr-r2,
.planning-table thead th.hdr-r3 { position: sticky; background-color: #f8f9fb; z-index: 20; white-space: nowrap; }
.planning-table thead th.hdr-top { top: 0; }
.planning-table thead th.hdr-r1 { top: 0; height: var(--h1); padding-block: 0; }
.planning-table thead th.hdr-r2 { top: var(--h1); height: var(--h2); padding-block: 0; }
.planning-table thead th.hdr-r3 { top: calc(var(--h1) + var(--h2)); height: var(--h3); padding-block: 0; box-shadow: 0 2px 2px -1px rgba(16, 24, 40, 0.1); }
.planning-table thead th.hdr-top[rowspan] { white-space: normal; }

/* ===== Kolom beku HORIZONTAL: Style, Order Qty, Sisa Qty, Date Range, Date, Worker Day, Gedung, PLAN Total ===== */
.planning-table .fz { position: sticky; background-color: #fff; z-index: 5; }
.planning-table thead th.fz { z-index: 30; background-color: #f8f9fb; }
.planning-table tbody tr:hover td.fz { background-color: #f8f9fb; }
.fz-1 { left: 0;     width: 120px; min-width: 120px; max-width: 120px; }
.fz-2 { left: 120px; width: 90px;  min-width: 90px;  max-width: 90px; }
.fz-3 { left: 210px; width: 130px; min-width: 130px; max-width: 130px; }
.fz-4 { left: 340px; width: 120px; min-width: 120px; max-width: 120px; }
.fz-5 { left: 460px; width: 100px; min-width: 100px; max-width: 100px; }
.fz-6 { left: 560px; width: 80px;  min-width: 80px;  max-width: 80px; }
.fz-7 { left: 640px; width: 90px;  min-width: 90px;  max-width: 90px; }
.fz-8 { left: 730px; width: 90px;  min-width: 90px;  max-width: 90px; box-shadow: 3px 0 4px -2px rgba(16, 24, 40, 0.18); }
.planning-table thead th { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--ink-soft); vertical-align: middle; padding: 0.65rem 0.5rem; }
.planning-table tbody td { font-size: 0.85rem; padding: 0.6rem 0.5rem; vertical-align: middle; border-color: var(--border); }
.planning-table tbody tr:hover { background: #f8f9fb; }
.dept-group-header { padding: 0.5rem 0.3rem; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink); border-bottom: 2px solid rgba(16, 24, 40, 0.12) !important; }
.dept-header { background: #f0f2f5; padding: 0.4rem 0.3rem; }
.dept-header--linking { background: #e7e9f8; } .dept-header--lo { background: #dcf3ec; } .dept-header--cbs { background: #f1e6fa; } .dept-header--steam { background: #fbeedd; } .dept-header--sewing { background: #e2eefc; } .dept-header--soomsontex { background: #f6e7d6; } .dept-header--qclampu { background: #e3f4e6; } .dept-header--sulam { background: #f5e2f4; } .dept-header--default { background: #eceff3; }
.subheader-target { background: #e8ecf1; color: #2c3e50; }
.subheader-planteam { background: #f3e9d8; color: #8a5a1e; }
.subheader-shift1 { background: #e1f3ee; color: #12806e; }
.subheader-shift2 { background: #fdf0e0; color: #b8720a; }
.subheader-sisaorg { background: #fdecea; color: #c4402a; } 
.badge-dept { font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 30px; white-space: nowrap; display: inline-block; }
.badge-dept--linking { background: #e7e9f8; color: #3b4fa0; } .badge-dept--lo { background: #dcf3ec; color: #12806e; } .badge-dept--cbs { background: #f1e6fa; color: #7c3aad; } .badge-dept--steam { background: #fbeedd; color: #b8720a; } .badge-dept--sewing { background: #e2eefc; color: #1d63c4; } .badge-dept--soomsontex { background: #f6e7d6; color: #9c5a1e; } .badge-dept--qclampu { background: #e3f4e6; color: #2e8b45; } .badge-dept--sulam { background: #f5e2f4; color: #a23e9e; } .badge-dept--default { background: #eceff3; color: #495057; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #c7ced9; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }
.filter-bar-title { font-size: 0.85rem; font-weight: 700; color: var(--ink); }
.btn-reset-all { background: transparent; border: 1.5px solid var(--border); color: var(--danger); border-radius: 30px; padding: 4px 12px; font-size: 0.76rem; font-weight: 600; transition: background-color 0.15s ease; }
.btn-reset-all:hover { background: #fdecea; border-color: var(--danger); }
.filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; }
.filter-grid-item { min-width: 0; }
.btn-filter-dropdown { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.5rem 0.85rem; font-weight: 600; font-size: 0.85rem; color: var(--ink); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.btn-filter-dropdown:hover { border-color: var(--primary); }
.btn-filter-dropdown i { color: var(--ink-faint); font-size: 0.8rem; }
.filter-dropdown-panel { border-radius: 14px; }
.filter-scroll { max-height: 220px; overflow-y: auto; padding-right: 4px; }
.active-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px dashed var(--border); }
.filter-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--primary-soft); color: var(--primary-dark); font-size: 0.74rem; font-weight: 600; padding: 4px 6px 4px 10px; border-radius: 30px; }
.filter-chip-label { font-weight: 700; opacity: 0.75; }
.filter-chip-remove { background: rgba(18, 63, 75, 0.12); border: none; color: var(--primary-dark); width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; line-height: 1; flex-shrink: 0; }
.filter-chip-remove:hover { background: var(--primary-dark); color: #fff; }
.filter-chip-remove i { font-size: 0.85rem; }
@media (max-width: 767.98px) {
  .filter-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.6rem; }
  .toolbar-row { flex-direction: column; align-items: stretch; }
  .toolbar-action-group { justify-content: stretch; }
  .toolbar-action-group > * { flex: 1 1 auto; }
  .sticky-toolbar { position: static; }
  .planning-table thead th { font-size: 0.6rem; padding: 0.4rem 0.3rem; }
  .planning-table tbody td { font-size: 0.72rem; padding: 0.4rem 0.3rem; }
}
</style>