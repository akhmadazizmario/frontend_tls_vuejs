<template>
  <div class="tv-wrap">

    <!-- Header TV -->
    <header class="tv-header">
      <div class="tv-title-block">
        <div class="tv-brand-row">
          <span class="tv-live-dot" :class="loading ? 'tv-dot-loading' : 'tv-dot-live'"></span>
          <span class="tv-eyebrow">PRODUCTION REPORT &bull; LIVE</span>
        </div>
        <h1 class="tv-title">Daily Output Total</h1>
      </div>

      <div class="tv-meta-block">
        <div class="tv-meta-row">
          <span class="tv-meta-label">Periode</span>
          <span class="tv-meta-value">{{ rangeLabel }}</span>
        </div>
        <div class="tv-clock">{{ liveTimeLabel }}</div>
        <div class="tv-date">{{ liveDateLabel }}</div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading && reportData.length === 0" class="tv-state">
      <div class="tv-spinner"></div>
      <div class="tv-state-text">MEMUAT DATA PRODUKSI...</div>
    </div>

    <!-- Empty -->
    <div v-else-if="reportData.length === 0" class="tv-state">
      <div class="tv-state-text">TIDAK ADA DATA UNTUK 7 HARI TERAKHIR</div>
    </div>

    <!-- Slide Content -->
    <div v-else class="tv-slide-area">

      <!-- Judul slide + progress bar durasi -->
      <div class="tv-slide-head">
        <div class="tv-slide-title-wrap">
          <span class="tv-slide-badge">{{ currentSlide.badge }}</span>
          <h2 class="tv-slide-title">{{ currentSlide.title }}</h2>
        </div>
        <div class="tv-progress-track">
          <div class="tv-progress-fill" :key="'bar-' + slideIndex" :style="{ animationDuration: currentSlide.duration + 'ms' }"></div>
        </div>
      </div>

      <transition :name="slideDirection" mode="out-in" appear @after-enter="onSlideAfterEnter">
        <section class="tv-table-section" ref="tableSectionRef" :key="slideIndex">

          <!-- ===== TABEL DATA PRODUKSI DENGAN GARIS TEGAS ===== -->
          <table class="tv-table tv-table-group">
            <colgroup>
              <col class="col-tanggal-lg" />
              <col v-for="c in currentSlide.cols" :key="'col-' + c.key" />
            </colgroup>
            <thead>
              <tr>
                <th class="tv-sticky-th tv-col-tanggal-lg">TANGGAL</th>
                <th v-for="c in currentSlide.cols" :key="c.key" :class="'tv-bg-' + c.group">
                  {{ c.label }}
                  <span class="tv-sub-label-lg">{{ c.sub }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in reportData" :key="idx" :class="{ 'tv-row-today': isToday(row.Tanggal) }">
                <td class="tv-sticky-td tv-col-tanggal-lg">
                  {{ formatDateShort(row.Tanggal) }}
                  <span v-if="isToday(row.Tanggal)" class="tv-today-badge-lg">HARI INI</span>
                </td>
                <td v-for="c in currentSlide.cols" :key="c.key" class="tv-num-lg">
                  {{ formatNum(getValue(row, c.key)) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="tv-total-row">
                <td class="tv-sticky-td tv-col-tanggal-lg">GRAND TOTAL</td>
                <td v-for="c in currentSlide.cols" :key="'t-' + c.key" class="tv-num-lg">
                  {{ formatNum(grandTotal[c.key]) }}
                </td>
              </tr>
            </tfoot>
          </table>

        </section>
      </transition>

      <!-- Dots indikator slide -->
      <div class="tv-dots">
        <span
          v-for="(s, i) in slides"
          :key="'dot-' + i"
          class="tv-dot"
          :class="{ 'tv-dot-active': i === slideIndex }"
        ></span>
      </div>
    </div>

    <!-- Footer status bar -->
    <footer class="tv-footer">
      <span class="tv-footer-item">{{ loading ? 'Menyinkronkan data...' : 'Data tersinkron' }}</span>
      <span class="tv-footer-sep">&bull;</span>
      <span class="tv-footer-item">Update terakhir {{ lastUpdatedLabel }}</span>
      <span class="tv-footer-sep">&bull;</span>
      <span class="tv-footer-item">Auto-refresh setiap {{ refreshIntervalMinutes }} menit</span>
    </footer>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const reportData = ref([]);
const loading = ref(false);
const lastUpdated = ref(null);

// AUTO REFRESH 60 MENIT
const refreshIntervalMinutes = 60;

let refreshTimer = null;
let clockTimer = null;
let slideTimer = null;

// ==== Jam & Tanggal Live ====
const now = ref(new Date());
const liveDateLabel = computed(() =>
  now.value.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
);
const liveTimeLabel = computed(() =>
  now.value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
);

// ==== Helper Tanggal ====
const formatDateToInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT_ID[d.getMonth()]}`;
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const MONTHS_FULL_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${d.getDate()} ${MONTHS_FULL_ID[d.getMonth()]} ${d.getFullYear()}`;
};

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

const computeWorkingRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { start: formatDateToInput(start), end: formatDateToInput(end) };
};

