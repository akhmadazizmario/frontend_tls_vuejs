<template>
  <!-- 1. BUNGKUS HEADER TERPISAH DENGAN Z-INDEX MAKSIMAL -->
  <div style="position: relative; z-index: 999999;">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
  </div>

  <!-- 2. BUNGKUS KONTEN UTAMA -->
  <div class="d-flex flex-column min-vh-100 bg-light">
    <div class="d-flex flex-grow-1 main-row">
      <!-- Sidebar -->
      <Sidebar :isOpen="sidebarOpen" />

      <!-- Main Content -->
      <main 
        class="flex-grow-1 p-3 p-md-5 transition-all main-content" 
        :style="{ 
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0', 
          marginTop: '56px' 
        }"
      >
      <!-- BUNGKUS DENGAN v-if="hasAccess" UNTUK UAC -->
      <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">

        <!-- TOP HEADER & ACTION BUTTONS -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div class="d-flex align-items-center gap-3">
            <div class="page-title-icon">
              <i class="bi bi-file-earmark-person-fill fs-3 text-primary"></i>
            </div>
            <div>
              <h2 class="h4 fw-bold text-dark mb-0">Kelola PKWT &amp; Data Karyawan</h2>
              <p class="text-muted small mb-0">Monitoring status karyawan</p>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button
              class="btn btn-outline-primary d-flex align-items-center gap-2"
              @click="handleDownloadAll"
              :disabled="downloadAllLoading"
              title="Unduh seluruh folder dokumen hasil TTD kontrak dalam satu file ZIP"
            >
              <span v-if="downloadAllLoading" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-file-earmark-zip-fill"></i>
              <span>{{ downloadAllLoading ? 'Menyiapkan ZIP...' : 'Download Semua Dokumen (.zip)' }}</span>
            </button>
            <div class="dropdown">
              <button
                class="btn btn-outline-success d-flex align-items-center gap-2"
                type="button"
                @click.stop="showExportPanel = !showExportPanel"
              >
                <i class="bi bi-file-earmark-excel-fill"></i>
                <span>Export Laporan TTD (.xlsx)</span>
              </button>
              <div
                v-if="showExportPanel"
                class="dropdown-menu show p-3 shadow"
                style="right: 0; left: auto; min-width: 280px;"
                @click.stop
              >
                <p class="small text-muted mb-2">
                  Laporan otomatis hanya berisi karyawan aktif yang <strong>sudah lengkap</strong> mengisi email, ttd, dan dokumen. Kosongkan tanggal jika ingin export semua.
                </p>
                <div class="mb-2">
                  <label class="form-label small fw-bold mb-1">Dari Tanggal (xDateTime)</label>
                  <input type="date" class="form-control form-control-sm" v-model="exportDari" />
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold mb-1">Sampai Tanggal (xDateTime)</label>
                  <input type="date" class="form-control form-control-sm" v-model="exportSampai" />
                </div>
                <button
                  class="btn btn-success btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  @click="handleExportExcel"
                  :disabled="exportExcelLoading"
                >
                  <span v-if="exportExcelLoading" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-download"></i>
                  <span>{{ exportExcelLoading ? 'Menyiapkan Excel...' : 'Download Excel' }}</span>
                </button>
              </div>
            </div>
            <button class="btn btn-primary d-flex align-items-center gap-2 shadow-sm" @click="handleSync" :disabled="syncLoading">
              <span v-if="syncLoading" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-arrow-repeat"></i>
              <span>{{ syncLoading ? 'Proses Sinkron...' : 'Sinkron Data Karyawan' }}</span>
            </button>
          </div>
        </div>

        <!-- TAB SLIDE -->
        <div class="tab-pill-group mb-4 d-flex gap-2 border-bottom pb-3">
          <button
            type="button"
            class="btn rounded-pill px-4"
            :class="activeTab === 'active' ? 'btn-primary fw-bold' : 'btn-outline-secondary'"
            @click="switchTab('active')"
          >
            <i class="bi bi-person-check-fill me-1"></i> Karyawan Aktif
          </button>
          <button
            type="button"
            class="btn rounded-pill px-4"
            :class="activeTab === 'inactive' ? 'btn-danger fw-bold' : 'btn-outline-secondary'"
            @click="switchTab('inactive')"
          >
            <i class="bi bi-person-x-fill me-1"></i> Karyawan Tidak Aktif / Resign
          </button>
          <button
            type="button"
            class="btn rounded-pill px-4"
            :class="activeTab === 'all' ? 'btn-dark fw-bold' : 'btn-outline-secondary'"
            @click="switchTab('all')"
          >
            <i class="bi bi-people-fill me-1"></i> Semua
          </button>
        </div>

        <!-- SEARCH BAR & SUMMARY -->
        <div class="card border-0 shadow-sm mb-4 rounded-4">
          <div class="card-body p-3">
            <div class="row align-items-center g-3">
              <div class="col-md-6">
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                  <input
                    type="text"
                    v-model="searchInput"
                    class="form-control border-start-0"
                    placeholder="Cari berdasarkan NIK, Nama, Job, Dept, atau Email..."
                  />
                  <span v-if="searchInput !== searchQuery" class="input-group-text bg-white border-start-0">
                    <span class="spinner-border spinner-border-sm text-muted"></span>
                  </span>
                </div>
              </div>
              <div class="col-md-6 d-flex align-items-center justify-content-md-end gap-3">
                <button
                  v-if="hasActiveFilters"
                  class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  @click="clearAllFilters"
                >
                  <i class="bi bi-x-circle"></i> Reset Filter
                </button>
                <span class="text-muted small">
                  Total Data: <strong class="text-dark">{{ filteredItems.length.toLocaleString('id-ID') }}</strong> / {{ items.length.toLocaleString('id-ID') }} Karyawan
                </span>
                
              </div>
            </div>

            <!-- Filter range xEDate (Dari - Sampai) -->
            <div class="row align-items-center g-2 mt-1">
              <div class="col-auto">
                <label class="small text-muted mb-0 fw-semibold">Filter xEDate:</label>
              </div>
              <div class="col-auto">
                <input type="date" class="form-control form-control-sm" v-model="xEDateDari" style="width: 160px;" />
              </div>
              <div class="col-auto"><span class="small text-muted">s/d</span></div>
              <div class="col-auto">
                <input type="date" class="form-control form-control-sm" v-model="xEDateSampai" style="width: 160px;" />
              </div>
              <div class="col-auto" v-if="xEDateDari || xEDateSampai">
                <button class="btn btn-sm btn-outline-secondary" @click="xEDateDari = ''; xEDateSampai = '';">
                  <i class="bi bi-x-lg"></i> Hapus
                </button>
              </div>
            </div>

            <!-- Active filter chips -->
            <div v-if="hasActiveFilters" class="d-flex flex-wrap gap-2 mt-3">
              <template v-for="col in columns" :key="'chip-' + col.key">
                <span
                  v-if="filters[col.key] && filters[col.key].length"
                  class="badge rounded-pill bg-primary-subtle text-primary-emphasis border border-primary-subtle d-inline-flex align-items-center gap-1 py-2 px-3"
                >
                  {{ col.label }}: {{ filters[col.key].length }} dipilih
                  <i class="bi bi-x-circle-fill ms-1 cursor-pointer" @click="clearColumnFilter(col.key)"></i>
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- DATA TABLE CARD -->
        <div class="card border-0 shadow-sm rounded-4 table-card">
          <div class="card-body p-0">
            <div class="table-scroll-wrapper custom-scrollbar">
              <table class="table table-hover align-middle mb-0 employee-table">
                <colgroup>
                  <col :style="{ width: noColWidth + 'px' }" />
                  <col :style="{ width: aksiColWidth + 'px' }" />
                  <col v-for="col in columns" :key="'colgroup-' + col.key" :style="{ width: (columnWidths[col.key] || 150) + 'px' }" />
                </colgroup>
                <thead class="table-light">
                  <tr class="small text-uppercase fw-bold text-muted">
                    <th class="text-center sticky-col resizable-th text-nowrap" style="width: 55px;">
                      No
                      <span class="col-resize-handle" @mousedown="startResize($event, 'no')"></span>
                    </th>
                    <th class="text-center sticky-col-aksi resizable-th text-nowrap" :style="{ width: aksiColWidth + 'px', left: noColWidth + 'px' }">
                      Aksi
                      <span class="col-resize-handle" @mousedown="startResize($event, 'aksi')"></span>
                    </th>

                    <th
                      v-for="col in columns"
                      :key="col.key"
                      class="filter-th resizable-th"
                      :style="{ width: (columnWidths[col.key] || 150) + 'px' }"
                    >
                      <div class="d-flex align-items-start justify-content-between gap-1">
                        <span class="col-label-text">{{ col.label }}</span>
                        <div class="dropdown flex-shrink-0" v-if="col.filterable">
                          <button
                            class="btn btn-sm btn-link p-0 filter-btn"
                            :class="{ 'text-primary': filters[col.key] && filters[col.key].length }"
                            type="button"
                            @click.stop="openFilterDropdown(col.key)"
                          >
                            <i class="bi" :class="filters[col.key] && filters[col.key].length ? 'bi-funnel-fill' : 'bi-funnel'"></i>
                          </button>
                          <div
                            v-if="openFilterKey === col.key"
                            class="dropdown-menu show p-2 filter-dropdown shadow"
                            @click.stop
                          >
                            <div v-if="loadingOptionsFor === col.key" class="text-center py-3 text-muted small">
                              <span class="spinner-border spinner-border-sm me-1"></span> Memuat opsi...
                            </div>
                            <template v-else>
                              <div class="input-group input-group-sm mb-2">
                                <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                                <input
                                  type="text"
                                  class="form-control"
                                  :placeholder="'Cari ' + col.label + '...'"
                                  v-model="columnSearch[col.key]"
                                />
                              </div>
                              <div class="d-flex justify-content-between mb-2">
                                <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" @click="selectAllInColumn(col.key)">Pilih Semua</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" @click="clearColumnFilter(col.key)">Bersihkan</button>
                              </div>
                              <div class="filter-options">
                                <div
                                  v-for="opt in getFilteredOptions(col.key)"
                                  :key="col.key + '-' + opt.value"
                                  class="form-check small mb-1"
                                >
                                  <input
                                    class="form-check-input"
                                    type="checkbox"
                                    :id="'chk-' + col.key + '-' + opt.value"
                                    :value="opt.value"
                                    v-model="filters[col.key]"
                                  />
                                  <label class="form-check-label text-truncate d-block" :for="'chk-' + col.key + '-' + opt.value" :title="opt.label">
                                    {{ opt.label || '(Kosong)' }} <span class="text-muted">({{ opt.count }})</span>
                                  </label>
                                </div>
                                <div v-if="getFilteredOptions(col.key).length === 0" class="text-muted small text-center py-2">
                                  Tidak ada opsi.
                                </div>
                                <div v-if="fullOptionCount(col.key) > MAX_OPTIONS_SHOWN" class="text-muted small text-center pt-1 border-top mt-1">
                                  Menampilkan {{ MAX_OPTIONS_SHOWN }} dari {{ fullOptionCount(col.key) }}. Ketik untuk mempersempit.
                                </div>
                              </div>
                              <div class="d-flex justify-content-end pt-2 mt-1 border-top">
                                <button type="button" class="btn btn-sm btn-primary py-1 px-3" @click="closeFilterDropdown">
                                  Selesai
                                </button>
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>
                      <span class="col-resize-handle" @mousedown.stop="startResize($event, col.key)"></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td :colspan="columns.length + 2" class="text-center py-5 text-muted">
                      <div class="spinner-border spinner-border-sm me-2"></div> Memuat data...
                    </td>
                  </tr>
                  <tr v-else-if="paginatedItems.length === 0">
                    <td :colspan="columns.length + 2" class="text-center py-5 text-muted">
                      <i class="bi bi-inbox fs-2 d-block mb-2"></i> Tidak ada data karyawan ditemukan.
                    </td>
                  </tr>
                  <tr v-for="item in paginatedItems" :key="item.id_ttd || item.sID" class="small">
                    <td class="text-center fw-bold sticky-col" :style="{ width: noColWidth + 'px' }">{{ item.__rowNo }}</td>
                    <td class="text-center sticky-col-aksi" :style="{ width: aksiColWidth + 'px', left: noColWidth + 'px' }">
                      
                      <!-- 3. TOMBOL UPDATE MENGGUNAKAN data-bs-toggle SEPERTI IDPPO -->
                      <button
                        class="btn btn-sm btn-outline-primary"
                        title="Update Tanggal Kontrak"
                        data-bs-toggle="modal"
                        data-bs-target="#modalContract"
                        @click="openModalUpdate(item)"
                      >
                        <i class="bi bi-pencil-square"></i> Update
                      </button>
                      
                    </td>

                    <td>{{ item.sID ?? '-' }}</td>
                    <td><span class="fw-bold text-primary">{{ item.xNO || '-' }}</span></td>
                    <td><span class="font-mono text-secondary-emphasis">{{ item.xIDNo || '-' }}</span></td>
                    <td>
                      <span class="badge" :class="item.xDimis === 1 ? 'bg-success' : 'bg-danger'">
                        {{ item.xDimis === 1 ? 'Aktif' : 'Non-Aktif' }}
                      </span>
                    </td>
                    <td class="fw-bold text-dark">{{ item.xName || '-' }}</td>
                    <td>{{ formatDate(item.xJoinDate) }}</td>
                    <td class="text-wrap-cell" :title="item.xIDAddr">{{ item.xIDAddr || '-' }}</td>
                    <td>{{ item.xNative || '-' }}</td>
                    <td>{{ formatDate(item.xBirth) }}</td>
                    <td>{{ item.xKind || '-' }}</td>
                    <td>{{ item.xPact || '-' }}</td>
                    <td>{{ formatDate(item.xEDate) }}</td>
                    <td>{{ item.job || '-' }}</td>
                    <td><span class="badge bg-light text-dark border">{{ item.dept || '-' }}</span></td>
                    <td>{{ item.email || '-' }}</td>
                    <td class="fw-bold text-success">{{ formatDate(item.tgl_kontrak_baru) }}</td>
                    <td class="fw-bold text-danger">{{ formatDate(item.tgl_kontrak_akhir) }}</td>
                    <td>{{ item.nomor_suratpkwt || '-' }}</td>
                    <td>{{ item.gaji_perjanjiankontrak ? formatCurrency(item.gaji_perjanjiankontrak) : '-' }}</td>
                    <td class="text-center">
                      <a
                        v-if="item.link_hasil_dokumen"
                        :href="item.link_hasil_dokumen"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-sm btn-doc"
                        title="Buka dokumen PDF hasil TTD di tab baru"
                      >
                        <i class="bi bi-file-earmark-pdf-fill"></i> Lihat PDF
                      </a>
                      <span v-else class="badge bg-secondary-subtle text-secondary border">Belum Ada</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION -->
            <div class="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 p-3 border-top">
              <div class="d-flex align-items-center gap-2 small text-muted flex-wrap">
                <span>Baris per halaman:</span>
                <select class="form-select form-select-sm w-auto" v-model.number="pageSize">
                  <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size.toLocaleString('id-ID') }}</option>
                </select>
                <span v-if="pageSize >= 1000" class="text-warning-emphasis" title="Menampilkan sangat banyak baris sekaligus bisa memperlambat browser Anda">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                </span>
                <span>
                  Menampilkan {{ rangeStart }}–{{ rangeEnd }} dari {{ filteredItems.length.toLocaleString('id-ID') }}
                </span>
              </div>

              <nav v-if="totalPages > 1">
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="goToPage(1)"><i class="bi bi-chevron-double-left"></i></button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="goToPage(currentPage - 1)"><i class="bi bi-chevron-left"></i></button>
                  </li>
                  <li class="page-item disabled d-flex align-items-center">
                    <span class="page-link border-0 bg-transparent">Hal {{ currentPage }} / {{ totalPages }}</span>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="goToPage(currentPage + 1)"><i class="bi bi-chevron-right"></i></button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="goToPage(totalPages)"><i class="bi bi-chevron-double-right"></i></button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        </div>

        <!-- OPSI TAMPILAN BLANK (JIKA TIDAK ADA AKSES) -->
        <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 pt-5 mt-5">
           <!-- Halaman Blank, Jika ingin dibuat benar-benar kosong hapus komentar html ini. -->
            <h1>hi anda tersesat nih, Mohon untuk Logout Segera </h1>
            <a href="/logout" class="btn btn-primary">back to jungle</a>
        </div>

      </main>
    </div>

    <!-- Footer -->
    <Footer />
  </div>

  <!-- 4. MODAL DIPINDAH KE LUAR KONTEN UTAMA & TOMBOL SUBMIT PAKAI data-bs-dismiss -->
  <div class="modal fade" id="modalContract" tabindex="-1" aria-hidden="true" ref="modalContractRef" style="display: none;">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow rounded-4">
        <div class="modal-header border-bottom-0 pb-0">
          <h5 class="modal-title fw-bold">Update Tanggal Kontrak</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <form @submit.prevent="submitUpdateContract">
          <div class="modal-body py-4">
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted">Nama Karyawan</label>
              <input type="text" class="form-control bg-light" :value="selectedItem.xName" readonly />
            </div>
            <div class="row g-3">
              <div class="col-12" v-if="xEDateBerubah">
                <div class="alert alert-warning py-2 px-3 small mb-0 d-flex align-items-center justify-content-between gap-2 flex-wrap">
                  <span>
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    xEDate terbaru dari data HR (<strong>{{ formatDate(selectedItem.xEDate) }}</strong>) berbeda dengan Tgl Kontrak Akhir yang sudah tersimpan sebelumnya. Silakan ubah manual atau pakai nilai terbaru.
                  </span>
                  <button type="button" class="btn btn-sm btn-outline-warning text-nowrap" @click="pakaiXEDateTerbaru">
                    Pakai xEDate Terbaru
                  </button>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Tgl Kontrak Baru <span class="text-danger">*</span></label>
                <input type="date" v-model="formContract.tgl_kontrak_baru" class="form-control" required />
                <small class="text-muted">Otomatis dari Entry Date (xJoinDate) bila belum pernah diisi.</small>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Tgl Kontrak Akhir <span class="text-danger">*</span></label>
                <input type="date" v-model="formContract.tgl_kontrak_akhir" class="form-control" required />
                <small class="text-muted">Otomatis dari xEDate bila belum pernah diisi.</small>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Nomor Surat PKWT <span class="text-muted fw-normal">(opsional)</span></label>
                <input
                  type="text"
                  v-model="formContract.nomor_suratpkwt"
                  class="form-control"
                  placeholder="cth: 0149"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">Gaji Perjanjian Kontrak <span class="text-muted fw-normal">(opsional)</span></label>
                <div class="input-group">
                  <span class="input-group-text">Rp</span>
                  <input
                    type="number"
                    v-model="formContract.gaji_perjanjiankontrak"
                    class="form-control"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top-0 pt-0">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Batal</button>
            <button type="submit" class="btn btn-success" :disabled="submitLoading" data-bs-dismiss="modal">
              <span v-if="submitLoading" class="spinner-border spinner-border-sm me-1"></span>
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } from "vue";
import axios from "axios";
// 5. IMPORT MODAL JS DIHAPUS

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const hasAccess = ref(false);

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);

