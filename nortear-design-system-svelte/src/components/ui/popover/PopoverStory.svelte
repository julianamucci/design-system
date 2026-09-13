<script lang="ts">
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverClose, type PopoverCloseReason } from './index';
  import { Button } from '@/components/ui/button';
  import { Checkbox } from '@/components/ui/checkbox';
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
    | 'quickSettings'
    | 'options';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    defaultOpen?: boolean;
    open?: boolean;
    /** Modo modal — foco preso, rolagem travada, painel anunciado como modal. */
    modal?: boolean;
    triggerLabel?: string;
    title?: string;
    description?: string;
    saveLabel?: string;
    cancelLabel?: string;
    nameLabel?: string;
    emailLabel?: string;
    submitLabel?: string;
    variant?: Variant;
    /**
     * Folga real ACIMA do gatilho — um irmão inerte antes do popover.
     *
     * Existe para a story do auto-flip poder medir os dois casos: com a folga o
     * painel cabe no lado pedido, sem ela a lib tem de virar. É um IRMÃO de
     * verdade e não `data-split="last"`, que é o que as stacks irmãs tinham até
     * 2026-09-13 e não empurrava nada — aquele utilitário põe `margin-top: auto`
     * no ÚLTIMO filho, e o popover já era o último.
     */
    spaceAbove?: boolean;
    /**
     * Detecção de colisão da lib — desligar é o plantio que prova que o passo
     * do flip mede o RECURSO, e não um atributo que calhou de bater.
     */
    avoidCollisions?: boolean;
    /**
     * Nome acessível DECLARADO do painel. Só faz sentido na composição sem
     * título: onde há `PopoverTitle`, quem nomeia é o `aria-labelledby`, e um
     * `aria-label` junto venceria o título visível.
     */
    panelLabel?: string;
    onAction?: () => void;
    onCancel?: () => void;
    /** Mudança de estado — no fechamento, com o motivo do design system. */
    onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
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
    modal = false,
    triggerLabel = 'Abrir popover',
    title = 'Configurações de exibição',
    description = 'Ajuste a aparência do conteúdo da página.',
    saveLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    nameLabel = 'Nome',
    emailLabel = 'Email',
    submitLabel = 'Atualizar',
    variant = 'default',
    spaceAbove = false,
    avoidCollisions = undefined,
    panelLabel = undefined,
    onAction,
    onCancel,
    onOpenChange,
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
  function closeECancelar(propsDoClose: unknown, event: MouseEvent): void {
    (propsDoClose as { onclick?: (e: MouseEvent) => void }).onclick?.(event);
    onCancel?.();
  }

  /**
   * Confirma a ação e fecha o painel POR CÓDIGO — o outro caminho de saída.
   *
   * O botão de confirmação NÃO é envolvido em `PopoverClose`: a peça de fechar
   * anota `close-button`, e com ela "concluiu" chegaria ao relatório como
   * "apertou o botão de fechar", apagando a diferença que justifica o campo
   * existir. Cancelar é a peça de fechar; Salvar/Aplicar/Confirmar fecham por
   * código, depois de agir, e por isso o motivo é `api`.
   *
   * A entrega do motivo é MANUAL aqui, e não por descuido: medido na fonte do
   * bits-ui (`popover.svelte` da lib), `onOpenChange` só é chamado pelo
   * ESCRITOR do `boxWith` da raiz — ou seja, quando quem fecha é a própria
   * lib. Escrever no `bind:open` de fora fecha o painel EM SILÊNCIO, sem
   * chamar ninguém. Então a mudança de estado sai daqui, com o motivo junto.
   */
  function confirmAndClose(): void {
    onAction?.();
    open = false;
    onOpenChange?.(false, 'api');
  }

  const STATUS = ['Ativo', 'Pendente', 'Arquivado'];

  const PREFERENCIAS = [
    { name: 'Notificações', marcada: true },
    { name: 'Modo escuro', marcada: false },
    { name: 'Modo compacto', marcada: false },
  ];

  /**
   * Os dois focáveis da variante `options` — ver o comentário dela no markup.
   *
   * `$state` porque cada caixa é ligada por `bind:checked`: sem estado, marcar
   * uma delas não mudaria nada e a story ensinaria um controle inerte.
   */
  const MODAL_OPTIONS = $state([
    { id: 'popover-option-remember', label: 'Lembrar minha escolha', checked: true },
    { id: 'popover-option-email', label: 'Receber aviso por e-mail', checked: false },
  ]);
