<template>
  <div class="d-flex flex-column min-vh-100 sj-app-bg">
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
      <!-- BUNGKUS DENGAN v-if="hasAccess" UNTUK UAC -->
      <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">
        <div class="container-lg sj-container">

          <!-- ===== Page header ===== -->
          <div class="sj-page-header">
            <div>
              <span class="sj-eyebrow">Expedisi Dept</span>
              <h1 class="sj-title">Daftar Surat Jalan</h1>
              <p class="sj-subtitle">Kelola, cari, dan unduh dokumen surat jalan pengiriman barang.</p>
            </div>
          </div>

          <!-- ===== Toolbar ===== -->
          <div class="sj-toolbar">
            <router-link to="/suratjalan/create" class="sj-btn sj-btn--primary">
              <i class="bi bi-plus-lg"></i> Tambah Surat Jalan Baru
            </router-link>

            <div class="sj-search-box">
              <i class="bi bi-search"></i>
              <input
                v-model="globalSearch"
                type="text"
                placeholder="Cari nomor surat, kirim ke, kendaraan, atau no. polisi..."
                @input="page = 1"
              />
              <button v-if="globalSearch" class="sj-search-clear" @click="globalSearch = ''; page = 1" title="Bersihkan pencarian">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <!-- ===== Export PDF card ===== -->
          <div class="sj-card sj-export-card">
            <div class="sj-export-row">
              <div class="sj-export-field">
                <label class="sj-label">Export PDF berdasarkan Nomor Surat</label>
                <multiselect
                  v-model="selectedNomorSurat"
                  :options="nomorSuratOptions"
                  :multiple="true"
                  :searchable="true"
                  :loading="loadingOptions"
                  :clear-on-select="false"
                  :close-on-select="false"
                  :preserve-search="true"
                  placeholder="Pilih nomor surat..."
                  label="label"
                  track-by="id"
                  @search-change="onSearchChange"
                  class="sj-multiselect"
                >
                  <template #noResult>
                    <span>Tidak ditemukan nomor surat yang cocok.</span>
                  </template>
                </multiselect>
              </div>
              <div class="sj-export-actions">
                <button
                  class="sj-btn sj-btn--success"
                  :disabled="selectedNomorSurat.length === 0"
                  @click="downloadMultiplePdf"
                >
                  <i class="bi bi-file-earmark-pdf"></i> Unduh PDF
                </button>
              </div>
            </div>
          </div>

          <!-- ===== Active filter chips ===== -->
          <div v-if="hasActiveFilters" class="sj-active-filters">
            <span class="sj-active-filters-label"><i class="bi bi-funnel-fill"></i> Filter aktif:</span>

            <span v-if="globalSearch.trim()" class="sj-chip">
              Pencarian: "{{ globalSearch }}"
              <button @click="globalSearch = ''"><i class="bi bi-x"></i></button>
            </span>

            <template v-for="col in columns" :key="'chip-group-' + col.key">
              <span v-for="val in columnFilters[col.key]" :key="col.key + '-' + val" class="sj-chip">
                {{ col.label }}: {{ val }}
                <button @click="toggleCheckbox(col.key, val)"><i class="bi bi-x"></i></button>
              </span>
            </template>

            <button class="sj-chip sj-chip--clear" @click="clearAllFilters">
              <i class="bi bi-x-circle"></i> Hapus semua filter
            </button>
          </div>

          <!-- ===== Table ===== -->
          <div class="sj-card sj-table-card">
            <div class="sj-table-scroll">
              <table class="sj-table">
                <thead>
                  <tr>
                    <th v-for="col in columns" :key="col.key">
                      <div class="sj-th-wrap sj-filter-wrap" :data-col="col.key">
                        <button class="sj-th-label" @click="toggleSort(col.key)" type="button">
                          {{ col.label }}
                          <i
                            v-if="sortState.field === col.key"
                            :class="['bi', sortState.dir === 'asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up']"
                          ></i>
                          <i v-else class="bi bi-arrow-down-up sj-sort-idle"></i>
                        </button>

                        <button
                          class="sj-filter-btn"
                          :class="{ 'sj-filter-btn--active': columnFilters[col.key].length > 0 }"
                          type="button"
                          @click.stop="toggleFilterDropdown(col.key)"
                          :title="'Filter ' + col.label"
                        >
                          <i class="bi bi-funnel-fill"></i>
                          <span v-if="columnFilters[col.key].length" class="sj-filter-count">{{ columnFilters[col.key].length }}</span>
                        </button>

                        <div v-if="openFilterColumn === col.key" class="sj-filter-panel" @click.stop>
                          <div class="sj-filter-panel-search">
                            <i class="bi bi-search"></i>
                            <input v-model="filterSearch[col.key]" type="text" placeholder="Cari nilai..." />
                          </div>
                          <div class="sj-filter-panel-list">
                            <label v-for="opt in filteredOptionsFor(col.key)" :key="opt" class="sj-filter-option">
                              <input
                                type="checkbox"
                                :checked="isChecked(col.key, opt)"
                                @change="toggleCheckbox(col.key, opt)"
                              />
                              <span>{{ opt }}</span>
                            </label>
                            <div v-if="filteredOptionsFor(col.key).length === 0" class="sj-filter-empty">
                              Tidak ada nilai yang cocok
                            </div>
                          </div>
                          <div class="sj-filter-panel-footer">
                            <button class="sj-filter-clear" type="button" @click="clearColumnFilter(col.key)">Kosongkan</button>
                            <button class="sj-filter-done" type="button" @click="closeFilterDropdown">Selesai</button>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th class="sj-th-aksi">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="isLoadingData">
                    <td colspan="7" class="sj-state-cell">
                      <div class="sj-spinner"></div>
                      <span>Memuat data...</span>
                    </td>
                  </tr>
                  <tr v-else-if="paginatedRows.length === 0">
                    <td colspan="7" class="sj-state-cell">
                      <i class="bi bi-inbox sj-empty-icon"></i>
                      <span>{{ hasActiveFilters ? 'Tidak ada data yang cocok dengan filter.' : 'Data kosong' }}</span>
                      <button v-if="hasActiveFilters" class="sj-link-btn" @click="clearAllFilters">Hapus semua filter</button>
                    </td>
                  </tr>
                  <tr v-else v-for="surat in paginatedRows" :key="surat.id" class="sj-row">
                    <td>
                      <span class="sj-code-badge">{{ surat.nomor_surat }}</span>
                    </td>
                    <td class="text-center">{{ formatTanggal(surat.tanggal) }}</td>
                    <td>{{ surat.kirim_ke }}</td>
                    <td>{{ surat.kendaraan }}</td>
                    <td>{{ surat.nopol }}</td>
                    <td :data-order="surat.created_at" class="sj-muted">{{ formatRelativeTime(surat.created_at) }}</td>
                    <td class="text-center text-nowrap">
                      <router-link
                        :to="`/suratjalan/edit/${surat.id}`"
                        class="sj-icon-btn sj-icon-btn--edit"
                        title="Edit Surat Jalan"
                      >
                        <i class="bi bi-pencil-square"></i>
                      </router-link>
                      <button
                        @click="hapusSuratjalan(surat.id)"
                        class="sj-icon-btn sj-icon-btn--danger"
                        title="Hapus Surat Jalan"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- ===== Pagination footer ===== -->
            <div class="sj-table-footer" v-if="!isLoadingData && processedData.length > 0">
              <div class="sj-footer-info">
                Menampilkan {{ pageRangeStart }}&ndash;{{ pageRangeEnd }} dari {{ processedData.length }} data
              </div>
              <div class="sj-footer-controls">
                <select v-model.number="pageSize" class="sj-page-size" @change="page = 1">
                  <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} / halaman</option>
                </select>
                <div class="sj-pagination">
                  <button class="sj-page-btn" :disabled="page === 1" @click="goToPage(1)"><i class="bi bi-chevron-bar-left"></i></button>
                  <button class="sj-page-btn" :disabled="page === 1" @click="goToPage(page - 1)"><i class="bi bi-chevron-left"></i></button>
                  <span class="sj-page-indicator">{{ page }} / {{ totalPages }}</span>
                  <button class="sj-page-btn" :disabled="page === totalPages" @click="goToPage(page + 1)"><i class="bi bi-chevron-right"></i></button>
                  <button class="sj-page-btn" :disabled="page === totalPages" @click="goToPage(totalPages)"><i class="bi bi-chevron-bar-right"></i></button>
                </div>
              </div>
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

    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import Multiselect from 'vue-multiselect'
