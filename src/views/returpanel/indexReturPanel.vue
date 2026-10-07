<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft font-sans overflow-x-hidden">
    <!-- HEADER -->
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <!-- SIDEBAR -->
      <Sidebar :isOpen="sidebarOpen" />

      <!-- MAIN CONTENT -->
      <main
        class="flex-grow-1 p-3 p-md-4 p-lg-5 transition-all main-wrapper"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 992 ? '16rem' : '0',
          marginTop: '56px',
        }"
      >

      <!-- BUNGKUS DENGAN v-if="hasAccess" UNTUK UAC -->
      <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">
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
            <div class="d-flex align-items-center gap-2">
              <a href="/formhasilperbaikandantolakan" class="btn btn-primary">
                <i class="bi bi-pencil-square"></i>  Input Tolakan/retur tanpa barcode
              </a>

              <button 
                 class="btn btn-success d-flex align-items-center gap-2 px-4 shadow-sm fw-semibold btn-modern"
                 @click="exportExcelFrontend"
                 :disabled="groupedByStyle.length === 0"
              >
                <i class="bi bi-file-earmark-excel-fill"></i>
                 Export Excel
              </button>
            </div>
          </div>

          <!-- GLOBAL FILTER PANEL -->
          <div class="card border-0 shadow-sm rounded-4 mb-4 filter-card w-100">
            <div class="card-body p-4">
              <div class="row g-3 align-items-end">
                
                <!-- Filter Tanggal -->
                <div class="col-12 col-md-6 col-xl-2">
                  <label class="form-label text-slate-600 fw-semibold small mb-2">Akumulasi s/d Tanggal</label>
                  <div class="input-group modern-input-group">
                    <span class="input-group-text bg-white text-slate-400 border-end-0"><i class="bi bi-calendar3"></i></span>
                    <input type="date" v-model="filters.filterDate" class="form-control border-start-0 ps-0 text-slate-700" />
                  </div>
                </div>

                <!-- Filter Style -->
                <div class="col-12 col-md-6 col-xl-2 position-relative" ref="dropdownStyleRef">
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

                <!-- Filter Warna -->
                <div class="col-12 col-md-6 col-xl-2 position-relative" ref="dropdownColorRef">
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

                <!-- Filter Data -->
                <div class="col-12 col-md-6 col-xl-2 position-relative" ref="dropdownDataRef">
                  <label class="form-label text-slate-600 fw-semibold small mb-2">Filter Data</label>
                  <div 
                    class="form-control modern-select d-flex justify-content-between align-items-center cursor-pointer"
                    @click="toggleDropdown('dataToday')"
                    :class="{'border-primary shadow-sm-primary': dropdowns.dataToday}"
                  >
                    <span class="text-truncate text-slate-700" :class="{'text-slate-400': selectedFilters.dataToday.length === 0}">
                      {{ selectedFilters.dataToday.length > 0 ? `${selectedFilters.dataToday.length} dipilih` : 'All' }}
                    </span>
                    <i class="bi bi-chevron-down text-slate-400 transition-transform" :class="{'rotate-180': dropdowns.dataToday}"></i>
                  </div>

                  <div v-if="dropdowns.dataToday" class="modern-dropdown-panel shadow-lg">
                    <div class="options-container custom-scrollbar p-2">
                      <label v-for="opt in dataTodayOptions" :key="opt" class="dropdown-option">
                        <input type="checkbox" class="form-check-input mt-0" :checked="selectedFilters.dataToday.includes(opt)" @change="toggleFilter('dataToday', opt)">
                        <span class="text-truncate">{{ opt }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="col-12 col-md-12 col-xl-4 d-flex gap-2 justify-content-xl-end mt-3 mt-xl-0">
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

          <!-- GRAND TOTAL KESELURUHAN (5 KARTU METRIK) -->
          <div v-if="!loading && groupedByStyle.length > 0" class="row g-3 mb-4">
            <!-- Tolakan Hari Ini -->
            <div class="col-12 col-sm-6 col-xl">
              <div class="card border-0 shadow-sm rounded-4 h-100 border-start border-4" style="border-color: #f43f5e !important;">
                <div class="card-body p-3 p-xl-4 d-flex align-items-center justify-content-between">
                  <div>
                    <p class="text-slate-500 small fw-semibold mb-1">Tolakan (Hari Ini)</p>
                    <h4 class="fw-bold text-rose-600 mb-0">{{ formatNumber(grandTotal.tolakanHari) }}</h4>
                  </div>
                  <div class="icon-box bg-rose-50 text-rose-500 rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi bi-x-circle-fill fs-5"></i>
                  </div>
                </div>
              </div>
            </div>
            <!-- Total Tolakan Keseluruhan -->
            <div class="col-12 col-sm-6 col-xl">
              <div class="card border-0 shadow-sm rounded-4 h-100 border-start border-4" style="border-color: #be123c !important;">
                <div class="card-body p-3 p-xl-4 d-flex align-items-center justify-content-between">
                  <div>
                    <p class="text-slate-500 small fw-semibold mb-1">Total Tolakan (All)</p>
                    <h4 class="fw-bold text-rose-700 mb-0">{{ formatNumber(grandTotal.tolakan) }}</h4>
                  </div>
                  <div class="icon-box bg-rose-100 text-rose-700 rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi bi-x-circle fs-5"></i>
                  </div>
                </div>
              </div>
            </div>
            <!-- Perbaikan Hari Ini -->
            <div class="col-12 col-sm-6 col-xl">
              <div class="card border-0 shadow-sm rounded-4 h-100 border-start border-4" style="border-color: #10b981 !important;">
                <div class="card-body p-3 p-xl-4 d-flex align-items-center justify-content-between">
                  <div>
                    <p class="text-slate-500 small fw-semibold mb-1">Perbaikan (Hari Ini)</p>
                    <h4 class="fw-bold text-emerald-600 mb-0">{{ formatNumber(grandTotal.perbaikanHari) }}</h4>
                  </div>
                  <div class="icon-box bg-emerald-50 text-emerald-500 rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi bi-check-circle-fill fs-5"></i>
                  </div>
                </div>
              </div>
            </div>
            <!-- Total Perbaikan Keseluruhan -->
            <div class="col-12 col-sm-6 col-xl">
              <div class="card border-0 shadow-sm rounded-4 h-100 border-start border-4" style="border-color: #047857 !important;">
                <div class="card-body p-3 p-xl-4 d-flex align-items-center justify-content-between">
                  <div>
                    <p class="text-slate-500 small fw-semibold mb-1">Total Perbaikan (All)</p>
                    <h4 class="fw-bold text-emerald-700 mb-0">{{ formatNumber(grandTotal.perbaikan) }}</h4>
                  </div>
                  <div class="icon-box bg-emerald-100 text-emerald-700 rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi bi-check-circle fs-5"></i>
                  </div>
                </div>
              </div>
            </div>
            <!-- Sisa (Keseluruhan) -->
            <div class="col-12 col-sm-12 col-xl">
              <div class="card border-0 shadow-sm rounded-4 h-100 border-start border-4" style="border-color: #475569 !important;">
                <div class="card-body p-3 p-xl-4 d-flex align-items-center justify-content-between">
                  <div>
                    <p class="text-slate-500 small fw-semibold mb-1">Sisa (Tlk - Prb)</p>
                    <h4 class="fw-bold text-slate-800 mb-0">{{ formatNumber(grandTotal.sisa) }}</h4>
                  </div>
                  <div class="icon-box bg-slate-100 text-slate-600 rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi bi-dash-circle fs-5"></i>
                  </div>
                </div>
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

            <div v-for="(group, index) in groupedByStyle" :key="group.styleName" class="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden table-card w-100">
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
                          colspan="5" 
                          class="text-center border-bottom border-end"
                        >
                          <span class="badge bg-slate-200 text-slate-700 fw-bold px-3 py-1 rounded-pill">SIZE: {{ size }}</span>
                        </th>

                        <!-- HEADER BARU: TOTAL KESELURUHAN HARI INI PER WARNA (DI KANAN) -->
                        <th colspan="2" class="text-center border-bottom border-start border-end bg-indigo-50">
                          <span class="badge bg-indigo-200 text-indigo-800 fw-bold px-3 py-1 rounded-pill">TOTAL HARI INI</span>
                        </th>
                      </tr>

                      <!-- HEADER BARIS 2: METRICS -->
                      <tr class="header-sub-row bg-slate-50">
                        <template v-for="size in group.availableSizes" :key="'h2-' + size">
                          <th class="sub-header text-center text-rose-600 bg-rose-50 border-bottom" title="Tolakan per Hari ini">Tlk/Hr</th>
                          <th class="sub-header text-center text-rose-700 bg-rose-100 border-bottom fw-bold" title="Total Tolakan">Tot Tlk</th>
                          <th class="sub-header text-center text-emerald-600 bg-emerald-50 border-bottom" title="Perbaikan per Hari ini">Prb/Hr</th>
                          <th class="sub-header text-center text-emerald-700 bg-emerald-100 border-bottom fw-bold" title="Total Perbaikan">Tot Prb</th>
                          <th class="sub-header text-center text-slate-700 bg-slate-200 border-bottom border-end fw-bold" title="Sisa (Tot Tlk - Tot Prb)">Sisa</th>
                        </template>

                        <!-- SUB HEADER BARU KANAN -->
                        <th class="sub-header text-center text-rose-700 bg-rose-50 border-bottom border-start fw-bold" title="Total Seluruh Tolakan Hari Ini per Warna">Tot Tlk/Hr</th>
                        <th class="sub-header text-center text-emerald-700 bg-emerald-50 border-bottom border-end fw-bold" title="Total Seluruh Perbaikan Hari Ini per Warna">Tot Prb/Hr</th>
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
                          <td class="text-center fw-bold text-emerald-600 bg-emerald-50-light border-bottom">
                            {{ formatNumber(colorData.sizes[size]?.total_hasilperbaikan) }}
                          </td>
                          <td class="text-center fw-bold text-slate-700 bg-slate-50 border-bottom border-end">
                            {{ formatNumber((Number(colorData.sizes[size]?.total_tolakanrajut) || 0) - (Number(colorData.sizes[size]?.total_hasilperbaikan) || 0)) }}
                          </td>
                        </template>

                        <!-- NILAI TOTAL BARU KANAN (PER WARNA) -->
                        <td class="text-center fw-bold text-rose-600 bg-rose-50 border-bottom border-start">
                          {{ formatNumber(colorData.rowTotal.tolakanHari) }}
                        </td>
                        <td class="text-center fw-bold text-emerald-600 bg-emerald-50 border-bottom border-end">
                          {{ formatNumber(colorData.rowTotal.perbaikanHari) }}
                        </td>
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
                          <td class="text-center text-emerald-700 fw-bold bg-emerald-100 border-bottom">
                            {{ formatNumber(group.totals[size]?.perbaikanTotal) }}
                          </td>
                          <td class="text-center text-slate-800 fw-bold bg-slate-200 border-bottom border-end">
                            {{ formatNumber((group.totals[size]?.tolakanTotal || 0) - (group.totals[size]?.perbaikanTotal || 0)) }}
                          </td>
                        </template>

                        <!-- NILAI TOTAL BARU KANAN FOOTER -->
                        <td class="text-center text-rose-700 fw-bold bg-rose-100 border-bottom border-start">
                          {{ formatNumber(group.grandTotalStyle.tolakanHari) }}
                        </td>
                        <td class="text-center text-emerald-700 fw-bold bg-emerald-100 border-bottom border-end">
                          {{ formatNumber(group.grandTotalStyle.perbaikanHari) }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
        </div>

        <!-- OPSI TAMPILAN BLANK (JIKA TIDAK ADA AKSES) -->
        <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 pt-5 mt-5">
           <!-- Halaman Blank, Jika ingin dibuat benar-benar kosong hapus komentar html ini. -->
            <h1>hi anda tersesat nih, Mohon untuk Logout Segera </h1>
            <a href="/logout" class="btn btn-primary">back to jungle</a>
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

const hasAccess = ref(false);

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const dropdownStyleRef = ref(null);
const dropdownColorRef = ref(null);
const dropdownDataRef = ref(null);

const filters = ref({
  filterDate: new Date().toISOString().split("T")[0]
});

const selectedFilters = reactive({
  style: [],
  color: [],
  dataToday: []
});

const searchQueries = reactive({
  style: "",
  color: ""
});

const dropdowns = reactive({
  style: false,
  color: false,
  dataToday: false
});

const dataTodayOptions = ["All", "Hari Ini Ada Datanya"];

const formatNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return Number(val).toLocaleString("id-ID");
};

// MULTI-SELECT LOGIC
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

function toggleDropdown(type) {
  const isCurrentlyOpen = dropdowns[type];
  dropdowns.style = false;
  dropdowns.color = false;
  dropdowns.dataToday = false;
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
  selectedFilters.dataToday = [];
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
  selectedFilters.dataToday.forEach(val => chips.push({ type: 'dataToday', label: 'Data', value: val }));
  return chips;
});

