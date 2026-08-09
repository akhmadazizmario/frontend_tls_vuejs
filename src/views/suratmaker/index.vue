<template>
  <div class="d-flex flex-column min-vh-100">
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
        <div class="container-lg">
          <h2 class="mb-4 text-primary">Surat Maker</h2>
          <p class="text-secondary">Kelola dan buat surat pengiriman dengan mudah.</p>

          <div class="row mb-3">
            <div class="col-12 text-end">
              <button
                class="btn btn-primary btn-lg rounded-pill shadow-sm"
                data-bs-toggle="modal"
                data-bs-target="#formModal"
                @click="openForm()"
              >
                <i class="bi bi-plus-circle me-2"></i> + Tambah Surat
              </button>
            </div>
          </div>

          <div class="card shadow-sm rounded-3 mb-4">
            <div class="card-body">
              <div
                class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
              >
                <div class="flex-grow-1">
                  <label for="searchNomorSurat" class="form-label fw-semibold mb-1"
                    >Cari Nomor Surat:</label
                  >
                  <Multiselect
                    v-model="selectedNomorSurat"
                    :options="nomorSuratOptions"
                    :multiple="true"
                    :searchable="true"
                    :loading="loadingOptions"
                    :clear-on-select="false"
                    :close-on-select="false"
                    :preserve-search="true"
                    placeholder="Pilih nomor surat..."
                    label="label"
                    track-by="id"
                    @search-change="onSearchChange"
                    class="w-100"
                  >
                    <template #noResult>
                      <span>Tidak ditemukan nomor surat yang cocok.</span>
                    </template>
                  </Multiselect>
                </div>
                <div class="d-flex gap-2 flex-shrink-0 mt-3 mt-md-0">
                  <button
                    class="btn btn-success d-flex align-items-center justify-content-center gap-2 rounded-pill px-4 shadow-sm"
                    :disabled="selectedNomorSurat.length === 0"
                    @click="downloadMultiplePdf"
                  >
                    <i class="bi bi-file-earmark-pdf"></i> PDF
                  </button>
                  <a href="/suratmaker" class="btn btn-secondary rounded-pill px-4"
                    >Reset</a
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="card shadow-sm rounded-3">
            <div class="card-body">
              <div class="table-responsive">
                
                <div v-if="tableState === 'ready'">
                    <table 
                        id="suratTable" 
                        class="table table-hover table-striped w-100"
                    >
                        <thead class="bg-primary text-white">
                            <tr>
                                <th scope="col">No</th>
                                <th scope="col">Nomor Surat</th>
                                <th scope="col">Kendaraan</th>
                                <th scope="col">Kirim Ke</th>
                                <th scope="col">Tanggal</th>
                                <th scope="col">Dibuat</th>
                                <th scope="col" class="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(surat, index) in suratmakers" :key="surat.id">
                                <td>{{ index + 1 }}</td>
                                <td>{{ surat.nomor_surat }}</td>
                                <td>{{ surat.kendaraan }}</td>
                                <td>{{ surat.kirim_ke }}</td>
                                <td>{{ surat.tanggal }}</td>
                                <td :data-order="surat.created_at">{{ formatRelativeTime(surat.created_at) }}</td>
                                <td class="text-center text-nowrap">
                                    <div class="d-flex justify-content-center gap-2">
                                        <button
                                            class="btn btn-warning btn-sm btn-edit"
                                            :data-id="surat.id"
                                            data-bs-toggle="modal"
                                            data-bs-target="#formModal"
                                        >
                                            <i class="bi bi-pencil-square"></i> Edit
                                        </button>
                                        <button class="btn btn-danger btn-sm btn-delete" :data-id="surat.id">
                                            <i class="bi bi-trash"></i> Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-else class="text-center p-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Memuat data tabel...</p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Footer />
  </div>

  <div
    class="modal fade"
    id="formModal"
    tabindex="-1"
    aria-hidden="true"
    ref="formModal"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 rounded-3 shadow-lg">
        <form @submit.prevent="saveSurat">
          <div class="modal-header bg-primary text-white border-bottom-0">
            <h5 class="modal-title">{{ form.id ? 'Edit Surat' : 'Tambah Surat' }}</h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body p-4 custom-modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label for="nomor_surat" class="form-label">Nomor Surat</label>
                <input
               type="text"
               id="nomor_surat"
               v-model="form.nomor_surat"
               class="form-control"
               required
                   @input="fetchRiwayat('nomor_surat', form.nomor_surat)" @focus="showRiwayat.nomor_surat = true" @blur="hideRiwayat('nomor_surat')" />
                <ul 
                    v-if="riwayat.nomor_surat.length && showRiwayat.nomor_surat" 
                    class="list-group position-absolute w-100 z-100 shadow-sm" 
                    style="z-index: 1000;"
                >
                    <li
                        v-for="item in riwayat.nomor_surat"
                        :key="item"
                        class="list-group-item list-group-item-action py-1 px-2 cursor-pointer"
                        @mousedown.prevent="selectRiwayat('nomor_surat', item)"
                    >
                        {{ item }}
                    </li>
                </ul>
              </div>
              <div class="col-md-6">
                <label for="kendaraan" class="form-label">Kendaraan</label>
                <input
                  type="text"
                  id="kendaraan"
                  v-model="form.kendaraan"
                  class="form-control"
                  required
                />
              </div>
              <div class="col-md-6">
                <label for="style" class="form-label">Style</label>
                <input type="text" id="style" v-model="form.style" class="form-control" 
                    @input="fetchRiwayat('style', form.style)" @focus="showRiwayat.style = true" @blur="hideRiwayat('style')" />
                <ul 
                    v-if="riwayat.style.length && showRiwayat.style" 
                    class="list-group position-absolute w-100 z-100 shadow-sm" 
                    style="z-index: 1000;"
                >
                    <li
                        v-for="item in riwayat.style"
                        :key="item"
                        class="list-group-item list-group-item-action py-1 px-2 cursor-pointer"
                        @mousedown.prevent="selectRiwayat('style', item)"
                    >
                        {{ item }}
                    </li>
                </ul>
                
              </div>
              <div class="col-md-6">
                <label for="idp_no" class="form-label">IDP No</label>
                <input type="text" id="idp_no" v-model="form.idp_no" class="form-control" />
              </div>
              <div class="col-md-6">
                <label for="kirim_ke" class="form-label">Kirim Ke</label>
                <input
               type="text"
               id="kirim_ke"
               v-model="form.kirim_ke"
               class="form-control"
               required
                   @input="fetchRiwayat('kirim_ke', form.kirim_ke)" @focus="showRiwayat.kirim_ke = true" @blur="hideRiwayat('kirim_ke')" />
                <ul 
                    v-if="riwayat.kirim_ke.length && showRiwayat.kirim_ke" 
                    class="list-group position-absolute w-100 z-100 shadow-sm" 
                    style="z-index: 1000;"
                >
                    <li
                        v-for="item in riwayat.kirim_ke"
                        :key="item"
                        class="list-group-item list-group-item-action py-1 px-2 cursor-pointer"
                        @mousedown.prevent="selectRiwayat('kirim_ke', item)"
                    >
                        {{ item }}
                    </li>
                </ul>
              </div>
              <div class="col-md-6">
                <label for="alamat" class="form-label">Alamat</label>
                <input
               type="text"
               id="alamat"
               v-model="form.alamat"
               class="form-control"
               required
                   @input="fetchRiwayat('alamat', form.alamat)" @focus="showRiwayat.alamat = true" @blur="hideRiwayat('alamat')" />
                <ul 
                    v-if="riwayat.alamat.length && showRiwayat.alamat" 
                    class="list-group position-absolute w-100 z-100 shadow-sm" 
                    style="z-index: 1000;"
                >
                    <li
                        v-for="item in riwayat.alamat"
                        :key="item"
                        class="list-group-item list-group-item-action py-1 px-2 cursor-pointer"
                        @mousedown.prevent="selectRiwayat('alamat', item)"
                    >
                        {{ item }}
                    </li>
                </ul>
              </div>
              <div class="col-md-6">
                <label for="tanggal" class="form-label">Tanggal</label>
                <input
                  type="date"
                  id="tanggal"
                  v-model="form.tanggal"
                  class="form-control"
                  required
                />
              </div>
              <div class="col-md-6">
                <label for="pack" class="form-label">Pack</label>
                <input
               type="text"
               id="pack"
               v-model="form.pack"
               class="form-control"
               required
                   @input="fetchRiwayat('pack', form.pack)" @focus="showRiwayat.pack = true" @blur="hideRiwayat('pack')" />
                <ul 
                    v-if="riwayat.pack.length && showRiwayat.pack" 
                    class="list-group position-absolute w-100 z-100 shadow-sm" 
                    style="z-index: 1000;"
                >
                    <li
                        v-for="item in riwayat.pack"
                        :key="item"
                        class="list-group-item list-group-item-action py-1 px-2 cursor-pointer"
                        @mousedown.prevent="selectRiwayat('pack', item)"
                    >
                        {{ item }}
                    </li>
                </ul>
              </div>
            </div>
            <hr class="my-4" />
            <h5 class="mb-3">Daftar Barang</h5>
            <div class="table-responsive">
              <table class="table table-bordered align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Nama Barang</th>
                    <th>Warna</th>
                    <th>Size</th>
                    <th>Qty</th>
                    <th>Keterangan</th>
                    <th class="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="form.items.length === 0">
                    <td colspan="6" class="text-center text-muted py-3">
                      Tidak ada barang ditambahkan.
                    </td>
                  </tr>
                  <tr v-else v-for="(item, index) in form.items" :key="index">
                    <td>
                      <input
                        type="text"
                        v-model="item.nama_barang"
                        class="form-control form-control-sm"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        v-model="item.warna"
                        class="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <div class="position-relative">
                        <input
                          type="text"
                          v-model="item.size"
                          class="form-control form-control-sm"
                          :class="{'is-invalid': isDuplicateSize(index)}"
                        />
                        <div v-if="isDuplicateSize(index)" class="invalid-feedback">
                          Size sudah dipakai di warna ini
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        v-model="item.qty"
                        class="form-control form-control-sm"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        v-model="item.keterangan"
                        class="form-control form-control-sm"
                      />
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        @click="removeItem(index)"
                      >
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              type="button"
              class="btn btn-outline-primary btn-sm mt-2"
              @click="addItem"
            >
              <i class="bi bi-plus-circle me-1"></i> Tambah Barang
            </button>
          </div>
          <div class="modal-footer border-top-0 p-3">
            <button
              type="button"
              class="btn btn-secondary rounded-pill px-4"
              data-bs-dismiss="modal"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn btn-primary rounded-pill px-4"
              data-bs-dismiss="modal"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, reactive } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import io from 'socket.io-client';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';

