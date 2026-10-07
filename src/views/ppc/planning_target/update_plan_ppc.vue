<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft mt-4">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <!-- ============================================= -->
    <!-- TEAM PICKER (teleport ke <body> supaya TIDAK PERNAH ketutupan  -->
    <!-- oleh overflow tabel Finishing/Linking, dan ada search box)    -->
    <!-- ============================================= -->
    <Teleport to="body">
      <div
        v-if="openTeamPicker"
        class="team-picker-teleport-panel shadow-lg"
        :style="{ top: teamPickerPos.top + 'px', left: teamPickerPos.left + 'px', width: teamPickerPos.width + 'px' }"
        @click.stop
      >
        <div class="team-picker-header">
          <div>
            <span class="team-picker-title">Pilih Team <span v-if="openTeamPicker" class="team-picker-dept-tag">{{ openTeamPicker.deptLabel }}</span></span>
            <span class="team-picker-selected-count">{{ selectedCountForPicker }} dipilih</span>
          </div>
          <button type="button" class="team-picker-close-btn" @click="closeTeamDropdown">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="team-picker-search-box">
          <i class="bi bi-search"></i>
          <input type="text" v-model="teamPickerSearch" placeholder="Cari nama team..." autofocus>
        </div>

        <div class="team-picker-list custom-scrollbar">
          <div v-if="activeTeamMasterList.length === 0" class="small text-muted text-center py-3">Belum ada master team untuk {{ openTeamPicker?.deptLabel }}.</div>
          <div v-else-if="filteredTeamPickerOptions.length === 0" class="small text-muted text-center py-3">
            <i class="bi bi-search d-block mb-1 opacity-50"></i> Team tidak ditemukan
          </div>
          <label
            v-for="team in filteredTeamPickerOptions"
            :key="team.id"
            class="team-picker-item"
            :class="{
              'team-picker-item-checked': activeRowForPicker && activeRowForPicker.teamAllocations.some(a => String(a.team_id) === String(team.id))
            }"
          >
            <input type="checkbox" class="form-check-input"
              :checked="activeRowForPicker && activeRowForPicker.teamAllocations.some(a => String(a.team_id) === String(team.id))"
              @change="toggleTeam(activeRowForPicker, team.id, $event.target.checked, activeSameDeptDatasetForPicker, activeTeamMasterList, openTeamPicker.deptLabel)">
            <span class="team-picker-item-body">
              <span class="team-picker-item-name">{{ team.nama_team }}</span>
              <span class="team-picker-item-meta">
                Shift1(7j) {{ team.jml_org }} org &middot;
                <span :class="remainingCapacity7ForTeam(team, activeRowForPicker) <= 0 ? 'text-danger fw-bold' : 'text-success'">sisa {{ remainingCapacity7ForTeam(team, activeRowForPicker) }}</span>
                &middot; Shift2(7j) {{ team.jml_org2 }} org &middot;
                <span :class="remainingCapacity14ForTeam(team, activeRowForPicker) <= 0 ? 'text-danger fw-bold' : 'text-success'">sisa {{ remainingCapacity14ForTeam(team, activeRowForPicker) }}</span>
              </span>
              <span v-if="activeRowForPicker && xmarksUsingTeam(team.id, activeRowForPicker).length" class="team-picker-item-xmark-hint">
                <i class="bi bi-diagram-3-fill"></i> Juga dipakai di {{ xmarksUsingTeam(team.id, activeRowForPicker).length }} style lain
              </span>
            </span>
            <span v-if="activeRowForPicker && isTeamFull(team, activeRowForPicker)" class="badge-team-full" title="Kapasitas Shift 1 & Shift 2 sudah habis, tapi tetap bisa dipilih kalau perlu">PENUH</span>
            <span v-else-if="activeRowForPicker && teamShiftFullInfo(team, activeRowForPicker).s1Full" class="badge-team-full" title="Kapasitas Shift 1 sudah habis, Shift 2 masih ada sisa">S1 PENUH</span>
            <span v-else-if="activeRowForPicker && teamShiftFullInfo(team, activeRowForPicker).s2Full" class="badge-team-full" title="Kapasitas Shift 2 sudah habis, Shift 1 masih ada sisa">S2 PENUH</span>
          </label>
        </div>
      </div>
    </Teleport>

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-5" :style="{ marginLeft: sidebarOpen ? '16rem' : '0', transition: 'margin-left 0.3s' }">
        <div class="container-fluid">

          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="page-title-icon">
              <i class="bi bi-pencil-square"></i>
            </div>
            <div class="flex-grow-1">
              <h2 class="h4 fw-bold text-dark mb-0">Update Qty Plan - Finishing &amp; Linking</h2>
              <p class="text-muted small mb-0">Isi target Team (bisa lebih dari 1 team) &amp; Qty Plan per style, per proses</p>
            </div>
            <a href="/plan_ppc" class="btn btn-kembali">
              <i class="bi bi-arrow-left me-1"></i> Kembali
            </a>
          </div>

          <div class="row" v-if="uniqueStyleList.length > 0 || dataLoading">

            <div class="col-md-3 mb-4">
              <div class="card border-0 shadow-sm rounded-4 p-3 style-sidebar-card">
                <label class="sidebar-label">
                  <i class="bi bi-tags-fill"></i> Cari &amp; Pilih Style
                </label>
                <div class="search-box mb-3">
                  <i class="bi bi-search"></i>
                  <input type="text" class="form-control" placeholder="Ketik nomor style..." v-model="searchStyleInput">
                </div>

                <div class="style-list-scroll custom-scrollbar">
                  <button
                    v-for="styleOpt in uniqueStyleList"
                    :key="styleOpt"
                    type="button"
                    class="style-list-item"
                    :class="{ active: selectedStyle === styleOpt }"
                    @click="selectStyle(styleOpt)"
                  >
                    <span class="text-truncate">{{ styleOpt }}</span>
                    <span class="style-count-badge" :class="{ 'style-count-badge-active': selectedStyle === styleOpt }">
                      {{ countRowsPerStyle(styleOpt) }} Proses
                    </span>
                  </button>

                  <div v-if="uniqueStyleList.length === 0" class="text-center text-muted small py-4">
                    <i class="bi bi-inbox display-6 d-block mb-2 opacity-50"></i>
                    Style tidak ditemukan
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-9 mb-4">
              <div v-if="!selectedStyle" class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white d-flex flex-column align-items-center justify-content-center h-100 min-h-350 empty-state-card">
                <div class="empty-state-icon mb-3">
                  <i class="bi bi-lightning-charge-fill"></i>
                </div>
                <h5 class="fw-bold text-dark">Silahkan Pilih Style Terlebih Dahulu</h5>
                <p class="text-muted small max-w-400 mb-0">Pilih nomor style di sebelah kiri untuk memproses input target.</p>
              </div>

              <div v-else class="card border-0 shadow-sm rounded-4 p-4 bg-white planning-panel">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <div>
                    <span class="planning-eyebrow d-flex align-items-center gap-2">
                      Planning Pengisian Style
                      <span class="realtime-dot" :class="realtimeConnected ? 'realtime-dot-on' : 'realtime-dot-off'"
                        :title="realtimeConnected ? 'Realtime aktif' : 'Realtime terputus'"></span>
                    </span>
                    <h4 class="fw-bold text-primary-emphasis mb-0">{{ selectedStyle }}</h4>
                  </div>
                  <div>
                    <button class="btn btn-save-massal" @click="saveMassal" :disabled="dataLoading">
                      <span v-if="dataLoading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-save-fill me-2"></i> Simpan Semua
                    </button>
                  </div>
                </div>

                <!-- [BARU] NOTIF REALTIME: ada perubahan dari user lain -->
                <div v-if="realtimeStale" class="realtime-banner mb-3">
                  <i class="bi bi-broadcast me-2"></i>
                  <span class="flex-grow-1">{{ realtimeLastNote || 'Ada perubahan data terbaru dari user lain.' }}</span>
                  <button type="button" class="btn btn-xs btn-light fw-bold" @click="refreshRealtimeData">
                    <i class="bi bi-arrow-clockwise me-1"></i>Muat Ulang
                  </button>
                  <button type="button" class="btn-realtime-dismiss" @click="realtimeStale = false" title="Abaikan untuk saat ini">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>

                <!-- [BARU] NOTIF KONFLIK TIM ANTAR xMark (real-time, overlap tanggal periode) -->
                <div v-if="allConflictNotices.length" class="conflict-banner mb-3">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <strong class="small">
                      {{ allConflictNotices.filter(n => n.notice.hasOverCapacity).length }} tim melebihi kapasitas dari
                      {{ allConflictNotices.length }} baris planning yang timnya juga dipakai xMark lain di rentang tanggal yang beririsan. Rincian per baris:
                    </strong>
                  </div>
                  <div v-for="(entry, idx) in allConflictNotices" :key="'conf-'+idx" class="conflict-row small d-flex flex-column">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <span class="conflict-xmark-tag">{{ entry.row.xMark }}</span>
                      <span class="text-muted">{{ entry.row.xworkname }} ({{ entry.row.periode_ke ? 'Periode '+entry.row.periode_ke : '' }})</span>
                      <span v-for="c in entry.notice.conflicts" :key="c.team_id"
                            :class="['conflict-team-chip', c.isOver ? 'conflict-team-chip-over' : '']">
                        {{ c.nama_team }}: sisa {{ c.sisa7 }}/{{ c.sisa14 }} org
                        &middot; dipakai bareng
                        <button type="button" class="conflict-jump-btn" v-for="u in c.overlappingXMarks" :key="u.xMark" @click="jumpToXMark(u.xMark)">{{ u.xMark }}</button>
                      </span>
                    </div>
                    <!-- [FIX] Kalimat penjelasan detail: tanggal periode xMark lain & jumlah org yang direbutkan -->
                    <ul class="conflict-explanation-list mb-0 ps-3">
                      <li v-for="(c, cIdx) in entry.notice.conflicts" :key="'exp-'+cIdx">
                        <span class="fw-semibold">{{ c.nama_team }}</span>
                        <span v-if="c.isOver" class="text-danger fw-bold"> (melebihi kapasitas)</span>:
                        <span v-for="(line, lIdx) in c.explanationLines" :key="'line-'+lIdx">
                          {{ line }}<span v-if="lIdx < c.explanationLines.length - 1">; </span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- BANNER PINTAR BARU -->
                <div class="info-banner mb-4 flex-column gap-2">
                  <div class="d-flex align-items-start gap-2">
                    <i class="bi bi-info-circle-fill mt-1"></i>
                    <span class="small">
                      <strong>Kebebasan Mengisi:</strong> Anda bebas mengisi proses di bawah. Jika ada proses yang tidak masuk dalam planning, Anda <strong>boleh mengosongkannya</strong> tanpa dicentang.
                    </span>
                  </div>
                  <div class="d-flex align-items-start gap-2">
                    <i class="bi bi-robot mt-1"></i>
                    <span class="small">
                      <strong>Asisten Pintar:</strong> Jika Anda memilih 3 team lalu mengetik manual (misal 2350) di Team A, angka itu otomatis terkunci <i class="bi bi-lock-fill"></i>. Saat klik <b>Asisten Auto-Hitung</b>, akan muncul pilihan cara membagi ke slot Shift 1 / Shift 2 yang masih kosong: isi Shift 1 dulu, Shift 2 dulu, atau dibagi rata/seimbang -- baru sisa kekurangannya dibagikan ke Team B &amp; C sesuai pilihan itu. Gembok bisa Anda klik langsung kapan saja untuk mengunci/membuka kunci sebuah team tanpa harus ngetik dulu.
                    </span>
                  </div>
                  <div class="d-flex align-items-start gap-2">
                    <i class="bi bi-calculator-fill mt-1"></i>
                    <span class="small">
                      <strong>Asisten Qty dari Team:</strong> Bingung Qty Plan-nya harus berapa? Centang team dulu, lalu klik tombol <b>Asisten Qty dari Team</b> di kolom Qty Plan -- sistem menghitung otomatis Qty Plan maksimal berdasarkan sisa kapasitas anggota team yang dipilih (Shift 1 + Shift 2), lalu langsung membagikannya.
                    </span>
                  </div>
                  <div class="d-flex align-items-start gap-2">
                    <i class="bi bi-diagram-3-fill mt-1"></i>
                    <span class="small">
                      <strong>Deteksi Pemakaian Lintas Style:</strong> Kalau sebuah team juga sedang dipakai di style (xMark) lain, akan muncul chip <span class="chip-xmark-demo">xMark <i class="bi bi-box-arrow-up-right"></i></span> di Preview per Team. Klik chip itu untuk langsung pindah ke style tersebut.
                    </span>
                  </div>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <i class="bi bi-people-fill text-danger"></i>
                    <span class="small">
                      Jika sisa kapasitas anggota team kurang (Minus/0), silakan ubah total anggotanya di sini:
                    </span>
                    <a href="/teamtarget" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2 fw-bold" style="font-size: 0.75rem;">
                      <i class="bi bi-box-arrow-up-right me-1"></i>Edit Jml_Org Tim
                    </a>
                  </div>
                </div>

                <!-- ============================================= -->
                <!-- SECTION: FINISHING (selalu di atas)            -->
                <!-- ============================================= -->
                <div class="section-heading section-heading-finishing mb-3">
                  <i class="bi bi-scissors"></i>
                  <span>Proses Finishing</span>
                  <span class="section-count-badge">{{ finalFilteredDataFinishing.length }} Proses</span>
                </div>

                <div v-if="finalFilteredDataFinishing.length === 0" class="small text-muted mb-4 fst-italic">
                  Tidak ada proses Finishing untuk style ini.
                </div>

                <div v-else class="table-responsive border-0 rounded-3 overflow-hidden custom-scrollbar planning-table-wrap mb-4">
                  <table class="table table-hover align-middle mb-0 planning-table">
                    <thead class="sticky-thead">
                      <tr>
                        <th class="text-center">Dept</th>
                        <th>WorkName</th>
                        <th class="text-center">xTarget</th>
                        <th style="width: 160px;" class="text-center">Qty Plan <span class="th-sub">(Bebas per Proses)</span></th>
                        <th style="min-width: 260px;">Team Finishing (centang + isi Qty per team manual)</th>
                        <th style="min-width: 260px;">Preview per Team (Qty Shift1/Shift2 / Sisa)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in finalFilteredDataFinishing" :key="row.periode_key">
                        <td class="text-center">
                          <span class="badge-dept">{{ row.dept }}</span>
                        </td>
                        <td class="fw-semibold text-dark">
                          {{ row.xworkname }}
                          <span class="periode-badge">Periode {{ row.periode_ke }}</span>
                        </td>
                        <td class="text-center">{{ row.xTarget }}</td>

                        <td>
                          <div class="d-flex gap-1 mb-1">
                            <input type="date" class="form-control form-control-sm periode-date-input" v-model="row.tgl_mulai" title="Tgl Mulai periode ini">
                            <input type="date" class="form-control form-control-sm periode-date-input" v-model="row.tgl_selesai" title="Tgl Selesai periode ini">
                          </div>
                          <!-- v-model.number ditangani terpusat di fungsi handleQtyChange -->
                          <input type="number" step="any" class="form-control form-control-sm text-center fw-bold input-qty" v-model.number="row.displayQty"
                            @input="handleQtyChange(row, row.displayQty)" placeholder="0" min="0"
                          >
                          <button type="button" class="btn btn-xs btn-outline-primary w-100 mt-1" :disabled="row.teamAllocations.length === 0"
                            title="Hitung Qty Plan otomatis sesuai sisa kapasitas anggota team yang sudah dipilih"
                            @click="suggestQtyPlanFromTeamCapacity(row)">
                            <i class="bi bi-calculator-fill me-1"></i>Asisten Qty dari Team
                          </button>
                          <div class="alloc-indicator mt-1" :class="Math.abs(totalAllocatedForRow(row) - (row.displayQty || 0)) > 0.01 ? 'text-danger' : 'text-success'">
                            Teralokasi: {{ totalAllocatedForRow(row) }} / {{ row.displayQty || 0 }}
                          </div>
                          <div class="d-flex gap-1 mt-1">
                            <button type="button" class="btn btn-xs btn-outline-primary flex-fill" :disabled="periodeCountFor(row) >= 3"
                              title="Tambah periode baru untuk proses ini (maks 3)" @click="addPeriode(row)">
                              <i class="bi bi-plus-lg me-1"></i>Periode
                            </button>
                            <button type="button" class="btn btn-xs btn-outline-danger flex-fill" :disabled="periodeCountFor(row) <= 1"
                              title="Hapus periode ini" @click="removePeriode(row)">
                              <i class="bi bi-trash me-1"></i>Hapus
                            </button>
                          </div>
                        </td>

                        <td>
                          <button class="btn btn-sm btn-team-picker w-100 text-start team-picker-trigger" type="button"
                            @click="openTeamDropdown($event, 'finishing', row)">
                            <span v-if="row.teamAllocations.length === 0" class="text-muted">Pilih Team {{ row.dept }}...</span>
                            <span v-else>{{ teamNamesLabel(getTeamListForDept(row.dept), row.teamAllocations.map(a => a.team_id)) }}</span>
                            <i class="bi bi-chevron-down float-end mt-1"></i>
                          </button>

                          <div v-if="row.teamAllocations.length > 0" class="team-qty-list mt-2">
                            <div class="text-muted" style="font-size: 0.65rem; margin-bottom: 2px;"><i>*Klik Asisten untuk mengisi otomatis, klik ikon gembok utk kunci, atau ketik manual di bawah ini</i></div>
                            <div class="d-flex gap-2 mb-1">
                              <button type="button" class="btn btn-xs btn-primary flex-fill fw-bold shadow-sm" @click="chooseAutoFillMode(row)" title="Pilih cara pembagian ke Shift 1 / Shift 2">
                                <i class="bi bi-robot me-1"></i>Asisten Auto-Hitung
                              </button>
                              <button type="button" class="btn btn-xs btn-outline-secondary flex-fill" @click="clearTeamQty(row)">
                                <i class="bi bi-eraser me-1"></i>Reset
                              </button>
                            </div>
                            <div v-for="alloc in row.teamAllocations" :key="'qty-fin-'+alloc.team_id" class="team-qty-block">
                              <div class="team-qty-item">
                                <span class="team-qty-label" :class="{ 'text-danger': isOrphanTeamForRow(row, alloc.team_id) }">
                                  {{ teamNameById(getTeamListForDept(row.dept), alloc.team_id) }}
                                  <button type="button" class="btn-lock-toggle" :class="{ 'btn-lock-toggle-active': alloc.is_manual }"
                                    @click="toggleManualLock(row, alloc.team_id)"
                                    :title="alloc.is_manual ? 'Terkunci manual. Klik buka kunci agar asisten bisa hitung' : 'Belum dikunci.'">
                                    <i :class="alloc.is_manual ? 'bi bi-lock-fill' : 'bi bi-unlock'"></i>
                                  </button>
                                  <i v-if="isOrphanTeamForRow(row, alloc.team_id)" class="bi bi-exclamation-triangle-fill ms-1" title="Team ini bukan bagian dari dept proses ini (data nyasar/lama) -- disarankan dihapus"></i>
                                </span>
                                <button type="button" class="btn-remove-team" title="Hapus team ini dari proses"
                                  @click="removeTeamAllocation(row, alloc.team_id, sameDeptRowsFor(finalFilteredDataFinishing, row), getTeamListForDept(row.dept), row.dept)">
                                  <i class="bi bi-x-lg"></i>
                                </button>
                              </div>
                              <div class="team-qty-shift-row">
                                <div class="team-qty-shift-col">
                                  <span class="team-qty-shift-tag">S1</span>
                                  <input type="number" step="any" class="form-control form-control-sm input-qty" placeholder="Qty Shift 1"
                                    :class="{ 'is-invalid border-danger': sisa7ForTeamId(row, alloc.team_id) < 0 }"
                                    v-model.number="alloc.qty_shift1"
                                    @input="alloc.is_manual = true">
                                </div>
                                <div class="team-qty-shift-col">
                                  <span class="team-qty-shift-tag">S2</span>
                                  <input type="number" step="any" class="form-control form-control-sm input-qty" placeholder="Qty Shift 2"
                                    :class="{ 'is-invalid border-danger': sisa14ForTeamId(row, alloc.team_id) < 0 }"
                                    v-model.number="alloc.qty_shift2"
                                    @input="alloc.is_manual = true">
                                </div>
                              </div>
                              <div v-if="sisa7ForTeamId(row, alloc.team_id) < 0" class="team-qty-error">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                Kuota Shift 1 (7 jam) kelebihan {{ Math.abs(sisa7ForTeamId(row, alloc.team_id)) }} org
                              </div>
                              <div v-if="sisa14ForTeamId(row, alloc.team_id) < 0" class="team-qty-error">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                Kuota Shift 2 (7 jam) kelebihan {{ Math.abs(sisa14ForTeamId(row, alloc.team_id)) }} org
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div v-if="row.teamAllocations.length === 0" class="small text-muted">Belum pilih team</div>
                          <div v-else class="preview-list">
                            <div v-for="prev in previewForRow(row, getTeamListForDept(row.dept))" :key="prev.team_id" class="preview-item mb-1">
                              <span class="fw-semibold">{{ prev.nama_team }}</span> (total {{ prev.qty_plan }})<br>
                              S1 qty {{ prev.qty_shift1 }} &rarr; Shift1(7j): {{ prev.worker_7jam }} org
                              <span :class="prev.sisa_7jam < 0 ? 'text-danger fw-bold' : 'text-success'">
                                (sisa {{ prev.sisa_7jam }})
                              </span><br>
                              S2 qty {{ prev.qty_shift2 }} &rarr; Shift2(7j): {{ prev.worker_14jam }} org
                              <span :class="prev.sisa_14jam < 0 ? 'text-danger fw-bold' : 'text-success'">
                                (sisa {{ prev.sisa_14jam }})
                              </span>
                              <div v-if="xmarksUsingTeam(prev.team_id, row).length" class="chip-xmark-wrap">
                                <span class="chip-xmark-hint"><i class="bi bi-diagram-3-fill"></i> Dipakai juga di:</span>
                                <button type="button" v-for="u in xmarksUsingTeam(prev.team_id, row)" :key="'fin-'+prev.team_id+'-'+u.xMark"
                                  class="chip-xmark" title="Klik untuk pindah ke style ini"
                                  @click="jumpToXMark(u.xMark)">
                                  {{ u.xMark }} <span class="chip-xmark-qty">{{ u.totalQty }}</span>
                                  <i class="bi bi-box-arrow-up-right"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- ============================================= -->
                <!-- SECTION: LINKING (selalu di bawah Finishing)   -->
                <!-- ============================================= -->
                <div class="section-heading section-heading-linking mb-3">
                  <i class="bi bi-link-45deg"></i>
                  <span>Proses Linking</span>
                  <span class="section-count-badge">{{ finalFilteredDataLinking.length }} Proses</span>
                </div>

                <div v-if="finalFilteredDataLinking.length === 0" class="small text-muted fst-italic">
                  Tidak ada proses Linking untuk style ini.
                </div>

                <div v-else class="table-responsive border-0 rounded-3 overflow-hidden custom-scrollbar planning-table-wrap">
                  <table class="table table-hover align-middle mb-0 planning-table">
                    <thead class="sticky-thead sticky-thead-linking">
                      <tr>
                        <th class="text-center">Dept</th>
                        <th>WorkName</th>
                        <th class="text-center">xTarget</th>
                        <th style="width: 160px;" class="text-center">Qty Plan <span class="th-sub">(Bebas per Proses)</span></th>
                        <th style="min-width: 260px;">Team Linking (centang + isi Qty per team manual)</th>
                        <th style="min-width: 260px;">Preview per Team (Qty Shift1/Shift2 / Sisa)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in finalFilteredDataLinking" :key="row.periode_key">
                        <td class="text-center">
                          <span class="badge-dept">{{ row.dept }}</span>
                        </td>
                        <td class="fw-semibold text-dark">
                          {{ row.xworkname }}
                          <span class="periode-badge">Periode {{ row.periode_ke }}</span>
                        </td>
                        <td class="text-center">{{ row.xTarget }}</td>

                        <td>
                          <div class="d-flex gap-1 mb-1">
                            <input type="date" class="form-control form-control-sm periode-date-input" v-model="row.tgl_mulai" title="Tgl Mulai periode ini">
                            <input type="date" class="form-control form-control-sm periode-date-input" v-model="row.tgl_selesai" title="Tgl Selesai periode ini">
                          </div>
                          <input type="number" step="any" class="form-control form-control-sm text-center fw-bold input-qty" v-model.number="row.displayQty"
                            @input="handleQtyChange(row, row.displayQty)" placeholder="0" min="0"
                          >
                          <button type="button" class="btn btn-xs btn-outline-primary w-100 mt-1" :disabled="row.teamAllocations.length === 0"
                            title="Hitung Qty Plan otomatis sesuai sisa kapasitas anggota team yang sudah dipilih"
                            @click="suggestQtyPlanFromTeamCapacity(row)">
                            <i class="bi bi-calculator-fill me-1"></i>Asisten Qty dari Team
                          </button>
                          <div class="alloc-indicator mt-1" :class="Math.abs(totalAllocatedForRow(row) - (row.displayQty || 0)) > 0.01 ? 'text-danger' : 'text-success'">
                            Teralokasi: {{ totalAllocatedForRow(row) }} / {{ row.displayQty || 0 }}
                          </div>
                          <div class="d-flex gap-1 mt-1">
                            <button type="button" class="btn btn-xs btn-outline-primary flex-fill" :disabled="periodeCountFor(row) >= 3"
                              title="Tambah periode baru untuk proses ini (maks 3)" @click="addPeriode(row)">
                              <i class="bi bi-plus-lg me-1"></i>Periode
                            </button>
                            <button type="button" class="btn btn-xs btn-outline-danger flex-fill" :disabled="periodeCountFor(row) <= 1"
                              title="Hapus periode ini" @click="removePeriode(row)">
                              <i class="bi bi-trash me-1"></i>Hapus
                            </button>
                          </div>
                        </td>

                        <td>
                          <button class="btn btn-sm btn-team-picker w-100 text-start team-picker-trigger" type="button"
                            @click="openTeamDropdown($event, 'linking', row)">
                            <span v-if="row.teamAllocations.length === 0" class="text-muted">Pilih Team {{ row.dept }}...</span>
                            <span v-else>{{ teamNamesLabel(getTeamListForDept(row.dept), row.teamAllocations.map(a => a.team_id)) }}</span>
                            <i class="bi bi-chevron-down float-end mt-1"></i>
                          </button>

                          <div v-if="row.teamAllocations.length > 0" class="team-qty-list mt-2">
                            <div class="text-muted" style="font-size: 0.65rem; margin-bottom: 2px;"><i>*Klik Asisten untuk mengisi otomatis, klik ikon gembok utk kunci, atau ketik manual di bawah ini</i></div>
                            <div class="d-flex gap-2 mb-1">
                              <button type="button" class="btn btn-xs btn-primary flex-fill fw-bold shadow-sm" @click="chooseAutoFillMode(row)" title="Pilih cara pembagian ke Shift 1 / Shift 2">
                                <i class="bi bi-robot me-1"></i>Asisten Auto-Hitung
                              </button>
                              <button type="button" class="btn btn-xs btn-outline-secondary flex-fill" @click="clearTeamQty(row)">
                                <i class="bi bi-eraser me-1"></i>Reset
                              </button>
                            </div>
                            <div v-for="alloc in row.teamAllocations" :key="'qty-link-'+alloc.team_id" class="team-qty-block">
                              <div class="team-qty-item">
                              <span class="team-qty-label" :class="{ 'text-danger': isOrphanTeamForRow(row, alloc.team_id) }">
                                {{ teamNameById(getTeamListForDept(row.dept), alloc.team_id) }}
                                <button type="button" class="btn-lock-toggle" :class="{ 'btn-lock-toggle-active': alloc.is_manual }"
                                  @click="toggleManualLock(row, alloc.team_id)"
                                  :title="alloc.is_manual ? 'Terkunci manual. Klik buka kunci agar asisten bisa hitung' : 'Belum dikunci.'">
                                  <i :class="alloc.is_manual ? 'bi bi-lock-fill' : 'bi bi-unlock'"></i>
                                </button>
                                <i v-if="isOrphanTeamForRow(row, alloc.team_id)" class="bi bi-exclamation-triangle-fill ms-1" title="Team ini bukan bagian dari dept proses ini (data nyasar/lama) -- disarankan dihapus"></i>
                              </span>
                              <button type="button" class="btn-remove-team" title="Hapus team ini dari proses"
                                @click="removeTeamAllocation(row, alloc.team_id, sameDeptRowsFor(finalFilteredDataLinking, row), getTeamListForDept(row.dept), row.dept)">
                                <i class="bi bi-x-lg"></i>
                              </button>
                              </div>
                              <div class="team-qty-shift-row">
                                <div class="team-qty-shift-col">
                                  <span class="team-qty-shift-tag">S1</span>
                                  <input type="number" step="any" class="form-control form-control-sm input-qty" placeholder="Qty Shift 1"
                                    :class="{ 'is-invalid border-danger': sisa7ForTeamId(row, alloc.team_id) < 0 }"
                                    v-model.number="alloc.qty_shift1"
                                    @input="alloc.is_manual = true">
                                </div>
                                <div class="team-qty-shift-col">
                                  <span class="team-qty-shift-tag">S2</span>
                                  <input type="number" step="any" class="form-control form-control-sm input-qty" placeholder="Qty Shift 2"
                                    :class="{ 'is-invalid border-danger': sisa14ForTeamId(row, alloc.team_id) < 0 }"
                                    v-model.number="alloc.qty_shift2"
                                    @input="alloc.is_manual = true">
                                </div>
                              </div>
                              <div v-if="sisa7ForTeamId(row, alloc.team_id) < 0" class="team-qty-error">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                Kuota Shift 1 (7 jam) kelebihan {{ Math.abs(sisa7ForTeamId(row, alloc.team_id)) }} org
                              </div>
                              <div v-if="sisa14ForTeamId(row, alloc.team_id) < 0" class="team-qty-error">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                                Kuota Shift 2 (7 jam) kelebihan {{ Math.abs(sisa14ForTeamId(row, alloc.team_id)) }} org
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div v-if="row.teamAllocations.length === 0" class="small text-muted">Belum pilih team</div>
                          <div v-else class="preview-list">
                            <div v-for="prev in previewForRow(row, getTeamListForDept(row.dept))" :key="prev.team_id" class="preview-item mb-1">
                              <span class="fw-semibold">{{ prev.nama_team }}</span> (total {{ prev.qty_plan }})<br>
                              S1 qty {{ prev.qty_shift1 }} &rarr; Shift1(7j): {{ prev.worker_7jam }} org
                              <span :class="prev.sisa_7jam < 0 ? 'text-danger fw-bold' : 'text-success'">
                                (sisa {{ prev.sisa_7jam }})
                              </span><br>
                              S2 qty {{ prev.qty_shift2 }} &rarr; Shift2(7j): {{ prev.worker_14jam }} org
                              <span :class="prev.sisa_14jam < 0 ? 'text-danger fw-bold' : 'text-success'">
                                (sisa {{ prev.sisa_14jam }})
                              </span>
                              <div v-if="xmarksUsingTeam(prev.team_id, row).length" class="chip-xmark-wrap">
                                <span class="chip-xmark-hint"><i class="bi bi-diagram-3-fill"></i> Dipakai juga di:</span>
                                <button type="button" v-for="u in xmarksUsingTeam(prev.team_id, row)" :key="'link-'+prev.team_id+'-'+u.xMark"
                                  class="chip-xmark" title="Klik untuk pindah ke style ini"
                                  @click="jumpToXMark(u.xMark)">
                                  {{ u.xMark }} <span class="chip-xmark-qty">{{ u.totalQty }}</span>
                                  <i class="bi bi-box-arrow-up-right"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

          <div v-else-if="!dataLoading" class="card border-0 shadow-sm rounded-4 empty-state-card">
            <div class="card-body text-center py-5">
              <div class="empty-state-icon mb-3 mx-auto">
                <i class="bi bi-calendar2-x"></i>
              </div>
              <p class="text-muted mb-0">Belum ada data aktif yang tersedia.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==========================================
