import { useRef, useState, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const startCamera = useCallback(async (mode: 'environment' | 'user' = 'environment') => {
    setError(null)
    setReady(false)
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((t) => t.stop())
    }

    // environment 모드 시도 → 실패 시 PC 웹캠(any)으로 fallback
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: true, audio: false },
    ]

    for (const c of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(c)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setReady(true)
        }
        return
      } catch {
        // 다음 constraint로 재시도
      }
    }
    setError('카메라를 시작할 수 없습니다.\n브라우저에서 카메라 권한을 허용해 주세요.')
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((t) => t.stop())
      }
    }
  }, [facingMode, startCamera])

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }, [])

  const capture = useCallback((): string | null => {
    const video = videoRef.current
    if (!video) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }, [])

  return { videoRef, ready, error, facingMode, flipCamera, capture }
}
