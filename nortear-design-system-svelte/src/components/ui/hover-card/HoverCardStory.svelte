<script lang="ts">
  import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
  } from './index';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant =
    | 'default'
    | 'withDelay'
    | 'userProfile'
    | 'linkPreview'
    | 'definition'
    | 'metric'
    | 'extraClass';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    openDelay?: number;
    closeDelay?: number;
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    href?: string;
    variant?: Variant;
    /** Nome acessível explícito do painel — usado nos gatilhos que são botão. */
    label?: string;
  }
  // `defaultOpen` não existe no bits-ui nem no vaul-svelte: a prop era
  // passada, ignorada, e o overlay nunca abria. A API real é `open`
  // (bindable). Inicializar `open` com `defaultOpen` cobre os dois usos e
  // apaga o ramo duplicado que existia só para o caso não controlado.

  let {
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    openDelay = 600,
    closeDelay = 300,
    defaultOpen = false,
    open = $bindable(defaultOpen),
    triggerLabel = '@joana',
    href = '/users/joana',
    variant = 'default',
    label = '',
  }: Props = $props();

  // Os gatilhos que não navegam (termo, métrica) são BOTÃO: não há para onde
  // ir, e o glossário continua sendo o caminho alternativo obrigatório.
  const triggerEhButton = $derived(variant === 'definition' || variant === 'metric');

  const CLASSES_BOTAO =
    'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';
</script>

<p class="nds-text-body nds-max-w-sm nds-min-h-50" style="contain: layout">
  Comentário de
  {#key `${side}-${align}-${defaultOpen}-${openDelay}-${closeDelay}-${variant}`}
    <HoverCard bind:open {openDelay} {closeDelay}>
      <HoverCardTrigger>
        {#snippet child({ props })}
          {#if triggerEhButton}
            <button type="button" class={CLASSES_BOTAO} {...props}>{triggerLabel}</button>
          {:else}
            <a
              {href}
              class="nds-text-primary nds-font-medium nds-hover-underline"
              {...props}>{triggerLabel}</a
            >
          {/if}
        {/snippet}
      </HoverCardTrigger>
      <HoverCardContent
        {side}
        {align}
        {sideOffset}
        aria-label={label || undefined}
        class={variant === 'extraClass' ? 'nds-w-md nds-text-center' : undefined}
      >
        {#if variant === 'linkPreview'}
          <div class="nds-stack" data-spacing="sm">
            <div
              class="nds-cluster nds-text-caption nds-text-muted-foreground"
              data-align="center"
              data-spacing="xs"
            >
              <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
              <span class="nds-truncate">design-system.dev/overlays</span>
            </div>
            <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Quando usar tooltip, popover e cartão de hover — e o que cada um exige de teclado.
            </p>
          </div>
        {:else if variant === 'definition'}
          <div class="nds-stack" data-spacing="xs">
            <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 nível AA</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1, operação
              por teclado e alvo de toque de 24px.
            </p>
          </div>
        {:else if variant === 'metric'}
          <div class="nds-stack" data-spacing="xs">
            <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
              <p class="nds-text-body nds-font-medium">Largest Contentful Paint</p>
              <span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
            </div>
            <p class="nds-text-caption nds-text-muted-foreground">
              Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.
            </p>
          </div>
        {:else if variant === 'withDelay'}
          <div class="nds-stack" data-spacing="xs">
            <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Espera de 150ms para abrir e 100ms para fechar.
            </p>
          </div>
        {:else if variant === 'default'}
          <div class="nds-stack" data-spacing="xs">
            <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
            <p class="nds-text-caption nds-text-muted-foreground">
              Espera padrão: 600ms para abrir e 300ms para fechar.
            </p>
          </div>
        {:else}
          <div class="nds-cluster" data-spacing="sm" data-align="start">
            <div
              class="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium"
              data-align="center"
              data-justify="center"
              aria-hidden="true"
            >
              JS
            </div>
            <div class="nds-stack" data-spacing="xs">
              <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
              <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
            </div>
          </div>
        {/if}
      </HoverCardContent>
    </HoverCard>
  {/key}
  há 2 horas.
</p>
