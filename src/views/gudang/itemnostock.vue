<template>
  <div class="d-flex flex-column min-vh-100 bg-light-subtle">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1 overflow-hidden">
      <Sidebar :isOpen="sidebarOpen" />
      
      <main
        class="flex-grow-1 p-3 p-md-4 main-content"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px',
        }"
      >
        <div class="container-fluid">
          <div class="sweep-nav-wrapper">
            <div class="sweep-indicator" style="left: calc(75% + 4px); width: calc(25% - 8px);"></div>
            <a href="/item-masuk" class="nav-link">Barang Masuk</a>
            <a href="/request" class="nav-link">Penggunaan</a>
            <a href="/item-stok" class="nav-link">Stok</a>
            <a href="/item-no-stok" class="nav-link active">No Stock</a>
          </div>

          <div class="row align-items-end mb-4 g-3 mt-3">
            <div class="col">
              <h3 class="fw-bold text-dark m-0">Purchase Order No Stock</h3>
              <p class="text-muted small m-0">PT Tri Lestari Sandang Industri - Management System</p>
            </div>
            <div class="col-auto">
              <router-link to="/item-no-stok-form" class="btn btn-primary px-4 rounded-3 shadow-sm d-flex align-items-center gap-2">
                <i class="bi bi-cart-plus"></i> Buat PO Baru
              </router-link>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div class="d-flex align-items-center gap-2">
                  <div class="dropdown">
                    <button class="btn btn-white border dropdown-toggle px-3 shadow-sm" type="button" data-bs-toggle="dropdown">
                      <i class="bi bi-layout-three-columns text-primary me-2"></i> Tampilan Kolom
                    </button>
                    <ul class="dropdown-menu shadow-lg border-0 p-2 mt-2" style="max-height: 400px; overflow-y: auto;">
                      <li v-for="(col, index) in columnDefs" :key="index">
                        <div v-if="col.title && col.title !== 'No' && col.title !== 'Aksi'" 
                             class="form-check form-switch dropdown-item rounded-2 py-2 d-flex align-items-center justify-content-between">
                          <label class="form-check-label small cursor-pointer me-3" :for="'col'+index">{{ col.title }}</label>
                          <input class="form-check-input ms-0" type="checkbox" :id="'col'+index" :checked="col.visible" @change="toggleColumn(index)">
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div class="vr mx-2"></div>

                  <div class="d-flex gap-2 align-items-center bg-white p-2 rounded-3 border shadow-sm">
                    <input type="date" v-model="exportDates.start" class="form-control form-control-sm border-0 bg-light">
                    <span class="text-muted small">s/d</span>
                    <input type="date" v-model="exportDates.end" class="form-control form-control-sm border-0 bg-light">
                    <button @click="downloadExcel" class="btn btn-success btn-sm px-3 rounded-2 shadow-sm">
                      <i class="bi bi-file-earmark-spreadsheet me-1"></i> Export Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="table-responsive custom-scrollbar bg-white">
              <table id="noStockTable" class="table table-hover align-middle mb-0 w-100 text-nowrap">
                <thead class="bg-light sticky-header">
                  <tr>
                    <th v-for="col in columnDefs" :key="col.title" class="py-3 px-4 text-muted small fw-bold text-uppercase border-bottom">
                      {{ col.title }}
                    </th>
                  </tr>
                  <tr class="bg-white">
                    <th v-for="(col, index) in columnDefs" :key="'f'+index" class="p-2 border-bottom shadow-sm-bottom">
                      <div v-if="col.filterable" class="dropdown w-100">
                        <button class="btn btn-sm btn-light w-100 dropdown-toggle text-start d-flex justify-content-between align-items-center border" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                          <span class="text-truncate small" :id="'label-filter-' + index">Pilih...</span>
                        </button>
                        <div class="dropdown-menu p-3 shadow-lg border-0 mt-1" style="min-width: 240px; max-height: 300px; overflow-y: auto;">
                          <div :id="'container-filter-' + index" class="filter-options-container"></div>
                          <div class="dropdown-divider"></div>
                          <button class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center fw-bold" @click="resetFilter(index)">RESET</button>
                        </div>
                      </div>
                      <div v-else class="text-center"><span class="text-muted opacity-25 small">-</span></div>
                    </th>
                  </tr>
                </thead>
                <tbody class="border-top-0"></tbody>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Swal from 'sweetalert2';
import $ from 'jquery';

import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const router = useRouter();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const NO_STOCK_URL = `${API_BASE_URL}/itemnostock`;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const items = ref([]);
let table = null;

const exportDates = ref({
  start: new Date().toISOString().substr(0, 10),
  end: new Date().toISOString().substr(0, 10)
});

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => { localStorage.removeItem('user'); window.location.href = '/login'; };

