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
          marginTop: '56px'
        }"
      >
        <div class="container" style="max-width: 100%;">
          <h1 class="mb-4">Tambah Surat Jalan Baru</h1>

          <form @submit.prevent="submitForm" novalidate>
            <div class="row mb-3">
              <div class="col-md-4 position-relative">
                <label for="nomor_surat" class="form-label">Nomor Surat <span class="text-danger">*</span></label>
                <input
                  id="nomor_surat"
                  v-model="form.nomor_surat"
                  type="text"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.nomor_surat }"
                  placeholder="Masukkan Nomor Surat"
                  @input="fetchRiwayat('nomor_surat', form.nomor_surat)"
                  @focus="showRiwayat.nomor_surat = true"
                  @blur="hideRiwayat('nomor_surat')"
                />
                <div class="invalid-feedback" v-if="errors.nomor_surat">{{ errors.nomor_surat }}</div>
                <ul v-if="riwayat.nomor_surat.length && showRiwayat.nomor_surat" class="list-group position-absolute w-100 z-100 mt-1">
                  <li
                    v-for="item in riwayat.nomor_surat"
                    :key="item"
                    class="list-group-item list-group-item-action"
                    @mousedown="selectRiwayat('nomor_surat', item)"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>

              <div class="col-md-4">
                <label for="tanggal" class="form-label">Tanggal <span class="text-danger">*</span></label>
                <input
                  id="tanggal"
                  v-model="form.tanggal"
                  type="date"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.tanggal }"
                />
                <div class="invalid-feedback" v-if="errors.tanggal">{{ errors.tanggal }}</div>
              </div>

              <div class="col-md-4">
                <label for="kirim_ke" class="form-label">Kirim Ke <span class="text-danger">*</span></label>
                <input
                  id="kirim_ke"
                  v-model="form.kirim_ke"
                  type="text"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.kirim_ke }"
                  placeholder="Masukkan Kirim Ke"
                />
                <div class="invalid-feedback" v-if="errors.kirim_ke">{{ errors.kirim_ke }}</div>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-4">
                <label for="bc_no" class="form-label">BC No</label>
                <input
                  id="bc_no"
                  v-model="form.bc_no"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.bc_no }"
                  placeholder="Masukkan BC No"
                />
                <div class="invalid-feedback" v-if="errors.bc_no">{{ errors.bc_no }}</div>
              </div>

              <div class="col-md-4 position-relative">
                <label for="keterangan" class="form-label">Keterangan <span class="text-danger">*</span></label>
                <input
                  id="keterangan"
                  v-model="form.keterangan"
                  type="text"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.keterangan }"
                  placeholder="Masukkan Keterangan"
                  @input="fetchRiwayat('keterangan', form.keterangan)"
                  @focus="showRiwayat.keterangan = true"
                  @blur="hideRiwayat('keterangan')"
                />
                <div class="invalid-feedback" v-if="errors.keterangan">{{ errors.keterangan }}</div>
                <ul v-if="riwayat.keterangan.length && showRiwayat.keterangan" class="list-group position-absolute w-100 z-100 mt-1">
                  <li
                    v-for="item in riwayat.keterangan"
                    :key="item"
                    class="list-group-item list-group-item-action"
                    @mousedown="selectRiwayat('keterangan', item)"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>

              <div class="col-md-4 position-relative">
                <label for="cust_bond_nomor" class="form-label">Cust Bond Nomor <span class="text-danger">*</span></label>
                <input
                  id="cust_bond_nomor"
                  v-model="form.cust_bond_nomor"
                  type="text"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.cust_bond_nomor }"
                  placeholder="Masukkan Cust Bond Nomor"
                  @input="fetchRiwayat('cust_bond_nomor', form.cust_bond_nomor)"
                  @focus="showRiwayat.cust_bond_nomor = true"
                  @blur="hideRiwayat('cust_bond_nomor')"
                />
                <div class="invalid-feedback" v-if="errors.cust_bond_nomor">{{ errors.cust_bond_nomor }}</div>
                <ul v-if="riwayat.cust_bond_nomor.length && showRiwayat.cust_bond_nomor" class="list-group position-absolute w-100 z-100 mt-1">
                  <li
                    v-for="item in riwayat.cust_bond_nomor"
                    :key="item"
                    class="list-group-item list-group-item-action"
                    @mousedown="selectRiwayat('cust_bond_nomor', item)"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col-md-6 position-relative">
                <label for="kendaraan" class="form-label">Kendaraan <span class="text-danger">*</span></label>
                <input
                  id="kendaraan"
                  v-model="form.kendaraan"
                  type="text"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.kendaraan }"
                  placeholder="Masukkan Kendaraan"
                  @input="fetchRiwayat('kendaraan', form.kendaraan)"
                  @focus="showRiwayat.kendaraan = true"
                  @blur="hideRiwayat('kendaraan')"
                />
                <div class="invalid-feedback" v-if="errors.kendaraan">{{ errors.kendaraan }}</div>
                <ul v-if="riwayat.kendaraan.length && showRiwayat.kendaraan" class="list-group position-absolute w-100 z-100 mt-1">
                  <li
                    v-for="item in riwayat.kendaraan"
                    :key="item"
                    class="list-group-item list-group-item-action"
                    @mousedown="selectRiwayat('kendaraan', item)"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>

              <div class="col-md-6 position-relative">
                <label for="nopol" class="form-label">No Polisi <span class="text-danger">*</span></label>
                <input
                  id="nopol"
                  v-model="form.nopol"
                  type="text"
                  required
                  class="form-control"
                  :class="{ 'is-invalid': errors.nopol }"
                  placeholder="Masukkan No Polisi"
                  @input="fetchRiwayat('nopol', form.nopol)"
                  @focus="showRiwayat.nopol = true"
                  @blur="hideRiwayat('nopol')"
                />
                <div class="invalid-feedback" v-if="errors.nopol">{{ errors.nopol }}</div>
                <ul v-if="riwayat.nopol.length && showRiwayat.nopol" class="list-group position-absolute w-100 z-100 mt-1">
                  <li
                    v-for="item in riwayat.nopol"
                    :key="item"
                    class="list-group-item list-group-item-action"
                    @mousedown="selectRiwayat('nopol', item)"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>

            <h3 class="mb-3">Items</h3>
            <div class="row fw-bold border-bottom pb-2 mb-3 gx-2 align-items-center">
              <div class="col-3">Nama Barang</div>
              <div class="col-1">IDP</div>
              <div class="col-2">Color</div>
              <div class="col-1">Size</div>
              <div class="col-1">Qty</div>
              <div class="col-2">Pack</div>
              <div class="col-2 text-center">Aksi</div>
            </div>

            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="row align-items-center mb-2 gx-2"
            >
              <div class="col-3 position-relative">
                <input
                  type="text"
                  v-model="item.nama_barang"
                  :class="['form-control', itemErrors[index]?.nama_barang ? 'is-invalid' : '']"
                  placeholder="Nama Barang"
                  required
                  @input="fetchItemRiwayat(index, 'nama_barang', item.nama_barang)"
                  @focus="showItemRiwayat[index] = true"
                  @blur="hideRiwayat('nama_barang')"
                />
                <div class="invalid-feedback" v-if="itemErrors[index]?.nama_barang">{{ itemErrors[index].nama_barang }}</div>
                <ul v-if="itemRiwayat[index]?.nama_barang.length && showItemRiwayat[index]" class="list-group position-absolute w-100 z-100 mt-1">
                  <li
                    v-for="riwayatItem in itemRiwayat[index]?.nama_barang"
                    :key="riwayatItem"
                    class="list-group-item list-group-item-action"
                    @mousedown="selectItemRiwayat(index, 'nama_barang', riwayatItem)"
                  >
                    {{ riwayatItem }}
                  </li>
                </ul>
              </div>
              <div class="col-1">
                <input
                  type="text"
                  v-model="item.idp"
                  :class="['form-control', itemErrors[index]?.idp ? 'is-invalid' : '']"
                  placeholder="IDP"
                  required
                />
                <div class="invalid-feedback" v-if="itemErrors[index]?.idp">{{ itemErrors[index].idp }}</div>
              </div>
              <div class="col-2">
                <input
                  type="text"
                  v-model="item.color"
                  :class="['form-control', itemErrors[index]?.color ? 'is-invalid' : '']"
                  placeholder="Color"
                />
                <div class="invalid-feedback" v-if="itemErrors[index]?.color">{{ itemErrors[index].color }}</div>
              </div>
              <div class="col-1">
                <input
                  type="text"
                  v-model="item.size"
                  :class="['form-control', itemErrors[index]?.size ? 'is-invalid' : '']"
                  placeholder="Size"
                />
                <div class="invalid-feedback" v-if="itemErrors[index]?.size">{{ itemErrors[index].size }}</div>
              </div>
              <div class="col-1">
                <input
                  type="text"
                  v-model="item.qty"
                  :class="['form-control', itemErrors[index]?.qty ? 'is-invalid' : '']"
                  placeholder="Qty"
                  required
                />
                <div class="invalid-feedback" v-if="itemErrors[index]?.qty">{{ itemErrors[index].qty }}</div>
              </div>
              <div class="col-2">
                <input
                  type="text"
                  v-model="item.pack"
                  :class="['form-control', itemErrors[index]?.pack ? 'is-invalid' : '']"
                  placeholder="Pack"
                />
                <div class="invalid-feedback" v-if="itemErrors[index]?.pack">{{ itemErrors[index].pack }}</div>
              </div>
              <div class="col-2 text-center">
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  @click="removeItem(index)"
                  :disabled="form.items.length === 1"
                  title="Hapus Item"
                >
                  Hapus
                </button>
              </div>
            </div>

            <button type="button" class="btn btn-secondary mb-4" @click="addItem">
              + Tambah Item
            </button>

            <div class="d-flex align-items-center gap-3">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ loading ? 'Menyimpan...' : 'Simpan Surat Jalan' }}
              </button>
              <router-link to="/suratjalan" class="btn btn-link">Batal</router-link>
            </div>
          </form>
        </div>
      </main>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// This variable is not used in the code, so it can be removed.
