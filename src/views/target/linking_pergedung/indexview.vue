
<template>
  <div class="d-flex flex-column min-vh-100 bg-light text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <!-- Sidebar dengan z-index tinggi untuk mobile -->
      <Sidebar :isOpen="sidebarOpen" class="sidebar-component" />
      
      <!-- Main Content dengan margin dinamis agar tidak tertutup -->
      <main :class="['flex-grow-1 p-3 p-md-4 main-content transition-all', sidebarOpen ? 'sidebar-open-margin' : 'sidebar-closed-margin']">
        <div class="container-fluid">
          
          <!-- TOP BAR -->
          <div class="row align-items-center mb-4 g-3">
            <div class="col-lg-6">
              <h4 class="fw-bold m-0 text-dark">Production Entry Console</h4>
              <p class="text-muted small mb-0">Input Target & Gedung Pelengkap</p>
            </div>
            <div class="col-lg-6 text-lg-end">
              <div class="d-inline-flex bg-white p-2 rounded-4 shadow-sm align-items-center flex-wrap">
                <span class="small fw-bold px-3 border-end text-muted">TANGGAL</span>
                <input type="date" v-model="filter.start" @change="syncDate" class="form-control border-0 shadow-none fw-bold bg-transparent w-auto" />
                <button @click="fetchData" :disabled="loading" class="btn btn-primary rounded-3 ms-2 px-4 fw-bold">
                  <i class="bi bi-arrow-clockwise" :class="{'spinner-border spinner-border-sm': loading}"></i> LOAD
                </button>
              </div>
            </div>
          </div>

          <!-- SELECTION PANEL -->
          <div v-if="allAvailableStyles.length > 0" class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3 p-md-4">
              <div class="row g-3 align-items-end mb-3">
                <div class="col-md-5">
                  <label class="small fw-bold text-primary mb-2">CARI STYLE (xMark)</label>
                  <div class="input-group bg-light border rounded-3 px-2">
                    <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
                    <input type="text" v-model="searchQuery" class="form-control bg-transparent border-0 shadow-none" placeholder="Ketik nama style...">
                  </div>
                </div>
                <div class="col-md-7 text-md-end">
                  <div class="btn-group shadow-sm rounded-3 me-2 mb-2 mb-md-0">
                    <button @click="selectAllFiltered" class="btn btn-outline-dark btn-sm fw-bold">Pilih Semua</button>
                    <button @click="selectedStyles = []" class="btn btn-outline-danger btn-sm fw-bold">Reset</button>
                  </div>
                  <button @click="showSelectedOnly = !showSelectedOnly" 
                          :class="['btn btn-sm fw-bold rounded-3 transition-all', showSelectedOnly ? 'btn-warning shadow' : 'btn-outline-warning']">
                    <i class="bi" :class="showSelectedOnly ? 'bi-eye-fill' : 'bi-eye-slash'"></i>
                    {{ showSelectedOnly ? ' Terpilih Saja' : ' Lihat Semua' }}
                  </button>

                  <!-- TOMBOL BARU: SAVE MASSAL -->
  <button v-if="filteredDisplayData.length > 0" 
          @click="handleSaveMassal" 
          :disabled="loadingMassal" 
          class="btn btn-success btn-sm fw-bold rounded-3 shadow-sm px-3">
    <i v-if="loadingMassal" class="spinner-border spinner-border-sm me-1"></i>
    <i v-else class="bi bi-cloud-upload-fill me-1"></i>
    SIMPAN MASSAL ({{ filteredDisplayData.length }})
  </button>
                </div>
              </div>

              <div class="style-container bg-light rounded-4 p-3 border border-dashed">
                <div v-if="filteredSearchStyles.length === 0" class="text-center py-4 text-muted small italic">Style tidak ditemukan...</div>
                <div class="style-grid">
                  <div v-for="style in filteredSearchStyles" :key="style" class="style-item" :class="{ 'selected': selectedStyles.includes(style) }">
                    <input type="checkbox" :id="'st-'+style" :value="style" v-model="selectedStyles" class="btn-check">
                    <label class="btn btn-style-card w-100 h-100" :for="'st-'+style">
                      <div class="d-flex justify-content-between align-items-center h-100">
                        <span class="text-truncate me-1">{{ style }}</span>
                        <i class="bi" :class="selectedStyles.includes(style) ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- WARNING XMARK BELUM PILIH GEDUNG -->
          <div v-if="xMarkBelumGedung.length > 0" class="alert alert-warning border-start border-5 border-warning shadow-sm d-flex align-items-start mb-3">
            <i class="bi bi-exclamation-triangle-fill fs-4 text-warning me-3"></i>
              <div class="flex-grow-1">
                <div class="fw-bold mb-1">
                  Ada {{ xMarkBelumGedung.length }} Style yang belum memiliki Gedung
                </div>

                <div class="small">
                  Silakan lengkapi Gedung untuk style berikut:
                </div>

                <div class="mt-2 d-flex flex-wrap gap-2">
                  <span v-for="item in xMarkBelumGedung" :key="item.xMark" class="badge bg-warning text-dark px-3 py-2">
                    {{ item.xMark }}
                  </span>
                </div>
              </div>
          </div>

          <!-- TABLE INPUT -->
          <div v-if="filteredDisplayData.length > 0" class="card border-0 shadow rounded-4 overflow-hidden">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-dark text-white">
                  <tr>
                    <th class="ps-4 py-3" width="120">OPSI</th>
                    <th width="200">STYLE / MARK</th>
                    <th width="150">GEDUNG</th>
                    <th width="120">Kebutuhan</th>
                    <th>X-PROCESS & AKUM</th>
                    <th class="text-center pe-4" width="140">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="group in filteredDisplayData" :key="group.xMark" class="border-bottom bg-white">
                    <td class="ps-4">
                      <div class="d-flex gap-2">
                        <button @click="handleSave(group)" :disabled="group.isSaving" class="btn btn-success btn-sm rounded-pill px-3 shadow-sm">
                          <i v-if="group.isSaving" class="spinner-border spinner-border-sm me-1"></i>
                          <i v-else class="bi bi-check-lg me-1"></i> SIMPAN
                        </button>
                        <button v-if="isAlreadySaved(group.xMark)" @click="handleDelete(group.xMark)" class="btn btn-outline-danger btn-sm rounded-circle border-0">
                          <i class="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div class="fw-bold text-dark mb-0">{{ group.xMark }}</div>
                      <div class="text-muted x-small">PO: {{ group.po_from_sp }}</div>
                    </td>
                    <td>
                      <select v-model="group.gedung" class="form-select form-select-sm border-0 bg-light fw-bold rounded-3">
                        <option value="-">- Select Building a bellow -</option>
                        <option v-for="g in ['-','A','B', 'A&B','C','D']" :key="g" :value="g">GEDUNG {{g}}</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" v-model.number="group.kebutuhan" class="form-control form-control-sm border-0 bg-light fw-bold text-center rounded-3">
                    </td>
                    <td>
                      <div class="d-flex flex-wrap gap-1">
                        <div v-for="proc in group.processes" :key="proc.xProcess" 
                             class="badge bg-white border text-dark fw-normal rounded-pill d-flex align-items-center px-2 py-1 shadow-xs">
                          <span class="text-uppercase x-small me-2 text-primary fw-bold">{{ proc.xProcess }}</span>
                          <span class="fw-black">{{ proc.tTLS_Qty }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="text-center pe-4">
                      <div v-if="calculateKekurangan(group) > 0" class="badge bg-danger-subtle text-danger rounded-pill px-3">
                        -{{ calculateKekurangan(group) }}
                      </div>
                      <div v-else class="badge bg-success-subtle text-success rounded-pill px-3">
                        <i class="bi bi-check-circle-fill me-1"></i> OK
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-5 mt-4 bg-white rounded-4 shadow-sm border border-dashed">
             <i class="bi bi-search fs-1 text-muted opacity-25"></i>
             <p class="mt-3 text-muted">Gunakan panel di atas untuk memilih style yang ingin diproses.</p>
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


// Konfigurasi & State
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(false);
const rawData = ref([]);
const pelengkapData = ref([]);
const loading = ref(false);

const searchQuery = ref("");
const selectedStyles = ref([]);
const showSelectedOnly = ref(false);

const loadingMassal = ref(false);

const filter = ref({
  start: new Date().toISOString().substr(0, 10),
  end: new Date().toISOString().substr(0, 10)
});

// Menyamakan tanggal end dengan start secara otomatis
const syncDate = () => { 
  filter.value.end = filter.value.start; 
};

/**
 * AMBIL DATA DARI BACKEND
 */
const fetchData = async () => {
  loading.value = true;
  
  // RESET state agar data lama tidak menempel saat ganti tanggal
  selectedStyles.value = []; 
  
  try {
    const [spRes, plRes] = await Promise.all([
      // 1. Data Summary dari SP
      axios.get(`${API_BASE_URL}/receive/summary-line`, { params: filter.value }),
      
      // 2. Data Pelengkap difilter berdasarkan tanggal start (Kirim param pDate ke Backend)
      axios.get(`${API_BASE_URL}/receive/pelengkap`, { 
        params: { pDate: filter.value.start } 
      })
    ]);
    
    rawData.value = spRes.data.data || [];
    pelengkapData.value = plRes.data.data || [];
  } catch (err) {
    console.error("Fetch Error:", err);
    alert("Gagal memuat data.");
  } finally {
    loading.value = false;
  }
};

/**
 * COMPUTED PROPERTIES
 */
const allAvailableStyles = computed(() => {
  return [...new Set(rawData.value.map(item => item.xMark))].sort();
});

const filteredSearchStyles = computed(() => {
  if (!searchQuery.value) return allAvailableStyles.value;
  return allAvailableStyles.value.filter(s => 
    s.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const groupedData = computed(() => {
  const groups = {};
  rawData.value.forEach(item => {
    if (!groups[item.xMark]) {
      // Hanya mencocokkan data pelengkap yang sudah difilter per tanggal dari backend
      const extra = pelengkapData.value.find(p => p.xMark === item.xMark) || {};
      groups[item.xMark] = { 
        xMark: item.xMark, 
        gedung: extra.gedung || '',
        kebutuhan: extra.kebutuhan || 0,
        po_from_sp: item.xTimes || '-', 
        processes: [],
        isSaving: false 
      };
    }
    groups[item.xMark].processes.push(item);
  });
  return Object.values(groups);
});

const filteredDisplayData = computed(() => {
  return groupedData.value.filter(item => selectedStyles.value.includes(item.xMark));
});

const xMarkBelumGedung = computed(() => {
  return filteredDisplayData.value.filter(item => !item.gedung);
});

/**
 * ACTIONS
 */
const selectAllFiltered = () => {
  filteredSearchStyles.value.forEach(s => {
    if(!selectedStyles.value.includes(s)) selectedStyles.value.push(s);
  });
};

const isAlreadySaved = (xMark) => {
  return pelengkapData.value.some(p => p.xMark === xMark);
};

const handleSave = async (group) => {
  if (!group.gedung) return alert("Pilih Gedung!");
  
  group.isSaving = true;
  try {
    const payload = {
      xMark: String(group.xMark),
      gedung: String(group.gedung),
      kebutuhan: Number(group.kebutuhan) || 0,
      xDateTime: filter.value.start // Simpan sesuai tanggal filter
    };
    
    await axios.post(`${API_BASE_URL}/receive/pelengkap/upsert`, payload);
    
    // Update local state pelengkapData
    const idx = pelengkapData.value.findIndex(p => p.xMark === group.xMark);
    if (idx !== -1) {
      pelengkapData.value[idx] = { ...payload };
    } else {
      pelengkapData.value.push({ ...payload });
    }
    
    alert(`Style ${group.xMark} berhasil disimpan.`);
  } catch (err) { 
    console.error(err);
    alert("Gagal simpan."); 
  } finally { 
    group.isSaving = false; 
  }
};

// 2. Tambahkan function handleSaveMassal di bagian ACTIONS
const handleSaveMassal = async () => {
  // Filter client-side terlebih dahulu untuk memastikan data yang dikirim valid (ada gedung & xMark)
  const validPayload = filteredDisplayData.value
    .filter(group => group.xMark && group.gedung) // Melewati data yang gedungnya kosong
    .map(group => ({
      xMark: String(group.xMark),
      gedung: String(group.gedung),
      kebutuhan: Number(group.kebutuhan) || 0,
      po: String(group.po_from_sp || ""),
      xDateTime: filter.value.start // Ikut tanggal filter aktif
    }));

  if (validPayload.length === 0) {
    return alert("Tidak ada data yang siap disimpan. Pastikan Anda sudah memilih 'Gedung' pada style yang dicentang.");
  }

  if (!confirm(`Apakah Anda yakin ingin menyimpan ${validPayload.length} data secara massal?`)) return;

  loadingMassal.value = true;
  
  // Set status loading/saving pada baris tabel yang bersangkutan
  filteredDisplayData.value.forEach(group => {
    if(group.gedung) group.isSaving = true;
  });

  try {
    // Sesuai dengan route Anda: /receive/pelengkap/upsertmassal
    const response = await axios.post(`${API_BASE_URL}/receive/pelengkap/upsertmassal`, validPayload);
    
    // Update local state pelengkapData agar status badge/tombol terupdate secara realtime di UI
    validPayload.forEach(payload => {
      const idx = pelengkapData.value.findIndex(p => p.xMark === payload.xMark);
      if (idx !== -1) {
        pelengkapData.value[idx] = { ...payload };
      } else {
        pelengkapData.value.push({ ...payload });
      }
    });

    alert(response.data.message || "Data massal berhasil disimpan!");
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan data secara massal: " + (err.response?.data?.message || err.message));
  } finally {
    loadingMassal.value = false;
    filteredDisplayData.value.forEach(group => { group.isSaving = false; });
  }
};

const handleDelete = async (xMark) => {
  if (!confirm(`Hapus data ${xMark} untuk tanggal ${filter.value.start}?`)) return;
  try {
    // Sertakan pDate agar backend menghapus record di tanggal yang tepat
    await axios.delete(`${API_BASE_URL}/receive/pelengkap/${xMark}`, {
      params: { pDate: filter.value.start }
    });
    
    pelengkapData.value = pelengkapData.value.filter(p => p.xMark !== xMark);
  } catch (err) { 
    alert("Gagal hapus."); 
  }
};

const calculateKekurangan = (g) => {
  const lastQty = g.processes[g.processes.length - 1]?.tTLS_Qty || 0;
  return Math.max(0, (Number(g.kebutuhan) || 0) - lastQty);
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
.main-content {
  transition: all 0.3s ease-in-out;
  min-width: 0; /* Penting untuk flex-item agar tidak overflow */
}

/* Logic Responsif Sidebar */
@media (min-width: 992px) {
  .sidebar-open-margin { margin-left: 250px; } /* Sesuaikan lebar sidebar kamu */
  .sidebar-closed-margin { margin-left: 70px; }
}

/* Style Grid */
.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.btn-style-card {
  background: white;
  border: 1px solid #dee2e6;
  font-size: 0.75rem;
  padding: 8px;
  border-radius: 8px;
}

.btn-check:checked + .btn-style-card {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.x-small { font-size: 0.65rem; }
.fw-black { font-weight: 900; }

.sidebar-component {
  position: fixed;
  height: 100vh;
  z-index: 1050;
}
</style>