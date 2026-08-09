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
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bolder text-dark-blue mb-0">📂 Manajemen File PKB</h2>
            <button
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#filePkbModal"
              @click="openAddModal"
              v-if="['it', 'akuntansi'].includes(user.dept?.toLowerCase())"
            >
              <i class="bi bi-cloud-upload"></i> Upload File PKB
            </button>
          </div>

          <hr />

          <!-- Card Table -->
          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data file...
              </div>

              <div v-else-if="files.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-exclamation-circle me-2"></i>Tidak ada file PKB.
              </div>

              <div v-else class="table-container">
                <div class="table-responsive">
                  <table
                    id="filePkbTable"
                    class="table table-borderless table-hover mb-0 align-middle w-100"
                  >
                    <thead class="text-uppercase fw-bold text-secondary border-bottom">
                      <tr>
                        <th class="text-center">No</th>
                        <th>Nama File</th>
                        <th>Tanggal Upload</th>
                        <th class="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in files" :key="item.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>{{ item.file }}</td>
                        <td>{{ formatDateTime(item.createdAt) }}</td>
                        <td class="text-center">
                          <div class="d-flex justify-content-center">
                            <!-- Aksi khusus IT & Akuntansi -->
                            <template v-if="['it', 'fco', 'hrd'].includes(user.dept?.toLowerCase())">
                              <button
                                class="btn btn-sm btn-warning me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#filePkbModal"
                                @click="openEditModal(item)"
                              >
                                <i class="bi bi-pencil-square"></i>
                              </button>
                              <button
                                class="btn btn-sm btn-danger me-2"
                                @click="deleteFile(item.id)"
                              >
                                <i class="bi bi-trash"></i>
                              </button>
                            </template>

                            <!-- Tombol Download untuk semua user -->
                            <a
                              class="btn btn-sm btn-success"
                              :href="`${API_BASE_URL}${item.file}`"
                              target="_blank"
                              download
                            >
                              <i class="bi bi-download"></i>
                            </a>
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

  <!-- Modal Upload / Update -->
  <div class="modal fade" id="filePkbModal" tabindex="-1">
    <div class="modal-dialog modal-md modal-dialog-centered">
      <div class="modal-content rounded-4 shadow">
        <div class="modal-header">
          <h5 class="modal-title">{{ editMode ? "Update File PKB" : "Upload File PKB" }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveFile" enctype="multipart/form-data">
            <div class="mb-3">
              <label class="form-label">Pilih File PDF</label>
              <input
                type="file"
                class="form-control"
                accept="application/pdf"
                ref="fileInput"
                required
              />
            </div>
            <div class="d-flex justify-content-end mt-3">
              <button type="submit" class="btn btn-primary" data-bs-dismiss="modal">
                {{ editMode ? "Update" : "Upload" }}
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

const files = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const editMode = ref(false);
const selectedId = ref(null);
const fileInput = ref(null);
let table = null;

// 🔧 Format tanggal
const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
};

// 🧮 Datatables
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable("#filePkbTable")) {
    $("#filePkbTable").DataTable().destroy();
  }
  setTimeout(() => {
    table = $("#filePkbTable").DataTable({
      pageLength: 10,
      lengthChange: false,
      searching: true,
      responsive: true,
      order: [],
      language: {
        search: "Cari:",
        zeroRecords: "Data tidak ditemukan",
        info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
        infoEmpty: "Tidak ada data tersedia",
        infoFiltered: "(difilter dari _MAX_ total data)",
        paginate: { next: "Berikutnya", previous: "Sebelumnya" },
      },
    });
  }, 0);
};

watch(files, () => reloadDataTable(), { deep: true });

// 🔄 Load semua file
async function loadFiles() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/filepkb`);
    files.value = res.data;
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak bisa memuat daftar file PKB.", "error");
  } finally {
    loading.value = false;
  }
}

// 🧾 Upload / Update File
async function saveFile() {
  try {
    const file = fileInput.value.files[0];
    if (!file) {
      Swal.fire("Peringatan", "Silakan pilih file PDF terlebih dahulu.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    if (editMode.value && selectedId.value) {
      await axios.put(`${API_BASE_URL}/filepkb/${selectedId.value}`, formData);
      Swal.fire("Berhasil", "File PKB berhasil diperbarui.", "success");
    } else {
      await axios.post(`${API_BASE_URL}/filepkb`, formData);
      Swal.fire("Berhasil", "File PKB berhasil diupload.", "success");
    }

    loadFiles();
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Terjadi kesalahan saat upload file.", "error");
  }
}

// 🗑️ Hapus file
async function deleteFile(id) {
  Swal.fire({
    title: "Yakin ingin menghapus file ini?",
    text: "File PKB akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/filepkb/${id}`);
        Swal.fire("Berhasil", "File PKB berhasil dihapus.", "success");
        loadFiles();
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "Tidak bisa menghapus file PKB.", "error");
      }
    }
  });
}

// 🔘 Modal handler
function openAddModal() {
  editMode.value = false;
  selectedId.value = null;
  if (fileInput.value) fileInput.value.value = "";
}

function openEditModal(item) {
  editMode.value = true;
  selectedId.value = item.id;
  if (fileInput.value) fileInput.value.value = "";
}

// Sidebar & User
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  loadFiles();

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable("#filePkbTable")) {
    $("#filePkbTable").DataTable().destroy();
  }
});
</script>

<style scoped>
.table-container {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
