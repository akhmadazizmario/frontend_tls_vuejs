<template>
  <div class="d-flex flex-column min-vh-100 bg-light text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" />

      <div v-if="loading" class="loading-overlay">
        <div class="text-center bg-white p-4 rounded-4 shadow-lg">
          <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
          <h6 class="fw-bold m-0 text-dark">Memproses Data...</h6>
        </div>
      </div>

    <main :class="['flex-grow-1 p-4 main-content transition-all', sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed']">
    <div class="container-fluid">
      
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="fw-bold text-dark m-0 d-flex align-items-center">
          <div class="icon-box me-3"><i class="bi bi-bar-chart-line-fill text-white"></i></div>
          Laporan Production Linking
        </h4>
        
        <div v-if="filteredDisplayData.length > 0" class="d-flex gap-2">
          <button @click="sendEmail" :disabled="isSendingEmail" class="btn btn-primary btn-sm shadow-sm px-3 fw-bold">
            <span v-if="isSendingEmail" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            <i v-else class="bi bi-envelope me-1"></i> EMAIL
          </button>
          <button @click="exportToExcel" class="btn btn-white border shadow-sm fw-bold px-3 text-success">
            <i class="bi bi-file-earmark-excel-fill me-2"></i>EXCEL
          </button>
          <button @click="exportToPDF" class="btn btn-white border shadow-sm fw-bold px-3 text-danger">
            <i class="bi bi-file-earmark-pdf-fill me-2"></i>PDF
          </button>
        </div>
      </div>

      <div class="mb-4 d-flex gap-3">
         <a href="/view-linking-pergedung" class="btn btn-primary active"><i class="bi bi-highlighter"></i> Input Gedung Linking</a>
      </div>

      <div class="card border-0 shadow-sm rounded-4 mb-4">
        <div class="card-body p-4">
          <div class="row g-3 align-items-end">
            <div class="col-md-4">
              <label class="label-tiny">TANGGAL MULAI</label>
              <input type="date" v-model="filter.start" class="form-control input-modern" />
            </div>
            <div class="col-md-4">
              <label class="label-tiny">TANGGAL SELESAI</label>
              <input type="date" v-model="filter.end" class="form-control input-modern" />
            </div>
            <div class="col-md-4">
              <button class="btn btn-primary w-100 fw-bold py-2 btn-modern shadow" @click="fetchData" :disabled="loading">
                <i class="bi bi-search me-2"></i> TAMPILKAN LAPORAN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasActiveColumnFilters" class="alert alert-info border-0 shadow-sm rounded-3 py-2 px-3 mb-3 d-flex align-items-center justify-content-between">
        <div class="small fw-semibold text-dark">
          <i class="bi bi-info-circle-fill me-2 text-info"></i>
          Filter Aktif: 
          <span v-if="selected.dates.length" class="badge bg-secondary me-1">DEL ({{ selected.dates.length }})</span>
          <span v-if="selected.styles.length" class="badge bg-primary me-1">STYLE ({{ selected.styles.length }})</span>
          <span v-if="selected.pos.length" class="badge bg-success me-1">PO ({{ selected.pos.length }})</span>
          <span v-if="selected.gedungs.length" class="badge bg-dark me-1">GEDUNG ({{ selected.gedungs.length }})</span>
          <span v-if="selected.processes.length" class="badge bg-warning text-dark me-1">PROCESS ({{ selected.processes.length }})</span>
        </div>
        <button class="btn btn-sm btn-link text-danger p-0 fw-bold text-decoration-none small" @click="clearColumnFiltersOnly">Clear Filter Kolom</button>
      </div>

      <div v-if="hasSearched && filteredDisplayData.length > 0" class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div class="table-responsive" style="max-height: 65vh;">
          <table id="report-table" class="table align-middle mb-0 custom-table">
            <thead>
              <tr>
                <th rowspan="2" :class="['text-center align-middle', selected.dates.length > 0 ? 'table-info' : '']" width="120">
                  <div class="d-flex flex-column align-items-center">
                    <span class="mb-1">DEL</span>
                    <div class="dropdown">
                      <button :class="['btn btn-filter btn-sm shadow-sm position-relative', selected.dates.length > 0 ? 'btn-primary text-white fw-bold' : '']" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                        <i class="bi bi-funnel-fill"></i>
                        <span v-if="selected.dates.length > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 9px; padding: 1px">
                          {{ selected.dates.length }}
                        </span>
                      </button>
                      <div class="dropdown-menu p-3 shadow-lg border-0 rounded-3" :style="{ width: '250px', zIndex: 1060 }">
                        <input type="text" v-model="searchTerms.dates" class="form-control form-control-sm mb-2" placeholder="Cari tanggal...">
                        <div class="filter-scroll" :style="{ maxHeight: '200px', overflowY: 'auto' }">
                          <div v-for="opt in filteredOptions('dates')" :key="opt" class="form-check py-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="selected.dates" :id="'d-'+opt">
                            <label class="form-check-label small" :for="'d-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>

                <th rowspan="2" :class="['text-center align-middle', selected.styles.length > 0 ? 'table-info' : '']" width="200">
                  <div class="d-flex flex-column align-items-center">
                    <span class="mb-1">STYLE</span>
                    <div class="dropdown">
                      <button :class="['btn btn-filter btn-sm shadow-sm position-relative', selected.styles.length > 0 ? 'btn-primary text-white fw-bold' : '']" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                        <i class="bi bi-funnel-fill"></i>
                        <span v-if="selected.styles.length > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger p-1" :style="{ fontSize: '9px' }">
                          {{ selected.styles.length }}
                        </span>
                      </button>
                      <div class="dropdown-menu p-3 shadow-lg border-0 rounded-3" :style="{ width: '250px', zIndex: 1060 }">
                        <input type="text" v-model="searchTerms.styles" class="form-control form-control-sm mb-2" placeholder="Cari style...">
                        <div class="filter-scroll" :style="{ maxHeight: '200px', overflowY: 'auto' }">
                          <div v-for="opt in filteredOptions('styles')" :key="opt" class="form-check py-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="selected.styles" :id="'s-'+opt">
                            <label class="form-check-label small" :for="'s-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>

                <th rowspan="2" :class="['text-center align-middle', selected.pos.length > 0 ? 'table-info' : '']" width="130">
                  <div class="d-flex flex-column align-items-center">
                    <span class="mb-1">PO</span>
                    <div class="dropdown">
                      <button :class="['btn btn-filter btn-sm shadow-sm position-relative', selected.pos.length > 0 ? 'btn-primary text-white fw-bold' : '']" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                        <i class="bi bi-funnel-fill"></i>
                        <span v-if="selected.pos.length > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" :style="{ fontSize: '9px' }">
                          {{ selected.pos.length }}
                        </span>
                      </button>
                      <div class="dropdown-menu p-3 shadow-lg border-0 rounded-3" :style="{ width: '200px', zIndex: 1060 }">
                        <input type="text" v-model="searchTerms.pos" class="form-control form-control-sm mb-2" placeholder="Cari PO...">
                        <div class="filter-scroll" :style="{ maxHeight: '200px', overflowY: 'auto' }">
                          <div v-for="opt in filteredOptions('pos')" :key="opt" class="form-check py-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="selected.pos" :id="'p-'+opt">
                            <label class="form-check-label small" :for="'p-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>

                <th rowspan="2" :class="['text-center align-middle', selected.gedungs.length > 0 ? 'table-info' : '']" width="110">
                  <div class="d-flex flex-column align-items-center">
                    <span class="mb-1">GEDUNG</span>
                    <div class="dropdown">
                      <button :class="['btn btn-filter btn-sm shadow-sm position-relative', selected.gedungs.length > 0 ? 'btn-primary text-white fw-bold' : '']" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                        <i class="bi bi-funnel-fill"></i>
                        <span v-if="selected.gedungs.length > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" :style="{ fontSize: '9px' }">
                          {{ selected.gedungs.length }}
                        </span>
                      </button>
                      <div class="dropdown-menu p-3 shadow-lg border-0 rounded-3" :style="{ width: '150px', zIndex: 1060 }">
                        <div class="filter-scroll" :style="{ maxHeight: '200px', overflowY: 'auto' }">
                          <div v-for="opt in options.gedungs" :key="opt" class="form-check py-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="selected.gedungs" :id="'g-'+opt">
                            <label class="form-check-label small" :for="'g-'+opt">{{ opt || 'N/A' }}</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
                <th rowspan="2" class="text-center align-middle" width="110">Kebutuhan</th>
                <th rowspan="2" class="text-center align-middle" width="110">Order Qty</th>
                <th rowspan="2" class="text-center align-middle" width="110">Terima</th>
                <th rowspan="2" class="text-center align-middle" width="110">Akum Terima</th>

                <th rowspan="2" :class="['text-center align-middle', selected.processes.length > 0 ? 'table-info' : '']">
                  <div class="d-flex flex-column align-items-center">
                    <span class="mb-1">PROCESS</span>
                    <div class="dropdown">
                      <button :class="['btn btn-filter btn-sm shadow-sm position-relative', selected.processes.length > 0 ? 'btn-primary text-white fw-bold' : '']" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                        <i class="bi bi-funnel-fill"></i>
                        <span v-if="selected.processes.length > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" :style="{ fontSize: '9px' }">
                          {{ selected.processes.length }}
                        </span>
                      </button>
                      <div class="dropdown-menu p-3 shadow-lg border-0 rounded-3" :style="{ width: '150px', zIndex: 1060 }">
                        <input type="text" v-model="searchTerms.processes" class="form-control form-control-sm mb-2" placeholder="Cari proses...">
                        <div class="filter-scroll" :style="{ maxHeight: '200px', overflowY: 'auto' }">
                          <div v-for="opt in filteredOptions('processes')" :key="opt" class="form-check py-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="selected.processes" :id="'pr-'+opt">
                            <label class="form-check-label small" :for="'pr-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
                                                                                                            
                <th colspan="2" class="text-center border-bottom-0 bg-primary text-white py-1">FINISH</th>
                <th rowspan="2" class="text-center bg-danger-subtle text-danger align-middle" width="110">KURANG</th>
              </tr>
              <tr>
                <th width="90" class="text-center bg-primary-subtle small fw-bold py-1">TODAY</th>
                <th width="90" class="text-center bg-primary-subtle small fw-bold py-1">TTL</th>
              </tr>
            </thead>
            
            <tbody class="bg-white">
              <template v-for="(group, i) in filteredDisplayData" :key="i">
                <tr v-for="(p, idx) in group.processes" :key="idx" class="table-row">
                  
                  <td v-if="idx === 0" :rowspan="group.processes.length" class="text-center small text-muted">
                    {{ formatDate(group.xminDate) }}
                  </td>
                  <td v-if="idx === 0" :rowspan="group.processes.length" class="fw-bold text-start text-primary ps-3">
                    {{ group.xMark }}
                  </td>
                  <td v-if="idx === 0" :rowspan="group.processes.length" class="text-center small text-secondary">
                    {{ group.xTimes }}
                  </td>
                  <td v-if="idx === 0" :rowspan="group.processes.length" class="text-center">
                    {{ group.gedung || '-' }}
                  </td>
                  <td v-if="idx === 0" :rowspan="group.processes.length" class="text-center fw-bold">
                    {{ group.totalkebutuhan || 0 }}
                  </td>
                  <td v-if="idx === 0" :rowspan="group.processes.length" class="text-center fw-bold">
                    {{ group.xOrdQty || 0 }}
                  </td>
                  <td v-if="idx === 0" :rowspan="group.processes.length" class="text-center fw-bold">
                    {{ group.tLTX_TLS || 0 }}
                  </td>
                  <td v-if="idx === 0" :rowspan="group.processes.length" class="text-center fw-bold">
                    {{ group.xLTX_TLS || 0 }}
                  </td>

                  <td :class="['text-start ps-3 small', p.xPrimary == 1 ? 'bg-warning-subtle fw-semibold text-dark' : '']">
                    {{ p.xProcess }}
                  </td>
                  
                  <td :class="['text-center', p.xPrimary == 1 ? 'bg-warning-subtle text-dark' : 'bg-success-light']">
                    {{ p.xTLS_Qty || 0 }}
                  </td>
                  
                  <td :class="['text-center fw-bold text-primary', p.xPrimary == 1 ? 'bg-warning-subtle text-dark' : 'bg-primary-light']">
                    {{ p.tTLS_Qty || 0 }}
                  </td>
                  
                  <td :class="['text-center fw-bold', p.xPrimary == 1 ? 'bg-warning-subtle text-danger' : 'bg-danger-light text-danger']">
                    {{ (p.tTLS_Qty || 0) - (group.xLTX_TLS || 0) }}
                  </td>

                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="p-3 bg-white border-top d-flex justify-content-between align-items-center">
          <small class="text-muted">Menampilkan <strong>{{ filteredDisplayData.length }}</strong> grup data</small>
          <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" @click="resetFilters">Reset Semua Filter</button>
        </div>
      </div>

