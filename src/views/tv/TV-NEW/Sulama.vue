<template>
  <div id="app">
    <header>
      <div class="brand">
        <div class="logoBox">FIN</div>
        <div class="titleBlock">
          <h1>Laporan Finishing Harian</h1>
          <div class="subtitle">Real-time Production Monitor</div>
        </div>
      </div>
      <div class="headerRight">
        <div class="shiftBadge" :class="shiftClass">{{ shiftLabel }}</div>
        <div class="clockBox">
          <div class="time">{{ clockTime }}</div>
          <div class="date">{{ clockDate }}</div>
        </div>
      </div>
    </header>

    <div class="gedungBar">
      <div class="gedungTab active">GEDUNG {{ gedung }}</div>
      <div class="rowCount" v-if="filteredRows.length">{{ markCount }} Style Produksi</div>
    </div>

    <main>
      <div class="tableWrap">
        <div v-if="fetchFailed && rows.length === 0" class="errBox">
          <div class="errIcon">!</div>
          <div>GAGAL MENGAMBIL DATA DARI SERVER</div>
          <span class="errUrl">{{ endpoint }}</span>
        </div>

        <div v-else-if="filteredRows.length === 0" class="empty">
          BELUM ADA DATA FINISHING UNTUK GEDUNG {{ gedung }} HARI INI
        </div>

        <template v-else>
          <table class="headTable">
            <colgroup>
              <col style="width: 12%" />
              <col style="width: 9%" />
              <col style="width: 15%" />
              <col style="width: 22%" />
              <col style="width: 10%" />
              <col style="width: 10.67%" />
              <col style="width: 10.66%" />
              <col style="width: 10.67%" />
            </colgroup>
            <thead>
              <tr>
                <th>Style</th>
                <th>Gedung</th>
                <th>Pekerjaan</th>
                <th>Team</th>
                <th>Qty Plan</th>
                <th>{{ activeJamColumns[0].label }}</th>
                <th>{{ activeJamColumns[1].label }}</th>
                <th>{{ activeJamColumns[2].label }}</th>
              </tr>
            </thead>
          </table>

          <div class="scrollViewport" ref="scrollViewport">
            <table class="bodyTable">
              <colgroup>
                <col style="width: 12%" />
                <col style="width: 9%" />
                <col style="width: 15%" />
                <col style="width: 22%" />
                <col style="width: 10%" />
                <col style="width: 10.67%" />
                <col style="width: 10.66%" />
                <col style="width: 10.67%" />
              </colgroup>
              <tbody>
                <tr
                  v-for="(row, idx) in displayRows"
                  :key="idx"
                  :class="{ 'group-first': row._isFirst }"
                >
                  <td v-if="row._isFirst" class="xmark" :rowspan="row._span">
                    {{ row.xMark || '-' }}
                  </td>
                  <td v-if="row._isFirst" class="gedung" :rowspan="row._span">
                    {{ row.Gedung || '-' }}
                  </td>
                  <td
                    class="pekerjaan"
                    :class="{
                      sulam: row.Pekerjaan === 'SULAM',
                      qc: row.Pekerjaan === 'QC LAMPU',
                    }"
                  >
                    {{ row.Pekerjaan || '-' }}
                  </td>
                  <td class="team">{{ row.Nama_Team || '-' }}</td>
                  <td class="plan">{{ formatNum(row.Qty_Plan_Total) }}</td>
                  <td
                    v-for="col in activeJamColumns"
                    :key="col.key"
                    class="jam"
                    :class="Number(row[col.key] || 0) > 0 ? 'hasQty' : 'zero'"
                  >
                    {{ Number(row[col.key] || 0) > 0 ? formatNum(row[col.key]) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </main>

    <footer>
      <div class="legend">
        <span><i class="dotGreen"></i> Sudah Ada Qty</span>
        <span><i class="dotGray"></i> Belum Ada</span>
        <span class="lastUpdateLabel">Update terakhir: <b>{{ lastUpdate }}</b></span>
      </div>
      <div class="refreshInfo">Refresh data otomatis setiap 1 jam</div>
    </footer>
  </div>
</template>

<script>
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  process.env.VUE_APP_API_BASE_URL ||
  '';

const REFRESH_DATA_MS = 60 * 60 * 1000; // refresh data tiap 1 jam
const SCROLL_DURATION_MS = 90000; // waktu tempuh bergerak dari atas ke bawah (45 detik)
const SCROLL_PAUSE_MS = 7000; // jeda 5 detik di paling atas & paling bawah

const JAM_COLUMNS = [
  { key: 'Jam_07_59', label: 's/d 08:00', hour: 8 },
  { key: 'Jam_10_59', label: 's/d 11:00', hour: 11 },
  { key: 'Jam_13_59', label: 's/d 14:00', hour: 14 },
  { key: 'Jam_15_59', label: 's/d 16:00', hour: 16 },
  { key: 'Jam_18_59', label: 's/d 19:00', hour: 19 },
  { key: 'Jam_22_30', label: 's/d 22:30', hour: 22.5 },
];

export default {
  name: 'TvFinishingGedungA',
  data() {
    return {
      gedung: 'A',
      endpoint: `${API_BASE_URL.replace(/\/$/, '')}/tv-finishing/tv-d`,
      rows: [],
      fetchFailed: false,
      lastUpdate: '-',
      clockTime: '--:--:--',
      clockDate: '-',
      shiftLabel: 'SHIFT 1',
      shiftClass: 'shift1',
      now: new Date(),
      _dataTimer: null,
      _clockTimer: null,
      _animFrameId: null,
      _scrollDir: 1, // 1 = bergerak ke bawah, -1 = bergerak ke atas
      _startTime: null,
      _startScrollTop: 0,
      _pausedUntil: 0,
    };
  },
  computed: {
    filteredRows() {
      return this.rows.filter((r) => (r.Gedung || '-') === this.gedung);
    },
    scrollRows() {
      return this.filteredRows;
    },
    // Menyiapkan data untuk ditampilkan dengan kolom Style & Gedung digabung (rowspan)
    // untuk setiap xMark yang punya lebih dari satu baris pekerjaan (mis. SULAM + QC LAMPU).
    displayRows() {
      const rows = this.filteredRows;
      const spanCount = {};
      rows.forEach((r) => {
        spanCount[r.xMark] = (spanCount[r.xMark] || 0) + 1;
      });

      const seen = {};
      return rows.map((r) => {
        const isFirst = !seen[r.xMark];
        seen[r.xMark] = true;
        return {
          ...r,
          _isFirst: isFirst,
          _span: spanCount[r.xMark],
        };
      });
    },
    markCount() {
      return new Set(this.filteredRows.map((r) => r.xMark)).size;
    },
    activeJamColumns() {
      const hour = this.now.getHours() + this.now.getMinutes() / 60;

      let passedIdx = -1;
      JAM_COLUMNS.forEach((c, i) => {
        if (hour >= c.hour) passedIdx = i;
      });

      let startIdx = 0;
      if (passedIdx >= 2) {
        startIdx = Math.min(passedIdx - 1, JAM_COLUMNS.length - 3);
      }
      startIdx = Math.max(0, startIdx);

      return JAM_COLUMNS.slice(startIdx, startIdx + 3);
    },
  },
  watch: {
    filteredRows: {
      handler() {
        this.$nextTick(() => {
          this.startAutoScroll();
        });
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    formatNum(v) {
      return Number(v || 0).toLocaleString('id-ID');
    },
    async fetchData() {
      try {
        const res = await fetch(this.endpoint, { cache: 'no-store' });
        const json = await res.json();
        if (!json.status) throw new Error(json.message || 'Gagal mengambil data');
        this.rows = json.data || [];
        this.fetchFailed = false;
        this.lastUpdate = new Date().toLocaleTimeString('id-ID');
      } catch (err) {
        console.error('Fetch error:', err);
        this.fetchFailed = true;
      }
    },
    updateClock() {
      this.now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      this.clockTime = `${pad(this.now.getHours())}:${pad(this.now.getMinutes())}:${pad(
        this.now.getSeconds()
      )}`;
      const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const bulanList = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
      ];
      this.clockDate = `${hariList[this.now.getDay()]}, ${this.now.getDate()} ${
        bulanList[this.now.getMonth()]
      } ${this.now.getFullYear()}`;

      const hour = this.now.getHours() + this.now.getMinutes() / 60;
      const isShift1 = hour >= 7 && hour < 14;
      this.shiftLabel = isShift1 ? 'SHIFT 1' : 'SHIFT 2';
      this.shiftClass = isShift1 ? 'shift1' : 'shift2';
    },
    startAutoScroll() {
      this.stopAutoScroll();

      const el = this.$refs.scrollViewport;
      if (el) {
        el.scrollTop = 0; // Kembalikan posisi ke atas
      }

      this._scrollDir = 1;
      this._startTime = null;
      // Memberi jeda 5 detik saat pertama kali halaman terbuka / data dimuat
      this._pausedUntil = performance.now() + SCROLL_PAUSE_MS;

      const step = (timestamp) => {
        const viewportEl = this.$refs.scrollViewport;

        if (!viewportEl) {
          this._animFrameId = requestAnimationFrame(step);
          return;
        }

        const maxScroll = viewportEl.scrollHeight - viewportEl.clientHeight;

        // Jika data sedikit dan muat di layar, tidak perlu scroll
        if (maxScroll <= 0) {
          this._startTime = null;
          this._animFrameId = requestAnimationFrame(step);
          return;
        }

        // Cek apakah masih dalam masa jeda 5 detik (di posisi atas atau bawah)
        if (timestamp < this._pausedUntil) {
          this._startTime = null;
          this._animFrameId = requestAnimationFrame(step);
          return;
        }

        if (!this._startTime) {
          this._startTime = timestamp;
          this._startScrollTop = viewportEl.scrollTop;
        }

        const elapsed = timestamp - this._startTime;
        const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1);

        if (this._scrollDir === 1) {
          // Bergerak perlahan ke bawah
          viewportEl.scrollTop = this._startScrollTop + (maxScroll - this._startScrollTop) * progress;
        } else {
          // Bergerak perlahan ke atas
          viewportEl.scrollTop = this._startScrollTop * (1 - progress);
        }

        // Ketika pergerakan mencapai ujung (bawah atau atas)
        if (progress >= 1) {
          this._pausedUntil = timestamp + SCROLL_PAUSE_MS; // Jeda 5 detik
          this._scrollDir = this._scrollDir === 1 ? -1 : 1; // Balik arah
          this._startTime = null;
        }

        this._animFrameId = requestAnimationFrame(step);
      };

      this._animFrameId = requestAnimationFrame(step);
    },
    stopAutoScroll() {
      if (this._animFrameId) {
        cancelAnimationFrame(this._animFrameId);
        this._animFrameId = null;
      }
    },
  },
  mounted() {
    this.updateClock();
    this.fetchData();
    this._clockTimer = setInterval(this.updateClock, 1000);
    this._dataTimer = setInterval(this.fetchData, REFRESH_DATA_MS);
  },
  beforeUnmount() {
    clearInterval(this._clockTimer);
    clearInterval(this._dataTimer);
    this.stopAutoScroll();
  },
};
</script>

<style scoped>
#app {
  --bg: #eef1f5;
  --panel: #ffffff;
  --header-bg: #ffffff;
  --navy: #0b3d66;
  --navy-dark: #062a49;
  --blue: #1f6fb2;
  --line: #d7dee6;
  --line-strong: #b9c4d0;
  --ink: #10233a;
  --ink-soft: #3d5266;
  --green-bg: #e5f6ec;
  --green: #157a3d;
  --amber-bg: #fdf3e3;
  --amber: #9a6400;
  --red: #b3261e;
  --red-bg: #fbe9e7;
  --row-alt: #f5f8fb;

  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Segoe UI', 'Arial', 'Helvetica Neue', sans-serif;
  overflow: hidden;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 28px;
  background: var(--header-bg);
  border-bottom: 4px solid var(--navy);
  flex: 0 0 auto;
}
.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.logoBox {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--navy);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
}
.titleBlock h1 {
  font-size: 23px;
  font-weight: 800;
  color: var(--navy-dark);
  letter-spacing: 0.3px;
  line-height: 1.15;
}
.subtitle {
  font-size: 13px;
  color: var(--ink-soft);
  letter-spacing: 0.5px;
  font-weight: 700;
}
.headerRight {
  display: flex;
  align-items: center;
  gap: 20px;
}
.clockBox {
  text-align: right;
}
.clockBox .time {
  font-size: 30px;
  font-weight: 800;
  color: var(--navy-dark);
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.clockBox .date {
  font-size: 13px;
  color: var(--ink-soft);
  letter-spacing: 0.3px;
  margin-top: 3px;
  font-weight: 700;
}
.shiftBadge {
  padding: 9px 20px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: 1px;
  border: 2px solid transparent;
}
.shiftBadge.shift1 {
  background: var(--green-bg);
  color: var(--green);
  border-color: var(--green);
}
.shiftBadge.shift2 {
  background: #eaf1fb;
  color: var(--blue);
  border-color: var(--blue);
}

.gedungBar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 28px 0 28px;
  flex: 0 0 auto;
}
.gedungTab {
  padding: 9px 32px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1.5px;
  border-radius: 8px 8px 0 0;
  color: #fff;
  background: var(--navy);
}
.rowCount {
  font-size: 15px;
  color: var(--ink-soft);
  font-weight: 700;
}