// const API2_BASE_URL = import.meta.env.VITE_API2_BASE_URL; 

const router = useRouter();
const loading = ref(false);

const user = ref({});
onMounted(() => {
  try {
    const userData = localStorage.getItem('user');
    user.value = userData ? JSON.parse(userData) : { name: 'Guest' };
  } catch {
    user.value = { name: 'Guest' };
  }
});

const sidebarOpen = ref(true);
const windowWidth = ref(window.innerWidth);
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}
window.addEventListener('resize', () => {
  windowWidth.value = window.innerWidth;
});


// ... di dalam script setup
function hideRiwayat(fieldName) {
  setTimeout(() => {
    showRiwayat[fieldName] = false;
  }, 200);
}


const form = reactive({
  nomor_surat: '',
  tanggal: '',
  kirim_ke: 'PT LEETEX',
  bc_no: '-',
  keterangan: '',
  cust_bond_nomor: '',
  kendaraan: '',
  nopol: '',
  items: [
    {
      nama_barang: '',
      idp: '',
      color: '',
      size: '',
      qty: '',
      pack: ''
    }
  ],
});

const errors = reactive({});
const itemErrors = reactive([]);

const riwayat = reactive({
  nomor_surat: [],
  keterangan: [],
  cust_bond_nomor: [],
  kendaraan: [],
  nopol: [],
});

