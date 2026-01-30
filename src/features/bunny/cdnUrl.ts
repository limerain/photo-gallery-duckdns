const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/g, '')

const encodePath = (path: string) =>
  path
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')

export const buildCdnUrl = (baseUrl: string, path: string) => {
  const safeBase = normalizeBaseUrl(baseUrl)
  const encodedPath = encodePath(path)
  return `${safeBase}/${encodedPath}`
}

type ImageTransformOptions = {
  width?: number
  height?: number
  aspectRatio?: string
  quality?: number
  autoOptimize?: 'low' | 'medium' | 'high'
}

export const buildImageTransformUrl = (
  baseUrl: string,
  path: string,
  options: ImageTransformOptions,
) => {
  const url = new URL(buildCdnUrl(baseUrl, path))
  if (options.width) url.searchParams.set('width', String(options.width))
  if (options.height) url.searchParams.set('height', String(options.height))
  if (options.aspectRatio)
    url.searchParams.set('aspect_ratio', options.aspectRatio)
  if (options.quality) url.searchParams.set('quality', String(options.quality))
  if (options.autoOptimize)
    url.searchParams.set('auto_optimize', options.autoOptimize)
  url.searchParams.set('optimizer', 'image')
  return url.toString()
}
