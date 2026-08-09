<template>
  <div class="d-flex flex-column vh-100 bg-soft-gray overflow-hidden">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden pt-5">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['flex-grow-1 p-3 transition-all main-content d-flex flex-column overflow-hidden', sidebarOpen ? 'ms-sidebar-open' : 'ms-sidebar-closed']" style="position: relative; z-index: 1;">
        
        <div class="flex-shrink-0">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold text-dark m-0">
              <i class="bi bi-file-earmark-medical me-2 text-primary"></i>Laporan Finishing 
            </h5>
            <div class="d-flex gap-2">
              <div class="dropdown" style="z-index: 1030;">
                <button class="btn btn-outline-dark btn-sm fw-bold dropdown-toggle shadow-sm" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  KOLOM VISIBLE
                </button>
                <ul class="dropdown-menu dropdown-menu-end p-3 shadow border-0" style="min-width: 200px; z-index: 1035;">
                  <li v-for="(val, key) in columnVisible" :key="key" class="form-check form-switch mb-1">
                    <input class="form-check-input" type="checkbox" v-model="columnVisible[key]" :id="'vis-'+key">
                    <label class="form-check-label small fw-bold text-uppercase" :for="'vis-'+key">{{ key }}</label>
                  </li>
                </ul>
              </div>

              <button @click="sendEmail" :disabled="isSendingEmail" class="btn btn-primary btn-sm shadow-sm px-3 fw-bold">
                <span v-if="isSendingEmail" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-envelope me-1"></i> EMAIL
              </button>

              <button @click="exportToExcelweb" class="btn btn-success btn-sm shadow-sm px-3 fw-bold">
                <i class="bi bi-file-earmark-excel me-1"></i> EXCEL
              </button>
              <button @click="exportToPDF" class="btn btn-danger btn-sm shadow-sm px-3 fw-bold">
                <i class="bi bi-file-earmark-pdf me-1"></i> PDF
              </button>
            </div>
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
                <button @click="resetFilters" class="btn btn-sm btn-danger fw-bold shadow-sm">HAPUS SEMUA FILTER</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-lg rounded-4 overflow-hidden flex-grow-1 bg-white" style="position: relative;">
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner-border text-primary" role="status"></div>
            <h6 class="mt-2 fw-bold text-primary">MENYIAPKAN DATA...</h6>
          </div>

          <div class="card-body p-0 d-flex flex-column h-100" :class="{ 'is-loading-content': isLoading }">
            <div class="table-scroll-wrapper flex-grow-1 overflow-auto custom-scrollbar">
              <table id="table-v2" class="table table-bordered align-middle mb-0 custom-table-v2">
                <thead class="bg-dark text-white text-center sticky-top" style="z-index: 1010;">
                  <tr>
                    <th v-if="columnVisible.del" width="140">
                      DEL <i class="bi bi-filter cursor-pointer ms-1" @click="toggleFilterMenu($event, 'xminDate')"></i>
                    </th>
                    <th v-if="columnVisible.poNO" width="180">
                      PO <i class="bi bi-filter cursor-pointer ms-1" @click="toggleFilterMenu($event, 'xTimes')"></i>
                    </th>
                    <th v-if="columnVisible.style" width="180">
                      STYLE <i class="bi bi-filter cursor-pointer ms-1" @click="toggleFilterMenu($event, 'xMark')"></i>
                    </th>
                    <th v-if="columnVisible.order_qty" width="140">
                      ORDER QTY <i class="bi bi-filter cursor-pointer ms-1" @click="toggleFilterMenu($event, 'order_qty')"></i>
                    </th>
                    <th v-if="columnVisible.akum_terima" width="140">
                      AKUM TERIMA <i class="bi bi-filter cursor-pointer ms-1" @click="toggleFilterMenu($event, 'akum_terima')"></i>
                    </th>
                    <th v-if="columnVisible.gedung" width="130">
                      GEDUNG <i class="bi bi-filter cursor-pointer ms-1" @click="toggleFilterMenu($event, 'gedung')"></i>
                    </th>
                    <th width="180">
                      PROCESS <i class="bi bi-filter cursor-pointer ms-1" @click="toggleFilterMenu($event, 'process_list')"></i>
                    </th>
                    <th width="120">TODAY</th>
                    <th width="120">AKUM</th>
                    <th width="120">KURANG</th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="(item, i) in filteredData" :key="i">
                    <tr v-if="shouldShowProcess('Linking Primary')" :class="{'style-row-start': isFirstVisible('Linking Primary')}">
                      <td v-if="isFirstVisible('Linking Primary') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('Linking Primary') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('Linking Primary') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('Linking Primary') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('Linking Primary') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('Linking Primary') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="bg-light fw-bold">Linking Primary</td>
                      <td class="text-center">{{ item.total_linkingP }}</td>
                      <td class="text-center">{{ item.akum_linkingP }}</td>
                      <td class="text-center">{{ item.sisa_linking }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('LO')">
                      <td v-if="isFirstVisible('LO') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('LO') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('LO') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('LO') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('LO') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('LO') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">LO</td>
                      <td class="text-center">{{ item.total_lo }}</td>
                      <td class="text-center bg-green-soft fw-bold">{{ item.akum_lo }}</td>
                      <td class="text-center">{{ item.sisa_lo }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('STEAM')">
                      <td v-if="isFirstVisible('STEAM') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('STEAM') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('STEAM') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('STEAM') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('STEAM') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('STEAM') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">STEAM</td>
                      <td class="text-center">{{ item.total_steam }}</td>
                      <td class="text-center bg-light">{{ item.akum_steam }}</td>
                      <td class="text-center">{{ item.sisa_steam }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('CBS')">
                      <td v-if="isFirstVisible('CBS') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('CBS') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('CBS') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('CBS') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('CBS') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('CBS') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">CBS</td>
                      <td class="text-center">{{ Number(item.total_cbs) + Number(item.total_cbshgs) }}</td>
                      <td class="text-center bg-light">{{ Number(item.akum_cbs) + Number(item.akum_cbshgs) }}</td>
                      <td class="text-center">{{ item.sisa_cbs }}</td>
                    </tr>


                    <tr v-if="shouldShowProcess('SEWING')">
                      <td v-if="isFirstVisible('SEWING') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('SEWING') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('SEWING') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('SEWING') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('SEWING') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('SEWING') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">SEWING</td>
                      <td class="text-center">{{ item.total_sewing }}</td>
                      <td class="text-center bg-light">{{ item.akum_sewing }}</td>
                      <td class="text-center">{{ item.sisa_sewing }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('SONTEX')">
                      <td v-if="isFirstVisible('SONTEX') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('SONTEX') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('SONTEX') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('SONTEX') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('SONTEX') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('SONTEX') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">SONTEX</td>
                      <td class="text-center">{{ Number(item.total_stik) }}</td>
                      <td class="text-center bg-light">{{ Number(item.akum_stik) }}</td>
                      <td class="text-center" rowspan="3">{{ item.sisa_sontex }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('SONTEXSOOM')">
                      <td v-if="isFirstVisible('SONTEXSOOM') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('SONTEXSOOM') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('SONTEXSOOM') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('SONTEXSOOM') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('SONTEXSOOM') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('SONTEXSOOM') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">SOOM&SONTEX</td>
                      <td class="text-center">{{ item.total_sontexsoom }}</td>
                      <td class="text-center bg-light">{{ item.akum_sontexsoom }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('Sontex Komplit')">
                      <td v-if="isFirstVisible('Sontex Komplit') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('Sontex Komplit') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('Sontex Komplit') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('Sontex Komplit') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('Sontex Komplit') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('Sontex Komplit') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">Sontex Komplit</td>
                      <td class="text-center">{{ item.total_stkb }}</td>
                      <td class="text-center bg-light">{{ item.akum_stkb }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('SOOM')">
                      <td v-if="isFirstVisible('SOOM') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('SOOM') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('SOOM') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('SOOM') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('SOOM') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('SOOM') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">SOOM</td>
                      <td class="text-center">{{ item.total_soom }}</td>
                      <td class="text-center bg-light">{{ item.akum_soom }}</td>
                      <td class="text-center">{{ item.sisa_soom }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('QC. Lampu BS')">
                      <td v-if="isFirstVisible('QC. Lampu BS') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('QC. Lampu BS') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('QC. Lampu BS') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('QC. Lampu BS') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('QC. Lampu BS') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('QC. Lampu BS') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">QC. Lampu BS</td>
                      <td class="text-center">{{ item.total_qclampubs }}</td>
                      <td class="text-center bg-info-soft fw-bold">{{ item.akum_qclampubs }}</td>
                      <td class="text-center" rowspan="2">{{ item.sisa_lampu }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('QC. LAMPU LB')">
                      <td v-if="isFirstVisible('QC. LAMPU LB') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('QC. LAMPU LB') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('QC. LAMPU LB') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('QC. LAMPU LB') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('QC. LAMPU LB') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('QC. LAMPU LB') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">QC. LAMPU LB</td>
                      <td class="text-center">{{ item.total_qclampulb }}</td>
                      <td class="text-center bg-info-soft fw-bold">{{ item.akum_qclampulb }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('SULAM')">
                      <td v-if="isFirstVisible('SULAM') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('SULAM') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('SULAM') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('SULAM') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('SULAM') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('SULAM') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">SULAM</td>
                      <td class="text-center">{{ item.total_sulam }}</td>
                      <td class="text-center bg-purple-soft fw-bold">{{ item.akum_sulam }}</td>
                      <td class="text-center">{{ item.sisa_sulam }}</td>
                    </tr>
                    
                    <tr v-if="shouldShowProcess('KIRIMLINKINGA1')">
                      <td v-if="isFirstVisible('KIRIMLINKINGA1') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('KIRIMLINKINGA1') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('KIRIMLINKINGA1') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('KIRIMLINKINGA1') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('KIRIMLINKINGA1') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('KIRIMLINKINGA1') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">Kirim Linking to A1</td>
                      <td class="text-center">{{ Number(item.total_linkingkea1) }}</td>
                      <td class="text-center bg-light">{{ Number(item.akum_linkingkea1) }}</td>
                      <td class="text-center" rowspan="7">{{ item.sisa_kirim }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('KIRIMLOA1')">
                      <td v-if="isFirstVisible('KIRIMLOA1') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('KIRIMLOA1') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('KIRIMLOA1') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('KIRIMLOA1') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('KIRIMLOA1') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('KIRIMLOA1') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">Kirim LO to A1</td>
                      <td class="text-center">{{ item.total_lokea1 }}</td>
                      <td class="text-center bg-light">{{ item.akum_lokea1 }}</td>
                    </tr>

                    <tr v-if="shouldShowProcess('KIRIMSONTEXA1')">
                      <td v-if="isFirstVisible('KIRIMSONTEXA1') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('KIRIMSONTEXA1') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('KIRIMSONTEXA1') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('KIRIMSONTEXA1') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('KIRIMSONTEXA1') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('KIRIMSONTEXA1') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">kirim Sontex to A1 </td>
                      <td class="text-center">{{ item.total_sontekkea1 }}</td>
                      <td class="text-center bg-light">{{ item.akum_sontekkea1 }}</td>
                    </tr>
                     <tr v-if="shouldShowProcess('KIRIMLAMPUA1')">
                      <td v-if="isFirstVisible('KIRIMLAMPUA1') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('KIRIMLAMPUA1') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('KIRIMLAMPUA1') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('KIRIMLAMPUA1') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('KIRIMLAMPUA1') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('KIRIMLAMPUA1') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">kirim QCLampu to A1 </td>
                      <td class="text-center">{{ item.total_lampukea1 }}</td>
                      <td class="text-center bg-light">{{ item.akum_lampukea1 }}</td>
                    </tr>
                     <tr v-if="shouldShowProcess('KIRIMSULAMA1')">
                      <td v-if="isFirstVisible('KIRIMSULAMA1') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMA1') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMA1') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMA1') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMA1') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMA1') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">kirim Sulam to A1 </td>
                      <td class="text-center">{{ item.total_sulamkea1 }}</td>
                      <td class="text-center bg-light">{{ item.akum_sulamkea1 }}</td>
                    </tr>
                     <tr v-if="shouldShowProcess('KIRIMSULAMBELUMSOOMA1')">
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">kirim Sulam Belum Soom to A1 </td>
                      <td class="text-center">{{ item.total_sulambelumsoomkea1 }}</td>
                      <td class="text-center bg-light">{{ item.akum_sulambelumsoomkea1 }}</td>
                    </tr>
                    <tr v-if="shouldShowProcess('KIRIMSULAMBELUMSOOMA1')">
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.del" :rowspan="dynamicRowspan" class="text-center fw-bold small">{{ formatDate(item.xminDate) }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.poNO" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xTimes }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.style" :rowspan="dynamicRowspan" class="text-center fw-bold text-primary">{{ item.xMark }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.order_qty" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.order_qty }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.akum_terima" :rowspan="dynamicRowspan" class="text-center fw-bold text-success">{{ item.akum_terima }}</td>
                      <td v-if="isFirstVisible('KIRIMSULAMBELUMSOOMA1') && columnVisible.gedung" :rowspan="dynamicRowspan" class="text-center">{{ item.gedung }}</td>
                      <td class="fw-bold">kirim Sample to A1 </td>
                      <td class="text-center">{{ item.total_samplekea1 }}</td>
                      <td class="text-center bg-light">{{ item.akum_samplekea1 }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div v-if="activeFilterKey" class="filter-panel shadow-lg border rounded bg-white p-3" :style="{ top: filterPos.top, left: filterPos.left, zIndex: 2000, position: 'fixed', width: '250px' }">
      <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
        <span class="small fw-bold text-uppercase text-primary">Filter {{ activeFilterKey === 'process_list' ? 'Process' : (activeFilterKey === 'xMark' ? 'Style' : activeFilterKey) }}</span>
        <button @click="closeFilterMenu" class="btn-close btn-sm"></button>
      </div>
      
      <div class="mb-2 position-relative">
        <input type="text" v-model="filterSearchQuery" class="form-control form-control-sm pe-4" placeholder="Ketik untuk mencari..." autofocus />
        <i v-if="filterSearchQuery" class="bi bi-x-circle cursor-pointer text-muted position-absolute end-0 top-50 translate-middle-y me-2 small" @click="filterSearchQuery = ''"></i>
      </div>

      <div class="filter-list custom-scrollbar mb-3" style="max-height: 180px; overflow-y: auto;">
        <div v-for="opt in filteredOptions" :key="opt" class="form-check py-1 border-bottom border-light">
          <input class="form-check-input" type="checkbox" :value="opt" v-model="columnFilters[activeFilterKey]" :id="'opt-'+opt">
          <label class="form-check-label small w-100 cursor-pointer" :for="'opt-'+opt">
            {{ activeFilterKey === 'xminDate' ? formatDate(opt) : (opt || '(Kosong)') }}
          </label>
        </div>
        <div v-if="filteredOptions.length === 0" class="text-center text-muted small py-2">
          Data tidak ditemukan
        </div>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-primary btn-sm flex-grow-1 fw-bold" @click="closeFilterMenu">OKE</button>
          <button class="btn btn-outline-danger btn-sm fw-bold" @click="columnFilters[activeFilterKey] = []">RESET</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick  } from "vue";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import XLSXStyle from "xlsx-js-style";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const user = ref({});
const sidebarOpen = ref(true);
const rawData = ref([]);
const filterDate = ref(new Date().toISOString().substr(0, 10));
const isLoading = ref(false);
const isSendingEmail = ref(false);


// Update isi array process (Total 12 baris proses)
const allProcesses = [
  "Linking Primary", "LO", "STEAM", "CBS", "SEWING", 
  "SONTEX", "SONTEXSOOM", "Sontex Komplit", "SOOM", "QC. Lampu BS", "QC. LAMPU LB", "SULAM", "KIRIMLINKINGA1", "KIRIMLOA1", "KIRIMSONTEXA1", "KIRIMLAMPUA1", "KIRIMSULAMA1", "KIRIMSULAMBELUMSOOMA1", "KIRIMSAMPLEA1"
];

// State Visibilitas Kolom
const columnVisible = ref({
  del: true,
  poNO: true,
  style: true,
  order_qty: true,
  akum_terima: true,
  gedung: true
});

// State Filtering
const columnFilters = ref({ 
  xminDate: [], 
  xTimes: [],
  xMark: [], 
  order_qty: [], 
  akum_terima: [],
  gedung: [], 
  process_list: [] 
});
const activeFilterKey = ref(null);
const filterPos = ref({ top: '0px', left: '0px' });
const filterSearchQuery = ref("");

const toggleFilterMenu = (event, key) => {
  activeFilterKey.value = key;
  filterSearchQuery.value = "";
  filterPos.value = { 
    top: (event.clientY + 19) + 'px', 
    left: Math.min(event.clientX, window.innerWidth - 270) + 'px' 
  };
};

const closeFilterMenu = () => {
  activeFilterKey.value = null;
  filterSearchQuery.value = "";
};

const uniqueOptions = computed(() => {
  if (!activeFilterKey.value) return [];
  if (activeFilterKey.value === 'process_list') return allProcesses;
  
  const options = rawData.value.map(d => d[activeFilterKey.value]);
  const uniqueSet = [...new Set(options)];
  
  return uniqueSet.sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  });
});

const filteredOptions = computed(() => {
  if (!filterSearchQuery.value.trim()) {
    return uniqueOptions.value;
  }
  const query = filterSearchQuery.value.toLowerCase().trim();
  return uniqueOptions.value.filter(opt => {
    if (activeFilterKey.value === 'xminDate') {
      return formatDate(opt).toLowerCase().includes(query);
    }
    return String(opt).toLowerCase().includes(query);
  });
});

const shouldShowProcess = (processName) => {
  const selected = columnFilters.value.process_list;
  if (!selected || selected.length === 0) return true;
  return selected.includes(processName);
};

const isFirstVisible = (processName) => {
  const selected = columnFilters.value.process_list;
  const activeList = (selected && selected.length > 0) ? selected : allProcesses;
  const firstMatch = allProcesses.find(p => activeList.includes(p));
  return processName === firstMatch;
};

// Nilai default rowspan mengikuti total baris proses baru (12 baris)
const dynamicRowspan = computed(() => {
  const selected = columnFilters.value.process_list;
  return (selected && selected.length > 0) ? selected.length : 19;
});

const filteredData = computed(() => {
  return rawData.value.filter(item => {
    return Object.keys(columnFilters.value).every(key => {
      if (key === 'process_list') return true; 
      if (!columnFilters.value[key] || columnFilters.value[key].length === 0) return true;
      return columnFilters.value[key].includes(item[key]);
    });
  });
});

const hasActiveFilters = computed(() => Object.values(columnFilters.value).some(f => f.length > 0));
const resetFilters = () => { Object.keys(columnFilters.value).forEach(k => columnFilters.value[k] = []); };

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Tambahkan baris-baris ini di bagian atas <script setup> kamu
const rawPelengkapTurun = ref([]);
const rawPelengkapTurunAkum = ref([]);
const rawPelengkapTurunSoom = ref([]);
const rawPelengkapTurunSoomAkum = ref([]);
const rawPelengkapLainLain = ref([]);

const fetchData = async () => {
  isLoading.value = true;
  try {
    // 1. Panggil semua API pelengkap sekaligus termasuk untuk summary
    const [
      resProd, 
      resPelengkap, 
      resTurun, 
      resTurunAkum, 
      resTurunSoom, 
      resTurunSoomAkum, 
      resLainLain
    ] = await Promise.all([
      axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turun`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunakum`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoom`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-turunsoomakum`, { params: { pDate: filterDate.value } }),
      axios.get(`${API_BASE_URL}/receivefinishing/pelengkap-lainlain`, { params: { pDate: filterDate.value } })
    ]);

    // 2. Masukkan data ke masing-masing state/reactive variable summary per xMark
    const dataProduksi = resProd.data.data || [];
    const allPelengkap = resPelengkap.data.data || [];
    
    // Pastikan variabel .value ini sudah kamu declare di bagian atas (ref/reactive)
    rawPelengkapTurun.value = resTurun.data.data || [];
    rawPelengkapTurunAkum.value = resTurunAkum.data.data || [];
    rawPelengkapTurunSoom.value = resTurunSoom.data.data || [];
    rawPelengkapTurunSoomAkum.value = resTurunSoomAkum.data.data || [];
    rawPelengkapLainLain.value = resLainLain.data.data || [];

    // 3. Mapping data pelengkap utama untuk penentuan gedung & tgl_po
    const pelengkapMap = new Map();
    allPelengkap.forEach(p => {
      if (p.xMark) {
        pelengkapMap.set(String(p.xMark).trim(), p);
      }
    });

    // 4. Olah rawData utama untuk tabel per xMark
    rawData.value = dataProduksi.map(prod => {
      const key = String(prod.xMark).trim();
      const pel = pelengkapMap.get(key);
      const namaGedungAsli = pel?.gedung?.trim();

      return {
        ...prod,
        // Standarisasi penamaan gedung & fallback ke 'TANPA GEDUNG' seperti versi summary
        gedung: namaGedungAsli
          ? (namaGedungAsli.toLowerCase().startsWith('gedung')
            ? namaGedungAsli
            : `${namaGedungAsli}`)
          : 'TANPA GEDUNG',
        tgl_po: pel ? (pel.tgl_po || null) : null,
        pl: prod.pl || '-',
        akum_terima: Number(prod.akum_terima) || 0 // Jika di tabel xMark butuh akumulasi angka
      };
    });

  } catch (err) {
    console.error("Fetch Per XMark Error:", err);
  } finally {
    isLoading.value = false;
  }
};

// const fetchData = async () => {
//   isLoading.value = true;
//   try {
//     const [resProd, resPelengkap] = await Promise.all([
//       axios.get(`${API_BASE_URL}/receivefinishing/summary-line`, { 
//         params: { pDate: filterDate.value } 
//       }),
//       axios.get(`${API_BASE_URL}/receivefinishing/pelengkap`, { 
//         params: { pDate: filterDate.value } 
//       })
//     ]);

//     const dataProduksi = resProd.data.data || [];
//     const allPelengkap = resPelengkap.data.data || [];

//     const pelengkapMap = new Map();
//     allPelengkap.forEach(p => {
//       if (p.xMark) {
//         pelengkapMap.set(String(p.xMark).trim(), p);
//       }
//     });

//     rawData.value = dataProduksi.map(prod => {
//       const pel = pelengkapMap.get(String(prod.xMark).trim());
//       return {
//         ...prod,
//         gedung: pel ? (pel.gedung || '-') : '-',
//         tgl_po: pel ? (pel.tgl_po || null) : null,
//         pl: prod.pl || '-'
//       };
//     });
//   } catch (err) {
//     console.error("Fetch Error:", err);
//   } finally {
//     isLoading.value = false;
//   }
// };

// const exportToExcelweb = () => {
//   // 1. Validasi jika data kosong (mengikuti logika sendEmail)
//   if (filteredData.value.length === 0) {
//     alert("Tidak ada data untuk diexport!");
//     return;
//   }

//   try {
//     const table = document.getElementById("table-v2");
    
//     // Gunakan XLSXStyle agar style border dan format sel bisa terbaca
//     const ws = XLSXStyle.utils.table_to_sheet(table);

//     // Ambil range asli dari tabel HTML
//     const range = XLSXStyle.utils.decode_range(ws['!ref']);
//     const newSheet = {};

//     // 1. TAMBAHKAN JUDUL DINAMIS DI BARIS PALING ATAS
//     // Format Tanggal untuk Judul (Jika kosong, tampilkan 'Semua Periode')
//     const formattedPeriode = filterDate.value ? formatDate(filterDate.value) : 'Semua Periode';
    
//     newSheet['A1'] = {
//       v: `LAPORAN ALL FINISHING PERIODE: ${formattedPeriode}`.toUpperCase(),
//       t: 's',
//       s: {
//         font: { name: 'Arial', size: 14, bold: true, color: { rgb: "000000" } },
//         alignment: { horizontal: 'left', vertical: 'center' }
//       }
//     };

//     // 2. GESER SELURUH ISI SHEET 3 BARIS KE BAWAH (Untuk space judul)
//     Object.keys(ws).forEach(key => {
//       if (key.startsWith('!')) return;

//       const cell = XLSXStyle.utils.decode_cell(key);
//       const newRow = cell.r + 3; // Geser 3 baris ke bawah
//       const newCellRef = XLSXStyle.utils.encode_cell({ r: newRow, c: cell.c });

//       // Copy object cell
//       newSheet[newCellRef] = ws[key];

//       // Tambahkan default border untuk setiap sel data/header agar terlihat rapi
//       if (newSheet[newCellRef]) {
//         newSheet[newCellRef].s = {
//           ...newSheet[newCellRef].s,
//           border: {
//             top: { style: 'thin', color: { rgb: 'CCCCCC' } },
//             bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
//             left: { style: 'thin', color: { rgb: 'CCCCCC' } },
//             right: { style: 'thin', color: { rgb: 'CCCCCC' } }
//           }
//         };
//       }
//     });

//     // 3. MENANGANI RE-MAPPING MERGE CELL (!merges)
//     // Karena baris bergeser ke bawah, index baris (`s.r` dan `e.r`) di array merges harus ikut ditambah 3
//     let currentMerges = ws['!merges'] || [];
//     let adjustedMerges = currentMerges.map(m => {
//       return {
//         s: { r: m.s.r + 3, c: m.s.c },
//         e: { r: m.e.r + 3, c: m.e.c }
//       };
//     });

//     // Daftarkan merges baru ke sheet
//     newSheet['!merges'] = adjustedMerges;

//     // Update range sheet yang baru
//     newSheet['!ref'] = XLSXStyle.utils.encode_range({
//       s: { r: 0, c: 0 },
//       e: { r: range.e.r + 3, c: range.e.c }
//     });

//     // Set ukuran lebar kolom otomatis / copy dari template lama
//     if (ws['!cols']) newSheet['!cols'] = ws['!cols'];

//     // Buat workbook baru
//     const wb = XLSXStyle.utils.book_new();
//     XLSXStyle.utils.book_append_sheet(wb, newSheet, "Laporan Finishing");

//     // 4. PROSES DOWNLOAD FILE (Selesai diproses lokal)
//     XLSXStyle.writeFile(
//       wb,
//       `Laporan_Finishing_${filterDate.value || 'Semua_Periode'}.xlsx`
//     );

//   } catch (error) {
//     console.error("Gagal mengexport excel:", error);
//     alert("Terjadi kesalahan saat mengexport excel.");
//   }
// };

const exportToExcelweb = () => {
  if (!filteredData.value || filteredData.value.length === 0) {
    alert("Tidak ada data untuk diexport!");
    return;
  }

  try {
    const ws = XLSXStyle.utils.aoa_to_sheet([]);
    let currentRow = 0;

    // =========================================================================
    // 1. HEADER JUDUL UTAMA UTK FILE
    // =========================================================================
    const formattedPeriode = filterDate.value ? formatDate(filterDate.value) : 'Semua Periode';
    ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 0 })] = {
      v: `LAPORAN ALL FINISHING PERIODE: ${formattedPeriode}`.toUpperCase(),
      t: 's',
      s: {
        font: { name: 'Arial', size: 14, bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: 'left', vertical: 'center' }
      }
    };
    
    currentRow += 3;
    ws["!merges"] = [];

    // =========================================================================
    // STYLING HELPERS
    // =========================================================================
    const styleCell = (r, c, customStyle) => {
      const cellRef = XLSXStyle.utils.encode_cell({ r, c });
      if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
      
      const baseBorder = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      };

      ws[cellRef].s = {
        border: baseBorder,
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        font: { name: 'Arial', size: 9 },
        ...customStyle
      };
    };

    const mergeCells = (fromRow, fromCol, toRow, toCol) => {
      ws["!merges"].push({
        s: { r: fromRow, c: fromCol },
        e: { r: toRow, c: toCol }
      });
    };

    // =========================================================================
    // FILTER DATA AWAL: Abaikan data 'TANPA GEDUNG'
    // =========================================================================
    const dataHanyaGedung = filteredData.value.filter(item => {
      const namaGedung = String(item.gedung || '').trim().toUpperCase();
      return namaGedung !== '' && namaGedung !== '-' && namaGedung !== 'TANPA GEDUNG';
    });

    const dataGedungA = dataHanyaGedung.filter(item => String(item.gedung).toUpperCase().includes('A'));
    const dataGedungB = dataHanyaGedung.filter(item => String(item.gedung).toUpperCase().includes('B'));

    // =========================================================================
    // LOGIKA RENDER DATA + SUMMARY PER GEDUNG
    // =========================================================================
    const renderGedungGroup = (groupData, namaGedungLabel) => {
      if (groupData.length === 0) return;

      const colOffsets = [0, 7, 14]; // 6 kolom per card (STYLE, GEDUNG, PROCESS, TODAY, AKUM, KURANG)
      let baseRow = currentRow;
      let maxRowInGroup = baseRow;

      // -----------------------------------------------------------------------
      // LAJUR 1: CARD DATA XMARK UTAMA (3 Lajur)
      // -----------------------------------------------------------------------
      groupData.forEach((item, index) => {
        const position = index % 3;
        const startCol = colOffsets[position];

        if (index > 0 && position === 0) {
          baseRow = maxRowInGroup + 2;
        }

        let localRow = baseRow;

        // =====================================================================
        // HEADER METADATA DI ATAS TABEL (Sesuai Gambar)
        // Baris 1: "" | "" | "Order Qty" | [nilai order_qty] | "Akum Terima" | [nilai akum_terima]
        // Posisi:  STYLE | GEDUNG | PROCESS | TODAY | AKUM | KURANG
        // =====================================================================
        
        // Baris Header Metadata (Label)
       ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol })] = { v: "", t: "s" };     // Kolom kosong 1
        ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 1 })] = { v: "", t: "s" }; // Kolom kosong 2
        ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 2 })] = { v: "Order Qty", t: "s" };
        ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 3 })] = { v: item.order_qty || 0, t: "n" };
        ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 4 })] = { v: "Akum Terima", t: "s" };
        ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 5 })] = { v: item.akum_terima || 0, t: "n" };

        // Styling Header Metadata
        // 1. Kolom kosong 1 & 2 diberi warna grey (A6A6A6)
        styleCell(localRow, startCol, { fill: { fgColor: { rgb: "A6A6A6" } } });
        styleCell(localRow, startCol + 1, { fill: { fgColor: { rgb: "A6A6A6" } } });
        
        // 2. Header "Order Qty" grey, nilainya (col + 3) tanpa warna
        styleCell(localRow, startCol + 2, { fill: { fgColor: { rgb: "A6A6A6" } }, font: { bold: true, size: 9 } });
        styleCell(localRow, startCol + 3, { font: { size: 9 }, alignment: { horizontal: 'right' } });
        
        // 3. Header "Akum Terima" grey, nilainya (col + 5) tanpa warna
        styleCell(localRow, startCol + 4, { fill: { fgColor: { rgb: "A6A6A6" } }, font: { bold: true, size: 9 } });
        styleCell(localRow, startCol + 5, { font: { size: 9 }, alignment: { horizontal: 'right' } });

        localRow++;

        // =====================================================================
        // SUB-HEADER TABEL UTAMA: STYLE | GEDUNG | PROCESS | TODAY | AKUM | KURANG
        // =====================================================================
        const tableHeaders = ["STYLE", "GEDUNG", "PROCESS", "TODAY", "AKUM", "KURANG"];
        XLSXStyle.utils.sheet_add_aoa(ws, [tableHeaders], { origin: XLSXStyle.utils.encode_cell({ r: localRow, c: startCol }) });
        
        for (let c = startCol; c <= startCol + 5; c++) {
          const isStyleCol = (c === startCol);
          const headerBgColor = isStyleCol ? "A6A6A6" : "A6A6A6";
          styleCell(localRow, c, { 
            font: { bold: true, color: { rgb: "000000" }, size: 9 }, 
            fill: { fgColor: { rgb: headerBgColor } } 
          });
        }

        localRow++;
        const startDataRow = localRow;

        // =====================================================================
        // DATA PROSES
        // =====================================================================
        const processes = [
          ["Linking Primary", item.total_linkingP, item.akum_linkingP, item.sisa_linking],
          ["LO", item.total_lo, item.akum_lo, item.sisa_lo],
          ["STEAM", item.total_steam, item.akum_steam, item.sisa_steam],
          ["CBS", Number(item.total_cbs) + Number(item.total_cbshgs), Number(item.akum_cbs) + Number(item.akum_cbshgs), item.sisa_cbs],
          ["SEWING", item.total_sewing, item.akum_sewing, item.sisa_sewing],
          ["SONTEX", item.total_stik, item.akum_stik, item.sisa_sontex],
          ["SONTEX SOOM", item.total_sontexsoom, item.akum_sontexsoom, item.sisa_sontex],
          ["SONTEX KOMPLIT", item.total_stkb, item.akum_stkb, item.sisa_sontex],
          ["QC BS", item.total_qclampubs, item.akum_qclampubs, item.sisa_lampu],
          ["QC LB", item.total_qclampulb, item.akum_qclampulb, item.sisa_lampu],
          ["SOOM", item.total_soom, item.akum_soom, item.sisa_soom],
          ["SULAM", item.total_sulam, item.akum_sulam, item.sisa_sulam],
          ["KIRIM LINKING A1", item.total_linkingkea1, item.akum_linkingkea1, item.sisa_kirim],
          ["KIRIM LO A1", item.total_lokea1, item.akum_lokea1, item.sisa_kirim],
          ["KIRIM SONTEX A1", item.total_sontekkea1, item.akum_sontekkea1, item.sisa_kirim],
          ["KIRIM LAMPU A1", item.total_lampukea1, item.akum_lampukea1, item.sisa_kirim],
          ["KIRIM SULAM A1", item.total_sulamkea1, item.akum_sulamkea1, item.sisa_kirim],
          ["KIRIM SULAM BELUM SOOM", item.total_sulambelumsoomkea1, item.akum_sulambelumsoomkea1, item.sisa_kirim],
          ["KIRIM SAMPLE A1", item.total_samplekea1, item.akum_samplekea1, item.sisa_kirim],
        ];

        const endDataRow = startDataRow + processes.length - 1;

        // Kolom STYLE dan GEDUNG (merged vertikal)
        ws[XLSXStyle.utils.encode_cell({ r: startDataRow, c: startCol })] = { v: item.xMark || "-", t: "s" };
        ws[XLSXStyle.utils.encode_cell({ r: startDataRow, c: startCol + 1 })] = { v: item.gedung || "-", t: "s" };

        processes.forEach((p) => {
          ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 2 })] = { v: p[0], t: "s" };
          ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 3 })] = { v: p[1] || 0, t: "n" };
          ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 4 })] = { v: p[2] || 0, t: "n" };
          ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 5 })] = { v: p[3] || 0, t: "n" };

          // Styling kolom STYLE (kuning)
          styleCell(localRow, startCol, { 
            fill: { fgColor: { rgb: "FFFFFF" } }, 
            alignment: { horizontal: 'center', vertical: 'middle' } 
          }); 
          
          // Styling kolom GEDUNG
          styleCell(localRow, startCol + 1, { 
            alignment: { horizontal: 'center', vertical: 'middle' } 
          }); 
          
          // Styling kolom PROCESS
          styleCell(localRow, startCol + 2, { 
            alignment: { horizontal: 'left', vertical: 'middle' } 
          }); 
          
          // Styling kolom TODAY
          styleCell(localRow, startCol + 3, { 
            alignment: { horizontal: 'right', vertical: 'middle' } 
          });
          
          // Styling kolom AKUM
          styleCell(localRow, startCol + 4, { 
            alignment: { horizontal: 'right', vertical: 'middle' } 
          });
          
          // Styling kolom KURANG
          styleCell(localRow, startCol + 5, { 
            alignment: { horizontal: 'right', vertical: 'middle' } 
          });
          
          localRow++;
        });

        // Merge vertikal untuk STYLE dan GEDUNG
        mergeCells(startDataRow, startCol, endDataRow, startCol);         
        mergeCells(startDataRow, startCol + 1, endDataRow, startCol + 1); 
        
        // Merge untuk kolom KURANG (SONTEX group, QC group, KIRIM group)
        mergeCells(startDataRow + 5, startCol + 5, startDataRow + 7, startCol + 5);   // SONTEX group
        mergeCells(startDataRow + 8, startCol + 5, startDataRow + 9, startCol + 5);   // QC group
        mergeCells(startDataRow + 12, startCol + 5, endDataRow, startCol + 5);        // KIRIM group

        if (localRow > maxRowInGroup) maxRowInGroup = localRow;
      });

      currentRow = maxRowInGroup;

      // -----------------------------------------------------------------------
      // LAJUR 2: TABEL SUMMARY PER GEDUNG
      // -----------------------------------------------------------------------
      currentRow += 3; 

      const xMarksInGedung = groupData.map(item => String(item.xMark).trim());

      const dataTurunGedung = (rawPelengkapTurun.value || []).filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
      const dataTurunAkumGedung = (rawPelengkapTurunAkum.value || []).filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
      const dataTurunSoomGedung = (rawPelengkapTurunSoom.value || []).filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
      const dataTurunSoomAkumGedung = (rawPelengkapTurunSoomAkum.value || []).filter(t => xMarksInGedung.includes(String(t.xMark).trim()));

      const totalTurunLO   = dataTurunGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
      const totalTurunCBS  = dataTurunGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
      const totalTurunSoom = dataTurunSoomGedung.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

      const totalKeteranganAkumLO   = dataTurunAkumGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.total_cbsandlo) || 0), 0);
      const totalKeteranganAkumCBS  = dataTurunAkumGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.total_cbsandlo) || 0), 0);
      const totalKeteranganAkumSoom = dataTurunSoomAkumGedung.reduce((acc, curr) => acc + (Number(curr.total_untuksoom) || 0), 0);

      const sumKey = (key) => groupData.reduce((acc, item) => acc + Number(item[key] || 0), 0);

      // Baris Header Kelompok Gedung Utama
      mergeCells(currentRow, 2, currentRow, 8);
      ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 2 })] = {
        v: namaGedungLabel,
        t: 's',
        s: { font: { name: 'Arial', size: 10, bold: true }, alignment: { horizontal: 'center' } }
      };
      currentRow += 1;

      // Judul Kolom Tabel Summary
      const summaryHeaders = ["Order Qty", "Terima", "Dept", "Hasil", "Akum", "Keterangan", "", "", "Sisa"];
      XLSXStyle.utils.sheet_add_aoa(ws, [summaryHeaders], { origin: XLSXStyle.utils.encode_cell({ r: currentRow, c: 0 }) });
      mergeCells(currentRow, 5, currentRow, 7); 

      for (let c = 0; c <= 8; c++) {
        styleCell(currentRow, c, { font: { bold: true, size: 9 }, alignment: { horizontal: 'center' } });
      }
      currentRow += 1;

      const startSummaryDataRow = currentRow;

      const totalOrderQty = sumKey('order_qty');
      const totalAkumTerima = sumKey('akum_terima');

      // Fungsi Pembantu Render Tiap Baris Summary
      const writeSummaryRow = (deptName, hasil, akum, sisa, ketText = "", ketHasil = null, ketAkum = null) => {
        ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 0 })] = { v: totalOrderQty, t: "n" };
        ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 1 })] = { v: totalAkumTerima, t: "n" };
        ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 2 })] = { v: deptName, t: "s" };
        ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 3 })] = { v: hasil, t: "n" };
        ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 4 })] = { v: akum, t: "n" };
        
        ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 5 })] = { v: ketText, t: "s" };
        if (ketHasil !== null) ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 6 })] = { v: ketHasil, t: "n" };
        if (ketAkum !== null)  ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 7 })] = { v: ketAkum, t: "n" };
        
        if (sisa !== null) ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 8 })] = { v: sisa, t: "n" };

        for (let c = 0; c <= 8; c++) {
          let customAlign = { horizontal: 'right', vertical: 'middle' };
          if (c === 2 || c === 5) customAlign.horizontal = 'left';
          
          let fontStyle = { name: 'Arial', size: 9 };
          if (c === 0 || c === 1) fontStyle.bold = true;
          if (c === 3 || c === 6) fontStyle.color = { rgb: "002060" };
          if (c === 8) fontStyle.color = { rgb: "C00000" };

          styleCell(currentRow, c, { alignment: customAlign, font: fontStyle });
        }
      };

      // 1. Linking
      const totalAkumLinkingP = sumKey('akum_linkingP');
      writeSummaryRow("Linking", sumKey('total_linkingP'), totalAkumLinkingP, (totalAkumLinkingP - totalAkumTerima));
      mergeCells(currentRow, 5, currentRow, 7); 

      // 2. LO
      currentRow++;
      writeSummaryRow("LO", sumKey('total_lo'), sumKey('akum_lo'), sumKey('sisa_lo'), "untuk LO", totalTurunLO, totalKeteranganAkumLO);

      // 3. Steam
      currentRow++;
      writeSummaryRow("Steam", sumKey('total_steam'), sumKey('akum_steam'), sumKey('sisa_steam'));
      mergeCells(currentRow, 5, currentRow, 7);

      // 4. CBS
      currentRow++;
      const totalHasilCBS = sumKey('total_cbs') + sumKey('total_cbshgs');
      const totalAkumCBS = sumKey('akum_cbs') + sumKey('akum_cbshgs');
      writeSummaryRow("CBS", totalHasilCBS, totalAkumCBS, sumKey('sisa_cbs'), "untuk CBS", totalTurunCBS, totalKeteranganAkumCBS);

      // 5. Sewing
      currentRow++;
      writeSummaryRow("Sewing", sumKey('total_sewing'), sumKey('akum_sewing'), sumKey('sisa_sewing'));
      mergeCells(currentRow, 5, currentRow, 7);

      // 6. Sontex
      currentRow++;
      const totalHasilSontex = sumKey('total_stik') + sumKey('total_sontexsoom');
      const totalAkumSontex = sumKey('akum_stik') + sumKey('akum_sontexsoom');
      writeSummaryRow("Sontex", totalHasilSontex, totalAkumSontex, sumKey('sisa_sontex'));
      mergeCells(currentRow, 5, currentRow, 7);

      // 7. STKB komplit
      currentRow++;
      writeSummaryRow("STKB komplit", sumKey('total_stkb'), sumKey('akum_stkb'), null); 
      mergeCells(currentRow, 5, currentRow, 7);

      // 8. Soom
      currentRow++;
      writeSummaryRow("Soom", sumKey('total_soom'), sumKey('akum_soom'), sumKey('sisa_soom'), "untuk soom", totalTurunSoom, totalKeteranganAkumSoom);

      // 9. QC Lampu
      currentRow++;
      writeSummaryRow("Qc Lampu", sumKey('total_qclampu'), sumKey('akum_qclampu'), sumKey('sisa_lampu'), "QC BS", sumKey('total_qclampubs'), sumKey('akum_qclampubs'));
      
      currentRow++; 
      writeSummaryRow("Qc Lampu", sumKey('total_qclampu'), sumKey('akum_qclampu'), sumKey('sisa_lampu'), "QC LB", sumKey('total_qclampulb'), sumKey('akum_qclampulb'));
      
      mergeCells(currentRow - 1, 2, currentRow, 2); 
      mergeCells(currentRow - 1, 3, currentRow, 3); 
      mergeCells(currentRow - 1, 4, currentRow, 4); 
      mergeCells(currentRow - 1, 8, currentRow, 8); 

      // 10. Sulam
      currentRow++;
      writeSummaryRow("Sulam", sumKey('total_sulam'), sumKey('akum_sulam'), sumKey('sisa_sulam'));
      mergeCells(currentRow, 5, currentRow, 7);

      // 11. Kirim Breakdown
      const kirimItems = [
        { label: "Lain-lain LO kirim A1", h: sumKey('total_lokea1'), a: sumKey('akum_lokea1') },
        { label: "Lain-lain Sontek kirim A1", h: sumKey('total_sontekkea1'), a: sumKey('akum_sontekkea1') },
        { label: "Lain-lain Linking kirim A1", h: sumKey('total_linkingkea1'), a: sumKey('akum_linkingkea1') },
        { label: "Lain-lain Lampu kirim A1", h: sumKey('total_lampukea1'), a: sumKey('akum_lampukea1') },
        { label: "Lain-lain Sulam kirim A1", h: sumKey('total_sulamkea1'), a: sumKey('akum_sulamkea1') },
        { label: "Lain-lain Sulam Blm Soom kirim A1", h: sumKey('total_sulambelumsoomkea1'), a: sumKey('akum_sulambelumsoomkea1') },
        { label: "Lain-lain Sample kirim A1", h: sumKey('total_samplekea1'), a: sumKey('akum_samplekea1') }
      ];

      const totalKirimHasil = sumKey('total_lokea1') + sumKey('total_linkingkea1') + sumKey('total_sontekkea1') + sumKey('total_lampukea1') + sumKey('total_sulamkea1') + sumKey('total_sulambelumsoomkea1') + sumKey('total_samplekea1');
      const totalKirimAkum = sumKey('akum_lokea1') + sumKey('akum_linkingkea1') + sumKey('akum_sontekkea1') + sumKey('akum_lampukea1') + sumKey('akum_sulamkea1') + sumKey('akum_sulambelumsoomkea1') + sumKey('akum_samplekea1');

      const startKirimRow = currentRow + 1;

      kirimItems.forEach((kItem) => {
        currentRow++;
        writeSummaryRow("Kirim", totalKirimHasil, totalKirimAkum, (totalKirimAkum - totalAkumLinkingP), kItem.label, kItem.h, kItem.a);
      });

      const endKirimRow = currentRow;
      mergeCells(startKirimRow, 2, endKirimRow, 2); 
      mergeCells(startKirimRow, 3, endKirimRow, 3); 
      mergeCells(startKirimRow, 4, endKirimRow, 4); 
      mergeCells(startKirimRow, 8, endKirimRow, 8); 

      // Penggabungan Vertikal Akhir untuk Order Qty & Terima
      mergeCells(startSummaryDataRow, 0, endKirimRow, 0); 
      mergeCells(startSummaryDataRow, 1, endKirimRow, 1); 

      ws[XLSXStyle.utils.encode_cell({ r: startSummaryDataRow, c: 0 })].s.font = { name: 'Arial', size: 10, bold: true, color: { rgb: "002060" } };
      ws[XLSXStyle.utils.encode_cell({ r: startSummaryDataRow, c: 1 })].s.font = { name: 'Arial', size: 10, bold: true, color: { rgb: "385723" } }; 
    };

    // =========================================================================
    // EKSEKUSI PENYUSUNAN URUTAN DI EXCEL
    // =========================================================================
    renderGedungGroup(dataGedungA, "GEDUNG A");
    currentRow += 6; 
    renderGedungGroup(dataGedungB, "GEDUNG B");

    // =========================================================================
    // PENATAAN UKURAN LEBAR KOLOM
    // =========================================================================
    const colWidths = [
      { wch: 19 }, // 0: Order Qty / STYLE
      { wch: 19 }, // 1: Terima / GEDUNG
      { wch: 22 }, // 2: Dept / PROCESS
      { wch: 14 }, // 3: Hasil / TODAY
      { wch: 15 }, // 4: Akum
      { wch: 38 }, // 5: Keterangan / KURANG
      { wch: 14 }, // 6: Card col 1
      { wch: 14 }, // 7: Card col 2
      { wch: 15 }, // 8: Sisa
      { wch: 5  }, // 9: Jeda
      { wch: 12 }, // 10
      { wch: 22 }, // 11: PROCESS (card 2)
      { wch: 14 }, // 12: TODAY (card 2)
      { wch: 15 }, // 13: AKUM (card 2)
      { wch: 15 }, // 14: KURANG (card 2)
      { wch: 5 },  // 15: Jeda
      { wch: 12 }, // 16
      { wch: 22 }, // 17: PROCESS (card 3)
      { wch: 14 }, // 18: TODAY (card 3)
      { wch: 15 }, // 19: AKUM (card 3)
      { wch: 15 }  // 20: KURANG (card 3)
    ];
    ws['!cols'] = colWidths;

    ws['!ref'] = XLSXStyle.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: currentRow + 2, c: 20 }
    });

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Laporan Finishing");
    XLSXStyle.writeFile(wb, `Laporan_Finishing_Landscape_${filterDate.value || 'Semua'}.xlsx`);

  } catch (error) {
    console.error("Gagal mengexport excel:", error);
    alert("Terjadi kesalahan saat mengexport excel.");
  }
};

