<template>
  <div class="report-root">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="report-body">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['report-main', { 'content-shifted': sidebarOpen }]">
        <div class="page-head">
          <div class="page-icon"><i class="bi bi-file-earmark-spreadsheet"></i></div>
          <div>
            <h1 class="page-title">Laporan PO Linking</h1>
            <p class="page-sub">Monitoring Penerimaan (A2), A1, dan Kalkulasi Kekurangan</p>
          </div>
        </div>

        <section class="panel filter-bar">
          <div class="field">
            <label>Tgl Terima Dari</label>
            <input type="date" v-model="filter.beginDate" class="form-control form-control-sm" />
          </div>
          <div class="field">
            <label>Tgl Terima Sampai</label>
            <input type="date" v-model="filter.endDate" class="form-control form-control-sm" />
          </div>
          <div class="field">
            <label>Delivery Bulan Awal</label>
            <input type="month" v-model="filter.edateFrom" class="form-control form-control-sm" />
          </div>
          <div class="field">
            <label>Delivery Bulan Akhir</label>
            <input type="month" v-model="filter.edateTo" class="form-control form-control-sm" />
          </div>
          <div class="field field-action">
            <button class="btn btn-primary btn-sm px-3" @click="fetchReport" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-search me-2"></i>Tarik Data
            </button>
          </div>
        </section>

        <section v-if="isDataLoaded" class="panel table-panel">
          <!-- KPI -->
          <div class="kpi-strip">
            <div class="kpi"><span class="kpi-label">Style</span><span class="kpi-val">{{ kpi.styles }}</span></div>
            <div class="kpi"><span class="kpi-label">PO</span><span class="kpi-val">{{ kpi.po }}</span></div>
            <div class="kpi"><span class="kpi-label">Warna</span><span class="kpi-val">{{ kpi.colors }}</span></div>
            <div class="kpi">
              <span class="kpi-label">Warna Kurang</span>
              <span class="kpi-val" :class="kpi.colShort ? 'text-bad' : 'text-good'">{{ kpi.colShort }}</span>
            </div>
            <div class="kpi">
              <span class="kpi-label">Total Kekurangan</span>
              <span class="kpi-val" :class="kpi.total < 0 ? 'text-bad' : 'text-good'">{{ footText(kpi.total) }}</span>
            </div>
          </div>

          <!-- TOOLBAR -->
          <div class="table-toolbar">
            <div class="tb-group tb-grow">
              <div class="search-box">
                <i class="bi bi-search"></i>
                <input v-model="search" type="text" placeholder="Cari style, PO, buyer, warna… (pisahkan dengan koma)" />
                <button v-if="search" class="search-clear" title="Hapus pencarian" @click="search = ''"><i class="bi bi-x-lg"></i></button>
              </div>

              <button class="btn btn-sm btn-outline-secondary btn-hide-toggle rounded-pill px-3" @click.stop="togglePop($event)">
                <i class="bi bi-sliders me-1"></i>Sembunyikan / Tampilkan
                <span v-if="hiddenCount" class="badge bg-warning text-dark ms-1" title="Disembunyikan">{{ hiddenCount }}</span>
                <span v-if="showCount" class="badge bg-info text-dark ms-1" title="Tampilkan saja">{{ showCount }}</span>
              </button>

              <button v-if="filtersActive" class="btn btn-sm btn-link text-danger py-0" @click="resetAll">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Reset
              </button>
              <button v-if="orderCount" class="btn btn-sm btn-link text-secondary py-0" title="Kembalikan urutan proses ke bawaan" @click="resetOrder()">
                <i class="bi bi-arrow-down-up me-1"></i>Reset urutan proses ({{ orderCount }})
              </button>
            </div>

            <div class="tb-group">
              <button :class="['btn btn-sm', compactView ? 'btn-primary' : 'btn-outline-secondary']" title="Hanya tampilkan baris ringkasan (OK / kurang)" @click="compactView = !compactView">
                <i class="bi bi-list-nested me-1"></i>Ringkas
              </button>
              <button :class="['btn btn-sm', onlyShortage ? 'btn-danger' : 'btn-outline-secondary']" title="Hanya warna yang masih kurang (belum OK)" @click="setStatus(onlyShortage ? 'all' : 'kurang')">
                <i class="bi bi-exclamation-triangle me-1"></i>Hanya Kurang
              </button>
              <button :class="['btn btn-sm', onlyOk ? 'btn-success' : 'btn-outline-secondary']" title="Hanya warna yang sudah OK" @click="setStatus(onlyOk ? 'all' : 'ok')">
                <i class="bi bi-check-circle me-1"></i>Hanya OK
              </button>
              <button :class="['btn btn-sm', recalcTotal ? 'btn-primary' : 'btn-outline-secondary']" title="Total (JUMLAH) dihitung ulang hanya dari size yang tampil" @click="recalcTotal = !recalcTotal">
                <i class="bi bi-calculator me-1"></i>Total ikut size tampil
              </button>
              <select v-model="sortBy" class="form-select form-select-sm sort-select" title="Urutkan tabel">
                <option value="style">Urut: Style / PO</option>
                <option value="short">Urut: Kekurangan terbesar</option>
                <option value="delivery">Urut: Delivery terdekat</option>
              </select>
              <button class="btn btn-sm btn-outline-secondary" :title="allCollapsed ? 'Buka semua' : 'Ciutkan semua'" @click="toggleCollapseAll">
                <i :class="allCollapsed ? 'bi bi-arrows-expand' : 'bi bi-arrows-collapse'"></i>
              </button>
              <button class="btn btn-sm btn-ai" @click="ai.open = !ai.open">
                <i class="bi bi-stars me-1"></i>Asisten AI
              </button>
              <button class="btn btn-sm btn-success" @click="exportToExcel">
                <i class="bi bi-file-earmark-excel me-1"></i>Export Excel
              </button>
            </div>
          </div>

          <div class="table-scroll" @scroll.passive="closePop">
            <!-- SATU TABEL PER PO -->
            <div v-for="po in poTables" :key="po.key" :data-po="po.key" class="po-table-container">
              <div class="po-bar">
                <button class="bar-btn" :title="collapsed[po.key] ? 'Buka' : 'Ciutkan'" @click="collapsed[po.key] = !collapsed[po.key]">
                  <i :class="collapsed[po.key] ? 'bi bi-chevron-right' : 'bi bi-chevron-down'"></i>
                </button>
                <span class="bar-title">{{ po.style }} · PO{{ po.xTimes }}</span>
                <span :class="['badge-short', po.shortTotal < 0 ? 'bad' : 'good']">
                  {{ po.shortTotal < 0 ? "Kurang " + footText(po.shortTotal) : "Semua OK" }}
                </span>
                <span
                  v-for="lb in po.hiddenSizes"
                  :key="'hs-' + lb"
                  class="chip-restore"
                  title="Size disembunyikan — klik untuk menampilkan lagi"
                  @click="restoreSize(po.styleKey, lb)"
                >
                  {{ lb }} <i class="bi bi-x-lg"></i>
                </span>
              </div>

              <table v-if="!collapsed[po.key]" class="table-excel" :style="{ width: tableWidth(po) + 'px' }">
                <colgroup>
                  <col class="col-color" />
                  <col class="col-work" />
                  <col v-for="i in SP_L" :key="'cgl-' + i" class="col-gap" />
                  <col v-for="k in po.sizeKeys" :key="'cg-' + k" class="col-size" />
                  <col v-for="i in SP_R" :key="'cgr-' + i" class="col-gap" />
                  <col class="col-total" />
                </colgroup>

                <tbody>
                  <!-- BARIS 1: style (di atas kolom warna) | judul PO | buyer (di atas kolom JUMLAH) -->
                  <tr class="tr-header-po">
                    <td class="cell-idp">
                      <label class="mini-check" title="Centang untuk menyembunyikan style ini">
                        <input type="checkbox" @change="hideItem($event, 'self', po.styleKey)" />
                      </label>
                      {{ po.style }}
                    </td>
                    <td :colspan="po.sizeKeys.length + SP_L + SP_R + 1" class="cell-po-title">
                      <label class="mini-check" title="Centang untuk menyembunyikan delivery ini">
                        <input type="checkbox" @change="hideItem($event, 'delivery', po.styleKey, po.deliv)" />
                      </label>
                      {{ po.ppo }} PO{{ po.xTimes }} QTY: {{ num(po.xShipTot) }} ({{ fmtDate(po.xFtyDate) }})
                    </td>
                    <td class="cell-buyer">{{ po.buyer }}</td>
                  </tr>

                  <!-- BARIS 2: header size (tiap size ada centang sembunyikan) -->
                  <tr class="tr-header-size">
                    <td class="cell-blank"></td>
                    <td class="cell-blank"></td>
                    <td v-for="i in SP_L" :key="'hl-' + i" class="cell-gap"></td>
                    <td v-for="(sz, i) in po.sizeLabels" :key="'sz-' + sz + i" class="cell-size">
                      <label class="mini-check" title="Centang untuk menyembunyikan kolom size ini">
                        <input type="checkbox" @change="hideItem($event, 'size', po.styleKey, sz)" />
                      </label>
                      {{ sz }}
                    </td>
                    <td v-for="i in SP_R" :key="'hr-' + i" class="cell-gap"></td>
                    <td class="cell-jumlah">JUMLAH</td>
                  </tr>

                  <!-- PER WARNA -->
                  <template v-for="color in po.colors" :key="color.name">
                    <tr
                      v-for="(row, rIdx) in rowsOf(color)"
                      :key="color.name + '|' + row.key"
                      :class="['r-' + row.type, { 'grp-first': rIdx === 0, 'grp-last': rIdx === rowsOf(color).length - 1, 'drag-over': dragProc.over === dragId(po, color, row) }]"
                    >
                      <td v-if="rIdx === 0" :rowspan="rowsOf(color).length" class="cell-color">
                        <label class="mini-check" title="Centang untuk menyembunyikan warna ini">
                          <input type="checkbox" @change="hideItem($event, 'warna', po.styleKey, color.raw)" />
                        </label>
                        {{ color.name }}
                      </td>
                      <td
                        :class="['cell-work', { 'is-movable': isMovable(row) }]"
                        :draggable="isMovable(row)"
                        @dragstart="onProcDragStart($event, po, color, row)"
                        @dragover="onProcDragOver($event, po, color, row)"
                        @dragleave="onProcDragLeave(po, color, row)"
                        @drop="onProcDrop($event, po, color, row)"
                        @dragend="onProcDragEnd"
                      >
                        <span v-if="isMovable(row)" class="proc-move">
                          <i class="bi bi-grip-vertical drag-grip" title="Geser (drag) ke baris proses lain untuk menukar urutan"></i>
                          <button type="button" class="mv-btn" title="Naikkan proses ini" @click.stop="moveProcUi(po, color, row.label, 'up')"><i class="bi bi-caret-up-fill"></i></button>
                          <button type="button" class="mv-btn" title="Turunkan proses ini" @click.stop="moveProcUi(po, color, row.label, 'down')"><i class="bi bi-caret-down-fill"></i></button>
                        </span>
                        <label v-if="row.type === 'sum' || row.type === 'proc'" class="mini-check" title="Centang untuk menyembunyikan workname ini">
                          <input type="checkbox" @change="hideItem($event, 'workname', po.styleKey, row.raw)" />
                        </label>
                        {{ row.label }}
                      </td>
                      <td v-for="i in SP_L" :key="'dl-' + i" class="cell-gap"></td>
                      <td v-for="k in po.sizeKeys" :key="row.key + '-' + k" :class="['cell-val', valClass(row, k)]">{{ cellText(row, k) }}</td>
                      <td v-for="i in SP_R" :key="'dr-' + i" class="cell-gap"></td>
                      <td :class="['cell-total', { 'v-neg': row.type === 'sum' && row.total < 0 }]">{{ totalText(row) }}</td>
                    </tr>
                  </template>

                  <!-- FOOTER: total kekurangan, nilainya tepat di bawah kolom JUMLAH -->
                  <tr v-for="foot in po.footers" :key="'foot-' + foot.name" class="tr-footer">
                    <td :colspan="po.sizeKeys.length + SP_L + SP_R + 2" class="cell-foot-label">TOTAL KEKURANGAN {{ foot.name }}</td>
                    <td :class="['cell-foot-total', { 'v-neg': foot.total < 0 }]">{{ footText(foot.total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="!poTables.length" class="empty-result">
              <i class="bi bi-funnel"></i>
              <p>Tidak ada data yang cocok dengan pencarian / pilihan tampilan saat ini.</p>
              <button class="btn btn-sm btn-outline-primary" @click="resetAll">Reset tampilan</button>
            </div>
          </div>

          <div v-if="loading" class="loading-overlay">
            <div class="spinner-border text-primary"></div>
          </div>
        </section>

        <section v-else class="panel empty-state">
          <i class="bi bi-table"></i>
          <p>Atur tanggal transaksi dan filter bulan, lalu klik <b>Tarik Data</b>.</p>
        </section>
      </main>
    </div>

    <!-- Popover Sembunyikan / Tampilkan Saja / Preset -->
    <Teleport to="body">
      <div v-if="pop.open" class="filter-pop" :style="{ top: pop.top + 'px', left: pop.left + 'px' }" @mousedown.stop>
        <div class="pop-head">
          <div class="pop-tabs">
            <button :class="{ active: tab === 'hide' }" @click="tab = 'hide'">
              <i class="bi bi-eye-slash"></i> Sembunyikan
              <span v-if="hiddenCount" class="tab-badge">{{ hiddenCount }}</span>
            </button>
            <button :class="{ active: tab === 'show' }" @click="tab = 'show'">
              <i class="bi bi-eye"></i> Tampilkan Saja
              <span v-if="showCount" class="tab-badge info">{{ showCount }}</span>
            </button>
            <button :class="{ active: tab === 'preset' }" @click="tab = 'preset'">
              <i class="bi bi-bookmark-star"></i> Preset
            </button>
          </div>

          <template v-if="tab !== 'preset'">
            <div v-if="tab === 'hide'" class="pop-hint">Centang = <b>disembunyikan</b>. Berlaku per style.</div>
            <div v-else class="pop-hint">
              Centang = <b>hanya itu yang ditampilkan</b> (kosong = tampilkan semua). Berlaku per style.
            </div>
            <input
              ref="popInput"
              v-model="popSearch"
              type="text"
              class="form-control form-control-sm"
              placeholder="Cari Style..."
              @keydown.esc="closePop"
            />
          </template>
        </div>

        <div v-if="tab !== 'preset'" class="pop-body">
          <div v-for="idp in popStyles" :key="tab + '-' + idp" class="idp-block">
            <div class="idp-row">
              <button class="idp-caret" @click="expanded[idp] = !expanded[idp]">
                <i :class="expanded[idp] ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
              </button>
              <label class="pop-item idp-label">
                <input type="checkbox" :checked="!!activeMap[idp]?.self" @change="toggleSelf(activeMap, idp)" />
                <b>{{ idp || "(Kosong)" }}</b>
              </label>
              <span v-if="selCount(activeMap, idp)" :class="['badge', tab === 'hide' ? 'bg-warning text-dark' : 'bg-info text-dark']">
                {{ selCount(activeMap, idp) }}
              </span>
            </div>

            <div v-if="expanded[idp]" class="idp-detail" :class="{ dim: tab === 'hide' && activeMap[idp]?.self }">
              <div v-for="g in GROUPS" :key="idp + g.key" class="grp">
                <div class="grp-head">
                  <span class="grp-title">{{ g.label }}</span>
                  <span>
                    <button class="link-btn" @click="setGroup(activeMap, idp, g.key, true)">Centang semua</button>
                    <span class="text-muted"> · </span>
                    <button class="link-btn" @click="setGroup(activeMap, idp, g.key, false)">Kosongkan</button>
                  </span>
                </div>
                <label v-for="v in optionsByStyle[idp][g.key]" :key="idp + g.key + v" class="pop-item">
                  <input type="checkbox" :checked="isSel(activeMap, idp, g.key, v)" @change="toggleSel(activeMap, idp, g.key, v)" />
                  <span>{{ optionLabel(g.key, v) }}</span>
                </label>
              </div>
            </div>
          </div>
          <div v-if="!popStyles.length" class="pop-empty">Tidak ditemukan</div>
        </div>

        <div v-else class="pop-body">
          <div class="pop-hint mb-2">Simpan kombinasi pencarian, sembunyikan, dan tampilkan saja yang sering dipakai.</div>
          <div class="preset-add">
            <input v-model="presetName" type="text" class="form-control form-control-sm" placeholder="Nama preset…" @keydown.enter="savePreset" />
            <button class="btn btn-sm btn-primary" :disabled="!presetName.trim()" @click="savePreset">Simpan</button>
          </div>
          <div v-for="(p, i) in presets" :key="p.name + i" class="preset-item">
            <div class="preset-name"><i class="bi bi-bookmark-star-fill"></i> {{ p.name }}</div>
            <div class="preset-actions">
              <button class="link-btn" @click="applyPreset(p)">Terapkan</button>
              <button class="link-btn text-danger" @click="deletePreset(i)">Hapus</button>
            </div>
          </div>
          <div v-if="!presets.length" class="pop-empty">Belum ada preset</div>
        </div>

        <div class="pop-foot">
          <button v-if="tab !== 'preset'" class="link-btn" @click="clearMap(activeMap)">
            {{ tab === "hide" ? "Tampilkan semua (kosongkan sembunyikan)" : "Kosongkan tampilkan saja" }}
          </button>
          <span v-else></span>
          <button class="link-btn" @click="closePop">Tutup</button>
        </div>
      </div>

      <!-- Asisten AI -->
      <div v-if="ai.open" class="ai-drawer" @mousedown.stop>
        <div class="ai-head">
          <div class="ai-title"><i class="bi bi-stars"></i> Asisten AI <small>Laporan PO Linking</small></div>
          <button class="ai-close" @click="ai.open = false"><i class="bi bi-x-lg"></i></button>
        </div>

        <div ref="aiBox" class="ai-msgs">
          <div v-for="(m, i) in ai.messages" :key="i" :class="['ai-msg', m.role]">
            <div class="ai-bubble">{{ m.text }}</div>
            <div v-if="m.applied && m.applied.length" class="ai-applied">
              <span v-for="(a, j) in m.applied" :key="j" class="ai-chip"><i class="bi bi-check2"></i> {{ a }}</span>
            </div>
          </div>
          <div v-if="ai.busy" class="ai-msg ai"><div class="ai-bubble typing">Sedang menganalisis…</div></div>
        </div>

        <div v-if="ai.focus.styles.length" class="ai-focus" title="Perintah berikutnya tanpa menyebut style akan berlaku di lingkup ini. Ketik reset atau batalkan untuk memulai dari awal.">
          <i class="bi bi-bullseye"></i>
          <span>Lingkup: style {{ ai.focus.styles.join(", ") }}</span>
          <button @click="clearAiFocus(true)"><i class="bi bi-x"></i></button>
        </div>

        <div class="ai-suggest">
          <button v-for="s in (ai.chips.length ? ai.chips : aiSuggestions)" :key="s" @click="sendAI(s)">{{ s }}</button>
        </div>

        <div class="ai-input">
          <textarea
            v-model="ai.input"
            rows="1"
            placeholder="Contoh: tampilkan style 1114 dan 1120 saja, tangan soom paling atas"
            @keydown.enter.exact.prevent="sendAI()"
          ></textarea>
          <button :disabled="ai.busy || !ai.input.trim()" @click="sendAI()"><i class="bi bi-send-fill"></i></button>
        </div>
      </div>

      <!-- Toast urungkan -->
      <div v-if="toast.show" class="toast-undo">
        <span>{{ toast.text }}</span>
        <button v-if="toast.undo" @click="runUndo">Urungkan</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

const fmtDate = (s) => {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const num = (v) => (v == null || v === "" ? "0" : Number(v).toLocaleString("id-ID"));
const valOrEmpty = (v) => (!v || v === 0 ? "" : Number(v).toLocaleString("id-ID"));
const footText = (t) => Number(t || 0).toLocaleString("id-ID");

// --- ACCESSOR FIELD ROW ---
const styleOf = (r) => String(r.idp_tls || r.PPO || "");
const colorOf = (r) => String(r.xMColor || "");
const workOf = (r) => String(r.xWorkName || "");
const delivOf = (r) => (r.xFtyDate ? String(r.xFtyDate).slice(0, 10) : "");

/* =====================================================================
   STATE TAMPILAN
   - hideMap : pilihan "Sembunyikan"      (centang = disembunyikan)
   - showMap : pilihan "Tampilkan Saja"   (centang = hanya itu yang tampil)
   Keduanya per style: { self, warna[], workname[], delivery[], size[] }
   Opsi warna/workname/delivery/size hanya berasal dari style tersebut,
   jadi tidak mungkin mismatch. Kedua fitur bisa dipakai bersamaan.
   ===================================================================== */
const GROUPS = [
  { key: "warna", label: "Warna" },
  { key: "workname", label: "Workname" },
  { key: "delivery", label: "Delivery" },
  { key: "size", label: "Size" },
];
const emptySel = () => ({ self: false, warna: [], workname: [], delivery: [], size: [] });

const hideMap = reactive({});
const showMap = reactive({});
const expanded = reactive({});
const collapsed = reactive({});
const tab = ref("hide"); // hide | show | preset
const activeMap = computed(() => (tab.value === "show" ? showMap : hideMap));

const search = ref("");
const sortBy = ref("style"); // style | short | delivery
const compactView = ref(false);
const onlyShortage = ref(false);
const onlyOk = ref(false); // true = hanya warna yang sudah OK (yang kurang disembunyikan)
const recalcTotal = ref(false);

/* =====================================================================
   URUTAN PROSES PER WARNA (geser / AI)
   procOrder[`${style}||${warna}`] = [nama proses, ...] -> urutan baris proses
   (baris proses & baris ringkasan OK/kurang ikut urutan yang sama, dan
   Export Excel otomatis mengikuti karena dibangun dari baris yang sama).
   ===================================================================== */
const procOrder = reactive({});
const orderCount = computed(() => Object.keys(procOrder).length);
const ordKey = (styleKey, colorRaw) => `${styleKey}||${colorRaw}`;

const applyProcOrder = (styleKey, colorRaw, arr) => {
  const ord = procOrder[ordKey(styleKey, colorRaw)];
  if (!ord || !ord.length) return arr;
  const idx = (n) => { const i = ord.indexOf(n); return i < 0 ? 9999 : i; };
  return arr
    .map((p, i) => ({ p, i }))
    .sort((a, b) => idx(a.p.name) - idx(b.p.name) || a.i - b.i)
    .map((x) => x.p);
};

// semua nama proses sebuah style+warna (dari data, sudah mengikuti urutan tersimpan)
const procNamesOf = (styleKey, colorRaw) => {
  const cur = [];
  for (const r of rows.value) {
    if (!r.xTimes) continue;
    if (styleOf(r) !== styleKey || colorOf(r) !== colorRaw) continue;
    const n = r.xWorkName || "-";
    if (!cur.includes(n)) cur.push(n);
  }
  const ord = procOrder[ordKey(styleKey, colorRaw)] || [];
  const idx = (n) => { const i = ord.indexOf(n); return i < 0 ? 9999 : i; };
  return cur.map((n, i) => ({ n, i })).sort((a, b) => idx(a.n) - idx(b.n) || a.i - b.i).map((x) => x.n);
};

// proses yang sedang tampil (urutan layar)
const visibleProcs = (styleKey, colorRaw) => {
  for (const po of poTables.value) {
    if (po.styleKey !== styleKey) continue;
    const c = po.colors.find((x) => x.raw === colorRaw);
    if (c) return c.rows.filter((r) => r.type === "proc").map((r) => r.label);
  }
  return procNamesOf(styleKey, colorRaw);
};

const commitOrder = (styleKey, colorRaw, visibleList) => {
  const rest = procNamesOf(styleKey, colorRaw).filter((n) => !visibleList.includes(n));
  procOrder[ordKey(styleKey, colorRaw)] = [...visibleList, ...rest];
};

const moveProc = (styleKey, colorRaw, name, dir) => {
  const cur = [...visibleProcs(styleKey, colorRaw)];
  const i = cur.indexOf(name);
  if (i < 0) return false;
  const j = dir === "top" ? 0 : dir === "bottom" ? cur.length - 1 : dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= cur.length || j === i) return false;
  cur.splice(i, 1);
  cur.splice(j, 0, name);
  commitOrder(styleKey, colorRaw, cur);
  return true;
};
const moveProcRel = (styleKey, colorRaw, name, target, rel) => {
  const cur = [...visibleProcs(styleKey, colorRaw)];
  if (!cur.includes(name) || !cur.includes(target) || name === target) return false;
  cur.splice(cur.indexOf(name), 1);
  const j = cur.indexOf(target);
  cur.splice(rel === "before" ? j : j + 1, 0, name);
  commitOrder(styleKey, colorRaw, cur);
  return true;
};
// total selisih (negatif = kurang) sebuah proses pada style + warna, dari tabel yang tampil
const procShort = (styleKey, colorRaw, name) => {
  for (const po of poTables.value) {
    if (po.styleKey !== styleKey) continue;
    const c = po.colors.find((x) => x.raw === colorRaw);
    const r = c?.rows.find((x) => x.type === "sum" && x.label === name);
    if (r) return Number(r.total) || 0;
  }
  return 0;
};
const swapProc = (styleKey, colorRaw, a, b) => {
  const cur = [...visibleProcs(styleKey, colorRaw)];
  const i = cur.indexOf(a);
  const j = cur.indexOf(b);
  if (i < 0 || j < 0 || i === j) return false;
  [cur[i], cur[j]] = [cur[j], cur[i]];
  commitOrder(styleKey, colorRaw, cur);
  return true;
};
const reorderProc = (styleKey, colorRaw, from, to) => {
  const cur = [...visibleProcs(styleKey, colorRaw)];
  const i = cur.indexOf(from);
  const j = cur.indexOf(to);
  if (i < 0 || j < 0 || i === j) return false;
  cur.splice(i, 1);
  cur.splice(j, 0, from);
  commitOrder(styleKey, colorRaw, cur);
  return true;
};
const setProcOrder = (styleKey, colorRaw, names) => {
  const cur = visibleProcs(styleKey, colorRaw);
  const first = [];
  names.forEach((n) => { const m = matchName(cur, n); if (m && !first.includes(m)) first.push(m); });
  if (!first.length) return false;
  commitOrder(styleKey, colorRaw, [...first, ...cur.filter((n) => !first.includes(n))]);
  return true;
};
const resetOrder = (styleKeys = null) => {
  Object.keys(procOrder).forEach((k) => {
    if (!styleKeys || styleKeys.includes(k.split("||")[0])) delete procOrder[k];
  });
};
const matchName = (list, v) => {
  const n = norm(v);
  if (!n) return null;
  return list.find((x) => norm(x) === n) || list.find((x) => norm(x).includes(n) || n.includes(norm(x))) || null;
};

/* ---- Geser (drag & drop) + tombol naik/turun di tabel ---- */
const dragProc = reactive({ key: "", name: "", over: "" });
const isMovable = (row) => row.type === "proc" || row.type === "sum";
const dragId = (po, color, row) => `${po.key}|${color.name}|${row.label}`;
const orderSnapshot = (styleKey, colorRaw) => {
  const k = ordKey(styleKey, colorRaw);
  const prev = procOrder[k] ? [...procOrder[k]] : null;
  return () => { if (prev) procOrder[k] = prev; else delete procOrder[k]; };
};
const onProcDragStart = (e, po, color, row) => {
  if (!isMovable(row)) return;
  dragProc.key = ordKey(po.styleKey, color.raw);
  dragProc.name = row.label;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", row.label);
  }
};
const onProcDragOver = (e, po, color, row) => {
  if (!dragProc.name || !isMovable(row) || dragProc.key !== ordKey(po.styleKey, color.raw)) return;
  e.preventDefault();
  dragProc.over = dragId(po, color, row);
};
const onProcDragLeave = (po, color, row) => {
  if (dragProc.over === dragId(po, color, row)) dragProc.over = "";
};
const onProcDragEnd = () => { dragProc.key = ""; dragProc.name = ""; dragProc.over = ""; };
const onProcDrop = (e, po, color, row) => {
  if (!dragProc.name || dragProc.key !== ordKey(po.styleKey, color.raw)) return;
  e.preventDefault();
  const undo = orderSnapshot(po.styleKey, color.raw);
  if (reorderProc(po.styleKey, color.raw, dragProc.name, row.label)) {
    notify(`${color.name}: urutan proses diubah`, undo);
  }
  onProcDragEnd();
};
const moveProcUi = (po, color, name, dir) => {
  const undo = orderSnapshot(po.styleKey, color.raw);
  if (moveProc(po.styleKey, color.raw, name, dir)) notify(`${color.name}: ${name} dipindah`, undo);
};

const norm = (s) => String(s ?? "").trim().toLowerCase();
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensure = (map, idp) => {
  if (!map[idp]) map[idp] = emptySel();
  return map[idp];
};

const optionsByStyle = computed(() => {
  const m = new Map();
  for (const r of rows.value) {
    if (!r.xTimes) continue;
    const idp = styleOf(r);
    if (!m.has(idp)) m.set(idp, { warna: new Set(), workname: new Set(), delivery: new Set(), size: new Set() });
    const o = m.get(idp);
    o.warna.add(colorOf(r));
    o.workname.add(workOf(r));
    o.delivery.add(delivOf(r));
    for (let i = 1; i <= 15; i++) if (r[`xSize${i}`]) o.size.add(String(r[`xSize${i}`]));
  }
  const cmp = (a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, undefined, { numeric: true }));
  const out = {};
  [...m.entries()]
    .sort((a, b) => cmp(a[0], b[0]))
    .forEach(([idp, o]) => {
      out[idp] = {
        warna: [...o.warna].sort(cmp),
        workname: [...o.workname].sort(cmp),
        delivery: [...o.delivery].sort(cmp),
        size: [...o.size], // urutan asli (XS, S, M, ...)
      };
    });
  return out;
});

const optionLabel = (key, v) => {
  if (v === "") return "(Kosong)";
  if (key === "delivery") return fmtDate(v);
  return v;
};

const isSel = (map, idp, g, v) => !!map[idp]?.[g]?.includes(v);
const toggleSel = (map, idp, g, v) => {
  const arr = ensure(map, idp)[g];
  const i = arr.indexOf(v);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(v);
};
const toggleSelf = (map, idp) => {
  const h = ensure(map, idp);
  h.self = !h.self;
};
const setGroup = (map, idp, g, on) => {
  ensure(map, idp)[g] = on ? [...optionsByStyle.value[idp][g]] : [];
};
const selCount = (map, idp) => {
  const h = map[idp];
  if (!h) return 0;
  return (h.self ? 1 : 0) + h.warna.length + h.workname.length + h.delivery.length + h.size.length;
};
const mapCount = (map) => Object.keys(map).reduce((n, k) => n + selCount(map, k), 0);
const hiddenCount = computed(() => mapCount(hideMap));
const showCount = computed(() => mapCount(showMap));
const clearMap = (map) => Object.keys(map).forEach((k) => delete map[k]);

const filtersActive = computed(
  () =>
    hiddenCount.value > 0 ||
    showCount.value > 0 ||
    !!search.value.trim() ||
    onlyShortage.value ||
    onlyOk.value ||
    recalcTotal.value ||
    compactView.value ||
    sortBy.value !== "style" ||
    orderCount.value > 0
);

const resetAll = () => {
  clearMap(hideMap);
  clearMap(showMap);
  search.value = "";
  sortBy.value = "style";
  compactView.value = false;
  onlyShortage.value = false;
  onlyOk.value = false;
  recalcTotal.value = false;
  resetOrder();
  clearAiFocus(); // reset = mulai dari awal lagi, lingkup AI ikut dilepas
};

/* ---- Centang langsung di tabel (kolom / warna / workname / delivery / style) ---- */
const toast = reactive({ show: false, text: "", undo: null });
let toastTimer = null;
const notify = (text, undo = null) => {
  toast.text = text;
  toast.undo = undo;
  toast.show = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.show = false; }, 7000);
};
const runUndo = () => {
  if (toast.undo) toast.undo();
  toast.show = false;
};

