<template>
  <div class="d-flex flex-column min-vh-100 bg-light text-dark mt-5">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" class="sidebar-component" />
      
      <main :class="['flex-grow-1 p-3 p-md-4 main-content transition-all', sidebarOpen ? 'sidebar-open-margin' : 'sidebar-closed-margin']">
        <div class="container-fluid">

           <div v-if="loading" class="loading-overlay">
    <div class="text-center">
      <div class="spinner-border text-primary mb-3"></div>
      <div class="fw-bold">Sedang mengambil data...</div>
      <div class="text-muted small">Mohon tunggu sebentar</div>
    </div>
  </div>
          
          <div class="row align-items-center mb-4 g-3">
            <div class="col-lg-6">
              <h4 class="fw-bold m-0 text-dark">Production Entry Console</h4>
              <p class="text-muted small mb-0">Input Target & Gedung Pelengkap Finishing</p>
            </div>
            <div class="col-lg-6 text-lg-end">
              <div class="d-inline-flex bg-white p-2 rounded-4 shadow-sm align-items-center flex-wrap">
                <span class="small fw-bold px-3 border-end text-muted">TANGGAL SP</span>
                <input type="date" v-model="filter.pDate" @change="fetchData" class="form-control border-0 shadow-none fw-bold bg-transparent w-auto" />
                <button @click="fetchData" :disabled="loading" class="btn btn-primary rounded-3 ms-2 px-4 fw-bold">
                  <i v-if="loading" class="spinner-border spinner-border-sm me-1"></i>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i> RELOAD
                </button>
              </div>
            </div>
          </div>

          <div v-if="allAvailableStyles.length > 0" class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3 p-md-4">
              <div class="row g-3 align-items-end mb-3">
                <div class="col-md-5">
                  <label class="small fw-bold text-primary mb-2">CARI STYLE DARI PROSES</label>
                  <div class="input-group bg-light border rounded-3 px-2">
                    <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
                    <input type="text" v-model="searchQuery" class="form-control bg-transparent border-0 shadow-none" placeholder="Ketik nama style...">
                  </div>
                </div>
                <div class="col-md-7 text-md-end">
                  <div class="btn-group shadow-sm rounded-3 me-2">
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
                        <span class="text-truncate me-1">{{ style }}</span>
                        <i class="bi" :class="selectedStyles.includes(style) ? 'bi-check-circle-fill text-primary' : 'bi-circle'"></i>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredDisplayData.length > 0">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold m-0 text-secondary">Daftar Input Pelengkap</h5>
              <button @click="handleSaveMassal" :disabled="bulkSaving" class="btn btn-primary rounded-3 px-4 fw-bold shadow-sm">
                <i v-if="bulkSaving" class="spinner-border spinner-border-sm me-1"></i>
                <i v-else class="bi bi-cloud-upload-fill me-1"></i> SIMPAN SEMUA DATA ({{ filteredDisplayData.length }})
              </button>
            </div>

            <div class="card border-0 shadow rounded-4 overflow-hidden">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-dark text-white">
                    <tr>
                      <th class="ps-4 py-3" width="130">OPSI</th>
                      <th width="250">STYLE / MARK</th>
                      <th width="200">GEDUNG <span>(*)</span></th>
                      <th width="150">KEBUTUHAN <span class="small text-muted">(opsional)</span></th>
                      <th width="180">PO <span class="small text-muted">(opsional)</span></th> 
                      <th width="180">TGL PO</th>
                      <th>DETAIL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="group in filteredDisplayData" :key="group.xMark" class="border-bottom bg-white">
                      <td class="ps-4">
                        <div class="d-flex gap-2">
                          <button @click="handleSave(group)" :disabled="group.isSaving" class="btn btn-success btn-sm rounded-pill px-3 shadow-sm">
                            <i v-if="group.isSaving" class="spinner-border spinner-border-sm me-1"></i>
                            <i v-else class="bi bi-save me-1"></i> SIMPAN
                          </button>
                          <button v-if="isAlreadySaved(group.xMark)" @click="handleDelete(group.xMark)" class="btn btn-outline-danger btn-sm rounded-circle border-0">
                            <i class="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                      <td>
                        <div class="fw-bold text-dark">{{ group.xMark }}</div>
                      </td>
                      <td>
                        <select v-model="group.gedung" class="form-select form-select-sm border-0 bg-light fw-bold rounded-3">
                          <option value="">- Pilih Gedung -</option>
                          <option v-for="g in ['A','B', 'A&B']" :key="g" :value="g">GEDUNG {{g}}</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" v-model.number="group.kebutuhan" class="form-control form-control-sm border-0 bg-light fw-bold text-center rounded-3">
                      </td>
                      <td>
                        <input type="text" v-model="group.po" class="form-control form-control-sm border-0 bg-light" placeholder="No. PO...">
                      </td>
                      <td>
                        <input type="date" v-model="group.tgl_po" class="form-control form-control-sm border-0 bg-light">
                      </td>
                      <td>
                        <span class="badge bg-secondary-subtle text-secondary me-2">style: {{ group.xPOPrefix }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-5 mt-4 bg-white rounded-4 shadow-sm border border-dashed">
             <i class="bi bi-clipboard-data fs-1 text-muted opacity-25"></i>
             <p class="mt-3 text-muted">Pilih style dari hasil load data untuk diinput targetnya.</p>
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
const pelengkapData = ref([]); // Data yang SUDAH TERSIMPAN di tanggal aktif saat ini
//const referensiGedungData = ref([]); // Data referensi pergerakan scan line HARI INI
const historisGedungData = ref([]); // Data inputan terakhir ke belakang (antisipasi hari libur)
const loading = ref(false);
const bulkSaving = ref(false);

const searchQuery = ref("");
const selectedStyles = ref([]);

const filter = ref({
  pDate: new Date().toISOString().substr(0, 10)
});

/**
 * AMBIL DATA DARI BACKEND
 */
const fetchData = async () => {
  loading.value = true;
  selectedStyles.value = []; 
  
  try {
    const [spRes, plRes, histRes] = await Promise.all([
      // 1. Data Summary SP hari ini
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { 
        params: { pDate: filter.value.pDate } 
      }),
      // 2. Data Pelengkap yang sudah tersimpan di tanggal ini
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { 
        params: { pDate: filter.value.pDate } 
      }),
      // 3. Data Referensi pergerakan scan line hari ini
      // axios.get(`${API_BASE_URL}/receivefinishing/pelengkap/referensi-gedung`, { 
      //   params: { pDate: filter.value.pDate } 
      // }),
      // 4. Data Historis inputan terakhir ke belakang (Cegah Hari Libur)
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap/historis-gedung`, { 
        params: { pDate: filter.value.pDate } 
      })
    ]);
    
    rawData.value = spRes.data.data || [];
    pelengkapData.value = plRes.data.data || [];
    //referensiGedungData.value = refRes.data.data || [];
    historisGedungData.value = histRes.data.data || [];
  } catch (err) {
    console.error("Error Fetching:", err);
    alert("Gagal mengambil data dari server.");
  } finally {
    loading.value = false;
  }
};

/**
 * COMPUTED PROPERTIES dengan Logika Penggantian Otomatis
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

const filteredDisplayData = computed(() => {
  return selectedStyles.value.map(xMark => {
    const spInfo = rawData.value.find(r => r.xMark === xMark) || {};
    const dbInfo = pelengkapData.value.find(p => p.xMark === xMark) || {};
    
    // Ambil data referensi terbaru hari ini (jika ada perpindahan gedung)
    //const refInfo = referensiGedungData.value.find(rf => rf.xMark === xMark) || {};
    
    // Ambil data historis dari hari terakhir input (mencegah hari libur)
    const histInfo = historisGedungData.value.find(h => h.xMark === xMark) || {};
    
    //const gedungOtomatis = dbInfo.gedung || refInfo.gedung || histInfo.gedung || '';
    const gedungOtomatis = dbInfo.gedung || histInfo.gedung || '';

    // Begitu pula dengan Kebutuhan, PO, dan Tgl PO, kita pinjam dari data historis jika belum diisi hari ini
    const kebutuhanOtomatis = dbInfo.kebutuhan || histInfo.kebutuhan || 0;
    const poOtomatis = dbInfo.po || histInfo.po || '';
    const tglPoOtomatis = dbInfo.tgl_po ? dbInfo.tgl_po.substring(0, 10) : (histInfo.tgl_po ? histInfo.tgl_po.substring(0, 10) : '');

    return {
      xMark: xMark,
      xPOPrefix: spInfo.xPOPrefix || '-',
      xDateTime: spInfo.xDateTime || '-',
      gedung: gedungOtomatis,
      kebutuhan: kebutuhanOtomatis,
      po: poOtomatis,
      tgl_po: tglPoOtomatis,
      isSaving: false
    };
  });
});

/**
 * ACTIONS & HANDLERS (Tetap sama seperti sebelumnya)
 */
const selectAllFiltered = () => {
  filteredSearchStyles.value.forEach(s => {
    if(!selectedStyles.value.includes(s)) selectedStyles.value.push(s);
  });
};

const isAlreadySaved = (xMark) => {
  return pelengkapData.value.some(p => p.xMark === xMark);
};

const handleSaveMassal = async () => {
  if (filteredDisplayData.value.length === 0) return alert("Tidak ada data untuk disimpan.");
  if (!confirm(`Simpan massal ${filteredDisplayData.value.length} data untuk tanggal ${filter.value.pDate}?`)) return;

  bulkSaving.value = true;
  try {
    const payloadItems = filteredDisplayData.value.map(group => ({
      xMark: group.xMark,
      gedung: group.gedung || "", 
      kebutuhan: group.kebutuhan,
      po: group.po,
      tgl_po: group.tgl_po || null,
      xDateTime: filter.value.pDate
    }));

    await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap/upsertmassal`, {
      items: payloadItems,
      pDate: filter.value.pDate
    });

    payloadItems.forEach(item => {
      const idx = pelengkapData.value.findIndex(p => p.xMark === item.xMark);
      if (idx !== -1) {
        pelengkapData.value[idx] = { ...item };
      } else {
        pelengkapData.value.push({ ...item });
      }
    });

    alert("Seluruh data berhasil disinkronkan dan disimpan!");
  } catch (err) {
    console.error("Bulk Save Error:", err);
    alert("Gagal simpan massal data.");
  } finally {
    bulkSaving.value = false;
  }
};

