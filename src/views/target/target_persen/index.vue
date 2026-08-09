<template>
  <div class="d-flex flex-column min-vh-100 bg-white text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['flex-grow-1 p-4 main-content transition-all', { 'content-shifted': sidebarOpen }]">
        <div class="container-fluid">
          
          <div class="d-flex justify-content-between align-items-center mb-4 mt-3">
            <h4 class="fw-bold text-primary m-0">
              <i class="bi bi-bar-chart-fill me-2"></i>Laporan Harian Prosentase Target
            </h4>
            
            <div class="d-flex gap-2">
              <div class="dropdown" v-if="isDataLoaded">
                <button class="btn btn-outline-primary dropdown-toggle shadow-sm fw-bold" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  <i class="bi bi-layout-three-columns me-2"></i>Atur Tampilan Kolom
                </button>
                <ul class="dropdown-menu shadow border-0 p-3" style="min-width: 250px;">
                  <li class="fw-bold small text-muted mb-2 border-bottom text-uppercase">Pilih Kolom</li>
                  <li v-for="(visible, key) in columnSettings" :key="key" class="mb-1">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="columnSettings[key]" :id="'vis-'+key">
                      <label class="form-check-label small cp" :for="'vis-'+key">{{ formatColumnName(key) }}</label>
                    </div>
                  </li>
                </ul>
              </div>

              <button v-if="isDataLoaded" @click="exportToExcel" class="btn btn-success shadow-sm rounded-3 fw-bold">
                <i class="bi bi-file-earmark-excel me-2"></i>Excel
              </button>
              <button v-if="isDataLoaded" @click="exportToPDF" class="btn btn-danger shadow-sm rounded-3 fw-bold">
                <i class="bi bi-file-earmark-pdf me-2"></i>PDF
              </button>
            </div>
          </div>

          <!-- Navigasi -->
          <div class="mb-4 d-flex gap-3">
             <a href="/persen-target-under50persen" class="btn btn-primary active"><i class="bi bi-calendar-event me-2"> Daily Report Performance</i></a>
            <a href="/persen-target-under50month" class="btn btn-outline-primary"><i class="bi bi-calendar-month me-2"></i> Monthly Report performance</a>
          </div>

          <!-- Filter Card -->
          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-4">
              <div class="row g-3">
                <div class="col-md-3">
                  <label class="small fw-bold text-muted text-uppercase mb-2 d-block">Tanggal Laporan</label>
                  <input type="date" v-model="filter.sDate" class="form-control border-0 bg-light shadow-none rounded-3" />
                </div>
                <div class="col-md-5">
                  <label class="small fw-bold text-muted text-uppercase mb-2 d-block">Departemen</label>
                  <select v-model="filter.deptId" class="form-select border-0 bg-light shadow-none rounded-3">
                    <option value="">-- Pilih Departemen --</option>
                    <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
                  </select>
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <button class="btn btn-primary w-100 fw-bold py-2 rounded-3 shadow" @click="fetchReport" :disabled="loading">
                    <i v-if="loading" class="spinner-border spinner-border-sm me-2"></i>
                    <i v-else class="bi bi-search me-2"></i> Tampilkan Laporan
                  </button>
                </div>
              </div>

              <transition name="fade">
                <div class="row mt-4 pt-3 border-top border-light" v-if="isDataLoaded">
                  <div class="col-md-6 d-flex align-items-center gap-3">
                    <div class="bg-primary bg-opacity-10 p-2 rounded-3 d-flex align-items-center gap-2">
                      <label class="fw-bold text-primary text-nowrap m-0 small">
                        <i class="bi bi-diagram-3-fill me-1"></i> FILTER LINE:
                      </label>
                      <select v-model="filter.line" class="form-select form-select-sm border-0 bg-white shadow-sm" style="min-width: 200px;">
                        <option value="ALL">Semua Group (ALL)</option>
                        <option v-for="g in availableLines" :key="g" :value="g">{{ g }}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- Table Card -->
          <div class="card border-0 shadow-sm rounded-4 overflow-visible" v-if="isDataLoaded">
            <div class="table-responsive" style="overflow: visible !important; padding-bottom: 150px;">
              <table class="table table-hover align-middle mb-0 text-center border">
                <thead class="bg-primary text-white">
                  <tr>
                    <th v-if="columnSettings.masaKerja" rowspan="2" class="border-light align-middle py-3">
                      <div class="dropdown">
                        MASA KERJA <i class="bi bi-funnel-fill ms-1 cp fs-xs" data-bs-toggle="dropdown" data-bs-auto-close="outside"></i>
                        <ul class="dropdown-menu shadow border-0 p-3 mt-2">
                          <li v-for="cat in allJoinCategories" :key="cat" class="mb-1">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" v-model="dataFilters.masaKerja" :value="cat" :id="'f-mk-'+cat">
                              <label class="form-check-label small text-dark cp" :for="'f-mk-'+cat">{{ cat }}</label>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </th>

                    <th v-if="columnSettings.targetStd" rowspan="2" class="border-light align-middle">
                      <div class="dropdown">
                        TARGET STD <i class="bi bi-funnel-fill ms-1 cp fs-xs" data-bs-toggle="dropdown" data-bs-auto-close="outside"></i>
                        <ul class="dropdown-menu shadow border-0 p-3 mt-2">
                          <li v-for="t in uniqueTargetOptions" :key="t" class="mb-1">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" v-model="dataFilters.targetStd" :value="t" :id="'f-ts-'+t">
                              <label class="form-check-label small text-dark cp" :for="'f-ts-'+t">{{ t }}</label>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </th>

                    <th v-if="columnSettings.prosentase" :colspan="rateCategories.length" class="border-light py-2 small fw-normal">PROSENTASE (%)</th>
                    
                    <th v-if="columnSettings.totalOp" rowspan="2" class="border-light align-middle">
                      <div class="dropdown">
                        TOTAL OP <i class="bi bi-funnel-fill ms-1 cp fs-xs" data-bs-toggle="dropdown" data-bs-auto-close="outside"></i>
                        <ul class="dropdown-menu shadow border-0 p-3 mt-2">
                          <li v-for="to in uniqueTotalOptions" :key="to" class="mb-1">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" v-model="dataFilters.totalOp" :value="to" :id="'f-to-'+to">
                              <label class="form-check-label small text-dark cp" :for="'f-to-'+to">{{ to }} Org</label>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </th>

                    <th v-if="columnSettings.prosentaseMasaKerja" rowspan="2" class="border-light align-middle">PROSENTASE MK</th>
                  </tr>

                  <tr v-if="columnSettings.prosentase" class="bg-primary-dark">
                    <th v-for="r in rateCategories" :key="r" class="border-light py-2 small">
                      <div class="dropdown">
                        {{ r }} <i class="bi bi-funnel-fill cp fs-xs ms-1" data-bs-toggle="dropdown" data-bs-auto-close="outside"></i>
                        <ul class="dropdown-menu shadow border-0 p-3 mt-2">
                          <li v-for="val in getUniqueValuesForRate(r)" :key="val" class="mb-1">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" v-model="dataFilters.rates[r]" :value="val" :id="'f-r-'+r+'-'+val">
                              <label class="form-check-label small text-dark cp" :for="'f-r-'+r+'-'+val">{{ val }} Org</label>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="j in filteredRows" :key="j">
                    <td v-if="columnSettings.masaKerja" class="fw-bold text-start ps-3 border-end">{{ j }}</td>
                    <td v-if="columnSettings.targetStd" class="border-end text-muted fw-bold">{{ getTargetValueFor(j) }}</td>
                    
                    <template v-if="columnSettings.prosentase">
                      <td v-for="r in rateCategories" :key="r" class="border-end" :class="{'text-danger': (matrix[j]?.[r] || 0) > 0 && r === '0-30'}">
                        {{ matrix[j]?.[r] || 0 }}
                      </td>
                    </template>

                    <td v-if="columnSettings.totalOp" class="fw-bold text-primary border-end">{{ matrix[j]?.total || 0 }}</td>
                    <td v-if="columnSettings.prosentaseMasaKerja" class="small">{{ calculatePersenMK(j) }}%</td>
                  </tr>

                  <!-- Baris Total Terfilter -->
                  <tr v-if="filteredRows.length > 0" class="table-warning fw-bold border-top border-dark border-opacity-10">
                    <td :colspan="(columnSettings.masaKerja?1:0) + (columnSettings.targetStd?1:0)" class="border-end text-uppercase">Total Terfilter</td>
                    <template v-if="columnSettings.prosentase">
                      <td v-for="r in rateCategories" :key="r" class="border-end">{{ totalPerRateFiltered[r] }}</td>
                    </template>
                    <td v-if="columnSettings.totalOp" class="text-danger border-end">{{ grandTotalFiltered }}</td>
                    <td v-if="columnSettings.prosentaseMasaKerja" class="bg-light"></td>
                  </tr>

                  <!-- Baris Prosentase Produksi -->
                  <tr v-if="filteredRows.length > 0" class="bg-white fw-bold">
                    <td :colspan="(columnSettings.masaKerja?1:0) + (columnSettings.targetStd?1:0)" class="text-primary border-end">PROSENTASE PRODUKSI</td>
                    <template v-if="columnSettings.prosentase">
                      <td v-for="r in rateCategories" :key="r" class="text-primary small border-end">
                        {{ calculatePersenProduksi(r) }}%
                      </td>
                    </template>
                    <td v-if="columnSettings.totalOp" colspan="2" class="bg-light"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!loading" class="text-center py-5">
            <i class="bi bi-search opacity-25" style="font-size: 3rem;"></i>
            <p class="text-muted mt-3">Gunakan filter untuk menampilkan data matrix performance.</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- STATE UTAMA ---
