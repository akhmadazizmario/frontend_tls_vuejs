<template>
  <div class="d-flex flex-column min-vh-100 bg-light-subtle">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />
      
      <main
        class="flex-grow-1 p-3 p-md-4"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: '56px',
        }"
      >
        <!-- Header & Action Bar -->
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <h2 class="fw-bolder mb-1 text-dark tracking-tight">
              {{ activePage === 'audit' ? 'Audit & Settlement BBM' : 'Laporan Tracking KM' }}
            </h2>
            <p class="text-secondary mb-0 small">
              {{ activePage === 'audit'
                ? 'Laporan konsumsi BBM, pelacakan Odometer, dan rekonsiliasi kasbon driver.'
                : 'Rekap Odometer keluar-masuk per perjalanan untuk pelacakan jarak tempuh kendaraan.' }}
            </p>
          </div>
          <div class="d-flex gap-2 flex-wrap align-items-center">
            <!-- Slider Toggle: Audit BBM <-> Tracking KM -->
            <div class="page-slider" role="tablist" aria-label="Pilih halaman laporan">
              <button
                type="button"
                class="page-slider-btn"
                :class="{ active: activePage === 'audit' }"
                @click="activePage = 'audit'"
              >
                <i class="bi bi-fuel-pump me-1"></i> Audit BBM
              </button>
              <button
                type="button"
                class="page-slider-btn"
                :class="{ active: activePage === 'tracking' }"
                @click="activePage = 'tracking'"
              >
                <i class="bi bi-speedometer2 me-1"></i> Tracking KM
              </button>
              <span class="page-slider-thumb" :class="{ 'is-right': activePage === 'tracking' }"></span>
            </div>

            <button v-if="activePage === 'audit'" class="btn btn-light border-secondary-subtle btn-sm fw-medium shadow-sm" @click="showRumusModal = true">
              <i class="bi bi-rulers me-1"></i> Panduan Audit
            </button>
            <button class="btn btn-outline-secondary btn-sm fw-medium shadow-sm" @click="resetFilter">
              <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filter
            </button>
            <button class="btn btn-dark btn-sm fw-medium shadow-sm" @click="activePage === 'audit' ? exportToExcel() : exportTrackingKmToExcel()">
              <i class="bi bi-download me-1"></i> Export Laporan
            </button>
          </div>
        </div>

        <!-- Filter Panel -->
        <div class="card border-0 shadow-sm rounded-4 mb-4">
          <div class="card-body p-4">
            <div class="row g-4 align-items-end">
              <div class="col-md-3">
                <label class="form-label text-muted small fw-semibold text-uppercase">Berangkat Dari</label>
                <input type="date" class="form-control form-control-sm border-secondary-subtle" v-model="filter.tgl_dari" @change="fetchData" />
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small fw-semibold text-uppercase">Sampai Tanggal</label>
                <input type="date" class="form-control form-control-sm border-secondary-subtle" v-model="filter.tgl_sampai" @change="fetchData" />
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small fw-semibold text-uppercase">Kendaraan</label>
                <select class="form-select form-select-sm border-secondary-subtle" v-model="filter.mobil_id" @change="fetchData">
                  <option value="">-- Semua Kendaraan --</option>
                  <option v-for="m in listMobil" :key="m.id" :value="m.id">
                    {{ m.nama_mobil }} ({{ m.plat_nomor }})
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label text-muted small fw-semibold text-uppercase">Status Settlement</label>
                <select class="form-select form-select-sm border-secondary-subtle" v-model="filter.status_settlement" @change="fetchData">
                  <option value="">-- Semua Status --</option>
                  <option value="Completed">Completed (Selesai)</option>
                  <option value="Pending">Pending (Proses)</option>
                  <option value="Belum Dibuat">Belum Dibuat</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary KPI Cards -->
        <div class="row g-3 mb-4" v-if="activePage === 'audit' && summaryStats">
          <div class="col-6 col-md-2" v-for="(stat, index) in kpiData" :key="index">
            <div class="card border-0 shadow-sm rounded-4 h-100 kpi-card">
              <div class="card-body p-3 d-flex flex-column justify-content-center">
                <span class="text-muted small fw-medium mb-1">{{ stat.label }}</span>
                <h4 class="fw-bolder mb-0" :class="stat.colorClass">{{ stat.value }}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Table Section: Audit BBM -->
        <div v-if="activePage === 'audit'" class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-header bg-white border-bottom p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h6 class="fw-bold mb-0 text-dark">Daftar Perjalanan</h6>
            <span class="badge bg-light text-secondary border fw-normal">Sumber: Data Rekonsiliasi Settlement</span>
          </div>

          <div class="rt-table">
            <!-- Header kolom, hanya tampil di layar medium ke atas -->
            <div class="rt-row rt-head">
              <div class="rt-cell">Kode &amp; Tanggal</div>
              <div class="rt-cell">Mobil &amp; Driver</div>
              <div class="rt-cell">Tujuan</div>
              <div class="rt-cell text-center">Jarak Tempuh</div>
              <div class="rt-cell text-center">BBM (Liter)</div>
              <div class="rt-cell text-center">Efisiensi</div>
              <div class="rt-cell text-end">Total Biaya BBM</div>
              <div class="rt-cell text-center">Status Audit</div>
              <div class="rt-cell text-center">Settlement</div>
            </div>

            <div v-if="filteredBooking.length === 0" class="text-center text-muted py-5">
              <div class="d-flex flex-column align-items-center">
                <i class="bi bi-inbox fs-1 mb-2 text-secondary"></i>
                <span>Tidak ada data perjalanan untuk filter yang dipilih.</span>
              </div>
            </div>

            <template v-for="b in paginatedBooking" :key="b.id">
              <div
                class="rt-row rt-data cursor-pointer transition-colors"
                @click="toggleExpand(b)"
                :class="{
                  'rt-row-active': expanded === b.id,
                  'rt-row-warn': b.settlement?.status_audit_bbm === 'Perlu Ditinjau' && expanded !== b.id
                }"
              >
                <div class="rt-cell" data-label="Kode &amp; Tanggal">
                  <div class="fw-bold text-dark">{{ b.kode_booking }}</div>
                  <div class="text-muted small">{{ b.tgl_berangkat }}</div>
                </div>
                <div class="rt-cell" data-label="Mobil &amp; Driver">
                  <div class="fw-semibold text-dark">{{ b.mobil ? b.mobil.nama_mobil : '-' }}</div>
                  <div class="text-muted small">{{ b.mobil?.plat_nomor }} • {{ b.driver?.name || 'Driver #' + b.driver_id }}</div>
                </div>
                <div class="rt-cell" data-label="Tujuan">
                  <div class="text-dark">{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</div>
                  <div class="text-muted small">{{ b.pemohon?.name || '-' }}</div>
                </div>
                <div class="rt-cell text-md-center" data-label="Jarak Tempuh">
                  <div class="fw-bold text-primary">{{ getKmTempuh(b) !== null ? getKmTempuh(b) + ' km' : '-' }}</div>
                  <div class="text-muted font-xs">Out: {{ b.km_keluar_manual ?? '-' }} | In: {{ b.km_masuk_manual ?? '-' }}</div>
                </div>
                <div class="rt-cell text-md-center fw-medium" data-label="BBM (Liter)">
                  {{ b.settlement ? Number(b.settlement.total_liter_dibeli).toFixed(2) + ' L' : '-' }}
                </div>
                <div class="rt-cell text-md-center" data-label="Efisiensi">
                  <template v-if="b.settlement && b.settlement.efisiensi_aktual_kml !== null">
                    <span class="badge rounded-pill fw-medium" :class="getEfficiencyClass(Number(b.settlement.efisiensi_aktual_kml))">
                      {{ Number(b.settlement.efisiensi_aktual_kml).toFixed(2) }} km/L
                    </span>
                  </template>
                  <template v-else-if="b.settlement">
                    <span class="badge rounded-pill bg-light text-secondary border fw-medium" title="Trip ini tidak isi BBM sendiri">
                      Est. {{ Number(b.settlement.estimasi_liter_terpakai).toFixed(2) }} L
                    </span>
                  </template>
                  <template v-else>-</template>
                </div>
                <div class="rt-cell text-md-end" data-label="Total Biaya BBM">
                  <span v-if="b.settlement" class="fw-bold text-danger">
                    Rp {{ formatRupiah(getBiayaBbmEfektif(b)) }}
                    <div class="text-muted font-xs fw-normal mt-1">
                      {{ Number(b.settlement.total_liter_dibeli) > 0 ? '(Nota)' : '(Tidak Isi BBM)' }}
                    </div>
                  </span>
                  <span v-else class="text-muted">-</span>
                </div>
                <div class="rt-cell text-md-center" data-label="Status Audit">
                  <span v-if="b.settlement" class="badge rounded-pill fw-medium" :class="getAuditBadgeClass(b.settlement.status_audit_bbm)">
                    {{ b.settlement.status_audit_bbm }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </div>
                <div class="rt-cell text-md-center" data-label="Settlement">
                  <span
                    class="badge rounded-pill fw-medium"
                    :class="
                      b.settlement
                        ? b.settlement.status_penyelesaian === 'Completed'
                          ? 'bg-success text-white'
                          : 'bg-warning text-dark'
                        : 'bg-secondary text-white'
                    "
                  >
                    {{ b.settlement ? b.settlement.status_penyelesaian : 'Belum Dibuat' }}
                  </span>
                </div>
                <div class="rt-expand-hint d-md-none">
                  <i class="bi" :class="expanded === b.id ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                  {{ expanded === b.id ? 'Tutup Detail' : 'Lihat Detail' }}
                </div>
              </div>

              <!-- Expanded Detail Section -->
              <div v-if="expanded === b.id" class="rt-expanded">
                <div class="bg-light p-3 p-md-4 shadow-inner">
                        <!-- Alert Anomali -->
                        <div 
                          v-if="b.settlement?.status_audit_bbm === 'Perlu Ditinjau' || b.settlement?.catatan_anomali" 
                          class="alert alert-danger border-0 border-start border-4 border-danger rounded-3 shadow-sm mb-4 d-flex align-items-start"
                        >
                          <span class="fs-4 me-3">⚠️</span>
                          <div>
                            <h6 class="fw-bold text-danger mb-1">Perhatian: Indikasi Anomali Ditemukan</h6>
                            <p class="text-dark small mb-2">
                              Sistem mendeteksi adanya ketidaksesuaian logis antara konsumsi BBM, jarak tempuh, dan klaim nota pengisian BBM.
                            </p>
                            <ul class="text-danger small fw-medium mb-0 ps-3">
                              <li v-for="(alasan, idx) in parseAnomaliReasons(b)" :key="idx">{{ alasan }}</li>
                            </ul>
                          </div>
                        </div>

                        <!-- 3 Column Layout -->
                        <div class="row g-4">
                          <!-- Col 1: Checkpoints -->
                          <div class="col-lg-4">
                            <div class="card border-0 shadow-sm rounded-3 h-100">
                              <div class="card-body p-3">
                                <h6 class="fw-bold text-dark mb-3 font-sm">📍 Checkpoint &amp; Rute</h6>
                                
                                <div class="bg-light rounded-3 p-3 mb-3 border">
                                  <div class="d-flex justify-content-between mb-2 small">
                                    <span class="text-muted">Odometer Keluar:</span>
                                    <span class="font-monospace fw-medium">{{ b.km_keluar_manual ?? '-' }}</span>
                                  </div>
                                  <div class="d-flex justify-content-between mb-2 small">
                                    <span class="text-muted">Odometer Masuk:</span>
                                    <span class="font-monospace fw-medium">{{ b.km_masuk_manual ?? '-' }}</span>
                                  </div>
                                  <hr class="my-2 border-secondary-subtle">
                                  <div class="d-flex justify-content-between small">
                                    <span class="fw-semibold">Total Jarak:</span>
                                    <span class="fw-bold text-primary">{{ getKmTempuh(b) ?? '-' }} km</span>
                                  </div>
                                </div>

                                <div class="d-flex justify-content-between align-items-center mt-4 mb-2">
                                  <h6 class="fw-bold text-dark mb-0 font-sm">🛑 Titik Perhentian</h6>
                                  <span v-if="b.stops && b.stops.length > 0" class="badge bg-dark-subtle text-dark-emphasis rounded-pill fw-medium font-xs">
                                    Total: Rp {{ formatRupiah(getTotalBiayaStops(b)) }}
                                  </span>
                                </div>
                                <div class="timeline-container ps-3 mt-3 border-start border-secondary-subtle">
                                  <div v-for="s in b.stops" :key="s.id" class="position-relative mb-3 ps-3">
                                    <span
                                      class="position-absolute top-0 start-0 translate-middle p-1 border border-light rounded-circle"
                                      :style="{ backgroundColor: getStopMeta(s.alasan_mampir).color }"
                                    ></span>
                                    <div class="d-flex justify-content-between align-items-start gap-2">
                                      <div>
                                        <div class="fw-semibold text-dark small">
                                          <span class="me-1">{{ getStopMeta(s.alasan_mampir).icon }}</span>{{ s.nama_lokasi }}
                                        </div>
                                        <div class="text-muted font-xs">{{ s.alasan_mampir }}</div>
                                      </div>
                                      <span
                                        v-if="Number(s.pengeluaran) > 0"
                                        class="badge bg-danger-subtle text-danger border border-danger-subtle fw-medium font-xs text-nowrap"
                                      >
                                        Rp {{ formatRupiah(s.pengeluaran) }}
                                      </span>
                                    </div>
                                  </div>
                                  <div v-if="!b.stops || b.stops.length === 0" class="text-muted small fst-italic ps-2">
                                    Tidak ada catatan perhentian.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Col 2: Audit BBM (DITAMBAHKAN NERACA TANGKI) -->
                          <div class="col-lg-4">
                            <div class="card border-0 shadow-sm rounded-3 h-100">
                              <div class="card-body p-3">
                                <h6 class="fw-bold text-dark mb-3 font-sm">⛽ Audit Konsumsi BBM</h6>
                                
                                <!-- BARU: Blok Neraca Tangki -->
                                <div class="bg-light rounded-3 p-3 mb-3 border">
                                  <div class="d-flex justify-content-between mb-2 small">
                                    <span class="text-muted">Sisa Sebelum Berangkat:</span>
                                    <span class="font-monospace fw-medium">{{ b.sisa_bbm_awal ?? 0 }} L</span>
                                  </div>
                                  <div class="d-flex justify-content-between mb-2 small">
                                    <span class="text-muted">Total Isi di Jalan (Nota):</span>
                                    <span class="font-monospace fw-medium text-success">+ {{ b.settlement ? Number(b.settlement.total_liter_dibeli).toFixed(2) : 0 }} L</span>
                                  </div>
                                  <div class="d-flex justify-content-between mb-2 small">
                                    <span class="text-muted">Sisa Saat Kembali:</span>
                                    <span class="font-monospace fw-medium text-danger">- {{ b.sisa_bbm_akhir ?? 0 }} L</span>
                                  </div>
                                  <hr class="my-2 border-secondary-subtle">
                                  <div class="d-flex justify-content-between align-items-center small">
                                    <span class="fw-semibold text-dark" title="Konsumsi Logis = Awal + Isi - Sisa">Konsumsi Secara Logika:</span>
                                    <span class="badge bg-dark rounded-pill">{{ getKonsumsiLogis(b) }} L</span>
                                  </div>
                                </div>

                                <!-- Efisiensi Aktual vs Standar -->
                                <div v-if="b.settlement" class="d-flex flex-column gap-2 small mb-4">
                                  <div class="d-flex justify-content-between border-bottom pb-1">
                                    <span class="text-muted">Efisiensi Rating Mobil</span>
                                    <span class="fw-medium">{{ Number(b.settlement.efisiensi_rating_kml).toFixed(2) }} km/L</span>
                                  </div>
                                  <div class="d-flex justify-content-between border-bottom pb-1">
                                    <span class="text-muted">Efisiensi Aktual Trip</span>
                                    <span class="fw-bold text-dark">
                                      {{ b.settlement.efisiensi_aktual_kml !== null ? Number(b.settlement.efisiensi_aktual_kml).toFixed(2) + ' km/L' : 'Tanpa Nota' }}
                                    </span>
                                  </div>
                                  <div class="d-flex justify-content-between border-bottom pb-1">
                                    <span class="text-muted">Deviasi Efisiensi</span>
                                    <span :class="b.settlement.deviasi_efisiensi_persen < 0 ? 'text-danger fw-bold' : 'text-success fw-medium'">
                                      {{ b.settlement.deviasi_efisiensi_persen !== null ? (Number(b.settlement.deviasi_efisiensi_persen) > 0 ? '+' : '') + Number(b.settlement.deviasi_efisiensi_persen).toFixed(2) + '%' : '-' }}
                                    </span>
                                  </div>
                                </div>

                                <h6 class="fw-bold text-dark mb-2 font-sm">Nota Pengisian (Riil)</h6>
                                <div class="table-responsive">
                                  <table class="table table-sm table-borderless bg-light rounded-3 small">
                                    <thead class="border-bottom">
                                      <tr>
                                        <th class="text-muted fw-medium font-xs">KM Isi</th>
                                        <th class="text-muted fw-medium font-xs text-center">Liter</th>
                                        <th class="text-muted fw-medium font-xs text-end">Biaya</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr v-for="f in b.fuel_logs" :key="f.id">
                                        <td>{{ f.km_saat_isi }}</td>
                                        <td class="text-center">{{ f.jumlah_liter }} L</td>
                                        <td class="text-end fw-medium">Rp {{ formatRupiah(f.total_biaya) }}</td>
                                      </tr>
                                      <tr v-if="!b.fuel_logs || b.fuel_logs.length === 0">
                                        <td colspan="3" class="text-center text-muted py-2 font-xs">
                                          Tidak ada nota BBM di trip ini.
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Col 3: Kasbon & Settlement -->
                          <div class="col-lg-4">
                            <div class="card border-0 shadow-sm rounded-3 h-100">
                              <div class="card-body p-3 d-flex flex-column">
                                <h6 class="fw-bold text-dark mb-3 font-sm">💰 Rekonsiliasi Keuangan</h6>
                                
                                <div v-if="b.settlement" class="flex-grow-1">
                                  <div class="bg-light rounded-3 p-3 mb-3 border">
                                    <div class="d-flex justify-content-between mb-2 small">
                                      <span class="text-muted">Kasbon Awal:</span>
                                      <span class="fw-medium">Rp {{ formatRupiah(b.settlement.nominal_kasbon_awal) }}</span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2 small text-danger">
                                      <span>Biaya BBM:</span>
                                      <span>- Rp {{ formatRupiah(getBiayaBbmEfektif(b)) }}</span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2 small text-danger">
                                      <span>Pengeluaran Lain:</span>
                                      <span>- Rp {{ formatRupiah(getTotalBiayaStops(b)) }}</span>
                                    </div>
                                    <hr class="my-2 border-secondary-subtle">
                                    <div class="d-flex justify-content-between align-items-center">
                                      <span class="fw-bold small">Sisa / Selisih:</span>
                                      <span class="badge rounded-pill fs-6 px-3" :class="selisihBadgeFor(b)">
                                        {{ selisihLabel(b) }} — Rp {{ formatRupiah(Math.abs(b.settlement.selisih)) }}
                                      </span>
                                    </div>
                                  </div>

                                  <div v-if="isUtangKeDriver(b)" class="alert alert-danger py-2 px-3 small mb-3 d-flex align-items-start gap-2">
                                    <span>💸</span>
                                    <span>
                                      Kasbon awal <strong>Rp 0</strong> namun driver mengeluarkan biaya sendiri.
                                      Perusahaan <strong>berutang / wajib reimburse</strong> ke driver sebesar
                                      <strong>Rp {{ formatRupiah(Math.abs(b.settlement.selisih)) }}</strong>.
                                    </span>
                                  </div>

                                  <div v-if="b.settlement.status_penyelesaian !== 'Completed'" class="mt-auto">
                                    <textarea
                                      class="form-control form-control-sm mb-2 border-secondary-subtle"
                                      rows="2"
                                      v-model="catatan"
                                      placeholder="Tambahkan catatan verifikasi..."
                                    ></textarea>
                                    <button class="btn btn-primary w-100 fw-medium shadow-sm mb-2" @click="selesaikanSettlement(b.settlement.id)">
                                      ✓ Setujui &amp; Selesaikan
                                    </button>
                                  </div>
                                  <div v-else class="alert alert-success border-0 py-2 px-3 small mb-2 d-flex align-items-center">
                                    <span class="me-2">✅</span> 
                                    <span>Telah diverifikasi. <br> <span class="text-muted font-xs">{{ b.settlement.catatan || 'Tanpa catatan' }}</span></span>
                                  </div>
                                  <button class="btn btn-outline-danger w-100 fw-medium mt-auto" @click="hapusSettlement(b.settlement.id)">
                                    <i class="bi bi-trash3 me-1"></i> Hapus Settlement
                                  </button>
                                </div>
                                
                                <!-- Empty Settlement State -->
                                <div v-else class="text-center py-4 my-auto">
                                  <div class="text-muted small mb-3">Dokumen settlement belum di-generate untuk perjalanan ini.</div>
                                  <button class="btn btn-dark btn-sm fw-medium px-3 shadow-sm" @click="generateSettlement(b.id)">
                                    ⚡ Generate Settlement
                                  </button>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div> <!-- End Row -->

                        <!-- Detail Booking & Penumpang -->
                        <div class="card border-0 shadow-sm rounded-3 mt-4">
                          <div class="card-body p-3">
                            <h6 class="fw-bold text-dark mb-3 font-sm">🧾 Detail Booking &amp; Penumpang</h6>
                            <div class="row g-3 small">
                              <div class="col-6 col-md-3">
                                <div class="text-muted font-xs text-uppercase fw-semibold mb-1">Pemohon</div>
                                <div class="fw-medium text-dark">{{ b.pemohon?.name || '-' }}</div>
                                <div class="text-muted font-xs">{{ b.pemohon?.nopegawai || '-' }} • {{ b.pemohon?.dept || '-' }}</div>
                              </div>
                              <div class="col-6 col-md-3">
                                <div class="text-muted font-xs text-uppercase fw-semibold mb-1">Driver</div>
                                <div class="fw-medium text-dark">{{ b.driver?.name || 'Driver #' + b.driver_id }}</div>
                              </div>
                              <div class="col-6 col-md-3">
                                <div class="text-muted font-xs text-uppercase fw-semibold mb-1">Tujuan</div>
                                <div class="fw-medium text-dark">{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</div>
                                <a v-if="b.maps" :href="b.maps" target="_blank" rel="noopener" class="font-xs">Lihat Peta</a>
                              </div>
                              <div class="col-6 col-md-3">
                                <div class="text-muted font-xs text-uppercase fw-semibold mb-1">Jumlah Penumpang</div>
                                <div class="fw-medium text-dark">{{ b.jumlah_org ?? '-' }} orang</div>
                              </div>
                              <div class="col-12">
                                <div class="text-muted font-xs text-uppercase fw-semibold mb-1">Daftar Penumpang</div>
                                <div class="fw-medium text-dark">{{ formatDaftarPenumpang(b.daftar_penumpang) }}</div>
                              </div>
                              <div class="col-12" v-if="b.remark">
                                <div class="text-muted font-xs text-uppercase fw-semibold mb-1">Catatan / Remark</div>
                                <div class="text-dark">{{ b.remark }}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Bukti Lampiran Foto -->
                        <div class="card border-0 shadow-sm rounded-3 mt-4">
                          <div class="card-body p-3">
                            <h6 class="fw-bold text-dark mb-3 font-sm">📷 Bukti Lampiran Foto</h6>
                            <div v-if="!b.attachments || b.attachments.length === 0" class="text-muted small fst-italic">
                              Tidak ada lampiran foto untuk perjalanan ini.
                            </div>
                            <div v-else>
                              <div v-for="(fotos, kategori) in groupAttachments(b.attachments)" :key="kategori" class="mb-3">
                                <div class="text-muted font-xs text-uppercase fw-semibold mb-2">
                                  {{ kategori.replace(/_/g, ' ') }} <span class="text-secondary">({{ fotos.length }})</span>
                                </div>
                                <div class="d-flex flex-wrap gap-2">
                                  <a
                                    v-for="foto in fotos"
                                    :key="foto.id"
                                    :href="getFileUrl(foto.file_path)"
                                    target="_blank"
                                    rel="noopener"
                                    class="attachment-thumb-link"
                                    :title="foto.keterangan || kategori"
                                  >
                                    <img :src="getFileUrl(foto.file_path)" class="attachment-thumb" loading="lazy" alt="" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Danger Zone: Hapus Booking -->
                        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mt-4 p-3 rounded-3 border border-danger-subtle bg-danger-subtle bg-opacity-25">
                          <div class="small">
                            <div class="fw-bold text-danger">Zona Berbahaya</div>
                            <div class="text-muted">Menghapus booking ini akan ikut menghapus settlement, nota BBM, titik perhentian, dan lampiran terkait secara permanen.</div>
                          </div>
                          <button class="btn btn-danger btn-sm fw-medium text-nowrap" @click="hapusBooking(b.id)">
                            <i class="bi bi-trash3 me-1"></i> Hapus Booking Ini
                          </button>
                        </div>

                      </div>
                    </div>
              </template>
          </div>

          <!-- PAGINATION -->
          <div v-if="filteredBooking.length > 0" class="card-footer bg-white border-top p-3 d-flex flex-column flex-lg-row justify-content-between align-items-center gap-3">
            <div class="d-flex align-items-center gap-2 text-muted small order-2 order-lg-1">
              <span>{{ paginationRangeText }}</span>
            </div>

            <div class="d-flex align-items-center gap-3 order-1 order-lg-2 flex-wrap justify-content-center">
              <div class="d-flex align-items-center gap-2">
                <label class="text-muted small mb-0 text-nowrap">Baris / halaman</label>
                <select class="form-select form-select-sm border-secondary-subtle" style="width: auto;" v-model.number="perPage">
                  <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <nav aria-label="Navigasi halaman">
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="goToPage(currentPage - 1)"><i class="bi bi-chevron-left"></i></button>
                  </li>
                  <li v-for="(p, idx) in paginationPages" :key="idx" class="page-item" :class="{ active: p === currentPage, disabled: p === '...' }">
                    <button v-if="p !== '...'" class="page-link" @click="goToPage(p)">{{ p }}</button>
                    <span v-else class="page-link border-0 bg-transparent">…</span>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="goToPage(currentPage + 1)"><i class="bi bi-chevron-right"></i></button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        <!-- Main Table Section: Tracking KM -->
        <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-header bg-white border-bottom p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h6 class="fw-bold mb-0 text-dark">Rekap Tracking KM per Perjalanan</h6>
            <span class="badge bg-light text-secondary border fw-normal">Sumber: Odometer Checkpoint Keluar/Masuk</span>
          </div>

          <div class="rt-table">
            <div class="rt-row rt-head rt-row-km">
              <div class="rt-cell">Kode &amp; Tanggal</div>
              <div class="rt-cell">Mobil &amp; Driver</div>
              <div class="rt-cell text-center">KM Keluar</div>
              <div class="rt-cell text-center">KM Masuk</div>
              <div class="rt-cell text-center">Total KM Tempuh</div>
              <div class="rt-cell">Waktu Keluar</div>
              <div class="rt-cell">Waktu Masuk</div>
              <div class="rt-cell text-center">Status</div>
            </div>

            <div v-if="filteredBooking.length === 0" class="text-center text-muted py-5">
              <div class="d-flex flex-column align-items-center">
                <i class="bi bi-inbox fs-1 mb-2 text-secondary"></i>
                <span>Tidak ada data tracking KM untuk filter yang dipilih.</span>
              </div>
            </div>

            <div
              v-for="b in paginatedBooking"
              :key="b.id"
              class="rt-row rt-data rt-row-km"
            >
              <div class="rt-cell" data-label="Kode &amp; Tanggal">
                <div class="fw-bold text-dark">{{ b.kode_booking }}</div>
                <div class="text-muted small">{{ b.tgl_berangkat }}</div>
              </div>
              <div class="rt-cell" data-label="Mobil &amp; Driver">
                <div class="fw-semibold text-dark">{{ b.mobil ? b.mobil.nama_mobil : '-' }}</div>
                <div class="text-muted small">{{ b.mobil?.plat_nomor }} • {{ b.driver?.name || 'Driver #' + b.driver_id }}</div>
              </div>
              <div class="rt-cell text-md-center font-monospace" data-label="KM Keluar">{{ b.km_keluar_manual ?? '-' }}</div>
              <div class="rt-cell text-md-center font-monospace" data-label="KM Masuk">{{ b.km_masuk_manual ?? '-' }}</div>
              <div class="rt-cell text-md-center" data-label="Total KM Tempuh">
                <span class="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle fw-medium">
                  {{ getKmTempuh(b) !== null ? getKmTempuh(b) + ' km' : '-' }}
                </span>
              </div>
              <div class="rt-cell" data-label="Waktu Keluar">
                <span class="text-dark small">{{ formatWaktu(b.waktu_keluar) }}</span>
              </div>
              <div class="rt-cell" data-label="Waktu Masuk">
                <span class="text-dark small">{{ formatWaktu(b.waktu_masuk) }}</span>
              </div>
              <div class="rt-cell text-md-center" data-label="Status">
                <span class="badge rounded-pill fw-medium" :class="b.status_booking === 'Completed' ? 'bg-success text-white' : 'bg-secondary text-white'">
                  {{ b.status_booking }}
                </span>
              </div>
            </div>
          </div>

          <!-- PAGINATION (sama, dipakai bersama Audit & Tracking) -->
          <div v-if="filteredBooking.length > 0" class="card-footer bg-white border-top p-3 d-flex flex-column flex-lg-row justify-content-between align-items-center gap-3">
            <div class="d-flex align-items-center gap-2 text-muted small order-2 order-lg-1">
              <span>{{ paginationRangeText }}</span>
            </div>

            <div class="d-flex align-items-center gap-3 order-1 order-lg-2 flex-wrap justify-content-center">
              <div class="d-flex align-items-center gap-2">
                <label class="text-muted small mb-0 text-nowrap">Baris / halaman</label>
                <select class="form-select form-select-sm border-secondary-subtle" style="width: auto;" v-model.number="perPage">
                  <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </div>

              <nav aria-label="Navigasi halaman">
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button class="page-link" @click="goToPage(currentPage - 1)"><i class="bi bi-chevron-left"></i></button>
                  </li>
                  <li v-for="(p, idx) in paginationPages" :key="idx" class="page-item" :class="{ active: p === currentPage, disabled: p === '...' }">
                    <button v-if="p !== '...'" class="page-link" @click="goToPage(p)">{{ p }}</button>
                    <span v-else class="page-link border-0 bg-transparent">…</span>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button class="page-link" @click="goToPage(currentPage + 1)"><i class="bi bi-chevron-right"></i></button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        <!-- MODAL PANDUAN RUMUS -->
        <div v-if="showRumusModal" class="modal-backdrop fade show" style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);"></div>
        <div v-if="showRumusModal" class="modal fade show d-block" tabindex="-1" @click.self="showRumusModal = false">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div class="modal-header bg-dark text-white border-0 p-4">
                <h5 class="modal-title fw-bold">📐 Standar Audit &amp; Perhitungan</h5>
                <button type="button" class="btn-close btn-close-white" @click="showRumusModal = false"></button>
              </div>
              <div class="modal-body p-4 bg-light-subtle">
                <div class="row g-4">
                  <div class="col-md-6">
                    <div class="card border-0 shadow-sm h-100 rounded-3">
                      <div class="card-body p-3">
                        <h6 class="fw-bold text-primary mb-2">1. Jarak Tempuh</h6>
                        <p class="small text-muted mb-2">Selisih penunjukan Odometer mobil dari pos keluar hingga kembali.</p>
                        <div class="bg-light p-2 rounded border font-monospace small">Total KM = KM Masuk - KM Keluar</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="card border-0 shadow-sm h-100 rounded-3">
                      <div class="card-body p-3">
                        <h6 class="fw-bold text-success mb-2">2. Estimasi BBM (Tanpa Nota)</h6>
                        <p class="small text-muted mb-2">Untuk perjalanan yang menggunakan sisa tangki, berbasis rating standar mobil.</p>
                        <div class="bg-light p-2 rounded border font-monospace small">Estimasi = Total KM ÷ Rasio BBM Mobil</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-12">
                    <div class="card border-0 shadow-sm rounded-3">
                      <div class="card-body p-3">
                        <h6 class="fw-bold text-warning mb-2 text-darken-2">3. Efisiensi &amp; Deviasi Aktual</h6>
                        <p class="small text-muted mb-2">Evaluasi performa konsumsi riil terhadap standar pabrikan/kantor (hanya jika ada pengisian riil).</p>
                        <div class="bg-light p-2 rounded border font-monospace small mb-2">Efisiensi = Total KM ÷ Total Liter di Nota</div>
                        <div class="bg-light p-2 rounded border font-monospace small mb-2">Konsumsi Logika = Sisa Awal + Pengisian - Sisa Akhir</div>
                        <div class="bg-light p-2 rounded border font-monospace small">Deviasi % = ((Efisiensi Aktual - Rating) ÷ Rating) × 100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer border-0 p-3 bg-white">
                <button type="button" class="btn btn-light border-secondary-subtle fw-medium" @click="showRumusModal = false">Tutup Panduan</button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx-js-style'
import Header from '../../components/Header.vue'
import Sidebar from '../../components/Sidebar.vue'
import Footer from '../../components/Footer.vue'
import { useAuthUser } from '../car_book/Useauthuser.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const { user } = useAuthUser()

const sidebarOpen = ref(true)
const windowWidth = ref(window.innerWidth)
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return { headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' } }
}

const formatWaktu = (val) => {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatRupiah = (val) => new Intl.NumberFormat('id-ID').format(val || 0)
const formatNumber = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

// Server file (foto attachment dkk) di-serve dari root server, BUKAN dari
// prefix /api. Jadi buang suffix /api dari API_BASE_URL sebelum digabung
// dengan file_path (mis. '/uploads/carbook/xxx.jpg').
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')
const getFileUrl = (path) => {
  if (!path) return ''
  return `${SERVER_BASE_URL}${path}`
}

// daftar_penumpang bisa tersimpan sebagai JSON string array, array asli,
// atau teks biasa (dipisah koma/baris baru) -- tangani semua kemungkinan.
const formatDaftarPenumpang = (val) => {
  if (!val) return '-'
  let data = val
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      // bukan JSON, biarkan sebagai string biasa
    }
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return '-'
    return data
      .map((p) => (typeof p === 'string' ? p : p?.nama || p?.name || JSON.stringify(p)))
      .join(', ')
  }
  return String(data)
}

// Kelompokkan lampiran foto berdasarkan kategori_foto biar rapi ditampilkan
const groupAttachments = (attachments) => {
  const groups = {}
  for (const foto of attachments || []) {
    const key = foto.kategori_foto || 'Lainnya'
    if (!groups[key]) groups[key] = []
    groups[key].push(foto)
  }
  return groups
}

const selisihBadge = (status) =>
  ({ Pas: 'bg-success text-white', 'Kurang/Nombok': 'bg-danger text-white', 'Lebih/Return': 'bg-info text-dark' }[status] || 'bg-secondary text-white')

// Kasus khusus: kasbon awal = 0 tapi ada pengeluaran (BBM/lain-lain) yang harus ditutup driver dari kantong sendiri.
// Ini beda dari "Kurang/Nombok" biasa (kasbon diberikan tapi kurang) — di sini perusahaan belum kasih kasbon
// sama sekali, jadi statusnya adalah UTANG perusahaan ke driver, bukan sekadar selisih kurang.
const isUtangKeDriver = (b) => {
  const kasbonAwal = Number(b?.settlement?.nominal_kasbon_awal) || 0
  const selisih = Number(b?.settlement?.selisih) || 0
  return kasbonAwal === 0 && selisih < 0
}

const selisihLabel = (b) => {
  if (isUtangKeDriver(b)) return '🔴 Utang ke Driver'
  const status = b?.settlement?.status_selisih
  if (status === 'Kurang/Nombok') return 'Kurang / Nombok'
  if (status === 'Lebih/Return') return 'Lebih / Return'
  if (status === 'Pas') return 'Pas'
  return status || '-'
}

const selisihBadgeFor = (b) => {
  if (isUtangKeDriver(b)) return 'bg-danger text-white'
  return selisihBadge(b?.settlement?.status_selisih)
}

const getAuditBadgeClass = (status) =>
  ({ Wajar: 'bg-success-subtle text-success border border-success-subtle', 'Perlu Ditinjau': 'bg-danger-subtle text-danger border border-danger-subtle', 'Belum Ada Data': 'bg-light text-secondary border' }[status] || 'bg-light text-secondary border')

// Slider halaman: 'audit' (Audit BBM) atau 'tracking' (Tracking KM)
const activePage = ref('audit')

// Filter & Modal state
const showRumusModal = ref(false)
const filter = ref({
  tgl_dari: '',
  tgl_sampai: '',
  mobil_id: '',
  status_settlement: '',
})

const listBooking = ref([])
const listMobil = ref([])
const expanded = ref(null)
const catatan = ref('')

// --- PAGINATION ---
const currentPage = ref(1)
const perPage = ref(50)
const perPageOptions = [10, 50, 100, 150, 250]

// Hitung Konsumsi Secara Logika
const getKonsumsiLogis = (b) => {
  const awal = Number(b.sisa_bbm_awal) || 0
  const isi = Number(b.settlement?.total_liter_dibeli) || 0
  const akhir = Number(b.sisa_bbm_akhir) || 0
  const konsumsi = awal + isi - akhir
  return konsumsi > 0 ? konsumsi.toFixed(2) : '0.00'
}

// Parsing teks anomali
const parseAnomaliReasons = (b) => {
  const catatanAnomali = b.settlement?.catatan_anomali
  if (catatanAnomali) {
    return catatanAnomali.split('.').filter((item) => item.trim().length > 0)
  }
  
  const list = []
  const km = getKmTempuh(b) || 0
  const literDibeli = Number(b.settlement?.total_liter_dibeli || 0)

  if (km <= 15 && literDibeli > 10) {
    list.push(`Jarak tempuh pendek (${km} KM) tetapi klaim pengisian BBM besar (${literDibeli} Liter).`)
  }
  if (b.settlement?.status_audit_bbm === 'Perlu Ditinjau') {
    list.push(`Deviasi rasio konsumsi BBM di luar ambang batas normal.`)
  }
  if (list.length === 0) {
    list.push(`Kondisi neraca BBM tidak sinkron dengan nota pengisian.`)
  }
  return list
}

const getKmTempuh = (b) => {
  if (b.settlement && b.settlement.total_km_tempuh !== null && b.settlement.total_km_tempuh !== undefined) {
    return Number(b.settlement.total_km_tempuh)
  }
  if (b.km_masuk_manual != null && b.km_keluar_manual != null) {
    const total = Number(b.km_masuk_manual) - Number(b.km_keluar_manual)
    return total >= 0 ? total : 0
  }
  return null
}

// Biaya BBM yang dipakai di settlement/laporan HARUS dari nota aktual saja,
// selaras dengan backend: kalau driver tidak isi BBM (tidak ada nota), biaya
// BBM = Rp 0, bukan diganti estimasi jarak. estimasi_biaya_bbm_tersirat cuma
// dipakai sebagai referensi/audit di bagian lain, tidak masuk ke perhitungan biaya.
const getBiayaBbmEfektif = (b) => {
  if (!b.settlement) return 0
  return Number(b.settlement.total_biaya_bbm_aktual) || 0
}

const getBiayaPerKm = (b) => {
  const km = getKmTempuh(b)
  if (!b.settlement || !km || km <= 0) return null
  return Math.round(getBiayaBbmEfektif(b) / km)
}

const getTotalBiayaStops = (b) => {
  if (!b.stops || b.stops.length === 0) return 0
  return b.stops.reduce((sum, s) => sum + (Number(s.pengeluaran) || 0), 0)
}

// Ikon & warna berdasarkan kategori titik perhentian
const getStopMeta = (alasan) => {
  const a = (alasan || '').toLowerCase()
  if (a.includes('tol')) return { icon: '🛣️', color: '#4f46e5' }
  if (a.includes('parkir')) return { icon: '🅿️', color: '#0d9488' }
  if (a.includes('makan')) return { icon: '🍽️', color: '#ea580c' }
  if (a.includes('istirahat')) return { icon: '☕', color: '#a16207' }
  if (a.includes('ban') || a.includes('angin')) return { icon: '🛞', color: '#475569' }
  if (a.includes('belanja')) return { icon: '🛍️', color: '#be185d' }
  return { icon: '📍', color: '#64748b' }
}

const getEfficiencyClass = (kmPerLiter) => {
  if (kmPerLiter >= 12) return 'bg-success-subtle text-success border border-success-subtle'
  if (kmPerLiter >= 7) return 'bg-primary-subtle text-primary border border-primary-subtle'
  return 'bg-danger-subtle text-danger border border-danger-subtle'
}

const filteredBooking = computed(() => {
  return listBooking.value.filter((b) => {
    if (filter.value.mobil_id && String(b.mobil_id) !== String(filter.value.mobil_id)) return false
    if (filter.value.status_settlement) {
      const st = b.settlement ? b.settlement.status_penyelesaian : 'Belum Dibuat'
      if (st !== filter.value.status_settlement) return false
    }
    return true
  })
})

// --- PAGINATION ---
const totalPages = computed(() => Math.max(1, Math.ceil(filteredBooking.value.length / perPage.value)))

const paginatedBooking = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredBooking.value.slice(start, start + perPage.value)
})

