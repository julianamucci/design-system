/**
 * Transforms do painel Code do Toggle.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * Estas funções nasceram de uma lambda declarada DENTRO do `meta` da story.
 * Inline, nenhum teste as alcançava — e ela valia só para um dos três arquivos
 * de story do componente, então as variantes e as composições continuavam
 * imprimindo a árvore do `render`.
 *
 * O que a story monta em volta e NÃO entra no snippet: a `key` de remontagem
 * (existe só porque `defaultPressed` é lido uma vez, na montagem), o
 * encaminhamento que descarta o segundo argumento do callback para a aba
 * Actions não estourar ao serializar o evento nativo, e os controls `label` e
 * `iconOnly`, que não são props do componente — são o interruptor entre as duas
 * formas do mesmo botão.
 *
 * A decisão de composição: sem texto visível, o `aria-label` é obrigatório e
 * entra sempre. Um toggle só-ícone sem ele é um botão anônimo — quem ouve a
 * tela recebe "botão, não pressionado" e nada mais. Com rótulo visível o
 * `aria-label` sai: repetir o texto ali só cria dois nomes para a mesma coisa.
 */
import {
  attrs,
  jsxSnippet,
  propBool,
  propOption,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

export type ToggleArgs = {
  variant: 'default' | 'outline';
  size: 'sm' | 'default' | 'lg';
  defaultPressed: boolean;
  disabled: boolean;
  label: string;
  iconOnly: boolean;
};

const VARIANTS = ['default', 'outline'] as const;
const SIZES = ['sm', 'default', 'lg'] as const;

const IMPORT_TOGGLE = 'import { Toggle } from "@/components/ui/toggle";';

/** Import dos ícones, sempre em ordem alfabética como o lint do projeto pede. */
function importingIcons(...icons: string[]): string {
  return `import { ${[...new Set(icons)].sort().join(', ')} } from "lucide-react";`;
}

/**
 * Um toggle. O ícone é sempre decorativo: com rótulo visível ele reforça o
 * texto, e sem rótulo quem nomeia o botão é o `aria-label` — nos dois casos
 * anunciar o desenho diria a mesma coisa duas vezes.
 */
function toggle(atributos: string, icone: string, labelVisible?: string): string {
  const corpo = labelVisible
    ? `  <${icone} aria-hidden="true" />\n  ${labelVisible}`
    : `  <${icone} aria-hidden="true" />`;
  return `<Toggle${atributos}>\n${corpo}\n</Toggle>`;
}

/** Indenta um toggle para dentro de um contêiner. */
function insideOf(conteudo: string): string {
  return conteudo
    .split('\n')
    .map((line) => (line.trim() ? `  ${line}` : line))
    .join('\n');
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no toggle só-ícone, que é a forma
 * canônica do componente.
 *
 * Só o que difere do padrão entra: `variant="default"` e `size="default"` são o
 * que o componente faz sozinho, e o próprio primitivo omite o `data-attribute`
 * nesses casos. `onPressedChange` não é interpolado — o Storybook o entrega
 * como espião, e o corpo do mock apareceria no painel como se fosse código do
 * design system.
 */
export const toggleSource: SourceTransform<ToggleArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const soIcon = args.iconOnly ?? true;
  const rotulo = texto(args.label) ?? (soIcon ? 'Negrito' : 'Mostrar ocultos');
  const icone = soIcon ? 'Bold' : 'Eye';

  const atributos = attrs(
    propOption('variant', args.variant, VARIANTS, 'default'),
    propOption('size', args.size, SIZES, 'default'),
    propBool('defaultPressed', args.defaultPressed),
    propBool('disabled', args.disabled),
    // Sem texto visível não há nome acessível nenhum sem isto.
    soIcon ? `aria-label="${rotulo}"` : undefined,
  );

  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons(icone)}`,
    toggle(atributos, icone, soIcon ? undefined : rotulo),
  );
};

/**
 * Variante de contorno. A borda é o que dá ao botão uma silhueta em repouso —
 * necessária quando ele fica sobre um fundo sem cartão em volta, onde a
 * variante padrão só se revela ao passar o ponteiro.
 */
export function toggleContornoSource(): string {
  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons('Italic')}`,
    toggle(' variant="outline" aria-label="Itálico"', 'Italic'),
  );
}

/**
 * Rótulo visível. Aqui o texto JÁ é o nome acessível, então o `aria-label` sai
 * — dois nomes para o mesmo botão fazem o leitor de tela anunciar um e a busca
 * por voz procurar o outro. O segundo botão nasce ligado por `defaultPressed`.
 */
export function toggleWithLabelSource(): string {
  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons('Eye', 'List')}`,
    `<div className="nds-cluster" data-spacing="sm">
${insideOf(toggle(' variant="outline"', 'Eye', 'Mostrar ocultos'))}
${insideOf(toggle(' variant="outline" defaultPressed', 'List', 'Visão compacta'))}
</div>`,
  );
}

/**
 * A escada de tamanhos. Os três degraus juntos porque o tamanho só significa
 * alguma coisa em comparação — e porque o piso de 24px do alvo de toque
 * (WCAG 2.5.8) vale para o menor deles, que é onde a regra aperta.
 */
export function toggleSizesSource(): string {
  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons('Bold')}`,
    `<div className="nds-cluster" data-spacing="sm">
${insideOf(toggle(' variant="outline" size="sm" aria-label="Negrito pequeno"', 'Bold'))}
${insideOf(toggle(' variant="outline" aria-label="Negrito padrão"', 'Bold'))}
${insideOf(toggle(' variant="outline" size="lg" aria-label="Negrito grande"', 'Bold'))}
</div>`,
  );
}