function handleClickOutside(event) {
  if (dropdownStyleRef.value && !dropdownStyleRef.value.contains(event.target)) dropdowns.style = false;
  if (dropdownColorRef.value && !dropdownColorRef.value.contains(event.target)) dropdowns.color = false;
  if (dropdownDataRef.value && !dropdownDataRef.value.contains(event.target)) dropdowns.dataToday = false;
}

// FILTER & GROUPING LOGIC
const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const matchStyle = selectedFilters.style.length === 0 || selectedFilters.style.includes(item.xIdp || "-");
    const matchColor = selectedFilters.color.length === 0 || selectedFilters.color.includes(item.xMColor || "-");
    let matchDataToday = true;
    if (selectedFilters.dataToday.length > 0 && !selectedFilters.dataToday.includes("All")) {
      const hasDataToday = (Number(item.total_tolakanrajutperhari) || 0) > 0 || (Number(item.total_hasilperbaikanperhari) || 0) > 0;
      matchDataToday = selectedFilters.dataToday.includes("Hari Ini Ada Datanya") ? hasDataToday : true;
    }
    return matchStyle && matchColor && matchDataToday;
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
        totals: {},
        grandTotalStyle: { tolakanHari: 0, perbaikanHari: 0 } // Menampung total samping per style
      };
    }

    groups[style].availableSizes.add(size);

    if (!groups[style].colors[color]) {
      groups[style].colors[color] = {
        colorName: color,
        sizes: {},
        rowTotal: { tolakanHari: 0, perbaikanHari: 0 } // Menampung total samping per warna
      };
    }

    const tlkHr = Number(item.total_tolakanrajutperhari) || 0;
    const prbHr = Number(item.total_hasilperbaikanperhari) || 0;

    groups[style].colors[color].sizes[size] = {
      total_tolakanrajutperhari: tlkHr,
      total_tolakanrajut: item.total_tolakanrajut || 0,
      total_hasilperbaikanperhari: prbHr,
      total_hasilperbaikan: item.total_hasilperbaikan || 0,
    };

    // Kalkulasi Total Kanan 
    groups[style].colors[color].rowTotal.tolakanHari += tlkHr;
    groups[style].colors[color].rowTotal.perbaikanHari += prbHr;
    groups[style].grandTotalStyle.tolakanHari += tlkHr;
    groups[style].grandTotalStyle.perbaikanHari += prbHr;
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

