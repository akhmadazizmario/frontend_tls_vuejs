<template>
  <div class="d-flex flex-column min-vh-100 bg-light-subtle">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-4 main-content" :style="{
        marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
        transition: 'margin-left 0.3s ease',
        marginTop: '56px',
      }">
        <div class="container-fluid">
          <div class="sweep-nav-wrapper mb-4">
            <div class="sweep-indicator" style="left: calc(33.33% + 4px);"></div>
            <a href="/item-masuk" class="nav-link">Barang Masuk</a>
            <a href="/request" class="nav-link active">Penggunaan</a>
            <a href="/item-stok" class="nav-link">Stok</a>
          </div>

          <div class="row align-items-end mb-4 g-3">
            <div class="col">
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-1 small">
                  <li class="breadcrumb-item"><a href="#" class="text-decoration-none text-muted">Dashboard</a></li>
                  <li class="breadcrumb-item active text-primary fw-medium">Data Penggunaan</li>
                </ol>
              </nav>
              <h3 class="fw-bold text-dark m-0">📋 Manajemen Penggunaan / pemakaian Item</h3>
              <p class="text-muted small m-0">Otorisasi dan pantau penggunaan / pemakaian barang produksi.</p>
            </div>
            <div class="col-auto text-nowrap">
              <router-link to="/request-permintaan" class="btn btn-primary px-4 rounded-3 shadow-sm d-flex align-items-center gap-2">
                <i class="bi bi-plus-lg"></i>
                <span class="d-none d-md-inline"> Request Pemakaian</span>
              </router-link>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3">
              <div class="d-flex align-items-center gap-3">
                <div class="dropdown">
                  <button class="btn btn-white border dropdown-toggle px-3 py-2 shadow-none rounded-3" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-layout-three-columns text-primary me-2"></i> Konfigurasi Kolom
                  </button>
                  <ul class="dropdown-menu shadow-lg border-0 p-2 mt-2 custom-dropdown">
                    <li v-for="(col, index) in columnDefs" :key="index">
                      <div v-if="col.title && col.title !== 'No' && col.title !== 'Aksi'" 
                           class="form-check form-switch dropdown-item rounded-2 py-2 d-flex align-items-center justify-content-between">
                        <label class="form-check-label small cursor-pointer me-4" :for="'col'+index">{{ col.title }}</label>
                        <input class="form-check-input cursor-pointer" type="checkbox" :id="'col'+index" :checked="col.visible" @change="toggleColumn(index)">
                      </div>
                    </li>
                  </ul>
                </div>
                <div class="vr"></div>
                <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill fw-bold">
                  {{ requests.filter(r => r.status_approval === 'Pending').length }} Menunggu Persetujuan
                </span>
                              <div class="col-auto d-flex gap-2">
  <div class="input-group input-group-sm">
    <span class="input-group-text bg-white border-end-0"><i class="bi bi-calendar-range text-primary"></i></span>
    <input type="date" v-model="filterDate.start" class="form-control border-start-0" title="Tanggal Mulai">
    <input type="date" v-model="filterDate.end" class="form-control" title="Tanggal Akhir">
    <button @click="exportExcel" class="btn btn-success shadow-sm d-flex align-items-center gap-2">
      <i class="bi bi-file-earmark-excel"></i> <span class="d-none d-lg-inline">Export Excel</span>
    </button>
  </div>
</div>
              </div>

            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="table-responsive bg-white custom-scrollbar">
              <table id="requestTable" class="table table-hover align-middle mb-0 w-100 text-nowrap">
                <thead class="bg-light sticky-header">
                  <tr>
                    <th v-for="col in columnDefs" :key="col.title" 
                        class="py-3 px-4 text-muted small fw-bold text-uppercase border-bottom"
                        :class="{'d-none': !col.visible}">
                      {{ col.title }}
                    </th>
                  </tr>
                  <tr class="bg-white border-bottom">
                    <th v-for="(col, index) in columnDefs" :key="'filter'+index" 
                        class="p-2" :class="{'d-none': !col.visible}">
                      <div v-if="col.filterable" class="dropdown w-100">
                        <button class="btn btn-sm btn-light w-100 dropdown-toggle text-start d-flex justify-content-between align-items-center border shadow-none" 
                                type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                          <span class="text-truncate small opacity-75" :id="'label-filter-' + index">Pilih...</span>
                        </button>
                        <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 custom-dropdown">
                          <div class="input-group input-group-sm mb-2 border rounded-2 overflow-hidden">
                            <span class="input-group-text bg-white border-0"><i class="bi bi-search text-muted"></i></span>
                            <input type="text" class="form-control border-0 filter-search-input shadow-none" placeholder="Cari..." @click.stop>
                          </div>
                          <div :id="'container-filter-' + index" class="filter-options-container custom-scrollbar mb-2">
                             </div>
                          <div class="dropdown-divider opacity-50"></div>
                          <button class="btn btn-link btn-sm text-decoration-none w-100 text-center btn-reset-filter fw-bold text-danger" :data-index="index">
                            RESET
                          </button>
                        </div>
                      </div>
                      <div v-else class="text-center opacity-25 small">-</div>
                    </th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import $ from 'jquery';

