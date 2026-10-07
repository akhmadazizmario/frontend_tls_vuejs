<template>
  <div class="d-flex flex-column min-vh-100 bg-light">
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
        <!-- AKSES DITOLAK: bukan dept Security -->
        <div v-if="!isSecurity" class="card shadow-sm border-0">
          <div class="card-body text-center py-5">
            <div class="fs-1 mb-2">🚫</div>
            <h5 class="fw-bold">Akses Ditolak</h5>
            <p class="text-muted mb-0">Halaman ini hanya untuk staff dengan departemen <strong>Security</strong>.<br />Akun Anda terdaftar di departemen <strong>{{ deptLive || '-' }}</strong>.</p>
          </div>
        </div>

        <template v-else>
          <h3 class="fw-bold mb-1">🛡️ Pos Security - Catat Mobil</h3>
          <p class="text-muted mb-4">Login sebagai <strong>{{ user.name }}</strong>. Pilih mobil di bawah, lalu isi KM.</p>

          <!-- SLIDE MENU: Checkpoint vs Riwayat Semua Perjalanan -->
          <ul class="nav nav-pills mb-4 gap-2">
            <li class="nav-item">
              <button
                class="nav-link"
                :class="activeTab === 'checkpoint' ? 'active' : 'text-dark bg-white border'"
                @click="activeTab = 'checkpoint'"
              >
                🛡️ Catat Mobil
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link"
                :class="activeTab === 'riwayat' ? 'active' : 'text-dark bg-white border'"
                @click="switchToRiwayat"
              >
                📜 Riwayat Semua Perjalanan
              </button>
            </li>
          </ul>

          <!-- ==================== TAB: RIWAYAT SEMUA PERJALANAN (KM saja) ==================== -->
          <div v-if="activeTab === 'riwayat'" class="card shadow-sm border-0">
            <div class="card-header bg-white fw-bold">📜 Riwayat Semua Perjalanan (KM Keluar / Masuk)</div>
            <div class="card-body">
              <div v-if="loadingHistory" class="text-center text-muted py-4">Memuat riwayat...</div>
              <div v-else-if="historyList.length === 0" class="text-center text-muted py-4">Belum ada riwayat perjalanan.</div>
              <div class="table-responsive" v-else>
                <table class="table table-bordered table-striped align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>Kode Booking</th>
                      <th>Mobil</th>
                      <th>Driver</th>
                      <th>Tujuan</th>
                      <th>Tgl Berangkat</th>
                      <th>Tgl Kembali</th>
                      <th>KM Keluar</th>
                      <th>KM Masuk</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="b in historyList" :key="b.id">
                      <td>{{ b.kode_booking }}</td>
                      <td>{{ b.mobil?.nama_mobil }} <span class="text-muted small">({{ b.mobil?.plat_nomor }})</span></td>
                      <td>{{ b.driver?.name || '-' }}</td>
                      <td>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</td>
                      <td>{{ b.tgl_berangkat }} {{ b.jam_berangkat }}</td>
                      <td>{{ b.tgl_kembali || '-' }} {{ b.jam_kembali || '' }}</td>
                      <td>{{ b.km_keluar_manual ?? '-' }}</td>
                      <td>{{ b.km_masuk_manual ?? '-' }}</td>
                      <td><span class="badge" :class="statusBadgeClass(b.status_booking)">{{ b.status_booking }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-muted small mb-0">ℹ️ Informasi kasbon &amp; keuangan tidak ditampilkan di sini. Data tersebut hanya dapat dilihat oleh Manager, GA, Driver, dan Finance.</p>
            </div>
          </div>

          <!-- ==================== TAB: CHECKPOINT (existing) ==================== -->
          <div v-show="activeTab === 'checkpoint'">

          <!-- MOBIL SIAP KELUAR -->
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-primary text-white fw-bold fs-5">🚗 Mobil Mau Keluar</div>
            <div class="card-body">
              <div v-if="listReady.length === 0" class="text-muted text-center py-3">Tidak ada mobil yang siap berangkat saat ini.</div>
              <div class="row g-3">
                <div class="col-md-6 col-lg-4" v-for="b in listReady" :key="b.id">
                  <div class="border rounded-3 p-3 h-100 bg-white">
                    <div class="fw-bold fs-5 mb-1">{{ b.mobil?.nama_mobil }}</div>
                    <div class="text-muted mb-2">{{ b.mobil?.plat_nomor }} • {{ b.kode_booking }}</div>
                    <div class="mb-2">Tujuan: <strong>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</strong></div>
                    <button class="btn btn-success w-100 btn-lg" @click="openModal(b, 'out')">✅ CATAT KELUAR</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- MOBIL SEDANG DI JALAN (BALIK) -->
          <div class="card shadow-sm border-0">
            <div class="card-header bg-info text-white fw-bold fs-5">🔙 Mobil Mau Masuk / Pulang</div>
            <div class="card-body">
              <div v-if="listTransit.length === 0" class="text-muted text-center py-3">Tidak ada mobil yang sedang di jalan.</div>
              <div class="row g-3">
                <div class="col-md-6 col-lg-4" v-for="b in listTransit" :key="b.id">
                  <div class="border rounded-3 p-3 h-100 bg-white">
                    <div class="fw-bold fs-5 mb-1">{{ b.mobil?.nama_mobil }}</div>
                    <div class="text-muted mb-2">{{ b.mobil?.plat_nomor }} • {{ b.kode_booking }}</div>
                    <div class="mb-2">KM Keluar tadi: <strong>{{ b.km_keluar_manual }}</strong></div>
                    <button class="btn btn-warning w-100 btn-lg" @click="openModal(b, 'in')">🏁 CATAT MASUK</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
          <!-- /tab checkpoint -->

          <!-- MODAL INPUT KM -->
          <div v-if="modal.show" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.5); z-index: 1050;">
            <div class="bg-white rounded-3 p-4 shadow" style="width: 100%; max-width: 420px;">
              <h5 class="fw-bold mb-3">{{ modal.type === 'out' ? '✅ Catat Mobil Keluar' : '🏁 Catat Mobil Masuk' }}</h5>
              <p class="text-muted mb-2">{{ modal.booking.mobil?.nama_mobil }} - {{ modal.booking.mobil?.plat_nomor }}</p>

              <!-- PATOKAN KM -->
              <div v-if="modal.type === 'out'" class="alert py-2 px-3 mb-3" :class="modal.lastKmLoading ? 'alert-secondary' : 'alert-info'">
                <span v-if="modal.lastKmLoading">⏳ Mengambil KM terakhir mobil ini...</span>
                <span v-else-if="modal.lastKm !== null">
                  📌 KM terakhir mobil ini: <strong>{{ modal.lastKm }} km</strong> (dari {{ modal.lastKmKode }}). KM keluar tidak boleh kurang dari ini.
                </span>
                <span v-else>📌 Belum ada riwayat perjalanan selesai untuk mobil ini — isi KM sesuai speedometer sekarang.</span>
              </div>
              <div v-else class="alert alert-secondary py-2 px-3 mb-3">
                📌 KM keluar sebelumnya: <strong>{{ modal.booking.km_keluar_manual }} km</strong>. KM masuk tidak boleh kurang dari ini.
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold fs-6">Kilometer di Speedometer</label>
                <input type="number" class="form-control form-control-lg" v-model="modal.km_manual" placeholder="Contoh: 45200" autofocus />
                <small v-if="kmError" class="text-danger fw-semibold d-block mt-1">⚠️ {{ kmError }}</small>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted">Kilometer GPS (kalau ada, boleh dikosongkan)</label>
                <input type="number" class="form-control" v-model="modal.km_gps" />
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-secondary flex-fill" @click="closeModal">Batal</button>
                <button class="btn btn-primary flex-fill" :disabled="!!kmError" @click="submitCheckpoint">Simpan</button>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return { headers }
}

