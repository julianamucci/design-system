import { cn } from '@/lib/utils';
import { createBadge } from './badge';
import { createButton } from './button';
import { isModelSelectable, type ModelOption } from '@shared/primitives/chat-protocol';

/**
 * O controle do trilho que diz QUEM responde.
 *
 * Desenho em `nds/composer.css`, no bloco do seletor de modelo, que também
 * guarda as quatro decisões de acessibilidade. O vocabulário — `ModelOption`,
 * `isModelSelectable` — vem de `@shared/primitives/chat-protocol`.
 *
 * A PEÇA É AUTÔNOMA. Ela não mora dentro do composer: quem consome a monta e a
 * põe no início do trilho, pelo mesmo espaço que qualquer outro controle usa.
 * É o que permite ter o seletor sem ter o campo — numa barra de ferramentas,
 * numa página de ajustes — e é o que impede o composer de crescer uma prop por
 * controle que alguém invente.
 *
 * O GATILHO LEVA SÓ O NOME, A LISTA LEVA A DESCRIÇÃO. Um trilho é estreito e o
 * nome é o que se confere de relance; a descrição é o que se lê na hora de
 * trocar. Pôr as duas no gatilho encolhe o campo, que é o que importa ali.
 *
 * O FOCO ENTRA NA LISTA, ao contrário do seletor do caractere gatilho. Lá o
 * foco não pode sair do campo, porque quem escolhe continua escrevendo; aqui
 * não há texto em curso — a escolha é o único assunto enquanto a lista está
 * aberta, e a lista é o lugar certo para o teclado estar. O cursor anda por
 * `aria-activedescendant`, e fechar devolve o foco ao gatilho.
 *
 * O QUE O COMPONENTE NÃO FAZ: trocar de modelo. Ele avisa qual foi confirmado
 * e devolve o controle — quem sabe o que a troca custa, quem tem direito a
 * qual e o que acontece depois é quem monta a conversa. Mesma divisão de
 * `approval` no `chat-thread`.
 */

export interface ComposerModelPickerLabels {
  /** Nome acessível do gatilho. `{label}` vira o nome do modelo escolhido. */
  trigger: string;
  /** Nome acessível da lista. */
  list: string;
}

export interface ComposerModelPickerOptions {
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
   * `onOpenChange` existe para quem precisa acompanhar — e, no vanilla, o
   * `setOpen()` da raiz é o caminho de quem precisa mandar.
   */
  open?: boolean;
  /** A lista abriu ou fechou. */
  onOpenChange?: (open: boolean) => void;
  class?: string;
}

export type ComposerModelPickerElement = HTMLDivElement & {
  /** O endereço do modelo escolhido agora. */
  getValue: () => string;
  /** Troca o escolhido de fora — é por aqui que uma escolha aplicada volta. */
  setValue: (id: string) => void;
  /** A lista está aberta? */
  isOpen: () => boolean;
  /** Abre ou fecha sem mexer no foco. */
  setOpen: (open: boolean) => void;
};

/** O primeiro que pode responder, ou o primeiro da lista se nenhum puder. */
function firstSelectable(models: ModelOption[]): number {
  const found = models.findIndex(isModelSelectable);
  return found === -1 ? 0 : found;
}

let instances = 0;

