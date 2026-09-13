/**
 * Transforms do painel Code do Popover.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta — `contain: layout`, `minHeight`,
 * `position: relative`, o parágrafo "Área externa", a chave de remontagem — é
 * andaime: o painel é portalizado e precisa de um quadro contra o que se
 * posicionar dentro do Storybook, e a dispensa por clique fora precisa de um
 * alvo inerte para não depender da geometria da página. Nada disso é do
 * componente, e por isso nada disso entra no snippet.
 *
 * O gatilho entra sempre com `asChild` sobre um `<Button>`: o gatilho não é um
 * invólucro, é o botão que JÁ existe na interface recebendo as props de
 * abertura. É isso que mantém um só elemento focável e um só nome acessível.
 */
import {
  attrs,
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propNumber,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type PopoverArgs = {
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  defaultOpen: boolean;
  modal: boolean;
};

const LADOS = ['top', 'right', 'bottom', 'left'] as const;
const ALINHAMENTOS = ['start', 'center', 'end'] as const;

/** Distância padrão entre gatilho e painel, em px. */
const DISTANCIA_DEFAULT = 4;

const IMPORT_BUTTON = 'import { Button } from "@/components/ui/button";';

/**
 * O import do estado. Sai daqui e não de cada construtor porque agora são
 * CINCO os snippets que fecham por código, e um `useState` sem import chega a
 * quem copiou como `useState is not defined` — o mesmo defeito do nome elidido,
 * uma linha acima.
 */
const IMPORT_USE_STATE = 'import { useState } from "react";';

/** Bloco de import do componente, em ordem alfabética das peças usadas. */
function importingPopover(...parts: string[]): string {
  const list = [...parts].sort();
  return `import {\n${list
    .map((part) => `  ${part},`)
    .join('\n')}\n} from "@/components/ui/popover";`;
}

/** Gatilho: o botão de verdade da interface, com as props emprestadas. */
function trigger(label: string): string {
  return `  <PopoverTrigger asChild>
    <Button variant="outline">${label}</Button>
  </PopoverTrigger>`;
}

/**
 * Cabeçalho nomeado. Com `PopoverTitle` a lib monta o `aria-labelledby`
 * sozinha — e `role="dialog"` sem nome reprova na regra `aria-dialog-name`.
 */
function header(title: string, descricao?: string): string {
  const lineDescription = descricao
    ? `\n      <PopoverDescription>\n        ${descricao}\n      </PopoverDescription>`
    : '';
  return `    <PopoverHeader>
      <PopoverTitle>${title}</PopoverTitle>${lineDescription}
    </PopoverHeader>`;
}

/** A composição inteira: raiz, gatilho e painel. */
function popover(root: string, gatilhoRotulo: string, panel: string, content: string): string {
  return `<Popover${root}>
${trigger(gatilhoRotulo)}
  <PopoverContent${panel}>
${content}
  </PopoverContent>
</Popover>`;
}

/**
 * Par de ações do rodapé do painel, encostado à direita.
 *
 * As duas FECHAM, e por CAMINHOS diferentes — é o snippet que ensina isso, e
 * por isso ele carrega o `onClick` em vez de dois `PopoverClose`:
 *
 *   Cancelar → `PopoverClose`, motivo `close-button` — desistiu
 *   Salvar   → código, depois de salvar, motivo `api` — concluiu
 *
 * Um "Cancelar" que não fecha é botão que promete saída e não entrega — foi o
 * defeito que a dona viu na tela em 2026-09-12. Um "Salvar" que fecha COMO
 * peça de fechar é o defeito seguinte, e mais silencioso: o painel some do
 * mesmo jeito, e os dois desfechos chegam ao relatório com o mesmo motivo.
 */
const ACTIONS_DEFAULT = `    <div className="nds-cluster" data-justify="end" data-spacing="sm">
      <PopoverClose asChild>
        <Button variant="ghost" size="sm">Cancelar</Button>
      </PopoverClose>
      <Button size="sm" onClick={() => { salvar(); setOpen(false); }}>Salvar</Button>
    </div>`;

/**
 * Abertura do `<form>` do painel, com o fechamento já no lugar certo.
 *
 * O fechamento vai no `onSubmit`, DEPOIS do `preventDefault`, e nunca no
 * `onClick` do botão que confirma. Dois motivos, e os dois são do formulário:
 *
 *   1. fechar no clique DESMONTA o formulário antes de ele submeter — o
 *      "salvar" nunca acontece;
 *   2. só o caminho do `submit` cobre também o Enter num campo, que é como
 *      metade das pessoas envia formulário.
 *
 * E fecha por CÓDIGO, motivo `api`: envolver o confirmar num `PopoverClose`
 * faria "concluiu" chegar ao relatório como "apertou o botão de fechar".
 */
const FORM_ABERTURA = `    <form
      className="nds-stack"
      data-spacing="sm"
      onSubmit={(e) => {
        // Fechar no \`onClick\` do botão desmontaria o formulário antes do
        // submit, e deixaria de fora o Enter num campo.
        e.preventDefault();
        salvar();
        setOpen(false);
      }}
    >`;

/**
 * Estado do painel e o nome da ação que ele conclui.
 *
 * A base-ui não tem fechamento imperativo: quem fecha por código é o estado de
 * quem compõe, então TODO painel cuja ação primária fecha é CONTROLADO — a
 * mesma forma do Playground desta stack.
 *
 * Até 2026-09-13 só os dois snippets de formulário liam isso; os outros três
 * imprimiam `<Popover>` cru e um rodapé que chamava `setOpen(false)`, ou seja
 * ensinavam exatamente o Salvar inerte que esta campanha existiu para
 * consertar. Um construtor por vez é como o defeito volta: o par mora aqui.
 *
 * E a ação entra DECLARADA porque o snippet é para copiar: manipulador em
 * linha não tem passe na varredura de snippets, e um nome elidido chega a quem
 * copiou como `salvar is not defined` na primeira renderização.
 */
function controlledPreamble(action: string, note: string, initiallyOpen = false): string {
  return `const [open, setOpen] = useState(${initiallyOpen});

function ${action}() {
  // …${note}…
}`;
}

const FORM_PREAMBULO = controlledPreamble('salvar', 'grave o formulário');

/** Raiz controlada — o par que deixa o \`setOpen\` do submit ter efeito. */
const RAIZ_CONTROLADA = ' open={open} onOpenChange={setOpen}';

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai no painel fechado, que é o padrão do
 * componente e o uso canônico. Só o que difere do padrão entra no snippet.
 *
 * O espião de `onOpenChange` NÃO é interpolado: o Storybook o entrega como
 * função, e o corpo do mock apareceria no painel como se fosse código do design
 * system. O `onOpenChange` que o snippet imprime é o do ESTADO — `setOpen` —, e
 * é sempre esse, venha o control como vier.
 *
 * `defaultOpen` do control vira o valor INICIAL do estado, e não prop da raiz.
 * A raiz é controlada porque o Salvar do rodapé fecha por código, e numa raiz
 * controlada `defaultOpen` é prop morta — a lib lê `open`. Imprimir os dois
 * juntos ensinaria um controle que não controla nada. É a mesma decisão da
 * story ao lado, que faz `useState(Boolean(defaultOpen))`.
 */
export const popoverSource: SourceTransform<PopoverArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const root = RAIZ_CONTROLADA + attrs(propBool('modal', args.modal));
  const panel = attrsMultilinha([
    propOption('side', args.side, LADOS, 'bottom'),
    propOption('align', args.align, ALINHAMENTOS, 'center'),
    typeof args.sideOffset === 'number' && args.sideOffset !== DISTANCIA_DEFAULT
      ? propNumber('sideOffset', args.sideOffset)
      : undefined,
  ]);

  return jsxSnippet(
    `${IMPORT_USE_STATE}
${importingPopover(
  'Popover',
  'PopoverClose',
  'PopoverContent',
  'PopoverDescription',
  'PopoverHeader',
  'PopoverTitle',
  'PopoverTrigger',
)}
${IMPORT_BUTTON}

${controlledPreamble('salvar', 'grave o que o painel ajustou', args.defaultOpen === true)}`,
    popover(
      root,
      'Abrir popover',
      panel,
      `${header('Configurações de exibição', 'Ajuste a aparência do conteúdo da página.')}
${ACTIONS_DEFAULT}`,
    ),
  );
};

