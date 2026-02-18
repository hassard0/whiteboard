/**
 * Global sequential Mermaid render queue.
 * One render at a time — Mermaid v11 cannot handle concurrent calls.
 */
import mermaid from "mermaid";

const queue: Array<() => Promise<void>> = [];
let processing = false;

// A single hidden container reused across all renders
let container: HTMLDivElement | null = null;
function getContainer(): HTMLDivElement {
  if (!container || !document.body.contains(container)) {
    container = document.createElement("div");
    container.style.cssText = "position:fixed;top:-9999px;left:-9999px;visibility:hidden;";
    document.body.appendChild(container);
  }
  return container;
}

async function flush() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    await task();
  }
  processing = false;
}

let counter = 0;

export function renderMermaid(diagramText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      const id = `mq-render-${++counter}`;
      // Remove any leftover element with this id to avoid Mermaid's "already exists" error
      document.getElementById(id)?.remove();
      try {
        const el = getContainer();
        const { svg } = await mermaid.render(id, diagramText, el);
        // Clean up the rendered element Mermaid appended
        document.getElementById(id)?.remove();
        resolve(svg);
      } catch (err) {
        document.getElementById(id)?.remove();
        reject(err);
      }
    });
    flush();
  });
}
