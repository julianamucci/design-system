<script lang="ts">
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverClose,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant =
    | 'default'
    | 'withTitle'
    | 'form'
    | 'tableFilter'
    | 'colorPicker'
    | 'quickSettings';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    title?: string;
    description?: string;
    saveLabel?: string;
    cancelLabel?: string;
    nameLabel?: string;
    emailLabel?: string;
    submitLabel?: string;
    variant?: Variant;
    onAction?: () => void;
    onCancel?: () => void;
  }
  // `defaultOpen` não existe no bits-ui nem no vaul-svelte: a prop era
  // passada, ignorada, e o overlay nunca abria. A API real é `open`
  // (bindable). Inicializar `open` com `defaultOpen` cobre os dois usos e
  // apaga o ramo duplicado que existia só para o caso não controlado.

  let {
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    defaultOpen = false,
    open = $bindable(defaultOpen),
    triggerLabel = 'Abrir popover',
    title = 'Configurações de exibição',
    description = 'Ajuste a aparência do conteúdo da página.',
    saveLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    nameLabel = 'Nome',
    emailLabel = 'Email',
    submitLabel = 'Atualizar',
    variant = 'default',
    onAction,
    onCancel,
  }: Props = $props();

  /**
   * Fecha o painel E avisa quem consome.
   *
   * O `onclick` que o snippet `child` do PopoverClose entrega é o que FECHA o
   * painel. Escrever `onclick={onCancel}` depois do spread o substituía, e o
   * Cancelar deixava de cancelar — medido: sem este encadeamento a play falha
   * com "popover still open". O `onkeydown` sobrevive ao spread, então
   * Enter/Space fechavam e só o clique não, que é o que manteve o defeito
   * invisível por tanto tempo.
   *
   * O tipo do parâmetro do snippet chega como `{}`; o `as` declara o que a lib
   * de fato põe lá dentro.
   */
  function fecharECancelar(propsDoClose: unknown, event: MouseEvent): void {
    (propsDoClose as { onclick?: (e: MouseEvent) => void }).onclick?.(event);
    onCancel?.();
  }

  const STATUS = ['Ativo', 'Pendente', 'Arquivado'];

  const PREFERENCIAS = [
    { nome: 'Notificações', marcada: true },
    { nome: 'Modo escuro', marcada: false },
    { nome: 'Modo compacto', marcada: false },
  ];
</script>

<div class="nds-stack" data-align="center" data-spacing="md" style="contain: layout">
  {#key `${side}-${align}-${defaultOpen}-${variant}`}
      <Popover bind:open>
        <PopoverTrigger>
          {#snippet child({ props })}
            <Button {...props}>{triggerLabel}</Button>
          {/snippet}
        </PopoverTrigger>
        <PopoverContent {side} {align} {sideOffset}>
          {#if variant === 'form'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <form
              class="nds-stack"
              data-spacing="sm"
              onsubmit={(e) => {
                e.preventDefault();
                onAction?.();
              }}
            >
              <div class="nds-stack" data-spacing="xs">
                <Label for="popover-form-nome">{nameLabel}</Label>
                <Input id="popover-form-nome" value="Ana Ribeiro" />
              </div>
              <div class="nds-stack" data-spacing="xs">
                <Label for="popover-form-email">{emailLabel}</Label>
                <Input id="popover-form-email" type="email" value="ana@nortear.com.br" />
              </div>
              <div class="nds-cluster" data-justify="end" data-spacing="sm">
                <PopoverClose>
                  {#snippet child({ props })}
                    <Button
                      variant="ghost"
                      size="sm"
                      {...props}
                      onclick={(event: MouseEvent) => fecharECancelar(props, event)}
                    >{cancelLabel}</Button>
                  {/snippet}
                </PopoverClose>
                <Button type="submit" size="sm">{submitLabel}</Button>
              </div>
            </form>
          {:else if variant === 'withTitle'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <PopoverClose>
                {#snippet child({ props })}
                  <!-- `fecharECancelar` encadeia o handler da lib: ver o
                       porquê no bloco de documentação da função, acima. -->
                  <Button
                    variant="outline"
                    size="sm"
                    {...props}
                    onclick={(event: MouseEvent) => fecharECancelar(props, event)}
                  >{cancelLabel}</Button>
                {/snippet}
              </PopoverClose>
              <Button size="sm" onclick={onAction}>{saveLabel}</Button>
            </div>
          {:else if variant === 'tableFilter'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <div class="nds-stack nds-text-body" data-spacing="xs">
              {#each STATUS as status, i (status)}
                <label class="nds-cluster" data-spacing="sm">
                  <input type="checkbox" class="nds-size-4" checked={i === 0} />
                  <span>{status}</span>
                </label>
              {/each}
            </div>
            <div class="nds-cluster" data-justify="end" data-spacing="sm">
              <Button variant="ghost" size="sm">Limpar</Button>
              <Button size="sm" onclick={onAction}>Aplicar</Button>
            </div>
          {:else if variant === 'colorPicker'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <!-- Os seis botões saem escritos um a um, e não de um `{#each}` com
                 classe interpolada: classe montada em runtime não é auditável —
                 o verificador de classe morta lê a expressão como nome de
                 classe. -->
            <div class="nds-cluster" data-spacing="sm">
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-primary" aria-label="Primária"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-secondary" aria-label="Secundária"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-success" aria-label="Sucesso"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-warning" aria-label="Atenção"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-info" aria-label="Informação"></button>
              <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-destructive" aria-label="Destrutiva"></button>
            </div>
          {:else if variant === 'quickSettings'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <div class="nds-stack nds-text-body" data-spacing="sm">
              {#each PREFERENCIAS as pref (pref.nome)}
                <label class="nds-cluster" data-align="center" data-justify="between">
                  <span>{pref.nome}</span>
                  <input type="checkbox" class="nds-size-4" checked={pref.marcada} />
                </label>
              {/each}
            </div>
          {:else}
            <p class="nds-text-body">{description}</p>
          {/if}
        </PopoverContent>
      </Popover>
  {/key}

  <!-- Alvo inerte para a dispensa por clique fora: clicar em `document.body`
       depende da geometria da página e do ponto exato do clique sintético. -->
  <p class="nds-text-body nds-text-muted-foreground" data-testid="area-externa">Área externa</p>
</div>