const showRiwayat = reactive({
  nomor_surat: false,
  keterangan: false,
  cust_bond_nomor: false,
  kendaraan: false,
  nopol: false,
});

const itemRiwayat = reactive([]);
const showItemRiwayat = reactive([]);

// Initialize item-specific reactive state for the first item
itemRiwayat.push({ nama_barang: [] });
showItemRiwayat.push(false);

function selectRiwayat(fieldName, value) {
  form[fieldName] = value;
  showRiwayat[fieldName] = false;
}

function selectItemRiwayat(index, fieldName, value) {
  if (form.items[index]) {
    form.items[index][fieldName] = value;
    showItemRiwayat[index] = false;
  }
}

let timeoutId = {};

async function fetchRiwayat(fieldName, query) {
  if (timeoutId[fieldName]) {
    clearTimeout(timeoutId[fieldName]);
  }

  if (!query || query.length < 1) {
    riwayat[fieldName] = [];
    return;
  }

  timeoutId[fieldName] = setTimeout(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/suratjalan/riwayat/${fieldName}?query=${query}`);
      riwayat[fieldName] = response.data;
    } catch (error) {
      console.error('Failed to fetch history:', error);
      riwayat[fieldName] = [];
    }
  }, 300);
}

async function fetchItemRiwayat(index, fieldName, query) {
  if (timeoutId[`item-${index}-${fieldName}`]) {
    clearTimeout(timeoutId[`item-${index}-${fieldName}`]);
  }

  if (!query || query.length < 1) {
    if (itemRiwayat[index] && itemRiwayat[index][fieldName]) {
      itemRiwayat[index][fieldName] = [];
    }
    return;
  }

  timeoutId[`item-${index}-${fieldName}`] = setTimeout(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/suratjalan/riwayat_item/${fieldName}?query=${query}`);
      if (!itemRiwayat[index]) {
        itemRiwayat[index] = {};
      }
      itemRiwayat[index][fieldName] = response.data;
    } catch (error) {
      console.error('Failed to fetch item history:', error);
      if (itemRiwayat[index]) {
        itemRiwayat[index][fieldName] = [];
      }
    }
  }, 300);
}

