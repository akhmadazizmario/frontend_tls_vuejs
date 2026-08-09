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
          <!-- TITLE -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bolder text-dark-blue mb-0">
              ❓ Manajemen Pertanyaan APAR
            </h2>

            <button
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#questionModal"
              @click="openAddModal"
              v-if="canManage"
            >
              <i class="bi bi-plus-circle"></i> Tambah Pertanyaan
            </button>
          </div>

          <hr />

          <!-- TABLE -->
          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>

              <div
                v-else-if="questions.length === 0"
                class="text-center py-5 text-muted"
              >
                <i class="fas fa-exclamation-circle me-2"></i>
                Belum ada pertanyaan.
              </div>

              <div v-else class="table-responsive">
                <table
                  id="questionTable"
                  class="table table-borderless table-hover align-middle mb-0 w-100"
                >
                  <thead class="text-uppercase fw-bold text-secondary border-bottom">
                    <tr>
                      <th class="text-center">No</th>
                      <th>Pertanyaan</th>
                      <th>Status</th>
                      <th class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(q, index) in questions" :key="q.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>{{ q.pertanyaan }}</td>
                      <td>
                        <span
                          class="badge"
                          :class="q.is_active ? 'bg-success' : 'bg-secondary'"
                        >
                          {{ q.is_active ? "Aktif" : "Nonaktif" }}
                        </span>
                      </td>
                      <td class="text-center">
                        <template v-if="canManage">
                          <button
                            class="btn btn-sm btn-warning me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#questionModal"
                            @click="openEditModal(q)"
                          >
                            <i class="bi bi-pencil-square"></i>
                          </button>

                          <button
                            class="btn btn-sm btn-danger"
                            @click="deleteItem(q.id)"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </template>
                        <template v-else>
                          <span class="text-muted small">No action</span>
                        </template>
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

  <!-- MODAL -->
  <div class="modal fade" id="questionModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content rounded-4 shadow">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ editMode ? "Edit Pertanyaan" : "Tambah Pertanyaan" }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="saveItem">
            <div class="mb-3">
              <label class="form-label fw-semibold">Pertanyaan</label>
              <textarea
                v-model="form.pertanyaan"
                class="form-control"
                rows="3"
                required
              ></textarea>
            </div>

            <div class="form-check mb-3">
              <input
                class="form-check-input"
                type="checkbox"
                v-model="form.is_active"
                :true-value="1"
                :false-value="0"
              />
              <label class="form-check-label fw-semibold">
                Aktifkan pertanyaan
              </label>
            </div>

            <div class="d-flex justify-content-end">
              <button
                type="submit"
                class="btn btn-primary"
                data-bs-dismiss="modal"
              >
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
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const questions = ref([]);
const editMode = ref(false);
const form = ref({
  id: null,
  pertanyaan: "",
  is_active: 1
});

const canManage = computed(() =>
  ["it", "fco"].includes(user.value.dept?.toLowerCase())
);

let table = null;

/* DATATABLE */
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable("#questionTable")) {
    $("#questionTable").DataTable().destroy();
  }
  setTimeout(() => {
    table = $("#questionTable").DataTable({
      pageLength: 10,
      lengthChange: false,
      language: {
        search: "Cari:",
        zeroRecords: "Data tidak ditemukan",
        info: "Menampilkan _START_ - _END_ dari _TOTAL_ data",
        paginate: { next: "›", previous: "‹" }
      }
    });
  }, 0);
};

watch(questions, reloadDataTable, { deep: true });

/* ACTION */
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

async function loadItems() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/apartlsquestion`);
    questions.value = res.data || [];
  } catch {
    Swal.fire("Gagal", "Tidak bisa memuat data", "error");
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  editMode.value = false;
  form.value = { id: null, pertanyaan: "", is_active: 1 };
}

function openEditModal(item) {
  editMode.value = true;
  form.value = { ...item };
}

async function saveItem() {
  try {
    if (editMode.value) {
      await axios.put(
        `${API_BASE_URL}/apartlsquestion/${form.value.id}`,
        form.value
      );
      Swal.fire("Berhasil", "Pertanyaan diperbarui", "success");
    } else {
      await axios.post(`${API_BASE_URL}/apartlsquestion`, form.value);
      Swal.fire("Berhasil", "Pertanyaan ditambahkan", "success");
    }
    loadItems();
  } catch {
    Swal.fire("Gagal", "Gagal menyimpan data", "error");
  }
}

async function deleteItem(id) {
  Swal.fire({
    title: "Hapus pertanyaan?",
    html: `
      <small>
        Pertanyaan ini akan <b>DIHAPUS PERMANEN</b><br/>
        dan <b>seluruh checklist terkait</b> ikut terhapus.
      </small>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal"
  }).then(async (res) => {
    if (res.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/apartlsquestion/${id}`);
        Swal.fire("Berhasil", "Data berhasil dihapus", "success");
        loadItems();
      } catch {
        Swal.fire("Gagal", "Tidak bisa menghapus data", "error");
      }
    }
  });
}

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);

  loadItems();

  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable("#questionTable")) {
    $("#questionTable").DataTable().destroy();
  }
});
</script>