const columnDefs = ref([
  { title: 'No', data: null, visible: true, filterable: false },
  { title: 'Dibuat', data: 'createdAt', visible: true, filterable: false },
  { title: 'Tanggal Input', data: 'createdAt', visible: true, filterable: true },
  { title: 'Group Key', data: 'group_key', visible: true, filterable: true },
  { title: 'PO Number', data: 'po_number', visible: true, filterable: true },
  { title: 'Total Qty', data: null, visible: true, filterable: false },
  { title: 'Total Amount', data: null, visible: true, filterable: false },
  { title: 'Ongkir', data: 'total_ongkir', visible: true, filterable: false },
  { title: 'Payment', data: 'payment', visible: true, filterable: true },
  { title: 'Supplier', data: 'supplier', visible: true, filterable: true },
  { title: 'NPB', data: 'npb', visible: true, filterable: true },
  { title: 'Aksi', data: null, visible: true, filterable: false }
]);

const timeAgo = (date) => {
  if (!date) return '-';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Baru saja";
  let interval = seconds / 3600;
  if (interval > 1 && interval < 24) return Math.floor(interval) + " jam lalu";
  if (interval >= 24) return Math.floor(interval / 24) + " hari lalu";
  return Math.floor(seconds / 60) + " mnt lalu";
};

const formatIndo = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const initDataTable = (data) => {
  if ($.fn.DataTable.isDataTable('#noStockTable')) {
    $('#noStockTable').DataTable().destroy();
  }

  table = $('#noStockTable').DataTable({
    data,
    autoWidth: false,
    order: [[1, 'desc']],

    dom: '<"p-3 d-flex justify-content-between align-items-center"lf>rt<"p-3 d-flex justify-content-between"ip>',

    columns: [
      { data: null, orderable: false, render: () => '' },

      { 
        data: 'createdAt', 
        render: d => `<div class="fw-bold text-dark small">${timeAgo(d)}</div>` 
      },
      { 
        data: 'createdAt', 
        render: d => `<span class="small text-muted">${formatIndo(d)}</span>` 
      },
      { data: 'group_key', defaultContent: '-' },
      { data: 'po_number', render: d => `<span class="text-primary fw-bold">${d || '-'}</span>` },

      { data: null, render: (d, t, r) => r.total_qty || 0 },
      { data: null, render: (d, t, r) => `Rp ${Number(r.total_amount || 0).toLocaleString('id-ID')}` },
      { data: 'total_ongkir', render: d => `Rp ${Number(d || 0).toLocaleString('id-ID')}` },

      { data: 'payment', defaultContent: '-' },
      { data: 'supplier', defaultContent: '-' },
      { data: 'npb', defaultContent: '-' },

      {
        data: null,
        orderable: false,
        className: 'text-center sticky-col-end',
        render: (data) => `
          <div class="d-flex gap-1 justify-content-center px-2">
            <button class="btn btn-outline-success btn-sm btn-print" data-group="${data.group_key}">
              <i class="bi bi-printer"></i>
            </button>

            <button class="btn btn-warning btn-sm btn-print-npb" data-group="${data.group_key}">
              <i class="bi bi-receipt"></i>
            </button>

            <button class="btn btn-outline-primary btn-sm btn-edit" data-group="${data.group_key}">
              <i class="bi bi-pencil-square"></i>
            </button>

            <button class="btn btn-outline-danger btn-sm btn-delete" data-group="${data.group_key}">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        `
      }
    ],

    // ✅ FIX FINAL (TANPA ERROR)
    rowCallback: function(row, data, displayIndex) {
      const api = this.api(); // 🔥 WAJIB
      const pageInfo = api.page.info();
      const index = pageInfo.start + displayIndex + 1;

      $('td:eq(0)', row).html(index);
    },

    initComplete: function () {
      setupFilters(this.api());
      attachButtonEvents();
    }
  });
};

const attachButtonEvents = () => {
  const tableEl = $('#noStockTable');

  tableEl.off('click', '.btn-print').on('click', '.btn-print', function() {
    window.open(`${NO_STOCK_URL}/print/group/${$(this).data('group')}`, '_blank');
  });

  tableEl.off('click', '.btn-print-npb').on('click', '.btn-print-npb', function() {
    window.open(`${NO_STOCK_URL}/printnpb/group/${$(this).data('group')}`, '_blank');
  });

  tableEl.off('click', '.btn-edit').on('click', '.btn-edit', function() {
    router.push(`/item-no-stok-form/${$(this).data('group')}`);
  });

  tableEl.off('click', '.btn-delete').on('click', '.btn-delete', function() {
    handleDelete($(this).data('group'));
  });
};

const handleDelete = async (groupKey) => {
  const result = await Swal.fire({
    title: 'Hapus?',
    icon: 'warning',
    showCancelButton: true
  });

  if (result.isConfirmed) {
    await axios.delete(`${NO_STOCK_URL}/${groupKey}`);
    loadData();
  }
};

