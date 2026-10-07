<template>
  <div class="jp-admin d-flex flex-column min-vh-100">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-2 p-md-4 main-content-wrapper" :style="mainContentStyle">
        <!-- BUNGKUS DENGAN v-if="hasAccess" UNTUK UAC -->
      <div v-if="hasAccess" class="container-fluid retur-page max-w-7xl mx-auto p-0">
        <div class="container-fluid">
          <div class="jp-page-head">
            <div>
              <h2><i class="bi bi-people-fill"></i> Daftar Pelamar</h2>
              <p class="jp-page-sub">Kelola dan pantau seluruh data pelamar yang masuk</p>
            </div>
            <div class="jp-stat-chip">
              <span class="jp-stat-num">{{ totalItems }}</span>
              <span class="jp-stat-label">dari {{ pelamar.length }} total pelamar</span>
            </div>
          </div>

          <!-- ===== FILTER SERVER-SIDE ===== -->
          <div class="jp-card jp-filter-card">
            <h5 class="jp-card-title"><i class="bi bi-funnel"></i> Filter Data</h5>
            <div class="row g-2">
              <div class="col-6 col-md-2">
                <label>Tanggal Awal</label>
                <input type="date" v-model="filters.startDate" class="jp-input" />
              </div>
              <div class="col-6 col-md-2">
                <label>Tanggal Akhir</label>
                <input type="date" v-model="filters.endDate" class="jp-input" />
              </div>
              <div class="col-12 col-md-3">
                <label>Posisi</label>
                <select v-model="filters.posisi" class="jp-input">
                  <option value="">-- Semua Posisi --</option>
                  <option v-for="l in lokerList" :key="l.id" :value="l.id">{{ l.posisi }}</option>
                </select>
              </div>
              <div class="col-12 col-md-2">
                <label>Jenis Kelamin</label>
                <select v-model="filters.jenis_kelamin" class="jp-input">
                  <option value="">-- Semua --</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div class="col-12 col-md-3 jp-filter-actions">
                <button @click="loadPelamar" class="jp-btn jp-btn-primary" title="Terapkan Filter">
                  <i class="bi bi-search"></i>
                </button>
                <button @click="exportExcel" class="jp-btn jp-btn-success" title="Export Excel">
                  <i class="bi bi-file-earmark-excel"></i>
                </button>
                <button @click="exportTlsZip" class="jp-btn jp-btn-success" title="Export Pelamar Pernah Kerja di TLS (Excel + PDF, ZIP)">
                  <i class="bi bi-file-earmark-zip"></i>
                </button>
                <button @click="confirmDeleteMassal" class="jp-btn jp-btn-danger" title="Hapus Massal (rentang tanggal)">
                  <i class="bi bi-trash3"></i>
                </button>
                <button @click="confirmDeleteByTlsStatus('Ya')" class="jp-btn jp-btn-danger" title="Hapus Semua Pelamar Pernah Kerja di TLS">
                  <i class="bi bi-person-x"></i>
                </button>
                <button @click="confirmDeleteByTlsStatus('Tidak')" class="jp-btn jp-btn-danger" title="Hapus Semua Pelamar Tidak Pernah Kerja di TLS">
                  <i class="bi bi-person-dash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- ===== TABLE CARD ===== -->
          <div class="jp-card jp-table-card">
            <div v-if="loading" class="jp-state">
              <div class="jp-spinner"></div>
              <p>Memuat data...</p>
            </div>

            <div v-else-if="pelamar.length === 0" class="jp-state">
              <i class="bi bi-inbox"></i>
              <p>Belum ada pelamar.</p>
            </div>

            <template v-else>
              <div class="jp-toolbar">
                <div class="jp-search-box">
                  <i class="bi bi-search"></i>
                  <input
                    v-model="globalSearch"
                    type="text"
                    placeholder="Cari cepat: nama, email, WhatsApp, NIK..."
                  />
                  <button v-if="globalSearch" class="jp-clear-x" @click="globalSearch = ''">
                    <i class="bi bi-x"></i>
                  </button>
                </div>

                <div class="jp-toolbar-right">
                  <button
                    v-if="activeFilterCount > 0"
                    class="jp-reset-filters"
                    @click="resetAllColumnFilters"
                  >
                    <i class="bi bi-x-circle"></i>
                    Reset {{ activeFilterCount }} Filter Kolom
                  </button>

                  <div class="jp-page-size">
                    <label>Tampilkan</label>
                    <select v-model.number="pageSize" class="jp-input jp-input-sm">
                      <option :value="10">10</option>
                      <option :value="25">25</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="jp-scroll-wrap" ref="scrollWrapRef">
                <table class="jp-table">
                  <thead>
                    <tr>
                      <th class="jp-sticky-left jp-col-no">No</th>

                      <th
                        v-for="col in columns"
                        :key="col.key"
                        :ref="(el) => setThRef(col.key, el)"
                        :class="['jp-th', col.align === 'center' ? 'text-center' : '']"
                      >
                        <div class="jp-th-inner">
                          <span class="jp-th-label" :class="{ 'is-sortable': col.sortable !== false }" @click="col.sortable !== false && toggleSort(col.key)">
                            {{ col.label }}
                            <i
                              v-if="col.sortable !== false"
                              class="bi jp-sort-icon"
                              :class="sortKey === col.key ? (sortDir === 'asc' ? 'bi-caret-up-fill is-active' : 'bi-caret-down-fill is-active') : 'bi-caret-down'"
                            ></i>
                          </span>

                          <button
                            v-if="col.filterable"
                            class="jp-filter-btn"
                            :class="{ 'is-active': filterState[col.key] && filterState[col.key].size > 0 }"
                            @click.stop="openFilter(col)"
                            title="Filter kolom"
                          >
                            <i class="bi bi-funnel-fill"></i>
                            <span v-if="filterState[col.key] && filterState[col.key].size > 0" class="jp-filter-count">
                              {{ filterState[col.key].size }}
                            </span>
                          </button>
                        </div>
                      </th>

                      <th class="jp-sticky-right jp-col-aksi text-center">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="(p, index) in paginatedPelamar" :key="p.id">
                      <td class="jp-sticky-left jp-col-no text-center">
                        {{ (currentPage - 1) * pageSize + index + 1 }}
                      </td>

                      <td v-for="col in columns" :key="col.key" :class="col.align === 'center' ? 'text-center' : ''">
                        <template v-if="col.key === 'dokumen'">
                          <a
                            v-if="p.dokumen_tambahan"
                            :href="`${API_BASE_URL}/${p.dokumen_tambahan}`"
                            target="_blank"
                            class="jp-doc-link"
                          >
                            <i class="bi bi-file-earmark-text"></i> Lihat
                          </a>
                          <span v-else class="jp-muted">-</span>
                        </template>

                        <template v-else-if="col.key === 'createdAt'">
                          <span class="jp-nowrap">{{ formatDateTime(p.createdAt) }}</span>
                        </template>

                        <template v-else-if="col.key === 'jenis_kelamin'">
                          <span v-if="p.jenis_kelamin" class="jp-pill" :class="p.jenis_kelamin === 'Laki-laki' ? 'is-blue' : 'is-pink'">
                            {{ p.jenis_kelamin }}
                          </span>
                          <span v-else class="jp-muted">-</span>
                        </template>

                        <template v-else-if="col.key === 'pengalaman_kerja_tlsi'">
                          <span v-if="p.pengalaman_kerja_tlsi" class="jp-pill" :class="p.pengalaman_kerja_tlsi === 'Ya' ? 'is-amber' : 'is-slate'">
                            {{ p.pengalaman_kerja_tlsi }}
                          </span>
                          <span v-else class="jp-muted">-</span>
                        </template>

                        <template v-else-if="col.key === 'posisi'">
                          <span class="jp-pill is-navy">{{ col.get(p) || '-' }}</span>
                        </template>

                        <template v-else>
                          {{ col.get(p) || '-' }}
                        </template>
                      </td>

                      <td class="jp-sticky-right jp-col-aksi text-center">
                        <div class="jp-actions">
                          <button class="jp-icon-btn is-info" title="Lihat Detail" @click="detailPelamar(p.id)">
                            <i class="bi bi-eye"></i>
                          </button>
                          <button class="jp-icon-btn is-warning" title="Export PDF" @click="exportPdf(p.id)">
                            <i class="bi bi-file-earmark-pdf"></i>
                          </button>
                          <button class="jp-icon-btn is-danger" title="Hapus Pelamar" @click="confirmDelete(p.id)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr v-if="paginatedPelamar.length === 0">
                      <td :colspan="columns.length + 2" class="jp-empty-row">
                        <i class="bi bi-search"></i>
                        Tidak ada data yang cocok dengan pencarian / filter Anda.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="jp-pagination">
                <span class="jp-page-info">
                  Menampilkan {{ totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}
                  &ndash; {{ Math.min(currentPage * pageSize, totalItems) }} dari {{ totalItems }} data
                </span>

                <div class="jp-page-controls">
                  <button class="jp-page-btn" :disabled="currentPage === 1" @click="currentPage = 1">
                    <i class="bi bi-chevron-bar-left"></i>
                  </button>
                  <button class="jp-page-btn" :disabled="currentPage === 1" @click="currentPage--">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <span class="jp-page-current">{{ currentPage }} / {{ totalPages }}</span>
                  <button class="jp-page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                  <button class="jp-page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">
                    <i class="bi bi-chevron-bar-right"></i>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
        </div>

        <!-- OPSI TAMPILAN BLANK (JIKA TIDAK ADA AKSES) -->
        <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 pt-5 mt-5">
           <!-- Halaman Blank, Jika ingin dibuat benar-benar kosong hapus komentar html ini. -->
            <h1>hi anda tersesat nih, Mohon untuk Logout Segera </h1>
            <a href="/logout" class="btn btn-primary">back to jungle</a>
        </div>
      </main>
    </div>
    
    <Footer />

    <!-- ===== TELEPORTED FILTER DROPDOWN ===== -->
    <Teleport to="body">
      <div v-if="openFilterKey" class="jp-filter-backdrop" @click="closeFilter"></div>

      <div
        v-if="openFilterKey"
        class="jp-filter-panel"
        :style="{ top: filterPos.top + 'px', left: filterPos.left + 'px' }"
        @click.stop
      >
        <div class="jp-filter-search">
          <i class="bi bi-search"></i>
          <input
            v-model="dropdownSearch"
            type="text"
            placeholder="Cari nilai..."
            autofocus
          />
        </div>

        <div class="jp-filter-quick">
          <button @click="selectAllVisible">Pilih Semua</button>
          <span>&middot;</span>
          <button @click="clearColumnFilter(openFilterKey)">Bersihkan</button>
        </div>

        <div class="jp-filter-options">
          <label v-for="val in filteredDropdownOptions" :key="val" class="jp-checkbox-row">
            <input
              type="checkbox"
              :checked="filterState[openFilterKey]?.has(val)"
              @change="toggleCheckboxValue(openFilterKey, val)"
            />
            <span>{{ val }}</span>
          </label>

          <div v-if="filteredDropdownOptions.length === 0" class="jp-filter-empty">
            Tidak ada nilai yang cocok.
          </div>
        </div>

        <div class="jp-filter-footer">
          <button class="jp-btn jp-btn-primary jp-btn-sm" @click="closeFilter">Terapkan</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>


<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

// Asumsi komponen diimpor dengan benar
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const hasAccess = ref(false);
// State utama
const pelamar = ref([]);
const loading = ref(false);
const lokerList = ref([]);
const filters = ref({
  startDate: "",
  endDate: "",
  posisi: "",
  jenis_kelamin: "",
});

// UI / Sidebar
const user = ref({ name: "Admin" });
const sidebarOpen = ref(true);
const windowWidth = ref(window.innerWidth);

const mainContentStyle = computed(() => ({
  marginLeft: sidebarOpen.value && windowWidth.value >= 768 ? "16rem" : "0",
  transition: "margin-left 0.3s ease",
  marginTop: "56px",
}));

// Helper
const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
};