const paginationRangeText = computed(() => {
  const total = filteredBooking.value.length
  if (total === 0) return 'Tidak ada data'
  const start = (currentPage.value - 1) * perPage.value + 1
  const end = Math.min(currentPage.value * perPage.value, total)
  return `Menampilkan ${formatNumber(start)}–${formatNumber(end)} dari ${formatNumber(total)} data`
})

// Nomor halaman yang ditampilkan (dengan ellipsis kalau halaman banyak)
const paginationPages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }
  pages.push(1)
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const goToPage = (p) => {
  if (p === '...' || p < 1 || p > totalPages.value) return
  currentPage.value = p
}

watch([filter, perPage], () => { currentPage.value = 1 }, { deep: true })
watch(filteredBooking, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

const summaryStats = computed(() => {
  const data = filteredBooking.value
  if (!data || data.length === 0) return null

  let totalKm = 0
  let totalLiter = 0
  let totalBiayaBbmEfektif = 0

  data.forEach((b) => {
    if (!b.settlement) return
    totalKm += Number(b.settlement.total_km_tempuh || 0)
    totalLiter += Number(b.settlement.total_liter_dibeli || 0)
    totalBiayaBbmEfektif += getBiayaBbmEfektif(b)
  })

  return {
    totalTrip: data.length,
    totalKm,
    totalLiter,
    totalBiayaBbmEfektif,
    avgKmPerLiter: totalLiter > 0 ? totalKm / totalLiter : null,
    avgBiayaPerKm: totalKm > 0 ? totalBiayaBbmEfektif / totalKm : 0,
  }
})

// Transformasi object computed summaryStats menjadi Array untuk rendering V-For KPI Cards yang modern
const kpiData = computed(() => {
  if (!summaryStats.value) return []
  const stats = summaryStats.value
  return [
    { label: 'Total Perjalanan', value: stats.totalTrip, colorClass: 'text-dark' },
    { label: 'Jarak Ditempuh', value: `${formatNumber(stats.totalKm)} km`, colorClass: 'text-primary' },
    { label: 'Volume BBM', value: `${stats.totalLiter.toFixed(1)} L`, colorClass: 'text-info' },
    { label: 'Rata-Rata Efisiensi', value: stats.avgKmPerLiter ? `${stats.avgKmPerLiter.toFixed(2)} km/L` : '-', colorClass: 'text-success' },
    { label: 'Rata-Rata Biaya/KM', value: `Rp ${formatRupiah(stats.avgBiayaPerKm)}`, colorClass: 'text-warning text-darken-2' },
    { label: 'Total Biaya BBM (Nota)', value: `Rp ${formatRupiah(stats.totalBiayaBbmEfektif)}`, colorClass: 'text-danger' },
  ]
})

const fetchMobil = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/mobil`, getAuthHeaders())
    listMobil.value = res.data.data || []
  } catch (err) {
    console.error('Error fetch mobil:', err)
  }
}

const fetchData = async () => {
  try {
    const params = { status: 'Completed', with_finance: 1 }
    if (filter.value.tgl_dari) params.tgl_dari = filter.value.tgl_dari
    if (filter.value.tgl_sampai) params.tgl_sampai = filter.value.tgl_sampai
    if (filter.value.mobil_id) params.mobil_id = filter.value.mobil_id

    const res = await axios.get(`${API_BASE_URL}/carbook/booking`, {
      ...getAuthHeaders(),
      params,
    })
    listBooking.value = res.data.data || []
  } catch (err) {
    console.error('Error fetch booking settlement:', err)
  }
}

const resetFilter = () => {
  filter.value = { tgl_dari: '', tgl_sampai: '', mobil_id: '', status_settlement: '' }
  fetchData()
}

const toggleExpand = async (b) => {
  if (expanded.value === b.id) {
    expanded.value = null
    return
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/booking/${b.id}`, getAuthHeaders())
    Object.assign(b, res.data.data)
    expanded.value = b.id
    catatan.value = b.settlement?.catatan || ''
  } catch (err) {
    console.error('Error fetch detail:', err)
  }
}

