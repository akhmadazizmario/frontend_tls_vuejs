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
        <div class="container-fluid">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bolder text-dark-blue mb-0">📝 Manajemen Pesanan</h2>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><a href="#" class="text-decoration-none text-muted">Gudang</a></li>
                <li class="breadcrumb-item active">Pesanan</li>
              </ol>
            </nav>
          </div>

          <div class="card border-0 rounded-4 shadow-sm mb-4 p-4 bg-white border-start border-primary border-4">
            <div class="card-body p-0">
              <div class="row g-3 align-items-end">
                <div class="col-12 col-md-3">
                  <label class="form-label small fw-bold text-muted">Cari Barang</label>
                  <input type="text" v-model="filters.nama_barang" placeholder="Ketik nama barang..." class="form-control form-control-sm" />
                </div>
                <div class="col-12 col-md-2">
                  <label class="form-label small fw-bold text-muted">Peminta</label>
                  <input type="text" v-model="filters.peminta" placeholder="Nama personil..." class="form-control form-control-sm" />
                </div>
                <div class="col-12 col-md-2">
                  <label class="form-label small fw-bold text-muted">Status</label>
                  <select v-model="filters.status" class="form-select form-select-sm text-capitalize">
                    <option value="">Semua Status</option>
                    <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div class="col-12 col-md-2">
                  <label class="form-label small fw-bold text-muted">Rentang Tanggal</label>
                  <div class="input-group input-group-sm">
                    <input type="date" v-model="filters.startDate" class="form-control p-1" />
                    <input type="date" v-model="filters.endDate" class="form-control p-1" />
                  </div>
                </div>
                <div class="col-12 col-md-3 d-flex gap-2">
                  <button class="btn btn-primary btn-sm flex-grow-1 shadow-sm" @click="loadItems">
                    <i class="bi bi-search me-1"></i> Cari
                  </button>
                  <button class="btn btn-success btn-sm shadow-sm" @click="exportExcel" title="Export Excel">
                    <i class="bi bi-file-earmark-excel"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" @click="resetFilter">Reset</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card border-0 rounded-4 shadow-sm overflow-hidden bg-white">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary mb-2" role="status"></div>
                <p class="text-muted">Menyinkronkan data...</p>
              </div>
              
              <div v-else class="table-responsive">
                <table id="pesananTable" class="table table-hover mb-0 align-middle">
                  <thead class="bg-light">
                    <tr>
                      <th class="text-center py-3">No</th>
                      <th>Barang</th>
                      <th>Qty</th>
                      <th>Peminta</th>
                      <th>Dept</th>
                      <th>Admin</th>
                      <th>Status</th>
                      <th class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in items" :key="item.id" class="border-bottom">
                      <td class="text-center text-muted small">{{ index + 1 }}</td>
                      <td>
                        <div class="fw-bold text-dark">{{ item.Gudang?.nama_barang || 'Item Terhapus' }}</div>
                        <small class="text-muted" style="font-size: 0.75rem;">{{ formatDate(item.createdAt) }}</small>
                      </td>
                      <td>
                        <span class="badge bg-light text-dark border">{{ item.qty }} {{ item.satuan }}</span>
                      </td>
                      <td class="fw-medium">{{ item.peminta }}</td>
                      <td><span class="text-uppercase small">{{ item.dept_peminta }}</span></td>
                      <td class="small text-muted">{{ item.dibuat_oleh }}</td>
                      <td>
                        <span :class="getStatusBadgeClass(item.status)" class="badge-status">
                          {{ item.status }}
                        </span>
                      </td>
                      <td class="text-center">
                        <div class="btn-group shadow-sm">
                          <button 
                            class="btn btn-sm btn-white border" 
                            data-bs-toggle="modal" 
                            data-bs-target="#statusModal"
                            @click="prepareEdit(item)"
                            v-if="allowedToEdit"
                            title="Update Status"
                          >
                            <i class="bi bi-pencil-square text-warning"></i>
                          </button>
                          <button class="btn btn-sm btn-white border" @click="deleteItem(item.id)" title="Hapus">
                            <i class="bi bi-trash text-danger"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div class="modal fade" id="statusModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-header border-0 pb-0">
            <h6 class="modal-title fw-bold text-dark">Update Status</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal" id="closeStatusModal" aria-label="Close"></button>
          </div>
          <div class="modal-body py-4">
            <div class="mb-4 text-center">
              <div class="small text-muted mb-1">Status Sebelumnya</div>
              <span :class="getStatusBadgeClass(editForm.oldStatus)" class="badge-status">
                {{ editForm.oldStatus }}
              </span>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold">Pilih Status Baru</label>
              <select v-model="editForm.status" class="form-select form-select-sm shadow-sm">
                <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="alert alert-warning small py-2 mb-4 border-0" v-if="['dibatalkan', 'return'].includes(editForm.status)">
              <i class="bi bi-exclamation-triangle-fill me-1"></i> Stok akan dikembalikan ke gudang.
            </div>
            <button @click="updateStatus" class="btn btn-primary w-100 rounded-pill shadow" :disabled="loadingUpdate">
              <span v-if="loadingUpdate" class="spinner-border spinner-border-sm me-1"></span>
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery";
import "datatables.net-bs5";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);
const loadingUpdate = ref(false);
const statusOptions = ['pending', 'diproses', 'selesai', 'dibatalkan', 'return'];

