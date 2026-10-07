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
    
    <!-- TOP HEADER: Kunci Tinggi & Ukuran Raksasa Untuk TV Display -->
    <div class="row align-items-center mb-4 m-0" style="height: 12vh;">
      <div class="col-6 text-start p-0">
        <h1 class="fw-black text-white m-0 tracking-tighter line-height-1" style="font-size: 3.5rem;">
          PRODUCTION <span class="text-warning">SUMMARY</span>
        </h1>
        <p class="fs-3 m-0 mt-2 fw-bold tracking-widest text-uppercase text-white">
          SEWING & LO - Line B
        </p>
      </div>

      <div class="col-6 text-end p-0">
        <div class="status-badge mb-2 d-inline-block px-4 py-2 fs-4 fw-bold" style="background: rgba(255, 255, 255, 0.1); border-radius: 8px;">SYSTEM ACTIVE</div>
        <h2 class="fw-black m-0 text-shadow" style="font-size: 3rem;">
          {{ new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }} WIB
        </h2>
      </div>
    </div>

    <!-- MAIN DISPLAY CONTAINER: Mengisi Sisa Ruang Layar TV (85vh) Tanpa Luber -->
    <div class="row flex-grow-1 justify-content-center align-items-center m-0" style="height: 83vh;">
      <div v-for="line in summaryData" :key="line.xLine" class="col-12 p-0 h-100">
        
        <!-- Premium Box Frame Dashboard TV -->
        <div class="summary-card border-primary shadow-glow-primary d-flex flex-column h-100" style="overflow: hidden; background: rgba(10, 15, 30, 0.7); border-radius: 24px;">
          <div class="card-glow glow-primary"></div>
          
          <div class="summary-content d-flex flex-column h-100 p-5 position-relative justify-content-between flex-grow-1">
            
            <!-- SECTION 1: Line Identifier & Live Badge -->
            <div class="d-flex justify-content-between align-items-center m-0" style="height: 10vh;">
              <div class="line-pill shadow-lg bg-primary px-5 py-3 fw-black text-white" style="font-size: 3rem; border-radius: 16px;">
                {{ line.xLine }}
              </div>
              <div class="status-pill fw-bold bg-black bg-opacity-40 px-4 py-3 rounded-pill border border-secondary border-opacity-20" style="font-size: 1.8rem; letter-spacing: 2px;">
                <i class="bi bi-record-fill text-success me-3 animate-pulse"></i>MONITORING
              </div>
            </div>

            <!-- SECTION 2: GRID GABUNGAN OUTPUT (Kiri: QC Lampu | Kanan: Sulam) -->
            <div class="row g-5 align-items-center my-auto flex-grow-1" style="height: 50vh;">
              
              <!-- LEFT AREA: QC LAMPU -->
              <div class="col-6 d-flex flex-column justify-content-center h-100 border-end border-secondary border-opacity-25 pe-5">
                <div class="data-box-premium text-center w-100">
                  <h2 class="label-premium fw-black mb-3 text-warning" style="font-size: 2.2rem; letter-spacing: 5px;">
                    OUTPUT SEWING
                  </h2>
                  <div class="value-wrapper justify-content-center d-flex align-items-baseline">
                    <span class="value-premium fw-black text-white" style="font-size: 8rem; line-height: 1;">{{ line.hasil_sewing || 0 }}</span>
                    <span class="unit-premium fw-bold ms-3 text-white-50" style="font-size: 2.5rem;">QTY</span>
                  </div>
                  
                  <!-- Heavy Progress Bar TV Style -->
                  <div class="progress-container mt-4" style="height: 35px; background: rgba(255,255,255,0.08); border-radius: 50px; overflow: hidden; padding: 4px;">
                    <div class="progress-bar-fill bg-warning shadow-glow-amber" 
                         :style="{ width: Math.min(((line.hasil_sewing || 0) / (planningData || 1) * 100), 100) + '%' }"
                         style="height: 100%; border-radius: 50px; transition: width 0.8s ease;">
                    </div>
                  </div>
                  
                </div>
              </div>
              
              <!-- RIGHT AREA: SULAM -->
              <div class="col-6 d-flex flex-column justify-content-center h-100 ps-5">
                <div class="data-box-premium text-center w-100">
                  <h2 class="label-premium fw-black mb-3 text-info" style="font-size: 2.2rem; letter-spacing: 5px;">
                    OUTPUT LO
                  </h2>
                  <div class="value-wrapper justify-content-center d-flex align-items-baseline">
                    <span class="value-premium fw-black text-white" style="font-size: 8rem; line-height: 1;">{{ line.hasil_lo || 0 }}</span>
                    <span class="unit-premium fw-bold ms-3 text-white-50" style="font-size: 2.5rem;">QTY</span>
                  </div>
                  
                  <!-- Heavy Progress Bar TV Style -->
                  <div class="progress-container mt-4" style="height: 35px; background: rgba(255,255,255,0.08); border-radius: 50px; overflow: hidden; padding: 4px;">
                    <div class="progress-bar-fill bg-info shadow-glow-blue" 
                         :style="{ width: Math.min(((line.hasil_lo || 0) / (planningData || 1) * 100), 100) + '%' }"
                         style="height: 100%; border-radius: 50px; transition: width 0.8s ease;">
                    </div>
                  </div>
                  
                </div>
              </div>

            </div>

            <!-- SECTION 3: BOTTOM OPERATOR LABELS (LOCK DI BAWAH CARD) -->
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
              
              <!-- Realtime Manpower Distribution -->
              <div class="col-8 d-flex justify-content-around text-center">
                <div class="d-flex align-items-center gap-4">
                  <div class="text-white fw-bold tracking-wider" style="font-size: 1.6rem;">Sewing:</div>
                  <div class="text-warning fw-black" style="font-size: 3.5rem;">{{ line.employee_sewing || 0 }} <span class="fw-bold text-white" style="font-size: 1.8rem;">ORG</span></div>
                </div>
                <div style="border-left: 2px solid rgba(255,255,255,0.15); height: 50px;"></div>
                <div class="d-flex align-items-center gap-4">
                  <div class="text-white fw-bold tracking-wider" style="font-size: 1.6rem;">LO:</div>
                  <div class="text-info fw-black" style="font-size: 3.5rem;">{{ line.employee_lo || 0 }} <span class="fw-bold text-white" style="font-size: 1.8rem;">ORG</span></div>
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
              <p class="m-0 text-white fs-4 fw-bold opacity-75">Operator Masa Kerja > 4 Bulan - {{ new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }}</p>
            </div>
            <span class="badge bg-white text-danger fs-2 border border-dark px-4 shadow">SEWING DAN LO LINE B</span>
          </div>
        </div>
        
        <div class="table-frame flex-grow-1 bg-white border border-4 border-dark shadow overflow-hidden d-flex flex-column">
          <div v-if="under60Data.length === 0" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
            <p class="fs-2 text-muted text-uppercase text-dark">Tidak ada operator SEWING DAN LO Line B yang dibawah target.</p>
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
      
      <!-- Header Monitor TV Style -->
      <div class="header-navy-custom p-4 mb-3 rounded shadow border border-dark d-flex justify-content-between align-items-center" style="height: 12vh;">
        <div>
          <h1 class="fw-black m-0 display-4 text-white">HASIL PROD SEWING & LO Line B</h1>
          <h4 class="fw-bold text-warning m-0 text-uppercase fs-3">
            MONITORING OPerator RATE &lt; 50% — <span class="text-white bg-danger px-2 rounded">SHIFT {{ currentShift }}</span>
          </h4>
          <p class="text-white">{{ new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) }}</p>
        </div>
        <div class="bg-warning px-4 py-2 rounded border border-dark fw-black fs-2 text-dark">ACTIVE</div>
      </div>

      <!-- Main Frame Table -->
      <div class="table-frame flex-grow-1 bg-white border border-4 border-dark shadow overflow-hidden d-flex flex-column" style="height: 83vh;">
        
        <!-- State Kosong -->
        <div v-if="filteredProductionData.length === 0" class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-5">
          <p class="display-6 fw-bold text-dark text-uppercase">Tidak ada operator Sewing dan LO Line B yang dibawah target pada Shift {{ currentShift }}.</p>
        </div>

        <!-- Tabel Utama (Anti-Scroll & Fix Width) -->
        <table v-else class="table-custom table-fixed h-100 m-0" style="width: 100%;">
          <thead class="bg-black text-white text-center">
            <tr class="header-text-white">
              <th rowspan="2" style="width: 70px;color:white;">NO</th>
              <th rowspan="2" style="width: 80px;color:white;">LINE</th>
              <th rowspan="2" class="text-start px-3" style="width: 25%;color:white;">NAMA OPERATOR</th>
              <th rowspan="2" style="width: 140px;color:white;">MASA KERJA</th>
              <th rowspan="2" style="width: 12%;color:white;">STYLE</th>
              <th rowspan="2" style="width: 15%;color:white;">PROSES</th>
              
              <!-- Dinamis Colspan Tetap 3 Kolom Jam -->
              <th colspan="3" class="bg-success text-white py-1 border-bottom-dark border-start-dark">
                HASIL PRODUKSI 
              </th>
              <!-- KOLOM BARU: total hasil operator pada shift berjalan -->
              <th rowspan="2" class="bg-warning text-dark border-start-dark" style="width: 130px;">HASIL</th>
            </tr>
            <tr class="header-text-white">
              <!-- Header Jam Tergantung Shift Berjalan -->
              <th v-for="n in currentHourColumns" :key="n" class="p-0 border-start-dark border-bottom-dark" style="width: 12%;">
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
              
              <!-- Mapping Hasil Jam Berdasarkan Shift Aktif -->
              <td v-for="n in currentHourColumns" :key="n" class="p-0 border-end-dark hour-col" style="vertical-align: middle;">
                <div class="d-flex h-100 align-items-stretch">
                  <!-- Target sesi 3 jam (xTarget per jam x 3) -->
                  <div class="fs-3 fw-black py-2 text-primary bg-white d-flex align-items-center justify-content-center" style="width: 50%;">
                    {{ item.hourlyTarget[n] % 1 === 0 ? item.hourlyTarget[n] : item.hourlyTarget[n].toFixed(1) }}
                  </div>
                  <!-- Hasil produksi pada sesi tersebut -->
                  <div class="display-6 fw-black py-2 text-dark border-end border-dark bg-yellow-soft d-flex align-items-center justify-content-center" style="width: 50%;">
                    {{ item.hourlyQty[n] || 0 }}
                  </div>
                </div>
              </td>

              <!-- KOLOM BARU: total hasil (penjumlahan hasil jam shift berjalan) -->
              <td class="display-6 fw-black text-dark bg-warning border-start-dark" style="vertical-align: middle;">
                {{ item.hasil }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- BOTTOM PROGRESS BAR -->
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
const planningData = ref(null);

// Reactive tracking untuk jam komputer saat ini secara real-time
const currentHourRealtime = ref(new Date().getHours());

const formatLOS = (m) => {
  if (!m) return '0Bln';
  const years = Math.floor(m / 12);
  const months = m % 12;
  return (years > 0 ? `${years}Thn ` : '') + (months > 0 ? `${months}Bln` : (years > 0 ? '' : '0Bln'));
};

// Penentuan shift menggunakan jam komputer real-time
const currentShift = computed(() => {
  return currentHourRealtime.value >= 14 ? 2 : 1;
});

const currentHourColumns = computed(() => {
  return currentShift.value === 1 ? [8, 11, 14] : [17, 19, 22];
});

const cleanLineName = (name) => {
  if (!name) return '-';
  let upperName = name.toUpperCase();
  if (upperName.includes('STICK LINE')) return 'Sewing B';
  if (upperName.includes('L.O LINE')) return 'L.O B';
  return upperName.replace('Stick', 'Swing').replace('SLINE', '').trim();
};

const toNum = (v) => Number(v) || 0;

// Sesi per shift. gate = jam komputer minimum agar kolom sesi tersebut sudah terisi
const shiftSessions = {
  1: [{ n: 8, gate: 0 }, { n: 11, gate: 8 }, { n: 14, gate: 11 }],
  2: [{ n: 17, gate: 0 }, { n: 19, gate: 17 }, { n: 22, gate: 19 }]
};

// SQL sudah mengirim hasil & target per sesi (bukan akumulasi): hasil_jam8, xTarget8, dst.
// Baris dengan operator + style + proses yang sama digabung supaya tidak dobel.
const groupedData = computed(() => {
  const groups = {};
  const sessions = shiftSessions[currentShift.value];
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
        xTRealRate: toNum(row.xTRealRate),
        xBConvertRate: row.xBConvertRate == null ? null : Number(row.xBConvertRate),
        hourlyQty: {},
        hourlyTarget: {}
      };
      sessions.forEach(s => {
        groups[key].hourlyQty[s.n] = 0;
        groups[key].hourlyTarget[s.n] = 0;
      });
    }

    sessions.forEach(s => {
      if (currentHour < s.gate) return; // sesi belum berjalan
      groups[key].hourlyQty[s.n] += toNum(row[`hasil_jam${s.n}`]);
      groups[key].hourlyTarget[s.n] = Math.max(groups[key].hourlyTarget[s.n], toNum(row[`xTarget${s.n}`]));
    });
  });

  // HASIL = penjumlahan hasil jam pada shift yang sedang tampil
  return Object.values(groups).map(g => ({
    ...g,
    hasil: Object.values(g.hourlyQty).reduce((sum, q) => sum + q, 0)
  }));
});

