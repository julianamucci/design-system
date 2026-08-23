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
  value: string;
  label: string;
  content: string;
  desabilitada?: boolean;
};

type Composition = {
  abas: Aba[];
  /** Aba ativa na montagem — é o valor inicial do `$state`. */
  ativa: string;
  rotuloLista: string;
  variant?: 'line';
  orientacao?: 'vertical';
  ativacao?: 'manual';
};

const IMPORT = `import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";`;

const ABAS_DEFAULT: Aba[] = [
  { value: 'overview', label: 'Visão geral', content: 'Conteúdo da visão geral' },
  { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades' },
  { value: 'examples', label: 'Exemplos', content: 'Exemplos de uso' },
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
  variant,
  orientacao,
  ativacao,
}: Composition): string {
  const root = attrs(
    'bind:value',
    orientacao ? `orientation="${orientacao}"` : '',
    ativacao ? `activationMode="${ativacao}"` : '',
    'class="nds-max-w-lg"',
  );
  const list = attrs(
    variant ? `variant="${variant}"` : '',
    `aria-label="${rotuloLista}"`,
  );

  const triggers = abas
    .map(
      (aba) =>
        `    <TabsTrigger value="${aba.value}"${aba.desabilitada ? ' disabled' : ''}>${aba.label}</TabsTrigger>`,
    )
    .join('\n');

  const panels = abas
    .map((aba) => `  <TabsContent value="${aba.value}">${aba.content}</TabsContent>`)
    .join('\n');

  return svelteSnippet(
    `${IMPORT}

let value = $state("${ativa}");`,
    `<Tabs${root}>
  <TabsList${list}>
${triggers}
  </TabsList>
${panels}
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
    abas: ABAS_DEFAULT,
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
      { value: 'overview', label: 'Visão geral', content: 'Conteúdo da visão geral.' },
      { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.' },
      { value: 'examples', label: 'Exemplos', content: 'Exemplos de uso.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
    variant: 'line',
  });
}

/** Orientação vertical: lista à esquerda, painel à direita, setas de cima e baixo. */
export function tabsVerticalSource(): string {
  return montar({
    abas: [
      { value: 'overview', label: 'Visão geral', content: 'Conteúdo da visão geral.' },
      { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.' },
      { value: 'examples', label: 'Exemplos', content: 'Exemplos de uso.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
    orientacao: 'vertical',
  });
}

/** Estado inativo: quem decide a aba ativa na montagem é o valor inicial. */
export function tabsAbaInitialSource(): string {
  return montar({
    abas: [
      { value: 'overview', label: 'Visão geral', content: 'Conteúdo da visão geral.' },
      { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.' },
      { value: 'examples', label: 'Exemplos', content: 'Exemplos de uso.' },
    ],
    ativa: 'properties',
    rotuloLista: 'Seções do componente',
  });
}

/** Estado desabilitado: a aba continua alcançável pela seta e não ativa. */
export function tabsDesabilitadaSource(): string {
  return montar({
    abas: [
      { value: 'overview', label: 'Visão geral', content: 'Conteúdo da visão geral.' },
      {
        value: 'properties',
        label: 'Propriedades',
        content: 'Lista de propriedades.',
        desabilitada: true,
      },
      { value: 'examples', label: 'Exemplos', content: 'Exemplos de uso.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
  });
}

/** Composição de configurações: seções paralelas com nome próprio na fileira. */
export function tabsConfigSource(): string {
  return montar({
    abas: [
      {
        value: 'profile',
        label: 'Perfil',
        content: 'Edite suas informações pessoais e foto de perfil.',
      },
      {
        value: 'account',
        label: 'Conta',
        content: 'Gerencie email, senha e preferências de notificação.',
      },
      {
        value: 'security',
        label: 'Segurança',
        content: 'Autenticação de dois fatores e sessões ativas.',
      },
    ],
    ativa: 'profile',
    rotuloLista: 'Configurações',
  });
}

/** Composição preview/código: duas abas na variante sem trilho. */
export function tabsPreviewCodeSource(): string {
  return montar({
    abas: [
      {
        value: 'preview',
        label: 'Preview',
        content: 'Visualização renderizada do componente.',
      },
      // Expressão, e não marcação solta: dentro do painel o trecho é TEXTO de
      // exemplo — escrito como tag ele viraria um componente de verdade.
      { value: 'code', label: 'Código', content: '{"<Button>Click me</Button>"}' },
    ],
    ativa: 'preview',
    rotuloLista: 'Modos de visualização',
    variant: 'line',
  });
}

/** Composição de navegação lateral: quatro seções no eixo vertical. */
export function tabsNavigationVerticalSource(): string {
  return montar({
    abas: [
      { value: 'overview', label: 'Visão geral', content: 'Resumo executivo do projeto.' },
      {
        value: 'properties',
        label: 'Propriedades',
        content: 'Lista completa de propriedades.',
      },
      { value: 'examples', label: 'Exemplos', content: 'Exemplos práticos de uso.' },
      { value: 'api', label: 'API', content: 'Referência completa da API.' },
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
      { value: 'overview', label: 'Visão geral', content: 'Conteúdo da visão geral.' },
      { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.' },
      { value: 'examples', label: 'Exemplos', content: 'Exemplos de uso.' },
    ],
    ativa: 'overview',
    rotuloLista: 'Seções do componente',
    ativacao: 'manual',
  });
}
