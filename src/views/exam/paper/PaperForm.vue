<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑试卷' : '添加试卷'" width="680px">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
      <el-form-item label="试卷名称" prop="paperName">
        <el-input v-model="form.paperName" />
      </el-form-item>
      <el-form-item label="关联课程ID" prop="courseId">
        <el-input v-model="form.courseId" placeholder="课程ID(员工从该课程进入考试)" style="width: 240px" />
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
            分类ID <el-input v-model="rule.categoryId" placeholder="空=全库" style="width: 100px" />
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
          <el-button size="small" @click="rules.push({ categoryId: null, questionType: null, questionCount: 10, scorePerQuestion: 4 })">+ 加规则</el-button>
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
  import { computed, reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { examApi } from '@/api/exam'

  const emit = defineEmits(['refresh'])
  const visible = ref(false)
  const loading = ref(false)
  const formRef = ref()

  const form = reactive({ id: null, paperName: '', courseId: null, totalScore: 100, passScore: 80, durationMinutes: 60, retakeLimit: 1 })
  const rules = ref([])

  const formRules = {
    paperName: [{ required: true, message: '请输入试卷名称', trigger: 'blur' }]
  }

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
    if (item) {
      const res = await examApi.paperView(item.id)
      form.id = res.paper.id
      form.paperName = res.paper.paperName
      form.courseId = res.paper.courseId
      form.totalScore = res.paper.totalScore
      form.passScore = res.paper.passScore
      form.durationMinutes = res.paper.durationMinutes
      form.retakeLimit = res.paper.retakeLimit
      rules.value = (res.rules || []).map((r) => ({
        categoryId: r.categoryId,
        questionType: r.questionType,
        questionCount: r.questionCount,
        scorePerQuestion: r.scorePerQuestion
      }))
      if (rules.value.length === 0) rules.value = [{ categoryId: null, questionType: null, questionCount: 10, scorePerQuestion: 4 }]
    } else {
      form.id = null
      form.paperName = ''
      form.courseId = null
      form.totalScore = 100
      form.passScore = 80
      form.durationMinutes = 60
      form.retakeLimit = 1
      rules.value = [{ categoryId: null, questionType: null, questionCount: 25, scorePerQuestion: 4 }]
    }
  }

  async function onSubmit() {
    await formRef.value.validate()
    if (ruleTotal.value.score !== form.totalScore) {
      ElMessage.warning(`组卷规则合计 ${ruleTotal.value.score} 分与总分 ${form.totalScore} 不一致，请调整`)
      return
    }
    const data = { ...form, courseId: form.courseId || null, rules: rules.value.map((r) => ({ ...r, categoryId: r.categoryId || null })) }
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