// Responsive window width tracking (seperti di idppo)
const windowWidth = ref(window.innerWidth);

// State Tambahan
const loading = ref(false);
const syncLoading = ref(false);
const submitLoading = ref(false);
const downloadAllLoading = ref(false);
const activeTab = ref("active");

// State untuk panel Export Excel (laporan siapa saja yg sudah TTD)
const showExportPanel = ref(false);
const exportExcelLoading = ref(false);
const exportDari = ref("");
const exportSampai = ref("");

const searchInput = ref("");
const searchQuery = ref("");
let searchDebounceTimer = null;
watch(searchInput, (val) => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    searchQuery.value = val;
  }, 350);
});

const selectedItem = ref({});
const formContract = reactive({
  sID: null,
  tgl_kontrak_baru: "",
  tgl_kontrak_akhir: "",
  gaji_perjanjiankontrak: "",
  nomor_suratpkwt: ""
});

// True kalau xEDate hasil sync terbaru berbeda dari tgl_kontrak_akhir yang sudah
// tersimpan sebelumnya -> dipakai buat munculin banner opsi "Pakai xEDate Terbaru"
// di modal (HRD tetap bebas mau ngikutin atau ubah manual).
const xEDateBerubah = ref(false);

// Normalisasi berbagai bentuk string tanggal (ISO dengan/atau tanpa "T", dsb)
// jadi format yyyy-MM-dd yang dipahami <input type="date">.
const toDateInputValue = (val) => {
  if (!val) return "";
  return String(val).split("T")[0];
};