const exportToExcel = (data, title, gedungTarget) => {
  if (!data || data.length === 0) {
    alert("Tidak ada data untuk diexport!");
    return null;
  }

  // Filter Data
  const dataHanyaGedung = data.filter(item => {
    const namaGedung = String(item.gedung || '').trim().toUpperCase();
    return namaGedung !== '' && namaGedung !== '-' && namaGedung !== 'TANPA GEDUNG';
  });

  const groupData = dataHanyaGedung.filter(item => 
    String(item.gedung).toUpperCase().includes(String(gedungTarget).toUpperCase())
  );

  if (groupData.length === 0) return null;

  const ws = XLSXStyle.utils.aoa_to_sheet([]);
  let currentRow = 0;

  // Header Judul
  const formattedPeriode = filterDate.value ? formatDate(filterDate.value) : 'Semua Periode';
  ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 0 })] = {
    v: `${title} PERIODE: ${formattedPeriode}`.toUpperCase(),
    t: 's',
    s: { font: { name: 'Arial', size: 14, bold: true }, alignment: { horizontal: 'left' } }
  };
  
  currentRow += 3;
  ws["!merges"] = [];

  const styleCell = (r, c, customStyle) => {
    const cellRef = XLSXStyle.utils.encode_cell({ r, c });
    if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
    const baseBorder = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    };
    ws[cellRef].s = { border: baseBorder, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, font: { name: 'Arial', size: 9 }, ...customStyle };
  };

  const mergeCells = (fromRow, fromCol, toRow, toCol) => {
    ws["!merges"].push({ s: { r: fromRow, c: fromCol }, e: { r: toRow, c: toCol } });
  };

  const colOffsets = [0, 8, 16]; // Diperlebar karena kolom bertambah
  let baseRow = currentRow;
  let maxRowInGroup = baseRow;

  groupData.forEach((item, index) => {
    const position = index % 3;
    const startCol = colOffsets[position];
    if (index > 0 && position === 0) baseRow = maxRowInGroup + 2;
    let localRow = baseRow;

    const headerInfo = [
        ["Order Qty", item.order_qty || 0],
        ["Akum Terima", item.akum_terima || 0]
    ];

    // 1. HEADER INFO (Header Metadata di atas)
    const topHeaderRow = localRow;
const secondHeaderRow = localRow + 1;

// Header baris pertama
XLSXStyle.utils.sheet_add_aoa(ws, [[
    "",                 // STYLE
    "",                 // GEDUNG
    "Order Qty",
    item.order_qty || 0,
    "Akum Terima",
    item.akum_terima || 0
]], {
    origin: XLSXStyle.utils.encode_cell({
        r: topHeaderRow,
        c: startCol
    })
});

// Header baris kedua
XLSXStyle.utils.sheet_add_aoa(ws, [[
    "STYLE",
    "GEDUNG",
    "PROCESS",
    "TODAY",
    "AKUM",
    "KURANG"
]], {
    origin: XLSXStyle.utils.encode_cell({
        r: secondHeaderRow,
        c: startCol
    })
});

// style ulang
for (let c = startCol; c <= startCol + 5; c++) {

    // Header atas
    styleCell(topHeaderRow, c, {
        font: { bold: true },
        fill: c >= startCol + 2
            ? { fgColor: { rgb: "D9EAD3" } }
            : undefined,
        alignment: {
            horizontal: "center",
            vertical: "center"
        }
    });

    // Header bawah
    styleCell(secondHeaderRow, c, {
        font: {
            bold: true,
            color: { rgb: "FFFFFF" }
        },
        fill: {
            fgColor: { rgb: "808080" }
        },
        alignment: {
            horizontal: "center",
            vertical: "center"
        }
    });
}

    localRow += 2;
    const startDataRow = localRow;
    const processes = [
      ["Linking Primary", item.total_linkingP, item.akum_linkingP, item.sisa_linking],
      ["LO", item.total_lo, item.akum_lo, item.sisa_lo],
      ["STEAM", item.total_steam, item.akum_steam, item.sisa_steam],
      ["CBS", Number(item.total_cbs) + Number(item.total_cbshgs), Number(item.akum_cbs) + Number(item.akum_cbshgs), item.sisa_cbs],
      ["SEWING", item.total_sewing, item.akum_sewing, item.sisa_sewing],
      ["SONTEX", item.total_stik, item.akum_stik, item.sisa_sontex],
      ["SONTEX SOOM", item.total_sontexsoom, item.akum_sontexsoom, item.sisa_sontex],
      ["SONTEX KOMPLIT", item.total_stkb, item.akum_stkb, item.sisa_sontex],
      ["QC BS", item.total_qclampubs, item.akum_qclampubs, item.sisa_lampu],
      ["QC LB", item.total_qclampulb, item.akum_qclampulb, item.sisa_lampu],
      ["SOOM", item.total_soom, item.akum_soom, item.sisa_soom],
      ["SULAM", item.total_sulam, item.akum_sulam, item.sisa_sulam],
      ["KIRIM LINKING A1", item.total_linkingkea1, item.akum_linkingkea1, item.sisa_kirim],
      ["KIRIM LO A1", item.total_lokea1, item.akum_lokea1, item.sisa_kirim],
      ["KIRIM SONTEX A1", item.total_sontekkea1, item.akum_sontekkea1, item.sisa_kirim],
      ["KIRIM LAMPU A1", item.total_lampukea1, item.akum_lampukea1, item.sisa_kirim],
      ["KIRIM SULAM A1", item.total_sulamkea1, item.akum_sulamkea1, item.sisa_kirim],
      ["KIRIM SULAM BELUM SOOM A1", item.total_sulambelumsoomkea1, item.akum_sulambelumsoomkea1, item.sisa_kirim],
      ["KIRIM SAMPLE A1", item.total_samplekea1, item.akum_samplekea1, item.sisa_kirim],
    ];

    processes.forEach((p) => {
      ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol })] = { v: item.xMark || "-", t: "s" }; // STYLE
      ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 1 })] = { v: item.gedung || "-", t: "s" }; // GEDUNG
      ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 2 })] = { v: p[0], t: "s" };
      ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 3 })] = { v: p[1] || 0, t: "n" };
      ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 4 })] = { v: p[2] || 0, t: "n" };
      ws[XLSXStyle.utils.encode_cell({ r: localRow, c: startCol + 5 })] = { v: p[3] || 0, t: "n" };
      
      for(let i=0; i<=5; i++) styleCell(localRow, startCol + i, { alignment: { horizontal: (i === 2 ? 'left' : 'right') } });
      localRow++;
    });

    mergeCells(startDataRow, startCol, localRow - 1, startCol); // Merge STYLE
    mergeCells(startDataRow, startCol + 1, localRow - 1, startCol + 1); // Merge GEDUNG
    if (localRow > maxRowInGroup) maxRowInGroup = localRow;
  });

  currentRow = maxRowInGroup;

  // -----------------------------------------------------------------------
  // LAJUR 2: TABEL SUMMARY PER GEDUNG
  // -----------------------------------------------------------------------
  currentRow += 3; 

  const xMarksInGedung = groupData.map(item => String(item.xMark).trim());

  const dataTurunGedung = (rawPelengkapTurun.value || []).filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
  const dataTurunAkumGedung = (rawPelengkapTurunAkum.value || []).filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
  const dataTurunSoomGedung = (rawPelengkapTurunSoom.value || []).filter(t => xMarksInGedung.includes(String(t.xMark).trim()));
  const dataTurunSoomAkumGedung = (rawPelengkapTurunSoomAkum.value || rawPelengkapTurunSoomAkum || []).filter(t => xMarksInGedung.includes(String(t.xMark).trim()));

  const totalTurunLO   = dataTurunGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalTurunCBS  = dataTurunGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);
  const totalTurunSoom = dataTurunSoomGedung.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0);

  const totalKeteranganAkumLO   = dataTurunAkumGedung.filter(t => t.dept === 'LO').reduce((acc, curr) => acc + (Number(curr.total_cbsandlo) || 0), 0);
  const totalKeteranganAkumCBS  = dataTurunAkumGedung.filter(t => t.dept === 'CBS').reduce((acc, curr) => acc + (Number(curr.total_cbsandlo) || 0), 0);
  const totalKeteranganAkumSoom = dataTurunSoomAkumGedung.reduce((acc, curr) => acc + (Number(curr.total_untuksoom) || 0), 0);

  const sumKey = (key) => groupData.reduce((acc, item) => acc + Number(item[key] || 0), 0);

  // Baris Header Kelompok Gedung Utama
  mergeCells(currentRow, 2, currentRow, 8);
  ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 2 })] = {
    v: `GEDUNG ${gedungTarget}`.toUpperCase(),
    t: 's',
    s: { font: { name: 'Arial', size: 10, bold: true }, alignment: { horizontal: 'center' } }
  };
  currentRow += 1;

  // Judul Kolom Tabel Summary
  const summaryHeaders = ["Order Qty", "Terima", "Dept", "Hasil", "Akum", "Keterangan", "", "", "Sisa"];
  XLSXStyle.utils.sheet_add_aoa(ws, [summaryHeaders], { origin: XLSXStyle.utils.encode_cell({ r: currentRow, c: 0 }) });
  mergeCells(currentRow, 5, currentRow, 7); 

  for (let c = 0; c <= 8; c++) {
    styleCell(currentRow, c, { font: { bold: true, size: 9 }, alignment: { horizontal: 'center' } });
  }
  currentRow += 1;

  const startSummaryDataRow = currentRow;

  const totalOrderQty = sumKey('order_qty');
  const totalAkumTerima = sumKey('akum_terima');

  // Fungsi Pembantu Render Tiap Baris Summary
  const writeSummaryRow = (deptName, hasil, akum, sisa, ketText = "", ketHasil = null, ketAkum = null) => {
    ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 0 })] = { v: totalOrderQty, t: "n" };
    ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 1 })] = { v: totalAkumTerima, t: "n" };
    ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 2 })] = { v: deptName, t: "s" };
    ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 3 })] = { v: hasil, t: "n" };
    ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 4 })] = { v: akum, t: "n" };
    
    ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 5 })] = { v: ketText, t: "s" };
    if (ketHasil !== null) ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 6 })] = { v: ketHasil, t: "n" };
    if (ketAkum !== null)  ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 7 })] = { v: ketAkum, t: "n" };
    
    if (sisa !== null) ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 8 })] = { v: sisa, t: "n" };

    for (let c = 0; c <= 8; c++) {
      let customAlign = { horizontal: 'right', vertical: 'middle' };
      if (c === 2 || c === 5) customAlign.horizontal = 'left';
      
      let fontStyle = { name: 'Arial', size: 9 };
      if (c === 0 || c === 1) fontStyle.bold = true;
      if (c === 3 || c === 6) fontStyle.color = { rgb: "002060" }; 
      if (c === 8) fontStyle.color = { rgb: "C00000" };           

      styleCell(currentRow, c, { alignment: customAlign, font: fontStyle });
    }
  };

  // 1. Linking
  const totalAkumLinkingP = sumKey('akum_linkingP');
  writeSummaryRow("Linking", sumKey('total_linkingP'), totalAkumLinkingP, (totalAkumLinkingP - totalAkumTerima));
  mergeCells(currentRow, 5, currentRow, 7); 

  // 2. LO
  currentRow++;
  writeSummaryRow("LO", sumKey('total_lo'), sumKey('akum_lo'), sumKey('sisa_lo'), "untuk LO", totalTurunLO, totalKeteranganAkumLO);

  // 3. Steam
  currentRow++;
  writeSummaryRow("Steam", sumKey('total_steam'), sumKey('akum_steam'), sumKey('sisa_steam'));
  mergeCells(currentRow, 5, currentRow, 7);

  // 4. CBS
  currentRow++;
  const totalHasilCBS = sumKey('total_cbs') + sumKey('total_cbshgs');
  const totalAkumCBS = sumKey('akum_cbs') + sumKey('akum_cbshgs');
  writeSummaryRow("CBS", totalHasilCBS, totalAkumCBS, sumKey('sisa_cbs'), "untuk CBS", totalTurunCBS, totalKeteranganAkumCBS);

  // 5. Sewing
  currentRow++;
  writeSummaryRow("Sewing", sumKey('total_sewing'), sumKey('akum_sewing'), sumKey('sisa_sewing'));
  mergeCells(currentRow, 5, currentRow, 7);

  // 6. Sontex
  currentRow++;
  const totalHasilSontex = sumKey('total_stik') + sumKey('total_sontexsoom');
  const totalAkumSontex = sumKey('akum_stik') + sumKey('akum_sontexsoom');
  writeSummaryRow("Sontex", totalHasilSontex, totalAkumSontex, sumKey('sisa_sontex'));
  mergeCells(currentRow, 5, currentRow, 7);

  // 7. STKB komplit
  currentRow++;
  writeSummaryRow("STKB komplit", sumKey('total_stkb'), sumKey('akum_stkb'), null); 
  mergeCells(currentRow, 5, currentRow, 7);

  // 8. Soom
  currentRow++;
  writeSummaryRow("Soom", sumKey('total_soom'), sumKey('akum_soom'), sumKey('sisa_soom'), "untuk soom", totalTurunSoom, totalKeteranganAkumSoom);

  // 9. QC Lampu
  currentRow++;
  writeSummaryRow("Qc Lampu", sumKey('total_qclampu'), sumKey('akum_qclampu'), sumKey('sisa_lampu'), "QC BS", sumKey('total_qclampubs'), sumKey('akum_qclampubs'));
  
  currentRow++; 
  writeSummaryRow("Qc Lampu", sumKey('total_qclampu'), sumKey('akum_qclampu'), sumKey('sisa_lampu'), "QC LB", sumKey('total_qclampulb'), sumKey('akum_qclampulb'));
  
  mergeCells(currentRow - 1, 2, currentRow, 2); 
  mergeCells(currentRow - 1, 3, currentRow, 3); 
  mergeCells(currentRow - 1, 4, currentRow, 4); 
  mergeCells(currentRow - 1, 8, currentRow, 8); 

  // 10. Sulam
  currentRow++;
  writeSummaryRow("Sulam", sumKey('total_sulam'), sumKey('akum_sulam'), sumKey('sisa_sulam'));
  mergeCells(currentRow, 5, currentRow, 7);

  // 11. Kirim Breakdown Dinamis
  const kirimItems = [
  { label: "Lain-lain LO kirim A1", h: sumKey('total_lokea1'), a: sumKey('akum_lokea1') },
  { label: "Lain-lain Sontek kirim A1", h: sumKey('total_sontekkea1'), a: sumKey('akum_sontekkea1') },
  { label: "Lain-lain Linking kirim A1", h: sumKey('total_linkingkea1'), a: sumKey('akum_linkingkea1') },
  { label: "Lain-lain Lampu kirim A1", h: sumKey('total_lampukea1'), a: sumKey('akum_lampukea1') },
  { label: "Lain-lain Sulam kirim A1", h: sumKey('total_sulamkea1'), a: sumKey('akum_sulamkea1') },
  { label: "Lain-lain Sulam Blm Soom kirim A1", h: sumKey('total_sulambelumsoomkea1'), a: sumKey('akum_sulambelumsoomkea1') },
  { label: "Lain-lain Sample kirim A1", h: sumKey('total_samplekea1'), a: sumKey('akum_samplekea1') }
];