// [BARU] REALTIME (Socket.io)
// Room "planppc" dipakai bareng semua user yang lagi buka halaman ini.
// Backend WAJIB emit event 'planppc:updated' ke room ini setiap kali
// updateQty() sukses (lihat planningController.js). Kalau server socket
// belum siap / gagal connect, halaman tetap jalan normal (silent fallback),
// cuma tanpa notifikasi realtime.
// ==========================================
let socket = null;
const realtimeConnected = ref(false);
const realtimeStale = ref(false); // true kalau ada update dari user lain yang belum di-refresh
const realtimeLastNote = ref('');

const connectRealtime = () => {
  try {
    socket = io(API_BASE_URL, { transports: ['websocket'], reconnectionDelay: 2000 });

    socket.on('connect', () => {
      realtimeConnected.value = true;
      socket.emit('planppc:join', { room: 'planppc' });
    });
    socket.on('disconnect', () => { realtimeConnected.value = false; });
    socket.on('connect_error', () => { realtimeConnected.value = false; });

    // Server disarankan mengirim payload: { xMark, by, updated_at }
    socket.on('planppc:updated', (payload) => {
      // Kalau yang update adalah tab kita sendiri, abaikan (sudah pasti sinkron).
      if (payload && payload.socketId && socket && payload.socketId === socket.id) return;

      const who = payload?.by ? ` oleh ${payload.by}` : '';
      const style = payload?.xMark ? ` (style ${payload.xMark})` : '';
      realtimeLastNote.value = `Ada perubahan data planning terbaru${style}${who}.`;

      // Kalau style yang lagi diedit user SEDANG DIBUKA tidak tersentuh oleh update
      // ini, tidak perlu bikin banner (biar tidak berisik).
      if (!payload?.xMark || payload.xMark === selectedStyle.value || !selectedStyle.value) {
        realtimeStale.value = true;
      }
    });
  } catch (err) {
    console.warn('Realtime (socket.io) tidak tersedia:', err?.message);
  }
};

