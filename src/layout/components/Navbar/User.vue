<template>
  <div class="info">
    <!-- 原来写的是 href="/"，指向后台自己，点了等于原地刷新 -->
    <a :href="portalUrl" target="_blank" rel="noopener" class="info-home">
      <el-icon><House /></el-icon>&nbsp;首页
    </a>
    <el-dropdown class="user-info">
      <div>
        {{ realName }}
        <el-icon class="el-icon--right">
          <arrow-down />
        </el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item>个人信息</el-dropdown-item>
          <el-dropdown-item divided @click="onLogout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
  import { ArrowDown } from '@element-plus/icons-vue'
  import { useUserStore } from '@/store/modules/user'
  import { computed, ref } from 'vue'
  import { getPortalUrl } from '@/utils/portal'
  import { removeToken } from '@/utils/cookie'
  import { ElMessageBox } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { PATH } from '@/utils/constants/system'
  import { useAppStore } from '@/store/modules/app'

  const realName = ref(useUserStore().realName)
  const portalUrl = computed(() => getPortalUrl())
  const router = useRouter()

  /**
   * 退出登录
   */
  const onLogout = () => {
    ElMessageBox.confirm('确认要退出登录?', '退出登录', {
      type: 'warning',
      cancelButtonText: '取消',
      confirmButtonText: '确认'
    }).then(async () => {
      removeToken()
      useUserStore().logout()
      // 页签也要清掉，否则换个账号登进来还留着上一个人开过的页
      useAppStore().clearTabs()
      await router.push({ path: PATH.URL_LOGIN })
    })
  }
</script>
<style lang="scss" scoped>
  .info {
    display: flex;
    align-items: center;
    float: right;
    height: 100%;
    line-height: 50px;

    .info-home {
      display: flex;
      align-items: center;
      margin: 0 10px;
    }
  }

  .user-info {
    align-items: center;
    float: right;
    margin-right: 20px;
    height: 100%;
    line-height: 50px;

    :focus-visible {
      outline: 0px;
    }
  }
</style>