const totalKirimHasil = sumKey('total_lokea1') + sumKey('total_linkingkea1') + sumKey('total_sontekkea1') + sumKey('total_lampukea1') + sumKey('total_sulamkea1') + sumKey('total_sulambelumsoomkea1') + sumKey('total_samplekea1');
const totalKirimAkum = sumKey('akum_lokea1') + sumKey('akum_linkingkea1') + sumKey('akum_sontekkea1') + sumKey('akum_lampukea1') + sumKey('akum_sulamkea1') + sumKey('akum_sulambelumsoomkea1') + sumKey('akum_samplekea1');

const startKirimRow = currentRow + 1;

kirimItems.forEach((kItem) => {
  currentRow++;
  // PERBAIKAN: Mengubah totalAccumLinkingP menjadi totalAkumLinkingP
  writeSummaryRow("Kirim", totalKirimHasil, totalKirimAkum, (totalKirimAkum - totalAkumLinkingP), kItem.label, kItem.h, kItem.a);
});

  const endKirimRow = currentRow;
  mergeCells(startKirimRow, 2, endKirimRow, 2); 
  mergeCells(startKirimRow, 3, endKirimRow, 3); 
  mergeCells(startKirimRow, 4, endKirimRow, 4); 
  mergeCells(startKirimRow, 8, endKirimRow, 8); 

  // Penggabungan Vertikal Akhir (Order Qty & Terima)
  mergeCells(startSummaryDataRow, 0, endKirimRow, 0); 
  mergeCells(startSummaryDataRow, 1, endKirimRow, 1); 
  

  ws[XLSXStyle.utils.encode_cell({ r: startSummaryDataRow, c: 0 })].s.font = { name: 'Arial', size: 10, bold: true, color: { rgb: "002060" } };
  ws[XLSXStyle.utils.encode_cell({ r: startSummaryDataRow, c: 1 })].s.font = { name: 'Arial', size: 10, bold: true, color: { rgb: "385723" } }; 

  // Dimensi Lebar Kolom (Sama persis agar tidak #### atau terpotong)
 const colWidths = [
  // Tabel kiri
  { wch: 12 }, //0
  { wch: 12 }, //1
  { wch: 20 }, //2
  { wch: 10 }, //3
  { wch: 10 }, //4
  { wch: 10 }, //5

  { wch: 4 },  //6 kosong
  { wch: 4 },  //7 kosong

  // Tengah
  { wch: 12 }, //8
  { wch: 12 }, //9
  { wch: 20 }, //10
  { wch: 10 }, //11
  { wch: 10 }, //12
  { wch: 10 }, //13

  { wch: 4 },  //14 kosong
  { wch: 4 },  //15 kosong

  // Kanan
  { wch: 12 }, //16
  { wch: 12 }, //17
  { wch: 20 }, //18
  { wch: 10 }, //19
  { wch: 10 }, //20
  { wch: 10 }, //21
];
  ws['!cols'] = colWidths;

  ws['!ref'] = XLSXStyle.utils.encode_range({
  s: { r: 0, c: 0 },
  e: { r: currentRow + 2, c: 21 }
});

  const wb = XLSXStyle.utils.book_new();
  XLSXStyle.utils.book_append_sheet(wb, ws, `Laporan Gedung ${gedungTarget}`);
  
  return XLSXStyle.write(wb, {
    bookType: "xlsx",
    type: "array"
  });
};

