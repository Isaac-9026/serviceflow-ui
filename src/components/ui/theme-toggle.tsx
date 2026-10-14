"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  variant?: "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  showLabel?: boolean;
}

export function ThemeToggle({
  className = "",
  variant = "outline",
  size = "icon",
  showLabel = false,
}: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`h-8 w-8 rounded-lg border-border/70 ${className}`}
        aria-label="Cargando tema"
        disabled
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? "light" : "dark";

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("startViewTransition" in document) || prefersReducedMotion) {
      setTheme(next);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX || rect.left + rect.width / 2;
    const y = event.clientY || rect.top + rect.height / 2;

    const root = document.documentElement;
    root.style.setProperty("--beui-vt-origin", `${x}px ${y}px`);
    root.dataset.beuiVt = "circle";

    const vt = (
      document as Document & {
        startViewTransition(cb: () => void): { finished: Promise<void> };
      }
    ).startViewTransition(() => {
      setTheme(next);
    });

    vt.finished.finally(() => {
      delete root.dataset.beuiVt;
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={`h-8 rounded-lg border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer ${
        showLabel ? "px-2.5 gap-2 w-auto" : "w-8 px-0"
      } ${className}`}
      title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label="Alternar modo claro u oscuro"
    >
      <div className="relative h-4 w-4 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isDark ? "dark" : "light"}
            initial={{ scale: 0.5, rotate: isDark ? -45 : 45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: isDark ? 45 : -45, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-foreground/80" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? "Modo Claro" : "Modo Oscuro"}
        </span>
      )}
    </Button>
  );
}