const filters = ref({
  nama_barang: "", peminta: "", status: "", startDate: "", endDate: ""
});

const editForm = ref({ id: null, status: "", oldStatus: "" });

// Hak Akses Computed
const allowedToEdit = computed(() => {
  const dept = user.value.dept?.toLowerCase();
  return ['it', 'administrasi', 'mekanik', 'teknisi'].includes(dept);
});

// --- FUNCTIONS ---
function resetFilter() {
  filters.value = { nama_barang: "", peminta: "", status: "", startDate: "", endDate: "" };
  loadItems();
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusBadgeClass(status) {
  const map = {
    pending: "bg-warning-subtle text-warning-emphasis border-warning",
    diproses: "bg-info-subtle text-info-emphasis border-info",
    selesai: "bg-success-subtle text-success-emphasis border-success",
    dibatalkan: "bg-danger-subtle text-danger-emphasis border-danger",
    return: "bg-secondary-subtle text-secondary-emphasis border-secondary"
  };
  return map[status] || "bg-light border text-muted";
}

async function loadItems() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/pesanan-gudang/web`, { params: filters.value });
    items.value = Array.isArray(res.data) ? res.data : (res.data.data || []);
    reloadDataTable();
  } catch (err) {
    Swal.fire("Gagal", "Kesalahan memuat data", "error");
  } finally {
    loading.value = false;
  }
}

// Menyiapkan data untuk modal (Modal dibuka otomatis via data-bs-target di HTML)
function prepareEdit(item) {
  editForm.value = { 
    id: item.id, 
    status: item.status, 
    oldStatus: item.status 
  };
}

async function updateStatus() {
  if (!editForm.value.id) return;
  
  loadingUpdate.value = true;
  try {
    await axios.put(`${API_BASE_URL}/pesanan-gudang/web/${editForm.value.id}`, {
      status: editForm.value.status,
      user_dept: user.value.dept // Dikirim untuk pengecekan hak akses di backend
    });

    // Tutup modal secara manual via klik tombol close tersembunyi
    document.getElementById('closeStatusModal').click();
    
    Swal.fire({ 
      icon: 'success', 
      title: 'Berhasil', 
      text: 'Status diperbarui', 
      timer: 1500, 
      showConfirmButton: false 
    });
    
    loadItems();
  } catch (err) {
    Swal.fire("Gagal", err.response?.data?.message || "Terjadi kesalahan", "error");
  } finally {
    loadingUpdate.value = false;
  }
}

async function deleteItem(id) {
  const result = await Swal.fire({ 
    title: 'Hapus Pesanan?', 
    text: "Tindakan ini tidak bisa dibatalkan!", 
    icon: 'warning', 
    showCancelButton: true,
    confirmButtonColor: '#d33'
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/pesanan-gudang/web/${id}`);
      Swal.fire("Dihapus", "Pesanan berhasil dihapus", "success");
      loadItems();
    } catch (err) {
      Swal.fire("Gagal", "Gagal menghapus data", "error");
    }
  }
}

async function exportExcel() {
  try {
    const response = await axios.get(`${API_BASE_URL}/pesanan-gudang/export/excel`, {
      params: filters.value,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `Pesanan_Gudang_${new Date().getTime()}.xlsx`;
    link.click();
  } catch (err) {
    Swal.fire("Gagal", "Tidak ada data untuk diekspor", "error");
  }
}

// UI Helpers
function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value; }
function logout() { localStorage.removeItem("user"); window.location.href = "/login"; }

function reloadDataTable() {
  if ($.fn.DataTable.isDataTable("#pesananTable")) $("#pesananTable").DataTable().destroy();
  setTimeout(() => {
    $("#pesananTable").DataTable({ 
      pageLength: 10, 
      searching: true, 
      info: true, 
      lengthChange: false,
      language: { 
        search: "Cari Cepat:",
        paginate: { next: "»", previous: "«" } 
      } 
    });
  }, 50);
}

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  loadItems();
  window.addEventListener("resize", () => { windowWidth.value = window.innerWidth; });
});
</script>

<style scoped>
.bg-light-soft { background-color: #f8f9fc; }
.text-dark-blue { color: #1a237e; }

.badge-status {
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  border: 1px solid currentColor;
  display: inline-block;
}

.table thead th {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: #495057;
  background-color: #f8f9fa;
  border-top: none;
}

.btn-white { background: #fff; }
.btn-white:hover { background: #f1f5f9; }

.card { border: none; }
.breadcrumb-item { font-size: 0.85rem; }

/* Responsive Adjustments */
@media (max-width: 768px) {
  .main { margin-left: 0 !important; }
}
</style>
