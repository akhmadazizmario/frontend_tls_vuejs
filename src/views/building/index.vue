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
            <h2 class="fw-bolder text-dark-blue mb-0">Laporan Building</h2>
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
                      <th>Pelapor</th>
                      <th>Pekerja</th>
                      <th>Keluhan</th>
                      <th class="text-center">Status</th>
                      <th>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(report, index) in reports" :key="report.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>{{ report.pelapor?.name || '-' }}</td>
                      <td>{{ report.pekerja?.name || '-' }}</td>
                      <td>{{ report.keluhan || '-' }}</td>
                      <td class="text-center">
                        <span
                          :class="{
                            'badge rounded-pill': true,
                            'text-bg-warning': report.status === 'dalam_proses',
                            'text-bg-primary': report.status === 'review',
                            'text-bg-success': report.status === 'selesai',
                            'text-bg-danger': report.status === 'ditolak',
                            'text-bg-secondary': report.status === 'tidak_dikerjakan',
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

const reports = ref([]);
const fromDate = ref("");
const toDate = ref("");
let table = null;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

// Tambahkan ref untuk merujuk ke elemen tabel
const reportTableRef = ref(null);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// Watcher untuk menginisialisasi DataTables saat reports.value berubah
watch(reports, async (newReports) => {
  if (newReports.length > 0) {
    await nextTick();
    initializeDataTable();
  }
});

function initializeDataTable() {
  // Hancurkan instance DataTables yang ada
  if (table) {
    table.destroy();
    table = null;
  }

  // Periksa apakah elemen tabel ada sebelum menginisialisasi
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

async function loadReports() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/buildingcomplain/building`, {
      params: { from: fromDate.value, to: toDate.value },
    });

    reports.value = Array.isArray(res.data) ? res.data : res.data.rows || res.data.data || [];
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
    const url = `${API_BASE_URL}/buildingcomplain/building/${type}?from=${fromDate.value}&to=${toDate.value}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Gagal export ${type.toUpperCase()}`);
    }

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `report-building.${type}`;
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
  const userData = localStorage.getItem("user");
  if (userData) {
    user.value = JSON.parse(userData);
  }
  loadReports();

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<style scoped>
/* Warna latar belakang dan teks yang lebih halus */
.bg-light-soft {
  background-color: #f8f9fa;
}

.text-dark-blue {
  color: #1a237e; /* Warna biru gelap */
}

/* Gaya tambahan untuk card */
.card.rounded-4 {
  border-radius: 1.5rem !important; /* Radius sudut yang lebih besar */
}

/* Gaya untuk badge */
.badge.rounded-pill {
  padding: 0.5em 0.8em;
  font-weight: 500;
}

.table th,
.table td {
  white-space: nowrap;
}

/* Kustomisasi gaya DataTables */
#reportTable_filter input {
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}

#reportTable_paginate .paginate_button {
  border-radius: 0.5rem;
}

/* Gaya untuk ikon */
.btn i {
  margin-right: 0.5rem;
}
</style>