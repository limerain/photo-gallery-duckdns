import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSettingsReady, useAppSettings } from './settingsStore'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'

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
    <div className="mx-auto grid max-w-xl gap-4">
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-content-primary">초기 설정</h1>
        <p className="mt-2 text-sm text-content-muted">
          인증 없이 쓰는 대신, 이 값들은 세션스토리지에만 저장돼.
        </p>
      </div>
      <Card className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <div className="text-sm font-semibold text-content-secondary">
              CDN 메인 URL
            </div>
            <Input
              type="url"
              inputMode="url"
              placeholder="https://xxx.b-cdn.net"
              value={form.cdnBaseUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cdnBaseUrl: event.target.value }))
              }
            />
          </label>
          <label className="block">
            <div className="text-sm font-semibold text-content-secondary">
              Storage Zone Name
            </div>
            <Input
              type="text"
              placeholder="my-zone"
              value={form.storageZoneName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  storageZoneName: event.target.value,
                }))
              }
            />
          </label>
          <label className="block">
            <div className="text-sm font-semibold text-content-secondary">
              Storage AccessKey
            </div>
            <Input
              type="password"
              placeholder="********"
              value={form.storageAccessKey}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  storageAccessKey: event.target.value,
                }))
              }
            />
          </label>
          {error ? <p className="text-sm text-danger-text">{error}</p> : null}
          <Button type="submit" variant="primary" className="w-full">
            저장하고 시작하기
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default SetupPage
