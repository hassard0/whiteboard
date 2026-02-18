/**
 * Global sequential Mermaid render queue.
 * Mermaid v11 cannot handle concurrent render() calls — they collide and fail silently.
 * ALL mermaid.render() calls in the app must go through here.
 */
import mermaid from "mermaid";

const queue: Array<() => Promise<void>> = [];
let processing = false;
let counter = 0;

async function flush() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    await task();
  }
  processing = false;
}

export function renderMermaid(diagramText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      const id = `mermaid-q-${++counter}`;
      // Clean up any leftover DOM node with this id before rendering
      document.getElementById(id)?.remove();
      try {
        // Mermaid v11: render(id, text) — no container arg
        const { svg } = await mermaid.render(id, diagramText);
        resolve(svg);
      } catch (err) {
        reject(err);
      } finally {
        document.getElementById(id)?.remove();
      }
    });
    flush();
  });
}
