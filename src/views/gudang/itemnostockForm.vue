<template>
  <div class="d-flex flex-column min-vh-100 bg-light-subtle">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />
      
      <main class="flex-grow-1 p-3 p-md-4 main-content" :style="mainContentStyle">
        <div class="container">
          <div class="row mb-4">
            <div class="col">
              <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-1 small">
                  <li class="breadcrumb-item"><router-link to="/no-stock">No Stock</router-link></li>
                  <li class="breadcrumb-item active">{{ isEdit ? 'Edit PO' : 'Buat PO Baru' }}</li>
                </ol>
              </nav>
              <h3 class="fw-bold text-dark">{{ isEdit ? 'Edit Purchase Order' : 'Form Purchase Order Baru' }}</h3>
            </div>
          </div>

          <form @submit.prevent="saveData">
            <div class="row g-4">
              <div class="col-lg-8">
                <div class="card border-0 shadow-sm rounded-4 p-4 mb-4">
                  <h5 class="fw-bold mb-4 text-primary"><i class="bi bi-info-circle me-2"></i>Informasi Utama</h5>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Kategori <span class="text-danger">*</span></label>
                      <select v-model="form.kategori" class="form-select" required @change="generateAutoNumber">
                        <option value="">-- Pilih Kategori --</option>
                        <option value="mekanik">Mekanik</option>
                        <option value="umum">Umum</option>
                        <option value="office">Office</option>
                        <option value="produksi">Produksi</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">No. NPB (Otomatis)</label>
                      <input type="text" v-model="form.npb" class="form-control bg-light" readonly />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Supplier / Vendor</label>
                      <input type="text" v-model="form.supplier" class="form-control" placeholder="Nama supplier" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-primary">No. PO (Otomatis)</label>
                      <input type="text" v-model="form.po_number" class="form-control fw-bold border-primary shadow-sm" readonly />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Tanggal PO</label>
                      <input type="date" v-model="form.date" class="form-control" />
                    </div>
                  </div>
                </div>

                <div class="card border-0 shadow-sm rounded-4 p-4 mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="fw-bold m-0 text-primary"><i class="bi bi-box-seam me-2"></i>Daftar Barang</h5>
                    <button type="button" @click="addItem" class="btn btn-sm btn-primary">
                      <i class="bi bi-plus-lg me-1"></i> Tambah Item
                    </button>
                  </div>
                  
                  <div v-for="(item, index) in items" :key="index" class="border rounded-3 p-3 mb-3 bg-white shadow-sm position-relative">
                    <button v-if="items.length > 1" type="button" @click="removeItem(index)" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2">
                      <i class="bi bi-trash"></i>
                    </button>

                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label small fw-bold">Nama Barang <span class="text-danger">*</span></label>
                        <input type="text" v-model="item.item_name" class="form-control form-control-sm" placeholder="Nama barang..." required />
                      </div>
                      <div class="col-md-6">
                        <label class="form-label small fw-bold">Spesifikasi</label>
                        <input type="text" v-model="item.spesifikasi" class="form-control form-control-sm" placeholder="Detail teknis..."  required/>
                      </div>

                      <div class="col-md-2">
                        <label class="form-label small fw-bold">Qty</label>
                        <input type="number" v-model.number="item.qty" class="form-control form-control-sm" @input="calculateTotal" required min="1" />
                      </div>
                      <div class="col-md-2">
                        <label class="form-label small fw-bold">Unit</label>
                        <input type="text" v-model="item.unit" class="form-control form-control-sm" placeholder="Pcs/Unit" />
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small fw-bold">Harga Satuan</label>
                        <div class="input-group input-group-sm">
                          <span class="input-group-text">Rp</span>
                          <input type="number" v-model.number="item.price_per_pcs" class="form-control" @input="calculateTotal" required />
                        </div>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small fw-bold">Warna / Size</label>
                        <div class="input-group input-group-sm">
                          <input type="text" v-model="item.color" class="form-control" placeholder="Warna" />
                          <input type="text" v-model="item.size" class="form-control" placeholder="Size" />
                        </div>
                      </div>

                      <div class="col-md-12">
                        <label class="form-label small fw-bold">Memo Internal / Catatan Item</label>
                        <textarea v-model="item.memo" class="form-control form-control-sm" rows="1" placeholder="Catatan untuk item ini..."></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card border-0 shadow-sm rounded-4 p-4 mb-4">
                  <h5 class="fw-bold mb-4 text-primary"><i class="bi bi-truck me-2"></i>Detail Pengiriman</h5>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Delivery </label>
                      <input type="text" v-model="form.delivery" class="form-control" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">To (Alamat Tujuan)</label>
                      <input type="text" v-model="form.to" class="form-control" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Ship By</label>
                      <input type="text" v-model="form.ship_by" class="form-control" placeholder="Expedisi / Kurir" />
                    </div>
                    <div class="col-md-12">
                      <label class="form-label small fw-bold">Remark Umum (Tampil di PDF)</label>
                      <textarea v-model="form.remark" class="form-control" rows="2"></textarea>
                    </div>
                    <div class="col-md-12">
                      <label class="form-label small fw-bold text-success">Other Remark (Catatan Khusus)</label>
                      <textarea v-model="form.other_remark" class="form-control" rows="2"></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-primary text-white">
                  <h5 class="fw-bold mb-4"><i class="bi bi-cash-stack me-2"></i>Kalkulasi</h5>
                  
                  <div class="mb-4">
                    <label class="form-label small fw-bold d-block mb-2">Metode Pembayaran</label>
                    <div class="payment-switcher shadow-sm">
                      <input type="radio" id="pay-transfer" value="transfer" v-model="form.payment" class="d-none">
                      <input type="radio" id="pay-cash" value="cash" v-model="form.payment" class="d-none">
                      <div class="switch-container">
                        <label for="pay-transfer" class="switch-label" :class="{ active: form.payment === 'transfer' }">Transfer</label>
                        <label for="pay-cash" class="switch-label" :class="{ active: form.payment === 'cash' }">Cash</label>
                        <div class="switch-slider" :style="form.payment === 'cash' ? 'left: 50%' : 'left: 4px'"></div>
                      </div>
                    </div>
                  </div>

                  <div class="mb-3" v-if="form.payment === 'transfer'">
                    <label class="form-label small fw-bold">Info Rekening</label>
                    <div class="bg-white rounded-3 p-2 text-dark">
                      <input type="text" v-model="form.bank_name" class="form-control form-control-sm border-0 mb-1" placeholder="Nama Bank" />
                      <input type="text" v-model="form.bank_account" class="form-control form-control-sm border-0 font-monospace" placeholder="Nomor Rekening" />
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label small fw-bold">Ongkos Kirim</label>
                    <div class="input-group shadow-sm">
                      <span class="input-group-text border-0 bg-white text-dark">Rp</span>
                      <input type="number" v-model.number="form.ongkir" class="form-control border-0" @input="calculateTotal" />
                    </div>
                  </div>

                  <hr class="border-white opacity-25" />

                  <div class="d-flex justify-content-between align-items-center">
                    <span class="small fw-bold">Total Amount:</span>
                    <h4 class="fw-bold m-0 text-white">Rp {{ Number(form.amount + (form.ongkir || 0)).toLocaleString('id-ID') }}</h4>
                  </div>
                </div>

                <div class="card border-0 shadow-sm rounded-4 p-4">
                  <button type="submit" class="btn btn-primary btn-lg w-100 rounded-3 mb-2 shadow-sm" :disabled="loading">
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i class="bi bi-save me-2"></i> {{ isEdit ? 'Update PO' : 'Simpan & Cetak' }}
                  </button>
                  <button type="button" @click="$router.push('/item-no-stok')" class="btn btn-outline-secondary w-100 rounded-3 border-0">
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';

