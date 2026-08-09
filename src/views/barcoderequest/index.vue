<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :is-open="sidebarOpen" />

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
            <h2 class="fw-bolder text-dark-blue mb-0">
              📦 Manajemen Permintaan Barcode
            </h2>
            <!---- <div v-if="isApproverDept">
              <button
                class="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#barcodeModal"
                @click="openAddModal"
                v-if="canCreate"
              >
                <i class="bi bi-cloud-plus"></i> Buat Permintaan
              </button>
            </div> ---->
          </div>
          <hr />

          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>

              <div
                v-else-if="items.length === 0"
                class="text-center py-5 fs-5 text-muted"
              >
                <i class="fas fa-exclamation-circle me-2"></i
                >Tidak ada permintaan barcode.
              </div>

              <div v-else class="table-responsive">
                <table
                  id="barcodeTable"
                  class="table table-borderless table-hover mb-0 align-middle w-100"
                >
                  <thead class="text-uppercase fw-bold text-secondary border-bottom">
                    <tr>
                      <th class="text-center">No</th>
                      <th>Detail</th>
                      <th>Requester</th>
                      <th>Status</th>
                      <th>Tgl Buat</th>
                      <th>Approved By</th>
                      <th>Pesan Approve/Not</th>
                      <th class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in items" :key="item.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td style="min-width: 250px; white-space: normal">
                        {{ item.detail }}
                      </td>
                      <td>
                        {{ item.requester?.name || '–' }}
                        <small class="text-muted"
                          >({{ item.requester?.dept || '-' }})</small
                        >
                      </td>
                      <td>
                        <span :class="statusBadgeClass(item.status)">{{
                          item.status
                        }}</span>
                      </td>
                      <td>{{ formatDateTime(item.createdAt) }}</td>
                      <td>
                        {{ item.approver?.name || 'no approver' }}
                        <small class="text-muted"
                          >({{ item.approver?.dept || 'no dept' }})</small
                        >
                      </td>
                      <td>{{ item.pesan_approve || 'not message' }}</td>
                      <td class="text-center">
                         <div class="d-flex justify-content-center">
                            <!-- hanya untuk IT & Akuntansi -->
                                <template v-if="['it'].includes(user.dept?.toLowerCase())">
                                    <button
                            v-if="canEdit(item)"
                            class="btn btn-sm btn-warning"
                            data-bs-toggle="modal"
                            data-bs-target="#barcodeModal"
                            @click="openEditModal(item)"
                            title="Edit"
                          >
                            <i class="bi bi-pencil-square"></i>
                          </button>
                          <button
                            v-if="canDelete(item)"
                            class="btn btn-sm btn-danger"
                            @click="deleteItem(item.id)"
                            title="Hapus"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                                </template>

                                <!-- untuk dept lain -->
                                <template v-else>
                                    <span class="text-muted small">No action for your dept</span>
                                </template>
                            </div>
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

  <div class="modal fade" id="barcodeModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content rounded-4 shadow">
        <div class="modal-header">
          <h5 class="modal-title">
            {{
              viewMode
                ? 'Detail Permintaan'
                : editMode
                ? 'Edit Permintaan'
                : 'Buat Permintaan Baru'
            }}
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            @click="closeModal"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="viewMode">
            <p><strong>Detail:</strong></p>
            <p>{{ form.detail }}</p>
            <p><strong>Status:</strong> {{ form.status }}</p>
            <p><strong>Pesan Approve:</strong> {{ form.pesan_approve || '-' }}</p>
            <p><strong>Requested by:</strong> {{ form.requester?.name || '-' }}</p>
            <p><strong>Dibuat:</strong> {{ formatDateTime(form.createdAt) }}</p>
            <hr />
            <div class="d-flex justify-content-end mt-3">
              <button class="btn btn-secondary" data-bs-dismiss="modal" @click="closeModal">
                Tutup
              </button>
            </div>
          </div>

          <form v-else @submit.prevent="saveItem">
            <div class="mb-3">
              <label class="form-label">Detail</label>
              <textarea
                v-model="form.detail"
                class="form-control"
                rows="3"
                :readonly="isApproverEditing"
              ></textarea>
            </div>

            <div v-if="isApproverDept" class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Status</label>
                <select v-model="form.status" class="form-select">
                  <option value="dalam_proses">dalam_proses</option>
                  <option value="sedang_dikirim">sedang_dikirim</option>
                  <option value="approve">approve</option>
                  <option value="dibatalkan">dibatalkan</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Pesan Approve</label>
                <input v-model="form.pesan_approve" type="text" class="form-control" />
              </div>
            </div>

            <div class="d-flex justify-content-end mt-4">
              <button
                type="button"
                class="btn btn-secondary me-2"
                data-bs-dismiss="modal"
                @click="closeModal"
              >
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editMode ? 'Update' : 'Simpan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const editMode = ref(false);
const viewMode = ref(false);
const form = ref({
  id: null,
  detail: '',
  status: 'dalam_proses',
  pesan_approve: null,
  requested_by: null,
  requester: null,
  createdAt: null,
});

let table = null;

