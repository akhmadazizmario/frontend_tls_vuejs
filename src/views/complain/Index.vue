<template>
  <div class="d-flex flex-column min-vh-100 bg-body-tertiary">
    <Header :user="user" @toggle-sidebar="toggleSidebar" @logout="logout" />

    <div class="d-flex flex-grow-1">
      <Sidebar :isOpen="sidebarOpen" />

      <main
        class="flex-grow-1 p-4 main-content"
        :style="{
          marginLeft: sidebarOpen && windowWidth >= 768 ? '16rem' : '0',
        }"
      >
        <div class="container-fluid py-3" style="max-width: 1280px">
          <!-- Page heading -->
          <div class="d-flex flex-wrap align-items-end justify-content-between mb-4 gap-3">
            <div>
              <p class="eyebrow mb-1">Manajemen Komplain</p>
              <h2 class="page-title mb-0">Daftar Komplain</h2>
            </div>
            <button class="btn btn-refresh" @click="loadData" :disabled="isLoading">
              <i class="bi bi-arrow-clockwise" :class="{ 'spin-icon': isLoading }"></i>
              Muat Ulang
            </button>
          </div>

          <!-- Stat cards -->
          <div class="row g-3 mb-4">
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon bg-slate"><i class="bi bi-inboxes"></i></div>
                <div>
                  <div class="stat-value">{{ complains.length }}</div>
                  <div class="stat-label">Total Komplain</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon bg-amber"><i class="bi bi-hourglass-split"></i></div>
                <div>
                  <div class="stat-value">{{ countByStatus('pending') }}</div>
                  <div class="stat-label">Pending</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon bg-emerald"><i class="bi bi-check-circle"></i></div>
                <div>
                  <div class="stat-value">{{ countByStatus('completed') }}</div>
                  <div class="stat-label">Completed</div>
                </div>
              </div>
            </div>
            <div class="col-6 col-lg-3">
              <div class="stat-card">
                <div class="stat-icon bg-rose"><i class="bi bi-x-circle"></i></div>
                <div>
                  <div class="stat-value">{{ countByStatus('rejected') }}</div>
                  <div class="stat-label">Rejected</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 table-card">
            <div class="card-body p-0">
              <!-- Toolbar -->
              <div class="table-toolbar d-flex flex-wrap align-items-center gap-2 p-3">
                <div class="search-box flex-grow-1">
                  <i class="bi bi-search"></i>
                  <input
                    v-model.trim="globalSearch"
                    type="text"
                    class="form-control"
                    placeholder="Cari IDP, detail, atau departemen..."
                  />
                  <button
                    v-if="globalSearch"
                    class="btn-clear"
                    @click="globalSearch = ''"
                    title="Bersihkan pencarian"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>

                <button
                  v-if="hasActiveFilters"
                  class="btn btn-reset-filter"
                  @click="resetFilters"
                >
                  <i class="bi bi-funnel-fill"></i>
                  Reset Filter
                  <span class="badge-count">{{ activeFilterCount }}</span>
                </button>

                <div class="text-muted small ms-auto d-none d-md-block">
                  Menampilkan {{ filteredComplains.length }} dari {{ complains.length }} data
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 modern-table">
                  <thead>
                    <tr>
                      <th style="width: 70px" @click="toggleSort('id')" class="sortable">
                        ID <i :class="sortIconClass('id')"></i>
                      </th>

                      <th style="min-width: 190px">
                        <div class="th-with-filter">
                          <span>Departemen</span>
                          <FilterDropdown
                            :options="departmentOptions"
                            :selected="filters.department"
                            @update="(v) => (filters.department = v)"
                          />
                        </div>
                      </th>

                      <th style="min-width: 160px">
                        <div class="th-with-filter">
                          <span>IDP</span>
                          <FilterDropdown
                            :options="idpOptions"
                            :selected="filters.idp"
                            @update="(v) => (filters.idp = v)"
                            searchable
                          />
                        </div>
                      </th>

                      <th style="min-width: 220px">
                        <div class="th-with-filter">
                          <span>Detail</span>
                          <FilterDropdown
                            :options="detailOptions"
                            :selected="filters.detail"
                            @update="(v) => (filters.detail = v)"
                            searchable
                          />
                        </div>
                      </th>

                      <th style="min-width: 160px">
                        <div class="th-with-filter">
                          <span>Status</span>
                          <FilterDropdown
                            :options="statusOptions"
                            :selected="filters.status"
                            @update="(v) => (filters.status = v)"
                          />
                        </div>
                      </th>

                      <th style="min-width: 150px" @click="toggleSort('createdAt')" class="sortable">
                        Tanggal <i :class="sortIconClass('createdAt')"></i>
                      </th>

                      <th class="text-center" style="min-width: 120px">
                        <div class="th-with-filter justify-content-center">
                          <span>File</span>
                          <FilterDropdown
                            :options="fileOptions"
                            :selected="filters.file"
                            @update="(v) => (filters.file = v)"
                            align="end"
                          />
                        </div>
                      </th>

                      <th class="text-center" style="min-width: 130px">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="isLoading">
                      <td colspan="8" class="py-5 text-center text-muted">
                        <div class="spinner-border spinner-border-sm me-2"></div>
                        Memuat data...
                      </td>
                    </tr>

                    <tr v-else-if="paginatedComplains.length === 0">
                      <td colspan="8" class="py-5">
                        <div class="empty-state">
                          <i class="bi bi-inbox"></i>
                          <p class="mb-1 fw-semibold">Data tidak ditemukan</p>
                          <p class="text-muted small mb-3">
                            Tidak ada komplain yang cocok dengan pencarian atau filter saat ini.
                          </p>
                          <button
                            v-if="hasActiveFilters || globalSearch"
                            class="btn btn-sm btn-reset-filter"
                            @click="resetFilters"
                          >
                            Reset pencarian &amp; filter
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr v-for="c in paginatedComplains" :key="c.id">
                      <td class="text-muted">#{{ c.id }}</td>
                      <td class="fw-medium">{{ c.department?.name_dept || '-' }}</td>
                      <td>{{ c.idp }}</td>
                      <td class="text-truncate-2" :title="c.detail">{{ c.detail }}</td>
                      <td>
                        <span :class="getStatusBadgeClass(c.status)">
                          <i :class="getStatusIcon(c.status)"></i>
                          {{ statusLabel(c.status) }}
                        </span>
                      </td>
                      <td class="text-muted">{{ formatDate(c.createdAt) }}</td>
                      <td class="text-center">
                        <button
                          class="btn btn-icon"
                          :class="c.file_barcode ? 'btn-icon-success' : 'btn-icon-muted'"
                          :disabled="!c.file_barcode"
                          @click="openFile(c.file_barcode)"
                          :title="c.file_barcode ? 'Lihat File Barcode' : 'File tidak ada'"
                        >
                          <i class="bi bi-file-earmark-text"></i>
                        </button>
                      </td>
                      <td class="text-center">
                        <div class="d-flex justify-content-center gap-2">
                          <button
                            class="btn btn-icon btn-icon-primary"
                            @click="editComplain(c)"
                            title="Update"
                          >
                            <i class="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            class="btn btn-icon btn-icon-danger"
                            @click="deleteComplain(c.id)"
                            title="Delete"
                          >
                            <i class="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination footer -->
              <div
                v-if="filteredComplains.length > 0"
                class="d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 pt-2"
              >
                <div class="text-muted small">
                  Menampilkan {{ pageStartIndex + 1 }}–{{ pageEndIndex }} dari
                  {{ filteredComplains.length }} data
                </div>
                <nav v-if="totalPages > 1">
                  <ul class="pagination pagination-sm mb-0 modern-pagination">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                      <button class="page-link" @click="currentPage = 1">
                        <i class="bi bi-chevron-double-left"></i>
                      </button>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                      <button class="page-link" @click="currentPage--">
                        <i class="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    <li
                      v-for="p in visiblePages"
                      class="page-item"
                      :class="{ active: p === currentPage }"
                      :key="p"
                    >
                      <button class="page-link" @click="currentPage = p">{{ p }}</button>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                      <button class="page-link" @click="currentPage++">
                        <i class="bi bi-chevron-right"></i>
                      </button>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                      <button class="page-link" @click="currentPage = totalPages">
                        <i class="bi bi-chevron-double-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Modal -->
        <div
          class="modal fade"
          id="editComplainModal"
          tabindex="-1"
          aria-labelledby="editComplainModalLabel"
          aria-hidden="true"
          ref="editModalRef"
        >
          <div class="modal-dialog modal-dialog-centered">
            <form @submit.prevent="submitEdit">
              <div class="modal-content rounded-4 border-0 shadow-lg modal-modern">
                <div class="modal-header border-0 modal-header-modern">
                  <div class="d-flex align-items-center gap-3">
                    <div class="modal-header-icon">
                      <i class="bi bi-pencil-fill"></i>
                    </div>
                    <div>
                      <h5 class="modal-title mb-0" id="editComplainModalLabel">
                        Edit Complain
                      </h5>
                      <p class="modal-subtitle mb-0">
                        Komplain #{{ editForm.id ?? '-' }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn-close btn-close-white"
                    @click="closeEditModal"
                    aria-label="Close"
                  ></button>
                </div>

                <div class="modal-body p-4">
                  <div class="field-group mb-3">
                    <label for="department" class="field-label">
                      <i class="bi bi-building"></i> Departemen
                    </label>
                    <select
                      v-model="editForm.department_id"
                      id="department"
                      class="form-select field-input"
                      required
                    >
                      <option
                        v-for="dept in departments"
                        :key="dept.id"
                        :value="dept.id"
                      >
                        {{ dept.name_dept }}
                      </option>
                    </select>
                  </div>

                  <div class="field-group mb-3">
                    <label for="idp" class="field-label">
                      <i class="bi bi-person-badge"></i> IDP
                    </label>
                    <input
                      type="text"
                      id="idp"
                      class="form-control field-input"
                      v-model="editForm.idp"
                      placeholder="Masukkan kode IDP"
                      required
                    />
                  </div>

                  <div class="field-group mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <label for="detail" class="field-label">
                        <i class="bi bi-card-text"></i> Detail
                      </label>
                      <span class="char-counter">{{ (editForm.detail || '').length }} karakter</span>
                    </div>
                    <textarea
                      id="detail"
                      class="form-control field-input"
                      rows="3"
                      v-model="editForm.detail"
                      placeholder="Jelaskan detail komplain..."
                      required
                    ></textarea>
                  </div>

                  <div class="field-group mb-1">
                    <label class="field-label">
                      <i class="bi bi-flag"></i> Status
                    </label>
                    <div class="status-segmented">
                      <button
                        type="button"
                        class="segment segment-pending"
                        :class="{ active: editForm.status === 'pending' }"
                        @click="editForm.status = 'pending'"
                      >
                        <i class="bi bi-hourglass-split"></i> Pending
                      </button>
                      <button
                        type="button"
                        class="segment segment-completed"
                        :class="{ active: editForm.status === 'completed' }"
                        @click="editForm.status = 'completed'"
                      >
                        <i class="bi bi-check-circle-fill"></i> Completed
                      </button>
                      <button
                        type="button"
                        class="segment segment-rejected"
                        :class="{ active: editForm.status === 'rejected' }"
                        @click="editForm.status = 'rejected'"
                      >
                        <i class="bi bi-x-circle-fill"></i> Rejected
                      </button>
                    </div>
                  </div>
                </div>

                <div class="modal-footer border-0 pt-0 p-4">
                  <button
                    type="button"
                    class="btn btn-cancel-modern"
                    @click="closeEditModal"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary-modern"
                    :disabled="isUpdating"
                  >
                    <span
                      v-if="isUpdating"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <i v-else class="bi bi-check2 me-1"></i>
                    {{ isUpdating ? 'Menyimpan...' : 'Simpan Perubahan' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, defineComponent, h } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Header from '../../components/Header.vue';
import Sidebar from '../../components/Sidebar.vue';
import Footer from '../../components/Footer.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API2_BASE_URL = import.meta.env.VITE_API2_BASE_URL;

/* -------------------------------------------------------------------- */
/* Small inline component: checkbox filter dropdown for a table header  */
/* -------------------------------------------------------------------- */
const FilterDropdown = defineComponent({
  name: 'FilterDropdown',
  props: {
    options: { type: Array, default: () => [] }, // [{ value, label, count }]
    selected: { type: Array, default: () => [] },
    align: { type: String, default: 'start' },
    searchable: { type: Boolean, default: false },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const rootEl = ref(null);
    const queryText = ref('');

    function toggle() {
      isOpen.value = !isOpen.value;
      if (!isOpen.value) queryText.value = '';
    }
    function close() {
      isOpen.value = false;
      queryText.value = '';
    }
    function onDocClick(e) {
      if (rootEl.value && !rootEl.value.contains(e.target)) close();
    }
    function isChecked(value) {
      return props.selected.includes(value);
    }
    function onCheck(value) {
      const next = isChecked(value)
        ? props.selected.filter((v) => v !== value)
        : [...props.selected, value];
      emit('update', next);
    }
    function clearAll() {
      emit('update', []);
    }
    function visibleOptions() {
      if (!props.searchable || !queryText.value) return props.options;
      const q = queryText.value.toLowerCase();
      return props.options.filter((o) => o.label.toLowerCase().includes(q));
    }

    onMounted(() => document.addEventListener('click', onDocClick));
    onBeforeUnmount(() => document.removeEventListener('click', onDocClick));

    return () =>
      h(
        'div',
        { class: 'filter-dd', ref: rootEl },
        [
          h(
            'button',
            {
              type: 'button',
              class: ['filter-dd-btn', { 'is-active': props.selected.length > 0 }],
              onClick: (e) => {
                e.stopPropagation();
                toggle();
              },
            },
            [
              h('i', { class: 'bi bi-funnel' + (props.selected.length ? '-fill' : '') }),
              props.selected.length
                ? h('span', { class: 'filter-dd-count' }, String(props.selected.length))
                : null,
            ]
          ),
          isOpen.value
            ? h(
                'div',
                { class: ['filter-dd-menu', props.align === 'end' ? 'align-end' : ''] },
                [
                  h('div', { class: 'filter-dd-header' }, [
                    h('span', 'Filter'),
                    props.selected.length
                      ? h(
                          'button',
                          { type: 'button', class: 'filter-dd-clear', onClick: clearAll },
                          'Hapus'
                        )
                      : null,
                  ]),
                  props.searchable
                    ? h('div', { class: 'filter-dd-search' }, [
                        h('i', { class: 'bi bi-search' }),
                        h('input', {
                          type: 'text',
                          placeholder: 'Cari opsi...',
                          value: queryText.value,
                          onInput: (e) => (queryText.value = e.target.value),
                          onClick: (e) => e.stopPropagation(),
                        }),
                      ])
                    : null,
                  h(
                    'div',
                    { class: 'filter-dd-list' },
                    visibleOptions().length === 0
                      ? [h('div', { class: 'filter-dd-empty' }, 'Tidak ada opsi')]
                      : visibleOptions().map((opt) =>
                          h('label', { class: 'filter-dd-item', key: opt.value }, [
                            h('input', {
                              type: 'checkbox',
                              checked: isChecked(opt.value),
                              onChange: () => onCheck(opt.value),
                            }),
                            h('span', { class: 'filter-dd-label' }, opt.label),
                            h('span', { class: 'filter-dd-badge' }, String(opt.count)),
                          ])
                        )
                  ),
                ]
              )
            : null,
        ]
      );
  },
});

/* -------------------------------------------------------------------- */
/* State                                                                */
/* -------------------------------------------------------------------- */
const complains = ref([]);
const departments = ref([]);
const isLoading = ref(false);
const socket = io(`${API2_BASE_URL}`);

const user = ref({});
const sidebarOpen = ref(false);
const windowWidth = ref(window.innerWidth);

const editModalRef = ref(null);
const editForm = ref({
  id: null,
  department_id: '',
  idp: '',
  detail: '',
  status: '',
});
const isUpdating = ref(false);

const globalSearch = ref('');
const filters = ref({
  department: [], // array of department ids (as strings)
  idp: [], // array of exact idp values
  detail: [], // array of exact detail values
  status: [], // array of status values
  file: [], // array of 'ada' | 'tidak'
});

const sortKey = ref('id');
const sortDir = ref('desc'); // 'asc' | 'desc'

const currentPage = ref(1);
const pageSize = 10;

/* -------------------------------------------------------------------- */
/* Layout / auth handlers                                               */
/* -------------------------------------------------------------------- */
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = '/login';
}

