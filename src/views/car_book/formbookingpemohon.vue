<!-- views/car_book/FormBookingPemohon.vue -->
<template>
  <div class="d-flex flex-column min-vh-100 bg-body-tertiary">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />
      <main
        class="flex-grow-1 p-3 p-md-4 p-xl-5"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: '56px',
        }"
      >
        <!-- HERO BANNER -->
        <div class="hero-banner rounded-4 mb-4 p-4 p-md-5 position-relative overflow-hidden">
          <div class="hero-pattern"></div>
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 position-relative">
            <div>
              <span class="hero-eyebrow">
                <i class="bi bi-car-front-fill"></i> {{ t('eyebrow') }}
              </span>
              <h3 class="fw-bold mb-1 text-white mt-2">{{ t('title') }}</h3>
              <p class="text-white-50 mb-0">{{ t('subtitle') }}</p>
            </div>

            <div class="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-3 shadow-sm lang-switcher">
              <i class="bi bi-translate text-primary"></i>
              <select class="form-select form-select-sm border-0 bg-transparent fw-medium" v-model="currentLang">
                <option value="id">🇮🇩 Bahasa Indonesia</option>
                <option value="en">🇺🇸 English Language</option>
              </select>
            </div>
          </div>

          <!-- Quick stat strip -->
          <div class="hero-stat-strip position-relative mt-4">
            <div class="hero-stat">
              <span class="hero-stat-icon"><i class="bi bi-car-front"></i></span>
              <div>
                <small class="d-block text-white-50">{{ t('fleetAvailable') }}</small>
                <strong class="text-white fs-5">{{ totalMobilTersedia }} <span class="fs-6 fw-normal">{{ t('unit') }}</span></strong>
              </div>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-icon"><i class="bi bi-journal-check"></i></span>
              <div>
                <small class="d-block text-white-50">{{ t('myTotalBookings') }}</small>
                <strong class="text-white fs-5">{{ myBookings.length }}</strong>
              </div>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-icon"><i class="bi bi-hourglass-split"></i></span>
              <div>
                <small class="d-block text-white-50">{{ t('onProgress') }}</small>
                <strong class="text-white fs-5">{{ inProgressCount }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Form Pengajuan -->
        <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden form-card">
          <div class="card-header bg-white py-3 px-4 border-0 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center">
              <span class="icon-badge me-2"><i class="bi bi-pencil-square"></i></span>
              <h5 class="fw-bold mb-0 text-dark">{{ t('formHeader') }}</h5>
            </div>
            
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill">
              <i class="bi bi-car-front"></i> {{ t('fleetAvailable') }}: <strong>{{ totalMobilTersedia }} {{ t('unit') }}</strong>
            </span>
          </div>

          <div class="card-body p-4">
            <!-- Data Pemohon -->
            <div class="applicant-card p-3 rounded-3 mb-4">
              <div class="row g-3">
                <div class="col-md-4">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-person-circle text-primary fs-4"></i>
                    <div>
                      <small class="text-muted d-block text-uppercase fw-semibold fs-7">{{ t('applicantName') }}</small>
                      <strong class="text-dark">{{ user.name || '-' }}</strong>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-card-heading text-primary fs-4"></i>
                    <div>
                      <small class="text-muted d-block text-uppercase fw-semibold fs-7">{{ t('employeeId') }}</small>
                      <strong class="text-dark">{{ user.nopegawai || '-' }}</strong>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-building text-primary fs-4"></i>
                    <div>
                      <small class="text-muted d-block text-uppercase fw-semibold fs-7">{{ t('department') }}</small>
                      <strong class="text-dark">{{ user.dept || '-' }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form @submit.prevent="submitBooking">
              <!-- SECTION 1: DETAIL PERJALANAN -->
              <div class="section-title">
                <span class="section-number">1</span>
                <span>{{ t('sectionTrip') }}</span>
              </div>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label fw-medium text-secondary">{{ t('tripType') }} <span class="text-danger">*</span></label>
                  <div class="trip-type-tabs" role="group">
                    <button
                      type="button"
                      v-for="opt in tripTypeOptions"
                      :key="opt.value"
                      class="trip-type-tab"
                      :class="{ active: formBooking.jenis_perjalanan === opt.value }"
                      @click="formBooking.jenis_perjalanan = opt.value"
                    >
                      <i :class="opt.icon"></i> {{ t(opt.labelKey) }}
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-medium text-secondary">{{ t('passengerCount') }} <span class="text-danger">*</span></label>
                  <div class="input-group input-group-lg">
                    <span class="input-group-text bg-white"><i class="bi bi-people-fill text-primary"></i></span>
                    <input type="number" min="1" class="form-control rounded-end-3 fs-6" v-model="formBooking.jumlah_org" required />
                  </div>
                </div>

                <div v-if="formBooking.jenis_perjalanan === 'Terjadwal'" class="col-12">
                  <div class="alert alert-info border-0 rounded-3 mb-0 d-flex align-items-center gap-2 p-3">
                    <i class="bi bi-calendar-event-fill fs-5 flex-shrink-0"></i>
                    <div class="small">{{ t('scheduledNotice') }}</div>
                  </div>
                </div>

                <!-- ROUTE PICKER: ASAL <-> TUJUAN -->
                <div class="col-12">
                  <div class="route-picker">
                    <!-- LOKASI ASAL -->
                    <div class="route-field">
                      <span class="route-dot route-dot-origin"></span>
                      <div class="flex-grow-1">
                        <label class="form-label fw-medium text-secondary mb-1">{{ t('departureLocation') }} <span class="text-danger">*</span></label>
                        <select class="form-select form-select-lg rounded-3 fs-6" v-model="asalPilihan">
                          <option value="" disabled>{{ t('selectLocation') }}</option>
                          <option v-for="loc in listTujuan" :key="'asal-' + loc.id" :value="loc.id">{{ loc.nama_lokasi }}</option>
                          <option value="__custom__">➕ {{ t('addNewLocation') }}</option>
                        </select>
                        <template v-if="asalPilihan === '__custom__'">
                          <input
                            type="text"
                            class="form-control rounded-3 fs-6 mt-2"
                            v-model="asalCustom"
                            :placeholder="t('customLocationPlaceholder')"
                            required
                          />
                          <div class="location-type-tabs mt-2">
                            <button
                              type="button"
                              class="location-type-btn"
                              :class="{ active: asalCustomTipe === 'dalam' }"
                              :disabled="!asalCustom.trim()"
                              @click="applyLocationType('asal', 'dalam')"
                            >
                              <i class="bi bi-geo-alt-fill"></i> {{ t('dalamKota') }}
                            </button>
                            <button
                              type="button"
                              class="location-type-btn"
                              :class="{ active: asalCustomTipe === 'luar' }"
                              :disabled="!asalCustom.trim()"
                              @click="applyLocationType('asal', 'luar')"
                            >
                              <i class="bi bi-signpost-2-fill"></i> {{ t('luarKota') }}
                            </button>
                          </div>
                          <small v-if="!asalCustom.trim()" class="text-muted d-block mt-1">{{ t('locationTypeHint') }}</small>
                          <small v-else-if="!asalCustomTipe" class="text-danger d-block mt-1">{{ t('locationTypeRequired') }}</small>
                        </template>
                      </div>
                    </div>

                    <!-- SWAP BUTTON -->
                    <button
                      type="button"
                      class="route-swap-btn"
                      :title="t('swapRoute')"
                      @click="swapLocations"
                    >
                      <i class="bi bi-arrow-down-up"></i>
                    </button>

                    <div class="route-divider"></div>

                    <!-- TUJUAN -->
                    <div class="route-field">
                      <span class="route-dot route-dot-destination"></span>
                      <div class="flex-grow-1">
                        <label class="form-label fw-medium text-secondary mb-1">{{ t('destination') }} <span class="text-danger">*</span></label>
                        <select class="form-select form-select-lg rounded-3 fs-6" v-model="tujuanPilihan">
                          <option value="" disabled>{{ t('selectLocation') }}</option>
                          <option v-for="loc in listTujuan" :key="'tujuan-' + loc.id" :value="loc.id">{{ loc.nama_lokasi }}</option>
                          <option value="__custom__">➕ {{ t('addNewLocation') }}</option>
                        </select>
                        <template v-if="tujuanPilihan === '__custom__'">
                          <input
                            type="text"
                            class="form-control rounded-3 fs-6 mt-2"
                            v-model="tujuanCustom"
                            :placeholder="t('customLocationPlaceholder')"
                            required
                          />
                          <div class="location-type-tabs mt-2">
                            <button
                              type="button"
                              class="location-type-btn"
                              :class="{ active: tujuanCustomTipe === 'dalam' }"
                              :disabled="!tujuanCustom.trim()"
                              @click="applyLocationType('tujuan', 'dalam')"
                            >
                              <i class="bi bi-geo-alt-fill"></i> {{ t('dalamKota') }}
                            </button>
                            <button
                              type="button"
                              class="location-type-btn"
                              :class="{ active: tujuanCustomTipe === 'luar' }"
                              :disabled="!tujuanCustom.trim()"
                              @click="applyLocationType('tujuan', 'luar')"
                            >
                              <i class="bi bi-signpost-2-fill"></i> {{ t('luarKota') }}
                            </button>
                          </div>
                          <small v-if="!tujuanCustom.trim()" class="text-muted d-block mt-1">{{ t('locationTypeHint') }}</small>
                          <small v-else-if="!tujuanCustomTipe" class="text-danger d-block mt-1">{{ t('locationTypeRequired') }}</small>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- SECTION 2: JADWAL PERJALANAN -->
              <div class="section-title">
                <span class="section-number">2</span>
                <span>{{ t('sectionSchedule') }}</span>
              </div>
              <div class="row g-3 mb-4 ticket-row">
                <div class="col-md-6">
                  <div class="schedule-box schedule-box-depart p-3 rounded-3">
                    <div class="d-flex align-items-center gap-2 mb-3">
                      <span class="schedule-icon bg-primary-subtle text-primary"><i class="bi bi-box-arrow-right"></i></span>
                      <strong class="text-dark">{{ t('departureSchedule') }}</strong>
                    </div>
                    <div class="row g-2">
                      <div class="col-6">
                        <label class="form-label small text-muted mb-1">{{ t('date') }} <span class="text-danger">*</span></label>
                        <input type="date" class="form-control rounded-3" :min="minDate" v-model="formBooking.tgl_berangkat" required />
                      </div>
                      <div class="col-6">
                        <label class="form-label small text-muted mb-1">{{ t('time') }} <span class="text-danger">*</span></label>
                        <input type="time" class="form-control rounded-3" v-model="formBooking.jam_berangkat" required />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6" v-if="formBooking.jenis_perjalanan !== 'Sekali Jalan'">
                  <div class="schedule-box schedule-box-return p-3 rounded-3">
                    <div class="d-flex align-items-center gap-2 mb-3">
                      <span class="schedule-icon bg-info-subtle text-info"><i class="bi bi-box-arrow-in-left"></i></span>
                      <strong class="text-dark">{{ t('returnSchedule') }}</strong>
                      <span class="badge bg-danger-subtle text-danger fw-semibold ms-auto">Wajib Diisi</span>
                    </div>
                    <div class="row g-2">
                      <div class="col-6">
                        <label class="form-label small text-muted mb-1">{{ t('date') }} <span class="text-danger">*</span></label>
                        <input type="date" class="form-control rounded-3" :min="formBooking.tgl_berangkat || minDate" v-model="formBooking.tgl_kembali" required />
                      </div>
                      <div class="col-6">
                        <label class="form-label small text-muted mb-1">{{ t('time') }} <span class="text-danger">*</span></label>
                        <input type="time" class="form-control rounded-3" v-model="formBooking.jam_kembali" required />
                      </div>
                      <div class="col-12">
                        <small class="text-muted"><i class="bi bi-info-circle me-1"></i>{{ t('returnScheduleSameDayHint') }}</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6" v-else>
                  <div class="schedule-box schedule-box-return p-3 rounded-3 h-100 d-flex flex-column justify-content-center">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="schedule-icon bg-info-subtle text-info"><i class="bi bi-box-arrow-in-left"></i></span>
                      <strong class="text-dark">{{ t('returnSchedule') }}</strong>
                      <span class="badge bg-light text-muted fw-normal ms-auto">{{ t('optional') }}</span>
                    </div>
                    <div class="small text-muted">
                      <i class="bi bi-info-circle me-1"></i>{{ t('returnScheduleOneWayNotice') }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- WARNING / NOTIFIKASI REALTIME KUOTA ARMADA -->
              <div v-if="totalMobilTersedia === 0" class="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-3 p-3">
                <i class="bi bi-x-circle-fill fs-4 text-danger flex-shrink-0"></i>
                <div>
                  <strong class="d-block fs-6">TIDAK ADA ARMADA TERSEDIA</strong>
                  <span class="small">Saat ini tidak ada mobil yang berstatus 'Tersedia' di dalam sistem.</span>
                </div>
              </div>

              <div v-else-if="fleetCheck.isConflict" class="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-start gap-3 p-3">
                <i class="bi bi-exclamation-octagon-fill fs-4 text-danger flex-shrink-0"></i>
                <div>
                  <strong class="d-block fs-6">⚠️ KAPASITAS ARMADA PENUH!</strong>
                  <span class="small">
                    Pada jam/tanggal ini sudah ada <strong>{{ fleetCheck.count }} booking aktif</strong> yang berjalan bersamaan (termasuk buffer 3 jam). 
                    Kapasitas mobil berstatus 'Tersedia' saat ini adalah <strong>{{ totalMobilTersedia }} unit</strong>. Silakan tentukan slot waktu lain!
                  </span>
                </div>
              </div>

              <div v-else-if="fleetCheck.count > 0" class="alert alert-warning border-0 rounded-3 mb-4 d-flex align-items-center gap-3 p-3">
                <i class="bi bi-info-circle-fill fs-5 text-warning-emphasis flex-shrink-0"></i>
                <div class="small">
                  ℹ️ Slot waktu ini beririsan dengan <strong>{{ fleetCheck.count }} booking lain</strong>. Armada masih tersedia (Sisa Kuota: <strong>{{ totalMobilTersedia - fleetCheck.count }} mobil</strong>).
                </div>
              </div>

              <!-- SEARCH LOKASI OTOMATIS BEBAS GRATIS VIA OPENSTREETMAP (NOMINATIM) -->
              <div class="col-12 mt-3 mb-3 position-relative">
                <label class="form-label fw-medium text-secondary">{{ t('mapsLocation') }}</label>
                <div class="input-group input-group-lg">
                  <span class="input-group-text bg-white"><i class="bi bi-geo-alt-fill text-primary"></i></span>
                  <input
                    type="text"
                    class="form-control fs-6"
                    v-model="searchQueryLocation"
                    @input="searchOsmLocation"
                    placeholder="Ketik nama tempat/gedung/jalan (cth: Monas, Jakarta)..."
                  />
                  <button
                    type="button"
                    class="btn btn-outline-primary d-flex align-items-center gap-1"
                    @click="openMapPicker"
                    title="Pilih Titik Lokasi di Peta"
                  >
                    <i class="bi bi-map"></i>
                    <span class="d-none d-sm-inline">Buka Peta</span>
                  </button>
                </div>
                <div class="form-text">
                  <i class="bi bi-info-circle me-1"></i>Kalau nama tempat gak ketemu di pencarian, klik <strong>"Buka Peta"</strong> lalu tap langsung titik lokasinya.
                </div>

                <!-- Dropdown Hasil Pencarian OpenStreetMap -->
                <ul v-if="osmSuggestions.length > 0" class="dropdown-menu show w-100 shadow-lg mt-1 overflow-auto" style="max-height: 250px; z-index: 1050;">
                  <li v-for="(item, index) in osmSuggestions" :key="index">
                    <a class="dropdown-item py-2 border-bottom text-wrap" href="javascript:void(0)" @click="selectOsmLocation(item)">
                      <i class="bi bi-geo-alt text-primary me-2"></i>
                      <span class="small fw-semibold">{{ item.display_name }}</span>
                    </a>
                  </li>
                </ul>

                <!-- Hidden Input / Preview Link Google Maps yang terisi Otomatis -->
                <div v-if="formBooking.maps" class="mt-2 text-success small d-flex align-items-center gap-2 bg-success-subtle p-2 rounded-3 border border-success-subtle">
                  <i class="bi bi-check-circle-fill fs-6 text-success"></i>
                  <span class="text-truncate"><strong>Link Maps Terisi Otomatis:</strong> {{ formBooking.maps }}</span>
                  <button type="button" class="btn-close ms-auto btn-sm" @click="clearMapsLink"></button>
                </div>
              </div>

              <!-- SECTION 3: PENUMPANG & KEPERLUAN -->
              <div class="section-title">
                <span class="section-number">3</span>
                <span>{{ t('sectionDetails') }}</span>
              </div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label fw-medium text-secondary">{{ t('passengerList') }}</label>
                  <textarea class="form-control rounded-3" rows="2" v-model="formBooking.daftar_penumpang" :placeholder="t('passengerPlaceholder')"></textarea>
                </div>
                <div class="col-12">
                  <label class="form-label fw-medium text-secondary">{{ t('purpose') }} <span class="text-danger">*</span></label>
                  <textarea class="form-control rounded-3" rows="3" v-model="formBooking.remark" :placeholder="t('purposePlaceholder')" required></textarea>
                </div>
              </div>

              <div class="alert alert-primary-subtle text-primary border-0 rounded-3 mt-4 mb-3 d-flex align-items-center gap-2 p-3">
                <i class="bi bi-info-circle-fill fs-5 flex-shrink-0"></i>
                <div class="small">{{ t('financeNotice') }}</div>
              </div>

              <div class="d-flex justify-content-end">
                <button 
                  type="submit" 
                  class="btn btn-submit btn-lg rounded-3 px-5 fw-semibold fs-6" 
                  :disabled="loading || fleetCheck.isConflict || totalMobilTersedia === 0"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  <i v-else class="bi bi-send-fill me-2"></i>
                  {{ t('submitBtn') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Card Riwayat Booking -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div class="card-header bg-white py-3 px-4 border-0 border-bottom">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div class="d-flex align-items-center">
                <span class="icon-badge icon-badge-secondary me-2"><i class="bi bi-journal-text"></i></span>
                <h5 class="fw-bold mb-0 text-dark">{{ t('myBookingsHeader') }}</h5>
              </div>
              <button class="btn btn-sm btn-outline-secondary rounded-3 d-flex align-items-center gap-1" @click="fetchData">
                <i class="bi bi-arrow-clockwise"></i> {{ t('refresh') }}
              </button>
            </div>

            <!-- Search & Filter Toolbar -->
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <div class="search-box flex-grow-1">
                <i class="bi bi-search"></i>
                <input
                  type="text"
                  class="form-control"
                  v-model="searchQuery"
                  :placeholder="t('searchPlaceholder')"
                />
              </div>
              <div class="filter-chips">
                <button
                  v-for="chip in statusChips"
                  :key="chip.value"
                  type="button"
                  class="filter-chip"
                  :class="{ active: filterStatus === chip.value }"
                  @click="filterStatus = chip.value"
                >
                  {{ chip.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="card-body p-4">
            <!-- Empty state: belum ada booking sama sekali -->
            <div v-if="myBookings.length === 0" class="empty-state text-center py-5">
              <i class="bi bi-inbox display-4 text-secondary opacity-50 d-block mb-3"></i>
              <p class="text-muted mb-0">{{ t('noBookings') }}</p>
            </div>

            <!-- Empty state: hasil filter/pencarian kosong -->
            <div v-else-if="filteredBookings.length === 0" class="empty-state text-center py-5">
              <i class="bi bi-search display-4 text-secondary opacity-50 d-block mb-3"></i>
              <p class="text-muted mb-0">{{ t('noResults') }}</p>
            </div>

            <!-- List kartu booking -->
            <div v-else class="booking-list">
              <div
                v-for="b in filteredBookings"
                :key="b.id"
                class="booking-ticket"
                :class="'ticket-' + statusTone(b.status_booking)"
              >
                <div class="booking-ticket-main">
                  <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                    <div class="d-flex align-items-center gap-2">
                      <span class="booking-code">{{ b.kode_booking }}</span>
                      <span class="badge bg-light text-dark border fw-medium">{{ b.jenis_perjalanan }}</span>
                    </div>
                    <span class="badge rounded-pill px-3 py-2 fw-medium d-inline-flex align-items-center gap-1" :class="statusBadge(b.status_booking)">
                      <i :class="statusIcon(b.status_booking)"></i> {{ b.status_booking }}
                    </span>
                  </div>

                  <!-- Route visual -->
                  <div class="booking-route mb-3">
                    <div class="booking-route-point">
                      <span class="route-dot route-dot-origin"></span>
                      <span class="text-dark fw-medium">{{ b.dari_lokasi || '-' }}</span>
                    </div>
                    <i class="bi bi-arrow-right text-secondary booking-route-arrow"></i>
                    <div class="booking-route-point">
                      <span class="route-dot route-dot-destination"></span>
                      <span class="text-dark fw-medium">{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</span>
                    </div>
                  </div>

                  <div class="booking-meta-grid">
                    <div class="booking-meta-item">
                      <i class="bi bi-calendar3 text-primary"></i>
                      <div>
                        <small class="text-muted d-block">{{ t('colDate') }}</small>
                        <span class="fw-medium text-dark small">
                          {{ b.tgl_berangkat }} {{ b.jam_berangkat || '' }}
                          <span v-if="b.tgl_kembali" class="d-block text-muted">s/d {{ b.tgl_kembali }} {{ b.jam_kembali || '' }}</span>
                        </span>
                      </div>
                    </div>
                    <div class="booking-meta-item">
                      <i class="bi bi-car-front text-primary"></i>
                      <div>
                        <small class="text-muted d-block">{{ t('colCar') }}</small>
                        <span class="fw-medium text-dark small">{{ b.mobil ? `${b.mobil.nama_mobil} (${b.mobil.plat_nomor})` : t('notAssignedYet') }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="booking-ticket-action d-flex flex-column align-items-end gap-2">
                  <button
                    v-if="canEditReturnTime(b)"
                    class="btn btn-sm btn-outline-primary rounded-3 d-inline-flex align-items-center gap-1"
                    @click="openReturnTimeModal(b)"
                    :title="t('editReturnTime')"
                  >
                    <i class="bi bi-clock-history"></i> {{ t('editReturnTimeBtn') }}
                  </button>
                  <button 
                    v-if="['Waiting GA', 'Waiting Finance', 'Waiting Manager', 'Ready'].includes(b.status_booking)"
                    class="btn btn-sm btn-outline-danger rounded-3 d-inline-flex align-items-center gap-1"
                    @click="cancelBooking(b.id)"
                    :title="t('cancelBooking')"
                  >
                    <i class="bi bi-x-circle"></i> {{ t('cancelBtn') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <Footer />

    <!-- MODAL: UBAH WAKTU KEMBALI (PERPANJANG / PERPENDEK) -->
    <div v-if="showReturnTimeModal" class="map-picker-overlay" @click.self="closeReturnTimeModal">
      <div class="map-picker-box" style="max-width: 420px;">
        <div class="map-picker-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-clock-history text-primary fs-5"></i>
            <strong>{{ t('editReturnTimeModalTitle') }}</strong>
          </div>
          <button type="button" class="btn-close" @click="closeReturnTimeModal"></button>
        </div>
        <div class="p-4">
          <div class="mb-3">
            <label class="form-label fw-medium text-secondary">{{ t('editReturnTimeNewDate') }}</label>
            <input type="date" class="form-control rounded-3" v-model="returnTimeForm.tgl_kembali" />
          </div>
          <div class="mb-1">
            <label class="form-label fw-medium text-secondary">{{ t('editReturnTimeNewTime') }}</label>
            <input type="time" class="form-control rounded-3" v-model="returnTimeForm.jam_kembali" />
          </div>
        </div>
        <div class="map-picker-footer">
          <button type="button" class="btn btn-light rounded-3 ms-auto" @click="closeReturnTimeModal">
            {{ t('editReturnTimeCancel') }}
          </button>
          <button type="button" class="btn btn-primary rounded-3" :disabled="savingReturnTime" @click="submitReturnTime">
            <span v-if="savingReturnTime" class="spinner-border spinner-border-sm me-1"></span>
            {{ t('editReturnTimeSave') }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: PILIH TITIK LOKASI DI PETA (LEAFLET / OPENSTREETMAP) -->
    <div v-if="showMapPicker" class="map-picker-overlay" @click.self="closeMapPicker">
      <div class="map-picker-box">
        <div class="map-picker-header">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-map text-primary fs-5"></i>
            <strong>Tap / Klik di peta untuk taruh titik lokasi tujuan</strong>
          </div>
          <button type="button" class="btn-close" @click="closeMapPicker"></button>
        </div>

        <div id="leafletMapContainer" class="map-picker-canvas"></div>

        <div class="map-picker-footer">
          <div class="small text-muted flex-grow-1">
            <i class="bi bi-geo-alt-fill text-danger me-1"></i>
            <span v-if="pickedLatLng">{{ pickedAddressPreview || 'Mengambil nama lokasi...' }}</span>
            <span v-else>Belum ada titik dipilih. Klik di peta.</span>
          </div>
          <button type="button" class="btn btn-outline-secondary" @click="closeMapPicker">Batal</button>
          <button type="button" class="btn btn-primary" :disabled="!pickedLatLng" @click="confirmMapPicker">
            <i class="bi bi-check-lg me-1"></i>Gunakan Titik Ini
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import Header from '../../components/Header.vue'
import Sidebar from '../../components/Sidebar.vue'
import Footer from '../../components/Footer.vue'
import { useAuthUser } from './Useauthuser.js'

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

const minDate = computed(() => new Date().toISOString().split('T')[0])

// --- MULTI LANGUAGE TRANSLATION ---
const currentLang = ref('id')
const translations = {
  id: {
    eyebrow: 'Layanan Transportasi Internal',
    title: 'Pengajuan Booking Mobil',
    subtitle: 'Isi form di bawah untuk mengajukan booking mobil operasional.',
    fleetAvailable: 'Armada Tersedia',
    unit: 'Unit',
    myTotalBookings: 'Total Booking Saya',
    onProgress: 'Sedang Diproses',
    swapRoute: 'Tukar lokasi asal & tujuan',
    mapsLocation: 'Lokasi Google Maps / Peta',
    searchPlaceholder: 'Cari kode booking atau tujuan...',
    noResults: 'Tidak ada booking yang cocok dengan pencarian/filter.',
    notAssignedYet: 'Belum ditentukan',
    cancelBooking: 'Batalkan Booking',
    cancelBtn: 'Batal',
    editReturnTime: 'Ubah tanggal & jam kembali',
    editReturnTimeBtn: 'Ubah Waktu Kembali',
    editReturnTimeModalTitle: 'Perpanjang / Perpendek Waktu Kembali',
    editReturnTimeNewDate: 'Tanggal Kembali Baru',
    editReturnTimeNewTime: 'Jam Kembali Baru',
    editReturnTimeSave: 'Simpan Perubahan',
    editReturnTimeCancel: 'Batal',
    filterAll: 'Semua',
    filterOnProgress: 'Diproses',
    filterApproved: 'Disetujui',
    filterCancelled: 'Dibatalkan/Ditolak',
    formHeader: 'Formulir Pengajuan',
    applicantName: 'Nama Pemohon',
    employeeId: 'No. Pegawai',
    department: 'Departemen',
    sectionTrip: 'Detail Perjalanan',
    sectionSchedule: 'Jadwal Perjalanan',
    sectionDetails: 'Penumpang & Keperluan',
    tripType: 'Jenis Perjalanan',
    oneWay: 'Sekali Jalan',
    roundTrip: 'Pulang Pergi (PP)',
    scheduled: 'Terjadwal (Booking Dimuka)',
    scheduledNotice: 'Untuk perjalanan terjadwal, persetujuan GA serta penunjukan unit mobil & driver dilakukan pada hari H keberangkatan.',
    passengerCount: 'Jumlah Penumpang',
    departureLocation: 'Lokasi Asal / Keberangkatan',
    destination: 'Tujuan',
    selectLocation: '— pilih lokasi —',
    addNewLocation: 'Tambah lokasi baru',
    customLocationPlaceholder: 'Ketik nama lokasi baru...',
    dalamKota: 'Dalam Kota Tegal',
    luarKota: 'Luar Kota',
    locationTypeHint: 'Isi nama lokasi terlebih dahulu untuk memilih Dalam Kota / Luar Kota.',
    locationTypeRequired: 'Wajib pilih Dalam Kota atau Luar Kota.',
    departureSchedule: 'Waktu Berangkat',
    returnSchedule: 'Waktu Kembali',
    optional: 'Opsional',
    returnScheduleOneWayNotice: 'Untuk Sekali Jalan, waktu kembali tidak perlu diisi di sini. Setelah booking berjalan, driver akan mengisi/mengubah waktu kembali langsung dari aplikasi.',
    returnScheduleSameDayHint: 'Boleh pulang di hari yang sama, asalkan jam kembalinya lebih siang/malam dari jam berangkat.',
    date: 'Tanggal',
    time: 'Jam',
    passengerList: 'Daftar Nama Penumpang',
    passengerPlaceholder: 'Contoh: nama penumpang',
    purpose: 'Keperluan / Catatan',
    purposePlaceholder: 'Keperluan dinas luar, kunjungan vendor, dll.',
    financeNotice: 'Kategori biaya & nominal kasbon akan diisi oleh tim Finance setelah booking disetujui GA.',
    submitBtn: 'Kirim Pengajuan',
    myBookingsHeader: 'Booking Saya',
    refresh: 'Refresh',
    noBookings: 'Belum ada pengajuan booking.'
  },
  en: {
    eyebrow: 'Internal Transport Service',
    title: 'Car Booking Request',
    subtitle: 'Fill in the form below to request an operational car booking.',
    fleetAvailable: 'Fleet Available',
    unit: 'Units',
    myTotalBookings: 'My Total Bookings',
    onProgress: 'In Progress',
    swapRoute: 'Swap departure & destination',
    mapsLocation: 'Google Maps / Map Location',
    searchPlaceholder: 'Search booking code or destination...',
    noResults: 'No bookings match your search/filter.',
    notAssignedYet: 'Not assigned yet',
    cancelBooking: 'Cancel Booking',
    cancelBtn: 'Cancel',
    editReturnTime: 'Change return date & time',
    editReturnTimeBtn: 'Change Return Time',
    editReturnTimeModalTitle: 'Extend / Shorten Return Time',
    editReturnTimeNewDate: 'New Return Date',
    editReturnTimeNewTime: 'New Return Time',
    editReturnTimeSave: 'Save Changes',
    editReturnTimeCancel: 'Cancel',
    filterAll: 'All',
    filterOnProgress: 'In Progress',
    filterApproved: 'Approved',
    filterCancelled: 'Cancelled/Rejected',
    formHeader: 'Request Form',
    applicantName: 'Applicant Name',
    employeeId: 'Employee ID',
    department: 'Department',
    sectionTrip: 'Trip Details',
    sectionSchedule: 'Trip Schedule',
    sectionDetails: 'Passengers & Purpose',
    tripType: 'Trip Type',
    oneWay: 'One Way',
    roundTrip: 'Round Trip',
    scheduled: 'Scheduled (Advance Booking)',
    scheduledNotice: 'Fill in all forms.',
    passengerCount: 'Passenger Count',
    departureLocation: 'Departure Location',
    destination: 'Destination',
    selectLocation: '— select a location —',
    addNewLocation: 'Add new location',
    customLocationPlaceholder: 'Type new location name...',
    dalamKota: 'In-City Tegal',
    luarKota: 'Out-of-City',
    locationTypeHint: 'Fill in the location name first to choose In-City / Out-of-City.',
    locationTypeRequired: 'You must choose In-City or Out-of-City.',
    departureSchedule: 'Departure Time',
    returnSchedule: 'Return Time',
    optional: 'Optional',
    returnScheduleOneWayNotice: 'For One Way trips, you don\'t need to set the return time here. Once the booking is underway, the driver will set/update the return time from the app.',
    returnScheduleSameDayHint: 'You can return the same day, as long as the return time is later than the departure time.',
    date: 'Date',
    time: 'Time',
    passengerList: 'Passenger List',
    passengerPlaceholder: 'E.g., name pasengger',
    purpose: 'Purpose / Remark',
    purposePlaceholder: 'Business trip purpose, vendor visit, etc.',
    financeNotice: 'Fill in all forms.',
    submitBtn: 'Submit Request',
    myBookingsHeader: 'My Bookings',
    refresh: 'Refresh',
    noBookings: 'No booking requests found.'
  }
}

const t = (key) => translations[currentLang.value]?.[key] || translations['id'][key]

const detectBrowserLanguage = () => {
  const browserLang = (navigator.language || navigator.userLanguage || 'id').toLowerCase()
  currentLang.value = browserLang.startsWith('en') ? 'en' : 'id'
}

// --- STATE DATA ---
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return { headers }
}

const loading = ref(false)
const listTujuan = ref([])
const myBookings = ref([])
const allSystemBookings = ref([])
const totalMobilTersedia = ref(0)

const asalPilihan = ref('')
const asalCustom = ref('')
const asalCustomTipe = ref('') // 'dalam' | 'luar'
const tujuanPilihan = ref('')
const tujuanCustom = ref('')
const tujuanCustomTipe = ref('') // 'dalam' | 'luar'

const NAMA_KOTA_DEFAULT = 'Tegal'

// --- SET TIPE LOKASI (DALAM KOTA / LUAR KOTA) UNTUK LOKASI CUSTOM ---
// Saat "Dalam Kota" dipilih, nama kota (Tegal) otomatis ditambahkan di belakang.
// Saat "Luar Kota" dipilih, suffix nama kota tersebut dihapus lagi.
const applyLocationType = (field, tipe) => {
  const customRef = field === 'asal' ? asalCustom : tujuanCustom
  const tipeRef = field === 'asal' ? asalCustomTipe : tujuanCustomTipe

  // Jaga-jaga: tombol seharusnya sudah disabled selama teks lokasi masih kosong,
  // tapi tetap dicegah di sini supaya tidak bisa "ke-skip" lewat cara lain.
  if (!customRef.value.trim()) return

  tipeRef.value = tipe

  const suffixRegex = new RegExp(`\\s*,?\\s*${NAMA_KOTA_DEFAULT}\\s*$`, 'i')
  const namaBersih = customRef.value.trim().replace(suffixRegex, '').trim()

  if (tipe === 'dalam') {
    customRef.value = namaBersih ? `${namaBersih} ${NAMA_KOTA_DEFAULT}` : namaBersih
  } else {
    customRef.value = namaBersih
  }
}

// Reset tipe & teks custom setiap kali dropdown lokasi asal/tujuan diganti
watch(asalPilihan, (val) => {
  if (val !== '__custom__') {
    asalCustom.value = ''
    asalCustomTipe.value = ''
  }
})
watch(tujuanPilihan, (val) => {
  if (val !== '__custom__') {
    tujuanCustom.value = ''
    tujuanCustomTipe.value = ''
  }
})

// --- INTEGRASI OPENSTREETMAP (NOMINATIM) ---
const searchQueryLocation = ref('')
const osmSuggestions = ref([])

// --- MAP PICKER (KLIK LANGSUNG DI PETA VIA LEAFLET/OPENSTREETMAP) ---
const showMapPicker = ref(false)
const pickedLatLng = ref(null)
const pickedAddressPreview = ref('')
let leafletMapInstance = null
let leafletMarker = null
let leafletLoadingPromise = null

const loadLeaflet = () => {
  if (window.L && window.L.Control.Geocoder) return Promise.resolve()
  if (leafletLoadingPromise) return leafletLoadingPromise

  leafletLoadingPromise = new Promise((resolve, reject) => {
    // CSS Leaflet
    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(cssLink)

    // CSS Geocoder Search Control
    const cssGeocoder = document.createElement('link')
    cssGeocoder.rel = 'stylesheet'
    cssGeocoder.href = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css'
    document.head.appendChild(cssGeocoder)

    // JS Leaflet
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      // JS Geocoder Search Control
      const scriptGeocoder = document.createElement('script')
      scriptGeocoder.src = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js'
      scriptGeocoder.onload = () => resolve()
      scriptGeocoder.onerror = () => reject(new Error('Gagal memuat plugin geocoder.'))
      document.head.appendChild(scriptGeocoder)
    }
    script.onerror = () => reject(new Error('Gagal memuat peta.'))
    document.head.appendChild(script)
  })
  return leafletLoadingPromise
}

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json' }
    })
    pickedAddressPreview.value = res.data?.display_name || `Titik (${lat.toFixed(5)}, ${lng.toFixed(5)})`
  } catch (e) {
    pickedAddressPreview.value = `Titik (${lat.toFixed(5)}, ${lng.toFixed(5)})`
  }
}

const placeMarker = (lat, lng) => {
  pickedLatLng.value = { lat, lng }
  if (leafletMarker) {
    leafletMarker.setLatLng([lat, lng])
  } else {
    leafletMarker = window.L.marker([lat, lng], { draggable: true }).addTo(leafletMapInstance)
    leafletMarker.on('dragend', () => {
      const pos = leafletMarker.getLatLng()
      pickedLatLng.value = { lat: pos.lat, lng: pos.lng }
      reverseGeocode(pos.lat, pos.lng)
    })
  }
  reverseGeocode(lat, lng)
}

const openMapPicker = async () => {
  showMapPicker.value = true
  pickedLatLng.value = null
  pickedAddressPreview.value = ''

  await loadLeaflet()
  await nextTick()

  let startLat = -6.2088
  let startLng = 106.8456
  const existingMatch = formBooking.maps.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (existingMatch) {
    startLat = parseFloat(existingMatch[1])
    startLng = parseFloat(existingMatch[2])
  }

  if (leafletMapInstance) {
    leafletMapInstance.remove()
    leafletMapInstance = null
    leafletMarker = null
  }

  leafletMapInstance = window.L.map('leafletMapContainer').setView([startLat, startLng], 13)
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(leafletMapInstance)

  // --- FITUR SEARCH BAR DI DALAM PETA ---
  if (window.L.Control.geocoder) {
    const geocoder = window.L.Control.geocoder({
      defaultMarkGeocode: false,
      placeholder: 'Cari lokasi/alamat...',
      errorMessage: 'Lokasi tidak ditemukan.'
    })
      .on('markgeocode', (e) => {
        const { center, name } = e.geocode
        leafletMapInstance.setView(center, 16)
        placeMarker(center.lat, center.lng)
        pickedAddressPreview.value = name
      })
      .addTo(leafletMapInstance)
  }

  leafletMapInstance.on('click', (e) => {
    placeMarker(e.latlng.lat, e.latlng.lng)
  })

  if (existingMatch) {
    placeMarker(startLat, startLng)
  }

  setTimeout(() => leafletMapInstance && leafletMapInstance.invalidateSize(), 200)
}

const closeMapPicker = () => {
  showMapPicker.value = false
}

const confirmMapPicker = () => {
  if (!pickedLatLng.value) return
  const { lat, lng } = pickedLatLng.value
  formBooking.maps = `https://www.google.com/maps?q=${lat},${lng}`
  searchQueryLocation.value = pickedAddressPreview.value || `Titik (${lat.toFixed(5)}, ${lng.toFixed(5)})`
  osmSuggestions.value = []
  showMapPicker.value = false
}
let osmDebounceTimer = null

const searchOsmLocation = () => {
  clearTimeout(osmDebounceTimer)
  if (!searchQueryLocation.value || searchQueryLocation.value.trim().length < 3) {
    osmSuggestions.value = []
    return
  }

  // Debounce agar API tidak kelebihan request
  osmDebounceTimer = setTimeout(async () => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: searchQueryLocation.value,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          countrycodes: 'id' // Batasi hasil pencarian hanya di Indonesia
        }
      })
      osmSuggestions.value = response.data || []
    } catch (error) {
      console.error('Gagal mengambil data lokasi dari OpenStreetMap:', error)
    }
  }, 400)
}

const selectOsmLocation = (item) => {
  const lat = item.lat
  const lon = item.lon
  // Membuat link Google Maps otomatis berdasarkan koordinat lat/lng
  formBooking.maps = `https://www.google.com/maps?q=${lat},${lon}`
  searchQueryLocation.value = item.display_name
  osmSuggestions.value = []
}

const clearMapsLink = () => {
  formBooking.maps = ''
  searchQueryLocation.value = ''
}

// --- TRIP TYPE TABS ---
const tripTypeOptions = [
  { value: 'Sekali Jalan', labelKey: 'oneWay', icon: 'bi bi-arrow-right' },
  { value: 'PP', labelKey: 'roundTrip', icon: 'bi bi-arrow-left-right' },
  { value: 'Terjadwal', labelKey: 'scheduled', icon: 'bi bi-calendar-week' }
]

// --- SWAP LOKASI ASAL <-> TUJUAN ---
const swapLocations = () => {
  const tempPilihan = asalPilihan.value
  const tempCustom = asalCustom.value
  asalPilihan.value = tujuanPilihan.value
  asalCustom.value = tujuanCustom.value
  tujuanPilihan.value = tempPilihan
  tujuanCustom.value = tempCustom
}

// --- SEARCH & FILTER RIWAYAT BOOKING ---
const searchQuery = ref('')
const filterStatus = ref('all')

const statusChips = computed(() => [
  { value: 'all', label: t('filterAll') },
  { value: 'progress', label: t('filterOnProgress') },
  { value: 'approved', label: t('filterApproved') },
  { value: 'cancelled', label: t('filterCancelled') }
])

const statusTone = (status) => {
  if (['Approved', 'Completed'].includes(status)) return 'success'
  if (['Waiting GA', 'Waiting Finance', 'Waiting Manager'].includes(status)) return 'warning'
  if (['Ready', 'In Transit'].includes(status)) return 'info'
  if (['Cancelled', 'Rejected'].includes(status)) return 'danger'
  return 'secondary'
}

const statusIcon = (status) => {
  const map = {
    Approved: 'bi bi-check-circle-fill',
    Completed: 'bi bi-check-circle-fill',
    Ready: 'bi bi-flag-fill',
    'In Transit': 'bi bi-signpost-split-fill',
    'Waiting GA': 'bi bi-hourglass-split',
    'Waiting Finance': 'bi bi-hourglass-split',
    'Waiting Manager': 'bi bi-hourglass-split',
    Cancelled: 'bi bi-x-circle-fill',
    Rejected: 'bi bi-x-circle-fill'
  }
  return map[status] || 'bi bi-circle-fill'
}

const inProgressCount = computed(() =>
  myBookings.value.filter(b => statusTone(b.status_booking) === 'warning' || statusTone(b.status_booking) === 'info').length
)

const filteredBookings = computed(() => {
  let list = myBookings.value

  if (filterStatus.value !== 'all') {
    list = list.filter(b => {
      const tone = statusTone(b.status_booking)
      if (filterStatus.value === 'progress') return tone === 'warning' || tone === 'info'
      if (filterStatus.value === 'approved') return tone === 'success'
      if (filterStatus.value === 'cancelled') return tone === 'danger'
      return true
    })
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(b =>
      (b.kode_booking || '').toLowerCase().includes(q) ||
      (b.master_tujuan?.nama_lokasi || '').toLowerCase().includes(q) ||
      (b.lokasi_tujuan_custom || '').toLowerCase().includes(q) ||
      (b.dari_lokasi || '').toLowerCase().includes(q)
    )
  }

  return list
})

const formBooking = reactive({
  jenis_perjalanan: 'Sekali Jalan',
  dari_lokasi: '',
  tujuan_id: '',
  lokasi_tujuan_custom: '',
  tgl_berangkat: '',
  jam_berangkat: '',
  tgl_kembali: '',
  jam_kembali: '',
  jumlah_org: 1,
  daftar_penumpang: '',
  remark: '',
  maps: ''
})

watch(() => formBooking.jenis_perjalanan, (newType) => {
  if (newType === 'Sekali Jalan') {
    formBooking.tgl_kembali = ''
    formBooking.jam_kembali = ''
  }
})

watch([asalPilihan, asalCustom], () => {
  if (asalPilihan.value === '__custom__') {
    formBooking.dari_lokasi = asalCustom.value
  } else {
    const found = listTujuan.value.find(l => l.id === asalPilihan.value)
    formBooking.dari_lokasi = found ? found.nama_lokasi : ''
  }
})

watch([tujuanPilihan, tujuanCustom], () => {
  if (tujuanPilihan.value === '__custom__') {
    formBooking.tujuan_id = ''
    formBooking.lokasi_tujuan_custom = tujuanCustom.value
  } else {
    formBooking.tujuan_id = tujuanPilihan.value
    formBooking.lokasi_tujuan_custom = ''
  }
})

const fleetCheck = computed(() => {
  if (!formBooking.tgl_berangkat || !formBooking.jam_berangkat) {
    return { isConflict: false, count: 0 }
  }

  const startA = new Date(`${formBooking.tgl_berangkat}T${formBooking.jam_berangkat}:00`).getTime()
  if (isNaN(startA)) return { isConflict: false, count: 0 }

  let endTgl = formBooking.tgl_kembali || formBooking.tgl_berangkat
  // Untuk Sekali Jalan waktu kembali otomatis disamakan dengan waktu berangkat
  // (driver yang update nanti dari app), jadi estimasi konfliknya ikut jam berangkat.
  let endJam = formBooking.jam_kembali || (formBooking.jenis_perjalanan === 'Sekali Jalan' ? formBooking.jam_berangkat + ':00' : formBooking.jam_berangkat + ':00')
  let endA = new Date(`${endTgl}T${endJam}`).getTime()
  if (isNaN(endA)) endA = startA

  const JEDA_ISTIRAHAT_MS = 1 * 60 * 60 * 1000 // 1 jam, samakan dengan backend
  const endAWithBuffer = endA + JEDA_ISTIRAHAT_MS

  let overlappingCount = 0

  for (const exist of allSystemBookings.value) {
    if (['Cancelled', 'Rejected'].includes(exist.status_booking)) continue

    const startB = new Date(`${exist.tgl_berangkat}T${exist.jam_berangkat || '00:00:00'}`).getTime()
    
    let existEndTgl = exist.tgl_kembali || exist.tgl_berangkat
    let existEndJam = exist.jam_kembali || (exist.jam_berangkat ? exist.jam_berangkat + ':00' : '23:59:59')
    let endB = new Date(`${existEndTgl}T${existEndJam}`).getTime()
    
    const endBWithBuffer = endB + JEDA_ISTIRAHAT_MS

    if (startA < endBWithBuffer && endAWithBuffer > startB) {
      overlappingCount++
    }
  }

  const isConflict = overlappingCount >= totalMobilTersedia.value

  return {
    isConflict,
    count: overlappingCount
  }
})

const statusBadge = (status) => {
  const map = {
    Approved: 'bg-success-subtle text-success',
    Completed: 'bg-success-subtle text-success',
    Ready: 'bg-info-subtle text-info',
    'Waiting GA': 'bg-warning-subtle text-warning-emphasis',
    'Waiting Finance': 'bg-warning-subtle text-warning-emphasis',
    'Waiting Manager': 'bg-warning-subtle text-warning-emphasis',
    'In Transit': 'bg-info-subtle text-info',
    Cancelled: 'bg-danger-subtle text-danger',
    Rejected: 'bg-danger-subtle text-danger'
  }
  return map[status] || 'bg-secondary-subtle text-secondary'
}

const fetchData = async () => {
  try {
    const [resTujuan, resMy, resAll, resMobil] = await Promise.all([
      axios.get(`${API_BASE_URL}/carbook/tujuan`, getAuthHeaders()),
      axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params: { user_id: user.value.id } }),
      axios.get(`${API_BASE_URL}/carbook/booking`, getAuthHeaders()),
      axios.get(`${API_BASE_URL}/carbook/mobil`, getAuthHeaders()).catch(() => null)
    ])

    listTujuan.value = resTujuan.data.data || []
    myBookings.value = resMy.data.data || []
    allSystemBookings.value = resAll.data.data || []

    if (resMobil && resMobil.data?.data) {
      const mobilTersediaList = resMobil.data.data.filter(
        m => m.status && m.status.trim().toLowerCase() === 'tersedia'
      )
      totalMobilTersedia.value = mobilTersediaList.length
    }
  } catch (err) {
    console.error('Gagal mengambil data:', err)
  }
}

