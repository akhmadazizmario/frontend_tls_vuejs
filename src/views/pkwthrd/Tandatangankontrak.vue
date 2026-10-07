<template>
  <div class="contract-app">
    <div class="app-shell">

      <!-- SECTION PENCARIAN -->
      <div class="search-screen" v-if="!isContractVisible">
        <!-- <div class="seal-mark seal-mark--lg" aria-hidden="true">
          <span class="seal-mark__initials">TLSI</span>
        </div> -->
        <div>
           <img
                    src="/images/logo.png"
                    class="img-fluid rounded-4 mb-3 system-img" style="width:50%;height: 70px;"
                  />
        </div>
        <h1 class="search-title">Portal Perjanjian Kerja</h1>
        <p class="search-sub">PT. Tri Lestari Sandang Industri</p>

        <div class="search-card">
          <label for="xNO" class="field-label">Nomor Karyawan (NO KP)</label>
          <div class="search-row mb-3">
            <input
              type="text"
              id="xNO"
              v-model="searchQuery"
              placeholder="Ketik NO KP di sini…"
              @keyup.enter="searchEmployee"
              autocomplete="off"
            >
          </div>

          <label for="xIDNo" class="field-label mt-3">Nomor KTP (NIK)</label>
          <div class="search-row">
            <input
              type="text"
              id="xIDNo"
              v-model="searchIDNo"
              placeholder="Ketik NIK KTP di sini…"
              @keyup.enter="searchEmployee"
              autocomplete="off"
            >
            <button class="btn-primary" @click="searchEmployee" :disabled="isLoading">
              <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
              {{ isLoading ? 'Mencari' : 'Cari' }}
            </button>
          </div>
          <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- SECTION KONTRAK -->
      <div class="contract-screen" v-if="isContractVisible">

        <div class="toolbar">
          <button class="back-link" @click="resetSearch">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Kembali
          </button>

          <ol class="step-track">
            <li :class="['step', { 'is-active': currentStep === 1, 'is-done': currentStep > 1 }]">
              <span class="step__dot">1</span><span class="step__label">Tinjau</span>
            </li>
            <li :class="['step', { 'is-active': currentStep === 2, 'is-done': currentStep > 2 }]">
              <span class="step__dot">2</span><span class="step__label">Setujui</span>
            </li>
            <li :class="['step', { 'is-active': currentStep === 3, 'is-done': currentStep > 3 }]">
              <span class="step__dot">3</span><span class="step__label">Tanda Tangan</span>
            </li>
            <li :class="['step', { 'is-active': currentStep === 4 }]">
              <span class="step__dot">4</span><span class="step__label">Selesai</span>
            </li>
          </ol>
        </div>

        <!-- TEMPLATE KONTRAK (DISESUAIKAN DENGAN xKIND) -->
        <div class="paper-frame">
          <div class="document-preview" ref="documentBody">

            <!-- HEADER PT -->
            <div class="pt-header">
              <div class="seal-mark seal-mark--sm" aria-hidden="true">
                <span class="seal-mark__initials">TLSI</span>
              </div>
              <div class="pt-header__text">
                <h3>PT. Tri Lestari Sandang Industri</h3>
                <p>Jl. Balamoa RT 03/RW 02 No. 45, Desa Karangjati, Kecamatan Tarub, Kabupaten Tegal – Jawa Tengah</p>
              </div>
            </div>

            <!-- JUDUL & NOMOR SURAT -->
            <div class="doc-title">
              <h2 class="title-text">{{ getDocumentTitle }}</h2>
              <p class="doc-number">Nomor : {{ employeeData.nomorSurat || '..../HRD-TLSI/..../20..' }}</p>
            </div>

            <div class="doc-content">

              <!-- ===================== PKWT KONTRAK BULANAN ===================== -->
              <template v-if="jenisKey === 'kontrakBulanan'">
                <p>Perjanjian Kerja Waktu Tertentu (PKWT) ini dibuat dan ditanda tangani pada hari <strong>{{ tandaTanganDayName }}</strong> tanggal <strong>{{ tandaTanganDateOnly }}</strong> bulan <strong>{{ tandaTanganMonthName }}</strong> tahun <strong>{{ tandaTanganYear }}</strong> oleh dan antara :</p>

                <table class="party-table">
                  <tr><td width="3%">-</td><td width="20%">Nama</td><td width="2%">:</td><td><strong>Istiqomah, S.Pd</strong></td></tr>
                  <tr><td></td><td>Jabatan</td><td>:</td><td>Asst. Manager HRD</td></tr>
                </table>
                <p class="justify-text">Bertindak untuk dan atas nama PT. TRI LESTARI SANDANG INDUSTRI yang berkedudukan di Jalan Balamoa No. 45 Rt. 03 / Rw. 02, Kec. Tarub Kab. Tegal Propinsi Jawa Tengah dan selanjutnya disebut sebagai <strong>Pihak I (Pemberi Kerja).</strong></p>

                <table class="party-table">
                  <tr><td width="3%">-</td><td width="20%">Nama</td><td width="2%">:</td><td><strong>{{ employeeData.namaPekerja }}</strong> ( {{ employeeData.sexPekerja }} )</td></tr>
                  <tr><td></td><td>Tempat / Tgl Lahir</td><td>:</td><td>{{ employeeData.ttlPekerja }}</td></tr>
                  <tr><td></td><td>Status</td><td>:</td><td>Karyawan Kontrak ( PKWT )</td></tr>
                  <tr><td></td><td>Alamat</td><td>:</td><td>{{ employeeData.alamatPekerja }}</td></tr>
                </table>
                <p class="justify-text">Bertindak untuk dan atas nama diri sendiri dan selanjutnya disebut sebagai <strong>Pihak II (Pekerja).</strong></p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 1</span>Ketentuan Umum</h4>
                <ol class="legal-list">
                  <li>Kedua belah pihak sepakat untuk mengikatkan diri atas kemauan dan kesadaran masing-masing untuk menjalin hubungan kerja yang dinamis dan harmonis.</li>
                  <li>Pihak I memberikan pekerjaan kepada pihak II dengan persyaratan yang telah ditentukan oleh Perusahaan.</li>
                  <li>Pihak II bersedia menerima pekerjaan dari pihak I dan akan dilaksanakan dengan sungguh-sungguh sesuai dengan masa berlakunya Perjanjian Kerja Waktu Tertentu.</li>
                  <li>Kedua belah pihak akan melaksanakan hak dan kewajiban sesuai dengan yang diperjanjikan dengan ketentuan yang terdapat pada pasal-pasal selanjutnya.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 2</span>Jangka Waktu</h4>
                <ol class="legal-list">
                  <li class="justify-text">PKWT ini dibuat untuk jangka waktu terhitung sejak tanggal <strong>{{ employeeData.tanggalMulaiFormatted }}</strong> s/d <strong>{{ employeeData.tanggalAkhirFormatted }}</strong>.</li>
                  <li class="justify-text">Apabila jangka waktu Perjanjian Waktu Tertentu pada pasal 2 ayat 1 berakhir, dan tanpa diikuti dengan surat perjanjian lainnya yang berhubungan dengan kepegawaian setelah melebihi masa tenggang waktu 30 (tiga puluh) hari sejak berakhirnya Perjanjian dengan sendirinya hubungan kerja putus demi hukum.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 3</span>Penempatan Tugas dan Tanggung Jawab</h4>
                <p class="justify-text">(1) Pihak I akan memperkerjakan Pihak II pada:</p>
                <table class="party-table no-margin">
                  <tr><td width="5%">a.</td><td width="15%">Bagian</td><td width="2%">:</td><td><strong>{{ employeeData.bagian }}</strong></td></tr>
                  <tr><td>b.</td><td>Jabatan</td><td>:</td><td><strong>{{ employeeData.jabatan }}</strong></td></tr>
                </table>
                <ol class="legal-list" start="2">
                  <li class="justify-text">Pihak II harus melaksanakan pekerjaan dengan sebaik-baiknya dengan bertanggung jawab sesuai dengan perintah dan petunjuk dari atasan masing-masing bagian.</li>
                  <li class="justify-text">Bila di pandang perlu, pihak I dapat memindahkan pihak II pada tugas-tugas pekerjaan yang sesuai dengan kemampuan pekerja atau diperbantukan ke bagian lain tanpa dianggap perlu.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 4</span>Hari dan Jam Kerja</h4>
                <ol class="legal-list">
                  <li class="justify-text">Pihak II menyetujui bahwa waktu kerja di PT. TLSI adalah satu minggu 6 (enam) hari kerja yaitu Senin – Sabtu dan Minggu Libur.</li>
                  <li class="justify-text">Pihak II menyetujui bahwa karena tugas dan tanggung jawabnya, jam kerjanya disesuaikan dengan kebutuhan saat melaksanakan tugas dan tanggung jawabnya secara profesional sampai tugas selesai.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 5</span>Imbalan Gaji</h4>
                <ol class="legal-list">
                  <li class="justify-text">Pihak I akan memberikan gaji secara tetap setiap tanggal 7 (tujuh) setiap bulannya selama Perjanjian Kerja Waktu Tertentu ini berlaku.</li>
                  <li class="justify-text">Fasilitas lain tidak ada, kecuali selama menjalani PKWT ini Pihak II akan diikutsertakan dalam program Badan Penyelenggara Jaminan Sosial (BPJS) Ketenagakerjaan yang terdiri dari Jaminan Hari Tua (JHT), Jaminan Pensiun (JP), Jaminan Kecelakaan Kerja (JKK) &amp; Jaminan Kematian (JK), dan BPJS Kesehatan berupa pelayanan kesehatan untuk karyawan &amp; keluarga intinya. Untuk program JHT dimana total preminya adalah 5,7%; 3,7% dibayarkan oleh Pihak I dan 2% dibayarkan oleh Pihak II. Untuk program JP total premi 3%; 2% dibayarkan oleh Pihak I dan 1% dibayarkan oleh Pihak II. Sedangkan untuk program BPJS Kesehatan dimana total preminya adalah 5%, 4% dibayarkan oleh Pihak I dan 1% dibayarkan oleh Pihak II.</li>
                  <li class="justify-text">Tidak masuk kerja tanpa alasan yang syah (Mangkir) upah tidak dibayar.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 6</span>Kewajiban Pihak I (Pemberi Kerja)</h4>
                <p class="justify-text">Pihak I bersedia memberikan pekerjaan dan hak-haknya kepada Pihak II sesuai dengan perjanjian yang telah disetujui oleh kedua belah pihak.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 7</span>Kewajiban Pihak II (Pekerja)</h4>
                <ol class="legal-list">
                  <li class="justify-text">Apabila Pihak II tidak masuk kerja tanpa alasan yang sah akan diberikan sanksi sesuai dengan UU Ketenagakerjaan nomor 13 tahun 2003 dan PKB Pasal 55.</li>
                  <li class="justify-text">Pihak II setuju untuk selalu taat dan patuh serta tunduk terhadap tata tertib kerja dan peraturan yang belaku di PT. TRI LESTARI SANDANG INDUSTRI.</li>
                  <li class="justify-text">Pihak II setuju dan menerima sistem pengupahan yang berlaku di PT. TRI LESTARI SANDANG INDUSTRI dengan tanpa adanya tuntutan dikemudian hari.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 8</span>Berakhirnya Perjanjian Kerja Waktu Tertentu</h4>
                <p class="justify-text">(1) Pihak I dan Pihak II menyadari bahwa hubungan kerja menjadi berakhir (putus) apabila :</p>
                <ul class="legal-list">
                  <li>Pihak II meninggal dunia.</li>
                  <li>Habis waktu (perjanjian kontrak).</li>
                  <li>Pihak II mengundurkan diri, dengan persetujuan pihak pertama.</li>
                  <li>Pihak II melakukan kesalahan berat.</li>
                </ul>
                <p class="justify-text">(2) Pemutusan hubungan kerja tersebut pasal 8 ayat 1 butir a s.d d dapat dilaksanakan Pihak I sesuai UU No. 13 tahun 2003.</p>
                <p class="justify-text">(3) Pihak I dapat memutuskan hubungan kerja apabila Pihak II :</p>
                <ul class="legal-list">
                  <li>Pada saat Perjanjian Kerja diadakan, memberikan keterangan Palsu / dipalsukan.</li>
                  <li>Mabuk, Madat memakai obat bius / Narkoba ditempat kerja.</li>
                  <li>Mencuri, Menggelapkan, Menipu / melakukan kejahatan lainnya.</li>
                  <li>Menganiaya, menghina secara kasar, atau mengancam Pengusaha, keluarga Pengusaha atau teman sekerja.</li>
                  <li>Melakukan sesuatu yang bertentangan dengan hukum atau kesusilaan di tempat kerja.</li>
                  <li>Dengan sengaja atau kecerobohannya merusak atau membiarkan dalam keadaan bahaya milik Perusahaan.</li>
                  <li>Dengan sengaja walaupun sudah diperingatkan membiarkan dirinya atau teman dalam keadaan bahaya.</li>
                  <li>Membongkar rahasia Perusahaan yang seharusnya dirahasiaakan.</li>
                  <li>Menolak perintah penugasan yang layak diberikan kepadanya oleh perusahaan.</li>
                  <li>Apabila dikemudian hari pekerja tidak melaksanakan pekerjaannya sesuai dengan ketentuan yang sudah dijanjikan.</li>
                  <li>Melanggar ketentuan yang telah ditetapkan dalam kesepakatan kerja sedangkan dirinya sudah diberikan peringatan.</li>
                </ul>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 9</span>Sanksi – Sanksi</h4>
                <p class="justify-text">Dalam hal Pihak II tidak mentaati kewajiban atau melanggar perjanjian ini, maka Pihak I dapat memberikan sanksi sebagai berikut :</p>
                <ul class="legal-list">
                  <li>Peringatan lisan.</li>
                  <li>Peringatan Tertulis.</li>
                  <li>Pemberhentian sementara ( skorsing ).</li>
                  <li>Pihak kedua membayar ganti rugi.</li>
                </ul>
                <p class="justify-text">Penerapan sanksi tersebut tidak mesti berjenjang tapi bisa dinilai dari bobot kesalahan yang diperbuat.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 10</span>Penutup</h4>
                <ol class="legal-list">
                  <li class="justify-text">Segala hal yang belum diatur dalam PKWT ini akan ditentukan kemudian oleh Para Pihak dengan mengindahkan ketentuan peraturan perundangan yang berlaku.</li>
                  <li class="justify-text">Perjanjian ini dibuat dan ditandatangani oleh Para Pihak dalam keadaan sehat jasmani dan rohani serta tanpa paksaan atau dipengaruhi pihak lain.</li>
                  <li class="justify-text">PKWT ini dibuat rangkap 2 ( dua ) yang mempunyai kekuatan hukum yang sama.</li>
                </ol>
              </template>

              <!-- ===================== PKWT KONTRAK HARIAN ===================== -->
              <template v-else-if="jenisKey === 'kontrakHarian'">
                <p>Perjanjian Kerja Waktu Tertentu (PKWT) ini dibuat dan ditanda tangani pada hari <strong>{{ tandaTanganDayName }}</strong> tanggal <strong>{{ tandaTanganDateOnly }}</strong> bulan <strong>{{ tandaTanganMonthName }}</strong> tahun <strong>{{ tandaTanganYear }}</strong> oleh dan antara :</p>

                <table class="party-table">
                  <tr><td width="3%">1.</td><td width="20%">Nama</td><td width="2%">:</td><td><strong>Istiqomah, S.Pd</strong></td></tr>
                  <tr><td></td><td>Jabatan</td><td>:</td><td>Asst. Manager HRD</td></tr>
                  <tr><td></td><td colspan="3" class="justify-text">Bertindak untuk dan atas nama PT. Tri Lestari Sandang Industri yang berkedudukan di Jl. Balamoa RT 03/ RW 02 Ds. Karangjati, Kec. Tarub Kab. Tegal dan selanjutnya disebut sebagai <strong>Pihak I (Pemberi Kerja).</strong></td></tr>
                </table>

                <table class="party-table">
                  <tr><td width="3%">2.</td><td width="20%">Nama</td><td width="2%">:</td><td><strong>{{ employeeData.namaPekerja }}</strong> ( {{ employeeData.sexPekerja }} )</td></tr>
                  <tr><td></td><td>Tempat / Tgl Lahir</td><td>:</td><td>{{ employeeData.ttlPekerja }}</td></tr>
                  <tr><td></td><td>Status</td><td>:</td><td>Karyawan Kontrak (PKWT)</td></tr>
                  <tr><td></td><td>Alamat</td><td>:</td><td>{{ employeeData.alamatPekerja }}</td></tr>
                  <tr><td></td><td>Nomor KTP</td><td>:</td><td>{{ employeeData.nikKtp }}</td></tr>
                  <tr><td></td><td colspan="3" class="justify-text">Bertindak untuk dan atas nama diri sendiri dan selanjutnya disebut sebagai <strong>Pihak II (Pekerja).</strong></td></tr>
                </table>

                <h4 class="section-title">Ketentuan Umum</h4>
                <p class="justify-text">Kedua belah pihak sepakat untuk mengikatkan diri atas kemauan dan kesadaran masing-masing untuk menjalin hubungan kerja yang dinamis dan harmonis dengan menandatangani PKWT ini berdasarkan syarat-syarat dan ketentuan berikut:</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 1</span>Jangka Waktu</h4>
                <p class="justify-text">
                  PKWT ini dibuat untuk jangka waktu terhitung sejak tanggal <strong>{{ employeeData.mulaiTgl }}</strong> bulan <strong>{{ employeeData.mulaiBulan }}</strong> tahun <strong>{{ employeeData.mulaiTahun }}</strong>
                  s.d tanggal <strong>{{ employeeData.akhirTgl }}</strong> bulan <strong>{{ employeeData.akhirBulan }}</strong> tahun <strong>{{ employeeData.akhirTahun }}</strong>
                  ( selama <strong>{{ employeeData.lamaBulan }}</strong> bulan )
                </p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 2</span>Persyaratan Kerja</h4>
                <p class="justify-text">Bahwa sebelum diterima bekerja di PT. Tri Lestari Sandang Industri, Pihak II bersedia dan setuju melampirkan Salinan dari dokumen asli sebagai persyaratan kerja dalam berkas lamarannya sebagai berikut:</p>
                <ul class="legal-list">
                  <li>Fotocopy Kartu Tanda Penduduk (KTP)</li>
                  <li>Fotocopy Kartu Keluarga (KK)</li>
                  <li>Fotocopy Surat Keterangan Catatan Kepolisian (SKCK)</li>
                  <li>Fotocopy Surat Keterangan Sehat dari Dokter</li>
                  <li>Fotocopy Ijazah terakhir</li>
                  <li>Pasfoto Ukuran 3x4 (2 lembar)</li>
                  <li>Surat Izin Bekerja dari Orang Tua / Wali / Suami</li>
                </ul>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 3</span>Penempatan, Tugas, dan Tanggung Jawab</h4>
                <ol class="legal-list">
                  <li class="justify-text">Pihak I akan memperkerjakan Pihak II pada:
                    <table class="party-table no-margin">
                      <tr><td width="5%">a.</td><td width="15%">Bagian</td><td width="2%">:</td><td><strong>{{ employeeData.bagian }}</strong></td></tr>
                      <tr><td>b.</td><td>Jabatan</td><td>:</td><td><strong>{{ employeeData.jabatan }}</strong></td></tr>
                    </table>
                  </li>
                  <li class="justify-text">Pihak II bersedia bekerja di bagian seperti tersebut pada Pasal 3 ayat 1 yang telah ditetapkan oleh Pihak I.</li>
                  <li class="justify-text">Pihak II bersedia menerima pekerjaan yang ditentukan oleh Pihak I dan akan melaksanakan setiap tugas dan kewajiban yang diberikan oleh atasannya masing-masing dengan sungguh-sungguh dan penuh tanggung jawab sesuai masa berlakunya PKWT ini.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 4</span>Hari dan Jam Kerja</h4>
                <ol class="legal-list">
                  <li class="justify-text">Pihak II menyetujui bahwa waktu kerja di PT.Tri Lestari Sandang Industri dalam satu minggu adalah 6 (enam) hari kerja, 7 (tujuh) jam dalam 1 (satu) hari dan 40 (empat puluh) jam dalam 1 (satu) minggu.</li>
                  <li class="justify-text">Pihak II menyetujui untuk kerja lembur / over time dan kerja shift bilamana diperlukan oleh perusahaan atas perintah atasan masing-masing bagian (atas persetujuan kedua belah pihak dan tanpa adanya paksaan).</li>
                  <li class="justify-text">Upah kerja lembur dihitung sesuai dengan ketentuan Peraturan Perundang-Undangan yang berlaku.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 5</span>Imbalan / Pengupahan</h4>
                <ol class="legal-list">
                  <li class="justify-text">Pihak I akan memberikan upah kepada Pihak II sesuai dengan Upah Minimum selama PKWT ini berlaku yaitu <strong>{{ employeeData.gajiPokokFormatted }}</strong> per bulan yang dibayarkan 2 (dua) kali dalam 1 (satu) bulan secara tunai atau melalui transfer rekening bank, yaitu :
                    <ul class="legal-list">
                      <li>Periode kerja tanggal 1 s.d 15 akan dibayarkan tanggal 22.</li>
                      <li>Periode kerja tanggal 16 s.d akhir bulan akan dibayarkan tanggal 7 bulan berikutnya.</li>
                    </ul>
                  </li>
                  <li class="justify-text">Fasilitas lain tidak ada, kecuali selama menjalani PKWT ini Pihak II akan diikutsertakan dalam program Badan Penyelenggara Jaminan Sosial (BPJS) Ketenagakerjaan yang terdiri dari Jaminan Hari Tua (JHT), Jaminan Kecelakaan Kerja (JKK), Jaminan Kematian (JK) &amp; Jaminan Pensiun (JP), dan BPJS Kesehatan berupa pelayanan kesehatan untuk karyawan &amp; keluarga intinya. Untuk program JHT dimana total preminya adalah 5,7%; 3,7% dibayarkan oleh Pihak I dan 2% dibayarkan oleh Pihak II, program JP dimana total preminya adalah 3%; 2% dibayarkan oleh Pihak I dan 1% dibayarkan oleh Pihak II, program JKK dan JK premi ditanggung oleh perusahaan. Sedangkan untuk program BPJS Kesehatan dimana total preminya adalah 5%; 4% dibayarkan oleh Pihak I dan 1% dibayarkan oleh Pihak II.</li>
                  <li class="justify-text">Pph Pasal 21 dikenakan kepada Pihak II dihitung sesuai dengan ketentuan Peraturan Perundang-Undangan yang berlaku.</li>
                  <li class="justify-text">Pihak I akan memberikan Bonus Produksi bagi Pihak II yang melampaui target di bagian tertentu, dan target dihitung sesuai ketentuan yang telah ditentukan perusahaan.</li>
                  <li class="justify-text">Apabila Pihak I telah bekerja 12 (dua belas) bulan berturut-turut, maka akan diberikan hak cuti tahunan sesuai ketentuan yang diatur dalam Perjanjian Kerja Bersama.</li>
                  <li class="justify-text">Cuti Tahunan, Cuti Haid, dan Cuti Melahirkan diatur dalam Peraturan Perusahaan.</li>
                  <li class="justify-text">Tidak masuk kerja (mangkir) upah tidak dibayar, kecuali ada izin atau surat keterangan sesuai dengan Perjanjian Kerja Bersama.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 6</span>Kewajiban Pihak I (Pemberi Kerja)</h4>
                <p class="justify-text">Pihak I bersedia memberikan pekerjaan dan hak-hak dari Pihak II sesuai dengan perjanjian yang telah disetujui oleh kedua belah pihak.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 7</span>Kewajiban Pihak II (Pekerja)</h4>
                <ol class="legal-list">
                  <li class="justify-text">Apabila Pihak II tidak masuk kerja tanpa alasan yang sah akan diberikan sanksi sesuai dengan Peraturan Perundang-Undangan dan Perjanjian Kerja Bersama (PKB) yang berlaku.</li>
                  <li class="justify-text">Pihak II setuju untuk selalu taat dan patuh serta tunduk terhadap tata tertib kerja dan peraturan yang belaku di PT. Tri Lestari Sandang Industri.</li>
                  <li class="justify-text">Pihak II setuju dan menerima sistem pengupahan yang berlaku di PT. Tri Lestari Sandang Industri dengan tanpa adanya tuntutan di kemudian hari.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 8</span>Berakhirnya Perjanjian Kerja Waktu Tertentu</h4>
                <p class="justify-text">(1) Pihak I dan Pihak II menyadari bahwa hubungan kerja menjadi berakhir ( putus ) apabila :</p>
                <ul class="legal-list">
                  <li>Pihak II meninggal dunia.</li>
                  <li>Habis jangka waktu berlakunya PKWT ini.</li>
                  <li>Pihak II mengundurkan diri.</li>
                  <li>Pihak II melakukan kesalahan berat yang mengakibatkan kerugian bagi perusahaan.</li>
                </ul>
                <p class="justify-text">(2) Pemutusan hubungan kerja tersebut pasal 8 ayat 1 butir a s.d d dapat dilaksanakan Pihak I sesuai dengan Peraturan Perundang-Undangan dan Perjanjian Kerja Bersama (PKB) yang berlaku.</p>
                <p class="justify-text">(3) Bahwa dengan berakhirnya hubungan kerja tersebut di atas, maka Pihak II tidak akan menuntut berupa apapun baik perdata, pidana, maupun lainnya kepada Pihak I dan sebaliknya Pihak I tidak berkewajiban untuk memberikan berupa apapun kepada Pihak II kecuali diperjanjikan secara tertulis.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 9</span>Sanksi – Sanksi</h4>
                <p class="justify-text">Dalam hal Pihak II tidak mentaati kewajiban atau melanggar perjanjian PKWT ini, maka Pihak I dapat memberikan sanksi sebagai berikut :</p>
                <ul class="legal-list">
                  <li>Peringatan lisan.</li>
                  <li>Peringatan Tertulis 1 (satu) sampai dengan 3 (tiga) kali.</li>
                  <li>Pemberhentian sementara ( skorsing ).</li>
                  <li>Pemutusan Hubungan Kerja (PHK).</li>
                </ul>
                <p class="justify-text">Penerapan sanksi tersebut tidak mesti berjenjang tapi bisa dinilai dari bobot kesalahan yang diperbuat Pihak II.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 10</span>Penutup</h4>
                <ol class="legal-list">
                  <li class="justify-text">Segala hal yang belum diatur dalam PKWT ini akan ditentukan kemudian oleh Para Pihak dengan mengindahkan ketentuan Peraturan Perundangan yang berlaku.</li>
                  <li class="justify-text">Perjanjian ini dibuat dan ditandatangani oleh Para Pihak dalam keadaan sehat jasmani dan rohani serta tanpa paksaan atau dipengaruhi pihak lain.</li>
                  <li class="justify-text">Dengan berakhirnya jangka waktu PKWT ini, maka berakhir pula semua hubungan kerja antara Pihak I dan Pihak II. Namun demikian perjanjian tersebut dapat diperpanjang atau diperbarui apabila terdapat kesepakatan kedua belah pihak dengan tetap mengindahkan ketentuan yang berlaku.</li>
                  <li class="justify-text">PKWT ini dibuat rangkap 2 (dua) yang mempunyai kekuatan hukum yang sama.</li>
                </ol>
              </template>

              <!-- ===================== PKWTT (TETAP BULANAN / HARIAN) ===================== -->
              <template v-else-if="jenisKey === 'tetapBulanan' || jenisKey === 'tetapHarian'">
                <p>Perjanjian Kerja Waktu Tidak Tertentu (PKWTT) ini dibuat dan ditanda tangani pada hari <strong>{{ tandaTanganDayName }}</strong> tanggal <strong>{{ tandaTanganDateOnly }}</strong> bulan <strong>{{ tandaTanganMonthName }}</strong> tahun <strong>{{ tandaTanganYear }}</strong>, oleh dan antara :</p>

                <table class="party-table">
                  <tr><td width="3%">-</td><td width="20%">Nama</td><td width="2%">:</td><td><strong>Istiqomah, S.Pd</strong> ( P )</td></tr>
                  <tr><td></td><td>Tempat/Tgl. Lahir</td><td>:</td><td>Tegal, 26 November 1991</td></tr>
                  <tr><td></td><td>Alamat</td><td>:</td><td>Desa Kalijambe RT 05 RW 03, Kec. Tarub Kab. Tegal</td></tr>
                  <tr><td></td><td>Pekerjaan/Jabatan</td><td>:</td><td>Asst. Manager HRD</td></tr>
                </table>
                <p class="justify-text">Bertindak untuk dan atas nama PT. Tri Lestari Sandang Industri, yaitu perusahaan yang bergerak dalam bidang Industri Pakaian Jadi dari Sweater yang berkedudukan di Jalan Raya Balamoa No. 45, RT 03 RW 02 Kelurahan Karangjati Kecamatan Tarub Kabupaten Tegal dan selanjutnya disebut sebagai <strong>PIHAK PERTAMA (Perusahaan).</strong></p>

                <table class="party-table">
                  <tr><td width="3%">-</td><td width="20%">Nama</td><td width="2%">:</td><td><strong>{{ employeeData.namaPekerja }}</strong> ( {{ employeeData.sexPekerja }} )</td></tr>
                  <tr><td></td><td>Tempat/Tgl. Lahir</td><td>:</td><td>{{ employeeData.ttlPekerja }}</td></tr>
                  <tr><td></td><td>Alamat</td><td>:</td><td>{{ employeeData.alamatPekerja }}</td></tr>
                  <tr v-if="jenisKey === 'tetapHarian'"><td></td><td>NIK KTP</td><td>:</td><td>{{ employeeData.nikKtp }}</td></tr>
                </table>
                <p class="justify-text">Bertindak untuk dan atas nama diri sendiri dan selanjutnya disebut <strong>PIHAK KEDUA (Pekerja).</strong></p>

                <p class="justify-text">PERUSAHAAN dan PEKERJA secara bersama-sama selanjutnya disebut PARA PIHAK. PARA PIHAK terlebih dahulu menerangkan bahwa PERUSAHAAN adalah perusahaan yang bergerak dibidang Industri Pakaian Jadi dari Sweater dan bermaksud mempekerjakan PEKERJA berdasarkan <strong>Perjanjian Kerja Untuk Waktu Tidak Tertentu (PKWTT)</strong> sebagaimana diatur dalam perjanjian ini, dan PEKERJA telah sepakat untuk bekerja berdasarkan Perjanjian Kerja Waktu Tidak Tertentu tersebut bagi PERUSAHAAN.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 1</span>Definisi</h4>
                <p class="justify-text">&ldquo;Perjanjian Kerja&rdquo; berarti Perjanjian Kerja Untuk Waktu Tidak Tertentu. &ldquo;Perjanjian Kerja Bersama (PKB)&rdquo; berarti Peraturan Perusahaan PT. Tri Lestari Sandang Industri yang telah disahkan oleh Dinas Perindustrian dan Tenaga Kerja Kabupaten Tegal. &ldquo;Keputusan Perusahaan&rdquo; berarti keputusan tertulis PERUSAHAAN sebagai pelaksanaan Perjanjian Kerja ini dan PKB.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 2</span>Perjanjian Kerja Untuk Waktu Tidak Tertentu</h4>
                <p class="justify-text">
                  PERUSAHAAN dengan ini sepakat untuk mempekerjakan PEKERJA dan PEKERJA dengan ini sepakat untuk bekerja bagi PERUSAHAAN berdasarkan Perjanjian Kerja Untuk Waktu Tidak Tertentu (selanjutnya disebut &ldquo;Perjanjian Kerja&rdquo;) terhitung sejak tanggal
                  <strong>{{ employeeData.mulaiTgl }}</strong> bulan <strong>{{ employeeData.mulaiBulan }}</strong> tahun <strong>{{ employeeData.mulaiTahun }}</strong>.
                </p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 3</span>Hak dan Kewajiban Perusahaan</h4>
                <p class="justify-text">(1) Hak PERUSAHAAN</p>
                <ul class="legal-list">
                  <li>PERUSAHAAN berhak untuk menerima hasil pelaksanaan pekerjaan dari PEKERJA dengan Penempatan, Tugas dan tanggung jawab Pekerjaan sebagaimana diatur dalam pasal 5 Perjanjian Kerja ini;</li>
                  <li>PERUSAHAAN berhak untuk membuat Keputusan Perusahaan dalam rangka melaksanakan Perjanjian Kerja Bersama (PKB) dan Perjanjian Kerja ini;</li>
                  <li>PERUSAHAAN berhak untuk melakukan penempatan, pemindahan dan evaluasi PEKERJA dengan ketentuan sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB);</li>
                  <li>PERUSAHAAN berhak untuk memberikan Peringatan Lisan, Peringatan Tertulis dan Sanksi kepada PEKERJA dengan ketentuan sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB);</li>
                  <li>PERUSAHAAN berhak untuk melakukan Pemutusan Hubungan Kerja dengan PEKERJA dengan ketentuan sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB).</li>
                </ul>
                <p class="justify-text">(2) Kewajiban PERUSAHAAN</p>
                <ul class="legal-list">
                  <li>PERUSAHAAN berkewajiban untuk memberikan Gaji kepada PEKERJA dengan ketentuan sebagaimana diatur dalam pasal 7 Perjanjian Kerja ini;</li>
                  <li>PERUSAHAAN berkewajiban untuk mengikutsertakan PEKERJA dalam program BPJS Kesehatan dan BPJS Ketenagakerjaan dengan ketentuan sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB);</li>
                  <li>PERUSAHAAN berkewajiban untuk memberikan Tunjangan Hari Raya Keagamaan kepada PEKERJA dengan ketentuan sebagaimana diatur dalam Peraturan Pemerintah dan Perjanjian Kerja Bersama (PKB).</li>
                </ul>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 4</span>Hak dan Kewajiban Pekerja</h4>
                <p class="justify-text">(1) Hak PEKERJA</p>
                <ul class="legal-list">
                  <li>PEKERJA berhak untuk menerima Gaji dari PERUSAHAAN dengan ketentuan sebagaimana diatur dalam pasal 7 Perjanjian Kerja ini;</li>
                  <li>PEKERJA berhak untuk memperoleh Waktu Istirahat Kerja, Waktu Libur Kerja, Waktu Cuti Kerja, Izin Meninggalkan Jadwal Kerja dari PERUSAHAAN dengan ketentuan sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB);</li>
                  <li>PEKERJA berhak untuk memperoleh Fasilitas Kesejahteraan berupa diikutsertakan dalam program BPJS Kesehatan berupa pelayanan kesehatan untuk karyawan dan keluarga intinya, dimana total preminya adalah 5%; 4% dibayarkan oleh PERUSAHAAN dan 1% dibayarkan oleh PEKERJA, dan BPJS Ketenagakerjaan yang terdiri dari Jaminan Hari Tua (JHT), Jaminan Kecelakaan Kerja (JKK), Jaminan Kematian (JKM), Jaminan Pensiunan (JP) dan Jaminan Kehilangan Pekerjaan (JKP). Untuk program JHT dimana total preminya adalah 5,7%; 3,7% dibayarkan oleh PERUSAHAAN dan 2% dibayarkan oleh PEKERJA. Program JP dimana total preminya adalah 3%; 2% dibayarkan oleh PERUSAHAAN dan 1% dibayarkan oleh PEKERJA, dan Tunjangan Hari Raya Keagamaan dari PERUSAHAAN dengan ketentuan sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB);</li>
                  <li>PEKERJA berhak untuk mengajukan Pengunduran Diri kepada PERUSAHAAN dengan ketentuan sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB);</li>
                  <li>PEKERJA berhak untuk memperoleh Uang Pesangon dan Uang Penghargaan Masa Kerja dari PERUSAHAAN dengan ketentuan sebagaimana diatur dalam Peraturan Perundang-undangan dan Perjanjian Kerja Bersama (PKB).</li>
                </ul>
                <p class="justify-text">(2) Kewajiban PEKERJA</p>
                <ul class="legal-list">
                  <li>PEKERJA berkewajiban untuk melaksanakan Penempatan, Tugas dan tanggung jawab pekerjaan sebagaimana diatur dalam pasal 5 Perjanjian Kerja ini;</li>
                  <li>PEKERJA berkewajiban untuk mematuhi Kewajiban dan Larangan yang berlaku bagi PEKERJA sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB);</li>
                  <li>PEKERJA berkewajiban untuk melaksanakan Jadwal Waktu Kerja sebagaimana diatur oleh Bagian atau Departement masing-masing dan Perjanjian Kerja Bersama (PKB).</li>
                </ul>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 5</span>Penempatan, Tugas dan Tanggung Jawab</h4>
                <p class="justify-text">Pihak Pertama akan mempekerjakan Pihak Kedua pada:</p>
                <table class="party-table no-margin">
                  <tr><td width="5%">a.</td><td width="15%">Bagian</td><td width="2%">:</td><td><strong>{{ employeeData.bagian }}</strong></td></tr>
                  <tr><td>b.</td><td>Jabatan</td><td>:</td><td><strong>{{ employeeData.jabatan }}</strong></td></tr>
                </table>
                <ol class="legal-list" start="2">
                  <li class="justify-text">Pihak Kedua bersedia menerima pekerjaan seperti tersebut pada pasal 2 diatas dan bersedia melaksanakan setiap tugas dan kewajiban yang diberikan oleh atasannya dengan sungguh-sungguh dan penuh tanggung jawab;</li>
                  <li class="justify-text">Apabila diperlukan, Pihak Kedua bersedia dan menyetujui tanpa menuntut apapun kepada Pihak Pertama untuk dimutasi ke Bagian/Departemen/Divisi lain sesuai dengan kebutuhan Perusahaan;</li>
                  <li class="justify-text">Selain melakukan pekerjaan berdasarkan Penempatan, Tugas dan tanggung jawab tersebut sebagaimana dimaksud ayat (1), PEKERJA juga sepakat untuk melaksanakan pekerjaan tambahan diluar Penempatan, Tugas dan tanggung jawab tersebut yang ditugaskan oleh PERUSAHAAN sepanjang untuk kepentingan Penempatan, Tugas dan tanggung jawab pekerjaan tersebut dengan menyesuaikan dengan kemampuan PEKERJA.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 6</span>Hari dan Jam Kerja</h4>
                <p class="justify-text">(1) Jangka waktu pelaksanaan Penempatan, Tugas dan tanggung jawab Pekerjaan sebagaimana dimaksud pasal 5 Perjanjian Kerja ini adalah untuk selama waktu tidak tertentu dengan Jadwal Waktu Kerja, Waktu Istirahat Kerja dan Waktu Libur Kerja sebagai berikut:</p>
                <ul class="legal-list">
                  <li>PEKERJA menyetujui bahwa waktu kerja di PT. Tri Lestari Sandang Industri adalah 6 (enam) hari kerja dan 1 (satu) hari istirahat dalam satu minggu;</li>
                  <li>Jadwal kerja PEKERJA diatur dan ditentukan oleh PERUSAHAAN sesuai dengan aturan dan ketentuan perundang-undangan yang berlaku;</li>
                  <li>Jadwal kerja yang dimaksud dapat disesuaikan dengan kebutuhan Perusahaan;</li>
                  <li>Apabila diperlukan dan sesuai dengan tanggung jawabnya, PEKERJA bersedia/setuju untuk bekerja lembur atau kerja shift tanpa tuntutan apapun perusahaan.</li>
                </ul>
                <p class="justify-text">(2) PEKERJA berhak memperoleh Waktu Cuti Kerja dengan ketentuan sebagai berikut: jika PEKERJA telah bekerja selama lebih dari 12 (dua belas) bulan maka PEKERJA berhak memperoleh Waktu Cuti Kerja selama 12 (dua belas) hari dalam setahun.</p>
                <p class="justify-text">(3) PEKERJA berhak memperoleh Izin Meninggalkan Jadwal Waktu Kerja dengan ketentuan sebagaimana diatur dalam Perjanjian Kerja Bersama (PKB).</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 7</span>Imbalan / Pengupahan</h4>
                <p class="justify-text" v-if="jenisKey === 'tetapHarian'">
                  (1) PERUSAHAAN akan memberikan upah kepada PEKERJA sesuai ketentuan selama Perjanjian kerja ini berlaku yaitu <strong>{{ employeeData.gajiPokokFormatted }}</strong> per bulan yang dibayarkan dua kali dalam satu bulan secara tunai atau melalui transfer rekening bank, yaitu: periode kerja tanggal 1 s.d 15, dibayarkan tanggal 22 di bulan yang sama; periode kerja tanggal 16 s.d akhir bulan, dibayarkan tanggal 7 bulan berikutnya.
                </p>
                <p class="justify-text" v-else>
                  (1) PERUSAHAAN akan memberikan upah secara tetap kepada PEKERJA pada tanggal 7 (tujuh) setiap bulannya selama PKWTT ini berlaku, secara tunai atau melalui transfer rekening bank.
                </p>
                <ol class="legal-list" start="2">
                  <li class="justify-text">Apabila tanggal seperti tersebut pada pasal 7 ayat (1) jatuh pada hari libur, maka akan dibayarkan pada hari kerja berikutnya;</li>
                  <li class="justify-text">Tidak masuk kerja tanpa alasan yang sah (mangkir) upah tidak dibayar;</li>
                  <li class="justify-text">Pajak Penghasilan (PPh) akan dikenakan kepada PEKERJA sesuai dengan ketentuan peraturan perundang-undangan yang berlaku;</li>
                  <li class="justify-text">Besarnya Gaji Pokok, dan tunjangan dinas luar kota dapat berubah sewaktu-waktu berdasarkan Keputusan Perusahaan dan Perjanjian Kerja Bersama (PKB).</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 8</span>Cuti, Ijin-Ijin, dan Sakit</h4>
                <p class="justify-text">(1) PERUSAHAAN akan memberikan cuti tahunan kepada PEKERJA dengan ketentuan sebagai berikut :</p>
                <ul class="legal-list">
                  <li>Cuti Tahunan diberikan 12 (dua belas) hari setelah PEKERJA bekerja 12 (dua belas) bulan berturut-turut dengan mengajukan permohonan tertulis terlebih dahulu selambat-lambatnya 1 (satu) minggu sebelum cuti;</li>
                  <li>PERUSAHAAN berhak untuk mengatur pelaksanaan pemberian hak cuti tahunan PEKERJA;</li>
                  <li>Hak cuti tahunan gugur atau kadaluarsa jika dalam waktu 6 (enam) bulan setelah berjalan tidak dipergunakan, bukan karena alasan-alasan yang diberikan PERUSAHAAN;</li>
                  <li>Atas pertimbangan PERUSAHAAN, berhubung dengan kepentingan yang nyata, cuti tahunan dapat diundurkan paling lama 6 (enam) bulan terhitung mulai saat PEKERJA berhak atas cuti tahunan, dan apabila sampai waktu pengunduran hak cuti tahunan masih belum bisa diberikan karena adanya kepentingan yang nyata, akan diundur kembali sampai batas akhir timbulnya hak cuti tahunan berikutnya;</li>
                  <li>Semua cuti (Cuti Tahunan, Cuti Haid dan Cuti Melahirkan) sesuai seperti diatur dalam Perjanjian Kerja Bersama (PKB).</li>
                </ul>
                <p class="justify-text">(2) PEKERJA berhak atas ijin meninggalkan pekerjaan dengan upah dibayar sesuai yang telah diatur dalam Peraturan Perundang-undangan yang berlaku, untuk kepentingan-kepentingan sebagai berikut :</p>
                <ul class="legal-list">
                  <li>Perkawinan: Pekerja lajang 3 hari, Anak Pekerja 2 hari;</li>
                  <li>Khitanan / Baptis: Anak Sendiri 2 hari;</li>
                  <li>Kematian: Istri/Suami/Anak Pekerja 2 hari, Orang Tua/Mertua 2 hari, Saudara dalam satu rumah 1 hari;</li>
                  <li>Istri / Pihak Kedua melahirkan / keguguran 2 hari;</li>
                  <li>Sakit: Pekerja sendiri selama ditentukan oleh dokter yang ditunjuk oleh BPJS Kesehatan dan telah melalui verifikasi kebenarannya.</li>
                </ul>
                <p class="justify-text">(3) Untuk memperoleh ijin seperti tersebut pada pasal 8 ayat (2) PEKERJA butir a dan b harus mengajukan permohonan 6 (enam) hari sebelumnya, kecuali untuk butir c dan d disesuaikan dengan waktu kejadian.</p>
                <p class="justify-text">(4) Permohonan pada pasal 8 ayat (2) butir e harus melampirkan Surat Keterangan Sakit dari dokter dan telah diverifikasi kebenarannya oleh dokter BPJS Kesehatan yang ditunjuk oleh perusahaan.</p>
                <p class="justify-text">(5) Tidak masuk kerja selain dari Cuti, Sakit dan Ijin Yang Dibayar maka upah tidak bayar.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 9</span>Pemutusan Hubungan Kerja</h4>
                <ol class="legal-list">
                  <li class="justify-text">PERUSAHAAN dan PEKERJA sepakat untuk selalu mengupayakan agar tidak terjadi Pemutusan Hubungan Kerja, namun dalam hal Pemutusan Hubungan Kerja tersebut tidak dapat dihindarkan, maka maksud Pemutusan Hubungan Kerja tersebut akan dirundingkan oleh PERUSAHAAN dan PEKERJA;</li>
                  <li class="justify-text">Dalam hal perundingan sebagaimana dimaksud ayat (1) tidak menghasilkan kesepakatan, PERUSAHAAN berhak untuk melakukan Pemutusan Hubungan Kerja dan PEKERJA berhak untuk melakukan Pengunduran Diri.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 10</span>Penyelesaian Perselisihan Hubungan Kerja</h4>
                <ol class="legal-list">
                  <li class="justify-text">Segala perselisihan yang berkaitan dengan hubungan kerja antara PERUSAHAAN dan PEKERJA wajib diselesaikan oleh PERUSAHAAN dan PEKERJA secara musyawarah untuk mufakat;</li>
                  <li class="justify-text">Dalam hal penyelesaian secara musyawarah untuk mufakat sebagaimana dimaksud ayat (1) tidak tercapai, maka PERUSAHAAN dan PEKERJA dapat menyelesaikan perselisihan tersebut melalui prosedur peraturan perundang-undangan yang berlaku.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 11</span>Berakhirnya Perjanjian Kerja Waktu Tidak Tertentu</h4>
                <p class="justify-text">Para Pihak menyadari bahwa hubungan kerja menjadi berakhir (putus) apabila :</p>
                <ol class="legal-list">
                  <li class="justify-text">PEKERJA meninggal dunia;</li>
                  <li class="justify-text">PEKERJA mengundurkan diri dengan persetujuan PERUSAHAAN;</li>
                  <li class="justify-text">PEKERJA memasuki usia pensiun sesuai ketentuan yang berlaku;</li>
                  <li class="justify-text">PEKERJA melakukan pelanggaran berat atau dapat mengakibatkan kerugian bagi perusahaan.</li>
                </ol>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 12</span>Sanksi – Sanksi</h4>
                <p class="justify-text">(1) PERUSAHAAN berhak memberikan Peringatan dan Sanksi kepada PEKERJA yang melakukan pelanggaran terhadap Kewajiban dan Larangan PEKERJA yang telah ditentukan berdasarkan Peraturan Perusahaan dan peraturan perundang-undangan yang berlaku berupa:</p>
                <ul class="legal-list">
                  <li>Peringatan lisan.</li>
                  <li>Peringatan tertulis.</li>
                  <li>Pemberhentian sementara (skorsing).</li>
                  <li>Pemutusan hubungan kerja.</li>
                </ul>
                <p class="justify-text">(2) Penerapan sanksi tersebut tidak harus berjenjang tapi bisa dinilai dari bobot kesalahan yang diperbuat.</p>

                <h4 class="section-title"><span class="section-title__pasal">Pasal 13</span>Penutup</h4>
                <ol class="legal-list">
                  <li class="justify-text">Segala hal yang belum diatur dalam Perjanjian Kerja Waktu Tidak Tertentu (PKWTT) ini, akan ditentukan kemudian oleh Para Pihak dengan mengindahkan ketentuan peraturan perundang-undangan yang berlaku.</li>
                  <li class="justify-text">Perjanjian ini dibuat dan ditandatangani oleh Para Pihak dalam keadaan sadar, sehat jasmani dan rohani serta tanpa adanya paksaan dan atau tekanan dari siapapun atau pihak manapun juga.</li>
                  <li class="justify-text">Perjanjian Kerja Waktu Tidak Tertentu (PKWTT) ini dibuat rangkap 2 (dua) yang mempunyai kekuatan hukum yang sama.</li>
                </ol>
              </template>
            </div>

            <div class="signature-section">
              <div class="date-location">
                Tegal, {{ tandaTanganDateOnly }} {{ tandaTanganMonthName }} {{ tandaTanganYear }}
              </div>
              <table class="sig-table">
                <tr>
                  <td width="50%" class="center-text sig-role">Pihak II (Pekerja)</td>
                  <td width="50%" class="center-text sig-role">Pihak I (Pemberi Kerja)</td>
                </tr>
                <tr>
                  <td class="center-text sig-cell">
                    <div v-if="signatureBase64" class="sig-preview-box">
                      <img :src="signatureBase64" alt="Tanda Tangan" class="sig-img"/>
                    </div>
                    <div v-else class="sig-placeholder">
                      (Belum Tanda Tangan)
                    </div>
                    <strong>( {{ employeeData.namaPekerja }} )</strong>
                  </td>
                  <td class="center-text sig-cell">
                    <strong>Istiqomah, S.Pd</strong><br/>
                    Asst. Manager HRD
                  </td>
                </tr>
              </table>
            </div>

            <!-- BLOK "TELAH DIBACA DAN DITERIMA" — TTD KEDUA KARYAWAN -->
            <div class="ack-section">
              <p>Telah dibaca dan diterima salinan {{ jenisSurat }} ini,</p>
              <div class="ack-sig">
                <div v-if="signatureBase64" class="sig-preview-box">
                  <img :src="signatureBase64" alt="Tanda Tangan" class="sig-img"/>
                </div>
                <div v-else class="sig-placeholder">
                  (Belum Tanda Tangan)
                </div>
                <p>( <strong>{{ employeeData.namaPekerja }}</strong> )</p>
              </div>
            </div>
          </div>
        </div>

        <!-- FORM SUBMIT SECTION -->
        <div class="action-panel" v-if="!isSubmitted">
          <label class="agreement-box">
            <input type="checkbox" v-model="hasAgreed">
            <span>Saya (<strong>{{ employeeData.namaPekerja }}</strong>) telah membaca, memahami, dan menyetujui seluruh isi perjanjian kerja ini.</span>
          </label>

          <div class="signature-pad-container" v-if="hasAgreed">
            <p class="instruction">Silakan tanda tangan pada kotak di bawah ini</p>
            <div class="pad-wrapper">
              <!-- KANVAS TANDA TANGAN ASLI -->
              <canvas
                ref="sigCanvas"
                width="500"
                height="200"
                class="real-canvas"
                @mousedown="startDraw"
                @mousemove="drawing"
                @mouseup="stopDraw"
                @mouseleave="stopDraw"
                @touchstart.prevent="startDrawTouch"
                @touchmove.prevent="drawingTouch"
                @touchend.prevent="stopDraw"
              ></canvas>
              <span class="pad-guideline" aria-hidden="true"></span>
              <button class="btn-clear" @click="clearSignature" v-if="signatureBase64">Hapus TTD</button>
            </div>
          </div>

          <div class="email-input-container" v-if="signatureBase64">
            <label for="email">Email Pengiriman Dokumen</label>
            <input type="email" id="email" v-model="employeeData.email" placeholder="contoh@email.com" class="form-control">
          </div>

          <button class="btn-submit" :disabled="!isReadyToSubmit" @click="submitContract">
            <span v-if="isSubmitting" class="spinner spinner--light" aria-hidden="true"></span>
            {{ isSubmitting ? 'Memproses…' : 'Kirim & Tanda Tangani' }}
          </button>
        </div>

        <div class="success-panel" v-if="isSubmitted">
          <div class="stamp" aria-hidden="true">
            <span class="stamp__ring"></span>
            <svg class="stamp__check" width="34" height="34" viewBox="0 0 34 34" fill="none">
              <path d="M8 17.5l6 6L26 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>Dokumen Berhasil Ditandatangani</h3>
          <p>File PDF telah dibuat dan dikirimkan ke email <strong>{{ employeeData.email }}</strong></p>
          <!--<a :href="apiBaseUrl + downloadUrl" target="_blank" class="btn-download">Unduh PDF</a>-->
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import axios from 'axios';

