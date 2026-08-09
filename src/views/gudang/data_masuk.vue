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
            <div class="sweep-indicator" style="left: 10px;"></div>

              <a href="/item-masuk" class="nav-link active">Barang Masuk</a>
              <a href="/request" class="nav-link">Penggunaan</a>
              <a href="/item-stok" class="nav-link">Stok</a>
              <a href="/item-no-stok" class="nav-link">No Stock</a>
          </div>

          <div class="row align-items-end mb-4 g-3 mt-3">
            <div class="col">
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-1 small">
                  <li class="breadcrumb-item"><a href="#" class="text-decoration-none">Dashboard</a></li>
                  <li class="breadcrumb-item active">Barang masuk</li>
                </ol>
              </nav>
              <h3 class="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                <span class="page-title-icon"><i class="bi bi-box-seam-fill"></i></span>
                Inventory Barang Masuk
              </h3>
              <p class="text-muted small m-0">Kelola data barang masuk dengan tampilan modern.</p>
            </div>
            <div class="col-auto text-nowrap">
              <router-link to="/inventory-form" class="btn btn-add-item px-4 rounded-3 shadow-sm d-flex align-items-center gap-2">
                <i class="bi bi-plus-lg"></i>
                <span class="d-none d-md-inline">Tambah Barang</span>
              </router-link>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 mb-4 toolbar-card">
            <div class="card-body p-3">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <div class="dropdown">
                    <button class="btn btn-toolbar-action dropdown-toggle px-3 py-2" type="button" id="colDrop" data-bs-toggle="dropdown" aria-expanded="false">
                      <i class="bi bi-layout-three-columns me-2"></i> Kolom
                    </button>
                    <ul class="dropdown-menu shadow-lg border-0 p-2 mt-2 rounded-4" aria-labelledby="colDrop" style="max-height: 350px; overflow-y: auto; min-width: 240px;">
                      <li class="dropdown-header text-uppercase small fw-bold text-secondary px-2">Tampilkan Kolom</li>
                      <li v-for="(col, index) in columnDefs" :key="index">
                        <div v-if="col.title && col.title !== 'No' && col.title !== 'Aksi'"
                             class="form-check form-switch dropdown-item rounded-3 py-2 d-flex align-items-center justify-content-between col-toggle-item">
                          <label class="form-check-label small cursor-pointer me-3" :for="'col'+index">{{ col.title }}</label>
                          <input class="form-check-input ms-0" type="checkbox" :id="'col'+index" :checked="col.visible" @change="toggleColumn(index)">
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div class="vr mx-1 d-none d-md-block"></div>

                  <span class="badge stat-badge stat-badge-primary px-3 py-2 rounded-pill d-flex align-items-center gap-2">
                    <i class="bi bi-database-fill-check"></i>
                    Total Data Masuk: <strong>{{ items.length }}</strong>
                  </span>
                </div>

                <div class="d-flex flex-wrap gap-2 align-items-center export-bar">
                  <div class="export-date-field">
                    <i class="bi bi-calendar3"></i>
                    <div class="d-flex flex-column">
                      <label class="export-date-label">Dari</label>
                      <input type="date" v-model="exportDates.start" class="export-date-input">
                    </div>
                  </div>
                  <div class="export-date-field">
                    <i class="bi bi-calendar3"></i>
                    <div class="d-flex flex-column">
                      <label class="export-date-label">Sampai</label>
                      <input type="date" v-model="exportDates.end" class="export-date-input">
                    </div>
                  </div>
                  <button @click="downloadExcel" class="btn btn-export-excel px-3 rounded-3 d-flex align-items-center gap-2">
                    <i class="bi bi-file-earmark-spreadsheet-fill"></i> Excel
                  </button>
<button class="btn btn-outline-danger px-3 rounded-3 d-flex align-items-center gap-2"
        data-bs-toggle="modal" data-bs-target="#npbMultiModal">
  <i class="bi bi-file-earmark-pdf-fill"></i> Cetak NPB
