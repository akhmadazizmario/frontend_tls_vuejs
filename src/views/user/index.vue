<template>
  <div class="d-flex flex-column min-vh-100 page-bg">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-4"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px',
        }"
      >
      <!-- BUNGKUS DENGAN v-if="hasAccess" UNTUK UAC -->
      <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">
        <div class="container-fluid" style="max-width: 1280px">
          <!-- Page heading -->
          <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div>
              <h2 class="page-title mb-1">Manajemen User</h2>
              <p class="page-subtitle mb-0">Kelola akun, akses, dan data pegawai dalam satu tempat</p>
            </div>
            <div class="d-flex gap-2">
              <span class="stat-pill">
                <i class="bi bi-people-fill"></i>
                {{ users.length }} User
              </span>
            </div>
          </div>

          <!-- Tambah User -->
          <div class="modern-card mb-4">
            <div class="modern-card-header">
              <div class="header-icon-wrap bg-primary-soft">
                <i class="bi bi-person-plus-fill text-primary"></i>
              </div>
              <div>
                <h5 class="mb-0 fw-bold">Tambah User Baru</h5>
                <small class="text-muted">Lengkapi data di bawah untuk membuat akun baru</small>
              </div>
            </div>
            <div class="modern-card-body">
              <form @submit.prevent="createUser">
                <div class="row g-3">
                  <div class="col-md-6 col-lg-4">
                    <label class="form-label">Nama</label>
                    <input
                      v-model="form.name"
                      class="form-control modern-input"
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                  <div class="col-md-6 col-lg-4">
                    <label class="form-label">No Pegawai</label>
                    <input
                      v-model="form.nopegawai"
                      class="form-control modern-input"
                      placeholder="Nomor pegawai"
                    />
                  </div>
                  <div class="col-md-6 col-lg-4">
                    <label class="form-label">Email</label>
                    <input
                      v-model="form.email"
                      type="email"
                      class="form-control modern-input"
                      placeholder="Email aktif"
                      required
                    />
                  </div>
                  <div class="col-md-6 col-lg-4">
                    <label class="form-label">Phone</label>
                    <input
                      v-model="form.phone"
                      class="form-control modern-input"
                      placeholder="Nomor telepon"
                    />
                  </div>
                  <div class="col-md-6 col-lg-4">
                    <label class="form-label">Password</label>
                    <div class="position-relative">
                      <input
                        v-model="form.password"
                        :type="showPassword ? 'text' : 'password'"
                        class="form-control modern-input"
                        placeholder="Minimal 8 karakter"
                        required
                      />
                      <button
                        type="button"
                        class="btn-eye"
                        @click="showPassword = !showPassword"
                      >
                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-6 col-lg-4">
                    <label class="form-label">Dept</label>
                    <input
                      v-model="form.dept"
                      class="form-control modern-input"
                      placeholder="Departemen"
                    />
                  </div>
                  <div class="col-md-6 col-lg-4">
                    <label class="form-label">Jabatan</label>
                    <input
                      v-model="form.jabatan"
                      class="form-control modern-input"
                      placeholder="Jabatan"
                    />
                  </div>
                </div>
                <div class="d-flex justify-content-end mt-4">
                  <button type="submit" class="btn btn-modern-primary" :disabled="creating">
                    <span v-if="creating" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-plus-lg me-2"></i>
                    Tambah User
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Daftar User -->
          <div class="modern-card">
            <div class="modern-card-header flex-wrap gap-3 justify-content-between">
              <div class="d-flex align-items-center gap-3">
                <div class="header-icon-wrap bg-primary-soft">
                  <i class="bi bi-people-fill text-primary"></i>
                </div>
                <div>
                  <h5 class="mb-0 fw-bold">Daftar User</h5>
                  <small class="text-muted">
                    {{ filteredUsers.length }} dari {{ users.length }} user ditampilkan
                    <span v-if="hasActiveFilters" class="filter-active-note">· filter aktif</span>
                  </small>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2 flex-wrap">
                <!-- Reset filter -->
                <transition name="fade">
                  <button
                    v-if="hasActiveFilters"
                    class="btn-modern-outline btn-sm"
                    @click="resetAllFilters"
                  >
                    <i class="bi bi-arrow-counterclockwise me-1"></i>
                    Reset Filter
                  </button>
                </transition>

                <!-- Bulk action -->
                <transition name="fade">
                  <button
                    v-if="selectedIds.length"
                    class="btn btn-modern-danger btn-sm"
                    @click="bulkDelete"
                  >
                    <i class="bi bi-trash3 me-1"></i>
                    Hapus ({{ selectedIds.length }})
                  </button>
                </transition>

                <!-- Kolom (multiple checkbox + search) -->
                <div class="column-picker" v-click-outside="closeColumnPicker">
                  <button
                    type="button"
                    class="btn-modern-outline btn-sm d-flex align-items-center gap-2"
                    @click="columnPickerOpen = !columnPickerOpen"
                  >
                    <i class="bi bi-layout-three-columns"></i>
                    Kolom
                    <span class="col-count-badge">{{ visibleColumnCount }}/{{ columns.length }}</span>
                    <i class="bi bi-chevron-down small"></i>
                  </button>

                  <transition name="pop">
                    <div v-if="columnPickerOpen" class="column-picker-panel">
                      <div class="column-picker-search">
                        <i class="bi bi-search"></i>
                        <input
                          v-model="columnSearch"
                          type="text"
                          placeholder="Cari kolom..."
                          @keydown.esc="closeColumnPicker"
                        />
                        <button v-if="columnSearch" class="btn-clear" @click="columnSearch = ''">
                          <i class="bi bi-x-circle-fill"></i>
                        </button>
                      </div>

                      <div class="column-picker-actions">
                        <button type="button" @click="selectAllColumns">Pilih semua</button>
                        <span class="divider">|</span>
                        <button type="button" @click="clearAllColumns">Kosongkan</button>
                      </div>

                      <div class="column-picker-list">
                        <label
                          v-for="col in filteredColumnOptions"
                          :key="col.key"
                          class="column-picker-item"
                        >
                          <span class="checkbox-wrap">
                            <input
                              type="checkbox"
                              :value="col.key"
                              v-model="visibleColumns"
                            />
                            <span class="checkbox-box"></span>
                          </span>
                          <span>{{ col.label }}</span>
                        </label>

                        <div v-if="!filteredColumnOptions.length" class="column-picker-empty">
                          Kolom tidak ditemukan
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>

                <!-- Search -->
                <div class="search-box">
                  <i class="bi bi-search"></i>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Cari nama, email, dept..."
                  />
                  <button v-if="searchQuery" class="btn-clear" @click="searchQuery = ''">
                    <i class="bi bi-x-circle-fill"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="modern-card-body p-0">
              <div class="table-responsive">
                <table class="modern-table mb-0">
                  <thead>
                    <tr>
                      <th class="col-check">
                        <label class="checkbox-wrap">
                          <input
                            type="checkbox"
                            :checked="allOnPageSelected"
                            @change="toggleSelectAll"
                          />
                          <span class="checkbox-box"></span>
                        </label>
                      </th>
                      <th
                        v-for="col in activeColumns"
                        :key="col.key"
                        class="sortable"
                      >
                        <div class="th-content">
                          <span class="th-label" @click="sortBy(col.key)">
                            {{ col.label }}
                            <i
                              class="bi sort-icon"
                              :class="sortIconClass(col.key)"
                            ></i>
                          </span>

                          <div
                            v-if="isFilterable(col.key)"
                            class="th-filter"
                          >
                            <button
                              type="button"
                              class="btn-th-filter"
                              :class="{ active: columnFilters[col.key].length }"
                              @click.stop="toggleFilterDropdown(col.key, $event)"
                            >
                              <i
                                :class="columnFilters[col.key].length ? 'bi bi-funnel-fill' : 'bi bi-funnel'"
                              ></i>
                            </button>

                            <Teleport to="body">
                              <transition name="pop">
                                <div
                                  v-if="openFilterColumn === col.key"
                                  class="th-filter-panel filter-panel-portal"
                                  :style="{ top: filterPanelPos.top + 'px', left: filterPanelPos.left + 'px' }"
                                  @click.stop
                                >
                                  <div class="column-picker-search">
                                    <i class="bi bi-search"></i>
                                    <input
                                      v-model="filterSearch[col.key]"
                                      type="text"
                                      placeholder="Cari nilai..."
                                      @keydown.esc="closeFilterDropdown(col.key)"
                                    />
                                    <button
                                      v-if="filterSearch[col.key]"
                                      class="btn-clear"
                                      @click="filterSearch[col.key] = ''"
                                    >
                                      <i class="bi bi-x-circle-fill"></i>
                                    </button>
                                  </div>

                                  <div class="column-picker-actions">
                                    <button type="button" @click="selectAllFilterValues(col.key)">
                                      Pilih semua
                                    </button>
                                    <span class="divider">|</span>
                                    <button type="button" @click="clearFilterValues(col.key)">
                                      Kosongkan
                                    </button>
                                    <span v-if="columnFilters[col.key].length" class="filter-count">
                                      {{ columnFilters[col.key].length }} dipilih
                                    </span>
                                  </div>

                                  <div class="column-picker-list">
                                    <label
                                      v-for="val in filterOptions(col.key)"
                                      :key="val"
                                      class="column-picker-item"
                                    >
                                      <span class="checkbox-wrap">
                                        <input
                                          type="checkbox"
                                          :value="val"
                                          v-model="columnFilters[col.key]"
                                        />
                                        <span class="checkbox-box"></span>
                                      </span>
                                      <span class="text-truncate">{{ val }}</span>
                                    </label>

                                    <div v-if="!filterOptions(col.key).length" class="column-picker-empty">
                                      Nilai tidak ditemukan
                                    </div>
                                  </div>
                                </div>
                              </transition>
                            </Teleport>
                          </div>
                        </div>
                      </th>
                      <th class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading">
                      <td :colspan="activeColumns.length + 2" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                        <div class="text-muted mt-2">Memuat data...</div>
                      </td>
                    </tr>

                    <tr v-else-if="!pagedUsers.length">
                      <td :colspan="activeColumns.length + 2" class="text-center py-5">
                        <i class="bi bi-inbox display-6 text-muted d-block mb-2"></i>
                        <div class="text-muted">Tidak ada data yang cocok</div>
                      </td>
                    </tr>

                    <tr
                      v-for="u in pagedUsers"
                      :key="u.id"
                      :class="{ 'row-selected': selectedIds.includes(u.id) }"
                    >
                      <td>
                        <label class="checkbox-wrap">
                          <input
                            type="checkbox"
                            :value="u.id"
                            v-model="selectedIds"
                          />
                          <span class="checkbox-box"></span>
                        </label>
                      </td>
                      <template v-for="col in activeColumns" :key="col.key">
                        <td v-if="col.key === 'name'">
                          <div class="d-flex align-items-center gap-2">
                            <div class="avatar-circle">{{ initials(u.name) }}</div>
                            <span class="fw-semibold">{{ u.name || "-" }}</span>
                          </div>
                        </td>
                        <td v-else-if="col.key === 'dept'">
                          <span v-if="u.dept" class="badge-soft">{{ u.dept }}</span>
                          <span v-else>-</span>
                        </td>
                        <td v-else-if="col.key === 'createdAt'">
                          {{ formatDate(u.createdAt) }}
                        </td>
                        <td v-else>
                          {{ u[col.key] || "-" }}
                        </td>
                      </template>
                      <td class="text-center">
                        <button class="btn-icon btn-icon-warning" @click="editUser(u)" title="Edit">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn-icon btn-icon-danger" @click="deleteUser(u.id)" title="Hapus">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Footer: pagination -->
              <div class="table-footer">
                <div class="d-flex align-items-center gap-2">
                  <span class="text-muted small">Tampilkan</span>
                  <select v-model.number="pageSize" class="form-select form-select-sm w-auto">
                    <option :value="5">5</option>
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                  </select>
                  <span class="text-muted small">entri</span>
                </div>

                <div class="text-muted small">
                  Menampilkan {{ pagedRangeText }}
                </div>

                <div class="d-flex align-items-center gap-1">
                  <button class="btn-page" :disabled="currentPage === 1" @click="currentPage--">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <span class="page-indicator">{{ currentPage }} / {{ totalPages || 1 }}</span>
                  <button class="btn-page" :disabled="currentPage === totalPages || totalPages === 0" @click="currentPage++">
                    <i class="bi bi-chevron-right"></i>
                  </button>
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
    <Footer />

    <!-- Modal Edit -->
    <div
      v-if="editingUser"
      class="modal fade show d-block"
      tabindex="-1"
      style="background: rgba(15, 23, 42, 0.55)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content modern-modal">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-pencil-square me-2"></i>Edit User
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="cancelEdit"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Nama</label>
                  <input v-model="form.name" class="form-control modern-input" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">No Pegawai</label>
                  <input v-model="form.nopegawai" class="form-control modern-input" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email</label>
                  <input v-model="form.email" class="form-control modern-input" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input v-model="form.phone" class="form-control modern-input" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Password (opsional)</label>
                  <input
                    v-model="form.password"
                    type="password"
                    class="form-control modern-input"
                    placeholder="Kosongkan jika tidak ingin ganti"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Dept</label>
                  <input v-model="form.dept" class="form-control modern-input" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Jabatan</label>
                  <input v-model="form.jabatan" class="form-control modern-input" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button @click="cancelEdit" class="btn btn-modern-outline">Batal</button>
            <button @click="updateUser" class="btn btn-modern-primary" :disabled="updating">
              <span v-if="updating" class="spinner-border spinner-border-sm me-2"></span>
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const hasAccess = ref(false);

