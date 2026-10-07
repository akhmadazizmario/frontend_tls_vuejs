<template>
  <div class="d-flex flex-column min-vh-100 modern-bg">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden">
      <Sidebar :isOpen="sidebarOpen" />

      <!-- [PERBAIKAN] minWidth: '0' Mencegah layar melar ke kanan -->
      <main
        class="flex-grow-1 p-3 p-md-4 main-content"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: '56px',
          minWidth: '0'
        }"
      >
        <div class="container-fluid max-w-custom mx-auto">

          <!-- Top Navigation Pill -->
          <div class="sweep-nav-wrapper mb-4 shadow-sm">
            <div class="sweep-indicator" style="left: 10px;"></div>
            <a href="/item-masuk" class="nav-link active">Barang Masuk</a>
            <a href="/request" class="nav-link">Penggunaan</a>
            <a href="/item-stok" class="nav-link">Stok</a>
          </div>

          <!-- Page Header -->
          <div class="row align-items-end mb-4 g-3">
            <div class="col">
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-2 small fw-medium">
                  <li class="breadcrumb-item"><a href="#" class="text-decoration-none text-muted hover-primary">Dashboard</a></li>
                  <li class="breadcrumb-item active text-primary">Barang Masuk</li>
                </ol>
              </nav>
              <h3 class="fw-bolder text-dark m-0 d-flex align-items-center gap-2">
                <span class="bg-primary text-white p-2 rounded-3 fs-5 d-flex align-items-center justify-content-center shadow-sm">
                  <i class="bi bi-box-seam-fill"></i>
                </span>
                Inventory Barang Masuk
              </h3>
              <p class="text-secondary small m-0 mt-2">Kelola data inventaris barang masuk secara efisien dan *real-time*.</p>
            </div>
            <div class="col-auto text-nowrap">
              <router-link to="/inventory-form" class="btn btn-primary px-4 py-2 rounded-pill shadow-sm modern-btn d-flex align-items-center gap-2 fw-medium">
                <i class="bi bi-plus-lg fs-6"></i>
                <span class="d-none d-md-inline">Tambah Barang</span>
              </router-link>
            </div>
          </div>

          <!-- Action Bar Card -->
          <div class="card border-0 shadow-sm rounded-4 mb-4 glass-card">
            <div class="card-body p-3">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <div class="dropdown">
                    <button class="btn btn-light border-0 px-3 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2 text-dark fw-medium btn-hover" type="button" data-bs-toggle="dropdown">
                      <i class="bi bi-sliders text-primary"></i> Kolom
                    </button>
                    <ul class="dropdown-menu shadow-lg border-0 p-2 mt-2 custom-dropdown rounded-4">
                      <li class="dropdown-header text-uppercase small fw-bold text-secondary px-2">Tampilkan Kolom</li>
                      <li v-for="(col, index) in columnDefs" :key="index">
                        <div v-if="col.title && col.title !== 'No' && col.title !== 'Aksi'"
                             class="form-check form-switch dropdown-item rounded-3 py-2 d-flex align-items-center justify-content-between modern-switch">
                          <label class="form-check-label small cursor-pointer me-4 fw-medium text-secondary" :for="'col'+index">{{ col.title }}</label>
                          <input class="form-check-input cursor-pointer" type="checkbox" :id="'col'+index" :checked="col.visible" @change="toggleColumn(index)">
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div class="vr opacity-25 mx-1 d-none d-md-block"></div>

                  <span class="badge bg-primary-subtle text-primary-emphasis border border-primary-subtle px-3 py-2 rounded-pill fw-semibold shadow-sm d-flex align-items-center gap-2">
                    <i class="bi bi-database-fill-check"></i>
                    Total Data: {{ items.length }}
                  </span>
                </div>

                <div class="d-flex flex-wrap gap-2 align-items-center">
                  <div class="input-group modern-input-group shadow-sm rounded-pill overflow-hidden bg-white">
                    <span class="input-group-text bg-white border-0 text-primary px-3"><i class="bi bi-calendar-range"></i></span>
                    <input type="date" v-model="exportDates.start" class="form-control border-0 bg-white small-date text-muted" title="Tanggal Mulai">
                    <span class="input-group-text bg-white border-0 text-muted px-1">-</span>
                    <input type="date" v-model="exportDates.end" class="form-control border-0 bg-white small-date text-muted" title="Tanggal Akhir">
                    
                    <button @click="downloadExcel" class="btn btn-success d-flex align-items-center gap-2 px-3 fw-medium border-0 btn-hover-scale" title="Export Excel">
                      <i class="bi bi-file-earmark-excel-fill"></i> <span class="d-none d-lg-inline">Excel</span>
                    </button>
                  </div>
                  
                  <button class="btn btn-danger rounded-pill px-4 shadow-sm fw-medium d-flex align-items-center gap-2 btn-hover-scale"
                          data-bs-toggle="modal" data-bs-target="#npbMultiModal">
                    <i class="bi bi-file-earmark-pdf-fill"></i> <span class="d-none d-md-inline">Cetak NPB</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- Data Table Card -->
          <!-- [PERBAIKAN] Table Wrapper dipindah ke script melalui konfigurasi `dom` DataTables -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white w-100">
            <table id="inventoryTable" class="table table-hover align-middle mb-0 w-100 text-nowrap modern-table">
              <thead class="sticky-header">
                <!-- Baris 1: Judul Kolom & Sort -->
                <tr class="table-light-custom">
                  <!-- [PERBAIKAN] Class dinamis 'sticky-col-end-header' untuk kolom Aksi -->
                  <th v-for="(col, index) in columnDefs" :key="'header'+index" 
                      class="py-3 px-4 text-secondary small fw-bold text-uppercase border-bottom border-light tracking-wide"
                      :class="{'d-none': !col.visible, 'sticky-col-end-header': col.title === 'Aksi'}">
                    {{ col.title }}
                  </th>
                </tr>
                
                <!-- Baris 2: Filter Dropdown (@click.stop Mencegah trigger sort) -->
                <tr class="bg-white border-bottom border-light">
                  <th v-for="(col, index) in columnDefs" :key="'filter'+index" 
                      class="p-2 border-0" :class="{'d-none': !col.visible, 'sticky-col-end-header': col.title === 'Aksi'}">
                    
                    <div v-if="col.filterable" class="dropdown w-100" @click.stop>
                      <button class="btn btn-sm btn-light w-100 dropdown-toggle text-start d-flex justify-content-between align-items-center border-0 rounded-3 text-muted filter-btn shadow-none" 
                              type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" @click.stop>
                        <span class="text-truncate small fw-medium" :id="'label-filter-' + index">Semua</span>
                      </button>
                      <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 custom-dropdown rounded-4" @click.stop>
                        <div class="input-group input-group-sm mb-3 border rounded-3 overflow-hidden shadow-sm">
                          <span class="input-group-text bg-light border-0"><i class="bi bi-search text-muted"></i></span>
                          <input type="text" class="form-control border-0 bg-light filter-search-input shadow-none" placeholder="Cari filter..." @click.stop>
                        </div>
                        <div :id="'container-filter-' + index" class="filter-options-container custom-scrollbar mb-2 px-1">
                        </div>
                        <div class="dropdown-divider border-light my-3"></div>
                        <button class="btn btn-light btn-sm w-100 text-center btn-reset-filter fw-bold text-danger rounded-3" :data-index="index">
                          <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filter
                        </button>
                      </div>
                    </div>
                    <div v-else class="text-center text-muted opacity-25 small mt-1">-</div>
                    
                  </th>
                </tr>
              </thead>
              <tbody class="border-top-0"></tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal NPB Multi (Tidak diubah fungsinya, hanya disesuaikan UI-nya sedikit) -->
    <div class="modal fade" id="npbMultiModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow-lg">
          <div class="modal-header border-light p-4">
            <h5 class="modal-title fw-bold text-dark"><i class="bi bi-printer-fill text-danger me-2"></i>Cetak NPB Berdasarkan Tanggal Terima</h5>
            <button class="btn-close shadow-none" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4 bg-light-subtle">
            <div class="card border-0 shadow-sm rounded-3 p-3 mb-3 bg-white">
              <div class="row g-2 align-items-end">
                <div class="col-md-5">
                  <label class="form-label small fw-semibold text-secondary">Dari Tanggal Terima</label>
                  <input type="date" class="form-control rounded-3" v-model="npbFilterDates.start">
                </div>
                <div class="col-md-5">
                  <label class="form-label small fw-semibold text-secondary">Sampai Tanggal Terima</label>
                  <input type="date" class="form-control rounded-3" v-model="npbFilterDates.end">
                </div>
                <div class="col-md-2">
                  <button class="btn btn-primary w-100 rounded-3 fw-medium" @click="fetchReceivedByDate">
                    <i class="bi bi-search me-1"></i> Cari
                  </button>
                </div>
              </div>
            </div>

            <div v-if="receivedItems.length" class="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
              <div class="table-responsive custom-scrollbar" style="max-height:300px;">
                <table class="table table-hover align-middle mb-0 text-nowrap">
                  <thead class="table-light sticky-header">
                    <tr>
                      <th class="text-center px-3" style="width:36px;">
                        <input class="form-check-input shadow-none" type="checkbox" @change="toggleAllReceived($event)" :checked="allReceivedChecked">
                      </th>
                      <th class="small fw-bold text-secondary">PO / NPB</th>
                      <th class="small fw-bold text-secondary">Nama Barang</th>
                      <th class="small fw-bold text-secondary">Spek</th>
                      <th class="small fw-bold text-secondary">Qty</th>
                      <th class="small fw-bold text-secondary">Tgl Terima</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in receivedItems" :key="item.id">
                      <td class="text-center px-3">
                        <input class="form-check-input shadow-none cursor-pointer" type="checkbox" :value="item.id" v-model="selectedNpbIds">
                      </td>
                      <td class="small fw-medium">{{ item.po_number }}<br><span class="text-muted">{{ item.npb }}</span></td>
                      <td class="small fw-bold text-dark">{{ item.item_name }}</td>
                      <td class="small text-secondary">{{ item.spesifikasi || '-' }}</td>
                      <td class="small fw-semibold">{{ item.qty_awal }} <span class="text-muted fw-normal">{{ item.unit }}</span></td>
                      <td class="small text-muted">{{ formatTanggalID(item.tgl_terima) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="text-center py-5">
              <div class="display-1 text-muted opacity-25 mb-3"><i class="bi bi-inbox"></i></div>
              <p class="text-muted mb-0">Pilih rentang tanggal terima, lalu klik <strong>Cari</strong>.</p>
            </div>
          </div>
          <div class="modal-footer border-light p-3 bg-white rounded-bottom-4">
            <span class="small fw-semibold text-primary bg-primary-subtle px-3 py-1 rounded-pill me-auto">{{ selectedNpbIds.length }} Item Terpilih</span>
            <button class="btn btn-light border fw-medium rounded-pill px-4" data-bs-dismiss="modal">Batal</button>
            <button class="btn btn-danger fw-medium rounded-pill px-4" :disabled="!selectedNpbIds.length" @click="cetakNpbMulti">
              <i class="bi bi-file-earmark-pdf-fill me-1"></i> Cetak PDF
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

// Helper Format Tanggal
const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatTanggalID = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value; 
  const tanggal = String(date.getDate()).padStart(2, '0');
  const bulan = BULAN_ID[date.getMonth()];
  const tahun = date.getFullYear();
  const jam = String(date.getHours()).padStart(2, '0');
  const menit = String(date.getMinutes()).padStart(2, '0');
  return `${tanggal} ${bulan} ${tahun}, ${jam}:${menit}`;
};

// [PERBAIKAN] Menambahkan property className: 'sticky-col-end' pada definisi kolom terakhir
const columnDefs = ref([
  { title: 'No', data: null, visible: true, filterable: false },
  { title: 'Akses Kode', data: 'akses_code', visible: true, filterable: true },
  { title: 'Factory', data: 'factory', visible: true, filterable: true },
  { title: 'Tgl Masuk', data: 'in_date', visible: true, filterable: true },
  { title: 'Kategori', data: 'kategori', visible: true, filterable: true },
  { title: 'Nama Barang', data: 'item_name', visible: true, filterable: true },
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
  { title: 'Aksi', data: null, visible: true, filterable: false, className: 'sticky-col-end text-center' }
]);

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => { localStorage.removeItem('user'); window.location.href = '/login'; };

const toggleColumn = (index) => {
  columnDefs.value[index].visible = !columnDefs.value[index].visible;
  if (table) {
    table.column(index).visible(columnDefs.value[index].visible);
    setTimeout(() => { table.columns.adjust().draw(); }, 100);
  }
};

const setupFilters = (api) => {
  api.columns().every(function (index) {
    const column = this;
    const colDef = columnDefs.value[index];
    if (!colDef || !colDef.filterable) return;

    const container = $(`#container-filter-${index}`);
    const label = $(`#label-filter-${index}`);
    
    const uniqueData = [];
    
    // [PERBAIKAN] Mengambil teks bersih murni untuk difilter
    column.cells('', index).render('filter').unique().each(function(val) {
        if (val && val !== '-' && val !== 'Kosong') {
            uniqueData.push(val);
        }
    });

    // [PERBAIKAN PENGURUTAN / SORTING FILTER TANGGAL]
    if (colDef.title === 'Tgl Masuk' || colDef.title === 'Tgl Bill') {
        uniqueData.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    } else if (colDef.title === 'CreatedAt' || colDef.title === 'UpdatedAt') {
        uniqueData.sort((a, b) => {
            const parseIndoDate = (str) => {
                const parts = str.match(/(\d+)\s+([A-Za-z]+)\s+(\d+),\s+(\d+):(\d+)/);
                if (parts) {
                    const m = BULAN_ID.indexOf(parts[2]);
                    return new Date(parts[3], m, parts[1], parts[4], parts[5]).getTime();
                }
                return new Date(str).getTime() || 0;
            };
            return parseIndoDate(b) - parseIndoDate(a);
        });
    } else {
        uniqueData.sort();
    }

    container.empty();
    if (uniqueData.length === 0) {
        container.append('<div class="text-center text-muted small p-3 bg-light rounded-3">Kosong</div>');
        return;
    }

    uniqueData.forEach(d => {
      const safeId = `chk-${index}-${String(d).replace(/[^a-z0-9]/gi, '-')}`;
      container.append(`
        <div class="form-check modern-checkbox mb-2 d-flex align-items-center">
          <input class="form-check-input filter-checkbox cursor-pointer shadow-none border-secondary-subtle" type="checkbox" value="${d}" data-index="${index}" id="${safeId}">
          <label class="form-check-label small cursor-pointer ms-2 text-dark w-100" for="${safeId}">${d}</label>
        </div>`);
    });

    $(`.btn-reset-filter[data-index="${index}"]`).off('click').on('click', function(e) {
      e.preventDefault();
      $(`.filter-checkbox[data-index="${index}"]`).prop('checked', false);
      column.search('').draw();
      label.text('Semua').removeClass('text-primary fw-bold');
    });
  });

  $(document).off('change', '.filter-checkbox').on('change', '.filter-checkbox', function() {
    const idx = $(this).data('index');
    const col = api.column(idx);
    const selected = [];
    $(`.filter-checkbox[data-index="${idx}"]:checked`).each(function() {
      const val = $.fn.dataTable.util.escapeRegex($(this).val());
      selected.push(`^${val}$`); 
    });
    col.search(selected.length > 0 ? selected.join('|') : '', true, false).draw();
    $(`#label-filter-${idx}`).text(selected.length > 0 ? `${selected.length} Terpilih` : 'Semua')
      .toggleClass('text-primary fw-bold', selected.length > 0);
  });

  $('.filter-search-input').on('keyup', function() {
    const val = $(this).val().toLowerCase();$(this).closest('.dropdown-menu').find('.form-check').filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
    });
  });
};

