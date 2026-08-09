<template>
  <div class="d-flex flex-column min-vh-100 bg-canvas">
    <Header :user="user" @toggle-sidebar="toggleSidebar" />
    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />
      <main class="flex-grow-1 p-4 main-content" :style="{ marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0', marginTop: '56px' }">
        <div class="d-flex justify-content-between align-items-end mb-4 pt-3">
          <div>
            <h3 class="fw-bold text-dark-blue mb-0 text-uppercase" style="letter-spacing: 1px;">Laporan Terima TLSI</h3>
            <p class="text-muted small mb-0">Data terima dengan maksimal 5 PO aktif untuk hari ini, <br> (PO data displayed based on the current date does not apply to old or outdated previous date filters)</p>
          </div>
          <div class="d-flex gap-3 align-items-end">
            <div class="d-flex gap-2 bg-white p-2 rounded shadow-sm border border-primary-subtle">
              <div class="date-group">
                <label class="d-block x-small-text fw-bold text-muted mb-1">BEGIN DATE</label>
                <input type="date" v-model="filter.beginDate" class="form-control form-control-sm border-0 bg-light">
              </div>
              <div class="date-group border-start ps-2">
                <label class="d-block x-small-text fw-bold text-muted mb-1">END DATE</label>
                <input type="date" v-model="filter.endDate" class="form-control form-control-sm border-0 bg-light">
              </div>
              <button @click="fetchWarehouse" class="btn btn-primary btn-sm px-3 ms-2 shadow-sm" :disabled="loading">
                <i class="bi" :class="loading ? 'spinner-border spinner-border-sm' : 'bi-search'"></i>
                <span class="ms-1">{{ loading ? '' : 'Tampilkan' }}</span>
              </button>
              <a href="/warehouse" class="btn btn-dark text-white shadow-sm"><i class="bi bi-arrow-repeat me-1"></i>Reset</a>
              <button @click="exportExcel" class="btn btn-success btn-sm px-3 ms-2 shadow-sm" :disabled="loading || masterData.length === 0">
                <i class="bi bi-file-earmark-excel"></i>
                <span class="ms-1">Export Excel</span>
              </button>
            </div>

<div class="dropdown" v-if="masterData.length > 0">
  <button class="btn btn-outline-dark btn-sm dropdown-toggle shadow-sm px-3" type="button" @click="isFilterOpen = !isFilterOpen">
    <i class="bi bi-filter-square me-1"></i> Pilih IDP ({{ selectedIdps.length }})
  </button>
  
  <div class="dropdown-menu p-3 shadow-lg border-primary" :class="{ show: isFilterOpen }" 
       style="max-height: 450px; overflow-y: auto; min-width: 280px; position: absolute; z-index: 1050;">
    
    <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
      <span class="fw-bold small">Filter Style A1</span>
      <button class="btn btn-link btn-sm p-0 text-decoration-none" @click="toggleAllFilter">
        {{ selectedIdps.length === uniqueIdpOptions.length ? 'Unselect All' : 'Select All' }}
      </button>
    </div>

    <div class="input-group input-group-sm mb-3">
      <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
      <input 
        v-model="searchIdpFilter" 
        type="text" 
        class="form-control border-start-0 ps-0" 
        placeholder="Cari Style A1..."
        @click.stop
      >
      <button v-if="searchIdpFilter" class="btn btn-outline-secondary border-start-0" @click.stop="searchIdpFilter = ''">
        <i class="bi bi-x"></i>
      </button>
    </div>
    
    <div class="filter-scroll-area" style="max-height: 250px; overflow-y: auto;">
      <div v-if="filteredIdpOptions.length === 0" class="text-center text-muted small py-2">
        IDP tidak ditemukan...
      </div>
      <div v-for="opt in filteredIdpOptions" :key="opt" class="form-check mb-1">
        <input class="form-check-input" type="checkbox" :id="'check-'+opt" :value="opt" v-model="selectedIdps">
        <label class="form-check-label small w-100" :for="'check-'+opt" style="cursor: pointer;">
          {{ opt }}
        </label>
      </div>
    </div>
  </div>
