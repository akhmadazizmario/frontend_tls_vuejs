<template>
  <div class="d-flex flex-column min-vh-100 bg-light-subtle">
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
          <div class="card shadow-sm border-0 mb-4">
            <div
              class="card-header bg-white p-4 d-flex justify-content-between align-items-center"
            >
              <h4 class="mb-0 fw-bold">📊 Laporan Piece Work Input</h4>
            </div>

            <div class="card-body p-4">
              <!-- Filter -->
              <div class="mb-4">
                <form @submit.prevent="getReport">
                  <div class="row g-3">
                    <!-- Tanggal -->
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Pilih Tanggal:</label>
                      <input
                        type="date"
                        v-model="filters.pDate"
                        class="form-control"
                      />
                    </div>

                    <!-- Departemen -->
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Departemen:</label>
                      <select
                        v-model="filters.pDept"
                        class="form-select"
                      >
                        <option value="">-- Semua Departemen --</option>
                        <option
                          v-for="dept in departments"
                          :key="dept"
                          :value="dept"
                        >
                          {{ dept }}
                        </option>
                      </select>
                    </div>

                    <!-- Proses -->
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Proses:</label>
                      <select
                        v-model="filters.pProcess"
                        class="form-select"
                      >
                        <option value="">-- Semua Proses --</option>
                        <option
                          v-for="proc in processes"
                          :key="proc"
                          :value="proc"
                        >
                          {{ proc }}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div class="d-flex gap-2 mt-4">
                    <button type="submit" class="btn btn-primary">
                      <i class="bi bi-search me-2"></i>Tampilkan Data
                    </button>
                    <button type="button" @click="resetFilter" class="btn btn-secondary">
                      <i class="bi bi-x-circle me-2"></i>Reset Filter
                    </button>
                  </div>
                </form>
              </div>

              <!-- Table -->
              <div class="mt-4">
                <!-- Loading -->
  <div v-if="loading" class="text-center py-5">
    <video
      autoplay
      muted
      loop
      playsinline
      style="width: 180px; height: auto; border-radius: 12px;"
    >
      <source src="/loading.mp4" type="video/mp4" />
      Browser kamu tidak mendukung video tag.
    </video>
    <div class="mt-3 text-muted fs-5">
      Memuat data, harap tunggu...
    </div>
  </div>
                <div v-if="data.length > 0">
                  <div class="table-responsive">
                    <table id="finishingTable" class="table table-striped table-hover w-100">
                      <thead class="bg-light">
                        <tr>
                          <th>Tanggal</th>
                          <th>Departemen</th>
                          <th>Proses</th>
                          <th>Nama Karyawan</th>
                          <th>Warna</th>
                          <th>Size</th>
                          <th>Qty</th>
                          <th>Device</th>
                          <th>Style</th>
                          <th>Tgl Scan</th>
                          <th>Device</th>
                        </tr>
                      </thead>
                      <tbody></tbody>
                      <tfoot>
                        <tr>
                          <th colspan="6" class="text-end">Total All:</th>
                          <!-- <th>{{ totalQty }}</th> -->
                           <th>{{ displayedTotalQty }}</th>
                          <th colspan="2"></th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div v-else class="alert alert-info text-center">
                  Tidak ada data ditemukan. Silakan gunakan filter di atas.
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
import { ref, onMounted, nextTick, computed } from "vue";
import axios from "axios";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

import "bootstrap-icons/font/bootstrap-icons.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Filter
const filters = ref({
  pDate: "",
  pDept: "",
  pProcess: "",
});

const loading = ref(false);
const data = ref([]);
const departments = ref([]);
const processes = ref([]);

let dataTableInstance = null;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

const displayedTotalQty = ref(0)

// Fungsi untuk menghitung total dari data Datatables yang sedang ditampilkan/difilter
const calculateDisplayedTotal = () => {
    if (!dataTableInstance) {
        displayedTotalQty.value = 0;
        return;
    }

    // Menggunakan DataTables API untuk mendapatkan semua data yang telah difilter
    // data({ search: 'applied', page: 'all' })
    const filteredData = dataTableInstance.rows({ search: 'applied' }).data().toArray();
    
    // Hitung total Qty dari data yang difilter
    const total = filteredData.reduce((sum, row) => {
        // Pastikan 'qty' ada dan merupakan angka
        const qtyValue = Number(row.qty || 0);
        return sum + qtyValue;
    }, 0);

    // Update nilai reactive
    displayedTotalQty.value = total.toLocaleString('id-ID'); // Format angka ke string lokal
};

const totalQty = computed(() =>
  data.value.reduce((sum, row) => sum + Number(row.qty || 0), 0)
);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

