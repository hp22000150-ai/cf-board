import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, buildSerialMap, selectCurrentProject } from '../store'
import { IS_PC } from '../App'
import { PageData, SavedPhoto } from '../types'
import { exportA4Page } from '../utils/exportA4'
import { exportAllAsPDF, printAllPages } from '../utils/exportPDF'
import SlotBoardEditor from '../components/SlotBoardEditor'
import { rotateImage, compositeBoard } from '../utils/compositeBoard'

export default function LedgerPage() {
  const navigate = useNavigate()
  const store = useAppStore()
  const project = selectCurrentProject(store)
  const { inputMode, setInputMode } = useAppStore()

  const [exporting, setExporting] = useState<'pdf' | 'jpg' | 'print' | null>(null)
  const [swapMode, setSwapMode] = useState(false)
  const [swapSrc, setSwapSrc] = useState<{ pageId: string; slotIndex: number } | null>(null)
  const [editTarget, setEditTarget] = useState<{ pageId: string; slotIndex: number; photo: SavedPhoto } | null>(null)

  const serialMap = useMemo(
    () => buildSerialMap(project?.pages ?? []),
    [project?.pages]
  )

  if (!project) return null

  const { pages, perPage } = project

  const handleSelectSlot = (pageId: string, slotIndex: number) => {
    store.setPendingSlot({ pageId, slotIndex })
    navigate(IS_PC || inputMode === 'gallery' ? '/gallery' : '/camera')
  }

  const handleRotateSlot = async (pageId: string, slotIndex: number) => {
    const page = project.pages.find((p) => p.id === pageId)
    const photo = page?.slots[slotIndex]
    if (!photo?.originalDataUrl) {
      store.rotateSlot(pageId, slotIndex)  // 원본 없는 구버전: CSS 회전만
      return
    }
    const newRotation = (((photo.rotation ?? 0) + 90) % 360) as 0 | 90 | 180 | 270
    const rotated = await rotateImage(photo.originalDataUrl, newRotation)
    const newDataUrl = await compositeBoard(rotated, photo.board)
    store.updateSlotPhoto(pageId, slotIndex, newDataUrl, photo.board, newRotation)
  }

  const handleSwapTap = (pageId: string, slotIndex: number) => {
    if (!swapSrc) {
      // 첫 번째 탭: 소스 선택 (사진 있는 슬롯만)
      const page = pages.find((p) => p.id === pageId)
      if (!page?.slots[slotIndex]) return
      setSwapSrc({ pageId, slotIndex })
    } else {
      // 두 번째 탭: 교체
      if (swapSrc.pageId === pageId && swapSrc.slotIndex === slotIndex) {
        setSwapSrc(null) // 같은 슬롯이면 취소
      } else {
        store.swapSlots(swapSrc.pageId, swapSrc.slotIndex, pageId, slotIndex)
        setSwapSrc(null)
      }
    }
  }

  const handleExportPDF = async () => {
    setExporting('pdf')
    try { await exportAllAsPDF(pages, serialMap) } finally { setExporting(null) }
  }


  const handlePrint = async () => {
    setExporting('print')
    try { await printAllPages(pages, serialMap) } finally { setExporting(null) }
  }

  return (
    <div className="h-full bg-gray-200 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-300 shrink-0">
        <button onClick={() => navigate('/')} className="text-gray-700 text-xl shrink-0 leading-none">⚙️</button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm leading-tight truncate">{project.name}</h1>
          <p className="text-[9px] text-gray-400 tracking-widest">CONTENT FACTORY</p>
        </div>
        {/* 입력 모드 토글 (모바일 빌드에서만 표시) */}
        {!IS_PC && (
          <button
            onClick={() => setInputMode(inputMode === 'camera' ? 'gallery' : 'camera')}
            className="text-lg px-1"
            title={inputMode === 'camera' ? '카메라 모드' : '갤러리 모드'}
          >
            {inputMode === 'camera' ? '📷' : '🖼️'}
          </button>
        )}
        {/* 이동 모드 토글 */}
        <button
          onClick={() => { setSwapMode((v) => !v); setSwapSrc(null) }}
          className={`text-xs font-bold px-2 py-1 rounded-lg border ${
            swapMode ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-400'
          }`}
        >
          이동
        </button>
        {/* 2단/3단 */}
        <div className="flex border border-gray-400 rounded overflow-hidden text-xs font-bold shrink-0">
          <button
            onClick={() => store.setPerPage(2)}
            className={`px-2 py-1 ${perPage === 2 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
          >2단</button>
          <button
            onClick={() => store.setPerPage(3)}
            className={`px-2 py-1 border-l border-gray-400 ${perPage === 3 ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
          >3단</button>
        </div>
      </div>

      {/* 이동 모드 안내 */}
      {swapMode && (
        <div className="bg-orange-50 border-b border-orange-200 px-3 py-1.5 shrink-0">
          <p className="text-xs text-orange-600 text-center">
            {swapSrc ? '교체할 위치를 탭하세요' : '이동할 사진을 탭하세요'}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col w-full max-w-sm mx-auto overflow-hidden px-3">

          {/* 전체 내보내기 */}
          {pages.length > 0 && !swapMode && (
            <div className="flex gap-2 py-2 shrink-0">
              <button
                onClick={handleExportPDF}
                disabled={!!exporting}
                className="flex-1 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {exporting === 'pdf' ? '생성 중...' : 'PDF 저장'}
              </button>
              {IS_PC && (
                <button
                  onClick={handlePrint}
                  disabled={!!exporting}
                  className="flex-1 py-2 text-xs font-bold bg-green-600 text-white rounded-lg disabled:opacity-50"
                >
                  {exporting === 'print' ? '준비 중...' : '🖨️ 인쇄'}
                </button>
              )}
            </div>
          )}

          {/* A4 페이지 목록 */}
          <div className="flex-1 overflow-y-auto space-y-4 py-3">
            {pages.map((page, idx) => (
              <A4PageCard
                key={page.id}
                page={page}
                pageNumber={idx + 1}
                swapMode={swapMode}
                swapSrcId={swapSrc?.pageId === page.id ? swapSrc.slotIndex : -1}
                serialMap={serialMap}
                onSelectSlot={(si) => swapMode ? handleSwapTap(page.id, si) : handleSelectSlot(page.id, si)}
                onClearSlot={(si) => { if (confirm('이 사진을 삭제하시겠습니까?')) store.clearSlot(page.id, si) }}
                onRotateSlot={(si) => handleRotateSlot(page.id, si)}
                onEditBoard={(si, photo) => setEditTarget({ pageId: page.id, slotIndex: si, photo })}
                onDeletePage={() => { if (confirm('이 페이지를 삭제하시겠습니까?')) store.deletePage(page.id) }}
                onExport={() => exportA4Page(page.slots, page.slotCount, idx + 1, serialMap)}
              />
            ))}
            <button
              onClick={store.addPage}
              className="w-full py-3 border-2 border-dashed border-gray-400 text-gray-500 text-sm rounded bg-white/50"
            >
              + 페이지 추가
            </button>
          </div>

        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-50">
          <SlotBoardEditor
            photo={editTarget.photo}
            pageId={editTarget.pageId}
            slotIndex={editTarget.slotIndex}
            onClose={() => setEditTarget(null)}
          />
        </div>
      )}
    </div>
  )
}

function A4PageCard({
  page, pageNumber, swapMode, swapSrcId, serialMap,
  onSelectSlot, onClearSlot, onRotateSlot, onEditBoard, onDeletePage, onExport,
}: {
  page: PageData
  pageNumber: number
  swapMode: boolean
  swapSrcId: number
  serialMap: Map<string, number>
  onSelectSlot: (si: number) => void
  onClearSlot: (si: number) => void
  onRotateSlot: (si: number) => void
  onEditBoard: (si: number, photo: SavedPhoto) => void
  onDeletePage: () => void
  onExport: () => void
}) {
  return (
    <div
      className="bg-white border-2 border-gray-700 shadow-lg overflow-hidden flex flex-col w-full"
      style={{ aspectRatio: '210 / 297' }}
    >
      <div className="flex items-center justify-between px-3 border-b-2 border-gray-700 shrink-0" style={{ height: '5%' }}>
        <span className="font-black text-xs tracking-[6px]">사진대지</span>
        <span className="text-gray-400 text-[10px]">p.{pageNumber}</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 divide-y divide-gray-300">
        {page.slots.map((photo, i) => (
          <SlotCell
            key={i}
            photo={photo}
            serial={photo ? serialMap.get(photo.id) : undefined}
            isSwapSelected={swapSrcId === i}
            swapMode={swapMode}
            onSelect={() => onSelectSlot(i)}
            onClear={() => onClearSlot(i)}
            onRotate={() => onRotateSlot(i)}
            onEditBoard={() => photo && onEditBoard(i, photo)}
          />
        ))}
      </div>

      <div className="border-t-2 border-gray-700 shrink-0 flex" style={{ height: '7%' }}>
        <button onClick={onDeletePage} className="flex-1 h-full text-xs font-bold text-red-500 border-r border-gray-300">
          페이지 삭제
        </button>
        <button onClick={onExport} className="flex-1 h-full text-xs font-bold text-blue-600">
          A4 저장
        </button>
      </div>
    </div>
  )
}

function SlotCell({
  photo, serial, isSwapSelected, swapMode, onSelect, onClear, onRotate, onEditBoard,
}: {
  photo: SavedPhoto | null
  serial: number | undefined
  isSwapSelected: boolean
  swapMode: boolean
  onSelect: () => void
  onClear: () => void
  onRotate: () => void
  onEditBoard: () => void
}) {
  if (photo) {
    // originalDataUrl이 있는 신규 사진은 회전이 dataUrl에 구워져 있어 CSS 회전 불필요
    // originalDataUrl 없는 구버전 사진은 CSS 회전 폴백
    const cssRot = photo.originalDataUrl ? 0 : (photo.rotation ?? 0)
    return (
      <div
        className={`flex-1 relative bg-white min-h-0 overflow-hidden ${isSwapSelected ? 'ring-2 ring-orange-400 ring-inset' : ''}`}
        onClick={swapMode ? onSelect : undefined}
      >
        <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: '0.5px', bottom: '0.5px' }}>
          <img
            src={photo.dataUrl}
            className="object-contain"
            style={{
              transform: cssRot ? `rotate(${cssRot}deg)` : undefined,
              width: '100%',
              height: '100%',
            }}
          />
        </div>
        {/* 연번 배지 */}
        {serial !== undefined && (
          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
            No.{serial}
          </div>
        )}
        {/* 일반 모드 버튼 */}
        {!swapMode && (
          <>
            <button onClick={onRotate} className="absolute top-1 left-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-10">↻</button>
            <button onClick={onEditBoard} className="absolute top-1 left-7 bg-black/60 text-white rounded-full w-5 h-5 text-[9px] flex items-center justify-center z-10">✏️</button>
            <button onClick={onClear} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center z-10">×</button>
          </>
        )}
        {/* 이동 모드: 선택 표시 */}
        {swapMode && isSwapSelected && (
          <div className="absolute inset-0 bg-orange-400/20 flex items-center justify-center z-10">
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">선택됨</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-blue-50 active:bg-blue-100 transition-colors"
    >
      <span className="text-gray-300 text-3xl leading-none">{swapMode ? '⇄' : '+'}</span>
      <span className="text-gray-400 text-[10px]">{swapMode ? '여기로 이동' : '탭하여 촬영'}</span>
    </button>
  )
}
