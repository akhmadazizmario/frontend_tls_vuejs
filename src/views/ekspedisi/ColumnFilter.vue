<template>
  <div class="col-filter" ref="triggerWrap">
    <button
      type="button"
      class="col-filter-trigger"
      :class="{ 'is-active': selected.length > 0, 'is-open': open }"
      @click="toggleOpen"
    >
      <span class="col-filter-label">{{ label }}</span>
      <span class="badge rounded-pill col-filter-badge" v-if="selected.length > 0">{{ selected.length }}</span>
      <i class="bi bi-chevron-down col-filter-caret"></i>
    </button>

    <Teleport to="body">
      <Transition name="pop">
        <div
          v-if="open"
          class="col-filter-panel shadow"
          :style="panelStyle"
          @click.stop
          ref="panelEl"
        >
          <div class="input-group input-group-sm mb-2">
            <span class="input-group-text bg-white border-end-0">
              <i class="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              class="form-control border-start-0 ps-0"
              v-model="query"
              placeholder="Cari nilai..."
              ref="searchInput"
            />
          </div>

          <div class="d-flex align-items-center gap-2 mb-2 col-filter-actions">
            <button type="button" class="btn btn-link btn-sm p-0" @click="selectAllVisible">Pilih semua</button>
            <span class="text-muted">&middot;</span>
            <button type="button" class="btn btn-link btn-sm p-0" @click="clearSelection">Hapus</button>
            <span class="ms-auto small text-muted">{{ localSelected.length }} dipilih</span>
          </div>

          <div class="col-filter-list">
            <label
              v-for="opt in filteredOptions"
              :key="opt.value"
              class="form-check col-filter-item"
            >
              <input
                class="form-check-input"
                type="checkbox"
                :value="opt.value"
                :checked="localSelected.includes(opt.value)"
                @change="toggleValue(opt.value)"
              />
              <span class="form-check-label opt-value">{{ opt.value }}</span>
              <span class="opt-count">{{ opt.count }}</span>
            </label>

            <div v-if="filteredOptions.length === 0" class="col-filter-empty">
              <i class="bi bi-slash-circle me-1"></i>Tidak ada nilai yang cocok
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center col-filter-footer">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="closeOnly">Batal</button>
            <button type="button" class="btn btn-primary btn-sm" @click="apply">Terapkan</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  colKey: { type: String, required: true },
  options: { type: Array, default: () => [] }, // [{ value, count }]
  selected: { type: Array, default: () => [] },
});

const emit = defineEmits(['update']);

const open = ref(false);
const query = ref('');
const localSelected = ref([...props.selected]);
const searchInput = ref(null);
const triggerWrap = ref(null);
const panelEl = ref(null);
const panelStyle = ref({});

watch(() => props.selected, (val) => {
  localSelected.value = [...val];
});

const filteredOptions = computed(() => {
  if (!query.value.trim()) return props.options;
  const q = query.value.trim().toLowerCase();
  return props.options.filter(o => o.value.toLowerCase().includes(q));
});

const PANEL_WIDTH = 240;
const PANEL_MAX_HEIGHT = 360;

const positionPanel = async () => {
  await nextTick();
  const trigger = triggerWrap.value;
  if (!trigger) return;

  const rect = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Horizontal: keep panel inside viewport
  let left = rect.left;
  if (left + PANEL_WIDTH > vw - 8) {
    left = Math.max(8, vw - PANEL_WIDTH - 8);
  }

  // Vertical: flip above the trigger if not enough room below
  const spaceBelow = vh - rect.bottom;
  const openUpward = spaceBelow < 280 && rect.top > spaceBelow;

  const style = {
    position: 'fixed',
    left: `${left}px`,
    width: `${PANEL_WIDTH}px`,
    maxHeight: `${PANEL_MAX_HEIGHT}px`,
    zIndex: 2000,
  };

  if (openUpward) {
    style.bottom = `${vh - rect.top + 6}px`;
  } else {
    style.top = `${rect.bottom + 6}px`;
  }

  panelStyle.value = style;
};

