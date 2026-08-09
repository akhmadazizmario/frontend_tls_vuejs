<template>
  <div class="d-flex flex-column min-vh-100 bg-light">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />
    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />
      <main
        class="flex-grow-1 p-3 p-md-5"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
          transition: 'margin-left 0.3s ease',
          marginTop: '56px',
        }"
      >
        <!-- AKSES DITOLAK: bukan dept Driver -->
        <div v-if="!isDriver" class="card shadow-sm border-0">
          <div class="card-body text-center py-5">
            <div class="fs-1 mb-2">🚫</div>
            <h5 class="fw-bold">Akses Ditolak</h5>
            <p class="text-muted mb-0">Halaman ini hanya untuk staff dengan departemen <strong>Driver</strong>.<br />Akun Anda terdaftar di departemen <strong>{{ deptLive || '-' }}</strong>.</p>
          </div>
        </div>

        <template v-else>
        <h3 class="fw-bold mb-1">🚘 Perjalanan Saya</h3>
        <p class="text-muted mb-4">Login sebagai <strong>{{ user.name }}</strong> — Pilih perjalanan yang sedang jalan atau lihat riwayat perjalanan Anda.</p>

        <!-- SLIDE MENU: Perjalanan Aktif vs Riwayat Perjalanan -->
        <ul class="nav nav-pills mb-4 gap-2">
          <li class="nav-item">
            <button
              class="nav-link"
              :class="activeTab === 'aktif' ? 'active' : 'text-dark bg-white border'"
              @click="activeTab = 'aktif'"
            >
              🚗 Perjalanan Aktif
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="activeTab === 'riwayat' ? 'active' : 'text-dark bg-white border'"
              @click="switchToRiwayat"
            >
              📜 Riwayat Perjalanan Saya
            </button>
          </li>
        </ul>

        <!-- ==================== TAB: RIWAYAT PERJALANAN ==================== -->
        <div v-if="activeTab === 'riwayat'">

          <!-- Detail salah satu riwayat -->
          <div v-if="historyDetail">
            <button class="btn btn-outline-secondary mb-3" @click="historyDetail = null">⬅ Kembali ke daftar riwayat</button>

            <div class="alert alert-secondary fw-semibold fs-6 mb-3">
              📜 Riwayat: {{ historyDetail.mobil?.nama_mobil }} ({{ historyDetail.mobil?.plat_nomor }}) — {{ historyDetail.kode_booking }}
            </div>

            <div class="card shadow-sm border-0 mb-4">
              <div class="card-header bg-white fw-bold">📋 Detail Perjalanan</div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-4"><small class="text-muted d-block">Pemohon</small><strong>{{ historyDetail.pemohon?.name || '-' }}</strong></div>
                  <div class="col-md-4"><small class="text-muted d-block">Jenis Perjalanan</small><strong>{{ historyDetail.jenis_perjalanan || '-' }}</strong></div>
                  <div class="col-md-4"><small class="text-muted d-block">Jumlah Penumpang</small><strong>{{ historyDetail.jumlah_org || '-' }}</strong></div>
                  <div class="col-md-4"><small class="text-muted d-block">Dari Lokasi</small><strong>{{ historyDetail.dari_lokasi || '-' }}</strong></div>
                  <div class="col-md-4"><small class="text-muted d-block">Tujuan</small><strong>{{ historyDetail.master_tujuan?.nama_lokasi || historyDetail.lokasi_tujuan_custom || '-' }}</strong></div>
                  <div class="col-md-4"><small class="text-muted d-block">Daftar Penumpang</small><strong>{{ historyDetail.daftar_penumpang || '-' }}</strong></div>
                  <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Berangkat</small><strong>{{ historyDetail.tgl_berangkat }} {{ historyDetail.jam_berangkat }}</strong></div>
                  <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Selesai</small><strong>{{ historyDetail.tgl_kembali || '-' }} {{ historyDetail.jam_kembali || '' }}</strong></div>
                  <div class="col-md-4"><small class="text-muted d-block">KM Keluar / KM Masuk</small><strong>{{ historyDetail.km_keluar_manual ?? '-' }} / {{ historyDetail.km_masuk_manual ?? '-' }}</strong></div>
                </div>

                <hr class="my-3" />

                <div class="row g-3 bg-light p-3 rounded-3 border">
                  <div class="col-md-3">
                    <small class="text-muted d-block">Kasbon Diterima</small>
                    <strong class="fs-5 text-primary">Rp {{ formatRupiah(historyDetail.nominal_kasbon) }}</strong>
                  </div>
                  <div class="col-md-3">
                    <small class="text-muted d-block">Total Pengeluaran (BBM + Lainnya)</small>
                    <strong class="fs-5 text-danger">Rp {{ formatRupiah(historyDetailPengeluaran) }}</strong>
                  </div>
                  <div class="col-md-3">
                    <small class="text-muted d-block">Sisa Kasbon / (Kurang)</small>
                    <strong class="fs-5" :class="(Number(historyDetail.nominal_kasbon||0) - historyDetailPengeluaran) >= 0 ? 'text-success' : 'text-danger'">
                      Rp {{ formatRupiah(Number(historyDetail.nominal_kasbon||0) - historyDetailPengeluaran) }}
                    </strong>
                  </div>
                  <div class="col-md-3">
                    <small class="text-muted d-block">Status Kasbon Driver</small>
                    <div class="btn-group mt-1" role="group">
                      <button
                        type="button"
                        class="btn btn-sm"
                        :class="historyDetail.driver_payout_status === 'Received' ? 'btn-success' : 'btn-outline-success'"
                        :disabled="loadingPayout"
                        @click="togglePayoutStatus(historyDetail, 'Received')"
                      >✅ Terima</button>
                      <button
                        type="button"
                        class="btn btn-sm"
                        :class="historyDetail.driver_payout_status !== 'Received' ? 'btn-danger' : 'btn-outline-danger'"
                        :disabled="loadingPayout"
                        @click="togglePayoutStatus(historyDetail, 'Pending')"
                      >❌ Belum Terima</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card shadow-sm border-0">
              <div class="card-body">
                <h5 class="fw-bold mb-3">📋 Rincian Perhentian &amp; BBM</h5>
                <div class="table-responsive">
                  <table class="table table-bordered table-striped">
                    <thead class="table-light">
                      <tr>
                        <th>Jenis</th>
                        <th>Lokasi / Keterangan</th>
                        <th>Alasan / Detil</th>
                        <th>Biaya (Rp)</th>
                        <th>KM</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="(historyDetail.stops || []).length === 0 && (historyDetail.fuel_logs || []).length === 0">
                        <td colspan="5" class="text-center text-muted">Tidak ada catatan.</td>
                      </tr>
                      <tr v-for="s in (historyDetail.stops || [])" :key="'hs'+s.id">
                        <td><span class="badge bg-secondary">Mampir</span></td>
                        <td>{{ s.nama_lokasi }}</td>
                        <td>{{ s.alasan_mampir || '-' }}</td>
                        <td class="text-end fw-bold">Rp {{ formatRupiah(s.pengeluaran) }}</td>
                        <td>{{ s.km_saat_mampir_manual }}</td>
                      </tr>
                      <tr v-for="f in (historyDetail.fuel_logs || [])" :key="'hf'+f.id">
                        <td><span class="badge bg-warning text-dark">BBM</span></td>
                        <td>Pengisian BBM ({{ f.jumlah_liter }} L)</td>
                        <td>Isi BBM</td>
                        <td class="text-end fw-bold">Rp {{ formatRupiah(f.total_biaya) }}</td>
                        <td>{{ f.km_saat_isi }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Daftar riwayat perjalanan -->
          <div v-else class="card shadow-sm border-0">
            <div class="card-body">
              <div v-if="loadingHistory" class="text-center text-muted py-4">Memuat riwayat...</div>
              <div v-else-if="historyTrips.length === 0" class="text-center text-muted py-4">
                Belum ada riwayat perjalanan yang sudah selesai.
              </div>
              <div class="row g-3" v-else>
                <div class="col-md-6" v-for="b in historyTrips" :key="'h'+b.id">
                  <div class="border rounded-3 p-3 bg-white h-100" style="cursor:pointer" @click="selectHistoryTrip(b)">
                    <div class="d-flex justify-content-between align-items-start">
                      <div class="fw-bold fs-5">{{ b.mobil?.nama_mobil }} - {{ b.mobil?.plat_nomor }}</div>
                      <span class="badge bg-success">Selesai</span>
                    </div>
                    <div class="text-muted">{{ b.kode_booking }}</div>
                    <div>Tujuan: <strong>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</strong></div>
                    <div>Pemohon: <strong>{{ b.pemohon?.name || '-' }}</strong></div>
                    <div>Tgl Berangkat: <strong>{{ b.tgl_berangkat }} {{ b.jam_berangkat }}</strong></div>
                    <div>Kasbon: <strong>Rp {{ formatRupiah(b.nominal_kasbon) }}</strong></div>
                    <button class="btn btn-outline-primary btn-sm w-100 mt-2">Lihat Detail &amp; Kasbon ➜</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TAB: PERJALANAN AKTIF (existing) ==================== -->
        <div v-show="activeTab === 'aktif'">

        <!-- PERJALANAN DITUGASKAN TAPI BELUM DI-CHECKOUT SECURITY -->
        <div v-if="!activeBooking && myUpcoming.length > 0" class="alert alert-info d-flex align-items-start gap-2 mb-3">
          <span class="fs-5">ℹ️</span>
          <div>
            <strong>Ada {{ myUpcoming.length }} perjalanan yang ditugaskan ke Anda, tapi belum bisa mulai.</strong>
            <p class="mb-2 small">Mobil masih menunggu dicatat "Keluar" oleh Security di pos. Setelah itu baru muncul di daftar "sedang jalan" di bawah.</p>
            <ul class="mb-0 small">
              <li v-for="b in myUpcoming" :key="b.id">{{ b.kode_booking }} — {{ b.mobil?.nama_mobil || 'Mobil belum di-assign' }} — status: <strong>{{ b.status_booking }}</strong></li>
            </ul>
          </div>
        </div>

        <div v-if="!activeBooking" class="card shadow-sm border-0">
          <div class="card-body">
            <div v-if="myTrips.length === 0" class="text-center text-muted py-4">
              Tidak ada perjalanan yang sedang berlangsung untuk Anda saat ini.
            </div>
            <div class="row g-3">
              <div class="col-md-6" v-for="b in myTrips" :key="b.id">
                <div class="border rounded-3 p-3 bg-white h-100" style="cursor:pointer" @click="selectTrip(b)">
                  <div class="fw-bold fs-5">{{ b.mobil?.nama_mobil }} - {{ b.mobil?.plat_nomor }}</div>
                  <div class="text-muted">{{ b.kode_booking }}</div>
                  <div>Tujuan: <strong>{{ b.master_tujuan?.nama_lokasi || b.lokasi_tujuan_custom || '-' }}</strong></div>
                  <div>Pemohon: <strong>{{ b.pemohon?.name || '-' }}</strong></div>
                  <div>Tgl Berangkat: <strong>{{ b.tgl_berangkat }} {{ b.jam_berangkat }}</strong></div>
                  <button class="btn btn-primary btn-lg w-100 mt-2" :disabled="loadingDetail">{{ loadingDetail ? 'Memuat...' : 'Pilih Perjalanan Ini ➜' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <button class="btn btn-outline-secondary mb-3" @click="activeBooking = null">⬅ Kembali ke daftar perjalanan</button>

          <div class="alert alert-primary fw-semibold fs-6 mb-3">
            🚗 Perjalanan aktif: {{ activeBooking.mobil?.nama_mobil }} ({{ activeBooking.mobil?.plat_nomor }}) — {{ activeBooking.kode_booking }}
          </div>

          <!-- DETAIL PERJALANAN & RINGKASAN KASBON -->
          <div class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white fw-bold">📋 Detail Perjalanan</div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-4"><small class="text-muted d-block">Pemohon</small><strong>{{ activeBooking.pemohon?.name || '-' }}</strong></div>
                <div class="col-md-4"><small class="text-muted d-block">Jenis Perjalanan</small><strong>{{ activeBooking.jenis_perjalanan || '-' }}</strong></div>
                <div class="col-md-4"><small class="text-muted d-block">Jumlah Penumpang</small><strong>{{ activeBooking.jumlah_org || '-' }}</strong></div>
                <div class="col-md-4"><small class="text-muted d-block">Dari Lokasi</small><strong>{{ activeBooking.dari_lokasi || '-' }}</strong></div>
                <div class="col-md-4"><small class="text-muted d-block">Tujuan</small><strong>{{ activeBooking.master_tujuan?.nama_lokasi || activeBooking.lokasi_tujuan_custom || '-' }}</strong></div>
                <div class="col-md-4"><small class="text-muted d-block">Daftar Penumpang</small><strong>{{ activeBooking.daftar_penumpang || '-' }}</strong></div>
                <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Berangkat</small><strong>{{ activeBooking.tgl_berangkat }} {{ activeBooking.jam_berangkat }}</strong></div>
                <div class="col-md-4"><small class="text-muted d-block">Tgl &amp; Jam Kembali (Rencana)</small><strong>{{ activeBooking.tgl_kembali || '-' }} {{ activeBooking.jam_kembali || '' }}</strong></div>
                <div class="col-md-4"><small class="text-muted d-block">KM Keluar (dicatat Security)</small><strong>{{ activeBooking.km_keluar_manual ?? '-' }}</strong></div>
                <div class="col-12"><small class="text-muted d-block">Lokasi Tujuan (Google Maps)</small>
                  <template v-if="activeBooking.maps"><a :href="activeBooking.maps" target="_blank" rel="noopener noreferrer" class="text-decoration-none" > 📍 Buka di Google Maps </a>
                  </template>
                  <template v-else> - </template> 
                </div>
              </div>
              
              <hr class="my-3" />
              
              <!-- SECTION RECORD KASBON & KALKULASI OTOMATIS -->
              <div class="row g-3 bg-light p-3 rounded-3 border">
                <div class="col-md-3">
                  <small class="text-muted d-block">Kasbon Diterima</small>
                  <strong class="fs-5 text-primary">Rp {{ formatRupiah(kasbonDiterima) }}</strong>
                </div>
                <div class="col-md-3">
                  <small class="text-muted d-block">Total Pengeluaran (BBM + Lainnya)</small>
                  <strong class="fs-5 text-danger">Rp {{ formatRupiah(totalPengeluaran) }}</strong>
                </div>
                <div class="col-md-3">
                  <small class="text-muted d-block">Sisa Kasbon / (Kurang)</small>
                  <strong class="fs-5" :class="sisaKasbon >= 0 ? 'text-success' : 'text-danger'">
                    Rp {{ formatRupiah(sisaKasbon) }}
                  </strong>
                </div>
                <div class="col-md-3">
                  <small class="text-muted d-block">Status Kasbon Driver</small>
                  <div class="btn-group mt-1" role="group">
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="activeBooking.driver_payout_status === 'Received' ? 'btn-success' : 'btn-outline-success'"
                      :disabled="loadingPayout"
                      @click="togglePayoutStatus(activeBooking, 'Received')"
                    >✅ Terima</button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="activeBooking.driver_payout_status !== 'Received' ? 'btn-danger' : 'btn-outline-danger'"
                      :disabled="loadingPayout"
                      @click="togglePayoutStatus(activeBooking, 'Pending')"
                    >❌ Belum Terima</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-4">
            <!-- CATAT PERHENTIAN -->
            <div class="col-md-6">
              <div class="card shadow-sm border-0 h-100">
                <div class="card-header bg-secondary text-white fw-bold fs-5">🛑 Catat Perhentian / Mampir</div>
                <div class="card-body">
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Mampir Ke Mana?</label>
                    <input type="text" class="form-control form-control-lg" v-model="waypoint.nama_lokasi" placeholder="Contoh: Rest Area KM 57 / E-Toll" />
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Kenapa Mampir?</label>
                    <select class="form-select form-select-lg" v-model="waypoint.alasan_mampir_select">
                      <option value="">-- pilih alasan --</option>
                      <option value="Istirahat">Istirahat</option>
                      <option value="Makan">Makan</option>
                      <option value="Isi Angin/Cek Ban">Isi Angin / Cek Ban</option>
                      <option value="Bayar Tol">Bayar Tol</option>
                      <option value="Parkir">Parkir</option>
                      <option value="Belanja">Belanja</option>
                      <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                    </select>
                  </div>
                  
                  <!-- INPUT KHUSUS APABILA MEMILIH LAINNYA -->
                  <div class="mb-3" v-if="waypoint.alasan_mampir_select === 'Lainnya'">
                    <label class="form-label fw-semibold text-primary">Tuliskan Alasan Mampir</label>
                    <input type="text" class="form-control form-control-lg" v-model="waypoint.alasan_custom" placeholder="Ketik alasan mampir..." />
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Biaya Pengeluaran Tambahan (Rp)</label>
                    <input type="number" class="form-control form-control-lg" v-model="waypoint.pengeluaran" placeholder="Contoh: 15000 (Parkir/Tol/Makan/Lainnya)" />
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">KM di Speedometer</label>
                    <input type="number" class="form-control form-control-lg" v-model="waypoint.km_saat_mampir_manual" placeholder="Contoh: 45230" />
                  </div>
                  <button class="btn btn-secondary btn-lg w-100" @click="submitWaypoint">💾 Simpan Perhentian</button>
                </div>
              </div>
            </div>

            <!-- CATAT BBM -->
            <div class="col-md-6">
              <div class="card shadow-sm border-0 h-100">
                <div class="card-header bg-warning fw-bold fs-5">⛽ Catat Isi BBM</div>
                <div class="card-body">
                  <div class="mb-3">
  <label class="form-label fw-semibold">Jenis BBM</label>
  <select
    class="form-select form-select-lg"
    v-model="fuel.kategori"
  >
    <option value="">-- Pilih Jenis BBM --</option>
    <option value="Premium">Premium</option>
    <option value="Pertalite">Pertalite</option>
    <option value="Pertamax">Pertamax</option>
    <option value="Pertamax Turbo">Pertamax Turbo</option>
    <option value="Solar">Solar</option>
    <option value="Dexlite">Dexlite</option>
    <option value="Pertamina Dex">Pertamina Dex</option>
  </select>
</div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Jumlah Liter</label>
                    <input type="number" step="0.01" class="form-control form-control-lg" v-model="fuel.jumlah_liter" placeholder="Contoh: 25.5" />
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Total Bayar (Rp)</label>
                    <input type="number" class="form-control form-control-lg" v-model="fuel.total_biaya" placeholder="Contoh: 250000" />
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">KM Saat Isi BBM</label>
                    <input type="number" class="form-control form-control-lg" v-model="fuel.km_saat_isi" placeholder="Contoh: 45230" />
                  </div>
                  <button class="btn btn-warning btn-lg w-100" @click="submitFuel">💾 Simpan Nota BBM</button>
                </div>
              </div>
            </div>
          </div>

          <!-- RIWAYAT -->
          <div class="card shadow-sm border-0 mt-4">
            <div class="card-body">
              <h5 class="fw-bold mb-3">📋 Riwayat Perhentian &amp; BBM Perjalanan Ini</h5>
              <div class="table-responsive">
                <table class="table table-bordered table-striped">
                  <thead class="table-light">
                    <tr>
                      <th>Jenis</th>
                      <th>Pemohon</th>
                      <th>Lokasi / Keterangan</th>
                      <th>Alasan / Detil</th>
                      <th>Biaya (Rp)</th>
                      <th>KM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="stops.length === 0 && fuelLogs.length === 0">
                      <td colspan="6" class="text-center text-muted">Belum ada catatan.</td>
                    </tr>
                    <tr v-for="s in stops" :key="'s'+s.id">
                      <td><span class="badge bg-secondary">Mampir</span></td>
                      <td><strong>{{ activeBooking.pemohon?.name || '-' }}</strong></td>
                      <td>{{ s.nama_lokasi }}</td>
                      <td>{{ s.alasan_mampir || '-' }}</td>
                      <td class="text-end fw-bold">Rp {{ formatRupiah(s.pengeluaran) }}</td>
                      <td>{{ s.km_saat_mampir_manual }}</td>
                    </tr>
                    <tr v-for="f in fuelLogs" :key="'f'+f.id">
                      <td><span class="badge bg-warning text-dark">BBM</span></td>
                      <td><strong>{{ activeBooking.pemohon?.name || '-' }}</strong></td>
                      <td>Pengisian BBM ({{ f.jumlah_liter }} L)</td>
                      <td>Isi BBM</td>
                      <td class="text-end fw-bold">Rp {{ formatRupiah(f.total_biaya) }}</td>
                      <td>{{ f.km_saat_isi }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="table-light fw-bold" v-if="stops.length > 0 || fuelLogs.length > 0">
                    <tr>
                      <td colspan="4" class="text-end">Total Pengeluaran:</td>
                      <td class="text-end text-danger">Rp {{ formatRupiah(totalPengeluaran) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
        </div>
        </template>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import Header from '../../components/Header.vue'
import Sidebar from '../../components/Sidebar.vue'
import Footer from '../../components/Footer.vue'
import { useAuthUser } from '../car_book/Useauthuser.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const { user } = useAuthUser()

const sidebarOpen = ref(true)
const windowWidth = ref(window.innerWidth)
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return { headers }
}

const formatRupiah = (val) => new Intl.NumberFormat('id-ID').format(val || 0)

const deptLive = ref(user.value?.dept || '')
const isDriver = computed(() => isDeptMatch(deptLive.value, 'driver'))

function levenshtein(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase()
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}
function isDeptMatch(deptRaw, target) {
  const d = (deptRaw || '').toString().trim().toLowerCase()
  if (!d) return false
  if (d === target) return true
  return levenshtein(d, target) <= 1
}

const fetchLiveProfile = async () => {
  const userId = user.value?.id
  if (!userId) return
  try {
    const res = await axios.get(`${API_BASE_URL}/profile/${userId}`)
    if (res.data?.dept) deptLive.value = res.data.dept
  } catch (err) {
    console.error('Gagal ambil profil live, pakai data cache:', err)
  }
}

const myTrips = ref([])
const myUpcoming = ref([])
const activeBooking = ref(null)
const loadingDetail = ref(false)
const stops = ref([])
const fuelLogs = ref([])

// State untuk tab "Riwayat Perjalanan Saya"
const activeTab = ref('aktif') // 'aktif' | 'riwayat'
const historyTrips = ref([])
const historyDetail = ref(null)
const loadingHistory = ref(false)
const loadingPayout = ref(false)

// Form waypoint dengan dukungan custom alasan dan nominal pengeluaran
const waypoint = reactive({
  urutan: 1,
  nama_lokasi: '',
  alasan_mampir_select: '',
  alasan_custom: '',
  pengeluaran: 0,
  km_saat_mampir_manual: ''
})

const fuel = reactive({ kategori: '', jumlah_liter: '', total_biaya: '', km_saat_isi: '' })

// Hitung-hitungan Kasbon & Pengeluaran
const kasbonDiterima = computed(() => Number(activeBooking.value?.nominal_kasbon || 0))

const totalPengeluaranStops = computed(() => {
  return stops.value.reduce((acc, curr) => acc + Number(curr.pengeluaran || 0), 0)
})

const totalPengeluaranFuel = computed(() => {
  return fuelLogs.value.reduce((acc, curr) => acc + Number(curr.total_biaya || 0), 0)
})

const totalPengeluaran = computed(() => totalPengeluaranStops.value + totalPengeluaranFuel.value)

const sisaKasbon = computed(() => kasbonDiterima.value - totalPengeluaran.value)

const fetchMyTrips = async () => {
  if (!isDriver.value) return
  try {
    const [resTransit, resReady, resWaitingMgr] = await Promise.all([
      axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params: { status: 'In Transit', driver_id: user.value.id } }),
      axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params: { status: 'Ready', driver_id: user.value.id } }),
      axios.get(`${API_BASE_URL}/carbook/booking`, { ...getAuthHeaders(), params: { status: 'Waiting Manager', driver_id: user.value.id } })
    ])
    myTrips.value = resTransit.data.data || []
    myUpcoming.value = [...(resReady.data.data || []), ...(resWaitingMgr.data.data || [])]
  } catch (err) {
    console.error(err)
  }
}

const fetchHistory = async () => {
  if (!activeBooking.value) return
  try {
    const [resStops, resFuel] = await Promise.all([
      axios.get(`${API_BASE_URL}/carbook/booking/${activeBooking.value.id}/stops`, getAuthHeaders()),
      axios.get(`${API_BASE_URL}/carbook/booking/${activeBooking.value.id}/fuel-logs`, getAuthHeaders())
    ])
    stops.value = resStops.data.data || []
    fuelLogs.value = resFuel.data.data || []
  } catch (err) {
    console.error(err)
  }
}

watch(activeBooking, () => {
  waypoint.urutan = stops.value.length + 1
  fetchHistory()
})

// Total pengeluaran (stops + BBM) untuk riwayat yang sedang dibuka detailnya
const historyDetailPengeluaran = computed(() => {
  if (!historyDetail.value) return 0
  const totalStops = (historyDetail.value.stops || []).reduce((acc, s) => acc + Number(s.pengeluaran || 0), 0)
  const totalFuel = (historyDetail.value.fuel_logs || []).reduce((acc, f) => acc + Number(f.total_biaya || 0), 0)
  return totalStops + totalFuel
})

// Ambil daftar perjalanan yang sudah Completed milik driver ini (riwayat)
const fetchHistoryTrips = async () => {
  if (!isDriver.value || !user.value?.id) return
  loadingHistory.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/booking`, {
      ...getAuthHeaders(),
      params: { status: 'Completed', driver_id: user.value.id }
    })
    // Urutkan terbaru dulu berdasarkan tanggal berangkat
    historyTrips.value = (res.data.data || []).sort((a, b) => {
      const da = new Date(`${a.tgl_berangkat} ${a.jam_berangkat || '00:00'}`)
      const db = new Date(`${b.tgl_berangkat} ${b.jam_berangkat || '00:00'}`)
      return db - da
    })
  } catch (err) {
    console.error('Gagal ambil riwayat perjalanan:', err)
  } finally {
    loadingHistory.value = false
  }
}

const switchToRiwayat = () => {
  activeTab.value = 'riwayat'
  historyDetail.value = null
  fetchHistoryTrips()
}

// Buka detail salah satu riwayat (ambil data lengkap termasuk stops & fuel_logs)
const selectHistoryTrip = async (b) => {
  loadingHistory.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/booking/${b.id}`, getAuthHeaders())
    historyDetail.value = res.data.data || b
  } catch (err) {
    console.error(err)
    historyDetail.value = b
  } finally {
    loadingHistory.value = false
  }
}