// Helper untuk baris detail yang lebih rapi
const detailRow = (label, value) => `<p class="mb-2"><b>${label}:</b> ${value || "-"}</p>`;

// --- CRUD & Data Load ---
async function loadPelamar() {
  loading.value = true;

  try {
    const res = await axios.get(`${API_BASE_URL}/rekruitment-tlsi`, {
      params: {
        from: filters.value.startDate || null,
        to: filters.value.endDate || null,
        posisi: filters.value.posisi || null,
        jenis_kelamin: filters.value.jenis_kelamin || null,
      },
    });

    // 1️⃣ pastikan array
    const data = Array.isArray(res.data) ? res.data : [];

    // 2️⃣ sort DESC berdasarkan createdAt (PENTING)
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 3️⃣ set ke state
    pelamar.value = data;
  } catch (err) {
    console.error("Error loading pelamar:", err);
    Swal.fire("Gagal", "Tidak bisa memuat data pelamar", "error");
    pelamar.value = [];
  } finally {
    loading.value = false;
  }
}


// --- FUNGSI DETAIL DUA KOLOM ---
async function detailPelamar(id) {
  try {
    const res = await axios.get(`${API_BASE_URL}/rekruitment-tlsi/${id}`);
    const p = res.data;

    const dokumenUrl = p.dokumen_tambahan
      ? `${API_BASE_URL}/${p.dokumen_tambahan}`
      : null;

    // Kolom Kiri: Data Pribadi
    const dataPribadi = `
      <h5 class="text-primary fw-bold mb-3">Data Pribadi</h5>
      ${detailRow("Nama Lengkap", p.nama_lengkap)}
      ${detailRow("Email", p.email)}
      ${detailRow("No HP", p.no_hp)}
      ${detailRow("NIK", p.nik)}
      ${detailRow("Jenis Kelamin", p.jenis_kelamin)}
      ${detailRow("Tempat, Tanggal Lahir", `${p.tempat_lahir || "-"}, ${p.tanggal_lahir || "-"}`)}
      ${detailRow("Berat Badan", p.berat_badan + " KG" )}
      ${detailRow("Tinggi Badan", p.tinggi_badan + " CM")}
      ${detailRow("Alamat", p.alamat)}
      ${detailRow("usia", p.usia)}
      ${detailRow("provinsi", p.provinsi)}
      ${detailRow("kabupaten/kota", p.kabupatenkota)}
      ${detailRow("Kecamatan", p.kecamatan)}
      ${detailRow("Rt", p.rt)}
      ${detailRow("Rw", p.rw)}
    `;

    // Kolom Kanan: Data Posisi & Pendidikan
    const dataPendidikan = `
      <h5 class="text-success fw-bold mb-3">Data Posisi & Pendidikan</h5>
      ${detailRow("Posisi Dilamar", p.loker?.posisi)}
      ${detailRow("Jenjang Pendidikan", p.jenjang_pendidikan)}
      ${detailRow("Nama Sekolah", p.nama_sekolah)}
      ${detailRow("Jurusan", p.jurusan)}
      ${detailRow("Nilai", p.nilai_sekolah)}

      <h5 class="text-warning fw-bold mb-3 mt-4">Pengalaman & Sumber Info</h5>
      ${detailRow("Pernah Kerja di TLS", p.pengalaman_kerja_tlsi)}
      ${detailRow("Detail Pengalaman TLS", p.detail_pengalaman_tls)}
      ${detailRow("Sumber Loker Utama", p.sumberinfoloker)}
      ${detailRow("Sumber Loker Detail", p.sumber_informasidua)}
    `;

    // Bagian Bawah: Dokumen & Tanggal
    const dataTambahan = `
      <hr class="mt-4 mb-3">
      ${detailRow("Tanggal Lamar", formatDateTime(p.createdAt))}
      <p class="mb-2"><b>Dokumen Tambahan:</b> 
        ${
          dokumenUrl
            ? `<a href="${dokumenUrl}" target="_blank" class="btn btn-sm btn-primary ms-2" style="font-size: 0.8rem;">
                <i class="bi bi-file-earmark-text"></i> Lihat Dokumen
              </a>`
            : "Tidak ada"
        }
      </p>
    `;

    Swal.fire({
      title: `<strong class="text-primary">Detail Pelamar 📋</strong>`,
      // Lebar lebih besar untuk layout 2 kolom
      width: 900, 
      html: `
        <div class="container-fluid text-start">
          <div class="row">
            <div class="col-md-6 border-end pe-4">${dataPribadi}</div>
            <div class="col-md-6 ps-4">${dataPendidikan}</div>
          </div>
          <div class="row">
            <div class="col-12">${dataTambahan}</div>
          </div>
        </div>
      `,
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: "Tutup",
    });
  } catch (err) {
    console.error("Error detail pelamar:", err);
    Swal.fire("Error", "Gagal mengambil detail pelamar", "error");
  }
}
// --- Akhir FUNGSI DETAIL DUA KOLOM ---


