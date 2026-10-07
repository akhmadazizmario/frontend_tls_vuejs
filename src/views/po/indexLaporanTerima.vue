<template>
  <div class="report-root">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="report-body">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['report-main', { 'content-shifted': sidebarOpen }]">
        <div class="page-head">
          <div class="page-icon"><i class="bi bi-box-seam"></i></div>
          <div>
            <h1 class="page-title">Laporan Bahan Terima</h1>
            <p class="page-sub">Kebutuhan bahan per bulan berdasarkan jadwal delivery PO (Detail per Warna)</p>
          </div>
        </div>

        <section class="panel filter-bar">
          <div class="field">
            <label>Tanggal terima dari</label>
            <input type="date" v-model="filter.beginDate" class="form-control form-control-sm" />
          </div>
          <div class="field">
            <label>Tanggal terima sampai</label>
            <input type="date" v-model="filter.endDate" class="form-control form-control-sm" />
          </div>
          <div class="field">
            <label>Delivery dari bulan</label>
            <input type="month" v-model="filter.edateFrom" class="form-control form-control-sm" />
          </div>
          <div class="field">
            <label>Delivery sampai bulan</label>
            <input type="month" v-model="filter.edateTo" class="form-control form-control-sm" />
          </div>
          <div class="field field-action">
            <button class="btn btn-primary btn-sm px-3" @click="fetchReport" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-search me-2"></i>Tampilkan
            </button>
            <button class="btn btn-light btn-sm border" @click="resetMonthWindow"
              title="Kembalikan delivery ke bulan lalu sampai bulan depan" aria-label="Reset bulan delivery">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </section>

        <section v-if="isDataLoaded" class="panel table-panel">
          <div class="table-toolbar">
            <div class="chips">
              <span class="chip">Style <b>{{ num(stats.styles) }}</b></span>
              <span class="chip">Baris PO <b>{{ num(stats.poRows) }}</b></span>
              <span class="chip">Total qty PO <b>{{ num(stats.qty) }}</b></span>
              <span class="legend"><i class="dot dot-short"></i>kurang <i class="dot dot-ok"></i>cukup</span>
            </div>
            <div class="actions">
              <button v-if="hasColFilter" class="btn btn-sm btn-light border" @click="clearColFilters">
                <i class="bi bi-funnel me-1"></i>Hapus filter kolom
              </button>
              <button class="btn btn-sm btn-success" @click="exportToExcel">
                <i class="bi bi-file-earmark-excel me-1"></i>Excel
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="exportToPDF">
                <i class="bi bi-file-earmark-pdf me-1"></i>PDF
              </button>
            </div>
          </div>

          <div class="table-scroll" @scroll.passive="closePop">
            <table class="rt" :style="tableStyle">
              <colgroup>
                <col style="width: 190px" />
                <col style="width: 130px" />
                <col style="width: 100px" />
                <col style="width: 90px" />
                <col style="width: 70px" />
                <col style="width: 110px" />
                <col style="width: 90px" />
                <col style="width: 120px" />
                <template v-for="mk in monthKeys" :key="mk">
                  <col style="width: 90px" /><col style="width: 110px" />
                </template>
                <col style="width: 150px" />
              </colgroup>

              <thead>
                <tr class="hr1">
                  <th :rowspan="headRows" class="sticky-col">
                    Style
                    <button class="filter-btn" :class="{ active: fcount('style') }" @click.stop="openPop('style', $event)"
                      aria-label="Filter Style"><i class="bi bi-funnel-fill"></i></button>
                  </th>
                  <th :rowspan="headRows">
                    Warna
                    <button class="filter-btn" :class="{ active: fcount('warna') }" @click.stop="openPop('warna', $event)"
                      aria-label="Filter Warna"><i class="bi bi-funnel-fill"></i></button>
                  </th>
                  <th :rowspan="headRows">
                    Total Qty
                    <button class="filter-btn" :class="{ active: fcount('total_qty') }" @click.stop="openPop('total_qty', $event)"
                      aria-label="Filter Total Qty"><i class="bi bi-funnel-fill"></i></button>
                  </th>
                  <th :rowspan="headRows">
                    Terima
                    <button class="filter-btn" :class="{ active: fcount('terima') }" @click.stop="openPop('terima', $event)"
                      aria-label="Filter Terima"><i class="bi bi-funnel-fill"></i></button>
                  </th>
                  <th :rowspan="headRows">
                    PO
                    <button class="filter-btn" :class="{ active: fcount('po') }" @click.stop="openPop('po', $event)"
                      aria-label="Filter PO"><i class="bi bi-funnel-fill"></i></button>
                  </th>
                  <th :rowspan="headRows">
                    Delivery
                    <button class="filter-btn" :class="{ active: fcount('delivery') }" @click.stop="openPop('delivery', $event)"
                      aria-label="Filter Delivery"><i class="bi bi-funnel-fill"></i></button>
                  </th>
                  <th :rowspan="headRows">
                    Qty
                    <button class="filter-btn" :class="{ active: fcount('qty') }" @click.stop="openPop('qty', $event)"
                      aria-label="Filter Qty"><i class="bi bi-funnel-fill"></i></button>
                  </th>
                  <th :rowspan="headRows">
                    Planning Date
                    <button class="filter-btn" :class="{ active: fcount('plan') }" @click.stop="openPop('plan', $event)"
                      aria-label="Filter Planning Date"><i class="bi bi-funnel-fill"></i></button>
                  </th>
                  <th v-if="monthKeys.length" :colspan="monthKeys.length * 2">Kebutuhan per bulan</th>
                  <th :rowspan="headRows">Perlengkapan</th>
                </tr>
                <tr v-if="monthKeys.length" class="hr2">
                  <th v-for="mk in monthKeys" :key="mk" colspan="2">{{ monthLabel(mk) }}</th>
                </tr>
                <tr v-if="monthKeys.length" class="hr3">
                  <template v-for="mk in monthKeys" :key="mk">
                    <th>Qty</th>
                    <th>Qty − Terima</th>
                  </template>
                </tr>
              </thead>

              <tbody>
                <template v-for="g in groups" :key="g.key">
                  <tr v-for="(ln, i) in g.lines" :key="g.key + '-' + i"
                    :class="[g.idx % 2 ? 'g-b' : 'g-a', { 'b-last': ln.lastOfBlock, 'g-last': i === g.lines.length - 1 }]">
                    
                    <template v-if="ln.firstOfStyle">
                      <td :rowspan="g.styleSpan" class="sticky-col span-cell">
                        <div class="style-main">{{ g.idp_tls }}</div>
                        <div class="style-sub" title="Original Combinations">{{ g.xPO_Full }}</div>
                      </td>
                    </template>

                    <template v-if="ln.firstOfGroup">
                      <td :rowspan="g.span" class="span-cell">{{ g.xMColor }}</td>
                      <td :rowspan="g.span" class="num span-cell">{{ num(g.total1) }}</td>
                      <td :rowspan="g.span" class="num span-cell">{{ num(g.total2) }}</td>
                    </template>

                    <td v-if="ln.firstOfBlock" :rowspan="ln.blockSpan" class="ctr blk-cell"
                      :class="{ empty: ln.xTimes == null, 'span-cell': ln.lastBlock }">{{ ln.xTimes ?? '' }}</td>
                    <td class="ctr" :class="{ empty: !ln.xFtyDate }">{{ fmtDate(ln.xFtyDate) }}</td>
                    <td class="num" :class="{ empty: ln.qty == null }">{{ num(ln.qty) }}</td>
                    <td class="ctr" :class="{ empty: !ln.planDate }">{{ fmtDate(ln.planDate) }}</td>

                    <template v-if="ln.firstOfBlock">
                      <template v-for="mk in monthKeys" :key="mk">
                        <td :rowspan="ln.blockSpan" class="num blk-cell" :class="{ 'span-cell': ln.lastBlock }">
                          {{ ln.block.months[mk] != null ? num(ln.block.months[mk]) : '' }}
                        </td>
                        <td :rowspan="ln.blockSpan" class="num blk-cell" :class="{ 'span-cell': ln.lastBlock }">
                          <span v-if="ln.block.months[mk] != null" class="pill"
                            :class="ln.block.months[mk] - g.total2 > 0 ? 'pill-short' : 'pill-ok'">
                            {{ num(ln.block.months[mk] - g.total2) }}
                          </span>
                        </td>
                      </template>
                    </template>

                    <td v-if="ln.firstOfGroup" :rowspan="g.span" class="ctr span-cell">{{ accText(g) }}</td>
                  </tr>
                </template>

                <tr v-if="!groups.length">
                  <td :colspan="9 + monthKeys.length * 2" class="no-data">
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="loading" class="loading-overlay">
            <div class="spinner-border text-primary"></div>
          </div>
        </section>

        <section v-else class="panel empty-state">
          <i class="bi bi-table"></i>
          <p>Atur tanggal terima dan rentang bulan delivery, lalu klik <b>Tampilkan</b>.</p>
        </section>
      </main>
    </div>

    <!-- Popover filter kolom -->
    <Teleport to="body">
      <div v-if="pop.open" class="filter-pop" :style="{ top: pop.top + 'px', left: pop.left + 'px' }" @mousedown.stop>
        <div class="pop-title">{{ popLabel }}</div>
        <input ref="popInput" v-model="popSearch" type="text" class="form-control form-control-sm"
          placeholder="Cari..." @keydown.esc="closePop" />
        <div class="pop-actions">
          <button class="link-btn" @click="selectVisible">Pilih semua</button>
          <button class="link-btn" @click="clearCurrent">Hapus pilihan</button>
        </div>
        <div class="pop-list">
          <label v-for="v in popOptions" :key="pop.key + '-' + v" class="pop-item">
            <input type="checkbox" v-model="colFilters[pop.key]" :value="v" />
            <span>{{ optionLabel(pop.key, v) }}</span>
          </label>
          <div v-if="!popOptions.length" class="pop-empty">Tidak ditemukan</div>
        </div>
        <div class="pop-foot">{{ colFilters[pop.key].length }} dipilih dari {{ allOptions[pop.key].length }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- STATE ---
const user = ref({});
const sidebarOpen = ref(false);
const loading = ref(false);
const isDataLoaded = ref(false);
const rows = ref([]);

const pad = (n) => String(n).padStart(2, "0");
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const shiftMonth = (n) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const filter = ref({
  beginDate: localToday(),
  endDate: localToday(),
  edateFrom: shiftMonth(-1),
  edateTo: shiftMonth(1),
});
const resetMonthWindow = () => {
  filter.value.edateFrom = shiftMonth(-1);
  filter.value.edateTo = shiftMonth(1);
};

// --- HELPER ---
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const ymd = (v) => (v ? String(v).slice(0, 10) : null);
const addDays = (s, n) => {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const BLN = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
const fmtDate = (s) => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d} ${BLN[Number(m) - 1]} ${y.slice(2)}`;
};

const monthLabel = (mk) => {
  const [y, m] = mk.split("-");
  return `${BULAN[Number(m) - 1]} ${y}`;
};

const num = (v) => (v == null || v === "" ? "" : Number(v).toLocaleString("id-ID"));

// --- FILTER KOLOM ---
const FILTER_LABEL = { 
  style: "Style", 
  warna: "Warna", 
  total_qty: "Total Qty", 
  terima: "Terima", 
  po: "PO", 
  delivery: "Delivery", 
  qty: "Qty", 
  plan: "Planning Date" 
};
const colFilters = reactive({ style: [], warna: [], total_qty: [], terima: [], po: [], delivery: [], qty: [], plan: [] });
const fcount = (k) => colFilters[k].length > 0;
const hasColFilter = computed(() => Object.keys(colFilters).some(fcount));
const clearColFilters = () => Object.keys(colFilters).forEach((k) => (colFilters[k] = []));

const allOptions = computed(() => {
  const s = { style: new Set(), warna: new Set(), total_qty: new Set(), terima: new Set(), po: new Set(), delivery: new Set(), qty: new Set(), plan: new Set() };
  for (const r of rows.value) {
    const d = ymd(r.xFtyDate) || "";
    const p = d ? addDays(d, -7) : "";
    s.style.add(String(r.idp_tls ?? ""));
    s.warna.add(String(r.xMColor ?? ""));
    s.total_qty.add(String(r.xTotal_1 ?? 0));
    s.terima.add(String(r.xTotal_2 ?? 0));
    s.po.add(r.xTimes == null ? "" : String(r.xTimes));
    s.delivery.add(d);
    s.qty.add(r.xShipTot == null ? "" : String(r.xShipTot));
    s.plan.add(p);
  }
  const cmp = (a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, undefined, { numeric: true }));
  const out = {};
  for (const k of Object.keys(s)) out[k] = [...s[k]].sort(cmp);
  return out;
});

const optionLabel = (key, v) => {
  if (v === "") return "(Kosong)";
  if (key === "delivery" || key === "plan") return fmtDate(v);
  if (["total_qty", "terima", "qty"].includes(key)) return num(v);
  return v;
};

// Popover
const pop = reactive({ open: false, key: "style", top: 0, left: 0 });
const popSearch = ref("");
const popInput = ref(null);
const popLabel = computed(() => FILTER_LABEL[pop.key]);

const popOptions = computed(() => {
  const q = popSearch.value.trim().toLowerCase();
  return (allOptions.value[pop.key] || []).filter((v) => !q || optionLabel(pop.key, v).toLowerCase().includes(q));
});

const closePop = () => { pop.open = false; };

const openPop = (key, ev) => {
  if (pop.open && pop.key === key) return closePop();
  const r = ev.currentTarget.getBoundingClientRect();
  const w = 260;
  pop.left = Math.min(Math.max(8, r.left - 20), window.innerWidth - w - 12);
  pop.top = r.bottom + 6;
  pop.key = key;
  popSearch.value = "";
  pop.open = true;
  nextTick(() => popInput.value?.focus());
};

const selectVisible = () => {
  colFilters[pop.key] = [...new Set([...colFilters[pop.key], ...popOptions.value])];
};
const clearCurrent = () => { colFilters[pop.key] = []; };

const onDocDown = (e) => {
  if (!pop.open) return;
  if (e.target.closest?.(".filter-pop, .filter-btn")) return;
  closePop();
};

// --- DATA: filter -> kelompok per PO & Warna ---
const filteredRows = computed(() =>
  rows.value.filter((r) => {
    const d = ymd(r.xFtyDate) || "";
    const p = d ? addDays(d, -7) : "";
    if (colFilters.style.length && !colFilters.style.includes(String(r.idp_tls ?? ""))) return false;
    if (colFilters.warna.length && !colFilters.warna.includes(String(r.xMColor ?? ""))) return false;
    if (colFilters.total_qty.length && !colFilters.total_qty.includes(String(r.xTotal_1 ?? 0))) return false;
    if (colFilters.terima.length && !colFilters.terima.includes(String(r.xTotal_2 ?? 0))) return false;
    if (colFilters.po.length && !colFilters.po.includes(r.xTimes == null ? "" : String(r.xTimes))) return false;
    if (colFilters.delivery.length && !colFilters.delivery.includes(d)) return false;
    if (colFilters.qty.length && !colFilters.qty.includes(r.xShipTot == null ? "" : String(r.xShipTot))) return false;
    if (colFilters.plan.length && !colFilters.plan.includes(p)) return false;
    return true;
  })
);

const groups = computed(() => {
  const map = new Map();

  for (const r of filteredRows.value) {
    const basePO = r.PPO ? String(r.PPO).trim() : (r.idp_tls ? String(r.idp_tls).trim() : (r.xPO ? String(r.xPO).split("-")[0].trim() : ""));
    const key = `${basePO}||${r.xMColor ?? ""}`;
    
    if (!map.has(key)) {
      map.set(key, {
        key,
        idx: 0,
        PPO: r.PPO,
        xPO: r.xPO,
        idp_tls: r.idp_tls,
        xPO_Full: r.xPO_Full, 
        xMColor: r.xMColor,
        total1: Number(r.xTotal_1) || 0,
        total2: Number(r.xTotal_2) || 0,
        raw: [],
        lines: [],
        span: 0,
        acc_qty: null,
        acc_satuan: null,
      });
    }
    const g = map.get(key);

    const dDate = ymd(r.xFtyDate);
    const pDate = dDate ? addDays(dDate, -7) : null;
    const qty = r.xShipTot == null ? null : Number(r.xShipTot) || 0;
    g.raw.push({ xTimes: r.xTimes, xFtyDate: dDate, planDate: pDate, qty });

    if (g.acc_satuan == null && g.acc_qty == null) {
      if (r.acc_satuan != null || Number(r.acc_qty) > 0) {
        g.acc_qty = r.acc_qty;
        g.acc_satuan = r.acc_satuan;
      }
    }
  }

  const list = [...map.values()];

  list.forEach((g) => {
    const bmap = new Map();
    g.raw.forEach((l) => {
      const k = l.xTimes == null ? "none" : String(l.xTimes);
      if (!bmap.has(k)) bmap.set(k, { xTimes: l.xTimes, lines: [], months: {} });
      const b = bmap.get(k);
      b.lines.push(l);
      if (l.xFtyDate && l.qty != null) {
        const mk = l.xFtyDate.slice(0, 7);
        b.months[mk] = (b.months[mk] || 0) + l.qty;
      }
    });

    const blocks = [...bmap.values()].sort((a, b) => (a.xTimes ?? 0) - (b.xTimes ?? 0));
    blocks.forEach((b) => b.lines.sort((x, y) => String(x.xFtyDate || "").localeCompare(String(y.xFtyDate || ""))));

    blocks.forEach((b, bi) => {
      b.lines.forEach((l, li) => {
        g.lines.push({
          ...l,
          block: b,
          blockSpan: b.lines.length,
          firstOfGroup: g.lines.length === 0,
          firstOfBlock: li === 0,
          lastOfBlock: li === b.lines.length - 1,
          lastBlock: bi === blocks.length - 1,
        });
      });
    });
    g.span = g.lines.length;
  });

  list.sort(
    (a, b) =>
      String(a.idp_tls).localeCompare(String(b.idp_tls), undefined, { numeric: true }) ||
      String(a.xMColor).localeCompare(String(b.xMColor))
  );

  // Kalkulasi Merge antar warna untuk Style yang sama
  let currentStyle = null;
  let styleGroups = [];

  list.forEach((g, i) => {
    g.idx = i;
    const styleKey = g.idp_tls;
    
    if (styleKey !== currentStyle) {
      if (styleGroups.length > 0) {
        let totalSpan = styleGroups.reduce((sum, grp) => sum + grp.span, 0);
        styleGroups[0].lines[0].firstOfStyle = true;
        styleGroups[0].styleSpan = totalSpan;
        styleGroups[styleGroups.length - 1].isLastGroupOfStyle = true;
      }
      currentStyle = styleKey;
      styleGroups = [g];
    } else {
      styleGroups.push(g);
    }
    g.lines.forEach(ln => ln.firstOfStyle = false);
  });
  
  if (styleGroups.length > 0) {
    let totalSpan = styleGroups.reduce((sum, grp) => sum + grp.span, 0);
    styleGroups[0].lines[0].firstOfStyle = true;
    styleGroups[0].styleSpan = totalSpan;
    styleGroups[styleGroups.length - 1].isLastGroupOfStyle = true;
  }

  return list;
});

const monthKeys = computed(() => {
  const set = new Set();
  groups.value.forEach((g) => g.lines.forEach((ln) => Object.keys(ln.block.months).forEach((k) => set.add(k))));
  return [...set].sort();
});

const headRows = computed(() => (monthKeys.value.length ? 3 : 1));

const BASE_WIDTH = 1040; 
const tableStyle = computed(() => ({ width: `${BASE_WIDTH + monthKeys.value.length * 200}px` }));

const stats = computed(() => {
  let poRows = 0;
  let qty = 0;
  groups.value.forEach((g) =>
    g.lines.forEach((ln) => {
      if (ln.xTimes != null) poRows++;
      qty += ln.qty || 0;
    })
  );
  return { styles: new Set(groups.value.map(g => g.idp_tls)).size, poRows, qty };
});

const accText = (g) => {
  if (g.acc_satuan == null && !(Number(g.acc_qty) > 0)) return "-";
  return `${num(g.acc_qty)} ${g.acc_satuan ?? ""}`.trim();
};

// --- ACTIONS ---
const fetchReport = async () => {
  const f = filter.value;
  if (!f.beginDate || !f.endDate) {
    return Swal.fire("Peringatan", "Tanggal terima wajib diisi!", "warning");
  }
  if (f.edateFrom && f.edateTo && f.edateFrom > f.edateTo) {
    return Swal.fire("Peringatan", "Bulan delivery 'dari' tidak boleh lebih besar dari 'sampai'.", "warning");
  }

  loading.value = true;
  closePop();
  try {
    const params = { beginDate: f.beginDate, endDate: f.endDate };
    if (f.edateFrom) params.edateFrom = f.edateFrom;
    if (f.edateTo) params.edateTo = f.edateTo;

    const res = await axios.get(`${API_BASE_URL}/laporan-terima`, { params });
    rows.value = res.data.data || [];
    clearColFilters();
    isDataLoaded.value = true;
  } catch (e) {
    Swal.fire("Error", e.response?.data?.message || "Gagal mengambil data.", "error");
  } finally {
    loading.value = false;
  }
};

let timer = null;
watch(
  () => [filter.value.edateFrom, filter.value.edateTo],
  () => {
    if (!isDataLoaded.value) return;
    clearTimeout(timer);
    timer = setTimeout(fetchReport, 400);
  }
);

// --- EXPORT EXCEL ---
const exportToExcel = async () => {
  if (!groups.value.length) return Swal.fire("Info", "Tidak ada data untuk diexport.", "info");

  const wb = new ExcelJS.Workbook();
  const mks = monthKeys.value;
  const n = mks.length;
  const hr = headRows.value;
  const H0 = 4;
  const lastCol = 8 + n * 2 + 1; 

  const ws = wb.addWorksheet("Laporan Terima", {
    views: [{ state: "frozen", xSplit: 1, ySplit: H0 + hr - 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const THIN = { style: "thin", color: { argb: "FFD5DBE5" } };
  const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };
  const solid = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

  const f = filter.value;
  ws.getCell(1, 1).value = "Laporan Bahan Terima (Per Warna)";
  ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: "FF1F3A5F" } };
  const info = [
    `Tanggal terima: ${fmtDate(f.beginDate)} s/d ${fmtDate(f.endDate)}`,
    `Delivery: ${f.edateFrom ? monthLabel(f.edateFrom) : "awal"} s/d ${f.edateTo ? monthLabel(f.edateTo) : "akhir"}`,
  ];
  ws.getCell(2, 1).value = info.join("   |   ");
  ws.getCell(2, 1).font = { color: { argb: "FF64748B" } };

  const setH = (r, c, v) => { ws.getCell(r, c).value = v; };
  ["Style", "Warna", "Total Qty", "Terima", "PO", "Delivery", "Qty", "Planning Date"].forEach((t, i) => setH(H0, i + 1, t));
  if (n) {
    setH(H0, 9, "Kebutuhan per bulan");
    mks.forEach((mk, i) => {
      setH(H0 + 1, 9 + i * 2, monthLabel(mk));
      setH(H0 + 2, 9 + i * 2, "Qty");
      setH(H0 + 2, 10 + i * 2, "Qty - Terima");
    });
  }
  setH(H0, lastCol, "Perlengkapan");

  for (let r = H0; r < H0 + hr; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = solid(r === H0 ? "FF1F3A5F" : "FF2C4F80");
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = BORDER;
    }
  }
  for (let c = 1; c <= 8; c++) ws.mergeCells(H0, c, H0 + hr - 1, c);
  ws.mergeCells(H0, lastCol, H0 + hr - 1, lastCol);
  if (n) {
    ws.mergeCells(H0, 9, H0, 8 + n * 2);
    mks.forEach((_, i) => ws.mergeCells(H0 + 1, 9 + i * 2, H0 + 1, 10 + i * 2));
  }

  const put = (r, c, v, fill) => {
    const cell = ws.getCell(r, c);
    cell.value = v === "" ? null : v;
    cell.border = BORDER;
    cell.alignment = {
      vertical: "middle",
      horizontal: c === 1 ? "left" : typeof v === "number" ? "right" : "center",
    };
    if (typeof v === "number") cell.numFmt = "#,##0";
    if (fill) cell.fill = fill;
    return cell;
  };

  const groupCols = [2, 3, 4, lastCol]; // Kolom Warna, Total, Terima, Perlengkapan
  const blockCols = [5, ...Array.from({ length: n * 2 }, (_, k) => 9 + k)]; 
  
  let r = H0 + hr;
  let styleStartRow = r;

  groups.value.forEach((g, gi) => {
    const gStart = r;
    const fill = gi % 2 ? solid("FFF6F8FC") : undefined;
    let bStart = r;

    if (g.lines.length && g.lines[0].firstOfStyle) {
      styleStartRow = gStart; // Tandai awal cell Style
    }

    g.lines.forEach((ln) => {
      const fs = ln.firstOfStyle;
      const fg = ln.firstOfGroup;
      const fb = ln.firstOfBlock;
      const vals = [
        fs ? `${g.idp_tls} - ${g.xPO_Full}` : "",
        fg ? g.xMColor : "",
        fg ? g.total1 : "",
        fg ? g.total2 : "",
        fb ? ln.xTimes ?? "" : "",
        fmtDate(ln.xFtyDate),
        ln.qty ?? "",
        fmtDate(ln.planDate),
      ];
      mks.forEach((mk) => {
        const v = ln.block.months[mk];
        vals.push(fb && v != null ? v : "", fb && v != null ? v - g.total2 : "");
      });
      vals.push(fg ? accText(g) : "");

      vals.forEach((v, k) => {
        const cell = put(r, k + 1, v, fill);
        const isNet = k >= 8 && k < 8 + n * 2 && (k - 8) % 2 === 1;
        if (isNet && v !== "") cell.font = { bold: true, color: { argb: v > 0 ? "FFB42318" : "FF146C2E" } };
      });

      if (fb) bStart = r;
      if (ln.lastOfBlock && ln.blockSpan > 1) blockCols.forEach((c) => ws.mergeCells(bStart, c, r, c));
      r++;
    });

    // Merge warna, dll di grup saat ini
    if (r - 1 > gStart) groupCols.forEach((c) => ws.mergeCells(gStart, c, r - 1, c));
    
    // Merge cell Style jika ini grup terakhir untuk Style tersebut
    if (g.isLastGroupOfStyle && r - 1 > styleStartRow) {
      ws.mergeCells(styleStartRow, 1, r - 1, 1);
    }
  });

  [34, 16, 12, 12, 7, 13, 11, 14].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  for (let i = 0; i < n; i++) {
    ws.getColumn(9 + i * 2).width = 11;
    ws.getColumn(10 + i * 2).width = 14;
  }
  ws.getColumn(lastCol).width = 18;

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Laporan_Terima_${f.endDate}.xlsx`);
};