const hideItem = (e, g, idp, v) => {
  if (e?.target) e.target.checked = false; // elemen dipakai ulang oleh Vue, jangan biarkan tercentang
  const h = ensure(hideMap, idp);
  let label;
  if (g === "self") {
    h.self = true;
    label = `Style ${idp || "(Kosong)"}`;
  } else {
    if (!h[g].includes(v)) h[g].push(v);
    label = `${GROUPS.find((x) => x.key === g).label} ${optionLabel(g, v)}`;
  }
  notify(`${label} disembunyikan`, () => {
    const cur = hideMap[idp];
    if (!cur) return;
    if (g === "self") cur.self = false;
    else {
      const i = cur[g].indexOf(v);
      if (i >= 0) cur[g].splice(i, 1);
    }
  });
};
const restoreSize = (idp, lb) => {
  const h = hideMap[idp];
  if (h) {
    const i = h.size.indexOf(lb);
    if (i >= 0) h.size.splice(i, 1);
  }
  // jika disembunyikan lewat "Tampilkan Saja", buang pembatasnya
  const s = showMap[idp];
  if (s && s.size.length && !s.size.includes(lb)) s.size.push(lb);
};

/* ---- Popover ---- */
const pop = reactive({ open: false, top: 0, left: 0 });
const popSearch = ref("");
const popInput = ref(null);