export function createComposerModelPicker(
  options: ComposerModelPickerOptions,
): ComposerModelPickerElement {
  const {
    models,
    labels,
    value,
    open: initialOpen = false,
    onValueChange,
    onOpenChange,
  } = options;

  const id = `nds-composer-model-${++instances}`;
  const panelId = `${id}-panel`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const root = document.createElement('div') as ComposerModelPickerElement;
  root.dataset.slot = 'composer-model';
  root.className = cn('nds-composer-model', options.class);

  const found = value === undefined ? -1 : models.findIndex((m) => m.id === value);
  let selectedIndex = found === -1 ? firstSelectable(models) : found;
  let activeIndex = selectedIndex;
  let open = false;
  let panel: HTMLDivElement | null = null;

  // ── O gatilho ──────────────────────────────────────────────────────────────

  const trigger = createButton({
    label: models[selectedIndex]?.label ?? '',
    variant: 'ghost',
    size: 'sm',
  });
  trigger.dataset.slot = 'composer-model-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  root.appendChild(trigger);

  function renderTrigger() {
    const current = models[selectedIndex];
    const name = current?.label ?? '';
    trigger.textContent = name;
    // Decisão 1 da folha: o nome acessível diz O QUE o gatilho escolhe, e não
    // só o valor escolhido — "Rápido, botão" não informa nada.
    trigger.setAttribute('aria-label', labels.trigger.replace('{label}', name));
    trigger.setAttribute('aria-expanded', String(open));
    // O gatilho só aponta a lista enquanto ela existe: apontar um endereço
    // vazio é prometer um elemento que não está no documento.
    if (open) trigger.setAttribute('aria-controls', panelId);
    else trigger.removeAttribute('aria-controls');
  }

  // ── A lista ────────────────────────────────────────────────────────────────

  function syncSelected() {
    if (!panel) return;
    [...panel.children].forEach((child, index) => {
      child.setAttribute('aria-selected', String(index === selectedIndex));
    });
  }

  function setActive(index: number) {
    if (index < 0 || index >= models.length) return;
    activeIndex = index;
    if (!panel) return;
    [...panel.children].forEach((child, i) => {
      const el = child as HTMLElement;
      if (i === index) el.dataset.active = 'true';
      else delete el.dataset.active;
    });
    panel.setAttribute('aria-activedescendant', optionId(index));
  }

  function move(delta: number) {
    if (models.length === 0) return;
    // Anda por TODAS as opções, inclusive as que não podem ser escolhidas.
    // Pular a indisponível esconderia o motivo justamente de quem navega por
    // teclado — que é quem mais depende de ele estar na leitura.
    setActive((activeIndex + delta + models.length) % models.length);
  }

  function choose(index: number) {
    const model = models[index];
    if (!model) return;
    // A pergunta vai ao vocabulário compartilhado, e não a um `if
    // (model.unavailable)` escrito aqui: cinco stacks escreveriam cinco
    // versões da mesma regra, e uma delas discordaria.
    if (!isModelSelectable(model)) {
      // Nada muda, e a lista CONTINUA ABERTA. Fechar sem trocar pareceria uma
      // troca que não aconteceu, e o motivo — que está na própria opção —
      // sairia da tela junto.
      setActive(index);
      return;
    }
    selectedIndex = index;
    setOpen(false, true);
    onValueChange?.(model);
  }

  function buildOption(model: ModelOption, index: number): HTMLDivElement {
    const option = document.createElement('div');
    option.id = optionId(index);
    option.dataset.slot = 'composer-model-option';
    option.dataset.modelId = model.id;
    option.className = 'nds-composer-model-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', String(index === selectedIndex));

    // Decisão 2 da folha: `aria-disabled` mais a frase, nunca só o cinza.
    // `disabled` de verdade tiraria a opção da leitura em vez de explicá-la.
    if (!isModelSelectable(model)) option.setAttribute('aria-disabled', 'true');

    const name = document.createElement('span');
    name.className = 'nds-composer-model-name';
    name.textContent = model.label;
    option.appendChild(name);

    // Decisão 3 da folha: a etiqueta é REFORÇO. O desenho vem do badge do
    // sistema; o lugar na grade vem da classe da folha.
    if (model.badge) {
      option.appendChild(
        createBadge({ children: model.badge, className: 'nds-composer-model-badge' }),
      );
    }

    if (model.description) {
      const description = document.createElement('span');
      description.className = 'nds-composer-model-description';
      description.textContent = model.description;
      option.appendChild(description);
    }

    // O motivo em TEXTO, dentro da opção — é o que o cursor anuncia ao passar
    // por ela. Opção apagada sem explicação é a pergunta "por que não posso?"
    // sem resposta na tela.
    if (model.unavailable && model.unavailableReason) {
      const reason = document.createElement('span');
      reason.className = 'nds-composer-model-description';
      reason.dataset.slot = 'composer-model-reason';
      reason.textContent = model.unavailableReason;
      option.appendChild(reason);
    }

    option.addEventListener('click', () => choose(index));
    return option;
  }

  function buildPanel(): HTMLDivElement {
    const el = document.createElement('div');
    el.id = panelId;
    el.dataset.slot = 'composer-model-panel';
    el.className = 'nds-composer-model-panel';
    el.setAttribute('role', 'listbox');
    el.setAttribute('aria-label', labels.list);
    // O foco pousa na lista, e o cursor anda por `aria-activedescendant`.
    // `-1` e não `0`: a lista não é uma parada da ordem de foco — quem chega
    // por Tab chega ao gatilho, que é o controle.
    el.tabIndex = -1;
    models.forEach((model, index) => el.appendChild(buildOption(model, index)));
    el.addEventListener('keydown', onPanelKeydown);
    return el;
  }

  // ── Abrir e fechar ─────────────────────────────────────────────────────────

  function onDocumentPointerDown(event: Event) {
    // O que acontece DENTRO do seletor é dele — inclusive no gatilho, que
    // fecha pelo próprio clique logo depois.
    if (root.contains(event.target as Node)) return;
    setOpen(false, false);
  }

  function setOpen(next: boolean, moveFocus: boolean, notify = true) {
    if (next === open) return;
    open = next;
    root.dataset.state = open ? 'open' : 'closed';

    if (open) {
      // O cursor começa no que já estava escolhido: é de lá que quem troca
      // parte, e começar no topo faria a lista perder o lugar a cada abertura.
      activeIndex = selectedIndex;
      panel = buildPanel();
      root.appendChild(panel);
      setActive(activeIndex);
      document.addEventListener('pointerdown', onDocumentPointerDown, true);
      renderTrigger();
      if (moveFocus) panel.focus();
    } else {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
      panel?.remove();
      panel = null;
      renderTrigger();
      // Sem isto o foco cairia no começo da página quando a lista some, e
      // quem navega por teclado perderia o lugar.
      if (moveFocus) trigger.focus();
    }

    if (notify) onOpenChange?.(open);
  }

  function onPanelKeydown(event: KeyboardEvent) {
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
        setOpen(false, true);
        return;
      default:
        return;
    }
  }

  trigger.addEventListener('click', () => setOpen(!open, !open ? true : false));

  trigger.addEventListener('keydown', (event) => {
    // A seta abre já com a lista sob o cursor — é o atalho de quem troca de
    // modelo sem tirar as mãos do teclado.
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (open) return;
    event.preventDefault();
    setOpen(true, true);
  });

  // ── Estado exposto ─────────────────────────────────────────────────────────

  root.getValue = () => models[selectedIndex]?.id ?? '';
  root.setValue = (nextId: string) => {
    const index = models.findIndex((m) => m.id === nextId);
    if (index === -1) return;
    selectedIndex = index;
    renderTrigger();
    syncSelected();
  };
  root.isOpen = () => open;
  root.setOpen = (next: boolean) => setOpen(next, false);

  root.dataset.state = 'closed';
  renderTrigger();
  // Abrir de saída NÃO move o foco: o elemento ainda não está no documento, e
  // roubar o foco ao montar a página é exatamente o que a story fotografaria.
  if (initialOpen) setOpen(true, false, false);

  return root;
}