import Swal from 'sweetalert2'

import Header from '../../components/Header.vue'
import Sidebar from '../../components/Sidebar.vue'
import Footer from '../../components/Footer.vue'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/id'

dayjs.extend(relativeTime)
dayjs.locale('id')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const hasAccess = ref(false);

/* ---------------- layout state ---------------- */
const user = ref({})
const sidebarOpen = ref(false)
const windowWidth = ref(window.innerWidth)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
function onResize() {
  windowWidth.value = window.innerWidth
}
function logout() {
  localStorage.removeItem('user')
  window.location.href = '/login'
}

/* ---------------- main data ---------------- */
const suratjalans = ref([])
const isLoadingData = ref(false)

async function loadSuratjalans() {
  isLoadingData.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/suratjalan`)
    suratjalans.value = res.data
    page.value = 1
  } catch (error) {
    suratjalans.value = []
    console.error('Gagal load surat jalan:', error)
  } finally {
    isLoadingData.value = false
  }
}

function hapusSuratjalan(id) {
  Swal.fire({
    title: 'Yakin?',
    text: 'Data surat jalan akan dihapus permanen!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#10213D',
    cancelButtonColor: '#D8473D',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal',
  }).then((result) => {
    if (result.isConfirmed) {
      axios
        .delete(`${API_BASE_URL}/suratjalan/${id}`)
        .then(() => {
          suratjalans.value = suratjalans.value.filter((s) => s.id !== id)
          Swal.fire('Terhapus!', 'Surat jalan berhasil dihapus.', 'success')
        })
        .catch(() => {
          Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus surat jalan.', 'error')
        })
    }
  })
}

/* ---------------- export nomor surat (multiselect) ---------------- */
const nomorSuratOptions = ref([])
const selectedNomorSurat = ref([])
const loadingOptions = ref(false)

async function loadDefaultOptions() {
  loadingOptions.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/suratjalan/all_nomor`)
    nomorSuratOptions.value = res.data
  } catch (error) {
    nomorSuratOptions.value = []
    console.error('Gagal load default nomor surat:', error)
  } finally {
    loadingOptions.value = false
  }
}

