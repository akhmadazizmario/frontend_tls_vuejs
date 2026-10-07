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
          <!-- HEADER -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bolder text-dark mb-0">🧯 Manajemen APAR</h2>

            <button
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#aparModal"
              @click="openAddModal"
            >
              <i class="bi bi-plus-circle"></i> Tambah APAR
            </button>
          </div>

          <hr />

          <!-- TABLE -->
          <div class="card border-0 rounded-4 shadow-sm">
            <div class="card-body">
              <div v-if="loading" class="text-center py-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i> Memuat data APAR...
              </div>

              <div v-else-if="aparList.length === 0" class="text-center py-5 text-muted">
                Belum ada data APAR
              </div>

              <div v-else class="table-responsive">
                <table
                  id="aparTable"
                  class="table table-borderless table-hover align-middle w-100"
                >
                  <thead class="border-bottom text-uppercase text-secondary small">
                    <tr>
                      <th>No</th>
                      <th>Kode</th>
                      <th>Kategori</th>
                      <th>Kondisi</th>
                      <th>Kadaluarsa</th>
                      <th>Riwayat</th>
                      <th class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in aparList" :key="item.id">
                      <td>{{ i + 1 }}</td>
                      <td>
                        <span class="badge bg-primary">{{ item.kode_apar }}</span>
                      </td>
                      <td>{{ item.kategori }}</td>
                      <td>
                        <span
                          class="badge"
                          :class="item.kondisi === 'bagus' ? 'bg-success' : 'bg-danger'"
                        >
                          {{ item.kondisi }}
                        </span>
                      </td>
                      <td>{{ formatDate(item.tanggal_kadaluarsa) }}</td>
                      <td>{{ item.riwayat_kerusakan || "-" }}</td>
                      <td class="text-center">
                        <button
                          class="btn btn-sm btn-warning me-2"
                          data-bs-toggle="modal"
                          data-bs-target="#aparModal"
                          @click="openEditModal(item)"
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-danger"
                          @click="deleteItem(item.id)"
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

  <!-- MODAL -->
  <div class="modal fade" id="aparModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content rounded-4 shadow">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ editMode ? "Edit APAR" : "Tambah APAR" }}
          </h5>
          <button class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <form @submit.prevent="saveItem">
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Kode APAR</label>
                <input v-model="form.kode_apar" class="form-control" required />
              </div>

              <div class="col-md-6">
                <label class="form-label">Kategori</label>
                <input v-model="form.kategori" class="form-control" required />
              </div>

              <div class="col-md-6">
                <label class="form-label">Tanggal Kadaluarsa</label>
                <input
                  type="date"
                  v-model="form.tanggal_kadaluarsa"
                  class="form-control"
                  required
                />
              </div>

              <!-- EDIT ONLY -->
              <div class="col-md-6" v-if="editMode">
                <label class="form-label">Kondisi</label>
                <select v-model="form.kondisi" class="form-select">
                  <option value="bagus">Bagus</option>
                  <option value="tidakbagus">Tidak Bagus</option>
                </select>
              </div>

              <div class="col-md-12" v-if="editMode">
                <label class="form-label">Riwayat Kerusakan</label>
                <textarea
                  v-model="form.riwayat_kerusakan"
                  class="form-control"
                  rows="3"
                ></textarea>
              </div>

              <div class="col-md-12">
                <label class="form-label">Catatan</label>
                <textarea
                  v-model="form.catatan"
                  class="form-control"
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer">
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
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL + "/apartls";

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const aparList = ref([]);
const editMode = ref(false);

const form = ref({
  id: null,
  kode_apar: "",
  kategori: "",
  tanggal_kadaluarsa: "",
  kondisi: "bagus",
  riwayat_kerusakan: "",
  catatan: "",
});

/* =========================
   HELPER
========================= */
const toInputDate = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID") : "-";

/* =========================
   DATATABLE
========================= */
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable("#aparTable")) {
    $("#aparTable").DataTable().destroy();
  }
  setTimeout(() => $("#aparTable").DataTable(), 0);
};

watch(aparList, reloadDataTable, { deep: true });

/* =========================
   ACTION
========================= */
const loadItems = async () => {
  loading.value = true;
  const res = await axios.get(API);
  aparList.value = res.data;
  loading.value = false;
};

const openAddModal = () => {
  editMode.value = false;
  form.value = {
    id: null,
    kode_apar: "",
    kategori: "",
    tanggal_kadaluarsa: "",
    kondisi: "bagus",
    riwayat_kerusakan: "",
    catatan: "",
  };
};

const openEditModal = (item) => {
  editMode.value = true;
  form.value = {
    ...item,
    tanggal_kadaluarsa: toInputDate(item.tanggal_kadaluarsa),
  };
};

const saveItem = async () => {
  try {
    if (editMode.value) {
      await axios.put(`${API}/${form.value.id}`, form.value);
      Swal.fire("Berhasil", "APAR diperbarui", "success");
    } else {
      await axios.post(API, {
        ...form.value,
        kondisi: "bagus",
      });
      Swal.fire("Berhasil", "APAR ditambahkan", "success");
    }
    loadItems();
  } catch {
    Swal.fire("Error", "Gagal menyimpan data", "error");
  }
};

const deleteItem = (id) => {
  Swal.fire({
    title: "Hapus APAR?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
  }).then(async (r) => {
    if (r.isConfirmed) {
      await axios.delete(`${API}/${id}`);
      loadItems();
    }
  });
};

/* ========================= */
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);

const logout = () => {
  localStorage.removeItem("user");
  location.href = "/login";
};

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);
  loadItems();
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable("#aparTable")) {
    $("#aparTable").DataTable().destroy();
  }
});
</script>
