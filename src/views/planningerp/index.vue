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
      <!-- BUNGKUS DENGAN v-if="hasAccess" UNTUK UAC -->
      <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">
        <div class="container-fluid">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bolder text-dark-blue mb-0">📅 Manajemen Planning TV</h2>
            <button
              class="btn btn-primary btn-add-item"
              data-bs-toggle="modal"
              data-bs-target="#planningModal"
              @click="openAddModal"
            >
              <i class="fas fa-plus me-2"></i>Tambah Planning
            </button>
          </div>
          <hr />

          <!-- Card -->
          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>
              <div v-else-if="items.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-exclamation-circle me-2"></i>Tidak ada data planning.
              </div>
              <div v-else class="table-container">
                <div class="table-responsive">
                  <table
                    id="planningTable"
                    class="table table-borderless table-hover mb-0 align-middle w-100"
                  >
                    <thead class="text-uppercase fw-bold text-secondary border-bottom">
                      <tr>
                        <th class="text-center">No</th>
                        <th>Tanggal</th>
                        <th>Kategori Gedung</th>
                        <th>Planning</th>
                        <th class="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in items" :key="item.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>{{ formatDate(item.xDate) }}</td>
                        <td>
                          <span class="badge bg-info-subtle text-info border border-info px-3 py-2 rounded-pill">
                            {{ item.kategori_gedung || 'N/A' }}
                          </span>
                        </td>
                        <td>{{ item.planning }}</td>
                        <td class="text-center">
                          <div class="d-flex justify-content-center">
                            <button
                              class="btn btn-sm btn-warning me-2"
                              data-bs-toggle="modal"
                              data-bs-target="#planningModal"
                              @click="openEditModal(item)"
                            >
                              <i class="bi bi-pencil-square"></i>
                            </button>
                            <button
                              class="btn btn-sm btn-danger"
                              @click="deletePlanning(item.id)"
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
  </div>

  <!-- Modal Form -->
  <div class="modal fade" id="planningModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 shadow">
        <div class="modal-header">
          <h5 class="modal-title fw-bold">
            {{ editMode ? "Edit Planning" : "Tambah Planning" }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="savePlanning">
            <div class="mb-3">
              <label class="form-label fw-bold">Tanggal</label>
              <input
                v-model="form.xDate"
                type="date"
                class="form-control"
                required
              />
            </div>
            
            <div class="mb-3">
              <label class="form-label fw-bold">Kategori Gedung</label>
              <select v-model="form.kategori_gedung" class="form-select" required>
                <option value="" disabled>-- Pilih Kategori --</option>
                <option value="linking_AB">linking_AB</option>
                <!-- <option value="linking_A">linking_A</option>
                <option value="linking_B">linking_B</option> -->
                <option value="linking_C">linking_C</option>
                <option value="linking_D">linking_D</option>
                <!-- <option value="finishing_A">finishing_A</option>
                <option value="finishing_B">finishing_B</option> -->
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Planning</label>
              <input
                type="number"
                v-model.number="form.planning"
                class="form-control"
                placeholder="Masukkan jumlah planning..."
                required
              />
              <!-- <textarea
                v-model="form.planning"
                class="form-control"
                rows="3"
                placeholder="Masukkan jumlah atau detail planning..."
                required
              ></textarea> -->
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
              <button type="submit" class="btn btn-primary" data-bs-dismiss="modal">
                {{ editMode ? "Update Data" : "Simpan Data" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const hasAccess = ref(false);

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const editMode = ref(false);
const form = ref({ 
  id: null, 
  xDate: "", 
  planning: "", 
  kategori_gedung: "" 
});
let table = null;

// === Fungsi Datatables ===
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable("#planningTable")) {
    $("#planningTable").DataTable().destroy();
  }
  setTimeout(() => {
    table = $("#planningTable").DataTable({
      pageLength: 10,
      lengthChange: false,
      searching: true,
      autoWidth: false,
      responsive: true,
      language: {
        search: "Cari:",
        zeroRecords: "Data tidak ditemukan",
        info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
        infoEmpty: "Tidak ada data tersedia",
        infoFiltered: "(difilter dari _MAX_ total data)",
        paginate: {
          next: "Berikutnya",
          previous: "Sebelumnya",
        },
      },
    });
  }, 50);
};

watch(items, () => reloadDataTable(), { deep: true });

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function loadPlanning() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/planningoffice`);
    items.value = Array.isArray(res.data.data) ? res.data.data : [];
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak bisa memuat data planning.", "error");
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  editMode.value = false;
  form.value = { 
    id: null, 
    xDate: "", 
    planning: "", 
    kategori_gedung: "" 
  };
}

function openEditModal(item) {
  editMode.value = true;

  // Format tanggal agar cocok untuk input type="date"
  let formattedDate = "";
  if (item.xDate) {
    const d = new Date(item.xDate);
    formattedDate = d.toISOString().split("T")[0];
  }

  form.value = {
    id: item.id,
    xDate: formattedDate,
    planning: item.planning,
    kategori_gedung: item.kategori_gedung || "",
  };
}

async function savePlanning() {
  try {
    if (editMode.value) {
      await axios.put(`${API_BASE_URL}/planningoffice/${form.value.id}`, form.value);
      Swal.fire("Berhasil", "Planning berhasil diupdate.", "success");
    } else {
      await axios.post(`${API_BASE_URL}/planningoffice`, form.value);
      Swal.fire("Berhasil", "Planning berhasil ditambahkan.", "success");
    }
    loadPlanning();
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
  }
}

async function deletePlanning(id) {
  Swal.fire({
    title: "Yakin ingin menghapus?",
    text: "Data planning akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/planningoffice/${id}`);
        Swal.fire("Berhasil", "Planning berhasil dihapus.", "success");
        loadPlanning();
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
  // LOGIKA UAC 
  try {
    const pagesData = localStorage.getItem("pages");
    const pages = pagesData ? JSON.parse(pagesData) : [];
    // Periksa apakah user memiliki akses ke rute ini 
    hasAccess.value = pages.includes("planningerp");
  } catch (e) {
    hasAccess.value = false;
  }
  // Hanya load item dari API jika user punya akses
  if (hasAccess.value) {
    loadPlanning();
  }
  window.addEventListener("resize", () => { windowWidth.value = window.innerWidth; });
  //document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable("#planningTable")) {
    $("#planningTable").DataTable().destroy();
  }
});
</script>

<style scoped>
.bg-light-soft {
  background-color: #f8f9fa;
}
.text-dark-blue {
  color: #083358;
}
.table-container {
  min-height: 400px;
}
.btn-add-item {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: bold;
}
/* Memperbaiki tampilan dropdown agar lebih modern */
.form-select {
  border-radius: 8px;
  border: 1px solid #ced4da;
}
.form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>