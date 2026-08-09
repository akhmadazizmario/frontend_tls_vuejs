<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-4"
        :style="{ marginLeft: sidebarOpen ? '16rem' : '0', marginTop: '56px' }"
      >
        <!-- HEADER -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 class="fw-bold mb-1">📊 Rekap Checklist APAR</h4>
            <small class="text-muted">
              Mode:
              <b>{{ mode === "harian" ? "Harian" : "Bulanan" }}</b>
            </small>
          </div>

          <div class="d-flex gap-2" v-if="mode === 'harian'">
            <button class="btn btn-outline-success btn-sm" @click="exportExcel">
              ⬇ Excel
            </button>
            <button class="btn btn-outline-danger btn-sm" @click="exportPDF">
              ⬇ PDF
            </button>
          </div>
        </div>

        <!-- FILTER -->
        <div class="card shadow-sm border-0 rounded-4 mb-4">
          <div class="card-body d-flex flex-wrap gap-3 align-items-end">
            <div class="btn-group">
              <button
                class="btn btn-sm"
                :class="mode === 'harian' ? 'btn-primary' : 'btn-outline-primary'"
                @click="mode='harian'; loadRekapHarian()"
              >
                📅 Harian
              </button>
              <button
                class="btn btn-sm"
                :class="mode === 'bulanan' ? 'btn-primary' : 'btn-outline-primary'"
                @click="mode='bulanan'; loadRekapBulanan()"
              >
                📆 Bulanan
              </button>
            </div>

            <!-- FILTER HARIAN -->
            <template v-if="mode === 'harian'">
              <div>
                <label class="form-label fw-semibold">Tanggal</label>
                <input type="date" v-model="filterTanggal" class="form-control" />
              </div>

              <div>
                <label class="form-label fw-semibold">Kode APAR</label>
                <input
                  type="text"
                  v-model="search"
                  class="form-control"
                  placeholder="A1 / A2"
                />
              </div>

              <button class="btn btn-primary px-4" @click="loadRekapHarian">
                🔍 Tampilkan
              </button>
            </template>

            <!-- FILTER BULANAN -->
            <template v-if="mode === 'bulanan'">
              <div>
                <label class="form-label fw-semibold">Bulan</label>
                <select v-model="filterBulan" class="form-select">
                  <option v-for="b in 12" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>

              <div>
                <label class="form-label fw-semibold">Tahun</label>
                <input type="number" v-model="filterTahun" class="form-control" />
              </div>

              <button class="btn btn-primary px-4" @click="loadRekapBulanan">
                🔍 Tampilkan
              </button>
            </template>
          </div>
        </div>

        <!-- ================= HARIAN ================= -->
        <div v-if="mode === 'harian'" class="card shadow border-0 rounded-4">
          <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle mb-0">
              <thead class="table-primary text-center">
                <tr>
                  <th width="60">No</th>
                  <th>Kode APAR</th>
                  <th width="140">Tanggal</th>
                  <th>Detail Checklist</th>
                  <th width="80">Aksi</th>
                </tr>
              </thead>

              <tbody v-if="paginatedData.length">
                <tr v-for="(row, i) in paginatedData" :key="i">
                  <td class="text-center fw-semibold">
                    {{ startIndex + i + 1 }}
                  </td>

                  <td class="fw-bold text-primary">
                    {{ row.kode_apar }}
                  </td>

                  <td class="text-center">
                    {{ row.tanggal }}
                  </td>

                  <!-- DETAIL -->
                  <td>
                    <div class="row g-2">
                      <div
                        v-for="(a, idx) in row.answers"
                        :key="idx"
                        class="col-md-6"
                      >
                        <div
                          class="d-flex justify-content-between align-items-center p-2 rounded border"
                        >
                          <span class="small">
                            {{ a.pertanyaan }}
                          </span>

                          <!-- BADGE STATUS -->
                          <span
                            class="badge"
                            :class="badgeClass(a.jawaban)"
                          >
                            {{ badgeText(a.jawaban) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="text-center">
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="hapus(row)"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr>
                  <td colspan="5" class="text-center py-4 text-muted">
                    Tidak ada data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PAGINATION -->
          <div class="d-flex justify-content-between px-3 py-2 border-top">
            <small class="text-muted">
              Halaman {{ currentPage }} / {{ totalPages }}
            </small>

            <div class="btn-group btn-group-sm">
              <button
                class="btn btn-outline-secondary"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                ‹
              </button>
              <button
                class="btn btn-outline-secondary"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <!-- ================= BULANAN ================= -->
        <div v-if="mode === 'bulanan'" class="card shadow border-0 rounded-4">
          <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle mb-0">
              <thead class="table-primary text-center">
                <tr>
                  <th>No</th>
                  <th>Kode APAR</th>
                  <th>Kategori</th>
                  <th>Total Hari Cek</th>
                  <th>Total Pertanyaan</th>
                  <th>Total OK</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(row, i) in rekapBulanan" :key="i">
                  <td class="text-center">{{ i + 1 }}</td>
                  <td class="fw-bold text-primary">
                    {{ row.apar.kode_apar }}
                  </td>
                  <td>{{ row.apar.kategori }}</td>
                  <td class="text-center">{{ row.total_hari_cek }}</td>

                  <!-- SUDAH DIHITUNG TANPA NON AKTIF -->
                  <td class="text-center">{{ row.total_pertanyaan }}</td>
                  <td class="text-center">
                    <span class="badge bg-success">
                      {{ row.total_ok }}
                    </span>
                  </td>
                </tr>

                <tr v-if="!rekapBulanan.length">
                  <td colspan="6" class="text-center py-4 text-muted">
                    Tidak ada data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL;

const user = ref({});
const sidebarOpen = ref(false);

const mode = ref("harian");

const filterTanggal = ref(new Date().toISOString().split("T")[0]);
const filterBulan = ref(new Date().getMonth() + 1);
const filterTahun = ref(new Date().getFullYear());
const search = ref("");

const rekap = ref([]);
const rekapBulanan = ref([]);

const currentPage = ref(1);
const perPage = 10;

/* ================= LOAD DATA ================= */

const loadRekapHarian = async () => {
  const res = await axios.get(`${API}/apartlscheck/rekap-harian`, {
    params: { tanggal: filterTanggal.value }
  });
  rekap.value = res.data;
  currentPage.value = 1;
};

const loadRekapBulanan = async () => {
  const res = await axios.get(`${API}/apartlscheck/rekap`, {
    params: {
      bulan: filterBulan.value,
      tahun: filterTahun.value
    }
  });
  rekapBulanan.value = res.data;
};

/* ================= FILTER & PAGINATION ================= */

const filteredData = computed(() =>
  rekap.value.filter(r =>
    r.kode_apar.toLowerCase().includes(search.value.toLowerCase())
  )
);

const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / perPage)
);