// Muat ulang data dari server tapi TETAP pertahankan style & posisi yang lagi dibuka user,
// supaya draft yang belum disimpan di style lain tidak hilang tanpa sadar.
const refreshRealtimeData = async () => {
  const keepStyle = selectedStyle.value;
  await fetchData(false);
  if (keepStyle && uniqueStyleList.value.includes(keepStyle)) {
    selectedStyle.value = keepStyle;
  }
  realtimeStale.value = false;
  realtimeLastNote.value = '';
};

const DEPT_TO_KODE_DEPT = {
  'lo': 'LO',
  'steam': 'STEAM',
  'cbs': 'CBS',
  'sewing': 'SEWING',
  'sontex': 'SOOMSONTEX',
  'sontex komplit': 'SOOMSONTEX',
  'soom sontex': 'SOOMSONTEX',
  'soom': 'SOOMSONTEX',
  'qc lampu': 'QCLAMPU',
  'sulam': 'SULAM',
  'linking': 'LINKING_TLS'
};
const ALL_KODE_DEPTS = ['LO', 'STEAM', 'CBS', 'SEWING', 'SOOMSONTEX', 'QCLAMPU', 'SULAM', 'LINKING_TLS'];

const kodeDeptForDept = (deptName) => DEPT_TO_KODE_DEPT[String(deptName || '').toLowerCase().trim()] || null;

const sidebarOpen = ref(true);
const user = ref({ name: "User" });
const dataLoading = ref(false);

const rawHeadersAll = ref([]);
const teamMasterByKodeDept = ref({});
const getTeamListForDept = (deptName) => teamMasterByKodeDept.value[kodeDeptForDept(deptName)] || [];

// ==========================================
// [BARU] CACHE KAPASITAS TIM TER-SCOPE TANGGAL (overlap-aware)
// Dipakai supaya jml_org tidak diakumulasi lintas periode yang tanggalnya
// tidak beririsan (mis. periode 1 tgl 14-17 sudah lewat, periode 2 tgl 18-20
// dapat kapasitas penuh lagi kalau memang tidak bentrok tanggal).
// key cache: "<kodeDept>|<tgl_mulai>|<tgl_selesai>"
// ==========================================
const scopedTeamCapacityCache = ref({});
const scopedTeamCapacityLoading = ref({});

const scopeCacheKey = (kodeDept, tglMulai, tglSelesai, excludeHeaderId) => `${kodeDept}|${tglMulai || ''}|${tglSelesai || ''}|${excludeHeaderId || ''}`;

