<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline>
          <el-form-item label="课程">
            <course-select v-model="query.courseId" placeholder="全部课程" width="180px" @change="onCourseChange" />
          </el-form-item>
          <el-form-item label="章节">
            <chapter-select v-model="query.chapterId" :course-id="query.courseId" placeholder="全部章节" width="180px" @change="handleQuery" />
          </el-form-item>
          <el-form-item label="题型">
            <el-select v-model="query.questionType" clearable placeholder="全部" style="width: 120px">
              <el-option :value="1" label="单选" />
              <el-option :value="2" label="多选" />
              <el-option :value="3" label="判断" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="query.keyword" clearable placeholder="题干关键词" style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
            <el-button type="primary" @click="openFormModal()">添加题目</el-button>
            <el-button @click="openImport()">批量导入</el-button>
            <el-button :loading="exporting" @click="handleExport()">导出</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <el-table v-loading="page.loading" :data="page.list">
      <el-table-column label="题干" min-width="260" prop="questionTitle" show-overflow-tooltip />
      <el-table-column :width="150" label="所属章节">
        <template #default="scope">
          <span v-if="scope.row.chapterId">{{ chapterNameMap[String(scope.row.chapterId)] || '章节' + scope.row.chapterId }}</span>
          <span v-else class="text-weak">不限</span>
        </template>
      </el-table-column>
      <el-table-column :width="80" align="center" label="题型">
        <template #default="scope">
          <el-tag size="small">{{ { 1: '单选', 2: '多选', 3: '判断' }[scope.row.questionType] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="100" align="center" label="正确答案" prop="correctAnswer" />
      <el-table-column :width="80" align="center" label="难度">
        <template #default="scope">{{ { 1: '易', 2: '中', 3: '难' }[scope.row.difficulty] || '易' }}</template>
      </el-table-column>
      <el-table-column :width="90" align="center" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.statusId === 1 ? 'success' : 'danger'" size="small">{{ scope.row.statusId === 1 ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="160" fixed="right" label="操作">
        <template #default="scope">
          <el-button text type="primary" @click="openFormModal(scope.row)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-button text type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-model:current-page="page.pageCurrent" v-model:page-size="page.pageSize" :total="page.totalCount" @pagination="handlePage" />
    <question-form ref="formRef" @refresh="handlePage" />
    <import-dialog ref="importRef" @refresh="handlePage" />
  </div>
</template>
<script setup>
  import useTable from '@/utils/table'
  import { ref } from 'vue'
  import { examApi } from '@/api/exam'
  import Pagination from '@/components/Pagination/index.vue'
  import QuestionForm from './QuestionForm.vue'
  import ImportDialog from './ImportDialog.vue'
  import CourseSelect from '@/components/Selector/CourseSelect/index.vue'
  import ChapterSelect from '@/components/Selector/ChapterSelect/index.vue'
  import { courseApi } from '@/api/course'
  import { downloadFile } from '@/utils/download'
  import { ElMessage } from 'element-plus'

  // 列表只拿得到 chapterId，要显示章节名得自己查一次映射
  const chapterNameMap = ref({})
  async function loadChapterNames(courseId) {
    if (!courseId) {
      chapterNameMap.value = {}
      return
    }
    const res = await courseApi.courseChapterList({ courseId, pageCurrent: 1, pageSize: 200 })
    const map = {}
    ;((res && res.list) || res || []).forEach((c) => (map[String(c.id)] = c.chapterName))
    chapterNameMap.value = map
  }

  function onCourseChange(val) {
    loadChapterNames(val)
    handleQuery()
  }

  const formRef = ref()
  const openFormModal = (item = null) => {
    formRef.value.onOpen(item)
  }

  const { page, handlePage, handleQuery, query, resetQuery, handleDelete } = useTable({
    page: examApi.questionPage,
    delete: examApi.questionDelete
  })

  // 导入导出共用当前的筛选条件：导出什么，改完就导回什么，
  // 不会一按导出就把整个题库拉下来
  const currentFilter = () => ({
    courseId: query.courseId,
    chapterId: query.chapterId,
    questionType: query.questionType,
    keyword: query.keyword
  })

  const importRef = ref()
  const openImport = () => {
    importRef.value.onOpen(currentFilter())
  }

  const exporting = ref(false)
  const handleExport = async () => {
    if (page.totalCount === 0) {
      ElMessage.warning('当前筛选条件下没有题目')
      return
    }
    exporting.value = true
    try {
      await downloadFile('/gateway/course/admin/exam/question/export', '题库导出.xlsx', currentFilter())
    } finally {
      exporting.value = false
    }
  }
</script>
<style lang="scss" scoped>
  .text-weak {
    color: #c0c4cc;
  }
</style>
