<template>
  <div class="d-flex flex-column min-vh-100 bg-light text-dark mt-5" @click="closeDropdown">
    <!-- Header Component -->
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <!-- Sidebar Component -->
      <Sidebar :isOpen="sidebarOpen" class="sidebar-component" />

      <!-- Main Content Area -->
      <main :class="['flex-grow-1 p-3 p-md-4 main-content transition-all', sidebarOpen ? 'sidebar-open-margin' : 'sidebar-closed-margin']">
        <!-- Title & Navigation Bar -->
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
          <div>
            <h4 class="fw-bold text-dark mb-1">Riwayat Tanggal Input Qty (Per xMark)</h4>
            <p class="text-muted small mb-0">
              Cek keberadaan data inputan qty (kecuali 0) berdasarkan xMark dan tanggal input
            </p>
          </div>

          <!-- Tombol Ke Inputan Massal -->
          <a
            href="/inputan-massal"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-success d-inline-flex align-items-center gap-2 shadow-sm"
          >
            <i class="bi bi-box-arrow-up-right"></i>
            Ke Inputan Massal
          </a>
        </div>

        <!-- Filter Card -->
        <div class="card border-0 shadow-sm mb-4 rounded-4">
          <div class="card-body p-4">
            <form @submit.prevent="fetchData" class="row g-3 align-items-end">
              <div class="col-md-9 col-12">
                <label for="xmark-search" class="form-label fw-semibold text-secondary small">
                  FILTER KODE XMARK
                </label>
                <input
                  id="xmark-search"
                  v-model="searchXMark"
                  type="text"
                  placeholder="Masukkan xMark (contoh: PO12345 atau MARK-ABC)"
                  class="form-control form-control-lg fs-6"
                  required
                />
              </div>

              <div class="col-md-3 col-12 d-flex gap-2">
                <button
                  type="submit"
                  :disabled="loading"
                  class="btn btn-primary btn-lg fs-6 flex-fill d-flex align-items-center justify-content-center gap-2 shadow-sm fw-bold"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
                  <span>Cari xMark</span>
                </button>

                <button
                  type="button"
                  @click="resetFilter"
                  class="btn btn-outline-secondary btn-lg fs-6 fw-bold"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- State 1: Loading -->
        <div v-if="loading" class="card border-0 shadow-sm text-center p-5 rounded-4">
          <div class="spinner-border text-primary mx-auto mb-3" role="status"></div>
          <p class="text-muted small mb-0">Memuat data xMark...</p>
        </div>

        <!-- State 2: Belum Cari / Initial State -->
        <div v-else-if="!searched" class="card border-0 shadow-sm text-center p-5 rounded-4">
          <div class="mb-3">
            <span class="badge rounded-circle bg-primary-subtle text-primary p-3 fs-3">🔍</span>
          </div>
          <h5 class="fw-bold text-dark mb-1">Cari Berdasarkan xMark</h5>
          <p class="text-muted small mx-auto mb-0" style="max-width: 480px;">
            Ketikkan kode xMark pada kolom filter di atas untuk melihat daftar tanggal dan departemen mana saja yang memiliki rincian inputan qty.
          </p>
        </div>

        <!-- State 3: Data Tidak Ditemukan -->
        <div v-else-if="detailList.length === 0" class="card border-0 shadow-sm text-center p-5 rounded-4">
          <div class="mb-3">
            <span class="badge rounded-circle bg-warning-subtle text-warning p-3 fs-3">⚠️</span>
          </div>
          <h5 class="fw-bold text-dark mb-1">Tidak Ada Inputan Qty</h5>
          <p class="text-muted small mb-0">
            Tidak ditemukan data inputan qty (selain 0) untuk xMark: <strong>{{ activexMark }}</strong>
          </p>
        </div>

        <!-- State 4: Hasil Data Ditemukan -->
        <div v-else class="d-flex flex-column gap-4">
          <!-- Summary Header Badges -->
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-4">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border-bottom pb-3 gap-3">
                <div>
                  <span class="badge bg-primary-subtle text-primary text-uppercase px-2.5 py-1">xMark Dipilih</span>
                  <h4 class="fw-bold text-dark mt-1 mb-0">{{ activexMark }}</h4>
                </div>
                <div class="d-flex gap-2">
                  <div class="bg-light border rounded-3 px-3 py-2 text-center">
                    <small class="text-muted d-block fw-semibold">Total Tanggal Input</small>
                    <span class="fw-bold text-dark fs-6">{{ uniqueDatesFiltered.length }} Tanggal</span>
                  </div>
                  <div class="bg-light border rounded-3 px-3 py-2 text-center">
                    <small class="text-muted d-block fw-semibold">Total Record</small>
                    <span class="fw-bold text-dark fs-6">{{ sortedFilteredData.length }} Record</span>
                  </div>
                </div>
              </div>

              <!-- Daftar Chip Tanggal Unik (Telah Diurutkan Terbaru ke Terlama) -->
              <div class="mt-3">
                <small class="text-uppercase fw-semibold text-muted d-block mb-2">
                  Daftar Tanggal Yang Memiliki Inputan (Terbaru - Terlama):
                </small>
                <div class="d-flex flex-wrap gap-2">
                  <span
                    v-for="tgl in uniqueDatesFiltered"
                    :key="tgl"
                    class="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-3 py-2"
                  >
                    📅 {{ formatDate(tgl) }}
                  </span>
                  <span v-if="uniqueDatesFiltered.length === 0" class="text-muted small fst-italic">
                    Tidak ada tanggal yang sesuai filter
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabel Detail Inputan -->
          <div class="card border-0 shadow rounded-4 overflow-visible">
            <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3 px-4 rounded-top-4">
              <h6 class="fw-bold mb-0">RINCIAN TANGGAL & DEPARTEMEN</h6>
              <div class="d-flex align-items-center gap-3">
                <button class="btn btn-sm btn-outline-light" @click="resetTableFilters" v-if="hasActiveFilters">
                  Reset Filter Tabel
                </button>
                <small class="text-white-50">Diurutkan dari tanggal terbaru ke terlama</small>
              </div>
            </div>

            <div class="table-responsive" style="min-height: 350px;">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light text-uppercase small text-muted">
                  <tr>
                    <th class="ps-4 align-middle" style="width: 50px;">No</th>
                    
                    <!-- Kolom Tanggal Input -->
                    <th class="align-middle position-relative" style="min-width: 190px;">
                      <div class="d-flex justify-content-between align-items-center header-filter-btn" @click.stop="toggleDropdown('tgl_input')">
                        <span>Tanggal Input</span>
                        <i class="bi bi-funnel-fill fs-6" :class="filters.tgl_input.length ? 'text-primary' : 'text-secondary opacity-50'"></i>
                      </div>
                      
                      <!-- Menu Filter Dropdown Tanggal -->
                      <div v-if="openDropdown === 'tgl_input'" class="filter-dropdown-menu shadow-lg p-3 rounded-3 bg-white" @click.stop>
                        <input v-model="searchFilters.tgl_input" type="text" class="form-control form-control-sm mb-2" placeholder="Cari tanggal...">
                        <div class="filter-list-box">
                          <div v-for="opt in optionsTgl" :key="opt" class="form-check mb-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="filters.tgl_input" :id="'tgl_'+opt">
                            <label class="form-check-label text-dark small" :for="'tgl_'+opt">{{ formatDate(opt) }}</label>
                          </div>
                          <div v-if="optionsTgl.length === 0" class="small text-muted text-center py-2">Tidak ditemukan</div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                          <button class="btn btn-xs text-primary p-0 fw-semibold" @click="filters.tgl_input = []">Clear</button>
                          <button class="btn btn-xs btn-primary px-2 py-0.5 rounded" @click="openDropdown = null">Tutup</button>
                        </div>
                      </div>
                    </th>

                    <!-- Kolom Kategori Dept -->
                    <th class="align-middle position-relative" style="min-width: 190px;">
                      <div class="d-flex justify-content-between align-items-center header-filter-btn" @click.stop="toggleDropdown('kategoridept')">
                        <span>Kategori Dept</span>
                        <i class="bi bi-funnel-fill fs-6" :class="filters.kategoridept.length ? 'text-primary' : 'text-secondary opacity-50'"></i>
                      </div>

                      <!-- Menu Filter Dropdown Kategori Dept -->
                      <div v-if="openDropdown === 'kategoridept'" class="filter-dropdown-menu shadow-lg p-3 rounded-3 bg-white" @click.stop>
                        <input v-model="searchFilters.kategoridept" type="text" class="form-control form-control-sm mb-2" placeholder="Cari departemen...">
                        <div class="filter-list-box">
                          <div v-for="opt in optionsDept" :key="opt" class="form-check mb-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="filters.kategoridept" :id="'dept_'+opt">
                            <label class="form-check-label text-dark small" :for="'dept_'+opt">{{ opt }}</label>
                          </div>
                          <div v-if="optionsDept.length === 0" class="small text-muted text-center py-2">Tidak ditemukan</div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                          <button class="btn btn-xs text-primary p-0 fw-semibold" @click="filters.kategoridept = []">Clear</button>
                          <button class="btn btn-xs btn-primary px-2 py-0.5 rounded" @click="openDropdown = null">Tutup</button>
                        </div>
                      </div>
                    </th>

                    <!-- Kolom Gedung -->
                    <th class="align-middle position-relative" style="min-width: 160px;">
                      <div class="d-flex justify-content-between align-items-center header-filter-btn" @click.stop="toggleDropdown('gedung')">
                        <span>Gedung</span>
                        <i class="bi bi-funnel-fill fs-6" :class="filters.gedung.length ? 'text-primary' : 'text-secondary opacity-50'"></i>
                      </div>

                      <!-- Menu Filter Dropdown Gedung -->
                      <div v-if="openDropdown === 'gedung'" class="filter-dropdown-menu shadow-lg p-3 rounded-3 bg-white" @click.stop>
                        <input v-model="searchFilters.gedung" type="text" class="form-control form-control-sm mb-2" placeholder="Cari gedung...">
                        <div class="filter-list-box">
                          <div v-for="opt in optionsGedung" :key="opt" class="form-check mb-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="filters.gedung" :id="'gdg_'+opt">
                            <label class="form-check-label text-dark small" :for="'gdg_'+opt">{{ opt }}</label>
                          </div>
                          <div v-if="optionsGedung.length === 0" class="small text-muted text-center py-2">Tidak ditemukan</div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                          <button class="btn btn-xs text-primary p-0 fw-semibold" @click="filters.gedung = []">Clear</button>
                          <button class="btn btn-xs btn-primary px-2 py-0.5 rounded" @click="openDropdown = null">Tutup</button>
                        </div>
                      </div>
                    </th>

                    <th class="align-middle">Level</th>

                    <!-- Kolom Qty -->
                    <th class="align-middle text-end pe-4 position-relative" style="min-width: 140px;">
                      <div class="d-flex justify-content-end align-items-center gap-2 header-filter-btn" @click.stop="toggleDropdown('qty')">
                        <i class="bi bi-funnel-fill fs-6" :class="filters.qty.length ? 'text-primary' : 'text-secondary opacity-50'"></i>
                        <span>Qty</span>
                      </div>

                      <!-- Menu Filter Dropdown Qty -->
                      <div v-if="openDropdown === 'qty'" class="filter-dropdown-menu dropdown-right shadow-lg p-3 rounded-3 bg-white text-start" @click.stop>
                        <input v-model="searchFilters.qty" type="text" class="form-control form-control-sm mb-2" placeholder="Cari qty...">
                        <div class="filter-list-box">
                          <div v-for="opt in optionsQty" :key="opt" class="form-check mb-1">
                            <input class="form-check-input" type="checkbox" :value="opt" v-model="filters.qty" :id="'qty_'+opt">
                            <label class="form-check-label text-dark small" :for="'qty_'+opt">{{ opt }}</label>
                          </div>
                          <div v-if="optionsQty.length === 0" class="small text-muted text-center py-2">Tidak ditemukan</div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                          <button class="btn btn-xs text-primary p-0 fw-semibold" @click="filters.qty = []">Clear</button>
                          <button class="btn btn-xs btn-primary px-2 py-0.5 rounded" @click="openDropdown = null">Tutup</button>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody class="text-secondary">
                  <tr v-if="sortedFilteredData.length === 0">
                    <td colspan="6" class="text-center py-5 text-muted">
                      Tidak ada data yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                  <tr v-for="(item, index) in sortedFilteredData" :key="index">
                    <td class="ps-4 text-muted small">{{ index + 1 }}</td>
                    <td class="fw-semibold text-dark text-nowrap">
                      {{ formatDate(item.tgl_input || item.xDateTime) }}
                    </td>
                    <td>
                      <span class="badge bg-secondary-subtle text-secondary-emphasis border px-2.5 py-1">
                        {{ item.kategoridept || '-' }}
                      </span>
                    </td>
                    <td>{{ item.gedung || '-' }}</td>
                    <td>{{ item.xLevel || '-' }}</td>
                    <td class="text-end pe-4">
                      <span
                        :class="[
                          'badge px-3 py-1.5 font-monospace fs-6',
                          item.qty > 0
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : 'bg-danger-subtle text-danger border border-danger-subtle'
                        ]"
                      >
                        {{ item.qty > 0 ? '+' : '' }}{{ item.qty }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const user = ref({});
const sidebarOpen = ref(false);
const loading = ref(false);

const searchXMark = ref("");
const activexMark = ref("");
const searched = ref(false);
const detailList = ref([]);

/* --- STATE FILTER TABEL --- */
const openDropdown = ref(null); // Menu filter yang terbuka ('tgl_input', 'kategoridept', 'gedung', 'qty')

const filters = ref({
  tgl_input: [],
  kategoridept: [],
  gedung: [],
  qty: []
});

const searchFilters = ref({
  tgl_input: "",
  kategoridept: "",
  gedung: "",
  qty: ""
});

const toggleDropdown = (col) => {
  openDropdown.value = openDropdown.value === col ? null : col;
};

const closeDropdown = () => {
  openDropdown.value = null;
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const logout = () => {
  localStorage.clear();
  window.location.href = "/login";
};

const fetchData = async () => {
  if (!searchXMark.value || searchXMark.value.trim() === "") return;

  loading.value = true;
  searched.value = true;
  activexMark.value = searchXMark.value.trim();
  resetTableFilters();

  try {
    const response = await axios.get(
      `${API_BASE_URL}/receivefinishing/tampilan-akumperdept`,
      { params: { xMark: activexMark.value } }
    );

    if (response.data && response.data.success) {
      detailList.value = response.data.data || [];
    } else {
      detailList.value = [];
    }
  } catch (err) {
    console.error("Gagal mengambil data detail tanggal:", err);
    detailList.value = [];
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  searchXMark.value = "";
  activexMark.value = "";
  searched.value = false;
  detailList.value = [];
  resetTableFilters();
};

const resetTableFilters = () => {
  filters.value = { tgl_input: [], kategoridept: [], gedung: [], qty: [] };
  searchFilters.value = { tgl_input: "", kategoridept: "", gedung: "", qty: "" };
  openDropdown.value = null;
};

const hasActiveFilters = computed(() => {
  return filters.value.tgl_input.length > 0 || 
         filters.value.kategoridept.length > 0 || 
         filters.value.gedung.length > 0 || 
         filters.value.qty.length > 0;
});

/* --- LOGIC PROSES & PENGURUTAN DATA --- */
const filteredData = computed(() => {
  return detailList.value.filter(item => {
    const rawDate = item.tgl_input || item.xDateTime;
    const dateStr = rawDate ? rawDate.toString().split("T")[0] : "-";
    const deptStr = item.kategoridept || '-';
    const gdgStr = item.gedung || '-';
    const qtyStr = String(item.qty);

    const matchDate = filters.value.tgl_input.length === 0 || filters.value.tgl_input.includes(dateStr);
    const matchDept = filters.value.kategoridept.length === 0 || filters.value.kategoridept.includes(deptStr);
    const matchGedung = filters.value.gedung.length === 0 || filters.value.gedung.includes(gdgStr);
    const matchQty = filters.value.qty.length === 0 || filters.value.qty.includes(qtyStr);

    return matchDate && matchDept && matchGedung && matchQty;
  });
});

// Urutkan data tabel: Tanggal terbaru di atas, terlama di bawah
const sortedFilteredData = computed(() => {
  return [...filteredData.value].sort((a, b) => {
    const dateA = new Date(a.tgl_input || a.xDateTime || 0).getTime();
    const dateB = new Date(b.tgl_input || b.xDateTime || 0).getTime();
    return dateB - dateA; // Descending (terbaru ke terlama)
  });
});

// Chip Badges Tanggal: Terurut kronologis dari terbaru ke terlama
const uniqueDatesFiltered = computed(() => {
  const dates = filteredData.value
    .map(item => {
      const rawDate = item.tgl_input || item.xDateTime;
      return rawDate ? rawDate.toString().split("T")[0] : "";
    })
    .filter(date => date !== "");
  
  const unique = [...new Set(dates)];
  return unique.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
});

/* --- LOGIC OPSI CHECKBOX INTERCONNECTED --- */
const getAvailableOptions = (columnKey) => {
  const dataForOptions = detailList.value.filter(item => {
    let match = true;
    const dateStr = (item.tgl_input || item.xDateTime) ? (item.tgl_input || item.xDateTime).toString().split("T")[0] : "-";
    const deptStr = item.kategoridept || '-';
    const gdgStr = item.gedung || '-';
    const qtyStr = String(item.qty);

    if (columnKey !== 'tgl_input' && filters.value.tgl_input.length) match = match && filters.value.tgl_input.includes(dateStr);
    if (columnKey !== 'kategoridept' && filters.value.kategoridept.length) match = match && filters.value.kategoridept.includes(deptStr);
    if (columnKey !== 'gedung' && filters.value.gedung.length) match = match && filters.value.gedung.includes(gdgStr);
    if (columnKey !== 'qty' && filters.value.qty.length) match = match && filters.value.qty.includes(qtyStr);

    return match;
  });

  const uniqueValues = new Set();
  dataForOptions.forEach(item => {
    if (columnKey === 'tgl_input') {
      const rawDate = item.tgl_input || item.xDateTime;
      uniqueValues.add(rawDate ? rawDate.toString().split("T")[0] : "-");
    } else if (columnKey === 'qty') {
      uniqueValues.add(String(item.qty));
    } else {
      uniqueValues.add(item[columnKey] || '-');
    }
  });

  const sortedArray = Array.from(uniqueValues);
  if (columnKey === 'tgl_input') {
    return sortedArray.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }
  return sortedArray.sort();
};

const filterBySearch = (columnKey, options) => {
  const search = searchFilters.value[columnKey].toLowerCase();
  if (!search) return options;
  if (columnKey === 'tgl_input') {
    return options.filter(opt => formatDate(opt).toLowerCase().includes(search));
  }
  return options.filter(opt => String(opt).toLowerCase().includes(search));
};

const optionsTgl = computed(() => filterBySearch('tgl_input', getAvailableOptions('tgl_input')));
const optionsDept = computed(() => filterBySearch('kategoridept', getAvailableOptions('kategoridept')));
const optionsGedung = computed(() => filterBySearch('gedung', getAvailableOptions('gedung')));
const optionsQty = computed(() => filterBySearch('qty', getAvailableOptions('qty')));

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  const cleanStr = dateStr.toString().split("T")[0];
  const dateObj = new Date(cleanStr);
  if (isNaN(dateObj.getTime())) return cleanStr;

  return dateObj.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) {
    try {
      user.value = JSON.parse(userData);
    } catch (e) {
      console.error("Error parsing user data", e);
    }
  }
});
</script>

<style scoped>
.main-content { transition: all 0.3s ease; }
@media (min-width: 992px) {
  .sidebar-open-margin { margin-left: 260px; }
  .sidebar-closed-margin { margin-left: 80px; }
}
.sidebar-component { position: fixed; height: 100vh; z-index: 1050; }

/* Styling Filter Dropdown */
.header-filter-btn {
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.03);
  user-select: none;
  transition: background-color 0.2s;
}
.header-filter-btn:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.filter-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1060;
  width: 230px;
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-top: 4px;
}

.filter-dropdown-menu.dropdown-right {
  left: auto;
  right: 0;
}

.filter-list-box {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 8px;
  background-color: #f8f9fa;
}

.btn-xs {
  font-size: 0.75rem;
}

.table-responsive {
  overflow-x: auto;
  overflow-y: visible;
}
</style>