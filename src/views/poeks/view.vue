<template>
  <div class="d-flex flex-column min-vh-100 bg-light mt-3">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-5 transition-all" :style="{ marginLeft: sidebarOpen ? '16rem' : '0' }">
        <div class="po-table-container">
          
          <!-- Bagian Filter Kontrol -->
          <div class="filter-wrapper mb-4">
            <div class="filter-row">
              <div class="filter-group">
                <label for="filterDate">Pilih Tanggal Produksi:</label>
                <input 
                  type="date" 
                  id="filterDate" 
                  v-model="startDate" 
                  class="form-control"
                />
              </div>

              <div class="filter-actions">
                <button @click="fetchData" class="btn btn-primary">Cari Data</button>
                <button @click="resetFilter" class="btn btn-secondary">Refresh</button>
                
                <!-- Tombol Export Excel -->
                <button 
                  @click="exportToExcel" 
                  :disabled="groupedPoList.length === 0" 
                  class="btn btn-success"
                >
                <i class="bi bi-file-earmark-spreadsheet"></i> Export Excel
                </button>
              </div>
              <div class="d-flex justify-content-end w-100">
                <a href="/update_poeks" class="btn btn-primary me-2">
                    <i class="bi bi-patch-plus"></i> CREATE DATA
                </a>
                <a href="/edit_poeks" class="btn btn-warning">
                    <i class="bi bi-patch-plus"></i> UPDATE DATA
                </a>
              </div>
            </div>

            <!-- Bagian Filter Checkbox Tambahan -->
            <div v-if="poList.length > 0" class="dropdown-filter-row" ref="filterRowRef">
              <div v-for="fd in filterDefs" :key="fd.key" class="msd-wrapper">
                <button
                  type="button"
                  class="msd-trigger"
                  :class="{ 'msd-trigger-active': fd.model.length > 0 }"
                  @click="openDropdown = openDropdown === fd.key ? null : fd.key"
                >
                  <i class="bi" :class="fd.icon"></i>
                  <span class="msd-trigger-label">{{ fd.label }}</span>
                  <span v-if="fd.model.length" class="msd-badge">{{ fd.model.length }}</span>
                  <i class="bi bi-chevron-down msd-chevron" :class="{ 'msd-chevron-open': openDropdown === fd.key }"></i>
                </button>

                <div v-if="openDropdown === fd.key" class="msd-panel">
                  <div v-if="fd.options.length > 6" class="msd-search-box">
                    <i class="bi bi-search"></i>
                    <input type="text" v-model="dropdownSearch[fd.key]" placeholder="Cari..." class="msd-search-input" />
                  </div>

                  <div class="msd-options-list">
                    <label v-for="opt in getFilteredOptions(fd)" :key="opt.value" class="msd-option-item">
                      <input type="checkbox" :checked="fd.model.includes(opt.value)" @change="toggleFilterOption(fd, opt.value)" />
                      <span>{{ opt.label }}</span>
                    </label>
                    <div v-if="getFilteredOptions(fd).length === 0" class="msd-empty">Tidak ada hasil</div>
                  </div>

                  <div class="msd-panel-footer">
                    <button type="button" class="msd-footer-btn" @click="fd.clear()" :disabled="fd.model.length === 0">Reset</button>
                    <button type="button" class="msd-footer-btn msd-footer-btn-primary" @click="openDropdown = null">Terapkan</button>
                  </div>
                </div>
              </div>

              <button
                v-if="selectedGedung.length || selectedXMark.length || selectedXFtyDate.length || selectedXMColor.length"
                @click="resetCheckboxFilter"
                type="button"
                class="chip-clear-btn"
              >
                <i class="bi bi-x-circle"></i> Clear Semua
              </button>
            </div>
          </div>

          <!-- State Loading -->
          <div v-if="loading" class="text-center p-5 font-semibold">Memuat data dari server...</div>

          <!-- Tampilkan pesan jika data kosong -->
          <div v-else-if="groupedPoList.length === 0" class="text-center p-5 error-msg">
            Tidak ada data PO ditemukan untuk tanggal yang dipilih.
          </div>

          <!-- Looping hasil GROUPING data PO yang sudah diurutkan berdasarkan xFtyDate -->
          <div v-else v-for="(group, index) in groupedPoList" :key="index" class="po-card mb-5">
            <table class="table-po">
              <thead>
                <tr>
                  <th class="font-bold text-center">GEDUNG {{ group.gedung }}</th>
                  <th :colspan="group.activeSizes.length + 2" class="text-center bg-dark-gray font-bold">
                    {{ group.infoText }}
                  </th>
                  <th class="font-bold text-center">{{ group.xBuyer || '' }}</th>
                </tr>
                
                <tr>
                  <th class="font-bold text-center">{{ group.xPO_idp || '' }}</th>
                  <th colspan="2"></th>
                  <!-- Nama size SEKARANG BOLD -->
                  <th v-for="sizeIdx in group.activeSizes" :key="'size-' + sizeIdx" class="font-bold text-center">
                    {{ group.sizesMap[sizeIdx] }}
                  </th>
                  <!-- Tulisan Jumlah SEKARANG BOLD -->
                  <th class="font-bold text-center">Jumlah</th>
                </tr>
              </thead>
              
              <tbody v-for="(po, poIdx) in group.items" :key="poIdx" :class="{'border-top-group': poIdx > 0}">
                <tr>
                  <td rowspan="5" class="valign-middle bg-light-gray">{{ po.xRegions || '' }}</td>
                  <td colspan="2" class="font-semibold">supply</td>
                  <td v-for="sizeIdx in group.activeSizes" :key="'xto-' + sizeIdx" class="text-right">
                    {{ po['xTO' + sizeIdx] !== null ? po['xTO' + sizeIdx] : 0 }}
                  </td>
                  <td class="text-right bg-light-gray">{{ po.xTOT || 0 }}</td>
                </tr>

                <tr>
                  <td colspan="2" class="font-semibold">kirim</td>
                  <td v-for="sizeIdx in group.activeSizes" :key="'xtod-' + sizeIdx" class="text-right">
                    {{ po['xTOD' + sizeIdx] !== null ? po['xTOD' + sizeIdx] : 0 }}
                  </td>
                  <td class="text-right bg-light-gray">{{ po.xTOTD || 0 }}</td>
                </tr>

                <tr>
                  <td colspan="2" class="font-semibold">{{ po.a1workname || 'A1' }}</td>
                  <td v-for="sizeIdx in group.activeSizes" :key="'a1to-' + sizeIdx" class="text-right text-muted italic">
                    {{ po['A1TO' + sizeIdx] !== null ? po['A1TO' + sizeIdx] : 0 }}
                  </td>
                  <td class="text-right bg-light-gray">{{ po.A1TOT || 0 }}</td>
                </tr>

                <tr>
                  <td colspan="2" class="font-semibold">{{ po.s1workname || 'SHORT' }}</td>
                  <td v-for="sizeIdx in group.activeSizes" :key="'s1to-' + sizeIdx" class="text-right text-muted italic">
                    {{ po['S1TO' + sizeIdx] !== null ? po['S1TO' + sizeIdx] : 0 }}
                  </td>
                  <td class="text-right bg-light-gray">{{ po.S1TOT || 0 }}</td>
                </tr>

                <tr>
                  <td colspan="2" class="font-semibold">kebutuhan</td>
                  <td v-for="sizeIdx in group.activeSizes" :key="'xttqty-' + sizeIdx" class="text-right">
                    {{ po['xTTQty' + sizeIdx] !== null ? po['xTTQty' + sizeIdx] : 0 }}
                  </td>
                  <td class="text-right bg-light-gray">{{ po.cTTQty || 0 }}</td>
                </tr>

                <!-- Warna Supply Row -->
                <tr>
                  <td rowspan="2" class="valign-middle bg-light-gray position-relative group-color-cell">
                    <!-- Teks Warna TIDAK BOLD -->
                    <div class="d-flex flex-column align-items-center justify-content-center gap-1">
                      <span>{{ po.xMColor || '-' }}</span>
                      <button 
                        @click="deleteSingleRow(po)" 
                        class="btn-delete-row" 
                        title="Hapus baris kombinasi ini"
                      >
                        ✕ Hapus
                      </button>
                    </div>
                  </td>
                  <td colspan="2" class="font-semibold">supply</td>
                  <td v-for="sizeIdx in group.activeSizes" :key="'calc-supply-' + sizeIdx" class="text-center">
                    {{ getSupplyStatus(po, sizeIdx) }}
                  </td>
                  <td class="text-center">
                    {{ sumSupplyCalc(po, group.activeSizes) }}
                  </td>
                </tr>

                <!-- Warna Kirim Row -->
                <tr>
                  <td colspan="2" class="font-semibold">kirim</td>
                  <td v-for="sizeIdx in group.activeSizes" :key="'calc-kirim-' + sizeIdx" class="text-center">
                    {{ getKirimStatus(po, sizeIdx) }}
                  </td>
                  <td class="text-center">
                    {{ sumKirimCalc(po, group.activeSizes) }}
                  </td>
                </tr>
              </tbody>

              <tfoot>
                <tr>
                  <td :colspan="group.activeSizes.length + 3" class="text-center bg-white text-dark-gray">
                    Total Kekurangan Supply
                  </td>
                  <td class="text-center bg-white text-dark-gray">
                    {{ getGrandTotalSupply(group) }}
                  </td>
                </tr>
                <tr>
                  <td :colspan="group.activeSizes.length + 3" class="text-center bg-white text-dark-gray">
                    Total Kekurangan Kirim
                  </td>
                  <td class="text-center bg-white text-dark-gray">
                    {{ getGrandTotalKirim(group) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>
    </div>
    <Footer/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import * as XLSX from 'xlsx-js-style';

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sidebarOpen = ref(true);
const user = ref({ name: "User" });
const poList = ref([]);
const loading = ref(false);
const startDate = ref('');

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('id-ID');
};

const getSingleActiveSizes = (po) => {
  const activeIndexes = [];
  for (let i = 1; i <= 15; i++) {
    const val = po[`xSize${i}`];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      activeIndexes.push(i);
    }
  }
  return activeIndexes;
};

