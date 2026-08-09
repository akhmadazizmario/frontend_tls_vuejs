<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-5 transition-all"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          marginTop: '64px',
        }"
      >
        <div class="container-fluid">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
            <div>
              <h2 class="fw-bold text-dark-emphasis mb-1">📋 Manajemen Question Cleaning</h2>
              <p class="text-muted small">Distribusi pertanyaan ke berbagai kategori secara massal</p>
            </div>
            <button
              class="btn btn-primary shadow-sm px-4 py-2 rounded-3 d-flex align-items-center gap-2"
              data-bs-toggle="modal"
              data-bs-target="#questionModal"
              @click="openAddModal"
            >
              <i class="bi bi-plus-lg"></i> Tambah Massal
            </button>
          </div>

          <div class="row mb-4">
            <div class="col-md-4">
              <div class="input-group shadow-sm rounded-3 overflow-hidden">
                <span class="input-group-text bg-white border-0 text-muted">
                  <i class="bi bi-search"></i>
                </span>
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  class="form-control border-0 ps-0 shadow-none" 
                  placeholder="Cari pertanyaan atau kategori..."
                  @input="currentPage = 1"
                />
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="px-4 py-3 text-secondary small text-uppercase">No</th>
                    <th class="py-3 text-secondary small text-uppercase">Category</th>
                    <th class="py-3 text-secondary small text-uppercase">Pertanyaan</th>
                    <th class="py-3 text-secondary small text-uppercase text-center">Status</th>
                    <th class="px-4 py-3 text-secondary small text-uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in paginatedItems" :key="item.id" class="border-bottom">
                    <td class="px-4 fw-medium text-muted">
                      {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                    </td>
                    <td>
                      <span class="badge bg-info-subtle text-info px-3 py-2 rounded-pill">
                        {{ item.category?.name || 'No Category' }}
                      </span>
                    </td>
                    <td class="text-dark-emphasis">{{ item.question_text }}</td>
                    <td class="text-center">
                      <div class="form-check form-switch d-inline-block">
                        <input 
                          class="form-check-input cursor-pointer" 
                          type="checkbox" 
                          :checked="item.is_active"
                          @change="toggleStatus(item)"
                        >
                      </div>
                      <div class="small fw-bold" :class="item.is_active ? 'text-success' : 'text-danger'">
                        {{ item.is_active ? 'Active' : 'Inactive' }}
                      </div>
                    </td>
                    <td class="px-4 text-center">
                      <div class="btn-group">
                        <button class="btn btn-outline-warning btn-sm border-0"
                          data-bs-toggle="modal"
                          data-bs-target="#questionModal"
                          @click="openEditModal(item)">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm border-0" @click="deleteItem(item.id)">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="paginatedItems.length === 0">
                    <td colspan="5" class="text-center py-5 text-muted">
                      <i class="bi bi-search fs-2 d-block mb-2 opacity-25"></i>
                      Data tidak ditemukan
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="filteredItems.length > 0" class="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 px-2">
            <div class="text-muted small mb-3 mb-md-0">
              Menampilkan <strong>{{ startIndex + 1 }}</strong> - <strong>{{ Math.min(endIndex, filteredItems.length) }}</strong> dari <strong>{{ filteredItems.length }}</strong> data
            </div>
            <nav v-if="totalPages > 1">
              <ul class="pagination pagination-sm mb-0">
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
  </div>

  <div class="modal fade" id="questionModal" tabindex="-1" aria-hidden="true" ref="modalRef">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4">
        <div class="modal-header border-0 pb-0">
          <h5 class="fw-bold text-dark px-2 pt-2">
            {{ editMode ? '✏️ Edit Question' : '✨ Setup Pertanyaan Massal' }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-4">
          <form @submit.prevent="saveItem">
            
            <div class="mb-4 bg-light p-3 rounded-3" v-if="!editMode">
              <label class="form-label fw-bold text-primary small text-uppercase">1. Pilih Kategori Tujuan</label>
              <div class="row g-2 mt-1 px-2" style="max-height: 150px; overflow-y: auto;">
                <div v-for="cat in categories" :key="cat.id" class="col-md-4 col-6">
                  <div class="form-check custom-check">
                    <input class="form-check-input" type="checkbox" :value="cat.id" v-model="form.category_ids" :id="'cat-'+cat.id">
                    <label class="form-check-label small cursor-pointer" :for="'cat-'+cat.id">{{ cat.name }}</label>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-4 bg-light p-3 rounded-3" v-else>
              <label class="form-label fw-bold text-primary small text-uppercase">Kategori</label>
              <select v-model="form.single_category_id" class="form-select border-0 shadow-sm" required>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold text-primary small text-uppercase d-flex justify-content-between">
                2. Daftar Pertanyaan
                <span v-if="!editMode" class="badge bg-primary-subtle text-primary">{{ form.questions.length }} Baris</span>
              </label>

              <div v-for="(q, idx) in form.questions" :key="idx" class="input-group mb-2 group-animation">
                <span class="input-group-text bg-white border-end-0 text-muted">{{ idx + 1 }}</span>
                <input 
                  type="text" 
                  v-model="form.questions[idx]" 
                  class="form-control border-start-0 shadow-none" 
                  placeholder="Contoh: Apakah lantai sudah dipel?"
                  required
                >
                <button 
                  v-if="form.questions.length > 1 && !editMode" 
                  type="button" 
                  class="btn btn-outline-danger border-start-0" 
                  @click="removeQuestionRow(idx)"
                >
                  <i class="bi bi-dash-circle"></i>
                </button>
              </div>
            </div>

            <button v-if="!editMode" type="button" class="btn btn-dashed w-100 py-2 mb-4" @click="addQuestionRow">
              <i class="bi bi-plus-circle me-2"></i> Tambah Baris Pertanyaan
            </button>

            <div class="form-check form-switch mt-3" v-if="editMode">
              <input type="checkbox" v-model="form.is_active" class="form-check-input" id="statusActive">
              <label class="form-check-label" for="statusActive">Status Aktif</label>
            </div>

            <div class="d-flex gap-2 justify-content-end mt-4">
              <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Batal</button>
              <button 
                type="submit" 
                class="btn btn-primary px-4 shadow fw-bold"
                data-bs-dismiss="modal"
              >
                {{ editMode ? 'Simpan Perubahan' : 'Simpan Semua Data' }}
              </button>
            </div>
          </form>
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
const categories = ref([]);
const user = ref(JSON.parse(localStorage.getItem("user") || '{}'));
const sidebarOpen = ref(true);
const windowWidth = ref(window.innerWidth);
const editMode = ref(false);

// SEARCH & PAGINATION STATES
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;

const form = ref({
  id: null,
  category_ids: [],
  single_category_id: "",
  questions: [""],
  is_active: true
});

// --- COMPUTED LOGIC ---

// 1. Filter items berdasarkan Pertanyaan atau Kategori
const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value;
  const q = searchQuery.value.toLowerCase();
  return items.value.filter(item => 
    item.question_text.toLowerCase().includes(q) || 
    (item.category?.name && item.category.name.toLowerCase().includes(q))
  );
});

