<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft mt-4">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <!-- ============================================= -->
    <!-- TEAM PICKER (teleport ke <body> supaya TIDAK PERNAH ketutupan  -->
    <!-- oleh overflow tabel Finishing/Linking, dan ada search box)    -->
    <!-- ============================================= -->
    <Teleport to="body">
      <div
        v-if="openTeamPicker"
        class="team-picker-teleport-panel shadow-lg"
        :style="{ top: teamPickerPos.top + 'px', left: teamPickerPos.left + 'px', width: teamPickerPos.width + 'px' }"
        @click.stop
      >
        <div class="team-picker-header">
          <div>
            <span class="team-picker-title">Pilih Team <span v-if="openTeamPicker" class="team-picker-dept-tag">{{ openTeamPicker.deptLabel }}</span></span>
            <span class="team-picker-selected-count">{{ selectedCountForPicker }} dipilih</span>
          </div>
          <button type="button" class="team-picker-close-btn" @click="closeTeamDropdown">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="team-picker-search-box">
          <i class="bi bi-search"></i>
          <input type="text" v-model="teamPickerSearch" placeholder="Cari nama team..." autofocus>
        </div>

        <div class="team-picker-list custom-scrollbar">
          <div v-if="activeTeamMasterList.length === 0" class="small text-muted text-center py-3">Belum ada master team untuk {{ openTeamPicker?.deptLabel }}.</div>
          <div v-else-if="filteredTeamPickerOptions.length === 0" class="small text-muted text-center py-3">
            <i class="bi bi-search d-block mb-1 opacity-50"></i> Team tidak ditemukan
          </div>
          <label
            v-for="team in filteredTeamPickerOptions"
            :key="team.id"
            class="team-picker-item"
            :class="{
              'team-picker-item-checked': activeRowForPicker && activeRowForPicker.teamAllocations.some(a => a.team_id === team.id)
            }"
          >
            <input type="checkbox" class="form-check-input"
              :checked="activeRowForPicker && activeRowForPicker.teamAllocations.some(a => a.team_id === team.id)"
              @change="toggleTeam(activeRowForPicker, team.id, $event.target.checked, activeSameDeptDatasetForPicker, activeTeamMasterList, openTeamPicker.deptLabel)">
            <span class="team-picker-item-body">
              <span class="team-picker-item-name">{{ team.nama_team }}</span>
              <span class="team-picker-item-meta">
                {{ team.jml_org }} org &middot;
                <span :class="remainingCapacityForTeam(team) <= 0 ? 'text-danger fw-bold' : 'text-success'">sisa {{ remainingCapacityForTeam(team) }}</span>
              </span>
            </span>
            <span v-if="activeRowForPicker && isTeamFull(team, activeRowForPicker)" class="badge-team-full" title="Kapasitas sudah habis, tapi tetap bisa dipilih kalau perlu">PENUH</span>
          </label>
        </div>
      </div>
    </Teleport>

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-5" :style="{ marginLeft: sidebarOpen ? '16rem' : '0', transition: 'margin-left 0.3s' }">
        <div class="container-fluid">

          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="page-title-icon">
              <i class="bi bi-pencil-square"></i>
            </div>
            <div class="flex-grow-1">
              <h2 class="h4 fw-bold text-dark mb-0">Update Qty Plan - Finishing &amp; Linking</h2>
              <p class="text-muted small mb-0">Isi target Team (bisa lebih dari 1 team) &amp; Qty Plan per style, per proses</p>
            </div>
            <a href="/plan_ppc" class="btn btn-kembali">
              <i class="bi bi-arrow-left me-1"></i> Kembali
            </a>
          </div>

          <div class="row" v-if="uniqueStyleList.length > 0 || dataLoading">

            <div class="col-md-3 mb-4">
              <div class="card border-0 shadow-sm rounded-4 p-3 style-sidebar-card">
                <label class="sidebar-label">
                  <i class="bi bi-tags-fill"></i> Cari &amp; Pilih Style
                </label>
                <div class="search-box mb-3">
                  <i class="bi bi-search"></i>
                  <input type="text" class="form-control" placeholder="Ketik nomor style..." v-model="searchStyleInput">
                </div>

                <div class="style-list-scroll custom-scrollbar">
                  <button
                    v-for="styleOpt in uniqueStyleList"
                    :key="styleOpt"
                    type="button"
                    class="style-list-item"
                    :class="{ active: selectedStyle === styleOpt }"
                    @click="selectStyle(styleOpt)"
                  >
                    <span class="text-truncate">{{ styleOpt }}</span>
                    <span class="style-count-badge" :class="{ 'style-count-badge-active': selectedStyle === styleOpt }">
                      {{ countRowsPerStyle(styleOpt) }} Proses
                    </span>
                  </button>

                  <div v-if="uniqueStyleList.length === 0" class="text-center text-muted small py-4">
                    <i class="bi bi-inbox display-6 d-block mb-2 opacity-50"></i>
                    Style tidak ditemukan
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-9 mb-4">
              <div v-if="!selectedStyle" class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white d-flex flex-column align-items-center justify-content-center h-100 min-h-350 empty-state-card">
                <div class="empty-state-icon mb-3">
                  <i class="bi bi-lightning-charge-fill"></i>
                </div>
                <h5 class="fw-bold text-dark">Silahkan Pilih Style Terlebih Dahulu</h5>
                <p class="text-muted small max-w-400 mb-0">Pilih nomor style di sebelah kiri untuk memproses input target.</p>
              </div>

              <div v-else class="card border-0 shadow-sm rounded-4 p-4 bg-white planning-panel">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <div>
                    <span class="planning-eyebrow">Planning Pengisian Style</span>
                    <h4 class="fw-bold text-primary-emphasis mb-0">{{ selectedStyle }}</h4>
                  </div>
                  <div>
                    <button class="btn btn-save-massal" @click="saveMassal" :disabled="dataLoading">
                      <span v-if="dataLoading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-save-fill me-2"></i> Simpan Semua
                    </button>
                  </div>
                </div>

                <div class="info-banner mb-4">
                  <i class="bi bi-info-circle-fill"></i>
                  <span class="small">
                    <strong>Start Date</strong> dan <strong>End Date</strong> berlaku untuk seluruh proses (Finishing &amp; Linking) dalam style ini.
                    Untuk <strong>Team</strong>, daftar yang muncul berbeda-beda sesuai proses (LO, STEAM, CBS, SEWING, SOOMSONTEX, QCLAMPU, SULAM, atau LINKING_TLS) —
                    tiap proses punya kolam team sendiri. <strong>Qty Plan</strong> tetap diinput manual per team dan harus pas dengan Qty Plan Total.
                    Sistem akan menanyakan konfirmasi bila Anda ingin menyamakan Team ke seluruh proses dengan dept yang sama dalam style ini, atau hanya proses tersebut.
                  </span>
                </div>

                <!-- Input Start & End Date per Style -->
                <div class="row g-3 mb-4">
                  <div class="col-md-4">
                    <label class="form-label-modern">
                      <i class="bi bi-calendar-event me-1"></i> Start Date <span class="th-sub d-inline">(Otomatis 1 Style)</span>
                    </label>
                    <input
                      type="date"
                      class="form-control form-control-modern"
                      v-model="styleStartDate"
                      @change="updateStartDateForWholeStyle(styleStartDate)"
                    />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label-modern">
                      <i class="bi bi-calendar-check me-1"></i> End Date <span class="th-sub d-inline">(Otomatis 1 Style)</span>
                    </label>
                    <input type="date"
                      class="form-control form-control-modern"
                      v-model="styleEndDate"
                      @change="updateEndDateForWholeStyle(styleEndDate)"
                    />
                  </div>
                </div>

                <!-- ============================================= -->
                <!-- SECTION: FINISHING (selalu di atas)            -->
                <!-- ============================================= -->
                <div class="section-heading section-heading-finishing mb-3">
                  <i class="bi bi-scissors"></i>
                  <span>Proses Finishing</span>
                  <span class="section-count-badge">{{ finalFilteredDataFinishing.length }} Proses</span>
                </div>

                <div v-if="finalFilteredDataFinishing.length === 0" class="small text-muted mb-4 fst-italic">
                  Tidak ada proses Finishing untuk style ini.
                </div>

                <div v-else class="table-responsive border-0 rounded-3 overflow-hidden custom-scrollbar planning-table-wrap mb-4">
                  <table class="table table-hover align-middle mb-0 planning-table">
                    <thead class="sticky-thead">
                      <tr>
                        <th class="text-center">Dept</th>
                        <th>WorkName</th>
                        <th class="text-center">xTarget</th>
                        <th style="width: 160px;" class="text-center">Qty Plan <span class="th-sub">(Bebas per Proses)</span></th>
                        <th style="min-width: 260px;">Team Finishing (centang + isi Qty per team manual)</th>
                        <th style="min-width: 260px;">Preview per Team (Qty / 7jam / 14jam / Sisa)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in finalFilteredDataFinishing" :key="'fin-' + row.header_id">
                        <td class="text-center">
                          <span class="badge-dept">{{ row.dept }}</span>
                        </td>
                        <td class="fw-semibold text-dark">{{ row.xworkname }}</td>
                        <td class="text-center">{{ row.xTarget }}</td>

                        <td>
                          <!-- DITAMBAHKAN step="any" DISINI AGAR BISA DESIMAL -->
                          <input type="number" step="any" class="form-control form-control-sm text-center fw-bold input-qty" v-model.number="row.displayQty"
                            @input="handleQtyChange(row, row.displayQty)" placeholder="0" min="0"
                          >
                          <button type="button" class="btn btn-xs btn-outline-secondary w-100 mt-1" @click="applyQtyToWholeStyle(finalFilteredDataFinishing, row.displayQty)">
                            Samakan ke Semua Proses
                          </button>
                          <div class="alloc-indicator mt-1" :class="Math.abs(totalAllocatedForRow(row) - (row.displayQty || 0)) > 0.01 ? 'text-danger' : 'text-success'">
                            Teralokasi: {{ totalAllocatedForRow(row) }} / {{ row.displayQty || 0 }}
                          </div>
                        </td>

                        <td>
                          <button class="btn btn-sm btn-team-picker w-100 text-start team-picker-trigger" type="button"
                            @click="openTeamDropdown($event, 'finishing', row)">
                            <span v-if="row.teamAllocations.length === 0" class="text-muted">Pilih Team {{ row.dept }}...</span>
                            <span v-else>{{ teamNamesLabel(getTeamListForDept(row.dept), row.teamAllocations.map(a => a.team_id)) }}</span>
                            <i class="bi bi-chevron-down float-end mt-1"></i>
                          </button>

                          <!-- Input Qty Plan per team: bisa OTOMATIS (bagi rata) atau MANUAL satu-satu -->
                          <div v-if="row.teamAllocations.length > 0" class="team-qty-list mt-2">
                            <div class="d-flex gap-2 mb-1">
                              <button type="button" class="btn btn-xs btn-outline-primary flex-fill" @click="autoFillTeamQty(row)">
                                <i class="bi bi-magic me-1"></i>Isi Otomatis
                              </button>
                              <button type="button" class="btn btn-xs btn-outline-secondary flex-fill" @click="clearTeamQty(row)">
                                <i class="bi bi-eraser me-1"></i>Reset
                              </button>
                            </div>
                            <div v-for="alloc in row.teamAllocations" :key="'qty-fin-'+alloc.team_id" class="team-qty-item">
                              <span class="team-qty-label" :class="{ 'text-danger': isOrphanTeamForRow(row, alloc.team_id) }">
                                {{ teamNameById(getTeamListForDept(row.dept), alloc.team_id) }}
                                <i v-if="isOrphanTeamForRow(row, alloc.team_id)" class="bi bi-exclamation-triangle-fill ms-1" title="Team ini bukan bagian dari dept proses ini (data nyasar/lama) -- disarankan dihapus"></i>
                              </span>
                              <input type="number" step="any" class="form-control form-control-sm input-qty" placeholder="Qty"
                                :value="alloc.qty_plan"
                                @input="handleTeamQtyChange(row, alloc.team_id, $event.target.value)">
                              <button type="button" class="btn-remove-team" title="Hapus team ini dari proses"
                                @click="removeTeamAllocation(row, alloc.team_id, sameDeptRowsFor(finalFilteredDataFinishing, row), getTeamListForDept(row.dept), row.dept)">
                                <i class="bi bi-x-lg"></i>
                              </button>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div v-if="row.teamAllocations.length === 0" class="small text-muted">Belum pilih team</div>
                          <div v-else class="preview-list">
                            <div v-for="prev in previewForRow(row, getTeamListForDept(row.dept))" :key="prev.team_id" class="preview-item mb-1">
                              <span class="fw-semibold">{{ prev.nama_team }}</span>:
                              qty {{ prev.qty_plan }} |
                              7j: {{ prev.worker_7jam }} org
                              <span :class="prev.sisa_7jam < 0 ? 'text-danger fw-bold' : 'text-success'">
                                (sisa {{ prev.sisa_7jam }})
                              </span> |
                              14j: {{ prev.worker_14jam }} org
                              <span :class="prev.sisa_14jam < 0 ? 'text-danger fw-bold' : 'text-success'">
                                (sisa {{ prev.sisa_14jam }})
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- ============================================= -->
                <!-- SECTION: LINKING (selalu di bawah Finishing)   -->
                <!-- ============================================= -->
                <div class="section-heading section-heading-linking mb-3">
                  <i class="bi bi-link-45deg"></i>
                  <span>Proses Linking</span>
                  <span class="section-count-badge">{{ finalFilteredDataLinking.length }} Proses</span>
                </div>

                <div v-if="finalFilteredDataLinking.length === 0" class="small text-muted fst-italic">
                  Tidak ada proses Linking untuk style ini.
                </div>

                <div v-else class="table-responsive border-0 rounded-3 overflow-hidden custom-scrollbar planning-table-wrap">
                  <table class="table table-hover align-middle mb-0 planning-table">
                    <thead class="sticky-thead sticky-thead-linking">
                      <tr>
                        <th class="text-center">Dept</th>
                        <th>WorkName</th>
                        <th class="text-center">xTarget</th>
                        <th style="width: 160px;" class="text-center">Qty Plan <span class="th-sub">(Bebas per Proses)</span></th>
                        <th style="min-width: 260px;">Team Linking (centang + isi Qty per team manual)</th>
                        <th style="min-width: 260px;">Preview per Team (Qty / 7jam / 14jam / Sisa)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in finalFilteredDataLinking" :key="'link-' + row.header_id">
                        <td class="text-center">
                          <span class="badge-dept">{{ row.dept }}</span>
                        </td>
                        <td class="fw-semibold text-dark">{{ row.xworkname }}</td>
                        <td class="text-center">{{ row.xTarget }}</td>

                        <td>
                          <!-- DITAMBAHKAN step="any" DISINI AGAR BISA DESIMAL -->
                          <input type="number" step="any" class="form-control form-control-sm text-center fw-bold input-qty" v-model.number="row.displayQty"
                            @input="handleQtyChange(row, row.displayQty)" placeholder="0" min="0"
                          >
                          <button type="button" class="btn btn-xs btn-outline-secondary w-100 mt-1" @click="applyQtyToWholeStyle(finalFilteredDataLinking, row.displayQty)">
                            Samakan ke Semua Proses
                          </button>
                          <div class="alloc-indicator mt-1" :class="Math.abs(totalAllocatedForRow(row) - (row.displayQty || 0)) > 0.01 ? 'text-danger' : 'text-success'">
                            Teralokasi: {{ totalAllocatedForRow(row) }} / {{ row.displayQty || 0 }}
                          </div>
                        </td>

                        <td>
                          <button class="btn btn-sm btn-team-picker w-100 text-start team-picker-trigger" type="button"
                            @click="openTeamDropdown($event, 'linking', row)">
                            <span v-if="row.teamAllocations.length === 0" class="text-muted">Pilih Team {{ row.dept }}...</span>
                            <span v-else>{{ teamNamesLabel(getTeamListForDept(row.dept), row.teamAllocations.map(a => a.team_id)) }}</span>
                            <i class="bi bi-chevron-down float-end mt-1"></i>
                          </button>

                          <!-- Input Qty Plan per team: bisa OTOMATIS (bagi rata) atau MANUAL satu-satu -->
                          <div v-if="row.teamAllocations.length > 0" class="team-qty-list mt-2">
                            <div class="d-flex gap-2 mb-1">
                              <button type="button" class="btn btn-xs btn-outline-primary flex-fill" @click="autoFillTeamQty(row)">
                                <i class="bi bi-magic me-1"></i>Isi Otomatis
                              </button>
                              <button type="button" class="btn btn-xs btn-outline-secondary flex-fill" @click="clearTeamQty(row)">
                                <i class="bi bi-eraser me-1"></i>Reset
                              </button>
                            </div>
                            <div v-for="alloc in row.teamAllocations" :key="'qty-link-'+alloc.team_id" class="team-qty-item">
                              <span class="team-qty-label" :class="{ 'text-danger': isOrphanTeamForRow(row, alloc.team_id) }">
                                {{ teamNameById(getTeamListForDept(row.dept), alloc.team_id) }}
                                <i v-if="isOrphanTeamForRow(row, alloc.team_id)" class="bi bi-exclamation-triangle-fill ms-1" title="Team ini bukan bagian dari dept proses ini (data nyasar/lama) -- disarankan dihapus"></i>
                              </span>
                              <input type="number" step="any" class="form-control form-control-sm input-qty" placeholder="Qty"
                                :value="alloc.qty_plan"
                                @input="handleTeamQtyChange(row, alloc.team_id, $event.target.value)">
                              <button type="button" class="btn-remove-team" title="Hapus team ini dari proses"
                                @click="removeTeamAllocation(row, alloc.team_id, sameDeptRowsFor(finalFilteredDataLinking, row), getTeamListForDept(row.dept), row.dept)">
                                <i class="bi bi-x-lg"></i>
                              </button>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div v-if="row.teamAllocations.length === 0" class="small text-muted">Belum pilih team</div>
                          <div v-else class="preview-list">
                            <div v-for="prev in previewForRow(row, getTeamListForDept(row.dept))" :key="prev.team_id" class="preview-item mb-1">
                              <span class="fw-semibold">{{ prev.nama_team }}</span>:
                              qty {{ prev.qty_plan }} |
                              7j: {{ prev.worker_7jam }} org
                              <span :class="prev.sisa_7jam < 0 ? 'text-danger fw-bold' : 'text-success'">
                                (sisa {{ prev.sisa_7jam }})
                              </span> |
                              14j: {{ prev.worker_14jam }} org
                              <span :class="prev.sisa_14jam < 0 ? 'text-danger fw-bold' : 'text-success'">
                                (sisa {{ prev.sisa_14jam }})
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

          <div v-else-if="!dataLoading" class="card border-0 shadow-sm rounded-4 empty-state-card">
            <div class="card-body text-center py-5">
              <div class="empty-state-icon mb-3 mx-auto">
                <i class="bi bi-calendar2-x"></i>
              </div>
              <p class="text-muted mb-0">Belum ada data aktif yang tersedia.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Kode dept team di tabel master (plan_ppc_tlsi_jml_tgt) itu SPESIFIK per proses,
