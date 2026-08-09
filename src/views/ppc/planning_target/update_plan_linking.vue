<template>
  <div class="d-flex flex-column min-vh-100 bg-light-soft mt-4">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main class="flex-grow-1 p-3 p-md-5" :style="{ marginLeft: sidebarOpen ? '16rem' : '0', transition: 'margin-left 0.3s' }">
        <div class="container-fluid">

          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="page-title-icon">
              <i class="bi bi-pencil-square"></i>
            </div>
            <div class="flex-grow-1">
              <h2 class="h4 fw-bold text-dark mb-0">Update Qty Plan LINKING</h2>
              <p class="text-muted small mb-0">Isi target Team & Qty Plan secara massal per style</p>
            </div>
            <a href="/plan_ppc_linking" class="btn btn-kembali">
              <i class="bi bi-arrow-left me-1"></i> Kembali
            </a>
          </div>

          <div class="row" v-if="rawData.length > 0">

            <div class="col-md-3 mb-4">
              <div class="card border-0 shadow-sm rounded-4 p-3 style-sidebar-card">
                <label class="sidebar-label">
                  <i class="bi bi-tags-fill"></i> Cari & Pilih Style
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
                      {{ countRowsPerStyle(styleOpt) }} Workname
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
                <p class="text-muted small max-w-400 mb-0">Pilih nomor style di sebelah kiri untuk memproses input target secara kilat dan stabil.</p>
              </div>

              <div v-else class="card border-0 shadow-sm rounded-4 p-4 bg-white planning-panel">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <div>
                    <span class="planning-eyebrow">Planning Pengisian Style</span>
                    <h4 class="fw-bold text-primary-emphasis mb-1">{{ selectedStyle }}</h4>
                    <div class="small text-muted">
                      <i class="bi bi-building me-1"></i>
                      Gedung : <span class="badge rounded-pill bg-success px-3 py-2">{{ selectedBuilding || "-" }}</span>
                    </div>
                  </div>
                  <div>
                    <button class="btn btn-save-massal" @click="saveMassal" :disabled="dataLoading">
                      <span v-if="dataLoading" class="spinner-border spinner-border-sm me-2"></span>
                      <i v-else class="bi bi-save-fill me-2"></i> Simpan
                    </button>
                  </div>
                </div>

                <div class="info-banner mb-4">
                  <i class="bi bi-info-circle-fill"></i>
                  <span class="small">
                    Nilai <strong>Start Date</strong> dan <strong>End Date</strong> yang Anda isi di bawah akan otomatis disamakan ke seluruh proses dalam style ini. Untuk <strong>Team</strong> dan <strong>Qty Plan</strong>.
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

                <div class="table-responsive border-0 rounded-3 custom-scrollbar planning-table-wrap">
                  <table class="table table-hover align-middle mb-0 planning-table">
                    <thead class="sticky-thead">
  <tr>
    <th class="text-center">Dept</th>
    <th>WorkName</th>
    <th style="min-width: 500px;" class="text-center">Team / Line (Maksimal 4 Line)</th>
    <th style="width: 150px;" class="text-center">Qty Plan <span class="th-sub">(planning)</span></th>
  </tr>
