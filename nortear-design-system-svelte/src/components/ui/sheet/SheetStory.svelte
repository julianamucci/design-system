<script lang="ts">
  import {
    Sheet,
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';

  type Side = 'top' | 'right' | 'bottom' | 'left';
  // `noFooter` e `withDestructiveAction` saíram: nenhuma story as pedia, e ramo
  // de story que ninguém renderiza é a mesma dívida da peça sem story — parece
  // coberto e não é. `secondaryNav` entra porque a composição de navegação é
  // documentada no conteúdo compartilhado e só esta stack não a mostrava.
  type Variant = 'default' | 'withForm' | 'withScrollContent' | 'secondaryNav';

  interface Props {
    open?: boolean;
    side?: Side;
    showCloseButton?: boolean;
    triggerLabel?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    cancelLabel?: string;
    variant?: Variant;
    onAction?: () => void;
    onCancel?: () => void;
  }
  // Este wrapper nunca teve `defaultOpen` — as stories já passam `open`. O que
  // existia era um `{#if open !== undefined}` com os dois ramos idênticos fora
  // do `open`, e o ramo "não controlado" nunca abria. Colapsado para um só.
  let {
    open = $bindable(false),
    side = 'right',
    showCloseButton = true,
    triggerLabel = 'Abrir filtros',
    title = 'Filtros avançados',
    description = 'Configure os filtros para refinar os resultados.',
    actionLabel = 'Aplicar filtros',
    cancelLabel = 'Cancelar',
    variant = 'default',
    onAction,
    onCancel,
  }: Props = $props();
</script>

<div style="contain: layout">
  {#key `${side}-${showCloseButton}-${variant}`}
      <Sheet bind:open>
        <SheetTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </SheetTrigger>
        <SheetContent {side} {showCloseButton}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          {#if variant === 'withForm'}
            <SheetBody>
              <form class="nds-grid" data-spacing="sm">
                <div class="nds-grid" data-spacing="xs">
                  <Label for="sheet-story-nome">Nome</Label>
                  <Input id="sheet-story-nome" value="Maria Silva" />
                </div>
                <div class="nds-grid" data-spacing="xs">
                  <Label for="sheet-story-email">Email</Label>
                  <Input id="sheet-story-email" type="email" value="maria@exemplo.com" />
                </div>
              </form>
            </SheetBody>
          {:else if variant === 'withScrollContent'}
            <!--
              Aqui moravam `max-h-[60vh]` (Tailwind morto) e, depois, um
              `style="max-block-size: 60vh"` inline com `role="region"` à mão.
              O corpo rolável é peça do componente: o SheetBody já traz o
              `overflow`, o `flex` que segura o rodapé e o `tabindex` que a
              regra scrollable-region-focusable exige.
            -->
            <SheetBody class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">
              {#each Array.from({ length: 14 }) as _, i (i)}
                <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar o scroll interno do Sheet.</p>
              {/each}
            </SheetBody>
          {:else if variant === 'secondaryNav'}
            <SheetBody>
              <!-- Marco de navegação com nome próprio: a página já tem um <nav>,
                   e dois sem nome distinto ficam indistinguíveis para quem
                   navega por marcos. -->
              <nav aria-label="Navegação secundária" class="nds-stack" data-spacing="xs">
                {#each ['Dashboard', 'Projetos', 'Equipe', 'Configurações'] as item (item)}
                  <a
                    href="#{item.toLowerCase()}"
                    class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent"
                  >{item}</a>
                {/each}
              </nav>
            </SheetBody>
          {/if}

          {#if variant !== 'secondaryNav'}
            <SheetFooter>
              <SheetClose>
                {#snippet child({ props })}
                  <!--
                    O `onclick` ENCADEIA o do primitivo em vez de substituí-lo.
                    Escrito depois do `{...props}`, ele vencia o handler que o
                    `SheetClose` injeta — o botão avisava quem escuta e não
                    fechava o painel. Mesmo defeito já corrigido no dialog e no
                    drawer; esta é a terceira ocorrência do padrão.
                  -->
                  <Button
                    variant="outline"
                    {...props}
                    onclick={(event: MouseEvent) => {
                      (props.onclick as ((e: MouseEvent) => void) | undefined)?.(event);
                      onCancel?.();
                    }}
                  >{cancelLabel}</Button>
                {/snippet}
              </SheetClose>
              <Button onclick={onAction}>
                {actionLabel}
              </Button>
            </SheetFooter>
          {/if}
        </SheetContent>
      </Sheet>
  {/key}
</div>
