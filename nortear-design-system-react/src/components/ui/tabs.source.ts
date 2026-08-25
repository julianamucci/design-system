/**
 * Transforms do painel Code do Tabs.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta é andaime e não entra no snippet: a `key` de
 * remontagem do Playground (só existe porque mexer no control de `defaultValue`
 * não remonta o componente sozinho), o teto de largura que emoldura o canvas do
 * Storybook, o pequeno componente local que as stories de estado reaproveitam
 * para variar uma aba desabilitada e o parágrafo que imprime o estado externo.
 *
 * A decisão de composição: o snippet mostra SEMPRE o padrão inteiro — raiz,
 * lista nomeada e um painel por aba. Um `TabsTrigger` avulso não é uso real de
 * abas; e a lista sem `aria-label` deixa o leitor de tela anunciar apenas
 * "lista de abas", sem dizer de que seção ela trata. Cada `TabsContent` casa
 * pelo `value` com o gatilho — é esse par que a lib usa para escrever
 * `aria-controls` e `aria-labelledby`.
 */
import { attrs, jsxSnippet, propOption, text, type SourceTransform } from '@/lib/story-source';

export type TabsArgs = {
  orientation: 'horizontal' | 'vertical';
  defaultValue: string;
};

const ORIENTACOES = ['horizontal', 'vertical'] as const;

const IMPORT_TABS =
  'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";';

/**
 * Aba canônica das stories: valor, rótulo, conteúdo do painel e — só onde a
 * composição varia — um trecho extra de atributo no gatilho.
 */
type Aba = [value: string, label: string, content: string, extra?: string];

const SECTIONS: Aba[] = [
  ['overview', 'Visão geral', 'Conteúdo da visão geral.'],
  ['properties', 'Propriedades', 'Lista de propriedades.'],
  ['examples', 'Exemplos', 'Exemplos de uso.'],
];

/**
 * Monta o padrão inteiro. Os gatilhos aceitam um trecho extra (ícone, badge,
 * `disabled`) porque é dentro deles que as composições variam — a estrutura em
 * volta é a mesma em todas.
 */
