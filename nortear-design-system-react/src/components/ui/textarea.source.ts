/**
 * Transforms do painel Code do Textarea.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta e NÃO entra no snippet: o encaminhamento dos
 * `fn()` da aba Actions (`args.onChange?.(e)`), os `id` de story
 * (`state-invalid`, `comp-counter`) e os componentes locais que existem só para
 * dar `useState` a uma story.
 *
 * A decisão de composição: o campo nunca aparece sozinho. Um `<textarea>` sem
 * `Label` ligada por `htmlFor`/`id` não tem nome acessível, e é justamente esse
 * par que o snippet precisa ensinar. As classes de redimensionamento e de
 * altura mínima também entram sempre: sem elas o campo nasce com duas linhas e
 * a alça arrasta nos dois eixos, o que quebra o layout ao lado.
 */
import {
  jsxSnippet,
  propBool,
  propNumber,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

export type TextareaArgs = {
  placeholder: string;
  disabled: boolean;
  readOnly: boolean;
  maxLength: number;
  rows: number;
};

const IMPORTS =
  'import { Label } from "@/components/ui/label";\nimport { Textarea } from "@/components/ui/textarea";';

/** Classes do campo: rolagem vertical apenas e piso de altura. */
const CLASSES = 'className="nds-resize-y nds-min-h-30"';

/** Linhas visíveis que o elemento nativo já assume sem `rows`. */
const LINES_DEFAULT = 2;

/** Um atributo por linha — a fila de props do campo passa de qualquer limite. */
function field(partes: Array<string | false | null | undefined>, recuo = '  '): string {
  const list = partes.filter((parte): parte is string => Boolean(parte));
  return `${recuo}<Textarea\n${list.map((parte) => `${recuo}  ${parte}`).join('\n')}\n${recuo}/>`;
}

/** Contêiner do campo: rótulo, campo e o que vier depois, empilhados. */
function block(label: string, id: string, body: string): string {
  return `<div className="nds-stack nds-w-md" data-spacing="sm">
  <Label htmlFor="${id}">${label}</Label>
${body}
</div>`;
}

/**
 * Linha de apoio sob o campo: dica à esquerda, contagem à direita.
 *
 * A contagem tem `aria-live="polite"` e um `aria-label` por extenso porque
 * "480/500" lido em voz alta não diz o que é — e sem a região viva quem não vê
 * a tela só descobre o limite quando o campo para de aceitar texto.
 */
function counter(dica: string, limit: number): string {
  return `  <div className="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
    <span>${dica}</span>
    <span
      aria-live="polite"
      aria-label={\`\${valor.length} de ${limit} caracteres usados\`}
    >
      {valor.length}/${limit}
    </span>
  </div>`;
}

const IMPORT_STATE = 'import { useState } from "react";';

/** Estado que o contador exige: é o `value` que a contagem lê. */
const EMPTY_STATE = 'const [valor, setValor] = useState("");';

/**
 * Cabeçalho de import com o estado controlado. Os imports vêm todos antes da
 * declaração — intercalar os dois deixa o snippet impossível de colar.
 */
function headerControlled(...extras: string[]): string {
  return `${[IMPORT_STATE, IMPORTS, ...extras].join('\n')}\n\n${EMPTY_STATE}`;
}

const IMPORTS_CONTROLLED = headerControlled();

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no campo simples, que é o uso
 * canônico.
 *
 * A COMPOSIÇÃO troca junto com `maxLength`: um limite sem contagem visível é
 * um campo que trava sem avisar, e mostrar a contagem exige o valor em estado.
 * `onChange` e `onBlur` não são interpolados — o Storybook os entrega como
 * espiões, e o corpo do mock apareceria no painel como se fosse código do
 * design system.
 */
export const textareaSource: SourceTransform<TextareaArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const limit = typeof args.maxLength === 'number' && args.maxLength > 0 ? args.maxLength : undefined;
  const comuns = [
    propText('placeholder', args.placeholder) ??
      'placeholder="ex: Descreva o produto em até 500 caracteres..."',
    propBool('disabled', args.disabled),
    propBool('readOnly', args.readOnly),
    limit === undefined ? undefined : propNumber('maxLength', limit),
    typeof args.rows === 'number' && args.rows !== LINES_DEFAULT
      ? propNumber('rows', args.rows)
      : undefined,
    CLASSES,
  ];

  if (limit === undefined) {
    return jsxSnippet(IMPORTS, block('Descrição', 'descricao', field(['id="descricao"', ...comuns])));
  }

  return jsxSnippet(
    IMPORTS_CONTROLLED,
    block(
      'Descrição',
      'descricao',
      `${field([
        'id="descricao"',
        'value={valor}',
        'onChange={(e) => setValor(e.target.value)}',
        ...comuns,
      ])}
${counter('Descreva o produto com clareza.', limit)}`,
    ),
  );
};

