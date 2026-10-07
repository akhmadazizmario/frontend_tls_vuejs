<template>
  <main class="login-container">
    <div class="login-card">
      <!-- Bagian Kiri: Ilustrasi / Logo Besar -->
      <div class="login-left" aria-hidden="true">
        <div class="illustration-wrapper">
          <img src="/logos.png" alt="System Logo" class="illustration" onerror="this.style.display='none'" />
        </div>
      </div>

      <!-- Bagian Kanan: Form Login -->
      <div class="login-right">
        <header class="login-header">
          <!-- Logo Form yang Diperbagus -->
          <div class="brand-logo">
            <img
              src="/images/logo.jpg"
              alt="Logo TLSI"
              class="logo-img"
              decoding="async"
              fetchpriority="high"
            />
          </div>
          <h1 class="title"><span class="title-accent">TLSI</span> System</h1>
          <p class="subtitle">Silahkan login terlebih dahulu</p>
        </header>

        <form novalidate @submit.prevent="login" class="login-form">
          <!-- Input Username -->
          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-wrapper">
              <input
                id="username"
                ref="usernameInput"
                v-model="nopegawai"
                class="form-control"
                type="text"
                placeholder="Masukkan username"
                autocomplete="username"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                required
                :maxlength="USERNAME_MAX"
                :aria-invalid="errorMessage ? 'true' : 'false'"
              />
            </div>
          </div>

          <!-- Input Password -->
          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                class="form-control"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Masukkan password"
                autocomplete="current-password"
                required
                :maxlength="PASSWORD_MAX"
                :aria-invalid="errorMessage ? 'true' : 'false'"
                @keydown="checkCapsLock"
                @keyup="checkCapsLock"
                @blur="capsLockOn = false"
              />
              <button
                type="button"
                class="btn-eye"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="icon-eye" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else class="icon-eye" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <path d="M1 1l22 22" />
                </svg>
              </button>
            </div>
            <p v-if="capsLockOn" class="hint-text">Caps Lock sedang aktif.</p>
          </div>

          <!-- Pesan Error / Success -->
          <div v-if="errorMessage" class="alert alert-error" role="alert">
            {{ errorMessage }}
          </div>
          <div v-if="success" class="alert alert-success" role="status">
            {{ success }}
          </div>

          <!-- Tombol Submit -->
          <button type="submit" class="btn-submit" :disabled="isBusy">
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            <span>{{ buttonText }}</span>
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import axios from 'axios'
// import api from '../api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ===============================
   KONFIGURASI
================================ */
const USERNAME_MAX = 64
const PASSWORD_MAX = 128
const USERNAME_PATTERN = /^[\w.@-]+$/
const MAX_FAILED_ATTEMPTS = 5
const LOCK_SECONDS = 30

/* ===============================
   STATE
================================ */
const nopegawai = ref('')
const password = ref('')
const showPassword = ref(false)
const capsLockOn = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')
const failedAttempts = ref(0)
const lockRemaining = ref(0)
const usernameInput = ref(null)

let lockTimer = null
let redirectTimer = null

const isBusy = computed(() => loading.value || lockRemaining.value > 0 || !!success.value)

const errorMessage = computed(() =>
  lockRemaining.value > 0
    ? `Terlalu banyak percobaan. Coba lagi dalam ${lockRemaining.value} detik.`
    : error.value
)

const buttonText = computed(() => {
  if (loading.value) return 'Memproses…'
  if (success.value) return 'Mengalihkan…'
  if (lockRemaining.value > 0) return `Tunggu ${lockRemaining.value}s`
  return 'Login'
})

/* ===============================
   VALIDASI & SANITASI INPUT
================================ */
function cleanUsername(value) {
  return String(value).replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, '').trim()
}

function validate(user, pass) {
  if (!user || !pass) return 'Username dan password wajib diisi.'
  if (user.length > USERNAME_MAX || pass.length > PASSWORD_MAX) {
    return 'Username atau password terlalu panjang.'
  }
  if (!USERNAME_PATTERN.test(user)) {
    return 'Username hanya boleh berisi huruf, angka, titik, garis bawah, strip, atau @.'
  }
  return ''
}

function checkCapsLock(e) {
  capsLockOn.value = !!e.getModifierState?.('CapsLock')
}

/* ===============================
   LOGIN
================================ */
function startLock(seconds = LOCK_SECONDS) {
  failedAttempts.value = 0
  lockRemaining.value = seconds
  clearInterval(lockTimer)
  lockTimer = setInterval(() => {
    lockRemaining.value -= 1
    if (lockRemaining.value <= 0) {
      clearInterval(lockTimer)
      lockTimer = null
      lockRemaining.value = 0
      error.value = ''
    }
  }, 1000)
}

function persistSession(data) {
  try {
    if (data?.user) localStorage.setItem('user', JSON.stringify(data.user))
    if (data?.pages) localStorage.setItem('pages', JSON.stringify(data.pages))
  } catch {
    // Storage diblokir/penuh
  }
}

