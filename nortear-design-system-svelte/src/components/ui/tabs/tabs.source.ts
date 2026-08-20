/**
 * Transforms do painel Code do Tabs.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * A função canônica veio do `playgroundSource` que morava em `tabs.stories.ts`;
 * o conteúdo do snippet é o mesmo, só saiu de dentro do arquivo de story para
 * poder ser testado e reaproveitado pelos outros arquivos.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type TabsArgs = {
  orientation: 'horizontal' | 'vertical';
  activationMode: 'automatic' | 'manual';
};

type Aba = {
  valor: string;
  rotulo: string;
  conteudo: string;
  desabilitada?: boolean;
};

type Composicao = {
  abas: Aba[];
  /** Aba ativa na montagem — é o valor inicial do `$state`. */
  ativa: string;
  rotuloLista: string;
  variante?: 'line';
  orientacao?: 'vertical';
  ativacao?: 'manual';
};

const IMPORT = `import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";`;

const ABAS_PADRAO: Aba[] = [
  { valor: 'overview', rotulo: 'Visão geral', conteudo: 'Conteúdo da visão geral' },
  { valor: 'properties', rotulo: 'Propriedades', conteudo: 'Lista de propriedades' },
  { valor: 'examples', rotulo: 'Exemplos', conteudo: 'Exemplos de uso' },
];

/**
 * Monta a composição inteira: raiz com o valor ligado, fileira nomeada e um
 * painel por aba. Só o que difere do padrão vira atributo — `variant="default"`,
 * `orientation="horizontal"` e `activationMode="automatic"` ficam de fora.
 */
function montar({
  abas,
  ativa,
  rotuloLista,
  variante,
  orientacao,
  ativacao,
}: Composicao): string {
  const raiz = attrs(
    'bind:value',
    orientacao ? `orientation="${orientacao}"` : '',
    ativacao ? `activationMode="${ativacao}"` : '',
    'class="nds-max-w-lg"',
  );
  const lista = attrs(
    variante ? `variant="${variante}"` : '',
    `aria-label="${rotuloLista}"`,
  );

  const gatilhos = abas
    .map(
      (aba) =>
        `    <TabsTrigger value="${aba.valor}"${aba.desabilitada ? ' disabled' : ''}>${aba.rotulo}</TabsTrigger>`,
    )
    .join('\n');

  const paineis = abas
    .map((aba) => `  <TabsContent value="${aba.valor}">${aba.conteudo}</TabsContent>`)
    .join('\n');

  return svelteSnippet(
    `${IMPORT}

let value = $state("${ativa}");`,
    `<Tabs${raiz}>
  <TabsList${lista}>
${gatilhos}
  </TabsList>
${paineis}
</Tabs>`,
  );
}

/**
 * Forma canônica: três abas com ativação automática. Serve o Playground de
 * `tabs.stories.ts` e cascateia para as stories sem composição própria
 * (Variants/Default, States/Active, States/FocusVisible).
 *
 * `transform` e não `code`: um snippet fixo deixaria de acompanhar os controls —
 * trocar a orientação não mudaria nada na caixa de código.
 */
export function tabsSource(_gerado?: string, ctx?: { args?: Partial<TabsArgs> }): string {
  const { orientation = 'horizontal', activationMode = 'automatic' } = ctx?.args ?? {};

  return montar({
    abas: ABAS_PADRAO,
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
    orientacao: orientation === 'vertical' ? 'vertical' : undefined,
    ativacao: activationMode === 'manual' ? 'manual' : undefined,
  });
}

