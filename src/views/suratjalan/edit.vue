<template>
  <div class="d-flex flex-column min-vh-100">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-4"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px',
        }"
      >
        <h1>Edit Surat Jalan</h1>

        <form @submit.prevent="submitForm" novalidate>
          <!-- Sama seperti create, tapi field sudah terisi -->
          <div class="mb-3" v-for="field in mainFields" :key="field.name">
            <label class="form-label">{{ field.label }}</label>
            <input
              v-model="form[field.name]"
              :type="field.type"
              class="form-control"
              :required="field.required"
              :class="{ 'is-invalid': errors[field.name] }"
            />
            <div class="invalid-feedback" v-if="errors[field.name]">{{ errors[field.name] }}</div>
          </div>

          <h3>Items</h3>
          <div v-for="(item, index) in form.items" :key="index" class="border p-3 mb-3">
            <div class="mb-2" v-for="field in itemFields" :key="field.name">
              <label class="form-label">{{ field.label }}</label>
              <input
                v-model="item[field.name]"
                :type="field.type"
                class="form-control"
                :required="field.required"
                :class="{ 'is-invalid': itemErrors[index]?.[field.name] }"
              />
              <div class="invalid-feedback" v-if="itemErrors[index]?.[field.name]">
                {{ itemErrors[index][field.name] }}
              </div>
            </div>

            <button
              type="button"
              class="btn btn-danger"
              @click="removeItem(index)"
              :disabled="form.items.length === 1"
            >
              Hapus Item
            </button>
          </div>

          <button type="button" class="btn btn-secondary mb-3" @click="addItem">
            + Tambah Item
          </button>

          <div>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Menyimpan...' : 'Update Surat Jalan' }}
            </button>
            <router-link to="/suratjalan" class="btn btn-link">Batal</router-link>
          </div>
        </form>
      </main>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import Header from '../../components/Header.vue'
import Sidebar from '../../components/Sidebar.vue'
import Footer from '../../components/Footer.vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API2_BASE_URL = import.meta.env.VITE_API2_BASE_URL

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const user = ref({})

// Sidebar & responsive
const sidebarOpen = ref(true)
const windowWidth = ref(window.innerWidth)
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
window.addEventListener('resize', () => {
  windowWidth.value = window.innerWidth
})

// Ambil user dari localStorage
onMounted(() => {
  try {
    const userData = localStorage.getItem('user')
    user.value = userData ? JSON.parse(userData) : { name: 'Guest' }
  } catch {
    user.value = { name: 'Guest' }
  }
})

// Field metadata (sama seperti di create)
const mainFields = [
  { name: 'nomor_surat', label: 'Nomor Surat', type: 'text', required: true },
  { name: 'tanggal', label: 'Tanggal', type: 'date', required: true },
  { name: 'kirim_ke', label: 'Kirim Ke', type: 'text', required: true },
  { name: 'bc_no', label: 'BC No', type: 'text', required: false },
  { name: 'keterangan', label: 'Keterangan', type: 'text', required: true },
  { name: 'cust_bond_nomor', label: 'Cust Bond Nomor', type: 'text', required: true },
  { name: 'kendaraan', label: 'Kendaraan', type: 'text', required: true },
  { name: 'nopol', label: 'No. Polisi', type: 'text', required: true },
]

const itemFields = [
  { name: 'nama_barang', label: 'Nama Barang', type: 'text', required: true },
  { name: 'idp', label: 'IDP', type: 'text', required: true },
  { name: 'color', label: 'Color', type: 'text', required: false },
  { name: 'size', label: 'Size', type: 'text', required: false },
  { name: 'qty', label: 'Qty', type: 'text', required: true },
  { name: 'pack', label: 'Pack', type: 'text', required: false },
]

const form = reactive({
  nomor_surat: '',
  tanggal: '',
  kirim_ke: '',
  bc_no: '',
  keterangan: '',
  cust_bond_nomor: '',
  kendaraan: '',
  nopol: '',
  items: [],
})

const errors = reactive({})
const itemErrors = reactive([])

function validate() {
  Object.keys(errors).forEach(key => (errors[key] = ''))
  itemErrors.splice(0)

  let valid = true

  for (const field of mainFields) {
    if (field.required && !form[field.name]) {
      errors[field.name] = `${field.label} wajib diisi`
      valid = false
    }
  }

  form.items.forEach((item, idx) => {
    itemErrors[idx] = {}
    for (const field of itemFields) {
      if (field.required && !item[field.name]) {
        itemErrors[idx][field.name] = `${field.label} wajib diisi`
        valid = false
      }
    }
  })

  return valid
}

function addItem() {
  form.items.push({
    nama_barang: '',
    idp: '',
    color: '',
    size: '',
    qty: '',
    pack: ''
  })
}

function removeItem(index) {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
  }
}

async function loadSuratjalan() {
  try {
    const id = route.params.id
    const response = await axios.get(`${API_BASE_URL}/suratjalan/${id}`)
    Object.assign(form, response.data)
    // Jika items tidak ada, set default 1 item kosong
    if (!form.items || form.items.length === 0) {
      form.items = [{
        nama_barang: '',
        idp: '',
        color: '',
        size: '',
        qty: '',
        pack: ''
      }]
    }
  } catch (error) {
    alert('Gagal mengambil data surat jalan: ' + (error.response?.data?.error || error.message))
    router.push('/suratjalan')
  }
}

async function submitForm() {
  if (!validate()) {
    alert('Form belum lengkap atau ada kesalahan. Mohon diperbaiki.')
    return
  }

  loading.value = true
  try {
    const id = route.params.id
    await axios.put(`${API_BASE_URL}/suratjalan/${id}`, form)
    alert('Surat jalan berhasil diupdate')
    router.push('/suratjalan')
  } catch (error) {
    alert('Gagal mengupdate surat jalan: ' + (error.response?.data?.error || error.message))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSuratjalan()
})

function logout() {
  localStorage.removeItem('user')
  router.push('/')
}
</script>

<style scoped>
.container {
  max-width: 900px;
  margin: auto;
}
</style>
