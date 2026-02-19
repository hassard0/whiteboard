import { useState, useEffect } from "react";
import { WhiteboardModal, renderedSvgCache } from "@/components/demo/WhiteboardModal";
import { renderMermaid, setMermaidTheme } from "@/lib/mermaid-queue";
import { useTheme } from "next-themes";

// A handful of starter diagrams so the whiteboard isn't empty on first open
const STARTER_DIAGRAMS = [
  {
    id: "blank",
    name: "— No diagram (blank canvas) —",
    svg: "",
    diagram: "",
  },
  {
    id: "sequence-example",
    name: "Sequence: User → Agent → API",
    svg: "",
    diagram: `sequenceDiagram
  participant U as 👤 User
  participant A as 🤖 AI Agent
  participant API as External API
  U->>A: Send request
  A->>API: Call tool
  API-->>A: Response
  A-->>U: Result`,
  },
  {
    id: "flowchart-example",
    name: "Flowchart: Decision Flow",
    svg: "",
    diagram: `graph TD
  Start([Start]) --> Check{Authorized?}
  Check -->|Yes| Action[Execute Action]
  Check -->|No| Block[Block + Log]
  Action --> End([Done])`,
  },
];

export default function WhiteboardPage() {
  const { resolvedTheme } = useTheme();
  const [diagrams, setDiagrams] = useState(STARTER_DIAGRAMS);

  // Sync mermaid theme with app theme
  useEffect(() => {
    const mode = resolvedTheme === "light" ? "light" : "dark";
    setMermaidTheme(mode, () => {
      Object.keys(renderedSvgCache).forEach((k) => delete renderedSvgCache[k]);
    });
  }, [resolvedTheme]);

  // Pre-render starter diagrams
  useEffect(() => {
    STARTER_DIAGRAMS.forEach((d) => {
      if (!d.diagram) return;
      renderMermaid(d.diagram)
        .then((svg) => {
          renderedSvgCache[d.id] = svg;
          setDiagrams((prev) =>
            prev.map((item) => (item.id === d.id ? { ...item, svg } : item))
          );
        })
        .catch(console.error);
    });
  }, []);

  return (
    <WhiteboardModal
      diagrams={diagrams.filter((d) => d.id !== "blank")}
      onClose={() => {/* no-op: whiteboard is always open */}}
    />
  );
}