// Helpers & Computed Properties
const isApproverDept = computed(() => {
  const allowed = ['IT', 'IT LEETEX', 'PPIC LEETEX'];
  const dept = user.value.dept?.toUpperCase();
  return dept && allowed.includes(dept);
});

const isUserIT = computed(() => {
  const dept = user.value.dept?.toLowerCase();
  return dept === 'it';
});

const canCreate = computed(() => {
  const allowed = [
    'LINKING',
    'IT',
    'SEKRETARIS',
    'SOOMSONTEX',
    'LO',
    'IT LEETEX',
    'PPIC LEETEX',
  ];
  const dept = user.value.dept?.toUpperCase();
  return dept && allowed.includes(dept);
});

const isApproverEditing = computed(() => editMode.value && isApproverDept.value);

const canEdit = (item) => {
  if (!user.value) return false;
  return isApproverDept.value;
};

const canDelete = (item) => {
  if (!user.value) return false;
  return isUserIT.value;
};

// Formatting & UI Helpers
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
};

const statusBadgeClass = (status) => {
  switch (status) {
    case 'approve':
      return 'badge bg-success text-capitalize';
    case 'dalam_proses':
      return 'badge bg-warning text-dark text-capitalize';
    case 'sedang_dikirim':
      return 'badge bg-primary text-white text-capitalize';
    case 'dibatalkan':
      return 'badge bg-danger text-capitalize';
    default:
      return 'badge bg-secondary text-capitalize';
  }
};

// Datatables Logic
const reloadDataTable = () => {
  if ($.fn.DataTable.isDataTable('#barcodeTable')) {
    $('#barcodeTable').DataTable().destroy();
  }
  setTimeout(() => {
    table = $('#barcodeTable').DataTable({
      pageLength: 10,
      lengthChange: false,
      searching: true,
      autoWidth: false,
      responsive: true,
      order: [],
      language: {
        search: 'Cari:',
        zeroRecords: 'Data tidak ditemukan',
        info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ data',
        infoEmpty: 'Tidak ada data tersedia',
        infoFiltered: '(difilter dari _MAX_ total data)',
        paginate: { next: 'Berikutnya', previous: 'Sebelumnya' },
      },
    });
  }, 0);
};

// API Calls
async function loadItems() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/barcode-requests/web`);
    if (res.data && Array.isArray(res.data.data)) {
      items.value = res.data.data;
    } else {
      items.value = res.data?.rows || [];
    }
  } catch (err) {
    console.error(err);
    Swal.fire('Gagal', 'Tidak bisa memuat permintaan barcode.', 'error');
  } finally {
    loading.value = false;
  }
}

async function saveItem() {
  try {
    const userData = JSON.parse(localStorage.getItem('user'));
    const payload = {
      ...form.value,
      user: userData,
    };

    if (editMode.value) {
      await axios.put(`${API_BASE_URL}/barcode-requests/web/${form.value.id}`, payload);
      Swal.fire('Berhasil', 'Data berhasil diupdate.', 'success');
    } else {
      await axios.post(`${API_BASE_URL}/barcode-requests/web`, payload);
      Swal.fire('Berhasil', 'Data berhasil ditambahkan.', 'success');
    }
    closeModal();
    loadItems();
  } catch (err) {
    console.error(err);
    Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan data.', 'error');
  }
}

async function deleteItem(itemId) {
  try {
    await Swal.fire({
      title: 'Hapus data?',
      text: 'Data yang sudah dihapus tidak bisa dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const user = JSON.parse(localStorage.getItem('user'));
        await axios.delete(`${API_BASE_URL}/barcode-requests/web/${itemId}`, {
          data: { userId: user.id },
        });
        Swal.fire('Berhasil!', 'Data berhasil dihapus.', 'success');
        loadItems();
      }
    });
  } catch (err) {
    console.error(err);
    Swal.fire('Gagal', 'Tidak bisa hapus data.', 'error');
  }
}

// Modal & State Management
function openAddModal() {
  editMode.value = false;
  viewMode.value = false;
  form.value = {
    id: null,
    detail: '',
    status: 'dalam_proses',
    pesan_approve: null,
  };
}

function openEditModal(item) {
  editMode.value = true;
  viewMode.value = false;
  form.value = { ...item }; // Gunakan spread operator
}

function openViewModal(item) {
  viewMode.value = true;
  editMode.value = false;
  form.value = { ...item };
}

function closeModal() {
  editMode.value = false;
  viewMode.value = false;
  form.value = {
    id: null,
    detail: '',
    status: 'dalam_proses',
    pesan_approve: null,
  };
}

// Lifecycle Hooks
onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    user.value = JSON.parse(userData);
    if (user.value.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.value.token}`;
    }
  }

  loadItems();

  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth;
  });
});

onBeforeUnmount(() => {
  if ($.fn.DataTable.isDataTable('#barcodeTable')) {
    $('#barcodeTable').DataTable().destroy();
  }
  window.removeEventListener('resize', () => {
    windowWidth.value = window.innerWidth;
  });
});

watch(items, () => reloadDataTable());

// Sidebar & Logout
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = '/login';
}
</script>

<style scoped>
.table-responsive {
  overflow: auto;
}
.badge {
  font-size: 0.9rem;
  padding: 0.45em 0.6em;
}
</style>