const user = ref({});
const sidebarOpen = ref(false);
const isDataLoaded = ref(false);
const loading = ref(false);
const matrix = ref({});
const allJoinCategories = ref([]);
const availableLines = ref([]);
const rateCategories = ["0-40", "41-50", "51-60", "61-70", "71-80", "81-90", "91-100", ">100"];

const departments = [
  { id: 10161, name: "LINKING TLS" }, {id: 10182, name: "CBS"}, { id: 10221, name: "SOOMSONTEX" }, {id:10114, name:"SEWING"}, {id:10115, name:"STEAM"},
  { id: 10264, name: "SEWING LO" }, {id:10181, name:"LINKING OBRAS"}, { id: 10265, name: "QC LAMPU" }, { id: 10266, name: "SULAM" }, { id: 10125, name: "QC KNITT" }, { id: 10251, name: "OBRAS"}
];

const targetMap = {
  10161: ["0%", "40%", "50%", "55%", "65%", "70%", "80%", "90%","100%"],
  // 1. Departemen 10221, 10251, 10264, 10265 (dan departemen lain dengan skema yang sama):
  // Masa kerja: 0-2 minggu (40%), 3-4 minggu (50%), 5-8 minggu (60%), 9-12 minggu (70%), 13-16 minggu (80%), 17-20 minggu (90%), 21 minggu keatas (100%)
  10221: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],
  10264: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],
  10265: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],
  10125: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],
  10251: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],
  10182: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],
  10114: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],
  10115: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],
  10181: ["40%", "50%", "60%", "70%", "80%", "90%", "100%"],

  // 2. Sulam / Departemen 10266:
  // Masa kerja: 0-2 minggu (0%), 3-4 minggu (40%), 5-8 minggu (50%), 9-12 minggu (60%), 13-16 minggu (70%), 17-20 minggu (80%), 21-24 minggu (90%), 25 minggu keatas (100%)
  10266: ["0%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"],
};