</div>
            <div v-if="masterData.length > 0" class="search-container shadow-sm border border-black">
              <i class="bi bi-search ms-2 text-muted"></i>
              <input v-model="searchQuery" type="text" class="search-input" placeholder="Cari Style A1 & A2 ....." />
            </div>
          </div>
        </div>

        <div v-if="loading" class="text-center p-5 mt-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3 text-muted fw-bold">Memproses Data...</p>
        </div>

        <div v-else-if="displayData.length === 0" class="text-center p-5 mt-5 border rounded-4 bg-white shadow-sm mx-auto" style="max-width: 520px;">
          <i class="bi bi-info-circle text-warning fs-1 mb-3 d-block"></i> 
          <h4 class="fw-bold text-dark mb-3">Petunjuk Penggunaan</h4>
          <ol class="text-start text-secondary fs-6 px-3">
            <li class="mb-2">Pilih <strong>Begin Date</strong> dan <strong>End Date</strong> sesuai periode yang diinginkan.</li>
            <li class="mb-2">Klik tombol <strong>Tampilkan</strong> untuk memunculkan data laporan.</li>
            <li class="mb-2">Gunakan kolom <strong>Pencarian</strong> untuk mencari style <strong>A1 dan A2</strong> tertentu.</li>
            <li>Klik <strong>Export Excel</strong> untuk mencetak atau menyimpan laporan.</li>
          </ol>
        </div>

        <div v-else v-for="(m, i) in displayData" :key="m.Idp_PO" class="excel-card mb-5 shadow-sm bg-white">
          <div class="table-responsive">
            <table class="table table-bordered excel-style-table mb-0">
              <thead class="bg-light text-center">
                <tr>
                  <th rowspan="2" class="align-middle bg-info-subtle" width="120">A1</th>
                  <th rowspan="2" class="align-middle bg-info-subtle" width="120">A2</th>
                  <th rowspan="2" class="align-middle bg-info-subtle" width="100">Total Qty + <br> Toleransi</th>
                  <th rowspan="2" class="align-middle bg-info-subtle" width="100">Terima</th>
                  <th rowspan="2" class="align-middle" width="50">PO</th>
                  <th rowspan="2" class="align-middle" width="100">Delivery Exp</th>
                  <th rowspan="2" class="align-middle text-end" width="80">Qty</th>
                  <th rowspan="2" class="align-middle" width="100">Planning Date</th>
                  <th :colspan="filteredMonths.length" class="bg-dark text-white py-1">
                    KEBUTUHAN PERBULAN ({{ yearHeaderLabel }})
                  </th>
                  <th rowspan="2" class="align-middle bg-light" width="100">Panel</th>
                  <th rowspan="2" class="align-middle bg-light" width="100">CBS Maker</th>
                </tr>
                <tr class="sub-thead">
                  <th v-for="month in filteredMonths" :key="month.idx + '-' + month.year" class="small-th">
                    {{ month.name }}
                  </th>
                </tr>
              </thead>
              
              <tbody>
                <tr v-for="(e, idx) in getActiveRows(m.Idp_PO)" :key="'ship-'+idx">
                  <template v-if="idx === 0">
                    <td :rowspan="getActiveRows(m.Idp_PO).length + 3" class="align-middle fw-bold text-center">{{ m.Idp_PO }}</td>
                    <td :rowspan="getActiveRows(m.Idp_PO).length + 3" class="align-middle fw-bold text-center">{{ m.Idp_Mark }}</td>
                    <td :rowspan="getActiveRows(m.Idp_PO).length + 3" class="align-middle fw-bold text-center text-dark">{{ formatNumber(m.total_qty) }}</td>
                    <td :rowspan="getActiveRows(m.Idp_PO).length + 3" class="align-middle fw-bold text-center text-dark">{{ formatNumber(m.qty_akumulasi) }}</td>
                  </template>

                  <td class="text-center bg-light fw-bold text-muted">{{ getOriginalIndex(m.Idp_PO, e) }}</td>
                  
                  <td class="text-nowrap text-center fw-bold">{{ formatDate(e["Ship Date"]) }}</td>
                  <td class="text-end fw-bold text-dark">{{ formatNumber(e["Order Qty"] || 0) }}</td>
                  <td class="text-muted text-center small italic">{{ calculatePlanningDate(e["Ship Date"]) }}</td>

                  <template v-if="idx === 0">
                    <td v-for="month in filteredMonths" :key="'m-'+month.idx+'-'+month.year" :rowspan="getActiveRows(m.Idp_PO).length" class="p-0 align-middle">
                      <div class="month-split h-100">
                        <div class="val-plan border-bottom text-end px-1 x-small-text py-2">
                          {{ getActiveMonthlyQty(m.Idp_PO, month.idx, month.year) }}
                        </div>
                        <div class="val-diff text-end px-1 fw-bold py-2" :class="getDiffClass(m.Idp_PO, month.idx, month.year, m.qty_akumulasi)">
                          {{ getActiveMonthlyDiff(m.Idp_PO, month.idx, month.year, m.qty_akumulasi) }}
                        </div>
                      </div>
                    </td>
                    <td :rowspan="getActiveRows(m.Idp_PO).length" class="align-middle text-center bg-white fw-bold">
                      {{ getAccQty(m.Idp_PO, 'panel') }}
                    </td>
                    <td :rowspan="getActiveRows(m.Idp_PO).length" class="align-middle text-center bg-white fw-bold">
                      {{ getAccQty(m.Idp_PO, 'cbs maker') }}
                    </td>
                  </template>
                </tr>

                <tr class="bg-light text-center fw-bold x-small-text">
                  <td colspan="4" class="bg-white"></td> 
                  <td colspan="7" class="py-1 bg-dark text-white text-uppercase" style="letter-spacing: 2px;">ACC</td>
                  <td colspan="2" class="py-1 bg-dark text-white text-uppercase" style="letter-spacing: 2px;">Benang</td>
                </tr>
                <tr class="bg-white text-center fw-bold x-small-text">
                  <td colspan="4" class="bg-white border-0"></td> 
                  <td class="border bg-light-subtle">Kerah</td>
                  <td class="border bg-light-subtle">Plaket</td>
                  <td class="border bg-light-subtle">Kerah+Plaket</td>
                  <td class="border bg-light-subtle">Kantong</td>
                  <td class="border bg-light-subtle">Rib Tangan</td>
                  <td class="border bg-light-subtle">Rib Badan</td>
                  <td class="border bg-light-subtle">Ruffle</td>
                  <td class="border bg-light-subtle">Linking</td>
                  <td class="border bg-light-subtle">ppThread</td>
                </tr>
                <tr class="text-center fw-bold x-small-text bg-white">
                  <td colspan="4" class="bg-white border-0"></td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'kerah') }}</td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'plaket') }}</td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'kerah+plaket') }}</td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'kantong') }}</td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'rib tangan') }}</td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'rib badan') }}</td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'ruffle') }}</td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'linking') }}</td>
                  <td class="py-2 border text-dark">{{ getAccQty(m.Idp_PO, 'ppthread') }} kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({ name: "Admin Warehouse" });
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);
const searchQuery = ref("");
const masterData = ref([]);
const expGroup = ref({}); 
const accData = ref([]);
const filter = ref({
  beginDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
});

