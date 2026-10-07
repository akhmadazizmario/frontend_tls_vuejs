<template>
  <div class="d-flex flex-column vh-100 bg-soft-gray overflow-hidden">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden pt-5">
      <Sidebar :isOpen="sidebarOpen" />

      <main :class="['flex-grow-1 p-3 transition-all main-content d-flex flex-column overflow-hidden', sidebarOpen ? 'ms-sidebar-open' : 'ms-sidebar-closed']">
        
        <div class="flex-shrink-0">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 class="fw-bold app-title m-0">
                <span class="app-title-icon"><i class="bi bi-card-checklist"></i></span>Laporan Produksi Finishing
              </h5>
              <p class="app-subtitle mb-0">Ringkasan progres produksi finishing secara real-time</p>
            </div>
            <div class="d-flex gap-2">
              <div class="dropdown">
                <button class="btn btn-modern btn-modern-outline dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                  <i class="bi bi-sliders me-1"></i>Kolom Tampil
                </button>
                <div class="dropdown-menu p-3 shadow-lg border-0 rounded-3 modern-dropdown" style="min-width: 240px; z-index: 1060;">
                  <div v-for="(val, key) in groupState" :key="key" class="form-check form-switch mb-1">
                    <input class="form-check-input" type="checkbox" v-model="groupState[key]" :id="'sw-'+key">
                    <label class="form-check-label small text-uppercase fw-semibold" :for="'sw-'+key">
                      {{ key === 'tglDel' ? 'TGL DEL' : (key === 'soomSontex' ? 'HASIL SOOM' : key.replace(/([A-Z])/g, ' $1')) }}
                    </label>
                  </div>
                </div>
              </div>
              <button @click="sendEmail" :disabled="isSendingEmail" class="btn btn-modern btn-modern-primary">
                <span v-if="isSendingEmail" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-envelope me-1"></i> Email
              </button>

              <button @click="exportToExcel" class="btn btn-modern btn-modern-success">
                <i class="bi bi-file-earmark-excel me-1"></i> Excel
              </button>
              <button @click="exportToPDF" class="btn btn-modern btn-modern-danger">
                <i class="bi bi-file-earmark-pdf me-1"></i> PDF
              </button>
            </div>
          </div>

          <!-- Navigasi -->
          <div class="mb-4 d-flex gap-2 flex-wrap nav-pill-group">
             <a href="/view-finishing-pergedung" class="nav-pill nav-pill-primary"><i class="bi bi-highlighter"></i> Input Gedung Finishing</a>
             <a href="/view-finishing-turun-pergedung" class="nav-pill nav-pill-amber"><i class="bi bi-highlighter"></i> Input U/CBS&LO</a>
             <a href="/view-finishing-turun-soom-pergedung" class="nav-pill nav-pill-amber"><i class="bi bi-highlighter"></i> Input U/SOOM</a>
             <a href="/plnlktambahan" class="nav-pill nav-pill-amber"><i class="bi bi-pencil-fill"></i> Input Plan LK</a>
             <a href="/plnkrtambahan" class="nav-pill nav-pill-amber"><i class="bi bi-pencil-fill"></i> Input Plan KR</a>
             <!-- <a href="/plntrtambahan" class="nav-pill nav-pill-amber"><i class="bi bi-pencil-fill"></i> Input Plan TR</a>
             <a href="/plnkrtambahan" class="nav-pill nav-pill-amber"><i class="bi bi-pencil-fill"></i> Input Plan KR</a> -->
             <div class="vr mx-1 nav-divider"></div>
             <a href="/laporan-finishing-pergedung" class="nav-pill nav-pill-green"><i class="bi bi-card-list"></i> Report ALL finishing</a>
             <a href="/summary-finishing-pergedung" class="nav-pill nav-pill-green"><i class="bi bi-card-list"></i> Summary finishing</a>
             <a href="https://docs.google.com/document/d/1hPeypmbv7ooP1-V_ng7NBnh0M7XZTP0i/edit?usp=drive_link&ouid=104143269381300668268&rtpof=true&sd=true" class="nav-pill nav-pill-red"><i class="bi bi-book-half"></i> Rumus Sisa</a>
             <div class="vr mx-1 nav-divider"></div>
             <a href="/cek-akum-pergedung" class="nav-pill nav-pill-green"><i class="bi bi-pencil-square"></i> Cek Akum Inputan Massal</a>
          </div>

          <div class="modern-card mb-3 p-3">
            <div class="row g-2 align-items-end">
              <div class="col-md-3">
                <label class="fw-semibold small mb-1 filter-label text-uppercase">Tanggal Produksi</label>
                <input type="date" v-model="filterDate" class="form-control form-control-sm modern-input">
              </div> 
              <div class="col-md-2">
                <button class="btn btn-modern btn-modern-primary w-100 py-2" @click="fetchData">
                  <i class="bi bi-search me-1"></i>Cari Data
                </button>
              </div>
              <div class="col-md-7 text-end" v-if="hasActiveFilters">
                <span class="badge modern-badge-warning me-2">Terfilter: {{ filteredData.length }} Baris</span>
                <button @click="resetFilters" class="btn btn-modern btn-modern-danger btn-modern-sm">
                  <i class="bi bi-x-circle me-1"></i>Hapus Semua Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modern-card table-card overflow-hidden flex-grow-1">
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <h6 class="mt-2 fw-semibold loading-text">Menyiapkan data...</h6>
          </div>
          
          <div class="card-body p-0 d-flex flex-column h-100" :class="{ 'is-loading-content': isLoading }">
            <!-- Warning Data Gedung Kosong -->
            <div v-if="invalidGedungData.length > 0" class="p-2 border-bottom alert-strip">
              <button v-if="invalidGedungData.length > 0" class="btn btn-modern btn-modern-warning btn-modern-sm position-relative" data-bs-toggle="collapse" data-bs-target="#missingGedungInfo">
                <i class="bi bi-bell-fill"></i> Notifikasi Gedung
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{{ invalidGedungData.length }}</span>
              </button>

              <div class="collapse mt-2" id="missingGedungInfo">
                <div class="card card-body border-0 rounded-3 warning-panel">
                  <div class="fw-bold">Ada {{ invalidGedungData.length }} data Style yang gedungnya kosong</div>
                  <div class="small mt-1">
                    Mohon lakukan <span class="fw-bold text-danger">PENGECEKAN di Input gedung</span> atau input gedung di data pelengkap.
                  </div>
                  <div class="small mt-2">STYLE belum ada gedung:</div>
                  <div class="fw-bold text-dark">
                    {{ invalidGedungData.map(i => i.xMark || '(xMark kosong)').join(', ') }}
                  </div>
                </div>
              </div>
            </div>

            <div class="table-scroll-wrapper flex-grow-1 overflow-auto custom-scrollbar">
              <table id="table-produksi" class="table table-sm align-middle mb-0 custom-table">
                <thead class="text-center text-uppercase">
                  <tr class="header-1">
                    <th rowspan="2" class="sticky-col sticky-w-style sticky-top-1 th-base th-neutral border-end" :style="{ left: stickyLeft.style + 'px' }">
                      STYLE 
                      <i class="bi bi-filter ms-1 cursor-pointer" :class="{'text-warning fs-6': columnFilters.xMark?.length}" @click="openFilterMenu($event, 'xMark')"></i>
                      <span v-if="columnFilters.xMark?.length" class="badge bg-warning text-dark ms-1" style="font-size: 0.7rem;">{{ columnFilters.xMark.length }}</span>
                    </th>
                    <th v-if="groupState.gedung" rowspan="2" class="sticky-col sticky-w-gedung sticky-top-1 th-base th-neutral border-end" :style="{ left: stickyLeft.gedung + 'px' }">
                      GEDUNG 
                      <i class="bi bi-filter ms-1 cursor-pointer" :class="{'text-warning fs-6': columnFilters.gedung?.length}" @click="openFilterMenu($event, 'gedung')"></i>
                      <span v-if="columnFilters.gedung?.length" class="badge bg-warning text-dark ms-1" style="font-size: 0.7rem;">{{ columnFilters.gedung.length }}</span>
                    </th>
                    <th v-if="groupState.tglDel" rowspan="2" class="sticky-col sticky-w-tgldel sticky-top-1 th-base th-neutral border-end" :style="{ left: stickyLeft.tglDel + 'px' }">
                      TGL DEL 
                      <i class="bi bi-filter ms-1 cursor-pointer" :class="{'text-warning fs-6': columnFilters.xminDate?.length}" @click="openFilterMenu($event, 'xminDate')"></i>
                      <span v-if="columnFilters.xminDate?.length" class="badge bg-warning text-dark ms-1" style="font-size: 0.7rem;">{{ columnFilters.xminDate.length }}</span>
                    </th>
                    <th v-if="groupState.poNo" rowspan="2" class="sticky-col sticky-w-pono sticky-top-1 th-base th-neutral border-end" :style="{ left: stickyLeft.poNo + 'px' }">
                      PO 
                      <i class="bi bi-filter ms-1 cursor-pointer" :class="{'text-warning fs-6': columnFilters.xTimes?.length}" @click="openFilterMenu($event, 'xTimes')"></i>
                      <span v-if="columnFilters.xTimes?.length" class="badge bg-warning text-dark ms-1" style="font-size: 0.7rem;">{{ columnFilters.xTimes.length }}</span>
                    </th>
                    <th v-if="groupState.idpqty" rowspan="2" class="sticky-top-1 th-base th-slate border-end">
                      style qty
                    </th>
                    <th v-if="groupState.plan" rowspan="2" class="sticky-col sticky-w-plan sticky-top-1 th-base th-neutral border-end" :style="{ left: stickyLeft.plan + 'px' }">
                      plan
                    </th>
                    <th v-if="groupState.warehouse" colspan="3" class="sticky-top-1 th-base th-neutral border-end">Warehouse</th>
                    <th v-if="groupState.terima" colspan="2" class="sticky-top-1 th-base th-neutral border-end">Terima WHA2</th>
                    <th v-if="groupState.linking" colspan="6" class="sticky-top-1 th-base th-primary border-end">LINKING</th>
                    <th v-if="groupState.pl" rowspan="2" class="sticky-top-1 th-base th-slate border-end">
                      P.LK 
                      <i class="bi bi-filter ms-1 cursor-pointer" :class="{'text-warning fs-6': columnFilters.pl?.length}" @click="openFilterMenu($event, 'pl')"></i>
                      <span v-if="columnFilters.pl?.length" class="badge bg-warning text-dark ms-1" style="font-size: 0.7rem;">{{ columnFilters.pl.length }}</span>
                    </th>
                    <th v-if="groupState.phl" colspan="2" class="sticky-top-1 th-base th-green border-end">PHL</th>
                    <th v-if="groupState.lo" colspan="4" class="sticky-top-1 th-base th-green border-end">LO</th>
                    <th v-if="groupState.soomSontex" colspan="22" class="sticky-top-1 th-base th-amber border-end">HASIL SOOM SONTEX</th>
                    <th v-if="groupState.qc" colspan="5" class="sticky-top-1 th-base th-info border-end">QC LAMPU</th>
                    <th v-if="groupState.sulam" colspan="5" class="sticky-top-1 th-base th-green border-end">SULAM</th>
                    <th v-if="groupState.plan" rowspan="2" class="sticky-top-1 th-base th-slate border-end">
                      plan krm
                    </th>
                    <th v-if="groupState.kirim" colspan="4" class="sticky-top-1 th-base th-green border-end">KIRIM</th>
                  </tr>
                  
                  <tr class="header-2">
                    <template v-if="groupState.warehouse">
                      <th class="sub-header-text">QTY</th><th class="sub-header-text">-/+</th><th class="sub-header-text border-end">AKUM</th>
                    </template>
                    <template v-if="groupState.terima">
                      <th class="sub-header-text">QTY</th><th class="sub-header-text border-end">AKUM</th>
                    </template>
                    <template v-if="groupState.linking">
                      <th class="sub-header-text">QTY</th><th class="sub-header-text">-/+</th><th class="sub-header-text border-end">AKUM</th><th class="sub-header-text border-end">L.PGRN</th>
                      <th class="sub-header-text border-end">T.PGRN</th>
                      <th class="sub-header-text border-end bg-success">SISA LK</th>
                    </template>
                    <template v-if="groupState.phl">
                      <th class="sub-header-text">QTY</th><th class="sub-header-text border-end">AKUM</th>
                    </template>
                    <template v-if="groupState.lo">
                      <th class="sub-header-text">QTY</th><th class="sub-header-text border-end">AKUM</th><th class="sub-header-text border-end">AKUM LO TO A1</th> 
                      <th class="sub-header-text border-end bg-success">SISA</th>
                    </template>
                    <template v-if="groupState.soomSontex">
                      <th class="sub-header-text border-start bg-light-gray">STEAM</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-end bg-warning">SISA STEAM</th>
                      <th class="sub-header-text border-start bg-light-gray">CBS</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-start bg-light-gray">CBS H/GSK</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-end bg-warning">UNTUK CBS</th>
                      <th class="sub-header-text border-end bg-warning">SISA CBS</th>
                      <th class="sub-header-text border-start bg-light-gray">SEWING</th>
                      <th class="sub-header-text bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-end bg-warning">SISA SEWING</th>
                      <th class="sub-header-text border-start bg-light-gray">Sontek</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-start bg-light-gray">Sontek Soom&Sontek</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-start bg-light-gray">Sontek Komplit</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
                      <th class="sub-header-text border-end bg-warning">SISA SONTEX</th>
                      <th class="sub-header-text border-start bg-light-gray">SOOM</th>
                      <th class="sub-header-text border-end bg-light-gray">AKUM</th>
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
                      <th class="sub-header-text">QTY</th><th class="sub-header-text">-/+</th>
                      <th class="sub-header-text border-end">AKUM</th>
                      <th class="sub-header-text border-end bg-success text-white">SISA</th>
                    </template>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(item, i) in filteredData" :key="i" class="row-hover">
                    <td class="sticky-col sticky-w-style fw-bold bg-white border-end text-dark" :style="{ left: stickyLeft.style + 'px' }">{{ item.xMark }}</td>
                    <td v-if="groupState.gedung" class="sticky-col sticky-w-gedung text-center fw-bold text-muted border-end" :style="{ left: stickyLeft.gedung + 'px' }">{{ item.gedung }}</td>
                    <td v-if="groupState.tglDel" class="sticky-col sticky-w-tgldel text-center small border-end bg-white" :style="{ left: stickyLeft.tglDel + 'px' }">{{ formatDate(item.xminDate) }}</td>
                    <td v-if="groupState.poNo" class="sticky-col sticky-w-pono text-center small border-end bg-white" :style="{ left: stickyLeft.poNo + 'px' }">{{ item.xTimes }}</td>
                    <td v-if="groupState.idpqty" class=" text-center small border-end bg-white" :style="{ left: stickyLeft.idpqty + 'px' }">{{ item.sum_total }}</td>
                    <td v-if="groupState.plan" class="sticky-col sticky-w-plan text-center small border-end bg-white" :style="{ left: stickyLeft.plan + 'px' }">{{ item.qty_plan }}</td>

                    <template v-if="groupState.warehouse">
                      <td class="text-dark">{{ item.total_warehouse }}</td>
                      <td class="text-primary" :class="{ 'text-danger fw-bold': Number(item.planmintrp) < 0 }">{{ item.planmintrp }}</td>
                      <td class="fw-bold bg-light-blue">{{ item.akum_warehouse }}</td>
                    </template>

                    <template v-if="groupState.terima">
                      <td class="text-dark">{{ item.total_terima }}</td>
                      <td class="fw-bold bg-light-blue">{{ item.akum_terima }}</td>
                    </template>
                    
                    <template v-if="groupState.linking">
                      <!-- <td class="text-primary ">{{ item.qty_plan }}</td> -->
                      <td class="text-primary ">{{ item.total_linkingP }}</td>
                      <td class="text-primary" :class="{ 'text-danger fw-bold': Number(item.planminlkp) < 0 }">{{ item.planminlkp }}</td>
                      <td class="fw-bold bg-light-blue">{{ item.akum_linkingP }}</td>
                      <td class="text-dark bg-light border-end">{{ item.total_linkingPP }}</td>
                      <td class="text-dark bg-light border-end">{{ item.total_linkingPTP }}</td>
                      <td class="fw-bold bg-light-green border-end">{{ item.sisa_linking }}</td>
                    </template>

                    <td v-if="groupState.pl" class="text-center bg-light border-end fw-bold text-dark">{{ item.pl }}</td>
                    <template v-if="groupState.phl">
                      <td class="text-success">{{ item.total_phl }}</td>
                      <td class="fw-bold bg-light-green">{{ item.akum_phl }}</td>
                    </template>

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

                    <td v-if="groupState.qty_planKR" class=" text-center small border-end bg-white" :style="{ left: stickyLeft.qty_planKR + 'px' }">{{ item.qty_planKR }}</td>
                    
                    <template v-if="groupState.kirim">
                      <!-- <td class="text-primary ">{{ item.qty_plankr }}</td> -->
                      <td>{{ item.total_kirim }}</td>
                      <td class="text-primary" :class="{ 'text-danger fw-bold': Number(item.planminkrp) < 0 }">{{ item.planminkrp }}</td>
                      <td class="fw-bold bg-light-purple">{{ item.akum_kirim }}</td>
                       <td class="fw-bold bg-light-purple">{{ item.sisa_kirim }}</td>
                    </template>
                  </tr>
                </tbody>
                <tfoot class="sticky-footer fw-bold bg-dark text-white">
                  <tr>
                      <td :colspan="1 + (groupState.gedung?1:0) + (groupState.tglDel ? 1 : 0) + (groupState.poNo?1:0)" class="sticky-col bg-dark border-end text-white ps-3" style="left: 0;">GRAND TOTAL</td>
                      <template v-if="groupState.idpqty">
                        <td class=" bg-dark border-end text-white" :style="{ left: stickyLeft.idpqty + 'px' }">{{ grandTotal.sum_total }}</td>
                      </template>
                      <template v-if="groupState.plan">
                        <td class="sticky-col bg-dark border-end text-white" :style="{ left: stickyLeft.plan + 'px' }">{{ grandTotal.qty_plan }}</td>
                      </template>  
                      <template v-if="groupState.warehouse">
                        <td>{{ grandTotal.total_warehouse }}</td>
                        <td>{{ grandTotal.planmintrp }}</td>
                        <td>{{ grandTotal.akum_warehouse }}</td>
                      </template>
                      <template v-if="groupState.terima">
                        <td>{{ grandTotal.total_terima }}</td>
                        <td>{{ grandTotal.akum_terima }}</td>
                      </template>
                      <template v-if="groupState.linking">
                        <td>{{ grandTotal.total_linkingP }}</td>
                        <td>{{ grandTotal.planminlkp }}</td>
                        <td>{{ grandTotal.akum_linkingP }}</td>
                        <td>{{ grandTotal.total_linkingPP }}</td>
                        <td>{{ grandTotal.total_linkingPTP }}</td>
                        <td>{{ grandTotal.sisa_linking }}</td>
                      </template>
                      <td v-if="groupState.pl" class="bg-secondary">-</td>
                      <template v-if="groupState.phl">
                        <td>{{ grandTotal.total_phl }}</td>
                        <td>{{ grandTotal.akum_phl }}</td>
                      </template>
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
                      <template v-if="groupState.qty_planKR">
                        <td class=" bg-dark border-end text-white" :style="{ left: stickyLeft.qty_planKR + 'px' }">{{ grandTotal.qty_planKR }}</td>
                      </template>
                      <template v-if="groupState.kirim">
                        <td>{{ grandTotal.total_kirim }}</td>
                        <td>{{ grandTotal.planminkrp }}</td>
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

    <!-- DROPDOWN MULTIPLE CHECKBOX FILTER -->
    <div v-if="activeFilterKey" class="filter-dropdown-panel modern-card p-3" :style="filterPos">
      
      <div class="d-flex justify-content-between align-items-center mb-2 px-1">
        <span class="small fw-bold text-primary text-uppercase">
          Filter {{ activeFilterKey === 'xminDate' ? 'Tanggal' : activeFilterKey.replace('total_','').replace('akum_','') }}
          <span v-if="columnFilters[activeFilterKey]?.length" class="badge modern-badge-warning ms-2">{{ columnFilters[activeFilterKey].length }} dipilih</span>
        </span>
        <button @click="activeFilterKey = null" class="btn-close btn-sm"></button>
      </div>

      <!-- INPUT PENCARIAN BARU -->
      <div class="px-1 mb-2">
        <input type="text" class="form-control form-control-sm modern-input" placeholder="Cari data..." v-model="filterSearchQuery">
      </div>
      
      <!-- Utility Select All / Clear All -->
      <div class="d-flex gap-2 mb-2 px-1">
        <button class="btn btn-modern btn-modern-outline btn-modern-sm w-50" @click="selectAllFilters">Pilih Semua</button>
        <button class="btn btn-modern btn-modern-outline-danger btn-modern-sm w-50" @click="columnFilters[activeFilterKey] = []">Reset</button>
      </div>

      <div class="filter-list border-0 rounded-3 p-2 mb-3 filter-list-bg overflow-auto" style="max-height: 200px;">
        <!-- Tampilkan opsi yang sudah difilter oleh input pencarian -->
        <div v-for="opt in searchedOpts" :key="opt" class="form-check">
          <input class="form-check-input" type="checkbox" :value="opt" v-model="columnFilters[activeFilterKey]" :id="'opt-'+opt">
          <label class="form-check-label small" :for="'opt-'+opt">
            {{ activeFilterKey === 'xminDate' ? formatDate(opt) : (opt || '(Kosong)') }}
          </label>
        </div>

        <!-- Jika pencarian tidak ditemukan -->
        <div v-if="searchedOpts.length === 0" class="text-center text-muted small py-2">
          Pencarian tidak ditemukan
        </div>
      </div>
      
      <div class="d-flex gap-2">
        <button class="btn btn-modern btn-modern-primary flex-grow-1" @click="activeFilterKey = null">Tutup Pencarian</button>
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

