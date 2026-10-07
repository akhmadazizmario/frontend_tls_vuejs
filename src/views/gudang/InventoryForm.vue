<template>
  <div class="d-flex flex-column mt-5 min-vh-100 bg-light">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-5">
        <div class="container-xl">

          <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-1">
                  <li class="breadcrumb-item"><a href="#" class="text-decoration-none">Inventory</a></li>
                  <li class="breadcrumb-item active">{{ isEdit ? 'Edit' : 'Registration' }}</li>
                </ol>
              </nav>
              <h3 class="fw-bold text-dark m-0">
                <i class="bi" :class="isEdit ? 'bi-pencil-square text-warning' : 'bi-plus-circle-fill text-primary'"></i>
                {{ isEdit ? 'Update Data Barang' : 'Barang Masuk Multi-Item' }}
              </h3>
              <p class="text-muted small mb-0">Kelola stok inventaris PT TLSI dengan sistem PO otomatis.</p>
            </div>
            <button @click="$router.back()" class="btn btn-outline-secondary border-0 shadow-sm bg-white rounded-3 px-3">
              <i class="bi bi-arrow-left me-2"></i>Kembali
            </button>
          </div>

          <form @submit.prevent="saveData">

            <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
              <div class="card-header bg-white border-0 pt-4 px-4">
                <h6 class="fw-bold mb-0 text-uppercase tracking-wider text-primary" style="font-size: 0.8rem;">
                  <i class="bi bi-file-earmark-text me-2"></i>Informasi Dokumen
                </h6>
              </div>
              <div class="card-body p-4 pt-3">
                <div class="row g-3">
                  <div class="col-md-3">
                    <div class="form-floating">
                      <input v-model="formHeader.factory" class="form-control border-0 bg-light rounded-3" list="factoryList" id="floatFactory" placeholder="Factory">
                      <label for="floatFactory">Factory</label>
                    </div>
                    <datalist id="factoryList">
                      <option value="TLSI"/>
                      <option value="LEETEX"/>
                      <option value="Pinangsia"/>
                    </datalist>
                  </div>

                  <!-- NPB -->
<div class="col-md-3" v-if="isEdit">
  <div class="form-floating">
    <input 
      v-model="formHeader.npb" 
      class="form-control border-0 bg-light-subtle fw-bold text-primary" 
      id="floatNPB" 
      readonly 
      placeholder="NPB"
    >
    <label for="floatNPB">Nomor NPB</label>
  </div>
</div>

<!-- PO NUMBER -->
<div class="col-md-3" v-if="isEdit">
  <div class="form-floating">
    <input 
      v-model="formHeader.po_number" 
      class="form-control border-0 bg-light-subtle fw-bold text-primary" 
      id="floatPO" 
      readonly 
      placeholder="PO"
    >
    <label for="floatPO">PO Number</label>
  </div>
</div>

                  <div class="col-md-3">
                    <div class="form-floating">
                      <input v-model="formHeader.supplier" class="form-control border-0 bg-light rounded-3" id="floatSupplier" placeholder="Supplier">
                      <label for="floatSupplier">Supplier / Vendor</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-for="(item, index) in items"
              :key="index"
              class="card border-0 shadow-sm rounded-4 mb-4 item-card animate__animated animate__fadeInUp"
            >
              <div class="card-header d-flex justify-content-between align-items-center bg-white border-0 pt-4 px-4">
                <span class="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                  Item #{{ index + 1 }}
                </span>

                <button
                  v-if="!isEdit && items.length > 1"
                  @click.prevent="removeItem(index)"
                  class="btn btn-link text-danger p-0 text-decoration-none"
                >
                  <i class="bi bi-x-circle-fill fs-5"></i>
                </button>
              </div>

              <div class="card-body p-4 pt-3">
                <div class="row g-4">
                  
                  <div class="col-md-6 position-relative">
                    <label class="form-label small fw-bold text-secondary">Nama Barang</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-0"><i class="bi bi-box-seam"></i></span>
                      <input
                        v-model="item.item_name"
                        @input="handleSearchHistory(index)"
                        class="form-control border-0 bg-light"
                        :readonly="isEdit"
                        placeholder="Ketik nama barang..." required
                      >
                    </div>

                    <div v-if="showDropdown" class="dropdown-menu show w-100 shadow-lg border-0 rounded-3 mt-1 py-0 shadow" style="z-index: 1050; max-height: 280px; overflow: hidden; display: flex; flex-direction: column;">
  <!-- Header tetap sticky/diam di atas -->
  <div class="bg-primary-subtle px-3 py-2 small fw-bold text-primary border-bottom flex-shrink-0">
    Hasil Pencarian Terakhir
  </div>
  
  <!-- Container List Item (Bisa di-scroll) -->
  <div class="dropdown-history-list flex-grow-1 overflow-y-auto">
    <button
      v-for="h in historyItems"
      :key="h.id"
      @click="selectHistory(h, index)"
      class="dropdown-item py-2 border-bottom-light"
    >
      <div class="fw-bold">{{ h.item_name }}</div>
      <div class="extra-small text-muted">{{ h.spesifikasi }} • <span class="text-primary">{{ h.akses_code }}</span></div>
    </button>
  </div>