const initDataTable = (data) => {
  if ($.fn.DataTable.isDataTable('#inventoryTable')) $('#inventoryTable').DataTable().destroy();

  table = $('#inventoryTable').DataTable({
    data,
    autoWidth: false,
    orderCellsTop: true, // [PERBAIKAN] Mengatasi up/down sort conflict pada filter
    // [PERBAIKAN] Memisahkan bungkus scroll hanya pada bagian tabel ('t') 
    dom: '<"p-3 d-flex flex-wrap justify-content-between align-items-center gap-3"lf><"table-responsive custom-scrollbar"t><"p-4 d-flex flex-wrap justify-content-between align-items-center border-top border-light"ip>',
    language: {
      search: "_INPUT_",
      searchPlaceholder: "Pencarian cepat...",
      lengthMenu: "Tampil _MENU_ data",
      info: "Menampilkan _START_ s/d _END_ dari _TOTAL_ entri",
      paginate: { previous: "Prev", next: "Next" }
    },
    columns: columnDefs.value.map(col => ({
      data: col.data,
      visible: col.visible,
      className: col.className || '',
      render: (d, type, r, meta) => {
        
        // 1. Definisikan Text Asli (Murni) untuk Keperluan Filter dan Sort
        let plainText = d !== null && d !== undefined ? String(d).trim() : '-';
        if (col.title === 'No') plainText = String(meta.row + 1);
        else if (col.title === 'Status') plainText = d === 'Received' ? 'Received' : 'Pending';
        else if (col.title === 'Rak') plainText = `${r.rak || '-'}/${r.rak_no || '-'}`;
        else if (col.title === 'CreatedAt' || col.title === 'UpdatedAt') plainText = d ? formatTanggalID(d) : '-';

        // 2. Berikan Text Murni Ke Engine DataTable
        if (type === 'filter' || type === 'sort') {
            return plainText;
        }

        // 3. Render HTML Estetis Untuk UI Tampilan Layar
        if (col.title === 'No') return `<span class="text-muted fw-medium">${plainText}</span>`;
        if (col.title === 'Akses Kode') return `<span class="badge badge-akses px-2 shadow-sm">${plainText}</span>`;
        if (col.title === 'Kategori') return `<span class="badge badge-kategori shadow-sm">${plainText}</span>`;
        if (col.title === 'Nama Barang') return `<div class="fw-bold text-dark" style="min-width:200px; white-space: normal;">${plainText}</div>`;
        if (col.title === 'Spek') return `<small class="text-secondary">${plainText}</small>`;
        if (col.title === 'qty') return `<span class="badge ${d < 5 ? 'badge-qty-low' : 'badge-qty-normal'} rounded-pill shadow-sm px-3">${d || 0}</span>`;
        if (col.title === 'Status') {
          return d === 'Received' 
            ? `<span class="badge badge-status-received px-3 py-2 rounded-pill shadow-sm"><i class="bi bi-check-circle-fill me-1"></i>Received</span>` 
            : `<span class="badge badge-status-pending px-3 py-2 rounded-pill shadow-sm"><i class="bi bi-hourglass-split me-1"></i>Pending</span>`;
        }
        if (col.title === 'PO Number') return `<span class="font-monospace text-primary fw-bold px-2 py-1 bg-primary-subtle rounded">${plainText}</span>`;
        if (col.title === 'Rak') return `<div class="small fw-semibold text-secondary"><i class="bi bi-inboxes me-1"></i>${plainText}</div>`;
        if (col.title === 'CreatedAt' || col.title === 'UpdatedAt') return `<span class="text-nowrap small text-muted"><i class="bi bi-clock-history me-1"></i>${plainText}</span>`;
        if (col.title === 'Created By' || col.title === 'Updated By') return `<div class="fw-bold text-dark d-flex align-items-center gap-2"><div class="avatar-sm bg-light text-primary rounded-circle d-flex align-items-center justify-content-center border" style="width:24px;height:24px;"><i class="bi bi-person-fill small"></i></div> <span style="min-width:150px; white-space: normal;">${plainText}</span></div>`;
        
        if (col.title === 'Aksi') {
          const isReceived = r.status_barang === 'Received';
          return `
            <div class="d-flex gap-2 justify-content-center">
              ${!isReceived ? `
                <button class="btn btn-sm action-btn btn-action-receive btn-receive shadow-sm" data-id="${r.id}" title="Terima Barang"><i class="bi bi-check-lg"></i></button>
              ` : `
                <div class="btn btn-sm action-btn bg-success-subtle text-success border-success-subtle pe-none"><i class="bi bi-check2-all"></i></div>
              `}
              <button class="btn btn-sm action-btn btn-action-pdf btn-pdf shadow-sm" data-npb="${r.npb}" title="Cetak PDF"><i class="bi bi-printer"></i></button>
              <button class="btn btn-sm action-btn btn-action-edit btn-edit shadow-sm" data-id="${r.id}" title="Edit"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm action-btn btn-action-delete btn-delete shadow-sm" data-id="${r.id}" title="Hapus"><i class="bi bi-trash"></i></button>
            </div>
          `;
        }

        return plainText !== '-' ? `<span class="text-dark fw-medium">${plainText}</span>` : '<span class="text-muted opacity-50">-</span>';
      }
    })),
    initComplete: function () {
      setupFilters(this.api());
      
      // Events Routing
      $('#inventoryTable')
      .on('click', '.btn-edit', function() { router.push(`/inventory-form/${$(this).data('id')}`); })
      .on('click', '.btn-pdf', function () { window.open(`${GUDANG_URL}/export-npb/${$(this).data('npb')}`, '_blank'); })
      .on('click', '.btn-delete', function() { deleteItem($(this).data('id')); })
      .on('click', '.btn-receive', function() { receiveItem($(this).data('id')); });
    }
  });
};

