/**
 * Global sequential Mermaid render queue.
 * Mermaid v11 cannot handle concurrent render() calls — they collide and fail silently.
 * ALL mermaid.render() calls in the app must go through here.
 */
import mermaid from "mermaid";

function getDarkVars() {
  return {
    background: "#0a0a0f",
    primaryColor: "#6d28d9",
    primaryTextColor: "#f5f5f5",
    primaryBorderColor: "#4c1d95",
    lineColor: "#7c3aed",
    secondaryColor: "#1e1b2e",
    tertiaryColor: "#14121f",
    edgeLabelBackground: "#1e1b2e",
    clusterBkg: "#1e1b2e",
    titleColor: "#f5f5f5",
    nodeBorder: "#4c1d95",
    mainBkg: "#1e1b2e",
    nodeTextColor: "#f5f5f5",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "13px",
    actorBkg: "#1e1b2e",
    actorBorder: "#6d28d9",
    actorTextColor: "#f5f5f5",
    actorLineColor: "#6d28d9",
    signalColor: "#a78bfa",
    signalTextColor: "#f5f5f5",
    labelBoxBkgColor: "#1e1b2e",
    labelBoxBorderColor: "#6d28d9",
    labelTextColor: "#f5f5f5",
    loopTextColor: "#a78bfa",
    noteBorderColor: "#6d28d9",
    noteBkgColor: "#14121f",
    noteTextColor: "#d4c5ff",
    activationBorderColor: "#6d28d9",
    activationBkgColor: "#2d1b69",
  };
}

function getLightVars() {
  return {
    background: "#ffffff",
    primaryColor: "#6d28d9",
    primaryTextColor: "#1a1a2e",
    primaryBorderColor: "#7c3aed",
    lineColor: "#7c3aed",
    secondaryColor: "#f3f0ff",
    tertiaryColor: "#ede9fe",
    edgeLabelBackground: "#f3f0ff",
    clusterBkg: "#f3f0ff",
    titleColor: "#1a1a2e",
    nodeBorder: "#7c3aed",
    mainBkg: "#f3f0ff",
    nodeTextColor: "#1a1a2e",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "13px",
    actorBkg: "#f3f0ff",
    actorBorder: "#6d28d9",
    actorTextColor: "#1a1a2e",
    actorLineColor: "#6d28d9",
    signalColor: "#6d28d9",
    signalTextColor: "#1a1a2e",
    labelBoxBkgColor: "#f3f0ff",
    labelBoxBorderColor: "#6d28d9",
    labelTextColor: "#1a1a2e",
    loopTextColor: "#6d28d9",
    noteBorderColor: "#6d28d9",
    noteBkgColor: "#ede9fe",
    noteTextColor: "#1a1a2e",
    activationBorderColor: "#6d28d9",
    activationBkgColor: "#ddd6fe",
  };
}

let currentThemeMode: "dark" | "light" = "dark";

function initMermaid(mode: "dark" | "light") {
  mermaid.initialize({
    startOnLoad: false,
    theme: mode === "dark" ? "dark" : "default",
    themeVariables: mode === "dark" ? getDarkVars() : getLightVars(),
    flowchart: { curve: "basis", padding: 20, useMaxWidth: true },
    sequence: { mirrorActors: false, useMaxWidth: true },
  });
}

// Initialize eagerly with dark theme
initMermaid("dark");

/** Call this whenever the app theme changes to re-initialize mermaid and clear the SVG cache. */
export function setMermaidTheme(mode: "dark" | "light", clearCache?: () => void) {
  if (mode === currentThemeMode) return;
  currentThemeMode = mode;
  initMermaid(mode);
  clearCache?.();
}

const queue: Array<() => Promise<void>> = [];
let processing = false;
let counter = 0;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`mermaid render timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function flush() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    try {
      await task();
    } catch {
      // Keep the queue running even if an individual task throws unexpectedly.
    }
  }
  processing = false;
}

function sanitizeDiagram(text: string): string {
  return text.replace(/(\{[^}]*?)\\n([^}]*?\})/g, "$1 $2")
             .replace(/(\[[^\]]*?)\\n([^\]]*?\])/g, "$1 $2")
             .replace(/(\([^)]*?)\\n([^)]*?\))/g, "$1 $2");
}

export function renderMermaid(diagramText: string): Promise<string> {
  const sanitized = sanitizeDiagram(diagramText);
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      const id = `mermaid-q-${++counter}`;
      document.getElementById(id)?.remove();
      const container = document.createElement("div");
      container.id = `mermaid-container-${counter}`;
      container.style.cssText = "position:fixed;top:-9999px;left:-9999px;visibility:hidden;";
      document.body.appendChild(container);
      try {
        const result = await withTimeout(mermaid.render(id, sanitized), 15000);
        const svg = result?.svg ?? "";
        if (!svg) throw new Error("mermaid.render returned empty SVG");
        resolve(svg);
      } catch (err) {
        console.error(`[mermaid-queue] render failed:`, err);
        reject(err);
      } finally {
        document.getElementById(id)?.remove();
        container.remove();
      }
    });
    flush();
  });
}
