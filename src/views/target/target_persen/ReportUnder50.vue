<template>
  <div class="d-flex flex-column min-vh-100 bg-soft-gray text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['flex-grow-1 p-2 p-md-4 main-content transition-all', { 'content-shifted': sidebarOpen }]">
        <!-- BUNGKUS DENGAN v-if="hasAccess" UNTUK UAC -->
      <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">
        <div class="container-fluid px-md-4">
          
          <!-- Header Section -->
          <div class="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-4 gap-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-1 modern-breadcrumb">
                  <li class="breadcrumb-item small"><a href="#" class="text-decoration-none">Report</a></li>
                  <li class="breadcrumb-item active small" aria-current="page">Operator Performance Daily</li>
                </ol>
              </nav>
              <h3 class="fw-bold m-0 tracking-tight text-gradient fs-4 fs-md-2 d-flex align-items-center">
                <span class="icon-badge me-2"><i class="bi bi-graph-up-arrow"></i></span>Performance Operator (Daily)
              </h3>
              <div class="mt-3 d-flex flex-wrap gap-2">
                <a href="/persen-target" class="btn btn-sm btn-back shadow-sm"><i class="bi bi-arrow-left"></i> Kembali</a>
              </div>
            </div>
            
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <button @click="resetAllFilters" class="btn btn-sm btn-reset shadow-sm px-3" v-if="hasActiveFilters">
                <i class="bi bi-arrow-counterclockwise"></i> Reset All
              </button>

              <div class="dropdown">
                <button class="btn btn-sm btn-columns shadow-sm dropdown-toggle fw-semibold" type="button" data-bs-toggle="dropdown">
                  <i class="bi bi-columns-gap me-1"></i>Columns
                </button>
                <ul class="dropdown-menu shadow-lg border-0 p-2 dropdown-menu-end rounded-3">
                  <li v-for="(val, key) in visibleColumns" :key="key">
                    <div class="dropdown-item py-1 rounded-2">
                      <div class="form-check form-switch mb-0">
                        <input class="form-check-input" type="checkbox" v-model="visibleColumns[key]" :id="'col'+key">
                        <label class="form-check-label small text-uppercase ms-2 fw-bold" :for="'col'+key">{{ key }}</label>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <button v-if="finalFilteredData.length > 0" @click="exportToExcel" class="btn btn-sm btn-export-excel fw-bold shadow-sm px-3">
                <i class="bi bi-file-earmark-excel me-1"></i>Excel
              </button>

              <!-- Tombol PDF Baru -->
  <button v-if="finalFilteredData.length > 0" @click="exportToPDF" class="btn btn-sm btn-export-pdf fw-bold shadow-sm px-3">
    <i class="bi bi-file-earmark-pdf me-1"></i>PDF
  </button>
            </div>
          </div>

          <!-- Main Filter Card (DENGAN RANGE SELECT) -->
          <div class="card border-0 shadow-sm rounded-4 mb-4 glass-card">
            <div class="card-body p-3 p-md-4">
              <div class="row g-3">
                <div class="col-12 col-md-6 col-xl-3">
                  <label class="label-filter-main"><i class="bi bi-calendar-event me-1"></i>Target Date</label>
                  <input type="date" v-model="filter.sDate" class="form-control form-control-sm shadow-sm modern-input" />
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                  <label class="label-filter-main"><i class="bi bi-building me-1"></i>Department</label>
                  <select v-model="filter.deptId" class="form-select form-select-sm shadow-sm modern-input" @change="handleDeptChange">
                    <option value="">Select Department...</option>
                    <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
                  </select>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                  <label class="label-filter-main"><i class="bi bi-diagram-3 me-1"></i>Group (Line)</label>
                  <select v-model="filter.line" class="form-select form-select-sm shadow-sm modern-input">
                    <option value="ALL">All Groups</option>
                    <option v-for="g in availableLines" :key="g" :value="g">{{ g }}</option>
                  </select>
                </div>
                <div class="col-12 col-md-6 col-xl-3 d-flex align-items-end">
                  <button class="btn btn-sm w-100 fw-bold py-2 shadow-sm border-0 btn-get-data" @click="fetchReport" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-funnel-fill me-2"></i> Get Data
                  </button>
                </div>

                <!-- Sub-Section: Range Selectors -->
                <div class="col-12 mt-2 pt-3 border-top range-section">
                  <div class="row g-3">
                    <!-- Range Prosentase -->
                    <div class="col-12 col-md-6">
                      <label class="label-filter-main"><i class="bi bi-percent me-1"></i>Range Performance (%)</label>
                      <div class="input-group input-group-sm">
                        <select v-model="filter.rateFrom" class="form-select shadow-sm modern-input">
                          <option :value="0">Dari 0%</option>
                          <option v-for="r in rateOptions" :key="'rf'+r" :value="r">{{ r }}%</option>
                          <option :value="101">> 100%</option>
                        </select>
                        <span class="input-group-text range-arrow border-0 px-3 fw-bold small">Ke</span>
                        <select v-model="filter.rateTo" class="form-select shadow-sm modern-input">
                          <option v-for="r in rateOptions" :key="'rt'+r" :value="r">{{ r }}%</option>
                          <option :value="9999999">> 100%</option>
                        </select>
                      </div>
                    </div>
                    <!-- Range Masa Kerja -->
                    <div class="col-12 col-md-6">
                      <label class="label-filter-main"><i class="bi bi-hourglass-split me-1"></i>Range Masa Kerja ({{ isLinking ? 'Bulan' : 'Minggu' }})</label>
                      <div class="input-group input-group-sm">
                        <select v-model="filter.masaFrom" class="form-select shadow-sm modern-input">
                          <option :value="0">Dari 0</option>
                          <option v-for="m in masaOptions" :key="'mf'+m" :value="m">{{ m }}</option>
                          <!-- <option :value="21">> {{ isLinking ? '8' : '20' }}</option> -->
                           <option :value="isLinking ? 9 : 21">> {{ isLinking ? '8' : '20' }}</option>
                        </select>
                        <span class="input-group-text range-arrow border-0 px-3 fw-bold small">Ke</span>
                        <select v-model="filter.masaTo" class="form-select shadow-sm modern-input">
                          <option v-for="m in masaOptions" :key="'mt'+m" :value="m">{{ m }}</option>
                          <option :value="999999">> {{ isLinking ? '8' : '20' }}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Table Section (DENGAN MULTISELECT CHECKBOX) -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-5 table-card" v-if="finalFilteredData.length > 0">
            <div class="table-card-header d-flex align-items-center justify-content-between px-4 py-3">
              <span class="fw-bold small text-uppercase table-card-title"><i class="bi bi-table me-2"></i>Hasil Report</span>
              <span class="badge rounded-pill result-count-badge">{{ finalFilteredData.length }} data</span>
            </div>
            <div class="table-responsive" style="min-height: 400px; overflow-y: visible;">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead>
                  <tr class="text-white">
                    <th class="ps-4 text-center" style="width: 50px">#</th>
                    <th v-if="visibleColumns.nik">
                      <div class="d-flex flex-column gap-1">
                        <span class="th-label text-white">NIK KP</span>
                        <MultiSelectFilter v-model="columnFilters.nik" :options="uniqueOptions.nik" title="NIK" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.nama">
                      <div class="d-flex flex-column gap-1">
                        <span class="th-label text-white">NAMA OPERATOR</span>
                        <MultiSelectFilter v-model="columnFilters.nama" :options="uniqueOptions.nama" title="Nama" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.masa">
                      <div class="d-flex flex-column gap-1 align-items-center">
                        <span class="th-label text-white">MASA KERJA</span>
                        <MultiSelectFilter v-model="columnFilters.masa" :options="uniqueOptions.masa" title="Masa" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.line">
                      <div class="d-flex flex-column gap-1 align-items-center">
                        <span class="th-label text-white">LINE</span>
                        <MultiSelectFilter v-model="columnFilters.line" :options="uniqueOptions.line" title="Line" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.rate">
                      <div class="d-flex flex-column gap-1 align-items-center">
                        <span class="th-label text-white">RATE (%)</span>
                        <MultiSelectFilter v-model="columnFilters.rate" :options="uniqueOptions.rate" title="Rate" suffix="%" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.convertrate">
                       <div class="d-flex flex-column gap-1 align-items-center">
                         <span class="th-label text-white">Total/Day</span>
                         <MultiSelectFilter v-model="columnFilters.convertrate" :options="uniqueOptions.convertrate" title="ConvertRate" suffic="ConvertRate" />
                       </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in finalFilteredData" :key="item.emplCode">
                    <td class="text-center text-muted small ps-4">{{ index + 1 }}</td>
                    <td v-if="visibleColumns.nik" class="fw-bold text-indigo small text-center">{{ item.emplCode }}</td>
                    <td v-if="visibleColumns.nama" class="small fw-semibold text-uppercase">{{ item.emplName }}</td>
                    <td v-if="visibleColumns.masa" class="text-center">
                      <span class="badge badge-soft-primary rounded-pill px-3">{{ formatMasaKerjaLabel(item) }}</span>
                    </td>
                    <td v-if="visibleColumns.line" class="text-center small">{{ item.group }}</td>
                    <td v-if="visibleColumns.rate" class="text-center">
                      <span :class="['fw-bold', item.realRate < 50 ? 'text-danger' : 'text-primary']">{{ item.realRate }}%</span>
                    </td>
                    <td v-if="visibleColumns.convertrate" class="text-center small">{{ item.convertRate }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="!loading" class="text-center py-5 empty-state-card">
            <div class="empty-state-icon mx-auto mb-3">
              <i class="bi bi-clipboard-x"></i>
            </div>
            <h5 class="fw-bold text-muted mb-1">Data tidak ditemukan</h5>
            <p class="text-muted small mb-0">Silakan pilih departemen dan tanggal, lalu klik "Get Data"</p>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, h, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatLineName = (lineName) => {
  if (!lineName) return "";
  // Mengganti "SOOM SONTEX" menjadi "SST" (Case Insensitive)
  return lineName.replace(/SOOM SONTEX/gi, 'SOOM SONTEX').trim();
};

// --- COMPONENT: MultiSelectFilter (Checkbox di Header) ---
const MultiSelectFilter = {
  props: ['modelValue', 'options', 'title', 'suffix'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const searchQuery = ref("");
    const filteredOptions = computed(() => {
      if (!searchQuery.value) return props.options;
      return props.options.filter(opt => String(opt).toLowerCase().includes(searchQuery.value.toLowerCase()));
    });
    const isAllSelected = computed(() => props.options.length > 0 && props.modelValue.length === props.options.length);
    const toggleAll = () => emit('update:modelValue', isAllSelected.value ? [] : [...props.options]);
    const toggleOption = (opt) => {
      let newValue = [...props.modelValue];
      const index = newValue.indexOf(opt);
      index > -1 ? newValue.splice(index, 1) : newValue.push(opt);
      emit('update:modelValue', newValue);
    };

    return () => h('div', { class: 'dropdown w-100' }, [
      h('button', { 
        class: `btn btn-xs w-100 text-truncate p-1 border rounded bg-white fw-bold ${props.modelValue.length ? 'text-primary border-primary' : 'text-muted'}`, 
        type: 'button', 'data-bs-toggle': 'dropdown', 'data-bs-auto-close': 'outside', style: 'font-size: 0.6rem;' 
      }, props.modelValue.length ? `${props.modelValue.length} Selected` : 'All'),
      h('div', { class: 'dropdown-menu shadow-lg p-2 border-0', style: 'min-width: 200px; max-height: 250px; overflow-y: auto;' }, [
        h('input', { type: 'text', class: 'form-control form-control-sm mb-2', placeholder: 'Search...', onInput: (e) => searchQuery.value = e.target.value }),
        h('div', { class: 'd-flex justify-content-between mb-2 px-1 border-bottom pb-1' }, [
          h('button', { class: 'btn btn-link btn-xs p-0 small text-decoration-none', onClick: toggleAll }, isAllSelected.value ? 'Unselect All' : 'Select All')
        ]),
        h('ul', { class: 'list-unstyled mb-0' }, 
          filteredOptions.value.map(opt => h('li', { class: 'small mb-1' }, [
            h('div', { class: 'form-check' }, [
              h('input', { class: 'form-check-input', type: 'checkbox', checked: props.modelValue.includes(opt), onChange: () => toggleOption(opt), id: `chk-${props.title}-${opt}` }),
              h('label', { class: 'form-check-label ms-1 text-truncate', style: 'max-width: 150px', for: `chk-${props.title}-${opt}` }, `${opt}${props.suffix || ''}`)
            ])
          ]))
        )
      ])
    ]);
  }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const hasAccess = ref(false);
const user = ref({});
const sidebarOpen = ref(false);
const loading = ref(false);
const rawData = ref([]);
const availableLines = ref([]);

const filter = ref({ 
  sDate: new Date().toISOString().substr(0, 10), 
  deptId: "", 
  line: "ALL",
  rateFrom: 0, rateTo: 999999,
  masaFrom: 0, masaTo: 999999
});

const columnFilters = ref({ nik: [], nama: [], masa: [], line: [], rate: [], convertrate: [] });
const visibleColumns = ref({ nik: true, nama: true, masa: true, line: true, rate: true, convertrate: true });

const departments = [
  { id: 10161, name: "LINKING TLS" }, {id: 10182, name: "CBS"}, { id: 10221, name: "SOOMSONTEX" }, {id:10114, name:"SEWING"}, {id:10115, name:"STEAM"},
  { id: 10264, name: "SEWING LO" }, {id:10181, name:"LINKING OBRAS"}, { id: 10265, name: "QC LAMPU" }, { id: 10266, name: "SULAM" }, { id: 10125, name: "QC KNITT" }, { id: 10251, name: "OBRAS"}
];

const isLinking = computed(() => filter.value.deptId == 10161);
//const rateOptions = computed(() => { let opts = []; for (let i = 0; i <= 100; i += 5) opts.push(i); return opts; });
const rateOptions = computed(() => { 
  let opts = []; 
  for (let i = 0; i <= 100; i++) { 
    opts.push(i); 
  } 
  return opts; 
});
const masaOptions = computed(() => { const limit = isLinking.value ? 8 : 20; return Array.from({ length: limit + 1 }, (_, i) => i); });

const formatMasaKerjaLabel = (item) => {
    const val = isLinking.value ? (item.xJoinMonth || 0) : (item.xJoinWeek || 0);
    return `${val} ${isLinking.value ? 'Bulan' : 'Minggu'}`;
};

const handleDeptChange = () => {
    filter.value.masaFrom = 0; filter.value.masaTo = 999999;
    rawData.value = []; resetColumnFilters();
};

const fetchReport = async () => {
  if (!filter.value.deptId) return Swal.fire({ icon: 'warning', text: 'Pilih Departemen.' });
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/report-operator/report-operatorunder50persen`, { 
      params: { sDate: filter.value.sDate, deptId: filter.value.deptId } 
    });
    rawData.value = res.data.data || [];
    availableLines.value = [...new Set(rawData.value.map(item => (item.group || "").trim().replace(/\s?\d+$/, '').trim()))].filter(Boolean).sort();
    resetColumnFilters();
  } catch (e) {
    Swal.fire({ icon: 'error', text: 'Gagal ambil data.' });
  } finally {
    loading.value = false;
  }
};

// --- LOGIKA FILTER DOUBLE LAYER ---
const finalFilteredData = computed(() => {
  return rawData.value.filter(item => {
    // 1. Filter Range (Dari - Ke)
    const lineMaster = (item.group || "").trim().replace(/\s?\d+$/, '').trim();
    const matchLineMaster = filter.value.line === "ALL" || lineMaster === filter.value.line;
    
    const rateVal = item.realRate || 0;
    const matchRateRange = rateVal >= filter.value.rateFrom && rateVal <= filter.value.rateTo;

    const masaVal = isLinking.value ? (item.xJoinMonth || 0) : (item.xJoinWeek || 0);
    const matchMasaRange = masaVal >= filter.value.masaFrom && masaVal <= filter.value.masaTo;

    // 2. Filter Column (Checkbox Header)
    const labelMasa = formatMasaKerjaLabel(item);
    const rateRound = Math.round(item.realRate || 0);
    const convertRateRound = Math.round(item.convertRate || 0);

    const matchNik = !columnFilters.value.nik.length || columnFilters.value.nik.includes(item.emplCode);
    const matchNama = !columnFilters.value.nama.length || columnFilters.value.nama.includes(item.emplName);
    const matchMasaCol = !columnFilters.value.masa.length || columnFilters.value.masa.includes(labelMasa);
    const matchLineCol = !columnFilters.value.line.length || columnFilters.value.line.includes(item.group);
    const matchRateCol = !columnFilters.value.rate.length || columnFilters.value.rate.includes(rateRound);
    const matchConvertRateCol = !columnFilters.value.convertrate.length || columnFilters.value.convertrate.includes(convertRateRound);

    return matchLineMaster && matchRateRange && matchMasaRange && matchNik && matchNama && matchMasaCol && matchLineCol && matchRateCol && matchConvertRateCol;
  });
});

const uniqueOptions = computed(() => {
  // Pilihan checkbox menyesuaikan data yang sudah lolos Range Filter
  const data = rawData.value.filter(item => {
    const lineMaster = (item.group || "").trim().replace(/\s?\d+$/, '').trim();
    const rateVal = item.realRate || 0;
    const masaVal = isLinking.value ? (item.xJoinMonth || 0) : (item.xJoinWeek || 0);
    return (filter.value.line === "ALL" || lineMaster === filter.value.line) &&
           (rateVal >= filter.value.rateFrom && rateVal <= filter.value.rateTo) &&
           (masaVal >= filter.value.masaFrom && masaVal <= filter.value.masaTo);
  });
  return {
    nik: [...new Set(data.map(i => i.emplCode))].sort(),
    nama: [...new Set(data.map(i => i.emplName))].sort(),
    masa: [...new Set(data.map(i => formatMasaKerjaLabel(i)))].sort(),
    //line: [...new Set(data.map(i => i.group))].sort(),
    line: [...new Set(data.map(i => formatLineName(i.group)))].sort(),
    rate: [...new Set(data.map(i => Math.round(i.realRate)))].sort((a,b) => a-b),
    convertrate: [...new Set(data.map(i => Math.round(i.convertRate)))].sort()

  };
});

const hasActiveFilters = computed(() => filter.value.line !== "ALL" || Object.values(columnFilters.value).some(v => v.length > 0) || filter.value.rateFrom > 0 || filter.value.rateTo < 999999);

const resetColumnFilters = () => columnFilters.value = { nik: [], nama: [], masa: [], line: [], rate: [], convertrate: [] };
const resetAllFilters = () => {
  filter.value.line = "ALL"; filter.value.rateFrom = 0; filter.value.rateTo = 999999;
  filter.value.masaFrom = 0; filter.value.masaTo = 999999; resetColumnFilters();
};

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Performance');

  // 1. Susun Header Dinamis Berdasarkan Kolom yang Terlihat (Visible)
  const headerRow = ['NO'];
  if (visibleColumns.value.nik) headerRow.push('NIK');
  if (visibleColumns.value.nama) headerRow.push('NAMA OPERATOR');
  if (visibleColumns.value.masa) headerRow.push('MASA KERJA');
  if (visibleColumns.value.line) headerRow.push('LINE');
  if (visibleColumns.value.rate) headerRow.push('RATE (%)');
  if (visibleColumns.value.convertrate) headerRow.push('TOTAL/DAY');

  worksheet.addRow(headerRow);

  // 2. Susun Data Dinamis Berdasarkan Kolom yang Terlihat
  finalFilteredData.value.forEach((item, index) => {
    const dataRow = [index + 1];
    if (visibleColumns.value.nik) dataRow.push(item.emplCode);
    if (visibleColumns.value.nama) dataRow.push(item.emplName);
    if (visibleColumns.value.masa) dataRow.push(formatMasaKerjaLabel(item));
    if (visibleColumns.value.line) dataRow.push(item.group);
    if (visibleColumns.value.rate) dataRow.push(item.realRate ? `${item.realRate}%` : '0%');
    if (visibleColumns.value.convertrate) dataRow.push(item.convertRate ? `${item.convertRate}%` : '0%');

    worksheet.addRow(dataRow);
  });

  // Styling sedikit agar header excel berwarna gelap (Opsional tapi rapi)
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' } // Menyamakan warna navy tua tabel web Anda
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const deptName = departments.find(d => d.id === filter.value.deptId)?.name || "Report";
  saveAs(new Blob([buffer]), `Performance_${deptName}_${filter.value.sDate}.xlsx`);
};

const exportToPDF = () => {
  const doc = new jsPDF('p', 'mm', 'a4'); 
  
  const deptName = departments.find(d => d.id === filter.value.deptId)?.name || "";
  const reportDate = filter.value.sDate;

  // 1. Header Ringkas PDF
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text("OPERATOR PERFORMANCE REPORT (DAILY)", 14, 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Department: ${deptName}`, 14, 22);
  doc.text(`Date: ${reportDate}`, 14, 27);

  // 2. Definisi Header Tabel Dinamis Mengikuti visibleColumns
  const tableColumn = ["NO"];
  if (visibleColumns.value.nik) tableColumn.push("NIK");
  if (visibleColumns.value.nama) tableColumn.push("NAMA OPERATOR");
  if (visibleColumns.value.masa) tableColumn.push("MASA KERJA");
  if (visibleColumns.value.line) tableColumn.push("LINE");
  if (visibleColumns.value.rate) tableColumn.push("RATE (%)");
  if (visibleColumns.value.convertrate) tableColumn.push("TOTAL/DAY");
  
  // 3. Persiapkan Data Sesuai Kolom yang Dipilih
  const tableRows = finalFilteredData.value.map((item, index) => {
    const row = [index + 1];
    if (visibleColumns.value.nik) row.push(item.emplCode);
    if (visibleColumns.value.nama) row.push(item.emplName.toUpperCase());
    if (visibleColumns.value.masa) row.push(formatMasaKerjaLabel(item));
    if (visibleColumns.value.line) row.push(item.group);
    if (visibleColumns.value.rate) row.push(`${item.realRate}%`);
    if (visibleColumns.value.convertrate) row.push(`${item.convertRate}%`);
    return row;
  });

  // 4. Render ke AutoTable
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      halign: 'center',
      fontStyle: 'bold'
    },
    didDrawPage: (data) => {
      const str = "Page " + doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  doc.save(`Performance_${deptName}_${reportDate}.pdf`);
};

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => { localStorage.clear(); window.location.href = "/login"; };
onMounted(() => {
  try {
    const pagesData = localStorage.getItem('pages') || localStorage.getItem('user_pages');
    const pages = pagesData ? JSON.parse(pagesData) : [];
    hasAccess.value = pages.includes('persen-target');
  } catch {
    hasAccess.value = false;
  }
  // const ud = localStorage.getItem("user");
  // if (ud) user.value = JSON.parse(ud);
});
// onMounted(() => { if (localStorage.getItem("user")) user.value = JSON.parse(localStorage.getItem("user")); });
</script>

<style scoped>
.bg-soft-gray { background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%); }
.main-content { transition: all 0.35s ease; }
.content-shifted { margin-left: 250px; }

