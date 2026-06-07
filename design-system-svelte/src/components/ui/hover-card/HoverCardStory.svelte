<script lang="ts">
  import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant =
    | 'default'
    | 'withDelay'
    | 'userProfile'
    | 'linkPreview'
    | 'definition'
    | 'metric';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    openDelay?: number;
    closeDelay?: number;
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    variant?: Variant;
  }

  let {
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    openDelay = 0,
    closeDelay = 0,
    defaultOpen = false,
    open = $bindable(undefined),
    triggerLabel = '@joana',
    variant = 'default',
  }: Props = $props();
</script>

<div style="contain: layout">
  {#key `${side}-${align}-${defaultOpen}-${openDelay}-${closeDelay}-${variant}`}
    {#if open !== undefined}
      <HoverCard bind:open {openDelay} {closeDelay}>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <a href="#user-joana" class="text-primary underline-offset-4 hover:underline" {...props}
              >{triggerLabel}</a
            >
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent {side} {align} {sideOffset}>
          {#if variant === 'linkPreview'}
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span class="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
                <span>design-system.dev</span>
              </div>
              <p class="font-medium">Guia de overlays acessíveis</p>
              <p class="text-xs text-muted-foreground">
                Padrões para HoverCard, Popover e Dialog com WCAG 2.1 AA.
              </p>
            </div>
          {:else if variant === 'definition'}
            <div class="flex flex-col gap-1.5">
              <p class="font-medium text-sm">WCAG 2.1</p>
              <p class="text-xs text-muted-foreground">
                Web Content Accessibility Guidelines: padrão internacional de acessibilidade para
                conteúdo web. Critério 1.4.13 cobre conteúdo em hover/focus.
              </p>
            </div>
          {:else if variant === 'metric'}
            <div class="flex flex-col gap-2">
              <p class="text-xs text-muted-foreground">Conversão (últimos 30d)</p>
              <p class="text-2xl font-semibold">3,42%</p>
              <p class="text-xs text-muted-foreground">
                Razão entre cliques no CTA e usuários únicos. Inclui apenas tráfego orgânico.
              </p>
            </div>
          {:else}
            <div class="flex gap-3">
              <Avatar>
                <AvatarImage src="" alt="" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div class="flex flex-col">
                <p class="font-medium text-sm">Joana Silva</p>
                <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
                <p class="text-xs text-muted-foreground mt-1">Entrou em mar/2024</p>
              </div>
            </div>
          {/if}
        </HoverCardContent>
      </HoverCard>
    {:else}
      <HoverCard {defaultOpen} {openDelay} {closeDelay}>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <a href="#user-joana" class="text-primary underline-offset-4 hover:underline" {...props}
              >{triggerLabel}</a
            >
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent {side} {align} {sideOffset}>
          {#if variant === 'linkPreview'}
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <span class="inline-flex h-4 w-4 items-center justify-center rounded bg-muted">D</span>
                <span>design-system.dev</span>
              </div>
              <p class="font-medium">Guia de overlays acessíveis</p>
              <p class="text-xs text-muted-foreground">
                Padrões para HoverCard, Popover e Dialog com WCAG 2.1 AA.
              </p>
            </div>
          {:else if variant === 'definition'}
            <div class="flex flex-col gap-1.5">
              <p class="font-medium text-sm">WCAG 2.1</p>
              <p class="text-xs text-muted-foreground">
                Web Content Accessibility Guidelines: padrão internacional de acessibilidade para
                conteúdo web. Critério 1.4.13 cobre conteúdo em hover/focus.
              </p>
            </div>
          {:else if variant === 'metric'}
            <div class="flex flex-col gap-2">
              <p class="text-xs text-muted-foreground">Conversão (últimos 30d)</p>
              <p class="text-2xl font-semibold">3,42%</p>
              <p class="text-xs text-muted-foreground">
                Razão entre cliques no CTA e usuários únicos. Inclui apenas tráfego orgânico.
              </p>
            </div>
          {:else}
            <div class="flex gap-3">
              <Avatar>
                <AvatarImage src="" alt="" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div class="flex flex-col">
                <p class="font-medium text-sm">Joana Silva</p>
                <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
                <p class="text-xs text-muted-foreground mt-1">Entrou em mar/2024</p>
              </div>
            </div>
          {/if}
        </HoverCardContent>
      </HoverCard>
    {/if}
  {/key}
</div>