// 1. STATE UNTUK SEMUA FILTER TERMASUK WARNA
const selectedGedung = ref([]);
const selectedXMark = ref([]);
const selectedXFtyDate = ref([]);
const selectedXMColor = ref([]);

// 2. COMPUTED UNTUK DAFTAR OPSI (Saling menyesuaikan/cascading)
const uniqueGedungList = computed(() => {
  const set = new Set();
  poList.value.forEach(po => {
    const poActiveSizes = getSingleActiveSizes(po);
    const supplyStatus = sumSupplyCalc(po, poActiveSizes);
    const kirimStatus = sumKirimCalc(po, poActiveSizes);
    if (supplyStatus === 'OK' && kirimStatus === 'OK') return;

    const matchXMark = selectedXMark.value.length === 0 || selectedXMark.value.includes(po.xMark);
    const matchXFtyDate = selectedXFtyDate.value.length === 0 || selectedXFtyDate.value.includes(po.xFtyDate);
    const matchXMColor = selectedXMColor.value.length === 0 || selectedXMColor.value.includes(po.xMColor);

    if (matchXMark && matchXFtyDate && matchXMColor && po.gedung !== null && po.gedung !== undefined && String(po.gedung).trim() !== '') {
      set.add(po.gedung);
    }
  });
  return Array.from(set).sort();
});

