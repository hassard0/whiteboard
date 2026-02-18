import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Highlighter, Trash2, Palette, ChevronDown, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import mermaid from "mermaid";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiagramOption {
  id: string;
  name: string;
  svg: string;
  diagram?: string;
}

interface WhiteboardModalProps {
  diagrams: DiagramOption[];
  onClose: () => void;
}

type Tool = "draw" | "highlight" | "erase";

// ─── Palette colours ─────────────────────────────────────────────────────────

const PALETTE = [
  { label: "Purple",  value: "hsl(262 83% 68%)" },
  { label: "Teal",    value: "hsl(174 62% 57%)" },
  { label: "Gold",    value: "hsl(45 90% 60%)"  },
  { label: "Coral",   value: "hsl(0 72% 65%)"   },
  { label: "Sky",     value: "hsl(200 70% 60%)"  },
  { label: "Green",   value: "hsl(142 60% 55%)"  },
  { label: "White",   value: "hsl(0 0% 95%)"     },
  { label: "Orange",  value: "hsl(25 90% 58%)"   },
];

const BG_OPTIONS = [
  { label: "Dark",     value: "hsl(240 10% 4%)"  },
  { label: "Navy",     value: "hsl(222 47% 8%)"  },
  { label: "Charcoal", value: "hsl(220 13% 12%)" },
  { label: "Slate",    value: "hsl(215 28% 17%)" },
  { label: "White",    value: "hsl(0 0% 97%)"    },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

let wbMermaidCounter = 0;

// ─── Component ───────────────────────────────────────────────────────────────

export function WhiteboardModal({ diagrams, onClose }: WhiteboardModalProps) {
  // Two-canvas approach: bottom = diagram (redrawn on zoom/bg changes), top = annotations (user strokes)
  const diagramCanvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedDiagramIdx, setSelectedDiagramIdx] = useState(0);
  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState(PALETTE[0].value);
  const [bg, setBg] = useState(BG_OPTIONS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDiagramPicker, setShowDiagramPicker] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Local SVG store — seed from pre-rendered cache passed in
  const [svgStore, setSvgStore] = useState<Record<string, string>>(() =>
    Object.fromEntries(diagrams.filter((d) => d.svg).map((d) => [d.id, d.svg]))
  );

  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const canvasSize = useRef({ w: 0, h: 0 });
  // Highlight: snapshot canvas before stroke + accumulate points to draw as one path
  const highlightSnapshot = useRef<ImageData | null>(null);
  const highlightPoints = useRef<{ x: number; y: number }[]>([]);

  // ─── Escape key ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ─── Pre-render all diagrams via Mermaid (sequentially to avoid conflicts) ──
  useEffect(() => {
    const toRender = diagrams.filter((d) => !svgStore[d.id] && d.diagram);
    if (toRender.length === 0) return;

    let cancelled = false;
    const renderNext = async (idx: number) => {
      if (cancelled || idx >= toRender.length) return;
      const d = toRender[idx];
      const diagramText = d.diagram!;
      const id = `wb-mermaid-${++wbMermaidCounter}`;
      try {
        const { svg } = await mermaid.render(id, diagramText);
        if (!cancelled) {
          setSvgStore((prev) => ({ ...prev, [d.id]: svg }));
        }
      } catch (err) {
        console.error(`WhiteboardModal: failed to render diagram "${d.name}"`, err);
      }
      renderNext(idx + 1);
    };
    renderNext(0);
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Draw diagram onto the bottom (diagram) canvas ───────────────────────
  const drawDiagram = useCallback(() => {
    const canvas = diagramCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = canvasSize.current;
    ctx.clearRect(0, 0, w, h);

    // Fill background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const svgStr = svgStore[diagrams[selectedDiagramIdx]?.id ?? ""];
    if (!svgStr) return;

    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      // Use 90% of canvas (much bigger than before)
      const padding = Math.min(w, h) * 0.05;
      const maxW = w - padding * 2;
      const maxH = h - padding * 2;
      // Allow scale > 1 to fill the space
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (w - drawW) / 2;
      const y = (h - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, [diagrams, selectedDiagramIdx, bg, svgStore]);

  // ─── Initialise / resize canvases ────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const dCanvas = diagramCanvasRef.current;
    const aCanvas = annotationCanvasRef.current;
    if (!container || !dCanvas || !aCanvas) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvasSize.current = { w, h };

    dCanvas.width = w;
    dCanvas.height = h;
    aCanvas.width = w;
    aCanvas.height = h;

    drawDiagram();
  }, [drawDiagram]);

  // Redraw diagram when deps change
  useEffect(() => {
    drawDiagram();
  }, [drawDiagram]);

  // Also explicitly redraw when the selected diagram's SVG becomes available
  useEffect(() => {
    const currentId = diagrams[selectedDiagramIdx]?.id;
    if (currentId && svgStore[currentId]) {
      drawDiagram();
    }
  }, [svgStore, selectedDiagramIdx, diagrams, drawDiagram]);

  // ─── Scroll to zoom (centered on cursor) ─────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ─── Pointer helpers — operate on annotation canvas ──────────────────────
  // getBoundingClientRect() returns the *visual* (post-CSS-transform) position,
  // so dividing by zoom converts from visual pixels to canvas pixels.
  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = annotationCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // rect.width is the CSS-transformed width; canvas.width is the real pixel width
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    // Right-click (button 2) → pan mode
    if (e.button === 2) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      annotationCanvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }
    const pos = getPos(e);
    // For highlight: snapshot current canvas so we can redraw the full path each frame
    if (tool === "highlight") {
      const ctx = annotationCanvasRef.current?.getContext("2d");
      if (ctx) {
        highlightSnapshot.current = ctx.getImageData(0, 0, canvasSize.current.w, canvasSize.current.h);
      }
      highlightPoints.current = [pos];
    }
    setIsDrawing(true);
    lastPos.current = pos;
    annotationCanvasRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    // Panning
    if (isPanning.current && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      panStart.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawing || !lastPos.current) return;
    const canvas = annotationCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const pos = getPos(e);

    if (tool === "highlight") {
      // Restore to pre-stroke snapshot and redraw the entire path as one polyline
      highlightPoints.current.push(pos);
      if (highlightSnapshot.current) {
        ctx.putImageData(highlightSnapshot.current, 0, 0);
      }
      const pts = highlightPoints.current;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.globalAlpha = 0.35;
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth * 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (tool === "erase") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = strokeWidth * 6;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    lastPos.current = pos;
  }

  function onPointerUp() {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      return;
    }
    // Commit highlight snapshot
    highlightSnapshot.current = null;
    highlightPoints.current = [];
    setIsDrawing(false);
    lastPos.current = null;
    const ctx = annotationCanvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
  }

  // Clear only the annotation canvas
  function clearCanvas() {
    const ctx = annotationCanvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
  }

  const toolButtons: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "draw",      icon: <Pencil className="h-4 w-4" />,      label: "Draw"      },
    { id: "highlight", icon: <Highlighter className="h-4 w-4" />, label: "Highlight" },
    { id: "erase",     icon: <Trash2 className="h-4 w-4" />,      label: "Erase"     },
  ];

  const selectedDiagram = diagrams[selectedDiagramIdx];
  const currentSvgReady = !!(svgStore[selectedDiagram?.id ?? ""]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative z-10 flex flex-col w-full h-full max-w-[1400px] max-h-[95vh] m-auto rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Toolbar ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/80 flex-wrap">

            {/* Diagram picker */}
            <div className="relative">
              <button
                onClick={() => { setShowDiagramPicker(!showDiagramPicker); setShowBgPicker(false); setShowColorPicker(false); }}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <span className="max-w-[140px] truncate">{selectedDiagram?.name ?? "Select diagram"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {showDiagramPicker && (
                <div className="absolute top-full left-0 mt-1 z-20 min-w-[200px] rounded-xl border border-border bg-card shadow-xl py-1">
                  {diagrams.map((d, i) => (
                    <button
                      key={d.id}
                      onClick={() => { setSelectedDiagramIdx(i); setShowDiagramPicker(false); setPan({ x: 0, y: 0 }); setZoom(1); }}
                      className={cn(
                        "flex w-full items-center px-3 py-2 text-xs text-left hover:bg-accent transition-colors",
                        i === selectedDiagramIdx && "text-primary font-semibold"
                      )}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-border/60" />

            {/* Tools */}
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background p-0.5">
              {toolButtons.map((t) => (
                <button
                  key={t.id}
                  title={t.label}
                  onClick={() => setTool(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                    tool === t.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Stroke width */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Size</span>
              <div className="flex items-center gap-1">
                {[2, 4, 7, 12].map((w) => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={cn(
                      "flex items-center justify-center rounded-full border transition-colors",
                      strokeWidth === w ? "border-primary" : "border-border/60 hover:border-border"
                    )}
                    style={{ width: w + 10, height: w + 10 }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: w,
                        height: w,
                        backgroundColor: strokeWidth === w ? color : "hsl(var(--muted-foreground))",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="h-5 w-px bg-border/60" />

            {/* Colour picker */}
            <div className="relative">
              <button
                title="Pen colour"
                onClick={() => { setShowColorPicker(!showColorPicker); setShowBgPicker(false); setShowDiagramPicker(false); }}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <div className="h-3.5 w-3.5 rounded-full border border-border/60" style={{ backgroundColor: color }} />
                <span className="hidden sm:inline">Colour</span>
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 z-20 rounded-xl border border-border bg-card shadow-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-2 font-medium">Pen</p>
                  <div className="flex flex-wrap gap-1.5 max-w-[160px]">
                    {PALETTE.map((c) => (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                        className={cn(
                          "h-7 w-7 rounded-full border-2 transition-all hover:scale-110",
                          color === c.value ? "border-primary ring-2 ring-primary/40" : "border-transparent"
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Background picker */}
            <div className="relative">
              <button
                title="Canvas background"
                onClick={() => { setShowBgPicker(!showBgPicker); setShowColorPicker(false); setShowDiagramPicker(false); }}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Palette className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Canvas</span>
              </button>
              {showBgPicker && (
                <div className="absolute top-full left-0 mt-1 z-20 rounded-xl border border-border bg-card shadow-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-2 font-medium">Background</p>
                  <div className="flex flex-wrap gap-1.5 max-w-[160px]">
                    {BG_OPTIONS.map((b) => (
                      <button
                        key={b.value}
                        title={b.label}
                        onClick={() => { setBg(b.value); setShowBgPicker(false); }}
                        className={cn(
                          "h-7 w-7 rounded-full border-2 transition-all hover:scale-110",
                          bg === b.value ? "border-primary ring-2 ring-primary/40" : "border-border/60"
                        )}
                        style={{ backgroundColor: b.value }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-border/60" />

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)))}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="min-w-[40px] rounded-md px-1.5 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-center"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)))}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-border/60" />

            {/* Clear */}
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {/* Spacer + hint + Close */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden md:block">
                Scroll to zoom · drag to annotate
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Canvas area ── */}
          <div ref={containerRef} className="flex-1 overflow-hidden relative select-none">
            {!currentSvgReady && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <span className="text-xs text-muted-foreground animate-pulse">Rendering diagram…</span>
              </div>
            )}

            {/* Both canvases moved together via CSS transform */}
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                {/* Bottom: diagram + background */}
                <canvas
                  ref={diagramCanvasRef}
                  className="absolute inset-0 w-full h-full"
                />
                {/* Top: annotation layer */}
                <canvas
                  ref={annotationCanvasRef}
                  className={cn(
                    "absolute inset-0 w-full h-full",
                    tool === "draw" && "cursor-crosshair",
                    tool === "highlight" && "cursor-cell",
                    tool === "erase" && "cursor-cell",
                  )}
                  onContextMenu={(e) => e.preventDefault()}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                  style={{ cursor: isPanning.current ? "grabbing" : undefined }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
