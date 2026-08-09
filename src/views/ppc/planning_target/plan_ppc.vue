<template>
  <div class="d-flex flex-column min-vh-100 bg-light mt-3">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-5 transition-all" :style="{ marginLeft: sidebarOpen ? '16rem' : '0' }">
        
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="h3 fw-bold text-dark mb-0">Planning PPC Target Finishing</h2>
            <p class="text-muted small">Kelola dan pantau target produksi harian</p>
          </div>
          <div class="d-flex gap-2">
            <a href="/update_plan_ppc" class="btn btn-outline-primary px-4 rounded-pill">Update Qty Plan</a>
            <button class="btn btn-primary px-4 rounded-pill shadow-sm" @click="handleSync" :disabled="syncLoading">
              <span v-if="syncLoading" class="spinner-border spinner-border-sm me-2"></span>
             <i class="bi bi-arrow-repeat"></i> {{ syncLoading ? 'Sinkronisasi...' : 'Sinkronisasi 30 Day' }}
            </button>
          </div>
        </div>

        <div class="card border-0 shadow-sm mb-4 rounded-3">
          <div class="card-body p-4">
            <div class="row align-items-end g-3">
              <div class="col-md-3">
                <label class="form-label text-muted small fw-bold text-uppercase">Tgl Mulai</label>
                <input type="date" v-model="filters.startDate" class="form-control bg-light border-0" @change="fetchData" />
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small fw-bold text-uppercase">Tgl Selesai</label>
                <input type="date" v-model="filters.endDate" class="form-control bg-light border-0" @change="fetchData" />
              </div>
              <div class="col-md-3">
                <button class="btn btn-success px-4 rounded-pill shadow-sm" @click="exportToExcel">
                  <i class="bi bi-file-earmark-excel"></i> Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
          <div class="table-container">
<table class="table table-bordered align-middle">
  <thead class="table-light sticky-header">
    <tr>
      <th>Order Qty</th>
      <th v-for="(col, key) in {style: 'Style', gedung: 'Gedung'}" :key="key">
        <div class="dropdown">
          {{ col }}
          <i class="bi bi-funnel-fill small text-primary" data-bs-toggle="dropdown" role="button"></i>
          <div class="dropdown-menu p-2 shadow" style="min-width: 200px;">
            <input type="text" v-model="searchTerms[key]" class="form-control form-control-sm mb-2" placeholder="Cari...">
            <div style="max-height: 150px; overflow-y: auto;">
              <div v-for="opt in getUniqueOptions(key, searchTerms[key])" :key="opt" class="form-check">
                <input type="checkbox" class="form-check-input" :value="opt" v-model="selectedFilters[key]">
                <label class="form-check-label">{{ opt }}</label>
              </div>
            </div>
          </div>
        </div>
      </th>
      <th>Tanggal</th>
      <th>Worker Day</th>
      <th>Dept</th>
      <th>Proses</th>
      <th>Rata-Rata Day</th>
      <th>Target Jam</th>
      <th>7 Jam Worker</th>
      <th>14 Jam Worker</th>
      <th>Team</th>
    </tr>
  </thead>
 <tbody>
    <template v-for="(order, oKey) in processedTableData" :key="oKey">
  <template v-for="(dept, dKey) in order.depts" :key="dKey">
    <tr v-for="(proses, pIndex) in dept.prosesListArray" :key="proses.name">
      
      <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows">{{ order.qty }}</td>
      <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows">{{ order.style }}</td>
      <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows">{{ order.gedung }}</td>
      <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows">{{ formatDate(filters.startDate) }} - {{ formatDate(filters.endDate) }}</td>
      <td v-if="pIndex === 0 && dKey === Object.keys(order.depts)[0]" :rowspan="order.totalRows">{{ workerDays }} Day</td>
      
      <td v-if="pIndex === 0" :rowspan="dept.prosesListArray.length">{{ dept.name }}</td>
      
      <td>{{ proses.name }}</td>
      <td>{{ proses.rataRataDayVal }}</td>
      <td>{{ proses.targetJam }}</td>
      <td>{{ proses.worker7 }}</td>
      <td>{{ proses.worker14 }}</td>
      <td>{{ proses.team }}</td>
    </tr>
  </template>