import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

const user = ref({});
const sidebarOpen = ref(false);
const suratmakers = ref([]); 
const windowWidth = ref(window.innerWidth);
// ⭐ Perubahan: Menggunakan tableState
const tableState = ref('loading'); // State: 'loading' atau 'ready'
const form = ref({
    id: null,
    nomor_surat: '',
    kendaraan: '',
    style: '',
    idp_no: '',
    kirim_ke: '',
    alamat: '',
    tanggal: dayjs().format('YYYY-MM-DD'), 
    pack: '',
    items: [],
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API2_BASE_URL = import.meta.env.VITE_API2_BASE_URL;

const socket = io(API2_BASE_URL);
let table = null;
let reloadTimeout = null;

const nomorSuratOptions = ref([]);
const selectedNomorSurat = ref([]);
const loadingOptions = ref(false);

const formatRelativeTime = (date) => {
    return dayjs(date).fromNow();
};


// ** [BARU] STATE REAKTIF UNTUK RIWAYAT **
const riwayat = ref({
    nomor_surat: [],
    kirim_ke: [],
    alamat: [],
    pack: [],
    style: [],
});

const showRiwayat = reactive({
    nomor_surat: false,
    kirim_ke: false,
    alamat: false,
    pack: false,
    style: false,
});

let timeoutId = {}; // Untuk debounce

function hideRiwayat(fieldName) {
    // Tunggu sebentar agar event @mousedown pada item riwayat sempat tereksekusi
    setTimeout(() => {
        showRiwayat[fieldName] = false;
    }, 200);
}

function selectRiwayat(fieldName, value) {
    // Memastikan data dimasukkan ke form.value
    form.value[fieldName] = value;
    showRiwayat[fieldName] = false;
}

async function fetchRiwayat(fieldName, query) {
    if (timeoutId[fieldName]) {
        clearTimeout(timeoutId[fieldName]);
    }

    // Hanya fetch jika query tidak kosong dan minimal 1 karakter
    if (!query || query.length < 1) {
        riwayat.value[fieldName] = [];
        return;
    }

    timeoutId[fieldName] = setTimeout(async () => {
        try {
            // Asumsi endpoint riwayat Anda sama dengan file pertama
            // Endpoint ini akan menerima fieldName (misal: 'nomor_surat') dan query (nilai input)
            const response = await axios.get(`${API_BASE_URL}/suratmaker/riwayat/${fieldName}?query=${query}`);
            riwayat.value[fieldName] = response.data; // Asumsi response.data adalah array of strings/objects
            // Pastikan riwayat ditampilkan saat data berhasil diambil
            showRiwayat[fieldName] = true; 
        } catch (error) {
            console.error('Failed to fetch history for', fieldName, ':', error);
            riwayat.value[fieldName] = [];
        }
    }, 300); // Debounce 300ms
}

// ----------------------------------------------------------------------
// DATATABLES MANAGEMENT & RELOAD FUNCTIONS
// ----------------------------------------------------------------------

async function loadData() {
    try {
        const res = await axios.get(`${API_BASE_URL}/suratmaker?sort=desc`);
        suratmakers.value = res.data;  
        return res.data; 
    } catch (error) {
        console.error('Gagal memuat data:', error);
        Swal.fire('Gagal', 'Terjadi kesalahan saat memuat data.', 'error');
        return [];
    }
}

const initDataTable = () => {
    if ($('#suratTable').length === 0) {
        console.warn('Elemen #suratTable tidak ditemukan saat mencoba inisialisasi.');
        return;
    }

    table = $('#suratTable').DataTable({
        order: [[5, 'desc']], 
        pageLength: 10,
        lengthChange: false,
        searching: true,
        autoWidth: false,
        stateSave: true,
        columnDefs: [
            { orderable: false, targets: [0, 6] } 
        ],
        language: {
            search: 'Cari:',
            zeroRecords: 'Data tidak ditemukan',
            info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ data',
            infoEmpty: 'Tidak ada data tersedia',
            infoFiltered: '(difilter dari _MAX_ total data)',
            paginate: {
                next: 'Berikutnya',
                previous: 'Sebelumnya',
            },
        },
    });

    $('#suratTable').off('click', '.btn-edit'); 
    $('#suratTable').off('click', '.btn-delete'); 

    $('#suratTable').on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        const suratData = suratmakers.value.find(s => s.id == id);
        if (suratData) openForm(suratData); 
    });

    $('#suratTable').on('click', '.btn-delete', function() {
        const id = $(this).data('id');
        deleteSurat(id); 
    });
};

