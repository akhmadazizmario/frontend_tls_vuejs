<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft font-sans overflow-x-hidden">
    <!-- HEADER -->
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <!-- SIDEBAR -->
      <Sidebar :isOpen="sidebarOpen" />

      <!-- MAIN CONTENT (Ditambahkan class "main-wrapper" untuk mengunci layout) -->
      <main
        class="flex-grow-1 p-3 p-md-4 p-lg-5 transition-all main-wrapper"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 992 ? '16rem' : '0',
          marginTop: '56px',
        }"
      >
        <div class="container-fluid retur-page max-w-7xl mx-auto p-0">

          <!-- PAGE HEADER -->
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
            <div>
              <h4 class="fw-bold text-slate-800 mb-1 d-flex align-items-center gap-2">
                <i class="bi bi-bar-chart-steps text-primary"></i> Laporan Retur Produksi
              </h4>
              <p class="text-slate-500 small mb-0">
                Akumulasi Tolakan & Perbaikan berdasarkan Style, Warna, dan Size
              </p>
            </div>
            <div>
              <button class="btn btn-success d-flex align-items-center gap-2 px-4 shadow-sm fw-semibold btn-modern" @click="exportExcelFrontend" :disabled="groupedByStyle.length === 0">
                <i class="bi bi-file-earmark-excel-fill"></i> Export Excel
              </button>
            </div>
          </div>

          <!-- GLOBAL FILTER PANEL -->
          <div class="card border-0 shadow-sm rounded-4 mb-4 filter-card w-100">
            <div class="card-body p-4">
              <div class="row g-3 align-items-end">
                
                <!-- Filter Tanggal -->
                <div class="col-12 col-md-6 col-xl-3">
                  <label class="form-label text-slate-600 fw-semibold small mb-2">Akumulasi s/d Tanggal</label>
                  <div class="input-group modern-input-group">
                    <span class="input-group-text bg-white text-slate-400 border-end-0"><i class="bi bi-calendar3"></i></span>
                    <input type="date" v-model="filters.filterDate" class="form-control border-start-0 ps-0 text-slate-700" />
                  </div>
                </div>

                <!-- Filter Style (Multi Checkbox + Search) -->
                <div class="col-12 col-md-6 col-xl-3 position-relative" ref="dropdownStyleRef">
                  <label class="form-label text-slate-600 fw-semibold small mb-2">Filter Style</label>
                  <div 
                    class="form-control modern-select d-flex justify-content-between align-items-center cursor-pointer"
                    @click="toggleDropdown('style')"
                    :class="{'border-primary shadow-sm-primary': dropdowns.style}"
                  >
                    <span class="text-truncate text-slate-700" :class="{'text-slate-400': selectedFilters.style.length === 0}">
                      {{ selectedFilters.style.length > 0 ? `${selectedFilters.style.length} Style dipilih` : 'Semua Style' }}
                    </span>
                    <i class="bi bi-chevron-down text-slate-400 transition-transform" :class="{'rotate-180': dropdowns.style}"></i>
                  </div>
                  
                  <!-- Dropdown Panel Style -->
                  <div v-if="dropdowns.style" class="modern-dropdown-panel shadow-lg">
                    <div class="p-2 border-bottom">
                      <div class="search-input-wrapper">
                        <i class="bi bi-search text-slate-400"></i>
                        <input type="text" v-model="searchQueries.style" class="form-control form-control-sm border-0 shadow-none" placeholder="Cari style..." autofocus>
                      </div>
                    </div>
                    <div class="options-container custom-scrollbar p-2">
                      <div v-if="filteredStyleOptions.length === 0" class="text-center py-3 text-slate-400 small">Tidak ada style ditemukan</div>
                      <label v-for="opt in filteredStyleOptions" :key="opt" class="dropdown-option">
                        <input type="checkbox" class="form-check-input mt-0" :checked="selectedFilters.style.includes(opt)" @change="toggleFilter('style', opt)">
                        <span class="text-truncate">{{ opt }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Filter Warna (Multi Checkbox + Search) -->
                <div class="col-12 col-md-6 col-xl-3 position-relative" ref="dropdownColorRef">
                  <label class="form-label text-slate-600 fw-semibold small mb-2">Filter Warna</label>
                  <div 
                    class="form-control modern-select d-flex justify-content-between align-items-center cursor-pointer"
                    @click="toggleDropdown('color')"
                    :class="{'border-primary shadow-sm-primary': dropdowns.color}"
                  >
                    <span class="text-truncate text-slate-700" :class="{'text-slate-400': selectedFilters.color.length === 0}">
                      {{ selectedFilters.color.length > 0 ? `${selectedFilters.color.length} Warna dipilih` : 'Semua Warna' }}
                    </span>
                    <i class="bi bi-chevron-down text-slate-400 transition-transform" :class="{'rotate-180': dropdowns.color}"></i>
                  </div>
                  
                  <!-- Dropdown Panel Warna -->
                  <div v-if="dropdowns.color" class="modern-dropdown-panel shadow-lg">
                    <div class="p-2 border-bottom">
                      <div class="search-input-wrapper">
                        <i class="bi bi-search text-slate-400"></i>
                        <input type="text" v-model="searchQueries.color" class="form-control form-control-sm border-0 shadow-none" placeholder="Cari warna..." autofocus>
                      </div>
                    </div>
                    <div class="options-container custom-scrollbar p-2">
                      <div v-if="filteredColorOptions.length === 0" class="text-center py-3 text-slate-400 small">Tidak ada warna ditemukan</div>
                      <label v-for="opt in filteredColorOptions" :key="opt" class="dropdown-option">
                        <input type="checkbox" class="form-check-input mt-0" :checked="selectedFilters.color.includes(opt)" @change="toggleFilter('color', opt)">
                        <span class="text-truncate">{{ opt }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="col-12 col-md-6 col-xl-3 d-flex gap-2 justify-content-xl-end mt-3 mt-xl-0">
                  <button class="btn btn-primary d-flex align-items-center justify-content-center gap-2 flex-grow-1 flex-xl-grow-0 px-4 btn-modern" @click="loadItems">
                    <i class="bi bi-funnel-fill"></i> Terapkan
                  </button>
                  <button class="btn btn-light border text-slate-600 d-flex align-items-center justify-content-center px-3 btn-modern" @click="resetFilters" title="Reset Semua Filter">
                    <i class="bi bi-arrow-counterclockwise"></i>
                  </button>
                </div>
              </div>

              <!-- ACTIVE FILTER CHIPS -->
              <div v-if="activeChips.length > 0" class="mt-4 pt-3 border-top d-flex flex-wrap align-items-center gap-2">
                <span class="text-slate-500 small fw-medium me-1">Filter Aktif:</span>
                <div v-for="(chip, index) in activeChips" :key="index" class="filter-chip">
                  <span class="opacity-75 me-1">{{ chip.label }}:</span>
                  <span class="fw-semibold">{{ chip.value }}</span>
                  <button class="btn-close-chip ms-2" @click="toggleFilter(chip.type, chip.value)">
                    <i class="bi bi-x-circle-fill"></i>
                  </button>
                </div>
                <button class="btn btn-link btn-sm text-danger text-decoration-none p-0 ms-2 fw-medium" @click="clearAllCheckboxFilters">
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <!-- STATE LOADING & KOSONG -->
          <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5 my-5">
            <div class="spinner-border text-primary mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
            <h6 class="text-slate-500 fw-medium">Menyinkronkan data...</h6>
          </div>
          <div v-else-if="items.length === 0" class="d-flex flex-column align-items-center justify-content-center py-5 my-5 bg-white rounded-4 shadow-sm border border-slate-100">
            <i class="bi bi-inbox text-slate-300 mb-3" style="font-size: 3.5rem;"></i>
            <h5 class="text-slate-700 fw-semibold mb-1">Data Kosong</h5>
            <p class="text-slate-500">Tidak ada data retur untuk tanggal yang dipilih.</p>
          </div>
          <div v-else-if="groupedByStyle.length === 0" class="d-flex flex-column align-items-center justify-content-center py-5 my-5 bg-white rounded-4 shadow-sm border border-slate-100">
            <i class="bi bi-search text-slate-300 mb-3" style="font-size: 3.5rem;"></i>
            <h5 class="text-slate-700 fw-semibold mb-1">Pencarian Tidak Ditemukan</h5>
            <p class="text-slate-500">Sesuaikan kembali filter Style atau Warna Anda.</p>
          </div>

          <!-- LOOPING TABEL PER STYLE -->
          <div v-else class="data-container w-100">
            <div class="mb-3 d-flex align-items-center justify-content-between">
              <span class="text-slate-600 fw-medium">
                Menampilkan <strong class="text-primary">{{ groupedByStyle.length }}</strong> Style
              </span>
            </div>

            <!-- CARD UNTUK MASING-MASING STYLE -->
            <div v-for="(group, index) in groupedByStyle" :key="group.styleName" class="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden table-card w-100">
              <!-- Card Header -->
              <div class="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="icon-box bg-primary-soft text-primary rounded-3 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                    <i class="bi bi-tag-fill"></i>
                  </div>
                  <h5 class="mb-0 fw-bold text-slate-800 tracking-tight">{{ group.styleName }}</h5>
                </div>
                <span class="badge bg-slate-100 text-slate-600 rounded-pill px-3 py-2 fw-medium border border-slate-200">
                  {{ Object.keys(group.colors).length }} Warna
                </span>
              </div>
              
              <!-- Card Body (Table) -->
              <div class="card-body p-0">
                <div class="table-responsive custom-scrollbar">
                  <table class="table table-hover align-middle w-100 m-0 modern-table">
                    <thead>
                      <!-- HEADER BARIS 1 -->
                      <tr class="header-main-row bg-slate-50">
                        <th rowspan="2" class="text-center sticky-col sticky-col-left border-end" style="width: 60px;">No</th>
                        <th rowspan="2" class="fw-semibold text-slate-700 sticky-col sticky-col-left border-end" style="min-width: 180px;">WARNA</th>

                        <!-- SIZES DYNAMIC -->
                        <th 
                          v-for="size in group.availableSizes" 
                          :key="'h1-' + size" 
                          colspan="4" 
                          class="text-center border-bottom border-end"
                        >
                          <span class="badge bg-slate-200 text-slate-700 fw-bold px-3 py-1 rounded-pill">SIZE: {{ size }}</span>
                        </th>
                      </tr>

                      <!-- HEADER BARIS 2: METRICS -->
                      <tr class="header-sub-row bg-slate-50">
                        <template v-for="size in group.availableSizes" :key="'h2-' + size">
                          <th class="sub-header text-center text-rose-600 bg-rose-50 border-bottom" title="Tolakan per Hari ini">Tlk/Hr</th>
                          <th class="sub-header text-center text-rose-700 bg-rose-100 border-bottom fw-bold" title="Total Tolakan">Tot Tlk</th>
                          <th class="sub-header text-center text-emerald-600 bg-emerald-50 border-bottom" title="Perbaikan per Hari ini">Prb/Hr</th>
                          <th class="sub-header text-center text-emerald-700 bg-emerald-100 border-bottom border-end fw-bold" title="Total Perbaikan">Tot Prb</th>
                        </template>
                      </tr>
                    </thead>

                    <tbody>
                      <!-- LOOPING DATA WARNA -->
                      <tr v-for="(colorData, colorIndex) in Object.values(group.colors)" :key="colorData.colorName">
                        <td class="text-center text-slate-500 bg-white sticky-col sticky-col-left border-end fw-medium">{{ colorIndex + 1 }}</td>
                        <td class="fw-semibold text-slate-800 bg-white sticky-col sticky-col-left border-end">{{ colorData.colorName }}</td>

                        <!-- METRICS SIZE VALUES -->
                        <template v-for="size in group.availableSizes" :key="'data-' + size">
                          <td class="text-center text-slate-600 bg-white border-bottom">
                            {{ formatNumber(colorData.sizes[size]?.total_tolakanrajutperhari) }}
                          </td>
                          <td class="text-center fw-bold text-rose-600 bg-rose-50-light border-bottom">
                            {{ formatNumber(colorData.sizes[size]?.total_tolakanrajut) }}
                          </td>
                          <td class="text-center text-slate-600 bg-white border-bottom">
                            {{ formatNumber(colorData.sizes[size]?.total_hasilperbaikanperhari) }}
                          </td>
                          <td class="text-center fw-bold text-emerald-600 bg-emerald-50-light border-bottom border-end">
                            {{ formatNumber(colorData.sizes[size]?.total_hasilperbaikan) }}
                          </td>
                        </template>
                      </tr>
                    </tbody>
                    
                    <!-- FOOTER (GRAND TOTALS) -->
                    <tfoot>
                      <tr class="footer-total-row bg-slate-100">
                        <td colspan="2" class="text-end pe-3 text-slate-800 fw-bold tracking-tight sticky-col sticky-col-left border-end bg-slate-100">
                          TOTAL {{ group.styleName }}
                        </td>
                        <template v-for="size in group.availableSizes" :key="'total-' + size">
                          <td class="text-center text-slate-800 fw-semibold border-bottom">
                            {{ formatNumber(group.totals[size]?.tolakanHari) }}
                          </td>
                          <td class="text-center text-rose-700 fw-bold bg-rose-100 border-bottom">
                            {{ formatNumber(group.totals[size]?.tolakanTotal) }}
                          </td>
                          <td class="text-center text-slate-800 fw-semibold border-bottom">
                            {{ formatNumber(group.totals[size]?.perbaikanHari) }}
                          </td>
                          <td class="text-center text-emerald-700 fw-bold bg-emerald-100 border-bottom border-end">
                            {{ formatNumber(group.totals[size]?.perbaikanTotal) }}
                          </td>
                        </template>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <!-- AKHIR LOOPING TABEL PER STYLE -->

          </div>
        </div>
      </main>
    </div>

    <!-- FOOTER -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx-js-style";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

// Refs for click-outside directive
const dropdownStyleRef = ref(null);
const dropdownColorRef = ref(null);

// Filters State
const filters = ref({
  filterDate: new Date().toISOString().split("T")[0]
});

const selectedFilters = reactive({
  style: [],
  color: []
});

const searchQueries = reactive({
  style: "",
  color: ""
});

const dropdowns = reactive({
  style: false,
  color: false
});

// Utilities
const formatNumber = (val) => {
  if (val === null || val === undefined || val === 0) return "-";
  return Number(val).toLocaleString("id-ID");
};

// ============================
// LOGIKA OPTIONS MULTI-SELECT
// ============================
const uniqueStyles = computed(() => {
  const styles = items.value.map(i => i.xIdp || "-");
  return [...new Set(styles)].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
});

const uniqueColors = computed(() => {
  const colors = items.value.map(i => i.xMColor || "-");
  return [...new Set(colors)].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
});

const filteredStyleOptions = computed(() => {
  const q = searchQueries.style.toLowerCase();
  return q ? uniqueStyles.value.filter(s => s.toLowerCase().includes(q)) : uniqueStyles.value;
});

const filteredColorOptions = computed(() => {
  const q = searchQueries.color.toLowerCase();
  return q ? uniqueColors.value.filter(c => c.toLowerCase().includes(q)) : uniqueColors.value;
});

// Filter Actions
function toggleDropdown(type) {
  const isCurrentlyOpen = dropdowns[type];
  dropdowns.style = false;
  dropdowns.color = false;
  if (!isCurrentlyOpen) dropdowns[type] = true;
}

function toggleFilter(type, value) {
  const array = selectedFilters[type];
  const index = array.indexOf(value);
  if (index === -1) array.push(value);
  else array.splice(index, 1);
}

function clearAllCheckboxFilters() {
  selectedFilters.style = [];
  selectedFilters.color = [];
}

function resetFilters() {
  filters.value.filterDate = new Date().toISOString().split("T")[0];
  clearAllCheckboxFilters();
  searchQueries.style = "";
  searchQueries.color = "";
  loadItems();
}

const activeChips = computed(() => {
  const chips = [];
  selectedFilters.style.forEach(val => chips.push({ type: 'style', label: 'Style', value: val }));
  selectedFilters.color.forEach(val => chips.push({ type: 'color', label: 'Warna', value: val }));
  return chips;
});

// Click Outside Logic
function handleClickOutside(event) {
  if (dropdownStyleRef.value && !dropdownStyleRef.value.contains(event.target)) {
    dropdowns.style = false;
  }
  if (dropdownColorRef.value && !dropdownColorRef.value.contains(event.target)) {
    dropdowns.color = false;
  }
}

// ============================
// LOGIKA GROUPING BERDASARKAN STYLE -> WARNA -> SIZES
// ============================
const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const matchStyle = selectedFilters.style.length === 0 || selectedFilters.style.includes(item.xIdp || "-");
    const matchColor = selectedFilters.color.length === 0 || selectedFilters.color.includes(item.xMColor || "-");
    return matchStyle && matchColor;
  });
});

