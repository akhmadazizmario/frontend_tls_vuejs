<template>
  <aside
    ref="sidebarEl"
    :class="['sidebar', { open: isOpen, searching: !!searchQuery.trim() }]"
    @click.self="closeSidebarOnMobile"
  >
    <!-- BRAND (blok hijau di atas sidebar) -->
    <div class="sidebar-brand">
      <img src="/images/logo.jpg" alt="Logo" class="brand-logo" />
      <span class="brand-text">TLSI SYSTEM</span>
    </div>

    <div class="sidebar-body">
      <!-- Dashboard + gear -->
      <div class="sb-top">
        <router-link
          v-if="canAccess('dashboard')"
          to="/dashboard"
          class="sb-dashboard"
          active-class="active"
        >
          <i class="bi bi-house-fill"></i>
          <span>Dashboard</span>
        </router-link>
        <span v-else class="sb-dashboard"></span>

        <div class="sb-divider"></div>

        <router-link to="/profile" class="sb-gear" title="Pengaturan profil">
          <i class="bi bi-gear-fill"></i>
        </router-link>
      </div>

      <!-- Search menu -->
      <div class="sb-search">
        <input
          v-model="searchQuery"
          type="text"
          class="sb-search-input"
          placeholder="Search"
          autocomplete="off"
        />
        <button
          type="button"
          class="sb-search-btn"
          aria-label="Cari / bersihkan"
          @click="searchQuery = ''"
        >
          <i :class="['bi', searchQuery ? 'bi-x-lg' : 'bi-search']"></i>
        </button>
      </div>

      <!-- Manual (ganti href/route sesuai halaman manual kamu) -->
      <a href="#" class="manual-link" @click.prevent>
        <i class="bi bi-journal-bookmark-fill"></i>
        <span>Manual</span>
      </a>

      <nav class="nav flex-column">

      <!-- ============ PRODUCTION ============ -->
      <div v-if="hasProductionGroupAccess" class="nav-group nav-group--top">
        <a
          href="#"
          class="nav-link nav-link-toggle mb-1"
          @click.prevent="toggleProdGroup"
          :class="{ active: isProdGroupOpen }"
        >
          <span class="nav-icon"><i class="bi bi-kanban"></i></span>
          <span class="nav-text">PRODUCTION</span>
          <span v-if="hasErpAccess && pendingCount > 0" class="badge">{{ pendingCount }}</span>
          <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isProdGroupOpen }"></i>
        </a>

        <transition name="submenu">
          <div v-show="isProdGroupOpen" class="submenu">
                <!-- Dropdown Ekspedisi -->
                <div v-if="hasEkspedisiAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleSuratjalanDropdown"
                    :class="{ active: isSuratjalanOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-truck"></i></span>
                    <span class="nav-text">Ekspedisi</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isSuratjalanOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isSuratjalanOpen" class="submenu">
                      <router-link v-if="canAccess('suratjalan')" to="/suratjalan" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-file-earmark-arrow-up sub-icon"></i>
                        <span>Surat Jalan</span>
                      </router-link>

                      <router-link v-if="canAccess('suratmaker')" to="/suratmaker" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-pencil-square sub-icon"></i>
                        <span>Surat Maker</span>
                      </router-link>

                      <router-link v-if="canAccess('po_eks')" to="/view_poeks" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-receipt sub-icon"></i>
                        <span>PO EXPDC</span>
                      </router-link>

                      <router-link v-if="canAccess('hasilscanekspedisi')" to="/hasilscanekspedisi" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-upc-scan sub-icon"></i>
                        <span>Hasil Scan Ekspedisi</span>
                      </router-link>

                      <router-link v-if="canAccess('dailyoutput')" to="/dailyoutput" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-graph-up sub-icon"></i>
                        <span>Daily Output</span>
                      </router-link>

                      <router-link v-if="canAccess('laporanbahanterima')" to="/laporan-terima-tls" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-clipboard-check sub-icon"></i>
                        <span>Laporan Terima</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown IDP PO -->
                <div v-if="hasIdpPoAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleIdpPoDropdown"
                    :class="{ active: isIdpPoOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-collection-fill"></i></span>
                    <span class="nav-text">IDP Jatuh Tempo</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isIdpPoOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isIdpPoOpen" class="submenu">
                      <router-link v-if="canAccess('idppo')" to="/idppo" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-calendar2-week sub-icon"></i>
                        <span>Daftar IDP JT</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown ERP -->
                <div v-if="hasErpAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleComplainDropdown"
                    :class="{ active: isComplainOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-file-earmark-text"></i></span>
                    <span class="nav-text">ERP</span>
                    <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isComplainOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isComplainOpen" class="submenu">
                      <router-link v-if="canAccess('complain/status')" to="/complain/status" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-hourglass-split sub-icon"></i>
                        <span>Complain Pending</span>
                        <span v-if="pendingCount > 0" class="badge badge-inline">{{ pendingCount }}</span>
                      </router-link>

                      <router-link v-if="canAccess('complain')" to="/complain" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-chat-left-text sub-icon"></i>
                        <span>All Complain</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown Target -->
                <div v-if="hasTargetAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleTargetDropdown"
                    :class="{ active: isTargetOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-easel2"></i></span>
                    <span class="nav-text">Target</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isTargetOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isTargetOpen" class="submenu">
                      <router-link v-if="canAccess('target-finishing')" to="/target-finishing" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-bar-chart sub-icon"></i>
                        <span>Hasil Piece Work</span>
                      </router-link>
                      <router-link v-if="canAccess('scan-barcode-detail')" to="/scan-barcode-detail" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-upc-scan sub-icon"></i>
                        <span>Scan Barcode Detail</span>
                      </router-link>
                      <router-link v-if="canAccess('persen-target')" to="/persen-target" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-percent sub-icon"></i>
                        <span>Persen Target day</span>
                      </router-link>
                      <router-link v-if="canAccess('target/lining')" to="/target/lining" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-diagram-2 sub-icon"></i>
                        <span>IDP Linning</span>
                      </router-link>
                      <router-link v-if="canAccess('knittingmatchreport')" to="/knittingMatchReport" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-grid-3x3 sub-icon"></i>
                        <span>Pannel Matching Controll (Lining)</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown Production ERP -->
                <div v-if="hasPPCAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="togglePPCDropdown"
                    :class="{ active: isPPCOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-cassette"></i></span>
                    <span class="nav-text">PPC</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isPPCOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isPPCOpen" class="submenu">
                      <router-link v-if="canAccess('planningerp')" to="/planningerp" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-diagram-3 sub-icon"></i>
                        <span>Planning TV 1</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown Production ERP -->
                <div v-if="hasProductionERPAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="togglePERPDropdown"
                    :class="{ active: isPERPOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-kanban"></i></span>
                    <span class="nav-text">Production</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isPERPOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isPERPOpen" class="submenu">
                      <router-link v-if="canAccess('linking-pergedung')" to="/linking-pergedung" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-diagram-3 sub-icon"></i>
                        <span>Report Linking</span>
                      </router-link>
                       <router-link v-if="canAccess('polinkingproduksi')" to="/po-linking-produksi" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-receipt-cutoff sub-icon"></i>
                        <span>Po Linking</span>
                      </router-link>
                      <router-link v-if="canAccess('finishing-pergedung')" to="/finishing-pergedung" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-check2-all sub-icon"></i>
                        <span>Report Finishing</span>
                      </router-link>
                      <router-link v-if="canAccess('plan_ppc')" to="/plan_ppc" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-calendar3 sub-icon"></i>
                        <span>Planning Target</span>
                      </router-link>
                      <router-link v-if="canAccess('hasilperbaikandantolakan')" to="/hasilperbaikandantolakan" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-arrow-repeat sub-icon"></i>
                        <span>Retur Tolakan & H/Perbaikan</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

          </div>
        </transition>
      </div>

      <!-- ============ OPERATIONAL ============ -->
      <div v-if="hasOperationalGroupAccess" class="nav-group nav-group--top">
        <a
          href="#"
          class="nav-link nav-link-toggle mb-1"
          @click.prevent="toggleOperGroup"
          :class="{ active: isOperGroupOpen }"
        >
          <span class="nav-icon"><i class="bi bi-gear-wide-connected"></i></span>
          <span class="nav-text">OPERATIONAL</span>
          <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isOperGroupOpen }"></i>
        </a>

        <transition name="submenu">
          <div v-show="isOperGroupOpen" class="submenu">
                <!-- Dropdown General Affair -->
                <div v-if="hasGeneralAffairAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleBuildingDropdown"
                    :class="{ active: isBuildingOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-building-fill"></i></span>
                    <span class="nav-text">General Affair</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isBuildingOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isBuildingOpen" class="submenu">
                      <router-link v-if="canAccess('building')" to="/building" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-tools sub-icon"></i>
                        <span>Building Maintenance</span>
                      </router-link>

                      <div v-if="hasCleaningAccess" class="sidebar-section-title mt-2">
                        <span>Cleaning</span>
                      </div>
                      <router-link v-if="canAccess('categories-lapkebersihan')" to="/categories-lapkebersihan" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-tags sub-icon"></i>
                        <span>Kategori Cleaning</span>
                      </router-link>
                      <router-link v-if="canAccess('question-lapkebersihan')" to="/question-lapkebersihan" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-question-circle sub-icon"></i>
                        <span>Question Cleaning</span>
                      </router-link>
                      <router-link v-if="canAccess('report-lapkebersihan')" to="/report-lapkebersihan" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-clipboard-data sub-icon"></i>
                        <span>Report Cleaning</span>
                      </router-link>

                      <div v-if="hasCarBookingAccess" class="sidebar-section-title mt-2">
                        <span>Car Booking</span>
                      </div>
                      <router-link v-if="canAccess('carbook/booking')" to="/carbook/booking" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-car-front sub-icon"></i>
                        <span>Form Booking Car</span>
                      </router-link>
                      <router-link v-if="canAccess('carbook/ga-approval')" to="/carbook/ga-approval" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-check2-square sub-icon"></i>
                        <span>GA Approval</span>
                      </router-link>
                      <router-link v-if="canAccess('carbook/finance-approval')" to="/carbook/finance-approval" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-cash-coin sub-icon"></i>
                        <span>Finance Approval</span>
                      </router-link>
                      <router-link v-if="canAccess('carbook/manager-approval')" to="/carbook/manager-approval" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-person-check sub-icon"></i>
                        <span>Manager Aproval</span>
                      </router-link>
                      <router-link v-if="canAccess('carbook/settlement')" to="/carbook/settlement" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-journal-check sub-icon"></i>
                        <span>Laporan Settlement</span>
                      </router-link>
                      <router-link v-if="canAccess('carbook/checkpoint-security')" to="/carbook/checkpoint-security" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-shield-check sub-icon"></i>
                        <span>CheckPoint Security</span>
                      </router-link>
                      <router-link v-if="canAccess('carbook/master-mobil')" to="/carbook/master-mobil" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-car-front-fill sub-icon"></i>
                        <span>Mobil Master</span>
                      </router-link>
                      <router-link v-if="canAccess('carbook/servis')" to="/carbook/servis" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-wrench-adjustable sub-icon"></i>
                        <span>Servis Mobil</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown FCO -->
                <div v-if="hasFCOAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="togglePkbBDropdown"
                    :class="{ active: isPkbBOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-person-workspace"></i></span>
                    <span class="nav-text">FCO</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isPkbBOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isPkbBOpen" class="submenu">
                      <router-link v-if="canAccess('filepkb')" to="/filepkb" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-folder2-open sub-icon"></i>
                        <span>File PKB</span>
                      </router-link>
                      <router-link v-if="canAccess('visitor-pkb')" to="/visitor-pkb" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-people sub-icon"></i>
                        <span>Visitor PKB</span>
                      </router-link>
                      <router-link v-if="canAccess('form-fco')" to="/form-fco" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-file-earmark-plus sub-icon"></i>
                        <span>Form Fco</span>
                      </router-link>

                      <div class="submenu-divider"></div>

                      <router-link v-if="canAccess('apar-question')" to="/apar-question" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-question-diamond sub-icon"></i>
                        <span>APAR Quest</span>
                      </router-link>
                      <router-link v-if="canAccess('apar')" to="/apar" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-list-check sub-icon"></i>
                        <span>APAR List</span>
                      </router-link>
                      <router-link v-if="canAccess('fco/apar-check')" to="/fco/apar-check" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-clipboard2-check sub-icon"></i>
                        <span>APAR Checklist</span>
                      </router-link>
                      <router-link v-if="canAccess('fco/apar-rekap')" to="/fco/apar-rekap" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-clipboard2-data sub-icon"></i>
                        <span>APAR Rekap</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown Buku Tamu (IT & Security only) -->
                <div v-if="hasBukuTamuAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleBukuTamuDropdown"
                    :class="{ active: isBukuTamuOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-journal-bookmark-fill"></i></span>
                    <span class="nav-text">Buku Tamu</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isBukuTamuOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isBukuTamuOpen" class="submenu">
                      <router-link to="/buku-tamu" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-journal-bookmark sub-icon"></i>
                        <span>Buku Tamu</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown Gudang Barang -->
                <div v-if="hasGudangAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleGudangBDropdown"
                    :class="{ active: isGudangBOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-houses-fill"></i></span>
                    <span class="nav-text">Gudang Barang</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isGudangBOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isGudangBOpen" class="submenu">
                      <router-link v-if="canAccess('inventaris-gudang')" to="/item-masuk" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-box-seam sub-icon"></i>
                        <span>Inventory Gudang</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

          </div>
        </transition>
      </div>

      <!-- ============ EMPLOYEE ============ -->
      <div v-if="hasEmployeeGroupAccess" class="nav-group nav-group--top">
        <a
          href="#"
          class="nav-link nav-link-toggle mb-1"
          @click.prevent="toggleEmpGroup"
          :class="{ active: isEmpGroupOpen }"
        >
          <span class="nav-icon"><i class="bi bi-people-fill"></i></span>
          <span class="nav-text">EMPLOYEE</span>
          <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isEmpGroupOpen }"></i>
        </a>

        <transition name="submenu">
          <div v-show="isEmpGroupOpen" class="submenu">
                <!-- Dropdown HRD -->
                <div v-if="hasHRDAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleLokerDropdown"
                    :class="{ active: isLokerOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-person-lines-fill"></i></span>
                    <span class="nav-text">HRD</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isLokerOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isLokerOpen" class="submenu">
                      <router-link v-if="canAccess('loker')" to="/loker" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-briefcase sub-icon"></i>
                        <span>Daftar Loker</span>
                      </router-link>
                      <router-link v-if="canAccess('daftar-pelamar')" to="/daftar-pelamar" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-person-vcard sub-icon"></i>
                        <span>Daftar Pelamar</span>
                      </router-link>
                      <router-link v-if="canAccess('contact-messages')" to="/contact-messages" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-envelope sub-icon"></i>
                        <span>Contact Message</span>
                      </router-link>
                      <router-link v-if="canAccess('blog-rekrutmen')" to="/blog-rekrutmen" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-newspaper sub-icon"></i>
                        <span>Blog Rekrutmen</span>
                      </router-link>
                      <router-link v-if="canAccess('gallery-rekrutmen')" to="/gallery-rekrutmen" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-images sub-icon"></i>
                        <span>Gallery</span>
                      </router-link>
                      <router-link v-if="canAccess('pkwtandtt')" to="/pkwtandtt" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-file-earmark-text sub-icon"></i>
                        <span>Pkwtandtt</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

          </div>
        </transition>
      </div>

      <!-- ============ INFORMATION TECH ============ -->
      <div v-if="hasInfoTechGroupAccess" class="nav-group nav-group--top">
        <a
          href="#"
          class="nav-link nav-link-toggle mb-1"
          @click.prevent="toggleInfoGroup"
          :class="{ active: isInfoGroupOpen }"
        >
          <span class="nav-icon"><i class="bi bi-cpu"></i></span>
          <span class="nav-text">INFORMATION TECH</span>
          <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isInfoGroupOpen }"></i>
        </a>

        <transition name="submenu">
          <div v-show="isInfoGroupOpen" class="submenu">
                <router-link
                  v-if="canAccess('user')"
                  to="/user"
                  class="nav-link sub-link"
                  active-class="active"
                  exact
                >
                  <i class="bi bi-people sub-icon"></i>
                  <span>Daftar User</span>
                </router-link>

                <!-- Dropdown UAC -->
                <div v-if="hasUACAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleUACDropdown"
                    :class="{ active: isUACOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-person-check"></i></span>
                    <span class="nav-text">UAC</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isUACOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isUACOpen" class="submenu">
                      <router-link v-if="canAccess('pages')" to="/pages" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-file-earmark-text sub-icon"></i>
                        <span>Pages Web</span>
                      </router-link>

                      <router-link v-if="canAccess('userpageaccess')" to="/userpageaccess" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-shield-lock sub-icon"></i>
                        <span>User Access Pages</span>
                      </router-link>
                    </div>
                  </transition>
                </div>

                <!-- Dropdown IT -->
                <div v-if="hasITAccess" class="nav-group nav-group--sub">
                  <a
                    href="#"
                    class="nav-link nav-link-toggle sub-toggle"
                    @click.prevent="toggleBarangITDropdown"
                    :class="{ active: isBarangITOpen }"
                  >
                    <span class="nav-icon"><i class="bi bi-pc-display-horizontal"></i></span>
                    <span class="nav-text">IT</span>
                    <i class="bi bi-chevron-left caret-icon ms-auto" :class="{ 'caret-open': isBarangITOpen }"></i>
                  </a>

                  <transition name="submenu">
                    <div v-show="isBarangITOpen" class="submenu">
                      <router-link v-if="canAccess('barangit')" to="/barangit" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-laptop sub-icon"></i>
                        <span>Barang IT</span>
                      </router-link>
                      <router-link v-if="canAccess('riwayat-pesanan-it')" to="/riwayat-pesananan-it" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-cart sub-icon"></i>
                        <span>Pesanan Barang IT</span>
                      </router-link>

                      <div class="submenu-divider"></div>

                      <router-link v-if="canAccess('komplainit')" to="/komplainit" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-exclamation-octagon sub-icon"></i>
                        <span>Komplain IT</span>
                      </router-link>
                      <router-link v-if="canAccess('barcoderequest')" to="/barcoderequest" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-upc sub-icon"></i>
                        <span>Permintaan Barcode</span>
                      </router-link>

                      <div class="submenu-divider"></div>

                      <router-link v-if="canAccess('komputer')" to="/komputer" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-pc-display sub-icon"></i>
                        <span>Daftar komputer</span>
                      </router-link>
                      <!-- <router-link v-if="canAccess('planningerp')" to="/planningerp" class="nav-link sub-link" active-class="active">
                        <i class="bi bi-diagram-3 sub-icon"></i>
                        <span>Planning TV 1</span>
                      </router-link> -->
                    </div>
                  </transition>
                </div>

          </div>
        </transition>
      </div>

    </nav>

      <div class="sb-footer">TLSI SYSTEM @{{ new Date().getFullYear() }}</div>
    </div>
  </aside>
