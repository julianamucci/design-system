<script lang="ts" module>
  // ─── ComposerTriggerPopover ────────────────────────────────────────────────
  //
  // O painel que abre quando alguém digita um caractere gatilho no composer.
  //
  // Desenho em `nds/composer.css`, no bloco do seletor do gatilho. A MÁQUINA —
  // onde o gatilho vale, o que ele recorta, como o filtro ordena e o que fica
  // escrito depois da escolha — vive em `@shared/primitives/composer-trigger` e
  // é compartilhada. Este componente é o DESENHO em volta dela, e nada mais:
  // ele não lê o campo, não filtra e não decide de quem é a tecla de envio.
  // Quem faz isso é o composer, que é quem tem o campo.
  //
  // O FOCO NUNCA CHEGA AQUI. Quem escreve continua escrevendo enquanto escolhe;
  // mover o foco para a lista faria a próxima letra não chegar ao texto. O campo
  // aponta a opção ativa por `aria-activedescendant`, e a lista nunca é focada —
  // por isso não há `tabindex` em lugar nenhum deste arquivo.
  //
  // E O CAMPO NÃO VIRA `combobox`, ainda que o padrão tenha esse nome. A
  // primeira versão punha `role="combobox"` no campo, que é o que a literatura
  // descreve, e o axe reprovou por `aria-allowed-role`: a especificação de ARIA
  // em HTML não admite esse papel numa caixa de texto de várias linhas. O que
  // fica é o que ela ADMITE e resolve o problema — `aria-controls` liga o campo
  // à lista e `aria-activedescendant` aponta a opção sem mover o foco.
  import type { TriggerSpec } from '@shared/primitives/composer-trigger';

  /** Uma opção do seletor. */
  export interface TriggerOption {
    /** Endereço da opção. Vira o `id` do elemento, que o campo aponta. */
    id: string;
    /** O que se lê na lista, e o que o filtro compara. */
    label: string;
    /** Informação de apoio à direita — time, atalho, descrição curta. */
    hint?: string;
    /**
     * O que fica escrito ao escolher. Sem ele, o caractere gatilho mais o
     * rótulo.
     *
     * Existe porque o que se escreve nem sempre é o que se lê: um comando
     * mostra "Resumir a conversa" e escreve `/resumir`.
     */
    value?: string;
  }

  /** Um gatilho e as opções que ele oferece. */
  export interface TriggerSource {
    spec: TriggerSpec;
    options: TriggerOption[];
  }

  /** O texto do painel. Não há padrão em inglês escondido. */
  export interface TriggerPopoverLabels {
    /**
     * O que aparece quando o filtro não deixa nada.
     *
     * Texto, e não lista vazia: lista vazia é silêncio para quem não vê a tela,
     * e silêncio parece que a busca não respondeu.
     */
    empty: string;
    /** Nome acessível da lista. */
    list: string;
  }

  export type ComposerTriggerPopoverProps = {
    /** O endereço do painel. É o que o campo aponta por `aria-controls`. */
    id: string;
    /**
     * O painel continua no documento quando fechado, escondido.
     *
     * Tirá-lo da árvore custaria a referência que o campo mantém e não pouparia
     * nada: fechado ele não tem filho nenhum.
     */
    open: boolean;
    /** O que a lista oferece AGORA, já filtrado e ordenado por quem consome. */
    options: TriggerOption[];
    /** Qual opção está apontada. Apontada, e não focada. */
    activeIndex: number;
    labels: TriggerPopoverLabels;
    /** Alguém escolheu pelo ponteiro. O índice vai junto. */
    onChoose: (index: number) => void;
  };
</script>

<script lang="ts">
  let { id, open, options, activeIndex, labels, onChoose }: ComposerTriggerPopoverProps =
    $props();

  /**
   * A escolha acontece ao APERTAR o botão, e não ao soltar.
   *
   * Soltar tira o foco do campo antes de o evento chegar, e a escolha
   * aconteceria com o cursor já perdido. O `preventDefault` é o que impede o
   * navegador de mover o foco para cá.
   */
  function onPick(event: MouseEvent, index: number): void {
    event.preventDefault();
    onChoose(index);
  }
</script>

<div
  {id}
  data-slot="composer-trigger-popover"
  class="nds-composer-trigger-popover"
  hidden={!open}
  role={open && options.length ? 'listbox' : undefined}
  aria-label={open && options.length ? labels.list : undefined}
>
  {#if open}
    <!--
      SEM OPÇÕES, O PAINEL NÃO É UMA LISTA.

      Uma lista de opções vazia reprova em `aria-required-children`, e com
      razão: ela promete filhos que não existem, e o leitor de tela anuncia
      "lista com zero itens" em vez da frase que explica o que houve. Sem o
      papel, o que resta é o texto — que é justamente o que se quer ler.
    -->
    {#if options.length === 0}
      <p class="nds-composer-trigger-empty">{labels.empty}</p>
    {/if}

    {#each options as option, index (option.id)}
      <!--
        `aria-selected` e a cor de fundo saem juntos: um é o que o leitor de
        tela anuncia, o outro é o que os olhos veem. Só um deixa metade das
        pessoas sem saber onde está.

        A OPÇÃO NÃO RECEBE `tabindex`, e o aviso do compilador é dispensado de
        propósito. A regra dele vale para a lista que TOMA o foco; esta é
        apontada por `aria-activedescendant` a partir do campo, que é o padrão
        que mantém quem escreve escrevendo. Dar foco à opção quebraria
        justamente o que o componente existe para preservar.
      -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <div
        id={`${id}-${option.id}`}
        class="nds-composer-trigger-option"
        role="option"
        aria-selected={index === activeIndex}
        onmousedown={(event) => onPick(event, index)}
      >
        <span class="nds-composer-trigger-option-label">{option.label}</span>
        {#if option.hint}
          <span class="nds-composer-trigger-option-hint">{option.hint}</span>
        {/if}
      </div>
    {/each}
  {/if}
</div>
