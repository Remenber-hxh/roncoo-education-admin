<template>
  <div class="app-wrapper">
    <sidebar />
    <div class="app-main">
      <navbar />
      <tabs-bar @refresh="refreshView" />
      <div class="app-content">
        <!-- 白底卡片原本由 Mains.vue 提供，70 个页面里有 43 个不带自己的容器、
             直接依赖它，故保留这一层，只是换成新的圆角和阴影 -->
        <div class="content-card">
          <router-view v-slot="{ Component, route }">
            <!-- key 里带上 refreshKey：点「刷新当前」时强制重建组件，
                 不然只是路由没变、页面不会重新拉数据 -->
            <component :is="Component" v-if="alive" :key="route.path + '_' + refreshKey" />
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { nextTick, onMounted, ref } from 'vue'
  import Navbar from './components/Navbar/index.vue'
  import Sidebar from './components/Sidebar/index.vue'
  import TabsBar from './components/TabsBar.vue'
  import { useWebsiteStore } from '@/store/modules/website.js'

  onMounted(() => {
    useWebsiteStore().init()
  })

  // 刷新当前页：先卸载再挂载，配合 key 变化确保 onMounted 重新跑
  const alive = ref(true)
  const refreshKey = ref(0)
  async function refreshView() {
    alive.value = false
    refreshKey.value++
    await nextTick()
    alive.value = true
  }
</script>

<style lang="scss" scoped>
  .app-wrapper {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--t-body-bg);
  }

  .app-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .app-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 12px;
  }

  .content-card {
    background: var(--t-card-bg);
    border-radius: var(--t-radius);
    box-shadow: var(--t-shadow);
    padding: 16px;
    min-height: calc(100vh - var(--t-header-h) - var(--t-tabs-h) - 24px);
    box-sizing: border-box;
  }
</style>