</template>
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
import { ref, reactive, computed, onMounted } from "vue";
import axios from "axios";
import * as XLSX from 'xlsx';
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

const orderData = ref([]);

const filters = reactive({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
});

// State untuk fitur baru
const searchTerms = reactive({ style: '', gedung: '', dept: '', workname: '' });
const selectedFilters = reactive({ style: [], gedung: [], dept: [], workname: [] });

// Menghasilkan range tanggal
const dateRange = computed(() => {
  const dates = [];
  let start = new Date(filters.startDate);
  let end = new Date(filters.endDate);
  while (start <= end) {
    dates.push(new Date(start).toISOString().split('T')[0]);
    start.setDate(start.getDate() + 1);
  }
  return dates;
});

const calculateWorkingDays = (start, end) => {
  let count = 0;
  let cur = new Date(start);
  const stop = new Date(end);
  while (cur <= stop) {
    const day = cur.getDay();
    // 0 = Minggu (libur), 6 = Sabtu (0.5), lainnya = 1
    if (day !== 0) {
      count += (day === 6 ? 0.5 : 1);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// Di dalam script, buat fungsi pemrosesan data:
const workerDays = computed(() => calculateWorkingDays(filters.startDate, filters.endDate));

const processedTableData = computed(() => {
  const totalDays = workerDays.value;

  // 1. FILTERING: Saring data berdasarkan selectedFilters
  // Kita pastikan setiap item dicek terhadap checkbox yang dipilih
  let filteredData = planData.value.filter(item => {
    const matchStyle = selectedFilters.style.length === 0 || selectedFilters.style.includes(item.xMark);
    const matchGedung = selectedFilters.gedung.length === 0 || selectedFilters.gedung.includes(item.gedung);
    const matchDept = selectedFilters.dept.length === 0 || selectedFilters.dept.includes(item.dept);
    const matchWorkname = selectedFilters.workname.length === 0 || selectedFilters.workname.includes(item.xworkname);
    
    return matchStyle && matchGedung && matchDept && matchWorkname;
  });

  const groups = {};

  // 2. GROUPING: Proses data yang sudah difilter
  filteredData.forEach(item => {
    const orderKey = item.xMark;
    if (!groups[orderKey]) {
      groups[orderKey] = {
        qty: orderData.value.find(o => o.xMark === item.xMark)?.order_qty || 0,
        style: item.xMark,
        gedung: item.gedung,
        team: item.team,
        depts: {}
      };
    }
    
    if (!groups[orderKey].depts[item.dept]) {
      groups[orderKey].depts[item.dept] = { name: item.dept, prosesList: {} };
    }

    const processKey = item.xworkname;
    if (!groups[orderKey].depts[item.dept].prosesList[processKey]) {
      const targetPerJam = item.xTarget;
      const worker7 = Math.ceil(groups[orderKey].qty / (targetPerJam * 7 * totalDays));
      const worker14 = Math.ceil(groups[orderKey].qty / (targetPerJam * 14 * totalDays));
      
      groups[orderKey].depts[item.dept].prosesList[processKey] = {
        name: processKey,
        targetJam: targetPerJam,
        worker7: isFinite(worker7) ? worker7 : 0,
        worker14: isFinite(worker14) ? worker14 : 0,
        rataRataDayVal: Math.round(groups[orderKey].qty / totalDays),
        team: item.team
      };
    }
  });

  // 3. FORMATTING: Konversi ke Array untuk template
  const finalResult = [];
  Object.keys(groups).forEach(orderKey => {
    const orderDataObj = groups[orderKey];
    let totalRows = 0;
    Object.keys(orderDataObj.depts).forEach(deptKey => {
      const pList = Object.values(orderDataObj.depts[deptKey].prosesList);
      orderDataObj.depts[deptKey].prosesListArray = pList;
      totalRows += pList.length;
    });
    finalResult.push({ ...orderDataObj, totalRows });
  });
  
  return finalResult;
});
// Pengelompokan data
const groupedData = computed(() => {
  const groups = {};
  
  // 1. Proses Plan Data
  planData.value.forEach(item => {
    const key = `${item.xMark}-${item.gedung}-${item.dept}-${item.xworkname}`;
    if (!groups[key]) {
      groups[key] = { 
        style: item.xMark, 
        gedung: item.gedung, 
        dept: item.dept, 
        workname: item.xworkname, 
        team: item.team, 
        orderQty: 0, // Inisialisasi
        details: {} 
      };
    }
    const dateStr = new Date(item.xDateTime).toISOString().split('T')[0];
    groups[key].details[dateStr] = item;
  });

  // 2. Gabungkan dengan Order Data
  orderData.value.forEach(order => {
    // Sesuaikan kunci dengan format yang ada di groupedData (asumsi xMark adalah style)
    const key = Object.keys(groups).find(k => k.startsWith(order.xMark));
    if (key) {
      groups[key].orderQty = order.order_qty;
    }
  });
  
  return Object.values(groups);
});

// Fungsi Filter
const getUniqueOptions = (key, search) => {
  const values = [...new Set(groupedData.value.map(item => key === 'style' ? item.style : item[key]))];
  return values.filter(v => v && v.toLowerCase().includes(search.toLowerCase()));
};

const filteredData = computed(() => {
  return groupedData.value.filter(row => {
    return Object.entries(selectedFilters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      const rowVal = key === 'style' ? row.style : row[key];
      return values.includes(rowVal);
    });
  });
});

const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

const fetchData = async () => {
  dataLoading.value = true;
  try {
    // Jalankan kedua request bersamaan
    const [planRes, orderRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/planppc/view-target`, { params: filters }),
      axios.get(`${API_BASE_URL}/planppc/view-targetorder`, { params: filters })
    ]);
    
    planData.value = planRes.data;
    orderData.value = orderRes.data; // Simpan data order
  } catch (error) {
    Swal.fire('Error', 'Gagal memuat data.', 'error');
  } finally {
    dataLoading.value = false;
  }
};
const handleSync = async () => {
  const result = await Swal.fire({ title: 'Konfirmasi', text: "Sinkronkan data?", icon: 'question', showCancelButton: true, confirmButtonText: 'Ya' });
  if (result.isConfirmed) {
    syncLoading.value = true;
    try {
      await axios.post(`${API_BASE_URL}/planppc/sync-target`);
      Swal.fire('Sukses', 'Data tersinkronisasi.', 'success');
      fetchData();
    } catch (error) { Swal.fire('Error', 'Gagal sinkronisasi.', 'error'); }
    finally { syncLoading.value = false; }
  }
};

const exportToExcel = () => {
  if (!processedTableData.value || processedTableData.value.length === 0) {
    Swal.fire('Info', 'Tidak ada data untuk diexport', 'warning');
    return;
  }

  // 1. Kumpulkan seluruh daftar Dept/Proses unik yang ada dari data hasil filter
  const deptList = [];
  processedTableData.value.forEach(order => {
    Object.keys(order.depts).forEach(dKey => {
      order.depts[dKey].prosesListArray.forEach(p => {
        if (!deptList.find(item => item.name === p.name)) {
          deptList.push({ name: p.name, deptKey: dKey });
        }
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const ws_data = [];
  const merges = [];

  // Baris 0: Judul Laporan
  ws_data.push([`Target Planning Finishing (${formatDate(filters.startDate)} - ${formatDate(filters.endDate)})`]);
  ws_data.push([]); // Baris 1: Kosong

  // Baris 2: Gedung (jika ada)
  const listGedung = [...new Set(processedTableData.value.map(item => item.gedung))].join(', ');
  ws_data.push([listGedung ? `gedung ${listGedung}` : '']);
  ws_data.push([]); // Baris 3: Kosong

  // --- BARIS 4: HEADER UTAMA (ROW 1 HEADER) ---
  const headerRow1 = ['style', 'order qty', 'tanggal', 'worker day', 'qty plan'];
  
  // Tambahkan nama Dept/Proses ke samping (masing-masing memakan 3 kolom)
  deptList.forEach(dept => {
    headerRow1.push(dept.name, '', ''); // 1 nama + 2 kolom kosong untuk merge
  });
  headerRow1.push('Team');
  ws_data.push(headerRow1);

  // --- BARIS 5: SUB HEADER (ROW 2 HEADER) ---
  const headerRow2 = ['', '', '', '', ''];
  deptList.forEach(() => {
    headerRow2.push('Target Jam', '7 jam worker', '14 Jam worker');
  });
  headerRow2.push('');
  ws_data.push(headerRow2);

  // Index baris header di Excel (Baris index 4 & 5)
  const headerRow1Index = 4;
  const headerRow2Index = 5;

  // Set Merge Cells untuk Header Utama (Vertikal A5:A6, B5:B6, dst)
  merges.push({ s: { r: headerRow1Index, c: 0 }, e: { r: headerRow2Index, c: 0 } }); // style
  merges.push({ s: { r: headerRow1Index, c: 1 }, e: { r: headerRow2Index, c: 1 } }); // order qty
  merges.push({ s: { r: headerRow1Index, c: 2 }, e: { r: headerRow2Index, c: 2 } }); // tanggal
  merges.push({ s: { r: headerRow1Index, c: 3 }, e: { r: headerRow2Index, c: 3 } }); // worker day
  merges.push({ s: { r: headerRow1Index, c: 4 }, e: { r: headerRow2Index, c: 4 } }); // qty plan

  // Merge Horizontal untuk nama Dept/Proses
  let colIndex = 5;
  deptList.forEach(() => {
    merges.push({ s: { r: headerRow1Index, c: colIndex }, e: { r: headerRow1Index, c: colIndex + 2 } });
    colIndex += 3;
  });

  // Merge Vertikal untuk Kolom Team paling kanan
  merges.push({ s: { r: headerRow1Index, c: colIndex }, e: { r: headerRow2Index, c: colIndex } });

  // --- BARIS DATA ---
  processedTableData.value.forEach(order => {
    // Cari rata-rata / qty plan dari daftar proses yang ada
    let qtyPlanVal = 0;
    Object.keys(order.depts).forEach(dKey => {
      order.depts[dKey].prosesListArray.forEach(p => {
        if (p.rataRataDayVal) qtyPlanVal = p.rataRataDayVal;
      });
    });

    const rowData = [
      order.style,
      order.qty,
      `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
      `${workerDays.value} Day`,
      qtyPlanVal
    ];

    // Isi nilai Target Jam, 7 Jam Worker, dan 14 Jam Worker per Dept
    deptList.forEach(dept => {
      let foundProses = null;
      Object.keys(order.depts).forEach(dKey => {
        const p = order.depts[dKey].prosesListArray.find(item => item.name === dept.name);
        if (p) foundProses = p;
      });

      if (foundProses) {
        rowData.push(foundProses.targetJam || 0, foundProses.worker7 || 0, foundProses.worker14 || 0);
      } else {
        rowData.push('-', '-', '-');
      }
    });

    // Tambahkan Team
    rowData.push(order.team || '');
    ws_data.push(rowData);
  });

  // Buat Sheet & Atur Lebar Kolom
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  ws['!merges'] = merges;

  // Lebar kolom otomatis/proporsional
  const colWidths = [
    { wch: 15 }, // style
    { wch: 12 }, // order qty
    { wch: 22 }, // tanggal
    { wch: 12 }, // worker day
    { wch: 12 }  // qty plan
  ];
  deptList.forEach(() => {
    colWidths.push({ wch: 12 }, { wch: 14 }, { wch: 14 });
  });
  colWidths.push({ wch: 12 }); // Team
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Target Planning");
  XLSX.writeFile(wb, `Target_Planning_Finishing_${filters.startDate}_${filters.endDate}.xlsx`);
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};

onMounted(fetchData);
</script>

<style scoped>
.transition-all { transition: margin-left 0.3s ease; }
.table-container { max-height: 65vh; overflow-y: auto; overflow-x: auto; position: relative; }
.sticky-header { position: sticky; top: 0; z-index: 1020; background: #f8f9fa; box-shadow: 0 2px 2px -1px rgba(0,0,0,0.1); }
.filter-scroll { max-height: 450px; overflow-y: auto; }
.cursor-pointer { cursor: pointer; }
.dropdown-toggle::after { vertical-align: middle; }
.table-container {
  max-height: 70vh; /* Sesuaikan dengan kebutuhan */
  overflow-y: auto;
}
.sticky-header th {
  position: sticky;
  top: 0;
  background-color: #f8f9fa;
  z-index: 10;
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1); /* Efek bayangan saat sticky */
}
</style>