/**
 * Transform do painel Code do Card.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina é a composição do card por PARTES — header, title,
 * description, action, content, footer —, cada uma com a sua diretiva. As
 * partes opcionais entram só quando pedidas, e com elas entra também o import
 * do Button: a lista de imports do `@Component` acompanha o que o template usa,
 * que é justamente o que quem copia precisa acertar.
 */
import type { CardSize } from './card';

export type CardArgs = {
  size: CardSize;
  title: string;
  description: string;
  content: string;
  withFooter: boolean;
  withAction: boolean;
};

/**
 * Ver a nota em separator.stories.ts. Aqui o andaime é maior: o template tem
 * dois `@if` (rodapé e ação) e cinco bindings de arg. O transform devolve o
 * uso real, com as partes que os controls ligaram.
 */
export function cardPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<CardArgs> } = {},
): string {
  const {
    size = 'default',
    title = 'Cadeira Gamer Pro',
    description = 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
    content = 'R$ 1.299,00',
    withFooter = true,
    withAction = false,
  } = ctx.args ?? {};

  const sizeAttr = size === 'default' ? '' : ` size="${size}"`;
  const acao = withAction
    ? `
      <div ndsCardAction>
        <button ndsButton variant="ghost" size="sm" aria-label="Editar produto ${title}">Editar</button>
      </div>`
    : '';
  const footer = withFooter
    ? `
    <div ndsCardFooter class="nds-cluster" data-justify="end" data-spacing="md">
      <button ndsButton variant="outline" aria-label="Editar produto ${title}">Editar</button>
      <button ndsButton variant="destructive" aria-label="Excluir produto ${title}">Excluir</button>
    </div>`
    : '';

  const usaButton = withAction || withFooter;
  const imports = usaButton ? 'NDS_CARD, NdsButton' : 'NDS_CARD';

  return `import { NDS_CARD } from '@/components/ui/card';${
    usaButton ? `\nimport { NdsButton } from '@/components/ui/button';` : ''
  }

@Component({
  imports: [${imports}],
  template: \`
    <div ndsCard${sizeAttr}>
      <div ndsCardHeader>
        <h3 ndsCardTitle>${title}</h3>
        <p ndsCardDescription>${description}</p>${acao}
      </div>
      <div ndsCardContent>${content}</div>${footer}
    </div>
  \`,
})
export class Exemplo {}`;
}
