<template>
  <div class="container-fluid bg-dark vh-100 p-0 overflow-hidden text-dark font-main">
    
    <!-- 1. LOADING OVERLAY -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader-box"></div>
      <h1 class="fw-black display-3 text-warning">SINKRONISASI DATA...</h1>
      <p class="text-white fs-4 text-uppercase">Mohon Tunggu, Mengatur Urutan Tampilan</p>
    </div>

    <!-- 2. SLIDE 1: PRODUCTION SUMMARY (MODERN PREMIUM) -->
    <Transition name="fade-slide">
      <div v-if="activeView === 'summary' && !isLoading" class="vh-100 d-flex flex-column p-4 bg-main-summary">
        <div class="row align-items-center mb-4 mt-2">
          <div class="col-4 text-start ps-5">
            <h1 class="display-3 fw-black text-white m-0 tracking-tighter line-height-1">PRODUCTION<br><span class="text-warning">SUMMARY</span></h1>
            <p class="fs-4 m-0 mt-2 fw-bold tracking-widest" style="color:white;">LINKING DEPARTMENT</p>
          </div>

          <div class="col-4">
            <div class="central-planning-card shadow-2xl border-warning">
              <div class="planning-label">PLANNING LINKING (A&B)</div>
              <div class="d-flex align-items-baseline justify-content-center">
                <span class="planning-value text-warning">{{ planningData || 0 }}</span>
                <span class="planning-unit text-white-50 ms-2">QTY</span>
              </div>
              <div class="planning-date">{{ new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }}</div>
            </div>
          </div>

          <!-- Time Section -->
          <div class="col-4 text-end pe-5">
            <div class="status-badge mb-2">SYSTEM ACTIVE</div>
            <h2 class="text-white fw-bold display-5 m-0">{{ new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }} WIB</h2>
          </div>
        </div>

        <!-- MAIN CARDS AREA -->
        <div class="row flex-grow-1 g-5 px-4 align-items-stretch">
          <div v-for="line in summaryData" :key="line.xLine" class="col-6">
            <div class="summary-card h-100 border-success">
              <!-- Glow Background Effect -->
              <div class="card-glow" :class="line.xLine === 'LINE A' ? 'glow-primary' : 'glow-danger'"></div>
              
              <div class="summary-content d-flex flex-column h-100 p-5 position-relative">
                <!-- Line Header -->
                <div class="d-flex justify-content-between align-items-center mb-5">
                  <div class="line-pill shadow-lg" :class="line.xLine === 'LINE A' ? 'bg-primary' : 'bg-danger'">
                    {{ line.xLine }}
                  </div>
                  <div class="status-pill"><i class="bi bi-record-fill text-success me-2"></i>MONITORING</div>
                </div>

                <!-- Main Data Row -->
                <div class="row g-4 flex-grow-1 align-items-center">
                  <div class="col-12">
                    <div class="data-box-premium">
                      <h2 class="label-premium" style="color: white;">TOTAL OUTPUT PRIMARY</h2>
                      <div class="value-wrapper">
                        <span class="value-premium">{{ line.hasil_primary }}</span>
                        <span class="unit-premium">QTY</span>
                      </div>
                      <!-- Progress Bar Sederhana -->
                      <div class="progress-container mt-4">
                        <div class="progress-bar-fill" :style="{ width: (line.hasil_primary / (planningData || 1) * 100) + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Operator Section -->
                <div class="operator-glass-section mt-5 d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center">
                    <div class="operator-avatar me-3">
                      <i class="bi bi-people-fill"></i>
                    </div>
                    <div>
                      <h3 class="m-0 fw-bold text-white fs-2 uppercase">OPERATOR ACTIVE</h3>
                      <p class="m-0 text-white-50 fs-5">Linking Operator</p>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="operator-count text-warning fw-black">
                      {{ line.total_employee }} <span class="fs-4" style="color: white;">ORG</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 3. SLIDE 2: LOW PERFORMANCE (ORIGINAL LAYOUT) -->
    <Transition name="fade-slide">
      <div v-if="activeView === 'under60' && !isLoading" class="vh-100 d-flex flex-column p-2 bg-silver">
        <div class="header-danger-custom p-3 mb-2 rounded shadow border border-dark">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h1 class="fw-black m-0 display-3 text-white">LOW PERFORMANCE (< 50%)</h1>
              <p class="m-0 text-white fs-4 fw-bold opacity-75">Operator Masa Kerja > 4 Bulan</p>
            </div>
            <span class="badge bg-white text-danger fs-2 border border-dark px-4 shadow">LINKING LINE A & LINE B</span>
          </div>
        </div>
        
        <div class="table-frame flex-grow-1 bg-white border border-4 border-dark shadow overflow-hidden d-flex flex-column">
          <div v-if="under60Data.length === 0" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
            <p class="fs-2 text-muted text-uppercase text-dark">Tidak ada operator Linking Line A dan B yang dibawah target.</p>
          </div>

          <table v-else class="table-custom table-fixed">
            <thead class="bg-navy text-white">
              <tr class="header-text-white">
                <th style="width: 80px;">NO</th>
                <th style="width: 120px;">LINE</th>
                <th class="text-start px-4">NAMA OPERATOR</th>
                <th style="width: 250px;">MASA KERJA</th>
                <th style="width: 200px;" class="bg-warning text-dark border-start-dark">RATE %</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in paginatedUnder60" :key="index" class="border-bottom-dark">
                <td class="fs-1 bg-light fw-black border-end-dark">{{ (currentUnder60Page - 1) * itemsPerPage + index + 1 }}</td>
                <td class="fs-2 fw-black border-end-dark">{{ cleanLineName(item.xGroup) }}</td>
                <td class="fs-1 text-start px-4 text-uppercase fw-black text-dark border-end-dark text-truncate">{{ item.xEmplName }}</td>
                <td class="fs-2 text-primary fw-black border-end-dark bg-light-blue">{{ formatLOS(item.xJoinMonth) }}</td>
                <td class="display-3 text-danger bg-yellow-soft fw-black">{{ Math.round(item.xTRealRate) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Transition>

<!-- 4. SLIDE 3: HASIL PRODUKSI PER 3 JAM -->
<Transition name="fade-slide">
  <div v-if="activeView === 'table' && !isLoading" class="vh-100 d-flex flex-column p-2 bg-silver">
    
    <!-- Header Monitor -->
    <div class="header-navy-custom p-3 mb-2 rounded shadow border border-dark d-flex justify-content-between align-items-center">
      <div>
        <h1 class="fw-black m-0 display-4 text-white">HASIL PROD LINKING LINE A & LINE B</h1>
        <h4 class="fw-bold text-warning m-0 text-uppercase">MONITORING KHUSUS RATE &lt; 50%</h4>
      </div>
      <div class="bg-warning px-4 py-2 rounded border border-dark fw-black fs-2 text-dark">ACTIVE</div>
    </div>

    <div class="table-frame flex-grow-1 bg-white border border-4 border-dark shadow overflow-hidden d-flex flex-column">
      
      <!-- State Kosong -->
      <div v-if="filteredProductionData.length === 0" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
        <p class="fs-3 text-dark text-uppercase">Tidak ada operator Linking Line A dan B yang dibawah target.</p>
      </div>

      <!-- Tabel Utama -->
      <table v-else class="table-custom table-fixed">
        <thead class="bg-black text-white text-center">
          <tr class="header-text-white">
            <th rowspan="2" style="width: 50px;color:white;">NO</th>
            <th rowspan="2" style="width: 80px;color:white;">LINE</th>
            <th rowspan="2" class="text-start px-3" style="width: 18%;color:white;">NAMA OPERATOR</th>
            <th rowspan="2" style="width: 140px;color:white;">MASA KERJA</th>
            <th rowspan="2" style="width: 10%;color:white;">STYLE</th>
            <th rowspan="2" style="width: 10%;color:white;">PROSES</th>
            
            <!-- PERUBAHAN: colspan="3" karena hanya menampilkan 3 kelompok jam tanpa kolom tambahan -->
            <th colspan="3" class="bg-success text-white py-1 border-bottom-dark border-start-dark">
              HASIL PRODUKSI 
            </th>
          </tr>
          <tr class="header-text-white">
            <!-- Header Jam Dinamis (Tgt/09, Tgt/12, Tgt/15) -->
            <th v-for="n in currentHourColumns" :key="n" class="p-0 border-start-dark border-bottom-dark">
              <div class="d-flex w-100 h-100">
                <!-- Merubah label menjadi Tgt/09, Tgt/12, Tgt/15 -->
                <div class="bg-dark py-2 text-warning fs-5" style="width: 50%;">
                  Tgt/{{ n &lt; 10 ? '0' + n : n }}
                </div>
                <div class="bg-success py-2 border-end border-dark text-white fs-5" style="width: 50%;">JAM {{ n }}</div>
              </div>
            </th>
          </tr>
        </thead>
        
        <tbody class="text-center fw-black">
          <tr v-for="(item, index) in paginatedData" :key="index" class="border-bottom-dark">
            <td class="fs-4 bg-light border-end-dark">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
            <td class="fs-5 border-end-dark">{{ cleanLineName(item.xGroup) }}</td>
            <td class="fs-4 text-start px-3 text-dark border-end-dark text-truncate">{{ item.xEmplName }}</td>
            <td class="fs-4 text-dark border-end-dark bg-light-blue">{{ formatLOS(item.xJoinMonth) }}</td>
            <td class="fs-5 text-dark border-end-dark text-truncate">{{ item.xMark || '-' }}</td>
            <td class="fs-4 text-dark border-end-dark">{{ item.xWorkName || '-' }}</td>
            
            <!-- Kolom Hasil Produksi Per Jam Berpasangan -->
            <td v-for="n in currentHourColumns" :key="n" class="p-0 border-end-dark hour-col">
              <div class="d-flex h-100 align-items-stretch">
                <!-- Target Akumulatif Jam (3h, 6h, 7h) -->
                <div class="fs-4 fw-black py-2 text-primary bg-white d-flex align-items-center justify-content-center" style="width: 50%;">
                  {{ item.hourlyTarget[n] % 1 === 0 ? item.hourlyTarget[n] : item.hourlyTarget[n].toFixed(1) }}
                </div>
                <!-- Kuantitas Produksi Akumulatif Berperingkat -->
                <div class="display-6 fw-black py-2 text-dark border-end border-dark bg-yellow-soft d-flex align-items-center justify-content-center" style="width: 50%;">
                  {{ item.hourlyQty[n] || 0 }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</Transition>

    <!-- BOTTOM PROGRESS BAR -->
    <div class="fixed-bottom bg-black" style="height: 12px;">
      <div class="h-100 bg-warning shadow" :style="{ width: scrollProgress + '%', transition: 'none' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isLoading = ref(true);
const rawData = ref([]);
const under60Data = ref([]);
const summaryData = ref([]);
const activeView = ref('summary');
const currentPage = ref(1);
const currentUnder60Page = ref(1);
const itemsPerPage = ref(6);
const scrollProgress = ref(0);
//const currentHourColumns = [9, 12, 15];
const planningData = ref(null);

const currentHourColumns = [9, 12, 15];

const formatLOS = (m) => {
  if (!m) return '0Bln';
  const years = Math.floor(m / 12);
  const months = m % 12;
  return (years > 0 ? `${years}Thn ` : '') + (months > 0 ? `${months}Bln` : (years > 0 ? '' : '0Bln'));
};

const cleanLineName = (name) => {
  if (!name) return '-';
  return name.toUpperCase().replace('LINKING', '').replace('LINE', '').trim();
};

const groupedData = computed(() => {
  const groups = {};

  rawData.value.forEach(row => {
    // KUNCI UTAMA: Gabungan EmplCode + Group/Line + Style (xMark) + Proses (xWorkName)
    const key = `${row.xEmplCode}_${row.xGroup}_${row.xMark}_${row.xWorkName}`;
    
    if (!groups[key]) {
      groups[key] = { 
        xEmplCode: row.xEmplCode,
        xEmplName: row.xEmplName, 
        xGroup: row.xGroup, 
        xMark: row.xMark,
        xWorkName: row.xWorkName, 
        xJoinMonth: row.xJoinMonth || 0, 
        xTRealRate: row.xTRealRate || 0,
        xTarget: row.xTarget || 0, 
        hourlyQty: { 9: 0, 12: 0, 15: 0 }, 
        hourlyTarget: { 9: 0, 12: 0, 15: 0 }
      };
    }

    // Mengisi kuantitas mentah per sesi kelompok jam terlebih dahulu dari database
    const jamKelompok = row.xTargetJamKelompok;
    if (jamKelompok === 9 || jamKelompok === 12 || jamKelompok === 15) {
      groups[key].hourlyQty[jamKelompok] += row.xQty || 0;
    }
  });

  return Object.values(groups).map(group => {
    const baseTarget = group.xTarget;

    // 1. Simpan salinan kuantitas mentah (raw data) asli per sesi jam
    const qty9 = group.hourlyQty[9];
    const qty12 = group.hourlyQty[12];
    const qty15 = group.hourlyQty[15];

    // 2. PERUBAHAN UTAMA: Logika Akumulasi Bertingkat Hasil Produksi Karyawan
    // Jam 9  = Tetap murni hasil jam 9
    // Jam 12 = Hasil Jam 12 + Hasil Jam 9
    // Jam 15 = Hasil Jam 15 + Hasil Jam 12 + Hasil Jam 9
    group.hourlyQty[9] = qty9;
    group.hourlyQty[12] = qty9 + qty12;
    group.hourlyQty[15] = qty9 + qty12 + qty15;
    
    // 3. Perhitungan Target Kumulatif Kelompok Waktu
    group.hourlyTarget[9] = baseTarget * 3;
    group.hourlyTarget[12] = baseTarget * 6;
    group.hourlyTarget[15] = baseTarget * 7;

    return group;
  });
});

const filteredProductionData = computed(() => {
  const filtered = groupedData.value.filter(item => {
    // 1. Ambil nama grup dan buat jadi uppercase biar gak typo
    const groupName = item.xGroup?.toUpperCase() || '';
    
    // 2. Cek apakah mengandung "LINE A" atau "LINE B"
    const isLineAorB = groupName.includes("LINE A") || groupName.includes("LINE B");
    
    // 3. Gabungkan dengan filter rate dan masa kerja
    return isLineAorB && item.xTRealRate < 50 && item.xJoinMonth > 4;
  });

  // PERUBAHAN DISINI: Mengurutkan data secara alfabetis berdasarkan nama Line (xGroup)
  return filtered.sort((a, b) => {
    const lineA = a.xGroup?.toUpperCase() || '';
    const lineB = b.xGroup?.toUpperCase() || '';
    return lineA.localeCompare(lineB, undefined, { numeric: true, sensitivity: 'base' });
  });
});

const paginatedData = computed(() => filteredProductionData.value.slice((currentPage.value - 1) * itemsPerPage.value, currentPage.value * itemsPerPage.value));
const paginatedUnder60 = computed(() => under60Data.value.slice((currentUnder60Page.value - 1) * itemsPerPage.value, currentUnder60Page.value * itemsPerPage.value));

const fetchAllData = async () => {
  try {
    const [resD, resU, resS, resP] = await Promise.all([
      axios.get(`${API_BASE_URL}/tv-baru/target3jam-linking`),
      axios.get(`${API_BASE_URL}/tv-baru/under50linking`),
      axios.get(`${API_BASE_URL}/tv-baru/linkingreport`),
      axios.get(`${API_BASE_URL}/planningoffice`)
    ]);
    
    rawData.value = resD.data.success ? resD.data.data : [];
    
    // PERUBAHAN DISINI: under60Data juga diurutkan berdasarkan Line secara alfabetis
    if (resU.data.success) {
  const filteredUnder60 = resU.data.data.filter(x => {
    const groupName = x.xGroup?.toUpperCase() || '';
    
    // ✅ Sekarang mengecek LINE A atau LINE B
    const isLineAorB = groupName.includes("LINE A") || groupName.includes("LINE B");
    
    return isLineAorB && x.xJoinMonth > 4 && x.xTRealRate < 50;
  });
  
  // Proses pengurutan alfabetis (tetap sama)
  under60Data.value = filteredUnder60.sort((a, b) => {
    const lineA = a.xGroup?.toUpperCase() || '';
    const lineB = b.xGroup?.toUpperCase() || '';
    return lineA.localeCompare(lineB, undefined, { numeric: true, sensitivity: 'base' });
  });
} else {
  under60Data.value = [];
}
    
    if (resS.data.success) {
      summaryData.value = resS.data.data.filter(i => i.xLine === 'LINE A' || i.xLine === 'LINE B');
    }

    if (resP.data.success) {
      const today = new Date().toISOString().split('T')[0];
      const findPlanning = resP.data.data.find(item => {
        const itemDate = new Date(item.xDate).toISOString().split('T')[0];
        return item.kategori_gedung === 'A&B' && itemDate === today;
      });
      planningData.value = findPlanning ? findPlanning.planning : 0;
    }

  } catch (e) { 
    console.error("Error Fetching Data", e); 
  }
};

const runTimer = (ms) => new Promise(res => {
  const start = Date.now();
  const timer = setInterval(() => {
    const elapsed = Date.now() - start;
    scrollProgress.value = (elapsed / ms) * 100;
    if (elapsed >= ms) { 
      clearInterval(timer); 
      res(); 
    }
  }, 50);
});

const startDisplayLoop = async () => {
  // Fetch pertama kali saat aplikasi dibuka
  await fetchAllData();
  isLoading.value = false;

  // Refresh data setiap 1 jam
  setInterval(async () => {
    console.log('Refresh data 1 jam sekali...');
    await fetchAllData();
  }, 60 * 60 * 1000); // 1 jam

  // Loop tampilan
  while (true) {
    activeView.value = 'summary';
    await runTimer(10000);

    activeView.value = 'under60';
    const uPageCount = Math.ceil(under60Data.value.length / itemsPerPage.value) || 1;

    for (let p = 1; p <= uPageCount; p++) {
      currentUnder60Page.value = p;
      await runTimer(15000);
    }

    activeView.value = 'table';
    const tData = filteredProductionData.value;
    const tPageCount = Math.ceil(tData.length / itemsPerPage.value) || 1;

    if (tData.length > 0) {
      for (let p = 1; p <= tPageCount; p++) {
        currentPage.value = p;
        await runTimer(20000);
      }
    } else {
      await runTimer(2000);
    }
  }
};

onMounted(() => {
  startDisplayLoop();
});
</script>

<style scoped>
/* BASE */
.font-main { font-family: 'Arial Black', Gadget, sans-serif; letter-spacing: -1.5px; }
.bg-silver { background-color: #f0f0f0; }
.bg-navy { background: #001f3f !important; }

/* SLIDE 2 & 3: TABLE ORIGINAL STYLES */
.header-danger-custom { background: #b71c1c; border-bottom: 6px solid #000; }
.header-navy-custom { background: #001f3f; border-bottom: 6px solid #000; }
.table-custom { width: 100%; border-collapse: collapse; height: 100%; }
.table-custom th, .table-custom td { border: 2px solid #000; vertical-align: middle; text-align: center; }
.table-fixed { table-layout: fixed; }
.bg-yellow-soft { background-color: #fffde7 !important; }
.bg-light-blue { background-color: #e3f2fd !important; }
.border-end-dark { border-right: 2px solid #000 !important; }
.border-start-dark { border-left: 2px solid #000 !important; }
.border-bottom-dark { border-bottom: 2px solid #000 !important; }
.display-3 { font-size: 4rem; }
.display-4 { font-size: 3.5rem; }
.display-6 { font-size: 2.5rem; }

/* ANIMATION & LOADING */
.loading-overlay { position: fixed; inset: 0; background: #000; z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.loader-box { width: 80px; height: 80px; border: 8px solid #333; border-top: 8px solid #ffc107; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-slide-enter-from { opacity: 0; transform: scale(0.9) translateY(40px); }
.fade-slide-leave-to { opacity: 0; transform: scale(1.1) translateY(-40px); }

/* --- PREMIUM SLIDE 1 STYLES --- */
.bg-main-summary { background: #0a0c10; background-image:  radial-gradient(at 0% 0%, rgba(0, 123, 255, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(220, 53, 69, 0.15) 0px, transparent 50%); overflow: hidden;}
.line-height-1 { line-height: 1; }
.central-planning-card { background: rgba(255, 255, 255, 0.03); border: 2px solid rgba(255, 193, 7, 0.3); border-radius: 30px; padding: 15px 30px; text-align: center; backdrop-filter: blur(20px); box-shadow: 0 0 40px rgba(255, 193, 7, 0.1);}
.planning-label { font-size: 1.2rem; color: #fff; font-weight: 800; letter-spacing: 4px; margin-bottom: 5px; }
.planning-value { font-size: 5rem; font-weight: 900; line-height: 1;}
.planning-unit { font-size: 1.5rem; font-weight: 700; }
.planning-date { color: rgba(255,255,255,0.4); font-weight: bold; letter-spacing: 1px; }
.summary-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 50px; position: relative; overflow: hidden; backdrop-filter: blur(15px);}
.card-glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; z-index: 0; opacity: 0.1;}
.glow-primary { background: radial-gradient(circle, #007bff 0%, transparent 70%); }
.glow-danger { background: radial-gradient(circle, #dc3545 0%, transparent 70%); }
.line-pill { padding: 12px 45px; border-radius: 20px; font-size: 2.5rem; font-weight: 900; color: white; letter-spacing: 2px;}
.status-pill { background: rgba(255,255,255,0.05); padding: 8px 20px; border-radius: 50px; color: #fff; font-weight: bold; border: 1px solid rgba(255,255,255,0.1);}
.data-box-premium { text-align: center; padding: 20px;}
.label-premium { font-size: 2rem; color: rgba(255,255,255,0.6); font-weight: 700; letter-spacing: 5px;}
.value-premium { font-size: 11rem; font-weight: 950; color: #fff; line-height: 1; text-shadow: 0 10px 30px rgba(0,0,0,0.5);}
.unit-premium { font-size: 3rem; color: rgba(255,255,255,0.3); font-weight: 800; margin-left: 15px;}
/* Tambahkan di style jika diperlukan agar layout tidak pecah */
.table-fixed { table-layout: fixed; width: 100%;}
.hour-col {
 width: 160px; /* Atur lebar tetap untuk kolom JAM */
}
.bg-yellow-soft {
  background-color: #fff9c4 !important;
}

/* Progress Bar */
.progress-container {
  height: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffc107, #ff9800);
  box-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
  transition: width 1s ease-in-out;
}

/* Operator Section Glass */
.operator-glass-section {
  background: rgba(255, 255, 255, 0.04);
  padding: 30px;
  border-radius: 30px;
  border: 1px solid rgba(255,255,255,0.05);
}

.operator-avatar {
  width: 70px;
  height: 70px;
  background: rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  font-size: 2.5rem;
  color: #fff;
}

.operator-count {
  font-size: 4.5rem;
  line-height: 1;
}

.status-badge {
  display: inline-block;
  background: #198754;
  color: #fff;
  padding: 5px 15px;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 2px;
}
</style>