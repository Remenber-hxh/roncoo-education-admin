<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑试卷' : '添加试卷'" width="680px">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
      <el-form-item label="试卷名称" prop="paperName">
        <el-input v-model="form.paperName" />
      </el-form-item>
      <el-form-item label="关联课程" prop="courseId">
        <course-select v-model="form.courseId" placeholder="请选择课程" width="240px" />
        <span class="rule-tip-inline">员工从该课程进入考试</span>
      </el-form-item>
      <el-form-item label="分数设置">
        总分 <el-input-number v-model="form.totalScore" :min="1" style="width: 110px" />
        　及格 <el-input-number v-model="form.passScore" :min="1" style="width: 110px" />
      </el-form-item>
      <el-form-item label="考试设置">
        时长(分) <el-input-number v-model="form.durationMinutes" :min="1" style="width: 110px" />
        　补考次数 <el-input-number v-model="form.retakeLimit" :min="0" style="width: 110px" />
      </el-form-item>
      <el-form-item label="组卷规则">
        <div style="width: 100%">
          <div v-for="(rule, index) in rules" :key="index" class="rule-row">
            章节
            <chapter-select v-model="rule.chapterId" :course-id="form.courseId" placeholder="全课程" width="150px" :count-map="chapterCount" />
            　题型
            <el-select v-model="rule.questionType" clearable placeholder="不限" style="width: 90px">
              <el-option :value="1" label="单选" />
              <el-option :value="2" label="多选" />
              <el-option :value="3" label="判断" />
            </el-select>
            　抽 <el-input-number v-model="rule.questionCount" :min="1" style="width: 90px" /> 题
            　每题 <el-input-number v-model="rule.scorePerQuestion" :min="1" style="width: 90px" /> 分
            <el-button v-if="rules.length > 1" text type="danger" @click="rules.splice(index, 1)">删</el-button>
          </div>
          <el-button size="small" @click="rules.push({ categoryId: null, chapterId: null, questionType: null, questionCount: 10, scorePerQuestion: 4 })">+ 加规则</el-button>
          <div class="rule-tip">规则合计：{{ ruleTotal.count }} 题 / {{ ruleTotal.score }} 分（应等于总分）</div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
  import { computed, nextTick, reactive, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { examApi } from '@/api/exam'
  import CourseSelect from '@/components/Selector/CourseSelect/index.vue'
  import ChapterSelect from '@/components/Selector/ChapterSelect/index.vue'

  // 章节题量：配规则时能看到每章有多少题，避免规则要 10 题而该章只有 3 题
  const chapterCount = ref({})
  async function loadChapterCount(courseId) {
    if (!courseId) {
      chapterCount.value = {}
      return
    }
    const res = await examApi.questionCountByChapter(courseId)
    const map = {}
    ;(res || []).forEach((r) => (map[String(r.chapterId)] = r.cnt))
    chapterCount.value = map
  }

  const emit = defineEmits(['refresh'])
  const visible = ref(false)
  const loading = ref(false)
  const formRef = ref()

  const form = reactive({ id: null, paperName: '', courseId: null, totalScore: 100, passScore: 80, durationMinutes: 60, retakeLimit: 1 })
  const rules = ref([])

  const formRules = {
    paperName: [{ required: true, message: '请输入试卷名称', trigger: 'blur' }]
  }

  // 回填期间要屏蔽下面这个 watcher。
  // onOpen 是「先设 courseId、再填 rules」，而 watcher 是异步触发的，
  // 不加这个标志，watcher 会在规则填好之后才跑，把刚回填的章节全清成 null。
  const filling = ref(false)

  // 换课程后，规则里挂的还是旧课程的章节ID，不清掉会存成跨课程的脏数据，
  // 抽题时那条规则一道题也抽不到
  watch(
    () => form.courseId,
    (val, old) => {
      loadChapterCount(val)
      if (!filling.value && val !== old) {
        rules.value.forEach((r) => (r.chapterId = null))
      }
    }
  )

  const ruleTotal = computed(() => {
    let count = 0
    let score = 0
    for (const r of rules.value) {
      count += r.questionCount || 0
      score += (r.questionCount || 0) * (r.scorePerQuestion || 0)
    }
    return { count, score }
  })

  const onOpen = async (item = null) => {
    visible.value = true
    filling.value = true
    if (item) {
      const res = await examApi.paperView(item.id)
      form.id = res.paper.id
      form.paperName = res.paper.paperName
      form.courseId = res.paper.courseId
      form.totalScore = res.paper.totalScore
      form.passScore = res.paper.passScore
      form.durationMinutes = res.paper.durationMinutes
      form.retakeLimit = res.paper.retakeLimit
      loadChapterCount(res.paper.courseId)
      rules.value = (res.rules || []).map((r) => ({
        categoryId: r.categoryId,
        chapterId: r.chapterId,
        questionType: r.questionType,
        questionCount: r.questionCount,
        scorePerQuestion: r.scorePerQuestion
      }))
      if (rules.value.length === 0) rules.value = [{ categoryId: null, chapterId: null, questionType: null, questionCount: 10, scorePerQuestion: 4 }]
    } else {
      form.id = null
      form.paperName = ''
      form.courseId = null
      form.totalScore = 100
      form.passScore = 80
      form.durationMinutes = 60
      form.retakeLimit = 1
      chapterCount.value = {}
      rules.value = [{ categoryId: null, chapterId: null, questionType: null, questionCount: 25, scorePerQuestion: 4 }]
    }
    // watcher 是 flush:'pre' 的异步回调，要等它跑完这一轮再解除屏蔽，
    // 否则解除得太早，回填的章节还是会被清掉
    await nextTick()
    filling.value = false
  }

  async function onSubmit() {
    await formRef.value.validate()
    if (ruleTotal.value.score !== form.totalScore) {
      ElMessage.warning(`组卷规则合计 ${ruleTotal.value.score} 分与总分 ${form.totalScore} 不一致，请调整`)
      return
    }
    const data = {
      ...form,
      courseId: form.courseId || null,
      rules: rules.value.map((r) => ({ ...r, categoryId: r.categoryId || null, chapterId: r.chapterId || null }))
    }
    loading.value = true
    try {
      if (form.id) {
        await examApi.paperUpdate(data)
      } else {
        await examApi.paperSave(data)
      }
      ElMessage.success('保存成功')
      visible.value = false
      emit('refresh')
    } finally {
      loading.value = false
    }
  }

  defineExpose({ onOpen })
</script>
<style scoped>
  .rule-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    color: #666;
  }
  .rule-tip {
    margin-top: 6px;
    font-size: 12px;
    color: #999;
  }
</style>
