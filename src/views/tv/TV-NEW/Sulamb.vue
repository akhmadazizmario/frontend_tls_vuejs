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
      <div v-if="activeView === 'summary' && !isLoading" class="vh-100 w-100 d-flex flex-column p-5 bg-main-summary text-white overflow-hidden position-relative" style="box-sizing: border-box;">
        
        <div class="row align-items-center mb-4 m-0" style="height: 12vh;">
          <div class="col-6 text-start p-0">
            <h1 class="fw-black text-white m-0 tracking-tighter line-height-1" style="font-size: 3.5rem;">
              PRODUCTION <span class="text-warning">SUMMARY</span>
            </h1>
            <p class="fs-3 m-0 mt-2 fw-bold tracking-widest text-uppercase text-white">
              QC LAMPU & SULAM - Line B
            </p>
          </div>

          <div class="col-6 text-end p-0">
            <div class="status-badge mb-2 d-inline-block px-4 py-2 fs-4 fw-bold" style="background: rgba(255, 255, 255, 0.1); border-radius: 8px;">SYSTEM ACTIVE</div>
            <h2 class="fw-black m-0 text-shadow" style="font-size: 3rem;">
              {{ new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }} WIB
            </h2>
          </div>
        </div>

        <div class="row flex-grow-1 justify-content-center align-items-center m-0" style="height: 83vh;">
          <div v-for="line in summaryData" :key="line.xLine" class="col-12 p-0 h-100">
            
            <div class="summary-card border-primary shadow-glow-primary d-flex flex-column h-100" style="overflow: hidden; background: rgba(10, 15, 30, 0.7); border-radius: 24px;">
              <div class="card-glow glow-primary"></div>
              
              <div class="summary-content d-flex flex-column h-100 p-5 position-relative justify-content-between flex-grow-1">
                
                <div class="d-flex justify-content-between align-items-center m-0" style="height: 10vh;">
                  <div class="line-pill shadow-lg bg-primary px-5 py-3 fw-black text-white" style="font-size: 3rem; border-radius: 16px;">
                    {{ line.xLine }}
                  </div>
                  <div class="status-pill fw-bold bg-black bg-opacity-40 px-4 py-3 rounded-pill border border-secondary border-opacity-20" style="font-size: 1.8rem; letter-spacing: 2px;">
                    <i class="bi bi-record-fill text-success me-3 animate-pulse"></i> MONITORING
                  </div>
                </div>

                <div class="row g-5 align-items-center my-auto flex-grow-1" style="height: 50vh;">
                  
                  <div class="col-6 d-flex flex-column justify-content-center h-100 border-end border-secondary border-opacity-25 pe-5">
                    <div class="data-box-premium text-center w-100">
                      <h2 class="label-premium fw-black mb-3 text-warning" style="font-size: 2.2rem; letter-spacing: 5px;">
                        OUTPUT QC LAMPU
                      </h2>
                      <div class="value-wrapper justify-content-center d-flex align-items-baseline">
                        <span class="value-premium fw-black text-white" style="font-size: 8rem; line-height: 1;">{{ line.hasil_qc || 0 }}</span>
                        <span class="unit-premium fw-bold ms-3 text-white-50" style="font-size: 2.5rem;">QTY</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-6 d-flex flex-column justify-content-center h-100 ps-5">
                    <div class="data-box-premium text-center w-100">
                      <h2 class="label-premium fw-black mb-3 text-info" style="font-size: 2.2rem; letter-spacing: 5px;">
                        OUTPUT SULAM
                      </h2>
                      <div class="value-wrapper justify-content-center d-flex align-items-baseline">
                        <span class="value-premium fw-black text-white" style="font-size: 8rem; line-height: 1;">{{ line.hasil_sulam || 0 }}</span>
                        <span class="unit-premium fw-bold ms-3 text-white-50" style="font-size: 2.5rem;">QTY</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div class="operator-glass-section p-4 row align-items-center m-0 bg-black bg-opacity-40 border-top border-secondary border-opacity-20" style="height: 13vh; border-radius: 16px;">
                  <div class="col-4 d-flex align-items-center">
                    <div class="operator-avatar me-4 bg-primary bg-opacity-20 d-flex align-items-center justify-content-center rounded-circle text-primary" style="width: 70px; height: 70px; font-size: 2.5rem; min-width: 70px;">
                      <i class="bi bi-people-fill"></i>
                    </div>
                    <div>
                      <h3 class="m-0 fw-black text-white uppercase tracking-wide" style="font-size: 1.8rem;">OPERATOR ACTIVE</h3>
                      <p class="m-0 text-white-50 tracking-wider" style="font-size: 1.1rem; letter-spacing: 1px;">REALTIME MANPOWER</p>
                    </div>
                  </div>
                  
                  <div class="col-8 d-flex justify-content-around text-center">
                    <div class="d-flex align-items-center gap-4">
                      <div class="text-white fw-bold tracking-wider" style="font-size: 1.6rem;">QC LAMPU:</div>
                      <div class="text-warning fw-black" style="font-size: 3.5rem;">{{ line.employee_qc || 0 }} <span class="fw-bold text-white" style="font-size: 1.8rem;">ORG</span></div>
                    </div>
                    <div style="border-left: 2px solid rgba(255,255,255,0.15); height: 50px;"></div>
                    <div class="d-flex align-items-center gap-4">
                      <div class="text-white fw-bold tracking-wider" style="font-size: 1.6rem;">SULAM:</div>
                      <div class="text-info fw-black" style="font-size: 3.5rem;">{{ line.employee_sulam || 0 }} <span class="fw-bold text-white" style="font-size: 1.8rem;">ORG</span></div>
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
              <h1 class="fw-black m-0 display-3 text-white">LOW PERFORMANCE (&lt; 50%)</h1>
              <p class="m-0 text-white fs-4 fw-bold opacity-75">Operator Masa Kerja &gt; 4 Bulan</p>
            </div>
            <span class="badge bg-white text-danger fs-2 border border-dark px-4 shadow">QC LAMPU DAN SULAM LINE B</span>
          </div>
        </div>
        
        <div class="table-frame flex-grow-1 bg-white border border-4 border-dark shadow overflow-hidden d-flex flex-column">
          <div v-if="under60Data.length === 0" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
            <p class="fs-2 text-muted text-uppercase text-dark">Tidak ada operator SULAM DAN QC LAMPU Line B yang dibawah target.</p>
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
      <div v-if="activeView === 'table' && !isLoading" class="vh-100 w-100 d-flex flex-column p-4 bg-silver overflow-hidden position-relative" style="box-sizing: border-box;">
        
        <div class="header-navy-custom p-4 mb-3 rounded shadow border border-dark d-flex justify-content-between align-items-center" style="height: 12vh;">
          <div>
            <h1 class="fw-black m-0 display-4 text-white">HASIL PROD SULAM & QC LAMPU Line B</h1>
            <h4 class="fw-bold text-warning m-0 text-uppercase fs-3">
              MONITORING Operator RATE &lt; 50% — <span class="text-white bg-danger px-2 rounded">SHIFT {{ currentShift }}</span>
            </h4>
          </div>
          <div class="bg-warning px-4 py-2 rounded border border-dark fw-black fs-2 text-dark">ACTIVE</div>
        </div>

        <div class="table-frame flex-grow-1 bg-white border border-4 border-dark shadow overflow-hidden d-flex flex-column" style="height: 83vh;">
          
          <div v-if="filteredProductionData.length === 0" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
            <p class="display-6 fw-bold text-dark text-uppercase">Tidak ada operator Sulam dan QC lampu Line B yang dibawah target pada Shift {{ currentShift }}.</p>
          </div>

          <table v-else class="table-custom table-fixed h-100 m-0" style="width: 100%;">
            <thead class="bg-black text-white text-center">
              <tr class="header-text-white">
                <th rowspan="2" style="width: 70px; color:white;">NO</th>
                <th rowspan="2" style="width: 80px; color:white;">LINE</th>
                <th rowspan="2" class="text-start px-3" style="width: 25%; color:white;">NAMA OPERATOR</th>
                <th rowspan="2" style="width: 140px; color:white;">MASA KERJA</th>
                <th rowspan="2" style="width: 12%; color:white;">STYLE</th>
                <th rowspan="2" style="width: 15%; color:white;">PROSES</th>
                
                <th colspan="3" class="bg-success text-white py-1 border-bottom-dark border-start-dark">
                  HASIL PRODUKSI 
                </th>
              </tr>
              <tr class="header-text-white">
                <th v-for="n in currentHourColumns" :key="n" class="p-0 border-start-dark border-bottom-dark" style="width: 15%;">
                  <div class="d-flex w-100 h-100">
                    <div class="bg-dark py-2 text-warning fs-5 fw-bold" style="width: 50%;">Tgt {{ n }}</div>
                    <div class="bg-success py-2 border-end border-dark text-white fs-4 fw-bold" style="width: 50%;">JAM {{ n }}</div>
                    
                  </div>
                </th>
              </tr>
            </thead>
            
            <tbody class="text-center fw-black">
              <tr v-for="(item, index) in paginatedData" :key="index" class="border-bottom-dark" style="height: 10.5vh;">
                <td class="display-6 bg-light border-end-dark" style="vertical-align: middle;">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td class="fs-3 border-end-dark" style="vertical-align: middle;">{{ cleanLineName(item.xGroup) }}</td>
                <td class="fs-3 text-start px-3 text-dark border-end-dark text-truncate" style="vertical-align: middle; max-width: 220px;">{{ item.xEmplName }}</td>
                <td class="fs-4 text-dark border-end-dark bg-light-blue" style="vertical-align: middle;">{{ formatLOS(item.xJoinMonth) }}</td>
                <td class="fs-4 text-dark border-end-dark text-truncate" style="vertical-align: middle; max-width: 110px;">{{ item.xMark || '-' }}</td>
                <td class="fs-4 text-dark border-end-dark text-truncate" style="vertical-align: middle; max-width: 140px;">{{ item.xWorkName || '-' }}</td>
                
                <td v-for="n in currentHourColumns" :key="n" class="p-0 border-end-dark hour-col" style="vertical-align: middle;">
                  <div class="d-flex h-100 align-items-stretch">
                    <div class="fs-3 fw-black py-2 text-primary bg-white d-flex align-items-center justify-content-center" style="width: 50%;">
                      {{ item.hourlyTarget[n] % 1 === 0 ? item.hourlyTarget[n] : item.hourlyTarget[n].toFixed(1) }}
                    </div>
                    <div class="display-6 fw-black py-2 text-dark border-end border-dark bg-yellow-soft d-flex align-items-center justify-content-center" style="width: 50%;">
                      {{ item.hourlyQty[n] || 0 }}
                    </div>
                    
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="fixed-bottom bg-black" style="height: 12px;">
          <div class="h-100 bg-warning shadow" :style="{ width: scrollProgress + '%', transition: 'none' }"></div>
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