// ⭐ FUNGSI UTAMA RELOAD: Menggunakan tableState
async function loadDataAndReloadTable() {
    // 1. PASTIKAN INSTANCE DataTables LAMA DIHANCURKAN
    if ($.fn.DataTable.isDataTable('#suratTable')) {
        $('#suratTable').DataTable().destroy();
        $('#suratTable').off('click', '.btn-edit'); 
        $('#suratTable').off('click', '.btn-delete');
        table = null;
    }
    
    // 2. Set state ke loading (Vue menghapus DOM tabel)
    tableState.value = 'loading';
    
    // 3. Tunggu Vue selesai menghapus DOM lama
    await nextTick(); 
    
    // 4. Ambil data baru
    await loadData(); 
    
    // 5. Set state ke ready (Vue merender DOM tabel baru)
    tableState.value = 'ready';

    // 6. Tunggu Vue selesai merender DOM baru (v-for selesai)
    await nextTick(); 
    
    // 7. Isolasi Inisialisasi DataTables
    setTimeout(() => {
        initDataTable(); 
    }, 0); 
}

// ----------------------------------------------------------------------
// LIFECYCLE HOOKS
// ----------------------------------------------------------------------

onMounted(async () => {
    await loadDefaultOptions();
    await loadDataAndReloadTable(); 

    const userData = localStorage.getItem('user');
    if (userData) user.value = JSON.parse(userData);

    // 🔔 Socket Listeners (gunakan debounce agar tidak tabrakan)
    socket.on('suratmaker:new', () => {
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
            loadDataAndReloadTable();
        }, 300);
    });

    socket.on('suratmaker:update', () => {
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
            loadDataAndReloadTable();
        }, 300);
    });

    socket.on('suratmaker:delete', () => {
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
            loadDataAndReloadTable();
        }, 300);
    });
});

