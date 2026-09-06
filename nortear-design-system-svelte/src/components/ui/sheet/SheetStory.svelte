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
  // `actionRow` entra pelo mesmo motivo que `secondaryNav` entrou: o painel
  // inferior é documentado no conteúdo compartilhado e só esta stack não tinha
  // story para ele.
  type Variant =
    | 'default'
    | 'withForm'
    | 'profileForm'
    | 'withScrollContent'
    | 'secondaryNav'
    | 'actionRow';

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

  /**
   * As CINCO seções do menu: o conteúdo compartilhado descreve a lista, e uma
   * stack com quatro documentava uma composição que não existe.
   */
  const SECTIONS = ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas'];

  /** A fileira do painel inferior, com a ação destrutiva por último. */
  const ACTIONS = [
    { label: 'Compartilhar', variant: 'outline' as const },
    { label: 'Duplicar', variant: 'outline' as const },
    { label: 'Excluir', variant: 'destructive' as const },
  ];
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
            <!-- Empilhamento, e não grade: é o que a folha compartilhada define
                 para formulário de painel, e o que o Vanilla renderiza.

                 Os campos são os de `variants.compositions.advancedFilters`:
                 Categoria e Preço mínimo. Aqui moravam Nome e Email, que o
                 conteúdo compartilhado não descreve em composição nenhuma — a
                 story renderizava um formulário e a docs page, outro. -->
            <SheetBody>
              <form class="nds-stack" data-spacing="sm">
                <div class="nds-stack" data-spacing="xs">
                  <Label for="sheet-story-categoria">Categoria</Label>
                  <Input id="sheet-story-categoria" value="Eletrônicos" />
                </div>
                <div class="nds-stack" data-spacing="xs">
                  <Label for="sheet-story-minimo">Preço mínimo</Label>
                  <Input id="sheet-story-minimo" type="number" value="100" />
                </div>
              </form>
            </SheetBody>
          {:else if variant === 'profileForm'}
            <!-- Três campos, na ordem das outras stacks: Nome, Nome de usuário,
                 Bio. O formulário de filtros tem dois, e a edição de perfil
                 perdia o do meio enquanto os dois dividiam o mesmo corpo. -->
            <SheetBody>
              <form class="nds-stack" data-spacing="sm">
                <div class="nds-stack" data-spacing="xs">
                  <Label for="sheet-story-perfil-nome">Nome</Label>
                  <Input id="sheet-story-perfil-nome" value="Juliana Mucci" />
                </div>
                <div class="nds-stack" data-spacing="xs">
                  <Label for="sheet-story-perfil-usuario">Nome de usuário</Label>
                  <Input id="sheet-story-perfil-usuario" value="@julianamucci" />
                </div>
                <div class="nds-stack" data-spacing="xs">
                  <Label for="sheet-story-perfil-bio">Bio</Label>
                  <Input id="sheet-story-perfil-bio" value="Designer de sistemas em São Paulo" />
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
                {#each SECTIONS as item (item)}
                  <a
                    href="#{item.toLowerCase()}"
                    class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent"
                  >{item}</a>
                {/each}
              </nav>
            </SheetBody>
          {:else if variant === 'actionRow'}
            <SheetBody>
              <div class="nds-cluster" data-spacing="md">
                {#each ACTIONS as action (action.label)}
                  <Button variant={action.variant}>{action.label}</Button>
                {/each}
              </div>
            </SheetBody>
          {:else}
            <!--
              O caso default também tem corpo. Antes ele ia do cabeçalho direto
              ao rodapé, e o Playground mostrava um painel sem a área que rola —
              justamente a peça que a Demonstração da docs page apresenta.
            -->
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                Conteúdo do painel: formulário, lista ou mensagem. É esta área que rola quando o
                conteúdo passa da altura da tela.
              </p>
            </SheetBody>
          {/if}

          {#if variant !== 'secondaryNav'}
            <!--
              A fileira de ações tem rodapé, mas só com a saída: a decisão já foi
              tomada no corpo, e repetir uma confirmação aqui diria que falta um
              passo que não existe.
            -->
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
              {#if variant !== 'actionRow'}
                <Button onclick={onAction}>
                  {actionLabel}
                </Button>
              {/if}
            </SheetFooter>
          {/if}
        </SheetContent>
      </Sheet>
  {/key}
</div>
