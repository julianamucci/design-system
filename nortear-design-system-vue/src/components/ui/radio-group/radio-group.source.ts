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

type Opcao = {
  valor: string;
  id: string;
  rotulo: string;
  desabilitado?: boolean;
  descricao?: string;
};

const PAGAMENTO: Opcao[] = [
  { valor: 'cartao', id: 'pagamento-cartao', rotulo: 'Cartão de crédito' },
  { valor: 'pix', id: 'pagamento-pix', rotulo: 'Pix' },
  { valor: 'boleto', id: 'pagamento-boleto', rotulo: 'Boleto bancário' },
];

const ENTREGA: Opcao[] = [
  { valor: 'standard', id: 'entrega-padrao', rotulo: 'Padrão (5 dias)' },
  { valor: 'express', id: 'entrega-expressa', rotulo: 'Expressa (1 dia)' },
  { valor: 'pickup', id: 'entrega-retirada', rotulo: 'Retirar na loja' },
];

/**
 * A linha de uma opção: o controle e o rótulo lado a lado.
 *
 * O `for` do rótulo apontando para o `id` do item é o que dá nome acessível ao
 * rádio e estende o alvo de clique ao texto — sem o par, o rádio fica anônimo e
 * só o círculo de 16px é clicável.
 */
function linha(o: Opcao, recuo = 2): string {
  const p = ' '.repeat(recuo);
  return `${p}<div class="nds-cluster" data-spacing="sm">
${p}  <RadioGroupItem value="${o.valor}" id="${o.id}"${o.desabilitado ? ' disabled' : ''} />
${p}  <Label for="${o.id}">${o.rotulo}</Label>
${p}</div>`;
}

/** A raiz nomeada com as linhas dentro. */
function grupo(
  opcoes: Opcao[],
  partes: Array<string | false | null | undefined>,
  recuo = 2,
): string {
  const p = ' '.repeat(recuo - 2);
  return `${p}<RadioGroup${attrsMultilinha(partes, `${p}  `)}>
${opcoes.map((o) => linha(o, recuo)).join('\n')}
${p}</RadioGroup>`;
}

const ROTULO_PAGAMENTO = 'aria-label="Forma de pagamento"';
const ROTULO_ENTREGA = 'aria-label="Forma de entrega"';

/**
 * Forma canônica: um grupo nomeado, uma linha por opção, rótulo amarrado ao
 * item pelo `for`. Os controls que descrevem a raiz entram como atributos.
 */
export const radioGroupSource: SourceTransform<RadioGroupArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    IMPORT,
    grupo(PAGAMENTO, [
      attr('default-value', args.defaultValue),
      attrBool('disabled', args.disabled, false),
      attr('orientation', args.orientation, 'vertical'),
      attr('name', args.name),
      ROTULO_PAGAMENTO,
    ]),
  );
};

/** Eixo padrão: as opções empilham, e a navegação por setas desce a lista. */
export function radioGroupVerticalSource(): string {
  return vueSnippet(IMPORT, grupo(PAGAMENTO, [ROTULO_PAGAMENTO]));
}

/**
 * Eixo horizontal: o layout não vem de classe paralela — a mesma `orientation`
 * que muda a navegação por setas vira `aria-orientation` no grupo, e é dele que
 * o CSS parte. Assim o que se vê nunca contradiz o que o leitor de tela anuncia.
 */
export function radioGroupHorizontalSource(): string {
  return vueSnippet(
    IMPORT,
    grupo(ENTREGA, ['orientation="horizontal"', ROTULO_ENTREGA]),
  );
}

/**
 * Opção com texto de apoio: a descrição fica FORA do rótulo e chega ao rádio
 * por `aria-describedby`. Dentro do `<Label>` ela entraria no nome acessível e
 * o leitor de tela leria o parágrafo inteiro a cada seta.
 */
