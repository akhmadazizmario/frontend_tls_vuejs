<template>
  <div class="d-flex flex-column min-vh-100 bg-soft-f8">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    
    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main 
        class="flex-grow-1 p-3 p-md-4 p-lg-5 transition-all" 
        :style="{ 
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0', 
          marginTop: '64px' 
        }"
      >
        <div class="container-fluid py-2">
          
          <div class="d-md-flex align-items-center justify-content-between mb-5 animate-fade-in">
            <div>
              <h2 class="fw-bold text-dark-blue mb-1">📊 Laporan Inspection</h2>
              <p class="text-muted small mb-0">Monitor standar kebersihan area secara berkala</p>
            </div>
            
            <div class="d-flex gap-2 mt-3 mt-md-0">
              <div class="filter-wrapper shadow-sm">
                <i class="bi bi-calendar3 ms-3 text-primary"></i>
                <input
                  type="date"
                  v-model="filterDate"
                  class="form-control-clean"
                  @change="loadReports"
                />
              </div>
              <button 
                class="btn btn-export-modern shadow-sm" 
                :disabled="!filterDate || !reports.length"
                @click="exportExcel"
              >
                <i class="bi bi-file-earmark-excel me-2"></i>Export
              </button>
            </div>
          </div>

          <div class="card border-0 shadow-soft rounded-4 overflow-hidden animate-slide-up">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 custom-table">
                <thead>
                  <tr>
                    <th class="ps-4 py-3">NO</th>
                    <th class="py-3">TANGGAL</th>
                    <th class="py-3">CATEGORY</th>
                    <th class="py-3">INSPEKTOR</th>
                    <th class="py-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, index) in reports" :key="r.id" class="table-row">
                    <td class="ps-4 text-muted fw-medium">{{ index + 1 }}</td>
                    <td>
                      <div class="d-flex flex-column">
                        <span class="fw-bold text-dark-emphasis">{{ formatDate(r.inspection_date) }}</span>
                        <span class="text-muted-xs">REF: #{{ r.id }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge-soft-blue">{{ r.category?.name }}</span>
                    </td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-circle bg-primary text-white">
                          {{ r.user?.name?.charAt(0).toUpperCase() }}
                        </div>
                        <span class="fw-semibold text-secondary-emphasis">{{ r.user?.name }}</span>
                      </div>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-view-detail me-2" @click="viewDetail(r.id)">
                        Detail <i class="bi bi-chevron-right ms-1"></i>
                      </button>
                      <button class="btn btn-delete-modern shadow-none" @click="confirmDelete(r.id)">
                        <i class="bi bi-trash3"></i> Hapus
                      </button>
                    </td>
                  </tr>

                  <tr v-if="!reports.length">
                    <td colspan="5" class="py-5 text-center">
                      <div class="empty-state py-4">
                        <div class="empty-icon mb-3 mx-auto">
                          <i class="bi bi-search"></i>
                        </div>
                        <h6 class="text-dark fw-bold">Belum ada data</h6>
                        <p class="text-muted small">Silakan pilih tanggal untuk menarik laporan</p>
                      </div>
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
import { ref, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";
import Footer from "../../../components/Footer.vue";

const API = import.meta.env.VITE_API_BASE_URL;

const user = ref({});
const sidebarOpen = ref(true);
const windowWidth = ref(window.innerWidth);
const reports = ref([]);
const filterDate = ref("");

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => { localStorage.removeItem("user"); window.location.href = "/login"; };

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

async function loadReports() {
  if (!filterDate.value) { reports.value = []; return; }
  try {
    const res = await axios.get(`${API}/inspectioncleaning`, { params: { date: filterDate.value } });
    reports.value = res.data;
  } catch (err) {
    Swal.fire("Error", "Gagal memuat data", "error");
  }
}

function exportExcel() {
  window.open(`${API}/inspectioncleaning/export?date=${filterDate.value}`);
}

// ================= VIEW DETAIL =================
async function viewDetail(id) {
  try {
    Swal.fire({ 
      title: 'Loading...', 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });
    
    const res = await axios.get(`${API}/inspectioncleaning/${id}`);
    Swal.close();

    const data = res.data;
    
    // Mendapatkan root domain (misal: http://localhost:5000)
    const domainUrl = new URL(API).origin; 

    // 1. Template List Jawaban
    const answersHtml = data.answers.map(a => `
      <div class="p-3 mb-2 rounded-3 border d-flex align-items-center justify-content-between" 
            style="background: ${a.answer === 'Ya' ? '#f0fdf4' : '#fef2f2'}; border-color: ${a.answer === 'Ya' ? '#bcf0da' : '#fecaca'} !important;">
        <div style="flex: 1">
          <div class="fw-bold small text-dark">${a.question_text_snapshot}</div>
          <div class="text-muted x-small mt-1 italic">${a.note || '— Tidak ada catatan'}</div>
        </div>
        <div class="ms-3">
          <span class="badge ${a.answer === 'Ya' ? 'bg-success' : 'bg-danger'} rounded-pill px-3">${a.answer}</span>
        </div>
      </div>
    `).join("");

    // 2. Template Foto
    let photosHtml = "";
    if (data.photos && data.photos.length > 0) {
      const imgElements = data.photos.map(p => {
        const fullUrl = `${domainUrl}/uploads/inspection/${p.photo_url}`;
        return `
          <div class="col-4 mb-2">
            <img src="${fullUrl}" class="img-fluid rounded-3 border shadow-sm photo-zoom" 
                 style="height: 110px; width: 100%; object-fit: cover; cursor: pointer;"
                 onerror="this.src='https://placehold.co/400x400?text=Gambar+Tidak+Ada'"
                 onclick="window.open('${fullUrl}', '_blank')">
          </div>
        `;
      }).join("");
      
      photosHtml = `
        <div class="mt-4">
          <h6 class="fw-bold mb-3 text-start"><i class="bi bi-camera me-2"></i>Dokumentasi Foto</h6>
          <div class="row gx-2">${imgElements}</div>
        </div>
      `;
    } else {
      photosHtml = `<div class="mt-4 p-3 bg-light rounded-3 text-center text-muted small italic">Tidak ada foto dokumentasi</div>`;
    }

    // 3. Tampilkan Modal
    Swal.fire({
      title: 'Detail Hasil Inspeksi',
      html: `
        <div class="text-start mt-2" style="max-height: 550px; overflow-y: auto; overflow-x: hidden;">
          <div class="mb-3 p-3 bg-light rounded-3 d-flex justify-content-between x-small border shadow-sm">
              <div><strong>Area:</strong> ${data.category?.name || '-'}</div>
              <div><strong>Inspector:</strong> ${data.user?.name || '-'}</div>
          </div>
          <h6 class="fw-bold mb-3"><i class="bi bi-card-checklist me-2"></i>Status Kebersihan</h6>
          ${answersHtml}
          ${photosHtml}
        </div>
      `,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#1e3a8a',
      width: '600px'
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat detail laporan", "error");
  }
}

// ================= CONFIRM DELETE =================
async function confirmDelete(id) {
  try {
    const result = await Swal.fire({
      title: 'Hapus Laporan?',
      text: "Data di database dan file gambar di server akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      // Show loading while deleting
      Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      await axios.delete(`${API}/inspectioncleaning/${id}`);
      
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Laporan dan gambar telah dihapus', timer: 1500, showConfirmButton: false });
      loadReports(); // Refresh data
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || "Gagal menghapus data";
    Swal.fire("Error", errorMsg, "error");
  }
}

onMounted(() => {
  const stored = localStorage.getItem("user");
  if(stored) user.value = JSON.parse(stored);
  window.addEventListener('resize', () => windowWidth.value = window.innerWidth);
});
</script>

<style scoped>
.bg-soft-f8 { background-color: #f8fafc; }
.transition-all { transition: all 0.3s ease; }
.filter-wrapper { background: white; display: flex; align-items: center; border-radius: 12px; border: 1px solid #e2e8f0; }
.form-control-clean { border: none; padding: 0.6rem 1rem; font-size: 0.9rem; background: transparent; outline: none; color: #475569; }
.btn-export-modern { background: #10b981; color: white; border: none; border-radius: 12px; padding: 0.6rem 1.5rem; font-weight: 600; transition: 0.2s; }
.btn-export-modern:hover:not(:disabled) { background: #059669; transform: translateY(-1px); }
.btn-export-modern:disabled { background: #cbd5e1; cursor: not-allowed; }
.btn-view-detail { background: #eff6ff; color: #2563eb; border: none; padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
.btn-view-detail:hover { background: #dbeafe; }
.custom-table thead th { background: #f8fafc; font-size: 0.7rem; font-weight: 800; color: #64748b; letter-spacing: 0.05rem; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
.table-row:hover { background-color: #f8fafc; }
.badge-soft-blue { background: #e0e7ff; color: #4338ca; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }
.avatar-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; }
.btn-delete-modern { background: #fef2f2; color: #ef4444; border: none; padding: 0.4rem 0.7rem; border-radius: 8px; font-size: 0.85rem; transition: 0.2s; }
.btn-delete-modern:hover { background: #fee2e2; transform: scale(1.05); }
.text-muted-xs { font-size: 0.65rem; color: #94a3b8; }
.x-small { font-size: 0.75rem; }
.italic { font-style: italic; }
.photo-zoom:hover { transform: scale(1.04); transition: 0.3s; z-index: 5; outline: 2px solid #1e3a8a; }

.empty-icon {
  width: 60px; height: 60px; background: #f1f5f9; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #94a3b8;
}
</style>