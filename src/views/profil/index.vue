<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-lg border-0 rounded-3">
          <div class="card-header bg-primary text-white text-center">
            <h4 class="mb-0">Update Profil</h4>
          </div>
          <div class="card-body p-4">
            <form @submit.prevent="updateProfil" enctype="multipart/form-data">
              <div class="mb-3">
                <label class="form-label fw-bold">Nama Lengkap</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  placeholder="Masukkan email"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">No HP</label>
                <input
                  v-model="form.phone"
                  type="text"
                  class="form-control"
                  placeholder="Masukkan nomor HP"
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Password Baru</label>
                <input
                  v-model="form.password"
                  type="password"
                  class="form-control"
                  placeholder="Kosongkan jika tidak ingin diubah"
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Foto Profil</label>
                <input
                  type="file"
                  @change="handleFileUpload"
                  class="form-control"
                  accept="image/*"
                />
              </div>

              <!-- Preview -->
              <div v-if="previewUrl" class="text-center mb-3">
                <h6 class="fw-bold">Preview Gambar:</h6>
                <img
                  :src="previewUrl"
                  alt="preview"
                  class="rounded-circle shadow-sm border"
                  width="120"
                  height="120"
                  style="object-fit: cover"
                />
              </div>

              <div class="d-flex justify-content-between">
                <button type="submit" class="btn btn-primary px-4">
                  <i class="bi bi-save"></i> Simpan
                </button>
                <a href="/dashboard" class="btn btn-outline-secondary px-4">
                  <i class="bi bi-arrow-left"></i> Kembali
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API2_BASE_URL = import.meta.env.VITE_API2_BASE_URL

export default {
  data() {
    return {
      form: {
        name: "",
        email: "",
        phone: "",
        password: "",
        image: null,
      },
      previewUrl: null,
      userId: null,
    };
  },

  mounted() {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      this.userId = parsed.id;
      this.getProfil();
    }
  },

  methods: {
    async getProfil() {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/profile/${this.userId}`
        );
        this.form.name = res.data.name;
        this.form.email = res.data.email;
        this.form.phone = res.data.phone;
        this.previewUrl = res.data.image
          ? `${API2_BASE_URL}/${res.data.image}`
          : null;
      } catch (err) {
        console.error("Gagal ambil profil:", err);
      }
    },

    handleFileUpload(event) {
      this.form.image = event.target.files[0];
      this.previewUrl = URL.createObjectURL(this.form.image);
    },

    async updateProfil() {
      try {
        const formData = new FormData();
        formData.append("name", this.form.name);
        formData.append("email", this.form.email);
        formData.append("phone", this.form.phone);

        if (this.form.password) {
          formData.append("password", this.form.password);
        }
        if (this.form.image) {
          formData.append("image", this.form.image);
        }

        await axios.put(
          `${API_BASE_URL}/profile/update-profil/${this.userId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        this.form.password = "";
        this.getProfil();

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Profil berhasil diperbarui.",
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (err) {
        console.error("Update profil error:", err.response?.data || err.message);
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: err.response?.data?.error || err.message,
        });
      }
    },
  },
};
</script>

<style>
/* sedikit styling biar lebih rapi */
.card {
  border-radius: 15px;
}
.card-header {
  border-radius: 15px 15px 0 0 !important;
}
</style>