</div>
                  </div>

                  <div class="col-md-3">
                    <label class="form-label small fw-bold text-secondary">Kategori</label>
                    <select v-model="item.kategori" class="form-select border-0 bg-light" :disabled="isEdit" required>
                      <option value="">-- Pilih --</option>
                      <option value="mekanik">Mekanik</option>
                      <option value="umum">Umum</option>
                      <option value="office">Office</option>
                      <option value="produksi">Produksi</option>
                    </select>
                  </div>

                  <div class="col-md-3">
                    <label class="form-label small fw-bold text-secondary">Akses Code (Otomatis generated)</label>
                    <input v-model="item.akses_code" class="form-control border-0 bg-light-subtle fw-bold" readonly placeholder="-">
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Spesifikasi Technical</label>
                    <textarea v-model="item.spesifikasi" class="form-control border-0 bg-light" rows="2" placeholder="Detail spesifikasi..." required></textarea>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Deskripsi Tambahan</label>
                    <textarea v-model="item.deskripsi" class="form-control border-0 bg-light" rows="2" placeholder="Catatan kegunaan..."></textarea>
                  </div>

                  <div class="col-lg-3 col-md-6">
                    <label class="form-label small fw-bold text-secondary">Kuantitas (Qty)</label>
                    <div class="input-group">
                      <input v-model.number="item.qty_awal" type="number" class="form-control border-0 bg-light text-center fw-bold">
                      <span class="input-group-text bg-light border-0 fw-bold text-muted">{{ item.unit }}</span>
                    </div>
                  </div>

                  <div class="col-lg-2 col-md-6 text-center">
                    <label class="form-label small fw-bold text-secondary text-center d-block">Satuan</label>
                    <input v-model="item.unit" class="form-control border-0 bg-light text-center fw-bold text-uppercase">
                  </div>

                  <div class="col-lg-3 col-md-6">
                    <label class="form-label small fw-bold text-secondary">Harga Satuan</label>
                    <div class="input-group">
                      <span class="input-group-text bg-light border-0 text-muted">Rp</span>
                      <input v-model.number="item.price_per_pcs" type="number" class="form-control border-0 bg-light fw-bold text-end">
                    </div>
                  </div>

                  <div class="col-lg-4 col-md-6">
                    <label class="form-label small fw-bold text-secondary">Sub-Total</label>
                    <input
                      :value="'Rp ' + item.amount.toLocaleString('id-ID')"
                      class="form-control border-0 bg-primary-subtle text-primary fw-bolder text-end fs-5"
                      readonly
                    >
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Min QTY</label>
                    <input v-model.number="item.min_qty" type="number" class="form-control border-0 bg-light text-center fw-bold">
                  </div>

                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Max Qty</label>
                    <input v-model.number="item.max_qty" type="number" class="form-control border-0 bg-light text-center fw-bold">
                  </div>


                </div>
              </div>
            </div>

            <div class="d-flex flex-column flex-md-row gap-3 mt-5 mb-5">
              <button
                v-if="!isEdit"
                type="button"
                @click="addItem"
                class="btn btn-white border-primary text-primary rounded-3 px-4 py-3 flex-grow-1 shadow-sm hover-up"
              >
                <i class="bi bi-plus-lg me-2"></i>Tambah Item Lainnya
              </button>

              <button class="btn btn-primary rounded-3 px-5 py-3 flex-grow-1 shadow-primary fw-bold" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-cloud-check me-2"></i>
                {{ isEdit ? 'Update Perubahan Data' : 'Simpan Transaksi Sekarang' }}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Swal from 'sweetalert2';