const popStyles = computed(() => {
  const q = popSearch.value.trim().toLowerCase();
  return Object.keys(optionsByStyle.value).filter((idp) => !q || idp.toLowerCase().includes(q));
});

const closePop = () => { pop.open = false; };
const togglePop = (ev) => {
  if (pop.open) return closePop();
  const r = ev.currentTarget.getBoundingClientRect();
  pop.left = Math.min(Math.max(8, r.left), window.innerWidth - 470);
  pop.top = r.bottom + 6;
  popSearch.value = "";
  pop.open = true;
  nextTick(() => popInput.value?.focus());
};
const onDocDown = (e) => {
  if (pop.open && !e.target.closest(".filter-pop, .btn-hide-toggle")) closePop();
};

/* ---- Preset (disimpan di browser) ---- */
const PRESET_KEY = "po_linking_presets_v1";
const presets = ref([]);
const presetName = ref("");
const loadPresets = () => {
  try { presets.value = JSON.parse(localStorage.getItem(PRESET_KEY) || "[]"); } catch { presets.value = []; }
};
const persistPresets = () => {
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(presets.value)); } catch { /* abaikan */ }
};
const savePreset = () => {
  const name = presetName.value.trim();
  if (!name) return;
  const snap = JSON.parse(
    JSON.stringify({
      name,
      hide: hideMap,
      show: showMap,
      search: search.value,
      sortBy: sortBy.value,
      compactView: compactView.value,
      onlyShortage: onlyShortage.value,
      onlyOk: onlyOk.value,
      recalcTotal: recalcTotal.value,
      procOrder,
    })
  );
  const i = presets.value.findIndex((p) => p.name === name);
  if (i >= 0) presets.value.splice(i, 1, snap);
  else presets.value.push(snap);
  persistPresets();
  presetName.value = "";
  notify(`Preset "${name}" disimpan`);
};
const applyPreset = (p) => {
  clearMap(hideMap);
  clearMap(showMap);
  Object.entries(p.hide || {}).forEach(([k, v]) => { hideMap[k] = { ...emptySel(), ...v }; });
  Object.entries(p.show || {}).forEach(([k, v]) => { showMap[k] = { ...emptySel(), ...v }; });
  search.value = p.search || "";
  sortBy.value = p.sortBy || "style";
  compactView.value = !!p.compactView;
  onlyShortage.value = !!p.onlyShortage;
  onlyOk.value = !!p.onlyOk;
  recalcTotal.value = !!p.recalcTotal;
  resetOrder();
  clearAiFocus();
  Object.entries(p.procOrder || {}).forEach(([k, v]) => { procOrder[k] = [...v]; });
  closePop();
};
const deletePreset = (i) => {
  presets.value.splice(i, 1);
  persistPresets();
};

/* ---- Penyaringan baris ---- */
const anyStyleShown = computed(() => Object.values(showMap).some((h) => h.self));

const sizeVisible = (idp, label) => {
  if (hideMap[idp]?.size.includes(label)) return false;
  const sh = showMap[idp];
  if (sh?.size.length && !sh.size.includes(label)) return false;
  return true;
};

const searchTerms = computed(() =>
  search.value.split(",").map((t) => norm(t)).filter(Boolean)
);

const rowVisible = (r) => {
  const idp = styleOf(r);
  const c = colorOf(r);
  const w = workOf(r);
  const d = delivOf(r);
  const hd = hideMap[idp];
  if (hd) {
    if (hd.self) return false;
    if (hd.warna.includes(c) || hd.workname.includes(w) || hd.delivery.includes(d)) return false;
  }
  const sh = showMap[idp];
  if (anyStyleShown.value && !sh?.self) return false;
  if (sh) {
    if (sh.warna.length && !sh.warna.includes(c)) return false;
    if (sh.workname.length && !sh.workname.includes(w)) return false;
    if (sh.delivery.length && !sh.delivery.includes(d)) return false;
  }
  return true;
};

const rowMatchesSearch = (r) => {
  if (!searchTerms.value.length) return true;
  const hay = norm(`${styleOf(r)} ${r.PPO || ""} ${r.xBuyer || ""} ${colorOf(r)}`);
  return searchTerms.value.some((t) => hay.includes(t));
};

const filteredRows = computed(() =>
  rows.value.filter((r) => r.xTimes && rowVisible(r) && rowMatchesSearch(r))
);

