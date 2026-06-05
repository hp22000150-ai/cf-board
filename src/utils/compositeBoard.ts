import { BoardData } from '../types'

export function rotateImage(dataUrl: string, rotation: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('이미지 로드 실패'))
    img.onload = () => {
      const swapped = rotation === 90 || rotation === 270
      const canvas = document.createElement('canvas')
      canvas.width = swapped ? img.height : img.width
      canvas.height = swapped ? img.width : img.height
      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.src = dataUrl
  })
}

const ROWS: { label: string; key: keyof BoardData }[] = [
  { label: '공사명', key: 'projectName' },
  { label: '공 종', key: 'workType' },
  { label: '위 치', key: 'location' },
  { label: '내 용', key: 'content' },
  { label: '촬영일', key: 'date' },
]

export async function compositeBoard(photoDataUrl: string, board: BoardData): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = () => reject(new Error('이미지 로드 실패'))
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // 보드: 가로 25%, 세로 25% 고정
      const boardWidth = Math.round(img.width * 0.25)
      const boardHeight = Math.round(img.height * 0.30)
      const rowHeight = Math.floor(boardHeight / ROWS.length)
      const fontSize = Math.round(rowHeight * 0.52)
      const labelWidth = Math.round(boardWidth * 0.24)
      const cellPadX = Math.round(rowHeight * 0.15)
      const borderW = Math.max(2, Math.round(img.width * 0.0015))

      // 좌하단 위치
      const boardX = 0
      const boardY = img.height - boardHeight

      // 배경
      ctx.fillStyle = 'white'
      ctx.fillRect(boardX, boardY, boardWidth, boardHeight)

      // 외곽 테두리
      ctx.strokeStyle = 'black'
      ctx.lineWidth = borderW
      ctx.strokeRect(boardX + borderW / 2, boardY + borderW / 2, boardWidth - borderW, boardHeight - borderW)

      ctx.font = `normal ${fontSize}px "Malgun Gothic", "맑은 고딕", sans-serif`
      ctx.textBaseline = 'middle'

      ROWS.forEach(({ label, key }, i) => {
        const y = boardY + i * rowHeight

        // 행 구분선
        if (i > 0) {
          ctx.strokeStyle = 'black'
          ctx.lineWidth = borderW
          ctx.beginPath()
          ctx.moveTo(boardX, y)
          ctx.lineTo(boardX + boardWidth, y)
          ctx.stroke()
        }

        // 라벨 | 값 구분선
        ctx.strokeStyle = 'black'
        ctx.lineWidth = borderW
        ctx.beginPath()
        ctx.moveTo(boardX + labelWidth, y)
        ctx.lineTo(boardX + labelWidth, y + rowHeight)
        ctx.stroke()

        // 라벨 텍스트
        ctx.fillStyle = 'black'
        ctx.textAlign = 'center'
        ctx.fillText(label, boardX + labelWidth / 2, y + rowHeight / 2)

        // 값 텍스트
        ctx.textAlign = 'left'
        const value = board[key] || ''
        ctx.fillText(value, boardX + labelWidth + cellPadX, y + rowHeight / 2)
      })

      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.src = photoDataUrl
  })
}