// Konfigurasi Env
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'; // Sesuaikan port backend anda
const API_BASE_URL = apiBaseUrl;

// State Variables Umum
const searchQuery = ref('');
const searchIDNo = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const isContractVisible = ref(false);
const employeeData = ref({});
const templateType = ref('');

// Form State
const hasAgreed = ref(false);
const signatureBase64 = ref('');
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const downloadUrl = ref('');

// === STATE UNTUK KANVAS TANDA TANGAN ===
const sigCanvas = ref(null);
const isDrawing = ref(false);
let ctx = null;

// Ketika setuju dicentang, kita inisialisasi Kanvasnya
watch(hasAgreed, async (newVal) => {
  if (newVal) {
    await nextTick(); // Tunggu elemen di-render ke DOM
    if (sigCanvas.value) {
      ctx = sigCanvas.value.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1C2B4A';
    }
  } else {
    signatureBase64.value = ''; // Reset jika batal setuju
  }
});

// Fungsi pembantu koordinat (Mouse & Sentuhan HP)
const getCoordinates = (event) => {
  const rect = sigCanvas.value.getBoundingClientRect();
  if (event.touches && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top
    };
  }
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
};

// Fungsi Menggambar
const startDraw = (e) => {
  isDrawing.value = true;
  const { x, y } = getCoordinates(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
};

const drawing = (e) => {
  if (!isDrawing.value) return;
  const { x, y } = getCoordinates(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};

const stopDraw = () => {
  if (isDrawing.value) {
    ctx.closePath();
    isDrawing.value = false;
    // Simpan gambar kanvas ke format base64
    signatureBase64.value = sigCanvas.value.toDataURL('image/png');
  }
};

const startDrawTouch = (e) => startDraw(e);
const drawingTouch = (e) => drawing(e);

const clearSignature = () => {
  if (ctx && sigCanvas.value) {
    ctx.clearRect(0, 0, sigCanvas.value.width, sigCanvas.value.height);
    signatureBase64.value = '';
  }
};
// === SELESAI FUNGSI KANVAS ===

// Computed Properties untuk Tanggal (Header)
// Semua tanggal yang tampil di dokumen (kalimat pembuka "dibuat dan ditanda tangani
// pada hari..." maupun baris penutup "Tegal, ...") SEKARANG ikut xJoinDate karyawan,
// sama seperti PDF final yang di-generate backend (getContractPreview & submitSignedContract
// keduanya pakai emp.xJoinDate) -- BUKAN tanggal saat halaman ini dibuka/ditandatangani.
const tandaTanganDayName = computed(() => employeeData.value.tandaTanganDayName || '-');
const tandaTanganDateOnly = computed(() => employeeData.value.tandaTanganDateOnly || '-');
const tandaTanganMonthName = computed(() => employeeData.value.tandaTanganMonthName || '-');
const tandaTanganYear = computed(() => employeeData.value.tandaTanganYear || '-');

// Computed Properties untuk Teks Dinamis
// jenisKey dikirim backend (templateType / xKind / jenisKontrak) dalam berbagai
// kemungkinan format penulisan: "kontrakBulanan", "Kontrak Bulanan", "KONTRAK_BULANAN",
// "PKWT Kontrak Bulanan", dst. Supaya TIDAK salah jatuh ke PKWTT (v-else) hanya karena
// format string beda, kita normalisasi dulu (lowercase, buang spasi/underscore/strip)
// lalu deteksi berdasarkan kata kunci "kontrak"/"tetap" dan "harian"/"bulanan".
const normalizedJenis = computed(() => {
  return String(templateType.value || '').toLowerCase().replace(/[\s_\-]/g, '');
});

const jenisKey = computed(() => {
  const n = normalizedJenis.value;
  const isKontrak = n.includes('kontrak') || n.includes('pkwtke'); // PKWT Kontrak selalu berjudul "PKWT KE-..."
  const isTetap = n.includes('tetap') || n.includes('pkwtt');
  const isHarian = n.includes('harian');
  const isBulanan = n.includes('bulanan');

  if (isKontrak && isHarian) return 'kontrakHarian';
  if (isKontrak) return 'kontrakBulanan'; // default Kontrak kalau harian/bulanan tak terdeteksi

  if (isTetap && isHarian) return 'tetapHarian';
  if (isTetap) return 'tetapBulanan';

  // Fallback terakhir kalau backend cuma kirim "harian"/"bulanan" polos tanpa
  // embel-embel kontrak/tetap — tidak ada cukup info, jangan asal PKWTT.
  if (isHarian) return 'kontrakHarian';
  if (isBulanan) return 'kontrakBulanan';

  return 'kontrakBulanan';
});
const jenisSurat = computed(() => jenisKey.value.startsWith('tetap') ? 'PKWTT' : 'PKWT');

const getDocumentTitle = computed(() => {
  if (jenisKey.value === 'kontrakBulanan' || jenisKey.value === 'kontrakHarian') {
    return 'PERJANJIAN KERJA WAKTU TERTENTU (PKWT KE - …)';
  }
  return 'PERJANJIAN KERJA WAKTU TIDAK TERTENTU (PKWTT)';
});

const isReadyToSubmit = computed(() => {
  return hasAgreed.value && signatureBase64.value && employeeData.value.email;
});

// Indikator langkah (progres) pada toolbar dokumen
const currentStep = computed(() => {
  if (isSubmitted.value) return 4;
  if (signatureBase64.value) return 3;
  if (hasAgreed.value) return 2;
  return 1;
});

// API Calls
const searchEmployee = async () => {
  // xNO dan xIDNo wajib diisi -- verifikasi identitas 2 lapis sebelum surat
  // kontrak boleh ditampilkan (sesuai validasi di backend). xName sengaja
  // dihilangkan dari pencarian karena kadang nama di KTP dan di ERP berbeda
  // (human error inputan HRD), jadi cukup pakai angka (No. Karyawan & NIK).
  if (!searchQuery.value || !searchIDNo.value) {
    errorMessage.value = "Nomor Karyawan dan Nomor KTP wajib diisi.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.get(`${API_BASE_URL}/pkwthrd/karyawan/${searchQuery.value}/preview`, {
      params: {
        xIDNo: searchIDNo.value
      }
    });
    if (response.data.success) {
      employeeData.value = response.data.data;
      templateType.value = response.data.templateType || response.data.data.jenisKontrak;
      isContractVisible.value = true;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      errorMessage.value = "Data karyawan tidak ditemukan. Pastikan No. Karyawan dan No. KTP sudah benar.";
    } else if (error.response && error.response.status === 400) {
      errorMessage.value = error.response.data?.message || "Nomor Karyawan dan Nomor KTP wajib diisi.";
    } else {
      errorMessage.value = "Terjadi kesalahan pada server.";
    }
  } finally {
    isLoading.value = false;
  }
};

