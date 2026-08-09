<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 modern-bg">
    <div class="card modern-card rounded-4" style="width: 100%; max-width: 400px;">
      <div class="card-body p-5">
        <div class="text-center mb-5">
          <img src="/images/logo.jpg" alt="TLSI Logo" class="mb-3" style="width: 100px;">
          <h2 class="card-title fw-bold">TLSI System</h2>
          <p class="text-muted mt-2">Masuk untuk melanjutkan</p>
        </div>

        <form @submit.prevent="login">
          <div class="mb-4">
            <label for="username" class="form-label text-muted">Username</label>
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0">
                <i class="bi bi-person-fill text-primary"></i>
              </span>
              <input
                type="text"
                id="username"
                v-model="nopegawai"
                required
                class="form-control form-control-modern border-start-0"
                placeholder="Masukkan Username"
              />
            </div>
          </div>

          <div class="mb-4">
            <label for="password" class="form-label text-muted">Password</label>
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0">
                <i class="bi bi-lock-fill text-primary"></i>
              </span>
              <input
                type="password"
                id="password"
                v-model="password"
                required
                class="form-control form-control-modern border-start-0"
                placeholder="Masukkan Password"
              />
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-modern w-100 fw-bold py-2 text-white"
            :disabled="loading"
          >
            {{ loading ? 'Memuat...' : 'Masuk' }}
          </button>
        </form>

        <div v-if="error" class="alert alert-danger mt-4 mb-0 text-center rounded-3">
          {{ error }}
        </div>

        <div v-if="success" class="alert alert-success mt-4 mb-0 text-center rounded-3">
          {{ success }}
        </div>
      </div>

      <div class="card-footer text-center text-muted small p-3">
        &copy; {{ new Date().getFullYear() }} TLSI. All Rights Reserved.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const nopegawai = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// async function login() {
//   error.value = ''
//   success.value = ''
//   loading.value = true

//   try {
//     const res = await axios.post(
//       `${API_BASE_URL}/auth/login`,
//       {
//         nopegawai: nopegawai.value,
//         password: password.value
//       },
//       { withCredentials: true }
//     )

//     success.value = res.data.message
//     localStorage.setItem('user', JSON.stringify(res.data.user))
//     setTimeout(() => {
//       window.location.href = '/dashboard'
//     }, 1000)
//   } catch (err) {
//     error.value = err.response?.data?.message || 'Login gagal'
//   } finally {
//     loading.value = false
//   }
// }
async function login() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    const res = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        nopegawai: nopegawai.value,
        password: password.value
      },
      { withCredentials: true }
    )

    success.value = res.data.message

    // 🔥 SIMPAN DATA
    localStorage.setItem('user', JSON.stringify(res.data.user))
    localStorage.setItem('pages', JSON.stringify(res.data.pages))

    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 800)
  } catch (err) {
    error.value = err.response?.data?.message || 'Login gagal'
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.modern-bg {
  background: #f0f2f5; /* Warna latar belakang modern */
  background: linear-gradient(135deg, #e0eafc, #8affc8); /* Gradien halus */
}

.modern-card {
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

.modern-card:hover {
  transform: translateY(-5px);
}

.form-control-modern {
  border-radius: 25px; /* Sudut melengkung untuk input */
  padding: 10px 20px;
  border-color: #ddd;
}

.form-control-modern:focus {
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.btn-modern {
  border-radius: 25px; /* Tombol melengkung */
  font-weight: bold;
  padding: 10px 20px;
  background-color: #0d6efd;
  border-color: #0d6efd;
  transition: background-color 0.3s;
}

.btn-modern:hover {
  background-color: #0b5ed7;
  border-color: #0b5ed7;
}

.card-footer {
  border-top: none;
}
</style>
