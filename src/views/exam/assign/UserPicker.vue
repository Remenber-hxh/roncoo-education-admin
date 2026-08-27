<template>
  <div class="user-picker">
    <el-radio-group v-model="mode" size="small" @change="onModeChange">
      <el-radio-button value="team">按班组</el-radio-button>
      <el-radio-button value="group">按项目组</el-radio-button>
      <el-radio-button value="all">全体员工</el-radio-button>
      <el-radio-button value="manual">手动挑选</el-radio-button>
    </el-radio-group>

    <div class="picker-body">
      <!-- 按班组 / 按项目组：可多选，选完直接算出人数 -->
      <el-select
        v-if="mode === 'team'"
        v-model="teamIds"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="选择一个或多个班组"
        style="width: 100%"
        @change="reload"
      >
        <el-option v-for="t in teams" :key="t.id" :label="t.teamName" :value="t.id" />
      </el-select>

      <el-select
        v-else-if="mode === 'group'"
        v-model="groupIds"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="选择一个或多个项目组"
        style="width: 100%"
        @change="reload"
      >
        <el-option v-for="g in groups" :key="g.id" :label="g.groupName" :value="g.id" />
      </el-select>

      <el-select
        v-else-if="mode === 'manual'"
        v-model="manualIds"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        placeholder="按姓名或工号搜索"
        style="width: 100%"
        @change="onManualChange"
      >
        <el-option v-for="u in allUsers" :key="u.id" :label="labelOf(u)" :value="u.id" />
      </el-select>

      <div v-else class="all-tip">将指派给全部在册员工</div>
    </div>

    <!-- 选中结果预览：指派前要能看到具体是谁，光给个数字不敢点 -->
    <div class="picker-result" :class="{ empty: matched.length === 0 }">
      <span v-if="loading">正在统计…</span>
      <template v-else>
        <span class="count">已选 {{ matched.length }} 人</span>
        <span v-if="matched.length" class="names">{{ preview }}</span>
        <span v-else class="hint">（没有匹配到员工，换个条件试试）</span>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { usersApi } from '@/api/users'

  const emit = defineEmits(['change'])

  const mode = ref('team')
  const teams = ref([])
  const groups = ref([])
  const allUsers = ref([])

  const teamIds = ref([])
  const groupIds = ref([])
  const manualIds = ref([])

  const matched = ref([])
  const loading = ref(false)

  function labelOf(u) {
    return `${u.nickname || '未命名'}（工号 ${u.empNo || '-'}）`
  }

  // 预览只列前几个名字，人多时后面省略，避免把弹窗撑长
  const preview = computed(() => {
    const names = matched.value.map((u) => u.nickname || u.empNo)
    return names.length <= 6 ? names.join('、') : names.slice(0, 6).join('、') + ` 等 ${names.length} 人`
  })

  onMounted(async () => {
    const [t, g] = await Promise.all([usersApi.teamList(), usersApi.projectGroupList()])
    teams.value = t || []
    groups.value = g || []
    // 手动挑选要用到全量名单，顺带作为「全体员工」的数据源
    allUsers.value = await fetchUsers({})
    reload()
  })

  // 只取有工号的在册员工。没工号的是早期测试账号，指派给他们没意义
  async function fetchUsers(params) {
    const res = await usersApi.usersPage({ ...params }, 1, 500)
    return (res.list || []).filter((u) => u.empNo)
  }

  async function reload() {
    loading.value = true
    try {
      if (mode.value === 'all') {
        matched.value = allUsers.value
      } else if (mode.value === 'manual') {
        const set = new Set(manualIds.value)
        matched.value = allUsers.value.filter((u) => set.has(u.id))
      } else {
        const ids = mode.value === 'team' ? teamIds.value : groupIds.value
        if (ids.length === 0) {
          matched.value = []
        } else {
          // 必须串行查，不能用 Promise.all 并发。
          // request.js 的「取消重复请求」只按 URL+method 去重、不看参数，
          // 同时发多个 usersPage 会互相取消，最后只剩一个结果——
          // 表现就是多选了几个班组，人数却只等于其中一个班组的人数。
          const key = mode.value === 'team' ? 'teamId' : 'projectGroupId'
          const map = new Map()
          for (const id of ids) {
            const list = await fetchUsers({ [key]: id })
            // 同一个人可能同时命中多个条件，按 id 去重
            list.forEach((u) => map.set(u.id, u))
          }
          matched.value = [...map.values()]
        }
      }
      emit('change', matched.value)
    } finally {
      loading.value = false
    }
  }

  function onManualChange() {
    reload()
  }

  // 切换方式时清掉上一种方式的选择，否则「已选 N 人」和界面对不上
  function onModeChange() {
    teamIds.value = []
    groupIds.value = []
    manualIds.value = []
    reload()
  }

  defineExpose({
    reset: () => {
      mode.value = 'team'
      onModeChange()
    }
  })
</script>

<style lang="scss" scoped>
  .picker-body {
    margin-top: 10px;
  }

  .all-tip {
    color: #909399;
    font-size: 13px;
    padding: 6px 0;
  }

  .picker-result {
    margin-top: 10px;
    padding: 8px 12px;
    background: var(--t-primary-light);
    border-radius: var(--t-radius-sm);
    font-size: 13px;
    line-height: 1.7;

    &.empty {
      background: #f5f7fa;
    }

    .count {
      font-weight: 600;
      color: var(--t-primary);
      margin-right: 8px;
    }

    .names {
      color: #5b6472;
    }

    .hint {
      color: #909399;
    }
  }
</style>