const onReposition = () => {
  if (open.value) positionPanel();
};

const toggleOpen = async () => {
  if (open.value) {
    open.value = false;
    return;
  }
  localSelected.value = [...props.selected];
  query.value = '';
  open.value = true;
  await positionPanel();
  await nextTick();
  searchInput.value?.focus();

  window.addEventListener('scroll', onReposition, true);
  window.addEventListener('resize', onReposition);
  document.addEventListener('mousedown', onDocMouseDown, true);
};

const closeOnly = () => {
  open.value = false;
};

const cleanupListeners = () => {
  window.removeEventListener('scroll', onReposition, true);
  window.removeEventListener('resize', onReposition);
  document.removeEventListener('mousedown', onDocMouseDown, true);
};

const onDocMouseDown = (event) => {
  const trigger = triggerWrap.value;
  const panel = panelEl.value;
  if (trigger && trigger.contains(event.target)) return;
  if (panel && panel.contains(event.target)) return;
  open.value = false;
};

watch(open, (val) => {
  if (!val) cleanupListeners();
});

onBeforeUnmount(cleanupListeners);

const toggleValue = (value) => {
  const idx = localSelected.value.indexOf(value);
  if (idx === -1) localSelected.value.push(value);
  else localSelected.value.splice(idx, 1);
};

const selectAllVisible = () => {
  const visibleValues = filteredOptions.value.map(o => o.value);
  const merged = new Set([...localSelected.value, ...visibleValues]);
  localSelected.value = Array.from(merged);
};

const clearSelection = () => {
  localSelected.value = [];
};

const apply = () => {
  emit('update', { key: props.colKey, values: [...localSelected.value] });
  open.value = false;
};
</script>

<style scoped>
.col-filter {
  position: relative;
  width: 100%;
}

.col-filter-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 10px 10px;
  font: inherit;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  border-radius: 6px;
  transition: background-color .12s ease;
}
.col-filter-trigger:hover { background: rgba(0, 0, 0, 0.05); }
.col-filter-trigger.is-active { background: rgba(37, 99, 235, 0.1); }
.col-filter-trigger.is-open { background: rgba(37, 99, 235, 0.16); }

.col-filter-label { flex: 1; }

.col-filter-badge {
  background: #1d4ed8 !important;
  font-size: 10px;
  font-weight: 700;
}

.col-filter-caret {
  font-size: 10px;
  opacity: .6;
  transition: transform .15s ease;
}
.col-filter-trigger.is-open .col-filter-caret { transform: rotate(180deg); }
</style>

<style>
/* Panel is teleported to <body>, so its styling lives in a global block
   (scoped attrs wouldn't apply once teleported out of this component). */
.col-filter-panel {
  background: #fff;
  border: 1px solid #e2e6ee;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  white-space: normal;
  font-size: 12.5px;
}

.col-filter-panel .input-group-text { border-color: #d1d5db; }
.col-filter-panel .form-control { border-color: #d1d5db; font-size: 12.5px; }
.col-filter-panel .form-control:focus {
  box-shadow: none;
  border-color: #0056b3;
}

.col-filter-actions .btn-link { font-size: 11.5px; font-weight: 600; text-decoration: none; }
.col-filter-actions .btn-link:hover { text-decoration: underline; }

.col-filter-list {
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 0 -6px;
  padding: 0 6px;
}

.col-filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px;
  border-radius: 6px;
  cursor: pointer;
  margin: 0;
  transition: background-color .1s ease;
}
.col-filter-item:hover { background: #f1f5f9; }
.col-filter-item .form-check-input { margin: 0; cursor: pointer; }
.col-filter-item .form-check-input:checked { background-color: #0056b3; border-color: #0056b3; }
.opt-value { flex: 1; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.opt-count { color: #9ca3af; font-size: 11px; }

.col-filter-empty {
  padding: 14px 4px;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

.col-filter-footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eef1f6;
}

.pop-enter-active, .pop-leave-active {
  transition: opacity .12s ease, transform .12s ease;
}
.pop-enter-from, .pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>