</thead>
                    <tbody>
  <tr v-for="(row, key) in finalFilteredData" :key="key">
    <td class="text-center">
      <span class="badge-dept">{{ row.dept }}</span>
    </td>
    <td class="fw-semibold text-dark">{{ row.xworkname }}</td>
    
    <!-- Blok Input 4 Line/Team -->
    <td>
      <div class="d-flex gap-2">
        
        <!-- DROP DOWN 1: Team (Line Utama 1) -->
        <div class="custom-dropdown-container flex-grow-1">
          <button 
            type="button"
            class="form-select form-select-sm fw-semibold select-team text-start d-flex justify-content-between align-items-center"
            @click="toggleDropdown(key + '_team')"
          >
            <span class="text-truncate">{{ row.displayTeam || 'Pilih Line...' }}</span>
          </button>
          <div v-if="dropdownStates[key + '_team']?.isOpen" class="custom-dropdown-menu">
            <div class="p-2 sticky-top bg-white border-bottom">
              <input type="text" class="form-control form-control-sm search-team-input" placeholder="Cari..." v-model="dropdownStates[key + '_team'].searchQuery"/>
            </div>
            <div class="custom-dropdown-list custom-scrollbar">
              <button type="button" class="dropdown-item-custom" :class="{ active: row.displayTeam === '' }" @click="updateTeamForRow(row, ''); closeDropdown(key + '_team')">Pilih Line...</button>
              <button v-for="team in filterTeamOptions(dropdownStates[key + '_team'].searchQuery)" :key="team" type="button" class="dropdown-item-custom" :class="{ active: row.displayTeam === team }" @click="updateTeamForRow(row, team); closeDropdown(key + '_team')">{{ team }}</button>
            </div>
          </div>
          <div v-if="dropdownStates[key + '_team']?.isOpen" class="custom-dropdown-backdrop" @click="closeDropdown(key + '_team')"></div>
        </div>

        <!-- DROP DOWN 2: Team Bantuan (Line Bantuan 1) -->
        <div class="custom-dropdown-container flex-grow-1">
          <button 
            type="button"
            class="form-select form-select-sm fw-semibold select-team text-start d-flex justify-content-between align-items-center text-muted"
            @click="toggleDropdown(key + '_bantuan')"
          >
            <span class="text-truncate">{{ row.displayTeamBantuan || 'Pilih Line...' }}</span>
          </button>
          <div v-if="dropdownStates[key + '_bantuan']?.isOpen" class="custom-dropdown-menu">
            <div class="p-2 sticky-top bg-white border-bottom">
              <input type="text" class="form-control form-control-sm search-team-input" placeholder="Cari..." v-model="dropdownStates[key + '_bantuan'].searchQuery"/>
            </div>
            <div class="custom-dropdown-list custom-scrollbar">
              <button type="button" class="dropdown-item-custom" :class="{ active: row.displayTeamBantuan === '' }" @click="updateTeamBantuanForRow(row, ''); closeDropdown(key + '_bantuan')">Pilih Line...</button>
              <button v-for="team in filterTeamOptions(dropdownStates[key + '_bantuan'].searchQuery)" :key="team" type="button" class="dropdown-item-custom" :class="{ active: row.displayTeamBantuan === team }" @click="updateTeamBantuanForRow(row, team); closeDropdown(key + '_bantuan')">{{ team }}</button>
            </div>
          </div>
          <div v-if="dropdownStates[key + '_bantuan']?.isOpen" class="custom-dropdown-backdrop" @click="closeDropdown(key + '_bantuan')"></div>
        </div>

        <!-- DROP DOWN 3: Team Dua (Line Utama 2) -->
        <div class="custom-dropdown-container flex-grow-1">
          <button 
            type="button"
            class="form-select form-select-sm fw-semibold select-team text-start d-flex justify-content-between align-items-center"
            @click="toggleDropdown(key + '_teamdua')"
          >
            <span class="text-truncate">{{ row.displayTeamDua || 'Pilih Line...' }}</span>
          </button>
          <div v-if="dropdownStates[key + '_teamdua']?.isOpen" class="custom-dropdown-menu">
            <div class="p-2 sticky-top bg-white border-bottom">
              <input type="text" class="form-control form-control-sm search-team-input" placeholder="Cari..." v-model="dropdownStates[key + '_teamdua'].searchQuery"/>
            </div>
            <div class="custom-dropdown-list custom-scrollbar">
              <button type="button" class="dropdown-item-custom" :class="{ active: row.displayTeamDua === '' }" @click="updateTeamDuaForRow(row, ''); closeDropdown(key + '_teamdua')">Pilih Line...</button>
              <button v-for="team in filterTeamOptions(dropdownStates[key + '_teamdua'].searchQuery)" :key="team" type="button" class="dropdown-item-custom" :class="{ active: row.displayTeamDua === team }" @click="updateTeamDuaForRow(row, team); closeDropdown(key + '_teamdua')">{{ team }}</button>
            </div>
          </div>
          <div v-if="dropdownStates[key + '_teamdua']?.isOpen" class="custom-dropdown-backdrop" @click="closeDropdown(key + '_teamdua')"></div>
        </div>

        <!-- DROP DOWN 4: Team Bantuan Dua (Line Bantuan 2) -->
        <div class="custom-dropdown-container flex-grow-1">
          <button 
            type="button"
            class="form-select form-select-sm fw-semibold select-team text-start d-flex justify-content-between align-items-center text-muted"
            @click="toggleDropdown(key + '_bantuandua')"
          >
            <span class="text-truncate">{{ row.displayTeamBantuanDua || 'Pilih Line...' }}</span>
          </button>
          <div v-if="dropdownStates[key + '_bantuandua']?.isOpen" class="custom-dropdown-menu">
            <div class="p-2 sticky-top bg-white border-bottom">
              <input type="text" class="form-control form-control-sm search-team-input" placeholder="Cari..." v-model="dropdownStates[key + '_bantuandua'].searchQuery"/>
            </div>
            <div class="custom-dropdown-list custom-scrollbar">
              <button type="button" class="dropdown-item-custom" :class="{ active: row.displayTeamBantuanDua === '' }" @click="updateTeamBantuanDuaForRow(row, ''); closeDropdown(key + '_bantuandua')">Pilih Line...</button>
              <button v-for="team in filterTeamOptions(dropdownStates[key + '_bantuandua'].searchQuery)" :key="team" type="button" class="dropdown-item-custom" :class="{ active: row.displayTeamBantuanDua === team }" @click="updateTeamBantuanDuaForRow(row, team); closeDropdown(key + '_bantuandua')">{{ team }}</button>
            </div>
          </div>
          <div v-if="dropdownStates[key + '_bantuandua']?.isOpen" class="custom-dropdown-backdrop" @click="closeDropdown(key + '_bantuandua')"></div>
        </div>

      </div>
    </td>

    <!-- Input Qty Plan -->
    <td>
      <input type="number" class="form-control form-control-sm text-center fw-bold input-qty" v-model.number="row.displayQty"
        @input="updateQtyForRow(row, row.displayQty)" placeholder="0" min="0"
      >
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
import { ref, reactive, computed, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import Header from "../../../components/Header.vue";
import Sidebar from "../../../components/Sidebar.vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sidebarOpen = ref(true);
const user = ref({ name: "User" });
const rawData = ref([]);
const dataLoading = ref(false);

const searchStyleInput = ref("");
const selectedStyle = ref(null);
const styleStartDate = ref("");
const styleEndDate = ref("");

const selectedBuilding = ref("");

// Objek Reaktif Independen Khusus untuk mengontrol State Buka/Tutup & Pencarian Dropdown per baris tabel
const dropdownStates = reactive({});

const teamOptions = computed(() => {
  const teams = [];
  // 1. Generate opsi default A01 sampai D30
  ["A", "B", "C", "D"].forEach(prefix => {
    for (let i = 1; i <= 30; i++) {
      teams.push(`${prefix}${String(i).padStart(2, "0")}`);
    }
  });
  // 2. Nyempil satu opsi "X" saja di paling bawah daftar
  teams.push("X");
  return teams;
});

const uniqueStyleList = computed(() => {
  const styles = [...new Set(rawData.value.map(i => i.xMark))].filter(Boolean);
  if (!searchStyleInput.value) return styles;
  return styles.filter(s => s.toLowerCase().includes(searchStyleInput.value.toLowerCase()));
});

const countRowsPerStyle = (styleName) => {
  return [...new Set(rawData.value.filter(item => item.xMark === styleName).map(item => item.xworkname))].length;
};

const selectStyle = (styleName) => {
  selectedStyle.value = styleName;

  const firstItem = rawData.value.find(item => item.xMark === styleName);

  styleStartDate.value = firstItem?.startdatetime
    ? firstItem.startdatetime.split("T")[0]
    : "";

  styleEndDate.value = firstItem?.enddatetime
    ? firstItem.enddatetime.split("T")[0]
    : "";

  selectedBuilding.value = firstItem?.gedung || "";
  
  // Reset semua state dropdown lama saat berpindah style
  for (const prop in dropdownStates) { delete dropdownStates[prop]; }
};

// Fungsi Kontrol Dropdown Custom
const toggleDropdown = (key) => {
  if (!dropdownStates[key]) {
    dropdownStates[key] = { isOpen: false, searchQuery: "" };
  }
  // Tutup dropdown lain yang mungkin sedang terbuka agar tidak tumpang tindih
  for (const k in dropdownStates) {
    if (k !== key) dropdownStates[k].isOpen = false;
  }
  dropdownStates[key].isOpen = !dropdownStates[key].isOpen;
};

const closeDropdown = (key) => {
  if (dropdownStates[key]) {
    dropdownStates[key].isOpen = false;
    dropdownStates[key].searchQuery = "";
  }
};

const selectTeamValue = (row, key, team) => {
  updateTeamForRow(row, team);
  closeDropdown(key);
};

const updateTeamForRow = (row, newTeam) => {
  row.displayTeam = newTeam;
  row.rawItems.forEach(item => {
    item.team = newTeam;
  });
};

// Tambahkan fungsi-fungsi baru ini di bawah fungsi `updateTeamForRow` lama Anda

const updateTeamDuaForRow = (row, newTeam) => {
  row.displayTeamDua = newTeam;
  row.rawItems.forEach(item => {
    item.teamdua = newTeam;
  });
};

const updateTeamBantuanForRow = (row, newTeam) => {
  row.displayTeamBantuan = newTeam;
  row.rawItems.forEach(item => {
    item.team_bantuan = newTeam;
  });
};

const updateTeamBantuanDuaForRow = (row, newTeam) => {
  row.displayTeamBantuanDua = newTeam;
  row.rawItems.forEach(item => {
    item.team_bantuandua = newTeam;
  });
};

const updateStartDateForWholeStyle = (newDate) => {
  rawData.value.forEach(item => {
    if (item.xMark === selectedStyle.value) item.startdatetime = newDate ? new Date(newDate).toISOString() : null;
  });
};

const updateEndDateForWholeStyle = (newDate) => {
  rawData.value.forEach(item => {
    if (item.xMark === selectedStyle.value) item.enddatetime = newDate ? new Date(newDate).toISOString() : null;
  });
};

const updateQtyForRow = (row, newQty) => {
  const cleanQty = newQty === '' || newQty == null ? 0 : newQty;
  row.displayQty = cleanQty;
  row.rawItems.forEach(item => {
    item.qty_plan = cleanQty;
  });
};

// Pengelompokan Data (Grouping)
const groupedData = computed(() => {
  const group = {};
  rawData.value.forEach(item => {
    const key = `${item.xMark}-${item.dept}-${item.xworkname}`;
    if (!group[key]) {
      group[key] = {
        xMark: item.xMark,
        dept: item.dept,
        xworkname: item.xworkname,
        displayTeam: item.team || '',
        displayTeamBantuan: item.team_bantuan || '',
        displayTeamDua: item.teamdua || '',
        displayTeamBantuanDua: item.team_bantuandua || '',
        displayQty: item.qty_plan || 0,
        rawItems: []
      };
    }
    group[key].rawItems.push(item);
  });
  return group;
});

const finalFilteredData = computed(() => {
  if (!selectedStyle.value) return [];
  return Object.values(groupedData.value).filter(i => i.xMark === selectedStyle.value);
});

// Helper filter opsi team berdasarkan search input
const filterTeamOptions = (query) => {
  if (!query) return teamOptions.value;
  return teamOptions.value.filter(team => 
    team.toLowerCase().includes(query.toLowerCase())
  );
};

const toggleSidebar = () => sidebarOpen.value = !sidebarOpen.value;
const logout = () => {};

const fetchData = async () => {
  dataLoading.value = true;
  selectedStyle.value = null;
  try {
    const res = await axios.get(`${API_BASE_URL}/planppc/view-target2-linking`);
    rawData.value = res.data;
  } catch (err) {
    Swal.fire('Error', 'Gagal memuat data.', 'error');
  } finally {
    dataLoading.value = false;
  }
};

onMounted(() => fetchData());

const saveMassal = async () => {
  if (finalFilteredData.value.length === 0) return;

  if (styleStartDate.value && styleEndDate.value && styleStartDate.value > styleEndDate.value) {
    return Swal.fire('Peringatan', 'Start Date tidak boleh lebih besar dari End Date.', 'warning');
  }

  const startVal = styleStartDate.value ? new Date(styleStartDate.value).toISOString() : null;
  const endVal   = styleEndDate.value   ? new Date(styleEndDate.value).toISOString()   : null;

  const payload = finalFilteredData.value.map(row => ({
    ...row.rawItems[0],
    qty_plan: row.displayQty,
    
    // --- PASTIKAN KE-4 LINE INI DIKIRIM KE BACKEND ---
    team: row.displayTeam,
    team_bantuan: row.displayTeamBantuan,
    teamdua: row.displayTeamDua,
    team_bantuandua: row.displayTeamBantuanDua,
    
    startdatetime: startVal,
    enddatetime: endVal
  }));

  try {
    dataLoading.value = true;
    await axios.post(`${API_BASE_URL}/planppc/update-target-linking`, { dataUpdate: payload });
    Swal.fire('Sukses', `Data untuk Style ${selectedStyle.value} berhasil disimpan!`, 'success');
  } catch (err) {
    Swal.fire('Error', 'Gagal menyimpan perubahan.', 'error');
  } finally {
    dataLoading.value = false;
  }
};
</script>

<style scoped>
/* --- UTILITY & GLOBAL PAGE STYLE --- */
.page-title-icon { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg, #0d6efd, #0b5ed7); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25); flex-shrink: 0; }
.filter-card { background: #fff; }
.filter-card-title { font-size: 0.85rem; font-weight: 700; color: #1d4ed8; display: flex; align-items: center; gap: 8px; margin-bottom: 1.1rem; }
.form-label-modern { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; margin-bottom: 5px; display: block; }
.form-control-modern { background: #f8f9fb; border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0.5rem 0.85rem; font-weight: 600; }
.form-control-modern:focus { border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); background: #fff; }
.btn-tampilkan { background: linear-gradient(135deg, #0d6efd, #0b5ed7); color: #fff; border: none; border-radius: 10px; padding: 0.55rem 1rem; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.btn-tampilkan:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(13,110,253,0.3); color: #fff; }
.btn-tampilkan:disabled { opacity: 0.65; }
.btn-kembali { background: #eef1f6; color: #495057; border: none; border-radius: 10px; padding: 0.55rem 1rem; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.2s ease; }
.btn-kembali:hover { background: #dee2e6; color: #212529; }

/* --- SIDEBAR STYLE --- */
.style-sidebar-card { background: #fff; max-height: 70vh; }
.sidebar-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.sidebar-label i { color: #0d6efd; }
.search-box { position: relative; display: flex; align-items: center; background: #f8f9fb; border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0 10px; }
.search-box i { color: #adb5bd; margin-right: 8px; font-size: 0.85rem; }
.search-box input { border: none; outline: none; box-shadow: none; background: transparent; padding: 0.45rem 0; font-size: 0.85rem; }
.style-list-scroll { max-height: 55vh; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 4px; }
.style-list-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border: 1.5px solid #eef0f3; border-radius: 10px; padding: 9px 12px; font-size: 0.85rem; font-weight: 600; color: #495057; text-align: left; transition: all 0.15s ease; }
.style-list-item:hover { border-color: #0d6efd; color: #0d6efd; background: #f8faff; }
.style-list-item.active { background: linear-gradient(135deg, #0d6efd, #0b5ed7); border-color: #0d6efd; color: #fff; box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25); }
.style-count-badge { background: #eef1f6; color: #6c757d; font-size: 0.68rem; font-weight: 700; padding: 3px 9px; border-radius: 30px; white-space: nowrap; flex-shrink: 0; }
.style-count-badge-active { background: rgba(255,255,255,0.25); color: #fff; }

/* --- EMPTY STATE STYLE --- */
.empty-state-card { background: #fff; }
.empty-state-icon { width: 64px; height: 64px; border-radius: 16px; background: #e7edff; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
.min-h-350 { min-height: 350px; }
.max-w-400 { max-width: 400px; }

/* --- PLANNING PANEL STYLE --- */
.planning-panel { 
  background: #fff; 
  min-height: 100vh; 
}
.planning-eyebrow { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6c757d; display: block; }
.btn-save-massal { background: linear-gradient(135deg, #198754, #157347); color: #fff; border: none; border-radius: 12px; padding: 0.6rem 1.4rem; font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease; }
.btn-save-massal:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(25,135,84,0.3); color: #fff; }
.btn-save-massal:disabled { opacity: 0.65; }
.info-banner { display: flex; align-items: flex-start; gap: 10px; background: #e7edff; color: #1d4ed8; border-radius: 12px; padding: 12px 16px; }
.info-banner i { font-size: 1rem; margin-top: 2px; flex-shrink: 0; }

/* --- TABLE LAYOUT & STICKY THEAD --- */
.sticky-thead th { position: sticky; top: 0; background: #11182c; color: #fff; z-index: 10; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.8rem 0.75rem; border: none; }
.th-sub { display: block; font-size: 0.6rem; font-weight: 500; opacity: 0.65; text-transform: none; letter-spacing: 0; }

/* Menjadikan baris tr sebagai jangkar relatif posisi dropdown */
.planning-table tbody tr {
  position: relative;
}
.planning-table tbody td { padding: 0.65rem 0.75rem; vertical-align: middle; border-color: #eef0f3; }
.planning-table tbody tr:hover { background: #f8f9fb; }
.badge-dept { background: #eef1f6; color: #495057; border: 1px solid #e0e4eb; font-weight: 700; font-size: 0.74rem; padding: 4px 10px; border-radius: 30px; white-space: nowrap; }

/* --- INPUTS INSIDE TABLE --- */
.select-team { 
  position: relative;
  z-index: 1;
  border: 1.5px solid #cfe0ff; 
  border-radius: 8px; 
  background-color: #f5f8ff; 
  color: #1d4ed8; 
  width: 100%; 
  transition: all 0.2s ease-in-out;
}
.select-team:focus { border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); }

.input-qty { border: 1.5px solid #b9ecc7; border-radius: 8px; background-color: #f4fbf6; color: #157347; }
.input-qty:focus { border-color: #198754; box-shadow: 0 0 0 3px rgba(25,135,84,0.1); }

/* GLOBAL SCROLLBAR CUSTOMIZATION */
.custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0d6efd; }

/* ==========================================================================
   KUNCI UTAMA ANTI-TERPOTONG (TABLE OVERFLOW & DROPDOWN Z-INDEX FIX)
   ========================================================================== */

/* 1. Menetralkan paksaan class .table-responsive bawaan Bootstrap */
.table-responsive {
  overflow-x: visible !important;
  overflow-y: visible !important;
}

/* 2. Container Pembungkus Tabel Utama */
.planning-table-wrap {
  max-height: 80vh;
  overflow-y: auto !important;
  overflow-x: visible !important; /* Wajib visible agar dropdown menyembul keluar */
  padding-bottom: 220px !important; /* Memberikan ruang napas ekstra tebal untuk baris paling bawah */
}

/* 3. Container Elemen Dropdown */
.custom-dropdown-container {
  position: relative;
  width: 100%;
}

/* 4. Kotak Menu Dropdown Yang Melayang Komplit */
.custom-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  min-width: 175px;
  max-height: 250px;
  background: #ffffff;
  border: 1px solid #cfe0ff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  
  /* Naik ke kasta tertinggi dokumen melompati tr/td lain */
  z-index: 99999 !important; 
  
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeInDropdown 0.12s ease-out;
}

/* 5. List Kontainer Opsi (A01 - D30) */
.custom-dropdown-list {
  max-height: 190px;
  overflow-y: auto !important; /* Mengaktifkan scrollbar internal di dalam kotak menu */
  display: flex;
  flex-direction: column;
}

/* Mempercantik Scrollbar Opsi List di dalam Dropdown */
.custom-dropdown-list::-webkit-scrollbar {
  width: 5px;
}
.custom-dropdown-list::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 10px;
}
.custom-dropdown-list::-webkit-scrollbar-thumb:hover {
  background: #0d6efd;
}

/* Input kolom pencarian di dalam dropdown */
.search-team-input {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.8rem;
}
.search-team-input:focus {
  border-color: #0d6efd;
  box-shadow: none;
}

/* Item Tombol Opsi Pilihan */
.dropdown-item-custom {
  width: 100%;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  text-align: left;
  background: transparent;
  border: none;
  transition: background 0.1s ease, color 0.1s ease;
}
.dropdown-item-custom:hover {
  background-color: #f5f8ff;
  color: #0d6efd;
}
.dropdown-item-custom.active {
  background: #0d6efd;
  color: #fff;
}

/* Lapisan transparan penutup klik area luar dropdown */
.custom-dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99998; /* Berada tepat 1 lapis di bawah menu utama */
  background: transparent;
}

@keyframes fadeInDropdown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>