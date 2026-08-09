<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-5"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px',
        }"
      >
        <div class="container-fluid idppo-page">

          <!-- PAGE HEADER -->
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
            <div>
              <h4 class="fw-bold text-dark-blue mb-1">
                <i class="bi bi-journal-check me-2 text-primary"></i>Manajemen IDP Jatuh Tempo
              </h4>
              <p class="text-muted small mb-0">Pantau dan kelola Purchase Order berdasarkan tanggal jatuh tempo</p>
            </div>
            <button
              class="btn btn-primary shadow-sm px-3"
              data-bs-toggle="modal"
              data-bs-target="#idpPoModal"
              @click="openAddModal"
              v-if="['it', 'akuntansi'].includes(user.dept?.toLowerCase())"
            >
              <i class="bi bi-cloud-plus me-1"></i> Tambah IDP PO
            </button>
          </div>

          <!-- FILTER TANGGAL -->
          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-4">
              <div class="row g-3 align-items-end">
                <div class="col-md-3">
                  <label class="form-label small text-muted mb-1">Dari Tanggal JT</label>
                  <input type="date" v-model="filters.from" class="form-control idppo-input" />
                </div>
                <div class="col-md-3">
                  <label class="form-label small text-muted mb-1">Sampai Tanggal Terakhir JT</label>
                  <input type="date" v-model="filters.to" class="form-control idppo-input" />
                </div>
                <div class="col-md-6 d-flex flex-wrap gap-2">
                  <button class="btn btn-primary px-3" @click="loadItems">
                    <i class="bi bi-funnel me-1"></i>Filter
                  </button>
                  <button class="btn btn-success px-3" @click="exportExcel">
                    <i class="bi bi-file-earmark-excel me-1"></i> Export Excel
                  </button>
                  <a class="btn btn-outline-secondary px-3" href="/idppo">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
                  </a>
                </div>
              </div>

              <!-- ACTIVE FILTER CHIPS -->
              <div v-if="activeFilterChips.length" class="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top">
                <span class="text-muted small me-1">Filter kolom aktif:</span>
                <span v-for="chip in activeFilterChips" :key="chip.key + chip.value" class="filter-chip">
                  <span class="filter-chip-label">{{ chip.colLabel }}:</span> {{ chip.value }}
                  <i class="bi bi-x-lg filter-chip-remove" @click="removeFilterValue(chip.key, chip.value)"></i>
                </span>
                <button class="btn btn-link btn-sm text-danger p-0 ms-1" @click="clearAllFilters">
                  Hapus semua
                </button>
              </div>
            </div>
          </div>

          <div class="card border-0 rounded-4 shadow-sm">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat data...
              </div>
              <div v-else-if="items.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="bi bi-inbox me-2"></i>Tidak ada data PO.
              </div>
              <div v-else-if="filteredItems.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="bi bi-search me-2"></i>Tidak ada data yang cocok dengan filter kolom.
              </div>
              <div v-else class="table-container p-3">
                <div class="d-flex justify-content-between align-items-center px-1 pb-2">
                  <span class="text-muted small">
                    Menampilkan <b>{{ filteredItems.length }}</b> dari <b>{{ items.length }}</b> data
                  </span>
                </div>
                <div class="table-responsive">
                  <table
                    id="idpPoTable"
                    class="table table-borderless table-hover mb-0 align-middle w-100 idppo-table"
                  >
                    <thead class="text-uppercase fw-bold text-secondary border-bottom">
                      <tr>
                        <th class="text-center" style="width: 56px;">No</th>

                        <th v-for="col in filterColumns" :key="col.key" class="filter-th">
                          <div class="th-filter-wrap">
                            <span>{{ col.label }}</span>

                            <div class="filter-dropdown-wrap" :class="{ active: dropdownOpen[col.key] }">
                              <button
                                type="button"
                                class="filter-icon-btn"
                                :class="{ 'has-filter': selectedFilters[col.key].length }"
                                @click.stop="toggleDropdown(col.key)"
                              >
                                <i class="bi" :class="selectedFilters[col.key].length ? 'bi-funnel-fill' : 'bi-funnel'"></i>
                                <span v-if="selectedFilters[col.key].length" class="filter-count-badge">
                                  {{ selectedFilters[col.key].length }}
                                </span>
                              </button>

                              <div v-if="dropdownOpen[col.key]" class="filter-dropdown-panel" @click.stop>
                                <div class="filter-search-box">
                                  <i class="bi bi-search"></i>
                                  <input
                                    type="text"
                                    v-model="searchFilterText[col.key]"
                                    placeholder="Cari nilai..."
                                    autofocus
                                  />
                                </div>

                                <div class="filter-options-list">
                                  <div v-if="filteredOptionsFor(col.key).length === 0" class="text-muted small text-center py-3">
                                    Tidak ada opsi
                                  </div>
                                  <label
                                    v-for="opt in filteredOptionsFor(col.key)"
                                    :key="opt"
                                    class="filter-option-item"
                                  >
                                    <input
                                      type="checkbox"
                                      :checked="selectedFilters[col.key].includes(opt)"
                                      @change="toggleOption(col.key, opt)"
                                    />
                                    <span class="text-truncate">{{ opt }}</span>
                                  </label>
                                </div>

                                <div class="filter-dropdown-actions">
                                  <button type="button" class="btn-link-action" @click="clearFilter(col.key)">
                                    Reset
                                  </button>
                                  <button type="button" class="btn-link-action primary" @click="dropdownOpen[col.key] = false">
                                    Selesai
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </th>

                        <th class="text-center" style="width: 110px;">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in filteredItems" :key="item.id">
                        <td class="text-center text-muted">{{ index + 1 }}</td>
                        <td v-for="col in filterColumns" :key="col.key">
                          <span class="fw-medium text-dark">{{ getDisplayValue(item, col) }}</span>
                        </td>
                        <td class="text-center">
                          <div class="d-flex justify-content-center">
                            <template v-if="['it', 'akuntansi'].includes(user.dept?.toLowerCase())">
                              <button
                                class="btn btn-sm btn-warning me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#idpPoModal"
                                @click="openEditModal(item)"
                                title="Edit"
                              >
                                <i class="bi bi-pencil-square"></i>
                              </button>
                              <button
                                class="btn btn-sm btn-danger"
                                @click="deleteItem(item.id)"
                                title="Hapus"
                              >
                                <i class="bi bi-trash"></i>
                              </button>
                            </template>
                            <template v-else>
                              <span class="text-muted small">No action for your dept</span>
                            </template>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Footer />
  </div>

  <!-- Modal Create / Edit -->
  <div class="modal fade" id="idpPoModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content rounded-4 shadow border-0">
        <div class="modal-header border-0 pb-0">
          <h5 class="modal-title fw-bold">
            <i class="bi" :class="editMode ? 'bi-pencil-square' : 'bi-plus-circle'"></i>
            {{ editMode ? "Edit PO" : "Tambah PO" }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body pt-3">
          <form @submit.prevent="saveItem">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">IDP</label>
                <div style="position: relative;">
                  <input
                    v-model="form.idp"
                    type="text"
                    class="form-control idppo-input"
                    required
                    @input="fetchRiwayat('idp', form.idp)"
                    @focus="showRiwayat.idp = true"
                    @blur="hideRiwayat('idp')"
                  />
                  <ul
                    v-if="riwayat.idp.length && showRiwayat.idp"
                    class="list-group position-absolute w-100 shadow-sm"
                    style="top: 100%; left: 0; z-index: 1000; max-height: 200px; overflow-y: auto;"
                  >
                    <li
                      v-for="item in riwayat.idp"
                      :key="item"
                      class="list-group-item list-group-item-action py-1 px-2 cursor-pointer"
                      @mousedown.prevent="selectRiwayat('idp', item)"
                    >
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">Tanggal Jatuh Tempo</label>
                <input v-model="form.tanggal_po" type="date" class="form-control idppo-input" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">PCS</label>
                <input v-model="form.pcs" type="text" min="1" class="form-control idppo-input" required />
              </div>

              <div class="col-md-6">
                <label class="form-label">No. Perjanjian Kontrak</label>
                <div style="position: relative;">
                  <input
                    v-model="form.nama_kontrak"
                    type="text"
                    class="form-control idppo-input"
                    required
                    @input="fetchRiwayat('nama_kontrak', form.nama_kontrak)"
                    @focus="showRiwayat.nama_kontrak = true"
                    @blur="hideRiwayat('nama_kontrak')"
                  />
                  <ul
                    v-if="riwayat.nama_kontrak.length && showRiwayat.nama_kontrak"
                    class="list-group position-absolute w-100 shadow-sm"
                    style="top: 100%; left: 0; z-index: 1000; max-height: 200px; overflow-y: auto;"
                  >
                    <li
                      v-for="item in riwayat.nama_kontrak"
                      :key="item"
                      class="list-group-item list-group-item-action py-1 px-2 cursor-pointer"
                      @mousedown.prevent="selectRiwayat('nama_kontrak', item)"
                    >
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-end mt-4">
              <button type="submit" class="btn btn-primary px-4" data-bs-dismiss="modal">
                {{ editMode ? "Update" : "Simpan" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const editMode = ref(false);
const form = ref({
  id: null,
  idp: "",
  tanggal_po: "",
  pcs: 1,
  nama_kontrak: "",
});
let table = null;

const filters = ref({
  from: "",
  to: ""
});

// Format tanggal
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

// ============================
// MULTI-SELECT SEARCHABLE COLUMN FILTERS
// ============================
const filterColumns = [
  { key: "idp", label: "IDP", formatter: null },
  { key: "tanggal_po", label: "Tgl Jatuh Tempo", formatter: formatDate },
  { key: "pcs", label: "PCS", formatter: null },
  { key: "nama_kontrak", label: "No. Perjanjian Kontrak", formatter: null },
  { key: "createdAt", label: "Tanggal Buat", formatter: formatDateTime },
];

const selectedFilters = reactive({
  idp: [],
  tanggal_po: [],
  pcs: [],
  nama_kontrak: [],
  createdAt: [],
});

const searchFilterText = reactive({
  idp: "",
  tanggal_po: "",
  pcs: "",
  nama_kontrak: "",
  createdAt: "",
});

const dropdownOpen = reactive({
  idp: false,
  tanggal_po: false,
  pcs: false,
  nama_kontrak: false,
  createdAt: false,
});

function getDisplayValue(item, col) {
  const raw = item[col.key];
  return col.formatter ? col.formatter(raw) : String(raw ?? "-");
}

const uniqueOptionsMap = computed(() => {
  const map = {};
  filterColumns.forEach((col) => {
    const vals = items.value.map((i) => getDisplayValue(i, col));
    map[col.key] = [...new Set(vals)].sort((a, b) =>
      a.localeCompare(b, "id", { numeric: true })
    );
  });
  return map;
});

function filteredOptionsFor(key) {
  const text = searchFilterText[key].toLowerCase();
  const options = uniqueOptionsMap.value[key] || [];
  if (!text) return options;
  return options.filter((v) => v.toLowerCase().includes(text));
}

const filteredItems = computed(() => {
  return items.value.filter((item) =>
    filterColumns.every((col) => {
      const sel = selectedFilters[col.key];
      if (!sel.length) return true;
      return sel.includes(getDisplayValue(item, col));
    })
  );
});

const activeFilterChips = computed(() => {
  const chips = [];
  filterColumns.forEach((col) => {
    selectedFilters[col.key].forEach((val) => {
      chips.push({ key: col.key, colLabel: col.label, value: val });
    });
  });
  return chips;
});

function toggleOption(key, value) {
  const arr = selectedFilters[key];
  const idx = arr.indexOf(value);
  if (idx === -1) arr.push(value);
  else arr.splice(idx, 1);
}

function removeFilterValue(key, value) {
  selectedFilters[key] = selectedFilters[key].filter((v) => v !== value);
}

function clearFilter(key) {
  selectedFilters[key] = [];
  searchFilterText[key] = "";
}

function clearAllFilters() {
  filterColumns.forEach((col) => {
    selectedFilters[col.key] = [];
    searchFilterText[col.key] = "";
  });
}

function toggleDropdown(key) {
  const willOpen = !dropdownOpen[key];
  Object.keys(dropdownOpen).forEach((k) => (dropdownOpen[k] = false));
  dropdownOpen[key] = willOpen;
}

function handleClickOutside(e) {
  if (!e.target.closest(".filter-dropdown-wrap")) {
    Object.keys(dropdownOpen).forEach((k) => (dropdownOpen[k] = false));
  }
}

// ============================
// RIWAYAT (autocomplete)
// ============================
const riwayat = ref({
  idp: [],
  nama_kontrak: [],
});

const showRiwayat = reactive({
  idp: false,
  nama_kontrak: false,
});

let timeoutId = {};

function hideRiwayat(fieldName) {
  setTimeout(() => {
    showRiwayat[fieldName] = false;
  }, 200);
}

function selectRiwayat(fieldName, value) {
  form.value[fieldName] = value;
  showRiwayat[fieldName] = false;
}

async function fetchRiwayat(fieldName, query) {
  if (timeoutId[fieldName]) {
    clearTimeout(timeoutId[fieldName]);
  }

  if (!query || query.length < 1) {
    riwayat.value[fieldName] = [];
    return;
  }

  timeoutId[fieldName] = setTimeout(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/idp-po/riwayat/${fieldName}?query=${query}`);
      riwayat.value[fieldName] = response.data;
      showRiwayat[fieldName] = true;
    } catch (error) {
      console.error("Failed to fetch history for", fieldName, ":", error);
      riwayat.value[fieldName] = [];
    }
  }, 300);
}

// ============================
// DATATABLES
// ============================
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable("#idpPoTable")) {
    $("#idpPoTable").DataTable().destroy();
  }
  setTimeout(() => {
    table = $("#idpPoTable").DataTable({
      pageLength: 10,
      lengthChange: false,
      searching: true,
      autoWidth: false,
      responsive: true,
      order: [],
      language: {
        search: "Cari:",
        zeroRecords: "Data tidak ditemukan",
        info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
        infoEmpty: "Tidak ada data tersedia",
        infoFiltered: "(difilter dari _MAX_ total data)",
        paginate: { next: "Berikutnya", previous: "Sebelumnya" },
      },
    });
  }, 0);
};

watch(filteredItems, () => reloadDataTable(), { deep: true });

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

async function loadItems() {
  loading.value = true;
  try {
    const params = {};
    if (filters.value.from && filters.value.to) {
      params.from = filters.value.from;
      params.to = filters.value.to;
    }
    const res = await axios.get(`${API_BASE_URL}/idp-po`, { params });
    items.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak bisa memuat data PO.", "error");
  } finally {
    loading.value = false;
  }
}

async function exportExcel() {
  try {
    const params = {};
    if (filters.value.from && filters.value.to) {
      params.from = filters.value.from;
      params.to = filters.value.to;
    }
    const res = await axios.get(`${API_BASE_URL}/idp-po/export`, {
      params,
      responseType: "blob"
    });

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report-idp-po.xlsx`;
    link.click();
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak bisa export Excel.", "error");
  }
}

function openAddModal() {
  editMode.value = false;
  form.value = { id: null, idp: "", tanggal_po: "", pcs: 1, nama_kontrak: "" };
}

function openEditModal(item) {
  editMode.value = true;
  form.value = { ...item };
}

async function saveItem() {
  try {
    if (editMode.value) {
      await axios.put(`${API_BASE_URL}/idp-po/${form.value.id}`, form.value);
      Swal.fire("Berhasil", "Data PO berhasil diupdate.", "success");
    } else {
      await axios.post(`${API_BASE_URL}/idp-po`, form.value);
      Swal.fire("Berhasil", "Data PO berhasil ditambahkan.", "success");
    }
    loadItems();
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
  }
}

async function deleteItem(id) {
  Swal.fire({
    title: "Yakin ingin menghapus?",
    text: "Data PO akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/idp-po/${id}`);
        Swal.fire("Berhasil", "Data berhasil dihapus.", "success");
        loadItems();
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "Tidak bisa menghapus data.", "error");
      }
    }
  });
}

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  loadItems();

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable("#idpPoTable")) {
    $("#idpPoTable").DataTable().destroy();
  }
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.bg-light-soft { background-color: #f5f7fb; }
.text-dark-blue { color: #1e293b; }

.idppo-input {
  border-radius: 8px;
  border: 1px solid #dfe3ea;
}
.idppo-input:focus {
  border-color: #6c8cff;
  box-shadow: 0 0 0 0.2rem rgba(76, 110, 245, 0.15);
}

/* Filter chips */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eef1ff;
  color: #4c51bf;
  border-radius: 999px;
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 500;
}
.filter-chip-label {
  font-weight: 700;
}
.filter-chip-remove {
  cursor: pointer;
  font-size: 0.65rem;
  opacity: 0.7;
}
.filter-chip-remove:hover {
  opacity: 1;
}

/* Table */
.idppo-table thead th {
  font-size: 0.76rem;
  letter-spacing: 0.03em;
  padding: 0.85rem 0.75rem;
  vertical-align: middle;
}
.idppo-table tbody td {
  padding: 0.75rem;
  font-size: 0.9rem;
}
.idppo-table tbody tr:hover {
  background-color: #fafbff;
}

/* Column filter dropdown */
.filter-th {
  position: relative;
}
.th-filter-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  white-space: nowrap;
}

