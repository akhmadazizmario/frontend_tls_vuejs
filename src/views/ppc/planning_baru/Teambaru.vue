<template>
  <div class="d-flex flex-column min-vh-100 bg-light mt-3">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-5 transition-all" :style="{ marginLeft: sidebarOpen ? '16rem' : '0' }">
        <!-- Header Page Title & Primary Actions -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div class="d-flex align-items-center gap-3">
            <div class="page-title-icon">
              <i class="bi bi-people-fill"></i>
            </div>
            <div>
              <h2 class="h4 fw-bold text-dark mb-0">Master Team Target</h2>
              <p class="text-muted small mb-0">Kelola Data Tim, Kapasitas Orang & Akumulasi Sisa Per Hari</p>
            </div>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-2">
            <button class="btn btn-primary-custom" @click="openCreateModal">
              <i class="bi bi-plus-lg me-1"></i> Tambah Tim Target
            </button>
          </div>
        </div>

        <!-- Filter & Search Section -->
        <div class="card border-0 shadow-sm mb-4 rounded-4 filter-card">
          <div class="card-body p-3 p-md-4">
            <div class="row g-3 align-items-end">
              <div class="col-12 col-md-4">
                <label class="form-label-modern">Filter Tanggal Planning (Per Hari)</label>
                <div class="input-group">
                  <input type="date" v-model="filterDate" class="form-control form-control-modern" @change="fetchData" />
                  <button v-if="filterDate" class="btn btn-outline-secondary" type="button" @click="clearDateFilter">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <div class="form-text text-muted small" style="font-size: 0.72rem;">
                  *Sisa orang diakumulasi berdasarkan tanggal yang dipilih
                </div>
              </div>

              <div class="col-12 col-md-5">
                <label class="form-label-modern">Cari Tim / Dept</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0 border-modern"><i class="bi bi-search text-muted"></i></span>
                  <input type="text" v-model="searchQuery" class="form-control form-control-modern border-start-0" placeholder="Ketik nama tim..." />
                </div>
              </div>

              <div class="col-12 col-md-3 text-md-end d-flex gap-2 justify-content-end">
                <button v-if="activeColumnFilterCount > 0" class="btn btn-outline-secondary" type="button" @click="resetColumnFilters" title="Bersihkan semua filter kolom">
                  <i class="bi bi-x-circle me-1"></i> Filter ({{ activeColumnFilterCount }})
                </button>
                <button class="btn btn-reload flex-grow-1 justify-content-center" @click="fetchData" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i> Reload Data
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Table Loading Overlay -->
        <div v-if="loading" class="loading-overlay rounded-4">
          <div class="loading-content">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
            <div class="fw-semibold text-primary">Memuat data tim...</div>
          </div>
        </div>

        <!-- Team Data Table -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="table-responsive table-container custom-scrollbar">
            <table class="table table-hover align-middle mb-0 custom-table">
              <thead class="table-light sticky-header">
                <tr>
                  <th class="text-center" style="width: 70px;">ID</th>

                  <th style="min-width: 200px;">
                    <div class="th-filter-wrapper">
                      <div class="th-filter-label" @click.stop="toggleFilterDropdown('nama_team')">
                        <span>Nama Team</span>
                        <i class="bi" :class="columnFilters.nama_team.length ? 'bi-funnel-fill text-primary' : 'bi-funnel'"></i>
                        <span v-if="columnFilters.nama_team.length" class="th-filter-count">{{ columnFilters.nama_team.length }}</span>
                      </div>
                      <div v-if="openFilterCol === 'nama_team'" class="th-filter-dropdown" @click.stop>
                        <input type="text" v-model="filterSearchText.nama_team" class="th-filter-search" placeholder="Cari nama team..." />
                        <div class="th-filter-actions">
                          <button type="button" @click="selectAllFilter('nama_team', filteredNamaTeamOptions)">Pilih Semua</button>
                          <button type="button" @click="clearFilter('nama_team')">Bersihkan</button>
                        </div>
                        <div class="th-filter-list custom-scrollbar">
                          <label v-for="opt in filteredNamaTeamOptions" :key="opt" class="th-filter-item">
                            <input type="checkbox" :value="opt" v-model="columnFilters.nama_team" />
                            <span>{{ opt }}</span>
                          </label>
                          <div v-if="filteredNamaTeamOptions.length === 0" class="th-filter-empty">Tidak ada data</div>
                        </div>
                      </div>
                    </div>
                  </th>

                  <th class="text-center" style="min-width: 150px;">
                    <div class="th-filter-wrapper">
                      <div class="th-filter-label justify-content-center" @click.stop="toggleFilterDropdown('rDept')">
                        <span>Dept ID</span>
                        <i class="bi" :class="columnFilters.rDept.length ? 'bi-funnel-fill text-primary' : 'bi-funnel'"></i>
                        <span v-if="columnFilters.rDept.length" class="th-filter-count">{{ columnFilters.rDept.length }}</span>
                      </div>
                      <div v-if="openFilterCol === 'rDept'" class="th-filter-dropdown" @click.stop>
                        <input type="text" v-model="filterSearchText.rDept" class="th-filter-search" placeholder="Cari dept..." />
                        <div class="th-filter-actions">
                          <button type="button" @click="selectAllFilter('rDept', filteredDeptFilterOptions.map(d => d.kode))">Pilih Semua</button>
                          <button type="button" @click="clearFilter('rDept')">Bersihkan</button>
                        </div>
                        <div class="th-filter-list custom-scrollbar">
                          <label v-for="dept in filteredDeptFilterOptions" :key="dept.kode" class="th-filter-item">
                            <input type="checkbox" :value="dept.kode" v-model="columnFilters.rDept" />
                            <span>{{ dept.nama }}</span>
                          </label>
                          <div v-if="filteredDeptFilterOptions.length === 0" class="th-filter-empty">Tidak ada data</div>
                        </div>
                      </div>
                    </div>
                  </th>

                  <th class="text-center" style="min-width: 160px;">
                    <div class="th-filter-wrapper">
                      <div class="th-filter-label justify-content-center" @click.stop="toggleFilterDropdown('jml_org')">
                        <span>Kapasitas (Jml Org)</span>
                        <i class="bi" :class="columnFilters.jml_org.length ? 'bi-funnel-fill text-primary' : 'bi-funnel'"></i>
                        <span v-if="columnFilters.jml_org.length" class="th-filter-count">{{ columnFilters.jml_org.length }}</span>
                      </div>
                      <div v-if="openFilterCol === 'jml_org'" class="th-filter-dropdown" @click.stop>
                        <input type="text" v-model="filterSearchText.jml_org" class="th-filter-search" placeholder="Cari jumlah..." />
                        <div class="th-filter-actions">
                          <button type="button" @click="selectAllFilter('jml_org', filteredKapasitasOptions)">Pilih Semua</button>
                          <button type="button" @click="clearFilter('jml_org')">Bersihkan</button>
                        </div>
                        <div class="th-filter-list custom-scrollbar">
                          <label v-for="opt in filteredKapasitasOptions" :key="opt" class="th-filter-item">
                            <input type="checkbox" :value="opt" v-model="columnFilters.jml_org" />
                            <span>{{ fmtNum(opt) }}</span>
                          </label>
                          <div v-if="filteredKapasitasOptions.length === 0" class="th-filter-empty">Tidak ada data</div>
                        </div>
                      </div>
                    </div>
                  </th>

                  <th class="text-center" style="min-width: 130px;">Terpakai (7j + 14j)</th>
                  <th class="text-center" style="min-width: 130px;">Sisa Orang</th>
                  <th class="text-center" style="width: 120px;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="team in filteredTeamList" :key="team.id">
                  <td class="text-center font-mono fw-semibold text-muted">{{ team.id }}</td>
                  <td class="fw-bold text-dark">{{ team.nama_team }}</td>
                  <td class="text-center">
                    <span class="badge badge-dept-tag">{{ getDeptName(team.rDept) }}</span>
                  </td>
                  <td class="text-center num-cell fw-semibold text-secondary">{{ fmtNum(team.jml_org) }}</td>
                  <td class="text-center num-cell font-mono fw-bold text-primary">
                    <!-- Tombol Detail Pemakaian -->
                    <button v-if="filterDate && team.used_org > 0" class="btn btn-sm btn-outline-primary fw-bold px-3 py-1 rounded-pill shadow-sm" @click="openDetailModal(team)" title="Lihat detail pemakaian">
                      {{ fmtNum(team.used_org) }}
                    </button>
                    <span v-else>{{ filterDate ? fmtNum(team.used_org) : '-' }}</span>
                  </td>
                  <td class="text-center num-cell">
                    <span :class="getSisaBadgeClass(team.sisa_org, team.jml_org)">
                      {{ filterDate ? fmtNum(team.sisa_org) : fmtNum(team.jml_org) }}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center gap-1">
                      <button class="btn btn-action btn-edit" title="Edit Tim" @click="openEditModal(team)">
                        <i class="bi bi-pencil-fill"></i>
                      </button>
                      <button class="btn btn-action btn-delete" title="Hapus Tim" @click="deleteTeam(team)">
                        <i class="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredTeamList.length === 0">
                  <td colspan="7" class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-2 d-block mb-2 text-muted"></i>
                    Tidak ada data tim yang ditemukan.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal Single Form CRUD (Create / Update) -->
    <div v-if="showModal" class="custom-modal-backdrop" @click.self="closeModal">
      <div class="custom-modal-dialog">
        <div class="custom-modal-content">
          <div class="custom-modal-header">
            <h5 class="fw-bold text-dark mb-0">
              <i :class="isEditMode ? 'bi bi-pencil-square text-warning' : 'bi bi-plus-circle-fill text-primary'" class="me-2"></i>
              {{ isEditMode ? 'Edit Team Target' : 'Tambah Team Target Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <form @submit.prevent="saveTeam">
            <div class="custom-modal-body">
              <div class="mb-3">
                <label class="form-label-modern">Nama Team <span class="text-danger">*</span></label>
                <input type="text" v-model="form.nama_team" class="form-control form-control-modern" placeholder="Contoh: TEAM A, LINKING 1" required />
              </div>

              <div class="mb-3">
                <label class="form-label-modern">Jumlah Orang (Kapasitas Master) <span class="text-danger">*</span></label>
                <input type="number" min="0" v-model.number="form.jml_org" class="form-control form-control-modern" placeholder="0" required />
              </div>

              <div class="mb-3">
                <label class="form-label-modern">Departemen <span class="text-danger">*</span></label>
                <select v-model.number="form.rDept" class="form-control form-control-modern" required>
                  <option value="" disabled>Pilih Departemen</option>
                  <option v-for="dept in deptOptions" :key="dept.kode" :value="dept.kode">
                    {{ dept.nama }}
                  </option>
                </select>
              </div>
            </div>
            <div class="custom-modal-footer">
              <button type="button" class="btn btn-light-custom" @click="closeModal">Batal</button>
              <button type="submit" class="btn btn-primary-custom" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                <i v-else class="bi bi-check-lg me-1"></i> Simpan Data
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL PEMAKAIAN TIM -->
    <div v-if="showDetailModal" class="custom-modal-backdrop" @click.self="closeDetailModal">
      <div class="custom-modal-dialog" style="max-width: 650px;">
        <div class="custom-modal-content">
          <div class="custom-modal-header bg-light">
            <h5 class="fw-bold text-dark mb-0 d-flex align-items-center">
              <i class="bi bi-speedometer2 text-primary me-2"></i>
              Detail Pemakaian Tim
            </h5>
            <button type="button" class="btn-close" @click="closeDetailModal"></button>
          </div>
          <div class="custom-modal-body">
            <!-- Summary Info -->
            <div class="d-flex justify-content-between align-items-center mb-3 bg-white border p-3 rounded-3 shadow-sm">
              <div>
                <div class="text-muted small fw-bold text-uppercase">Nama Tim</div>
                <div class="fs-5 fw-bold text-primary">{{ selectedTeamDetail?.nama_team }}</div>
              </div>
              <div class="text-end">
                <div class="text-muted small fw-bold text-uppercase">Tgl Planning</div>
                <div class="fw-bold text-dark">{{ formatDateID(filterDate) }}</div>
              </div>
            </div>

            <!-- Table Detail Data -->
            <div class="table-responsive border rounded-3 custom-scrollbar" style="max-height: 300px;">
              <table class="table table-hover table-sm align-middle mb-0" style="font-size: 0.85rem;">
                <thead class="table-light sticky-top">
                  <tr>
                    <th class="ps-3 py-2">xMark / xPO</th>
                    <th class="py-2">Proses</th>
                    <th class="text-end py-2">Qty Alokasi</th>
                    <th class="text-end pe-3 py-2">Kepakai (Org)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(det, i) in selectedTeamDetail?.details" :key="i">
                    <td class="ps-3">
                      <div class="fw-bold text-dark">{{ det.xMark }}</div>
                      <div class="text-muted" style="font-size: 0.7rem;">{{ det.xPO }}</div>
                    </td>
                    <td>
                      <span class="badge bg-secondary opacity-75">{{ det.nama_work }}</span>
                    </td>
                    <td class="text-end fw-semibold text-muted">
                      {{ fmtNum(det.qty_plan_perteam) }}
                    </td>
                    <td class="text-end pe-3">
                      <span class="badge bg-primary rounded-pill px-2 py-1 fs-6 shadow-sm">
                        {{ (Number(det.worker_7jam) || 0) + (Number(det.worker_14jam) || 0) }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!selectedTeamDetail?.details || selectedTeamDetail.details.length === 0">
                    <td colspan="4" class="text-center py-4 text-muted">
                      <i class="bi bi-inbox fs-4 d-block mb-1 opacity-50"></i>
                      Tidak ada detail pemakaian.
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="selectedTeamDetail?.details?.length > 0" class="table-light sticky-bottom">
                  <tr>
                    <td colspan="3" class="text-end fw-bold py-2">TOTAL TERPAKAI:</td>
                    <td class="text-end pe-3 py-2 fw-bold text-primary fs-6">{{ fmtNum(selectedTeamDetail?.used_org) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div class="custom-modal-footer">
            <button type="button" class="btn btn-light-custom w-100" @click="closeDetailModal">Tutup Preview</button>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE_URL}/planppcbaru`;

const sidebarOpen = ref(true);
const loading = ref(false);
const submitting = ref(false);
const user = ref({ name: "User" });

const teamList = ref([]);
const filterDate = ref(new Date().toISOString().split('T')[0]); 
const searchQuery = ref("");

// CRUD Modal States
const showModal = ref(false);
const isEditMode = ref(false);
const form = reactive({ id: null, nama_team: "", jml_org: 0, rDept: "" });

// Detail Modal States
const showDetailModal = ref(false);
const selectedTeamDetail = ref(null);

const deptOptions = [
  { kode: 10114, nama: "Sewing" },
  { kode: 10115, nama: "Steam" },
  { kode: 10161, nama: "Linking TLS" },
  { kode: 10182, nama: "CBS" },
  { kode: 10221, nama: "Soom Sontex" },
  { kode: 10266, nama: "Sulam" },
  { kode: 10251, nama: "LO" },
  { kode: 10265, nama: "QC Lampu" }
];

const getDeptName = (kode) => {
  const found = deptOptions.find(d => d.kode === Number(kode));
  return found ? found.nama : (kode || '-');
};

const formatDateID = (dateStr) => {
  if (!dateStr) return "-";
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

// ===== Filter Kolom (Checkbox + Search) di Header Tabel =====
const openFilterCol = ref(null); 
const columnFilters = reactive({ nama_team: [], rDept: [], jml_org: [] });
const filterSearchText = reactive({ nama_team: "", rDept: "", jml_org: "" });

const toggleFilterDropdown = (col) => { openFilterCol.value = openFilterCol.value === col ? null : col; };
const clearFilter = (col) => { columnFilters[col] = []; filterSearchText[col] = ""; };
const selectAllFilter = (col, visibleValues) => {
  const merged = new Set([...columnFilters[col], ...visibleValues]);
  columnFilters[col] = Array.from(merged);
};
const resetColumnFilters = () => {
  columnFilters.nama_team = []; columnFilters.rDept = []; columnFilters.jml_org = [];
  filterSearchText.nama_team = ""; filterSearchText.rDept = ""; filterSearchText.jml_org = "";
};
const activeColumnFilterCount = computed(() => columnFilters.nama_team.length + columnFilters.rDept.length + columnFilters.jml_org.length);

const namaTeamOptions = computed(() => {
  const set = new Set(teamList.value.map(t => t.nama_team).filter(v => v !== null && v !== undefined && v !== ''));
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
});
const filteredNamaTeamOptions = computed(() => {
  if (!filterSearchText.nama_team) return namaTeamOptions.value;
  const q = filterSearchText.nama_team.toLowerCase();
  return namaTeamOptions.value.filter(o => String(o).toLowerCase().includes(q));
});

const deptFilterOptions = computed(() => {
  const set = new Set(teamList.value.map(t => Number(t.rDept)).filter(v => !Number.isNaN(v)));
  return Array.from(set).map(kode => ({ kode, nama: getDeptName(kode) })).sort((a, b) => a.nama.localeCompare(b.nama));
});
const filteredDeptFilterOptions = computed(() => {
  if (!filterSearchText.rDept) return deptFilterOptions.value;
  const q = filterSearchText.rDept.toLowerCase();
  return deptFilterOptions.value.filter(d => d.nama.toLowerCase().includes(q) || String(d.kode).includes(q));
});

const kapasitasOptions = computed(() => {
  const set = new Set(teamList.value.map(t => Number(t.jml_org)).filter(v => !Number.isNaN(v)));
  return Array.from(set).sort((a, b) => a - b);
});
const filteredKapasitasOptions = computed(() => {
  if (!filterSearchText.jml_org) return kapasitasOptions.value;
  const q = filterSearchText.jml_org.toLowerCase();
  return kapasitasOptions.value.filter(o => String(o).toLowerCase().includes(q) || fmtNum(o).toLowerCase().includes(q));
});

const handleClickOutside = (e) => {
  if (!e.target.closest('.th-filter-wrapper')) {
    openFilterCol.value = null;
  }
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};
const fmtNum = (v) => {
  if (v === null || v === undefined || v === '') return '0';
  const n = Number(v); return Number.isNaN(n) ? '0' : n.toLocaleString('id-ID');
};

const clearDateFilter = () => { filterDate.value = ""; fetchData(); };

const getSisaBadgeClass = (sisa, total) => {
  if (!filterDate.value) return 'badge-sisa badge-sisa-normal';
  const val = Number(sisa) || 0;
  if (val <= 0) return 'badge-sisa badge-sisa-danger';
  if (val < (Number(total) * 0.2)) return 'badge-sisa badge-sisa-warning';
  return 'badge-sisa badge-sisa-success';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filterDate.value) {
      params.tgl_plan = filterDate.value;
    }

    // 1. Ambil list tim beserta kalkulasi sisa & terpakai
    const res = await axios.get(`${API}/team-target`, { params });
    let teams = res.data?.data || [];

    // 2. Jika ada filter tanggal, ambil detail pemakaian (agar bisa di-preview di Modal)
    if (filterDate.value) {
      const capRes = await axios.get(`${API}/capacity-detail`, {
        params: { tgl_dari: filterDate.value, tgl_sampai: filterDate.value }
      });
      const capacityData = capRes.data?.data || [];
      
      // Sisipkan array detail ke dalam object masing-masing tim
      teams = teams.map(t => {
        const details = capacityData.filter(c => c.team_id === t.id && c.xMark);
        return { ...t, details };
      });
    } else {
      teams = teams.map(t => ({ ...t, details: [] }));
    }

    teamList.value = teams;
  } catch (error) {
    Swal.fire('Error', 'Gagal memuat data team: ' + (error.response?.data?.message || error.message), 'error');
  } finally {
    loading.value = false;
  }
};

const filteredTeamList = computed(() => {
  let list = teamList.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(item =>
      String(item.nama_team || '').toLowerCase().includes(q) ||
      String(item.rDept || '').toLowerCase().includes(q) ||
      getDeptName(item.rDept).toLowerCase().includes(q) ||
      String(item.id || '').includes(q)
    );
  }
  if (columnFilters.nama_team.length) list = list.filter(item => columnFilters.nama_team.includes(item.nama_team));
  if (columnFilters.rDept.length) list = list.filter(item => columnFilters.rDept.includes(Number(item.rDept)));
  if (columnFilters.jml_org.length) list = list.filter(item => columnFilters.jml_org.includes(Number(item.jml_org)));
  return list;
});

// Aksi Modal Form
const openCreateModal = () => {
  isEditMode.value = false; form.id = null; form.nama_team = ""; form.jml_org = 0; form.rDept = "";
  showModal.value = true;
};
const openEditModal = (item) => {
  isEditMode.value = true; form.id = item.id; form.nama_team = item.nama_team; form.jml_org = item.jml_org; form.rDept = item.rDept;
  showModal.value = true;
};
const closeModal = () => { showModal.value = false; };

// Aksi Modal Detail Pemakaian
const openDetailModal = (team) => {
  selectedTeamDetail.value = team;
  showDetailModal.value = true;
};
const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedTeamDetail.value = null;
};

const saveTeam = async () => {
  if (!form.nama_team || form.jml_org === null || !form.rDept) {
    Swal.fire('Peringatan', 'Harap isi semua bidang wajib.', 'warning');
    return;
  }
  submitting.value = true;
  try {
    if (isEditMode.value) {
      await axios.put(`${API}/team-target`, form);
      Swal.fire('Berhasil', 'Data team berhasil diperbarui.', 'success');
    } else {
      await axios.post(`${API}/team-target`, form);
      Swal.fire('Berhasil', 'Team target baru berhasil ditambahkan.', 'success');
    }
    closeModal(); fetchData();
  } catch (error) {
    Swal.fire('Gagal', 'Terjadi kesalahan: ' + (error.response?.data?.message || error.message), 'error');
  } finally {
    submitting.value = false;
  }
};

const deleteTeam = (team) => {
  Swal.fire({
    title: 'Hapus Team Target?', text: `Apakah Anda yakin ingin menghapus "${team.nama_team}"?`, icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#c4402a', cancelButtonColor: '#8891a0', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API}/team-target/${team.id}`);
        Swal.fire('Terhapus!', 'Data team berhasil dihapus.', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Gagal', 'Gagal menghapus data: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  });
};

onMounted(() => { document.addEventListener('click', handleClickOutside); fetchData(); });
onUnmounted(() => { document.removeEventListener('click', handleClickOutside); });
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

.d-flex.flex-column.min-vh-100 {
  --ink: #101828; --ink-soft: #5b6472; --ink-faint: #8891a0; --bg: #f2f4f8;
  --border: #e3e7ee; --primary: #185c6e; --primary-dark: #123f4b; --primary-soft: #e3f0f2;
  --success: #1f8a5f; --success-soft: #e3f6ec; --warning: #b8720a; --warning-soft: #fbeedd;
  --danger: #c4402a; --danger-soft: #fdecea;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ink); background: var(--bg);
}

.font-mono, .num-cell { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
.page-title-icon { width: 46px; height: 46px; border-radius: 13px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; box-shadow: 0 4px 14px rgba(18, 63, 75, 0.28); }

.form-label-modern { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-soft); margin-bottom: 5px; display: block; }
.form-control-modern { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.5rem 0.85rem; font-weight: 600; color: var(--ink); font-size: 0.85rem; }
.form-control-modern:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
.border-modern { border: 1.5px solid var(--border); border-radius: 10px 0 0 10px; }

.btn-primary-custom { background: var(--primary); color: #fff; border: none; border-radius: 10px; padding: 0.55rem 1.2rem; font-weight: 600; font-size: 0.85rem; }
.btn-primary-custom:hover:not(:disabled) { background: var(--primary-dark); }
.btn-light-custom { background: var(--bg); color: var(--ink-soft); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.55rem 1.2rem; font-weight: 600; font-size: 0.85rem; }
.btn-reload { background: var(--primary-soft); color: var(--primary-dark); border: none; border-radius: 10px; padding: 0.55rem 1.2rem; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; }
.btn-reload:hover:not(:disabled) { background: var(--primary); color: #fff; }

.table-container { min-height: 380px; max-height: 70vh; }
.sticky-header th { position: sticky; top: 0; background-color: #f8f9fb; z-index: 10; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--ink-soft); padding: 0.75rem 0.5rem; }
.custom-table tbody td { font-size: 0.85rem; padding: 0.65rem 0.5rem; border-color: var(--border); }
.badge-dept-tag { background: var(--primary-soft); color: var(--primary-dark); font-weight: 700; padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; }

/* Th Filter Dropdown (Checkbox + Search) */
.th-filter-wrapper { position: relative; display: inline-block; width: 100%; }
.th-filter-label { display: flex; align-items: center; gap: 5px; cursor: pointer; user-select: none; }
.th-filter-label:hover { color: var(--primary); }
.th-filter-label i { font-size: 0.75rem; }
.th-filter-count { background: var(--primary); color: #fff; font-size: 0.62rem; font-weight: 700; border-radius: 10px; padding: 1px 6px; line-height: 1.3; }
.th-filter-dropdown { position: absolute; top: calc(100% + 6px); left: 0; z-index: 50; width: 230px; background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 12px 28px rgba(16, 24, 40, 0.18); padding: 10px; text-align: left; text-transform: none; font-weight: 400; }
.th-filter-search { width: 100%; border: 1.5px solid var(--border); border-radius: 8px; padding: 0.4rem 0.6rem; font-size: 0.8rem; margin-bottom: 8px; color: var(--ink); }
.th-filter-search:focus { outline: none; border-color: var(--primary); }
.th-filter-actions { display: flex; justify-content: space-between; gap: 6px; margin-bottom: 8px; }
.th-filter-actions button { flex: 1; border: none; background: var(--primary-soft); color: var(--primary-dark); font-size: 0.7rem; font-weight: 700; border-radius: 7px; padding: 4px 6px; text-transform: none; cursor: pointer; }
.th-filter-actions button:hover { background: var(--primary); color: #fff; }
.th-filter-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.th-filter-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 500; color: var(--ink); padding: 5px 6px; border-radius: 6px; cursor: pointer; text-transform: none; }
.th-filter-item:hover { background: var(--bg); }
.th-filter-item input[type="checkbox"] { flex-shrink: 0; accent-color: var(--primary); width: 14px; height: 14px; }
.th-filter-empty { text-align: center; color: var(--ink-faint); font-size: 0.78rem; padding: 10px 0; text-transform: none; }
.badge-sisa { font-family: 'JetBrains Mono', monospace; font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; display: inline-block; min-width: 50px; }
.badge-sisa-normal { background: #eceff3; color: var(--ink); }
.badge-sisa-success { background: var(--success-soft); color: var(--success); }
.badge-sisa-warning { background: var(--warning-soft); color: var(--warning); }
.badge-sisa-danger { background: var(--danger-soft); color: var(--danger); }

.btn-action { width: 32px; height: 32px; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; transition: all 0.15s; }
.btn-edit { background: var(--warning-soft); color: var(--warning); }
.btn-edit:hover { background: var(--warning); color: #fff; }
.btn-delete { background: var(--danger-soft); color: var(--danger); }
.btn-delete:hover { background: var(--danger); color: #fff; }
.loading-overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(3px); z-index: 100; display: flex; align-items: center; justify-content: center; }
.loading-content { display: flex; flex-direction: column; align-items: center; background: white; padding: 2rem 3rem; border-radius: 1.25rem; box-shadow: 0 8px 32px rgba(16, 24, 40, 0.12); }

/* Custom Modal Styling */
.custom-modal-backdrop { position: fixed; inset: 0; background: rgba(16, 24, 40, 0.5); backdrop-filter: blur(2px); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.custom-modal-dialog { width: 100%; max-width: 480px; background: #fff; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); overflow: hidden; animation: modalFadeIn 0.2s ease-out; }
.custom-modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.custom-modal-body { padding: 1.5rem; }
.custom-modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); background: #f8f9fb; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>