// --- EXPORT PDF ---
const exportToPDF = () => {
  if (!groups.value.length) return Swal.fire("Info", "Tidak ada data untuk diexport.", "info");

  const doc = new jsPDF("l", "mm", "a4");
  const mks = monthKeys.value;
  const n = mks.length;
  const f = filter.value;

  doc.setFontSize(14);
  doc.text("LAPORAN BAHAN TERIMA", 14, 12);
  doc.setFontSize(9);
  doc.text(
    `Tanggal terima: ${fmtDate(f.beginDate)} s/d ${fmtDate(f.endDate)}   |   Delivery: ${f.edateFrom ? monthLabel(f.edateFrom) : "awal"} s/d ${f.edateTo ? monthLabel(f.edateTo) : "akhir"}`,
    14,
    18
  );

  const rs = headRows.value;
  const head = [
    [
      { content: "Style", rowSpan: rs }, { content: "Warna", rowSpan: rs }, { content: "Total Qty", rowSpan: rs }, { content: "Terima", rowSpan: rs },
      { content: "PO", rowSpan: rs }, { content: "Delivery", rowSpan: rs }, { content: "Qty", rowSpan: rs },
      { content: "Planning Date", rowSpan: rs },
      ...(n ? [{ content: "Kebutuhan per bulan", colSpan: n * 2 }] : []),
      { content: "Perlengkapan", rowSpan: rs },
    ],
  ];
  if (n) {
    head.push(mks.map((mk) => ({ content: monthLabel(mk), colSpan: 2 })));
    head.push(mks.flatMap(() => ["Qty", "Qty - Terima"]));
  }

  const body = [];
  groups.value.forEach((g) => {
    g.lines.forEach((ln) => {
      const row = [];
      if (ln.firstOfStyle) {
        row.push({ content: `${g.idp_tls}\n${g.xPO_Full}`, rowSpan: g.styleSpan });
      }
      if (ln.firstOfGroup) {
        row.push(
          { content: g.xMColor ?? "", rowSpan: g.span },
          { content: num(g.total1), rowSpan: g.span },
          { content: num(g.total2), rowSpan: g.span }
        );
      }
      if (ln.firstOfBlock) row.push({ content: String(ln.xTimes ?? ""), rowSpan: ln.blockSpan });
      row.push(fmtDate(ln.xFtyDate), num(ln.qty), fmtDate(ln.planDate));
      
      if (ln.firstOfBlock) {
        mks.forEach((mk) => {
          const v = ln.block.months[mk];
          row.push({ content: v != null ? num(v) : "", rowSpan: ln.blockSpan });
          row.push({ content: v != null ? num(v - g.total2) : "", rowSpan: ln.blockSpan });
        });
      }
      if (ln.firstOfGroup) row.push({ content: accText(g), rowSpan: g.span });
      body.push(row);
    });
  });

  autoTable(doc, {
    head,
    body,
    startY: 22,
    theme: "grid",
    headStyles: { fillColor: [31, 58, 95], halign: "center", valign: "middle" },
    styles: { fontSize: 7, halign: "center", valign: "middle" },
  });

  doc.save(`Laporan_Terima_${f.endDate}.pdf`);
};

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => { localStorage.clear(); window.location.href = "/login"; };

