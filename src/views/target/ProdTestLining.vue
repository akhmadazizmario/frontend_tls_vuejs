<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-3 p-md-4"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          marginTop: '56px',
        }"
      >
        <div class="container-fluid">

          <h4 class="fw-bold text-success mb-3">
            📊 PROD IDP LINING
          </h4>

          <!-- ================= FILTER ================= -->
          <div class="card shadow-sm mb-3">
            <div class="card-body">
              <div class="row g-2 align-items-end">

                <div class="col-md-3">
                  <label class="form-label">Begin Date</label>
                  <input type="date" v-model="filters.pBeginDate" class="form-control">
                </div>

                <div class="col-md-3">
                  <label class="form-label">End Date</label>
                  <input type="date" v-model="filters.pEndDate" class="form-control">
                </div>

                <!-- PO AUTOCOMPLETE -->
                <div class="col-md-3 position-relative">
                  <label class="form-label">PO</label>
                  <input
                    type="text"
                    v-model="filters.pPO"
                    class="form-control"
                    placeholder="Ketik PO..."
                    autocomplete="off"
                    @input="searchPO"
                    @focus="searchPO"
                  >

                  <!-- DROPDOWN -->
                  <ul
                    v-if="showPoDropdown"
                    class="list-group position-absolute w-100 shadow"
                    style="z-index: 1000; max-height: 220px; overflow-y: auto;"
                  >
                    <li
                      v-for="(po, i) in poOptions"
                      :key="i"
                      class="list-group-item list-group-item-action"
                      style="cursor: pointer"
                      @click="selectPO(po)"
                    >
                      <div class="fw-bold">{{ po.xPO }}</div>
                      <small class="text-muted">
                        {{ po.xSetCode }} | {{ po.xPOMark }} | {{ po.xSecKind }}
                      </small>
                    </li>
                  </ul>
                </div>

                <div class="col-md-3">
                  <button
                    class="btn btn-success w-100"
                    @click="loadData"
                    :disabled="loading"
                  >
                    🔍 Cari Data
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- ================= LOADING ================= -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-success"></div>
          </div>

          <!-- ================= TABLE ================= -->
          <div v-if="dataLoaded && !loading" class="card shadow-sm">
            <div class="table-responsive">
              <table class="table table-bordered table-sm text-nowrap align-middle mb-0">
                <thead class="table-light text-center">
                  <tr>
                    <th rowspan="2">IDP</th>
                    <th rowspan="2">Buyer</th>
                    <th rowspan="2">Color</th>
                    <th rowspan="2">Type</th>
                    <th rowspan="2">Kind</th>
                    <th rowspan="2">ITEM</th>
                    <th rowspan="2">Process</th>
                    <th v-for="s in sizes" :key="s" colspan="2">{{ s }}</th>
                    <th rowspan="2">TTL Today</th>
                    <th rowspan="2">TTL Akum</th>
                  </tr>
                  <tr>
                    <template v-for="s in sizes" :key="s">
                      <th>Today</th>
                      <th>TTI</th>
                    </template>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(row, i) in sortedItems"
                    :key="i"
                    :class="rowClass(row)"
                  >
                    <td>{{ row.xPO }}</td>
                    <td>{{ row.xBuyer }}</td>
                    <td>{{ row.xMColor }}</td>
                    <td class="text-center">{{ row.xType }}</td>
                    <td class="text-center">{{ row.xKind }}</td>
                    <td>{{ row.xName }}</td>
                    <td>{{ row.xWorkName }}</td>

                    <td class="text-end">{{ show(row.xO1) }}</td>
                    <td class="text-end">{{ show(row.xTO1) }}</td>
                    <td class="text-end">{{ show(row.xO2) }}</td>
                    <td class="text-end">{{ show(row.xTO2) }}</td>
                    <td class="text-end">{{ show(row.xO3) }}</td>
                    <td class="text-end">{{ show(row.xTO3) }}</td>
                    <td class="text-end">{{ show(row.xO4) }}</td>
                    <td class="text-end">{{ show(row.xTO4) }}</td>
                    <td class="text-end">{{ show(row.xO5) }}</td>
                    <td class="text-end">{{ show(row.xTO5) }}</td>
                    <td class="text-end">{{ show(row.xO6) }}</td>
                    <td class="text-end">{{ show(row.xTO6) }}</td>
                    <td class="text-end">{{ show(row.xO7) }}</td>
                    <td class="text-end">{{ show(row.xTO7) }}</td>
                    <td class="text-end">{{ show(row.xO8) }}</td>
                    <td class="text-end">{{ show(row.xTO8) }}</td>
                    <td class="text-end">{{ show(row.xO9) }}</td>
                    <td class="text-end">{{ show(row.xTO9) }}</td>
                    <td class="text-end">{{ show(row.xO10) }}</td>
                    <td class="text-end">{{ show(row.xTO10) }}</td>
                    <td class="text-end">{{ show(row.xO11) }}</td>
                    <td class="text-end">{{ show(row.xTO11) }}</td>
                    <td class="text-end">{{ show(row.xO12) }}</td>
                    <td class="text-end">{{ show(row.xTO12) }}</td>
                    <td class="text-end">{{ show(row.xO13) }}</td>
                    <td class="text-end">{{ show(row.xTO13) }}</td>
                    <td class="text-end">{{ show(row.xO14) }}</td>
                    <td class="text-end">{{ show(row.xTO14) }}</td>
                                            <td class="text-end">
  {{
    show(
      Number(row.xO1|| 0) +
      Number(row.xO2 || 0) +
      Number(row.xO3 || 0) +
      Number(row.xO4 || 0) +
      Number(row.xO5 || 0) +
      Number(row.xO6 || 0) +
      Number(row.xO7 || 0) +
      Number(row.xO8 || 0) +
      Number(row.xO9 || 0) +
      Number(row.xO10 || 0) +
      Number(row.xO11 || 0) +
      Number(row.xO12 || 0) +
      Number(row.xO13 || 0) +
      Number(row.xO14 || 0)
    )
  }}
