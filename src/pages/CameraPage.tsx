import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCamera } from '../hooks/useCamera'
import { useAppStore } from '../store'
import OverlayBoard from '../components/OverlayBoard'
import BoardEditor from '../components/BoardEditor'
import CameraPermissionError from '../components/CameraPermissionError'
import { compositeBoard } from '../utils/compositeBoard'

export default function CameraPage() {
  const navigate = useNavigate()
  const { videoRef, ready, error, flipCamera, capture } = useCamera()
  const { board, pendingSlot, setSlotPhoto, setPendingSlot } = useAppStore()
  const [showEditor, setShowEditor] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [flash, setFlash] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [rawCapture, setRawCapture] = useState<string | null>(null)
  const shutterRef = useRef(false)

  const goBack = () => {
    setPendingSlot(null)
    navigate('/')
  }

  const handleCapture = async () => {
    if (shutterRef.current || !pendingSlot) return
    shutterRef.current = true
    setCapturing(true)
    setFlash(true)
    setTimeout(() => setFlash(false), 150)

    const raw = capture()
    if (raw) {
      const composited = await compositeBoard(raw, board)
      setRawCapture(raw)
      setPreview(composited)
    }

    setTimeout(() => {
      setCapturing(false)
      shutterRef.current = false
    }, 400)
  }

  const handleConfirm = () => {
    if (!preview || !rawCapture || !pendingSlot) return
    setSlotPhoto(pendingSlot.pageId, pendingSlot.slotIndex, {
      dataUrl: preview,
      originalDataUrl: rawCapture,
      board: { ...board },
    })
    setPendingSlot(null)
    setPreview(null)
    setRawCapture(null)
    navigate('/ledger')
  }

  const handleRetake = () => { setPreview(null); setRawCapture(null) }

  // 촬영 후 미리보기
  if (preview) {
    return (
      <div className="relative w-full h-full bg-black flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          <img src={preview} className="w-full h-full object-contain" />
        </div>
        <div className="bg-black flex items-center px-6 py-5 gap-3">
          <button
            onClick={handleRetake}
            className="flex-1 bg-zinc-700 text-white py-3 rounded-xl text-sm font-medium"
          >
            다시 찍기
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold"
          >
            저장
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* 보드는 촬영 시 합성만, 뷰파인더에는 미표시 */}

        {flash && <div className="absolute inset-0 bg-white opacity-70 pointer-events-none" />}

        {error && <CameraPermissionError onRetry={() => window.location.reload()} />}

        {/* 상단 버튼 */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-3">
          <button
            onClick={goBack}
            className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            ← 사진대지
          </button>
          <button
            onClick={flipCamera}
            className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm"
          >
            전환
          </button>
        </div>

        {/* 슬롯 미선택 안내 */}
        {!pendingSlot && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-white px-6">
              <p className="text-base font-bold mb-2">슬롯을 먼저 선택하세요</p>
              <p className="text-sm text-zinc-300 mb-6">사진대지에서 빈 칸을 탭하면 카메라가 열립니다</p>
              <button onClick={goBack} className="bg-white text-black px-6 py-2 rounded-xl text-sm font-bold">
                사진대지로 이동
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div className="bg-black flex items-center justify-between px-6 py-4 gap-4">
        <button
          onClick={() => setShowEditor(true)}
          className="flex-1 bg-zinc-800 text-white py-3 rounded-xl text-sm font-medium"
        >
          보드 편집
        </button>

        <button
          onClick={handleCapture}
          disabled={!ready || capturing || !pendingSlot}
          className="w-16 h-16 rounded-full bg-white border-4 border-zinc-400 disabled:opacity-30 active:scale-95 transition-transform"
        />

        <div className="flex-1" />
      </div>

      {showEditor && <BoardEditor onClose={() => setShowEditor(false)} />}
    </div>
  )
}