// Reactive tracking jam internal monitor
const currentHourRealtime = ref(new Date().getHours());

const formatLOS = (m) => {
  if (!m) return '0Bln';
  const years = Math.floor(m / 12);
  const months = m % 12;
  return (years > 0 ? `${years}Thn ` : '') + (months > 0 ? `${months}Bln` : (years > 0 ? '' : '0Bln'));
};

const currentShift = computed(() => {
  return currentHourRealtime.value >= 14 ? 2 : 1;
});

const currentHourColumns = computed(() => {
  return currentShift.value === 1 ? [8, 11, 14] : [17, 19, 22];
});

const cleanLineName = (name) => {
  if (!name) return '-';
  let upperName = name.toUpperCase();
  if (upperName.includes('QC')) return 'QC B';
  if (upperName.includes('SULAM')) return 'SLM B';
  return upperName.replace('SULAM', 'SLM').replace('S LINE', '').replace('LINE', '').trim();
};

const getProcessOrder = (workName) => {
  if (!workName) return 99;
  const name = workName.toUpperCase();
  if (name.includes('QC') || name.includes('LAMPU') || name.includes('LMP')) return 1;
  if (name.includes('SULAM') || name.includes('SLM')) return 2;
  return 3;
};

const groupedData = computed(() => {
  const groups = {};
  const isShift1 = currentShift.value === 1;
  const currentHour = currentHourRealtime.value;

  rawData.value.forEach(row => {
    const key = `${row.xEmplName}_${row.xMark}_${row.xWorkName}`;
    
    if (!groups[key]) {
      groups[key] = { 
        xEmplName: row.xEmplName, 
        xGroup: row.xGroup, 
        xMark: row.xMark,
        xWorkName: row.xWorkName, 
        xJoinMonth: row.xJoinMonth || 0, 
        xTRealRate: row.xTRealRate || 0,
        hourlyQty: isShift1 ? { 8: 0, 11: 0, 14: 0 } : { 17: 0, 19: 0, 22: 0 },
        hourlyTarget: isShift1 ? { 8: 0, 11: 0, 14: 0 } : { 17: 0, 19: 0, 22: 0 }
      };
    }

    if (isShift1) {
      // --- SHIFT 1 TIME-GATE (Disesuaikan dengan Target SQL) ---
      
      // Kolom Jam 8: Selalu Muncul
      groups[key].hourlyQty[8] = Math.max(groups[key].hourlyQty[8], row.xJam8 || 0);
      groups[key].hourlyTarget[8] = Math.max(groups[key].hourlyTarget[8], row.target8 || 0);

      // Kolom Jam 11: Muncul jika jam komputer sudah melewati jam 8 pagi
      if (currentHour >= 8) {
        groups[key].hourlyQty[11] = Math.max(groups[key].hourlyQty[11], row.xJam11 || 0);
        groups[key].hourlyTarget[11] = Math.max(groups[key].hourlyTarget[11], row.target11 || 0);
      } else {
        groups[key].hourlyQty[11] = 0;
        groups[key].hourlyTarget[11] = 0;
      }

      // Kolom Jam 14: Muncul jika jam komputer sudah melewati jam 11 siang
      if (currentHour >= 11) {
        groups[key].hourlyQty[14] = Math.max(groups[key].hourlyQty[14], row.xJam14 || 0);
        groups[key].hourlyTarget[14] = Math.max(groups[key].hourlyTarget[14], row.target14 || 0);
      } else {
        groups[key].hourlyQty[14] = 0;
        groups[key].hourlyTarget[14] = 0;
      }

    } else {
      // --- SHIFT 2 TIME-GATE (Disesuaikan dengan Target SQL) ---
      
      // Kolom Jam 17: Selalu Muncul di Shift 2
      groups[key].hourlyQty[17] = Math.max(groups[key].hourlyQty[17], row.xJam17 || 0);
      groups[key].hourlyTarget[17] = Math.max(groups[key].hourlyTarget[17], row.target17 || 0);

      // Kolom Jam 19: Muncul jika jam komputer sudah melewati jam 17 (5 sore)
      if (currentHour >= 17) {
        groups[key].hourlyQty[19] = Math.max(groups[key].hourlyQty[19], row.xJam19 || 0);
        groups[key].hourlyTarget[19] = Math.max(groups[key].hourlyTarget[19], row.target19 || 0);
      } else {
        groups[key].hourlyQty[19] = 0;
        groups[key].hourlyTarget[19] = 0;
      }

      // Kolom Jam 22: Muncul jika jam komputer sudah melewati jam 19 (7 malam)
      if (currentHour >= 19) {
        groups[key].hourlyQty[22] = Math.max(groups[key].hourlyQty[22], row.xJam22 || 0);
        groups[key].hourlyTarget[22] = Math.max(groups[key].hourlyTarget[22], row.target22 || 0);
      } else {
        groups[key].hourlyQty[22] = 0;
        groups[key].hourlyTarget[22] = 0;
      }
    }
  });

  return Object.values(groups);
});

