import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

// ─── Combobox ─────────────────────────────────────────────────────────────────
//
// Campo de texto que filtra uma lista. No modo múltiplo os escolhidos viram
// CHIPS dentro do próprio campo.
//
// Esta fábrica é a REFERÊNCIA cross-stack: não há lib headless por baixo, então
// o que sai daqui é o que o design system realmente define. As outras quatro
// stacks espelham este markup.
//
// Markup (o `data-slot` de cada peça é o contrato compartilhado):
//
//   <div data-slot="combobox">                     ← raiz, `display: contents`
//     <label class="nds-combobox-label" data-slot="combobox-label">
//     <div class="nds-combobox-input-wrapper" data-slot="combobox-input-wrapper">
//       <span class="nds-combobox-chip" data-slot="combobox-chip">
//         <span data-slot="combobox-chip-text">
//         <button class="nds-combobox-chip-remove" data-slot="combobox-chip-remove">
//       <input class="nds-combobox-input" data-slot="combobox-input" role="combobox">
//       <button class="nds-combobox-clear" data-slot="combobox-clear">
//       <button class="nds-combobox-trigger" data-slot="combobox-trigger">
//     <input type="hidden" data-slot="combobox-hidden-input">
//
// `role="combobox"` vai no INPUT, não num wrapper — é o padrão ARIA 1.2. O foco
// NUNCA sai do input enquanto a lista navega: a opção ativa é apontada por
// `aria-activedescendant` e realçada por `[data-highlighted]`. Mover o foco para
// a opção quebraria a digitação, que é o ponto do componente.
//
// Os chips são filhos DIRETOS do wrapper. O `.nds-combobox-chips` do contrato é
// `display: contents` justamente para isso: um contêiner real criaria uma caixa
// de flex própria e os chips deixariam de quebrar linha junto com o input.

export interface ComboboxItem {
  value: string;
  label: string;
  disabled?: boolean;
  /** Rótulo do grupo. Itens com o mesmo texto saem sob o mesmo cabeçalho. */
  group?: string;
}

export interface ComboboxOptions {
  items: ComboboxItem[];
  /** Rótulo visível do campo. Sem ele, passe `aria-label`. */
  label?: string;
  'aria-label'?: string;
  placeholder?: string;
  /** Modo múltiplo: os escolhidos viram chips dentro do campo. */
  multiple?: boolean;
  /** Valores iniciais. Em modo simples, só o primeiro é considerado. */
  defaultValue?: string[];
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  /** Nome do campo no formulário. */
  name?: string;
  id?: string;
  /** Texto do estado vazio. */
  emptyMessage?: string;
  /** Nome acessível do botão que limpa tudo. */
  clearLabel?: string;
  /** Nome acessível do botão que abre a lista. */
  triggerLabel?: string;
  /** Prefixo do nome acessível de cada botão de remover: "<prefixo> <rótulo>". */
  removeLabel?: string;
  onValueChange?: (value: string[]) => void;
  onInputValueChange?: (texto: string) => void;
  onOpenChange?: (aberto: boolean) => void;
  className?: string;
}

let _comboboxCounter = 0;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Traçado do chevron do gatilho (lucide `chevron-down`). */
const TRACO_CHEVRON = 'm6 9 6 6 6-6';
/** Traçados do X — usado no botão de limpar e no de remover chip (lucide `x`). */
const TRACO_X = ['M18 6 6 18', 'M6 6l12 12'];
/** Traçado da marca de escolhido (lucide `check`). */
const TRACO_CHECK = 'M20 6 9 17l-5-5';

/**
 * Ícone montado nó a nó, e não por `innerHTML`. Mesma decisão do `select` e do
 * `dropdown-menu`: aqui não há conteúdo de fora para sanitizar, mas `innerHTML`
 * numa fábrica é o caminho por onde a injeção entra na próxima vez que alguém
 * passar um rótulo por ali.
 */
function createIcon(tracos: string | string[], className?: string): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);
  for (const traco of Array.isArray(tracos) ? tracos : [tracos]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', traco);
    svg.appendChild(path);
  }
  return svg;
}