const resetForm = () => {
  Object.assign(formBooking, {
    jenis_perjalanan: 'Sekali Jalan', dari_lokasi: '', tujuan_id: '', lokasi_tujuan_custom: '',
    tgl_berangkat: '', jam_berangkat: '', tgl_kembali: '', jam_kembali: '',
    jumlah_org: 1, daftar_penumpang: '', remark: '', maps: ''
  })
  asalPilihan.value = ''
  asalCustom.value = ''
  tujuanPilihan.value = ''
  tujuanCustom.value = ''
  searchQueryLocation.value = ''
  osmSuggestions.value = []
}

const submitBooking = async () => {
  if (!user.value.id) {
    alert(currentLang.value === 'en' ? 'User session not found. Please log in again.' : 'Data user login tidak ditemukan. Silakan login ulang.')
    return
  }
  if (!formBooking.dari_lokasi || (!formBooking.tujuan_id && !formBooking.lokasi_tujuan_custom)) {
    alert(currentLang.value === 'en' ? 'Please select both departure location and destination.' : 'Mohon pilih lokasi asal dan tujuan terlebih dahulu.')
    return
  }

  // Lokasi custom (input manual) wajib menentukan Dalam Kota / Luar Kota dulu, tidak boleh di-skip.
  if (asalPilihan.value === '__custom__' && !asalCustomTipe.value) {
    alert(currentLang.value === 'en' ? 'Please choose In-City or Out-of-City for the departure location.' : 'Mohon pilih Dalam Kota atau Luar Kota untuk lokasi asal terlebih dahulu.')
    return
  }
  if (tujuanPilihan.value === '__custom__' && !tujuanCustomTipe.value) {
    alert(currentLang.value === 'en' ? 'Please choose In-City or Out-of-City for the destination.' : 'Mohon pilih Dalam Kota atau Luar Kota untuk lokasi tujuan terlebih dahulu.')
    return
  }

  if (['PP', 'Terjadwal'].includes(formBooking.jenis_perjalanan)) {
    if (!formBooking.tgl_kembali || !formBooking.jam_kembali) {
      alert('Untuk jenis perjalanan PP & Terjadwal, Tanggal & Jam Kembali Wajib Diisi!')
      return
    }
    // Patokannya datetime lengkap (tanggal + jam), bukan tanggal doang — jadi PP/Terjadwal
    // boleh pulang di HARI YANG SAMA (misal berangkat pagi, pulang sore), asal jam
    // kembalinya benar-benar setelah jam berangkat.
    const startDT = new Date(`${formBooking.tgl_berangkat}T${formBooking.jam_berangkat}:00`)
    const endDT = new Date(`${formBooking.tgl_kembali}T${formBooking.jam_kembali}:00`)
    if (isNaN(startDT.getTime()) || isNaN(endDT.getTime()) || endDT <= startDT) {
      alert(
        currentLang.value === 'en'
          ? `Return time (${formBooking.tgl_kembali} ${formBooking.jam_kembali}) must be after departure time (${formBooking.tgl_berangkat} ${formBooking.jam_berangkat}). It can be the same day, as long as the return time is later than the departure time.`
          : `Waktu kembali (${formBooking.tgl_kembali} ${formBooking.jam_kembali}) harus setelah waktu berangkat (${formBooking.tgl_berangkat} ${formBooking.jam_berangkat}). Boleh di hari yang sama, asalkan jam kembalinya lebih siang/malam dari jam berangkat.`
      )
      return
    }
  }

  if (totalMobilTersedia.value === 0) {
    alert('TIDAK ADA MOBIL TERSEDIA!\n\nSaat ini seluruh armada mobil sedang dalam pemeliharaan/diperbaiki. Pengajuan tidak dapat dikirim.')
    return
  }

  if (fleetCheck.value.isConflict) {
    alert(`ARMADA FULL BOOKED!\n\nPada jam/tanggal tersebut sudah ada ${fleetCheck.value.count} booking aktif (termasuk buffer istirahat 1 jam). Jumlah armada 'Tersedia' saat ini adalah ${totalMobilTersedia.value} unit. Silakan tentukan waktu lain.`)
    return
  }

  try {
    loading.value = true
    const payload = { ...formBooking, user_id: user.value.id }
    const res = await axios.post(`${API_BASE_URL}/carbook/booking`, payload, getAuthHeaders())
    alert(`${currentLang.value === 'en' ? 'Booking submitted successfully! Code' : 'Booking berhasil diajukan! Kode'}: ${res.data.data.kode_booking}`)
    resetForm()
    fetchData()
  } catch (err) {
    alert(err.response?.data?.message || (currentLang.value === 'en' ? 'Failed to save booking' : 'Gagal menyimpan booking'))
  } finally {
    loading.value = false
  }
}

