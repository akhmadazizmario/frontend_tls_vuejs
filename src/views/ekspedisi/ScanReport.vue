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
              <h4 class="mb-0 fw-bold">Laporan Hasil Scan Ekspedisi</h4>
            </div>
            <div class="card-body p-4">
              <!-- Filter -->
              <div class="mb-4">
                <form @submit.prevent="getReport">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <label for="date-filter" class="form-label fw-semibold"
                        >Pilih Tanggal:</label
                      >
                      <input
                        type="date"
                        id="date-filter"
                        v-model="filters.selected_date"
                        class="form-control"
                      />
                    </div>
                    <div class="col-md-4">
                      <label for="owner-filter" class="form-label fw-semibold"
                        >Owner:</label
                      >
                      <select
                        id="owner-filter"
                        v-model="filters.xOwner"
                        class="form-select"
                      >
                        <option value="">-- Semua Owner --</option>
                        <option
                          v-for="o in owners"
                          :key="o.xOwner"
                          :value="o.xOwner"
                        >
                          {{ o.xOwner }}
                        </option>
                      </select>
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
                <div v-if="data.length > 0">
                  <div class="table-responsive">
                    <table
                      id="reportTable"
                      class="table table-striped table-hover w-100"
                    >
                      <thead class="bg-light">
                        <tr>
                          <th>Tanggal</th>
                          <th>Owner</th>
                          <th>Nama PC</th>
                          <th>Total Qty</th>
                        </tr>
                      </thead>
                      <tbody></tbody>
                      <tfoot>
                        <tr>
                          <th colspan="3" class="text-end">Total:</th>
                          <th>{{ totalQty }}</th>
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

const filters = ref({
  selected_date: "",
  xOwner: "",
  xPC: "",
});

const data = ref([]);
const owners = ref([]);
const pcs = ref([]);
let dataTableInstance = null;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

const totalQty = computed(() => {
  return data.value.reduce(
    (sum, row) => sum + Number(row.total_qty || 0),
    0
  );
});

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
    const tableEl = document.getElementById("reportTable");
    if (!tableEl) return;

    destroyDataTable();
    dataTableInstance = $(tableEl).DataTable({
      dom: "Bfrtip",
      buttons: ["excel", "pdf", "print"],
      responsive: true,
      data: data.value, // langsung kasih array dari Vue
      columns: [
        { data: "scan_date", render: (d) => formatDate(d) },
        { data: "xOwner" },
        { data: "xPC" },
        { data: "total_qty" },
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
    });
  });
};

const getReport = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/ekspedisi/report`, {
      params: filters.value,
    });
    data.value = res.data.data || [];
    initializeDataTable();
  } catch (err) {
    console.error("Error getReport:", err);
  }
};

const resetFilter = () => {
  filters.value = { selected_date: "", xOwner: "", xPC: "" };
  data.value = [];
  destroyDataTable();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

onMounted(() => {
  owners.value = [{ xOwner: "PTLS1" }, { xOwner: "PTLS2" }];
  pcs.value = [{ xPC: "PC01" }, { xPC: "PC02" }];

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<style scoped>
/* Scoped CSS bisa ditambahkan di sini */
</style>
