import { cn } from '@/lib/utils';
import { createButton, type ButtonVariant } from './button';
import { createInput, type InputOptions } from './input';
import { createTextarea, type TextareaOptions } from './textarea';

// ─── InputGroup — Vanilla factories standalone ───────────────────────────────
//
// Visual: classes .nds-input-group* de `docs/shared/styles/nds/input-group.css`.
//
// A FOLHA É O CONTRATO, e é dela que esta implementação sai. Esta stack era a
// ÚNICA sem o componente — as outras quatro já o entregavam —, então aqui a
// ordem de sempre se inverteu: em vez de as outras se alinharem ao Vanilla, o
// Vanilla nasceu da folha, e é contra ele que as outras foram medidas depois.
//
// O que a folha declara, e que esta fábrica só transcreve:
//
//   • `.nds-input-group` é a MOLDURA: borda, arredondamento e transição são
//     dela. Ela acende no foco por `:has(.nds-input-group-control:focus-visible)`,
//     fica vermelha em `:has([aria-invalid="true"])` e esmaece em
//     `:has(:disabled)` — nenhum desses três estados é escrito por JS aqui.
//   • `.nds-input-group-control` é o campo NU: `border: 0` e `box-shadow: none`.
//     Duas molduras concêntricas no foco é o que essa regra existe para evitar.
//   • `.nds-input-group-addon` tem `cursor: text` e `user-select: none`, e as
//     quatro posições saem de `[data-align]`. As duas em bloco (mais a simples
//     presença de um `<textarea>`) trocam a linha por coluna via `:has()`.
//   • `.nds-input-group-button` só APERTA a medida; o visual de botão continua
//     vindo de `.nds-button`.
//
// ─── Decisões de acessibilidade, escritas porque são a parte difícil ─────────
//
// 1. A RAIZ DECLARA `role="group"`, E O NOME É DE QUEM COMPÕE — mas o papel
//    está declarado aqui de propósito, e não deixado implícito. Em `drawer` e
//    `sheet` o docblock dizia a mesma frase sobre nome, e NÃO funcionava: o
//    corpo era um `<div>` sem papel, e `aria-label` num elemento genérico é
//    simplesmente descartado (`aria-prohibited-attr`). `role="group"` é
//    justamente um dos papéis que ACEITAM nome, então dizer "o nome é de quem
//    compõe" aqui é uma promessa que se cumpre.
//
// 2. O NOME DO GRUPO É OPCIONAL, e nunca inventado. Com um campo só dentro da
//    moldura, quem tem nome é o campo, pelo `<label>`; nomear o grupo também
//    faz o leitor de tela dizer as mesmas palavras duas vezes. O nome ganha
//    utilidade quando a moldura guarda MAIS DE UM controle — campo mais botão
//    de limpar, por exemplo —, porque aí "grupo" sozinho não diz de que o
//    botão é vizinho.
//
// 3. O ADDON NÃO TEM PAPEL NENHUM. É um compartimento de decoração, e a folha
//    diz isso na cara: `cursor: text` e `user-select: none` são de quem não é
//    controle. Um `role="group"` sem nome, aninhado dentro do grupo de
//    verdade, acrescenta um degrau que anuncia "grupo" e não informa nada.
//
// 4. CLICAR NO ADDON LEVA O FOCO AO CAMPO, e isso NÃO faz do addon um controle.
//    É atalho de PONTEIRO para o que o campo já oferece ao teclado: quem
//    navega por Tab chega ao campo direto, e não perde função nenhuma por o
//    addon não ser focável. Por isso ele não recebe `tabindex` — parada de
//    tabulação que não leva a lugar nenhum foi o custo declarado do `stepper`,
//    e não se repete aqui.
//
//    O ouvinte é DELEGADO na raiz, e não pendurado em cada addon: assim ele
//    continua correto depois que o consumidor acrescenta ou remove addons, e
//    sai da memória junto com a árvore, sem `destroy()` para ninguém lembrar.
//
//    O campo é procurado pela CLASSE `.nds-input-group-control`, e não pelo
//    elemento `input`: é o que faz o atalho alcançar também a área de texto.
//
// 5. CLIQUE EM BOTÃO É DO BOTÃO. Sem essa guarda, apertar "limpar" devolveria
//    o foco ao campo no meio da ação, e o botão perderia o próprio foco.
//
// 6. SEM REGIÃO VIVA. Nada aqui se reanuncia. Quem conta o erro é o texto
//    ligado ao campo por `aria-describedby`, no momento da validação.
//
// 7. SEM ALTURA FIXA (WCAG 1.4.4). A folha usa `height: auto` no addon e tira a
//    altura do espaço interno mais a entrelinha, então a moldura cresce com o
//    tamanho de fonte do navegador. Nada aqui escreve altura.
//
// 8. ESTADO É PALAVRA, NUNCA SÓ COR (WCAG 1.4.1). Inválido é `aria-invalid` no
//    CAMPO mais um texto ligado a ele — a moldura vermelha é o eco, não o
//    aviso. Desabilitado é `disabled` de verdade, que já sai da ordem de
//    tabulação. Nada disso é aparência escrita à mão.
//
// A opção de classe é `class`, como nas outras fábricas desta stack, com
// `className` aceito como apelido; quando os dois vêm, `class` vence.

