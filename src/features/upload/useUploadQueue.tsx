import { useEffect, useRef, useState } from 'react'
import { uploadFile } from '../bunny/storageClient'

export type UploadItem = {
  id: string
  file: File
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

type UploadConfig = {
  storageZoneName: string
  storageAccessKey: string
}

const buildId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}`

export const useUploadQueue = () => {
  const [items, setItems] = useState<UploadItem[]>([])
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).map((file) => ({
      id: buildId(file),
      file,
      status: 'idle' as const,
    }))
    setItems((prev) => [...prev, ...list])
  }

  const clear = () => setItems([])

  const uploadAll = async (config: UploadConfig, path: string) => {
    for (const item of itemsRef.current) {
      if (item.status === 'success') continue
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: 'uploading', error: undefined }
            : entry,
        ),
      )
      try {
        await uploadFile(config, path, item.file)
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, status: 'success' } : entry,
          ),
        )
      } catch (error) {
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? { ...entry, status: 'error', error: '업로드 실패' }
              : entry,
          ),
        )
      }
    }
  }

  return {
    items,
    addFiles,
    clear,
    uploadAll,
  }
}