onMounted(() => {
  document.addEventListener("mousedown", onDocDown);
  window.addEventListener("resize", closePop);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocDown);
  window.removeEventListener("resize", closePop);
  clearTimeout(timer);
});
</script>

<style scoped>
.report-root {
  --header-h: 56px; 
  --ink: #1e293b;
  --muted: #64748b;
  --line: #e5e9f0;
  --line-strong: #c9d1dd;
  --head: #1f3a5f;
  --head-2: #2c4f80;
  height: 100vh;
  padding-top: var(--header-h);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f4f6fa;
  color: var(--ink);
}

.report-body { flex: 1 1 auto; min-height: 0; display: flex; position: relative; }

.report-main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  transition: margin-left 0.3s ease-in-out;
}
.content-shifted { margin-left: 250px; }

.page-head { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.page-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: grid; place-items: center;
  background: #e3ecfa; color: #1d4ed8; font-size: 1.1rem;
}
.page-title { font-size: 1.2rem; font-weight: 700; margin: 0; }
.page-sub { margin: 0; font-size: 0.8rem; color: var(--muted); }

.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.filter-bar {
  flex: 0 0 auto;
  display: flex;
  gap: 12px;
  align-items: end;
  padding: 12px 16px;
  flex-wrap: wrap;
}
.field { min-width: 150px; flex: 1; }
.field label { display: block; font-size: 0.74rem; font-weight: 600; color: var(--muted); margin-bottom: 4px; }
.field .form-control, .field .btn { border-color: var(--line-strong); }
.field-action { display: flex; gap: 8px; flex: 0 0 auto; }

