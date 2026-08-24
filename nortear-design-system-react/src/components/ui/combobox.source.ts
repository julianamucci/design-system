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
 * A lista do exemplo múltiplo é a MESMA dos países, e não a de tecnologias que
 * a story mostra. O guarda transversal `source-snippets.test.ts` proíbe nome de
 * outra stack no que o leitor vê, e os rótulos daquela story — fechados pela
 * spec de exemplos — são justamente nomes de framework. O que o snippet precisa
 * ensinar é o modo múltiplo com chips, e a lista de países ensina isso inteiro.
 */
import {
  attrs,
  jsxSnippet,
  propBool,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

export type ComboboxArgs = {
  label: string;
  placeholder: string;
  multiple: boolean;
  disabled: boolean;
  invalid: boolean;
  name: string;
};

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
 * Campo de escolha única, inteiro.
 *
 * O rótulo é um `<label>` de verdade amarrado ao campo de texto — o papel de
 * combobox não aceita nome vindo do conteúdo interno, e sem o rótulo o campo
 * chegaria ao leitor de tela sem nome nenhum.
 *
 * `wrapperDisabled` existe separado de `root` porque a caixa do campo é do
 * design system, e não da lib: nenhum estado da raiz chega até ela sozinho.
 */
function singleField(
  options: { root?: string; input?: string; wrapperDisabled?: boolean } = {},
): string {
  return `<Combobox items={PAISES}${options.root ?? ''}>
  <ComboboxLabel>País</ComboboxLabel>
  <ComboboxInputWrapper${options.wrapperDisabled ? ' disabled' : ''}>
    <ComboboxInput placeholder="Buscar país"${options.input ?? ''} />
${FIELD_ACTIONS}
  </ComboboxInputWrapper>
  <ComboboxContent emptyMessage="Nenhum resultado">
${ITEM_TEMPLATE}
  </ComboboxContent>
</Combobox>`;
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
  if (args.multiple === true) return comboboxMultipleSource();

  return jsxSnippet(
    `${importingCombobox(...PARTS_BASE)}\n\n${COUNTRY_DATA}`,
    singleField({
      root: attrs(propText('name', args.name), propBool('disabled', args.disabled)),
      input: args.invalid === true ? ' aria-invalid="true"' : '',
      wrapperDisabled: args.disabled === true,
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
  return jsxSnippet(
    `import { useState } from "react";
${importingCombobox(...PARTS_CHIPS)}

${COUNTRY_DATA}

const [escolhidos, setEscolhidos] = useState([PAISES[0], PAISES[1]]);`,
    `<Combobox
  multiple
  items={PAISES}
  value={escolhidos}
  onValueChange={(valor) => setEscolhidos(valor)}
>
  <ComboboxLabel>Países visitados</ComboboxLabel>
  <ComboboxInputWrapper>
    <ComboboxChips>
      {escolhidos.map((pais) => (
        <ComboboxChip key={pais.value}>
          <ComboboxChipText>{pais.label}</ComboboxChipText>
          <ComboboxChipRemove aria-label={"Remover " + pais.label} />
        </ComboboxChip>
      ))}
      <ComboboxInput placeholder="Adicionar país" />
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
    singleField({ root: ' disabled', wrapperDisabled: true }),
  );
}

/**
 * Reprovado pela validação. O anel destrutivo vem da folha compartilhada por
 * `aria-invalid` no campo de texto — a marcação não pinta nada. E o atributo
 * sozinho não basta: sem a mensagem ao lado, quem usa leitor de tela ouve
 * "inválido" sem saber o que corrigir.
 */
export function comboboxInvalidSource(): string {
  return jsxSnippet(
    `${importingCombobox(...PARTS_BASE)}\n\n${COUNTRY_DATA}`,
    `<div className="nds-stack" data-spacing="sm">
  <Combobox items={PAISES}>
    <ComboboxLabel>País</ComboboxLabel>
    <ComboboxInputWrapper>
      <ComboboxInput placeholder="Buscar país" aria-invalid="true" />
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
  <p className="nds-text-body nds-text-destructive">
    Escolha um país para continuar.
  </p>
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