</script>

<div class="nds-stack" data-align="center" data-spacing="md" style="contain: layout">
  {#if spaceAbove}
    <!-- Irmão inerte, FORA do `{#key}`: o remonte do popover não o recria, então
         a play pode esconder e reexibir a folga sem disputar com o Svelte. -->
    <div class="nds-min-h-60" aria-hidden="true"></div>
  {/if}
  {#key `${side}-${align}-${defaultOpen}-${variant}`}
      <Popover bind:open {modal} {onOpenChange}>
        <PopoverTrigger>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </PopoverTrigger>
        <!-- `undefined` não escreve atributo nenhum: as composições com título
             seguem nomeadas pelo `aria-labelledby` do próprio título. -->
        <PopoverContent
          {side}
          {align}
          {sideOffset}
          {avoidCollisions}
          aria-label={variant === 'default' ? panelLabel : undefined}
        >
          {#if variant === 'form'}
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <form
              class="nds-stack"
              data-spacing="md"
              onsubmit={(e) => {
                // O confirmar do formulário é `type="submit"`, e o fechamento
                // vai AQUI, nunca no `click` do botão: fechar no clique
                // desmontaria o formulário antes de ele submeter, e o submit
                // — que é o "salvar" — nunca aconteceria. Depois do
                // `preventDefault` é literalmente "salvou, então fechou por
                // código".
                e.preventDefault();
                confirmAndClose();
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
                      onclick={(event: MouseEvent) => closeECancelar(props, event)}
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
                  <!-- `closeECancelar` encadeia o handler da lib: ver o
                       porquê no bloco de documentação da função, acima. -->
                  <Button
                    variant="ghost"
                    size="sm"
                    {...props}
                    onclick={(event: MouseEvent) => closeECancelar(props, event)}
                  >{cancelLabel}</Button>
                {/snippet}
              </PopoverClose>
              <Button size="sm" onclick={confirmAndClose}>{saveLabel}</Button>
            </div>
          {:else if variant === 'options'}
            <!-- ─── Variante PRÓPRIA, e o porquê de não reaproveitar a
                 `withTitle` ───────────────────────────────────────────────

                 Quem consome esta variante é só a story `Modal`, que precisa
                 de DOIS focáveis no painel: com um só, "o Tab do último volta
                 ao primeiro" seria verdade sem laço nenhum — primeiro e
                 último seriam o mesmo elemento.

                 Os dois focáveis não podem ser Cancelar/Confirmar. Ali eles
                 não executavam ação nenhuma, e botão que promete o que não
                 faz é defeito de exemplo; virar botão de verdade também não
                 serve, porque um `PopoverClose` REGISTRADO no painel faz o
                 gerenciador de foco da lib trapear sozinho — a story passaria
                 a medir a lib, não o laço. Checkbox é controle que se basta:
                 marcar já É o efeito, sem prometer nada além.

                 E vai numa variante nova em vez de alterar a `withTitle`
                 porque este componente é compartilhado com as outras stories
                 do arquivo, que seguem medindo o rodapé de Cancelar/Salvar. -->
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              <PopoverDescription>{description}</PopoverDescription>
            </PopoverHeader>
            <div class="nds-stack" data-spacing="sm">
              {#each MODAL_OPTIONS as option (option.id)}
                <div class="nds-cluster" data-spacing="sm">
                  <Checkbox id={option.id} bind:checked={option.checked} />
                  <Label for={option.id}>{option.label}</Label>
                </div>
              {/each}
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
              <Button size="sm" onclick={confirmAndClose}>Aplicar</Button>
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
              {#each PREFERENCIAS as pref (pref.name)}
                <label class="nds-cluster" data-align="center" data-justify="between">
                  <span>{pref.name}</span>
                  <input type="checkbox" class="nds-size-4" checked={pref.marcada} />
                </label>
              {/each}
            </div>
          {:else}
            <p>{description}</p>
          {/if}
        </PopoverContent>
      </Popover>
  {/key}

  <!-- Alvo inerte para a dispensa por clique fora: clicar em `document.body`
       depende da geometria da página e do ponto exato do clique sintético. -->
  <p class="nds-text-body nds-text-muted-foreground" data-testid="area-externa">Área externa</p>
</div>
