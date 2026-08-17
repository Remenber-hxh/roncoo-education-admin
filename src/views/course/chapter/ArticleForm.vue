<template>
  <el-dialog
    :append-to-body="true"
    :model-value="visible"
    :title="formModel.id ? '编辑图文课时' : '添加图文课时'"
    width="900px"
    top="5vh"
    :destroy-on-close="true"
    @close="onClose"
  >
    <el-form ref="formRef" :model="formModel" :rules="rules" label-width="110px" @submit.prevent>
      <el-form-item label="课时名称" prop="periodName">
        <el-input v-model="formModel.periodName" maxlength="100" show-word-limit placeholder="如：企业文化与组织架构" />
      </el-form-item>

      <el-form-item label="正文内容" prop="content">
        <editor v-model="formModel.content" />
      </el-form-item>

      <el-form-item label="最短阅读时长">
        <el-input-number v-model="formModel.readSeconds" :min="0" :step="10" />
        <span class="tooltip">秒。员工需滚动到底<b>且</b>停留满该时长才算学完，填 0 表示只要读到底即可。防止一拉到底就刷完成。</span>
      </el-form-item>

      <el-form-item label="需签署确认">
        <el-switch v-model="formModel.needSign" :active-value="1" :inactive-value="0" />
        <span class="tooltip">开启后，员工读完需点击确认，系统记录签署时间与IP。员工手册、规章制度类内容建议开启。</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose()">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onSubmit()">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
  import { ElMessage } from 'element-plus'
  import { reactive, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { courseApi } from '@/api/course'
  import Editor from '@/components/Editor/index.vue'

  const route = useRoute()
  const emit = defineEmits(['refresh'])

  const formRef = ref()
  const rules = {
    periodName: [{ required: true, message: '不能为空', trigger: 'blur' }],
    content: [{ required: true, message: '正文不能为空', trigger: 'blur' }]
  }

  const loading = ref(false)
  const visible = ref(false)

  const formDefault = {
    id: undefined,
    chapterId: undefined,
    courseId: undefined,
    periodName: undefined,
    content: '',
    readSeconds: 0,
    needSign: 0,
    // 图文课时类型，与后端 PeriodTypeEnum.ARTICLE 对应
    periodType: 30
  }
  const formModel = reactive({ ...formDefault })

  const onSubmit = async () => {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    if (loading.value) {
      ElMessage.warning('正在处理···')
      return
    }
    loading.value = true
    try {
      if (formModel.id) {
        await courseApi.courseChapterPeriodEdit(formModel)
        ElMessage.success('修改成功')
      } else {
        await courseApi.courseChapterPeriodSave(formModel)
        ElMessage.success('添加成功')
      }
      emit('refresh')
      onClose()
    } finally {
      loading.value = false
    }
  }

  /**
   * @param item     编辑时传课时对象，新增时不传
   * @param chapterId 新增时所属章节
   */
  const onOpen = async (item, chapterId) => {
    Object.assign(formModel, formDefault)
    formModel.courseId = route.query.courseId
    formModel.chapterId = chapterId

    if (item && item.id) {
      // 列表接口出于性能考虑不返回正文（LONGTEXT），编辑时单独取
      const detail = await courseApi.courseChapterPeriodView({ id: item.id })
      formModel.id = detail.id
      formModel.chapterId = detail.chapterId
      formModel.periodName = detail.periodName
      formModel.content = detail.content || ''
      formModel.readSeconds = detail.readSeconds || 0
      formModel.needSign = detail.needSign || 0
    }
    visible.value = true
  }
  defineExpose({ onOpen })

  const onClose = () => {
    visible.value = false
    Object.assign(formModel, formDefault)
  }
</script>

<style lang="scss" scoped>
  .tooltip {
    margin-left: 12px;
    color: #999;
    font-size: 12px;
  }
</style>