export function radioGroupComDescricaoSource(): string {
  const opcoes: Array<Opcao & { descricao: string }> = [
    { ...PAGAMENTO[0], descricao: 'Aprovação imediata em até 12x.' },
    { ...PAGAMENTO[1], descricao: 'Pagamento instantâneo com 5% de desconto.' },
    { ...PAGAMENTO[2], descricao: 'Compensação em até 3 dias úteis.' },
  ];
  const corpo = opcoes
    .map(
      (o) => `  <div class="nds-cluster" data-align="start" data-spacing="sm">
    <RadioGroupItem
      value="${o.valor}"
      id="${o.id}"
      class="nds-mt-1"
      aria-describedby="${o.id}-desc"
    />
    <div class="nds-stack" data-spacing="xs">
      <Label for="${o.id}">${o.rotulo}</Label>
      <p id="${o.id}-desc" class="nds-text-caption nds-text-muted-foreground">
        ${o.descricao}
      </p>
    </div>
  </div>`,
    )
    .join('\n');
  return vueSnippet(
    IMPORT,
    `<RadioGroup ${ROTULO_PAGAMENTO}>
${corpo}
</RadioGroup>`,
  );
}

/** Estado de partida: nenhuma opção marcada, o grupo espera a escolha. */
export function radioGroupPadraoSource(): string {
  return vueSnippet(IMPORT, grupo(PAGAMENTO.slice(0, 2), [ROTULO_PAGAMENTO]));
}

/**
 * Escolha inicial não-controlada: o valor casa com o `value` de um item, e é a
 * lib que marca o item na montagem — não há atributo de "marcado" no item.
 */
export function radioGroupMarcadoSource(): string {
  return vueSnippet(
    IMPORT,
    grupo(PAGAMENTO.slice(0, 2), ['default-value="pix"', ROTULO_PAGAMENTO]),
  );
}

/** Grupo inteiro bloqueado: a prop mora na raiz e desce para todos os itens. */
export function radioGroupDesabilitadoSource(): string {
  return vueSnippet(
    IMPORT,
    grupo(PAGAMENTO.slice(0, 2), ['disabled', ROTULO_PAGAMENTO]),
  );
}

/**
 * Uma opção fora de alcance: a prop mora no ITEM, e só ele sai da ordem de
 * tabulação. O motivo da indisponibilidade fica no rótulo — sem ele, a opção
 * apagada não explica nada a quem usa leitor de tela.
 */
export function radioGroupItemDesabilitadoSource(): string {
  const opcoes: Opcao[] = [
    PAGAMENTO[0],
    { ...PAGAMENTO[1], rotulo: 'Pix (indisponível)', desabilitado: true },
    PAGAMENTO[2],
  ];
  return vueSnippet(IMPORT, grupo(opcoes, [ROTULO_PAGAMENTO]));
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
  return vueSnippet(IMPORT, grupo(PAGAMENTO, [ROTULO_PAGAMENTO]));
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
${grupo(ENTREGA, ['class="nds-stack"', 'data-spacing="sm"', ROTULO_ENTREGA], 4)}
</fieldset>`,
  );
}

/**
 * Dentro de um formulário: o grupo entra num `<fieldset>` com `<legend>`, ao
 * lado dos outros campos, e `required` marca a escolha como obrigatória. O
 * envio é interceptado no `@submit.prevent` — o exemplo não tem para onde
 * mandar os dados.
 */
export function radioGroupEmFormularioSource(): string {
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
${grupo(PAGAMENTO, ['required', 'class="nds-stack"', 'data-spacing="sm"', ROTULO_PAGAMENTO], 6)}
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
    { valor: 'basico', id: 'plano-basico', titulo: 'Básico — R$ 19/mês', apoio: 'Para uso pessoal e projetos pequenos.' },
    { valor: 'pro', id: 'plano-pro', titulo: 'Pro — R$ 49/mês', apoio: 'Para times com até 5 pessoas.' },
    { valor: 'enterprise', id: 'plano-enterprise', titulo: 'Enterprise — Sob consulta', apoio: 'Suporte dedicado e SLA personalizado.' },
  ];
  const cartoes = planos
    .map(
      (p) => `  <label for="${p.id}" class="nds-radio-card nds-cluster" data-align="start" data-spacing="sm">
    <RadioGroupItem value="${p.valor}" id="${p.id}" class="nds-mt-1" />
    <div class="nds-stack" data-spacing="xs">
      <span class="nds-block nds-text-body nds-font-medium">${p.titulo}</span>
      <span class="nds-block nds-text-caption nds-text-muted-foreground">${p.apoio}</span>
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
