<template>
  <div class="d-flex flex-column min-vh-100 bg-light text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" class="sidebar-component" />
      
      <main :class="['flex-grow-1 p-3 p-md-4 main-content transition-all', sidebarOpen ? 'sidebar-open-margin' : 'sidebar-closed-margin']">
        <div class="container-fluid">
          
          <div class="row align-items-center mb-4 g-3">
            <div class="col-lg-6">
              <h4 class="fw-bold m-0 text-dark">Production Entry Console (Mass Auto-Fill Mode)</h4>
              <p class="text-muted small mb-0">Otomatis mengisi nilai dari Total Produksi hari ini ke Akumulasi Departemen</p>
            </div>
            <div class="col-lg-6 text-lg-end">
              <div class="d-inline-flex bg-white p-2 rounded-4 shadow-sm align-items-center flex-wrap gap-2">
                <span class="small fw-bold px-2 text-muted">TANGGAL SP</span>
                <input type="date" v-model="filter.pDate" @change="fetchData" class="form-control border-0 shadow-none fw-bold bg-transparent w-auto py-1" />
                
                <button @click="fetchData" :disabled="loading || massSaving" class="btn btn-outline-primary rounded-3 px-3 fw-bold btn-sm">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i> RELOAD
                </button>

                <button @click="handleMassUpsert" :disabled="loading || massSaving || filteredDisplayData.length === 0" class="btn btn-success rounded-3 px-4 fw-bold btn-sm shadow">
                  <span v-if="massSaving" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-cloud-arrow-up-fill me-1"></i> SIMPAN SEMUA HASIL HARI INI
                </button>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 mb-3">
            <div class="card-body p-3">
              <div class="row align-items-center g-2">
                <div class="col-md-5">
                  <div class="input-group input-group-sm bg-light border rounded-3 px-2">
                    <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
                    <input type="text" v-model="searchQuery" class="form-control bg-transparent border-0 shadow-none" placeholder="Cari Style / XMark...">
                  </div>
                </div>
                <div class="col-md-7 text-md-end text-muted small">
                  <span class="badge bg-info text-dark me-2">💡 Nilai di bawah otomatis terisi dari hasil Total Summary Line</span>
                  Total Terbaca: <span class="fw-bold text-dark">{{ filteredDisplayData.length }}</span> Style
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredDisplayData.length > 0" class="card border-0 shadow rounded-4 overflow-hidden">
            <div class="table-responsive">
              <table class="table table-bordered align-middle mb-0 text-center table-sm">
                <thead class="bg-dark text-white">
                  <tr>
                    <th rowspan="2" class="align-middle position-relative text-uppercase ps-3" style="width: 240px;">
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
                          <div class="input-group input-group-sm mb-2">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-search small"></i></span>
                            <input type="text" v-model="headerSearchQuery" class="form-control bg-light border-start-0 text-sm shadow-none" placeholder="Cari di kolom...">
                          </div>
                          
                          <div class="d-flex justify-content-between mb-2 pb-2 border-bottom">
                            <button type="button" @click="selectAllHeader" class="btn btn-link p-0 text-decoration-none small fw-bold">Pilih Semua</button>
                            <button type="button" @click="deselectAllHeader" class="btn btn-link p-0 text-decoration-none text-danger small fw-bold">Sembunyikan</button>
                          </div>

                          <div class="dropdown-scroll-area">
                            <div v-for="style in filteredHeaderStyles" :key="'hd-'+style" class="form-check text-start mb-1 py-1 px-2 rounded hover-bg-light">
                              <input class="form-check-input ms-0 me-2" type="checkbox" :id="'hd-cb-'+style" :value="style" v-model="visibleStyles">
                              <label class="form-check-label text-dark text-truncate d-inline-block align-middle w-75 small cursor-pointer" :for="'hd-cb-'+style">
                                {{ style }}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </th>
                    
                    <th rowspan="2" class="align-middle" style="width: 120px;">GEDUNG</th>
                    <th :colspan="totalColumns" class="py-2 small">DEPARTEMEN (OTOMATIS DIAMBIL DARI HASIL TOTAL)</th>
                    <th rowspan="2" class="align-middle" style="width: 100px;">xLevel</th>
                  </tr>
                  <tr class="bg-secondary text-white small">
                    <th v-for="dept in listDepts" :key="dept" style="width: 90px;">{{ dept }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="group in filteredDisplayData" :key="group.xMark" class="bg-white">
                    <td class="text-start ps-3 fw-bold text-dark">{{ group.xMark }}</td>
                    <td>
                      <span class="badge" :class="group.gedung && group.gedung !== '-' ? 'bg-primary' : 'bg-light text-muted border'">
                        {{ group.gedung || '-' }}
                      </span>
                    </td>
                    
                    <td v-for="dept in listDepts" :key="dept" class="p-1">
                      <input 
                        type="number" 
                        v-model.number="group.deptsData[dept]" 
                        class="form-control form-control-sm border-0 bg-light fw-bold text-center input-qty text-primary" 
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

          <div v-else class="text-center py-5 mt-2 bg-white rounded-4 shadow-sm border border-dashed">
             <div v-if="loading" class="spinner-border text-primary mb-3"></div>
             <i v-else class="bi bi-folder-x fs-1 text-muted opacity-25"></i>
             <p class="mt-2 text-muted fw-bold">
               {{ loading ? 'Sedang menghitung data otomatis...' : 'Tidak ditemukan data produksi summary-line pada tanggal ini.' }}
             </p>
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

// Daftar departemen target terbaru sesuai request Anda
const listDepts = [ "TP",  "LP"];
const totalColumns = computed(() => listDepts.length);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(true);
const loading = ref(false);
const massSaving = ref(false);

const rawData = ref([]);                
const pelengkapLamaData = ref([]);     
const visibleStyles = ref([]);

const searchQuery = ref("");
const headerSearchQuery = ref("");

const filter = ref({
  pDate: new Date().toISOString().substr(0, 10)
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [spRes, plLamaRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { params: { pDate: filter.value.pDate } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { params: { pDate: filter.value.pDate } })
    ]);
    
    rawData.value = spRes.data.data || [];
    pelengkapLamaData.value = plLamaRes.data.data || []; 
    
    // Default aktifkan seluruh style yang terdeteksi agar langsung muncul di form
    visibleStyles.value = allAvailableStyles.value;
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Gagal memuat data summary produksi.");
  } finally {
    loading.value = false;
  }
};