const uniqueXMarkList = computed(() => {
  const set = new Set();
  poList.value.forEach(po => {
    const poActiveSizes = getSingleActiveSizes(po);
    const supplyStatus = sumSupplyCalc(po, poActiveSizes);
    const kirimStatus = sumKirimCalc(po, poActiveSizes);
    if (supplyStatus === 'OK' && kirimStatus === 'OK') return;

    const matchGedung = selectedGedung.value.length === 0 || selectedGedung.value.includes(po.gedung);
    const matchXFtyDate = selectedXFtyDate.value.length === 0 || selectedXFtyDate.value.includes(po.xFtyDate);
    const matchXMColor = selectedXMColor.value.length === 0 || selectedXMColor.value.includes(po.xMColor);

    if (matchGedung && matchXFtyDate && matchXMColor && po.xMark !== null && po.xMark !== undefined && String(po.xMark).trim() !== '') {
      set.add(po.xMark);
    }
  });
  return Array.from(set).sort();
});

const uniqueXFtyDateList = computed(() => {
  const set = new Set();
  poList.value.forEach(po => {
    const poActiveSizes = getSingleActiveSizes(po);
    const supplyStatus = sumSupplyCalc(po, poActiveSizes);
    const kirimStatus = sumKirimCalc(po, poActiveSizes);
    if (supplyStatus === 'OK' && kirimStatus === 'OK') return;

    const matchGedung = selectedGedung.value.length === 0 || selectedGedung.value.includes(po.gedung);
    const matchXMark = selectedXMark.value.length === 0 || selectedXMark.value.includes(po.xMark);
    const matchXMColor = selectedXMColor.value.length === 0 || selectedXMColor.value.includes(po.xMColor);

    if (matchGedung && matchXMark && matchXMColor && po.xFtyDate !== null && po.xFtyDate !== undefined && String(po.xFtyDate).trim() !== '') {
      set.add(po.xFtyDate);
    }
  });
  return Array.from(set).sort();
});

