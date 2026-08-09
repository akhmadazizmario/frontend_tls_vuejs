<template>
  <div>
    <h2>{{ mode === 'create' ? 'Tambah Surat Jalan' : 'Edit Surat Jalan' }}</h2>
    <form @submit.prevent="submitForm">
      <div class="mb-3">
        <label>Nomor Surat</label>
        <input type="text" v-model="form.nomor_surat" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>Tanggal</label>
        <input type="date" v-model="form.tanggal" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>Kirim Ke</label>
        <input type="text" v-model="form.kirim_ke" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>BC No</label>
        <input type="text" v-model="form.bc_no" class="form-control" />
      </div>
      <div class="mb-3">
        <label>Keterangan</label>
        <input type="text" v-model="form.keterangan" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>Cust Bond Nomor</label>
        <input type="text" v-model="form.cust_bond_nomor" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>Kendaraan</label>
        <input type="text" v-model="form.kendaraan" class="form-control" required />
      </div>
      <div class="mb-3">
        <label>No. Polisi</label>
        <input type="text" v-model="form.nopol" class="form-control" required />
      </div>

      <hr />
      <h5>Items</h5>

      <div v-for="(item, idx) in form.items" :key="idx" class="border rounded p-3 mb-3">
        <div class="mb-2">
          <label>Nama Barang</label>
          <input type="text" v-model="item.nama_barang" class="form-control" required />
        </div>
        <div class="mb-2">
          <label>IDP</label>
          <input type="text" v-model="item.idp" class="form-control" required />
        </div>
        <div class="mb-2">
          <label>Color</label>
          <input type="text" v-model="item.color" class="form-control" />
        </div>
        <div class="mb-2">
          <label>Size</label>
          <input type="text" v-model="item.size" class="form-control" />
        </div>
        <div class="mb-2">
          <label>Qty</label>
          <input type="text" v-model="item.qty" class="form-control" required />
        </div>
        <div class="mb-2">
          <label>Pack</label>
          <input type="text" v-model="item.pack" class="form-control" />
        </div>
        <button type="button" class="btn btn-danger btn-sm" @click="removeItem(idx)">Hapus Item</button>
      </div>

      <button type="button" class="btn btn-secondary mb-3" @click="addItem">Tambah Item</button>

      <br />
      <button type="submit" class="btn btn-success">{{ mode === 'create' ? 'Simpan' : 'Update' }}</button>
      <button type="button" class="btn btn-secondary ms-2" @click="goBack">Batal</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'

const mode = ref('create')
const form = ref({
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

const router = useRouter()
const route = useRoute()

function addItem() {
  form.value.items.push({
    nama_barang: '',
    idp: '',
    color: '',
    size: '',
    qty: '',
    pack: '',
  })
}

function removeItem(idx) {
  form.value.items.splice(idx, 1)
}

function goBack() {
  router.push('/suratjalan')
}

async function fetchSuratjalan(id) {
  try {
    const res = await axios.get(`/suratjalans/${id}`)
    form.value = { ...res.data, items: res.data.items || [] }
  } catch (error) {
    alert('Gagal ambil data surat jalan')
    goBack()
  }
}

async function submitForm() {
  try {
    if (mode.value === 'create') {
      await axios.post('/suratjalans', form.value)
      alert('Surat jalan berhasil dibuat')
    } else {
      await axios.put(`/suratjalans/${route.params.id}`, form.value)
      alert('Surat jalan berhasil diupdate')
    }
    goBack()
  } catch (error) {
    alert('Gagal menyimpan data')
  }
}

onMounted(() => {
  if (route.name === 'EditSuratjalan') {
    mode.value = 'edit'
    fetchSuratjalan(route.params.id)
  } else {
    mode.value = 'create'
    if (form.value.items.length === 0) addItem()
  }
})
</script>
