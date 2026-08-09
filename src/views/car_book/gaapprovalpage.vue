<!-- pages/carbook/GaApprovalPage.vue -->
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
              <div class="hero-icon">🏢</div>
              <div>
                <h3 class="fw-bold mb-1 text-white">GA Approval &amp; Laporan Fleet</h3>
                <p class="text-white-50 mb-0 small">
                  Login sebagai <strong class="text-white">{{ user.name }}</strong> ({{ user.nopegawai }}) — Kelola persetujuan armada dan laporan seluruh booking.
                </p>
              </div>
            </div>
            <button class="btn btn-light btn-sm fw-semibold shadow-sm" @click="fetchData">
              <span :class="{ 'spin-icon': loading }">🔄</span> Refresh Data
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
              <div class="stat-icon bg-indigo-subtle">📅</div>
              <div>
                <div class="stat-value">{{ listTerjadwal.length }}</div>
                <div class="stat-label">Terjadwal / Dimuka</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="stat-card">
              <div class="stat-icon bg-emerald-subtle">🚙</div>
              <div>
                <div class="stat-value">{{ listMobil.filter(m => m.status === 'Tersedia').length }}</div>
                <div class="stat-label">Mobil Tersedia</div>
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

        <!-- NAVIGATION TABS -->
        <ul class="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-4 shadow-sm border">
          <li class="nav-item">
            <button
              class="nav-item-btn btn btn-sm"
              :class="activeTab === 'reguler' ? 'btn-primary' : 'btn-light'"
              @click="activeTab = 'reguler'"
            >
              🚗 Sekali Jalan &amp; PP
              <span class="badge rounded-pill ms-1" :class="activeTab === 'reguler' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'">{{ listReguler.length }}</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-item-btn btn btn-sm"
              :class="activeTab === 'terjadwal' ? 'btn-primary' : 'btn-light'"
              @click="activeTab = 'terjadwal'"
            >
              📅 Terjadwal / Booking Dimuka
              <span class="badge rounded-pill ms-1" :class="activeTab === 'terjadwal' ? 'bg-white text-primary' : 'bg-secondary-subtle text-secondary'">{{ listTerjadwal.length }}</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-item-btn btn btn-sm"
              :class="activeTab === 'laporan' ? 'btn-dark' : 'btn-light'"
              @click="activeTab = 'laporan'"
            >
              📊 Laporan &amp; Data seluruh Booking
            </button>
          </li>
        </ul>

        <!-- TAB 1 & 2: TABEL WAITING GA (REGULER & TERJADWAL) -->
        <div v-if="activeTab !== 'laporan'" class="card modern-card border-0">
          <div class="card-header bg-white py-3 border-0">
            <h5 class="fw-bold mb-0 text-dark">
              {{ activeTab === 'reguler' ? 'Daftar Booking Reguler (Sekali Jalan / PP)' : 'Daftar Booking Terjadwal (Dimuka)' }}
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 modern-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Pemohon</th>
                    <th>Jns Perjalanan</th>
                    <th>Tgl Berangkat</th>
                    <th>Tujuan</th>
                    <th>Jml Org</th>
                    <th class="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="currentTabList.length === 0">
                    <td colspan="7" class="empty-state">
                      <div class="py-5 text-center text-muted">
                        <div class="fs-2 mb-2">🎉</div>
                        Tidak ada pengajuan pada kategori ini.
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
                      <td>
                        <span class="badge bg-info-subtle text-info border">{{ b.jenis_perjalanan }}</span>
                      </td>
                      <td>{{ b.tgl_berangkat }} {{ b.jam_berangkat }}</td>
                      <td>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</td>
                      <td>{{ b.jumlah_org }}</td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3">
                          {{ expanded === b.id ? 'Tutup' : 'Detail & Approve' }}
                        </button>
                      </td>
                    </tr>

                    <!-- EXPANDED DETAIL & APPROVAL FORM -->
                    <tr v-if="expanded === b.id">
                      <td colspan="7" class="p-0 border-0">
                        <div class="expand-panel">
                          <!-- DETAIL LENGKAP PERJALANAN -->
                          <h6 class="fw-bold mb-3 text-dark">📋 Detail Perjalanan</h6>
                          <div class="detail-card mb-3">
                            <div class="row g-3">
                              <div class="col-md-4"><small class="text-muted d-block">Nama Pemohon</small><strong>{{ b.pemohon?.name || ('User #' + b.user_id) }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">No. Pegawai</small><strong>{{ b.pemohon?.nopegawai || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Departemen Pemohon</small><strong>{{ b.pemohon?.dept || '-' }}</strong></div>

                              <div class="col-md-4"><small class="text-muted d-block">Jenis Perjalanan</small><strong>{{ b.jenis_perjalanan || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Dari Lokasi</small><strong>{{ b.dari_lokasi || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Tujuan</small><strong>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</strong></div>

                              <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Berangkat</small><strong>{{ b.tgl_berangkat }} {{ b.jam_berangkat }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Kembali</small><strong>{{ b.tgl_kembali || '-' }} {{ b.jam_kembali || '' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Jumlah Penumpang</small><strong>{{ b.jumlah_org }} orang</strong></div>

                              <div class="col-md-8"><small class="text-muted d-block">Daftar Penumpang</small><strong>{{ b.daftar_penumpang || '-' }}</strong></div>
                              <div class="col-md-4"><small class="text-muted d-block">Mobil &amp; Driver Saat Ini</small><strong>{{ b.mobil ? `${b.mobil.nama_mobil} (${b.mobil.plat_nomor})` : 'Belum ditentukan' }} — {{ b.driver?.name || (b.driver_id ? `Driver #${b.driver_id}` : 'Belum ditentukan') }}</strong></div>

                              <div class="col-12"><small class="text-muted d-block">Keperluan / Remark</small><span>{{ b.remark || '-' }}</span></div>
                              <div v-if="b.maps" class="col-12">
                                <small class="text-muted d-block">Maps</small>
                                <a :href="b.maps" target="_blank" rel="noopener">Lihat Lokasi di Peta ↗</a>
                              </div>
                            </div>
                          </div>

                          <hr class="my-3" />

                          <!-- WARNING UNTUK TAB TERJADWAL JIKA BELUM HARI H -->
                          <div v-if="isScheduledNotReady(b)" class="alert alert-warning d-flex align-items-center gap-2 mb-3 rounded-3">
                            <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                            <div>
                              <strong>Tanggal Keberangkatan Belum Tiba!</strong>
                              <p class="mb-0 small">Booking ini terjadwal untuk tanggal <strong>{{ b.tgl_berangkat }}</strong>. Approval dan penunjukkan armada/driver baru dapat dilakukan saat tanggal tersebut tiba.</p>
                            </div>
                          </div>

                          <h6 class="fw-bold mb-3">Tunjuk Armada &amp; Driver</h6>
                          <div class="row g-3 mb-3">
                            <!-- PILIH MOBIL -->
                            <div class="col-md-6">
                              <label class="form-label fw-medium small">Pilih Mobil (Status Tersedia) <span class="text-danger">*</span></label>
                              <select class="form-select" v-model="actionForm.mobil_id" :disabled="isScheduledNotReady(b)">
                                <option value="" disabled>-- pilih mobil --</option>
                                <option v-for="m in listMobil.filter(m => m.status === 'Tersedia')" :key="m.id" :value="m.id">
                                  {{ m.nama_mobil }} - {{ m.plat_nomor }}
                                </option>
                              </select>
                            </div>

                            <!-- PILIH DRIVER -->
                            <div class="col-md-6">
                              <label class="form-label fw-medium small">Pilih Driver <span class="text-danger">*</span></label>
                              <select class="form-select" v-model="actionForm.driver_id" :disabled="isScheduledNotReady(b)">
                                <option value="" disabled>-- pilih driver --</option>
                                <option v-if="listDriver.length === 0" value="" disabled>Tidak ada driver ditemukan</option>
                                <option v-for="d in listDriver" :key="d.id" :value="d.id">
                                  {{ d.name }} (No. Peg: {{ d.nopegawai || '-' }})
                                </option>
                              </select>
                            </div>

                            <!-- PILIHAN ALUR APPROVAL -->
                            <div class="col-12 mt-3">
                              <label class="form-label fw-medium small">Lanjutkan Status Ke: <span class="text-danger">*</span></label>
                              <div class="d-flex flex-wrap gap-4 p-3 bg-white rounded border">
                                <div class="form-check">
                                  <input 
                                    class="form-check-input" 
                                    type="radio" 
                                    name="next_step_option" 
                                    id="stepFinance" 
                                    value="finance" 
                                    v-model="actionForm.next_step"
                                    :disabled="isScheduledNotReady(b)"
                                  >
                                  <label class="form-check-label small fw-semibold" for="stepFinance">
                                    💰 Langsung ke Finance <span class="text-muted fw-normal">(Waiting Finance)</span>
                                  </label>
                                </div>
                                <div class="form-check">
                                  <input 
                                    class="form-check-input" 
                                    type="radio" 
                                    name="next_step_option" 
                                    id="stepManager" 
                                    value="manager" 
                                    v-model="actionForm.next_step"
                                    :disabled="isScheduledNotReady(b)"
                                  >
                                  <label class="form-check-label small fw-semibold" for="stepManager">
                                    👔 Ke Manager <span class="text-muted fw-normal">(Waiting Manager)</span>
                                  </label>
                                </div>
                                <div class="form-check">
                                  <input 
                                    class="form-check-input" 
                                    type="radio" 
                                    name="next_step_option" 
                                    id="stepReady" 
                                    value="ready" 
                                    v-model="actionForm.next_step"
                                    :disabled="isScheduledNotReady(b)"
                                  >
                                  <label class="form-check-label small fw-semibold" for="stepReady">
                                    ⚡ Bypass All (Langsung Ready untuk Perjalanan)
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div class="d-flex gap-2 mt-3">
                            <button
                              class="btn btn-success rounded-pill px-4"
                              @click="processGA(b.id, 'Approved')"
                              :disabled="isScheduledNotReady(b)"
                            >
                              ✅ Approve &amp; Assign Armada
                            </button>
                            <button class="btn btn-outline-danger rounded-pill px-4" @click="processGA(b.id, 'Rejected')">
                              ❌ Tolak Booking
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

        <!-- TAB 3: DATATABLE LAPORAN -->
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
                    <th>Mobil &amp; Plat</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th class="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredReportList.length === 0">
                    <td colspan="9" class="empty-state">
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
                      <td>{{ item.driver?.name || getDriverName(item.driver_id) }}</td>
                      <td>
                        <span class="badge rounded-pill px-3 py-2" :class="statusBadge(item.status_booking)">
                          {{ item.status_booking }}
                        </span>
                      </td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3">
                          {{ reportExpanded === item.id ? 'Tutup' : 'Detail' }}
                        </button>
                      </td>
                    </tr>
                    <tr v-if="reportExpanded === item.id">
                      <td colspan="9" class="p-0 border-0">
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
                              <div class="col-md-3"><small class="text-muted d-block">Driver</small><strong>{{ item.driver?.name || getDriverName(item.driver_id) }}</strong></div>

                              <div class="col-12"><small class="text-muted d-block">Keperluan / Remark</small><span>{{ item.remark || '-' }}</span></div>
                              <div v-if="item.maps" class="col-12">
                                <small class="text-muted d-block">Maps</small>
                                <a :href="item.maps" target="_blank" rel="noopener">Lihat Lokasi di Peta ↗</a>
                              </div>
                            </div>
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
const listMobil = ref([])
const listDriver = ref([])

const expanded = ref(null)
const reportExpanded = ref(null)
const actionForm = reactive({ 
  mobil_id: '', 
  driver_id: '',
  next_step: 'finance'
})

const reportFilter = reactive({ search: '', status: '' })

const toggleReportExpand = (id) => {
  reportExpanded.value = reportExpanded.value === id ? null : id
}

const initials = (name) => (name ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?')

const todayDate = computed(() => new Date().toISOString().slice(0, 10))
const isScheduledNotReady = (booking) => {
  if (booking.jenis_perjalanan?.toLowerCase() !== 'terjadwal') return false
  return booking.tgl_berangkat > todayDate.value
}

const listReguler = computed(() => {
  return listBookingWaiting.value.filter(b => b.jenis_perjalanan?.toLowerCase() !== 'terjadwal')
})

const listTerjadwal = computed(() => {
  return listBookingWaiting.value.filter(b => b.jenis_perjalanan?.toLowerCase() === 'terjadwal')
})

const currentTabList = computed(() => {
  return activeTab.value === 'reguler' ? listReguler.value : listTerjadwal.value
})

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

const getDriverName = (driverId) => {
  if (!driverId) return '-'
  const d = listDriver.value.find(item => item.id === driverId)
  return d ? d.name : `Driver #${driverId}`
}

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

const toggleExpand = (id) => {
  expanded.value = expanded.value === id ? null : id
  Object.assign(actionForm, { mobil_id: '', driver_id: '', next_step: 'finance' })
}

const fetchData = async () => {
  loading.value = true
  try {
    const [resWaiting, resAll, resMobil, resUser] = await Promise.all([
      axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params: { status: 'Waiting GA' } }),
      axios.get(`${API_BASE_URL}/carbook/booking`, getAuthHeaders()),
      axios.get(`${API_BASE_URL}/carbook/mobil`, getAuthHeaders()),
      axios.get(`${API_BASE_URL}/users`, getAuthHeaders())
    ])

    listBookingWaiting.value = resWaiting.data.data || []
    listAllBooking.value = resAll.data.data || []
    listMobil.value = resMobil.data.data || []

    const rawUsers = resUser.data.data || resUser.data || []
    listDriver.value = rawUsers.filter(u => u.dept && u.dept.toString().trim().toLowerCase() === 'driver')

  } catch (err) {
    console.error('Gagal mengambil data GA:', err)
  } finally {
    loading.value = false
  }
}

const processGA = async (bookingId, keputusan) => {
  if (keputusan === 'Approved' && (!actionForm.mobil_id || !actionForm.driver_id)) {
    alert('Pilih mobil dan driver terlebih dahulu!')
    return
  }

  if (!confirm(`Yakin ingin ${keputusan === 'Approved' ? 'menyetujui' : 'menolak'} booking ini?`)) return

  try {
    await axios.patch(
      `${API_BASE_URL}/carbook/booking/${bookingId}/ga-approval`,
      {
        ga_approver_id: user.value.id,
        keputusan,
        mobil_id: actionForm.mobil_id,
        driver_id: actionForm.driver_id,
        next_step: actionForm.next_step
      },
      getAuthHeaders()
    )
    alert(`Booking berhasil di-${keputusan === 'Approved' ? 'setujui' : 'tolak'}`)
    expanded.value = null
    fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memproses approval GA')
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
    'Keperluan', 'Status'
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
    item.driver?.name || getDriverName(item.driver_id),
    item.remark || '-',
    item.status_booking || '-'
  ]))

  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '9a3412' } },
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
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan GA')

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Laporan-GA-CarBooking-${today}.xlsx`)
}

onMounted(fetchData)
</script>

<style scoped>
.approval-shell { background: #f4f6fb; }

.page-hero {
  background: linear-gradient(135deg, #7c2d12 0%, #9a3412 55%, #c2410c 100%);
  border-radius: 20px;
  padding: 1.75rem 2rem;
  box-shadow: 0 10px 30px -12px rgba(154, 52, 18, 0.4);
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
.stat-value { font-size: 1.35rem; font-weight: 700; color: #1e293b; line-height: 1.1; }
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
  background: linear-gradient(135deg, #c2410c, #f97316);
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

.empty-state { border: none; }

.spin-icon { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
</style>