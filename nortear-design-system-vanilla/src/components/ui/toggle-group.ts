// ─── Toggle Group — Vanilla factory standalone ──────────────────────────────
//
// Visual: classe .nds-toggle-group (standalone).
// Tipo (single/multiple) via lógica TS; variante via data-variant.

import { cn } from '@/lib/utils';
import { createToggle, type ToggleChild, type ToggleSize, type ToggleVariant } from './toggle';

export type ToggleGroupItem = {
  value: string;
  label?: string;
  /**
   * Conteúdo do item. Aceita elemento, e não só texto.
   *
   * O caso mais comum do grupo é item só de ícone — o próprio docblock de
   * `aria-label` logo abaixo diz isso —, e enquanto aqui só cabia `string` o
   * ícone tinha de ser injetado DEPOIS de construir, percorrendo os botões e
   * casando ícone com posição. Cada story de composição carregava a sua cópia
   * desse laço, e a fixture `injectIcons` existe só por causa disso.
   */
  children?: ToggleChild | ToggleChild[];
  disabled?: boolean;
  /**
   * Nome acessível do item. OBRIGATÓRIO quando o item é só ícone — o caso mais
   * comum do grupo (alinhamento, formatação, modo de visualização).
   *
   * Antes daqui, cada story percorria `[data-slot="toggle"]` depois de
   * construir e casava rótulo com posição no array: um item inserido no meio
   * trocava silenciosamente o nome de todos os seguintes.
   */
  'aria-label'?: string;
};

export type ToggleGroupOrientation = 'horizontal' | 'vertical';

