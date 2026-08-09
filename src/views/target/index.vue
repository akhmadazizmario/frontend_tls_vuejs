<template>
    <div class="d-flex flex-column min-vh-100 bg-light-soft">
        <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
        <div class="d-flex flex-grow-1">
            <Sidebar :isOpen="sidebarOpen" />
            <main
                class="flex-grow-1 p-3 p-md-5"
                :style="{
                    marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
                    transition: 'margin-left 0.3s ease',
                    marginTop: '56px',
                }"
            >
                <div class="container-fluid">
                    <h2 class="fw-bold mb-4 text-success-dark text-uppercase border-bottom pb-2">
                        📊 Rekap Target TLS
                    </h2>

                    <div class="filter-box mb-4">
                        <div class="row g-3 align-items-end">
                            <div class="col-md-2">
                                <label class="form-label text-muted small fw-semibold">Tanggal Awal</label>
                                <input
                                    v-model="filters.pBeginDate"
                                    type="date"
                                    class="form-control form-control-sm border-dark"
                                />
                            </div>
                            <div class="col-md-2">
                                <label class="form-label text-muted small fw-semibold">Tanggal Akhir</label>
                                <input
                                    v-model="filters.pEndDate"
                                    type="date"
                                    class="form-control form-control-sm border-dark"
                                />
                            </div>
                            <div class="col-md-2">
                                <label class="form-label text-muted small fw-semibold">IDP</label>
                                <div class="dropdown w-100">
                                    <button
                                        class="btn btn-outline-dark btn-sm dropdown-toggle w-100 border-dark text-start d-flex justify-content-between align-items-center"
                                        type="button"
                                        id="idpFilterDropdown"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        {{ selectedIdpText }}
                                    </button>
                                    <ul
                                        class="dropdown-menu p-2 shadow"
                                        aria-labelledby="idpFilterDropdown"
                                        style="max-height: 300px; overflow-y: auto;"
                                    >
                                        <li class="px-2 mb-1">
                                            <button class="btn btn-light btn-sm w-50 me-1" @click="selectAllIdps">Pilih Semua</button>
                                            <button class="btn btn-light btn-sm w-47" @click="clearAllIdps">Hapus Semua</button>
                                        </li>
                                        <li class="px-2">
                                            <input
                                                type="text"
                                                class="form-control form-control-sm mb-2"
                                                placeholder="Cari IDP..."
                                                v-model="idpSearchQuery"
                                                @click.stop
                                            />
                                        </li>
                                        <li v-for="idp in filteredIdpOptions" :key="idp" class="dropdown-item p-0">
                                            <div class="form-check m-0 px-2 py-1 ">
                                                <input
                                                    class="form-check-input me-2"
                                                    type="checkbox"
                                                    :value="idp"
                                                    :id="`idp-${idp}`"
                                                    v-model="filters.selectedIdps"
                                                    @click.stop
                                                />
                                                <label class="form-check-label w-100 text-start" :for="`idp-${idp}`">
                                                    {{ idp }}
                                                </label>
                                            </div>
                                        </li>
                                        <li v-if="filteredIdpOptions.length === 0" class="px-2 text-muted small">
                                            Tidak ada IDP yang cocok.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="col-md-2">
                                <button class="btn btn-dark w-100 py-1" @click="fetchData" :disabled="loading">
                                    <i class="fas fa-search me-2"></i> {{ loading ? 'Memuat...' : 'Tampilkan' }}
                                </button>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-success"  @click="downloadExcel">
                                    <i class="bi bi-file-earmark-excel me-2"></i>Download Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="!dataLoaded && !loading" class="text-center py-5 text-muted fs-5 border border-dark bg-white">
                        <i class="fas fa-filter fa-2x mb-2"></i>
                        <p class="mb-0">Silakan pilih filter tanggal dan klik <strong>Tampilkan</strong> untuk memuat data.</p>
                    </div>
                     
                    <div v-else-if="loading" class="text-center py-5">
                        <video autoplay
                               muted
                               loop
                               playsinline
                               style="width: 180px; height: auto; border-radius: 12px;"
                        >
                            <source src="/loading.mp4" type="video/mp4" />
                                Browser kamu tidak mendukung video tag.
                        </video>
                        <div class="mt-3 text-muted fs-5">
                            Memuat data, harap tunggu....
                        </div>
                    </div>

                    <div v-else-if="dataLoaded">
                        <div v-if="filteredTableItems.length" class="table-wrapper shadow-sm border border-dark rounded-2">
                            <table class="table-ci3">
                                <thead v-html="tableHeader"></thead>
                                <tbody>
                                    <tr
                                        v-for="(row, i) in filteredTableItems"
                                        :key="i"
                                        :class="{ 'row-alt': i % 2 === 1 }">
                                         <td>{{ poTargetMap[row.xMark?.trim()]?.shipDate || formatDate(row.tgl_ekspor) }}</td>
                                        <td>{{ row.xPO }}</td>
                                        <td align="right">{{ row.total_qty_keseluruhan }}</td>
                                        <td>{{ row.xMark }}</td> <td align="right">{{ row.qty_total_exp_hari_ini }}</td>
                                        <td align="right">{{ row.exp_keseluruhan }}</td>

                                        <td align="right">{{ row.xTls_Qty_Body }}</td>
                                        <td align="right">{{ row.tTls_Qty_Body }}</td>
                                        <td class="bg-soft-red">{{ row.xBelumLinkBody }}</td>

                                        <td align="right">{{ row.xTls_Qty_Primary }}</td>
                                        <td align="right">{{ row.tTLS_Qty_Primary }}</td>
                                        <td class="bg-soft-red">{{ row.xBelumLinkKrah }}</td>

                                        <td align="right">{{ row.qty_total_LO_hari_ini }}</td>
                                        <td align="right">{{ row.LO_keseluruhan }}</td>
                                        <td class="bg-soft-red">{{ row.xBelumLO }}</td>

                                        <td align="right">{{ row.qty_total_steam_hari_ini }}</td>
                                        <td align="right">{{ row.steam_keseluruhan }}</td>

                                        <td align="right">{{ row.qty_total_sewing_hari_ini }}</td>
                                        <td align="right">{{ row.sewing_keseluruhan }}</td>

                                        <td align="right">{{ row.qty_total_sontex_hari_ini }}</td>
                                        <td align="right">{{ row.sontex_keseluruhan }}</td>
                                        <td class="bg-soft-red">{{ row.xBelumSontek }}</td>

                                        <td align="right">{{ row.qty_total_qc_hari_ini }}</td>
                                        <td align="right">{{ row.qc_keseluruhan }}</td>

                                        <td align="right">{{ row.aty_total_sulam_hari_ini }}</td>
                                        <td align="right">{{ row.sulam_keseluruhan }}</td>

                                        <td align="right">{{ row.qty_total_kirim_hari_ini }}</td>
                                        <td align="right">{{ row.kirim_keseluruhan }}</td>

                                        <td class="fw-bold text-danger">{{ row.kirim_keseluruhan - row.exp_keseluruhan }}</td>
                                    </tr>
                                </tbody>

                                <tfoot>
                                    <tr>
                                        <td colspan="4" align="right" class="fw-bold bg-total text-white">
                                            TOTAL KESELURUHAN
                                        </td>
                                        <td v-for="(col, idx) in totalCols" :key="idx" align="right">
                                            {{ total(col) }}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div v-else class="text-center py-4 text-muted border border-dark bg-white">
                            <i class="far fa-folder-open fa-2x mb-2"></i>
                            <p class="mb-0">Tidak ada data rekap target yang cocok dengan filter Anda.</p>
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
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const allRawItems = ref([]); 
const loading = ref(false);
const dataLoaded = ref(false); 
const sidebarOpen = ref(false);
const user = ref({ name: "Pengguna" });
const windowWidth = ref(window.innerWidth);
const today = new Date().toISOString().slice(0, 10);

