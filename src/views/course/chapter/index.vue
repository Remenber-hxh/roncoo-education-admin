<template>
  <div class="app-container">
    <div class="container-header">
      <div class="header-info">
        <img :src="currentCourseInfo.courseLogo" :alt="currentCourseInfo.courseName" style="height: 120px; width: auto; border-radius: 10px" />
        <div class="info">
          <div class="info-title">{{ currentCourseInfo.courseName }}</div>
          <div class="info-name">讲师：{{ currentCourseInfo.lecturerName }}</div>
        </div>
      </div>
      <div class="header-button">
        <el-button v-permission="'course:edit'" link type="primary" @click="toCourseUpdate()">编辑</el-button>
      </div>
    </div>
    <div class="tips">章只有一个时，前台不显示章，只显示小节</div>
    <div class="container-main">
      <!-- 目录 -->
      <chapter v-if="currentChapterInfo.id" :tree-data="treeData" :chapter-id="currentChapterInfo.id" @node-click="handleChapterClick" @refresh="handleChapterList" />
      <div class="main-table">
        <el-table v-loading="loading" :data="periodList">
          <el-table-column align="left" :min-width="300">
            <template #header>
              <div class="table-header">
                {{ currentChapterInfo.chapterName }}
              </div>
            </template>
            <template #default="scope">
              <div class="table-default">
                <span>{{ scope.$index + 1 }}. </span>
                <!-- 图文课时没有关联资源，正文存在课时自身上，单独渲染 -->
                <span v-if="scope.row.periodType === 30">
                  <el-tag class="table-default-tag" effect="plain" type="success">图文</el-tag>
                  <span>{{ scope.row.periodName }}</span>
                  <el-tag v-if="scope.row.needSign === 1" class="table-default-tag" effect="plain" type="warning" style="margin-left: 8px">需签署</el-tag>
                  <span v-if="scope.row.readSeconds > 0" style="color: #999; margin-left: 8px">最短阅读 {{ scope.row.readSeconds }} 秒</span>
                </span>
                <span v-else-if="scope.row.resourceViewResp">
                  <el-tag class="table-default-tag" effect="plain"><enum-view :enum-name="'ResourceTypeEnum'" :enum-value="scope.row.resourceViewResp.resourceType" /> </el-tag>
                  <span>
                    <span>{{ scope.row.periodName }}</span>
                    <el-image
                      v-if="scope.row.resourceViewResp.resourceType === 4"
                      :src="scope.row.resourceViewResp.resourceUrl"
                      :preview-src-list="[scope.row.resourceViewResp.resourceUrl]"
                      preview-teleported
                      style="height: 50px; width: auto; vertical-align: middle; margin-left: 10px"
                    />
                  </span>
                  <span v-if="scope.row.resourceViewResp.resourceType < 3"> 【{{ formatTime(scope.row.resourceViewResp.videoLength) }}】</span>
                  <span v-if="scope.row.resourceViewResp.resourceType === 3"> 【{{ scope.row.resourceViewResp.docPage }} 页】</span>
                </span>
                <span v-if="scope.row.liveViewResp">
                  <el-tag class="table-default-tag" effect="plain"><enum-view :enum-name="'PeriodTypeEnum'" :enum-value="scope.row.periodType" /> </el-tag>
                  <span>{{ scope.row.periodName }}</span>
                  <div style="margin-top: 10px; margin-left: 80px">
                    主讲人：{{ scope.row.liveViewResp.lecturerName }}&nbsp;&nbsp;|&nbsp;
                    <span>直播状态：<enum-view :enum-name="'LiveStatusEnum'" :enum-value="scope.row.liveViewResp.liveStatus" /></span>
                    <span v-if="scope.row.liveViewResp.liveStatus === 1">&nbsp;&nbsp;|&nbsp;开播时间：{{ scope.row.liveViewResp.beginTime }}</span>
                  </div>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column align="right">
            <template #header>
              <div>
                <el-button @click="resourceSelect">添加资源</el-button>
                <el-button type="primary" @click="openArticleModal()">添加图文</el-button>
              </div>
            </template>
            <template #default="scope">
              <el-button v-if="scope.row.periodType === 30" text type="primary" @click="openArticleModal(scope.row)">编辑图文</el-button>
              <el-button v-else-if="scope.row.periodType === 10" text type="primary" @click="openFormPeriodModal(scope.row)">编辑</el-button>
              <el-divider direction="vertical" />
              <el-button text type="primary" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
  <select-resource v-if="period.visible" :visible="period.visible" @close="handleResource" />
  <period-form ref="periodFormRef" @refresh="handleChapterList" />
  <article-form ref="articleFormRef" @refresh="handleArticleRefresh" />