const rangeState = reactive(computeWorkingRange());
const rangeLabel = computed(() => `${formatDateShort(rangeState.start)} — ${formatDateFull(rangeState.end)}`);

const formatNum = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('id-ID');
};

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return '-';
  return lastUpdated.value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
});

// ==== Kolom Gabungan ====
// CBS gabungan = CBS + CBS_HGSK
// SOOMSONTEX gabungan = Sontex + Soomsontex + Sontexkomplit
const CBS_PARTS = ['CBS', 'CBS_HGSK'];
const SOOMSONTEX_PARTS = ['Sontex', 'Soomsontex', 'Sontexkomplit'];

// Field planning dari API diasumsikan bernama "planning" (mengikuti office lama).
// Jika di API field-nya berbeda, cukup ubah PLANNING_FIELD di bawah ini.
const PLANNING_FIELD = 'planning';

const getValue = (row, key) => {
  if (key === 'CBS_COMBINED') {
    return CBS_PARTS.reduce((sum, k) => sum + (Number(row[k]) || 0), 0);
  }
  if (key === 'SOOMSONTEX_COMBINED') {
    return SOOMSONTEX_PARTS.reduce((sum, k) => sum + (Number(row[k]) || 0), 0);
  }
  if (key === 'Planning') {
    return Number(row[PLANNING_FIELD] ?? row.Planning) || 0;
  }
  return Number(row[key]) || 0;
};

// ==== Grand Total ====
const grandTotal = computed(() => {
  const totals = {
    Planning: 0,
    Terima_qtyTLS: 0,
    Terima_LinkingQtyTLS: 0,
    Linking_Obras: 0,
    Steam: 0,
    CBS_COMBINED: 0,
    Sewing: 0,
    SOOMSONTEX_COMBINED: 0,
    QCL_LB: 0,
    Sulam: 0,
    Kirim_Qty: 0,
  };

  reportData.value.forEach(item => {
    Object.keys(totals).forEach(key => {
      totals[key] += getValue(item, key);
    });
  });

  return totals;
});

// ================== SLIDESHOW (3 SLIDE) ==================
const GROUP_SLIDE_MS = 25000;

const slides = [
  {
    type: 'group',
    badge: '1 / 3',
    title: 'Planning, Terima, Linking, LO & Steam',
    duration: GROUP_SLIDE_MS,
    cols: [
      { key: 'Planning', label: 'Planning', sub: 'Target', group: 'planning' },
      { key: 'Terima_qtyTLS', label: 'Terima', sub: 'WH A2', group: 'terima' },
      { key: 'Terima_LinkingQtyTLS', label: 'Linking', sub: 'TLS', group: 'linking' },
      { key: 'Linking_Obras', label: 'LO', sub: 'Finishing', group: 'process' },
      { key: 'Steam', label: 'Steam', sub: 'Finishing', group: 'process' },
    ],
  },
  {
    type: 'group',
    badge: '2 / 3',
    title: 'Planning, Terima, CBS, Sewing & Soomsontex',
    duration: GROUP_SLIDE_MS,
    cols: [
      { key: 'Planning', label: 'Planning', sub: 'Target', group: 'planning' },
      { key: 'Terima_LinkingQtyTLS', label: 'Linking', sub: 'TLS', group: 'linking' },
      { key: 'CBS_COMBINED', label: 'CBS', sub: 'CBS + CBS HGSK', group: 'process' },
      { key: 'Sewing', label: 'Sewing', sub: 'Finishing', group: 'process' },
      { key: 'SOOMSONTEX_COMBINED', label: 'Soomsontex', sub: 'Sontex + Soomsontex + Komplit', group: 'process' },
    ],
  },
  {
    type: 'group',
    badge: '3 / 3',
    title: 'Planning, Terima, QCL LB, Sulam & Kirim',
    duration: GROUP_SLIDE_MS,
    cols: [
      { key: 'Planning', label: 'Planning', sub: 'Target', group: 'planning' },
      { key: 'Terima_qtyTLS', label: 'Terima', sub: 'WH A2', group: 'terima' },
      { key: 'QCL_LB', label: 'QCL LB', sub: 'Finishing', group: 'process' },
      { key: 'Sulam', label: 'Sulam', sub: 'Finishing', group: 'process' },
      { key: 'Kirim_Qty', label: 'Kirim', sub: 'WH A2I', group: 'kirim' },
    ],
  },
];

