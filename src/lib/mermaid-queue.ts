/**
 * Global sequential Mermaid render queue.
 *
 * Mermaid cannot process concurrent render() calls — they conflict and fail silently.
 * All callers must go through this queue so renders happen one at a time.
 */
import mermaid from "mermaid";

let counter = 0;
const queue: Array<() => Promise<void>> = [];
let processing = false;

async function flush() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    await task();
  }
  processing = false;
}

/** Enqueue a Mermaid render and return the SVG string. */
export function renderMermaid(diagramText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      const id = `mq-${++counter}`;
      try {
        const { svg } = await mermaid.render(id, diagramText);
        resolve(svg);
      } catch (err) {
        reject(err);
      }
    });
    flush();
  });
}