const groupState = ref({ 
  gedung: true, 
  tglDel: true, 
  poNo: true,
  idpqty: true,
  plan: true,
  warehouse: true,
  terima: true,
  pl: true,
  linking: true, 
  phl: true,
  lo: true, 
  soomSontex: true, 
  qc: true, 
  sulam: true,
  qty_planKR: true,
  kirim: true 
});

// Lebar tiap kolom sticky (harus sinkron dengan class .sticky-w-* di <style>)
const STICKY_W = { style: 140, gedung: 90, tglDel: 100, poNo: 90, idpqty: 80, plan: 80 };

// Hitung posisi "left" tiap kolom sticky secara dinamis mengikuti kolom mana yang sedang tampil
const stickyLeft = computed(() => {
  let left = STICKY_W.style; // kolom STYLE selalu left: 0
  const result = { style: 0, gedung: left, tglDel: left, poNo: left, idpqty: left, plan: left, phl: left };

  if (groupState.value.gedung) { result.gedung = left; left += STICKY_W.gedung; }
  result.tglDel = left;
  if (groupState.value.tglDel) { left += STICKY_W.tglDel; }
  result.poNo = left;
  if (groupState.value.poNo) { left += STICKY_W.poNo; }
  result.plan = left;

  return result;
});

const activeFilterKey = ref(null);
const filterPos = ref({ top: 0, left: 0 });
const columnFilters = ref({});
const filterSearchQuery = ref(''); // State untuk input pencarian filter

