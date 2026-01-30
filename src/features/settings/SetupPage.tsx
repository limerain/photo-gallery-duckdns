import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSettingsReady, useAppSettings } from './settingsStore'

function SetupPage() {
  const navigate = useNavigate()
  const { cdnBaseUrl, storageZoneName, storageAccessKey, setConfig } =
    useAppSettings()
  const [form, setForm] = useState({
    cdnBaseUrl,
    storageZoneName,
    storageAccessKey,
  })
  const [error, setError] = useState('')

  const isReady = useMemo(
    () =>
      isSettingsReady({
        cdnBaseUrl: form.cdnBaseUrl.trim(),
        storageZoneName: form.storageZoneName.trim(),
        storageAccessKey: form.storageAccessKey.trim(),
      }),
    [form],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!isReady) {
      setError('모든 필드를 입력해줘.')
      return
    }
    const normalizedBaseUrl = form.cdnBaseUrl.trim().replace(/\/+$/, '')
    setConfig({
      cdnBaseUrl: normalizedBaseUrl,
      storageZoneName: form.storageZoneName.trim(),
      storageAccessKey: form.storageAccessKey.trim(),
    })
    navigate('/browse/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h1 className="text-xl font-semibold text-white">초기 설정</h1>
      <p className="mt-2 text-sm text-zinc-400">
        CDN URL, Storage Zone, AccessKey를 입력해줘.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-zinc-200">
          CDN 메인 URL
          <input
            type="url"
            inputMode="url"
            placeholder="https://xxx.b-cdn.net"
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            value={form.cdnBaseUrl}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, cdnBaseUrl: event.target.value }))
            }
          />
        </label>
        <label className="block text-sm font-medium text-zinc-200">
          Storage Zone Name
          <input
            type="text"
            placeholder="my-zone"
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            value={form.storageZoneName}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                storageZoneName: event.target.value,
              }))
            }
          />
        </label>
        <label className="block text-sm font-medium text-zinc-200">
          Storage AccessKey
          <input
            type="password"
            placeholder="********"
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            value={form.storageAccessKey}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                storageAccessKey: event.target.value,
              }))
            }
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
        >
          저장하고 시작하기
        </button>
      </form>
    </div>
  )
}

export default SetupPage
