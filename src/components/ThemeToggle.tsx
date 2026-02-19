import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Moon } from "lucide-react";

function BabyBottleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Nipple tip */}
      <path d="M10.5 1.5 C10.5 1.5 11 0.5 12 0.5 C13 0.5 13.5 1.5 13.5 1.5 L13.5 3 L10.5 3 Z" />
      {/* Collar ring */}
      <rect x="9.5" y="3" width="5" height="1.5" rx="0.5" />
      {/* Shoulder taper */}
      <path d="M9.5 4.5 L8.5 7 L15.5 7 L14.5 4.5 Z" />
      {/* Bottle body */}
      <rect x="8" y="7" width="8" height="12" rx="1" />
      {/* Bottom cap */}
      <rect x="8" y="19" width="8" height="2" rx="1" />
      {/* Milk line */}
      <rect x="9" y="13" width="6" height="0.8" rx="0.4" fill="white" opacity="0.4" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || theme === "system";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <BabyBottleIcon className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? "Whiny baby mode for KC" : "Return to darkness"}
      </TooltipContent>
    </Tooltip>
  );
}
