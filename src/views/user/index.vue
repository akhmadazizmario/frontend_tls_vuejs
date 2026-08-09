<template>
  <div class="d-flex flex-column min-vh-100 bg-light">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-4"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px',
        }"
      >
        <div class="container-fluid" style="max-width: 1200px">
          <h2 class="mb-4 text-primary fw-bold">Manajemen User</h2>

          <!-- Tambah User -->
          <div class="card shadow-sm mb-4">
            <div
              class="card-header bg-white border-0 d-flex align-items-center justify-content-between"
            >
              <h5 class="card-title fw-bold text-dark mb-0">
                <i class="bi bi-person-plus-fill me-2 text-primary"></i>Tambah
                User Baru
              </h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="createUser">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label text-muted">Nama</label>
                    <input
                      v-model="form.name"
                      class="form-control form-control-sm"
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted">No Pegawai</label>
                    <input
                      v-model="form.nopegawai"
                      class="form-control form-control-sm"
                      placeholder="Nomor pegawai"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted">Email</label>
                    <input
                      v-model="form.email"
                      type="email"
                      class="form-control form-control-sm"
                      placeholder="Email aktif"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted">Phone</label>
                    <input
                      v-model="form.phone"
                      class="form-control form-control-sm"
                      placeholder="Nomor telepon"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted">Password</label>
                    <input
                      v-model="form.password"
                      type="password"
                      class="form-control form-control-sm"
                      placeholder="Minimal 8 karakter"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted">Dept</label>
                    <input
                      v-model="form.dept"
                      class="form-control form-control-sm"
                      placeholder="Departemen"
                    />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label text-muted">Jabatan</label>
                    <input
                      v-model="form.jabatan"
                      class="form-control form-control-sm"
                      placeholder="Jabatan"
                    />
                  </div>
                </div>
                <div class="d-flex justify-content-end mt-4">
                  <button type="submit" class="btn btn-primary btn-sm px-4">
                    <i class="bi bi-plus-lg me-2"></i>Tambah User
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Daftar User -->
          <div class="card shadow-sm">
            <div
              class="card-header bg-white border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center"
            >
              <h5 class="card-title fw-bold text-dark mb-2 mb-md-0">
                <i class="bi bi-people-fill me-2 text-primary"></i>Daftar User
              </h5>
            </div>
            <div class="card-body p-3">
              <div class="table-responsive">
                <table
                  id="user-table"
                  class="table table-hover table-striped mb-0"
                >
                  <thead class="table-light">
                    <tr>
                      <th scope="col">Nama</th>
                      <th scope="col">Email</th>
                      <th scope="col">No Pegawai</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Dept</th>
                      <th scope="col">Jabatan</th>
                      <th scope="col">Created At</th>
                      <th scope="col" class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <Footer />

    <!-- Modal Edit -->
    <div
      v-if="editingUser"
      class="modal fade show d-block"
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Edit User</h5>
            <button type="button" class="btn-close" @click="cancelEdit"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label text-muted">Nama</label>
                  <input
                    v-model="form.name"
                    class="form-control form-control-sm"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">No Pegawai</label>
                  <input
                    v-model="form.nopegawai"
                    class="form-control form-control-sm"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Email</label>
                  <input
                    v-model="form.email"
                    class="form-control form-control-sm"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Phone</label>
                  <input
                    v-model="form.phone"
                    class="form-control form-control-sm"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted"
                    >Password (opsional)</label
                  >
                  <input
                    v-model="form.password"
                    type="password"
                    class="form-control form-control-sm"
                    placeholder="Kosongkan jika tidak ingin ganti"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Dept</label>
                  <input v-model="form.dept" class="form-control form-control-sm" />
                </div>
                <div class="col-md-6">
                  <label class="form-label text-muted">Jabatan</label>
                  <input
                    v-model="form.jabatan"
                    class="form-control form-control-sm"
                  />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button @click="updateUser" class="btn btn-primary btn-sm px-4">
              Simpan
            </button>
            <button
              @click="cancelEdit"
              class="btn btn-outline-secondary btn-sm px-4"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// State Halaman
const form = ref({
  name: "",
  nopegawai: "",
  email: "",
  phone: "",
  password: "",
  dept: "",
  jabatan: "",
});
const editingUser = ref(null);
let dataTable;

