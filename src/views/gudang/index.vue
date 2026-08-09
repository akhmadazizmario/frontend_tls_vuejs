<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
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
        <div class="container-fluid">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bolder text-dark-blue mb-0">📦 Manajemen Gudang</h2>
            
            <button
              class="btn btn-primary shadow-sm"
              data-bs-toggle="modal"
              data-bs-target="#gudangModal"
              @click="openAddModal"
              v-if="['it','administrasi'].includes(user.dept?.toLowerCase())"
            >
              <i class="bi bi-plus-circle me-2"></i>Tambah Barang Baru
            </button>
          </div>
          <hr />

          <div class="card border-0 rounded-4 shadow-sm p-3">
            <div class="card-body p-0">
              <div v-if="loading" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-spinner fa-spin me-2"></i>Memuat data...
              </div>
              
              <div v-else-if="items.length === 0" class="text-center py-5 fs-5 text-muted">
                <i class="fas fa-exclamation-circle me-2"></i>Tidak ada data barang.
              </div>

              <div v-else class="table-container">
                <div class="table-responsive">
                  <table id="gudangTable" class="table table-hover mb-0 align-middle w-100">
                    <thead class="text-uppercase fw-bold text-secondary border-bottom">
                      <tr>
                        <th class="text-center">No</th>
                        <th>Nama Barang</th>
                        <th class="text-center">Stok</th>
                        <th>Satuan</th>
                        <th>Gambar</th>
                        <th class="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in items" :key="item.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td class="fw-bold text-dark-blue">{{ item.nama_barang }}</td>
                        <td class="text-center">
                          <span :class="item.qty <= 5 ? 'badge bg-danger' : 'badge bg-success'">
                            {{ item.qty }}
                          </span>
                        </td>
                        <td>{{ item.satuan }}</td>
                        <td>
                          <img
                            v-if="item.gambar"
                            :src="API_BASE_URL + item.gambar"
                            alt="foto"
                            class="img-thumbnail rounded-3 shadow-sm"
                            style="max-height: 60px; object-fit: cover;"
                          />
                          <span v-else class="text-muted small">No Image</span>
                        </td>
                        <td class="text-center">
                          <div class="d-flex justify-content-center gap-2">
                            <button 
                              class="btn btn-sm btn-info text-white" 
                              title="Buat Pesanan"
                              data-bs-toggle="modal" 
                              data-bs-target="#pesananModal"
                              @click="openOrderModal(item)"
                              v-if="['it','administrasi','mekanik','teknisi'].includes(user.dept?.toLowerCase())"
                            >
                              <i class="bi bi-cart-plus"></i>
                            </button>

                            <template v-if="['it','administrasi'].includes(user.dept?.toLowerCase())">
                              <button
                                class="btn btn-sm btn-warning"
                                data-bs-toggle="modal"
                                data-bs-target="#gudangModal"
                                @click="openEditModal(item)"
                              >
                                <i class="bi bi-pencil-square"></i>
                              </button>
                              <button
                                class="btn btn-sm btn-danger"
                                @click="deleteItem(item.id)"
                              >
                                <i class="bi bi-trash"></i>
                              </button>
                            </template>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Footer />

    <div class="modal fade" id="gudangModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content rounded-4 shadow border-0">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold">{{ editMode ? "Edit Barang" : "Tambah Barang Baru" }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" id="closeGudangModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveItem">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-semibold">Nama Barang</label>
                  <input v-model="form.nama_barang" type="text" class="form-control" required />
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-semibold">Stok</label>
                  <input v-model="form.qty" type="number" min="0" class="form-control" required />
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-semibold">Satuan</label>
                  <input v-model="form.satuan" type="text" class="form-control" placeholder="Pcs/Box" required />
                </div>
                <div class="col-md-12">
                  <label class="form-label fw-semibold">Upload Gambar</label>
                  <input type="file" class="form-control" @change="handleFileUpload" />
                </div>
              </div>
              <div class="d-flex justify-content-end mt-4">
                <button type="submit" class="btn btn-primary px-4 rounded-pill">
                  {{ editMode ? "Update Data" : "Simpan Barang" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="pesananModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header bg-info text-white rounded-top-4">
            <h5 class="modal-title fw-bold"><i class="bi bi-cart-plus me-2"></i>Form Pesanan Barang</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" id="closePesananModal"></button>
          </div>
          <form @submit.prevent="submitPesanan">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label fw-bold">Barang</label>
                <input type="text" class="form-control bg-light" :value="selectedItem.nama_barang" readonly>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Qty Pesan</label>
                  <input v-model="orderForm.qty" type="number" class="form-control" :max="selectedItem.qty" min="1" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Satuan</label>
                  <input type="text" class="form-control bg-light" :value="selectedItem.satuan" readonly>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Nama Peminta</label>
                <input v-model="orderForm.peminta" type="text" class="form-control" placeholder="Nama personil..." required>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Departemen</label>
                <select v-model="orderForm.dept_peminta" class="form-select" required>
                  <option value="" disabled selected>-- Pilih Departemen --</option>
                  <option value="IT">IT</option>
                  <option value="Administrasi">Administrasi</option>
                  <option value="Mekanik">Mekanik</option>
                  <option value="Teknisi">Teknisi</option>
                  <option value="Produksi">Produksi</option>
                </select>
              </div>
            </div>
            <div class="modal-footer border-0">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Batal</button>
              <button 
                type="submit" 
                class="btn btn-info text-white shadow-sm" 
                :disabled="orderForm.qty > selectedItem.qty || orderForm.qty <= 0"
              >
                Kirim Pesanan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import $ from "jquery";
import "datatables.net-bs5";
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";

// Components
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// State
const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);

// Form Gudang
const editMode = ref(false);
const form = ref({ id: null, nama_barang: "", qty: 0, satuan: "", gambar: null });

// Form Pesanan
const selectedItem = ref({});
const orderForm = ref({
  gudang_id: null,
  qty: 1,
  peminta: "",
  dept_peminta: "",
  user_name: "", 
  user_dept: ""
});

let table = null;

// --- FUNCTIONS ---
function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value; }
function logout() { localStorage.removeItem("user"); window.location.href = "/login"; }

