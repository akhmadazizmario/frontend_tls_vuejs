<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-4"
        :style="{
          marginLeft: sidebarOpen ? '16rem' : '0',
          marginTop: '56px'
        }"
      >
        <h3 class="fw-bold mb-4">🧯 Checklist APAR</h3>

        <div class="row g-4">
          <div
            class="col-md-4"
            v-for="apar in aparList"
            :key="apar.id"
          >
            <div
              class="card h-100 shadow-sm border-0 rounded-4 cursor-pointer"
              @click="goCheck(apar)"
            >
              <div class="card-body text-center">
                <h5 class="fw-bold mb-2">
                  {{ apar.kode_apar }}
                </h5>
                <span class="badge bg-primary mb-2">
                  {{ apar.kategori }}
                </span>

                <p class="text-muted small mb-0">
                  Kadaluarsa:
                  <strong>{{ formatDate(apar.tanggal_kadaluarsa) }}</strong>
                </p>
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();
const user = ref({});
const sidebarOpen = ref(false);
const aparList = ref([]);

const loadApar = async () => {
  const res = await axios.get(API + "/apartls");
  aparList.value = res.data;
};

const goCheck = (apar) => {
  router.push({
    name: "apar-check-form",
    params: { id: apar.id }
  });
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID") : "-";

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);

const logout = () => {
  localStorage.removeItem("user");
  location.href = "/login";
};

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);
  loadApar();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