const groupedByStyle = computed(() => {
  const groups = {};

  filteredItems.value.forEach((item) => {
    const style = item.xIdp || "-";
    const color = item.xMColor || "-";
    const size = item.xSize || "N/A";

    if (!groups[style]) {
      groups[style] = {
        styleName: style,
        colors: {},
        availableSizes: new Set(),
        totals: {} 
      };
    }

    groups[style].availableSizes.add(size);

    if (!groups[style].colors[color]) {
      groups[style].colors[color] = {
        colorName: color,
        sizes: {},
      };
    }

    groups[style].colors[color].sizes[size] = {
      total_tolakanrajutperhari: item.total_tolakanrajutperhari || 0,
      total_tolakanrajut: item.total_tolakanrajut || 0,
      total_hasilperbaikanperhari: item.total_hasilperbaikanperhari || 0,
      total_hasilperbaikan: item.total_hasilperbaikan || 0,
    };
  });

  return Object.values(groups).map(g => {
    g.availableSizes = Array.from(g.availableSizes).sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
    
    g.availableSizes.forEach(s => {
      g.totals[s] = { tolakanHari: 0, tolakanTotal: 0, perbaikanHari: 0, perbaikanTotal: 0 };
    });

    Object.values(g.colors).forEach(c => {
      g.availableSizes.forEach(s => {
        if (c.sizes[s]) {
          g.totals[s].tolakanHari += Number(c.sizes[s].total_tolakanrajutperhari) || 0;
          g.totals[s].tolakanTotal += Number(c.sizes[s].total_tolakanrajut) || 0;
          g.totals[s].perbaikanHari += Number(c.sizes[s].total_hasilperbaikanperhari) || 0;
          g.totals[s].perbaikanTotal += Number(c.sizes[s].total_hasilperbaikan) || 0;
        }
      });
    });

    return g;
  }).sort((a, b) => a.styleName.localeCompare(b.styleName, "id", { numeric: true }));
});