</template>


<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import axios from 'axios'
import { defineProps, defineEmits } from 'vue'
import io from 'socket.io-client'

/* ===============================
   ENV
================================ */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API2_BASE_URL = import.meta.env.VITE_API2_BASE_URL

const socket = io(API2_BASE_URL)

/* ===============================
   PROPS & EMIT
================================ */
const props = defineProps({
  isOpen: Boolean,
})
const emit = defineEmits(['update:isOpen'])

/* ===============================
   STATE
================================ */
const user = ref({ dept: '' })

// 🔑 INI YANG DIPAKAI UNTUK MENU
const pages = ref([])

const pendingCount = ref(0)

// search menu
const sidebarEl = ref(null)
const searchQuery = ref('')

// dropdown states
const isSuratjalanOpen = ref(false)
const isComplainOpen = ref(false)
const isBuildingOpen = ref(false)
const isBarangITOpen = ref(false)
const isIdpPoOpen = ref(false)
const isGudangBOpen = ref(false)
const isLokerOpen = ref(false)
const isTargetOpen = ref(false)
const isPkbBOpen = ref(false)
const isBukuTamuOpen = ref(false)
const isUACOpen = ref(false)
const isPERPOpen = ref(false)
const isPPCOpen = ref(false)

// grup utama (level 1)
const isProdGroupOpen = ref(false)
const isOperGroupOpen = ref(false)
const isEmpGroupOpen = ref(false)
const isInfoGroupOpen = ref(false)