/**
 * O controle de fechar por dentro do painel.
 *
 * `PopoverClose` e não `onClick={() => setAberto(false)}`: o que separa os dois
 * é o MOTIVO que chega ao `onOpenChange` — a peça fecha com `close-press`, que o
 * design system lê como `close-button`, e o estado escrito à mão fecha por
 * código, que é `api`. Trocar um pelo outro apaga do relatório a diferença
 * entre desistiu e concluiu.
 *
 * O painel da story mostra o motivo num parágrafo ao lado; aquilo é andaime de
 * demonstração e não entra aqui, pela mesma razão do resto do quadro.
 *
 * A raiz é CONTROLADA e nasce aberta pelo estado inicial, e não por
 * `defaultOpen`: o Salvar deste rodapé é justamente o ramo que fecha por
 * código, e sem o par `open`/`onOpenChange` ele seria um botão inerte — que é o
 * defeito que a story ao lado existe para separar do outro ramo.
 */
export function popoverCloseSource(): string {
  return jsxSnippet(
    `${IMPORT_USE_STATE}
${importingPopover(
  'Popover',
  'PopoverClose',
  'PopoverContent',
  'PopoverDescription',
  'PopoverHeader',
  'PopoverTitle',
  'PopoverTrigger',
)}
${IMPORT_BUTTON}

${controlledPreamble('salvar', 'grave o que o painel ajustou', true)}`,
    popover(
      RAIZ_CONTROLADA,
      'Abrir popover',
      '',
      `${header('Configurações de exibição', 'Ajuste a aparência do conteúdo da página.')}
${ACTIONS_DEFAULT}`,
    ),
  );
}