const filteredProductionData = computed(() => {
  const isShift1 = currentShift.value === 1;

  const filtered = groupedData.value.filter(item => {
    const isLineA = item.xGroup?.toUpperCase().includes("LINE A");
    const isUnderRate = item.xTRealRate < 50;
    const isSenior = item.xJoinMonth > 4;
    
    if (!isLineA || !isUnderRate || !isSenior) return false;

    // Singkirkan data kosong sisa shift sebelumnya dari render tabel berjalan
    if (isShift1) {
      return (item.hourlyQty[8] > 0 || item.hourlyQty[11] > 0 || item.hourlyQty[14] > 0);
    } else {
      return (item.hourlyQty[17] > 0 || item.hourlyQty[19] > 0 || item.hourlyQty[22] > 0);
    }
  });

  return filtered.sort((a, b) => {
    const orderA = getProcessOrder(a.xWorkName);
    const orderB = getProcessOrder(b.xWorkName);
    if (orderA !== orderB) return orderA - orderB;
    return (a.xEmplName || '').localeCompare(b.xEmplName || '');
  });
});

const paginatedData = computed(() => filteredProductionData.value.slice((currentPage.value - 1) * itemsPerPage.value, currentPage.value * itemsPerPage.value));
const paginatedUnder60 = computed(() => under60Data.value.slice((currentUnder60Page.value - 1) * itemsPerPage.value, currentUnder60Page.value * itemsPerPage.value));

