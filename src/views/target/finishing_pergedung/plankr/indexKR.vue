<template>
    <div class="d-flex flex-column min-vh-100 app-bg">
        <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
        <div class="d-flex flex-grow-1">
            <Sidebar :isOpen="sidebarOpen" />
            <main
                class="flex-grow-1 p-3 p-md-4 p-lg-5"
                :style="{
                    marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
                    transition: 'margin-left 0.3s ease',
                    marginTop: '56px',
                }"
            >
                <div class="container-fluid page-container">
                    <!-- PAGE HEADER -->
                    <div class="page-header mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                        <div class="d-flex align-items-center gap-3">
                            <div class="page-icon">
                                <i class="bi bi-card-list"></i>
                            </div>
                            <div>
                                <h1 class="page-title mb-0">Plan Kirim Finishing</h1>
                                <p class="page-subtitle mb-0">Kelola rencana kirim per tanggal untuk proses finishing</p>
                            </div>
                        </div>

                        <!-- SYNC: dipisah total dari form tambah/update -->
                        <button class="btn-sync" @click="syncData" :disabled="syncing">
                            <span v-if="syncing" class="spinner-border spinner-border-sm me-2"></span>
                            <i class="bi bi-arrow-repeat"></i> {{ syncing ? ' Sedang sinkronisasi...' : ' Sync Data dari Sistem' }}
                        </button>
                    </div>

                    <!-- FORM CARD: input planning pintar (multi xMark + rentang/tunggal tanggal) -->
                    <div class="surface-card mb-4">
                        <div class="surface-card-header">
                            <i class="fas fa-circle-plus me-2"></i>
                            Tambah Planning
                        </div>
                        <div class="surface-card-body">
                            <p class="form-hint mb-3">
                                <i class="fas fa-lightbulb me-1"></i>
                                Pilih beberapa Style sekaligus, lalu tiap Style akan punya
                                <strong>kolom tanggal sendiri-sendiri</strong> (tidak digabung/disamakan).
                                Untuk tanggal yang cuma <strong>1 hari saja</strong>, pakai mode
                                <strong>Tanggal Tunggal</strong>. Untuk beberapa hari berturut-turut dengan qty
                                sama, pakai mode <strong>Rentang Tanggal</strong>.
                            </p>

                            <!-- ===== MULTI-SELECT xMark DENGAN SEARCH ===== -->
                            <div class="mb-3">
                                <label class="form-label-modern">Style &mdash; bisa pilih lebih dari satu</label>
                                <div class="xmark-multiselect" ref="xMarkBoxRef">
                                    <div class="xmark-select-box" @click="xMarkDropdownOpen = !xMarkDropdownOpen">
                                        <div class="xmark-chips" v-if="form.xMarks.length">
                                            <span v-for="mk in form.xMarks" :key="mk" class="xmark-chip">
                                                {{ mk }}
                                                <i class="fas fa-xmark chip-remove" @click.stop="removeSelectedXMark(mk)"></i>
                                            </span>
                                        </div>
                                        <span v-else class="xmark-placeholder">Pilih xMark hasil sync...</span>
                                        <i class="fas fa-chevron-down xmark-caret" :class="{ open: xMarkDropdownOpen }"></i>
                                    </div>

                                    <div v-if="xMarkDropdownOpen" class="xmark-dropdown">
                                        <div class="xmark-search-wrap">
                                            <i class="fas fa-magnifying-glass search-icon"></i>
                                            <input
                                                v-model="xMarkSearchQuery"
                                                type="text"
                                                class="form-control form-control-modern search-input"
                                                placeholder="Ketik untuk cari Style..."
                                                @click.stop
                                            />
                                        </div>

                                        <div class="xmark-dropdown-actions">
                                            <button type="button" class="xmark-mini-btn" @click.stop="selectAllFiltered">
                                                <i class="fas fa-check-double me-1"></i>Pilih semua hasil cari ({{ filteredXMarkOptions.length }})
                                            </button>
                                            <button type="button" class="xmark-mini-btn" @click.stop="clearSelectedXMarks" v-if="form.xMarks.length">
                                                <i class="fas fa-eraser me-1"></i>Kosongkan pilihan
                                            </button>
                                        </div>

                                        <div class="xmark-option-list">
                                            <label
                                                v-for="mk in filteredXMarkOptions"
                                                :key="mk"
                                                class="xmark-option"
                                                @click.stop
                                            >
                                                <input
                                                    type="checkbox"
                                                    :checked="form.xMarks.includes(mk)"
                                                    @change="toggleXMarkSelection(mk)"
                                                />
                                                <span>{{ mk }}</span>
                                            </label>
                                            <div v-if="!filteredXMarkOptions.length" class="xmark-option-empty">
                                                Tidak ada Style yang cocok.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p class="form-hint mb-0 mt-2">
                                    Belum ada Style yang dicari? Klik <strong>Sync Data dari Sistem</strong> dulu di pojok kanan atas.
                                </p>
                            </div>

                            <!-- HINT KALAU BELUM ADA xMARK DIPILIH -->
                            <div v-if="!form.xMarks.length" class="form-hint mb-0">
                                <i class="fas fa-circle-info me-1"></i>
                                Pilih minimal satu Style di atas dulu, nanti tiap xMark akan muncul
                                kolom tanggalnya masing-masing di bawah ini.
                            </div>

                            <!-- DAFTAR BLOK TANGGAL, TERPISAH PER xMARK -->
                            <div
                                v-for="mk in form.xMarks"
                                :key="mk"
                                class="xmark-plan-block"
                            >
                                <div class="xmark-plan-header">
                                    <span><i class="fas fa-tag me-2"></i>{{ mk }}</span>
                                    <span class="xmark-plan-total" v-if="xMarkDayCount(mk)">
                                        {{ xMarkDayCount(mk) }} tanggal
                                    </span>
                                </div>

                                <div
                                    v-for="(range, idx) in rangesByXMark[mk]"
                                    :key="range.uid"
                                    class="range-block"
                                >
                                    <div class="range-mode-toggle mb-2">
                                        <button
                                            type="button"
                                            class="mode-btn"
                                            :class="{ active: range.isSingleDate }"
                                            @click="setRangeMode(range, true)"
                                        >
                                            <i class="fas fa-calendar-day me-1"></i>Tanggal Tunggal
                                        </button>
                                        <button
                                            type="button"
                                            class="mode-btn"
                                            :class="{ active: !range.isSingleDate }"
                                            @click="setRangeMode(range, false)"
                                        >
                                            <i class="fas fa-calendar-week me-1"></i>Rentang Tanggal
                                        </button>
                                    </div>

                                    <div class="row g-3 align-items-end">
                                        <div class="col-md-3">
                                            <label class="form-label-modern">{{ range.isSingleDate ? 'Tanggal' : 'Tanggal Mulai' }}</label>
                                            <input v-model="range.startDate" type="date" class="form-control form-control-modern" />
                                        </div>
                                        <div class="col-md-3" v-if="!range.isSingleDate">
                                            <label class="form-label-modern">Tanggal Selesai</label>
                                            <input v-model="range.endDate" type="date" class="form-control form-control-modern" />
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label-modern">Qty Plan</label>
                                            <input v-model="range.qty_plan" type="number" class="form-control form-control-modern" placeholder="Qty" />
                                        </div>
                                        <div class="col-md-3 d-flex gap-2">
                                            <span class="range-day-count">
                                                <i class="fas fa-calendar-days me-1"></i>{{ rangeDayCount(range) }} hari
                                            </span>
                                            <button
                                                v-if="rangesByXMark[mk].length > 1"
                                                class="action-btn action-btn-delete ms-auto"
                                                type="button"
                                                @click="removeRangeBlock(mk, idx)"
                                            >
                                                hapus <i class="bi bi-trash3"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button class="btn-add-range" type="button" @click="addRangeBlock(mk)">
                                    <i class="fas fa-plus me-2"></i>Tambah Plan Tanggal/Rentang untuk {{ mk }}
                                </button>
                            </div>

                            <p class="form-hint mb-2" v-if="form.xMarks.length && totalPlannedRows">
                                <i class="fas fa-circle-info me-1"></i>
                                Total yang akan disimpan: <strong>{{ totalPlannedRows }} baris planning</strong>
                                dari <strong>{{ form.xMarks.length }} xMark</strong>.
                            </p>

                            <div class="d-flex align-items-center justify-content-end flex-wrap gap-2 mt-2" v-if="form.xMarks.length">
                                <button class="btn btn-primary-modern" @click="submitPlan" :disabled="saving">
                                    <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                                    <i v-else class="fas fa-floppy-disk me-2"></i>
                                    {{ saving ? `Menyimpan ${saveProgressLabel}` : 'Simpan Semua Planning' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- DATA CARD -->
                    <div class="surface-card">
                        <div class="surface-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <span><i class="fas fa-table-list me-2"></i>Daftar Plan Linking (dikelompokkan per xMark)</span>
                            <div class="search-wrap">
                                <i class="fas fa-magnifying-glass search-icon"></i>
                                <input
                                    v-model="searchQuery"
                                    type="text"
                                    class="form-control form-control-modern search-input"
                                    placeholder="Cari xMark..."
                                />
                            </div>
                        </div>

                        <div class="surface-card-body p-0">
                            <!-- LOADING STATE -->
                            <div v-if="loading" class="state-panel">
                                <video autoplay muted loop playsinline class="state-video">
                                    <source src="/loading.mp4" type="video/mp4" />
                                    Browser kamu tidak mendukung video tag.
                                </video>
                                <div class="state-text mt-3">Memuat data, harap tunggu...</div>
                            </div>

                            <div v-else>
                                <!-- TABLE -->
                                <div v-if="filteredGroups.length" class="table-wrapper">
                                    <table class="table-modern">
                                        <thead>
                                            <tr>
                                                <th>xMark</th>
                                                <th>Rentang Tanggal</th>
                                                <th class="text-end">Qty Plan</th>
                                                <th class="text-center action-col">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <template v-for="group in filteredGroups" :key="group.xMark">
                                                <tr
                                                    v-for="(range, rIdx) in group.ranges"
                                                    :key="group.xMark + '-' + range.startDate"
                                                    :class="{ 'row-editing': editingKey === (group.xMark + '-' + range.startDate) }"
                                                >
                                                    <!-- xMark hanya tampil di baris pertama tiap grup -->
                                                    <td class="fw-semibold xmark-cell">
                                                        <span v-if="rIdx === 0">{{ group.xMark }}</span>
                                                    </td>

                                                    <!-- MODE NORMAL -->
                                                    <template v-if="editingKey !== (group.xMark + '-' + range.startDate)">
                                                        <td>
                                                            {{ formatRangeLabel(range) }}
                                                            <span class="range-count-tag">{{ range.dates.length }} hari</span>
                                                        </td>
                                                        <td class="text-end">
                                                            <span class="qty-badge">{{ range.qty_plan ?? '-' }}</span>
                                                        </td>
                                                        <td class="text-center">
                                                            <button class="action-btn action-btn-edit" @click="startEditRange(group, range)">
                                                                <i class="fas fa-pen"></i> Edit
                                                            </button>
                                                            <button class="action-btn action-btn-delete" @click="confirmDeleteRange(group, range)">
                                                                <i class="fas fa-trash"></i> Hapus
                                                            </button>
                                                        </td>
                                                    </template>

                                                    <!-- MODE EDIT: ubah tanggal/qty untuk rentang ini -->
                                                    <template v-else>
                                                        <td>
                                                            <div class="d-flex gap-2 align-items-center flex-wrap">
                                                                <input v-model="editRange.startDate" type="date" class="form-control form-control-modern inline-input-date" />
                                                                <span>s/d</span>
                                                                <input v-model="editRange.endDate" type="date" class="form-control form-control-modern inline-input-date" />
                                                            </div>
                                                            <span class="edit-tag mt-1 d-inline-block">sedang diedit</span>
                                                        </td>
                                                        <td class="text-end">
                                                            <input
                                                                v-model="editRange.qty_plan"
                                                                type="number"
                                                                class="form-control form-control-modern inline-input"
                                                                @keyup.enter="saveEditRange(group)"
                                                                @keyup.esc="cancelEdit"
                                                            />
                                                        </td>
                                                        <td class="text-center">
                                                            <button
                                                                class="action-btn action-btn-save"
                                                                @click="saveEditRange(group)"
                                                                :disabled="saving"
                                                            >
                                                                <span v-if="saving" class="spinner-border spinner-border-sm"></span>
                                                                <template v-else><i class="fas fa-check"></i> Simpan</template>
                                                            </button>
                                                            <button class="action-btn action-btn-cancel" @click="cancelEdit">
                                                                <i class="fas fa-xmark"></i> Batal
                                                            </button>
                                                        </td>
                                                    </template>
                                                </tr>
                                            </template>
                                        </tbody>
                                    </table>
                                </div>

                                <!-- EMPTY STATE -->
                                <div v-else class="state-panel">
                                    <div class="empty-icon">
                                        <i class="far fa-folder-open"></i>
                                    </div>
                                    <p class="state-text mb-0">
                                        Belum ada data plan kirim. Klik tombol
                                        <strong>Sync Data dari Sistem</strong> di atas untuk mengambil data pertama kali.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";
import Header from "../../../../components/Header.vue";
import Sidebar from "../../../../components/Sidebar.vue";
import Footer from "../../../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ENDPOINT = `${API_BASE_URL}/receivefinishing`;

const sidebarOpen = ref(false);
const user = ref({ name: "Pengguna" });
const windowWidth = ref(window.innerWidth);

// items mentah dari API planning: [{ xMark, tanggal, qty_plan }, ...]
const items = ref([]);
// daftar xMark master hasil sync (bukan dari data planning, karena xMark
// yang belum pernah di-planning-kan pun harus tetap muncul di dropdown)
const xMarkMasterList = ref([]);
const loading = ref(false);
const saving = ref(false);
const syncing = ref(false);
const searchQuery = ref("");
const saveProgressLabel = ref("");

const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
};

function logout() {
    localStorage.removeItem("user");
    window.location.href = "/login";
}

const handleResize = () => {
    windowWidth.value = window.innerWidth;
};

// ==========================================================
// HELPER TANGGAL
// ==========================================================
let uidCounter = 0;
const nextUid = () => `r${Date.now()}_${uidCounter++}`;

const toDateOnly = (val) => {
    // Normalisasi ke "YYYY-MM-DD" supaya gampang dibandingkan/di-loop
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val).slice(0, 10);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const addDays = (dateStr, n) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return toDateOnly(d);
};