/**
 * Conteúdo livre — a ausência de título é o assunto, e o `aria-label` é a
 * resposta: sem `PopoverTitle` o nome do painel se DECLARA, em vez de cair na
 * herança do rótulo do gatilho. Um `role="dialog"` anônimo reprovaria no axe, e
 * um nomeado pelo botão anuncia a porta em vez do que há atrás dela.
 */
export function popoverContentLivreSource(): string {
  return jsxSnippet(
    `${importingPopover('Popover', 'PopoverContent', 'PopoverTrigger')}
${IMPORT_BUTTON}`,
    popover(
      '',
      'Ver atalhos',
      ' aria-label="Informações adicionais"',
      `    <p>
      Use Ctrl+K para abrir a busca em qualquer tela.
    </p>`,
    ),
  );
}

/**
 * Formulário curto dentro do painel. É o que separa popover de tooltip: o
 * conteúdo é interativo, então o foco entra nele ao abrir e o Tab caminha pelos
 * campos sem sair do painel.
 *
 * O fechamento vive no `onSubmit`, depois do `preventDefault` — nunca no
 * `onClick` do botão: ver `FORM_ABERTURA`.
 */
export function popoverFormSource(): string {
  return jsxSnippet(
    `${IMPORT_USE_STATE}
${importingPopover(
  'Popover',
  'PopoverContent',
  'PopoverHeader',
  'PopoverTitle',
  'PopoverTrigger',
)}
${IMPORT_BUTTON}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

${FORM_PREAMBULO}`,
    popover(
      RAIZ_CONTROLADA,
      'Editar perfil',
      '',
      `${header('Editar perfil')}
${FORM_ABERTURA}
      <Label htmlFor="perfil-nome" className="nds-text-caption">Nome</Label>
      <Input id="perfil-nome" defaultValue="Joana" />
      <Label htmlFor="perfil-email" className="nds-text-caption">Email</Label>
      <Input id="perfil-email" type="email" defaultValue="joana@example.com" />
      <Button type="submit" size="sm" className="nds-mt-1">Atualizar</Button>
    </form>`,
    ),
  );
}

/**
 * Aberto por estado inicial. Enquanto aberto, o gatilho aponta para o painel por
 * `aria-controls` — e o painel só existe no DOM nesse intervalo, o que é
 * justamente o estado que a regressão visual precisa alcançar.
 */
export function popoverOpenSource(): string {
  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      ' defaultOpen',
      'Abrir popover',
      '',
      header('Configurações de exibição', 'Ajuste a aparência do conteúdo da página.'),
    ),
  );
}

/**
 * Controlado de fora. Dois botões, e não um que alterna: o `pointerdown` do
 * clique fora dispensa o painel ANTES do `click`, então um alternador leria o
 * estado já invertido pela lib e reabriria o que acabou de fechar.
 */