function handleFailure(err) {
  const status = err?.response?.status

  if (!err?.response) {
    error.value = 'Tidak dapat terhubung ke server. Periksa jaringan lalu coba lagi.'
  } else if (status === 429) {
    error.value = 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
    startLock()
  } else if (status === 400 || status === 401) {
    error.value = 'Username atau password salah. Periksa lalu coba lagi.'
    failedAttempts.value += 1
    if (failedAttempts.value >= MAX_FAILED_ATTEMPTS) startLock()
  } else {
    error.value = 'Login gagal. Silakan coba lagi.'
  }
}

async function login() {
  if (isBusy.value) return

  error.value = ''
  success.value = ''

  const user = cleanUsername(nopegawai.value)
  const pass = password.value

  const invalid = validate(user, pass)
  if (invalid) {
    error.value = invalid
    return
  }

  loading.value = true
  try {
    const res = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { nopegawai: user, password: pass },
      { withCredentials: true }
    )

    failedAttempts.value = 0
    persistSession(res.data)
    password.value = ''
    success.value = 'Login berhasil. Mengalihkan…'

    redirectTimer = setTimeout(() => {
      window.location.replace('/dashboard')
    }, 300)
  } catch (err) {
    handleFailure(err)
    password.value = ''
  } finally {
    loading.value = false
  }
}

/* ===============================
   LIFECYCLE
================================ */
onMounted(() => {
  if (window.matchMedia?.('(pointer: fine)').matches) usernameInput.value?.focus()
})

onBeforeUnmount(() => {
  clearInterval(lockTimer)
  clearTimeout(redirectTimer)
})
</script>

<style scoped>
/* ===== Layout & latar (gradien hijau mint -> abu -> hijau) ===== */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px;
  background: linear-gradient(135deg, #b9f6d2 0%, #e3e4e6 38%, #e3e4e6 62%, #8eeeb1 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #1f2a24;
}

/* ===== Kartu utama (glass lembut, sudut besar) ===== */
.login-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  max-width: 912px;
  min-height: 528px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(232, 246, 238, 0.95) 0%, rgba(240, 240, 241, 0.95) 45%, rgba(220, 244, 230, 0.95) 100%);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.22), 0 8px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* ===== Kiri: ilustrasi/logo besar (tanpa panel terpisah) ===== */
.login-left {
  flex: 1 1 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 40px 40px;
}

.illustration-wrapper {
  width: 100%;
  max-width: 380px;
  display: flex;
  justify-content: center;
}

.illustration {
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* ===== Kanan: form ===== */
.login-right {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 56px 40px 24px;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

/* Logo tampil apa adanya: tanpa lingkaran, kotak, atau bayangan */
.brand-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.logo-img {
  display: block;
  width: auto;
  height: auto;
  max-width: 200px;
  max-height: 64px;
  object-fit: contain;
}

.title {
  margin: 0 0 4px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2f3b36;
  letter-spacing: -0.01em;
}

.title-accent {
  color: #14653a;
}

.subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #3a4540;
}

/* ===== Form ===== */
.login-form {
  width: 100%;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #14653a;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-control {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  font-size: 0.95rem;
  color: #1f2a24;
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid #dfe8e3;
  border-radius: 10px;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

/* Ruang untuk ikon mata hanya di kolom password */
#password {
  padding-right: 44px;
}

.form-control::placeholder {
  color: #9aa7a0;
}

.form-control:focus {
  outline: none;
  background-color: #ffffff;
  border-color: #14803f;
  box-shadow: 0 0 0 3px rgba(20, 128, 63, 0.18);
}

/* Tombol mata */
.btn-eye {
  position: absolute;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  color: #111;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-eye:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.btn-eye:focus-visible {
  outline: 2px solid #14803f;
}

.icon-eye {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ===== Tombol submit ===== */
.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 40px;
  margin-top: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #ffffff;
  background-color: #14803f;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(20, 128, 63, 0.25);
  transition: background-color 0.2s, transform 0.1s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #0f6a33;
}

.btn-submit:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-submit:focus-visible {
  outline: 3px solid rgba(20, 128, 63, 0.4);
  outline-offset: 2px;
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== Pesan ===== */
.alert {
  margin-bottom: 14px;
  padding: 10px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 10px;
}

.alert-error {
  color: #b42318;
  background-color: #fff3f2;
  border: 1px solid #fecdca;
}

.alert-success {
  color: #14653a;
  background-color: #ecfdf3;
  border: 1px solid #abefc6;
}

.hint-text {
  margin: 6px 0 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: #c2410c;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .login-container {
    padding: 16px;
  }
  .login-card {
    flex-direction: column;
    max-width: 440px;
    min-height: auto;
    border-radius: 24px;
  }
  .login-left {
    padding: 28px 28px 0;
  }
  .illustration-wrapper {
    max-width: 200px;
  }
  .login-right {
    width: 100%;
    box-sizing: border-box;
    padding: 24px 28px 36px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 2s; }
  .btn-submit, .form-control { transition: none; }
}
</style>