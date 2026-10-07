<template>
  <div class="db-page d-flex flex-column min-vh-100 position-relative overflow-hidden">
    <!-- Header tetap di atas -->
    <Header
      :user="user"
      :sidebar-open="sidebarOpen"
      @toggle-sidebar="toggleSidebar"
      @logout="logout"
    />

    <div class="d-flex flex-grow-1 position-relative">
      <!-- Sidebar di kiri (fixed) -->
      <Sidebar :isOpen="sidebarOpen" />

      <!-- Content wrapper: Main + Footer, bergeser saat sidebar terbuka di layar lebar -->
      <div
        class="db-wrap flex-grow-1 d-flex flex-column justify-content-between min-vh-100"
        :class="{ 'db-wrap--shift': sidebarOpen && windowWidth >= 768 }"
      >
        <main v-if="authorized" class="p-3 p-md-4 flex-grow-1">
          <!-- ===============================
               PINTASAN MENU (sama dengan menu di sidebar)
          ================================ -->
          <ul class="sc-grid list-unstyled mb-0" aria-label="Pintasan menu">
            <li v-for="g in visibleGroups" :key="g.key" class="sc-item">
              <button
                type="button"
                class="sc-card"
                :class="{ 'sc-card--open': openKey === g.key }"
                :aria-expanded="openKey === g.key"
                aria-haspopup="true"
                @click="toggleGroup(g.key)"
              >
                <span class="sc-icon" aria-hidden="true"><i class="bi" :class="g.icon"></i></span>
                <span class="sc-text">
                  <span class="sc-title" :title="g.title">{{ g.title }}</span>
                  <span class="sc-sub">{{ g.groups.length }} kelompok · {{ g.count }} menu</span>
                </span>
                <span class="sc-chev" aria-hidden="true"><i class="bi bi-chevron-down"></i></span>
              </button>

              <transition name="sc-pop">
                <div v-show="openKey === g.key" class="sc-panel" role="menu">
                  <template v-for="(grp, gi) in g.groups" :key="grp.key">
                    <hr v-if="gi > 0" class="sc-hr" />
                    <p v-if="!grp.flat" class="sc-sec">{{ grp.title }}</p>

                    <template v-for="(sec, si) in grp.sections" :key="si">
                      <p v-if="sec.title" class="sc-sec sc-sec--sub">{{ sec.title }}</p>
                      <hr v-else-if="si > 0" class="sc-hr sc-hr--soft" />
                      <router-link
                        v-for="it in sec.items"
                        :key="it.code || it.to"
                        :to="it.to"
                        class="sc-link"
                        role="menuitem"
                        @click="openKey = null"
                      >
                        <i class="bi" :class="it.icon" aria-hidden="true"></i>
                        <span>{{ it.label }}</span>
                      </router-link>
                    </template>
                  </template>
                </div>
              </transition>
            </li>
          </ul>

          <!-- ===============================
               INFO / KONTAK DEVELOPER
          ================================ -->
          <section class="db-notice">
            <p class="db-notice__text">
              <i class="bi bi-bug-fill" aria-hidden="true"></i>
              Apabila menemukan bug/error, ingin meminta manual penggunaan aplikasi, atau ingin
              memberikan saran terhadap web ini, silakan hubungi developer:
            </p>
            <a :href="CONTACT_LINK" class="db-notice__btn">
              <i class="bi bi-envelope-fill" aria-hidden="true"></i>Contact Us
            </a>
          </section>

          <!-- ===============================
               LOGOUT
          ================================ -->
          <div class="db-logout">
            <button type="button" class="db-logout__btn" :disabled="loggingOut" @click="logout">
              <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>{{ loggingOut ? 'Memproses…' : 'Logout' }}
            </button>
            <!-- Pesan lewat {{ }} (di-escape Vue). Jangan pakai v-html. -->
            <p v-if="logoutError" class="db-logout__err" role="alert">{{ logoutError }}</p>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

import Header from '../components/Header.vue'
import Sidebar from '../components/Sidebar.vue'
import Footer from '../components/Footer.vue'

// import api from '../api.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// TODO: ganti dengan link kontak developer (mis. 'mailto:dev@perusahaan.com' atau route form kontak)
const CONTACT_LINK = '#'

const router = useRouter()

