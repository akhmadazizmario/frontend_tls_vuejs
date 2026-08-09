<template>
  <div class="d-flex flex-column vh-100 bg-soft-gray overflow-hidden">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    <div class="d-flex flex-grow-1 overflow-hidden pt-5 w-100 position-relative">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['flex-grow-1 p-3 p-md-4 d-flex flex-column overflow-hidden main-content', sidebarOpen ? 'sidebar-is-open' : 'sidebar-is-closed']">
        
        <div class="flex-shrink-0">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
            <h5 class="fw-bold text-dark m-0">
              <i class="bi bi-file-earmark-bar-graph me-2 text-primary"></i>Summary Produksi Finishing Per Gedung
            </h5>
            <div class="d-flex gap-2">
              <button @click="exportToExcel" class="btn btn-success btn-sm shadow-sm px-3 fw-bold">
                <i class="bi bi-file-earmark-excel me-1"></i> EXCEL
              </button>
            </div>
          </div>

          <div class="mb-4 d-flex flex-wrap gap-2">
             <a href="/finishing-pergedung" class="btn btn-sm btn-success fw-semibold"><i class="bi bi-card-list"></i> Laporan Prod Finishing</a>
             <div class="vr mx-2 bg-secondary opacity-50" style="height: 35px; min-width: 1.5px;"></div>
             <a href="/view-finishing-turun-pergedung" class="btn btn-warning active"><i class="bi bi-highlighter"></i> Input after Linking P</a>
             <a href="/view-finishing-turun-soom-pergedung" class="btn btn-warning active"><i class="bi bi-highlighter"></i> Input After Sontex</a>
             <a href="/view-form-turun-lainlain" class="btn btn-primary active"><i class="bi bi-highlighter"></i> Input Lain-Lain</a>
             <a href="/view-from-akum-pergedung-mass" class="btn btn-primary">Syncronization input Data Hasil Day</a>
          </div>

          <div class="card border-0 shadow-sm rounded-3 mb-3 p-3 bg-white">
            <div class="row g-2 align-items-end">
              <div class="col-md-3 col-sm-6">
                <label class="fw-bold small mb-1 text-muted text-uppercase">Tanggal Summary</label>
                <input type="date" v-model="filterDate" class="form-control form-control-sm border-2">
              </div>
              
              <div class="col-md-3 col-sm-6">
                <label class="fw-bold small mb-1 text-muted text-uppercase">Pilih Gedung</label>
                <div class="dropdown custom-multiselect">
                  <button 
                    class="btn btn-sm btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center border-2 bg-white text-dark py-1.5" 
                    type="button" 
                    id="dropdownGedung" 
                    data-bs-toggle="dropdown" 
                    data-bs-auto-close="outside" 
                    aria-expanded="false"
                  >
                    <span class="text-truncate">{{ selectedGedungLabel }}</span>
                  </button>
                  <ul class="dropdown-menu w-100 shadow-sm px-2 py-1 overflow-auto" aria-labelledby="dropdownGedung" style="max-height: 200px;">
                    <li class="border-bottom pb-1 mb-1">
                      <div class="form-check small fw-bold">
                        <input class="form-check-input c-pointer" type="checkbox" id="checkAll" :checked="isAllSelected" @change="toggleSelectAll">
                        <label class="form-check-input-label ms-1 c-pointer w-100" for="checkAll">PILIH SEMUA</label>
                      </div>
                    </li>
                    <li v-for="g in availableGedungList" :key="g">
                      <div class="form-check small py-0.5">
                        <input class="form-check-input c-pointer" type="checkbox" :id="'chk_' + g" :value="g" v-model="selectedGedung">
                        <label class="form-check-input-label ms-1 c-pointer w-100" :for="'chk_' + g">{{ g }}</label>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="col-md-2 col-sm-4">
                <button class="btn btn-primary btn-sm w-100 py-2 fw-bold shadow-sm" @click="fetchSummaryData">CARI DATA</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-4 overflow-hidden flex-grow-1 bg-white">
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h6 class="mt-2 fw-bold text-primary">MENYIAPKAN SUMMARY...</h6>
          </div>
          
          <div class="card-body p-0 d-flex flex-column h-100" :class="{ 'is-loading-content': isLoading }">
            <div class="table-scroll-wrapper flex-grow-1 overflow-auto custom-scrollbar p-3 p-md-4">
              <div v-for="(dataGedung, namaGedung) in filteredGroupedSummaryData" :key="namaGedung" class="mb-5 table-responsive">
                <table class="table table-bordered align-middle custom-summary-table mb-0 shadow-sm w-100">
                  <thead class="text-center align-middle header-styled text-dark">
                    <tr>
                      <th rowspan="2" style="width: 10%; min-width: 100px;">Tanggal</th>
                      <th colspan="6" class="bg-light-gray text-uppercase fw-bold text-center">{{ namaGedung }}</th>
                    </tr>
                    <tr>
                      <th style="width: 12%; min-width: 90px;">Dept</th>
                      <th style="width: 14%; min-width: 100px;">Hasil</th>
                      <th style="width: 14%; min-width: 110px;">Akum</th>
                      <th colspan="3" style="width: 40%; min-width: 240px;">Keterangan</th>
                      <th style="width: 10%; min-width: 110px;">Sisa</th>
                    </tr>
                  </thead>
                  
                  <tbody>
  <template v-for="(row, idx) in dataGedung" :key="row.idUnik || row.dept">
    <template v-if="row.dept !== 'Terima'">
      
      <template v-if="row.dept === 'Linking'">
        <tr>
          <td v-if="dataGedung.findIndex(r => r.dept !== 'Terima') === idx" :rowspan="calculateRowspan(dataGedung)" class="text-center align-middle fw-bold bg-white p-3 date-column">
            {{ formatDate(filterDate) }}
          </td>
          
          <td rowspan="2" class="fw-semibold ps-3 text-secondary bg-white align-middle">{{ row.dept }}</td>
          <td rowspan="2" class="text-center fw-bold text-primary bg-white align-middle">{{ row.hasil.toLocaleString('id-ID') }}</td>
          <td rowspan="2" class="text-center fw-bold text-dark bg-white align-middle">{{ row.akum.toLocaleString('id-ID') }}</td>
          
          <td class="ps-3 text-dark bg-white" style="width: 18%;">untuk LO</td>
          <td class="text-center fw-bold text-primary bg-white" style="width: 11%;">{{ row.turunLO.toLocaleString('id-ID') }}</td>
          <td class="text-center fw-bold text-dark bg-white" style="width: 11%;">{{ row.akumTurunLO.toLocaleString('id-ID') }}</td>
          
          <td rowspan="2" class="text-center fw-bold text-danger bg-white align-middle"></td>
        </tr>
        <tr>
          <td class="ps-3 text-dark bg-white">untuk CBS</td>
          <td class="text-center fw-bold text-primary bg-white">{{ row.turunCBS.toLocaleString('id-ID') }}</td>
          <td class="text-center fw-bold text-dark bg-white">{{ row.akumTurunCBS.toLocaleString('id-ID') }}</td>
        </tr>
      </template>

      <template v-else-if="row.dept === 'Sontex'">
        <tr>
          <td v-if="dataGedung.findIndex(r => r.dept !== 'Terima') === idx" :rowspan="calculateRowspan(dataGedung)" class="text-center align-middle fw-bold bg-white p-3 date-column">
            {{ formatDate(filterDate) }}
          </td>

          <td rowspan="2" class="fw-semibold ps-3 text-secondary bg-white align-middle">{{ row.dept }}</td>
          <td rowspan="2" class="text-center fw-bold text-primary bg-white align-middle">{{ row.hasil.toLocaleString('id-ID') }}</td>
          <td rowspan="2" class="text-center fw-bold text-dark bg-white align-middle">{{ row.akum.toLocaleString('id-ID') }}</td>
          
          <td class="ps-3 text-dark bg-white" style="width: 18%;">untuk Soom</td>
          <td class="text-center fw-bold text-primary bg-white" style="width: 11%;">{{ row.turunSoom.toLocaleString('id-ID') }}</td>
          <td class="text-center fw-bold text-dark bg-white" style="width: 11%;">{{ row.akumTurunSoom.toLocaleString('id-ID') }}</td>
          
          <td rowspan="2" class="text-center fw-bold text-danger bg-white align-middle"></td>
        </tr>
        <tr>
          <td class="ps-3 text-dark bg-white">&nbsp;</td>
          <td class="text-center fw-bold text-primary bg-white"></td>
          <td class="text-center fw-bold text-dark bg-white"></td>
        </tr>
      </template>

      <template v-else-if="row.dept === 'Kirim' && row.isHeaderKirim">
        <tr>
          <td v-if="dataGedung.findIndex(r => r.dept !== 'Terima') === idx" :rowspan="calculateRowspan(dataGedung)" class="text-center align-middle fw-bold bg-white p-3 date-column">
            {{ formatDate(filterDate) }}
          </td>

          <td :rowspan="row.totalRowsKirim" class="fw-semibold ps-3 text-secondary bg-white align-middle">{{ row.dept }}</td>
          <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-primary bg-white align-middle">{{ row.hasil.toLocaleString('id-ID') }}</td>
          <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-dark bg-white align-middle">{{ row.akum.toLocaleString('id-ID') }}</td>
          
          <td class="ps-3 text-dark fw-semibold bg-light-blue" style="width: 18%;">Lain-lain {{ row.xWorkName }}</td>
          <td class="text-center fw-bold text-primary bg-light-blue" style="width: 11%;">{{ row.totalLainLain.toLocaleString('id-ID') }}</td>
          <td class="text-center fw-bold text-dark bg-light-blue" style="width: 11%;">{{ row.akumLainLain.toLocaleString('id-ID') }}</td>
          
          <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-danger bg-white align-middle"></td>
        </tr>
      </template>

      <template v-else-if="row.dept === 'Kirim' && !row.isHeaderKirim">
        <tr>
          <td class="ps-3 text-dark bg-white"> Lain-lain {{ row.xWorkName }}</td>
          <td class="text-center fw-bold text-primary bg-white">{{ row.totalLainLain.toLocaleString('id-ID') }}</td>
          <td class="text-center fw-bold text-dark bg-white">{{ row.akumLainLain.toLocaleString('id-ID') }}</td>
        </tr>
      </template>

      <template v-else>
        <tr>
          <td v-if="dataGedung.findIndex(r => r.dept !== 'Terima') === idx" :rowspan="calculateRowspan(dataGedung)" class="text-center align-middle fw-bold bg-white p-3 date-column">
            {{ formatDate(filterDate) }}
          </td>

          <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
          <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
          <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
          <td class="bg-white"></td>
          <td class="bg-white"></td>
          <td class="bg-white"></td>
          <td class="text-center fw-bold text-danger bg-white"></td>
        </tr>
      </template>

    </template>
  </template>
