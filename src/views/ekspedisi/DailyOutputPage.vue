<template>
  <div class="d-flex flex-column min-vh-100 page-bg">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-4 transition-all mt-5" :style="{ marginLeft: sidebarOpen ? '16rem' : '0' }">
        <div class="container-fluid px-0 report-wrap">

          <!-- Page Heading -->
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-primary-subtle text-primary fw-bold px-2 py-1">Total Produksi Harian</span>
              </div>
              <h1 class="page-title mb-1">Daily Output Total</h1>
              <p class="text-muted small mb-0">Rekapan alur integrasi: <strong>Terima</strong> &rarr; <strong>Linking</strong> &rarr; <strong>Finishing</strong> &rarr; <strong>Kirim</strong></p>
            </div>

            <!-- Chip Filter Aktif -->
            <div class="d-flex flex-wrap align-items-center gap-2" v-if="activeFilterCount > 0">
              <span class="text-secondary small fw-semibold">Filter Aktif:</span>
              <span class="badge filter-chip rounded-pill" v-for="col in activeFilterColumns" :key="col.key">
                {{ col.label }} ({{ columnFilters[col.key].length }})
                <button type="button" class="btn-close btn-close-white ms-1" style="font-size:.5rem;"
                  @click="clearColumnFilter(col.key)" :aria-label="`Hapus filter ${col.label}`"></button>
              </span>
              <button type="button" class="btn btn-link btn-sm text-danger text-decoration-none p-0 fw-semibold ms-1"
                @click="clearAllFilters">
                <i class="bi bi-x-circle me-1"></i>Reset All
              </button>
            </div>
          </div>

          <!-- Quick Metrics Overview -->
          <div class="row g-3 mb-4" v-if="!loading && reportData.length > 0">
            <div class="col-12 col-sm-6 col-xl-3">
              <div class="card border-0 shadow-sm metric-card border-start border-4 border-info">
                <div class="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span class="text-muted small fw-semibold text-uppercase">Total Terima</span>
                    <h3 class="fw-bold mb-0 text-dark mt-1">{{ formatNum(grandTotal.Terima_qtyTLS) }}</h3>
                  </div>
                  <div class="metric-icon bg-info-subtle text-info">
                    <i class="bi bi-box-seam fs-4"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
              <div class="card border-0 shadow-sm metric-card border-start border-4 border-primary">
                <div class="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span class="text-muted small fw-semibold text-uppercase">Total Linking</span>
                    <h3 class="fw-bold mb-0 text-dark mt-1">{{ formatNum(grandTotal.Terima_LinkingQtyTLS) }}</h3>
                  </div>
                  <div class="metric-icon bg-primary-subtle text-primary">
                    <i class="bi bi-diagram-3 fs-4"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
              <div class="card border-0 shadow-sm metric-card border-start border-4 border-indigo">
                <div class="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span class="text-muted small fw-semibold text-uppercase">Finishing Process</span>
                    <h3 class="fw-bold mb-0 text-dark mt-1">{{ formatNum(totalFinishingProcess) }}</h3>
                  </div>
                  <div class="metric-icon bg-indigo-subtle text-indigo">
                    <i class="bi bi-gear-wide-connected fs-4"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-sm-6 col-xl-3">
              <div class="card border-0 shadow-sm metric-card border-start border-4 border-success">
                <div class="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span class="text-muted small fw-semibold text-uppercase">Total Kirim</span>
                    <h3 class="fw-bold mb-0 text-dark mt-1">{{ formatNum(grandTotal.Kirim_Qty) }}</h3>
                  </div>
                  <div class="metric-icon bg-success-subtle text-success">
                    <i class="bi bi-truck fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Toolbar Search & Date Filters -->
          <div class="card shadow-sm border-0 mb-4 toolbar-card">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex flex-column gap-3">
                
                <!-- Quick Date Presets -->
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <span class="text-secondary small fw-bold"><i class="bi bi-clock-history me-1"></i>Filter Cepat:</span>
                  <button 
                    v-for="preset in datePresets" 
                    :key="preset.key"
                    type="button"
                    class="btn btn-sm btn-preset"
                    :class="activePreset === preset.key ? 'btn-primary active' : 'btn-outline-secondary'"
                    @click="applyDatePreset(preset.key)"
                  >
                    {{ preset.label }}
                  </button>
                </div>

                <hr class="my-1 border-light-subtle" />

                <div class="d-flex flex-column flex-md-row align-items-stretch align-items-md-end justify-content-between gap-3">
                  <!-- Input Tanggal Awal & Akhir -->
                  <div class="d-flex flex-wrap align-items-center gap-3 flex-grow-1">
                    <div style="min-width: 180px; max-width: 240px;" class="flex-fill">
                      <label for="startDate" class="form-label small fw-bold text-secondary mb-1">
                        <i class="bi bi-calendar-event me-1"></i>Tanggal Awal
                      </label>
                      <input 
                        type="date" 
                        id="startDate" 
                        v-model="startDate" 
                        @change="activePreset = null" 
                        class="form-control form-control-custom" 
                      />
                    </div>

                    <div style="min-width: 180px; max-width: 240px;" class="flex-fill">
                      <label for="endDate" class="form-label small fw-bold text-secondary mb-1">
                        <i class="bi bi-calendar-check me-1"></i>Tanggal Akhir
                      </label>
                      <input 
                        type="date" 
                        id="endDate" 
                        v-model="endDate" 
                        @change="activePreset = null" 
                        class="form-control form-control-custom" 
                      />
                    </div>
                  </div>

                  <!-- Container Tombol Aksi -->
                  <div class="d-flex flex-wrap align-items-center gap-2 toolbar-btn-group">
                    <button type="button" @click="fetchData" class="btn btn-primary btn-action">
                      <i class="bi bi-search me-1"></i> Cari Data
                    </button>
                    <button type="button" @click="resetFilter" class="btn btn-light border btn-action">
                      <i class="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                    <button
                      type="button"
                      @click="exportToExcel"
                      :disabled="filteredData.length === 0"
                      class="btn btn-success btn-action"
                    >
                      <i class="bi bi-file-earmark-excel me-1"></i> Export Excel
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="card border-0 shadow-sm state-card">
            <div class="card-body d-flex flex-column align-items-center justify-content-center py-5">
              <div class="spinner-border text-primary mb-3" style="width: 2.5rem; height: 2.5rem;" role="status">
                <span class="visually-hidden">Memuat...</span>
              </div>
              <h6 class="fw-semibold text-dark mb-1">Sedang Memproses Data</h6>
              <span class="small text-muted">Mohon tunggu sebentar, sistem sedang mengambil data dari server...</span>
            </div>
          </div>

          <!-- Empty State (No Data Range) -->
          <div v-else-if="reportData.length === 0" class="card border-0 shadow-sm state-card">
            <div class="card-body d-flex flex-column align-items-center justify-content-center py-5 text-center">
              <div class="empty-icon-wrap mb-3">
                <i class="bi bi-inbox text-secondary display-5"></i>
              </div>
              <h6 class="fw-semibold text-dark mb-1">Data Tidak Ditemukan</h6>
              <p class="small text-muted mb-3" style="max-width: 420px;">
                Tidak ada rekapan output untuk rentang tanggal yang Anda pilih. Silakan sesuaikan tanggal pencarian.
              </p>
            </div>
          </div>

          <!-- Empty State (Filtered Out) -->
          <div v-else-if="filteredData.length === 0" class="card border-0 shadow-sm state-card">
            <div class="card-body d-flex flex-column align-items-center justify-content-center py-5 text-center">
              <div class="empty-icon-wrap bg-warning-subtle mb-3">
                <i class="bi bi-funnel text-warning fs-2"></i>
              </div>
              <h6 class="fw-semibold text-dark mb-1">Tidak Ada Hasil Filter</h6>
              <p class="small text-muted mb-3" style="max-width: 420px;">
                Kombinasi filter kolom yang diterapkan tidak mencocokkan baris mana pun.
              </p>
              <button class="btn btn-outline-primary btn-sm px-3 rounded-pill" @click="clearAllFilters">
                <i class="bi bi-arrow-counterclockwise me-1"></i> Bersihkan Semua Filter
              </button>
            </div>
          </div>

          <!-- Tabel Matriks Rekapan Output -->
          <div v-else class="card border-0 shadow-sm table-card">
            <!-- Alert Info Baris -->
            <div class="px-3 py-2 bg-light border-bottom d-flex align-items-center justify-content-between">
              <span class="small text-secondary">
                Menampilkan <strong>{{ filteredData.length }}</strong> dari <strong>{{ reportData.length }}</strong> data baris
              </span>
              <span class="badge bg-white text-secondary border small fw-normal">
                <i class="bi bi-info-circle me-1"></i>Gunakan filter di header kolom untuk menyaring
              </span>
            </div>

            <div class="table-responsive table-scroll">
              <table class="table table-hover align-middle mb-0 table-report">
                <thead>
                  <!-- Group Header (Baris Atas) -->
                  <tr>
                    <th rowspan="2" class="bg-header text-center align-middle sticky-col border-end">Tanggal</th>
                    <th colspan="1" class="bg-terima text-center border-end">Terima (WH A2)</th>
                    <th colspan="1" class="bg-linking text-center border-end">Linking TLS</th>
                    <th colspan="12" class="bg-process text-center border-end">Finishing Process</th>
                    <th colspan="1" class="bg-kirim text-center">Kirim (WH A2I)</th>
                  </tr>
                  <!-- Column Header (Baris Bawah) dengan filter -->
                  <tr>
                    <th
                      v-for="col in filterableColumns"
                      :key="col.key"
                      :class="['col-th', col.subClass]"
                    >
                      <ColumnFilter
                        :label="col.label"
                        :col-key="col.key"
                        :options="optionsFor(col.key)"
                        :selected="columnFilters[col.key]"
                        @update="onFilterUpdate"
                      />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(row, idx) in filteredData" :key="idx">
                    <td class="text-center fw-semibold bg-date-col sticky-col border-end">{{ formatDate(row.Tanggal) }}</td>

                    <td class="text-end fw-medium">{{ formatNum(row.Terima_qtyTLS) }}</td>
                    <td class="text-end fw-medium border-end">{{ formatNum(row.Terima_LinkingQtyTLS) }}</td>

                    <td class="text-end text-muted">{{ formatNum(row.Linking_Obras) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.Steam) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.CBS) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.CBS_HGSK) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.Sewing) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.Soom) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.Sontex) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.Soomsontex) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.Sontexkomplit) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.QCL_LB) }}</td>
                    <td class="text-end text-muted">{{ formatNum(row.QCL_BS) }}</td>
                    <td class="text-end text-muted border-end">{{ formatNum(row.Sulam) }}</td>

                    <td class="text-end fw-bold text-success-emphasis bg-kirim-cell">{{ formatNum(row.Kirim_Qty) }}</td>
                  </tr>
                </tbody>

                <!-- Footer Baris Total Keseluruhan -->
                <tfoot>
                  <tr class="bg-footer fw-bold">
                    <td class="text-center sticky-col border-end">GRAND TOTAL</td>

                    <td class="text-end">{{ formatNum(grandTotal.Terima_qtyTLS) }}</td>
                    <td class="text-end border-end">{{ formatNum(grandTotal.Terima_LinkingQtyTLS) }}</td>

                    <td class="text-end">{{ formatNum(grandTotal.Linking_Obras) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.Steam) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.CBS) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.CBS_HGSK) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.Sewing) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.Soom) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.Sontex) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.Soomsontex) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.Sontexkomplit) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.QCL_LB) }}</td>
                    <td class="text-end">{{ formatNum(grandTotal.QCL_BS) }}</td>
                    <td class="text-end border-end">{{ formatNum(grandTotal.Sulam) }}</td>

                    <td class="text-end text-success-emphasis">{{ formatNum(grandTotal.Kirim_Qty) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import axios from 'axios';
import * as XLSX from 'xlsx-js-style';

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";
import ColumnFilter from "../ekspedisi/ColumnFilter.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sidebarOpen = ref(true);
const user = ref({ name: "User" });
const reportData = ref([]);
const loading = ref(false);

// Helper format YYYY-MM-DD lokal
const formatDateToInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Default Date State
const today = formatDateToInput(new Date());
const startDate = ref(today);
const endDate = ref(today);
const activePreset = ref('today');

// Opsi Quick Presets
const datePresets = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'yesterday', label: 'Kemarin' },
  { key: '2weeks', label: '2 Minggu' },
  { key: '1month', label: '1 Bulan' },
  { key: '2months', label: '2 Bulan' },
  { key: '3months', label: '3 Bulan' },
  { key: '1year', label: '1 Tahun' },
];

