<template>
  <div class="car-booking-container">
    <header class="header">
      <h2>🚗 Sistem Booking Mobil Operasional &amp; Biaya BBM</h2>
      <p class="subtitle">Multi Role Approval (GA → Finance → Manager) &amp; Security Checkpoint</p>
    </header>

    <nav class="nav-tabs">
      <button :class="{ active: activeTab === 'master-mobil' }" @click="activeTab = 'master-mobil'">🚘 Master Mobil</button>
      <button :class="{ active: activeTab === 'master-tujuan' }" @click="activeTab = 'master-tujuan'">📍 Master Tujuan</button>
      <button :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'; fetchBookings()">📋 Daftar Booking</button>
      <button :class="{ active: activeTab === 'create' }" @click="activeTab = 'create'">📝 Form Booking</button>
      <button :class="{ active: activeTab === 'ga' }" @click="activeTab = 'ga'">🏢 GA Approval</button>
      <button :class="{ active: activeTab === 'finance' }" @click="activeTab = 'finance'">💰 Finance &amp; Manager</button>
      <button :class="{ active: activeTab === 'security' }" @click="activeTab = 'security'">🛡️ Checkpoint Security</button>
      <button :class="{ active: activeTab === 'driver' }" @click="activeTab = 'driver'">🚘 Log Driver &amp; BBM</button>
      <button :class="{ active: activeTab === 'settlement' }" @click="activeTab = 'settlement'">📊 Settlement Kasbon</button>
    </nav>

    <main class="tab-content">
      <!-- 0. MASTER DATA MOBIL -->
      <section v-if="activeTab === 'master-mobil'" class="card">
        <h3>🚗 Kelola Data Armada Mobil</h3>
        <p class="info-text">Input dan pantau ketersediaan kendaraan operasional.</p>

        <form @submit.prevent="submitMobil" class="sub-section">
          <h4>Tambah Mobil Baru</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>Kode Mobil</label>
              <input type="text" v-model="formMobil.kode_mobil" placeholder="Contoh: MBL-001" required />
            </div>
            <div class="form-group">
              <label>Nama / Merk Mobil</label>
              <input type="text" v-model="formMobil.nama_mobil" placeholder="Contoh: Avanza Black" required />
            </div>
            <div class="form-group">
              <label>Jenis</label>
              <input type="text" v-model="formMobil.jenis" placeholder="Contoh: MPV, Pickup" required />
            </div>
            <div class="form-group">
              <label>Plat Nomor</label>
              <input type="text" v-model="formMobil.plat_nomor" placeholder="Contoh: B 1234 TLS" required />
            </div>
            <div class="form-group">
              <label>Status Awal</label>
              <select v-model="formMobil.status" required>
                <option value="Tersedia">Tersedia</option>
                <option value="Dibooking">Dibooking</option>
                <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                <option value="Servis">Servis</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loadingMobil">Simpan Mobil</button>
        </form>

        <hr />

        <div class="sub-section">
          <div class="header-with-btn">
            <h4>Daftar Mobil Terdaftar</h4>
            <button @click="fetchMobil" class="btn btn-secondary btn-sm">🔄 Refresh Data</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kode</th>
                <th>Nama / Merk</th>
                <th>Jenis</th>
                <th>No. Polisi</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="listMobil.length === 0">
                <td colspan="6" class="text-center">Belum ada data mobil. Silakan tambah data di atas.</td>
              </tr>
              <tr v-for="mobil in listMobil" :key="mobil.id">
                <td>#{{ mobil.id }}</td>
                <td>{{ mobil.kode_mobil }}</td>
                <td><strong>{{ mobil.nama_mobil }}</strong></td>
                <td>{{ mobil.jenis }}</td>
                <td>{{ mobil.plat_nomor }}</td>
                <td><span class="badge" :class="statusClass(mobil.status)">{{ mobil.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 0b. MASTER TEMPAT TUJUAN -->
      <section v-if="activeTab === 'master-tujuan'" class="card">
        <h3>📍 Master Tempat Tujuan</h3>
        <div class="form-grid">
          <input type="text" v-model="tujuanBaru" placeholder="Nama Lokasi Tujuan" />
          <button @click="submitTujuan" class="btn btn-primary">+ Tambah Tujuan</button>
        </div>
        <table class="data-table">
          <thead><tr><th>ID</th><th>Nama Lokasi</th></tr></thead>
          <tbody>
            <tr v-if="listTujuan.length === 0"><td colspan="2" class="text-center">Belum ada data tujuan.</td></tr>
            <tr v-for="t in listTujuan" :key="t.id"><td>#{{ t.id }}</td><td>{{ t.nama_lokasi }}</td></tr>
          </tbody>
        </table>
      </section>

      <!-- 0c. DAFTAR BOOKING -->
      <section v-if="activeTab === 'list'" class="card">
        <h3>📋 Daftar Booking</h3>
        <div class="form-grid">
          <select v-model="filterStatus" @change="fetchBookings">
            <option value="">Semua Status</option>
            <option v-for="s in STATUS_LIST" :key="s" :value="s">{{ s }}</option>
          </select>
          <button @click="fetchBookings" class="btn btn-secondary btn-sm">🔄 Refresh</button>
        </div>
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Kode</th><th>Tanggal</th><th>Tujuan</th><th>Mobil</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr v-if="listBooking.length === 0"><td colspan="6" class="text-center">Tidak ada booking.</td></tr>
            <tr v-for="b in listBooking" :key="b.id">
              <td>#{{ b.id }}</td>
              <td>{{ b.kode_booking }}</td>
              <td>{{ b.tgl_berangkat }}</td>
              <td>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</td>
              <td>{{ b.mobil ? `${b.mobil.nama_mobil} (${b.mobil.plat_nomor})` : '-' }}</td>
              <td><span class="badge" :class="statusClass(b.status_booking)">{{ b.status_booking }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 1. FORM PENGAJUAN USER -->
      <section v-if="activeTab === 'create'" class="card">
        <h3>Pengajuan Booking Mobil Baru</h3>
        <form @submit.prevent="submitBooking">
          <div class="form-grid">
            <div class="form-group">
              <label>User ID Pemohon</label>
              <input type="number" v-model="formBooking.user_id" placeholder="ID User yang login" required />
            </div>
            <div class="form-group">
              <label>Jenis Perjalanan</label>
              <select v-model="formBooking.jenis_perjalanan" required>
                <option value="Sekali Jalan">Sekali Jalan</option>
                <option value="PP">Pulang Pergi (PP)</option>
                <option value="Terjadwal">Terjadwal</option>
              </select>
            </div>
            <div class="form-group">
              <label>Lokasi Asal / Keberangkatan</label>
              <input type="text" v-model="formBooking.dari_lokasi" placeholder="Contoh: Plant A - Gate 1" required />
            </div>
            <div class="form-group">
              <label>Tujuan (Master Data)</label>
              <select v-model="formBooking.tujuan_id">
                <option value="">— pilih dari master —</option>
                <option v-for="t in listTujuan" :key="t.id" :value="t.id">{{ t.nama_lokasi }}</option>
              </select>
            </div>
            <div class="form-group" v-if="!formBooking.tujuan_id">
              <label>Atau Tujuan Custom</label>
              <input type="text" v-model="formBooking.lokasi_tujuan_custom" placeholder="Nama Perusahaan / Alamat Tujuan" />
            </div>
            <div class="form-group">
              <label>Tanggal &amp; Jam Berangkat</label>
              <div class="row-inputs">
                <input type="date" v-model="formBooking.tgl_berangkat" required />
                <input type="time" v-model="formBooking.jam_berangkat" required />
              </div>
            </div>
            <div class="form-group">
              <label>Tanggal &amp; Jam Kembali</label>
              <div class="row-inputs">
                <input type="date" v-model="formBooking.tgl_kembali" />
                <input type="time" v-model="formBooking.jam_kembali" />
              </div>
            </div>
            <div class="form-group">
              <label>Jumlah Penumpang</label>
              <input type="number" min="1" v-model="formBooking.jumlah_org" required />
            </div>
            <div class="form-group">
              <label>Kategori Biaya</label>
              <select v-model="formBooking.kategori_biaya">
                <option value="">-</option>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
            <div class="form-group">
              <label>Nominal Kasbon (Rp)</label>
              <input type="number" v-model="formBooking.nominal_kasbon" placeholder="0" />
            </div>
          </div>
          <div class="form-group">
            <label>Daftar Nama Penumpang</label>
            <textarea v-model="formBooking.daftar_penumpang" placeholder="Rudi (QC), Siska (HR)..."></textarea>
          </div>
          <div class="form-group">
            <label>Keperluan / Remark</label>
            <textarea v-model="formBooking.remark" placeholder="Keperluan dinas luar, kunjungan vendor, dll."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">Kirim Pengajuan</button>
        </form>
      </section>

      <!-- 2. APPROVAL GA -->
      <section v-if="activeTab === 'ga'" class="card">
        <h3>Persetujuan GA (General Affair)</h3>
        <p class="info-text">Pilih armada mobil dan tunjuk driver untuk pengajuan yang masuk.</p>

        <div class="form-group">
          <label>Pilih ID Booking</label>
          <input type="number" v-model="gaForm.booking_id" placeholder="Masukkan ID Booking" />
        </div>
        <div class="form-grid" v-if="gaForm.booking_id">
          <div class="form-group">
            <label>GA Approver ID</label>
            <input type="number" v-model="gaForm.ga_approver_id" placeholder="ID User GA" required />
          </div>
          <div class="form-group">
            <label>Pilih Mobil (Tersedia)</label>
            <select v-model="gaForm.mobil_id" required>
              <option value="" disabled>-- Pilih Mobil --</option>
              <option v-for="m in listMobil.filter(m => m.status === 'Tersedia')" :key="m.id" :value="m.id">
                {{ m.nama_mobil }} - {{ m.plat_nomor }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Pilih Driver (Sopir)</label>
            <input type="number" v-model="gaForm.driver_id" placeholder="ID User Driver" required />
          </div>
          <div class="form-group">
            <label>Butuh Approval Finance?</label>
            <select v-model="gaForm.butuh_finance">
              <option :value="false">Tidak</option>
              <option :value="true">Ya</option>
            </select>
          </div>
        </div>
        <div class="button-group">
          <button @click="processGA('Approved')" class="btn btn-success">Approve &amp; Assign Armada</button>
          <button @click="processGA('Rejected')" class="btn btn-danger">Tolak Booking</button>
        </div>
      </section>

      <!-- 3. FINANCE & MANAGER -->
      <section v-if="activeTab === 'finance'" class="card">
        <h3>Persetujuan Biaya &amp; Anggaran</h3>

        <div class="sub-section">
          <h4>1. Verifikasi Finance</h4>
          <div class="form-grid">
            <input type="number" v-model="financeForm.booking_id" placeholder="ID Booking" />
            <input type="number" v-model="financeForm.finance_approver_id" placeholder="ID User Finance" />
          </div>
          <div class="button-group">
            <button @click="processFinance('Approved')" class="btn btn-success">Approve Finance</button>
            <button @click="processFinance('Rejected')" class="btn btn-danger">Tolak Finance</button>
          </div>
        </div>

        <hr />

        <div class="sub-section">
          <h4>2. Persetujuan Manager</h4>
          <div class="form-grid">
            <input type="number" v-model="managerForm.booking_id" placeholder="ID Booking" />
            <input type="number" v-model="managerForm.manager_approver_id" placeholder="ID User Manager" />
          </div>
          <div class="button-group">
            <button @click="processManager('Approved')" class="btn btn-success">Approve Anggaran</button>
            <button @click="processManager('Rejected')" class="btn btn-danger">Tolak Anggaran</button>
          </div>
        </div>
      </section>

      <!-- 4. CHECKPOINT SECURITY -->
      <section v-if="activeTab === 'security'" class="card">
        <h3>Pencatatan Kilometer Pos Security</h3>

        <div class="form-group">
          <label>Status Checkpoint</label>
          <select v-model="securityForm.type">
            <option value="out">Mobil Keluar (Outbound)</option>
            <option value="in">Mobil Kembali (Inbound)</option>
          </select>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>ID Booking</label>
            <input type="number" v-model="securityForm.booking_id" required />
          </div>
          <div class="form-group">
            <label>ID Petugas Security</label>
            <input type="number" v-model="securityForm.security_id" required />
          </div>
          <div class="form-group">
            <label>Kilometer Manual (Speedometer)</label>
            <input type="number" v-model="securityForm.km_manual" placeholder="Contoh: 45200" required />
          </div>
          <div class="form-group">
            <label>Kilometer GPS (Opsional)</label>
            <input type="number" v-model="securityForm.km_gps" placeholder="Otomatis dari Sistem GPS" />
          </div>
        </div>

        <button @click="submitSecurity" class="btn btn-primary">Simpan Record Security</button>
        <p class="file-info">📌 Upload foto bukti fisik dicatat lewat tab lampiran booking terpisah (endpoint <code>/booking/:id/attachments</code>) setelah checkpoint tersimpan.</p>
      </section>

      <!-- 5. LOG DRIVER DI JALAN -->
      <section v-if="activeTab === 'driver'" class="card">
        <h3>Aktivitas Driver di Lapangan</h3>

        <div class="sub-section">
          <h4>1. Tambah Perhentian / Mampir</h4>
          <div class="form-grid">
            <input type="number" v-model="driverWaypoint.booking_id" placeholder="ID Booking" />
            <input type="number" v-model="driverWaypoint.urutan" placeholder="Urutan ke-" />
            <input type="text" v-model="driverWaypoint.nama_lokasi" placeholder="Lokasi Mampir (Rest Area/Vendor)" />
            <input type="number" v-model="driverWaypoint.km_saat_mampir_manual" placeholder="KM Speedometer" />
          </div>
          <div class="form-group">
            <textarea v-model="driverWaypoint.alasan_mampir" placeholder="Alasan mampir (Isi Angin/Istirahat/Makan)"></textarea>
          </div>
          <button @click="submitWaypoint" class="btn btn-secondary">Simpan Perhentian</button>
        </div>

        <hr />

        <div class="sub-section">
          <h4>2. Recording Transaksi BBM</h4>
          <div class="form-grid">
            <input type="number" v-model="driverFuel.booking_id" placeholder="ID Booking" />
            <input type="number" v-model="driverFuel.jumlah_liter" placeholder="Jumlah Liter (cth: 25.5)" step="0.01" />
            <input type="number" v-model="driverFuel.total_biaya" placeholder="Total Nominal (Rp)" />
            <input type="number" v-model="driverFuel.km_saat_isi" placeholder="KM Saat Isi BBM" />
          </div>
          <button @click="submitFuel" class="btn btn-secondary">Simpan Nota BBM</button>
        </div>
      </section>

      <!-- 6. SETTLEMENT KEUANGAN -->
      <section v-if="activeTab === 'settlement'" class="card">
        <h3>Rekonsiliasi Kasbon vs Realisasi BBM</h3>
        <p class="info-text">Total biaya realistis dihitung otomatis dari total seluruh nota BBM booking terkait.</p>
        <div class="form-grid">
          <input type="number" v-model="settlementForm.booking_id" placeholder="ID Booking (status harus Completed)" />
          <button @click="submitSettlement" class="btn btn-success">Generate Settlement</button>
        </div>

        <div v-if="settlementResult" class="result-box">
          <h4>Hasil Kalkulasi:</h4>
          <p>Kasbon Awal: <strong>Rp {{ formatRupiah(settlementResult.nominal_kasbon_awal) }}</strong></p>
          <p>Total Realisasi BBM: <strong>Rp {{ formatRupiah(settlementResult.total_biaya_realistis) }}</strong></p>
          <p>Selisih: <strong>Rp {{ formatRupiah(settlementResult.selisih) }}</strong></p>
          <p>Status Selisih: <span class="badge" :class="statusClass(settlementResult.status_selisih)">{{ settlementResult.status_selisih }}</span></p>

          <div class="form-group" style="margin-top: 12px;">
            <textarea v-model="catatanSettlement" placeholder="Catatan penyelesaian (opsional)"></textarea>
          </div>
          <button @click="selesaikanSettlement" class="btn btn-primary">Tandai Settlement Selesai</button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

// Base URL dari variabel lingkungan Vite. Sesuaikan .env: VITE_API_BASE_URL=http://localhost:3000/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers };
};

const STATUS_LIST = ['Draft', 'Waiting GA', 'Waiting Finance', 'Waiting Manager', 'Ready', 'In Transit', 'Completed', 'Cancelled'];

const activeTab = ref('master-mobil');
const loading = ref(false);
const loadingMobil = ref(false);
const filterStatus = ref('');

// State Master Mobil
const listMobil = ref([]);
const formMobil = reactive({ kode_mobil: '', nama_mobil: '', jenis: '', plat_nomor: '', status: 'Tersedia' });

// State Master Tujuan
const listTujuan = ref([]);
const tujuanBaru = ref('');

// State Daftar Booking
const listBooking = ref([]);

// State Form Booking
const formBooking = reactive({
  user_id: '',
  jenis_perjalanan: 'Sekali Jalan',
  dari_lokasi: '',
  tujuan_id: '',
  lokasi_tujuan_custom: '',
  tgl_berangkat: '',
  jam_berangkat: '',
  tgl_kembali: '',
  jam_kembali: '',
  jumlah_org: 1,
  daftar_penumpang: '',
  remark: '',
  kategori_biaya: '',
  nominal_kasbon: 0
});

// State GA
const gaForm = reactive({ booking_id: '', ga_approver_id: '', mobil_id: '', driver_id: '', butuh_finance: false });

// State Finance & Manager
const financeForm = reactive({ booking_id: '', finance_approver_id: '' });
const managerForm = reactive({ booking_id: '', manager_approver_id: '' });

// State Security
const securityForm = reactive({ type: 'out', booking_id: '', security_id: '', km_manual: '', km_gps: '' });

// State Driver Activity
const driverWaypoint = reactive({ booking_id: '', urutan: '', nama_lokasi: '', km_saat_mampir_manual: '', alasan_mampir: '' });
const driverFuel = reactive({ booking_id: '', jumlah_liter: '', total_biaya: '', km_saat_isi: '' });

// State Settlement
const settlementForm = reactive({ booking_id: '' });
const settlementResult = ref(null);
const catatanSettlement = ref('');

const statusClass = (status) => {
  const map = {
    'Tersedia': 'ok', 'Approved': 'ok', 'Completed': 'ok', 'Received': 'ok', 'Pas': 'ok',
    'Dibooking': 'warn', 'Waiting GA': 'warn', 'Waiting Finance': 'warn', 'Waiting Manager': 'warn', 'Pending': 'warn',
    'Dalam Perjalanan': 'info', 'In Transit': 'info', 'Ready': 'info', 'Lebih/Return': 'info',
    'Servis': 'danger', 'Cancelled': 'danger', 'Rejected': 'danger', 'Kurang/Nombok': 'danger'
  };
  return map[status] || 'default';
};

const formatRupiah = (val) => new Intl.NumberFormat('id-ID').format(val || 0);

// ----------------------------------------------------
// 0. MASTER MOBIL
// ----------------------------------------------------
const fetchMobil = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/mobil`, getAuthHeaders());
    listMobil.value = res.data.data || [];
  } catch (err) {
    console.error('Gagal mengambil data mobil:', err);
  }
};

const submitMobil = async () => {
  try {
    loadingMobil.value = true;
    await axios.post(`${API_BASE_URL}/carbook/mobil`, formMobil, getAuthHeaders());
    alert('Mobil baru berhasil ditambahkan!');
    Object.assign(formMobil, { kode_mobil: '', nama_mobil: '', jenis: '', plat_nomor: '', status: 'Tersedia' });
    await fetchMobil();
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menambahkan mobil');
  } finally {
    loadingMobil.value = false;
  }
};

// ----------------------------------------------------
// 0b. MASTER TUJUAN
// ----------------------------------------------------
const fetchTujuan = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/tujuan`, getAuthHeaders());
    listTujuan.value = res.data.data || [];
  } catch (err) {
    console.error('Gagal mengambil data tujuan:', err);
  }
};

