import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

function BatmanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 60" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Classic Batman logo bat silhouette */}
      <path d="
        M50 55
        C45 55 40 50 38 45
        C34 46 30 46 27 44
        C24 42 22 38 21 34
        C18 36 14 37 10 35
        C5 33 2 28 2 22
        C2 16 6 11 11 9
        C8 8 6 6 5 4
        C10 5 16 7 20 11
        C22 8 25 6 28 5
        C25 8 24 12 26 16
        C30 12 36 9 42 8
        C40 11 39 15 40 19
        C43 17 46 16 50 16
        C54 16 57 17 60 19
        C61 15 60 11 58 8
        C64 9 70 12 74 16
        C76 12 75 8 72 5
        C75 6 78 8 80 11
        C84 7 90 5 95 4
        C94 6 92 8 89 9
        C94 11 98 16 98 22
        C98 28 95 33 90 35
        C86 37 82 36 79 34
        C78 38 76 42 73 44
        C70 46 66 46 62 45
        C60 50 55 55 50 55
        Z
      " />
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
