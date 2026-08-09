<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-4"
        :style="{ marginLeft: sidebarOpen ? '16rem' : '0', marginTop: '56px' }"
      >
        <!-- TITLE -->
        <div class="mb-4">
          <h4 class="fw-bold mb-1">🧯 Checklist Pemeriksaan APAR</h4>
          <p class="text-muted mb-0">Form pemeriksaan harian APAR</p>
        </div>

        <!-- APAR INFO -->
        <div class="card border-0 shadow-sm rounded-4 mb-4">
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <small class="text-muted">Kode APAR</small>
                <div class="fw-bold fs-5 text-primary">
                  {{ apar.kode_apar || "-" }}
                </div>
              </div>

              <div class="col-md-4">
                <small class="text-muted">Kategori</small>
                <div class="fw-semibold">
                  {{ apar.kategori || "-" }}
                </div>
              </div>

              <div class="col-md-4">
                <small class="text-muted">Tanggal Pemeriksaan</small>
                <input
                  type="date"
                  v-model="tanggal"
                  class="form-control mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- QUESTIONS -->
        <div class="card border-0 shadow rounded-4">
          <div class="card-body">
            <div
              v-for="(q, index) in questions"
              :key="q.id"
              class="border-bottom py-3"
            >
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <span class="fw-semibold me-2">{{ index + 1 }}.</span>
                  {{ q.pertanyaan }}
                </div>

                <div class="btn-group">
                  <input
                    type="radio"
                    class="btn-check"
                    :name="'q' + q.id"
                    :id="'yes' + q.id"
                    :value="true"
                    v-model="answers[q.id]"
                  />
                  <label class="btn btn-outline-success btn-sm" :for="'yes' + q.id">
                    ✔ Ya
                  </label>

                  <input
                    type="radio"
                    class="btn-check"
                    :name="'q' + q.id"
                    :id="'no' + q.id"
                    :value="false"
                    v-model="answers[q.id]"
                  />
                  <label class="btn btn-outline-danger btn-sm" :for="'no' + q.id">
                    ✖ Tidak
                  </label>
                </div>
              </div>
            </div>

            <div class="text-end mt-4">
              <button class="btn btn-primary px-4" @click="submit">
                <i class="bi bi-save me-1"></i> Simpan Checklist
              </button>
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
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL;

const route = useRoute();
const router = useRouter();

/* ======================
   STATE
====================== */
const user = ref({});
const sidebarOpen = ref(false);

const aparId = route.params.id;
const apar = ref({});

const tanggal = ref(new Date().toISOString().split("T")[0]);

// QUESTIONS
const allQuestions = ref([]);   // semua dari API
const questions = ref([]);      // hanya aktif (is_active = 1)
const answers = ref({});        // jawaban (true / false / 3)

/* ======================
   LOAD APAR
====================== */
const loadApar = async () => {
  try {
    const res = await axios.get(`${API}/apartls/${aparId}`);
    apar.value = res.data;
  } catch {
    Swal.fire("Error", "Gagal memuat data APAR", "error");
  }
};

/* ======================
   LOAD QUESTIONS
====================== */
const loadQuestions = async () => {
  try {
    const res = await axios.get(`${API}/apartlsquestion`);
    allQuestions.value = res.data;

    // 🔥 PENTING: is_active dari API biasanya STRING
    questions.value = res.data.filter(
      q => Number(q.is_active) === 1
    );

    // inisialisasi jawaban
    res.data.forEach(q => {
      if (Number(q.is_active) === 1) {
        // question aktif → wajib dijawab
        answers.value[q.id] = null;
      } else {
        // question nonaktif → otomatis jawaban_dinonaktifkan
        answers.value[q.id] = 3;
      }
    });

  } catch {
    Swal.fire("Error", "Gagal memuat pertanyaan", "error");
  }
};

/* ======================
   SUBMIT
====================== */
const submit = async () => {
  // validasi: semua question aktif harus dijawab
  const belumDijawab = questions.value.find(
    q => answers.value[q.id] === null
  );

  if (belumDijawab) {
    return Swal.fire(
      "Perhatian",
      "Semua pertanyaan aktif harus dijawab",
      "warning"
    );
  }

  const payload = {
    apar_id: Number(aparId),
    tanggal: tanggal.value,
    answers: Object.keys(answers.value).map(id => ({
      question_id: Number(id),
      jawaban: answers.value[id] // true / false / 3
    }))
  };

  try {
    const res = await axios.post(`${API}/apartlscheck`, payload);

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: res.data.message,
      timer: 1500,
      showConfirmButton: false
    });

    setTimeout(() => {
      router.push({ name: "apar-check-index" });
    }, 1500);

  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.message || "Checklist gagal disimpan",
      "error"
    );
  }
};

/* ======================
   UI
====================== */
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const logout = () => {
  localStorage.removeItem("user");
  location.href = "/login";
};

/* ======================
   MOUNTED
====================== */
onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);

  loadApar();
  loadQuestions();
});
</script>



<!-- <script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL;

const route = useRoute();
const router = useRouter();

const user = ref({});
const sidebarOpen = ref(false);

const aparId = route.params.id;
const apar = ref({});

const tanggal = ref(new Date().toISOString().split("T")[0]);
const questions = ref([]);
const answers = ref({});

/* LOAD DATA */
const loadApar = async () => {
  const res = await axios.get(`${API}/apartls/${aparId}`);
  apar.value = res.data;
};

const loadQuestions = async () => {
  const res = await axios.get(`${API}/apartlsquestion`);
  questions.value = res.data;

  res.data.forEach(q => {
    answers.value[q.id] = null;
  });
};

/* SUBMIT */
const submit = async () => {
  const payload = {
    apar_id: Number(aparId),
    tanggal: tanggal.value,
    answers: Object.keys(answers.value).map(id => ({
      question_id: Number(id),
      jawaban: Boolean(answers.value[id])
    }))
  };

  try {
    const res = await axios.post(`${API}/apartlscheck`, payload);

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: res.data.message,
      timer: 1500,
      showConfirmButton: false
    });

    setTimeout(() => {
      router.push({ name: "apar-check-index" });
    }, 1500);
  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.message || "Checklist gagal",
      "error"
    );
  }
};

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const logout = () => {
  localStorage.removeItem("user");
  location.href = "/login";
};

onMounted(() => {
  const u = localStorage.getItem("user");
  if (u) user.value = JSON.parse(u);

  loadApar();
  loadQuestions();
});
</script> -->
