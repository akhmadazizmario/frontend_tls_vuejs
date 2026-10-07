<template>
  <div class="container-fluid py-4 planning-page">
    <div class="page-header d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-1 fw-bold text-dark">Planning Produksi</h4>
        <div class="text-muted small">
          Satu <span class="badge text-bg-light border shadow-sm">xMark</span> bisa memiliki banyak proses kerja. 
          Klik <b>Kelola Planning</b> untuk mengatur semua proses sekaligus.
        </div>
      </div>
      <button class="btn btn-outline-primary btn-refresh shadow-sm" @click="refreshAll" :disabled="loading">
        <i class="bi bi-arrow-clockwise me-1"></i> Segarkan Data
      </button>
    </div>

    <!-- ============================ FILTER TOOLBAR ============================ -->
    <div class="filter-toolbar mb-4 shadow-sm">
      <div class="search-wrap">
        <i class="bi bi-search search-icon"></i>
        <input v-model="searchText" type="text" class="form-control search-input" placeholder="Cari xPO / xMark / xProdNote / proses..." />
        <button v-if="searchText" class="btn-clear-search" @click="searchText = ''" title="Bersihkan pencarian"><i class="bi bi-x-circle-fill"></i></button>
      </div>

      <div class="filter-select-wrap">
        <i class="bi bi-building filter-select-icon"></i>
        <select v-model="filterDept" class="form-select filter-select">
          <option value="">Semua Departemen</option>
          <option v-for="d in deptOptions" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>

      <div class="filter-select-wrap">
        <i class="bi bi-gear filter-select-icon"></i>
        <select v-model="filterWork" class="form-select filter-select">
          <option value="">Semua Proses (name_work)</option>
          <option v-for="w in workOptions" :key="w" :value="w">{{ w }}</option>
        </select>
      </div>

      <button v-if="searchText || filterDept || filterWork" class="btn btn-outline-secondary btn-reset-filter" @click="resetFilter">
        <i class="bi bi-x-lg me-1"></i> Reset Filter
      </button>
    </div>

    <!-- ============================ DAFTAR xMark ============================ -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <div class="text-muted">Memuat data planning...</div>
    </div>
    
    <div v-else-if="groupedFiltered.length === 0" class="empty-hint shadow-sm">
      <i class="bi bi-inbox-fill text-muted opacity-50"></i>
      <h5 class="mt-3 text-dark">Data tidak ditemukan</h5>
      <p class="text-muted mb-0">Cobalah untuk mengubah kata kunci pencarian atau filter Anda.</p>
    </div>

    <div v-else class="group-list">
      <div v-for="g in groupedFiltered" :key="g.xMark" class="group-card shadow-sm">
        <div class="group-card-main">
          <div class="group-card-info">
            <div class="group-card-title mb-2">
              <span class="xmark-chip"><i class="bi bi-tag-fill me-1 opacity-50"></i>{{ g.xMark }}</span>
              <span class="xpo-chip">{{ g.xPO }}</span>
              <span class="badge proc-count-badge"><i class="bi bi-diagram-3 me-1"></i>{{ g.items.length }} proses</span>
            </div>
            <div class="proc-chip-row">
              <span
                v-for="it in g.items" :key="itemKey(it)" class="proc-chip" :class="it.existing ? 'proc-chip-has' : 'proc-chip-none'"
                :title="it.existing ? `${it.existing.jml_hari} hari (${fmtShort(it.existing.tgl_mulai)} - ${fmtShort(it.existing.tgl_selesai)})` : 'Belum ada planning'"
              >
                <i class="bi" :class="it.existing ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                {{ it.nama_work || it.rWork_ID }}
                <span v-if="it.nama_dept" class="proc-chip-dept ms-1 opacity-75">&bull; {{ it.nama_dept }}</span>
              </span>
            </div>
          </div>
          <button class="btn btn-manage" @click="openGroup(g)">
            <i class="bi bi-sliders me-1"></i> Kelola Planning
          </button>
        </div>
      </div>
    </div>

    <!-- ============================ MODAL GROUP ============================ -->
    <div v-if="groupModalOpen" class="modal-backdrop-custom" @click.self="tutupGroupModal">
      <div class="modal-card modal-card-xl shadow-lg">
        <div class="modal-head">
          <div>
            <h5 class="fw-bold mb-1 d-flex align-items-center">
              <div class="icon-box-primary me-2"><i class="bi bi-diagram-3"></i></div>
              Kelola Planning
              <i class="bi bi-chevron-right mx-2 text-muted small"></i>
              <span class="text-primary">{{ groupXMark }}</span>
            </h5>
            <div class="text-muted small ms-5 ps-1">{{ procs.length }} proses kerja terdeteksi. Centang tanggal yang ingin dibuat/diubah.</div>
          </div>
          <button class="btn-close shadow-none" @click="tutupGroupModal"></button>
        </div>

        <div class="modal-body-custom">
          <!-- Range tanggal & Tombol Refresh -->
          <div class="toolbar-card mb-3">
            <div class="row g-3 align-items-end">
              <div class="col-auto">
                <label class="form-label small fw-semibold text-muted mb-1">Dari Tanggal</label>
                <input v-model="groupRange.dari" type="date" class="form-control" />
              </div>
              <div class="col-auto">
                <label class="form-label small fw-semibold text-muted mb-1">Sampai Tanggal</label>
                <input v-model="groupRange.sampai" type="date" class="form-control" :min="groupRange.dari || ''" />
              </div>
              <div class="col-auto">
                <button class="btn btn-primary shadow-sm" @click="generateGroupHari" :disabled="!groupRange.dari || !groupRange.sampai || procsLoading">
                  <i class="bi bi-magic me-1"></i> Munculkan Hari
                </button>
              </div>
              
              <div class="col-auto ms-auto">
                <button class="btn btn-outline-info shadow-sm fw-semibold" @click="refreshModalDataManual" :disabled="procsLoading" title="Tarik ulang data dari database">
                  <i class="bi bi-arrow-clockwise me-1"></i> Refresh Data Form
                </button>
              </div>
            </div>
            <div v-if="procsLoading" class="text-info small mt-2 fw-semibold">
              <i class="bi bi-hourglass-split me-1 spinner-border spinner-border-sm"></i> Memuat data existing...
            </div>
          </div>

          <!-- Pengaturan Massal (Bulk) -->
          <div class="toolbar-card qty-tool-card mb-3">
            <div class="advanced-panel-title"><i class="bi bi-people-fill text-primary me-1"></i> Pengaturan Qty Massal (Bulk)</div>
            <p class="text-muted small mb-3">Isi qty total per hari untuk diterapkan ke beberapa proses sekaligus.</p>
            <div class="row g-2 align-items-end">
              <div class="col-auto">
                <label class="form-label small fw-semibold mb-1">Qty Total / Hari</label>
                <input v-model.number="bulkQtyTarget" type="number" min="0" class="form-control" style="width: 150px" placeholder="Contoh: 5000" />
              </div>
              <div class="col-auto">
                <label class="form-label small fw-semibold mb-1">Terapkan Ke</label>
                <select v-model="bulkScope" class="form-select" style="width: 220px">
                  <option value="all">Semua proses tercentang</option>
                  <option value="dept">Filter Dept (tercentang)</option>
                </select>
              </div>
              <div class="col-auto" v-if="bulkScope === 'dept'">
                <label class="form-label small fw-semibold mb-1">Pilih Dept</label>
                <select v-model="bulkScopeDept" class="form-select" style="width: 200px">
                  <option value="">-- pilih dept --</option>
                  <option v-for="d in deptListGroup" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div class="col-auto">
                <button class="btn btn-outline-primary shadow-sm" @click="terapkanBulkQtyGroup" :disabled="!(bulkQtyTarget > 0) || (bulkScope === 'dept' && !bulkScopeDept)">
                  <i class="bi bi-lightning-charge-fill me-1"></i> Terapkan & Bagi Rata
                </button>
              </div>
            </div>
          </div>

          <!-- Panel Lanjutan (Aksi Massal Tambahan) -->
          <div class="toolbar-card mb-3">
            <div class="d-flex justify-content-between align-items-center cursor-pointer" @click="advancedOpen = !advancedOpen">
               <div class="advanced-panel-title mb-0">
                  <i class="bi bi-toggles me-1 text-primary"></i> Aksi Massal Tambahan
               </div>
              <button class="btn btn-sm btn-light rounded-circle">
                <i class="bi" :class="advancedOpen ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
              </button>
            </div>
            
            <div v-show="advancedOpen" class="mt-3 pt-3 border-top">
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm btn-outline-primary" @click="toggleAllTanggal(true)">
                  <i class="bi bi-check2-all me-1"></i> Centang Semua Tanggal
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="toggleAllTanggal(false)">
                  <i class="bi bi-square me-1"></i> Kosongkan Centang
                </button>
                <span class="vr-sep mx-2 border-end"></span>
                <button class="btn btn-sm btn-outline-dark" @click="toggleAll14Jam(true)">
                  <i class="bi bi-clock-history me-1"></i> Set Semua 14 Jam
                </button>
                <button class="btn btn-sm btn-outline-dark" @click="toggleAll14Jam(false)">
                  <i class="bi bi-clock me-1"></i> Set Semua 7 Jam
                </button>
              </div>
            </div>
          </div>

          <!-- Filter cepat proses -->
          <div class="toolbar-card proc-filter-card mb-4">
            <div class="advanced-panel-title text-indigo">
              <i class="bi bi-funnel-fill me-1"></i> Filter Fokus Proses
            </div>
            <p class="text-muted small mb-3">
              Gunakan filter ini untuk menyembunyikan proses yang tidak ingin Anda atur saat ini. <b>Menyimpan data hanya akan berlaku untuk proses yang terlihat.</b>
            </p>
            <div class="row g-4">
              <div class="col-md-5">
                <label class="form-label small fw-bold text-dark mb-2">Departemen</label>
                <div class="multi-select-box shadow-sm">
                  <input v-model="searchFilterDept" class="form-control form-control-sm mb-2" placeholder="Cari departemen..." />
                  <div class="multi-select-list">
                    <label v-for="d in visibleDeptList" :key="d" class="custom-checkbox mb-1">
                      <input type="checkbox" :value="d" v-model="procFilterDept" />
                      <span class="checkmark"></span>
                      <span class="label-text">{{ d }}</span>
                    </label>
                    <div v-if="!visibleDeptList.length" class="text-muted small mt-1">Tidak ditemukan</div>
                  </div>
                </div>
              </div>
              <div class="col-md-7">
                <label class="form-label small fw-bold text-dark mb-2">Proses Kerja</label>
                <div class="multi-select-box shadow-sm">
                  <input v-model="searchFilterWork" class="form-control form-control-sm mb-2" placeholder="Cari proses kerja..." />
                  <div class="multi-select-list">
                    <label v-for="w in visibleWorkList" :key="w" class="custom-checkbox mb-1">
                      <input type="checkbox" :value="w" v-model="procFilterWork" />
                      <span class="checkmark"></span>
                      <span class="label-text">{{ w }}</span>
                    </label>
                    <div v-if="!visibleWorkList.length" class="text-muted small mt-1">Tidak ditemukan</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
              <div class="text-dark small fw-semibold">
                Menampilkan <span class="badge text-bg-primary rounded-pill">{{ filteredProcs.length }}</span> dari {{ procs.length }} proses
              </div>
              <button v-if="procFilterDept.length || procFilterWork.length" class="btn btn-sm btn-light text-danger fw-semibold" @click="resetFilterProc">
                <i class="bi bi-x-circle-fill me-1"></i> Bersihkan Filter
              </button>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-3 mb-2 px-2">
            <button class="btn btn-sm text-primary fw-semibold p-0" @click="filteredProcs.forEach((p) => (p.open = true))"><i class="bi bi-arrows-expand me-1"></i>Buka Semua</button>
            <button class="btn btn-sm text-secondary fw-semibold p-0" @click="filteredProcs.forEach((p) => (p.open = false))"><i class="bi bi-arrows-collapse me-1"></i>Tutup Semua</button>
          </div>

          <div v-if="filteredProcs.length === 0" class="empty-hint shadow-sm">
            <i class="bi bi-funnel text-muted opacity-50"></i>
            <h6 class="mt-2 text-dark">Tidak ada proses yang cocok</h6>
            <p class="small text-muted mb-0">Silakan bersihkan filter untuk melihat kembali proses.</p>
          </div>

          <!-- Accordion List Proses -->
          <div v-for="p in filteredProcs" :key="procKey(p)" class="proc-panel shadow-sm" :class="{ 'proc-panel-collapsed': !p.open }">
            <div class="proc-panel-head" @click="p.open = !p.open">
              <div class="proc-panel-head-left">
                <div class="form-check mb-0 chk-sertakan" @click.stop>
                  <input :id="`sertakan-${procKey(p)}`" v-model="p.selectedBulk" class="form-check-input" type="checkbox" title="Sertakan proses ini" />
                </div>
                <div class="icon-toggle"><i class="bi" :class="p.open ? 'bi-chevron-down' : 'bi-chevron-right'"></i></div>
                <div>
                  <div class="fw-bold fs-6 text-dark d-flex align-items-center flex-wrap gap-2 mb-1">
                    {{ p.nama_work || p.rWork_ID }}
                    <span class="badge text-bg-indigo">{{ p.proses }}</span>
                    <span v-if="p.nama_dept" class="badge text-bg-light border shadow-sm"><i class="bi bi-building me-1 opacity-50"></i>{{ p.nama_dept }}</span>
                  </div>
                  <div class="text-muted small">xTarget: <span class="fw-semibold text-dark">{{ p.xTarget }}</span> <span class="mx-1">&bull;</span> IDP: {{ p.xPO }}</div>
                </div>
              </div>
              <div class="proc-panel-head-right" @click.stop>
                <div class="proc-qty-summary shadow-sm" :class="{ 'proc-qty-summary-warn': qtyMismatchProc(p) }">
                  <div class="proc-qty-summary-label">Total Qty Target</div>
                  <div class="proc-qty-summary-value">{{ totalQtyProc(p).toLocaleString('id-ID') }}</div>
                </div>
                <div class="form-check form-check-inline mb-0 bg-white border rounded px-2 py-1 shadow-sm ms-2">
                  <input :id="`chk14-${procKey(p)}`" v-model="p.hitung14jam" class="form-check-input ms-0 me-1" type="checkbox" />
                  <label class="form-check-label small fw-semibold text-danger" :for="`chk14-${procKey(p)}`">14 Jam</label>
                </div>
              </div>
            </div>

            <div v-show="p.open" class="proc-panel-body">
              <div v-if="p.days.length === 0" class="empty-state-small">Belum ada hari. Atur range tanggal di atas, lalu klik <b>Munculkan Hari</b>.</div>
              <div v-else>
                <!-- Kosongkan Form Button -->
                <div class="d-flex justify-content-between align-items-end mb-2">
                  <div class="text-muted small">
                    <i class="bi bi-info-circle me-1"></i> Edit isian akan <span class="fw-bold text-primary">otomatis mencentang</span> kotak. Pastikan kotak tercentang jika ingin disimpan!
                  </div>
                  <button class="btn btn-sm btn-outline-danger btn-reset-form shadow-sm" @click="resetFormProses(p)" title="Kosongkan form dan hapus data ini">
                    <i class="bi bi-eraser-fill me-1"></i> Kosongkan Form
                  </button>
                </div>

                <div class="table-responsive table-wrapper custom-scrollbar">
                  <table class="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th style="width: 40px" class="text-center"><input type="checkbox" class="form-check-input" :checked="semuaDipilihProc(p)" @change="toggleSemuaProc(p, $event.target.checked)" /></th>
                        <th style="width: 140px">Tanggal</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Qty Total/Hari</th>
                        <th>Alokasi Tim & Qty</th>
                        <th class="text-end" style="width: 130px">Terisi / Target</th>
                        <th style="width: 50px"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="day in p.days" :key="day.tgl_plan" :class="{ 'tr-disabled': !day.dipilih, 'tr-selected': day.dipilih }">
                        <td class="text-center"><input type="checkbox" class="form-check-input" v-model="day.dipilih" /></td>
                        <td>
                          <div class="fw-bold text-dark">{{ fmt(day.tgl_plan) }}</div>
                          <div class="text-muted" style="font-size: 0.75rem;">{{ namaHari(day.tgl_plan) }}</div>
                        </td>
                        <td>
                          <span v-if="day.isExisting" class="badge status-badge status-update shadow-sm"><i class="bi bi-pencil-square me-1"></i>Update</span>
                          <span v-else class="badge status-badge status-create shadow-sm"><i class="bi bi-plus-lg me-1"></i>Baru</span>
                        </td>
                        <td>
                          <div class="input-group input-group-sm mb-1 shadow-sm">
                            <input v-model.number="day.qty_target" @input="tandaiBerubah(day)" type="number" min="0" class="form-control qty-target-input text-center" placeholder="0" />
                          </div>
                          <button class="btn btn-sm btn-light w-100 btn-split-day text-primary fw-semibold" @click="autoSplitDay(day)" :disabled="!(day.qty_target > 0) || day.teams.length === 0">
                            <i class="bi bi-arrows-collapse me-1"></i>Bagi Rata Saja
                          </button>
                        </td>
                        <td class="py-2">
                          <div class="d-flex flex-column gap-2">
                            <div v-for="(t, i) in day.teams" :key="i" class="d-flex flex-column gap-1">
                               <div class="d-flex align-items-center gap-2">
                                  <div class="custom-select-wrap flex-grow-1" style="max-width: 280px;">
                                    <div class="input-group input-group-sm shadow-sm" :class="{'border border-danger': checkOverCapacity(p, day, t)}">
                                      <span class="input-group-text bg-white text-muted"><i class="bi bi-people-fill"></i></span>
                                      <input
                                        v-model="t.searchTeam"
                                        @focus="t.isOpen = true"
                                        @blur="onTeamBlur(t)"
                                        @input="tandaiBerubah(day)"
                                        class="form-control"
                                        placeholder="Ketik cari tim..."
                                      />
                                    </div>
                                    <div v-if="t.isOpen" class="custom-dropdown shadow-lg">
                                      <div
                                        v-for="tm in getFilteredTeams(t.searchTeam)"
                                        :key="tm.id"
                                        @mousedown.prevent="selectTeam(t, tm, day)"
                                        class="custom-dropdown-item d-flex justify-content-between align-items-center"
                                      >
                                        <span class="fw-semibold">{{ tm.nama_team }}</span>
                                        <span class="badge" :class="getSisaOrgDropdown(tm, day.tgl_plan, p, t) < 0 ? 'text-bg-danger' : 'text-bg-light border text-dark'">
                                            Sisa: {{ getSisaOrgDropdown(tm, day.tgl_plan, p, t) }} / {{ tm.jml_org }}
                                        </span>
                                      </div>
                                      <div v-if="getFilteredTeams(t.searchTeam).length === 0" class="custom-dropdown-item text-muted text-center py-2">
                                        Tim tidak ditemukan
                                      </div>
                                    </div>
                                  </div>

                                  <div class="input-group input-group-sm shadow-sm" style="width: 100px;">
                                    <input
                                      v-model.number="t.qty_plan_perteam" @input="tandaiBerubah(day)" type="number" min="0" class="form-control text-center fw-semibold"
                                      :placeholder="day.qty_target > 0 ? 'qty' : '-'" :disabled="!(day.qty_target > 0)"
                                    />
                                  </div>
                                  <button class="btn btn-sm btn-light text-danger shadow-sm rounded-circle px-2" @click="hapusTim(day, i)" title="Hapus baris tim ini">
                                    <i class="bi bi-x-lg"></i>
                                  </button>
                               </div>
                               <!-- Peringatan Over Capacity Realtime -->
                               <div v-if="t.team_id && checkOverCapacity(p, day, t)" class="text-danger ps-1" style="font-size: 0.75rem; font-weight: 600; line-height: 1.2;">
                                  <i class="bi bi-exclamation-triangle-fill"></i> Silahkan pilih tim lain, tim ini sisa_org tinggal {{ sisaRealtimeVal(p, day, t) }}
                               </div>
                            </div>
                          </div>
                          
                          <div class="d-flex align-items-center mt-2 pt-1 border-top border-light gap-3">
                            <button class="btn btn-sm text-primary fw-semibold p-0 action-link" @click="tambahTim(day)" :disabled="!(day.qty_target > 0)">
                              <i class="bi bi-plus-circle-fill me-1"></i>Tambah Tim
                            </button>
                            
                            <button
                              v-if="day.teams.length > 0 && day.teams[0].team_id"
                              class="btn btn-sm text-indigo fw-semibold p-0 action-link"
                              @click="bagiRataDanTerapkanKeSemua(p, day)"
                              title="Bagi rata lalu copy susunan tim dan target hari ini ke semua tanggal yang dicentang"
                            >
                              <i class="bi bi-files me-1"></i>Terapkan & Bagi Rata Ke Semua Tgl
                            </button>
                          </div>
                        </td>
                        <td class="text-end">
                          <span class="qty-total-badge shadow-sm" :class="qtyBadgeClass(day)">
                            {{ totalQtyHari(day).toLocaleString('id-ID') }} <span class="opacity-50 mx-1">/</span> {{ Number(day.qty_target || 0).toLocaleString('id-ID') }}
                          </span>
                        </td>
                        <td class="text-center">
                          <button v-if="day.isExisting" class="btn btn-sm btn-light text-danger shadow-sm rounded-circle px-2" @click="hapusTanggalProc(p, day.tgl_plan)" title="Hapus tanggal ini dari database">
                            <i class="bi bi-trash3-fill"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- REVIEW KAPASITAS FORM -->
                <div v-if="p.days.length" class="mt-3 bg-light rounded-3 p-3 border">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="fw-bold text-dark fs-6"><i class="bi bi-speedometer2 me-2 text-primary"></i>Kapasitas Tim (Review)</div>
                    <div v-if="p.loadingCapacity" class="badge text-bg-warning shadow-sm"><i class="spinner-border spinner-border-sm me-1"></i>Menghitung...</div>
                  </div>
                  <div class="table-responsive custom-scrollbar border bg-white rounded" style="max-height: 220px;">
                    <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.8rem;">
                      <thead class="table-light sticky-top">
                        <tr>
                          <th>Tanggal</th>
                          <th>Nama Tim</th>
                          <th class="text-end">Terpakai (Lain)</th>
                          <th class="text-end">Dari Form Ini</th>
                          <th class="text-end">Kapasitas Maks</th>
                          <th class="text-end">Sisa Orang</th>
                          <th>Pemakaian di xMark Lain</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(c, i) in kapasitasProc(p)" :key="i" :class="{ 'bg-danger-subtle': c.sisa < 0 }">
                          <td class="fw-semibold">{{ fmtShort(c.tgl_plan) }}</td>
                          <td class="fw-semibold text-primary">{{ c.nama_team }}</td>
                          <td class="text-end text-muted">{{ c.terpakai }}</td>
                          <td class="text-end fw-semibold">{{ c.dariForm }}</td>
                          <td class="text-end">{{ c.kapasitas }}</td>
                          <td class="text-end"><span class="badge" :class="c.sisa < 0 ? 'text-bg-danger' : 'text-bg-success'">{{ c.sisa }}</span></td>
                          <td>
                            <span v-if="c.detail.length === 0" class="text-muted small">&mdash;</span>
                            <div v-else class="detail-pemakaian-wrap">
                              <span v-for="(d, di) in c.detail" :key="di" class="detail-pemakaian-chip shadow-sm" :title="`${d.nama_work || ''} &middot; qty ${Number(d.qty_plan_perteam || 0).toLocaleString('id-ID')}`">
                                <i class="bi bi-tag-fill opacity-75 me-1"></i>{{ d.xMark }}
                                <span class="detail-pemakaian-qty bg-white text-dark ms-1 px-1 rounded">{{ d.worker_7jam }} org</span>
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr v-if="kapasitasProc(p).length === 0">
                          <td colspan="7" class="text-center text-muted py-3">Belum ada tim yang valid dipilih.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-if="kapasitasProc(p).some((c) => c.sisa < 0)" class="alert alert-danger py-2 px-3 mt-2 mb-0 d-flex align-items-center" style="font-size: 0.8rem;">
                    <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    Peringatan: Terdapat tim yang melebihi kapasitas di review form ini. Sistem akan menolak penyimpanan.
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <!-- ============================ AREA FOOTER BAWAH YG TETAP MUNCUL ============================ -->
        <div class="modal-foot flex-column align-items-stretch bg-light">
          
          <!-- Panel Pintasan Cepat (ringkas) -->
          <div v-show="showPintasanBawah" ref="pintasanRef" class="pintasan-panel qs-panel mb-2">
            <div class="qs-grid">

              <!-- 1. Range Tanggal -->
              <div class="qs-block">
                <div class="qs-label"><i class="bi bi-calendar-range"></i>Munculkan Hari</div>
                <div class="input-group input-group-sm">
                  <input type="date" class="form-control fw-semibold qs-date" v-model="groupRange.dari" title="Dari tanggal" />
                  <span class="input-group-text qs-sep"><i class="bi bi-arrow-right-short"></i></span>
                  <input type="date" class="form-control fw-semibold qs-date" v-model="groupRange.sampai" :min="groupRange.dari || ''" title="Sampai tanggal" />
                  <button class="btn btn-primary" @click="generateGroupHari" :disabled="!groupRange.dari || !groupRange.sampai || procsLoading">Munculkan</button>
                </div>
              </div>

              <!-- 2. Massal Qty -->
              <div class="qs-block">
                <div class="qs-label"><i class="bi bi-lightning-charge"></i>Terapkan Massal</div>
                <div class="input-group input-group-sm">
                  <input type="number" class="form-control fw-semibold qs-qty" v-model.number="bulkQtyTarget" placeholder="Qty total" min="0" />
                  <select class="form-select fw-semibold qs-scope" v-model="bulkScope">
                    <option value="all">Semua tercentang</option>
                    <option value="dept">Per Dept</option>
                  </select>
                  <select v-if="bulkScope === 'dept'" class="form-select fw-semibold qs-scope" v-model="bulkScopeDept">
                    <option value="">- Dept -</option>
                    <option v-for="d in deptListGroup" :key="d" :value="d">{{ d }}</option>
                  </select>
                  <button class="btn btn-outline-primary" @click="terapkanBulkQtyGroup" :disabled="!(bulkQtyTarget > 0) || (bulkScope === 'dept' && !bulkScopeDept)">Bagi Rata</button>
                </div>
              </div>

              <!-- 3. Aksi Cepat -->
              <div class="qs-block">
                <div class="qs-label"><i class="bi bi-toggles"></i>Aksi Cepat</div>
                <div class="btn-group btn-group-sm qs-actions">
                  <button class="btn btn-outline-primary" @click="toggleAllTanggal(true)" title="Centang semua tanggal"><i class="bi bi-check2-all"></i></button>
                  <button class="btn btn-outline-secondary" @click="toggleAllTanggal(false)" title="Kosongkan centang"><i class="bi bi-square"></i></button>
                  <button class="btn btn-outline-dark fw-semibold" @click="toggleAll14Jam(true)">14 Jam</button>
                  <button class="btn btn-outline-dark fw-semibold" @click="toggleAll14Jam(false)">7 Jam</button>
                </div>
              </div>

              <!-- 4. Fokus Proses (ringkas: popover multi-select) -->
              <div class="qs-block qs-block-focus">
                <div class="qs-label">
                  <i class="bi bi-funnel-fill"></i>Fokus Proses
                  <span class="qs-count" :class="{ 'qs-count-active': filterProcAktif }">{{ filteredProcs.length }}/{{ procs.length }}</span>
                </div>
                <div class="d-flex align-items-center gap-1">
                  <!-- Dept -->
                  <div class="fp-wrap">
                    <button type="button" class="fp-btn" :class="{ 'fp-btn-active': procFilterDept.length || openPop === 'dept' }" @click.stop="togglePop('dept', $event)">
                      <i class="bi bi-building"></i> Dept
                      <span v-if="procFilterDept.length" class="fp-badge">{{ procFilterDept.length }}</span>
                      <i class="bi bi-chevron-up fp-caret" :class="{ 'fp-caret-open': openPop === 'dept' }"></i>
                    </button>
                    <div v-if="openPop === 'dept'" class="fp-pop shadow-lg" :style="popStyle" @click.stop>
                      <input v-model="popSearchDept" class="form-control form-control-sm fp-search" placeholder="Cari departemen..." />
                      <div class="fp-list custom-scrollbar">
                        <label v-for="d in popDeptList" :key="d" class="custom-checkbox fp-item">
                          <input type="checkbox" :value="d" v-model="procFilterDept" />
                          <span class="label-text">{{ d }}</span>
                        </label>
                        <div v-if="!popDeptList.length" class="text-muted small p-2">Tidak ditemukan</div>
                      </div>
                      <div class="fp-foot">
                        <span>{{ procFilterDept.length }} dipilih</span>
                        <button type="button" class="fp-link" :disabled="!procFilterDept.length" @click="procFilterDept = []">Bersihkan</button>
                      </div>
                    </div>
                  </div>

                  <!-- Proses -->
                  <div class="fp-wrap">
                    <button type="button" class="fp-btn" :class="{ 'fp-btn-active': procFilterWork.length || openPop === 'work' }" @click.stop="togglePop('work', $event)">
                      <i class="bi bi-gear"></i> Proses
                      <span v-if="procFilterWork.length" class="fp-badge">{{ procFilterWork.length }}</span>
                      <i class="bi bi-chevron-up fp-caret" :class="{ 'fp-caret-open': openPop === 'work' }"></i>
                    </button>
                    <div v-if="openPop === 'work'" class="fp-pop shadow-lg" :style="popStyle" @click.stop>
                      <input v-model="popSearchWork" class="form-control form-control-sm fp-search" placeholder="Cari proses kerja..." />
                      <div class="fp-list custom-scrollbar">
                        <label v-for="w in popWorkList" :key="w" class="custom-checkbox fp-item">
                          <input type="checkbox" :value="w" v-model="procFilterWork" />
                          <span class="label-text">{{ w }}</span>
                        </label>
                        <div v-if="!popWorkList.length" class="text-muted small p-2">Tidak ditemukan</div>
                      </div>
                      <div class="fp-foot">
                        <span>{{ procFilterWork.length }} dipilih</span>
                        <button type="button" class="fp-link" :disabled="!procFilterWork.length" @click="procFilterWork = []">Bersihkan</button>
                      </div>
                    </div>
                  </div>

                  <button v-if="filterProcAktif" type="button" class="fp-clear" @click="resetFilterProc" title="Bersihkan semua filter proses">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Main Footer Bar -->
          <div class="d-flex justify-content-between align-items-center w-100 flex-wrap gap-3">
            <div class="d-flex align-items-center gap-2 flex-wrap">
               <!-- Info Hari -->
               <div class="d-flex align-items-center text-dark bg-white px-3 py-2 rounded-pill border shadow-sm">
                 <i class="bi bi-info-circle-fill text-primary me-2"></i>
                 <span class="small fw-semibold">
                  <span class="text-primary fs-6">{{ totalHariDipilih }}</span> hari diproses.
                 </span>
               </div>
               
               <div class="vr mx-1 d-none d-md-block text-muted"></div>
               
               <!-- Tombol Pintasan Cepat -->
               <button class="btn btn-outline-primary bg-white shadow-sm fw-semibold" style="padding: 0.4rem 1rem; font-size: 0.85rem;" @click="showPintasanBawah = !showPintasanBawah">
                  <i class="bi" :class="showPintasanBawah ? 'bi-chevron-down' : 'bi-tools'"></i> {{ showPintasanBawah ? 'Tutup Pintasan' : 'Pintasan Cepat' }}
                  <span v-if="filterProcAktif" class="fp-badge ms-1" title="Filter fokus proses aktif">{{ filteredProcs.length }}/{{ procs.length }}</span>
               </button>

               <button class="btn btn-outline-info bg-white shadow-sm fw-semibold" style="padding: 0.4rem 1rem; font-size: 0.85rem;" @click="refreshModalDataManual" :disabled="procsLoading" title="Tarik ulang data dari database">
                  <i class="bi bi-arrow-clockwise me-1"></i> Refresh Data
               </button>
            </div>
            
            <div class="d-flex gap-2 ms-auto">
              <button class="btn btn-white border fw-semibold shadow-sm" style="background: white; color: #64748b;" @click="tutupGroupModal">Batal & Tutup</button>
              <button class="btn btn-primary fw-bold shadow position-relative overflow-hidden btn-save px-4" @click="simpanGroup" :disabled="groupSubmitting || !anyDipilihGroup">
                <i class="bi me-1" :class="groupSubmitting ? 'bi-hourglass-split' : 'bi-floppy-fill'"></i> {{ groupSubmitting ? "Menyimpan Data..." : "Simpan Planning" }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API = `${API_BASE_URL}/planppcbaru`;

const searchText = ref("");
const loading = ref(false);
const sourceItems = ref([]);
const planningList = ref([]);
const teams = ref([]);

// State untuk Filter Fokus dan Aksi Tambahan
const advancedOpen = ref(false);
const procFilterDept = ref([]); 
const procFilterWork = ref([]);
const searchFilterDept = ref(""); 
const searchFilterWork = ref("");

// State Untuk Menu Pintasan di Bawah
const showPintasanBawah = ref(false);
const pintasanRef = ref(null);

// State popover Filter Fokus Proses versi ringkas (di Pintasan Cepat)
const openPop = ref(""); // "" | "dept" | "work"
const popSearchDept = ref("");
const popSearchWork = ref("");

const popStyle = ref({});
function togglePop(name, evt) {
  if (openPop.value === name) { openPop.value = ""; return; }
  // Hitung posisi dari tombol (fixed) & jepit agar selalu di dalam layar
  const r = evt?.currentTarget?.getBoundingClientRect();
  if (r) {
    const margin = 8;
    const width = Math.min(name === "work" ? 290 : 250, window.innerWidth - margin * 2);
    let left = r.right - width; // rata kanan dengan tombol
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    const bottom = window.innerHeight - r.top + 8;
    const maxListH = Math.max(90, Math.min(190, r.top - 150));
    popStyle.value = { left: `${left}px`, bottom: `${bottom}px`, width: `${width}px`, "--fp-list-h": `${maxListH}px` };
  }
  openPop.value = name;
  if (name === "dept") popSearchDept.value = "";
  if (name === "work") popSearchWork.value = "";
}
function closePop() { openPop.value = ""; }
function onDocClick(e) {
  if (!openPop.value) return;
  if (pintasanRef.value && pintasanRef.value.contains(e.target)) return;
  openPop.value = "";
}

// ---------------------------------------------------------------------------
// Load & Refresh
// ---------------------------------------------------------------------------
async function loadAll() {
  loading.value = true;
  try {
    const [src, tm, list] = await Promise.all([
      axios.get(`${API}/source`), axios.get(`${API}/teams`), axios.get(`${API}/list`),
    ]);
    sourceItems.value = src.data.data || [];
    teams.value = tm.data.data || [];
    planningList.value = list.data.data || [];
  } catch (err) {
    Swal.fire("Gagal", errMsg(err), "error");
  } finally { loading.value = false; }
}

onMounted(() => {
  loadAll();
  document.addEventListener("click", onDocClick);
  window.addEventListener("resize", closePop);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  window.removeEventListener("resize", closePop);
});
function refreshAll() { loadAll(); }
function refreshAfterChange() { loadAll(); }

// ---------------------------------------------------------------------------
// Katalog / Pengelompokan
// ---------------------------------------------------------------------------
function itemKey(row) { return `${row.xPO}|${row.xMark}|${row.rDept_ID}|${row.rWork_ID}`; }
function procKey(p) { return `${p.xPO}|${p.xMark}|${p.rDept_ID}|${p.rWork_ID}`; }

const catalog = computed(() => {
  const map = new Map();
  for (const row of planningList.value) map.set(itemKey(row), row);
  return sourceItems.value.map((row) => ({ ...row, existing: map.get(itemKey(row)) || null }));
});

function cocokCari(row) {
  const q = searchText.value.toLowerCase().trim();
  if (!q) return true;
  return [row.xPO, row.xMark, row.xProdNote, row.proses, row.nama_work].some((v) => (v || "").toString().toLowerCase().includes(q));
}

const filterDept = ref(""); const filterWork = ref("");
const deptOptions = computed(() => Array.from(new Set(sourceItems.value.map(r => r.nama_dept).filter(Boolean))).sort());
const workOptions = computed(() => Array.from(new Set(sourceItems.value.filter(r => !filterDept.value || r.nama_dept === filterDept.value).map(r => r.nama_work).filter(Boolean))).sort());

function resetFilter() { searchText.value = ""; filterDept.value = ""; filterWork.value = ""; }
function cocokDeptWork(row) {
  if (filterDept.value && row.nama_dept !== filterDept.value) return false;
  if (filterWork.value && row.nama_work !== filterWork.value) return false;
  return true;
}

const groupedCatalog = computed(() => {
  const map = new Map();
  for (const row of catalog.value) {
    if (!map.has(row.xMark)) map.set(row.xMark, { xMark: row.xMark, xPO: row.xPO, items: [] });
    map.get(row.xMark).items.push(row);
  }
  return Array.from(map.values());
});

const groupedFiltered = computed(() => {
  const q = searchText.value.toLowerCase().trim();
  return groupedCatalog.value.filter((g) => {
    if (filterDept.value || filterWork.value) { if (!g.items.some(cocokDeptWork)) return false; }
    if (!q) return true;
    return g.xMark.toLowerCase().includes(q) || g.xPO.toLowerCase().includes(q) || g.items.some(cocokCari);
  });
});

// ---------------------------------------------------------------------------
// Group Modal Setup
// ---------------------------------------------------------------------------
const groupModalOpen = ref(false);
const groupXMark = ref("");
const groupRange = ref({ dari: "", sampai: "" });
const groupSubmitting = ref(false);
const procsLoading = ref(false);
const procs = ref([]);

const bulkQtyTarget = ref(null);
const bulkScope = ref("all"); 
const bulkScopeDept = ref("");

// KUMPULAN ID DATABASE YANG DIHAPUS (X) OLEH USER SEBELUM DISIMPAN
const deletedPlanIds = ref([]); 

const deptListGroup = computed(() => Array.from(new Set(procs.value.map(p => p.nama_dept).filter(Boolean))));
const workListGroup = computed(() => Array.from(new Set(procs.value.filter(p => !procFilterDept.value.length || procFilterDept.value.includes(p.nama_dept)).map(p => p.nama_work || String(p.rWork_ID)).filter(Boolean))));

const visibleDeptList = computed(() => deptListGroup.value.filter(d => d.toLowerCase().includes(searchFilterDept.value.toLowerCase())));
const visibleWorkList = computed(() => workListGroup.value.filter(w => w.toLowerCase().includes(searchFilterWork.value.toLowerCase())));

const popDeptList = computed(() => deptListGroup.value.filter(d => d.toLowerCase().includes(popSearchDept.value.toLowerCase())));
const popWorkList = computed(() => workListGroup.value.filter(w => w.toLowerCase().includes(popSearchWork.value.toLowerCase())));
const filterProcAktif = computed(() => procFilterDept.value.length > 0 || procFilterWork.value.length > 0);

function resetFilterProc() {
  procFilterDept.value = []; procFilterWork.value = [];
  searchFilterDept.value = ""; searchFilterWork.value = "";
  popSearchDept.value = ""; popSearchWork.value = "";
}

const filteredProcs = computed(() => procs.value.filter((p) => {
    if (procFilterDept.value.length > 0 && !procFilterDept.value.includes(p.nama_dept)) return false;
    if (procFilterWork.value.length > 0 && !procFilterWork.value.includes(p.nama_work || String(p.rWork_ID))) return false;
    return true;
}));

async function openGroup(g) {
  groupXMark.value = g.xMark; groupRange.value = { dari: "", sampai: "" };
  groupSubmitting.value = false; bulkQtyTarget.value = null; advancedOpen.value = false; resetFilterProc();
  deletedPlanIds.value = []; // Reset memori ID yang dihapus saat form dibuka
  showPintasanBawah.value = false; // Tutup panel pintasan jika masih terbuka dari aksi sebelumnya
  openPop.value = "";

  procs.value = g.items.map((row) => ({
    xPO: row.xPO, xProdNote: row.xProdNote, xMark: row.xMark,
    rDept_ID: row.rDept_ID, rWork_ID: row.rWork_ID, nama_dept: row.nama_dept || "",
    xTarget: row.xTarget, nama_work: row.nama_work, proses: row.proses,
    hitung14jam: !row.default_hanya_7jam, selectedBulk: true,
    plannedDates: [], existingDetail: new Map(), days: [], capacityRaw: [],
    loadingCapacity: false, open: true,
  })).filter((p) => p.xPO && p.rDept_ID && p.rWork_ID);

  if (procs.value.length === 0) return;
  groupModalOpen.value = true; procsLoading.value = true;

  try {
    await Promise.all(
      procs.value.map(async (p) => {
        const [pd, dd] = await Promise.all([
          axios.get(`${API}/planned-dates`, { params: { xPO: p.xPO, xMark: p.xMark, rDept_ID: p.rDept_ID, rWork_ID: p.rWork_ID } }),
          axios.get(`${API}/detail-days`, { params: { xPO: p.xPO, xMark: p.xMark, rDept_ID: p.rDept_ID, rWork_ID: p.rWork_ID } }),
        ]);
        p.plannedDates = pd.data.data || [];
        if (dd.data.data) {
          p.hitung14jam = !!dd.data.data.hitung_14jam;
          for (const d of dd.data.data.days) {
            p.existingDetail.set(d.tgl_plan, d.teams.map((t) => {
                 const tmObj = teams.value.find(x => x.id === t.team_id);
                 return { plan_id: t.plan_id, team_id: t.team_id, qty_plan_perteam: t.qty_plan_perteam, searchTeam: tmObj ? tmObj.nama_team : "", isOpen: false }
            }));
          }
        }
      })
    );
  } catch (err) { Swal.fire("Gagal", errMsg(err), "error"); }
  finally { procsLoading.value = false; }
}

function generateGroupHari() {
  const { dari, sampai } = groupRange.value;
  if (!dari || !sampai) return;
  if (dari > sampai) return Swal.fire("Tanggal salah", "Mulai tidak boleh lebih dari selesai.", "warning");

  for (const p of procs.value) {
    const lama = new Map(p.days.map((d) => [d.tgl_plan, d]));
    const hasil = [];
    let cur = new Date(dari + "T00:00:00Z"); const end = new Date(sampai + "T00:00:00Z");
    
    while (cur <= end) {
      const s = cur.toISOString().slice(0, 10);
      if (lama.has(s)) hasil.push(lama.get(s));
      else if (p.existingDetail.has(s)) {
        const teamsExisting = p.existingDetail.get(s).map((t) => ({ ...t }));
        hasil.push({
          tgl_plan: s, dipilih: false, isExisting: true,
          qty_target: teamsExisting.reduce((sum, t) => sum + (Number(t.qty_plan_perteam) || 0), 0) || null,
          teams: teamsExisting,
        });
      } else {
        hasil.push({ tgl_plan: s, dipilih: false, isExisting: false, qty_target: null, teams: [{ plan_id: null, team_id: "", qty_plan_perteam: null, searchTeam: "", isOpen: false }] });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    p.days = hasil;
    loadProcCapacity(p);
  }
}

async function resetFormProses(p) {
  const c = await Swal.fire({
    title: "Kosongkan & Hapus Masal?",
    html: `Seluruh isian pada proses <b>${p.nama_work || p.rWork_ID}</b> akan dibersihkan dari layar.<br><br><span class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Peringatan: Jika ada data planning yang sudah tersimpan, datanya akan dihapus permanen dari database secara masal!</span>`,
    icon: "warning", 
    showCancelButton: true, 
    confirmButtonColor: "#e11d48", 
    confirmButtonText: "Ya, Kosongkan & Hapus"
  });

  if (!c.isConfirmed) return;

  // 1. Kumpulkan semua tanggal yang sudah tersimpan di DB (isExisting) dari form ini
  const datesToDelete = p.days.filter((d) => d.isExisting).map((d) => d.tgl_plan);

  // 2. Jika ada tanggal existing, tembak API delete-dates masal sekaligus
  if (datesToDelete.length > 0) {
    try {
      await axios.post(`${API}/delete-dates`, { 
        xPO: p.xPO, 
        xMark: p.xMark, 
        rDept_ID: p.rDept_ID, 
        rWork_ID: p.rWork_ID, 
        dates: datesToDelete 
      });
      
      // Bersihkan cache existing memori agar bisa dibuat ulang nanti
      datesToDelete.forEach((tgl) => p.existingDetail.delete(tgl));
      p.plannedDates = p.plannedDates.filter((d) => !datesToDelete.includes(d));
      
      // Refresh rekap data latar belakang (seperti badge qty di katalog)
      refreshAfterChange(); 
    } catch (e) {
      return Swal.fire("Gagal Menghapus", errMsg(e), "error");
    }
  }

  // 3. Bersihkan form di antarmuka (UI)
  p.days = []; 
  p.capacityRaw = []; 
  p.selectedBulk = false;
  
  Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
    .fire({ icon: 'success', title: 'Form dikosongkan & data terhapus' });
}

// ---------------------------------------------------------------------------
// Fitur Auto Check & Hapus (Kumpulkan ID yang hilang)
// ---------------------------------------------------------------------------
function tandaiBerubah(day) {
  day.dipilih = true;
}

function hapusTim(day, index) {
  const removed = day.teams[index];
  // PENTING: Jika tim yang dihapus sudah ada di database, simpan ID-nya ke array!
  if (removed.plan_id) {
    deletedPlanIds.value.push(removed.plan_id);
  }
  
  day.teams.splice(index, 1);
  tandaiBerubah(day);
}

function tambahTim(day) {
  if (!(day.qty_target > 0)) return;
  day.teams.push({ plan_id: null, team_id: '', qty_plan_perteam: null, searchTeam: '', isOpen: false });
  tandaiBerubah(day);
}

// ---------------------------------------------------------------------------
// Kebutuhan Orang & Kapasitas
// ---------------------------------------------------------------------------
function hitungWorkerProc(p, qty) {
  const target = Number(p.xTarget) || 0;
  if (!target || !qty) return 0;
  
  const base = qty / target / 7;
  let hasil = [34097, 33489].includes(Number(p.rWork_ID)) ? base - (base * 0.4) : base + (base * 0.2);
  let orang = Math.round(hasil - 0.0001);
  
  if (p.hitung14jam) {
      orang = orang * 2;
  }
  return orang;
}

function getSisaOrgDropdown(tm, tgl_plan, p, currentTeamObj) {
    let jml_org = tm.jml_org || 0;
    
    let terpakaiDB = 0;
    if(p.capacityRaw) {
       const db = p.capacityRaw.filter(c => c.team_id === tm.id && c.tgl_plan === tgl_plan && c.xPO);
       terpakaiDB = db.reduce((s, c) => s + (Number(c.worker_7jam) || 0) + (Number(c.worker_14jam) || 0), 0);
    }

    let terpakaiUI = 0;
    for (const proc of filteredProcs.value) {
        const d = proc.days.find(x => x.tgl_plan === tgl_plan);
        if (d && d.dipilih) {
            for (const t of d.teams) {
                if (t.team_id === tm.id && t !== currentTeamObj) {
                    terpakaiUI += hitungWorkerProc(proc, Number(t.qty_plan_perteam) || 0);
                }
            }
        }
    }
    return jml_org - terpakaiDB - terpakaiUI;
}

function sisaRealtimeVal(p, day, t) {
     if(!t.team_id) return 0;
     const tm = teams.value.find(x => x.id === t.team_id);
     if(!tm) return 0;
     return getSisaOrgDropdown(tm, day.tgl_plan, p, t);
}

function checkOverCapacity(p, day, t) {
     if(!t.team_id || !(t.qty_plan_perteam > 0)) return false;
     const tm = teams.value.find(x => x.id === t.team_id);
     if(!tm) return false;
     const sisaSebelumnya = getSisaOrgDropdown(tm, day.tgl_plan, p, t);
     const ygDibutuhkan = hitungWorkerProc(p, Number(t.qty_plan_perteam));
     return ygDibutuhkan > sisaSebelumnya; 
}

// Custom Search Teams
function getFilteredTeams(q) {
  if (!q) return teams.value;
  return teams.value.filter(x => x.nama_team.toLowerCase().includes(q.toLowerCase()));
}
function selectTeam(t, tm, day) { 
  t.team_id = tm.id; 
  t.searchTeam = tm.nama_team; 
  t.isOpen = false; 
  if (day) tandaiBerubah(day); 
}
function onTeamBlur(t) {
  setTimeout(() => {
    t.isOpen = false;
    if (t.team_id) {
      const ex = teams.value.find(x => x.id === t.team_id);
      if (ex && ex.nama_team !== t.searchTeam) t.searchTeam = ex.nama_team;
    } else t.searchTeam = ""; 
  }, 150);
}

// ---------------------------------------------------------------------------
// Fitur Bagi Rata & Terapkan
// ---------------------------------------------------------------------------
function hariDipilihProc(p) { return p.days.filter((d) => d.dipilih); }
function semuaDipilihProc(p) { return p.days.length > 0 && p.days.every((d) => d.dipilih); }
function toggleSemuaProc(p, val) { p.days.forEach((d) => (d.dipilih = val)); }
function totalQtyHari(day) { return day.teams.reduce((s, t) => s + (Number(t.qty_plan_perteam) || 0), 0); }
function totalQtyProc(p) { return hariDipilihProc(p).reduce((s, d) => s + totalQtyHari(d), 0); }
function qtyMismatchProc(p) { return hariDipilihProc(p).some((d) => d.qty_target > 0 && totalQtyHari(d) !== Number(d.qty_target)); }
function qtyBadgeClass(day) {
  if (!(day.qty_target > 0)) return "qty-badge-neutral";
  return totalQtyHari(day) === Number(day.qty_target) ? "qty-badge-ok" : "qty-badge-warn";
}

function autoSplitDay(day) {
  const n = day.teams.length;
  if (!n || !(day.qty_target > 0)) return;
  const target = Number(day.qty_target); const base = Math.floor(target / n); const sisa = target - base * n;
  day.teams.forEach((t, i) => { t.qty_plan_perteam = base + (i === 0 ? sisa : 0); });
  tandaiBerubah(day);
}

function bagiRataDanTerapkanKeSemua(p, refDay) {
  if (refDay.teams.length === 0 || !refDay.teams[0].team_id) return Swal.fire("Pilih Tim", "Silakan cari dan pilih tim terlebih dahulu.", "warning");
  if (!(refDay.qty_target > 0)) return Swal.fire("Isi Qty", "Silakan isi Qty Target pada tanggal ini.", "warning");

  autoSplitDay(refDay);
  const teamsToCopy = refDay.teams.map(t => ({...t, isOpen: false, plan_id: null})); 
  
  let count = 0;
  for (const d of p.days) {
    if (d.tgl_plan !== refDay.tgl_plan) {
      d.teams.forEach(t => {
         if (t.plan_id) deletedPlanIds.value.push(t.plan_id);
      });

      d.qty_target = refDay.qty_target;
      d.teams = teamsToCopy.map(t => ({...t}));
      tandaiBerubah(d);
      count++;
    }
  }
  Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 }).fire({ icon: 'success', title: `Diterapkan ke ${count} tgl lain` });
}

function terapkanBulkQtyGroup() {
  if (!(bulkQtyTarget.value > 0)) return;
  const target = filteredProcs.value.filter((p) => p.selectedBulk && (bulkScope.value === "all" || p.nama_dept === bulkScopeDept.value));
  if (!target.length) return Swal.fire("Kosong", "Tidak ada proses sesuai kriteria filter.", "info");

  for (const p of target) {
    for (const d of hariDipilihProc(p)) {
      d.qty_target = bulkQtyTarget.value;
      if (d.teams.length === 0) d.teams.push({ plan_id: null, team_id: "", qty_plan_perteam: null, searchTeam: "", isOpen: false });
      autoSplitDay(d);
    }
  }
}

function toggleAllTanggal(val) { for (const p of filteredProcs.value) toggleSemuaProc(p, val); }
function toggleAll14Jam(val) { for (const p of filteredProcs.value) p.hitung14jam = val; }

// ---------------------------------------------------------------------------
// Capacity (DB Fetch)
// ---------------------------------------------------------------------------
async function loadProcCapacity(p) {
  const tanggal = p.days.map((d) => d.tgl_plan).sort();
  if (tanggal.length === 0) { p.capacityRaw = []; return; }
  p.loadingCapacity = true;
  try {
    const params = { tgl_dari: tanggal[0], tgl_sampai: tanggal[tanggal.length - 1], exclude_xPO: p.xPO, exclude_xMark: p.xMark, exclude_rDept_ID: p.rDept_ID, exclude_rWork_ID: p.rWork_ID };
    const { data } = await axios.get(`${API}/capacity-detail`, { params });
    p.capacityRaw = data.data || [];
  } catch (err) { console.error(err); } finally { p.loadingCapacity = false; }
}

function kapasitasProc(p) {
  const out = [];
  const teamById = new Map(teams.value.map((t) => [t.id, t]));

  for (const day of p.days) {
    for (const t of day.teams) {
      if (!t.team_id) continue;
      const tm = teamById.get(t.team_id);
      if (!tm) continue;

      const pemakaianLain = p.capacityRaw.filter((c) => c.team_id === t.team_id && c.tgl_plan === day.tgl_plan && c.xPO);
      const terpakai = pemakaianLain.reduce((s, c) => s + (Number(c.worker_7jam) || 0) + (Number(c.worker_14jam) || 0), 0);
      const dariForm = day.dipilih ? hitungWorkerProc(p, Number(t.qty_plan_perteam) || 0) : 0;

      const exist = out.find(x => x.tgl_plan === day.tgl_plan && x.nama_team === tm.nama_team);
      if(exist) {
          exist.dariForm += dariForm;
          exist.sisa -= dariForm;
      } else {
          out.push({
            tgl_plan: day.tgl_plan, nama_team: tm.nama_team, kapasitas: tm.jml_org,
            terpakai, dariForm, sisa: (tm.jml_org || 0) - terpakai - dariForm,
            detail: pemakaianLain.map((c) => ({ xMark: c.xMark, nama_work: c.nama_work, qty_plan_perteam: c.qty_plan_perteam, worker_7jam: (Number(c.worker_7jam)||0)+(Number(c.worker_14jam)||0) })),
          });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Simpan, Refresh Data & Validasi
// ---------------------------------------------------------------------------
const anyDipilihGroup = computed(() => filteredProcs.value.some((p) => p.days.some((d) => d.dipilih)));
const totalHariDipilih = computed(() => filteredProcs.value.reduce((s, p) => s + hariDipilihProc(p).length, 0));

function validasiGroup() {
  for (const p of filteredProcs.value) {
    for (const d of hariDipilihProc(p)) {
      const idSet = new Set();
      for (const t of d.teams) {
        const label = `${p.nama_work || p.rWork_ID} tgl ${d.tgl_plan}`;
        if (!t.team_id) return `${label}: Ada baris tim yang kosong/belum terpilih.`;
        if (!(Number(t.qty_plan_perteam) > 0)) return `${label}: Qty tim harus > 0.`;
        if (idSet.has(t.team_id)) return `${label}: Tim yang sama ganda dalam 1 hari.`;
        idSet.add(t.team_id);
        
        if (checkOverCapacity(p, d, t)) return `${label}: Tim ${t.searchTeam} melebihi batas kapasitas (Sisa kurang).`;
      }
      if (d.qty_target > 0) {
        if (totalQtyHari(d) !== Number(d.qty_target)) return `${p.nama_work || p.rWork_ID} tgl ${d.tgl_plan}: Total qty alokasi tim belum sama dengan Qty Target.`;
      }
    }
  }
  return null;
}

async function refreshModalData() {
  procsLoading.value = true;
  try {
    await Promise.all(
      procs.value.map(async (p) => {
        const [pd, dd] = await Promise.all([
          axios.get(`${API}/planned-dates`, { params: { xPO: p.xPO, xMark: p.xMark, rDept_ID: p.rDept_ID, rWork_ID: p.rWork_ID } }),
          axios.get(`${API}/detail-days`, { params: { xPO: p.xPO, xMark: p.xMark, rDept_ID: p.rDept_ID, rWork_ID: p.rWork_ID } }),
        ]);
        p.plannedDates = pd.data.data || [];
        p.existingDetail = new Map();
        if (dd.data.data) {
          p.hitung14jam = !!dd.data.data.hitung_14jam;
          for (const d of dd.data.data.days) {
            p.existingDetail.set(d.tgl_plan, d.teams.map((t) => {
                 const tmObj = teams.value.find(x => x.id === t.team_id);
                 return { plan_id: t.plan_id, team_id: t.team_id, qty_plan_perteam: t.qty_plan_perteam, searchTeam: tmObj ? tmObj.nama_team : "", isOpen: false }
            }));
          }
        }
      })
    );
    generateGroupHari();
  } catch (err) {
    console.error("Gagal refresh data modal:", err);
  } finally {
    procsLoading.value = false;
  }
}

async function refreshModalDataManual() {
  if (!groupRange.value.dari || !groupRange.value.sampai) {
    return Swal.fire("Pilih Tanggal", "Isi rentang tanggal terlebih dahulu.", "info");
  }
  for (const p of procs.value) { p.days = []; }
  await refreshModalData();
  Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
      .fire({ icon: 'success', title: 'Data form diperbarui' });
}

async function simpanGroup() {
  const err = validasiGroup();
  if (err) return Swal.fire("Validasi Gagal", err, "warning");

  const createItems = [], updateItems = [];
  for (const p of filteredProcs.value) {
    const dipilih = hariDipilihProc(p);
    const newDays = dipilih.filter((d) => !d.isExisting); 
    const existDays = dipilih.filter((d) => d.isExisting);
    const base = { xPO: p.xPO, xProdNote: p.xProdNote, xMark: p.xMark, rDept_ID: p.rDept_ID, rWork_ID: p.rWork_ID, xTarget: p.xTarget, hitung_14jam: p.hitung14jam };
    const toDays = (arr) => arr.map((d) => ({ tgl_plan: d.tgl_plan, teams: d.teams.map((t) => ({ team_id: t.team_id, qty_plan_perteam: Number(t.qty_plan_perteam) })) }));

    if (newDays.length) createItems.push({ ...base, days: toDays(newDays) });
    if (existDays.length) updateItems.push({ ...base, days: toDays(existDays) });
  }

  const konfirmasi = await Swal.fire({
    title: "Simpan Planning?", html: `Menyimpan <b>${totalHariDipilih.value} hari</b> planning.`, icon: "question", showCancelButton: true, confirmButtonText: "Ya, Simpan"
  });
  if (!konfirmasi.isConfirmed) return;

  groupSubmitting.value = true;
  try {
    if (createItems.length) await axios.post(`${API}/create`, { items: createItems });
    if (updateItems.length) await axios.post(`${API}/update`, { items: updateItems });
    
    // TEMBAK ENDPOINT DELETE UNTUK SEMUA ID YANG TADI DIHAPUS VIA TOMBOL (X)
    if (deletedPlanIds.value.length > 0) {
      await axios.post(`${API}/delete`, { ids: deletedPlanIds.value });
      deletedPlanIds.value = []; // Reset setelah sukses dieksekusi
    }

    for (const p of filteredProcs.value) {
      const dipilih = hariDipilihProc(p);
      for (const d of dipilih) {
        d.isExisting = true; 
        d.dipilih = false;   
      }
    }

    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
    Toast.fire({ icon: 'success', title: 'Planning berhasil disimpan' });
    
    refreshAfterChange(); 
    await refreshModalData();
    
  } catch (e) { 
    Swal.fire("Gagal", errMsg(e), "error"); 
  } finally { 
    groupSubmitting.value = false; 
  }
}

async function hapusTanggalProc(p, tgl) {
  const c = await Swal.fire({ 
    title: "Hapus Tanggal?", 
    text: "Akan dihapus permanen.", 
    icon: "warning", 
    showCancelButton: true, 
    confirmButtonColor: "#dc3545", 
    confirmButtonText: "Ya, Hapus" 
  });
  if (!c.isConfirmed) return;
  
  try {
    await axios.post(`${API}/delete-dates`, { 
      xPO: p.xPO, 
      xMark: p.xMark, 
      rDept_ID: p.rDept_ID, 
      rWork_ID: p.rWork_ID, 
      dates: [tgl] 
    });
    
    p.days = p.days.filter((d) => d.tgl_plan !== tgl);
    p.existingDetail.delete(tgl);
    p.plannedDates = p.plannedDates.filter((d) => d !== tgl);

    Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
      .fire({ icon: 'success', title: 'Tanggal Berhasil Dihapus' });
      
    refreshAfterChange();
    loadProcCapacity(p); 
  } catch (e) { 
    Swal.fire("Gagal", errMsg(e), "error"); 
  }
}

function tutupGroupModal() { if (groupSubmitting.value) return; groupModalOpen.value = false; procs.value = []; showPintasanBawah.value = false; openPop.value = ""; }
function fmt(v) { return v ? String(v).slice(0, 10) : "-"; }
function fmtShort(v) { if (!v) return "-"; const [y, m, d] = String(v).slice(0, 10).split("-"); return `${d}/${m}/${y.slice(2)}`; }
function namaHari(tgl) { const h = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]; return h[new Date(tgl + "T00:00:00Z").getUTCDay()]; }
function errMsg(err) { return err?.response?.data?.message || err.message || "Kesalahan sistem."; }
</script>

<style scoped>
.planning-page {
  --pp-primary: #4f46e5; --pp-primary-hover: #4338ca; --pp-primary-soft: #e0e7ff;
  --pp-indigo: #6366f1; --pp-success: #10b981; --pp-success-soft: #d1fae5;
  --pp-warning: #f59e0b; --pp-danger: #ef4444; --pp-danger-soft: #fee2e2;
  --pp-bg: #f8fafc; --pp-border: #e2e8f0; --pp-ink: #0f172a; --pp-ink-soft: #64748b;
  --pp-radius-lg: 16px; --pp-radius-md: 12px; --pp-radius-sm: 8px;
  color: var(--pp-ink); font-family: 'Inter', system-ui, sans-serif; background-color: var(--pp-bg); min-height: 100vh;
}
.text-indigo { color: var(--pp-primary) !important; }
.bg-indigo { background-color: var(--pp-primary) !important; }
.text-bg-indigo { background-color: var(--pp-primary-soft); color: var(--pp-primary-hover); font-weight: 600; }
.btn { font-weight: 500; border-radius: var(--pp-radius-sm); transition: all 0.2s; }
.btn-primary { background-color: var(--pp-primary); border-color: var(--pp-primary); }
.btn-primary:hover:not(:disabled) { background-color: var(--pp-primary-hover); border-color: var(--pp-primary-hover); transform: translateY(-1px); }
.btn-outline-primary { color: var(--pp-primary); border-color: var(--pp-primary); }
.btn-outline-primary:hover { background-color: var(--pp-primary); color: #fff; }
.btn-light { background-color: #ffffff; border: 1px solid var(--pp-border); color: var(--pp-ink-soft); }
.btn-reset-form { font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 6px; color: #e11d48; border-color: #fda4af; background: #fff; }
.btn-reset-form:hover { background: #e11d48; color: #fff; }
.form-control, .form-select { border-radius: var(--pp-radius-sm); border: 1px solid var(--pp-border); font-size: 0.875rem; }
.form-control:focus, .form-select:focus { border-color: var(--pp-indigo); box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.25); }
.custom-select-wrap { position: relative; }
.custom-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid var(--pp-border); border-radius: var(--pp-radius-sm); max-height: 180px; overflow-y: auto; z-index: 1060; }
.custom-dropdown-item { padding: 0.5rem 0.75rem; font-size: 0.85rem; cursor: pointer; border-bottom: 1px solid #f1f5f9; color: var(--pp-ink); }
.custom-dropdown-item:last-child { border-bottom: none; }
.custom-dropdown-item:hover { background: var(--pp-primary-soft); color: var(--pp-primary-hover); }
.action-link { text-decoration: none; transition: opacity 0.2s; }
.action-link:hover { opacity: 0.7; }
.filter-toolbar { background: #fff; border-radius: var(--pp-radius-md); padding: 1rem; display: flex; flex-wrap: wrap; gap: 0.75rem; border: 1px solid var(--pp-border); }
.search-wrap { position: relative; flex: 1 1 280px; }
.search-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--pp-ink-soft); }
.search-input { padding-left: 2.2rem; padding-right: 2rem; border-radius: 999px; }
.btn-clear-search { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); border: none; background: transparent; color: var(--pp-ink-soft); }
.filter-select-wrap { position: relative; min-width: 200px; }
.filter-select-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--pp-ink-soft); pointer-events: none; }
.filter-select { padding-left: 2.2rem !important; border-radius: 999px; }
.btn-reset-filter { border-radius: 999px; }
.empty-hint { text-align: center; padding: 4rem 1rem; background: #fff; border-radius: var(--pp-radius-md); border: 1px dashed #cbd5e1; }
.empty-state-small { text-align: center; padding: 2rem 1rem; color: var(--pp-ink-soft); background: #f8fafc; border-radius: var(--pp-radius-sm); border: 1px dashed var(--pp-border); }
.group-list { display: flex; flex-direction: column; gap: 1rem; }
.group-card { background: #fff; border-radius: var(--pp-radius-md); padding: 1.25rem; border: 1px solid var(--pp-border); border-left: 4px solid var(--pp-indigo); }
.group-card-main { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.xmark-chip { font-weight: 700; color: var(--pp-primary-hover); font-size: 1.1rem; }
.xpo-chip { background: #f1f5f9; color: var(--pp-ink-soft); font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 500; }
.proc-count-badge { background: var(--pp-primary-soft); color: var(--pp-primary-hover); border-radius: 999px; padding: 0.3em 0.8em; }
.proc-chip-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.proc-chip { font-size: 0.75rem; border-radius: 999px; padding: 0.3em 0.7em; display: inline-flex; align-items: center; border: 1px solid transparent; font-weight: 500;}
.proc-chip-has { background: var(--pp-success-soft); color: #065f46; border-color: #a7f3d0; }
.proc-chip-none { background: #f1f5f9; color: var(--pp-ink-soft); border-color: var(--pp-border); }
.btn-manage { background: linear-gradient(135deg, var(--pp-primary), var(--pp-primary-hover)); color: #fff; border-radius: 999px; padding: 0.5rem 1.25rem; font-weight: 600; }
.modal-backdrop-custom { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1055; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
.modal-card { background: #f8fafc; border-radius: var(--pp-radius-lg); width: 100%; max-height: 94vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-card-xl { max-width: 1280px; }
.modal-head { background: #fff; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--pp-border); display: flex; align-items: center; justify-content: space-between; }
.icon-box-primary { width: 36px; height: 36px; background: var(--pp-primary-soft); color: var(--pp-primary-hover); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.modal-foot { background: #fff; padding: 1rem 1.5rem; border-top: 1px solid var(--pp-border); display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1080; box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05); }
.modal-body-custom { padding: 1.5rem; overflow-y: auto; flex: 1; }
.toolbar-card { background: #fff; border-radius: var(--pp-radius-md); padding: 1.25rem; border: 1px solid var(--pp-border); }
.qty-tool-card { border-left: 4px solid var(--pp-warning); }
.proc-filter-card { border-left: 4px solid var(--pp-indigo); background: linear-gradient(to right, #ffffff, #fbfbfe); }
.advanced-panel-title { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--pp-ink-soft); margin-bottom: 0.5rem; }
.multi-select-box { border: 1px solid var(--pp-border); border-radius: var(--pp-radius-sm); padding: 0.5rem; background: #fff; }
.multi-select-list { max-height: 140px; overflow-y: auto; padding-right: 0.5rem; }
.custom-checkbox { display: flex; align-items: center; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 6px; transition: background 0.2s; }
.custom-checkbox:hover { background: #f1f5f9; }
.custom-checkbox input { margin-right: 0.5rem; accent-color: var(--pp-primary); width: 1rem; height: 1rem; cursor: pointer;}
.custom-checkbox .label-text { font-size: 0.85rem; color: var(--pp-ink); }
.proc-panel { background: #fff; border-radius: var(--pp-radius-md); border: 1px solid var(--pp-border); margin-bottom: 1rem; overflow: hidden; }
.proc-panel-head { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; cursor: pointer; }
.proc-panel-head-left, .proc-panel-head-right { display: flex; align-items: center; gap: 1rem; }
.proc-qty-summary { background: var(--pp-bg); border: 1px solid var(--pp-border); padding: 0.3rem 0.8rem; border-radius: 8px; text-align: right; }
.proc-qty-summary-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: var(--pp-ink-soft); }
.proc-qty-summary-value { font-size: 1.1rem; font-weight: 800; color: var(--pp-primary-hover); line-height: 1; }
.proc-qty-summary-warn { background: var(--pp-danger-soft); border-color: #fecaca; }
.proc-qty-summary-warn .proc-qty-summary-value { color: #b91c1c; }
.proc-panel-body { padding: 1.25rem; border-top: 1px solid var(--pp-border); background: #fafafb; }
.table-wrapper { border: 1px solid var(--pp-border); border-radius: 10px; background: #fff; }
.table thead th { background: #f8fafc; color: var(--pp-ink-soft); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; padding: 0.75rem; }
.tr-disabled td { opacity: 0.5; background: #f8fafc; }
.tr-selected td { background-color: #f0f9ff !important; border-bottom-color: #bae6fd; }
.status-badge { font-size: 0.7rem; padding: 0.3em 0.6em; border-radius: 999px; font-weight: 600; }
.status-create { background: var(--pp-primary-soft); color: var(--pp-primary-hover); }
.status-update { background: #ffedd5; color: #c2410c; }
.qty-target-input { font-weight: 700; color: var(--pp-primary-hover); }
.qty-total-badge { font-size: 0.85rem; padding: 0.3em 0.8em; border-radius: 999px; font-weight: 700; display: inline-block; }
.qty-badge-neutral { background: #f1f5f9; color: var(--pp-ink-soft); }
.qty-badge-ok { background: var(--pp-success-soft); color: #065f46; }
.qty-badge-warn { background: var(--pp-danger-soft); color: #b91c1c; }
.detail-pemakaian-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
.detail-pemakaian-chip { font-size: 0.7rem; background: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 6px; font-weight: 600; display: inline-flex; align-items: center; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
/* ===== Pintasan Cepat (ringkas) ===== */
.qs-panel { background: #fff; border: 1px solid var(--pp-border); border-radius: var(--pp-radius-md); padding: 0.6rem 0.85rem; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
.qs-grid { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.6rem 1.1rem; }
.qs-block { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.qs-block + .qs-block { padding-left: 1.1rem; border-left: 1px solid var(--pp-border); }
.qs-block-focus { margin-left: auto; }
.qs-label { font-size: 0.7rem; font-weight: 700; color: var(--pp-primary); display: flex; align-items: center; gap: 0.35rem; line-height: 1; }
.qs-count { font-weight: 600; font-size: 0.65rem; color: var(--pp-ink-soft); background: #f1f5f9; border-radius: 999px; padding: 0.15em 0.55em; }
.qs-count-active { background: var(--pp-primary-soft); color: var(--pp-primary-hover); }
.qs-date { max-width: 128px; }
.qs-qty { max-width: 92px; }
.qs-scope { max-width: 138px; }
.qs-sep { background: #f8fafc; padding: 0 0.15rem; color: var(--pp-ink-soft); }
.qs-panel .input-group-sm > .form-control, .qs-panel .input-group-sm > .form-select, .qs-panel .btn-sm { font-size: 0.78rem; }
.qs-actions .btn { background: #fff; }
.qs-actions .btn:hover { background: var(--pp-primary); color: #fff; }

/* Popover filter fokus proses */
.fp-wrap { position: relative; }
.fp-btn { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 600; color: var(--pp-ink-soft); background: #fff; border: 1px solid var(--pp-border); border-radius: 999px; padding: 0.28rem 0.7rem; line-height: 1.2; transition: all 0.15s; }
.fp-btn:hover { border-color: var(--pp-indigo); color: var(--pp-primary-hover); }
.fp-btn-active { border-color: var(--pp-indigo); background: var(--pp-primary-soft); color: var(--pp-primary-hover); }
.fp-caret { font-size: 0.6rem; transition: transform 0.2s; }
.fp-caret-open { transform: rotate(180deg); }
.fp-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 1.15rem; height: 1.15rem; padding: 0 0.35rem; border-radius: 999px; background: var(--pp-primary); color: #fff; font-size: 0.65rem; font-weight: 700; line-height: 1; }
.fp-clear { width: 1.7rem; height: 1.7rem; border-radius: 50%; border: 1px solid #fecaca; background: #fff; color: #e11d48; font-size: 0.7rem; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
.fp-clear:hover { background: #e11d48; color: #fff; }
.fp-pop { position: fixed; background: #fff; border: 1px solid var(--pp-border); border-radius: var(--pp-radius-md); padding: 0.5rem; z-index: 1070; }
.fp-search { border-radius: 999px; font-size: 0.78rem; margin-bottom: 0.4rem; }
.fp-list { max-height: var(--fp-list-h, 190px); overflow-y: auto; padding-right: 0.2rem; }
.fp-item { padding: 0.2rem 0.4rem; margin: 0; }
.fp-item .label-text { font-size: 0.8rem; }
.fp-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid #f1f5f9; font-size: 0.7rem; color: var(--pp-ink-soft); }
.fp-link { border: none; background: transparent; color: #e11d48; font-weight: 600; font-size: 0.72rem; padding: 0; }
.fp-link:disabled { color: #cbd5e1; cursor: default; }
@media (max-width: 991px) {
  .qs-block + .qs-block { padding-left: 0; border-left: none; }
  .qs-block-focus { margin-left: 0; }
}
</style>