</tbody>
                </table>
              </div>

              <div v-if="Object.keys(filteredGroupedSummaryData).length === 0 && !isLoading" class="text-center py-5">
                <i class="bi bi-inbox text-muted display-4"></i>
                <p class="text-muted mt-2 fw-bold">Tidak ada data summary pada gedung atau tanggal terpilih.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import ExcelJS from "exceljs";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(true);
const filterDate = ref(new Date().toISOString().substr(0, 10));
const isLoading = ref(false);

const rawProductionData = ref([]);
const rawPelengkapTurun = ref([]);
const rawPelengkapTurunSoom = ref([]);
const rawPelengkapTurunLainLainHariIni = ref([]);
const rawPelengkapTurunLainLainAccum = ref([]); 
const historyAkumPerDeptList = ref([]); 

const selectedGedung = ref([]);
const availableGedungList = ref([]); 

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => { localStorage.clear(); window.location.href = "/login"; };
const formatDate = (d) => { 
  if (!d) return '-';
  const date = new Date(d); 
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const calculateRowspan = (dataRows) => {
  let total = 0;
  dataRows.forEach(r => {
    if (r.dept === 'Terima') return; 
    
    if (r.dept === 'Linking' || r.dept === 'Sontex') {
      total += 2; 
    } else if (r.dept === 'Kirim') {
      if (r.isHeaderKirim) {
        total += r.totalRowsKirim;
      }
    } else {
      total += 1;
    }
  });
  return total;
};

const selectedGedungLabel = computed(() => {
  if (selectedGedung.value.length === 0) return 'Pilih Gedung';
  if (selectedGedung.value.length === availableGedungList.value.length) return 'Semua Gedung Terpilih';
  return selectedGedung.value.join(', ');
});

const isAllSelected = computed(() => {
  return availableGedungList.value.length > 0 && selectedGedung.value.length === availableGedungList.value.length;
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedGedung.value = [];
  } else {
    selectedGedung.value = [...availableGedungList.value];
  }
};

const fetchSummaryData = async () => {
  isLoading.value = true;
  try {
    const pAkumHistory = axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-akumperdept/total-history`)
      .catch(err => {
        console.warn("Gagal mengambil akumulasi historis, menggunakan fallback data kosong:", err);
        return { data: { data: [] } };
      });

    const [resProd, resPelengkap, resTurun, resTurunSoom, resLainLainHariIni, resLainLainAkum, resAkumHistory] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turun`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunlainlainhasilhariini`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunlainlainhasilakum`, { params: { pDate: filterDate.value } }),
      pAkumHistory
    ]);
    
    const dataProduksi = resProd.data.data || [];
    const allPelengkap = resPelengkap.data.data || [];
    rawPelengkapTurun.value = resTurun.data.data || [];
    rawPelengkapTurunSoom.value = resTurunSoom.data.data || [];
    rawPelengkapTurunLainLainHariIni.value = resLainLainHariIni.data.data || [];
    rawPelengkapTurunLainLainAccum.value = resLainLainAkum.data.data || []; 
    historyAkumPerDeptList.value = resAkumHistory.data.data || [];
    
    const pelengkapMap = new Map();
    allPelengkap.forEach(p => { if (p.xMark) pelengkapMap.set(String(p.xMark).trim(), p); });
    
    rawProductionData.value = dataProduksi.map(prod => {
      const key = String(prod.xMark).trim();
      const pel = pelengkapMap.get(key);
      return {
        ...prod,
        akum_terima: Number(prod.akum_terima) || 0,
        gedung: pel && pel.gedung ? pel.gedung.trim() : 'TANPA GEDUNG'
      };
    });

    const uniqueGedungSet = new Set(rawProductionData.value.map(item => item.gedung));
    const rawGedungArray = Array.from(uniqueGedungSet);
    
    availableGedungList.value = rawGedungArray.sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    selectedGedung.value = [...availableGedungList.value];

  } catch (err) {
    console.error("Fetch Summary Error:", err);
  } finally {
    isLoading.value = false;
  }
};

