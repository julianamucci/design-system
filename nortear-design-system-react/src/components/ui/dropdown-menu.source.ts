/**
 * Transforms do painel Code do DropdownMenu.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O painel imprimia a árvore do `render`: o `<div class="nds-min-h-80"
 * style={{ contain }}>` que segura o canvas da story, o `{...rootArgs}` e, nas
 * composições, os componentes de estado declarados dentro do arquivo de
 * story. Nada disso compila fora dali.
 *
 * Duas coisas ficam FORA dos snippets de propósito:
 *
 *  · **`defaultOpen` e `modal={false}` das stories abertas.** Existem para o
 *    Chromatic fotografar o menu aberto sem a guarda de foco do modal
 *    interferir. Não são o uso de produção.
 *  · **`onOpenChange` do Playground.** O Storybook o entrega como espião;
 *    interpolado, o corpo do mock viraria código no painel. Quem ensina o par
 *    controlado é a story Controlled, com estado de verdade.
 *
 * Uma regra do primitivo que todo snippet respeita: **o rótulo mora DENTRO do
 * grupo que ele nomeia**. Fora de um `DropdownMenuGroup`/`DropdownMenuRadioGroup`
 * ele lança "MenuGroupContext is missing" e o menu inteiro deixa de renderizar
 * — sem erro na tela, só um portal vazio.
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

export type DropdownMenuArgs = {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  modal: boolean;
  defaultOpen: boolean;
};

const LADOS = ['top', 'bottom', 'left', 'right'] as const;
const ALINHAMENTOS = ['start', 'center', 'end'] as const;

/** Import base: só as peças que o snippet correspondente usa. */
function importDe(...parts: string[]): string {
  const list = ['DropdownMenu', ...parts].sort();
  return `import {
${list.map((part) => `  ${part},`).join('\n')}
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";`;
}

/**
 * O gatilho entra por `asChild`: quem recebe foco, `aria-haspopup` e
 * `aria-expanded` é o `<Button>` de quem consome. Sem `asChild` sobraria um
 * elemento a mais entre o botão e o menu.
 */
function trigger(label: string): string {
  return `<DropdownMenuTrigger asChild>
  <Button variant="outline">${label}</Button>
</DropdownMenuTrigger>`;
}

function menu(propsRaiz: string, rotuloGatilho: string, propsConteudo: string, items: string): string {
  return `<DropdownMenu${propsRaiz}>
${indentar(trigger(rotuloGatilho))}
  <DropdownMenuContent${propsConteudo}>
${indentar(items, '    ')}
  </DropdownMenuContent>
</DropdownMenu>`;
}

/**
 * Transform do `meta` — cascateia para todas as stories do arquivo.
 *
 * Lê os controls do Playground. `side` e `align` moram no Content, não na raiz;
 * `modal` e `defaultOpen`, na raiz. Cada um só aparece quando difere do padrão
 * do componente.
 */
export const dropdownMenuSource: SourceTransform<DropdownMenuArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const root = attrsMultilinha([
    propBool('defaultOpen', args.defaultOpen),
    propBool('modal', args.modal, true),
  ]);
  const content = attrs(
    propOption('side', args.side, LADOS, 'bottom'),
    propOption('align', args.align, ALINHAMENTOS, 'start'),
  );

  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuSeparator',
      'DropdownMenuTrigger',
    ),
    menu(
      root,
      'Abrir menu',
      content,
      `<DropdownMenuGroup>
  <DropdownMenuLabel>Conta</DropdownMenuLabel>
  <DropdownMenuItem>Perfil</DropdownMenuItem>
  <DropdownMenuItem>Configurações</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
</DropdownMenuGroup>`,
    ),
  );
};

/**
 * Itens neutros, sem grupo nem rótulo. É a forma mínima do menu: uma lista de
 * ações. O `variant` fica de fora justamente porque `default` é o padrão —
 * escrevê-lo ensinaria ruído.
 */
export function dropdownMenuItemDefaultSource(): string {
  return jsxSnippet(
    importDe('DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger'),
    menu(
      '',
      'Conta',
      '',
      `<DropdownMenuItem>Perfil</DropdownMenuItem>
<DropdownMenuItem>Configurações</DropdownMenuItem>
<DropdownMenuItem>Equipe</DropdownMenuItem>`,
    ),
  );
}

/**
 * Item destrutivo. A variante existe para que "Excluir conta" não pareça
 * "Editar perfil": ela troca a cor do texto E, ao ser destacado, a cor do
 * fundo — quem não distingue matiz precisa do segundo sinal.
 */
export function dropdownMenuItemDestructiveSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuItem',
      'DropdownMenuSeparator',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Conta',
      '',
      `<DropdownMenuItem>Perfil</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>`,
    ),
  );
}

/**
 * Item desabilitado. `disabled` anuncia `aria-disabled` e desliga os eventos de
 * ponteiro no CSS — a seta ainda pousa nele, para que seja anunciado, mas ele
 * não executa. É o padrão de menu da WAI-ARIA.
 */
