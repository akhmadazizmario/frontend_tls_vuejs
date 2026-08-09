<template>
  <header
    class="app-header d-flex justify-content-between align-items-center px-3 px-md-4 shadow-sm"
  >
    <!-- LEFT -->
    <div class="d-flex align-items-center">
      <button
        class="toggle-btn me-3"
        @click="$emit('toggle-sidebar')"
        aria-label="Toggle sidebar"
      >
        <i class="bi bi-list fs-4"></i>
      </button>

      <h1 class="h5 mb-0 fw-bold brand">
        TLSI <span class="brand-accent">App</span>
      </h1>
    </div>

    <!-- RIGHT -->
    <div class="d-flex align-items-center gap-3">
      <div class="dropdown">
        <button
          class="profile-btn d-flex align-items-center gap-2"
          type="button"
          id="profileDropdown"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <span class="avatar-ring">
            <img
              :src="user.image || 'https://i.pravatar.cc/32'"
              alt="User"
              class="rounded-circle"
              width="32"
              height="32"
            />
          </span>

          <span class="d-none d-sm-inline profile-name">
            {{ user.name || 'User' }}
          </span>

          <i class="bi bi-chevron-down profile-caret"></i>
        </button>

        <ul
          class="dropdown-menu dropdown-menu-end shadow"
          aria-labelledby="profileDropdown"
        >
          <li>
            <a class="dropdown-item" href="/profile">
              <i class="bi bi-person-circle me-2"></i>Update Profil
            </a>
          </li>
          <li><hr class="dropdown-divider" /></li>
          <li>
            <a
              class="dropdown-item text-danger"
              href="#"
              @click.prevent="logout"
            >
              <i class="bi bi-box-arrow-right me-2"></i>Logout
            </a>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API2_BASE_URL = import.meta.env.VITE_API2_BASE_URL

const router = useRouter()

const user = ref({
  name: 'User',
  image: 'https://i.pravatar.cc/32'
})

async function fetchUserProfile() {
  const userData = localStorage.getItem('user')
  if (!userData) return

  const parsedUser = JSON.parse(userData)

  try {
    const res = await axios.get(
      `${API_BASE_URL}/profile/${parsedUser.id}`
    )

    let profile = res.data

    profile.image = profile.image
      ? `${API2_BASE_URL}/${profile.image}`
      : 'https://i.pravatar.cc/32'

    user.value = profile
  } catch (err) {
    console.error('Gagal mengambil profil:', err)
    user.value.name = parsedUser.name
  }
}

async function logout() {
  try {
    await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      { withCredentials: true }
    )

    localStorage.removeItem('user')
    router.push('/')
  } catch (err) {
    console.error('Logout error:', err)
    alert(
      'Logout gagal: ' +
        (err.response?.data?.message || err.message)
    )
  }
}

onMounted(fetchUserProfile)
</script>

<style scoped>
/* ===============================
   ROOT VARIABLES (selaras dengan sidebar)
================================ */
.app-header {
  --hd-accent: #4f7cff;
  --hd-accent-soft: rgba(79, 124, 255, 0.1);
  --hd-text: #1f2937;
  --hd-text-dim: #6b7280;
  --hd-border: rgba(15, 23, 42, 0.08);
}

/* ===============================
   HEADER FIXED
================================ */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  height: 56px;
  background-color: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid var(--hd-border);

  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);

  z-index: 2000;
}

/* ===============================
   BRAND / LOGO TEXT
================================ */
.brand {
  color: var(--hd-text);
  letter-spacing: 0.01em;
}

.brand-accent {
  color: var(--hd-accent);
}

/* ===============================
   TOGGLE SIDEBAR BUTTON
================================ */
.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 0.6rem;
  border: 1px solid var(--hd-border);
  background-color: transparent;
  color: var(--hd-text-dim);
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  z-index: 2100; /* Tombol sidebar aman di atas semua */
}

.toggle-btn:hover {
  background-color: var(--hd-accent-soft);
  border-color: var(--hd-accent);
  color: var(--hd-accent);
}

.toggle-btn:active {
  transform: scale(0.96);
}

/* ===============================
   PROFILE DROPDOWN BUTTON
================================ */
.profile-btn {
  display: flex;
  align-items: center;
  border: 1px solid var(--hd-border);
  background-color: #fff;
  border-radius: 999px;
  padding: 0.3rem 0.75rem 0.3rem 0.3rem;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.profile-btn:hover,
.profile-btn:focus,
.profile-btn.show {
  background-color: var(--hd-accent-soft);
  border-color: var(--hd-accent);
}

.avatar-ring {
  display: inline-flex;
  padding: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--hd-accent), #8fb0ff);
}

.avatar-ring img {
  display: block;
  border: 2px solid #fff;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--hd-text);
}

.profile-caret {
  font-size: 0.7rem;
  color: var(--hd-text-dim);
  transition: transform 0.2s ease;
}

.profile-btn[aria-expanded="true"] .profile-caret {
  transform: rotate(180deg);
  color: var(--hd-accent);
}

/* ===============================
   DROPDOWN MENU
================================ */
.dropdown-menu {
  margin-top: 0.5rem;
  border: 1px solid var(--hd-border);
  border-radius: 0.75rem;
  padding: 0.4rem;
  min-width: 200px;
}

.dropdown-item {
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--hd-text);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dropdown-item:hover,
.dropdown-item:focus {
  background-color: var(--hd-accent-soft);
  color: var(--hd-accent);
}

.dropdown-item.text-danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444 !important;
}

.dropdown-divider {
  margin: 0.35rem 0;
  border-color: var(--hd-border);
}
</style>