const sendEmail = async () => {
  if (!filteredData.value || filteredData.value.length === 0) {
    alert("Tidak ada data untuk dikirim!");
    return;
  }

  const confirmSend = confirm("Kirim email?");
  if (!confirmSend) return;

  isSendingEmail.value = true;

  try {
    const formattedPeriode = filterDate.value
      ? formatDate(filterDate.value)
      : "Semua Periode";

    const formData = new FormData();

    // =========================================================================
    // GENERATE FILE: Langsung lempar seluruh filteredData.value
    // Logika pemisahan Gedung A & B sudah ditangani otomatis di dalam exportToExcel
    // =========================================================================
    const fileA = exportToExcel(filteredData.value, "LAPORAN FINISHING GEDUNG A", "A");
    const fileB = exportToExcel(filteredData.value, "LAPORAN FINISHING GEDUNG B", "B");

    // Validasi tambahan: Pastikan minimal ada satu file yang sukses dibuat
    if (!fileA && !fileB) {
      alert("Gagal kirim email: Data Gedung A maupun Gedung B tidak ditemukan.");
      isSendingEmail.value = false;
      return;
    }

    if (fileA) {
      formData.append(
        "files",
        new Blob([fileA], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }),
        `Report Finishing Gedung_A_${filterDate.value}.xlsx`
      );
    }

    if (fileB) {
      formData.append(
        "files",
        new Blob([fileB], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }),
        `Report Finishing Gedung_B_${filterDate.value}.xlsx`
      );
    }

    formData.append("periode", formattedPeriode);

    // Kirim request ke backend
    await axios.post(
      `${API_BASE_URL}/emailfinishing01/send-summary-email`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    alert("Email berhasil dikirim!");
  } catch (err) {
    console.error("Send Email Error:", err);
    if (err.response && err.response.data) {
      console.error("Detail Error dari Backend:", err.response.data);
    }
    alert("Gagal kirim email");
  } finally {
    isSendingEmail.value = false;
  }
};

