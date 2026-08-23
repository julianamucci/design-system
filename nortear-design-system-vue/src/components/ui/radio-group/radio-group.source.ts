/**
 * Transforms do painel Code do RadioGroup.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A largura das stories (`style="width: 18rem"`) fica DE FORA do snippet: ela
 * emoldura o canvas centralizado do Storybook, não é lição do componente — o
 * grupo em uso real acompanha a largura do contêiner. Valor de design em
 * `style` inline não entra em snippet, e não há utilitária de 18rem para onde
 * movê-lo.
 */
import {
  attr,
  attrBool,
  attrsMultilinha,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type RadioGroupArgs = {
  defaultValue?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  name?: string;
};

const IMPORT = `import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'`;

type Option = {
  value: string;
  id: string;
  label: string;
  disabled?: boolean;
  descricao?: string;
};

const PAGAMENTO: Option[] = [
  { value: 'cartao', id: 'pagamento-cartao', label: 'Cartão de crédito' },
  { value: 'pix', id: 'pagamento-pix', label: 'Pix' },
  { value: 'boleto', id: 'pagamento-boleto', label: 'Boleto bancário' },
];

const ENTREGA: Option[] = [
  { value: 'standard', id: 'entrega-padrao', label: 'Padrão (5 dias)' },
  { value: 'express', id: 'entrega-expressa', label: 'Expressa (1 dia)' },
  { value: 'pickup', id: 'entrega-retirada', label: 'Retirar na loja' },
];

/**
 * A linha de uma opção: o controle e o rótulo lado a lado.
 *
 * O `for` do rótulo apontando para o `id` do item é o que dá nome acessível ao
 * rádio e estende o alvo de clique ao texto — sem o par, o rádio fica anônimo e
 * só o círculo de 16px é clicável.
 */
function line(o: Option, recuo = 2): string {
  const p = ' '.repeat(recuo);
  return `${p}<div class="nds-cluster" data-spacing="sm">
${p}  <RadioGroupItem value="${o.value}" id="${o.id}"${o.disabled ? ' disabled' : ''} />
${p}  <Label for="${o.id}">${o.label}</Label>
${p}</div>`;
}

/** A raiz nomeada com as linhas dentro. */
function group(
  options: Option[],
  partes: Array<string | false | null | undefined>,
  recuo = 2,
): string {
  const p = ' '.repeat(recuo - 2);
  return `${p}<RadioGroup${attrsMultilinha(partes, `${p}  `)}>
${options.map((o) => line(o, recuo)).join('\n')}
${p}</RadioGroup>`;
}

const LABEL_PAGAMENTO = 'aria-label="Forma de pagamento"';
const LABEL_ENTREGA = 'aria-label="Forma de entrega"';

/**
 * Forma canônica: um grupo nomeado, uma linha por opção, rótulo amarrado ao
 * item pelo `for`. Os controls que descrevem a raiz entram como atributos.
 */
export const radioGroupSource: SourceTransform<RadioGroupArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    IMPORT,
    group(PAGAMENTO, [
      attr('default-value', args.defaultValue),
      attrBool('disabled', args.disabled, false),
      attr('orientation', args.orientation, 'vertical'),
      attr('name', args.name),
      LABEL_PAGAMENTO,
    ]),
  );
};

/** Eixo padrão: as opções empilham, e a navegação por setas desce a lista. */
export function radioGroupVerticalSource(): string {
  return vueSnippet(IMPORT, group(PAGAMENTO, [LABEL_PAGAMENTO]));
}

/**
 * Eixo horizontal: o layout não vem de classe paralela — a mesma `orientation`
 * que muda a navegação por setas vira `aria-orientation` no grupo, e é dele que
 * o CSS parte. Assim o que se vê nunca contradiz o que o leitor de tela anuncia.
 */
export function radioGroupHorizontalSource(): string {
  return vueSnippet(
    IMPORT,
    group(ENTREGA, ['orientation="horizontal"', LABEL_ENTREGA]),
  );
}

