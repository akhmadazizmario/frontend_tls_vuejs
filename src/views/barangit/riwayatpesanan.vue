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
          <h2 class="fw-bolder text-dark-blue mb-0">Laporan Pesanan Barang Inventory IT</h2>
          <div class="d-flex gap-2">
            <button class="btn btn-danger" @click="exportPdf">
              <i class="fas fa-file-pdf me-2"></i>Export PDF
            </button>
            <button class="btn btn-success" @click="exportExcel">
              <i class="fas fa-file-excel me-2"></i>Export Excel
            </button>
          </div>
        </div>
        <hr />

        <div class="card border-0 rounded-4 shadow-sm p-4 mb-4">
          <div class="card-body p-0">
            <div class="row align-items-end g-3">
              <div class="col-md-3">
                <label for="from" class="form-label text-muted">Dari Tanggal</label>
                <input type="date" id="from" v-model="fromDate" class="form-control" />
              </div>
              <div class="col-md-3">
                <label for="to" class="form-label text-muted">Sampai Tanggal</label>
                <input type="date" id="to" v-model="toDate" class="form-control" />
              </div>
              <div class="col-md-6 d-flex justify-content-end">
                <button class="btn btn-primary w-auto" @click="applyFilter">
                  <i class="fas fa-filter me-2"></i>Terapkan Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 rounded-4 shadow-sm p-3">
          <div class="card-body p-0">
            <div v-if="loading" class="text-center py-5 fs-5 text-muted">
              <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
            </div>
            <div v-else-if="reports.length === 0" class="text-center py-5 fs-5 text-muted">
              <i class="fas fa-exclamation-circle me-2"></i>Tidak ada data laporan.
            </div>
            <div v-else class="table-responsive">
              <table
                ref="reportTableRef"
                id="reportTable"
                class="table table-borderless table-hover mb-0 align-middle w-100"
              >
                <thead class="text-uppercase fw-bold text-secondary border-bottom">
                  <tr>
                    <th class="text-center">No</th>
                    <th>Pemesan</th>
                    <th>Nama Barang</th>
                    <th>Qty</th>
                    <th class="text-center">Status</th>
                    <th>Tanggal Pesanan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(report, index) in reports" :key="report.id">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td>{{ report.user?.name || '-' }}</td>
                    <td>{{ report.nama_barang || '-' }}</td>
                    <td>{{ report.qty || 0 }}</td>
                    <td class="text-center">
                      <span
                        :class="{
                          'badge rounded-pill': true,
                          'text-bg-warning': report.status === 'menunggu',
                          'text-bg-info': report.status === 'diproses',
                          'text-bg-success': report.status === 'selesai',
                          'text-bg-danger': report.status === 'dibatalkan',
                        }"
                      >
                        {{ report.status }}
                      </span>
                    </td>
                    <td>{{ new Date(report.createdAt).toLocaleString('id-ID') }}</td>
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
import { ref, onMounted, nextTick, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

const reports = ref([]);
const fromDate = ref("");
const toDate = ref("");
let table = null;

const loading = ref(false);
const reportTableRef = ref(null);

watch(reports, async (newReports) => {
  if (newReports.length > 0) {
    await nextTick();
    initializeDataTable();
  }
});

function initializeDataTable() {
  if (table) {
    table.destroy();
    table = null;
  }
  if (reportTableRef.value) {
    table = $(reportTableRef.value).DataTable({
      pageLength: 5,
      order: [[0, "asc"]],
      lengthChange: true,
      searching: true,
      responsive: true,
      language: {
        search: "Cari:",
        lengthMenu: "Tampilkan _MENU_ data",
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
  }
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}


async function loadReports() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/pesanan-barang-it/getriwayat`, {
      params: { from: fromDate.value, to: toDate.value, limit: 1000 }, // Ambil semua data
    });

    reports.value = res.data.data;
  } catch (error) {
    console.error("Gagal memuat data:", error);
    Swal.fire("Gagal", "Terjadi kesalahan saat memuat data.", "error");
  } finally {
    loading.value = false;
  }
}

function applyFilter() {
  loadReports();
}

async function exportFile(type) {
  try {
    const url = `${API_BASE_URL}/pesanan-barang-it/export/${type}?from=${fromDate.value}&to=${toDate.value}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Gagal export ${type.toUpperCase()}`);
    }

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `report-pesanan-it.${type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire("Berhasil", `File ${type.toUpperCase()} berhasil diunduh.`, "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", `Export ${type.toUpperCase()} gagal.`, "error");
  }
}

const exportPdf = () => exportFile("pdf");
const exportExcel = () => exportFile("excel");

onMounted(() => {
  loadReports();
});
</script>

<style scoped>
/* Anda bisa menggunakan kembali gaya dari kode `ComplainBuilding` */
.bg-light-soft {
  background-color: #f8f9fa;
}

.text-dark-blue {
  color: #1a237e;
}

.card.rounded-4 {
  border-radius: 1.5rem !important;
}

.badge.rounded-pill {
  padding: 0.5em 0.8em;
  font-weight: 500;
}

.table th,
.table td {
  white-space: nowrap;
}

#reportTable_filter input {
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}

#reportTable_paginate .paginate_button {
  border-radius: 0.5rem;
}

.btn i {
  margin-right: 0.5rem;
}
</style>