<template>
  <!-- <aside :class="['sidebar', isOpen ? 'open' : '']" @click.self="closeSidebarOnMobile"> -->
    <aside :class="['sidebar', { open: isOpen }]" @click.self="closeSidebarOnMobile">

    <nav class="nav flex-column pt-4 ps-3">

      <router-link
  v-if="canAccess('dashboard')"
  to="/dashboard"
  class="nav-link d-flex align-items-center mb-2"
  active-class="active"
>
  <i class="bi bi-speedometer2 me-2"></i> Dashboard
</router-link>

      <!-- Dropdown UAC -->
<div v-if="hasUACAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="toggleUACDropdown"
    :class="{ active: isUACOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-person-check me-2"></i>
    UAC
    <i
      class="bi"
      :class="isUACOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isUACOpen" class="ps-3">
    <router-link
      v-if="canAccess('pages')"
      to="/pages"
      class="nav-link mb-1"
      active-class="active"
    >
      Pages Web
    </router-link>

    <router-link
      v-if="canAccess('userpageaccess')"
      to="/userpageaccess"
      class="nav-link mb-1"
      active-class="active"
    >
      User Access Pages
    </router-link>
  </div>
</div>


      <!-- Dropdown Suratjalan -->
       <div v-if="hasEkspedisiAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="toggleSuratjalanDropdown"
    :class="{ active: isSuratjalanOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-truck me-2"></i>
    Ekspedisi
    <i
      class="bi ms-auto"
      :class="isSuratjalanOpen ? 'bi-caret-down-fill' : 'bi-caret-right-fill'"
    ></i>
  </a>

  <div v-show="isSuratjalanOpen" class="ps-3">
    <router-link v-if="canAccess('suratjalan')" to="/suratjalan" class="nav-link mb-1" active-class="active">
      Surat Jalan
    </router-link>

    <router-link v-if="canAccess('suratmaker')" to="/suratmaker" class="nav-link mb-1" active-class="active">
      Surat Maker
    </router-link>
    
    <router-link v-if="canAccess('po_eks')" to="/view_poeks" class="nav-link mb-1" active-class="active">
      PO EXPDC
    </router-link>

    <router-link v-if="canAccess('hasilscanekspedisi')" to="/hasilscanekspedisi" class="nav-link mb-1" active-class="active">
      Hasil Scan Ekspedisi
    </router-link>

    <router-link v-if="canAccess('dailyoutput')" to="/dailyoutput" class="nav-link mb-1" active-class="active">
      Daily Output
    </router-link>

    <router-link v-if="canAccess('warehouse')" to="/warehouse" class="nav-link mb-1" active-class="active">
      Laporan Terima
    </router-link>

    <!-- <router-link v-if="canAccess('inputanacc')" to="/inputanacc" class="nav-link mb-1" active-class="active">
      Inputan Laporan Terima
    </router-link> -->
  </div>
</div>


      <!-- Dropdown IDP PO -->
      <div v-if="hasIdpPoAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="toggleIdpPoDropdown"
    :class="{ active: isIdpPoOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-collection-fill me-2"></i>
    IDP Jatuh Tempo
    <i
      class="bi"
      :class="isIdpPoOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isIdpPoOpen" class="ps-3">
    <router-link
      v-if="canAccess('idppo')"
      to="/idppo"
      class="nav-link mb-1"
      active-class="active"
    >
      Daftar IDP JT
    </router-link>
  </div>
</div>


      <!-- Dropdown ERP -->
      <div v-if="hasErpAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2 position-relative"
    @click.prevent="toggleComplainDropdown"
    :class="{ active: isComplainOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-file-earmark-text me-2"></i>
    ERP
    <i
      class="bi"
      :class="isComplainOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>

    <!-- Badge -->
    <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
  </a>

  <div v-show="isComplainOpen" class="ps-3">

    <router-link
      v-if="canAccess('complain/status')"
      to="/complain/status"
      class="nav-link mb-1"
      active-class="active"
    >
      Complain Pending
      <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
    </router-link>

    <router-link
      v-if="canAccess('complain')"
      to="/complain"
      class="nav-link mb-1"
      active-class="active"
    >
      All Complain
    </router-link>

  </div>
</div>



        <!------  USER LIST  ------->
        <router-link v-if="canAccess('user')"
        to="/user"
        class="nav-link d-flex align-items-center mb-2"
        active-class="active"
        exact
      >
        <i class="bi bi-people me-2"></i> Daftar User
      </router-link>
      


      <!-- Dropdown General Affair -->