// Definisi kolom filter tabel
const filterableColumns = [
  { key: 'Terima_qtyTLS', label: 'Qty TLS', subClass: 'bg-terima-sub' },
  { key: 'Terima_LinkingQtyTLS', label: 'Linking Primary', subClass: 'bg-linking-sub border-end' },
  { key: 'Linking_Obras', label: 'Linking Obras', subClass: 'bg-process-sub' },
  { key: 'Steam', label: 'Steam', subClass: 'bg-process-sub' },
  { key: 'CBS', label: 'CBS', subClass: 'bg-process-sub' },
  { key: 'CBS_HGSK', label: 'CBS HGSK', subClass: 'bg-process-sub' },
  { key: 'Sewing', label: 'Sewing', subClass: 'bg-process-sub' },
  { key: 'Soom', label: 'Soom', subClass: 'bg-process-sub' },
  { key: 'Sontex', label: 'Sontex', subClass: 'bg-process-sub' },
  { key: 'Soomsontex', label: 'Soomsontex', subClass: 'bg-process-sub' },
  { key: 'Sontexkomplit', label: 'Sontexkomplit', subClass: 'bg-process-sub'},
  { key: 'QCL_LB', label: 'QCL LB', subClass: 'bg-process-sub' },
  { key: 'QCL_BS', label: 'QCL BS', subClass: 'bg-process-sub' },
  { key: 'Sulam', label: 'Sulam', subClass: 'bg-process-sub border-end' },
  { key: 'Kirim_Qty', label: 'Qty Kirim', subClass: 'bg-kirim-sub' },
];

