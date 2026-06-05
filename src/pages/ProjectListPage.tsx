import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { Project } from '../types'

export default function ProjectListPage() {
  const navigate = useNavigate()
  const { projects, createProject, selectProject, deleteProject, renameProject, importProjects } = useAppStore()
  const [showNew, setShowNew] = useState(false)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  const handleExportJSON = () => {
    const json = JSON.stringify({ projects }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cf-board-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as { projects?: Project[] }
        if (!Array.isArray(data.projects)) throw new Error()
        importProjects(data.projects)
        alert(`${data.projects.length}개 현장을 불러왔습니다.`)
      } catch {
        alert('올바르지 않은 파일입니다.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    const id = createProject(name)
    selectProject(id)
    setNewName('')
    setShowNew(false)
    navigate('/ledger')
  }

  const handleSelect = (id: string) => {
    selectProject(id)
    navigate('/ledger')
  }

  const handleRenameStart = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const handleRenameConfirm = () => {
    if (editingId && editName.trim()) {
      renameProject(editingId, editName.trim())
    }
    setEditingId(null)
  }

  const photoCount = (id: string) => {
    const proj = projects.find((p) => p.id === id)
    return proj?.pages.reduce((acc, page) => acc + page.slots.filter(Boolean).length, 0) ?? 0
  }

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-black text-base tracking-tight">CF BOARD</h1>
            <p className="text-[9px] text-gray-400 tracking-widest">CONTENT FACTORY</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportJSON}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600 font-medium"
            >
              JSON 내보내기
            </button>
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600 font-medium"
            >
              JSON 불러오기
            </button>
            <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
          </div>
        </div>
      </div>

      {/* 현장 목록 */}
      <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-2">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {editingId === proj.id ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleRenameConfirm}
                  className="text-xs font-bold text-blue-600"
                >
                  완료
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={() => handleSelect(proj.id)}
                  className="flex-1 text-left px-4 py-3"
                >
                  <p className="font-bold text-sm">{proj.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    사진 {photoCount(proj.id)}장 · {new Date(proj.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </button>
                <div className="flex items-center gap-1 pr-3">
                  <button
                    onClick={() => handleRenameStart(proj.id, proj.name)}
                    className="text-[11px] text-gray-400 px-2 py-1"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`"${proj.name}" 현장을 삭제하시겠습니까?`)) {
                        deleteProject(proj.id)
                      }
                    }}
                    className="text-[11px] text-red-400 px-2 py-1"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 새 현장 추가 */}
        {showNew ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 space-y-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="현장명 입력"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowNew(false); setNewName('') }}
                className="flex-1 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg"
              >
                만들기
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-400 text-sm rounded-xl bg-white/60"
          >
            + 새 현장 추가
          </button>
        )}
      </div>
      </div>
    </div>
  )
}
