<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline label-width="80px">
          <el-form-item>
            <el-input v-model="query.groupName" placeholder="请输入项目组名称" prefix-icon="Search" clearable @keyup.enter="handleQuery()" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.statusId" placeholder="状态" clearable style="width: 120px">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery()">查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="button_bar">
        <el-button v-permission="'projectGroup:save'" type="primary" @click="openFormModal()">添加项目组</el-button>
      </div>
    </div>
    <el-table v-loading="page.loading" :data="page.list" row-key="id">
      <el-table-column label="项目组名称" prop="groupName" min-width="120" />
      <el-table-column label="职责范围" prop="remark" min-width="240" show-overflow-tooltip />
      <el-table-column label="在册人数" align="center" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.userCount > 0" type="info">{{ scope.row.userCount }} 人</el-tag>
          <span v-else class="empty-count">0 人</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" align="center" width="80" />
      <el-table-column label="状态" align="center" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.statusId === 1 ? 'success' : 'info'">{{ scope.row.statusId === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :width="210" fixed="right" label="操作">
        <template #default="scope">
          <el-button v-permission="'projectGroup:edit'" text type="primary" @click="openFormModal(scope.row)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-dropdown>
            <el-button text type="primary">
              更多操作
              <el-icon class="el-icon--right">
                <arrow-down />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleToggleStatus(scope.row)">
                  <el-button v-permission="'projectGroup:edit'" text type="primary">{{ scope.row.statusId === 1 ? '停用' : '启用' }}</el-button>
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-button v-permission="'projectGroup:delete'" text type="primary" @click="handleDeleteGroup(scope.row)">删除</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-model:current-page="page.pageCurrent" v-model:page-size="page.pageSize" :total="page.totalCount" @pagination="handlePage" />
    <project-group-form ref="formRef" @refresh="handlePage" />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import useTable from '@/utils/table'
  import { usersApi } from '@/api/users'
  import ProjectGroupForm from './ProjectGroupForm.vue'
  import Pagination from '@/components/Pagination/index.vue'
  import { ArrowDown } from '@element-plus/icons-vue'

  const formRef = ref()
  const openFormModal = (item) => {
    formRef.value.onOpen(item)
  }

  const { page, handlePage, query, handleQuery, resetQuery, handleDelete } = useTable({
    page: usersApi.projectGroupPage,
    delete: usersApi.projectGroupDelete
  })

  // 删除前把人数带进提示里。后端还会再拦一次，
  // 这里只是让管理员点之前就知道会不会被拒。
  const handleDeleteGroup = (row) => {
    const tip = row.userCount > 0 ? `「${row.groupName}」下还有 ${row.userCount} 名员工，需先调整这些员工的项目组才能删除。` : `确认删除项目组「${row.groupName}」?`
    handleDelete(row, tip)
  }

  // 不能复用 useTable 的 handleStatus：它只发 { id, statusId }，
  // 而修改接口要求项目组名称非空，会被参数校验挡回来。
  const handleToggleStatus = async (row) => {
    const target = row.statusId === 1 ? 0 : 1
    page.loading = true
    try {
      await usersApi.projectGroupEdit({ id: row.id, groupName: row.groupName, remark: row.remark, sort: row.sort, statusId: target })
      ElMessage.success(target === 1 ? '已启用' : '已停用')
      await handlePage()
    } finally {
      page.loading = false
    }
  }
</script>

<style lang="scss" scoped>
  .empty-count {
    color: #c0c4cc;
  }
</style>
