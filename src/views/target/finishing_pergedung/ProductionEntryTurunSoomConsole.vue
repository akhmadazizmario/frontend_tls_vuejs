<template>
  <div class="d-flex flex-column min-vh-100 bg-light text-dark mt-5">

    <!-- OVERLAY LOADING GLOBAL: memblokir SEMUA klik di halaman saat data sedang
         di-reload atau sedang proses simpan, supaya tidak ada aksi ganda / salah tanggal
         akibat user mengklik data lama yang belum sinkron. -->
    <transition name="fade">
      <div v-if="busy" class="global-loading-overlay" @click.stop.prevent @mousedown.stop.prevent>
        <div class="loading-box">
          <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
          <p class="fw-bold text-dark mb-1">{{ loadingBulk ? 'Menyimpan data massal...' : 'Memuat data...' }}</p>
          <p class="small text-muted mb-0">Mohon tunggu, jangan menutup atau me-reload halaman ini.</p>
        </div>
      </div>
    </transition>

    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1 overflow-hidden position-relative">
      <Sidebar :isOpen="sidebarOpen" class="sidebar-component" />
      
      <main :class="['flex-grow-1 p-3 p-md-4 main-content transition-all', sidebarOpen ? 'sidebar-open-margin' : 'sidebar-closed-margin']">
        <div class="container-fluid">
          
          <div class="row align-items-center mb-4 g-3">
            <div class="col-lg-6">
              <h4 class="fw-bold m-0 text-dark">Production Entry Console</h4>
              <p class="text-muted small mb-0">Input Qty Sontex untuk SOOM - Pelengkap Sontek Finishing</p>
            </div>
            <div class="col-lg-6 text-lg-end">
              <div class="d-inline-flex bg-white p-2 rounded-4 shadow-sm align-items-center flex-wrap gap-2">
                <span class="small fw-bold px-3 border-end text-muted">TANGGAL SP</span>
                <input type="date" v-model="filter.pDate" @change="fetchData" :disabled="busy" class="form-control border-0 shadow-none fw-bold bg-transparent w-auto" />
                
                <button @click="fetchData" :disabled="busy" class="btn btn-primary rounded-3 px-3 fw-bold">
                  <i v-if="loading" class="spinner-border spinner-border-sm me-1"></i>
                  <i v-else class="bi bi-arrow-clockwise me-1"></i> RELOAD
                </button>

                <button @click="handleAutoSyncSoom" :disabled="busy" class="btn btn-warning rounded-3 px-3 fw-bold text-dark">
                  <i class="bi bi-lightning-charge-fill me-1"></i> auto sync dept
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
                Ditemukan <strong>{{ missingDeptItems.length }} item</strong> dengan data acuan (`Total CBS + CBSHGS`), namun belum ditentukan alokasi Departemen tujuannya (SOOM). Silakan pilih departemen terlebih dahulu sebelum melakukan simpan massal.
              </p>
              <div class="d-flex flex-wrap gap-1" style="max-height: 85px; overflow-y: auto;">
                <span v-for="item in missingDeptItems" :key="item.xMark" class="badge bg-light text-dark border fw-semibold small">
                  {{ item.xMark }} (Total: {{ item.total_stik + item.total_stkb }})
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
                    <input type="text" v-model="searchQuery" :disabled="busy" class="form-control bg-transparent border-0 shadow-none" placeholder="Ketik nama xMark / style...">
                  </div>
                </div>
                <div class="col-md-7 text-md-end">
                  <div class="btn-group shadow-sm rounded-3 me-2">
                    <button @click="selectAllFiltered" :disabled="busy" class="btn btn-outline-dark btn-sm fw-bold">Pilih Semua</button>
                    <button @click="selectedStyles = []" :disabled="busy" class="btn btn-outline-danger btn-sm fw-bold">Reset</button>
                  </div>
                </div>
              </div>

              <div class="style-container bg-light rounded-4 p-3 border border-dashed">
                <div class="style-grid">
                  <div v-for="style in filteredSearchStyles" :key="style" class="style-item">
                    <input type="checkbox" :id="'st-'+style" :value="style" v-model="selectedStyles" :disabled="busy" class="btn-check">
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
              <span class="fw-bold text-dark"><i class="bi bi-table me-2 text-primary"></i>Daftar Item Penurunan SOOM</span>
              <button @click="handleSaveBulk" :disabled="busy" class="btn btn-primary rounded-3 px-4 fw-bold shadow-sm">
                <i v-if="loadingBulk" class="spinner-border spinner-border-sm me-1"></i>
                <i v-else class="bi bi-check-all me-1"></i> SIMPAN MASSAL ({{readyBulkItems.length}} ITEM)
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
                    <th width="180" class="text-center align-middle">TOTAL stik&stkb</th>
                    <th width="180" class="text-center align-middle">TOTAL stik</th>
                    <th width="180" class="text-center align-middle">TOTAL stkb</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="group in filteredDisplayData" :key="group.xMark" class="border-bottom bg-white" :class="{'table-warning-subtle': group.qty > 0 && !group.dept}">
                    <td class="ps-4">
                      <div class="d-flex gap-2">
                        <button @click="handleSave(group)" :disabled="group.isSaving || busy" class="btn btn-success btn-sm rounded-pill px-3 shadow-sm">
                          <i v-if="group.isSaving" class="spinner-border spinner-border-sm me-1"></i>
                          <i v-else class="bi bi-save me-1"></i> SIMPAN
                        </button>
                        <button v-if="group.id" @click="handleDelete(group.id, group.xMark)" :disabled="busy" class="btn btn-outline-danger btn-sm rounded-circle border-0">
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
                      <select v-model="group.dept" :disabled="busy" class="form-select form-select-sm border-0 bg-light fw-bold rounded-3" :class="{'is-invalid': group.qty > 0 && !group.dept}">
                        <option value="">- Pilih Dept -</option>
                        <option value="SOOM">SOOM</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" min="0" v-model.number="group.qty" :disabled="busy" class="form-control form-control-sm border-0 bg-light fw-bold text-center rounded-3" placeholder="0">
                    </td>
                    <td class="text-center">
                      <span class="fw-bold text-dark">{{ group.total_stik + group.total_stkb }}</span>
                    </td>
                    <td class="text-center">
                      <span class="fw-bold text-secondary">{{ group.total_stik }}</span>
                    </td>
                    <td class="text-center">
                      <span class="fw-bold text-secondary">{{ group.total_stkb }}</span>
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
const rawData = ref([]);         
const pelengkapLamaData = ref([]);  
const pelengkapTurunData = ref([]);   
const loading = ref(false);
const loadingBulk = ref(false); // Tambahan state loading untuk simpan massal
const searchQuery = ref("");
const selectedStyles = ref([]);