const cancelBooking = async (bookingId) => {
  const confirmCancel = confirm(
    currentLang.value === 'en'
      ? 'Are you sure you want to cancel this booking?'
      : 'Apakah Anda yakin ingin membatalkan pengajuan booking ini?'
  )

  if (!confirmCancel) return

  try {
    loading.value = true
    await axios.patch(`${API_BASE_URL}/carbook/booking/${bookingId}/cancel`, {}, getAuthHeaders())
    alert(
      currentLang.value === 'en'
        ? 'Booking successfully cancelled!'
        : 'Booking berhasil dibatalkan!'
    )
    fetchData()
  } catch (err) {
    alert(
      err.response?.data?.message ||
      (currentLang.value === 'en' ? 'Failed to cancel booking' : 'Gagal membatalkan booking')
    )
  } finally {
    loading.value = false
  }
}

// --- UBAH (PERPANJANG / PERPENDEK) WAKTU KEMBALI ---
const showReturnTimeModal = ref(false)
const returnTimeTarget = ref(null) // booking yang sedang diedit
const returnTimeForm = reactive({ tgl_kembali: '', jam_kembali: '' })
const savingReturnTime = ref(false)

const canEditReturnTime = (b) => ['Ready', 'In Transit'].includes(b.status_booking) && b.jenis_perjalanan !== 'Sekali Jalan'