/* ===============================
   SESI (dibaca sekali, sebelum render pertama,
   supaya tidak ada "loncatan" layout setelah mount)
================================ */
function readSession() {
  try {
    const rawUser = localStorage.getItem('user')
    const rawPages = localStorage.getItem('pages')
    if (!rawUser || !rawPages) return null

    const parsedUser = JSON.parse(rawUser)
    const parsedPages = JSON.parse(rawPages)
    const u = parsedUser?.user ?? parsedUser

    if (!u || typeof u !== 'object' || !Array.isArray(parsedPages)) return null

    return {
      user: { name: '', nopegawai: '', dept: '', ...u },
      pages: parsedPages.filter((p) => typeof p === 'string')
    }
  } catch {
    // localStorage rusak / tidak bisa diakses: anggap belum login
    return null
  }
}

const session = readSession()

const user = ref(session?.user ?? { name: '', nopegawai: '', dept: '' })
const pages = ref(session?.pages ?? [])

// CATATAN: pengecekan ini hanya untuk UX di sisi browser. Hak akses yang sebenarnya
// HARUS diperiksa di server pada setiap endpoint.
const authorized = !!session && pages.value.includes('dashboard')

/* ===============================
   PINTASAN MENU
   Isi menu & pengelompokan SAMA dengan Sidebar.vue (kode akses, route, ikon, label).
   Kalau menu di Sidebar berubah, ubah juga daftar ini.
================================ */
const pageSet = computed(() => new Set(pages.value.map((p) => p.toLowerCase())))

function canAccess(code) {
  return pageSet.value.has(String(code).toLowerCase())
}

// helper pembuat item: L(label, route, ikon, kode akses)
const L = (label, to, icon, code) => ({ label, to, icon: `bi-${icon}`, code })

// Sub-grup (sama dengan dropdown di dalam Sidebar)
const GRP_EKSPEDISI = {
  key: 'ekspedisi',
  title: 'Ekspedisi',
  sections: [
    {
      items: [
        L('Surat Jalan', '/suratjalan', 'file-earmark-arrow-up', 'suratjalan'),
        L('Surat Maker', '/suratmaker', 'pencil-square', 'suratmaker'),
        L('PO EXPDC', '/view_poeks', 'receipt', 'po_eks'),
        L('Hasil Scan Ekspedisi', '/hasilscanekspedisi', 'upc-scan', 'hasilscanekspedisi'),
        L('Daily Output', '/dailyoutput', 'graph-up', 'dailyoutput'),
        L('Laporan Terima', '/warehouse', 'clipboard-check', 'warehouse')
      ]
    }
  ]
}

const GRP_IDPPO = {
  key: 'idppo',
  title: 'IDP Jatuh Tempo',
  sections: [{ items: [L('Daftar IDP JT', '/idppo', 'calendar2-week', 'idppo')] }]
}

const GRP_ERP = {
  key: 'erp',
  title: 'ERP',
  sections: [
    {
      items: [
        L('Complain Pending', '/complain/status', 'hourglass-split', 'complain/status'),
        L('All Complain', '/complain', 'chat-left-text', 'complain')
      ]
    }
  ]
}

const GRP_TARGET = {
  key: 'target',
  title: 'Target',
  sections: [
    {
      items: [
        L('Hasil Piece Work', '/target-finishing', 'bar-chart', 'target-finishing'),
        L('Scan Barcode Detail', '/scan-barcode-detail', 'upc-scan', 'scan-barcode-detail'),
        L('Persen Target day', '/persen-target', 'percent', 'persen-target'),
        L('IDP Linning', '/target/lining', 'diagram-2', 'target/lining'),
        L('Pannel Matching Controll (Lining)', '/knittingMatchReport', 'grid-3x3', 'knittingmatchreport')
      ]
    }
  ]
}

const GRP_PPC = {
  key: 'ppc',
  title: 'PPC',
  sections: [{ items: [L('Planning TV 1', '/planningerp', 'diagram-3', 'planningerp')] }]
}

const GRP_PRODUCTION = {
  key: 'production',
  title: 'Production',
  sections: [
    {
      items: [
        L('Report Linking', '/linking-pergedung', 'diagram-3', 'linking-pergedung'),
        L('Report Finishing', '/finishing-pergedung', 'check2-all', 'finishing-pergedung'),
        L('Planning Target', '/plan_ppc', 'calendar3', 'plan_ppc'),
        L('Retur Tolakan & H/Perbaikan', '/hasilperbaikandantolakan', 'arrow-repeat', 'hasilperbaikandantolakan')
      ]
    }
  ]
}