// bukan cuma 2 bucket besar Finishing/Linking. Mapping dari `dept` (hasil SP
// sp_get_plan_ppc_tlsi_proses) ke kode_dept team master:
const DEPT_TO_KODE_DEPT = {
  'lo': 'LO',
  'steam': 'STEAM',
  'cbs': 'CBS',
  'sewing': 'SEWING',
  'sontex': 'SOOMSONTEX',       // Sontex, Sontex Komplit, Soom, & Soom Sontex berbagi 1 kolam team SOOMSONTEX
  'sontex komplit': 'SOOMSONTEX',
  'soom sontex': 'SOOMSONTEX',
  'soom': 'SOOMSONTEX',
  'qc lampu': 'QCLAMPU',
  'sulam': 'SULAM',
  'linking': 'LINKING_TLS'
};
const ALL_KODE_DEPTS = ['LO', 'STEAM', 'CBS', 'SEWING', 'SOOMSONTEX', 'QCLAMPU', 'SULAM', 'LINKING_TLS'];

const kodeDeptForDept = (deptName) => DEPT_TO_KODE_DEPT[String(deptName || '').toLowerCase().trim()] || null;

const sidebarOpen = ref(true);
const user = ref({ name: "User" });
const dataLoading = ref(false);

// Kita gunakan satu wadah utama untuk menampung respon dari backend yang sudah gabung
const rawHeadersAll = ref([]);
// Master team, dipisah per kode_dept SPESIFIK (LO, STEAM, CBS, SEWING, SOOMSONTEX,
// QCLAMPU, SULAM, LINKING_TLS) - bukan cuma 2 bucket Finishing/Linking lagi.
const teamMasterByKodeDept = ref({});
const getTeamListForDept = (deptName) => teamMasterByKodeDept.value[kodeDeptForDept(deptName)] || [];