// modalInstance dihapus, ref dibiarkan jika masih dibutuhkan vue (opsional)
const modalContractRef = ref(null);

const columns = [
  { key: "sID", label: "sID", filterable: true, width: "90px" },
  { key: "xNO", label: "No Empl", filterable: true, width: "110px" },
  { key: "xIDNo", label: "No. KTP", filterable: true, width: "160px" },
  { key: "xDimisLabel", label: "Status", filterable: true, width: "110px" },
  { key: "xName", label: "Nama Karyawan", filterable: true, width: "220px" },
  { key: "xJoinDate", label: "Tgl Masuk", filterable: true, width: "130px" },
  { key: "xIDAddr", label: "Alamat KTP", filterable: true, width: "220px" },
  { key: "xNative", label: "Asal Daerah", filterable: true, width: "150px" },
  { key: "xBirth", label: "Tgl Lahir", filterable: false, width: "130px" },
  { key: "xKind", label: "Jenis Kontrak", filterable: true, width: "140px" },
  { key: "xPact", label: "xPact", filterable: true, width: "120px" },
  { key: "xEDate", label: "xEDate", filterable: true, width: "130px" },
  { key: "job", label: "Jabatan", filterable: true, width: "160px" },
  { key: "dept", label: "Departemen", filterable: true, width: "160px" },
  { key: "email", label: "Email", filterable: true, width: "220px" },
  { key: "tgl_kontrak_baru", label: "Kontrak Baru", filterable: false, width: "140px" },
  { key: "tgl_kontrak_akhir", label: "Kontrak Akhir", filterable: false, width: "140px" },
  { key: "nomor_suratpkwt", label: "No. Surat PKWT", filterable: true, width: "160px" },
  { key: "gaji_perjanjiankontrak", label: "Gaji Kontrak", filterable: false, width: "150px" },
  { key: "link_hasil_dokumen", label: "Dokumen", filterable: true, width: "130px" }
];