const submitContract = async () => {
  if (!isReadyToSubmit.value) return;

  isSubmitting.value = true;

  try {
    const payload = {
      xIDNo: searchIDNo.value,
      ttdBase64: signatureBase64.value,
      email: employeeData.value.email,
      scrolledToBottom: true,
      agreed: hasAgreed.value
    };

    const response = await axios.post(`${API_BASE_URL}/pkwthrd/karyawan/${searchQuery.value}/submit`, payload);

    if (response.data.success) {
      isSubmitted.value = true;
      downloadUrl.value = response.data.downloadUrl;
    }
  } catch (error) {
    alert(error.response?.data?.message || "Terjadi kesalahan saat memproses tanda tangan.");
  } finally {
    isSubmitting.value = false;
  }
};

const resetSearch = () => {
  isContractVisible.value = false;
  searchQuery.value = '';
  searchIDNo.value = '';
  hasAgreed.value = false;
  signatureBase64.value = '';
  isSubmitted.value = false;
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.contract-app {
  --ink-navy: #1C2B4A;
  --ink-navy-dark: #101A2E;
  --paper: #EFEAE0;
  --card: #FFFFFF;
  --seal: #9C3B3E;
  --seal-dark: #7C2E30;
  --gold: #B08D57;
  --ink-soft: #5C6478;
  --ink-faint: #98A0B3;
  --success: #2F6B52;
  --border-soft: #E1D9C8;

  background: var(--paper);
  background-image:
    radial-gradient(circle at 12% 8%, rgba(28,43,74,0.04), transparent 40%),
    radial-gradient(circle at 88% 92%, rgba(156,59,63,0.05), transparent 40%);
  min-height: 100vh;
  padding: 48px 20px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--ink-navy);
}