function onResize() {
  windowWidth.value = window.innerWidth;
}

/* -------------------------------------------------------------------- */
/* Presentation helpers                                                 */
/* -------------------------------------------------------------------- */
function getStatusBadgeClass(status) {
  switch (status) {
    case 'pending':
      return 'status-badge status-pending';
    case 'completed':
      return 'status-badge status-completed';
    case 'rejected':
      return 'status-badge status-rejected';
    default:
      return 'status-badge status-default';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'pending':
      return 'bi bi-hourglass-split';
    case 'completed':
      return 'bi bi-check-circle-fill';
    case 'rejected':
      return 'bi bi-x-circle-fill';
    default:
      return 'bi bi-circle';
  }
}

function statusLabel(status) {
  const map = { pending: 'Pending', completed: 'Completed', rejected: 'Rejected' };
  return map[status] || status;
}

function countByStatus(status) {
  return complains.value.filter((c) => c.status === status).length;
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
};

function openFile(filename) {
  if (!filename) return;
  const url = `${API_BASE_URL}${filename}`;
  window.open(url, '_blank');
}

/* -------------------------------------------------------------------- */
/* Faceted filtering                                                    */
/* Every filter dimension is computed against the data that ALREADY     */
/* passes every OTHER active filter + the text search. This keeps the   */
/* checkbox options always in sync with what's actually on screen, so   */
/* a selection in one column can never lead to another column showing   */
/* options that would produce zero (blank) results.                     */
/* -------------------------------------------------------------------- */
function matchesSearch(c) {
  if (!globalSearch.value) return true;
  const q = globalSearch.value.toLowerCase();
  return (
    (c.idp || '').toLowerCase().includes(q) ||
    (c.detail || '').toLowerCase().includes(q) ||
    (c.department?.name_dept || '').toLowerCase().includes(q)
  );
}

