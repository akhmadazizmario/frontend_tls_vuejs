<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft font-sans overflow-x-hidden">
    <!-- HEADER -->
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <!-- SIDEBAR -->
      <Sidebar :isOpen="sidebarOpen" />

      <!-- MAIN CONTENT -->
      <main
        class="flex-grow-1 p-3 p-md-4 p-lg-5 transition-all main-wrapper"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 992 ? '16rem' : '0',
          marginTop: '56px',
        }"
      >
        <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">

          <!-- PAGE HEADER -->
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
            <div>
              <h4 class="fw-bold text-slate-800 mb-1 d-flex align-items-center gap-2">
                <i class="bi bi-pencil-square text-primary"></i> Input Manual Tolakan & Perbaikan Tanpa Barcode
              </h4>
              <p class="text-slate-500 small mb-0">
                Masukkan nilai input tolakan dan hasil perbaikan berdasarkan data Summary
              </p>
            </div>
          </div>

          <!-- FILTER TANGGAL & LOAD DATA -->
          <div class="card border-0 shadow-sm rounded-4 mb-4 filter-card w-100">
            <div class="card-body p-4">
              <div class="row g-3 align-items-end">
                <div class="col-12 col-md-4 col-xl-3">
                  <label class="form-label text-slate-600 fw-semibold small mb-2">Pilih Tanggal (xDatetime)</label>
                  <div class="input-group modern-input-group">
                    <span class="input-group-text bg-white text-slate-400 border-end-0"><i class="bi bi-calendar3"></i></span>
                    <input type="date" v-model="filters.filterDate" class="form-control border-start-0 ps-0 text-slate-700" />
                  </div>
                </div>
                <div class="col-12 col-md-4 col-xl-2">
                  <button class="btn btn-primary w-100 btn-modern d-flex align-items-center justify-content-center gap-2" @click="loadItems">
                    <i class="bi bi-search"></i> Muat Data
                  </button>
                </div>

                <!-- SEARCH BOX -->
                <div class="col-12 col-md-4 col-xl-4">
                  <label class="form-label text-slate-600 fw-semibold small mb-2">Cari (IDP / Warna / Size)</label>
                  <div class="input-group modern-input-group">
                    <span class="input-group-text bg-white text-slate-400 border-end-0"><i class="bi bi-search"></i></span>
                    <input
                      type="text"
                      v-model="searchQuery"
                      placeholder="Ketik untuk mencari..."
                      class="form-control border-start-0 ps-0 text-slate-700"
                    />
                    <button
                      v-if="searchQuery"
                      class="btn btn-outline-secondary border-start-0"
                      @click="searchQuery = ''"
                      title="Bersihkan pencarian"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- MULTI-CHECKBOX FILTERS: IDP / WARNA / SIZE -->
              <div v-if="!loading && items.length > 0" class="row g-3 mt-1">
                <div class="col-12 col-md-4">
                  <MultiFilterDropdown
                    label="Filter IDP"
                    icon="bi-upc-scan"
                    :options="uniqueIdps"
                    v-model="selectedIdps"
                    :searchable="true"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <MultiFilterDropdown
                    label="Filter Warna"
                    icon="bi-palette"
                    :options="uniqueColors"
                    v-model="selectedColors"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <MultiFilterDropdown
                    label="Filter Size"
                    icon="bi-rulers"
                    :options="uniqueSizes"
                    v-model="selectedSizes"
                  />
                </div>
              </div>

              <!-- ACTIVE FILTER CHIPS -->
              <div v-if="hasActiveFilters" class="d-flex flex-wrap align-items-center gap-2 mt-3">
                <span class="text-slate-500 small fw-semibold">Filter aktif:</span>
                <span v-for="v in selectedIdps" :key="'idp-'+v" class="filter-chip">
                  IDP: {{ v }} <i class="bi bi-x" @click="removeFilter('idp', v)"></i>
                </span>
                <span v-for="v in selectedColors" :key="'color-'+v" class="filter-chip">
                  Warna: {{ v }} <i class="bi bi-x" @click="removeFilter('color', v)"></i>
                </span>
                <span v-for="v in selectedSizes" :key="'size-'+v" class="filter-chip">
                  Size: {{ v }} <i class="bi bi-x" @click="removeFilter('size', v)"></i>
                </span>
                <button class="btn btn-sm btn-link text-danger text-decoration-none p-0 ms-1" @click="clearAllFilters">
                  Hapus semua filter
                </button>
              </div>
            </div>
          </div>

          <!-- STATE LOADING & KOSONG -->
          <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5 my-5">
            <div class="spinner-border text-primary mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
            <h6 class="text-slate-500 fw-medium">Memuat data dari server...</h6>
          </div>

          <div v-else-if="items.length === 0" class="d-flex flex-column align-items-center justify-content-center py-5 my-5 bg-white rounded-4 shadow-sm border border-slate-100">
            <i class="bi bi-inbox text-slate-300 mb-3" style="font-size: 3.5rem;"></i>
            <h5 class="text-slate-700 fw-semibold mb-1">Data Kosong</h5>
            <p class="text-slate-500">Tidak ada ringkasan data untuk tanggal yang dipilih.</p>
          </div>

          <div v-else-if="sortedIdpKeys.length === 0" class="d-flex flex-column align-items-center justify-content-center py-5 my-5 bg-white rounded-4 shadow-sm border border-slate-100">
            <i class="bi bi-filter-circle text-slate-300 mb-3" style="font-size: 3.5rem;"></i>
            <h5 class="text-slate-700 fw-semibold mb-1">Tidak Ada Hasil</h5>
            <p class="text-slate-500 mb-3">Tidak ada data yang cocok dengan pencarian / filter saat ini.</p>
            <button class="btn btn-sm btn-outline-secondary" @click="clearAllFilters">Reset Filter & Pencarian</button>
          </div>

          <!-- TOOLBAR AKSI GLOBAL -->
          <div v-else class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <div class="text-slate-500 small">
              Menampilkan <strong>{{ filteredItems.length }}</strong> baris dari <strong>{{ sortedIdpKeys.length }}</strong> IDP
              <span v-if="dirtyCount > 0" class="text-warning-emphasis fw-semibold ms-2">
                &bull; {{ dirtyCount }} perubahan belum disimpan
              </span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="toggleAllGroups(true)">
                <i class="bi bi-arrows-expand"></i> Buka Semua
              </button>
              <button class="btn btn-sm btn-outline-secondary" @click="toggleAllGroups(false)">
                <i class="bi bi-arrows-collapse"></i> Tutup Semua
              </button>
              <button
                class="btn btn-sm btn-success d-flex align-items-center gap-1"
                :disabled="dirtyCount === 0 || saving"
                @click="saveAllDirty"
              >
                <span v-if="saving" class="spinner-border spinner-border-sm"></span>
                <i v-else class="bi bi-save2"></i>
                Simpan Semua Perubahan ({{ dirtyCount }})
              </button>
            </div>
          </div>

          <!-- TABEL INPUT MANUAL - DIKELOMPOKKAN PER IDP -->
          <div v-if="sortedIdpKeys.length > 0" class="d-flex flex-column gap-3 mb-4">
            <div
              v-for="idpKey in sortedIdpKeys"
              :key="idpKey"
              class="card border-0 rounded-4 shadow-sm overflow-hidden group-card"
            >
              <!-- GROUP HEADER -->
              <div
                class="card-header bg-white border-bottom py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2 group-header"
                @click="toggleGroup(idpKey)"
              >
                <div class="d-flex align-items-center gap-2">
                  <i
                    class="bi chevron-icon"
                    :class="isGroupOpen(idpKey) ? 'bi-chevron-down' : 'bi-chevron-right'"
                  ></i>
                  <span class="fw-bold text-slate-800">{{ idpKey }}</span>
                  <span class="badge bg-slate-100 text-slate-600 fw-normal">
                    {{ groupedItems[idpKey].length }} varian
                  </span>
                  <span v-if="groupHasSavedData(idpKey)" class="badge bg-emerald-50 text-emerald-700 fw-normal d-flex align-items-center gap-1">
                    <i class="bi bi-check-circle-fill"></i> Pernah diinput
                  </span>
                  <span v-if="groupDirtyCount(idpKey) > 0" class="badge bg-amber-50 text-amber-700 fw-normal">
                    {{ groupDirtyCount(idpKey) }} belum disimpan
                  </span>
                </div>
                <div class="d-flex align-items-center gap-3 text-slate-500 small">
                  <span>Tolakan: <strong class="text-rose-600">{{ formatNumber(groupTotals(idpKey).tolakan) }}</strong></span>
                  <span>Perbaikan: <strong class="text-emerald-600">{{ formatNumber(groupTotals(idpKey).hasil) }}</strong></span>
                  <button
                    class="btn btn-sm btn-outline-success"
                    :disabled="groupDirtyCount(idpKey) === 0 || saving"
                    @click.stop="saveGroup(idpKey)"
                  >
                    <i class="bi bi-save2"></i> Simpan Grup
                  </button>
                </div>
              </div>

              <!-- GROUP BODY -->
              <div v-show="isGroupOpen(idpKey)" class="card-body p-0">
                <div class="table-responsive custom-scrollbar">
                  <table class="table table-hover align-middle w-100 m-0 modern-table">
                    <thead>
                      <tr class="bg-slate-50">
                        <th style="width: 130px;">Warna</th>
                        <th style="width: 110px;">Size</th>
                        <th class="text-center bg-rose-50 text-rose-700">Input Tolakan</th>
                        <th class="text-center bg-emerald-50 text-emerald-700">Input Perbaikan</th>
                        <th class="text-center" style="width: 110px;">Status</th>
                        <th class="text-center" style="width: 120px;">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="item in groupedItems[idpKey]"
                        :key="rowKey(item)"
                        :class="{ 'row-dirty': isDirty(item), 'row-has-data': item._hasSavedData && !isDirty(item) }"
                      >
                        <td class="text-slate-700">{{ item.xMColor || '-' }}</td>
                        <td><span class="size-badge">{{ item.xSize || '-' }}</span></td>

                        <!-- INPUT KOLOM USER -->
                        <td class="text-center bg-rose-50-light">
                          <input
                            type="number"
                            v-model.number="item.input_tolakan"
                            class="form-control form-control-sm text-center fw-semibold text-rose-700 border-rose"
                            min="0"
                          />
                          <div v-if="item._hasSavedData" class="prev-value-hint">
                            Sebelumnya: {{ formatNumber(item._original.tolakan) }}
                          </div>
                        </td>
                        <td class="text-center bg-emerald-50-light">
                          <input
                            type="number"
                            v-model.number="item.input_hasilperbaikan"
                            class="form-control form-control-sm text-center fw-semibold text-emerald-700 border-emerald"
                            min="0"
                          />
                          <div v-if="item._hasSavedData" class="prev-value-hint">
                            Sebelumnya: {{ formatNumber(item._original.hasil) }}
                          </div>
                        </td>

                        <!-- STATUS: sudah pernah diinput di tanggal ini / belum -->
                        <td class="text-center">
                          <span v-if="item._hasSavedData" class="badge status-badge-saved" title="Data ini sudah pernah diinput untuk tanggal yang dipilih — nilai di bawah adalah data lama, bukan kosong">
                            <i class="bi bi-clock-history"></i> Data Lama
                          </span>
                          <span v-else class="badge status-badge-new" title="Belum pernah diinput untuk tanggal ini">
                            Baru
                          </span>
                        </td>

                        <!-- TOMBOL AKSI SIMPAN / HAPUS -->
                        <td class="text-center">
                          <div class="d-flex justify-content-center gap-1">
                            <button
                              class="btn btn-sm d-flex align-items-center justify-content-center"
                              :class="isDirty(item) ? 'btn-success' : 'btn-outline-success'"
                              @click="saveRow(item)"
                              title="Simpan / Upsert (boleh 0)"
                            >
                              <i class="bi bi-save"></i>
                            </button>
                            <button
                              class="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                              @click="deleteRow(item)"
                              title="Hapus Data"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- JIKA TIDAK ADA AKSES -->
        <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 pt-5 mt-5">
          <h1>Ups, Anda tidak memiliki akses ke halaman ini.</h1>
          <a href="/dashboard" class="btn btn-primary mt-3">Kembali ke Beranda</a>
        </div>
      </main>
    </div>

    <!-- FOOTER -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";