const monthsName = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const today = new Date(); today.setHours(0,0,0,0);

const filteredMonths = computed(() => {
  const result = [];
  const start = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    result.push({
      name: monthsName[d.getMonth()],
      idx: d.getMonth() + 1,
      year: d.getFullYear()
    });
  }
  return result;
});

const yearHeaderLabel = computed(() => {
  const firstYear = filteredMonths.value[0].year;
  const lastYear = filteredMonths.value[filteredMonths.value.length - 1].year;
  return firstYear === lastYear ? `${firstYear}` : `${firstYear} & ${lastYear}`;
});

// ... existing refs ...
const selectedIdps = ref([]); // Menyimpan idp_po yang dicentang
const isFilterOpen = ref(false); // Untuk kontrol buka tutup dropdown custom

// Ambil daftar unik Idp_PO dari masterData untuk mengisi pilihan di dropdown
const uniqueIdpOptions = computed(() => {
  const options = masterData.value.map(m => m.Idp_PO);
  return [...new Set(options)].sort();
});

const searchIdpFilter = ref(""); // State untuk input pencarian di dropdown

// Filter daftar IDP yang muncul di dropdown berdasarkan input pencarian
const filteredIdpOptions = computed(() => {
  if (!searchIdpFilter.value) return uniqueIdpOptions.value;
  const q = searchIdpFilter.value.toLowerCase();
  return uniqueIdpOptions.value.filter(opt => opt.toLowerCase().includes(q));
});

