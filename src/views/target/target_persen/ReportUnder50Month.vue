<template>
  <div class="d-flex flex-column min-vh-100 bg-soft-gray text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['flex-grow-1 p-2 p-md-4 main-content transition-all', { 'content-shifted': sidebarOpen }]">
        <div class="container-fluid px-md-4">
          
          <!-- Header Section (Identik Daily) -->
          <div class="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center mb-4 gap-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-1">
                  <li class="breadcrumb-item small"><a href="#" class="text-decoration-none">Report</a></li>
                  <li class="breadcrumb-item active small" aria-current="page">Operator Performance Monthly</li>
                </ol>
              </nav>
              <h3 class="fw-bold m-0 tracking-tight text-gradient fs-4 fs-md-2">
                <i class="bi bi-calendar-month me-2 text-primary"></i>Performance Operator (Monthly)
              </h3>
               <div class="mt-2 d-flex flex-wrap gap-2">
                <a href="/persen-target" class="btn btn-sm btn-secondary shadow-sm"><i class="bi bi-arrow-left"></i> Kembali</a>
              </div>
            </div>
            
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <button @click="resetAllFilters" class="btn btn-sm btn-light border shadow-sm px-3" v-if="hasActiveFilters">
                <i class="bi bi-arrow-counterclockwise"></i> Reset All
              </button>

              <!-- Column Toggle Dropdown -->
              <div class="dropdown">
                <button class="btn btn-sm btn-white border shadow-sm dropdown-toggle fw-semibold" type="button" data-bs-toggle="dropdown">
                  <i class="bi bi-columns-gap me-1"></i>Columns
                </button>
                <ul class="dropdown-menu shadow-lg border-0 p-2 dropdown-menu-end">
                  <li v-for="(val, key) in visibleColumns" :key="key">
                    <div class="dropdown-item py-1">
                      <div class="form-check form-switch mb-0">
                        <input class="form-check-input" type="checkbox" v-model="visibleColumns[key]" :id="'col'+key">
                        <label class="form-check-label small text-uppercase ms-2 fw-bold" :for="'col'+key">{{ key }}</label>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <button v-if="finalFilteredData.length > 0" @click="exportToExcel" class="btn btn-sm btn-success fw-bold shadow-sm px-3">
                <i class="bi bi-file-earmark-excel me-1"></i>Excel
              </button>
              <button v-if="finalFilteredData.length > 0" @click="exportToPDF" class="btn btn-sm btn-danger fw-bold shadow-sm px-3">
                <i class="bi bi-file-earmark-pdf me-1"></i>PDF
              </button>
            </div>
          </div>

          <!-- Main Filter Card (DENGAN RANGE SELECT) -->
          <div class="card border-0 shadow-sm rounded-4 mb-4 glass-card">
            <div class="card-body p-3 p-md-4">
              <div class="row g-3">
                <div class="col-12 col-md-6 col-xl-2">
                  <label class="label-filter-main">Start Date</label>
                  <input type="date" v-model="filter.sBeginDate" class="form-control form-control-sm shadow-sm" />
                </div>
                <div class="col-12 col-md-6 col-xl-2">
                  <label class="label-filter-main">End Date</label>
                  <input type="date" v-model="filter.sEndDate" class="form-control form-control-sm shadow-sm" />
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                  <label class="label-filter-main">Department</label>
                  <select v-model="filter.deptId" class="form-select form-select-sm shadow-sm" @change="handleDeptChange">
                    <option value="">Select Department...</option>
                    <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
                  </select>
                </div>
                <div class="col-12 col-md-6 col-xl-2">
                  <label class="label-filter-main">Group (Line)</label>
                  <select v-model="filter.line" class="form-select form-select-sm shadow-sm">
                    <option value="ALL">All Groups</option>
                    <option v-for="g in availableLines" :key="g" :value="g">{{ g }}</option>
                  </select>
                </div>
                <div class="col-12 col-md-12 col-xl-3 d-flex align-items-end">
                  <button class="btn btn-primary btn-sm w-100 fw-bold py-2 shadow-sm border-0" @click="fetchReport" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-funnel-fill me-2"></i> Get Monthly Data
                  </button>
                </div>

                <!-- Sub-Section: Range Selectors (Persis Daily) -->
                <div class="col-12 mt-2 pt-3 border-top">
                  <div class="row g-3">
                    <div class="col-12 col-md-6">
                      <label class="label-filter-main">Range Performance (%)</label>
                      <div class="input-group input-group-sm">
                        <select v-model="filter.rateFrom" class="form-select shadow-sm">
                          <option :value="0">Dari 0%</option>
                          <option v-for="r in rateOptions" :key="'rf'+r" :value="r">{{ r }}%</option>
                          <option :value="101">> 100%</option>
                        </select>
                        <span class="input-group-text bg-light border-0 px-3 fw-bold small">Ke</span>
                        <select v-model="filter.rateTo" class="form-select shadow-sm">
                          <option v-for="r in rateOptions" :key="'rt'+r" :value="r">{{ r }}%</option>
                          <option :value="999999">> 100%</option>
                        </select>
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <label class="label-filter-main">Range Masa Kerja ({{ isLinking ? 'Bulan' : 'Minggu' }})</label>
                      <div class="input-group input-group-sm">
                        <select v-model="filter.masaFrom" class="form-select shadow-sm">
                          <option :value="0">Dari 0</option>
                          <option v-for="m in masaOptions" :key="'mf'+m" :value="m">{{ m }}</option>
                          <!-- <option :value="9">> {{ isLinking ? '8' : '20' }}</option> -->
                           <option :value="isLinking ? 9 : 21">> {{ isLinking ? '8' : '20' }}</option>
                        </select>
                        <span class="input-group-text bg-light border-0 px-3 fw-bold small">Ke</span>
                        <select v-model="filter.masaTo" class="form-select shadow-sm">
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

          <!-- Table Section with MultiSelectFilter -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-5" v-if="finalFilteredData.length > 0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead>
                  <tr class="bg-dark text-white">
                    <th class="ps-4 text-center" style="width: 50px">#</th>
                    <th v-if="visibleColumns.nik">
                      <div class="d-flex flex-column gap-1">
                        <span class="th-label">NIK KP</span>
                        <MultiSelectFilter v-model="columnFilters.nik" :options="uniqueOptions.nik" title="NIK" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.nama">
                      <div class="d-flex flex-column gap-1">
                        <span class="th-label text-start">NAMA OPERATOR</span>
                        <MultiSelectFilter v-model="columnFilters.nama" :options="uniqueOptions.nama" title="Nama" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.masa">
                      <div class="d-flex flex-column gap-1 align-items-center">
                        <span class="th-label">MASA KERJA</span>
                        <MultiSelectFilter v-model="columnFilters.masa" :options="uniqueOptions.masa" title="Masa" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.line">
                      <div class="d-flex flex-column gap-1 align-items-center">
                        <span class="th-label">LINE</span>
                        <MultiSelectFilter v-model="columnFilters.line" :options="uniqueOptions.line" title="Line" />
                      </div>
                    </th>
                    <th v-if="visibleColumns.rate">
                      <div class="d-flex flex-column gap-1 align-items-center">
                        <span class="th-label">AVG RATE (%)</span>
                        <MultiSelectFilter v-model="columnFilters.rate" :options="uniqueOptions.rate" title="Rate" suffix="%" />
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
                      <span :class="['fw-bold', item.realRate < 50 ? 'text-danger' : 'text-primary']">{{ Math.round(item.realRate) }}%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="!loading" class="text-center py-5">
            <i class="bi bi-clipboard-x fs-1 text-muted opacity-50"></i>
            <h5 class="mt-3 fw-bold text-muted">Data bulanan tidak ditemukan</h5>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