const slideIndex = ref(0);
const slideDirection = ref('tv-slide-next');
const currentSlide = computed(() => slides[slideIndex.value]);

let scrollRaf = null;

const autoScrollTable = (el, totalDuration) => {
  if (!el) return;
  el.scrollTop = 0;
  const maxScroll = el.scrollHeight - el.clientHeight;
  if (maxScroll <= 2) return;

  const pause = Math.min(3000, totalDuration * 0.15);
  const scrollWindow = Math.max(totalDuration - pause * 2, 2000);
  const start = performance.now();

  const step = (ts) => {
    const elapsed = ts - start;

    if (elapsed < pause) {
      // pause
    } else if (elapsed < pause + scrollWindow) {
      const progress = (elapsed - pause) / scrollWindow;
      el.scrollTop = maxScroll * Math.min(progress, 1);
    } else {
      el.scrollTop = maxScroll;
    }

    if (elapsed < totalDuration) {
      scrollRaf = requestAnimationFrame(step);
    }
  };

  scrollRaf = requestAnimationFrame(step);
};

const onSlideAfterEnter = (el) => {
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  autoScrollTable(el, currentSlide.value.duration);
};

const scheduleNextSlide = () => {
  if (slideTimer) clearTimeout(slideTimer);
  slideTimer = setTimeout(() => {
    slideDirection.value = 'tv-slide-next';
    slideIndex.value = (slideIndex.value + 1) % slides.length;
    scheduleNextSlide();
  }, currentSlide.value.duration);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const { start, end } = computeWorkingRange();
    rangeState.start = start;
    rangeState.end = end;

    const response = await axios.get(`${API_BASE_URL}/ekspedisi/daily-output-total`, {
      params: { startDate: start, endDate: end }
    });

    if (response.data && response.data.success) {
      reportData.value = response.data.data || [];
      lastUpdated.value = new Date();
    }
  } catch (error) {
    console.error("Error fetching daily output total (TV Display):", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
  refreshTimer = setInterval(fetchData, refreshIntervalMinutes * 60 * 1000);
  clockTimer = setInterval(() => { now.value = new Date(); }, 1000);
  scheduleNextSlide();
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  if (clockTimer) clearInterval(clockTimer);
  if (slideTimer) clearTimeout(slideTimer);
});
</script>

<style scoped>
/*
  ======================================================================
  CATATAN KONTRAS UNTUK RUANGAN ATAP & TEMBOK PUTIH + LAMPU DI ATAS TV:
  - Background dibuat HITAM PEKAT (bukan abu gelap) supaya tidak
    memantulkan cahaya lampu/tembok putih ke layar (mengurangi silau/glare).
  - Semua angka pakai warna KUNING terang (#facc15) khas rambu industri,
    karena kuning di atas hitam adalah kombinasi kontras tertinggi yang
    paling gampang dibaca dari jarak jauh & di ruangan terang.
  - Font di-scale pakai satuan VH (tinggi layar), bukan VW, meniru
    "office lama" (7vh utk angka) — jadi ukuran huruf tetap besar &
    konsisten walau lebar TV berbeda-beda.
  - Border putih tebal (mirip office lama border-6/border-end-4) supaya
    batas antar sel tetap terlihat jelas walau ada pantulan cahaya.
  ======================================================================
*/
* { box-sizing: border-box; }

