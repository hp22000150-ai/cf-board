import { jsPDF } from 'jspdf'
import { PageData } from '../types'
import { renderPageCanvas } from './exportA4'

export async function exportAllAsPDF(
  pages: PageData[],
  serials?: Map<string, number>
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const canvas = await renderPageCanvas(page.slots, page.slotCount, i + 1, serials)
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    if (i > 0) pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
  }

  pdf.save('사진대지.pdf')
}

export async function printAllPages(
  pages: PageData[],
  serials?: Map<string, number>
): Promise<void> {
  const dataUrls: string[] = []
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const canvas = await renderPageCanvas(page.slots, page.slotCount, i + 1, serials)
    dataUrls.push(canvas.toDataURL('image/jpeg', 0.95))
  }

  const win = window.open('', '_blank')
  if (!win) return

  const imgs = dataUrls
    .map((src) => `<img src="${src}" style="width:210mm;height:297mm;display:block;page-break-after:always;" />`)
    .join('')

  win.document.write(`<!DOCTYPE html><html><head>
    <title>사진대지 인쇄</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: A4; margin: 0; }
      body { background: white; }
      img { object-fit: contain; }
    </style>
  </head><body>${imgs}</body></html>`)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

export async function exportAllAsJpg(
  pages: PageData[],
  serials?: Map<string, number>
): Promise<void> {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const canvas = await renderPageCanvas(page.slots, page.slotCount, i + 1, serials)
    const link = document.createElement('a')
    link.download = `사진대지-p${i + 1}.jpg`
    link.href = canvas.toDataURL('image/jpeg', 0.92)
    link.click()
    await new Promise((r) => setTimeout(r, 300))
  }
}
