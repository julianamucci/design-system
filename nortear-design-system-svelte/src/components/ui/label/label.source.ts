/**
 * Transforms do painel Code do Label.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 *
 * Todo snippet traz o controle junto: o rótulo existe para nomear um campo, e
 * um `<Label>` solto no painel ensinaria a metade que não serve para nada.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type LabelArgs = {
  class: string;
  required: boolean;
};

const IMPORT = `import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";`;

/**
 * Elemento auto-fechado: atributos em fila enquanto couberem, um por linha
 * depois. `indentacao` é a coluna do próprio elemento na marcação.
 */
function elemento(
  name: string,
  partes: Array<string | false | null | undefined>,
  indentacao = '',
): string {
  const props = attrsMultilinha(partes, `${indentacao}  `, 68);
  return props.startsWith('\n') ? `<${name}${props}${indentacao}/>` : `<${name}${props} />`;
}

/** Forma canônica: rótulo associado ao campo por `for`/`id`. Serve o Playground. */
export function labelSource(_gerado?: string, ctx?: { args?: Partial<LabelArgs> }): string {
  const { class: className = '', required = false } = ctx?.args ?? {};
  const aberturaLabel = `<Label for="nome"${className ? ` class="${className}"` : ''}>`;

  const label = required
    ? `  ${aberturaLabel}
    Nome completo
    <span class="nds-text-destructive" aria-hidden="true">*</span>
  </Label>`
    : `  ${aberturaLabel}Nome completo</Label>`;

  const field = elemento(
    'Input',
    [
      'id="nome"',
      'type="text"',
      required ? 'aria-required="true"' : '',
      'placeholder="ex: João da Silva"',
    ],
    '  ',
  );

  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
${label}
  ${field}
</div>`,
  );
}

/**
 * Campo obrigatório: o asterisco é decorativo e a obrigatoriedade é anunciada
 * pelo controle. Serve a story de estado e a de composição, que ensinam o mesmo.
 */
export function labelObrigatorioSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
  <Label for="email">
    Email profissional
    <span class="nds-text-destructive" aria-hidden="true">*</span>
  </Label>
  <Input
    id="email"
    type="email"
    aria-required="true"
    placeholder="ex: joao@empresa.com"
  />
</div>`,
  );
}

/** Desabilitado pelo controle irmão: o rótulo não recebe prop nenhuma. */
export function labelDisabledSiblingSource(): string {
  return svelteSnippet(
    IMPORT,
    `<!-- A marca nds-peer vai no CONTROLE e o rótulo vem depois dele: o
     esmaecimento chega por seletor de irmão, não por prop. -->
<div class="nds-stack" data-spacing="xs">
  <Input id="cpf" class="nds-peer" placeholder="000.000.000-00" disabled />
  <Label for="cpf">CPF</Label>
</div>`,
  );
}

/** Desabilitado pelo bloco: um ancestral marcado esmaece rótulo e campo juntos. */
export function blockLabelDisabledSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs" data-disabled="true">
  <Label for="documento">Documento</Label>
  <Input id="documento" placeholder="ex: 000.000.000-00" disabled />
</div>`,
  );
}

/** Composição com campo de texto: clicar no rótulo leva o foco ao campo. */
export function labelWithFieldSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
  <Label for="telefone">Telefone</Label>
  <Input id="telefone" type="tel" placeholder="(11) 99999-9999" />
</div>`,
  );
}

/** Composição com caixa de seleção: o rótulo vira alvo de clique e nome acessível. */
export function labelWithBoxSource(): string {
  return svelteSnippet(
    `import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";`,
    `<div class="nds-cluster" data-spacing="sm">
  <Checkbox id="termos" />
  <Label for="termos">Concordo com os termos de uso</Label>
</div>`,
  );
}
