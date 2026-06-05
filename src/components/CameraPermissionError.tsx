interface Props {
  onRetry: () => void
}

// 브라우저별 카메라 설정 페이지 URL
function getSettingsUrl(): { label: string; url: string } | null {
  const ua = navigator.userAgent
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) {
    return { label: 'Chrome 카메라 설정 열기', url: 'chrome://settings/content/camera' }
  }
  if (/Edg/.test(ua)) {
    return { label: 'Edge 카메라 설정 열기', url: 'edge://settings/content/camera' }
  }
  return null
}

export default function CameraPermissionError({ onRetry }: Props) {
  const settings = getSettingsUrl()

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-6 gap-5">
      <div className="text-5xl">📷</div>

      <div className="text-center">
        <p className="text-white font-bold text-base mb-1">카메라 접근 권한 필요</p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          카메라를 사용하려면 브라우저에서<br />권한을 허용해야 합니다.
        </p>
      </div>

      {/* 브라우저별 안내 */}
      <div className="w-full bg-zinc-800 rounded-xl p-4 text-sm text-zinc-300 space-y-2">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-1">권한 허용 방법</p>
        <div className="flex gap-2">
          <span className="text-zinc-500 shrink-0">1.</span>
          <span>주소창 왼쪽 <strong className="text-white">🔒 자물쇠</strong> 또는 <strong className="text-white">📷 카메라</strong> 아이콘 클릭</span>
        </div>
        <div className="flex gap-2">
          <span className="text-zinc-500 shrink-0">2.</span>
          <span><strong className="text-white">카메라 → 허용</strong> 선택</span>
        </div>
        <div className="flex gap-2">
          <span className="text-zinc-500 shrink-0">3.</span>
          <span>아래 <strong className="text-white">다시 시도</strong> 버튼 클릭</span>
        </div>
      </div>

      {/* 브라우저 설정 링크 (Chrome/Edge만 동작) */}
      {settings && (
        <a
          href={settings.url}
          className="text-blue-400 text-sm underline underline-offset-2"
          onClick={(e) => {
            // chrome:// URL은 <a>로 열 수 없어 클립보드에 복사 안내
            e.preventDefault()
            navigator.clipboard?.writeText(settings.url).then(() => {
              alert(`주소를 복사했습니다.\n새 탭에 붙여넣기(Ctrl+V) 후 Enter 하세요:\n\n${settings.url}`)
            }).catch(() => {
              alert(`브라우저 주소창에 아래 주소를 입력하세요:\n\n${settings.url}`)
            })
          }}
        >
          {settings.label} →
        </a>
      )}

      <button
        onClick={onRetry}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm"
      >
        다시 시도
      </button>
    </div>
  )
}
