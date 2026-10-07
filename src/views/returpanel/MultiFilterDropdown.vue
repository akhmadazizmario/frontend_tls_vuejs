<template>
  <div class="multi-filter-dropdown" ref="rootEl">
    <button
      type="button"
      class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-between filter-toggle-btn"
      @click="open = !open"
    >
      <span class="d-flex align-items-center gap-2">
        <i class="bi" :class="icon"></i>
        {{ label }}
        <span v-if="modelValue.length > 0" class="badge bg-primary rounded-pill">{{ modelValue.length }}</span>
      </span>
      <i class="bi" :class="open ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
    </button>

    <div v-if="open" class="filter-menu shadow-sm">
      <div v-if="searchable" class="p-2 border-bottom">
        <input
          type="text"
          v-model="innerSearch"
          class="form-control form-control-sm"
          placeholder="Cari..."
        />
      </div>

      <div class="d-flex justify-content-between align-items-center px-2 py-1 border-bottom">
        <button class="btn btn-sm btn-link p-0 text-decoration-none" @click="selectAll">Pilih Semua</button>
        <button class="btn btn-sm btn-link p-0 text-decoration-none text-danger" @click="clearSelection">Bersihkan</button>
      </div>

      <div class="filter-options custom-scrollbar">
        <label v-for="opt in visibleOptions" :key="opt" class="filter-option-item">
          <input type="checkbox" :value="opt" v-model="innerValue" />
          <span>{{ opt }}</span>
        </label>
        <div v-if="visibleOptions.length === 0" class="text-slate-400 small px-2 py-2">
          Tidak ada opsi.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  label: { type: String, default: "Filter" },
  icon: { type: String, default: "bi-funnel" },
  options: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  searchable: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const innerSearch = ref("");
const rootEl = ref(null);

const innerValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
});

const visibleOptions = computed(() => {
  if (!props.searchable || !innerSearch.value.trim()) return props.options;
  const q = innerSearch.value.trim().toLowerCase();
  return props.options.filter((o) => String(o).toLowerCase().includes(q));
});

function selectAll() {
  emit("update:modelValue", [...visibleOptions.value]);
}

function clearSelection() {
  emit("update:modelValue", []);
}

function handleClickOutside(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside));
</script>

<style scoped>
.multi-filter-dropdown { position: relative; }
.filter-toggle-btn {
  border-radius: 0.5rem;
  border-color: #cbd5e1;
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
}
.filter-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 20;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;
}
.filter-options {
  max-height: 220px;
  overflow-y: auto;
  padding: 0.25rem 0;
}
.filter-option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  color: #334155;
  cursor: pointer;
}
.filter-option-item:hover { background-color: #f8fafc; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
</style>