</button>
                </div>

              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 overflow-hidden table-card">
            <div class="table-responsive custom-scrollbar bg-white">
              <table id="inventoryTable" class="table table-hover align-middle mb-0 w-100 text-nowrap">
                <thead class="bg-light sticky-header">
                  <tr>
                    <th v-for="col in columnDefs" :key="col.title" class="py-3 px-4 text-muted small fw-bold text-uppercase border-bottom">{{ col.title }}</th>
                  </tr>
                  <tr class="bg-white">
                    <th v-for="(col, index) in columnDefs" :key="'filter'+index" class="p-2 border-bottom shadow-sm-bottom">
                      <div v-if="col.filterable" class="dropdown w-100">
                        <button class="btn btn-sm btn-light w-100 dropdown-toggle text-start d-flex justify-content-between align-items-center shadow-none border filter-trigger-btn" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                          <span class="text-truncate small" :id="'label-filter-' + index" style="max-width: 80px;">Pilih...</span>
                        </button>
                        <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 rounded-4" style="min-width: 240px; max-height: 300px; overflow-y: auto;">
                          <div class="input-group input-group-sm mb-2">
                            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                            <input type="text" class="form-control border-start-0 filter-search-input" placeholder="Cari..." @click.stop>
                          </div>
                          <div :id="'container-filter-' + index" class="filter-options-container"></div>
                          <div class="dropdown-divider"></div>
                          <button class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center btn-reset-filter fw-bold" :data-index="index">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>RESET
                          </button>
                        </div>
                      </div>
                      <div v-else class="text-center">
                         <span class="text-muted opacity-25 small">-</span>
                      </div>
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


    <div class="modal fade" id="npbMultiModal" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content rounded-4 border-0">
      <div class="modal-header">
        <h5 class="modal-title fw-bold">Cetak NPB Berdasarkan Tanggal Terima</h5>
        <button class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="row g-2 mb-3">
          <div class="col-md-5">
            <label class="form-label small fw-bold">Dari Tanggal Terima</label>
            <input type="date" class="form-control" v-model="npbFilterDates.start">
          </div>
          <div class="col-md-5">
            <label class="form-label small fw-bold">Sampai Tanggal Terima</label>
            <input type="date" class="form-control" v-model="npbFilterDates.end">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button class="btn btn-primary w-100" @click="fetchReceivedByDate">Cari</button>
          </div>
        </div>

        <div v-if="receivedItems.length" class="table-responsive" style="max-height:350px; overflow-y:auto;">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th style="width:36px;">
                  <input type="checkbox" @change="toggleAllReceived($event)" :checked="allReceivedChecked">
                </th>
                <th>PO / NPB</th>
                <th>Nama Barang</th>
                <th>Spek</th>
                <th>Qty</th>
                <th>Tgl Terima</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in receivedItems" :key="item.id">
                <td><input type="checkbox" :value="item.id" v-model="selectedNpbIds"></td>
                <td class="small">{{ item.po_number }}<br><span class="text-muted">{{ item.npb }}</span></td>
                <td class="fw-semibold small">{{ item.item_name }}</td>
                <td class="small text-muted">{{ item.spesifikasi || '-' }}</td>
                <td class="small">{{ item.qty_awal }} {{ item.unit }}</td>
                <td class="small">{{ formatTanggalID(item.tgl_terima) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-muted small text-center py-5">
          Pilih rentang tanggal terima, lalu klik <strong>Cari</strong>.
        </div>
      </div>
      <div class="modal-footer">
        <span class="small text-muted me-auto">{{ selectedNpbIds.length }} item dipilih</span>
        <button class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
        <button class="btn btn-danger" :disabled="!selectedNpbIds.length" @click="cetakNpbMulti">
          <i class="bi bi-file-earmark-pdf"></i> Cetak PDF
        </button>
      </div>
    </div>
  </div>
</div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Swal from 'sweetalert2';
import $ from 'jquery';

// BOOTSTRAP JS PENTING UNTUK DROPDOWN
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const router = useRouter();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GUDANG_URL = `${API_BASE_URL}/item`;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const items = ref([]);
let table = null;

// ===================== FORMAT TANGGAL INDONESIA =====================
// Hasil: "30 Mei 2026, 05:56"
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const formatTanggalID = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value; // fallback jika bukan format tanggal valid

  const tanggal = date.getDate();
  const bulan = BULAN_ID[date.getMonth()];
  const tahun = date.getFullYear();
  const jam = String(date.getHours()).padStart(2, '0');
  const menit = String(date.getMinutes()).padStart(2, '0');

  return `${tanggal} ${bulan} ${tahun}, ${jam}:${menit}`;
};

const columnDefs = ref([
  { title: 'No', data: null, visible: true, filterable: false },
  { title: 'Akses Kode', data: 'akses_code', visible: true, filterable: true },
  { title: 'Factory', data: 'factory', visible: true, filterable: true },
  { title: 'Tgl Masuk', data: 'in_date', visible: true, filterable: true },
  { title: 'Kategori', data: 'kategori', visible: true, filterable: true },
  { title: 'Nama Barang', data: 'item_name', visible: true, filterable: true }, // Nama Barang kini bisa difilter
  { title: 'Spek', data: 'spesifikasi', visible: true, filterable: true },
  { title: 'qty', data: 'qty_awal', visible: true, filterable: true },
  { title: 'min_qty', data: 'min_qty', visible: true, filterable: true },
  { title: 'max_qty', data: 'max_qty', visible: true, filterable: true },
  { title: 'Unit', data: 'unit', visible: true, filterable: true },
  { title: 'Status', data: 'status_barang', visible: true, filterable: true },
  { title: 'NPB', data: 'npb', visible: true, filterable: true },
  { title: 'PO Number', data: 'po_number', visible: true, filterable: true },
  { title: 'Tgl Bill', data: 'bill_date', visible: true, filterable: true },
  { title: 'Dok BC', data: 'dokumen_bc', visible: true, filterable: true },
  { title: 'Supplier', data: 'supplier', visible: true, filterable: true },
  { title: 'Brand', data: 'brand', visible: true, filterable: true },
  { title: 'Warna', data: 'color', visible: true, filterable: true },
  { title: 'Size', data: 'size', visible: true, filterable: true },
  { title: 'Rak', data: 'rak', visible: true, filterable: true },
  { title: 'Rak No', data: 'rak_no', visible: true, filterable: true },
  { title: 'CreatedAt', data: 'createdAt', visible: true, filterable: true },
  { title: 'Created By', data: 'createdBy', visible: true, filterable: true },
  { title: 'UpdatedAt', data: 'updatedAt', visible: true, filterable: true },
  { title: 'Updated By', data: 'updatedBy', visible: true, filterable: true },
  { title: 'Aksi', data: null, visible: true, filterable: false }
]);

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => { localStorage.removeItem('user'); window.location.href = '/login'; };

const toggleColumn = (index) => {
  columnDefs.value[index].visible = !columnDefs.value[index].visible;
  if (table) {
    table.column(index).visible(columnDefs.value[index].visible);
    // Recalculate layout
    setTimeout(() => { table.columns.adjust().draw(); }, 100);
  }
};

const initDataTable = (data) => {
  if ($.fn.DataTable.isDataTable('#inventoryTable')) $('#inventoryTable').DataTable().destroy();

  table = $('#inventoryTable').DataTable({
    data,
    autoWidth: false,
    scrollX: false, // Kita handle via CSS .table-responsive
    dom: '<"p-3 d-flex justify-content-between align-items-center"lf>rt<"p-3 d-flex justify-content-between"ip>',
    columns: [
      { data: null, render: (d, t, r, meta) => `<span class="text-muted small">${meta.row + 1}</span>` },
      { data: 'akses_code', render: d => `<span class="badge badge-akses px-2">${d || '-'}</span>` },
      { data: 'factory' },
      { data: 'in_date' },
      { data: 'kategori', render: d => `<span class="badge badge-kategori">${d || '-'}</span>` },
      { data: 'item_name', render: d => `<div class="fw-bold text-dark" style="min-width:200px; white-space: normal;">${d}</div>` },
      { data: 'spesifikasi', render: d => `<small class="text-muted">${d || '-'}</small>` },
      {
        data: 'qty_awal',
        render: d => `<span class="badge ${d < 5 ? 'badge-qty-low' : 'badge-qty-normal'} rounded-pill shadow-sm">${d || 0}</span>`
      },
      { data: 'min_qty' },
      { data: 'max_qty' },
      { data: 'unit' },
      {
        data: 'status_barang',
        render: (d) => {
          if (d === 'Received') {
            return `<span class="badge badge-status-received"><i class="bi bi-check-circle-fill me-1"></i>Received</span>`;
          }
          return `<span class="badge badge-status-pending"><i class="bi bi-hourglass-split me-1"></i>Pending</span>`;
        }
      },
      { data: 'npb' },
      { data: 'po_number', render: d => `<span class="font-monospace text-primary fw-bold">${d || '-'}</span>` },
      { data: 'bill_date' },
      { data: 'dokumen_bc' },
      { data: 'supplier' },
      { data: 'brand' },
      { data: 'color' },
      { data: 'size' },
      {
        data: 'rak',
        render: (d, t, row) => `<div class="small fw-semibold text-secondary">${row.rak || '-'}/${row.rak_no || '-'}</div>`
      },
      { data: 'rak_no' },
      {
        data: 'createdAt',
        render: d => `<span class="text-nowrap small text-muted">${formatTanggalID(d)}</span>`
      },
      { data: 'createdBy', render: d => `<div class="fw-bold text-dark" style="min-width:200px; white-space: normal;">${d || '-'}</div>` },
      {
        data: 'updatedAt',
        render: d => `<span class="text-nowrap small text-muted">${formatTanggalID(d)}</span>`
      },
      { data: 'updatedBy', render: d => `<div class="fw-bold text-dark" style="min-width:200px; white-space: normal;">${d || '-'}</div>` },
      {
        data: null,
        orderable: false,
        className: 'text-center sticky-col-end',
        render: (data) => {
          const isReceived = data.status_barang === 'Received';

          return `
            <div class="d-flex gap-1 justify-content-center action-btn-group">

              ${!isReceived ? `
                <button class="btn btn-action btn-action-receive btn-receive" data-id="${data.id}" title="Terima Barang">
                  <i class="bi bi-check-circle"></i>
                </button>
              ` : `
                <span class="badge badge-status-received px-2"><i class="bi bi-check-circle-fill"></i></span>
              `}

              <button class="btn btn-action btn-action-pdf btn-pdf" data-npb="${data.npb}" title="Cetak PDF">
                <i class="bi bi-file-earmark-pdf"></i>
              </button>

              <button class="btn btn-action btn-action-edit btn-edit" data-id="${data.id}" title="Edit">
                <i class="bi bi-pencil-square"></i>
              </button>

              <button class="btn btn-action btn-action-delete btn-delete" data-id="${data.id}" title="Hapus">
                <i class="bi bi-trash3"></i>
              </button>

            </div>
          `;
        }
      },
    ],
    initComplete: function () {
      const api = this.api();
      api.columns().every(function (index) {
        const column = this;
        const colDef = columnDefs.value[index];
        if (colDef && colDef.filterable) {
          const container = $(`#container-filter-${index}`);
          const label = $(`#label-filter-${index}`);
          const uniqueData = column.data().unique().sort();

          uniqueData.each(d => {
            if(d) {
              const safeId = d.toString().replace(/[^a-z0-9]/gi, '');
              container.append(`
                <div class="form-check mb-1">
                  <input class="form-check-input filter-checkbox" type="checkbox" value="${d}" data-index="${index}" id="chk-${index}-${safeId}">
                  <label class="form-check-label small cursor-pointer" for="chk-${index}-${safeId}">${d}</label>
                </div>
              `);
            }
          });

          $(document).off('change', `.filter-checkbox[data-index="${index}"]`).on('change', `.filter-checkbox[data-index="${index}"]`, function() {
            const selected = [];
            $(`.filter-checkbox[data-index="${index}"]:checked`).each(function() {
              selected.push($.fn.dataTable.util.escapeRegex($(this).val()));
            });
            if (selected.length > 0) {
              label.text(`${selected.length} Kriteria`).addClass('text-primary fw-bold');
              column.search(selected.join('|'), true, false).draw();
            } else {
              label.text('Pilih...').removeClass('text-primary fw-bold');
              column.search('', true, false).draw();
            }
          });
        }
      });

      // Events
      $('.btn-reset-filter').on('click', function(e) {
        e.stopPropagation();
        const idx = $(this).data('index');
        $(`.filter-checkbox[data-index="${idx}"]`).prop('checked', false).trigger('change');
      });

      $('.filter-search-input').on('keyup', function() {
        const val = $(this).val().toLowerCase();
        $(this).closest('.dropdown-menu').find('.form-check').filter(function() {
          $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
        });
      });

      $('#inventoryTable')
  .on('click', '.btn-edit', function() {
    router.push(`/inventory-form/${$(this).data('id')}`);
  })
  .on('click', '.btn-pdf', function () {
    const npb = $(this).data('npb');
    window.open(`${GUDANG_URL}/export-npb/${npb}`, '_blank');
  })
  .on('click', '.btn-delete', function() {
    deleteItem($(this).data('id'));
  })
  .on('click', '.btn-receive', function() {
    receiveItem($(this).data('id'));
  });
    }
  });
};

const receiveItem = async (id) => {
  const confirm = await Swal.fire({
    title: 'Terima Barang?',
    text: 'NPB akan digenerate dan status berubah menjadi Received',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Terima'
  });

  if (!confirm.isConfirmed) return;

  try {
    await axios.put(`${GUDANG_URL}/receive/${id}`);

    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Barang sudah diterima',
      timer: 1500,
      showConfirmButton: false
    });

    // 🔥 reload data
    const res = await axios.get(GUDANG_URL);
    items.value = res.data;
    initDataTable(items.value);

  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || 'Gagal', 'error');
  }
};

