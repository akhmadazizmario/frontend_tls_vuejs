<template>
  <div class="d-flex flex-column vh-100 bg-soft-gray overflow-hidden">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden pt-5">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['flex-grow-1 p-3 transition-all main-content d-flex flex-column overflow-hidden', sidebarOpen ? 'ms-sidebar-open' : 'ms-sidebar-closed']">
        
        <div class="flex-shrink-0">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold text-dark m-0">
              <i class="bi bi-card-checklist me-2 text-primary"></i>Laporan Produksi Finishing
            </h5>
            <div class="d-flex gap-2">
              <div class="dropdown">
                <button class="btn btn-outline-dark shadow-sm dropdown-toggle btn-sm fw-bold" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  KOLOM VISIBLE
                </button>
                <div class="dropdown-menu p-3 shadow border-0" style="min-width: 220px; z-index: 1060;">
                  <div v-for="(val, key) in groupState" :key="key" class="form-check form-switch mb-1">
                    <input class="form-check-input" type="checkbox" v-model="groupState[key]" :id="'sw-'+key">
                    <label class="form-check-label small text-uppercase fw-bold" :for="'sw-'+key">
                      {{ key === 'tglDel' ? 'TGL DEL' : (key === 'soomSontex' ? 'HASIL SOOM' : key.replace(/([A-Z])/g, ' $1')) }}
                    </label>
                  </div>
                </div>
              </div>
              <!-- <button @click="handleAutoSync" :disabled="isSyncing" class="btn btn-primary btn-sm shadow-sm px-3 fw-bold" >
                <span v-if="isSyncing" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  <i v-else class="bi bi-arrow-repeat me-1"></i> 
                  {{ isSyncing ? 'SINKRONISASI...' : 'AUTO SINKRON GEDUNG' }}
              </button> -->
              <button @click="sendEmail" :disabled="isSendingEmail" class="btn btn-primary btn-sm shadow-sm px-3 fw-bold">
                <span v-if="isSendingEmail" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-envelope me-1"></i> EMAIL
              </button>

              <button @click="exportToExcel" class="btn btn-success btn-sm shadow-sm px-3 fw-bold">
                <i class="bi bi-file-earmark-excel me-1"></i> EXCEL
              </button>
              <button @click="exportToPDF" class="btn btn-danger btn-sm shadow-sm px-3 fw-bold">
                <i class="bi bi-file-earmark-pdf me-1"></i> PDF
              </button>
            </div>
          </div>

          <!-- Navigasi -->
          <div class="mb-4 d-flex gap-3">
             <a href="/view-finishing-pergedung" class="btn btn-primary active"><i class="bi bi-highlighter"></i> Input Gedung Finishing</a>
             <a href="/view-finishing-turun-pergedung" class="btn btn-warning active"><i class="bi bi-highlighter"></i> Input U/CBS&LO</a>
             <a href="/view-finishing-turun-soom-pergedung" class="btn btn-warning active"><i class="bi bi-highlighter"></i> Input U/SOOM</a>
             <div class="vr mx-2 bg-secondary opacity-50" style="height: 35px; min-width: 1.5px;"></div>
             <a href="/laporan-finishing-pergedung" class="btn btn-success active"><i class="bi bi-card-list"></i> Report ALL finishing</a>
             <a href="/summary-finishing-pergedung" class="btn btn-success active"><i class="bi bi-card-list"></i> Summary finishing</a>
             <a href="https://docs.google.com/document/d/1hPeypmbv7ooP1-V_ng7NBnh0M7XZTP0i/edit?usp=drive_link&ouid=104143269381300668268&rtpof=true&sd=true" class="btn btn-danger"><i class="bi bi-book-half"></i> RUMUS SISA</a>
          </div>

          <div class="card border-0 shadow-sm rounded-3 mb-3 p-3 bg-white">
            <div class="row g-2 align-items-end">
              <div class="col-md-3">
                <label class="fw-bold small mb-1 text-muted text-uppercase">Tanggal Produksi</label>
                <input type="date" v-model="filterDate" class="form-control form-control-sm border-2">
              </div> 
              <div class="col-md-2">
                <button class="btn btn-primary btn-sm w-100 py-2 fw-bold" @click="fetchData">CARI DATA</button>
              </div>
              <div class="col-md-7 text-end" v-if="hasActiveFilters">
                <span class="badge bg-warning text-dark me-2 p-2">Terfilter: {{ filteredData.length }} Baris</span>
                <button @click="resetFilters" class="btn btn-sm btn-danger fw-bold shadow-sm">HAPUS SEMUA FILTER</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-lg rounded-4 overflow-hidden flex-grow-1 bg-white">
          <div v-if="isLoading" class="loading-overlay">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <h6 class="mt-2 fw-bold text-primary">MENYIAPKAN DATA...</h6>
  </div>
          <div class="card-body p-0 d-flex flex-column h-100" :class="{ 'is-loading-content': isLoading }">
            <!-- Warning Data Gedung Kosong -->