const searchStyleInput = ref("");
const selectedStyle = ref(null);
const styleStartDate = ref("");
const styleEndDate = ref("");

// ==========================================
// FETCH DATA
// ==========================================
// teamAllocations: qty_plan PER TEAM diinput manual oleh PPC (tim ini ngerjain
// berapa, tim itu ngerjain berapa) -- TIDAK dibagi rata otomatis oleh sistem lagi.
// originalUsage: snapshot worker_7jam/14jam ASLI (sebelum diedit) dari database,
// dipakai untuk menghitung ulang "sisa kapasitas tim" secara real-time -- karena
// begitu style ini disimpan, alokasi lama akan di-replace, jadi kapasitas yang
// lama dipakai oleh style ini sendiri harus "dikembalikan dulu" sebelum dihitung ulang.
const mapHeaders = (raw) => raw.map(h => ({
  header_id: h.id || h.header_id,
  xMark: h.xMark,
  dept: h.dept,
  xworkname: h.xworkname,
  xTarget: h.xTarget,
  tgl_mulai: h.tgl_mulai,
  tgl_selesai: h.tgl_selesai,
  displayQty: h.qty_plan_total || 0,
  teamAllocations: (h.details || []).map(d => ({ team_id: d.team_id, qty_plan: d.qty_plan || 0 })),
  originalUsage: (h.details || []).map(d => ({
    team_id: d.team_id,
    used: (d.worker_7jam || 0) + (d.worker_14jam || 0)
  }))
}));