/**
 * Sem redimensionamento. A troca é de classe, não de prop: `nds-resize-none`
 * trava a alça — o que vale dentro de um modal ou de uma grade, onde arrastar a
 * borda empurraria o resto do layout.
 */
export function textareaNoRedimensionarSource(): string {
  return jsxSnippet(
    IMPORTS,
    block(
      'Feedback',
      'feedback',
      field([
        'id="feedback"',
        'placeholder="O que poderíamos melhorar?"',
        'className="nds-resize-none nds-min-h-30"',
      ]),
    ),
  );
}

/**
 * Contagem de caracteres. `maxLength` sozinho só bloqueia a digitação no
 * limite; é o par com a contagem visível que transforma o bloqueio em aviso.
 */
export function textareaWithCounterSource(): string {
  return jsxSnippet(
    IMPORTS_CONTROLLED,
    block(
      'Descrição',
      'descricao',
      `${field([
        'id="descricao"',
        'value={valor}',
        'onChange={(e) => setValor(e.target.value)}',
        'placeholder="ex: Camiseta de algodão, gola redonda..."',
        'maxLength={500}',
        CLASSES,
      ])}
${counter('Descreva com clareza.', 500)}`,
    ),
  );
}

/**
 * Campo com conteúdo. `defaultValue` — e não `value` — porque aqui o texto é
 * apenas o ponto de partida: com `value` sem callback o campo ficaria imutável.
 */
export function textareaPreenchidoSource(): string {
  return jsxSnippet(
    IMPORTS,
    block(
      'Biografia',
      'biografia',
      field([
        'id="biografia"',
        'defaultValue="Designer de interfaces há 8 anos, apaixonada por sistemas de design escaláveis e acessibilidade web."',
        CLASSES,
      ]),
    ),
  );
}

/**
 * Campo indisponível. `disabled` é o atributo nativo: tira o campo do percurso
 * do teclado e o valor do envio do formulário. Quando o texto precisa continuar
 * legível e enviável, o estado certo é o somente leitura.
 */
export function textareaDisabledSource(): string {
  return jsxSnippet(
    IMPORTS,
    block(
      'Descrição',
      'descricao',
      field(['id="descricao"', 'placeholder="Não disponível"', 'disabled', CLASSES]),
    ),
  );
}

/**
 * Erro de validação. Os dois lados são obrigatórios: `aria-invalid` anuncia o
 * estado e `aria-describedby` liga o campo à mensagem. Só a borda vermelha
 * deixaria o erro invisível para quem não distingue a cor.
 */
export function textareaInvalidoSource(): string {
  return jsxSnippet(
    IMPORTS,
    block(
      'Descrição',
      'descricao',
      `${field([
        'id="descricao"',
        'defaultValue="curto"',
        'aria-invalid="true"',
        'aria-describedby="descricao-erro"',
        CLASSES,
      ])}
  <p id="descricao-erro" className="nds-text-caption nds-text-destructive">
    A descrição precisa de pelo menos 20 caracteres.
  </p>`,
    ),
  );
}