const columnFilters = reactive(
  Object.fromEntries(filterableColumns.map(c => [c.key, []]))
);

const onFilterUpdate = ({ key, values }) => { columnFilters[key] = values; };
const clearColumnFilter = (key) => { columnFilters[key] = []; };
const clearAllFilters = () => { filterableColumns.forEach(c => { columnFilters[c.key] = []; }); };

const activeFilterColumns = computed(() => filterableColumns.filter(c => columnFilters[c.key].length > 0));
const activeFilterCount = computed(() => activeFilterColumns.value.length);

const rowMatchesFilters = (row, excludeKey = null) => {
  return filterableColumns.every(col => {
    if (col.key === excludeKey) return true;
    const selected = columnFilters[col.key];
    if (!selected || selected.length === 0) return true;
    return selected.includes(formatNum(row[col.key]));
  });
};

const optionsFor = (key) => {
  const seen = new Map();
  reportData.value.forEach(row => {
    if (!rowMatchesFilters(row, key)) return;
    const display = formatNum(row[key]);
    seen.set(display, (seen.get(display) || 0) + 1);
  });
  return Array.from(seen.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value, 'id', { numeric: true }));
};

const filteredData = computed(() => reportData.value.filter(row => rowMatchesFilters(row, null)));

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const formatNum = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('id-ID');
};

