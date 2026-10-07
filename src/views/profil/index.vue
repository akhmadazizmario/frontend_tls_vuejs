<template>
  <div class="d-flex flex-column vh-100 bg-page overflow-hidden">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1 overflow-hidden pt-5">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        :class="[
          'flex-grow-1 p-3 p-md-4 transition-all main-content d-flex flex-column overflow-auto custom-scrollbar',
          sidebarOpen ? 'ms-sidebar-open' : 'ms-sidebar-closed',
        ]"
      >
        <div class="container-xl flex-grow-1 d-flex flex-column">
          <!-- ==================== PAGE HEADER ==================== -->
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 class="fw-bold app-title m-0">
                <span class="app-title-icon"><i class="bi bi-person-vcard"></i></span>Profil Saya
              </h5>
              <p class="app-subtitle mb-0">Kelola informasi akun dan keamanan Anda</p>
            </div>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb modern-breadcrumb mb-0">
                <li class="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
                <li class="breadcrumb-item active" aria-current="page">Profil</li>
              </ol>
            </nav>
          </div>

          <!-- ==================== ALERT ==================== -->
          <transition name="fade">
            <div v-if="alert.show" :class="['alert-toast', `alert-toast-${alert.type}`]" role="alert">
              <i :class="['bi', alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill']"></i>
              <span>{{ alert.message }}</span>
              <button class="alert-close" @click="alert.show = false"><i class="bi bi-x-lg"></i></button>
            </div>
          </transition>

          <!-- ==================== LOADING STATE ==================== -->
          <div v-if="isLoadingProfile" class="modern-card p-5 text-center mb-4">
            <div class="spinner-border text-primary mb-2" role="status"></div>
            <div class="text-muted small">Memuat data profil...</div>
          </div>

          <template v-else>
          <!-- ==================== COVER + IDENTITY CARD ==================== -->
          <div class="profile-hero mb-4">
            <div class="profile-cover">
              <div class="cover-pattern"></div>
            </div>

            <div class="profile-identity mt-1">
              <div class="avatar-wrapper">
                <div class="avatar-ring">
                  <img :src="avatarPreview" alt="Foto profil" class="avatar-img" @error="onAvatarError" />
                </div>
                <button type="button" class="avatar-edit-btn" @click="triggerFileInput" :disabled="isSaving">
                  <i class="bi bi-camera-fill"></i>
                </button>
                <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="onFileChange" />
              </div>

              <div class="identity-text">
                <h4 class="fw-bold mb-1 mt-3">{{ form.name || '-' }}</h4>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <span class="id-badge id-badge-primary">
                    <i class="bi bi-person-badge me-1"></i>{{ form.nopegawai || '-' }}
                  </span>
                  <span class="id-badge id-badge-slate">
                    <i class="bi bi-diagram-3 me-1"></i>{{ form.dept || '-' }}
                  </span>
                  <span class="id-badge id-badge-success">
                    <i class="bi bi-briefcase me-1"></i>{{ form.jabatan || '-' }}
                  </span>
                </div>
              </div>

              <div class="identity-meta d-none d-lg-flex">
                <div class="meta-item">
                  <span class="meta-label">Status</span>
                  <span class="meta-value text-success"><i class="bi bi-dot fs-4 lh-1"></i>Aktif</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== TABS ==================== -->
          <ul class="nav modern-tabs mb-3">
            <li class="nav-item">
              <button
                type="button"
                class="nav-link"
                :class="{ active: activeTab === 'info' }"
                @click="activeTab = 'info'"
              >
                <i class="bi bi-person-lines-fill me-1"></i> Informasi Umum
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class="nav-link"
                :class="{ active: activeTab === 'security' }"
                @click="activeTab = 'security'"
              >
                <i class="bi bi-shield-lock-fill me-1"></i> Keamanan
              </button>
            </li>
          </ul>

          <!-- ==================== TAB CONTENT ==================== -->
          <form @submit.prevent="saveProfile" class="flex-grow-1">
            <!-- INFORMASI UMUM -->
            <div v-show="activeTab === 'info'" class="modern-card p-4 mb-4">
              <h6 class="section-title"><i class="bi bi-card-text me-2"></i>Data Diri</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label-modern">Nama Lengkap</label>
                  <div class="input-icon-group">
                    <i class="bi bi-person input-icon"></i>
                    <input v-model.trim="form.name" type="text" class="form-control modern-input" placeholder="Nama lengkap" required />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label-modern">Email</label>
                  <div class="input-icon-group">
                    <i class="bi bi-envelope input-icon"></i>
                    <input v-model.trim="form.email" type="email" class="form-control modern-input" placeholder="nama@perusahaan.com" required />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label-modern">No. Telepon</label>
                  <div class="input-icon-group">
                    <i class="bi bi-telephone input-icon"></i>
                    <input v-model.trim="form.phone" type="text" class="form-control modern-input" placeholder="08xxxxxxxxxx" />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label-modern">No. Pegawai</label>
                  <div class="input-icon-group">
                    <i class="bi bi-person-badge input-icon"></i>
                    <input v-model.trim="form.nopegawai" type="text" class="form-control modern-input" placeholder="NIP / No. Pegawai" />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label-modern">Departemen</label>
                  <div class="input-icon-group">
                    <i class="bi bi-diagram-3 input-icon"></i>
                    <input v-model.trim="form.dept" type="text" class="form-control modern-input" placeholder="Departemen" />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label-modern">Jabatan</label>
                  <div class="input-icon-group">
                    <i class="bi bi-briefcase input-icon"></i>
                    <input v-model.trim="form.jabatan" type="text" class="form-control modern-input" placeholder="Jabatan" />
                  </div>
                </div>
              </div>
            </div>

            <!-- KEAMANAN -->
            <div v-show="activeTab === 'security'" class="modern-card p-4 mb-4">
              <h6 class="section-title"><i class="bi bi-key me-2"></i>Ganti Password</h6>
              <p class="text-muted small mb-3">Kosongkan bagian ini jika Anda tidak ingin mengubah password.</p>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label-modern">Password Baru</label>
                  <div class="input-icon-group">
                    <i class="bi bi-lock input-icon"></i>
                    <input
                      v-model="form.password"
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control modern-input"
                      placeholder="Minimal 6 karakter"
                      minlength="6"
                    />
                    <button type="button" class="input-suffix-btn" @click="showPassword = !showPassword" tabindex="-1">
                      <i :class="['bi', showPassword ? 'bi-eye-slash' : 'bi-eye']"></i>
                    </button>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label-modern">Konfirmasi Password</label>
                  <div class="input-icon-group">
                    <i class="bi bi-lock-fill input-icon"></i>
                    <input
                      v-model="confirmPassword"
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control modern-input"
                      placeholder="Ulangi password baru"
                      minlength="6"
                    />
                  </div>
                </div>

                <div class="col-12" v-if="form.password && passwordStrengthLabel">
                  <div class="strength-bar">
                    <div class="strength-fill" :class="`strength-${passwordStrength}`" :style="{ width: strengthPercent + '%' }"></div>
                  </div>
                  <small :class="`text-${strengthColor}`">Kekuatan password: {{ passwordStrengthLabel }}</small>
                </div>

                <div class="col-12" v-if="form.password && confirmPassword && form.password !== confirmPassword">
                  <small class="text-danger"><i class="bi bi-exclamation-circle me-1"></i>Password dan konfirmasi tidak sama.</small>
                </div>
              </div>
            </div>

            <!-- ==================== ACTION BAR ==================== -->
            <div class="action-bar">
              <button type="button" class="btn btn-modern btn-modern-outline" @click="resetForm" :disabled="isSaving">
                <i class="bi bi-arrow-counterclockwise me-1"></i> Batalkan
              </button>
              <button type="submit" class="btn btn-modern btn-modern-primary" :disabled="isSaving || !isFormValid">
                <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-save2 me-1"></i>
                {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </form>
          </template>
        </div>

        <Footer />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

import Header from '../../components/Header.vue'
import Sidebar from '../../components/Sidebar.vue'
import Footer from '../../components/Footer.vue'

/* ===============================
   STATE
================================ */
const router = useRouter()

// Avatar default berupa SVG inline, jadi tidak pernah "pecah"
// walaupun belum ada file gambar default di server.
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" fill="#e2e8f0"/>
      <circle cx="48" cy="38" r="18" fill="#94a3b8"/>
      <path d="M14 88c4-20 22-30 34-30s30 10 34 30" fill="#94a3b8"/>
    </svg>`
  )

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
// Origin backend murni (tanpa "/api"), dipakai khusus untuk mengakses
// file statis seperti foto profil — karena saat development, frontend
// (mis. :5173) dan backend (mis. :3000) berjalan di port berbeda.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
const API_BASE = `${API_BASE_URL}/profile`

const sidebarOpen = ref(window.innerWidth >= 768)
const activeTab = ref('info')
const isSaving = ref(false)
const isLoadingProfile = ref(true)
const showPassword = ref(false)
const confirmPassword = ref('')
const fileInput = ref(null)
const selectedFile = ref(null)
const avatarPreview = ref(DEFAULT_AVATAR)

const user = ref({ name: '', nopegawai: '', dept: '' })

// User yang login disimpan di localStorage("user") sebagai JSON,
// bukan localStorage("userId") — sama seperti pola di index.vue/dashboard.vue.
function getLoggedInUserId() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed.id ?? parsed.userId ?? parsed.iduser ?? ''
  } catch (err) {
    console.error('Gagal membaca data user dari localStorage:', err)
    return ''
  }
}

const userId = ref(getLoggedInUserId())

const form = reactive({
  name: '',
  email: '',
  phone: '',
  nopegawai: '',
  dept: '',
  jabatan: '',
  password: '',
})

const originalForm = ref({})

const alert = reactive({ show: false, type: 'success', message: '' })
let alertTimeout = null

/* ===============================
   ALERT HELPER
================================ */
function showAlert(message, type = 'success') {
  alert.message = message
  alert.type = type
  alert.show = true
  clearTimeout(alertTimeout)
  alertTimeout = setTimeout(() => (alert.show = false), 4000)
}

/* ===============================
   SIDEBAR
================================ */
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

/* ===============================
   LOAD PROFIL
================================ */
async function fetchProfile() {
  if (!userId.value) {
    isLoadingProfile.value = false
    showAlert('Sesi login tidak ditemukan. Silakan login ulang.', 'error')
    return
  }
  isLoadingProfile.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/${userId.value}`)
    form.name = data.name || ''
    form.email = data.email || ''
    form.phone = data.phone || ''
    form.nopegawai = data.nopegawai || ''
    form.dept = data.dept || ''
    form.jabatan = data.jabatan || ''
    form.password = ''

    user.value = { name: data.name, nopegawai: data.nopegawai, dept: data.dept }
    // Foto disimpan di server backend (bukan frontend), jadi arahkan ke
    // origin backend supaya tetap tampil walau frontend jalan di port lain.
    avatarPreview.value = data.image ? `${API_ORIGIN}/${data.image}` : DEFAULT_AVATAR

    originalForm.value = { ...form }
  } catch (err) {
    console.error('Gagal memuat profil:', err)
    showAlert('Gagal memuat data profil. Silakan muat ulang halaman.', 'error')
  } finally {
    isLoadingProfile.value = false
  }
}