const isNextDay = (dateStr, nextStr) => addDays(dateStr, 1) === nextStr;

const formatDatePretty = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const MONTHS_SHORT_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_SHORT_ID[d.getMonth()]}`;
};

// Buat daftar semua tanggal (YYYY-MM-DD) dari start s/d end, inklusif.
const buildDateList = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = toDateOnly(startDate);
    const end = toDateOnly(endDate);
    if (start > end) return [];
    const list = [];
    let cur = start;
    // batas pengaman supaya tidak infinite loop kalau input aneh
    let guard = 0;
    while (cur <= end && guard < 3660) {
        list.push(cur);
        cur = addDays(cur, 1);
        guard++;
    }
    return list;
};

// ==========================================================
// FORM TAMBAH PLANNING (MULTI xMARK + TANGGAL TUNGGAL/RENTANG)
// ==========================================================
const makeEmptyRange = () => ({
    uid: nextUid(),
    isSingleDate: true, // default: tanggal tunggal, paling sering dipakai
    startDate: "",
    endDate: "",
    qty_plan: "",
});

const form = ref({
    xMarks: [], // multi xMark yang dipilih user
});

// Setiap xMark yang dipilih punya daftar blok tanggal/rentang SENDIRI-SENDIRI,
// key = xMark, value = array of range block. Jadi tanggal xMark A tidak akan
// pernah tercampur/disamakan dengan tanggal xMark B.
const rangesByXMark = ref({});

const addRangeBlock = (mk) => {
    if (!rangesByXMark.value[mk]) rangesByXMark.value[mk] = [];
    rangesByXMark.value[mk].push(makeEmptyRange());
};

const removeRangeBlock = (mk, idx) => {
    if (!rangesByXMark.value[mk]) return;
    rangesByXMark.value[mk].splice(idx, 1);
    // Pastikan tiap xMark yang dipilih selalu punya minimal 1 blok tanggal.
    if (rangesByXMark.value[mk].length === 0) {
        rangesByXMark.value[mk].push(makeEmptyRange());
    }
};

const setRangeMode = (range, isSingle) => {
    range.isSingleDate = isSingle;
    if (isSingle) {
        // saat pindah ke mode tunggal, tanggal selesai ikut tanggal mulai
        range.endDate = range.startDate;
    }
};

// Ambil daftar tanggal efektif dari 1 blok, memperhatikan mode tunggal/rentang.
const effectiveDates = (range) => {
    if (range.isSingleDate) {
        return range.startDate ? [toDateOnly(range.startDate)] : [];
    }
    return buildDateList(range.startDate, range.endDate);
};

const rangeDayCount = (range) => effectiveDates(range).length;

// Total hari untuk 1 xMark tertentu (jumlah dari semua blok tanggal miliknya).
const xMarkDayCount = (mk) =>
    (rangesByXMark.value[mk] || []).reduce((sum, r) => sum + rangeDayCount(r), 0);

// Total baris planning yang akan disimpan, dijumlah dari SEMUA xMark
// (bukan dikali/cross-product, karena tiap xMark tanggalnya sendiri-sendiri).
const totalPlannedRows = computed(() =>
    form.value.xMarks.reduce((sum, mk) => sum + xMarkDayCount(mk), 0)
);

const resetForm = () => {
    form.value = { xMarks: [] };
    rangesByXMark.value = {};
};

// xMark master hasil sync, dipakai untuk dropdown form.
const xMarkOptions = computed(() => {
    const set = new Set(xMarkMasterList.value.map((i) => i.xMark));
    return Array.from(set).sort();
});

// ==========================================================
// MULTI-SELECT xMARK DENGAN SEARCH
// ==========================================================
const xMarkDropdownOpen = ref(false);
const xMarkSearchQuery = ref("");
const xMarkBoxRef = ref(null);

const filteredXMarkOptions = computed(() => {
    const q = xMarkSearchQuery.value.toLowerCase().trim();
    if (!q) return xMarkOptions.value;
    return xMarkOptions.value.filter((mk) => String(mk).toLowerCase().includes(q));
});

const toggleXMarkSelection = (mk) => {
    const list = form.value.xMarks;
    const i = list.indexOf(mk);
    if (i === -1) {
        list.push(mk);
        if (!rangesByXMark.value[mk]) rangesByXMark.value[mk] = [makeEmptyRange()];
    } else {
        list.splice(i, 1);
        delete rangesByXMark.value[mk];
    }
};

const removeSelectedXMark = (mk) => {
    form.value.xMarks = form.value.xMarks.filter((x) => x !== mk);
    delete rangesByXMark.value[mk];
};

const selectAllFiltered = () => {
    const merged = new Set([...form.value.xMarks, ...filteredXMarkOptions.value]);
    form.value.xMarks = Array.from(merged);
    for (const mk of filteredXMarkOptions.value) {
        if (!rangesByXMark.value[mk]) rangesByXMark.value[mk] = [makeEmptyRange()];
    }
};

const clearSelectedXMarks = () => {
    form.value.xMarks = [];
    rangesByXMark.value = {};
};

// Tutup dropdown kalau klik di luar area multi-select.
const handleClickOutsideXMark = (e) => {
    if (xMarkBoxRef.value && !xMarkBoxRef.value.contains(e.target)) {
        xMarkDropdownOpen.value = false;
    }
};

// ==========================================================
// PENGELOMPOKAN DATA UNTUK TAMPILAN TABEL (SMART RANGE MERGE)
// ==========================================================
// Menggabungkan tanggal-tanggal berurutan yang qty_plan-nya SAMA
// menjadi satu baris rentang, supaya tabel tidak penuh baris duplikat
// (mis. tgl 1,2,3 = 120 -> tampil sebagai "01-03 Jan").
const mergeIntoRanges = (rows) => {
    const sorted = [...rows].sort((a, b) => toDateOnly(a.tanggal).localeCompare(toDateOnly(b.tanggal)));
    const ranges = [];
    for (const row of sorted) {
        const d = toDateOnly(row.tanggal);
        const last = ranges[ranges.length - 1];
        if (last && last.qty_plan === row.qty_plan && isNextDay(last.endDate, d)) {
            last.endDate = d;
            last.dates.push(d);
        } else {
            ranges.push({ startDate: d, endDate: d, qty_plan: row.qty_plan, dates: [d] });
        }
    }
    return ranges;
};

const groupedItems = computed(() => {
    const byXMark = new Map();
    for (const row of items.value) {
        if (!byXMark.has(row.xMark)) byXMark.set(row.xMark, []);
        byXMark.get(row.xMark).push(row);
    }
    const groups = [];
    for (const [xMark, rows] of byXMark.entries()) {
        groups.push({ xMark, ranges: mergeIntoRanges(rows) });
    }
    groups.sort((a, b) => String(a.xMark).localeCompare(String(b.xMark)));
    return groups;
});

const filteredGroups = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return groupedItems.value;
    return groupedItems.value.filter((g) => String(g.xMark).toLowerCase().includes(query));
});

const formatRangeLabel = (range) => {
    if (range.startDate === range.endDate) return formatDatePretty(range.startDate);
    return `${formatDatePretty(range.startDate)} - ${formatDatePretty(range.endDate)}`;
};

// ==========================================================
// EDIT INLINE PER RENTANG
// ==========================================================
const editingKey = ref(null);
const editRange = ref({ startDate: "", endDate: "", qty_plan: "" });
let editingOriginalDates = [];

const startEditRange = (group, range) => {
    editingKey.value = group.xMark + "-" + range.startDate;
    editRange.value = { startDate: range.startDate, endDate: range.endDate, qty_plan: range.qty_plan };
    editingOriginalDates = [...range.dates];
};

const cancelEdit = () => {
    editingKey.value = null;
    editingOriginalDates = [];
};

// ==========================================================
// FETCH DATA
// ==========================================================
const fetchData = async () => {
    loading.value = true;
    try {
        const [planRes, masterRes] = await Promise.all([
            axios.get(`${ENDPOINT}/list-kirim`),
            axios.get(`${ENDPOINT}/xmark-list`),
        ]);
        items.value = planRes.data.data || [];
        xMarkMasterList.value = masterRes.data.data || [];
    } catch (e) {
        console.error(e);
        alert("Gagal memuat data plan linking.");
    } finally {
        loading.value = false;
    }
};

// ==========================================================
// SIMPAN (BATCH) — inti dari sistem pintar: multi xMark x multi tanggal
// ==========================================================
const submitPlan = async () => {
    if (!form.value.xMarks.length) {
        alert("Pilih minimal satu xMark terlebih dahulu.");
        return;
    }

    // Setiap xMark punya blok tanggal/rentang sendiri — TIDAK di-cross-product
    // ke xMark lain. xMark A bisa punya tanggal & qty yang beda dari xMark B.
    const payloadItems = [];
    for (const mk of form.value.xMarks) {
        const ranges = rangesByXMark.value[mk] || [];
        for (const range of ranges) {
            const dates = effectiveDates(range);
            for (const d of dates) {
                payloadItems.push({
                    xMark: mk,
                    tanggal: d,
                    qty_plan: range.qty_plan === "" ? null : Number(range.qty_plan),
                });
            }
        }
    }

    if (payloadItems.length === 0) {
        alert("Isi minimal satu tanggal (tunggal atau rentang) yang valid untuk salah satu xMark.");
        return;
    }

    saving.value = true;
    saveProgressLabel.value = `${payloadItems.length} baris...`;
    try {
        // Satu request batch — bukan loop satu-satu, supaya cepat & aman.
        await axios.post(`${ENDPOINT}/upsert-batch-kirim`, { items: payloadItems });
        alert(`Planning untuk ${form.value.xMarks.length} xMark (${payloadItems.length} baris) berhasil disimpan.`);
        resetForm();
        await fetchData();
    } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || "Gagal menyimpan planning.");
    } finally {
        saving.value = false;
        saveProgressLabel.value = "";
    }
};

// Simpan hasil edit satu rentang. Kalau rentang tanggal diperluas/dipersempit,
// selisihnya otomatis ditambah/dihapus supaya tetap konsisten.
const saveEditRange = async (group) => {
    if (!editRange.value.startDate || !editRange.value.endDate) {
        alert("Tanggal mulai dan selesai wajib diisi.");
        return;
    }

    const newDates = buildDateList(editRange.value.startDate, editRange.value.endDate);
    if (newDates.length === 0) {
        alert("Rentang tanggal tidak valid.");
        return;
    }

    saving.value = true;
    try {
        const payloadItems = newDates.map((d) => ({
            xMark: group.xMark,
            tanggal: d,
            qty_plan: editRange.value.qty_plan === "" ? null : Number(editRange.value.qty_plan),
        }));
        await axios.post(`${ENDPOINT}/upsert-batch-kirim`, { items: payloadItems });

        // Hapus tanggal lama yang tidak lagi termasuk rentang baru
        // (mis. rentang dipersempit dari 1-5 jadi 1-3).
        const removedDates = editingOriginalDates.filter((d) => !newDates.includes(d));
        for (const d of removedDates) {
            await axios.delete(`${ENDPOINT}/delete-kirim/${encodeURIComponent(group.xMark)}/${d}`);
        }

        cancelEdit();
        await fetchData();
    } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || "Gagal menyimpan perubahan.");
    } finally {
        saving.value = false;
    }
};

const confirmDeleteRange = async (group, range) => {
    const label = formatRangeLabel(range);
    if (!confirm(`Yakin ingin menghapus planning "${group.xMark}" untuk ${label} (${range.dates.length} hari)?`)) return;

    saving.value = true;
    try {
        for (const d of range.dates) {
            await axios.delete(`${ENDPOINT}/delete-kirim/${encodeURIComponent(group.xMark)}/${d}`);
        }
        await fetchData();
    } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || "Gagal menghapus data.");
    } finally {
        saving.value = false;
    }
};

const syncData = async () => {
    syncing.value = true;
    try {
        await axios.post(`${ENDPOINT}/sync`);
        alert("Sinkronisasi berhasil dijalankan.");
        await fetchData();
    } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || "Gagal melakukan sinkronisasi.");
    } finally {
        syncing.value = false;
    }
};

onMounted(() => {
    window.addEventListener("resize", handleResize);
    document.addEventListener("click", handleClickOutsideXMark);
    fetchData();
});

onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("click", handleClickOutsideXMark);
});
</script>

<style scoped>
/* ===== BASE ===== */
.app-bg {
    background-color: #f4f6f9;
}

.page-container {
    max-width: 1400px;
}

/* ===== PAGE HEADER ===== */
.page-header {
    padding-bottom: 4px;
}

.page-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #0f766e, #059669);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
    flex-shrink: 0;
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: -0.02em;
}

.page-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
}

/* ===== SYNC BUTTON ===== */
.btn-sync {
    background: #fff;
    color: #1d4ed8;
    border: 1.5px solid #93c5fd;
    border-radius: 10px;
    padding: 10px 18px;
    font-weight: 600;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition: all 0.12s ease;
}

.btn-sync:hover:not(:disabled) {
    background: #eff6ff;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.18);
}

.btn-sync:disabled {
    opacity: 0.7;
}

/* ===== CARD ===== */
.surface-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    border: 1px solid #eef0f3;
    /* Sengaja TIDAK overflow:hidden supaya dropdown xMark tidak ketutupan/kepotong.
       Sudut membulat tetap dijaga manual lewat border-radius di header & body. */
}

.surface-card-header {
    padding: 14px 20px;
    font-weight: 600;
    font-size: 0.95rem;
    color: #1f2937;
    background: #fafbfc;
    border-bottom: 1px solid #eef0f3;
    border-radius: 16px 16px 0 0;
}

.surface-card-body {
    padding: 20px;
    border-radius: 0 0 16px 16px;
}

.form-hint {
    font-size: 0.8rem;
    color: #9ca3af;
}

/* ===== FORM ===== */
.form-label-modern {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 6px;
}

.form-control-modern {
    border: 1px solid #e2e5ea;
    border-radius: 10px;
    padding: 9px 14px;
    font-size: 0.9rem;
    background: #fbfcfd;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    width: 100%;
}

.form-control-modern:focus {
    outline: none;
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
    background: #fff;
}

/* ===== MULTI-SELECT xMARK DENGAN SEARCH ===== */
.xmark-multiselect {
    position: relative;
}

.xmark-select-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 42px;
    border: 1px solid #e2e5ea;
    border-radius: 10px;
    padding: 6px 12px;
    background: #fbfcfd;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.xmark-select-box:hover {
    border-color: #a7f3d0;
}

.xmark-placeholder {
    color: #9ca3af;
    font-size: 0.9rem;
}

.xmark-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
}

.xmark-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ecfdf5;
    color: #047857;
    font-weight: 600;
    font-size: 0.78rem;
    padding: 4px 8px 4px 10px;
    border-radius: 999px;
}

.chip-remove {
    cursor: pointer;
    font-size: 0.7rem;
    color: #059669;
    padding: 2px;
}

.chip-remove:hover {
    color: #b91c1c;
}

.xmark-caret {
    color: #9ca3af;
    font-size: 0.8rem;
    transition: transform 0.15s ease;
    flex-shrink: 0;
}

.xmark-caret.open {
    transform: rotate(180deg);
}

.xmark-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 30;
    background: #fff;
    border: 1px solid #e2e5ea;
    border-radius: 12px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
    padding: 12px;
}

.xmark-search-wrap {
    position: relative;
    margin-bottom: 10px;
}

.xmark-dropdown-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
}

.xmark-mini-btn {
    background: #f8fafb;
    border: 1px solid #e2e5ea;
    color: #374151;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 8px;
}

.xmark-mini-btn:hover {
    background: #eef2f7;
}

.xmark-option-list {
    max-height: 260px;
    overflow-y: auto;
    border-top: 1px solid #f1f2f4;
    padding-top: 6px;
}

.xmark-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 6px;
    border-radius: 8px;
    font-size: 0.88rem;
    color: #1f2937;
    cursor: pointer;
}

.xmark-option:hover {
    background: #f6fbf9;
}

.xmark-option input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #059669;
    cursor: pointer;
}

.xmark-option-empty {
    text-align: center;
    color: #9ca3af;
    font-size: 0.85rem;
    padding: 16px 0;
}

/* ===== BLOK PER xMARK (bungkus semua range-block milik 1 xMark) ===== */
.xmark-plan-block {
    background: #f8fafc;
    border: 1px solid #e5e9ef;
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 16px;
}

.xmark-plan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 700;
    color: #0f766e;
    font-size: 0.95rem;
    margin-bottom: 12px;
}

.xmark-plan-total {
    font-size: 0.72rem;
    font-weight: 600;
    color: #4338ca;
    background: #eef2ff;
    padding: 3px 10px;
    border-radius: 999px;
    white-space: nowrap;
}

/* ===== RANGE BLOCK (blok tanggal tunggal/rentang di form) ===== */
.range-block {
    background: #fbfcfd;
    border: 1px dashed #dbe1e8;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 12px;
}

.range-mode-toggle {
    display: inline-flex;
    background: #eef2f7;
    border-radius: 999px;
    padding: 3px;
    gap: 2px;
}

.mode-btn {
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 999px;
    transition: all 0.15s ease;
}

.mode-btn.active {
    background: #fff;
    color: #0f766e;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.range-day-count {
    display: inline-flex;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 600;
    color: #0f766e;
    background: #ecfdf5;
    padding: 8px 12px;
    border-radius: 8px;
    white-space: nowrap;
}

.btn-add-range {
    background: #f0fdfa;
    color: #0f766e;
    border: 1.5px dashed #5eead4;
    border-radius: 10px;
    padding: 9px 16px;
    font-weight: 600;
    font-size: 0.85rem;
}

.btn-add-range:hover {
    background: #ccfbf1;
}

/* ===== BUTTONS ===== */
.btn-primary-modern {
    background: linear-gradient(135deg, #0f766e, #059669);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 9px 16px;
    font-weight: 600;
    font-size: 0.875rem;
    transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
}

.btn-primary-modern:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3);
    transform: translateY(-1px);
}

.btn-primary-modern:disabled {
    opacity: 0.7;
}

/* ===== SEARCH ===== */
.search-wrap {
    position: relative;
    width: 260px;
    max-width: 100%;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 0.8rem;
}

.search-input {
    padding-left: 34px !important;
}

/* ===== TABLE ===== */
.table-wrapper {
    overflow: auto;
    max-height: 70vh;
    border-radius: 0 0 16px 16px;
}

.table-modern {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.table-modern thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f8fafb;
    color: #4b5563;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 12px 20px;
    text-align: left;
    border-bottom: 1px solid #eef0f3;
    white-space: nowrap;
}

.action-col {
    min-width: 190px;
}

.table-modern tbody td {
    padding: 12px 20px;
    border-bottom: 1px solid #f1f2f4;
    color: #1f2937;
    vertical-align: middle;
}

.table-modern tbody tr:last-child td {
    border-bottom: none;
}

.table-modern tbody tr {
    transition: background 0.12s ease;
}

.table-modern tbody tr:hover td {
    background-color: #f6fbf9;
}

.xmark-cell {
    color: #0f766e;
    white-space: nowrap;
}

.qty-badge {
    display: inline-block;
    min-width: 40px;
    padding: 3px 10px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #047857;
    font-weight: 600;
    font-size: 0.8rem;
}

.range-count-tag {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4338ca;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
}

/* ===== BARIS SEDANG DIEDIT ===== */
.row-editing td {
    background-color: #fffbeb !important;
}

.edit-tag {
    padding: 2px 8px;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
}

.inline-input {
    display: inline-block;
    width: 120px;
    text-align: right;
}

.inline-input-date {
    width: 170px;
}

/* ===== ACTION BUTTONS ===== */
.action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    border-radius: 8px;
    padding: 7px 12px;
    margin: 0 3px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
}

.action-btn-edit {
    background: #dbeafe;
    color: #1d4ed8;
}

.action-btn-edit:hover {
    background: #bfdbfe;
}

.action-btn-delete {
    background: #fee2e2;
    color: #b91c1c;
}

.action-btn-delete:hover {
    background: #fecaca;
}

.action-btn-save {
    background: #059669;
    color: #fff;
}

.action-btn-save:hover:not(:disabled) {
    background: #047857;
}

.action-btn-save:disabled {
    opacity: 0.7;
}

.action-btn-cancel {
    background: #e5e7eb;
    color: #374151;
}

.action-btn-cancel:hover {
    background: #d1d5db;
}

/* ===== STATE PANELS ===== */
.state-panel {
    text-align: center;
    padding: 56px 20px;
}

.state-video {
    width: 160px;
    height: auto;
    border-radius: 12px;
}

.state-text {
    color: #6b7280;
    font-size: 0.95rem;
}

.empty-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 14px;
    border-radius: 50%;
    background: #f3f4f6;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 767px) {
    .surface-card-header {
        flex-direction: column;
        align-items: flex-start !important;
    }
    .search-wrap {
        width: 100%;
    }
    .page-header {
        flex-direction: column;
        align-items: flex-start !important;
    }
    .btn-sync {
        width: 100%;
        justify-content: center;
    }
    .inline-input {
        width: 90px;
    }
}
</style>