<div v-if="invalidGedungData.length > 0" class="p-2 border-bottom bg-light">
  <button v-if="invalidGedungData.length > 0"
     class="btn btn-warning btn-sm position-relative"
     data-bs-toggle="collapse"
     data-bs-target="#missingGedungInfo"
  >
  <i class="bi bi-bell-fill"></i> notification gedung

  <span
    class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
  >
    {{ invalidGedungData.length }}
  </span>
</button>

  <div class="collapse mt-2" id="missingGedungInfo">
    <div class="card card-body border-warning bg-warning-subtle">

      <div class="fw-bold">
        Ada {{ invalidGedungData.length }} data Style yang gedungnya kosong
      </div>

      <div class="small mt-1">
        Mohon lakukan
        <span class="fw-bold text-danger">
          PENGECEKAN di Input gedung
        </span>
        atau input gedung di data pelengkap.
      </div>

      <div class="small mt-2">
        STYLE belum ada gedung:
      </div>

      <div class="fw-bold text-dark">
        {{
          invalidGedungData
            .map(i => i.xMark || '(xMark kosong)')
            .join(', ')
        }}
      </div>

    </div>
  </div>
</div>
    <div class="table-scroll-wrapper flex-grow-1 overflow-auto custom-scrollbar">
              <table id="table-produksi" class="table table-sm align-middle mb-0 custom-table">
                <thead class="text-center text-uppercase">
                  <tr class="bg-dark text-white header-1">
                    <th rowspan="2" class="sticky-col sticky-top-1 bg-dark text-white border-end">
                      STYLE <i class="bi bi-filter ms-1 cursor-pointer" @click="openFilterMenu($event, 'xMark')"></i>
                    </th>
                    <th v-if="groupState.gedung" rowspan="2" class="sticky-top-1 bg-dark text-white border-end">
                      GEDUNG <i class="bi bi-filter ms-1 cursor-pointer" @click="openFilterMenu($event, 'gedung')"></i>
                    </th>
                    <th v-if="groupState.tglDel" rowspan="2" class="sticky-top-1 bg-dark text-white border-end">
                      TGL DEL <i class="bi bi-filter ms-1 cursor-pointer" @click="openFilterMenu($event, 'xminDate')"></i>
                    </th>
                    <th v-if="groupState.poNo" rowspan="2" class="sticky-top-1 bg-dark text-white border-end">
                      PO <i class="bi bi-filter ms-1 cursor-pointer" @click="openFilterMenu($event, 'xTimes')"></i>
                    </th>
                    <th v-if="groupState.terima" colspan="2" class="sticky-top-1 bg-dark text-white border-end">Terima WHA2</th>
                    <th v-if="groupState.linking" colspan="5" class="sticky-top-1 bg-primary text-white border-end">LINKING</th>
                    <th v-if="groupState.pl" rowspan="2" class="sticky-top-1 bg-secondary text-white border-end">
                      PL <i class="bi bi-filter ms-1 cursor-pointer" @click="openFilterMenu($event, 'pl')"></i>
                    </th>
                    <th v-if="groupState.lo" colspan="4" class="sticky-top-1 bg-success text-white border-end">LO</th>
                    <th v-if="groupState.soomSontex" colspan="22" class="sticky-top-1 bg-warning text-dark border-end">HASIL SOOM SONTEX</th>
                    <th v-if="groupState.qc" colspan="5" class="sticky-top-1 bg-info text-dark border-end">QC LAMPU</th>
                    <th v-if="groupState.sulam" colspan="5" class="sticky-top-1 bg-success text-white border-end">SULAM</th>
                    <th v-if="groupState.kirim" colspan="3" class="sticky-top-1 bg-success text-white border-end">KIRIM</th>
                  </tr>
                  
                  <tr class="header-2">
                    <template v-if="groupState.terima">
                      <th class="sub-header-text">QTY</th><th class="sub-header-text border-end">AKUM</th>
                    </template>
                    <template v-if="groupState.linking">
                      <th class="sub-header-text">QTY</th><th class="sub-header-text border-end">AKUM</th><th class="sub-header-text border-end">L.PGRN</th>
                      <th class="sub-header-text border-end">T.PGRN</th>
                      <th class="sub-header-text border-end bg-success">SISA LK</th>
                    </template>
                    <template v-if="groupState.lo">
                      <th class="sub-header-text">QTY</th><th class="sub-header-text border-end">AKUM</th><th class="sub-header-text border-end">AKUM LO TO A1</th> 
                      <th class="sub-header-text border-end bg-success">SISA</th>
                    </template>
                    <template v-if="groupState.soomSontex">
                      <!-- STEAM -->
                      <th class="sub-header-text border-start bg-light-gray">STEAM</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-end bg-warning">SISA STEAM</th>

                      <!-- CBS -->
                      <th class="sub-header-text border-start bg-light-gray">CBS</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
 
                      <!-- CBS HGS -->
                      <th class="sub-header-text border-start bg-light-gray">CBS H/GSK</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-end bg-warning">UNTUK CBS</th>
                      <th class="sub-header-text border-end bg-warning">SISA CBS</th>
 
                      <!-- SEWING -->
                      <th class="sub-header-text border-start bg-light-gray">SEWING</th>
                      <th class="sub-header-text bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-end bg-warning">SISA SEWING</th>

                      <!-- STIK -->
                      <th class="sub-header-text border-start bg-light-gray">Sontek</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>

                      <!-- SONTEX -->
                     <th class="sub-header-text border-start bg-light-gray">Sontek Soom&Sontek</th>
                     <th class="sub-header-text border-end bg-light-gray">AKUM</th>

                     <!-- STKB -->
                     <th class="sub-header-text border-start bg-light-gray">Sontek Komplit</th>
                     <th class="sub-header-text border-end bg-light-gray">AKUM</th>

                     <!-- SISA SONTEX -->
                     <th class="sub-header-text border-end bg-warning">SISA SONTEX</th>

                     <!-- SOOM -->
                     <th class="sub-header-text border-start bg-light-gray">SOOM</th>
                     <th class="sub-header-text border-end bg-light-gray">AKUM</th>

                      <!-- SISA SOOM -->
                      <th class="sub-header-text border-end bg-warning">SISA SOOM</th>
                    </template>
                    <template v-if="groupState.qc">
                      <th class="sub-header-text">QC BS</th>
                      <th class="sub-header-text">AKUM</th>

                      <th class="sub-header-text">QC LB</th>
                      <th class="sub-header-text border-end">AKUM</th>
                      <th class="sub-header-text border-end bg-info">SISA</th>

                    </template>
                    <template v-if="groupState.sulam">
                      <th class="sub-header-text">QTY SULAM BC&BS</th>
                      <th class="sub-header-text border-end">AKUM SULAM BC&BS</th>
                      <th class="sub-header-text border-end">QTY SULAM LB</th>
                      <th class="sub-header-text border-end">AKUM SULAM LB</th>
                      <th class="sub-header-text border-end bg-success text-white">SISA SULAM</th>
                      
                    </template>
                    <template v-if="groupState.kirim">
                      <th class="sub-header-text">QTY</th>
                      <th class="sub-header-text border-end">AKUM</th>
                      <th class="sub-header-text border-end bg-success text-white">SISA</th>
                    </template>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(item, i) in filteredData" :key="i" class="row-hover">
                    <td class="sticky-col fw-bold bg-white border-end text-dark">{{ item.xMark }}</td>
                    <td v-if="groupState.gedung" class="text-center fw-bold text-muted border-end">{{ item.gedung }}</td>
                    <td v-if="groupState.tglDel" class="text-center small border-end">{{ formatDate(item.xminDate) }}</td>
                    <td v-if="groupState.poNo" class="text-center small border-end">{{ item.xTimes }}</td>

                    <template v-if="groupState.terima">
                      <td class="text-dark">{{ item.total_terima }}</td>
                      <td class="fw-bold bg-light-blue">{{ item.akum_terima }}</td>
                    </template>
                    
                    <template v-if="groupState.linking">
                      <td class="text-primary ">{{ item.total_linkingP }}</td>
                      <td class="fw-bold bg-light-blue">{{ item.akum_linkingP }}</td>
                      <td class="text-dark bg-light border-end">{{ item.total_linkingPP }}</td>
                      <td class="text-dark bg-light border-end">{{ item.total_linkingPTP }}</td>
                      <td class="fw-bold bg-light-green border-end">{{ item.sisa_linking }}</td>
                    </template>

                    <td v-if="groupState.pl" class="text-center bg-light border-end fw-bold text-dark">{{ item.pl }}</td>

                    <template v-if="groupState.lo">
                      <td class="text-success">{{ item.total_lo }}</td>
                      <td class="fw-bold bg-light-green">{{ item.akum_lo }}</td>
                       <td class="fw-bold ">{{ item.akum_lokea1 }}</td>
                      <td class="fw-bold bg-light-green">{{ item.sisa_lo }}</td>
                    </template>
                    <template v-if="groupState.soomSontex">
                      <td>{{ item.total_steam }}</td><td class="bg-light">{{ item.akum_steam }}</td><td class="bg-light">{{ item.sisa_steam }}</td>
                      <td>{{ item.total_cbs }}</td><td class="bg-light">{{ item.akum_cbs }}</td>
                      <td>{{ item.total_cbshgs }}</td><td class="bg-light">{{ item.akum_cbshgs }}</td>
                      <td class="fw-bold bg-light-warning border-end">{{ item.untuk_cbs }}</td>
                      <td class="fw-bold bg-light-warning border-end">{{ item.sisa_cbs }}</td>
                      <td>{{ item.total_sewing }}</td><td class="bg-light">{{ item.akum_sewing }}</td>
                      <td class="fw-bold bg-light-warning border-end">{{ item.sisa_sewing }}</td>
                      <td>{{ item.total_stik }}</td><td class="bg-light">{{ item.akum_stik }}</td>
                      <td>{{ item.total_sontexsoom }}</td><td class="bg-light">{{ item.akum_sontexsoom }}</td>
                      <td>{{ item.total_stkb }}</td><td class="bg-light border-end">{{ item.akum_stkb }}</td>
                      <td class="fw-bold bg-light-warning border-end"> {{ item.sisa_sontex }}</td>
                      <td>{{ item.total_soom }}</td><td class="bg-light">{{ item.akum_soom }}</td>
                      <td class="fw-bold bg-light-warning border-end"> {{ item.sisa_soom }}</td>
                    </template>
                    <template v-if="groupState.qc">
                      <td>{{ item.total_qclampubs }}</td>
                      <td class="bg-light-info">{{ item.akum_qclampubs }}</td>
                      <td>{{ item.total_qclampulb }}</td>
                      <td class="fw-bold bg-light-info border-end">{{ item.akum_qclampulb }}</td>
                      <td class="fw-bold bg-light-warning border-end">{{ item.sisa_lampu }}</td>
                    </template>
                    <template v-if="groupState.sulam">
                      <td>{{ item.total_sulam }}</td>
                      <td class="fw-bold bg-light-purple">{{ item.akum_sulam }}</td>
                      <td class="fw-bold bg-light-purple">{{ item.total_sulamlb }}</td>
                      <td class="fw-bold bg-light-purple">{{ item.akum_sulamlb }}</td>
                      <td class="fw-bold bg-light-warning border-end">{{ item.sisa_sulam }}</td>
                      
                      
                    </template>
                    <template v-if="groupState.kirim">
                      <td>{{ item.total_kirim }}</td>
                      <td class="fw-bold bg-light-purple">{{ item.akum_kirim }}</td>
                       <td class="fw-bold bg-light-purple">{{ item.sisa_kirim }}</td>
                    </template>
                  </tr>
                </tbody>
                <tfoot class="sticky-footer fw-bold bg-dark text-white">
                  <tr>
                    <td :colspan="1 + (groupState.gedung?1:0) + (groupState.tglDel ? 1 : 0) + (groupState.poNo?1:0)" class="sticky-col bg-dark border-end text-white ps-3">GRAND TOTAL</td>
                      <template v-if="groupState.terima">
                        <td>{{ grandTotal.total_terima }}</td>
                        <td>{{ grandTotal.akum_terima }}</td>
                      </template>
                      <template v-if="groupState.linking">
                        <td>{{ grandTotal.total_linkingP }}</td>
                        <td>{{ grandTotal.akum_linkingP }}</td>
                        <td>{{ grandTotal.total_linkingPP }}</td>
                        <td>{{ grandTotal.total_linkingPTP }}</td>
                        <td>{{ grandTotal.sisa_linking }}</td>
                      </template>
                      <td v-if="groupState.pl" class="bg-secondary">-</td>
    
    <template v-if="groupState.lo">
      <td>{{ grandTotal.total_lo }}</td>
      <td>{{ grandTotal.akum_lo }}</td>
      <td>{{ grandTotal.akum_lokea1 }}</td>
      <td>{{ grandTotal.sisa_lo }}</td>
    </template>
    
    <template v-if="groupState.soomSontex">
      <td>{{ grandTotal.total_steam }}</td>
      <td>{{ grandTotal.akum_steam }}</td>
      <td>{{ grandTotal.sisa_steam }}</td>
      <td>{{ grandTotal.total_cbs }}</td>
      <td>{{ grandTotal.akum_cbs }}</td>
      <td>{{ grandTotal.total_cbshgs }}</td>
      <td>{{ grandTotal.akum_cbshgs }}</td>
      <td>{{ grandTotal.untuk_cbs }}</td>
      <td>{{ grandTotal.sisa_cbs }}</td>
      <td>{{ grandTotal.total_sewing }}</td>
      <td>{{ grandTotal.akum_sewing }}</td>
      <td>{{ grandTotal.sisa_sewing }}</td>
      <td>{{ grandTotal.total_stik }}</td>
      <td>{{ grandTotal.akum_stik }}</td>
      <td>{{ grandTotal.total_sontexsoom }}</td>
      <td>{{ grandTotal.akum_sontexsoom }}</td>
      <td>{{ grandTotal.total_stkb }}</td>
      <td>{{ grandTotal.akum_stkb }}</td>
      <td>{{ grandTotal.sisa_sontex }}</td>
      <td>{{ grandTotal.total_soom }}</td>
      <td>{{ grandTotal.akum_soom }}</td>
      <td>{{ grandTotal.sisa_soom }}</td>
    </template>
    
    <template v-if="groupState.qc">
      <td>{{ grandTotal.total_qclampubs }}</td>
      <td>{{ grandTotal.akum_qclampubs }}</td>
      <td>{{ grandTotal.total_qclampulb }}</td>
      <td>{{ grandTotal.akum_qclampulb }}</td>
      <td>{{ grandTotal.sisa_lampu }}</td>
    </template>
    
    <template v-if="groupState.sulam">
      <td>{{ grandTotal.total_sulam }}</td>
      <td>{{ grandTotal.akum_sulam }}</td>
      <td>{{ grandTotal.total_sulamlb }}</td>
      <td>{{ grandTotal.akum_sulamlb }}</td>
      <td>{{ grandTotal.sisa_sulam }}</td>
      
    </template>
    
    <template v-if="groupState.kirim">
      <td>{{ grandTotal.total_kirim }}</td>
      <td>{{ grandTotal.akum_kirim }}</td>
      <td>{{ grandTotal.sisa_kirim }}</td>
    </template>
  </tr>