const allAvailableStyles = computed(() => {
  return [...new Set(rawData.value.map(item => item.xMark))].sort();
});

const filteredHeaderStyles = computed(() => {
  if (!headerSearchQuery.value) return allAvailableStyles.value;
  return allAvailableStyles.value.filter(s => s.toLowerCase().includes(headerSearchQuery.value.toLowerCase()));
});

// LOGIKA UTAMA: Mapping hasil total_xxx dari data produksi menjadi nilai default input
const displayData = computed(() => {
  return allAvailableStyles.value.map(xMark => {
    // Cari data gedung referensinya
    const gedungRef = pelengkapLamaData.value.find(p => String(p.xMark).trim() === String(xMark).trim()) || {};
    
    // Cari record item produksi asli dari summary line untuk mengambil field total_xxx
    const prodItem = rawData.value.find(p => String(p.xMark).trim() === String(xMark).trim()) || {};
    
    const deptsData = {};
    
    // PENG KONDISIAN BARU: Jika backend mengembalikan nilai, tampilkan nilainya. Jika tidak, pasang nilai 0
    deptsData["TP"] = prodItem.total_tp !== undefined && prodItem.total_tp !== null ? Number(prodItem.total_tp) : 0;
    deptsData["LP"] = prodItem.total_lp !== undefined && prodItem.total_lp !== null ? Number(prodItem.total_lp) : 0;

    return {
      xMark,
      gedung: gedungRef.gedung || '-',
      deptsData
    };
  });
});

// Filter tampilan layar berdasarkan query search & list checkbox header
const filteredDisplayData = computed(() => {
  return displayData.value.filter(item => {
    const matchesSearch = !searchQuery.value || item.xMark.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesHeaderCheckbox = visibleStyles.value.includes(item.xMark);
    return matchesSearch && matchesHeaderCheckbox;
  });
});

const selectAllHeader = () => { visibleStyles.value = [...allAvailableStyles.value]; };
const deselectAllHeader = () => { visibleStyles.value = []; };

// PROSES MASAL (MASS UPSERT): Mengirim data yang telah diisi otomatis ke tabel pelengkap-akumperdept
const handleMassUpsert = async () => {
  if (filteredDisplayData.value.length === 0) return;
  
  const confirmSave = confirm(`Simpan otomatis data hasil produksi hari ini ke akumulasi per departemen untuk ${filteredDisplayData.value.length} Style?`);
  if (!confirmSave) return;

  massSaving.value = true;
  
  try {
    const promises = [];
    
    filteredDisplayData.value.forEach(group => {
      listDepts.forEach(deptName => {
        // PERBAIKAN: Gunakan Number() untuk parsing nilai string termasuk nilai minus (-) ke integer/float
        const qtyVal = Number(group.deptsData[deptName]) || 0;
        
        const payload = {
          xDateTime: filter.value.pDate,
          xMark: group.xMark,
          gedung: group.gedung && group.gedung !== '-' ? group.gedung : null,
          kategoridept: deptName,
          qty: qtyVal, // Nilai minus akan dikirim dengan benar ke backend (Contoh: -15)            
          xLevel: null 
        };
        
        promises.push(
          axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-akumperdept/upsert`, payload)
        );
      });
    });

    await Promise.all(promises);
    alert(`Sukses! Berhasil memproses mass-upsert akumulasi untuk ${filteredDisplayData.value.length} Style.`);
  } catch (err) {
    console.error("Mass Upsert Error:", err);
    alert("Gagal melakukan penyimpanan massal, silakan cek log server.");
  } finally {
    massSaving.value = false;
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
.input-qty {
  min-width: 75px;
  font-size: 0.85rem;
  padding: 4px;
}
.input-qty:focus {
  background-color: #fff !important;
  border: 1px solid #0d6efd !important;
  box-shadow: none;
}
.table-bordered th, .table-bordered td {
  border: 1px solid #dee2e6 !important;
}
.sidebar-component { position: fixed; height: 100vh; z-index: 1050; }

.dropdown-style-menu {
  width: 260px;
  z-index: 1060;
}
.dropdown-scroll-area {
  max-height: 220px;
  overflow-y: auto;
}
.hover-bg-light:hover {
  background-color: #f8f9fa;
}
.cursor-pointer {
  cursor: pointer;
}
</style>