const submitTujuan = async () => {
  if (!tujuanBaru.value) return;
  try {
    await axios.post(`${API_BASE_URL}/carbook/tujuan`, { nama_lokasi: tujuanBaru.value }, getAuthHeaders());
    tujuanBaru.value = '';
    await fetchTujuan();
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menambahkan tujuan');
  }
};

// ----------------------------------------------------
// 0c. DAFTAR BOOKING
// ----------------------------------------------------
const fetchBookings = async () => {
  try {
    const params = filterStatus.value ? { status: filterStatus.value } : {};
    const res = await axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params });
    listBooking.value = res.data.data || [];
  } catch (err) {
    console.error('Gagal mengambil data booking:', err);
  }
};

// ----------------------------------------------------
// 1. Submit Pengajuan Booking
// ----------------------------------------------------
const submitBooking = async () => {
  try {
    loading.value = true;
    const res = await axios.post(`${API_BASE_URL}/carbook/booking`, formBooking, getAuthHeaders());
    alert(`Booking Berhasil! Kode: ${res.data.data.kode_booking} (ID: ${res.data.data.id})`);
    Object.assign(formBooking, { dari_lokasi: '', tujuan_id: '', lokasi_tujuan_custom: '', remark: '', daftar_penumpang: '' });
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan booking');
  } finally {
    loading.value = false;
  }
};

