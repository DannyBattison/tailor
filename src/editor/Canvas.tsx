import { useEffect, useRef, useState } from 'react'
import { fontKey, fontSpec, fontsUrl, loadFont } from '../gen/fonts'
import { DOC_CSS } from '../render/css'
import { DocView } from '../render/Doc'
import { useStore, type Viewport } from '../store'

export const VIEWPORT_W: Record<Viewport, number> = { desktop: 1280, tablet: 820, mobile: 390 }

/** Read-only preview of the design, scaled to fit. */
export function Canvas() {
  const { doc, ui } = useStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState(1000)
  const [stageH, setStageH] = useState(0)

  const width = VIEWPORT_W[ui.viewport]
  const scale = Math.min(1, (avail - 40) / width)

  const fonts = fontSpec(doc.tokens)
  useEffect(() => { loadFont(fonts) }, [fontKey(fonts)]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const ro = new ResizeObserver(() => setAvail(scrollRef.current?.clientWidth ?? 1000))
    ro.observe(scrollRef.current!)
    return () => ro.disconnect()
  }, [])
  // the stage is scaled with a transform, so its wrapper has to be sized by hand (fonts loading and FAQs opening change the height too)
  useEffect(() => {
    const ro = new ResizeObserver(() => setStageH(stageRef.current?.offsetHeight ?? 0))
    ro.observe(stageRef.current!)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="canvas-scroll" ref={scrollRef}>
      <link rel="stylesheet" href={fontsUrl(fonts)} />
      <style>{DOC_CSS}</style>
      <div className="stage-wrap" style={{ width: width * scale, height: stageH * scale || undefined }}>
        <div ref={stageRef} className="stage" style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }} data-testid="stage">
          <DocView key={ui.replay} root={doc.root} tokens={doc.tokens} wire={ui.wire} />
        </div>
      </div>
    </div>
  )
}