</tfoot>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div v-if="activeFilterKey" class="filter-dropdown-panel shadow-lg border rounded-3 bg-white p-3" :style="filterPos">
      <div class="d-flex justify-content-between align-items-center mb-2 px-1">
        <span class="small fw-bold text-primary text-uppercase">Filter {{ activeFilterKey.replace('total_','').replace('akum_','') }}</span>
        <button @click="activeFilterKey = null" class="btn-close btn-sm"></button>
      </div>
      <div class="filter-list border rounded p-2 mb-3 bg-light overflow-auto" style="max-height: 200px;">
        <div v-for="opt in uniqueOpts" :key="opt" class="form-check">
          <input class="form-check-input" type="checkbox" :value="opt" v-model="columnFilters[activeFilterKey]" :id="'opt-'+opt">
          <label class="form-check-label small" :for="'opt-'+opt">
            {{ activeFilterKey === 'xminDate' ? formatDate(opt) : (opt || '(Kosong)') }}
</label>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-primary btn-sm flex-grow-1 fw-bold" @click="activeFilterKey = null">OKE</button>
        <button class="btn btn-outline-danger btn-sm" @click="columnFilters[activeFilterKey] = []">RESET</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import XLSXStyle from "xlsx-js-style";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(true);
const rawData = ref([]);
const filterDate = ref(new Date().toISOString().substr(0, 10));

