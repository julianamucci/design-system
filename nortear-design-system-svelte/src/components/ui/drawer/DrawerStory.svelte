<script lang="ts">
  import { tick } from 'svelte';
  import {
    Drawer,
    DrawerBody,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';

  type Direction = 'bottom' | 'top' | 'left' | 'right';
  type Variant = 'default' | 'withForm' | 'withConfirmation' | 'withScroll';

  interface Props {
    direction?: Direction;
    defaultOpen?: boolean;
    open?: boolean;
    dismissible?: boolean;
    triggerLabel?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    cancelLabel?: string;
    variant?: Variant;
    /**
     * Nível do cabeçalho do título. Ausente, o título fica no nível padrão do
     * primitivo — é o que todas as outras stories deste andaime exercitam.
     */
    titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    onAction?: () => void;
    onCancel?: () => void;
  }

  // `defaultOpen` não existe no primitivo desta stack: a prop era passada,
  // ignorada, e o overlay nunca abria — as stories que dependiam dela falhavam
  // todas. A API real é `open` (bindable). Inicializar `open` com `defaultOpen`
  // cobre os dois usos e apaga o ramo duplicado que existia só para o caso não
  // controlado (os dois ramos eram idênticos fora do `open`).
  let {
    direction = 'bottom',
    defaultOpen = false,
    open = $bindable(defaultOpen),
    dismissible = true,
    triggerLabel = 'Abrir drawer',
    title = 'Editar perfil',
    description = 'Atualize seus dados pessoais e foto.',
    actionLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'default',
    titleLevel,
    onAction,
    onCancel,
  }: Props = $props();

  /**
   * Id do `<form>` da variante de formulário, e o elo da ação primária com ele.
   *
   * O rodapé é irmão do corpo por construção do primitivo — `.nds-drawer-body`
   * só rola enquanto é filho direto do flex column do painel —, então o `<form>`
   * não pode envolvê-lo: é o par id ↔ `form` que os religa. Sem o atributo, com
   * dois campos o navegador NÃO faz submissão implícita, o Enter num campo não
   * dispara nada, e nada na tela denuncia.
   *
   * O rodapé é ÚNICO para as quatro variantes deste andaime, então o elo é
   * condicional: nas outras não há `<form>` nenhum, e um `type="submit"` ali
   * seria a mesma promessa vazia em outro lugar.
   */
  const FORM_ID = 'drawer-story-form';
  const isFormVariant = $derived(variant === 'withForm');

  /** O elemento do painel. É daqui que sai o alvo do foco — ver abaixo. */
  let panelEl = $state<HTMLElement | null>(null);

  /**
   * Foco inicial na saída segura — só no painel de confirmação.
   *
   * Onde a decisão É a tela, o Enter por reflexo tem de cair no cancelar, nunca
   * na ação que consuma; é a mesma escolha do AlertDialog. Na variante de
   * formulário o padrão FICA: ali o assunto é editar, e forçar o Cancelar
   * cobraria um Tab a mais de quem só quer editar.
   *
   * O painel vem do REF, e não de `event.target` — este é o ponto.
   *
   * A lib não DESPACHA este evento: ela constrói um `CustomEvent` e o entrega
   * direto ao callback, então `event.target` é `null`. A versão anterior lia
   * dali e desistia na guarda de tipo, sem chamar `preventDefault()` — a lib
   * seguia com o padrão dela e focava o primeiro tabbable, que é o corpo
   * rolável. A escolha inteira era um no-op, e nada na tela denunciava.
   *
   * O `tick()` continua: `preventDefault()` tem de ser SÍNCRONO (a lib lê
   * `defaultPrevented` assim que o callback volta), e só depois do commit
   * pendente o rodapé está no DOM e o ref, preenchido.
   */
  async function focusSafeExit(event: Event) {
    event.preventDefault();
    await tick();
    if (!panelEl) return;
    const safeExit = panelEl.querySelector<HTMLElement>('[data-slot="drawer-close"]');
    (safeExit ?? panelEl).focus();
  }
</script>

<div style="contain: layout">
  {#key `${direction}-${defaultOpen}-${dismissible}-${variant}`}
      <Drawer bind:open {direction} {dismissible}>
        <DrawerTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </DrawerTrigger>
        <DrawerContent
          bind:ref={panelEl}
          onOpenAutoFocus={variant === 'withConfirmation' ? focusSafeExit : undefined}
        >
          <DrawerHeader>
            <!--
              Nível do cabeçalho pelo snippet `child`, e não pelo `level` sozinho:
              a lib expressa o nível em `role="heading"` + `aria-level` e mantém a
              TAG em `div`. O `level` vai junto para a tag e o ARIA concordarem. A
              medição está em DialogStory.svelte — os quatro painéis modais desta
              stack caem no mesmo arquivo da lib.
            -->
            {#if titleLevel}
              <DrawerTitle level={titleLevel}>
                {#snippet child({ props })}
                  <svelte:element this={`h${titleLevel}`} {...props}>{title}</svelte:element>
                {/snippet}
              </DrawerTitle>
            {:else}
              <DrawerTitle>{title}</DrawerTitle>
            {/if}
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          {#if variant === 'withForm'}
            <DrawerBody>
              <form
                id={FORM_ID}
                class="nds-grid"
                data-spacing="sm"
                onsubmit={(event: SubmitEvent) => event.preventDefault()}
              >
                <div class="nds-grid" data-spacing="xs">
                  <Label for="drawer-story-nome">Nome</Label>
                  <Input id="drawer-story-nome" type="text" value="Maria Silva" />
                </div>
                <div class="nds-grid" data-spacing="xs">
                  <Label for="drawer-story-email">E-mail</Label>
                  <Input id="drawer-story-email" type="email" value="maria@exemplo.com" />
                </div>
              </form>
            </DrawerBody>
          {:else if variant === 'withConfirmation'}
            <DrawerBody class="nds-text-body nds-text-muted-foreground">
              <p>Confirme a ação para prosseguir. Esta operação pode ser desfeita depois.</p>
            </DrawerBody>
          {:else if variant === 'withScroll'}
            <!-- Sem altura inline: `.nds-drawer-body` já rola dentro do teto de
                 altura do painel, e o `min-height: 0` dele é o que faz o corpo
                 ceder altura em vez de empurrar o rodapé para fora da tela. -->
            <DrawerBody
              class="nds-stack nds-text-body nds-text-muted-foreground"
              data-spacing="sm"
              aria-label="Termos de uso"
            >
              {#each Array.from({ length: 30 }) as _, i (i)}
                <p>Parágrafo {i + 1}: conteúdo extenso para demonstrar a rolagem interna do panel.</p>
              {/each}
            </DrawerBody>
          {/if}

          <DrawerFooter>
            <DrawerClose>
              {#snippet child({ props })}
                <!--
                `onclick` DEPOIS do spread sobrescrevia o handler que o
                primitivo entrega em `props` — o que fecha o painel. O Cancelar
                avisava o callback e não fechava nada: o painel seguia no DOM, e
                quem esperava o portal sumir esperava até estourar o tempo.
                Encadear os dois preserva o comportamento do primitivo.
              -->
              <Button
                variant="outline"
                {...props}
                onclick={(event: MouseEvent) => {
                  (props.onclick as ((e: MouseEvent) => void) | undefined)?.(event);
                  onCancel?.();
                }}
              >
                {cancelLabel}
              </Button>
              {/snippet}
            </DrawerClose>
            <Button
              type={isFormVariant ? 'submit' : 'button'}
              form={isFormVariant ? FORM_ID : undefined}
              onclick={onAction}
            >
              {actionLabel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
  {/key}
</div>
