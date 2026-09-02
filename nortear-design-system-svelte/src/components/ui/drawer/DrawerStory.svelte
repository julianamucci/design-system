<script lang="ts">
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
    onAction,
    onCancel,
  }: Props = $props();
</script>

<div style="contain: layout">
  {#key `${direction}-${defaultOpen}-${dismissible}-${variant}`}
      <Drawer bind:open {direction} {dismissible}>
        <DrawerTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          {#if variant === 'withForm'}
            <DrawerBody>
              <form class="nds-grid" data-spacing="sm">
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
            <Button onclick={onAction}>{actionLabel}</Button>
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
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
  {/key}
</div>