const deptLive = ref(user.value?.dept || '')
const isSecurity = computed(() => isDeptMatch(deptLive.value, 'security'))

function levenshtein(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase()
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}
function isDeptMatch(deptRaw, target) {
  const d = (deptRaw || '').toString().trim().toLowerCase()
  if (!d) return false
  if (d === target) return true
  return levenshtein(d, target) <= 1 
}

const fetchLiveProfile = async () => {
  const userId = user.value?.id
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE_URL}/profile/${userId}`)
    if (res.data?.dept) deptLive.value = res.data.dept
  } catch (err) {
    console.error('Gagal ambil profil live, pakai data cache:', err)
  }
}

const listReady = ref([])
const listTransit = ref([])
const activeTab = ref('checkpoint') 
const historyList = ref([])
const loadingHistory = ref(false)
const modal = reactive({
  show: false,
  type: 'out',
  booking: {},
  km_manual: '',
  km_gps: '',
  lastKm: null,
  lastKmKode: '',
  lastKmLoading: false
})

const fetchData = async () => {
  if (!isSecurity.value) return
  try {
    const [resReady, resTransit] = await Promise.all([
      axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params: { status: 'Ready' } }),
      axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params: { status: 'In Transit' } })
    ])
    listReady.value = resReady.data.data || []
    listTransit.value = resTransit.data.data || []
  } catch (err) {
    console.error(err)
  }
}

const fetchHistoryList = async () => {
  if (!isSecurity.value) return
  loadingHistory.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/booking`, getAuthHeaders())
    historyList.value = (res.data.data || []).sort((a, b) => {
      const da = new Date(`${a.tgl_berangkat} ${a.jam_berangkat || '00:00'}`)
      const db = new Date(`${b.tgl_berangkat} ${b.jam_berangkat || '00:00'}`)
      return db - da
    })
  } catch (err) {
    console.error('Gagal ambil riwayat perjalanan:', err)
  } finally {
    loadingHistory.value = false
  }
}

