<template>
  <div class="app-container">
    <div class="page_head">
      <div class="search_bar clearfix">
        <el-form :model="query" inline label-width="80px">
          <el-form-item>
            <el-input v-model="query.mobile" placeholder="请输入手机号码" prefix-icon="Search" clearable @keyup.enter="handleQuery()" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.empNo" placeholder="请输入工号" prefix-icon="Search" clearable style="width: 140px" @keyup.enter="handleQuery()" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.teamId" placeholder="班组" clearable style="width: 150px">
              <el-option v-for="t in teamList" :key="t.id" :label="t.teamName" :value="t.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.projectGroupId" placeholder="项目组" clearable style="width: 180px">
              <el-option v-for="g in groupList" :key="g.id" :label="g.groupName" :value="g.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery()"> 查询</el-button>
            <el-button @click="resetQuery()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="button_bar">
        <el-button v-permission="'user:edit'" type="primary" @click="openImportModal()">批量导入</el-button>
      </div>
    </div>
    <el-table v-loading="page.loading" :data="page.list">
      <el-table-column label="工号" :min-width="30">
        <template #default="scope">
          <span v-if="scope.row.empNo">{{ scope.row.empNo }}</span>
          <el-tag v-else size="small" type="warning">未填</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="手机号码" :min-width="40" prop="mobile" />
      <el-table-column label="用户信息" :min-width="60">
        <template #default="scope">
          <user-avatar :url="scope.row.userHead" :name="scope.row.nickname" :size="40" />
          &nbsp;{{ scope.row.nickname }}
        </template>
      </el-table-column>
      <el-table-column label="班组" :min-width="35">
        <template #default="scope">
          <span v-if="scope.row.teamName">{{ scope.row.teamName }}</span>
          <el-tag v-else size="small" type="warning">未分组</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="项目组" :min-width="45">
        <template #default="scope">
          <span v-if="scope.row.projectGroupName">{{ scope.row.projectGroupName }}</span>
          <el-tag v-else size="small" type="warning">未分组</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="岗位职务" :min-width="45" prop="position" show-overflow-tooltip />
      <el-table-column label="入职日期" :min-width="40" prop="hireDate" />
      <el-table-column :min-width="40" label="注册来源" prop="remark">
        <template #default="scope">
          <enum-view :enum-name="'RegisterSourceEnum'" :enum-value="scope.row.registerSource" />
        </template>
      </el-table-column>
      <el-table-column :min-width="50" label="注册时间" prop="gmtCreate" />
      <el-table-column :min-width="20" label="状态">
        <template #default="scope">
          <enum-view :enum-name="'StatusIdEnum'" :enum-value="scope.row.statusId" />
        </template>
      </el-table-column>
      <el-table-column :width="280" fixed="right" label="操作" prop="address">
        <template #default="scope">
          <el-button v-permission="'user:edit'" text type="primary" @click="openProfileModal(scope.row)">档案</el-button>
          <el-divider direction="vertical" />
          <el-button v-permission="'user:record'" text type="primary" @click="toUserRecord(scope.row, 'order')">数据</el-button>
          <el-divider direction="vertical" />
          <el-dropdown>
            <el-button text type="primary"
              >更多操作
              <el-icon class="el-icon--right">
                <arrow-down />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-button v-permission="'user:edit'" text type="primary" @click="openFormModal(scope.row)">编辑</el-button>
                </el-dropdown-item>
                <el-dropdown-item @click="handleStatus(scope.row)">
                  <el-button v-if="scope.row.statusId == 0" v-permission="'user:edit'" text type="primary">启用</el-button>
                  <el-button v-if="scope.row.statusId == 1" v-permission="'user:edit'" text type="primary">禁用</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-model:current-page="page.pageCurrent" v-model:page-size="page.pageSize" :total="page.totalCount" @pagination="handlePage" />
    <users-form ref="formRef" @refresh="handlePage" />
    <profile-form ref="profileRef" @refresh="handlePage" />
    <import-dialog ref="importRef" @refresh="handlePage" />
  </div>
</template>
<script setup>
  import useTable from '@/utils/table'
  import { onMounted, ref } from 'vue'
  import { usersApi } from '@/api/users'
  import { useRouter } from 'vue-router'
  import Pagination from '@/components/Pagination/index.vue'
  import EnumView from '@/components/Enum/View/index.vue'
  import UsersForm from './UsersForm.vue'
  import ProfileForm from './ProfileForm.vue'
  import ImportDialog from './ImportDialog.vue'
  import UserAvatar from '@/components/Avatar/index.vue'

  // 批量导入
  const importRef = ref()
  const openImportModal = () => {
    importRef.value.onOpen()
  }

  // 添加/修改
  const formRef = ref()
  const openFormModal = (item) => {
    formRef.value.onOpen(item)
  }

  // 员工档案
  const profileRef = ref()
  const openProfileModal = (item) => {
    profileRef.value.onOpen(item)
  }

  // 筛选用的两个下拉
  const teamList = ref([])
  const groupList = ref([])
  onMounted(() => {
    usersApi.teamList().then((res) => {
      teamList.value = res || []
    })
    usersApi.projectGroupList().then((res) => {
      groupList.value = res || []
    })
  })

  // 查看数据
  const router = useRouter()
  const toUserRecord = function (row, tabName) {
    router.push({ path: '/users/record', query: { userId: row.id, activeName: tabName } })
  }

  // 基础功能
  const { page, handlePage, query, handleQuery, resetQuery, handleStatus } = useTable({
    page: usersApi.usersPage,
    delete: usersApi.usersDelete,
    status: usersApi.usersEdit
  })
</script>