const handleSave = async (group) => {
  group.isSaving = true;
  try {
    const singlePayload = {
      xMark: group.xMark,
      gedung: group.gedung || "",
      kebutuhan: group.kebutuhan,
      po: group.po,
      tgl_po: group.tgl_po || null,
      xDateTime: filter.value.pDate,
    };
    
    await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap/upsertmassal`, {
      items: [singlePayload],
      pDate: filter.value.pDate
    });
    
    const idx = pelengkapData.value.findIndex(p => p.xMark === group.xMark);
    if (idx !== -1) {
      pelengkapData.value[idx] = { ...singlePayload };
    } else {
      pelengkapData.value.push({ ...singlePayload });
    }
    
    alert(`Style ${group.xMark} berhasil disimpan`);
  } catch (err) {
    console.error("Save Error:", err);
    alert("Gagal simpan data");
  } finally {
    group.isSaving = false;
  }
};

const handleDelete = async (xMark) => {
  if (!confirm(`Hapus data ${xMark} untuk tanggal ${filter.value.pDate}?`)) return;
  try {
    await axios.delete(`${API_BASE_URL}/receivefinishing/pelengkap/${xMark}`, {
      params: { pDate: filter.value.pDate }
    });
    pelengkapData.value = pelengkapData.value.filter(p => p.xMark !== xMark);
  } catch (err) {
    console.error("Delete Error:", err);
    alert("Gagal hapus data");
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
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}
.btn-style-card {
  background: white; border: 1px solid #dee2e6;
  font-size: 0.75rem; padding: 8px; border-radius: 8px;
}
.btn-check:checked + .btn-style-card {
  background: #0d6efd; color: white; border-color: #0d6efd;
}
.x-small { font-size: 0.7rem; }
.sidebar-component { position: fixed; height: 100vh; z-index: 1050; }
.loading-overlay{
    position: fixed;
    inset: 0;
    background: rgba(255,255,255,.75);
    backdrop-filter: blur(2px);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:9999;
}
</style>