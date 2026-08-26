import { defineStore } from 'pinia'
import { loginApi } from '@/api/login.js'

export const useWebsiteStore = defineStore({
  id: 'website',
  state: () => ({
    info: {}
  }),
  getters: {
    getInfo(state) {
      return state.info
    }
  },
  actions: {
    init() {
      loginApi.getWebsite().then((res) => {
        this.info = res
        // 浏览器标签页标题也跟着「参数配置」走。
        // index.html 里写的是静态的「运营管理后台」，
        // 改了网站名称后标签页还是老名字。
        if (res && res.websiteName) {
          document.title = res.websiteName
        }
        // 网站图标同理
        if (res && res.websiteIcon) {
          let link = document.querySelector("link[rel~='icon']")
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
          }
          link.href = res.websiteIcon
        }
      })
    }
  }
})