// --- COMPONENT: MultiSelectFilter (Checkbox di Header - Identik Daily) ---
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
const user = ref({});
const sidebarOpen = ref(false);
const loading = ref(false);
const rawData = ref([]);
const availableLines = ref([]);

const filter = ref({ 
  sBeginDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substr(0, 10),
  sEndDate: new Date().toISOString().substr(0, 10), 
  deptId: "", 
  line: "ALL",
  rateFrom: 0, rateTo: 999999,
  masaFrom: 0, masaTo: 999999
});

const columnFilters = ref({ nik: [], nama: [], masa: [], line: [], rate: [] });
const visibleColumns = ref({ nik: true, nama: true, masa: true, line: true, rate: true });

const departments = [
  { id: 10161, name: "LINKING TLS" }, {id: 10182, name: "CBS"}, { id: 10221, name: "SOOMSONTEX" }, {id:10114, name:"SEWING"}, {id:10115, name:"STEAM"},
  { id: 10264, name: "SEWING LO" }, {id:10181, name:"LINKING OBRAS"}, { id: 10265, name: "QC LAMPU" }, { id: 10266, name: "SULAM" }, { id: 10125, name: "QC KNITT" }, { id: 10251, name: "OBRAS"}
];

const isLinking = computed(() => filter.value.deptId == 10161);
const rateOptions = computed(() => Array.from({ length: 101 }, (_, i) => i));
const masaOptions = computed(() => { const limit = isLinking.value ? 8 : 20; return Array.from({ length: limit + 1 }, (_, i) => i); });

