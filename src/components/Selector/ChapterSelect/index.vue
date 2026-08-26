<template>
  <el-select
    :model-value="modelValue"
    :placeholder="courseId ? placeholder : '请先选择课程'"
    :disabled="!courseId"
    :clearable="clearable"
    filterable
    :loading="loading"
    :style="{ width: width }"
    @update:model-value="onChange"
  >
    <el-option v-for="c in list" :key="c.id" :label="labelOf(c)" :value="c.id" />
  </el-select>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { courseApi } from '@/api/course'

  const props = defineProps({
    modelValue: { type: [String, Number], default: null },
    // 章节属于课程，没选课程就没得选章节
    courseId: { type: [String, Number], default: null },
    placeholder: { type: String, default: '不限章节' },
    clearable: { type: Boolean, default: true },
    width: { type: String, default: '220px' },
    // 传入 { chapterId: 题数 } 时，选项后面显示该章已有多少题
    countMap: { type: Object, default: null }
  })
  const emit = defineEmits(['update:modelValue', 'change'])

  const list = ref([])
  const loading = ref(false)

  function labelOf(c) {
    if (!props.countMap) {
      return c.chapterName
    }
    const n = props.countMap[String(c.id)] || 0
    return `${c.chapterName}（${n} 题）`
  }

  async function load(courseId) {
    if (!courseId) {
      list.value = []
      return
    }
    loading.value = true
    try {
      const res = await courseApi.courseChapterList({ courseId, pageCurrent: 1, pageSize: 200 })
      list.value = res.list || res || []
    } finally {
      loading.value = false
    }
  }

  // 只负责按课程加载可选项，不主动清空已选值。
  //
  // 一开始这里会在 courseId 变化时自动 emit(null)，但那样有两个问题：
  //   1. 表单回填时也会触发——先设 courseId 再填 chapterId，
  //      这个 watcher 异步跑在后面，把刚回填的章节清成 null；
  //   2. 子组件擅自改父组件的值，调用方很难推理。
  // 清空交给父组件在自己的 watcher 里做，它知道什么时候是「用户在换课程」、
  // 什么时候是「正在回填」。
  watch(() => props.courseId, load, { immediate: true })

  function onChange(val) {
    emit('update:modelValue', val)
    emit('change', val)
  }
</script>
