/**
 * Transforms do painel Code do Dialog.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O painel imprimia a árvore do `render`, que chama `useTranslation` para os
 * rótulos e `painel()` / `overlay()` / `gatilho()` do módulo de fixtures nas
 * plays. Nada disso é o Dialog: o texto é conteúdo de quem consome, e os
 * helpers são instrumentação de teste. Os snippets trazem o rótulo já resolvido
 * em português, que é o idioma em que o design system nasce.
 */
import { attrs, jsxSnippet, propBool, type SourceTransform } from '@/lib/story-source';

export type DialogArgs = {
  defaultOpen: boolean;
  modal: boolean;
};

const IMPORT_BASE = `import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";`;

const TITLE = 'Editar perfil';
const DESCRIPTION =
  'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.';

/**
 * Cabeçalho canônico: título E descrição.
 *
 * Os dois não são decoração — é deles que saem o `aria-labelledby` e o
 * `aria-describedby` do painel. Um diálogo sem descrição chega ao leitor de
 * tela como um nome solto, e a pessoa decide sem saber o que está decidindo.
 */
const HEADER = `    <DialogHeader>
      <DialogTitle>${TITLE}</DialogTitle>
      <DialogDescription>
        ${DESCRIPTION}
      </DialogDescription>
    </DialogHeader>`;

/**
 * Rodapé canônico: a ação primária é a ÚLTIMA do DOM.
 *
 * `column-reverse` a põe no topo da pilha no estreito e à direita no largo, mas
 * a ordem de leitura e de foco continua sendo a do markup — inverter aqui
 * mudaria o que o teclado alcança primeiro.
 */
const FOOTER = `    <DialogFooter>
      <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>`;

const TRIGGER = `  <DialogTrigger render={<Button variant="outline" />}>
    ${TITLE}
  </DialogTrigger>`;

