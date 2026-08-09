<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-5"
        :style="mainContentStyle"
      >
        <div class="container-fluid">
          <h2 class="fw-bold mb-3 text-dark">
            <i class="bi bi-envelope-fill me-2 text-primary"></i> Contact Messages
          </h2>
          <hr />

          <div class="card shadow-lg border-0 rounded-4">
            <div class="card-body">
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Memuat data pesan...</p>
              </div>

              <div
                v-else-if="messages.length === 0"
                class="text-center py-5 text-muted"
              >
                <i class="bi bi-inbox-fill fs-2 mb-3"></i>
                <p>Belum ada pesan yang masuk.</p>
              </div>

              <div v-else class="table-responsive">
                <table
                  id="messagesTable"
                  class="table table-striped table-hover align-middle w-100"
                >
                  <thead class="table-primary">
                    <tr>
                      <th class="text-center">No</th>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Perihal</th>
                      <th>Pesan</th>
                      <th>Dibuat</th>
                      <th class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(msg, index) in messages" :key="msg.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>{{ msg.name }}</td>
                      <td>{{ msg.email }}</td>
                      <td>{{ msg.subject }}</td>
                      <td>
                        {{ truncateMessage(msg.message, 50) }}
                      </td>
                      <td>{{ formatDateTime(msg.createdAt) }}</td>
                      <td class="text-center">
                        <button
                          class="btn btn-sm btn-outline-danger"
                          title="Hapus Pesan"
                          @click="confirmDelete(msg.id)"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
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
// --- IMPORTS ---
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
// Pastikan jQuery dan Datatables sudah terinstal di proyek Anda
import $ from "jquery"; 
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

// Komponen
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

// --- KONSTANTA & STATE REAKTIF ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// State Data
const messages = ref([]);
const loading = ref(false);

// State UI/Layout (diasumsikan untuk fungsi Sidebar)
const user = ref({ name: "Admin" }); // Contoh
const sidebarOpen = ref(true);
const windowWidth = ref(window.innerWidth);
let table = null;

// --- COMPUTED PROPERTIES ---
const mainContentStyle = computed(() => ({
  marginLeft: sidebarOpen.value && windowWidth.value >= 768 ? '16rem' : '0',
  transition: 'margin-left 0.3s ease',
  marginTop: '56px', // Sesuaikan dengan tinggi header jika fixed
}));

// --- HELPER FUNCTIONS ---

// 1. Format Tanggal
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

// 2. Potong Pesan (untuk tampilan tabel)
const truncateMessage = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

// 3. Pengelola Lebar Jendela (untuk Sidebar)
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value < 768) {
    sidebarOpen.value = false;
  }
};

// --- LOGIKA UI/LAYOUT (Sidebar & Auth) ---

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const logout = () => {
  // Implementasi Logout
  alert("Logging out...");
};


// --- LOGIKA DATATABLES ---

const initDataTable = () => {
  // Pastikan Datatable sebelumnya dihancurkan sebelum inisialisasi baru
  if (table) {
    table.destroy();
    table = null;
  }
  
  // Gunakan setTimeout agar DOM elemen tabel terrender sempurna
  setTimeout(() => {
    table = $("#messagesTable").DataTable({
      pageLength: 10,
      lengthChange: false,
      searching: true,
      responsive: true,
      order: [[5, "desc"]], // Urutkan berdasarkan kolom Dibuat (kolom ke-5) terbaru
      language: {
        search: "Cari:",
        zeroRecords: "Data tidak ditemukan",
        info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
        infoEmpty: "Tidak ada data",
        paginate: { next: "Berikutnya", previous: "Sebelumnya" },
      },
      // Menambahkan class ke thead untuk styling (opsional)
      // dom: '<"datatable-header"fl>t<"datatable-footer"ip>', 
    });
  }, 0);
};

// --- LOGIKA CRUD UTAMA ---

// 1. Load Data
async function loadMessages() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/contact`);
    // Memastikan data yang diterima adalah array
    messages.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("Error loading messages:", err);
    Swal.fire("Gagal", "Tidak bisa memuat pesan. Cek koneksi API.", "error");
    messages.value = [];
  } finally {
    loading.value = false;
  }
}

// 2. Delete Confirmation
async function confirmDelete(id) {
  const result = await Swal.fire({
    title: "Yakin hapus?",
    text: "Pesan ini akan dihapus permanen dan tidak bisa dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    cancelButtonText: "Batal",
    confirmButtonText: "Ya, Hapus!",
  });

  if (result.isConfirmed) {
    deleteMessage(id);
  }
}

// 3. Delete Logic
async function deleteMessage(id) {
  try {
    await axios.delete(`${API_BASE_URL}/contact/${id}`);
    Swal.fire("Berhasil", "Pesan telah berhasil dihapus.", "success");
    // Muat ulang data setelah penghapusan
    await loadMessages();
  } catch (err) {
    console.error("Error deleting message:", err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menghapus pesan.", "error");
  }
}

// --- LIFECYCLE HOOKS ---

onMounted(() => {
  loadMessages();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // Bersihkan event listener
  window.removeEventListener('resize', handleResize);
  
  // Hancurkan Datatable
  if (table) {
    table.destroy();
    table = null;
  }
});

// Watcher untuk inisialisasi Datatables ketika data messages berubah/terisi
watch(messages, (newMessages) => {
  if (newMessages.length > 0 || !loading.value) {
    initDataTable();
  }
}, { deep: true });
</script>

<style scoped>
/* Tambahkan gaya khusus di sini jika diperlukan */
.bg-light-soft {
  background-color: #f8f9fa; /* Warna background lebih soft */
}

/* Penyesuaian ikon untuk Bootstrap Icon */
.bi-envelope-fill {
  color: var(--bs-primary);
}

.card.rounded-4 {
    border-radius: 1.5rem !important; /* Card yang lebih membulat */
}

/* DataTable header agar tidak terlalu besar di mobile */
@media (max-width: 767.98px) {
  .table-responsive {
    padding-bottom: 20px;
  }
}
</style>