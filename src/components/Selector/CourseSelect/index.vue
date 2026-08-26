<template>
  <!-- 课程下拉。可搜索，课程多了也能快速定位 -->
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    filterable
    :loading="loading"
    :style="{ width: width }"
    @update:model-value="onChange"
  >
    <el-option v-for="c in list" :key="c.id" :label="c.courseName" :value="c.id" />
  </el-select>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { courseApi } from '@/api/course'

  const props = defineProps({
    modelValue: { type: [String, Number], default: null },
    placeholder: { type: String, default: '请选择课程' },
    clearable: { type: Boolean, default: true },
    width: { type: String, default: '220px' }
  })
  const emit = defineEmits(['update:modelValue', 'change'])

  const list = ref([])
  const loading = ref(false)

  // 课程数量在可预见范围内不会很多（当前 3 门，全年规划也就几十门），
  // 一次拉完做本地搜索，比每次输入都请求一遍简单也快
  onMounted(async () => {
    loading.value = true
    try {
      const res = await courseApi.coursePage({}, 1, 200)
      list.value = res.list || []
    } finally {
      loading.value = false
    }
  })

  function onChange(val) {
    emit('update:modelValue', val)
    // 把整条课程记录一起抛出去，调用方常常还要课程名
    emit('change', val, list.value.find((c) => c.id === val) || null)
  }
</script>