function dialogSnippet(
  raizProps: string,
  contentProps: string,
  corpo: string,
  header = IMPORT_BASE,
  gatilho = TRIGGER,
): string {
  return jsxSnippet(
    header,
    `<Dialog${raizProps}>
${gatilho}
  <DialogContent${contentProps}>
${corpo}
  </DialogContent>
</Dialog>`,
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo.
 *
 * Ensina a composição padrão: gatilho, cabeçalho com nome e descrição, rodapé
 * com Cancelar e ação primária. `defaultOpen` e `modal` só aparecem quando
 * diferem do padrão do componente — repetir `modal` ensina ruído a quem copia.
 */
export const dialogSource: SourceTransform<DialogArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const raiz = attrs(
    propBool('defaultOpen', args.defaultOpen, false),
    propBool('modal', args.modal, true),
  );
  return dialogSnippet(raiz, '', `${HEADER}\n${FOOTER}`);
};

/**
 * Aberto na montagem: `defaultOpen` é o assunto da story.
 *
 * É o caminho NÃO controlado — quem abre e fecha é o próprio componente, e o
 * valor só diz por onde começar. Para abrir a partir de outro fluxo, o caminho
 * é `open` + `onOpenChange`.
 */
export function dialogOpenSource(): string {
  return dialogSnippet(' defaultOpen', '', `${HEADER}\n${FOOTER}`);
}

/**
 * Sem o X do canto: `showCloseButton={false}` no Content.
 *
 * Escape e o Cancelar do rodapé continuam fechando. Tirar as três saídas de uma
 * vez deixaria o diálogo sem fechamento acessível — por isso a prop mora no
 * Content, e não na raiz: ela esconde UM caminho, não todos.
 */
export function dialogNoButtonCloseSource(): string {
  return dialogSnippet(
    ' defaultOpen',
    ' showCloseButton={false}',
    `${HEADER}\n${FOOTER}`,
  );
}

/**
 * Fechar no rodapé: o X do canto sai do Content e o Footer acrescenta o botão.
 *
 * `showCloseButton` existe nos dois lugares e faz coisas diferentes — no
 * Content é o X do canto, no Footer é um botão rotulado, abaixo das ações.
 */
export function footerDialogCloseSource(): string {
  return dialogSnippet(
    ' defaultOpen',
    ' showCloseButton={false}',
    `${HEADER}
    <DialogFooter showCloseButton>
      <Button>Salvar alterações</Button>
    </DialogFooter>`,
  );
}

/**
 * Sem rodapé: a AUSÊNCIA é o assunto.
 *
 * Quando não há nada a confirmar, um rodapé com botão inventaria uma decisão.
 * O X do canto — que o Content traz por padrão — passa a ser a saída visível, e
 * é por isso que ele não pode ser escondido junto.
 */
export function dialogNoFooterSource(): string {
  return jsxSnippet(
    IMPORT_BASE.replace('  DialogClose,\n', '').replace('  DialogFooter,\n', ''),
    `<Dialog defaultOpen>
  <DialogTrigger render={<Button variant="outline" />}>
    Saiba mais
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sobre este recurso</DialogTitle>
      <DialogDescription>
        Este recurso permite visualizar detalhes do item selecionado sem sair da
        tela atual. Você pode fechar a qualquer momento.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`,
  );
}

/** Campos de formulário dentro do painel, com o rodapé DENTRO do `<form>`. */
function formulario(fields: Array<{ id: string; rotulo: string; valor: string; tipo?: string }>): string {
  const blocks = fields
    .map(
      ({ id, rotulo, valor, tipo }) => `      <div className="nds-stack" data-spacing="sm">
        <Label htmlFor="${id}">${rotulo}</Label>
        <Input id="${id}"${tipo ? ` type="${tipo}"` : ''} defaultValue="${valor}" />
      </div>`,
    )
    .join('\n');

  return `    <form
      className="nds-grid"
      data-spacing="md"
      onSubmit={(evento) => evento.preventDefault()}
    >
${blocks}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button type="submit">Salvar alterações</Button>
      </DialogFooter>
    </form>`;
}

const IMPORT_FORM = `${IMPORT_BASE}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`;

/**
 * Com formulário: o rodapé entra DENTRO do `<form>`.
 *
 * Fora dele o botão de envio deixa de submeter, e o Enter no campo também — o
 * par `form`/`submit` só existe quando os dois estão na mesma árvore. E o
 * Cancelar precisa de `type="button"`: dentro de um `<form>` o padrão do
 * navegador é `submit`, então o botão que deveria descartar passaria a enviar.
 */
export function dialogWithFormSource(): string {
  return jsxSnippet(
    IMPORT_FORM,
    `<Dialog defaultOpen>
${TRIGGER}
  <DialogContent>
${HEADER}
${formulario([
  { id: 'dialog-name', rotulo: 'Nome', valor: 'Maria Silva' },
  { id: 'dialog-email', rotulo: 'E-mail', valor: 'maria@exemplo.com', tipo: 'email' },
])}
  </DialogContent>
</Dialog>`,
  );
}

/**
 * Edição de perfil: mesma mecânica do formulário, com os campos do fluxo real.
 *
 * O `htmlFor`/`id` de cada par é o que dá nome acessível ao campo — sem ele o
 * leitor de tela anuncia "edição, em branco" e não diz de quê.
 */
export function dialogPerfilSource(): string {
  return jsxSnippet(
    IMPORT_FORM,
    `<Dialog defaultOpen>
${TRIGGER}
  <DialogContent className="nds-sm-max-w-md">
${HEADER}
${formulario([
  { id: 'profile-name', rotulo: 'Nome completo', valor: 'Maria Silva' },
  { id: 'profile-username', rotulo: 'Nome de usuário', valor: '@mariasilva' },
])}
  </DialogContent>
</Dialog>`,
  );
}

/**
 * Corpo com rolagem própria: `tabindex` e nome não são opcionais.
 *
 * Toda região que rola sozinha precisa entrar na ordem de tabulação — sem ela
 * quem navega só por teclado não consegue rolar a caixa — e precisa de nome,
 * porque `role="region"` sem nome não é anunciada como região nenhuma.
 */
export function dialogWithScrollSource(): string {
  return jsxSnippet(
    IMPORT_BASE,
    `<Dialog defaultOpen>
  <DialogTrigger render={<Button variant="outline" />}>Ver termos</DialogTrigger>
  <DialogContent className="nds-sm-max-w-md">
    <DialogHeader>
      <DialogTitle>Termos de uso</DialogTitle>
      <DialogDescription>
        Leia atentamente as condições antes de aceitar.
      </DialogDescription>
    </DialogHeader>
    <div
      tabIndex={0}
      role="region"
      aria-label="Conteúdo rolável"
      data-slot="dialog-body"
      className="nds-dialog-body nds-dialog-body-scroll nds-stack nds-text-body nds-text-muted-foreground"
      data-spacing="sm"
    >
      <p>Cláusula 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      <p>Cláusula 2. Sed do eiusmod tempor incididunt ut labore et dolore magna.</p>
      <p>Cláusula 3. Ut enim ad minim veniam, quis nostrud exercitation ullamco.</p>
    </div>
    <DialogFooter>
      <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
      <Button>Aceitar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
  );
}

/**
 * Ação primária destrutiva no rodapé.
 *
 * Vale só quando a destruição é secundária ao fluxo — remover de uma lista, não
 * apagar o recurso. Confirmação irreversível pede `role="alertdialog"`, foco
 * inicial no Cancelar e Cancelar obrigatório: é outro componente.
 */
export function dialogWithActionDestructiveSource(): string {
  return jsxSnippet(
    IMPORT_BASE,
    `<Dialog defaultOpen>
  <DialogTrigger render={<Button variant="outline" />}>Remover</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Remover item da lista</DialogTitle>
      <DialogDescription>
        O item será removido desta lista. Você pode adicioná-lo novamente depois.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
      <Button variant="destructive">Remover item</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
  );
}

/**
 * Mídia em destaque, sem rodapé.
 *
 * O bloco carrega a informação do diálogo, então precisa de `role="img"` e de
 * nome: sem os dois o conteúdo inteiro desaparece para quem usa leitor de tela.
 * As classes de moldura são as do sistema — o gradiente que morava aqui era
 * resíduo de outra era e renderizava transparente.
 */
export function dialogWithMidiaSource(): string {
  return jsxSnippet(
    IMPORT_BASE.replace('  DialogClose,\n', '').replace('  DialogFooter,\n', ''),
    `<Dialog defaultOpen>
  <DialogTrigger render={<Button variant="outline" />}>Ver imagem</DialogTrigger>
  <DialogContent className="nds-sm-max-w-lg">
    <DialogHeader>
      <DialogTitle>Pôr-do-sol na praia</DialogTitle>
      <DialogDescription>
        Captura realizada em outubro de 2026, costa norte.
      </DialogDescription>
    </DialogHeader>
    <div
      data-slot="dialog-body"
      role="img"
      aria-label="Imagem ilustrativa de pôr-do-sol"
      className="nds-dialog-body nds-aspect-16-9 nds-w-full nds-rounded-md nds-bg-muted nds-cluster nds-text-caption nds-text-muted-foreground"
      data-align="center"
      data-justify="center"
    >
      Pré-visualização da mídia
    </div>
  </DialogContent>
</Dialog>`,
  );
}

/**
 * Controlado por estado externo: `open` + `onOpenChange`.
 *
 * O par é indivisível — com `open` e sem o callback, o diálogo abre e nunca
 * mais fecha, porque Escape, overlay e X passam TODOS pelo dono do estado. Sem
 * gatilho próprio: quem abre é outro fluxo da página.
 */
export function dialogControlledSource(): string {
  return jsxSnippet(
    `${IMPORT_BASE.replace('  DialogTrigger,\n', '')}
import { useState } from "react";`,
    `function ConfirmacaoExterna() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="nds-stack" data-spacing="sm">
      <Button onClick={() => setAberto(true)}>Abrir por código</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>${TITLE}</DialogTitle>
            <DialogDescription>
              ${DESCRIPTION}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button onClick={() => setAberto(false)}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`,
  );
}
