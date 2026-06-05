import { SavedPhoto } from '../types'

const A4_W = 1240
const A4_H = 1754
const MARGIN = 50
const HEADER_H = 80
const GAP = 8

export async function renderPageCanvas(
  slots: Array<SavedPhoto | null>,
  slotCount: 2 | 3,
  pageNumber: number,
  serials?: Map<string, number>
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = A4_W
  canvas.height = A4_H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, A4_W, A4_H)

  ctx.strokeStyle = '#222'
  ctx.lineWidth = 2
  ctx.strokeRect(MARGIN, MARGIN, A4_W - MARGIN * 2, A4_H - MARGIN * 2)

  ctx.fillStyle = '#111'
  ctx.font = `bold 40px "Malgun Gothic", "맑은 고딕", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('사  진  대  지', A4_W / 2, MARGIN + HEADER_H / 2)

  ctx.font = `16px Arial, sans-serif`
  ctx.fillStyle = '#555'
  ctx.textAlign = 'right'
  ctx.fillText('CONTENT FACTORY', A4_W - MARGIN - 4, MARGIN + HEADER_H - 14)

  ctx.strokeStyle = '#222'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(MARGIN, MARGIN + HEADER_H)
  ctx.lineTo(A4_W - MARGIN, MARGIN + HEADER_H)
  ctx.stroke()

  const photoAreaY = MARGIN + HEADER_H + GAP
  const photoAreaH = A4_H - photoAreaY - MARGIN - GAP
  const slotH = Math.floor((photoAreaH - GAP * (slotCount - 1)) / slotCount)
  const photoW = A4_W - MARGIN * 2
  const photoPadY = 4

  for (let i = 0; i < slotCount; i++) {
    const slotY = photoAreaY + i * (slotH + GAP)

    if (i > 0) {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(MARGIN, slotY - GAP / 2)
      ctx.lineTo(MARGIN + photoW, slotY - GAP / 2)
      ctx.stroke()
    }

    const photo = slots[i]
    if (photo) {
      // originalDataUrl 있는 신규 사진은 회전이 dataUrl에 구워져 있음
      const exportRotation = photo.originalDataUrl ? 0 : (photo.rotation ?? 0)
      await drawContainImage(
        ctx, photo.dataUrl,
        MARGIN, slotY + photoPadY, photoW, slotH - photoPadY * 2,
        exportRotation
      )

      // 연번 배지
      if (serials) {
        const no = serials.get(photo.id)
        if (no !== undefined) {
          const badgeW = 100
          const badgeH = 36
          const bx = MARGIN + 8
          const by = slotY + photoPadY + 8
          ctx.fillStyle = 'rgba(0,0,0,0.65)'
          ctx.beginPath()
          ctx.roundRect(bx, by, badgeW, badgeH, 6)
          ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.font = `bold 22px Arial, sans-serif`
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(`No.${no}`, bx + 10, by + badgeH / 2)
        }
      }
    } else {
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(MARGIN, slotY, photoW, slotH)
      ctx.fillStyle = '#bbb'
      ctx.font = `24px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('사진 없음', A4_W / 2, slotY + slotH / 2)
    }
  }

  return canvas
}

export async function exportA4Page(
  slots: Array<SavedPhoto | null>,
  slotCount: 2 | 3,
  pageNumber: number,
  serials?: Map<string, number>
): Promise<void> {
  const canvas = await renderPageCanvas(slots, slotCount, pageNumber, serials)
  const link = document.createElement('a')
  link.download = `사진대지-p${pageNumber}.jpg`
  link.href = canvas.toDataURL('image/jpeg', 0.92)
  link.click()
}

function drawContainImage(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number, y: number, w: number, h: number,
  rotation: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const swapped = rotation === 90 || rotation === 270
      const fitW = swapped ? img.height : img.width
      const fitH = swapped ? img.width : img.height
      const scale = Math.min(w / fitW, h / fitH)
      const dw = img.width * scale
      const dh = img.height * scale

      ctx.save()
      ctx.translate(x + w / 2, y + h / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
      ctx.restore()
      resolve()
    }
    img.src = src
  })
}
