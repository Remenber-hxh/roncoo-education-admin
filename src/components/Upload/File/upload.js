import { ElMessage } from 'element-plus'
import { uploadApi } from '@/api/upload'
import { getPolyvClient, uploadPolyv } from '@/utils/vod/polyv'
import { getSessionStorage, setSessionStorage } from '@/utils/storage'
import { useUploadStore } from '@/store/modules/upload'
import { getSimpleClient, uploadSimple } from '@/utils/vod/simple'
import bus from '@/utils/bus'

/**
 * 视频上传
 * @param startFile
 */
export const handleVod = async (startFile) => {
  const res = await getVodConfig()
  if (res.vodPlatform == 1) {
    // 私有云上传
    const simpleClient = getSimpleClient(JSON.parse(res.vodUploadConfig))
    uploadSimple(simpleClient, startFile, (type, data) => {
      if (type === 'FileProgress') {
        startFile.progress = parseInt(String(data.progress * 100))
      }
      if (type === 'FileSucceed') {
        startFile.videoVid = data.vid
        handleResource(startFile).then(() => {
          startFile.status = 'success'
          useUploadStore().addSuccessFile(startFile)
        })
      } else if (type === 'FileFailed') {
        console.error(data)
        startFile.status = 'fail'
        ElMessage.error('上传失败，请重试')
      }
    })
  } else if (res.vodPlatform == 2) {
    // 保利威上传
    const polyvClient = getPolyvClient(JSON.parse(res.vodUploadConfig))
    uploadPolyv(polyvClient, startFile, (type, data) => {
      if (type === 'FileProgress') {
        startFile.progress = parseInt(String(data.progress * 100))
      }
      if (type === 'FileSucceed') {
        startFile.videoVid = data.fileData.vid
        handleResource(startFile).then(() => {
          startFile.status = 'success'
          useUploadStore().addSuccessFile(startFile)
        })
      } else if (type === 'FileFailed') {
        console.error(data)
        startFile.status = 'fail'
        ElMessage.error('上传失败，请重试')
      }
    })
  } else if (res.vodPlatform == 5) {
    // 本地存储（二开新增）：没有第三方点播云可直传，改为经服务端上传落盘
    startFile.status = 'uploading'
    try {
      await handleVideoDuration(startFile)
      startFile.resourceUrl = await uploadApi.video(
        startFile.file,
        (p) => {
          startFile.progress = p
          startFile.status = 'uploading'
        },
        startFile.cancelToken
      )
      startFile.vodPlatform = 5
      await handleResource(startFile)
      startFile.status = 'success'
      useUploadStore().addSuccessFile(startFile)
    } catch (e) {
      console.error(e)
      startFile.status = 'fail'
    }
  } else {
    ElMessage.error('暂不支持该上传平台：' + res.vodPlatform)
  }
}

/**
 * 读取音视频时长（秒），本地存储没有第三方云回传时长，只能在浏览器侧取
 */
const handleVideoDuration = (startFile) => {
  return new Promise((resolve) => {
    try {
      const el = document.createElement('video')
      el.preload = 'metadata'
      const url = URL.createObjectURL(startFile.file)
      el.onloadedmetadata = () => {
        startFile.videoLength = Math.round(el.duration) || 0
        URL.revokeObjectURL(url)
        resolve(startFile)
      }
      el.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(startFile)
      }
      el.src = url
    } catch (e) {
      resolve(startFile)
    }
  })
}

/**
 * 图片上传
 * @param startFile
 */
export const handlePic = async (startFile) => {
  startFile.status = 'uploading'
  try {
    const res = await uploadApi.pic(startFile.file)
    startFile.resourceUrl = res
    await handleWidthHeight(startFile)

    await handleResource(startFile)
    startFile.status = 'success'
    useUploadStore().addSuccessFile(startFile)
  } catch (e) {
    startFile.status = 'fail'
  }
}

/**
 * 文档、压缩包上传
 * @param startFile
 */
export const handleFile = async (startFile) => {
  startFile.status = 'uploading'
  try {
    const res = await uploadApi.doc(
      startFile.file,
      (p) => {
        startFile.progress = p
        startFile.status = 'uploading'
      },
      startFile.cancelToken
    )
    startFile.storagePlatform = res.storagePlatform
    startFile.resourceUrl = res.docUrl
    startFile.docPage = res.pageCount
    await handleResource(startFile)
    startFile.status = 'success'
    useUploadStore().addSuccessFile(startFile)
  } catch (e) {
    startFile.status = 'fail'
  }
}

/**
 * 保存资源
 * @param data
 */
const handleResource = async (data) => {
  await uploadApi.saveResource({
    categoryId: data.categoryId,
    resourceType: data.resourceType,
    resourceName: data.fileName,
    resourceSize: data.fileSize,
    resourceUrl: data.resourceUrl,
    vodPlatform: data.vodPlatform,
    storagePlatform: data.storagePlatform,
    videoVid: data.videoVid,
    videoLength: data.videoLength,
    docPage: data.docPage,
    imgWidth: data.imgWidth,
    imgHeight: data.imgHeight
  })
  ElMessage.success('上传成功')
  // 触发事件
  bus.emit('upload-event')
}

/**
 * 获取视频上传配置
 */
const getVodConfig = async () => {
  let res = getSessionStorage('vodConfig')
  if (!res) {
    res = await uploadApi.getVodConfig()
    // 保存2分钟
    setSessionStorage('vodConfig', res, 2)
    return res
  }
  return res
}

const handleWidthHeight = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file.file)
    reader.onload = function () {
      const img = new Image()
      img.src = reader.result
      if (img.complete) {
        file.imgWidth = img.width
        file.imgHeight = img.height
      } else {
        img.onload = function () {
          file.imgWidth = img.width
          file.imgHeight = img.height
          resolve(file)
        }
      }
    }
  })
}

export const STATUSTIP = {
  ready: '准备',
  doing: '处理中',
  uploading: '上传中',
  stop: '暂停',
  fail: '失败',
  success: '成功'
}
