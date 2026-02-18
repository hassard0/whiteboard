import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Highlighter, Trash2, Palette, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiagramOption {
  id: string;
  name: string;
  svg: string; // rendered SVG string
}

interface WhiteboardModalProps {
  diagrams: DiagramOption[];
  onClose: () => void;
}

type Tool = "draw" | "highlight" | "erase";

// ─── Palette colours (themed) ────────────────────────────────────────────────

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
  { label: "Dark",    value: "hsl(240 10% 4%)"   },
  { label: "Navy",    value: "hsl(222 47% 8%)"   },
  { label: "Charcoal",value: "hsl(220 13% 12%)"  },
  { label: "Slate",   value: "hsl(215 28% 17%)"  },
  { label: "White",   value: "hsl(0 0% 97%)"     },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function WhiteboardModal({ diagrams, onClose }: WhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ─── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ─── Draw diagram SVG onto canvas ─────────────────────────────────────────
  const drawDiagramOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const diagram = diagrams[selectedDiagramIdx];

    // Fill background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!diagram?.svg) return;

    // Convert SVG string to image
    const blob = new Blob([diagram.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const padding = 40;
      const maxW = canvas.width - padding * 2;
      const maxH = canvas.height - padding * 2;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (canvas.width - drawW) / 2;
      const y = (canvas.height - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [diagrams, selectedDiagramIdx, bg]);

  // ─── Resize canvas to container ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawDiagramOnCanvas();
  }, [drawDiagramOnCanvas]);

  // ─── Clear & redraw when diagram / bg changes ──────────────────────────────
  useEffect(() => {
    drawDiagramOnCanvas();
  }, [drawDiagramOnCanvas]);

  // ─── Pointer helpers ───────────────────────────────────────────────────────
  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    lastPos.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = strokeWidth * 6;
    } else if (tool === "highlight") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color.replace(")", " / 0.35)").replace("hsl(", "hsl(");
      ctx.lineWidth = strokeWidth * 5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
    }

    ctx.stroke();
    lastPos.current = pos;
  }

  function onPointerUp() {
    setIsDrawing(false);
    lastPos.current = null;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.globalCompositeOperation = "source-over";
  }

  // ─── Clear drawings (re-draw diagram) ─────────────────────────────────────
  function clearCanvas() {
    drawDiagramOnCanvas();
  }

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "draw",      icon: <Pencil className="h-4 w-4" />,      label: "Draw"      },
    { id: "highlight", icon: <Highlighter className="h-4 w-4" />, label: "Highlight" },
    { id: "erase",     icon: <Trash2 className="h-4 w-4" />,      label: "Erase"     },
  ];

  const selectedDiagram = diagrams[selectedDiagramIdx];

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
                      onClick={() => { setSelectedDiagramIdx(i); setShowDiagramPicker(false); }}
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
              {tools.map((t) => (
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

            {/* Clear */}
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            {/* Spacer + Close */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden md:block">
                Click &amp; drag to annotate
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Canvas ── */}
          <div ref={containerRef} className="flex-1 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              className={cn(
                "absolute inset-0 w-full h-full",
                tool === "draw" && "cursor-crosshair",
                tool === "highlight" && "cursor-cell",
                tool === "erase" && "cursor-cell",
              )}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
