import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"

import { cn } from "@/lib/utils"

/**
 * Presets do CSS compartilhado: sm 24 · md 32 · lg 40 · xl 48 · 2xl 64.
 * Antes o tipo era `"default" | "sm" | "lg"`, e `data-size="default"` não casa
 * com seletor nenhum — caía no diâmetro base por acidente, enquanto xl e 2xl,
 * que o CSS tem e a docs page documenta, não existiam na API.
 */
type AvatarSize = "sm" | "md" | "lg" | "xl" | "2xl"

function Avatar({
  className,
  size = "md",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: AvatarSize
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn("nds-avatar", className)}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("nds-avatar-image", className)}
      {...props}
    />
  )
}

type AvatarFallbackProps = Omit<AvatarPrimitive.Fallback.Props, "delay"> & {
  /**
   * Atraso, em ms, antes de mostrar o fallback. O nome é o das outras stacks;
   * aqui a lib chama de `delay`, e o valor era repassado cru: ia parar no DOM
   * como atributo desconhecido e o atraso simplesmente não acontecia.
   */
  delayMs?: number
}
function AvatarFallback({
  className,
  delayMs,
  ...props
}: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("nds-avatar-fallback", className)}
      delay={delayMs}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn("nds-avatar-badge", className)}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn("nds-avatar-group", className)}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn("nds-avatar-group-count", className)}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