const FILTERABLE_KEYS = columns.filter((c) => c.filterable).map((c) => c.key);
const MAX_OPTIONS_SHOWN = 150;

// ===== RESIZABLE COLUMNS (drag pinggir kolom kaya di Excel) =====
const MIN_COL_WIDTH = 60;
const noColWidth = ref(55);
const aksiColWidth = ref(110);
const columnWidths = reactive(
  Object.fromEntries(columns.map((c) => [c.key, parseInt(c.width) || 150]))
);

let resizeState = null;

function startResize(event, key) {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth =
    key === "no" ? noColWidth.value : key === "aksi" ? aksiColWidth.value : (columnWidths[key] || 150);

  resizeState = { key, startX, startWidth };
  document.body.classList.add("col-resizing-active");
  window.addEventListener("mousemove", onResizeMove);
  window.addEventListener("mouseup", stopResize);
}

function onResizeMove(event) {
  if (!resizeState) return;
  const delta = event.clientX - resizeState.startX;
  const newWidth = Math.max(MIN_COL_WIDTH, Math.round(resizeState.startWidth + delta));
  const { key } = resizeState;
  if (key === "no") noColWidth.value = newWidth;
  else if (key === "aksi") aksiColWidth.value = newWidth;
  else columnWidths[key] = newWidth;
}

