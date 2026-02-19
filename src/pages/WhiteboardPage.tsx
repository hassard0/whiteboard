import { useEffect } from "react";
import { WhiteboardModal, renderedSvgCache } from "@/components/demo/WhiteboardModal";
import { setMermaidTheme } from "@/lib/mermaid-queue";
import { useTheme } from "next-themes";

export default function WhiteboardPage() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const mode = resolvedTheme === "light" ? "light" : "dark";
    setMermaidTheme(mode, () => {
      Object.keys(renderedSvgCache).forEach((k) => delete renderedSvgCache[k]);
    });
  }, [resolvedTheme]);

  return (
    // Start blank — user generates diagrams via the Magic button
    <WhiteboardModal
      diagrams={[]}
      onClose={() => {/* always open */}}
    />
  );
}