/**
 * Opção com texto de apoio: a descrição fica FORA do rótulo e chega ao rádio
 * por `aria-describedby`. Dentro do `<Label>` ela entraria no nome acessível e
 * o leitor de tela leria o parágrafo inteiro a cada seta.
 */
export function radioGroupWithDescriptionSource(): string {
  const options: Array<Option & { descricao: string }> = [
    { ...PAGAMENTO[0], descricao: 'Aprovação imediata em até 12x.' },
    { ...PAGAMENTO[1], descricao: 'Pagamento instantâneo com 5% de desconto.' },
    { ...PAGAMENTO[2], descricao: 'Compensação em até 3 dias úteis.' },
  ];
  const body = options
    .map(
      (o) => `  <div class="nds-cluster" data-align="start" data-spacing="sm">
    <RadioGroupItem
      value="${o.value}"
      id="${o.id}"
      class="nds-mt-1"
      aria-describedby="${o.id}-desc"
    />
    <div class="nds-stack" data-spacing="xs">
      <Label for="${o.id}">${o.label}</Label>
      <p id="${o.id}-desc" class="nds-text-caption nds-text-muted-foreground">
        ${o.descricao}
      </p>
    </div>
  </div>`,
    )
    .join('\n');
  return vueSnippet(
    IMPORT,
    `<RadioGroup ${LABEL_PAGAMENTO}>
${body}
</RadioGroup>`,
  );
}

/** Estado de partida: nenhuma opção marcada, o grupo espera a escolha. */
export function radioGroupDefaultSource(): string {
  return vueSnippet(IMPORT, group(PAGAMENTO.slice(0, 2), [LABEL_PAGAMENTO]));
}

/**
 * Escolha inicial não-controlada: o valor casa com o `value` de um item, e é a
 * lib que marca o item na montagem — não há atributo de "marcado" no item.
 */
export function radioGroupCheckedSource(): string {
  return vueSnippet(
    IMPORT,
    group(PAGAMENTO.slice(0, 2), ['default-value="pix"', LABEL_PAGAMENTO]),
  );
}

/** Grupo inteiro bloqueado: a prop mora na raiz e desce para todos os itens. */
export function radioGroupDisabledSource(): string {
  return vueSnippet(
    IMPORT,
    group(PAGAMENTO.slice(0, 2), ['disabled', LABEL_PAGAMENTO]),
  );
}

/**
 * Uma opção fora de alcance: a prop mora no ITEM, e só ele sai da ordem de
 * tabulação. O motivo da indisponibilidade fica no rótulo — sem ele, a opção
 * apagada não explica nada a quem usa leitor de tela.
 */
export function radioGroupItemDisabledSource(): string {
  const options: Option[] = [
    PAGAMENTO[0],
    { ...PAGAMENTO[1], label: 'Pix (indisponível)', disabled: true },
    PAGAMENTO[2],
  ];
  return vueSnippet(IMPORT, group(options, [LABEL_PAGAMENTO]));
}

/**
 * Grupo em erro: `aria-invalid` na raiz e nos itens, e a mensagem amarrada por
 * `aria-describedby`. A cor sozinha não é o aviso — o texto é (WCAG 1.4.1).
 */
export function radioGroupInvalidoSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="sm">
  <fieldset class="nds-stack" data-spacing="sm">
    <legend class="nds-text-body nds-font-semibold">Forma de pagamento *</legend>
    <RadioGroup
      aria-label="Forma de pagamento"
      aria-invalid="true"
      aria-describedby="pagamento-erro"
      class="nds-stack"
      data-spacing="sm"
    >
      <div class="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="cartao" id="pagamento-cartao" aria-invalid="true" />
        <Label for="pagamento-cartao">Cartão de crédito</Label>
      </div>
      <div class="nds-cluster" data-spacing="sm">
        <RadioGroupItem value="pix" id="pagamento-pix" aria-invalid="true" />
        <Label for="pagamento-pix">Pix</Label>
      </div>
    </RadioGroup>
  </fieldset>
  <p id="pagamento-erro" class="nds-text-body nds-text-destructive">
    Selecione uma forma de pagamento para continuar.
  </p>
