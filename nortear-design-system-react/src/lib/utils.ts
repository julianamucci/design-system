import { clsx, type ClassValue } from "clsx"

/**
 * Concatena classes. Após a remoção do Tailwind, não há mais conflito de
 * utilitários a resolver, então `cn` é apenas `clsx` (sem tailwind-merge).
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