<div v-if="hasGeneralAffairAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="toggleBuildingDropdown"
    :class="{ active: isBuildingOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-building-fill me-2"></i>
    General Affair
    <i
      class="bi"
      :class="isBuildingOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isBuildingOpen" class="ps-3">
    <router-link
      v-if="canAccess('building')"
      to="/building"
      class="nav-link mb-1"
      active-class="active"
    >
      Building Maintenance
    </router-link>
    <hr>
    <router-link
      v-if="canAccess('categories-lapkebersihan')"
      to="/categories-lapkebersihan"
      class="nav-link mb-1"
      active-class="active"
    >
      Kategori Cleaning
    </router-link>
    <router-link
      v-if="canAccess('question-lapkebersihan')"
      to="/question-lapkebersihan"
      class="nav-link mb-1"
      active-class="active"
    >
      Question Cleaning
    </router-link>
    <router-link
      v-if="canAccess('report-lapkebersihan')"
      to="/report-lapkebersihan"
      class="nav-link mb-1"
      active-class="active"
    >
      Report Cleaning
    </router-link>
  </div>
</div>


<!-- Dropdown IT -->
<div v-if="hasITAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="toggleBarangITDropdown"
    :class="{ active: isBarangITOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-pc-display-horizontal me-2"></i>
    IT
    <i
      class="bi"
      :class="isBarangITOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isBarangITOpen" class="ps-3">

    <router-link
      v-if="canAccess('barangit')"
      to="/barangit"
      class="nav-link mb-1"
      active-class="active"
    >
      Barang IT
    </router-link>

    <router-link
      v-if="canAccess('riwayat-pesanan-it')"
      to="/riwayat-pesananan-it"
      class="nav-link mb-1"
      active-class="active"
    >
      Pesanan Barang IT
    </router-link>

    <hr>

    <router-link
      v-if="canAccess('komplainit')"
      to="/komplainit"
      class="nav-link mb-1"
      active-class="active"
    >
      Komplain IT
    </router-link>

    <router-link
      v-if="canAccess('barcoderequest')"
      to="/barcoderequest"
      class="nav-link mb-1"
      active-class="active"
    >
      Permintaan Barcode
    </router-link>

    <hr>

    <router-link
      v-if="canAccess('komputer')"
      to="/komputer"
      class="nav-link mb-1"
      active-class="active"
    >
      Daftar komputer
    </router-link>

    <router-link
      v-if="canAccess('planningerp')"
      to="/planningerp"
      class="nav-link mb-1"
      active-class="active"
    >
      Planning ERP
    </router-link>

  </div>
</div>


<!-- Dropdown Gudang Barang -->
<div v-if="hasGudangAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="toggleGudangBDropdown"
    :class="{ active: isGudangBOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-houses-fill me-2"></i>
    Gudang Barang
    <i
      class="bi"
      :class="isGudangBOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isGudangBOpen" class="ps-3">
    <router-link
      v-if="canAccess('inventaris-gudang')"
      to="/item-masuk"
      class="nav-link mb-1"
      active-class="active"
    >
      Inventory Gudang
    </router-link>
  </div>
</div>


<!-- Dropdown HRD -->
<div v-if="hasHRDAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="toggleLokerDropdown"
    :class="{ active: isLokerOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-person-lines-fill me-2"></i>
    HRD
    <i
      class="bi"
      :class="isLokerOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isLokerOpen" class="ps-3">

    <router-link
      v-if="canAccess('loker')"
      to="/loker"
      class="nav-link mb-1"
      active-class="active"
    >
      Daftar Loker
    </router-link>

    <router-link
      v-if="canAccess('daftar-pelamar')"
      to="/daftar-pelamar"
      class="nav-link mb-1"
      active-class="active"
    >
      Daftar Pelamar
    </router-link>

    <router-link
      v-if="canAccess('contact-messages')"
      to="/contact-messages"
      class="nav-link mb-1"
      active-class="active"
    >
      Contact Message
    </router-link>

    <router-link
      v-if="canAccess('blog-rekrutmen')"
      to="/blog-rekrutmen"
      class="nav-link mb-1"
      active-class="active"
    >
      Blog Rekrutmen
    </router-link>

    <router-link
      v-if="canAccess('gallery-rekrutmen')"
      to="/gallery-rekrutmen"
      class="nav-link mb-1"
      active-class="active"
    >
      Gallery
    </router-link>
    <router-link v-if="canAccess('pkwtandtt')"
      to="/pkwtandtt"
      class="nav-link mb-1"
      active-class="active">
       Pkwtandtt
    </router-link>

  </div>
