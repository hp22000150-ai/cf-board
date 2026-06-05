import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BoardData, PageData, Project, SavedPhoto } from './types'
import { format } from 'date-fns'

interface PendingSlot { pageId: string; slotIndex: number }

interface AppState {
  board: BoardData
  projects: Project[]
  currentProjectId: string
  pendingSlot: PendingSlot | null
  inputMode: 'camera' | 'gallery'

  // 보드
  setBoard: (data: Partial<BoardData>) => void

  // 프로젝트
  createProject: (name: string) => string
  selectProject: (id: string) => void
  deleteProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  importProjects: (incoming: Project[]) => void

  // 현재 프로젝트 - 페이지
  setPerPage: (n: 2 | 3) => void
  addPage: () => void
  deletePage: (pageId: string) => void

  // 현재 프로젝트 - 슬롯
  setSlotPhoto: (pageId: string, slotIndex: number, data: { dataUrl: string; originalDataUrl: string; board: BoardData }) => void
  updateSlotPhoto: (pageId: string, slotIndex: number, dataUrl: string, board: BoardData, rotation?: 0 | 90 | 180 | 270) => void
  clearSlot: (pageId: string, slotIndex: number) => void
  rotateSlot: (pageId: string, slotIndex: number) => void
  swapSlots: (srcPageId: string, srcIdx: number, dstPageId: string, dstIdx: number) => void

  setPendingSlot: (slot: PendingSlot | null) => void
  setInputMode: (mode: 'camera' | 'gallery') => void
}

const defaultBoard: BoardData = {
  projectName: '',
  workType: '',
  location: '',
  content: '',
  date: format(new Date(), 'yyyy.MM.dd'),
  photographer: '',
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2)
}

function makeEmptyPage(slotCount: 2 | 3): PageData {
  return { id: makeId(), slotCount, slots: Array(slotCount).fill(null) }
}

function makeProject(name: string, perPage: 2 | 3 = 2): Project {
  return {
    id: makeId(),
    name,
    pages: [makeEmptyPage(perPage)],
    perPage,
    createdAt: new Date().toISOString(),
  }
}

// 현재 프로젝트 페이지 업데이트 헬퍼
function updatePages(
  state: AppState,
  updater: (pages: PageData[]) => PageData[]
): { projects: Project[] } {
  return {
    projects: state.projects.map((p) =>
      p.id === state.currentProjectId ? { ...p, pages: updater(p.pages) } : p
    ),
  }
}

const defaultProject = makeProject('기본 현장')