.app-shell {
  max-width: 880px;
  margin: 0 auto;
}

/* ============ SEAL MARK (elemen tanda pengenal khas) ============ */
.seal-mark {
  border-radius: 50%;
  border: 1.6px solid var(--seal);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--seal);
}
.seal-mark::before {
  content: '';
  position: absolute;
  inset: 5px;
  border: 1px solid var(--seal);
  border-radius: 50%;
}
.seal-mark__initials {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.seal-mark--lg { width: 76px; height: 76px; margin: 0 auto 20px; }
.seal-mark--lg .seal-mark__initials { font-size: 15px; }
.seal-mark--sm { width: 52px; height: 52px; }
.seal-mark--sm .seal-mark__initials { font-size: 11px; }

/* ============ SEARCH SCREEN ============ */
.search-screen {
  max-width: 420px;
  margin: 60px auto;
  text-align: center;
}

.search-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 4px;
  letter-spacing: -0.3px;
}

.search-sub {
  color: var(--ink-soft);
  font-size: 14px;
  margin: 0 0 32px;
  font-family: 'Newsreader', serif;
  font-style: italic;
}

.search-card {
  background: var(--card);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 28px;
  text-align: left;
  box-shadow: 0 12px 30px -18px rgba(16,26,46,0.35);
}