const startIndex = computed(() =>
  (currentPage.value - 1) * perPage
);

const paginatedData = computed(() =>
  filteredData.value.slice(
    startIndex.value,
    startIndex.value + perPage
  )
);

/* ================= BADGE ================= */

const badgeText = (val) => {
  if (val === 3) return "NON AKTIF";
  return val ? "OK" : "TIDAK";
};

const badgeClass = (val) => {
  if (val === 3) return "bg-secondary fst-italic";
  return val ? "bg-success" : "bg-danger";
};

/* ================= DELETE ================= */

const hapus = async (row) => {
  const confirm = await Swal.fire({
    title: "Hapus checklist?",
    text: `${row.kode_apar} - ${row.tanggal}`,
    icon: "warning",
    showCancelButton: true
  });

  if (!confirm.isConfirmed) return;

  await axios.delete(`${API}/apartlscheck/${row.apar_id}/${row.tanggal}`);
  Swal.fire("Berhasil", "Checklist dihapus", "success");
  loadRekapHarian();
};

/* ================= EXPORT ================= */

const exportExcel = () => {
  window.open(
    `${API}/apartlscheck/export-excel?tanggal=${filterTanggal.value}`,
    "_blank"
  );
};

const exportPDF = () => {
  window.open(
    `${API}/apartlscheck/export-pdf?tanggal=${filterTanggal.value}`,
    "_blank"
  );
};

