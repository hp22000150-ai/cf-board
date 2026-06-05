import { BoardData } from '../types'

interface Props {
  board: BoardData
  forCapture?: boolean
}

const ROWS = [
  { label: '공사명', key: 'projectName' as const },
  { label: '공 종', key: 'workType' as const },
  { label: '위 치', key: 'location' as const },
  { label: '내 용', key: 'content' as const },
  { label: '촬영일', key: 'date' as const },
]

export default function OverlayBoard({ board, forCapture = false }: Props) {
  const base = forCapture
    ? 'absolute bottom-0 left-0 bg-white border-2 border-black text-black'
    : 'absolute bottom-0 left-0 bg-white border-2 border-black text-black shadow-lg'

  return (
    <div className={`${base} font-normal`} style={{ width: '25%', height: '30%', minWidth: 100 }}>
      <table className="w-full h-full border-collapse">
        <tbody className="h-full">
          {ROWS.map(({ label, key }) => (
            <tr key={key} className="border-b border-black last:border-b-0" style={{ height: '20%' }}>
              <td className="border-r border-black px-1 whitespace-nowrap w-[24%] text-center leading-none" style={{ fontSize: '55%' }}>
                {label}
              </td>
              <td className="px-1 leading-none break-keep" style={{ fontSize: '55%' }}>
                {board[key] || <span className="text-gray-400 font-normal">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