// --- FILTER STATE ---
const filter = ref({ sDate: new Date().toISOString().substr(0, 10), deptId: "", line: "ALL" });

const columnSettings = ref({
  masaKerja: true, targetStd: true, prosentase: true, totalOp: true, prosentaseMasaKerja: true
});

const dataFilters = reactive({
  masaKerja: [],
  targetStd: [],
  totalOp: [],
  rates: { "0-40":[], "41-50":[], "51-60":[], "61-70":[], "71-80":[], "81-90":[], "91-100":[], ">100":[] }
});

// --- LOGIKA FILTERING ---
const filteredRows = computed(() => {
  if (!allJoinCategories.value.length) return [];
  return allJoinCategories.value.filter(cat => {
    const mMK = dataFilters.masaKerja.length === 0 || dataFilters.masaKerja.includes(cat);
    const mTS = dataFilters.targetStd.length === 0 || dataFilters.targetStd.includes(getTargetValueFor(cat));
    const mTO = dataFilters.totalOp.length === 0 || dataFilters.totalOp.includes(matrix.value[cat]?.total || 0);
    
    let mRates = true;
    for (const r of rateCategories) {
      if (dataFilters.rates[r].length > 0) {
        if (!dataFilters.rates[r].includes(matrix.value[cat]?.[r] || 0)) {
          mRates = false;
          break;
        }
      }
    }
    return mMK && mTS && mTO && mRates;
  });
});

// Helper Dropdown
const uniqueTargetOptions = computed(() => [...new Set(allJoinCategories.value.map(c => getTargetValueFor(c)))]);
const uniqueTotalOptions = computed(() => [...new Set(allJoinCategories.value.map(c => matrix.value[c]?.total || 0))].sort((a,b)=>a-b));
const getUniqueValuesForRate = (r) => [...new Set(allJoinCategories.value.map(c => matrix.value[c]?.[r] || 0))].sort((a,b)=>a-b);

