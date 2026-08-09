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
            <div>
              <h2 class="fw-bolder text-dark-blue mb-0">🧵 Inputan ACC</h2>
              <p class="text-muted small mb-0">Kelola data kebutuhan aksesoris produksi</p>
            </div>
            <button
              class="btn btn-primary shadow-sm px-4"
              data-bs-toggle="modal"
              data-bs-target="#accModal"
              @click="openAddModal"
            >
              <i class="bi bi-plus-circle me-2"></i>Tambah Data
            </button>
          </div>
          <hr />

          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>

              <div v-else class="table-container">
                <div class="table-responsive">
                  <table
                    id="accTable"
                    class="table table-borderless table-hover mb-0 align-middle w-100"
                  >
                    <thead class="text-uppercase fw-bold text-secondary border-bottom">
                      <tr>
                        <th class="text-center">No</th>
                        <th>Style / xPO</th>
                        <th>Kategori</th>
                        <th>Qty</th>
                        <th>Tanggal</th>
                        <th class="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in items" :key="item.id || index">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td class="fw-semibold">{{ item.xPO }}</td>
                        <td>
                          <span class="badge rounded-pill bg-info text-dark px-3 text-uppercase">
                            {{ item.kategori }}
                          </span>
                        </td>
                        <td class="fw-bold text-primary">{{ item.qty }}</td>
                        <td>{{ formatDate(item.xDate) }}</td>
                        <td class="text-center">
                          <div class="d-flex justify-content-center">
                            <button
                              class="btn btn-sm btn-outline-warning me-2"
                              data-bs-toggle="modal"
                              data-bs-target="#accModal"
                              @click="openEditModal(item)"
                            >
                              <i class="bi bi-pencil-square"></i>
                            </button>
                            <button
                              class="btn btn-sm btn-outline-danger"
                              @click="deleteItem(item.id)"
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
          </div>
        </div>
      </main>
    </div>

    <Footer />
  </div>

  <div class="modal fade" id="accModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 rounded-4 shadow">
        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold">
            {{ editMode ? "📝 Edit Data ACC" : "➕ Tambah Data ACC" }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <form @submit.prevent="saveItem">
            <div class="row g-4">
              <div class="col-md-6">
                <label class="form-label fw-bold small text-muted text-uppercase">Style (A1)</label>
                <div style="position: relative;">
                  <input
                    v-model="form.xPO"
                    type="text"
                    class="form-control bg-light border-0 py-2"
                    placeholder="Masukkan kode style A1..."
                    required
                    @input="fetchRiwayat('xPO', form.xPO)"
                    @focus="showRiwayat.xPO = true"
                    @blur="hideRiwayat('xPO')"
                  />
                  <ul 
                    v-if="riwayat.xPO.length && showRiwayat.xPO" 
                    class="list-group position-absolute w-100 shadow-lg mt-1"
                    style="top: 100%; left: 0; z-index: 1060; max-height: 200px; overflow-y: auto;"
                  >
                    <li
                      v-for="val in riwayat.xPO"
                      :key="val"
                      class="list-group-item list-group-item-action py-2 cursor-pointer"
                      @mousedown.prevent="selectRiwayat('xPO', val)"
                    >
                      {{ val }}
                    </li>
                  </ul>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small text-muted text-uppercase">Tanggal</label>
                <input v-model="form.xDate" type="date" class="form-control bg-light border-0 py-2" required />
              </div>

              <div class="col-md-6">
                <label class="form-label fw-bold small text-muted text-uppercase">Quantity</label>
                <!-- <input v-model.number="form.qty" type="number" min="1" class="form-control bg-light border-0 py-2" required /> -->
                 <input 
  v-model="form.qty" 
  type="text" 
  class="form-control bg-light border-0 py-2" 
  placeholder="Contoh: 2,1 KG, dll..."
  required 
/>
              </div>

              <div class="col-12">
                <label class="form-label fw-bold small text-muted text-uppercase d-block mb-3">Pilih Kategori</label>
                <div class="d-flex flex-wrap gap-2">
                  <button 
                    v-for="kat in kategoriList" 
                    :key="kat" 
                    type="button" 
                    class="btn btn-sm rounded-pill py-2 px-3 transition-all border shadow-xs" 
                    :class="form.kategori === kat ? 'btn-primary border-primary' : 'btn-outline-secondary text-dark'" 
                    @click="form.kategori = kat"
                  >
                    <i v-if="form.kategori === kat" class="bi bi-check-circle-fill me-1 text-white"></i>
                    {{ kat }}
                  </button>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 mt-5">
              <button type="button" class="btn btn-light px-4 rounded-pill" data-bs-dismiss="modal">Batal</button>
              <button 
                type="submit" 
                class="btn btn-primary px-5 rounded-pill shadow-sm" 
                data-bs-dismiss="modal"
                :disabled="!form.kategori || !form.xPO"
              >
                {{ editMode ? "Simpan Perubahan" : "Simpan Data" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, reactive } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// State
const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);
const editMode = ref(false);

// Fungsi untuk mendapatkan tanggal kemarin dalam format YYYY-MM-DD
const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

const form = ref({
  id: null,
  xPO: "",
  kategori: "",
  //qty: 1,
  qty: "",
  xDate: getYesterdayDate() // Menggunakan helper di atas
  //xDate: new Date().toISOString().split('T')[0]
});

const kategoriList = ["kerah", "plaket", "kerah+plaket", "kantong", "rib tangan", "rib badan", "ruffle", "linking", "cbs maker", "panel", "ppthread"];

// Logika Autocomplete
const riwayat = ref({ xPO: [] });
const showRiwayat = reactive({ xPO: false });
let timeoutId = {};

function hideRiwayat(field) {
  setTimeout(() => { showRiwayat[field] = false; }, 250);
}

function selectRiwayat(field, value) {
  form.value[field] = value;
  showRiwayat[field] = false;
}

async function fetchRiwayat(field, query) {
  if (timeoutId[field]) clearTimeout(timeoutId[field]);
  if (!query || query.length < 1) {
    riwayat.value[field] = [];
    return;
  }
  timeoutId[field] = setTimeout(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/inputan-acc/riwayat/xpo?query=${query}`);
      riwayat.value[field] = res.data;
      showRiwayat[field] = true;
    } catch (err) { console.error("History fetch error:", err); }
  }, 300);
}

// DataTables Logic
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable("#accTable")) {
    $("#accTable").DataTable().destroy();
  }
  setTimeout(() => {
    $("#accTable").DataTable({
      pageLength: 10,
      responsive: true,
      language: {
        search: "Cari:",
        lengthMenu: "Tampilkan _MENU_ data",
        zeroRecords: "Data tidak ditemukan",
        paginate: { next: "Berikutnya", previous: "Sebelumnya" },
      },
    });
  }, 0);
};

watch(items, () => reloadDataTable(), { deep: true });

// CRUD Operations
async function loadItems() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/inputan-acc`);
    items.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    Swal.fire("Gagal", "Tidak bisa memuat data aksesoris.", "error");
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  editMode.value = false;
  form.value = { id: null, xPO: "", kategori: "", qty: "", //qty: 1, //xDate: new Date().toISOString().split('T')[0] 
   xDate: getYesterdayDate() // Memastikan reset ke kemarin
  };
}

function openEditModal(item) {
  editMode.value = true;
  form.value = { ...item };
}

async function saveItem() {
  try {
    if (editMode.value) {
      await axios.put(`${API_BASE_URL}/inputan-acc/${form.value.id}`, form.value);
    } else {
      await axios.post(`${API_BASE_URL}/inputan-acc`, form.value);
    }
    Swal.fire({ icon: "success", title: "Berhasil", timer: 1000, showConfirmButton: false });
    loadItems();
  } catch (err) {
    Swal.fire("Gagal", "Cek kembali koneksi atau data inputan.", "error");
  }
}

async function deleteItem(id) {
  const result = await Swal.fire({
    title: "Yakin hapus data?",
    text: "Data ini tidak bisa dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal"
  });
  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/inputan-acc/${id}`);
      Swal.fire("Berhasil", "Data telah dihapus.", "success");
      loadItems();
    } catch (err) {
      Swal.fire("Gagal", "Gagal menghapus data.", "error");
    }
  }
}

// Helpers
const formatNumber = (n) => new Intl.NumberFormat("id-ID").format(n);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-";
function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value; }
function logout() { localStorage.removeItem("user"); window.location.href = "/login"; }

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  loadItems();
  window.addEventListener("resize", () => { windowWidth.value = window.innerWidth; });
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable("#accTable")) $("#accTable").DataTable().destroy();
});
</script>

<style scoped>
.bg-light-soft { background-color: #f8fafd; }
.text-dark-blue { color: #2c3e50; }

.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Styling Kategori Buttons */
.btn-outline-secondary {
  background-color: #fcfcfc;
  border-color: #e0e0e0;
  color: #555;
}

.btn-outline-secondary:hover {
  background-color: #f0f4f8;
  border-color: #0d6efd;
  color: #0d6efd;
}

.btn-primary.rounded-pill {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(13, 110, 253, 0.2);
}

.cursor-pointer {
  cursor: pointer;
}

/* Custom Scrollbar untuk Autocomplete */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}
</style>