.field-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--ink-soft);
  margin-bottom: 8px;
}

.search-row {
  display: flex;
  gap: 10px;
}

.search-row input {
  flex: 1;
  padding: 13px 14px;
  font-size: 15px;
  font-family: inherit;
  border: 1.5px solid var(--border-soft);
  border-radius: 8px;
  background: #FBF9F5;
  color: var(--ink-navy);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-row input:focus {
  outline: none;
  border-color: var(--ink-navy);
  box-shadow: 0 0 0 3px rgba(28,43,74,0.12);
  background: #fff;
}

.error-msg {
  color: var(--seal);
  font-size: 13.5px;
  margin: 12px 0 0;
  font-weight: 500;
}

/* ============ BUTTONS ============ */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 22px;
  background: var(--ink-navy);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, transform 0.15s;
}
.btn-primary:hover:not(:disabled) { background: var(--ink-navy-dark); }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============ TOOLBAR + STEPS ============ */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--ink-soft);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 4px;
  transition: color 0.2s;
}
.back-link:hover { color: var(--ink-navy); }

.step-track {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0; padding: 0;
  gap: 4px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
}
.step:not(:last-child)::after {
  content: '';
  width: 20px;
  height: 1px;
  background: var(--border-soft);
  margin: 0 6px;
}

