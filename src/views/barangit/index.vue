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
            <h2 class="fw-bolder text-dark-blue mb-0">📦 Manajemen Barang IT</h2>
            <button
              class="btn btn-primary btn-add-item"
              data-bs-toggle="modal"
              data-bs-target="#barangModal"
              @click="openAddModal"
            >
              <i class="fas fa-plus me-2"></i>Tambah Barang
            </button>
          </div>
          <hr />

          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>
              <div v-else-if="items.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-exclamation-circle me-2"></i>Tidak ada data barang.
              </div>
              <div v-else class="table-container">
                <!-- <div class="d-flex justify-content-end mb-3">
                  <input type="text" class="form-control w-25" placeholder="Cari..." v-model="searchQuery" />
                </div> -->
                <div class="table-responsive">
                  <table
                    id="barangTable"
                    class="table table-borderless table-hover mb-0 align-middle w-100"
                  >
                    <thead class="text-uppercase fw-bold text-secondary border-bottom">
                      <tr>
                        <th class="text-center">No</th>
                        <th>Nama Barang</th>
                        <th class="text-center">Qty</th>
                        <th class="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in items" :key="item.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>{{ item.nama_barang }}</td>
                        <td class="text-center">{{ item.qty }}</td>
                        <td class="text-center">
                          <div class="d-flex justify-content-center">
                            <button
                              class="btn btn-sm btn-warning me-2"
                              data-bs-toggle="modal"
                              data-bs-target="#barangModal"
                              @click="openEditModal(item)"
                            >
                              <i class="bi bi-pencil-square"></i>
                            </button>
                            <button
                              class="btn btn-sm btn-danger"
                              @click="deleteBarang(item.id)"
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

  <div class="modal fade" id="barangModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 shadow">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ editMode ? "Edit Barang" : "Tambah Barang" }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveBarang">
            <div class="mb-3">
              <label class="form-label">Nama Barang</label>
              <input
                v-model="form.nama_barang"
                type="text"
                class="form-control"
                required
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Qty</label>
              <input
                v-model="form.qty"
                type="number"
                min="1"
                class="form-control"
                required
              />
            </div>
            <div class="d-flex justify-content-end">
              <button type="submit" class="btn btn-primary" data-bs-dismiss="modal">
                {{ editMode ? "Update" : "Simpan" }}
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

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const editMode = ref(false);
const form = ref({ id: null, nama_barang: "", qty: 1 });
let table = null;

// Fungsi-fungsi untuk Datatables
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable("#barangTable")) {
    $("#barangTable").DataTable().destroy();
  }
  setTimeout(() => {
    table = $("#barangTable").DataTable({
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
  }, 0);
};

// Watcher untuk memuat ulang Datatables saat data berubah
watch(items, () => {
  reloadDataTable();
}, { deep: true });

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

async function loadBarang() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/barangit`);
    items.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak bisa memuat data barang.", "error");
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  editMode.value = false;
  form.value = { id: null, nama_barang: "", qty: 1 };
}

function openEditModal(item) {
  editMode.value = true;
  form.value = { ...item };
}

async function saveBarang() {
  try {
    if (editMode.value) {
      await axios.put(`${API_BASE_URL}/barangit/${form.value.id}`, form.value);
      Swal.fire("Berhasil", "Barang berhasil diupdate.", "success");
    } else {
      await axios.post(`${API_BASE_URL}/barangit`, form.value);
      Swal.fire("Berhasil", "Barang berhasil ditambahkan.", "success");
    }

    // Hapus kode ini karena sudah ditangani oleh data-bs-dismiss
    // $('#barangModal').modal('hide'); 

    loadBarang();
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
  }
}

async function deleteBarang(id) {
  Swal.fire({
    title: "Yakin ingin menghapus?",
    text: "Data barang akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/barangit/${id}`);
        Swal.fire("Berhasil", "Barang berhasil dihapus.", "success");
        loadBarang();
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
  loadBarang();

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});

onBeforeUnmount(() => {
    if ($.fn.DataTable.isDataTable("#barangTable")) {
        $("#barangTable").DataTable().destroy();
    }
});

</script>