import MultiFilterDropdown from "./MultiFilterDropdown.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const hasAccess = ref(true); // Ubah sesuai sistem UAC Anda
const items = ref([]);
const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);
const loading = ref(false);
const saving = ref(false);

const filters = ref({
  filterDate: new Date().toISOString().split("T")[0]
});

// --- SEARCH & MULTI-FILTER STATE ---
const searchQuery = ref("");
const selectedIdps = ref([]);
const selectedColors = ref([]);
const selectedSizes = ref([]);

// --- STATE BUKA/TUTUP GROUP PER IDP ---
const openGroups = ref({}); // { [xIdp]: true/false }

const formatNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return Number(val).toLocaleString("id-ID");
};

function rowKey(item) {
  return `${item.xIdp}__${item.xMColor}__${item.xSize}`;
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// ===================== FILTER OPTIONS (BERTAHAP / CASCADING) =====================
// Tahap 1: IDP — daftar penuh, tidak dipengaruhi filter lain (paling atas hierarki)
const uniqueIdps = computed(() =>
  [...new Set(items.value.map((i) => i.xIdp).filter(Boolean))].sort()
);

// Tahap 2: Warna — hanya menampilkan warna yang benar-benar ada di IDP yang sedang dipilih.
// Kalau belum ada IDP dipilih, tampilkan semua warna seperti biasa.
const uniqueColors = computed(() => {
  const base =
    selectedIdps.value.length === 0
      ? items.value
      : items.value.filter((i) => selectedIdps.value.includes(i.xIdp));
  return [...new Set(base.map((i) => i.xMColor).filter(Boolean))].sort();
});

// Tahap 3: Size — hanya menampilkan size yang ada di kombinasi IDP + Warna yang sedang dipilih.
const uniqueSizes = computed(() => {
  const base = items.value.filter((i) => {
    const matchIdp = selectedIdps.value.length === 0 || selectedIdps.value.includes(i.xIdp);
    const matchColor = selectedColors.value.length === 0 || selectedColors.value.includes(i.xMColor);
    return matchIdp && matchColor;
  });
  return [...new Set(base.map((i) => i.xSize).filter(Boolean))].sort();
});

// Kalau IDP diganti, buang pilihan Warna/Size yang sudah tidak relevan lagi
// supaya filter tidak pernah "nyasar" / menyisakan kombinasi kosong.
watch(selectedIdps, () => {
  selectedColors.value = selectedColors.value.filter((c) => uniqueColors.value.includes(c));
  selectedSizes.value = selectedSizes.value.filter((s) => uniqueSizes.value.includes(s));
});

// Kalau Warna diganti, buang pilihan Size yang sudah tidak relevan lagi
watch(selectedColors, () => {
  selectedSizes.value = selectedSizes.value.filter((s) => uniqueSizes.value.includes(s));
});

const hasActiveFilters = computed(
  () => selectedIdps.value.length > 0 || selectedColors.value.length > 0 || selectedSizes.value.length > 0
);

function removeFilter(type, value) {
  if (type === "idp") selectedIdps.value = selectedIdps.value.filter((v) => v !== value);
  if (type === "color") selectedColors.value = selectedColors.value.filter((v) => v !== value);
  if (type === "size") selectedSizes.value = selectedSizes.value.filter((v) => v !== value);
}

function clearAllFilters() {
  searchQuery.value = "";
  selectedIdps.value = [];
  selectedColors.value = [];
  selectedSizes.value = [];
}

// ===================== SEARCH + FILTER + GROUPING =====================
const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return items.value.filter((item) => {
    const matchSearch =
      !q ||
      [item.xIdp, item.xMColor, item.xSize]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    const matchIdp = selectedIdps.value.length === 0 || selectedIdps.value.includes(item.xIdp);
    const matchColor = selectedColors.value.length === 0 || selectedColors.value.includes(item.xMColor);
    const matchSize = selectedSizes.value.length === 0 || selectedSizes.value.includes(item.xSize);
    return matchSearch && matchIdp && matchColor && matchSize;
  });
});