const openReturnTimeModal = (b) => {
  returnTimeTarget.value = b
  returnTimeForm.tgl_kembali = b.tgl_kembali || b.tgl_berangkat
  returnTimeForm.jam_kembali = b.jam_kembali || ''
  showReturnTimeModal.value = true
}

const closeReturnTimeModal = () => {
  showReturnTimeModal.value = false
  returnTimeTarget.value = null
}

const submitReturnTime = async () => {
  if (!returnTimeTarget.value) return
  if (!returnTimeForm.tgl_kembali || !returnTimeForm.jam_kembali) {
    alert(currentLang.value === 'en' ? 'Date and time are required' : 'Tanggal dan jam wajib diisi')
    return
  }
  // Sama seperti form pengajuan: patokan datetime lengkap, boleh sama hari
  // asal jamnya setelah waktu berangkat — bebas mau pulang hari itu juga,
  // besok, atau beberapa hari kemudian.
  const b = returnTimeTarget.value
  const startDT = new Date(`${b.tgl_berangkat}T${b.jam_berangkat}:00`)
  const endDT = new Date(`${returnTimeForm.tgl_kembali}T${returnTimeForm.jam_kembali}:00`)
  if (isNaN(startDT.getTime()) || isNaN(endDT.getTime()) || endDT <= startDT) {
    alert(
      currentLang.value === 'en'
        ? `Return time (${returnTimeForm.tgl_kembali} ${returnTimeForm.jam_kembali}) must be after departure time (${b.tgl_berangkat} ${b.jam_berangkat}). It can be the same day, as long as the return time is later than the departure time.`
        : `Waktu kembali (${returnTimeForm.tgl_kembali} ${returnTimeForm.jam_kembali}) harus setelah waktu berangkat (${b.tgl_berangkat} ${b.jam_berangkat}). Boleh di hari yang sama, asalkan jam kembalinya lebih siang/malam dari jam berangkat.`
    )
    return
  }
  try {
    savingReturnTime.value = true
    await axios.patch(
      `${API_BASE_URL}/carbook/booking/${returnTimeTarget.value.id}/return-time`,
      {
        tgl_kembali: returnTimeForm.tgl_kembali,
        jam_kembali: returnTimeForm.jam_kembali,
        requested_by: user.value.id
      },
      getAuthHeaders()
    )
    alert(currentLang.value === 'en' ? 'Return time updated!' : 'Waktu kembali berhasil diubah!')
    closeReturnTimeModal()
    fetchData()
  } catch (err) {
    alert(
      err.response?.data?.message ||
      (currentLang.value === 'en' ? 'Failed to update return time' : 'Gagal mengubah waktu kembali')
    )
  } finally {
    savingReturnTime.value = false
  }
}