// 2. Hitung total halaman
const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / itemsPerPage);
});

// 3. Ambil data per halaman
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => startIndex.value + itemsPerPage);

const paginatedItems = computed(() => {
  return filteredItems.value.slice(startIndex.value, endIndex.value);
});

// --- METHODS ---

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const addQuestionRow = () => form.value.questions.push("");
const removeQuestionRow = (idx) => form.value.questions.splice(idx, 1);

function openAddModal() {
  editMode.value = false;
  form.value = {
    id: null,
    category_ids: [],
    single_category_id: "",
    questions: [""],
    is_active: true
  };
}

function openEditModal(item) {
  editMode.value = true;
  form.value = {
    id: item.id,
    single_category_id: item.category_id,
    questions: [item.question_text],
    is_active: item.is_active
  };
}

async function saveItem() {
  try {
    if (!editMode.value && form.value.category_ids.length === 0) {
      return Swal.fire("Peringatan", "Pilih minimal satu kategori!", "warning");
    }

    Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    if (editMode.value) {
      await axios.put(`${API}/questionscleaning/${form.value.id}`, {
        category_id: form.value.single_category_id,
        question_text: form.value.questions[0],
        is_active: form.value.is_active
      });
      Swal.fire("Berhasil", "Data berhasil diupdate.", "success");
    } else {
      await axios.post(`${API}/questionscleaning`, {
        category_ids: form.value.category_ids,
        questions: form.value.questions.filter(q => q.trim() !== "")
      });
      Swal.fire("Berhasil", "Data massal berhasil ditambahkan.", "success");
    }

    loadItems();
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Terjadi kesalahan sistem.", "error");
  }
}

async function toggleStatus(item) {
  try {
    const originalStatus = item.is_active;
    item.is_active = !originalStatus;
    await axios.put(`${API}/questionscleaning/${item.id}`, {
      is_active: item.is_active
    });
  } catch {
    item.is_active = !item.is_active;
    Swal.fire("Error", "Gagal merubah status", "error");
  }
}

async function deleteItem(id) {
  const confirm = await Swal.fire({
    title: "Hapus data?",
    text: "Data yang dihapus tidak bisa dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Ya, Hapus'
  });

  if (confirm.isConfirmed) {
    await axios.delete(`${API}/questionscleaning/${id}`);
    loadItems();
    Swal.fire("Terhapus", "Data berhasil dihapus.", "success");
  }
}

async function loadItems() {
  const res = await axios.get(`${API}/questionscleaning`);
  items.value = res.data;
}

async function loadCategories() {
  const res = await axios.get(`${API}/categoriescleaning`);
  categories.value = res.data;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

onMounted(() => {
  loadItems();
  loadCategories();
  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<style scoped>
.bg-light-soft { background-color: #f8fafc; }
.transition-all { transition: all 0.3s ease; }
.cursor-pointer { cursor: pointer; }
.custom-check { padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; transition: 0.2s; }
.custom-check:hover { background: #f1f5f9; }
.btn-dashed { border: 2px dashed #cbd5e1; background: transparent; color: #64748b; border-radius: 10px; }
.btn-dashed:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }

/* Pagination Styles */
.pagination .page-link {
  border: none;
  color: #64748b;
  margin: 0 2px;
  border-radius: 6px !important;
}
.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  color: white;
}

.group-animation { animation: slideUp 0.3s ease-out; }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>