function abas(
  root: string,
  list: string,
  items: Aba[],
  rotuloDaLista = 'Seções do componente',
): string {
  const triggers = items
    .map(([value, label, , extra]) => {
      const abertura = extra
        ? `<TabsTrigger value="${value}" ${extra}>`
        : `<TabsTrigger value="${value}">`;
      return `    ${abertura}${label}</TabsTrigger>`;
    })
    .join('\n');
  const panels = items
    .map(([value, , content]) => `  <TabsContent value="${value}">${content}</TabsContent>`)
    .join('\n');

  return `<Tabs${root}>
  <TabsList aria-label="${rotuloDaLista}"${list}>
${triggers}
  </TabsList>
${panels}
</Tabs>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no padrão do componente, que é a
 * fileira horizontal com a primeira aba ativa.
 *
 * `defaultValue` entra SEMPRE, mesmo igual ao primeiro valor: sem ele nenhuma
 * aba nasce ativa, e o componente abre mostrando só a fileira — o oposto do que
 * a story ensina.
 */
export const tabsSource: SourceTransform<TabsArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const root = attrs(
    propOption('orientation', args.orientation, ORIENTACOES, 'horizontal'),
    `defaultValue="${text(args.defaultValue) ?? SECTIONS[0][0]}"`,
  );
  return jsxSnippet(IMPORT_TABS, abas(root, '', SECTIONS));
};

/**
 * Variante de linha. O estilo mora na LISTA, não na raiz: é a fileira que troca
 * o trilho com fundo por um traço sob a aba ativa, e os painéis não mudam nada.
 */
export function tabsLineSource(): string {
  return jsxSnippet(IMPORT_TABS, abas(' defaultValue="overview"', ' variant="line"', SECTIONS));
}

/**
 * Eixo vertical. `orientation` não é só layout: é ela que passa a navegação
 * para as setas de cima e de baixo e escreve `aria-orientation` na lista.
 * Escrever apenas o `data-orientation` deixaria a tela certa e o teclado errado.
 */
export function tabsVerticalSource(): string {
  return jsxSnippet(
    IMPORT_TABS,
    abas(' orientation="vertical" defaultValue="overview"', '', SECTIONS),
  );
}

/**
 * Aba indisponível. `disabled` vai no gatilho, e o primitivo o traduz para
 * `aria-disabled` — nunca para o atributo nativo, que tiraria a aba do alcance
 * do foco e faria a pessoa nunca descobrir que ela existe.
 */
export function tabsAbaDesabilitadaSource(): string {
  return jsxSnippet(
    IMPORT_TABS,
    abas(' defaultValue="overview"', '', [
      SECTIONS[0],
      ['properties', 'Propriedades', 'Lista de propriedades.', 'disabled'],
      SECTIONS[2],
    ]),
  );
}

/**
 * Ícone antes do rótulo. O texto continua nomeando a aba e o desenho fica
 * escondido do leitor de tela: anunciar os dois diria a mesma coisa duas vezes.
 */
export function tabsWithIconsSource(): string {
  const count: Array<[string, string, string, string]> = [
    ['profile', 'Perfil', 'Dados do perfil.', 'User'],
    ['account', 'Conta', 'Configurações da conta.', 'Settings'],
    ['security', 'Segurança', 'Configurações de segurança.', 'Shield'],
  ];
  const triggers = count
    .map(
      ([value, label, , icone]) => `    <TabsTrigger value="${value}">
      <${icone} aria-hidden="true" />
      ${label}
    </TabsTrigger>`,
    )
    .join('\n');
  const panels = count
    .map(([value, , content]) => `  <TabsContent value="${value}">${content}</TabsContent>`)
    .join('\n');

  return jsxSnippet(
    `${IMPORT_TABS}
import { Settings, Shield, User } from "lucide-react";`,
    `<Tabs defaultValue="profile">
  <TabsList aria-label="Configurações da conta">
${triggers}
  </TabsList>
${panels}
</Tabs>`,
  );
}

/**
 * Contagem no gatilho. O badge fica DENTRO do botão de propósito: a contagem
 * faz parte do que a aba significa ("Inbox, 12") e é lida junto com o rótulo.
 * Fora dele viraria um segundo alvo de foco entre duas abas.
 */
export function tabsWithBadgeSource(): string {
  return jsxSnippet(
    `${IMPORT_TABS}
import { Badge } from "@/components/ui/badge";`,
    `<Tabs defaultValue="overview">
  <TabsList aria-label="Painel do projeto">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="inbox">
      Inbox
      <Badge variant="info">12</Badge>
    </TabsTrigger>
    <TabsTrigger value="archived">Arquivados</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Resumo do projeto.</TabsContent>
  <TabsContent value="inbox">12 itens novos.</TabsContent>
  <TabsContent value="archived">Itens arquivados.</TabsContent>
</Tabs>`,
  );
}

/**
 * Modo controlado. A aba ativa passa a viver fora do componente, que só avisa a
 * mudança — é o que permite sincronizar a aba com a URL ou com analytics. O par
 * `value` + callback substitui `defaultValue`: os dois juntos brigariam pelo
 * mesmo estado.
 */
export function tabsControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT_TABS}`,
    `const [secao, setSecao] = useState("overview");

${abas(' value={secao} onValueChange={setSecao}', '', SECTIONS)}`,
  );
}

/**
 * Ativação manual. Com ela a seta apenas move o foco e a troca só acontece no
 * Enter ou no Space — o que vale quando cada painel custa uma requisição, já
 * que percorrer a fileira com a seta dispararia todas elas.
 */
export function tabsAtivacaoManualSource(): string {
  return jsxSnippet(
    IMPORT_TABS,
    abas(' defaultValue="overview"', ' activationMode="manual"', SECTIONS),
  );
}