const groupedItems = computed(() => {
  const groups = {};
  for (const item of filteredItems.value) {
    if (!groups[item.xIdp]) groups[item.xIdp] = [];
    groups[item.xIdp].push(item);
  }
  // urutkan tiap grup berdasarkan warna lalu size supaya rapi, tidak mencar-mencar
  for (const key in groups) {
    groups[key].sort((a, b) => {
      const c = (a.xMColor || "").localeCompare(b.xMColor || "");
      if (c !== 0) return c;
      return (a.xSize || "").localeCompare(b.xSize || "");
    });
  }
  return groups;
});

const sortedIdpKeys = computed(() => Object.keys(groupedItems.value).sort());

function groupTotals(idpKey) {
  const rows = groupedItems.value[idpKey] || [];
  return rows.reduce(
    (acc, r) => {
      acc.tolakan += Number(r.input_tolakan) || 0;
      acc.hasil += Number(r.input_hasilperbaikan) || 0;
      return acc;
    },
    { tolakan: 0, hasil: 0 }
  );
}

function groupHasSavedData(idpKey) {
  return (groupedItems.value[idpKey] || []).some((r) => r._hasSavedData);
}

function groupDirtyCount(idpKey) {
  return (groupedItems.value[idpKey] || []).filter((r) => isDirty(r)).length;
}