</div>



<!-- Dropdown Target -->
<div v-if="hasTargetAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="toggleTargetDropdown"
    :class="{ active: isTargetOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-easel2 me-2"></i>
    Target
    <i
      class="bi"
      :class="isTargetOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isTargetOpen" class="ps-3">

    <!-- <router-link
      v-if="canAccess('target')"
      to="/target"
      class="nav-link mb-1"
      active-class="active"
    >
      Laporan Target TLSI
    </router-link> -->

    <router-link
      v-if="canAccess('target-finishing')"
      to="/target-finishing"
      class="nav-link mb-1"
      active-class="active"
    >
      Hasil Piece Work
    </router-link>

    <router-link
      v-if="canAccess('scan-barcode-detail')"
      to="/scan-barcode-detail"
      class="nav-link mb-1"
      active-class="active"
    >
      Scan Barcode Detail
    </router-link>

    <!-- <router-link
      v-if="canAccess('getprod4a')"
      to="/getprod4a"
      class="nav-link mb-1"
      active-class="active"
    >
      Laporan Prod4
    </router-link> -->

    <router-link
      v-if="canAccess('persen-target')"
      to="/persen-target"
      class="nav-link mb-1"
      active-class="active"
    >
      Persen Target day
    </router-link>

    <!-- <router-link
      v-if="canAccess('linking-pergedung')"
      to="/linking-pergedung"
      class="nav-link mb-1"
      active-class="active"
    >
      Target Linking Pergedung
    </router-link> -->

    <router-link
      v-if="canAccess('target/lining')"
      to="/target/lining"
      class="nav-link mb-1"
      active-class="active"
    >
      IDP Linning
    </router-link>

    <router-link
      v-if="canAccess('knittingmatchreport')"
      to="/knittingMatchReport"
      class="nav-link mb-1"
      active-class="active"
    >
      Pannel Matching Controll (Lining)
    </router-link>

  </div>
</div>


<!-- Dropdown FCO -->
<div v-if="hasFCOAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="togglePkbBDropdown"
    :class="{ active: isPkbBOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-person-workspace me-2"></i>
    FCO
    <i
      class="bi"
      :class="isPkbBOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isPkbBOpen" class="ps-3">

    <router-link
      v-if="canAccess('filepkb')"
      to="/filepkb"
      class="nav-link mb-1"
      active-class="active"
    >
      File PKB
    </router-link>

    <router-link
      v-if="canAccess('visitor-pkb')"
      to="/visitor-pkb"
      class="nav-link mb-1"
      active-class="active"
    >
      Visitor PKB
    </router-link>

    <router-link
      v-if="canAccess('form-fco')"
      to="/form-fco"
      class="nav-link mb-1"
      active-class="active"
    >
      Form Fco
    </router-link>

    <hr>

    <router-link
      v-if="canAccess('apar-question')"
      to="/apar-question"
      class="nav-link mb-1"
      active-class="active"
    >
      APAR Quest
    </router-link>

    <router-link
      v-if="canAccess('apar')"
      to="/apar"
      class="nav-link mb-1"
      active-class="active"
    >
      APAR List
    </router-link>

    <router-link
      v-if="canAccess('fco/apar-check')"
      to="/fco/apar-check"
      class="nav-link mb-1"
      active-class="active"
    >
      APAR Checklist
    </router-link>

    <router-link
      v-if="canAccess('fco/apar-rekap')"
      to="/fco/apar-rekap"
      class="nav-link mb-1"
      active-class="active"
    >
      APAR Rekap
    </router-link>

  </div>
</div>


      <div v-if="user?.dept && ['it', 'security'].includes(user.dept.toLowerCase().trim())">
        <a
          href="#"
          class="nav-link d-flex align-items-center mb-2"
          @click.prevent="toggleBukuTamuDropdown"
          :class="{ active: isBukuTamuOpen }"
          style="cursor:pointer;"
        >
          <i class="bi bi-journal-bookmark-fill me-2"></i>
          Buku Tamu
          <i
            class="bi"
            :class="isBukuTamuOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
          ></i>
        </a>

        <div v-show="isBukuTamuOpen" class="ps-3">
          <router-link
            to="/buku-tamu"
            class="nav-link mb-1"
            active-class="active"
          >
            Buku Tamu
          </router-link>
        </div>
      </div>


      <!-- Dropdown PRODUCTION ERP -->
