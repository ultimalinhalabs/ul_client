import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know app/globals.css's custom type scale — otherwise it
 * reads `text-body` as a text *colour*, treats it as conflicting with
 * `text-fg-inverse`, and silently drops one of the two (it once made the
 * primary button's label invisible). Keep this list in sync with `--text-*`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "title", "heading", "body", "label", "meta"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