function stopResize() {
  resizeState = null;
  document.body.classList.remove("col-resizing-active");
  window.removeEventListener("mousemove", onResizeMove);
  window.removeEventListener("mouseup", stopResize);
}

const filters = reactive({});
const columnSearch = reactive({});

// Filter range xEDate (Dari - Sampai), terpisah dari filter checkbox kolom lain
const xEDateDari = ref("");
const xEDateSampai = ref("");

const xEDateDalamRentang = (item) => {
  if (!xEDateDari.value && !xEDateSampai.value) return true;
  if (!item.xEDate) return false;
  const tgl = new Date(item.xEDate);
  if (isNaN(tgl.getTime())) return false;
  const tglYMD = `${tgl.getFullYear()}-${String(tgl.getMonth() + 1).padStart(2, "0")}-${String(tgl.getDate()).padStart(2, "0")}`;
  if (xEDateDari.value && tglYMD < xEDateDari.value) return false;
  if (xEDateSampai.value && tglYMD > xEDateSampai.value) return false;
  return true;
};
columns.forEach((col) => {
  filters[col.key] = [];
  columnSearch[col.key] = "";
});

const openFilterKey = ref(null);

const openFilterDropdown = (key) => {
  if (openFilterKey.value === key) {
    openFilterKey.value = null;
    return;
  }
  columnSearch[key] = "";
  loadingOptionsFor.value = key;
  nextTick(() => {
    dynamicOptions[key] = computeOptionsForColumn(key);
    loadingOptionsFor.value = null;
  });
  openFilterKey.value = key;
};

