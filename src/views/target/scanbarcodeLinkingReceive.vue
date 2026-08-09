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
              <h4 class="mb-0 fw-bold">
                📦 Laporan Target Receive Linking & SOOM SONTEX
              </h4>
            </div>

            <div class="card-body p-4">
              <!-- Filter -->
              <div class="mb-4">
                <a
                  href="/scan-barcode-detail"
                  class="btn btn-warning mt-3 mb-3"
                  ><i class="bi bi-box-arrow-in-left me-2"></i>Kembali</a
                >
                <form @submit.prevent="getReport">
                  <div class="row g-3">
                    <!-- Periode -->
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Dari Tanggal:</label>
                      <input
                        type="date"
                        v-model="filters.pSysBeginDate"
                        class="form-control"
                      />
                    </div>

                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Sampai Tanggal:</label>
                      <input
                        type="date"
                        v-model="filters.pSysEndDate"
                        class="form-control"
                      />
                    </div>

                    <!-- Process Type -->
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Process Type:</label>
                      <select v-model="filters.pProcessType" class="form-select">
                        <option value="">Semua</option>
                        <option value="63">Linking</option>
                        <option value="69">SOOM SONTEX</option>
                      </select>
                    </div>

                    <!-- Nomor PO -->
                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Nomor PO:</label>
                      <input
                        type="text"
                        v-model="filters.pPO"
                        placeholder="Contoh: 4494-2305A"
                        class="form-control"
                      />
                    </div>
                  </div>

                  <div class="d-flex gap-2 mt-4">
                    <button type="submit" class="btn btn-primary">
                      <i class="bi bi-search me-2"></i>Tampilkan Data
                    </button>
                    <button
                      type="button"
                      @click="resetFilter"
                      class="btn btn-secondary"
                    >
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
                    <table
                      id="targetReceiveTable"
                      class="table table-striped table-hover w-100"
                    >
                      <thead class="bg-light">
                        <tr>
                          <th>PO</th>
                          <th>Dept</th>
                          <th>Work</th>
                          <th>Group Employee</th>
                          <th>Machine</th>
                          <th>Redo</th>
                          <th>Work Controller</th>
                          <th>Owner</th>
                          <th>PC</th>
                          <th>Process Type</th>
                          <th>Total Qty</th>
                        </tr>
                      </thead>
                      <tbody></tbody>
                      <tfoot>
                        <tr>
                          <th colspan="10" class="text-end">Total All:</th>
                          <th>{{ displayedTotalQty }}</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div
                  v-else-if="!loading"
                  class="alert alert-info text-center"
                >
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
import { ref, onMounted, nextTick } from "vue";
import axios from "axios";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const filters = ref({
  pPO: "",
  pSysBeginDate: "",
  pSysEndDate: "",
  pProcessType: "",
});

const loading = ref(false);
const data = ref([]);
let dataTableInstance = null;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const displayedTotalQty = ref(0);

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

const calculateDisplayedTotal = () => {
  if (!dataTableInstance) {
    displayedTotalQty.value = 0;
    return;
  }
  const filteredData = dataTableInstance
    .rows({ search: "applied" })
    .data()
    .toArray();
  const total = filteredData.reduce(
    (sum, row) => sum + Number(row.TotalQty || 0),
    0
  );
  displayedTotalQty.value = total.toLocaleString("id-ID");
};

const initializeDataTable = () => {
  nextTick(() => {
    const tableEl = document.getElementById("targetReceiveTable");
    if (!tableEl) return;

    destroyDataTable();
    dataTableInstance = $(tableEl).DataTable({
      dom: "Bfrtip",
      pageLength: 100,
      buttons: ["excel", "pdf", "print"],
      responsive: true,
      order: [[0, "asc"]],
      data: data.value,
      columns: [
        { data: "xPO" },
        { data: "_DeptName" },
        { data: "_WorkName" },
        { data: "_gEmplName" },
        { data: "_MachName" },
        { data: "_RedoName" },
        { data: "_EmplName" },
        { data: "xOwner" },
        { data: "xPC" },
        { data: "ProcessType" },
        {
          data: "TotalQty",
          render: (d) => d?.toLocaleString("id-ID") || 0,
        },
      ],
      language: {
        search: "Cari:",
        zeroRecords: "Data tidak ditemukan",
        info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
        infoEmpty: "Tidak ada data tersedia",
        infoFiltered: "(difilter dari _MAX_ total data)",
        paginate: { next: "Berikutnya", previous: "Sebelumnya" },
      },
      drawCallback: calculateDisplayedTotal,
    });
    calculateDisplayedTotal();
  });
};

const getReport = async () => {
  loading.value = true;
  try {
    const res = await axios.get(
      `${API_BASE_URL}/target/linking-scanbarcode-receive`,
      { params: filters.value }
    );
    data.value = res.data.data || [];
    initializeDataTable();
  } catch (err) {
    console.error("Error getReport:", err);
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  filters.value = { pPO: "", pSysBeginDate: "", pSysEndDate: "", pProcessType: "" };
  data.value = [];
  destroyDataTable();
  displayedTotalQty.value = 0;
};

onMounted(() => {
  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>
