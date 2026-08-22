/**
 * Transforms do painel Code do Drawer.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O painel imprimia a árvore do `render`, com o `<div style={{ contain,
 * minHeight }}>` que existe só para o canvas da story não colapsar e com o
 * `{...args}` que ninguém escreve. Nada disso é o componente.
 *
 * Duas coisas ficam FORA dos snippets de propósito:
 *
 *  · **`defaultOpen` das stories de variante e composição.** Ali ele existe
 *    para a captura do Chromatic sair com o painel aberto, e não porque um
 *    drawer de produção nasça aberto. Só aparece onde abrir na montagem É o
 *    assunto (a story Open).
 *  · **`onOpenChange` do Playground.** O Storybook o entrega como espião;
 *    interpolado, o corpo do mock viraria código no painel. Quem ensina o par
 *    controlado é a story Controlled, com estado de verdade.
 */
import {
  attrs,
  attrsMultilinha,
  indentar,
  jsxSnippet,
  propBool,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type DrawerArgs = {
  direction: 'bottom' | 'top' | 'left' | 'right';
  defaultOpen: boolean;
  dismissible: boolean;
  modal: boolean;
};

const DIRECOES = ['bottom', 'top', 'left', 'right'] as const;

const IMPORT = `import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";`;

/** Sem corpo rolável: confirmação e formulários curtos não precisam dele. */
const IMPORT_NO_BODY = `import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";`;

/**
 * Cabeçalho. Título e descrição não são enfeite de layout: o primitivo liga
 * `aria-labelledby`/`aria-describedby` aos ids deles, e é daí que sai o nome
 * acessível do painel modal. Sem eles o diálogo abre anônimo.
 */
function cabecalho(titulo: string, descricao: string): string {
  return `<DrawerHeader>
  <DrawerTitle>${titulo}</DrawerTitle>
  <DrawerDescription>${descricao}</DrawerDescription>
</DrawerHeader>`;
}

/**
 * O gatilho entra por `asChild`: quem recebe foco, papel e nome acessível é o
 * `<Button>` de quem consome, não uma casca extra em volta dele.
 */
function gatilho(rotulo: string): string {
  return `<DrawerTrigger asChild>
  <Button variant="outline">${rotulo}</Button>
</DrawerTrigger>`;
}

function painel(propsRaiz: string, miolo: string, withTrigger: string): string {
  const partes = [withTrigger, `<DrawerContent>\n${indentar(miolo)}\n</DrawerContent>`]
    .filter(Boolean)
    .join('\n');
  return `<Drawer${propsRaiz}>
${indentar(partes)}
</Drawer>`;
}

/**
 * Transform do `meta` — cascateia para todas as stories do arquivo.
 *
 * Lê os controls do Playground. `dismissible` e `modal` nascem `true` no
 * componente, então só entram no snippet quando a story os desliga; `direction`
 * só quando difere de `bottom`.
 */
export const drawerSource: SourceTransform<DrawerArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const raiz = attrsMultilinha([
    propOption('direction', args.direction, DIRECOES, 'bottom'),
    propBool('defaultOpen', args.defaultOpen),
    propBool('dismissible', args.dismissible, true),
    propBool('modal', args.modal, true),
  ]);

  const miolo = [
    cabecalho('Editar perfil', 'Atualize seus dados pessoais e foto.'),
    `<DrawerBody className="nds-text-body nds-text-muted-foreground">
  Conteúdo do drawer.
</DrawerBody>`,
    `<DrawerFooter>
  <Button>Confirmar</Button>
  <DrawerClose asChild>
    <Button variant="outline">Cancelar</Button>
  </DrawerClose>
</DrawerFooter>`,
  ].join('\n');

  return jsxSnippet(IMPORT, painel(raiz, miolo, gatilho('Abrir Drawer')));
};

/** Mesmo painel das quatro direções — o que muda é `direction` e o texto. */
function directionPanel(
  direction: DrawerArgs['direction'],
  titulo: string,
  descricao: string,
): string {
  const miolo = [
    cabecalho(titulo, descricao),
    `<DrawerBody className="nds-text-body nds-text-muted-foreground">
  Conteúdo do painel.
</DrawerBody>`,
    `<DrawerFooter>
  <DrawerClose asChild>
    <Button variant="outline">Fechar</Button>
  </DrawerClose>
</DrawerFooter>`,
  ].join('\n');

  return jsxSnippet(
    IMPORT,
    painel(attrs(propOption('direction', direction, DIRECOES, 'bottom')), miolo, gatilho('Abrir')),
  );
}

/**
 * Entra por cima. Conteúdo curto e saída imediata — notificação rica, seletor
 * rápido. A alça não aparece nesta direção: o CSS compartilhado a esconde.
 */
export function drawerTopoSource(): string {
  return directionPanel('top', 'Nova versão disponível', 'Atualize agora para acessar as novidades.');
}

/** Painel lateral à esquerda — onde a pessoa espera encontrar o menu. */
export function drawerEsquerdaSource(): string {
  return directionPanel('left', 'Menu', 'Navegue pelas seções do app.');
}

/** Painel lateral à direita — a alternativa de desktop para edição e filtros. */
export function drawerDireitaSource(): string {
  return directionPanel('right', 'Filtros', 'Refine sua busca por categoria, preço e disponibilidade.');
}

/**
 * Aberto na montagem. Aqui `defaultOpen` É o assunto — nas outras stories ele
 * só existe para a captura visual, e por isso fica de fora daqueles snippets.
 */