// --- State: form & modal ---
const form = ref({
  name: "",
  nopegawai: "",
  email: "",
  phone: "",
  password: "",
  dept: "",
  jabatan: "",
});
const editingUser = ref(null);
const showPassword = ref(false);
const creating = ref(false);
const updating = ref(false);

// --- State: layout ---
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}
function handleResize() {
  windowWidth.value = window.innerWidth;
}
function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// --- State: table data ---
const users = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const selectedIds = ref([]);
const sortKey = ref("createdAt");
const sortDir = ref("desc"); // 'asc' | 'desc'
const currentPage = ref(1);
const pageSize = ref(10);

const columns = [
  { key: "name", label: "Nama" },
  { key: "email", label: "Email" },
  { key: "nopegawai", label: "No Pegawai" },
  { key: "phone", label: "Phone" },
  { key: "dept", label: "Dept" },
  { key: "jabatan", label: "Jabatan" },
  { key: "createdAt", label: "Created At" },
];

// --- Column picker (multiple checkbox + search kolom di thead) ---
const columnPickerOpen = ref(false);
const columnSearch = ref("");
const visibleColumns = ref(columns.map((c) => c.key)); // default semua kolom aktif

const filteredColumnOptions = computed(() => {
  const q = columnSearch.value.trim().toLowerCase();
  if (!q) return columns;
  return columns.filter((c) => c.label.toLowerCase().includes(q));
});

