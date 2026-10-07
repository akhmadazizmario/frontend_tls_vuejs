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
    <div class="fw-bold">Mengambil data...</div>
  </div>
</div>
          
          <div class="row align-items-center mb-4 g-3">
            <div class="col-lg-6">
              <h4 class="fw-bold m-0 text-dark">Production Entry Console</h4>
              <p class="text-muted small mb-0">Input Qty Turun ke Dept LO / CBS - Pelengkap Turun Finishing</p>
            </div>
            <div class="col-lg-6 text-lg-end">
              <div class="d-inline-flex bg-white p-2 rounded-4 shadow-sm align-items-center flex-wrap gap-2">
                <span class="small fw-bold px-3 border-end text-muted">TANGGAL SP</span>
                <input type="date" v-model="filter.pDate" @change="fetchData" class="form-control border-0 shadow-none fw-bold bg-transparent w-auto" />
                
                <button @click="fetchData" :disabled="loading" class="btn btn-primary rounded-3 px-3 fw-bold">
                  <i v-if="loading" class="spinner-border spinner-border-sm me-1"></i>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i> RELOAD
                </button>

                <button @click="handleAutoSync" :disabled="loading" class="btn btn-warning rounded-3 px-3 fw-bold text-dark">
                  <i class="bi bi-lightning-charge-fill me-1"></i> suto sync dept
                </button>
              </div>
            </div>
          </div>

          <div v-if="missingDeptItems.length > 0" class="alert alert-warning border-0 shadow-sm rounded-4 mb-4 p-3 d-flex align-items-start gap-3 animate__animated animate__fadeIn" role="alert">
            <div class="bg-warning text-white rounded-circle p-2 d-inline-flex align-items-center justify-content-center flex-shrink-0" style="width: 40px; height: 40px;">
              <i class="bi bi-exclamation-triangle-fill fs-5"></i>
            </div>
            <div class="flex-grow-1">
              <h6 class="fw-bold text-dark mb-1">Perhatian! Departemen Tujuan Belum Dipilih</h6>
              <p class="small text-muted mb-2">
                Ditemukan <strong>{{ missingDeptItems.length }} item</strong> dengan data produksi (`Total Linking P`), namun belum ditentukan alokasi Departemen tujuannya (LO/CBS). Silakan pilih departemen terlebih dahulu sebelum melakukan simpan massal.
              </p>
              <div class="d-flex flex-wrap gap-1" style="max-height: 85px; overflow-y: auto;">
                <span v-for="item in missingDeptItems" :key="item.xMark" class="badge bg-light text-dark border fw-semibold small">
                  {{ item.xMark }} (LP: {{ item.total_linkingP }})
                </span>
              </div>
            </div>
          </div>

          <div v-if="allAvailableStyles.length > 0" class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-3 p-md-4">
              <div class="row g-3 align-items-end mb-3">
                <div class="col-md-5">
                  <label class="small fw-bold text-primary mb-2">CARI STYLE / MARK DARI SUMMARY LINE</label>
                  <div class="input-group bg-light border rounded-3 px-2">
                    <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
                    <input type="text" v-model="searchQuery" class="form-control bg-transparent border-0 shadow-none" placeholder="Ketik nama xMark / style...">
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

          <div v-if="filteredDisplayData.length > 0" class="card border-0 shadow rounded-4 overflow-visible">
            <div class="card-header bg-white border-0 pt-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span class="fw-bold text-dark"><i class="bi bi-table me-2 text-primary"></i>Daftar Item Penurunan</span>
              <button @click="handleSaveBulk" :disabled="loading || loadingBulk || isProcessing" class="btn btn-primary rounded-3 px-4 fw-bold shadow-sm">
                <i v-if="loadingBulk" class="spinner-border spinner-border-sm me-1"></i>
                <i v-else class="bi bi-check-all me-1"></i> SIMPAN MASSAL ({{ filteredDisplayData.length }} ITEM)
              </button>
            </div>

            <div class="table-responsive" style="overflow: visible;">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-dark text-white">
                  <tr>
                    <th class="ps-4 py-3 align-middle" width="130">OPSI</th>
                    <th width="250" class="align-middle">
                      <div class="d-flex align-items-center justify-content-between">
                        <span>STYLE / XMARK</span>
                        <div class="dropdown d-inline-block">
                          <button class="btn btn-dark btn-sm p-1 dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                            <i class="bi bi-funnel-fill" :class="{'text-warning': tableFilter.styles.length > 0}"></i>
                          </button>
                          <div class="dropdown-menu p-3 shadow-lg custom-dropdown-menu">
                            <h6 class="dropdown-header px-0 text-dark fw-bold">Filter Style</h6>
                            <div class="dropdown-scroll-area">
                              <div v-for="st in uniqueStylesInTable" :key="st" class="form-check mb-1">
                                <input class="form-check-input" type="checkbox" :id="'f-st-'+st" :value="st" v-model="tableFilter.styles">
                                <label class="form-check-label small text-dark w-100 cursor-pointer" :for="'f-st-'+st">{{ st }}</label>
                              </div>
                            </div>
                            <div class="dropdown-divider"></div>
                            <button class="btn btn-xxs btn-secondary w-100" @click="tableFilter.styles = []">Clear Filter</button>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th width="150" class="align-middle">
                      <div class="d-flex align-items-center justify-content-between">
                        <span>GEDUNG</span>
                        <div class="dropdown d-inline-block">
                          <button class="btn btn-dark btn-sm p-1 dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                            <i class="bi bi-funnel-fill" :class="{'text-warning': tableFilter.gedungs.length > 0}"></i>
                          </button>
                          <div class="dropdown-menu p-3 shadow-lg custom-dropdown-menu">
                            <h6 class="dropdown-header px-0 text-dark fw-bold">Filter Gedung</h6>
                            <div class="dropdown-scroll-area">
                              <div v-for="gd in uniqueGedungsInTable" :key="gd" class="form-check mb-1">
                                <input class="form-check-input" type="checkbox" :id="'f-gd-'+gd" :value="gd" v-model="tableFilter.gedungs">
                                <label class="form-check-label small text-dark w-100 cursor-pointer" :for="'f-gd-'+gd">
                                  {{ gd ? 'Gedung ' + gd : 'Belum Set' }}
                                </label>
                              </div>
                            </div>
                            <div class="dropdown-divider"></div>
                            <button class="btn btn-xxs btn-secondary w-100" @click="tableFilter.gedungs = []">Clear Filter</button>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th width="200" class="align-middle">DEPARTEMEN TUJUAN <span>(*)</span></th>
                    <th width="180" class="align-middle">QTY TURUN <span>(*)</span></th>
                    <th width="180" class="text-center align-middle">TOTAL LINKING P</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="group in filteredDisplayData" :key="group.xMark" class="border-bottom bg-white" :class="{'table-warning-subtle': group.total_linkingP > 0 && !group.dept}">
                    <td class="ps-4">
                      <div class="d-flex gap-2">
                        <!--- <button @click="handleSave(group)" :disabled="group.isSaving" class="btn btn-success btn-sm rounded-pill px-3 shadow-sm">
                          <i v-if="group.isSaving" class="spinner-border spinner-border-sm me-1"></i>
                          <i v-else class="bi bi-save me-1"></i> SIMPAN
                        </button> --->
                        <button v-if="group.id" @click="handleDelete(group.id, group.xMark)" class="btn btn-outline-danger btn-sm rounded-circle border-0">
                          <i class="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div class="fw-bold text-dark">{{ group.xMark }}</div>
                    </td>
                    <td>
                      <span v-if="group.gedung" class="badge bg-primary px-3 py-2 rounded-3 fw-bold">GEDUNG {{ group.gedung }}</span>
                      <span v-else class="badge bg-warning text-dark px-3 py-2 rounded-3 fw-bold">BELUM SET DI PELENGKAP</span>
                    </td>
                    <td>
                      <select v-model="group.dept" class="form-select form-select-sm border-0 bg-light fw-bold rounded-3" :class="{'is-invalid': group.total_linkingP > 0 && !group.dept}">
                        <option value="">- Pilih Dept -</option>
                        <option value="LO">LO</option>
                        <option value="CBS">CBS</option>
                      </select>
                    </td>
                    <td>
                      <!-- <input type="number" v-model.number="group.qty" class="form-control form-control-sm border-0 bg-light fw-bold text-center rounded-3" placeholder="0"> -->
                      <input type="number" :value="group.total_linkingP" class="form-control form-control-sm border-0 bg-light fw-bold text-center rounded-3">
                    </td>
                    <td class="text-center">
                      <span class="fw-bold text-secondary">{{ group.total_linkingP }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="text-center py-5 mt-4 bg-white rounded-4 shadow-sm border border-dashed">
             <i class="bi bi-clipboard-data fs-1 text-muted opacity-25"></i>
             <p class="mt-3 text-muted">Pilih xMark/style dari hasil load data untuk menginput kuantiti penurunan departemen.</p>
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

// State Management
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(false);
const rawData = ref([]);            // Dari /summary-line
const pelengkapLamaData = ref([]);    // Tambahan data gedung asal /pelengkap
const pelengkapTurunData = ref([]);   // Dari /pelengkap-turun
const loading = ref(false);
const loadingBulk = ref(false);       // State loading simpan masal

const searchQuery = ref("");
const selectedStyles = ref([]);

// State filter dropdown di header kolom tabel
const tableFilter = ref({
  styles: [],
  gedungs: []
});

const filter = ref({
  pDate: new Date().toISOString().substr(0, 10)
});
const isProcessing = ref(false);
/**
 * AMBIL DATA UTAMA DARI 3 ENDPOINT
 */
const fetchData = async () => {
  loading.value = true;
  selectedStyles.value = []; 
  tableFilter.value.styles = []; 
  tableFilter.value.gedungs = [];
  
  try {
    const [spRes, plLamaRes, plTurunRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { 
        params: { pDate: filter.value.pDate } 
      }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { 
        params: { pDate: filter.value.pDate } 
      }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turun`, { 
        params: { pDate: filter.value.pDate } 
      })
    ]);
    
    rawData.value = spRes.data.data || [];
    pelengkapLamaData.value = plLamaRes.data.data || []; 
    pelengkapTurunData.value = plTurunRes.data.data || [];
  } catch (err) {
    console.error("Error Fetching Data:", err);
    alert("Gagal sinkronisasi data dengan server.");
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

const uniqueStylesInTable = computed(() => {
  return [...selectedStyles.value].sort();
});

const uniqueGedungsInTable = computed(() => {
  const geds = selectedStyles.value.map(xMark => {
    const gedungRef = pelengkapLamaData.value.find(p => p.xMark === xMark) || {};
    return gedungRef.gedung || '';
  });
  return [...new Set(geds)].sort();
});

/**
 * GABUNGKAN DATA UNTUK STRUKTUR FORM TABEL
 * Mengatur inisiasi qty: pakai database jika ada, jika belum ada ikut total_linkingP
 */
const filteredDisplayData = computed(() => {
  const mappedData = selectedStyles.value.map(xMark => {
    const spInfo = rawData.value.find(r => r.xMark === xMark) || {};
    const gedungRef = pelengkapLamaData.value.find(p => p.xMark === xMark) || {};
    const dbInfo = pelengkapTurunData.value.find(p => p.xMark === xMark) || {};
    
    const totalLinkingP = spInfo.total_linkingP || 0;
    
    // LOGIKA QTY ADAPTIF: Jika di DB sudah ada datanya, pakai dari DB. Jika kosong/nol, pakai total_linkingP
    //const initialQty = (dbInfo.qty && dbInfo.qty !== 0) ? dbInfo.qty : totalLinkingP;
    const initialQty =
     (dbInfo.qty && dbInfo.qty !== 0)
    ? dbInfo.qty
    : totalLinkingP;
    
    return {
      id: dbInfo.id || null,
      xMark: xMark,
      gedung: gedungRef.gedung || '', 
      dept: dbInfo.dept || '',
      qty: totalLinkingP, 
      total_linkingP: totalLinkingP, 
      isSaving: false
    };
  });

  return mappedData.filter(item => {
    const matchStyle = tableFilter.value.styles.length === 0 || tableFilter.value.styles.includes(item.xMark);
    const matchGedung = tableFilter.value.gedungs.length === 0 || tableFilter.value.gedungs.includes(item.gedung);
    return matchStyle && matchGedung;
  });
});

/**
 * DETEKSI ITEM YANG SUDAH JALAN LINKING P TAPI DEPT MASIH KOSONG
 */
const missingDeptItems = computed(() => {
  return filteredDisplayData.value.filter(item => item.total_linkingP > 0 && item.dept === "");
});

/**
 * PROSES AUTO-SYNC SEKARANG MANDIRI (TANPA PAYLOAD)
 */
const handleAutoSync = async () => {
  if (!confirm("Sistem akan melacak data acuan terakhir secara otomatis ke belakang (Mundur dari H-2), lalu menduplikasi struktur Master (Dept & Gedung) secara berurutan hingga hari kemarin (H-1).\n\nApakah Anda yakin ingin menjalankan sinkronisasi otomatis ini?\n\n*Catatan: Nilai Qty di tanggal tujuan tetap aman dan tidak akan ter-reset.*")) {
    return;
  }

  loading.value = true;
  try {
    const response = await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-turun/sync-range`);
    alert(response.data.message || "Otomatis sinkronisasi master data sukses!");
    fetchData();
  } catch (err) {
    console.error("Auto Sync Error:", err);
    alert("Gagal melakukan sinkronisasi otomatis: " + (err.response?.data?.message || err.message));
  } finally {
    loading.value = false;
  }
};

const selectAllFiltered = () => {
  filteredSearchStyles.value.forEach(s => {
    if(!selectedStyles.value.includes(s)) selectedStyles.value.push(s);
  });
};

/**
 * SAVE PER BARIS DATA (UPSERT SINGLE)
 */
const handleSave = async (group) => {
  group.isSaving = true;
  try {
    const payload = {
      id: group.id,
      xMark: group.xMark,
      dept: group.dept || null,     // Mengirimkan null jika departemen belum dipilih
      qty: group.qty || 0,
      gedung: group.gedung || null, // Mengirimkan null jika gedung kosong
      xDateTime: filter.value.pDate
    };
    
    const response = await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-turun/upsert`, payload);
    alert(`Sukses menyimpan data penurunan ${group.xMark}`);
    
    const savedData = response.data?.data;
    if (savedData && savedData.id) {
      const index = pelengkapTurunData.value.findIndex(p => p.xMark === group.xMark);
      if (index !== -1) {
        pelengkapTurunData.value[index] = { ...pelengkapTurunData.value[index], id: savedData.id, dept: group.dept, qty: group.qty };
      } else {
        pelengkapTurunData.value.push({
          id: savedData.id,
          xMark: group.xMark,
          dept: group.dept,
          qty: group.qty
        });
      }
    } else {
      fetchDataSilently();
    }
  } catch (err) {
    console.error("Save Error:", err);
    alert("Gagal memproses penyimpanan data.");
  } finally {
    group.isSaving = false;
  }
};

/**
 * SIMPAN MASSAL (SAVE BULK) - BERSIH TANPA VALIDASI PENGHAMBAT
 */
const handleSaveBulk = async () => {
  const targetItems = filteredDisplayData.value;
  if(isProcessing.value) return;

    isProcessing.value=true;

  
  if (targetItems.length === 0) {
    return alert("Tidak ada data dalam tabel yang tersedia untuk disimpan.");
  }

  if (!confirm(`Apakah Anda yakin ingin memproses simpan massal untuk ${targetItems.length} item data ini? (Item tanpa gedung akan dilewati otomatis)`)) {
    return;
  }

  loadingBulk.value = true;
  try {
    // Bungkus semua data apa adanya, biarkan backend yang memfilter baris tanpa gedung
    const itemsPayload = targetItems.map(item => ({
      id: item.id,
      xMark: item.xMark,
      dept: item.dept || null,     // Mengirim null jika belum dipilih
      qty: item.qty || 0,
      gedung: item.gedung || null, // Mengirim null jika tidak ada gedung
      xDateTime: filter.value.pDate
    }));

    const response = await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-turun/savemasal`, {
      items: itemsPayload
    });

    alert(response.data.message || "Seluruh data sukses diproses secara massal!");
    await fetchData(); // Refresh data agar dapat ID terbaru dari database
  } catch (err) {
    console.error("Bulk Save Error:", err);
    alert("Gagal memproses penyimpanan data massal: " + (err.response?.data?.message || err.message));
  } finally {
    loadingBulk.value = false;
    isProcessing.value=false;
  }
};