// Ambil daftar tim + used_org_7jam/14jam yang SUDAH di-scope ke rentang tanggal row ybs.
// Kalau row belum punya tanggal lengkap, fallback ke daftar tim global (perilaku lama)
// supaya tetap ada data yang ditampilkan sebelum user mengisi tanggal.
const getScopedTeamList = (row) => {
  const kodeDept = kodeDeptForDept(row?.dept);
  if (!row || !row.tgl_mulai || !row.tgl_selesai) {
    return teamMasterByKodeDept.value[kodeDept] || [];
  }
  // header_id null/undefined artinya row ini masih BARU (belum pernah disimpan),
  // jadi tidak ada data lama yang perlu di-exclude.
  const key = scopeCacheKey(kodeDept, row.tgl_mulai, row.tgl_selesai, row.header_id);
  const cached = scopedTeamCapacityCache.value[key];
  if (cached) return cached;
  // belum ada cache -> trigger fetch di background, sementara tampilkan data global dulu
  ensureScopedTeamCapacity(row);
  return teamMasterByKodeDept.value[kodeDept] || [];
};

// Fetch (dan cache) kapasitas tim ter-scope tanggal untuk row tertentu.
// Aman dipanggil berkali-kali untuk row/tanggal yang sama (di-skip kalau sudah ada/sedang loading).
//
// [BARU] Selalu kirim row.header_id sebagai excludeHeaderId, supaya data lama milik
// proses yang SEDANG DIEDIT ini tidak ikut dihitung sebagai "used" -- karena nanti data
// itu pasti ditimpa/dihapus juga saat disimpan (sp_update_plan_ppc_tlsi_proses melakukan
// exclude yang sama di step validasinya). Tanpa ini, sisa kapasitas yang ditampilkan bisa
// keliatan lebih kecil dari yang sebenarnya saat user mengedit proses existing.
const ensureScopedTeamCapacity = async (row) => {
  const kodeDept = kodeDeptForDept(row?.dept);
  if (!row || !row.tgl_mulai || !row.tgl_selesai || !kodeDept) return null;
  const key = scopeCacheKey(kodeDept, row.tgl_mulai, row.tgl_selesai, row.header_id);
  if (scopedTeamCapacityCache.value[key] || scopedTeamCapacityLoading.value[key]) {
    return scopedTeamCapacityCache.value[key] || null;
  }
  scopedTeamCapacityLoading.value = { ...scopedTeamCapacityLoading.value, [key]: true };
  try {
    const res = await axios.get(`${API_BASE_URL}/planppc/team-target`, {
      params: {
        kode_dept: kodeDept,
        startDate: row.tgl_mulai,
        endDate: row.tgl_selesai,
        excludeHeaderId: row.header_id || undefined
      }
    });
    const data = res.data?.data || [];
    scopedTeamCapacityCache.value = { ...scopedTeamCapacityCache.value, [key]: data };
    return data;
  } catch (err) {
    console.error('Gagal memuat kapasitas tim ter-scope tanggal:', err);
    return null;
  } finally {
    const next = { ...scopedTeamCapacityLoading.value };
    delete next[key];
    scopedTeamCapacityLoading.value = next;
  }
};

// Helper cek overlap dua rentang tanggal (string 'YYYY-MM-DD'). Kalau salah satu
// rentang tidak punya tanggal lengkap, dianggap OVERLAP (fallback konservatif/lama)
// supaya tidak tiba-tiba "membebaskan" kapasitas sebelum tanggalnya jelas.
const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  if (!aStart || !aEnd || !bStart || !bEnd) return true;
  return aStart <= bEnd && aEnd >= bStart;
};

const searchStyleInput = ref("");
const selectedStyle = ref(null);

// ==========================================
// FETCH DATA
// ==========================================
let periodeRowSeq = 0; 

const buildPeriodeRow = (h, periode) => ({
  header_id: h.id || h.header_id,
  xMark: h.xMark,
  dept: h.dept,
  xworkname: h.xworkname,
  xTarget: h.xTarget,
  periode_key: 'per-' + (periode?.id || ('new-' + (++periodeRowSeq))),
  periode_id: periode?.id || null,
  periode_ke: periode?.periode_ke || 1,
  tgl_mulai: periode?.tgl_mulai ? String(periode.tgl_mulai).split('T')[0] : '',
  tgl_selesai: periode?.tgl_selesai ? String(periode.tgl_selesai).split('T')[0] : '',
  displayQty: periode?.qty_plan || 0,
  teamAllocations: (periode?.details || []).map(d => ({
    team_id: String(d.team_id), // Cast ID sebagai string
    qty_shift1: d.qty_shift1 || 0,
    qty_shift2: d.qty_shift2 || 0,
    is_manual: false
  })),
  originalUsage: (periode?.details || []).map(d => ({
    team_id: String(d.team_id), // Cast ID sebagai string
    used_7jam: d.worker_7jam || 0,
    used_14jam: d.worker_14jam || 0
  }))
});

const mapHeaders = (raw) => {
  const flat = [];
  raw.forEach(h => {
    const periods = Array.isArray(h.periods) ? h.periods : [];
    if (periods.length === 0) {
      flat.push(buildPeriodeRow(h, null));
    } else {
      periods
        .slice()
        .sort((a, b) => (a.periode_ke || 0) - (b.periode_ke || 0))
        .forEach(periode => flat.push(buildPeriodeRow(h, periode)));
    }
  });
  return flat;
};

const addPeriode = (row) => {
  const siblings = rawHeadersAll.value.filter(r => r.header_id === row.header_id);
  if (siblings.length >= 3) {
    Swal.fire('Info', 'Maksimal 3 periode per proses.', 'info');
    return;
  }
  const usedKe = new Set(siblings.map(r => r.periode_ke));
  let nextKe = 1;
  while (usedKe.has(nextKe) && nextKe <= 3) nextKe++;

  const newRow = buildPeriodeRow({
    id: row.header_id,
    xMark: row.xMark,
    dept: row.dept,
    xworkname: row.xworkname,
    xTarget: row.xTarget
  }, { periode_ke: nextKe });

  const lastIdx = rawHeadersAll.value.reduce((last, r, idx) => r.header_id === row.header_id ? idx : last, -1);
  rawHeadersAll.value.splice(lastIdx + 1, 0, newRow);
};

const removePeriode = async (row) => {
  const siblings = rawHeadersAll.value.filter(r => r.header_id === row.header_id);
  if (siblings.length <= 1) {
    Swal.fire('Info', 'Minimal harus ada 1 periode per proses.', 'info');
    return;
  }
  const confirm = await Swal.fire({
    icon: 'warning',
    title: `Hapus Periode ${row.periode_ke}?`,
    text: 'Tim & qty yang sudah diisi di periode ini akan hilang saat disimpan.',
    showCancelButton: true,
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal'
  });
  if (!confirm.isConfirmed) return;

  const idx = rawHeadersAll.value.findIndex(r => r.periode_key === row.periode_key);
  if (idx !== -1) rawHeadersAll.value.splice(idx, 1);
};

const periodeCountFor = (row) => rawHeadersAll.value.filter(r => r.header_id === row.header_id).length;

const fetchData = async (resetSelection = true) => {
  dataLoading.value = true;
  if (resetSelection) selectedStyle.value = null;
  try {
    const [allDataRes, ...teamResList] = await Promise.all([
      axios.get(`${API_BASE_URL}/planppc/view-target2`),
      ...ALL_KODE_DEPTS.map(code => axios.get(`${API_BASE_URL}/planppc/team-target`, { params: { kode_dept: code } }))
    ]);

    const headersAll = allDataRes.data?.data || allDataRes.data || [];
    rawHeadersAll.value = mapHeaders(headersAll);

    const teamMap = {};
    ALL_KODE_DEPTS.forEach((code, idx) => {
      teamMap[code] = teamResList[idx].data?.data || [];
    });
    teamMasterByKodeDept.value = teamMap;
  } catch (err) {
    Swal.fire('Error', 'Gagal memuat data.', 'error');
  } finally {
    dataLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
  connectRealtime();
});
onUnmounted(() => {
  if (socket) socket.disconnect();
});

// ==========================================
// STYLE LIST & SORTING
// ==========================================
const uniqueStyleList = computed(() => {
  const styles = new Set(rawHeadersAll.value.map(i => i.xMark).filter(Boolean));
  let arr = [...styles];
  
  arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (!searchStyleInput.value) return arr;
  return arr.filter(s => s.toLowerCase().includes(searchStyleInput.value.toLowerCase()));
});

const countRowsPerStyle = (styleName) => {
  return rawHeadersAll.value.filter(item => item.xMark === styleName).length;
};

const selectStyle = (styleName) => {
  selectedStyle.value = styleName;
};

// ==========================================
// FILTERING & SORTING PER SECTION
// ==========================================
const finalFilteredDataFinishing = computed(() => {
  if (!selectedStyle.value) return [];
  
  const deptOrder = {
    'Lo': 1, 'CBS': 2, 'Steam': 3, 'Sewing': 4, 
    'Sontex': 5, 'Sontex Komplit': 6, 'Soom Sontex': 7, 'Soom': 8, 
    'QC Lampu': 9, 'Sulam': 10
  };

  return rawHeadersAll.value
    .filter(i => {
       const deptStr = String(i.dept || '').toLowerCase();
       return i.xMark === selectedStyle.value && !deptStr.includes('link') && deptStr !== '10161';
    })
    .sort((a, b) => (deptOrder[a.dept] || 99) - (deptOrder[b.dept] || 99));
});

const finalFilteredDataLinking = computed(() => {
  if (!selectedStyle.value) return [];
  
  return rawHeadersAll.value
    .filter(i => {
       const deptStr = String(i.dept || '').toLowerCase();
       return i.xMark === selectedStyle.value && (deptStr.includes('link') || deptStr === '10161');
    });
});

// ==========================================
// TEAM PICKER (teleport ke <body>)
// ==========================================
const openTeamPicker = ref(null);
const teamPickerPos = ref({ top: 0, left: 0, width: 280 });
const teamPickerSearch = ref('');

const activeDatasetForPicker = computed(() => {
  if (!openTeamPicker.value) return [];
  return openTeamPicker.value.section === 'linking' ? finalFilteredDataLinking.value : finalFilteredDataFinishing.value;
});

const activeSameDeptDatasetForPicker = computed(() => {
  if (!openTeamPicker.value) return [];
  return activeDatasetForPicker.value.filter(r => r.dept === openTeamPicker.value.deptLabel);
});

const activeRowForPicker = computed(() => {
  if (!openTeamPicker.value) return null;
  return activeDatasetForPicker.value.find(r => r.periode_key === openTeamPicker.value.periodeKey) || null;
});

// [REVISI] Sekarang overlap-aware: pakai kapasitas tim ter-scope tanggal periode row aktif,
// bukan lagi daftar tim global tanpa konteks tanggal.
const activeTeamMasterList = computed(() => {
  if (!openTeamPicker.value || !activeRowForPicker.value) return [];
  return getScopedTeamList(activeRowForPicker.value);
});

const selectedCountForPicker = computed(() => activeRowForPicker.value ? activeRowForPicker.value.teamAllocations.length : 0);

const filteredTeamPickerOptions = computed(() => {
  const term = teamPickerSearch.value.trim().toLowerCase();
  if (!term) return activeTeamMasterList.value;
  return activeTeamMasterList.value.filter(t => (t.nama_team || '').toLowerCase().includes(term));
});

const closeTeamDropdown = () => { openTeamPicker.value = null; };