const fetchData = async () => {
  dataLoading.value = true;
  selectedStyle.value = null;
  try {
    // API linking dihilangkan karena data view-target2 sudah mengandung semuanya
    const [allDataRes, ...teamResList] = await Promise.all([
      axios.get(`${API_BASE_URL}/planppc/view-target2`),
      ...ALL_KODE_DEPTS.map(code => axios.get(`${API_BASE_URL}/planppc/team-target`, { params: { kode_dept: code } }))
    ]);

    const headersAll = allDataRes.data?.data || allDataRes.data || [];
    rawHeadersAll.value = mapHeaders(headersAll);

    const teamMap = {};
    ALL_KODE_DEPTS.forEach((code, idx) => {
      teamMap[code] = teamResList[idx].data?.data || [];
    });
    teamMasterByKodeDept.value = teamMap;
  } catch (err) {
    Swal.fire('Error', 'Gagal memuat data.', 'error');
  } finally {
    dataLoading.value = false;
  }
};

onMounted(() => fetchData());

// ==========================================
// STYLE LIST & SORTING
// ==========================================
const uniqueStyleList = computed(() => {
  const styles = new Set(rawHeadersAll.value.map(i => i.xMark).filter(Boolean));
  let arr = [...styles];
  
  // Mengurutkan xMark secara natural (1, 2, 10, dst)
  arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (!searchStyleInput.value) return arr;
  return arr.filter(s => s.toLowerCase().includes(searchStyleInput.value.toLowerCase()));
});

const countRowsPerStyle = (styleName) => {
  return rawHeadersAll.value.filter(item => item.xMark === styleName).length;
};

const selectStyle = (styleName) => {
  selectedStyle.value = styleName;
  const firstItem = rawHeadersAll.value.find(item => item.xMark === styleName);
  styleStartDate.value = firstItem?.tgl_mulai ? firstItem.tgl_mulai.split('T')[0] : '';
  styleEndDate.value   = firstItem?.tgl_selesai ? firstItem.tgl_selesai.split('T')[0] : '';
};

// ==========================================
// FILTERING & SORTING PER SECTION
// ==========================================
const finalFilteredDataFinishing = computed(() => {
  if (!selectedStyle.value) return [];
  
  const deptOrder = {
    'Lo': 1, 'CBS': 2, 'Steam': 3, 'Sewing': 4, 
    'Sontex': 5, 'Sontex Komplit': 6, 'Soom Sontex': 7, 'Soom': 8, 
    'QC Lampu': 9, 'Sulam': 10
  };

  return rawHeadersAll.value
    .filter(i => {
       const deptStr = String(i.dept || '').toLowerCase();
       // Tampilkan di Finishing JIKA dept-nya BUKAN Linking
       return i.xMark === selectedStyle.value && !deptStr.includes('link') && deptStr !== '10161';
    })
    .sort((a, b) => (deptOrder[a.dept] || 99) - (deptOrder[b.dept] || 99));
});

const finalFilteredDataLinking = computed(() => {
  if (!selectedStyle.value) return [];
  
  return rawHeadersAll.value
    .filter(i => {
       const deptStr = String(i.dept || '').toLowerCase();
       // Tampilkan di Linking JIKA dept-nya ADALAH Linking
       return i.xMark === selectedStyle.value && (deptStr.includes('link') || deptStr === '10161');
    });
});

// ==========================================
// TEAM PICKER (teleport ke <body>) — supaya panel checkbox TIDAK PERNAH
// ketutupan oleh overflow-y tabel Finishing/Linking, di section manapun.
// Hanya SATU panel yang dirender, kontennya ganti-ganti sesuai baris & section
// yang sedang dibuka (openTeamPicker).
// ==========================================
const openTeamPicker = ref(null); // { section: 'finishing' | 'linking', headerId: number, kodeDept: string, deptLabel: string } | null
const teamPickerPos = ref({ top: 0, left: 0, width: 280 });
const teamPickerSearch = ref('');

const activeDatasetForPicker = computed(() => {
  if (!openTeamPicker.value) return [];
  return openTeamPicker.value.section === 'linking' ? finalFilteredDataLinking.value : finalFilteredDataFinishing.value;
});

// Dipakai untuk "Terapkan ke Semua" saat toggle team: HARUS dipersempit ke baris
// dengan dept yang SAMA persis, karena tiap dept sekarang punya kolam team sendiri
// (LO/STEAM/CBS/SEWING/SOOMSONTEX/QCLAMPU/SULAM/LINKING_TLS) - menerapkan team_id
// dari 1 dept ke dept lain akan salah/tidak valid.
const activeSameDeptDatasetForPicker = computed(() => {
  if (!openTeamPicker.value) return [];
  return activeDatasetForPicker.value.filter(r => r.dept === openTeamPicker.value.deptLabel);
});

