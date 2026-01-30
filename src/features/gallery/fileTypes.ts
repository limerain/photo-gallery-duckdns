const imageExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'bmp',
  'heic',
  'heif',
])

const videoExtensions = new Set([
  'mp4',
  'webm',
  'mov',
  'm4v',
  'mkv',
])

const getExtension = (name: string) => {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

export const isImageFile = (name: string, contentType?: string) => {
  if (contentType?.startsWith('image/')) return true
  return imageExtensions.has(getExtension(name))
}

export const isVideoFile = (name: string, contentType?: string) => {
  if (contentType?.startsWith('video/')) return true
  return videoExtensions.has(getExtension(name))
}