// ===================== BUKA / TUTUP GRUP =====================
function isGroupOpen(idpKey) {
  return openGroups.value[idpKey] !== false; // default terbuka
}

function toggleGroup(idpKey) {
  openGroups.value[idpKey] = !isGroupOpen(idpKey);
}

function toggleAllGroups(open) {
  const next = {};
  sortedIdpKeys.value.forEach((k) => (next[k] = open));
  openGroups.value = next;
}

// ===================== DIRTY TRACKING (perubahan belum disimpan) =====================
function isDirty(item) {
  if (!item._original) return false;
  return (
    Number(item.input_tolakan) !== Number(item._original.tolakan) ||
    Number(item.input_hasilperbaikan) !== Number(item._original.hasil)
  );
}

const dirtyCount = computed(() => filteredItems.value.filter((i) => isDirty(i)).length);

function markSaved(item) {
  item._original = {
    tolakan: Number(item.input_tolakan) || 0,
    hasil: Number(item.input_hasilperbaikan) || 0
  };
  item._hasSavedData = true;
}

// ===================== LOAD DATA =====================
async function loadItems() {
  loading.value = true;
  try {
    const params = { filterDate: filters.value.filterDate };
    const res = await axios.get(`${API_BASE_URL}/returhasilperbaikandantolakan`, { params });
    const rawData = Array.isArray(res.data) ? res.data : res.data.data || [];

    items.value = rawData.map((item) => {
      // PENTING: gunakan pengecekan null/undefined (bukan `|| 0`) supaya nilai 0
      // yang memang sudah pernah disimpan tidak "tertukar" dengan belum pernah diinput.
      const hasSaved = item.input_tolakan !== null && item.input_tolakan !== undefined
        || item.input_hasilperbaikan !== null && item.input_hasilperbaikan !== undefined;

      const tolakan = item.input_tolakan ?? 0;
      const hasil = item.input_hasilperbaikan ?? 0;

      return {
        ...item,
        input_tolakan: tolakan,
        input_hasilperbaikan: hasil,
        _hasSavedData: hasSaved,
        _original: { tolakan, hasil }
      };
    });

    // reset filter tampilan (bukan filter tanggal) & buka semua grup saat data baru dimuat
    openGroups.value = {};
    const loadedIdps = new Set(items.value.map((i) => i.xIdp));
    const loadedColors = new Set(items.value.map((i) => i.xMColor));
    const loadedSizes = new Set(items.value.map((i) => i.xSize));
    selectedIdps.value = selectedIdps.value.filter((v) => loadedIdps.has(v));
    selectedColors.value = selectedColors.value.filter((v) => loadedColors.has(v));
    selectedSizes.value = selectedSizes.value.filter((v) => loadedSizes.has(v));
  } catch (err) {
    console.error("Error fetching data:", err);
    Swal.fire("Gagal", "Tidak dapat memuat data.", "error");
  } finally {
    loading.value = false;
  }
}

