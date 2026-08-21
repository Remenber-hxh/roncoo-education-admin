<template>
  <el-dialog :append-to-body="true" :model-value="visible" title="批量导入员工" width="min(760px, 94vw)" center align-center :destroy-on-close="true" :close-on-click-modal="false" @close="onClose">
    <div class="import-steps">
      <div class="step">
        <span class="step-no">1</span>
        <span>下载模板，按模板的列顺序填写</span>
        <el-button link type="primary" @click="downloadTemplate">下载导入模板</el-button>
      </div>
      <div class="step">
        <span class="step-no">2</span>
        <span>选择填好的文件上传</span>
      </div>
    </div>

    <el-alert type="info" :closable="false" class="import-tip">
      <div>· 工号必填、纯数字，是识别员工的唯一依据；已存在的工号会更新档案，不会重复建号</div>
      <div>· 手机号必填、11 位，同时是员工登录账号，<b>初始密码为手机号后 6 位</b></div>
      <div>· 班组、项目组要填字典里已有的名称，模板第二行列出了可选值</div>
      <div>· 入职日期可留空，<code>2023/6/12</code> 这样的文本和 Excel 日期格式都能识别</div>
      <div>· 模板第二行是填写说明，导入前请删掉</div>
    </el-alert>

    <el-upload
      ref="uploadRef"
      class="import-upload"
      drag
      accept=".xlsx,.xls"
      :auto-upload="false"
      :limit="1"
      :on-change="onFileChange"
      :on-exceed="onExceed"
      :file-list="fileList"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">把文件拖到这里，或<em>点击选择</em></div>
      <template #tip>
        <div class="el-upload__tip">只支持 .xlsx / .xls</div>
      </template>
    </el-upload>

    <!-- 导入结果 -->
    <div v-if="result" class="import-result">
      <el-alert :type="result.failedCount > 0 ? 'warning' : 'success'" :closable="false">
        共读到 {{ result.totalCount }} 行： 新建 {{ result.createdCount }} 人，更新 {{ result.updatedCount }} 人
        <b v-if="result.failedCount > 0">，失败 {{ result.failedCount }} 行</b>
      </el-alert>
      <el-table v-if="result.errors && result.errors.length" :data="result.errors" size="small" max-height="240" class="error-table">
        <el-table-column label="行号" prop="rowNum" width="70" align="center" />
        <el-table-column label="姓名" prop="nickname" width="100" />
        <el-table-column label="工号" prop="empNo" width="90" />
        <el-table-column label="失败原因" prop="reason" show-overflow-tooltip />
      </el-table>
      <div v-if="result.failedCount > 0" class="retry-tip">失败的行不影响其他行。在 Excel 里改好这些行后再导一次即可，已导入的不会重复建号。</div>
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
  import { usersApi } from '@/api/users'
  import { getToken } from '@/utils/cookie.js'

  const emit = defineEmits(['refresh'])
  const visible = ref(false)
  const loading = ref(false)
  const file = ref(null)
  const fileList = ref([])
  const result = ref(null)
  const uploadRef = ref()

  // 模板下载走 fetch 而不是 <a href>：接口要带 token，
  // 直接开链接会因为没有请求头被判未登录
  const downloadTemplate = async () => {
    try {
      const res = await fetch('/gateway/user/admin/users/import/template', {
        headers: { token: getToken() || '' }
      })
      if (!res.ok) {
        ElMessage.error('模板下载失败：' + res.status)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '员工导入模板.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      ElMessage.error('模板下载失败：' + e.message)
    }
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
      const res = await usersApi.usersImport(formData)
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

  const onOpen = () => {
    file.value = null
    fileList.value = []
    result.value = null
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
  }
  .import-tip {
    margin-bottom: 12px;
    :deep(.el-alert__content) {
      line-height: 22px;
      font-size: 12px;
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