const tableFilter = ref({
  styles: [],
  gedungs: []
});

const filter = ref({
  pDate: new Date().toISOString().substr(0, 10)
});

// Gabungan status sibuk (sedang fetch ATAU sedang simpan massal) -> dipakai untuk
// mengunci overlay loading global dan semua elemen interaktif di halaman ini.
const busy = computed(() => loading.value || loadingBulk.value);

// Menyimpan TANGGAL yang datanya benar-benar sedang tampil di layar saat ini.
// Dipakai sebagai pengaman ekstra: kalau user sempat ganti tanggal filter tapi
// fetch belum selesai / belum di-klik reload, proses simpan akan diblokir
// supaya tidak salah menyimpan ke tanggal yang salah.
const loadedForDate = ref(filter.value.pDate);

// Token untuk membuang response fetchData yang "basi" (request lama yang baru
// selesai belakangan setelah ada request baru yang lebih baru), supaya data
// di layar tidak pernah ter-overwrite oleh hasil fetch yang sudah usang.
let fetchRequestId = 0;

// Utama Fetch Data dengan Validasi Array
const fetchData = async () => {
  const requestId = ++fetchRequestId;
  const requestedDate = filter.value.pDate;

  loading.value = true;
  selectedStyles.value = []; 
  tableFilter.value.styles = []; 
  tableFilter.value.gedungs = [];
  try {
    const [spRes, plLamaRes, plTurunRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { 
        params: { pDate: requestedDate } 
      }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { 
        params: { pDate: requestedDate } 
      }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom`, { 
        params: { pDate: requestedDate } 
      })
    ]);

    // Kalau sudah ada request fetchData yang lebih baru menyusul sebelum request
    // ini selesai, buang hasil basi ini. Mencegah data lama "menimpa" data baru.
    if (requestId !== fetchRequestId) return;
    
    rawData.value = Array.isArray(spRes.data?.data) ? spRes.data.data : [];
    pelengkapLamaData.value = Array.isArray(plLamaRes.data?.data) ? plLamaRes.data.data : []; 
    pelengkapTurunData.value = Array.isArray(plTurunRes.data?.data) ? plTurunRes.data.data : [];
    loadedForDate.value = requestedDate; // Data di layar resmi valid untuk tanggal ini
  } catch (err) {
    if (requestId !== fetchRequestId) return;
    console.error("Error Fetching Data:", err);
    alert("Gagal sinkronisasi data dengan server. Silakan muat ulang halaman.");
  } finally {
    if (requestId === fetchRequestId) {
      loading.value = false;
    }
  }
};

const allAvailableStyles = computed(() => {
  if (!rawData.value.length) return [];
  return [...new Set(rawData.value.map(item => item?.xMark).filter(Boolean))].sort();
});

const filteredSearchStyles = computed(() => {
  if (!searchQuery.value) return allAvailableStyles.value;
  const query = searchQuery.value.toLowerCase();
  return allAvailableStyles.value.filter(s => s.toLowerCase().includes(query));
});

const uniqueStylesInTable = computed(() => {
  return [...selectedStyles.value].sort();
});

const uniqueGedungsInTable = computed(() => {
  if (!selectedStyles.value.length) return [];
  const  gedungMap = new Map(pelengkapLamaData.value.map(p => [p.xMark, p.gedung]));
  const geds = selectedStyles.value.map(xMark => gedungMap.get(xMark) || '');
  return [...new Set(geds)].sort();
});

/**
 * ⚡ GABUNGKAN DATA + OVERRIDE VALUE QTY DARI TOTAL CBS & CBSHGS
 */
const filteredDisplayData = computed(() => {
  if (!selectedStyles.value.length) return [];

  const rawMap = new Map(rawData.value.map(r => [r.xMark, r]));
  const lamaMap = new Map(pelengkapLamaData.value.map(p => [p.xMark, p]));
  const turunMap = new Map(pelengkapTurunData.value.map(p => [p.xMark, p]));

  const mappedData = selectedStyles.value.map(xMark => {
    const spInfo = rawMap.get(xMark) || {};
    const gedungRef = lamaMap.get(xMark) || {};
    const dbInfo = turunMap.get(xMark) || {};
    
    const tCbs = spInfo.total_stik || 0;
    const tCbshgs = spInfo.total_stkb || 0;
    const totalAcuan = tCbs + tCbshgs; // Gabungan qty penentu target otomatis
    
    // LOGIKA TURUN OTOMATIS: Jika di database kosong/0, otomatis pakai total acuan (CBS + CBSHGS)
    const initialQty = (dbInfo.qty && dbInfo.qty !== 0) ? dbInfo.qty : totalAcuan;
    
    return {
      id: dbInfo.id || null,
      xMark: xMark,
      gedung: gedungRef.gedung || '', 
      dept: dbInfo.dept || '',
      qty: initialQty,
      total_stik: tCbs, 
      total_stkb: tCbshgs, 
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
 * DETEKSI ITEM YANG SUDAH JALAN CBS/CBSHGS TAPI DEPT SOOM MASIH KOSONG
 */
const missingDeptItems = computed(() => {
  return filteredDisplayData.value.filter(item => (item.total_stik + item.total_stkb) > 0 && item.dept === "");
});

/**
 * ITEM YANG SIAP DI-UPSERT SAAT SIMPAN MASSAL
 * Syarat lengkap: gedung terisi, dept terisi, qty > 0.
 * Item yang tidak memenuhi syarat ini akan di-SKIP (tidak ikut dikirim).
 */
const readyBulkItems = computed(() => {
  return filteredDisplayData.value.filter(item =>
    item.gedung && item.gedung.trim() !== "" &&
    item.dept && item.dept.trim() !== "" &&
    item.qty > 0
  );
});

const handleAutoSyncSoom = async () => {
  if (busy.value) return;

  if (!confirm("Sistem akan melacak data acuan SOOM terakhir secara otomatis ke belakang (Mundur dari H-2), lalu menduplikasi struktur Master (Dept SOOM & Gedung) secara berurutan hingga hari kemarin (H-1).\n\nApakah Anda yakin ingin menjalankan sinkronisasi otomatis ini?\n\n*Catatan: Nilai Qty inputan manual pada tanggal tujuan tetap aman dan tidak akan ter-reset.*")) {
    return;
  }

  if (busy.value) return;

  loading.value = true;
  try {
    const response = await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom/sync-range`);
    alert(response.data?.message || "Proses otomatis Sinkronisasi Master SOOM Sukses!");
    await fetchData();
  } catch (err) {
    console.error("Auto Sync SOOM Error:", err);
    alert("Gagal sinkronisasi data SOOM otomatis: " + (err.response?.data?.message || err.message));
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
 * SAVE PER BARIS DATA
 */
const handleSave = async (group) => {
  // Cegah klik ganda / klik saat sistem masih sibuk (reload data atau simpan massal lain).
  if (busy.value || group.isSaving) return;

  // Pengaman ekstra: pastikan data yang tampil di layar memang untuk tanggal filter
  // yang sedang aktif. Kalau tanggal filter berubah tapi belum di-reload, jangan
  // sampai kesave ke tanggal yang salah.
  if (filter.value.pDate !== loadedForDate.value) {
    return alert("Tanggal filter berubah namun data di tabel belum diperbarui. Silakan klik RELOAD terlebih dahulu sebelum menyimpan, agar data tidak tersimpan ke tanggal yang salah.");
  }

  if (!group.gedung) return alert(`Gedung untuk style ${group.xMark} belum diset di Pelengkap Lama! Mohon isi data pelengkap dahulu.`);
  if (!group.dept) return alert("Pilih Departemen Tujuan (SOOM)!");
  if (group.qty <= 0) return alert("Kuantiti (qty) harus lebih besar dari 0!");
  
  group.isSaving = true;
  try {
    const payload = {
      id: group.id,
      xMark: group.xMark,
      dept: group.dept,
      qty: group.qty,
      gedung: group.gedung, 
      xDateTime: filter.value.pDate
    };
    
    await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom/upsert`, payload);
    alert(`Sukses menyimpan data penurunan SOOM ${group.xMark}`);
    
    await fetchDataSilently();
  } catch (err) {
    console.error("Save Error:", err);
    alert("Gagal memproses pengiriman data: " + (err.response?.data?.message || err.message));
  } finally {
    group.isSaving = false;
  }
};

/**
 * SIMPAN MASSAL (BULK SAVE) UNTUK SOOM
 */
const handleSaveBulk = async () => {
  // Cegah klik ganda / klik saat sistem masih sibuk (reload data atau proses simpan lain berjalan).
  if (busy.value) return;

  // Pengaman ekstra: pastikan data yang tampil di layar memang untuk tanggal filter
  // yang sedang aktif, supaya simpan massal tidak pernah salah tanggal.
  if (filter.value.pDate !== loadedForDate.value) {
    return alert("Tanggal filter berubah namun data di tabel belum diperbarui. Silakan klik RELOAD terlebih dahulu sebelum simpan massal, agar data tidak tersimpan ke tanggal yang salah.");
  }

  const allItems = filteredDisplayData.value;

  if (allItems.length === 0) {
    return alert("Tidak ada data dalam tabel yang tersedia untuk disimpan.");
  }

  // Hanya item yang LENGKAP (style/xMark otomatis ada, gedung, dept, qty > 0) yang ikut diproses.
  // Item yang tidak lengkap otomatis DI-SKIP, tidak memblokir item lain yang sudah lengkap.
  const targetItems = readyBulkItems.value;
  const skippedItems = allItems.filter(i => !targetItems.includes(i));

  if (targetItems.length === 0) {
    return alert("Tidak ada item dengan data lengkap (Style, Gedung, dan Departemen Tujuan) untuk disimpan massal.");
  }

  let confirmMsg = `Apakah Anda yakin ingin memproses simpan massal untuk ${targetItems.length} item data SOOM ini?`;
  if (skippedItems.length > 0) {
    confirmMsg += `\n\n${skippedItems.length} item akan DILEWATI (SKIP) karena Gedung/Departemen Tujuan/Qty belum lengkap:\n` +
      skippedItems.map(i => `- ${i.xMark}`).join("\n");
  }

  if (!confirm(confirmMsg)) {
    return;
  }

  // Cek ulang setelah dialog confirm ditutup, karena user bisa saja sempat
  // memicu proses lain (reload/simpan lain) selagi dialog confirm terbuka.
  if (busy.value || filter.value.pDate !== loadedForDate.value) {
    return alert("Kondisi data berubah selagi konfirmasi berlangsung. Silakan coba lagi setelah proses lain selesai.");
  }

  loadingBulk.value = true;
  try {
    const itemsPayload = targetItems.map(item => ({
      id: item.id,
      xMark: item.xMark,
      dept: item.dept,
      qty: item.qty,
      gedung: item.gedung,
      // Kirim tanggal saja (YYYY-MM-DD). Jam/menit/detik dipatok ke 00:00:00.000 di backend,
      // tidak mengikuti jam saat tombol simpan massal diklik.
      xDateTime: filter.value.pDate
    }));

    // Gantilah endpoint di bawah ini jika endpoint save massal SOOM berbeda di backend Anda
    const response = await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom/savemasal`, {
      items: itemsPayload
    });

    alert(response.data?.message || "Seluruh data SOOM sukses disimpan secara massal!");
    await fetchData();
  } catch (err) {
    console.error("Bulk Save Error:", err);
    alert("Gagal memproses penyimpanan data massal: " + (err.response?.data?.message || err.message));
  } finally {
    loadingBulk.value = false;
  }
};

const fetchDataSilently = async () => {
  try {
    const plTurunRes = await axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom`, { 
      params: { pDate: filter.value.pDate } 
    });
    pelengkapTurunData.value = Array.isArray(plTurunRes.data?.data) ? plTurunRes.data.data : [];
  } catch (err) {
    console.error("Silent sync failed", err);
  }
};

const handleDelete = async (id, xMark) => {
  if (!id) return;
  if (!confirm(`Hapus data penurunan untuk ${xMark}?`)) return;
  try {
    await axios.delete(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom/${id}`);
    alert("Data berhasil dihapus.");
    pelengkapTurunData.value = pelengkapTurunData.value.filter(p => p.id !== id);
  } catch (err) {
    console.error("Delete Error:", err);
    alert("Gagal menghapus data target.");
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

/* Overlay loading global: menutupi seluruh layar (termasuk Header & Sidebar)
   supaya benar-benar tidak ada elemen yang bisa diklik selama proses berjalan. */
.global-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(2px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: wait;
}
.loading-box {
  background: #ffffff;
  padding: 2rem 2.75rem;
  border-radius: 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  text-align: center;
  min-width: 260px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
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
</style>