// ----------------------------------------------------
// 2. GA Approval
// ----------------------------------------------------
const processGA = async (keputusan) => {
  try {
    await axios.patch(
      `${API_BASE_URL}/carbook/booking/${gaForm.booking_id}/ga-approval`,
      {
        ga_approver_id: gaForm.ga_approver_id,
        keputusan,
        mobil_id: gaForm.mobil_id,
        driver_id: gaForm.driver_id,
        butuh_finance: gaForm.butuh_finance
      },
      getAuthHeaders()
    );
    alert(`Status GA berhasil diupdate: ${keputusan}`);
    fetchMobil();
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memproses GA Approval');
  }
};

// ----------------------------------------------------
// 3. Finance & Manager
// ----------------------------------------------------
const processFinance = async (keputusan) => {
  try {
    await axios.patch(
      `${API_BASE_URL}/carbook/booking/${financeForm.booking_id}/finance-approval`,
      { finance_approver_id: financeForm.finance_approver_id, keputusan },
      getAuthHeaders()
    );
    alert(`Approval Finance: ${keputusan}`);
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memproses approval finance');
  }
};

const processManager = async (keputusan) => {
  try {
    await axios.patch(
      `${API_BASE_URL}/carbook/booking/${managerForm.booking_id}/manager-approval`,
      { manager_approver_id: managerForm.manager_approver_id, keputusan },
      getAuthHeaders()
    );
    alert(`Approval Manager: ${keputusan}`);
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memproses approval manager');
  }
};