const route = useRoute();
const router = useRouter();
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/itemnostock`;

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);
const isEdit = computed(() => !!route.params.id);

const form = ref({
  group_key: '', 
  kategori: '',
  supplier: '',
  po_number: '',
  date: new Date().toISOString().substr(0, 10),
  npb: '',
  amount: 0,
  ongkir: 0,
  bank_name: '',
  bank_account: '',
  delivery: 'PT TRI LESTARI SANDANG INDUSTRI',
  to: 'Jalan Raya BALAMOA NO.45 DESA KARANGJATI RT03 RW 02 KEC TARUB - KAB TEGAL',
  ship_by: '',
  remark: '',
  other_remark: '',
  payment: 'transfer', 
  status: 'pending'
});

const items = ref([
  { item_name: '', spesifikasi: '', memo: '', color: '', size: '', unit: 'pcs', qty: 1, price_per_pcs: 0 }
]);

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);

const mainContentStyle = computed(() => ({
  marginLeft: sidebarOpen.value && windowWidth.value >= 768 ? '16rem' : '0',
  transition: 'margin-left 0.3s ease',
  marginTop: '56px',
}));

const addItem = () => {
  items.value.push({
    item_name: '',
    spesifikasi: '',
    memo: '',
    color: '',
    size: '',
    unit: 'pcs',
    qty: 1,
    price_per_pcs: 0
  });
};

const removeItem = (index) => {
  items.value.splice(index, 1);
  calculateTotal();
};

const generateAutoNumber = () => {
  if (isEdit.value) return;

  const timestamp = Date.now();
  const uniqueNum = timestamp.toString().slice(-6);

  let prefix = '';
  switch (form.value.kategori) {
    case 'mekanik': prefix = 'ME'; break;
    case 'umum': prefix = 'UM'; break;
    case 'office': prefix = 'OF'; break;
    case 'produksi': prefix = 'PR'; break;
    default: prefix = 'XX';
  }

  form.value.po_number = `${prefix}-${uniqueNum}`;
  form.value.npb = `NPB-${prefix}-${uniqueNum}`;

  if (!form.value.group_key) {
    form.value.group_key = `GRP-${timestamp}`;
  }
};

const calculateTotal = () => {
  form.value.amount = items.value.reduce(
    (acc, item) => acc + (Number(item.qty) * Number(item.price_per_pcs)),
    0
  );
};

const saveData = async () => {
  if (items.value.some(i => !i.item_name)) {
    return Swal.fire('Error', 'Nama barang tidak boleh kosong', 'warning');
  }

   // ✅ TAMBAHKAN INI (SPESIFIKASI WAJIB)
  if (items.value.some(i => !i.spesifikasi || !i.spesifikasi.trim())) {
    return Swal.fire('Error', 'Spesifikasi tidak boleh kosong', 'warning');
  }

  loading.value = true;

  try {
    const payloads = items.value.map(item => ({
      ...form.value,
      ...item,
      group_key: form.value.group_key
    }));

    if (isEdit.value) {
      await axios.put(`${API_URL}/${route.params.id}`, payloads);
    } else {
      await axios.post(API_URL, payloads);
    }

    await Swal.fire({
      icon: 'success',
      title: 'Berhasil Disimpan',
      timer: 1200,
      showConfirmButton: false
    });

    await downloadPDFByGroup(form.value.group_key);

    router.push('/item-no-stok');

  } catch (error) {
    Swal.fire('Error', error.response?.data?.message || 'Gagal menyimpan data', 'error');
  } finally {
    loading.value = false;
  }
};

const downloadPDFByGroup = async (groupKey) => {
  try {
    const res = await axios.get(`${API_URL}/print/group/${groupKey}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', `PO-${form.value.po_number}.pdf`);

    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (error) {
    console.error('Download error:', error);
  }
};