// Kalkulasi Ringkasan
const grandTotalFiltered = computed(() => filteredRows.value.reduce((acc, cat) => acc + (matrix.value[cat]?.total || 0), 0));
const totalPerRateFiltered = computed(() => {
  const res = {};
  rateCategories.forEach(r => res[r] = filteredRows.value.reduce((acc, cat) => acc + (matrix.value[cat]?.[r] || 0), 0));
  return res;
});

// --- ACTIONS ---
const fetchReport = async () => {
  if (!filter.value.deptId) return Swal.fire("Peringatan", "Silakan pilih Departemen!", "warning");
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/report-operator/report-operator`, { params: filter.value });
    matrix.value = res.data.matrix;
    allJoinCategories.value = res.data.joinCategories;
    availableLines.value = res.data.uniqueLines;
    
    // Reset Corong Filters
    dataFilters.masaKerja = []; dataFilters.targetStd = []; dataFilters.totalOp = [];
    rateCategories.forEach(r => dataFilters.rates[r] = []);
    
    isDataLoaded.value = true;
  } catch (e) {
    Swal.fire("Error", "Gagal mengambil data.", "error");
  } finally { loading.value = false; }
};

const getTargetValueFor = (cat) => {
  const idx = allJoinCategories.value.indexOf(cat);
  const deptTargets = targetMap[filter.value.deptId] || [];
  return deptTargets[idx] || "100%";
};

const calculatePersenMK = (cat) => Math.round(((matrix.value[cat]?.total || 0) / (grandTotalFiltered.value || 1)) * 100);
const calculatePersenProduksi = (rate) => Math.round(((totalPerRateFiltered.value[rate] || 0) / (grandTotalFiltered.value || 1)) * 100);

const formatColumnName = (k) => {
  const map = { masaKerja:'Masa Kerja', targetStd:'Target Standar', prosentase:'Prosentase Data', totalOp:'Total Operator', prosentaseMasaKerja:'Persen MK' };
  return map[k];
};

// --- EXPORT LOGIC ---
const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Matrix Performance');

  // 1. Header Row
  const headerRow = [];
  if (columnSettings.value.masaKerja) headerRow.push("MASA KERJA");
  if (columnSettings.value.targetStd) headerRow.push("TARGET");
  if (columnSettings.value.prosentase) rateCategories.forEach(r => headerRow.push(r));
  if (columnSettings.value.totalOp) headerRow.push("TOTAL OP");
  if (columnSettings.value.prosentaseMasaKerja) headerRow.push("PERSEN MK");

  const rowH = worksheet.addRow(headerRow);
  rowH.font = { bold: true };
  rowH.fill = { type: 'pattern', pattern:'solid' }; // Warna Biru
  rowH.eachCell(cell => { cell.font = { color: { argb: '000000' }, bold: true }; });

  // 2. Data Rows
  filteredRows.value.forEach(cat => {
    const row = [];
    if (columnSettings.value.masaKerja) row.push(cat);
    if (columnSettings.value.targetStd) row.push(getTargetValueFor(cat));
    if (columnSettings.value.prosentase) rateCategories.forEach(r => row.push(matrix.value[cat]?.[r] || 0));
    if (columnSettings.value.totalOp) row.push(matrix.value[cat]?.total || 0);
    if (columnSettings.value.prosentaseMasaKerja) row.push(calculatePersenMK(cat) + "%");
    worksheet.addRow(row);
  });

  // 3. BARIS TOTAL TERFILTER
  const totalRow = [];
  if (columnSettings.value.masaKerja || columnSettings.value.targetStd) {
    totalRow.push("TOTAL TERFILTER");
    if (columnSettings.value.masaKerja && columnSettings.value.targetStd) totalRow.push(""); 
  }
  if (columnSettings.value.prosentase) rateCategories.forEach(r => totalRow.push(totalPerRateFiltered.value[r]));
  if (columnSettings.value.totalOp) totalRow.push(grandTotalFiltered.value);
  if (columnSettings.value.prosentaseMasaKerja) totalRow.push("");

  const rowT = worksheet.addRow(totalRow);
  rowT.font = { bold: true };
  rowT.getCell(1).font = { color: { argb: 'FF0000' } }; // Warna Merah untuk teks Total

  // 4. BARIS PROSENTASE PRODUKSI
  const prodRow = [];
  if (columnSettings.value.masaKerja || columnSettings.value.targetStd) {
    prodRow.push("PROSENTASE PRODUKSI");
    if (columnSettings.value.masaKerja && columnSettings.value.targetStd) prodRow.push("");
  }
  if (columnSettings.value.prosentase) rateCategories.forEach(r => prodRow.push(calculatePersenProduksi(r) + "%"));
  if (columnSettings.value.totalOp) prodRow.push("");
  if (columnSettings.value.prosentaseMasaKerja) prodRow.push("");

  const rowP = worksheet.addRow(prodRow);
  rowP.font = { bold: true, color: { argb: 'FF2980B9' } };

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Matrix_Performance_${filter.value.sDate}.xlsx`);
};

