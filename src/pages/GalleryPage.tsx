import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import BoardEditor from '../components/BoardEditor'
import { compositeBoard } from '../utils/compositeBoard'

export default function GalleryPage() {
  const navigate = useNavigate()
  const { pendingSlot, setSlotPhoto, setPendingSlot } = useAppStore()
  const [showEditor, setShowEditor] = useState(false)
  const [rawDataUrl, setRawDataUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [compositing, setCompositing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const goBack = () => {
    setPendingSlot(null)
    navigate('/ledger')
  }

  const loadFile = async (file: File) => {
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string
      setCompositing(true)
      try {
        const composited = await compositeBoard(raw, useAppStore.getState().board)
        setRawDataUrl(raw)
        setPreview(composited)
      } finally {
        setCompositing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    e.target.value = ''
  }

  // 보드 편집 닫힐 때 원본 있으면 재합성
  const handleEditorClose = async () => {
    setShowEditor(false)
    if (rawDataUrl) {
      setCompositing(true)
      try {
        const composited = await compositeBoard(rawDataUrl, useAppStore.getState().board)
        setPreview(composited)
      } finally {
        setCompositing(false)
      }
    }
  }

  const handleConfirm = () => {
    if (!preview || !rawDataUrl || !pendingSlot) return
    setSlotPhoto(pendingSlot.pageId, pendingSlot.slotIndex, {
      dataUrl: preview,
      originalDataUrl: rawDataUrl,
      board: { ...useAppStore.getState().board },
    })
    setPendingSlot(null)
    navigate('/ledger')
  }

  // 미리보기 화면
  if (preview) {
    return (
      <div className="relative w-full h-full bg-black flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          {compositing ? (
            <div className="w-full h-full flex items-center justify-center text-white text-sm">
              보드 합성 중...
            </div>
          ) : (
            <img src={preview} className="w-full h-full object-contain" />
          )}
        </div>
        <div className="bg-black flex items-center px-6 py-4 gap-3">
          <button
            onClick={() => setShowEditor(true)}
            className="bg-zinc-700 text-white px-4 py-3 rounded-xl text-sm font-medium"
          >
            보드 편집
          </button>
          <button
            onClick={() => { fileInputRef.current?.click() }}
            className="flex-1 bg-zinc-700 text-white py-3 rounded-xl text-sm font-medium"
          >
            다시 선택
          </button>
          <button
            onClick={handleConfirm}
            disabled={compositing}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            저장
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {showEditor && <BoardEditor onClose={handleEditorClose} />}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-zinc-900 flex flex-col">
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-3 z-10">
        <button onClick={goBack} className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium">
          ← 사진대지
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {!pendingSlot ? (
          <div className="text-center text-white">
            <p className="text-base font-bold mb-2">슬롯을 먼저 선택하세요</p>
            <p className="text-sm text-zinc-400 mb-6">사진대지에서 빈 칸을 탭하면 열립니다</p>
            <button onClick={goBack} className="bg-white text-black px-6 py-2 rounded-xl text-sm font-bold">
              사진대지로 이동
            </button>
          </div>
        ) : compositing ? (
          <div className="text-white text-sm">보드 합성 중...</div>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-44 h-44 rounded-3xl border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center gap-3 text-zinc-400 hover:border-zinc-400 hover:text-zinc-300 active:scale-95 transition-all"
            >
              <span className="text-6xl">🖼️</span>
              <span className="text-sm font-medium">사진 선택</span>
            </button>
            <p className="text-zinc-600 text-xs text-center">갤러리에서 사진을 선택해 보드를 합성합니다</p>
          </>
        )}
      </div>

      <div className="bg-black px-6 py-4">
        <button
          onClick={() => setShowEditor(true)}
          disabled={!pendingSlot}
          className="w-full bg-zinc-800 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-40"
        >
          보드 편집
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {showEditor && <BoardEditor onClose={handleEditorClose} />}
    </div>
  )
}
