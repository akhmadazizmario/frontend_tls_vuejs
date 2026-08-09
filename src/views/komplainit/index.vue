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
              📦 Manajemen Komplain IT
            </h2>
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
                <i class="fas fa-exclamation-circle me-2"></i>Tidak ada komplain IT.
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
                      <th>Lokasi</th>
                      <th>Gambar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in items" :key="item.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td style="min-width: 250px; white-space: normal">
                        {{ item.detail }}
                      </td>
                      <td>
                        {{ item.user?.name || '–' }}
                        <small class="text-muted">({{ item.user?.dept || '-' }})</small>
                      </td>
                      <td>
                        <span :class="statusBadgeClass(item.status)">{{
                          item.status
                        }}</span>
                      </td>
                      <td>{{ formatDateTime(item.created_at) }}</td>
                      <td>{{ item.lokasi }}</td>
                      <td>
                        <span v-if="item.gambar">
                          <img
                            :src="`${API_BASE_URL}${item.gambar}`"
                            alt="gambar"
                            width="80"
                            class="rounded"
                          />
                        </span>
                        <span v-else class="text-muted">-</span>
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
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

let table = null;

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
    case 'selesai':
      return 'badge bg-success text-capitalize';
    case 'pending':
      return 'badge bg-warning text-dark text-capitalize';
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
    const res = await axios.get(`${API_BASE_URL}/komplainit/web`);
    if (res.data && Array.isArray(res.data.data)) {
      items.value = res.data.data;
    } else {
      items.value = res.data?.rows || [];
    }
  } catch (err) {
    console.error(err);
    Swal.fire('Gagal', 'Tidak bisa memuat data komplain.', 'error');
  } finally {
    loading.value = false;
  }
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