const GRP_GA = {
  key: 'ga',
  title: 'General Affair',
  sections: [
    { items: [L('Building Maintenance', '/building', 'tools', 'building')] },
    {
      title: 'Cleaning',
      items: [
        L('Kategori Cleaning', '/categories-lapkebersihan', 'tags', 'categories-lapkebersihan'),
        L('Question Cleaning', '/question-lapkebersihan', 'question-circle', 'question-lapkebersihan'),
        L('Report Cleaning', '/report-lapkebersihan', 'clipboard-data', 'report-lapkebersihan')
      ]
    },
    {
      title: 'Car Booking',
      items: [
        L('Form Booking Car', '/carbook/booking', 'car-front', 'carbook/booking'),
        L('GA Approval', '/carbook/ga-approval', 'check2-square', 'carbook/ga-approval'),
        L('Finance Approval', '/carbook/finance-approval', 'cash-coin', 'carbook/finance-approval'),
        L('Manager Aproval', '/carbook/manager-approval', 'person-check', 'carbook/manager-approval'),
        L('Laporan Settlement', '/carbook/settlement', 'journal-check', 'carbook/settlement'),
        L('CheckPoint Security', '/carbook/checkpoint-security', 'shield-check', 'carbook/checkpoint-security'),
        L('Mobil Master', '/carbook/master-mobil', 'car-front-fill', 'carbook/master-mobil'),
        L('Servis Mobil', '/carbook/servis', 'wrench-adjustable', 'carbook/servis')
      ]
    }
  ]
}

const GRP_FCO = {
  key: 'fco',
  title: 'FCO',
  sections: [
    {
      items: [
        L('File PKB', '/filepkb', 'folder2-open', 'filepkb'),
        L('Visitor PKB', '/visitor-pkb', 'people', 'visitor-pkb'),
        L('Form Fco', '/form-fco', 'file-earmark-plus', 'form-fco')
      ]
    },
    {
      items: [
        L('APAR Quest', '/apar-question', 'question-diamond', 'apar-question'),
        L('APAR List', '/apar', 'list-check', 'apar'),
        L('APAR Checklist', '/fco/apar-check', 'clipboard2-check', 'fco/apar-check'),
        L('APAR Rekap', '/fco/apar-rekap', 'clipboard2-data', 'fco/apar-rekap')
      ]
    }
  ]
}

const GRP_BUKUTAMU = {
  key: 'bukutamu',
  title: 'Buku Tamu',
  // hanya untuk dept IT & Security (sama seperti di Sidebar)
  visibleIf: (u) => ['it', 'security'].includes(String(u?.dept || '').toLowerCase().trim()),
  sections: [{ items: [{ label: 'Buku Tamu', to: '/buku-tamu', icon: 'bi-journal-bookmark' }] }]
}

const GRP_GUDANG = {
  key: 'gudang',
  title: 'Gudang Barang',
  sections: [{ items: [L('Inventory Gudang', '/item-masuk', 'box-seam', 'inventaris-gudang')] }]
}

const GRP_HRD = {
  key: 'hrd',
  title: 'HRD',
  sections: [
    {
      items: [
        L('Daftar Loker', '/loker', 'briefcase', 'loker'),
        L('Daftar Pelamar', '/daftar-pelamar', 'person-vcard', 'daftar-pelamar'),
        L('Contact Message', '/contact-messages', 'envelope', 'contact-messages'),
        L('Blog Rekrutmen', '/blog-rekrutmen', 'newspaper', 'blog-rekrutmen'),
        L('Gallery', '/gallery-rekrutmen', 'images', 'gallery-rekrutmen'),
        L('Pkwtandtt', '/pkwtandtt', 'file-earmark-text', 'pkwtandtt')
      ]
    }
  ]
}

// flat: true -> judul sub-grup tidak ditampilkan (isinya cuma 1 menu)
const GRP_USER = {
  key: 'user',
  title: 'Daftar User',
  flat: true,
  sections: [{ items: [L('Daftar User', '/user', 'people', 'user')] }]
}