const grandTotal = computed(() => {
  const totals = {
    Terima_qtyTLS: 0, Terima_LinkingQtyTLS: 0, Linking_Obras: 0, Steam: 0, CBS: 0,
    CBS_HGSK: 0, Sewing: 0, Soom: 0, Sontex: 0, Soomsontex: 0, Sontexkomplit: 0, QCL_LB: 0,
    QCL_BS: 0, Sulam: 0, Kirim_Qty: 0
  };

  filteredData.value.forEach(item => {
    Object.keys(totals).forEach(key => { totals[key] += Number(item[key]) || 0; });
  });

  return totals;
});

const totalFinishingProcess = computed(() => {
  const gt = grandTotal.value;
  return gt.Linking_Obras + gt.Steam + gt.CBS + gt.CBS_HGSK + gt.Sewing +
         gt.Soom + gt.Sontex + gt.Soomsontex + gt.Sontexkomplit + gt.QCL_LB + gt.QCL_BS + gt.Sulam;
});

// Fungsi Eksekusi Preset Tanggal
const applyDatePreset = (presetKey, autoFetch = true) => {
  activePreset.value = presetKey;
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (presetKey) {
    case 'today':
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
      break;
    case '2weeks':
      start.setDate(now.getDate() - 14);
      break;
    case '1month':
      start.setMonth(now.getMonth() - 1);
      break;
    case '2months':
      start.setMonth(now.getMonth() - 2);
      break;
    case '3months':
      start.setMonth(now.getMonth() - 3);
      break;
    case '1year':
      start.setFullYear(now.getFullYear() - 1);
      break;
  }

  startDate.value = formatDateToInput(start);
  endDate.value = formatDateToInput(end);

  if (autoFetch) {
    fetchData();
  }
};