const setupFilters = (api) => {
  api.columns().every(function (index) {
    const colDef = columnDefs.value[index];
    if (!colDef?.filterable) return;

    const column = this;
    const container = $(`#container-filter-${index}`);
    const label = $(`#label-filter-${index}`);

    container.empty();

    column.data().unique().sort().each(d => {
      if (!d || d === '-') return;

      const safeId = d.toString().replace(/[^a-z0-9]/gi, '');
      container.append(`
        <div class="form-check mb-1">
          <input class="filter-checkbox form-check-input" type="checkbox" value="${d}" data-index="${index}" id="chk-${index}-${safeId}">
          <label class="form-check-label small" for="chk-${index}-${safeId}">${d}</label>
        </div>
      `);
    });

    $(document).off('change', `.filter-checkbox[data-index="${index}"]`)
    .on('change', `.filter-checkbox[data-index="${index}"]`, function() {
      const vals = $(`.filter-checkbox[data-index="${index}"]:checked`)
        .map(function() {
          return $.fn.dataTable.util.escapeRegex($(this).val());
        }).get();

      column.search(vals.length ? vals.join('|') : '', true, false).draw();
      label.text(vals.length ? `${vals.length} Item` : 'Pilih...');
    });
  });
};

const loadData = async () => {
  const res = await axios.get(NO_STOCK_URL);
  items.value = res.data;
  initDataTable(items.value);
};

onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) user.value = JSON.parse(userData);
  loadData();
});
</script>

<style scoped>
.main-content {
  max-width: 100vw;
  overflow-x: hidden;
}

.btn-white { background: white; }
.cursor-pointer { cursor: pointer; }

/* FIX TABEL NEMBUS */
.table-responsive {
  display: block;
  width: 100%;
  overflow-x: auto; /* Memaksa scroll horizontal muncul jika lebar kolom melebihi layar */
  background-color: white;
  border-radius: 0 0 16px 16px;
}

/* STICKY HEADER FIX */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 50; /* Di bawah z-index dropdown tapi di atas baris tabel */
}

/* Z-INDEX DROPDOWN FIX */
.dropdown-menu {
  z-index: 9999 !important; /* Memastikan dropdown konfigurasi kolom berada paling depan */
  border-radius: 12px;
}

/* CUSTOM SCROLLBAR */
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0d6efd; }

:deep(.dataTables_filter input) { 
  border-radius: 10px; 
  border: 1px solid #dee2e6; 
  padding: 0.4rem 0.8rem;
  width: 220px !important; 
}
:deep(.dataTables_paginate .paginate_button.current) { 
  background: #0d6efd !important; 
  color: white !important; 
  border-radius: 8px; 
  border: none !important; 
}

.filter-options-container {
  max-height: 200px;
  overflow-y: auto;
  margin: 10px 0;
}

/* Pastikan tabel memiliki border-collapse terpisah agar sticky bekerja */
#inventoryTable {
  border-collapse: separate;
  border-spacing: 0;
}

/* Sasar kolom terakhir di header, filter, dan body */
:deep(.sticky-col-end) {
  position: sticky;
  right: 0;
  background-color: white !important; /* Wajib ada warna agar tidak transparan */
  z-index: 10;
  border-left: 1px solid #dee2e6; /* Garis pemisah agar terlihat melayang */
}

/* Header harus lebih tinggi z-indexnya dari body */
thead tr th.sticky-col-end {
  z-index: 51; /* Di atas sticky header biasa */
  background-color: #f8f9fa !important; /* Warna header */
}

/* Baris filter juga harus sticky */
thead tr:nth-child(2) th.sticky-col-end {
  top: 48px; /* Sesuaikan dengan tinggi header pertama jika diperlukan */
  z-index: 51;
  background-color: white !important;
}

/* Tambahkan shadow tipis saat tabel discroll */
.table-responsive {
  position: relative;
}

/* Container Navigasi Utama */
    .sweep-nav-wrapper {
        position: relative;
        background-color: #f1f3f5; /* Abu-abu sangat muda */
        border-radius: 50px; /* Membuat lonjong sempurna */
        padding: 8px;
        display: flex;
        width: 100%;
        max-width: 500px;
        border: 1px solid #e9ecef;
        overflow: hidden;
    }

    /* Link Satuan */
    .sweep-nav-wrapper .nav-link {
        position: relative;
        z-index: 2;
        color: #6c757d;
        font-weight: 600;
        font-size: 0.875rem;
        border: none;
        padding: 10px 0;
        flex: 1;
        text-align: center;
        text-decoration: none;
        transition: color 0.3s ease;
    }

    /* Link saat Aktif */
    .sweep-nav-wrapper .nav-link.active {
        color: #0d6efd !important; /* Warna biru Bootstrap */
    }

    /* Kotak Putih yang Menyapu */
    .sweep-indicator {
        position: absolute;
        height: calc(100% - 12px);
        width: calc(25% - 8px); /* Karena ada 3 tombol */
        top: 6px;
        background: #ffffff;
        border-radius: 40px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
    }
</style>