onMounted(() => {
  detectBrowserLanguage()
  fetchData()
})
</script>

<style scoped>
.d-flex.flex-column.min-vh-100 {
  --brand-blue: #0a63e0;
  --brand-blue-dark: #063d8c;
  --brand-blue-light: #4d94ff;
  --brand-teal: #00b8a9;
  --ink: #16233c;
  --ink-soft: #5c6b85;
  --surface-muted: #f5f7fb;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.hero-banner {
  background: linear-gradient(120deg, var(--brand-blue-dark) 0%, var(--brand-blue) 55%, var(--brand-teal) 130%);
  box-shadow: 0 10px 30px -12px rgba(10, 99, 224, 0.45);
}
.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 90% 10%, rgba(255,255,255,0.14) 0%, transparent 45%),
                     radial-gradient(circle at 15% 95%, rgba(255,255,255,0.10) 0%, transparent 40%);
  pointer-events: none;
}
.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}
.lang-switcher select { cursor: pointer; color: var(--ink); }
.lang-switcher { min-width: 190px; }

.hero-stat-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 1.25rem;
}
.hero-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.hero-stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.applicant-card {
  background-color: var(--surface-muted);
  border: 1px solid var(--bs-border-color-translucent);
}

.fs-7 { font-size: 0.75rem; }

.icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.65rem;
  background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-light));
  color: #fff;
  font-size: 1.05rem;
}
.icon-badge-secondary {
  background: linear-gradient(135deg, #6c757d, #9ca3af);
}

.form-card {
  border-top: 4px solid var(--brand-blue);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  color: var(--ink);
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f1f3f5;
}
.section-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--brand-blue);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
}

.trip-type-tabs {
  display: flex;
  gap: 0.4rem;
  background: var(--surface-muted);
  padding: 0.35rem;
  border-radius: 0.75rem;
  border: 1px solid var(--bs-border-color-translucent);
}
.trip-type-tab {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--ink-soft);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.6rem 0.5rem;
  border-radius: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.trip-type-tab:hover { color: var(--brand-blue); }
.trip-type-tab.active {
  background: #fff;
  color: var(--brand-blue);
  box-shadow: 0 2px 8px rgba(10, 99, 224, 0.18);
}

.location-type-tabs {
  display: flex;
  gap: 0.4rem;
}
.location-type-btn {
  flex: 1;
  border: 1px solid var(--bs-border-color-translucent);
  background: #fff;
  color: var(--ink-soft);
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.4rem 0.6rem;
  border-radius: 0.55rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.location-type-btn:hover { border-color: var(--brand-blue); color: var(--brand-blue); }
.location-type-btn.active {
  background: var(--brand-blue);
  border-color: var(--brand-blue);
  color: #fff;
  box-shadow: 0 2px 8px rgba(10, 99, 224, 0.18);
}
.location-type-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--surface-muted);
}
.location-type-btn:disabled:hover { border-color: var(--bs-border-color-translucent); color: var(--ink-soft); }