// Membuka menu filter dan mereset input pencarian
const openFilterMenu = (event, key) => {
  if (!columnFilters.value[key]) columnFilters.value[key] = [];
  activeFilterKey.value = key;
  filterSearchQuery.value = ''; // Kosongkan pencarian saat ganti kolom filter
  filterPos.value = { top: (event.clientY + 15) + 'px', left: Math.min(event.clientX, window.innerWidth - 260) + 'px' };
};

// Format Tanggal untuk tampilan filter
const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

// Mendapatkan list opsi unik untuk filter
const uniqueOpts = computed(() => {
  if (!activeFilterKey.value) return [];
  const options = rawData.value.map(d => d[activeFilterKey.value]);
  return [...new Set(options)].sort();
});

// ==================== LOGIKA PENCARIAN DI DALAM FILTER ====================
// Menyaring opsi filter berdasarkan input pencarian user
const searchedOpts = computed(() => {
  if (!filterSearchQuery.value) return uniqueOpts.value;
  
  const query = filterSearchQuery.value.toLowerCase();
  
  return uniqueOpts.value.filter(opt => {
    // Pastikan format pencarian tanggal sesuai dengan apa yang dilihat user
    const label = activeFilterKey.value === 'xminDate' ? formatDate(opt) : (opt || '(Kosong)');
    return String(label).toLowerCase().includes(query);
  });
});