.filter-dropdown-wrap {
  position: relative;
  display: inline-flex;
}

.filter-icon-btn {
  border: none;
  background: transparent;
  color: #94a3b8;
  padding: 2px 4px;
  border-radius: 6px;
  font-size: 0.85rem;
  position: relative;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.filter-icon-btn:hover {
  color: #4c6ef5;
  background: #eef1ff;
}
.filter-icon-btn.has-filter {
  color: #4c6ef5;
}

.filter-count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #4c6ef5;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 14px;
  height: 14px;
  line-height: 14px;
  text-align: center;
  border-radius: 999px;
  padding: 0 2px;
}

.filter-dropdown-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 230px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
  border: 1px solid #eef0f4;
  z-index: 50;
  padding: 10px;
  text-transform: none;
  font-weight: 400;
  letter-spacing: normal;
}

.filter-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f6fa;
  border-radius: 8px;
  padding: 6px 10px;
  margin-bottom: 8px;
}
.filter-search-box i {
  color: #94a3b8;
  font-size: 0.8rem;
}
.filter-search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.82rem;
  width: 100%;
  color: #334155;
}

.filter-options-list {
  max-height: 190px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filter-option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 6px;
  font-size: 0.82rem;
  color: #334155;
  cursor: pointer;
  margin: 0;
}
.filter-option-item:hover {
  background: #f5f6fa;
}
.filter-option-item input {
  cursor: pointer;
  accent-color: #4c6ef5;
}

.filter-dropdown-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f2f6;
  margin-top: 8px;
  padding-top: 8px;
}

.btn-link-action {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  padding: 2px 6px;
}
.btn-link-action:hover {
  color: #334155;
}
.btn-link-action.primary {
  color: #4c6ef5;
}
.btn-link-action.primary:hover {
  color: #364fc7;
}
</style>