// State User & UI
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}
function handleResize() {
  windowWidth.value = window.innerWidth;
}
function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// --- CRUD User ---
const getUsers = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/users`);
    const usersData = res.data.data;

    if ($.fn.DataTable.isDataTable("#user-table")) {
      $("#user-table").DataTable().clear().destroy();
    }

    dataTable = $("#user-table").DataTable({
      data: usersData,
      columns: [
        { data: "name" },
        { data: "email" },
        { data: "nopegawai" },
        { data: "phone" },
        { data: "dept" },
        { data: "jabatan" },
        {
          data: "createdAt",
          render: function (data, type) {
            if (type === "display" || type === "filter") {
              if (!data) return "-";
              const d = new Date(data);
              return d.toLocaleString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
            }
            return data; // raw ISO string buat sorting
          },
        },
        {
          data: null,
          className: "text-center",
          render: function (data, type, row) {
            return `
              <button class="btn btn-warning btn-sm me-2 edit-btn" data-id="${row.id}">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${row.id}">
                <i class="bi bi-trash"></i>
              </button>
            `;
          },
        },
      ],
      responsive: true,
      pageLength: 10,
      lengthMenu: [
        [5, 10, 25, 50, -1],
        [5, 10, 25, 50, "All"],
      ],
      order: [[6, "desc"]], // 🔥 createdAt terbaru di atas
      language: {
        search: "Cari:",
        lengthMenu: "Tampilkan _MENU_ entri",
        info: "Menampilkan _START_ hingga _END_ dari _TOTAL_ entri",
        infoEmpty: "Menampilkan 0 hingga 0 dari 0 entri",
        infoFiltered: "(disaring dari _MAX_ total entri)",
        paginate: {
          first: "Awal",
          last: "Akhir",
          next: "Berikutnya",
          previous: "Sebelumnya",
        },
      },
    });

    $("#user-table tbody")
      .off("click")
      .on("click", ".edit-btn", (e) => {
        const id = $(e.currentTarget).data("id");
        const userToEdit = usersData.find((u) => u.id === id);
        if (userToEdit) editUser(userToEdit);
      });

    $("#user-table tbody").on("click", ".delete-btn", (e) => {
      const id = $(e.currentTarget).data("id");
      deleteUser(id);
    });
  } catch (e) {
    Swal.fire("Error", "Gagal mengambil data user", "error");
  }
};

const createUser = async () => {
  try {
    await axios.post(`${API_BASE_URL}/users`, form.value);
    form.value = {
      name: "",
      nopegawai: "",
      email: "",
      phone: "",
      password: "",
      dept: "",
      jabatan: "",
    };
    getUsers();
    Swal.fire("Sukses", "User berhasil ditambahkan!", "success");
  } catch (e) {
    Swal.fire("Error", "Gagal menambah user atau user sudah di buat sebelumnya", "error");
  }
};

const editUser = (u) => {
  editingUser.value = u.id;
  form.value = { ...u, password: "" };
};

const updateUser = async () => {
  try {
    await axios.put(`${API_BASE_URL}/users/${editingUser.value}`, form.value);
    editingUser.value = null;
    getUsers();
    Swal.fire("Sukses", "User berhasil diupdate!", "success");
  } catch (e) {
    Swal.fire("Error", "Gagal update user", "error");
  }
};

function cancelEdit() {
  editingUser.value = null;
}

async function deleteUser(id) {
  Swal.fire({
    title: "Yakin hapus?",
    text: "Data user tidak bisa dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, hapus!",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      getUsers();
      Swal.fire("Dihapus!", "User berhasil dihapus.", "success");
    }
  });
}

// --- Lifecycle ---
onMounted(() => {
  const userData = localStorage.getItem("user");
  if (!userData) {
    window.location.href = "/login";
  } else {
    user.value = JSON.parse(userData);
  }

  getUsers();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable("#user-table")) {
    dataTable.destroy();
  }
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
body {
  background-color: #f8f9fa;
}
.card-header {
  border-bottom: 1px solid #e9ecef;
}
.table-hover tbody tr:hover {
  background-color: #f1f3f5;
}
.form-label {
  font-size: 0.85rem;
  font-weight: 500;
}
</style>