const uniqueXMColorList = computed(() => {
  const set = new Set();
  poList.value.forEach(po => {
    const poActiveSizes = getSingleActiveSizes(po);
    const supplyStatus = sumSupplyCalc(po, poActiveSizes);
    const kirimStatus = sumKirimCalc(po, poActiveSizes);
    if (supplyStatus === 'OK' && kirimStatus === 'OK') return;

    const matchGedung = selectedGedung.value.length === 0 || selectedGedung.value.includes(po.gedung);
    const matchXMark = selectedXMark.value.length === 0 || selectedXMark.value.includes(po.xMark);
    const matchXFtyDate = selectedXFtyDate.value.length === 0 || selectedXFtyDate.value.includes(po.xFtyDate);

    if (matchGedung && matchXMark && matchXFtyDate && po.xMColor !== null && po.xMColor !== undefined && String(po.xMColor).trim() !== '') {
      set.add(po.xMColor);
    }
  });
  return Array.from(set).sort();
});

const gedungOptions = computed(() => uniqueGedungList.value.map(g => ({ value: g, label: g })));
const xMarkOptions = computed(() => uniqueXMarkList.value.map(m => ({ value: m, label: m })));
const xFtyDateOptions = computed(() => uniqueXFtyDateList.value.map(d => ({ value: d, label: formatDate(d) })));
const xMColorOptions = computed(() => uniqueXMColorList.value.map(c => ({ value: c, label: c })));

const openDropdown = ref(null); 
const dropdownSearch = ref({ gedung: '', style: '', delivery: '', warna: '' });
const filterRowRef = ref(null);

// 3. MENAMBAHKAN WARNA KE DEFINISI FILTER
const filterDefs = computed(() => [
  { key: 'gedung', label: 'Gedung', icon: 'bi-building', options: gedungOptions.value, model: selectedGedung.value, clear: () => { selectedGedung.value = []; } },
  { key: 'style', label: 'Style', icon: 'bi-tag', options: xMarkOptions.value, model: selectedXMark.value, clear: () => { selectedXMark.value = []; } },
  { key: 'delivery', label: 'Delivery', icon: 'bi-calendar-event', options: xFtyDateOptions.value, model: selectedXFtyDate.value, clear: () => { selectedXFtyDate.value = []; } },
  { key: 'warna', label: 'Warna', icon: 'bi-palette', options: xMColorOptions.value, model: selectedXMColor.value, clear: () => { selectedXMColor.value = []; } }
]);

const getFilteredOptions = (fd) => {
  const q = (dropdownSearch.value[fd.key] || '').trim().toLowerCase();
  if (!q) return fd.options;
  return fd.options.filter(o => String(o.label).toLowerCase().includes(q));
};

const toggleFilterOption = (fd, value) => {
  const idx = fd.model.indexOf(value);
  if (idx === -1) { fd.model.push(value); } else { fd.model.splice(idx, 1); }
};

const handleFilterClickOutside = (e) => {
  if (filterRowRef.value && !filterRowRef.value.contains(e.target)) {
    openDropdown.value = null;
  }
};

onMounted(() => document.addEventListener('mousedown', handleFilterClickOutside));
onBeforeUnmount(() => document.removeEventListener('mousedown', handleFilterClickOutside));

const resetCheckboxFilter = () => {
  selectedGedung.value = [];
  selectedXMark.value = [];
  selectedXFtyDate.value = [];
  selectedXMColor.value = []; // Reset juga untuk warna
};

// 4. MEMASUKKAN FILTER WARNA KE VALID PO LIST
const validPoList = computed(() => {
  return poList.value.filter((po) => {
    const poActiveSizes = getSingleActiveSizes(po);
    const supplyStatus = sumSupplyCalc(po, poActiveSizes);
    const kirimStatus = sumKirimCalc(po, poActiveSizes);

    if (supplyStatus === 'OK' && kirimStatus === 'OK') return false; 

    const matchGedung = selectedGedung.value.length === 0 || selectedGedung.value.includes(po.gedung);
    const matchXMark = selectedXMark.value.length === 0 || selectedXMark.value.includes(po.xMark);
    const matchXFtyDate = selectedXFtyDate.value.length === 0 || selectedXFtyDate.value.includes(po.xFtyDate);
    const matchXMColor = selectedXMColor.value.length === 0 || selectedXMColor.value.includes(po.xMColor);
    
    return matchGedung && matchXMark && matchXFtyDate && matchXMColor;
  });
});