async function confirmDelete(id) {
  const result = await Swal.fire({
    title: "Yakin hapus? ⚠️",
    text: "Data pelamar ini akan dihapus permanen.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    cancelButtonText: "Batal",
    confirmButtonText: "Ya, Hapus!",
  });

  if (result.isConfirmed) {
    deletePelamar(id);
  }
}

async function deletePelamar(id) {
  try {
    await axios.delete(`${API_BASE_URL}/rekruitment-tlsi/${id}`);
    Swal.fire("Berhasil", "Data pelamar dihapus. ✅", "success");
    await loadPelamar();
  } catch (err) {
    console.error("Error deleting pelamar:", err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menghapus pelamar.", "error");
  }
}

// --- Export PDF & Excel ---
const exportPdf = async (id) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/rekruitment-tlsi/export-pdf/${id}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pelamar-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    Swal.fire("Berhasil", "Data pelamar berhasil diexport ke PDF.", "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal export PDF", "error");
  }
};

const exportExcel = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/rekruitment-tlsi/export-excel`, {
      params: filters.value,
      responseType: "blob",
    });
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Data-Pelamar.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    Swal.fire("Berhasil", "Data pelamar berhasil diexport ke Excel.", "success");
  } catch (err) {
    console.error("Gagal export:", err);
    Swal.fire("Error", "Gagal export Excel", "error");
  }
};

// Export ZIP: Excel rekap + PDF lamaran, khusus pelamar yang PERNAH kerja di TLS
const exportTlsZip = async () => {
  try {
    Swal.fire({
      title: "Menyiapkan berkas...",
      html: "Sedang membuat Excel & mengumpulkan PDF lamaran. Mohon tunggu, proses ini bisa memakan waktu beberapa saat.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await axios.get(`${API_BASE_URL}/rekruitment-tlsi/export-tls-zip`, {
      params: {
        from: filters.value.startDate || null,
        to: filters.value.endDate || null,
        posisi: filters.value.posisi || null,
        jenis_kelamin: filters.value.jenis_kelamin || null,
      },
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Pelamar-Pernah-TLS-${Date.now()}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    Swal.fire("Berhasil", "ZIP (Excel + PDF lamaran) pelamar pernah kerja di TLS berhasil diunduh.", "success");
  } catch (err) {
    console.error("Gagal export ZIP TLS:", err);
    if (err.response?.status === 404) {
      Swal.fire("Info", "Tidak ada pelamar yang pernah kerja di TLS pada filter saat ini.", "info");
    } else {
      Swal.fire("Error", "Gagal export ZIP pelamar TLS", "error");
    }
  }
};

async function confirmDeleteByTlsStatus(status) {
  const label = status === "Ya" ? "PERNAH kerja di TLS" : "TIDAK PERNAH kerja di TLS";

  const result = await Swal.fire({
    title: "Yakin hapus massal? ⚠️",
    html: `Seluruh data pelamar dengan status <b>${label}</b> akan dihapus permanen beserta file dokumennya.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    cancelButtonText: "Batal",
    confirmButtonText: "Ya, Hapus Semua!",
  });

  if (result.isConfirmed) {
    deletePelamarByTlsStatus(status);
  }
}