.step__dot {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--border-soft);
  color: var(--ink-faint);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  background: var(--card);
}
.step__label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-faint);
  transition: color 0.25s;
}
.step.is-active .step__dot {
  border-color: var(--seal);
  background: var(--seal);
  color: #fff;
}
.step.is-active .step__label { color: var(--ink-navy); }
.step.is-done .step__dot {
  border-color: var(--ink-navy);
  background: var(--ink-navy);
  color: #fff;
}
.step.is-done .step__label { color: var(--ink-soft); }

/* ============ DOCUMENT PAPER ============ */
.paper-frame {
  background: var(--card);
  border-radius: 4px;
  padding: 10px;
  box-shadow:
    0 1px 0 var(--border-soft),
    0 22px 44px -28px rgba(16,26,46,0.45);
  position: relative;
  margin-bottom: 28px;
}
.paper-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid var(--border-soft);
  border-radius: 4px;
  pointer-events: none;
}

.document-preview {
  padding: 44px 48px;
  font-family: 'Newsreader', 'Times New Roman', serif;
  font-size: 15px;
  line-height: 1.7;
  color: #2A2620;
}

.pt-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  border-bottom: 3px double var(--ink-navy);
  padding-bottom: 16px;
  margin-bottom: 28px;
}
.pt-header__text { text-align: left; }
.pt-header h3 {
  margin: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--ink-navy);
  text-transform: uppercase;
}
.pt-header p {
  margin: 5px 0 0;
  font-size: 12px;
  color: var(--ink-soft);
  font-style: italic;
  max-width: 380px;
}