</td>

                        <td class="text-end">
  {{
    show(
      Number(row.xTO1|| 0) +
      Number(row.xTO2 || 0) +
      Number(row.xTO3 || 0) +
      Number(row.xTO4 || 0) +
      Number(row.xTO5 || 0) +
      Number(row.xTO6 || 0) +
      Number(row.xTO7 || 0) +
      Number(row.xTO8 || 0) +
      Number(row.xTO9 || 0) +
      Number(row.xTO10 || 0) +
      Number(row.xTO11 || 0) +
      Number(row.xTO12 || 0) +
      Number(row.xTO13 || 0) +
      Number(row.xTO14 || 0)
    )
  }}
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";

import Header from "../../components/Header.vue";
import Sidebar from "../../components/Sidebar.vue";
import Footer from "../../components/Footer.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const loading = ref(false);
const dataLoaded = ref(false);
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

const user = ref({ name: "Pengguna" });
const allRawItems = ref([]);

const sizes = ["", "", "XXS", "XS", "S", "M", "L", "XL", "XXL", "", "", "", "", "" ];

const filters = ref({
  pBeginDate: "",
  pEndDate: "",
  pPO: "",
});

/* ================= PO AUTOCOMPLETE ================= */
const poOptions = ref([]);
const showPoDropdown = ref(false);
let poTimer = null;

const searchPO = () => {
  const q = filters.value.pPO;

  if (!q || q.length < 2) {
    poOptions.value = [];
    showPoDropdown.value = false;
    return;
  }

  clearTimeout(poTimer);
  poTimer = setTimeout(async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/test-lining/xpo/search`,
        { params: { q } }
      );
      poOptions.value = res.data.data || [];
      showPoDropdown.value = poOptions.value.length > 0;
    } catch (err) {
      console.error(err);
      showPoDropdown.value = false;
    }
  }, 300);
};

const selectPO = (po) => {
  filters.value.pPO = po.xPO;
  showPoDropdown.value = false;
};

/* ================= LOAD DATA ================= */
const loadData = async () => {
  if (!filters.value.pBeginDate || !filters.value.pEndDate) {
    alert("Tanggal wajib diisi");
    return;
  }

  loading.value = true;
  dataLoaded.value = false;

  try {
    const res = await axios.get(
      `${API_BASE_URL}/test-lining/prod-test-lining`,
      {
        params: {
          ...filters.value,
          pIsPO: filters.value.pPO ? 1 : 0,
        },
      }
    );
    allRawItems.value = res.data.data || [];
    dataLoaded.value = true;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

/* ================= SORTING ================= */
const sortedItems = computed(() => {
  return [...allRawItems.value].sort((a, b) => {
    if (a.xMColor !== b.xMColor) {
      if (a.xMColor === "Summary") return -1;
      if (b.xMColor === "Summary") return 1;
      return a.xMColor.localeCompare(b.xMColor);
    }

    if (a.xType !== b.xType) return a.xType - b.xType;

    const aTotal = a.xWorkName.includes("TOTAL");
    const bTotal = b.xWorkName.includes("TOTAL");
    if (aTotal !== bTotal) return aTotal ? -1 : 1;

    const aRemain = a.xWorkName.includes("Remain");
    const bRemain = b.xWorkName.includes("Remain");
    if (aRemain !== bRemain) return aRemain ? 1 : -1;

    return a.xWorkName.localeCompare(b.xWorkName);
  });
});

const rowClass = (row) => {
  if (row.xWorkName.includes("Remain")) return "table-success fw-bold";
  if (row.xWorkName.includes("TOTAL")) return "table-primary fw-bold";
  return "";
};

const show = (v) => (v && v !== 0 ? v : "");

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);

const onResize = () => (windowWidth.value = window.innerWidth);

const handleClickOutside = (e) => {
  if (!e.target.closest(".position-relative")) {
    showPoDropdown.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", onResize);
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.table td,
.table th {
  font-size: 12px;
  padding: 4px 6px;
}

.table-primary {
  background-color: #e0f2fe !important;
}

.table-success {
  background-color: #dcfce7 !important;
}
</style>
