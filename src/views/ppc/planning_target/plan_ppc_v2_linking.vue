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
              <h2 class="h4 fw-bold text-dark mb-0">Planning PPC Target Linking</h2>
              <p class="text-muted small mb-0">Kelola dan pantau target produksi harian</p>
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

            <a href="/update_plan_linking" class="btn btn-warning">
              <i class="bi bi-pencil-square"></i> Update Qty Plan Linking
            </a>
             <!-- <a href="/update_plan_linking" class="btn btn-primary">
              <i class="bi bi-pencil-square"></i> Update Qty Plan Linking
            </a> -->
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-4 rounded-4 filter-card">
          <div class="card-body p-4">
            <div class="row align-items-end g-3">
              <div class="col-md-3">
                <label class="form-label-modern">Tgl Tampilan Mulai</label>
                <input type="date" v-model="filters.startDate" class="form-control form-control-modern" />
              </div>
              <div class="col-md-3">
                <label class="form-label-modern">Tgl Tampilan Selesai</label>
                <input type="date" v-model="filters.endDate" class="form-control form-control-modern" />
              </div>
              <div class="col-md-6 d-flex gap-2 flex-wrap">
                <button class="btn btn-reload" @click="fetchData" :disabled="dataLoading">
                  <i class="bi bi-arrow-clockwise"></i> Reload Data
                </button>
                <button class="btn btn-export" @click="exportToExcel" :disabled="!hasFetchedData">
                  <i class="bi bi-file-earmark-excel-fill"></i> Export Excel
                </button>
                <a href="/plan_ppc" class="btn btn-primary ms-auto text-wahite">Plan Finishing</a>
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
            <table class="table table-bordered align-middle mb-0 planning-table">
              <thead class="table-light sticky-header">
                <tr>
                  <th v-for="(col, key) in {style: 'Style'}" :key="key" class="th-filterable">
                    <div class="dropdown">
                      <div class="th-filter-trigger" data-bs-toggle="dropdown" role="button">
                        <span>{{ col }}</span>
                        <i class="bi bi-funnel-fill" :class="{ 'text-primary': selectedFilters[key].length }"></i>
                        <span v-if="selectedFilters[key].length" class="filter-count-badge">{{ selectedFilters[key].length }}</span>
                      </div>
                      <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 filter-dropdown-panel" style="min-width: 230px;">
                        <div class="input-group input-group-sm mb-2">
                          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                          <input type="text" v-model="searchTerms[key]" class="form-control border-start-0" placeholder="Cari...">
                        </div>
                        <div class="filter-scroll">
                          <div v-for="opt in getUniqueOptions(key, searchTerms[key])" :key="opt" class="form-check mb-1">
                            <input type="checkbox" class="form-check-input" :id="'flt-'+key+'-'+opt" :value="opt" v-model="selectedFilters[key]">
                            <label class="form-check-label small" :for="'flt-'+key+'-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                        <div v-if="selectedFilters[key].length" class="dropdown-divider"></div>
                        <button v-if="selectedFilters[key].length" class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center fw-bold" @click="selectedFilters[key] = []">
                          <i class="bi bi-arrow-counterclockwise me-1"></i>RESET
                        </button>
                      </div>
                    </div>
                  </th>
                  <th>Order Qty</th>
                  <th v-for="(col, key) in {gedung: 'Gedung'}" :key="key" class="th-filterable">
                    <div class="dropdown">
                      <div class="th-filter-trigger" data-bs-toggle="dropdown" role="button">
                        <span>{{ col }}</span>
                        <i class="bi bi-funnel-fill" :class="{ 'text-primary': selectedFilters[key].length }"></i>
                        <span v-if="selectedFilters[key].length" class="filter-count-badge">{{ selectedFilters[key].length }}</span>
                      </div>
                      <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 filter-dropdown-panel" style="min-width: 230px;">
                        <div class="input-group input-group-sm mb-2">
                          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                          <input type="text" v-model="searchTerms[key]" class="form-control border-start-0" placeholder="Cari...">
                        </div>
                        <div class="filter-scroll">
                          <div v-for="opt in getUniqueOptions(key, searchTerms[key])" :key="opt" class="form-check mb-1">
                            <input type="checkbox" class="form-check-input" :id="'flt-'+key+'-'+opt" :value="opt" v-model="selectedFilters[key]">
                            <label class="form-check-label small" :for="'flt-'+key+'-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                        <div v-if="selectedFilters[key].length" class="dropdown-divider"></div>
                        <button v-if="selectedFilters[key].length" class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center fw-bold" @click="selectedFilters[key] = []">
                          <i class="bi bi-arrow-counterclockwise me-1"></i>RESET
                        </button>
                      </div>
                    </div>
                  </th>
                  <th>Tanggal</th>
                  <th>Worker Day</th>
                  <th v-for="(col, key) in {dept: 'Dept'}" :key="key" class="th-filterable">
                    <div class="dropdown">
                      <div class="th-filter-trigger" data-bs-toggle="dropdown" role="button">
                        <span>{{ col }}</span>
                        <i class="bi bi-funnel-fill" :class="{ 'text-primary': selectedFilters[key].length }"></i>
                        <span v-if="selectedFilters[key].length" class="filter-count-badge">{{ selectedFilters[key].length }}</span>
                      </div>
                      <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 filter-dropdown-panel" style="min-width: 230px;">
                        <div class="input-group input-group-sm mb-2">
                          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                          <input type="text" v-model="searchTerms[key]" class="form-control border-start-0" placeholder="Cari...">
                        </div>
                        <div class="filter-scroll">
                          <!-- Urutan Dept mengikuti DEPT_ORDER tetap: Lo, Steam, CBS, Sewing, Sontex, Soom, QC Lampu, Sulam -->
                          <div v-for="opt in getUniqueOptions(key, searchTerms[key])" :key="opt" class="form-check mb-1">
                            <input type="checkbox" class="form-check-input" :id="'flt-'+key+'-'+opt" :value="opt" v-model="selectedFilters[key]">
                            <label class="form-check-label small" :for="'flt-'+key+'-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                        <div v-if="selectedFilters[key].length" class="dropdown-divider"></div>
                        <button v-if="selectedFilters[key].length" class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center fw-bold" @click="selectedFilters[key] = []">
                          <i class="bi bi-arrow-counterclockwise me-1"></i>RESET
                        </button>
                      </div>
                    </div>
                  </th>
                  <th v-for="(col, key) in {workname: 'Proses'}" :key="key" class="th-filterable">
                    <div class="dropdown">
                      <div class="th-filter-trigger" data-bs-toggle="dropdown" role="button">
                        <span>{{ col }}</span>
                        <i class="bi bi-funnel-fill" :class="{ 'text-primary': selectedFilters[key].length }"></i>
                        <span v-if="selectedFilters[key].length" class="filter-count-badge">{{ selectedFilters[key].length }}</span>
                      </div>
                      <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 filter-dropdown-panel" style="min-width: 230px;">
                        <div class="input-group input-group-sm mb-2">
                          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                          <input type="text" v-model="searchTerms[key]" class="form-control border-start-0" placeholder="Cari...">
                        </div>
                        <div class="filter-scroll">
                          <div v-for="opt in getUniqueOptions(key, searchTerms[key])" :key="opt" class="form-check mb-1">
                            <input type="checkbox" class="form-check-input" :id="'flt-'+key+'-'+opt" :value="opt" v-model="selectedFilters[key]">
                            <label class="form-check-label small" :for="'flt-'+key+'-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                        <div v-if="selectedFilters[key].length" class="dropdown-divider"></div>
                        <button v-if="selectedFilters[key].length" class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center fw-bold" @click="selectedFilters[key] = []">
                          <i class="bi bi-arrow-counterclockwise me-1"></i>RESET
                        </button>
                      </div>
                    </div>
                  </th>
                  <th>Plan</th>
                  <th>Target Jam</th>
                  <th>7 Jam Worker</th>
                  <th>14 Jam Worker</th>
                  <th v-for="(col, key) in {team: 'Line'}" :key="key" class="th-filterable">
                    <div class="dropdown">
                      <div class="th-filter-trigger" data-bs-toggle="dropdown" role="button">
                        <span>{{ col }}</span>
                        <i class="bi bi-funnel-fill" :class="{ 'text-primary': selectedFilters[key].length }"></i>
                        <span v-if="selectedFilters[key].length" class="filter-count-badge">{{ selectedFilters[key].length }}</span>
                      </div>
                      <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 filter-dropdown-panel" style="min-width: 230px;">
                        <div class="input-group input-group-sm mb-2">
                          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                          <input type="text" v-model="searchTerms[key]" class="form-control border-start-0" placeholder="Cari...">
                        </div>
                        <div class="filter-scroll">
                          <div v-for="opt in getUniqueOptions(key, searchTerms[key])" :key="opt" class="form-check mb-1">
                            <input type="checkbox" class="form-check-input" :id="'flt-'+key+'-'+opt" :value="opt" v-model="selectedFilters[key]">
                            <label class="form-check-label small" :for="'flt-'+key+'-'+opt">{{ opt }}</label>
                          </div>
                        </div>
                        <div v-if="selectedFilters[key].length" class="dropdown-divider"></div>
                        <button v-if="selectedFilters[key].length" class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center fw-bold" @click="selectedFilters[key] = []">
                          <i class="bi bi-arrow-counterclockwise me-1"></i>RESET
                        </button>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
  <template v-for="(order, oKey) in processedTableData" :key="oKey">
    <template v-for="(dept, dKey) in order.depts" :key="dKey">
      <tr v-for="(proses, pIndex) in dept.prosesListArray" :key="proses.name">
        
        <!-- Kolom Utama: Merge berdasarkan total baris di Style tersebut -->
        <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows" class="fw-bold text-dark">
          {{ order.style }}
        </td>
        <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows" class="text-center">
          {{ order.qty }}
        </td>
        <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows" class="text-center">
          <span class="badge-gedung">{{ order.gedung }}</span>
        </td>
        <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows" class="text-center small text-muted">
          {{ order.tanggalRange }}
        </td>
        <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows" class="text-center">
          {{ order.effectiveWorkerDays }} Day
        </td>

        <!-- Kolom Dept: Merge berdasarkan jumlah proses di Dept tersebut -->
        <td v-if="pIndex === 0" :rowspan="dept.prosesListArray.length" class="text-center">
          <span class="badge-dept">{{ dept.name }}</span>
        </td>

        <!-- Kolom Detail Proses & Target (Pecah per baris) -->
        <td>{{ proses.name }}</td>
        <td class="text-center fw-semibold">{{ proses.rataRataDayVal }}</td>
        <td class="text-center">{{ proses.targetJam }}</td>
        <td class="text-center">{{ proses.jmlh_org}}</td>
        <td class="text-center">{{ proses.jmlh_org_shiftdua }}</td>
        
        <!-- KOLOM TEAM: Dilepas rowspannya supaya nampil per proses seperti Excel abang -->
        <td class="text-center">
          <span class="badge-team" :class="{ 'badge-team-bantuan': order.isBantuan }">
            {{ proses.team }}
          </span>
        </td>

      </tr>
    </template>
  </template>

  <!-- Empty state: filter aktif tapi tidak ada baris yang cocok -->
  <tr v-if="!dataLoading && processedTableData.length === 0 && hasActiveFilters">
    <td colspan="12" class="text-center py-5">
      <i class="bi bi-funnel display-6 text-muted d-block mb-2"></i>
      <span class="text-muted">Tidak ada data yang cocok dengan filter yang dipilih.</span>
      <button class="btn btn-link btn-sm d-block mx-auto mt-1" @click="resetAllFilters">
        <i class="bi bi-arrow-counterclockwise me-1"></i>Reset semua filter
      </button>
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
const planData = ref([]);
const user = ref({ name: "User" });
const adjustedDateInfo = ref(null);
const hasFetchedData = ref(false);