import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'datatables.net-bs5';

import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REQUEST_URL = `${API_BASE_URL}/request/requests`;

const user = ref({});
const sidebarOpen = ref(true);
const windowWidth = ref(window.innerWidth);
const requests = ref([]);
let table = null;

const columnDefs = ref([
  { title: 'No', data: null, visible: true, filterable: false },
  { title: 'Tgl Minta', data: 'tgl_permintaan', visible: true, filterable: true },
  { title: 'Barang', data: 'item.item_name', visible: true, filterable: true },
  { title: 'Qty', data: 'qty_diminta', visible: true, filterable: true },
  { title: 'Pemohon', data: 'diminta_oleh', visible: true, filterable: true },
  { title: 'Dept', data: 'untuk_Dept', visible: true, filterable: true },
  { title: 'Status', data: 'status_approval', visible: true, filterable: true },
  { title: 'Aksi', data: null, visible: true, filterable: false }
]);

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => { localStorage.clear(); window.location.href = '/login'; };

const toggleColumn = (index) => {
  if (table) {
    columnDefs.value[index].visible = !columnDefs.value[index].visible;
    table.column(index).visible(columnDefs.value[index].visible);
    table.columns.adjust().draw();
  }
};

const setupFilters = (api) => {
  api.columns().every(function (index) {
    const column = this;
    const colDef = columnDefs.value[index];
    if (!colDef || !colDef.filterable) return;

    const container = $(`#container-filter-${index}`);
    const label = $(`#label-filter-${index}`);
    
    // TRICK: Ambil data dari sel yang sudah ter-render agar pasti ada isinya
    const uniqueData = [];
    column.nodes().to$().each(function() {
        const val = $(this).text().trim();
        if (val && !uniqueData.includes(val) && val !== '-') {
            uniqueData.push(val);
        }
    });
    uniqueData.sort();

    container.empty();
    if (uniqueData.length === 0) {
        container.append('<div class="text-center text-muted small p-2">Tidak ada data</div>');
        return;
    }

    uniqueData.forEach(d => {
      const safeId = `chk-${index}-${String(d).replace(/[^a-z0-9]/gi, '-')}`;
      container.append(`
        <div class="form-check mb-2">
          <input class="form-check-input filter-checkbox cursor-pointer" type="checkbox" value="${d}" data-index="${index}" id="${safeId}">
          <label class="form-check-label small cursor-pointer w-100" for="${safeId}">${d}</label>
        </div>`);
    });

    // Reset Filter
    $(`.btn-reset-filter[data-index="${index}"]`).off('click').on('click', function(e) {
      e.preventDefault();
      $(`.filter-checkbox[data-index="${index}"]`).prop('checked', false);
      column.search('').draw();
      label.text('Pilih...').removeClass('text-primary fw-bold');
    });
  });

  // Delegasi Event Checkbox
  $(document).off('change', '.filter-checkbox').on('change', '.filter-checkbox', function() {
    const idx = $(this).data('index');
    const col = api.column(idx);
    const selected = [];
    $(`.filter-checkbox[data-index="${idx}"]:checked`).each(function() {
      const val = $.fn.dataTable.util.escapeRegex($(this).val());
      selected.push(`^${val}$`); // Exact match
    });
    col.search(selected.length > 0 ? selected.join('|') : '', true, false).draw();
    $(`#label-filter-${idx}`).text(selected.length > 0 ? `${selected.length} Terpilih` : 'Pilih...')
      .toggleClass('text-primary fw-bold', selected.length > 0);
  });

  // Search inside filter
  $('.filter-search-input').on('keyup', function() {
    const val = $(this).val().toLowerCase();
    $(this).closest('.dropdown-menu').find('.form-check').filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
    });
  });
};