// UI Interactions
function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value; }
function logout() { localStorage.removeItem("user"); window.location.href = "/login"; }

// ============================
// API CALLS
// ============================
async function loadItems() {
  loading.value = true;
  try {
    const params = { filterDate: filters.value.filterDate };
    const res = await axios.get(`${API_BASE_URL}/returhasilperbaikandantolakan`, { params });
    items.value = Array.isArray(res.data) ? res.data : (res.data.data || []);
  } catch (err) {
    console.error("Error fetching data:", err);
    Swal.fire("Gagal", "Tidak bisa memuat data retur.", "error");
  } finally {
    loading.value = false;
  }
}

// ============================
// EXPORT EXCEL PROFESIONAL
// ============================
function exportExcelFrontend() {
  if (groupedByStyle.value.length === 0) return;

  try {
    const sheetData = [];
    const merges = [];
    let currentRow = 0; 

    sheetData.push(["LAPORAN RETUR PRODUKSI (TOLAKAN & PERBAIKAN)"]);
    sheetData.push([`Tanggal: ${filters.value.filterDate}`]);
    sheetData.push([]); 
    
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
    currentRow = 3; 

    groupedByStyle.value.forEach(group => {
      const sizes = group.availableSizes;

      sheetData.push([`STYLE: ${group.styleName}`]);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: (sizes.length * 4) + 1 } });
      const styleTitleRow = currentRow;
      currentRow++;

      const row1 = ["No", "Warna"];
      sizes.forEach((s) => { row1.push(`Size: ${s}`, "", "", ""); });
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + 1, c: 0 } }); 
      merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow + 1, c: 1 } }); 
      
      sizes.forEach((_, idx) => {
        const startCol = 2 + (idx * 4);
        merges.push({ s: { r: currentRow, c: startCol }, e: { r: currentRow, c: startCol + 3 } }); 
      });
      
      sheetData.push(row1);
      const row1Index = currentRow;
      currentRow++;

      const row2 = ["", ""];
      sizes.forEach(() => { row2.push("Tlk/Hari", "Total Tlk", "Perb/Hari", "Total Perb"); });
      sheetData.push(row2);
      const row2Index = currentRow;
      currentRow++;

      Object.values(group.colors).forEach((colorData, index) => {
        const rowArr = [index + 1, colorData.colorName];
        sizes.forEach((s) => {
          const metrics = colorData.sizes[s] || {};
          rowArr.push(
            Number(metrics.total_tolakanrajutperhari) || 0,
            Number(metrics.total_tolakanrajut) || 0,
            Number(metrics.total_hasilperbaikanperhari) || 0,
            Number(metrics.total_hasilperbaikan) || 0
          );
        });
        sheetData.push(rowArr);
        currentRow++;
      });

      const footerRow = ["", `TOTAL ${group.styleName}`];
      sizes.forEach((s) => {
         footerRow.push(
           Number(group.totals[s].tolakanHari) || 0,
           Number(group.totals[s].tolakanTotal) || 0,
           Number(group.totals[s].perbaikanHari) || 0,
           Number(group.totals[s].perbaikanTotal) || 0
         );
      });
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 1 } }); 
      sheetData.push(footerRow);
      const footerIndex = currentRow;
      currentRow++;
      sheetData.push([]);
      currentRow++;

      group._excelRef = {
        styleTitleRow, row1Index, row2Index, footerIndex, maxColIndex: (sizes.length * 4) + 1
      };
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!merges"] = merges;

    const borderStyle = {
      top: { style: "thin", color: { rgb: "CBD5E1" } },
      bottom: { style: "thin", color: { rgb: "CBD5E1" } },
      left: { style: "thin", color: { rgb: "CBD5E1" } },
      right: { style: "thin", color: { rgb: "CBD5E1" } }
    };

    const headerStyle = {
      font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "334155" } },
      fill: { fgColor: { rgb: "F1F5F9" } }, 
      alignment: { horizontal: "center", vertical: "center" },
      border: borderStyle
    };

    const subHeaderStyle = {
      font: { name: "Segoe UI", sz: 9, bold: true, color: { rgb: "475569" } },
      fill: { fgColor: { rgb: "F8FAFC" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: borderStyle
    };

    if(worksheet[XLSX.utils.encode_cell({r:0, c:0})]) worksheet[XLSX.utils.encode_cell({r:0, c:0})].s = { font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: "0F172A"} } };
    if(worksheet[XLSX.utils.encode_cell({r:1, c:0})]) worksheet[XLSX.utils.encode_cell({r:1, c:0})].s = { font: { name: "Segoe UI", sz: 10, italic: true, color: { rgb: "64748B"} } };

    groupedByStyle.value.forEach(group => {
       const ref = group._excelRef;
       worksheet[XLSX.utils.encode_cell({r: ref.styleTitleRow, c: 0})].s = {
         font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "0F172A" } },
         fill: { fgColor: { rgb: "E2E8F0" } },
         alignment: { horizontal: "left", vertical: "center" }
       };

       for (let R = ref.row1Index; R <= ref.footerIndex; ++R) {
         for (let C = 0; C <= ref.maxColIndex; ++C) {
           const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
           if (!worksheet[cellAddress] && R !== ref.footerIndex) { worksheet[cellAddress] = { t: 's', v: '' }; }
           if (!worksheet[cellAddress]) continue;

           if (R === ref.row1Index) worksheet[cellAddress].s = headerStyle;
           else if (R === ref.row2Index) worksheet[cellAddress].s = subHeaderStyle;
           else {
             const isTotalRow = R === ref.footerIndex;
             const isNumColumn = C >= 2;
             const isTotalTolakan = C % 4 === 3 && C > 1; 
             const isTotalPerbaikan = C % 4 === 1 && C > 2; 

             let bgColor = "FFFFFF";
             if (isTotalRow) bgColor = "F1F5F9"; 
             else if (isTotalTolakan) bgColor = "FFF1F2"; 
             else if (isTotalPerbaikan) bgColor = "ECFDF5"; 

             worksheet[cellAddress].s = {
               font: { 
                 name: "Segoe UI", sz: 10, 
                 bold: isTotalRow || isTotalTolakan || isTotalPerbaikan,
                 color: { rgb: isTotalTolakan ? "BE123C" : (isTotalPerbaikan ? "047857" : "334155") }
               },
               alignment: { horizontal: C <= 1 ? (isTotalRow ? "right" : "left") : "center", vertical: "center" },
               border: borderStyle,
               fill: { fgColor: { rgb: bgColor } }
             };

             if(isNumColumn && typeof worksheet[cellAddress].v === 'number'){
                worksheet[cellAddress].z = '#,##0_ ;[Red]-#,##0_ ;"-"_ ;@_ ';
             }
           }
         }
       }
    });

    let maxSizesLength = Math.max(...groupedByStyle.value.map(g => g.availableSizes.length));
    const colWidths = [{ wch: 6 }, { wch: 20 }];
    for(let i=0; i<maxSizesLength; i++) colWidths.push({ wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 9 });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lap_Retur");
    XLSX.writeFile(workbook, `Laporan_Retur_PerStyle_${filters.value.filterDate}.xlsx`);
  } catch (error) {
    Swal.fire("Gagal", "Terjadi kesalahan saat mengunduh Excel.", "error");
  }
}

