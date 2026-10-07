<template>
  <div class="d-flex flex-column min-vh-100 bg-soft-gray">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 main-layout" :style="{ marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0' }">

        <!-- BUNGKUS DENGAN v-if="hasAccess" UNTUK UAC -->
      <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">
        <div class="p-4 bg-white border-bottom topbar">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-1">
                  <li class="breadcrumb-item small"><a href="#" class="text-decoration-none text-muted">UAC</a></li>
                  <li class="breadcrumb-item small active" aria-current="page">Access Matrix</li>
                </ol>
              </nav>
              <h4 class="fw-bold text-slate-900 mb-1">Access Matrix Control</h4>
              <p class="text-muted small mb-0">Kelola ribuan hak akses pengguna secara presisi dalam satu tampilan.</p>
            </div>

            <div class="d-flex align-items-center gap-3">
              <div class="stat-pill">
                <i class="bi bi-people-fill"></i>
                <span><b>{{ users.length }}</b> User</span>
              </div>
              <div class="stat-pill">
                <i class="bi bi-columns-gap"></i>
                <span><b>{{ pages.length }}</b> Page</span>
              </div>
              <button @click="loadMatrix" class="btn btn-refresh btn-sm px-3" :disabled="loading">
                <i class="bi bi-arrow-clockwise me-1" :class="{ spin: loading }"></i> Refresh
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 table-area">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="table-responsive custom-scrollbar">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="header-row-1">
                    <th class="sticky-col name-col bg-slate text-white border-0">
                      <div class="search-wrapper">
                        <i class="bi bi-person-search"></i>
                        <input v-model="searchUser" placeholder="Cari nama atau NIP..." class="search-input" />
                      </div>
                    </th>
                    <th class="sticky-col cheat-col bg-slate text-white border-0 text-center">
                      <span class="badge master-badge py-2 px-3">MASTER</span>
                    </th>
                    <th v-for="p in filteredPages" :key="p.id" class="text-center bg-slate text-white border-0 page-header-cell" :title="p.name">
                      <div class="page-code-text">{{ p.name }}</div>
                    </th>
                  </tr>

                  <tr class="header-row-2">
                    <th colspan="2" class="sticky-col name-cheat-combined bg-indigo-light text-white border-0 px-3">
                      <div class="search-wrapper page-search">
                        <i class="bi bi-funnel"></i>
                        <input v-model="searchPage" placeholder="Filter kode halaman..." class="search-input" />
                      </div>
                    </th>
                    <th v-for="p in filteredPages" :key="'sub-' + p.id" class="bg-indigo-light border-0" style="height: 12px;"></th>
                  </tr>
                </thead>

                <tbody v-if="!loading">
                  <tr v-for="u in filteredUsers" :key="u.nopegawai" class="matrix-row">
                    <td class="sticky-col name-col bg-white border-end">
                      <div class="d-flex align-items-center">
                        <div class="avatar-circle me-3">{{ u.name.charAt(0) }}</div>
                        <div class="text-truncate">
                          <div class="fw-bold text-slate-800 mb-0">{{ u.name }}</div>
                          <div class="text-muted x-small text-uppercase tracking-wider">{{ u.nopegawai }}</div>
                        </div>
                      </div>
                    </td>

                    <td class="sticky-col cheat-col bg-white text-center border-end-accent">
                      <div class="btn-group shadow-sm rounded-pill overflow-hidden border">
                        <button @click="massToggle(u, true)" class="btn btn-xs btn-mass btn-mass-on px-2" title="Grant All Access">ALL</button>
                        <button @click="massToggle(u, false)" class="btn btn-xs btn-mass btn-mass-off px-2" title="Revoke All Access">OFF</button>
                      </div>
                    </td>

                    <td v-for="p in filteredPages" :key="p.id" class="text-center cell-access border-start-faint">
                      <div class="form-check form-switch d-flex justify-content-center m-0">
                        <input
                          class="form-check-input custom-switch"
                          type="checkbox"
                          :checked="isAllowed(u, p.id)"
                          @change="toggleAccess(u.nopegawai, p.id, $event)"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-if="loading" class="text-center py-5 bg-white">
                <div class="spinner-grow text-indigo" role="status"></div>
                <div class="mt-3 text-indigo fw-bold">Menyiapkan Matrix...</div>
              </div>

              <div v-if="!loading && filteredUsers.length === 0" class="text-center py-5 bg-white">
                <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
                <h5 class="mt-3 text-dark">Data tidak ditemukan</h5>
                <p class="text-muted">Coba ubah kata kunci pencarian Anda.</p>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";

// --- State & Variables ---
const API = import.meta.env.VITE_API_BASE_URL;

const hasAccess = ref(false);

const pages = ref([]);
const users = ref([]);
const loading = ref(false);
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const searchUser = ref("");
const searchPage = ref("");
const user = ref(JSON.parse(localStorage.getItem("user")) || {});

// --- Computed Properties ---
const filteredPages = computed(() => {
  if (!searchPage.value) return pages.value;
  return pages.value.filter(p => p.code.toLowerCase().includes(searchPage.value.toLowerCase()));
});

const filteredUsers = computed(() => {
  const s = searchUser.value.toLowerCase();
  return users.value.filter(u => u.name.toLowerCase().includes(s) || u.nopegawai.toString().includes(s));
});

// --- Methods ---
const loadMatrix = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API}/uac/user-page-access/matrix`);
    pages.value = res.data.pages || [];
    users.value = res.data.users || [];
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data matrix", "error");
  } finally {
    loading.value = false;
  }
};

const isAllowed = (u, pageId) => {
  return u.pages?.find(p => p.page_id === pageId)?.allowed || false;
};

const massToggle = async (userRow, status) => {
  Swal.fire({
    title: 'Mohon Tunggu',
    html: `Memperbarui seluruh akses untuk <b>${userRow.name}</b>`,
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    await axios.post(`${API}/uac/user-page-access/mass-update`, {
      nopegawai: userRow.nopegawai,
      can_access: status
    });

    // Update local state
    userRow.pages.forEach(p => { p.allowed = status; });
    Swal.fire({ icon: 'success', title: 'Berhasil', timer: 800, showConfirmButton: false });
  } catch (err) {
    Swal.fire("Gagal", "Terjadi kesalahan pada server", "error");
  }
};

const toggleAccess = async (nopegawai, pageId, event) => {
  const isChecked = event.target.checked;
  try {
    await axios.post(`${API}/uac/user-page-access/update`, {
      nopegawai, page_id: pageId, can_access: isChecked,
    });

    const userRow = users.value.find(u => u.nopegawai === nopegawai);
    const pData = userRow.pages?.find(p => p.page_id === pageId);
    if (pData) pData.allowed = isChecked;
  } catch (err) {
    event.target.checked = !isChecked;
    Swal.fire("Gagal", "Update gagal diberlakukan", "error");
  }
};

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const handleResize = () => windowWidth.value = window.innerWidth;

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);

  // LOGIKA UAC 
  try {
    const pagesData = localStorage.getItem("pages");
    const pages = pagesData ? JSON.parse(pagesData) : [];
    // Periksa apakah user memiliki akses ke rute ini 
    hasAccess.value = pages.includes("userpageaccess");
  } catch (e) {
    hasAccess.value = false;
  }

  // Hanya load item dari API jika user punya akses
  if (hasAccess.value) {
    loadMatrix();
  }
  //loadMatrix();
  window.addEventListener("resize", handleResize);
});
onBeforeUnmount(() => window.removeEventListener("resize", handleResize));
</script>

<style scoped>
/* Base Layout & Colors */
.bg-soft-gray { background-color: #f8fafc; }
.text-slate-800 { color: #1e293b; }
.text-slate-900 { color: #0f172a; }
.bg-slate { background-color: #1e293b !important; }
.bg-indigo-light { background-color: #6366f1 !important; }

.topbar {
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

.main-layout {
  margin-top: 60px;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
}

/* Stat pills in topbar */
.stat-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f1f5f9;
  color: #334155;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.82rem;
  white-space: nowrap;
}
.stat-pill i {
  color: #6366f1;
  font-size: 0.9rem;
}

.btn-refresh {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #334155;
  border-radius: 999px;
  font-weight: 500;
  transition: all 0.15s ease;
}
.btn-refresh:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Table wrapper */
.table-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.custom-scrollbar {
  flex: 1;
  overflow: auto !important;
  max-height: calc(100vh - 240px);
  border-radius: 12px;
  position: relative;
}

table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

/* Sticky Setup */
.sticky-col {
  position: sticky;
  z-index: 10;
  outline: 1px solid #e2e8f0;
}
.name-col { left: 0; min-width: 260px; }
.cheat-col { left: 260px; min-width: 100px; }
.name-cheat-combined { left: 0; z-index: 11; }

/* Sticky Header Rows */
thead .header-row-1 th { position: sticky; top: 0; z-index: 12; height: 60px; }
thead .header-row-2 th { position: sticky; top: 60px; z-index: 12; }

.page-header-cell {
  min-width: 90px;
  max-width: 140px;
  padding: 0.65rem 0.5rem;
}
.page-code-text {
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.master-badge {
  background: rgba(255, 255, 255, 0.92);
  color: #1e293b;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Search inputs in header */
.search-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.15s ease;
}
.search-wrapper:focus-within {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.25);
}
.search-input {
  background: transparent;
  border: none;
  color: white;
  font-size: 0.85rem;
  width: 100%;
  margin-left: 10px;
  outline: none;
}
.search-input::placeholder {
  color: rgba(255, 255, 255, 0.65);
}

/* Rows */
.matrix-row {
  transition: background-color 0.12s ease;
}

/* Avatar */
.avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
}

.x-small { font-size: 0.7rem; }
.tracking-wider { letter-spacing: 0.05em; }

/* Mass action buttons */
.btn-mass {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #fff;
  border: none;
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
  transition: opacity 0.15s ease;
}
.btn-mass-on { background-color: #22c55e; }
.btn-mass-on:hover { background-color: #16a34a; color: #fff; }
.btn-mass-off { background-color: #ef4444; }
.btn-mass-off:hover { background-color: #dc2626; color: #fff; }

.cell-access {
  min-width: 90px;
}

.custom-switch {
  width: 2.6em !important;
  height: 1.3em !important;
  cursor: pointer;
  transition: all 0.15s ease;
}
.custom-switch:checked {
  background-color: #6366f1;
  border-color: #6366f1;
}

/* Scrollbar Styling */
.custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
  border: 2px solid #f1f5f9;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>