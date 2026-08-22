/**
 * Transforms do painel Code do ToggleGroup.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 */
import {
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propNumber,
  propOption,
  propText,
  type SourceTransform,
} from '@/lib/story-source';

export type ToggleGroupArgs = {
  type: 'single' | 'multiple';
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'outline';
  size: 'sm' | 'default' | 'lg';
  spacing: number;
  disabled: boolean;
  'aria-label': string;
};

const MODOS = ['single', 'multiple'] as const;
const ORIENTACOES = ['horizontal', 'vertical'] as const;
const VARIANTES = ['default', 'outline'] as const;
const TAMANHOS = ['sm', 'default', 'lg'] as const;

const IMPORT_GRUPO = 'import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";';

/** Um item por linha, já indentado para dentro do grupo. */
function itens(lista: Array<[valor: string, rotulo: string, icone: string, extra?: string]>): string {
  return lista
    .map(([valor, rotulo, icone, extra]) => {
      const abertura = extra
        ? `<ToggleGroupItem ${extra} value="${valor}" aria-label="${rotulo}">`
        : `<ToggleGroupItem value="${valor}" aria-label="${rotulo}">`;
      return `  ${abertura}
    <${icone} aria-hidden="true" />
  </ToggleGroupItem>`;
    })
    .join('\n');
}

const ALINHAMENTO: Array<[string, string, string]> = [
  ['left', 'Alinhar à esquerda', 'AlignLeft'],
  ['center', 'Centralizar', 'AlignCenter'],
  ['right', 'Alinhar à direita', 'AlignRight'],
];

const FORMATACAO: Array<[string, string, string]> = [
  ['bold', 'Negrito', 'Bold'],
  ['italic', 'Itálico', 'Italic'],
  ['underline', 'Sublinhado', 'Underline'],
];

const VISUALIZACAO: Array<[string, string, string]> = [
  ['grid', 'Grade', 'LayoutGrid'],
  ['list', 'Lista', 'List'],
];

const ICONS_ALIGNMENT = 'import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";';
const ICONS_FORMATTING = 'import { Bold, Italic, Underline } from "lucide-react";';
const ICONS_VISUALIZACAO = 'import { LayoutGrid, List } from "lucide-react";';