/* ===============================
   SIDEBAR BEHAVIOR
================================ */
function closeSidebarOnMobile() {
  if (window.innerWidth < 768) {
    emit('update:isOpen', false)
  }
}

function toggleSuratjalanDropdown() {
  isSuratjalanOpen.value = !isSuratjalanOpen.value
}
function toggleComplainDropdown() {
  isComplainOpen.value = !isComplainOpen.value
}
function toggleBuildingDropdown() {
  isBuildingOpen.value = !isBuildingOpen.value
}
function toggleBarangITDropdown() {
  isBarangITOpen.value = !isBarangITOpen.value
}
function toggleIdpPoDropdown() {
  isIdpPoOpen.value = !isIdpPoOpen.value
}
function toggleGudangBDropdown() {
  isGudangBOpen.value = !isGudangBOpen.value
}
function toggleLokerDropdown() {
  isLokerOpen.value = !isLokerOpen.value
}
function toggleTargetDropdown() {
  isTargetOpen.value = !isTargetOpen.value
}
function togglePkbBDropdown() {
  isPkbBOpen.value = !isPkbBOpen.value
}
function toggleBukuTamuDropdown() {
  isBukuTamuOpen.value = !isBukuTamuOpen.value
}
function toggleUACDropdown() {
  isUACOpen.value = !isUACOpen.value
}
function togglePERPDropdown() {
  isPERPOpen.value = !isPERPOpen.value
}
function togglePPCDropdown() {
  isPPCOpen.value = !isPPCOpen.value
}
function toggleProdGroup() {
  isProdGroupOpen.value = !isProdGroupOpen.value
}
function toggleOperGroup() {
  isOperGroupOpen.value = !isOperGroupOpen.value
}
function toggleEmpGroup() {
  isEmpGroupOpen.value = !isEmpGroupOpen.value
}
function toggleInfoGroup() {
  isInfoGroupOpen.value = !isInfoGroupOpen.value
}