function onAvatarError() {
  avatarPreview.value = DEFAULT_AVATAR
}

/* ===============================
   UPLOAD FOTO
================================ */
function triggerFileInput() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showAlert('File harus berupa gambar.', 'error')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showAlert('Ukuran gambar maksimal 5MB.', 'error')
    return
  }

  selectedFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

/* ===============================
   VALIDASI & KEKUATAN PASSWORD
================================ */
const isFormValid = computed(() => {
  if (!form.name || !form.email) return false
  if (form.password && form.password.length < 6) return false
  if (form.password && form.password !== confirmPassword.value) return false
  return true
})

const passwordStrength = computed(() => {
  const val = form.password || ''
  let score = 0
  if (val.length >= 6) score++
  if (val.length >= 10) score++
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++
  if (/\d/.test(val) && /[^A-Za-z0-9]/.test(val)) score++
  if (score <= 1) return 'weak'
  if (score === 2) return 'medium'
  return 'strong'
})

const passwordStrengthLabel = computed(() => {
  return { weak: 'Lemah', medium: 'Sedang', strong: 'Kuat' }[passwordStrength.value]
})

const strengthColor = computed(() => {
  return { weak: 'danger', medium: 'warning', strong: 'success' }[passwordStrength.value]
})

const strengthPercent = computed(() => {
  return { weak: 33, medium: 66, strong: 100 }[passwordStrength.value]
})