/**
 * Somente leitura. O texto continua selecionável, copiável e é enviado com o
 * formulário — a diferença para `disabled`, que remove as três coisas.
 */
export function textareaSomenteLeituraSource(): string {
  return jsxSnippet(
    IMPORTS,
    block(
      'Observações',
      'observacoes',
      field([
        'id="observacoes"',
        'defaultValue="Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis."',
        'readOnly',
        CLASSES,
      ]),
    ),
  );
}

/**
 * Rótulo mais texto de apoio. A dica desce por `aria-describedby`, não por um
 * segundo rótulo: o nome do campo continua sendo um só, e a orientação é lida
 * depois dele em vez de disputar o mesmo lugar.
 */
export function textareaWithDescriptionSource(): string {
  return jsxSnippet(
    IMPORTS,
    block(
      'Descrição',
      'descricao',
      `${field([
        'id="descricao"',
        'placeholder="ex: Camiseta de algodão, gola redonda..."',
        'aria-describedby="descricao-ajuda"',
        CLASSES,
      ])}
  <p id="descricao-ajuda" className="nds-text-caption nds-text-muted-foreground">
    Descreva o produto com clareza para aparecer melhor na busca.
  </p>`,
    ),
  );
}

/**
 * Contagem acessível com limite curto. O limite baixo é o caso em que a
 * contagem mais importa: quem escreve precisa saber quanto falta antes de
 * perder a frase no bloqueio.
 */
export function textareaCounterAccessibleSource(): string {
  return jsxSnippet(
    IMPORTS_CONTROLLED,
    block(
      'Mensagem',
      'mensagem',
      `${field([
        'id="mensagem"',
        'value={valor}',
        'onChange={(e) => setValor(e.target.value)}',
        'placeholder="ex: Compartilhe seu pensamento..."',
        'maxLength={280}',
        CLASSES,
      ])}
${counter('Limite: 280 caracteres.', 280)}`,
    ),
  );
}

/**
 * Dentro de um formulário. `name` é o que leva o texto no envio e `required` é
 * o que a validação nativa lê — sem eles o campo aparece no formulário sem
 * participar dele.
 */
export function formTextareaSource(): string {
  return jsxSnippet(
    headerControlled('import { Button } from "@/components/ui/button";'),
    `<form
  className="nds-stack nds-w-md"
  data-spacing="md"
  onSubmit={(e) => e.preventDefault()}
>
  <div className="nds-stack" data-spacing="sm">
    <Label htmlFor="biografia">Biografia</Label>
${field(
  [
    'id="biografia"',
    'name="bio"',
    'value={valor}',
    'onChange={(e) => setValor(e.target.value)}',
    'placeholder="Conte um pouco sobre você..."',
    'maxLength={500}',
    'required',
    CLASSES,
  ],
  '    ',
)}
${counter('Aparece no seu perfil público.', 500)
  .split('\n')
  .map((line) => (line.trim() ? `  ${line}` : line))
  .join('\n')}
  </div>
  <Button type="submit">Salvar</Button>
</form>`,
  );
}

/**
 * Modo controlado. O valor passa a viver fora do campo, que só avisa a mudança
 * — é o que permite validar, formatar ou espelhar o texto em outro lugar da
 * tela. `value` sem o callback congelaria o campo.
 */
export function textareaControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORTS}

const [valor, setValor] = useState("Texto inicial controlado.");`,
    block(
      'Observações',
      'observacoes',
      `${field([
        'id="observacoes"',
        'value={valor}',
        'onChange={(e) => setValor(e.target.value)}',
        CLASSES,
      ])}
  <p className="nds-text-caption nds-text-muted-foreground">
    Tamanho atual: <code className="nds-font-mono">{valor.length} chars</code>
  </p>`,
    ),
  );
}
