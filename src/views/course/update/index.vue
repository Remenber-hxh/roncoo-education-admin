<template>
  <div class="form-container">
    <el-form ref="formRef" :model="formModel" :rules="rules" label-width="80px" style="max-width: 980px" @submit.prevent>
      <div class="form-main">
        <div class="form-main-title">基础信息</div>
        <div class="form-main-content">
          <el-form-item label="分类" prop="categoryId">
            <cascader-course v-model="formModel.categoryId"></cascader-course>
          </el-form-item>
          <el-form-item label="名称" prop="courseName">
            <el-input v-model="formModel.courseName" maxlength="125" show-word-limit></el-input>
          </el-form-item>
          <el-form-item label="讲师" prop="lecturerId">
            <el-input v-model="formModel.lecturerName" disabled style="width: 260px; margin-right: 20px"></el-input>
            <el-button type="primary" @click="lecturerSelect">选择讲师</el-button>
          </el-form-item>
          <el-form-item label="封面" prop="courseLogo">
            <selector-image v-model="formModel.courseLogo" :width="'270px'" :height="'150px'" :sug-img="'尺寸：900x500px，格式：JPG、PNG，大小：<2M'" />
          </el-form-item>
          <el-form-item label="简介" prop="introduce">
            <editor v-model="formModel.introduce" />
          </el-form-item>
        </div>
      </div>
      <div class="form-main">
        <div class="form-main-title">课程设置</div>
        <div class="form-main-content">
          <el-form-item class="form-group" label="倍速播放" prop="speedDouble">
            <enum-radio v-model="formModel.speedDouble" :enum-name="'SpeedDoubleEnum'" />
            <span class="tooltip">开启后，用户可在播放页面选择播放速度，默认为1倍速播放。 </span>
          </el-form-item>
          <el-form-item class="form-group" label="拖拽播放" prop="speedDrag">
            <enum-radio v-model="formModel.speedDrag" :enum-name="'SpeedDragEnum'" />
            <span class="tooltip">开启后，用户可在播放页面快速拖拽播放，关闭则无法进行拖拽播放。</span>
          </el-form-item>
          <el-form-item label="上架" prop="isPutaway">
            <enum-radio v-model="formModel.isPutaway" :enum-name="'PutawayEnum'" />
          </el-form-item>

          <el-divider content-position="left">自动排课</el-divider>
          <el-form-item class="form-group" label="推送时机" prop="pushDay">
            <el-input-number v-model="formModel.pushDay" :min="0" :max="365" controls-position="right" style="width: 130px" />
            <span class="tooltip">
              员工入职后第几天自动收到本课程。留空表示不自动推送，只能在「课程指派」里手工派。
              只对「自动排课生效起点」之后入职的员工生效，存量员工请手工指派。
            </span>
          </el-form-item>
          <el-form-item class="form-group" label="推送范围" prop="pushScope">
            <el-radio-group v-model="formModel.pushScope">
              <el-radio :value="1">全员</el-radio>
              <el-radio :value="2">指定班组</el-radio>
            </el-radio-group>
            <span class="tooltip">班组技能 SOP 类课程按班组分流，选「指定班组」。</span>
          </el-form-item>
          <el-form-item v-if="formModel.pushScope === 2" class="form-group" label="指定班组" prop="pushTeamIds">
            <el-select v-model="teamIdList" multiple clearable placeholder="请选择班组" style="width: 100%">
              <el-option v-for="t in teamOptions" :key="t.id" :label="t.teamName" :value="String(t.id)" />
            </el-select>
            <span class="tooltip">未选班组时不会推送给任何人——宁可漏派让管理员补，也好过推错人。</span>
          </el-form-item>
          <el-form-item class="form-group" label="完成期限" prop="deadlineDays">
            <el-input-number v-model="formModel.deadlineDays" :min="1" :max="365" controls-position="right" style="width: 130px" />
            <span class="tooltip">推送后多少天内需完成，用于自动计算截止日期。默认 7 天。</span>
          </el-form-item>
          <el-form-item class="form-group" label="顺序解锁" prop="needSequential">
            <el-radio-group v-model="formModel.needSequential">
              <el-radio :value="0">关闭</el-radio>
              <el-radio :value="1">开启</el-radio>
            </el-radio-group>
            <span class="tooltip">
              即需求里的「闯关」：开启后员工必须学完上一课时才能进入下一课时，跨章节同样连续。
            </span>
          </el-form-item>
        </div>
      </div>
    </el-form>
    <div class="form-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="onSubmit()">确定</el-button>
    </div>
  </div>
  <select-lecturer v-if="lecturer.visible" @close="handleLecturer" />
