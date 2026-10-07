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
            <h2 class="fw-bolder text-dark-blue mb-0">
              <i class="bi bi-book-half me-2"></i> Buku Tamu – Admin Panel
            </h2>
            <button class="btn btn-primary d-none d-md-block" @click="loadGuests">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh Data
            </button>
          </div>

          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card border-0 rounded-4 shadow-lg bg-gradient-primary text-white">
                <div class="card-body text-center py-4">
                  <i class="bi bi-people-fill display-5 mb-2"></i>
                  <h5 class="fw-bold mb-2">Total Tamu</h5>
                  <h2 class="fw-bolder">{{ filteredGuests.length }}</h2>
                  <p class="mb-0 small">Data saat ini</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card border-0 rounded-4 shadow-sm p-4">
            <div class="card-body p-0">
              
              <div class="row mb-4 align-items-end">
                <div class="col-md-4 mb-3 mb-md-0">
                  <label for="searchQuery" class="form-label fw-bold small">Pencarian Cepat</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input
                      type="text"
                      class="form-control"
                      id="searchQuery"
                      v-model="searchQuery"
                      placeholder="Cari Nama, HP, atau Keperluan..."
                    />
                  </div>
                </div>

                <div class="col-md-3 mb-3 mb-md-0">
                  <label for="startDate" class="form-label fw-bold small">Filter Tanggal Mulai</label>
                  <input
                    type="date"
                    class="form-control"
                    id="startDate"
                    v-model="startDate"
                  />
                </div>
                
                <div class="col-md-3 mb-3 mb-md-0">
                  <label for="endDate" class="form-label fw-bold small">Filter Tanggal Akhir</label>
                  <input
                    type="date"
                    class="form-control"
                    id="endDate"
                    v-model="endDate"
                  />
                </div>
                
                <div class="col-md-2">
                    <button class="btn btn-outline-secondary w-100" @click="resetFilters">
                        <i class="bi bi-x-circle me-1"></i> Reset
                    </button>
                </div>
              </div>

              <hr class="mt-0 mb-4">

              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="bi bi-arrow-repeat spin me-2"></i>Memuat data...
              </div>

              <div v-else-if="guests.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="bi bi-exclamation-circle me-2"></i>Belum ada tamu.
              </div>
              
              <div v-else-if="filteredGuests.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="bi bi-filter me-2"></i>Tidak ada data yang cocok dengan filter.
              </div>

              <div v-else class="table-container">
                <div class="table-responsive">
                  <table
                    id="guestTable"
                    class="table table-striped table-hover mb-0 align-middle w-100"
                  >
                    <thead class="text-uppercase fw-bold text-secondary border-bottom border-2">
                      <tr>
                        <th class="text-center">No</th>
                        <th>Nama</th>
                        <th>Nomor HP</th>
                        <th>Keperluan</th>
                        <th>Alamat</th>
                        <th>Tanggal Kunjungan</th>
                        <th class="text-center">Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="(item, index) in filteredGuests" :key="item.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>{{ item.name }}</td>
                        <td>{{ item.phone }}</td>
                        <td>{{ item.keperluan }}</td>
                        <td>{{ item.alamat }}</td>
                        <td>{{ formatDateTime(item.createdAt) }}</td>

                        <td class="text-center">
                          <div class="d-flex justify-content-center">
                            <!-- <button
                              class="btn btn-sm btn-warning me-2 text-white"
                              data-bs-toggle="modal"
                              data-bs-target="#editGuestModal"
                              @click="openEditModal(item)"
                              title="Edit"
                            >
                              <i class="bi bi-pencil-square"></i>
                            </button> -->

                            <button
                              class="btn btn-sm btn-danger"
                              @click="deleteGuest(item.id)"
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
          </div>

        </div>
      </main>
    </div>

    <Footer />
  </div>

  </template>

  <script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

// Hapus import yang tidak digunakan/digantikan
// import $ from "jquery";
// import "datatables.net-bs5";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// STATE UTAMA
const guests = ref([]);
const loading = ref(false);
const sidebarOpen = ref(false);
const user = ref({});
const windowWidth = ref(window.innerWidth);

// STATE UNTUK PENCARIAN & FILTER
const searchQuery = ref("");
const startDate = ref("");
const endDate = ref("");

const editData = ref({
  id: null,
  name: "",
  phone: "",
  keperluan: "",
  alamat: "", // Tambahkan alamat di sini
});

// FORMAT DATE
const formatDateTime = (d) => {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// **LOGIKA FILTER DENGAN COMPUTED PROPERTY**
const filteredGuests = computed(() => {
  let filtered = guests.value;
  const search = searchQuery.value.toLowerCase().trim();

  // 1. FILTER PENCARIAN TEKS (Nama, HP, Keperluan, Alamat)
  if (search) {
    filtered = filtered.filter(
      (guest) =>
        guest.name.toLowerCase().includes(search) ||
        guest.phone.toLowerCase().includes(search) ||
        guest.keperluan.toLowerCase().includes(search) ||
        guest.alamat.toLowerCase().includes(search)
    );
  }

  // 2. FILTER TANGGAL
  if (startDate.value || endDate.value) {
    const start = startDate.value ? new Date(startDate.value) : null;
    // Tambahkan 1 hari ke tanggal akhir untuk memastikan inklusi data di tanggal tersebut
    const end = endDate.value ? new Date(endDate.value) : null;

    if (end) {
        end.setDate(end.getDate() + 1); 
    }

    filtered = filtered.filter((guest) => {
      const guestDate = new Date(guest.createdAt);
      
      const isAfterStart = start ? guestDate >= start : true;
      const isBeforeEnd = end ? guestDate < end : true;
      
      return isAfterStart && isBeforeEnd;
    });
  }

  return filtered;
});

function resetFilters() {
    searchQuery.value = "";
    startDate.value = "";
    endDate.value = "";
}

// LOAD DATA
async function loadGuests() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/buku-tamu`);
    // Urutkan data berdasarkan tanggal terbaru (descending)
    guests.value = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    Swal.fire("Error", "Gagal memuat data tamu.", "error");
  } finally {
    loading.value = false;
  }
}

// EDIT
function openEditModal(item) {
  editData.value = { ...item };
}

async function saveUpdate() {
  try {
    await axios.put(`${API_BASE_URL}/buku-tamu/${editData.value.id}`, editData.value);
    Swal.fire("Berhasil", "Data tamu berhasil diperbarui.", "success");
    loadGuests();
  } catch (err) {
    Swal.fire("Gagal", "Tidak bisa memperbarui data.", "error");
  }
}

// DELETE
async function deleteGuest(id) {
  Swal.fire({
    title: "Hapus data tamu?",
    text: "Data tidak dapat dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  }).then(async (res) => {
    if (res.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/buku-tamu/${id}`);
        Swal.fire("Berhasil", "Data tamu dihapus.", "success");
        loadGuests();
      } catch (err) {
        Swal.fire("Error", "Gagal menghapus data.", "error");
      }
    }
  });
}

// SIDEBAR
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

// USER
function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);

  loadGuests();

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", () => {});
});
</script>

<style scoped>
/* Tambahkan sedikit style untuk tampilan lebih baik */
.table-container {
  max-height: 70vh;
  overflow-y: auto;
}

.bg-gradient-primary {
  /* Menggunakan warna biru yang sedikit lebih cerah */
  background: linear-gradient(135deg, #007bff, #0056b3);
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>