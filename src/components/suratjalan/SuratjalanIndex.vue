<template>
  <div>
    <h2>Daftar Surat Jalan</h2>
    <button class="btn btn-primary mb-3" @click="goCreate">Tambah Surat Jalan</button>

    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Nomor Surat</th>
          <th>Tanggal</th>
          <th>Kirim Ke</th>
          <th>Kendaraan</th>
          <th>No. Polisi</th>
          <th>Items</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sj in suratjalans" :key="sj.id">
          <td>{{ sj.nomor_surat }}</td>
          <td>{{ sj.tanggal }}</td>
          <td>{{ sj.kirim_ke }}</td>
          <td>{{ sj.kendaraan }}</td>
          <td>{{ sj.nopol }}</td>
          <td>
            <ul>
              <li v-for="item in sj.items" :key="item.id">
                {{ item.nama_barang }} ({{ item.qty }})
              </li>
            </ul>
          </td>
          <td>
            <button class="btn btn-sm btn-warning me-2" @click="goEdit(sj.id)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="confirmDelete(sj.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Delete Confirmation -->
    <div v-if="deleteId !== null" class="modal-backdrop">
      <div class="modal-content p-3 bg-white rounded shadow">
        <p>Yakin ingin menghapus surat jalan ini?</p>
        <button class="btn btn-danger me-2" @click="deleteSuratjalan">Hapus</button>
        <button class="btn btn-secondary" @click="deleteId = null">Batal</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const suratjalans = ref([])
const deleteId = ref(null)
const router = useRouter()

async function fetchSuratjalans() {
  try {
    const res = await axios.get('/suratjalans')
    suratjalans.value = res.data
  } catch (error) {
    alert('Gagal ambil data surat jalan')
  }
}

function goCreate() {
  router.push('/suratjalan/create')
}

function goEdit(id) {
  router.push(`/suratjalan/edit/${id}`)
}

function confirmDelete(id) {
  deleteId.value = id
}

async function deleteSuratjalan() {
  try {
    await axios.delete(`/suratjalans/${deleteId.value}`)
    alert('Berhasil dihapus')
    deleteId.value = null
    fetchSuratjalans()
  } catch (error) {
    alert('Gagal hapus surat jalan')
  }
}

onMounted(() => {
  fetchSuratjalans()
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}
.modal-content {
  max-width: 400px;
}
</style>
