import { useState, type MouseEvent } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  value: string;
  title?: string;
  size?: number;
  className?: string;
  stopPropagation?: boolean;
}

export function CopyButton({
  value,
  title = "Copy to clipboard",
  size = 14,
  className = "",
  stopPropagation = false,
}: Props) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function onClick(e: MouseEvent) {
    if (stopPropagation) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 1500);
  }

  const tooltipTitle =
    state === "copied"
      ? "Copied"
      : state === "error"
      ? "Failed to copy"
      : title;

  return (
    <button
      className={`copy-btn ${state} ${className}`}
      onClick={onClick}
      onMouseDown={stopPropagation ? (e) => e.stopPropagation() : undefined}
      title={tooltipTitle}
      aria-label={tooltipTitle}
    >
      {state === "copied" ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}
