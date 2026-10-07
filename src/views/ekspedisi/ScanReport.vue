<template>
  <div class="d-flex flex-column min-vh-100 bg-light-subtle font-sans">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-4"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: '64px',
        }"
      >
        <div class="container-fluid max-w-7xl">
          <!-- Page Header -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 class="fw-bolder text-dark mb-1">Laporan Hasil Scan Ekspedisi</h3>
              <p class="text-muted small mb-0">Pantau dan kelola data scan pengiriman Anda dengan mudah.</p>
            </div>
          </div>

          <!-- Main Card -->
          <div class="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
            <div class="card-body p-4 bg-white">
              
              <!-- Top Controls (API Filters & Export) -->
              <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4 pb-4 border-bottom">
                <form @submit.prevent="getReport" class="flex-grow-1">
                  <div class="row g-3 align-items-end">
                    <div class="col-md-4 col-lg-3">
                      <label for="date-filter" class="form-label fw-semibold text-secondary small">Tanggal Data API</label>
                      <input
                        type="date"
                        id="date-filter"
                        v-model="filters.selected_date"
                        class="form-control form-control-sm rounded-3 py-2"
                      />
                    </div>
                    <div class="col-md-4 col-lg-3">
                      <label for="owner-filter" class="form-label fw-semibold text-secondary small">Owner API</label>
                      <select
                        id="owner-filter"
                        v-model="filters.xOwner"
                        class="form-select form-select-sm rounded-3 py-2"
                      >
                        <option value="">Semua Owner</option>
                        <option v-for="o in owners" :key="o.xOwner" :value="o.xOwner">
                          {{ o.xOwner }}
                        </option>
                      </select>
                    </div>
                    <div class="col-md-4 col-lg-4 d-flex gap-2">
                      <button type="submit" class="btn btn-primary rounded-3 px-4 py-2 fw-semibold">
                        <i class="bi bi-search me-2"></i>Cari
                      </button>
                      <button type="button" @click="resetFilter" class="btn btn-light border rounded-3 px-3 py-2 fw-semibold">
                        <i class="bi bi-arrow-counterclockwise"></i> Reset
                      </button>
                    </div>
                  </div>
                </form>

                <!-- Export Button -->
                <div>
                  <button 
                    @click="exportToExcel" 
                    class="btn btn-success rounded-3 px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
                    :disabled="filteredData.length === 0"
                  >
                    <i class="bi bi-file-earmark-excel-fill fs-5"></i> 
                    Export Excel
                  </button>
                </div>
              </div>

              <!-- Table Section -->
              <div class="table-responsive rounded-3 border">
                <table class="table table-hover table-borderless align-middle mb-0">
                  <thead class="table-light border-bottom">
                    <tr>
                      <!-- Header Tanggal (With Filter & Search) -->
                      <th class="py-3 px-3" style="min-width: 180px;">
                        <div class="dropdown">
                          <div class="d-flex align-items-center justify-content-between cursor-pointer user-select-none" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                            <span class="fw-semibold text-secondary">Tanggal</span>
                            <i class="bi bi-funnel-fill text-primary" v-if="headerFilters.scan_date.length > 0"></i>
                            <i class="bi bi-funnel text-muted" v-else></i>
                          </div>
                          <ul class="dropdown-menu shadow border-0 p-0" style="min-width: 240px;">
                            <div class="p-2 border-bottom bg-light rounded-top">
                              <div class="input-group input-group-sm">
                                <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                                <input type="text" class="form-control border-start-0 ps-0 shadow-none" placeholder="Cari tanggal..." v-model="headerSearch.scan_date">
                              </div>
                            </div>
                            <div class="p-2 custom-scrollbar" style="max-height: 250px; overflow-y: auto;">
                              <li v-if="filteredUniqueDates.length === 0" class="text-muted small text-center py-2">Data tidak ditemukan</li>
                              <li v-for="date in filteredUniqueDates" :key="date" class="dropdown-item px-2 py-1 rounded-2 mb-1 custom-hover">
                                <div class="form-check custom-checkbox mb-0 w-100">
                                  <input class="form-check-input" type="checkbox" :value="date" :id="'d-'+date" v-model="headerFilters.scan_date">
                                  <label class="form-check-label small w-100" :for="'d-'+date">{{ formatDate(date) }}</label>
                                </div>
                              </li>
                            </div>
                          </ul>
                        </div>
                      </th>

                      <!-- Header Owner (No Filter) -->
                      <th class="py-3 px-3 fw-semibold text-secondary">Owner</th>

                      <!-- Header Nama PC (With Filter & Search) -->
                      <th class="py-3 px-3" style="min-width: 180px;">
                        <div class="dropdown">
                          <div class="d-flex align-items-center justify-content-between cursor-pointer user-select-none" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                            <span class="fw-semibold text-secondary">Nama PC</span>
                            <i class="bi bi-funnel-fill text-primary" v-if="headerFilters.xPC.length > 0"></i>
                            <i class="bi bi-funnel text-muted" v-else></i>
                          </div>
                          <ul class="dropdown-menu shadow border-0 p-0" style="min-width: 240px;">
                            <div class="p-2 border-bottom bg-light rounded-top">
                              <div class="input-group input-group-sm">
                                <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                                <input type="text" class="form-control border-start-0 ps-0 shadow-none" placeholder="Cari PC..." v-model="headerSearch.xPC">
                              </div>
                            </div>
                            <div class="p-2 custom-scrollbar" style="max-height: 250px; overflow-y: auto;">
                              <li v-if="filteredUniquePCs.length === 0" class="text-muted small text-center py-2">Data tidak ditemukan</li>
                              <li v-for="pc in filteredUniquePCs" :key="pc" class="dropdown-item px-2 py-1 rounded-2 mb-1 custom-hover">
                                <div class="form-check custom-checkbox mb-0 w-100">
                                  <input class="form-check-input" type="checkbox" :value="pc" :id="'pc-'+pc" v-model="headerFilters.xPC">
                                  <label class="form-check-label small w-100" :for="'pc-'+pc">{{ pc }}</label>
                                </div>
                              </li>
                            </div>
                          </ul>
                        </div>
                      </th>

                      <!-- Header Total Qty (With Filter & Search) -->
                      <th class="py-3 px-3" style="min-width: 150px;">
                        <div class="dropdown">
                          <div class="d-flex align-items-center justify-content-between cursor-pointer user-select-none" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                            <span class="fw-semibold text-secondary">Total Qty</span>
                            <i class="bi bi-funnel-fill text-primary" v-if="headerFilters.total_qty.length > 0"></i>
                            <i class="bi bi-funnel text-muted" v-else></i>
                          </div>
                          <ul class="dropdown-menu shadow border-0 p-0" style="min-width: 220px;">
                            <div class="p-2 border-bottom bg-light rounded-top">
                              <div class="input-group input-group-sm">
                                <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                                <input type="text" class="form-control border-start-0 ps-0 shadow-none" placeholder="Cari Qty..." v-model="headerSearch.total_qty">
                              </div>
                            </div>
                            <div class="p-2 custom-scrollbar" style="max-height: 250px; overflow-y: auto;">
                              <li v-if="filteredUniqueQtys.length === 0" class="text-muted small text-center py-2">Data tidak ditemukan</li>
                              <li v-for="qty in filteredUniqueQtys" :key="qty" class="dropdown-item px-2 py-1 rounded-2 mb-1 custom-hover">
                                <div class="form-check custom-checkbox mb-0 w-100">
                                  <input class="form-check-input" type="checkbox" :value="qty" :id="'qty-'+qty" v-model="headerFilters.total_qty">
                                  <label class="form-check-label small w-100" :for="'qty-'+qty">{{ qty }}</label>
                                </div>
                              </li>
                            </div>
                          </ul>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  
                  <!-- Table Body -->
                  <tbody>
                    <tr v-if="filteredData.length === 0">
                      <td colspan="4" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2 text-light-subtle"></i>
                        Tidak ada data ditemukan.
                      </td>
                    </tr>
                    <tr v-for="(item, index) in filteredData" :key="index" class="border-bottom">
                      <td class="px-3">{{ formatDate(item.scan_date) }}</td>
                      <td class="px-3">
                        <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill">
                          {{ item.xOwner }}
                        </span>
                      </td>
                      <td class="px-3 fw-medium">{{ item.xPC }}</td>
                      <td class="px-3">
                        <span class="fw-bold">{{ item.total_qty }}</span>
                      </td>
                    </tr>
                  </tbody>
                  
                  <!-- Table Footer -->
                  <tfoot class="bg-light">
                    <tr>
                      <th colspan="3" class="text-end py-3 px-4 fw-bolder text-secondary">GRAND TOTAL:</th>
                      <th class="py-3 px-3 fs-5 fw-bolder text-primary">{{ totalQty }}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <!-- Info text for active filters -->
              <div class="mt-3 text-muted small" v-if="filteredData.length !== data.length">
                Menampilkan <span class="fw-bold text-dark">{{ filteredData.length }}</span> dari <span class="fw-bold text-dark">{{ data.length }}</span> total data (Filter Aktif).
                <a href="#" @click.prevent="clearHeaderFilters" class="text-decoration-none text-danger ms-2 fw-semibold"><i class="bi bi-x-circle me-1"></i>Reset Filter Header</a>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import * as XLSX from "xlsx-js-style";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";