export function dropdownMenuItemDisabledSource(): string {
  return jsxSnippet(
    importDe('DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger'),
    menu(
      '',
      'Ações',
      '',
      `<DropdownMenuItem>Editar</DropdownMenuItem>
<DropdownMenuItem disabled>Arquivar</DropdownMenuItem>
<DropdownMenuItem>Duplicar</DropdownMenuItem>`,
    ),
  );
}

/**
 * Modo controlado: o par `open` + `onOpenChange`. Sem o callback o valor ligado
 * nunca voltaria a `false`, e o menu reabriria a cada tentativa de fechar —
 * inclusive pelo Escape.
 */
export function dropdownMenuControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importDe('DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger')}`,
    `function AcoesDoItem() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="nds-stack" data-spacing="sm">
      <Button onClick={() => setAberto(!aberto)}>
        {aberto ? "Fechar pelo estado" : "Abrir pelo estado"}
      </Button>

      <DropdownMenu open={aberto} onOpenChange={setAberto}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Ações</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Duplicar</DropdownMenuItem>
          <DropdownMenuItem>Arquivar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}`,
  );
}

/**
 * Grupos com rótulo. O rótulo dá NOME ACESSÍVEL ao grupo — sem ele o leitor
 * anuncia "grupo" e a pessoa não sabe de qual bloco se trata —, e não é item de
 * menu: a seta não pousa nele e o typeahead não o traz como resultado.
 */
export function dropdownMenuWithLabelSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuSeparator',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Conta',
      '',
      `<DropdownMenuGroup>
  <DropdownMenuLabel>Conta</DropdownMenuLabel>
  <DropdownMenuItem>Perfil</DropdownMenuItem>
  <DropdownMenuItem>Configurações</DropdownMenuItem>
</DropdownMenuGroup>
<DropdownMenuSeparator />
<DropdownMenuGroup>
  <DropdownMenuLabel>Suporte</DropdownMenuLabel>
  <DropdownMenuItem>Documentação</DropdownMenuItem>
  <DropdownMenuItem>Sair</DropdownMenuItem>
</DropdownMenuGroup>`,
    ),
  );
}

/**
 * Alternadores independentes. Cada item guarda o próprio `checked`, alternar um
 * não mexe no outro e o menu NÃO fecha — quem marca uma coluna costuma marcar a
 * próxima. O estado vive fora do componente, que só o reflete.
 */
export function dropdownMenuWithCheckboxSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importDe(
  'DropdownMenuCheckboxItem',
  'DropdownMenuContent',
  'DropdownMenuGroup',
  'DropdownMenuLabel',
  'DropdownMenuTrigger',
)}`,
    `function ColunasVisiveis() {
  const [nome, setNome] = useState(true);
  const [email, setEmail] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Colunas</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={nome} onCheckedChange={setNome}>
            Nome
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={email} onCheckedChange={setEmail}>
            E-mail
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`,
  );
}

/**
 * Escolha única. O valor mora no grupo, não em cada item: escolher um desmarca
 * o anterior sozinho. O rótulo fica DENTRO do `DropdownMenuRadioGroup`, que
 * também é um grupo para efeito do contexto do primitivo.
 */
export function dropdownMenuWithRadioSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importDe(
  'DropdownMenuContent',
  'DropdownMenuLabel',
  'DropdownMenuRadioGroup',
  'DropdownMenuRadioItem',
  'DropdownMenuTrigger',
)}`,
    `function EscolhaDeTema() {
  const [tema, setTema] = useState("light");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Tema</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={tema} onValueChange={setTema}>
          <DropdownMenuLabel>Aparência</DropdownMenuLabel>
          <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`,
  );
}

/**
 * Submenu. O trio Sub/SubTrigger/SubContent é o que faz o segundo painel abrir
 * AO LADO do primeiro e responder à seta para a direita. A seta indicadora do
 * gatilho vem do próprio componente — não se acrescenta ícone aqui.
 */
export function dropdownMenuWithSubmenuSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuItem',
      'DropdownMenuSub',
      'DropdownMenuSubContent',
      'DropdownMenuSubTrigger',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Arquivo',
      '',
      `<DropdownMenuItem>Renomear</DropdownMenuItem>
<DropdownMenuSub>
  <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem>PDF</DropdownMenuItem>
    <DropdownMenuItem>CSV</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>`,
    ),
  );
}

/**
 * Atalhos de teclado. O atalho é INFORMAÇÃO, não decoração: fica dentro do
 * item, entra no nome acessível ("Copiar Ctrl+C") e por isso nunca leva
 * `aria-hidden`. Quem o empurra para a borda direita é o próprio componente.
 */
export function dropdownMenuWithShortcutsSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuItem',
      'DropdownMenuSeparator',
      'DropdownMenuShortcut',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Editar',
      '',
      `<DropdownMenuItem>
  Desfazer
  <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuItem>
  Copiar
  <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem>
  Colar
  <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
</DropdownMenuItem>`,
    ),
  );
}