export type ToggleGroupOptions = {
  type?: 'single' | 'multiple';
  variant?: ToggleVariant;
  size?: ToggleSize;
  /** Direção do empilhamento e das setas de navegação. */
  orientation?: ToggleGroupOrientation;
  /** Desabilita o grupo inteiro — cada item herda. */
  disabled?: boolean;
  items: ToggleGroupItem[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  /**
   * Nome acessível do grupo. OBRIGATÓRIO: `role="toolbar"` sem nome é anunciado
   * como "barra de ferramentas" e nada mais, e duas barras na mesma página
   * ficam indistinguíveis para quem navega por leitor de tela.
   */
  'aria-label'?: string;
  class?: string;
  /**
   * Papel do grupo. `toolbar` (padrão) é o grupo solto na página: ele declara
   * `role="toolbar"` e é dono da navegação por seta.
   *
   * `group` é para o grupo ANINHADO dentro de uma barra maior, ao lado de
   * controles que não são alternadores. Ali `toolbar` dentro de `toolbar` seria
   * um papel dentro do mesmo papel, e duas rovings disputando o mesmo Tab: quem
   * navega ficaria preso no trio de marcas sem alcançar o resto da barra. Com
   * `group`, o grupo abre mão do teclado e quem contém assume.
   */
  role?: 'toolbar' | 'group';
};

/**
 * O grupo devolvido aceita estado de FORA.
 *
 * Sem isto o estado só muda no próprio clique, o que serve à barra que é dona
 * da verdade e não serve à barra que a espelha — numa barra de formatação,
 * mover o cursor para dentro de um trecho em negrito tem de acender o botão sem
 * clique nenhum.
 */
export type ToggleGroupElement = HTMLElement & {
  /**
   * Escreve o estado dos itens. NÃO dispara `onValueChange`: é sincronização
   * vinda de quem manda, não escolha de quem usa — notificar aqui devolveria o
   * eco a quem acabou de mandar.
   */
  setValue: (value: string | string[]) => void;
};

export function createToggleGroup(options: ToggleGroupOptions): ToggleGroupElement {
  const {
    type = 'single',
    variant = 'default',
    size = 'default',
    orientation = 'horizontal',
    disabled = false,
    items,
    onValueChange,
  } = options;

  const activeValues: Set<string> =
    options.defaultValue !== undefined
      ? new Set(Array.isArray(options.defaultValue) ? options.defaultValue : [options.defaultValue])
      : new Set();

  const root = document.createElement('div');
  root.dataset.slot = 'toggle-group';
  root.className = cn('nds-toggle-group', options.class);
  if (variant !== 'default') root.dataset.variant = variant;
  if (size !== 'default') root.dataset.size = size;
  const papel = options.role ?? 'toolbar';
  root.setAttribute('role', papel);
  if (options['aria-label']) root.setAttribute('aria-label', options['aria-label']);

  // A folha compartilhada lê `data-orientation` para empilhar; `aria-orientation`
  // conta a mesma coisa a quem ouve. Antes disso, as stories aplicavam
  // `flex-col` — classe que não existe em CSS nenhum do projeto — e o grupo
  // continuava horizontal. O espaço entre os itens é sempre zero: a folha fixa
  // `gap: 0` e não há mais o que configurar aqui.
  root.dataset.orientation = orientation;
  // `aria-orientation` só vale em papel que navega — `toolbar` está na lista da
  // ARIA, `group` não. Em `group` o atributo seria "aria-allowed-attr" para o
  // axe, e é o CONTENEDOR quem responde pela orientação de qualquer forma.
  if (papel === 'toolbar') root.setAttribute('aria-orientation', orientation);
  if (disabled) root.dataset.disabled = '';

  function notifyChange(): void {
    if (!onValueChange) return;
    if (type === 'single') {
      onValueChange([...activeValues][0] ?? '');
    } else {
      onValueChange([...activeValues]);
    }
  }

  items.forEach((item) => {
    const btn = createToggle({
      pressed: activeValues.has(item.value),
      disabled: disabled || item.disabled,
      variant,
      size,
      'aria-label': item['aria-label'],
      children: item.children ?? item.label ?? item.value,
      onClick: () => {
        const isActive = activeValues.has(item.value);
        if (type === 'single') {
          if (isActive) {
            activeValues.clear();
          } else {
            activeValues.clear();
            activeValues.add(item.value);
          }
        } else {
          if (isActive) activeValues.delete(item.value);
          else activeValues.add(item.value);
        }
        // Os dois ramos terminam no mesmo lugar: `activeValues` decide, e a
        // pintura vem dele. Antes cada ramo escrevia nos botões do seu jeito, e
        // o `pressed` que a fábrica do toggle guarda no fecho ficava defasado
        // sem que se visse — o grupo sobrescrevia logo depois.
        paintState();
        notifyChange();
      },
    });
    btn.dataset.value = item.value;
    root.appendChild(btn);
  });

  // ─── Contrato do role="toolbar": roving tabindex + setas ───────────────────
  // Declarar role="toolbar" promete ao leitor de tela que as setas navegam
  // entre os controles (WAI-ARIA APG). Sem isto o anúncio é falso: o usuário
  // ouve "barra de ferramentas" e as setas não fazem nada. Um único item fica
  // na ordem de tabulação; Tab entra e sai do grupo inteiro.
  const buttons = (): HTMLButtonElement[] =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]'));

  function setRovingTarget(target: HTMLButtonElement): void {
    buttons().forEach((b) => {
      b.tabIndex = b === target ? 0 : -1;
    });
  }

  function focusAt(index: number): void {
    const enabled = buttons().filter((b) => !b.disabled);
    if (enabled.length === 0) return;
    // Circular: da ponta direita volta para a esquerda, como o composite do React.
    const next = enabled[(index + enabled.length) % enabled.length];
    setRovingTarget(next);
    next.focus();
  }

  /** Escreve nos botões o que `activeValues` diz. Uma origem só de verdade. */
  function paintState(): void {
    buttons().forEach((b) => {
      const active = activeValues.has(b.dataset.value!);
      b.setAttribute('aria-pressed', String(active));
      b.dataset.state = active ? 'on' : 'off';
    });
  }

  const setValue = (value: string | string[]): void => {
    activeValues.clear();
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v !== '') activeValues.add(v);
    }
    paintState();
  };

  const groupElement: ToggleGroupElement = Object.assign(root, { setValue });

  // Daqui para baixo, o contrato do papel de barra. Em `group` quem contém é o
  // dono do teclado, e instalar isto aqui criaria a segunda roving.
  if (papel !== 'toolbar') return groupElement;

  root.addEventListener('keydown', (event) => {
    const KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!KEYS.includes(event.key)) return;
    const enabled = buttons().filter((b) => !b.disabled);
    const current = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;

    event.preventDefault();
    if (event.key === 'Home') focusAt(0);
    else if (event.key === 'End') focusAt(enabled.length - 1);
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') focusAt(current + 1);
    else focusAt(current - 1);
  });

  // Clicar num item passa a ordem de tabulação para ele — senão o Tab
  // devolveria o foco a um item diferente do que o usuário acabou de usar.
  root.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-slot="toggle"]');
    if (btn && !btn.disabled) setRovingTarget(btn);
  });

  const initial =
    buttons().find((b) => !b.disabled && b.getAttribute('aria-pressed') === 'true') ??
    buttons().find((b) => !b.disabled);
  if (initial) setRovingTarget(initial);

  return groupElement;
}