onBeforeUnmount(() => {
    // Final check destroy DataTables
    if ($.fn.DataTable.isDataTable('#suratTable')) {
        $('#suratTable').DataTable().destroy();
    }
    // Hapus listener global
    $('#suratTable').off('click', '.btn-edit'); 
    $('#suratTable').off('click', '.btn-delete'); 
    
    socket.disconnect();
});

// ----------------------------------------------------------------------
// CRUD & FORM LOGIC
// ----------------------------------------------------------------------

const openForm = (data = null) => {
  form.value = data
    ? JSON.parse(JSON.stringify(data))
    : {
        id: null,
        nomor_surat: '',
        kendaraan: '-',
        style: '',
        idp_no: '-',
        kirim_ke: '',
        alamat: '',
        tanggal: dayjs().format('YYYY-MM-DD'), 
        pack: '',
        items: [{ nama_barang: '', warna: '', size: '', qty: '', keterangan: '' }],
      };
};

const saveSurat = async () => {
  try {
    const adaSizeKosong = form.value.items.some(
      (item) => !item.size || item.size.trim() === ""
    );
    if (adaSizeKosong) {
      Swal.fire("Error", "Kolom **SIZE** wajib diisi untuk semua barang!", "error");
      return; 
    }

    const kombinasi = new Set();
    for (const item of form.value.items) {
      const key = `${item.warna?.trim().toLowerCase()}-${item.size?.trim().toLowerCase()}`;
      if (kombinasi.has(key)) {
        Swal.fire(
          "Error",
          `Duplikat SIZE "${item.size}" ditemukan pada WARNA "${item.warna}"!`,
          "error"
        );
        return;
      }
      kombinasi.add(key);
    }

    form.value.items = form.value.items.map((item) => ({
      ...item,
      qty: item.qty === "" || item.qty == null ? 0 : item.qty,
    }));

    if (form.value.id) {
      await axios.put(`${API_BASE_URL}/suratmaker/${form.value.id}`, form.value);
      Swal.fire("Sukses", "Data berhasil diperbarui", "success");
    } else {
      await axios.post(`${API_BASE_URL}/suratmaker`, form.value);
      Swal.fire("Sukses", "Data berhasil ditambahkan", "success");
    }

    await loadDataAndReloadTable(); 
  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.response?.data?.error || "Terjadi kesalahan", "error");
  }
};

