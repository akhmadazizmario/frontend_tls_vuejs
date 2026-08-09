<template>
  <div class="d-flex flex-column min-vh-100 bg-light text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" class="sidebar-component" />
      
      <main :class="['flex-grow-1 p-3 p-md-4 main-content transition-all', sidebarOpen ? 'sidebar-open-margin' : 'sidebar-closed-margin']">
        <div class="container-fluid">
          
          <!-- Header Bagian Atas -->
          <div class="row align-items-center mb-4 g-3">
            <div class="col-lg-6">
              <h4 class="fw-bold m-0 text-dark">Production Entry Console (Multi-Dept)</h4>
              <p class="text-muted small mb-0">Input Akumulasi Departemen Secara Massal per Style</p>
            </div>
            <div class="col-lg-6 text-lg-end">
              <div class="d-inline-flex bg-white p-2 rounded-4 shadow-sm align-items-center flex-wrap">
                <span class="small fw-bold px-3 border-end text-muted">TANGGAL SP</span>
                <input type="date" v-model="filter.pDate" @change="fetchData" class="form-control border-0 shadow-none fw-bold bg-transparent w-auto" />
                <button @click="fetchData" :disabled="loading" class="btn btn-primary rounded-3 ms-2 px-4 fw-bold">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i> RELOAD
                </button>
              </div>
            </div>
          </div>

          <!-- Bagian Checkbox xMark Utama (Atas) -->
          <div v-if="allAvailableStyles.length > 0" class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3 p-md-4">
              <div class="row g-3 align-items-end mb-3">
                <div class="col-md-5">
                  <label class="small fw-bold text-primary mb-2">PILIH STYLE / MARK UNTUK DIINPUT</label>
                  <div class="input-group bg-light border rounded-3 px-2">
                    <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
                    <input type="text" v-model="searchQuery" class="form-control bg-transparent border-0 shadow-none" placeholder="Cari style...">
                  </div>
                </div>
                <div class="col-md-7 text-md-end">
                  <div class="btn-group shadow-sm rounded-3">
                    <button type="button" @click="selectAllFiltered" class="btn btn-outline-dark btn-sm fw-bold">Pilih Semua</button>
                    <button type="button" @click="selectedStyles = []" class="btn btn-outline-danger btn-sm fw-bold">Reset</button>
                  </div>
                </div>
              </div>

              <div class="style-container bg-light rounded-4 p-3 border border-dashed">
                <div class="style-grid">
                  <div v-for="style in filteredSearchStyles" :key="style" class="style-item">
                    <input type="checkbox" :id="'st-'+style" :value="style" v-model="selectedStyles" class="btn-check">
                    <label class="btn btn-style-card w-100 h-100" :for="'st-'+style">
                      <div class="d-flex justify-content-between align-items-center">
                        <span class="text-truncate">{{ style }}</span>
                        <i class="bi" :class="selectedStyles.includes(style) ? 'bi-check-circle-fill text-primary' : 'bi-circle'"></i>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabel Input Data Multi-Dept -->
          <div v-if="filteredDisplayData.length > 0" class="card border-0 shadow rounded-4 overflow-hidden">
            <div class="table-responsive">
              <table class="table table-bordered align-middle mb-0 text-center">
                <thead class="bg-dark text-white">
                  <tr>
                    <th rowspan="2" class="align-middle px-3" style="width: 100px;">AKSI</th>
                    
                    <!-- Header Kolom Style dengan Dropdown Multiple Checkbox + Search -->
                    <th rowspan="2" class="align-middle position-relative" style="width: 220px;">
                      <div class="dropdown d-inline-block w-100">
                        <button class="btn btn-sm btn-dark dropdown-toggle w-100 d-flex justify-content-between align-items-center border-0 fw-bold shadow-none" 
                                type="button" 
                                id="dropdownStyleHeader" 
                                data-bs-toggle="dropdown" 
                                data-bs-auto-close="outside" 
                                aria-expanded="false">
                          <span>STYLE / XMARK</span>
                        </button>
                        
                        <div class="dropdown-menu p-3 shadow-lg rounded-3 dropdown-style-menu" aria-labelledby="dropdownStyleHeader">
                          <!-- Menu Pencarian di dalam Dropdown -->
                          <div class="input-group input-group-sm mb-2">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-search small"></i></span>
                            <input type="text" v-model="headerSearchQuery" class="form-control bg-light border-start-0 text-sm shadow-none" placeholder="Cari di kolom...">
                          </div>
                          
                          <!-- Aksi Cepat Pilih Semua / Reset dalam Dropdown -->
                          <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                            <button type="button" @click="selectAllFilteredHeader" class="btn btn-link p-0 text-decoration-none small fw-bold">Pilih Semua</button>
                            <button type="button" @click="selectedStyles = []" class="btn btn-link p-0 text-decoration-none text-danger small fw-bold">Reset</button>
                          </div>

                          <!-- Daftar Checkbox List -->
                          <div class="dropdown-scroll-area">
                            <div v-for="style in filteredHeaderStyles" :key="'hd-'+style" class="form-check text-start mb-1 py-1 px-2 rounded hover-bg-light">
                              <input class="form-check-input ms-0 me-2" type="checkbox" :id="'hd-cb-'+style" :value="style" v-model="selectedStyles">
                              <label class="form-check-label text-dark text-truncate d-inline-block align-middle w-75 small cursor-pointer" :for="'hd-cb-'+style">
                                {{ style }}
                              </label>
                            </div>
                            <div v-if="filteredHeaderStyles.length === 0" class="text-muted small text-center py-2">
                              Tidak ada style ditemukan
                            </div>
                          </div>
                        </div>
                      </div>
                    </th>
                    
                    <th rowspan="2" class="align-middle" style="width: 120px;">GEDUNG</th>
                    <th :colspan="totalColumns" class="py-2 small">DEPARTEMEN (QTY AKUMULASI)</th>
                    <th rowspan="2" class="align-middle" style="width: 100px;">xLevel</th>
                  </tr>
                  <tr class="bg-secondary text-white small">
                    <th v-for="dept in listDepts" :key="dept" style="width: 85px;">{{ dept }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="group in filteredDisplayData" :key="group.xMark" class="bg-white">
                    <td>
                      <div class="d-flex justify-content-center gap-1">
                        <!-- Tombol Simpan -->
                        <button type="button" @click="handleSaveStyle(group)" :disabled="group.isSaving" class="btn btn-success btn-sm rounded-circle px-2 shadow-sm" title="Simpan Baris Ini">
                          <span v-if="group.isSaving" class="spinner-border spinner-border-sm"></span>
                          <i v-else class="bi bi-save"></i>
                        </button>
                      </div>
                    </td>
                    <td class="text-start ps-3 fw-bold">{{ group.xMark }}</td>
                    <td>
                      <span class="badge" :class="group.gedung ? 'bg-primary' : 'bg-light text-muted border'">
                        {{ group.gedung || 'NULL' }}
                      </span>
                    </td>
                    <!-- Input Qty per Dept -->
                    <td v-for="dept in listDepts" :key="dept" class="p-1">
                      <input 
                        type="number" 
                        v-model.number="group.deptsData[dept]" 
                        class="form-control form-control-sm border-0 bg-light fw-bold text-center input-qty" 
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input type="text" disabled class="form-control form-control-sm border-0 bg-transparent text-center" placeholder="-" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- State Kosong -->
          <div v-else class="text-center py-5 mt-4 bg-white rounded-4 shadow-sm border border-dashed">
             <i class="bi bi-grid-3x3-gap fs-1 text-muted opacity-25"></i>
             <p class="mt-3 text-muted">Centang Style di atas atau melalui filter header kolom untuk membuka form input multi-departemen.</p>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

// 1. Deklarasi Konstanta & Data Statis dengan Penambahan "Dept Terima:" sebelum "Linking"
const listDepts = ["Terima", "Linking", "LO", "Steam", "CBS", "Sewing", "Sontex", "Soom", "QcLampu", "Sulam", "Kirim"];
const totalColumns = computed(() => listDepts.length);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(false);
const loading = ref(false);

const rawData = ref([]);               
const pelengkapLamaData = ref([]);     
const pelengkapAkumDeptData = ref([]); 
const selectedStyles = ref([]);
const searchQuery = ref("");
const headerSearchQuery = ref(""); // State baru untuk search di dropdown header tabel

const filter = ref({
  pDate: new Date().toISOString().substr(0, 10)
});

const fetchData = async () => {
  loading.value = true;
  selectedStyles.value = [];
  try {
    const [spRes, plLamaRes, plAkumRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { params: { pDate: filter.value.pDate } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { params: { pDate: filter.value.pDate } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-akumperdept`, { params: { pDate: filter.value.pDate } })
    ]);
    
    rawData.value = spRes.data.data || [];
    pelengkapLamaData.value = plLamaRes.data.data || []; 
    pelengkapAkumDeptData.value = plAkumRes.data.data || [];
  } catch (err) {
    alert("Gagal memuat data.");
  } finally {
    loading.value = false;
  }
};

const allAvailableStyles = computed(() => {
  return [...new Set(rawData.value.map(item => item.xMark))].sort();
});

const filteredSearchStyles = computed(() => {
  if (!searchQuery.value) return allAvailableStyles.value;
  return allAvailableStyles.value.filter(s => s.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

// Computed property baru khusus menyaring list data style di dropdown header kolom
const filteredHeaderStyles = computed(() => {
  if (!headerSearchQuery.value) return allAvailableStyles.value;
  return allAvailableStyles.value.filter(s => s.toLowerCase().includes(headerSearchQuery.value.toLowerCase()));
});

// Mapping satu Style ke banyak Kolom Dept
const filteredDisplayData = computed(() => {
  return selectedStyles.value.map(xMark => {
    const gedungRef = pelengkapLamaData.value.find(p => p.xMark === xMark) || {};
    
    const deptsData = {};
    listDepts.forEach(d => {
      const saved = pelengkapAkumDeptData.value.find(p => p.xMark === xMark && p.kategoridept === d);
      deptsData[d] = saved ? saved.qty : 0;
    });

    return {
      xMark,
      gedung: gedungRef.gedung || '',
      deptsData,
      isSaving: false
    };
  });
});

const selectAllFiltered = () => {
  filteredSearchStyles.value.forEach(s => {
    if(!selectedStyles.value.includes(s)) selectedStyles.value.push(s);
  });
};

// Fungsi baru untuk aksi pilih semua style di dalam dropdown header
const selectAllFilteredHeader = () => {
  filteredHeaderStyles.value.forEach(s => {
    if(!selectedStyles.value.includes(s)) selectedStyles.value.push(s);
  });
};

// Simpan Massal per Baris Style
const handleSaveStyle = async (group) => {
  group.isSaving = true;
  
  try {
    const promises = listDepts.map(deptName => {
      const qtyVal = group.deptsData[deptName];
      
      const payload = {
        xDateTime: filter.value.pDate,
        xMark: group.xMark,
        gedung: group.gedung || null,
        kategoridept: deptName,
        qty: qtyVal,
        xLevel: null 
      };
      
      return axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-akumperdept/upsert`, payload);
    });

    await Promise.all(promises);
    alert(`Berhasil menyimpan data akumulasi untuk Style: ${group.xMark}`);
    fetchDataSilently();
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat menyimpan beberapa departemen.");
  } finally {
    group.isSaving = false;
  }
};

const fetchDataSilently = async () => {
  try {
    const plAkumRes = await axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-akumperdept`, { 
      params: { pDate: filter.value.pDate } 
    });
    pelengkapAkumDeptData.value = plAkumRes.data.data || [];
  } catch (err) {
    console.error("Gagal sinkronisasi data latar belakang:", err);
  }
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => { localStorage.clear(); window.location.href = "/login"; };

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  fetchData();
});
</script>

<style scoped>
.main-content { transition: all 0.3s ease; }
@media (min-width: 992px) {
  .sidebar-open-margin { margin-left: 260px; }
  .sidebar-closed-margin { margin-left: 80px; }
}
.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}
.btn-style-card {
  background: white; border: 1px solid #dee2e6;
  font-size: 0.75rem; padding: 6px; border-radius: 6px;
  cursor: pointer;
}
.btn-check:checked + .btn-style-card {
  background: #0d6efd; color: white; border-color: #0d6efd;
}
.input-qty {
  min-width: 65px;
  font-size: 0.85rem;
}
.table-bordered th, .table-bordered td {
  border: 1px solid #e0e0e0 !important;
}
.sidebar-component { position: fixed; height: 100vh; z-index: 1050; }

/* Styles Baru untuk Dropdown Multiple Checkbox di Header */
.dropdown-style-menu {
  width: 250px;
  z-index: 1060;
}
.dropdown-scroll-area {
  max-height: 200px;
  overflow-y: auto;
}
.hover-bg-light:hover {
  background-color: #f8f9fa;
}
.cursor-pointer {
  cursor: pointer;
}
</style>