const sumByGedung = (dataList, key) => { return dataList.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0); };

const historyAccumulatedData = (listXMarks, deptCategory) => {
  return historyAkumPerDeptList.value
    .filter(h => listXMarks.includes(String(h.xMark).trim()) && h.kategoridept === deptCategory)
    .reduce((sum, item) => sum + (Number(item.total_akum) || 0), 0);
};

const groupedSummaryData = computed(() => {
  const summary = {};
  const recordsByGedung = {};
  
  rawProductionData.value.forEach(item => {
    if (!recordsByGedung[item.gedung]) {
      recordsByGedung[item.gedung] = [];
    }
    recordsByGedung[item.gedung].push(item);
  });

  Object.keys(recordsByGedung).forEach(gedung => {
    const list = recordsByGedung[gedung];
    const listXMarks = list.map(item => String(item.xMark).trim());
    
    const totalTerimaGedung = sumByGedung(list, "akum_terima");

    const dataTurunGedung = rawPelengkapTurun.value.filter(t => t.gedung === gedung);
    const totalTurunLO = dataTurunGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
    const totalTurunCBS = dataTurunGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

    const dataTurunSoomGedung = rawPelengkapTurunSoom.value.filter(t => t.gedung === gedung);
    const totalTurunSoom = dataTurunSoomGedung.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

    const totalAkumTerima  = historyAccumulatedData(listXMarks, "Terima");
    const totalAkumLinking = historyAccumulatedData(listXMarks, "Linking");
    const totalAkumLO      = historyAccumulatedData(listXMarks, "LO");
    const totalAkumSteam   = historyAccumulatedData(listXMarks, "Steam");
    const totalAkumCBS     = historyAccumulatedData(listXMarks, "CBS");
    const totalAkumSewing  = historyAccumulatedData(listXMarks, "Sewing");
    const totalAkumSontex  = historyAccumulatedData(listXMarks, "Sontex");
    const totalAkumSoom    = historyAccumulatedData(listXMarks, "Soom");
    const totalAkumQC      = historyAccumulatedData(listXMarks, "Qc Lampu");
    const totalAkumSulam   = historyAccumulatedData(listXMarks, "Sulam");
    const totalAkumKirim   = historyAccumulatedData(listXMarks, "Kirim");

    const dataLainHariIni = rawPelengkapTurunLainLainHariIni.value.filter(item => item.gedung === gedung);
    const dataLainAkum = rawPelengkapTurunLainLainAccum.value.filter(item => item.gedung === gedung);

    const uniqueGroups = new Map();

    dataLainHariIni.forEach(item => {
      const key = String(item.deptdari || 'N/A').trim();
      if (!uniqueGroups.has(key)) {
        uniqueGroups.set(key, { deptdari: key, total_lainlain: 0, akum_lainlain: 0 });
      }
      uniqueGroups.get(key).total_lainlain += (Number(item.total_lainlain) || 0);
    });

    dataLainAkum.forEach(item => {
      const key = String(item.deptdari || 'N/A').trim();
      if (!uniqueGroups.has(key)) {
        uniqueGroups.set(key, { deptdari: key, total_lainlain: 0, akum_lainlain: 0 });
      }
      uniqueGroups.get(key).akum_lainlain += (Number(item.akum_lainlain) || 0);
    });

    const activeLainLain = Array.from(uniqueGroups.values());
    const totalKirimHariIni = sumByGedung(list, "total_kirim");

    const createRow = (deptName, hasilVal, akumVal) => {
      return {
        dept: deptName,
        hasil: hasilVal,
        akum: akumVal,
        terima: totalAkumTerima || totalTerimaGedung,
        turunLO: deptName === "Linking" ? totalTurunLO : 0,
        turunCBS: deptName === "Linking" ? totalTurunCBS : 0,
        turunSoom: deptName === "Sontex" ? totalTurunSoom : 0,
        akumTurunLO: deptName === "Linking" ? totalAkumLO : 0,
        akumTurunCBS: deptName === "Linking" ? totalAkumCBS : 0,
        akumTurunSoom: deptName === "Sontex" ? totalAkumSoom : 0,
        isHeaderKirim: false,
        totalRowsKirim: 1
      };
    };

    const baseRows = [
      createRow("Terima",   sumByGedung(list, "total_terima"), totalAkumTerima),
      createRow("Linking",  sumByGedung(list, "total_linkingP"), totalAkumLinking),
      createRow("LO",       sumByGedung(list, "total_lo"), totalAkumLO),
      createRow("Steam",    sumByGedung(list, "total_steam"), totalAkumSteam),
      createRow("CBS",      sumByGedung(list, "total_cbs") + sumByGedung(list, "total_cbshgs"), totalAkumCBS),
      createRow("Sewing",   sumByGedung(list, "total_sewing"), totalAkumSewing),
      createRow("Sontex",   sumByGedung(list, "total_stik") + sumByGedung(list, "total_stkb") + sumByGedung(list, "total_sontexsoom"), totalAkumSontex),
      createRow("Soom",     sumByGedung(list, "total_soom"), totalAkumSoom),
      createRow("Qc Lampu", sumByGedung(list, "total_qclampu"), totalAkumQC),
      createRow("Sulam",    sumByGedung(list, "total_sulam"), totalAkumSulam)
    ];

    const kirimRows = [];
    const totalDetailActive = activeLainLain.length;

    // PERUBAHAN: Jika data lain-lain dari API kosong, berikan nilai 0 mutlak pada kolom keterangan (Bukan menyalin data Kirim)
    if (totalDetailActive === 0) {
      kirimRows.push({
        idUnik: `${gedung}_kirim_default`,
        dept: "Kirim",
        hasil: totalKirimHariIni,
        akum: totalAkumKirim,
        terima: totalAkumTerima || totalTerimaGedung,
        isHeaderKirim: true,
        totalRowsKirim: 1,
        xWorkName: "-",
        totalLainLain: 0, // Dibuat 0 mutlak
        akumLainLain: 0   // Dibuat 0 mutlak
      });
    } else {
      activeLainLain.forEach((item, index) => {
        const isFirst = index === 0;
        kirimRows.push({
          idUnik: `${gedung}_kirim_${item.deptdari}_${index}`,
          dept: "Kirim",
          hasil: totalKirimHariIni,
          akum: totalAkumKirim,
          terima: totalAkumTerima || totalTerimaGedung,
          isHeaderKirim: isFirst, 
          totalRowsKirim: totalDetailActive,
          xWorkName: `${item.deptdari}`,
          totalLainLain: item.total_lainlain,
          akumLainLain: item.akum_lainlain
        });
      });
    }

    summary[gedung] = [...baseRows, ...kirimRows];
  });
  return summary;
});

