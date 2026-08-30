import {
  applyTrigger,
  findTrigger,
  rankByTerm,
  type TriggerMatch,
  type TriggerSpec,
} from '@shared/primitives/composer-trigger';

/**
 * O seletor que abre quando alguém digita um caractere gatilho no composer.
 *
 * Desenho em `nds/composer.css`, no bloco do seletor do gatilho. A MÁQUINA —
 * onde o gatilho vale, o que ele recorta, como o filtro ordena e o que fica
 * escrito depois da escolha — vive em `@shared/primitives/composer-trigger`, e
 * é compartilhada pelas cinco stacks. Este módulo é o DOM em volta dela.
 *
 * A DECISÃO QUE ATRAVESSA O COMPOSER INTEIRO: com o seletor aberto, a tecla de
 * envio ESCOLHE em vez de enviar. As duas coisas disputam a mesma tecla, e
 * enviar no meio de uma menção é o defeito que quem escreve encontra na
 * primeira vez que usa. Quem resolve a disputa é o composer, perguntando ao
 * seletor se ele está aberto antes de decidir o que a tecla faz.
 *
 * O FOCO NUNCA SAI DO CAMPO. Quem escreve continua escrevendo enquanto escolhe;
 * mover o foco para a lista faria a próxima letra não chegar ao texto. O campo
 * aponta a opção ativa por `aria-activedescendant`, e a lista nunca é focada.
 *
 * E O CAMPO NÃO VIRA `combobox`, ainda que o padrão tenha esse nome.
 *
 * A primeira versão punha `role="combobox"` no `<textarea>`, que é o que a
 * literatura descreve — e o axe reprovou por `aria-allowed-role`: a
 * especificação de ARIA em HTML não admite esse papel neste elemento, que já é
 * uma caixa de texto de várias linhas. Trocar o papel também custaria a
 * semântica de multilinha, que é o que o campo de fato é.
 *
 * O que fica é o que a caixa de texto ADMITE e resolve o problema:
 * `aria-controls` liga o campo à lista, e `aria-activedescendant` aponta a
 * opção sem mover o foco. `aria-expanded` saiu junto com o papel — ele não é
 * permitido numa caixa de texto, e sem o papel não teria o que descrever.
 */

/** Uma opção do seletor. */
export interface TriggerOption {
  /** Endereço da opção. Vira o `id` do elemento, que o campo aponta. */
  id: string;
  /** O que se lê na lista, e o que o filtro compara. */
  label: string;
  /** Informação de apoio à direita — time, atalho, descrição curta. */
  hint?: string;
  /**
   * O que fica escrito ao escolher. Sem ele, o caractere gatilho mais o rótulo.
   *
   * Existe porque o que se escreve nem sempre é o que se lê: um comando mostra
   * "Resumir a conversa" e escreve `/resumir`.
   */
  value?: string;
}

/** Um gatilho e as opções que ele oferece. */
export interface TriggerSource {
  spec: TriggerSpec;
  options: TriggerOption[];
}

export interface TriggerPopoverLabels {
  /**
   * O que aparece quando o filtro não deixa nada.
   *
   * Texto, e não lista vazia: lista vazia é silêncio para quem não vê a tela, e
   * silêncio parece que a busca não respondeu.
   */
  empty: string;
  /** Nome acessível da lista. */
  list: string;
}

export interface TriggerPopoverOptions {
  /** O campo que o seletor observa. É ele que aponta a lista e a opção ativa. */
  input: HTMLTextAreaElement;
  sources: TriggerSource[];
  labels: TriggerPopoverLabels;
  /** Aplicada a escolha, o texto e a posição do cursor voltam por aqui. */
  onApply?: (text: string, caret: number) => void;
}

export interface TriggerPopoverController {
  /** O painel, para quem monta a árvore. */
  element: HTMLElement;
  /** Relê o campo e decide se o seletor abre, filtra ou fecha. */
  sync: () => void;
  /** Está aberto? É o que decide de quem é a tecla de envio. */
  isOpen: () => boolean;
  /** Anda pela lista. O foco não se move; o que muda é a opção apontada. */
  move: (delta: number) => void;
  /** Escreve a opção ativa no campo. Devolve `false` se não havia o que aplicar. */
  applyActive: () => boolean;
  /** Fecha sem escolher. */
  close: () => void;
}

let instances = 0;

