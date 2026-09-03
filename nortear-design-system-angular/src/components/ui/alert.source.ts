/**
 * Transform do painel Code do Alert.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é a ANATOMIA completa do alerta — ícone, título e
 * descrição, cada um na sua diretiva —, e que só o que difere do padrão aparece
 * escrito: `variant` e `role` somem quando estão no default, porque snippet que
 * repete valor padrão ensina ruído a quem copia.
 */
import type { AlertVariant, AlertRole } from './alert';

export type AlertArgs = {
  variant: AlertVariant;
  role: AlertRole;
  dismissible: boolean;
  dismissLabel: string;
  title: string;
  description: string;
  onDismiss?: () => void;
};

/**
 * Ver a nota em separator.stories.ts: o painel Code imprime o `template` da
 * story literalmente, com os bindings ligados aos controls. O `transform`
 * devolve o uso real, com os valores atuais — que é o que se copia.
 */
export function alertPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<AlertArgs> } = {},
): string {
  const {
    variant = 'default',
    role = 'alert',
    dismissible = false,
    title = 'Atenção',
    description = 'Suas alterações serão aplicadas na próxima sessão.',
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet — documentação que repete
  // valor padrão ensina ruído.
  const attrs = [
    variant === 'default' ? '' : `variant="${variant}"`,
    role === 'alert' ? '' : `role="${role}"`,
    dismissible ? 'dismissible (dismiss)="aoFechar()"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const abre = attrs ? `<div ndsAlert ${attrs}>` : '<div ndsAlert>';

  return `import {
  NdsAlert, NdsAlertTitle, NdsAlertDescription, NdsAlertIcon,
} from '@/components/ui/alert';

@Component({
  imports: [NdsAlert, NdsAlertTitle, NdsAlertDescription, NdsAlertIcon],
  template: \`
    ${abre}
      <svg ndsAlertIcon kind="info"></svg>
      <h5 ndsAlertTitle>${title}</h5>
      <section ndsAlertDescription>${description}</section>
    </div>
  \`,
})
export class Exemplo {}`;
}