// Ambil Data dari API Backend
const fetchData = async () => {
  if (!startDate.value || !endDate.value) {
    alert("Silahkan pilih Tanggal Awal dan Tanggal Akhir!");
    return;
  }

  loading.value = true;
  reportData.value = [];
  clearAllFilters();

  try {
    const response = await axios.get(`${API_BASE_URL}/ekspedisi/daily-output-total`, {
      params: { startDate: startDate.value, endDate: endDate.value }
    });

    if (response.data && response.data.success) {
      reportData.value = response.data.data;
    } else {
      alert(response.data?.message || "Gagal mengambil data rekapan.");
    }
  } catch (error) {
    console.error("Error fetching daily output total:", error);
    alert(error.response?.data?.message || "Terjadi kesalahan sistem saat mengambil data.");
  } finally {
    loading.value = false;
  }
};

// Reset Filter Ke Default
const resetFilter = () => {
  applyDatePreset('today');
  reportData.value = [];
  clearAllFilters();
};

// Export ke Excel
const exportToExcel = () => {
  if (filteredData.value.length === 0) return;

  const headerRow1 = [
    "Tanggal", "Terima (WH A2)", "Linking TLS",
    "Finishing Process", "", "", "", "", "", "", "", "", "", "",
    "Kirim (WH A2I)"
  ];
  const headerRow2 = [
    "", "Qty TLS", "Linking Primary",
    "Linking Obras", "Steam", "CBS", "CBS HGSK", "Sewing", "Soom", "Sontex", "Soomsontex", "Sontexkomplit", "QCL LB", "QCL BS", "Sulam",
    "Qty Kirim"
  ];

  const dataRows = filteredData.value.map(r => ([
    formatDate(r.Tanggal),
    r.Terima_qtyTLS, r.Terima_LinkingQtyTLS,
    r.Linking_Obras, r.Steam, r.CBS, r.CBS_HGSK, r.Sewing, r.Soom, r.Sontex, r.Soomsontex, r.Sontexkomplit, r.QCL_LB, r.QCL_BS, r.Sulam,
    r.Kirim_Qty
  ]));

  const gt = grandTotal.value;
  const totalRow = [
    "GRAND TOTAL",
    gt.Terima_qtyTLS, gt.Terima_LinkingQtyTLS,
    gt.Linking_Obras, gt.Steam, gt.CBS, gt.CBS_HGSK, gt.Sewing, gt.Soom, gt.Sontex, gt.Soomsontex, gt.Sontexkomplit, gt.QCL_LB, gt.QCL_BS, gt.Sulam,
    gt.Kirim_Qty
  ];

  const excelRows = [headerRow1, headerRow2, ...dataRows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(excelRows);

  const totalCols = 16;
  const lastRowIdx = excelRows.length - 1;

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
    { s: { r: 0, c: 3 }, e: { r: 0, c: 14 } },
    { s: { r: 0, c: 15 }, e: { r: 1, c: 15 } }
  ];

  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 16 },
    { wch: 11 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 13 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 13 },
    { wch: 12 }
  ];
  ws['!rows'] = [{ hpt: 24 }, { hpt: 22 }];

  const thin = { style: "thin", color: { rgb: "FFE2E8F0" } };
  const borderAll = { top: thin, bottom: thin, left: thin, right: thin };

  const colorMap = {
    terima: "FFE0F2FE", terimaText: "FF0369A1",
    linking: "FFDBEAFE", linkingText: "FF1E40AF",
    process: "FFE0E7FF", processText: "FF3730A3",
    processSub: "FFF5F3FF", processSubText: "FF312E81",
    kirim: "FFDCFCE7", kirimText: "FF166534",
    headerGrey: "FFF1F5F9",
    footer: "FFE2E8F0",
    white: "FFFFFFFF",
    lightGrey: "FFF8FAFC",
  };

  const styleCell = (r, c, style) => {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { t: 's', v: '' };
    ws[addr].s = { ...(ws[addr].s || {}), ...style };
  };

  const baseHeaderStyle = (bg, color) => ({
    fill: { fgColor: { rgb: bg } },
    font: { bold: true, color: { rgb: color }, sz: 10, name: 'Segoe UI' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderAll,
  });

  styleCell(0, 0, baseHeaderStyle(colorMap.headerGrey, "FF1F2937"));
  styleCell(0, 1, baseHeaderStyle(colorMap.terima, colorMap.terimaText));
  styleCell(0, 2, baseHeaderStyle(colorMap.linking, colorMap.linkingText));
  for (let c = 3; c <= 14; c++) styleCell(0, c, baseHeaderStyle(colorMap.process, colorMap.processText));
  styleCell(0, 15, baseHeaderStyle(colorMap.kirim, colorMap.kirimText));

  styleCell(1, 0, baseHeaderStyle(colorMap.headerGrey, "FF1F2937"));
  styleCell(1, 1, baseHeaderStyle("FFF0F9FF", colorMap.terimaText));
  styleCell(1, 2, baseHeaderStyle("FFEFF6FF", colorMap.linkingText));
  for (let c = 3; c <= 14; c++) styleCell(1, c, baseHeaderStyle(colorMap.processSub, colorMap.processSubText));
  styleCell(1, 15, baseHeaderStyle("FFF0FDF4", colorMap.kirimText));

  for (let r = 2; r < 2 + dataRows.length; r++) {
    for (let c = 0; c < totalCols; c++) {
      const isDateCol = c === 0;
      styleCell(r, c, {
        border: borderAll,
        alignment: { horizontal: isDateCol ? 'center' : 'right', vertical: 'center' },
        font: { bold: isDateCol, sz: 10, color: { rgb: "FF334155" }, name: 'Segoe UI' },
        fill: { fgColor: { rgb: isDateCol ? colorMap.lightGrey : colorMap.white } },
        numFmt: isDateCol ? undefined : "#,##0",
      });
    }
  }

  for (let c = 0; c < totalCols; c++) {
    styleCell(lastRowIdx, c, {
      border: borderAll,
      fill: { fgColor: { rgb: colorMap.footer } },
      font: { bold: true, sz: 10, color: { rgb: "FF0F172A" }, name: 'Segoe UI' },
      alignment: { horizontal: c === 0 ? 'center' : 'right', vertical: 'center' },
      numFmt: c === 0 ? undefined : "#,##0",
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daily Output Total");
  XLSX.writeFile(wb, `Daily_Output_Total_${startDate.value}_sd_${endDate.value}.xlsx`);
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};
</script>

<style scoped>
/* Page Layout */
.page-bg { background: #f8fafc; }
.report-wrap { padding: 4px; }

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

/* Custom Metrics Cards */
.metric-card {
  border-radius: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
}
.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-indigo-subtle { background-color: #e0e7ff; }
.text-indigo { color: #4338ca; }
.border-indigo { border-color: #6366f1 !important; }

/* Filter Chips & Toolbar */
.filter-chip {
  background: #3b82f6;
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
  padding: 5px 10px;
  display: inline-flex;
  align-items: center;
}

.toolbar-card {
  border-radius: 12px;
  background: #ffffff;
}

/* Style Tombol Quick Filter Preset */
.btn-preset {
  font-size: 12px !important;
  font-weight: 500 !important;
  border-radius: 20px !important;
  padding: 3px 12px !important;
  transition: all 0.2s ease !important;
}

.btn-preset.active {
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
}

.form-control-custom {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  height: 38px;
}
.form-control-custom:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.toolbar-btn-group {
  min-width: max-content !important;
}

.btn-action {
  font-size: 13px !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
  padding: 0 16px !important;
  white-space: nowrap !important;
  width: auto !important;
  min-width: max-content !important;
  height: 38px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
  transition: all 0.2s ease !important;
}

.btn-action:hover {
  transform: translateY(-1px) !important;
}

.btn-action i {
  font-size: 14px !important;
  margin-right: 6px !important;
}

/* Empty State Cards */
.state-card {
  border-radius: 12px;
  min-height: 300px;
}
.empty-icon-wrap {
  width: 60px;
  height: 60px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Table Styling */
.table-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.table-scroll {
  min-height: 480px;
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: auto;
}

.table-report {
  font-size: 12px;
  white-space: nowrap;
  border-collapse: separate;
  border-spacing: 0;
}

.table-report th, 
.table-report td {
  border-color: #e2e8f0;
  padding: 8px 12px;
}

.col-th { padding: 0; }

/* Sticky Positioning Rules */
.table-report thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: inset 0 -1px 0 #cbd5e1;
}

.table-report thead tr:nth-child(2) th {
  top: 36px;
}

.sticky-col {
  position: sticky;
  left: 0;
  z-index: 5;
}

.table-report thead .sticky-col {
  z-index: 15;
}

.table-report tfoot td {
  position: sticky;
  bottom: 0;
  z-index: 10;
  box-shadow: inset 0 1px 0 #cbd5e1;
}

.table-report tfoot .sticky-col {
  z-index: 15;
}

/* Row Hover Interactions */
.table-report tbody tr {
  transition: background-color 0.15s ease;
}
.table-report tbody tr:hover td {
  background-color: #f1f5f9 !important;
}

/* Header & Cell Colors */
.bg-header { background-color: #f1f5f9; font-weight: 700; color: #1e293b; }

.bg-terima { background-color: #e0f2fe; color: #0369a1; font-weight: 700; }
.bg-terima-sub { background-color: #f0f9ff; color: #0284c7; }

.bg-linking { background-color: #dbeafe; color: #1e40af; font-weight: 700; }
.bg-linking-sub { background-color: #eff6ff; color: #1d4ed8; }

.bg-process { background-color: #e0e7ff; color: #3730a3; font-weight: 700; }
.bg-process-sub { background-color: #f5f3ff; color: #4338ca; }

.bg-kirim { background-color: #dcfce7; color: #166534; font-weight: 700; }
.bg-kirim-sub { background-color: #f0fdf4; color: #15803d; }

.bg-date-col { background-color: #f8fafc; color: #334155; }
.bg-kirim-cell { background-color: #f0fdf4; }
.bg-footer { background-color: #e2e8f0; font-size: 12.5px; color: #0f172a; }

@media (max-width: 768px) {
  .table-scroll { min-height: 320px; max-height: 60vh; }
  .page-title { font-size: 1.25rem; }
}
</style>