</template>
<script setup>
  import { onMounted, ref } from 'vue'
  import { courseApi } from '@/api/course'
  import PeriodForm from './PeriodForm.vue'
  import ArticleForm from './ArticleForm.vue'
  import { useRoute } from 'vue-router/dist/vue-router'
  import EnumView from '@/components/Enum/View/index.vue'
  import Chapter from './Chapter.vue'
  import { useRouter } from 'vue-router'
  import { formatTime } from '@/utils/base.js'
  import SelectResource from '@/components/Selector/Resource/index.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import Sortable from 'sortablejs'

  const router = useRouter()
  const route = useRoute()
  const currentCourseInfo = ref({})
  const currentChapterInfo = ref({})

  onMounted(() => {
    // 课程信息
    handleCourseInfo()
    // 章节信息
    handleChapterList()
  })

  // 课时信息
  const period = ref({
    visible: false,
    courseId: route.query.courseId,
    chapterId: ''
  })
  // 选择资源
  const resourceSelect = () => {
    period.value.visible = true
  }
  // 添加资源
  const handleResource = async (item) => {
    period.value.visible = false
    if (item) {
      period.value.periodName = item.resourceName
      period.value.resourceId = item.id
      period.value.chapterId = currentChapterInfo.value.id
      period.value.periodType = 10
      await courseApi.courseChapterPeriodSave(period.value)
      ElMessage.success('添加成功')
    }
    // 列出
    handlePeriodList(currentChapterInfo.value.id)
  }

  //章点击回调
  const handleChapterClick = (item) => {
    currentChapterInfo.value = item
    handlePeriodList(item.id)
  }

  // 课程信息
  const handleCourseInfo = async () => {
    currentCourseInfo.value = await courseApi.courseView({ id: route.query.courseId })
  }

  // 章节课时列出
  const loading = ref(false)
  const treeData = ref()
  const handleChapterList = async () => {
    const res = await courseApi.courseChapterList({ courseId: route.query.courseId })
    treeData.value = res
    if (res && res.length > 0) {
      currentChapterInfo.value = res[0]
      handlePeriodList(res[0].id)
    }
  }

  // 课时列出
  const periodList = ref([])
  const handlePeriodList = (chapterId) => {
    loading.value = true
    courseApi.courseChapterPeriodList({ chapterId: chapterId }).then((res) => {
      periodList.value = res
      loading.value = false
      handlePeriodSort()
    })
  }

  // 课时修改
  const periodFormRef = ref()
  const openFormPeriodModal = (item) => {
    periodFormRef.value.onOpen(item)
  }

  // 图文课时（二开新增）：不传 item 为新增，传了为编辑
  const articleFormRef = ref()
  const openArticleModal = (item) => {
    if (!item && !currentChapterInfo.value?.id) {
      ElMessage.warning('请先选择左侧的章节')
      return
    }
    articleFormRef.value.onOpen(item, currentChapterInfo.value.id)
  }
  const handleArticleRefresh = () => {
    handlePeriodList(currentChapterInfo.value.id)
  }

  // 课时删除
  const handleDelete = (item) => {
    ElMessageBox.confirm('确定删除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      courseApi.courseChapterPeriodDelete(item).then((res) => {
        ElMessage.success(res)
        periodList.value = []
        handlePeriodList(currentChapterInfo.value.id)
      })
    })
  }

  // 课程修改
  const toCourseUpdate = () => {
    router.push({ path: '/course/update', query: { courseId: route.query.courseId } })
  }

  const handlePeriodSort = () => {
    const tbody = document.querySelector('.el-table__body-wrapper tbody')
    Sortable.create(tbody, {
      onEnd: ({ newIndex, oldIndex }) => {
        const newRow = JSON.parse(JSON.stringify(periodList.value[0]))
        const currRow = periodList.value.splice(oldIndex, 1)[0]
        periodList.value.splice(newIndex, 0, currRow)
        let i = 0
        periodList.value.forEach((el) => {
          el.sort = newRow.sort - i
          i++
        })
        const periods = periodList.value.map((el, i) => {
          return {
            id: el.id,
            sort: i + 1
          }
        })
        courseApi.courseChapterPeriodSort(periods).then(() => {
          ElMessage.success('排序完成')
          periodList.value = []
          handlePeriodList(currentChapterInfo.value.id)
        })
      }
    })
  }
</script>
<style lang="scss" scoped>
  .container-header {
    display: flex;
    justify-content: space-between;
    .header-info {
      display: flex;
      .info {
        margin-left: 20px;
        line-height: 30px;
        .info-name {
          color: #999;
        }
      }
    }

    .header-button {
      float: right;
    }
  }

  .container-main {
    display: flex;
    .main-table {
      width: calc(100% - 250px);
      min-height: 400px;
    }

    .table-default-tag {
      margin: 0 10px;
    }
  }

  .tips {
    padding: 10px 15px;
    background: rgba(61, 127, 255, 0.1);
    border: 1px solid rgba(61, 127, 255, 0.6);
    color: #666;
    border-radius: 4px;
    margin: 20px 0;
    font-size: 14px;
  }
  .is-free {
    color: #ff0000;
    font-weight: bold;
    font-size: 12px;
    margin-left: 5px;
  }
</style>
