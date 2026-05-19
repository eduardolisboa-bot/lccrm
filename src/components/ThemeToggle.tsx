import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const { theme, toggle } = useTheme();
  const cls = floating
    ? "fixed top-4 right-4 z-50 h-9 w-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
    : "h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors";
  return (
    <button onClick={toggle} className={cls} aria-label="Alternar tema" title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
