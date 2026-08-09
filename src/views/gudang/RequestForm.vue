<template>
  <div class="d-flex flex-column min-vh-100 bg-light-subtle">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1 overflow-hidden">
      <Sidebar :isOpen="sidebarOpen" />
      
      <main class="flex-grow-1 p-3 p-md-4 main-content custom-scrollbar" :style="mainStyle">
        <div class="container-fluid">
          <div class="mb-4 d-flex justify-content-between align-items-end">
            <div>
              <!-- <router-link to="/inventory-request" class="text-decoration-none small d-flex align-items-center gap-1 mb-2 text-primary fw-semibold">
                <i class="bi bi-arrow-left"></i> Kembali ke Daftar
              </router-link> -->
              <h2 class="fw-bold text-dark m-0">Buat Permintaan Barang</h2>
              <p class="text-muted small mb-0">Pilih barang dari katalog dan ajukan permintaan ke bagian gudang.</p>
            </div>
          </div>

          <div class="row g-4">
            <div class="col-lg-8">
              
              <div class="card border-0 shadow-sm rounded-4 mb-4">
                <div class="card-body p-4">
                  <h6 class="fw-bold mb-3 text-uppercase tracking-wider text-primary">
                    <i class="bi bi-person-badge me-2"></i>Informasi Pemohon
                  </h6>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Nama Pemohon</label>
                      <input type="text" class="form-control rounded-3 bg-light border-0" v-model="formHeader.diminta_oleh" placeholder="Nama lengkap">
                    </div>
                    <div class="col-md-6">
  <label class="form-label small fw-bold">Departemen</label>
  <select 
    class="form-select rounded-3 bg-light border-0" 
    v-model="formHeader.untuk_Dept"
  >
    <option value="" disabled>Pilih Departemen...</option>
    <option value="mekanik">Mekanik</option>
    <option value="umum">Umum</option>
    <option value="office">Office</option>
    <option value="produksi">Produksi</option>
  </select>
</div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Tanggal Diperlukan</label>
                      <input type="date" class="form-control rounded-3 bg-light border-0" v-model="formHeader.tgl_diperlukan">
                    </div>
                    <!-- <div class="col-md-6">
                      <label class="form-label small fw-bold">Lokasi Penggunaan</label>
                      <input type="text" class="form-control rounded-3 bg-light border-0" v-model="formHeader.lokasi_penggunaan" placeholder="Gedung / Lantai">
                    </div> -->
                    <div class="col-md-6">
  <label class="form-label small fw-bold">Lokasi Penggunaan</label>
  <select 
    class="form-select rounded-3 bg-light border-0" 
    v-model="formHeader.lokasi_penggunaan"
  >
    <option value="" disabled>Pilih Lokasi...</option>
    <option value="Gedung A">Gedung A</option>
    <option value="Gedung B">Gedung B</option>
    <option value="Gedung C">Gedung C</option>
    <option value="Gedung D">Gedung D</option>
    <option value="Office">Office</option>
    <option value="Workshop">Workshop Mekanik</option>
    <option value="Mess">Mess</option>
    <option value="Mushola">Mushola</option>
    <option value="Kantin">Kantin</option>
    
  </select>
