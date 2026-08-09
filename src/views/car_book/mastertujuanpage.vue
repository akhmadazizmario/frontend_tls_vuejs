<!-- pages/carbook/MasterTujuanPage.vue -->
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
        <h3 class="fw-bold mb-1">📍 Master Tempat Tujuan</h3>
        <p class="text-muted mb-4">Daftar lokasi tujuan yang sering dipakai supaya pemohon tinggal pilih.</p>

        <div class="card shadow-sm border-0 mb-4">
          <div class="card-body">
            <form @submit.prevent="submitTujuan" class="row g-2">
              <div class="col-md-8">
                <input type="text" class="form-control" v-model="formTujuan" placeholder="Nama Lokasi Tujuan" required />
              </div>
              <div class="col-md-4">
                <button type="submit" class="btn btn-primary w-100">+ Tambah Tujuan</button>
              </div>
            </form>
          </div>
        </div>

        <div class="card shadow-sm border-0">
          <div class="card-body">
            <table class="table table-hover align-middle">
              <thead class="table-light"><tr><th>Nama Lokasi</th><th class="text-end">Aksi</th></tr></thead>
              <tbody>
                <tr v-if="listTujuan.length === 0"><td colspan="2" class="text-center text-muted py-4">Belum ada data tujuan.</td></tr>
                <tr v-for="t in listTujuan" :key="t.id">
                  <td v-if="editId !== t.id">{{ t.nama_lokasi }}</td>
                  <td v-else><input type="text" class="form-control" v-model="editValue" /></td>
                  <td class="text-end">
                    <template v-if="editId === t.id">
                      <button class="btn btn-sm btn-success" @click="saveEdit(t)">Simpan</button>
                      <button class="btn btn-sm btn-outline-secondary ms-1" @click="editId = null">Batal</button>
                    </template>
                    <template v-else>
                      <button class="btn btn-sm btn-outline-primary" @click="startEdit(t)">✏️ Edit</button>
                      <button class="btn btn-sm btn-outline-danger ms-1" @click="removeTujuan(t)">🗑️</button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

const listTujuan = ref([])
const formTujuan = ref('')
const editId = ref(null)
const editValue = ref('')

const fetchTujuan = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/tujuan`, getAuthHeaders())
    listTujuan.value = res.data.data || []
  } catch (err) {
    console.error(err)
  }
}

const submitTujuan = async () => {
  try {
    await axios.post(`${API_BASE_URL}/carbook/tujuan`, { nama_lokasi: formTujuan.value }, getAuthHeaders())
    formTujuan.value = ''
    fetchTujuan()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menambahkan tujuan')
  }
}

const startEdit = (t) => { editId.value = t.id; editValue.value = t.nama_lokasi }

const saveEdit = async (t) => {
  try {
    await axios.put(`${API_BASE_URL}/carbook/tujuan/${t.id}`, { nama_lokasi: editValue.value }, getAuthHeaders())
    editId.value = null
    fetchTujuan()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memperbarui tujuan')
  }
}

const removeTujuan = async (t) => {
  if (!confirm(`Hapus tujuan "${t.nama_lokasi}"?`)) return
  try {
    await axios.delete(`${API_BASE_URL}/carbook/tujuan/${t.id}`, getAuthHeaders())
    fetchTujuan()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus tujuan')
  }
}

onMounted(fetchTujuan)
</script>