const isDuplicateSize = (currentIndex) => {
  const currentItem = form.value.items[currentIndex];
  if (!currentItem.warna || !currentItem.size) return false;

  return form.value.items.some(
    (item, idx) =>
      idx !== currentIndex &&
      item.warna?.trim().toLowerCase() === currentItem.warna.trim().toLowerCase() &&
      item.size?.trim().toLowerCase() === currentItem.size.trim().toLowerCase()
  );
};


const deleteSurat = async (id) => {
  Swal.fire({
    title: 'Yakin?',
    text: 'Data akan dihapus permanen',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal',
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/suratmaker/${id}`);
        Swal.fire('Sukses', 'Data berhasil dihapus', 'success');
        await loadDataAndReloadTable();
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.response?.data?.error || 'Terjadi kesalahan', 'error');
      }
    }
  });
};

const addItem = async () => {
  if (form.value.items.length > 0) {
    const lastItem = form.value.items[form.value.items.length - 1];
    
    if (lastItem.nama_barang || lastItem.warna) {
      const result = await Swal.fire({
        title: 'Tambah Barang',
        text: 'Apakah nama barang dan warnanya sama dengan yang sebelumnya?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, sama',
        cancelButtonText: 'Tidak, beda',
      });

      if (result.isConfirmed) {
        form.value.items.push({
          nama_barang: lastItem.nama_barang,
          warna: lastItem.warna,
          size: '',
          qty: '',
          keterangan: '',
        });
        return; 
      }
    }
  }
  form.value.items.push({ nama_barang: '', warna: '', size: '', qty: '', keterangan: '' });
};

const removeItem = (index) => {
  form.value.items.splice(index, 1);
};

// ----------------------------------------------------------------------
// MULTISELECT LOGIC
// ----------------------------------------------------------------------

async function loadDefaultOptions() {
  loadingOptions.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/suratmaker/all_nomor`);
    nomorSuratOptions.value = res.data;
  } catch (error) {
    nomorSuratOptions.value = [];
    console.error('Gagal load default nomor surat:', error);
  } finally {
    loadingOptions.value = false;
  }
}

