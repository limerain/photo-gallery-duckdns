type WebpThumbnailOptions = {
  maxSize: number
  quality: number
}

const defaultOptions: WebpThumbnailOptions = {
  maxSize: 256,
  quality: 0.7,
}

const getBaseName = (fileName: string) => {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName
}

export const createWebpThumbnailFile = async (
  file: File,
  options?: Partial<WebpThumbnailOptions>,
) => {
  const { maxSize, quality } = { ...defaultOptions, ...options }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = maxSize
    canvas.height = maxSize
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d ctx')

    // cover crop to square
    const scale = Math.max(maxSize / bitmap.width, maxSize / bitmap.height)
    const drawW = Math.ceil(bitmap.width * scale)
    const drawH = Math.ceil(bitmap.height * scale)
    const dx = Math.floor((maxSize - drawW) / 2)
    const dy = Math.floor((maxSize - drawH) / 2)
    ctx.drawImage(bitmap, dx, dy, drawW, drawH)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/webp',
        quality,
      )
    })

    const base = getBaseName(file.name)
    return new File([blob], `${base}.webp`, { type: 'image/webp' })
  } finally {
    bitmap?.close?.()
  }
}

