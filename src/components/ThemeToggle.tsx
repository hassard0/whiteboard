import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function BabyBottleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Nipple */}
      <path d="M10 2 Q12 0.5 14 2 L14 4 L10 4 Z" fill="currentColor" />
      {/* Cap ring */}
      <rect x="9" y="4" width="6" height="2" rx="0.5" fill="currentColor" />
      {/* Bottle body */}
      <path d="M9 6 L8 9 L8 19 Q8 22 12 22 Q16 22 16 19 L16 9 L15 6 Z" fill="currentColor" opacity="0.85" />
      {/* Milk level line */}
      <line x1="9" y1="14" x2="15" y2="14" stroke="white" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

function BatmanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3 C10 3 8.5 4.5 7 5 C5 5.5 2 4 2 4 C2 4 4 7 5 8.5 C3.5 9.5 2.5 11 2 13 C4 12 5.5 11.5 7 12 C7.5 14 9 16 9 18 L12 17 L15 18 C15 16 16.5 14 17 12 C18.5 11.5 20 12 22 13 C21.5 11 20.5 9.5 19 8.5 C20 7 22 4 22 4 C22 4 19 5.5 17 5 C15.5 4.5 14 3 12 3 Z" />
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
            <BatmanIcon className="h-5 w-5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? "Whiny baby mode for KC" : "Return to darkness"}
      </TooltipContent>
    </Tooltip>
  );
}