import "bootstrap-icons/font/bootstrap-icons.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// State API Request
const filters = ref({
  selected_date: "",
  xOwner: "",
});

const data = ref([]);
const owners = ref([]);
const pcs = ref([]);

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

// State untuk Filter Header Tabel Multiple Checkbox
const headerFilters = ref({
  scan_date: [],
  xPC: [],
  total_qty: [],
});

// State untuk fitur Pencarian di dalam Checkbox Dropdown
const headerSearch = ref({
  scan_date: "",
  xPC: "",
  total_qty: "",
});

// Helper Format Date
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

// --- COMPUTED PROPERTIES UNTUK FILTER DATA UTAMA ---
const filteredData = computed(() => {
  return data.value.filter((row) => {
    const matchDate = headerFilters.value.scan_date.length === 0 || headerFilters.value.scan_date.includes(row.scan_date);
    const matchPC = headerFilters.value.xPC.length === 0 || headerFilters.value.xPC.includes(row.xPC);
    const matchQty = headerFilters.value.total_qty.length === 0 || headerFilters.value.total_qty.includes(row.total_qty);
    return matchDate && matchPC && matchQty;
  });
});

const totalQty = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + Number(row.total_qty || 0), 0);
});

// --- PENGAMBILAN NILAI UNIK (BESERTA FUNGSI PENCARIAN DROPDOWN) ---
const uniqueDates = computed(() => [...new Set(data.value.map(item => item.scan_date))].sort());
const uniquePCs = computed(() => [...new Set(data.value.map(item => item.xPC))].sort());
const uniqueQtys = computed(() => [...new Set(data.value.map(item => item.total_qty))].sort((a,b) => a - b));