// ----------------------------------------------------
// 4. Checkpoint Security
// ----------------------------------------------------
const submitSecurity = async () => {
  try {
    const endpoint = securityForm.type === 'out'
      ? `${API_BASE_URL}/carbook/booking/${securityForm.booking_id}/checkpoint-out`
      : `${API_BASE_URL}/carbook/booking/${securityForm.booking_id}/checkpoint-in`;

    const payload = securityForm.type === 'out'
      ? { security_out_id: securityForm.security_id, km_keluar_manual: securityForm.km_manual, km_keluar_gps: securityForm.km_gps }
      : { security_in_id: securityForm.security_id, km_masuk_manual: securityForm.km_manual, km_masuk_gps: securityForm.km_gps };

    await axios.patch(endpoint, payload, getAuthHeaders());
    alert(`Record Security (${securityForm.type.toUpperCase()}) Berhasil Disimpan!`);
    fetchMobil();
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan checkpoint security');
  }
};

// ----------------------------------------------------
// 5. Driver Activity (Waypoint & BBM)
// ----------------------------------------------------
const submitWaypoint = async () => {
  try {
    const { booking_id, ...payload } = driverWaypoint;
    await axios.post(`${API_BASE_URL}/carbook/booking/${booking_id}/stops`, payload, getAuthHeaders());
    alert('Perhentian berhasil dicatat!');
    Object.assign(driverWaypoint, { urutan: '', nama_lokasi: '', km_saat_mampir_manual: '', alasan_mampir: '' });
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal mencatat perhentian');
  }
};

