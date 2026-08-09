<!-- <template>
  <div class="d-flex flex-column min-vh-100">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-5"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          marginTop: '56px'
        }"
      >
        <div class="container-lg">
          <h2 class="mb-1 text-primary">Blog Recruitment</h2>
          <p class="text-secondary mb-4">
            Blog bebas tanpa Excel, Excel bisa di-import kapan saja
          </p>

    
          <div class="text-end mb-3">
            <button
              class="btn btn-primary btn-lg rounded-pill"
              @click="openForm()"
            >
              ➕ Tambah Blog
            </button>
          </div>

    
          <div class="card shadow-sm">
            <div class="card-body">
              <div class="table-responsive">
                <table id="blogTable" class="table table-striped w-100">
                  <thead class="table-primary">
                    <tr>
                      <th>No</th>
                      <th>Judul</th>
                      <th>Gambar</th>
                      <th>Tgl Berangkat</th>
                      <th>Dibuat</th>
                      <th class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody />
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Footer />
  </div>


  <div class="modal fade" id="formModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <form @submit.prevent="saveBlog">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              {{ form.id ? 'Edit Blog' : 'Tambah Blog' }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="closeForm"
            />
          </div>

          <div class="modal-body row g-3">
            <div class="col-12">
              <label>Judul</label>
              <input v-model="form.judul" class="form-control" required />
            </div>

            <div class="col-12">
              <label>Deskripsi</label>
              <textarea v-model="form.deskripsi" class="form-control" />
            </div>

            <div class="col-md-6">
              <label>Tanggal Berangkat</label>
              <input
                type="date"
                v-model="form.tanggal_berangkat"
                class="form-control"
              />
            </div>

            <div class="col-md-6">
              <label>Gambar</label>
              <input
                type="file"
                class="form-control"
                @change="handleFileUpload"
              />
              <img
                v-if="form.gambarPreview"
                :src="form.gambarPreview"
                class="img-thumbnail mt-2"
                style="max-height:150px"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeForm"
            >
              Batal
            </button>
            <button class="btn btn-primary" type="submit">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="modal fade" id="importModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <form @submit.prevent="importExcel">
          <div class="modal-header bg-success text-white">
            <h5>Import Excel Penerimaan</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="closeImport"
            />
          </div>

          <div class="modal-body">
            <input
              type="file"
              accept=".xlsx"
              class="form-control"
              @change="handleExcel"
            />
          </div>
          <p class="text-center">Format Header:  Nama | Jenjang_Pendidikan | Posisi | Status</p>

          <div class="modal-footer">
            <button class="btn btn-success" type="submit">
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Modal } from 'bootstrap'
import $ from 'jquery'
import 'datatables.net-bs5'

import Header from '../../../components/Header.vue'
import Sidebar from '../../../components/Sidebar.vue'
import Footer from '../../../components/Footer.vue'

const API = import.meta.env.VITE_API_BASE_URL + '/blog-recruitment'
const user = ref(JSON.parse(localStorage.getItem('user')))

/* UI */
const sidebarOpen = ref(false)
const windowWidth = ref(window.innerWidth)

/* DATA */
const blogs = ref([])
const excelFile = ref(null)
const selectedBlogId = ref(null)

const form = ref({
  id: null,
  judul: '',
  deskripsi: '',
  tanggal_berangkat: '',
  gambar: null,
  gambarPreview: null
})

let table = null
let formModalInstance = null
let importModalInstance = null

// Helper
const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Jakarta"
  }).format(new Date(dateStr))
}


/* ================= DATA ================= */
async function loadData() {
  const res = await axios.get(`${API}/web`)
  blogs.value = res.data
  return res.data
}