// const exportToExcel = (data, title) => {
//   if (!data || data.length === 0) {
//     alert("Tidak ada data untuk diexport!");
//     return;
//   }

//   const ws = XLSXStyle.utils.aoa_to_sheet([]);
//   let currentRow = 0; // Menggunakan index baris dinamis (0-based)

//   const formattedPeriode = filterDate.value
//     ? formatDate(filterDate.value)
//     : "Semua Periode";

//   // ==========================================
//   // 1. TITLE
//   // ==========================================
//   ws[XLSXStyle.utils.encode_cell({ r: currentRow, c: 0 })] = {
//     v: `${title} - ${formattedPeriode}`.toUpperCase(),
//     t: 's',
//     s: {
//       font: { name: 'Arial', size: 14, bold: true, color: { rgb: "000000" } },
//       alignment: { horizontal: 'left', vertical: 'center' }
//     }
//   };

//   // Beri space setelah judul, header dimulai di baris index 3 (Baris 4 Excel)
//   currentRow += 3;

//   ws["!merges"] = [];

//   // Helper Border Data
//   const addBorder = (cellRef) => {
//     if (!ws[cellRef]) return;
//     ws[cellRef].s = {
//       border: {
//         top: { style: "thin", color: { rgb: "000000" } },
//         bottom: { style: "thin", color: { rgb: "000000" } },
//         left: { style: "thin", color: { rgb: "000000" } },
//         right: { style: "thin", color: { rgb: "000000" } }
//       }
//     };
//   };

