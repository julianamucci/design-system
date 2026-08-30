<script lang="ts" module>
  // ─── ComposerModelPicker ───────────────────────────────────────────────────
  //
  // O controle do trilho que diz QUEM responde.
  //
  // Desenho em `nds/composer.css`, no bloco do seletor de modelo, que também
  // guarda as quatro decisões de acessibilidade. O vocabulário — `ModelOption`,
  // `isModelSelectable` — vem de `@shared/primitives/chat-protocol`.
  //
  // A PEÇA É AUTÔNOMA. Ela não mora dentro do composer: quem consome a monta e
  // a põe no início do trilho, pelo mesmo espaço que qualquer outro controle
  // usa. É o que permite ter o seletor sem ter o campo — numa barra de
  // ferramentas, numa página de ajustes — e é o que impede o composer de
  // crescer uma prop por controle que alguém invente.
  //
  // O GATILHO LEVA SÓ O NOME, A LISTA LEVA A DESCRIÇÃO. Um trilho é estreito e
  // o nome é o que se confere de relance; a descrição é o que se lê na hora de
  // trocar. Pôr as duas no gatilho encolhe o campo, que é o que importa ali.
  //
  // O FOCO ENTRA NA LISTA, ao contrário do seletor do caractere gatilho. Lá o
  // foco não pode sair do campo, porque quem escolhe continua escrevendo; aqui
  // não há texto em curso — a escolha é o único assunto enquanto a lista está
  // aberta, e a lista é o lugar certo para o teclado estar. O cursor anda por
  // `aria-activedescendant`, e fechar devolve o foco ao gatilho.
  //
  // O QUE O COMPONENTE NÃO FAZ: trocar de modelo. Ele avisa qual foi confirmado
  // e devolve o controle — quem sabe o que a troca custa, quem tem direito a
  // qual e o que acontece depois é quem monta a conversa. Mesma divisão de
  // `approval` no `chat-thread`.

  /**
   * O vocabulário do seletor. Tudo aqui é TEXTO de interface, e por isso tem
   * três idiomas.
   */
  export interface ComposerModelPickerLabels {
    /** Nome acessível do gatilho. `{label}` vira o nome do modelo escolhido. */
    trigger: string;
    /** Nome acessível da lista. */
    list: string;
  }
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import { isModelSelectable, type ModelOption } from '@shared/primitives/chat-protocol';
  import { Badge } from '@/components/ui/badge';
  import { Button } from '@/components/ui/button';
  import { cn } from '@/lib/utils.js';

  const {
    models,
    labels,
    value,
    onValueChange,
    open: initialOpen = false,
    onOpenChange,
    class: className,
  }: {
    /** Os modelos que podem responder, na ordem em que aparecem na lista. */
    models: ModelOption[];
    /** O texto da interface. Sem padrão em inglês escondido. */
    labels: ComposerModelPickerLabels;
    /**
     * O modelo escolhido, pelo endereço dele.
     *
     * Sem ele, o primeiro que PODE responder: abrir com um indisponível no
     * gatilho prometeria uma resposta que não vem.
     */
    value?: string;
    /** Alguém confirmou um modelo. Aplicar a troca é de quem monta a conversa. */
    onValueChange?: (model: ModelOption) => void;
    /**
     * A lista começa aberta.
     *
     * É SEMENTE, e não controle: quem abre e fecha depois é o próprio seletor,
     * porque abrir e fechar é desenho e não estado do mundo (guideline 17, §2).
     * `onOpenChange` existe para quem precisa acompanhar. Trocar a semente com
     * a peça já montada não reabre nada — quem precisa disso remonta o seletor.
     */
    open?: boolean;
    /** A lista abriu ou fechou. */
    onOpenChange?: (open: boolean) => void;
    class?: string;
  } = $props();

  // `$props.id()` só é aceito como inicializador de declaração no topo.
  const uid = $props.id();
  const panelId = `${uid}-panel`;
  const optionId = (index: number) => `${uid}-option-${index}`;

  /** O primeiro que pode responder, ou o primeiro da lista se nenhum puder. */
  function firstSelectable(list: ModelOption[]): number {
    const found = list.findIndex(isModelSelectable);
    return found === -1 ? 0 : found;
  }

  /** De onde a marca e o cursor partem, antes de alguém mexer em nada. */
  function seedIndex(): number {
    const found = value === undefined ? -1 : models.findIndex((model) => model.id === value);
    return found === -1 ? firstSelectable(models) : found;
  }

  let selectedIndex = $state(seedIndex());
  let activeIndex = $state(seedIndex());
  let openState = $state(initialOpen);
  let rootEl = $state<HTMLElement | null>(null);
  let panelEl = $state<HTMLElement | null>(null);
  let triggerEl = $state<HTMLElement | null>(null);

  const current = $derived(models[selectedIndex]);
  const currentLabel = $derived(current?.label ?? '');
  // Decisão 1 da folha: o nome acessível diz O QUE o gatilho escolhe, e não só
  // o valor escolhido — "Rápido, botão" não informa nada.
  const triggerLabel = $derived(labels.trigger.replace('{label}', currentLabel));

  /**
   * Abre ou fecha.
   *
   * `moveFocus` é o que separa a abertura por gesto da abertura por semente: na
   * primeira o teclado precisa ir para a lista, e na segunda o elemento pode
   * nem estar no documento — roubar o foco ao montar é defeito, e é justamente
   * o que a story fotografaria.
   */
  async function setOpen(next: boolean, moveFocus: boolean): Promise<void> {
    if (next === openState) return;
    openState = next;
    // O cursor começa no que já estava escolhido: é de lá que quem troca parte,
    // e começar no topo faria a lista perder o lugar a cada abertura.
    if (next) activeIndex = selectedIndex;
    onOpenChange?.(next);
    if (!moveFocus) return;
    await tick();
    // Sem isto o foco cairia no começo da página quando a lista some, e quem
    // navega por teclado perderia o lugar.
    if (next) panelEl?.focus();
    else triggerEl?.focus();
  }

  function setActive(index: number): void {
    if (index < 0 || index >= models.length) return;
    activeIndex = index;
  }

  function move(delta: number): void {
    if (models.length === 0) return;
    // Anda por TODAS as opções, inclusive as que não podem ser escolhidas.
    // Pular a indisponível esconderia o motivo justamente de quem navega por
    // teclado — que é quem mais depende de ele estar na leitura.
    setActive((activeIndex + delta + models.length) % models.length);
  }

  function choose(index: number): void {
    const model = models[index];
    if (!model) return;
    // A pergunta vai ao vocabulário compartilhado, e não a um `if` escrito aqui:
    // cinco stacks escreveriam cinco versões da mesma regra, e uma delas
    // discordaria.
    if (!isModelSelectable(model)) {
      // Nada muda, e a lista CONTINUA ABERTA. Fechar sem trocar pareceria uma
      // troca que não aconteceu, e o motivo — que está na própria opção —
      // sairia da tela junto.
      setActive(index);
      return;
    }
    selectedIndex = index;
    void setOpen(false, true);
    onValueChange?.(model);
  }

  function onTriggerClick(): void {
    void setOpen(!openState, !openState);
  }

  function onTriggerKeydown(event: KeyboardEvent): void {
    // A seta abre já com a lista sob o cursor — é o atalho de quem troca de
    // modelo sem tirar as mãos do teclado.
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (openState) return;
    event.preventDefault();
    void setOpen(true, true);
  }

  function onPanelKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        return;
      case 'Home':
        event.preventDefault();
        setActive(0);
        return;
      case 'End':
        event.preventDefault();
        setActive(models.length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(activeIndex);
        return;
      case 'Escape':
      case 'Tab':
        // Tab fecha como Escape: a lista não é uma parada da ordem de foco, e
        // deixar o foco sair dela com o painel aberto deixaria um painel sem
        // dono na tela.
        event.preventDefault();
        void setOpen(false, true);
        return;
      default:
        return;
    }
  }

  /**
   * O acionamento da opção chega pela LISTA, e não por um retorno em cada uma.
   *
   * A lista já é o elemento interativo — tem papel, foco e teclado —, então é
   * nela que o gesto pousa. Pendurar o retorno em cada opção pediria foco numa
   * caixa que o padrão manda apontar por `aria-activedescendant`, e a marcação
   * que sai daqui é a mesma dos dois jeitos.
   */
  function onPanelClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-slot="composer-model-option"]',
    );
    if (!target) return;
    const index = models.findIndex((model) => model.id === target.dataset.modelId);
    if (index !== -1) choose(index);
  }

  /**
   * Ponteiro fora da raiz fecha a lista, sem mexer no foco.
   *
   * O ouvinte só existe enquanto a lista está aberta, e a fase de captura é o
   * que garante que ele chegue antes de quem estiver embaixo. O que acontece
   * DENTRO do seletor é dele — inclusive no gatilho, que fecha pelo próprio
   * acionamento logo depois.
   */
  $effect(() => {
    if (!openState) return;
    const onDocumentPointerDown = (event: Event) => {
      if (rootEl?.contains(event.target as Node)) return;
      void setOpen(false, false);
    };
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  });
</script>