</div>
                    <div class="col-12">
                      <label class="form-label small fw-bold">Alasan / Tujuan Penggunaan</label>
                      <textarea class="form-control rounded-3 bg-light border-0" rows="2" v-model="formHeader.tujuan_penggunaan" placeholder="Jelaskan kebutuhan barang ini..."></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4">
                  <div class="d-flex justify-content-between align-items-center mb-4">
                    <h6 class="fw-bold m-0 text-uppercase tracking-wider text-primary">
                      <i class="bi bi-grid-3x3-gap me-2"></i>Katalog Barang
                    </h6>
                  </div>

                  <div class="input-group mb-4 shadow-sm rounded-pill overflow-hidden border">
                    <span class="input-group-text bg-white border-0 ps-3"><i class="bi bi-search text-muted"></i></span>
                    <input type="text" class="form-control border-0 py-2 ps-2" 
                           placeholder="Cari nama barang atau kode..." 
                           v-model="searchQuery" @input="searchItems">
                  </div>

                  <div v-if="searchResults.length > 0" class="row g-3">
                    <div v-for="item in searchResults" :key="item.id" class="col-md-6 col-xl-4">
                      <div class="item-card h-100 p-3 rounded-4 border transition-all position-relative bg-white">
                        <span :class="item.stok_sekarang < 3 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'" 
                              class="badge position-absolute top-0 end-0 m-3 rounded-pill border">
                          Stok: {{ item.stok_sekarang }}
                        </span>
                        
                        <div class="mb-3 d-flex align-items-center justify-content-center bg-light rounded-4" style="height: 100px;">
                          <i class="bi bi-box-seam text-secondary opacity-25 display-5"></i>
                        </div>

                        <div class="item-info">
                          <h6 class="fw-bold text-dark mb-1 text-truncate" :title="item.item_name">{{ item.item_name }}</h6>
                          <span class="badge bg-light text-muted border-0 fw-normal">spesifikasi: {{ item.spesifikasi || '-' }}</span>
                          <div class="d-flex flex-wrap gap-1 mb-2">
                            <span class="badge bg-light text-muted border-0 fw-normal">{{ item.kategori }}</span>
                            <span class="badge bg-light text-muted border-0 fw-normal">stok: {{ item.stok_sekarang || '-' }}</span>
                            <span class="badge bg-light text-muted border-0 fw-normal">Rak: {{ item.rak || '-' }}</span>
                            <!-- <span class="badge bg-light text-muted border-0 fw-normal">pembelian: {{ item.bill_date || '-' }}</span> -->
                          </div>
                          
                          <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                            <span class="fw-bold text-primary">{{ item.unit }}</span>
                            <button @click="addToCart(item)" class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm">
                              <i class="bi bi-plus-lg me-1"></i> Tambah
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="text-center py-5">
                    <i class="bi bi-search fs-1 text-light-subtle d-block mb-3"></i>
                    <p class="text-muted mb-0">Cari barang untuk menampilkan katalog</p>
                    <small class="text-light-emphasis">Gunakan kata kunci minimal 2 karakter</small>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <div class="card border-0 shadow-sm rounded-4 sticky-top" style="top: 85px; z-index: 10;">
                <div class="card-body p-4">
                  <div class="d-flex justify-content-between align-items-center mb-4">
                    <h6 class="fw-bold m-0 text-uppercase tracking-wider">Ringkasan Permintaan pemakaian</h6>
                    <span class="badge bg-primary rounded-pill px-3">{{ cart.length }} Item</span>
                  </div>

                  <div v-if="cart.length === 0" class="text-center py-5 border rounded-4 border-dashed bg-light-subtle">
                    <i class="bi bi-cart-x fs-2 text-muted opacity-50 d-block mb-2"></i>
                    <p class="text-muted small mb-0">Belum ada barang di keranjang</p>
                  </div>

                  <div v-else class="cart-list custom-scrollbar mb-4" style="max-height: 450px; overflow-y: auto; overflow-x: hidden;">
                    <div v-for="(item, index) in cart" :key="index" class="cart-item-card p-3 rounded-4 border mb-3 bg-white">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="fw-bold small text-dark d-block text-truncate w-75">{{ item.item_name }}</span>
                        <button class="btn btn-link text-danger p-0 border-0" @click="removeFromCart(index)">
                          <i class="bi bi-trash3"></i>
                        </button>
                      </div>
                      
                      <div class="d-flex align-items-center justify-content-between">
                        <div class="input-group input-group-sm w-50 shadow-sm rounded-pill overflow-hidden">
                          <button class="btn btn-light border-0" @click="item.qty > 1 ? item.qty-- : null">-</button>
                          <input type="number" class="form-control border-0 text-center fw-bold bg-light" v-model="item.qty">
                          <button class="btn btn-light border-0" @click="item.qty++">+</button>
                        </div>
                        <span class="badge bg-info-subtle text-info rounded-pill">{{ item.unit }}</span>
                      </div>
                    </div>
                  </div>

                  <hr class="my-4 opacity-50">

                  <button class="btn btn-primary w-100 py-3 rounded-4 fw-bold shadow-lg" 
                          :disabled="cart.length === 0 || loading"
                          @click="submitRequest">
                    <span v-if="!loading" class="d-flex align-items-center justify-content-center">
                      <i class="bi bi-send-check me-2"></i> Kirim Permintaan
                    </span>
                    <span v-else class="spinner-border spinner-border-sm"></span>
                  </button>
                  <p class="text-center mt-3 extra-small text-muted">Pastikan data sudah benar sebelum mengirim</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';
import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const router = useRouter();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Layout State
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

const mainStyle = computed(() => ({
  marginLeft: sidebarOpen.value && windowWidth.value >= 768 ? '16rem' : '0',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  marginTop: '64px',
}));

// Functional State
const searchQuery = ref('');
const searchResults = ref([]);
const cart = ref([]);

const formHeader = ref({
  diminta_oleh: '',
  untuk_Dept: '',
  tgl_diperlukan: new Date().toISOString().substr(0, 10),
  lokasi_penggunaan: '',
  tujuan_penggunaan: ''
});