const activeColumns = computed(() =>
  columns.filter((c) => visibleColumns.value.includes(c.key))
);

const visibleColumnCount = computed(() => visibleColumns.value.length);

function selectAllColumns() {
  visibleColumns.value = columns.map((c) => c.key);
}
function clearAllColumns() {
  visibleColumns.value = [];
}
function closeColumnPicker() {
  columnPickerOpen.value = false;
}

// --- Filter per kolom (multiple checkbox + search di setiap header) ---
const FILTERABLE_KEYS = ["name", "email", "nopegawai", "phone", "dept", "jabatan"];

// nilai yang sedang dicentang untuk tiap kolom
const columnFilters = reactive({
  name: [],
  email: [],
  nopegawai: [],
  phone: [],
  dept: [],
  jabatan: [],
});
// kata kunci pencarian di dalam masing-masing dropdown kolom
const filterSearch = reactive({
  name: "",
  email: "",
  nopegawai: "",
  phone: "",
  dept: "",
  jabatan: "",
});
// dropdown kolom mana yang sedang terbuka (hanya satu dalam satu waktu)
const openFilterColumn = ref(null);
const filterPanelPos = ref({ top: 0, left: 0 });

function isFilterable(key) {
  return FILTERABLE_KEYS.includes(key);
}
function toggleFilterDropdown(key, event) {
  if (openFilterColumn.value === key) {
    openFilterColumn.value = null;
    return;
  }
  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();
  const panelWidth = 220;
  const estimatedPanelHeight = 340;
  const viewportMargin = 12;

  let left = rect.left;
  if (left + panelWidth > window.innerWidth - viewportMargin) {
    left = window.innerWidth - panelWidth - viewportMargin;
  }
  if (left < viewportMargin) left = viewportMargin;

  let top = rect.bottom + 8;
  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow < estimatedPanelHeight && rect.top > estimatedPanelHeight) {
    // tidak cukup ruang di bawah, & ruang di atas cukup -> tampilkan di atas tombol
    top = Math.max(viewportMargin, rect.top - estimatedPanelHeight - 8);
  } else if (top + estimatedPanelHeight > window.innerHeight - viewportMargin) {
    // tetap di bawah tapi mepet ke batas layar
    top = Math.max(viewportMargin, window.innerHeight - estimatedPanelHeight - viewportMargin);
  }

  filterPanelPos.value = { top, left };
  openFilterColumn.value = key;
}
function closeFilterDropdown(key) {
  if (openFilterColumn.value === key) openFilterColumn.value = null;
}
function closeAnyFilterDropdown() {
  openFilterColumn.value = null;
}