export function popoverControlledSource(): string {
  return jsxSnippet(
    `${IMPORT_USE_STATE}
${importingPopover(
  'Popover',
  'PopoverContent',
  'PopoverDescription',
  'PopoverHeader',
  'PopoverTitle',
  'PopoverTrigger',
)}
${IMPORT_BUTTON}

const [aberto, setAberto] = useState(false);`,
    `<div className="nds-stack" data-spacing="sm">
  <div className="nds-cluster" data-spacing="md">
    <Button onClick={() => setAberto(true)}>Abrir externamente</Button>
    <Button variant="outline" onClick={() => setAberto(false)}>
      Fechar externamente
    </Button>
  </div>

  <Popover open={aberto} onOpenChange={setAberto}>
    <PopoverTrigger asChild>
      <Button variant="outline">Preferências</Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Estado controlado</PopoverTitle>
        <PopoverDescription>
          A abertura vive fora do componente.
        </PopoverDescription>
      </PopoverHeader>
    </PopoverContent>
  </Popover>
</div>`,
  );
}

/**
 * Modal: prende o foco no painel, trava a rolagem da página e anuncia
 * `aria-modal`. Os três juntos — anunciar que o resto da página está inerte sem
 * prender o foco engana quem navega por leitor de tela.
 *
 * A prisão é NOSSA e não da lib. O gerenciador de foco do Base UI só trapeia com
 * `modal !== false && hasClosePart`, e `hasClosePart` conta os `Popover.Close`
 * registrados dentro do painel; da lib vem a trava de rolagem, que cai de
 * `modal === true` sozinho. O laço de tabulação está no `PopoverContent` de
 * `popover.tsx`, na mesma forma do Vanilla, que é a referência.
 *
 * Por isso este é o ÚNICO rodapé sem `PopoverClose` — e a ausência é o assunto:
 * é ela que deixa o painel modal depender do nosso laço, que é o caso que o
 * contrato precisa cobrir. Com um controle de fechar aqui, quem trapearia seria
 * a lib, e a story mediria a lib.
 */
export function popoverModalSource(): string {
  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      ' defaultOpen modal',
      'Abrir modal',
      '',
      `${header('Popover modal', 'O foco fica preso no painel enquanto ele está aberto.')}
    <div className="nds-cluster" data-justify="end" data-spacing="sm">
      <Button variant="ghost" size="sm">Cancelar</Button>
      <Button size="sm">OK</Button>
    </div>`,
    ),
  );
}

/**
 * Edição rápida sem trocar de tela. O gatilho nomeia a ação E o objeto —
 * "Editar perfil", nunca "Mais" ou "Clique aqui" —, porque é o nome do gatilho
 * que a pessoa ouve antes de decidir abrir.
 *
 * Só "Cancelar" é `PopoverClose`. "Atualizar" é o submit DO formulário: fora do
 * `<form>` ele ficaria inerte e o Enter num campo não dispararia nada — que é o
 * gesto de quem acabou de digitar. Fechar por dentro sem salvar é papel do
 * descarte.
 *
 * E quem fecha ao salvar é o `onSubmit`, não o clique do "Atualizar" — o motivo
 * está em `FORM_ABERTURA`.
 */
export function popoverEditarPerfilSource(): string {
  return jsxSnippet(
    `${IMPORT_USE_STATE}
${importingPopover(
  'Popover',
  'PopoverClose',
  'PopoverContent',
  'PopoverDescription',
  'PopoverHeader',
  'PopoverTitle',
  'PopoverTrigger',
)}
${IMPORT_BUTTON}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

${FORM_PREAMBULO}`,
    popover(
      RAIZ_CONTROLADA,
      'Editar perfil',
      '',
      `${header('Editar perfil', 'Altere o nome e o email da conta.')}
${FORM_ABERTURA}
      <Label htmlFor="conta-nome" className="nds-text-caption">Nome</Label>
      <Input id="conta-nome" defaultValue="Ana Ribeiro" />
      <Label htmlFor="conta-email" className="nds-text-caption">Email</Label>
      <Input id="conta-email" type="email" defaultValue="ana@nortear.com.br" />
      <div className="nds-cluster" data-justify="end" data-spacing="sm">
        <PopoverClose asChild>
          <Button variant="ghost" size="sm">Cancelar</Button>
        </PopoverClose>
        <Button type="submit" size="sm">Atualizar</Button>
      </div>
    </form>`,
    ),
  );
}

