<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-4" :style="{ marginTop: '56px' }">
        <div class="container">

          <h2 class="fw-bold mb-4">📝 Form Inspection Cleaning</h2>

          <div class="card shadow-sm rounded-4 p-4">

            <!-- CATEGORY -->
            <div class="mb-3">
              <label>Category</label>
              <select v-model="form.category_id" class="form-select" @change="loadQuestions" required>
                <option disabled value="">-- Pilih Category --</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <!-- TANGGAL -->
            <div class="mb-3">
              <label>Tanggal Inspection</label>
              <input type="date" v-model="form.inspection_date" class="form-control" required />
            </div>

            <!-- QUESTIONS -->
            <div v-if="questions.length">
              <hr />
              <h5>Checklist:</h5>

              <div v-for="(q, index) in questions" :key="q.id" class="mb-4 p-3 border rounded">

                <strong>{{ index + 1 }}. {{ q.question_text }}</strong>

                <div class="mt-2">
                  <label class="me-3">
                    <input type="radio"
                           :name="'answer_' + q.id"
                           value="Ya"
                           v-model="answers[q.id].answer" /> Ya
                  </label>

                  <label>
                    <input type="radio"
                           :name="'answer_' + q.id"
                           value="Tidak"
                           v-model="answers[q.id].answer" /> Tidak
                  </label>
                </div>

                <textarea
                  class="form-control mt-2"
                  placeholder="Catatan (optional)"
                  v-model="answers[q.id].note"
                ></textarea>

              </div>
            </div>

            <div class="text-end">
              <button class="btn btn-primary" @click="submitInspection">
                Simpan Inspection
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
import { ref, reactive, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL;

const user = ref({});
const sidebarOpen = ref(false);

const categories = ref([]);
const questions = ref([]);

const form = reactive({
  category_id: "",
  inspection_date: "",
});

const answers = reactive({});

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/login";
}

async function loadCategories() {
  const res = await axios.get(`${API}/categoriescleaning`);
  categories.value = res.data.filter(c => c.is_active);
}

async function loadQuestions() {
  const res = await axios.get(`${API}/questionscleaning`);
  questions.value = res.data.filter(q =>
    q.category_id === form.category_id && q.is_active
  );

  questions.value.forEach(q => {
    answers[q.id] = {
      question_id: q.id,
      answer: "",
      note: ""
    };
  });
}

async function submitInspection() {
  try {
    const payload = {
      user_id: user.value.id,
      category_id: form.category_id,
      inspection_date: form.inspection_date,
      answers: Object.values(answers)
    };

    await axios.post(`${API}/inspectioncleaning`, payload);

    Swal.fire("Berhasil", "Inspection berhasil disimpan", "success");

    form.category_id = "";
    form.inspection_date = "";
    questions.value = [];

  } catch (err) {
    Swal.fire("Error", "Gagal menyimpan inspection", "error");
  }
}

onMounted(() => {
  user.value = JSON.parse(localStorage.getItem("user"));
  loadCategories();
});
</script>