<div
  bind:this={rootEl}
  data-slot="composer-model"
  data-state={openState ? 'open' : 'closed'}
  class={cn('nds-composer-model', className)}
>
  <!--
    O gatilho leva só o NOME. A descrição fica para a lista, onde se lê na hora
    de trocar — e onde não custa a largura do campo.

    `aria-controls` só existe enquanto a lista existe: apontar um endereço que
    não está no documento é prometer um elemento que não há.
  -->
  <Button
    bind:ref={triggerEl}
    data-slot="composer-model-trigger"
    variant="ghost"
    size="sm"
    type="button"
    aria-haspopup="listbox"
    aria-expanded={openState}
    aria-controls={openState ? panelId : undefined}
    aria-label={triggerLabel}
    onclick={onTriggerClick}
    onkeydown={onTriggerKeydown}
  >{currentLabel}</Button>

  <!--
    A lista NÃO existe no documento quando fechada. Não é uma lista escondida: é
    ausência. Uma lista presente e invisível continuaria sendo lida, e prometeria
    uma escolha que não está à mão — e a folha declara `display: flex` no painel,
    então `hidden` perderia para ela de todo modo.

    O foco pousa aqui, e o cursor anda por `aria-activedescendant`. `tabindex` é
    `-1` e não `0`: a lista não é uma parada da ordem de foco — quem chega por
    Tab chega ao gatilho, que é o controle.
  -->
  {#if openState}
    <div
      bind:this={panelEl}
      id={panelId}
      data-slot="composer-model-panel"
      class="nds-composer-model-panel"
      role="listbox"
      tabindex="-1"
      aria-label={labels.list}
      aria-activedescendant={optionId(activeIndex)}
      onkeydown={onPanelKeydown}
      onclick={onPanelClick}
    >
      {#each models as model, index (model.id)}
        <!--
          Decisão 2 da folha: `aria-disabled` mais a frase, nunca só o cinza.
          `disabled` de verdade tiraria a opção da leitura em vez de explicá-la.
        -->
        <div
          id={optionId(index)}
          data-slot="composer-model-option"
          data-model-id={model.id}
          class="nds-composer-model-option"
          role="option"
          aria-selected={index === selectedIndex}
          aria-disabled={isModelSelectable(model) ? undefined : 'true'}
          data-active={index === activeIndex ? 'true' : undefined}
        >
          <span class="nds-composer-model-name">{model.label}</span>

          <!--
            Decisão 3 da folha: a etiqueta é REFORÇO. O desenho vem do badge do
            sistema; o lugar na grade vem da classe da folha.
          -->
          {#if model.badge}
            <Badge class="nds-composer-model-badge">{model.badge}</Badge>
          {/if}

          {#if model.description}
            <span class="nds-composer-model-description">{model.description}</span>
          {/if}

          <!--
            O motivo em TEXTO, dentro da opção — é o que o cursor anuncia ao
            passar por ela. Opção apagada sem explicação é a pergunta "por que
            não posso?" sem resposta na tela.
          -->
          {#if model.unavailable && model.unavailableReason}
            <span
              class="nds-composer-model-description"
              data-slot="composer-model-reason">{model.unavailableReason}</span
            >
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