export const useAppStore = create<AppState>()(
  persist<AppState>(
    (set, get) => ({
      board: defaultBoard,
      projects: [defaultProject],
      currentProjectId: defaultProject.id,
      pendingSlot: null,
      inputMode: 'camera',

      setBoard: (data) =>
        set((s) => ({ board: { ...s.board, ...data } })),

      createProject: (name) => {
        const proj = makeProject(name)
        set((s) => ({ projects: [...s.projects, proj] }))
        return proj.id
      },

      selectProject: (id) => set({ currentProjectId: id }),

      deleteProject: (id) =>
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== id)
          if (remaining.length === 0) {
            const fresh = makeProject('기본 현장')
            return { projects: [fresh], currentProjectId: fresh.id }
          }
          const newCurrent =
            s.currentProjectId === id ? remaining[0].id : s.currentProjectId
          return { projects: remaining, currentProjectId: newCurrent }
        }),

      renameProject: (id, name) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      importProjects: (incoming) =>
        set((s) => {
          const existingIds = new Set(s.projects.map((p) => p.id))
          const newOnes = incoming.filter((p) => !existingIds.has(p.id))
          const merged = [...s.projects, ...newOnes]
          return { projects: merged, currentProjectId: merged[0]?.id ?? s.currentProjectId }
        }),

      setPerPage: (n) =>
        set((s) => {
          const updated = updatePages(s, (pages) =>
            pages.map((page) => {
              if (page.slotCount === n) return page
              const slots = Array(n).fill(null).map((_, i) => page.slots[i] ?? null)
              return { ...page, slotCount: n, slots }
            })
          )
          return {
            projects: updated.projects.map((p) =>
              p.id === s.currentProjectId ? { ...p, perPage: n } : p
            ),
          }
        }),

      addPage: () =>
        set((s) => {
          const proj = s.projects.find((p) => p.id === s.currentProjectId)
          return updatePages(s, (pages) => [...pages, makeEmptyPage(proj?.perPage ?? 2)])
        }),

      deletePage: (pageId) =>
        set((s) => updatePages(s, (pages) => pages.filter((p) => p.id !== pageId))),

      setSlotPhoto: (pageId, slotIndex, data) => {
        const photo: SavedPhoto = {
          id: makeId(),
          dataUrl: data.dataUrl,
          originalDataUrl: data.originalDataUrl,
          board: data.board,
          createdAt: new Date().toISOString(),
          rotation: 0,
        }
        set((s) =>
          updatePages(s, (pages) =>
            pages.map((page) => {
              if (page.id !== pageId) return page
              const slots = [...page.slots]
              slots[slotIndex] = photo
              return { ...page, slots }
            })
          )
        )
      },

      updateSlotPhoto: (pageId, slotIndex, dataUrl, board, rotation?) =>
        set((s) =>
          updatePages(s, (pages) =>
            pages.map((page) => {
              if (page.id !== pageId) return page
              const slots = [...page.slots]
              const photo = slots[slotIndex]
              if (!photo) return page
              slots[slotIndex] = {
                ...photo, dataUrl, board,
                ...(rotation !== undefined ? { rotation } : {}),
              }
              return { ...page, slots }
            })
          )
        ),

      clearSlot: (pageId, slotIndex) =>
        set((s) =>
          updatePages(s, (pages) =>
            pages.map((page) => {
              if (page.id !== pageId) return page
              const slots = [...page.slots]
              slots[slotIndex] = null
              return { ...page, slots }
            })
          )
        ),

      rotateSlot: (pageId, slotIndex) =>
        set((s) =>
          updatePages(s, (pages) =>
            pages.map((page) => {
              if (page.id !== pageId) return page
              const slots = [...page.slots]
              const photo = slots[slotIndex]
              if (!photo) return page
              slots[slotIndex] = {
                ...photo,
                rotation: (((photo.rotation ?? 0) + 90) % 360) as 0 | 90 | 180 | 270,
              }
              return { ...page, slots }
            })
          )
        ),

      swapSlots: (srcPageId, srcIdx, dstPageId, dstIdx) =>
        set((s) =>
          updatePages(s, (pages) => {
            const srcPage = pages.find((p) => p.id === srcPageId)
            const dstPage = pages.find((p) => p.id === dstPageId)
            if (!srcPage || !dstPage) return pages
            const srcPhoto = srcPage.slots[srcIdx]
            const dstPhoto = dstPage.slots[dstIdx]
            return pages.map((page) => {
              if (page.id === srcPageId && page.id === dstPageId) {
                const slots = [...page.slots]
                slots[srcIdx] = dstPhoto
                slots[dstIdx] = srcPhoto
                return { ...page, slots }
              }
              if (page.id === srcPageId) {
                const slots = [...page.slots]
                slots[srcIdx] = dstPhoto
                return { ...page, slots }
              }
              if (page.id === dstPageId) {
                const slots = [...page.slots]
                slots[dstIdx] = srcPhoto
                return { ...page, slots }
              }
              return page
            })
          })
        ),

      setPendingSlot: (slot) => set({ pendingSlot: slot }),
      setInputMode: (mode) => set({ inputMode: mode }),
    }),
    { name: 'cf-board-v3' }
  )
)

// 현재 프로젝트 선택자
export function selectCurrentProject(state: AppState): Project | undefined {
  return state.projects.find((p) => p.id === state.currentProjectId)
}

// 연번 맵 빌더 (photoId → 순번)
export function buildSerialMap(pages: PageData[]): Map<string, number> {
  const map = new Map<string, number>()
  let n = 0
  for (const page of pages) {
    for (const slot of page.slots) {
      if (slot) map.set(slot.id, ++n)
    }
  }
  return map
}
