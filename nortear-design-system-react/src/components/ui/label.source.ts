/**
 * Transforms do painel Code do Label.
 *
 * Módulo de TS puro — o `.tsx` só entraria por `import type`, que o compilador
 * apaga. É o que deixa estas funções rodarem no projeto `unit` do vitest, a
 * única guarda que elas têm: a saída do painel não chega ao DOM durante a
 * `play`.
 *
 * O rótulo nunca aparece sozinho num snippet. Sozinho ele é um `<label>` sem
 * dono, e o que o componente ensina é justamente o par `htmlFor` ↔ `id`: é a
 * associação que faz o clique no texto focar o controle e que dá nome acessível
 * ao campo. Um exemplo com o rótulo isolado ensinaria a metade que não importa.
 */
import { attrs, childText, jsxSnippet, propText, type SourceTransform } from '@/lib/story-source';

export type LabelArgs = {
  children: string;
  className: string;
};

const IMPORT_LABEL = 'import { Label } from "@/components/ui/label";';
const IMPORT_FIELD = `import { Input } from "@/components/ui/input";
${IMPORT_LABEL}`;

/** A coluna que segura o par: respiro curto entre rótulo e controle. */
const COLUMN = '<div className="nds-stack nds-w-xs" data-spacing="xs">';

/**
 * Transform do `meta` — vale para todas as stories dos três arquivos do Label.
 * Lê os controls do Playground; nas stories sem args cai no par canônico, que é
 * exatamente o uso que a documentação promete.
 *
 * `className` só entra quando o control traz algo: o padrão é string vazia, e
 * um `className=""` no snippet ensinaria ruído a quem copia.
 */
export const labelSource: SourceTransform<LabelArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const texto = childText(args.children, 'Nome completo');
  return jsxSnippet(
    IMPORT_FIELD,
    `${COLUMN}
  <Label htmlFor="nome-completo"${attrs(propText('className', args.className))}>${texto}</Label>
  <Input id="nome-completo" placeholder="ex: João da Silva" />
</div>`,
  );
};

/**
 * Controle irmão desabilitado. A marca `nds-peer` vai no CONTROLE, não no
 * rótulo — é o seletor de irmão que apaga o texto e troca o cursor. Sem ela o
 * rótulo continua em opacidade cheia ao lado de um campo bloqueado, que foi o
 * defeito real em três das cinco stacks.
 */
export function labelDisabledSource(): string {
  return jsxSnippet(
    IMPORT_FIELD,
    `${COLUMN}
  <Label htmlFor="cpf">CPF</Label>
  <Input id="cpf" className="nds-peer" placeholder="000.000.000-00" disabled />
</div>`,
  );
}

/**
 * Bloco inteiro desabilitado: `data-disabled="true"` num ancestral apaga todos
 * os rótulos descendentes de uma vez. É o caminho para um fieldset inteiro —
 * repetir `nds-peer` campo a campo dá o mesmo desenho e esquece um.
 */
export function blockLabelDisabledSource(): string {
  return jsxSnippet(
    IMPORT_FIELD,
    `<div
  className="nds-stack nds-w-xs"
  data-spacing="xs"
  data-disabled="true"
>
  <Label htmlFor="documento">Documento</Label>
  <Input id="documento" placeholder="ex: 000.000.000-00" disabled />
</div>`,
  );
}

/**
 * Campo obrigatório. As duas metades são necessárias e fazem coisas
 * diferentes: o asterisco é pintura e sai da árvore de acessibilidade
 * (`aria-hidden`), e quem anuncia a obrigatoriedade é o `aria-required` do
 * CONTROLE. Só o asterisco deixaria o leitor de tela sem a informação; só o
 * `aria-required` deixaria a tela sem o aviso.
 */
export function labelObrigatorioSource(): string {
  return jsxSnippet(
    IMPORT_FIELD,
    `${COLUMN}
  <Label htmlFor="email-profissional">
    Email profissional
    <span className="nds-text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input
    id="email-profissional"
    type="email"
    aria-required="true"
    placeholder="ex: joao@empresa.com"
  />
</div>`,
  );
}

/**
 * Com caixa de seleção: o par vira linha, e não coluna, porque o controle é do
 * tamanho do texto. `htmlFor` continua sendo o que entrega o alcance de clique
 * — sem ele, só o quadradinho recebe o toque.
 */
export function labelWithCheckboxSource(): string {
  return jsxSnippet(
    `import { Checkbox } from "@/components/ui/checkbox";
${IMPORT_LABEL}`,
    `<div className="nds-cluster" data-spacing="sm">
  <Checkbox id="termos" />
  <Label htmlFor="termos">Concordo com os termos de uso</Label>
</div>`,
  );
}