/** Onde o addon fica. As duas em bloco fazem o grupo virar coluna. */
export type InputGroupAlign = 'inline-start' | 'inline-end' | 'block-start' | 'block-end';

/** Medidas do botão apertado que cabem dentro da moldura. */
export type InputGroupButtonSize = 'xs' | 'sm' | 'icon-xs' | 'icon-sm';

export interface InputGroupOptions {
  /**
   * Nome acessível do grupo. OPCIONAL de propósito — ver a decisão 2 no
   * cabeçalho: com um campo só, o rótulo do campo já nomeia, e nomear o grupo
   * também faz repetir.
   */
  'aria-label'?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface InputGroupAddonOptions {
  align?: InputGroupAlign;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface InputGroupTextOptions {
  text?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface InputGroupButtonOptions {
  /** Texto VISÍVEL do botão. Não é o nome acessível. */
  label?: string;
  /** Nome acessível. Obrigatório no botão só de ícone, onde não há texto. */
  'aria-label'?: string;
  variant?: ButtonVariant;
  size?: InputGroupButtonSize;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  children?: HTMLElement | SVGElement;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

/** Classe do campo interno — o gancho que a folha usa para acender a moldura. */
const CONTROL_CLASS = 'nds-input-group-control';

/**
 * A moldura.
 *
 * O ouvinte de clique é o único comportamento que esta fábrica liga, e ele
 * existe pela decisão 4. Nada aqui lê estilo computado nem força layout: é
 * leitura de atributo e chamada de `focus()`, então é seguro chamar de dentro
 * de uma play function.
 */
export function createInputGroup(options: InputGroupOptions = {}): HTMLDivElement {
  const className = options.class ?? options.className;

  const group = document.createElement('div');
  group.dataset.slot = 'input-group';
  group.setAttribute('role', 'group');
  group.className = cn('nds-input-group', className);

  const accessibleName = options['aria-label'];
  if (accessibleName) group.setAttribute('aria-label', accessibleName);

  group.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target) return;

    const addon = target.closest('[data-slot="input-group-addon"]');
    if (!addon || !group.contains(addon)) return;

    // Decisão 5: clique em botão é do botão.
    if (target.closest('button')) return;

    // Decisão 4: pela CLASSE, para alcançar também a área de texto.
    group.querySelector<HTMLElement>(`.${CONTROL_CLASS}`)?.focus();
  });

  return group;
}

/**
 * Compartimento do acompanhamento.
 *
 * Sem papel — decisão 3. A posição vai em `data-align` porque é assim que a
 * folha a lê; não há classe por alinhamento para escrever aqui.
 */
export function createInputGroupAddon(options: InputGroupAddonOptions = {}): HTMLDivElement {
  const { align = 'inline-start' } = options;
  const className = options.class ?? options.className;

  const addon = document.createElement('div');
  addon.dataset.slot = 'input-group-addon';
  addon.dataset.align = align;
  addon.className = cn('nds-input-group-addon', className);

  return addon;
}

/** Palavra ou ícone dentro do addon, em cor de apoio. Decoração, sem foco. */
export function createInputGroupText(options: InputGroupTextOptions = {}): HTMLSpanElement {
  const { text = '' } = options;
  const className = options.class ?? options.className;

  const span = document.createElement('span');
  span.dataset.slot = 'input-group-text';
  span.className = cn('nds-input-group-text', className);
  if (text) span.textContent = text;

  return span;
}

/**
 * Botão apertado dentro da moldura.
 *
 * Compõe `createButton`: o visual de botão continua sendo do botão, e daqui sai
 * só a classe que aperta a medida. `size` é REPASSADO ao botão — é ele que
 * rende `nds-button-xs` e companhia. Escrever a medida num `data-size` seria
 * atributo inerte: nenhuma folha do design system lê `[data-size]` para esta
 * classe, e a opção prometeria uma medida que não aplicaria.
 */
export function createInputGroupButton(options: InputGroupButtonOptions = {}): HTMLButtonElement {
  const { label, variant = 'ghost', size = 'xs', disabled, onClick, children } = options;
  const className = options.class ?? options.className;

  const button = createButton({
    type: 'button',
    variant,
    size,
    label,
    'aria-label': options['aria-label'],
    disabled,
    onClick,
    children,
    class: cn('nds-input-group-button', className),
  });
  button.dataset.slot = 'input-group-button';

  return button;
}

/**
 * O campo dentro da moldura.
 *
 * A classe do controle é o que zera a moldura própria do campo, e o `data-slot`
 * é o que o `FormField` desta casa usa para achar o campo e ligar rótulo e
 * descrição. Os dois andam juntos, e por isso saem daqui juntos.
 */
export function createInputGroupInput(options: InputOptions = {}): HTMLInputElement {
  const input = createInput({ ...options, class: cn(CONTROL_CLASS, options.class) });
  input.dataset.slot = 'input-group-control';
  return input;
}

/** A alternativa de várias linhas. Presente, a folha faz o grupo empilhar. */
export function createInputGroupTextarea(options: TextareaOptions = {}): HTMLTextAreaElement {
  const textarea = createTextarea({ ...options, class: cn(CONTROL_CLASS, options.class) });
  textarea.dataset.slot = 'input-group-control';
  return textarea;
}