const fetchDataSilently = async () => {
  try {
    const plTurunRes = await axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turun`, { 
      params: { pDate: filter.value.pDate } 
    });
    pelengkapTurunData.value = plTurunRes.data.data || [];
  } catch (err) {
    console.error("Silent sync failed", err);
  }
};

const handleDelete = async (id, xMark) => {
  if (!id) return;
  if (!confirm(`Hapus data penurunan untuk ${xMark}?`)) return;
  
  try {
    await axios.delete(`${API_BASE_URL}/receivefinishing/pelengkap-turun/${id}`);
    alert("Data berhasil dihapus.");
    pelengkapTurunData.value = pelengkapTurunData.value.filter(p => p.id !== id);
  } catch (err) {
    console.error("Delete Error:", err);
    alert("Gagal menghapus data.");
  }
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => { localStorage.clear(); window.location.href = "/login"; };

onMounted(() => {

    fetchData();
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
 // fetchData();
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
.sidebar-component { position: fixed; height: 100vh; z-index: 1050; }

/* CSS BARU UNTUK DROPDOWN FILTER DI HEADER */
.no-caret::after {
  display: none !important;
}
.custom-dropdown-menu {
  min-width: 200px;
  max-width: 280px;
  z-index: 1060;
}
.dropdown-scroll-area {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 3px;
}
.btn-xxs {
  padding: 0.15rem 0.4rem;
  font-size: 0.7rem;
  border-radius: 4px;
}
.cursor-pointer {
  cursor: pointer;
}
.overflow-visible {
  overflow: visible !important;
}
.loading-overlay{
    position: fixed;
    inset:0;
    background:rgba(255,255,255,.75);
    z-index:9999;

    display:flex;
    align-items:center;
    justify-content:center;

    backdrop-filter: blur(2px);
}
</style>