// LIFECYCLE HOOKS
onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  loadItems();

  window.addEventListener("resize", () => { windowWidth.value = window.innerWidth; });
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => { document.removeEventListener("click", handleClickOutside); });
</script>

<style scoped>
/* =======================================
   KUNCI ANTI MELAR (MENCEGAH SCROLL GLOBAL)
======================================= */
.main-wrapper {
  min-width: 0 !important; /* Mencegah layar tertarik oleh lebar tabel */
  max-width: 100%;
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* =======================================
   MODERN UI STYLES (Tailwind-inspired)
======================================= */
.font-sans { font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.bg-light-soft { background-color: #f8fafc; }
.text-slate-300 { color: #cbd5e1; }
.text-slate-400 { color: #94a3b8; }
.text-slate-500 { color: #64748b; }
.text-slate-600 { color: #475569; }
.text-slate-700 { color: #334155; }
.text-slate-800 { color: #1e293b; }
.bg-slate-50 { background-color: #f8fafc; }
.bg-slate-100 { background-color: #f1f5f9; }
.bg-slate-200 { background-color: #e2e8f0; }
.border-slate-100 { border-color: #f1f5f9 !important; }
.border-slate-200 { border-color: #e2e8f0 !important; }

/* Colors: Emerald (Green) & Rose (Red) for Metrics */
.text-emerald-600 { color: #059669; }
.text-emerald-700 { color: #047857; }
.bg-emerald-50 { background-color: #ecfdf5; }
.bg-emerald-50-light { background-color: #f6fdf9; }
.bg-emerald-100 { background-color: #d1fae5; }

.text-rose-600 { color: #e11d48; }
.text-rose-700 { color: #be123c; }
.bg-rose-50 { background-color: #fff1f2; }
.bg-rose-50-light { background-color: #fff9fa; }
.bg-rose-100 { background-color: #ffe4e6; }

.bg-primary-soft { background-color: #eff6ff; color: #2563eb; }
.shadow-sm-primary { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
.tracking-tight { letter-spacing: -0.025em; }
.cursor-pointer { cursor: pointer; }
.transition-transform { transition: transform 0.2s ease-in-out; }
.rotate-180 { transform: rotate(180deg); }
.opacity-75 { opacity: 0.75; }

/* Filter Inputs & Dropdowns */
.modern-input-group .input-group-text, .modern-input-group .form-control {
  border-color: #cbd5e1;
  border-radius: 0.5rem;
  padding: 0.55rem 0.75rem;
}
.modern-input-group .form-control:focus {
  box-shadow: none;
  border-color: #cbd5e1;
}

.modern-select {
  background-color: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  transition: all 0.2s;
  height: 40px;
}
.modern-select:hover { border-color: #94a3b8; }

.modern-dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  z-index: 1050;
  overflow: hidden;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  border-radius: 0.5rem;
  padding: 0.4rem 0.75rem;
}
.search-input-wrapper input {
  background: transparent;
  font-size: 0.85rem;
  color: #334155;
}
.search-input-wrapper input:focus { outline: none; box-shadow: none; }

.options-container {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s;
  margin: 0;
}
.dropdown-option:hover { background: #f8fafc; color: #0f172a; }
.dropdown-option input[type="checkbox"] { cursor: pointer; }

/* Filter Chips */
.filter-chip {
  display: inline-flex;
  align-items: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}
.btn-close-chip {
  background: transparent;
  border: none;
  color: #60a5fa;
  padding: 0;
  font-size: 0.9rem;
  display: flex;
  transition: color 0.2s;
}
.btn-close-chip:hover { color: #2563eb; }

/* Button modern */
.btn-modern {
  border-radius: 0.5rem;
  font-weight: 500;
  padding: 0.55rem 1rem;
  transition: all 0.2s;
}

/* Tables */
.table-card { border: 1px solid #e2e8f0; }
.modern-table { border-collapse: separate; border-spacing: 0; }
.modern-table th, .modern-table td {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  border-color: #e2e8f0;
  vertical-align: middle;
}
.header-main-row th { border-bottom-width: 1px; }
.header-sub-row th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.6rem 0.5rem; }

/* Sticky Left Columns for horizontal scroll */
.sticky-col { position: sticky; z-index: 2; }
.sticky-col-left { left: 0; }
.modern-table thead .sticky-col { z-index: 3; }

/* Hover effects */
.modern-table tbody tr:hover td { background-color: #f8fafc; }
.modern-table tbody tr:hover td.bg-rose-50-light { background-color: #fff1f2; }
.modern-table tbody tr:hover td.bg-emerald-50-light { background-color: #ecfdf5; }

/* Scrollbar Kustom */
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>