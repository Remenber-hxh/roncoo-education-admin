<template>
  <el-dialog :append-to-body="true" :model-value="visible" title="员工档案" width="min(560px, 92vw)" center align-center :destroy-on-close="true" @close="onClose">
    <el-form ref="formRef" :model="formModel" :rules="rules" label-width="90px" @submit.prevent>
      <el-form-item label="员工">
        <span class="readonly-text">{{ formModel.nickname }}（{{ formModel.mobile }}）</span>
      </el-form-item>
      <el-form-item label="工号" prop="empNo">
        <el-input v-model="formModel.empNo" maxlength="64" placeholder="纯数字，如 16" />
        <span class="form-tip">公司工号为纯数字流水号，不要求连续，但不能与他人重复</span>
      </el-form-item>
      <el-form-item label="班组" prop="teamId">
        <el-select v-model="formModel.teamId" placeholder="请选择班组" clearable style="width: 100%">
          <el-option v-for="t in teamList" :key="t.id" :label="t.teamName" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="岗位职务" prop="position">
        <el-input v-model="formModel.position" maxlength="64" placeholder="如：强电技工" />
      </el-form-item>
      <el-form-item label="入职日期" prop="hireDate">
        <el-date-picker v-model="formModel.hireDate" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" placeholder="请选择入职日期" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose()">取消</el-button>
        <el-button type="primary" @click="onSubmit()">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
  import { ElMessage } from 'element-plus'
  import { reactive, ref } from 'vue'
  import { usersApi } from '@/api/users'

  const formRef = ref()
  const rules = {
    // 与后端一致：只校验纯数字，不校验位数和连续性
    empNo: [{ pattern: /^\d*$/, message: '工号只能是数字', trigger: 'blur' }]
  }

  const emit = defineEmits(['refresh'])
  const loading = ref(false)
  const teamList = ref([])
  const formDefault = {
    id: undefined,
    nickname: '',
    mobile: '',
    empNo: undefined,
    teamId: undefined,
    position: undefined,
    hireDate: undefined
  }
  const formModel = reactive({ ...formDefault })

  const onSubmit = async () => {
    const valid = await formRef.value.validate()
    if (!valid) return
    if (loading.value === true) {
      ElMessage.warning('正在处理...')
      return
    }
    loading.value = true
    try {
      await usersApi.usersProfileEdit({
        id: formModel.id,
        empNo: formModel.empNo,
        teamId: formModel.teamId,
        position: formModel.position,
        hireDate: formModel.hireDate
      })
      ElMessage.success('保存成功')
      emit('refresh')
      onClose()
    } finally {
      loading.value = false
    }
  }

  const visible = ref(false)
  const onOpen = (item) => {
    // 班组下拉每次打开都取一次，避免管理员刚加完班组还看不到
    usersApi.teamList().then((res) => {
      teamList.value = res || []
    })
    if (item) Object.assign(formModel, formDefault, item)
    visible.value = true
  }
  defineExpose({ onOpen })
  const onClose = () => {
    Object.assign(formModel, formDefault)
    visible.value = false
  }
</script>

<style lang="scss" scoped>
  .form-tip {
    color: #909399;
    font-size: 12px;
    line-height: 18px;
  }
  .readonly-text {
    color: #606266;
  }
</style>