import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const route = useRoute();
const router = useRouter();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// =======================
// STATE
// =======================
const user = ref({ name: '' });
const sidebarOpen = ref(false);
const loading = ref(false);
const isEdit = ref(false);

const historyItems = ref([]);
const showDropdown = ref(false);

// =======================
// 🔥 MULTI ITEMS
// =======================
const items = ref([createEmptyItem()]);

function createEmptyItem() {
  return {
    item_name: '',
    spesifikasi: '',
    deskripsi: '',
    kategori: '',
    akses_code: '',
    brand: '',
    color: '',
    size: '',
    qty_awal: 0,
    max_qty: 0,
    min_qty: 0,
    unit: 'Pcs',
    rak: '',
    rak_no: '',
    price_per_pcs: 0,
    amount: 0
  };
}

// =======================
// 🔥 HEADER (GLOBAL)
// =======================
const formHeader = ref({
  factory: '',
  npb: '',
  po_number: '',
  in_date: new Date().toISOString().substr(0, 10),
  bill_date: new Date().toISOString().substr(0, 10),
  supplier: '',
  createdBy: '',
  updatedBy: ''
});

// =======================
// 🔥 AUTO HITUNG AMOUNT
// =======================
watch(
  items,
  (val) => {
    val.forEach(item => {
      const q = Number(item.qty_awal) || 0;
      const p = Number(item.price_per_pcs) || 0;
      item.amount = q * p;
    });
  },
  { deep: true }
);

// =======================
// 🔥 ADD / REMOVE ITEM
// =======================
const addItem = () => {
  if (isEdit.value) return; // ❗ extra safety
  items.value.push(createEmptyItem());
};

const removeItem = (index) => {
  if (items.value.length === 1) return;
  items.value.splice(index, 1);
};

// =======================
// 🔍 SEARCH HISTORY
// =======================
const handleSearchHistory = async (index) => {
  const name = items.value[index].item_name;

  if (!name || name.length < 2) {
    historyItems.value = [];
    showDropdown.value = false;
    return;
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/item/history?name=${name}`);
    historyItems.value = res.data;
    showDropdown.value = true;
  } catch (err) {
    console.error("Gagal ambil history", err);
  }
};

// =======================
// 🔥 APPLY HISTORY
// =======================
const selectHistory = (item, index) => {
  const target = items.value[index];

  target.item_name = item.item_name;
  target.spesifikasi = item.spesifikasi;
  target.kategori = item.kategori;
  target.akses_code = item.akses_code;
  target.brand = item.brand;
  target.unit = item.unit;
  target.color = item.color;
  target.size = item.size;
  target.rak = item.rak;
  target.rak_no = item.rak_no;
  
  // 🔥 TAMBAHKAN LOGIKA INI: 
  // Mengambil nilai min & max qty terakhir dari data lama yang dipilih
  target.min_qty = item.min_qty ?? 0;
  target.max_qty = item.max_qty ?? 0;

  showDropdown.value = false;

  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'info',
    title: 'Data lama digunakan',
    text: `Min Qty: ${target.min_qty}, Max Qty: ${target.max_qty}`,
    timer: 2000,
    showConfirmButton: false
  });
};

// =======================
// INIT
// =======================
onMounted(() => {
  const rawUser = localStorage.getItem('user');
  if (rawUser) {
    const parsed = JSON.parse(rawUser);
    user.value = parsed.user ?? parsed;
    formHeader.value.createdBy = user.value.name;
  }

  if (route.params.id) {
    isEdit.value = true;
    fetchDetail(route.params.id);
  }

  // close dropdown kalau klik luar
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".position-relative")) {
      showDropdown.value = false;
    }
  });
});

// =======================
// 🔥 FETCH DETAIL (EDIT)
// =======================
const fetchDetail = async (id) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/item/${id}`);

    // Set Data Header
    formHeader.value = {
      factory: res.data.factory,
      npb: res.data.npb,
      po_number: res.data.po_number,
      supplier: res.data.supplier,
      in_date: res.data.in_date,
      bill_date: res.data.bill_date,
      updatedBy: user.value.name
    };

    // Set Data Item
    // Pastikan jika min_qty atau max_qty di database bernilai null, diubah ke 0 agar input tidak error[cite: 1]
    items.value = [{
      ...res.data,
      min_qty: res.data.min_qty ?? 0,
      max_qty: res.data.max_qty ?? 0
    }];

  } catch (err) {
    Swal.fire('Error', 'Gagal load data', 'error');
  }
};