// Saat klik Pilih Semua, hanya memilih yang TAMPIL di hasil pencarian
const selectAllFilters = () => {
  if (activeFilterKey.value) {
    const currentSelected = new Set(columnFilters.value[activeFilterKey.value] || []);
    
    // Tambahkan item yang sedang tampil dari hasil search ke dalam Set
    searchedOpts.value.forEach(opt => currentSelected.add(opt));
    
    // Simpan kembali array ke dalam columnFilters
    columnFilters.value[activeFilterKey.value] = Array.from(currentSelected);
  }
};
// =========================================================================

// Menyaring data utama tabel berdasarkan kolom yang difilter
const filteredData = computed(() => {
  return rawData.value.filter(item => {
    return Object.keys(columnFilters.value).every(key => {
      if (!columnFilters.value[key] || columnFilters.value[key].length === 0) return true;
      return columnFilters.value[key].includes(item[key]);
    });
  });
});

const grandTotal = computed(() => {
  const data = filteredData.value || [];
  
  const totals = {
    sum_total: 0,
    qty_plan: 0, 
    total_warehouse: 0, planmintrp: 0, akum_warehouse: 0, 
    total_terima: 0, akum_terima: 0, 
    total_linkingP: 0, planminlkp: 0, akum_linkingP: 0,
    total_linkingPP: 0, total_linkingPTP: 0, sisa_linking: 0,
    total_phl: 0, akum_phl: 0,
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
    qty_planKR: 0,
    total_kirim: 0, planminkrp: 0, akum_kirim: 0, sisa_kirim: 0, 
    untuk_cbs: 0,
    
    sisa_lo: 0,
    sisa_cbs: 0,
    sisa_sewing: 0,
    sisa_sontex: 0,
    sisa_soom: 0,
    sisa_lampu: 0,
    sisa_sulam: 0
  };

  if (data.length === 0) return totals;

  data.forEach(item => {
    totals.sum_total           += Number(item.sum_total) || 0;
    totals.qty_plan           += Number(item.qty_plan) || 0;
    totals.total_warehouse    += Number(item.total_warehouse) || 0;
    totals.planmintrp         += Number(item.planmintrp) || 0;
    totals.akum_warehouse     += Number(item.akum_warehouse) || 0;
    totals.total_terima       += Number(item.total_terima) || 0;
    totals.akum_terima        += Number(item.akum_terima) || 0;
    
    totals.total_linkingP     += Number(item.total_linkingP) || 0;
    totals.planminlkp         += Number(item.planminlkp) || 0;
    totals.akum_linkingP      += Number(item.akum_linkingP) || 0;
    totals.total_linkingPP    += Number(item.total_linkingPP) || 0;
    totals.total_linkingPTP   += Number(item.total_linkingPTP) || 0;
    totals.sisa_linking       += Number(item.sisa_linking) || 0;

    totals.total_phl          += Number(item.total_phl) || 0;
    totals.akum_phl           += Number(item.akum_phl) || 0;
    
    totals.total_lo           += Number(item.total_lo) || 0;
    totals.akum_lo            += Number(item.akum_lo) || 0;
    totals.akum_lokea1        += Number(item.akum_lokea1) || 0;
    totals.sisa_lo            += Number(item.sisa_lo) || 0; 
    
    totals.total_steam        += Number(item.total_steam) || 0;
    totals.akum_steam         += Number(item.akum_steam) || 0;
    totals.sisa_steam         += Number(item.sisa_steam) || 0;
    totals.total_cbs          += Number(item.total_cbs) || 0;
    totals.akum_cbs           += Number(item.akum_cbs) || 0;
    totals.total_cbshgs       += Number(item.total_cbshgs) || 0;
    totals.akum_cbshgs        += Number(item.akum_cbshgs) || 0;
    totals.untuk_cbs          += Number(item.untuk_cbs) || 0;
    totals.sisa_cbs           += Number(item.sisa_cbs) || 0; 
    
    totals.total_sewing       += Number(item.total_sewing) || 0;
    totals.akum_sewing        += Number(item.akum_sewing) || 0;
    totals.sisa_sewing        += Number(item.sisa_sewing) || 0; 
    
    totals.total_stik         += Number(item.total_stik) || 0;
    totals.akum_stik          += Number(item.akum_stik) || 0;
    totals.total_sontexsoom   += Number(item.total_sontexsoom) || 0;
    totals.akum_sontexsoom    += Number(item.akum_sontexsoom) || 0;
    totals.total_stkb         += Number(item.total_stkb) || 0;
    totals.akum_stkb          += Number(item.akum_stkb) || 0;
    totals.sisa_sontex        += Number(item.sisa_sontex) || 0; 
    
    totals.total_soom         += Number(item.total_soom) || 0;
    totals.akum_soom          += Number(item.akum_soom) || 0;
    totals.sisa_soom          += Number(item.sisa_soom) || 0; 
    
    totals.total_qclampubs    += Number(item.total_qclampubs) || 0;
    totals.akum_qclampubs     += Number(item.akum_qclampubs) || 0;
    totals.total_qclampulb    += Number(item.total_qclampulb) || 0;
    totals.akum_qclampulb     += Number(item.akum_qclampulb) || 0;
    totals.sisa_lampu         += Number(item.sisa_lampu) || 0; 
    
    totals.total_sulam        += Number(item.total_sulam) || 0;
    totals.akum_sulam         += Number(item.akum_sulam) || 0;
    totals.total_sulamlb      += Number(item.total_sulamlb) || 0;
    totals.akum_sulamlb       += Number(item.akum_sulamlb) || 0;
    totals.sisa_sulam         += Number(item.sisa_sulam) || 0; 

    totals.qty_planKR         += Number(item.qty_planKR) || 0;
    
    totals.total_kirim        += Number(item.total_kirim) || 0;
    totals.planminkrp         += Number(item.planminkrp) || 0;
    totals.akum_kirim         += Number(item.akum_kirim) || 0;
    totals.sisa_kirim         += Number(item.sisa_kirim) || 0;
  });

  return totals;
});

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
  tableClone.querySelectorAll('.bi-filter, .badge').forEach(el => el.remove());
  
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
    tableClone.querySelectorAll('.bi-filter, .badge').forEach(el => el.remove());
    
    const wsOriginal = XLSXStyle.utils.table_to_sheet(tableClone);
    const rangeOriginal = XLSXStyle.utils.decode_range(wsOriginal['!ref']);

    const ws = {};

    const formattedPeriode = filterDate.value ? formatDate(filterDate.value) : 'Semua Periode';
    
    ws['A1'] = {
      v: `LAPORAN ALL FINISHING PERIODE: ${formattedPeriode}`.toUpperCase(),
      t: 's',
      s: {
        font: { name: 'Arial', size: 14, bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: 'left', vertical: 'center' }
      }
    };

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

    const offsetRows = 3; 

    Object.keys(wsOriginal).forEach(key => {
      if (key.startsWith('!')) return;
      
      const cell = XLSXStyle.utils.decode_cell(key);
      const newRow = cell.r + offsetRows;
      const newKey = XLSXStyle.utils.encode_cell({ r: newRow, c: cell.c });

      ws[newKey] = wsOriginal[key];
      
      if (cell.r === 0) {
        ws[newKey].s = headerStyle;
      } else if (cell.r === rangeOriginal.e.r) {
        ws[newKey].s = totalStyle;
      } else {
        ws[newKey].s = dataStyle;
      }
    });

    ws['!ref'] = XLSXStyle.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rangeOriginal.e.r + offsetRows, c: rangeOriginal.e.c }
    });

    if (wsOriginal['!merges']) {
      ws['!merges'] = wsOriginal['!merges'].map(merge => ({
        s: { r: merge.s.r + offsetRows, c: merge.s.c },
        e: { r: merge.e.r + offsetRows, c: merge.e.c }
      }));
    }

    if (wsOriginal['!cols']) ws['!cols'] = wsOriginal['!cols'];

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Laporan");

    const excelBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Laporan_Finishing_${filterDate.value}.xlsx`;

    const formData = new FormData();
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
/* ==================== DESIGN TOKENS ==================== */
.d-flex.flex-column.vh-100 {
  --brand-900: #0f172a;
  --brand-800: #1e293b;
  --brand-700: #334155;
  --brand-600: #475569;
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-soft: #eff6ff;
  --success: #16a34a;
  --success-soft: #f0fdf4;
  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --warning: #d97706;
  --warning-soft: #fffbeb;
  --info: #0891b2;
  --info-soft: #ecfeff;
  --slate: #64748b;
  --border-soft: #e2e8f0;
  --text-muted: #64748b;
  --radius-lg: 14px;
  --radius-md: 10px;
  --shadow-soft: 0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.06);
  --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.05), 0 10px 30px rgba(15, 23, 42, 0.06);
  font-family: "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f4f6f9 !important;
}

.main-content { transition: all 0.3s ease-in-out; }
.ms-sidebar-open { margin-left: 260px; width: calc(100% - 260px); }
.ms-sidebar-closed { margin-left: 70px; width: calc(100% - 70px); }

/* ==================== HEADER / TITLE ==================== */
.app-title { font-size: 1.05rem; color: var(--brand-900); letter-spacing: -0.01em; }
.app-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  margin-right: 8px;
  font-size: 0.95rem;
}
.app-subtitle { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }

/* ==================== BUTTONS ==================== */
.btn-modern {
  border: 1px solid transparent;
  border-radius: 9px;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
  display: inline-flex;
  align-items: center;
  transition: all 0.15s ease;
  letter-spacing: 0.01em;
}
.btn-modern-sm { padding: 0.35rem 0.75rem; font-size: 0.75rem; }

.btn-modern-primary { background: var(--primary); color: #fff; box-shadow: var(--shadow-soft); }
.btn-modern-primary:hover { background: var(--primary-dark); color: #fff; transform: translateY(-1px); }

.btn-modern-success { background: var(--success); color: #fff; box-shadow: var(--shadow-soft); }
.btn-modern-success:hover { background: #15803d; color: #fff; transform: translateY(-1px); }

.btn-modern-danger { background: var(--danger); color: #fff; box-shadow: var(--shadow-soft); }
.btn-modern-danger:hover { background: #b91c1c; color: #fff; transform: translateY(-1px); }

.btn-modern-warning { background: var(--warning); color: #fff; box-shadow: var(--shadow-soft); }
.btn-modern-warning:hover { background: #b45309; color: #fff; transform: translateY(-1px); }

.btn-modern-outline {
  background: #fff; color: var(--brand-700); border-color: var(--border-soft);
}
.btn-modern-outline:hover { background: #f8fafc; border-color: #cbd5e1; color: var(--brand-900); }

.btn-modern-outline-danger { background: #fff; color: var(--danger); border-color: #fecaca; }
.btn-modern-outline-danger:hover { background: var(--danger-soft); border-color: var(--danger); }

/* ==================== NAV PILLS ==================== */
.nav-pill-group { row-gap: 8px; }
.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.nav-pill:hover { transform: translateY(-1px); box-shadow: var(--shadow-soft); }

.nav-pill-primary { background: var(--primary-soft); color: var(--primary-dark); border-color: #bfdbfe; }
.nav-pill-primary:hover { background: var(--primary); color: #fff; }

.nav-pill-amber { background: var(--warning-soft); color: var(--warning); border-color: #fde68a; }
.nav-pill-amber:hover { background: var(--warning); color: #fff; }

.nav-pill-green { background: var(--success-soft); color: var(--success); border-color: #bbf7d0; }
.nav-pill-green:hover { background: var(--success); color: #fff; }

.nav-pill-red { background: var(--danger-soft); color: var(--danger); border-color: #fecaca; }
.nav-pill-red:hover { background: var(--danger); color: #fff; }

.nav-divider { height: 28px; min-width: 1px; background: var(--border-soft); opacity: 1; }

/* ==================== CARDS / INPUTS ==================== */
.modern-card {
  background: #fff;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.table-card { border-radius: 16px; }

.modern-input {
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  font-size: 0.82rem;
}
.modern-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

.filter-label { color: var(--text-muted); font-size: 0.7rem; letter-spacing: 0.04em; }

.modern-badge-warning {
  background: var(--warning-soft);
  color: var(--warning);
  border: 1px solid #fde68a;
  font-weight: 600;
  padding: 0.4em 0.7em;
  border-radius: 999px;
  font-size: 0.75rem;
}

.modern-dropdown { border: 1px solid var(--border-soft) !important; }
.alert-strip { background: #fafbfc; }
.warning-panel { background: var(--warning-soft); border-left: 3px solid var(--warning) !important; }
.filter-list-bg { background: #f8fafc; border: 1px solid var(--border-soft) !important; }
.loading-text { color: var(--primary); }

/* ==================== TABLE ==================== */
.custom-table { min-width: 3300px; border-collapse: separate; border-spacing: 0; font-size: 0.82rem; }

.th-base {
  font-size: 0.72rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.03em;
  padding: 10px 8px !important;
  background: var(--brand-900);
  color: #fff;
}
.th-neutral { background: var(--brand-900); color: #fff; border-top: 3px solid #334155; }
.th-primary { background: var(--brand-900); color: #fff; border-top: 3px solid var(--primary); }
.th-slate { background: var(--brand-900); color: #fff; border-top: 3px solid var(--slate); }
.th-green { background: var(--brand-900); color: #fff; border-top: 3px solid var(--success); }
.th-amber { background: var(--brand-900); color: #fff; border-top: 3px solid var(--warning); }
.th-info { background: var(--brand-900); color: #fff; border-top: 3px solid var(--info); }

.sub-header-text { font-size: 11px !important; font-weight: 700 !important; color: var(--brand-700) !important; padding: 9px 4px !important; background-color: #f8fafc; letter-spacing: 0.02em; }
/* Sub-header section tints — soft backgrounds, always dark readable text */
.header-2 th.bg-light-gray { background-color: #f1f5f9 !important; color: var(--brand-700) !important; }
.header-2 th.bg-success { background-color: var(--success-soft) !important; color: #15803d !important; }
.header-2 th.bg-warning { background-color: var(--warning-soft) !important; color: #b45309 !important; }
.header-2 th.bg-info { background-color: var(--info-soft) !important; color: #0e7490 !important; }
.header-2 th.text-white { color: inherit !important; }

.sticky-col { position: sticky; left: 0; z-index: 100; }
.sticky-col:last-of-type,
.sticky-col.sticky-w-plan { box-shadow: 3px 0 6px rgba(15, 23, 42, 0.06); }
thead .sticky-col, tfoot .sticky-col { background: var(--brand-900); color: #fff; }
tbody .sticky-col { background: #fff; }

/* Lebar tetap tiap kolom sticky supaya offset "left" (dihitung di JS via stickyLeft) selalu akurat */
.sticky-w-style   { width: 140px; min-width: 140px; max-width: 140px; }
.sticky-w-gedung  { width: 90px;  min-width: 90px;  max-width: 90px; }
.sticky-w-tgldel  { width: 100px; min-width: 100px; max-width: 100px; }
.sticky-w-pono    { width: 90px;  min-width: 90px;  max-width: 90px; }
.sticky-w-plan    { width: 80px;  min-width: 80px;  max-width: 80px; }
.sticky-top-1 { position: sticky; top: 0; z-index: 102; border-bottom: 1px solid #0f172a !important; }
.header-2 th { position: sticky; top: 43px; z-index: 101; border-bottom: 1px solid var(--border-soft) !important; }

th.sticky-col.sticky-top-1 { z-index: 103; }
.sticky-footer { position: sticky; bottom: 0; z-index: 102; }
.sticky-footer tr { background: var(--brand-900); }
.sticky-footer td {
  background: var(--brand-900);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  border-top: 2px solid rgba(255, 255, 255, 0.35) !important;
}

.custom-table tbody tr.row-hover { transition: background-color 0.12s ease; }
.custom-table tbody tr.row-hover:hover { background-color: #f8fafc; }
.custom-table tbody tr.row-hover:hover .sticky-col { background-color: #f1f5f9; }
.custom-table tbody td, .custom-table tbody th { border-color: var(--border-soft) !important; padding: 7px 8px; color: var(--brand-700); }

.bg-light-gray { background-color: #f8fafc !important; }
.bg-light-blue { background-color: var(--primary-soft); color: var(--primary-dark) !important; }
.bg-light-green { background-color: var(--success-soft); color: var(--success) !important; }
.bg-light-info { background-color: var(--info-soft); color: var(--info) !important; }
.bg-light-purple { background-color: #f5f3ff; color: #6f42c1 !important; }
.bg-light-warning { background-color: var(--warning-soft) !important; color: var(--warning) !important; }

.cursor-pointer { cursor: pointer; color: #94a3b8; transition: 0.2s; }
.cursor-pointer:hover { color: #f59e0b !important; }
thead .cursor-pointer, tfoot .cursor-pointer { color: rgba(255, 255, 255, 0.55); }
thead .cursor-pointer:hover, tfoot .cursor-pointer:hover { color: #fbbf24 !important; }

/* ==================== FILTER DROPDOWN / OVERLAY / SCROLLBAR ==================== */
.filter-dropdown-panel { position: fixed; z-index: 10000; min-width: 260px; border-radius: var(--radius-lg); }

.custom-scrollbar::-webkit-scrollbar { height: 10px; width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.is-loading-content {
  filter: blur(4px);
  pointer-events: none; 
}
</style>