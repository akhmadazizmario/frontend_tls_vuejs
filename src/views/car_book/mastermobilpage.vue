<!-- pages/carbook/MasterMobilPage.vue -->
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
        <h3 class="fw-bold mb-1">🚘 Master Data Mobil</h3>
        <p class="text-muted mb-4">Kelola armada mobil operasional perusahaan & tracking konsumsi BBM.</p>

        <div class="card shadow-sm border-0 mb-4">
          <div class="card-body">
            <h5 class="fw-bold mb-3">{{ editId ? 'Edit Mobil' : 'Tambah Mobil Baru' }}</h5>
            <form @submit.prevent="submitMobil" class="row g-3">
              <!-- Baris 1: Informasi Kendaraan -->
              <div class="col-md-3">
  <label class="form-label">
    Kode Mobil 
    <small v-if="!editId" class="text-primary fw-normal">(Otomatis)</small>
  </label>
  <input 
    type="text" 
    class="form-control" 
    v-model="formMobil.kode_mobil" 
    :placeholder="editId ? 'MBL-001' : 'Otomatis oleh sistem'" 
    :readonly="!editId" 
  />
</div>
              <div class="col-md-3">
                <label class="form-label">Nama / Merk</label>
                <input type="text" class="form-control" v-model="formMobil.nama_mobil" placeholder="Avanza Black" required />
              </div>
              <div class="col-md-2">
                <label class="form-label">Jenis</label>
                <input type="text" class="form-control" v-model="formMobil.jenis" placeholder="MPV" required />
              </div>
              <div class="col-md-2">
                <label class="form-label">Plat Nomor</label>
                <input type="text" class="form-control" v-model="formMobil.plat_nomor" placeholder="B 1234 TLS" required />
              </div>
              <div class="col-md-2">
                <label class="form-label">Status</label>
                <select class="form-select" v-model="formMobil.status">
                  <option value="Tersedia">Tersedia</option>
                  <option value="Dibooking">Dibooking</option>
                  <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                  <option value="Servis">Servis</option>
                </select>
              </div>

              <!-- Baris 2: Spesifikasi & Perhitungan BBM -->
              <div class="col-md-3">
                <label class="form-label">CC Mesin</label>
                <input type="number" class="form-control" v-model="formMobil.cc_mesin" placeholder="1500" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Kapasitas Tangki (Liter)</label>
                <input type="number" step="0.01" class="form-control" v-model="formMobil.kapasitas_tangki" placeholder="45.00" required />
              </div>
              <div class="col-md-3">
                <label class="form-label">Rasio BBM (KM / Liter)</label>
                <input type="number" step="0.01" class="form-control" v-model="formMobil.rasio_bbm_kml" placeholder="10.00" required />
              </div>
              <div class="col-md-3">
                <label class="form-label">Sisa BBM Tangki (Liter)</label>
                <input type="number" step="0.01" class="form-control" v-model="formMobil.sisa_bbm_liter" placeholder="45.00" required />
              </div>

              <div class="col-12 d-flex gap-2 mt-4">
                <button type="submit" class="btn btn-primary" :disabled="loading">{{ editId ? 'Simpan Perubahan' : 'Simpan Mobil' }}</button>
                <button v-if="editId" type="button" class="btn btn-outline-secondary" @click="resetForm">Batal Edit</button>
              </div>
            </form>
          </div>
        </div>

        <div class="card shadow-sm border-0">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0">Daftar Mobil</h5>
              <button class="btn btn-sm btn-outline-secondary" @click="fetchMobil">🔄 Refresh</button>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Kode</th>
                    <th>Nama / Merk</th>
                    <th>Jenis / CC</th>
                    <th>No. Polisi</th>
                    <th>Rasio (KML)</th>
                    <th>Tangki / Sisa BBM</th>
                    <th>Status</th>
                    <th class="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="listMobil.length === 0"><td colspan="8" class="text-center text-muted py-4">Belum ada data mobil.</td></tr>
                  <tr v-for="m in listMobil" :key="m.id">
                    <td>{{ m.kode_mobil }}</td>
                    <td class="fw-semibold">{{ m.nama_mobil }}</td>
                    <td>
                      {{ m.jenis }}
                      <span v-if="m.cc_mesin" class="text-muted small">({{ m.cc_mesin }} cc)</span>
                    </td>
                    <td>{{ m.plat_nomor }}</td>
                    <td><span class="badge bg-light text-dark border">{{ m.rasio_bbm_kml }} KM/L</span></td>
                    <td>
                      <div class="fw-semibold">{{ m.sisa_bbm_liter }} / {{ m.kapasitas_tangki }} L</div>
                      <div class="progress mt-1" style="height: 6px; width: 100px;">
                        <div 
                          class="progress-bar" 
                          :class="getFuelColor(m.sisa_bbm_liter, m.kapasitas_tangki)" 
                          :style="{ width: getFuelPercentage(m.sisa_bbm_liter, m.kapasitas_tangki) + '%' }"
                        ></div>
                      </div>
                    </td>
                    <td><span class="badge" :class="statusClass(m.status)">{{ m.status }}</span></td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary" @click="editMobil(m)">✏️ Edit</button>
                      <button class="btn btn-sm btn-outline-danger ms-1" @click="removeMobil(m)">🗑️</button>
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

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return { headers }
}

