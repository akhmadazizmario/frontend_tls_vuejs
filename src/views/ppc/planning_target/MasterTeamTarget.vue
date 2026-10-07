<template>
  <div class="app-layout min-vh-100 bg-light">
    <!-- Header -->
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <!-- Sidebar -->
    <Sidebar :isOpen="sidebarOpen" />

    <!-- Content Wrapper -->
    <div 
      class="content-wrapper d-flex flex-column min-vh-100"
      :style="{
        paddingTop: '65px',
        marginLeft: sidebarOpen ? '250px' : '0px',
        transition: 'margin-left 0.3s ease-in-out'
      }"
    >
      <main class="flex-grow-1 p-3 p-md-4">
        <div class="container-fluid">
          
          <!-- Page Title Bar -->
          <div class="card border-0 shadow-sm rounded-3 mb-4">
            <div class="card-body p-3 p-md-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
              <div>
                <h4 class="fw-bold mb-1 text-dark">Master Target Tim</h4>
                <p class="text-muted small mb-0">Kelola alokasi jumlah personil, departemen, dan kapasitas tim PPC</p>
              </div>
              <div>
                <button 
                  @click="openModal('create')" 
                  class="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
                >
                  <i class="bi bi-plus-lg"></i>
                  <span>Tambah Tim Baru</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="row g-3 mb-4">
            <div class="col-12 col-md-4">
              <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-body d-flex align-items-center gap-3">
                  <div class="bg-primary-subtle text-primary p-3 rounded-3 fs-4">
                    <i class="bi bi-people-fill"></i>
                  </div>
                  <div>
                    <span class="text-muted text-uppercase fw-bold text-xs">Total Tim Registered</span>
                    <h3 class="fw-bold mb-0 text-dark">{{ teamList.length }} <span class="fs-6 fw-normal text-muted">Tim</span></h3>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-md-4">
              <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-body d-flex align-items-center gap-3">
                  <div class="bg-success-subtle text-success p-3 rounded-3 fs-4">
                    <i class="bi bi-person-check-fill"></i>
                  </div>
                  <div>
                    <span class="text-muted text-uppercase fw-bold text-xs">Total Personil</span>
                    <h3 class="fw-bold mb-0 text-dark">{{ totalPersonil }} <span class="fs-6 fw-normal text-muted">Orang</span></h3>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-md-4">
              <div class="card border-0 shadow-sm rounded-3 h-100">
                <div class="card-body d-flex align-items-center gap-3">
                  <div class="bg-warning-subtle text-warning p-3 rounded-3 fs-4">
                    <i class="bi bi-speedometer2"></i>
                  </div>
                  <div>
                    <span class="text-muted text-uppercase fw-bold text-xs">Rata-Rata Personil</span>
                    <h3 class="fw-bold mb-0 text-dark">{{ avgPersonil }} <span class="fs-6 fw-normal text-muted">Org/Tim</span></h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Search & Action Bar -->
          <div class="card border-0 shadow-sm rounded-3 mb-4">
            <div class="card-body p-3">
              <div class="row g-2 justify-content-between align-items-center">
                <div class="col-12 col-md-5">
                  <div class="input-group">
                    <span class="input-group-text bg-white border-end-0 text-muted">
                      <i class="bi bi-search"></i>
                    </span>
                    <input
                      v-model="searchQuery"
                      type="text"
                      class="form-control border-start-0 ps-0"
                      placeholder="Cari ID, Nama Tim, atau Kode Dept..."
                    />
                  </div>
                </div>

                <div class="col-12 col-md-auto d-flex gap-2">
                  <button @click="fetchData" class="btn btn-outline-secondary d-flex align-items-center gap-1">
                    <i class="bi bi-arrow-clockwise"></i>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Table -->
          <div class="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr class="text-uppercase text-muted text-xs fw-bold border-bottom">
                    <th class="py-3 px-4">ID</th>
                    <th class="py-3 px-4">Nama Tim</th>
                    <th class="py-3 px-4">Kode Dept</th>
                    <th class="py-3 px-4 text-center">Jml_ORG shift 1</th>
                    <th class="py-3 px-4 text-center">Jml_ORG shift 2</th>
                    <th class="py-3 px-4">Keterangan</th>
                    <th class="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="6" class="text-center py-5 text-muted">
                      <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Memuat data target tim...
                    </td>
                  </tr>

                  <tr v-else-if="filteredTeamList.length === 0">
                    <td colspan="6" class="text-center py-5 text-muted">
                      <i class="bi bi-inbox fs-3 d-block mb-1 text-secondary"></i>
                      <span>Tidak ada data tim ditemukan.</span>
                    </td>
                  </tr>

                  <tr v-else v-for="item in filteredTeamList" :key="item.id">
                    <td class="py-3 px-4">
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold fs-7">
                        #{{ item.id }}
                      </span>
                    </td>
                    <td class="py-3 px-4 fw-semibold text-dark">{{ item.nama_team || '-' }}</td>
                    <td class="py-3 px-4">
                      <span v-if="item.kode_dept" :class="getKodeDeptBadgeClass(item.kode_dept)">
                        {{ getKodeDeptLabel(item.kode_dept) }}
                      </span>
                      <span v-else class="text-muted small">-</span>
                    </td>
                    <td class="py-3 px-4 text-center fw-bold text-dark fs-6">{{ item.jml_org }}</td>
                    <td class="py-3 px-4 text-center fw-bold text-dark fs-6">{{ item.jml_org2 }}</td>
                    <td class="py-3 px-4 text-muted small text-truncate" style="max-width: 200px;">
                      {{ item.keterangan || '-' }}
                    </td>
                    <td class="py-3 px-4 text-center">
                      <div class="btn-group btn-group-sm">
                        <button 
                          @click="openModal('edit', item)" 
                          class="btn btn-outline-warning text-dark border-0"
                          title="Edit"
                        >
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button 
                          @click="deleteData(item.id)" 
                          class="btn btn-outline-danger border-0"
                          title="Hapus"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>

    <!-- MODAL FORM (CREATE / EDIT) -->
    <div 
      class="modal fade show d-block bg-dark bg-opacity-50" 
      tabindex="-1" 
      v-if="showModal"
      style="backdrop-filter: blur(2px);"
    >
      <div class="modal-dialog modal-dialog-centered modal-md">
        <div class="modal-content border-0 shadow-lg rounded-3">
          
          <div class="modal-header bg-light border-bottom-0 py-3">
            <h5 class="modal-title fw-bold text-dark">
              {{ isEdit ? 'Edit Target Tim' : 'Tambah Tim Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>

          <form @submit.prevent="saveData">
            <div class="modal-body p-4">
              
              <!-- Nama Tim (Input Teks Bebas) -->
              <div class="mb-3">
                <label class="form-label text-xs fw-bold text-uppercase text-muted">Nama Tim *</label>
                <input
                  v-model="form.nama_team"
                  type="text"
                  class="form-control fw-semibold"
                  placeholder="Ketik nama tim (misal: A, B, C1, Team A, dll)..."
                  required
                />
              </div>

              <!-- Kode Dept (Pilihan Dropdown) -->
              <div class="mb-3">
                <label class="form-label text-xs fw-bold text-uppercase text-muted">Dept *</label>
                <select
                  v-model="form.kode_dept"
                  class="form-select fw-semibold"
                  required
                >
                  <option value="" disabled>Pilih Dept...</option>
                  <option v-for="opt in KODE_DEPT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>

              <!-- Jml Orang -->
              <div class="mb-3">
                <label class="form-label text-xs fw-bold text-uppercase text-muted">Jml Orang *</label>
                <input
                  v-model="form.jml_org"
                  type="number"
                  min="0"
                  required
                  class="form-control fw-semibold"
                  placeholder="Masukkan jumlah orang..."
                />
              </div>

               <!-- Jml Orang -->
              <div class="mb-3">
                <label class="form-label text-xs fw-bold text-uppercase text-muted">Jml Orang 2*</label>
                <input
                  v-model="form.jml_org2"
                  type="number"
                  min="0"
                  required
                  class="form-control fw-semibold"
                  placeholder="Masukkan jumlah orang 2..."
                />
              </div>

              <!-- Keterangan -->
              <div class="mb-2">
                <label class="form-label text-xs fw-bold text-uppercase text-muted">Catatan Keterangan</label>
                <textarea
                  v-model="form.keterangan"
                  rows="2"
                  class="form-control"
                  placeholder="Catatan tambahan..."
                ></textarea>
              </div>

            </div>

            <div class="modal-footer bg-light border-top-0 py-3">
              <button type="button" class="btn btn-secondary text-xs fw-semibold px-3" @click="closeModal">Batal</button>
              <button 
                type="submit" 
                class="btn btn-primary text-xs fw-semibold px-4 d-flex align-items-center gap-1"
                :disabled="submitting"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                <span>{{ submitting ? 'Menyimpan...' : 'Simpan Data' }}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

// Layout Components
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Kode Dept sekarang per-PROSES (bukan cuma F1/L1 lagi), karena tiap proses
// (Linking, Lo, Steam, CBS, Sewing, Soomsontex, QC Lampu, Sulam) punya pool
// tim sendiri-sendiri. Nama tim tetap bebas ditentukan PPC (input teks).
const KODE_DEPT_OPTIONS = [
  { value: 'linking_tls', label: 'Linking' },
  { value: 'LO',          label: 'Lo' },
  { value: 'STEAM',       label: 'Steam' },
  { value: 'CBS',         label: 'CBS' },
  { value: 'SEWING',      label: 'Sewing' },
  { value: 'SOOMSONTEX',  label: 'Soomsontex' },
  { value: 'QCLAMPU',     label: 'QC Lampu' },
  { value: 'SULAM',       label: 'Sulam' }
];
const KODE_DEPT_BADGE_COLORS = [
  'bg-primary-subtle text-primary border border-primary-subtle',
  'bg-success-subtle text-success border border-success-subtle',
  'bg-warning-subtle text-warning border border-warning-subtle',
  'bg-info-subtle text-info border border-info-subtle',
  'bg-danger-subtle text-danger border border-danger-subtle',
  'bg-purple-subtle text-purple border border-purple-subtle',
  'bg-orange-subtle text-orange border border-orange-subtle',
  'bg-secondary-subtle text-secondary border border-secondary-subtle'
];

// Label Helper
const getKodeDeptLabel = (kode) => {
  const found = KODE_DEPT_OPTIONS.find(o => o.value === kode);
  return found ? `${found.value} - ${found.label}` : (kode || '-');
};

const getKodeDeptBadgeClass = (kode) => {
  const idx = KODE_DEPT_OPTIONS.findIndex(o => o.value === kode);
  const color = idx >= 0 ? KODE_DEPT_BADGE_COLORS[idx % KODE_DEPT_BADGE_COLORS.length] : 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  return `badge ${color} text-xs`;
};

// UI & Layout States
const sidebarOpen = ref(true);
const user = ref({ name: "Admin User" });
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};

// Data States
const teamList = ref([]);
const loading = ref(false);
const submitting = ref(false);
const searchQuery = ref("");

// Modal States
const showModal = ref(false);
const isEdit = ref(false);
const form = ref({
  id: null,
  nama_team: "",
  kode_dept: "",
  jml_org: 0,
  jml_org2: 0,
  keterangan: ""
});

// Computed Search Filter
const filteredTeamList = computed(() => {
  return teamList.value.filter(item => {
    const q = searchQuery.value.toLowerCase();
    const kodeDeptText = getKodeDeptLabel(item.kode_dept).toLowerCase();
    
    return (item.id && String(item.id).includes(q)) || 
           (item.nama_team && item.nama_team.toLowerCase().includes(q)) ||
           (item.kode_dept && item.kode_dept.toLowerCase().includes(q)) ||
           kodeDeptText.includes(q);
  });
});

const totalPersonil = computed(() => teamList.value.reduce((sum, item) => sum + (Number(item.jml_org) || 0), 0));
const avgPersonil = computed(() => teamList.value.length ? (totalPersonil.value / teamList.value.length).toFixed(1) : 0);

// Fetch Data API
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/planppc/team-target`);
    if (res.data?.success) teamList.value = res.data.data;
  } catch (err) {
    console.error("Fetch Error:", err);
  } finally {
    loading.value = false;
  }
};

// Modal Handlers
const openModal = (mode, data = null) => {
  isEdit.value = mode === 'edit';
  
  if (isEdit.value && data) {
    // Mengambil data lama saat edit
    form.value = {
      id: data.id,
      nama_team: data.nama_team || "",
      kode_dept: data.kode_dept || "",
      jml_org: data.jml_org || 0,
      jml_org2: data.jml_org2 || 0,
      keterangan: data.keterangan || ""
    };
  } else {
    // Form kosong saat create
    form.value = {
      id: null,
      nama_team: "",
      kode_dept: "",
      jml_org: 0,
      jml_org2: 0,
      keterangan: ""
    };
  }
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

// Save Data (Create / Update)
const saveData = async () => {
  if (!form.value.nama_team.trim()) {
    alert("Nama tim tidak boleh kosong!");
    return;
  }
  if (!form.value.kode_dept) {
    alert("Pilih Kode Dept!");
    return;
  }

  submitting.value = true;
  const payload = { ...form.value };

  try {
    const url = `${API_BASE_URL}/planppc/team-target`;
    if (isEdit.value) {
      await axios.put(url, payload);
    } else {
      await axios.post(url, payload);
    }
    closeModal();
    fetchData();
  } catch (err) {
    alert(err.response?.data?.message || "Gagal menyimpan data");
  } finally {
    submitting.value = false;
  }
};

// Delete Data
const deleteData = async (id) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus data dengan ID #${id}?`)) return;
  try {
    await axios.delete(`${API_BASE_URL}/planppc/team-target/${id}`);
    fetchData();
  } catch (err) {
    const errorMsg = err.response?.data?.message || "Gagal menghapus data";
    alert(errorMsg);
  }
};

onMounted(fetchData);
</script>

<style scoped>
.text-xs { font-size: 0.75rem; }
.fs-7 { font-size: 0.8rem; }

.bg-purple-subtle { background-color: #f1e6fa; }
.text-purple { color: #7c3aad; }
.border-purple-subtle { border-color: #e3cdf5; }
.bg-orange-subtle { background-color: #fbeedd; }
.text-orange { color: #b8720a; }
.border-orange-subtle { border-color: #f6dcb8; }

@media (max-width: 768px) {
  .content-wrapper {
    margin-left: 0 !important;
  }
}
</style>