const filteredGroupedSummaryData = computed(() => {
  const filtered = {};
  availableGedungList.value.forEach(gedungName => {
    if (selectedGedung.value.includes(gedungName) && groupedSummaryData.value[gedungName]) {
      filtered[gedungName] = groupedSummaryData.value[gedungName];
    }
  });
  return filtered;
});

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Summary Finishing');
  
  worksheet.columns = [
    { width: 18 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 25 }, { width: 14 }, { width: 14 }, { width: 14 }
  ];
  
  const thinBorder = { 
    top: { style: 'thin', color: { argb: 'FF555555' } }, left: { style: 'thin', color: { argb: 'FF555555' } },
    bottom: { style: 'thin', color: { argb: 'FF555555' } }, right: { style: 'thin', color: { argb: 'FF555555' } } 
  };
  
  let currentRow = 2;

  for (const [namaGedung, dataGedung] of Object.entries(filteredGroupedSummaryData.value)) {
    
    const rowHeader1 = worksheet.getRow(currentRow);
    rowHeader1.getCell(1).value = "Tanggal"; 
    rowHeader1.getCell(2).value = "Terima";
    rowHeader1.getCell(3).value = namaGedung.toUpperCase();
    worksheet.mergeCells(currentRow, 3, currentRow, 9); 
    
    rowHeader1.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true, name: 'Arial', size: 11 }; 
      cell.alignment = { horizontal: 'center', vertical: 'middle' }; 
      cell.border = thinBorder;
    });
    worksheet.getCell(currentRow, 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    
    currentRow++; 

    const rowHeader2 = worksheet.getRow(currentRow);
    rowHeader2.getCell(3).value = "Dept"; 
    rowHeader2.getCell(4).value = "Hasil";
    rowHeader2.getCell(5).value = "Akum"; 
    rowHeader2.getCell(6).value = "Keterangan"; 
    worksheet.mergeCells(currentRow, 6, currentRow, 8); 
    rowHeader2.getCell(9).value = "Sisa";
    
    rowHeader2.eachCell({ includeEmpty: true }, (cell) => { 
      cell.font = { bold: true, name: 'Arial', size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' }; 
      cell.border = thinBorder;
    });

    worksheet.mergeCells(currentRow - 1, 1, currentRow, 1); 
    worksheet.mergeCells(currentRow - 1, 2, currentRow, 2); 
    
    currentRow++;
    const startDataRow = currentRow;
    
    dataGedung.forEach((item, index) => {
      const startDeptRow = currentRow;

      if (item.dept === 'Linking') {
        const r1 = currentRow; const r2 = currentRow + 1;
        if (index === 0) {
          worksheet.getRow(r1).getCell(1).value = formatDate(filterDate.value);
          worksheet.getRow(r1).getCell(2).value = item.terima;
        }
        worksheet.getRow(r1).getCell(3).value = item.dept;
        worksheet.getRow(r1).getCell(4).value = item.hasil;
        worksheet.getRow(r1).getCell(5).value = item.akum;
        worksheet.getRow(r1).getCell(6).value = "untuk LO";
        worksheet.getRow(r1).getCell(7).value = item.turunLO;
        worksheet.getRow(r1).getCell(8).value = item.akumTurunLO;
        worksheet.getRow(r2).getCell(6).value = "untuk CBS";
        worksheet.getRow(r2).getCell(7).value = item.turunCBS;
        worksheet.getRow(r2).getCell(8).value = item.akumTurunCBS;

        worksheet.mergeCells(r1, 3, r2, 3); worksheet.mergeCells(r1, 4, r2, 4); 
        worksheet.mergeCells(r1, 5, r2, 5); worksheet.mergeCells(r1, 9, r2, 9);
        currentRow += 2;
      } 
      else if (item.dept === 'Sontex') {
        const r1 = currentRow; const r2 = currentRow + 1;
        worksheet.getRow(r1).getCell(3).value = item.dept;
        worksheet.getRow(r1).getCell(4).value = item.hasil;
        worksheet.getRow(r1).getCell(5).value = item.akum;
        worksheet.getRow(r1).getCell(6).value = "untuk Soom";
        worksheet.getRow(r1).getCell(7).value = item.turunSoom;
        worksheet.getRow(r1).getCell(8).value = item.akumTurunSoom;

        worksheet.mergeCells(r1, 3, r2, 3); worksheet.mergeCells(r1, 4, r2, 4); 
        worksheet.mergeCells(r1, 5, r2, 5); worksheet.mergeCells(r1, 9, r2, 9);
        currentRow += 2;
      } 
      else if (item.dept === 'Kirim') {
        const r1 = currentRow;
        if (item.isHeaderKirim) {
          const blockEndRow = r1 + item.totalRowsKirim - 1;
          worksheet.getRow(r1).getCell(3).value = item.dept;
          worksheet.getRow(r1).getCell(4).value = item.hasil;
          worksheet.getRow(r1).getCell(5).value = item.akum;
          
          worksheet.mergeCells(r1, 3, blockEndRow, 3);
          worksheet.mergeCells(r1, 4, blockEndRow, 4);
          worksheet.mergeCells(r1, 5, blockEndRow, 5);
          worksheet.mergeCells(r1, 9, blockEndRow, 9);
        }
        worksheet.getRow(r1).getCell(6).value = item.xWorkName === '-' ? '-' : "Lain-lain " + item.xWorkName;
        worksheet.getRow(r1).getCell(7).value = item.totalLainLain;
        worksheet.getRow(r1).getCell(8).value = item.akumLainLain;
        currentRow += 1;
      } 
      else if (item.dept !== 'Terima') { 
        const r1 = currentRow;
        worksheet.getRow(r1).getCell(3).value = item.dept;
        worksheet.getRow(r1).getCell(4).value = item.hasil;
        worksheet.getRow(r1).getCell(5).value = item.akum;
        
        worksheet.getRow(r1).getCell(6).value = ""; 
        worksheet.getRow(r1).getCell(7).value = ""; 
        worksheet.getRow(r1).getCell(8).value = ""; 
        
        currentRow += 1;
      }

      for (let rIdx = startDeptRow; rIdx < currentRow; rIdx++) {
        const row = worksheet.getRow(rIdx);
        for (let colNum = 1; colNum <= 9; colNum++) {
          const cell = row.getCell(colNum);
          cell.border = thinBorder;
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { horizontal: colNum === 6 ? 'left' : 'center', vertical: 'middle' };
          
          if (colNum === 4 && rIdx === startDeptRow) cell.font = { bold: true };
        }
      }
    });

    worksheet.mergeCells(startDataRow, 1, currentRow - 1, 1);
    worksheet.mergeCells(startDataRow, 2, currentRow - 1, 2);
    currentRow += 2;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Summary_Finishing_${filterDate.value}.xlsx`;
  link.click();
};

onMounted(() => {
  fetchSummaryData();
});
</script>
<style scoped>
.bg-soft-gray { background-color: #f4f6f9; }
.bg-light-gray { background-color: #f8f9fa !important; }
.loading-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.75);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 10;
}
.main-content { transition: all 0.3s ease; }
@media (min-width: 992px) {
  .sidebar-is-open { margin-left: 260px; width: calc(100% - 260px); }
  .sidebar-is-closed { margin-left: 0; width: 100%; }
}
.custom-summary-table { border: 1.5px solid #666 !important; }
.custom-summary-table th, .custom-summary-table td { border: 1px solid #666 !important; font-size: 13px; padding: 6px 8px; }
.custom-summary-table thead th { font-weight: bold; background-color: #ffffff; }
.date-column { vertical-align: middle; background-color: #fff !important; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

/* UTILITY STYLE TAMBAHAN FILTER DROP DOWN MULTISELECT */
.c-pointer { cursor: pointer; }
.py-0\.5 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.custom-multiselect .dropdown-toggle::after {
  margin-left: auto;
}
.custom-multiselect .dropdown-menu {
  z-index: 1050;
}
</style>