const closeFilterDropdown = () => {
  openFilterKey.value = null;
};

function handleClickOutsideFilter(e) {
  if (openFilterKey.value && !e.target.closest(".filter-th")) {
    openFilterKey.value = null;
  }
  if (showExportPanel.value && !e.target.closest(".dropdown")) {
    showExportPanel.value = false;
  }
}

const getRawValue = (item, key) => {
  if (key === "xDimisLabel") return item.xDimis === 1 ? "Aktif" : "Non-Aktif";
  if (key === "link_hasil_dokumen") return item.link_hasil_dokumen ? "Sudah Ada" : "Belum Ada";
  if (["xJoinDate", "xBirth", "xEDate", "tgl_kontrak_baru", "tgl_kontrak_akhir"].includes(key)) return formatDate(item[key]);
  const v = item[key];
  return v === null || v === undefined || v === "" ? "" : String(v);
};

const dynamicOptions = reactive({});
columns.forEach((col) => (dynamicOptions[col.key] = []));
const loadingOptionsFor = ref(null);

const computeOptionsForColumn = (targetKey) => {
  let base = items.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    base = base.filter(
      (item) =>
        (item.xName && item.xName.toLowerCase().includes(q)) ||
        (item.xNO && String(item.xNO).toLowerCase().includes(q)) ||
        (item.xIDNo && String(item.xIDNo).toLowerCase().includes(q)) ||
        (item.job && item.job.toLowerCase().includes(q)) ||
        (item.dept && item.dept.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q))
    );
  }

  for (const key of FILTERABLE_KEYS) {
    if (key === targetKey) continue;
    const selected = filters[key];
    if (selected && selected.length > 0) {
      const selSet = new Set(selected);
      base = base.filter((item) => selSet.has(getRawValue(item, key)));
    }
  }
  
  base = base.filter(xEDateDalamRentang);
  const counts = new Map();
  for (const item of base) {
    const v = getRawValue(item, targetKey);
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "id", { numeric: true }))
    .map(([value, count]) => ({ value, label: value, count }));
};

const fullOptionCount = (key) => (dynamicOptions[key] || []).length;

const getFilteredOptions = (key) => {
  const opts = dynamicOptions[key] || [];
  const q = (columnSearch[key] || "").toLowerCase().trim();
  const filtered = q ? opts.filter((o) => (o.label || "").toLowerCase().includes(q)) : opts;
  return filtered.slice(0, MAX_OPTIONS_SHOWN);
};

const selectAllInColumn = (key) => {
  const visibleValues = getFilteredOptions(key).map((o) => o.value);
  const merged = new Set([...(filters[key] || []), ...visibleValues]);
  filters[key] = Array.from(merged);
};

const clearColumnFilter = (key) => {
  filters[key] = [];
  columnSearch[key] = "";
};

const clearAllFilters = () => {
  columns.forEach((col) => {
    filters[col.key] = [];
    columnSearch[col.key] = "";
  });
  xEDateDari.value = "";
  xEDateSampai.value = "";
};

const hasActiveFilters = computed(() =>
  columns.some((col) => filters[col.key] && filters[col.key].length > 0) ||
  !!xEDateDari.value || !!xEDateSampai.value
);

watch(
  [searchQuery, filters, xEDateDari, xEDateSampai],
  () => {
    currentPage.value = 1;
  },
  { deep: true }
);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/pkwthrd?status=${activeTab.value}`);
    if (res.data && res.data.success) {
      items.value = res.data.data;
    }
  } catch (error) {
    console.error("Gagal mengambil data karyawan:", error);
    alert("Terjadi kesalahan saat memuat data.");
  } finally {
    loading.value = false;
  }
};

const switchTab = (tab) => {
  activeTab.value = tab;
  clearAllFilters();
  currentPage.value = 1;
  fetchData();
};

const handleSync = async () => {
  if (!confirm("Apakah Anda yakin ingin melakukan sinkronisasi data karyawan dari database HR?")) return;
  syncLoading.value = true;
  try {
    const res = await axios.post(`${API_BASE_URL}/pkwthrd/sync`);
    if (res.data && res.data.success) {
      alert("Sinkronisasi data karyawan berhasil!");
      fetchData();
    }
  } catch (error) {
    console.error("Gagal melakukan sinkronisasi:", error);
    alert("Gagal melakukan sinkronisasi data.");
  } finally {
    syncLoading.value = false;
  }
};

const handleDownloadAll = async () => {
  downloadAllLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/pkwthrd/download-all`, { responseType: "blob" });
    const blob = new Blob([res.data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const disposition = res.headers["content-disposition"];
    const match = disposition && disposition.match(/filename="?([^"]+)"?/);
    a.download = match ? match[1] : `Dokumen_TTD_Kontrak_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Gagal mengunduh seluruh dokumen:", error);
    alert("Gagal mengunduh dokumen. Pastikan sudah ada dokumen yang ter-generate.");
  } finally {
    downloadAllLoading.value = false;
  }
};

const handleExportExcel = async () => {
  if (exportDari.value && exportSampai.value && exportDari.value > exportSampai.value) {
    alert("Tanggal 'Dari' tidak boleh lebih besar dari tanggal 'Sampai'.");
    return;
  }
  exportExcelLoading.value = true;
  try {
    const params = {};
    if (exportDari.value) params.dari = exportDari.value;
    if (exportSampai.value) params.sampai = exportSampai.value;

    const res = await axios.get(`${API_BASE_URL}/pkwthrd/export-excel`, {
      params,
      responseType: "blob"
    });
    const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const disposition = res.headers["content-disposition"];
    const match = disposition && disposition.match(/filename="?([^"]+)"?/);
    a.download = match ? match[1] : `Laporan_TTD_Kontrak_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showExportPanel.value = false;
  } catch (error) {
    console.error("Gagal export laporan Excel:", error);
    alert("Gagal membuat laporan Excel.");
  } finally {
    exportExcelLoading.value = false;
  }
};