const orderData = ref([]);

// 1. FILTER UTK TABEL TAMPILAN
const filters = reactive({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
});

// 2. FILTER KHUSUS MODUL SINKRONISASI - tidak perlu tanggal lagi
// (Sinkronisasi sekarang hanya snapshot data aktif, tanpa parameter tanggal)

const searchTerms = reactive({ style: '', gedung: '', dept: '', workname: '', team: '', });
const selectedFilters = reactive({ style: [], gedung: [], dept: [], workname: [], team: [] });

const hasActiveFilters = computed(() =>
  Object.values(selectedFilters).some(arr => arr.length > 0)
);

const resetAllFilters = () => {
  Object.keys(selectedFilters).forEach(key => { selectedFilters[key] = []; });
};

const calc7JamWorker = (xTarget, qtyPlan) => {
  if (!xTarget || !qtyPlan || xTarget === 0 || qtyPlan === 0) return 0;
  
  // Rumus: (qtyPlan / xTarget / 7) + 20%
  const hasilDasar = qtyPlan / xTarget / 7;
  return Math.round(hasilDasar * 1.2); // Menggunakan Math.round untuk pembulatan terdekat
};

const calc14JamWorker = (xTarget, qtyPlan) => {
  if (!xTarget || !qtyPlan || xTarget === 0 || qtyPlan === 0) return 0;
  
  // Rumus: (qtyPlan / xTarget / 14) + 20%
  const hasilDasar = qtyPlan / xTarget / 14;
  return Math.round(hasilDasar * 1.2); // Menggunakan Math.round untuk pembulatan terdekat
};

