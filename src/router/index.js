import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login.vue'
import Unauthorized from '../views/Unauthorized.vue'
import Dashboard from '../views/dashboard.vue'
import SuratjalanIndex from '../views/suratjalan/index.vue'
import SuratjalanCreate from '../views/suratjalan/create.vue'
import SuratjalanEdit from '../views/suratjalan/edit.vue'
import ComplainCreate from '../views/complain/Create.vue'
import ComplainIndex from '../views/complain/Index.vue'
import ComplainStatus from '../views/complain/Status.vue'
import UserIndex from '../views/user/index.vue'
import ProfilIndex from '../views/profil/index.vue'
import SuratmakerIndex from '../views/suratmaker/index.vue'
import ScanReportEksIndex from '../views/ekspedisi/ScanReport.vue'
import BuildingIndex from '../views/building/index.vue'
import BarangItIndex from '../views/barangit/index.vue'
import RiwayatPesanItIndex from '../views/barangit/riwayatpesanan.vue'
import IdpPoIndex from '../views/idppo/index.vue'
import BarcodeRequestIndex from '../views/barcoderequest/index.vue'
import KomplainITIndex from '../views/komplainit/index.vue'
import KomputerIndex from '../views/komputer/index.vue'
import GudangIndex from '../views/gudang/index.vue'
import PGudangIndex from '../views/gudang/pesanangudang.vue'
import LokerIndex from '../views/loker/index.vue'
import ContactMIndex from '../views/contact-messages/index.vue'
import PelamarIndex from '../views/loker/pelamar.vue'
import PlanningerpIndex from "../views/planningerp/index.vue"
import TargetIndex from "../views/target/index.vue"
import TargetFinishingIndex from "../views/target/finishingreport.vue"
import ScanOneIndex from '../views/target/scanone.vue'
import ScanLinkingIssueIndex from '../views/target/scanbarcodeLinkingIssue.vue'
import ScanLinkingCancelIndex from '../views/target/scanbarcodeLinkingCancel.vue'
import ScanLinkingReceiveIndex from '../views/target/scanbarcodeLinkingReceive.vue'
import ScanLinkingTransferIndex from '../views/target/scanbarcodeLinkingTransfer.vue'
import ScanPieceTransferIndex from '../views/target/scanbarcodePieceTransfer.vue'
import FilePkbIndex from '../views/fco/pkbfile.vue'
import GetProd4aIndex from '../views/target/prod4.vue'
import PkbVisitorIndex from '../views/fco/pkbdownloadvisitor.vue'
import BukuTamuIndex from '../views/buku_tamu/bukutamu.vue'

import GalleryRekrutmenIndex from '../views/loker/gallery/index.vue'
import FormFcoIndex from '../views/fco/form-fco.vue'
import FormFcoCreateIndex from '../views/fco/form-create-fco.vue'
import FormHasilSurveyFcoIndex from '../views/fco/form-fco-result.vue'
import AparChecklistIndex from '../views/fco/apar/aparchecklist.vue'
import AparIndex from '../views/fco/apar/aparindex.vue'
import AparQuestIndex from '../views/fco/apar/aparquestion.vue'
import AparFormIndex from '../views/fco/apar/AparCheckForm.vue'
import AparRekapIndex from '../views/fco/apar/AparRekap.vue'
import ProdTestLining  from '../views/target/ProdTestLining.vue'
import ProdTestLiningpublik from '../views/target/ProdTestLiningpublik.vue'
import DailyOutputPage from '../views/ekspedisi/DailyOutputPage.vue'
import Warehouse12 from '../views/warehouse/index.vue'
import inputanACC from '../views/warehouse/inputanACC.vue'
import UserPageAccess from '../views/uac/UserPageAccess.vue'
import Pages from '../views/uac/Pages.vue'

import CategoriesCleaning from '../views/genearl_affair/lap_kebersihan/CategoriesCleaning.vue'
import QuestionsCleaning from '../views/genearl_affair/lap_kebersihan/QuestionsCleaning.vue'
import InspectionCreate from '../views/genearl_affair/lap_kebersihan/InspectionCreate.vue'
import InspectionReports from '../views/genearl_affair/lap_kebersihan/InspectionReports.vue'