/* ---- Data untuk tabel (satu per PO) ---- */
const poTables = computed(() => {
  const map = new Map();
  const seenSrc = new Set(); // xTO satu baris PR07 hanya dijumlah sekali per PO/warna/proses

  for (const r of filteredRows.value) {
    const ppo = r.PPO || "-";
    const xTimes = r.xTimes || "";
    const styleKey = styleOf(r);
    const style = styleKey || "-";
    const poKey = `${style}__${ppo}__${xTimes}`;

    if (!map.has(poKey)) {
      const allLabels = [];
      const allKeys = [];
      for (let i = 1; i <= 15; i++) {
        if (r[`xSize${i}`]) {
          allLabels.push(String(r[`xSize${i}`]));
          allKeys.push(i);
        }
      }
      map.set(poKey, {
        key: poKey,
        style,
        styleKey,
        ppo,
        xTimes,
        xShipTot: r.xShipTot || 0,
        xFtyDate: r.xFtyDate || null,
        deliv: delivOf(r),
        buyer: r.xBuyer || "-",
        allLabels,
        allKeys,
        colorsMap: new Map(),
      });
    }

    const po = map.get(poKey);
    const colorKey = r.xMColor || "-";

    if (!po.colorsMap.has(colorKey)) {
      po.colorsMap.set(colorKey, {
        name: colorKey,
        raw: colorOf(r),
        processesMap: new Map(),
        a1: { data: {}, total: 0 },
        kebutuhan: { data: {}, total: 0 },
      });
    }

    const color = po.colorsMap.get(colorKey);
    const procKey = r.xWorkName || "-";

    if (!color.processesMap.has(procKey)) {
      color.processesMap.set(procKey, { name: procKey, raw: workOf(r), data: {}, total: 0, primary: false });
    }
    const proc = color.processesMap.get(procKey);
    if (r.xPrimary === true || Number(r.xPrimary) === 1) proc.primary = true;

    const srcKey = r.pr07Id != null ? `${poKey}|${colorKey}|${procKey}|${r.pr07Id}` : null;
    const addTO = !srcKey || !seenSrc.has(srcKey);
    if (srcKey) seenSrc.add(srcKey);

    po.allKeys.forEach((k) => {
      if (addTO) proc.data[k] = (proc.data[k] || 0) + (Number(r[`xTO${k}`]) || 0);
      // PENGGANTIAN lk_xTO MENJADI xtA1_ (Format Dari PR08)
      color.a1.data[k] = Math.max(color.a1.data[k] || 0, Number(r[`xtA1_${k}`]) || 0);
      color.kebutuhan.data[k] = Math.max(color.kebutuhan.data[k] || 0, Number(r[`xttQty${k}`]) || 0);
    });
  }

  // --- KALKULASI FINAL ("OK" & defisit) ---
  const result = [];

  for (const po of map.values()) {
    const vis = po.allKeys
      .map((k, i) => ({ k, label: po.allLabels[i] }))
      .filter((x) => sizeVisible(po.styleKey, x.label));
    po.sizeKeys = vis.map((x) => x.k);
    po.sizeLabels = vis.map((x) => x.label);
    po.hiddenSizes = po.allLabels.filter((lb) => !sizeVisible(po.styleKey, lb));

    // total dihitung dari semua size, atau hanya size yang tampil (opsi "Total ikut size tampil")
    const calcKeys = recalcTotal.value ? po.sizeKeys : po.allKeys;
    const sumKeys = (data) => calcKeys.reduce((n, k) => n + (data[k] || 0), 0);

    let colors = [];
    const footersMap = new Map();

    for (const color of po.colorsMap.values()) {
      color.a1.total = sumKeys(color.a1.data);
      color.kebutuhan.total = sumKeys(color.kebutuhan.data);

      const processesArray = applyProcOrder(po.styleKey, color.raw, Array.from(color.processesMap.values()));
      const summaries = [];

      // xPrimary = 1: proses-proses primary dalam satu warna & satu style dihitung GABUNGAN per size
      // (jumlah A2 semua proses primary + A1 - kebutuhan). Hasil OK/kurang berlaku untuk semuanya.
      const primaryProcs = processesArray.filter((p) => p.primary);
      const useGroup = primaryProcs.length >= 2;
      const groupData = {};
      if (useGroup) po.allKeys.forEach((k) => { groupData[k] = primaryProcs.reduce((n, p) => n + (p.data[k] || 0), 0); });
      let groupCounted = false;

      for (const proc of processesArray) {
        proc.total = sumKeys(proc.data);
        const inGroup = useGroup && proc.primary;
        const sumObj = { name: proc.name, raw: proc.raw, data: {}, total: 0, grouped: inGroup, groupDup: inGroup && groupCounted };
        const base = inGroup ? groupData : proc.data;
        let rowTotalMinus = 0;

        po.allKeys.forEach((k) => {
          const diff = (base[k] || 0) + (color.a1.data[k] || 0) - (color.kebutuhan.data[k] || 0);
          if (diff >= 0) {
            sumObj.data[k] = "OK";
          } else {
            sumObj.data[k] = diff;
            if (calcKeys.includes(k)) rowTotalMinus += diff;
          }
        });

        sumObj.total = rowTotalMinus;
        summaries.push(sumObj);
        // kekurangan gabungan dihitung sekali saja di footer / total
        footersMap.set(proc.name, (footersMap.get(proc.name) || 0) + (sumObj.groupDup ? 0 : rowTotalMinus));
        if (inGroup) groupCounted = true;
      }

      color.rows = [
        ...processesArray.map((p) => ({ key: "p-" + p.name, type: "proc", label: p.name, raw: p.raw, data: p.data, total: p.total })),
        { key: "a1", type: "a1", label: "A1", data: color.a1.data, total: color.a1.total }, // MENGGANTI LK A1 menjadi A1
        { key: "b1", type: "b1", label: "B1", data: {}, total: 0 },
        { key: "kirim", type: "kirim", label: "Kirim h/ Body", data: {}, total: 0 },
        { key: "keb", type: "keb", label: "Kebutuhan", data: color.kebutuhan.data, total: color.kebutuhan.total },
        ...summaries.map((s) => ({ key: "s-" + s.name, type: "sum", label: s.name, raw: s.raw, data: s.data, total: s.total, grouped: s.grouped, groupDup: s.groupDup })),
      ];
      color.hasShort = summaries.some((s) => s.total < 0);
      colors.push(color);
    }

    colors.sort((a, b) => a.name.localeCompare(b.name));
    if (onlyShortage.value) colors = colors.filter((c) => c.hasShort);
    if (onlyOk.value) colors = colors.filter((c) => !c.hasShort);
    if (!colors.length) continue;

    po.colors = colors;
    po.footers = Array.from(footersMap.entries()).map(([name, total]) => ({ name, total }));
    po.shortTotal = po.footers.reduce((n, f) => n + f.total, 0);
    result.push(po);
  }

  const cmpStyle = (a, b) =>
    a.ppo.localeCompare(b.ppo) ||
    String(a.style).localeCompare(String(b.style)) ||
    String(a.xTimes).localeCompare(String(b.xTimes), undefined, { numeric: true });

  if (sortBy.value === "short") return result.sort((a, b) => a.shortTotal - b.shortTotal || cmpStyle(a, b));
  if (sortBy.value === "delivery") return result.sort((a, b) => (a.deliv || "9999").localeCompare(b.deliv || "9999") || cmpStyle(a, b));
  return result.sort(cmpStyle);
});

const rowsOf = (color) => (compactView.value ? color.rows.filter((r) => r.type === "sum") : color.rows);

const kpi = computed(() => {
  const styles = new Set();
  let colors = 0, colShort = 0, total = 0;
  poTables.value.forEach((po) => {
    styles.add(po.styleKey);
    po.colors.forEach((c) => { colors++; if (c.hasShort) colShort++; });
    total += po.shortTotal;
  });
  return { styles: styles.size, po: poTables.value.length, colors, colShort, total };
});

const allCollapsed = computed(() => poTables.value.length > 0 && poTables.value.every((po) => collapsed[po.key]));
const toggleCollapseAll = () => {
  const to = !allCollapsed.value;
  poTables.value.forEach((po) => { collapsed[po.key] = to; });
};


// Lebar tabel (px) = warna + workname + sizes + gap + jumlah
const W_COLOR = 168, W_WORK = 105, W_SIZE = 72, W_GAP = 56, W_TOTAL = 96;
// Jumlah kolom kosong yang "menjepit" kolom size (kiri & kanan)
const SP_L = 1, SP_R = 1;
const tableWidth = (po) => W_COLOR + W_WORK + W_GAP * (SP_L + SP_R) + W_SIZE * po.sizeKeys.length + W_TOTAL;

// Teks sel tabel HTML
const cellText = (row, k) => {
  if (row.type === "b1" || row.type === "kirim") return "";
  const v = row.data[k];
  if (row.type === "sum") return typeof v === "number" ? v.toLocaleString("id-ID") : v ?? "";
  return valOrEmpty(v);
};
const valClass = (row, k) => {
  if (row.type !== "sum") return "";
  const v = row.data[k];
  if (v === "OK") return "v-ok";
  return typeof v === "number" && v < 0 ? "v-neg" : "";
};
const totalText = (row) => {
  if (row.type === "b1" || row.type === "kirim") return "0";
  if (row.type === "sum") return footText(row.total);
  return valOrEmpty(row.total);
};


// --- FETCH ---
const fetchReport = async () => {
  const f = filter.value;
  if (!f.beginDate || !f.endDate) {
    return Swal.fire("Peringatan", "Tanggal wajib diisi!", "warning");
  }

  loading.value = true;
  try {
    const params = { beginDate: f.beginDate, endDate: f.endDate };
    if (f.edateFrom) params.edateFrom = f.edateFrom;
    if (f.edateTo) params.edateTo = f.edateTo;

    const res = await axios.get(`${API_BASE_URL}/laporan-po-linking`, { params });
    if (res.data.warning) Swal.fire("Peringatan", res.data.warning, "warning");
    rows.value = res.data.data || [];
    clearMap(hideMap);
    clearMap(showMap);
    isDataLoaded.value = true;
  } catch (e) {
    Swal.fire("Error", e.response?.data?.message || "Gagal mengambil data.", "error");
  } finally {
    loading.value = false;
  }
};

/* =====================================================================
   ASISTEN AI
   - Dicoba lewat backend:  POST {API}/laporan-po-linking/ai
   - Kalau backend belum aktif -> otomatis memakai mode lokal (tanpa internet)
   AI hanya boleh menjalankan aksi yang ada di whitelist & sudah divalidasi.
   ===================================================================== */
const ai = reactive({
  open: false,
  busy: false,
  input: "",
  localNoted: false,
  chips: [],
  // lingkup style aktif: perintah berikutnya tanpa menyebut style tetap di lingkup ini
  // sampai user reset / batalkan (locked = lingkup dibuat lewat "tampilkan ... saja")
  focus: { styles: [], locked: false },
  messages: [
    {
      role: "ai",
      text:
        "Hai, selamat datang di chat asisten Anda, ada yang bisa saya bantu?\n\n" +
        "Contoh: “tampilkan style 1114 dan 1120 saja”, lalu lanjut “tampilkan delivery 15 Nov” (tetap di style itu), " +
        "“tukar kerah dan tangan soom”, “balik urutan proses”, “sembunyikan yang sudah OK”, " +
        "“tampilkan semua style yang belum OK”, atau “mana yang paling kurang?”. Ketik “reset” atau “batalkan” untuk mulai dari awal.",
      applied: [],
    },
  ],
});
const aiBox = ref(null);
const GREETING_REPLY = "Hai, selamat datang di chat asisten Anda, ada yang bisa saya bantu?";
const aiSuggestions = [
  "Ringkas kekurangan terbesar",
  "Tampilkan yang belum OK",
  "Sembunyikan yang sudah OK",
  "Urutkan dari kekurangan terbesar",
  "Ciutkan semua",
  "Batalkan",
  "Reset semua",
];
// filter status warna: "ok" = hanya yang sudah OK, "kurang" = hanya yang belum OK, "all" = semua
const setStatus = (v) => {
  onlyShortage.value = v === "kurang";
  onlyOk.value = v === "ok";
};
const clearAiFocus = () => {
  ai.focus.styles = [];
  ai.focus.locked = false;
};
const focusList = () => ai.focus.styles.filter((s) => s in optionsByStyle.value);
const scrollAI = () => nextTick(() => { if (aiBox.value) aiBox.value.scrollTop = aiBox.value.scrollHeight; });

const buildAiContext = () => {
  const styles = Object.entries(optionsByStyle.value)
    .slice(0, 60)
    .map(([idp, o]) => ({
      style: idp,
      warna: o.warna,
      workname: o.workname,
      size: o.size,
      delivery: o.delivery,
      disembunyikan: hideMap[idp] || null,
      tampilkanSaja: showMap[idp] || null,
    }));

  const shortages = [];
  poTables.value.forEach((po) =>
    po.colors.forEach((c) =>
      c.rows
        .filter((r) => r.type === "sum" && r.total < 0 && !r.groupDup)
        .forEach((r) =>
          shortages.push({
            style: po.style,
            ppo: po.ppo,
            po: po.xTimes,
            delivery: po.deliv,
            warna: c.name,
            proses: r.label,
            total: r.total,
            perSize: po.sizeKeys
              .map((k, i) => (typeof r.data[k] === "number" ? `${po.sizeLabels[i]}: ${r.data[k]}` : null))
              .filter(Boolean),
          })
        )
    )
  );
  shortages.sort((a, b) => a.total - b.total);

  // urutan proses yang sedang tampil per style + warna (untuk perintah geser/tukar proses)
  const urutanProses = [];
  const seenOrd = new Set();
  poTables.value.forEach((po) =>
    po.colors.forEach((c) => {
      const k = ordKey(po.styleKey, c.raw);
      if (seenOrd.has(k)) return;
      seenOrd.add(k);
      urutanProses.push({
        style: po.styleKey,
        warna: c.raw,
        urutan: c.rows.filter((r) => r.type === "proc").map((r) => r.label),
      });
    })
  );

  const tampil = poTables.value.slice(0, 80).map((po) => ({
    style: po.style,
    ppo: po.ppo,
    po: po.xTimes,
    delivery: po.deliv,
    kurang: po.shortTotal,
    diciutkan: !!collapsed[po.key],
  }));

  // rincian angka per PO > warna > proses (agar AI bisa menjawab pertanyaan angka apa pun)
  const rincian = [];
  let budget = 130000; // ± 40-50 ribu token
  let terpotong = false;
  for (const po of poTables.value) {
    const per = (r) => po.sizeKeys.map((k) => (typeof r?.data?.[k] === "number" ? r.data[k] : r?.data?.[k] === "OK" ? "OK" : 0));
    const item = {
      style: po.style,
      ppo: po.ppo,
      po: po.xTimes,
      delivery: po.deliv,
      kurangTotal: po.shortTotal,
      size: po.sizeLabels,
      warna: po.colors.map((c) => {
        const byType = (t) => c.rows.find((r) => r.type === t);
        return {
          nama: c.name,
          kebutuhan: per(byType("keb")),
          a1: per(byType("a1")),
          a1Total: byType("a1")?.total ?? 0,
          proses: c.rows
            .filter((r) => r.type === "proc")
            .map((r) => ({
              nama: r.label,
              a2: per(r),
              a2Total: r.total,
              kurang: c.rows.find((x) => x.type === "sum" && x.label === r.label)?.total ?? 0,
            })),
        };
      }),
    };
    const len = JSON.stringify(item).length;
    if (len > budget) { terpotong = true; break; }
    budget -= len;
    rincian.push(item);
  }

  // status OK / kurang per style (dari warna yang sedang tampil)
  const statusMap = {};
  poTables.value.forEach((po) => {
    const e = statusMap[po.style] || (statusMap[po.style] = { ok: new Set(), kurang: new Set() });
    po.colors.forEach((c) => (c.hasShort ? e.kurang : e.ok).add(c.name));
  });
  const statusPerStyle = Object.entries(statusMap)
    .slice(0, 80)
    .map(([style, e]) => ({ style, warnaOk: [...e.ok], warnaKurang: [...e.kurang] }));

  return {
    tanggal: localToday(),
    dataTerload: isDataLoaded.value,
    fokus: { style: focusList(), terkunci: ai.focus.locked },
    statusPerStyle,
    rincian,
    rincianTerpotong: terpotong,
    filterTanggal: { ...filter.value },
    preset: presets.value.map((x) => x.name),
    status: {
      search: search.value,
      ringkas: compactView.value,
      hanyaKurang: onlyShortage.value,
      hanyaOk: onlyOk.value,
      urut: sortBy.value,
      totalIkutSizeTampil: recalcTotal.value,
    },
    kpi: kpi.value,
    styles,
    tampil,
    urutanProses: urutanProses.slice(0, 120),
    kekurangan: shortages.slice(0, 60),
  };
};