// =========================================================================
// HELPER: CEK APAKAH xMARK ADA OVERLAP DENGAN FILTER TANGGAL USER
// Tampilkan hanya jika startdatetime & enddatetime ada dan ada irisan dengan filter.
// =========================================================================
const hasDateOverlap = (startdatetime, enddatetime) => {
  if (!startdatetime || !enddatetime) return false;
  return new Date(startdatetime) <= new Date(filters.endDate) &&
         new Date(enddatetime)   >= new Date(filters.startDate);
};

const DEPT_ORDER = ['Lo', 'Steam', 'CBS', 'Sewing', 'Sontex', 'Soom', 'QC Lampu', 'Sulam'];

const sortByDeptOrder = (values) => {
  return [...values].sort((a, b) => {
    const idxA = DEPT_ORDER.indexOf(a);
    const idxB = DEPT_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1; // a ada di urutan tetap, taruh duluan
    if (idxB !== -1) return 1;  // b ada di urutan tetap, taruh duluan
    return a.localeCompare(b);  // dua-duanya di luar daftar, urutkan alfabetis
  });
};

const calculateWorkingDays = (start, end) => {
  let count = 0;
  let cur = new Date(start);
  const stop = new Date(end);
  while (cur <= stop) {
    const day = cur.getDay();
    if (day !== 0) {
      count += (day === 6 ? 0.5 : 1);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const workerDays = computed(() => calculateWorkingDays(filters.startDate, filters.endDate));

const processedTableData = computed(() => {
  // 1. INDEX MAP UNTUK ORDER DATA
  const orderQtyMap = new Map();
  orderData.value.forEach(o => {
    if (o.xMark) orderQtyMap.set(o.xMark, o.order_qty);
  });

  // 2. INDEX MAP UNTUK FALLBACK QTY PLAN
  const fallbackQtyMap = new Map();
  planData.value.forEach(p => {
    if (p.qty_plan > 0) {
      fallbackQtyMap.set(`${p.xMark}-${p.xworkname}`, p.qty_plan);
    }
  });

  // 3. FILTER DATA AWAL
  const filteredData = planData.value.filter(item => {
    if (!hasDateOverlap(item.startdatetime, item.enddatetime)) return false;
    const matchStyle    = selectedFilters.style.length    === 0 || selectedFilters.style.includes(item.xMark);
    const matchGedung   = selectedFilters.gedung.length   === 0 || selectedFilters.gedung.includes(item.gedung);
    const matchDept     = selectedFilters.dept.length     === 0 || selectedFilters.dept.includes(item.dept);
    const matchWorkname = selectedFilters.workname.length === 0 || selectedFilters.workname.includes(item.xworkname);
    
    // Filter pencarian Line mencakup ke-4 field team
    const matchTeam     = selectedFilters.team.length     === 0 || 
                          selectedFilters.team.includes(item.team) || 
                          selectedFilters.team.includes(item.team_bantuan) ||
                          selectedFilters.team.includes(item.teamdua) ||
                          selectedFilters.team.includes(item.team_bantuandua);
                          
    return matchStyle && matchGedung && matchDept && matchWorkname && matchTeam;
  });

  // Catatan penting: sebelumnya di sini ada fallback yang diam-diam menampilkan
  // kembali SEMUA data (mengabaikan filter style/gedung/dept/workname/team)
  // setiap kali kombinasi filter menghasilkan 0 baris. Itulah sebabnya filter
  // checkbox selain "Line" terasa "tidak berfungsi": begitu Anda mencentang
  // sesuatu yang membuat hasil kosong, tabel malah menampilkan data tanpa
  // filter sama sekali. Filter Line jarang kena kasus ini karena dia
  // mencocokkan OR ke 4 field (team, team_bantuan, teamdua, team_bantuandua)
  // sekaligus, jadi kelihatan seolah cuma dia yang jalan.
  // Sekarang filter selalu dihormati apa adanya, termasuk saat hasilnya kosong.
  const datasource = filteredData;

  const groups = {};

  // 4. GROUPING DATA BERDASARKAN XMARK (STYLE)
  datasource.forEach(item => {
    const orderKey = item.xMark;

    if (!groups[orderKey]) {
      const tglStart = formatDate(item.startdatetime);
      const tglEnd   = formatDate(item.enddatetime);
      const effectiveDays = calculateWorkingDays(item.startdatetime, item.enddatetime);

      groups[orderKey] = {
        qty: orderQtyMap.get(item.xMark) || 0,
        style: item.xMark,
        gedung: item.gedung,
        startdatetime: item.startdatetime,
        enddatetime: item.enddatetime,
        tanggalRange: `${tglStart} - ${tglEnd}`,
        effectiveWorkerDays: effectiveDays,
        depts: {}
      };
    }

    if (!groups[orderKey].depts[item.dept]) {
      groups[orderKey].depts[item.dept] = { name: item.dept, prosesListArray: [] };
    }

    // --- LOGIKA UTAMA: DUPLIKASI DAN PEMBAGIAN QTY ---
    let baseQty = item.qty_plan;
    if (!baseQty || baseQty === 0) {
      baseQty = fallbackQtyMap.get(`${item.xMark}-${item.xworkname}`) || 0;
    }

    // Kumpulkan semua tim yang valid (bukan null, bukan empty string, dan bukan '-')
    const activeTeams = [];
    if (item.team && item.team !== '-') activeTeams.push({ name: item.team, type: 'utama' });
    if (item.team_bantuan && item.team_bantuan !== '-') activeTeams.push({ name: item.team_bantuan, type: 'bantuan' });
    if (item.teamdua && item.teamdua !== '-') activeTeams.push({ name: item.teamdua, type: 'utama' });
    if (item.team_bantuandua && item.team_bantuandua !== '-') activeTeams.push({ name: item.team_bantuandua, type: 'bantuan' });

    // Jika tidak ada tim sama sekali terisi, beri fallback '-' agar baris proses tetap muncul
    if (activeTeams.length === 0) {
      activeTeams.push({ name: '-', type: 'utama' });
    }

    // Jika filter Line/Team aktif, tampilkan HANYA baris tim yang benar-benar
    // dicentang user (bukan semua slot tim milik item yang lolos filter di atas).
    // Tanpa ini, mencentang 1 tim tetap menampilkan tim lain yang menempel di
    // item yang sama (team, team_bantuan, teamdua, team_bantuandua).
    const teamsToRender = selectedFilters.team.length === 0
      ? activeTeams
      : activeTeams.filter(t => selectedFilters.team.includes(t.name));

    // Hitung pembagi berdasarkan jumlah tim yang aktif (Bisa bagi 4, 3, 2, atau 1)
    const divisor = activeTeams.length;
    const dividedQty = baseQty / divisor;

    // Tambahkan baris duplikat ke dalam departemen terkait
    teamsToRender.forEach(teamObj => {
      const targetPerJam = item.xTarget || 0;
      
      // Hitung worker berdasarkan Qty Plan yang sudah dibagi rata
      const worker7  = calc7JamWorker(targetPerJam, dividedQty);
      const worker14 = calc14JamWorker(targetPerJam, dividedQty);

      groups[orderKey].depts[item.dept].prosesListArray.push({
        name: item.xworkname,
        targetJam: targetPerJam,
        jmlh_org: worker7,
        jmlh_org_shiftdua: worker14,
        rataRataDayVal: Number(dividedQty.toFixed(1)), // Bulatkan ke 1 tempat desimal agar rapi
        team: teamObj.name,
        isBantuan: teamObj.type === 'bantuan'
      });
    });
  });

  // 5. PENYUSUNAN AKHIR & URUTAN DEPARTEMEN
  const finalResult = [];
  Object.keys(groups).forEach(orderKey => {
    const orderDataObj = groups[orderKey];

    if (selectedFilters.style.length  > 0 && !selectedFilters.style.includes(orderDataObj.style))   return;
    if (selectedFilters.gedung.length > 0 && !selectedFilters.gedung.includes(orderDataObj.gedung))  return;

    let totalRows = 0;
    const orderedDeptKeys = sortByDeptOrder(Object.keys(orderDataObj.depts))
      .filter(deptKey => orderDataObj.depts[deptKey].prosesListArray.length > 0); // buang dept yg jadi kosong akibat filter Line
    const orderedDepts = {};

    orderedDeptKeys.forEach(deptKey => {
      const pList = orderDataObj.depts[deptKey].prosesListArray;
      totalRows += pList.length;
      orderedDepts[deptKey] = orderDataObj.depts[deptKey];
    });

    if (totalRows === 0) return; // seluruh order jadi kosong akibat filter, jangan render

    orderDataObj.depts = orderedDepts;
    finalResult.push({ ...orderDataObj, totalRows });
  });

  return finalResult;
});

const groupedData = computed(() => {
  const groups = {};
  
  planData.value
    .filter(item => hasDateOverlap(item.startdatetime, item.enddatetime))
    .forEach(item => {
      // Daftarkan Team 1
      if (item.team && item.team !== '-') {
        const k = `${item.xMark}-${item.gedung}-${item.dept}-${item.xworkname}-${item.team}`;
        if (!groups[k]) groups[k] = { style: item.xMark, gedung: item.gedung, dept: item.dept, workname: item.xworkname, team: item.team };
      }
      // Daftarkan Team Bantuan 1
      if (item.team_bantuan && item.team_bantuan !== '-') {
        const k = `${item.xMark}-${item.gedung}-${item.dept}-${item.xworkname}-${item.team_bantuan}`;
        if (!groups[k]) groups[k] = { style: item.xMark, gedung: item.gedung, dept: item.dept, workname: item.xworkname, team: item.team_bantuan };
      }
      // Daftarkan Team 2
      if (item.teamdua && item.teamdua !== '-') {
        const k = `${item.xMark}-${item.gedung}-${item.dept}-${item.xworkname}-${item.teamdua}`;
        if (!groups[k]) groups[k] = { style: item.xMark, gedung: item.gedung, dept: item.dept, workname: item.xworkname, team: item.teamdua };
      }
      // Daftarkan Team Bantuan 2
      if (item.team_bantuandua && item.team_bantuandua !== '-') {
        const k = `${item.xMark}-${item.gedung}-${item.dept}-${item.xworkname}-${item.team_bantuandua}`;
        if (!groups[k]) groups[k] = { style: item.xMark, gedung: item.gedung, dept: item.dept, workname: item.xworkname, team: item.team_bantuandua };
      }
    });

  return Object.values(groups);
});

// =========================================================================
// CROSS-FILTERING: opsi pada dropdown filter kolom tertentu (mis. "dept")
// dihitung dari data yang SUDAH disaring oleh filter kolom-kolom LAIN
// (style, gedung, workname, team), tapi BUKAN oleh filter dirinya sendiri.
// Contoh kasus yang diperbaiki:
//   Saat Style difilter ke "1102" yang tidak punya Dept "Lo", maka opsi
//   "Lo" otomatis hilang dari dropdown filter Dept (tidak akan menampilkan
//   opsi yang ujung-ujungnya bikin tabel kosong saat dicentang).
// Mapping field key (UI) -> field asli di item groupedData
// =========================================================================
const FILTER_FIELD_MAP = {
  style: 'style',
  gedung: 'gedung',
  dept: 'dept',
  workname: 'workname',
  team: 'team'
};

const getCrossFilteredData = (excludeKey) => {
  return groupedData.value.filter(item => {
    return Object.keys(FILTER_FIELD_MAP).every(filterKey => {
      if (filterKey === excludeKey) return true; // jangan saring oleh dirinya sendiri
      const selected = selectedFilters[filterKey];
      if (!selected || selected.length === 0) return true;
      return selected.includes(item[FILTER_FIELD_MAP[filterKey]]);
    });
  });
};

const getUniqueOptions = (key, search) => {
  // Ambil data yang sudah disaring oleh SEMUA filter lain selain kolom "key" ini
  const sourceData = getCrossFilteredData(key);
  const values = [...new Set(sourceData.map(item => item[FILTER_FIELD_MAP[key]]))];
  const filtered = values.filter(v => v && v.toLowerCase().includes(search.toLowerCase()));
  // Khusus kolom Dept, urutan harus tetap: Lo, Steam, CBS, Sewing, Sontex, Soom, QC Lampu, Sulam
  if (key === 'dept') return sortByDeptOrder(filtered);
  return filtered.sort((a, b) => a.localeCompare(b));
};

// =========================================================================
// AUTO-CLEANUP: jika filter pada satu kolom berubah dan menyebabkan opsi
// yang sudah dicentang di kolom LAIN jadi tidak lagi valid (mis. Dept "Lo"
// sudah dicentang lalu Style difilter ke "1102" yang tidak punya Dept "Lo"),
// maka centang yang sudah tidak valid itu otomatis dilepas. Ini mencegah
// tabel tampil kosong tanpa disadari karena ada filter "nyangkut".
// =========================================================================
watch(
  () => Object.keys(FILTER_FIELD_MAP).map(k => selectedFilters[k].join(',')),
  () => {
    Object.keys(FILTER_FIELD_MAP).forEach(key => {
      if (selectedFilters[key].length === 0) return;
      const validOptions = new Set(
        getCrossFilteredData(key).map(item => item[FILTER_FIELD_MAP[key]])
      );
      const cleaned = selectedFilters[key].filter(v => validOptions.has(v));
      if (cleaned.length !== selectedFilters[key].length) {
        selectedFilters[key] = cleaned;
      }
    });
  }
);

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

const fetchData = async () => {
  dataLoading.value = true;
  adjustedDateInfo.value = null;
  try {
    // Filter tanggal dilakukan di frontend berdasarkan startdatetime & enddatetime per xMark.
    const [planRes, orderRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/planppc/view-target2-linking`),
      axios.get(`${API_BASE_URL}/planppc/view-targetorder`)
    ]);
    planData.value  = planRes.data  || [];
    orderData.value = orderRes.data || [];
  } catch (error) {
    Swal.fire('Error', 'Gagal memuat data.', 'error');
  } finally {
    dataLoading.value  = false;
    hasFetchedData.value = true;
  }
};

// =========================================================================
// SINKRONISASI - tanpa parameter tanggal, hanya snapshot data aktif
// =========================================================================
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
      // Tidak kirim parameter tanggal - backend langsung ambil snapshot data aktif
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

// =========================================================================
// NAMA FILE EXPORT DINAMIS
// Mengikuti filter Gedung, Dept, dan Team yang sedang aktif.
// Contoh: "Laporan Planning Finishing 30 Jun - 6 Jul Gedung A Dept Lo Team A1"
// Jika tidak ada filter aktif sama sekali, nama file tetap "Laporan Planning
// Finishing <tanggal>" tanpa embel-embel filter.
// =========================================================================
const buildExportFileName = () => {
  const parts = [
    'Laporan Planning Finishing',
    `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`
  ];

  if (selectedFilters.gedung.length > 0) {
    parts.push(`Gedung ${selectedFilters.gedung.join('-')}`);
  }
  if (selectedFilters.dept.length > 0) {
    parts.push(`Dept ${selectedFilters.dept.join('-')}`);
  }
  if (selectedFilters.team.length > 0) {
    parts.push(`Line ${selectedFilters.team.join('-')}`);
  }

  // Bersihkan karakter yang tidak valid untuk nama file (\ / : * ? " < > |)
  return parts.join(' ').replace(/[\\/:*?"<>|]/g, '-') + '.xlsx';
};

const exportToExcel = () => {
  const dataToExport = [];
  const merges = [];

  // Data tabel sekarang dimulai dari baris ke-3 (indeks berbasis 0, maka r = 3)
  let currentRow = 3;

  // Temukan bagian loop di dalam exportToExcel lalu ganti dengan ini:
processedTableData.value.forEach(order => {
  const startRowOrder = currentRow;

  Object.keys(order.depts).forEach(dKey => {
    const dept = order.depts[dKey];
    const startRowDept = currentRow;

    dept.prosesListArray.forEach((proses) => {
      dataToExport.push({
        "Style": order.style, 
        "Order Qty": order.qty, 
        "Gedung": order.gedung,
        "Tanggal": order.tanggalRange,
        "Worker Day": `${order.effectiveWorkerDays} Day`, 
        "Dept": dept.name, 
        "Proses": proses.name,
        "Qty Plan": proses.rataRataDayVal, // Sudah otomatis terbagi di computed
        "Target Jam": proses.targetJam,
        "7 Jam Worker": proses.jmlh_org, 
        "14 Jam Worker": proses.jmlh_org_shiftdua,
        "Line": proses.team || '-' 
      });
      currentRow++;
    });

    // Merge kolom Dept (indeks 5) jika baris > 1
    if (dept.prosesListArray.length > 1) {
      merges.push({ s: { r: startRowDept, c: 5 }, e: { r: currentRow - 1, c: 5 } });
    }
  });

  const columnsToMerge = [0, 1, 2, 3, 4]; 
  columnsToMerge.forEach(colIndex => {
    merges.push({ s: { r: startRowOrder, c: colIndex }, e: { r: currentRow - 1, c: colIndex } });
  });
});

  // Gunakan origin: 2 agar json_to_sheet digambar mulai dari baris ke-3 (Indeks 2)
  const ws = XLSX.utils.json_to_sheet(dataToExport, { origin: 2 });

  // --- PROSES INSERT JUDUL ---
  const judulExcel = `Target Planning Finishing (${formatDate(filters.startDate)} - ${formatDate(filters.endDate)})`;
  XLSX.utils.sheet_add_aoa(ws, [[judulExcel]], { origin: "A1" });

  // Merge judul dari kolom A sampai L (indeks 0 sampai 11) di baris pertama (r: 0)
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } });

  // Masukkan seluruh instruksi merge ke worksheet
  ws['!merges'] = merges;

  // Rentang styling mencakup dari baris 0 (Judul) sampai baris akhir data
  const range = { s: { c: 0, r: 0 }, e: { c: 11, r: currentRow - 1 } };
  const borderThin = { style: "thin", color: { rgb: "000000" } };

  for (let R = 0; R <= range.e.r; ++R) {
    if (R === 1) continue;

    for (let C = 0; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[cell_address]) ws[cell_address] = { t: 's', v: '' };

      if (R === 0) {
        ws[cell_address].s = {
          font: { name: "Calibri", sz: 16, bold: true, color: { rgb: "000000" } },
          alignment: { vertical: "center", horizontal: "left" }
        };
      } else if (R === 2) {
        ws[cell_address].s = {
          font: { name: "Calibri", sz: 11, bold: true },
          alignment: { vertical: "center", horizontal: "center", wrapText: true },
          border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
          fill: { fgColor: { rgb: "D3D3D3" } }
        };
      } else {
        ws[cell_address].s = {
          font: { name: "Calibri", sz: 11, bold: false },
          alignment: { vertical: "center", horizontal: "center", wrapText: true },
          border: { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin },
          fill: { fgColor: { rgb: "FFFFFF" } }
        };
      }
    }
  }

  ws['!ref'] = XLSX.utils.encode_range(range);
  ws['!cols'] = Array(12).fill({ wch: 15 });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PPC Plan");
  XLSX.writeFile(wb, buildExportFileName());
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};
// onMounted dihapus agar data tidak otomatis ter-fetch saat halaman pertama dibuka.
// Data baru ditampilkan setelah user menekan tombol "Reload Data".
</script>

<style scoped>
/* ===================== HEADER & TITLE ===================== */
.page-title-icon {
  width: 46px; height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25);
  flex-shrink: 0;
}

/* ===================== SYNC BAR ===================== */
.sync-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid #e9ecef;
  border-radius: 14px;
  padding: 8px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  flex-wrap: wrap;
}
.sync-bar-icon { color: #0d6efd; font-size: 0.95rem; }
.sync-bar-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #6c757d;
}
.sync-bar-input {
  border: none;
  background: #f8f9fb;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #212529;
  width: 138px;
}
.btn-sync {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  color: #fff;
  border: none;
  border-radius: 30px;
  padding: 7px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}
.btn-sync:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(13,110,253,0.3); color: #fff; }
.btn-sync:disabled { opacity: 0.65; }

.btn-update-qty {
  background: linear-gradient(135deg, #198754, #157347);
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
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
}
.btn-update-qty:hover { color: #fff; transform: translateY(-1px); box-shadow: 0 6px 14px rgba(25,135,84,0.3); }

/* ===================== FILTER CARD (Tgl Tampilan) ===================== */
.filter-card { background: #fff; }
.form-label-modern {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6c757d;
  margin-bottom: 5px;
  display: block;
}
.form-control-modern {
  background: #f8f9fb;
  border: 1.5px solid #e9ecef;
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  font-weight: 600;
}
.form-control-modern:focus { border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); background: #fff; }

.btn-reload {
  background: #e7edff;
  color: #1d4ed8;
  border: none;
  border-radius: 12px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px;
  transition: all 0.2s ease;
}
.btn-reload:hover:not(:disabled) { background: #1d4ed8; color: #fff; }
.btn-reload:disabled { opacity: 0.6; }

.btn-export {
  background: #d1f5e0;
  color: #157347;
  border: none;
  border-radius: 12px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex; align-items: center; gap: 8px;
  transition: all 0.2s ease;
}
.btn-export:hover:not(:disabled) { background: #157347; color: #fff; }
.btn-export:disabled { opacity: 0.6; }

.info-pill {
  background: #fff3cd;
  color: #997404;
  border-radius: 30px;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex; align-items: center; gap: 6px;
}

/* ===================== LOADING & ALERT ===================== */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.82);
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
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
main { position: relative; }

.alert-modern-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #e7edff;
  color: #1d4ed8;
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 500;
}
.alert-modern-info i.bi-info-circle-fill { font-size: 1.1rem; }
.btn-close-modern {
  background: none; border: none; color: #1d4ed8; opacity: 0.6;
  display: flex; align-items: center; padding: 0;
}
.btn-close-modern:hover { opacity: 1; }

/* ===================== EMPTY STATE ===================== */
.empty-state-card { background: #fff; }
.empty-state-icon {
  width: 64px; height: 64px;
  border-radius: 16px;
  background: #f3f5fb;
  color: #adb5bd;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

/* ===================== TABLE ===================== */
.table-container {
  min-height: clamp(350px, 55vh, 550px);
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
}
.sticky-header th {
  position: sticky;
  top: 0;
  background-color: #f8f9fa;
  z-index: 10;
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1);
}
.cursor-pointer { cursor: pointer; }

.planning-table thead th {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #495057;
  vertical-align: middle;
  padding: 0.65rem 0.75rem;
}
.planning-table tbody td {
  font-size: 0.86rem;
  padding: 0.6rem 0.75rem;
  vertical-align: middle;
}
.planning-table tbody tr:hover { background: #f8f9fb; }

.th-filterable { min-width: 130px; }
.th-filter-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  position: relative;
}
.th-filter-trigger i { font-size: 0.8rem; color: #adb5bd; transition: color 0.15s ease; }
.th-filter-trigger:hover i { color: #0d6efd; }

.filter-count-badge {
  background: #0d6efd;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1;
  min-width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  margin-left: -2px;
}

.filter-dropdown-panel { border-radius: 14px; }
.filter-scroll { max-height: 220px; overflow-y: auto; padding-right: 4px; }
.dropdown-toggle::after { vertical-align: middle; }

/* Badge di body tabel */
.badge-gedung {
  background: #eef1f6;
  color: #495057;
  border: 1px solid #e0e4eb;
  font-weight: 600;
  font-size: 0.74rem;
  padding: 4px 10px;
  border-radius: 30px;
}
.badge-dept {
  background: #e7edff;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 0.74rem;
  padding: 4px 10px;
  border-radius: 30px;
}
.badge-team {
  background: #fff3cd;
  color: #997404;
  font-weight: 700;
  font-size: 0.74rem;
  padding: 4px 10px;
  border-radius: 30px;
}
.badge-team-bantuan {
  background: #ffe0e0;
  color: #b02a37;
}

/* ===================== SCROLLBAR ===================== */
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0d6efd; }
</style>