.tv-wrap {
  width: 100vw;
  height: 100vh;
  background: #000000; /* hitam pekat, anti-silau */
  color: #ffffff;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
  padding: 1.5vh 1.5vw 1vh;
}

/* ===== Header ===== */
.tv-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 1.2vh;
  margin-bottom: 1vh;
  border-bottom: 4px solid #ffffff;
  flex-shrink: 0;
}

.tv-brand-row {
  display: flex;
  align-items: center;
  gap: 0.6vw;
  margin-bottom: 0.6vh;
}

.tv-live-dot {
  width: 1.6vh;
  height: 1.6vh;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.tv-dot-live {
  background: #22c55e;
  box-shadow: 0 0 14px #22c55e;
  animation: tv-pulse 2s ease-in-out infinite;
}
.tv-dot-loading {
  background: #fbbf24;
  animation: tv-pulse 0.8s ease-in-out infinite;
}

@keyframes tv-pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.tv-eyebrow {
  font-size: 2vh;
  font-weight: 900;
  letter-spacing: 0.2em;
  color: #38bdf8;
}

.tv-title {
  font-size: 5vh;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: #ffffff;
  line-height: 1.1;
  margin: 0;
  text-transform: uppercase;
}

.tv-meta-block {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3vh;
}

.tv-meta-row {
  display: flex;
  align-items: baseline;
  gap: 0.6vw;
}

.tv-meta-label {
  font-size: 1.8vh;
  color: #cbd5e1;
  font-weight: 800;
  text-transform: uppercase;
}

.tv-meta-value {
  font-size: 2.2vh;
  color: #ffffff;
  font-weight: 900;
}

.tv-clock {
  font-size: 4vh;
  font-weight: 900;
  color: #facc15;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.tv-date {
  font-size: 1.8vh;
  color: #e2e8f0;
  font-weight: 700;
  text-transform: uppercase;
}

/* ===== State Loading & Empty ===== */
.tv-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2vh;
}
.tv-state-text {
  font-size: 3.5vh;
  font-weight: 900;
  color: #facc15;
}

/* ===== Area Slide ===== */
.tv-slide-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tv-slide-head {
  display: flex;
  align-items: center;
  gap: 1.2vw;
  margin-bottom: 1vh;
  flex-shrink: 0;
}

.tv-slide-title-wrap {
  display: flex;
  align-items: center;
  gap: 1vw;
  flex-shrink: 0;
}

.tv-slide-badge {
  font-size: 2vh;
  font-weight: 900;
  color: #000000;
  background: #facc15;
  padding: 0.6vh 1.2vw;
  border-radius: 4px;
}

.tv-slide-title {
  font-size: 3vh;
  font-weight: 900;
  color: #ffffff;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tv-progress-track {
  flex: 1;
  height: 1vh;
  background: #262626;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid #525252;
}

.tv-progress-fill {
  height: 100%;
  background: #facc15;
  animation: tv-progress linear forwards;
}

@keyframes tv-progress {
  from { width: 0%; }
  to { width: 100%; }
}

/* ===== Table Section (Kotak & Tegas) ===== */
.tv-table-section {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 10px;
  border: 5px solid #ffffff; /* border putih tebal, mirip office lama */
  background: #000000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9);
  min-height: 0;
  scrollbar-width: none;
}
.tv-table-section::-webkit-scrollbar {
  display: none;
}

.tv-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  height: 100%;
}

.tv-slide-next-enter-active,
.tv-slide-next-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.tv-slide-next-enter-from { opacity: 0; transform: translateX(2vw); }
.tv-slide-next-leave-to { opacity: 0; transform: translateX(-2vw); }

/* ===================================================== */
/* STYLING TABEL INDUSTRIAL (SOLID BORDERS, FONT BESAR)   */
/* ===================================================== */
.tv-table-group th, .tv-table-group td {
  border: 3px solid #ffffff; /* garis putih tegas antar sel, mudah dilihat dari jauh */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-tanggal-lg { width: 16%; }

/* Header Tabel */
.tv-table-group thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  text-align: center;
  padding: 1.6vh 1vw;
  font-size: 2.6vh; /* setara .header-text 3vh di office lama */
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 4px solid #ffffff;
}

