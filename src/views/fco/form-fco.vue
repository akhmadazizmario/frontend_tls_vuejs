<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-2 p-md-5 main-content-wrapper"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px'
        }"
      >
        <div class="container-fluid">

          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
            <div>
              <h3 class="fw-bold mb-1">📋 Manajemen Form FCO</h3>
              <p class="text-muted small mb-0">
                Kelola form survey dan pantau hasil responden
              </p>
            </div>

            <router-link
              to="/form-fco-create"
              class="btn btn-primary rounded-pill px-4 align-self-start align-self-md-center"
            >
              <i class="bi bi-plus-circle me-1"></i> Buat Form
            </router-link>
          </div>

          <div class="card border-0 rounded-4 shadow-sm overflow-hidden">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0" style="min-width: 900px;">
                <thead class="table-light">
                  <tr>
                    <th style="width:60px" class="ps-4">#</th>
                    <th>ID Pertanyaan</th>
                    <th>Judul</th>
                    <th>Deskripsi</th>
                    <th style="width:140px">Dibuat</th>
                    <th style="width:140px" class="text-center">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(item, i) in items" :key="item.id">
                    <td class="fw-semibold ps-4">{{ i + 1 }}</td>
                    <td class="fw-semibold"><span class="badge bg-light text-primary border">{{ item.id }}</span></td>
                    <td class="fw-semibold">{{ item.title }}</td>
                    <td class="text-muted small">
                      <div class="text-truncate" style="max-width: 250px;">
                        {{ item.description || '-' }}
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-white text-dark border rounded-pill px-3">
                        {{ formatDate(item.createdAt) }}
                      </span>
                    </td>
                    <td class="text-center pe-4">
                      <div class="btn-group">
                        <router-link
                          :to="`/form-result/${item.id}`"
                          class="btn btn-sm btn-outline-success rounded-circle me-2"
                          title="Lihat Hasil"
                        >
                          <i class="bi bi-bar-chart"></i>
                        </router-link>

                        <button
                          class="btn btn-sm btn-outline-danger rounded-circle"
                          @click="deleteForm(item.id)"
                          title="Hapus"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="items.length === 0">
                    <td colspan="6" class="text-center py-5 text-muted">
                      <i class="bi bi-clipboard-x fs-1 d-block mb-3"></i>
                      Belum ada Form FCO
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL + "/form-fco";

const items = ref([]);
const user = ref({});
const sidebarOpen = ref(true); // Default true untuk desktop
const windowWidth = ref(window.innerWidth);

// 📏 Fungsi resize yang dioptimalkan
const checkMobile = () => {
  windowWidth.value = window.innerWidth;
  // Jika layar kurang dari 768px (MD), tutup sidebar otomatis
  if (windowWidth.value < 768) {
    sidebarOpen.value = false;
  } else {
    sidebarOpen.value = true;
  }
};

const formatDate = (d) =>
  new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(d));

async function loadForms() {
  try {
    const res = await axios.get(API);
    items.value = res.data;
  } catch (err) {
    console.error("Gagal load data:", err);
  }
}

async function deleteForm(id) {
  Swal.fire({
    title: "Hapus Form?",
    text: "Data tidak bisa dikembalikan",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    confirmButtonText: "Ya, Hapus"
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        await axios.delete(`${API}/${id}`);
        Swal.fire("Berhasil", "Form dihapus", "success");
        loadForms();
      } catch (err) {
        Swal.fire("Error", "Gagal menghapus data", "error");
      }
    }
  });
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);
  
  loadForms();
  
  // Jalankan pengecekan layar saat mount
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<style scoped>
.bg-light-soft {
  background: #f4f6f9;
}

.main-content-wrapper {
  overflow-x: hidden; /* Mencegah halaman goyang */
  width: 100%;
}

/* Mempercantik tampilan table responsive */
.table-responsive {
  scrollbar-width: thin; /* Untuk Firefox */
  scrollbar-color: #dee2e6 #fff;
}

/* Untuk Chrome/Edge/Safari scrollbar */
.table-responsive::-webkit-scrollbar {
  height: 6px;
}
.table-responsive::-webkit-scrollbar-thumb {
  background: #dee2e6;
  border-radius: 10px;
}

/* Pastikan kolom deskripsi tidak merusak layout jika teks terlalu panjang */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