</template>
<script setup>
  import { ElMessage } from 'element-plus'
  import { onMounted, reactive, ref } from 'vue'
  import { courseApi } from '@/api/course'
  import { usersApi } from '@/api/users'
  import Editor from '@/components/Editor/index.vue'
  import SelectLecturer from '@/components/Selector/Lecturer/index.vue'
  import CascaderCourse from '@/components/Cascader/Course/index.vue'
  import EnumRadio from '@/components/Enum/Radio/index.vue'
  import { useRouter } from 'vue-router'
  import { useRoute } from 'vue-router/dist/vue-router'
  import SelectorImage from '@/components/Selector/Image/index.vue'

  const router = useRouter()

  // 讲师选择功能
  const lecturer = reactive({
    visible: false
  })
  const lecturerSelect = () => {
    lecturer.visible = true
  }
  const handleLecturer = (item) => {
    lecturer.visible = false
    if (item) {
      formModel.lecturerName = item.lecturerName
      formModel.lecturerId = item.lecturerId
    }
  }

  // 校验规则
  const formRef = ref()
  const rules = {
    categoryId: [{ required: true, message: '不能为空', trigger: 'blur' }],
    courseName: [{ required: true, message: '不能为空', trigger: 'blur' }],
    lecturerId: [{ required: true, message: '不能为空', trigger: 'blur' }],
    courseLogo: [{ required: true, message: '不能为空', trigger: 'blur' }]
  }

  // 表单
  const loading = ref(false) // 加载进度状态
  const emit = defineEmits(['refresh'])
  const formDefault = {
    id: undefined,
    categoryId: undefined,
    courseName: undefined,
    lecturerName: undefined,
    lecturerId: undefined,
    courseLogo: undefined,
    introduce: undefined,
    isPutaway: 1,
    speedDouble: 1,
    speedDrag: 1,
    // 自动排课。pushDay 默认 undefined = 不自动推送
    pushDay: undefined,
    pushScope: 1,
    pushTeamIds: undefined,
    deadlineDays: 7,
    needSequential: 0
  }
  const formModel = reactive({ ...formDefault })

  // 班组多选。后端存的是逗号分隔的字符串，这里用数组，提交前再拼回去
  const teamOptions = ref([])
  const teamIdList = ref([])

  const onSubmit = async () => {
    // 校验
    const valid = await formRef.value.validate()
    if (!valid) return

    // 只有选了「指定班组」才带上班组，避免改回「全员」后旧的班组还留在库里
    formModel.pushTeamIds = formModel.pushScope === 2 ? teamIdList.value.join(',') : ''

    if (loading.value === true) {
      ElMessage.warning('正在处理···')
      return
    }
    loading.value = true
    try {
      if (formModel.id) {
        await courseApi.courseEdit(formModel)
        ElMessage.success('修改成功')
      } else {
        await courseApi.courseSave(formModel)
        ElMessage.success('添加成功')
      }
      handleClose()
      emit('refresh')
    } finally {
      loading.value = false
    }
  }
  // 初始化
  const route = useRoute()
  onMounted(async () => {
    // 班组下拉。放在课程数据之前取，回填时才有选项可选
    try {
      teamOptions.value = (await usersApi.teamList()) || []
    } catch (e) {
      // 取不到班组不该挡住整个编辑页，"指定班组"那栏会是空的
    }

    if (route.query.courseId) {
      const res = await courseApi.courseView({ id: route.query.courseId })
      Object.assign(formModel, res)
      // 逗号分隔的字符串回填成数组。ID 是雪花号，后端按字符串下发，
      // 这里统一转成字符串，否则 el-select 的选项匹配不上
      teamIdList.value = formModel.pushTeamIds
        ? String(formModel.pushTeamIds).split(',').filter(Boolean).map(String)
        : []
    } else {
      Object.assign(formModel, formDefault)
      teamIdList.value = []
    }
  })
  const handleClose = () => {
    router.go(-1)
  }
</script>
<style lang="scss" scoped>
  .form-main-title {
    width: 120px;
  }

  .form-main-content {
    margin-left: 100px;
    padding-bottom: 60px;
  }

  .form-footer {
    text-align: center;
    width: calc(100% - 260px);
    position: fixed;
    height: 30px;
    display: flex;
    bottom: 0px;
    border-radius: 4px;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    padding: 20px;
    border-top: 1px solid #ebeef5;
    border-bottom: 10px solid #f2f3f5;
    margin-left: -20px;
    z-index: 9;
  }

  .tooltip {
    margin-left: 20px;
    color: #999;
  }
</style>