<div v-if="hasProductionERPAccess">
  <a
    href="#"
    class="nav-link d-flex align-items-center mb-2"
    @click.prevent="togglePERPDropdown"
    :class="{ active: isPERPOpen }"
    style="cursor:pointer;"
  >
    <i class="bi bi-kanban me-2"></i>
     Production 
    <i
      class="bi"
      :class="isPERPOpen ? 'bi-caret-down-fill ms-auto' : 'bi-caret-right-fill ms-auto'"
    ></i>
  </a>

  <div v-show="isPERPOpen" class="ps-3">
    <router-link
      v-if="canAccess('linking-pergedung')"
      to="/linking-pergedung"
      class="nav-link mb-1"
      active-class="active"
    >
      Report Linking
    </router-link>

    <router-link
      v-if="canAccess('finishing-pergedung')"
      to="/finishing-pergedung"
      class="nav-link mb-1"
      active-class="active"
    >
      Report Finishing
    </router-link>

    <router-link
      v-if="canAccess('plan_ppc')"
      to="/plan_ppc"
      class="nav-link mb-1"
      active-class="active"
    >
      Planning Target
    </router-link>

    <router-link
      v-if="canAccess('hasilperbaikandantolakan')"
      to="/hasilperbaikandantolakan"
      class="nav-link mb-1"
      active-class="active"
    >
      Retur Tolakan & H/Perbaikan
    </router-link>

  </div>
</div>


    </nav>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
   ACCESS CHECK (MENU GUARD)
================================ */
function canAccess(code) {
  //return pages.value.includes(code)
  return pages.value.includes(code.toLowerCase());
}

const hasUACAccess = computed(() => {
  return (
    canAccess('pages') ||
    canAccess('userpageaccess')
  )
})

const hasUserAccess = computed(() => {
  return canAccess('user');
});


// Logic: Jika user punya salah satu akses dari list di bawah, maka dropdown Ekspedisi muncul
const hasEkspedisiAccess = computed(() => {
  const daftarMenuEkspedisi = [
    'suratjalan',
    'suratmaker',
    'hasilscanekspedisi',
    'dailyoutput',
    'warehouse',
    'inputanacc',
    'po_eks'
  ];
  // return true jika salah satu item dalam daftarMenuEkspedisi ada di dalam pages.value
  return daftarMenuEkspedisi.some(menu => pages.value.includes(menu.toLowerCase()));
});

const hasIdpPoAccess = computed(() => {
  const daftarMenuIdp = [
    'idppo'
  ]
  return daftarMenuIdp.some(menu =>
    pages.value.includes(menu.toLowerCase())
  )
})

const hasErpAccess = computed(() => {
  const daftarMenuErp = [
    'complain/status',
    'complain'
  ]
  return daftarMenuErp.some(menu =>
    pages.value.includes(menu.toLowerCase())
  )
})
const hasGeneralAffairAccess = computed(() => {
  const daftarMenuGA = [
    'building',
    'question-lapkebersihan',
    'categories-lapkebersihan',
    'report-lapkebersihan'
  ]
  return daftarMenuGA.some(menu =>
    pages.value.includes(menu.toLowerCase())
  )
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
  return daftarMenuIT.some(menu =>
    pages.value.includes(menu.toLowerCase())
  )
})

const hasGudangAccess = computed(() => {
  const daftarMenuGudang = [
    'gudang',
    'p-gudang',
    'inventaris-gudang'
  ]
  return daftarMenuGudang.some(menu =>
    pages.value.includes(menu.toLowerCase())
  )
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
  return daftarMenuHRD.some(menu =>
    pages.value.includes(menu.toLowerCase())
  )
})

const hasTargetAccess = computed(() => {
  const daftarMenuTarget = [
    'target',
    'target-finishing',
    'scan-barcode-detail',
    // 'getprod4a',
    'target/lining',
    'knittingmatchreport',
    'persen-target',
  ]
  return daftarMenuTarget.some(menu =>
    pages.value.includes(menu.toLowerCase())
  )
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
  return daftarMenuFCO.some(menu =>
    pages.value.includes(menu.toLowerCase())
  )
})

const hasProductionERPAccess = computed(() => {
  const daftarPERPmenu = [
    'linking-pergedung',
    'finishing-pergedung',
    'plan_ppc',
    'hasilperbaikandantolakan'
  ]
  return daftarPERPmenu.some(menu => pages.value.includes(menu.toLowerCase())
)
})


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

  // DEBUG (boleh hapus kalau sudah yakin)
  // console.log('USER:', user.value)
  // console.log('PAGES:', pages.value)

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
   ROOT VARIABLES