const openTeamDropdown = (event, section, row) => {
  const periodeKey = row.periode_key;
  if (openTeamPicker.value && openTeamPicker.value.section === section && openTeamPicker.value.periodeKey === periodeKey) {
    closeTeamDropdown();
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const panelWidth = Math.max(rect.width, 300);
  const panelMaxHeight = 360;

  let left = rect.left;
  const maxLeft = window.innerWidth - panelWidth - 12;
  if (left > maxLeft) left = Math.max(12, maxLeft);

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  let top;
  if (spaceBelow < panelMaxHeight + 12 && spaceAbove > spaceBelow) {
    top = Math.max(12, rect.top - panelMaxHeight - 6);
  } else {
    top = rect.bottom + 6;
  }

  teamPickerPos.value = { top, left, width: panelWidth };
  teamPickerSearch.value = '';
  openTeamPicker.value = { section, periodeKey, headerId: row.header_id, kodeDept: kodeDeptForDept(row.dept), deptLabel: row.dept };

  // [BARU] Muat kapasitas tim ter-scope tanggal periode row ini (overlap-aware)
  ensureScopedTeamCapacity(row);
};

const handleGlobalClickForPicker = (e) => {
  if (!openTeamPicker.value) return;
  if (e.target.closest('.team-picker-trigger') || e.target.closest('.team-picker-teleport-panel')) return;
  closeTeamDropdown();
};
const handleGlobalScrollOrResize = (e) => {
  if (!openTeamPicker.value) return;
  if (e && e.target && e.target.closest && e.target.closest('.team-picker-teleport-panel')) return;
  closeTeamDropdown();
};
const handleGlobalEscape = (e) => { if (e.key === 'Escape') closeTeamDropdown(); };

onMounted(() => {
  document.addEventListener('mousedown', handleGlobalClickForPicker);
  window.addEventListener('scroll', handleGlobalScrollOrResize, true);
  window.addEventListener('resize', handleGlobalScrollOrResize);
  document.addEventListener('keydown', handleGlobalEscape);
});
onUnmounted(() => {
  document.removeEventListener('mousedown', handleGlobalClickForPicker);
  window.removeEventListener('scroll', handleGlobalScrollOrResize, true);
  window.removeEventListener('resize', handleGlobalScrollOrResize);
  document.removeEventListener('keydown', handleGlobalEscape);
});

// ==========================================
// TEAM NAME HELPERS
// ==========================================
const allTeamsById = computed(() => {
  const map = new Map();
  Object.values(teamMasterByKodeDept.value).forEach(list => {
    (list || []).forEach(t => map.set(String(t.id), t));
  });
  return map;
});

const isOrphanTeamForRow = (row, teamId) => !getTeamListForDept(row.dept).some(t => String(t.id) === String(teamId));

const teamNameById = (teamList, id) => {
  const inDept = teamList.find(t => String(t.id) === String(id));
  if (inDept) return inDept.nama_team;
  const anyTeam = allTeamsById.value.get(String(id));
  return anyTeam ? anyTeam.nama_team : `Team #${id} (tidak dikenali)`;
};
const teamNamesLabel = (teamList, ids) => ids.map(id => teamNameById(teamList, id)).join(', ');

const removeTeamAllocation = (row, teamId, dataset, teamList, sectionLabel) => {
  toggleTeam(row, teamId, false, dataset, teamList, sectionLabel);
};

const sameDeptRowsFor = (fullDataset, row) => fullDataset.filter(r => r.dept === row.dept);

// ==========================================
// PREVIEW KALKULASI
// ==========================================
const isSulamRow = (row) => String(row?.dept || '').toLowerCase() === 'sulam';

const hitungWorker = (qty, xTarget, jam, sulam) => {
  if (!xTarget) return 0;
  const hasilDasar = Number(qty) / Number(xTarget) / Number(jam);
  return Math.round(hasilDasar * (sulam ? 0.6 : 1.2));
};

const previewForRow = (row, teamList) => {
  const sulam = isSulamRow(row);
  return row.teamAllocations.map(alloc => {
    const tid = String(alloc.team_id);
    const team = teamList.find(t => String(t.id) === tid) || allTeamsById.value.get(tid) || {};
    const qty1 = Number(alloc.qty_shift1) || 0;
    const qty2 = Number(alloc.qty_shift2) || 0;
    const worker7 = hitungWorker(qty1, row.xTarget, 7, sulam);
    const worker14 = hitungWorker(qty2, row.xTarget, 7, sulam);

    // Hitung secara realtime untuk UI View per masing-masing Baris (overlap-aware thd tanggal row ini)!
    const sisa7 = team.id ? remainingCapacity7ForTeam(team, row) : (Number(team.jml_org) || 0) - worker7;
    const sisa14 = team.id ? remainingCapacity14ForTeam(team, row) : (Number(team.jml_org2) || 0) - worker14;

    return {
      team_id: tid,
      nama_team: team.nama_team || `#${tid}`,
      jml_org: team.jml_org || 0,
      jml_org2: team.jml_org2 || 0,
      qty_shift1: qty1,
      qty_shift2: qty2,
      qty_plan: qty1 + qty2,
      worker_7jam: worker7,
      worker_14jam: worker14,
      sisa_7jam: sisa7,
      sisa_14jam: sisa14
    };
  });
};

const totalAllocatedForRow = (row) => row.teamAllocations.reduce((sum, a) => sum + (Number(a.qty_shift1) || 0) + (Number(a.qty_shift2) || 0), 0);

// ==========================================
// [BARU] DIPAKAI DI XMARK MANA SAJA (client-side, dari rawHeadersAll yang sudah ke-load)
// Dipakai supaya user tahu kalau team yang dia pilih ternyata juga sedang
// dipakai di style/xMark lain, dan bisa langsung klik untuk pindah kesana.
// ==========================================
const xmarksUsingTeam = (teamId, currentRow) => {
  const tid = String(teamId);
  const currentXMark = currentRow?.xMark;
  const byXMark = new Map();

  rawHeadersAll.value.forEach(row => {
    if (!row.xMark || row.xMark === currentXMark) return;
    row.teamAllocations.forEach(alloc => {
      if (String(alloc.team_id) !== tid) return;
      const qty = (Number(alloc.qty_shift1) || 0) + (Number(alloc.qty_shift2) || 0);
      // [BARU] tandai apakah periode row ini BERIRISAN tanggal dengan periode yang
      // sedang diedit (currentRow). Inilah yang membuat notice presisi: xMark yang
      // periodenya TIDAK overlap tidak ikut berebut kapasitas tim meski sama-sama
      // memakai tim tsb, jadi tidak perlu ditandai "bentrok".
      const overlap = currentRow ? rangesOverlap(row.tgl_mulai, row.tgl_selesai, currentRow.tgl_mulai, currentRow.tgl_selesai) : false;
      const entry = byXMark.get(row.xMark) || { xMark: row.xMark, totalQty: 0, prosesCount: 0, overlapsCurrentPeriode: false, periodeDetails: [] };
      entry.totalQty += qty;
      entry.prosesCount += 1;
      if (overlap) {
        entry.overlapsCurrentPeriode = true;
        // [BARU] simpan detail periode konkret (bukan cuma total) supaya banner bisa
        // menjelaskan kalimat lengkap: "xMark X periode ke-N, tgl A s/d B, butuh Y org"
        entry.periodeDetails.push({
          xworkname: row.xworkname,
          dept: row.dept,
          periode_ke: row.periode_ke,
          tgl_mulai: row.tgl_mulai,
          tgl_selesai: row.tgl_selesai,
          qty
        });
      }
      byXMark.set(row.xMark, entry);
    });
  });

  // Prioritaskan yang overlap tanggal ke atas (paling relevan/berbahaya), baru urut qty
  return [...byXMark.values()].sort((a, b) => {
    if (a.overlapsCurrentPeriode !== b.overlapsCurrentPeriode) return a.overlapsCurrentPeriode ? -1 : 1;
    return b.totalQty - a.totalQty;
  });
};

const fmtTgl = (d) => {
  if (!d) return '?';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

// [BARU] Ringkasan notice untuk 1 row: dipakai untuk banner peringatan real-time
// saat user mengubah qty/tim/tanggal — sebelum sempat klik Simpan.
// null = aman. Objek = ada xMark lain yang (a) pakai tim sama, (b) periodenya
// beririsan tanggal dgn row ini, (c) menghasilkan kalimat penjelasan lengkap
// tentang berapa orang yang direbutkan dan apa dampaknya ke sisa kapasitas.
const conflictNoticeForRow = (row) => {
  if (!row || !row.teamAllocations?.length) return null;
  const teamList = getTeamListForDept(row.dept);
  const conflicts = [];

  row.teamAllocations.forEach(alloc => {
    const tid = String(alloc.team_id);
    const team = teamList.find(t => String(t.id) === tid) || allTeamsById.value.get(tid);
    if (!team) return;

    const overlappingXMarks = xmarksUsingTeam(tid, row).filter(u => u.overlapsCurrentPeriode);
    if (!overlappingXMarks.length) return;

    const sisa7 = remainingCapacity7ForTeam(team, row);
    const sisa14 = remainingCapacity14ForTeam(team, row);
    const qtyIni = (Number(alloc.qty_shift1) || 0) + (Number(alloc.qty_shift2) || 0);

    // [BARU] Rangkai kalimat penjelasan per xMark yang bentrok, sebut tanggal
    // periode konkret & jumlah orang yang direbutkan, bukan cuma nama xMark.
    const explanationLines = overlappingXMarks.map(u => {
      const detailTxt = u.periodeDetails
        .map(pd => `${pd.xworkname} periode ${pd.periode_ke} (${fmtTgl(pd.tgl_mulai)}–${fmtTgl(pd.tgl_selesai)}, butuh ${pd.qty} org)`)
        .join(', ');
      return `xMark ${u.xMark} → ${detailTxt}`;
    });

    conflicts.push({
      team_id: tid,
      nama_team: team.nama_team,
      jml_org: team.jml_org || 0,
      jml_org2: team.jml_org2 || 0,
      qtyIni,
      overlappingXMarks,
      explanationLines,
      sisa7,
      sisa14,
      isOver: sisa7 < 0 || sisa14 < 0
    });
  });

  if (!conflicts.length) return null;
  return { hasOverCapacity: conflicts.some(c => c.isOver), conflicts };
};

// [BARU] Dipakai di banner global (semua row aktif) supaya PPC langsung lihat
// SEMUA konflik lintas xMark sebelum klik Simpan Massal — bukan cuma pas buka picker.
const allConflictNotices = computed(() => {
  const list = [];
  finalFilteredDataFinishing.value.concat(finalFilteredDataLinking.value).forEach(row => {
    const notice = conflictNoticeForRow(row);
    if (notice) list.push({ row, notice });
  });
  return list;
});

// Pindah tampilan ke style/xMark lain (dipanggil saat klik chip "dipakai di xMark ...")
const jumpToXMark = async (xMark) => {
  closeTeamDropdown();
  selectStyle(xMark);
  await nextTick();
  const panel = document.querySelector('.planning-panel');
  if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ==========================================
// KAPASITAS TIM PINTAR (REAL-TIME, OVERLAP-AWARE PER TANGGAL PERIODE)
// [REVISI] Sebelumnya menjumlahkan pemakaian tim di SELURUH xMark & Periode
// tanpa peduli tanggal (globalUsed akumulasi terus-menerus). Sekarang setiap
// perhitungan "sisa kapasitas" untuk sebuah team WAJIB disertai `row` (periode)
// yang sedang diedit, dan hanya memperhitungkan periode LAIN yang rentang
// tanggalnya BERIRISAN dengan periode tsb. Periode yang sudah lewat / tidak
// overlap tidak lagi mengurangi kapasitas periode berikutnya.
// ==========================================

// Total worker (7jam/14jam) versi ASLI dari server (saat load), tapi HANYA dari
// periode-periode lain yang tanggalnya beririsan dengan `targetRow`.
//
// [PENTING] Sejak backend (`team-target`) menerima `excludeHeaderId` dan MENGECUALIKAN
// SELURUH header targetRow dari scopedUsed, baris-baris milik header yang SAMA dengan
// targetRow.header_id di-skip di sini juga. Kalau tidak di-skip, kontribusi lama header ini
// akan "dikurangi dua kali" (sekali oleh backend, sekali lagi di sini) sehingga sisa kapasitas
// yang ditampilkan jadi lebih besar dari yang sebenarnya. Untuk header LAIN (proses lain yang
// kebetulan sedang ikut diedit di halaman massal ini), tetap dihitung seperti biasa karena
// backend TIDAK mengecualikan mereka.
const originalUsageForRow = (targetRow, jamKey) => {
  const map = new Map();
  rawHeadersAll.value.forEach(row => {
    if (row.header_id === targetRow.header_id) return;
    if (!rangesOverlap(row.tgl_mulai, row.tgl_selesai, targetRow.tgl_mulai, targetRow.tgl_selesai)) return;
    (row.originalUsage || []).forEach(u => {
      const tid = String(u.team_id);
      const val = jamKey === 14 ? Number(u.used_14jam) : Number(u.used_7jam);
      map.set(tid, (map.get(tid) || 0) + val);
    });
  });
  return map;
};

// Total worker (7jam/14jam) versi LIVE (hasil edit user saat ini di layar), tapi HANYA
// dari periode-periode lain yang tanggalnya beririsan dengan `targetRow`.
// [FIX] Header yang sama dengan targetRow WAJIB di-skip juga, simetris dengan
// originalUsageForRow di atas. Backend (team-target, excludeHeaderId) sudah
// mengecualikan SELURUH header ini dari scopedUsed, jadi kalau live di sini tidak
// ikut skip, kontribusi header sendiri bisa ikut mengurangi sisa kapasitas secara
// keliru (double-counted / asimetris terhadap originalUsageForRow) dan bikin
// badge "PENUH" salah tampil walau datanya di DB sudah bersih.
const liveUsageForRow = (targetRow, jamKey) => {
  const map = new Map();
  rawHeadersAll.value.forEach(row => {
    if (row.header_id === targetRow.header_id) return;
    if (!rangesOverlap(row.tgl_mulai, row.tgl_selesai, targetRow.tgl_mulai, targetRow.tgl_selesai)) return;
    const sulam = isSulamRow(row);
    row.teamAllocations.forEach(alloc => {
      const tid = String(alloc.team_id);
      const qty = jamKey === 14 ? (Number(alloc.qty_shift2) || 0) : (Number(alloc.qty_shift1) || 0);
      const used = hitungWorker(qty, row.xTarget, 7, sulam);
      map.set(tid, (map.get(tid) || 0) + used);
    });
  });
  return map;
};

// `row` WAJIB diisi (periode yang sedang dilihat/diedit) supaya perhitungan overlap-aware.
const remainingCapacity7ForTeam = (team, row) => {
  if (!team || !team.id || !row) return 0;
  const tid = String(team.id);
  const scopedTeam = getScopedTeamList(row).find(t => String(t.id) === tid) || team;
  const scopedUsed = Number(scopedTeam.used_org_7jam) || 0;
  const original = Number(originalUsageForRow(row, 7).get(tid)) || 0;
  const live = Number(liveUsageForRow(row, 7).get(tid)) || 0;
  return (Number(team.jml_org) || 0) - (scopedUsed - original) - live;
};

const remainingCapacity14ForTeam = (team, row) => {
  if (!team || !team.id || !row) return 0;
  const tid = String(team.id);
  const scopedTeam = getScopedTeamList(row).find(t => String(t.id) === tid) || team;
  const scopedUsed = Number(scopedTeam.used_org_14jam) || 0;
  const original = Number(originalUsageForRow(row, 14).get(tid)) || 0;
  const live = Number(liveUsageForRow(row, 14).get(tid)) || 0;
  return (Number(team.jml_org2) || 0) - (scopedUsed - original) - live;
};

const remainingCapacityForTeam = (team, row) => {
  return Math.min(remainingCapacity7ForTeam(team, row), remainingCapacity14ForTeam(team, row));
};

// [REVISI] "PENUH" total hanya kalau KEDUA shift sudah habis. Kalau cuma salah
// satu shift yang habis (mis. Shift 2 penuh tapi Shift 1 masih sisa banyak),
// jangan pakai label "PENUH" yang membingungkan -- tandai spesifik shift mana
// yang sudah habis lewat isTeamShiftFull di bawah.
const isTeamFull = (team, row) => {
  const tid = String(team.id);
  const alreadyInRow = row.teamAllocations.some(a => String(a.team_id) === tid);
  if (alreadyInRow) return false;
  return remainingCapacity7ForTeam(team, row) <= 0 && remainingCapacity14ForTeam(team, row) <= 0;
};

// Info shift mana saja yang sudah habis kapasitasnya untuk team ini (dipakai
// untuk badge parsial "S1 Penuh" / "S2 Penuh" saat cuma salah satu yang habis).
const teamShiftFullInfo = (team, row) => {
  const tid = String(team.id);
  const alreadyInRow = row.teamAllocations.some(a => String(a.team_id) === tid);
  if (alreadyInRow) return { s1Full: false, s2Full: false };
  return {
    s1Full: remainingCapacity7ForTeam(team, row) <= 0,
    s2Full: remainingCapacity14ForTeam(team, row) <= 0
  };
};

// ==========================================
// VALIDASI KUOTA TIM (real-time, per row/periode)
// ==========================================
const sisaForTeamId = (row, teamId) => {
  const tid = String(teamId);
  const team = getTeamListForDept(row.dept).find(t => String(t.id) === tid) || allTeamsById.value.get(tid);
  if (!team) return null;
  return remainingCapacityForTeam(team, row);
};

const sisa7ForTeamId = (row, teamId) => {
  const tid = String(teamId);
  const team = getTeamListForDept(row.dept).find(t => String(t.id) === tid) || allTeamsById.value.get(tid);
  if (!team) return null;
  return remainingCapacity7ForTeam(team, row);
};

const sisa14ForTeamId = (row, teamId) => {
  const tid = String(teamId);
  const team = getTeamListForDept(row.dept).find(t => String(t.id) === tid) || allTeamsById.value.get(tid);
  if (!team) return null;
  return remainingCapacity14ForTeam(team, row);
};

const teamOverCapacityList = computed(() => {
  const seen = new Set();
  const result = [];
  rawHeadersAll.value.forEach(row => {
    const teamList = getTeamListForDept(row.dept);
    row.teamAllocations.forEach(alloc => {
      const tid = String(alloc.team_id);
      if (seen.has(tid)) return;
      
      const team = teamList.find(t => String(t.id) === tid) || allTeamsById.value.get(tid);
      if (!team) return;
      
      const sisa7 = remainingCapacity7ForTeam(team, row);
      const sisa14 = remainingCapacity14ForTeam(team, row);
      if (sisa7 < 0 || sisa14 < 0) {
        seen.add(tid);
        result.push({
          team_id: team.id,
          nama_team: team.nama_team,
          kode_dept: team.kode_dept || kodeDeptForDept(row.dept),
          kekurangan7: sisa7 < 0 ? Math.abs(sisa7) : 0,
          kekurangan14: sisa14 < 0 ? Math.abs(sisa14) : 0,
          // dibawa serta supaya recommendTeamsForKodeDept bisa tetap overlap-aware
          row_ref: row
        });
      }
    });
  });
  return result;
});

const recommendTeamsForKodeDept = (kodeDept, neededOrg7, neededOrg14, excludeTeamId, row) => {
  const list = teamMasterByKodeDept.value[kodeDept] || [];
  return list
    .filter(t => String(t.id) !== String(excludeTeamId))
    .map(t => ({ ...t, sisa7: remainingCapacity7ForTeam(t, row), sisa14: remainingCapacity14ForTeam(t, row) }))
    .filter(t => (neededOrg7 > 0 ? t.sisa7 > 0 : true) && (neededOrg14 > 0 ? t.sisa14 > 0 : true))
    .sort((a, b) => {
      const aFits = a.sisa7 >= neededOrg7 && a.sisa14 >= neededOrg14;
      const bFits = b.sisa7 >= neededOrg7 && b.sisa14 >= neededOrg14;
      if (aFits !== bFits) return aFits ? -1 : 1;
      const aMin = Math.min(a.sisa7, a.sisa14), bMin = Math.min(b.sisa7, b.sisa14);
      return aFits ? aMin - bMin : bMin - aMin;
    })
    .slice(0, 3);
};

// ==========================================
// SYNC LOGIC
// ==========================================
const sameTeamSet = (a, b) => {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => String(v) === String(sb[i]));
};

const teamIdsOf = (row) => row.teamAllocations.map(a => String(a.team_id));

const applyTeamsToWholeStyle = (dataset, teamIds) => {
  dataset.forEach(row => {
    row.teamAllocations = teamIds.map(id => {
      const tid = String(id);
      const existing = row.teamAllocations.find(a => String(a.team_id) === tid);
      return { 
        team_id: tid, 
        qty_shift1: existing ? existing.qty_shift1 : 0,
        qty_shift2: existing ? existing.qty_shift2 : 0,
        is_manual: existing ? existing.is_manual : false
      };
    });
  });
};

const applyTeamsToSingleRow = (row, teamIds) => {
  row.teamAllocations = teamIds.map(id => {
    const tid = String(id);
    const existing = row.teamAllocations.find(a => String(a.team_id) === tid);
    return { 
      team_id: tid, 
      qty_shift1: existing ? existing.qty_shift1 : 0,
      qty_shift2: existing ? existing.qty_shift2 : 0,
      is_manual: existing ? existing.is_manual : false
    };
  });
};

const toggleTeam = async (row, teamId, checked, dataset, teamList, sectionLabel) => {
  const targetTid = String(teamId);
  const newTeamIds = checked
    ? [...teamIdsOf(row), targetTid]
    : teamIdsOf(row).filter(id => id !== targetTid);

  const otherRows = dataset.filter(r => r.header_id !== row.header_id);
  const hasDifferent = otherRows.some(r => teamIdsOf(r).length > 0 && !sameTeamSet(teamIdsOf(r), newTeamIds));

  if (otherRows.length > 0 && hasDifferent) {
    const result = await Swal.fire({
      icon: 'question',
      title: `Team ${sectionLabel} Berbeda?`,
      html: `Pilihan Team <b>${teamNamesLabel(teamList, newTeamIds) || '(kosong)'}</b> berbeda dari proses lain dalam style ini.<br><br>Terapkan ke <b>semua proses ${sectionLabel}</b>, atau hanya <b>${row.xworkname}</b> saja?`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Terapkan ke Semua',
      denyButtonText: 'Hanya Proses Ini',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0d6efd',
      denyButtonColor: '#6c757d',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      applyTeamsToWholeStyle(dataset, newTeamIds);
      return;
    } else if (result.isDenied) {
      applyTeamsToSingleRow(row, newTeamIds);
      return;
    } else {
      return;
    }
  }
  applyTeamsToWholeStyle(dataset, newTeamIds);
};

const handleQtyChange = (row, newQty) => {
  row.displayQty = newQty === '' || newQty == null ? 0 : Number(newQty);
};

// ==========================================
// ASISTEN AUTO-HITUNG PINTAR (SMART BALANCE)
// ==========================================
const kapasitasKeQty = (workersTersedia, xTarget, jam, sulam) => {
  if (!xTarget || workersTersedia <= 0) return 0;
  const pengali = sulam ? 0.6 : 1.2;
  return (Number(workersTersedia) * Number(xTarget) * Number(jam)) / pengali;
};

const distributeQtyToShift = (withCapacity, remainderIn, capKey, qtyKey) => {
  let remainder = remainderIn;
  withCapacity.forEach(item => {
    if (remainder <= 0) return;
    const slotKosong = Math.max(0, item[capKey] - (Number(item.alloc[qtyKey]) || 0));
    const isi = Math.min(remainder, slotKosong);
    if (isi <= 0) return;
    item.alloc[qtyKey] = Math.round(((Number(item.alloc[qtyKey]) || 0) + isi) * 100) / 100;
    remainder = Math.round((remainder - isi) * 100) / 100;
  });
  return remainder;
};

const autoFillTeamQty = (row, mode = 'shift1_first') => {
  const allocations = row.teamAllocations;
  const n = allocations.length;
  if (n === 0) return;

  const sulam = isSulamRow(row);
  const xTarget = row.xTarget;
  const teamList = getTeamListForDept(row.dept);
  const total = Number(row.displayQty) || 0;

  const manualTeams = allocations.filter(a => a.is_manual);
  const autoTeams = allocations.filter(a => !a.is_manual);

  const resetAll = manualTeams.length === n || autoTeams.length === n;
  const targets = resetAll ? allocations : autoTeams;

  if (resetAll) {
    targets.forEach(alloc => { alloc.is_manual = false; alloc.qty_shift1 = 0; alloc.qty_shift2 = 0; });
  }

  const manualSum = resetAll ? 0 : manualTeams.reduce((s, a) => s + (Number(a.qty_shift1) || 0) + (Number(a.qty_shift2) || 0), 0);
  let remainder = Math.max(0, total - manualSum);
  if (targets.length === 0 || remainder <= 0) return;

  const withCapacity = targets.map(alloc => {
    const tid = String(alloc.team_id);
    const team = teamList.find(t => String(t.id) === tid) || allTeamsById.value.get(tid) || {};
    const sisa7 = remainingCapacity7ForTeam(team, row);
    const sisa14 = remainingCapacity14ForTeam(team, row);
    const cap1 = Math.max(0, kapasitasKeQty(sisa7, xTarget, 7, sulam));
    const cap2 = Math.max(0, kapasitasKeQty(sisa14, xTarget, 7, sulam));
    return { alloc, cap1, cap2 };
  }).sort((a, b) => (b.cap1 + b.cap2) - (a.cap1 + a.cap2));

  withCapacity.forEach(({ alloc }) => { alloc.qty_shift1 = 0; alloc.qty_shift2 = 0; });

  if (mode === 'shift2_first') {
    remainder = distributeQtyToShift(withCapacity, remainder, 'cap2', 'qty_shift2');
    remainder = distributeQtyToShift(withCapacity, remainder, 'cap1', 'qty_shift1');
  } else if (mode === 'balanced') {
    let target1 = Math.round((remainder / 2) * 100) / 100;
    let target2 = Math.round((remainder - target1) * 100) / 100;
    target1 = distributeQtyToShift(withCapacity, target1, 'cap1', 'qty_shift1');
    target2 = distributeQtyToShift(withCapacity, target2, 'cap2', 'qty_shift2');
    let sisaGabungan = Math.round((target1 + target2) * 100) / 100;
    sisaGabungan = distributeQtyToShift(withCapacity, sisaGabungan, 'cap1', 'qty_shift1');
    sisaGabungan = distributeQtyToShift(withCapacity, sisaGabungan, 'cap2', 'qty_shift2');
    remainder = sisaGabungan;
  } else {
    remainder = distributeQtyToShift(withCapacity, remainder, 'cap1', 'qty_shift1');
    remainder = distributeQtyToShift(withCapacity, remainder, 'cap2', 'qty_shift2');
  }

  if (remainder > 0 && withCapacity.length > 0) {
    const target = withCapacity[0].alloc;
    target.qty_shift1 = Math.round(((Number(target.qty_shift1) || 0) + remainder) * 100) / 100;
  }
};

const chooseAutoFillMode = async (row) => {
  if (row.teamAllocations.length === 0) return;

  const result = await Swal.fire({
    icon: 'question',
    title: 'Pilih Cara Pembagian Shift',
    html: `Qty Plan proses <b>${row.xworkname}</b> akan dibagi otomatis ke slot Shift 1 &amp; Shift 2 yang masih kosong. Pilih strateginya:`,
    input: 'radio',
    inputOptions: {
      shift1_first: 'Isi Shift 1 penuh dulu, sisanya ke Shift 2',
      balanced: 'Bagi rata/seimbang ke Shift 1 & Shift 2',
      shift2_first: 'Isi Shift 2 penuh dulu, sisanya ke Shift 1'
    },
    inputValue: 'shift1_first',
    showCancelButton: true,
    confirmButtonText: 'Hitung Sekarang',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#0d6efd',
    reverseButtons: true,
    inputValidator: (value) => !value && 'Pilih salah satu dulu ya'
  });

  if (!result.isConfirmed || !result.value) return;
  autoFillTeamQty(row, result.value);
};

const toggleManualLock = (row, teamId) => {
  const tid = String(teamId);
  const alloc = row.teamAllocations.find(a => String(a.team_id) === tid);
  if (alloc) {
    alloc.is_manual = !alloc.is_manual;
  }
};

const clearTeamQty = (row) => {
  row.teamAllocations.forEach(alloc => { 
    alloc.qty_shift1 = 0; 
    alloc.qty_shift2 = 0; 
    alloc.is_manual = false; 
  });
};

const suggestQtyPlanFromTeamCapacity = async (row) => {
  if (row.teamAllocations.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Belum Pilih Team',
      text: 'Pilih dulu team untuk proses ini, baru Asisten bisa menghitung Qty Plan sesuai jumlah anggota timnya.'
    });
    return;
  }

  const sulam = isSulamRow(row);
  const xTarget = row.xTarget;
  const teamList = getTeamListForDept(row.dept);

  let totalKapasitas = 0;
  const rincian = row.teamAllocations.map(alloc => {
    const tid = String(alloc.team_id);
    const team = teamList.find(t => String(t.id) === tid) || allTeamsById.value.get(tid) || {};
    const sisa7 = remainingCapacity7ForTeam(team, row);
    const sisa14 = remainingCapacity14ForTeam(team, row);
    const cap1 = Math.max(0, kapasitasKeQty(sisa7, xTarget, 7, sulam));
    const cap2 = Math.max(0, kapasitasKeQty(sisa14, xTarget, 7, sulam));
    totalKapasitas += cap1 + cap2;
    return { nama: team.nama_team || `#${tid}`, cap1, cap2 };
  });

  totalKapasitas = Math.round(totalKapasitas * 100) / 100;

  if (totalKapasitas <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Kapasitas Team Sudah Habis',
      text: 'Sisa kapasitas Shift 1 & Shift 2 dari semua team yang dipilih sudah 0. Tambah team lain atau ubah di menu Edit Jml_Org Tim.'
    });
    return;
  }

  const listHtml = rincian.map(r => `<li><b>${r.nama}</b>: S1 &asymp; ${Math.round(r.cap1)} &middot; S2 &asymp; ${Math.round(r.cap2)}</li>`).join('');
  const result = await Swal.fire({
    icon: 'question',
    title: 'Pakai Qty Plan Hasil Hitung Asisten?',
    html: `Berdasarkan sisa kapasitas anggota team, Qty Plan maksimal proses <b>${row.xworkname}</b> adalah &plusmn; <b class="text-success">${totalKapasitas}</b>.<br><br><ul style="text-align:left; font-size: 0.8rem;">${listHtml}</ul>`,
    showCancelButton: true,
    confirmButtonText: 'Pakai & Bagikan Otomatis',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#0d6efd',
    reverseButtons: true
  });

  if (!result.isConfirmed) return;

  row.teamAllocations.forEach(alloc => { alloc.is_manual = false; });
  row.displayQty = totalKapasitas;
  handleQtyChange(row, totalKapasitas);
  autoFillTeamQty(row);
};