const submitFuel = async () => {
  try {
    const { booking_id, ...payload } = driverFuel;
    await axios.post(`${API_BASE_URL}/carbook/booking/${booking_id}/fuel-logs`, payload, getAuthHeaders());
    alert('Log BBM berhasil dicatat!');
    Object.assign(driverFuel, { jumlah_liter: '', total_biaya: '', km_saat_isi: '' });
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan log BBM');
  }
};

// ----------------------------------------------------
// 6. Settlement
// ----------------------------------------------------
const submitSettlement = async () => {
  try {
    const res = await axios.post(`${API_BASE_URL}/carbook/booking/${settlementForm.booking_id}/settlement/generate`, {}, getAuthHeaders());
    settlementResult.value = res.data.data;
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memproses settlement');
  }
};

const selesaikanSettlement = async () => {
  try {
    await axios.patch(
      `${API_BASE_URL}/carbook/settlement/${settlementResult.value.id}/selesaikan`,
      { catatan: catatanSettlement.value },
      getAuthHeaders()
    );
    alert('Settlement ditandai selesai!');
    settlementResult.value.status_penyelesaian = 'Completed';
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyelesaikan settlement');
  }
};

onMounted(() => {
  fetchMobil();
  fetchTujuan();
});
</script>

<style scoped>
.car-booking-container {
  max-width: 1100px;
  margin: 20px auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}