const activeTeamMasterList = computed(() => {
  if (!openTeamPicker.value) return [];
  return teamMasterByKodeDept.value[openTeamPicker.value.kodeDept] || [];
});

const activeRowForPicker = computed(() => {
  if (!openTeamPicker.value) return null;
  return activeDatasetForPicker.value.find(r => r.header_id === openTeamPicker.value.headerId) || null;
});

const selectedCountForPicker = computed(() => activeRowForPicker.value ? activeRowForPicker.value.teamAllocations.length : 0);

// Search box di dalam panel, supaya user gampang cari nama team walau daftarnya panjang.
const filteredTeamPickerOptions = computed(() => {
  const term = teamPickerSearch.value.trim().toLowerCase();
  if (!term) return activeTeamMasterList.value;
  return activeTeamMasterList.value.filter(t => (t.nama_team || '').toLowerCase().includes(term));
});

const closeTeamDropdown = () => { openTeamPicker.value = null; };

const openTeamDropdown = (event, section, row) => {
  const headerId = row.header_id;
  // Klik tombol yang sama saat panel terbuka -> toggle tutup.
  if (openTeamPicker.value && openTeamPicker.value.section === section && openTeamPicker.value.headerId === headerId) {
    closeTeamDropdown();
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const panelWidth = Math.max(rect.width, 300);
  const panelMaxHeight = 360;

  let left = rect.left;
  const maxLeft = window.innerWidth - panelWidth - 12;
  if (left > maxLeft) left = Math.max(12, maxLeft);

  // Buka ke bawah secara default. Kalau ruang di bawah tombol tidak cukup untuk
  // menampung panel, otomatis "flip" ke atas supaya panel tidak pernah terpotong
  // oleh tepi bawah layar.
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  let top;
  if (spaceBelow < panelMaxHeight + 12 && spaceAbove > spaceBelow) {
    top = Math.max(12, rect.top - panelMaxHeight - 6);
  } else {
    top = rect.bottom + 6;
  }

  teamPickerPos.value = { top, left, width: panelWidth };
  teamPickerSearch.value = '';
  openTeamPicker.value = { section, headerId, kodeDept: kodeDeptForDept(row.dept), deptLabel: row.dept };
};

const handleGlobalClickForPicker = (e) => {
  if (!openTeamPicker.value) return;
  if (e.target.closest('.team-picker-trigger') || e.target.closest('.team-picker-teleport-panel')) return;
  closeTeamDropdown();
};
const handleGlobalScrollOrResize = (e) => {
  if (!openTeamPicker.value) return;
  // Abaikan scroll yang terjadi DI DALAM panel sendiri (mis. saat scroll daftar
  // checkbox) - dulu ini ikut ke-capture dan langsung menutup panelnya sendiri.
  if (e && e.target && e.target.closest && e.target.closest('.team-picker-teleport-panel')) return;
  closeTeamDropdown();
};
const handleGlobalEscape = (e) => { if (e.key === 'Escape') closeTeamDropdown(); };

onMounted(() => {
  document.addEventListener('mousedown', handleGlobalClickForPicker);
  window.addEventListener('scroll', handleGlobalScrollOrResize, true);
  window.addEventListener('resize', handleGlobalScrollOrResize);
  document.addEventListener('keydown', handleGlobalEscape);
});
onUnmounted(() => {
  document.removeEventListener('mousedown', handleGlobalClickForPicker);
  window.removeEventListener('scroll', handleGlobalScrollOrResize, true);
  window.removeEventListener('resize', handleGlobalScrollOrResize);
  document.removeEventListener('keydown', handleGlobalEscape);
});

// ==========================================
// TEAM NAME HELPERS
// ==========================================
// Peta SEMUA team lintas kode_dept (bukan cuma dept baris ini) -- dipakai sebagai
// fallback nama kalau ada team_id "nyasar" di teamAllocations yang ternyata bukan
// bagian dari kolam team dept proses ini (data lama/salah dept), supaya tetap
// kelihatan namanya yang jelas, bukan cuma "#183".
const allTeamsById = computed(() => {
  const map = new Map();
  Object.values(teamMasterByKodeDept.value).forEach(list => {
    (list || []).forEach(t => map.set(t.id, t));
  });
  return map;
});

// true kalau team_id ini BUKAN bagian dari kolam team dept baris ini (data nyasar/lama).
const isOrphanTeamForRow = (row, teamId) => !getTeamListForDept(row.dept).some(t => t.id === teamId);

const teamNameById = (teamList, id) => {
  const inDept = teamList.find(t => t.id === id);
  if (inDept) return inDept.nama_team;
  const anyTeam = allTeamsById.value.get(id);
  return anyTeam ? anyTeam.nama_team : `Team #${id} (tidak dikenali)`;
};
const teamNamesLabel = (teamList, ids) => ids.map(id => teamNameById(teamList, id)).join(', ');

// Hapus 1 alokasi team dari baris ini secara LANGSUNG -- dipakai juga untuk team
// "nyasar" (bukan dari dept ini) yang tidak muncul di daftar checkbox picker,
// supaya PPC tetap bisa membersihkannya tanpa harus lewat picker.
const removeTeamAllocation = (row, teamId, dataset, teamList, sectionLabel) => {
  toggleTeam(row, teamId, false, dataset, teamList, sectionLabel);
};

// Baris lain dalam 1 style yang dept-nya SAMA PERSIS dengan baris ini -- dipakai
// sebagai parameter "dataset" saat menghapus team langsung dari list (di luar picker).
const sameDeptRowsFor = (fullDataset, row) => fullDataset.filter(r => r.dept === row.dept);

// ==========================================
// PREVIEW KALKULASI
// Rumus Sulam pakai pengali 0.6 (dikurangi 40%), proses lain pakai 1.2 (ditambah 20%),
// disamakan persis dengan sp_update_plan_ppc_tlsi_proses.
// ==========================================
const isSulamRow = (row) => String(row?.dept || '').toLowerCase() === 'sulam';

const hitungWorker = (qty, xTarget, jam, sulam) => {
  if (!xTarget) return 0;
  const hasilDasar = qty / xTarget / jam;
  return Math.round(hasilDasar * (sulam ? 0.6 : 1.2));
};

// qty_plan per team SEKARANG diambil langsung dari input manual PPC (row.teamAllocations),
// bukan dibagi rata lagi.
const previewForRow = (row, teamList) => {
  const sulam = isSulamRow(row);
  return row.teamAllocations.map(alloc => {
    const team = teamList.find(t => t.id === alloc.team_id) || {};
    const qty = alloc.qty_plan || 0;
    const worker7 = hitungWorker(qty, row.xTarget, 7, sulam);
    const worker14 = hitungWorker(qty, row.xTarget, 14, sulam);
    return {
      team_id: alloc.team_id,
      nama_team: team.nama_team || `#${alloc.team_id}`,
      jml_org: team.jml_org || 0,
      qty_plan: qty,
      worker_7jam: worker7,
      worker_14jam: worker14,
      sisa_7jam: (team.jml_org || 0) - worker7,
      sisa_14jam: (team.jml_org || 0) - worker14
    };
  });
};

// Total qty_plan yang sudah dialokasikan PPC ke semua team di 1 baris proses --
// dipakai untuk validasi "harus pas sama dengan Qty Plan Total".
const totalAllocatedForRow = (row) => row.teamAllocations.reduce((sum, a) => sum + (Number(a.qty_plan) || 0), 0);

// ==========================================
// KAPASITAS TIM (jml_org SATU KOLAM BERSAMA lintas seluruh proses/style)
// ==========================================
// Total worker (7 jam + 14 jam) yang SUDAH terpakai oleh team_id ini di style yang
// SEDANG dibuka, berdasarkan data ASLI dari database (sebelum diedit di form ini).
// Ini dipakai untuk "dikembalikan dulu" dari used_org global, karena begitu style
// ini disimpan alokasi lamanya akan di-replace total.
const originalUsageByTeamInStyle = computed(() => {
  const map = new Map();
  [...finalFilteredDataFinishing.value, ...finalFilteredDataLinking.value].forEach(row => {
    (row.originalUsage || []).forEach(u => {
      map.set(u.team_id, (map.get(u.team_id) || 0) + u.used);
    });
  });
  return map;
});

// Total worker (7 jam + 14 jam) yang LIVE (sesuai isian form saat ini, belum disimpan)
// terpakai oleh team_id ini di seluruh proses Finishing & Linking pada style yang dibuka.
const liveUsageByTeamInStyle = computed(() => {
  const map = new Map();
  [...finalFilteredDataFinishing.value, ...finalFilteredDataLinking.value].forEach(row => {
    const sulam = isSulamRow(row);
    row.teamAllocations.forEach(alloc => {
      const qty = alloc.qty_plan || 0;
      const used = hitungWorker(qty, row.xTarget, 7, sulam) + hitungWorker(qty, row.xTarget, 14, sulam);
      map.set(alloc.team_id, (map.get(alloc.team_id) || 0) + used);
    });
  });
  return map;
});

// Sisa kapasitas org tim ini SECARA GLOBAL (lintas semua style lain di sistem) SETELAH
// memperhitungkan perubahan yang sedang diketik di form ini.
// sisa = jml_org - (used_org_global - used_asli_di_style_ini) - used_live_di_style_ini
const remainingCapacityForTeam = (team) => {
  const globalUsed = team.used_org || 0;
  const originalInStyle = originalUsageByTeamInStyle.value.get(team.id) || 0;
  const liveInStyle = liveUsageByTeamInStyle.value.get(team.id) || 0;
  return (team.jml_org || 0) - (globalUsed - originalInStyle) - liveInStyle;
};

// Dipakai HANYA untuk menampilkan badge info "PENUH" (peringatan visual).
// Checkbox TIDAK di-disable lagi -- PPC tetap bebas memilih team meski kapasitasnya
// sudah habis/nol (misal situasi darurat/override), tanggung jawab keputusan ada di PPC.
const isTeamFull = (team, row) => {
  const alreadyInRow = row.teamAllocations.some(a => a.team_id === team.id);
  if (alreadyInRow) return false; // yang sudah dicentang di baris ini tetap boleh diubah/dihapus
  return remainingCapacityForTeam(team) <= 0;
};

// ==========================================
// SYNC LOGIC
// ==========================================
const sameTeamSet = (a, b) => {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
};

const teamIdsOf = (row) => row.teamAllocations.map(a => a.team_id);

// Menerapkan SET tim yang sama ke semua proses dalam 1 seksi (Finishing/Linking).
// qty_plan TIDAK ikut disamakan (tiap proses punya qty_plan_total sendiri) --
// kalau tim itu sudah ada di baris tsb, qty lamanya dipertahankan; kalau baru, qty diisi 0
// dan PPC wajib mengisinya manual sebelum simpan.
const applyTeamsToWholeStyle = (dataset, teamIds) => {
  dataset.forEach(row => {
    row.teamAllocations = teamIds.map(id => {
      const existing = row.teamAllocations.find(a => a.team_id === id);
      return { team_id: id, qty_plan: existing ? existing.qty_plan : 0 };
    });
  });
};

const applyTeamsToSingleRow = (row, teamIds) => {
  row.teamAllocations = teamIds.map(id => {
    const existing = row.teamAllocations.find(a => a.team_id === id);
    return { team_id: id, qty_plan: existing ? existing.qty_plan : 0 };
  });
};

const toggleTeam = async (row, teamId, checked, dataset, teamList, sectionLabel) => {
  const newTeamIds = checked
    ? [...teamIdsOf(row), teamId]
    : teamIdsOf(row).filter(id => id !== teamId);

  const otherRows = dataset.filter(r => r.header_id !== row.header_id);
  const hasDifferent = otherRows.some(r => teamIdsOf(r).length > 0 && !sameTeamSet(teamIdsOf(r), newTeamIds));

  if (otherRows.length > 0 && hasDifferent) {
    const result = await Swal.fire({
      icon: 'question',
      title: `Team ${sectionLabel} Berbeda?`,
      html: `Pilihan Team <b>${teamNamesLabel(teamList, newTeamIds) || '(kosong)'}</b> berbeda dari proses lain dalam style ini.<br><br>Terapkan ke <b>semua proses ${sectionLabel}</b>, atau hanya <b>${row.xworkname}</b> saja? (Qty Plan per team tetap harus diisi manual masing-masing)`,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Terapkan ke Semua',
      denyButtonText: 'Hanya Proses Ini',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0d6efd',
      denyButtonColor: '#6c757d',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      applyTeamsToWholeStyle(dataset, newTeamIds);
      return;
    } else if (result.isDenied) {
      applyTeamsToSingleRow(row, newTeamIds);
      return;
    } else {
      return;
    }
  }
  applyTeamsToWholeStyle(dataset, newTeamIds);
};

// Qty Plan tiap proses SEKARANG independen per baris -- PPC bebas isi beda-beda
// per proses. Kalau memang mau disamakan ke semua proses, pakai tombol
// "Samakan ke Semua Proses" (applyQtyToWholeStyle) secara sadar/manual, bukan otomatis lagi.
const handleQtyChange = (row, newQty) => {
  row.displayQty = newQty === '' || newQty == null ? 0 : Number(newQty);
};

// Opsional: terapkan Qty Plan baris ini ke SEMUA proses lain di section yang sama
// (Finishing atau Linking). Dipakai kalau PPC memang mau menyamakan qty 1 style,
// tapi ini sekarang pilihan sadar (klik tombol), bukan dipaksa otomatis.
const applyQtyToWholeStyle = (dataset, qty) => {
  const cleanQty = qty === '' || qty == null ? 0 : Number(qty);
  dataset.forEach(r => { r.displayQty = cleanQty; });
};

// PPC mengetik qty_plan manual untuk 1 team di 1 baris proses.
const handleTeamQtyChange = (row, teamId, newQty) => {
  const alloc = row.teamAllocations.find(a => a.team_id === teamId);
  if (alloc) alloc.qty_plan = newQty === '' || newQty == null ? 0 : Number(newQty);
};

// ISI OTOMATIS: bagi rata Qty Plan Total ke semua team yang sudah dicentang di baris ini.
// Setelah otomatis, PPC tetap BEBAS mengubah manual satu-satu kalau mau pembagiannya
// tidak rata (misal salah satu team dapat lebih banyak/sedikit).
const autoFillTeamQty = (row) => {
  const n = row.teamAllocations.length;
  if (n === 0) return;
  const total = Number(row.displayQty) || 0;
  const base = Math.floor((total / n) * 100) / 100; // 2 desimal, sisa pembulatan masuk ke team terakhir
  row.teamAllocations.forEach((alloc, idx) => {
    alloc.qty_plan = idx === n - 1
      ? Math.round((total - base * (n - 1)) * 100) / 100
      : base;
  });
};

// Kosongkan semua qty per team di baris ini (reset ke 0) -- mempermudah PPC yang
// mau mulai ulang isi manual dari nol tanpa harus uncheck-recheck team satu-satu.
const clearTeamQty = (row) => {
  row.teamAllocations.forEach(alloc => { alloc.qty_plan = 0; });
};

const updateStartDateForWholeStyle = (newDate) => {
  finalFilteredDataFinishing.value.forEach(row => { row.tgl_mulai = newDate || null; });
  finalFilteredDataLinking.value.forEach(row => { row.tgl_mulai = newDate || null; });
};

const updateEndDateForWholeStyle = (newDate) => {
  finalFilteredDataFinishing.value.forEach(row => { row.tgl_selesai = newDate || null; });
  finalFilteredDataLinking.value.forEach(row => { row.tgl_selesai = newDate || null; });
};

// ==========================================
// SAVE LOGIC
// ==========================================
const buildPayload = (rows) => rows.map(row => ({
  id: row.header_id,
  qty_plan_total: row.displayQty || 0,
  tgl_mulai: styleStartDate.value || null,
  tgl_selesai: styleEndDate.value || null,
  team_allocations: row.teamAllocations
}));

const saveMassal = async () => {
  const finRows = finalFilteredDataFinishing.value;
  const linkRows = finalFilteredDataLinking.value;
  const allRows = [...finRows, ...linkRows];

  if (finRows.length === 0 && linkRows.length === 0) return;

  if (styleStartDate.value && styleEndDate.value && styleStartDate.value > styleEndDate.value) {
    return Swal.fire('Peringatan', 'Start Date tidak boleh lebih besar dari End Date.', 'warning');
  }

  const rowsMissingTeam = allRows.filter(r => r.teamAllocations.length === 0);
  if (rowsMissingTeam.length > 0) {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Ada proses tanpa Team',
      html: `${rowsMissingTeam.length} proses (Finishing/Linking) belum ada Team yang dicentang. Lanjutkan simpan?`,
      showCancelButton: true,
      confirmButtonText: 'Lanjutkan',
      cancelButtonText: 'Batal'
    });
    if (!confirm.isConfirmed) return;
  }

  // PERINGATAN (BUKAN BLOKIR): total qty_plan per team idealnya pas sama dengan
  // Qty Plan Total proses tsb, tapi PPC tetap BEBAS save walau belum pas -- misalnya
  // proses lain memang qty-nya 0/habis, atau sengaja mau dilanjutkan bertahap.
  const rowsMismatch = allRows.filter(r => r.teamAllocations.length > 0 && Math.abs(totalAllocatedForRow(r) - (r.displayQty || 0)) > 0.01);
  if (rowsMismatch.length > 0) {
    const list = rowsMismatch.map(r => `<li><b>${r.xworkname}</b> (${r.dept}): teralokasi ${totalAllocatedForRow(r)} / target ${r.displayQty || 0}</li>`).join('');
    const confirmMismatch = await Swal.fire({
      icon: 'warning',
      title: 'Qty Plan per Team Belum Pas',
      html: `Total Qty Plan dari semua team di baris berikut belum sama persis dengan Qty Plan Total-nya:<ul class="text-start small mt-2">${list}</ul>Tetap lanjutkan simpan?`,
      showCancelButton: true,
      confirmButtonText: 'Tetap Simpan',
      cancelButtonText: 'Batal, Saya Perbaiki Dulu'
    });
    if (!confirmMismatch.isConfirmed) return;
  }

  try {
    dataLoading.value = true;

    // PENTING: Finishing & Linking sama-sama berasal dari tabel/SP yang sama
    // (plan_ppc_tlsi_proses20260803 / sp_update_plan_ppc_tlsi_proses), jadi
    // HARUS dikirim dalam satu payload ke /update-target. Endpoint lama
    // /update-target-linking menunjuk ke tabel/SP yang berbeda dan akan
    // gagal (500) karena header_id dari section Linking tidak ada di sana.
    const combinedPayload = buildPayload([...finRows, ...linkRows]);

    await axios.post(`${API_BASE_URL}/planppc/update-target`, { dataUpdate: combinedPayload });
    Swal.fire('Sukses', `Data berhasil disimpan!`, 'success');
    await fetchData();
  } catch (err) {
    // Backend selalu balikin { success:false, message: "<pesan spesifik>" }.
    // Urutan fallback: message spesifik dari backend -> error (format lama) -> pesan axios generik.
    const backendMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Terjadi kesalahan tak terduga.';

    Swal.fire({
      icon: 'error',
      title: 'Gagal Menyimpan',
      html: backendMsg,
    });
  } finally {
    dataLoading.value = false;
  }
};

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => {};
</script>