// Fungsi Toggle Select All
const toggleAllFilter = () => {
  if (selectedIdps.value.length === uniqueIdpOptions.value.length) {
    selectedIdps.value = [];
  } else {
    selectedIdps.value = [...uniqueIdpOptions.value];
  }
};

// --- DATA FETCHING ---
const fetchWarehouse = async () => {
  loading.value = true;
  selectedIdps.value = []; // Reset filter saat tarik data baru
  try {
    const params = new URLSearchParams({ beginDate: filter.value.beginDate, endDate: filter.value.endDate });
    const resW = await fetch(`${API_BASE_URL}/terima-warehouse/warehouse-gabungan?${params}`);
    const jsonW = await resW.json();
    const resA = await fetch(`${API_BASE_URL}/terima-warehouse/aksesoris?${params}`);
    const jsonA = await resA.json();
    if (jsonA.status === "success") {
    // Simpan data recordset ke accData
    accData.value = jsonA.data || []; 
     }
    if (jsonW.status === "success") {
      masterData.value = jsonW.master || [];
      processData(jsonW.exp || []);
      accData.value = Array.isArray(jsonA) ? jsonA : (jsonA.data || []);
    }
  } catch (err) { console.error(err); } finally { loading.value = false; }
};

// --- LOGIKA PERHITUNGAN ---

const getOriginalIndex = (idp_po, currentRow) => {
  const allData = expGroup.value[idp_po] || [];
  const index = allData.findIndex(item => item === currentRow);
  return index !== -1 ? index + 1 : '-';
};

const getRawMonthlyQty = (idp_po, monthIdx, year) => {
  const activeRows = getActiveRows(idp_po);
  return activeRows.reduce((sum, row) => {
    const d = parseDate(row["Ship Date"]);
    if (d && (d.getMonth() + 1) === monthIdx && d.getFullYear() === year) {
      return sum + (parseFloat(row["Order Qty"]) || 0);
    }
    return sum;
  }, 0);
};

const getActiveMonthlyQty = (idp_po, monthIdx, year) => {
  const qty = getRawMonthlyQty(idp_po, monthIdx, year);
  return qty > 0 ? formatNumber(qty) : '-';
};

const getActiveMonthlyDiff = (idp_po, monthIdx, year, akumulasi) => {
  const currentMonthQty = getRawMonthlyQty(idp_po, monthIdx, year);
  if (currentMonthQty === 0) return '-';
  
  const activeRows = getActiveRows(idp_po);
  const targetDate = new Date(year, monthIdx, 0); 

  const totalSampaiBulanIni = activeRows.reduce((sum, row) => {
    const d = parseDate(row["Ship Date"]);
    if (d && d <= targetDate) {
      return sum + (parseFloat(row["Order Qty"]) || 0);
    }
    return sum;
  }, 0);
  return formatNumber(akumulasi - totalSampaiBulanIni);
};

const getDiffClass = (idp_po, monthIdx, year, akumulasi) => {
  const diffVal = getActiveMonthlyDiff(idp_po, monthIdx, year, akumulasi);
  if (diffVal === '-') return '';
  const num = parseInt(diffVal.replace(/\./g, ''));
  return num < 0 ? 'text-danger' : 'text-success';
};

const getActiveRows = (idp_po) => {
  const allData = expGroup.value[idp_po] || [];
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 7, 1);
  return allData.filter(item => {
    const shipDate = parseDate(item["Ship Date"]);
    return shipDate && shipDate >= today && shipDate < maxDate;
  }).slice(0, 5);
};

// --- UTILS LAINNYA ---
const processData = (expData) => {
  const tempExp = {};
  [...expData].sort((a,b) => parseDate(a["Ship Date"]) - parseDate(b["Ship Date"])).forEach(e => {
    // Kueri 2: Menggunakan properti "Idp" (sebelumnya PO Number)
    const po = e["Idp"]; 
    const qty = parseFloat(e["Order Qty"]) || 0;
    if (!tempExp[po]) tempExp[po] = [];
    const exist = tempExp[po].find(x => x["Ship Date"] === e["Ship Date"]);
    if (exist) exist["Order Qty"] += qty; else tempExp[po].push({...e, "Order Qty": qty});
  });
  expGroup.value = tempExp;
};