// Driver menandai sendiri apakah kasbon sudah diterima atau belum
// Dipakai baik di tab "Perjalanan Aktif" (In Transit) maupun "Riwayat" (Completed)
const togglePayoutStatus = async (booking, newStatus) => {
  if (!booking || booking.driver_payout_status === newStatus) return
  loadingPayout.value = true
  try {
    const res = await axios.patch(
      `${API_BASE_URL}/carbook/booking/${booking.id}/driver-payout`,
      { driver_payout_status: newStatus },
      getAuthHeaders()
    )
    const updatedStatus = res.data?.data?.driver_payout_status || newStatus

    // Update objek yang sedang ditampilkan (reaktif langsung di UI)
    booking.driver_payout_status = updatedStatus

    // Sinkronkan juga ke item di daftar riwayat kalau ada
    const idxHist = historyTrips.value.findIndex((b) => b.id === booking.id)
    if (idxHist !== -1) historyTrips.value[idxHist].driver_payout_status = updatedStatus

    // Sinkronkan juga ke item di daftar perjalanan aktif kalau ada
    const idxTrip = myTrips.value.findIndex((b) => b.id === booking.id)
    if (idxTrip !== -1) myTrips.value[idxTrip].driver_payout_status = updatedStatus
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal mengubah status kasbon')
  } finally {
    loadingPayout.value = false
  }
}

