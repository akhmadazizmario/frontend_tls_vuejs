<template>
  <header
    class="app-header d-flex justify-content-between align-items-center px-3 px-md-4"
    :class="{ 'sidebar-open': isSidebarOpen }"
  >
    <!-- LEFT -->
    <div class="d-flex align-items-center">
      <button
        class="toggle-btn"
        @click="$emit('toggle-sidebar')"
        aria-label="Toggle sidebar"
      >
        <i class="bi bi-list"></i>
      </button>
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
          <span class="d-none d-sm-inline profile-name">
            {{ user.name || 'User' }}
          </span>

          <img
            :src="user.image || 'https://i.pravatar.cc/34'"
            alt="User"
            class="avatar rounded-circle"
            width="34"
            height="34"
          />
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const props = defineProps({
  // opsional: kalau tidak dikirim dari parent, status dibaca otomatis dari .sidebar
  sidebarOpen: { type: Boolean, default: undefined },
})
defineEmits(['toggle-sidebar'])

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

/* ===============================
   STATUS SIDEBAR (header ikut buka/tutup)
================================ */
const domOpen = ref(false)
const isSidebarOpen = computed(() => props.sidebarOpen ?? domOpen.value)

let observer = null
onMounted(async () => {
  await nextTick()
  const el = document.querySelector('.sidebar')
  if (!el) return
  domOpen.value = el.classList.contains('open')
  observer = new MutationObserver(() => {
    domOpen.value = el.classList.contains('open')
  })
  observer.observe(el, { attributes: true, attributeFilter: ['class'] })
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.app-header {
  --hd-sidebar-w: 250px;
  --hd-accent: #6cbb00;
  --hd-accent-soft: rgba(108, 187, 0, 0.1);
  --hd-text: #1f2937;
  --hd-text-dim: #6b7280;
  --hd-border: #e5e7eb;
}

/* ===============================
   HEADER FIXED (mulai di sebelah sidebar)
================================ */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #fff;
  border-bottom: 1px solid var(--hd-border);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2000;
}

.app-header.sidebar-open {
  left: var(--hd-sidebar-w);
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
  border: 0;
  border-radius: 0.5rem;
  background-color: transparent;
  color: var(--hd-text-dim);
  font-size: 1.35rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.toggle-btn:hover {
  background-color: #f3f4f6;
  color: var(--hd-text);
}

.toggle-btn:active {
  transform: scale(0.96);
}

/* ===============================
   PROFILE (nama + avatar)
================================ */
.profile-btn {
  display: flex;
  align-items: center;
  border: 0;
  background: transparent;
  padding: 0.2rem 0.3rem;
  border-radius: 999px;
  cursor: pointer;
}

.profile-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--hd-text-dim);
}

.profile-btn:hover .profile-name,
.profile-btn.show .profile-name {
  color: var(--hd-text);
}

.avatar {
  display: block;
  object-fit: cover;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

/* ===============================
   DROPDOWN MENU
================================ */
.dropdown-menu {
  margin-top: 0.5rem;
  border: 1px solid var(--hd-border);
  border-radius: 0.6rem;
  padding: 0.4rem;
  min-width: 200px;
}

.dropdown-item {
  border-radius: 0.4rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--hd-text);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dropdown-item:hover,
.dropdown-item:focus {
  background-color: var(--hd-accent-soft);
  color: var(--hd-text);
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