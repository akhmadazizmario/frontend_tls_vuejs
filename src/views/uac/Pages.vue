<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-4"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          marginTop: '56px'
        }"
      >
        <div class="container-fluid uac-page">

          <!-- PAGE HEADER -->
          <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div>
              <h4 class="mb-1 fw-bold text-dark">Manajemen Page Access Control</h4>
              <p class="text-muted mb-0 small">Kelola daftar halaman (page) yang dapat diatur hak aksesnya</p>
            </div>
            <span class="badge rounded-pill bg-primary-subtle text-primary px-3 py-2">
              <i class="bi bi-collection me-1"></i>{{ pages.length }} Page
            </span>
          </div>

          <!-- FORM CREATE -->
          <div class="card border-0 shadow-sm mb-4 uac-card">
            <div class="card-body p-4">
              <h6 class="fw-semibold text-secondary mb-3">
                <i class="bi bi-plus-circle me-2 text-primary"></i>Tambah Page Baru
              </h6>
              <div class="row g-3 align-items-end">
                <div class="col-md-3">
                  <label class="form-label small text-muted mb-1">Code</label>
                  <input
                    v-model="form.code"
                    class="form-control uac-input"
                    placeholder="dashboard"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label small text-muted mb-1">Nama Page</label>
                  <input
                    v-model="form.name"
                    class="form-control uac-input"
                    placeholder="Dashboard"
                  />
                </div>
                <div class="col-md-4">
                  <label class="form-label small text-muted mb-1">Path</label>
                  <input
                    v-model="form.path"
                    class="form-control uac-input"
                    placeholder="/dashboard"
                  />
                </div>
                <div class="col-md-2">
                  <button
                    class="btn btn-primary w-100 uac-btn"
                    :disabled="creating"
                    @click="createPage"
                  >
                    <span v-if="creating" class="spinner-border spinner-border-sm me-1"></span>
                    <i v-else class="bi bi-plus-lg me-1"></i>
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TABLE -->
          <div class="card border-0 shadow-sm uac-card">
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table uac-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loading">
                      <td colspan="3" class="text-center py-5 text-muted">
                        <div class="spinner-border spinner-border-sm me-2"></div>
                        Memuat data...
                      </td>
                    </tr>
                    <tr v-else-if="pages.length === 0">
                      <td colspan="3" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                        Belum ada page yang terdaftar
                      </td>
                    </tr>
                    <tr v-else v-for="p in pages" :key="p.id">
                      <td>
                        <span class="badge rounded-pill code-badge">{{ p.code }}</span>
                      </td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="avatar-initial">{{ initials(p.name) }}</div>
                          <span class="fw-medium text-dark">{{ p.name }}</span>
                        </div>
                      </td>
                      <td>
                        <code class="path-code">{{ p.path }}</code>
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

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL

// ============================
// STATE
// ============================
const users = ref([]);
const loading = ref(false);
const creating = ref(false);

const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

// USER LOGIN
const user = ref(JSON.parse(localStorage.getItem("user")) || {});

const pages = ref([])
const form = ref({
  code: '',
  name: '',
  path: ''
})

const initials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

const loadPages = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API}/uac/pages`)
    pages.value = res.data
  } finally {
    loading.value = false
  }
}

// ============================
// UI
// ============================
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const createPage = async () => {
  if (!form.value.code || !form.value.name || !form.value.path) {
    return Swal.fire('Error', 'Lengkapi semua field', 'warning')
  }

  creating.value = true
  try {
    await axios.post(`${API}/uac/pages`, form.value)
    Swal.fire('Success', 'Page berhasil dibuat', 'success')
    form.value = { code: '', name: '', path: '' }
    loadPages()
  } catch (err) {
    Swal.fire(
      'Error',
      err.response?.data?.error || 'Gagal create page',
      'error'
    )
  } finally {
    creating.value = false
  }
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = '/login';
}

onMounted(() => {
  loadPages();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.bg-light-soft {
  background-color: #f5f7fb;
}

.uac-card {
  border-radius: 14px;
}

.uac-input {
  border-radius: 8px;
  border: 1px solid #dfe3ea;
  padding: 0.55rem 0.75rem;
  font-size: 0.92rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.uac-input:focus {
  border-color: #6c8cff;
  box-shadow: 0 0 0 0.2rem rgba(76, 110, 245, 0.15);
}

.uac-btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 0.55rem 0.75rem;
  box-shadow: 0 2px 6px rgba(76, 110, 245, 0.25);
}

.uac-table thead {
  background-color: #f8f9fc;
}

.uac-table thead th {
  border-bottom: 1px solid #e9ecef;
  color: #6c757d;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  padding: 0.9rem 1rem;
}

.uac-table tbody td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f2f6;
  font-size: 0.92rem;
}

.uac-table tbody tr:last-child td {
  border-bottom: none;
}

.uac-table tbody tr:hover {
  background-color: #fafbff;
}

.code-badge {
  background-color: #eef1ff;
  color: #4c6ef5;
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  padding: 0.4rem 0.75rem;
  font-weight: 600;
}

.path-code {
  background-color: #f3f4f6;
  color: #495057;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.82rem;
}

.avatar-initial {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4c6ef5, #7048e8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 600;
  flex-shrink: 0;
}
</style>