// =======================
// 💾 SAVE
// =======================
const saveData = async () => {
  const invalidIndex = items.value.findIndex(
    (i) => !i.item_name?.trim() || !i.spesifikasi?.trim() || !i.kategori?.trim()
  );

  if (invalidIndex !== -1) {
    return Swal.fire({
      icon: 'warning',
      title: `Item #${invalidIndex + 1} belum lengkap`,
      text: 'Nama barang dan spesifikasi wajib diisi!',
    });
  }
  
  loading.value = true;

  try {
    formHeader.value.updatedBy = user.value.name;

    if (!isEdit.value) {
      // 🔥 MULTI CREATE[cite: 1]
      // Sebelum kirim, pastikan min_qty dan max_qty terformat sebagai number[cite: 1]
      const formattedItems = items.value.map(item => ({
        ...item,
        min_qty: Number(item.min_qty) || 0,
        max_qty: Number(item.max_qty) || 0
      }));

      const payload = {
        ...formHeader.value,
        items: formattedItems
      };

      await axios.post(`${API_BASE_URL}/item`, payload);

    } else {
      // 🔥 SINGLE UPDATE[cite: 1]
      // Ambil item pertama (karena edit selalu satu data) dan format nilainya[cite: 1]
      const updatedItem = {
        ...items.value[0],
        ...formHeader.value, // Gabungkan data header jika ada perubahan factory/supplier saat edit
        min_qty: Number(items.value[0].min_qty) || 0,
        max_qty: Number(items.value[0].max_qty) || 0
      };

      await axios.put(`${API_BASE_URL}/item/${route.params.id}`, updatedItem);
    }

    await Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: isEdit.value ? 'Data berhasil diupdate dan disinkronkan ke item sejenis' : 'Semua item berhasil disimpan',
      timer: 1500
    });

    router.push('/item-masuk');

  } catch (e) {
    Swal.fire('Error', e.response?.data?.message || 'Gagal menyimpan data', 'error');
  } finally {
    loading.value = false;
  }
};

// =======================
// UI
// =======================
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const logout = () => {
  localStorage.clear();
  router.push('/');
};
</script>

<style scoped>
/* Custom Color & Effects */
.bg-light { background-color: #f8f9fc !important; }
.shadow-sm { box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.05) !important; }
.shadow-primary { box-shadow: 0 8px 20px rgba(13, 110, 253, 0.25); }
.tracking-wider { letter-spacing: 0.05em; }

.item-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid #0d6efd !important;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
}

.hover-up:hover {
  background-color: #f0f7ff;
  transform: translateY(-2px);
}

.form-control, .form-select {
  padding: 0.75rem 1rem;
}

.form-control:focus {
  background-color: #fff !important;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
  border: 1px solid #0d6efd !important;
}

.extra-small { font-size: 0.75rem; }

/* Custom Scrollbar for Dropdown */
.dropdown-menu {
  max-height: 300px;
  overflow-y: auto;
}

.border-bottom-light {
  border-bottom: 1px solid #f1f1f1;
}

/* Animation */
.animate__animated {
  animation-duration: 0.5s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate__fadeInUp {
  animation-name: fadeInUp;
}

/* Custom Scrollbar untuk Dropdown History */
.dropdown-history-list {
  max-height: 220px;
  overflow-y: auto;
}

/* Mempercantik Tampilan Scrollbar (Opsional) */
.dropdown-history-list::-webkit-scrollbar {
  width: 6px;
}

.dropdown-history-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.dropdown-history-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.dropdown-history-list::-webkit-scrollbar-thumb:hover {
  background: #0d6efd;
}
</style>