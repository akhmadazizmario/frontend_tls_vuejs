<template>
  <div class="container py-5 min-vh-100">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h2 class="fw-bold text-dark mb-1">➕ Buat Form FCO</h2>
        <p class="text-muted small">Rancang kuesioner Anda dengan mudah dan cepat.</p>
      </div>
      <button class="btn btn-outline-secondary rounded-pill px-4" @click="router.back()">
        Batal
      </button>
    </div>

    <div class="row justify-content-center">
      <div class="col-lg-9">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div class="card-body p-4 p-md-5">
            <div class="mb-4">
              <label class="form-label fw-bold text-secondary small text-uppercase">Informasi Utama</label>
              <input 
                v-model="form.title" 
                class="form-control form-control-lg border-0 bg-light rounded-3 mb-3" 
                placeholder="Judul Form (Contoh: Survei Kepuasan Pelanggan)"
              />
              <textarea 
                v-model="form.description" 
                class="form-control border-0 bg-light rounded-3" 
                rows="2" 
                placeholder="Berikan deskripsi singkat tentang form ini..."
              ></textarea>
            </div>

            <hr class="my-5 opacity-50">

            <div class="d-flex align-items-center justify-content-between mb-4">
              <h5 class="fw-bold m-0 text-dark">Daftar Pertanyaan</h5>
              <!-- <span class="badge bg-primary-subtle text-primary rounded-pill">{{ form.questions.length }} Pertanyaan</span> -->
               <span class="badge bg-primary-subtle text-primary rounded-pill">
                 {{ form.questions.length }} Pertanyaan Admin + 1 NIK
               </span>
            </div>

            <TransitionGroup name="list" tag="div">
              <div
                v-for="(q, qi) in form.questions"
                :key="qi"
                class="question-card border rounded-4 p-4 mb-4 position-relative transition-all"
              >
                <button 
                  class="btn-close position-absolute top-0 end-0 m-3 shadow-none" 
                  style="font-size: 0.8rem;"
                  @click="form.questions.splice(qi, 1)"
                ></button>

                <div class="row g-3">
                  <div class="col-md-8">
                    <label class="form-label small fw-bold text-muted">Pertanyaan {{ qi + 1 }}</label>
                    <input
                      v-model="q.text"
                      placeholder="Apa yang ingin Anda tanyakan?"
                      class="form-control border-0 bg-light-subtle shadow-sm px-3 py-2 fw-medium"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label small fw-bold text-muted">Tipe Jawaban</label>
                    <select v-model="q.type" class="form-select border-0 bg-light-subtle shadow-sm cursor-pointer">
                      <option value="essay">📝 Jawaban Essay</option>
                      <option value="single">🔘 Pilihan Ganda</option>
                    </select>
                  </div>
                </div>

                <div v-if="q.type !== 'essay'" class="mt-4 ps-md-4">
                  <label class="form-label small fw-bold text-muted mb-2">Opsi Jawaban</label>
                  <div
                    v-for="(o, oi) in q.options"
                    :key="oi"
                    class="d-flex align-items-center mb-2 animate-in"
                  >
                    <div class="me-2 text-muted small">{{ oi + 1 }}.</div>
                    <input 
                      v-model="q.options[oi]" 
                      class="form-control form-control-sm border-0 border-bottom rounded-0 bg-transparent px-0 me-2" 
                      placeholder="Tulis opsi di sini..."
                    />
                    <button class="btn btn-link text-danger p-1" @click="q.options.splice(oi, 1)">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>

                  <button 
                    class="btn btn-sm btn-link text-decoration-none text-primary fw-bold mt-2 p-0" 
                    @click="q.options.push('')"
                  >
                    <i class="bi bi-plus-circle-fill me-1"></i> Tambah Opsi
                  </button>
                </div>
              </div>
            </TransitionGroup>

            <div v-if="form.questions.length === 0" class="text-center py-5 border rounded-4 border-dashed bg-light mb-4">
              <i class="bi bi-patch-question text-muted display-4"></i>
              <p class="text-muted mt-2">Belum ada pertanyaan. Klik tombol di bawah untuk memulai.</p>
            </div>

            <div class="d-flex flex-column flex-md-row gap-3 mt-5">
              <button class="btn btn-light rounded-pill px-4 fw-bold text-primary flex-grow-1 border" @click="addQuestion">
                <i class="bi bi-plus-lg me-2"></i> Tambah Pertanyaan
              </button>
              <button class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm py-2" @click="saveForm">
                <i class="bi bi-cloud-check me-2"></i> Simpan Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";

const router = useRouter();
const API = import.meta.env.VITE_API_BASE_URL + "/form-fco";

const form = reactive({
  title: "",
  description: "",
  questions: []
});

function addQuestion() {
  form.questions.push({
    text: "",
    type: "essay",
    options: [""]
  });
}

async function saveForm() {
  // if (!form.title || !form.questions.length) {
  if (!form.title) {
    // Swal.fire({
    //   icon: 'warning',
    //   title: 'Data Belum Lengkap',
    //   text: 'Pastikan Judul dan minimal 1 pertanyaan sudah diisi.',
    //   confirmButtonColor: '#0d6efd'
    // });
    Swal.fire({
      icon: 'warning',
      title: 'Judul Wajib Diisi',
      text: 'Silakan isi judul form terlebih dahulu.',
      confirmButtonColor: '#0d6efd'
    });
    return;
  }

  try {
    await axios.post(API, form);
    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Form FCO Anda telah diterbitkan!',
      confirmButtonColor: '#0d6efd'
    });
    router.push("/form-fco");
  } catch (error) {
    Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan form.', 'error');
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css');

.container {
  font-family: 'Inter', sans-serif;
  max-width: 1000px;
}

.form-control:focus, .form-select:focus {
  background-color: #fff !important;
  box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.1) !important;
  border-color: #0d6efd !important;
}

.question-card {
  background-color: #fff;
  transition: all 0.3s ease;
}

.question-card:hover {
  border-color: #0d6efd !important;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

.bg-light-subtle {
  background-color: #f8f9fa;
}

.border-dashed {
  border-style: dashed !important;
  border-width: 2px !important;
}

/* Animations */
.list-enter-active, .list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.animate-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.cursor-pointer {
  cursor: pointer;
}
</style>