main {
  flex: 1 1 auto;
  padding: 0 28px 10px 28px;
  overflow: hidden;
  display: flex;
  min-height: 0;
}
.tableWrap {
  width: 100%;
  border: 3px solid var(--navy);
  border-radius: 0 12px 12px 12px;
  overflow: hidden;
  background: var(--panel);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.headTable thead th {
  background: var(--navy);
  color: #ffffff;
  font-size: 25px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 16px 10px;
  text-align: center;
  font-weight: 800;
}

.scrollViewport {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
}
.scrollViewport::-webkit-scrollbar {
  display: none;
}

.bodyTable tbody tr.group-first td {
  border-top: 3px solid var(--line-strong);
}
.bodyTable tbody tr:nth-child(even) {
  background: var(--row-alt);
}
.bodyTable tbody td {
  padding: 24px 12px;
  text-align: center;
  font-size: 37px;
  border-bottom: 1px solid var(--line);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: var(--ink);
}
td.xmark {
  font-size: 50px;
  font-weight: 800;
  color: var(--navy-dark);
  letter-spacing: 0.5px;
  vertical-align: middle;
  background: #f7fafc;
}
td.gedung {
  color: var(--ink-soft);
  font-size: 32px;
  font-weight: 800;
  vertical-align: middle;
  background: #f7fafc;
}
td.pekerjaan {
  font-weight: 800;
  letter-spacing: 0.5px;
  font-size: 32px;
}
td.pekerjaan.sulam {
  color: #0b5fa5;
}
td.pekerjaan.qc {
  color: #b2650a;
}
td.team {
  font-size: 29px;
  color: var(--ink-soft);
  font-weight: 700;
}
td.plan {
  color: var(--ink-soft);
  font-size: 34px;
  font-weight: 800;
}
td.jam {
  font-weight: 800;
  font-size: 41px;
}
td.jam.zero {
  color: #9aa7b3;
  font-weight: 700;
}
td.jam.hasQty {
  color: var(--green);
}

footer {
  flex: 0 0 auto;
  padding: 6px 28px 10px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: var(--ink-soft);
  font-weight: 700;
}
.legend {
  display: flex;
  gap: 22px;
  align-items: center;
}
.legend span {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dotGreen,
.dotGray {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}
.dotGreen {
  background: var(--green);
}
.dotGray {
  background: #9aa7b3;
}
.lastUpdateLabel b {
  color: var(--navy-dark);
}
.refreshInfo {
  font-weight: 600;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: var(--ink-soft);
  letter-spacing: 1px;
  font-weight: 700;
  text-align: center;
  padding: 40px;
}
.errBox {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--red);
  font-size: 26px;
  font-weight: 700;
  gap: 14px;
  text-align: center;
  padding: 0 46px;
}
.errIcon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--red-bg);
  color: var(--red);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: 800;
  border: 3px solid var(--red);
}
.errUrl {
  font-size: 17px;
  color: var(--ink-soft);
  font-weight: 500;
}
</style>