/** Monta o grupo com os atributos que diferem do padrão e os itens dados. */
function grupo(atributos: Array<string | undefined>, corpo: string): string {
  return `<ToggleGroup${attrsMultilinha(atributos)}>\n${corpo}\n</ToggleGroup>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões do componente.
 *
 * O nome acessível do grupo é obrigatório e NÃO é opcional no snippet: três
 * botões só-ícone lado a lado não dizem de que categoria são. `onValueChange`
 * não é interpolado — o Storybook o entrega como espião, e o corpo do mock
 * apareceria no painel como se fosse código do design system.
 */
export const toggleGroupSource: SourceTransform<ToggleGroupArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const multiplo = args.type === 'multiple';
  const rotulo = propText('aria-label', args['aria-label']) ?? 'aria-label="Alinhamento do texto"';

  return jsxSnippet(
    `${IMPORT_GRUPO}\n${ICONS_ALIGNMENT}`,
    grupo(
      [
        propOption('type', args.type, MODOS, 'single'),
        // A forma do valor acompanha o modo: exclusivo entrega string,
        // combinado entrega lista. É a diferença que o `type` governa.
        multiplo ? 'defaultValue={["left"]}' : 'defaultValue="left"',
        propOption('orientation', args.orientation, ORIENTACOES, 'horizontal'),
        propOption('variant', args.variant, VARIANTES, 'default'),
        propOption('size', args.size, TAMANHOS, 'default'),
        typeof args.spacing === 'number' && args.spacing !== 0
          ? propNumber('spacing', args.spacing)
          : undefined,
        propBool('disabled', args.disabled),
        rotulo,
      ],
      itens(ALINHAMENTO),
    ),
  );
};

/**
 * Modo exclusivo: um item ativo por vez, e o valor é uma string. É o padrão do
 * componente, e por isso `type` não aparece.
 */
export function toggleGroupExclusivoSource(): string {
  return jsxSnippet(
    `${IMPORT_GRUPO}\n${ICONS_ALIGNMENT}`,
    grupo(['defaultValue="center"', 'aria-label="Alinhamento do texto"'], itens(ALINHAMENTO)),
  );
}

/**
 * Modo combinado: vários ativos ao mesmo tempo, e o valor passa a ser lista.
 * O `defaultValue` acompanha — array aqui, string no exclusivo.
 */
export function toggleGroupCombinadoSource(): string {
  return jsxSnippet(
    `${IMPORT_GRUPO}\n${ICONS_FORMATTING}`,
    grupo(
      ['type="multiple"', 'defaultValue={["bold", "italic"]}', 'aria-label="Formatação"'],
      itens(FORMATACAO),
    ),
  );
}

/**
 * Eixo vertical. Não é decoração: é `orientation` que ensina as setas a moverem
 * o foco para cima e para baixo — sem ela, o grupo empilhado continua ouvindo
 * apenas as setas laterais.
 */
export function toggleGroupVerticalSource(): string {
  return jsxSnippet(
    `${IMPORT_GRUPO}\n${ICONS_VISUALIZACAO}`,
    grupo(
      ['orientation="vertical"', 'defaultValue="grid"', 'aria-label="Modo de visualização"'],
      itens(VISUALIZACAO),
    ),
  );
}

/** Nada selecionado: a ausência de `defaultValue` É o estado que a story mostra. */
export function toggleGroupEmptySource(): string {
  return jsxSnippet(
    `${IMPORT_GRUPO}\n${ICONS_ALIGNMENT}`,
    grupo(['aria-label="Alinhamento do texto"'], itens(ALINHAMENTO)),
  );
}

/** Grupo inteiro desabilitado — a prop mora no grupo, e os itens a herdam. */
export function toggleGroupDesabilitadoSource(): string {
  return jsxSnippet(
    `${IMPORT_GRUPO}\n${ICONS_ALIGNMENT}`,
    grupo(
      ['disabled', 'defaultValue="center"', 'aria-label="Alinhamento do texto"'],
      itens(ALINHAMENTO),
    ),
  );
}

/**
 * Só um item fora de uso: a prop desce para o item, e os vizinhos seguem
 * interativos. É o oposto de desabilitar o grupo.
 */
export function toggleGroupItemDesabilitadoSource(): string {
  return jsxSnippet(
    `${IMPORT_GRUPO}\n${ICONS_ALIGNMENT}`,
    grupo(
      ['aria-label="Alinhamento do texto"'],
      itens([
        ['left', 'Alinhar à esquerda', 'AlignLeft'],
        ['center', 'Centralizar', 'AlignCenter', 'disabled'],
        ['right', 'Alinhar à direita', 'AlignRight'],
      ]),
    ),
  );
}

/**
 * Controlado no modo exclusivo. A forma pública do valor é a documentada — uma
 * string —, e é ela que chega ao callback; desembrulhar lista na mão esconderia
 * justamente essa diferença entre os dois modos.
 */
export function toggleGroupControlledExclusivoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT_GRUPO}
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";`,
    `const [alinhamento, setAlinhamento] = useState("left");

<div className="nds-stack" data-align="start" data-spacing="sm">
  <ToggleGroup
    variant="outline"
    value={alinhamento}
    onValueChange={(valor) => setAlinhamento(valor)}
    aria-label="Alinhamento do texto"
  >
${itens([
  ['left', 'Alinhar à esquerda', 'AlignLeft'],
  ['center', 'Centralizar', 'AlignCenter'],
  ['right', 'Alinhar à direita', 'AlignRight'],
  ['justify', 'Justificar', 'AlignJustify'],
])
  .split('\n')
  .map((linha) => (linha.trim() ? `  ${linha}` : linha))
  .join('\n')}
  </ToggleGroup>

  <p className="nds-text-caption nds-text-muted-foreground">
    Atual: <code className="nds-font-mono">{alinhamento}</code>
  </p>
</div>`,
  );
}

/**
 * Controlado no modo combinado. Aqui o callback recebe a lista inteira, e não
 * o item que mudou — o estado é a seleção completa a cada troca.
 */
export function toggleGroupControlledCombinadoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT_GRUPO}
${ICONS_FORMATTING}`,
    `const [formatos, setFormatos] = useState(["bold"]);

<div className="nds-stack" data-align="start" data-spacing="sm">
  <ToggleGroup
    type="multiple"
    value={formatos}
    onValueChange={(valor) => setFormatos(valor)}
    aria-label="Formatação"
  >
${itens(FORMATACAO)
  .split('\n')
  .map((linha) => (linha.trim() ? `  ${linha}` : linha))
  .join('\n')}
  </ToggleGroup>

  <p className="nds-text-caption nds-text-muted-foreground">
    Ativos: <code className="nds-font-mono">[{formatos.join(", ")}]</code>
  </p>
</div>`,
  );
}

/**
 * Contorno com respiro. O `variant="outline"` no GRUPO emenda os botões num
 * contêiner só e zera a borda de cada um — o oposto do que esta composição
 * mostra. Para botões separados, o contorno vai no ITEM e o respiro no grupo.
 */
export function toggleGroupContornoEspacadoSource(): string {
  return jsxSnippet(
    `${IMPORT_GRUPO}\n${ICONS_ALIGNMENT}`,
    grupo(
      ['spacing={1}', 'defaultValue="center"', 'aria-label="Alinhamento do texto"'],
      itens([
        ['left', 'Alinhar à esquerda', 'AlignLeft', 'variant="outline"'],
        ['center', 'Centralizar', 'AlignCenter', 'variant="outline"'],
        ['right', 'Alinhar à direita', 'AlignRight', 'variant="outline"'],
      ]),
    ),
  );
}
