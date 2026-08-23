/**
 * Transforms do painel Code do Dialog.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * As stories montam abertas (`default-open`) porque o Chromatic fotografa o
 * estado final — isso é andaime da FOTO, não lição: um diálogo que se abre
 * sozinho ao carregar a página é justamente o que não se deve copiar. Só a
 * story cujo assunto É a montagem aberta escreve a prop no snippet.
 */
import { attrBool, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type DialogArgs = {
  defaultOpen: boolean;
  modal: boolean;
};

/** Ordem canônica das peças no bloco de import — a mesma do `index.ts`. */
const ORDER = [
  'Dialog',
  'DialogClose',
  'DialogContent',
  'DialogDescription',
  'DialogFooter',
  'DialogHeader',
  'DialogScrollContent',
  'DialogTitle',
  'DialogTrigger',
];

/**
 * Bloco de import: as peças do diálogo, depois o Button, que é sempre o gatilho
 * e sempre a ação. Campos entram só quando a composição tem formulário.
 */
function importing(parts: string[], comCampos = false): string {
  const usadas = ORDER.filter((part) => parts.includes(part));
  const lines = [
    `import {`,
    ...usadas.map((part) => `  ${part},`),
    `} from '@/components/ui/dialog'`,
    `import { Button } from '@/components/ui/button'`,
  ];
  if (comCampos) {
    lines.push(`import { Input } from '@/components/ui/input'`);
    lines.push(`import { Label } from '@/components/ui/label'`);
  }
  return lines.join('\n');
}

/**
 * A descrição quebra em três linhas quando é longa.
 *
 * Frase inteira numa linha só some na barra de rolagem do painel — e a descrição
 * é justamente o texto que explica o diálogo a quem usa leitor de tela.
 */
function descricao(frase: string): string {
  if (frase.length <= 70) {
    return `      <DialogDescription>${frase}</DialogDescription>`;
  }
  return `      <DialogDescription>
        ${frase}
      </DialogDescription>`;
}

type Frame = {
  /** Props da raiz: `default-open`, `:modal="false"`. */
  root?: string;
  /** `DialogContent` (centrado) ou `DialogScrollContent` (rola no overlay). */
  panel?: 'DialogContent' | 'DialogScrollContent';
  painelProps?: string;
  trigger: string;
  title: string;
  descricao: string;
  /** Miolo entre o cabeçalho e o rodapé, já indentado em 4 espaços. */
  body?: string;
  /** Rodapé completo, já indentado em 4 espaços. Vazio significa sem rodapé. */
  footer?: string;
};

/**
 * Estrutura comum: raiz, gatilho, painel, cabeçalho e — quando existem — corpo
 * e rodapé.
 *
 * `as-child` no gatilho não é enfeite: sem ele o design system renderizaria um
 * botão DENTRO de outro botão.
 */
function dialogo(m: Frame): string {
  const { root = '', panel = 'DialogContent', painelProps = '', body = '', footer = '' } = m;
  // Sem corpo e sem rodapé o painel é só cabeçalho: nada de linha em branco
  // sobrando entre o fim do cabeçalho e o fecho do painel.
  const partes = [body, footer].filter(Boolean);
  const miolo = partes.length ? `\n${partes.join('\n')}` : '';

  return `<Dialog${attrs(root)}>
  <DialogTrigger as-child>
    <Button variant="outline">${m.trigger}</Button>
  </DialogTrigger>
  <${panel}${attrs(painelProps)}>
    <DialogHeader>
      <DialogTitle>${m.title}</DialogTitle>
${descricao(m.descricao)}
    </DialogHeader>${miolo}
  </${panel}>
</Dialog>`;
}

/**
 * Rodapé canônico: a saída à esquerda, a ação primária por último no DOM.
 *
 * A ordem do DOM é a de leitura e a de foco; quem inverte a pilha no estreito é
 * o CSS do rodapé.
 */
function footerDefault(cancelar: string, acao: string, destrutiva = false): string {
  return `    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline">${cancelar}</Button>
      </DialogClose>
      <Button${destrutiva ? ' variant="destructive"' : ''}>${acao}</Button>
    </DialogFooter>`;
}

const PARTS_COMPLETAS = [
  'Dialog',
  'DialogClose',
  'DialogContent',
  'DialogDescription',
  'DialogFooter',
  'DialogHeader',
  'DialogTitle',
  'DialogTrigger',
];

/**
 * Forma canônica: cabeçalho com título e descrição, rodapé com saída e ação
 * primária.
 *
 * Serve o Playground e cascateia como padrão dos arquivos de variantes e de
 * estados — a composição de `Variants/Default` e a de `States/Closed` são
 * exatamente esta.
 */
export const dialogSource: SourceTransform<DialogArgs> = (_gerado, ctx) => {
  const { defaultOpen, modal } = ctx?.args ?? {};
  return vueSnippet(
    importing(PARTS_COMPLETAS),
    dialogo({
      // `.trim()` porque `dialogo` já reaplica o espaço da frente: sem ele a
      // tag sairia com dois espaços quando alguma prop entra.
      root: attrs(
        attrBool('default-open', defaultOpen, false),
        attrBool('modal', modal, true),
      ).trim(),
      trigger: 'Editar perfil',
      title: 'Editar perfil',
      descricao: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
      footer: footerDefault('Cancelar', 'Salvar alterações'),
    }),
  );
};

/**
 * Estado Open: a montagem já aberta, sem estado externo nenhum.
 *
 * Aqui `default-open` É o assunto — nas outras stories ela é só o que deixa o
 * Chromatic fotografar o painel.
 */
export function dialogOpenSource(): string {
  return vueSnippet(
    importing(PARTS_COMPLETAS),
    dialogo({
      root: 'default-open',
      trigger: 'Editar perfil',
      title: 'Editar perfil',
      descricao: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
      footer: footerDefault('Cancelar', 'Salvar alterações'),
    }),
  );
}

/**
 * Estado WithCloseButtonHidden: sem o X do canto.
 *
 * Escape e a saída do rodapé são o que resta — retirar todas de uma vez deixaria
 * o diálogo sem fechamento acessível.
 */
export function dialogNoButtonCloseSource(): string {
  return vueSnippet(
    importing(PARTS_COMPLETAS),
    dialogo({
      painelProps: ':show-close-button="false"',
      trigger: 'Ver atualização',
      title: 'Aceitar atualização',
      descricao: 'Uma nova versão está disponível. Clique em continuar para atualizar.',
      footer: footerDefault('Mais tarde', 'Atualizar agora'),
    }),
  );
}

/**
 * Estado Controlled: a abertura vem de fora.
 *
 * Não há gatilho: quem abre é um botão comum, e o diálogo segue o valor. O
 * evento é obrigatório no par — sem ele o painel fecharia por conta própria e o
 * estado de quem consome passaria a mentir.
 */
export function dialogControlledSource(): string {
  return vueSnippet(
    `${importing([
      'Dialog',
      'DialogClose',
      'DialogContent',
      'DialogDescription',
      'DialogFooter',
      'DialogHeader',
      'DialogTitle',
    ])}
import { ref } from 'vue'

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <Button @click="aberto = true">Abrir via estado externo</Button>
  <Dialog :open="aberto" @update:open="aberto = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Controlado pelo pai</DialogTitle>
        <DialogDescription>
          Este diálogo é comandado por estado externo: a prop de abertura entra, o evento volta.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button @click="aberto = false">Confirmar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>`,
  );
}

/**
 * Variante WithForm: formulário no corpo do painel.
 *
 * Cada campo mora num bloco com o próprio rótulo — é o `for`/`id` que liga os
 * dois, e sem ele o campo chega ao leitor sem nome.
 */
export function dialogWithFormSource(): string {
  return vueSnippet(
    importing(PARTS_COMPLETAS, true),
    dialogo({
      trigger: 'Editar perfil',
      title: 'Editar perfil',
      descricao: 'Atualize seu nome e email. As mudanças entram em vigor após salvar.',
      body: `    <form class="nds-grid" data-spacing="sm">
      <div class="nds-grid" data-spacing="xs">
        <Label for="dialog-name">Nome</Label>
        <Input id="dialog-name" default-value="Juliana Mucci" />
      </div>
      <div class="nds-grid" data-spacing="xs">
        <Label for="dialog-email">E-mail</Label>
        <Input id="dialog-email" type="email" default-value="juliana@example.com" />
      </div>
    </form>`,
      footer: `    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button type="submit">Salvar alterações</Button>
    </DialogFooter>`,
    }),
  );
}

/**
 * Variante WithScrollContent: conteúdo mais alto que a janela.
 *
 * O painel sai do centro fixo e entra no fluxo do overlay, que passa a ser quem
 * rola. O painel centralizado por posição fixa cortaria o que não coubesse, sem
 * barra de rolagem nenhuma. Cabeçalho e rodapé continuam dentro do painel.
 */
export function dialogWithScrollSource(): string {
  return vueSnippet(
    `${importing([
      'Dialog',
      'DialogClose',
      'DialogDescription',
      'DialogFooter',
      'DialogHeader',
      'DialogScrollContent',
      'DialogTitle',
      'DialogTrigger',
    ])}

const termos = [
  'Do objeto: os serviços são fornecidos no estado em que se encontram, e esta cláusula descreve o alcance de cada um deles.',
  'Do uso: a conta é pessoal e intransferível, e o acesso por terceiros depende de autorização registrada.',
  'Do encerramento: o cancelamento pode ser pedido a qualquer momento, e os dados ficam disponíveis por trinta dias.',
]`,
    dialogo({
      panel: 'DialogScrollContent',
      painelProps: 'class="nds-max-w-lg"',
      trigger: 'Ver termos',
      title: 'Termos de serviço',
      descricao: 'Leia atentamente os termos antes de aceitar.',
      body: `    <div class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">
      <p v-for="(clausula, i) in termos" :key="i">{{ clausula }}</p>
    </div>`,
      footer: footerDefault('Recusar', 'Aceitar termos'),
    }),
  );
}

/**
 * Variante NoFooter: painel informativo.
 *
 * Sem nada a confirmar, o rodapé some e o X do canto é a única saída visível —
 * por isso ele não pode ser escondido junto.
 */
export function dialogNoFooterSource(): string {
  return vueSnippet(
    importing([
      'Dialog',
      'DialogContent',
      'DialogDescription',
      'DialogHeader',
      'DialogTitle',
      'DialogTrigger',
    ]),
    dialogo({
      trigger: 'Ver detalhes do pedido',
      title: 'Detalhes do pedido #4287',
      descricao:
        'Pedido confirmado em 15 de março às 14:32. Entrega prevista para 20 de março via transportadora parceira.',
    }),
  );
}

/**
 * Variante WithDestructiveAction: a ação primária carrega a variante de perigo.
 *
 * Vale quando a destrutividade é secundária ao fluxo — remover um item de uma
 * lista, não apagar o recurso. Confirmação irreversível é outro componente.
 */
export function dialogActionDestructiveSource(): string {
  return vueSnippet(
    importing(PARTS_COMPLETAS),
    dialogo({
      trigger: 'Remover anexo',
      title: 'Remover anexo',
      descricao: 'O anexo será removido desta mensagem. Você pode adicioná-lo novamente depois.',
      footer: footerDefault('Cancelar', 'Remover anexo', true),
    }),
  );
}

/**
 * Variante CustomCloseInFooter: o fechar sai do canto e acompanha as ações.
 *
 * As duas props andam em par: esconder o X sem repor a saída no rodapé tiraria
 * do painel o único fechamento visível.
 */
export function footerDialogCloseSource(): string {
  return vueSnippet(
    importing([
      'Dialog',
      'DialogContent',
      'DialogDescription',
      'DialogFooter',
      'DialogHeader',
      'DialogTitle',
      'DialogTrigger',
    ]),
    dialogo({
      painelProps: ':show-close-button="false"',
      trigger: 'Configurar notificações',
      title: 'Configurações de notificação',
      descricao: 'Escolha como deseja ser avisado sobre novas atividades.',
      footer: `    <DialogFooter show-close-button>
      <Button>Salvar preferências</Button>
    </DialogFooter>`,
    }),
  );
}

/** Composição ConfirmEmail: confirmar a troca de e-mail, com um campo no corpo. */
export function dialogConfirmarEmailSource(): string {
  return vueSnippet(
    importing(PARTS_COMPLETAS, true),
    dialogo({
      trigger: 'Confirmar novo email',
      title: 'Confirmar novo email',
      descricao:
        'Enviaremos um link de confirmação para o novo endereço. O email atual continua ativo até a confirmação.',
      body: `    <div class="nds-grid" data-spacing="xs">
      <Label for="new-email">Novo email</Label>
      <Input id="new-email" type="email" placeholder="voce@example.com" />
    </div>`,
      // A operação é reversível, então a ação primária é neutra.
      footer: footerDefault('Cancelar', 'Enviar confirmação'),
    }),
  );
}

/** Composição ProfileEdit: formulário de perfil com três campos rotulados. */
export function dialogEditarPerfilSource(): string {
  return vueSnippet(
    importing(PARTS_COMPLETAS, true),
    dialogo({
      trigger: 'Editar perfil',
      title: 'Editar perfil',
      descricao: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
      body: `    <form class="nds-grid" data-spacing="sm">
      <div class="nds-grid" data-spacing="xs">
        <Label for="profile-name">Nome</Label>
        <Input id="profile-name" default-value="Juliana Mucci" />
      </div>
      <div class="nds-grid" data-spacing="xs">
        <Label for="profile-handle">Username</Label>
        <Input id="profile-handle" default-value="@julianamucci" />
      </div>
      <div class="nds-grid" data-spacing="xs">
        <Label for="profile-bio">Bio</Label>
        <Input id="profile-bio" default-value="Designer de sistemas em São Paulo" />
      </div>
    </form>`,
      footer: `    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button type="submit">Salvar alterações</Button>
    </DialogFooter>`,
    }),
  );
}

/**
 * Composição MediaPreview: mídia em destaque, sem rodapé.
 *
 * O bloco carrega a informação inteira do diálogo, então ele precisa de papel e
 * de nome: sem os dois, o conteúdo desaparece para quem usa leitor de tela.
 */
export function dialogPreviaDeMidiaSource(): string {
  return vueSnippet(
    importing([
      'Dialog',
      'DialogContent',
      'DialogDescription',
      'DialogHeader',
      'DialogTitle',
      'DialogTrigger',
    ]),
    dialogo({
      painelProps: 'class="nds-sm-max-w-md"',
      trigger: 'Pré-visualizar imagem',
      title: 'Pré-visualização da imagem',
      descricao: 'captura-de-tela.png · 1920×1080 · 248 KB',
      body: `    <div
      data-slot="dialog-body"
      role="img"
      aria-label="Imagem em destaque"
      class="nds-dialog-body nds-aspect-16-9 nds-w-full nds-rounded-md nds-border-default nds-bg-muted nds-cluster nds-text-caption nds-text-muted-foreground"
      data-align="center"
      data-justify="center"
    >
      Pré-visualização da mídia
    </div>`,
    }),
  );
}