async function loadItems() {
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/gudang/gudang/web`);
    items.value = Array.isArray(res.data.data) ? res.data.data : [];
    reloadDataTable();
  } catch (err) {
    Swal.fire("Gagal", "Tidak bisa memuat data.", "error");
  } finally {
    loading.value = false;
  }
}

async function saveItem() {
  try {
    const formData = new FormData();
    formData.append("nama_barang", form.value.nama_barang);
    formData.append("qty", form.value.qty);
    formData.append("satuan", form.value.satuan);
    if (form.value.gambar) formData.append("gambar", form.value.gambar);

    if (editMode.value) {
      await axios.put(`${API_BASE_URL}/gudang/gudang/web/${form.value.id}`, formData);
    } else {
      await axios.post(`${API_BASE_URL}/gudang/gudang/web`, formData);
    }
    
    // Tutup modal aman
    document.getElementById('closeGudangModal')?.click();

    Swal.fire("Berhasil", "Data tersimpan", "success");
    loadItems();
  } catch (err) {
    Swal.fire("Gagal", "Gagal menyimpan data barang", "error");
  }
}

// HAPUS BARANG
async function deleteItem(id) {
  const res = await Swal.fire({ title: "Hapus?", icon: "warning", showCancelButton: true });
  if (res.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/gudang/gudang/web/${id}`);
      Swal.fire("Berhasil", "Data dihapus", "success");
      loadItems();
    } catch (err) {
      Swal.fire("Gagal", "Gagal menghapus", "error");
    }
  }
}

// PESANAN LOGIC
function openOrderModal(item) {
  selectedItem.value = item;
  orderForm.value = {
    gudang_id: item.id,
    qty: 1,
    peminta: "",
    dept_peminta: "",
    user_name: user.value.name, // Data dari login
    user_dept: user.value.dept  // Data dari login
  };
}

async function submitPesanan() {
  try {
    // 1. Kirim data
    await axios.post(`${API_BASE_URL}/pesanan-gudang/web`, orderForm.value);
    
    // 2. Tutup modal secara aman (simulasi klik tombol silang/close)
    const closeBtn = document.getElementById('closePesananModal');
    if (closeBtn) {
      closeBtn.click();
    } else {
      // fallback jika tombol tidak ketemu
      $("#pesananModal").modal('hide');
    }

    // 3. Notifikasi Sukses
    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Pesanan telah dibuat dan stok telah diperbarui",
      timer: 2000,
      showConfirmButton: false
    });

    // 4. Refresh data
    await loadItems(); 
    
  } catch (err) {
    console.error("Detail Error:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.response?.data?.message || "Terjadi kesalahan saat menghubungi server"
    });
  }
}

// UTILS
function openAddModal() { editMode.value = false; form.value = { id: null, nama_barang: "", qty: 0, satuan: "", gambar: null }; }
function openEditModal(item) { editMode.value = true; form.value = { ...item, gambar: null }; }
function handleFileUpload(event) { form.value.gambar = event.target.files[0]; }

function reloadDataTable() {
  if ($.fn.DataTable.isDataTable("#gudangTable")) $("#gudangTable").DataTable().destroy();
  setTimeout(() => {
    table = $("#gudangTable").DataTable({
      pageLength: 10,
      autoWidth: false,
      responsive: true,
      language: { search: "Cari:" }
    });
  }, 50);
}

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  loadItems();
  window.addEventListener("resize", () => { windowWidth.value = window.innerWidth; });
});

onBeforeUnmount(() => { if (table) table.destroy(); });
</script>

<style scoped>
.bg-light-soft { background-color: #f8fafc; }
.text-dark-blue { color: #1e293b; }
.img-thumbnail { width: 60px; height: 60px; object-fit: cover; }
</style>