const loading = ref(false)
const listMobil = ref([])
const editId = ref(null)

const initialFormState = {
  kode_mobil: '',
  nama_mobil: '',
  jenis: '',
  plat_nomor: '',
  status: 'Tersedia',
  cc_mesin: null,
  kapasitas_tangki: 45.00,
  rasio_bbm_kml: 10.00,
  sisa_bbm_liter: 45.00
}

const formMobil = reactive({ ...initialFormState })

const statusClass = (status) => ({
  Tersedia: 'bg-success', 
  Dibooking: 'bg-warning text-dark', 
  'Dalam Perjalanan': 'bg-info', 
  Servis: 'bg-danger'
}[status] || 'bg-secondary')

const getFuelPercentage = (sisa, max) => {
  if (!max || max <= 0) return 0
  const pct = (Number(sisa) / Number(max)) * 100
  return Math.min(Math.max(pct, 0), 100)
}

const getFuelColor = (sisa, max) => {
  const pct = getFuelPercentage(sisa, max)
  if (pct <= 20) return 'bg-danger'
  if (pct <= 50) return 'bg-warning'
  return 'bg-success'
}

const fetchMobil = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/mobil`, getAuthHeaders())
    listMobil.value = res.data.data || []
  } catch (err) {
    console.error(err)
  }
}

const resetForm = () => {
  editId.value = null
  Object.assign(formMobil, initialFormState)
}

const editMobil = (m) => {
  editId.value = m.id
  Object.assign(formMobil, {
    kode_mobil: m.kode_mobil,
    nama_mobil: m.nama_mobil,
    jenis: m.jenis,
    plat_nomor: m.plat_nomor,
    status: m.status,
    cc_mesin: m.cc_mesin,
    kapasitas_tangki: m.kapasitas_tangki,
    rasio_bbm_kml: m.rasio_bbm_kml,
    sisa_bbm_liter: m.sisa_bbm_liter
  })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const submitMobil = async () => {
  try {
    loading.value = true
    if (editId.value) {
      await axios.put(`${API_BASE_URL}/carbook/mobil/${editId.value}`, formMobil, getAuthHeaders())
      alert('Data mobil berhasil diperbarui!')
    } else {
      await axios.post(`${API_BASE_URL}/carbook/mobil`, formMobil, getAuthHeaders())
      alert('Mobil baru berhasil ditambahkan!')
    }
    resetForm()
    fetchMobil()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan data mobil')
  } finally {
    loading.value = false
  }
}

const removeMobil = async (m) => {
  if (!confirm(`Hapus mobil ${m.nama_mobil}?`)) return
  try {
    await axios.delete(`${API_BASE_URL}/carbook/mobil/${m.id}`, getAuthHeaders())
    fetchMobil()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus mobil')
  }
}

onMounted(fetchMobil)
</script>