/* ---- Validasi & eksekusi aksi ---- */
const resolveStyles = (name) => {
  const all = Object.keys(optionsByStyle.value);
  if (!name) return all;
  const n = norm(name);
  const exact = all.filter((s) => norm(s) === n);
  if (exact.length) return exact;
  return all.filter((s) => norm(s).includes(n) || (norm(s) && n.includes(norm(s))));
};

const resolveValues = (idp, group, values) => {
  const opts = optionsByStyle.value[idp]?.[group] || [];
  const out = [];
  (Array.isArray(values) ? values : [values]).forEach((v) => {
    const n = norm(v);
    if (!n) return;
    if (n === "*" || n === "semua" || n === "all") { opts.forEach((o) => { if (!out.includes(o)) out.push(o); }); return; }
    let hit = opts.filter((o) => norm(o) === n || norm(optionLabel(group, o)) === n);
    if (!hit.length) hit = opts.filter((o) => norm(optionLabel(group, o)).includes(n));
    hit.forEach((h) => { if (!out.includes(h)) out.push(h); });
  });
  return out;
};

// "style" boleh: teks, array teks (banyak style), atau "*" (semua style)
const stylesFrom = (a, emptyMeansAll = true) => {
  const raw = a.styles ?? a.style;
  const all = Object.keys(optionsByStyle.value);
  const list = (Array.isArray(raw) ? raw : [raw]).filter((x) => x != null && String(x).trim() !== "");
  if (!list.length) {
    if (!emptyMeansAll) return [];
    const f = focusList(); // tanpa menyebut style -> tetap di lingkup aktif
    return f.length ? f : all;
  }
  if (list.some((x) => ["*", "semua", "all"].includes(norm(x)))) return all;
  const out = [];
  list.forEach((x) => resolveStyles(x).forEach((idp) => { if (!out.includes(idp)) out.push(idp); }));
  return out;
};

const hasStyleArg = (a) => {
  const r = a.styles ?? a.style;
  if (r == null) return false;
  return Array.isArray(r) ? r.filter((x) => String(x ?? "").trim() !== "").length > 0 : String(r).trim() !== "";
};
const isAllStyle = (a) => {
  const r = a.styles ?? a.style;
  return (Array.isArray(r) ? r : [r]).some((x) => ["*", "semua", "all"].includes(norm(x)));
};
// daftar style target (null = semua style) dengan memperhitungkan lingkup aktif
const scopeKeys = (a) => (hasStyleArg(a) ? stylesFrom(a) : focusList().length ? focusList() : null);

// "warna" boleh: teks, array teks, atau "*" / kosong (semua warna style itu)
const colorsFrom = (idp, a) => {
  const raw = a.warna ?? a.colors;
  const list = (Array.isArray(raw) ? raw : [raw]).filter((x) => x != null && String(x).trim() !== "");
  const all = optionsByStyle.value[idp]?.warna || [];
  if (!list.length || list.some((x) => ["*", "semua", "all"].includes(norm(x)))) return all;
  return resolveValues(idp, "warna", list);
};

const eachStyleColor = (a, fn) => {
  let n = 0;
  stylesFrom(a).forEach((idp) => colorsFrom(idp, a).forEach((c) => { if (fn(idp, c)) n++; }));
  return n;
};

const POS_LABEL = { top: "paling atas", bottom: "paling bawah", up: "naik 1", down: "turun 1", before: "sebelum", after: "sesudah" };

/* ---- Lingkup (fokus) style yang bertahan antar perintah ---- */
const FOCUS_HARD = ["show_only", "scroll_to", "set_focus"];
const FOCUS_SOFT = ["move_process", "swap_process", "set_process_order", "sort_process", "reverse_process_order"];
const updateFocus = (a, bf) => {
  const hard = FOCUS_HARD.includes(a.type);
  if (!hard && !FOCUS_SOFT.includes(a.type)) return;
  if (!hasStyleArg(a)) return;
  if (isAllStyle(a)) {
    if (hard) { clearAiFocus(); bf.changed = true; }
    return;
  }
  const res = stylesFrom(a, false);
  if (!res.length) return;
  const cur = ai.focus.styles;
  if (!hard && cur.length && res.every((s) => cur.includes(s))) return; // masih di dalam lingkup
  if (hard && bf.hard) {
    res.forEach((s) => { if (!ai.focus.styles.includes(s)) ai.focus.styles.push(s); }); // beberapa aksi satu perintah -> gabung
  } else {
    ai.focus.styles = [...res];
  }
  ai.focus.locked = hard;
  if (hard) bf.hard = true;
  bf.changed = true;
};

/* ---- Batalkan (undo) perubahan tampilan ---- */
const undoStack = [];
const snapState = () =>
  JSON.parse(JSON.stringify({
    hideMap, showMap, collapsed, procOrder,
    search: search.value, compact: compactView.value, onlyShortage: onlyShortage.value, onlyOk: onlyOk.value,
    recalc: recalcTotal.value, sortBy: sortBy.value,
  }));
const setObj = (target, src) => {
  Object.keys(target).forEach((k) => delete target[k]);
  Object.assign(target, src || {});
};
const restoreState = (st) => {
  setObj(hideMap, st.hideMap);
  setObj(showMap, st.showMap);
  setObj(collapsed, st.collapsed);
  setObj(procOrder, st.procOrder);
  search.value = st.search;
  compactView.value = st.compact;
  onlyShortage.value = st.onlyShortage;
  onlyOk.value = !!st.onlyOk;
  recalcTotal.value = st.recalc;
  sortBy.value = st.sortBy;
};

