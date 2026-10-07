<template>
  <div class="d-flex flex-column min-vh-100 bg-white">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-4 main-content" :style="mainStyle">
        <div class="container-fluid">

          <div class="sweep-nav-wrapper mb-4">
            <div class="sweep-indicator" style="left: calc(66.66% + 2px);"></div>
            <a href="/item-masuk" class="nav-link text-decoration-none">Barang Masuk</a>
            <a href="/request" class="nav-link text-decoration-none">Penggunaan</a>
            <a href="/item-stok" class="nav-link active text-decoration-none">Stok</a>
          </div>

          <div class="row g-3 mb-4 align-items-center">
            <div class="col-md-6">
              <h3 class="fw-bold text-dark m-0">📦 Manajemen Stok Item</h3>
              <p class="text-muted small m-0">Monitoring stok otomatis untuk efisiensi produksi PT. TLSI.</p>
            </div>

            <div class="col-md-6 d-flex flex-wrap justify-content-md-end gap-2">
              <div class="filter-switch-wrapper shadow-sm border">
                <input type="checkbox" class="btn-check" id="filterLowStock" @change="toggleLowStockFilter" autocomplete="off">
                <label class="btn btn-filter-low d-flex align-items-center gap-2" for="filterLowStock">
                  <i class="bi bi-exclamation-octagon-fill"></i>
                  <span>Stok Kritis</span>
                </label>
              </div>

              <div class="dropdown">
                <button class="btn btn-modern-action btn-excel dropdown-toggle shadow-sm" type="button" data-bs-toggle="dropdown">
                  <i class="bi bi-file-earmark-spreadsheet-fill"></i> Excel
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 p-2 rounded-3">
                  <li><a class="dropdown-item rounded-2 mb-1" href="#" @click.prevent="downloadExcel('all')">Ekspor Semua Data</a></li>
                  <li><a class="dropdown-item rounded-2 text-danger fw-bold" href="#" @click.prevent="downloadExcel('low')">Ekspor Stok Kritis</a></li>
                </ul>
              </div>

              <div class="dropdown">
                <button class="btn btn-modern-action btn-pdf dropdown-toggle shadow-sm" type="button" data-bs-toggle="dropdown">
                  <i class="bi bi-file-earmark-pdf-fill"></i> Dokumen PDF
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 p-2 rounded-4 pdf-dropdown-menu">
                  <li class="dropdown-section-label">Laporan</li>
                  <li>
                    <a class="dropdown-item pdf-menu-item rounded-3 mb-1" href="#" @click.prevent="exportToPDF">
                      <span class="pdf-menu-icon icon-neutral"><i class="bi bi-file-earmark-pdf-fill"></i></span>
                      <span class="pdf-menu-text">
                        <span class="pdf-menu-title">Simpan Laporan Stok</span>
                        <span class="pdf-menu-desc">Unduh seluruh data stok dalam format PDF</span>
                      </span>
                    </a>
                  </li>

                  <li><hr class="dropdown-divider my-2"></li>
                  <li class="dropdown-section-label">Cetak Memo / PO</li>

                  <li>
                    <a class="dropdown-item pdf-menu-item rounded-3 mb-1" href="#" @click.prevent="openMemoModal">
                      <span class="pdf-menu-icon icon-warning"><i class="bi bi-exclamation-octagon-fill"></i></span>
                      <span class="pdf-menu-text">
                        <span class="pdf-menu-title text-primary">Cetak PO Stok TLSI</span>
                        <span class="pdf-menu-desc">Buat memo pembelian untuk barang stok kritis</span>
                      </span>
                      <i class="bi bi-chevron-right pdf-menu-arrow"></i>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item pdf-menu-item rounded-3" href="#" @click.prevent="openMemoModalLTX">
                      <span class="pdf-menu-icon icon-primary"><i class="bi bi-file-earmark-text-fill"></i></span>
                      <span class="pdf-menu-text">
                        <span class="pdf-menu-title text-primary">Cetak PO Memo LTX</span>
                        <span class="pdf-menu-desc">Buat memo pembelian dengan format LTX</span>
                      </span>
                      <i class="bi bi-chevron-right pdf-menu-arrow"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ====== TAB KATEGORI UTAMA ====== -->
          <div class="category-tabs mb-3">
            <button
              v-for="kat in mainCategories"
              :key="kat"
              type="button"
              class="cat-tab-btn"
              :class="{ active: activeCategory === kat }"
              @click="selectMainCategory(kat)"
            >
              <i class="bi" :class="categoryIcon(kat)"></i>
              <span>{{ kat }}</span>
              <span class="cat-count">{{ categoryCount(kat) }}</span>
            </button>
          </div>

          <div class="card border-0 shadow-sm rounded-4">
            <div class="table-responsive bg-white custom-scrollbar table-wrapper-rounded">
              <table id="stokTable" class="table table-hover align-middle mb-0 w-100 text-nowrap">
                <thead class="bg-light sticky-header">
                  <tr>
                    <th v-for="col in columnDefs" :key="col.title" class="py-3 px-4 text-muted small fw-bold text-uppercase border-bottom">
                      {{ col.title }}
                    </th>
                  </tr>
                  <tr class="bg-white">
                    <th v-for="(col, index) in columnDefs" :key="'filter'+index" class="p-2 border-bottom">
                      <div v-if="col.filterable" class="dropdown w-100">
                        <button class="btn btn-sm btn-light w-100 dropdown-toggle text-start d-flex justify-content-between align-items-center shadow-none border filter-trigger-btn" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                          <span class="text-truncate small" :id="'label-filter-' + index">Semua</span>
                        </button>
                        <div class="dropdown-menu p-3 shadow-lg border-0 mt-1 filter-dropdown-panel" style="min-width: 260px; max-height: 320px; overflow-y: auto;">
                          <div class="input-group input-group-sm mb-2">
                            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                            <input type="text" class="form-control border-start-0 filter-search-input" placeholder="Cari nilai..." :data-index="index">
                          </div>
                          <div :id="'container-filter-' + index" class="filter-options-container"></div>
                          <div class="dropdown-divider"></div>
                          <button class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center btn-reset-filter fw-bold" :data-index="index">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>RESET
                          </button>
                        </div>
                      </div>
                      <div v-else class="text-center"><span class="text-muted opacity-25 small">-</span></div>
                    </th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ====================== MODAL MEMO ====================== -->
        <div v-if="showMemoModal" class="modal-backdrop fade show"></div>
        <div class="modal fade mt-4" :class="{ show: showMemoModal, 'd-block': showMemoModal }" tabindex="-1">
          <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 memo-modal-content">

              <div class="modal-header memo-modal-header rounded-top-4">
                <div class="d-flex align-items-center gap-3">
                  <div class="memo-header-icon">
                    <i class="bi bi-file-earmark-text-fill"></i>
                  </div>
                  <div>
                    <h5 class="modal-title fw-bold mb-0 text-white">Form Permintaan Memo Barang</h5>
                    <small class="text-white">{{ memoType === 'ltx' ? 'Tipe Memo: LTX' : 'Tipe Memo: TLSI' }}</small>
                  </div>
                </div>
                <button type="button" class="btn-close btn-close-white" @click="closeMemoModal"></button>
              </div>

              <div class="modal-body p-4 memo-modal-body">

                <!-- ===== INFO FORM ===== -->
                <div class="memo-info-card mb-4">
                  <div class="memo-info-card-title">
                    <i class="bi bi-info-circle-fill"></i> Informasi Memo
                  </div>
                  <div class="row g-3">
                    <div class="col-md-6 col-lg-4">
                      <label class="memo-label">Nomor Memo</label>
                      <input v-model="memoForm.no_memo" type="text" class="form-control memo-input fw-bold bg-light" readonly>
                    </div>
                    <div class="col-md-6 col-lg-4">
                      <label class="memo-label">Attention</label>
                      <input v-model="memoForm.attention" type="text" class="form-control memo-input">
                    </div>
                    <div class="col-md-6 col-lg-4">
                      <label class="memo-label">Nama Peminta</label>
                      <input v-model="memoForm.nama_peminta" type="text" class="form-control memo-input">
                    </div>
                    <div class="col-md-6 col-lg-4">
                      <label class="memo-label">Kabag</label>
                      <input v-model="memoForm.nama_kabag" type="text" class="form-control memo-input">
                    </div>
                    <div class="col-md-6 col-lg-4">
                      <label class="memo-label">Checker</label>
                      <input v-model="memoForm.nama_checker" type="text" class="form-control memo-input">
                    </div>
                    <div class="col-md-6 col-lg-4">
                      <label class="memo-label">Nama Pimpinan</label>
                      <input v-model="memoForm.nama_pemimpin" type="text" class="form-control memo-input">
                    </div>
                  </div>
                </div>

                <!-- ===== TAB KATEGORI DI DALAM MODAL ===== -->
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <div class="memo-category-tabs">
                    <button
                      v-for="kat in availableCategories"
                      :key="kat"
                      type="button"
                      class="memo-cat-btn"
                      :class="{ active: selectedCategory === kat }"
                      @click="selectedCategory = kat"
                    >
                      {{ kat }}
                      <span class="memo-cat-badge">{{ categoryItemCount(kat) }}</span>
                    </button>
                  </div>

                  <div class="memo-selected-info">
                    <i class="bi bi-check2-square text-primary"></i>
                    <span class="fw-bold">{{ selectedRowCount }}</span> dari {{ filteredMemoItems.length }} item dipilih
                  </div>
                </div>

                <!-- ===== SEARCH + FILTER MULTI-CHECKBOX ===== -->
                <div class="memo-search-bar mb-3">
                  <div class="search-box flex-grow-1">
                    <i class="bi bi-search"></i>
                    <input
                      type="text"
                      v-model="memoSearchQuery"
                      class="form-control"
                      placeholder="Cari nama item atau spesifikasi..."
                    >
                    <button v-if="memoSearchQuery" class="btn-clear-search" @click="memoSearchQuery = ''">
                      <i class="bi bi-x-circle-fill"></i>
                    </button>
                  </div>

                  <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm fw-bold dropdown-toggle filter-pill-btn" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                      <i class="bi bi-funnel-fill me-1"></i> Filter Item
                      <span v-if="checkedItemSpecs.length" class="filter-count-badge">{{ checkedItemSpecs.length }}</span>
                    </button>
                    <div class="dropdown-menu p-3 shadow-lg border-0 mt-2 filter-dropdown-panel" style="min-width: 300px; max-height: 340px; overflow-y: auto;">
                      <div class="input-group input-group-sm mb-2">
                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-search small text-muted"></i></span>
                        <input type="text" class="form-control border-start-0" placeholder="Cari opsi..." v-model="checklistSearch">
                      </div>
                      <div class="filter-options-container">
                        <div v-if="uniqueItemSpecOptions.length === 0" class="text-muted small text-center py-3">
                          Tidak ada data
                        </div>
                        <div
                          v-for="opt in filteredChecklistOptions"
                          :key="opt"
                          class="form-check mb-1"
                        >
                          <input
                            class="form-check-input"
                            type="checkbox"
                            :id="'spec-' + opt"
                            :value="opt"
                            v-model="checkedItemSpecs"
                          >
                          <label class="form-check-label small text-dark" :for="'spec-' + opt">{{ opt }}</label>
                        </div>
                      </div>
                      <div class="dropdown-divider"></div>
                      <button class="btn btn-link btn-sm text-decoration-none p-0 w-100 text-center fw-bold" @click="checkedItemSpecs = []">
                        <i class="bi bi-arrow-counterclockwise me-1"></i>RESET FILTER
                      </button>
                    </div>
                  </div>

                  <button v-if="checkedItemSpecs.length || memoSearchQuery" class="btn btn-sm btn-light fw-bold border" @click="clearMemoFilters">
                    <i class="bi bi-x-lg me-1"></i> Bersihkan
                  </button>
                </div>

                <!-- ===== Active filter chips ===== -->
                <div v-if="checkedItemSpecs.length" class="mb-3 d-flex flex-wrap gap-2">
                  <span v-for="opt in checkedItemSpecs" :key="'chip-'+opt" class="filter-chip">
                    {{ opt }}
                    <i class="bi bi-x" @click="removeChecklistOption(opt)"></i>
                  </span>
                </div>

                <!-- ===== TABEL ITEM ===== -->
                <div class="card border-0 shadow-sm rounded-3 memo-table-card">
                  <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0 memo-table">
                      <thead>
                        <tr class="small text-uppercase">
                          <th style="width:40px;">
                            <input type="checkbox" class="form-check-input" :checked="allVisibleSelected" @change="toggleSelectAllVisible($event)">
                          </th>
                          <th>Kategori</th>
                          <th>Nama Item & Spesifikasi</th>
                          <th class="text-center">Min Stok</th>
                          <th class="text-center">Max Stok</th>
                          <th class="text-center">Sisa Stok</th>
                          <th class="text-center">Max Order</th>
                          <th class="text-center">Qty Diminta</th>
                          <th class="text-center">Untuk Apa</th>
                          <th class="text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="displayedMemoItems.length === 0">
                          <td colspan="9" class="text-center text-muted py-5">
                            <i class="bi bi-inbox display-6 d-block mb-2 opacity-50"></i>
                            Tidak ada item yang sesuai dengan pencarian / filter.
                          </td>
                        </tr>
                        <tr v-for="item in displayedMemoItems" :key="item.akses_kode" :class="{ 'row-selected': item._selected }">
                          <td>
                            <input type="checkbox" class="form-check-input" v-model="item._selected">
                          </td>
                          <td><span class="badge bg-secondary">{{ item.kategori }}</span></td>
                          <td>
                            <div class="fw-bold text-primary">{{ item.akses_kode }}</div>
                            <small class="text-muted">{{ item.item_name }}</small>
                            <small class="text-muted d-block">{{ item.spesifikasi }}</small>
                          </td>
                          <td class="text-center fw-bold text-secondary">{{ item.min_qty }}</td>
                          <td class="text-center fw-bold text-secondary">{{ item.max_qty }}</td>
                          <td class="text-center text-danger fw-bold">{{ item.stok_akhir }} {{ item.unit }}</td>
                          <td>
                            <input type="number" v-model="item.max_stock" class="form-control form-control-sm text-center" readonly>
                          </td>
                          <td>
                            <input type="number" v-model="item.qty_permintaan" class="form-control form-control-sm text-center">
                          </td>
                          <td>
                            <input type="text" v-model="item.untuk_apa" class="form-control form-control-sm text-center">
                          </td>
                          <td class="text-center">
                            <button @click="removeItemFromMemo(item)" class="btn btn-sm btn-outline-danger border-0">
                              <i class="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              <div class="modal-footer border-0 p-4 pt-3 memo-modal-footer rounded-bottom-4">
                <div class="text-muted small me-auto">
                  <i class="bi bi-check2-square text-primary me-1"></i>
                  <strong>{{ selectedRowCount }}</strong> item siap dicetak
                </div>
                <button type="button" class="btn btn-secondary rounded-pill px-4" @click="closeMemoModal">Batal</button>
                <button type="button" class="btn btn-primary rounded-pill px-5 fw-bold shadow" @click="submitMemo">
                  <i class="bi bi-printer-fill me-2"></i> Simpan & Cetak Memo
                </button>
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
import { ref, onMounted, nextTick, computed, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';
import $ from 'jquery';
import 'datatables.net-bs5';
import Swal from 'sweetalert2';
import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';
import { useRouter } from 'vue-router';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const router = useRouter();
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
let table = null;
// 🔥 FIX: sebelumnya variabel biasa (let), jadi Vue tidak pernah tahu datanya berubah ->
// tab kategori "All" macet di angka 0 walau tabel sudah terisi. Sekarang pakai ref agar reaktif.
const rawStockData = ref([]);

const selectedCategory = ref('All');
const memoType = ref('tlsi');

const mainStyle = computed(() => ({
  marginLeft: sidebarOpen.value && windowWidth.value >= 768 ? '16rem' : '0',
  transition: 'margin-left 0.3s ease',
  marginTop: '56px',
  backgroundColor: '#ffffff'
}));

// ============== KATEGORI UTAMA (TABEL STOK) ==============
const activeCategory = ref('All');

const mainCategories = computed(() => {
  const cats = rawStockData.value.map(r => r.kategori).filter(Boolean);
  return ['All', ...new Set(cats)];
});

const categoryCount = (kat) => {
  if (kat === 'All') return rawStockData.value.length;
  return rawStockData.value.filter(r => r.kategori === kat).length;
};

const categoryIcon = (kat) => {
  const map = {
    'All': 'bi-grid-fill',
    'Mekanik': 'bi-gear-fill',
    'Office': 'bi-briefcase-fill',
    'Produksi': 'bi-tools',
    'Umum': 'bi-box-seam-fill'
  };
  return map[kat] || 'bi-tag-fill';
};

const selectMainCategory = (kat) => {
  activeCategory.value = kat;
  if (!table) return;
  const colIndex = columnDefs.findIndex(c => c.data === 'kategori');
  setColumnFilter(colIndex, kat === 'All' ? [] : [kat]);
};

// 🔥 DEFINISI KOLOM - DIUBAH MENJADI SISA STOK, MIN STOK, DAN MAX STOK
const columnDefs = [
  { title: 'No', data: null, filterable: false },
  { title: 'Akses', data: 'akses_code', filterable: true },
  { title: 'Kategori', data: 'kategori', filterable: true },
  { title: 'Item Name', data: 'item_name', filterable: true },
  { title: 'Spesifikasi', data: 'spesifikasi', filterable: true },
  { title: 'Unit', data: 'unit', filterable: true },
  { title: 'Qty awal', data: 'qty_awal_pertama', filterable: true },
  { title: 'Pemasukan', data: 'total_pemasukan', filterable: true },
  { title: 'Pemakaian', data: 'total_pemakaian', filterable: true },
  { title: 'Min Stok', data: 'min_qty', filterable: true },
  { title: 'Max Stok', data: 'max_qty', filterable: true },
  { title: 'Sisa Stok', data: 'stok_akhir', filterable: true },
];

// ============== FILTER STATE (checkbox multi-select per kolom, saling terhubung) ==============
// key = index kolom, value = array string nilai yang dicentang
const activeFilters = ref({});
const lowStockActive = ref(false);
let searchPredicatePushed = false;

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const slugifyForId = (idx, val) =>
  `filter-opt-${idx}-` + String(val).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `filter-opt-${idx}-empty`;

// Baris yang lolos SEMUA filter aktif kecuali kolom `excludeIdx` (untuk cascading options)
// dan opsional lolos filter Stok Kritis juga, supaya opsi yang ditawarkan selalu relevan.
const getRowsExcludingColumn = (excludeIdx) => {
  return rawStockData.value.filter((row) => {
    if (lowStockActive.value) {
      const sisaStok = parseFloat(row.stok_akhir) || 0;
      const minStok = parseFloat(row.min_qty) || 0;
      if (!(minStok > 0 && sisaStok <= minStok)) return false;
    }
    return Object.entries(activeFilters.value).every(([idx, vals]) => {
      if (Number(idx) === excludeIdx) return true;
      if (!vals || vals.length === 0) return true;
      const colDef = columnDefs[idx];
      return vals.includes(String(row[colDef.data]));
    });
  });
};

// Bangun ulang daftar checkbox utk 1 kolom, berdasarkan data yang masih relevan (cascading)
const renderFilterOptions = (index) => {
  const colDef = columnDefs[index];
  if (!colDef || !colDef.filterable) return;
  const container = $(`#container-filter-${index}`);
  const rows = getRowsExcludingColumn(index);

  const uniqueVals = [...new Set(rows.map((r) => r[colDef.data]).filter((v) => v !== null && v !== undefined && v !== ''))]
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  const checkedSet = new Set(activeFilters.value[index] || []);

  if (uniqueVals.length === 0) {
    container.html('<div class="text-muted small text-center py-2">Tidak ada opsi untuk kombinasi filter ini</div>');
    return;
  }

  container.html(
    uniqueVals
      .map((v) => {
        const id = slugifyForId(index, v);
        const safe = escapeHtml(v);
        const isChecked = checkedSet.has(String(v)) ? 'checked' : '';
        return `
          <div class="form-check mb-1">
            <input class="form-check-input filter-checkbox" type="checkbox" id="${id}" value="${safe}" data-index="${index}" ${isChecked}>
            <label class="form-check-label small text-dark" for="${id}">${safe}</label>
          </div>`;
      })
      .join('')
  );
};

// Bangun ulang SEMUA dropdown filter kolom, supaya opsi antar kolom saling terhubung (cascading)
const refreshAllFilterOptions = () => {
  try {
    columnDefs.forEach((col, idx) => {
      if (col.filterable) renderFilterOptions(idx);
    });
    // Reapply pencarian teks yang sedang aktif di tiap dropdown (kalau ada)
    $('.filter-search-input').each(function () {
      if ($(this).val()) $(this).trigger('keyup');
    });
  } catch (err) {
    // Kalau ada yang gagal, tampilkan di console daripada dropdown diam-diam kosong tanpa penjelasan
    console.error('Gagal membangun opsi filter checkbox:', err);
  }
};

const updateFilterLabel = (idx) => {
  const count = (activeFilters.value[idx] || []).length;
  $(`#label-filter-${idx}`).text(count > 0 ? `${count} Terpilih` : 'Semua');
};

// Set/replace nilai filter untuk 1 kolom sekaligus, lalu redraw + refresh semua dropdown lain
const setColumnFilter = (idx, values) => {
  activeFilters.value = { ...activeFilters.value, [idx]: [...values] };
  if (!table) return;
  table.draw();
  refreshAllFilterOptions();
  updateFilterLabel(idx);

  const kategoriIdx = columnDefs.findIndex((c) => c.data === 'kategori');
  if (Number(idx) === kategoriIdx) {
    const vals = activeFilters.value[idx] || [];
    activeCategory.value = vals.length === 1 ? vals[0] : 'All';
  }
};

const initDataTable = (data) => {
  rawStockData.value = data;
  activeFilters.value = {};
  lowStockActive.value = false;

  if ($.fn.DataTable.isDataTable('#stokTable')) $('#stokTable').DataTable().destroy();

  table = $('#stokTable').DataTable({
    data,
    pageLength: 25,
    // 🔥 FIX UTAMA: thead kita punya 2 baris (judul + filter). Tanpa orderCellsTop:true,
    // DataTables memasang listener SORT ke baris TERAKHIR thead (baris filter),
    // makanya klik checkbox/dropdown filter ikut ke-detect sebagai klik sort A-Z.
    orderCellsTop: true,
    columns: [
      { data: null, render: (d, t, r, meta) => meta.row + 1 },
      { data: 'akses_code', render: d => `<span class="badge bg-secondary">${d || '-'}</span>` },
      { data: 'kategori', render: d => `<span class="badge bg-info-subtle text-info-emphasis fw-bold">${d || '-'}</span>` },
      { data: 'item_name', render: d => `<span class="fw-bold">${d}</span>` },
      { data: 'spesifikasi', render: d => `<span class="text-wrap small text-muted">${d || '-'}</span>` },
      { data: 'unit' },
      { data: 'qty_awal_pertama' },
      { data: 'total_pemasukan' },
      { data: 'total_pemakaian' },
      { data: 'min_qty', render: d => `<span class="fw-bold text-secondary">${d ?? 0}</span>` },
      { data: 'max_qty', render: d => `<span class="fw-bold text-secondary">${d ?? 0}</span>` },
      {
        data: 'stok_akhir',
        render: (d, t, r) => {
          // 🔥 Logika Stok Kritis dinamis berdasarkan min_qty dari database
          const limitMin = parseFloat(r.min_qty) || 0;
          const isLow = limitMin > 0 ? (d <= limitMin) : (d < 300);
          const colorClass = d <= 0 ? 'bg-dark' : (isLow ? 'bg-danger pulse-animation' : 'bg-success');
          return `<span class="badge ${colorClass} rounded-pill px-3">${d}</span>`;
        }
      }
    ],
    initComplete: function () {
      // Opsi checkbox dibangun dari DATA MENTAH (rawStockData), bukan dari HTML hasil render,
      // supaya nilainya selalu konsisten dengan predicate pencarian di bawah.
      refreshAllFilterOptions();
    }
  });

  // 🔥 FIX UTAMA #2: dulu filter pakai table.column(idx).search(regex) yang dicocokkan ke
  // HTML hasil render (mis. badge "<span class='badge'>Mekanik</span>"), jadi regex ^Mekanik$
  // TIDAK PERNAH match -> hasil "tidak ada data" walau opsinya kelihatan di daftar filter.
  // Sekarang kita pakai custom search predicate yang membandingkan LANGSUNG ke data mentah rowData,
  // dan mendukung banyak kolom sekaligus (AND antar kolom, OR antar nilai dalam 1 kolom).
  if (!searchPredicatePushed) {
    $.fn.dataTable.ext.search.push((settings, data, dataIndex, rowData) => {
      if (settings.nTable.id !== 'stokTable') return true;

      if (lowStockActive.value) {
        const sisaStok = parseFloat(rowData.stok_akhir) || 0;
        const minStok = parseFloat(rowData.min_qty) || 0;
        if (!(minStok > 0 && sisaStok <= minStok)) return false;
      }

      for (const idxStr in activeFilters.value) {
        const vals = activeFilters.value[idxStr];
        if (!vals || vals.length === 0) continue;
        const colDef = columnDefs[idxStr];
        if (!colDef) continue;
        if (!vals.includes(String(rowData[colDef.data]))) return false;
      }
      return true;
    });
    searchPredicatePushed = true;
  }
};

// Checkbox filter kolom: toggle 1 nilai, lalu redraw tabel + refresh SEMUA dropdown lain (cascading)
$(document).off('change', '.filter-checkbox').on('change', '.filter-checkbox', function () {
  const idx = Number($(this).data('index'));
  const val = String($(this).val());
  const isChecked = $(this).is(':checked');

  const current = new Set(activeFilters.value[idx] || []);
  if (isChecked) current.add(val); else current.delete(val);

  setColumnFilter(idx, [...current]);
});

// Reset filter 1 kolom saja
$(document).off('click', '.btn-reset-filter').on('click', '.btn-reset-filter', function (e) {
  e.stopPropagation();
  const idx = Number($(this).data('index'));
  setColumnFilter(idx, []);
});

$(document).off('keyup', '.filter-search-input').on('keyup', '.filter-search-input', function() {
  const val = $(this).val().toLowerCase();
  const idx = $(this).data('index');
  const container = $(`#container-filter-${idx}`);

  container.find('.form-check').each(function() {
    const text = $(this).find('label').text().toLowerCase();
    if (text.indexOf(val) > -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
});

$(document).on('hide.bs.dropdown', '.dropdown', function () {
  $(this).find('.filter-search-input').val('');
  $(this).find('.form-check').show();
});

// ===================== FITUR MEMO =====================
const showMemoModal = ref(false);
const memoForm = ref({
  no_memo: '', attention: '', nama_peminta: '',
  nama_pemimpin: 'Mrs. Angel', nama_kabag: '', nama_checker: '',
  items: []
});

const memoSearchQuery = ref('');
const checkedItemSpecs = ref([]);
const checklistSearch = ref('');

const availableCategories = computed(() => {
  const categories = memoForm.value.items.map(i => i.kategori);
  return ['All', ...new Set(categories)];
});

const categoryItemCount = (kat) => {
  if (kat === 'All') return memoForm.value.items.length;
  return memoForm.value.items.filter(i => i.kategori === kat).length;
};

const filteredMemoItems = computed(() => {
  if (selectedCategory.value === 'All') return memoForm.value.items;
  return memoForm.value.items.filter(i => i.kategori === selectedCategory.value);
});

const uniqueItemSpecOptions = computed(() => {
  const set = new Set();
  filteredMemoItems.value.forEach(i => {
    const label = i.spesifikasi ? `${i.item_name} — ${i.spesifikasi}` : i.item_name;
    set.add(label);
  });
  return [...set].sort();
});

const filteredChecklistOptions = computed(() => {
  if (!checklistSearch.value) return uniqueItemSpecOptions.value;
  const q = checklistSearch.value.toLowerCase();
  return uniqueItemSpecOptions.value.filter(o => o.toLowerCase().includes(q));
});

const removeChecklistOption = (opt) => {
  checkedItemSpecs.value = checkedItemSpecs.value.filter(o => o !== opt);
};

const clearMemoFilters = () => {
  memoSearchQuery.value = '';
  checkedItemSpecs.value = [];
  checklistSearch.value = '';
};

const displayedMemoItems = computed(() => {
  let items = filteredMemoItems.value;

  if (memoSearchQuery.value.trim()) {
    const q = memoSearchQuery.value.trim().toLowerCase();
    items = items.filter(i =>
      (i.item_name || '').toLowerCase().includes(q) ||
      (i.spesifikasi || '').toLowerCase().includes(q)
    );
  }

  if (checkedItemSpecs.value.length) {
    items = items.filter(i => {
      const label = i.spesifikasi ? `${i.item_name} — ${i.spesifikasi}` : i.item_name;
      return checkedItemSpecs.value.includes(label);
    });
  }

  return items;
});

const selectedRowCount = computed(() => memoForm.value.items.filter(i => i._selected).length);

const allVisibleSelected = computed(() => {
  if (displayedMemoItems.value.length === 0) return false;
  return displayedMemoItems.value.every(i => i._selected);
});

const toggleSelectAllVisible = (e) => {
  const checked = e.target.checked;
  displayedMemoItems.value.forEach(i => { i._selected = checked; });
};

const closeMemoModal = () => {
  showMemoModal.value = false;
  memoSearchQuery.value = '';
  checkedItemSpecs.value = [];
  checklistSearch.value = '';
  selectedCategory.value = 'All';
};

const removeItemFromMemo = (item) => {
  memoForm.value.items = memoForm.value.items.filter(
    i => i.akses_kode !== item.akses_kode
  );
};

// 🔥 MEMASUKKAN NILAI MIN & MAX QTY DARI BACKEND KE MODAL MEMO
const buildMemoItems = (lowStockList) => lowStockList.map(item => ({
  akses_kode: item.akses_code,
  item_name: item.item_name,
  spesifikasi: item.spesifikasi,
  stok_akhir: item.stok_akhir,
  unit: item.unit,
  kategori: item.kategori,
  min_qty: item.min_qty || 0,
  max_qty: item.max_qty || 0,
  max_stock: item.max_qty || 0, // Default disamakan dengan Max Qty database
  qty_permintaan: (parseFloat(item.max_qty) - parseFloat(item.stok_akhir)) > 0 
    ? (parseFloat(item.max_qty) - parseFloat(item.stok_akhir)) 
    : 0, // Auto hitung rekomendasi order agar mencapai Max Stok kembali
  _selected: true
}));

const openMemoModal = () => {
  memoType.value = 'tlsi';

  // Mengambil data dari baris tabel yang sedang aktif/terfilter
  const allLowStock = table.rows({ filter: 'applied' }).data().toArray()
    .filter(r => {
      const sisaStok = parseFloat(r.stok_akhir) || 0;
      const minStok = parseFloat(r.min_qty) || 0;
      return minStok > 0 && sisaStok <= minStok;
    });

  if (allLowStock.length === 0) {
    return Swal.fire('Info', 'Tidak ada stok kritis (di bawah min stok) untuk dicetak.', 'info');
  }

  const now = new Date();
  const formattedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  memoForm.value = {
    no_memo: `PO/TLSI/${formattedDate}`,
    attention: 'PURCHASING',
    nama_peminta: user.value.name || '',
    nama_pemimpin: 'Mrs. Angel',
    nama_kabag: 'Inggil',
    nama_checker: 'Gina',
    items: buildMemoItems(allLowStock)
  };

  selectedCategory.value = 'All';
  showMemoModal.value = true;
};

const openMemoModalLTX = () => {
  memoType.value = 'ltx';

  const allLowStock = table.rows({ filter: 'applied' }).data().toArray()
    .filter(r => {
      const sisaStok = parseFloat(r.stok_akhir) || 0;
      const minStok = parseFloat(r.min_qty) || 0;
      return minStok > 0 && sisaStok <= minStok;
    });

  if (allLowStock.length === 0) {
    return Swal.fire('Info', 'Tidak ada stok kritis (di bawah min stok) untuk dicetak.', 'info');
  }

  const now = new Date();
  const formattedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  memoForm.value = {
    no_memo: `PO/LTX/${formattedDate}`,
    attention: 'PURCHASING',
    nama_peminta: user.value.name || '',
    nama_pemimpin: 'Mrs. Angel',
    nama_kabag: 'Inggil',
    nama_checker: 'Gina',
    items: buildMemoItems(allLowStock)
  };

  selectedCategory.value = 'All';
  showMemoModal.value = true;
};


const submitMemo = async () => {
  try {
    const filteredItems = memoForm.value.items.filter(i =>
      i.akses_kode &&
      i._selected &&
      Number(i.qty_permintaan) > 0 &&
      Number(i.max_stock) > 0
    );

    if (filteredItems.length === 0) {
      return Swal.fire(
        'Warning',
        'Pilih minimal 1 item dan isi qty & max pembelian!',
        'warning'
      );
    }

    // Properti min_qty & max_qty otomatis ikut terkirim di dalam array items ini
    const payload = {
      ...memoForm.value,
      items: filteredItems.map(({ _selected, ...rest }) => rest)
    };

    const endpoint = memoType.value === 'ltx' ? '/item/creatememoltx' : '/item/creatememo';

    const res = await axios.post(
       `${API_BASE_URL}${endpoint}`,
       payload,
       { responseType: 'blob' }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${memoForm.value.no_memo}.pdf`);
    link.click();

    closeMemoModal();
    Swal.fire('Berhasil', 'Memo berhasil dicetak.', 'success');

  } catch (e) {
    Swal.fire('Error', 'Gagal mencetak memo.', 'error');
  }
};

// --- FILTERS & EXPORTS ---
const toggleLowStockFilter = (e) => {
  // Dulu ext.search.push/pop di sini, tapi itu bikin predicate ke-stack ganda kalau dipanggil
  // berkali-kali dan bentrok dengan predicate filter kolom. Sekarang cukup toggle flag reaktif;
  // predicate gabungan (dipasang sekali di initDataTable) yang membaca flag ini.
  lowStockActive.value = e.target.checked;
  table.draw();
  refreshAllFilterOptions();
};

const downloadExcel = async (type) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/item/stock/export`, { params: { type }, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Stok_${type}.xlsx`);
    link.click();
  } catch (e) { alert("Gagal download excel"); }
};

const exportToPDF = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/item/stock/export-pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Stok.pdf`);
    link.click();
  } catch (e) { alert("Gagal download PDF"); }
};

onMounted(async () => {
  const localUser = localStorage.getItem('user');
  if (localUser) user.value = JSON.parse(localUser);
  try {
    const res = await axios.get(`${API_BASE_URL}/item/stock/summary`);
    await nextTick();
    initDataTable(res.data);

    // 🔥 FITUR DETEKSI STOK DI BAWAH MINIMUM
    const lowStockItems = res.data.filter(item => {
      const sisaStok = parseFloat(item.stok_akhir) || 0;
      const minStok = parseFloat(item.min_qty) || 0;
      return minStok > 0 && sisaStok <= minStok;
    });

    // PENGGANTIAN ALERT: Menggunakan Toast minimalis jika ada barang kritis
    if (lowStockItems.length > 0) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: true,
        confirmButtonText: 'Lihat Items',
        confirmButtonColor: '#dc3545',
        timer: 10000, // Menghilang otomatis dalam 10 detik jika tidak diklik
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({
        icon: 'warning',
        title: `⚠️ ${lowStockItems.length} Item Stok Kritis!`,
        text: 'Klik tombol untuk memfilter tabel otomatis.'
      }).then((result) => {
        // Jika user klik tombol "Lihat Barang" pada toast
        if (result.isConfirmed) {
          triggerLowStockFilterAutomatically();
        }
      });
      
      // Opsional: Langsung otomatis filter di awal tanpa klik pun bisa dengan mengaktifkan fungsi ini:
      // triggerLowStockFilterAutomatically();
    }

  } catch (e) { console.error(e); }
  window.addEventListener('resize', () => { windowWidth.value = window.innerWidth; });
});

// Helper Function agar kode lebih rapi dan bisa dipanggil berulang
const triggerLowStockFilterAutomatically = () => {
  const checkbox = document.getElementById('filterLowStock');
  if (checkbox && !checkbox.checked) {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    
    // Smooth scroll ke area tabel agar user langsung tahu datanya ada di sana
    const tableEl = document.getElementById('stokTable');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

watch(selectedCategory, () => {
  checkedItemSpecs.value = [];
  checklistSearch.value = '';
});

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => { localStorage.clear(); window.location.href = '/login'; };
onBeforeUnmount(() => { if (table) table.destroy(); });
</script>

<style scoped>
/* ===================== TOP ACTION BUTTONS ===================== */
.btn-modern-action {
  border-radius: 50px; padding: 8px 20px; font-weight: 600; font-size: 0.85rem; border: none; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;
}
.btn-modern-action:hover { transform: translateY(-1px); }
.btn-excel { background-color: #e8f5e9; color: #2e7d32; }
.btn-pdf { background-color: #f3f0ff; color: #6741d9; }

.filter-switch-wrapper { border-radius: 50px; overflow: hidden; }
.btn-filter-low {
  background: #fff; color: #6c757d; border-radius: 50px; padding: 8px 18px; font-weight: 600; font-size: 0.85rem; border: none;
}
.btn-check:checked + .btn-filter-low { background: #dc3545; color: #fff; }

.modal-backdrop { background-color: rgba(15, 23, 42, 0.55); z-index: 1040; }
.modal { z-index: 1050; }
.pulse-animation { animation: pulse-red 2s infinite; }
@keyframes pulse-red {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
}

.sweep-nav-wrapper { position: relative; background: #f1f3f5; border-radius: 50px; padding: 6px; display: flex; max-width: 500px; }
.nav-link { flex: 1; text-align: center; color: #6c757d; font-weight: 600; padding: 10px 0; z-index: 2; transition: 0.3s; }
.nav-link.active { color: #0d6efd !important; }
.sweep-indicator { position: absolute; height: calc(100% - 12px); width: calc(33.33% - 8px); top: 6px; background: white; border-radius: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: 0.4s; }

/* ===================== TAB KATEGORI UTAMA (TABEL STOK) ===================== */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cat-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border-radius: 12px;
  border: 1.5px solid #e9ecef;
  background: #fff;
  color: #495057;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}
.cat-tab-btn i { font-size: 0.95rem; opacity: 0.7; }
.cat-tab-btn:hover { border-color: #0d6efd; color: #0d6efd; }
.cat-tab-btn.active {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  border-color: #0d6efd;
  color: #fff;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25);
}
.cat-tab-btn.active i { opacity: 1; }
.cat-count {
  background: rgba(0,0,0,0.06);
  border-radius: 30px;
  padding: 1px 9px;
  font-size: 0.72rem;
  font-weight: 700;
}
.cat-tab-btn.active .cat-count { background: rgba(255,255,255,0.25); }

/* ===================== DROPDOWN MENU "DOKUMEN PDF" ===================== */
.pdf-dropdown-menu { min-width: 300px; }
.dropdown-section-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #adb5bd;
  padding: 6px 10px 4px;
}
.pdf-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px;
  transition: background 0.15s ease, transform 0.1s ease;
}
.pdf-menu-item:hover { background: #f3f5fb; transform: translateX(2px); }
.pdf-menu-item:active { transform: translateX(0); }

.pdf-menu-icon {
  flex-shrink: 0;
  width: 38px; height: 38px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
}
.pdf-menu-icon.icon-neutral { background: #f3f0ff; color: #6741d9; }
.pdf-menu-icon.icon-warning { background: #fff1f0; color: #dc3545; }
.pdf-menu-icon.icon-primary { background: #e7edff; color: #1d4ed8; }

.pdf-menu-text { display: flex; flex-direction: column; line-height: 1.25; flex-grow: 1; }
.pdf-menu-title { font-size: 0.86rem; font-weight: 700; color: #212529; }
.pdf-menu-desc { font-size: 0.72rem; color: #868e96; }

.pdf-menu-arrow {
  font-size: 0.8rem;
  color: #ced4da;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.15s ease;
}
.pdf-menu-item:hover .pdf-menu-arrow { opacity: 1; transform: translateX(0); }

/* ===================== FILTER HEADER TABEL (checkbox + search) ===================== */
/* 🔥 FIX: dulu .card pakai overflow-hidden, jadi dropdown filter (position absolute) yang
   melebihi tinggi card langsung KEPOTONG/tertutup - paling kentara saat data cuma 1-2 baris.
   Sekarang overflow-hidden dipindah efeknya ke sini (radius saja, tanpa clip dropdown),
   dan tabel dikasih min-height supaya selalu ada ruang buat dropdown terbuka penuh. */
.table-wrapper-rounded {
  border-radius: 16px;
  min-height: 420px; /* tinggi minimum awal, biar data sedikit (bahkan 1 baris) tetap ada ruang */
}
.filter-trigger-btn { border-radius: 8px; font-weight: 600; }
.filter-dropdown-panel { border-radius: 14px; z-index: 1055; }
.filter-search-input:focus { box-shadow: none; border-color: #dee2e6; }
.filter-options-container { scrollbar-width: thin; padding-right: 5px; }
.filter-options-container::-webkit-scrollbar { width: 4px; }
.filter-options-container::-webkit-scrollbar-thumb { background: #ccd0d4; border-radius: 10px; }

/* ===================== MODAL MEMO - DESAIN BARU ===================== */
.memo-modal-content { overflow: hidden; }
.memo-modal-header {
  background: linear-gradient(135deg, #1e3a8a, #1d4ed8);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.memo-header-icon {
  width: 44px; height: 44px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem;
  color: #fff;
}
.memo-modal-body { background: #f8f9fb; max-height: 75vh; overflow-y: auto; }
.memo-modal-footer { background: #f8f9fb; border-top: 1px solid #eef0f3 !important; }

.memo-info-card {
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}
.memo-info-card-title {
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #1d4ed8;
  margin-bottom: 1rem;
  display: flex; align-items: center; gap: 6px;
}
.memo-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #6c757d;
  margin-bottom: 4px;
  display: block;
}
.memo-input { border-radius: 10px; border: 1.5px solid #e9ecef; padding: 0.5rem 0.85rem; }
.memo-input:focus { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,0.1); }

.memo-category-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.memo-cat-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border-radius: 30px;
  border: 1.5px solid #e0e4eb;
  background: #fff;
  color: #495057;
  font-weight: 600;
  font-size: 0.78rem;
  transition: all 0.2s ease;
}
.memo-cat-btn:hover { border-color: #1d4ed8; color: #1d4ed8; }
.memo-cat-btn.active {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #fff;
}
.memo-cat-badge {
  background: rgba(0,0,0,0.06);
  border-radius: 30px;
  padding: 0 7px;
  font-size: 0.68rem;
  font-weight: 700;
}
.memo-cat-btn.active .memo-cat-badge { background: rgba(255,255,255,0.25); }

.memo-selected-info {
  font-size: 0.8rem;
  color: #495057;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 30px;
  padding: 6px 14px;
  display: flex; align-items: center; gap: 6px;
}

.memo-search-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1.5px solid #e0e4eb;
  border-radius: 12px;
  padding: 0 12px;
  min-width: 240px;
}
.search-box i.bi-search { color: #adb5bd; margin-right: 8px; }
.search-box input {
  border: none; outline: none; box-shadow: none; padding: 0.55rem 0;
  flex-grow: 1; background: transparent; font-size: 0.88rem;
}
.btn-clear-search { border: none; background: none; color: #adb5bd; padding: 0; display: flex; }
.btn-clear-search:hover { color: #dc3545; }

.filter-pill-btn { border-radius: 30px; padding: 8px 16px; position: relative; }
.filter-count-badge {
  background: #1d4ed8; color: #fff; border-radius: 30px;
  font-size: 0.68rem; padding: 1px 7px; margin-left: 6px; font-weight: 700;
}

.filter-chip {
  background: #e7edff; color: #1d4ed8;
  border-radius: 30px; padding: 4px 10px 4px 12px;
  font-size: 0.78rem; font-weight: 600;
  display: inline-flex; align-items: center; gap: 6px;
}
.filter-chip i { cursor: pointer; font-size: 0.95rem; opacity: 0.7; }
.filter-chip i:hover { opacity: 1; }

.memo-table-card { overflow: hidden; }
.memo-table thead {
  background: #11182c; color: #fff;
}
.memo-table thead th { font-size: 0.72rem; padding: 0.85rem 1rem; border: none; }
.memo-table tbody td { padding: 0.7rem 1rem; }
.memo-table tbody tr.row-selected { background: #f0f5ff; }
.memo-table tbody tr:hover { background: #f8f9fb; }

@media (max-width: 768px) {
  .memo-search-bar { flex-direction: column; align-items: stretch; }
  .search-box { min-width: 0; }
}
</style>