/* ===============================
   FETCH DATA
================================ */
async function fetchPendingCount() {
  try {
    const res = await axios.get(API_BASE_URL + '/complains/count/pending', {
      withCredentials: true,
    })
    pendingCount.value = res.data.pendingCount || 0
  } catch (err) {
    console.error('Failed to fetch pending complain count:', err)
  }
}

/* ===============================
   SEARCH MENU (filter lewat class; grup otomatis terbuka)
   Struktur: grup utama > sub-grup > menu
================================ */
watch(searchQuery, async (val) => {
  await nextTick()
  const root = sidebarEl.value
  if (!root) return
  const q = val.trim().toLowerCase()

  // return true kalau grup ini (atau isinya) cocok
  function applyGroup(group, inherited) {
    const title = (group.querySelector(':scope > .nav-link-toggle .nav-text')?.textContent || '').toLowerCase()
    const selfMatch = inherited || !q || title.includes(q)
    let any = false

    const sub = group.querySelector(':scope > .submenu')
    if (sub) {
      sub.querySelectorAll(':scope > .nav-group, :scope > .sub-link').forEach((child) => {
        if (child.classList.contains('nav-group')) {
          if (applyGroup(child, selfMatch)) any = true
        } else {
          const m = selfMatch || child.textContent.toLowerCase().includes(q)
          child.classList.toggle('search-hidden', !m)
          if (m) any = true
        }
      })
    }

    const visible = !q || selfMatch || any
    group.classList.toggle('search-hidden', !visible)
    return visible
  }

  root.querySelectorAll('.nav > .nav-group').forEach((g) => applyGroup(g, false))
})