// KESELURUHAN METRICS (5 Parameter)
const grandTotal = computed(() => {
  let tolakan = 0; let perbaikan = 0;
  let tolakanHari = 0; let perbaikanHari = 0;
  filteredItems.value.forEach((item) => {
    tolakan += Number(item.total_tolakanrajut) || 0;
    perbaikan += Number(item.total_hasilperbaikan) || 0;
    tolakanHari += Number(item.total_tolakanrajutperhari) || 0;
    perbaikanHari += Number(item.total_hasilperbaikanperhari) || 0;
  });
  return { tolakan, perbaikan, sisa: tolakan - perbaikan, tolakanHari, perbaikanHari };
});

function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value; }
function logout() { localStorage.removeItem("user"); window.location.href = "/login"; }

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

// EXPORT EXCEL PROFESIONAL
function exportExcelFrontend() {
  if (groupedByStyle.value.length === 0) return;

  try {
    const sheetData = [];
    const merges = [];
    let currentRow = 0; 

    // Header Laporan
    sheetData.push(["LAPORAN RETUR PRODUKSI (TOLAKAN & PERBAIKAN)"]);
    sheetData.push([`Tanggal: ${filters.value.filterDate}`]);
    sheetData.push([]); 
    
    // Summary Keseluruhan (2 Baris Data)
    sheetData.push(["RINGKASAN TOTAL KESELURUHAN"]);
    sheetData.push([
      "Total Tolakan / Hari", Number(grandTotal.value.tolakanHari) || 0, 
      "Total Perbaikan / Hari", Number(grandTotal.value.perbaikanHari) || 0, 
      "Sisa (Tolakan - Perbaikan)", Number(grandTotal.value.sisa) || 0
    ]);
    sheetData.push([
      "Grand Total Tolakan", Number(grandTotal.value.tolakan) || 0, 
      "Grand Total Perbaikan", Number(grandTotal.value.perbaikan) || 0, 
      "", ""
    ]);
    sheetData.push([]);
    
    // Merges Atas
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
    merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 5 } });

    currentRow = 7; 

    groupedByStyle.value.forEach(group => {
      const sizes = group.availableSizes;

      sheetData.push([`STYLE: ${group.styleName}`]);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: (sizes.length * 5) + 3 } });
      const styleTitleRow = currentRow;
      currentRow++;

      // Row 1 Table Header
      const row1 = ["No", "Warna"];
      sizes.forEach((s) => { row1.push(`Size: ${s}`, "", "", "", ""); });
      row1.push("TOTAL HARI INI", "");
      
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + 1, c: 0 } }); 
      merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow + 1, c: 1 } }); 
      
      sizes.forEach((_, idx) => {
        const startCol = 2 + (idx * 5);
        merges.push({ s: { r: currentRow, c: startCol }, e: { r: currentRow, c: startCol + 4 } }); 
      });
      // Merge "TOTAL HARI INI"
      const totalHariIniStartCol = 2 + (sizes.length * 5);
      merges.push({ s: { r: currentRow, c: totalHariIniStartCol }, e: { r: currentRow, c: totalHariIniStartCol + 1 } });

      sheetData.push(row1);
      const row1Index = currentRow;
      currentRow++;

      // Row 2 Table Header
      const row2 = ["", ""];
      sizes.forEach(() => { row2.push("Tlk/Hari", "Total Tlk", "Perb/Hari", "Total Perb", "Sisa"); });
      row2.push("Tot Tlk/Hr", "Tot Prb/Hr");
      sheetData.push(row2);
      const row2Index = currentRow;
      currentRow++;

      // Data Rows
      Object.values(group.colors).forEach((colorData, index) => {
        const rowArr = [index + 1, colorData.colorName];
        sizes.forEach((s) => {
          const metrics = colorData.sizes[s] || {};
          const totTlk = Number(metrics.total_tolakanrajut) || 0;
          const totPrb = Number(metrics.total_hasilperbaikan) || 0;
          rowArr.push(
            Number(metrics.total_tolakanrajutperhari) || 0, totTlk,
            Number(metrics.total_hasilperbaikanperhari) || 0, totPrb,
            totTlk - totPrb
          );
        });
        // Nilai total kanan (Per warna)
        rowArr.push(colorData.rowTotal.tolakanHari, colorData.rowTotal.perbaikanHari);
        sheetData.push(rowArr);
        currentRow++;
      });

      // Footer Row
      const footerRow = ["", `TOTAL ${group.styleName}`];
      sizes.forEach((s) => {
         const tolakanTotal = Number(group.totals[s].tolakanTotal) || 0;
         const perbaikanTotal = Number(group.totals[s].perbaikanTotal) || 0;
         footerRow.push(
           Number(group.totals[s].tolakanHari) || 0, tolakanTotal,
           Number(group.totals[s].perbaikanHari) || 0, perbaikanTotal,
           tolakanTotal - perbaikanTotal
         );
      });
      // Nilai total kanan footer (Per Style)
      footerRow.push(group.grandTotalStyle.tolakanHari, group.grandTotalStyle.perbaikanHari);

      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 1 } }); 
      sheetData.push(footerRow);
      const footerIndex = currentRow;
      currentRow++;
      sheetData.push([]);
      currentRow++;

      group._excelRef = {
        styleTitleRow, row1Index, row2Index, footerIndex, maxColIndex: (sizes.length * 5) + 3
      };
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!merges"] = merges;

    const borderStyle = {
      top: { style: "thin", color: { rgb: "CBD5E1" } }, bottom: { style: "thin", color: { rgb: "CBD5E1" } },
      left: { style: "thin", color: { rgb: "CBD5E1" } }, right: { style: "thin", color: { rgb: "CBD5E1" } }
    };

    if(worksheet[XLSX.utils.encode_cell({r:0, c:0})]) worksheet[XLSX.utils.encode_cell({r:0, c:0})].s = { font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: "0F172A"} } };
    if(worksheet[XLSX.utils.encode_cell({r:1, c:0})]) worksheet[XLSX.utils.encode_cell({r:1, c:0})].s = { font: { name: "Segoe UI", sz: 10, italic: true, color: { rgb: "64748B"} } };

    // Format Stylish Section Ringkasan Total
    for(let r=3; r<=5; r++){
       for(let c=0; c<=5; c++){
          const addr = XLSX.utils.encode_cell({r, c});
          if(!worksheet[addr]) continue;
          let fontColor = "334155";
          let bold = true;
          
          if (r === 4 || r === 5) {
             if (c === 1) fontColor = "BE123C"; // Merah untuk Tolakan
             if (c === 3) fontColor = "047857"; // Hijau untuk Perbaikan
             if (c === 5) fontColor = "0F172A"; // Gelap untuk Sisa
          }
          
          worksheet[addr].s = {
            font: { name: "Segoe UI", sz: c % 2 === 0 ? 10 : 11, bold, color: { rgb: fontColor } },
            fill: { fgColor: { rgb: r === 3 ? "E2E8F0" : "F8FAFC" } },
            alignment: { horizontal: c % 2 === 0 ? "left" : "right", vertical: "center" },
            border: borderStyle
          };
          if(typeof worksheet[addr].v === 'number') {
             worksheet[addr].z = '#,##0_ ;[Red]-#,##0_ ;"0"_ ;@_ ';
          }
       }
    }

    // Format Styling Tabel Dinamis
    groupedByStyle.value.forEach(group => {
       const ref = group._excelRef;
       const totalColsStart = 2 + (group.availableSizes.length * 5);

       worksheet[XLSX.utils.encode_cell({r: ref.styleTitleRow, c: 0})].s = {
         font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "0F172A" } },
         fill: { fgColor: { rgb: "CBD5E1" } }, alignment: { horizontal: "left", vertical: "center" }
       };

       for (let R = ref.row1Index; R <= ref.footerIndex; ++R) {
         for (let C = 0; C <= ref.maxColIndex; ++C) {
           const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
           if (!worksheet[cellAddress] && R !== ref.footerIndex) { worksheet[cellAddress] = { t: 's', v: '' }; }
           if (!worksheet[cellAddress]) continue;

           const isNewTolakanHr = C === totalColsStart;
           const isNewPerbaikanHr = C === totalColsStart + 1;

           if (R === ref.row1Index) {
             worksheet[cellAddress].s = {
               font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: (isNewTolakanHr || isNewPerbaikanHr) ? "3730A3" : "334155" } },
               fill: { fgColor: { rgb: (isNewTolakanHr || isNewPerbaikanHr) ? "E0E7FF" : "F1F5F9" } },
               alignment: { horizontal: "center", vertical: "center" }, border: borderStyle
             };
           }
           else if (R === ref.row2Index) {
             worksheet[cellAddress].s = {
               font: { name: "Segoe UI", sz: 9, bold: true, color: { rgb: "475569" } },
               fill: { fgColor: { rgb: "F8FAFC" } }, alignment: { horizontal: "center", vertical: "center" }, border: borderStyle
             };
           }
           else {
             const isTotalRow = R === ref.footerIndex;
             const isNumColumn = C >= 2;
             const relCol = C >= 2 && C < totalColsStart ? (C - 2) % 5 : -1;
             const isTotalTolakan = relCol === 1 || isNewTolakanHr;
             const isTotalPerbaikan = relCol === 3 || isNewPerbaikanHr;
             const isSisa = relCol === 4;

             let bgColor = "FFFFFF";
             if (isTotalRow) bgColor = "F1F5F9"; 
             else if (isNewTolakanHr || isNewPerbaikanHr) bgColor = "EEF2FF"; // Pewarnaan kolom baru Kanan
             else if (isTotalTolakan) bgColor = "FFF1F2"; 
             else if (isTotalPerbaikan) bgColor = "ECFDF5"; 
             else if (isSisa) bgColor = "F1F5F9";

             worksheet[cellAddress].s = {
               font: { 
                 name: "Segoe UI", sz: 10, 
                 bold: isTotalRow || isTotalTolakan || isTotalPerbaikan || isSisa,
                 color: { rgb: isTotalTolakan ? "BE123C" : (isTotalPerbaikan ? "047857" : "334155") }
               },
               alignment: { horizontal: C <= 1 ? (isTotalRow ? "right" : "left") : "center", vertical: "center" },
               border: borderStyle,
               fill: { fgColor: { rgb: bgColor } }
             };

             if(isNumColumn && typeof worksheet[cellAddress].v === 'number'){
                worksheet[cellAddress].z = '#,##0_ ;[Red]-#,##0_ ;"0"_ ;@_ ';
             }
           }
         }
       }
    });

    let maxSizesLength = Math.max(...groupedByStyle.value.map(g => g.availableSizes.length));
    const colWidths = [{ wch: 6 }, { wch: 20 }];
    for(let i=0; i<maxSizesLength; i++) colWidths.push({ wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 9 }, { wch: 8 });
    colWidths.push({ wch: 11 }, { wch: 11 }); // Lebar khusus untuk 2 kolom Kanan baru
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lap_Retur");
    XLSX.writeFile(workbook, `Laporan_Retur_PerStyle_${filters.value.filterDate}.xlsx`);
  } catch (error) {
    Swal.fire("Gagal", "Terjadi kesalahan saat mengunduh Excel.", "error");
  }
}

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);

  // LOGIKA UAC 
  try {
    const pagesData = localStorage.getItem("pages");
    const pages = pagesData ? JSON.parse(pagesData) : [];
    // Periksa apakah user memiliki akses ke rute ini 
    hasAccess.value = pages.includes("hasilperbaikandantolakan");
  } catch (e) {
    hasAccess.value = false;
  }

  // Hanya load item dari API jika user punya akses
  if (hasAccess.value) {
    loadItems();
  }

  window.addEventListener("resize", () => { windowWidth.value = window.innerWidth; });
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => { document.removeEventListener("click", handleClickOutside); });
</script>

<style scoped>
/* KUNCI ANTI MELAR (MENCEGAH SCROLL GLOBAL) */
.main-wrapper {
  min-width: 0 !important;
  max-width: 100%;
}
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* MODERN UI STYLES */
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
.text-emerald-500 { color: #10b981; }
.text-emerald-600 { color: #059669; }
.text-emerald-700 { color: #047857; }
.bg-emerald-50 { background-color: #ecfdf5; }
.bg-emerald-50-light { background-color: #f6fdf9; }
.bg-emerald-100 { background-color: #d1fae5; }

.text-rose-500 { color: #f43f5e; }
.text-rose-600 { color: #e11d48; }
.text-rose-700 { color: #be123c; }
.bg-rose-50 { background-color: #fff1f2; }
.bg-rose-50-light { background-color: #fff9fa; }
.bg-rose-100 { background-color: #ffe4e6; }

/* Warna Baru: Indigo untuk Total di Kolom Paling Kanan */
.text-indigo-800 { color: #3730a3; }
.bg-indigo-50 { background-color: #eef2ff !important; }
.bg-indigo-200 { background-color: #c7d2fe !important; }

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

/* Sticky Left Columns */
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