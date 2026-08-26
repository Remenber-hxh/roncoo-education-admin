import { useWebsiteStore } from '@/store/modules/website.js'

/**
 * 员工端（门户）地址（二开）。
 *
 * 后台和门户是两个独立应用：开发环境后台在 9528、门户在 3000；
 * 上线后可能同域不同路径，也可能是两个域名。
 * 原来「首页」「打开员工端」两个入口都写的是 href="/"，
 * 那指向的是后台自己，点了等于原地刷新。
 *
 * 取值优先级：
 *   1. 参数配置里的「网站域名」——上线后由管理员填真实域名，这是权威来源
 *   2. 开发环境兜底到 localhost:3000
 *
 * 「网站域名」允许填几种写法，这里统一补全：
 *   example.com          -> http://example.com
 *   http://example.com/  -> http://example.com
 *   localhost            -> 开发环境视为无效，走兜底
 */
export function getPortalUrl() {
  const domain = useWebsiteStore().getInfo?.websiteDomain
  const normalized = normalize(domain)
  if (normalized) {
    return normalized
  }
  // 兜底：与后台同主机、门户默认端口
  return `${window.location.protocol}//${window.location.hostname}:3000`
}

function normalize(domain) {
  if (!domain) {
    return ''
  }
  let d = String(domain).trim()
  if (!d) {
    return ''
  }
  // 只填了 localhost 没带端口时无法区分后台和门户，交给兜底逻辑
  if (d === 'localhost' || d === '127.0.0.1') {
    return ''
  }
  if (!/^https?:\/\//i.test(d)) {
    d = 'http://' + d
  }
  // 去掉结尾斜杠，避免拼出 //
  return d.replace(/\/+$/, '')
}