//   // Helper Header Style
//   const setHeaderStyle = (r, startCol) => {
//     for (let c = startCol; c < startCol + 10; c++) {
//       const cellRef = XLSXStyle.utils.encode_cell({ r, c });
//       if (!ws[cellRef]) continue;
//       ws[cellRef].s = {
//         font: { bold: true, color: { rgb: "FFFFFF" } },
//         fill: { fgColor: { rgb: "333333" } },
//         alignment: { horizontal: "center", vertical: "center" },
//         border: {
//           top: { style: "thin", color: { rgb: "000000" } },
//           bottom: { style: "thin", color: { rgb: "000000" } },
//           left: { style: "thin", color: { rgb: "000000" } },
//           right: { style: "thin", color: { rgb: "000000" } }
//         }
//       };
//     }
//   };

//   // Helper Merge Vertikal
//   const mergeVertical = (col, fromRow, toRow) => {
//     ws["!merges"].push({
//       s: { r: fromRow, c: col },
//       e: { r: toRow, c: col }
//     });
//   };

//   const headers = [
//     "DEL", "PO", "STYLE", "ORDER QTY", "AKUM TERIMA", 
//     "GEDUNG", "PROCESS", "TODAY", "AKUM", "KURANG"
//   ];

//   // ==========================================
//   // LOGIKA UTAMA: PENYUSUNAN KIRI & KANAN
//   // ==========================================
//   // Kolom A (0) untuk lajur Kiri, Kolom L (11) untuk lajur Kanan
//   const colOffsets = [0, 11]; 
//   let baseRow = currentRow;
//   let maxRowInGroup = baseRow;

