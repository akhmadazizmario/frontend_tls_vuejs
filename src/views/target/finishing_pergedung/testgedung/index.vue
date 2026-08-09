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
              <p class="text-muted small mb-0">Sinkronisasi Penuh Log Gedung Pelengkap Finishing</p>
            </div>
            <div class="col-lg-6 text-lg-end">
              <div class="d-inline-flex bg-white p-2 rounded-4 shadow-sm align-items-center flex-wrap gap-2">
                <button @click="fetchData" :disabled="loading" class="btn btn-primary rounded-3 px-4 fw-bold">
                  <i v-if="loading" class="spinner-border spinner-border-sm me-1"></i>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i> RELOAD DATA
                </button>

                <button @click="handleSyncAll" :disabled="syncing || pelengkapData.length === 0" class="btn btn-success rounded-3 px-4 fw-bold">
                  <i v-if="syncing" class="spinner-border spinner-border-sm me-1"></i>
                  <i v-else class="bi bi-cloud-arrow-up-fill me-1"></i> SINKRONKAN KE GEDUNG
                </button>
              </div>
            </div>
          </div>

          <div v-if="allAvailableStyles.length > 0" class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3 p-md-4">
              <div class="row g-3 align-items-end mb-3">
                <div class="col-md-5">
                  <label class="small fw-bold text-primary mb-2">DAFTAR XMARK / STYLE TERSEDIA (2020 - 2026)</label>
                  <div class="input-group bg-light border rounded-3 px-2">
                    <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
                    <input type="text" v-model="searchQuery" class="form-control bg-transparent border-0 shadow-none" placeholder="Ketik nama xMark...">
                  </div>
                </div>
                <div class="col-md-7 text-md-end">
                  <div class="btn-group shadow-sm rounded-3">
                    <button @click="selectAllFiltered" class="btn btn-outline-dark btn-sm fw-bold">Pilih Semua</button>
                    <button @click="selectedStyles = []" class="btn btn-outline-danger btn-sm fw-bold">Reset</button>
                  </div>
                </div>
              </div>

              <div class="style-container bg-light rounded-4 p-3 border border-dashed">
                <div class="style-grid">
                  <div v-for="style in filteredSearchStyles" :key="style" class="style-item">
                    <input type="checkbox" :id="'st-'+style" :value="style" v-model="selectedStyles" class="btn-check">
                    <label class="btn btn-style-card w-100 h-100" :for="'st-'+style">
                      <div class="d-flex justify-content-between align-items-center h-100">
                        <span class="text-truncate me-1 fw-bold text-uppercase text-primary">{{ style }}</span>
                        <i class="bi" :class="selectedStyles.includes(style) ? 'bi-check-circle-fill text-primary' : 'bi-circle'"></i>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredDisplayData.length > 0" class="card border-0 shadow rounded-4 overflow-hidden">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-dark text-white">
                  <tr>
                    <th class="ps-4 py-3" width="60">NO</th>
                    <th width="220">XMARK</th>
                    <th width="180">LINE / GEDUNG (XLINE)</th>
                    <th width="200">PO PREFIX</th>
                    <th width="180">TGL JALAN TERAKHIR</th>
                    <th>STATUS ADAPTASI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(group, index) in filteredDisplayData" :key="group.xMark" class="border-bottom bg-white">
                    <td class="ps-4 text-muted small">{{ index + 1 }}</td>
                    <td>
                      <div class="fw-bold text-dark">{{ group.xMark }}</div>
                    </td>
                    <td>
                      <span v-if="group.xLine !== '-'" class="badge bg-primary px-3 py-2 rounded-3 fw-bold">
                        GEDUNG {{ group.xLine }}
                      </span>
                      <span v-else class="badge bg-light text-muted px-3 py-2 rounded-3 border">
                        Tidak Ditemukan
                      </span>
                    </td>
                    <td>
                      <code class="text-dark fw-bold">{{ group.xPOPrefix }}</code>
                    </td>
                    <td>
                      <span class="text-secondary small fw-medium">
                        {{ formatDate(group.TanggalTerakhirJalan) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">
                        <i class="bi bi-check2-circle me-1"></i> Siap Di-Upsert
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="text-center py-5 mt-4 bg-white rounded-4 shadow-sm border border-dashed">
             <i class="bi bi-funnel fs-1 text-muted opacity-25"></i>
             <p class="mt-3 text-muted m-0">Silahkan centang xMark di atas untuk memetakan nama gedung ke dalam daftar konfirmasi tabel.</p>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import Header from "../../../../components/Header.vue";
import Sidebar from "../../../../components/Sidebar.vue";

// State Management
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(false);
const loading = ref(false);
const syncing = ref(false);

const pelengkapData = ref([]);   // Menampung respon data tunggal kueri gabungan dari backend
const searchQuery = ref("");
const selectedStyles = ref([]);

/**
 * FETCH DATA - Hanya memanggil satu API utama saja
 */
const fetchData = async () => {
  loading.value = true;
  selectedStyles.value = []; // Bersihkan pilihan lama saat reload
  
  try {
    // Memanggil API kueri tunggal rancangan Anda
    const response = await axios.get(`${API_BASE_URL}/test-gedung/test-gedung`);
    pelengkapData.value = response.data.data || [];
  } catch (err) {
    console.error("Fetch Error:", err);
    alert("Gagal memuat data referensi gedung langsung dari backend.");
  } finally {
    loading.value = false;
  }
};

/**
 * COMPUTED PROPERTIES
 */

// Membuat list checkbox box murni dari xMark hasil kueri tunggal backend
const allAvailableStyles = computed(() => {
  return [...new Set(pelengkapData.value.map(item => item.xMark))].filter(Boolean).sort();
});

// Live Search Checkbox box
const filteredSearchStyles = computed(() => {
  if (!searchQuery.value) return allAvailableStyles.value;
  return allAvailableStyles.value.filter(s => 
    s.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Memetakan detail data baris tabel berdasarkan xMark yang sedang dicentang
const filteredDisplayData = computed(() => {
  return selectedStyles.value.map(xMark => {
    const dbInfo = pelengkapData.value.find(p => p.xMark === xMark);
    
    return {
      xMark: xMark,
      xLine: dbInfo ? dbInfo.xLine : '-',
      xPOPrefix: dbInfo ? dbInfo.xPOPrefix : '-',
      TanggalTerakhirJalan: dbInfo ? dbInfo.TanggalTerakhirJalan : null
    };
  });
});

/**
 * METHODS & ACTIONS HANDLER
 */
const selectAllFiltered = () => {
  filteredSearchStyles.value.forEach(s => {
    if (!selectedStyles.value.includes(s)) selectedStyles.value.push(s);
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

// Eksekusi Tombol Sinkronisasi / Mass UPSERT ke pelengkappofinishinggedung
const handleSyncAll = async () => {
  if (filteredDisplayData.value.length === 0) {
    return alert("Silahkan centang minimal satu xMark terlebih dahulu!");
  }

  syncing.value = true;
  try {
    // Kirim muatan data final langsung ke fungsi backend upsertPelengkapPOFinishingGedung
    const response = await axios.post(`${API_BASE_URL}/test-gedung/test-gedung`, {
      syncData: filteredDisplayData.value 
    });
    
    alert(response.data.message || "Proses sinkronisasi data terpilih berhasil!");
    await fetchData(); // Sinkronisasi ulang tampilan pasca-save
  } catch (err) {
    console.error("Sync Error:", err);
    alert("Gagal melakukan proses sinkronisasi massal ke database.");
  } finally {
    syncing.value = false;
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
.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.btn-style-card {
  border: 1px solid #dee2e6;
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  text-align: left;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}
.btn-check:checked + .btn-style-card {
  border-color: #0d6efd;
  background-color: #e7f1ff;
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.15);
}
</style>