const fetchAllData = async () => {
  try {
    currentHourRealtime.value = new Date().getHours();

    const [resD, resU, resS] = await Promise.all([
      axios.get(`${API_BASE_URL}/tv-baru/target3jam-sulam`),
      axios.get(`${API_BASE_URL}/tv-baru/under50sulam`),
      axios.get(`${API_BASE_URL}/tv-baru/sulamreport`)
    ]);
    
    rawData.value = resD.data.success ? resD.data.data : [];
    
    if (resU.data.success) {
      const filteredUnder60 = resU.data.data.filter(x => 
        x.xGroup?.toUpperCase().includes("LINE B") && 
        x.xJoinMonth > 4 && 
        x.xTRealRate < 50
      );
      
      under60Data.value = filteredUnder60.sort((a, b) => {
        const orderA = getProcessOrder(a.xWorkName);
        const orderB = getProcessOrder(b.xWorkName);
        if (orderA !== orderB) return orderA - orderB;
        return (a.xEmplName || '').localeCompare(b.xEmplName || '');
      });
    } else {
      under60Data.value = [];
    }
    
    if (resS.data.success) {
      summaryData.value = resS.data.data.filter(i => i.xLine === 'LINE B');
    }
  } catch (e) { 
    console.error("Error Fetching Data:", e); 
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
  await fetchAllData();
  isLoading.value = false;

  setTimeout(() => {
    window.location.reload(true); 
  }, 60 * 60 * 1000);

  setInterval(() => {
    currentHourRealtime.value = new Date().getHours();
  }, 60000);

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
.unit-premium {
  font-size: 3rem;
  color: rgba(255,255,255,0.3);
  font-weight: 800;
  margin-left: 15px;
}
/* Tambahkan di style jika diperlukan agar layout tidak pecah */
.table-fixed {
  table-layout: fixed;
  width: 100%;
}

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