<template>
  <div class="d-flex flex-column min-vh-100 bg-soft-f8">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-4 p-lg-5 transition-all"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          marginTop: '64px',
        }"
      >
        <div class="container-fluid py-2">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 animate__animated animate__fadeIn">
            <div class="mb-3 mb-md-0">
              <h2 class="fw-bold text-dark-emphasis mb-1">🧹 Manajemen Category Cleaning</h2>
              <p class="text-muted small mb-0 text-uppercase tracking-wider">Kelola kategori area kebersihan sistem</p>
            </div>
            <button
              class="btn btn-primary-gradient shadow-sm px-4 py-2 rounded-3 d-flex align-items-center gap-2"
              data-bs-toggle="modal"
              data-bs-target="#categoryModal"
              @click="openAddModal"
            >
              <i class="bi bi-plus-lg"></i> 
              <span>Tambah Category</span>
            </button>
          </div>

          <div class="row g-3 mb-4 animate__animated animate__fadeInUp">
            <div class="col-md-4">
              <div class="card border-0 shadow-sm rounded-4 p-3 stats-card h-100">
                <div class="d-flex align-items-center">
                  <div class="icon-box bg-primary-subtle text-primary rounded-3 me-3">
                    <i class="bi bi-tag-fill fs-4"></i>
                  </div>
                  <div>
                    <h6 class="text-muted mb-0 small">Total Kategori</h6>
                    <h4 class="fw-bold mb-0">{{ items.length }}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-8">
              <div class="card border-0 shadow-sm rounded-4 p-3 h-100">
                <div class="input-group shadow-none border rounded-3 overflow-hidden">
                  <span class="input-group-text bg-white border-0 text-muted">
                    <i class="bi bi-search"></i>
                  </span>
                  <input 
                    v-model="searchQuery" 
                    type="text" 
                    class="form-control border-0 ps-0 shadow-none" 
                    placeholder="Cari nama kategori..."
                    @input="currentPage = 1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-soft rounded-4 overflow-hidden animate__animated animate__fadeInUp">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead class="bg-light-blue">
                  <tr>
                    <th class="ps-4 py-3 text-secondary small text-uppercase">No</th>
                    <th class="py-3 text-secondary small text-uppercase">Nama Category</th>
                    <th class="py-3 text-secondary small text-uppercase">Status</th>
                    <th class="pe-4 py-3 text-secondary small text-uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in paginatedItems" :key="item.id" class="table-row">
                    <td class="ps-4 fw-medium text-muted">
                      {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                    </td>
                    <td>
                      <span class="fw-semibold text-dark-emphasis">{{ item.name }}</span>
                    </td>
                    <td>
                      <span :class="item.is_active ? 'badge-active' : 'badge-inactive'">
                        {{ item.is_active ? 'Aktif' : 'Non-Aktif' }}
                      </span>
                    </td>
                    <td class="pe-4 text-center">
                      <div class="btn-group gap-2">
                        <button
                          class="btn btn-icon btn-edit shadow-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#categoryModal"
                          @click="openEditModal(item)"
                        >
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-icon btn-delete shadow-sm" @click="confirmDelete(item.id)">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="paginatedItems.length === 0">
                    <td colspan="4" class="text-center py-5 text-muted">
                      <div class="py-3">
                        <i class="bi bi-inbox fs-1 opacity-25 d-block mb-3"></i>
                        <p class="mb-0">Tidak ada data kategori ditemukan</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="filteredItems.length > 0" class="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 px-2 animate__animated animate__fadeIn">
            <div class="text-muted small mb-3 mb-md-0">
              Menampilkan <strong>{{ startIndex + 1 }}</strong> - <strong>{{ Math.min(endIndex, filteredItems.length) }}</strong> dari <strong>{{ filteredItems.length }}</strong> data
            </div>
            <nav v-if="totalPages > 1">
              <ul class="pagination pagination-sm mb-0 shadow-sm">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <button class="page-link px-3" @click="currentPage--"><i class="bi bi-chevron-left"></i></button>
                </li>
                <li 
                  v-for="page in totalPages" 
                  :key="page" 
                  class="page-item" 
                  :class="{ active: currentPage === page }"
                >
                  <button class="page-link px-3" @click="currentPage = page">{{ page }}</button>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <button class="page-link px-3" @click="currentPage++"><i class="bi bi-chevron-right"></i></button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </main>
    </div>

    <Footer />

    <div class="modal fade" id="categoryModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header border-0 bg-light p-4">
            <h5 class="fw-bold mb-0">
              {{ editMode ? '✏️ Edit Kategori' : '✨ Tambah Kategori Baru' }}
            </h5>
            <button class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body p-4">
            <form @submit.prevent="saveItem">
              <div class="mb-4">
                <label class="form-label fw-bold small text-muted text-uppercase tracking-wide">Nama Kategori</label>
                <div class="input-group border rounded-3 overflow-hidden">
                  <span class="input-group-text bg-white border-0"><i class="bi bi-tag"></i></span>
                  <input v-model="form.name" class="form-control border-0 shadow-none ps-0" placeholder="Contoh: Toilet Lobby" required />
                </div>
              </div>

              <div class="p-3 rounded-3 bg-light d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h6 class="mb-0 fw-bold">Status Aktif</h6>
                  <p class="small text-muted mb-0">Tentukan apakah kategori ini tersedia</p>
                </div>
                <div class="form-check form-switch fs-4">
                  <input type="checkbox" class="form-check-input cursor-pointer" v-model="form.is_active" />
                </div>
              </div>

              <div class="d-flex gap-2 justify-content-end">
                <button type="button" class="btn btn-light px-4 rounded-3 fw-semibold" data-bs-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-primary px-4 rounded-3 fw-semibold shadow-sm" data-bs-dismiss="modal">
                  {{ editMode ? 'Update Data' : 'Simpan Data' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL;

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(true);
const windowWidth = ref(window.innerWidth);

// SEARCH & PAGINATION STATES
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;

const editMode = ref(false);
const form = ref({
  id: null,
  name: "",
  is_active: true
});

// --- COMPUTED LOGIC ---

// 1. Filter items berdasarkan input search (Nama)
const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value;
  return items.value.filter(item => 
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 2. Hitung total halaman
const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / itemsPerPage);
});

// 3. Ambil data per halaman (Paginated)
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => startIndex.value + itemsPerPage);

