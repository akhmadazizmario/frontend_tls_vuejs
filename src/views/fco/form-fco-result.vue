<template>
  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1 text-dark">📊 Hasil Survey</h2>
        <p class="text-muted small">Laporan detail tanggapan responden secara real-time.</p>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-success btn-sm d-flex align-items-center gap-2 px-3 shadow-sm" @click="downloadExcel">
          <i class="bi bi-file-earmark-excel"></i> Excel
        </button>
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 shadow-sm" @click="$router.back()">
          <i class="bi bi-arrow-left"></i> Kembali
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted mt-2">Menyusun laporan...</p>
    </div>

    <div v-else-if="data">
      <div class="row g-3 mb-5">
  <div class="col-md-4">
    <div class="card border-0 shadow-sm rounded-4 bg-primary text-white h-100">
      <div class="card-body p-4 text-center d-flex flex-column justify-content-center">
        <label class="text-uppercase fw-bold small opacity-75 ls-1 mb-1">Total Responden</label>
        <h1 class="display-3 fw-bold mb-0">{{ data.totalRespondents || 0 }}</h1>
      </div>
    </div>
  </div>

  <div class="col-md-8">
    <div class="card border-0 shadow-sm rounded-4 bg-white h-100">
      <div class="card-body p-4">
        <label class="text-muted small text-uppercase fw-bold ls-1 mb-2 d-block">Detail Survey</label>
        <h4 class="fw-bold text-dark mb-1">{{ data.title }}</h4>
        <p class="text-muted mb-4">{{ data.description }}</p>
        
        <hr class="opacity-25 mb-4">

        <div class="d-flex justify-content-between align-items-center mb-2">
          <label class="text-muted small text-uppercase fw-bold ls-1">Responden Terdaftar</label>
          <button 
            class="btn btn-sm btn-link text-decoration-none fw-bold p-0" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#collapseResponden" 
            aria-expanded="false"
          >
            Lihat Semua <i class="bi bi-chevron-down ms-1"></i>
          </button>
        </div>

        <div class="collapse" id="collapseResponden">
          <div class="mt-3">
            <div v-if="data.respondents && data.respondents.length" class="d-flex flex-wrap gap-2">
              <span 
                v-for="(name, i) in data.respondents" 
                :key="i" 
                class="badge bg-light text-dark border fw-medium rounded-pill px-3 py-2 shadow-sm-hover"
              >
                <i class="bi bi-person me-1"></i> {{ name }}
              </span>
            </div>
            <div v-else class="fst-italic text-muted small">Belum ada responden.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      <div class="accordion accordion-flush custom-accordion" id="surveyAccordion">
        
        <div v-if="nikQuestion" class="accordion-item mb-3 rounded-4 shadow-sm border-0 overflow-hidden">
          <h2 class="accordion-header">
            <button class="accordion-button fw-bold bg-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseNIK">
              <span class="icon-box bg-dark text-white me-3"><i class="bi bi-person-badge"></i></span>
              NIK KP (Identitas)
            </button>
          </h2>
          <div id="collapseNIK" class="accordion-collapse collapse show" data-bs-parent="#surveyAccordion">
            <div class="accordion-body bg-white border-top">
              <div class="row g-2">
                <div v-for="(ans, i) in nikQuestion.answers" :key="i" class="col-md-6">
                  <div class="p-3 border rounded-3 bg-light-subtle">
                    <div class="fw-bold text-primary small mb-1">{{ ans.name }}</div>
                    <div class="fs-6 text-dark font-monospace">{{ ans.answer }}</div>
                  </div>
                </div>
              </div>
              <div v-if="!nikQuestion.answers.length" class="text-muted fst-italic py-3 text-center">Belum ada data NIK.</div>
            </div>
          </div>
        </div>

        <div v-for="(q, index) in nonNikQuestions" :key="q.id" class="accordion-item mb-3 rounded-4 shadow-sm border-0 overflow-hidden">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed fw-bold bg-white" type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse' + index">
              <span class="icon-box bg-primary text-white me-3">{{ index + 1 }}</span>
              {{ q.question }}
            </button>
          </h2>
          <div :id="'collapse' + index" class="accordion-collapse collapse" data-bs-parent="#surveyAccordion">
            <div class="accordion-body bg-white border-top">
              
              <div v-if="q.type === 'essay'">
                <div v-for="(ans, i) in q.answers" :key="i" class="mb-3 p-3 border-bottom last-child-no-border">
                  <div class="fw-bold text-primary small">{{ ans.name }}</div>
                  <div class="text-dark mt-1">{{ ans.answer }}</div>
                </div>
              </div>

              <div v-else>
                <div v-for="(opt, i) in q.options" :key="i" class="mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-semibold text-secondary">{{ opt.option }}</span>
                    <span class="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-3">
                      {{ opt.count }} Responden ({{ opt.percentage }}%)
                    </span>
                  </div>
                  <div class="progress shadow-sm" style="height: 12px; border-radius: 10px;">
                    <div 
                      class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                      role="progressbar" 
                      :style="{ width: opt.percentage + '%' }" 
                      :aria-valuenow="opt.percentage" 
                      aria-valuemin="0" 
                      aria-valuemax="100">
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-else class="text-center py-5">
      <div class="card border-0 shadow-sm p-5 rounded-4 bg-light">
        <i class="bi bi-clipboard-x display-1 text-muted mb-3"></i>
        <p class="text-muted fs-5 mb-0">Data survey tidak ditemukan atau sudah dihapus.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";