/* Header */
.modern-breadcrumb { --bs-breadcrumb-divider-color: #94a3b8; }
.modern-breadcrumb .breadcrumb-item a { color: #64748b; }
.modern-breadcrumb .breadcrumb-item.active { color: #2563eb; font-weight: 600; }

.text-gradient { background: linear-gradient(90deg, #1e293b, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em; }
.icon-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: #fff; font-size: 1rem; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.btn-back {
  background: #fff; color: #334155; border: 1px solid #e2e8f0; border-radius: 10px;
  font-weight: 600; transition: all 0.2s ease;
}
.btn-back:hover { background: #f1f5f9; color: #1e293b; transform: translateY(-1px); }

.btn-reset {
  background: #fff; color: #64748b; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 600;
  transition: all 0.2s ease;
}
.btn-reset:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

.btn-columns {
  background: #fff; color: #334155; border: 1px solid #e2e8f0; border-radius: 10px;
  transition: all 0.2s ease;
}
.btn-columns:hover { background: #f8fafc; }

.btn-export-excel {
  background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; border: none; border-radius: 10px;
  transition: all 0.2s ease;
}
.btn-export-excel:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(22, 163, 74, 0.3); color: #fff; }

.btn-export-pdf {
  background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; border: none; border-radius: 10px;
  transition: all 0.2s ease;
}
.btn-export-pdf:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(220, 38, 38, 0.3); color: #fff; }

/* Filter Card */
.glass-card {
  background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px);
  border: 1px solid #e2e8f0; border-radius: 1.1rem;
}
.label-filter-main {
  font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.4px; margin-bottom: 6px; display: flex; align-items: center;
}
.modern-input {
  border-radius: 10px; border: 1px solid #e2e8f0; transition: all 0.2s ease;
}
.modern-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.range-section { border-top: 1px dashed #e2e8f0 !important; }
.range-arrow { background: #eef2ff; color: #4338ca; }

.btn-get-data {
  background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; border-radius: 10px;
  transition: all 0.2s ease;
}
.btn-get-data:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35); color: #fff; }
.btn-get-data:disabled { opacity: 0.7; }

/* Table Card */
.table-card { border: 1px solid #e2e8f0; }
.table-card-header {
  background: linear-gradient(90deg, #f8fafc, #eef2f7);
  border-bottom: 1px solid #e2e8f0;
}
.table-card-title { color: #334155; letter-spacing: 0.3px; }
.result-count-badge { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; font-size: 0.7rem; padding: 6px 12px; }

.custom-table thead th {
  font-size: 0.7rem; vertical-align: top; padding: 14px 10px;
  background: linear-gradient(180deg, #1e293b, #0f172a) !important; color: #f8fafc !important;
  border-bottom: none;
}
.custom-table thead tr:first-child th:first-child { border-top-left-radius: 0; }
.th-label { display: block; margin-bottom: 6px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

.custom-table tbody tr { transition: background 0.15s ease; }
.custom-table tbody tr:hover { background-color: #f1f5f9 !important; }
.custom-table tbody td { padding: 10px; border-bottom: 1px solid #f1f5f9; }

.text-indigo { color: #4f46e5; }
.badge-soft-primary { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; font-size: 0.7rem; font-weight: 700; }

/* Empty State */
.empty-state-card { background: #fff; border: 1px dashed #e2e8f0; border-radius: 1.1rem; }
.empty-state-icon {
  width: 72px; height: 72px; border-radius: 50%; background: #f1f5f9;
  display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #94a3b8;
}

@media (max-width: 991px) { .content-shifted { margin-left: 0; } }
</style>