//tv
import linkingA from '../views/tv/linkingA.vue'
import linkingB from '../views/tv/linkingB.vue'
import linkingC from '../views/tv/linkingC.vue'
import linkingD from '../views/tv/linkingD.vue'
import sonteX from '../views/tv/sontex.vue'
import sulaM from '../views/tv/sulam.vue'
import lodansewinG from '../views/tv/lodansewing.vue'
import DashboardTvDisplay from '../views/tv/dashboard.vue'
import OfficetV from '../views/tv/office.vue'
import expedisi from '../views/tv/expedisi.vue'
// tv baru
import linkingAbaru from '../views/tv/TV-NEW/Linkinga.vue' 
import linkingBbaru from '../views/tv/TV-NEW/Linkingb.vue' 
import linkingCbaru from '../views/tv/TV-NEW/Linkingc.vue'
import linkingDbaru from '../views/tv/TV-NEW/Linkingd.vue'
import sulamAbaru from '../views/tv/TV-NEW/Sulama.vue'
import sulamBbaru from '../views/tv/TV-NEW/Sulamb.vue'
import sontexAbaru from '../views/tv/TV-NEW/Sontexa.vue'
import sontexBbaru from '../views/tv/TV-NEW/Sontexb.vue'
import sewingloAbaru from '../views/tv/TV-NEW/Sewingloa.vue'
import sewingloBbaru from '../views/tv/TV-NEW/Sewinglob.vue'
import officeBaru from '../views/tv/TV-NEW/office.vue'

// item
import item from '../views/gudang/data_masuk.vue'
import InventoryForm from '../views/gudang/InventoryForm.vue'
import requestList from '../views/gudang/requestList.vue'
import RequestForm from '../views/gudang/RequestForm.vue'
import ItemStok from '../views/gudang/ItemStok.vue'
import itemnostock from '../views/gudang/itemnostock.vue'
import itemnostockForm from '../views/gudang/itemnostockForm.vue'

// persen target
import persentarget from '../views/target/target_persen/index.vue'
import linkingpergedung from '../views/target/linking_pergedung/index.vue'
import indexlinkingpergedung from '../views/target/linking_pergedung/indexview.vue'
import persentargetunder50persen from '../views/target/target_persen/ReportUnder50.vue'
import persentargetunder50persenmonth from '../views/target/target_persen/ReportUnder50Month.vue'
import indexfinishingprgedung from '../views/target/finishing_pergedung/indexview.vue'
import finishingprgedung from '../views/target/finishing_pergedung/index.vue'
import laporanfinishing from '../views/target/finishing_pergedung/laporan.vue'
import SummaryfinishingPergedung from '../views/target/finishing_pergedung/SummaryPerGedung.vue'
import indexfinishingturunpergedung from '../views/target/finishing_pergedung/ProductionEntryTurunConsole.vue'
import indexfinishingturunsoompergedung from '../views/target/finishing_pergedung/ProductionEntryTurunSoomConsole.vue'
import indexfinishingakumperdept from '../views/target/finishing_pergedung/FormAkumperdeptConsole.vue'
import indexfinishingakumperdeptmassal from '../views/target/finishing_pergedung/MassEntryAkumDept.vue'
import indexfinishingakumperdeptmassalLPTP from '../views/target/finishing_pergedung/MassEntryAkumDeptLPTP.vue'
import indexfinishingakumperdeptmanual from '../views/target/finishing_pergedung/SummaryManualPergedung.vue'
import indexfinishingformturunlainlain from '../views/target/finishing_pergedung/ProductionEntryTurunLainConsole.vue'
import plnLKtambahan from '../views/target/finishing_pergedung/planlk/IndexLK.vue'
import plnKRtambahan from '../views/target/finishing_pergedung/plankr/IndexKR.vue'
//
import TampilanAkumPerDept from '../views/target/finishing_pergedung/TampilanAkumPerDept.vue'

// plan ppc
// import plan_ppc_v2 from '../views/ppc/planning_target/plan_ppc_v2.vue'
// import plan_ppc from '../views/ppc/planning_target/plan_ppc.vue'
// import update_plan_ppc from '../views/ppc/planning_target/update_plan_ppc.vue'
// import update_plan_linking from '../views/ppc/planning_target/update_plan_linking.vue'
// import plan_ppc_v2_linking from '../views/ppc/planning_target/plan_ppc_v2_linking.vue'
// import MasterTeamTarget from '../views/ppc/planning_target/MasterTeamTarget.vue'
//baru
import Planningprodcreate from '../views/ppc/planning_baru/Planningprodcreate.vue'
//import Planningprodupdate from '../views/ppc/planning_baru/Planningprodupdate.vue'
import Reportplanppc from '../views/ppc/planning_baru/Reportplanppc.vue'
import Teambaru from '../views/ppc/planning_baru/Teambaru.vue'