/**
 * Filtros combináveis. Escolha múltipla não fecha no primeiro clique — fechar
 * obrigaria a reabrir o painel para cada critério —, e o par Limpar / Aplicar
 * fica no fim, na ordem em que a decisão acontece.
 *
 * Só "Aplicar" fecha, e fecha por CÓDIGO: aplicar É a decisão, e depois dela o
 * painel não tem mais o que oferecer. "Limpar" desmarca e devolve a escolha a
 * quem está decidindo — fechar ali seria tirar o painel de quem acabou de pedir
 * para recomeçar.
 *
 * Era `PopoverClose` até 2026-09-13, e por isso este snippet não importa mais a
 * peça: aplicar é "concluiu", e a peça de fechar reporta "desistiu".
 *
 * Trocada a peça por código, a raiz TEM de ser controlada — foi o degrau que
 * ficou para trás na mesma rodada, e por meio dia este snippet ensinou um
 * Aplicar que não fechava nada.
 */
export function popoverFilterSource(): string {
  const opcao = (label: string, marcada = false) => `      <label className="nds-cluster" data-spacing="sm">
        <input type="checkbox" className="nds-size-4"${marcada ? ' defaultChecked' : ''} />
        <span>${label}</span>
      </label>`;

  return jsxSnippet(
    `${IMPORT_USE_STATE}
${importingPopover(
  'Popover',
  'PopoverContent',
  'PopoverDescription',
  'PopoverHeader',
  'PopoverTitle',
  'PopoverTrigger',
)}
${IMPORT_BUTTON}

${controlledPreamble('aplicar', 'aplique os filtros à listagem')}`,
    popover(
      RAIZ_CONTROLADA,
      'Filtros',
      '',
      `${header('Filtrar por status', 'Combine quantos status quiser na listagem.')}
    <div className="nds-stack nds-text-body" data-spacing="xs">
${opcao('Ativo', true)}
${opcao('Pendente')}
${opcao('Arquivado')}
    </div>
    <div className="nds-cluster" data-justify="end" data-spacing="sm">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm" onClick={() => { aplicar(); setOpen(false); }}>Aplicar</Button>
    </div>`,
    ),
  );
}

/**
 * Paleta restrita. A cor NÃO é o nome: cada amostra carrega o próprio
 * `aria-label`, porque quem não distingue a cor precisa do rótulo — e um botão
 * sem texto nenhum reprova no axe por `button-name`.
 */
export function popoverPaletteSource(): string {
  const amostra = (token: string, label: string) =>
    `      <button type="button" className={\`\${AMOSTRA} nds-bg-${token}\`} aria-label="${label}" />`;

  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}

const AMOSTRA = "nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring";`,
    popover(
      '',
      'Escolher cor da etiqueta',
      '',
      `${header('Cor da etiqueta', 'Escolha uma cor da paleta do tema.')}
    <div className="nds-cluster" data-spacing="sm">
${amostra('primary', 'Primária')}
${amostra('secondary', 'Secundária')}
${amostra('success', 'Sucesso')}
${amostra('warning', 'Atenção')}
${amostra('info', 'Informação')}
${amostra('destructive', 'Destrutiva')}
    </div>`,
    ),
  );
}

/**
 * Preferências booleanas independentes — alternativa leve ao diálogo para
 * ajustes rápidos. Cada linha vale por si: marcar uma não mexe nas outras, e é
 * por isso que são caixas de marcação e não um grupo de escolha única.
 */
export function popoverPreferenciasSource(): string {
  const preferencia = (label: string, ligada = false) => `      <label
        className="nds-cluster"
        data-align="center"
        data-justify="between"
      >
        <span>${label}</span>
        <input type="checkbox" className="nds-size-4"${ligada ? ' defaultChecked' : ''} />
      </label>`;

  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      '',
      'Configurações rápidas',
      '',
      `${header('Preferências', 'Cada linha vale por si — nada aqui depende do resto.')}
    <div className="nds-stack nds-text-body" data-spacing="sm">
${preferencia('Notificações', true)}
${preferencia('Modo escuro')}
${preferencia('Modo compacto')}
    </div>`,
    ),
  );
}

/**
 * Ancorado acima. `side` é preferência, não garantia: sem espaço acima o painel
 * vira para baixo sozinho — a troca é sempre de LADO no mesmo eixo, nunca de
 * eixo. `sideOffset` é a distância entre o gatilho e o painel.
 */
export function popoverAboveSource(): string {
  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      '',
      'Abrir acima',
      ' side="top" sideOffset={12}',
      header('Ancorado acima', 'Sem espaço acima, o painel vira para baixo sozinho.'),
    ),
  );
}
