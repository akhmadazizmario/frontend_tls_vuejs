<template>
  <div class="d-flex flex-column min-vh-100 bg-light-subtle">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-5"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px',
        }"
      >
        <div class="container-fluid">
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white p-4 d-flex justify-content-between align-items-center">
              <h4 class="mb-0 fw-bold">📊 Laporan PROD4</h4>
            </div>

            <div class="card-body p-4">
              <!-- Filter -->
              <form @submit.prevent="getData" class="mb-4">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label fw-semibold">Dari Tanggal:</label>
                    <input type="date" v-model="filters.pBeginDate" class="form-control" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-semibold">Sampai Tanggal:</label>
                    <input type="date" v-model="filters.pEndDate" class="form-control" />
                  </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                  <button type="submit" class="btn btn-primary">
                    <i class="bi bi-search me-2"></i>Tampilkan
                  </button>
                  <button type="button" @click="resetFilter" class="btn btn-secondary">
                    <i class="bi bi-x-circle me-2"></i>Reset
                  </button>
                </div>
              </form>

              <!-- Table -->
               <div v-if="loading" class="text-center py-5">
    <video
      autoplay
      muted
      loop
      playsinline
      style="width: 180px; height: auto; border-radius: 12px;"
    >
      <source src="/loading.mp4" type="video/mp4" />
      Browser kamu tidak mendukung video tag.
    </video>
    <div class="mt-3 text-muted fs-5">
      Memuat data, harap tunggu...
    </div>
  </div>
              <div v-else>
                <div v-if="groupedData.length > 0" class="table-responsive">
                  <table class="table table-bordered align-middle text-center">
                    <thead class="table-light align-middle">
                      <tr>
                        <th rowspan="2">NO</th>
                        <th rowspan="2">DEL</th>
                        <th rowspan="2">STYLE</th>
                        <th rowspan="2">PO</th>
                        <th rowspan="2">Keb</th>
                        <th rowspan="2">Process</th>
                        <th colspan="2">Finish</th>
                        <th rowspan="2">Kekurangan</th>
                      </tr>
                      <tr>
                        <th>Today</th>
                        <th>TTL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(group, index) in groupedData" :key="group.xMark">
                        <!-- Baris pertama -->
                        <tr>
                          <td :rowspan="group.processes.length">{{ index + 1 }}</td>
                          <td :rowspan="group.processes.length"></td>
                          <td :rowspan="group.processes.length" class="fw-semibold text-start">
                            {{ group.xMark }}
                          </td>
                          <td :rowspan="group.processes.length"></td>
                          <td :rowspan="group.processes.length"></td>

                          <td>{{ group.processes[0].xProcess }}</td>
                          <td>{{ formatNumber(group.processes[0].xTLS_Qty) }}</td>
                          <td>{{ formatNumber(group.processes[0].tTLS_Qty) }}</td>
                          <td></td>
                        </tr>

                        <!-- Baris lanjutan -->
                        <tr
                          v-for="(proc, i) in group.processes.slice(1)"
                          :key="i"
                        >
                          <td>{{ proc.xProcess }}</td>
                          <td>{{ formatNumber(proc.xTLS_Qty) }}</td>
                          <td>{{ formatNumber(proc.tTLS_Qty) }}</td>
                          <td></td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>

                <div v-else class="alert alert-info text-center mt-4">
                  Tidak ada data ditemukan.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const filters = ref({
  pBeginDate: "",
  pEndDate: "",
});

const loading = ref(false);
const data = ref([]);
const groupedData = ref([]);

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}
function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

const formatNumber = (num) => (num ? Number(num).toLocaleString("id-ID") : "0");

// 🔹 Group dan urutkan berdasarkan xMark (STYLE)
const groupByXMark = (arr) => {
  const grouped = {};

  arr.forEach((item) => {
    if (!grouped[item.xMark]) grouped[item.xMark] = [];
    grouped[item.xMark].push(item);
  });

  const filtered = Object.keys(grouped)
    .map((xMark) => ({
      xMark,
      processes: grouped[xMark],
    }))
    // Hanya tampil jika ada Today/TTL > 0
    .filter((group) =>
      group.processes.some(
        (proc) => Number(proc.xTLS_Qty) > 0 || Number(proc.tTLS_Qty) > 0
      )
    )
    // Urutkan STYLE (xMark) secara alfabet / angka
    .sort((a, b) => a.xMark.localeCompare(b.xMark, "en", { numeric: true }));

  groupedData.value = filtered;
};

const getData = async () => {
  if (!filters.value.pBeginDate || !filters.value.pEndDate) {
    alert("Pilih tanggal terlebih dahulu!");
    return;
  }
  loading.value = true;
  try {
    const res = await axios.get(`${API_BASE_URL}/target/getprod4a`, {
      params: filters.value,
    });
    data.value = res.data.data || [];
    groupByXMark(data.value);
  } catch (err) {
    console.error("Error getData:", err);
    alert("Gagal mengambil data!");
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  filters.value = { pBeginDate: "", pEndDate: "" };
  data.value = [];
  groupedData.value = [];
};
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}
.table td {
  white-space: nowrap;
}
</style>