/** Comparação sem acento e sem caixa — filtrar "sao" tem de achar "São Paulo". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function createCombobox(options: ComboboxOptions): DestroyableElement<HTMLDivElement> {
  const {
    items,
    label,
    placeholder = '',
    multiple = false,
    defaultValue = [],
    disabled = false,
    readOnly = false,
    invalid = false,
    name,
    id,
    emptyMessage = 'Nenhum resultado',
    clearLabel = 'Limpar',
    triggerLabel = 'Abrir lista',
    removeLabel = 'Remover',
    onValueChange,
    onInputValueChange,
    onOpenChange,
    className,
  } = options;

  const seq = ++_comboboxCounter;
  const baseId = id ?? `nds-combobox-${seq}`;
  const listId = `${baseId}-list`;

  let selecionados: string[] = multiple ? [...defaultValue] : defaultValue.slice(0, 1);
  let aberto = false;
  let ativo = -1;
  let posicionador: HTMLElement | null = null;
  let lista: HTMLElement | null = null;
  /** Itens visíveis na ordem em que estão na lista — é sobre eles que a seta anda. */
  let visiveis: ComboboxItem[] = [];

  const rotuloDe = (value: string): string =>
    items.find((i) => i.value === value)?.label ?? value;

  // ── Raiz ───────────────────────────────────────────────────────────────────

  const root = document.createElement('div');
  root.dataset.slot = 'combobox';
  if (className) root.className = cn(className);

  if (label) {
    const rotulo = document.createElement('label');
    rotulo.className = 'nds-combobox-label';
    rotulo.dataset.slot = 'combobox-label';
    rotulo.htmlFor = `${baseId}-input`;
    rotulo.textContent = label;
    root.appendChild(rotulo);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'nds-combobox-input-wrapper';
  wrapper.dataset.slot = 'combobox-input-wrapper';
  if (disabled) wrapper.dataset.disabled = '';
  if (invalid) wrapper.setAttribute('aria-invalid', 'true');
  root.appendChild(wrapper);

  const input = document.createElement('input');
  input.id = `${baseId}-input`;
  input.className = 'nds-combobox-input';
  input.dataset.slot = 'combobox-input';
  input.type = 'text';
  input.autocomplete = 'off';
  input.placeholder = placeholder;
  input.disabled = disabled;
  input.readOnly = readOnly;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', listId);
  input.setAttribute('aria-autocomplete', 'list');
  if (options['aria-label']) input.setAttribute('aria-label', options['aria-label']);
  if (invalid) input.setAttribute('aria-invalid', 'true');

  const limpar = document.createElement('button');
  limpar.type = 'button';
  limpar.className = 'nds-combobox-clear';
  limpar.dataset.slot = 'combobox-clear';
  limpar.setAttribute('aria-label', clearLabel);
  limpar.appendChild(createIcon(TRACO_X));

  const gatilho = document.createElement('button');
  gatilho.type = 'button';
  gatilho.className = 'nds-combobox-trigger';
  gatilho.dataset.slot = 'combobox-trigger';
  // Fora da ordem de tabulação: quem tem foco é o input, e o Tab tem de sair do
  // campo, não parar num segundo alvo que faz o que a seta já faz.
  gatilho.tabIndex = -1;
  gatilho.disabled = disabled;
  gatilho.setAttribute('aria-label', triggerLabel);
  const iconeGatilho = createIcon(TRACO_CHEVRON, 'nds-combobox-icon');
  iconeGatilho.setAttribute('data-slot', 'combobox-icon');
  gatilho.appendChild(iconeGatilho);

  wrapper.append(input, limpar, gatilho);

  // Região viva: remover um chip é mudança de estado que não move o foco, então
  // quem não vê a tela não recebe nada sem isto.
  const aviso = document.createElement('span');
  aviso.setAttribute('role', 'status');
  aviso.setAttribute('aria-live', 'polite');
  aviso.className = 'nds-sr-only';
  root.appendChild(aviso);

  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.dataset.slot = 'combobox-hidden-input';
  if (name) hidden.name = name;
  root.appendChild(hidden);

  // ── Estado ─────────────────────────────────────────────────────────────────

  function sincronizarHidden(): void {
    hidden.value = selecionados.join(',');
  }

  function renderChips(): void {
    wrapper.querySelectorAll('[data-slot="combobox-chip"]').forEach((n) => n.remove());
    if (!multiple) return;

    for (const value of selecionados) {
      const chip = document.createElement('span');
      chip.className = 'nds-combobox-chip';
      chip.dataset.slot = 'combobox-chip';
      chip.dataset.value = value;

      const texto = document.createElement('span');
      texto.dataset.slot = 'combobox-chip-text';
      texto.textContent = rotuloDe(value);

      const remover = document.createElement('button');
      remover.type = 'button';
      remover.className = 'nds-combobox-chip-remove';
      remover.dataset.slot = 'combobox-chip-remove';
      remover.disabled = disabled || readOnly;
      // Nome PRÓPRIO: numa lista de cinco chips, cinco botões chamados
      // "Remover" são indistinguíveis para quem navega por lista de controles.
      remover.setAttribute('aria-label', `${removeLabel} ${rotuloDe(value)}`);
      remover.appendChild(createIcon(TRACO_X));
      remover.addEventListener('click', (e) => {
        e.stopPropagation();
        desmarcar(value);
      });

      chip.append(texto, remover);
      wrapper.insertBefore(chip, input);
    }
  }

  function anunciar(texto: string): void {
    aviso.textContent = texto;
  }

  function emitir(): void {
    sincronizarHidden();
    onValueChange?.([...selecionados]);
  }

  function marcar(value: string): void {
    if (readOnly) return;
    if (multiple) {
      if (selecionados.includes(value)) return;
      selecionados.push(value);
      renderChips();
      // O texto sai do caminho: no múltiplo, escolher significa "já registrei,
      // pode digitar o próximo". Manter o filtro esconderia os itens restantes.
      input.value = '';
      onInputValueChange?.('');
    } else {
      selecionados = [value];
      input.value = rotuloDe(value);
      onInputValueChange?.(input.value);
      fechar();
    }
    emitir();
    if (aberto) filtrar();
  }

  function desmarcar(value: string): void {
    if (readOnly) return;
    const antes = selecionados.length;
    selecionados = selecionados.filter((v) => v !== value);
    if (selecionados.length === antes) return;
    renderChips();
    anunciar(`${rotuloDe(value)} removido`);
    emitir();
    input.focus();
    if (aberto) filtrar();
  }

  // ── Lista ──────────────────────────────────────────────────────────────────

  function montarLista(): void {
    posicionador = document.createElement('div');
    posicionador.className = 'nds-combobox-positioner';
    posicionador.dataset.slot = 'combobox-positioner';

    const popup = document.createElement('div');
    popup.className = 'nds-combobox-popup';
    popup.dataset.slot = 'combobox-popup';

    lista = document.createElement('div');
    lista.id = listId;
    lista.className = 'nds-combobox-list';
    lista.dataset.slot = 'combobox-list';
    lista.setAttribute('role', 'listbox');
    if (multiple) lista.setAttribute('aria-multiselectable', 'true');

    popup.appendChild(lista);
    posicionador.appendChild(popup);
    root.appendChild(posicionador);
  }

  function filtrar(): void {
    if (!lista) return;
    const busca = normalizar(input.value.trim());
    visiveis = busca
      ? items.filter((i) => normalizar(i.label).includes(busca))
      : [...items];

    lista.textContent = '';

    if (visiveis.length === 0) {
      const vazio = document.createElement('div');
      vazio.className = 'nds-combobox-empty';
      vazio.dataset.slot = 'combobox-empty';
      vazio.textContent = emptyMessage;
      lista.appendChild(vazio);
      ativo = -1;
      input.removeAttribute('aria-activedescendant');
      return;
    }

    let grupoAtual: string | undefined;
    let destino: HTMLElement = lista;

    visiveis.forEach((item, indice) => {
      if (item.group !== grupoAtual) {
        grupoAtual = item.group;
        if (grupoAtual) {
          const grupo = document.createElement('div');
          grupo.className = 'nds-combobox-group';
          grupo.dataset.slot = 'combobox-group';
          grupo.setAttribute('role', 'group');

          const rotuloGrupo = document.createElement('div');
          rotuloGrupo.className = 'nds-combobox-group-label';
          rotuloGrupo.dataset.slot = 'combobox-group-label';
          rotuloGrupo.id = `${baseId}-group-${indice}`;
          rotuloGrupo.textContent = grupoAtual;

          grupo.setAttribute('aria-labelledby', rotuloGrupo.id);
          grupo.appendChild(rotuloGrupo);
          lista!.appendChild(grupo);
          destino = grupo;
        } else {
          destino = lista!;
        }
      }

      const opcao = document.createElement('div');
      opcao.id = `${baseId}-item-${indice}`;
      opcao.className = 'nds-combobox-item';
      opcao.dataset.slot = 'combobox-item';
      opcao.dataset.value = item.value;
      opcao.setAttribute('role', 'option');
      opcao.setAttribute('aria-selected', String(selecionados.includes(item.value)));
      if (item.disabled) opcao.setAttribute('aria-disabled', 'true');

      const texto = document.createElement('span');
      texto.dataset.slot = 'combobox-item-text';
      texto.textContent = item.label;

      const indicador = document.createElement('span');
      indicador.className = 'nds-combobox-item-indicator';
      indicador.dataset.slot = 'combobox-item-indicator';
      indicador.appendChild(createIcon(TRACO_CHECK));

      opcao.append(texto, indicador);
      opcao.addEventListener('mousedown', (e) => {
        // `mousedown` e não `click`: o clique tiraria o foco do input antes de
        // a escolha acontecer, e o campo fecharia por blur no meio do gesto.
        e.preventDefault();
        if (item.disabled) return;
        selecionados.includes(item.value) && multiple
          ? desmarcar(item.value)
          : marcar(item.value);
      });
      opcao.addEventListener('mouseenter', () => realcar(indice));

      destino.appendChild(opcao);
    });

    realcar(visiveis.length ? 0 : -1);
  }

  function opcaoNoIndice(indice: number): HTMLElement | null {
    return lista?.querySelector(`#${CSS.escape(`${baseId}-item-${indice}`)}`) ?? null;
  }

  function realcar(indice: number): void {
    lista?.querySelectorAll('[data-highlighted]').forEach((n) => {
      (n as HTMLElement).removeAttribute('data-highlighted');
    });
    ativo = indice;
    const alvo = opcaoNoIndice(indice);
    if (!alvo) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    alvo.dataset.highlighted = '';
    // É `aria-activedescendant` e não foco: o input precisa continuar recebendo
    // a digitação enquanto a seta anda pela lista.
    input.setAttribute('aria-activedescendant', alvo.id);
    alvo.scrollIntoView({ block: 'nearest' });
  }

  function mover(passo: number): void {
    if (!visiveis.length) return;
    let proximo = ativo;
    for (let i = 0; i < visiveis.length; i++) {
      proximo = (proximo + passo + visiveis.length) % visiveis.length;
      if (!visiveis[proximo].disabled) break;
    }
    realcar(proximo);
  }

  function abrir(): void {
    if (aberto || disabled) return;
    aberto = true;
    montarLista();
    filtrar();
    input.setAttribute('aria-expanded', 'true');
    onOpenChange?.(true);
  }

  function fechar(): void {
    if (!aberto) return;
    aberto = false;
    posicionador?.remove();
    posicionador = null;
    lista = null;
    ativo = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    onOpenChange?.(false);
  }

  // ── Teclado ────────────────────────────────────────────────────────────────

  input.addEventListener('input', () => {
    onInputValueChange?.(input.value);
    if (!aberto) abrir();
    else filtrar();
  });

  input.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        aberto ? mover(1) : abrir();
        break;
      case 'ArrowUp':
        e.preventDefault();
        aberto ? mover(-1) : abrir();
        break;
      case 'Home':
        if (!aberto) return;
        e.preventDefault();
        realcar(0);
        break;
      case 'End':
        if (!aberto) return;
        e.preventDefault();
        realcar(visiveis.length - 1);
        break;
      case 'Enter':
        if (!aberto || ativo < 0) return;
        e.preventDefault();
        if (!visiveis[ativo].disabled) marcar(visiveis[ativo].value);
        break;
      case 'Escape':
        // Duas funções na mesma tecla, e a ordem importa: fechar primeiro, e só
        // limpar o texto quando já não há o que fechar.
        if (aberto) {
          e.preventDefault();
          fechar();
        } else if (input.value) {
          e.preventDefault();
          input.value = '';
          onInputValueChange?.('');
        }
        break;
      case 'Backspace':
        // O gesto que define o chip: sem ele, desfazer exige o mouse.
        if (multiple && input.value === '' && selecionados.length) {
          e.preventDefault();
          desmarcar(selecionados[selecionados.length - 1]);
        }
        break;
      case 'Tab':
        if (aberto) fechar();
        break;
      default:
        break;
    }
  });

  gatilho.addEventListener('mousedown', (e) => {
    e.preventDefault();
    aberto ? fechar() : abrir();
    input.focus();
  });

  limpar.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (readOnly) return;
    selecionados = [];
    input.value = '';
    renderChips();
    onInputValueChange?.('');
    anunciar(clearLabel);
    emitir();
    input.focus();
    if (aberto) filtrar();
  });

  // Clicar em qualquer canto do campo vai para o input — é o `cursor: text` do
  // wrapper cumprindo o que promete.
  wrapper.addEventListener('mousedown', (e) => {
    if (e.target === wrapper) {
      e.preventDefault();
      input.focus();
      if (!aberto) abrir();
    }
  });

  function onClickOutside(e: MouseEvent): void {
    const alvo = e.target as Node;
    if (!root.contains(alvo)) fechar();
  }
  document.addEventListener('mousedown', onClickOutside);

  // ── Estado inicial ─────────────────────────────────────────────────────────

  renderChips();
  sincronizarHidden();
  if (!multiple && selecionados.length) input.value = rotuloDe(selecionados[0]);

  return tornarDestruivel(root, root, () => {
    document.removeEventListener('mousedown', onClickOutside);
    fechar();
  });
}