// 6. LOGIC POPUP MANUAL DIHAPUS 
const openModalUpdate = (item) => {
  selectedItem.value = item;
  formContract.sID = item.sID;

  const sudahAdaKontrakBaru = !!item.tgl_kontrak_baru;
  const sudahAdaKontrakAkhir = !!item.tgl_kontrak_akhir;

  // Tgl Kontrak Baru: kalau belum pernah diisi HRD, auto-fill dari Entry Date (xJoinDate).
  // Kalau sudah pernah diisi, pakai nilai yang sudah tersimpan (tidak ditimpa otomatis).
  formContract.tgl_kontrak_baru = sudahAdaKontrakBaru
    ? toDateInputValue(item.tgl_kontrak_baru)
    : toDateInputValue(item.xJoinDate);

  // Tgl Kontrak Akhir: kalau belum pernah diisi HRD, auto-fill dari xEDate.
  formContract.tgl_kontrak_akhir = sudahAdaKontrakAkhir
    ? toDateInputValue(item.tgl_kontrak_akhir)
    : toDateInputValue(item.xEDate);

  formContract.gaji_perjanjiankontrak = item.gaji_perjanjiankontrak ?? "";
  formContract.nomor_suratpkwt = item.nomor_suratpkwt ?? "";

  // Kalau sebelumnya sudah pernah diisi TAPI xEDate hasil sync terbaru ternyata beda
  // dari yang tersimpan -> tampilkan opsi ke HRD (manual atau pakai nilai terbaru),
  // jangan langsung ditimpa otomatis.
  xEDateBerubah.value =
    sudahAdaKontrakAkhir &&
    !!item.xEDate &&
    toDateInputValue(item.tgl_kontrak_akhir) !== toDateInputValue(item.xEDate);
  // JS manual dihapus karena sudah di-handle otomatis lewat atribut HTML
};

// Dipanggil dari tombol "Pakai xEDate Terbaru" di banner modal.
const pakaiXEDateTerbaru = () => {
  formContract.tgl_kontrak_akhir = toDateInputValue(selectedItem.value.xEDate);
  xEDateBerubah.value = false;
};

const submitUpdateContract = async () => {
  submitLoading.value = true;
  try {
    const res = await axios.put(`${API_BASE_URL}/pkwthrd/update-contract`, formContract);
    if (res.data && res.data.success) {
      alert("Tanggal kontrak berhasil diperbarui!");
      fetchData();
      // JS hide modal dihapus karena sudah di-handle oleh data-bs-dismiss="modal"
    }
  } catch (error) {
    console.error("Gagal mengupdate tanggal kontrak:", error);
    alert("Gagal mengupdate tanggal kontrak.");
  } finally {
    submitLoading.value = false;
  }
};

const filteredItems = computed(() => {
  let result = items.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (item) =>
        (item.xName && item.xName.toLowerCase().includes(q)) ||
        (item.xNO && String(item.xNO).toLowerCase().includes(q)) ||
        (item.xIDNo && String(item.xIDNo).toLowerCase().includes(q)) ||
        (item.job && item.job.toLowerCase().includes(q)) ||
        (item.dept && item.dept.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q))
    );
  }
  for (const key of FILTERABLE_KEYS) {
    const selected = filters[key];
    if (selected && selected.length > 0) {
      const selSet = new Set(selected);
      result = result.filter((item) => selSet.has(getRawValue(item, key)));
    }
  }
  result = result.filter(xEDateDalamRentang);
  return result;
});

const pageSizeOptions = [50, 100, 200, 300, 400, 500, 700, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
const pageSize = ref(50);
const currentPage = ref(1);

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)));

watch(pageSize, () => { currentPage.value = 1; });
watch(totalPages, (val) => { if (currentPage.value > val) currentPage.value = val; });