.doc-title { text-align: center; margin-bottom: 32px; }
.title-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 700;
  font-size: 15.5px;
  letter-spacing: 0.4px;
  text-decoration: underline;
  text-underline-offset: 4px;
  margin: 0;
  color: var(--ink-navy);
}
.doc-number {
  margin-top: 6px;
  font-weight: 600;
  color: var(--seal);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  letter-spacing: 0.3px;
}

.section-title {
  margin: 30px 0 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--ink-navy);
  text-align: center;
  padding-top: 14px;
  border-top: 1px solid var(--gold);
  display: block;
}
.section-title__pasal {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--seal);
  letter-spacing: 1.5px;
  margin-bottom: 3px;
}

.center-text { text-align: center; }
.justify-text { text-align: justify; }

.callout {
  background: #F8F4EC;
  border-left: 3px solid var(--gold);
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
}

.party-table { width: 100%; margin: 16px 0; border-collapse: collapse; font-size: 14.5px; }
.party-table td { padding: 4px 4px; vertical-align: top; }
.no-margin { margin: 6px 0; }

.legal-list { margin: 8px 0 14px; padding-left: 22px; text-align: justify; }
.legal-list li { margin-bottom: 6px; }

.ack-section { margin-top: 40px; font-size: 14.5px; }
.ack-sig { margin-top: 14px; text-align: left; }
.ack-sig p { margin-top: 4px; }