const exportToPDF = () => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const deptName = departments.find(d => d.id === filter.value.deptId)?.name || "";

  doc.setFontSize(16);
  doc.text(`MATRIX PERFORMANCE REPORT - ${deptName}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Tanggal: ${filter.value.sDate} | Line: ${filter.value.line}`, 14, 22);

  const head = [];
  const headRow = [];
  if (columnSettings.value.masaKerja) headRow.push("MASA KERJA");
  if (columnSettings.value.targetStd) headRow.push("TARGET");
  if (columnSettings.value.prosentase) rateCategories.forEach(r => headRow.push(r));
  if (columnSettings.value.totalOp) headRow.push("TOTAL OP");
  if (columnSettings.value.prosentaseMasaKerja) headRow.push("PERSEN MK");
  head.push(headRow);

  // Data Body
  const body = filteredRows.value.map(cat => {
    const row = [];
    if (columnSettings.value.masaKerja) row.push(cat);
    if (columnSettings.value.targetStd) row.push(getTargetValueFor(cat));
    if (columnSettings.value.prosentase) rateCategories.forEach(r => row.push(matrix.value[cat]?.[r] || 0));
    if (columnSettings.value.totalOp) row.push(matrix.value[cat]?.total || 0);
    if (columnSettings.value.prosentaseMasaKerja) row.push(calculatePersenMK(cat) + "%");
    return row;
  });

  // Footer (Total & Prosentase Produksi)
  const foot = [];
  
  // Baris Total Terfilter
  const footTotal = [];
  const span = (columnSettings.value.masaKerja ? 1 : 0) + (columnSettings.value.targetStd ? 1 : 0);
  footTotal.push("TOTAL TERFILTER");
  for(let i=1; i < span; i++) footTotal.push("");
  if (columnSettings.value.prosentase) rateCategories.forEach(r => footTotal.push(totalPerRateFiltered.value[r]));
  if (columnSettings.value.totalOp) footTotal.push(grandTotalFiltered.value);
  if (columnSettings.value.prosentaseMasaKerja) footTotal.push("");
  foot.push(footTotal);

  // Baris Prosentase Produksi
  const footProd = [];
  footProd.push("PROSENTASE PRODUKSI");
  for(let i=1; i < span; i++) footProd.push("");
  if (columnSettings.value.prosentase) rateCategories.forEach(r => footProd.push(calculatePersenProduksi(r) + "%"));
  if (columnSettings.value.totalOp) footProd.push("");
  if (columnSettings.value.prosentaseMasaKerja) footProd.push("");
  foot.push(footProd);

  autoTable(doc, {
    head: head,
    body: body,
    foot: foot,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], halign: 'center' },
    footStyles: { fillColor: [241, 241, 241], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 8, halign: 'center' },
    columnStyles: { 0: { halign: 'left' } }
  });

  doc.save(`Matrix_Performance_${filter.value.sDate}.pdf`);
};

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => { localStorage.clear(); window.location.href = "/login"; };

watch(() => filter.value.line, () => { if(isDataLoaded.value) fetchReport(); });

onMounted(() => {
  const ud = localStorage.getItem("user");
  if (ud) user.value = JSON.parse(ud);
});
</script>

<style scoped>
.cp { cursor: pointer; }
.fs-xs { font-size: 0.7rem; }
.transition-all { transition: 0.3s ease-in-out; }
.main-content { background-color: #f8f9fa; min-height: 100vh; }
.content-shifted { margin-left: 250px; }
.overflow-visible { overflow: visible !important; }
.table-responsive { overflow: visible !important; }

.dropdown-menu { 
  border-radius: 12px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
  z-index: 1070;
  max-height: 350px;
  overflow-y: auto;
}

.bg-primary-dark { background-color: rgba(0,0,0,0.1) !important; }
.table-warning { background-color: #fff9e6 !important; }

@media (max-width: 991.98px) {
  .content-shifted { margin-left: 0; opacity: 0.5; pointer-events: none; }
}
</style>