onMounted(async () => {
  const userData = localStorage.getItem('user');
  if (userData) user.value = JSON.parse(userData);

  if (isEdit.value) {
    try {
      const groupKey = route.params.id;

      const resItems = await axios.get(`${API_URL}?group_key=${groupKey}`);

      if (!resItems.data || resItems.data.length === 0) {
        throw new Error('Data tidak ditemukan');
      }

      // ✅ FIX PENTING DI SINI
      items.value = resItems.data.map(item => ({
        item_name: item.item_name,
        spesifikasi: item.spesifikasi,
        memo: item.memo,
        color: item.color,
        size: item.size,
        unit: item.unit,
        qty: Number(item.qty),
        price_per_pcs: Number(item.price_per_pcs)
      }));

      // ✅ FIX HEADER JUGA
      form.value = {
        ...form.value,
        ...resItems.data[0],
        ongkir: Number(resItems.data[0].ongkir || 0),
        amount: 0 // reset biar dihitung ulang
      };

      calculateTotal();

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Data tidak ditemukan', 'error');
      router.push('/item-no-stok');
    }
  }
});
</script>

<style scoped>
.payment-switcher { background: rgba(255, 255, 255, 0.2); padding: 4px; border-radius: 12px; }
.switch-container { display: flex; position: relative; background: rgba(0, 0, 0, 0.1); padding: 2px; border-radius: 10px; }
.switch-label { flex: 1; text-align: center; padding: 8px; cursor: pointer; z-index: 1; margin: 0; font-weight: bold; font-size: 0.85rem; transition: color 0.3s; }
.switch-label.active { color: #0d6efd; }
.switch-slider { position: absolute; width: calc(50% - 4px); height: calc(100% - 4px); background: white; border-radius: 8px; transition: left 0.3s ease; }
</style>