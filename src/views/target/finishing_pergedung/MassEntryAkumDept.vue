<template>
  <div class="d-flex flex-column min-vh-100 bg-light text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" class="sidebar-component" />
      
      <main :class="['flex-grow-1 p-3 p-md-4 main-content transition-all', sidebarOpen ? 'sidebar-open-margin' : 'sidebar-closed-margin']">
        <div class="container-fluid">
          
          <div class="row align-items-center mb-4 g-3">
            <div class="col-lg-6">
              <h4 class="fw-bold m-0 text-dark">Production Entry Console</h4>
              <p class="text-muted small mb-0">Kelola dan input data akumulasi per departemen</p>
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
                  Total Terbaca: <span class="fw-bold text-dark">{{ filteredDisplayData.length }}</span> Style
                </div>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow rounded-4 overflow-hidden" v-if="filteredDisplayData.length > 0">
            <div class="table-responsive table-container">
              <table class="table table-bordered align-middle mb-0 text-center table-sm table-sticky-header">
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
                    <th :colspan="totalColumns" class="py-2 small">DEPARTEMEN</th>
                    <th rowspan="2" class="align-middle" style="width: 100px;">xLevel</th>
                  </tr>
                  <tr class="bg-secondary text-white small">
                    <th v-for="dept in listDepts" :key="dept" style="width: 90px;">{{ dept }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="group in filteredDisplayData" :key="group.xMark" class="bg-white">
                    <td class="text-start ps-3 fw-bold text-dark standard-cell">{{ group.xMark }}</td>
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
               {{ loading ? 'Sedang memuat data...' : 'Tidak ditemukan data pelengkap pada tanggal ini.' }}
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

const listDepts = [ "TERIMA", "LINKING", "LO", "STEAM", "CBS", "CBSHGS", "STIK", "SONTEXSOOM", "STKB", "SEWING", "SOOM", "QC BS", "QC LB", "SULAM", "KIRIM"];
const totalColumns = computed(() => listDepts.length);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(true);
const loading = ref(false);
const massSaving = ref(false);

const pelengkapLamaData = ref([]);     
const akumulasiSavedData = ref([]); // Menyimpan data yang sudah pernah di-input ke pelengkap-akumperdept
const visibleStyles = ref([]);

const searchQuery = ref("");
const headerSearchQuery = ref("");

const filter = ref({
  pDate: new Date().toISOString().substr(0, 10)
});

const fetchData = async () => {
  loading.value = true;
  try {
    // FIX DATA 0: Kita ambil data master style dari /pelengkap DAN data yang sudah tersimpan dari /pelengkap-akumperdept
    const [plLamaRes, akumRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { params: { pDate: filter.value.pDate } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-akumperdept`, { params: { pDate: filter.value.pDate } }).catch(() => ({ data: { data: [] } }))
    ]);
    
    pelengkapLamaData.value = plLamaRes.data.data || []; 
    akumulasiSavedData.value = akumRes.data?.data || [];
    
    visibleStyles.value = allAvailableStyles.value;
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Gagal memuat data console.");
  } finally {
    loading.value = false;
  }
};

const allAvailableStyles = computed(() => {
  return [...new Set(pelengkapLamaData.value.map(item => item.xMark))].sort();
});

const filteredHeaderStyles = computed(() => {
  if (!headerSearchQuery.value) return allAvailableStyles.value;
  return allAvailableStyles.value.filter(s => s.toLowerCase().includes(headerSearchQuery.value.toLowerCase()));
});

const displayData = computed(() => {
  return allAvailableStyles.value.map(xMark => {
    const recordsForStyle = pelengkapLamaData.value.filter(p => String(p.xMark).trim() === String(xMark).trim());
    const gedungRef = recordsForStyle[0] || {};
    
    // Cari data yang sudah pernah di-save di tabel akumulasi untuk style ini
    const savedRecordsForStyle = akumulasiSavedData.value.filter(a => String(a.xMark).trim() === String(xMark).trim());
    
    const deptsData = {};
    
    listDepts.forEach(dept => {
      // Prioritas 1: Cari dari data yang sudah pernah di-upsert sebelumnya
      const savedDept = savedRecordsForStyle.find(a => String(a.kategoridept).trim().toUpperCase() === dept.toUpperCase());
      
      if (savedDept && savedDept.qty !== undefined && savedDept.qty !== null) {
        deptsData[dept] = Number(savedDept.qty);
      } else {
        // Prioritas 2: Jika di akumulasi belum ada, coba cek tabel pelengkap, jika tidak ada juga baru 0
        const recordDept = recordsForStyle.find(p => String(p.kategoridept).trim().toUpperCase() === dept.toUpperCase());
        deptsData[dept] = (recordDept && recordDept.qty !== undefined && recordDept.qty !== null) ? Number(recordDept.qty) : 0;
      }
    });

    return {
      xMark,
      gedung: gedungRef.gedung || '-',
      deptsData
    };
  });
});

const filteredDisplayData = computed(() => {
  return displayData.value.filter(item => {
    const matchesSearch = !searchQuery.value || item.xMark.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesHeaderCheckbox = visibleStyles.value.includes(item.xMark);
    return matchesSearch && matchesHeaderCheckbox;
  });
});

const selectAllHeader = () => { visibleStyles.value = [...allAvailableStyles.value]; };
const deselectAllHeader = () => { visibleStyles.value = []; };

const handleMassUpsert = async () => {
  if (filteredDisplayData.value.length === 0) return;
  
  const confirmSave = confirm(`Simpan otomatis data ke akumulasi per departemen untuk ${filteredDisplayData.value.length} Style?`);
  if (!confirmSave) return;

  massSaving.value = true;
  
  try {
    // 1. Kumpulkan semua payload terlebih dahulu ke dalam satu array antrean
    const allPayloads = [];
    
    filteredDisplayData.value.forEach(group => {
      listDepts.forEach(deptName => {
        const qtyVal = Number(group.deptsData[deptName]) || 0;
        
        allPayloads.push({
          xDateTime: filter.value.pDate,
          xMark: group.xMark,
          gedung: group.gedung && group.gedung !== '-' ? group.gedung : null,
          kategoridept: deptName,
          qty: qtyVal,
          xLevel: null 
        });
      });
    });

    // 2. Kirim data dalam bentuk Batch / Batasan (Misal: maksimal 20 request per sekali jalan)
    const batchSize = 20; 
    for (let i = 0; i < allPayloads.length; i += batchSize) {
      const currentBatch = allPayloads.slice(i, i + batchSize);
      
      // Jalankan 20 request, tunggu sampai selesai, baru lanjut 20 berikutnya
      await Promise.all(
        currentBatch.map(payload => 
          axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-akumperdept/upsert`, payload)
        )
      );
    }

    alert(`Sukses! Berhasil memproses mass-upsert akumulasi untuk ${filteredDisplayData.value.length} Style.`);
    await fetchData(); 
  } catch (err) {
    console.error("Mass Upsert Error:", err);
    alert("Gagal melakukan penyimpanan massal karena jaringan sibuk. Coba kurangi filter data atau hubungi IT.");
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

/* FIX STICKY CSS CONFIGURATION */
.table-container {
  max-height: 68vh; /* Batasi tinggi container tabel agar scrollbar internal muncul */
  overflow-y: auto;
}

.table-sticky-header thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #212529 !important; 
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.15);
}

/* Mengatur sticky baris kedua header tabel agar tepat di bawah baris pertama */
.table-sticky-header thead tr:nth-child(2) th {
  top: 31px !important; 
  background-color: #6c757d !important; 
  z-index: 9;
}

/* Membuat Kolom Pertama (Style / XMark) ikut melayang saat di-scroll horizontal */
.table-sticky-header tbody td.standard-cell,
.table-sticky-header thead th:first-child {
  position: sticky;
  left: 0;
  z-index: 11;
}
.table-sticky-header tbody td.standard-cell {
  background-color: #ffffff !important;
}
.table-sticky-header thead th:first-child {
  z-index: 12;
  background-color: #212529 !important;
}
</style>