const destroyDataTable = () => {
  if (dataTableInstance) {
    dataTableInstance.destroy();
    dataTableInstance = null;
  }
};

const initializeDataTable = () => {
  nextTick(() => {
    const tableEl = document.getElementById("finishingTable");
    if (!tableEl) return;

    destroyDataTable();
    dataTableInstance = $(tableEl).DataTable({
      dom: "Bfrtip",
      pageLength: 100,
      buttons: ["excel", "pdf", "print"],
      responsive: true,
      order: [[9, 'desc']],
      data: data.value,
      columns: [
        { data: "xDate", render: (d) => formatDate(d) },
        { data: "name_dept" },
        { data: "name_process" },
        { data: "name_empl" },
        { data: "warna" },
        { data: "xSize" },
        { data: "qty" },
        { data: "Device" },
        { data: "xPO" },
        { data: "tanggal_scan", render: (d) => formatDateTime(d)  },
        { data: "Device" }
      ],
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
      drawCallback: function(settings) {
                calculateDisplayedTotal();
            },
    });
    calculateDisplayedTotal();
  });
};

const getReport = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/target/finishing`, {
      params: filters.value,
    });
    data.value = res.data.data || [];
    initializeDataTable();
  } catch (err) {
    console.error("Error getReport:", err);
  } finally {
    loading.value = false; // sembunyikan loading setelah selesai
  }
};

const resetFilter = () => {
  filters.value = { pDate: "", pDept: "", pProcess: "" };
  data.value = [];
  destroyDataTable();
  displayedTotalQty.value = 0; // Reset total
};

// Format tanggal
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

// Format tanggal: 14 Nov 2025 05:00
const formatDateTime  = (dateStr) => {
  if (!dateStr) return "";

  // Cek apakah ini format ISO/Browser (ada 'T')
  if (dateStr.includes('T')) {
    
    // 1. Ambil bagian tanggal (YYYY-MM-DD)
    const datePart = dateStr.split("T")[0]; // '2025-10-29'
    
    // Konversi YYYY-MM-DD menjadi DD/MM/YYYY
    const [year, month, day] = datePart.split('-');
    const formattedDate = `${day}/${month}/${year}`; // '29/10/2025'

    // 2. Ambil bagian waktu (HH:MM:SS) dan hilangkan milidetik/Z
    let timeAndZone = dateStr.split("T")[1];
    
    // Hapus milidetik dan Z
    let formattedTime = timeAndZone.split('.')[0]; // '09:08:13'

    // 3. Gabungkan dan tambahkan 'UTC'
    return `${formattedDate} ${formattedTime} `;
    
  } 
  
  // Cek apakah ini format Database (ada spasi)
  else if (dateStr.includes(' ')) {
      
    // 1. Ambil bagian tanggal (YYYY-MM-DD)
    const datePart = dateStr.split(" ")[0]; // '2025-10-29'
    
    // Konversi YYYY-MM-DD menjadi DD/MM/YYYY
    const [year, month, day] = datePart.split('-');
    const formattedDate = `${day}/${month}/${year}`; // '29/10/2025'

    // 2. Ambil bagian waktu (HH:MM:SS) dan hilangkan milidetik
    let timePart = dateStr.split(" ")[1];
    let formattedTime = timePart.split('.')[0]; // '06:33:11'

    // 3. Gabungkan dan tambahkan label (asumsi waktu database adalah waktu server/lokal)
    return `${formattedDate} ${formattedTime} Server Time`;
  }
  
  // Jika format tidak dikenali, kembalikan string asli
  return dateStr; 
};


onMounted(() => {
  // contoh static, bisa kamu ganti dengan API untuk ambil list department dan process
  departments.value = ["SOOM SONTEX", "Sewing Lo", "SULAM"];
  processes.value = ["ST Hotmelt", "SULAM", "LO Belum Soom", "CUP SEAM", "STIK 24", "STIK 26", 
  "STIK 06", "STIK 07", "STIK 10", "STIK 11", "STIK 12", "STIK 14", "STIK 15", "STIK 16", "STIK 17", "STIK 18", "STIK 20", 
  "STIK 21", "STIK 22", "STIK 23", "STIK 13", "STIK 05", "STIK 08", "STIK 17", "STIK 02", "STIK 09", "STIK 03", "STIK 19", 
  "STIK 25", "STIK 27", "STIK 34", "STIK 28", "STIK 29", "STIK 30", "STIK 31", "STIK 32", "STIK 33", "STIK 04"];


  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<style scoped>
/* Tambahan styling opsional */
</style>
