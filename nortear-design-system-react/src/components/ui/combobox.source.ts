/**
 * Transforms do painel Code do Combobox.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta é ANDAIME e não entra no snippet: o
 * `<div style={{ contain: "layout", minHeight: 260, position: "relative" }}>`
 * existe porque a lista é portalizada e o Storybook precisa de um quadro contra
 * o que posicioná-la, e as listas de opções vêm de um módulo de fixtures. O
 * snippet declara os próprios dados.
 *
 * A prop `items` NÃO é andaime, e por isso aparece em todos os exemplos: é dela
 * que sai a filtragem e é dela que sai a mensagem de lista vazia. Um snippet
 * sem ela ensinaria um campo que não filtra nada.
 *
 * A lista do exemplo múltiplo é a MESMA dos países que a story mostra, e uma
 * lista só serve à página inteira. Antes eram duas — a story trazia nomes de
 * framework, que o guarda transversal `source-snippets.test.ts` proíbe no que o
 * leitor vê, e o snippet já corrigia por conta própria. Divergir assim ensina
 * um campo que ninguém vê rodando: o que o snippet precisa mostrar é o modo
 * múltiplo com chips, e a lista de países mostra isso inteiro.
 *
 * Toda story tem a SUA transform. Até 2026-09-10 a linha única de chips, o
 * filtro do consumidor e o modo controlado herdavam a do `meta` e publicavam o
 * campo de escolha única — o painel ensinava justamente o caso que a story
 * existe para NÃO mostrar. E o Playground congelava rótulo, dica e forma dos
 * chips: mexer no control mudava a prévia e deixava o código como estava.
 */