const applyActions = async (actions) => {
  const applied = [];
  const list = Array.isArray(actions) ? actions.slice(0, 30) : [];
  if (list.some((a) => a && typeof a.type === "string" && !["undo", "export", "scroll_to", "fetch"].includes(a.type))) {
    undoStack.push(snapState());
    if (undoStack.length > 30) undoStack.shift();
  }
  const bf = { hard: false, changed: false };
  for (const a of list) {
    if (!a || typeof a.type !== "string") continue;
    updateFocus(a, bf);
    switch (a.type) {
      case "undo": {
        const st = undoStack.pop();
        if (st) { restoreState(st); clearAiFocus(); applied.push("Dibatalkan: kembali ke tampilan sebelumnya, lingkup style dilepas"); }
        else applied.push("Tidak ada perubahan yang bisa dibatalkan");
        break;
      }
      case "search":
        search.value = String(a.value ?? "");
        applied.push(a.value ? `Cari: ${a.value}` : "Pencarian dihapus");
        break;
      case "hide":
      case "show_only": {
        const map = a.type === "hide" ? hideMap : showMap;
        const group = a.group || "self";
        let n = 0;
        if (group === "self") {
          // self wajib menyebut style (boleh banyak / "*")
          stylesFrom(a, false).forEach((idp) => { ensure(map, idp).self = true; n++; });
        } else if (GROUPS.some((g) => g.key === group)) {
          const targets = stylesFrom(a);
          // tampilkan saja di lingkup tertentu -> style lain di luar lingkup ikut tersembunyi (konsisten)
          const scoped = a.type === "show_only" && (hasStyleArg(a) ? !isAllStyle(a) : ai.focus.locked);
          targets.forEach((idp) => {
            if (scoped) ensure(showMap, idp).self = true;
            resolveValues(idp, group, a.values).forEach((v) => {
              const arr = ensure(map, idp)[group];
              if (!arr.includes(v)) { arr.push(v); n++; }
            });
          });
          if (!n) {
            const vals = (Array.isArray(a.values) ? a.values : [a.values]).filter((x) => x != null).join(", ");
            applied.push(`⚠ ${group} “${vals}” tidak ada di style ${targets.join(", ")}`);
          }
        }
        if (n) applied.push(`${a.type === "hide" ? "Sembunyikan" : "Tampilkan saja"} ${group === "self" ? "style" : group} (${n})`);
        break;
      }
      case "clear_hide":
      case "clear_show": {
        const map = a.type === "clear_hide" ? hideMap : showMap;
        const targets = scopeKeys(a) || Object.keys(map);
        if (a.group && GROUPS.some((g) => g.key === a.group)) {
          targets.forEach((idp) => { if (map[idp]) map[idp][a.group] = []; });
        } else if (a.group === "self") {
          targets.forEach((idp) => { if (map[idp]) map[idp].self = false; });
        } else {
          targets.forEach((idp) => delete map[idp]);
        }
        applied.push(a.type === "clear_hide" ? "Sembunyikan dikosongkan" : "Tampilkan saja dikosongkan");
        break;
      }
      case "reset":
        resetAll();
        applied.push("Semua direset");
        break;
      case "only_shortage":
        setStatus(a.value !== false ? "kurang" : "all");
        applied.push(onlyShortage.value ? "Hanya yang belum OK (kurang)" : "Semua warna");
        break;
      case "status_filter": {
        const v = ["ok", "kurang", "all"].includes(a.value) ? a.value : "all";
        setStatus(v);
        applied.push(v === "ok" ? "Hanya yang sudah OK" : v === "kurang" ? "Hanya yang belum OK (kurang)" : "Semua status ditampilkan");
        break;
      }
      case "set_focus":
        if (!stylesFrom(a, false).length) applied.push("⚠ Style untuk lingkup tidak ditemukan");
        break;
      case "clear_focus":
        clearAiFocus();
        bf.changed = false;
        applied.push("Lingkup dilepas: semua style");
        break;
      case "compact":
        compactView.value = a.value !== false;
        applied.push(compactView.value ? "Mode ringkas" : "Mode lengkap");
        break;
      case "recalc_total":
        recalcTotal.value = a.value !== false;
        applied.push(recalcTotal.value ? "Total ikut size tampil" : "Total semua size");
        break;
      case "sort":
        if (["style", "short", "delivery"].includes(a.value)) {
          sortBy.value = a.value;
          applied.push(`Urut: ${a.value}`);
        }
        break;

      /* ---- urutan proses per warna ---- */
      case "move_process": {
        const pos = ["top", "bottom", "up", "down", "before", "after"].includes(a.position) ? a.position : "top";
        const raw = a.workname ?? a.proses;
        const names = (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
        const order = pos === "top" ? [...names].reverse() : names; // beberapa proses ke atas: urutan sebutan tetap
        let best = 0;
        order.forEach((nmRaw) => {
          const n = eachStyleColor(a, (idp, c) => {
            const cur = visibleProcs(idp, c);
            const nm = matchName(cur, nmRaw);
            if (!nm) return false;
            if (pos === "before" || pos === "after") {
              const tg = matchName(cur, a.target ?? a.relative);
              return tg ? moveProcRel(idp, c, nm, tg, pos) : false;
            }
            return moveProc(idp, c, nm, pos);
          });
          best = Math.max(best, n);
        });
        const lbl = pos === "before" || pos === "after" ? `${POS_LABEL[pos]} ${a.target ?? ""}` : POS_LABEL[pos];
        if (best) applied.push(`Proses ${names.join(", ")}: ${lbl} (${best} warna)`);
        else applied.push(`⚠ Proses ${names.join(", ")} tidak ditemukan / sudah di posisi itu pada lingkup ini`);
        break;
      }
      case "swap_process": {
        const names = Array.isArray(a.names) ? a.names : [a.a, a.b];
        const n = eachStyleColor(a, (idp, c) => {
          const cur = visibleProcs(idp, c);
          const x = matchName(cur, names[0]);
          const y = matchName(cur, names[1]);
          return x && y ? swapProc(idp, c, x, y) : false;
        });
        if (n) applied.push(`Tukar proses ${names[0]} ↔ ${names[1]} (${n} warna)`);
        else applied.push(`⚠ Proses ${names[0]} dan ${names[1]} tidak ditemukan bersamaan pada lingkup ini`);
        break;
      }
      case "reverse_process_order": {
        const n = eachStyleColor(a, (idp, c) => {
          const cur = [...visibleProcs(idp, c)].reverse();
          if (cur.length < 2) return false;
          commitOrder(idp, c, cur);
          return true;
        });
        applied.push(n ? `Urutan proses dibalik (${n} warna)` : "⚠ Tidak ada proses yang bisa dibalik pada lingkup ini");
        break;
      }
      case "sort_process": {
        const v = ["az", "za", "short", "kurang", "ok"].includes(a.value) ? a.value : "az";
        const cmp = (x, y) => x.localeCompare(y, undefined, { numeric: true });
        const n = eachStyleColor(a, (idp, c) => {
          const cur = [...visibleProcs(idp, c)];
          if (cur.length < 2) return false;
          const sh = (nm) => procShort(idp, c, nm);
          if (v === "az") cur.sort(cmp);
          else if (v === "za") cur.sort((x, y) => cmp(y, x));
          else if (v === "ok") cur.sort((x, y) => sh(y) - sh(x) || cmp(x, y)); // paling aman dulu
          else cur.sort((x, y) => sh(x) - sh(y) || cmp(x, y)); // kekurangan terbesar dulu
          commitOrder(idp, c, cur);
          return true;
        });
        const lbl = { az: "A-Z", za: "Z-A", short: "kekurangan terbesar dulu", kurang: "kekurangan terbesar dulu", ok: "paling OK dulu" }[v];
        applied.push(n ? `Proses diurutkan ${lbl} (${n} warna)` : "⚠ Tidak ada proses yang bisa diurutkan pada lingkup ini");
        break;
      }
      case "set_process_order": {
        const names = Array.isArray(a.order) ? a.order : [];
        const n = names.length ? eachStyleColor(a, (idp, c) => setProcOrder(idp, c, names)) : 0;
        if (n) applied.push(`Urutan proses diatur (${n} warna)`);
        break;
      }
      case "reset_order": {
        resetOrder(scopeKeys(a));
        applied.push("Urutan proses dikembalikan");
        break;
      }

      /* ---- tampilan tabel ---- */
      case "collapse": {
        const to = a.value !== false;
        const keys = scopeKeys(a);
        let n = 0;
        poTables.value.forEach((po) => {
          if (!keys || keys.includes(po.styleKey)) { collapsed[po.key] = to; n++; }
        });
        if (n) applied.push(to ? `Ciutkan ${n} PO` : `Buka ${n} PO`);
        break;
      }

      case "scroll_to": {
        const idp = stylesFrom(a, false)[0];
        const po = poTables.value.find((x) => x.styleKey === idp && (a.po == null || String(x.xTimes) === String(a.po)));
        if (po) {
          collapsed[po.key] = false;
          await nextTick();
          document.querySelector(`[data-po="${po.key}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
          applied.push(`Menuju ${po.style}`);
        }
        break;
      }

      /* ---- data & filter tanggal ---- */
      case "set_filter": {
        const f = filter.value;
        const ymd = /^\d{4}-\d{2}-\d{2}$/;
        const ym = /^\d{4}-\d{2}$/;
        if (ymd.test(a.beginDate || "")) f.beginDate = a.beginDate;
        if (ymd.test(a.endDate || "")) f.endDate = a.endDate;
        if (a.edateFrom === "" || ym.test(a.edateFrom || "")) f.edateFrom = a.edateFrom;
        if (a.edateTo === "" || ym.test(a.edateTo || "")) f.edateTo = a.edateTo;
        applied.push("Filter tanggal diubah");
        break;
      }
      case "fetch":
        clearAiFocus(); // data baru, pilihan tampilan dikosongkan -> lingkup ikut dilepas
        applied.push("Tarik data");
        await fetchReport();
        break;

      /* ---- preset ---- */
      case "save_preset":
        if (a.name && String(a.name).trim()) {
          presetName.value = String(a.name).trim().slice(0, 60);
          savePreset();
          applied.push(`Preset disimpan: ${a.name}`);
        }
        break;
      case "apply_preset":
      case "delete_preset": {
        const n = norm(a.name);
        const i = presets.value.findIndex((x) => norm(x.name) === n);
        const idx = i >= 0 ? i : presets.value.findIndex((x) => norm(x.name).includes(n));
        if (n && idx >= 0) {
          if (a.type === "apply_preset") { applyPreset(presets.value[idx]); applied.push(`Preset dipakai: ${presets.value[idx].name}`); }
          else { applied.push(`Preset dihapus: ${presets.value[idx].name}`); deletePreset(idx); }
        }
        break;
      }

      case "export":
        applied.push("Export Excel");
        setTimeout(() => exportToExcel(), 80);
        break;
      default:
        break;
    }
  }
  if (bf.changed && ai.focus.styles.length) applied.unshift(`Lingkup: style ${ai.focus.styles.join(", ")}`);
  return applied;
};

/* ---- Mode lokal (tanpa server AI) ---- */
const summaryText = () => {
  const k = kpi.value;
  let t = `Saat ini tampil ${k.po} PO dari ${k.styles} style (${k.colors} warna). `;
  t += k.colShort
    ? `${k.colShort} warna masih kurang, total kekurangan ${footText(k.total)}.`
    : "Semua warna sudah OK.";
  const top = [];
  poTables.value.forEach((po) =>
    po.colors.forEach((c) =>
      c.rows.filter((r) => r.type === "sum" && r.total < 0 && !r.groupDup).forEach((r) =>
        top.push({ t: r.total, s: `${po.style} PO${po.xTimes} · ${c.name} · ${r.label}: ${footText(r.total)}` })
      )
    )
  );
  top.sort((a, b) => a.t - b.t);
  if (top.length) t += "\n\nKekurangan terbesar:\n" + top.slice(0, 5).map((x, i) => `${i + 1}. ${x.s}`).join("\n");
  return t;
};

/* Jawaban bila perintah tidak dipahami + contoh yang relevan */
const notUnderstoodReply = () => {
  const s1 = Object.keys(optionsByStyle.value)[0] || "1114";
  return {
    reply:
      "Maaf, saya tidak memahami pertanyaan Anda.\n\nCoba contoh berikut:\n" +
      `• “ciutkan semua” / “buka semua”\n• “tampilkan hanya style ${s1}”\n• “sembunyikan warna BLACK di semua style”\n` +
      "• “tangan soom paling atas di semua warna”\n• “tampilkan yang kurang saja”\n• “mana yang paling kurang?”\n" +
      `• “berapa total kekurangan style ${s1}?”\n• “tarik data” atau “export excel”`,
    actions: [],
    suggestions: ["Mana yang paling kurang?", "Ciutkan semua", "Tampilkan yang kurang saja", "Export excel"],
  };
};

/* Sapaan: hi / halo / selamat pagi dst */
const GREETING_RE =
  /^((hi+|hai+|halo+|hallo+|hello+|helo+|hey+|hei+|hola|assalamu'?alaikum( wr\.? ?wb\.?)?|permisi|selamat (pagi|siang|sore|malam)|pagi|siang|sore|malam|tes|test|ping|p)( (kak|bro|min|admin|ai|bot|asisten|dong|ya|yah|nih|semua|all|claude))*[\s!.,?~]*)+$/;
const isGreeting = (t) => t.length <= 60 && GREETING_RE.test(t);

/* Maksud filter status: "ok" | "kurang" | "all" | null
   - "yang sudah ok jangan ditampilkan" / "sembunyikan yang ok" -> kurang
   - "tampilkan semua style yang ok" / "yang lengkap saja"        -> ok
   - "tampilkan yang belum ok" / "yang kurang saja"              -> kurang
   - "sembunyikan yang kurang"                                   -> ok */
const statusIntent = (t) => {
  const w = ` ${t} `
    .replace(/\b(belum|blm|blom|tidak|ga|gak|nggak|bukan|not)\s+(sudah |udah |sdh )?(ok|okay|lengkap|beres|selesai|aman)\b/g, " xkurang ")
    .replace(/\b(kurang|kekurangan|minus|short|bermasalah)\b/g, " xkurang ")
    .replace(/\b(sudah |udah |sdh |yg |yang )?(ok|okay|lengkap|beres|selesai|aman)\b/g, " xok ");
  const hasOk = /\bxok\b/.test(w);
  const hasBad = /\bxkurang\b/.test(w);
  if (!hasOk && !hasBad) return null;
  const hide = /(sembunyi|hide|jangan (di)?(tampil|munculkan)|gak usah|ga usah|tidak usah|nggak usah|buang|hilangkan|singkirkan|tanpa|kecuali|tutup)/.test(w);
  const show = /(tampil|munculkan|lihat|liat|show|hanya|cuma|saja|aja|fokus|filter|kasih)/.test(w);
  if (!hide && !show) return null;
  if (hasOk && hasBad) return hide ? null : "all";
  if (hasOk) return hide ? "kurang" : "ok";
  return hide ? "ok" : "kurang";
};

/* Perintah cepat: kata kunci jelas -> langsung dijalankan tanpa menunggu AI server */
const quickCommand = (text) => {
  const t = norm(text);
  if (isGreeting(t))
    return {
      reply: GREETING_REPLY,
      actions: [],
      suggestions: ["Mana yang paling kurang?", "Tampilkan yang belum OK", "Sembunyikan yang sudah OK", "Ciutkan semua"],
    };
  if (!t || t.length > 60) return null;
  if (/\?|^(mana|berapa|apa|siapa|kenapa|mengapa|bagaimana|gimana|kapan|kok)( |$)/.test(t)) return null;
  // menyebut style tertentu -> serahkan ke AI agar targetnya tepat
  for (const idp of Object.keys(optionsByStyle.value)) {
    if (idp && new RegExp(`(^|[^a-z0-9])${esc(norm(idp))}($|[^a-z0-9])`).test(t)) return null;
  }
  const R = (reply, ...actions) => ({ reply, actions, suggestions: ["Batalkan", "Buka semua", "Mana yang paling kurang?"] });
  if (/(lepas|hapus|reset|batal(kan)?|keluar dari).*(lingkup|fokus)/.test(t) || /^(tampilkan|lihat|tampil|buka)? ?semua style$/.test(t))
    return R("Lingkup style dilepas, perintah berikutnya berlaku untuk semua style.", { type: "clear_focus" }, ...(/semua style/.test(t) ? [{ type: "clear_show" }] : []));
  if (/(reset|kembalikan|normalkan|balikin).*(urutan|proses)/.test(t)) return R("Urutan proses dikembalikan.", { type: "reset_order" });
  if (/(\bbalik\b|bolak.?balik|terbalik|reverse).*(urutan|proses)|(urutan|proses).*(\bdibalik\b|\bbalik\b|terbalik)/.test(t))
    return R("Urutan proses dibalik (Excel ikut urutan ini).", { type: "reverse_process_order" });
  if (/(urut|sort|susun|atur).*(proses|workname)/.test(t)) {
    if (/(a-?z|abjad|alfabet|nama)/.test(t) && !/z-?a/.test(t)) return R("Proses diurutkan A-Z.", { type: "sort_process", value: "az" });
    if (/z-?a/.test(t)) return R("Proses diurutkan Z-A.", { type: "sort_process", value: "za" });
    if (/(kurang|minus|short)/.test(t)) return R("Proses diurutkan dari kekurangan terbesar.", { type: "sort_process", value: "short" });
    if (/(ok|aman|lengkap)/.test(t)) return R("Proses diurutkan dari yang paling OK.", { type: "sort_process", value: "ok" });
  }
  if (/(batalkan|batal|undo|kembalikan|balikin|seperti (tadi|semula)|semula|yang tadi|mundur)/.test(t) && !/(urutan|proses)/.test(t))
    return R("Perubahan terakhir dibatalkan, tampilan dikembalikan seperti sebelumnya.", { type: "undo" });
  if (/^(reset|bersihkan|kosongkan|hapus filter)( |$)/.test(t)) return R("Semua pencarian, filter, dan tampilan direset.", { type: "reset" });
  if (/(buka semua|bentang|expand|lebarkan|buka tabel|buka lagi)/.test(t)) return R("Semua tabel PO dibuka.", { type: "collapse", value: false });
  if (/(ciut|collapse|tutup semua|tutup tabel|lipat)/.test(t)) return R("Semua tabel PO diciutkan.", { type: "collapse", value: true });
  if (/(export|ekspor|unduh|download)/.test(t)) return R("Mengexport tampilan saat ini ke Excel.", { type: "export" });
  if (/(tarik data|muat ulang|refresh|ambil data|load data)/.test(t)) return R("Menarik data terbaru.", { type: "fetch" });
  if (/(mode lengkap|tampilan lengkap|mode detail)/.test(t)) return R("Mode lengkap diaktifkan.", { type: "compact", value: false });
  if (/(mode ringkas|tampilan ringkas|ringkas tabel|ringkaskan tabel|compact)/.test(t)) return R("Mode ringkas diaktifkan.", { type: "compact", value: true });
  if (/(semua warna|tanpa filter kurang|tampilkan semua warna)/.test(t)) return R("Menampilkan semua warna.", { type: "only_shortage", value: false });
  const st = statusIntent(t);
  if (st)
    return R(
      st === "ok"
        ? "Hanya menampilkan warna yang sudah OK (yang masih kurang disembunyikan)."
        : st === "kurang"
        ? "Hanya menampilkan warna yang belum OK; yang sudah OK tidak ditampilkan."
        : "Semua status ditampilkan (OK dan kurang).",
      { type: "status_filter", value: st }
    );
  if (/(total ikut size|hitung ulang total)/.test(t)) return R("Total mengikuti size yang tampil.", { type: "recalc_total", value: true });
  if (/^(urut|sort)/.test(t) && !/(proses|workname)/.test(t)) {
    const val = /(kurang|short|minus)/.test(t) ? "short" : /(delivery|kirim|tanggal)/.test(t) ? "delivery" : "style";
    return R("Tabel diurutkan.", { type: "sort", value: val });
  }
  return null;
};

const localAssistant = (text) => {
  const t = norm(text);
  if (isGreeting(t)) return { reply: GREETING_REPLY, actions: [] };
  const stI = statusIntent(t);
  if (stI) {
    const mentioned = Object.keys(optionsByStyle.value).filter(
      (idp) => idp && new RegExp(`(^|[^a-z0-9])${esc(norm(idp))}($|[^a-z0-9])`).test(t)
    );
    const acts = [];
    if (mentioned.length && !/(sembunyi|hide|buang|hilangkan|singkirkan)/.test(t)) acts.push({ type: "show_only", style: mentioned, group: "self" });
    acts.push({ type: "status_filter", value: stI });
    return {
      reply: stI === "ok" ? "Hanya menampilkan yang sudah OK." : stI === "kurang" ? "Hanya menampilkan yang belum OK; yang sudah OK tidak ditampilkan." : "Semua status ditampilkan.",
      actions: acts,
    };
  }
  const wantHide = /(sembunyi|hide|buang|singkirkan|hilangkan)/.test(t);
  const wantOnly = /(hanya|saja|cuma|fokus|tampilkan|lihat|show)/.test(t);

  if (/(reset|bersihkan|hapus filter|tampilkan semua|kembalikan)/.test(t))
    return { reply: "Semua pencarian, filter, pilihan tampilan, dan lingkup style sudah dikembalikan dari awal.", actions: [{ type: "reset" }] };
  if (/(export|unduh|download|excel)/.test(t))
    return { reply: "Mengexport tampilan saat ini ke Excel.", actions: [{ type: "export" }] };
  if (/(ringkasan|rangkum|summary|paling kurang|terbesar|apa yang kurang|mana yang kurang)/.test(t)) {
    const acts = /(urut|sort)/.test(t) ? [{ type: "sort", value: "short" }] : [];
    return { reply: summaryText(), actions: acts };
  }
  if (/(urut|sort)/.test(t) && !/(proses|workname)/.test(t)) {
    const v = /(kurang|short)/.test(t) ? "short" : /(delivery|kirim|tanggal)/.test(t) ? "delivery" : "style";
    return { reply: "Tabel diurutkan.", actions: [{ type: "sort", value: v }] };
  }
  if (/(yang kurang|kekurangan saja|hanya kurang|minus saja|belum ok)/.test(t))
    return { reply: "Hanya menampilkan warna yang masih kurang.", actions: [{ type: "only_shortage", value: true }] };
  if (/(mode ringkas|compact|ringkas saja)/.test(t))
    return { reply: "Mode ringkas diaktifkan (hanya baris OK / kurang).", actions: [{ type: "compact", value: true }] };

  const styleHits = [];
  const groupHits = [];
  for (const [idp, o] of Object.entries(optionsByStyle.value)) {
    if (idp && new RegExp(`(^|[^a-z0-9])${esc(norm(idp))}($|[^a-z0-9])`).test(t)) styleHits.push(idp);
    for (const g of GROUPS) {
      for (const v of o[g.key]) {
        if (v === "") continue;
        const nv = norm(g.key === "size" ? optionLabel(g.key, v).split(" (")[0] : optionLabel(g.key, v));
        if (nv.length < 2) continue;
        if (new RegExp(`(^|[^a-z0-9])${esc(nv)}($|[^a-z0-9])`).test(t)) groupHits.push({ idp, group: g.key, value: v });
      }
    }
  }

  // tanpa menyebut style -> tetap di lingkup style yang sedang aktif
  const fl = focusList();
  const scopedHits = !styleHits.length && fl.length ? groupHits.filter((h) => fl.includes(h.idp)) : groupHits;
  const styleArg = styleHits.length ? { style: styleHits } : {};

  if (/(urutan|proses)/.test(t) && /(\bbalik\b|terbalik|reverse)/.test(t))
    return { reply: "Urutan proses dibalik.", actions: [{ type: "reverse_process_order", ...styleArg }] };
  if (/(urut|sort|susun)/.test(t) && /proses/.test(t) && /(a-?z|abjad|alfabet|kurang|minus)/.test(t))
    return {
      reply: /(kurang|minus)/.test(t) ? "Proses diurutkan dari kekurangan terbesar." : "Proses diurutkan A-Z.",
      actions: [{ type: "sort_process", value: /(kurang|minus)/.test(t) ? "short" : "az", ...styleArg }],
    };

  // geser / tukar urutan proses per warna
  const wantMove = /(pindah|geser|naik|turun|tukar|swap|letakkan|taruh|paling atas|paling bawah|di atas|di bawah|ke atas|ke bawah|urutkan proses)/.test(t);
  const procHits = scopedHits.filter((h) => h.group === "workname");
  if (wantMove && !wantHide && procHits.length) {
    const byStyle = new Map();
    procHits.forEach((h) => { if (!byStyle.has(h.idp)) byStyle.set(h.idp, []); byStyle.get(h.idp).push(h.value); });
    const actions = [];
    for (const [idp, names] of byStyle) {
      const cols = scopedHits.filter((h) => h.idp === idp && h.group === "warna").map((h) => h.value);
      const base = { style: idp, warna: cols.length ? cols : "*" };
      if (/(tukar|swap)/.test(t) && names.length >= 2) actions.push({ type: "swap_process", ...base, names: names.slice(0, 2) });
      else {
        const pos = /(paling bawah|terbawah|ke bawah di akhir)/.test(t) ? "bottom"
          : /(turun|di bawah|ke bawah)/.test(t) ? "down"
          : /(naik|ke atas)/.test(t) && !/(paling atas|teratas)/.test(t) ? "up" : "top";
        names.forEach((nm) => actions.push({ type: "move_process", ...base, workname: nm, position: pos }));
      }
    }
    return { reply: "Urutan proses diubah (Excel ikut urutan ini).", actions };
  }

  if ((wantHide || wantOnly) && (styleHits.length || groupHits.length)) {
    const type = wantHide ? "hide" : "show_only";
    const gh = styleHits.length ? groupHits.filter((h) => styleHits.includes(h.idp)) : scopedHits;
    const actions = [];
    if (gh.length) gh.forEach((h) => actions.push({ type, style: h.idp, group: h.group, values: [h.value] }));
    else styleHits.forEach((idp) => actions.push({ type, style: idp, group: "self" }));
    return {
      reply: `${wantHide ? "Menyembunyikan" : "Menampilkan saja"}: ${
        gh.length ? gh.map((h) => optionLabel(h.group, h.value)).join(", ") : styleHits.join(", ")
      }.`,
      actions,
    };
  }

  if (/(cari|search|temukan)/.test(t)) {
    const q = text.replace(/^.*?(cari|search|temukan)\s*/i, "").trim();
    if (q) return { reply: `Mencari “${q}”.`, actions: [{ type: "search", value: q }] };
  }

  return notUnderstoodReply();
};

const sendAI = async (preset) => {
  const text = String(preset ?? ai.input).trim();
  if (!text || ai.busy) return;
  ai.input = "";
  ai.messages.push({ role: "user", text });
  ai.busy = true;
  scrollAI();

  let res = quickCommand(text);
  if (!res) try {
    const history = ai.messages
      .slice(-9, -1)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text + (m.applied && m.applied.length ? `\n[aksi dijalankan: ${m.applied.join("; ")}]` : ""),
      }));
    const r = await axios.post(
      `${API_BASE_URL}/laporan-po-linking/ai`,
      { message: text, history, context: buildAiContext() },
      { timeout: 60000 }
    );
    res = r.data?.data || r.data;
    if (!res || typeof res.reply !== "string") throw new Error("format");
  } catch (e) {
    res = localAssistant(text);
    if (!ai.localNoted) {
      res.reply = "ℹ️ Server AI belum aktif, saya pakai mode lokal.\n\n" + res.reply;
      ai.localNoted = true;
    }
  }

  const applied = await applyActions(res.actions);
  ai.messages.push({ role: "ai", text: res.reply, applied });
  ai.chips = Array.isArray(res.suggestions) ? res.suggestions.filter((x) => typeof x === "string").slice(0, 4) : [];
  ai.busy = false;
  scrollAI();
};

// --- EXCEL EXPORT (layout sama dengan tampilan) ---
const exportToExcel = async () => {
  if (!poTables.value.length) return Swal.fire("Info", "Tidak ada data untuk diexport.", "info");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Laporan PO Linking", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: false }],
  });

  const thick = { style: "thin", color: { argb: "FF000000" } };
  const thin = { style: "thin", color: { argb: "FF000000" } };
  const fillTitle = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
  const center = { horizontal: "center", vertical: "middle" };
  const NUMFMT = "#,##0";

  const maxN = Math.max(...poTables.value.map((p) => p.sizeKeys.length));
  const sizeStart = 3 + SP_L; // kolom size pertama (setelah spacer kiri)
  const colTot = sizeStart + maxN + SP_R; // kolom JUMLAH (sejajar untuk semua tabel)
  const colGap = colTot - 1; // kolom terakhir sebelum JUMLAH

  const setSide = (r, c, side, st) => {
    const cell = ws.getCell(r, c);
    cell.border = { ...(cell.border || {}), [side]: st };
  };
  const thinRect = (r1, c1, r2, c2) => {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++) ws.getCell(r, c).border = { top: thin, bottom: thin, left: thin, right: thin };
  };
  // garis tebal di sisi luar kotak (+ sisi tetangga agar tidak bentrok)
  const thickRect = (r1, c1, r2, c2) => {
    for (let c = c1; c <= c2; c++) {
      setSide(r1, c, "top", thick);
      setSide(r2, c, "bottom", thick);
      if (r1 > 1) setSide(r1 - 1, c, "bottom", thick);
      setSide(r2 + 1, c, "top", thick);
    }
    for (let r = r1; r <= r2; r++) {
      setSide(r, c1, "left", thick);
      setSide(r, c2, "right", thick);
      if (c1 > 1) setSide(r, c1 - 1, "right", thick);
      setSide(r, c2 + 1, "left", thick);
    }
  };

  const merges = [];
  // Sel gabungan: border master = kotak penuh (slave menyalin style master)
  const mergeBox = (r1, c1, r2, c2) => {
    thickRect(r1, c1, r2, c2);
    ws.getCell(r1, c1).border = { top: thick, left: thick, bottom: thick, right: thick };
    if (r2 > r1 || c2 > c1) merges.push([r1, c1, r2, c2]);
  };

  let currRow = 1;

  poTables.value.forEach((po) => {
    const N = po.sizeKeys.length;

    // ===== BARIS 1: idp_tls | judul PO | buyer =====
    const r1 = currRow;
    thinRect(r1, 1, r1, colTot);

    const cIdp = ws.getCell(r1, 1);
    cIdp.value = po.style;
    cIdp.font = { bold: true };
    cIdp.alignment = center;
    mergeBox(r1, 1, r1, 1);

    const cTitle = ws.getCell(r1, 2);
    cTitle.value = `${po.ppo} PO${po.xTimes} QTY: ${num(po.xShipTot)} (${fmtDate(po.xFtyDate)})`;
    cTitle.fill = fillTitle;
    cTitle.font = { bold: true };
    cTitle.alignment = center;
    mergeBox(r1, 2, r1, colGap);

    const cBuyer = ws.getCell(r1, colTot);
    cBuyer.value = po.buyer;
    cBuyer.font = { bold: true };
    cBuyer.alignment = center;
    mergeBox(r1, colTot, r1, colTot);
    currRow++;

    // ===== BARIS 2: header size =====
    const r2 = currRow;
    thinRect(r2, 1, r2, colTot);
    po.sizeLabels.forEach((sz, idx) => {
      const c = ws.getCell(r2, sizeStart + idx);
      c.value = sz;
      c.font = { bold: true };
      c.alignment = center;
    });
    const cJml = ws.getCell(r2, colTot);
    cJml.value = "JUMLAH";
    cJml.font = { bold: true };
    cJml.alignment = center;
    for (let c = 1; c <= colTot; c++) setSide(r2, c, "bottom", thick);
    setSide(r2, 1, "left", thick);
    setSide(r2, colTot, "right", thick);
    currRow++;

    // ===== PER WARNA =====
    po.colors.forEach((color) => {
      const s = currRow;

      color.rows.filter((r) => r.type === "sum").forEach((row, i) => {
        const rr = currRow;

        if (i === 0) {
          const cc = ws.getCell(rr, 1);
          cc.value = color.name;
          cc.font = { bold: true };
          cc.alignment = { ...center, wrapText: true };
        }

        const cw = ws.getCell(rr, 2);
        cw.value = row.label;
        cw.alignment = { ...center, wrapText: true };
        if (["proc", "keb", "sum"].includes(row.type)) cw.font = { bold: true };
        const lines = Math.ceil(String(row.label).length / 13);
        if (lines > 1) ws.getRow(rr).height = lines * 15;

        po.sizeKeys.forEach((k, idx) => {
          const c = ws.getCell(rr, sizeStart + idx);
          let v = null;
          if (row.type === "sum") v = row.data[k];
          else if (["proc", "a1", "keb"].includes(row.type)) v = row.data[k] || null;
          c.value = v;
          c.numFmt = NUMFMT;
          c.alignment = center;
          c.font = { bold: true, color: { argb: "FF000000" } };
        });

        const ct = ws.getCell(rr, colTot);
        if (row.type === "b1" || row.type === "kirim") ct.value = 0;
        else if (row.type === "sum") ct.value = row.total;
        else ct.value = row.total || null;
        ct.numFmt = NUMFMT;
        ct.font = { bold: true, color: { argb: "FF000000" } };
        ct.alignment = center;
        currRow++;
      });

      const e = currRow - 1;
      thinRect(s, 1, e, colTot);

      // garis tebal pembatas per warna: kotak kolom warna + atas/bawah grup + sisi kanan
      for (let c = 1; c <= colTot; c++) {
        setSide(s, c, "top", thick);
        setSide(e, c, "bottom", thick);
        setSide(s - 1, c, "bottom", thick);
        setSide(e + 1, c, "top", thick);
      }
      for (let r = s; r <= e; r++) setSide(r, colTot, "right", thick);
      mergeBox(s, 1, e, 1);
    });

    // ===== FOOTER: nilai tepat di bawah kolom JUMLAH =====
    po.footers.forEach((foot) => {
      const rr = currRow;
      const cl = ws.getCell(rr, 1);
      cl.value = `TOTAL KEKURANGAN ${foot.name}`;
      cl.alignment = center;
      mergeBox(rr, 1, rr, colGap);

      const cv = ws.getCell(rr, colTot);
      cv.value = foot.total;
      cv.numFmt = NUMFMT;
      cv.font = { bold: true, color: { argb: "FF000000" } };
      cv.alignment = center;
      mergeBox(rr, colTot, rr, colTot);
      currRow++;
    });

    currRow += 1; // 1 baris kosong antar tabel
  });

  merges.forEach((m) => ws.mergeCells(...m));

  // Lebar kolom
  ws.getColumn(1).width = 24;
  ws.getColumn(2).width = 16;
  for (let c = 3; c < colTot; c++) ws.getColumn(c).width = 8;
  for (let c = sizeStart; c < sizeStart + maxN; c++) ws.getColumn(c).width = 9;
  ws.getColumn(colTot).width = 13;

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Laporan_PO_Linking_${filter.value.endDate}.xlsx`);
};

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => { localStorage.clear(); window.location.href = "/login"; };

onMounted(() => {
  document.addEventListener("mousedown", onDocDown);
  loadPresets();
});
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocDown);
  clearTimeout(toastTimer);
});
</script>

<style scoped>
.report-root {
  --header-h: 56px;
  --ink: #0f172a;
  --muted: #64748b;
  --line: #e2e8f0;
  --edge: #000;
  --accent: #4f46e5;
  --grid: #e2e8f0;
  height: 100vh;
  padding-top: var(--header-h);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
  color: var(--ink);
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
}

.report-body { flex: 1 1 auto; min-height: 0; display: flex; position: relative; }
.report-main {
  flex: 1 1 auto; min-width: 0; min-height: 0;
  display: flex; flex-direction: column; gap: 14px;
  padding: 18px 24px;
  transition: margin-left 0.3s ease-in-out;
}
.content-shifted { margin-left: 250px; }

.page-head { display: flex; align-items: center; gap: 14px; flex: 0 0 auto; }
.page-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #6366f1, #4338ca);
  color: #fff; font-size: 1.15rem;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
}
.page-title { font-size: 1.25rem; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
.page-sub { margin: 0; font-size: 0.8rem; color: var(--muted); }

.panel {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03);
}

.filter-bar { flex: 0 0 auto; display: flex; gap: 14px; align-items: end; padding: 14px 18px; flex-wrap: wrap; }
.field { min-width: 160px; flex: 1; }
.field label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.04em; }
.field .form-control { border-color: var(--line); font-size: 0.85rem; border-radius: 8px; }
.field .form-control:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
.field-action { display: flex; gap: 8px; flex: 0 0 auto; }