// poeks
import poeks from '../views/poeks/update.vue'
import viewpoeks from '../views/poeks/view.vue'
import edit2poeks from '../views/poeks/edit2.vue'

// car booking
import FormBookingPemohon from '../views/car_book/FormBookingPemohon.vue'
import GaApprovalPage from '../views/car_book/GaApprovalPage.vue'
import FinanceApprovalPage from '../views/car_book/FinanceApprovalPage.vue'
import ManagerApprovalPage from '../views/car_book/ManagerApprovalPage.vue'
import CheckpointSecurityPage from '../views/car_book/CheckpointSecurityPage.vue'
import DriverLogPage from '../views/car_book/DriverLogPage.vue'
import SettlementPage from '../views/car_book/SettlementPage.vue'
import MasterMobilPage from '../views/car_book/MasterMobilPage.vue'
import MasterTujuanPage from '../views/car_book/MasterTujuanPage.vue'
import ServisMobilPage from '../views/car_book/ServisMobilPage.vue'

// retur panel
import indexReturPanel from '../views/returpanel/indexReturPanel.vue'
import Forminputreturnpanel from '../views/returpanel/Forminputreturnpanel.vue'

//pkwt HRD
import pkwtHRD from '../views/pkwthrd/index.vue'
import Tandatangankontrak from '../views/pkwthrd/Tandatangankontrak.vue'

// po index laporan terima
import indexLaporanTerima from '../views/po/indexLaporanTerima.vue'
import indexPOLK from '../views/po/indexPOLK.vue'