const generateSettlement = async (bookingId) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/carbook/booking/${bookingId}/settlement/generate`,
      {},
      getAuthHeaders()
    )
    const b = listBooking.value.find((x) => x.id === bookingId)
    if (b) b.settlement = res.data.data
    alert('Settlement berhasil dibuat!')
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal membuat settlement')
  }
}

const selesaikanSettlement = async (settlementId) => {
  try {
    await axios.patch(
      `${API_BASE_URL}/carbook/settlement/${settlementId}/selesaikan`,
      { catatan: catatan.value },
      getAuthHeaders()
    )
    alert('Settlement disetujui & diselesaikan!')
    fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyelesaikan settlement')
  }
}

const hapusBooking = async (bookingId) => {
  if (!confirm('Yakin ingin menghapus booking ini SEPENUHNYA? Settlement, nota BBM, titik perhentian, dan lampiran yang terkait akan ikut terhapus permanen dan tidak bisa dikembalikan.')) return
  try {
    await axios.delete(`${API_BASE_URL}/carbook/booking/${bookingId}`, getAuthHeaders())
    alert('Booking berhasil dihapus.')
    expanded.value = null
    fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus booking')
  }
}

const hapusSettlement = async (settlementId) => {
  if (!confirm('Yakin ingin menghapus settlement ini? Termasuk yang sudah Completed — data hasil audit BBM & rekonsiliasi kasbon akan hilang permanen dan perlu di-generate ulang.')) return
  try {
    await axios.delete(`${API_BASE_URL}/carbook/settlement/${settlementId}`, getAuthHeaders())
    alert('Settlement berhasil dihapus.')
    fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus settlement')
  }
}

// EXPORT TO EXCEL
const exportToExcel = () => {
  if (filteredBooking.value.length === 0) {
    alert('Tidak ada data untuk diexport.')
    return
  }

  const titleHeader = [
    ['LAPORAN AUDIT PENGGUNAAN BBM & SETTLEMENT KENDARAAN OPERASIONAL'],
    [`Periode Audit: ${filter.value.tgl_dari || 'Awal'} s/d ${filter.value.tgl_sampai || 'Akhir'}`],
    [''],
  ]

  const tableHeaders = [
    'No', 'Kode Booking', 'Tgl Berangkat', 'Mobil', 'Plat Nomor', 'Driver', 
    'Pemohon', 'Tujuan', 'KM Keluar', 'KM Masuk', 'Total KM Tempuh', 
    'Estimasi Liter Terpakai', 'Total Liter Dibeli (Nota)', 'Efisiensi Rating (KM/L)', 
    'Efisiensi Aktual (KM/L)', 'Deviasi (%)', 'Biaya BBM per KM (Rp)', 
    'Biaya BBM Riil/Estimasi (Rp)', 'Pengeluaran Perhentian Lain (Rp)', 
    'Kasbon Awal (Rp)', 'Selisih Kasbon (Rp)', 'Status Kasbon', 'Status Audit BBM', 'Status Settlement'
  ]

  const rows = [tableHeaders]

  filteredBooking.value.forEach((b, idx) => {
    const km = getKmTempuh(b)
    const s = b.settlement
    rows.push([
      idx + 1, b.kode_booking || '-', b.tgl_berangkat || '-', b.mobil?.nama_mobil || '-',
      b.mobil?.plat_nomor || '-', b.driver?.name || `Driver #${b.driver_id}`,
      b.pemohon?.name || '-', b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-',
      b.km_keluar_manual ?? 0, b.km_masuk_manual ?? 0, km ?? 0,
      s ? Number(s.estimasi_liter_terpakai) : 0, s ? Number(s.total_liter_dibeli) : 0,
      s ? Number(s.efisiensi_rating_kml) : 0, s && s.efisiensi_aktual_kml !== null ? Number(s.efisiensi_aktual_kml) : '-',
      s && s.deviasi_efisiensi_persen !== null ? Number(s.deviasi_efisiensi_persen) : '-',
      getBiayaPerKm(b) ?? 0, getBiayaBbmEfektif(b), getTotalBiayaStops(b),
      s ? Number(s.nominal_kasbon_awal) : Number(b.nominal_kasbon || 0),
      s ? Number(s.selisih) : 0, s ? s.status_selisih : '-',
      s ? s.status_audit_bbm : 'Belum Ada Data', s ? s.status_penyelesaian : 'Belum Dibuat',
    ])
  })

  const startRowIndex = 5
  const endRowIndex = startRowIndex + filteredBooking.value.length - 1

  const summaryRow = [
    'TOTAL / RATA-RATA', '', '', '', '', '', '', '', '', '',
    { t: 'n', f: `SUM(K${startRowIndex}:K${endRowIndex})` },
    { t: 'n', f: `SUM(L${startRowIndex}:L${endRowIndex})` },
    { t: 'n', f: `SUM(M${startRowIndex}:M${endRowIndex})` },
    { t: 'n', f: `AVERAGE(N${startRowIndex}:N${endRowIndex})` },
    { t: 'n', f: `K${endRowIndex + 1}/M${endRowIndex + 1}` },
    '', { t: 'n', f: `R${endRowIndex + 1}/K${endRowIndex + 1}` },
    { t: 'n', f: `SUM(R${startRowIndex}:R${endRowIndex})` },
    { t: 'n', f: `SUM(S${startRowIndex}:S${endRowIndex})` },
    { t: 'n', f: `SUM(T${startRowIndex}:T${endRowIndex})` },
    { t: 'n', f: `SUM(U${startRowIndex}:U${endRowIndex})` },
    '', '', '',
  ]
  rows.push(summaryRow)

  const wsData = [...titleHeader, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 }, fill: { fgColor: { rgb: '1E293B' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'medium', color: { rgb: '000000' } } } }
  ws['A1'].s = { font: { bold: true, sz: 14, color: { rgb: '0F172A' } } }
  ws['A2'].s = { font: { italic: true, sz: 10, color: { rgb: '475569' } } }

  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X']
  colLetters.forEach((col) => { if (ws[`${col}4`]) ws[`${col}4`].s = headerStyle })

  for (let r = startRowIndex; r <= endRowIndex; r++) {
    ;['I', 'J', 'K'].forEach((col) => { if (ws[`${col}${r}`]) ws[`${col}${r}`].z = '#,##0' })
    ;['L', 'M', 'N', 'O', 'P'].forEach((col) => { if (ws[`${col}${r}`]) ws[`${col}${r}`].z = '0.00' })
    ;['Q', 'R', 'S', 'T', 'U'].forEach((col) => { if (ws[`${col}${r}`]) ws[`${col}${r}`].z = '"Rp "#,##0' })
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Audit_Settlement')
  XLSX.writeFile(wb, `Laporan_Settlement_Audit_BBM_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// EXPORT LAPORAN TRACKING KM (template terpisah dari Audit BBM)
const exportTrackingKmToExcel = () => {
  if (filteredBooking.value.length === 0) {
    alert('Tidak ada data untuk diexport.')
    return
  }

  const titleHeader = [
    ['LAPORAN TRACKING KM (ODOMETER) KENDARAAN OPERASIONAL'],
    [`Periode: ${filter.value.tgl_dari || 'Awal'} s/d ${filter.value.tgl_sampai || 'Akhir'}`],
    [''],
  ]

  const tableHeaders = [
    'No', 'Kode Booking', 'Tgl Berangkat', 'Mobil', 'Plat Nomor', 'Driver',
    'KM Keluar', 'KM Masuk', 'Total KM Tempuh',
    'Waktu Keluar', 'Waktu Masuk', 'Status Booking'
  ]

  const rows = [tableHeaders]

  filteredBooking.value.forEach((b, idx) => {
    const km = getKmTempuh(b)
    rows.push([
      idx + 1, b.kode_booking || '-', b.tgl_berangkat || '-', b.mobil?.nama_mobil || '-',
      b.mobil?.plat_nomor || '-', b.driver?.name || `Driver #${b.driver_id}`,
      b.km_keluar_manual ?? 0, b.km_masuk_manual ?? 0, km ?? 0,
      formatWaktu(b.waktu_keluar), formatWaktu(b.waktu_masuk), b.status_booking || '-',
    ])
  })

  const startRowIndex = 5
  const endRowIndex = startRowIndex + filteredBooking.value.length - 1

  const summaryRow = [
    'TOTAL', '', '', '', '', '',
    { t: 'n', f: `SUM(G${startRowIndex}:G${endRowIndex})` },
    { t: 'n', f: `SUM(H${startRowIndex}:H${endRowIndex})` },
    { t: 'n', f: `SUM(I${startRowIndex}:I${endRowIndex})` },
    '', '', '',
  ]
  rows.push(summaryRow)

  const wsData = [...titleHeader, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 }, fill: { fgColor: { rgb: '1E293B' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'medium', color: { rgb: '000000' } } } }
  ws['A1'].s = { font: { bold: true, sz: 14, color: { rgb: '0F172A' } } }
  ws['A2'].s = { font: { italic: true, sz: 10, color: { rgb: '475569' } } }

  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  colLetters.forEach((col) => { if (ws[`${col}4`]) ws[`${col}4`].s = headerStyle })

  for (let r = startRowIndex; r <= endRowIndex; r++) {
    ;['G', 'H', 'I'].forEach((col) => { if (ws[`${col}${r}`]) ws[`${col}${r}`].z = '#,##0' })
  }

  ws['!cols'] = [
    { wch: 5 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tracking_KM')
  XLSX.writeFile(wb, `Laporan_Tracking_KM_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

onMounted(() => {
  fetchMobil()
  fetchData()
})
</script>

<style scoped>
/* Typography & Utilities */
.tracking-tight { letter-spacing: -0.025em; }
.font-sm { font-size: 0.875rem; }
.font-xs { font-size: 0.75rem; }
.cursor-pointer { cursor: pointer; }
.transition-colors { transition: background-color 0.2s ease-in-out; }

/* Dashboard Styling Customization */
.bg-light-subtle { background-color: #f8fafc !important; }
.shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.03); }

.kpi-card { transition: transform 0.2s; }
.kpi-card:hover { transform: translateY(-2px); }

/* Table Adjustments */

/* ============ SLIDER TOGGLE: Audit BBM <-> Tracking KM ============ */
.page-slider {
  position: relative;
  display: inline-flex;
  background: #e2e8f0;
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
}
.page-slider-btn {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  border-radius: 999px;
  transition: color 0.2s ease-in-out;
  white-space: nowrap;
}
.page-slider-btn.active { color: #ffffff; }
.page-slider-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  background: #0f172a;
  border-radius: 999px;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}
.page-slider-thumb.is-right { transform: translateX(100%); }

@media (max-width: 575.98px) {
  .page-slider { width: 100%; justify-content: center; }
  .page-slider-btn { flex: 1; text-align: center; }
}

/* ============ RESPONSIVE DATA GRID (menggantikan <table>) ============ */
/* Desktop: berperilaku seperti tabel via CSS Grid. Mobile: otomatis jadi kartu bertumpuk. */
.rt-table {
  display: flex;
  flex-direction: column;
}

.rt-row {
  display: grid;
  grid-template-columns:
    minmax(120px, 1.1fr) minmax(150px, 1.2fr) minmax(150px, 1.2fr)
    minmax(100px, 0.85fr) minmax(80px, 0.7fr) minmax(100px, 0.85fr)
    minmax(140px, 1.1fr) minmax(110px, 0.85fr) minmax(110px, 0.85fr);
  gap: 0.5rem 1rem;
  align-items: center;
  padding: 1rem 1.25rem;
}

/* Tabel Tracking KM punya 8 kolom (beda dari Audit BBM yang 9 kolom) */
.rt-row-km {
  grid-template-columns:
    minmax(120px, 1.1fr) minmax(150px, 1.2fr)
    minmax(90px, 0.7fr) minmax(90px, 0.7fr) minmax(110px, 0.9fr)
    minmax(140px, 1fr) minmax(140px, 1fr) minmax(100px, 0.7fr);
}

.rt-head {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.rt-head .rt-cell {
  text-transform: uppercase;
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.03em;
}

.rt-data {
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
.rt-data:hover { background-color: #f8fafc; }
.rt-row-active { background-color: #eff6ff; border-left: 4px solid #2563eb; }
.rt-row-warn { background-color: #fef2f2; }

.rt-expand-hint {
  grid-column: 1 / -1;
  font-size: 0.72rem;
  font-weight: 600;
  color: #2563eb;
  padding-top: 0.5rem;
  margin-top: 0.25rem;
  border-top: 1px dashed #e2e8f0;
}

.rt-expanded {
  border-bottom: 1px solid #f1f5f9;
}

/* --- MOBILE: reflow grid jadi kartu bertumpuk, setiap sel diberi label --- */
@media (max-width: 767.98px) {
  .rt-row.rt-head { display: none; } /* header tabel disembunyikan di mobile */

  .rt-data {
    grid-template-columns: 1fr;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    margin: 0.6rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .rt-row-active { border-color: #2563eb; }

  .rt-cell {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.4rem 0;
    border-bottom: 1px dashed #f1f5f9;
    text-align: right;
  }
  .rt-cell:first-child { padding-top: 0; }
  .rt-cell::before {
    content: attr(data-label);
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #94a3b8;
    text-align: left;
    flex-shrink: 0;
  }
}

/* Modifikasi Scrollbar (masih dipakai untuk tabel nota BBM & modal) */
.table-responsive::-webkit-scrollbar {
  height: 6px;
}
.table-responsive::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.table-responsive::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Bukti Lampiran Foto */
.attachment-thumb-link {
  display: inline-block;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  line-height: 0;
  transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.attachment-thumb-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.attachment-thumb {
  width: 96px;
  height: 96px;
  object-fit: cover;
  display: block;
  background-color: #f1f5f9;
}

/* Timeline Custom Styles */
.timeline-container { position: relative; }
.timeline-container::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background-color: #e2e8f0;
}
</style>