//   data.forEach((item, index) => {
//     // 0 = Kiri, 1 = Kanan
//     const position = index % 2; 
//     const startCol = colOffsets[position];

//     // Jika kembali ke lajur Kiri dan bukan data pertama,
//     // turunkan baseRow ke bawah data terdalam sebelumnya + berikan jeda 2 baris kosong
//     if (index > 0 && position === 0) {
//       baseRow = maxRowInGroup + 2;
//     }

//     let localRow = baseRow;

//     // Tambah Header di lajur masing-masing
//     XLSXStyle.utils.sheet_add_aoa(ws, [headers], { origin: XLSXStyle.utils.encode_cell({ r: localRow, c: startCol }) });
//     setHeaderStyle(localRow, startCol);
//     localRow++;

//     const startDataRow = localRow;

//     const processes = [
//       ["Linking Primary", item.total_linkingP, item.akum_linkingP, item.sisa_linking],
//       ["LO", item.total_lo, item.akum_lo, item.sisa_lo],
//       ["STEAM", item.total_steam, item.akum_steam, item.sisa_steam],
//       ["CBS", Number(item.total_cbs) + Number(item.total_cbshgs), Number(item.akum_cbs) + Number(item.akum_cbshgs), item.sisa_cbs],
//       ["SEWING", item.total_sewing, item.akum_sewing, item.sisa_sewing],
//       ["SONTEX", item.total_stik, item.akum_stik, item.sisa_sontex],
//       ["SONTEX SOOM", item.total_sontexsoom, item.akum_sontexsoom, item.sisa_sontex],
//       ["SONTEX KOMPLIT", item.total_stkb, item.akum_stkb, item.sisa_sontex],
//       ["QC BS", item.total_qclampubs, item.akum_qclampubs, item.sisa_lampu],
//       ["QC LB", item.total_qclampulb, item.akum_qclampulb, item.sisa_lampu],
//       ["SOOM", item.total_soom, item.akum_soom, item.sisa_soom],
//       ["SULAM", item.total_sulam, item.akum_sulam, item.sisa_sulam],
//       ["KIRIM LINKING A1", item.total_linkingkea1, item.akum_linkingkea1, item.sisa_kirim],
//       ["KIRIM LO A1", item.total_lokea1, item.akum_lokea1, item.sisa_kirim],
//       ["KIRIM SONTEX A1", item.total_sontekkea1, item.akum_sontekkea1, item.sisa_kirim],
//       ["KIRIM LAMPU A1", item.total_lampukea1, item.akum_lampukea1, item.sisa_kirim],
//       ["KIRIM SULAM A1", item.total_sulamkea1, item.akum_sulamkea1, item.sisa_kirim],
//       ["KIRIM SULAM BELUM SOOM A1", item.total_sulambelumsoomkea1, item.akum_sulambelumsoomkea1, item.sisa_kirim],
//       ["KIRIM SAMPLE A1", item.total_samplekea1, item.akum_samplekea1, item.sisa_kirim],
//     ];

//     const endDataRow = startDataRow + processes.length - 1;

//     processes.forEach((p, i) => {
//       const rowData = [
//         i === 0 ? formatDate(item.xminDate) : "",
//         i === 0 ? item.xTimes : "",
//         i === 0 ? item.xMark : "",
//         i === 0 ? item.order_qty : "",
//         i === 0 ? item.akum_terima : "",
//         i === 0 ? item.gedung : "",
//         p[0], p[1], p[2], p[3]
//       ];

//       XLSXStyle.utils.sheet_add_aoa(ws, [rowData], { origin: XLSXStyle.utils.encode_cell({ r: localRow, c: startCol }) });

//       // Berikan style border hitam tipis sesuai template email asal Anda
//       for (let c = startCol; c < startCol + 10; c++) {
//         addBorder(XLSXStyle.utils.encode_cell({ r: localRow, c }));
//       }
//       localRow++;
//     });

//     // ==========================================
//     // MERGE KOLOM (BERDASARKAN STRUKTUR BARU)
//     // ==========================================
//     // Merge Kolom Master (DEL sampai GEDUNG)
//     for (let c = startCol; c <= startCol + 5; c++) {
//       mergeVertical(c, startDataRow, endDataRow);
//     }

//     // Merge SONTEX (3 baris) -> Index kolom Kurang ada di posisi startCol + 9
//     mergeVertical(startCol + 9, startDataRow + 5, startDataRow + 7);

//     // Merge QC (2 baris)
//     mergeVertical(startCol + 9, startDataRow + 8, startDataRow + 9);

//     // Merge KIRIM A1 (5 baris)
//     mergeVertical(startCol + 9, startDataRow + 12, startDataRow + 18);

//     // Catat baris terbawah untuk koordinat perulangan berikutnya
//     if (localRow > maxRowInGroup) {
//       maxRowInGroup = localRow;
//     }
//   });

//   // Sinkronisasi batas akhir range sheet
//   const maxColsGenerated = 23; 
//   ws['!ref'] = XLSXStyle.utils.encode_range({
//     s: { r: 0, c: 0 },
//     e: { r: maxRowInGroup + 2, c: maxColsGenerated }
//   });

//   const wb = XLSXStyle.utils.book_new();
//   XLSXStyle.utils.book_append_sheet(wb, ws, "Laporan");

//   return XLSXStyle.write(wb, {
//     bookType: "xlsx",
//     type: "array"
//   });
// };

