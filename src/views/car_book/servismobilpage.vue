<!-- pages/carbook/ServisMobilPage.vue -->
<template>
  <div class="d-flex flex-column min-vh-100 bg-body-tertiary">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />
      <main
        class="flex-grow-1 p-3 p-md-4 p-xl-5"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: '56px',
        }"
      >
        <!-- Page Header & Language Selector -->
        <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
          <div>
            <h3 class="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
              <i class="bi bi-tools text-primary"></i> {{ t('title') }}
            </h3>
            <p class="text-muted mb-0 small">{{ t('subtitle') }}</p>
          </div>

          <!-- Language Selector -->
          <div class="d-flex align-items-center gap-2 bg-white p-2 rounded-3 shadow-sm border">
            <i class="bi bi-translate text-primary"></i>
            <select class="form-select form-select-sm border-0 bg-transparent fw-medium" v-model="currentLang" style="cursor: pointer;">
              <option value="id">🇮🇩 Bahasa Indonesia</option>
              <option value="en">🇺🇸 English</option>
              <option value="zh">🇨🇳 中文 (Chinese)</option>
            </select>
          </div>
        </div>

        <!-- Card Form Record Servis Baru -->
        <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div class="card-header bg-white py-3 px-4 border-0 border-bottom d-flex align-items-center">
            <span class="badge bg-primary-subtle text-primary p-2 me-2 rounded-circle">
              <i class="bi bi-plus-circle-fill fs-6"></i>
            </span>
            <h5 class="fw-bold mb-0 text-dark">{{ t('formHeader') }}</h5>
          </div>
          <div class="card-body p-4">
            <form @submit.prevent="submitServis" class="row g-3">
              <div class="col-md-4">
                <label class="form-label fw-medium text-secondary">{{ t('selectCar') }} <span class="text-danger">*</span></label>
                <select class="form-select rounded-3 fs-6" v-model="formServis.mobil_id" required>
                  <option value="" disabled>{{ t('selectCarPlaceholder') }}</option>
                  <option v-for="m in listMobil" :key="m.id" :value="m.id">
                    {{ m.nama_mobil }} — {{ m.plat_nomor }} ({{ m.status }})
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium text-secondary">{{ t('serviceType') }} <span class="text-danger">*</span></label>
                <input type="text" class="form-control rounded-3 fs-6" v-model="formServis.jenis_servis" :placeholder="t('serviceTypePlaceholder')" required />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium text-secondary">{{ t('serviceDate') }} <span class="text-danger">*</span></label>
                <input type="date" class="form-control rounded-3 fs-6" v-model="formServis.tgl_servis" required />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium text-secondary">{{ t('cost') }} (Rp) <span class="text-danger">*</span></label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-secondary">Rp</span>
                  <input type="number" min="0" class="form-control rounded-end-3 fs-6" v-model="formServis.biaya" placeholder="0" required />
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium text-secondary">{{ t('km') }} <span class="text-danger">*</span></label>
                <input type="number" min="0" class="form-control rounded-3 fs-6" v-model="formServis.km_saat_servis" placeholder="10000" required />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium text-secondary">{{ t('workshop') }}</label>
                <input type="text" class="form-control rounded-3 fs-6" v-model="formServis.bengkel_penyedia" :placeholder="t('workshopPlaceholder')" />
              </div>
              <div class="col-12">
                <label class="form-label fw-medium text-secondary">{{ t('notes') }}</label>
                <textarea class="form-control rounded-3 fs-6" v-model="formServis.keterangan" rows="2" :placeholder="t('notesPlaceholder')"></textarea>
              </div>
              <div class="col-12 d-flex justify-content-end">
                <button type="submit" class="btn btn-primary rounded-3 px-4 shadow-sm fw-semibold" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  <i v-else class="bi bi-save me-2"></i>
                  {{ t('saveBtn') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Card Tabel Riwayat Servis -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-header bg-white py-3 px-4 border-0 border-bottom d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <span class="badge bg-secondary-subtle text-secondary p-2 me-2 rounded-circle">
                <i class="bi bi-journal-check fs-6"></i>
              </span>
              <h5 class="fw-bold mb-0 text-dark">{{ t('historyHeader') }}</h5>
            </div>
            <button class="btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center gap-1" @click="fetchServis">
              <i class="bi bi-arrow-clockwise"></i> {{ t('refresh') }}
            </button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light text-secondary">
                  <tr>
                    <th class="ps-4 py-3">{{ t('colCar') }}</th>
                    <th class="py-3">{{ t('colType') }}</th>
                    <th class="py-3">{{ t('colDate') }}</th>
                    <th class="py-3">{{ t('colCost') }}</th>
                    <th class="py-3">{{ t('colWorkshop') }}</th>
                    <th class="py-3">{{ t('colStatus') }}</th>
                    <th class="pe-4 py-3 text-end">{{ t('colAction') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="listServis.length === 0">
                    <td colspan="7" class="text-center text-muted py-5">
                      <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary opacity-50"></i>
                      {{ t('noHistory') }}
                    </td>
                  </tr>
                  <tr v-for="s in listServis" :key="s.id">
                    <td class="ps-4 fw-bold text-dark">
                      {{ s.mobil?.nama_mobil || '-' }}
                      <span class="text-muted font-monospace d-block small">{{ s.mobil?.plat_nomor }}</span>
                    </td>
                    <td class="fw-medium text-dark">{{ s.jenis_servis }}</td>
                    <td class="text-secondary">{{ s.tgl_servis }}</td>
                    <td class="fw-semibold text-dark">Rp {{ formatRupiah(s.biaya) }}</td>
                    <td>{{ s.bengkel_penyedia || '-' }}</td>
                    <td>
                      <span class="badge rounded-pill px-3 py-2 fw-medium" :class="getServiceStatusBadge(getServisStatus(s))">
                        {{ renderStatusText(getServisStatus(s)) }}
                      </span>
                    </td>
                    <td class="pe-4 text-end">
                      <!-- Tombol Selesai & Batal hanya muncul jika servis masih berlangsung/aktif -->
                      <div v-if="isServisOngoing(s)" class="d-inline-flex gap-2">
                        <button class="btn btn-sm btn-success rounded-3 d-flex align-items-center gap-1" @click="selesaikanServis(s)">
                          <i class="bi bi-check-circle"></i> {{ t('btnComplete') }}
                        </button>
                        <button class="btn btn-sm btn-outline-danger rounded-3 d-flex align-items-center gap-1" @click="batalkanServis(s)">
                          <i class="bi bi-x-circle"></i> {{ t('btnCancel') }}
                        </button>
                      </div>
                      <span v-else class="text-muted small">—</span>
                    </td>
                  </tr>
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
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
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

// --- MULTI-LANGUAGE / i18N ---
const currentLang = ref('id')

const translations = {
  id: {
    title: 'Servis Kendaraan',
    subtitle: 'Catat dan kelola riwayat servis / perawatan mobil operasional.',
    formHeader: 'Catat Servis Baru',
    selectCar: 'Pilih Mobil',
    selectCarPlaceholder: '-- pilih mobil --',
    serviceType: 'Jenis Servis',
    serviceTypePlaceholder: 'Ganti Oli, Servis Berkala, dll.',
    serviceDate: 'Tanggal Servis',
    cost: 'Biaya',
    km: 'KM Saat Servis',
    workshop: 'Bengkel / Penyedia',
    workshopPlaceholder: 'Nama bengkel penyedia',
    notes: 'Keterangan',
    notesPlaceholder: 'Detail perawatan atau part yang diganti...',
    saveBtn: 'Simpan Data Servis',
    historyHeader: 'Riwayat Servis',
    refresh: 'Refresh',
    colCar: 'Mobil',
    colType: 'Jenis Servis',
    colDate: 'Tanggal',
    colCost: 'Biaya',
    colWorkshop: 'Bengkel',
    colStatus: 'Status',
    colAction: 'Aksi',
    noHistory: 'Belum ada riwayat servis.',
    statusOngoing: 'Sedang Servis',
    statusCompleted: 'Selesai',
    statusCancelled: 'Dibatalkan',
    btnComplete: 'Selesai',
    btnCancel: 'Batalkan',
    confirmComplete: 'Tandai servis ini selesai? Status mobil akan kembali "Tersedia".',
    confirmCancel: 'Batalkan servis ini? Status mobil akan kembali "Tersedia".'
  },
  en: {
    title: 'Vehicle Maintenance',
    subtitle: 'Record and manage operational car service & maintenance history.',
    formHeader: 'Record New Service',
    selectCar: 'Select Car',
    selectCarPlaceholder: '-- select car --',
    serviceType: 'Service Type',
    serviceTypePlaceholder: 'Oil Change, Routine Service, etc.',
    serviceDate: 'Service Date',
    cost: 'Cost',
    km: 'Current Odometer (KM)',
    workshop: 'Workshop / Provider',
    workshopPlaceholder: 'Workshop name',
    notes: 'Notes',
    notesPlaceholder: 'Maintenance details or replaced parts...',
    saveBtn: 'Save Service Data',
    historyHeader: 'Service History',
    refresh: 'Refresh',
    colCar: 'Car',
    colType: 'Service Type',
    colDate: 'Date',
    colCost: 'Cost',
    colWorkshop: 'Workshop',
    colStatus: 'Status',
    colAction: 'Action',
    noHistory: 'No service history found.',
    statusOngoing: 'In Progress',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    btnComplete: 'Complete',
    btnCancel: 'Cancel',
    confirmComplete: 'Mark this service as complete? The car status will revert to "Available".',
    confirmCancel: 'Cancel this service? The car status will revert to "Available".'
  },
  zh: {
    title: '车辆保养与维修',
    subtitle: '记录并管理运营车辆的维护与保养历史。',
    formHeader: '记录新保养',
    selectCar: '选择车辆',
    selectCarPlaceholder: '-- 选择车辆 --',
    serviceType: '保养类型',
    serviceTypePlaceholder: '更换机油、定期保养等',
    serviceDate: '保养日期',
    cost: '费用',
    km: '当前公里数 (KM)',
    workshop: '维修厂 / 服务商',
    workshopPlaceholder: '维修厂名称',
    notes: '备注',
    notesPlaceholder: '维护细节或更换零件...',
    saveBtn: '保存保养数据',
    historyHeader: '保养历史',
    refresh: '刷新',
    colCar: '车辆',
    colType: '类型',
    colDate: '日期',
    colCost: '费用',
    colWorkshop: '维修厂',
    colStatus: '状态',
    colAction: '操作',
    noHistory: '暂无保养记录。',
    statusOngoing: '保养中',
    statusCompleted: '已完成',
    statusCancelled: '已取消',
    btnComplete: '完成',
    btnCancel: '取消',
    confirmComplete: '确认标记为完成？车辆状态将恢复为“可用”。',
    confirmCancel: '确认取消此保养？车辆状态将恢复为“可用”。'
  }
}

const t = (key) => translations[currentLang.value]?.[key] || translations['id'][key]

const detectBrowserLanguage = () => {
  const browserLang = (navigator.language || navigator.userLanguage).toLowerCase()
  if (browserLang.startsWith('zh')) {
    currentLang.value = 'zh'
  } else if (browserLang.startsWith('en')) {
    currentLang.value = 'en'
  } else {
    currentLang.value = 'id'
  }
}

// --- LOGIKA HELPER & STATUS ---
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return { headers }
}

const formatRupiah = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

// Helper penentu status servis transaksi (memastikan tidak menggunakan status dari master mobil jika transaksi punya status sendiri)
const getServisStatus = (s) => {
  if (s.status) return s.status // Menggunakan field status dari record servis (jika ada)
  if (s.is_selesai || s.status_servis === 'Selesai') return 'Selesai'
  if (s.status_servis === 'Dibatalkan' || s.is_cancelled) return 'Dibatalkan'
  
  // Jika fallback ke status mobil
  return s.mobil?.status === 'Servis' ? 'Sedang Servis' : 'Selesai'
}

const isServisOngoing = (s) => {
  const st = getServisStatus(s)
  return st === 'Sedang Servis' || st === 'In Progress' || st === 'Servis'
}

const getServiceStatusBadge = (status) => {
  if (status === 'Sedang Servis' || status === 'In Progress' || status === 'Servis') {
    return 'bg-warning-subtle text-warning-emphasis'
  }
  if (status === 'Selesai' || status === 'Completed') {
    return 'bg-success-subtle text-success'
  }
  if (status === 'Dibatalkan' || status === 'Cancelled') {
    return 'bg-danger-subtle text-danger'
  }
  return 'bg-secondary-subtle text-secondary'
}

const renderStatusText = (status) => {
  if (status === 'Sedang Servis' || status === 'In Progress' || status === 'Servis') return t('statusOngoing')
  if (status === 'Selesai' || status === 'Completed') return t('statusCompleted')
  if (status === 'Dibatalkan' || status === 'Cancelled') return t('statusCancelled')
  return status
}

// --- STATE & API ---
const loading = ref(false)
const listMobil = ref([])
const listServis = ref([])
const formServis = reactive({
  mobil_id: '',
  jenis_servis: '',
  tgl_servis: new Date().toISOString().slice(0, 10),
  biaya: '',
  km_saat_servis: '',
  bengkel_penyedia: '',
  keterangan: ''
})

const fetchMobil = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/mobil`, getAuthHeaders())
    listMobil.value = res.data.data || []
  } catch (err) {
    console.error(err)
  }
}

const fetchServis = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/servis`, getAuthHeaders())
    listServis.value = res.data.data || []
  } catch (err) {
    console.error(err)
  }
}