// Cek apakah baris user cocok dengan pencarian global + semua filter kolom,
// dengan opsi mengecualikan satu kolom (dipakai untuk membangun daftar opsi kolom itu sendiri)
function matchesAllFilters(u, excludeKey = null) {
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    const hit = [u.name, u.email, u.nopegawai, u.phone, u.dept, u.jabatan]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q));
    if (!hit) return false;
  }
  for (const key of FILTERABLE_KEYS) {
    if (key === excludeKey) continue;
    const selected = columnFilters[key];
    if (selected.length) {
      const val = u[key] || "-";
      if (!selected.includes(val)) return false;
    }
  }
  return true;
}

// Opsi nilai untuk dropdown suatu kolom: dihitung dari data yang SUDAH melewati
// pencarian global + filter kolom LAIN (bukan filter kolom itu sendiri), supaya
// semua fitur saling terkait/konsisten (mirip filter Excel) dan tidak miskom.
function rawOptionsFor(key) {
  const set = new Set();
  users.value.forEach((u) => {
    if (matchesAllFilters(u, key)) {
      set.add(u[key] || "-");
    }
  });
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b), "id"));
}

function filterOptions(key) {
  const q = filterSearch[key].trim().toLowerCase();
  const options = rawOptionsFor(key);
  if (!q) return options;
  return options.filter((val) => String(val).toLowerCase().includes(q));
}

