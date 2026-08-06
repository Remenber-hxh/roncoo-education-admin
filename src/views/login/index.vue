<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-panel">
        <el-form v-loading="loading" :model="loginForm" label-position="left" @keyup.enter="handleLogin()">
          <h3 class="login-head">管理员登录</h3>
          <el-form-item class="form-group" prop="mobile">
            <el-input v-model="loginForm.mobile" placeholder="用户名" />
          </el-form-item>
          <el-form-item class="form-group" prop="mobilePwd">
            <el-input v-model="loginForm.mobilePwd" placeholder="密码" type="password" show-password />
          </el-form-item>
          <el-form-item class="form-group" prop="verCode">
            <el-input v-model="loginForm.verCode" class="var-input" placeholder="验证码" />
            <img class="var-img" :src="verImg" alt="" @click="getCaptcha" />
          </el-form-item>
          <el-button class="login-button" type="primary" @click="handleLogin">登 录</el-button>
        </el-form>
      </div>
    </div>
    <div class="footer">
      <div v-if="service.websiteCopyright" class="copyright">
        <span v-html="service.websiteCopyright" />
      </div>
      <div>
        <a v-if="service.websiteIcp" href="http://beian.miit.gov.cn/" target="_blank">{{ service.websiteIcp }}</a>
        <span>&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;</span>
        <img v-if="service.websitePrn" class="website-prn" :alt="service.websitePrn" src="../../assets/images/common/beian.png" />
        <a v-if="service.websitePrn" :href="'http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=' + service.websitePrnNo" target="_blank">&nbsp;{{ service.websitePrn }} </a>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { loginApi } from '@/api/login'
  import { onMounted, reactive, ref } from 'vue'
  import { setToken } from '@/utils/cookie'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/store/modules/user'
  import { createNewRouter } from '@/router'
  import { PATH } from '@/utils/constants/system'
  import { ElMessage } from 'element-plus'
  import { encrypt } from '@/utils/base.js'

  const router = useRouter()
  const loading = ref(false)
  const verImg = ref()

  // 站点信息
  const service = ref({})
  onMounted(() => {
    loginApi.getWebsite().then((res) => {
      service.value = res
    })
    // 验证码
    getCaptcha()
  })

  // 登录
  const loginForm = reactive({
    mobile: '',
    mobilePwd: ''
  })

  // 获取验证码
  async function getCaptcha() {
    try {
      const res = await loginApi.getCodeImg()
      loginForm.verToken = res.verToken
      verImg.value = res.img
    } catch (error) {
      console.error(error)
    }
  }

  async function handleLogin() {
    if (!loginForm.mobile) {
      ElMessage.error('请输入用户名')
      return
    }
    if (!loginForm.mobilePwd) {
      ElMessage.error('请输入密码')
      return
    }
    if (!loginForm.verCode) {
      ElMessage.error('请输入验证码')
      return
    }

    loading.value = true
    try {
      // 密码加密
      loginForm.mobilePwdEncrypt = encrypt(loginForm.mobilePwd, service.value.rsaLoginPublicKey)
      delete loginForm.mobilePwd
      const res = await loginApi.login(loginForm)
      // 存入cookie
      setToken(res.token)
      // 更新store
      useUserStore().login(res)
      // 初始化路由
      createNewRouter(res.routerList)
      await router.push(PATH.URL_DASHBOARD)
    } catch (error) {
      console.error(error)
      await getCaptcha()
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .login-container {
    height: 100vh;
    background: #2873f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-content {
    width: 400px;

    .login-panel {
      background: #fff;
      width: 350px;
      padding: 30px 25px 40px;
      border-radius: 12px;

      .login-head {
        text-align: center;
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 30px;
      }

      .login-button {
        width: 350px;
        height: 45px;
        background: #2873f0;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 700;
        text-align: center;
        color: #fff;
        line-height: 50px;
        cursor: pointer;
      }
    }
  }

  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    color: #fff;
    text-align: center;
    padding-bottom: 20px;
    font-size: 13px;
    line-height: 25px;

    a {
      text-decoration: none;
      color: #fff;
    }
    .website-prn {
      width: auto;
    }
  }

  .var-input {
    width: 200px;
  }

  .var-img {
    margin-left: 20px;
    width: 80px;
    height: auto;
  }

  .el-input {
    height: 40px;
  }
</style>
