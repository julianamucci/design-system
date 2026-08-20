/**
 * Transforms do painel Code do Label.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O rótulo nunca aparece sozinho. Ele não é um texto com peso 500: é a metade
 * de um par, e o que ele produz — nome acessível, clique que leva o foco,
 * esmaecimento junto do controle — só existe COM o controle ao lado. Um snippet
 * com o `<Label>` isolado mostraria a única forma em que ele não faz nada.
 */
import { attr, attrs, comoCodigo, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type LabelArgs = {
  for: string;
  class: string;
};

const IMPORTS = `import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'`;

/** Moldura do exemplo e o respiro entre o rótulo e o controle. */
const MOLDURA = 'nds-stack nds-w-full nds-max-w-xs';

/** Bloco vertical: rótulo em cima, controle embaixo. */
function bloco(filhos: string[], moldura = MOLDURA, extra = ''): string {
  return `<div class="${moldura}"${attrs('data-spacing="xs"', extra)}>
${indentar(filhos.join('\n'))}
</div>`;
}

/**
 * Marcador visual de campo obrigatório.
 *
 * `aria-hidden` porque a obrigatoriedade quem anuncia é o `aria-required` do
 * controle: sem ele, o leitor de tela leria "Email profissional asterisco".
 */
const ASTERISCO = '<span class="nds-text-destructive" aria-hidden="true">*</span>';

/**
 * Forma canônica: o par rótulo + campo.
 *
 * `for` e `id` carregam o MESMO valor. É essa igualdade que faz o clique no
 * texto levar o foco ao campo e o leitor de tela anunciar um pelo outro — um
 * `for` apontando para id inexistente passa em qualquer checagem de atributo e
 * não associa nada.
 */
export const labelSource: SourceTransform<LabelArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const alvo = comoCodigo(args.for) ?? 'nome-completo';
  return vueSnippet(
    IMPORTS,
    bloco([
      `<Label${attrs(`for="${alvo}"`, attr('class', args.class))}>Nome completo</Label>`,
      `<Input id="${alvo}" type="text" placeholder="ex: João da Silva" />`,
    ]),
  );
};

/** Estado de repouso: opacidade cheia e contraste de texto normal. */
export function labelPadraoSource(): string {
  return vueSnippet(
    IMPORTS,
    bloco([
      '<Label for="nome-completo">Nome completo</Label>',
      '<Input id="nome-completo" type="text" placeholder="ex: João da Silva" />',
    ]),
  );
}

/**
 * Desabilitado pelo controle irmão.
 *
 * O rótulo não recebe prop nenhuma: quem o esmaece é a folha, a partir do
 * controle marcado com `nds-peer` que está desabilitado ao lado. Sem essa
 * classe no controle o campo apaga e o rótulo fica aceso, prometendo uma
 * interação que não existe.
 */
export function labelDesabilitadoSource(): string {
  return vueSnippet(
    IMPORTS,
    bloco([
      '<Label for="cpf">CPF</Label>',
      '<Input id="cpf" type="text" class="nds-peer" placeholder="000.000.000-00" disabled />',
    ]),
  );
}

/**
 * Desabilitado pelo bloco inteiro. `data-disabled` no contêiner alcança todos
 * os rótulos de dentro de uma vez — é o caminho para um grupo de campos que
 * some junto, sem marcar controle por controle.
 */
export function labelDesabilitadoPeloGrupoSource(): string {
  return vueSnippet(
    IMPORTS,
    bloco(
      [
        '<Label for="documento">Documento</Label>',
        '<Input id="documento" type="text" placeholder="ex: 000.000.000-00" disabled />',
      ],
      MOLDURA,
      'data-disabled="true"',
    ),
  );
}

/**
 * Campo obrigatório. O asterisco é decoração dentro do rótulo; quem anuncia a
 * obrigatoriedade é o `aria-required` do controle.
 */
export function labelObrigatorioSource(): string {
  return vueSnippet(
    IMPORTS,
    bloco([
      `<Label for="email-profissional">
  Email profissional
  ${ASTERISCO}
</Label>`,
      '<Input id="email-profissional" type="email" aria-required="true" placeholder="ex: joao@empresa.com" />',
    ]),
  );
}

/** O par com um campo de texto — a composição mais comum do rótulo. */
export function labelComCampoSource(): string {
  return vueSnippet(
    IMPORTS,
    bloco([
      '<Label for="telefone">Telefone</Label>',
      '<Input id="telefone" type="tel" placeholder="(11) 99999-9999" />',
    ]),
  );
}

/**
 * O par com uma caixa de seleção. Aqui a ordem se inverte — o controle vem
 * primeiro e o texto depois — e o bloco deita: é a forma que a caixa pede.
 *
 * O `for` continua sendo o que faz o clique no texto MARCAR a caixa e levar o
 * foco a ela. Vale só para controle rotulável; um `<div role="checkbox">` não
 * receberia nem o foco nem a marcação por esse caminho.
 */
export function labelComCaixaDeSelecaoSource(): string {
  return vueSnippet(
    `import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'`,
    `<div class="nds-cluster" data-spacing="sm">
  <Checkbox id="termos" />
  <Label for="termos">Concordo com os termos de uso</Label>
</div>`,
  );
}