function selectAllFilterValues(key) {
  columnFilters[key] = rawOptionsFor(key);
}
function clearFilterValues(key) {
  columnFilters[key] = [];
}

const hasActiveFilters = computed(
  () =>
    !!searchQuery.value.trim() ||
    FILTERABLE_KEYS.some((key) => columnFilters[key].length > 0)
);

function resetAllFilters() {
  searchQuery.value = "";
  FILTERABLE_KEYS.forEach((key) => {
    columnFilters[key] = [];
    filterSearch[key] = "";
  });
  openFilterColumn.value = null;
}

// Directive kecil: tutup dropdown saat klik di luar elemen
const vClickOutside = {
  mounted(el, binding) {
    el.__clickOutsideHandler__ = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener("click", el.__clickOutsideHandler__, true);
  },
  unmounted(el) {
    document.removeEventListener("click", el.__clickOutsideHandler__, true);
  },
};

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function formatDate(data) {
  if (!data) return "-";
  const d = new Date(data);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Search global + filter per kolom (digabung dengan logika AND) ---
const filteredUsers = computed(() =>
  users.value.filter((u) => matchesAllFilters(u))
);

// --- Sort ---
function sortBy(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
}
function sortIconClass(key) {
  if (sortKey.value !== key) return "bi-arrow-down-up text-muted opacity-50";
  return sortDir.value === "asc" ? "bi-sort-up-alt" : "bi-sort-down";
}

const sortedUsers = computed(() => {
  const list = [...filteredUsers.value];
  const key = sortKey.value;
  const dir = sortDir.value === "asc" ? 1 : -1;
  list.sort((a, b) => {
    let av = a[key] ?? "";
    let bv = b[key] ?? "";
    if (key === "createdAt") {
      av = av ? new Date(av).getTime() : 0;
      bv = bv ? new Date(bv).getTime() : 0;
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv), "id") * dir;
  });
  return list;
});

