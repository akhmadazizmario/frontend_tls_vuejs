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
            <h2 class="fw-bolder text-dark-blue mb-0">📊 PKB Downloads</h2>
          </div>

          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card border-0 rounded-4 shadow-sm bg-gradient-primary text-white">
                <div class="card-body text-center py-4">
                  <h5 class="fw-bold mb-2">Total Visitor (Filter)</h5>
                  <h2 class="fw-bolder">{{ totalVisitors }}</h2>
                  <p class="mb-0 small" v-if="filter.startDate && filter.endDate">
                    {{ formatDateShort(filter.startDate) }} s/d {{ formatDateShort(filter.endDate) }}
                  </p>
                  <p class="mb-0 small" v-else>Semua data</p>
                </div>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <input
                v-model="filter.startDate"
                type="date"
                class="form-control"
                style="width: 180px"
              />
              <span>s/d</span>
              <input
                v-model="filter.endDate"
                type="date"
                class="form-control"
                style="width: 180px"
              />
            </div>
            <button class="btn btn-success" @click="exportExcel">
              <i class="bi bi-file-earmark-excel me-2"></i> Export Excel
            </button>
          </div>

          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>

              <div v-else-if="downloads.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-exclamation-circle me-2"></i>Tidak ada data download.
              </div>

              <div v-else class="table-container">
                <div class="table-responsive">
                  <table
                    id="pkbDownloadTable"
                    class="table table-borderless table-hover mb-0 align-middle w-100"
                  >
                    <thead class="text-uppercase fw-bold text-secondary border-bottom">
                      <tr>
                        <th class="text-center">No</th>
                        <th>Nama Pengunjung</th>
                        <th>No KP</th>
                        <th>Tanggal</th>
                        <th class="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in downloads" :key="item.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>{{ item.name }}</td>
                        <td>{{ item.no_kp }}</td>
                        <td>{{ formatDateTime(item.createdAt) }}</td>
                        <td class="text-center">
                          <div class="d-flex justify-content-center">
                            <button
                              class="btn btn-sm btn-warning me-2"
                              data-bs-toggle="modal"
                              data-bs-target="#updateDownloadModal"
                              @click="openEditModal(item)"
                            >
                              <i class="bi bi-pencil-square"></i>
                            </button>
                            <button
                              class="btn btn-sm btn-danger"
                              @click="deleteDownload(item.id)"
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

  <div class="modal fade" id="updateDownloadModal" tabindex="-1">
    <div class="modal-dialog modal-md modal-dialog-centered">
      <div class="modal-content rounded-4 shadow">
        <div class="modal-header">
          <h5 class="modal-title">Update Data Pengunjung</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUpdate">
            <div class="mb-3">
              <label class="form-label">Nama Pengunjung</label>
              <input v-model="editData.name" type="text" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">No KP</label>
              <input v-model="editData.no_kp" type="text" class="form-control" required />
            </div>
            <div class="d-flex justify-content-end mt-3">
              <button type="submit" class="btn btn-primary" data-bs-dismiss="modal">Update</button>
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

// State
const downloads = ref([]);
const totalVisitors = ref(0);
const loading = ref(false);
const sidebarOpen = ref(false);
const user = ref({});
const windowWidth = ref(window.innerWidth);
const editData = ref({ id: null, name: "", no_kp: "" });

// Filter default: dari 30 hari yang lalu sampai hari ini
const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

const filter = ref({
  startDate: thirtyDaysAgo,
  endDate: today,
});

// Format tanggal
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

const formatDateShort = (dateStr) => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
};

// --- FUNGSI BARU: Ambil jumlah visitor dengan filter ---
async function fetchVisitorCount() {
  const { startDate, endDate } = filter.value;

  if (!startDate || !endDate) {
    totalVisitors.value = 0; // Reset jika filter kosong
    return;
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/pkb-downloads/filter`, {
      params: { startDate, endDate },
    });
    totalVisitors.value = res.data.totalVisitors;
  } catch (err) {
    console.error("Gagal memuat total visitor:", err);
    totalVisitors.value = 0;
  }
}

// Load data (dipanggil untuk tabel, BUKAN untuk card visitor)
async function loadDownloads() {
  loading.value = true;
  try {
    // Anda mungkin perlu memfilter data tabel juga, jika ya, tambahkan params ke endpoint ini
    const res = await axios.get(`${API_BASE_URL}/pkb-downloads`);
    downloads.value = res.data;
    // totalVisitors.value = res.data.length; // Dihapus, diganti dengan fetchVisitorCount
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak bisa memuat data pengunjung.", "error");
  } finally {
    loading.value = false;
  }
}

async function exportExcel() {
  if (!filter.value.startDate || !filter.value.endDate) {
    Swal.fire("Peringatan", "Silakan pilih tanggal awal dan akhir untuk Export.", "warning");
    return;
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/pkb-downloads/export`,
      {
        params: {
          startDate: filter.value.startDate,
          endDate: filter.value.endDate,
        },
        responseType: "blob", // penting supaya file bisa diunduh
      }
    );

    // Buat link download
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `PKB_Downloads_${filter.value.startDate}_to_${filter.value.endDate}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Gagal export:", error);
    Swal.fire("Gagal", "Tidak bisa export Excel.", "error");
  }
}

// Update
function openEditModal(item) {
  editData.value = { ...item };
}

async function saveUpdate() {
  try {
    await axios.put(`${API_BASE_URL}/pkb-downloads/${editData.value.id}`, {
      name: editData.value.name,
      no_kp: editData.value.no_kp,
    });
    Swal.fire("Berhasil", "Data pengunjung berhasil diperbarui.", "success");
    loadDownloads();
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak bisa memperbarui data.", "error");
  }
}

// Delete
async function deleteDownload(id) {
  Swal.fire({
    title: "Yakin ingin menghapus data ini?",
    text: "Data pengunjung akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/pkb-downloads/${id}`);
        Swal.fire("Berhasil", "Data pengunjung berhasil dihapus.", "success");
        loadDownloads();
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "Tidak bisa menghapus data.", "error");
      }
    }
  });
}

// Sidebar dan user
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

  // Panggil kedua fungsi saat mounting
  loadDownloads();
  fetchVisitorCount();

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
  if ($.fn.DataTable.isDataTable("#pkbDownloadTable")) {
    $("#pkbDownloadTable").DataTable().destroy();
  }
});

// Watcher untuk memicu fetchVisitorCount saat filter tanggal berubah
watch(
  filter,
  () => {
    fetchVisitorCount();
    // Tambahkan logic untuk memuat ulang data tabel jika Anda ingin tabel juga terfilter
    // loadDownloadsWithFilter(); 
  },
  { deep: true }
);

watch(downloads, () => {
  if ($.fn.DataTable.isDataTable("#pkbDownloadTable")) {
    $("#pkbDownloadTable").DataTable().destroy();
  }
  setTimeout(() => {
    $("#pkbDownloadTable").DataTable({
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
});
</script>

<style scoped>
.table-container {
  max-height: 70vh;
  overflow-y: auto;
}
.bg-gradient-primary {
  background: linear-gradient(135deg, #007bff, #0056b3);
}
</style>