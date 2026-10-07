<template>
  <div class="d-flex flex-column min-vh-100 modern-bg">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-4 main-content" :style="{
        marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        marginTop: '56px',
        minWidth: '0' 
      }">
        <div class="container-fluid max-w-custom mx-auto">
          
          <!-- Top Navigation Pill -->
          <div class="sweep-nav-wrapper mb-4 shadow-sm">
            <div class="sweep-indicator" style="left: calc(33.33% + 4px);"></div>
            <a href="/item-masuk" class="nav-link">Barang Masuk</a>
            <a href="/request" class="nav-link active">Penggunaan</a>
            <a href="/item-stok" class="nav-link">Stok</a>
          </div>

          <!-- Page Header -->
          <div class="row align-items-end mb-4 g-3">
            <div class="col">
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-2 small fw-medium">
                  <li class="breadcrumb-item"><a href="#" class="text-decoration-none text-muted hover-primary">Dashboard</a></li>
                  <li class="breadcrumb-item active text-primary">Data Penggunaan</li>
                </ol>
              </nav>
              <h3 class="fw-bolder text-dark m-0 d-flex align-items-center gap-2">
                <span class="bg-primary text-white p-2 rounded-3 fs-5 d-flex align-items-center justify-content-center shadow-sm">
                  <i class="bi bi-box-seam"></i>
                </span>
                Manajemen Penggunaan
              </h3>
              <p class="text-secondary small m-0 mt-2">Otorisasi dan pantau pemakaian barang produksi secara *real-time*.</p>
            </div>
            <div class="col-auto text-nowrap">
              <router-link to="/request-permintaan" class="btn btn-primary px-4 py-2 rounded-pill shadow-sm modern-btn d-flex align-items-center gap-2 fw-medium">
                <i class="bi bi-plus-lg fs-6"></i>
                <span class="d-none d-md-inline">Request Pemakaian</span>
              </router-link>
            </div>
          </div>

          <!-- Action Bar Card -->
          <div class="card border-0 shadow-sm rounded-4 mb-4 glass-card">
            <div class="card-body p-3">
              <div class="d-flex flex-wrap align-items-center gap-3">
                
                <!-- Column Configurator -->
                <div class="dropdown">
                  <button class="btn btn-light border-0 px-3 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2 text-dark fw-medium btn-hover" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-sliders text-primary"></i> Kolom
                  </button>
                  <ul class="dropdown-menu shadow-lg border-0 p-2 mt-2 custom-dropdown rounded-4">
                    <li v-for="(col, index) in columnDefs" :key="index">
                      <div v-if="col.title && col.title !== 'No' && col.title !== 'Aksi'" 
                           class="form-check form-switch dropdown-item rounded-3 py-2 d-flex align-items-center justify-content-between modern-switch">
                        <label class="form-check-label small cursor-pointer me-4 fw-medium text-secondary" :for="'col'+index">{{ col.title }}</label>
                        <input class="form-check-input cursor-pointer" type="checkbox" :id="'col'+index" :checked="col.visible" @change="toggleColumn(index)">
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div class="vr opacity-25"></div>
                
                <!-- Pending Badge -->
                <div class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-pill fw-semibold shadow-sm d-flex align-items-center gap-2">
                  <i class="bi bi-clock-history"></i>
                  {{ requests.filter(r => r.status_approval === 'Pending').length }} Menunggu
                </div>
                
                <!-- Date Filter & Export -->
                <div class="col-auto d-flex gap-2 ms-auto">
                  <div class="input-group modern-input-group shadow-sm rounded-pill overflow-hidden">
                    <span class="input-group-text bg-white border-0 text-primary px-3"><i class="bi bi-calendar-range"></i></span>
                    <input type="date" v-model="filterDate.start" class="form-control border-0 bg-white small-date" title="Tanggal Mulai">
                    <span class="input-group-text bg-white border-0 text-muted px-1">-</span>
                    <input type="date" v-model="filterDate.end" class="form-control border-0 bg-white small-date" title="Tanggal Akhir">
                    <button @click="exportExcel" class="btn btn-success d-flex align-items-center gap-2 px-4 fw-medium border-0">
                      <i class="bi bi-file-earmark-excel"></i> <span class="d-none d-lg-inline">Export</span>
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
          </div>

          <!-- Data Table Card -->
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white w-100">
            <table id="requestTable" class="table table-hover align-middle mb-0 w-100 text-nowrap modern-table">
              <thead class="sticky-header">
                <!-- Baris 1: Judul Kolom -->
                <tr class="table-light-custom">
                  <!-- [PERBAIKAN]: Tambah class dinamis 'sticky-action-header' untuk kolom Aksi -->
                  <th v-for="(col, index) in columnDefs" :key="'header'+index" 
                      class="py-3 px-4 text-secondary small fw-bold text-uppercase border-bottom border-light tracking-wide"
                      :class="{'d-none': !col.visible, 'sticky-action-header': col.title === 'Aksi'}">
                    {{ col.title }}
                  </th>
                </tr>
                
                <!-- Baris 2: Filter Dropdown -->
                <tr class="bg-white border-bottom border-light">
                  <th v-for="(col, index) in columnDefs" :key="'filter'+index" 
                      class="p-2 border-0" :class="{'d-none': !col.visible, 'sticky-action-header': col.title === 'Aksi'}">
                    
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
                    <div v-else class="text-center text-muted opacity-25 small">-</div>
                    
                  </th>
                </tr>
              </thead>
              <tbody class="border-top-0"></tbody>
            </table>
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
  { title: 'Spesifikasi', data: 'item.spesifikasi', visible: true, filterable: true },
  { title: 'Qty', data: 'qty_diminta', visible: true, filterable: true },
  { title: 'Pemohon', data: 'diminta_oleh', visible: true, filterable: true },
  { title: 'Dept', data: 'untuk_Dept', visible: true, filterable: true },
  { title: 'Status', data: 'status_approval', visible: true, filterable: true },
  { title: 'Approved By', data: 'approved_by', visible: true, filterable: true },
  { title: 'Dibuat', data: 'createdAt', visible: true, filterable: true },
  { title: 'Diupdate', data: 'updatedAt', visible: true, filterable: true },
  { title: 'Aksi', data: null, visible: true, filterable: false, className: 'sticky-action' } 
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
    
    const uniqueData = [];
    column.cells('', index).render('filter').unique().each(function(val) {
        if (val && val !== '-' && val !== 'Selesai') {
            uniqueData.push(val);
        }
    });
    
    // ==========================================
    // [PERBAIKAN PENGURUTAN / SORTING FILTER]
    // ==========================================
    if (colDef.title === 'Tgl Minta') {
        // Urutkan dari Tanggal Terbaru di atas (Descending)
        uniqueData.sort((a, b) => {
            const parseDate = (dateStr) => {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                }
                return 0;
            };
            return parseDate(b) - parseDate(a); // B - A = Descending
        });
    } else if (colDef.title === 'Dibuat' || colDef.title === 'Diupdate') {
        // Urutkan Datetime Terbaru di atas (Descending)
        uniqueData.sort((a, b) => {
            const parseDateTime = (str) => {
                const datePart = str.split(', ')[0];
                if (!datePart) return 0;
                const parts = datePart.split('/');
                if (parts.length === 3) {
                    return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                }
                return 0;
            };
            return parseDateTime(b) - parseDateTime(a);
        });
    } else {
        // Urutkan Abjad Biasa (A-Z) untuk kolom teks lainnya
        uniqueData.sort();
    }
    // ==========================================

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
  if ($.fn.DataTable.isDataTable('#requestTable')) $('#requestTable').DataTable().destroy();

  table = $('#requestTable').DataTable({
    data,
    autoWidth: false,
    orderCellsTop: true,
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
        let plainText = d ? String(d).trim() : '-';
        if (col.title === 'No') plainText = String(meta.row + 1);
        else if (col.title === 'Tgl Minta') plainText = d ? new Date(d).toLocaleDateString('id-ID') : '-';
        else if (col.title === 'Qty') plainText = `${d} ${r.item?.unit || ''}`.trim();
        else if (col.title === 'Dibuat' || col.title === 'Diupdate') plainText = d ? new Date(d).toLocaleString('id-ID') : '-';
        else if (col.title === 'Aksi') plainText = r.status_approval === 'Pending' ? 'Pending' : 'Selesai';
        else if (col.title === 'Approved By') plainText = d || '-';
        else if (col.title === 'Status') plainText = d || '-';
        else if (col.title === 'Barang' || col.title === 'Spesifikasi' || col.title === 'Pemohon' || col.title === 'Dept') plainText = d || '-';

        if (type === 'filter' || type === 'sort') {
            return plainText;
        }

        if (col.title === 'No') return `<span class="text-muted fw-medium">${plainText}</span>`;
        if (col.title === 'Tgl Minta') return d ? `<div class="d-flex align-items-center text-dark"><i class="bi bi-calendar2 text-muted me-2"></i> ${plainText}</div>` : '-';
        if (col.title === 'Barang') return `<span class="fw-bold text-dark">${plainText}</span>`;
        if (col.title === 'Spesifikasi') return `<span class="text-secondary">${plainText}</span>`;
        if (col.title === 'Qty') return `<span class="fw-bold text-dark">${d}</span> <span class="badge bg-light text-muted border ms-1">${r.item?.unit || ''}</span>`;
        if (col.title === 'Status') {
          const badgeClass = d === 'Approved' ? 'bg-success-subtle text-success border-success-subtle' : 
                             d === 'Rejected' ? 'bg-danger-subtle text-danger border-danger-subtle' : 
                             'bg-warning-subtle text-warning-emphasis border-warning-subtle';
          const icon = d === 'Approved' ? 'check-circle-fill' : d === 'Rejected' ? 'x-circle-fill' : 'clock-fill';
          return `<span class="badge ${badgeClass} border rounded-pill px-3 py-2 fw-semibold shadow-sm d-inline-flex align-items-center gap-1"><i class="bi bi-${icon}"></i> ${plainText}</span>`;
        }
        if (col.title === 'Approved By') return `<div class="d-flex align-items-center gap-2"><div class="avatar-sm bg-light text-primary rounded-circle d-flex align-items-center justify-content-center border" style="width:24px;height:24px;"><i class="bi bi-person-fill small"></i></div> <span class="fw-medium text-dark">${plainText}</span></div>`;
        if (col.title === 'Dibuat' || col.title === 'Diupdate') return `<span class="text-muted small">${plainText}</span>`;
        if (col.title === 'Aksi') {
          return r.status_approval === 'Pending' 
            ? `<div class="d-flex gap-2">
                <button class="btn btn-sm btn-success rounded-circle shadow-sm btn-approve d-flex align-items-center justify-content-center action-btn" data-id="${r.id}" title="Setujui"><i class="bi bi-check-lg"></i></button>
                <button class="btn btn-sm btn-danger rounded-circle shadow-sm btn-reject d-flex align-items-center justify-content-center action-btn" data-id="${r.id}" title="Tolak"><i class="bi bi-x-lg"></i></button>
              </div>`
            : `<span class="badge bg-light text-secondary border px-3 py-2 rounded-pill"><i class="bi bi-check-all me-1"></i>Selesai</span>`;
        }
        
        return plainText !== '-' ? `<span class="text-dark">${plainText}</span>` : '-';
      }
    })),
    initComplete: function () {
      setupFilters(this.api());
    }
  });

  $('#requestTable').off('click', '.btn-approve').on('click', '.btn-approve', function() { handleAction($(this).data('id'), 'Approved'); });
  $('#requestTable').off('click', '.btn-reject').on('click', '.btn-reject', function() { handleAction($(this).data('id'), 'Rejected'); });
};