.signature-section { margin-top: 56px; page-break-inside: avoid; }
.date-location {
  text-align: right;
  margin-bottom: 24px;
  padding-right: 40px;
  font-style: italic;
  color: var(--ink-soft);
}
.sig-table { width: 100%; }
.sig-role {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--ink-soft);
  padding-bottom: 8px;
}
.sig-cell { height: 130px; vertical-align: bottom; }

.sig-preview-box { height: 84px; display: flex; justify-content: center; align-items: center; }
.sig-img { max-height: 84px; max-width: 160px; border-bottom: 1.5px solid var(--ink-navy); padding-bottom: 6px; }
.sig-placeholder { color: var(--ink-faint); font-style: italic; margin-bottom: 12px; font-size: 13.5px; }

/* ============ ACTION PANEL ============ */
.action-panel {
  background: var(--card);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 26px;
  box-shadow: 0 12px 30px -22px rgba(16,26,46,0.3);
}

.agreement-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #F8F4EC;
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid var(--border-soft);
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-navy);
}
.agreement-box input[type="checkbox"] {
  margin-top: 3px;
  width: 17px; height: 17px;
  accent-color: var(--seal);
  flex-shrink: 0;
  cursor: pointer;
}

.signature-pad-container { margin-top: 22px; }
.instruction {
  font-weight: 700;
  margin: 0 0 10px;
  font-size: 13.5px;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.pad-wrapper {
  border: 1.5px dashed var(--gold);
  border-radius: 10px;
  background:
    repeating-linear-gradient(135deg, rgba(176,141,87,0.04) 0 2px, transparent 2px 14px),
    #FBF9F5;
  position: relative;
  display: flex;
  justify-content: center;
  overflow: hidden;
}
.pad-guideline {
  position: absolute;
  left: 8%; right: 8%; bottom: 32px;
  height: 1px;
  background: rgba(28,43,74,0.15);
  pointer-events: none;
}

.real-canvas {
  width: 100%;
  max-width: 500px;
  background-color: transparent;
  cursor: crosshair;
  touch-action: none;
}

.btn-clear {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--seal);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  transition: background 0.2s;
}
.btn-clear:hover { background: var(--seal-dark); }

.email-input-container { margin-top: 22px; }
.email-input-container label {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--ink-soft);
  margin-bottom: 8px;
}
.form-control {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--border-soft);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14.5px;
  background: #FBF9F5;
  color: var(--ink-navy);
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-control:focus {
  outline: none;
  border-color: var(--ink-navy);
  box-shadow: 0 0 0 3px rgba(28,43,74,0.12);
  background: #fff;
}

.btn-submit {
  width: 100%;
  margin-top: 24px;
  padding: 15px;
  background: var(--success);
  color: white;
  border: none;
  border-radius: 9px;
  font-family: inherit;
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s, transform 0.15s;
}
.btn-submit:disabled { background: #B7BEC9; cursor: not-allowed; }
.btn-submit:not(:disabled):hover { background: #255A44; }
.btn-submit:not(:disabled):active { transform: scale(0.99); }
.spinner--light { border-color: rgba(255,255,255,0.4); border-top-color: #fff; }

/* ============ SUCCESS PANEL ============ */
.success-panel {
  text-align: center;
  padding: 52px 24px;
  background: var(--card);
  border-radius: 14px;
  border: 1px solid var(--border-soft);
  box-shadow: 0 12px 30px -22px rgba(16,26,46,0.3);
}

.stamp {
  width: 84px; height: 84px;
  margin: 0 auto 20px;
  border-radius: 50%;
  border: 2.5px solid var(--success);
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: stampDown 0.55s cubic-bezier(.25,.9,.3,1.15) both;
}
.stamp__ring {
  position: absolute;
  inset: 6px;
  border: 1px solid var(--success);
  border-radius: 50%;
}
@keyframes stampDown {
  0% { transform: scale(2.1) rotate(-16deg); opacity: 0; }
  65% { transform: scale(0.94) rotate(-6deg); opacity: 1; }
  100% { transform: scale(1) rotate(-6deg); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .stamp { animation: none; }
}

.success-panel h3 {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 800;
  color: var(--ink-navy);
}
.success-panel p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 14.5px;
}

.btn-download {
  display: inline-block;
  margin-top: 20px;
  padding: 12px 26px;
  background: var(--ink-navy);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14.5px;
  transition: background 0.2s;
}
.btn-download:hover { background: var(--ink-navy-dark); }

/* ============ RESPONSIVE ============ */
@media (max-width: 600px) {
  .contract-app { padding: 24px 12px; }
  .document-preview { padding: 28px 20px; }
  .pt-header { flex-direction: column; text-align: center; }
  .pt-header__text { text-align: center; }
  .step__label { display: none; }
  .toolbar { justify-content: space-between; }
  .search-row { flex-direction: column; }
}
</style>