const filteredUniqueDates = computed(() => {
  const query = headerSearch.value.scan_date.toLowerCase();
  return uniqueDates.value.filter(date => formatDate(date).toLowerCase().includes(query));
});

const filteredUniquePCs = computed(() => {
  const query = headerSearch.value.xPC.toLowerCase();
  return uniquePCs.value.filter(pc => pc.toLowerCase().includes(query));
});

const filteredUniqueQtys = computed(() => {
  const query = headerSearch.value.total_qty.toString().toLowerCase();
  return uniqueQtys.value.filter(qty => qty.toString().toLowerCase().includes(query));
});


// --- FUNGSI EXPORT EXCEL DENGAN STYLING DAN JUDUL ---
const exportToExcel = () => {
  if (filteredData.value.length === 0) return;

  // Siapkan Data Sheet dengan Judul
  const wsData = [
    ["LAPORAN HASIL SCAN EKSPEDISI"], // Baris 1: Judul Laporan
    [""], // Baris 2: Kosong (Spasi)
    ["Tanggal", "Owner", "Nama PC", "Total Qty"] // Baris 3: Header Tabel
  ];

  filteredData.value.forEach((row) => {
    wsData.push([
      formatDate(row.scan_date),
      row.xOwner,
      row.xPC,
      Number(row.total_qty)
    ]);
  });

  // Tambahkan Total di akhir baris
  wsData.push(["", "", "GRAND TOTAL:", totalQty.value]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge cell untuk Judul (Baris 1 dari Kolom A sampai D)
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
  ];

  // Styling
  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: "1F2937" } }, // Ukuran besar & warna gelap
    alignment: { horizontal: "center", vertical: "center" }
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
    fill: { fgColor: { rgb: "2563EB" } }, // Warna Biru Modern
    alignment: { horizontal: "center", vertical: "center" },
    border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
  };

  const bodyStyle = {
    alignment: { vertical: "center" },
    border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
  };

  // Terapkan style ke cell
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[cellRef]) continue;

      if (R === 0) {
        ws[cellRef].s = titleStyle; // Style khusus baris Judul
      } else if (R === 2) {
        ws[cellRef].s = headerStyle; // Style khusus baris Header Kolom
      } else if (R > 2) {
        ws[cellRef].s = bodyStyle; // Style untuk data biasa
        
        // Bold untuk baris Grand Total
        if (R === range.e.r && C >= 2) { 
           ws[cellRef].s = { ...bodyStyle, font: { bold: true }, fill: { fgColor: { rgb: "F3F4F6" } } };
        }
      }
    }
  }

  // Atur lebar kolom Excel
  ws["!cols"] = [{ wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
  
  // Baris judul (Row 1) sedikit dilebarkan tingginya
  ws["!rows"] = [{ hpt: 30 }];

  // Buat dan Download Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Scan");
  XLSX.writeFile(wb, `Laporan_Scan_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// --- FUNGSI LAINNYA ---
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

const getReport = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/ekspedisi/report`, {
      params: filters.value,
    });
    data.value = res.data.data || [];
    clearHeaderFilters();
  } catch (err) {
    console.error("Error getReport:", err);
  }
};