/* ================= TABLE ================= */
function reloadTable(data) {
  if ($.fn.DataTable.isDataTable('#blogTable')) {
    $('#blogTable').DataTable().destroy()
  }

  table = $('#blogTable').DataTable({
  data,
  order: [[4, 'desc']], // index kolom createdAt
  columns: [
    { data: null, render: (_,__,___,m)=>m.row+1 },
    { data: 'judul' },
    {
      data: 'gambar',
      render: d => d
        ? `<img src="${import.meta.env.VITE_API_BASE_URL}/uploads/blog-recruitment/${d}" height="40">`
        : '-'
    },
    {
  data: 'tanggal_berangkat',
  render: function (data, type) {
    if (!data) return "-"

    // sorting pakai date asli
    if (type === 'sort' || type === 'type') {
      return new Date(data).toISOString()
    }

    // tampilan Indonesia (tanpa jam)
    return formatDate(data)
  }
},

    // 🔥 CREATED AT (FIX)
    {
      data: 'createdAt',
      render: function (data, type) {
        if (!data) return "-"
        if (type === 'sort' || type === 'type') {
          return new Date(data).toISOString()
        }
        return formatDateTime(data)
      }
    },

    { data: null }
  ],
  createdRow(row, data) {
    $('td', row).eq(5).html(`
      <button class="btn btn-sm btn-warning edit" data-id="${data.id}">Edit</button>
      <button class="btn btn-sm btn-success import" data-id="${data.id}">Import</button>
      <button class="btn btn-sm btn-danger delete" data-id="${data.id}">Hapus</button>
    `)
  }
})


  $('#blogTable').on('click','.edit',e=>{
    openForm(blogs.value.find(b=>b.id==e.target.dataset.id))
  })

  $('#blogTable').on('click','.delete',e=>{
    deleteBlog(e.target.dataset.id)
  })

  $('#blogTable').on('click','.import',e=>{
    selectedBlogId.value = e.target.dataset.id
    importModalInstance.show()
  })
}

/* ================= FORM ================= */
function resetForm(){
  form.value = {
    id:null,
    judul:'',
    deskripsi:'',
    tanggal_berangkat:'',
    gambar:null,
    gambarPreview:null
  }
}

function openForm(data=null){
  if(data){
    form.value = {
      id: data.id,
      judul: data.judul,
      deskripsi: data.deskripsi,
      tanggal_berangkat: data.tanggal_berangkat,
      gambar: null,
      gambarPreview: data.gambar
        ? `${import.meta.env.VITE_API_BASE_URL}/uploads/blog-recruitment/${data.gambar}`
        : null
    }
  }else{
    resetForm()
  }

  formModalInstance.show()
}

function closeForm(){
  formModalInstance.hide()
}

function handleFileUpload(e){
  const f = e.target.files[0]
  if(f){
    form.value.gambar = f
    form.value.gambarPreview = URL.createObjectURL(f)
  }
}

/* ================= SAVE ================= */
async function saveBlog(){
  const fd = new FormData()
  Object.keys(form.value).forEach(k=>{
    if(form.value[k] && k !== 'gambarPreview'){
      fd.append(k, form.value[k])
    }
  })

  if(form.value.id){
    await axios.put(`${API}/${form.value.id}`, fd)
  }else{
    await axios.post(API, fd)
  }

  Swal.fire('Sukses','Blog tersimpan','success')
  reloadTable(await loadData())
  formModalInstance.hide()
}

/* ================= DELETE ================= */
async function deleteBlog(id){
  if(!(await Swal.fire({title:'Hapus?',showCancelButton:true})).isConfirmed) return
  await axios.delete(`${API}/${id}`)
  reloadTable(await loadData())
}

/* ================= IMPORT ================= */
function handleExcel(e){
  excelFile.value = e.target.files[0]
}

async function importExcel(){
  if(!excelFile.value){
    Swal.fire('Peringatan','Pilih file Excel dulu','warning')
    return
  }

  const fd = new FormData()
  fd.append('file', excelFile.value)

  await axios.post(`${API}/${selectedBlogId.value}/import-excel`, fd)

  Swal.fire('Sukses','Excel berhasil diimport','success')
  closeImport()
}

function closeImport(){
  importModalInstance.hide()
  excelFile.value = null
  selectedBlogId.value = null
}

/* ================= MOUNT ================= */
onMounted(async()=>{
  formModalInstance = new Modal(document.getElementById('formModal'))
  importModalInstance = new Modal(document.getElementById('importModal'))

  document.getElementById('formModal')
    .addEventListener('hidden.bs.modal', resetForm)

  reloadTable(await loadData())
})

const toggleSidebar = ()=> sidebarOpen.value = !sidebarOpen.value
const logout = ()=>{ localStorage.clear(); location.href='/login' }
</script> -->





<template>hai</template>