<script lang="ts">
  import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
  } from './index';
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
            <a href="#user-joana" class="nds-text-primary underline-offset-4 nds-hover-underline" {...props}
              >{triggerLabel}</a
            >
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent {side} {align} {sideOffset}>
          {#if variant === 'linkPreview'}
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-align="center" data-spacing="sm">
                <span class="nds-cluster nds-rounded nds-bg-muted" data-align="center" data-justify="center" style="height: 1rem; width: 1rem">D</span>
                <span>design-system.dev</span>
              </div>
              <p class="nds-font-medium">Guia de overlays acessíveis</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Padrões para HoverCard, Popover e Dialog com WCAG 2.1 AA.
              </p>
            </div>
          {:else if variant === 'definition'}
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-font-medium nds-text-body">WCAG 2.1</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Web Content Accessibility Guidelines: padrão internacional de acessibilidade para
                conteúdo web. Critério 1.4.13 cobre conteúdo em hover/focus.
              </p>
            </div>
          {:else if variant === 'metric'}
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">Conversão (últimos 30d)</p>
              <p class="nds-font-semibold" style="font-size: 1.5rem; line-height: 2rem">3,42%</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Razão entre cliques no CTA e usuários únicos. Inclui apenas tráfego orgânico.
              </p>
            </div>
          {:else}
            <div class="nds-cluster" data-spacing="sm">
              <Avatar>
                <AvatarImage src="" alt="" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div class="nds-stack">
                <p class="nds-font-medium nds-text-body">Joana Silva</p>
                <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
                <p class="nds-text-caption nds-text-muted-foreground nds-mt-1">Entrou em mar/2024</p>
              </div>
            </div>
          {/if}
        </HoverCardContent>
      </HoverCard>
    {:else}
      <HoverCard {defaultOpen} {openDelay} {closeDelay}>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <a href="#user-joana" class="nds-text-primary underline-offset-4 nds-hover-underline" {...props}
              >{triggerLabel}</a
            >
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent {side} {align} {sideOffset}>
          {#if variant === 'linkPreview'}
            <div class="nds-stack" data-spacing="sm">
              <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-align="center" data-spacing="sm">
                <span class="nds-cluster nds-rounded nds-bg-muted" data-align="center" data-justify="center" style="height: 1rem; width: 1rem">D</span>
                <span>design-system.dev</span>
              </div>
              <p class="nds-font-medium">Guia de overlays acessíveis</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Padrões para HoverCard, Popover e Dialog com WCAG 2.1 AA.
              </p>
            </div>
          {:else if variant === 'definition'}
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-font-medium nds-text-body">WCAG 2.1</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Web Content Accessibility Guidelines: padrão internacional de acessibilidade para
                conteúdo web. Critério 1.4.13 cobre conteúdo em hover/focus.
              </p>
            </div>
          {:else if variant === 'metric'}
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">Conversão (últimos 30d)</p>
              <p class="nds-font-semibold" style="font-size: 1.5rem; line-height: 2rem">3,42%</p>
              <p class="nds-text-caption nds-text-muted-foreground">
                Razão entre cliques no CTA e usuários únicos. Inclui apenas tráfego orgânico.
              </p>
            </div>
          {:else}
            <div class="nds-cluster" data-spacing="sm">
              <Avatar>
                <AvatarImage src="" alt="" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div class="nds-stack">
                <p class="nds-font-medium nds-text-body">Joana Silva</p>
                <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
                <p class="nds-text-caption nds-text-muted-foreground nds-mt-1">Entrou em mar/2024</p>
              </div>
            </div>
          {/if}
        </HoverCardContent>
      </HoverCard>
    {/if}
  {/key}
</div>
