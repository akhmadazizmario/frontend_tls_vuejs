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
            <h2 class="fw-bolder text-dark-blue mb-0">Daftar Komputer</h2>
            <button class="btn btn-primary" @click="openCreateModal">
              <i class="fas fa-plus me-2"></i>Tambah Komputer
            </button>
          </div>
          <hr />

          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>
              <div v-else-if="komputers.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-exclamation-circle me-2"></i>Data komputer kosong.
              </div>
              <div v-else class="table-responsive">
                <table
                  ref="tableRef"
                  id="komputerTable"
                  class="table table-borderless table-hover mb-0 align-middle w-100"
                >
                  <thead class="text-uppercase fw-bold text-secondary border-bottom">
                    <tr>
                      <th class="text-center">No</th>
                      <th>IP</th>
                      <th>Device</th>
                      <th>Pengguna</th>
                      <th class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in komputers" :key="item.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>{{ item.name_ip }}</td>
                      <td>{{ item.name_laptop }}</td>
                      <td>{{ item.nama_pengguna }}</td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-warning me-2" @click="openEditModal(item)">
                          edit
                        </button>
                        <button class="btn btn-sm btn-danger" @click="deleteKomputer(item.id)">
                          hapus
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Create/Edit -->
<div
  v-if="showModal"
  class="modal fade show d-block"
  tabindex="-1"
  style="background: rgba(0,0,0,0.5); position: fixed; top: 0; left: 0; width: 100%; height: 100%;"
>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content rounded-4">
      <div class="modal-header">
        <h5 class="modal-title">{{ editMode ? 'Edit Komputer' : 'Tambah Komputer' }}</h5>
        <button type="button" class="btn-close" @click="closeModal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label">IP</label>
          <input v-model="form.name_ip" type="text" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">Laptop</label>
          <input v-model="form.name_laptop" type="text" class="form-control" />
        </div>
        <div class="mb-3">
          <label class="form-label">Pengguna</label>
          <input v-model="form.nama_pengguna" type="text" class="form-control" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">Batal</button>
        <button class="btn btn-primary" @click="saveKomputer">
          {{ editMode ? 'Update' : 'Simpan' }}
        </button>
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

const komputers = ref([]);
const loading = ref(false);
const tableRef = ref(null);
let table = null;

const showModal = ref(false);
const editMode = ref(false);
const form = ref({ id: null, name_ip: "", name_laptop: "", nama_pengguna: "" });

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}
function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

watch(komputers, async (newData) => {
  if (newData.length > 0) {
    await nextTick();
    initializeDataTable();
  }
});

function initializeDataTable() {
  if (table) {
    table.destroy();
    table = null;
  }
  if (tableRef.value) {
    table = $(tableRef.value).DataTable({
      pageLength: 10,
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

async function loadKomputers() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/komputer`);
    komputers.value = res.data;
  } catch (err) {
    console.error("Error load:", err);
    Swal.fire("Error", "Gagal memuat data komputer", "error");
  } finally {
    loading.value = false;
  }
}

function openCreateModal() {
  editMode.value = false;
  form.value = { id: null, name_ip: "", name_laptop: "", nama_pengguna: "" };
  showModal.value = true;
}
function openEditModal(item) {
  editMode.value = true;
  form.value = { ...item };
  showModal.value = true;
}
function closeModal() {
  showModal.value = false;
}

async function saveKomputer() {
  try {
    if (editMode.value) {
      await axios.put(`${API_BASE_URL}/komputer/${form.value.id}`, form.value);
      Swal.fire("Berhasil", "Data berhasil diperbarui", "success");
    } else {
      await axios.post(`${API_BASE_URL}/komputer`, form.value);
      Swal.fire("Berhasil", "Data berhasil ditambahkan", "success");
    }
    closeModal();
    loadKomputers();
  } catch (err) {
    console.error("Save error:", err);
    Swal.fire("Error", "Gagal menyimpan data", "error");
  }
}

async function deleteKomputer(id) {
  const confirm = await Swal.fire({
    title: "Hapus Data?",
    text: "Data yang dihapus tidak bisa dikembalikan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });
  if (confirm.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/komputer/${id}`);
      Swal.fire("Berhasil", "Data berhasil dihapus", "success");
      loadKomputers();
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire("Error", "Gagal menghapus data", "error");
    }
  }
}

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) {
    user.value = JSON.parse(userData);
  }
  loadKomputers();
  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<style scoped>
.bg-light-soft {
  background-color: #f8f9fa;
}
.text-dark-blue {
  color: #1a237e;
}
.card.rounded-4 {
  border-radius: 1.5rem !important;
}
.table th,
.table td {
  white-space: nowrap;
}
.modal-backdrop {
  display: none;
}
</style>