<div v-if="filteredDisplayData.length > 0" class="mt-6 space-y-6">

  <!-- 1. RINGKASAN TOTAL SCAN PER-PROSES (REGULAR) -->
  <div class="bg-white p-4 rounded-lg shadow border border-gray-200 max-w-md">
    <h3 class="text-sm font-bold text-gray-800 mb-3 border-b pb-1">
      Ringkasan Total Scan Per-Proses
    </h3>
    <table class="w-full text-xs text-left border-collapse">
      <thead>
        <tr class="bg-gray-100 text-gray-700">
          <th class="p-2 border">Nama Proses</th>
          <th class="p-2 border text-right">Qty</th>
          <th class="p-2 border text-center">Total Scan</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(proc, index) in summaryProcesses" :key="proc.name" class="border-b">
          <td class="p-2 border font-medium">{{ proc.name }}</td>
          <td class="p-2 border text-right font-semibold">
            {{ proc.qty.toLocaleString('id-ID') }}
          </td>
          <!-- Merge Cell Kolom Total Scan -->
          <td 
            v-if="index === 0" 
            :rowspan="summaryProcesses.length" 
            class="p-2 border text-center font-bold text-sm bg-gray-50 text-gray-800 align-middle"
          >
            {{ grandTotalScan.toLocaleString('id-ID') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 2. RINGKASAN KHUSUS PRIMARY / SOOM (TERPISAH DI BWAH) -->
  <div v-if="summaryPrimary.length > 0" class="bg-amber-50 p-4 rounded-lg shadow border border-amber-200 max-w-md">
    <h3 class="text-sm font-bold text-amber-800 mb-3 border-b border-amber-200 pb-1">
      Ringkasan Total Primary
    </h3>
    <table class="w-full text-xs text-left border-collapse">
      <thead>
        <tr class="bg-amber-100 text-amber-900">
          <th class="p-2 border border-amber-200">Nama Proses</th>
          <th class="p-2 border border-amber-200 text-right">Qty</th>
          <th class="p-2 border border-amber-200 text-center">Total Primary</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(proc, index) in summaryPrimary" :key="'prim-' + proc.name" class="border-b border-amber-200">
          <td class="p-2 border border-amber-200 font-medium text-amber-950">{{ proc.name }}</td>
          <td class="p-2 border border-amber-200 text-right font-semibold text-amber-950">
            {{ proc.qty.toLocaleString('id-ID') }}
          </td>
          <!-- Merge Cell Kolom Total Primary -->
          <td 
            v-if="index === 0" 
            :rowspan="summaryPrimary.length" 
            class="p-2 border border-amber-200 text-center font-bold text-sm bg-amber-100/70 text-amber-900 align-middle"
          >
            {{ grandTotalPrimary.toLocaleString('id-ID') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

</div>
      <div v-if="hasSearched && !loading && filteredDisplayData.length === 0" class="text-center py-5 mt-5 bg-white rounded-4 shadow-sm">
          <i class="bi bi-database-exclamation display-1 text-light"></i>
          <h5 class="text-muted mt-3">Tidak ada data yang cocok dengan filter.</h5>
          <button class="btn btn-primary mt-3 rounded-pill px-4" @click="resetFilters">Bersihkan Filter</button>
      </div>

    </div>
  </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import axios from "axios";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import XLSXStyle from "xlsx-js-style";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(false);
const rawData = ref([]);
const pelengkapData = ref([]);
const loading = ref(false);
const hasSearched = ref(false);
const isSendingEmail = ref(false);

const filter = ref({
  start: new Date().toISOString().substr(0, 10),
  end: new Date().toISOString().substr(0, 10)
});

const selected = reactive({
  dates: [], styles: [], pos: [], xOrdQty: [], xLTX_TLS: [], tLTX_TLS: [], gedungs: [], needs: [], processes: []
});

const searchTerms = reactive({
  dates: '', styles: '', pos: '', xOrdQty: '', xLTX_TLS: '', tLTX_TLS: '' ,needs: '', processes: ''
});

// --- FUNGSI FORMAT TANGGAL ---
const formatDate = (dateString) => {
  if (!dateString || dateString === '-') return '-';
  const datePart = dateString.split('T')[0]; 
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
};

// --- FETCH DATA ---
const fetchData = async () => {
  loading.value = true;
  hasSearched.value = true;
  try {
    const [spRes, plRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/receive/summary-line`, { params: filter.value }),
      axios.get(`${API_BASE_URL}/receive/pelengkapview`, { params: filter.value })
    ]);
    
    rawData.value = spRes.data.data;
    pelengkapData.value = plRes.data.data;
    resetFilters();
  } catch (err) {
    alert("Gagal memuat data laporan.");
  } finally {
    setTimeout(() => { loading.value = false; }, 500);
  }
};

const resetFilters = () => {
  selected.dates = []; selected.styles = []; selected.pos = [];
  selected.xOrdQty = []; selected.xLTX_TLS = []; selected.tLTX_TLS = [];
  selected.gedungs = []; selected.needs = []; selected.processes = [];
  Object.keys(searchTerms).forEach(key => searchTerms[key] = '');
};

const clearColumnFiltersOnly = () => {
  selected.dates = []; selected.styles = []; selected.pos = [];
  selected.gedungs = []; selected.processes = [];
};

const hasActiveColumnFilters = computed(() => {
  return selected.dates.length > 0 || 
         selected.styles.length > 0 || 
         selected.pos.length > 0 || 
         selected.gedungs.length > 0 || 
         selected.processes.length > 0;
});

// --- PENGELOMPOKAN DATA TABEL UTAMA ---
const groupedData = computed(() => {
  const groups = {};
  
  rawData.value.forEach(item => {
    if (!groups[item.xMark]) {
      const primaryPO = rawData.value.find(
        r => r.xMark === item.xMark && r.xPrimary == 1
      );

      const extra = pelengkapData.value.find(p => {
        return p.xMark === item.xMark;
      }) || {};

      groups[item.xMark] = { 
        xMark: item.xMark, 
        xminDate: item.xminDate || '-', 
        xTimes: primaryPO?.xTimes || '-', 
        gedung: extra.gedung || '-', 
        totalkebutuhan: item.totalkebutuhan || 0,
        xOrdQty: item.xOrdQty || 0,
        tLTX_TLS: item.tLTX_TLS || 0,
        xLTX_TLS: item.xLTX_TLS || 0,
        kebutuhan: extra.kebutuhan || 0, 
        processes: [] 
      };
    }
    groups[item.xMark].processes.push(item);
  });
  
  return Object.values(groups).sort((a, b) => {
    if (a.xminDate === '-') return 1;
    if (b.xminDate === '-') return -1;
    return new Date(a.xminDate) - new Date(b.xminDate);
  });
});

const options = computed(() => {
  return {
    dates: [...new Set(groupedData.value.map(g => formatDate(g.xminDate)))].sort(),
    styles: [...new Set(groupedData.value.map(g => g.xMark))].sort((a, b) => 
      String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
    ),
    pos: [...new Set(groupedData.value.map(g => g.xTimes))].sort(),
    xOrdQty: [...new Set(groupedData.value.map(g => g.xOrdQty))].sort(),
    tLTX_TLS: [...new Set(groupedData.value.map(g => g.tLTX_TLS))].sort(),
    xLTX_TLS: [...new Set(groupedData.value.map(g => g.xLTX_TLS))].sort(),
    gedungs: [...new Set(groupedData.value.map(g => g.gedung))].sort(),
    needs: [...new Set(groupedData.value.map(g => String(g.kebutuhan)))].sort((a,b) => a-b),
    processes: [...new Set(rawData.value.map(r => r.xProcess))].sort()
  };
});

const filteredOptions = (key) => {
  return options.value[key].filter(opt => 
    String(opt).toLowerCase().includes(searchTerms[key].toLowerCase())
  );
};

const filteredDisplayData = computed(() => {
  return groupedData.value.filter(group => {
    const dMatch = selected.dates.length === 0 || selected.dates.includes(formatDate(group.xminDate));
    const sMatch = selected.styles.length === 0 || selected.styles.includes(group.xMark);
    const poMatch = selected.pos.length === 0 || selected.pos.includes(group.xTimes);
    const gMatch = selected.gedungs.length === 0 || selected.gedungs.includes(group.gedung);
    const nMatch = selected.needs.length === 0 || selected.needs.includes(String(group.kebutuhan));
    const prMatch = selected.processes.length === 0 || group.processes.some(p => selected.processes.includes(p.xProcess));
    return dMatch && sMatch && poMatch && gMatch && nMatch && prMatch;
  });
});

// =========================================================================
// 1. SUMMARY SELURUH PROSES (REGULAR)
// =========================================================================
const summaryProcesses = computed(() => {
  const processMap = {};
  
  filteredDisplayData.value.forEach(group => {
    group.processes.forEach(p => {
      if (selected.processes.length > 0 && !selected.processes.includes(p.xProcess)) {
        return;
      }

      const name = p.xProcess;
      const qty = Number(p.xTLS_Qty || 0);
      
      if (!processMap[name]) {
        processMap[name] = { name, qty };
      } else {
        processMap[name].qty += qty;
      }
    });
  });

  return Object.values(processMap).sort((a, b) => a.name.localeCompare(b.name));
});

const grandTotalScan = computed(() => {
  return summaryProcesses.value.reduce((sum, item) => sum + item.qty, 0);
});

// =========================================================================
// 2. SUMMARY KHUSUS PRIMARY (xPrimary == 1) TERPISAH
// =========================================================================
const summaryPrimary = computed(() => {
  const processMap = {};
  
  filteredDisplayData.value.forEach(group => {
    group.processes.forEach(p => {
      if (p.xPrimary == 1) {
        if (selected.processes.length > 0 && !selected.processes.includes(p.xProcess)) {
          return;
        }

        const name = p.xProcess;
        const qty = Number(p.xTLS_Qty || 0);
        
        if (!processMap[name]) {
          processMap[name] = { name, qty };
        } else {
          processMap[name].qty += qty;
        }
      }
    });
  });

  return Object.values(processMap).sort((a, b) => a.name.localeCompare(b.name));
});

const grandTotalPrimary = computed(() => {
  return summaryPrimary.value.reduce((sum, item) => sum + item.qty, 0);
});

// ================= EXPORT EXCEL (PER GEDUNG) =================
const exportToExcel = async () => {
  if (filteredDisplayData.value.length === 0) return alert("Tidak ada data untuk di-export");

  const dataGedungAB = filteredDisplayData.value.filter(item => {
    const g = String(item.gedung).toUpperCase();
    return g.includes('A') || g.includes('B');
  });

  const dataGedungC = filteredDisplayData.value.filter(item => {
    return String(item.gedung).toUpperCase().includes('C');
  });

  const dataGedungD = filteredDisplayData.value.filter(item => {
    return String(item.gedung).toUpperCase().includes('D');
  });

  const dataGedungABCD = [...filteredDisplayData.value];

  const generateExcelFile = async (groupData, namaGedung) => {
    if (groupData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Laporan Linking ${namaGedung}`);

    worksheet.getCell('A1').value = `LAPORAN PRODUKSI LINKING ${namaGedung.toUpperCase()} PERIODE: ${filter.value.start} S/D ${filter.value.end}`.toUpperCase();
    worksheet.getCell('A1').font = { name: 'Arial', size: 13, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };

    const headerRowData = ["DEL", "STYLE", "PO", "GEDUNG", "KEBUTUHAN", "ORDER QTY", "TERIMA", "AKUM TERIMA", "PROCESS", "TODAY", "TOTAL", "KURANG"];
    const headerRow = worksheet.addRow(headerRowData);
    headerRow.height = 25; 
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: '000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    groupData.forEach(group => {
      const startRow = worksheet.lastRow.number + 1;
      
      group.processes.forEach((p) => {
        const row = worksheet.addRow([
          formatDate(group.xminDate),
          group.xMark,
          group.xTimes,
          group.gedung || "-",
          group.totalkebutuhan || 0,
          group.xOrdQty || 0,
          group.tLTX_TLS || 0,
          group.xLTX_TLS || 0,
          p.xProcess,
          p.xTLS_Qty || 0,
          p.tTLS_Qty || 0,
          (p.tTLS_Qty || 0) - (group.xLTX_TLS || 0)
        ]);

        row.height = 20;

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        });

        if (p.xPrimary == 1) {
          const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFBF' } };
          [9, 10, 11, 12].forEach(colIndex => {
            const cell = row.getCell(colIndex);
            cell.fill = yellowFill;
            cell.font = { bold: true };
          });
        }
      });

      const endRow = worksheet.lastRow.number;

      if (startRow < endRow) {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
          worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`);
        });
      }
    });

    // --- HITUNG LOGIKA SUMMARY UNTUK EXCEL ---
    const procMap = {};
    const primaryMap = {};

    groupData.forEach(group => {
      group.processes.forEach(p => {
        const qty = Number(p.xTLS_Qty || 0);
        const name = p.xProcess;
        
        // Total Regular
        if (!procMap[name]) procMap[name] = { name, qty };
        else procMap[name].qty += qty;

        // Total Primary Khusus
        if (p.xPrimary == 1) {
          if (!primaryMap[name]) primaryMap[name] = { name, qty };
          else primaryMap[name].qty += qty;
        }
      });
    });

    const regList = Object.values(procMap).sort((a, b) => a.name.localeCompare(b.name));
    const regTotal = regList.reduce((sum, item) => sum + item.qty, 0);

    const primList = Object.values(primaryMap).sort((a, b) => a.name.localeCompare(b.name));
    const primTotal = primList.reduce((sum, item) => sum + item.qty, 0);

    // ==========================================
    // 1. TABEL SUMMARY TOTAL PROSES
    // ==========================================
    worksheet.addRow([]);
    worksheet.addRow([]);
    
    const summaryTitleRow = worksheet.addRow(["Ringkasan Total Scan Per-Proses"]);
    summaryTitleRow.getCell(1).font = { name: 'Arial', size: 11, bold: true };
    worksheet.mergeCells(`A${summaryTitleRow.number}:C${summaryTitleRow.number}`);

    const summaryStartRow = worksheet.lastRow.number + 1;

    regList.forEach((proc, index) => {
      const row = worksheet.addRow([proc.name, proc.qty, ""]);
      row.height = 20;

      row.getCell(1).font = { bold: true };
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell(2).font = { bold: true };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell(2).numFmt = '#,##0';

      row.getCell(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      row.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

      if (index === 0) {
        const cellC = row.getCell(3);
        cellC.value = "Total Scan";
        cellC.font = { bold: true, color: { argb: '595959' } };
        cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
        cellC.alignment = { vertical: 'middle', horizontal: 'center' };
        cellC.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      }
    });

    const summaryEndRow = worksheet.lastRow.number;

    if (regList.length > 1) {
      const totalMergeStart = summaryStartRow + 1;
      worksheet.mergeCells(`C${totalMergeStart}:C${summaryEndRow}`);
      const targetCell = worksheet.getCell(`C${totalMergeStart}`);
      targetCell.value = regTotal;
      targetCell.font = { bold: true, size: 12 };
      targetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
      targetCell.alignment = { vertical: 'middle', horizontal: 'center' };
      targetCell.numFmt = '#,##0';
      for(let r = totalMergeStart; r <= summaryEndRow; r++) {
        worksheet.getCell(`C${r}`).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      }
    } else if (regList.length === 1) {
      const singleTotalRow = worksheet.addRow(["", "", regTotal]);
      singleTotalRow.getCell(3).font = { bold: true };
      singleTotalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
      singleTotalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
      singleTotalRow.getCell(3).numFmt = '#,##0';
      singleTotalRow.getCell(3).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    }

    // ==========================================
    // 2. TABEL KHUSUS TOTAL PRIMARY (DI BWAH)
    // ==========================================
    if (primList.length > 0) {
      worksheet.addRow([]);
      
      const primTitleRow = worksheet.addRow(["Ringkasan Total Primary"]);
      primTitleRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'B25900' } };
      worksheet.mergeCells(`A${primTitleRow.number}:C${primTitleRow.number}`);

      const primStartRow = worksheet.lastRow.number + 1;

      primList.forEach((proc, index) => {
        const row = worksheet.addRow([proc.name, proc.qty, ""]);
        row.height = 20;

        row.getCell(1).font = { bold: true };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        
        row.getCell(2).font = { bold: true };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(2).numFmt = '#,##0';

        row.getCell(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        row.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

        if (index === 0) {
          const cellC = row.getCell(3);
          cellC.value = "Total Primary";
          cellC.font = { bold: true, color: { argb: 'B25900' } };
          cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } };
          cellC.alignment = { vertical: 'middle', horizontal: 'center' };
          cellC.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        }
      });

      const primEndRow = worksheet.lastRow.number;

      if (primList.length > 1) {
        const totalMergeStart = primStartRow + 1;
        worksheet.mergeCells(`C${totalMergeStart}:C${primEndRow}`);
        const targetCell = worksheet.getCell(`C${totalMergeStart}`);
        targetCell.value = primTotal;
        targetCell.font = { bold: true, size: 12, color: { argb: 'B25900' } };
        targetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } };
        targetCell.alignment = { vertical: 'middle', horizontal: 'center' };
        targetCell.numFmt = '#,##0';
        for(let r = totalMergeStart; r <= primEndRow; r++) {
          worksheet.getCell(`C${r}`).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        }
      } else if (primList.length === 1) {
        const singleTotalRow = worksheet.addRow(["", "", primTotal]);
        singleTotalRow.getCell(3).font = { bold: true, color: { argb: 'B25900' } };
        singleTotalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } };
        singleTotalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        singleTotalRow.getCell(3).numFmt = '#,##0';
        singleTotalRow.getCell(3).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      }
    }

    worksheet.columns.forEach(col => { col.width = 15; });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Laporan_Linking_Gedung_${namaGedung.replace(' & ', '_')}_${filter.value.start}.xlsx`);
  };

  try {
    await generateExcelFile(dataGedungAB, "A & B");
    await generateExcelFile(dataGedungC, "C");
    await generateExcelFile(dataGedungD, "D");
    await generateExcelFile(dataGedungABCD, "TOTALAN_ABCD");
  } catch (error) {
    console.error("Gagal export excel linking:", error);
    alert("Terjadi kesalahan saat memproses data Excel.");
  }
};

// ================= EXPORT PDF =================
const exportToPDF = async () => {
  if (filteredDisplayData.value.length === 0) return alert("Tidak ada data untuk di-export");

  const dataGedungAB = filteredDisplayData.value.filter(item => {
    const g = String(item.gedung).toUpperCase();
    return g.includes('A') || g.includes('B');
  });

  const dataGedungC = filteredDisplayData.value.filter(item => {
    return String(item.gedung).toUpperCase().includes('C');
  });

  const dataGedungD = filteredDisplayData.value.filter(item => {
    return String(item.gedung).toUpperCase().includes('D');
  });

  const dataGedungABCD = [...filteredDisplayData.value];

  const generatePDFFile = (groupData, namaGedung) => {
    if (groupData.length === 0) return;

    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(14);
    doc.text(`LAPORAN PRODUKSI LINKING GEDUNG ${namaGedung.toUpperCase()}`, 14, 10);
    doc.setFontSize(10);
    doc.text(`Periode: ${formatDate(filter.value.start)} - ${formatDate(filter.value.end)}`, 14, 16);

    const tableBody = [];
    const procMap = {};
    const primaryMap = {};

    groupData.forEach((group) => {
      const rowCount = group.processes.length;
      
      group.processes.forEach((p, idx) => {
        const rowMeta = { isPrimary: p.xPrimary == 1 };
        const qty = Number(p.xTLS_Qty || 0);
        const name = p.xProcess;

        // Process Total Regular
        if (!procMap[name]) procMap[name] = { name, qty };
        else procMap[name].qty += qty;

        // Process Total Primary
        if (p.xPrimary == 1) {
          if (!primaryMap[name]) primaryMap[name] = { name, qty };
          else primaryMap[name].qty += qty;
        }

        if (idx === 0) {
          tableBody.push([
            { content: formatDate(group.xminDate), rowSpan: rowCount, meta: rowMeta },
            { content: group.xMark, rowSpan: rowCount, meta: rowMeta },
            { content: group.xTimes, rowSpan: rowCount, meta: rowMeta },
            { content: group.gedung || "-", rowSpan: rowCount, meta: rowMeta },
            { content: (group.totalkebutuhan || 0).toLocaleString('id-ID'), rowSpan: rowCount, meta: rowMeta },
            { content: (group.xOrdQty || 0).toLocaleString('id-ID'), rowSpan: rowCount, meta: rowMeta },
            { content: (group.tLTX_TLS || 0).toLocaleString('id-ID'), rowSpan: rowCount, meta: rowMeta },
            { content: (group.xLTX_TLS || 0).toLocaleString('id-ID'), rowSpan: rowCount, meta: rowMeta },
            { content: p.xProcess, meta: rowMeta },
            { content: (p.xTLS_Qty || 0).toLocaleString('id-ID'), meta: rowMeta },
            { content: (p.tTLS_Qty || 0).toLocaleString('id-ID'), meta: rowMeta },
            { content: ((p.tTLS_Qty || 0) - (group.xLTX_TLS || 0)).toLocaleString('id-ID'), meta: rowMeta }
          ]);
        } else {
          tableBody.push([
            { content: p.xProcess, meta: rowMeta },
            { content: (p.xTLS_Qty || 0).toLocaleString('id-ID'), meta: rowMeta },
            { content: (p.tTLS_Qty || 0).toLocaleString('id-ID'), meta: rowMeta },
            { content: ((p.tTLS_Qty || 0) - (group.xLTX_TLS || 0)).toLocaleString('id-ID'), meta: rowMeta }
          ]);
        }
      });
    });

    autoTable(doc, {
      startY: 22,
      head: [["DEL", "STYLE", "PO", "GEDUNG", "KEBUTUHAN", "ORD QTY", "TERIMA", "AKUM TERIMA", "PROCESS", "TODAY", "TTL", "KURANG"]],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 7,
        halign: 'center',
        valign: 'middle',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [217, 217, 217],
        textColor: [0, 0, 0],
        halign: 'center',
        fontStyle: 'bold'
      },
      didParseCell: function (data) {
        if (data.section === 'head') return;
        const cellMeta = data.cell.raw && data.cell.raw.meta ? data.cell.raw.meta : null;

        if (cellMeta && cellMeta.isPrimary) {
          if (data.column.index >= 8 && data.column.index <= 11) {
            data.cell.styles.fillColor = [255, 239, 191]; 
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // --- SUMMARY PROSES ---
    const regList = Object.values(procMap).sort((a, b) => a.name.localeCompare(b.name));
    const regTotal = regList.reduce((sum, item) => sum + item.qty, 0);

    const primList = Object.values(primaryMap).sort((a, b) => a.name.localeCompare(b.name));
    const primTotal = primList.reduce((sum, item) => sum + item.qty, 0);

    let currentStartY = doc.lastAutoTable.finalY + 10;

    // Check page height space
    if (currentStartY + 50 > doc.internal.pageSize.height) {
      doc.addPage();
      currentStartY = 20;
    }

    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.text("Ringkasan Total Scan Per-Proses", 14, currentStartY);

    const summaryBody = [];
    regList.forEach((proc, index) => {
      if (index === 0) {
        summaryBody.push([
          { content: proc.name, styles: { fontStyle: 'bold', halign: 'left' } },
          { content: proc.qty.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right' } },
          { content: "Total Scan", styles: { fillColor: [242, 242, 242], fontStyle: 'bold', textColor: [89, 89, 89] } }
        ]);
      } else if (index === 1) {
        summaryBody.push([
          { content: proc.name, styles: { fontStyle: 'bold', halign: 'left' } },
          { content: proc.qty.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right' } },
          { content: regTotal.toLocaleString('id-ID'), rowSpan: regList.length - 1, styles: { fillColor: [242, 242, 242], fontStyle: 'bold', fontSize: 9 } }
        ]);
      } else {
        summaryBody.push([
          { content: proc.name, styles: { fontStyle: 'bold', halign: 'left' } },
          { content: proc.qty.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
      }
    });

    if (regList.length === 1) {
      summaryBody.push([
        { content: "", styles: { border: 'none' } },
        { content: "", styles: { border: 'none' } },
        { content: regTotal.toLocaleString('id-ID'), styles: { fillColor: [242, 242, 242], fontStyle: 'bold' } }
      ]);
    }

    autoTable(doc, {
      startY: currentStartY + 3,
      body: summaryBody,
      theme: 'grid',
      styles: { fontSize: 7.5, halign: 'center', valign: 'middle', cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 } },
      margin: { left: 14 }
    });

    // --- SUMMARY PRIMARY (DI BWAH) ---
    if (primList.length > 0) {
      let primStartY = doc.lastAutoTable.finalY + 8;
      
      if (primStartY + 30 > doc.internal.pageSize.height) {
        doc.addPage();
        primStartY = 20;
      }

      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(178, 89, 0);
      doc.text("Ringkasan Total Primary", 14, primStartY);

      const primSummaryBody = [];
      primList.forEach((proc, index) => {
        if (index === 0) {
          primSummaryBody.push([
            { content: proc.name, styles: { fontStyle: 'bold', halign: 'left', fillColor: [255, 242, 204] } },
            { content: proc.qty.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 242, 204] } },
            { content: "Total Primary", styles: { fillColor: [255, 230, 153], fontStyle: 'bold', textColor: [178, 89, 0] } }
          ]);
        } else if (index === 1) {
          primSummaryBody.push([
            { content: proc.name, styles: { fontStyle: 'bold', halign: 'left', fillColor: [255, 242, 204] } },
            { content: proc.qty.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 242, 204] } },
            { content: primTotal.toLocaleString('id-ID'), rowSpan: primList.length - 1, styles: { fillColor: [255, 230, 153], fontStyle: 'bold', textColor: [178, 89, 0], fontSize: 9 } }
          ]);
        } else {
          primSummaryBody.push([
            { content: proc.name, styles: { fontStyle: 'bold', halign: 'left', fillColor: [255, 242, 204] } },
            { content: proc.qty.toLocaleString('id-ID'), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 242, 204] } }
          ]);
        }
      });

      if (primList.length === 1) {
        primSummaryBody.push([
          { content: "", styles: { border: 'none' } },
          { content: "", styles: { border: 'none' } },
          { content: primTotal.toLocaleString('id-ID'), styles: { fillColor: [255, 230, 153], fontStyle: 'bold', textColor: [178, 89, 0] } }
        ]);
      }

      autoTable(doc, {
        startY: primStartY + 3,
        body: primSummaryBody,
        theme: 'grid',
        styles: { fontSize: 7.5, halign: 'center', valign: 'middle', cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 25 }, 2: { cellWidth: 30 } },
        margin: { left: 14 }
      });
    }

    doc.save(`Laporan_Linking_Gedung_${namaGedung.replace(' & ', '_')}_${filter.value.start}.pdf`);
  };

  try {
    generatePDFFile(dataGedungAB, "A & B");
    generatePDFFile(dataGedungC, "C");
    generatePDFFile(dataGedungD, "D");
    generatePDFFile(dataGedungABCD, "TOTALAN_ABCD");
  } catch (error) {
    console.error("Gagal export PDF linking:", error);
    alert("Terjadi kesalahan saat memproses cetak PDF.");
  }
};

// ================= SEND EMAIL =================
const sendEmail = async () => {
  if (filteredDisplayData.value.length === 0) {
    return alert("Tidak ada data untuk dikirim!");
  }

  const confirmSend = confirm("Apakah Anda yakin ingin mengirim semua laporan Linking via 1 Email?");
  if (!confirmSend) return;

  isSendingEmail.value = true;

  try {
    const tglPeriode = filter.value.start ? formatDate(filter.value.start) : "Semua Periode";
    const workbook = new ExcelJS.Workbook();

    const emailGroups = [
      {
        sheetName: "Gedung A & B",
        data: filteredDisplayData.value.filter(item => {
          const g = String(item.gedung).toUpperCase();
          return g.includes('A') || g.includes('B');
        })
      },
      {
        sheetName: "Gedung C",
        data: filteredDisplayData.value.filter(item => String(item.gedung).toUpperCase().includes('C'))
      },
      {
        sheetName: "Gedung D",
        data: filteredDisplayData.value.filter(item => String(item.gedung).toUpperCase().includes('D'))
      },
      {
        sheetName: "TOTALAN ABCD",
        data: [...filteredDisplayData.value]
      }
    ];

    let totalDataProses = 0;

    emailGroups.forEach(group => {
      if (group.data.length === 0) return; 

      totalDataProses++;
      
      const worksheet = workbook.addWorksheet(group.sheetName);

      worksheet.getCell('A1').value = `LAPORAN PRODUKSI LINKING ${group.sheetName.toUpperCase()} PERIODE: ${filter.value.start} S/D ${filter.value.end}`.toUpperCase();
      worksheet.getCell('A1').font = { name: 'Arial', size: 13, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };

      const headerRowData = ["DEL", "STYLE", "PO", "GEDUNG", "KEBUTUHAN", "ORDER QTY", "TERIMA", "AKUM TERIMA", "PROCESS", "TODAY", "TOTAL", "KURANG"];
      const headerRow = worksheet.addRow(headerRowData);
      headerRow.height = 25; 
      
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: '000000' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '808080' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });

      group.data.forEach(item => {
        const startRow = worksheet.lastRow.number + 1;
        
        item.processes.forEach((p) => {
          const row = worksheet.addRow([
            formatDate(item.xminDate),
            item.xMark,
            item.xTimes,
            item.gedung || "-",
            item.totalkebutuhan || 0,
            item.xOrdQty || 0,
            item.tLTX_TLS || 0,
            item.xLTX_TLS || 0,
            p.xProcess,
            p.xTLS_Qty || 0,
            p.tTLS_Qty || 0,
            (p.tTLS_Qty || 0) - (item.xLTX_TLS || 0)
          ]);

          row.height = 20;

          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          });

          if (p.xPrimary == 1) {
            const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFBF' } };
            [9, 10, 11, 12].forEach(colIndex => {
              const cell = row.getCell(colIndex);
              cell.fill = yellowFill;
              cell.font = { bold: true };
            });
          }
        });

        const endRow = worksheet.lastRow.number;

        if (startRow < endRow) {
          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
            worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`);
          });
        }
      });

      // --- LOGIKA SUMMARY EXCEL UNTUK EMAIL ---
      const procMap = {};
      const primaryMap = {};

      group.data.forEach(item => {
        item.processes.forEach(p => {
          const qty = Number(p.xTLS_Qty || 0);
          const name = p.xProcess;
          
          if (!procMap[name]) procMap[name] = { name, qty };
          else procMap[name].qty += qty;

          if (p.xPrimary == 1) {
            if (!primaryMap[name]) primaryMap[name] = { name, qty };
            else primaryMap[name].qty += qty;
          }
        });
      });

      const regList = Object.values(procMap).sort((a, b) => a.name.localeCompare(b.name));
      const regTotal = regList.reduce((sum, item) => sum + item.qty, 0);

      const primList = Object.values(primaryMap).sort((a, b) => a.name.localeCompare(b.name));
      const primTotal = primList.reduce((sum, item) => sum + item.qty, 0);

      // 1. SUMMARY ALL
      worksheet.addRow([]);
      worksheet.addRow([]);
      const summaryTitleRow = worksheet.addRow(["Ringkasan Total Scan Per-Proses"]);
      summaryTitleRow.getCell(1).font = { name: 'Arial', size: 11, bold: true };
      worksheet.mergeCells(`A${summaryTitleRow.number}:C${summaryTitleRow.number}`);

      const summaryStartRow = worksheet.lastRow.number + 1;

      regList.forEach((proc, index) => {
        const row = worksheet.addRow([proc.name, proc.qty, ""]);
        row.height = 20;

        row.getCell(1).font = { bold: true };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        row.getCell(2).font = { bold: true };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(2).numFmt = '#,##0';

        row.getCell(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        row.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

        if (index === 0) {
          const cellC = row.getCell(3);
          cellC.value = "Total Scan";
          cellC.font = { bold: true, color: { argb: '595959' } };
          cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
          cellC.alignment = { vertical: 'middle', horizontal: 'center' };
          cellC.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        }
      });

      const summaryEndRow = worksheet.lastRow.number;

      if (regList.length > 1) {
        const totalMergeStart = summaryStartRow + 1;
        worksheet.mergeCells(`C${totalMergeStart}:C${summaryEndRow}`);
        const targetCell = worksheet.getCell(`C${totalMergeStart}`);
        targetCell.value = regTotal;
        targetCell.font = { bold: true, size: 12 };
        targetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
        targetCell.alignment = { vertical: 'middle', horizontal: 'center' };
        targetCell.numFmt = '#,##0';
        for(let r = totalMergeStart; r <= summaryEndRow; r++) {
          worksheet.getCell(`C${r}`).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        }
      } else if (regList.length === 1) {
        const singleTotalRow = worksheet.addRow(["", "", regTotal]);
        singleTotalRow.getCell(3).font = { bold: true };
        singleTotalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
        singleTotalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        singleTotalRow.getCell(3).numFmt = '#,##0';
        singleTotalRow.getCell(3).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      }

      // 2. SUMMARY PRIMARY
      if (primList.length > 0) {
        worksheet.addRow([]);
        
        const primTitleRow = worksheet.addRow(["Ringkasan Total Primary (SOOM)"]);
        primTitleRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'B25900' } };
        worksheet.mergeCells(`A${primTitleRow.number}:C${primTitleRow.number}`);

        const primStartRow = worksheet.lastRow.number + 1;

        primList.forEach((proc, index) => {
          const row = worksheet.addRow([proc.name, proc.qty, ""]);
          row.height = 20;

          row.getCell(1).font = { bold: true };
          row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
          row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
          
          row.getCell(2).font = { bold: true };
          row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
          row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
          row.getCell(2).numFmt = '#,##0';

          row.getCell(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          row.getCell(2).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

          if (index === 0) {
            const cellC = row.getCell(3);
            cellC.value = "Total Primary";
            cellC.font = { bold: true, color: { argb: 'B25900' } };
            cellC.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } };
            cellC.alignment = { vertical: 'middle', horizontal: 'center' };
            cellC.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          }
        });

        const primEndRow = worksheet.lastRow.number;

        if (primList.length > 1) {
          const totalMergeStart = primStartRow + 1;
          worksheet.mergeCells(`C${totalMergeStart}:C${primEndRow}`);
          const targetCell = worksheet.getCell(`C${totalMergeStart}`);
          targetCell.value = primTotal;
          targetCell.font = { bold: true, size: 12, color: { argb: 'B25900' } };
          targetCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } };
          targetCell.alignment = { vertical: 'middle', horizontal: 'center' };
          targetCell.numFmt = '#,##0';
          for(let r = totalMergeStart; r <= primEndRow; r++) {
            worksheet.getCell(`C${r}`).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          }
        } else if (primList.length === 1) {
          const singleTotalRow = worksheet.addRow(["", "", primTotal]);
          singleTotalRow.getCell(3).font = { bold: true, color: { argb: 'B25900' } };
          singleTotalRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE699' } };
          singleTotalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
          singleTotalRow.getCell(3).numFmt = '#,##0';
          singleTotalRow.getCell(3).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        }
      }

      worksheet.columns.forEach(col => { col.width = 15; });
    });

    if (totalDataProses === 0) {
      isSendingEmail.value = false;
      return alert("Tidak ada data gedung yang valid untuk dikirim.");
    }

    const buffer = await workbook.xlsx.writeBuffer();
    
    const formData = new FormData();
    formData.append("periode", `${tglPeriode} (Gedung A, B, C, D)`);
    
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    formData.append("file", blob, `Laporan_Linking_All_Gedung_${filter.value.start}.xlsx`);

    await axios.post(`${API_BASE_URL}/emaillinking01/send-summary-email`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    alert("Laporan All Linking berhasil dikirim dalam 1 Email (Terpisah per Sheet)!");

  } catch (error) {
    console.error("Gagal mengirim email linking:", error);
    alert("Terjadi kesalahan saat mengirim email laporan.");
  } finally {
    isSendingEmail.value = false;
  }
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => { localStorage.clear(); window.location.href = "/login"; };

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
});
</script>

<style scoped>
/* Main Layout & Transition */
.transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.main-content { background-color: #f8f9fc; min-height: 100vh; }
.sidebar-expanded { margin-left: 250px; width: calc(100% - 250px); }
.sidebar-collapsed { margin-left: 70px; width: calc(100% - 70px); }

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Header Icon */
.icon-box {
  background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(78, 115, 223, 0.3);
}

/* Form Styling */
.label-tiny {
  font-size: 0.7rem;
  font-weight: 800;
  color: #4e73df;
  margin-bottom: 5px;
  letter-spacing: 0.5px;
}
.input-modern {
  border: 2px solid #e3e6f0;
  border-radius: 10px;
  padding: 10px 15px;
  font-weight: 500;
}
.input-modern:focus {
  border-color: #4e73df;
  box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.1);
}
.btn-modern {
  border-radius: 10px;
  transition: transform 0.2s;
}
.btn-modern:hover { transform: translateY(-2px); }

/* ============================================================
   TABLE DESIGN — Modern / International Standard Report Table
   ============================================================ */
.table-responsive {
  border-radius: 16px;
}

.custom-table {
  border: none;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, "Helvetica Neue", Arial, sans-serif;
}

/* Header */
.custom-table thead th {
  background: linear-gradient(180deg, #fbfbfe 0%, #f4f6fb 100%);
  color: #3b3f5c;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 14px 10px;
  border-bottom: 2px solid #e3e6f0;
  border-right: 1px solid #edf0f7;
  vertical-align: middle;
  position: sticky;
  top: 0;
  z-index: 5;
}
.custom-table thead th:first-child { border-top-left-radius: 12px; }
.custom-table thead th:last-child { border-top-right-radius: 12px; border-right: none; }
.custom-table thead tr:last-child th { top: 46px; }

/* Sub-header (TODAY / TTL) keep brand colors but refine */
.custom-table thead th.bg-primary {
  background: linear-gradient(135deg, #4e73df 0%, #3b5fc4 100%) !important;
  letter-spacing: 1px;
  font-size: 10.5px;
  padding: 8px 10px;
}
.custom-table thead th.bg-primary-subtle {
  background: #eef2fd !important;
  color: #3b56b0;
  font-size: 10px;
  letter-spacing: 0.4px;
}
.custom-table thead th.table-info {
  background: linear-gradient(180deg, #e7f1ff 0%, #dbe9ff 100%) !important;
}

/* Body cells */
.custom-table tbody td {
  padding: 11px 10px;
  border-bottom: 1px solid #f0f2f7;
  border-right: 1px solid #f5f6fa;
  color: #383a4a;
  vertical-align: middle;
}
.custom-table tbody td:last-child { border-right: none; }

/* Zebra striping for readability on dense reports */
.custom-table tbody tr:nth-of-type(even) { background-color: #fafbfd; }

/* Row hover */
.table-row { transition: background-color 0.15s ease; }
.table-row:hover td { background-color: #f2f6fd !important; }

/* Rounded bottom corners on last row */
.custom-table tbody tr:last-child td:first-child { border-bottom-left-radius: 12px; }
.custom-table tbody tr:last-child td:last-child { border-bottom-right-radius: 12px; }

.cell-nested {
  padding: 10px;
  border-bottom: 1px solid #f2f2f2;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell-nested:last-child { border-bottom: none; }

/* Filter Buttons */
.btn-filter {
  background: #ffffff;
  border: 1px solid #dde1ec;
  padding: 3px 9px;
  font-size: 10px;
  border-radius: 7px;
  color: #4e73df;
  transition: all 0.15s ease;
}
.btn-filter:hover {
  background: #eef2fd;
  border-color: #4e73df;
}
.filter-scroll {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 5px;
}
.filter-scroll::-webkit-scrollbar { width: 5px; }
.filter-scroll::-webkit-scrollbar-thumb { background: #dde1ec; border-radius: 10px; }

/* Cell Colors — softer, more refined tints */
.bg-success-light { background-color: #f2fbf6; }
.bg-primary-light { background-color: #eef3fe; }
.bg-danger-light { background-color: #fdf3f3; color: #c0392b; }

.badge { font-weight: 600; letter-spacing: 0.2px; }

/* Scrollbar for the whole table wrapper */
.table-responsive::-webkit-scrollbar { height: 8px; width: 8px; }
.table-responsive::-webkit-scrollbar-thumb { background: #dde1ec; border-radius: 10px; }
.table-responsive::-webkit-scrollbar-track { background: transparent; }
</style>