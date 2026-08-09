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

          <h4 class="fw-bold text-primary mb-3">
            🧶 PROD PANEL MATCHING CONTROL
          </h4>

          <!-- ================= FILTER ================= -->
          <div class="card shadow-sm mb-3">
            <div class="card-body">
              <div class="row g-2 align-items-end">

                <div class="col-md-3">
                  <label class="form-label">Begin Date</label>
                  <input type="date" v-model="filters.start_date" class="form-control">
                </div>

                <div class="col-md-3">
                  <label class="form-label">End Date</label>
                  <input type="date" v-model="filters.end_date" class="form-control">
                </div>

                <!-- PO AUTOCOMPLETE -->
                <div class="col-md-3 position-relative">
                  <label class="form-label">IDP</label>
                  <input
                    type="text"
                    v-model="filters.po"
                    class="form-control"
                    placeholder="Ketik PO..."
                    autocomplete="off"
                    @input="searchPO"
                    @focus="searchPO"
                  >

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
                      {{ po.xPO }}
                    </li>
                  </ul>
                </div>

                <div class="col-md-3">
                  <label class="form-label">Buyer</label>
                  <input
                    type="text"
                    v-model="filters.symbol"
                    class="form-control"
                    placeholder="PL-GAP"
                  >
                </div>

                <div class="col-md-12">
                  <button
                    class="btn btn-primary w-100 mt-2"
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
            <div class="spinner-border text-primary"></div>
          </div>

          <!-- ================= TABLE ================= -->
          <div v-if="dataLoaded && !loading" class="card shadow-sm">
            <div class="table-responsive">
              <table class="table table-bordered table-sm text-nowrap align-middle mb-0">
                <thead class="table-light text-center">
                  <tr>
                    <th>Buyer</th>
                    <th>IDP</th>
                    <th>IDP SET</th>
                    <th>Color</th>
                    <th>Main Lot</th>
                    <th>Size</th>
                    <th>Line</th>
                    <th>Process</th>
                    <th>Mater</th>
                    <th>Issue</th>
                    <th>Recvd</th>
                    <th>Knitt Start</th>
                    <th>Linking Start</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(row, i) in allItems" :key="i">
                    <td>{{ row.xSymbol }}</td>
                    <td>{{ row.xPO }}</td>
                    <td>{{ row.xPOL }}</td>
                    <td>{{ row.xMColor }}</td>
                    <td>{{ row.xLot }}</td>
                    <td class="text-center">{{ row.xSize }}</td>
                    <td>{{ row.xLINE }}</td>
                    <td>{{ row.xProcess }}</td>
                    <td class="text-end">{{ show(row.xMQty) }}</td>
                    <td class="text-end">{{ show(row.xIQty) }}</td>
                    <td class="text-end fw-bold">{{ show(row.xKQty) }}</td>
                    <td>{{ formatDate(row.xK_Start) }}</td>
                    <td>{{ formatDate(row.xL_Start) }}</td>
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
import { ref, onMounted, onUnmounted } from "vue";
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
const allItems = ref([]);

const filters = ref({
  start_date: "",
  end_date: "",
  po: "",
  symbol: ""
});

/* ================= PO AUTOCOMPLETE ================= */
const poOptions = ref([]);
const showPoDropdown = ref(false);
let poTimer = null;

const searchPO = () => {
  if (!filters.value.po || filters.value.po.length < 2) {
    showPoDropdown.value = false;
    return;
  }

  clearTimeout(poTimer);
  poTimer = setTimeout(async () => {
    const res = await axios.get(
      `${API_BASE_URL}/test-lining/xpo/search`,
      { params: { q: filters.value.po } }
    );
    poOptions.value = res.data.data || [];
    showPoDropdown.value = true;
  }, 300);
};

const selectPO = (po) => {
  filters.value.po = po.xPO;
  showPoDropdown.value = false;
};

/* ================= LOAD DATA ================= */
const loadData = async () => {
  if (!filters.value.start_date || !filters.value.end_date) {
    alert("Tanggal wajib diisi");
    return;
  }

  loading.value = true;
  dataLoaded.value = false;

  try {
    const res = await axios.get(
      `${API_BASE_URL}/knitting-match/knit-matching`,
      { params: filters.value }
    );
    allItems.value = res.data.data || [];
    dataLoaded.value = true;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

/* ================= UTIL ================= */
const show = (v) => (v && v !== 0 ? v : "");
const formatDate = (d) => (d ? d.substring(0, 10) : "");
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const onResize = () => (windowWidth.value = window.innerWidth);

onMounted(() => window.addEventListener("resize", onResize));
onUnmounted(() => window.removeEventListener("resize", onResize));
</script>