const filteredProductionData = computed(() => {
  const isShift1 = currentShift.value === 1;

  return groupedData.value.filter(item => {
    const isLineB = item.xGroup?.toUpperCase().includes("LINE B");
    const isUnderRate = item.xBConvertRate !== null && item.xBConvertRate < 50;
    const isSenior = item.xJoinMonth > 4;
    
    if (!isLineB || !isUnderRate || !isSenior) return false;

    // Sembunyikan orang lama (misal sisa data shift 1) jika nilainya 0 semua di shift aktif saat ini
    if (isShift1) {
      return (item.hourlyQty[8] > 0 || item.hourlyQty[11] > 0 || item.hourlyQty[14] > 0);
    } else {
      return (item.hourlyQty[17] > 0 || item.hourlyQty[19] > 0 || item.hourlyQty[22] > 0);
    }
  });
});

const paginatedData = computed(() => filteredProductionData.value.slice((currentPage.value - 1) * itemsPerPage.value, currentPage.value * itemsPerPage.value));
const paginatedUnder60 = computed(() => under60Data.value.slice((currentUnder60Page.value - 1) * itemsPerPage.value, currentUnder60Page.value * itemsPerPage.value));

const fetchAllData = async () => {
  try {
    // Sinkronisasi jam internal komputer setiap kali hit hitungan data baru
    currentHourRealtime.value = new Date().getHours();

    const [resD, resU, resS, resP] = await Promise.all([
      axios.get(`${API_BASE_URL}/tv-baru/target3jam-sewinglo`),
      axios.get(`${API_BASE_URL}/tv-baru/under50sewinglo`),
      axios.get(`${API_BASE_URL}/tv-baru/sewingloreport`),
      axios.get(`${API_BASE_URL}/tv-baru/sontexreport`) // Dipastikan endpoint ke-4 aman
    ]);
    
    rawData.value = resD.data.success ? resD.data.data : [];
    
    if (resU.data.success) {
      const filtered = resU.data.data.filter(x => 
        x.xGroup?.toUpperCase().includes("LINE B") && 
        x.xJoinMonth > 4 && 
        x.xTRealRate < 50
      );

      under60Data.value = filtered.sort((a, b) => {
        const groupA = (a.xGroup || '').toUpperCase();
        const groupB = (b.xGroup || '').toUpperCase();
        
        if (groupA.includes('L.O') && !groupB.includes('L.O')) return -1;
        if (!groupA.includes('L.O') && groupB.includes('L.O')) return 1;
        return groupA.localeCompare(groupB);
      });
    } else {
      under60Data.value = [];
    }
    
    if (resS.data.success) {
      summaryData.value = resS.data.data.filter(i => i.xLine === 'LINE B');
    }

    if (resP.data.success) {
      const today = new Date().toISOString().split('T')[0];
      const findPlanning = resP.data.data.find(item => {
        const itemDate = new Date(item.xDate).toISOString().split('T')[0];
        return item.kategori_gedung === 'B' && itemDate === today;
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
  await fetchAllData();
  isLoading.value = false;

  // Auto Hard Reload per 1 Jam untuk menjamin akurasi waktu komputer di browser TV
  setTimeout(() => {
    window.location.reload(true); 
  }, 60 * 60 * 1000);

  // Background interval cek jam komputer tiap 1 menit
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