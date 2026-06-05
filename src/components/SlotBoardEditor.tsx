import { useRef, useState } from 'react'
import { format, parse, isValid } from 'date-fns'
import { BoardData, SavedPhoto } from '../types'
import { compositeBoard, rotateImage } from '../utils/compositeBoard'
import { useAppStore } from '../store'

interface Props {
  photo: SavedPhoto
  pageId: string
  slotIndex: number
  onClose: () => void
}

const FIELDS = [
  { label: '공사명', key: 'projectName' as const },
  { label: '공 종', key: 'workType' as const },
  { label: '위 치', key: 'location' as const },
  { label: '내 용', key: 'content' as const },
  { label: '촬영일', key: 'date' as const },
]

function toInputValue(display: string) {
  const d = parse(display, 'yyyy.MM.dd', new Date())
  return isValid(d) ? format(d, 'yyyy-MM-dd') : ''
}
function toDisplay(inputVal: string) {
  const d = parse(inputVal, 'yyyy-MM-dd', new Date())
  return isValid(d) ? format(d, 'yyyy.MM.dd') : inputVal
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`,
    { headers: { 'Accept-Language': 'ko' } },
  )
  if (!res.ok) throw new Error('geocode failed')
  const data = await res.json() as {
    address: {
      city?: string; town?: string; village?: string; county?: string;
      suburb?: string; neighbourhood?: string; road?: string; quarter?: string;
    }
  }
  const a = data.address
  const parts = [
    a.city ?? a.town ?? a.county ?? a.village,
    a.suburb ?? a.quarter ?? a.neighbourhood,
    a.road,
  ].filter(Boolean)
  return parts.join(' ')
}

export default function SlotBoardEditor({ photo, pageId, slotIndex, onClose }: Props) {
  const { updateSlotPhoto } = useAppStore()
  const [board, setBoard] = useState<BoardData>({ ...photo.board })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const datePickerRef = useRef<HTMLInputElement>(null)

  const setField = (partial: Partial<BoardData>) =>
    setBoard((prev) => ({ ...prev, ...partial }))

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocError('위치 서비스를 지원하지 않는 브라우저입니다.')
      return
    }
    setLocLoading(true)
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          setField({ location: address })
        } catch {
          setLocError('주소 변환 실패. 직접 입력해 주세요.')
        } finally {
          setLocLoading(false)
        }
      },
      () => {
        setLocError('위치 권한을 허용해 주세요.')
        setLocLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleConfirm = async () => {
    if (!photo.originalDataUrl) {
      setSaveError('원본 사진이 없어 보드를 재합성할 수 없습니다. (이 기능 추가 전에 촬영된 사진)')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const rotation = photo.rotation ?? 0
      const source = rotation ? await rotateImage(photo.originalDataUrl, rotation) : photo.originalDataUrl
      const newDataUrl = await compositeBoard(source, board)
      updateSlotPhoto(pageId, slotIndex, newDataUrl, board)
      onClose()
    } catch {
      setSaveError('재합성 실패. 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full bg-zinc-900 rounded-t-2xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-bold">보드 편집</h2>
          <button onClick={onClose} className="text-zinc-400 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {FIELDS.map(({ label, key }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-zinc-400 text-sm w-12 shrink-0">{label}</span>
              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={board[key]}
                  onChange={(e) => setField({ [key]: e.target.value })}
                />

                {key === 'location' && (
                  <button
                    onClick={getLocation}
                    disabled={locLoading}
                    className="shrink-0 bg-zinc-700 text-white px-3 py-2 rounded-lg text-base leading-none disabled:opacity-50"
                    title="현재 위치 자동 입력"
                  >
                    {locLoading ? '⏳' : '📍'}
                  </button>
                )}

                {key === 'date' && (
                  <>
                    <button
                      onClick={() => datePickerRef.current?.showPicker()}
                      className="shrink-0 bg-zinc-700 text-white px-3 py-2 rounded-lg text-base leading-none"
                    >
                      📅
                    </button>
                    <input
                      ref={datePickerRef}
                      type="date"
                      className="sr-only"
                      value={toInputValue(board.date)}
                      onChange={(e) => setField({ date: toDisplay(e.target.value) })}
                    />
                  </>
                )}
              </div>
            </div>
          ))}

          {locError && (
            <p className="text-red-400 text-xs pl-1">{locError}</p>
          )}
        </div>

        {saveError && (
          <p className="mt-3 text-red-400 text-xs text-center">{saveError}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={saving}
          className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-60"
        >
          {saving ? '재합성 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