// ==========================================
// SAVE LOGIC
// ==========================================
const buildPayload = (rows) => {
  const byHeader = new Map();
  rows.forEach(row => {
    if (!byHeader.has(row.header_id)) byHeader.set(row.header_id, []);
    byHeader.get(row.header_id).push(row);
  });

  return Array.from(byHeader.entries()).map(([headerId, periodeRows]) => ({
    id: headerId,
    periods: periodeRows
      .slice()
      .sort((a, b) => a.periode_ke - b.periode_ke)
      .map(row => ({
        periode_ke: row.periode_ke,
        tgl_mulai: row.tgl_mulai || null,
        tgl_selesai: row.tgl_selesai || null,
        qty_plan: row.displayQty || 0,
        team_allocations: row.teamAllocations.map(a => ({
          team_id: Number(a.team_id), // Pastikan kembali format id saat kirim ke DB
          qty_shift1: a.qty_shift1 || 0,
          qty_shift2: a.qty_shift2 || 0
        }))
      }))
  }));
};

const saveMassal = async () => {
  const finRows = finalFilteredDataFinishing.value;
  const linkRows = finalFilteredDataLinking.value;
  const allRows = [...finRows, ...linkRows];

  if (finRows.length === 0 && linkRows.length === 0) return;

  // [REVISI] Tanggal sekarang BOLEH dikosongkan sepenuhnya (baik Tgl Mulai maupun
  // Tgl Selesai). Yang dianggap tidak valid hanyalah kalau salah satu diisi tapi
  // yang lain kosong (rentang tanggal setengah jalan), atau Tgl Mulai > Tgl Selesai.
  const rowsBadDate = allRows.filter(r => {
    const hasStart = !!r.tgl_mulai;
    const hasEnd = !!r.tgl_selesai;
    if (!hasStart && !hasEnd) return false; // keduanya kosong -> dibolehkan
    if (hasStart !== hasEnd) return true; // hanya salah satu yang diisi -> tidak valid
    return r.tgl_mulai > r.tgl_selesai; // keduanya diisi tapi urutannya salah
  });
  if (rowsBadDate.length > 0) {
    const list = rowsBadDate.map(r => `<li><b>${r.xworkname}</b> (${r.dept}) Periode ${r.periode_ke}</li>`).join('');
    return Swal.fire({
      icon: 'warning',
      title: 'Tanggal Periode Tidak Valid',
      html: `Tanggal boleh dikosongkan, tapi kalau diisi Tgl Mulai &amp; Tgl Selesai harus lengkap keduanya dan Tgl Mulai tidak boleh lebih besar dari Tgl Selesai untuk:<ul class="text-start small mt-2">${list}</ul>`
    });
  }

  if (teamOverCapacityList.value.length > 0) {
    const html = teamOverCapacityList.value.map(v => {
      const recs = recommendTeamsForKodeDept(v.kode_dept, v.kekurangan7, v.kekurangan14, v.team_id, v.row_ref);
      const recText = recs.length
        ? `💡 <b>Rekomendasi pengganti:</b> ` + recs.map(r => `<span class="badge bg-success ms-1">${r.nama_team} (sisa S1:${r.sisa7} / S2:${r.sisa14})</span>`).join('')
        : `Tidak ada team lain di kolam ${v.kode_dept} yang masih ada sisa.`;

      const kekuranganLines = [
        v.kekurangan7 > 0 ? `Shift 1 (7 jam): kelebihan <b class="text-danger">${v.kekurangan7} orang</b>` : null,
        v.kekurangan14 > 0 ? `Shift 2 (7 jam): kelebihan <b class="text-danger">${v.kekurangan14} orang</b>` : null
      ].filter(Boolean).join('<br>');

      return `<div class="mb-3 text-start p-3 border rounded bg-light">
        <b class="text-danger fs-6">${v.nama_team}</b> <br>
        ${kekuranganLines}<br>
        <span class="small mt-2 d-block text-secondary">${recText}</span>
      </div>`;
    }).join('');
    
    const resultAlert = await Swal.fire({
      icon: 'error',
      title: 'Kuota Team Terlampaui!',
      html: `
        <div class="text-start mb-3" style="font-size: 0.9rem;">
          Terdapat tim yang melebihi kapasitas pekerja. Silakan ganti ke tim yang direkomendasikan, atau sesuaikan jumlah anggota tim jika memang ada tambahan pekerja.
        </div>
        <div class="custom-scrollbar" style="max-height: 250px; overflow-y: auto;">
          ${html}
        </div>
      `,
      showDenyButton: true,
      confirmButtonText: 'Oke, Saya Perbaiki',
      denyButtonText: 'Ubah Total Pekerja',
      confirmButtonColor: '#6c757d',
      denyButtonColor: '#0d6efd',
      reverseButtons: true,
      width: '32em'
    });

    if (resultAlert.isDenied) {
      window.open('/teamtarget', '_blank');
    }
    return;
  }

  const rowsMissingTeam = allRows.filter(r => r.teamAllocations.length === 0 && r.displayQty > 0);
  if (rowsMissingTeam.length > 0) {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Ada proses tanpa Team',
      html: `${rowsMissingTeam.length} proses (Finishing/Linking) yang memiliki Target tapi belum ada Team yang dicentang. Lanjutkan simpan?`,
      showCancelButton: true,
      confirmButtonText: 'Lanjutkan',
      cancelButtonText: 'Batal'
    });
    if (!confirm.isConfirmed) return;
  }

  const rowsMismatch = allRows.filter(r => r.teamAllocations.length > 0 && Math.abs(totalAllocatedForRow(r) - (r.displayQty || 0)) > 0.01);
  if (rowsMismatch.length > 0) {
    const list = rowsMismatch.map(r => `<li><b>${r.xworkname}</b> (${r.dept}): teralokasi ${totalAllocatedForRow(r)} / target ${r.displayQty || 0}</li>`).join('');
    const confirmMismatch = await Swal.fire({
      icon: 'warning',
      title: 'Qty Plan per Team Belum Pas',
      html: `Total Qty Plan dari semua team di baris berikut belum sama persis dengan Qty Plan Total-nya:<ul class="text-start small mt-2">${list}</ul>Tetap lanjutkan simpan?`,
      showCancelButton: true,
      confirmButtonText: 'Tetap Simpan',
      cancelButtonText: 'Batal, Saya Perbaiki Dulu'
    });
    if (!confirmMismatch.isConfirmed) return;
  }

  try {
    dataLoading.value = true;
    const combinedPayload = buildPayload([...finRows, ...linkRows]);
    await axios.post(`${API_BASE_URL}/planppc/update-target`, { dataUpdate: combinedPayload });
    Swal.fire('Sukses', `Data berhasil disimpan!`, 'success');
    // Beritahu tab/user lain lewat realtime (kalau backend belum emit sendiri
    // dari updateQty(), broadcast dari sini adalah fallback-nya)
    if (socket && socket.connected) {
      socket.emit('planppc:notify-updated', { xMark: selectedStyle.value, socketId: socket.id });
    }
    await fetchData(false);
  } catch (err) {
    const backendMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Terjadi kesalahan tak terduga.';

    Swal.fire({
      icon: 'error',
      title: 'Gagal Menyimpan',
      html: backendMsg,
    });
  } finally {
    dataLoading.value = false;
  }
};

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => {};
</script>