================================ */
.sidebar {
  --sb-bg: #101828;
  --sb-bg-soft: #16213a;
  /* --sb-text: #ffffff;
  --sb-text-dim: #7c8aa5; */
  --sb-text: #FFFFFF;
  --sb-text-dim: #FFFFFF;
  --sb-active: #ffffff;
  --sb-accent: #4f7cff;
  --sb-accent-soft: rgba(79, 124, 255, 0.16);
  --sb-border: rgba(255, 255, 255, 0.06);
}

/* ===============================
   SIDEBAR CONTAINER
================================ */
.sidebar {
  position: fixed;
  top: 56px; /* di bawah header */
  left: 0;
  height: calc(100vh - 56px);
  width: 17rem;
  background: linear-gradient(180deg, var(--sb-bg) 0%, var(--sb-bg-soft) 100%);
  box-shadow: 4px 0 24px rgb(0 0 0 / 0.18);
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1050;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 2rem;
}

.sidebar.open {
  transform: translateX(0);
}

/* Custom slim scrollbar */
.sidebar::-webkit-scrollbar {
  width: 6px;
}
.sidebar::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}
.sidebar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.22);
}

/* ===============================
   NAV WRAPPER
================================ */
.nav {
  padding-left: 0.75rem !important;
  padding-right: 0.75rem;
  padding-top: 1.25rem !important;
  gap: 0.15rem;
}

/* ===============================
   NAV LINKS (top level)
================================ */
.nav-link {
  position: relative;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 0.92rem;
  letter-spacing: 0.01em;
  border-radius: 0.6rem;
  padding: 0.6rem 0.75rem;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;
  user-select: none;
  padding-right: 2.5rem;
}

.nav-link i.bi:first-child {
  font-size: 1.05rem;
  width: 1.35rem;
  text-align: center;
  color: #FFFFFF;
  transition: color 0.2s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.06);
  color: var(--sb-active);
  transform: translateX(2px);
}

.nav-link:hover i.bi:first-child {
  color: var(--sb-active);
}

.nav-link.active {
  background-color: var(--sb-accent-soft);
  color: var(--sb-active);
  font-weight: 600;
}

.nav-link.active i.bi:first-child {
  color: var(--sb-accent);
}

/* Active left accent bar */
.nav-link.active::before {
  content: '';
  position: absolute;
  left: -0.75rem;
  top: 0.35rem;
  bottom: 0.35rem;
  width: 3px;
  border-radius: 0 4px 4px 0;
  background: var(--sb-accent);
}

/* Caret icons */
.nav-link .bi-caret-down-fill,
.nav-link .bi-caret-right-fill {
  font-size: 0.7rem;
  color: #FFFFFF;
  transition: transform 0.2s ease, color 0.2s ease;
}

.nav-link:hover .bi-caret-down-fill,
.nav-link:hover .bi-caret-right-fill,
.nav-link.active .bi-caret-down-fill,
.nav-link.active .bi-caret-right-fill {
  color: var(--sb-text);
}

/* ===============================
   SUBMENU (dropdown content)
================================ */
.ps-3 {
  position: relative;
  margin-left: 0.9rem;
  padding-left: 0.75rem !important;
  border-left: 1px solid var(--sb-border);
}

.ps-3 .nav-link {
  font-size: 0.86rem;
  font-weight: 700;
  padding: 0.5rem 0.75rem;
  color: #FFFFFF;
}

.ps-3 .nav-link:hover {
  color: var(--sb-active);
  background-color: rgba(255, 255, 255, 0.05);
}

.ps-3 .nav-link.active {
  color: var(--sb-active);
  background-color: var(--sb-accent-soft);
}

.ps-3 hr {
  border-color: var(--sb-border);
  opacity: 1;
  margin: 0.5rem 0;
}

/* ===============================
   BADGE (notif counter)
================================ */
.badge {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  z-index: 1100;
  font-weight: 700;
  font-size: 0.7rem;
  padding: 0.2em 0.5em;
  line-height: 1;
  background-color: #ef4444;
  color: white;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
  user-select: none;
  box-shadow: 0 0 0 3px var(--sb-bg);
  transition: transform 0.15s ease;
}

.nav-link:hover .badge {
  transform: translateY(-50%) scale(1.1);
}

/* ===============================
   RESPONSIVE
================================ */
@media (min-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
}
</style>