// --- Pagination ---
const totalPages = computed(() =>
  Math.ceil(sortedUsers.value.length / pageSize.value)
);
const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return sortedUsers.value.slice(start, start + pageSize.value);
});
const pagedRangeText = computed(() => {
  const total = sortedUsers.value.length;
  if (!total) return "0 dari 0 entri";
  const start = (currentPage.value - 1) * pageSize.value + 1;
  const end = Math.min(start + pageSize.value - 1, total);
  return `${start} - ${end} dari ${total} entri`;
});

watch([searchQuery, pageSize], () => {
  currentPage.value = 1;
});
watch(
  columnFilters,
  () => {
    currentPage.value = 1;
  },
  { deep: true }
);
watch(totalPages, (val) => {
  if (currentPage.value > val) currentPage.value = Math.max(val, 1);
});

// --- Selection ---
const allOnPageSelected = computed(
  () =>
    pagedUsers.value.length > 0 &&
    pagedUsers.value.every((u) => selectedIds.value.includes(u.id))
);
function toggleSelectAll(e) {
  const checked = e.target.checked;
  const pageIds = pagedUsers.value.map((u) => u.id);
  if (checked) {
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...pageIds]));
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.includes(id));
  }
}

async function bulkDelete() {
  const count = selectedIds.value.length;
  const result = await Swal.fire({
    title: `Hapus ${count} user?`,
    text: "Data yang dipilih akan dihapus permanen dan tidak bisa dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, hapus semua",
    cancelButtonText: "Batal",
  });
  if (!result.isConfirmed) return;

  try {
    await Promise.all(
      selectedIds.value.map((id) => axios.delete(`${API_BASE_URL}/users/${id}`))
    );
    selectedIds.value = [];
    await getUsers();
    Swal.fire("Dihapus!", "User terpilih berhasil dihapus.", "success");
  } catch (e) {
    Swal.fire("Error", "Gagal menghapus sebagian atau seluruh user.", "error");
  }
}