.table-panel { position: relative; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.table-toolbar {
  flex: 0 0 auto;
  display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 14px; border-bottom: 1px solid var(--line);
}
.chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.chip { background: #eef2f9; color: #334155; border-radius: 999px; padding: 3px 11px; font-size: 0.78rem; }
.chip b { margin-left: 4px; color: var(--ink); }
.legend { font-size: 0.76rem; color: var(--muted); display: inline-flex; align-items: center; gap: 4px; margin-left: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot-short { background: #d92d20; }
.dot-ok { background: #16a34a; margin-left: 8px; }
.actions { display: flex; gap: 8px; }

.table-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; position: relative; }

.rt {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  min-width: 100%;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
}
.rt th, .rt td {
  padding: 6px 10px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid #edf0f5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rt thead th {
  position: sticky;
  z-index: 3;
  height: 38px;
  background: var(--head);
  color: #fff;
  font-weight: 600;
  text-align: center;
  border-right-color: rgba(255, 255, 255, 0.14);
  border-bottom-color: rgba(255, 255, 255, 0.14);
}
.rt .hr1 th { top: 0; }
.rt .hr2 th { top: 38px; background: var(--head-2); }
.rt .hr3 th { top: 76px; background: var(--head-2); font-weight: 500; font-size: 0.76rem; }

.rt .sticky-col { position: sticky; left: 0; }
.rt thead th.sticky-col { z-index: 5; text-align: left; padding-left: 14px; }
.rt tbody td.sticky-col { z-index: 4; text-align: left; padding-left: 14px; border-right-color: var(--line-strong); background: #fff;}

.rt tbody td { background: #fff; color: var(--ink); }
.rt tbody tr.g-b td { background: #f9fafb; } 
.rt tbody tr.b-last td,
.rt tbody tr td.blk-cell { border-bottom-color: #d9dfe8; }
.rt tbody tr.g-last td,
.rt tbody tr td.span-cell { border-bottom-color: var(--line-strong); }

.num { text-align: right; padding-right: 14px !important; }
.ctr { text-align: center; }
.rt td.empty::after { content: "–"; color: #c0c7d2; }

.style-main { font-weight: 700; line-height: 1.2; }
.style-sub { font-size: 0.72rem; color: var(--muted); font-weight: 400; line-height: 1.3; }

.pill {
  display: inline-block; min-width: 54px; text-align: center;
  padding: 2px 10px; border-radius: 999px; font-weight: 600; font-size: 0.78rem;
}
.pill-short { background: #fde8e6; color: #b42318; }
.pill-ok { background: #e3f5e8; color: #146c2e; }

.no-data { text-align: center; color: var(--muted); padding: 32px 0 !important; }

.filter-btn {
  border: 0; background: transparent; color: rgba(255, 255, 255, 0.6);
  padding: 2px 5px; margin-left: 4px; line-height: 1; border-radius: 5px; cursor: pointer; font-size: 0.72rem;
}
.filter-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.16); }
.filter-btn.active { color: #fbbf24; }

.loading-overlay {
  position: absolute; inset: 0; z-index: 10;
  background: rgba(255, 255, 255, 0.65);
  display: flex; align-items: center; justify-content: center;
}

.empty-state {
  flex: 1 1 auto; min-height: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  color: var(--muted);
}
.empty-state i { font-size: 2.6rem; opacity: 0.3; }
.empty-state p { margin: 0; }

.filter-pop {
  position: fixed; width: 260px; z-index: 2000;
  background: #fff; border: 1px solid #e5e9f0; border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  padding: 10px; color: #1e293b; font-size: 0.82rem;
}
.pop-title { font-weight: 700; margin-bottom: 6px; }
.pop-actions { display: flex; justify-content: space-between; margin: 8px 2px 4px; }
.link-btn { border: 0; background: none; padding: 0; color: #2563eb; font-size: 0.78rem; cursor: pointer; }
.link-btn:hover { text-decoration: underline; }
.pop-list { max-height: 240px; overflow-y: auto; border-top: 1px solid #edf0f5; border-bottom: 1px solid #edf0f5; padding: 4px 0; }
.pop-item { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 6px; cursor: pointer; margin: 0; }
.pop-item:hover { background: #f1f5fb; }
.pop-empty { text-align: center; color: #64748b; padding: 14px 0; }
.pop-foot { margin-top: 6px; color: #64748b; font-size: 0.74rem; }

@media (max-width: 991.98px) {
  .content-shifted { margin-left: 0; opacity: 0.5; pointer-events: none; }
}
</style>