const paginatedItems = computed(() => {
  return filteredItems.value.slice(startIndex.value, endIndex.value);
});

// --- METHODS ---

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

async function loadItems() {
  try {
    const res = await axios.get(`${API}/categoriescleaning`);
    items.value = res.data;
  } catch (err) {
    console.error("Gagal memuat data:", err);
  }
}

function openAddModal() {
  editMode.value = false;
  form.value = { id: null, name: "", is_active: true };
}

function openEditModal(item) {
  editMode.value = true;
  form.value = { ...item };
}

async function saveItem() {
  try {
    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    if (editMode.value) {
      await axios.put(`${API}/categoriescleaning/${form.value.id}`, form.value);
    } else {
      await axios.post(`${API}/categoriescleaning`, form.value);
    }
    
    Swal.fire({ icon: 'success', title: 'Berhasil!', timer: 1500, showConfirmButton: false });
    loadItems();
  } catch {
    Swal.fire("Error", "Gagal menyimpan data", "error");
  }
}

async function confirmDelete(id) {
  const result = await Swal.fire({
    title: 'Hapus Kategori?',
    text: "Data ini tidak bisa dikembalikan!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API}/categoriescleaning/${id}`);
      Swal.fire('Terhapus!', 'Kategori telah dihapus.', 'success');
      loadItems();
    } catch {
      Swal.fire('Error', 'Gagal menghapus data', 'error');
    }
  }
}

onMounted(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) user.value = JSON.parse(storedUser);
  loadItems();
  window.addEventListener('resize', () => windowWidth.value = window.innerWidth);
});
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');

.bg-soft-f8 { background-color: #f8f9fc; }
.transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

.tracking-wider { letter-spacing: 0.05em; }
.cursor-pointer { cursor: pointer; }

/* Buttons Custom */
.btn-primary-gradient {
  background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
  border: none;
  color: white;
  transition: transform 0.2s;
}
.btn-primary-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 115, 223, 0.3);
}

/* Pagination Style */
.pagination .page-link {
  border: none;
  color: #64748b;
  margin: 0 2px;
  border-radius: 8px !important;
  transition: all 0.2s;
}
.pagination .page-item.active .page-link {
  background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(78, 115, 223, 0.3);
}
.pagination .page-link:hover:not(.active) {
  background-color: #e2e8f0;
}

/* Icon Box */
.icon-box {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Table Customization */
.shadow-soft { box-shadow: 0 0.75rem 1.5rem rgba(18, 38, 63, 0.03); }
.bg-light-blue { background-color: #f0f4f8; }
.table-row { transition: background-color 0.2s; }
.table-row:hover { background-color: #f8fafd; }

/* Status Badges */
.badge-active {
  background-color: #d1fae5;
  color: #065f46;
  padding: 0.35rem 0.8rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-inactive {
  background-color: #f3f4f6;
  color: #374151;
  padding: 0.35rem 0.8rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Action Buttons */
.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  transition: all 0.2s;
}
.btn-edit { background-color: #fff3cd; color: #856404; }
.btn-edit:hover { background-color: #ffe8a1; color: #533f03; }
.btn-delete { background-color: #f8d7da; color: #721c24; }
.btn-delete:hover { background-color: #f1b0b7; color: #491217; }
</style>