const resetForm = () => {
  Object.assign(formServis, {
    mobil_id: '',
    jenis_servis: '',
    tgl_servis: new Date().toISOString().slice(0, 10),
    biaya: '',
    km_saat_servis: '',
    bengkel_penyedia: '',
    keterangan: ''
  })
}

const submitServis = async () => {
  try {
    loading.value = true
    await axios.post(`${API_BASE_URL}/carbook/servis`, formServis, getAuthHeaders())
    alert('Data servis berhasil disimpan & status mobil diubah menjadi "Servis".')
    resetForm()
    fetchServis()
    fetchMobil()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan data servis')
  } finally {
    loading.value = false
  }
}

const selesaikanServis = async (s) => {
  if (!confirm(t('confirmComplete'))) return
  try {
    await axios.patch(`${API_BASE_URL}/carbook/servis/${s.id}/selesai`, {}, getAuthHeaders())
    fetchServis()
    fetchMobil()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menandai servis selesai')
  }
}

const batalkanServis = async (s) => {
  if (!confirm(t('confirmCancel'))) return
  try {
    await axios.patch(`${API_BASE_URL}/carbook/servis/${s.id}/batal`, {}, getAuthHeaders())
    fetchServis()
    fetchMobil()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal membatalkan servis')
  }
}

onMounted(() => {
  detectBrowserLanguage()
  fetchMobil()
  fetchServis()
})
</script>

<style scoped>
.bg-primary-subtle { background-color: #e7f1ff !important; }
.bg-success-subtle { background-color: #e6f4ea !important; }
.bg-warning-subtle { background-color: #fef7e0 !important; }
.bg-danger-subtle { background-color: #fce8e6 !important; }
.bg-secondary-subtle { background-color: #f1f3f5 !important; }

.form-control:focus, .form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
}
</style>