/* ===============================
   SIMPAN PROFIL
================================ */
async function saveProfile() {
  if (!isFormValid.value) {
    showAlert('Periksa kembali data yang Anda masukkan.', 'error')
    return
  }

  isSaving.value = true
  try {
    const payload = new FormData()
    payload.append('name', form.name)
    payload.append('email', form.email)
    payload.append('phone', form.phone)
    payload.append('nopegawai', form.nopegawai)
    payload.append('dept', form.dept)
    payload.append('jabatan', form.jabatan)
    if (form.password) payload.append('password', form.password)
    if (selectedFile.value) payload.append('image', selectedFile.value)

    const { data } = await axios.put(`${API_BASE}/update-profil/${userId.value}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    showAlert(data.message || 'Profil berhasil diperbarui.', 'success')
    form.password = ''
    confirmPassword.value = ''
    selectedFile.value = null
    originalForm.value = { ...form }

    user.value = { name: form.name, nopegawai: form.nopegawai, dept: form.dept }
  } catch (err) {
    console.error('Update profil error:', err)
    showAlert(err.response?.data?.message || 'Gagal menyimpan perubahan. Coba lagi.', 'error')
  } finally {
    isSaving.value = false
  }
}

function resetForm() {
  Object.assign(form, originalForm.value, { password: '' })
  confirmPassword.value = ''
  selectedFile.value = null
  fetchProfile()
}

/* ===============================
   LOGOUT
================================ */
async function logout() {
  try {
    await axios.post('/api/logout')
  } catch (err) {
    // abaikan error logout, tetap arahkan ke halaman login
  } finally {
    router.push('/')
  }
}

onMounted(fetchProfile)
</script>

<style scoped>
/* ==================== BASE / DESIGN TOKENS ====================
   Variabel warna ditaruh di class pembungkus root (bukan :root),
   karena di dalam <style scoped> milik Vue, ":root" tidak pernah
   benar-benar match ke elemen manapun sehingga variabel tidak
   pernah terbaca oleh elemen lain di bawahnya. */
.bg-page {
  background: #f8fafc;
  --brand-900: #0f172a;
  --brand-700: #334155;
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-soft: #eff6ff;
  --success: #16a34a;
  --success-soft: #f0fdf4;
  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --warning: #d97706;
  --warning-soft: #fffbeb;
  --slate: #64748b;
  --border-soft: #e2e8f0;
  --radius-lg: 14px;
  --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.05), 0 10px 30px rgba(15, 23, 42, 0.06);
}

.transition-all { transition: margin-left 0.25s ease; }
.ms-sidebar-open { margin-left: 16rem; }
.ms-sidebar-closed { margin-left: 0; }

.app-title { font-size: 1.05rem; color: var(--brand-900); letter-spacing: -0.01em; }
.app-title-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.9rem; height: 1.9rem; border-radius: 8px;
  background: var(--primary-soft); color: var(--primary);
  margin-right: 0.5rem; font-size: 0.95rem;
}
.app-subtitle { font-size: 0.8rem; color: var(--slate); }

.modern-breadcrumb {
  font-size: 0.8rem; background: transparent; padding: 0;
}
.modern-breadcrumb a { color: var(--slate); text-decoration: none; }
.modern-breadcrumb a:hover { color: var(--primary); }
.modern-breadcrumb .active { color: var(--brand-900); font-weight: 600; }

.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

/* ==================== ALERT TOAST ==================== */
.alert-toast {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.87rem;
  margin-bottom: 1rem; font-weight: 500;
}
.alert-toast-success { background: var(--success-soft); color: #15803d; border: 1px solid #bbf7d0; }
.alert-toast-error { background: var(--danger-soft); color: #b91c1c; border: 1px solid #fecaca; }
.alert-close { margin-left: auto; background: none; border: none; color: inherit; opacity: 0.6; }
.alert-close:hover { opacity: 1; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ==================== PROFILE HERO ==================== */
.profile-hero {
  background: #fff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.profile-cover {
  height: 120px;
  background: linear-gradient(135deg, var(--brand-900) 0%, #1e3a8a 55%, var(--primary) 100%);
  position: relative;
}

.cover-pattern {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px);
  background-size: 16px 16px;
  opacity: 0.6;
}

.profile-identity {
  display: flex; align-items: flex-end; gap: 1.25rem;
  padding: 0 1.75rem 1.25rem;
  margin-top: -46px;
  flex-wrap: wrap;
}

.avatar-wrapper { position: relative; flex-shrink: 0; }

.avatar-ring {
  width: 96px; height: 96px; border-radius: 50%;
  padding: 4px; background: #fff;
  box-shadow: var(--shadow-card);
}

.avatar-img {
  width: 100%; height: 100%; border-radius: 50%;
  object-fit: cover; background: #e2e8f0;
}

.avatar-edit-btn {
  position: absolute; bottom: 2px; right: 2px;
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--primary); color: #fff; border: 2px solid #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
  transition: transform 0.15s ease;
}
.avatar-edit-btn:hover { transform: scale(1.08); background: var(--primary-dark); }

.identity-text { padding-bottom: 0.15rem; }
.identity-text h4 { color: var(--brand-900); }

.id-badge {
  display: inline-flex; align-items: center;
  font-size: 0.75rem; font-weight: 600;
  padding: 0.3rem 0.65rem; border-radius: 999px;
}
.id-badge-primary { background: var(--primary-soft); color: var(--primary-dark); }
.id-badge-slate { background: #f1f5f9; color: var(--slate); }
.id-badge-success { background: var(--success-soft); color: #15803d; }

.identity-meta { margin-left: auto; padding-bottom: 0.3rem; gap: 1.5rem; }
.meta-item { display: flex; flex-direction: column; align-items: flex-end; }
.meta-label { font-size: 0.7rem; color: var(--slate); text-transform: uppercase; letter-spacing: 0.03em; }
.meta-value { font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; }

/* ==================== TABS ==================== */
.modern-tabs {
  border-bottom: 1px solid var(--border-soft);
  gap: 0.25rem;
}
.modern-tabs .nav-link {
  border: none; background: none; color: var(--slate);
  font-weight: 600; font-size: 0.85rem; padding: 0.6rem 0.9rem;
  border-bottom: 2px solid transparent; border-radius: 0;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.modern-tabs .nav-link:hover { color: var(--primary); }
.modern-tabs .nav-link.active { color: var(--primary); border-bottom-color: var(--primary); }

/* ==================== CARD & FORM ==================== */
.modern-card {
  background: #fff; border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
}

.section-title {
  font-size: 0.85rem; font-weight: 700; color: var(--brand-900);
  text-transform: uppercase; letter-spacing: 0.03em;
  margin-bottom: 1rem;
}

.form-label-modern {
  font-size: 0.78rem; font-weight: 600; color: var(--brand-700);
  margin-bottom: 0.35rem; display: block;
}

.input-icon-group { position: relative; }
.input-icon {
  position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%);
  color: #94a3b8; font-size: 0.9rem; pointer-events: none;
}
.modern-input {
  padding-left: 2.4rem; border: 1px solid var(--border-soft);
  border-radius: 9px; font-size: 0.87rem; padding-top: 0.55rem; padding-bottom: 0.55rem;
}
.modern-input:focus {
  border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft);
}
.input-suffix-btn {
  position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #94a3b8; font-size: 0.95rem;
}
.input-suffix-btn:hover { color: var(--primary); }

.strength-bar { height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 0.3rem; }
.strength-fill { height: 100%; border-radius: 999px; transition: width 0.25s ease, background 0.25s ease; }
.strength-fill.strength-weak { background: var(--danger); }
.strength-fill.strength-medium { background: var(--warning); }
.strength-fill.strength-strong { background: var(--success); }

/* ==================== ACTION BAR ==================== */
.action-bar {
  display: flex; justify-content: flex-end; gap: 0.6rem;
  padding: 1rem 0 2rem;
}

.btn-modern {
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: 9px;
  font-size: 0.85rem; font-weight: 600;
  padding: 0.55rem 1.3rem; transition: all 0.15s ease;
}
.btn-modern-primary { background: var(--primary); color: #fff; box-shadow: 0 1px 2px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.06); }
.btn-modern-primary:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); }
.btn-modern-primary:disabled { opacity: 0.65; cursor: not-allowed; }

.btn-modern-outline { background: #fff; color: var(--brand-700); border-color: var(--border-soft); }
.btn-modern-outline:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }

/* ==================== RESPONSIVE ==================== */
@media (max-width: 767px) {
  .ms-sidebar-open, .ms-sidebar-closed { margin-left: 0; }
  .profile-identity { flex-direction: column; align-items: flex-start; margin-top: -30px; }
  .avatar-ring { width: 80px; height: 80px; }
  .action-bar { justify-content: stretch; }
  .action-bar .btn-modern { flex: 1; }
}
</style>