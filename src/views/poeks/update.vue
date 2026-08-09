<template>
  <div class="app-shell">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="app-body">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="app-main" :class="{ 'app-main--collapsed': !sidebarOpen }">
  <div class="poeks-page">

    <!-- ===================== OVERLAY LOADING GLOBAL ===================== -->
    <transition name="fade">
      <div v-if="busy" class="poeks-overlay" @click.stop.prevent @mousedown.stop.prevent>
        <div class="poeks-overlay-box">
          <span class="po-spinner po-spinner-lg"></span>
          <p class="overlay-title">{{ isSaving ? 'Menyimpan data terpilih...' : 'Memuat data...' }}</p>
          <p class="overlay-sub">Mohon tunggu, jangan menutup atau memuat ulang halaman ini.</p>
        </div>
      </div>
    </transition>

    <!-- ===================== MODAL PILIH PO UNTUK SINKRONISASI MASSAL ===================== -->
    <transition name="fade">
      <div v-if="syncSelectModalOpen" class="poeks-overlay" @click.self="closeSyncSelectModal">
        <div class="sync-modal-box">
          <div class="sync-modal-header">
            <h3>Pilih Style untuk Disinkron — {{ filterDate }}</h3>
            <button type="button" class="sync-modal-close" @click="closeSyncSelectModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="sync-select-toolbar">
            <input
              type="text"
              v-model="syncSelectSearch"
              placeholder="Cari Style..."
              class="field-input"
            />
            <button type="button" class="btn-clear-filters" @click="toggleSyncSelectAll">
              {{ syncAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua' }}
            </button>
          </div>
          <div class="sync-select-daterange">
            <div class="field">
              <label class="field-label">Delivery (xFtyDate) Dari</label>
              <input type="date" v-model="syncFtyDateBegin" class="field-input" />
            </div>
            <div class="field">
              <label class="field-label">Delivery (xFtyDate) Sampai</label>
              <input type="date" v-model="syncFtyDateEnd" class="field-input" />
            </div>
          </div>
          <small class="sync-daterange-hint">Hanya baris dengan xFtyDate dalam rentang ini yang akan disinkron / di-upsert. Baris di luar rentang otomatis dilewati.</small>

          <div class="sync-select-count">{{ syncSelectedPOs.length }} dari {{ poReferences.length }} Style terpilih</div>

          <div class="sync-modal-list">
            <label v-for="po in syncSelectableList" :key="po" class="sync-select-row">
              <input
                type="checkbox"
                :checked="syncSelectedPOs.includes(po)"
                @change="toggleSyncSelectOne(po)"
              />
              <span>{{ po }}</span>
            </label>
            <div v-if="syncSelectableList.length === 0" class="sync-select-empty">Tidak ada Style yang cocok.</div>
          </div>

          <div class="sync-modal-footer">
            <button type="button" class="btn-clear-filters" @click="closeSyncSelectModal">Batal</button>
            <button type="button" class="btn-primary" :disabled="syncSelectedPOs.length === 0" @click="confirmBulkSync">
              Mulai Sinkron ({{ syncSelectedPOs.length }})
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ===================== MODAL SINKRONISASI MASSAL (QUEUE BERTAHAP) ===================== -->
    <transition name="fade">
      <div v-if="syncModalOpen" class="poeks-overlay" @click.self="closeSyncModal">
        <div class="sync-modal-box">
          <div class="sync-modal-header">
            <h3>Sinkronisasi Massal — {{ filterDate }}</h3>
            <button v-if="!syncRunning" type="button" class="sync-modal-close" @click="closeSyncModal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="sync-modal-progress">
            <div class="sync-progress-track">
              <div class="sync-progress-fill" :style="{ width: syncProgressPercent + '%' }"></div>
            </div>
            <span class="sync-progress-text">
              {{ syncDoneCount }} / {{ syncQueue.length }} Style diproses ({{ syncProgressPercent }}%)
              <template v-if="syncRunning && syncCurrentPO">— sedang memproses {{ syncCurrentPO }}...</template>
              <template v-else-if="!syncRunning">— selesai</template>
            </span>
          </div>

          <div class="sync-modal-list">
            <div v-for="q in syncQueue" :key="q.po" class="sync-row" :class="'sync-row--' + q.status">
              <span class="sync-row-po">{{ q.po }}</span>
              <span class="sync-row-status">
                <span v-if="q.status === 'pending'">Menunggu</span>
                <span v-else-if="q.status === 'processing'"><span class="po-spinner"></span> Memproses...</span>
                <span v-else-if="q.status === 'done'">Tersimpan ({{ q.rowCount }} baris)<template v-if="q.message"> — {{ q.message }}</template></span>
                <span v-else-if="q.status === 'skipped'">Tidak ada data<template v-if="q.message"> — {{ q.message }}</template></span>
                <span v-else-if="q.status === 'duplikat'">Dilewati (data sama dgn PO lain)</span>
                <span v-else-if="q.status === 'error'" :title="q.message">Gagal: {{ q.message }}</span>
                <span v-else-if="q.status === 'dibatalkan'">Dibatalkan</span>
              </span>
            </div>
          </div>

          <div class="sync-modal-footer">
            <button v-if="syncRunning" type="button" class="btn-clear-filters" @click="cancelBulkSync">Hentikan</button>
            <button v-else type="button" class="btn-primary" @click="closeSyncModal">Tutup</button>
          </div>
        </div>
      </div>
    </transition>

    <div class="d-flex align-items-center w-100 mb-3">
    <a href="/view_poeks" class="btn btn-dark me-2">Kembali</a>
    <a href="/edit_poeks" class="btn btn-warning">
        <i class="bi bi-patch-plus"></i> UPDATE DATA
    </a>
</div>

    <div class="poeks-card">
      <!-- ===================== HEADER ===================== -->
      <div class="poeks-header">
        <div class="poeks-header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <div>
          <h1 class="poeks-title">Target Finishing per Kombinasi</h1>
          <p class="poeks-subtitle">Cari Style, pilih satu tanggal patokan (dipakai untuk cari &amp; simpan), lalu centang baris warna yang mau diproses.</p>
        </div>
      </div>

      <!-- ===================== FILTER BAR ===================== -->
      <div class="poeks-filters">
        <div class="field">
          <label class="field-label">Tanggal</label>
          <input type="date" v-model="filterDate" :disabled="busy" class="field-input" />
          <span class="field-hint">Tanggal ini dipakai untuk mencari data dan sebagai tanggal target simpan.</span>
          <button
            type="button"
            class="btn-bulk-sync"
            :disabled="busy || syncRunning || syncSelectModalOpen"
            @click="openSyncSelectModal"
            title="Proses semua Style secara bertahap (satu-satu) untuk tanggal ini"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
            Sinkronisasi Massal
          </button>
        </div>

        <!-- ============ COMBOBOX PO (search-in-box, klik langsung jalan) ============ -->
        <div class="field field-po" ref="poFieldRef">
          <label class="field-label">Style</label>
          <div class="po-combobox" :class="{ 'is-open': showPODropdown, 'is-disabled': busy }">
            <svg class="po-combobox-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              class="po-combobox-input"
              v-model="poSearchText"
              :disabled="busy"
              :placeholder="poReferencesLoading ? 'Memuat daftar Style...' : 'Klik untuk lihat semua Style / ketik untuk cari'"
              autocomplete="off"
              @focus="openPODropdown"
              @input="showPODropdown = true"
              @keydown="onPOKeydown"
              @blur="showPODropdown = false"
            />
            <button
              v-if="searchPO"
              type="button"
              class="po-combobox-clear"
              title="Hapus pilihan PO"
              :disabled="busy"
              @mousedown.prevent="clearPOSelection"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div v-if="showPODropdown" class="po-dropdown">
              <div v-if="poReferencesLoading" class="po-dropdown-state">
                <span class="po-spinner"></span> Memuat daftar Style...
              </div>
              <div v-else-if="filteredPOReferences.length === 0" class="po-dropdown-state">
                Tidak ada Style yang cocok dengan "<strong>{{ poSearchText }}</strong>"
              </div>
              <ul v-else class="po-dropdown-list" ref="poListRef">
                <li
                  v-for="(po, i) in filteredPOReferences"
                  :key="po"
                  class="po-dropdown-item"
                  :class="{ 'is-active': i === highlightedIndex, 'is-selected': po === searchPO }"
                  @mousedown.prevent="selectPO(po)"
                  @mouseenter="highlightedIndex = i"
                >
                  {{ po }}
                  <svg v-if="po === searchPO" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </li>
              </ul>
              <div class="po-dropdown-footer">{{ filteredPOReferences.length }} dari {{ poReferences.length }} Style</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== STATUS BAR ===================== -->
      <transition name="fade">
        <div v-if="searchPO" class="poeks-statusbar">
          <div class="statusbar-left">
            <span class="po-chip">{{ searchPO }}</span>
            <span class="statusbar-text">Tanggal: {{ filterDate }}</span>
            <span v-if="!loading" class="statusbar-count">{{ filteredKombinasi.length }} / {{ daftarKombinasi.length }} baris ditampilkan</span>
            <span v-if="dataLoadedForDate && dataLoadedForDate !== filterDate" class="statusbar-warning">
              Tanggal berubah, klik Muat Ulang sebelum menyimpan
            </span>
          </div>
          <button class="btn-refresh" @click="fetchDataKombinasi" :disabled="busy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spinning: loading }">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            {{ loading ? 'Memuat...' : 'Muat Ulang' }}
          </button>
        </div>
      </transition>

      <hr class="poeks-divider" />

      <!-- ===================== LOADING ===================== -->
      <div v-if="loading" class="poeks-loading">
        <span class="po-spinner po-spinner-lg"></span>
        <p>Mengambil data dari ERP...</p>
      </div>

      <!-- ===================== EMPTY STATE (belum cari) ===================== -->
      <div v-else-if="!hasSearched" class="poeks-empty-hint">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <p>Pilih nomor Style di atas untuk mulai menampilkan data kombinasi.</p>
      </div>

      <!-- ===================== TABLE ===================== -->
      <div v-else-if="daftarKombinasi.length > 0" class="table-wrapper">
        <div class="table-toolbar">
          <span class="table-toolbar-hint">Gunakan ikon filter di header kolom (xNO, Style, Delivery, Buyer, Warna) untuk mempersempit tampilan, lalu centang baris yang mau diproses.</span>
          <div class="table-toolbar-actions">
            <button
              class="btn-select-all"
              :disabled="busy || filteredKombinasi.length === 0"
              @click="toggleSelectAllFiltered"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              {{ isAllFilteredSelected ? 'Batalkan Semua' : 'Pilih Semua (' + filteredKombinasi.length + ')' }}
            </button>
            <button v-if="selectedItems.length > 0" class="btn-clear-selection" :disabled="busy" @click="clearSelection">
              Kosongkan Pilihan
            </button>
            <button v-if="hasActiveColumnFilter" class="btn-clear-filters" :disabled="busy" @click="clearAllColumnFilters">
              Reset Semua Filter
            </button>
            <button @click="simpanPilihanAdmin" class="btn-primary" :disabled="busy || selectedItems.length === 0">
              <span v-if="isSaving" class="po-spinner"></span>
              {{ isSaving ? 'Menyimpan...' : 'Simpan Terpilih' }}
              <span v-if="selectedItems.length && !isSaving" class="count-badge">{{ selectedItems.length }}</span>
            </button>
          </div>
        </div>

        <div v-if="filteredKombinasi.length === 0" class="poeks-noresult poeks-noresult-inline">
          <p>Tidak ada baris yang cocok dengan filter kolom yang aktif.</p>
          <button class="btn-clear-filters" @click="clearAllColumnFilters">Reset Semua Filter</button>
        </div>

        <div v-else class="table-scroll">
          <table class="poeks-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input
                    type="checkbox"
                    :checked="isAllFilteredSelected"
                    ref="selectAllCheckbox"
                    :disabled="busy || filteredKombinasi.length === 0"
                    @change="toggleSelectAllFiltered"
                    title="Pilih/batalkan semua baris yang tampil"
                  />
                </th>
                <th class="col-no">
                  <div class="th-with-filter">
                    <span>xNO</span>
                    <button type="button" class="colfilter-btn" :class="{ 'is-active': columnFilters.xNO.length > 0 }" :disabled="busy" @click.stop="toggleColumnFilter('xNO')" title="Filter xNO">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
                    </button>
                  </div>
                  <div v-if="openColumnFilter === 'xNO'" class="colfilter-dropdown" @click.stop>
                    <div class="colfilter-search">
                      <input type="text" v-model="columnFilterSearch.xNO" placeholder="Cari xNO..." />
                    </div>
                    <div class="colfilter-list">
                      <label v-for="val in filteredOptionsFor('xNO')" :key="val" class="colfilter-item">
                        <input type="checkbox" :value="val" v-model="columnFilters.xNO" />
                        <span>{{ val }}</span>
                      </label>
                      <div v-if="filteredOptionsFor('xNO').length === 0" class="colfilter-empty">Tidak ada hasil</div>
                    </div>
                    <div class="colfilter-footer">
                      <button type="button" class="colfilter-clear" @click="clearColumnFilter('xNO')">Reset</button>
                      <button type="button" class="colfilter-apply" @click="openColumnFilter = null">Selesai</button>
                    </div>
                  </div>
                </th>
                <th class="col-style">
                  <div class="th-with-filter">
                    <span>Style</span>
                    <button type="button" class="colfilter-btn" :class="{ 'is-active': columnFilters.xPO.length > 0 }" :disabled="busy" @click.stop="toggleColumnFilter('xPO')" title="Filter Style">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
                    </button>
                  </div>
                  <div v-if="openColumnFilter === 'xPO'" class="colfilter-dropdown" @click.stop>
                    <div class="colfilter-search">
                      <input type="text" v-model="columnFilterSearch.xPO" placeholder="Cari Style..." />
                    </div>
                    <div class="colfilter-list">
                      <label v-for="val in filteredOptionsFor('xPO')" :key="val" class="colfilter-item">
                        <input type="checkbox" :value="val" v-model="columnFilters.xPO" />
                        <span>{{ val }}</span>
                      </label>
                      <div v-if="filteredOptionsFor('xPO').length === 0" class="colfilter-empty">Tidak ada hasil</div>
                    </div>
                    <div class="colfilter-footer">
                      <button type="button" class="colfilter-clear" @click="clearColumnFilter('xPO')">Reset</button>
                      <button type="button" class="colfilter-apply" @click="openColumnFilter = null">Selesai</button>
                    </div>
                  </div>
                </th>
                <th class="col-plainfilter col-delivery">
                  <div class="th-with-filter">
                    <span>Delivery</span>
                    <button type="button" class="colfilter-btn" :class="{ 'is-active': columnFilters.xFtyDate.length > 0 }" :disabled="busy" @click.stop="toggleColumnFilter('xFtyDate')" title="Filter Delivery">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
                    </button>
                  </div>
                  <div v-if="openColumnFilter === 'xFtyDate'" class="colfilter-dropdown" @click.stop>
                    <div class="colfilter-search">
                      <input type="text" v-model="columnFilterSearch.xFtyDate" placeholder="Cari Delivery..." />
                    </div>
                    <div class="colfilter-list">
                      <label v-for="val in filteredOptionsFor('xFtyDate')" :key="val" class="colfilter-item">
                        <input type="checkbox" :value="val" v-model="columnFilters.xFtyDate" />
                        <!-- <span>{{ val }}</span> -->
                          <span>{{ formatDelivery(val) }}</span>
                      </label>
                      <div v-if="filteredOptionsFor('xFtyDate').length === 0" class="colfilter-empty">Tidak ada hasil</div>
                    </div>
                    <div class="colfilter-footer">
                      <button type="button" class="colfilter-clear" @click="clearColumnFilter('xFtyDate')">Reset</button>
                      <button type="button" class="colfilter-apply" @click="openColumnFilter = null">Selesai</button>
                    </div>
                  </div>
                </th>
                <th class="col-plainfilter col-buyer">
                  <div class="th-with-filter">
                    <span>Buyer</span>
                    <button type="button" class="colfilter-btn" :class="{ 'is-active': columnFilters.xBuyer.length > 0 }" :disabled="busy" @click.stop="toggleColumnFilter('xBuyer')" title="Filter Buyer">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
                    </button>
                  </div>
                  <div v-if="openColumnFilter === 'xBuyer'" class="colfilter-dropdown" @click.stop>
                    <div class="colfilter-search">
                      <input type="text" v-model="columnFilterSearch.xBuyer" placeholder="Cari Buyer..." />
                    </div>
                    <div class="colfilter-list">
                      <label v-for="val in filteredOptionsFor('xBuyer')" :key="val" class="colfilter-item">
                        <input type="checkbox" :value="val" v-model="columnFilters.xBuyer" />
                        <span>{{ val }}</span>
                      </label>
                      <div v-if="filteredOptionsFor('xBuyer').length === 0" class="colfilter-empty">Tidak ada hasil</div>
                    </div>
                    <div class="colfilter-footer">
                      <button type="button" class="colfilter-clear" @click="clearColumnFilter('xBuyer')">Reset</button>
                      <button type="button" class="colfilter-apply" @click="openColumnFilter = null">Selesai</button>
                    </div>
                  </div>
                </th>
                <th class="col-plainfilter col-color">
                  <div class="th-with-filter">
                    <span>Warna</span>
                    <button type="button" class="colfilter-btn" :class="{ 'is-active': columnFilters.xMColor.length > 0 }" :disabled="busy" @click.stop="toggleColumnFilter('xMColor')" title="Filter Warna">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
                    </button>
                  </div>
                  <div v-if="openColumnFilter === 'xMColor'" class="colfilter-dropdown" @click.stop>
                    <div class="colfilter-search">
                      <input type="text" v-model="columnFilterSearch.xMColor" placeholder="Cari Warna..." />
                    </div>
                    <div class="colfilter-list">
                      <label v-for="val in filteredOptionsFor('xMColor')" :key="val" class="colfilter-item">
                        <input type="checkbox" :value="val" v-model="columnFilters.xMColor" />
                        <span>{{ val }}</span>
                      </label>
                      <div v-if="filteredOptionsFor('xMColor').length === 0" class="colfilter-empty">Tidak ada hasil</div>
                    </div>
                    <div class="colfilter-footer">
                      <button type="button" class="colfilter-clear" @click="clearColumnFilter('xMColor')">Reset</button>
                      <button type="button" class="colfilter-apply" @click="openColumnFilter = null">Selesai</button>
                    </div>
                  </div>
                </th>
                <th class="grp-need col-mark">Mark</th>
                <th class="grp-need col-region">Region</th>
                <th colspan="17" class="grp-need">Kebutuhan</th>
                <th colspan="16" class="grp-supply">Supply</th>
                <th colspan="16" class="grp-ship">Kirim</th>
                <th colspan="15" class="grp-size">Size</th>
                <th colspan="17" class="grp-a1">A1</th>
                <th colspan="17" class="grp-s1">SHORT</th>
              </tr>
              <tr>
                <th class="col-check col-stub"></th>
                <th class="col-no col-stub"></th>
                <th class="col-style col-stub"></th>
                <th class="col-plainfilter col-delivery col-stub"></th>
                <th class="col-plainfilter col-buyer col-stub"></th>
                <th class="col-plainfilter col-color col-stub"></th>
                <th class="grp-need col-mark col-stub"></th>
                <th class="grp-need col-region col-stub"></th>
                <th class="grp-need" v-for="n in 15" :key="`need-${n}`">{{ n }}</th>
                <th class="grp-need">Jml</th>
                <th class="grp-need">TTL</th>

                <th class="grp-supply">Proses</th>
                <th class="grp-supply" v-for="n in 15" :key="`sup-${n}`">{{ n }}</th>

                <th class="grp-ship">Proses</th>
                <th class="grp-ship" v-for="n in 15" :key="`ship-${n}`">{{ n }}</th>

                <th class="grp-size" v-for="n in 15" :key="`size-${n}`">{{ n }}</th>

                <th class="grp-a1">Nama Kerja</th>
                <th class="grp-a1" v-for="size in activeSizes" :key="`a1-${size.index}`">{{ size.label }}</th>
                <th class="grp-a1">TTL</th>
                <!-- TAMBAHKAN INI -->
                <th class="grp-s1">Nama Kerja</th>
                <th class="grp-s1" v-for="size in activeSizes" :key="`s1-${size.index}`">{{ size.label }}</th>
                <th class="grp-s1">TTL</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in filteredKombinasi"
                :key="`${row.xPO}-${row.xMColor}-${index}`"
                :class="{ 'row-selected': selectedItems.includes(row) }"
              >
                <td class="col-check">
                  <input type="checkbox" :value="row" v-model="selectedItems" :disabled="busy" />
                </td>
                <td class="col-no">{{ row.xNO }}</td>
                <td class="col-style">{{ row.xPO }}</td>
                <!-- <td>{{ row.xFtyDate }}</td> -->
                <td class="col-delivery">{{ formatDelivery(row.xFtyDate) }}</td>
                <td class="col-buyer">{{ row.xBuyer }}</td>
                <td class="col-color">{{ row.xMColor }}</td>
                <td class="cell-accent">{{ row.xPOMark }}</td>
                <td class="cell-accent">{{ row.xRegion }}</td>

                <td class="grp-need num">{{ row.xTTQty1 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty2 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty3 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty4 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty5 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty6 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty7 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty8 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty9 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty10 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty11 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty12 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty13 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty14 || '0' }}</td>
                <td class="grp-need num">{{ row.xTTQty15 || '0' }}</td>
                <td class="grp-need num font-weight-bold">{{ row.cTTQty || '0' }}</td>
                <td class="grp-need num font-weight-bold">{{ row.xTOL || '0' }}</td>

                <td class="grp-supply">{{ row.xWorkName || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO1 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO2 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO3 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO4 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO5 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO6 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO7 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO8 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO9 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO10 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO11 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO12 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO13 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO14 || '0' }}</td>
                <td class="grp-supply num">{{ row.xTO15 || '0' }}</td>

                <td class="grp-ship">{{ row.xWorkNameD || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD1 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD2 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD3 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD4 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD5 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD6 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD7 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD8 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD9 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD10 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD11 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD12 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD13 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD14 || '0' }}</td>
                <td class="grp-ship num">{{ row.xTOD15 || '0' }}</td>

                <td class="grp-size num">{{ row.xSize1 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize2 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize3 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize4 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize5 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize6 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize7 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize8 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize9 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize10 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize11 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize12 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize13 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize14 || '0' }}</td>
                <td class="grp-size num">{{ row.xSize15 || '0' }}</td>

                <!-- ===== INPUT MANUAL (A1) — bukan dari API, diisi tangan oleh user ===== -->
                <td class="grp-a1">
                  <select class="a1-input a1-input-name" v-model="row.a1workname"
                    :disabled="busy"
                    @change="fillDownSameColor(row, 'a1workname')"
                  >
                    <!-- Opsi dengan value kosong yang bisa dipilih kembali oleh user -->
                    <option value="">- Kosong -</option>
                    <option value="A1 LK Body">A1 LK Body</option>
                    <option value="A1 Sambung Tangan">A1 Sambung Tangan</option>
                    <option value="A1 Sambung Tangan C">A1 Sambung Tangan C</option>
                    <option value="A1 Pinggiran C">A1 Pinggiran C</option>
                  </select>
                </td>
                <td class="grp-a1" v-for="n in 15" :key="`a1cell-${index}-${n}`">
                  <input
                    type="number"
                    class="a1-input"
                    v-model.number="row[`A1TO${n}`]"
                    :disabled="busy"
                    min="0"
                    @input="recalcA1Total(row); fillDownSameColor(row, `A1TO${n}`)"
                  />
                </td>
                <td class="grp-a1 num a1-total-cell">{{ row.A1TOT || 0 }}</td>
                <!-- ===== INPUT MANUAL (S1) — bukan dari API, otomatis terisi "SHORT" tanpa perlu dipilih manual ===== -->
<td class="grp-s1">
  <span class="a1-input a1-input-name a1-input-readonly">{{ row.s1workname || 'SHORT' }}</span>
</td>
<td class="grp-s1" v-for="n in 15" :key="`s1cell-${index}-${n}`">
  <input
    type="number"
    class="a1-input"
    v-model.number="row[`S1TO${n}`]"
    :disabled="busy"
    min="0"
    @input="recalcS1Total(row); fillDownSameColor(row, `S1TO${n}`)"
  />
</td>
<td class="grp-s1 num a1-total-cell">{{ row.S1TOT || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===================== EMPTY RESULT ===================== -->
      <div v-else-if="hasSearched && daftarKombinasi.length === 0" class="poeks-noresult">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 9h.01M15 9h.01M8 13s1.5 2 4 2 4-2 4-2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <p>Data tidak ditemukan untuk PO <strong>{{ searchPO }}</strong> pada tanggal {{ filterDate }}.</p>
        <small>Pastikan tanggal yang dipilih sesuai dengan tanggal pembuatan / xFtyDate PO tersebut.</small>
      </div>
    </div>
  </div>
</main>
    </div>
    <Footer />
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import axios from 'axios';

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sidebarOpen = ref(true);
const user = ref({ name: "User" });

export default {
  name: 'UpdateKombinasiFinishing',
  data() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    return {
      filterDate: todayStr,
      dataLoadedForDate: '',
      searchPO: '',
      poSearchText: '',
      poReferences: [],
      poReferencesLoading: false,
      showPODropdown: false,
      highlightedIndex: -1,
      loading: false,
      isSaving: false,
      hasSearched: false,
      daftarKombinasi: [],
      selectedItems: [],
      columnFilters: {
        xNO: [],
        xPO: [],
        xFtyDate: [],
        xBuyer: [],
        xMColor: [],
        xPOMark: [],
        xRegion: []
      },
      columnFilterSearch: {
        xNO: '',
        xPO: '',
        xFtyDate: '',
        xBuyer: '',
        xMColor: '',
        xPOMark: '',
        xRegion: '',
      },
      openColumnFilter: null,

      // ===== FITUR BARU: Sinkronisasi Massal (queue bertahap per Style) =====
      syncModalOpen: false,
      syncRunning: false,
      syncCancelled: false,
      syncQueue: [], // [{ po, status: 'pending'|'processing'|'done'|'skipped'|'error'|'dibatalkan'|'duplikat', rowCount, message }]

      // FITUR BARU: modal pilih PO mana saja yang mau disinkron, biar tidak harus proses semua 250 PO.
      syncSelectModalOpen: false,
      syncSelectSearch: '',
      syncSelectedPOs: [],

      // FITUR BARU: rentang xFtyDate (tanggal delivery) yang boleh ikut di-upsert saat Sinkronisasi Massal.
      // Baris dengan xFtyDate di luar rentang ini akan dilewati (skip), tidak ikut diproses.
      syncFtyDateBegin: '',
      syncFtyDateEnd: ''
    };
  },
  computed: {
    activeSizes() {
      // Buat template default 1 s.d 15 dulu
      const defaultSizes = Array.from({ length: 15 }, (_, i) => ({
        index: i + 1,
        label: String(i + 1)
      }));

      // Jika belum ada data, gunakan default angka 1-15
      if (!this.daftarKombinasi || this.daftarKombinasi.length === 0) {
        return defaultSizes;
      }

      // Ambil sampel dari baris pertama data yang berhasil di-load
      const firstRow = this.daftarKombinasi[0];
      
      return defaultSizes.map(item => {
        // Cek apakah ada nilai di xSize1, xSize2, dst. 
        const sizeName = firstRow[`xSize${item.index}`];
        return {
          index: item.index,
          // Jika ada nama sizenya (misal 'S', 'M', 'L'), pakai nama tersebut. Jika kosong/nol, pakai angka index.
          label: (sizeName && sizeName !== '0' && sizeName !== 0) ? sizeName : String(item.index)
        };
      });
    },

    filteredPOReferences() {
      const q = this.poSearchText.trim().toLowerCase();
      if (!q) return this.poReferences;
      return this.poReferences.filter((po) => po.toLowerCase().includes(q));
    },

    busy() {
      return this.loading || this.isSaving;
    },

    hasActiveColumnFilter() {
      return Object.values(this.columnFilters).some((arr) => arr.length > 0);
    },

    filteredKombinasi() {
      const filters = this.columnFilters;
      const activeKeys = Object.keys(filters).filter((k) => filters[k].length > 0);
      if (activeKeys.length === 0) return this.daftarKombinasi;

      return this.daftarKombinasi.filter((row) => {
        return activeKeys.every((key) => filters[key].includes(row[key]));
      });
    },

    // ============ SELECT ALL (mengacu pada baris yang SEDANG TAMPIL / sudah difilter) ============
    isAllFilteredSelected() {
      if (this.filteredKombinasi.length === 0) return false;
      return this.filteredKombinasi.every((row) => this.selectedItems.includes(row));
    },

    isPartiallyFilteredSelected() {
      if (this.filteredKombinasi.length === 0) return false;
      const selectedCount = this.filteredKombinasi.filter((row) => this.selectedItems.includes(row)).length;
      return selectedCount > 0 && selectedCount < this.filteredKombinasi.length;
    },

    // ===== FITUR BARU: ringkasan progress Sinkronisasi Massal =====
    syncDoneCount() {
      return this.syncQueue.filter((q) => q.status !== 'pending' && q.status !== 'processing').length;
    },
    syncProgressPercent() {
      if (this.syncQueue.length === 0) return 0;
      return Math.round((this.syncDoneCount / this.syncQueue.length) * 100);
    },
    syncCurrentPO() {
      const active = this.syncQueue.find((q) => q.status === 'processing');
      return active ? active.po : '';
    },

    // FITUR BARU: daftar PO di modal pemilihan, bisa dicari
    syncSelectableList() {
      if (!this.syncSelectSearch.trim()) return this.poReferences;
      const kw = this.syncSelectSearch.trim().toLowerCase();
      return this.poReferences.filter((po) => po.toLowerCase().includes(kw));
    },
    syncAllSelected() {
      return this.poReferences.length > 0 && this.syncSelectedPOs.length === this.poReferences.length;
    }
  },
  watch: {
    // Checkbox HTML tidak punya atribut reaktif untuk "indeterminate", jadi di-set manual lewat ref.
    isPartiallyFilteredSelected: {
      immediate: true,
      handler(val) {
        this.$nextTick(() => {
          if (this.$refs.selectAllCheckbox) {
            this.$refs.selectAllCheckbox.indeterminate = val;
          }
        });
      }
    },
    isAllFilteredSelected() {
      this.$nextTick(() => {
        if (this.$refs.selectAllCheckbox) {
          this.$refs.selectAllCheckbox.indeterminate = this.isPartiallyFilteredSelected;
        }
      });
    }
  },
  mounted() {
    this.loadPOReferences();
    document.addEventListener('click', this.handleOutsideColumnFilterClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideColumnFilterClick);
  },
  methods: {
    // Centang / batalkan semua baris yang SEDANG TAMPIL di layar (hasil filter kolom aktif).
    // Baris yang sudah dicentang tapi sedang tidak tampil (tertutup filter lain) tidak ikut disentuh,
    // supaya pilihan user sebelumnya tidak hilang tanpa disadari.
    toggleSelectAllFiltered() {
      if (this.busy || this.filteredKombinasi.length === 0) return;

      if (this.isAllFilteredSelected) {
        // Batalkan hanya baris yang sedang tampil
        const visibleSet = new Set(this.filteredKombinasi);
        this.selectedItems = this.selectedItems.filter((row) => !visibleSet.has(row));
      } else {
        // Tambahkan baris yang sedang tampil dan belum tercentang, tanpa duplikat
        const alreadySelected = new Set(this.selectedItems);
        const toAdd = this.filteredKombinasi.filter((row) => !alreadySelected.has(row));
        this.selectedItems = [...this.selectedItems, ...toAdd];
      }
    },

    clearSelection() {
      if (this.busy) return;
      this.selectedItems = [];
    },

    // Hitung ulang A1TOT (total) tiap kali salah satu A1TO1-15 diketik user, sesuai baris yang bersangkutan.
    recalcA1Total(row) {
      let total = 0;
      for (let i = 1; i <= 15; i++) {
        total += Number(row[`A1TO${i}`]) || 0;
      }
      row.A1TOT = total;
    },

    // TAMBAHKAN INI
recalcS1Total(row) {
  let total = 0;
  for (let i = 1; i <= 15; i++) {
    total += Number(row[`S1TO${i}`]) || 0;
  }
  row.S1TOT = total;
},

    // Isi otomatis ke bawah: begitu user mengisi satu kolom (A1 workname / A1TO1-15 / S1TO1-15)
    // pada satu baris, nilai yang sama langsung diterapkan ke baris-baris di bawahnya yang
    // masih dalam kelompok Style + Warna yang sama. Berhenti begitu ketemu Warna/Style lain,
    // supaya tidak "bocor" ke kelompok warna berikutnya.
    fillDownSameColor(row, field) {
      const list = this.daftarKombinasi;
      const startIndex = list.indexOf(row);
      if (startIndex === -1) return;

      const value = row[field];

      for (let i = startIndex + 1; i < list.length; i++) {
        const target = list[i];
        if (target.xMColor !== row.xMColor || target.xPO !== row.xPO) break;
        target[field] = value;
        if (field.startsWith('A1TO')) this.recalcA1Total(target);
        if (field.startsWith('S1TO')) this.recalcS1Total(target);
      }
    },

    // ============ FILTER KOLOM (xNO, Style, Delivery, Buyer, Warna) ============
    uniqueValuesFor(key) {
      const values = this.daftarKombinasi
        .map((row) => row[key])
        .filter((v) => v !== null && v !== undefined && v !== '');
      return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b), 'id'));
    },

    // Opsi checkbox untuk suatu kolom, setelah disaring oleh teks pencarian di dropdown-nya.
    filteredOptionsFor(key) {
      const all = this.uniqueValuesFor(key);
      const q = (this.columnFilterSearch[key] || '').trim().toLowerCase();
      if (!q) return all;
      return all.filter((v) => String(v).toLowerCase().includes(q));
    },

    toggleColumnFilter(key) {
      this.openColumnFilter = this.openColumnFilter === key ? null : key;
    },

    clearColumnFilter(key) {
      this.columnFilters[key] = [];
      this.columnFilterSearch[key] = '';
    },

    clearAllColumnFilters() {
      Object.keys(this.columnFilters).forEach((key) => {
        this.columnFilters[key] = [];
        this.columnFilterSearch[key] = '';
      });
      this.openColumnFilter = null;
    },

    // Menutup dropdown filter kolom kalau user klik di luar area filter manapun.
    handleOutsideColumnFilterClick(event) {
      if (!this.openColumnFilter) return;
      if (event.target.closest('.col-no, .col-style, .col-plainfilter')) return;
      this.openColumnFilter = null;
    },

    async loadPOReferences() {
      this.poReferencesLoading = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/poeks/style`);
        if (response.data && response.data.success) {
          this.poReferences = response.data.data.map((item) => item.xPO);
        }
      } catch (err) {
        console.error('Gagal memuat daftar PO:', err);
      } finally {
        this.poReferencesLoading = false;
      }
    },

    openPODropdown() {
      if (this.busy) return;
      this.showPODropdown = true;
      this.highlightedIndex = this.filteredPOReferences.indexOf(this.searchPO);
      if (this.poReferences.length === 0 && !this.poReferencesLoading) {
        this.loadPOReferences();
      }
    },

    selectPO(po) {
      if (this.busy) return;
      this.searchPO = po;
      this.poSearchText = po;
      this.showPODropdown = false;
      this.highlightedIndex = -1;
      this.fetchDataKombinasi();
    },

    clearPOSelection() {
      if (this.busy) return;
      this.searchPO = '';
      this.poSearchText = '';
      this.daftarKombinasi = [];
      this.selectedItems = [];
      this.hasSearched = false;
      this.dataLoadedForDate = '';
      this.clearAllColumnFilters();
    },

    onPOKeydown(e) {
      if (!this.showPODropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        this.openPODropdown();
        return;
      }
      if (!this.showPODropdown) return;

      const list = this.filteredPOReferences;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, list.length - 1);
        this.scrollHighlightedIntoView();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        this.scrollHighlightedIntoView();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.highlightedIndex >= 0 && list[this.highlightedIndex]) {
          this.selectPO(list[this.highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        this.showPODropdown = false;
      }
    },

    scrollHighlightedIntoView() {
      this.$nextTick(() => {
        const listEl = this.$refs.poListRef;
        const el = listEl && listEl.children[this.highlightedIndex];
        if (el) el.scrollIntoView({ block: 'nearest' });
      });
    },

    async fetchDataKombinasi() {
  if (this.busy) return; 

  if (!this.searchPO.trim()) {
    alert('Harap pilih nomor PO terlebih dahulu!');
    return;
  }

  const requestedDate = this.filterDate;
  this.loading = true;
  this.hasSearched = true;

  try {
    const response = await axios.get(`${API_BASE_URL}/poeks/combined`, {
      params: {
        pBeginDate: requestedDate,
        pEndDate: requestedDate,
        pPO: this.searchPO.trim()
      }
    });

    if (response && response.data && response.data.success) {
      const rawData = response.data.data || [];
      this.daftarKombinasi = rawData.map((row) => this.mapRawKombinasiRow(row));
      // Auto-isi A1/S1 dari input terakhir (PO + Warna sama) untuk baris yang belum punya data di tanggal ini.
      await this.applyLastInputAutofill(this.daftarKombinasi, this.searchPO.trim(), requestedDate);
    } else {
      this.daftarKombinasi = [];
      alert(response.data.message || 'Gagal memuat data kombinasi.');
    }
    this.dataLoadedForDate = requestedDate;
  } catch (error) {
    console.error('Error fetching kombinasi:', error);
    alert('Terjadi kesalahan saat mengambil data kombinasi: ' + error.message);
    this.daftarKombinasi = [];
  } finally {
    this.loading = false;
  }
},

    // Ubah satu baris mentah dari API menjadi bentuk yang dipakai tabel (A1TOT/S1TOT terhitung, nama kerja konsisten).
    // Diambil terpisah dari fetchDataKombinasi supaya bisa dipakai ulang oleh proses Sinkronisasi Massal.
    mapRawKombinasiRow(row) {
      const a1Fields = {};
      let totalA1 = 0;
      const finalWorkName = row.a1workname || row.A1WORKNAME || row.a1workName || '';
      for (let i = 1; i <= 15; i++) {
        const apiValue = row[`A1TO${i}`] !== undefined ? row[`A1TO${i}`] :
                         (row[`a1to${i}`] !== undefined ? row[`a1to${i}`] :
                         (row[`A1to${i}`] !== undefined ? row[`A1to${i}`] : 0));
        a1Fields[`A1TO${i}`] = apiValue ? Number(apiValue) : 0;
        totalA1 += a1Fields[`A1TO${i}`];
      }

      const s1Fields = {};
      let totalS1 = 0;
      const finalS1WorkName = row.s1workname || row.S1WORKNAME || row.s1workName || 'SHORT';
      for (let i = 1; i <= 15; i++) {
        const apiS1Value = row[`S1TO${i}`] !== undefined ? row[`S1TO${i}`] :
                         (row[`s1to${i}`] !== undefined ? row[`s1to${i}`] :
                         (row[`S1to${i}`] !== undefined ? row[`S1to${i}`] : 0));
        s1Fields[`S1TO${i}`] = apiS1Value ? Number(apiS1Value) : 0;
        totalS1 += s1Fields[`S1TO${i}`];
      }

      return {
        ...row,
        a1workname: finalWorkName,
        ...a1Fields,
        A1TOT: totalA1,
        s1workname: finalS1WorkName,
        ...s1Fields,
        S1TOT: totalS1,
      };
    },

    // FITUR BARU: cek input A1/S1 TERAKHIR (tanggal sebelumnya, PO + Warna sama) dan otomatis
    // isi baris yang belum punya data di tanggal ini, supaya user tidak perlu ngetik ulang.
    // Baris yang sudah punya data tersimpan untuk tanggal yang sedang dibuka TIDAK ditimpa.
    async applyLastInputAutofill(rows, po, dateForFetch) {
      if (!rows || rows.length === 0 || !po) return rows;
      try {
        const response = await axios.get(`${API_BASE_URL}/poeks/lastinput`, {
          params: { pPO: po, pDate: dateForFetch }
        });
        if (response.data && response.data.success) {
          const lastMap = {};
          (response.data.data || []).forEach((r) => { lastMap[r.xMColor] = r; });

          rows.forEach((row) => {
            const alreadyHasData =
              (row.a1workname && row.a1workname.trim() !== '') ||
              (Number(row.A1TOT) || 0) > 0 ||
              (Number(row.S1TOT) || 0) > 0;
            if (alreadyHasData) return;

            const last = lastMap[row.xMColor];
            if (!last) return;

            row.a1workname = last.a1workname || '';
            row.A1TOT = Number(last.A1TOT) || 0;
            for (let i = 1; i <= 15; i++) {
              row[`A1TO${i}`] = Number(last[`A1TO${i}`]) || 0;
            }
            row.s1workname = last.S1workname || row.s1workname;
            row.S1TOT = Number(last.S1TOT) || 0;
            for (let i = 1; i <= 15; i++) {
              row[`S1TO${i}`] = Number(last[`S1TO${i}`]) || 0;
            }
          });
        }
      } catch (err) {
        console.error('Gagal memuat input A1/S1 terakhir:', err);
      }
      return rows;
    },

    formatDelivery(date) {
      if (!date) return '-';
 
      return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    },

    // Bentuk 1 item payload siap-kirim ke /poeks/upsertpo, dipakai baik oleh simpan manual
    // maupun oleh proses Sinkronisasi Massal.
    buildUpsertPayload(item, dateForSave) {
      const a1Fields = {};
      let a1Total = 0;
      for (let i = 1; i <= 15; i++) {
        const val = Number(item[`A1TO${i}`]) || 0;
        a1Fields[`A1TO${i}`] = val;
        a1Total += val;
      }
      const s1Fields = {};
      let s1Total = 0;
      for (let i = 1; i <= 15; i++) {
        const valS1 = Number(item[`S1TO${i}`]) || 0;
        s1Fields[`S1TO${i}`] = valS1;
        s1Total += valS1;
      }
      return {
        ...item,
        ...a1Fields,
        A1TOT: a1Total,
        a1workname: item.a1workname || '',
        ...s1Fields,
        S1TOT: s1Total,
        s1workname: item.s1workname || '',
        xDateTime: dateForSave
      };
    },

    // ===================== SINKRONISASI MASSAL (BERTAHAP / QUEUE) =====================
    // Ambil data kombinasi utk 1 PO pada tanggal filter, auto-isi A1/S1 dari input terakhir,
    // lalu langsung simpan (upsert) semua barisnya. Dipakai bergiliran satu-per-satu oleh
    // startBulkSync supaya tidak membebani server/browser (bukan dikirim serentak/paralel).

    // FITUR BARU: bikin "sidik jari" isi data (Warna, Buyer, Size, Qty target, dst) TANPA xPO/xNO.
    // Dipakai untuk mendeteksi kalau prod7/prod8 melaporkan data yang sama persis tapi
    // dilabeli xPO berbeda (mis. 311020-2606A vs 311020-2608B) — supaya tidak tersimpan dobel.
    buildRowFingerprint(row) {
      const parts = [
        row.xBuyer, row.xMColor, row.cTTQty, row.xTOL, row.xPOMark, row.xRegion,
        row.xType, row.xKind, row.xName, row.xWorkCode, row.xWorkName,
        row.xTypeD, row.xKindD, row.xNameD, row.xWorkCodeD, row.xWorkNameD
      ];
      for (let i = 1; i <= 15; i++) parts.push(row[`xSize${i}`]);
      for (let i = 1; i <= 15; i++) parts.push(row[`xTTQty${i}`]);
      for (let i = 1; i <= 15; i++) parts.push(row[`xTO${i}`]);
      for (let i = 1; i <= 15; i++) parts.push(row[`xTOD${i}`]);
      return parts.map((v) => (v === undefined || v === null ? '' : String(v))).join('|');
    },
    buildPOFingerprint(rows) {
      // Gabungan semua sidik jari baris dalam 1 PO, diurutkan supaya urutan baris tidak mempengaruhi hasil.
      return rows.map((r) => this.buildRowFingerprint(r)).sort().join('##');
    },

    // FITUR BARU: cek apakah xFtyDate (tanggal delivery) sebuah baris berada dalam rentang
    // [ftyDateBegin, ftyDateEnd] yang dipilih user (format input date: 'YYYY-MM-DD').
    // xFtyDate BEDA dengan xDateTime — xFtyDate itu tanggal delivery PO, xDateTime itu tanggal record disimpan.
    isFtyDateInRange(xFtyDate, ftyDateBegin, ftyDateEnd) {
      if (!xFtyDate) return false;
      const d = new Date(xFtyDate);
      if (isNaN(d.getTime())) return false;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${day}`;
      return dStr >= ftyDateBegin && dStr <= ftyDateEnd;
    },

    async fetchAndSaveOnePO(po, seenFingerprints, ftyDateBegin, ftyDateEnd) {
      const targetDate = this.filterDate;
      const response = await axios.get(`${API_BASE_URL}/poeks/combined`, {
        params: { pBeginDate: targetDate, pEndDate: targetDate, pPO: po }
      });

      if (!response || !response.data || !response.data.success) {
        throw new Error((response && response.data && response.data.message) || 'Gagal mengambil data dari server.');
      }

      const rawData = response.data.data || [];
      if (rawData.length === 0) {
        return { rowCount: 0, duplicate: false, filteredCount: 0 };
      }

      let rows = rawData.map((row) => this.mapRawKombinasiRow(row));

      // FITUR BARU: perketat sinkronisasi — hanya baris dengan xFtyDate dalam rentang terpilih
      // yang boleh ikut di-upsert. Baris di luar rentang di-skip, tidak dikirim ke server sama sekali.
      const totalBeforeFilter = rows.length;
      if (ftyDateBegin && ftyDateEnd) {
        rows = rows.filter((r) => this.isFtyDateInRange(r.xFtyDate, ftyDateBegin, ftyDateEnd));
      }
      const filteredCount = totalBeforeFilter - rows.length;

      if (rows.length === 0) {
        return { rowCount: 0, duplicate: false, filteredCount };
      }

      // FITUR BARU: cek dulu apakah isi data ini (Warna/Qty/Size dst, di luar xPO) sudah pernah
      // disimpan lewat PO lain dalam sesi sinkron massal ini. Kalau sama persis -> skip, tidak dobel.
      const fingerprint = this.buildPOFingerprint(rows);
      if (seenFingerprints && seenFingerprints.has(fingerprint)) {
        return { rowCount: rows.length, duplicate: true, filteredCount };
      }

      await this.applyLastInputAutofill(rows, po, targetDate);

      const payloadItems = rows.map((item) => this.buildUpsertPayload(item, targetDate));
      const saveResponse = await axios.post(`${API_BASE_URL}/poeks/upsertpo`, { items: payloadItems });

      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.message || 'Gagal menyimpan data.');
      }

      if (seenFingerprints) seenFingerprints.add(fingerprint);
      return { rowCount: rows.length, duplicate: false, filteredCount };
    },

    // Klik tombol "Sinkronisasi Massal" -> buka modal pemilihan PO dulu (bukan langsung jalan),
    // supaya user bisa pilih sebagian PO saja kalau tidak mau nunggu semuanya (misal 250 PO ~15 menit).
    openSyncSelectModal() {
      if (this.busy || this.syncRunning) return;

      if (!this.poReferences || this.poReferences.length === 0) {
        alert('Daftar Style belum termuat. Coba beberapa saat lagi.');
        return;
      }

      this.syncSelectSearch = '';
      this.syncSelectedPOs = []; // default kosong, biar user sadar memilih sendiri
      this.syncFtyDateBegin = ''; // FITUR BARU: wajib dipilih ulang tiap sesi, jangan terbawa dari sesi sebelumnya
      this.syncFtyDateEnd = '';
      this.syncSelectModalOpen = true;
    },

    toggleSyncSelectAll() {
      if (this.syncAllSelected) {
        this.syncSelectedPOs = [];
      } else {
        this.syncSelectedPOs = [...this.poReferences];
      }
    },

    toggleSyncSelectOne(po) {
      const idx = this.syncSelectedPOs.indexOf(po);
      if (idx === -1) this.syncSelectedPOs.push(po);
      else this.syncSelectedPOs.splice(idx, 1);
    },

    closeSyncSelectModal() {
      this.syncSelectModalOpen = false;
    },

    // Setelah user pilih PO di modal, ini yang benar-benar menjalankan antrian bertahap.
    // Logika antrian & upsert-nya SAMA seperti sebelumnya, cuma sekarang cuma proses PO terpilih.
    async confirmBulkSync() {
      if (this.syncSelectedPOs.length === 0) {
        alert('Pilih minimal 1 Style dulu.');
        return;
      }

      // FITUR BARU: rentang xFtyDate wajib diisi supaya tidak semua xFtyDate ikut ter-upsert.
      if (!this.syncFtyDateBegin || !this.syncFtyDateEnd) {
        alert('Harap pilih rentang tanggal Delivery (xFtyDate) — Dari dan Sampai — terlebih dahulu.');
        return;
      }
      if (this.syncFtyDateBegin > this.syncFtyDateEnd) {
        alert('Tanggal xFtyDate "Dari" tidak boleh lebih besar dari tanggal "Sampai".');
        return;
      }

      const ftyDateBegin = this.syncFtyDateBegin;
      const ftyDateEnd = this.syncFtyDateEnd;
      const chosenPOs = [...this.syncSelectedPOs];
      this.syncSelectModalOpen = false;

      this.syncQueue = chosenPOs.map((po) => ({ po, status: 'pending', rowCount: 0, message: '' }));
      this.syncModalOpen = true;
      this.syncRunning = true;
      this.syncCancelled = false;

      // Sidik jari data yang sudah tersimpan di sesi sinkron ini (lintas-PO), untuk cegah dobel
      // saat prod7/prod8 melaporkan data yang sama persis dengan label xPO yang berbeda.
      const seenFingerprints = new Set();

      for (let i = 0; i < this.syncQueue.length; i++) {
        if (this.syncCancelled) {
          this.syncQueue[i].status = 'dibatalkan';
          continue;
        }

        const entry = this.syncQueue[i];
        entry.status = 'processing';

        try {
          const result = await this.fetchAndSaveOnePO(entry.po, seenFingerprints, ftyDateBegin, ftyDateEnd);
          entry.rowCount = result.rowCount;
          entry.status = result.duplicate ? 'duplikat' : (result.rowCount > 0 ? 'done' : 'skipped');
          // FITUR BARU: kasih tahu kalau ada baris yang dilewati karena xFtyDate di luar rentang.
          if (result.filteredCount > 0) {
            entry.message = `${result.filteredCount} baris dilewati (xFtyDate di luar rentang)`;
          }
        } catch (err) {
          entry.status = 'error';
          entry.message = err.message || 'Terjadi kesalahan tak terduga.';
          console.error(`Gagal sinkronisasi Style ${entry.po}:`, err);
        }
      }

      this.syncRunning = false;

      // Jika PO yang sedang ditampilkan di tabel termasuk yang baru disinkron, muat ulang agar sinkron di layar.
      if (this.searchPO && this.syncQueue.some((q) => q.po === this.searchPO && (q.status === 'done' || q.status === 'skipped'))) {
        this.fetchDataKombinasi();
      }
    },

    cancelBulkSync() {
      if (!this.syncRunning) return;
      this.syncCancelled = true;
    },

    closeSyncModal() {
      if (this.syncRunning) return; // jangan biarkan modal ditutup selagi proses berjalan
      this.syncModalOpen = false;
    },

    async simpanPilihanAdmin() {
      // Cegah klik ganda / klik saat sistem masih memuat data atau sedang menyimpan.
      if (this.busy) return;

      if (this.selectedItems.length === 0) {
        alert('Silakan centang baris data warna terlebih dahulu!');
        return;
      }

      if (this.filterDate !== this.dataLoadedForDate) {
        alert('Tanggal berubah namun data di tabel belum diperbarui. Silakan klik "Muat Ulang" terlebih dahulu sebelum menyimpan.');
        return;
      }

      if (!confirm(`Simpan ${this.selectedItems.length} baris terpilih untuk tanggal ${this.filterDate}?`)) {
        return;
      }

      if (this.busy || this.filterDate !== this.dataLoadedForDate) {
        alert('Kondisi data berubah selagi konfirmasi berlangsung. Silakan coba lagi.');
        return;
      }

      const payloadItems = this.selectedItems.map((item) => this.buildUpsertPayload(item, this.filterDate));

      this.isSaving = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/poeks/upsertpo`, { items: payloadItems });
        if (response.data.success) {
          alert('Sukses! Data berhasil disimpan.');
          this.selectedItems = [];
        } else {
          alert('Gagal memproses simpan: ' + response.data.message);
        }
      } catch (error) {
        console.error('Error pada post upsert:', error);
        alert('Gagal mengirim data upsert ke server: ' + (error.response?.data?.message || error.message));
      } finally {
        this.isSaving = false;
      }
    }
  }
};

const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value; };
const logout = () => {};
</script>

<style scoped>
/* ============ APP SHELL LAYOUT (Header / Sidebar / Footer) ============ */
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f4f6f8;
}
.app-body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}
.app-main {
  flex: 1 1 auto;
  min-width: 0;
  padding: 28px clamp(16px, 3vw, 48px);
  margin-left: 16rem;
  transition: margin-left 0.2s ease;
}
.app-main--collapsed { margin-left: 0; }
@media (max-width: 900px) {
  .app-main { margin-left: 0; padding: 18px; }
}
/* ============ TOKENS ============ */
.poeks-page {
  --ink: #1a2332;
  --ink-muted: #64748b;
  --ink-faint: #94a3b8;
  --surface: #ffffff;
  --canvas: #f4f6f8;
  --border: #e2e6ea;
  --primary: #1f4e5f;
  --primary-hover: #163a47;
  --primary-soft: #e8f1f4;
  --accent: #c47a1f;
  --accent-soft: #fbf1e2;
  --success: #2f9e5b;
  --success-hover: #26824a;
  --danger: #c94a4a;
  --need-bg: #f7f8fa;
  --supply-bg: #eef6f8;
  --ship-bg: #fdf6e8;
  --a1-bg: #f4eefc;
  --s1-bg: #eefce8;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ink);
  background: transparent;
  min-height: 100%;
  box-sizing: border-box;
}
.poeks-page * { box-sizing: border-box; }
.poeks-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.06);
  padding: 26px 30px 30px;
  height: 100%;
}
/* ============ HEADER ============ */
.poeks-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
.poeks-header-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
  color: #fff;
  box-shadow: 0 4px 10px rgba(31, 78, 95, 0.25);
}
.poeks-title {
  margin: 0 0 2px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.poeks-subtitle {
  margin: 0;
  font-size: 13.5px;
  color: var(--ink-muted);
}
/* ============ FILTERS ============ */
.poeks-filters {
  display: grid;
  grid-template-columns: 0.7fr 1.6fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 900px) {
  .poeks-filters { grid-template-columns: 1fr; }
}
.field-hint {
  font-size: 11px;
  color: var(--ink-faint);
  line-height: 1.4;
}
/* ============ OVERLAY LOADING GLOBAL ============ */
.poeks-overlay {
  position: fixed;
  inset: 0;
  background: rgba(244, 246, 248, 0.78);
  backdrop-filter: blur(2px);
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: wait;
}
.poeks-overlay-box {
  background: var(--surface);
  padding: 2rem 2.75rem;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(16, 24, 40, 0.18);
  text-align: center;
  min-width: 260px;
}
.overlay-title { margin: 12px 0 4px; font-weight: 700; color: var(--ink); }
.overlay-sub { margin: 0; font-size: 12.5px; color: var(--ink-muted); }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
}
.field-input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--ink);
  background: var(--surface);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.field-input:disabled { background: var(--canvas); color: var(--ink-faint); cursor: not-allowed; }
/* ============ PO COMBOBOX ============ */
.field-po { position: relative; }
.po-combobox {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  padding: 0 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.po-combobox.is-disabled { background: var(--canvas); opacity: 0.75; }
.po-combobox.is-open,
.po-combobox:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.po-combobox-icon { color: var(--ink-faint); flex-shrink: 0; }
.po-combobox-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 0 8px;
  color: var(--ink);
  background: transparent;
}
.po-combobox-input::placeholder { color: var(--ink-faint); }
.po-combobox-clear {
  border: none;
  background: var(--canvas);
  color: var(--ink-muted);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.po-combobox-clear:hover { background: #e5e9ed; color: var(--ink); }
.po-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
  z-index: 30;
  overflow: hidden;
}
.po-dropdown-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  max-height: 280px;
  overflow-y: auto;
}
.po-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 6px;
  font-size: 13.5px;
  color: var(--ink);
  cursor: pointer;
}
.po-dropdown-item.is-active { background: var(--primary-soft); }
.po-dropdown-item.is-selected { color: var(--primary); font-weight: 600; }
.po-dropdown-footer {
  border-top: 1px solid var(--border);
  padding: 8px 12px;
  font-size: 11.5px;
  color: var(--ink-faint);
  background: var(--canvas);
}
.po-dropdown-state {
  padding: 18px 12px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
/* ============ STATUS BAR ============ */
.poeks-statusbar {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: var(--primary-soft);
  border-radius: 8px;
}
.statusbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.po-chip {
  background: var(--primary);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}
.statusbar-text { font-size: 13px; color: var(--ink-muted); }
.statusbar-count { font-size: 12.5px; color: var(--primary); font-weight: 600; }
.statusbar-warning {
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  background: #fef3c7;
  padding: 3px 9px;
  border-radius: 999px;
}
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 7px;
  cursor: pointer;
}
.btn-refresh:hover:not(:disabled) { background: var(--canvas); }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.poeks-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
/* ============ STATES ============ */
.poeks-loading, .poeks-empty-hint, .poeks-noresult {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  color: var(--ink-muted);
  text-align: center;
}
.poeks-empty-hint svg, .poeks-noresult svg { color: var(--ink-faint); }
.poeks-noresult p { margin: 0; font-size: 14px; color: var(--ink); }
.poeks-noresult small { color: var(--ink-muted); }
.po-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.po-spinner-lg { width: 26px; height: 26px; border-width: 3px; }

/* ============ TABLE TOOLBAR ============ */
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.table-toolbar-hint { font-size: 12.5px; color: var(--ink-muted); font-style: italic; }
.table-toolbar-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.btn-clear-filters {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-muted);
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 7px;
  cursor: pointer;
}
.btn-clear-filters:hover:not(:disabled) { background: var(--canvas); color: var(--ink); }
.btn-clear-filters:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-select-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary-soft);
  color: var(--primary);
  border: 1px solid var(--primary);
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-select-all:hover:not(:disabled) { background: var(--primary); color: #fff; }
.btn-select-all:disabled { opacity: 0.5; cursor: not-allowed; border-color: var(--border); color: var(--ink-faint); background: transparent; }
.btn-clear-selection {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--ink-muted);
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-clear-selection:hover:not(:disabled) { background: var(--canvas); color: var(--ink); }
.btn-clear-selection:disabled { opacity: 0.6; cursor: not-allowed; }
.poeks-noresult-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 20px;
  color: var(--ink-muted);
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 10px;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--success);
  color: #fff;
  border: none;
  font-size: 13.5px;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: var(--success-hover); }
.btn-primary:disabled { background: #b9c2cc; cursor: not-allowed; }
.count-badge {
  background: rgba(255, 255, 255, 0.25);
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
}
/* ============ TABLE ============ */
.table-wrapper {
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
}
.table-scroll { overflow: auto; max-height: 70vh; }
.poeks-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12.5px;
  width: max-content;
  min-width: 100%;
}
.poeks-table th, .poeks-table td {
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  padding: 7px 8px;
  text-align: center;
  white-space: nowrap;
}
.poeks-table .num { font-variant-numeric: tabular-nums; }
.poeks-table thead th {
  position: sticky;
  z-index: 2;
  background: var(--surface);
  font-weight: 700;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--ink-muted);
  height: 34px;
  box-sizing: border-box;
}
/* Tinggi baris header dipatok pasti (34px) supaya offset sticky baris ke-2 selalu presisi,
   dan sel "sambungan" (col-stub) di baris ke-2 punya tinggi yang sama persis dengan baris ke-1. */
.poeks-table thead tr:first-child th { top: 0; }
.poeks-table thead tr:last-child th { top: 34px; }
.grp-need { background: var(--need-bg); }
.grp-supply { background: var(--supply-bg); }
.grp-ship { background: var(--ship-bg); }
.grp-a1 { background: var(--a1-bg); }
.grp-s1 { background: var(--s1-bg); }
.poeks-table thead th.grp-need { background: var(--need-bg); }
.poeks-table thead th.grp-supply { background: var(--supply-bg); }
.poeks-table thead th.grp-ship { background: var(--ship-bg); }
.poeks-table thead th.grp-a1 { background: var(--a1-bg); }
.poeks-table thead th.grp-s1 { background: var(--s1-bg); }
/* Sel "sambungan" di baris header ke-2 untuk kolom identitas (col-check, col-no, dst).
   Dulu kolom ini pakai rowspan="2" digabung dengan position:sticky, tapi kombinasi
   rowspan + sticky itu tidak stabil di banyak browser (sel suka "lepas" pas discroll).
   Sekarang dipecah jadi 2 sel biasa lalu border tengahnya dihilangkan supaya terlihat
   menyatu seperti sebelumnya, tapi stickynya jadi jauh lebih stabil. */
.poeks-table thead tr:first-child th.col-check,
.poeks-table thead tr:first-child th.col-no,
.poeks-table thead tr:first-child th.col-style,
.poeks-table thead tr:first-child th.col-delivery,
.poeks-table thead tr:first-child th.col-buyer,
.poeks-table thead tr:first-child th.col-color,
.poeks-table thead tr:first-child th.col-mark,
.poeks-table thead tr:first-child th.col-region {
  border-bottom: none;
}
.col-stub {
  border-top: none;
  padding: 0;
}
.a1-input {
  width: 56px;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 4px 3px;
  font-size: 12px;
  font-family: inherit;
  color: var(--ink);
  background: var(--surface);
}
.a1-input:focus { outline: none; border-color: var(--primary); background: #fff; }
.a1-input:disabled { background: var(--canvas); cursor: not-allowed; opacity: 0.7; }
.a1-input-name { width: 130px; text-align: left; }
.a1-total-cell { font-weight: 700; color: var(--primary); background: rgba(31, 78, 95, 0.06); }
.a1-input-readonly {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 130px;
  height: 100%;
  padding: 4px 8px;
  color: var(--primary);
  font-weight: 600;
}
/* Freeze kolom identitas pertama supaya tetap terlihat saat scroll horizontal */
.col-check, .col-no, .col-style, .col-delivery, .col-buyer, .col-color {
  position: sticky;
  background: var(--surface);
}
/* Atur posisi kiri (left) secara akumulatif berdasarkan lebar kolom sebelumnya */
.col-check    { left: 0; width: 40px; min-width: 40px; }
.col-no       { left: 40px; width: 55px; min-width: 55px; }
.col-style    { left: 95px; width: 90px; min-width: 90px; text-align: left; }
.col-delivery { left: 185px; width: 110px; min-width: 110px; text-align: left; }
.col-buyer    { left: 295px; width: 100px; min-width: 100px; text-align: left; }
.col-color    { left: 395px; width: 100px; min-width: 100px; text-align: left; font-weight: 600; color: var(--primary); }
/* Mark & Region: tampilannya sama seperti Warna (rata kiri, tebal, warna aksen), tapi TIDAK freeze
   -- sebelumnya salah pakai class col-color juga sehingga ikut nempel dan numpuk di posisi Warna. */
.cell-accent { text-align: left; font-weight: 600; color: var(--primary); }
/* Sel di tbody yang di-freeze (kiri) selalu di atas sel biasa, tapi masih di bawah header. */
tbody .col-check, tbody .col-no, tbody .col-style, tbody .col-delivery, tbody .col-buyer, tbody .col-color {
  z-index: 1;
}
/* Header, termasuk pojok yang jadi freeze ganda (atas + kiri), harus paling atas dari semua sel tabel. */
.poeks-table thead th.col-check,
.poeks-table thead th.col-no,
.poeks-table thead th.col-style,
.poeks-table thead th.col-delivery,
.poeks-table thead th.col-buyer,
.poeks-table thead th.col-color {
  z-index: 5;
}
.col-style { font-weight: 600; }
.poeks-table tbody tr:hover td:not(.col-check):not(.col-no):not(.col-style) { background: #fafbfc; }
.row-selected td { background: var(--primary-soft) !important; }
input[type='checkbox'] { width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary); }
/* ============ FILTER KOLOM DI HEADER TABEL (xNO, Style, Delivery, Buyer, Warna) ============ */
.col-plainfilter { min-width: 170px; text-align: left; }
.th-with-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.colfilter-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--ink-faint);
  border-radius: 5px;
  cursor: pointer;
}
.colfilter-btn:hover:not(:disabled) { background: var(--primary-soft); color: var(--primary); }
.colfilter-btn.is-active { color: var(--primary); background: var(--primary-soft); }
.colfilter-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.colfilter-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  width: 220px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.16);
   z-index:9999;
  text-align: left;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
  overflow: hidden;
}
.colfilter-search { padding: 8px; border-bottom: 1px solid var(--border); }
.colfilter-search input {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12.5px;
  outline: none;
  color: var(--ink);
}
.colfilter-search input:focus { border-color: var(--primary); }
.colfilter-list { max-height: 210px; overflow-y: auto; padding: 4px; }
.colfilter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
  white-space: normal;
}
.colfilter-item:hover { background: var(--canvas); }
.colfilter-item input { width: 14px; height: 14px; flex-shrink: 0; }
.colfilter-empty { padding: 14px 8px; text-align: center; font-size: 12px; color: var(--ink-faint); }
.colfilter-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 7px 8px;
  border-top: 1px solid var(--border);
  background: var(--canvas);
}
.colfilter-clear, .colfilter-apply {
  border: none;
  background: transparent;
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
}
.colfilter-clear { color: var(--ink-muted); }
.colfilter-clear:hover { background: #e5e9ed; color: var(--ink); }
.colfilter-apply { color: #fff; background: var(--primary); }
.colfilter-apply:hover { background: var(--primary-hover); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ============ FITUR BARU: TOMBOL SINKRONISASI MASSAL ============ */
.btn-bulk-sync {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--primary);
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.btn-bulk-sync:hover:not(:disabled) { background: var(--primary); color: #fff; }
.btn-bulk-sync:disabled { opacity: 0.55; cursor: not-allowed; }

/* ============ FITUR BARU: MODAL PROGRESS SINKRONISASI MASSAL ============ */
.sync-modal-box {
  width: min(520px, 92vw);
  max-height: 84vh;
  background: var(--surface);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(16, 24, 40, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sync-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.sync-modal-header h3 { margin: 0; font-size: 15px; color: var(--ink); }
.sync-modal-close { border: none; background: transparent; color: var(--ink-muted); cursor: pointer; padding: 4px; border-radius: 6px; }
.sync-modal-close:hover { background: var(--canvas); }
.sync-modal-progress { padding: 14px 20px 4px; }
.sync-progress-track { height: 8px; border-radius: 5px; background: var(--canvas); overflow: hidden; }
.sync-progress-fill { height: 100%; background: var(--primary); transition: width 0.25s ease; }
.sync-progress-text { display: block; margin-top: 8px; font-size: 12px; color: var(--ink-muted); }
.sync-modal-list { flex: 1 1 auto; overflow-y: auto; padding: 6px 20px; max-height: 46vh; }
.sync-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--canvas);
  font-size: 12.5px;
}
.sync-row-po { font-weight: 600; color: var(--ink); }
.sync-row-status { color: var(--ink-muted); display: flex; align-items: center; gap: 6px; }
.sync-row--done .sync-row-status { color: var(--success); font-weight: 600; }
.sync-row--error .sync-row-status { color: var(--danger); font-weight: 600; }
.sync-row--duplikat .sync-row-status { color: #b45309; font-weight: 600; }
.sync-row--processing .sync-row-status { color: var(--primary); font-weight: 600; }
.sync-row--dibatalkan .sync-row-status { color: var(--ink-faint); }
.sync-modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ============ FITUR BARU: MODAL PILIH PO ============ */
.sync-select-toolbar { display: flex; gap: 10px; align-items: center; padding: 12px 20px 0; }
.sync-select-toolbar .field-input { flex: 1; }
.sync-select-daterange { display: flex; gap: 12px; padding: 0 20px; margin-top: 10px; }
.sync-select-daterange .field { flex: 1 1 0; }
.sync-daterange-hint { display: block; padding: 6px 20px 0; color: var(--ink-muted); font-size: 12px; }
.sync-select-count { padding: 8px 20px 0; font-size: 12px; color: var(--ink-muted); }
.sync-select-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--canvas);
  font-size: 12.5px;
  cursor: pointer;
}
.sync-select-row input[type="checkbox"] { width: 15px; height: 15px; cursor: pointer; }
.sync-select-empty { padding: 20px 4px; text-align: center; color: var(--ink-faint); font-size: 12.5px; }
</style>