const isLoading = ref(false);
const isSyncing = ref(false);
const isSendingEmail = ref(false);

// Group state untuk visibilitas kolom
const groupState = ref({ 
  gedung: true, 
  tglDel: true, 
  poNo: true,
  terima: true,
  pl: true,
  linking: true, 
  lo: true, 
  soomSontex: true, 
  qc: true, 
  sulam: true,
  kirim: true 
});

const activeFilterKey = ref(null);
const filterPos = ref({ top: 0, left: 0 });
const columnFilters = ref({});

const openFilterMenu = (event, key) => {
  if (!columnFilters.value[key]) columnFilters.value[key] = [];
  activeFilterKey.value = key;
  filterPos.value = { top: (event.clientY + 15) + 'px', left: Math.min(event.clientX, window.innerWidth - 260) + 'px' };
};

const uniqueOpts = computed(() => {
  if (!activeFilterKey.value) return [];
  const options = rawData.value.map(d => d[activeFilterKey.value]);
  return [...new Set(options)].sort();
});

const filteredData = computed(() => {
  return rawData.value.filter(item => {
    return Object.keys(columnFilters.value).every(key => {
      if (!columnFilters.value[key] || columnFilters.value[key].length === 0) return true;
      return columnFilters.value[key].includes(item[key]);
    });
  });
});

