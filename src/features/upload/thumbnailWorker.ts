type WorkerRequest = {
  file: File
  maxSize: number
  quality: number
}

type WorkerResponse =
  | { ok: true; blob: Blob; fileName: string }
  | { ok: false; error: string }

const getBaseName = (fileName: string) => {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName
}

const createThumbnailBlob = async (
  file: File,
  maxSize: number,
  quality: number,
) => {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('offscreen-not-supported')
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
    const canvas = new OffscreenCanvas(maxSize, maxSize)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no-2d')

    const scale = Math.max(maxSize / bitmap.width, maxSize / bitmap.height)
    const drawW = Math.ceil(bitmap.width * scale)
    const drawH = Math.ceil(bitmap.height * scale)
    const dx = Math.floor((maxSize - drawW) / 2)
    const dy = Math.floor((maxSize - drawH) / 2)
    ctx.drawImage(bitmap, dx, dy, drawW, drawH)

    return await canvas.convertToBlob({
      type: 'image/webp',
      quality,
    })
  } finally {
    bitmap?.close?.()
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { file, maxSize, quality } = event.data
  try {
    const blob = await createThumbnailBlob(file, maxSize, quality)
    const base = getBaseName(file.name)
    const payload: WorkerResponse = {
      ok: true,
      blob,
      fileName: `${base}.webp`,
    }
    self.postMessage(payload)
  } catch (error) {
    const payload: WorkerResponse = {
      ok: false,
      error: error instanceof Error ? error.message : 'worker-failed',
    }
    self.postMessage(payload)
  }
}