const deleteItem = async (id) => {
  const res = await Swal.fire({
    title: 'Hapus Data?',
    text: "Data akan dihapus permanen.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Ya, Hapus'
  });
  if (res.isConfirmed) {
    try {
      await axios.delete(`${GUDANG_URL}/${id}`);
      items.value = items.value.filter(i => i.id !== id);
      initDataTable(items.value);
      Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Error', 'Gagal menghapus data.', 'error');
    }
  }
};

onMounted(async () => {
  $.fn.dataTable.ext.errMode = 'none';
  const userData = localStorage.getItem('user');
  if (userData) user.value = JSON.parse(userData);
  try {
    const res = await axios.get(GUDANG_URL);
    items.value = res.data;
    initDataTable(items.value);
  } catch (e) { console.error("Load failed"); }
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth;
    if(table) table.columns.adjust();
  });
});

onBeforeUnmount(() => { if (table) table.destroy(); });

// 1. Tambahkan state untuk tanggal
const exportDates = ref({
  start: new Date().toISOString().substr(0, 10), // Default hari ini
  end: new Date().toISOString().substr(0, 10)
});

// 2. Fungsi download
const downloadExcel = async () => {
  if (!exportDates.value.start || !exportDates.value.end) {
    return Swal.fire('Info', 'Pilih rentang tanggal terlebih dahulu', 'info');
  }

  try {
    Swal.fire({
      title: 'Memproses...',
      text: 'Sedang menyiapkan file Excel',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const response = await axios.get(`${GUDANG_URL}/export-date`, {
      params: {
        startDate: exportDates.value.start,
        endDate: exportDates.value.end
      },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Barang_Masuk_${exportDates.value.start}_${exportDates.value.end}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.close();
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'Gagal mengunduh data Excel', 'error');
  }
};

const npbFilterDates = ref({
  start: new Date().toISOString().substr(0, 10),
  end: new Date().toISOString().substr(0, 10)
});
const receivedItems = ref([]);
const selectedNpbIds = ref([]);

const allReceivedChecked = computed(() =>
  receivedItems.value.length > 0 && selectedNpbIds.value.length === receivedItems.value.length
);

const toggleAllReceived = (e) => {
  selectedNpbIds.value = e.target.checked ? receivedItems.value.map(i => i.id) : [];
};

const fetchReceivedByDate = async () => {
  if (!npbFilterDates.value.start || !npbFilterDates.value.end) {
    return Swal.fire('Info', 'Pilih rentang tanggal terlebih dahulu', 'info');
  }
  try {
    const res = await axios.get(`${GUDANG_URL}/received-by-date`, {
      params: { startDate: npbFilterDates.value.start, endDate: npbFilterDates.value.end }
    });
    receivedItems.value = res.data;
    selectedNpbIds.value = [];
    if (!receivedItems.value.length) {
      Swal.fire('Info', 'Tidak ada barang Received pada rentang tanggal tersebut', 'info');
    }
  } catch (err) {
    Swal.fire('Error', 'Gagal mengambil data', 'error');
  }
};

const cetakNpbMulti = async () => {
  try {
    const response = await axios.post(
      `${GUDANG_URL}/export-npb-multiple`,
      { ids: selectedNpbIds.value },
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    window.open(url, '_blank');
  } catch (err) {
    Swal.fire('Error', 'Gagal mencetak NPB', 'error');
  }
};

</script>

<style scoped>
.main-content {
  max-width: 100vw;
  overflow-x: hidden;
}

.cursor-pointer { cursor: pointer; }

/* ===================== HEADER TITLE ICON ===================== */
.page-title-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 4px 10px rgba(13, 110, 253, 0.25);
}

/* ===================== TOMBOL TAMBAH BARANG ===================== */
.btn-add-item {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  color: #fff;
  border: none;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn-add-item:hover {
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(13, 110, 253, 0.3);
}

/* ===================== TOOLBAR CARD ===================== */
.toolbar-card { background: #fff; }

.btn-toolbar-action {
  background: #fff;
  border: 1.5px solid #e9ecef;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #495057;
  transition: all 0.2s ease;
}
.btn-toolbar-action:hover { border-color: #0d6efd; color: #0d6efd; }
.btn-toolbar-action i { color: #0d6efd; }
.col-toggle-item:hover { background: #f3f5fb; }

.stat-badge {
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
}
.stat-badge-primary {
  background: #e7edff;
  color: #1d4ed8;
}

.export-bar { background: #f8f9fb; padding: 6px; border-radius: 14px; border: 1px solid #eef0f3; }

.export-date-field {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1.5px solid #e9ecef;
  border-radius: 10px;
  padding: 6px 12px;
}
.export-date-field i { color: #0d6efd; font-size: 0.9rem; }
.export-date-label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #adb5bd;
  margin-bottom: 0;
  line-height: 1;
}
.export-date-input {
  border: none;
  outline: none;
  padding: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: #212529;
  background: transparent;
}

.btn-export-excel {
  background: linear-gradient(135deg, #198754, #157347);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  border: none;
  transition: all 0.2s ease;
}
.btn-export-excel:hover { color: #fff; transform: translateY(-1px); box-shadow: 0 6px 14px rgba(25,135,84,0.3); }

/* ===================== TABLE CARD ===================== */
.table-card { background: #fff; }

/* FIX TABEL NEMBUS */
.table-responsive {
  display: block;
  width: 100%;
  overflow-x: auto;
  background-color: white;
  border-radius: 0 0 16px 16px;
}

/* STICKY HEADER FIX */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 50;
}

/* Z-INDEX DROPDOWN FIX */
.dropdown-menu {
  z-index: 9999 !important;
  border-radius: 12px;
}

.filter-trigger-btn { border-radius: 8px; font-weight: 600; }
.filter-search-input:focus { box-shadow: none; border-color: #dee2e6; }

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
  background-color: white !important;
  z-index: 10;
  border-left: 1px solid #dee2e6;
}

/* Header harus lebih tinggi z-indexnya dari body */
thead tr th.sticky-col-end {
  z-index: 51;
  background-color: #f8f9fa !important;
}

/* Baris filter juga harus sticky */
thead tr:nth-child(2) th.sticky-col-end {
  top: 48px;
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
        background-color: #f1f3f5;
        border-radius: 50px;
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
        color: #0d6efd !important;
    }

    /* Kotak Putih yang Menyapu */
    .sweep-indicator {
        position: absolute;
        height: calc(100% - 12px);
        width: calc(25% - 8px);
        top: 6px;
        background: #ffffff;
        border-radius: 40px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1;
    }
</style>

<!--
  PENTING: style di bawah ini SENGAJA TIDAK "scoped".
  Konten badge & tombol aksi pada tabel di-generate oleh DataTables lewat
  innerHTML (render: di kolom), bukan lewat template Vue, sehingga atribut
  scoped (data-v-xxxx) Vue tidak pernah ditempel ke elemen tersebut.
  Akibatnya CSS scoped TIDAK PERNAH KENA ke badge/tombol ini -- itulah sebabnya
  sebelumnya teks badge tampak putih/transparan (memakai warna default
  Bootstrap, bukan warna custom). Style ini harus tetap global agar berlaku.
-->
<style>
.badge-akses {
  background: #11182c !important;
  color: #ffffff !important;
  font-weight: 600;
}
.badge-kategori {
  background: #eef1f6 !important;
  color: #495057 !important;
  border: 1px solid #e0e4eb;
  font-weight: 600;
}

.badge-qty-low {
  background: #dc3545 !important;
  color: #ffffff !important;
  font-weight: 600;
}
.badge-qty-normal {
  background: #0d6efd !important;
  color: #ffffff !important;
  font-weight: 600;
}

.badge-status-received {
  background: #d1f5e0 !important;
  color: #157347 !important;
  font-weight: 600;
  border: 1px solid #b7ecc9;
}
.badge-status-pending {
  background: #fff3cd !important;
  color: #997404 !important;
  font-weight: 600;
  border: 1px solid #ffe69c;
}

/* ===================== ACTION BUTTONS (tabel) ===================== */
.action-btn-group { padding: 2px; }
.btn-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  border: none !important;
  transition: all 0.15s ease;
}
.btn-action:hover { transform: translateY(-1px); }

.btn-action-receive { background: #d1f5e0 !important; color: #157347 !important; }
.btn-action-receive:hover { background: #157347 !important; color: #ffffff !important; }

.btn-action-pdf { background: #fdeeee !important; color: #dc3545 !important; }
.btn-action-pdf:hover { background: #dc3545 !important; color: #ffffff !important; }

.btn-action-edit { background: #e7edff !important; color: #1d4ed8 !important; }
.btn-action-edit:hover { background: #1d4ed8 !important; color: #ffffff !important; }

.btn-action-delete { background: #fdeeee !important; color: #dc3545 !important; }
.btn-action-delete:hover { background: #dc3545 !important; color: #ffffff !important; }
</style>