const resetFilter = () => {
  filters.value = { selected_date: "", xOwner: "" };
  data.value = [];
  clearHeaderFilters();
};

const clearHeaderFilters = () => {
  headerFilters.value = { scan_date: [], xPC: [], total_qty: [] };
  headerSearch.value = { scan_date: "", xPC: "", total_qty: "" };
};

onMounted(() => {
  owners.value = [{ xOwner: "PTLS1" }, { xOwner: "PTLS2" }, { xOwner: "PTLS3" }, { xOwner: "PTLS4" }];
  pcs.value = [{ xPC: "PC01" }, { xPC: "PC02" }];

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<style scoped>
.font-sans {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.cursor-pointer {
  cursor: pointer;
}
.dropdown-menu {
  border-radius: 0.75rem;
}

/* Custom Scrollbar untuk Dropdown Checkbox */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #ced4da;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #adb5bd;
}

.table > :not(caption) > * > * {
  padding: 1rem 0.75rem;
}

/* Checkbox Label Clickable & Styling */
.custom-checkbox .form-check-input {
  cursor: pointer;
}
.custom-checkbox .form-check-label {
  cursor: pointer;
  margin-left: 0.5rem;
}

/* Hover effect untuk item di dalam list filter dropdown */
.custom-hover:hover {
  background-color: #f8f9fa;
}
.dropdown-item:active {
  background-color: transparent;
  color: inherit;
}
</style>