function matchesDepartment(c) {
  if (filters.value.department.length === 0) return true;
  return filters.value.department.includes(String(c.department_id ?? c.department?.id));
}

function matchesIdp(c) {
  if (filters.value.idp.length === 0) return true;
  return filters.value.idp.includes(c.idp ?? '');
}

function matchesDetail(c) {
  if (filters.value.detail.length === 0) return true;
  return filters.value.detail.includes(c.detail ?? '');
}

function matchesStatus(c) {
  if (filters.value.status.length === 0) return true;
  return filters.value.status.includes(c.status);
}

function matchesFile(c) {
  if (filters.value.file.length === 0) return true;
  const has = c.file_barcode ? 'ada' : 'tidak';
  return filters.value.file.includes(has);
}

// Apply every filter except the one named in `except`
function applyFilters(list, except) {
  return list.filter((c) => {
    if (except !== 'department' && !matchesDepartment(c)) return false;
    if (except !== 'idp' && !matchesIdp(c)) return false;
    if (except !== 'detail' && !matchesDetail(c)) return false;
    if (except !== 'status' && !matchesStatus(c)) return false;
    if (except !== 'file' && !matchesFile(c)) return false;
    if (!matchesSearch(c)) return false;
    return true;
  });
}

const departmentOptions = computed(() => {
  const pool = applyFilters(complains.value, 'department');
  const counts = new Map();
  for (const c of pool) {
    const id = String(c.department_id ?? c.department?.id ?? '');
    const label = c.department?.name_dept || '(Tanpa Departemen)';
    if (!id) continue;
    counts.set(id, { label, count: (counts.get(id)?.count || 0) + 1 });
  }
  return Array.from(counts.entries())
    .map(([value, v]) => ({ value, label: v.label, count: v.count }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const idpOptions = computed(() => {
  const pool = applyFilters(complains.value, 'idp');
  const counts = new Map();
  for (const c of pool) {
    const val = c.idp ?? '';
    if (!val) continue;
    counts.set(val, (counts.get(val) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const detailOptions = computed(() => {
  const pool = applyFilters(complains.value, 'detail');
  const counts = new Map();
  for (const c of pool) {
    const val = c.detail ?? '';
    if (!val) continue;
    counts.set(val, (counts.get(val) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: value.length > 60 ? value.slice(0, 60) + '…' : value,
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

const statusOptions = computed(() => {
  const pool = applyFilters(complains.value, 'status');
  const counts = new Map();
  for (const c of pool) {
    counts.set(c.status, (counts.get(c.status) || 0) + 1);
  }
  const order = ['pending', 'completed', 'rejected'];
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: statusLabel(value), count }))
    .sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
});

const fileOptions = computed(() => {
  const pool = applyFilters(complains.value, 'file');
  let ada = 0;
  let tidak = 0;
  for (const c of pool) (c.file_barcode ? ada++ : tidak++);
  const opts = [];
  if (ada) opts.push({ value: 'ada', label: 'Ada File', count: ada });
  if (tidak) opts.push({ value: 'tidak', label: 'Tidak Ada', count: tidak });
  return opts;
});

const hasActiveFilters = computed(
  () =>
    filters.value.department.length > 0 ||
    filters.value.idp.length > 0 ||
    filters.value.detail.length > 0 ||
    filters.value.status.length > 0 ||
    filters.value.file.length > 0
);

const activeFilterCount = computed(
  () =>
    filters.value.department.length +
    filters.value.idp.length +
    filters.value.detail.length +
    filters.value.status.length +
    filters.value.file.length
);

function resetFilters() {
  filters.value = { department: [], idp: [], detail: [], status: [], file: [] };
  globalSearch.value = '';
}

// Whenever any filter/search input changes, jump back to page 1
watch(
  [
    () => filters.value.department,
    () => filters.value.idp,
    () => filters.value.detail,
    () => filters.value.status,
    () => filters.value.file,
    globalSearch,
  ],
  () => {
    currentPage.value = 1;
  },
  { deep: true }
);

/* -------------------------------------------------------------------- */
/* Sorting                                                              */
/* -------------------------------------------------------------------- */
function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'desc';
  }
}

function sortIconClass(key) {
  if (sortKey.value !== key) return 'bi bi-arrow-down-up sort-icon-idle';
  return sortDir.value === 'asc' ? 'bi bi-sort-up-alt sort-icon-active' : 'bi bi-sort-down sort-icon-active';
}

/* -------------------------------------------------------------------- */
/* Final filtered + sorted + paginated data                            */
/* -------------------------------------------------------------------- */
const filteredComplains = computed(() => {
  const list = applyFilters(complains.value, null);
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    if (sortKey.value === 'createdAt') {
      return (new Date(a.createdAt) - new Date(b.createdAt)) * dir;
    }
    return (a.id - b.id) * dir;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredComplains.value.length / pageSize))
);

const pageStartIndex = computed(() => (currentPage.value - 1) * pageSize);
const pageEndIndex = computed(() =>
  Math.min(pageStartIndex.value + pageSize, filteredComplains.value.length)
);

const paginatedComplains = computed(() =>
  filteredComplains.value.slice(pageStartIndex.value, pageEndIndex.value)
);

const visiblePages = computed(() => {
  const total = totalPages.value;
  const cur = currentPage.value;
  const span = 2;
  const start = Math.max(1, cur - span);
  const end = Math.min(total, cur + span);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
});

/* -------------------------------------------------------------------- */
/* Data loading                                                         */
/* -------------------------------------------------------------------- */
async function loadData() {
  isLoading.value = true;
  try {
    const [complainsRes, deptRes] = await Promise.all([
      axios.get(API_BASE_URL + '/complains'),
      axios.get(API_BASE_URL + '/departments'),
    ]);
    complains.value = complainsRes.data;
    departments.value = deptRes.data;
  } catch (err) {
    Swal.fire(
      'Error',
      err.response?.data?.message || 'Gagal memuat data complain',
      'error'
    );
  } finally {
    isLoading.value = false;
  }
}

/* -------------------------------------------------------------------- */
/* Edit / delete                                                        */
/* -------------------------------------------------------------------- */
async function editComplain(c) {
  try {
    const res = await axios.get(`${API_BASE_URL}/complains/${c.id}`);
    const data = res.data;
    editForm.value.id = data.id;
    editForm.value.department_id = data.department_id;
    editForm.value.idp = data.idp;
    editForm.value.detail = data.detail;
    editForm.value.status = data.status;

    const modalEl = editModalRef.value;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  } catch (err) {
    Swal.fire(
      'Error',
      'Gagal mengambil data complain: ' +
        (err.response?.data?.message || err.message),
      'error'
    );
  }
}

function closeEditModal() {
  const modal = bootstrap.Modal.getInstance(editModalRef.value);
  if (modal) modal.hide();
}

async function submitEdit() {
  isUpdating.value = true;
  try {
    const id = editForm.value.id;
    const payload = {
      department_id: editForm.value.department_id,
      idp: editForm.value.idp,
      detail: editForm.value.detail,
      status: editForm.value.status,
    };
    await axios.put(API_BASE_URL + '/complains/' + id, payload);

    Swal.fire('Berhasil', 'Complain berhasil diperbarui', 'success');
    closeEditModal();

    if (editForm.value.status !== 'pending') {
      const idx = complains.value.findIndex((c) => c.id === id);
      if (idx !== -1) complains.value.splice(idx, 1);
    } else {
      await loadData();
    }
  } catch (err) {
    Swal.fire(
      'Error',
      err.response?.data?.message || 'Gagal update complain',
      'error'
    );
  } finally {
    isUpdating.value = false;
  }
}

async function deleteComplain(id) {
  const result = await Swal.fire({
    title: 'Konfirmasi',
    text: 'Apakah Anda yakin ingin menghapus complain ini?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal',
  });

  if (result.isConfirmed) {
    try {
      await axios.delete(`${API_BASE_URL}/complains/${id}`);
      const idx = complains.value.findIndex((c) => c.id === id);
      if (idx !== -1) complains.value.splice(idx, 1);
      await Swal.fire('Terhapus', 'Complain berhasil dihapus', 'success');
    } catch (err) {
      Swal.fire(
        'Error',
        err.response?.data?.message || 'Gagal menghapus complain',
        'error'
      );
    }
  }
}

/* -------------------------------------------------------------------- */
/* Lifecycle + realtime socket sync                                     */
/* -------------------------------------------------------------------- */
onMounted(() => {
  loadData();
  window.addEventListener('resize', onResize);

  const userData = localStorage.getItem('user');
  if (userData) user.value = JSON.parse(userData);

  socket.on('complain:new', (newComplain) => {
    complains.value.unshift(newComplain);
  });

  socket.on('complain:updated', (updatedComplain) => {
    const idx = complains.value.findIndex((c) => c.id === updatedComplain.id);
    if (updatedComplain.status !== 'pending') {
      if (idx !== -1) complains.value.splice(idx, 1);
    } else if (idx !== -1) {
      complains.value[idx] = updatedComplain;
    } else {
      complains.value.unshift(updatedComplain);
    }
  });

  socket.on('complain:deleted', (id) => {
    complains.value = complains.value.filter((c) => c.id !== parseInt(id));
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  socket.off('complain:new');
  socket.off('complain:updated');
  socket.off('complain:deleted');
  socket.disconnect();
});
</script>

<style scoped>
/* ---------- Layout ---------- */
.main-content {
  margin-top: 56px;
  transition: margin-left 0.3s ease;
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6366f1;
}

.page-title {
  font-weight: 700;
  color: #1e2a4a;
  letter-spacing: -0.01em;
}

.btn-refresh {
  background: #fff;
  border: 1px solid #e2e5ec;
  color: #45507a;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  border-radius: 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.15s ease;
}
.btn-refresh:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}
.spin-icon {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ---------- Stat cards ---------- */
.stat-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1rem 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  box-shadow: 0 1px 2px rgba(20, 24, 44, 0.05);
  border: 1px solid #eef0f5;
  height: 100%;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #fff;
  flex-shrink: 0;
}
.stat-icon.bg-slate { background: linear-gradient(135deg, #475569, #1e293b); }
.stat-icon.bg-amber { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-icon.bg-emerald { background: linear-gradient(135deg, #10b981, #059669); }
.stat-icon.bg-rose { background: linear-gradient(135deg, #f43f5e, #e11d48); }

.stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e2a4a;
  line-height: 1.1;
}
.stat-label {
  font-size: 0.78rem;
  color: #8891ab;
  font-weight: 500;
}

/* ---------- Table card ---------- */
.table-card {
  overflow: hidden;
}

.table-toolbar {
  border-bottom: 1px solid #eef0f5;
}

.search-box {
  position: relative;
  max-width: 380px;
}
.search-box i.bi-search {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0a8c0;
  font-size: 0.9rem;
}
.search-box .form-control {
  padding-left: 2.25rem;
  padding-right: 2rem;
  border-radius: 0.65rem;
  border: 1px solid #e2e5ec;
  background: #f8f9fc;
  font-size: 0.9rem;
}
.search-box .form-control:focus {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.btn-clear {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #a0a8c0;
  font-size: 0.75rem;
  padding: 0.2rem;
}
.btn-clear:hover { color: #45507a; }

.btn-reset-filter {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.5rem 0.9rem;
  border-radius: 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.btn-reset-filter:hover { background: #fee2e2; }
.badge-count {
  background: #dc2626;
  color: #fff;
  font-size: 0.7rem;
  border-radius: 999px;
  padding: 0.05rem 0.4rem;
}

/* ---------- Table ---------- */
.modern-table thead th {
  background: #f8f9fc;
  color: #45507a;
  border-bottom: 1px solid #eef0f5;
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.85rem 1rem;
  vertical-align: middle;
  white-space: nowrap;
}
.modern-table thead th.sortable {
  cursor: pointer;
  user-select: none;
}
.modern-table thead th.sortable:hover { color: #6366f1; }
.sort-icon-idle { font-size: 0.7rem; opacity: 0.4; margin-left: 0.2rem; }
.sort-icon-active { font-size: 0.75rem; opacity: 1; margin-left: 0.2rem; color: #6366f1; }

.th-with-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.modern-table tbody {
  min-height: 350px;
}

.modern-table tbody td {
  padding: 0.9rem 1rem;
  font-size: 0.87rem;
  color: #2c344f;
  border-bottom: 1px solid #f2f3f8;
}
.modern-table tbody tr:last-child td { border-bottom: none; }
.modern-table tbody tr:hover { background-color: #f8f9fc; }

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 320px;
}

/* ---------- Status badges ---------- */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
}
.status-pending { background: #fef3c7; color: #92400e; }
.status-completed { background: #d1fae5; color: #065f46; }
.status-rejected { background: #fee2e2; color: #991b1b; }
.status-default { background: #e5e7eb; color: #374151; }

/* ---------- Icon buttons ---------- */
.btn-icon {
  width: 34px;
  height: 34px;
  border-radius: 0.6rem;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: transform 0.1s ease;
}
.btn-icon:hover:not(:disabled) { transform: translateY(-1px); }
.btn-icon-primary { background: #eef0ff; color: #4f46e5; }
.btn-icon-primary:hover { background: #4f46e5; color: #fff; }
.btn-icon-danger { background: #fee2e2; color: #dc2626; }
.btn-icon-danger:hover { background: #dc2626; color: #fff; }
.btn-icon-success { background: #d1fae5; color: #059669; }
.btn-icon-success:hover { background: #059669; color: #fff; }
.btn-icon-muted { background: #f1f2f6; color: #b0b6c8; }

/* ---------- Empty state ---------- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #45507a;
}
.empty-state i {
  font-size: 2.4rem;
  color: #c7cbdb;
  margin-bottom: 0.5rem;
}

/* ---------- Pagination ---------- */
.modern-pagination .page-link {
  border: none;
  border-radius: 0.5rem !important;
  margin: 0 0.15rem;
  color: #45507a;
  font-weight: 600;
  font-size: 0.82rem;
}
.modern-pagination .page-item.active .page-link {
  background: #6366f1;
  color: #fff;
}
.modern-pagination .page-item:not(.active) .page-link:hover {
  background: #eef0ff;
}
.modern-pagination .page-item.disabled .page-link {
  color: #c7cbdb;
  background: transparent;
}

/* ---------- Modal ---------- */
.modal-modern {
  overflow: hidden;
}
.modal-header-modern {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  border-radius: 1rem 1rem 0 0;
  padding: 1.3rem 1.4rem;
}
.modal-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.modal-title {
  font-weight: 700;
  font-size: 1.05rem;
}
.modal-subtitle {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.75);
}

.field-group .field-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #45507a;
  margin-bottom: 0.4rem;
}
.field-group .field-label i {
  color: #6366f1;
  font-size: 0.85rem;
}
.field-input {
  border: 1px solid #e2e5ec;
  border-radius: 0.65rem;
  background: #f8f9fc;
  font-size: 0.88rem;
  padding: 0.55rem 0.85rem;
  transition: all 0.15s ease;
}
.field-input:focus {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.char-counter {
  font-size: 0.7rem;
  color: #a0a8c0;
}

.status-segmented {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.segment {
  flex: 1 1 0;
  min-width: 110px;
  border: 1px solid #e2e5ec;
  background: #f8f9fc;
  color: #6b7390;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.55rem 0.6rem;
  border-radius: 0.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  transition: all 0.15s ease;
}
.segment:hover { border-color: #c7cbdb; }
.segment-pending.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}
.segment-completed.active {
  background: #d1fae5;
  border-color: #10b981;
  color: #065f46;
}
.segment-rejected.active {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.btn-cancel-modern {
  background: #f1f2f6;
  border: none;
  color: #45507a;
  font-weight: 600;
  border-radius: 0.6rem;
  padding: 0.5rem 1.2rem;
}
.btn-cancel-modern:hover { background: #e5e7ef; color: #2c344f; }

.btn-primary-modern {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  border: none;
  color: #fff;
  font-weight: 600;
  border-radius: 0.6rem;
  padding: 0.5rem 1.2rem;
}
.table-responsive {
  /* Berikan tinggi minimum yang cukup, misal 350px atau 400px */
  min-height: 400px; 
  
  /* Pastikan overflow-y aman untuk elemen absolute dropdown */
  overflow-y: visible !important; 
}
.btn-primary-modern:hover { opacity: 0.92; color: #fff; }
.btn-primary-modern:disabled { opacity: 0.7; }

/* ---------- Filter dropdown (rendered via render function) ---------- */
:deep(.filter-dd) {
  position: relative;
  display: inline-flex;
}
:deep(.filter-dd-btn) {
  border: none;
  background: transparent;
  color: #a0a8c0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  position: relative;
  cursor: pointer;
}
:deep(.filter-dd-btn:hover) { background: #eef0ff; color: #6366f1; }
:deep(.filter-dd-btn.is-active) { color: #6366f1; background: #eef0ff; }
:deep(.filter-dd-count) {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #6366f1;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  border-radius: 999px;
  min-width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}
:deep(.filter-dd-menu) {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  /* Naikkan z-index untuk memastikan dia bertumpuk di paling atas */
  z-index: 9999 !important; 
  min-width: 220px;
  max-width: 260px;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 10px 30px rgba(20, 24, 44, 0.14);
  border: 1px solid #eef0f5;
  overflow: hidden;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
}
:deep(.filter-dd-menu.align-end) {
  left: auto;
  right: 0;
}
:deep(.filter-dd-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.85rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8891ab;
  border-bottom: 1px solid #f2f3f8;
}
:deep(.filter-dd-clear) {
  border: none;
  background: transparent;
  color: #dc2626;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}
:deep(.filter-dd-search) {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-bottom: 1px solid #f2f3f8;
}
:deep(.filter-dd-search i) {
  color: #a0a8c0;
  font-size: 0.78rem;
}
:deep(.filter-dd-search input) {
  border: none;
  outline: none;
  font-size: 0.8rem;
  flex-grow: 1;
  color: #2c344f;
  background: transparent;
}

:deep(.filter-dd-list) {
  max-height: 240px;
  overflow-y: auto;
  padding: 0.35rem 0;
}
:deep(.filter-dd-item) {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: #2c344f;
  cursor: pointer;
}
:deep(.filter-dd-item:hover) { background: #f8f9fc; }
:deep(.filter-dd-item input[type='checkbox']) {
  width: 15px;
  height: 15px;
  accent-color: #6366f1;
  flex-shrink: 0;
}
:deep(.filter-dd-label) {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.filter-dd-badge) {
  background: #f1f2f6;
  color: #8891ab;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}
:deep(.filter-dd-empty) {
  padding: 0.75rem 0.85rem;
  font-size: 0.8rem;
  color: #a0a8c0;
  text-align: center;
}
</style>