const filters = ref({
    pBeginDate: today, 
    pEndDate: today,
    selectedIdps: [],
});

const allIdpOptions = ref([]);
const idpSearchQuery = ref('');
const poTargetMap = ref({})

const fetchPoTarget = async () => {
    try {

        const res = await axios.get(`${API_BASE_URL}/target/po-laporantarget`, {
            params: {
                beginDate: filters.value.pBeginDate,
                endDate: filters.value.pEndDate
            }
        })

        const map = {}

        res.data.data.forEach(item => {
            map[item.xMark?.trim()] = {
                po: item.PO,
                shipDate: item.ShipDate
            }
        })

        poTargetMap.value = map
        console.log("PO TARGET MAP:", poTargetMap.value)

    } catch (err) {
        console.error("Gagal ambil PO Target", err)
    }
}

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


// Computed property untuk menampilkan teks pada tombol filter IDP
const selectedIdpText = computed(() => {
    if (filters.value.selectedIdps.length === 0) {
        return 'Pilih IDP';
    } else if (filters.value.selectedIdps.length === 1) {
        return filters.value.selectedIdps[0];
    } else if (filters.value.selectedIdps.length === allIdpOptions.value.length && allIdpOptions.value.length > 0) {
        return 'Semua IDP Terpilih';
    } else {
        return `${filters.value.selectedIdps.length} IDP Terpilih`;
    }
});