// ==================== CODES UNTUK HITUNG GRAND TOTAL AMAN ====================
const grandTotal = computed(() => {
  const data = filteredData.value || [];
  
  const totals = {
    total_terima: 0, akum_terima: 0,
    total_linkingP: 0, akum_linkingP: 0,
    total_linkingPP: 0, total_linkingPTP: 0, sisa_linking: 0,
    total_lo: 0, akum_lo: 0, akum_lokea1: 0,
    total_steam: 0, akum_steam: 0, sisa_steam: 0,
    total_cbs: 0, akum_cbs: 0,
    total_cbshgs: 0, akum_cbshgs: 0,
    total_sewing: 0, akum_sewing: 0,
    total_stik: 0, akum_stik: 0,
    total_sontexsoom: 0, akum_sontexsoom: 0,
    total_stkb: 0, akum_stkb: 0,
    total_soom: 0, akum_soom: 0,
    total_qclampubs: 0, akum_qclampubs: 0,
    total_qclampulb: 0, akum_qclampulb: 0,
    total_sulam: 0, akum_sulam: 0, total_sulamlb: 0, akum_sulamlb: 0,
    total_kirim: 0, akum_kirim: 0, sisa_kirim: 0,
    untuk_cbs: 0,
    
    // Kolom-kolom SISA yang bermasalah sekarang murni dijumlahkan dari layar
    sisa_lo: 0,
    sisa_cbs: 0,
    sisa_sewing: 0,
    sisa_sontex: 0,
    sisa_soom: 0,
    sisa_lampu: 0,
    sisa_sulam: 0
  };

  if (data.length === 0) return totals;

  // Murni menjumlahkan apa yang ada di tiap baris (seperti kalkulator)
  data.forEach(item => {
    totals.total_terima      += Number(item.total_terima) || 0;
    totals.akum_terima       += Number(item.akum_terima) || 0;
    
    totals.total_linkingP     += Number(item.total_linkingP) || 0;
    totals.akum_linkingP      += Number(item.akum_linkingP) || 0;
    totals.total_linkingPP    += Number(item.total_linkingPP) || 0;
    totals.total_linkingPTP   += Number(item.total_linkingPTP) || 0;
    totals.sisa_linking       += Number(item.sisa_linking) || 0;
    
    totals.total_lo           += Number(item.total_lo) || 0;
    totals.akum_lo            += Number(item.akum_lo) || 0;
    totals.akum_lokea1        += Number(item.akum_lokea1) || 0;
    totals.sisa_lo            += Number(item.sisa_lo) || 0; // <-- Jumlahkan sisa lo layar
    
    totals.total_steam        += Number(item.total_steam) || 0;
    totals.akum_steam         += Number(item.akum_steam) || 0;
    totals.sisa_steam         += Number(item.sisa_steam) || 0;
    totals.total_cbs          += Number(item.total_cbs) || 0;
    totals.akum_cbs           += Number(item.akum_cbs) || 0;
    totals.total_cbshgs       += Number(item.total_cbshgs) || 0;
    totals.akum_cbshgs        += Number(item.akum_cbshgs) || 0;
    totals.untuk_cbs          += Number(item.untuk_cbs) || 0;
    totals.sisa_cbs           += Number(item.sisa_cbs) || 0; // <-- Jumlahkan sisa cbs layar
    
    totals.total_sewing       += Number(item.total_sewing) || 0;
    totals.akum_sewing        += Number(item.akum_sewing) || 0;
    totals.sisa_sewing        += Number(item.sisa_sewing) || 0; // <-- Jumlahkan sisa sewing layar
    
    totals.total_stik         += Number(item.total_stik) || 0;
    totals.akum_stik          += Number(item.akum_stik) || 0;
    totals.total_sontexsoom   += Number(item.total_sontexsoom) || 0;
    totals.akum_sontexsoom    += Number(item.akum_sontexsoom) || 0;
    totals.total_stkb         += Number(item.total_stkb) || 0;
    totals.akum_stkb          += Number(item.akum_stkb) || 0;
    totals.sisa_sontex        += Number(item.sisa_sontex) || 0; // <-- Jumlahkan sisa sontex layar
    
    totals.total_soom         += Number(item.total_soom) || 0;
    totals.akum_soom          += Number(item.akum_soom) || 0;
    totals.sisa_soom          += Number(item.sisa_soom) || 0; // <-- Jumlahkan sisa soom layar (-285.180 dll)
    
    totals.total_qclampubs    += Number(item.total_qclampubs) || 0;
    totals.akum_qclampubs     += Number(item.akum_qclampubs) || 0;
    totals.total_qclampulb    += Number(item.total_qclampulb) || 0;
    totals.akum_qclampulb     += Number(item.akum_qclampulb) || 0;
    
    // Perhatikan key properti di tbody kamu adalah item.sisa_lampu
    totals.sisa_lampu         += Number(item.sisa_lampu) || 0; // <-- Jumlahkan sisa lampu layar
    
    totals.total_sulam        += Number(item.total_sulam) || 0;
    totals.akum_sulam         += Number(item.akum_sulam) || 0;
    totals.total_sulamlb        += Number(item.total_sulamlb) || 0;
    totals.akum_sulamlb        += Number(item.akum_sulamlb) || 0;
    totals.sisa_sulam         += Number(item.sisa_sulam) || 0; // <-- Jumlahkan sisa sulam layar
    
    totals.total_kirim        += Number(item.total_kirim) || 0;
    totals.akum_kirim         += Number(item.akum_kirim) || 0;
    totals.sisa_kirim         += Number(item.sisa_kirim) || 0;
  });

  return totals;
});
// =============================================================================