// ===================== SIMPAN 1 BARIS =====================
async function saveRow(item, { silent = false } = {}) {
  try {
    const payload = {
      action: "UPSERT",
      xIdp: item.xIdp,
      xMColor: item.xMColor || "",
      xSize: item.xSize || "",
      input_tolakan: item.input_tolakan || 0,
      input_hasilperbaikan: item.input_hasilperbaikan || 0,
      filterDate: filters.value.filterDate
    };

    const res = await axios.post(`${API_BASE_URL}/returhasilperbaikandantolakan/manage`, payload);

    if (res.data.success) {
      markSaved(item);
      if (!silent) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Berhasil Disimpan",
          showConfirmButton: false,
          timer: 1500
        });
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error saving data:", err);
    if (!silent) Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
    return false;
  }
}

// ===================== SIMPAN SEMUA PERUBAHAN (SATU GRUP) =====================
async function saveGroup(idpKey) {
  const rows = (groupedItems.value[idpKey] || []).filter((r) => isDirty(r));
  if (rows.length === 0) return;
  saving.value = true;
  let successCount = 0;
  for (const row of rows) {
    const ok = await saveRow(row, { silent: true });
    if (ok) successCount++;
  }
  saving.value = false;
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: successCount === rows.length ? "success" : "warning",
    title: `${successCount} dari ${rows.length} baris di ${idpKey} tersimpan`,
    showConfirmButton: false,
    timer: 2000
  });
}

