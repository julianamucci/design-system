/**
 * Transforms do painel Code do RadioGroup.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Fora o Playground, as stories deste componente
 * montam as opções dentro do `render`, e não em `args` — por isso cada uma
 * declara a sua própria transform.
 */
import { attrs, attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type RadioGroupArgs = {
  /** Valor escolhido. No snippet vira o estado inicial do `bind:value`. */
  value: string;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  name?: string;
};

type Option = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type Grupo = {
  value?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  name?: string;
  ariaInvalid?: boolean;
  ariaLabel?: string;
  options?: Option[];
};

const PAGAMENTO: Option[] = [
  { value: 'cartao', label: 'Cartão de crédito' },
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto bancário' },
];

/**
 * Uma opção do grupo.
 *
 * O item não aceita filhos: o rótulo de cada opção é sempre um `Label` irmão,
 * ligado pelo `for`. É essa ligação que dá nome acessível ao rádio e torna o
 * texto parte do alvo de clique.
 */
function item(opt: Option): string {
  const attrList = attrs(
    `value="${opt.value}"`,
    `id="${opt.value}"`,
    opt.disabled ? 'disabled' : '',
    opt.description ? `aria-describedby="${opt.value}-desc"` : '',
    // Alinha o rádio com a PRIMEIRA linha do rótulo; sem isso ele centraliza
    // contra o bloco inteiro e desencontra do texto.
    opt.description ? 'class="nds-mt-1"' : '',
  );

  if (opt.description) {
    return `  <div class="nds-cluster" data-align="start" data-spacing="sm">
    <RadioGroupItem${attrList} />
    <div class="nds-stack" data-spacing="xs">
      <Label for="${opt.value}">${opt.label}</Label>
      <p id="${opt.value}-desc" class="nds-text-caption nds-text-muted-foreground">${opt.description}</p>
    </div>
  </div>`;
  }

  return `  <div class="nds-cluster" data-spacing="sm">
    <RadioGroupItem${attrList} />
    <Label for="${opt.value}">${opt.label}</Label>
  </div>`;
}

function group(o: Grupo = {}): string {
  const options = o.options ?? PAGAMENTO;
  const horizontal = o.orientation === 'horizontal';
  const props = attrsMultilinha([
    'bind:value={forma}',
    o.name ? `name="${o.name}"` : '',
    // A prop governa a direção das setas e o layout; o atributo ARIA anuncia a
    // direção ao leitor de tela, que por padrão supõe um grupo empilhado.
    horizontal ? 'orientation="horizontal"' : '',
    horizontal ? 'aria-orientation="horizontal"' : '',
    o.disabled ? 'disabled' : '',
    o.ariaInvalid ? 'aria-invalid="true"' : '',
    `aria-label="${o.ariaLabel ?? 'Forma de pagamento'}"`,
  ]);

  return svelteSnippet(
    `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

let forma = $state("${o.value ?? ''}");`,
    `<RadioGroup${props}>
${options.map(item).join('\n')}
</RadioGroup>`,
  );
}

/** Forma canônica: um grupo de escolha exclusiva com rótulo por opção. */
export function radioGroupSource(
  _gerado?: string,
  ctx?: { args?: Partial<RadioGroupArgs> },
): string {
  const a = ctx?.args ?? {};
  return group({
    value: a.value ?? '',
    disabled: a.disabled ?? false,
    orientation: a.orientation ?? 'vertical',
    // `name` só entra quando o grupo participa de um formulário — é o que a
    // story do Playground demonstra, e o que os outros arquivos não pedem.
    name: a.name,
    ariaLabel: 'Forma de pagamento',
  });
}

/* ─── Variantes ─────────────────────────────────────────────────────────── */

/** Variante Vertical, e composição PaymentMethod: o empilhamento padrão. */
export function radioGroupVerticalSource(): string {
  return group({ ariaLabel: 'Forma de pagamento', options: PAGAMENTO });
}

/** Variante Horizontal: opções curtas lado a lado. */
export function radioGroupHorizontalSource(): string {
  return group({
    orientation: 'horizontal',
    ariaLabel: 'Forma de entrega',
    options: [
      { value: 'standard', label: 'Padrão' },
      { value: 'express', label: 'Expressa' },
      { value: 'pickup', label: 'Retirar' },
    ],
  });
}

/** Variante WithDescription: texto auxiliar ligado por `aria-describedby`. */
export function radioGroupWithDescriptionSource(): string {
  return group({
    ariaLabel: 'Forma de pagamento',
    options: [
      { value: 'cartao', label: 'Cartão de crédito', description: 'Aprovação imediata em até 12x.' },
      { value: 'pix', label: 'Pix', description: 'Pagamento instantâneo com 5% de desconto.' },
      { value: 'boleto', label: 'Boleto bancário', description: 'Compensação em até 3 dias úteis.' },
    ],
  });
}

/* ─── Estados ───────────────────────────────────────────────────────────── */

const DUAS: Option[] = [
  { value: 'cartao', label: 'Cartão de crédito' },
  { value: 'pix', label: 'Pix' },
];

/** Estado Default: nenhuma opção escolhida — o estado inicial é vazio. */
export function radioGroupDefaultSource(): string {
  return group({ options: DUAS });
}

/** Estado FocusVisible: mesma marcação; o anel é comportamento, não markup. */
export function radioGroupFocusSource(): string {
  return group({ options: DUAS });
}

/** Estado Checked: o valor inicial já escolhe uma das opções. */
export function radioGroupSelectedSource(): string {
  return group({ value: 'pix', options: DUAS });
}

/** Estado Disabled: a prop no grupo bloqueia todas as opções de uma vez. */
export function radioGroupDisabledSource(): string {
  return group({ disabled: true, options: DUAS });
}

/** Estado ItemDisabled: só a opção indisponível sai da ordem de tabulação. */
export function radioGroupItemDisabledSource(): string {
  return group({
    options: [
      { value: 'cartao', label: 'Cartão de crédito' },
      { value: 'pix', label: 'Pix (indisponível)', disabled: true },
      { value: 'boleto', label: 'Boleto bancário' },
    ],
  });
}

/** Estado Invalid: o atributo no grupo é o que troca a borda de cada item. */
export function radioGroupInvalidoSource(): string {
  return group({ ariaInvalid: true, options: DUAS });
}

/* ─── Composições ───────────────────────────────────────────────────────── */

/** Composição DeliveryMethodHorizontal: prazo no rótulo, opções em linha. */
export function radioGroupEntregaHorizontalSource(): string {
  return group({
    orientation: 'horizontal',
    ariaLabel: 'Forma de entrega',
    options: [
      { value: 'standard', label: 'Padrão (5 dias)' },
      { value: 'express', label: 'Expressa (1 dia)' },
      { value: 'pickup', label: 'Retirar na loja' },
    ],
  });
}

/** Composição WithDescription da entrega: prazo como texto auxiliar. */
export function radioGroupEntregaWithDescriptionSource(): string {
  return group({
    ariaLabel: 'Forma de entrega',
    options: [
      { value: 'standard', label: 'Padrão', description: 'Entrega em até 5 dias úteis.' },
      { value: 'express', label: 'Expressa', description: 'Entrega em 1 dia útil.' },
      { value: 'pickup', label: 'Retirar na loja', description: 'Disponível em 2 horas.' },
    ],
  });
}
