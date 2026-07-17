<template>
  <el-dialog v-model="visible" :title="form.id ? '编辑题目' : '添加题目'" width="640px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="题型" prop="questionType">
        <el-radio-group v-model="form.questionType" @change="onTypeChange">
          <el-radio :label="1">单选</el-radio>
          <el-radio :label="2">多选</el-radio>
          <el-radio :label="3">判断</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="题干" prop="questionTitle">
        <el-input v-model="form.questionTitle" :rows="2" type="textarea" />
      </el-form-item>
      <el-form-item label="选项">
        <div v-for="(opt, index) in options" :key="index" class="opt-row">
          <span class="opt-key">{{ opt.key }}.</span>
          <el-input v-model="opt.value" placeholder="选项内容" style="width: 380px" />
          <el-checkbox v-if="form.questionType === 2" v-model="opt.correct" style="margin-left: 10px">正确</el-checkbox>
          <el-radio v-else v-model="singleCorrect" :label="opt.key" style="margin-left: 10px">正确</el-radio>
          <el-button v-if="options.length > 2" text type="danger" @click="options.splice(index, 1); refreshKeys()">删</el-button>
        </div>
        <el-button v-if="options.length < 6" size="small" @click="addOption">+ 加选项</el-button>
      </el-form-item>
      <el-form-item label="解析">
        <el-input v-model="form.analysis" :rows="2" placeholder="错题时展示给员工" type="textarea" />
      </el-form-item>
      <el-form-item label="难度">
        <el-select v-model="form.difficulty" style="width: 120px">
          <el-option :value="1" label="易" />
          <el-option :value="2" label="中" />
          <el-option :value="3" label="难" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属分类">
        <el-input v-model="form.categoryId" placeholder="分类ID(选填,组卷按分类抽题)" style="width: 220px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button :loading="loading" type="primary" @click="onSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
  import { reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { examApi } from '@/api/exam'

  const emit = defineEmits(['refresh'])
  const visible = ref(false)
  const loading = ref(false)
  const formRef = ref()
  const KEYS = ['A', 'B', 'C', 'D', 'E', 'F']

  const form = reactive({ id: null, questionType: 1, questionTitle: '', analysis: '', difficulty: 1, categoryId: null })
  const options = ref([])
  const singleCorrect = ref('A')

  const rules = {
    questionType: [{ required: true, message: '请选择题型' }],
    questionTitle: [{ required: true, message: '请输入题干', trigger: 'blur' }]
  }

  const defaultOptions = () => [
    { key: 'A', value: '', correct: false },
    { key: 'B', value: '', correct: false },
    { key: 'C', value: '', correct: false },
    { key: 'D', value: '', correct: false }
  ]

  function onTypeChange() {
    if (form.questionType === 3) {
      options.value = [
        { key: 'A', value: '正确', correct: false },
        { key: 'B', value: '错误', correct: false }
      ]
    } else if (options.value.length < 3) {
      options.value = defaultOptions()
    }
    singleCorrect.value = 'A'
  }

  function addOption() {
    options.value.push({ key: KEYS[options.value.length], value: '', correct: false })
  }

  function refreshKeys() {
    options.value.forEach((o, i) => (o.key = KEYS[i]))
  }

  const onOpen = (item = null) => {
    visible.value = true
    if (item) {
      form.id = item.id
      form.questionType = item.questionType
      form.questionTitle = item.questionTitle
      form.analysis = item.analysis
      form.difficulty = item.difficulty || 1
      form.categoryId = item.categoryId
      try {
        const opts = JSON.parse(item.optionsJson || '[]')
        const corrects = (item.correctAnswer || '').split(',')
        options.value = opts.map((o) => ({ key: o.key, value: o.value, correct: corrects.includes(o.key) }))
        singleCorrect.value = corrects[0] || 'A'
      } catch (e) {
        options.value = defaultOptions()
      }
    } else {
      form.id = null
      form.questionTitle = ''
      form.analysis = ''
      form.difficulty = 1
      form.categoryId = null
      form.questionType = 1
      options.value = defaultOptions()
      singleCorrect.value = 'A'
    }
  }

  async function onSubmit() {
    await formRef.value.validate()
    const filled = options.value.filter((o) => o.value !== '')
    if (filled.length < 2) {
      ElMessage.error('至少填写两个选项')
      return
    }
    const correctAnswer = form.questionType === 2 ? filled.filter((o) => o.correct).map((o) => o.key).join(',') : singleCorrect.value
    if (!correctAnswer) {
      ElMessage.error('请勾选正确答案')
      return
    }
    const data = {
      ...form,
      categoryId: form.categoryId || null,
      optionsJson: JSON.stringify(filled.map((o) => ({ key: o.key, value: o.value }))),
      correctAnswer
    }
    loading.value = true
    try {
      if (form.id) {
        await examApi.questionUpdate(data)
      } else {
        await examApi.questionSave(data)
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
  .opt-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    width: 100%;
  }
  .opt-key {
    width: 22px;
    font-weight: 600;
  }
</style>
