/**
 * Global sequential Mermaid render queue.
 * Mermaid v11 cannot handle concurrent render() calls — they collide and fail silently.
 * ALL mermaid.render() calls in the app must go through here.
 *
 * This module also owns the single mermaid.initialize() call so it doesn't matter
 * in which order pages import it — init is guaranteed before the first render.
 */
import mermaid from "mermaid";

let initialized = false;

function ensureInit() {
  if (initialized) return;
  initialized = true;
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
}

const queue: Array<() => Promise<void>> = [];
let processing = false;
let counter = 0;

async function flush() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    try {
      await task();
    } catch {
      // Individual task errors are handled inside the task via reject().
      // Catching here ensures the queue keeps processing even if something unexpected throws.
    }
  }
  processing = false;
}

export function renderMermaid(diagramText: string): Promise<string> {
  ensureInit();
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      const id = `mermaid-q-${++counter}`;

      // Remove any stale element with this ID before rendering
      document.getElementById(id)?.remove();

      try {
        // Mermaid v11: render(id, text) — returns { svg }
        const { svg } = await mermaid.render(id, diagramText);
        if (!svg) throw new Error("mermaid.render returned empty SVG");
        resolve(svg);
      } catch (err) {
        reject(err);
      } finally {
        // Clean up any DOM node mermaid may have left behind
        document.getElementById(id)?.remove();
      }
    });
    flush();
  });
}