.route-picker {
  position: relative;
  background: var(--surface-muted);
  border: 1px solid var(--bs-border-color-translucent);
  border-radius: 0.9rem;
  padding: 1rem 1.25rem;
}
.route-field {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.route-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  margin-top: 2.4rem;
  flex-shrink: 0;
}
.route-dot-origin { background: #16a34a; box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.15); }
.route-dot-destination { background: #e11d48; box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.15); }

.route-divider {
  border-top: 1px dashed var(--bs-border-color);
  margin: 1rem 0 1rem 0.35rem;
}

.route-swap-btn {
  position: absolute;
  right: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid var(--bs-border-color-translucent);
  background: #fff;
  color: var(--brand-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(10, 99, 224, 0.18);
  transition: transform 0.2s ease, background 0.2s ease;
  z-index: 2;
}
.route-swap-btn:hover {
  background: var(--brand-blue);
  color: #fff;
  transform: translateY(-50%) rotate(180deg);
}

@media (max-width: 767.98px) {
  .route-swap-btn {
    position: static;
    transform: none;
    margin: 0.25rem auto;
  }
  .route-swap-btn:hover { transform: rotate(180deg); }
}

.ticket-row { position: relative; }
.schedule-box {
  background-color: var(--surface-muted);
  border: 1px solid var(--bs-border-color-translucent);
  height: 100%;
}
.schedule-box-depart { border-left: 3px solid var(--brand-blue); }
.schedule-box-return { border-left: 3px solid var(--brand-teal); }
.schedule-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.btn-submit {
  background: linear-gradient(135deg, var(--brand-blue), var(--brand-blue-dark));
  border: none;
  color: #fff;
  box-shadow: 0 8px 20px -6px rgba(10, 99, 224, 0.55);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px -6px rgba(10, 99, 224, 0.65);
  color: #fff;
}
.btn-submit:disabled { opacity: 0.6; }

.search-box {
  position: relative;
  min-width: 220px;
}
.search-box i {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.search-box .form-control {
  padding-left: 2.3rem;
  border-radius: 0.65rem;
  background: var(--surface-muted);
  border: 1px solid var(--bs-border-color-translucent);
}
.search-box .form-control:focus {
  background: #fff;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.filter-chip {
  border: 1px solid var(--bs-border-color-translucent);
  background: #fff;
  color: var(--ink-soft);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.filter-chip:hover { border-color: var(--brand-blue); color: var(--brand-blue); }
.filter-chip.active {
  background: var(--brand-blue);
  border-color: var(--brand-blue);
  color: #fff;
}

.booking-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-ticket {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  background: #fff;
  border: 1px solid var(--bs-border-color-translucent);
  border-left: 4px solid var(--bs-border-color);
  border-radius: 0.9rem;
  padding: 1.1rem 1.25rem;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  flex-wrap: wrap;
}
.booking-ticket:hover {
  box-shadow: 0 8px 24px -10px rgba(22, 35, 60, 0.18);
  transform: translateY(-1px);
}
.ticket-success { border-left-color: #16a34a; }
.ticket-warning { border-left-color: #d97706; }
.ticket-info { border-left-color: #0891b2; }
.ticket-danger { border-left-color: #dc2626; }
.ticket-secondary { border-left-color: #6c757d; }

.booking-ticket-main { flex: 1; min-width: 240px; }

.booking-code {
  font-weight: 800;
  color: var(--brand-blue);
  letter-spacing: 0.02em;
  font-size: 0.95rem;
}

.booking-route {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.booking-route-point {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.booking-route-arrow { font-size: 0.85rem; }

.booking-meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.booking-meta-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
.booking-meta-item i { font-size: 1rem; margin-top: 0.15rem; }

.booking-ticket-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 100px;
}

.empty-state { color: var(--ink-soft); }

.bg-primary-subtle { background-color: #e7f1ff !important; }
.bg-success-subtle { background-color: #e6f4ea !important; }
.bg-warning-subtle { background-color: #fef7e0 !important; }
.bg-danger-subtle { background-color: #fce8e6 !important; }
.bg-info-subtle { background-color: #e8f4f8 !important; }
.bg-secondary-subtle { background-color: #f1f3f5 !important; }

.form-control:focus, .form-select:focus {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 0.25rem rgba(10, 99, 224, 0.15);
}

/* --- MAP PICKER MODAL --- */
.map-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.map-picker-box {
  background: #fff;
  border-radius: 1rem;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.map-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid var(--bs-border-color-translucent);
}
.map-picker-canvas {
  width: 100%;
  height: 60vh;
  min-height: 320px;
}
.map-picker-footer {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1.1rem;
  border-top: 1px solid var(--bs-border-color-translucent);
  flex-wrap: wrap;
}
</style>