async function deletePelamarByTlsStatus(status) {
  try {
    await axios.delete(`${API_BASE_URL}/rekruitment-tlsi/pelamar/mass-delete-tls-status`, {
      data: { status },
    });

    Swal.fire("Berhasil", "Data pelamar berhasil dihapus massal berdasarkan status TLS!", "success");
    await loadPelamar();
  } catch (err) {
    console.error("Gagal delete massal by status TLS:", err);
    Swal.fire("Gagal", err.response?.data?.error || "Gagal menghapus pelamar berdasarkan status TLS", "error");
  }
}

async function confirmDeleteMassal() {
  if (!filters.value.startDate || !filters.value.endDate) {
    return Swal.fire("Error", "Tanggal awal dan akhir harus diisi!", "warning");
  }

  const result = await Swal.fire({
    title: "Yakin hapus massal?",
    html: `
      <div class="text-start">
        <p>Data pelamar dari:</p>
        <b>${filters.value.startDate}</b> sampai <b>${filters.value.endDate}</b>
        <p>Akan dihapus permanen beserta file dokumennya.</p>
      </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Hapus Semua!"
  });

  if (result.isConfirmed) {
    deletePelamarMassal();
  }
}

async function deletePelamarMassal() {
  try {
    await axios.delete(`${API_BASE_URL}/rekruitment-tlsi/pelamar/mass-delete`, {
      data: {
        startDate: filters.value.startDate,
        endDate: filters.value.endDate,
      }
    });

    Swal.fire("Berhasil", "Data pelamar berhasil dihapus massal!", "success");

    await loadPelamar();
  } catch (err) {
    console.error("Gagal delete massal:", err);
    Swal.fire("Gagal", err.response?.data?.error || "Gagal mass delete", "error");
  }
}

// Di dalam script setup, tambahkan fungsi ini untuk handle responsive otomatis
const checkMobile = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value < 768) {
    sidebarOpen.value = false; // Sembunyikan sidebar di HP secara default
  } else {
    sidebarOpen.value = true;
  }
};


// --- Sidebar handler ---
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};
const logout = () => {
  Swal.fire("Logout", "Anda berhasil logout", "success");
};

// ======================================================================
// ===================  TABEL MODERN: KOLOM, FILTER, SORT  ==============
// ======================================================================

// Definisi seluruh kolom yang ditampilkan (semua field pelamar)
const columns = [
  { key: "nama_lengkap", label: "Nama Lengkap", get: (p) => p.nama_lengkap, filterable: true },
  { key: "email", label: "Email", get: (p) => p.email, filterable: true },
  { key: "no_hp", label: "WhatsApp", get: (p) => p.no_hp, filterable: true },
  { key: "nik", label: "NIK", get: (p) => p.nik, filterable: true },
  { key: "jenis_kelamin", label: "Jenis Kelamin", get: (p) => p.jenis_kelamin, filterable: true, align: "center" },
  { key: "tempat_lahir", label: "Tempat Lahir", get: (p) => p.tempat_lahir, filterable: true },
  { key: "tanggal_lahir", label: "Tanggal Lahir", get: (p) => p.tanggal_lahir, filterable: true },
  { key: "usia", label: "Usia", get: (p) => p.usia, filterable: true, align: "center" },
  { key: "tinggi_badan", label: "Tinggi (cm)", get: (p) => p.tinggi_badan, filterable: true, align: "center" },
  { key: "berat_badan", label: "Berat (kg)", get: (p) => p.berat_badan, filterable: true, align: "center" },
  { key: "alamat", label: "Alamat", get: (p) => p.alamat, filterable: true },
  { key: "provinsi", label: "Provinsi", get: (p) => p.provinsi, filterable: true },
  { key: "kabupatenkota", label: "Kabupaten/Kota", get: (p) => p.kabupatenkota, filterable: true },
  { key: "kecamatan", label: "Kecamatan", get: (p) => p.kecamatan, filterable: true },
  { key: "rt", label: "Rt", get: (p) => p.rt, filterable: true },
  { key: "rw", label: "Rw", get: (p) => p.rw, filterable: true },
  { key: "posisi", label: "Posisi Dilamar", get: (p) => p.loker?.posisi, filterable: true },
  { key: "jenjang_pendidikan", label: "Jenjang Pendidikan", get: (p) => p.jenjang_pendidikan, filterable: true },
  { key: "nama_sekolah", label: "Nama Sekolah", get: (p) => p.nama_sekolah, filterable: true },
  { key: "jurusan", label: "Jurusan", get: (p) => p.jurusan, filterable: true },
  { key: "nilai_sekolah", label: "Nilai", get: (p) => p.nilai_sekolah, filterable: true, align: "center" },
  { key: "sumberinfoloker", label: "Sumber Info", get: (p) => p.sumberinfoloker, filterable: true },
  { key: "sumber_informasidua", label: "Detail Sumber", get: (p) => p.sumber_informasidua, filterable: true },
  { key: "pengalaman_kerja_tlsi", label: "Pernah di TLS", get: (p) => p.pengalaman_kerja_tlsi, filterable: true, align: "center" },
  { key: "detail_pengalaman_tls", label: "Detail Pengalaman", get: (p) => p.detail_pengalaman_tls, filterable: true },
  { key: "dokumen", label: "Dokumen", get: (p) => p.dokumen_tambahan, filterable: false, sortable: false },
  { key: "createdAt", label: "Tanggal Lamar", get: (p) => p.createdAt, filterable: false },
];

// State filter per-kolom: { [key]: Set<string> }
const filterState = reactive(
  columns.reduce((acc, c) => {
    if (c.filterable) acc[c.key] = new Set();
    return acc;
  }, {})
);

const globalSearch = ref("");
const sortKey = ref("createdAt");
const sortDir = ref("desc");
const pageSize = ref(10);
const currentPage = ref(1);

// --- Dropdown filter (teleported) ---
const openFilterKey = ref(null);
const dropdownSearch = ref("");
const currentOptions = ref([]);
const filterPos = ref({ top: 0, left: 0 });
const theadRefs = ref({});
const scrollWrapRef = ref(null);

function setThRef(key, el) {
  if (el) theadRefs.value[key] = el;
}

function getUniqueValues(col) {
  const vals = new Set();
  pelamar.value.forEach((p) => {
    const raw = col.get(p);
    vals.add(raw === null || raw === undefined || raw === "" ? "-" : String(raw));
  });
  return Array.from(vals).sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
}

function openFilter(col) {
  if (openFilterKey.value === col.key) {
    openFilterKey.value = null;
    return;
  }
  const el = theadRefs.value[col.key];
  if (el) {
    const rect = el.getBoundingClientRect();
    const panelWidth = 260;
    filterPos.value = {
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - panelWidth - 16),
    };
  }
  dropdownSearch.value = "";
  currentOptions.value = getUniqueValues(col);
  openFilterKey.value = col.key;
}

function closeFilter() {
  openFilterKey.value = null;
}

const filteredDropdownOptions = computed(() => {
  const q = dropdownSearch.value.trim().toLowerCase();
  if (!q) return currentOptions.value;
  return currentOptions.value.filter((v) => v.toLowerCase().includes(q));
});

function toggleCheckboxValue(key, val) {
  const set = filterState[key];
  if (!set) return;
  if (set.has(val)) set.delete(val);
  else set.add(val);
}

function selectAllVisible() {
  const set = filterState[openFilterKey.value];
  if (!set) return;
  filteredDropdownOptions.value.forEach((v) => set.add(v));
}

function clearColumnFilter(key) {
  filterState[key]?.clear();
}

const activeFilterCount = computed(() =>
  columns.reduce((acc, c) => acc + (c.filterable ? filterState[c.key]?.size || 0 : 0), 0)
);

function resetAllColumnFilters() {
  columns.forEach((c) => {
    if (c.filterable) filterState[c.key].clear();
  });
  globalSearch.value = "";
}

// Tutup dropdown saat scroll / resize agar posisi tidak "ngambang"
// (tapi JANGAN tutup kalau scroll-nya terjadi di dalam panel filter itu sendiri,
// misalnya saat user scroll daftar checkbox)
function handleScrollOrResize(e) {
  if (!openFilterKey.value) return;
  const target = e.target;
  if (
    target &&
    typeof target.closest === "function" &&
    target.closest(".jp-filter-panel")
  ) {
    return;
  }
  openFilterKey.value = null;
}
onMounted(() => {
  window.addEventListener("scroll", handleScrollOrResize, true);
  window.addEventListener("resize", handleScrollOrResize);
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScrollOrResize, true);
  window.removeEventListener("resize", handleScrollOrResize);
});

// --- Sort ---
function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
}

// --- Filter + Search + Sort gabungan ---
const filteredSorted = computed(() => {
  let list = pelamar.value.filter((p) =>
    columns.every((col) => {
      if (!col.filterable) return true;
      const set = filterState[col.key];
      if (!set || set.size === 0) return true;
      const raw = col.get(p);
      const val = raw === null || raw === undefined || raw === "" ? "-" : String(raw);
      return set.has(val);
    })
  );

  if (globalSearch.value.trim()) {
    const q = globalSearch.value.trim().toLowerCase();
    list = list.filter((p) =>
      [p.nama_lengkap, p.email, p.no_hp, p.nik].some((v) =>
        String(v || "").toLowerCase().includes(q)
      )
    );
  }

  const dir = sortDir.value === "asc" ? 1 : -1;
  const col = columns.find((c) => c.key === sortKey.value);

  list = [...list].sort((a, b) => {
    let va = col ? col.get(a) : a[sortKey.value];
    let vb = col ? col.get(b) : b[sortKey.value];

    if (sortKey.value === "createdAt") {
      va = new Date(va).getTime();
      vb = new Date(vb).getTime();
    }

    if (va === null || va === undefined) va = "";
    if (vb === null || vb === undefined) vb = "";

    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb), "id", { numeric: true }) * dir;
  });

  return list;
});

// --- Pagination ---
const totalItems = computed(() => filteredSorted.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));
const paginatedPelamar = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredSorted.value.slice(start, start + pageSize.value);
});

watch(totalItems, () => {
  currentPage.value = 1;
});
watch(pageSize, () => {
  currentPage.value = 1;
});

// --- Lifecycle ---
onMounted(async () => {
  //await loadPelamar();
  try {
    const pagesData = localStorage.getItem('pages') || localStorage.getItem('user_pages');
    const pages = pagesData ? JSON.parse(pagesData) : [];
    
    // Ganti 'loker' atau 'pelamar' sesuai `code` halaman di database UAC kamu
    hasAccess.value = pages.includes('daftar-pelamar'); 
  } catch (e) {
    hasAccess.value = false;
  }

  // 3. Hanya panggil API jika user punya akses
  if (hasAccess.value) {
    await loadPelamar();
    
    try {
      const res = await axios.get(`${API_BASE_URL}/loker`);
      lokerList.value = res.data;
    } catch (error) {
      console.error("Gagal memuat daftar loker:", error);
      lokerList.value = [];
    }
  }
  checkMobile(); // Panggil saat awal load
  window.addEventListener("resize", checkMobile)
  // try {
  //   const res = await axios.get(`${API_BASE_URL}/loker`);
  //   lokerList.value = res.data;
  // } catch (error) {
  //   console.error("Gagal memuat daftar loker:", error);
  //   lokerList.value = [];
  // }
  window.addEventListener("resize", () => {
    windowWidth.value = window.innerWidth;
  });
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

.jp-admin {
  --ink: #101828;
  --ink-soft: #51607a;
  --ink-faint: #8a94a6;
  --canvas: #f6f7f9;
  --surface: #ffffff;
  --primary: #1e3a5f;
  --primary-dark: #142943;
  --primary-soft: #e8eef5;
  --accent: #b6912b;
  --accent-soft: #fbf1d6;
  --success: #157a4a;
  --success-soft: #e6f4ec;
  --danger: #d0392c;
  --danger-soft: #fbeae8;
  --info: #0f6d92;
  --border: #e3e6ec;

  background: var(--canvas);
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
}

.jp-admin h2, .jp-admin h5 {
  font-family: 'Manrope', system-ui, sans-serif;
}

.main-content-wrapper { overflow-x: hidden; width: 100%; }

/* ---------- PAGE HEAD ---------- */
.jp-page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin: 14px 0 22px;
}
.jp-page-head h2 {
  font-size: 24px;
  font-weight: 800;
  color: var(--primary-dark);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.jp-page-head h2 i { color: var(--accent); }
.jp-page-sub { color: var(--ink-soft); font-size: 13.5px; margin: 0; }

.jp-stat-chip {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.jp-stat-num { font-size: 20px; font-weight: 800; color: var(--primary); font-family: 'Manrope', sans-serif; line-height: 1; }
.jp-stat-label { font-size: 11.5px; color: var(--ink-faint); margin-top: 3px; }

/* ---------- CARD ---------- */
.jp-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(16,24,40,.03);
  padding: 20px;
  margin-bottom: 20px;
}
.jp-card-title {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

/* ---------- FILTER CARD ---------- */
.jp-filter-card label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-soft);
  margin-bottom: 5px;
}
.jp-input {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  padding: 8px 11px;
  border: 1.5px solid var(--border);
  border-radius: 9px;
  background: var(--canvas);
  color: var(--ink);
  outline: none;
  transition: border-color .15s ease, background .15s ease;
}
.jp-input:focus { border-color: var(--primary); background: #fff; }
.jp-input-sm { padding: 6px 8px; font-size: 13px; width: auto; }

.jp-filter-actions { display: flex; align-items: flex-end; gap: 8px; }

.jp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 13.5px;
  border: none;
  border-radius: 9px;
  padding: 9px 14px;
  cursor: pointer;
  transition: transform .12s ease, background .15s ease, box-shadow .15s ease;
  white-space: nowrap;
}
.jp-btn-sm { padding: 7px 12px; font-size: 12.5px; }
.jp-btn-primary { background: var(--primary); color: #fff; flex: 1; }
.jp-btn-primary:hover { background: var(--primary-dark); }
.jp-btn-success { background: var(--success); color: #fff; flex: 1; }
.jp-btn-success:hover { filter: brightness(0.92); }
.jp-btn-danger { background: var(--danger); color: #fff; flex: 1; }
.jp-btn-danger:hover { filter: brightness(0.92); }

/* ---------- TABLE TOOLBAR ---------- */
.jp-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.jp-search-box {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 420px;
}
.jp-search-box i {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-faint);
  font-size: 14px;
}
.jp-search-box input {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-size: 13.5px;
  padding: 9px 34px 9px 36px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: var(--canvas);
  outline: none;
  transition: border-color .15s ease, background .15s ease;
}
.jp-search-box input:focus { border-color: var(--primary); background: #fff; }
.jp-clear-x {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: var(--ink-faint);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 4px;
}

.jp-toolbar-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }

.jp-reset-filters {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 12.5px;
  font-weight: 700;
  padding: 8px 13px;
  border-radius: 999px;
  cursor: pointer;
}

.jp-page-size { display: flex; align-items: center; gap: 8px; }
.jp-page-size label { font-size: 12.5px; color: var(--ink-soft); font-weight: 600; white-space: nowrap; }

/* ---------- SCROLLABLE TABLE ---------- */
.jp-scroll-wrap {
  overflow: auto;
  max-height: 620px;
  border: 1px solid var(--border);
  border-radius: 12px;
  -webkit-overflow-scrolling: touch;
}

.jp-table {
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
  font-size: 13px;
}

.jp-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--primary-soft);
  color: var(--primary-dark);
  font-weight: 800;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .03em;
  padding: 0;
  border-bottom: 1.5px solid var(--border);
  white-space: nowrap;
}

.jp-th-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 11px 14px;
  min-width: 150px;
}

.jp-th-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}
.jp-th-label.is-sortable { cursor: pointer; }
.jp-th-label.is-sortable:hover { color: var(--primary); }

.jp-sort-icon { font-size: 10px; color: var(--ink-faint); }
.jp-sort-icon.is-active { color: var(--primary); }

.jp-filter-btn {
  border: none;
  background: transparent;
  color: var(--ink-faint);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 5px;
  border-radius: 6px;
  position: relative;
  flex-shrink: 0;
  transition: background .15s ease, color .15s ease;
}
.jp-filter-btn:hover { background: rgba(30,58,95,.08); color: var(--primary); }
.jp-filter-btn.is-active { color: var(--accent); }
.jp-filter-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--accent);
  color: #2a2005;
  font-size: 9px;
  font-weight: 800;
  min-width: 14px;
  height: 14px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}

.jp-table tbody td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--ink);
  white-space: nowrap;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jp-table tbody tr:hover td { background: var(--canvas); }
.jp-table tbody tr:nth-child(even) td { background: #fbfbfc; }
.jp-table tbody tr:nth-child(even):hover td { background: var(--canvas); }

.jp-col-no { min-width: 56px !important; }
.jp-col-aksi { min-width: 140px !important; }

.jp-sticky-left {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--surface);
  box-shadow: 2px 0 6px rgba(16,24,40,.05);
}
thead .jp-sticky-left { z-index: 4; background: var(--primary-soft); }

.jp-sticky-right {
  position: sticky;
  right: 0;
  z-index: 2;
  background: var(--surface);
  box-shadow: -2px 0 6px rgba(16,24,40,.05);
}
thead .jp-sticky-right { z-index: 4; background: var(--primary-soft); }

.jp-muted { color: var(--ink-faint); }
.jp-nowrap { white-space: nowrap; }

.jp-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}
.jp-pill.is-blue { background: #e5edfb; color: #1d4ed8; }
.jp-pill.is-pink { background: #fce7f3; color: #be185d; }
.jp-pill.is-amber { background: var(--accent-soft); color: #8a6d1f; }
.jp-pill.is-slate { background: #eef0f3; color: var(--ink-faint); }
.jp-pill.is-navy { background: var(--primary-soft); color: var(--primary); }

.jp-doc-link {
  color: var(--primary);
  font-weight: 700;
  font-size: 12.5px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.jp-doc-link:hover { color: var(--primary-dark); text-decoration: underline; }

.jp-actions { display: flex; gap: 6px; justify-content: center; }
.jp-icon-btn {
  width: 30px; height: 30px;
  border: none;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  transition: filter .15s ease, transform .12s ease;
}
.jp-icon-btn:hover { transform: translateY(-1px); }
.jp-icon-btn.is-info { background: #e5f2f8; color: var(--info); }
.jp-icon-btn.is-warning { background: var(--accent-soft); color: #8a6d1f; }
.jp-icon-btn.is-danger { background: var(--danger-soft); color: var(--danger); }

.jp-empty-row {
  text-align: center;
  padding: 40px 20px !important;
  color: var(--ink-faint);
  font-size: 13.5px;
  white-space: normal !important;
}
.jp-empty-row i { display: block; font-size: 22px; margin-bottom: 8px; }

/* ---------- PAGINATION ---------- */
.jp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.jp-page-info { font-size: 12.5px; color: var(--ink-soft); }
.jp-page-controls { display: flex; align-items: center; gap: 4px; }
.jp-page-btn {
  width: 30px; height: 30px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  transition: background .15s ease, color .15s ease;
}
.jp-page-btn:hover:not(:disabled) { background: var(--primary-soft); color: var(--primary); }
.jp-page-btn:disabled { opacity: .4; cursor: not-allowed; }
.jp-page-current {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
  padding: 0 10px;
}

/* ---------- LOADING / EMPTY STATE ---------- */
.jp-state { text-align: center; padding: 60px 20px; color: var(--ink-soft); }
.jp-state i { font-size: 32px; color: var(--ink-faint); margin-bottom: 10px; display: block; }
.jp-spinner {
  width: 30px; height: 30px;
  border: 3px solid var(--primary-soft);
  border-top-color: var(--primary);
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: jp-spin .7s linear infinite;
}
@keyframes jp-spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .jp-card { padding: 14px; }
  .jp-page-head { flex-direction: column; align-items: flex-start; }
  .jp-stat-chip { align-items: flex-start; }
}
</style>

<style>
/* ---------- TELEPORTED FILTER DROPDOWN (global, not scoped) ---------- */
.jp-filter-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: transparent;
}

/* Cari .jp-filter-panel dan sesuaikan style ini */
.jp-filter-panel {
  position: fixed;
  z-index: 2001;
  width: 260px;
  background: #ffffff;
  border: 1px solid #e3e6ec;
  border-radius: 12px;
  box-shadow: 0 20px 40px -12px rgba(16, 24, 40, .28);
  font-family: 'Inter', system-ui, sans-serif;
  
  /* PERBAIKAN 1: Gunakan display flex agar komponen anak teratur */
  display: flex;
  flex-direction: column;
  max-height: 380px; /* Batasi tinggi maksimum panel */
  
  /* Hapus atau atur overflow menjadi visible/unset */
  overflow: visible; 
}

.jp-filter-search {
  position: relative;
  padding: 10px;
  border-bottom: 1px solid #eef0f3;
}
.jp-filter-search i {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a94a6;
  font-size: 12.5px;
}
.jp-filter-search input {
  width: 100%;
  font-size: 13px;
  padding: 7px 10px 7px 28px;
  border: 1.5px solid #e3e6ec;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
}
.jp-filter-search input:focus { border-color: #1e3a5f; }

.jp-filter-quick {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #eef0f3;
}
.jp-filter-quick button {
  border: none;
  background: none;
  color: #1e3a5f;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.jp-filter-quick button:hover { text-decoration: underline; }
.jp-filter-quick span { color: #c3c8d1; font-size: 11px; }

/* Cari .jp-filter-options dan sesuaikan style ini */
.jp-filter-options {
  /* PERBAIKAN 2: Aktifkan scrollbar vertikal */
  max-height: 220px;
  overflow-y: auto;
  overscroll-behavior: contain; /* Mencegah scroll tembus ke halaman utama */
  padding: 6px 4px;
  flex: 1;
  min-height: 0; 
}

.jp-filter-options::-webkit-scrollbar {
  width: 6px;
}

.jp-filter-options::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.jp-filter-options::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.jp-filter-options::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.jp-checkbox-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  font-size: 13px;
  color: #101828;
  cursor: pointer;
  border-radius: 7px;
}
.jp-checkbox-row:hover { background: #f6f7f9; }
.jp-checkbox-row input {
  width: 15px;
  height: 15px;
  accent-color: #1e3a5f;
  cursor: pointer;
  flex-shrink: 0;
}
.jp-checkbox-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jp-filter-empty {
  padding: 16px;
  text-align: center;
  font-size: 12.5px;
  color: #8a94a6;
}

.jp-filter-footer {
  padding: 10px;
  border-top: 1px solid #eef0f3;
}
.jp-filter-footer .jp-btn { width: 100%; }
</style>