// Computed property untuk memfilter daftar IDP di dropdown berdasarkan query pencarian
const filteredIdpOptions = computed(() => {
    const query = idpSearchQuery.value.toLowerCase().trim();
    if (!query) {
        return allIdpOptions.value;
    }
    // Filter IDP berdasarkan pencarian
    return allIdpOptions.value.filter(idp => String(idp).toLowerCase().includes(query));
});


// 💡 COMPUTED PROPERTY UTAMA: Data yang Tampil di Tabel (otomatis memfilter berdasarkan checkbox IDP)
const filteredTableItems = computed(() => {
    if (!dataLoaded.value || allRawItems.value.length === 0) {
        return [];
    }

    let resultItems = allRawItems.value;
    const selected = filters.value.selectedIdps;

    // 1. FILTER BERDASARKAN CHECKBOX (selectedIdps)
    if (selected.length > 0 && selected.length < allIdpOptions.value.length) {
        resultItems = resultItems.filter(item => 
            selected.includes(String(item.xMark))
        );
    } 
    
    return resultItems;
});


// Fungsi untuk memilih semua IDP
const selectAllIdps = () => {
    filters.value.selectedIdps = [...allIdpOptions.value];
};

// Fungsi untuk menghapus semua pilihan IDP
const clearAllIdps = () => {
    filters.value.selectedIdps = [];
};

// Fungsi untuk mendapatkan daftar IDP unik dari data
const extractUniqueIdps = (data) => {
    const idpSet = new Set(data.map(item => String(item.xMark)).filter(idp => idp && idp !== ""));
    allIdpOptions.value = Array.from(idpSet).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
    });
};

const downloadExcel = async () => {
  if (!filters.value.pBeginDate || !filters.value.pEndDate) {
    alert("Tanggal awal dan akhir harus diisi!");
    return;
  }

  const url = `${API_BASE_URL}/target/export-excel?pBeginDate=${filters.value.pBeginDate}&pEndDate=${filters.value.pEndDate}`;
  window.open(url, "_blank");
};

const fetchData = async () => {
    if (!filters.value.pBeginDate || !filters.value.pEndDate) {
        alert("Mohon lengkapi Tanggal Awal dan Tanggal Akhir.");
        return;
    }

    loading.value = true;
    allRawItems.value = [];
    dataLoaded.value = false;

    try {

        const params = {
            pBeginDate: filters.value.pBeginDate,
            pEndDate: filters.value.pEndDate,
        };

        const res = await axios.get(`${API_BASE_URL}/target`, { params });

        const rawItems = (res.data.data || []).filter(
            (x) => x.tgl_ekspor !== "TOTAL"
        );

        allRawItems.value = rawItems;

        extractUniqueIdps(rawItems);

        // ambil po target
        await fetchPoTarget()

        dataLoaded.value = true;

    } catch (e) {
        console.error(e);
        alert("Gagal memuat data.");
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    window.addEventListener("resize", handleResize);
    // Hapus fetchData() di onMounted
});

onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
});

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";

// 💡 UBAH FUNGSI TOTAL: Menggunakan filteredTableItems
const total = (key) =>
    filteredTableItems.value.reduce((sum, r) => sum + (Number(r[key]) || 0), 0).toLocaleString("id-ID"); 

const totalCols = [
    "qty_total_exp_hari_ini",
    "exp_keseluruhan",
    "xTls_Qty_Body",
    "tTls_Qty_Body",
    "xBelumLinkBody",
    "xTls_Qty_Primary",
    "tTLS_Qty_Primary",
    "xBelumLinkKrah",
    "qty_total_LO_hari_ini",
    "LO_keseluruhan",
    "xBelumLO",
    "qty_total_steam_hari_ini",
    "steam_keseluruhan",
    "qty_total_sewing_hari_ini",
    "sewing_keseluruhan",
    "qty_total_sontex_hari_ini",
    "sontex_keseluruhan",
    "xBelumSontek",
    "qty_total_qc_hari_ini",
    "qc_keseluruhan",
    "aty_total_sulam_hari_ini",
    "sulam_keseluruhan",
    "qty_total_kirim_hari_ini",
    "kirim_keseluruhan",
    "xSisa",
];

const tableHeader = computed(() => `
    <tr class="header-main">
    <th colspan="6" style="border: 1px solid #000;">INFORMATION</th>
    <th colspan="3" style="border: 1px solid #000;">LINKING BODY</th>
    <th colspan="3" style="border: 1px solid #000;">LINKING KERAH</th>
    <th colspan="3" style="border: 1px solid #000;">LO</th>
    <th colspan="2" style="border: 1px solid #000;">STEAM</th>
    <th colspan="2" style="border: 1px solid #000;">SEWING</th>
    <th colspan="3" style="border: 1px solid #000;">SONTEK</th>
    <th colspan="2" style="border: 1px solid #000;">QC LAMPU</th>
    <th colspan="2" style="border: 1px solid #000;">SULAM</th>
    <th colspan="2" style="border: 1px solid #000;">AKUM KIRIM</th>
    <th rowspan="2" style="border: 1px solid #000;">SISA</th>
    </tr>
    <tr class="header-sub">
    <th style="border: 1px solid #000;">TGL</th>
    <th style="border: 1px solid #000;">PO</th>
    <th style="border: 1px solid #000;">QTY</th>
    <th style="border: 1px solid #000;">IDP</th> <th style="border: 1px solid #000;">TERIMA</th><th style="border: 1px solid #000;">AKUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th><th style="border: 1px solid #000;">BELUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th><th style="border: 1px solid #000;">BELUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th><th style="border: 1px solid #000;">BELUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th><th style="border: 1px solid #000;">BELUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th>
    <th style="border: 1px solid #000;">HASIL</th><th style="border: 1px solid #000;">AKUM</th>
    </tr>
`);
</script>

<style scoped>
/* ... (Style tidak berubah) ... */
.table-wrapper {
    overflow: auto;
    max-height: 80vh;
    background-color: #fff;
}

.table-ci3 {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    background-color: #fff;
}

.table-ci3 th,
.table-ci3 td {
    border: 1px solid #000;
    padding: 5px 6px;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap;
    line-height: 1.3;
}

.table-ci3 thead th {
    background-color: #006400;
    color: #fff;
    font-weight: bold;
    position: sticky;
    top: 0;
    z-index: 2;
}

.header-sub th {
    background-color: #008000;
    color: #fff;
}

.row-alt td {
    background-color: #f9f9f9;
}

.table-ci3 tr:hover td {
    background-color: #eaf4e4 !important;
}

.bg-soft-red {
    background-color: #ffe6e6;
}

.bg-total {
    background-color: #006400;
}

tfoot td {
    border-top: 2px solid #000;
    font-weight: bold;
    color: #fff;
    background-color: #006400;
}

/* Style tambahan untuk dropdown filter IDP */
.dropdown-menu {
    overflow: hidden; 
}

.form-check-input {
    cursor: pointer;
}
</style>