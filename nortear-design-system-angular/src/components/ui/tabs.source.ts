/**
 * Transform do painel Code do Tabs.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é isto que põe
 * o construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, e o que o leitor
 * copia ficaria sem portão nenhum.
 *
 * O que o snippet ensina: gatilho e painel se casam pelo mesmo `value`, e a
 * lista precisa de `aria-label` — sem nome, a barra de abas não se distingue de
 * qualquer outro grupo de botões para quem navega por leitor de tela.
 */
import type { TabsActivationMode, TabsListVariant, TabsOrientation } from './tabs';

export type TabsArgs = {
  orientation: TabsOrientation;
  variant: TabsListVariant;
  activationMode: TabsActivationMode;
  onValueChange: (value: string) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args (`[orientation]="orientation"`). Isso é o andaime da
 * story, não o que alguém escreve para usar Tabs. O `transform` devolve o uso
 * real, com os valores atuais dos controls já resolvidos (ver a nota em
 * `separator.source.ts`).
 */
export function tabsPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<TabsArgs> } = {},
): string {
  const {
    orientation = 'horizontal',
    variant = 'default',
    activationMode = 'automatic',
  } = ctx.args ?? {};

  // Só o que difere do default entra: snippet que repete valor padrão ensina
  // ruído a quem copia.
  const root = ['ndsTabs', 'defaultValue="overview"']
    .concat(orientation === 'horizontal' ? [] : [`orientation="${orientation}"`])
    .join(' ');
  const list = ['ndsTabsList', 'aria-label="Seções do componente"']
    .concat(variant === 'default' ? [] : [`variant="${variant}"`])
    .concat(activationMode === 'automatic' ? [] : [`activationMode="${activationMode}"`])
    .join(' ');

  return `import {
  NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent,
} from '@/components/ui/tabs';

@Component({
  imports: [NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent],
  template: \`
    <div ${root}>
      <div ${list}>
        <button ndsTabsTrigger value="overview">Visão geral</button>
        <button ndsTabsTrigger value="properties">Propriedades</button>
        <button ndsTabsTrigger value="examples">Exemplos</button>
      </div>
      <div ndsTabsContent value="overview">Conteúdo da visão geral</div>
      <div ndsTabsContent value="properties">Lista de propriedades</div>
      <div ndsTabsContent value="examples">Exemplos de uso</div>
    </div>
  \`,
})
export class Exemplo {}`;
}
