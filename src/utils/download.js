import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/cookie.js'

/**
 * 下载后端返回的文件流。
 *
 * 不能用 <a href="接口地址"> 直接开链接：接口要带 token 请求头，
 * 浏览器发起的导航请求带不上，后端会判成未登录，
 * 结果是下载到一个内容为「请先登录」的 xlsx，打开还报文件损坏，很难看出原因。
 * 所以走 fetch 拿 blob，再用临时 URL 触发保存。
 *
 * @param {string} url      网关地址，如 /gateway/course/admin/exam/question/export
 * @param {string} fileName 保存的文件名（含扩展名）
 * @param {object} params   可选的查询参数，值为空的会被忽略
 */
export async function downloadFile(url, fileName, params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  const full = qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url

  let res
  try {
    res = await fetch(full, { headers: { token: getToken() || '' } })
  } catch (e) {
    ElMessage.error('下载失败：' + e.message)
    return false
  }
  if (!res.ok) {
    ElMessage.error('下载失败：' + res.status)
    return false
  }

  // 后端出错时返回的是 JSON 而不是文件流。不判一下的话，
  // 用户会存到一个装着错误信息的 .xlsx，双击打开只看到「文件已损坏」
  const type = res.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    const text = await res.text()
    let msg = text
    try {
      msg = JSON.parse(text).msg || text
    } catch (e) {
      // 不是标准返回体就原样展示
    }
    ElMessage.error(msg || '下载失败')
    return false
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
  return true
}