const receiveItem = async (id) => {
  const confirm = await Swal.fire({
    title: 'Terima Barang?',
    text: 'NPB akan digenerate dan status berubah menjadi Received',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    confirmButtonText: 'Ya, Terima',
    customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'rounded-pill px-4', cancelButton: 'rounded-pill px-4' }
  });

  if (!confirm.isConfirmed) return;
  try {
    await axios.put(`${GUDANG_URL}/receive/${id}`);
    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Barang sudah diterima', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-4' }});
    const res = await axios.get(GUDANG_URL);
    items.value = res.data;
    initDataTable(items.value);
  } catch (err) {
    Swal.fire({icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Error Server', customClass: { popup: 'rounded-4' }});
  }
};

const deleteItem = async (id) => {
  const res = await Swal.fire({
    title: 'Hapus Data?',
    text: "Data akan dihapus permanen.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Ya, Hapus',
    customClass: { popup: 'rounded-4 shadow-lg border-0', confirmButton: 'rounded-pill px-4', cancelButton: 'rounded-pill px-4' }
  });
  if (res.isConfirmed) {
    try {
      await axios.delete(`${GUDANG_URL}/${id}`);
      items.value = items.value.filter(i => i.id !== id);
      initDataTable(items.value);
      Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-4' } });
    } catch (err) {
      Swal.fire({icon: 'error', title: 'Gagal', text: 'Menghapus data gagal.', customClass: { popup: 'rounded-4' }});
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

const exportDates = ref({ start: new Date().toISOString().substr(0, 10), end: new Date().toISOString().substr(0, 10) });

const downloadExcel = async () => {
  if (!exportDates.value.start || !exportDates.value.end) {
    return Swal.fire({icon: 'info', title: 'Perhatian', text: 'Pilih rentang tanggal terlebih dahulu', customClass: { popup: 'rounded-4' }});
  }
  try {
    Swal.fire({
      title: 'Memproses...', text: 'Sedang menyiapkan file Excel', allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }, customClass: { popup: 'rounded-4' }
    });
    const response = await axios.get(`${GUDANG_URL}/export-date`, {
      params: { startDate: exportDates.value.start, endDate: exportDates.value.end }, responseType: 'blob'
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
    Swal.fire({icon: 'error', title: 'Gagal', text: 'Gagal mengunduh data Excel', customClass: { popup: 'rounded-4' }});
  }
};

const npbFilterDates = ref({ start: new Date().toISOString().substr(0, 10), end: new Date().toISOString().substr(0, 10) });
const receivedItems = ref([]);
const selectedNpbIds = ref([]);
const allReceivedChecked = computed(() => receivedItems.value.length > 0 && selectedNpbIds.value.length === receivedItems.value.length);

const toggleAllReceived = (e) => { selectedNpbIds.value = e.target.checked ? receivedItems.value.map(i => i.id) : []; };

const fetchReceivedByDate = async () => {
  if (!npbFilterDates.value.start || !npbFilterDates.value.end) {
    return Swal.fire({icon: 'info', title: 'Perhatian', text: 'Pilih rentang tanggal', customClass: { popup: 'rounded-4' }});
  }
  try {
    const res = await axios.get(`${GUDANG_URL}/received-by-date`, { params: { startDate: npbFilterDates.value.start, endDate: npbFilterDates.value.end } });
    receivedItems.value = res.data;
    selectedNpbIds.value = [];
    if (!receivedItems.value.length) {
      Swal.fire({icon: 'info', title: 'Kosong', text: 'Tidak ada barang Received pada tanggal tersebut', customClass: { popup: 'rounded-4' }});
    }
  } catch (err) { Swal.fire({icon: 'error', title: 'Gagal', text: 'Gagal mengambil data', customClass: { popup: 'rounded-4' }}); }
};

const cetakNpbMulti = async () => {
  try {
    const response = await axios.post(`${GUDANG_URL}/export-npb-multiple`, { ids: selectedNpbIds.value }, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    window.open(url, '_blank');
  } catch (err) { Swal.fire({icon: 'error', title: 'Gagal', text: 'Gagal mencetak NPB', customClass: { popup: 'rounded-4' }}); }
};
</script>

<style scoped>
/* =========================================
   GAYA UI MODERN (SAAS / DASHBOARD STYLE)
   ========================================= */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

.modern-bg { background-color: #f8fafc !important; }

/* [PERBAIKAN] Penambahan position dan z-index agar dropdown tidak ketutupan */
.glass-card { 
  background: rgba(255, 255, 255, 0.95); 
  backdrop-filter: blur(10px); 
  position: relative;
  z-index: 1010; /* Ubah dari 1050 menjadi 1010 */
}
.tracking-wide { letter-spacing: 0.05em; }
.hover-primary:hover { color: #0d6efd !important; }

/* Navigasi Pill Atas */
.sweep-nav-wrapper {
  position: relative; background-color: #ffffff; border-radius: 50px; 
  padding: 6px; display: flex; width: 100%; max-width: 500px; 
  border: 1px solid #e2e8f0; overflow: hidden;
}
.sweep-nav-wrapper .nav-link {
  position: relative; z-index: 2; color: #64748b; font-weight: 600; 
  font-size: 0.875rem; flex: 1; text-align: center; text-decoration: none; 
  padding: 10px 0; transition: color 0.3s ease; border: none; background: transparent;
}
.sweep-nav-wrapper .nav-link:hover { color: #0d6efd; }
.sweep-nav-wrapper .nav-link.active { color: #0d6efd !important; }
.sweep-indicator {
  position: absolute; height: calc(100% - 12px); width: calc(33.33% - 8px); 
  top: 6px; background: #f1f5f9; border-radius: 40px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1;
}

/* Tombol dan Input Modern */
.modern-btn { transition: all 0.2s ease; border: none; }
.modern-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2) !important; }
.btn-hover-scale { transition: transform 0.2s ease; }
.btn-hover-scale:hover { transform: scale(1.03); }
.btn-hover { transition: background-color 0.2s; }
.btn-hover:hover { background-color: #f1f5f9 !important; }

.modern-input-group { border: 1px solid #e2e8f0; }
.modern-input-group:focus-within { border-color: #86b7fe; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); }
.small-date { font-size: 0.875rem; font-weight: 500; }

/* Styling Tabel Modern */
.modern-table th, .modern-table td { padding: 1rem 1.25rem; vertical-align: middle; }
.table-light-custom { background-color: #f8fafc !important; }
.modern-table tbody tr { transition: background-color 0.2s ease; }
.modern-table tbody tr:hover { background-color: #f1f5f9 !important; }

/* Filter Bawah (Baris 2) */
.filter-btn { background-color: #f8fafc; transition: all 0.2s; }
.filter-btn:hover { background-color: #e2e8f0; }

/* =========================================
   STICKY ACTION COLUMN CSS
   ========================================= */
.sticky-col-end-header {
  position: sticky !important; right: 0; z-index: 1001 !important; 
  background-color: #f8fafc !important; box-shadow: -4px 0 8px -4px rgba(0, 0, 0, 0.1); 
}
tr.bg-white .sticky-col-end-header { background-color: #ffffff !important; }

:deep(.sticky-col-end) {
  position: sticky !important; right: 0; background-color: #ffffff !important;
  z-index: 1 !important; box-shadow: -4px 0 8px -4px rgba(0, 0, 0, 0.1); transition: background-color 0.2s ease;
}
:deep(tbody tr:hover .sticky-col-end) { background-color: #f1f5f9 !important; }

/* Elemen Pelengkap */
/* [PERBAIKAN] Penambahan batas max-height dan overflow-y agar tidak memanjang keluar batas */
.custom-dropdown { 
  min-width: 260px; 
  max-height: 400px;
  overflow-y: auto;
  z-index: 9999 !important; 
}
.filter-options-container { max-height: 200px; overflow-y: auto; }
.modern-switch .form-check-input { width: 2.5em; height: 1.25em; }

:deep(.table-responsive) { overflow-x: auto; min-height: 450px; }

/* Scrollbar Estetik */
:deep(.custom-scrollbar::-webkit-scrollbar) { width: 6px; height: 10px; }
:deep(.custom-scrollbar::-webkit-scrollbar-track) { background: transparent; }
:deep(.custom-scrollbar::-webkit-scrollbar-thumb) { background: #cbd5e1; border-radius: 10px; }
:deep(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { background: #94a3b8; }
.sticky-header { position: sticky; top: 0; z-index: 1000; }
.cursor-pointer { cursor: pointer; }

/* Meng-override komponen internal DataTable */
:deep(.dataTables_wrapper .dataTables_filter input) {
  border: 1px solid #e2e8f0; border-radius: 50rem; padding: 0.375rem 1rem;
  outline: none; font-size: 0.875rem; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
}
:deep(.dataTables_wrapper .dataTables_filter input:focus) {
  border-color: #86b7fe; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
:deep(.dataTables_wrapper .dataTables_length select) {
  border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.375rem 2rem 0.375rem 0.75rem;
}
</style>

<!-- GLOBAL STYLES KHUSUS COMPONENT DATATABLES -->
<style>
.badge-akses { background: #1e293b !important; color: #ffffff !important; font-weight: 600; font-size: 0.75rem; }
.badge-kategori { background: #f1f5f9 !important; color: #475569 !important; border: 1px solid #cbd5e1; font-weight: 600; font-size: 0.75rem;}
.badge-qty-low { background: #fee2e2 !important; color: #ef4444 !important; font-weight: 600; border: 1px solid #fecaca; }
.badge-qty-normal { background: #eff6ff !important; color: #3b82f6 !important; font-weight: 600; border: 1px solid #bfdbfe; }
.badge-status-received { background: #dcfce7 !important; color: #16a34a !important; font-weight: 600; border: 1px solid #bbf7d0; }
.badge-status-pending { background: #fef9c3 !important; color: #ca8a04 !important; font-weight: 600; border: 1px solid #fef08a; }

/* Tombol Aksi Bulat Modern */
.action-btn { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; border: none !important; transition: all 0.2s ease; }
.action-btn:hover { transform: scale(1.1); }
.btn-action-receive { background: #dcfce7 !important; color: #16a34a !important; }
.btn-action-receive:hover { background: #16a34a !important; color: #ffffff !important; }
.btn-action-pdf { background: #fee2e2 !important; color: #ef4444 !important; }
.btn-action-pdf:hover { background: #ef4444 !important; color: #ffffff !important; }
.btn-action-edit { background: #eff6ff !important; color: #3b82f6 !important; }
.btn-action-edit:hover { background: #3b82f6 !important; color: #ffffff !important; }
.btn-action-delete { background: #fee2e2 !important; color: #ef4444 !important; }
.btn-action-delete:hover { background: #ef4444 !important; color: #ffffff !important; }
</style>