const route = useRoute();
const loading = ref(true);

const data = ref({
  totalRespondents: 0,
  questions: [],
  title: "",
  description: "",
  respondents: []
});

const API = import.meta.env.VITE_API_BASE_URL + "/form-fco";

/* 🔑 Question NIK — Memisahkan NIK agar selalu di posisi teratas */
const nikQuestion = computed(() =>
  data.value.questions.find(
    q => q.question.toLowerCase().includes("nik")
  )
);

/* ❌ Selain NIK */
const nonNikQuestions = computed(() =>
  data.value.questions.filter(
    q => !q.question.toLowerCase().includes("nik")
  )
);

async function loadResult() {
  try {
    const res = await axios.get(`${API}/${route.params.id}/result`);
    data.value = res.data;
  } catch (error) {
    console.error(error);
    Swal.fire("Error", "Gagal memuat hasil survey. Pastikan koneksi internet stabil.", "error");
  } finally {
    loading.value = false;
  }
}

async function downloadExcel() {
  try {
    Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
    
    const res = await axios.get(
      `${API}/${route.params.id}/export-excel`,
      { responseType: "blob" }
    );
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([res.data]));
    link.download = `Hasil_Survey_${data.value.title.replace(/\s+/g, '_')}.xlsx`;
    link.click();
    
    Swal.close();
  } catch {
    Swal.fire("Error", "Gagal mengunduh file Excel.", "error");
  }
}

onMounted(loadResult);
</script>

<style scoped>
.ls-1 { letter-spacing: 1px; }

/* Custom Accordion Styling */
.custom-accordion .accordion-item {
  border: none !important;
  transition: transform 0.2s ease;
}

.custom-accordion .accordion-button {
  box-shadow: none !important;
  padding: 1.25rem;
}

.custom-accordion .accordion-button:not(.collapsed) {
  color: var(--bs-primary);
  background-color: #fff;
}

.custom-accordion .accordion-button:focus {
  border-color: transparent;
  box-shadow: none;
}

/* Icon Box Bulat di sebelah judul pertanyaan */
.icon-box {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.last-child-no-border:last-child {
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

/* Animasi Hover pada Card */
.accordion-item:hover {
  transform: translateY(-2px);
}

.bg-light-subtle {
  background-color: #f8f9fa;
}
</style>