<style scoped>
.page-title-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg, #0d6efd, #0b5ed7); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25); flex-shrink: 0; }
.form-label-modern { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; margin-bottom: 5px; display: block; }
.form-control-modern { background: #f8f9fb; border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0.5rem 0.85rem; font-weight: 600; }
.form-control-modern:focus { border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); background: #fff; }
.btn-kembali { background: #eef1f6; color: #495057; border: none; border-radius: 10px; padding: 0.55rem 1rem; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.2s ease; }
.btn-kembali:hover { background: #dee2e6; color: #212529; }
.style-sidebar-card { background: #fff; max-height: 70vh; }
.sidebar-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.sidebar-label i { color: #0d6efd; }
.search-box { position: relative; display: flex; align-items: center; background: #f8f9fb; border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0 10px; }
.search-box i { color: #adb5bd; margin-right: 8px; font-size: 0.85rem; }
.search-box input { border: none; outline: none; box-shadow: none; background: transparent; padding: 0.45rem 0; font-size: 0.85rem; }
.style-list-scroll { max-height: 55vh; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px; }
.style-list-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border: 1.5px solid #eef0f3; border-radius: 10px; padding: 9px 12px; font-size: 0.85rem; font-weight: 600; color: #495057; text-align: left; transition: all 0.15s ease; }
.style-list-item:hover { border-color: #0d6efd; color: #0d6efd; background: #f8faff; }
.style-list-item.active { background: linear-gradient(135deg, #0d6efd, #0b5ed7); border-color: #0d6efd; color: #fff; box-shadow: 0 4px 12px rgba(13,110,253,0.25); }
.style-count-badge { background: #eef1f6; color: #6c757d; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 30px; white-space: nowrap; flex-shrink: 0; }
.style-count-badge-active { background: rgba(255,255,255,0.25); color: #fff; }
.empty-state-card { background: #fff; }
.empty-state-icon { width: 64px; height: 64px; border-radius: 16px; background: #e7edff; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
.min-h-350 { min-height: 350px; }
.max-w-400 { max-width: 400px; }
.planning-panel { background: #fff; }
.planning-eyebrow { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; display: block; }
.btn-save-massal { background: linear-gradient(135deg, #198754, #157347); color: #fff; border: none; border-radius: 12px; padding: 0.6rem 1.4rem; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease; }
.btn-save-massal:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(25,135,84,0.3); color: #fff; }
.btn-save-massal:disabled { opacity: 0.65; }
.info-banner { display: flex; align-items: flex-start; background: #e7edff; color: #1d4ed8; border-radius: 12px; padding: 12px 16px; }
.info-banner i { font-size: 1rem; flex-shrink: 0; }
.section-heading { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.95rem; padding: 10px 14px; border-radius: 10px; }
.section-heading i { font-size: 1.1rem; }
.section-heading-finishing { background: #e7f3ff; color: #0b5ed7; }
.section-heading-linking { background: #fff4e5; color: #b45309; }
.section-count-badge { margin-left: auto; background: rgba(255,255,255,0.6); font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 30px; }
.planning-table-wrap { overflow-x: auto; border: 1px solid #eef0f3; }
.sticky-thead th { position: sticky; top: 0; background: #11182c; color: #fff; z-index: 5; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.8rem 0.75rem; border: none; }
.sticky-thead-linking th { background: #3a2a12; }
.th-sub { display: block; font-size: 0.6rem; font-weight: 500; opacity: 0.65; text-transform: none; letter-spacing: 0; }
.planning-table tbody td { padding: 0.65rem 0.75rem; vertical-align: middle; border-color: #eef0f3; }
.planning-table tbody tr:hover { background: #f8f9fb; }
.badge-dept { background: #eef1f6; color: #495057; border: 1px solid #e0e4eb; font-weight: 700; font-size: 0.74rem; padding: 4px 10px; border-radius: 30px; white-space: nowrap; }
.btn-team-picker { border: 1.5px solid #cfe0ff; border-radius: 8px; background-color: #f5f8ff; color: #1d4ed8; font-weight: 600; font-size: 0.8rem; }
.team-picker-teleport-panel { position: fixed; z-index: 3000; background: #fff; border-radius: 16px; max-height: 360px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #eef0f3; }
.team-picker-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 10px; border-bottom: 1px solid #f1f3f6; flex-shrink: 0; }
.team-picker-title { font-weight: 700; font-size: 0.85rem; color: #1a1f36; margin-right: 8px; }
.team-picker-dept-tag { background: #eef1f6; color: #495057; font-size: 0.66rem; font-weight: 700; padding: 2px 8px; border-radius: 30px; margin-left: 6px; text-transform: uppercase; letter-spacing: 0.02em; }
.team-picker-selected-count { background: #e7edff; color: #1d4ed8; font-size: 0.68rem; font-weight: 700; padding: 2px 9px; border-radius: 30px; }
.team-picker-close-btn { background: #f4f5f7; border: none; color: #6c757d; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; transition: all 0.15s ease; }
.team-picker-close-btn:hover { background: #e9ecef; color: #212529; }
.team-picker-search-box { display: flex; align-items: center; gap: 8px; margin: 10px 14px; background: #f8f9fb; border: 1.5px solid #e9ecef; border-radius: 10px; padding: 7px 12px; flex-shrink: 0; }
.team-picker-search-box i { color: #adb5bd; font-size: 0.85rem; }
.team-picker-search-box input { border: none; outline: none; background: transparent; font-size: 0.85rem; width: 100%; }
.team-picker-list { overflow-y: auto; padding: 4px 8px 10px; flex: 1 1 auto; min-height: 0; }
.team-picker-item { display: flex; align-items: center; gap: 10px; padding: 8px 8px; border-radius: 10px; cursor: pointer; margin-bottom: 2px; transition: background 0.12s ease; }
.team-picker-item:hover { background: #f5f8ff; }
.team-picker-item-checked { background: #eef4ff; }
.team-picker-item-checked:hover { background: #e5edff; }
.team-picker-item-disabled { cursor: not-allowed; opacity: 0.55; }
.team-picker-item .form-check-input { flex-shrink: 0; margin-top: 0; cursor: pointer; }
.team-picker-item-disabled .form-check-input { cursor: not-allowed; }
.team-picker-item-body { display: flex; flex-direction: column; gap: 1px; flex-grow: 1; min-width: 0; }
.team-picker-item-name { font-size: 0.84rem; font-weight: 600; color: #212529; }
.team-picker-item-meta { font-size: 0.72rem; color: #6c757d; }
.input-qty { border: 1.5px solid #b9ecc7; border-radius: 8px; background-color: #f4fbf6; color: #157347; }
.input-qty:focus { border-color: #198754; box-shadow: 0 0 0 3px rgba(25,135,84,0.1); }
.preview-list { font-size: 0.76rem; line-height: 1.5; }
.preview-item { border-bottom: 1px dashed #eef0f3; padding-bottom: 2px; }
.alloc-indicator { font-size: 0.68rem; font-weight: 700; text-align: center; }
.team-qty-list { display: flex; flex-direction: column; gap: 4px; }
.team-qty-block { display: flex; flex-direction: column; gap: 2px; }
.team-qty-item { display: flex; align-items: center; gap: 6px; justify-content: space-between; }
.team-qty-shift-row { display: flex; gap: 8px; margin-top: 3px; }
.team-qty-shift-col { display: flex; align-items: center; gap: 5px; flex: 1 1 0; }
.team-qty-shift-tag { font-size: 0.62rem; font-weight: 800; color: #6c757d; background: #eef1f6; border-radius: 5px; padding: 1px 5px; flex-shrink: 0; }
.team-qty-error { font-size: 0.68rem; font-weight: 700; color: #dc3545; padding-left: 2px; }
.team-qty-label { font-size: 0.74rem; font-weight: 600; color: #495057; min-width: 90px; flex-shrink: 0; }
.team-qty-item .input-qty { max-width: 100px; }
.btn-lock-toggle { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 5px; border: 1px solid #dee2e6; background: #f8f9fb; color: #adb5bd; font-size: 0.62rem; margin-left: 4px; padding: 0; vertical-align: middle; transition: all 0.15s ease; }
.btn-lock-toggle:hover { background: #eef1f6; color: #495057; }
.btn-lock-toggle-active { background: #e7edff; border-color: #cfe0ff; color: #1d4ed8; }
.btn-lock-toggle-active:hover { background: #dbe6ff; color: #0d47d9; }
.btn-remove-team { background: #fff0f0; border: 1px solid #f5c2c7; color: #b02a37; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.68rem; flex-shrink: 0; transition: all 0.15s ease; }
.btn-remove-team:hover { background: #f8d7da; color: #842029; }
.btn-xs { font-size: 0.68rem; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
.badge-team-full { background: #f8d7da; color: #842029; font-size: 0.6rem; font-weight: 700; padding: 1px 6px; border-radius: 20px; margin-left: 6px; }
.periode-badge { display: inline-block; background: #e7edff; color: #1d4ed8; font-size: 0.62rem; font-weight: 700; padding: 1px 8px; border-radius: 20px; margin-left: 6px; vertical-align: middle; }
.periode-date-input { font-size: 0.72rem; padding: 0.25rem 0.4rem; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0d6efd; }

/* ===== [BARU] Realtime indicator & banner ===== */
.realtime-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.realtime-dot-on { background: #198754; box-shadow: 0 0 0 3px rgba(25,135,84,0.18); animation: pulse-dot 1.6s infinite; }
.realtime-dot-off { background: #adb5bd; }
@keyframes pulse-dot { 0% { box-shadow: 0 0 0 0 rgba(25,135,84,0.35); } 70% { box-shadow: 0 0 0 6px rgba(25,135,84,0); } 100% { box-shadow: 0 0 0 0 rgba(25,135,84,0); } }
.realtime-banner { display: flex; align-items: center; gap: 10px; background: #fff4e5; color: #b45309; border: 1px solid #ffe1ac; border-radius: 12px; padding: 10px 14px; font-size: 0.85rem; font-weight: 600; }
.btn-realtime-dismiss { background: transparent; border: none; color: #b45309; opacity: 0.6; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; flex-shrink: 0; }
.btn-realtime-dismiss:hover { opacity: 1; background: rgba(180,83,9,0.1); }

/* ===== [BARU] Chip "dipakai di xMark lain" ===== */
.chip-xmark-wrap { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 4px; }
.chip-xmark-hint { font-size: 0.66rem; font-weight: 700; color: #6c757d; }
.chip-xmark { display: inline-flex; align-items: center; gap: 4px; background: #eef4ff; border: 1px solid #cfe0ff; color: #1d4ed8; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; transition: all 0.15s ease; }
.chip-xmark:hover { background: #1d4ed8; color: #fff; border-color: #1d4ed8; transform: translateY(-1px); }
.chip-xmark-qty { background: rgba(29,78,216,0.12); border-radius: 10px; padding: 0 5px; }
.chip-xmark:hover .chip-xmark-qty { background: rgba(255,255,255,0.25); }
.chip-xmark-demo { display: inline-flex; align-items: center; gap: 3px; background: #eef4ff; border: 1px solid #cfe0ff; color: #1d4ed8; font-size: 0.68rem; font-weight: 700; padding: 1px 7px; border-radius: 20px; }
.team-picker-item-xmark-hint { display: block; font-size: 0.66rem; font-weight: 700; color: #b45309; margin-top: 1px; }

/* ===== [BARU] Banner konflik tim antar-xMark (overlap tanggal periode) ===== */
.conflict-banner { background: #fff4e5; border: 1px solid #ffe1ac; color: #7a3e02; border-radius: 12px; padding: 10px 14px; }
.conflict-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 3px 0; border-top: 1px dashed #ffe1ac; }
.conflict-row:first-of-type { border-top: none; }
.conflict-xmark-tag { background: #b45309; color: #fff; font-weight: 700; font-size: 0.68rem; padding: 2px 8px; border-radius: 20px; }
.conflict-team-chip { background: #fff; border: 1px solid #ffe1ac; border-radius: 20px; padding: 2px 8px; font-size: 0.7rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.conflict-team-chip-over { background: #f8d7da; border-color: #f5c2c7; color: #842029; }
.conflict-jump-btn { border: none; background: #eef4ff; color: #1d4ed8; font-weight: 700; font-size: 0.68rem; padding: 1px 6px; border-radius: 20px; cursor: pointer; }
.conflict-jump-btn:hover { background: #1d4ed8; color: #fff; }
.conflict-explanation-list { list-style: disc; font-size: 0.72rem; color: #7a3e02; margin-top: 4px; }
.conflict-explanation-list li { margin-bottom: 2px; }
</style>