import { name } from 'dayjs/locale/id'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/unauthorized', name:'Unauthorized', component: Unauthorized},
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },

   // publik
  { path: '/complain/create', name: 'ComplainCreate', component: ComplainCreate },

  // butuh login
  { path: '/complain', name: 'ComplainIndex', component: ComplainIndex },
  { path: '/complain/status', name: 'ComplainStatus', component: ComplainStatus },

  // surat jalan
  { path: '/suratjalan', name: 'SuratjalanIndex', component: SuratjalanIndex },
  { path: '/suratjalan/create', name: 'SuratjalanCreate', component: SuratjalanCreate },
  { path: '/suratjalan/edit/:id', name: 'SuratjalanEdit', component: SuratjalanEdit },

   // publik user
  { path: '/user', name: 'UserIndex', component: UserIndex },
  { path: '/profile', name: 'ProfilIndex', component: ProfilIndex },

  // surat maker
  { path: '/suratmaker', name: 'SuratmakerIndex', component: SuratmakerIndex },
  { path: '/hasilscanekspedisi', name: 'ScanReportEksIndex', component: ScanReportEksIndex },

  // Building Maintenance
  { path: '/building', name: 'BuildingIndex', component: BuildingIndex },

  //Barang IT
  { path: '/barangit', name: 'BarangItIndex', component: BarangItIndex },
  { path: '/riwayat-pesananan-it', name: 'RiwayatPesanItIndex', component: RiwayatPesanItIndex },

  //idp po
  { path: '/idppo', name: 'IdpPoIndex', component: IdpPoIndex },
  //idp po
  { path: '/barcoderequest', name: 'BarcodeRequestIndex', component: BarcodeRequestIndex },
  //idp po
  { path: '/komplainit', name: 'KomplainITIndex', component: KomplainITIndex },
  //komputer
  { path: '/komputer', name: 'KomputerIndex', component: KomputerIndex },
  //Gudang
  { path: '/gudang', name: 'GudangIndex', component: GudangIndex },
  { path: '/p-gudang', name: 'PGudangIndex', component: PGudangIndex},
  //loker
  { path: '/loker', name: 'LokerIndex', component: LokerIndex},
  //loker
  { path: '/contact-messages', name: 'ContactMIndex', component: ContactMIndex},
  { path: '/daftar-pelamar', name: 'PelamarIndex', component: PelamarIndex},
  // planing erp
  { path: '/planningerp', name: 'PlanningerpIndex', component: PlanningerpIndex},
  // target
  { path: '/target', name: 'TargetIndex', component: TargetIndex},
  { path: '/target-finishing', name: 'TargetFinishingIndex', component: TargetFinishingIndex},
  { path: '/scan-barcode-detail', name: 'ScanOneIndex', component: ScanOneIndex},
  { path: '/scan-barcode-linking-issue', name: 'ScanLinkingIssueIndex', component: ScanLinkingIssueIndex},
  { path: '/scan-barcode-linking-return', name: 'ScanLinkingCancelIndex', component: ScanLinkingCancelIndex},
  { path: '/scan-barcode-linking-receive', name: 'ScanLinkingReceiveIndex', component: ScanLinkingReceiveIndex},
  { path: '/scan-barcode-linking-transfer', name: 'ScanLinkingTransferIndex', component: ScanLinkingTransferIndex},
  { path: '/piece-transfer', name: 'ScanPieceTransferIndex', component: ScanPieceTransferIndex},
  { path: '/getprod4a', name: 'GetProd4aIndex', component: GetProd4aIndex},
  // fco
  { path: '/filepkb', name: 'FilePkbIndex', component:FilePkbIndex},
  { path: '/visitor-pkb', name: 'PkbVisitorIndex', component:PkbVisitorIndex},
  // buku tamu
  { path: '/buku-tamu', name: 'BukuTamuIndex', component:BukuTamuIndex},
  { path: '/gallery-rekrutmen', name: 'GalerryRekrutmenIndex', component:GalleryRekrutmenIndex},
  // fco
  { path: '/form-fco', name: 'FormFcoIndex', component:FormFcoIndex},
  { path: '/form-fco-create', name: 'FormFcoCreateIndex', component:FormFcoCreateIndex},
  { path: '/form-result/:id', name: 'FormHasilSurveyFcoIndex', component:FormHasilSurveyFcoIndex},
  { path: '/fco/apar-check', name: 'apar-check-index', component:AparChecklistIndex},
  { path: '/apar', name: 'AparIndex', component:AparIndex},
  { path: '/apar-question', name: 'AparQuestIndex', component:AparQuestIndex},
  { path: '/fco/apar-check/:id', name: 'apar-check-form', component:AparFormIndex},
  { path: '/fco/apar-rekap', name: 'apar-rekap', component:AparRekapIndex},

  // lining
  { path: '/target/lining', name: 'prodTestLining', component:ProdTestLining},
  { path: '/idplining', name: 'ProdTestLiningpublik', component:ProdTestLiningpublik},
  // daily output
  { path: '/dailyoutput', name: 'DailyOutputPage', component:DailyOutputPage},
  // warehouse
  { path: '/warehouse', name: 'Warehouse', component:Warehouse12},
  { path: '/userpageaccess', name: 'UserPageAccess', component:UserPageAccess},
  { path: '/pages', name: 'Pages', component:Pages},
  { path: '/inputanacc', name: 'inputanACC', component:inputanACC},

  // general affair
  { path: '/categories-lapkebersihan', name: 'CategoriesCleaning', component:CategoriesCleaning},
  { path: '/question-lapkebersihan', name: 'QuestionsCleaning', component:QuestionsCleaning},
  { path: '/create-lapkebersihan', name: 'InspectionCreate', component:InspectionCreate},
  { path: '/report-lapkebersihan', name: 'InspectionReports', component:InspectionReports},

   // tv
  { path: '/tv', name:'DashboardTvDisplay', component:DashboardTvDisplay},
  { path: '/tv-linkinga', name: 'linkingA', component:linkingA},
  { path: '/tv-linkingb', name: 'linkingB', component:linkingB},
  { path: '/tv-linkingc', name: 'linkingC', component:linkingC},
  { path: '/tv-linkingd', name: 'linkingD', component:linkingD},
  { path: '/tv-sontex', name: 'sonteX', component:sonteX},
  { path: '/tv-sulam', name: 'sulaM', component:sulaM},
  { path: '/tv-lodansewing', name: 'lodansewinG', component:lodansewinG},
  { path: '/tv-office', name: 'OfficetV', component:OfficetV},
  { path: '/tv-expedisi', name: 'expedisi', component: expedisi},
   // tv baru
  { path: '/tv-newlinkinga', name: 'linkingAbaru', component: linkingAbaru},
  { path: '/tv-newlinkingb', name: 'linkingBbaru', component: linkingBbaru},
  { path: '/tv-newlinkingc', name: 'linkingCbaru', component: linkingCbaru},
  { path: '/tv-newlinkingd', name: 'linkingDbaru', component: linkingDbaru},
  { path: '/tv-newsulama', name: 'sulamAbaru', component: sulamAbaru},
  { path: '/tv-newsulamb', name: 'sulamBbaru', component: sulamBbaru},
  { path: '/tv-newsontexa', name: 'sontexAbaru', component: sontexAbaru},
  { path: '/tv-newsontexb', name: 'sontexBbaru', component: sontexBbaru},
  { path: '/tv-newsewingloa', name: 'sewingloAbaru', component: sewingloAbaru},
  { path: '/tv-newsewinglob', name: 'sewingloBbaru', component: sewingloBbaru},
  { path: '/tv-officebaru', name: 'officeBaru', component: officeBaru},

  // item
  { path: '/item-masuk', name: 'item', component: item},
  { path: '/inventory-form', name: 'InventoryForm', component: InventoryForm},
  { path: '/inventory-form/:id', name: 'InventoryUpdate', component: InventoryForm},
  { path: '/request', name: 'requestList', component: requestList},
  { path: '/request-permintaan', nama: 'RequestForm', component: RequestForm},
  { path: '/item-stok', name: 'ItemStok', component: ItemStok},
  { path: '/item-no-stok', name: 'itemnostock', component: itemnostock},
  { path: '/item-no-stok-form', name: 'itemnostockForm', component: itemnostockForm},
  { path: '/item-no-stok-form/:id', name: 'itemnostockFormEdit', component: itemnostockForm},

   // persen target
  { path: '/persen-target', name: 'persentarget', component: persentarget},
  { path: '/persen-target-under50persen', name:'persentargetunder50persen', component: persentargetunder50persen},
  { path: '/linking-pergedung', name: 'linkingpergedung', component: linkingpergedung},
  { path: '/view-linking-pergedung', name: 'indexlinkingpergedung', component: indexlinkingpergedung},
  { path: '/persen-target-under50month', name:'persentargetunder50persenmonth', component: persentargetunder50persenmonth},
  { path: '/view-finishing-pergedung', name: 'indexfinishingprgedung', component: indexfinishingprgedung},
  { path: '/finishing-pergedung', name: 'finishingprgedung', component: finishingprgedung},
  { path: '/laporan-finishing-pergedung', name: 'laporanfinishing', component: laporanfinishing},
  { path: '/summary-finishing-pergedung', name: 'SummaryfinishingPergedung', component: SummaryfinishingPergedung},
  { path: '/view-finishing-turun-pergedung', name: 'indexfinishingturunpergedung', component: indexfinishingturunpergedung},
  { path: '/view-finishing-turun-soom-pergedung', name: 'indexfinishingturunsoompergedung', component: indexfinishingturunsoompergedung},
  { path: '/view-form-akum-pergedung', name: 'indexfinishingakumperdept', component: indexfinishingakumperdept},
  { path: '/inputan-massal', name: 'indexfinishingakumperdeptmassal', component: indexfinishingakumperdeptmassal},
  { path: '/inputan-massallptp', name: 'indexfinishingakumperdeptmassalLPTP', component: indexfinishingakumperdeptmassalLPTP},
  { path: '/view-akum-pergedung-manual', name: 'indexfinishingakumperdeptmanual', component: indexfinishingakumperdeptmanual},
  { path: '/view-form-turun-lainlain', name: 'indexfinishingformturunlainlain', component:indexfinishingformturunlainlain},
  { path: '/cek-akum-pergedung', name: 'TampilanAkumPerDept', component:TampilanAkumPerDept},
  { path: '/plnlktambahan', name: 'plnLKtambahan', component:plnLKtambahan},
  { path: '/plnkrtambahan', name: 'plnKRtambahan', component:plnKRtambahan},

  // plan ppc
  // { path: '/plan_ppc_v2', name: 'plan_ppc', component:plan_ppc},
  // { path: '/plan_ppc', name: 'plan_ppc_v2', component:plan_ppc_v2},
  // { path: '/update_plan_ppc', name: 'update_plan_ppc', component:update_plan_ppc},
  // { path: '/update_plan_linking', name: 'update_plan_linking', component: update_plan_linking },
  // { path: '/plan_ppc_linking', name: 'plan_ppc_v2_linking', component:plan_ppc_v2_linking },
  // { path: '/teamtarget', name: 'MasterTeamTarget', component:MasterTeamTarget},
  //baru
  { path: '/plan_create', name:'Planningprodcreate', component:Planningprodcreate},
  // { path: '/plan_update', name:'Planningprodupdate', component:Planningprodupdate},
  { path: '/plan_ppc', name: 'Reportplanppc', component:Reportplanppc},
  { path: '/team_plan', name: 'Teambaru', component:Teambaru},

  // po ekspedisi
  { path: '/update_poeks', name: 'poeks', component:poeks},
  { path: '/view_poeks', name:'viewpoeks', component:viewpoeks},
  { path: '/edit_poeks', name:'edit2poeks', component:edit2poeks},

  // retur panel
  { path: '/hasilperbaikandantolakan', name:'indexReturPanel', component:indexReturPanel},
  { path: '/formhasilperbaikandantolakan', name:'Forminputreturnpanel', component:Forminputreturnpanel},

  // pkwt HRD
  { path: '/pkwtandtt', name: 'pkwtHRD', component:pkwtHRD },
  { path: '/ttk-hrd', name: 'Tandatangankontrak', component:Tandatangankontrak},

  // ===== CAR BOOKING =====
  { path: '/carbook/booking', name: 'CarBookingForm', component: FormBookingPemohon, meta: { requiresAuth: true, pageKey: 'carbook-booking' } },
  { path: '/carbook/ga-approval', name: 'CarBookingGaApproval', component: GaApprovalPage, meta: { requiresAuth: true, pageKey: 'carbook-ga-approval' } },
  { path: '/carbook/finance-approval', name: 'CarBookingFinanceApproval', component: FinanceApprovalPage, meta: { requiresAuth: true, pageKey: 'carbook-finance-approval' } },
  { path: '/carbook/manager-approval', name: 'CarBookingManagerApproval', component: ManagerApprovalPage, meta: { requiresAuth: true, pageKey: 'carbook-manager-approval' } },
  { path: '/carbook/checkpoint-security', name: 'CarBookingCheckpointSecurity', component: CheckpointSecurityPage, meta: { requiresAuth: true, pageKey: 'carbook-checkpoint-security' } },
  { path: '/carbook/driver-log', name: 'CarBookingDriverLog', component: DriverLogPage, meta: { requiresAuth: true, pageKey: 'carbook-driver-log' } },
  { path: '/carbook/settlement', name: 'CarBookingSettlement', component: SettlementPage, meta: { requiresAuth: true, pageKey: 'carbook-settlement' } },
  { path: '/carbook/master-mobil', name: 'CarBookingMasterMobil', component: MasterMobilPage, meta: { requiresAuth: true, pageKey: 'carbook-master-mobil' } },
  { path: '/carbook/master-tujuan', name: 'CarBookingMasterTujuan', component: MasterTujuanPage, meta: { requiresAuth: true, pageKey: 'carbook-master-tujuan' } },
  { path: '/carbook/servis', name: 'CarBookingServisMobil', component: ServisMobilPage, meta: { requiresAuth: true, pageKey: 'carbook-servis' } },

  // Laporan Terima po
  { path: '/laporan-terima-tls', name: 'indexLaporanTerima', component:indexLaporanTerima },
  { path: '/po-linking-produksi', name: 'indexPOLK', component:indexPOLK },

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('user')
  const publicPages = ['Login', 'ComplainCreate', 'ProdTestLiningpublik', 'DashboardTvDisplay', 'linkingA', 'linkingB', 'linkingC', 'sonteX', 'sulaM', 'lodansewinG', 'OfficetV', 'expedisi', 'linkingD', 'linkingAbaru', 'linkingBbaru', 'linkingCbaru', 'linkingDbaru', 'sulamAbaru', 'sulamBbaru', 'sontexAbaru', 'sontexBbaru', 'sewingloAbaru', 'sewingloBbaru', 'officeBaru', 'Tandatangankontrak'] // halaman tanpa login
  const authRequired = !publicPages.includes(to.name)
  if (authRequired && !isLoggedIn) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isLoggedIn) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
