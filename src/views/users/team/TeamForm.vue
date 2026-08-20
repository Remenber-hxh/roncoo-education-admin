<template>
  <el-dialog :append-to-body="true" :model-value="visible" :title="formModel.id ? '修改班组' : '添加班组'" width="min(600px, 92vw)" center align-center :destroy-on-close="true" @close="onClose">
    <el-form ref="formRef" :model="formModel" :rules="rules" label-width="90px" @submit.prevent>
      <el-form-item label="班组名称" prop="teamName">
        <el-input v-model="formModel.teamName" maxlength="64" show-word-limit placeholder="如：强电组" />
      </el-form-item>
      <el-form-item label="职责范围" prop="remark">
        <el-input v-model="formModel.remark" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="如：高低压配电、发电机组、变压器、配电室值班" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formModel.sort" :min="0" />
        <span class="form-tip">数字越小越靠前</span>
      </el-form-item>
      <el-form-item label="状态" prop="statusId">
        <el-radio-group v-model="formModel.statusId">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">停用</el-radio>
        </el-radio-group>
        <!-- 停用只是不再出现在下拉里，已经分到这个班组的人不受影响 -->
        <span class="form-tip">停用后不再出现在员工档案的班组下拉中，已分配的员工不受影响</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose()">取消</el-button>
        <el-button type="primary" @click="onSubmit()">确定</el-button>
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
    teamName: [
      { required: true, message: '班组名称不能为空', trigger: 'blur' },
      { max: 64, message: '不能超过64个字符', trigger: 'blur' }
    ]
  }

  const emit = defineEmits(['refresh'])
  const loading = ref(false)
  const formDefault = {
    id: undefined,
    teamName: undefined,
    remark: undefined,
    sort: 0,
    statusId: 1
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
      if (formModel.id) {
        await usersApi.teamEdit(formModel)
        ElMessage.success('修改成功')
      } else {
        await usersApi.teamSave(formModel)
        ElMessage.success('添加成功')
      }
      emit('refresh')
      onClose()
    } finally {
      loading.value = false
    }
  }

  const visible = ref(false)
  const onOpen = (item) => {
    if (item) {
      usersApi.teamView({ id: item.id }).then((res) => {
        Object.assign(formModel, res)
      })
    }
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
    margin-left: 12px;
    color: #909399;
    font-size: 12px;
  }
</style>