/* ===============================
   ACCESS CHECK (MENU GUARD)
================================ */
function canAccess(code) {
  return pages.value.includes(code.toLowerCase())
}

const hasUACAccess = computed(() => {
  return canAccess('pages') || canAccess('userpageaccess')
})

const hasUserAccess = computed(() => {
  return canAccess('user')
})

// Logic: Jika user punya salah satu akses dari list di bawah, maka dropdown Ekspedisi muncul
const hasEkspedisiAccess = computed(() => {
  const daftarMenuEkspedisi = [
    'suratjalan',
    'suratmaker',
    'hasilscanekspedisi',
    'dailyoutput',
    // 'warehouse',
    'inputanacc',
    'po_eks',
    'laporanbahanterima'
  ]
  return daftarMenuEkspedisi.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasIdpPoAccess = computed(() => {
  const daftarMenuIdp = ['idppo']
  return daftarMenuIdp.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasErpAccess = computed(() => {
  const daftarMenuErp = ['complain/status', 'complain']
  return daftarMenuErp.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasGeneralAffairAccess = computed(() => {
  const daftarMenuGA = [
    'building',
    'question-lapkebersihan',
    'categories-lapkebersihan',
    'report-lapkebersihan',
    'carbook/booking',
    'carbook/ga-approval',
    'carbook/finance-approval',
    'carbook/settlement',
    'carbook/manager-approval',
    'carbook/checkpoint-security',
    'carbook/master-mobil',
    'carbook/servis'
  ]
  return daftarMenuGA.some(menu => pages.value.includes(menu.toLowerCase()))
})

// Sub-section headers hanya tampil jika ada minimal 1 item di dalamnya yang bisa diakses
const hasCleaningAccess = computed(() => {
  const daftarMenuCleaning = [
    'categories-lapkebersihan',
    'question-lapkebersihan',
    'report-lapkebersihan'
  ]
  return daftarMenuCleaning.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasCarBookingAccess = computed(() => {
  const daftarMenuCarBooking = [
    'carbook/booking',
    'carbook/ga-approval',
    'carbook/finance-approval',
    'carbook/settlement',
    'carbook/manager-approval',
    'carbook/checkpoint-security',
    'carbook/master-mobil',
    'carbook/servis'
  ]
  return daftarMenuCarBooking.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasITAccess = computed(() => {
  const daftarMenuIT = [
    'barangit',
    'riwayat-pesanan-it',
    'komplainit',
    'barcoderequest',
    'komputer',
    'planningerp'
  ]
  return daftarMenuIT.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasGudangAccess = computed(() => {
  const daftarMenuGudang = ['gudang', 'p-gudang', 'inventaris-gudang']
  return daftarMenuGudang.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasHRDAccess = computed(() => {
  const daftarMenuHRD = [
    'loker',
    'daftar-pelamar',
    'contact-messages',
    'blog-rekrutmen',
    'gallery-rekrutmen',
    'pkwtandtt'
  ]
  return daftarMenuHRD.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasTargetAccess = computed(() => {
  const daftarMenuTarget = [
    'target',
    'target-finishing',
    'scan-barcode-detail',
    'target/lining',
    'knittingmatchreport',
    'persen-target'
  ]
  return daftarMenuTarget.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasFCOAccess = computed(() => {
  const daftarMenuFCO = [
    'filepkb',
    'visitor-pkb',
    'form-fco',
    'apar-question',
    'apar',
    'fco/apar-check',
    'fco/apar-rekap'
  ]
  return daftarMenuFCO.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasProductionERPAccess = computed(() => {
  const daftarPERPmenu = [
    'linking-pergedung',
    'finishing-pergedung',
    'plan_ppc',
    'hasilperbaikandantolakan',
    'polinkingproduksi'
  ]
  return daftarPERPmenu.some(menu => pages.value.includes(menu.toLowerCase()))
})

const hasPPCAccess = computed(() => {
  const daftarPPCmenu = [
    'planningerp',
  ]
  return daftarPPCmenu.some(menu => pages.value.includes(menu.toLowerCase()))
})

// Buku Tamu: khusus dept IT & Security
const hasBukuTamuAccess = computed(() => {
  const dept = (user.value?.dept || '').toLowerCase().trim()
  return ['it', 'security'].includes(dept)
})

/* ===============================
   GRUP UTAMA (level 1)
   PRODUCTION  : Ekspedisi, IDP Jatuh Tempo, ERP, Target, PPC, Production
   OPERATIONAL : General Affair, FCO, Buku Tamu, Gudang Barang
   EMPLOYEE    : HRD
   INFORMATION TECH : Daftar User, UAC, IT
================================ */
const hasProductionGroupAccess = computed(() =>
  hasEkspedisiAccess.value || hasIdpPoAccess.value || hasErpAccess.value ||
  hasTargetAccess.value || hasPPCAccess.value || hasProductionERPAccess.value
)
const hasOperationalGroupAccess = computed(() =>
  hasGeneralAffairAccess.value || hasFCOAccess.value ||
  hasBukuTamuAccess.value || hasGudangAccess.value
)
const hasEmployeeGroupAccess = computed(() => hasHRDAccess.value)
const hasInfoTechGroupAccess = computed(() =>
  canAccess('user') || hasUACAccess.value || hasITAccess.value
)

/* ===============================
   MOUNTED
================================ */
onMounted(() => {
  // ambil user
  try {
    const userData = localStorage.getItem('user')
    user.value = userData ? JSON.parse(userData) : { dept: '' }
  } catch {
    user.value = { dept: '' }
  }

  // 🔑 ambil pages (INI KUNCI MENU)
  try {
    const pagesData = localStorage.getItem('pages')
    pages.value = pagesData ? JSON.parse(pagesData) : []
  } catch {
    pages.value = []
  }

  fetchPendingCount()

  /* ===============================
     SOCKET
  ================================ */
  socket.on('complain:new', (data) => {
    if (data.status === 'pending') {
      pendingCount.value++
    }
  })

  socket.on('complain:updated', (data) => {
    if (data.status === 'pending') {
      pendingCount.value++
    } else {
      pendingCount.value = Math.max(pendingCount.value - 1, 0)
    }
  })

  socket.on('complain:deleted', () => {
    pendingCount.value = Math.max(pendingCount.value - 1, 0)
  })
})
</script>

<style scoped>
/* ===============================
   VARIABLES
================================ */
.sidebar {
  --sb-width: 250px;
  --sb-brand: #6cbb00;
  --sb-bg-1: #1d2533;
  --sb-bg: #1f2937;
  --sb-bg-soft: #2b3548;
  --sb-bg-2: #3a4459;
  --sb-text: #e3e8f1;
  --sb-text-dim: #9aa6bb;
  --sb-active: #ffffff;
  --sb-accent: #9fe22f;
  --sb-accent-2: #6cbb00;
  --sb-accent-soft: rgba(159, 226, 47, 0.14);
  --sb-border: rgba(255, 255, 255, 0.08);
  --sb-danger: #ef4444;
  --sb-teal: #1fa5bd;
  --sb-gear: #8fd0ee;
}

/* ===============================
   CONTAINER
================================ */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  width: var(--sb-width);
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, var(--sb-bg-1) 0%, var(--sb-bg) 45%, var(--sb-bg-2) 100%);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.22);
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1050;
  overflow: hidden;
}

.sidebar.open {
  transform: translateX(0);
}

/* ===============================
   BRAND BLOCK
================================ */
.sidebar-brand {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0 1rem;
  background: var(--sb-brand);
  color: #fff;
}

.brand-logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-text {
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

/* ===============================
   SCROLL BODY
================================ */
.sidebar-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 1.5rem;
}

.sidebar-body::-webkit-scrollbar {
  width: 6px;
}
.sidebar-body::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-body::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.14);
  border-radius: 999px;
}
.sidebar-body::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.26);
}

/* ===============================
   TOP ROW: Dashboard | gear
================================ */
.sb-top {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem 0.7rem 1.1rem;
}

.sb-dashboard {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: var(--sb-text);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}
.sb-dashboard i {
  font-size: 1rem;
}
.sb-dashboard:hover,
.sb-dashboard.active {
  color: #fff;
}

.sb-divider {
  width: 1px;
  height: 28px;
  margin: 0 0.9rem;
  background: rgba(255, 255, 255, 0.2);
}

.sb-gear {
  color: var(--sb-gear);
  font-size: 1.2rem;
  line-height: 1;
  transition: transform 0.3s ease, color 0.2s ease;
}
.sb-gear:hover {
  color: #fff;
  transform: rotate(60deg);
}

/* ===============================
   SEARCH
================================ */
.sb-search {
  display: flex;
  margin: 0 5px 0.55rem;
}

.sb-search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: #fff;
  color: #1f2937;
  font-size: 0.85rem;
  padding: 0.38rem 0.6rem;
  border-radius: 0.25rem 0 0 0.25rem;
}
.sb-search-input::placeholder {
  color: #9ca3af;
}

.sb-search-btn {
  width: 34px;
  border: 0;
  border-left: 1px solid #e5e7eb;
  background: #fff;
  color: #1f2937;
  border-radius: 0 0.25rem 0.25rem 0;
  font-size: 0.8rem;
  cursor: pointer;
}
.sb-search-btn:hover {
  background: #f3f4f6;
}

/* ===============================
   MANUAL LINK
================================ */
.manual-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 1.1rem 0.5rem;
  color: var(--sb-teal);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}
.manual-link:hover {
  color: #3cc8e0;
}

/* ===============================
   NAV WRAPPER
================================ */
.nav {
  display: flex;
  flex-direction: column;
  padding: 0.35rem 5px 0.5rem;
  gap: 0.3rem;
}

/* ===============================
   NAV LINKS (top level)
================================ */
.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  color: var(--sb-text);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  border-radius: 0.3rem;
  padding: 0.5rem 0.6rem;
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.15s ease;
  user-select: none;
  text-decoration: none;
}

/* garis hijau di kiri tiap menu utama */
.nav-link-toggle,
.nav-link.nav-top {
  cursor: pointer;
  border-left: 3px solid var(--sb-accent);
  border-radius: 3px 6px 6px 3px;
  padding-left: 0.7rem;
}

.nav-text {
  flex: 1;
  min-width: 0;
}

.nav-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--sb-accent);
  font-size: 1rem;
  margin-right: 0.6rem;
  flex-shrink: 0;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: var(--sb-active);
}

.nav-link.active {
  background: var(--sb-accent-soft);
  color: var(--sb-active);
}

/* Caret: chevron-left, berputar jadi panah bawah saat terbuka */
.caret-icon {
  font-size: 0.7rem;
  color: var(--sb-text-dim);
  transition: transform 0.25s ease, color 0.2s ease;
  flex-shrink: 0;
  margin-left: 0.4rem;
}
.caret-icon.caret-open {
  transform: rotate(-90deg);
}
.nav-link:hover .caret-icon,
.nav-link.active .caret-icon {
  color: var(--sb-text);
}

/* ===============================
   NAV GROUP
================================ */
.nav-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.1rem;
}

/* ===============================
   SUBMENU (2 level: grup utama > sub-grup > menu)
================================ */
.submenu {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  margin: 0.25rem 0 0.45rem 1.05rem;
  padding: 0 0 0 0.55rem;
  border-left: 2px solid rgba(159, 226, 47, 0.4);
}

/* sub-grup (Ekspedisi, ERP, IT, dst.) */
.nav-group--sub {
  margin-bottom: 0;
}
.nav-group--sub > .submenu {
  margin: 0.1rem 0 0.35rem 0.85rem;
  padding-left: 0.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
}

.sub-link,
.nav-group--sub > .nav-link-toggle {
  min-height: 2.1rem;
  display: flex;
  align-items: center;
  font-size: 0.83rem;
  letter-spacing: 0;
  text-transform: none;
  padding: 0.4rem 0.6rem;
  border-radius: 0.45rem;
}

.sub-link {
  font-weight: 600;
  color: rgba(238, 241, 248, 0.82);
}
.nav-group--sub .sub-link {
  font-size: 0.8rem;
}

.nav-group--sub > .nav-link-toggle {
  border-left: 0;
  font-weight: 700;
  color: var(--sb-text);
}
.nav-group--sub > .nav-link-toggle .nav-icon {
  width: 1.15rem;
  height: auto;
  margin-right: 0.6rem;
  font-size: 0.9rem;
}

.sub-icon {
  font-size: 0.86rem;
  width: 1.15rem;
  text-align: center;
  margin-right: 0.6rem;
  color: rgba(238, 241, 248, 0.6);
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.sub-link:hover {
  color: var(--sb-active);
  background-color: rgba(255, 255, 255, 0.05);
}
.sub-link:hover .sub-icon {
  color: #fff;
}

.sub-link.active {
  color: var(--sb-active);
  background-color: var(--sb-accent-soft);
  font-weight: 700;
}
.sub-link.active .sub-icon {
  color: var(--sb-accent);
}

.submenu-divider {
  height: 1px;
  margin: 0.45rem 0.4rem;
  background: var(--sb-border);
}

.submenu-enter-active,
.submenu-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ===============================
   SECTION TITLE (Cleaning, Car Booking)
================================ */
.sidebar-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0.4rem 6px;
  color: #8a97ad;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.1px;
  text-transform: uppercase;
}
.sidebar-section-title::before {
  content: '';
  width: 3px;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(180deg, var(--sb-accent), var(--sb-accent-2));
}
.sidebar-section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

/* ===============================
   SEARCH STATE
================================ */
.search-hidden {
  display: none !important;
}
.sidebar.searching .submenu {
  display: flex !important;
}
.sidebar.searching .submenu-divider,
.sidebar.searching .sidebar-section-title {
  display: none;
}

/* ===============================
   FOOTER
================================ */
.sb-footer {
  margin: 1rem 5px 0;
  padding: 0.9rem 0.8rem 1rem;
  color: var(--sb-text);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

/* ===============================
   BADGE
================================ */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
  font-weight: 800;
  font-size: 0.68rem;
  padding: 0.18em 0.5em;
  line-height: 1.3;
  background: linear-gradient(135deg, #ff5c5c, var(--sb-danger));
  color: white;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
  user-select: none;
  transition: transform 0.15s ease;
}
.badge-inline {
  margin-left: auto;
}
.nav-link:hover .badge {
  transform: scale(1.08);
}
</style>