export function drawerOpenSource(): string {
  const miolo = [
    cabecalho('Editar perfil', 'Atualize seus dados.'),
    `<DrawerFooter>
  <DrawerClose asChild>
    <Button variant="outline">Cancelar</Button>
  </DrawerClose>
</DrawerFooter>`,
  ].join('\n');

  return jsxSnippet(IMPORT_NO_BODY, painel(' defaultOpen', miolo, gatilho('Abrir')));
}

/**
 * Modo controlado: o par `open` + `onOpenChange`. O painel não decide nada
 * sozinho, e o callback é obrigatório — sem ele o valor ligado nunca voltaria a
 * `false` e o painel reabriria no render seguinte a cada tentativa de fechar.
 *
 * Sem `DrawerTrigger`: quem abre é o botão de fora, e é isso que o modo
 * controlado torna possível.
 */
export function drawerControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";`,
    `function EditarPerfil() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="nds-stack" data-spacing="sm">
      <div className="nds-cluster" data-spacing="sm">
        <Button onClick={() => setAberto(true)}>Abrir externamente</Button>
        <Button variant="outline" onClick={() => setAberto(false)}>
          Fechar externamente
        </Button>
      </div>

      <Drawer open={aberto} onOpenChange={setAberto}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}`,
  );
}

/**
 * Sem dispensa por gesto: Escape, arrasto e clique no overlay deixam de fechar.
 * A saída então PRECISA ser explícita e alcançável por teclado — `dismissible`
 * desligado sem um botão de fechar prende quem navega sem ponteiro.
 */
export function drawerNotDispensavelSource(): string {
  const miolo = [
    cabecalho('Confirmação obrigatória', 'Use o botão Confirmar para prosseguir.'),
    `<DrawerFooter>
  <DrawerClose asChild>
    <Button>Confirmar e fechar</Button>
  </DrawerClose>
</DrawerFooter>`,
  ].join('\n');

  return jsxSnippet(IMPORT_NO_BODY, painel(' dismissible={false}', miolo, gatilho('Abrir')));
}

/**
 * Formulário curto no corpo e o par de ações no rodapé. Cada campo é achado
 * pelo RÓTULO, e é o `htmlFor` casando com o `id` que sustenta isso: sem o par,
 * o campo fica sem nome acessível dentro de um painel modal.
 */
export function drawerWithFormSource(): string {
  const miolo = [
    cabecalho('Editar perfil', 'Atualize seu nome e e-mail.'),
    `<DrawerBody>
  <form className="nds-grid" data-spacing="sm">
    <div className="nds-grid" data-spacing="xs">
      <Label htmlFor="drawer-name">Nome</Label>
      <Input id="drawer-name" defaultValue="Juliana" />
    </div>
    <div className="nds-grid" data-spacing="xs">
      <Label htmlFor="drawer-email">E-mail</Label>
      <Input id="drawer-email" type="email" defaultValue="juliana@example.com" />
    </div>
  </form>
</DrawerBody>`,
    `<DrawerFooter>
  <Button>Confirmar</Button>
  <DrawerClose asChild>
    <Button variant="outline">Cancelar</Button>
  </DrawerClose>
</DrawerFooter>`,
  ].join('\n');

  return jsxSnippet(
    `${IMPORT}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`,
    painel('', miolo, gatilho('Editar perfil')),
  );
}

/**
 * Confirmação reversível: consequência escrita na descrição e a ação principal
 * na variante destrutiva. Se a ação for realmente bloqueante, o componente é
 * outro — o AlertDialog.
 */
export function drawerWithConfirmSource(): string {
  const miolo = [
    cabecalho(
      'Remover anexo?',
      'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
    ),
    `<DrawerFooter>
  <Button variant="destructive">Remover</Button>
  <DrawerClose asChild>
    <Button variant="outline">Cancelar</Button>
  </DrawerClose>
</DrawerFooter>`,
  ].join('\n');

  return jsxSnippet(IMPORT_NO_BODY, painel('', miolo, gatilho('Remover anexo')));
}

/**
 * Corpo mais alto que o painel. Quem rola é o `DrawerBody`, não o painel: ele
 * traz `flex: 1`, `min-height: 0` e `overflow: auto`, e é o `min-height: 0` que
 * o faz ceder altura em vez de esticar a caixa e empurrar o rodapé — com as
 * ações dentro — para fora da tela. O `tabIndex` da região rolável vem do
 * próprio componente, então quem navega por teclado alcança a rolagem.
 */
export function drawerWithScrollSource(): string {
  const miolo = [
    cabecalho('Lista de itens', '30 itens — role o conteúdo para ver mais.'),
    `<DrawerBody className="nds-text-body">
  <ul className="nds-stack" data-spacing="sm">
    {Array.from({ length: 30 }, (_, i) => (
      <li
        key={i}
        className="nds-cluster nds-border-default nds-rounded-md nds-py-2 nds-px-4"
        data-justify="between"
      >
        <span>Item {i + 1}</span>
        <span className="nds-text-muted-foreground">#{i + 1}</span>
      </li>
    ))}
  </ul>
</DrawerBody>`,
    `<DrawerFooter>
  <DrawerClose asChild>
    <Button variant="outline">Fechar</Button>
  </DrawerClose>
</DrawerFooter>`,
  ].join('\n');

  return jsxSnippet(IMPORT, painel('', miolo, gatilho('Ver lista')));
}
