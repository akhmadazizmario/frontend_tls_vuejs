import { ref } from 'vue'

const user = ref({
  id: '',
  name: '',
  nopegawai: '',
  dept: '',
  jabatan: '',
  email: '',
  image: ''
})

function loadUser() {
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      Object.assign(user.value, JSON.parse(stored))
    }
  } catch (e) {
    console.error('Gagal memuat data user dari localStorage:', e)
  }
}

// langsung load sekali saat module ini pertama kali dipanggil
loadUser()

export function useAuthUser() {
  return { user, loadUser }
}