// ===================== SIMPAN SEMUA PERUBAHAN (SELURUH TABEL YANG TAMPIL) =====================
async function saveAllDirty() {
  const rows = filteredItems.value.filter((r) => isDirty(r));
  if (rows.length === 0) return;
  saving.value = true;
  let successCount = 0;
  for (const row of rows) {
    const ok = await saveRow(row, { silent: true });
    if (ok) successCount++;
  }
  saving.value = false;
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: successCount === rows.length ? "success" : "warning",
    title: `${successCount} dari ${rows.length} perubahan tersimpan`,
    showConfirmButton: false,
    timer: 2000
  });
}

// ===================== HAPUS 1 BARIS =====================
async function deleteRow(item) {
  const confirm = await Swal.fire({
    title: "Apakah Anda yakin?",
    text: `Hapus inputan untuk ${item.xIdp} - ${item.xMColor} (${item.xSize})?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Ya, Hapus!"
  });

  if (confirm.isConfirmed) {
    try {
      const payload = {
        action: "DELETE",
        xIdp: item.xIdp,
        xMColor: item.xMColor || "",
        xSize: item.xSize || "",
        filterDate: filters.value.filterDate
      };

      const res = await axios.post(`${API_BASE_URL}/returhasilperbaikandantolakan/manage`, payload);

      if (res.data.success) {
        Swal.fire("Terhapus!", "Data berhasil dihapus dari database.", "success");
        item.input_tolakan = 0;
        item.input_hasilperbaikan = 0;
        item._hasSavedData = false;
        item._original = { tolakan: 0, hasil: 0 };
      }
    } catch (err) {
      console.error("Error deleting data:", err);
      Swal.fire("Gagal", "Terjadi kesalahan saat menghapus data.", "error");
    }
  }
}

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);

  loadItems();
  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<style scoped>
.main-wrapper { min-width: 0 !important; max-width: 100%; }
.font-sans { font-family: 'Inter', 'Segoe UI', Roboto, sans-serif; }
.bg-light-soft { background-color: #f8fafc; }
.modern-input-group .input-group-text, .modern-input-group .form-control {
  border-color: #cbd5e1; border-radius: 0.5rem; padding: 0.55rem 0.75rem;
}
.modern-table th, .modern-table td { padding: 0.65rem 1rem; font-size: 0.85rem; vertical-align: middle; }
.btn-modern { border-radius: 0.5rem; font-weight: 500; padding: 0.55rem 1rem; }
.border-rose { border-color: #fda4af !important; }
.border-emerald { border-color: #6ee7b7 !important; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.bg-emerald-50 { background-color: #ecfdf5; }
.text-emerald-700 { color: #047857; }
.bg-amber-50 { background-color: #fffbeb; }
.text-amber-700 { color: #b45309; }

.group-card { border: 1px solid #f1f5f9; }
.group-header { cursor: pointer; user-select: none; }
.group-header:hover { background-color: #f8fafc; }
.chevron-icon { transition: transform 0.15s ease; color: #64748b; }

.row-dirty { background-color: #fffbeb; }
.row-dirty td { box-shadow: inset 3px 0 0 #f59e0b; }

/* Baris yang sudah punya data tersimpan (nilai lama) untuk tanggal ini */
.row-has-data { background-color: #eff6ff; }
.row-has-data td { box-shadow: inset 3px 0 0 #3b82f6; }

/* Badge Size: warna solid, tidak bergantung ke class slate global supaya teks tidak transparan/hilang */
.size-badge {
  display: inline-block;
  background-color: #334155;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.78rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.4rem;
}

.status-badge-saved {
  background-color: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.status-badge-new {
  background-color: #e2e8f0;
  color: #334155;
  font-weight: 600;
}

.prev-value-hint {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background-color: #eef2ff;
  color: #4338ca;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 500;
}
.filter-chip i { cursor: pointer; font-size: 0.85rem; }
.filter-chip i:hover { color: #e11d48; }
</style>