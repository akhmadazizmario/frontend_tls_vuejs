<template>
  <div class="d-flex flex-column min-vh-100">
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
        <div class="container-lg">
          <h2 class="mb-4 text-primary">Lowongan Kerja</h2>
          <p class="text-secondary">Kelola data loker dengan mudah.</p>

          <!-- Tombol Tambah -->
          <div class="row mb-3">
            <div class="col-12 text-end">
              <button
                class="btn btn-primary btn-lg rounded-pill shadow-sm"
                data-bs-toggle="modal"
                data-bs-target="#formModal"
                @click="openForm()"
              >
                <i class="bi bi-plus-circle me-2"></i> + Tambah Loker
              </button>
            </div>
          </div>

          <!-- Tabel Data -->
          <div class="card shadow-sm rounded-3">
            <div class="card-body">
              <div class="table-responsive">
                <table id="lokerTable" class="table table-hover table-striped w-100">
                  <thead class="bg-primary text-white">
                    <tr>
                      <th>No</th>
                      <th>Posisi</th>
                      <th>Jenjang Pendidikan</th>
                      <th>Gender Target</th>
                      <th>Gambar</th>
                      <th>Tanggal Mulai</th>
                      <th>Tanggal Selesai</th>
                      <th>Status</th>
                      <th class="text-center">Aksi</th>
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
  </div>

  <!-- Modal Form -->
  <div
    class="modal fade"
    id="formModal"
    tabindex="-1"
    aria-hidden="true"
    ref="formModal"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 rounded-3 shadow-lg">
        <form @submit.prevent="saveLoker" enctype="multipart/form-data">
          <div class="modal-header bg-primary text-white border-bottom-0">
            <h5 class="modal-title">{{ form.id ? 'Edit Loker' : 'Tambah Loker' }}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 custom-modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Posisi</label>
                <input v-model="form.posisi" type="text" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Jenjang Pendidikan</label>
                <input v-model="form.jenjang_pendidikan" type="text" class="form-control" required />
              </div>

              <!-- Gender Target Input -->
              <div class="col-md-6">
                <label class="form-label">Gender Target</label>
                <select v-model="form.gender_target" class="form-select" required>
                  <option value="Semua">Semua</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label">Status</label>
                <select v-model="form.status" class="form-select">
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div class="col-md-12">
                <label class="form-label">Deskripsi</label>
                <textarea v-model="form.deskripsi" rows="3" class="form-control"></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label">Tanggal Mulai</label>
                <input v-model="form.tanggal_mulai_loker" type="date" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Tanggal Selesai</label>
                <input v-model="form.tanggal_selesai_loker" type="date" class="form-control" required />
              </div>

              <div class="col-md-12">
                <label class="form-label">Upload Gambar</label>
                <input type="file" class="form-control" @change="handleFileUpload" />
                <div v-if="form.gambarPreview" class="mt-2">
                  <img :src="form.gambarPreview" class="img-thumbnail" style="max-height: 150px;" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top-0 p-3">
            <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Batal</button>
            <button type="submit" class="btn btn-primary rounded-pill px-4" data-bs-dismiss="modal">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const lokers = ref([]);

let table = null;

// form
const form = ref({
  id: null,
  posisi: '',
  jenjang_pendidikan: '',
  gender_target: 'Semua',
  deskripsi: '',
  tanggal_mulai_loker: '',
  tanggal_selesai_loker: '',
  status: 'open',
  gambar_loker: null,
  gambarPreview: null,
});

// load data
async function loadData() {
  try {
    const res = await axios.get(`${API_BASE_URL}/loker`);
    lokers.value = res.data;
    return res.data;
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'Gagal memuat data', 'error');
    return [];
  }
}