<style scoped>
/* Anda bisa menggunakan CSS bawaan Anda yang sebelumnya. Tidak ada perubahan pada blok style. */
.page-title-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg, #0d6efd, #0b5ed7); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25); flex-shrink: 0; }
.form-label-modern { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; margin-bottom: 5px; display: block; }
.form-control-modern { background: #f8f9fb; border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0.5rem 0.85rem; font-weight: 600; }
.form-control-modern:focus { border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); background: #fff; }
.btn-kembali { background: #eef1f6; color: #495057; border: none; border-radius: 10px; padding: 0.55rem 1rem; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.2s ease; }
.btn-kembali:hover { background: #dee2e6; color: #212529; }
.style-sidebar-card { background: #fff; max-height: 70vh; }
.sidebar-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.sidebar-label i { color: #0d6efd; }
.search-box { position: relative; display: flex; align-items: center; background: #f8f9fb; border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0 10px; }
.search-box i { color: #adb5bd; margin-right: 8px; font-size: 0.85rem; }
.search-box input { border: none; outline: none; box-shadow: none; background: transparent; padding: 0.45rem 0; font-size: 0.85rem; }
.style-list-scroll { max-height: 55vh; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px; }
.style-list-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border: 1.5px solid #eef0f3; border-radius: 10px; padding: 9px 12px; font-size: 0.85rem; font-weight: 600; color: #495057; text-align: left; transition: all 0.15s ease; }
.style-list-item:hover { border-color: #0d6efd; color: #0d6efd; background: #f8faff; }
.style-list-item.active { background: linear-gradient(135deg, #0d6efd, #0b5ed7); border-color: #0d6efd; color: #fff; box-shadow: 0 4px 12px rgba(13,110,253,0.25); }
.style-count-badge { background: #eef1f6; color: #6c757d; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 30px; white-space: nowrap; flex-shrink: 0; }
.style-count-badge-active { background: rgba(255,255,255,0.25); color: #fff; }
.empty-state-card { background: #fff; }
.empty-state-icon { width: 64px; height: 64px; border-radius: 16px; background: #e7edff; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
.min-h-350 { min-height: 350px; }
.max-w-400 { max-width: 400px; }
.planning-panel { background: #fff; }
.planning-eyebrow { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; display: block; }
.btn-save-massal { background: linear-gradient(135deg, #198754, #157347); color: #fff; border: none; border-radius: 12px; padding: 0.6rem 1.4rem; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease; }
.btn-save-massal:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(25,135,84,0.3); color: #fff; }
.btn-save-massal:disabled { opacity: 0.65; }
.info-banner { display: flex; align-items: flex-start; gap: 10px; background: #e7edff; color: #1d4ed8; border-radius: 12px; padding: 12px 16px; }
.info-banner i { font-size: 1rem; margin-top: 2px; flex-shrink: 0; }
.section-heading { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.95rem; padding: 10px 14px; border-radius: 10px; }
.section-heading i { font-size: 1.1rem; }
.section-heading-finishing { background: #e7f3ff; color: #0b5ed7; }
.section-heading-linking { background: #fff4e5; color: #b45309; }
.section-count-badge { margin-left: auto; background: rgba(255,255,255,0.6); font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 30px; }
.planning-table-wrap { overflow-x: auto; border: 1px solid #eef0f3; }
.sticky-thead th { position: sticky; top: 0; background: #11182c; color: #fff; z-index: 5; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.8rem 0.75rem; border: none; }
.sticky-thead-linking th { background: #3a2a12; }
.th-sub { display: block; font-size: 0.6rem; font-weight: 500; opacity: 0.65; text-transform: none; letter-spacing: 0; }
.planning-table tbody td { padding: 0.65rem 0.75rem; vertical-align: middle; border-color: #eef0f3; }
.planning-table tbody tr:hover { background: #f8f9fb; }
.badge-dept { background: #eef1f6; color: #495057; border: 1px solid #e0e4eb; font-weight: 700; font-size: 0.74rem; padding: 4px 10px; border-radius: 30px; white-space: nowrap; }
.btn-team-picker { border: 1.5px solid #cfe0ff; border-radius: 8px; background-color: #f5f8ff; color: #1d4ed8; font-weight: 600; font-size: 0.8rem; }

.team-picker-teleport-panel {
  position: fixed;
  z-index: 3000;
  background: #fff;
  border-radius: 16px;
  max-height: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #eef0f3;
}
.team-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #f1f3f6;
  flex-shrink: 0;
}
.team-picker-title { font-weight: 700; font-size: 0.85rem; color: #1a1f36; margin-right: 8px; }
.team-picker-dept-tag { background: #eef1f6; color: #495057; font-size: 0.66rem; font-weight: 700; padding: 2px 8px; border-radius: 30px; margin-left: 6px; text-transform: uppercase; letter-spacing: 0.02em; }
.team-picker-selected-count {
  background: #e7edff;
  color: #1d4ed8;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 30px;
}
.team-picker-close-btn {
  background: #f4f5f7;
  border: none;
  color: #6c757d;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  transition: all 0.15s ease;
}
.team-picker-close-btn:hover { background: #e9ecef; color: #212529; }
.team-picker-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 14px;
  background: #f8f9fb;
  border: 1.5px solid #e9ecef;
  border-radius: 10px;
  padding: 7px 12px;
  flex-shrink: 0;
}
.team-picker-search-box i { color: #adb5bd; font-size: 0.85rem; }
.team-picker-search-box input { border: none; outline: none; background: transparent; font-size: 0.85rem; width: 100%; }
.team-picker-list { overflow-y: auto; padding: 4px 8px 10px; flex: 1 1 auto; min-height: 0; }
.team-picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: background 0.12s ease;
}
.team-picker-item:hover { background: #f5f8ff; }
.team-picker-item-checked { background: #eef4ff; }
.team-picker-item-checked:hover { background: #e5edff; }
.team-picker-item-disabled { cursor: not-allowed; opacity: 0.55; }
.team-picker-item .form-check-input { flex-shrink: 0; margin-top: 0; cursor: pointer; }
.team-picker-item-disabled .form-check-input { cursor: not-allowed; }
.team-picker-item-body { display: flex; flex-direction: column; gap: 1px; flex-grow: 1; min-width: 0; }
.team-picker-item-name { font-size: 0.84rem; font-weight: 600; color: #212529; }
.team-picker-item-meta { font-size: 0.72rem; color: #6c757d; }
.input-qty { border: 1.5px solid #b9ecc7; border-radius: 8px; background-color: #f4fbf6; color: #157347; }
.input-qty:focus { border-color: #198754; box-shadow: 0 0 0 3px rgba(25,135,84,0.1); }
.preview-list { font-size: 0.76rem; line-height: 1.5; }
.preview-item { border-bottom: 1px dashed #eef0f3; padding-bottom: 2px; }
.alloc-indicator { font-size: 0.68rem; font-weight: 700; text-align: center; }
.team-qty-list { display: flex; flex-direction: column; gap: 4px; }
.team-qty-item { display: flex; align-items: center; gap: 6px; }
.team-qty-label { font-size: 0.74rem; font-weight: 600; color: #495057; min-width: 90px; flex-shrink: 0; }
.team-qty-item .input-qty { max-width: 100px; }
.btn-remove-team { background: #fff0f0; border: 1px solid #f5c2c7; color: #b02a37; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.68rem; flex-shrink: 0; transition: all 0.15s ease; }
.btn-remove-team:hover { background: #f8d7da; color: #842029; }
.btn-xs { font-size: 0.68rem; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
.badge-team-full { background: #f8d7da; color: #842029; font-size: 0.6rem; font-weight: 700; padding: 1px 6px; border-radius: 20px; margin-left: 6px; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0d6efd; }
</style>