const invalidGedungData = computed(() => {
  return filteredData.value.filter(item => 
    !item.xMark || 
    item.xMark === '-' ||
    !item.gedung || 
    item.gedung === '-'
  );
});

const hasActiveFilters = computed(() => Object.values(columnFilters.value).some(f => f.length > 0));
const resetFilters = () => { Object.keys(columnFilters.value).forEach(k => columnFilters.value[k] = []); };

// Format Tanggal: "11 Mei 2026"
const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

const fetchData = async () => {
  isLoading.value = true; 
  try {
    const [resProd, resPelengkap] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { 
        params: { pDate: filterDate.value } 
      }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, {
        params: { pDate: filterDate.value }
      }) 
    ]);

    const dataProduksi = resProd.data.data || [];
    const allPelengkap = resPelengkap.data.data || [];

    const pelengkapMap = new Map();
    allPelengkap.forEach(p => {
      if (p.xMark) {
        pelengkapMap.set(String(p.xMark).trim(), p);
      }
    });

    rawData.value = dataProduksi.map(prod => {
      const key = String(prod.xMark).trim();
      const pel = pelengkapMap.get(key);
      return {
        ...prod,
        gedung: pel ? (pel.gedung || '-') : '-',
        tgl_po: pel ? (pel.tgl_po || null) : null,
        pl: prod.pl || '-'
      };
    });

  } catch (err) { 
    console.error("Fetch Error:", err); 
  } finally {
    isLoading.value = false;
  }
};