/** Variante line: fileira sem trilho, com a linha sob a aba ativa. */
export function tabsLineSource(): string {
  return montar({
    abas: [
      { valor: 'overview', rotulo: 'Visão geral', conteudo: 'Conteúdo da visão geral.' },
      { valor: 'properties', rotulo: 'Propriedades', conteudo: 'Lista de propriedades.' },
      { valor: 'examples', rotulo: 'Exemplos', conteudo: 'Exemplos de uso.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
    variante: 'line',
  });
}

/** Orientação vertical: lista à esquerda, painel à direita, setas de cima e baixo. */
export function tabsVerticalSource(): string {
  return montar({
    abas: [
      { valor: 'overview', rotulo: 'Visão geral', conteudo: 'Conteúdo da visão geral.' },
      { valor: 'properties', rotulo: 'Propriedades', conteudo: 'Lista de propriedades.' },
      { valor: 'examples', rotulo: 'Exemplos', conteudo: 'Exemplos de uso.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
    orientacao: 'vertical',
  });
}

/** Estado inativo: quem decide a aba ativa na montagem é o valor inicial. */
export function tabsAbaInicialSource(): string {
  return montar({
    abas: [
      { valor: 'overview', rotulo: 'Visão geral', conteudo: 'Conteúdo da visão geral.' },
      { valor: 'properties', rotulo: 'Propriedades', conteudo: 'Lista de propriedades.' },
      { valor: 'examples', rotulo: 'Exemplos', conteudo: 'Exemplos de uso.' },
    ],
    ativa: 'properties',
    rotuloLista: 'Seções do componente',
  });
}

/** Estado desabilitado: a aba continua alcançável pela seta e não ativa. */
export function tabsDesabilitadaSource(): string {
  return montar({
    abas: [
      { valor: 'overview', rotulo: 'Visão geral', conteudo: 'Conteúdo da visão geral.' },
      {
        valor: 'properties',
        rotulo: 'Propriedades',
        conteudo: 'Lista de propriedades.',
        desabilitada: true,
      },
      { valor: 'examples', rotulo: 'Exemplos', conteudo: 'Exemplos de uso.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
  });
}

/** Composição de configurações: seções paralelas com nome próprio na fileira. */
export function tabsConfiguracoesSource(): string {
  return montar({
    abas: [
      {
        valor: 'profile',
        rotulo: 'Perfil',
        conteudo: 'Edite suas informações pessoais e foto de perfil.',
      },
      {
        valor: 'account',
        rotulo: 'Conta',
        conteudo: 'Gerencie email, senha e preferências de notificação.',
      },
      {
        valor: 'security',
        rotulo: 'Segurança',
        conteudo: 'Autenticação de dois fatores e sessões ativas.',
      },
    ],
    ativa: 'profile',
    rotuloLista: 'Configurações',
  });
}

/** Composição preview/código: duas abas na variante sem trilho. */
export function tabsPreviewCodigoSource(): string {
  return montar({
    abas: [
      {
        valor: 'preview',
        rotulo: 'Preview',
        conteudo: 'Visualização renderizada do componente.',
      },
      // Expressão, e não marcação solta: dentro do painel o trecho é TEXTO de
      // exemplo — escrito como tag ele viraria um componente de verdade.
      { valor: 'code', rotulo: 'Código', conteudo: '{"<Button>Click me</Button>"}' },
    ],
    ativa: 'preview',
    rotuloLista: 'Modos de visualização',
    variante: 'line',
  });
}

/** Composição de navegação lateral: quatro seções no eixo vertical. */
export function tabsNavegacaoVerticalSource(): string {
  return montar({
    abas: [
      { valor: 'overview', rotulo: 'Visão geral', conteudo: 'Resumo executivo do projeto.' },
      {
        valor: 'properties',
        rotulo: 'Propriedades',
        conteudo: 'Lista completa de propriedades.',
      },
      { valor: 'examples', rotulo: 'Exemplos', conteudo: 'Exemplos práticos de uso.' },
      { valor: 'api', rotulo: 'API', conteudo: 'Referência completa da API.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Documentação',
    orientacao: 'vertical',
  });
}

/** Composição de ativação manual: a seta move o foco e Enter ou Espaço confirma. */
export function tabsAtivacaoManualSource(): string {
  return montar({
    abas: [
      { valor: 'overview', rotulo: 'Visão geral', conteudo: 'Conteúdo da visão geral.' },
      { valor: 'properties', rotulo: 'Propriedades', conteudo: 'Lista de propriedades.' },
      { valor: 'examples', rotulo: 'Exemplos', conteudo: 'Exemplos de uso.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
    ativacao: 'manual',
  });
}