</div>`,
  );
}

/** Padrão de escolha exclusiva: uma pergunta, uma resposta entre poucas. */
export function radioGroupPagamentoSource(): string {
  return vueSnippet(IMPORT, group(PAGAMENTO, [LABEL_PAGAMENTO]));
}

/**
 * Pergunta com título visível: o `<legend>` nomeia o bloco para quem enxerga, e
 * a raiz continua precisando do próprio nome — o grupo de rádios é um elemento
 * separado do `<fieldset>`, e sem `aria-label` ele seria anunciado sem assunto.
 */
export function radioGroupFieldsetSource(): string {
  return vueSnippet(
    IMPORT,
    `<fieldset class="nds-border-default nds-rounded-lg nds-p-4">
  <legend class="nds-text-body nds-font-semibold nds-px-1">Forma de entrega</legend>
${group(ENTREGA, ['class="nds-stack"', 'data-spacing="sm"', LABEL_ENTREGA], 4)}
</fieldset>`,
  );
}

/**
 * Dentro de um formulário: o grupo entra num `<fieldset>` com `<legend>`, ao
 * lado dos outros campos, e `required` marca a escolha como obrigatória. O
 * envio é interceptado no `@submit.prevent` — o exemplo não tem para onde
 * mandar os dados.
 */
export function formRadioGroupSource(): string {
  return vueSnippet(
    `import { Button } from '@/components/ui/button'
${IMPORT}`,
    `<form class="nds-stack" data-spacing="md" @submit.prevent>
  <div class="nds-stack" data-spacing="sm">
    <label class="nds-text-body nds-font-medium" for="email">Email</label>
    <input id="email" type="email" placeholder="seu@email.com" class="nds-input" />
  </div>

  <fieldset class="nds-stack" data-spacing="sm">
    <legend class="nds-text-body nds-font-medium nds-mb-1">Forma de pagamento</legend>
${group(PAGAMENTO, ['required', 'class="nds-stack"', 'data-spacing="sm"', LABEL_PAGAMENTO], 6)}
  </fieldset>

  <Button type="submit" class="nds-w-full">Finalizar pedido</Button>
</form>`,
  );
}

/**
 * Cartões selecionáveis: o `<label>` envolve o item inteiro, então o cartão
 * todo vira alvo de clique. O destaque do escolhido sai do próprio estado do
 * rádio de dentro — nenhuma classe é trocada à mão.
 */
export function radioGroupCartoesSource(): string {
  const planos = [
    { value: 'basico', id: 'plano-basico', title: 'Básico — R$ 19/mês', helper: 'Para uso pessoal e projetos pequenos.' },
    { value: 'pro', id: 'plano-pro', title: 'Pro — R$ 49/mês', helper: 'Para times com até 5 pessoas.' },
    { value: 'enterprise', id: 'plano-enterprise', title: 'Enterprise — Sob consulta', helper: 'Suporte dedicado e SLA personalizado.' },
  ];
  const cartoes = planos
    .map(
      (p) => `  <label for="${p.id}" class="nds-radio-card nds-cluster" data-align="start" data-spacing="sm">
    <RadioGroupItem value="${p.value}" id="${p.id}" class="nds-mt-1" />
    <div class="nds-stack" data-spacing="xs">
      <span class="nds-block nds-text-body nds-font-medium">${p.title}</span>
      <span class="nds-block nds-text-caption nds-text-muted-foreground">${p.helper}</span>
    </div>
  </label>`,
    )
    .join('\n');
  return vueSnippet(
    `import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'`,
    `<RadioGroup aria-label="Plano">
${cartoes}
</RadioGroup>`,
  );
}