const searchItems = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/item?search=${searchQuery.value}`);
    
    // Kelompokkan barang berdasarkan Nama + Spesifikasi
    const grouped = res.data.reduce((acc, item) => {
      const key = `${item.item_name}-${item.spesifikasi}`;
      if (!acc[key]) {
        acc[key] = { 
          ...item, 
          stok_sekarang: 0, 
          all_ids: [] // Simpan semua ID untuk referensi jika perlu
        };
      }
      acc[key].stok_sekarang += item.stok_sekarang;
      acc[key].all_ids.push(item.id);
      return acc;
    }, {});

    // Hanya tampilkan yang total stoknya > 0
    searchResults.value = Object.values(grouped).filter(i => i.stok_sekarang > 0);
  } catch (e) {
    console.error("Search Error:", e);
  }
};

// Logic: Cart
// const addToCart = (item) => {
//   const exists = cart.value.find(c => c.id_item === item.id);
//   if (exists) {
//     exists.qty++;
//   } else {
//     cart.value.push({
//       id_item: item.id,
//       item_name: item.item_name,
//       unit: item.unit,
//       qty: 1
//     });
//   }

const addToCart = (item) => {
  const exists = cart.value.find(c => c.item_name === item.item_name && c.spesifikasi === item.spesifikasi);
  if (exists) {
    exists.qty++;
  } else {
    cart.value.push({
      item_name: item.item_name,
      spesifikasi: item.spesifikasi,
      unit: item.unit,
      qty: 1
    });
  }
  
  // Toast Notification
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
  });
  Toast.fire({ icon: 'success', title: 'Barang ditambahkan' });
};

const removeFromCart = (index) => {
  cart.value.splice(index, 1);
};

const submitRequest = async () => {
  if (!formHeader.value.untuk_Dept || !formHeader.value.tujuan_penggunaan) {
    return Swal.fire('Peringatan', 'Lengkapi data departemen dan tujuan!', 'warning');
  }

  loading.value = true;
  try {
    for (const item of cart.value) {
      // Perhatikan: kita mengirim item_name dan spesifikasi 
      // agar backend bisa mencari semua batch barang tersebut
      await axios.post(`${API_BASE_URL}/request/requests`, {
        ...formHeader.value,
        item_name: item.item_name,
        spesifikasi: item.spesifikasi, // Tambahkan ini di addToCart jika belum ada
        qty_diminta: item.qty
      });
    }

    await Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Permintaan telah dibuat dengan sistem FIFO (stok lama diprioritaskan).',
      timer: 2000,
      showConfirmButton: false
    });
    router.push('/request');
  } catch (err) {
    Swal.fire('Error', err.response?.data?.message || 'Gagal mengirim permintaan', 'error');
  } finally {
    loading.value = false;
  }
};

// // Logic: Submit
// const submitRequest = async () => {
//   if (!formHeader.value.untuk_Dept || !formHeader.value.tujuan_penggunaan) {
//     return Swal.fire('Peringatan', 'Lengkapi data departemen dan tujuan!', 'warning');
//   }

//   loading.value = true;
//   try {
//     // Loop untuk mengirim data ke backend
//     for (const item of cart.value) {
//       await axios.post(`${API_BASE_URL}/request/requests`, {
//         ...formHeader.value,
//         id_item: item.id_item,
//         qty_diminta: item.qty
//       });
//     }

//     await Swal.fire({
//       icon: 'success',
//       title: 'Berhasil!',
//       text: 'Permintaan Anda telah dikirim ke sistem.',
//       timer: 2000,
//       showConfirmButton: false
//     });
//     router.push('/request');
//   } catch (err) {
//     Swal.fire('Error', err.response?.data?.message || 'Gagal mengirim permintaan', 'error');
//   } finally {
//     loading.value = false;
//   }
// };

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => { localStorage.clear(); window.location.href = '/login'; };

onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    const parsed = JSON.parse(userData);
    user.value = parsed.user || parsed;
    formHeader.value.diminta_oleh = user.value.name;
  }
  window.addEventListener('resize', () => { windowWidth.value = window.innerWidth; });
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

.main-content { 
  font-family: 'Inter', sans-serif; 
  background-color: #f8fafc; 
}

/* Item Card Grid */
.item-card {
  transition: all 0.3s ease;
  border-color: #f1f5f9 !important;
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px -10px rgba(0,0,0,0.1);
  border-color: #3b82f6 !important;
}

/* Cart Item Style */
.cart-item-card {
  transition: all 0.2s ease;
  border-color: #f1f5f9 !important;
}

.cart-item-card:hover {
  background-color: #f8fafc !important;
}

/* Utils */
.extra-small { font-size: 0.75rem; }
.tracking-wider { letter-spacing: 0.05em; }
.border-dashed { border-style: dashed !important; border-width: 2px !important; }

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

/* Remove Number Input Arrows */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>