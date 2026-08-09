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
                <button @click="sendEmailSummary" class="btn btn-primary btn-sm shadow-sm px-3 fw-bold">
                  <i class="bi bi-envelope-fill me-1"></i>
                  KIRIM EMAIL
                </button>
              <button @click="exportToExcel" class="btn btn-success btn-sm shadow-sm px-3 fw-bold">
                <i class="bi bi-file-earmark-excel me-1"></i> EXCEL
              </button>
            </div>
          </div>

          <div class="mb-4 d-flex flex-wrap gap-2">
             <a href="/finishing-pergedung" class="btn btn-sm btn-success fw-semibold"><i class="bi bi-card-list"></i> Laporan Prod Finishing</a>
             <div class="vr mx-2 bg-secondary opacity-50" style="height: 35px; min-width: 1.5px;"></div>
             <a href="/view-finishing-turun-pergedung" class="btn btn-warning active"><i class="bi bi-highlighter"></i> Input U/CBS&LO</a>
             <a href="/view-finishing-turun-soom-pergedung" class="btn btn-warning active"><i class="bi bi-highlighter"></i> Input U/SOOM</a>
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
              <div class="">
                <div class="justify-content-center"><h3 class="justify-content-center">Daily Finishing Production Recap {{ formatDate(filterDate) }}</h3></div>
                
              <div v-for="(dataGedung, namaGedung) in filteredGroupedSummaryData" :key="namaGedung" class="mb-5">

                <div class="table-responsive">
                  <table class="table table-bordered align-middle custom-summary-table mb-0 shadow-sm w-100">
                    <thead class="text-center align-middle header-styled text-dark">
                      <tr>
                        <th rowspan="2" style="width: 10%; min-width: 90px;">Order Qty</th>
                        <th rowspan="2" style="width: 10%; min-width: 90px;">Terima</th>
                        <th colspan="8" class="bg-light-gray text-uppercase fw-bold text-center"> {{ namaGedung }}</th>
                      </tr>
                      <tr>
                        <th style="width: 10%; min-width: 80px;">Dept</th>
                        <th style="width: 10%; min-width: 90px;">Hasil</th>
                        <th style="width: 10%; min-width: 100px;">Akum</th>
                        <th colspan="3" style="width: 30%; min-width: 200px;">Keterangan</th>
                        <th style="width: 10%; min-width: 100px;">Sisa</th>
                        <th style="width: 10%; min-width: 100px;">Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
  <template v-for="(row, idx) in dataGedung" :key="row.idUnik || row.dept">
    
    <template v-if="row.dept === 'Linking'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white" style="width: 15%;"></td>
        <td class="bg-white" style="width: 7%;"></td>
        <td class="bg-white" style="width: 8%;"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
        <td class="text-center fw-bold text-muted bg-white"></td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'LO'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark bg-white">untuk LO</td>
        <td class="text-center fw-bold text-primary bg-white">
          {{ (dataGedung.find(d => d.dept === 'Linking')?.turunLO || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-dark bg-white">
          {{ (dataGedung.find(d => d.dept === 'Linking')?.akumTurunLO || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
        <td rowspan="10" class="text-center fw-bold text-dark bg-light-gray">
          {{ row.selisihTotalGroup ? row.selisihTotalGroup.toLocaleString('id-ID') : '0' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Steam'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'CBS'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark bg-white">untuk CBS</td>
        <td class="text-center fw-bold text-primary bg-white">
          {{ (dataGedung.find(d => d.dept === 'Linking')?.turunCBS || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-dark bg-white">
          {{ (dataGedung.find(d => d.dept === 'Linking')?.akumTurunCBS || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Sewing'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Sontex'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa !== null && row.sisa !== undefined ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
      
      <tr>
        <td class="ps-3 text-dark bg-white">STKB komplit</td>
        <td class="text-center fw-bold text-primary bg-white">
          {{ row.totalStkb.toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-dark bg-white">
          {{ row.akumStkb.toLocaleString('id-ID') }}
        </td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Soom'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark bg-white">untuk soom</td>
        <td class="text-center fw-bold text-primary bg-white">
          {{ (dataGedung.find(d => d.dept === 'Sontex')?.turunSoom || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-dark bg-white">
          {{ (dataGedung.find(d => d.dept === 'Sontex')?.akumTurunSoom || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Qc Lampu'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td rowspan="2" class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td rowspan="2" class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td rowspan="2" class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark bg-white" style="width: 15%;">QC BS</td>
        <td class="text-center fw-bold text-primary bg-white" style="width: 7%;">{{ row.turunQcBs.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white" style="width: 8%;">{{ row.akumTurunQcBs.toLocaleString('id-ID') }}</td>
        <td rowspan="2" class="text-center fw-bold text-danger bg-white">
          {{ row.sisa.toLocaleString('id-ID') }}
        </td>
      </tr>
      <tr>
        <td class="ps-3 text-dark bg-white">QC LB</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.turunQcLb.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akumTurunQcLb.toLocaleString('id-ID') }}</td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Sulam'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Kirim' && row.isHeaderKirim">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-primary bg-white p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(dataGedung)" class="text-center fw-bold text-success bg-white p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td :rowspan="row.totalRowsKirim" class="fw-semibold ps-3 text-secondary bg-white">{{ row.dept }}</td>
        <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark fw-semibold bg-light-blue" style="width: 15%;">Lain-lain {{ row.xWorkName }}</td>
        <td class="text-center fw-bold text-primary bg-light-blue" style="width: 7%;">{{ row.totalLainLain.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-light-blue" style="width: 8%;">{{ row.akumLainLain.toLocaleString('id-ID') }}</td>
        <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
        <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-warning bg-light-gray">
          {{ row.selisihKirim ? row.selisihKirim.toLocaleString('id-ID') : '0' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Kirim' && !row.isHeaderKirim">
      <tr>
        <td class="ps-3 text-dark bg-white">Lain-lain {{ row.xWorkName }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.totalLainLain.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akumLainLain.toLocaleString('id-ID') }}</td>
      </tr>
    </template>
  </template>
</tbody>
                  </table>
                </div>
              </div>
              </div>
              <div class="">
                <div class="justify-content-center">
                  <h3>Summary Finishing Production {{ formatDate(filterDate) }}</h3>
                </div>
                <div v-if="Object.keys(filteredGroupedSummaryData).length > 0 && !isLoading" class="mt-5 border-top pt-4">
                

                <div class="table-responsive">
                  <table class="table table-bordered align-middle custom-summary-table mb-0 shadow-sm w-100 border-success">
                    <thead class="text-center align-middle bg-success text-white">
                      <tr>
                        <th rowspan="2" style="width: 10%; min-width: 90px; background-color: #198754; color: white;">Order Qty</th>
                        <th rowspan="2" style="width: 10%; min-width: 90px; background-color: #198754; color: white;">Terima</th>
                        <th colspan="8" class="text-uppercase fw-bold text-center bg-dark text-white">TOTAL REKAPITULASI</th>
                      </tr>
                      <tr>
                        <th style="width: 10%; min-width: 80px; background-color: #212529; color: white;">Dept</th>
                        <th style="width: 10%; min-width: 90px; background-color: #212529; color: white;">Hasil</th>
                        <th style="width: 10%; min-width: 100px; background-color: #212529; color: white;">Akum</th>
                        <th colspan="3" style="width: 30%; min-width: 200px; background-color: #212529; color: white;">Keterangan Total</th>
                        <th style="width: 10%; min-width: 100px; background-color: #212529; color: white;">Sisa</th>
                        <th style="width: 10%; min-width: 100px; background-color: #212529; color: white;">Selisih</th>
                      </tr>
                    </thead>
                    
                    <tbody>
  <template v-for="(row, idx) in grandTotalSummaryData" :key="'total_' + row.dept + '_' + idx"> 
    <template v-if="row.dept === 'Linking'">
      <tr>
        <td v-if="idx === 0" :rowspan="calculateRowspan(grandTotalSummaryData)" class="text-center fw-bold text-primary bg-light p-3">
          {{ row.orderQty.toLocaleString('id-ID') }}
        </td>
        <td v-if="idx === 0" :rowspan="calculateRowspan(grandTotalSummaryData)" class="text-center fw-bold text-success bg-light p-3">
          {{ row.terima.toLocaleString('id-ID') }}
        </td>
        <td class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
        <td class="text-center fw-bold text-muted bg-white"></td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'LO'">
      <tr>
        <td class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark bg-white">untuk LO</td>
        <td class="text-center fw-bold text-primary bg-white">
          {{ (grandTotalSummaryData.find(d => d.dept === 'Linking')?.turunLO || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-dark bg-white">
          {{ (grandTotalSummaryData.find(d => d.dept === 'Linking')?.akumTurunLO || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
        <td rowspan="10" class="text-center fw-bold text-dark bg-light-gray">
          {{ row.selisihTotalGroup ? row.selisihTotalGroup.toLocaleString('id-ID') : '0' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Steam'">
      <tr>
        <td class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'CBS'">
      <tr>
        <td class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark bg-white">untuk CBS</td>
        <td class="text-center fw-bold text-primary bg-white">
          {{ (grandTotalSummaryData.find(d => d.dept === 'Linking')?.turunCBS || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-dark bg-white">
          {{ (grandTotalSummaryData.find(d => d.dept === 'Linking')?.akumTurunCBS || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Sewing'">
      <tr>
        <td class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Sontex'">
      <tr>
        <td class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
      <tr>
        <td class="ps-3 text-dark bg-white">STKB komplit</td>
        <td class="text-center fw-bold text-primary bg-white">
          {{ row.totalStkb.toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-dark bg-white">
          {{ row.akumStkb.toLocaleString('id-ID') }}
        </td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Soom'">
      <tr>
        <td class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark bg-white">untuk soom</td>
        <td class="text-center fw-bold text-primary bg-white">
          {{ (grandTotalSummaryData.find(d => d.dept === 'Sontex')?.turunSoom || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-dark bg-white">
          {{ (grandTotalSummaryData.find(d => d.dept === 'Sontex')?.akumTurunSoom || 0).toLocaleString('id-ID') }}
        </td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Qc Lampu'">
      <tr>
        <td rowspan="2" class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td rowspan="2" class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td rowspan="2" class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark bg-white">QC BS</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.turunQcBs.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akumTurunQcBs.toLocaleString('id-ID') }}</td>
        <td rowspan="2" class="text-center fw-bold text-danger bg-white">
          {{ row.sisa.toLocaleString('id-ID') }}
        </td>
      </tr>
      <tr>
        <td class="ps-3 text-dark bg-white">QC LB</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.turunQcLb.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akumTurunQcLb.toLocaleString('id-ID') }}</td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Sulam'">
      <tr>
        <td class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="bg-white"></td>
        <td class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Kirim' && row.isHeaderKirim">
      <tr>
        <td :rowspan="row.totalRowsKirim" class="fw-bold ps-3 text-dark bg-white">{{ row.dept }}</td>
        <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-primary bg-white">{{ row.hasil.toLocaleString('id-ID') }}</td>
        <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-dark bg-white">{{ row.akum.toLocaleString('id-ID') }}</td>
        <td class="ps-3 text-dark fw-semibold bg-light-blue">Lain-lain {{ row.xWorkName }}</td>
        <td class="text-center fw-bold text-primary bg-light-blue">{{ row.totalLainLain.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-light-blue">{{ row.akumLainLain.toLocaleString('id-ID') }}</td>
        <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-danger bg-white">
          {{ row.sisa ? row.sisa.toLocaleString('id-ID') : '' }}
        </td>
        <td :rowspan="row.totalRowsKirim" class="text-center fw-bold text-warning bg-light-gray">
          {{ row.selisihKirim ? row.selisihKirim.toLocaleString('id-ID') : '0' }}
        </td>
      </tr>
    </template>

    <template v-else-if="row.dept === 'Kirim' && !row.isHeaderKirim">
      <tr>
        <td class="ps-3 text-dark bg-white">Lain-lain {{ row.xWorkName }}</td>
        <td class="text-center fw-bold text-primary bg-white">{{ row.totalLainLain.toLocaleString('id-ID') }}</td>
        <td class="text-center fw-bold text-dark bg-white">{{ row.akumLainLain.toLocaleString('id-ID') }}</td>
      </tr>
    </template>
  </template>
</tbody>
                  </table>
                </div>
              </div>
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

const getYesterdayDate = () => { 
  const d = new Date(); d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const filterDate = ref(getYesterdayDate());
const isLoading = ref(false);
const rawProductionData = ref([]);
const rawPelengkapTurun = ref([]);
const rawPelengkapTurunAkum = ref([]);
const rawPelengkapTurunSoom = ref([]);
const rawPelengkapTurunSoomAkum = ref([]);
const rawPelengkapLainLain = ref([]);

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
    if (r.dept === 'Linking' || r.dept === 'Sontex' ||  r.dept === 'Qc Lampu') {
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
    const [resProd, resPelengkap, resTurun, resTurunAkum, resTurunSoom, resTurunSoomAkum, resLainLain] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turun`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunakum`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoomakum`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-lainlain`, { params: { pDate: filterDate.value } })
    ]);
    
    const dataProduksi = resProd.data.data || [];
    const allPelengkap = resPelengkap.data.data || [];
    rawPelengkapTurun.value = resTurun.data.data || [];
    rawPelengkapTurunAkum.value = resTurunAkum.data.data || [];
    rawPelengkapTurunSoom.value = resTurunSoom.data.data || [];
    rawPelengkapTurunSoomAkum.value = resTurunSoomAkum.data.data || [];
    rawPelengkapLainLain.value = resLainLain.data.data || [];
    
    const pelengkapMap = new Map();
    allPelengkap.forEach(p => { if (p.xMark) pelengkapMap.set(String(p.xMark).trim(), p); });
    
    rawProductionData.value = dataProduksi.map(prod => {
      const key = String(prod.xMark).trim();
      const pel = pelengkapMap.get(key);
      const namaGedungAsli = pel?.gedung?.trim();

      return {
        ...prod,
        akum_terima: Number(prod.akum_terima) || 0,
        gedung: namaGedungAsli
          ? (namaGedungAsli.toLowerCase().startsWith('gedung')
          ? namaGedungAsli
          : `Gedung ${namaGedungAsli}`)
          : 'TANPA GEDUNG'
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
    const xMarksInGedung = list.map(item => String(item.xMark).trim());
    
    const totalOrderQty = sumByGedung(list, "order_qty");
    const totalTerimaGedung = sumByGedung(list, "akum_terima"); 
    const totalHasilLO      = sumByGedung(list, "total_lo");
    const totalAkumLO       = sumByGedung(list, "akum_lo");
    const totalHasilCBS     = sumByGedung(list, "total_cbs") + sumByGedung(list, "total_cbshgs");
    const totalAkumCBS      = sumByGedung(list, "akum_cbs") + sumByGedung(list, "akum_cbshgs");
    const totalHasilSoom    = sumByGedung(list, "total_soom");
    const totalAkumSoom     = sumByGedung(list, "akum_soom");
    const akumLinkingP = sumByGedung(list, "akum_linkingP");

    const totalKirimHariIni = sumByGedung(list, "total_lokea1") + sumByGedung(list, "total_linkingkea1") + sumByGedung(list, "total_sontekkea1") +
         sumByGedung(list, "total_lampukea1") + sumByGedung(list, "total_sulamkea1") + sumByGedung(list, "total_sulambelumsoomkea1") + sumByGedung(list, "total_samplekea1");
    const akumKirimSampaiIni = sumByGedung(list, "akum_lokea1") + sumByGedung(list, "akum_linkingkea1") + sumByGedung(list, "akum_sontekkea1") +
         sumByGedung(list, "akum_lampukea1") + sumByGedung(list, "akum_sulamkea1") + sumByGedung(list, "akum_sulambelumsoomkea1") + sumByGedung(list, "akum_samplekea1");

    const dataTurunGedung = rawPelengkapTurun.value.filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
    const dataTurunAkumGedung = rawPelengkapTurunAkum.value.filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
    const dataTurunSoomGedung = rawPelengkapTurunSoom.value.filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
    const dataTurunSoomAkumGedung = rawPelengkapTurunSoomAkum.value.filter(t => xMarksInGedung.includes(String(t.xMark).trim()));

    const totalTurunLO   = dataTurunGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
    const totalTurunCBS  = dataTurunGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
    const totalTurunSoom = dataTurunSoomGedung.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

    const totalKeteranganAkumLO   = dataTurunAkumGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.total_cbsandlo) || 0), 0);
    const totalKeteranganAkumCBS  = dataTurunAkumGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.total_cbsandlo) || 0), 0);
    const totalKeteranganAkumSoom = dataTurunSoomAkumGedung.reduce((acc, curr) => acc + (Number(curr.total_untuksoom) || 0), 0);

    const totalQcBs = sumByGedung(list, "total_qclampubs");
    const akumQcBs  = sumByGedung(list, "akum_qclampubs");
    const totalQcLb = sumByGedung(list, "total_qclampulb");
    const akumQcLb  = sumByGedung(list, "akum_qclampulb");

    const sisaLampuMurni   = sumByGedung(list, "sisa_lampu");
    const sisaSulamMurni   = sumByGedung(list, "sisa_sulam");
    const sisaSontexMurni  = sumByGedung(list, "sisa_sontex");
    const sisaSewingMurni  = sumByGedung(list, "sisa_sewing");
    const sisaCbsMurni     = sumByGedung(list, "sisa_cbs");
    const sisaLoMurni      = sumByGedung(list, "sisa_lo");
    const sisaSoomMurni    = sumByGedung(list, "sisa_soom");
    const sisaSteamMurni   = sumByGedung(list, "sisa_steam");

    // Hitung Penjumlahan Sisa LO sampai Sulam
    const groupSisaTotal = sisaLoMurni + sisaSteamMurni + sisaCbsMurni + sisaSewingMurni + sisaSontexMurni + sisaSoomMurni + sisaLampuMurni + sisaSulamMurni;
    const sisaKirimMurni = akumKirimSampaiIni - akumLinkingP;
    const selisihKirimVal = groupSisaTotal - sisaKirimMurni;

    const createRow = (deptName, hasilVal, akumVal, sisaVal = null) => {
      return {
        dept: deptName,
        hasil: hasilVal,
        akum: akumVal,
        sisa: sisaVal,
        orderQty: totalOrderQty,
        terima: totalTerimaGedung,
        turunLO: deptName === "Linking" ? totalTurunLO : 0,
        turunCBS: deptName === "Linking" ? totalTurunCBS : 0,
        turunSoom: deptName === "Sontex" ? totalTurunSoom : 0,
        akumTurunLO: deptName === "Linking" ? totalKeteranganAkumLO : 0,
        akumTurunCBS: deptName === "Linking" ? totalKeteranganAkumCBS : 0,
        akumTurunSoom: deptName === "Sontex" ? totalKeteranganAkumSoom : 0,
        turunQcBs: deptName === "Qc Lampu" ? totalQcBs : 0,
        turunQcLb: deptName === "Qc Lampu" ? totalQcLb : 0,
        akumTurunQcBs: deptName === "Qc Lampu" ? akumQcBs : 0,
        akumTurunQcLb: deptName === "Qc Lampu" ? akumQcLb : 0,
        totalStkb: deptName === "Sontex" ? sumByGedung(list, "total_stkb") : 0,
        akumStkb: deptName === "Sontex" ? sumByGedung(list, "akum_stkb") : 0,
        isHeaderKirim: false,
        totalRowsKirim: null,
        selisihTotalGroup: groupSisaTotal 
      };
    };

    const baseRows = [
      createRow("Linking", sumByGedung(list, "total_linkingP"), sumByGedung(list, "akum_linkingP"), (sumByGedung(list, "akum_linkingP") - totalTerimaGedung)),
      createRow("LO", totalHasilLO, totalAkumLO, sisaLoMurni),
      createRow("Steam", sumByGedung(list, "total_steam"), sumByGedung(list, "akum_steam"), sisaSteamMurni),
      createRow("CBS", totalHasilCBS, totalAkumCBS, sisaCbsMurni),
      createRow("Sewing", sumByGedung(list, "total_sewing"), sumByGedung(list, "akum_sewing"), sisaSewingMurni),
      createRow("Sontex", sumByGedung(list, "total_stik") + sumByGedung(list, "total_sontexsoom"), sumByGedung(list, "akum_stik") + sumByGedung(list, "akum_sontexsoom"), sisaSontexMurni),
      createRow("Soom", totalHasilSoom, totalAkumSoom, sisaSoomMurni),
      createRow("Qc Lampu", sumByGedung(list, "total_qclampu"), sumByGedung(list, "akum_qclampu"), sisaLampuMurni),
      createRow("Sulam", sumByGedung(list, "total_sulam"), sumByGedung(list, "akum_sulam"), sisaSulamMurni)
    ];

    const kategoriKirim = [
      { label: "LO kirim A1", totalKey: "total_lokea1", akumKey: "akum_lokea1" },
      { label: "Sontek kirim A1", totalKey: "total_sontekkea1", akumKey: "akum_sontekkea1" },
      { label: "Linking kirim A1", totalKey: "total_linkingkea1", akumKey: "akum_linkingkea1" },
      { label: "Lampu kirim A1", totalKey: "total_lampukea1", akumKey: "akum_lampukea1" },
      { label: "Sulam kirim A1", totalKey: "total_sulamkea1", akumKey: "akum_sulamkea1" },
      { label: "Sulam Blm Soom kirim A1", totalKey: "total_sulambelumsoomkea1", akumKey: "akum_sulambelumsoomkea1" },
      { label: "Sample kirim A1", totalKey: "total_samplekea1", akumKey: "akum_samplekea1" },
    ];

    const kirimRows = [];
    kategoriKirim.forEach((kat, index) => {
      const isFirst = index === 0;
      kirimRows.push({
        idUnik: `${gedung}_kirim_${kat.totalKey}_${index}`,
        dept: "Kirim",
        hasil: totalKirimHariIni,
        akum: akumKirimSampaiIni,
        orderQty: totalOrderQty,
        terima: totalTerimaGedung,
        isHeaderKirim: isFirst, 
        totalRowsKirim: kategoriKirim.length,
        xWorkName: kat.label,
        totalLainLain: sumByGedung(list, kat.totalKey),
        akumLainLain: sumByGedung(list, kat.akumKey),
        sisa: sisaKirimMurni,
        selisihKirim: selisihKirimVal
      });
    });

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

const grandTotalSummaryData = computed(() => {
  const activeGedungs = Object.keys(filteredGroupedSummaryData.value);
  if (activeGedungs.length === 0) return [];

  const combinedList = rawProductionData.value.filter(item => selectedGedung.value.includes(item.gedung));
  const xMarksInSelectedGedungs = combinedList.map(item => String(item.xMark).trim());

  const totalOrderQty = sumByGedung(combinedList, "order_qty");
  const totalTerimaAll = sumByGedung(combinedList, "akum_terima");
  const totalHasilLO      = sumByGedung(combinedList, "total_lo");
  const totalAkumLO       = sumByGedung(combinedList, "akum_lo");
  const totalHasilCBS     = sumByGedung(combinedList, "total_cbs") + sumByGedung(combinedList, "total_cbshgs");
  const totalAkumCBS      = sumByGedung(combinedList, "akum_cbs") + sumByGedung(combinedList, "akum_cbshgs");
  const totalHasilSoom    = sumByGedung(combinedList, "total_soom");
  const totalAkumSoom     = sumByGedung(combinedList, "akum_soom");
  const akumLinkingP = sumByGedung(combinedList, "akum_linkingP");
  
  const totalKirimHariIni =
  sumByGedung(combinedList, "total_lokea1") +
  sumByGedung(combinedList, "total_linkingkea1") +
  sumByGedung(combinedList, "total_sontekkea1") +
  sumByGedung(combinedList, "total_lampukea1") +
  sumByGedung(combinedList, "total_sulamkea1") + 
  sumByGedung(combinedList, "total_sulambelumsoomkea1") + 
  sumByGedung(combinedList, "total_samplekea1");

  const akumKirimSampaiIni =
  sumByGedung(combinedList, "akum_lokea1") +
  sumByGedung(combinedList, "akum_linkingkea1") +
  sumByGedung(combinedList, "akum_sontekkea1") +
  sumByGedung(combinedList, "akum_lampukea1") +
  sumByGedung(combinedList, "akum_sulamkea1") + 
  sumByGedung(combinedList, "akum_sulambelumsoomkea1") + 
  sumByGedung(combinedList, "akum_samplekea1");

  const dataTurunGedung = rawPelengkapTurun.value.filter(t => xMarksInSelectedGedungs.includes(String(t.xMark).trim()));
  const dataTurunAkumGedung = rawPelengkapTurunAkum.value.filter(t => xMarksInSelectedGedungs.includes(String(t.xMark).trim()));
  const dataTurunSoomGedung = rawPelengkapTurunSoom.value.filter(t => xMarksInSelectedGedungs.includes(String(t.xMark).trim()));
  const dataTurunSoomAkumGedung = rawPelengkapTurunSoomAkum.value.filter(t => xMarksInSelectedGedungs.includes(String(t.xMark).trim()));

  const totalTurunLO   = dataTurunGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalTurunCBS  = dataTurunGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalTurunSoom = dataTurunSoomGedung.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  const totalKeteranganAkumLO   = dataTurunAkumGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.total_cbsandlo) || 0), 0);
  const totalKeteranganAkumCBS  = dataTurunAkumGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.total_cbsandlo) || 0), 0);
  const totalKeteranganAkumSoom = dataTurunSoomAkumGedung.reduce((acc, curr) => acc + (Number(curr.total_untuksoom) || 0), 0);

  const totalQcBs = sumByGedung(combinedList, "total_qclampubs");
  const akumQcBs  = sumByGedung(combinedList, "akum_qclampubs");
  const totalQcLb = sumByGedung(combinedList, "total_qclampulb");
  const akumQcLb  = sumByGedung(combinedList, "akum_qclampulb");

  const sisaLampuMurni   = sumByGedung(combinedList, "sisa_lampu");
  const sisaSulamMurni   = sumByGedung(combinedList, "sisa_sulam");
  const sisaSontexMurni  = sumByGedung(combinedList, "sisa_sontex");
  const sisaSewingMurni  = sumByGedung(combinedList, "sisa_sewing");
  const sisaCbsMurni     = sumByGedung(combinedList, "sisa_cbs");
  const sisaLoMurni      = sumByGedung(combinedList, "sisa_lo");
  const sisaSoomMurni    = sumByGedung(combinedList, "sisa_soom");
  const sisaSteamMurni   = sumByGedung(combinedList, "sisa_steam");

  const grandGroupSisaTotal = sisaLoMurni + sisaSteamMurni + sisaCbsMurni + sisaSewingMurni + sisaSontexMurni + sisaSoomMurni + sisaLampuMurni + sisaSulamMurni;
  const grandSisaKirimMurni = akumKirimSampaiIni - akumLinkingP;
  const grandSelisihKirimVal = grandGroupSisaTotal - grandSisaKirimMurni;

  const createRowTotal = (deptName, hasilVal, akumVal, sisaVal = null) => {
    return {
      dept: deptName,
      hasil: hasilVal,
      akum: akumVal,
      sisa: sisaVal,
      orderQty: totalOrderQty,
      terima: totalTerimaAll,
      turunLO: deptName === "Linking" ? totalTurunLO : 0,
      turunCBS: deptName === "Linking" ? totalTurunCBS : 0,
      turunSoom: deptName === "Sontex" ? totalTurunSoom : 0,
      akumTurunLO: deptName === "Linking" ? totalKeteranganAkumLO : 0,
      akumTurunCBS: deptName === "Linking" ? totalKeteranganAkumCBS : 0,
      akumTurunSoom: deptName === "Sontex" ? totalKeteranganAkumSoom : 0,
      turunQcBs: deptName === "Qc Lampu" ? totalQcBs : 0,
      turunQcLb: deptName === "Qc Lampu" ? totalQcLb : 0,
      akumTurunQcBs: deptName === "Qc Lampu" ? akumQcBs : 0,
      akumTurunQcLb: deptName === "Qc Lampu" ? akumQcLb : 0,
      totalStkb: deptName === "Sontex" ? sumByGedung(combinedList, "total_stkb") : 0,
      akumStkb: deptName === "Sontex" ? sumByGedung(combinedList, "akum_stkb") : 0,
      isHeaderKirim: false,
      totalRowsKirim: null,
      selisihTotalGroup: grandGroupSisaTotal
    };
  };

  const baseRows = [
    createRowTotal("Linking", sumByGedung(combinedList, "total_linkingP"), sumByGedung(combinedList, "akum_linkingP"), (sumByGedung(combinedList, "akum_linkingP") - totalTerimaAll)),
    createRowTotal("LO", totalHasilLO, totalAkumLO, sisaLoMurni),
    createRowTotal("Steam", sumByGedung(combinedList, "total_steam"), sumByGedung(combinedList, "akum_steam"), sisaSteamMurni),
    createRowTotal("CBS", totalHasilCBS, totalAkumCBS, sisaCbsMurni),
    createRowTotal("Sewing", sumByGedung(combinedList, "total_sewing"), sumByGedung(combinedList, "akum_sewing"), sisaSewingMurni),
    createRowTotal("Sontex", sumByGedung(combinedList, "total_stik") + sumByGedung(combinedList, "total_sontexsoom"), sumByGedung(combinedList, "akum_stik") + sumByGedung(combinedList, "akum_sontexsoom"), sisaSontexMurni),
    createRowTotal("Soom", totalHasilSoom, totalAkumSoom, sisaSoomMurni),
    createRowTotal("Qc Lampu", sumByGedung(combinedList, "total_qclampu"), sumByGedung(combinedList, "akum_qclampu"), sisaLampuMurni),
    createRowTotal("Sulam", sumByGedung(combinedList, "total_sulam"), sumByGedung(combinedList, "akum_sulam"), sisaSulamMurni)
  ];

  const kategoriKirim = [
    { label: "LO kirim A1", totalKey: "total_lokea1", akumKey: "akum_lokea1" },
    { label: "Sontek kirim A1", totalKey: "total_sontekkea1", akumKey: "akum_sontekkea1" },
    { label: "Linking kirim A1", totalKey: "total_linkingkea1", akumKey: "akum_linkingkea1" },
    { label: "Lampu kirim A1", totalKey: "total_lampukea1", akumKey: "akum_lampukea1" },
    { label: "Sulam kirim A1", totalKey: "total_sulamkea1", akumKey: "akum_sulamkea1" },
    { label: "Sulam Belum Soom kirim A1", totalKey: "total_sulambelumsoomkea1", akumKey: "akum_sulambelumsoomkea1" },
    { label: "Sample A1", totalKey: "total_samplekea1", akumKey: "akum_samplekea1" }
  ];

  const kirimRows = [];
  kategoriKirim.forEach((kat, index) => {
    const isFirst = index === 0;
    kirimRows.push({
      dept: "Kirim",
      hasil: totalKirimHariIni,
      akum: akumKirimSampaiIni,
      orderQty: totalOrderQty,
      terima: totalTerimaAll,
      isHeaderKirim: isFirst, 
      totalRowsKirim: kategoriKirim.length,
      xWorkName: kat.label,
      totalLainLain: sumByGedung(combinedList, kat.totalKey),
      akumLainLain: sumByGedung(combinedList, kat.akumKey),
      sisa: grandSisaKirimMurni,
      selisihKirim: grandSelisihKirimVal
    });
  });

  return [...baseRows, ...kirimRows];
});

const exportToExcel = async () => {
  const buffer = await generateExcelBuffer();
  const dataBlob = new Blob(
    [buffer],
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  );
  const { saveAs } = await import("file-saver");
  saveAs(dataBlob, `Summary_Finishing_PerGedung_${filterDate.value}.xlsx`);
};

const generateExcelBuffer = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Summary Finishing");
  
  // Set lebar kolom (Menjadi 10 Kolom Utama karena tambahan Selisih)
  worksheet.columns = [
    { width: 14 }, // 1: Order Qty
    { width: 14 }, // 2: Terima
    { width: 18 }, // 3: Dept
    { width: 14 }, // 4: Hasil
    { width: 14 }, // 5: Akum
    { width: 24 }, // 6: Keterangan
    { width: 14 }, // 7: Keterangan Turun
    { width: 14 }, // 8: Keterangan Akum Turun
    { width: 14 }, // 9: Sisa
    { width: 14 }  // 10: Selisih
  ];

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFCCCCCC" } },
    left: { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    right: { style: "thin", color: { argb: "FFCCCCCC" } }
  };

  let currentRow = 2;
  const formattedDate = formatDate(filterDate.value);

  // ==========================================
  // 1. LOOP PER GEDUNG (REKAP HARIAN)
  // ==========================================
  for (const [namaGedung, dataGedung] of Object.entries(filteredGroupedSummaryData.value)) {
    
    worksheet.mergeCells(currentRow, 1, currentRow, 10);
    const titleCell = worksheet.getCell(currentRow, 1);
    titleCell.value = `Daily Finishing Production Recap ${formattedDate}`;
    titleCell.font = { bold: true, name: "Arial", size: 13 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    currentRow += 2; 

    const rowHeader1 = worksheet.getRow(currentRow);
    rowHeader1.getCell(1).value = "Order Qty";
    rowHeader1.getCell(2).value = "Terima";
    rowHeader1.getCell(3).value = `${namaGedung}`.toUpperCase();
    
    worksheet.mergeCells(currentRow, 1, currentRow + 1, 1); 
    worksheet.mergeCells(currentRow, 2, currentRow + 1, 2); 
    worksheet.mergeCells(currentRow, 3, currentRow, 10);     

    rowHeader1.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { bold: true, name: "Arial", size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = thinBorder;
      if (colNumber >= 3) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } }; 
      }
    });
    currentRow++;

    const rowHeader2 = worksheet.getRow(currentRow);
    rowHeader2.getCell(3).value = "Dept";
    rowHeader2.getCell(4).value = "Hasil";
    rowHeader2.getCell(5).value = "Akum";
    rowHeader2.getCell(6).value = "Keterangan";
    worksheet.mergeCells(currentRow, 6, currentRow, 8); 
    rowHeader2.getCell(9).value = "Sisa";
    rowHeader2.getCell(10).value = "Selisih";
    
    rowHeader2.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { bold: true, name: "Arial", size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = thinBorder;
    });
    currentRow++;

    const startDataRow = currentRow;

    dataGedung.forEach((item, index) => {
      const startDeptRow = currentRow;

      if (index === 0) {
        worksheet.getCell(currentRow, 1).value = item.orderQty;
        worksheet.getCell(currentRow, 2).value = item.terima;
      }

      if (item.dept === "Linking") {
        worksheet.getCell(currentRow, 3).value = item.dept;
        worksheet.getCell(currentRow, 4).value = item.hasil;
        worksheet.getCell(currentRow, 5).value = item.akum;
        worksheet.getCell(currentRow, 9).value = item.sisa || "";
        worksheet.getCell(currentRow, 10).value = ""; // Kosong untuk linking
        currentRow += 1;
      } 
      else if (item.dept === "LO") {
        worksheet.getCell(currentRow, 3).value = item.dept;
        worksheet.getCell(currentRow, 4).value = item.hasil;
        worksheet.getCell(currentRow, 5).value = item.akum;
        
        const linkingRow = dataGedung.find(d => d.dept === "Linking");
        worksheet.getCell(currentRow, 6).value = "untuk LO";
        worksheet.getCell(currentRow, 7).value = linkingRow ? linkingRow.turunLO : 0;
        worksheet.getCell(currentRow, 8).value = linkingRow ? linkingRow.akumTurunLO : 0;
        worksheet.getCell(currentRow, 9).value = item.sisa || "";
        
        // Merge Selisih dari baris LO sampai Sulam (9 baris data: LO, Steam, CBS, Sewing, Sontex + STKB, Soom, QC, Sulam)
        // Karena Sontex & QC memakan total baris dinamis, kita manual hitung offset merge
        let totalGroupRows = 10; // LO (1) + Steam (1) + CBS (1) + Sewing (1) + Sontex+STKB (2) + Soom (1) + QCLampu (2) + Sulam (1) = 10 baris
        worksheet.getCell(currentRow, 10).value = item.selisihTotalGroup;
        worksheet.mergeCells(currentRow, 10, currentRow + totalGroupRows - 1, 10);
        currentRow += 1;
      } 
      else if (item.dept === "Steam") {
        worksheet.getCell(currentRow, 3).value = item.dept;
        worksheet.getCell(currentRow, 4).value = item.hasil;
        worksheet.getCell(currentRow, 5).value = item.akum;
        worksheet.getCell(currentRow, 9).value = item.sisa || "";
        currentRow += 1;
      } 
      else if (item.dept === "CBS") {
        worksheet.getCell(currentRow, 3).value = item.dept;
        worksheet.getCell(currentRow, 4).value = item.hasil;
        worksheet.getCell(currentRow, 5).value = item.akum;
        
        const linkingRow = dataGedung.find(d => d.dept === "Linking");
        worksheet.getCell(currentRow, 6).value = "untuk CBS";
        worksheet.getCell(currentRow, 7).value = linkingRow ? linkingRow.turunCBS : 0;
        worksheet.getCell(currentRow, 8).value = linkingRow ? linkingRow.akumTurunCBS : 0;
        worksheet.getCell(currentRow, 9).value = item.sisa || "";
        currentRow += 1;
      } 
      else if (item.dept === "Sewing") {
        worksheet.getCell(currentRow, 3).value = item.dept;
        worksheet.getCell(currentRow, 4).value = item.hasil;
        worksheet.getCell(currentRow, 5).value = item.akum;
        worksheet.getCell(currentRow, 9).value = item.sisa || "";
        currentRow += 1;
      } 
      else if (item.dept === "Sontex") {
        worksheet.getCell(currentRow, 3).value = item.dept;
        worksheet.getCell(currentRow, 4).value = item.hasil;
        worksheet.getCell(currentRow, 5).value = item.akum;
        worksheet.getCell(currentRow, 9).value = item.sisa !== null && item.sisa !== undefined ? item.sisa : "";
        currentRow += 1;

        const rSTKB = currentRow;
        worksheet.getCell(rSTKB, 3).value = "STKB Komplit";
        worksheet.getCell(rSTKB, 4).value = item.totalStkb;
        worksheet.getCell(rSTKB, 5).value = item.akumStkb;
        worksheet.getCell(rSTKB, 9).value = ""; 
        currentRow += 1;
      } 
      else if (item.dept === "Soom") {
        worksheet.getCell(currentRow, 3).value = item.dept;
        worksheet.getCell(currentRow, 4).value = item.hasil;
        worksheet.getCell(currentRow, 5).value = item.akum;
        
        const sontexRow = dataGedung.find(d => d.dept === "Sontex");
        worksheet.getCell(currentRow, 6).value = "untuk soom";
        worksheet.getCell(currentRow, 7).value = sontexRow ? sontexRow.turunSoom : 0;
        worksheet.getCell(currentRow, 8).value = sontexRow ? sontexRow.akumTurunSoom : 0;
        worksheet.getCell(currentRow, 9).value = item.sisa || "";
        currentRow += 1;
      } 
      else if (item.dept === "Qc Lampu") {
        const r1 = currentRow, r2 = currentRow + 1;
        worksheet.getCell(r1, 3).value = item.dept;
        worksheet.getCell(r1, 4).value = item.hasil;
        worksheet.getCell(r1, 5).value = item.akum;

        worksheet.getCell(r1, 6).value = "QC BS";
        worksheet.getCell(r1, 7).value = item.turunQcBs;
        worksheet.getCell(r1, 8).value = item.akumTurunQcBs;
        worksheet.getCell(r1, 9).value = item.sisa !== null && item.sisa !== undefined ? item.sisa : "";

        worksheet.getCell(r2, 6).value = "QC LB";
        worksheet.getCell(r2, 7).value = item.turunQcLb;
        worksheet.getCell(r2, 8).value = item.akumTurunQcLb;

        worksheet.mergeCells(r1, 3, r2, 3);
        worksheet.mergeCells(r1, 4, r2, 4);
        worksheet.mergeCells(r1, 5, r2, 5);
        worksheet.mergeCells(r1, 9, r2, 9);
        currentRow += 2;
      } 
      else if (item.dept === "Sulam") {
        worksheet.getCell(currentRow, 3).value = item.dept;
        worksheet.getCell(currentRow, 4).value = item.hasil;
        worksheet.getCell(currentRow, 5).value = item.akum;
        worksheet.getCell(currentRow, 9).value = item.sisa || "";
        currentRow += 1;
      }
      else if (item.dept === "Kirim") {
        const r1 = currentRow;
        if (item.isHeaderKirim) {
          const blockEndRow = r1 + item.totalRowsKirim - 1;
          worksheet.getCell(r1, 3).value = item.dept;
          worksheet.getCell(r1, 4).value = item.hasil;
          worksheet.getCell(r1, 5).value = item.akum;
          worksheet.getCell(r1, 9).value = item.sisa !== null && item.sisa !== undefined ? item.sisa : "";
          
          worksheet.getCell(r1, 10).value = item.selisihKirim;

          worksheet.mergeCells(r1, 3, blockEndRow, 3);
          worksheet.mergeCells(r1, 4, blockEndRow, 4);
          worksheet.mergeCells(r1, 5, blockEndRow, 5);
          worksheet.mergeCells(r1, 9, blockEndRow, 9);
          worksheet.mergeCells(r1, 10, blockEndRow, 10);
        }
        worksheet.getCell(r1, 6).value = `Lain-lain ${item.xWorkName}`;
        worksheet.getCell(r1, 7).value = item.totalLainLain;
        worksheet.getCell(r1, 8).value = item.akumLainLain;

        for(let col = 6; col <= 8; col++) {
          worksheet.getCell(r1, col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F2FF" } };
        }
        currentRow += 1;
      } 

      for (let rIdx = startDeptRow; rIdx < currentRow; rIdx++) {
        const row = worksheet.getRow(rIdx);
        for (let colNum = 1; colNum <= 10; colNum++) {
          const cell = row.getCell(colNum);
          cell.border = thinBorder;
          cell.font = { name: "Arial", size: 10 };
          cell.alignment = {
            horizontal: colNum === 6 ? "left" : "center", 
            vertical: "middle"
          };
          
          if ([1, 2, 4, 5, 7, 8, 9, 10].includes(colNum) && typeof cell.value === "number") {
            cell.numFmt = "#,##0";
          }
          if ([1, 2, 4, 7, 9, 10].includes(colNum)) cell.font = { bold: true, name: "Arial", size: 10 };
        }
      }
    });

    const endDataRow = currentRow - 1;
    worksheet.mergeCells(startDataRow, 1, endDataRow, 1);
    worksheet.mergeCells(startDataRow, 2, endDataRow, 2);
    
    currentRow += 2; 
  }

  // ==========================================
  // 2. GRAND TOTAL SUMMARY (BAGIAN BAWAH)
  // ==========================================
  if (grandTotalSummaryData.value && grandTotalSummaryData.value.length > 0) {
    
    worksheet.mergeCells(currentRow, 1, currentRow, 10);
    const summaryTitle = worksheet.getCell(currentRow, 1);
    summaryTitle.value = `Summary Finishing Production ${formattedDate}`;
    summaryTitle.font = { bold: true, name: "Arial", size: 13 };
    summaryTitle.alignment = { horizontal: "center", vertical: "middle" };
    currentRow += 2;

    const rowGHeader1 = worksheet.getRow(currentRow);
    rowGHeader1.getCell(1).value = "Order Qty";
    rowGHeader1.getCell(2).value = "Terima";
    rowGHeader1.getCell(3).value = "TOTAL REKAPITULASI";
    
    worksheet.mergeCells(currentRow, 1, currentRow + 1, 1);
    worksheet.mergeCells(currentRow, 2, currentRow + 1, 2);
    worksheet.mergeCells(currentRow, 3, currentRow, 10);

    rowGHeader1.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { bold: true, name: "Arial", size: 11, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = thinBorder;
      cell.fill = {
        type: "pattern", pattern: "solid", fgColor: { argb: colNumber <= 2 ? "198754" : "212529" }
      };
    });
    currentRow++;

    const rowGHeader2 = worksheet.getRow(currentRow);
    rowGHeader2.getCell(3).value = "Dept";
    rowGHeader2.getCell(4).value = "Hasil";
    rowGHeader2.getCell(5).value = "Akum";
    rowGHeader2.getCell(6).value = "Keterangan Total";
    worksheet.mergeCells(currentRow, 6, currentRow, 8);
    rowGHeader2.getCell(9).value = "Sisa";
    rowGHeader2.getCell(10).value = "Selisih";
    
    rowGHeader2.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if(colNumber >= 3) {
        cell.font = { bold: true, name: "Arial", size: 11, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = thinBorder;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "212529" } };
      }
    });
    currentRow++;

    const startGrandDataRow = currentRow;

    grandTotalSummaryData.value.forEach((rowItem, idx) => {
      const startDeptGrandRow = currentRow;

      if (idx === 0) {
        worksheet.getCell(currentRow, 1).value = rowItem.orderQty;
        worksheet.getCell(currentRow, 2).value = rowItem.terima;
      }

      if (rowItem.dept === "Linking") {
        worksheet.getCell(currentRow, 3).value = rowItem.dept;
        worksheet.getCell(currentRow, 4).value = rowItem.hasil;
        worksheet.getCell(currentRow, 5).value = rowItem.akum;
        worksheet.getCell(currentRow, 9).value = rowItem.sisa || "";
        worksheet.getCell(currentRow, 10).value = "";
        currentRow += 1;
      } 
      else if (rowItem.dept === "LO") {
        worksheet.getCell(currentRow, 3).value = rowItem.dept;
        worksheet.getCell(currentRow, 4).value = rowItem.hasil;
        worksheet.getCell(currentRow, 5).value = rowItem.akum;
        
        const linkingRow = grandTotalSummaryData.value.find(d => d.dept === "Linking");
        worksheet.getCell(currentRow, 6).value = "untuk LO";
        worksheet.getCell(currentRow, 7).value = linkingRow ? linkingRow.turunLO : 0;
        worksheet.getCell(currentRow, 8).value = linkingRow ? linkingRow.akumTurunLO : 0;
        worksheet.getCell(currentRow, 9).value = rowItem.sisa || "";
        
        let totalGroupRows = 10;
        worksheet.getCell(currentRow, 10).value = rowItem.selisihTotalGroup;
        worksheet.mergeCells(currentRow, 10, currentRow + totalGroupRows - 1, 10);
        currentRow += 1;
      } 
      else if (rowItem.dept === "Steam") {
        worksheet.getCell(currentRow, 3).value = rowItem.dept;
        worksheet.getCell(currentRow, 4).value = rowItem.hasil;
        worksheet.getCell(currentRow, 5).value = rowItem.akum;
        worksheet.getCell(currentRow, 9).value = rowItem.sisa || "";
        currentRow += 1;
      } 
      else if (rowItem.dept === "CBS") {
        worksheet.getCell(currentRow, 3).value = rowItem.dept;
        worksheet.getCell(currentRow, 4).value = rowItem.hasil;
        worksheet.getCell(currentRow, 5).value = rowItem.akum;
        
        const linkingRow = grandTotalSummaryData.value.find(d => d.dept === "Linking");
        worksheet.getCell(currentRow, 6).value = "untuk CBS";
        worksheet.getCell(currentRow, 7).value = linkingRow ? linkingRow.turunCBS : 0;
        worksheet.getCell(currentRow, 8).value = linkingRow ? linkingRow.akumTurunCBS : 0;
        worksheet.getCell(currentRow, 9).value = rowItem.sisa || "";
        currentRow += 1;
      } 
      else if (rowItem.dept === "Sewing") {
        worksheet.getCell(currentRow, 3).value = rowItem.dept;
        worksheet.getCell(currentRow, 4).value = rowItem.hasil;
        worksheet.getCell(currentRow, 5).value = rowItem.akum;
        worksheet.getCell(currentRow, 9).value = rowItem.sisa || "";
        currentRow += 1;
      } 
      else if (rowItem.dept === "Sontex") {
        worksheet.getCell(currentRow, 3).value = rowItem.dept;
        worksheet.getCell(currentRow, 4).value = rowItem.hasil;
        worksheet.getCell(currentRow, 5).value = rowItem.akum;
        worksheet.getCell(currentRow, 9).value = rowItem.sisa !== null && rowItem.sisa !== undefined ? rowItem.sisa : "";
        currentRow += 1;

        const rSTKB = currentRow;
        worksheet.getCell(rSTKB, 3).value = "STKB Komplit";
        worksheet.getCell(rSTKB, 4).value = rowItem.totalStkb;
        worksheet.getCell(rSTKB, 5).value = rowItem.akumStkb;
        worksheet.getCell(rSTKB, 9).value = "";
        currentRow += 1;
      } 
      else if (rowItem.dept === "Soom") {
        worksheet.getCell(currentRow, 3).value = rowItem.dept;
        worksheet.getCell(currentRow, 4).value = rowItem.hasil;
        worksheet.getCell(currentRow, 5).value = rowItem.akum;
        
        const sontexRow = grandTotalSummaryData.value.find(d => d.dept === "Sontex");
        worksheet.getCell(currentRow, 6).value = "untuk soom";
        worksheet.getCell(currentRow, 7).value = sontexRow ? sontexRow.turunSoom : 0;
        worksheet.getCell(currentRow, 8).value = sontexRow ? sontexRow.akumTurunSoom : 0;
        worksheet.getCell(currentRow, 9).value = rowItem.sisa || "";
        currentRow += 1;
      } 
      else if (rowItem.dept === "Qc Lampu") {
        const r1 = currentRow, r2 = currentRow + 1;
        worksheet.getCell(r1, 3).value = rowItem.dept;
        worksheet.getCell(r1, 4).value = rowItem.hasil;
        worksheet.getCell(r1, 5).value = rowItem.akum;

        worksheet.getCell(r1, 6).value = "QC BS";
        worksheet.getCell(r1, 7).value = rowItem.turunQcBs;
        worksheet.getCell(r1, 8).value = rowItem.akumTurunQcBs;
        worksheet.getCell(r1, 9).value = rowItem.sisa !== null && rowItem.sisa !== undefined ? rowItem.sisa : "";

        worksheet.getCell(r2, 6).value = "QC LB";
        worksheet.getCell(r2, 7).value = rowItem.turunQcLb;
        worksheet.getCell(r2, 8).value = rowItem.akumTurunQcLb;

        worksheet.mergeCells(r1, 3, r2, 3);
        worksheet.mergeCells(r1, 4, r2, 4);
        worksheet.mergeCells(r1, 5, r2, 5);
        worksheet.mergeCells(r1, 9, r2, 9);
        currentRow += 2;
      } 
      else if (rowItem.dept === "Sulam") {
        worksheet.getCell(currentRow, 3).value = rowItem.dept;
        worksheet.getCell(currentRow, 4).value = rowItem.hasil;
        worksheet.getCell(currentRow, 5).value = rowItem.akum;
        worksheet.getCell(currentRow, 9).value = rowItem.sisa || "";
        currentRow += 1;
      }
      else if (rowItem.dept === "Kirim") {
        const r1 = currentRow;
        if (rowItem.isHeaderKirim) {
          const blockEndRow = r1 + rowItem.totalRowsKirim - 1;
          worksheet.getCell(r1, 3).value = rowItem.dept;
          worksheet.getCell(r1, 4).value = rowItem.hasil;
          worksheet.getCell(r1, 5).value = rowItem.akum;
          worksheet.getCell(r1, 9).value = rowItem.sisa !== null && rowItem.sisa !== undefined ? rowItem.sisa : "";
          
          worksheet.getCell(r1, 10).value = rowItem.selisihKirim;

          worksheet.mergeCells(r1, 3, blockEndRow, 3);
          worksheet.mergeCells(r1, 4, blockEndRow, 4);
          worksheet.mergeCells(r1, 5, blockEndRow, 5);
          worksheet.mergeCells(r1, 9, blockEndRow, 9);
          worksheet.mergeCells(r1, 10, blockEndRow, 10);
        }
        worksheet.getCell(r1, 6).value = `Lain-lain ${rowItem.xWorkName}`;
        worksheet.getCell(r1, 7).value = rowItem.totalLainLain;
        worksheet.getCell(r1, 8).value = rowItem.akumLainLain;

        for(let col = 6; col <= 8; col++) {
          worksheet.getCell(r1, col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F2FF" } };
        }
        currentRow += 1;
      } 

      for (let rIdx = startDeptGrandRow; rIdx < currentRow; rIdx++) {
        const row = worksheet.getRow(rIdx);
        for (let colNum = 1; colNum <= 10; colNum++) {
          const cell = row.getCell(colNum);
          cell.border = thinBorder;
          
          if(colNum <= 2) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
          }

          cell.font = { 
            name: "Arial", 
            size: 10, 
            bold: (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 4 || colNum === 7 || colNum === 9 || colNum === 10) 
          };
          
          cell.alignment = {
            horizontal: colNum === 6 ? "left" : "center",
            vertical: "middle"
          };
          
          if ([1, 2, 4, 5, 7, 8, 9, 10].includes(colNum) && typeof cell.value === "number") {
            cell.numFmt = "#,##0";
          }
        }
      }
    });

    const endGrandRow = currentRow - 1;
    worksheet.mergeCells(startGrandDataRow, 1, endGrandRow, 1);
    worksheet.mergeCells(startGrandDataRow, 2, endGrandRow, 2);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const sendEmailSummary = async () => {
  try {
    const excelBuffer = await generateExcelBuffer();
    const formData = new FormData();
    const file = new File(
      [excelBuffer],
      `Summary_Finishing_${filterDate.value}.xlsx`,
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );

    formData.append("file", file);
    formData.append("tanggal", filterDate.value);
    const response = await axios.post(`${API_BASE_URL}/email/send-summary-email`, formData);
    alert(response.data.message);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "Gagal kirim email");
  }
};

onMounted(() => {
  const userData = localStorage.getItem("user");
  if (userData) user.value = JSON.parse(userData);
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