export function createTriggerPopover(
  options: TriggerPopoverOptions,
): TriggerPopoverController {
  const { input, sources, labels, onApply } = options;
  const id = `nds-composer-trigger-${++instances}`;

  const element = document.createElement('div');
  element.dataset.slot = 'composer-trigger-popover';
  element.className = 'nds-composer-trigger-popover';
  element.id = id;
  element.hidden = true;

  let match: TriggerMatch | null = null;
  let visible: TriggerOption[] = [];
  let activeIndex = 0;

  /**
   * O campo aponta a lista só enquanto ela existe para ele.
   *
   * Fechada a lista, os dois atributos saem: um `aria-controls` apontando um
   * painel escondido promete uma lista que não há, e um
   * `aria-activedescendant` órfão aponta um elemento que já não existe.
   */
  const markField = (isOpen: boolean) => {
    if (!isOpen) {
      input.removeAttribute('aria-controls');
      input.removeAttribute('aria-activedescendant');
      return;
    }
    input.setAttribute('aria-controls', id);
    const active = visible[activeIndex];
    if (active) input.setAttribute('aria-activedescendant', `${id}-${active.id}`);
    else input.removeAttribute('aria-activedescendant');
  };

  const render = () => {
    element.replaceChildren();

    if (!visible.length) {
      // SEM OPÇÕES, O PAINEL NÃO É UMA LISTA.
      //
      // Uma lista de opções vazia reprova em `aria-required-children`, e com
      // razão: ela promete filhos que não existem, e o leitor de tela anuncia
      // "lista com zero itens" em vez da frase que explica o que houve. Sem o
      // papel, o que resta é o texto — que é justamente o que se quer ler.
      element.removeAttribute('role');
      element.removeAttribute('aria-label');

      const emptyEl = document.createElement('p');
      emptyEl.className = 'nds-composer-trigger-empty';
      emptyEl.textContent = labels.empty;
      element.appendChild(emptyEl);
      return;
    }

    element.setAttribute('role', 'listbox');
    element.setAttribute('aria-label', labels.list);

    visible.forEach((option, i) => {
      const item = document.createElement('div');
      item.className = 'nds-composer-trigger-option';
      item.id = `${id}-${option.id}`;
      item.setAttribute('role', 'option');
      // `aria-selected` e a cor de fundo saem juntos: um é o que o leitor de
      // tela anuncia, o outro é o que os olhos veem. Só um deixa metade das
      // pessoas sem saber onde está.
      item.setAttribute('aria-selected', String(i === activeIndex));

      const label = document.createElement('span');
      label.className = 'nds-composer-trigger-option-label';
      label.textContent = option.label;
      item.appendChild(label);

      if (option.hint) {
        const hint = document.createElement('span');
        hint.className = 'nds-composer-trigger-option-hint';
        hint.textContent = option.hint;
        item.appendChild(hint);
      }

      // `mousedown`, e não `click`: o clique tira o foco do campo antes de
      // disparar, e a escolha passaria a acontecer com o cursor já perdido.
      item.addEventListener('mousedown', (event) => {
        event.preventDefault();
        activeIndex = i;
        applyActive();
      });

      element.appendChild(item);
    });
  };

  const open = () => {
    element.hidden = false;
    render();
    markField(true);
  };

  const close = () => {
    if (element.hidden && !input.hasAttribute('aria-controls')) return;
    element.hidden = true;
    match = null;
    visible = [];
    activeIndex = 0;
    element.replaceChildren();
    markField(false);
  };

  const sync = () => {
    const specs = sources.map((s) => s.spec);
    const found = findTrigger(input.value, input.selectionStart ?? 0, specs);
    if (!found) {
      close();
      return;
    }
    const source = sources.find((s) => s.spec.char === found.spec.char);
    if (!source) {
      close();
      return;
    }

    // O termo mudou: a opção ativa volta ao topo. Manter o índice faria a
    // escolha pular para outra pessoa a cada letra digitada.
    const previousTerm = match?.term;
    match = found;
    visible = rankByTerm(source.options, found.term, (o) => o.label);
    if (previousTerm !== found.term) activeIndex = 0;
    if (activeIndex >= visible.length) activeIndex = 0;

    open();
  };

  const move = (delta: number) => {
    if (element.hidden || !visible.length) return;
    // Circular: quem está no fim e desce volta ao começo. Uma lista que para
    // na última obriga a subir de volta contando.
    activeIndex = (activeIndex + delta + visible.length) % visible.length;
    render();
    markField(true);
  };

  function applyActive(): boolean {
    if (element.hidden || !match || !visible.length) return false;
    const option = visible[activeIndex];
    if (!option) return false;

    const replacement = option.value ?? `${match.spec.char}${option.label}`;
    const applied = applyTrigger(
      input.value,
      match,
      input.selectionStart ?? 0,
      replacement,
    );

    input.value = applied.text;
    input.setSelectionRange(applied.caret, applied.caret);
    close();
    onApply?.(applied.text, applied.caret);
    return true;
  }

  return { element, sync, isOpen: () => !element.hidden, move, applyActive, close };
}
