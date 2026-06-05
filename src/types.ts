export interface BoardData {
  projectName: string
  workType: string
  location: string
  content: string
  date: string
  photographer: string
}

export interface SavedPhoto {
  id: string
  dataUrl: string        // 보드 합성된 최종 이미지
  originalDataUrl: string // 보드 없는 원본
  board: BoardData
  createdAt: string
  rotation: 0 | 90 | 180 | 270
}

export interface PageData {
  id: string
  slotCount: 2 | 3
  slots: Array<SavedPhoto | null>
}

export interface Project {
  id: string
  name: string
  pages: PageData[]
  perPage: 2 | 3
  createdAt: string
}