/* ================= UI ================= */

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);

const logout = () => {
  localStorage.removeItem("user");
  location.href = "/login";
};

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);
  loadRekapHarian();
});
</script>




<!-- <template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-4"
        :style="{ marginLeft: sidebarOpen ? '16rem' : '0', marginTop: '56px' }"
      >
        
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 class="fw-bold mb-1">📊 Rekap Checklist APAR</h4>
            <small class="text-muted">
              Mode: <b>{{ mode === 'harian' ? 'Harian' : 'Bulanan' }}</b>
            </small>
          </div>

          <div class="d-flex gap-2" v-if="mode === 'harian'">
            <button class="btn btn-outline-success btn-sm" @click="exportExcel">
              ⬇ Excel
            </button>
            <button class="btn btn-outline-danger btn-sm" @click="exportPDF">
              ⬇ PDF
            </button>
          </div>
        </div>

       
        <div class="card shadow-sm border-0 rounded-4 mb-4">
          <div class="card-body d-flex flex-wrap gap-3 align-items-end">
            <div class="btn-group">
              <button
                class="btn btn-sm"
                :class="mode === 'harian' ? 'btn-primary' : 'btn-outline-primary'"
                @click="mode='harian'; loadRekapHarian()"
              >
                📅 Harian
              </button>
              <button
                class="btn btn-sm"
                :class="mode === 'bulanan' ? 'btn-primary' : 'btn-outline-primary'"
                @click="mode='bulanan'; loadRekapBulanan()"
              >
                📆 Bulanan
              </button>
            </div>

           
            <template v-if="mode === 'harian'">
              <div>
                <label class="form-label fw-semibold">Tanggal</label>
                <input type="date" v-model="filterTanggal" class="form-control" />
              </div>

              <div>
                <label class="form-label fw-semibold">Kode APAR</label>
                <input
                  type="text"
                  v-model="search"
                  class="form-control"
                  placeholder="A1 / A2"
                />
              </div>

              <button class="btn btn-primary px-4" @click="loadRekapHarian">
                🔍 Tampilkan
              </button>
            </template>

            
            <template v-if="mode === 'bulanan'">
              <div>
                <label class="form-label fw-semibold">Bulan</label>
                <select v-model="filterBulan" class="form-select">
                  <option v-for="b in 12" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>

              <div>
                <label class="form-label fw-semibold">Tahun</label>
                <input type="number" v-model="filterTahun" class="form-control" />
              </div>

              <button class="btn btn-primary px-4" @click="loadRekapBulanan">
                🔍 Tampilkan
              </button>
            </template>
          </div>
        </div>

        
        <div v-if="mode === 'harian'" class="card shadow border-0 rounded-4">
          <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle mb-0">
              <thead class="table-primary text-center">
                <tr>
                  <th width="60">No</th>
                  <th>Kode APAR</th>
                  <th width="140">Tanggal</th>
                  <th>Detail Checklist</th>
                  <th width="80">Aksi</th>
                </tr>
              </thead>

              <tbody v-if="paginatedData.length">
                <tr v-for="(row, i) in paginatedData" :key="i">
                  <td class="text-center fw-semibold">
                    {{ startIndex + i + 1 }}
                  </td>

                  <td class="fw-bold text-primary">
                    {{ row.kode_apar }}
                  </td>

                  <td class="text-center">
                    {{ row.tanggal }}
                  </td>

                  
                  <td>
                    <div class="row g-2">
                      <div
                        v-for="(a, idx) in row.answers"
                        :key="idx"
                        class="col-md-6"
                      >
                        <div
                          class="d-flex justify-content-between align-items-center p-2 rounded border"
                        >
                          <span class="small">{{ a.pertanyaan }}</span>
                          <span
                            class="badge"
                            :class="a.jawaban ? 'bg-success' : 'bg-danger'"
                          >
                            {{ a.jawaban ? 'OK' : 'TIDAK' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="text-center">
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="hapus(row)"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr>
                  <td colspan="5" class="text-center py-4 text-muted">
                    Tidak ada data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          
          <div class="d-flex justify-content-between px-3 py-2 border-top">
            <small class="text-muted">
              Halaman {{ currentPage }} / {{ totalPages }}
            </small>

            <div class="btn-group btn-group-sm">
              <button
                class="btn btn-outline-secondary"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                ‹
              </button>
              <button
                class="btn btn-outline-secondary"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                ›
              </button>
            </div>
          </div>
        </div>

       
        <div v-if="mode === 'bulanan'" class="card shadow border-0 rounded-4">
          <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle mb-0">
              <thead class="table-primary text-center">
                <tr>
                  <th>No</th>
                  <th>Kode APAR</th>
                  <th>Kategori</th>
                  <th>Total Hari Cek</th>
                  <th>Total Pertanyaan</th>
                  <th>Total OK</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(row, i) in rekapBulanan" :key="i">
                  <td class="text-center">{{ i + 1 }}</td>
                  <td class="fw-bold text-primary">{{ row.apar.kode_apar }}</td>
                  <td>{{ row.apar.kategori }}</td>
                  <td class="text-center">{{ row.total_hari_cek }}</td>
                  <td class="text-center">{{ row.total_pertanyaan }}</td>
                  <td class="text-center">
                    <span class="badge bg-success">
                      {{ row.total_ok }}
                    </span>
                  </td>
                </tr>

                <tr v-if="!rekapBulanan.length">
                  <td colspan="6" class="text-center py-4 text-muted">
                    Tidak ada data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <Footer />
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL;

const user = ref({});
const sidebarOpen = ref(false);

/* MODE */
const mode = ref("harian");

/* FILTER */
const filterTanggal = ref(new Date().toISOString().split("T")[0]);
const filterBulan = ref(new Date().getMonth() + 1);
const filterTahun = ref(new Date().getFullYear());
const search = ref("");

/* DATA */
const rekap = ref([]);
const rekapBulanan = ref([]);

/* PAGINATION */
const currentPage = ref(1);
const perPage = 10;

/* LOAD HARIAN */
const loadRekapHarian = async () => {
  try {
    const res = await axios.get(`${API}/apartlscheck/rekap-harian`, {
      params: { tanggal: filterTanggal.value }
    });
    rekap.value = res.data;
    currentPage.value = 1;
  } catch {
    Swal.fire("Error", "Gagal memuat rekap harian", "error");
  }
};

/* LOAD BULANAN */
const loadRekapBulanan = async () => {
  try {
    const res = await axios.get(`${API}/apartlscheck/rekap`, {
      params: {
        bulan: filterBulan.value,
        tahun: filterTahun.value
      }
    });
    rekapBulanan.value = res.data;
  } catch {
    Swal.fire("Error", "Gagal memuat rekap bulanan", "error");
  }
};

/* FILTER */
const filteredData = computed(() =>
  rekap.value.filter(r =>
    r.kode_apar.toLowerCase().includes(search.value.toLowerCase())
  )
);

/* PAGINATED */
const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / perPage)
);

const startIndex = computed(() =>
  (currentPage.value - 1) * perPage
);

const paginatedData = computed(() =>
  filteredData.value.slice(
    startIndex.value,
    startIndex.value + perPage
  )
);

/* DELETE */
const hapus = async (row) => {
  const confirm = await Swal.fire({
    title: "Hapus checklist?",
    text: `${row.kode_apar} - ${row.tanggal}`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Hapus",
    cancelButtonText: "Batal"
  });

  if (!confirm.isConfirmed) return;

  await axios.delete(`${API}/apartlscheck/${row.apar_id}/${row.tanggal}`);
  Swal.fire("Berhasil", "Checklist dihapus", "success");
  loadRekapHarian();
};

/* EXPORT */
const exportExcel = () => {
  window.open(
    `${API}/apartlscheck/export-excel?tanggal=${filterTanggal.value}`,
    "_blank"
  );
};
const exportPDF = () => {
  window.open(
    `${API}/apartlscheck/export-pdf?tanggal=${filterTanggal.value}`,
    "_blank"
  );
};

/* UI */
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => {
  localStorage.removeItem("user");
  location.href = "/login";
};

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);
  loadRekapHarian();
});
</script> -->