.table-panel { position: relative; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: #fff; }
.table-toolbar { flex: 0 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 10px 18px; border-bottom: 1px solid var(--line); background: #fcfcfd; }
.filter-chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.table-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 20px; background: #f8fafc; }

/* ======== TABEL (template mengikuti Excel) ======== */
.po-table-container {
  display: block; width: max-content;
  margin: 0 0 28px; padding: 14px;
  background: #fff; border: 1px solid var(--line); border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.table-excel {
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.8rem;
  font-family: Calibri, "Segoe UI", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}
.table-excel col.col-color { width: 168px; }
.table-excel col.col-work { width: 105px; }
.table-excel col.col-size { width: 72px; }
.table-excel col.col-gap { width: 56px; }
.table-excel col.col-total { width: 96px; }

.table-excel td {
  border: 1px solid #c5cfdb;
  padding: 3px 6px;
  min-height: 22px;
  line-height: 1.35;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  background: #fff;
  color: #111;
}
.table-excel .cell-gap { padding: 0; }

/* Header */
.cell-idp { border: 2px solid var(--edge) !important; font-weight: 700; }
.cell-po-title { border: 2px solid var(--edge) !important; background: #d9d9d9 !important; font-weight: 700; }
.cell-buyer { border: 2px solid var(--edge) !important; font-weight: 700; }
.tr-header-size td { border-bottom: 2px solid var(--edge); font-weight: 700; }
.tr-header-size td:first-child { border-left: 2px solid var(--edge); }
.cell-jumlah { border-left: 2px solid var(--edge) !important; border-right: 2px solid var(--edge) !important; }

/* Kolom warna: kotak tebal pembatas tiap warna */
.cell-color {
  border: 2px solid var(--edge) !important;
  font-weight: 700;
  white-space: normal;
  word-break: break-word;
}
.grp-first td { border-top: 2px solid var(--edge); }
.grp-last td { border-bottom: 2px solid var(--edge); }
.cell-work { border-left: 2px solid var(--edge) !important; white-space: normal; padding: 4px 6px; }
.cell-total { font-weight: 700; border-left: 2px solid var(--edge) !important; border-right: 2px solid var(--edge) !important; }

/* Jenis baris */
.r-proc .cell-work, .r-keb .cell-work, .r-sum .cell-work { font-weight: 700; }
.r-proc .cell-val, .r-proc .cell-total { color: #c00000; font-weight: 700; }
.r-sum .cell-val { font-weight: 700; }
.r-keb td:not(.cell-color) { background: #fce4e4 !important; font-weight: 700; }

/* Status angka */
.v-ok { color: #188038 !important; }
.v-neg { color: #c00000 !important; }

/* Footer */
.cell-foot-label { border: 2px solid var(--edge) !important; font-weight: 400; }
.cell-foot-total { border: 2px solid var(--edge) !important; font-weight: 700; }

.loading-overlay { position: absolute; inset: 0; z-index: 10; background: rgba(255, 255, 255, 0.65); display: flex; align-items: center; justify-content: center; }

/* Popover */
.filter-pop {
  position: fixed; width: 420px; max-height: 70vh; z-index: 2000;
  display: flex; flex-direction: column;
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.16); font-size: 0.8rem;
  overflow: hidden;
}
.pop-head { padding: 14px 14px 10px; border-bottom: 1px solid #eef2f6; background: #fcfcfd; }
.pop-title { font-weight: 700; font-size: 0.9rem; }
.pop-hint { color: var(--muted); margin: 2px 0 8px; font-size: 0.74rem; }
.pop-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 6px 14px; }
.pop-foot { display: flex; justify-content: space-between; padding: 10px 14px; border-top: 1px solid #eef2f6; background: #fcfcfd; }
.idp-block { border-bottom: 1px solid #f1f5f9; padding: 5px 0; }
.idp-row { display: flex; align-items: center; gap: 4px; }
.idp-caret { background: none; border: none; padding: 2px 6px; color: var(--muted); cursor: pointer; border-radius: 6px; }
.idp-caret:hover { background: #f1f5f9; }
.idp-label { flex: 1; }
.idp-detail { margin: 4px 0 8px 26px; padding-left: 12px; border-left: 2px solid #e0e7ff; }
.idp-detail.dim { opacity: 0.45; }
.grp { margin-bottom: 10px; }
.grp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
.grp-title { font-weight: 700; color: #3730a3; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; }
.link-btn { background: none; border: none; color: #4f46e5; font-size: 0.74rem; cursor: pointer; padding: 0; }
.link-btn:hover { text-decoration: underline; }
.pop-item { display: flex; align-items: center; gap: 8px; padding: 3px 0; cursor: pointer; margin: 0; }
.pop-empty { text-align: center; color: var(--muted); padding: 12px; }

@media (max-width: 991.98px) {
  .content-shifted { margin-left: 0; opacity: 0.5; pointer-events: none; }
}

/* ======== TOOLBAR, KPI, PENCARIAN ======== */
.table-toolbar { flex-wrap: wrap; gap: 10px; }
.tb-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tb-grow { flex: 1 1 380px; }
.search-box {
  position: relative; display: flex; align-items: center;
  flex: 1 1 260px; max-width: 420px; min-width: 220px;
}
.search-box > i { position: absolute; left: 11px; color: var(--muted); font-size: 0.8rem; pointer-events: none; }
.search-box input {
  width: 100%; height: 31px; padding: 0 30px 0 32px;
  border: 1px solid var(--line); border-radius: 999px;
  font-size: 0.82rem; background: #fff; outline: none;
}
.search-box input:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
.search-clear { position: absolute; right: 8px; border: none; background: none; color: var(--muted); font-size: 0.7rem; padding: 2px 4px; }
.sort-select { width: 190px; border-radius: 8px; font-size: 0.8rem; }
.btn-ai { color: #fff; border: none; background: linear-gradient(135deg, #8b5cf6, #4f46e5); }
.btn-ai:hover { color: #fff; filter: brightness(1.08); }

.kpi-strip { flex: 0 0 auto; display: flex; gap: 10px; padding: 12px 18px 0; flex-wrap: wrap; }
.kpi {
  display: flex; flex-direction: column; min-width: 120px; padding: 8px 14px;
  background: #f8fafc; border: 1px solid var(--line); border-radius: 10px;
}
.kpi-label { font-size: 0.66rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
.kpi-val { font-size: 1.15rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.text-bad { color: #c00000; }
.text-good { color: #188038; }

/* ======== BAR PER PO ======== */
.po-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.bar-btn { border: 1px solid var(--line); background: #fff; border-radius: 6px; width: 24px; height: 24px; display: grid; place-items: center; color: var(--muted); font-size: 0.7rem; }
.bar-btn:hover { background: #f1f5f9; }
.bar-title { font-weight: 700; font-size: 0.85rem; }
.badge-short { font-size: 0.7rem; font-weight: 700; padding: 2px 9px; border-radius: 999px; }
.badge-short.bad { background: #fee2e2; color: #b91c1c; }
.badge-short.good { background: #dcfce7; color: #15803d; }
.chip-restore {
  font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; cursor: pointer;
  background: #fef3c7; color: #92400e; border: 1px dashed #f59e0b;
}
.chip-restore:hover { background: #fde68a; }

/* ======== CENTANG DI TABEL ======== */
.table-excel td { position: relative; }
.mini-check {
  position: absolute; left: 3px; top: 3px; margin: 0; line-height: 1;
  opacity: 0; transition: opacity 0.15s; cursor: pointer; z-index: 2;
}
.mini-check input { width: 11px; height: 11px; margin: 0; cursor: pointer; accent-color: #dc2626; }
.po-table-container:hover .mini-check { opacity: 0.45; }
.table-excel td:hover > .mini-check { opacity: 1; }

.empty-result { text-align: center; color: var(--muted); padding: 48px 16px; }
.empty-result i { font-size: 2rem; display: block; margin-bottom: 8px; color: #94a3b8; }

/* ======== POPOVER (tab) ======== */
.filter-pop { width: 460px; }
.pop-tabs { display: flex; gap: 4px; margin-bottom: 10px; background: #eef2f7; padding: 3px; border-radius: 10px; }
.pop-tabs button {
  flex: 1; border: none; background: transparent; padding: 6px 8px; border-radius: 8px;
  font-size: 0.76rem; font-weight: 600; color: #475569;
}
.pop-tabs button.active { background: #fff; color: #3730a3; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12); }
.tab-badge { background: #f59e0b; color: #111; border-radius: 999px; font-size: 0.65rem; padding: 0 6px; margin-left: 4px; }
.tab-badge.info { background: #38bdf8; }
.preset-add { display: flex; gap: 6px; margin-bottom: 10px; }
.preset-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
.preset-name { font-weight: 600; }
.preset-name i { color: #f59e0b; margin-right: 4px; }
.preset-actions { display: flex; gap: 12px; }

/* ======== ASISTEN AI ======== */
.ai-drawer {
  position: fixed; right: 16px; bottom: 16px; z-index: 2100;
  width: min(390px, calc(100vw - 24px)); height: min(640px, 82vh);
  display: flex; flex-direction: column; overflow: hidden;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.22);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif; font-size: 0.82rem;
}
.ai-head {
  display: flex; justify-content: space-between; align-items: center; padding: 12px 14px;
  color: #fff; background: linear-gradient(135deg, #8b5cf6, #4338ca);
}
.ai-title { font-weight: 700; }
.ai-title small { font-weight: 400; opacity: 0.8; margin-left: 6px; }
.ai-close { border: none; background: rgba(255, 255, 255, 0.18); color: #fff; width: 26px; height: 26px; border-radius: 8px; }
.ai-msgs { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }
.ai-msg { display: flex; flex-direction: column; max-width: 90%; }
.ai-msg.user { align-self: flex-end; align-items: flex-end; }
.ai-msg.ai { align-self: flex-start; }
.ai-bubble { padding: 8px 12px; border-radius: 12px; white-space: pre-wrap; line-height: 1.45; }
.ai-msg.user .ai-bubble { background: #4f46e5; color: #fff; border-bottom-right-radius: 4px; }
.ai-msg.ai .ai-bubble { background: #fff; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
.ai-bubble.typing { color: var(--muted); font-style: italic; }
.ai-applied { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.ai-chip { font-size: 0.68rem; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 999px; }
.ai-focus { display: flex; align-items: center; gap: 6px; padding: 5px 12px; background: #eef2ff; border-top: 1px solid #c7d2fe; color: #3730a3; font-size: 0.72rem; }
.ai-focus span { flex: 1; }
.ai-focus button { border: none; background: transparent; color: #3730a3; padding: 0 4px; line-height: 1; }
.ai-suggest { display: flex; gap: 6px; flex-wrap: wrap; padding: 8px 12px 0; background: #fff; }
.ai-suggest button { border: 1px solid #c7d2fe; background: #eef2ff; color: #3730a3; font-size: 0.72rem; padding: 3px 10px; border-radius: 999px; }
.ai-suggest button:hover { background: #e0e7ff; }
.ai-input { display: flex; gap: 8px; padding: 10px 12px 12px; background: #fff; }
.ai-input textarea { flex: 1; resize: none; border: 1px solid #e2e8f0; border-radius: 10px; padding: 7px 10px; font-size: 0.82rem; outline: none; }
.ai-input textarea:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
.ai-input button { border: none; width: 38px; border-radius: 10px; color: #fff; background: #4f46e5; }
.ai-input button:disabled { opacity: 0.45; }

/* ======== TOAST ======== */
.toast-undo {
  position: fixed; left: 24px; bottom: 24px; z-index: 2200;
  display: flex; align-items: center; gap: 14px; padding: 10px 14px;
  background: #1e293b; color: #fff; border-radius: 10px; font-size: 0.82rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.3);
}
.toast-undo button { border: none; background: none; color: #a5b4fc; font-weight: 700; }

/* ---- geser urutan proses ---- */
.cell-work { position: relative; }
.is-movable { cursor: grab; }
.proc-move {
  position: absolute; right: 2px; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: 1px; opacity: 0; transition: opacity 0.15s;
  background: rgba(255, 255, 255, 0.92); border-radius: 4px; z-index: 2;
}
.is-movable:hover .proc-move { opacity: 1; }
.drag-grip { color: #94a3b8; font-size: 13px; }
.mv-btn {
  border: 0; background: #e2e8f0; border-radius: 3px; width: 16px; height: 16px; padding: 0;
  display: inline-flex; align-items: center; justify-content: center; font-size: 9px; cursor: pointer;
}
.mv-btn:hover { background: #bfdbfe; }
tr.drag-over td { box-shadow: inset 0 3px 0 0 #2563eb; background: #eff6ff; }
@media (hover: none) { .proc-move { opacity: 1; } }
</style>