const formatMasaKerjaLabel = (item) => {
    // Karena API kirim xJoinMonth dan xJoinWeek, kita pakai itu saja
    if (isLinking.value) {
        return `${item.xJoinMonth || 0} Bulan`;
    } else {
        return `${item.xJoinWeek || 0} Minggu`;
    }
};
const handleDeptChange = () => {
    filter.value.masaFrom = 0; filter.value.masaTo = 999999;
    rawData.value = []; resetColumnFilters();
};

const fetchReport = async () => {
  if (!filter.value.deptId) return Swal.fire({ icon: 'warning', text: 'Pilih Departemen.' });
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/report-operator/report-operatorunder50persenpermonth`, { 
      params: { 
       sBeginDate: filter.value.sBeginDate, 
        sEndDate: filter.value.sEndDate, 
        deptId: filter.value.deptId,
        line: filter.value.line // Tambahkan line juga jika perlu
      } 
    });
    rawData.value = res.data.data || [];
    availableLines.value = [...new Set(rawData.value.map(item => (item.group || "").trim().replace(/\s?\d+$/, '').trim()))].filter(Boolean).sort();
    resetColumnFilters();
  } catch (e) {
    Swal.fire({ icon: 'error', text: 'Gagal ambil data bulanan.' });
  } finally {
    loading.value = false;
  }
};

// --- LOGIKA FILTER DOUBLE LAYER (Persis Daily) ---
const finalFilteredData = computed(() => {
  return rawData.value.filter(item => {
    // Filter Line
    const lineMaster = (item.group || "").trim().replace(/\s?\d+$/, '').trim();
    const matchLineMaster = filter.value.line === "ALL" || lineMaster === filter.value.line;
    
    // Filter Rate
    const rateVal = Math.round(item.realRate || 0);
    const matchRateRange = rateVal >= filter.value.rateFrom && rateVal <= filter.value.rateTo;

    // Filter Masa Kerja (Gunakan data langsung dari API)
    const masaVal = isLinking.value ? (item.xJoinMonth || 0) : (item.xJoinWeek || 0);
    const matchMasaRange = masaVal >= filter.value.masaFrom && masaVal <= filter.value.masaTo;

    // Filter Checkbox Kolom
    const labelMasa = formatMasaKerjaLabel(item);
    const matchNik = !columnFilters.value.nik.length || columnFilters.value.nik.includes(item.emplCode);
    const matchNama = !columnFilters.value.nama.length || columnFilters.value.nama.includes(item.emplName);
    const matchMasaCol = !columnFilters.value.masa.length || columnFilters.value.masa.includes(labelMasa);
    const matchLineCol = !columnFilters.value.line.length || columnFilters.value.line.includes(item.group);
    const matchRateCol = !columnFilters.value.rate.length || columnFilters.value.rate.includes(rateVal);

    return matchLineMaster && matchRateRange && matchMasaRange && matchNik && matchNama && matchMasaCol && matchLineCol && matchRateCol;
  });
});

const uniqueOptions = computed(() => {
  const data = rawData.value.filter(item => {
    const lineMaster = (item.group || "").trim().replace(/\s?\d+$/, '').trim();
    const rateVal = Math.round(item.realRate || 0);
    return (filter.value.line === "ALL" || lineMaster === filter.value.line) &&
           (rateVal >= filter.value.rateFrom && rateVal <= filter.value.rateTo);
  });
  return {
    nik: [...new Set(data.map(i => i.emplCode))].sort(),
    nama: [...new Set(data.map(i => i.emplName))].sort(),
    masa: [...new Set(data.map(i => formatMasaKerjaLabel(i)))].sort(),
    line: [...new Set(data.map(i => i.group))].sort(),
    rate: [...new Set(data.map(i => Math.round(i.realRate)))].sort((a,b) => a-b)
  };
});

const hasActiveFilters = computed(() => filter.value.line !== "ALL" || Object.values(columnFilters.value).some(v => v.length > 0) || filter.value.rateFrom > 0 || filter.value.rateTo < 999999);

const resetColumnFilters = () => columnFilters.value = { nik: [], nama: [], masa: [], line: [], rate: [] };
const resetAllFilters = () => {
  filter.value.line = "ALL"; filter.value.rateFrom = 0; filter.value.rateTo = 999999;
  filter.value.masaFrom = 0; filter.value.masaTo = 999999; resetColumnFilters();
};

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('MonthlyPerformance');
  worksheet.addRow(['NO', 'NIK', 'NAMA', 'MASA KERJA', 'LINE', 'AVG RATE (%)']);
  finalFilteredData.value.forEach((item, index) => {
    worksheet.addRow([index+1, item.emplCode, item.emplName, formatMasaKerjaLabel(item), item.group, Math.round(item.realRate)]);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Monthly_Performance_Export.xlsx`);
};