const switchToRiwayat = () => {
  activeTab.value = 'riwayat'
  fetchHistoryList()
}

const statusBadgeClass = (status) => {
  switch (status) {
    case 'Completed': return 'bg-success'
    case 'In Transit': return 'bg-info text-dark'
    case 'Ready': return 'bg-primary'
    case 'Waiting Manager': return 'bg-warning text-dark'
    case 'Cancelled':
    case 'Rejected': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

const openModal = async (booking, type) => {
  modal.show = true
  modal.type = type
  modal.booking = booking
  modal.km_gps = ''
  modal.lastKm = null
  modal.lastKmKode = ''

  const targetMobilId = booking.mobil_id || booking.mobil?.id;

  if (type === 'out' && targetMobilId) {
    modal.lastKmLoading = true
    modal.km_manual = '' 
    
    try {
      // 🔥 PERBAIKAN: Gunakan API booking yang sudah PASTI JALAN, lalu filter dari riwayat
      const res = await axios.get(`${API_BASE_URL}/carbook/booking`, {
        ...getAuthHeaders(),
        params: { mobil_id: targetMobilId, status: 'Completed' }
      })
      
      const allCompleted = res.data.data || []
      
      // Filter yang ada KM masuknya, lalu urutkan dari yang paling baru
      const validTrips = allCompleted
        .filter(b => b.km_masuk_manual != null)
        .sort((a, b) => new Date(b.waktu_masuk || b.updatedAt) - new Date(a.waktu_masuk || a.updatedAt))

      if (validTrips.length > 0) {
        const lastTrip = validTrips[0] // Ambil riwayat urutan pertama (paling terbaru)
        modal.lastKm = Number(lastTrip.km_masuk_manual)
        modal.lastKmKode = lastTrip.kode_booking
        
        // AUTO FILL: Langsung isi ke dalam kolom form!
        modal.km_manual = lastTrip.km_masuk_manual 
      } else {
        modal.lastKm = null
        modal.km_manual = ''
      }

    } catch (err) {
      console.error('Gagal mengambil history mobil:', err)
      modal.lastKm = null
      modal.km_manual = '' 
    } finally {
      modal.lastKmLoading = false
    }
  } 
  else if (type === 'in') {
    modal.km_manual = booking.km_keluar_manual || ''
  } 
  else {
    modal.km_manual = ''
  }
}

const closeModal = () => { modal.show = false }

const kmError = computed(() => {
  if (modal.km_manual === '' || modal.km_manual === null) return ''
  const kmInput = Number(modal.km_manual)

  if (modal.type === 'out' && modal.lastKm !== null && kmInput < modal.lastKm) {
    return `KM keluar tidak boleh kurang dari ${modal.lastKm} km (KM terakhir mobil ini).`
  }

  if (modal.type === 'in' && modal.booking.km_keluar_manual != null && kmInput < Number(modal.booking.km_keluar_manual)) {
    return `KM masuk tidak boleh kurang dari ${modal.booking.km_keluar_manual} km (KM berangkat tadi).`
  }

  return ''
})

const submitCheckpoint = async () => {
  if (!modal.km_manual) {
    alert('Isi kilometer speedometer dulu ya')
    return
  }
  if (kmError.value) {
    alert(kmError.value)
    return
  }
  try {
    const endpoint = modal.type === 'out'
      ? `${API_BASE_URL}/carbook/booking/${modal.booking.id}/checkpoint-out`
      : `${API_BASE_URL}/carbook/booking/${modal.booking.id}/checkpoint-in`

    const payload = modal.type === 'out'
      ? { security_out_id: user.value.id, km_keluar_manual: modal.km_manual, km_keluar_gps: modal.km_gps || null }
      : { security_in_id: user.value.id, km_masuk_manual: modal.km_manual, km_masuk_gps: modal.km_gps || null }

    await axios.patch(endpoint, payload, getAuthHeaders())
    alert('Berhasil disimpan!')
    closeModal()
    fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan, coba lagi')
  }
}

onMounted(async () => {
  await fetchLiveProfile()
  fetchData()
})
</script>