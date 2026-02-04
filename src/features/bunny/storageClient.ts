export type StorageEntry = {
  ObjectName?: string
  Path?: string
  IsDirectory?: boolean
  Length?: number
  LastChanged?: string
  DateCreated?: string
  ContentType?: string
}

type StorageConfig = {
  storageZoneName: string
  storageAccessKey: string
}

const endpointCandidates = [
  'https://storage.bunnycdn.com',
  'https://uk.storage.bunnycdn.com',
  'https://ny.storage.bunnycdn.com',
  'https://la.storage.bunnycdn.com',
  'https://sg.storage.bunnycdn.com',
  'https://se.storage.bunnycdn.com',
  'https://br.storage.bunnycdn.com',
  'https://jh.storage.bunnycdn.com',
  'https://syd.storage.bunnycdn.com',
]

const endpointCache = new Map<string, string>()

const CACHE_KEY_PREFIX = 'bunny-endpoint-cache::'

const loadCachedEndpoint = (cacheKey: string): string | null => {
  try {
    return sessionStorage.getItem(CACHE_KEY_PREFIX + cacheKey)
  } catch {
    return null
  }
}

const saveCachedEndpoint = (cacheKey: string, endpoint: string) => {
  try {
    sessionStorage.setItem(CACHE_KEY_PREFIX + cacheKey, endpoint)
  } catch {
    // sessionStorage 사용 불가 시 무시
  }
}

const normalizePath = (path: string) =>
  path.replace(/^\/+|\/+$/g, '').trim()

const encodePath = (path: string) =>
  normalizePath(path)
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/')

const buildDirectoryUrl = (endpoint: string, zone: string, path: string) => {
  const encodedPath = encodePath(path)
  return `${endpoint}/${zone}/${encodedPath}${encodedPath ? '/' : ''}`
}

const buildFileUrl = (
  endpoint: string,
  zone: string,
  path: string,
  fileName: string,
) => {
  const encodedPath = encodePath(path)
  const encodedFile = encodeURIComponent(fileName)
  return `${endpoint}/${zone}/${encodedPath ? `${encodedPath}/` : ''}${encodedFile}`
}

const getCacheKey = (config: StorageConfig) =>
  `${config.storageZoneName}::${config.storageAccessKey}`

export const resolveEndpoint = async (config: StorageConfig) => {
  const cacheKey = getCacheKey(config)

  // 1) 메모리 캐시 확인
  const memCached = endpointCache.get(cacheKey)
  if (memCached) return memCached

  // 2) sessionStorage 확인
  const storageCached = loadCachedEndpoint(cacheKey)
  if (storageCached) {
    endpointCache.set(cacheKey, storageCached)
    return storageCached
  }

  // 3) 엔드포인트 순회
  let lastError = ''
  for (const endpoint of endpointCandidates) {
    try {
      const response = await fetch(
        buildDirectoryUrl(endpoint, config.storageZoneName, ''),
        {
          headers: { AccessKey: config.storageAccessKey },
        },
      )
      if (response.ok) {
        endpointCache.set(cacheKey, endpoint)
        saveCachedEndpoint(cacheKey, endpoint)
        return endpoint
      }
      lastError = `${endpoint} responded ${response.status}`
    } catch (error) {
      lastError = `${endpoint} failed`
    }
  }

  throw new Error(lastError || '스토리지 엔드포인트를 찾지 못했어.')
}

export const uploadFileResolved = async (
  endpoint: string,
  config: StorageConfig,
  path: string,
  file: File,
  fileNameOverride?: string,
  signal?: AbortSignal,
) => {
  const fileName = fileNameOverride ?? file.name
  const response = await fetch(
    buildFileUrl(endpoint, config.storageZoneName, path, fileName),
    {
      method: 'PUT',
      headers: {
        AccessKey: config.storageAccessKey,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(`업로드 실패: ${response.status}`)
  }
}

export const deleteFileResolved = async (
  endpoint: string,
  config: StorageConfig,
  path: string,
  fileName: string,
  signal?: AbortSignal,
) => {
  const response = await fetch(
    buildFileUrl(endpoint, config.storageZoneName, path, fileName),
    {
      method: 'DELETE',
      headers: {
        AccessKey: config.storageAccessKey,
      },
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(`삭제 실패: ${response.status}`)
  }
}

export const listDirectory = async (
  config: StorageConfig,
  path: string,
) => {
  const endpoint = await resolveEndpoint(config)
  const response = await fetch(
    buildDirectoryUrl(endpoint, config.storageZoneName, path),
    {
      headers: { AccessKey: config.storageAccessKey },
    },
  )

  if (!response.ok) {
    throw new Error(`목록 조회 실패: ${response.status}`)
  }

  return (await response.json()) as StorageEntry[]
}

export const uploadFile = async (
  config: StorageConfig,
  path: string,
  file: File,
  fileNameOverride?: string,
  signal?: AbortSignal,
) => {
  const endpoint = await resolveEndpoint(config)
  await uploadFileResolved(
    endpoint,
    config,
    path,
    file,
    fileNameOverride,
    signal,
  )
}

const joinPath = (base: string, next: string) => {
  const a = normalizePath(base)
  const b = normalizePath(next)
  if (!a) return b
  if (!b) return a
  return `${a}/${b}`
}

export const deleteFile = async (
  config: StorageConfig,
  path: string,
  fileName: string,
) => {
  const endpoint = await resolveEndpoint(config)
  await deleteFileResolved(endpoint, config, path, fileName)
}

export const deleteDirectory = async (
  config: StorageConfig,
  dirPath: string,
): Promise<void> => {
  const entries = await listDirectory(config, dirPath)
  for (const entry of entries) {
    const name = entry.ObjectName ?? ''
    if (!name) continue
    if (entry.IsDirectory) {
      await deleteDirectory(config, joinPath(dirPath, name))
    } else {
      await deleteFile(config, dirPath, name)
    }
  }
}