const groupedPoList = computed(() => {
  if (validPoList.value.length === 0) return [];
  const groupsMap = {};

  validPoList.value.forEach((po) => {
    const xMark = po.xMark || '-';
    const xTime = po.xTimes || po.xTime || po.xNO || '-';
    
    let infoText = `${xMark}, PO:${xTime}, qty:${po.xTOL || 0} (${formatDate(po.xFtyDate)})`;
    const xPO_idp = po.xPO_Idp || '';
    const groupKey = `${xMark}_${infoText}`;

    if (!groupsMap[groupKey]) {
      groupsMap[groupKey] = {
        gedung: po.gedung || '-',
        xMark: xMark,
        xPO_idp: xPO_idp,
        infoText: infoText,
        xBuyer: po.xBuyer || '-',
        items: [],
        allSizeIndexesSet: new Set(),
        sizesMap: {}
      };
    }

    groupsMap[groupKey].items.push(po);
    const poActiveSizes = getSingleActiveSizes(po);
    poActiveSizes.forEach(idx => {
      groupsMap[groupKey].allSizeIndexesSet.add(idx);
      groupsMap[groupKey].sizesMap[idx] = po[`xSize${idx}`];
    });
  });

  return Object.values(groupsMap)
    .filter(group => group.items.length > 0)
    .map(group => {
      const sortedSizes = Array.from(group.allSizeIndexesSet).sort((a, b) => a - b);
      group.items.sort((a, b) => String(a.xMColor || '').localeCompare(String(b.xMColor || '')));
      return { ...group, activeSizes: sortedSizes };
    })
    .sort((a, b) => {
      const dateA = a.items[0]?.xFtyDate || '';
      const dateB = b.items[0]?.xFtyDate || '';
      const dA = new Date(dateA).getTime();
      const dB = new Date(dateB).getTime();
      
      if (!isNaN(dA) && !isNaN(dB) && dA !== dB) {
        return dA - dB;
      }

      const gedungA = String(a.gedung || '');
      const gedungB = String(b.gedung || '');
      if (gedungA !== gedungB) return gedungA.localeCompare(gedungB);

      return String(a.xMark || '').localeCompare(String(b.xMark || ''));
    });
});

const getSupplyStatus = (po, idx) => {
  const xto = Number(po[`xTO${idx}`]) || 0;
  const a1to = Number(po[`A1TO${idx}`]) || 0;
  const s1to = Number(po[`S1TO${idx}`]) || 0;
  const xttqty = Number(po[`xTTQty${idx}`]) || 0;
  
  const totalSupply = xto + a1to + s1to;
  return totalSupply >= xttqty ? 'OK' : totalSupply - xttqty;
};

const getKirimStatus = (po, idx) => {
  const xtod = Number(po[`xTOD${idx}`]) || 0;
  const a1to = Number(po[`A1TO${idx}`]) || 0;
  const s1to = Number(po[`S1TO${idx}`]) || 0;
  const xttqty = Number(po[`xTTQty${idx}`]) || 0;

  const totalKirim = xtod + a1to + s1to;
  return totalKirim >= xttqty ? 'OK' : totalKirim - xttqty;
};

const sumSupplyCalc = (po, activeSizes) => {
  let totalMinus = 0;
  let allOk = true;
  activeSizes.forEach((idx) => {
    const xto = Number(po[`xTO${idx}`]) || 0;
    const a1to = Number(po[`A1TO${idx}`]) || 0;
    const s1to = Number(po[`S1TO${idx}`]) || 0;
    const xttqty = Number(po[`xTTQty${idx}`]) || 0;
    
    const diff = (xto + a1to + s1to) - xttqty;
    if (diff < 0) { totalMinus += diff; allOk = false; }
  });
  return allOk ? 'OK' : totalMinus;
};

const sumKirimCalc = (po, activeSizes) => {
  let totalMinus = 0;
  let allOk = true;
  activeSizes.forEach((idx) => {
    const xtod = Number(po[`xTOD${idx}`]) || 0;
    const a1to = Number(po[`A1TO${idx}`]) || 0; 
    const s1to = Number(po[`S1TO${idx}`]) || 0; 
    const xttqty = Number(po[`xTTQty${idx}`]) || 0;
    
    const diff = (xtod + a1to + s1to) - xttqty;
    if (diff < 0) { totalMinus += diff; allOk = false; }
  });
  return allOk ? 'OK' : totalMinus;
};

const getGrandTotalSupply = (group) => {
  let total = 0;
  group.items.forEach(po => {
    const val = sumSupplyCalc(po, group.activeSizes);
    if (val !== 'OK') total += val;
  });
  return total === 0 ? 'OK' : total;
};