import {
  attrs,
  jsxSnippet,
  propBool,
  propOption,
  propText,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type ComboboxArgs = {
  label: string;
  placeholder: string;
  multiple: boolean;
  chipsLayout: 'wrap' | 'single-line';
  disabled: boolean;
  invalid: boolean;
  name: string;
};

/** As duas formas de chips que o componente aceita; `wrap` é o padrão. */
const CHIPS_LAYOUTS = ['wrap', 'single-line'] as const;

/** Bloco de import do componente, em ordem alfabética das peças usadas. */
function importingCombobox(...parts: string[]): string {
  const list = [...parts].sort();
  return `import {\n${list
    .map((part) => `  ${part},`)
    .join('\n')}\n} from "@/components/ui/combobox";`;
}

const PARTS_BASE = [
  'Combobox',
  'ComboboxClear',
  'ComboboxContent',
  'ComboboxInput',
  'ComboboxInputWrapper',
  'ComboboxItem',
  'ComboboxLabel',
  'ComboboxTrigger',
];

const PARTS_CHIPS = [
  ...PARTS_BASE,
  'ComboboxChip',
  'ComboboxChipRemove',
  'ComboboxChipText',
  'ComboboxChips',
];

/**
 * Lista de opções declarada UMA vez e usada duas: alimenta `items` e gera as
 * opções. Escrever as duas à mão é o caminho por onde elas saem de sincronia, e
 * a divergência só aparece quando alguém filtra por um rótulo que não existe.
 */
const COUNTRY_DATA = `const PAISES = [
  { value: "brasil", label: "Brasil" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colômbia" },
  { value: "mexico", label: "México" },
  { value: "peru", label: "Peru" },
  { value: "portugal", label: "Portugal" },
  { value: "espanha", label: "Espanha" },
  { value: "uruguai", label: "Uruguai" },
];`;

const GROUP_DATA = `const INGREDIENTES = [
  {
    value: "Frutas",
    items: [
      { value: "maca", label: "Maçã" },
      { value: "banana", label: "Banana" },
      { value: "laranja", label: "Laranja" },
    ],
  },
  {
    value: "Legumes",
    items: [
      { value: "cenoura", label: "Cenoura" },
      { value: "batata", label: "Batata" },
      { value: "abobrinha", label: "Abobrinha" },
    ],
  },
];`;

/**
 * Filhos da lista na forma de FUNÇÃO. É essa forma que entrega a filtragem sem
 * código: o componente chama uma vez por opção que sobrou do filtro.
 */
const ITEM_TEMPLATE = `    {(pais) => (
      <ComboboxItem key={pais.value} value={pais}>
        {pais.label}
      </ComboboxItem>
    )}`;

/** As duas ações à direita do texto: limpar tudo e abrir a lista. */
const FIELD_ACTIONS = `    <ComboboxClear aria-label="Limpar" />
    <ComboboxTrigger aria-label="Abrir lista" />`;

/**
 * Texto como FILHO de JSX. Chave ou sinal de tag vindo do control quebraria a
 * marcação, então nesse caso o texto vai como expressão de string.
 */
function jsxChild(value: string): string {
  return /[{}<>]/.test(value) ? `{${JSON.stringify(value)}}` : value;
}

/** O que muda de um campo para outro; o resto do desenho é fixo. */
type FieldOptions = {
  label?: string;
  placeholder?: string;
  /** Atributos da raiz além de `items`, já com o espaço da frente. */
  root?: string;
  disabled?: boolean;
  invalid?: boolean;
};

/**
 * Campo de escolha única, inteiro.
 *
 * O rótulo é um `<label>` de verdade amarrado ao campo de texto — o papel de
 * combobox não aceita nome vindo do conteúdo interno, e sem o rótulo o campo
 * chegaria ao leitor de tela sem nome nenhum.
 *
 * `disabled` vai à raiz E à caixa: a caixa do campo é do design system, e não
 * da lib, e nenhum estado da raiz chega até ela sozinho.
 */
function singleField(options: FieldOptions = {}): string {
  const input = attrs(
    propText('placeholder', options.placeholder ?? 'Buscar país'),
    options.invalid === true && 'aria-invalid="true"',
  );
  return `<Combobox items={PAISES}${options.root ?? ''}>
  <ComboboxLabel>${jsxChild(options.label ?? 'País')}</ComboboxLabel>
  <ComboboxInputWrapper${options.disabled === true ? ' disabled' : ''}>
    <ComboboxInput${input} />
${FIELD_ACTIONS}
  </ComboboxInputWrapper>
  <ComboboxContent emptyMessage="Nenhum resultado">
${ITEM_TEMPLATE}
  </ComboboxContent>
</Combobox>`;
}

/** Campo múltiplo: o escolhido inicial muda de uma story para outra. */
type MultipleFieldOptions = FieldOptions & {
  chipsLayout?: unknown;
  name?: unknown;
  /** Expressão da escolha inicial, sobre a lista `PAISES`. */
  initial?: string;
};

/**
 * Modo múltiplo, com o estado declarado no cabeçalho.
 *
 * O callback só aceita LISTA: o tipo do valor é o mesmo nos dois modos, e
 * passar `setEscolhidos` direto não compila para quem cola — o estado é uma
 * lista, e o valor pode ser uma opção só ou nulo. É a mesma guarda da story.
 */
function multipleSnippet(options: MultipleFieldOptions = {}): string {
  const root = [
    'multiple',
    propOption('chipsLayout', options.chipsLayout, CHIPS_LAYOUTS, 'wrap'),
    'items={PAISES}',
    propText('name', options.name),
    options.disabled === true && 'disabled',
    'value={escolhidos}',
    'onValueChange={(valor) => setEscolhidos(Array.isArray(valor) ? valor : [])}',
  ]
    .filter(Boolean)
    .map((line) => `  ${line}`)
    .join('\n');
  const input = attrs(
    propText('placeholder', options.placeholder ?? 'Adicionar país'),
    options.invalid === true && 'aria-invalid="true"',
  );

  return jsxSnippet(
    `import { useState } from "react";
${importingCombobox(...PARTS_CHIPS)}

${COUNTRY_DATA}

const [escolhidos, setEscolhidos] = useState(${options.initial ?? '[PAISES[0], PAISES[1]]'});`,
    `<Combobox
${root}
>
  <ComboboxLabel>${jsxChild(options.label ?? 'Países')}</ComboboxLabel>
  <ComboboxInputWrapper${options.disabled === true ? ' disabled' : ''}>
    <ComboboxChips>
      {escolhidos.map((pais) => (
        <ComboboxChip key={pais.value}>
          <ComboboxChipText>{pais.label}</ComboboxChipText>
          <ComboboxChipRemove aria-label={"Remover " + pais.label} />
        </ComboboxChip>
      ))}
      <ComboboxInput${input} />
    </ComboboxChips>
${FIELD_ACTIONS}
  </ComboboxInputWrapper>
  <ComboboxContent emptyMessage="Nenhum resultado">
${ITEM_TEMPLATE}
  </ComboboxContent>
</Combobox>`,
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no campo de escolha única, que é o
 * uso canônico do componente.
 *
 * `onValueChange` NÃO é interpolado: o Storybook o entrega como espião, e o
 * corpo do mock apareceria no painel como se fosse código do design system.
 */
export const comboboxSource: SourceTransform<ComboboxArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  const field = {
    label: text(args.label),
    placeholder: text(args.placeholder),
    disabled: args.disabled === true,
    invalid: args.invalid === true,
  };

  if (args.multiple === true) {
    return multipleSnippet({ ...field, chipsLayout: args.chipsLayout, name: args.name });
  }

  return jsxSnippet(
    `${importingCombobox(...PARTS_BASE)}\n\n${COUNTRY_DATA}`,
    singleField({
      ...field,
      root: attrs(propText('name', args.name), propBool('disabled', args.disabled)),
    }),
  );
};

/**
 * Modo múltiplo. Os chips são desenhados a partir do VALOR, e não guardados
 * pelo campo: quem monta o formulário é dono da escolha, e é ela que decide
 * quantos chips existem. Cada botão de remover leva o rótulo no próprio nome —
 * cinco botões chamados "Remover" são indistinguíveis por teclado.
 */
export function comboboxMultipleSource(): string {
  return multipleSnippet();
}

/**
 * Chips numa linha só. A story escolhe SEIS países de saída porque é o
 * transbordo que separa as duas formas — com dois chips elas desenham a mesma
 * coisa —, e o snippet parte da mesma escolha.
 *
 * A caixa estreita em volta (`nds-w-xs`) é andaime: força o transbordo numa
 * prévia larga, e quem copia já tem a largura do próprio formulário.
 */
export function comboboxSingleLineChipsSource(): string {
  return multipleSnippet({
    chipsLayout: 'single-line',
    label: 'Países visitados',
    initial: 'PAISES.slice(0, 6)',
  });
}

/**
 * Opções sob cabeçalho. A lista chega agrupada, e a função de filhos recebe um
 * GRUPO em vez de uma opção — o filtro continua o mesmo, e um grupo que ficou
 * sem opções simplesmente não aparece.
 */
export function comboboxGroupedSource(): string {
  return jsxSnippet(
    `${importingCombobox(
      ...PARTS_BASE,
      'ComboboxGroup',
      'ComboboxGroupLabel',
    )}\n\n${GROUP_DATA}`,
    `<Combobox items={INGREDIENTES}>
  <ComboboxLabel>Ingrediente</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxInput placeholder="Buscar ingrediente" />
${FIELD_ACTIONS}
  </ComboboxInputWrapper>
  <ComboboxContent emptyMessage="Nenhum resultado">
    {(grupo) => (
      <ComboboxGroup key={grupo.value} items={grupo.items}>
        <ComboboxGroupLabel>{grupo.value}</ComboboxGroupLabel>
        {grupo.items.map((item) => (
          <ComboboxItem key={item.value} value={item}>
            {item.label}
          </ComboboxItem>
        ))}
      </ComboboxGroup>
    )}
  </ComboboxContent>
</Combobox>`,
  );
}

/**
 * Lista vazia. A mensagem não é decoração: sem ela, um filtro que não casa
 * deixa uma caixa branca na tela e ninguém sabe se o campo travou ou se a busca
 * não achou nada.
 */
export function comboboxEmptySource(): string {
  return jsxSnippet(
    `${importingCombobox(...PARTS_BASE)}\n\n${COUNTRY_DATA}`,
    `<Combobox items={PAISES}>
  <ComboboxLabel>País</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxInput placeholder="Buscar país" />
${FIELD_ACTIONS}
  </ComboboxInputWrapper>
  {/* A mensagem aparece sozinha quando o filtro não deixa nenhuma opção */}
  <ComboboxContent emptyMessage="Nenhum resultado">
${ITEM_TEMPLATE}
  </ComboboxContent>
</Combobox>`,
  );
}

/**
 * Indisponível. `disabled` na RAIZ impede a abertura da lista e apaga o botão
 * de remover dos chips; na CAIXA é o que faz a folha esmaecer o campo.
 */
export function comboboxDisabledSource(): string {
  return jsxSnippet(
    `${importingCombobox(...PARTS_BASE)}\n\n${COUNTRY_DATA}`,
    singleField({ root: ' disabled', disabled: true }),
  );
}

/**
 * Reprovado pela validação. O anel destrutivo vem da folha compartilhada por
 * `aria-invalid` no campo de texto — a marcação não pinta nada.
 *
 * O snippet publica o que a story desenha: o campo com o atributo, e só. Até
 * 2026-09-10 ele acrescentava um parágrafo de erro que a story não tem — e solto,
 * sem `aria-describedby` que o ligasse ao campo, ou seja, o mesmo silêncio para
 * o leitor de tela que o parágrafo prometia resolver.
 */
export function comboboxInvalidSource(): string {
  return jsxSnippet(
    `${importingCombobox(...PARTS_BASE)}\n\n${COUNTRY_DATA}`,
    singleField({ invalid: true }),
  );
}

/**
 * Filtro do CONSUMIDOR: casa só pelo início do rótulo, e ignora acento e caixa.
 *
 * A normalização fica FORA do predicado — é de quem filtra decidir o que é
 * igual. O parâmetro é tipado pela forma, e não por nome importado: o predicado
 * só lê o rótulo, e é isso que a prop pede dele.
 */
export function comboboxCustomFilterSource(): string {
  return jsxSnippet(
    `${importingCombobox(...PARTS_BASE)}

${COUNTRY_DATA}

/** Texto sem acento e em caixa baixa — a base da comparação. */
function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/\\p{Diacritic}/gu, "").toLowerCase();
}

function comecaCom(item: { label: string }, busca: string) {
  return semAcento(item.label).startsWith(semAcento(busca));
}`,
    singleField({ root: ' name="pais" filter={comecaCom}' }),
  );
}

/**
 * Escolha E texto de busca controlados por fora.
 *
 * As duas pontas moram em `useState`: o campo não guarda nada. Os dois botões
 * são o que prova o controle — escrevem no estado sem tocar no campo, e o campo
 * acompanha. Os parágrafos que a story imprime embaixo são a superfície que a
 * `play` lê, e ficam de fora como o "Enviado:" da composição com formulário.
 */
export function comboboxControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importingCombobox(...PARTS_BASE, 'type ComboboxValue')}
import { Button } from "@/components/ui/button";

${COUNTRY_DATA}

const [escolhido, setEscolhido] = useState<ComboboxValue>(null);
const [busca, setBusca] = useState("");`,
    `<div className="nds-stack" data-spacing="md">
  <Combobox
    items={PAISES}
    name="pais"
    value={escolhido}
    onValueChange={setEscolhido}
    inputValue={busca}
    onInputValueChange={setBusca}
  >
    <ComboboxLabel>País</ComboboxLabel>
    <ComboboxInputWrapper>
      <ComboboxInput placeholder="Buscar país" />
      <ComboboxClear aria-label="Limpar" />
      <ComboboxTrigger aria-label="Abrir lista" />
    </ComboboxInputWrapper>
    <ComboboxContent emptyMessage="Nenhum resultado">
      {(pais) => (
        <ComboboxItem key={pais.value} value={pais}>
          {pais.label}
        </ComboboxItem>
      )}
    </ComboboxContent>
  </Combobox>
  <div className="nds-cluster" data-spacing="md">
    <Button type="button" variant="outline" onClick={() => setBusca("por")}>
      Preencher a busca
    </Button>
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        setEscolhido(PAISES[2]);
        setBusca(PAISES[2].label);
      }}
    >
      Escolher Chile
    </Button>
  </div>
</div>`,
  );
}

/**
 * Dentro de um formulário. `name` é o que faz o valor viajar no `FormData`: o
 * componente mantém um campo escondido com esse nome, e a serialização nativa
 * do `<form>` enxerga só ele. Sem `name`, o envio sai sem o campo.
 */
export function comboboxInFormSource(): string {
  const field = singleField({ root: ' name="pais"' })
    .split('\n')
    .map((line) => (line.trim() ? `  ${line}` : line))
    .join('\n');

  return jsxSnippet(
    `${importingCombobox(...PARTS_BASE)}
import { Button } from "@/components/ui/button";

${COUNTRY_DATA}`,
    `<form
  className="nds-stack"
  data-spacing="md"
  onSubmit={(evento) => evento.preventDefault()}
>
${field}
  <Button type="submit">Continuar</Button>
</form>`,
  );
}