// const exportToExcel = (data, title) => {
//   if (!data || data.length === 0) {
//     alert("Tidak ada data untuk diexport!");
//     return;
//   }

//   const ws = XLSXStyle.utils.aoa_to_sheet([]);

//   const formattedPeriode = filterDate.value
//     ? formatDate(filterDate.value)
//     : "Semua Periode";

//   // =========================
//   // TITLE
//   // =========================
//   XLSXStyle.utils.sheet_add_aoa(ws, [
//     [
//       `${title} - ${formattedPeriode}`.toUpperCase()
//     ]
//   ], { origin: "A1" });

//   // =========================
//   // HEADER
//   // =========================
//   XLSXStyle.utils.sheet_add_aoa(ws, [[
//     "DEL",
//     "PO",
//     "STYLE",
//     "ORDER QTY",
//     "AKUM TERIMA",
//     "GEDUNG",
//     "PROCESS",
//     "TODAY",
//     "AKUM",
//     "KURANG"
//   ]], { origin: "A3" });

//   let row = 4;
//   ws["!merges"] = ws["!merges"] || [];

//   const addBorder = (cell) => {
//     if (!ws[cell]) return;
//     ws[cell].s = {
//       border: {
//         top: { style: "thin", color: { rgb: "000000" } },
//         bottom: { style: "thin", color: { rgb: "000000" } },
//         left: { style: "thin", color: { rgb: "000000" } },
//         right: { style: "thin", color: { rgb: "000000" } }
//       }
//     };
//   };

//   const setRowStyle = (r, cols = 10) => {
//     for (let c = 0; c < cols; c++) {
//       const cell = XLSXStyle.utils.encode_cell({ r, c });
//       addBorder(cell);
//     }
//   };

//   const pushRow = (arr, r) => {
//     XLSXStyle.utils.sheet_add_aoa(ws, [arr], { origin: `A${r}` });
//     setRowStyle(r - 1);
//   };

//   const mergeVertical = (col, from, to) => {
//     ws["!merges"].push({
//       s: { r: from - 1, c: col },
//       e: { r: to - 1, c: col }
//     });
//   };

//   data.forEach(item => {

//     const startRow = row;

//     const processes = [
//       ["Linking Primary", item.total_linkingP, item.akum_linkingP, item.sisa_linking],

//       ["LO", item.total_lo, item.akum_lo, item.sisa_lo],

//       ["STEAM", item.total_steam, item.akum_steam, item.sisa_steam],

//       ["CBS",
//         Number(item.total_cbs) + Number(item.total_cbshgs),
//         Number(item.akum_cbs) + Number(item.akum_cbshgs),
//         item.sisa_cbs
//       ],

//       ["SEWING", item.total_sewing, item.akum_sewing, item.sisa_sewing],

//       // SONTEXT GROUP (3 baris)
//       ["SONTEX", item.total_stik, item.akum_stik, item.sisa_sontex],
//       ["SONTEX SOOM", item.total_sontexsoom, item.akum_sontexsoom, item.sisa_sontex],
//       ["SONTEX KOMPLIT", item.total_stkb, item.akum_stkb, item.sisa_sontex],

//       // QC GROUP (2 baris)
//       ["QC BS", item.total_qclampubs, item.akum_qclampubs, item.sisa_lampu],
//       ["QC LB", item.total_qclampulb, item.akum_qclampulb, item.sisa_lampu],

//       // SOOM
//       ["SOOM", item.total_soom, item.akum_soom, item.sisa_soom],

//       // SULAM
//       ["SULAM", item.total_sulam, item.akum_sulam, item.sisa_sulam],

//       // KIRIM A1 GROUP (5 baris)
//       ["KIRIM LINKING A1", item.total_linkingkea1, item.akum_linkingkea1, item.sisa_kirim],
//       ["KIRIM LO A1", item.total_lokea1, item.akum_lokea1, item.sisa_kirim],
//       ["KIRIM SONTEX A1", item.total_sontekkea1, item.akum_sontekkea1, item.sisa_kirim],
//       ["KIRIM LAMPU A1", item.total_lampukea1, item.akum_lampukea1, item.sisa_kirim],
//       ["KIRIM SULAM A1", item.total_sulamkea1, item.akum_sulamkea1, item.sisa_kirim],
//     ];

//     const endRow = startRow + processes.length - 1;

//     processes.forEach((p, i) => {
//       pushRow([
//         i === 0 ? formatDate(item.xminDate) : "",
//         i === 0 ? item.xTimes : "",
//         i === 0 ? item.xMark : "",
//         i === 0 ? item.order_qty : "",
//         i === 0 ? item.akum_terima : "",
//         i === 0 ? item.gedung : "",
//         p[0],
//         p[1],
//         p[2],
//         p[3]
//       ], row);

//       row++;
//     });

//     // =========================
//     // MERGE KOLOM MASTER (DEL - GEDUNG)
//     // =========================
//     for (let c = 0; c <= 5; c++) {
//       mergeVertical(c, startRow, endRow);
//     }

//     // =========================
//     // MERGE KOLOM KURANG (GROUPING)
//     // =========================

//     // SONTEXT (3 baris)
//     mergeVertical(9, startRow + 5, startRow + 7);

//     // QC (2 baris)
//     mergeVertical(9, startRow + 8, startRow + 9);

//     // KIRIM A1 (5 baris)
//     mergeVertical(9, startRow + 12, startRow + 16);
//   });

//   // =========================
//   // FINAL STYLE (HEADER BOLD)
//   // =========================
//   const headerRow = 2;
//   for (let c = 0; c < 10; c++) {
//     const cell = XLSXStyle.utils.encode_cell({ r: headerRow, c });
//     if (!ws[cell]) continue;
//     ws[cell].s = {
//       font: { bold: true, color: { rgb: "FFFFFF" } },
//       fill: { fgColor: { rgb: "333333" } },
//       alignment: { horizontal: "center", vertical: "center" },
//       border: {
//         top: { style: "thin", color: { rgb: "000000" } },
//         bottom: { style: "thin", color: { rgb: "000000" } },
//         left: { style: "thin", color: { rgb: "000000" } },
//         right: { style: "thin", color: { rgb: "000000" } }
//       }
//     };
//   }

//   const wb = XLSXStyle.utils.book_new();
//   XLSXStyle.utils.book_append_sheet(wb, ws, "Laporan");

//   return XLSXStyle.write(wb, {
//     bookType: "xlsx",
//     type: "array"
//   });
// };

// const sendEmail = async () => {
//   if (!filteredData.value || filteredData.value.length === 0) {
//     alert("Tidak ada data untuk dikirim!");
//     return;
//   }

//   const confirmSend = confirm("Kirim email?");
//   if (!confirmSend) return;

//   isSendingEmail.value = true;

//   try {
//     const formattedPeriode = filterDate.value
//       ? formatDate(filterDate.value)
//       : "Semua Periode";

//     // ===== GROUPING GEDUNG (lebih aman dari '-') =====
//     const gedungA = filteredData.value.filter(
//       (item) => String(item.gedung || "").trim().toUpperCase() === "A"
//     );

//     const gedungB = filteredData.value.filter(
//       (item) => String(item.gedung || "").trim().toUpperCase() === "B"
//     );

//     // const tanpaGedung = filteredData.value.filter(
//     //   (item) => {
//     //     const g = String(item.gedung || "").trim().toUpperCase();
//     //     return g === "-" || g === "" || g === "NULL" || !g;
//     //   }
//     // );

//     const formData = new FormData();

//     // ===== GENERATE FILE =====
//     const fileA = exportToExcel(gedungA, "LAPORAN FINISHING GEDUNG A");
//     const fileB = exportToExcel(gedungB, "LAPORAN FINISHING GEDUNG B");
//     // const fileC = exportToExcel(tanpaGedung, "LAPORAN TANPA GEDUNG");

//     if (fileA) {
//       formData.append(
//         "files",
//         new Blob([fileA], {
//           type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//         }),
//         `Report Finishing Gedung_A_${filterDate.value}.xlsx`
//       );
//     }

//     if (fileB) {
//       formData.append(
//         "files",
//         new Blob([fileB], {
//           type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//         }),
//         `Report Finishing Gedung_B_${filterDate.value}.xlsx`
//       );
//     }

//     // if (fileC) {
//     //   formData.append(
//     //     "files",
//     //     new Blob([fileC], {
//     //       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     //     }),
//     //     `Tanpa_Gedung_${filterDate.value}.xlsx`
//     //   );
//     // }

//     formData.append("periode", formattedPeriode);

//     await axios.post(
//       `${API_BASE_URL}/emailfinishing01/send-summary-email`,
//       formData,
//       {
//         headers: {
//           "Content-Type": "multipart/form-data"
//         }
//       }
//     );

//     alert("Email berhasil dikirim!");
//   } catch (err) {
//     console.error("Send Email Error:", err);
//     alert("Gagal kirim email");
//   } finally {
//     isSendingEmail.value = false;
//   }
// };

// const exportToPDF = () => {
//   const doc = new jsPDF('p', 'mm', 'a4');
  
//   doc.setFontSize(14);
//   doc.setFont("helvetica", "bold");
//   doc.text("Laporan Produksi Finishing", 14, 15);

//   doc.setFontSize(10);
//   doc.setFont("helvetica", "normal");
//   doc.text(`Periode Produksi: ${formatDate(filterDate.value)}`, 14, 22);
  
//   let yPos = 27;
//   if (columnFilters.value.xMark.length > 0) {
//     doc.text(`Filter Style: ${columnFilters.value.xMark.join(', ')}`, 14, yPos);
//     yPos += 5;
//   }

//   autoTable(doc, { 
//     html: '#table-v2',
//     startY: yPos, 
//     theme: 'grid',
//     styles: { fontSize: 7, cellPadding: 1.5 },
//     headStyles: { fillColor: [33, 37, 41] },
//     margin: { top: 20 },
//     didParseCell: function(data) {
//         if (data.section === 'head') {
//             data.cell.text = [data.cell.text[0].replace(/[\u2190-\u21FF]/g, '').trim()];
//         }
//     },
//   });

//   doc.save(`Laporan_Finishing_${filterDate.value}.pdf`);
// };

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

.custom-table-v2 { border: 2px solid #333; font-size: 0.82rem; }
.custom-table-v2 thead th { position: sticky; top: 0; z-index: 10; background: #212529 !important; color: white; border: 1px solid #444; }

.style-row-start td { border-top: 3px solid #333 !important; }
.style-row-end td { border-bottom: 3px solid #333 !important; }

.bg-green-soft { background-color: #e6ffed !important; color: #155724; }
.bg-info-soft { background-color: #e0faff !important; color: #00758f; }
.bg-purple-soft { background-color: #f3f0ff !important; color: #553c9a; }

.cursor-pointer { cursor: pointer; }
.filter-panel { position: fixed; z-index: 10000; width: 220px; }
.filter-list { max-height: 200px; overflow-y: auto; padding: 5px; }

.loading-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.7); display: flex; flex-direction: column;
  justify-content: center; align-items: center; z-index: 2000; backdrop-filter: blur(2px);
}
.is-loading-content { filter: blur(2px); pointer-events: none; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #bbb; border-radius: 10px; }
</style>