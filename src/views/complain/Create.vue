<template>
  <div class="complain-container">
    <img src="/images/logo.jpg" alt="TLSI Logo" class="mb-3 d-block mx-auto" style="width: 80px;">
    <h2 class="title">Buat Complain ERP Baru</h2>

    <form @submit.prevent="createComplain" enctype="multipart/form-data" class="complain-form">
      <!-- Select Department -->
      <div class="form-group">
        <label for="department">Department</label>
        <select v-model="form.department_id" id="department" required>
          <option value="">-- Pilih Department --</option>
          <option v-for="dept in departments" :key="dept.id" :value="dept.id">
            {{ dept.name_dept }}
          </option>
        </select>
      </div>

      <!-- IDP -->
      <div class="form-group">
        <label for="idp">IDP</label>
        <input type="text" id="idp" v-model="form.idp" required />
      </div>

      <!-- Detail -->
      <div class="form-group">
        <label for="detail">Detail</label>
        <textarea id="detail" v-model="form.detail" rows="3" required></textarea>
      </div>

      <!-- File Barcode -->
      <div class="form-group">
        <label for="file_barcode">File Barcode (Opsional)</label>
        <input type="file" id="file_barcode" @change="handleFileUpload" />
      </div>

      <!-- Submit -->
      <button type="submit" class="btn-submit">Simpan</button>
    </form>
  </div>
</template>

<script>
import axios from "axios";
import { onMounted, reactive, ref } from "vue";
import Swal from "sweetalert2";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const API2_BASE_URL = import.meta.env.VITE_API2_BASE_URL

export default {
  name: "CreateComplain",
  setup() {
    const departments = ref([]);
    const form = reactive({
      department_id: "",
      idp: "",
      detail: "",
      file_barcode: null,
    });

    // Ambil daftar department saat halaman dibuka
    onMounted(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/departments`);
        departments.value = res.data;
      } catch (err) {
        console.error("Gagal memuat departments", err);
        Swal.fire("Gagal", "Gagal memuat data department.", "error");
      }
    });

    const handleFileUpload = (e) => {
      form.file_barcode = e.target.files[0];
    };

    const createComplain = async () => {
      try {
        const formData = new FormData();
        formData.append("department_id", form.department_id);
        formData.append("idp", form.idp);
        formData.append("detail", form.detail);
        if (form.file_barcode) {
          formData.append("file_barcode", form.file_barcode);
        }

        await axios.post(`${API_BASE_URL}/complains`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        Swal.fire("Berhasil!", "Complain berhasil dikirim.", "success");
        form.department_id = "";
        form.idp = "";
        form.detail = "";
        form.file_barcode = null;
      } catch (err) {
        console.error("Gagal membuat complain", err);
        Swal.fire("Gagal", "Tidak dapat mengirim complain.", "error");
      }
    };

    return {
      departments,
      form,
      handleFileUpload,
      createComplain,
    };
  },
};
</script>

<style scoped>
.complain-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 25px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.title {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.complain-form .form-group {
  margin-bottom: 15px;
}

label {
  font-weight: 500;
  color: #444;
  margin-bottom: 5px;
  display: block;
}

input,
select,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #4e73df;
  box-shadow: 0 0 5px rgba(78, 115, 223, 0.4);
  outline: none;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: #4e73df;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-submit:hover {
  background: #3a5fd0;
}
</style>