const GRP_UAC = {
  key: 'uac',
  title: 'UAC',
  sections: [
    {
      items: [
        L('Pages Web', '/pages', 'file-earmark-text', 'pages'),
        L('User Access Pages', '/userpageaccess', 'shield-lock', 'userpageaccess')
      ]
    }
  ]
}

const GRP_IT = {
  key: 'it',
  title: 'IT',
  sections: [
    {
      items: [
        L('Barang IT', '/barangit', 'laptop', 'barangit'),
        L('Pesanan Barang IT', '/riwayat-pesananan-it', 'cart', 'riwayat-pesanan-it')
      ]
    },
    {
      items: [
        L('Komplain IT', '/komplainit', 'exclamation-octagon', 'komplainit'),
        L('Permintaan Barcode', '/barcoderequest', 'upc', 'barcoderequest')
      ]
    },
    { items: [L('Daftar komputer', '/komputer', 'pc-display', 'komputer')] }
  ]
}

// Grup utama (kartu di dashboard) — urutan sama dengan Sidebar
const MENU_GROUPS = [
  {
    key: 'production',
    title: 'PRODUCTION',
    icon: 'bi-kanban',
    groups: [GRP_EKSPEDISI, GRP_IDPPO, GRP_ERP, GRP_TARGET, GRP_PPC, GRP_PRODUCTION]
  },
  {
    key: 'operational',
    title: 'OPERATIONAL',
    icon: 'bi-gear-wide-connected',
    groups: [GRP_GA, GRP_FCO, GRP_BUKUTAMU, GRP_GUDANG]
  },
  {
    key: 'employee',
    title: 'EMPLOYEE',
    icon: 'bi-people-fill',
    groups: [GRP_HRD]
  },
  {
    key: 'infotech',
    title: 'INFORMATION TECH',
    icon: 'bi-cpu',
    groups: [GRP_USER, GRP_UAC, GRP_IT]
  }
]

// Hanya tampilkan menu yang boleh diakses user (aturan sama dengan Sidebar)
const visibleGroups = computed(() => {
  const out = []

  for (const top of MENU_GROUPS) {
    const groups = []

    for (const grp of top.groups) {
      if (grp.visibleIf && !grp.visibleIf(user.value)) continue

      const sections = grp.sections
        .map((s) => ({ ...s, items: s.items.filter((it) => !it.code || canAccess(it.code)) }))
        .filter((s) => s.items.length > 0)

      if (sections.length > 0) groups.push({ ...grp, sections })
    }

    if (groups.length === 0) continue

    const count = groups.reduce(
      (n, g) => n + g.sections.reduce((m, s) => m + s.items.length, 0),
      0
    )
    out.push({ ...top, groups, count })
  }

  return out
})

/* ===============================
   DROPDOWN PINTASAN
================================ */
const openKey = ref(null)

function toggleGroup(key) {
  openKey.value = openKey.value === key ? null : key
}

function onDocClick(e) {
  // klik di luar kartu pintasan -> tutup dropdown
  if (!e.target.closest?.('.sc-item')) openKey.value = null
}

function onKeydown(e) {
  if (e.key === 'Escape') openKey.value = null
}

/* ===============================
   SIDEBAR
================================ */
const sidebarOpen = ref(window.innerWidth >= 768)
const windowWidth = ref(window.innerWidth)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

let resizeRaf = null
function handleResize() {
  if (resizeRaf) return
  // Diproses maksimal sekali per frame agar resize tidak membebani main thread
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null
    windowWidth.value = window.innerWidth
    sidebarOpen.value = windowWidth.value >= 768
  })
}

/* ===============================
   LIFECYCLE
================================ */
onMounted(() => {
  if (!session) {
    router.replace('/')
    return
  }
  if (!authorized) {
    router.replace('/unauthorized')
    return
  }
  window.addEventListener('resize', handleResize, { passive: true })
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
})

/* ===============================
   LOGOUT
================================ */
const loggingOut = ref(false)
const logoutError = ref('')