const getGrandTotalKirim = (group) => {
  let total = 0;
  group.items.forEach(po => {
    const val = sumKirimCalc(po, group.activeSizes);
    if (val !== 'OK') total += val;
  });
  return total === 0 ? 'OK' : total;
};

const getSelisihKekuranganSupplyKirim = (group) => {
  const supplyVal = getGrandTotalSupply(group);
  const kirimVal = getGrandTotalKirim(group);
  const supplyNum = supplyVal === 'OK' ? 0 : supplyVal;
  const kirimNum = kirimVal === 'OK' ? 0 : kirimVal;
  return kirimNum - supplyNum;
};

const fetchData = async () => {
  if (!startDate.value) { alert("Silahkan pilih tanggal terlebih dahulu!"); return; }
  loading.value = true; poList.value = []; 
  try {
    const response = await axios.get(`${API_BASE_URL}/poeks/kombineddata`, { params: { startDate: startDate.value } });
    if (response.data && response.data.success) { poList.value = response.data.data; }
  } catch (error) {
    console.error("Gagal memuat SP Data Ekspedisi:", error);
    alert(error.response?.data?.message || "Terjadi kesalahan sistem.");
  } finally { loading.value = false; }
};

const deleteSingleRow = async (po) => {
  if (!startDate.value) {
    alert("Tanggal filter produksi tidak ditemukan.");
    return;
  }

  const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus data kombinasi warna "${po.xMColor || '-'}" untuk PO No: ${po.xNO}?`);
  if (!konfirmasi) return;

  try {
    const payload = {
      ...po,
      xDateTime: po.xDateTime || startDate.value
    };

    const response = await axios.delete(`${API_BASE_URL}/poeks/upsertpo/row`, {
      data: payload 
    });

    if (response.data && response.data.success) {
      alert(response.data.message || "Baris data berhasil dihapus!");
      const index = poList.value.findIndex(item => item === po);
      if (index !== -1) {
        poList.value.splice(index, 1);
      }
    } else {
      alert(response.data.message || "Gagal menghapus data.");
    }
  } catch (error) {
    console.error("Error deleting row:", error);
    alert(error.response?.data?.message || "Terjadi kesalahan sistem saat menghapus.");
  }
};

const resetFilter = () => { startDate.value = ''; poList.value = []; resetCheckboxFilter(); };

// ================= LOGIKA EXPORT EXCEL =================
const exportToExcel = () => {
  if (groupedPoList.value.length === 0) return;

  const ws = {};
  const merges = [];
  let currentRow = 0;

  const styles = {
    fontFamily: 'Segoe UI',
    borderStyle: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    },
    bgGray: { fill: { fgColor: { rgb: 'EAEDF1' } } },
    bgDarkGray: { fill: { fgColor: { rgb: 'D3D3D3' } } },
    bgLightGray: { fill: { fgColor: { rgb: 'F8F9FA' } } },
    bgBlue: { fill: { fgColor: { rgb: 'D9E1F2' } } },
    bgYellow: { fill: { fgColor: { rgb: 'FFF2CC' } } }
  };

  let globalMaxSizeCount = 0;
  groupedPoList.value.forEach((g) => {
    if (g.activeSizes.length > globalMaxSizeCount) {
      globalMaxSizeCount = g.activeSizes.length;
    }
  });

  groupedPoList.value.forEach((group) => {
    const totalCols = globalMaxSizeCount + 4;

    const emptySlots = globalMaxSizeCount - group.activeSizes.length;
    const padLeft = Math.floor(emptySlots / 2);
    const padRight = emptySlots - padLeft;

    const setCell = (r, c, v, customStyle = {}) => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cellStyle = {
        font: { name: styles.fontFamily, size: 10, color: { rgb: '000000' }, ...customStyle.font },
        alignment: { vertical: 'center', horizontal: 'left', wrapText: true, ...customStyle.alignment },
        ...customStyle.fill
      };
      
      if (!customStyle.noBorder) {
        cellStyle.border = styles.borderStyle;
      }
      ws[cellRef] = {
        v: v,
        t: typeof v === 'number' ? 'n' : 's',
        s: cellStyle
      };
    };

    setCell(currentRow, 0, `GEDUNG ${group.gedung}`, { font: { bold: true }, alignment: { horizontal: 'center' } });
    
    setCell(currentRow, 1, group.infoText, { fill: styles.bgDarkGray, font: { bold: true, color: { rgb: '000000' } }, alignment: { horizontal: 'center' } });
    for (let i = 2; i < totalCols - 1; i++) { setCell(currentRow, i, "", { fill: styles.bgDarkGray }); }
    merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: totalCols - 2 } });
    
    setCell(currentRow, totalCols - 1, group.xBuyer || '-', { font: { bold: true }, alignment: { horizontal: 'center' } });
    currentRow++;

    setCell(currentRow, 0, group.xPO_idp || '-', { font: { bold: true }, alignment: { horizontal: 'center' } });
    setCell(currentRow, 1, ""); setCell(currentRow, 2, "");
    merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 2 } });

    for (let i = 0; i < padLeft; i++) {
      setCell(currentRow, 3 + i, "");
    }
    group.activeSizes.forEach((sizeIdx, sIdx) => {
      setCell(currentRow, 3 + padLeft + sIdx, group.sizesMap[sizeIdx], { font: { bold: true }, alignment: { horizontal: 'center' } });
    });
    for (let i = 0; i < padRight; i++) {
      setCell(currentRow, 3 + padLeft + group.activeSizes.length + i, "");
    }

    setCell(currentRow, totalCols - 1, "Jumlah", { font: { bold: true }, alignment: { horizontal: 'center' } });
    currentRow++;

    group.items.forEach((po) => {
      setCell(currentRow, 0, ` ${po.xMColor || '-'}`, { fill: styles.bgLightGray, alignment: { horizontal: 'center', vertical: 'center' } });
      setCell(currentRow, 1, "supply"); setCell(currentRow, 2, ""); merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 2 } });
      
      for (let i = 0; i < padLeft; i++) setCell(currentRow, 3 + i, ""); 
      group.activeSizes.forEach((sizeIdx, sIdx) => {
        setCell(currentRow, 3 + padLeft + sIdx, getSupplyStatus(po, sizeIdx), { alignment: { horizontal: 'center' } });
      });
      for (let i = 0; i < padRight; i++) setCell(currentRow, 3 + padLeft + group.activeSizes.length + i, ""); 

      setCell(currentRow, totalCols - 1, sumSupplyCalc(po, group.activeSizes), { alignment: { horizontal: 'center' } });
      const rowSupplyCalc = currentRow; 
      currentRow++;

      setCell(currentRow, 0, ""); setCell(currentRow, 1, "kirim"); setCell(currentRow, 2, ""); merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 2 } });
      
      for (let i = 0; i < padLeft; i++) setCell(currentRow, 3 + i, ""); 
      group.activeSizes.forEach((sizeIdx, sIdx) => {
        setCell(currentRow, 3 + padLeft + sIdx, getKirimStatus(po, sizeIdx), { alignment: { horizontal: 'center' } });
      });
      for (let i = 0; i < padRight; i++) setCell(currentRow, 3 + padLeft + group.activeSizes.length + i, ""); 

      setCell(currentRow, totalCols - 1, sumKirimCalc(po, group.activeSizes), { alignment: { horizontal: 'center' } });
      
      merges.push({ s: { r: rowSupplyCalc, c: 0 }, e: { r: currentRow, c: 0 } }); 

      currentRow++;
    });

    setCell(currentRow, 0, "Total Kekurangan Supply", { alignment: { horizontal: 'center' } });
    for (let i = 1; i < totalCols - 1; i++) { setCell(currentRow, i, ""); }
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: totalCols - 2 } });
    setCell(currentRow, totalCols - 1, getGrandTotalSupply(group), { alignment: { horizontal: 'center' } });
    setCell(currentRow, totalCols, "", { alignment: { horizontal: 'center' }, noBorder: true });
    currentRow++;

    setCell(currentRow, 0, "Total Kekurangan Kirim", { alignment: { horizontal: 'center' } });
    for (let i = 1; i < totalCols - 1; i++) { setCell(currentRow, i, ""); }
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: totalCols - 2 } });
    setCell(currentRow, totalCols - 1, getGrandTotalKirim(group), { alignment: { horizontal: 'center' } });
    
    setCell(currentRow, totalCols, getSelisihKekuranganSupplyKirim(group), { alignment: { horizontal: 'center' }, noBorder: true });
    currentRow++;

    currentRow += 1; 
  });

  const maxCol = globalMaxSizeCount + 5;
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: currentRow - 1, c: maxCol - 1 } });
  ws['!merges'] = merges;

  const colWidths = [{ wch: 14 }, { wch: 8 }, { wch: 8 }];
  for (let i = 3; i < maxCol; i++) colWidths.push({ wch: 7 });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PO Ekspedisi");
  XLSX.writeFile(wb, `PO_Ekspedisi_${startDate.value}.xlsx`);
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};
</script>

<style scoped>
.po-table-container { padding: 20px; overflow-x: auto;}
.filter-wrapper { background: #fdfdfd; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 25px; }
.filter-row { display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 5px; }
.filter-group label { font-size: 12px; font-weight: 600; color: #555; }
.form-control { padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
.filter-actions { display: flex; gap: 10px; }
.dropdown-filter-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; padding-top: 16px; border-top: 1px solid #eef0f3; }
.chip-clear-btn { display: flex; align-items: center; gap: 5px; background-color: transparent; border: 1px solid #dc3545; color: #dc3545; font-size: 12px; font-weight: 600; padding: 7px 14px; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; }
.chip-clear-btn:hover { background-color: #dc3545; color: #fff; }
.msd-wrapper { position: relative; display: inline-block; }
.msd-trigger { display: flex; align-items: center; gap: 7px; background-color: #f8f9fb; border: 1px solid #dde1e7; color: #4b5563; font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; }
.msd-trigger:hover { border-color: #0056b3; color: #0056b3; }
.msd-trigger-active { border-color: #0056b3; background-color: #eef4fb; color: #0056b3; }
.msd-trigger i.bi:first-child { font-size: 13px; }
.msd-trigger-label { white-space: nowrap; }
.msd-badge { background-color: #0056b3; color: #fff; font-size: 10px; font-weight: 700; border-radius: 999px; padding: 1px 7px; line-height: 1.5; }
.msd-chevron { font-size: 10px; transition: transform 0.15s ease; }
.msd-chevron-open { transform: rotate(180deg); }
.msd-panel { position: absolute; top: calc(100% + 6px); left: 0; z-index: 50; width: 240px; background-color: #fff; border: 1px solid #dde1e7; border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); overflow: hidden; }
.msd-search-box { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid #eef0f3; }
.msd-search-box i { color: #9ca3af; font-size: 12px; }
.msd-search-input { border: none; outline: none; font-size: 13px; width: 100%; color: #333; }
.msd-options-list { max-height: 220px; overflow-y: auto; padding: 6px; }
.msd-option-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; padding: 7px 8px; border-radius: 5px; cursor: pointer; }
.msd-option-item:hover { background-color: #f3f4f6; }
.msd-option-item input { cursor: pointer; }
.msd-empty { text-align: center; font-size: 12px; color: #9ca3af; padding: 12px 0; }
.msd-panel-footer { display: flex; justify-content: space-between; gap: 8px; padding: 8px 10px; border-top: 1px solid #eef0f3; background-color: #fafafa; }
.msd-footer-btn { flex: 1; border: 1px solid #dde1e7; background-color: #fff; color: #4b5563; font-size: 12px; font-weight: 600; padding: 6px 0; border-radius: 5px; cursor: pointer; }
.msd-footer-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.msd-footer-btn:not(:disabled):hover { border-color: #9ca3af; }
.msd-footer-btn-primary { background-color: #0056b3; border-color: #0056b3; color: #fff; }
.msd-footer-btn-primary:hover { background-color: #004085; }
.btn { padding: 7px 15px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary { background-color: #0056b3; color: white; }
.btn-primary:hover { background-color: #004085; }
.btn-secondary { background-color: #6c757d; color: white; }
.btn-secondary:hover { background-color: #5a6268; }
.btn-success { background-color: #28a745; color: white; }
.btn-success:hover { background-color: #218838; }
.btn-success:disabled { background-color: #c3e6cb; color: #6c757d; cursor: not-allowed; }
.po-card { background: #ffffff; border: 1px solid #b8bfca; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.table-po { width: 100%; border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; }
.table-po th, .table-po td { border: 1px solid #b8bfca; padding: 10px 8px; }
.border-top-group { border-top: 3px double #b8bfca; }
.bg-gray { background-color: #eaedf1; }
.bg-dark-gray { background-color: #d3d3d3; color: #000000; } 
.bg-light-gray { background-color: #f8f9fa; }
.bg-blue { background-color: #d9e1f2; }
.bg-yellow { background-color: #fff2cc; }
.font-bold { font-weight: bold; }
.font-semibold { font-weight: 600; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-dark-gray { color: #333333; }
.valign-middle { vertical-align: middle; text-align: center; }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 2.5rem; }
.error-msg { color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; }
.group-color-cell { min-width: 100px; }
.gap-1 { gap: 4px; }
.btn-delete-row { background-color: #dc3545; color: white; border: none; border-radius: 3px; padding: 2px 6px; font-size: 11px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
.btn-delete-row:hover { background-color: #c82333; }
.italic { font-style: italic; }
.text-muted { color: #6c757d; }
</style>