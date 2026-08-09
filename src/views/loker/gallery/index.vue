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
            <h2 class="fw-bolder text-dark-blue mb-0">🖼️ Galeri Rekrutmen</h2>
            <button
              class="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#galleryModal"
              @click="openAddModal"
            >
              <i class="bi bi-plus-circle"></i> Tambah Galeri
            </button>
          </div>
          <p class="text-secondary mb-4">Kelola foto galeri kegiatan & rekrutmen</p>
          <hr />

          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>
              <div v-else-if="items.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-exclamation-circle me-2"></i>Tidak ada data galeri.
              </div>
              <div v-else class="table-container">
                <div class="table-responsive">
                  <table
                    id="galleryTable"
                    class="table table-borderless table-hover mb-0 align-middle w-100"
                  >
                    <thead class="text-uppercase fw-bold text-secondary border-bottom">
                      <tr>
                        <th class="text-center" style="width: 80px;">No</th>
                        <th>Gambar</th>
                        <th>Tanggal Dibuat</th>
                        <th class="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in items" :key="item.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>
                          <img 
                            :src="`${API_BASE_URL}/uploads/gallery/${item.image}`" 
                            alt="Gallery" 
                            class="rounded shadow-sm border"
                            style="height: 60px; width: 100px; object-fit: cover;"
                          >
                        </td>
                        <td>{{ formatDateTime(item.createdAt) }}</td>
                        <td class="text-center">
                          <div class="d-flex justify-content-center">
                            <button
                              class="btn btn-sm btn-warning me-2"
                              data-bs-toggle="modal"
                              data-bs-target="#galleryModal"
                              @click="openEditModal(item)"
                            >
                              <i class="bi bi-pencil-square"></i>
                            </button>
                            <button
                              class="btn btn-sm btn-danger"
                              @click="deleteItem(item.id)"
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

  <div class="modal fade" id="galleryModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 shadow">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            {{ editMode ? "Edit Galeri" : "Tambah Galeri" }}
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveItem">
            <div class="mb-3">
              <label class="form-label fw-bold">Unggah Gambar</label>
              <input
                type="file"
                class="form-control"
                accept="image/*"
                @change="handleFileUpload"
                :required="!editMode"
              />
              <div class="mt-3 text-center" v-if="form.preview">
                <p class="small text-muted mb-1">Pratinjau:</p>
                <img
                  :src="form.preview"
                  class="img-thumbnail shadow-sm border"
                  style="max-height: 200px"
                />
              </div>
            </div>
            <div class="d-flex justify-content-end mt-4">
              <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Batal</button>
              <button type="submit" class="btn btn-primary px-4" data-bs-dismiss="modal">
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

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_GALLERY = API_BASE_URL + '/gallery-rekrutmen';

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const editMode = ref(false);
const form = ref({
  id: null,
  image: null,
  preview: null,
});
let table = null;

/* ================= HELPERS ================= */
const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(dateStr));
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    form.value.image = file;
    form.value.preview = URL.createObjectURL(file);
  }
};

/* ================= DATA LOADING ================= */
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable("#galleryTable")) {
    $("#galleryTable").DataTable().destroy();
  }
  setTimeout(() => {
    table = $("#galleryTable").DataTable({
      pageLength: 10,
      lengthChange: false,
      searching: true,
      autoWidth: false,
      responsive: true,
      order: [[2, 'desc']],
      language: {
        search: "Cari:",
        paginate: { next: "Next", previous: "Prev" },
      },
    });
  }, 0);
};

watch(items, () => reloadDataTable(), { deep: true });

async function loadItems() {
  loading.value = true;
  try {
    const res = await axios.get(API_GALLERY);
    items.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Tidak bisa memuat data galeri.", "error");
  } finally {
    loading.value = false;
  }
}

/* ================= ACTIONS ================= */
function openAddModal() {
  editMode.value = false;
  form.value = { id: null, image: null, preview: null };
}

function openEditModal(item) {
  editMode.value = true;
  form.value = { 
    id: item.id, 
    image: null, 
    preview: `${API_BASE_URL}/uploads/gallery/${item.image}` 
  };
}

async function saveItem() {
  try {
    const fd = new FormData();
    if (form.value.image) fd.append('image', form.value.image);

    if (editMode.value) {
      await axios.put(`${API_GALLERY}/${form.value.id}`, fd);
      Swal.fire("Berhasil", "Galeri berhasil diperbarui.", "success");
    } else {
      await axios.post(API_GALLERY, fd);
      Swal.fire("Berhasil", "Gambar berhasil ditambahkan.", "success");
    }
    loadItems();
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
  }
}

async function deleteItem(id) {
  const result = await Swal.fire({
    title: "Hapus Gambar?",
    text: "Data ini tidak dapat dikembalikan!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, Hapus!",
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_GALLERY}/${id}`);
      Swal.fire("Terhapus!", "Gambar berhasil dihapus.", "success");
      loadItems();
    } catch (err) {
      Swal.fire("Gagal", "Gagal menghapus data.", "error");
    }
  }
}

/* ================= LIFECYCLE ================= */
const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => { localStorage.clear(); window.location.href = "/login"; };

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  loadItems();
  window.addEventListener("resize", () => { windowWidth.value = window.innerWidth; });
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable("#galleryTable")) {
    $("#galleryTable").DataTable().destroy();
  }
});
</script>

<style scoped>
.bg-light-soft {
  background-color: #f8f9fa;
}
.table-container {
  overflow-x: auto;
}
</style>