async function onSearchChange(query) {
   if (!query || query.trim() === '') {
     await loadDefaultOptions();
     return;
   }
   
   loadingOptions.value = true;
   try {
     const res = await axios.get(`${API_BASE_URL}/suratmaker/search_nomor`, {
         params: { q: query },
     });
     nomorSuratOptions.value = res.data;
   } catch (error) {
     nomorSuratOptions.value = [];
     console.error('Gagal search nomor surat:', error);
   } finally {
     loadingOptions.value = false;
   }
}

async function downloadMultiplePdf() {
  if (selectedNomorSurat.value.length === 0) return;
  const nomorParam = selectedNomorSurat.value.map((o) => o.id).join(',');
  const url = `${API_BASE_URL}/suratmaker/export_multiplepdf?nomorsurat=${encodeURIComponent(
    nomorParam
  )}`;
  window.open(url, '_blank');
}

// ----------------------------------------------------------------------
// UI LOGIC
// ----------------------------------------------------------------------

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

function logout() {
  localStorage.removeItem('user');
  window.location.href = '/login';
}
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.rounded-pill {
  border-radius: 50rem !important;
}

/* Modifikasi CSS untuk modal */
.custom-modal-body {
  max-height: 65vh; 
  overflow-y: auto;
}

/* Penyesuaian untuk layar yang lebih kecil */
@media (max-width: 767.98px) {
  .modal-dialog {
    margin: 0.5rem;
  }
  
  .modal-dialog.modal-lg {
    max-width: 95%;
  }
}
</style>
<style>
/* Global style di sini Baru */
@import 'vue-multiselect/dist/vue-multiselect.min.css';
@import 'bootstrap-icons/font/bootstrap-icons.css';
</style>