const initDataTable = (data) => {
  if ($.fn.DataTable.isDataTable('#requestTable')) $('#requestTable').DataTable().destroy();

  table = $('#requestTable').DataTable({
    data,
    autoWidth: false,
    dom: '<"p-3 d-flex justify-content-between align-items-center"lf>rt<"p-3 d-flex justify-content-between"ip>',
    columns: columnDefs.value.map(col => ({
      data: col.data,
      visible: col.visible,
      render: (d, t, r, meta) => {
        if (col.title === 'No') return `<span class="text-muted small">${meta.row + 1}</span>`;
        if (col.title === 'Tgl Minta') return d ? new Date(d).toLocaleDateString('id-ID') : '-';
        if (col.title === 'Barang') return `<span class="fw-bold text-dark">${d || '-'}</span>`;
        if (col.title === 'Qty') return `${d} <small class="text-muted">${r.item?.unit || ''}</small>`;
        if (col.title === 'Status') {
          const cls = d === 'Approved' ? 'bg-success' : d === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark';
          return `<span class="badge ${cls} rounded-pill px-3 shadow-sm">${d}</span>`;
        }
        if (col.title === 'Aksi') {
          return r.status_approval === 'Pending' 
            ? `<div class="btn-group border rounded-2 overflow-hidden">
                <button class="btn btn-sm btn-success btn-approve border-0" data-id="${r.id}"><i class="bi bi-check-lg"></i></button>
                <button class="btn btn-sm btn-danger btn-reject border-0" data-id="${r.id}"><i class="bi bi-x-lg"></i></button>
              </div>`
            : `<small class="text-muted bg-light px-2 py-1 rounded">Selesai</small>`;
        }
        return d || '-';
      }
    })),
    initComplete: function () {
      setupFilters(this.api());
    }
  });

  // Action Logic
  $('#requestTable').off('click', '.btn-approve').on('click', '.btn-approve', function() { handleAction($(this).data('id'), 'Approved'); });
  $('#requestTable').off('click', '.btn-reject').on('click', '.btn-reject', function() { handleAction($(this).data('id'), 'Rejected'); });
};

const handleAction = async (id, status) => {
  const result = await Swal.fire({
    title: 'Konfirmasi',
    text: `Ubah status ke ${status}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Lanjutkan'
  });

  if (result.isConfirmed) {
    try {
      await axios.patch(`${REQUEST_URL}/${id}/status`, { status_approval: status, approved_by: user.value.name });
      Swal.fire('Berhasil', 'Status diperbarui', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Gagal', 'Terjadi kesalahan sistem', 'error');
    }
  }
};

const loadData = async () => {
  try {
    const res = await axios.get(REQUEST_URL);
    requests.value = res.data;
    // KRUSIAL: Tunggu Vue selesai render HTML agar DataTables bisa baca nodes
    await nextTick();
    initDataTable(requests.value);
  } catch (error) {
    console.error("Load data failed");
  }
};

onMounted(() => {
  const localUser = localStorage.getItem('user');
  if (localUser) user.value = JSON.parse(localUser);
  loadData();
  window.addEventListener('resize', () => { windowWidth.value = window.innerWidth; });
});

// 1. Definisikan state tanggal (default range bulan ini)
const filterDate = ref({
  start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substr(0, 10),
  end: new Date().toISOString().substr(0, 10)
});

// 2. Fungsi Export
const exportExcel = async () => {
  if (!filterDate.value.start || !filterDate.value.end) {
    return Swal.fire('Perhatian', 'Harap isi kedua rentang tanggal', 'warning');
  }

  try {
    Swal.fire({
      title: 'Menyiapkan Data',
      text: 'Mohon tunggu sejenak...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const response = await axios.get(`${REQUEST_URL}/export/excel`, {
      params: {
        startDate: filterDate.value.start,
        endDate: filterDate.value.end
      },
      responseType: 'blob' // Penting untuk handle file binary
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Penggunaan_${filterDate.value.start}_ke_${filterDate.value.end}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    Swal.close();
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'Gagal mengekspor data ke Excel', 'error');
  }
};
</script>

<style scoped>
.sweep-nav-wrapper {
    position: relative; background-color: #f1f3f5; border-radius: 50px; 
    padding: 6px; display: flex; width: 100%; max-width: 500px; 
    border: 1px solid #e9ecef; overflow: hidden;
}
.sweep-nav-wrapper .nav-link {
    position: relative; z-index: 2; color: #6c757d; font-weight: 600; 
    font-size: 0.875rem; flex: 1; text-align: center; text-decoration: none; padding: 10px 0;
}
.sweep-nav-wrapper .nav-link.active { color: #0d6efd !important; }
.sweep-indicator {
    position: absolute; height: calc(100% - 12px); width: calc(33.33% - 8px); 
    top: 6px; background: #ffffff; border-radius: 40px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.4s ease; z-index: 1;
}
.table-responsive { overflow-x: auto; padding-bottom: 100px; }
.custom-dropdown { min-width: 240px; border-radius: 12px; z-index: 9999 !important; }
.filter-options-container { max-height: 180px; overflow-y: auto; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
.sticky-header { position: sticky; top: 0; z-index: 1000; }
.cursor-pointer { cursor: pointer; }
</style>