const rangeStart = computed(() => filteredItems.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1);
const rangeEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredItems.value.length));

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const slice = filteredItems.value.slice(start, start + pageSize.value);
  return slice.map((item, i) => ({ ...item, __rowNo: start + i + 1 }));
});

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (isNaN(num)) return "-";
  return num.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (e) {
      console.error("Error parsing user data", e);
    }
  }

  try {
    const pagesData = localStorage.getItem("pages") || localStorage.getItem("user_pages");
    const pages = pagesData ? JSON.parse(pagesData) : [];

    // Ganti 'KODE_HALAMAN' sesuai dengan 'code' di database UAC halaman ini
    hasAccess.value = pages.includes("pkwtandtt");
  } catch (e) {
    hasAccess.value = false;
  }

  // 4. Panggil API/fetchData hanya jika user punya akses
  if (hasAccess.value) {
    fetchData();
  }
  //fetchData();
  
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleClickOutsideFilter);
});

onBeforeUnmount(() => {
  clearTimeout(searchDebounceTimer);
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleClickOutsideFilter);
  stopResize();
});
</script>

<style scoped>
.transition-all {
  --hr-navy-900: #101b33;
  --hr-navy-700: #1f3358;
  --hr-navy-600: #2c4a7c;
  --hr-navy-500: #3b5f9e;
  --hr-amber-500: #d98c2b;
  --hr-amber-600: #b8721c;
  --hr-slate-50: #f6f7fb;
  --hr-slate-100: #eef1f7;
  --hr-slate-200: #e2e6ef;
  --hr-slate-500: #6b7385;
  transition: margin-left 0.3s ease-in-out;
}

.font-mono {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.82rem;
  letter-spacing: 0.02em;
}

.page-title-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--hr-navy-700), var(--hr-navy-900));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px -4px rgba(16, 27, 51, 0.45);
}
.page-title-icon i { color: #fff !important; }

.cursor-pointer { cursor: pointer; }

.btn-primary {
  background-color: var(--hr-navy-700) !important;
  border-color: var(--hr-navy-700) !important;
}
.btn-primary:hover:not(:disabled) {
  background-color: var(--hr-navy-900) !important;
  border-color: var(--hr-navy-900) !important;
}
.btn-outline-primary {
  color: var(--hr-navy-700) !important;
  border-color: var(--hr-navy-500) !important;
}
.btn-outline-primary:hover:not(:disabled) {
  background-color: var(--hr-navy-700) !important;
  border-color: var(--hr-navy-700) !important;
  color: #fff !important;
}

.btn-doc {
  background-color: #fdf3e5;
  border: 1px solid #f0d3a3;
  color: var(--hr-amber-600);
  font-weight: 600;
}
.btn-doc:hover {
  background-color: var(--hr-amber-500);
  border-color: var(--hr-amber-500);
  color: #fff;
}

.tab-pill-group .btn-outline-secondary {
  color: var(--hr-slate-500);
  border-color: var(--hr-slate-200);
  background-color: #fff;
}
.tab-pill-group .btn.fw-bold.btn-primary {
  background-color: var(--hr-navy-700);
  border-color: var(--hr-navy-700);
}

.main-row,
.main-content,
.table-card,
.table-card .card-body {
  min-width: 0;
}

.table-scroll-wrapper {
  width: 100%;
  max-width: 100%;
  max-height: 650px;
  overflow-x: auto;
  overflow-y: auto;
  border-radius: 1rem 1rem 0 0;
}

.employee-table {
  width: max-content;
  min-width: 100%;
  table-layout: fixed;
}

.employee-table th,
.employee-table td {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
}

.employee-table tbody td {
  vertical-align: top;
}

.resizable-th {
  position: relative;
  overflow: visible !important;
}

.col-resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 5;
  touch-action: none;
}

.col-resize-handle::after {
  content: "";
  position: absolute;
  top: 0;
  left: 2px;
  width: 2px;
  height: 100%;
  background-color: transparent;
  transition: background-color 0.15s ease;
}

.col-resize-handle:hover::after {
  background-color: var(--hr-navy-500, #3b5f9e);
}

/* Saat sedang di-drag, cegah teks/gambar ikut ke-select */
:global(body.col-resizing-active) {
  cursor: col-resize !important;
  user-select: none !important;
}
:global(body.col-resizing-active) * {
  cursor: col-resize !important;
}

.employee-table thead th {
  position: sticky;
  top: 0; 
  z-index: 3;
  background-color: #f6f7fb;
  border-bottom: 2px solid #1f3358;
  letter-spacing: 0.04em;
  padding-top: 0.85rem;
  padding-bottom: 0.85rem;
  vertical-align: top;
}

.col-label-text {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.employee-table tbody tr:hover { background-color: #f9fafc; }

.sticky-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background-color: #fff;
}

.sticky-col-aksi {
  position: sticky;
  left: 55px;
  z-index: 2;
  background-color: #fff;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.04);
}

thead .sticky-col,
thead .sticky-col-aksi {
  z-index: 4;
  background-color: #f6f7fb;
}

.text-wrap-cell {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: #f1f5f9;
}

.filter-th { position: relative; }

.filter-btn {
  font-size: 0.85rem;
  line-height: 1;
  color: #94a3b8;
}
.filter-btn:hover { color: #2563eb; }

.filter-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: auto;
  width: 250px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 20;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
}

.filter-options {
  max-height: 190px;
  overflow-y: auto;
}

.filter-options .form-check-label { max-width: 190px; }

@media (max-width: 768px) {
  .table-scroll-wrapper { max-height: 500px; }
}
</style>