// --- CRUD User ---
const getUsers = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/users`);
    users.value = res.data.data || [];
  } catch (e) {
    Swal.fire("Error", "Gagal mengambil data user", "error");
  } finally {
    loading.value = false;
  }
};

const createUser = async () => {
  creating.value = true;
  try {
    await axios.post(`${API_BASE_URL}/users`, form.value);
    form.value = {
      name: "",
      nopegawai: "",
      email: "",
      phone: "",
      password: "",
      dept: "",
      jabatan: "",
    };
    await getUsers();
    Swal.fire("Sukses", "User berhasil ditambahkan!", "success");
  } catch (e) {
    Swal.fire(
      "Error",
      "Gagal menambah user atau user sudah di buat sebelumnya",
      "error"
    );
  } finally {
    creating.value = false;
  }
};

const editUser = (u) => {
  editingUser.value = u.id;
  form.value = { ...u, password: "" };
};

const updateUser = async () => {
  updating.value = true;
  try {
    await axios.put(`${API_BASE_URL}/users/${editingUser.value}`, form.value);
    editingUser.value = null;
    await getUsers();
    Swal.fire("Sukses", "User berhasil diupdate!", "success");
  } catch (e) {
    Swal.fire("Error", "Gagal update user", "error");
  } finally {
    updating.value = false;
  }
};

function cancelEdit() {
  editingUser.value = null;
}

async function deleteUser(id) {
  Swal.fire({
    title: "Yakin hapus?",
    text: "Data user tidak bisa dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, hapus!",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      selectedIds.value = selectedIds.value.filter((sid) => sid !== id);
      await getUsers();
      Swal.fire("Dihapus!", "User berhasil dihapus.", "success");
    }
  });
}

// --- Lifecycle ---
function handleGlobalClickForFilterPanel(e) {
  if (!openFilterColumn.value) return;
  const target = e.target;
  if (target.closest && (target.closest(".th-filter") || target.closest(".filter-panel-portal"))) {
    return;
  }
  closeAnyFilterDropdown();
}
function handleScrollOrResizeForFilterPanel(e) {
  if (!openFilterColumn.value) return;
  // abaikan kalau scroll terjadi di dalam panel filter itu sendiri
  // (misalnya scroll daftar checkbox) — itu bukan alasan untuk menutup
  if (e && e.target && e.target.closest && e.target.closest(".filter-panel-portal")) {
    return;
  }
  closeAnyFilterDropdown();
}

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);

  // LOGIKA UAC 
  try {
    const pagesData = localStorage.getItem("pages");
    const pages = pagesData ? JSON.parse(pagesData) : [];
    // Periksa apakah user memiliki akses ke rute ini 
    hasAccess.value = pages.includes("user");
  } catch (e) {
    hasAccess.value = false;
  }

  // Hanya load item dari API jika user punya akses
  if (hasAccess.value) {
    getUsers();
  }
  // const userData = localStorage.getItem("user");
  // if (!userData) {
  //   window.location.href = "/login";
  // } else {
  //   user.value = JSON.parse(userData);
  // }

  // getUsers();
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleGlobalClickForFilterPanel, true);
  window.addEventListener("scroll", handleScrollOrResizeForFilterPanel, true);
  window.addEventListener("resize", handleScrollOrResizeForFilterPanel);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleGlobalClickForFilterPanel, true);
  window.removeEventListener("scroll", handleScrollOrResizeForFilterPanel, true);
  window.removeEventListener("resize", handleScrollOrResizeForFilterPanel);
});
</script>

<style scoped>
.page-bg {
  background-color: #f4f6fb;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.02em;
}
.page-subtitle {
  color: #64748b;
  font-size: 0.9rem;
}
.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
}

/* Card */
.modern-card {
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.04);
  overflow: hidden;
}
.modern-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 1.4rem;
  border-bottom: 1px solid #f1f2f6;
}
.modern-card-body {
  padding: 1.4rem;
}
.header-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.bg-primary-soft {
  background: #eef2ff;
}

/* Form */
.form-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.3rem;
}
.modern-input {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 0.55rem 0.85rem;
  font-size: 0.9rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.modern-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.btn-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #94a3b8;
  padding: 0;
}

/* Buttons */
.btn-modern-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1.4rem;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.btn-modern-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.32);
  color: #fff;
}
.btn-modern-outline {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #475569;
  border-radius: 10px;
  padding: 0.55rem 1.4rem;
  font-weight: 600;
  font-size: 0.9rem;
}
.btn-modern-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-weight: 600;
}
.btn-modern-danger:hover {
  background: #fee2e2;
  color: #b91c1c;
}

/* Column picker */
.column-picker {
  position: relative;
}
.col-count-badge {
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}
.column-picker-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
  padding: 0.75rem;
  z-index: 20;
}
.column-picker-search {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  margin-bottom: 0.6rem;
}
.column-picker-search i {
  color: #94a3b8;
  font-size: 0.85rem;
}
.column-picker-search input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  flex: 1;
  color: #1e293b;
}
.column-picker-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.column-picker-actions button {
  border: none;
  background: transparent;
  color: #4f46e5;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0;
}
.column-picker-actions .divider {
  color: #cbd5e1;
  font-size: 0.75rem;
}
.column-picker-list {
  max-height: 220px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.column-picker-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #334155;
  cursor: pointer;
}
.column-picker-item:hover {
  background: #f8fafc;
}
.column-picker-empty {
  text-align: center;
  font-size: 0.82rem;
  color: #94a3b8;
  padding: 0.75rem 0;
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Search */
.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.4rem 0.75rem;
  min-width: 240px;
}
.search-box i {
  color: #94a3b8;
}
.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.88rem;
  flex: 1;
  color: #1e293b;
}
.btn-clear {
  border: none;
  background: transparent;
  color: #cbd5e1;
  padding: 0;
  display: flex;
}

/* Table */
.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.88rem;
}
.modern-table thead th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #eef0f4;
  white-space: nowrap;
}
.modern-table thead th.sortable {
  cursor: pointer;
  user-select: none;
}
.th-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}
.th-label {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
}
.sort-icon {
  font-size: 0.75rem;
}
.filter-active-note {
  color: #4f46e5;
  font-weight: 600;
}

/* Filter per kolom di thead */
.th-filter {
  position: relative;
}
.btn-th-filter {
  border: none;
  background: transparent;
  color: #94a3b8;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  text-transform: none;
  letter-spacing: normal;
}
.btn-th-filter:hover {
  background: #eef2ff;
  color: #4f46e5;
}
.btn-th-filter.active {
  color: #4f46e5;
}
.th-filter-panel {
  position: fixed;
  width: 220px;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
  padding: 0.75rem;
  z-index: 2000;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
  cursor: default;
}
.filter-count {
  margin-left: auto;
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
}
.modern-table tbody td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.modern-table tbody tr {
  transition: background 0.12s ease;
}
.modern-table tbody tr:hover {
  background: #f8fafc;
}
.modern-table tbody tr.row-selected {
  background: #eef2ff;
}
.col-check {
  width: 44px;
}

/* Checkbox */
.checkbox-wrap {
  display: inline-flex;
  position: relative;
  cursor: pointer;
  width: 18px;
  height: 18px;
}
.checkbox-wrap input {
  position: absolute;
  opacity: 0;
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}
.checkbox-box {
  width: 18px;
  height: 18px;
  border: 1.5px solid #cbd5e1;
  border-radius: 5px;
  display: inline-block;
  transition: all 0.12s ease;
  position: relative;
}
.checkbox-wrap input:checked + .checkbox-box {
  background: #6366f1;
  border-color: #6366f1;
}
.checkbox-wrap input:checked + .checkbox-box::after {
  content: "";
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Avatar */
.avatar-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a5b4fc, #6366f1);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Badge */
.badge-soft {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

/* Row action icons */
.btn-icon {
  border: none;
  background: transparent;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 2px;
  transition: background 0.12s ease;
}
.btn-icon-warning {
  color: #d97706;
}
.btn-icon-warning:hover {
  background: #fffbeb;
}
.btn-icon-danger {
  color: #dc2626;
}
.btn-icon-danger:hover {
  background: #fef2f2;
}

/* Table footer / pagination */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem 1.4rem;
  border-top: 1px solid #f1f2f6;
}
.btn-page {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}
.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-indicator {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 600;
  padding: 0 0.4rem;
}

/* Modal */
.modern-modal {
  border-radius: 16px;
  overflow: hidden;
  border: none;
}
.modern-modal .modal-header {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border: none;
}
.modern-modal .modal-footer {
  border-top: 1px solid #f1f5f9;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>