const selectTrip = async (b) => {
  loadingDetail.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/carbook/booking/${b.id}`, getAuthHeaders())
    activeBooking.value = res.data.data || b
  } catch (err) {
    console.error(err)
    activeBooking.value = b
  } finally {
    loadingDetail.value = false
  }
}

const submitWaypoint = async () => {
  if (!waypoint.nama_lokasi || !waypoint.km_saat_mampir_manual) {
    alert('Isi lokasi dan KM dulu ya')
    return
  }

  // Tentukan alasan mampir: pilihan select atau custom input jika pilih "Lainnya"
  let finalAlasan = waypoint.alasan_mampir_select
  if (waypoint.alasan_mampir_select === 'Lainnya') {
    finalAlasan = waypoint.alasan_custom || 'Lainnya'
  }

  try {
    const payload = {
      urutan: stops.value.length + 1,
      nama_lokasi: waypoint.nama_lokasi,
      alasan_mampir: finalAlasan,
      pengeluaran: Number(waypoint.pengeluaran || 0),
      km_saat_mampir_manual: waypoint.km_saat_mampir_manual
    }

    await axios.post(`${API_BASE_URL}/carbook/booking/${activeBooking.value.id}/stops`, payload, getAuthHeaders())
    alert('Perhentian & pengeluaran berhasil dicatat!')
    
    // Reset form
    Object.assign(waypoint, {
      nama_lokasi: '',
      alasan_mampir_select: '',
      alasan_custom: '',
      pengeluaran: 0,
      km_saat_mampir_manual: ''
    })
    
    fetchHistory()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal mencatat perhentian')
  }
}

const submitFuel = async () => {
  if (!fuel.jumlah_liter || !fuel.total_biaya) {
    alert('Isi jumlah liter dan total bayar dulu ya')
    return
  }
  try {
    await axios.post(`${API_BASE_URL}/carbook/booking/${activeBooking.value.id}/fuel-logs`, fuel, getAuthHeaders())
    alert('Nota BBM berhasil disimpan!')
    Object.assign(fuel, { kategori: '', jumlah_liter: '', total_biaya: '', km_saat_isi: '' })
    fetchHistory()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan nota BBM')
  }
}

onMounted(async () => {
  await fetchLiveProfile()
  fetchMyTrips()
})
</script>