const sum = (data, key) => data.reduce((a, b) => a + (Number(b[key]) || 0), 0);

const handleAutoSync = async () => {
  isSyncing.value = true;
  try {
    const response = await axios.post(`${API_BASE_URL}/receivefinishing/pelengkap/auto-sync`);
    
    if (response.data.status === "success") {
      alert(`Sukses! ${response.data.message}`);
      await fetchData();
    } else {
      alert(`Info: ${response.data.message}`);
    }
  } catch (err) {
    console.error("Sync Error:", err);
    const errMsg = err.response?.data?.message || "Gagal menghubungi server.";
    alert(`Error: ${errMsg}`);
  } finally {
    isSyncing.value = false;
  }
};

const exportToExcel = () => {
  const table = document.getElementById("table-produksi");
  const tableClone = table.cloneNode(true);
  tableClone.querySelectorAll('.bi-filter').forEach(el => el.remove());
  
  const ws = XLSX.utils.table_to_sheet(tableClone);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  
  XLSX.writeFile(wb, `Laporan_Finishing_${filterDate.value}.xlsx`);
};

const exportToPDF = () => {
  const doc = new jsPDF('l', 'mm', 'a3');
  
  doc.setFontSize(14);
  doc.text("Laporan Produksi Finishing", 15, 15);
  doc.setFontSize(10);
  doc.text(`Tanggal Produksi: ${filterDate.value}`, 15, 22);

  autoTable(doc, { 
    html: '#table-produksi', 
    theme: 'grid',
    startY: 30,
    styles: { 
      fontSize: 7, 
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: { 
      fillColor: [33, 37, 41],
      halign: 'center',
      valign: 'middle',
      fontSize: 8,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [33, 37, 41],
      textColor: [255, 255, 255],
      halign: 'center'
    },
    didParseCell: function(data) {
        if (data.section === 'head') {
            if (typeof data.cell.content === 'string') {
                data.cell.text = [data.cell.text[0].replace(/\s+/g, ' ').trim()];
            }
        }
    }
  });

  doc.save(`Laporan_Finishing_${filterDate.value}.pdf`);
};

const sendEmail = async () => {
  if (filteredData.value.length === 0) {
    alert("Tidak ada data untuk dikirim!");
    return;
  }

  const confirmSend = confirm("Apakah Anda yakin ingin mengirim laporan + file Excel ini via Email?");
  if (!confirmSend) return;

  isSendingEmail.value = true;

  try {
    const table = document.getElementById("table-produksi");
    const tableClone = table.cloneNode(true);
    tableClone.querySelectorAll('.bi-filter').forEach(el => el.remove());
    
    // Convert table DOM ke worksheet awal
    const wsOriginal = XLSXStyle.utils.table_to_sheet(tableClone);
    const rangeOriginal = XLSXStyle.utils.decode_range(wsOriginal['!ref']);

    // Buat objek worksheet baru untuk menampung pergeseran data beserta judul
    const ws = {};

    // ==========================================
    // 1. TAMBAHKAN JUDUL DINAMIS DI BARIS PALING ATAS
    // ==========================================
    const formattedPeriode = filterDate.value ? formatDate(filterDate.value) : 'Semua Periode';
    
    ws['A1'] = {
      v: `LAPORAN ALL FINISHING PERIODE: ${formattedPeriode}`.toUpperCase(),
      t: 's',
      s: {
        font: { name: 'Arial', size: 14, bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: 'left', vertical: 'center' }
      }
    };

    // ==========================================
    // DEFINISI STYLE UNTUK MASING-MASING BAGIAN
    // ==========================================
    const headerStyle = {
      font: { name: "Arial", sz: 10 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      },
      alignment: { vertical: "center", horizontal: "center", wrapText: true }
    };

    const dataStyle = {
      font: { name: "Arial", sz: 10 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      },
      alignment: { vertical: "center", horizontal: "center", wrapText: true }
    };

    const totalStyle = {
      fill: { fgColor: { rgb: "F8F9FA" } },
      font: { name: "Arial", sz: 10, bold: true },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      },
      alignment: { vertical: "center", horizontal: "center" }
    };

    // ==========================================
    // 2. PROSES COPY DATA & INJECT STYLE (DENGAN OFFSET BARIS +3)
    // ==========================================
    const offsetRows = 3; // Judul di baris 0, baris 1 & 2 dikosongkan untuk space

    Object.keys(wsOriginal).forEach(key => {
      if (key.startsWith('!')) return;
      
      const cell = XLSXStyle.utils.decode_cell(key);
      const newRow = cell.r + offsetRows; // Geser baris asli ke bawah
      const newKey = XLSXStyle.utils.encode_cell({ r: newRow, c: cell.c });

      // Copy data sel asli ke worksheet baru
      ws[newKey] = wsOriginal[key];
      
      // Inject style berdasarkan posisi baris asli sebelum digeser
      if (cell.r === 0) {
        // Baris pertama tabel asli -> HeaderStyle
        ws[newKey].s = headerStyle;
      } else if (cell.r === rangeOriginal.e.r) {
        // Baris terakhir tabel asli -> TotalStyle
        ws[newKey].s = totalStyle;
      } else {
        // Baris tengah -> DataStyle
        ws[newKey].s = dataStyle;
      }
    });

    // ==========================================
    // 3. ATUR ULANG META-DATA SHEET (Ref & Merges)
    // ==========================================
    // Update total range worksheet yang baru
    ws['!ref'] = XLSXStyle.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rangeOriginal.e.r + offsetRows, c: rangeOriginal.e.c }
    });

    // Jika ada kolom yang di-merge dari tabel HTML asli, geser koordinat barisnya juga
    if (wsOriginal['!merges']) {
      ws['!merges'] = wsOriginal['!merges'].map(merge => ({
        s: { r: merge.s.r + offsetRows, c: merge.s.c },
        e: { r: merge.e.r + offsetRows, c: merge.e.c }
      }));
    }

    // Copy setingan lebar kolom dari template asli jika ada
    if (wsOriginal['!cols']) ws['!cols'] = wsOriginal['!cols'];

    // ==========================================
    // PROSES PENGIRIMAN DATA BUFFER
    // ==========================================
    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Laporan");

    const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Laporan_Finishing_${filterDate.value}.xlsx`;

    const formData = new FormData();
    // Gunakan 'periode' agar seragam & pastikan teks ditambahkan duluan sebelum file
    formData.append("periode", formattedPeriode);
    formData.append("file", fileBlob, fileName); 

    const response = await axios.post(`${API_BASE_URL}/emailfinishing02/send-summary-email`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success || response.status === 200) {
      alert("Email berhasil dikirim dengan judul laporan dan style yang sesuai!");
    } else {
      alert("Gagal mengirim email: " + (response.data.message || "Terjadi kesalahan"));
    }
  } catch (error) {
    console.error("Error sending email:", error);
    alert("Terjadi kesalahan sistem saat mengirim email.");
  } finally {
    isSendingEmail.value = false;
  }
};

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => { localStorage.clear(); window.location.href = "/login"; };

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
  fetchData();
});
</script>

<style scoped>
.main-content { transition: all 0.3s ease-in-out; }
.ms-sidebar-open { margin-left: 260px; width: calc(100% - 260px); }
.ms-sidebar-closed { margin-left: 70px; width: calc(100% - 70px); }

.custom-table { min-width: 3300px; border-collapse: separate; border-spacing: 0; }
.sub-header-text { font-size: 11.5px !important; font-weight: 800 !important; color: #1a1a1a !important; padding: 10px 4px !important; background-color: #f8f9fa; }

.sticky-col { position: sticky; left: 0; z-index: 100; box-shadow: 3px 0 5px rgba(0,0,0,0.1); }
.sticky-top-1 { position: sticky; top: 0; z-index: 102; border-bottom: 1px solid #333 !important; }
.header-2 th { position: sticky; top: 43px; z-index: 101; border-bottom: 2px solid #dee2e6 !important; }

th.sticky-col.sticky-top-1 { z-index: 103; }
.sticky-footer { position: sticky; bottom: 0; z-index: 102; }

.bg-light-gray { background-color: #f1f3f5 !important; }
.bg-light-blue { background-color: #f0f7ff; color: #007bff !important; }
.bg-light-green { background-color: #f0fff4; color: #198754 !important; }
.bg-light-info { background-color: #f0faff; color: #0dcaf0 !important; }
.bg-light-purple { background-color: #f5f3ff; color: #6f42c1 !important; }

.cursor-pointer { cursor: pointer; color: #adb5bd; transition: 0.2s; }
.cursor-pointer:hover { color: #ffc107 !important; }

.filter-dropdown-panel { position: fixed; z-index: 10000; min-width: 250px; }
.custom-scrollbar::-webkit-scrollbar { height: 10px; width: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #bbb; border-radius: 10px; }
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000; /* Pastikan di atas tabel */
  backdrop-filter: blur(2px);
}

.is-loading-content {
  filter: blur(4px);
  pointer-events: none; /* User tidak bisa klik tabel saat loading */
}

/* Tambahkan transisi halus pada tombol cari */
.btn-primary {
  transition: opacity 0.3s;
}
</style>