/* Sticky Class khusus TH dan TD karena border-collapse */
.tv-sticky-th {
  z-index: 15 !important;
  left: 0;
  background: #000000;
  color: #ffffff;
}
.tv-sticky-td {
  position: sticky;
  left: 0;
  z-index: 5;
  background: #000000;
  font-weight: 900;
  color: #ffffff;
}

.tv-sub-label-lg {
  display: block;
  font-size: 1.4vh;
  font-weight: 700;
  opacity: 0.95;
  margin-top: 0.4vh;
}

.tv-col-tanggal-lg {
  text-align: left !important;
  padding-left: 1.5vw !important;
}

/* Isi Sel Tabel (Angka) - font raksasa & kuning agar kontras tinggi */
.tv-table-group tbody td,
.tv-table-group tfoot td {
  text-align: center;
  padding: 1.6vh 1vw;
  font-size: 6vh; /* setara .text-val 7vh di office lama, disesuaikan agar muat 6 kolom */
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: #facc15; /* kuning terang: kontras tertinggi di atas hitam, tahan silau lampu */
  background: #000000;
  letter-spacing: -1px;
}

.tv-table-group tbody .tv-col-tanggal-lg {
  font-size: 6vh;
  color: #ffffff;
}

.tv-today-badge-lg {
  display: inline-block;
  font-size: 1.4vh;
  color: #000000;
  background: #ef4444;
  font-weight: 900;
  padding: 0.3vh 0.8vw;
  border-radius: 4px;
  margin-left: 0.6vw;
  vertical-align: middle;
  letter-spacing: 0.04em;
}

/* Zebra Striping tetap kontras tinggi */
.tv-table-group tbody tr:nth-child(even) td { background: #171717; }

/* Highlight khusus baris Hari Ini */
.tv-table-group tbody tr.tv-row-today td {
  background: #1d4ed8 !important;
  color: #ffffff !important;
}
.tv-table-group tbody tr.tv-row-today .tv-col-tanggal-lg { color: #ffffff !important; }

/* Tfoot (Grand Total) */
.tv-table-group tfoot td {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: #000000 !important;
  font-size: 6.5vh;
  font-weight: 900;
  color: #ffffff !important; /* grand total putih agar beda dari data harian (kuning) */
  border-top: 5px solid #facc15;
}
.tv-table-group tfoot .tv-col-tanggal-lg {
  font-size: 2.6vh;
  z-index: 15 !important;
  color: #ffffff;
}

/* Warna Header per Proses - kontras tegas, huruf putih di atas warna solid */
.tv-bg-planning { background: #581c87; color: #ffffff; box-shadow: inset 0 -5px 0 0 #c084fc; }
.tv-bg-terima { background: #0c4a6e; color: #ffffff; box-shadow: inset 0 -5px 0 0 #38bdf8; }
.tv-bg-linking { background: #1e3a8a; color: #ffffff; box-shadow: inset 0 -5px 0 0 #60a5fa; }
.tv-bg-process { background: #7c2d12; color: #ffffff; box-shadow: inset 0 -5px 0 0 #fb923c; }
.tv-bg-kirim { background: #064e3b; color: #ffffff; box-shadow: inset 0 -5px 0 0 #34d399; }

/* Dots indicator */
.tv-dots {
  display: flex;
  justify-content: center;
  gap: 0.8vw;
  padding: 1.2vh 0 0.5vh;
}
.tv-dot {
  width: 1.2vh;
  height: 1.2vh;
  border-radius: 50%;
  background: #525252;
  transition: all 0.3s ease;
}
.tv-dot-active {
  background: #facc15;
  transform: scale(1.5);
}

/* ===== Footer ===== */
.tv-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1vw;
  font-size: 1.6vh;
  color: #e2e8f0;
  padding-top: 0.8vh;
  margin-top: 0.5vh;
  flex-shrink: 0;
  border-top: 2px solid #ffffff;
  text-transform: uppercase;
  font-weight: 800;
}

.tv-footer-item { color: #e2e8f0; }
.tv-footer-sep { color: #737373; }
</style>