const exportToPDF = () => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const deptName = departments.find(d => d.id === filter.value.deptId)?.name || "";
  doc.setFontSize(14);
  doc.text(`MONTHLY OPERATOR PERFORMANCE (${deptName})`, 14, 15);
  doc.setFontSize(9);
  doc.text(`Period: ${filter.value.sBeginDate} to ${filter.value.sEndDate}`, 14, 22);

  autoTable(doc, {
    head: [["NO", "NIK", "NAMA OPERATOR", "MASA KERJA", "LINE", "AVG RATE (%)"]],
    body: finalFilteredData.value.map((item, index) => [
      index + 1, item.emplCode, item.emplName.toUpperCase(), formatMasaKerjaLabel(item), item.group, `${Math.round(item.realRate)}%`
    ]),
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], halign: 'center' },
    columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 3: { halign: 'center' }, 5: { halign: 'center' } }
  });
  doc.save(`Monthly_Performance_${deptName}.pdf`);
};

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => { localStorage.clear(); window.location.href = "/login"; };
onMounted(() => { if (localStorage.getItem("user")) user.value = JSON.parse(localStorage.getItem("user")); });
</script>

<style scoped>
.bg-soft-gray { background-color: #f8fafc; }
.main-content { transition: all 0.35s ease; }
.content-shifted { margin-left: 250px; }
.text-gradient { background: linear-gradient(90deg, #1e293b, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.glass-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; }
.label-filter-main { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; display: block; }
.custom-table thead th { font-size: 0.7rem; vertical-align: top; padding: 12px 8px; background-color: #1e293b !important; color: #f8fafc !important; }
.th-label { display: block; margin-bottom: 6px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.text-indigo { color: #4f46e5; }
.badge-soft-primary { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; font-size: 0.7rem; }

@media (max-width: 991px) { .content-shifted { margin-left: 0; } }
</style>