// reload datatable
const reloadDataTable = (data) => {
  if ($.fn.DataTable.isDataTable('#lokerTable')) {
    $('#lokerTable').DataTable().destroy();
    table = null;
  }

  table = $('#lokerTable').DataTable({
    data,
    columns: [
      { 
        data: null, 
        render: (data, type, row, meta) => meta.row + 1,
        orderable: false 
      },
      { data: 'posisi' },
      { data: 'jenjang_pendidikan' },
      { 
        data: 'gender_target',
        render: (data) => data ? `<span class="badge bg-info text-dark">${data}</span>` : '<span class="badge bg-info text-dark">Semua</span>'
      },
      { 
        data: 'gambar_loker',
        render: (data) => data ? `<img src="${API_BASE_URL}${data}" style="max-height:50px"/>` : '-'
      },
      { data: 'tanggal_mulai_loker' },
      { data: 'tanggal_selesai_loker' },
      { data: 'status' },
      { data: null, orderable: false, className: 'text-center' },
    ],
    createdRow: (row, data) => {
      const actionHtml = `
        <div class="d-flex justify-content-center gap-2">
          <button class="btn btn-warning btn-sm btn-edit" data-id="${data.id}" data-bs-toggle="modal" data-bs-target="#formModal">
            <i class="bi bi-pencil-square"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm btn-delete" data-id="${data.id}">
            <i class="bi bi-trash"></i> Hapus
          </button>
        </div>
      `;
      $('td', row).eq(8).html(actionHtml);
    },
    initComplete: () => {
      $('#lokerTable').off('click', '.btn-edit').on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        const loker = lokers.value.find(l => l.id == id);
        if (loker) openForm(loker);
      });

      $('#lokerTable').off('click', '.btn-delete').on('click', '.btn-delete', function() {
        const id = $(this).data('id');
        deleteLoker(id);
      });
    }
  });
};

// form functions
const openForm = (data = null) => {
  if (data) {
    form.value = {
      ...data,
      gender_target: data.gender_target || 'Semua',
      gambar_loker: null,
      gambarPreview: data.gambar_loker ? `${API_BASE_URL}/${data.gambar_loker}` : null,
    };
  } else {
    form.value = {
      id: null,
      posisi: '',
      jenjang_pendidikan: '',
      gender_target: 'Semua',
      deskripsi: '',
      tanggal_mulai_loker: '',
      tanggal_selesai_loker: '',
      status: 'open',
      gambar_loker: null,
      gambarPreview: null,
    };
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    form.value.gambar_loker = file;
    form.value.gambarPreview = URL.createObjectURL(file);
  }
};

const saveLoker = async () => {
  try {
    const fd = new FormData();
    Object.keys(form.value).forEach(key => {
      if (form.value[key] !== null && key !== 'gambarPreview') {
        fd.append(key, form.value[key]);
      }
    });

    if (form.value.id) {
      await axios.put(`${API_BASE_URL}/loker/${form.value.id}`, fd);
      Swal.fire('Sukses', 'Loker diperbarui', 'success');
    } else {
      await axios.post(`${API_BASE_URL}/loker`, fd);
      Swal.fire('Sukses', 'Loker ditambahkan', 'success');
    }
    await loadDataAndReloadTable();
  } catch (err) {
    console.error(err);
    Swal.fire('Error', err.response?.data?.error || 'Terjadi kesalahan', 'error');
  }
};

const deleteLoker = async (id) => {
  Swal.fire({
    title: 'Yakin?',
    text: 'Data akan dihapus permanen',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/loker/${id}`);
        Swal.fire('Sukses', 'Data berhasil dihapus', 'success');
        await loadDataAndReloadTable();
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.response?.data?.error || 'Terjadi kesalahan', 'error');
      }
    }
  });
};

// helper
async function loadDataAndReloadTable() {
  const data = await loadData();
  reloadDataTable(data);
}

// lifecycle
onMounted(async () => {
  const userData = localStorage.getItem('user');
  if (userData) user.value = JSON.parse(userData);

  const initialData = await loadData();
  reloadDataTable(initialData);
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable('#lokerTable')) {
    $('#lokerTable').DataTable().destroy();
  }
});

// ui
const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
function logout() {
  localStorage.removeItem('user');
  window.location.href = '/login';
}
</script>

<style scoped>
.custom-modal-body {
  max-height: 65vh;
  overflow-y: auto;
}
</style>