function validate() {
  Object.keys(errors).forEach(key => (errors[key] = ''));
  itemErrors.splice(0);

  let valid = true;

  const mainRequiredFields = ['nomor_surat', 'tanggal', 'kirim_ke', 'keterangan', 'cust_bond_nomor', 'kendaraan', 'nopol'];
  for (const field of mainRequiredFields) {
    if (!form[field]) {
      errors[field] = 'Field ini wajib diisi';
      valid = false;
    }
  }

  form.items.forEach((item, idx) => {
    itemErrors[idx] = {};
    const itemRequiredFields = ['nama_barang', 'idp', 'qty'];
    for (const field of itemRequiredFields) {
      if (!item[field]) {
        itemErrors[idx][field] = 'Field ini wajib diisi';
        valid = false;
      }
    }
  });

  return valid;
}

function addItem() {
  form.items.push({
    nama_barang: '',
    idp: '',
    color: '',
    size: '',
    qty: '',
    pack: ''
  });
  itemRiwayat.push({ nama_barang: [] });
  showItemRiwayat.push(false);
}

function removeItem(index) {
  if (form.items.length > 1) {
    form.items.splice(index, 1);
    itemRiwayat.splice(index, 1);
    showItemRiwayat.splice(index, 1);
  }
}

async function submitForm() {
  if (!validate()) {
    Swal.fire({
      icon: 'error',
      title: 'Form belum lengkap',
      text: 'Mohon periksa dan lengkapi data yang wajib diisi.',
    });
    return;
  }

  loading.value = true;
  try {
    await axios.post(`${API_BASE_URL}/suratjalan`, form);
    await Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Surat jalan berhasil dibuat!',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
    router.push('/suratjalan');
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Gagal membuat surat jalan: ' + (error.response?.data?.error || error.message),
    });
  } finally {
    loading.value = false;
  }
}

function logout() {
  localStorage.removeItem('user');
  router.push('/');
}
</script>

<style scoped>
.z-100 {
  z-index: 100;
}
</style>