async function onSearchChange(query) {
  if (!query) {
    await loadDefaultOptions()
    return
  }
  loadingOptions.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/suratjalan/search_nomor`, {
      params: { q: query },
    })
    nomorSuratOptions.value = res.data
  } catch (error) {
    nomorSuratOptions.value = []
    console.error('Gagal search nomor surat:', error)
  } finally {
    loadingOptions.value = false
  }
}

async function downloadMultiplePdf() {
  if (selectedNomorSurat.value.length === 0) return
  const nomorParam = selectedNomorSurat.value.map((o) => o.id).join(',')
  const url = `${API_BASE_URL}/suratjalan/export_multiplepdf?nomorsurat=${encodeURIComponent(nomorParam)}`
  window.open(url, '_blank')
}

/* ---------------- formatting helpers ---------------- */
function formatTanggal(tgl) {
  if (!tgl) return '-'
  const d = new Date(tgl)
  return `${String(d.getUTCDate()).padStart(2, '0')} ${d.toLocaleString('id-ID', { month: 'short' })} ${d.getUTCFullYear()}`
}
function formatRelativeTime(date) {
  return dayjs(date).fromNow()
}
function getDibuatBucket(dateStr) {
  if (!dateStr) return 'Lebih lama'
  const d = dayjs(dateStr)
  const now = dayjs()
  if (d.isSame(now, 'day')) return 'Hari ini'
  if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Kemarin'
  if (now.diff(d, 'day') <= 7) return '7 hari terakhir'
  if (now.diff(d, 'day') <= 30) return '30 hari terakhir'
  return 'Lebih lama'
}
const dibuatBucketOrder = ['Hari ini', 'Kemarin', '7 hari terakhir', '30 hari terakhir', 'Lebih lama']

/* ---------------- column config ---------------- */
const columns = [
  { key: 'nomor_surat', label: 'Nomor Surat' },
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'kirim_ke', label: 'Kirim Ke' },
  { key: 'kendaraan', label: 'Kendaraan' },
  { key: 'nopol', label: 'No. Polisi' },
  { key: 'dibuat', label: 'Dibuat' },
]

function getColumnValue(row, key) {
  switch (key) {
    case 'nomor_surat':
      return row.nomor_surat || '-'
    case 'tanggal':
      return formatTanggal(row.tanggal)
    case 'kirim_ke':
      return row.kirim_ke || '-'
    case 'kendaraan':
      return row.kendaraan || '-'
    case 'nopol':
      return row.nopol || '-'
    case 'dibuat':
      return getDibuatBucket(row.created_at)
    default:
      return ''
  }
}

/* ---------------- column filters (checkbox + search) ---------------- */
const globalSearch = ref('')
const columnFilters = reactive({ nomor_surat: [], tanggal: [], kirim_ke: [], kendaraan: [], nopol: [], dibuat: [] })
const filterSearch = reactive({ nomor_surat: '', tanggal: '', kirim_ke: '', kendaraan: '', nopol: '', dibuat: '' })
const openFilterColumn = ref(null)

function toggleFilterDropdown(col) {
  openFilterColumn.value = openFilterColumn.value === col ? null : col
}
function closeFilterDropdown() {
  openFilterColumn.value = null
}
function handleDocClick(e) {
  if (!openFilterColumn.value) return
  const wraps = document.querySelectorAll('.sj-filter-wrap')
  let inside = false
  wraps.forEach((w) => {
    if (w.dataset.col === openFilterColumn.value && w.contains(e.target)) inside = true
  })
  if (!inside) openFilterColumn.value = null
}

function isChecked(col, value) {
  return columnFilters[col].includes(value)
}
function toggleCheckbox(col, value) {
  const idx = columnFilters[col].indexOf(value)
  if (idx === -1) columnFilters[col].push(value)
  else columnFilters[col].splice(idx, 1)
  page.value = 1
}
function clearColumnFilter(col) {
  columnFilters[col] = []
  filterSearch[col] = ''
  page.value = 1
}
function clearAllFilters() {
  Object.keys(columnFilters).forEach((k) => {
    columnFilters[k] = []
    filterSearch[k] = ''
  })
  globalSearch.value = ''
  page.value = 1
}

const activeFilterCount = computed(() =>
  Object.values(columnFilters).reduce((sum, arr) => sum + arr.length, 0)
)
const hasActiveFilters = computed(() => activeFilterCount.value > 0 || globalSearch.value.trim() !== '')

function buildOptions(key) {
  const set = new Set()
  suratjalans.value.forEach((row) => set.add(getColumnValue(row, key)))
  let values = Array.from(set)
  if (key === 'dibuat') {
    values = dibuatBucketOrder.filter((b) => set.has(b))
  } else {
    values.sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }))
  }
  return values
}
const columnOptions = computed(() => {
  const result = {}
  columns.forEach((c) => {
    result[c.key] = buildOptions(c.key)
  })
  return result
})
function filteredOptionsFor(col) {
  const q = filterSearch[col].trim().toLowerCase()
  const opts = columnOptions.value[col] || []
  if (!q) return opts
  return opts.filter((v) => v.toLowerCase().includes(q))
}

/* ---------------- sorting ---------------- */
const sortState = reactive({ field: 'dibuat', dir: 'desc' })
function toggleSort(key) {
  if (sortState.field === key) {
    sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.field = key
    sortState.dir = 'asc'
  }
}
function sortValue(row, key) {
  if (key === 'tanggal') return row.tanggal ? new Date(row.tanggal).getTime() : 0
  if (key === 'dibuat') return row.created_at ? new Date(row.created_at).getTime() : 0
  return (getColumnValue(row, key) || '').toLowerCase()
}

/* ---------------- pipeline: search -> filter -> sort ---------------- */
const processedData = computed(() => {
  let rows = suratjalans.value

  const q = globalSearch.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter((row) =>
      [row.nomor_surat, row.kirim_ke, row.kendaraan, row.nopol].some((v) =>
        (v || '').toLowerCase().includes(q)
      )
    )
  }

  rows = rows.filter((row) =>
    columns.every((c) => {
      const selected = columnFilters[c.key]
      if (!selected.length) return true
      return selected.includes(getColumnValue(row, c.key))
    })
  )

  rows = [...rows].sort((a, b) => {
    const va = sortValue(a, sortState.field)
    const vb = sortValue(b, sortState.field)
    let cmp
    if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb
    else cmp = String(va).localeCompare(String(vb), 'id')
    return sortState.dir === 'asc' ? cmp : -cmp
  })

  return rows
})
const filteredCount = computed(() => processedData.value.length)

/* ---------------- pagination ---------------- */
const page = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50, 100]
const totalPages = computed(() => Math.max(1, Math.ceil(processedData.value.length / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return processedData.value.slice(start, start + pageSize.value)
})
function goToPage(p) {
  if (p >= 1 && p <= totalPages.value) page.value = p
}
const pageRangeStart = computed(() => (processedData.value.length === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const pageRangeEnd = computed(() => Math.min(page.value * pageSize.value, processedData.value.length))

/* ---------------- lifecycle ---------------- */
onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      user.value = JSON.parse(userData);
    } catch (e) {
      console.error("Error parse user data:", e);
    }
  }

  // 2. LOGIKA UAC (Cek apakah user punya akses ke "suratjalan")
  try {
    const pagesData = localStorage.getItem("pages") || localStorage.getItem("user_pages");
    const pages = pagesData ? JSON.parse(pagesData) : [];
    
    // Cek apakah kode halaman "suratjalan" ada di array pages
    hasAccess.value = pages.includes("suratjalan");
  } catch (e) {
    hasAccess.value = false;
  }

  // 3. Hanya panggil API/Load data jika user punya akses
  if (hasAccess.value) {
    loadDefaultOptions();
    loadSuratjalans();
  }
  // loadDefaultOptions()
  // loadSuratjalans()
  window.addEventListener('resize', onResize)
  document.addEventListener('click', handleDocClick)
  // const userData = localStorage.getItem('user')
  // if (userData) user.value = JSON.parse(userData)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  document.removeEventListener('click', handleDocClick)
})
</script>

<style>
@import "vue-multiselect/dist/vue-multiselect.min.css";
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');

/* ============ Design tokens ============ */
:root {
  --sj-navy: #10213d;
  --sj-navy-light: #1b3a63;
  --sj-navy-soft: #eef1f7;
  --sj-amber: #e8a33d;
  --sj-amber-soft: #fcf1de;
  --sj-slate: #64748b;
  --sj-ink: #1a2233;
  --sj-bg: #f4f5f8;
  --sj-surface: #ffffff;
  --sj-border: #e4e7ec;
  --sj-success: #1f9d6b;
  --sj-success-soft: #e7f7f0;
  --sj-danger: #d8473d;
  --sj-danger-soft: #fbeae8;
  --sj-radius: 14px;
  --sj-font-display: 'Sora', sans-serif;
  --sj-font-body: 'Inter', sans-serif;
  --sj-font-mono: 'JetBrains Mono', monospace;
}

.sj-app-bg {
  background-color: var(--sj-bg);
  font-family: var(--sj-font-body);
  color: var(--sj-ink);
}
.sj-container {
  max-width: 1180px;
}

/* ============ Page header ============ */
.sj-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}
.sj-eyebrow {
  display: inline-block;
  font-family: var(--sj-font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sj-amber);
  background: var(--sj-navy);
  padding: 0.3rem 0.75rem;
  border-radius: 50rem;
  margin-bottom: 0.6rem;
}
.sj-title {
  font-family: var(--sj-font-display);
  font-weight: 800;
  font-size: 2rem;
  color: var(--sj-navy);
  margin: 0 0 0.35rem;
  letter-spacing: -0.01em;
}
.sj-subtitle {
  color: var(--sj-slate);
  margin: 0;
  font-size: 0.95rem;
}
.sj-stats {
  display: flex;
  gap: 0.75rem;
}
.sj-stat-card {
  background: var(--sj-surface);
  border: 1px solid var(--sj-border);
  border-radius: var(--sj-radius);
  padding: 0.65rem 1.25rem;
  min-width: 108px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 1px 2px rgba(16, 33, 61, 0.04);
}
.sj-stat-card--accent {
  background: var(--sj-navy);
  border-color: var(--sj-navy);
}
.sj-stat-value {
  font-family: var(--sj-font-display);
  font-weight: 800;
  font-size: 1.4rem;
  color: var(--sj-navy);
  line-height: 1.1;
}
.sj-stat-card--accent .sj-stat-value {
  color: var(--sj-amber);
}
.sj-stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sj-slate);
  margin-top: 0.2rem;
}
.sj-stat-card--accent .sj-stat-label {
  color: #c8d2e5;
}

/* ============ Toolbar ============ */
.sj-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}
.sj-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--sj-font-body);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.6rem 1.25rem;
  border-radius: 50rem;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  text-decoration: none;
}
.sj-btn:hover {
  transform: translateY(-1px);
}
.sj-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.sj-btn--primary {
  background: var(--sj-navy);
  color: #fff;
  box-shadow: 0 4px 10px rgba(16, 33, 61, 0.25);
}
.sj-btn--primary:hover {
  background: var(--sj-navy-light);
  color: #fff;
}
.sj-btn--success {
  background: var(--sj-success);
  color: #fff;
  box-shadow: 0 4px 10px rgba(31, 157, 107, 0.25);
}
.sj-btn--success:hover {
  background: #1a8a5d;
  color: #fff;
}

.sj-search-box {
  flex: 1 1 320px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--sj-surface);
  border: 1px solid var(--sj-border);
  border-radius: 50rem;
  padding: 0.55rem 1rem;
  min-width: 260px;
}
.sj-search-box i.bi-search {
  color: var(--sj-slate);
}
.sj-search-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.9rem;
  background: transparent;
  color: var(--sj-ink);
}
.sj-search-clear {
  border: none;
  background: var(--sj-navy-soft);
  color: var(--sj-slate);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  cursor: pointer;
}

/* ============ Cards ============ */
.sj-card {
  background: var(--sj-surface);
  border: 1px solid var(--sj-border);
  border-radius: var(--sj-radius);
  box-shadow: 0 1px 3px rgba(16, 33, 61, 0.05);
  margin-bottom: 1.25rem;
}
.sj-export-card {
  padding: 1.1rem 1.25rem;
}
.sj-export-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}
.sj-export-field {
  flex: 1 1 320px;
}
.sj-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--sj-navy);
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.sj-export-actions {
  flex-shrink: 0;
}

.sj-multiselect .multiselect__tags {
  border: 1px solid var(--sj-border);
  border-radius: 10px;
  padding: 8px 40px 0 8px;
  min-height: 42px;
}
.sj-multiselect .multiselect__tag {
  background: var(--sj-navy);
  border-radius: 6px;
}
.sj-multiselect .multiselect__tag-icon:after {
  color: #fff;
}
.sj-multiselect .multiselect__tag-icon:focus,
.sj-multiselect .multiselect__tag-icon:hover {
  background: var(--sj-navy-light);
}
.sj-multiselect .multiselect__option--highlight {
  background: var(--sj-navy);
}
.sj-multiselect .multiselect__option--highlight:after {
  background: var(--sj-navy);
}

/* ============ Active filter chips ============ */
.sj-active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.7rem 0.9rem;
  background: var(--sj-amber-soft);
  border: 1px solid #f2ddb0;
  border-radius: 12px;
}
.sj-active-filters-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--sj-navy);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.sj-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #fff;
  border: 1px solid var(--sj-border);
  color: var(--sj-navy);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.28rem 0.7rem;
  border-radius: 50rem;
}
.sj-chip button {
  border: none;
  background: transparent;
  color: var(--sj-slate);
  padding: 0;
  line-height: 1;
  cursor: pointer;
  display: flex;
}
.sj-chip button:hover {
  color: var(--sj-danger);
}
.sj-chip--clear {
  background: var(--sj-navy);
  color: #fff;
  border-color: var(--sj-navy);
  cursor: pointer;
  font-weight: 600;
}
.sj-chip--clear:hover {
  background: var(--sj-navy-light);
}

/* ============ Table ============ */
.sj-table-card {
  overflow: visible;
}
.sj-table-scroll {
  overflow-x: auto;
  max-height: 68vh;
  overflow-y: auto;
  border-radius: var(--sj-radius) var(--sj-radius) 0 0;
}
.sj-table {
  width: 100%;
  min-width: 900px;
  border-collapse: separate;
  border-spacing: 0;
}
.sj-table thead {
  position: sticky;
  top: 0;
  z-index: 5;
}
.sj-table thead th {
  background: var(--sj-navy-soft);
  border-bottom: 2px solid var(--sj-border);
  padding: 0;
  text-align: left;
}
.sj-th-aksi {
  text-align: center !important;
  font-family: var(--sj-font-display);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sj-slate);
  padding: 0.85rem 0.75rem !important;
  min-width: 120px;
}

.sj-th-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.5rem 0.5rem 0.9rem;
}
.sj-th-label {
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--sj-font-display);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sj-navy);
  padding: 0.35rem 0.2rem;
  cursor: pointer;
  white-space: nowrap;
}
.sj-th-label i {
  font-size: 0.72rem;
  color: var(--sj-amber);
}
.sj-sort-idle {
  color: var(--sj-border) !important;
}
.sj-th-label:hover .sj-sort-idle {
  color: var(--sj-slate) !important;
}

.sj-filter-btn {
  border: none;
  background: transparent;
  color: var(--sj-slate);
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
}
.sj-filter-btn:hover {
  background: #e2e6ee;
  color: var(--sj-navy);
}
.sj-filter-btn--active {
  color: var(--sj-navy);
  background: var(--sj-amber-soft);
}
.sj-filter-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--sj-amber);
  color: var(--sj-navy);
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 15px;
  height: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
}

.sj-filter-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 240px;
  background: #fff;
  border: 1px solid var(--sj-border);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(16, 33, 61, 0.18);
  z-index: 30;
  overflow: hidden;
  text-transform: none;
}
.sj-filter-panel-search {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid var(--sj-border);
}
.sj-filter-panel-search i {
  color: var(--sj-slate);
  font-size: 0.8rem;
}
.sj-filter-panel-search input {
  border: none;
  outline: none;
  font-size: 0.82rem;
  flex: 1;
  font-weight: 400;
  color: var(--sj-ink);
}
.sj-filter-panel-list {
  max-height: 210px;
  overflow-y: auto;
  padding: 0.35rem 0;
}
.sj-filter-option {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.83rem;
  font-weight: 400;
  color: var(--sj-ink);
  cursor: pointer;
}
.sj-filter-option:hover {
  background: var(--sj-navy-soft);
}
.sj-filter-option input {
  accent-color: var(--sj-navy);
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.sj-filter-option span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sj-filter-empty {
  padding: 0.6rem 0.8rem;
  font-size: 0.8rem;
  color: var(--sj-slate);
  font-weight: 400;
}
.sj-filter-panel-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--sj-border);
  padding: 0.5rem 0.6rem;
}
.sj-filter-clear,
.sj-filter-done {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
}
.sj-filter-clear {
  color: var(--sj-danger);
}
.sj-filter-clear:hover {
  background: var(--sj-danger-soft);
}
.sj-filter-done {
  color: #fff;
  background: var(--sj-navy);
}
.sj-filter-done:hover {
  background: var(--sj-navy-light);
}

/* ---- rows ---- */
.sj-table tbody td {
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid var(--sj-border);
  font-size: 0.88rem;
  color: var(--sj-ink);
  vertical-align: middle;
}
.sj-row:hover td {
  background: var(--sj-navy-soft);
}
.sj-code-badge {
  font-family: var(--sj-font-mono);
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--sj-navy);
  background: var(--sj-amber-soft);
  border: 1px solid #f0dcae;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  white-space: nowrap;
}
.sj-muted {
  color: var(--sj-slate);
  font-size: 0.82rem;
}

.sj-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  margin: 0 2px;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.85rem;
  transition: transform 0.15s ease;
}
.sj-icon-btn:hover {
  transform: translateY(-1px);
}
.sj-icon-btn--edit {
  background: var(--sj-amber-soft);
  color: #a56a12;
}
.sj-icon-btn--edit:hover {
  background: var(--sj-amber);
  color: #fff;
}
.sj-icon-btn--danger {
  background: var(--sj-danger-soft);
  color: var(--sj-danger);
}
.sj-icon-btn--danger:hover {
  background: var(--sj-danger);
  color: #fff;
}

/* ---- state cells ---- */
.sj-state-cell {
  text-align: center;
  padding: 3rem 1rem !important;
  color: var(--sj-slate);
  display: table-cell;
}
.sj-state-cell span,
.sj-state-cell .sj-spinner,
.sj-state-cell .sj-empty-icon {
  display: block;
  margin: 0 auto 0.5rem;
}
.sj-empty-icon {
  font-size: 2.2rem;
  color: var(--sj-border);
}
.sj-link-btn {
  border: none;
  background: none;
  color: var(--sj-navy);
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 0.4rem;
}
.sj-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--sj-border);
  border-top-color: var(--sj-navy);
  border-radius: 50%;
  animation: sj-spin 0.7s linear infinite;
}
@keyframes sj-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============ Table footer / pagination ============ */
.sj-table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-top: 1px solid var(--sj-border);
}
.sj-footer-info {
  font-size: 0.82rem;
  color: var(--sj-slate);
}
.sj-footer-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.sj-page-size {
  border: 1px solid var(--sj-border);
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  font-size: 0.82rem;
  color: var(--sj-ink);
  background: #fff;
}
.sj-pagination {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.sj-page-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--sj-border);
  background: #fff;
  color: var(--sj-navy);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.78rem;
}
.sj-page-btn:hover:not(:disabled) {
  background: var(--sj-navy);
  color: #fff;
  border-color: var(--sj-navy);
}
.sj-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.sj-page-indicator {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--sj-navy);
  padding: 0 0.4rem;
  white-space: nowrap;
}

/* ============ Responsiveness ============ */
@media (max-width: 767.98px) {
  main.p-3.p-md-5 {
    padding: 1rem !important;
  }
  .sj-page-header {
    align-items: flex-start;
  }
  .sj-title {
    font-size: 1.5rem;
  }
  .sj-stats {
    width: 100%;
  }
  .sj-stat-card {
    flex: 1;
  }
  .sj-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .sj-btn {
    justify-content: center;
  }
  .sj-export-row {
    flex-direction: column;
    align-items: stretch;
  }
  .sj-export-actions .sj-btn {
    width: 100%;
  }
  .sj-table-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .sj-footer-controls {
    justify-content: space-between;
  }
}
</style>