.header { text-align: center; margin-bottom: 20px; }
.subtitle { color: #666; font-size: 0.9rem; }
.nav-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
.nav-tabs button {
  padding: 8px 16px; border: none; background: #f0f2f5; cursor: pointer; border-radius: 6px; font-weight: 600;
}
.nav-tabs button.active { background: #0056b3; color: white; }
.card { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.info-text { color: #666; font-size: 0.85rem; margin-top: -8px; margin-bottom: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.form-group label { font-size: 0.85rem; font-weight: bold; color: #444; }
input, select, textarea { padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; }
.row-inputs { display: flex; gap: 8px; }
.button-group { display: flex; gap: 10px; margin-top: 10px; }
.btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }
.btn-primary { background: #0056b3; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-danger { background: #dc3545; color: white; }
.sub-section { margin-bottom: 20px; }
.header-with-btn { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.result-box { margin-top: 20px; padding: 16px; background: #eef9f1; border: 1px solid #c3e6cb; border-radius: 6px; }
.file-info { color: #666; font-size: 0.8rem; margin-top: 6px; }

.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.data-table th, .data-table td { padding: 10px; border: 1px solid #e0e0e0; text-align: left; }
.data-table th { background-color: #f8f9fa; font-weight: 600; }
.text-center { text-align: center; }

.badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8rem; font-weight: bold; display: inline-block; }
.badge.ok { background: #28a745; }
.badge.warn { background: #ffc107; color: #333; }
.badge.info { background: #17a2b8; }
.badge.danger { background: #dc3545; }
.badge.default { background: #6c757d; }
</style>