/**
 * Barra de formatação. O `role="group"` com nome próprio é o que amarra os
 * quatro botões num conjunto: sem ele o leitor de tela anuncia quatro botões
 * soltos e nada diz que eles formatam o mesmo texto. Cada toggle continua
 * independente — ligar um não desliga o vizinho, que é o que separa esta
 * composição de um grupo de escolha única.
 */
export function toggleBarFormattingSource(): string {
  const buttons = ['Bold', 'Italic', 'Underline', 'List'];
  const rotulos = ['Negrito', 'Itálico', 'Sublinhado', 'Lista'];

  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons(...buttons)}`,
    `<div
  role="group"
  aria-label="Formatação de texto"
  className="nds-cluster nds-rounded-lg nds-border-default nds-p-1"
  data-align="center"
  data-spacing="xs"
>
${buttons.map((icone, i) => insideOf(toggle(` aria-label="${rotulos[i]}"`, icone))).join('\n')}
</div>`,
  );
}

/**
 * Lista de filtros. Cada filtro é uma escolha booleana isolada e podem valer ao
 * mesmo tempo — por isso são toggles, e não um grupo em que escolher um
 * cancela o outro. O título acima nomeia o conjunto para quem vê.
 */
export function toggleFiltersSource(): string {
  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons('Eye', 'List')}`,
    `<div className="nds-stack" data-spacing="sm">
  <p className="nds-text-body nds-font-semibold">Filtros de exibição</p>
  <div className="nds-cluster" data-spacing="sm">
${insideOf(insideOf(toggle(' variant="outline"', 'Eye', 'Mostrar ocultos')))}
${insideOf(insideOf(toggle(' variant="outline" defaultPressed', 'List', 'Visão compacta')))}
  </div>
</div>`,
  );
}

/**
 * Modo controlado. `pressed` mais o callback substituem `defaultPressed`: o
 * estado passa a viver fora do botão, que só avisa a mudança — é o que permite
 * aplicar o efeito de verdade (formatar o texto, filtrar a lista) em vez de
 * apenas acender o botão.
 */
export function toggleControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT_TOGGLE}
${importingIcons('Bold')}

const [negrito, setNegrito] = useState(false);`,
    `<div className="nds-stack" data-spacing="sm">
${insideOf(toggle(' pressed={negrito} onPressedChange={setNegrito} aria-label="Negrito"', 'Bold'))}
  <p className="nds-text-caption nds-text-muted-foreground">
    Estado atual: <code className="nds-font-mono">{String(negrito)}</code>
  </p>
</div>`,
  );
}

/**
 * Ligado × desligado, lado a lado. `defaultPressed` é o estado inicial de um
 * toggle NÃO controlado: o botão passa a guardar o próprio estado a partir
 * dali. O par existe porque "ligado" só se lê em comparação — sozinho, o botão
 * aceso parece apenas um botão.
 */
export function toggleActiveSource(): string {
  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons('Bold')}`,
    `<div className="nds-cluster" data-spacing="sm">
${insideOf(toggle(' aria-label="Negrito inativo"', 'Bold'))}
${insideOf(toggle(' defaultPressed aria-label="Negrito ativo"', 'Bold'))}
</div>`,
  );
}

/**
 * O anel de foco nas duas variantes. Não há prop nem classe aqui: o anel é do
 * `:focus-visible` da folha compartilhada, e o que o snippet ensina é que ele
 * vale igual na variante padrão e na de contorno — a segunda já tem borda em
 * repouso, e mesmo assim o foco precisa se distinguir dela.
 */
export function toggleFocusSource(): string {
  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons('Bold', 'Italic')}`,
    `<div className="nds-cluster" data-spacing="sm">
${insideOf(toggle(' aria-label="Negrito"', 'Bold'))}
${insideOf(toggle(' variant="outline" aria-label="Itálico"', 'Italic'))}
</div>`,
  );
}

/**
 * Desabilitado nas duas posições. É o `disabled` NATIVO do botão, não um
 * `aria-disabled`: além de anunciar o estado, ele tira o controle da ordem de
 * tabulação. O segundo mostra que desabilitar não apaga o estado — o botão
 * continua pressionado, apenas não muda mais.
 */
export function toggleDisabledSource(): string {
  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons('Bold', 'Italic')}`,
    `<div className="nds-cluster" data-spacing="sm">
${insideOf(toggle(' disabled aria-label="Negrito"', 'Bold'))}
${insideOf(toggle(' disabled defaultPressed aria-label="Itálico ativo e desabilitado"', 'Italic'))}
</div>`,
  );
}

/**
 * Estado inválido. As duas peças andam juntas: `aria-invalid` marca o controle
 * e `aria-describedby` liga a mensagem a ele, para que o motivo seja anunciado
 * junto com o erro em vez de ficar num parágrafo que ninguém associa. O anel
 * destrutivo vem da folha — não há classe de cor no botão.
 */
export function toggleInvalidoSource(): string {
  return jsxSnippet(
    `${IMPORT_TOGGLE}\n${importingIcons('Bold')}`,
    `<div className="nds-stack" data-spacing="xs">
${insideOf(
  toggle(
    ' aria-invalid="true" aria-describedby="toggle-invalid-msg" aria-label="Negrito"',
    'Bold',
  ),
)}
  <p className="nds-text-body nds-text-destructive">
    Selecione ao menos uma formatação.
  </p>
</div>`,
  );
}
