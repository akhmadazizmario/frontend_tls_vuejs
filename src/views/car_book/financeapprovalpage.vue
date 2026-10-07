<!-- pages/carbook/FinanceApprovalPage.vue -->
<template>
  <div class="d-flex flex-column min-vh-100 approval-shell">
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
        <!-- PAGE HEADER -->
        <div class="page-hero mb-4">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="hero-icon">💰</div>
              <div>
                <h3 class="fw-bold mb-1 text-white">Finance Approval</h3>
                <p class="text-white-50 mb-0 small">
                  Login sebagai <strong class="text-white">{{ user.name }}</strong> ({{ user.nopegawai }}) — Isi kategori biaya &amp; kasbon, lalu setujui.
                </p>
              </div>
            </div>
            <button class="btn btn-light btn-sm fw-semibold shadow-sm" @click="fetchData">
              <span :class="{ 'spin-icon': loading }">🔄</span> Refresh
            </button>
          </div>
        </div>

        <!-- SUMMARY STAT CARDS -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-amber-subtle">🚗</div>
              <div>
                <div class="stat-value">{{ listReguler.length }}</div>
                <div class="stat-label">Sekali Jalan &amp; PP</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-emerald-subtle">📅</div>
              <div>
                <div class="stat-value">{{ listTerjadwal.length }}</div>
                <div class="stat-label">Terjadwal / Dimuka</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-indigo-subtle">💵</div>
              <div>
                <div class="stat-value">Rp {{ formatRupiah(totalKasbonWaiting) }}</div>
                <div class="stat-label">Kasbon Menunggu</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-slate-subtle">📊</div>
              <div>
                <div class="stat-value">{{ listAllBooking.length }}</div>
                <div class="stat-label">Total Booking</div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABS -->
        <ul class="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-4 shadow-sm border">
          <li class="nav-item">
            <button class="nav-item-btn btn btn-sm" :class="activeTab === 'reguler' ? 'btn-primary' : 'btn-light'" @click="activeTab = 'reguler'">
              🚗 Sekali Jalan &amp; PP
              <span class="badge rounded-pill ms-1" :class="activeTab === 'reguler' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'">{{ listReguler.length }}</span>
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-item-btn btn btn-sm" :class="activeTab === 'terjadwal' ? 'btn-primary' : 'btn-light'" @click="activeTab = 'terjadwal'">
              📅 Terjadwal / Booking Dimuka
              <span class="badge rounded-pill ms-1" :class="activeTab === 'terjadwal' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'">{{ listTerjadwal.length }}</span>
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-item-btn btn btn-sm" :class="activeTab === 'laporan' ? 'btn-dark' : 'btn-light'" @click="activeTab = 'laporan'">
              📊 Laporan &amp; Data Seluruh Booking
            </button>
          </li>
        </ul>

        <!-- TAB 1 & 2: WAITING FINANCE -->
        <div v-if="activeTab !== 'laporan'" class="card modern-card border-0">
          <div class="card-header bg-white py-3 border-0">
            <h5 class="fw-bold mb-0 text-dark">
              {{ activeTab === 'reguler' ? 'Menunggu Finance — Sekali Jalan / PP' : 'Menunggu Finance — Terjadwal (Dimuka)' }}
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 modern-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Pemohon</th>
                    <th>Tujuan</th>
                    <th>Mobil</th>
                    <th class="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentTabList.length === 0">
                    <td colspan="5" class="empty-state">
                      <div class="py-5 text-center text-muted">
                        <div class="fs-2 mb-2">🎉</div>
                        Tidak ada booking yang menunggu Finance pada kategori ini.
                      </div>
                    </td>
                  </tr>
                  <template v-for="b in currentTabList" :key="b.id">
                    <tr style="cursor:pointer" @click="toggleExpand(b.id)">
                      <td class="fw-semibold text-primary">{{ b.kode_booking }}</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="avatar-badge">{{ initials(b.pemohon?.name) }}</div>
                          <span>{{ b.pemohon?.name || ('User #' + b.user_id) }}</span>
                        </div>
                      </td>
                      <td>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</td>
                      <td>{{ b.mobil ? `${b.mobil.nama_mobil} (${b.mobil.plat_nomor})` : '-' }}</td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3">
                          {{ expanded === b.id ? 'Tutup' : 'Proses' }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="expanded === b.id">
                      <td colspan="5" class="p-0 border-0">
                        <div class="expand-panel">
                          <!-- DETAIL LENGKAP PERJALANAN -->
                          <h6 class="fw-bold mb-3 text-dark">📋 Detail Perjalanan</h6>
                          <div class="detail-card mb-3">
                            <div class="row g-3">
                              <div class="col-md-4"><small class="text-muted d-block">Nama Pemohon</small><strong>{{ b.pemohon?.name || ('User #' + b.user_id) }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">No. Pegawai</small><strong>{{ b.pemohon?.nopegawai || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Departemen</small><strong>{{ b.pemohon?.dept || '-' }}</strong></div>

                              <div class="col-md-4"><small class="text-muted d-block">Jenis Perjalanan</small><strong>{{ b.jenis_perjalanan || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Dari Lokasi</small><strong>{{ b.dari_lokasi || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Tujuan</small><strong>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</strong></div>

                              <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Berangkat</small><strong>{{ b.tgl_berangkat }} {{ b.jam_berangkat }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Kembali</small><strong>{{ b.tgl_kembali || '-' }} {{ b.jam_kembali || '' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Jumlah Penumpang</small><strong>{{ b.jumlah_org }} orang</strong></div>

                              <div class="col-md-6"><small class="text-muted d-block">Daftar Penumpang</small><strong>{{ b.daftar_penumpang || '-' }}</strong></div>
                              <div class="col-md-3"><small class="text-muted d-block">Mobil</small><strong>{{ b.mobil ? `${b.mobil.nama_mobil} (${b.mobil.plat_nomor})` : 'Belum ditentukan' }}</strong></div>
                              <div class="col-md-3"><small class="text-muted d-block">Driver</small><strong>{{ b.driver?.name || (b.driver_id ? `Driver #${b.driver_id}` : 'Belum ditentukan') }}</strong></div>

                              <div class="col-12"><small class="text-muted d-block">Keperluan / Remark</small><span>{{ b.remark || '-' }}</span></div>
                              <div v-if="b.maps" class="col-12">
                                <small class="text-muted d-block">Maps</small>
                                <a :href="b.maps" target="_blank" rel="noopener">Lihat Lokasi di Peta ↗</a>
                              </div>
                            </div>
                          </div>

                          <!-- BUKTI LAMPIRAN FOTO -->
                          <div class="detail-card mb-3">
                            <h6 class="fw-bold mb-3 text-dark font-sm">📷 Bukti Lampiran Foto</h6>
                            <div v-if="!b.attachments || b.attachments.length === 0" class="text-muted small fst-italic">
                              Belum ada lampiran foto untuk perjalanan ini.
                            </div>
                            <div v-else>
                              <div v-for="(fotos, kategori) in groupAttachments(b.attachments)" :key="kategori" class="mb-3">
                                <div class="text-muted small text-uppercase fw-semibold mb-2">
                                  {{ kategori.replace(/_/g, ' ') }} <span class="text-secondary">({{ fotos.length }})</span>
                                </div>
                                <div class="d-flex flex-wrap gap-2">
                                  <a
                                    v-for="foto in fotos"
                                    :key="foto.id"
                                    :href="getFileUrl(foto.file_path)"
                                    target="_blank"
                                    rel="noopener"
                                    class="attachment-thumb-link"
                                    :title="foto.keterangan || kategori"
                                  >
                                    <img :src="getFileUrl(foto.file_path)" class="attachment-thumb" loading="lazy" alt="" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                          <hr class="my-3" />
                          <div class="row g-3 mb-3">
                            <div class="col-md-6">
                              <label class="form-label fw-semibold small">Kategori Biaya</label>
                              <select class="form-select" v-model="actionForm.kategori_biaya">
                                <option value="">-- pilih --</option>
                                <option value="Cash">Cash</option>
                                <option value="Transfer">Transfer</option>
                              </select>
                            </div>
                            <div class="col-md-6">
                              <label class="form-label fw-semibold small">Nominal Kasbon (Rp)</label>
                              <input type="number" class="form-control" v-model="actionForm.nominal_kasbon" placeholder="0" />
                            </div>
                          </div>
                          <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-success rounded-pill px-4" @click="processFinance(b.id, 'Approved', true)">✅ Approve &amp; Langsung Ready</button>
                            <button class="btn btn-outline-danger rounded-pill px-4" @click="processFinance(b.id, 'Rejected')">❌ Tolak</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: LAPORAN -->
        <div v-else class="card modern-card border-0">
          <div class="card-header bg-white py-3 border-0 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h5 class="fw-bold mb-0 text-dark">📊 Laporan Seluruh Riwayat Booking</h5>
            <div class="d-flex gap-2 flex-wrap">
              <input type="text" class="form-control form-control-sm rounded-pill px-3" style="min-width:220px" v-model="reportFilter.search" placeholder="🔎 Cari Kode/Pemohon/Tujuan..." />
              <select class="form-select form-select-sm rounded-pill" v-model="reportFilter.status">
                <option value="">-- Semua Status --</option>
                <option value="Waiting GA">Waiting GA</option>
                <option value="Waiting Finance">Waiting Finance</option>
                <option value="Waiting Manager">Waiting Manager</option>
                <option value="Ready">Ready</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button class="btn btn-outline-success btn-sm rounded-pill fw-semibold px-3" @click="exportToExcel">
                📥 Export Excel
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 modern-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Pemohon</th>
                    <th>Tipe</th>
                    <th>Tgl Berangkat</th>
                    <th>Tujuan</th>
                    <th>Mobil</th>
                    <th>Driver</th>
                    <th>Kasbon</th>
                    <th>Status</th>
                    <th class="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredReportList.length === 0">
                    <td colspan="10" class="empty-state">
                      <div class="py-5 text-center text-muted">Data riwayat booking tidak ditemukan.</div>
                    </td>
                  </tr>
                  <template v-for="item in filteredReportList" :key="item.id">
                    <tr style="cursor:pointer" @click="toggleReportExpand(item.id)">
                      <td class="fw-bold text-primary">{{ item.kode_booking }}</td>
                      <td>{{ item.pemohon?.name || ('User #' + item.user_id) }}</td>
                      <td><span class="badge bg-secondary-subtle text-secondary border">{{ item.jenis_perjalanan }}</span></td>
                      <td>{{ item.tgl_berangkat }} {{ item.jam_berangkat }}</td>
                      <td>{{ item.master_tujuan?.nama_lokasi || item.lokasi_tujuan_custom || '-' }}</td>
                      <td>{{ item.mobil ? `${item.mobil.nama_mobil} (${item.mobil.plat_nomor})` : '-' }}</td>
                      <td>{{ item.driver?.name || '-' }}</td>
                      <td>Rp {{ formatRupiah(item.nominal_kasbon) }}</td>
                      <td>
                        <span class="badge rounded-pill px-3 py-2" :class="statusBadge(item.status_booking)">{{ item.status_booking }}</span>
                      </td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3">
                          {{ reportExpanded === item.id ? 'Tutup' : 'Detail' }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="reportExpanded === item.id">
                      <td colspan="10" class="p-0 border-0">
                        <div class="expand-panel">
                          <div class="detail-card">
                            <div class="row g-3">
                              <div class="col-md-4"><small class="text-muted d-block">Nama Pemohon</small><strong>{{ item.pemohon?.name || ('User #' + item.user_id) }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">No. Pegawai</small><strong>{{ item.pemohon?.nopegawai || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Departemen</small><strong>{{ item.pemohon?.dept || '-' }}</strong></div>

                              <div class="col-md-4"><small class="text-muted d-block">Jenis Perjalanan</small><strong>{{ item.jenis_perjalanan || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Dari Lokasi</small><strong>{{ item.dari_lokasi || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Tujuan</small><strong>{{ item.master_tujuan?.nama_lokasi || item.lokasi_tujuan_custom || '-' }}</strong></div>

                              <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Berangkat</small><strong>{{ item.tgl_berangkat }} {{ item.jam_berangkat }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Kembali</small><strong>{{ item.tgl_kembali || '-' }} {{ item.jam_kembali || '' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Jumlah Penumpang</small><strong>{{ item.jumlah_org }} orang</strong></div>

                              <div class="col-md-6"><small class="text-muted d-block">Daftar Penumpang</small><strong>{{ item.daftar_penumpang || '-' }}</strong></div>
                              <div class="col-md-3"><small class="text-muted d-block">Mobil</small><strong>{{ item.mobil ? `${item.mobil.nama_mobil} (${item.mobil.plat_nomor})` : '-' }}</strong></div>
                              <div class="col-md-3"><small class="text-muted d-block">Driver</small><strong>{{ item.driver?.name || '-' }}</strong></div>

                              <div class="col-md-6"><small class="text-muted d-block">Kategori Biaya</small><strong>{{ item.kategori_biaya || '-' }}</strong></div>
                              <div class="col-md-6"><small class="text-muted d-block">Nominal Kasbon</small><strong>Rp {{ formatRupiah(item.nominal_kasbon) }}</strong></div>

                              <div class="col-12"><small class="text-muted d-block">Keperluan / Remark</small><span>{{ item.remark || '-' }}</span></div>
                              <div v-if="item.maps" class="col-12">
                                <small class="text-muted d-block">Maps</small>
                                <a :href="item.maps" target="_blank" rel="noopener">Lihat Lokasi di Peta ↗</a>
                              </div>
                            </div>
                          </div>

                          <!-- BUKTI LAMPIRAN FOTO -->
                          <div class="detail-card mt-3">
                            <h6 class="fw-bold mb-3 text-dark font-sm">📷 Bukti Lampiran Foto</h6>
                            <div v-if="!item.attachments || item.attachments.length === 0" class="text-muted small fst-italic">
                              Belum ada lampiran foto untuk perjalanan ini.
                            </div>
                            <div v-else>
                              <div v-for="(fotos, kategori) in groupAttachments(item.attachments)" :key="kategori" class="mb-3">
                                <div class="text-muted small text-uppercase fw-semibold mb-2">
                                  {{ kategori.replace(/_/g, ' ') }} <span class="text-secondary">({{ fotos.length }})</span>
                                </div>
                                <div class="d-flex flex-wrap gap-2">
                                  <a
                                    v-for="foto in fotos"
                                    :key="foto.id"
                                    :href="getFileUrl(foto.file_path)"
                                    target="_blank"
                                    rel="noopener"
                                    class="attachment-thumb-link"
                                    :title="foto.keterangan || kategori"
                                  >
                                    <img :src="getFileUrl(foto.file_path)" class="attachment-thumb" loading="lazy" alt="" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- TOMBOL CETAK SURAT JALAN & DOWNLOAD BARCODE -->
                          <div v-if="['Ready', 'In Transit', 'Completed'].includes(item.status_booking)" class="mt-3 d-flex gap-2 justify-content-end flex-wrap">
                            <button class="btn btn-outline-dark rounded-pill px-4 shadow-sm" @click.stop="downloadBarcode(item)">
                              📱 Download Barcode
                            </button>
                            <button class="btn btn-dark rounded-pill px-4 shadow-sm" @click.stop="cetakSuratJalan(item.id)">
                              🖨️ Cetak Surat Jalan / Tugas
                            </button>
                          </div>

                          <!-- Danger Zone: Hapus Booking -->
                          <div
                            v-if="['Draft', 'Cancelled', 'Completed'].includes(item.status_booking)"
                            class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-3 p-3 rounded-3 border border-danger-subtle bg-danger-subtle bg-opacity-25"
                          >
                            <div class="small">
                              <div class="fw-bold text-danger">Zona Berbahaya</div>
                              <div class="text-muted">
                                Menghapus booking ini akan ikut menghapus settlement, nota BBM, titik perhentian, dan lampiran terkait secara permanen.
                              </div>
                            </div>
                            <button class="btn btn-danger btn-sm fw-medium text-nowrap" @click.stop="hapusBooking(item.id)">
                              🗑️ Hapus Booking Ini
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
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
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx-js-style'
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import Header from '../../components/Header.vue'
import Sidebar from '../../components/Sidebar.vue'
import Footer from '../../components/Footer.vue'
import { useAuthUser } from '../car_book/Useauthuser.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const { user } = useAuthUser()

const sidebarOpen = ref(true)
const windowWidth = ref(window.innerWidth)
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return { headers }
}

const loading = ref(false)
const activeTab = ref('reguler')
const listBookingWaiting = ref([])
const listAllBooking = ref([])
const expanded = ref(null)
const reportExpanded = ref(null)
const actionForm = reactive({ kategori_biaya: '', nominal_kasbon: 0 })
const reportFilter = reactive({ search: '', status: '' })

const toggleExpand = (id) => {
  expanded.value = expanded.value === id ? null : id
  Object.assign(actionForm, { kategori_biaya: '', nominal_kasbon: 0 })
}
const toggleReportExpand = (id) => {
  reportExpanded.value = reportExpanded.value === id ? null : id
}
const formatRupiah = (val) => new Intl.NumberFormat('id-ID').format(val || 0)
const initials = (name) => (name ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?')

// File attachment di-serve dari root server, bukan dari prefix /api.
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const getFileUrl = (path) => (path ? `${SERVER_BASE_URL}${path}` : '')
const groupAttachments = (attachments) => {
  const groups = {}
  for (const foto of attachments || []) {
    const key = foto.kategori_foto || 'Lainnya'
    if (!groups[key]) groups[key] = []
    groups[key].push(foto)
  }
  return groups
}

const listReguler = computed(() => listBookingWaiting.value.filter(b => b.jenis_perjalanan?.toLowerCase() !== 'terjadwal'))
const listTerjadwal = computed(() => listBookingWaiting.value.filter(b => b.jenis_perjalanan?.toLowerCase() === 'terjadwal'))
const currentTabList = computed(() => (activeTab.value === 'reguler' ? listReguler.value : listTerjadwal.value))

const totalKasbonWaiting = computed(() =>
  listBookingWaiting.value.reduce((sum, b) => sum + (Number(b.nominal_kasbon) || 0), 0)
)

const filteredReportList = computed(() => {
  return listAllBooking.value.filter(b => {
    const matchStatus = reportFilter.status ? b.status_booking === reportFilter.status : true
    const search = reportFilter.search.toLowerCase()
    const matchSearch = !search ||
      b.kode_booking?.toLowerCase().includes(search) ||
      b.pemohon?.name?.toLowerCase().includes(search) ||
      b.lokasi_tujuan_custom?.toLowerCase().includes(search) ||
      b.master_tujuan?.nama_lokasi?.toLowerCase().includes(search)
    return matchStatus && matchSearch
  })
})

const statusBadge = (status) => {
  const map = {
    Approved: 'bg-success text-white',
    Completed: 'bg-success text-white',
    Ready: 'bg-info text-dark',
    'Waiting GA': 'bg-warning text-dark',
    'Waiting Finance': 'bg-warning text-dark',
    'Waiting Manager': 'bg-warning text-dark',
    'In Transit': 'bg-info text-dark',
    Cancelled: 'bg-danger text-white',
    Rejected: 'bg-danger text-white'
  }
  return map[status] || 'bg-secondary text-white'
}

const fetchData = async () => {
  loading.value = true
  try {
    const [resWaiting, resAll] = await Promise.all([
      axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params: { status: 'Waiting Finance' } }),
      axios.get(`${API_BASE_URL}/carbook/booking`, getAuthHeaders())
    ])
    listBookingWaiting.value = resWaiting.data.data || []
    listAllBooking.value = resAll.data.data || []
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const processFinance = async (bookingId, keputusan, skipManager = false) => {
  if (
    keputusan === 'Approved' &&
    (!actionForm.kategori_biaya || actionForm.nominal_kasbon === '' || actionForm.nominal_kasbon === null || actionForm.nominal_kasbon === undefined)
  ) {
    alert('Isi kategori biaya terlebih dahulu (nominal kasbon boleh 0 jika perjalanan tidak ada biaya)')
    return
  }
  const confirmMsg = skipManager
    ? 'Yakin menyetujui booking ini dan langsung ke status Ready (TANPA approval Manager)?'
    : `Yakin ${keputusan === 'Approved' ? 'menyetujui' : 'menolak'} booking ini?`
  if (!confirm(confirmMsg)) return
  try {
    await axios.patch(
      `${API_BASE_URL}/carbook/booking/${bookingId}/finance-approval`,
      {
        finance_approver_id: user.value.id,
        keputusan,
        kategori_biaya: actionForm.kategori_biaya,
        nominal_kasbon: actionForm.nominal_kasbon,
        skip_manager: skipManager
      },
      getAuthHeaders()
    )
    alert(skipManager ? 'Booking disetujui & langsung Ready (skip Manager)' : `Approval Finance: ${keputusan}`)
    expanded.value = null
    fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memproses approval finance')
  }
}

// Hapus booking (hanya berlaku untuk status Draft/Cancelled/Completed —
// dibatasi juga di backend). Untuk Completed, backend akan ikut membersihkan
// settlement, nota BBM, titik perhentian & lampiran dalam satu transaksi.
const hapusBooking = async (bookingId) => {
  if (!confirm('Yakin ingin menghapus booking ini SEPENUHNYA? Settlement, nota BBM, titik perhentian, dan lampiran yang terkait akan ikut terhapus permanen dan tidak bisa dikembalikan.')) return
  try {
    await axios.delete(`${API_BASE_URL}/carbook/booking/${bookingId}`, getAuthHeaders())
    alert('Booking berhasil dihapus.')
    reportExpanded.value = null
    fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus booking')
  }
}

const exportToExcel = () => {
  if (!filteredReportList.value.length) {
    alert('Tidak ada data untuk diexport')
    return
  }

  const headers = [
    'Kode Booking', 'Nama Pemohon', 'No. Pegawai', 'Departemen', 'Jenis Perjalanan',
    'Dari Lokasi', 'Tujuan', 'Tgl Berangkat', 'Jam Berangkat', 'Tgl Kembali', 'Jam Kembali',
    'Jumlah Penumpang', 'Daftar Penumpang', 'Mobil', 'Plat Nomor', 'Driver',
    'Kategori Biaya', 'Nominal Kasbon', 'Keperluan', 'Status'
  ]

  const rows = filteredReportList.value.map(item => ([
    item.kode_booking || '-',
    item.pemohon?.name || ('User #' + item.user_id),
    item.pemohon?.nopegawai || '-',
    item.pemohon?.dept || '-',
    item.jenis_perjalanan || '-',
    item.dari_lokasi || '-',
    item.master_tujuan?.nama_lokasi || item.lokasi_tujuan_custom || '-',
    item.tgl_berangkat || '-',
    item.jam_berangkat || '-',
    item.tgl_kembali || '-',
    item.jam_kembali || '-',
    item.jumlah_org || 0,
    item.daftar_penumpang || '-',
    item.mobil?.nama_mobil || '-',
    item.mobil?.plat_nomor || '-',
    item.driver?.name || '-',
    item.kategori_biaya || '-',
    Number(item.nominal_kasbon) || 0,
    item.remark || '-',
    item.status_booking || '-'
  ]))

  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '047857' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } }
    }
  }
  const cellBorder = {
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    }
  }

  headers.forEach((_, colIdx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx })
    if (ws[cellRef]) ws[cellRef].s = headerStyle
  })
  rows.forEach((_, rowIdx) => {
    headers.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx })
      if (ws[cellRef]) ws[cellRef].s = cellBorder
    })
  })

  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }))
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Finance')

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Laporan-Finance-CarBooking-${today}.xlsx`)
}

// Download PDF Barcode (QR Code) booking -- dipakai kalau Finance mau cetak
// barcode-nya langsung di kantor buat ditempel/dibawa driver, tanpa perlu
// buka dari HP driver. Sama persis rendering-nya (QR + label TLSI MOBIL
// di tengah) dengan yang ada di aplikasi mobile driver & GA Approval.
const downloadBarcode = async (item) => {
  try {
    const kodeBooking = item.kode_booking || '-'
    const namaMobil = item.mobil?.nama_mobil || '-'
    const platNomor = item.mobil?.plat_nomor || '-'
    const destination = item.master_tujuan?.nama_lokasi || item.lokasi_tujuan_custom || '-'

    // errorCorrectionLevel 'H' -- tetap bisa discan walau bagian tengah
    // ketutup label teks "TLSI MOBIL"
    const qrDataUrl = await QRCode.toDataURL(kodeBooking, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 500
    })

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6' // ukuran kecil, cocok buat ditempel di dashboard mobil
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const centerX = pageWidth / 2

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('BOOKING MOBIL TLSI', centerX, 15, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(namaMobil, centerX, 22, { align: 'center' })
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(platNomor, centerX, 27, { align: 'center' })
    doc.setTextColor(0)

    // Gambar QR code
    const qrSize = 60
    const qrX = centerX - qrSize / 2
    const qrY = 33
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

    // Kotak putih + label "TLSI MOBIL" di tengah QR
    const boxW = 22
    const boxH = 12
    const boxY = qrY + qrSize / 2 - boxH / 2
    doc.setFillColor(255, 255, 255)
    doc.rect(centerX - boxW / 2, boxY, boxW, boxH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('TLSI', centerX, boxY + 5, { align: 'center' })
    doc.text('MOBIL', centerX, boxY + 9.5, { align: 'center' })

    // Kode booking & info di bawah QR
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(kodeBooking, centerX, qrY + qrSize + 10, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Tujuan: ${destination}`, centerX, qrY + qrSize + 17, { align: 'center' })
    doc.text(`Jadwal: ${item.tgl_berangkat || '-'} ${item.jam_berangkat || ''}`, centerX, qrY + qrSize + 22, { align: 'center' })

    doc.save(`Barcode_${kodeBooking}.pdf`)
  } catch (err) {
    console.error(err)
    alert('Gagal membuat PDF barcode.')
  }
}

// Format tanggal jadi format Indonesia, misal "25 Maret 2026"
const NAMA_BULAN_INDO = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const formatTanggalIndo = (tglStr) => {
  if (!tglStr) return ''
  const d = new Date(tglStr)
  if (isNaN(d.getTime())) return tglStr
  return `${d.getDate()} ${NAMA_BULAN_INDO[d.getMonth()]} ${d.getFullYear()}`
}

const cetakSuratJalan = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/carbook/booking/${id}/surat-jalan`, getAuthHeaders())
    const data = response.data.data

    // Memecah string tanggal dan jam dari API (asumsi format 'YYYY-MM-DD HH:mm')
    const tglBerangkat = data.berangkat ? data.berangkat.split(' ')[0] : ''
    const jamBerangkat = data.berangkat && data.berangkat.split(' ').length > 1 ? data.berangkat.split(' ')[1] : ''
    const tglBerangkatFormatted = formatTanggalIndo(tglBerangkat)

    // Jam/tgl kembali HANYA diisi kalau booking sudah Completed & datanya ada
    // di database (backend sudah menjamin ini lewat field data.kembali).
    // Kalau belum, dikosongin (diisi manual di kertas).
    const sudahSelesai = data.status_booking === 'Completed'
    const kembaliParts = (sudahSelesai && data.kembali) ? data.kembali.split(' ') : []
    const tglKembaliFormatted = kembaliParts.length ? formatTanggalIndo(kembaliParts[0]) : ''
    const jamKembali = kembaliParts.length > 1 ? kembaliParts[1] : ''

    const kembaliText = tglKembaliFormatted
      ? `${tglKembaliFormatted}      jam      ${jamKembali}`
      : `......................      jam      ..........`

    // Inisialisasi jsPDF dengan orientasi landscape, satuan mm, dan ukuran kustom
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [215.9, 139.7]
    })

    // Mendefinisikan Variabel Dimensi
    const pageHeight = 139.7
    const pageWidth = 215.9
    const margin = 5 // Margin 5mm untuk Kiri, Kanan, Atas, Bawah
    const centerX = pageWidth / 2 // Titik tengah X = 107.95

    // PENGATURAN HEADER
    doc.setFont('times', 'bold')
    doc.setFontSize(16)
    // Ditaruh pada Y = 15mm agar ada jarak dari margin atas (5mm)
    doc.text((data.jenis_surat || 'SURAT JALAN').toUpperCase(), centerX, 15, { align: 'center' })

    // SUBTITLE
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text('Dengan ini ditugaskan kepada :', margin, 25)

    // TABEL INFORMASI
    autoTable(doc, {
      startY: 28, // Mulai sedikit di bawah subtitle
      margin: { left: margin, right: margin, top: margin, bottom: margin },
      theme: 'plain',
      styles: {
        font: 'times',
        fontSize: 11,
        cellPadding: 2,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 35 },           // Label
        1: { cellWidth: 5, halign: 'center' }, // Titik dua
        2: { cellWidth: 'auto' }        // Value
      },
      body: [
        ['NIK', ':', data.nik || '-'],
        ['Nama', ':', data.nama || '-'],
        ['Bagian', ':', data.bagian || '-'],
        ['Berangkat', ':', `${tglBerangkatFormatted}      Jam      ${jamBerangkat}      s/d      ${kembaliText}`],
        ['Tujuan', ':', data.tujuan || '-'],
        ['Keperluan', ':', data.keperluan || '-'],
        ['No. Kendaraan', ':', data.no_kendaraan || '-']
      ]
    })

    // TEKS PENUTUP DI BAWAH TABEL
    // doc.lastAutoTable.finalY mengambil koordinat Y terakhir setelah tabel selesai digambar
    let finalY = doc.lastAutoTable.finalY || 80
    // Taruh teks "Demikian..." dengan jarak 8mm dari baris terakhir tabel
    doc.text('Demikian surat tugas ini diberikan untuk dilaksanakan sebagaimana mestinya dan penuh tanggung jawab :', margin, finalY + 8)

    // TANDA TANGAN (SELALU DI FOOTER)
    // Dihitung dari bawah ke atas agar selalu menetap di footer
    const footerY = pageHeight - 32; // Header TTD berada 32mm dari bawah kertas
    const footerNameY = pageHeight - 10; // Nama penandatangan berada 10mm dari bawah kertas (aman dari margin 5mm)

    // Posisi X untuk meratakan 3 kolom tanda tangan
    const col1X = 40;                // Kolom Kiri
    const col2X = centerX;           // Kolom Tengah (107.95)
    const col3X = pageWidth - 40;    // Kolom Kanan

    // Header Tanda Tangan
    doc.setFontSize(11)
    doc.text('Disetujui,', col1X, footerY, { align: 'center' })
    doc.text('Diberi Tugas,', col2X, footerY, { align: 'center' })
    doc.text('Memberi Tugas,', col3X, footerY, { align: 'center' })

    // Nama Penandatangan
    // Disetujui -> jabatan Pimpinan (bukan nama orang)
    // Diberi Tugas -> nama driver yang ditugaskan (data.nama)
    // Memberi Tugas -> selalu "Dian Ramah"
    doc.setFont('times', 'normal')
    doc.text('Pimpinan', col1X, footerNameY, { align: 'center' })
    doc.text(data.nama || '........', col2X, footerNameY, { align: 'center' })
    doc.text('Dian Ramah', col3X, footerNameY, { align: 'center' })

    // Trigger Download PDF Langsung
    doc.save(`Surat_Jalan_${data.nama || id}.pdf`)

  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Gagal mengunduh Surat Jalan dari server.')
  }
}

onMounted(fetchData)
</script>

<style scoped>
.approval-shell { background: #f4f6fb; }

.page-hero {
  background: linear-gradient(135deg, #065f46 0%, #047857 55%, #059669 100%);
  border-radius: 20px;
  padding: 1.75rem 2rem;
  box-shadow: 0 10px 30px -12px rgba(4, 120, 87, 0.4);
}
.hero-icon {
  width: 52px; height: 52px;
  background: rgba(255,255,255,0.15);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 1rem 1.1rem;
  display: flex; align-items: center; gap: 0.85rem;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
  height: 100%;
}
.stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; flex-shrink: 0;
}
.bg-amber-subtle { background: #fef3c7; }
.bg-indigo-subtle { background: #e0e7ff; }
.bg-emerald-subtle { background: #d1fae5; }
.bg-slate-subtle { background: #e2e8f0; }
.stat-value { font-size: 1.2rem; font-weight: 700; color: #1e293b; line-height: 1.1; }
.stat-label { font-size: 0.78rem; color: #64748b; }

.nav-item-btn { font-weight: 600; padding: 7px 16px; border-radius: 10px; }

.modern-card {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 14px rgba(15, 23, 42, 0.06);
}
.modern-table thead {
  background: #f8fafc;
}
.modern-table thead th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  font-weight: 700;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.85rem 1rem;
}
.modern-table tbody td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}
.modern-table tbody tr:hover { background: #f8fafc; }

.avatar-badge {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #047857, #10b981);
  color: #fff; font-size: 0.72rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.expand-panel {
  background: #f8fafc;
  border-top: 1px dashed #e2e8f0;
  padding: 1.25rem 1.5rem;
}

.detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
}

.attachment-thumb-link {
  display: inline-block;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  line-height: 0;
  transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.attachment-thumb-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.attachment-thumb {
  width: 96px;
  height: 96px;
  object-fit: cover;
  display: block;
  background-color: #f1f5f9;
}

.empty-state { border: none; }

.spin-icon { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
</style>