async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  logoutError.value = ''

  try {
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true })

    try {
      localStorage.removeItem('user')
      localStorage.removeItem('pages')
    } catch {
      // storage diblokir browser: lanjutkan
    }

    router.replace('/')
  } catch {
    logoutError.value = 'Logout gagal. Periksa koneksi lalu coba lagi.'
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
/* Semua class diberi prefix "db-" / "sc-" agar tidak bentrok dengan Bootstrap global */

.db-page {
  --sc-dark-1: #1f2937;
  --sc-dark-2: #3a4559;
  --sc-green: #9fe22f;
  --ink: #111827;
  --danger: #b42318;

  color: var(--ink);
  background: linear-gradient(100deg, #f1fbdf 0%, #e3e8ef 48%, #d7f69a 100%);
}

/* ---------- Layout wrapper ---------- */
.db-wrap {
  padding-top: 56px; /* tinggi Header (fixed) */
  margin-left: 0;
  transition: margin-left 0.3s ease;
}

.db-wrap--shift {
  margin-left: 250px; /* lebar Sidebar */
}

/* ---------- Grid pintasan ---------- */
.sc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.sc-item {
  position: relative;
  min-width: 0;
}

/* ---------- Kartu pintasan ---------- */
.sc-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 92px;
  padding: 14px 16px;
  color: #fff;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  background: linear-gradient(135deg, var(--sc-dark-1) 0%, var(--sc-dark-2) 100%);
  border: 0;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.sc-card:hover {
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.26);
}

.sc-card:focus-visible {
  outline: 3px solid var(--sc-green);
  outline-offset: 2px;
}

.sc-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 1.15rem;
  color: #16a34a;
  background: #dcfce7;
  border-radius: 12px;
}

.sc-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sc-title {
  overflow: hidden;
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-sub {
  overflow: hidden;
  font-size: 0.74rem;
  color: #cbd5e1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-chev {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 0.8rem;
  color: #374151;
  background: #e5e7eb;
  border-radius: 8px;
}

.sc-chev .bi {
  transition: transform 0.2s ease;
}

.sc-card--open .sc-chev .bi {
  transform: rotate(180deg);
}

/* ---------- Dropdown isi menu ---------- */
.sc-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  z-index: 30;
  max-height: min(70vh, 520px);
  padding: 8px;
  overflow-y: auto;
  background: linear-gradient(160deg, var(--sc-dark-1) 0%, #2f3a4d 100%);
  border-radius: 14px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.35);
}

.sc-sec {
  margin: 8px 6px 4px;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--sc-green);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sc-sec--sub {
  margin-left: 10px;
  font-size: 0.64rem;
  color: #8a97ad;
}

.sc-hr {
  margin: 6px 4px;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 1;
}

.sc-hr--soft {
  border-top-color: rgba(255, 255, 255, 0.06);
}

.sc-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.3;
  color: #e3e8f1;
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.sc-link .bi {
  flex-shrink: 0;
  width: 1.1rem;
  color: var(--sc-green);
  text-align: center;
}

.sc-link:hover,
.sc-link:focus-visible {
  color: #fff;
  background: rgba(159, 226, 47, 0.14);
  outline: 0;
}

.sc-pop-enter-active,
.sc-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.sc-pop-enter-from,
.sc-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ---------- Info developer ---------- */
.db-notice {
  margin-top: 24px;
  padding: 16px 20px 20px;
  background: rgba(248, 249, 250, 0.96);
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.db-notice__text {
  margin: 0 0 18px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
}

.db-notice__text .bi {
  margin-right: 6px;
  color: #dc2626;
}

.db-notice__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
  text-decoration: none;
  background: var(--sc-dark-1);
  border: 1px solid #111827;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.db-notice__btn .bi {
  color: var(--sc-green);
}

.db-notice__btn:hover {
  color: #fff;
  background: #111827;
}

/* ---------- Logout ---------- */
.db-logout {
  margin-top: 28px;
  text-align: center;
}

.db-logout__btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 28px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--danger);
  cursor: pointer;
  background: #fff;
  border: 1.5px solid var(--danger);
  border-radius: 8px;
  transition: background-color 0.15s, color 0.15s;
}

.db-logout__btn:hover:not(:disabled) {
  color: #fff;
  background: var(--danger);
}

.db-logout__btn:focus-visible {
  outline: 3px solid var(--sc-dark-1);
  outline-offset: 2px;
}

.db-logout__btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.db-logout__err {
  margin: 10px 0 0;
  font-size: 0.9rem;
  color: var(--danger);
}

@media (prefers-reduced-motion: reduce) {
  .db-wrap,
  .sc-card,
  .sc-chev .bi,
  .sc-pop-enter-active,
  .sc-pop-leave-active {
    transition: none;
  }
}
</style>