const formatNumber = (val) => (val && val !== 0) ? new Intl.NumberFormat("id-ID").format(val) : '-';
const parseDate = (d) => {
  if(!d) return null;
  if(typeof d === 'string' && d.includes('/')) {
    const p = d.split('/'); return new Date(p[2], p[1]-1, p[0]);
  }
  return new Date(d);
};
const formatDate = (d) => {
  const date = parseDate(d);
  return (!date || isNaN(date)) ? "-" : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/\./g, '');
};
const calculatePlanningDate = (d) => {
  const date = parseDate(d);
  if(!date || isNaN(date)) return "-";
  date.setDate(date.getDate() - 7);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/\./g, '');
};

const getAccQty = (currentIdpPo, kategoriKolom) => {
  if (!accData.value.length) return '-';

  const begin = new Date(filter.value.beginDate);
  const end = new Date(filter.value.endDate);

  const filtered = accData.value.filter(d => {
    // 1. Cocokkan IDP PO (A1) dengan idp_po dari data aksesoris
    const isSamePO = String(d.idp_po) === String(currentIdpPo);

    // 2. Logika Mapping Kategori
    let isSameCat = false;
    const kategoriDb = (d.xkategori || '').toLowerCase().trim();
    const targetKategori = kategoriKolom.toLowerCase().trim();

    if (targetKategori === 'ppthread') {
      // Jika kolom yang diminta ppthread, ambil yang xkategori-nya NULL atau kosong
      isSameCat = (kategoriDb === '' || kategoriDb === null);
    } else {
      // Untuk kolom lain (kerah, plaket, cbs maker, dll), cocokkan teksnya
      isSameCat = (kategoriDb === targetKategori);
    }

    // 3. Filter berdasarkan range tanggal (opsional, jika ingin sinkron dengan filter atas)
    const accDate = new Date(d.xDate);
    const withinDate = accDate >= begin && accDate <= end;

    return isSamePO && isSameCat && withinDate;
  });

  if (!filtered.length) return '-';

  // Menjumlahkan Qty jika ada lebih dari satu baris untuk kategori yang sama
  const totalQty = filtered.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
  
  return totalQty !== 0 ? formatNumber(totalQty) : '-';
};


// Update displayData (Logic Filter Utama)
const displayData = computed(() => {
  let data = masterData.value.filter(m => getActiveRows(m.Idp_PO).length > 0);

  // Filter berdasarkan IDP yang dicentang (Jika ada yang dipilih)
  if (selectedIdps.value.length > 0) {
    data = data.filter(m => selectedIdps.value.includes(m.Idp_PO));
  }

  // Filter berdasarkan pencarian teks
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    data = data.filter(m => 
      (m.Idp_PO?.toLowerCase().includes(q)) || 
      (m.Idp_Mark?.toLowerCase().includes(q))
    );
  }
  return data;
});

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };

const exportExcel = async () => {
  if (displayData.value.length === 0) return;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Warehouse Monitoring");

  // Setting Kolom
  worksheet.columns = [
    { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, // A1, A2, Total, Terima
    { width: 8 },  { width: 15 }, { width: 12 }, { width: 15 }, // PO, Delivery, Qty, Planning
    ...filteredMonths.value.map(() => ({ width: 15 })),         // Kebutuhan Perbulan
    { width: 12 }, { width: 12 }                                // Panel, CBS
  ];

  let currentRow = 1;

  for (const m of displayData.value) {
    const activeRows = getActiveRows(m.Idp_PO);
    const shipmentCount = activeRows.length;
    
    // Jika tidak ada baris aktif, lewati untuk mencegah error merge 0 baris
    if (shipmentCount === 0) continue;

    const startTable = currentRow;
    const hRow1 = worksheet.getRow(currentRow);
    const hRow2 = worksheet.getRow(currentRow + 1);

    // Header Utama
    hRow1.getCell(1).value = "A1";
    hRow1.getCell(2).value = "A2";
    hRow1.getCell(3).value = "Total Qty + Toleransi";
    hRow1.getCell(4).value = "Terima";
    hRow1.getCell(5).value = "PO";
    hRow1.getCell(6).value = "Delivery Exp";
    hRow1.getCell(7).value = "Qty";
    hRow1.getCell(8).value = "Planning Date";

    const monthStartCol = 9;
    const monthEndCol = monthStartCol + filteredMonths.value.length - 1;
    
    hRow1.getCell(monthStartCol).value = `KEBUTUHAN PERBULAN (${yearHeaderLabel.value})`;
    
    // MENCEGAH ERROR: Pastikan koordinat merge tidak tumpang tindih
    worksheet.mergeCells(currentRow, monthStartCol, currentRow, monthEndCol);

    hRow1.getCell(monthEndCol + 1).value = "Panel";
    hRow1.getCell(monthEndCol + 2).value = "CBS Maker";

    // Sub-Header Bulan
    filteredMonths.value.forEach((fm, idx) => {
      hRow2.getCell(monthStartCol + idx).value = fm.name;
    });

    // Merge Header Vertikal (A1 sampai Planning Date, dan Panel, CBS)
    const verticalMergeCols = [1, 2, 3, 4, 5, 6, 7, 8, monthEndCol + 1, monthEndCol + 2];
    verticalMergeCols.forEach(col => {
      worksheet.mergeCells(currentRow, col, currentRow + 1, col);
    });

    // Styling Header
    [hRow1, hRow2].forEach((row) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > monthEndCol + 2) return;
        cell.font = { bold: true, size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        
        // Warna biru untuk info utama
        if (colNumber <= 4) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1F5FE' } };
        }
        // Warna gelap untuk header bulan
        if (colNumber >= monthStartCol && colNumber <= monthEndCol && row.number === startTable) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF212529' } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }
      });
    });

    currentRow += 2;
    const dataStartRow = currentRow;

    // Isi Data Baris Shipment
    activeRows.forEach((e, idx) => {
      const r = worksheet.getRow(currentRow);
      r.getCell(5).value = getOriginalIndex(m.Idp_PO, e);
      r.getCell(6).value = formatDate(e["Ship Date"]);
      r.getCell(7).value = e["Order Qty"];
      r.getCell(8).value = calculatePlanningDate(e["Ship Date"]);
      
      // Styling baris data
      [5, 6, 8].forEach(c => r.getCell(c).alignment = { horizontal: 'center' });
      r.getCell(7).alignment = { horizontal: 'right' };
      r.getCell(7).numFmt = '#,##0';
      currentRow++;
    });

    // Merge Data Utama di sebelah kiri
    [1, 2, 3, 4].forEach(col => {
      // Merge sampai ke baris ACC (shipmentCount + 3 baris tambahan)
      worksheet.mergeCells(dataStartRow, col, dataStartRow + shipmentCount + 2, col);
      const cell = worksheet.getCell(dataStartRow, col);
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      if (col === 1) cell.value = m.Idp_PO;
      if (col === 2) cell.value = m.Idp_Mark;
      if (col === 3) { cell.value = m.total_qty; cell.numFmt = '#,##0'; }
      if (col === 4) { cell.value = m.qty_akumulasi; cell.numFmt = '#,##0'; }
    });

    // Isi Kebutuhan Perbulan (Samping)
    filteredMonths.value.forEach((fm, idx) => {
      const col = monthStartCol + idx;
      worksheet.mergeCells(dataStartRow, col, dataStartRow + shipmentCount - 1, col);
      const cell = worksheet.getCell(dataStartRow, col);
      const qtyStr = getActiveMonthlyQty(m.Idp_PO, fm.idx, fm.year);
      const diffStr = getActiveMonthlyDiff(m.Idp_PO, fm.idx, fm.year, m.qty_akumulasi);
      
      if (qtyStr !== '-') {
        const isNeg = diffStr.toString().includes('-');
        cell.value = {
          richText: [
            { text: `${qtyStr}\n`, font: { size: 8, color: {argb:'FF777777'} } }, 
            { text: `${diffStr}`, font: { bold: true, color: { argb: isNeg ? 'FFFF0000' : 'FF198754' } } }
          ] 
        };
      } else {
        cell.value = "-";
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    // Isi Panel & CBS
    [monthEndCol + 1, monthEndCol + 2].forEach((col, idx) => {
      worksheet.mergeCells(dataStartRow, col, dataStartRow + shipmentCount - 1, col);
      const cell = worksheet.getCell(dataStartRow, col);
      cell.value = idx === 0 ? getAccQty(m.Idp_PO, 'panel') : getAccQty(m.Idp_PO, 'cbs maker');
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // BARIS ACC & BENANG
    const accRowIdx = dataStartRow + shipmentCount;
    
    // Header Hitam ACC
    worksheet.mergeCells(accRowIdx, 9, accRowIdx, 15);
    const cellAccHeader = worksheet.getCell(accRowIdx, 9);
    cellAccHeader.value = "ACC";
    cellAccHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF212529' } };
    cellAccHeader.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cellAccHeader.alignment = { horizontal: 'center' };

    // Header Hitam Benang
    worksheet.mergeCells(accRowIdx, 16, accRowIdx, 17);
    const cellBenangHeader = worksheet.getCell(accRowIdx, 16);
    cellBenangHeader.value = "BENANG";
    cellBenangHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF212529' } };
    cellBenangHeader.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cellBenangHeader.alignment = { horizontal: 'center' };

    // Nama Kategori & Nilai
    const accCats = ["Kerah", "Plaket", "Kerah+Plaket", "Kantong", "Rib Tangan", "Rib Badan", "Ruffle"];
    const threadCats = ["Linking", "ppThread"];

    accCats.forEach((cat, idx) => {
      const col = 9 + idx;
      worksheet.getCell(accRowIdx + 1, col).value = cat.toUpperCase();
      worksheet.getCell(accRowIdx + 2, col).value = getAccQty(m.Idp_PO, cat);
      worksheet.getCell(accRowIdx + 1, col).font = { size: 8, bold: true };
      worksheet.getCell(accRowIdx + 1, col).alignment = { horizontal: 'center' };
      worksheet.getCell(accRowIdx + 2, col).alignment = { horizontal: 'center' };
    });

    threadCats.forEach((cat, idx) => {
      const col = 16 + idx;
      worksheet.getCell(accRowIdx + 1, col).value = cat.toUpperCase();
      worksheet.getCell(accRowIdx + 2, col).value = getAccQty(m.Idp_PO, cat);
      worksheet.getCell(accRowIdx + 1, col).font = { size: 8, bold: true };
      worksheet.getCell(accRowIdx + 1, col).alignment = { horizontal: 'center' };
      worksheet.getCell(accRowIdx + 2, col).alignment = { horizontal: 'center' };
    });

    // Border untuk semua sel di tabel ini
    for (let r = startTable; r <= accRowIdx + 2; r++) {
      for (let c = 1; c <= 17; c++) {
        const cell = worksheet.getCell(r, c);
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      }
    }

    currentRow = accRowIdx + 4; // Beri jarak antar card IDP
  }

  // Download
  const d = new Date();
  const fileName = `Laporan_Terima_${d.getTime()}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
};
</script>

<style scoped>
.bg-canvas { background-color: #f4f7f6; }
.text-dark-blue { color: #2c3e50; }
.x-small-text { font-size: 9px; letter-spacing: 0.5px; }
.search-container { background: white; border-radius: 8px; display: flex; align-items: center; padding: 0 10px; width: 250px; height: 38px; }
.search-input { border: none; padding: 5px; outline: none; width: 100%; font-size: 0.85rem; }
.excel-card { border-radius: 4px; border: 1px solid #c0c0c0; overflow: hidden; margin-bottom: 2rem; }
.excel-style-table { border: 2px solid #333 !important; font-family: sans-serif; font-size: 11px; table-layout: fixed; width: 100%; }
.excel-style-table th, .excel-style-table td { border: 1px solid #888 !important; vertical-align: middle; padding: 6px 4px; }
.bg-info-subtle { background-color: #e1f5fe !important; }
.bg-light-subtle { background-color: #f8f9fa !important; }
.month-split { min-width: 65px; display: flex; flex-direction: column; height: 100%; }
.val-plan { color: #666; background-color: #fff; flex: 1; border-bottom: 1px solid #eee; }
.val-diff { background-color: #f9f9f9; flex: 1; }
.small-th { font-size: 9px !important; }
.italic { font-style: italic; }
/* Tambahkan di dalam <style scoped> */
.dropdown-menu.show {
  display: block;
  top: 100%;
  right: 0;
}

.form-check:hover {
  background-color: #f8f9fa;
  border-radius: 4px;
}

/* Agar dropdown tidak tertutup oleh tabel/card di bawahnya */
.main-content {
  position: relative;
}
</style>