const handleAction = async (id, status) => {
  const result = await Swal.fire({
    title: 'Konfirmasi Tindakan',
    text: `Anda yakin ingin mengubah status menjadi ${status}?`,
    icon: status === 'Approved' ? 'question' : 'warning',
    showCancelButton: true,
    confirmButtonColor: status === 'Approved' ? '#198754' : '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Lanjutkan',
    cancelButtonText: 'Batal',
    customClass: {
      popup: 'rounded-4 shadow-lg border-0',
      confirmButton: 'rounded-pill px-4',
      cancelButton: 'rounded-pill px-4'
    }
  });

  if (result.isConfirmed) {
    try {
      await axios.patch(`${REQUEST_URL}/${id}/status`, { status_approval: status, approved_by: user.value.name });
      Swal.fire({
        title: 'Berhasil!',
        text: 'Status permintaan telah diperbarui.',
        icon: 'success',
        customClass: { popup: 'rounded-4' }
      });
      loadData();
    } catch (err) {
      Swal.fire('Gagal', 'Terjadi kesalahan pada sistem', 'error');
    }
  }
};

const loadData = async () => {
  try {
    const res = await axios.get(REQUEST_URL);
    requests.value = res.data;
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

const filterDate = ref({
  start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substr(0, 10),
  end: new Date().toISOString().substr(0, 10)
});

const exportExcel = async () => {
  if (!filterDate.value.start || !filterDate.value.end) {
    return Swal.fire('Perhatian', 'Harap isi kedua rentang tanggal', 'warning');
  }

  try {
    Swal.fire({
      title: 'Menyiapkan Data',
      text: 'Mohon tunggu sejenak...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: 'rounded-4' }
    });

    const response = await axios.get(`${REQUEST_URL}/export/excel`, {
      params: { startDate: filterDate.value.start, endDate: filterDate.value.end },
      responseType: 'blob'
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
/* =========================================
   GAYA UI MODERN (SAAS / DASHBOARD STYLE)
   ========================================= */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.modern-bg {
  background-color: #f8fafc !important; 
}

/* [PERBAIKAN] Penambahan position dan z-index agar dropdown tidak ketutupan */
.glass-card { 
  background: rgba(255, 255, 255, 0.95); 
  backdrop-filter: blur(10px); 
  position: relative;
  z-index: 1010; /* Ubah dari 1050 menjadi 1010 */
}

.tracking-wide {
  letter-spacing: 0.05em;
}

.hover-primary:hover {
  color: #0d6efd !important;
}

/* Navigasi Pill Atas */
.sweep-nav-wrapper {
  position: relative; 
  background-color: #ffffff; 
  border-radius: 50px; 
  padding: 6px; 
  display: flex; 
  width: 100%; 
  max-width: 500px; 
  border: 1px solid #e2e8f0; 
  overflow: hidden;
}
.sweep-nav-wrapper .nav-link {
  position: relative; 
  z-index: 2; 
  color: #64748b; 
  font-weight: 600; 
  font-size: 0.875rem; 
  flex: 1; 
  text-align: center; 
  text-decoration: none; 
  padding: 10px 0;
  transition: color 0.3s ease;
}
.sweep-nav-wrapper .nav-link:hover { color: #0d6efd; }
.sweep-nav-wrapper .nav-link.active { color: #0d6efd !important; }
.sweep-indicator {
  position: absolute; 
  height: calc(100% - 12px); 
  width: calc(33.33% - 8px); 
  top: 6px; 
  background: #f1f5f9; 
  border-radius: 40px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); 
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
  z-index: 1;
}

/* Tombol dan Input Modern */
.modern-btn {
  transition: all 0.2s ease;
}
.modern-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2) !important;
}

.btn-hover {
  transition: background-color 0.2s;
}
.btn-hover:hover {
  background-color: #f1f5f9 !important;
}

.modern-input-group {
  border: 1px solid #e2e8f0;
}
.modern-input-group:focus-within {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
.small-date {
  font-size: 0.875rem;
  color: #475569;
}

/* Styling Tabel Modern */
.modern-table th, .modern-table td {
  padding: 1rem 1.25rem;
  vertical-align: middle;
}
.table-light-custom {
  background-color: #f8fafc !important;
}
.modern-table tbody tr {
  transition: background-color 0.2s ease;
}
.modern-table tbody tr:hover {
  background-color: #f1f5f9 !important;
}

/* Filter Bawah (Baris 2) */
.filter-btn {
  background-color: #f8fafc;
  transition: all 0.2s;
}
.filter-btn:hover {
  background-color: #e2e8f0;
}

/* Tombol Action (Approve/Reject) */
.action-btn {
  width: 32px;
  height: 32px;
  transition: all 0.2s;
}
.action-btn:hover {
  transform: scale(1.1);
}

/* =========================================
   STICKY ACTION COLUMN CSS
   ========================================= */
.sticky-action-header {
  position: sticky !important;
  right: 0;
  z-index: 1001 !important;
  background-color: #f8fafc !important;
  box-shadow: -4px 0 8px -4px rgba(0, 0, 0, 0.1); 
}
tr.bg-white .sticky-action-header {
  background-color: #ffffff !important; 
}

:deep(.sticky-action) {
  position: sticky !important;
  right: 0;
  background-color: #ffffff !important;
  z-index: 1 !important;
  box-shadow: -4px 0 8px -4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease;
}
:deep(tbody tr:hover .sticky-action) {
  background-color: #f1f5f9 !important;
}

/* Elemen Pelengkap */
/* [PERBAIKAN] Penambahan batas max-height dan overflow-y agar tidak memanjang keluar batas */
.custom-dropdown { 
  min-width: 260px; 
  max-height: 400px;
  overflow-y: auto;
  z-index: 9999 !important; 
}
.filter-options-container { 
  max-height: 200px; 
  overflow-y: auto; 
}
.modern-switch .form-check-input {
  width: 2.5em;
  height: 1.25em;
}

:deep(.table-responsive) {
  overflow-x: auto;
  min-height: 450px; 
}

/* Scrollbar Estetik */
:deep(.custom-scrollbar::-webkit-scrollbar) { 
  width: 6px; 
  height: 10px; 
}
:deep(.custom-scrollbar::-webkit-scrollbar-track) {
  background: transparent;
}
:deep(.custom-scrollbar::-webkit-scrollbar-thumb) { 
  background: #cbd5e1; 
  border-radius: 10px; 
}
:deep(.custom-scrollbar::-webkit-scrollbar-thumb:hover) { 
  background: #94a3b8; 
}
.sticky-header { 
  position: sticky; 
  top: 0; 
  z-index: 1000; 
}
.cursor-pointer { cursor: pointer; }

/* Meng-override komponen internal DataTable agar nyambung dengan tema */
:deep(.dataTables_wrapper .dataTables_filter input) {
  border: 1px solid #e2e8f0;
  border-radius: 50rem;
  padding: 0.375rem 1rem;
  outline: none;
  font-size: 0.875rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
}
:deep(.dataTables_wrapper .dataTables_filter input:focus) {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
:deep(.dataTables_wrapper .dataTables_length select) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.375rem 2rem 0.375rem 0.75rem;
}
</style>