"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  debounceMs?: number;
}

function SearchInput({
  value: controlledValue,
  onChange,
  debounceMs = 300,
  placeholder = "Search...",
  className,
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(controlledValue ?? "");
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync controlled value
  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange?.(val);
    }, debounceMs);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange?.("");
  };

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-9 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)]",
          "hover:border-[var(--color-border-hover)]"
        )}
        {...props}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export { SearchInput };
