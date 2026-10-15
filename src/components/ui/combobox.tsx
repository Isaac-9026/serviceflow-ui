"use client"

import * as React from "react"
import { cn } from "cn"
import { Search, Check, ChevronsUpDown, X } from "lucide-react"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  keywords?: string[]
  disabled?: boolean
}

export interface ComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  id?: string
  clearable?: boolean
}

export function Combobox({
  value,
  onValueChange,
  options = [],
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  disabled = false,
  className,
  id,
  clearable = true,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(0)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = React.useMemo(() => {
    return options.find((opt) => opt.value === value) || null
  }, [options, value])

  const filteredOptions = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q)
      const matchDesc = opt.description?.toLowerCase().includes(q)
      const matchKeywords = opt.keywords?.some((k) => k.toLowerCase().includes(q))
      return matchLabel || matchDesc || matchKeywords
    })
  }, [options, search])

  // Reset highlighted index when filter changes
  React.useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredOptions.length])

  // Auto focus input when opening
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } else {
      setSearch("")
    }
  }, [isOpen])

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === "Escape") {
      e.preventDefault()
      setIsOpen(false)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => 
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      )
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => 
        prev > 0 ? prev - 1 : Math.max(filteredOptions.length - 1, 0)
      )
      return
    }

    if (e.key === "Enter") {
      e.preventDefault()
      const item = filteredOptions[highlightedIndex]
      if (item && !item.disabled) {
        onValueChange?.(item.value)
        setIsOpen(false)
      }
    }
  }

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (!isOpen || !listRef.current) return
    const activeEl = listRef.current.children[highlightedIndex] as HTMLElement
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex, isOpen])

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm transition-[border-color,box-shadow,background-color] duration-150 ease-out outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30 dark:hover:bg-input/50",
          isOpen && "border-ring ring-2 ring-ring/20",
          className
        )}
      >
        <span
          className={cn(
            "truncate text-left flex-1 min-w-0",
            !selectedOption && "text-muted-foreground/60"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              title="Limpiar selección"
              onClick={(e) => {
                e.stopPropagation()
                onValueChange?.("")
              }}
              className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1.5 w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Live Search Input */}
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 bg-muted/20">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground/60 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                title="Limpiar búsqueda"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto overscroll-contain p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value
                const isHighlighted = idx === highlightedIndex

                return (
                  <button
                    type="button"
                    key={option.value}
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return
                      onValueChange?.(option.value)
                      setIsOpen(false)
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      isHighlighted && !isSelected && "bg-accent/70 text-accent-foreground",
                      option.disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="truncate text-sm font-medium">{option.label}</span>
                      {option.description && (
                        <span className="truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="size-4 text-primary shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
