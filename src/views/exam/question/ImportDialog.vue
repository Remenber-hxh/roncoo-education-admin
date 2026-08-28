<template>
  <el-dialog :append-to-body="true" :model-value="visible" title="批量导入题目" width="min(820px, 94vw)" center align-center :destroy-on-close="true" :close-on-click-modal="false" @close="onClose">
    <div class="import-steps">
      <div class="step">
        <span class="step-no">1</span>
        <span>拿一份带表头的文件</span>
        <el-button link type="primary" @click="downloadTemplate">下载空模板</el-button>
        <span class="or">或</span>
        <el-button link type="primary" @click="exportExisting">导出现有题目</el-button>
      </div>
      <div class="step">
        <span class="step-no">2</span>
        <span>在 Excel 里填好或改好，再上传</span>
      </div>
    </div>

    <el-alert type="info" :closable="false" class="import-tip">
      <div>· <b>导出的文件就是导入格式</b>，改完直接导回来即可，不用另外整理</div>
      <div>· <b>ID 列留空 = 新增题目</b>；填了 ID = 修改那一道题。ID 由导出文件带出，不要手工编造</div>
      <div>· 题型填 <code>单选 / 多选 / 判断</code>；判断题的选项可以不填，会自动补成「正确 / 错误」</div>
      <div>· 正确答案：单选如 <code>A</code>，多选如 <code>A,C</code>，判断填 <code>正确</code> 或 <code>错误</code></div>
      <div>· 模块、课程、章节都填<b>名称</b>；填了章节必须先填课程（章节名在不同课程里会重复）</div>
      <div>· 模板第二行是填写说明，导入前请删掉</div>
    </el-alert>

    <el-upload
      ref="uploadRef"
      class="import-upload"
      drag
      accept=".xlsx"
      :auto-upload="false"
      :limit="1"
      :on-change="onFileChange"
      :on-exceed="onExceed"
      :file-list="fileList"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">把文件拖到这里，或<em>点击选择</em></div>
      <template #tip>
        <div class="el-upload__tip">只支持 .xlsx</div>
      </template>
    </el-upload>

    <!-- 导入结果 -->
    <div v-if="result" class="import-result">
      <el-alert :type="result.failedCount > 0 ? 'warning' : 'success'" :closable="false">
        共读到 {{ result.totalCount }} 行： 新增 {{ result.createdCount }} 道，更新 {{ result.updatedCount }} 道
        <b v-if="result.failedCount > 0">，失败 {{ result.failedCount }} 行</b>
      </el-alert>
      <el-table v-if="result.errors && result.errors.length" :data="result.errors" size="small" max-height="260" class="error-table">
        <el-table-column label="行号" prop="rowNum" width="70" align="center" />
        <el-table-column label="题干" prop="questionTitle" min-width="180" show-overflow-tooltip />
        <el-table-column label="失败原因" prop="reason" min-width="240" show-overflow-tooltip />
      </el-table>
      <div v-if="result.failedCount > 0" class="retry-tip">失败的行不影响其他行。在 Excel 里改好这些行后再导一次即可，带 ID 的行是更新，不会重复建题。</div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose()">关闭</el-button>
        <el-button type="primary" :loading="loading" :disabled="!file" @click="onSubmit()">开始导入</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
  import { ElMessage } from 'element-plus'
  import { ref } from 'vue'
  import { UploadFilled } from '@element-plus/icons-vue'
  import { examApi } from '@/api/exam'
  import { downloadFile } from '@/utils/download'

  const emit = defineEmits(['refresh'])
  const visible = ref(false)
  const loading = ref(false)
  const file = ref(null)
  const fileList = ref([])
  const result = ref(null)
  const uploadRef = ref()
  // 打开弹窗时由列表页传进来，导出跟着当前筛选走
  const filter = ref({})

  const downloadTemplate = () => {
    downloadFile('/gateway/course/admin/exam/question/import/template', '题库导入模板.xlsx')
  }

  const exportExisting = () => {
    downloadFile('/gateway/course/admin/exam/question/export', '题库导出.xlsx', filter.value)
  }

  const onFileChange = (uploadFile) => {
    file.value = uploadFile.raw
    fileList.value = [uploadFile]
    // 换了文件就把上一次的结果清掉，避免看着旧结果以为是新的
    result.value = null
  }

  const onExceed = (files) => {
    uploadRef.value.clearFiles()
    const f = files[0]
    uploadRef.value.handleStart(f)
    file.value = f
    result.value = null
  }

  const onSubmit = async () => {
    if (!file.value) {
      ElMessage.warning('请先选择文件')
      return
    }
    loading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file.value)
      const res = await examApi.questionImport(formData)
      result.value = res
      if (res.failedCount > 0) {
        ElMessage.warning(`导入完成，有 ${res.failedCount} 行失败`)
      } else {
        ElMessage.success('全部导入成功')
      }
      emit('refresh')
    } finally {
      loading.value = false
    }
  }

  const onOpen = (currentFilter = {}) => {
    file.value = null
    fileList.value = []
    result.value = null
    filter.value = { ...currentFilter }
    visible.value = true
  }
  defineExpose({ onOpen })
  const onClose = () => {
    visible.value = false
  }
</script>

<style lang="scss" scoped>
  .import-steps {
    margin-bottom: 12px;
    .step {
      display: flex;
      align-items: center;
      gap: 8px;
      line-height: 30px;
      color: #606266;
    }
    .step-no {
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      border-radius: 50%;
      background: #409eff;
      color: #fff;
      font-size: 12px;
    }
    .or {
      color: #c0c4cc;
    }
  }
  .import-tip {
    margin-bottom: 12px;
    :deep(.el-alert__content) {
      line-height: 22px;
      font-size: 12px;
    }
    code {
      padding: 0 4px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 3px;
    }
  }
  .import-upload {
    :deep(.el-upload-dragger) {
      padding: 20px;
    }
  }
  .import-result {
    margin-top: 16px;
    .error-table {
      margin-top: 10px;
    }
    .retry-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
    }
  }
</style>
