/**
 * Global sequential Mermaid render queue.
 * Mermaid v11 cannot handle concurrent render() calls — they collide and fail silently.
 * ALL mermaid.render() calls in the app must go through here.
 */
import mermaid from "mermaid";

// Initialize mermaid eagerly at module load time (once, synchronously).
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
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
  },
  flowchart: { curve: "basis", padding: 20, useMaxWidth: true },
  sequence: { mirrorActors: false, useMaxWidth: true },
});

const queue: Array<() => Promise<void>> = [];
let processing = false;
let counter = 0;

// Wrap a promise with a timeout so a hung render never blocks the queue.
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

// Sanitize common Mermaid v11 syntax issues before rendering.
function sanitizeDiagram(text: string): string {
  // Replace literal \n inside node shape brackets {} [] () with a space
  // Mermaid v11 doesn't support newlines inside node labels in most cases
  return text.replace(/(\{[^}]*?)\\n([^}]*?\})/g, "$1 $2")
             .replace(/(\[[^\]]*?)\\n([^\]]*?\])/g, "$1 $2")
             .replace(/(\([^)]*?)\\n([^)]*?\))/g, "$1 $2");
}

export function renderMermaid(diagramText: string): Promise<string> {
  const sanitized = sanitizeDiagram(diagramText);
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      const id = `mermaid-q-${++counter}`;
      // Clean up any leftover element from a previous attempt
      document.getElementById(id)?.remove();
      // Create a hidden container so mermaid has a real DOM parent
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
