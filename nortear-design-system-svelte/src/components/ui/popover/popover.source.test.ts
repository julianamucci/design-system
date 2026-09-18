import { describe, expect, it } from 'vitest';
import {
  popoverSource,
  popoverClosedSource,
  popoverOpenSource,
  popoverControlledSource,
  popoverModalSource,
  popoverFocusedSource,
  popoverDefaultSource,
  popoverWithTitleSource,
  popoverFormSource,
  popoverTableFilterSource,
  popoverColorPickerSource,
  popoverQuickSettingsSource,
  popoverSideTopSource,
} from './popover.source';

describe('popoverSource', () => {
  it('sem args, entrega a composição canônica com cabeçalho e ações', () => {
    expect(popoverSource()).toBe(
      `<script lang="ts">
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverClose,
  } from "@/components/ui/popover";
  import { Button } from "@/components/ui/button";

  let open = $state(false);

  function salvar() {
    // Salvou: fecha por CÓDIGO. Só o Cancelar é \`PopoverClose\` — é a diferença
    // entre os dois caminhos que separa "desistiu" de "concluiu" no relatório.
    open = false;
  }
</script>

<Popover bind:open={open}>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir popover</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Configurações de exibição</PopoverTitle>
      <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
    </PopoverHeader>
    <div class="nds-cluster" data-justify="end" data-spacing="sm">
      <PopoverClose>
        {#snippet child({ props })}
          <Button variant="ghost" size="sm" {...props}>Cancelar</Button>
        {/snippet}
      </PopoverClose>
      <Button size="sm" onclick={salvar}>Salvar</Button>
    </div>
  </PopoverContent>
</Popover>`,
    );
  });

  it('nunca importa do arquivo interno nem da lib headless', () => {
    // O leitor importa do design system; o caminho do `.svelte` interno é
    // detalhe de implementação e não sobrevive a uma reorganização de pasta.
    const output = popoverSource();
    expect(output).toContain('from "@/components/ui/popover"');
    expect(output).not.toContain('.svelte');
  });

  it('só escreve side, align e sideOffset quando diferem do padrão', () => {
    expect(popoverSource()).toContain('<PopoverContent>');
    const movido = popoverSource('', { args: { side: 'top', sideOffset: 12 } });
    expect(movido).toContain('<PopoverContent side="top" sideOffset={12}>');
    expect(popoverSource('', { args: { align: 'start' } })).toContain('align="start"');
  });

  it('o painel que nasce aberto vira estado local com bind:open', () => {
    // `open` é bindable: um valor cravado congelaria o painel aberto, e o
    // snippet ensinaria um popover que não fecha.
    const isOpen = popoverSource('', { args: { defaultOpen: true } });
    expect(isOpen).toContain('let open = $state(true);');
    expect(isOpen).toContain('<Popover bind:open={open}>');
    // Sem rodapé de confirmação E fechado na montagem, não há o que ligar: a
    // composição de conteúdo livre segue sem estado nenhum.
    expect(popoverSource('', { args: { variant: 'default' } })).not.toContain('bind:open');
  });

  it('o rodapé com confirmação leva estado mesmo nascendo fechado', () => {
    // O botão de confirmação fecha por CÓDIGO, e escrever no `bind:open` é o
    // que fecha — sem o estado, o snippet ensinaria um botão inerte, que é o
    // defeito medido em três stacks.
    for (const variant of ['withTitle', 'form', 'tableFilter'] as const) {
      const output = popoverSource('', { args: { variant } });
      expect(output).toContain('let open = $state(false);');
      expect(output).toContain('<Popover bind:open={open}>');
      expect(output).toContain('open = false;');
    }
  });

  it('só o Cancelar é PopoverClose — o confirmar fecha por código', () => {
    // Envolver o confirmar na peça de fechar reportaria `close-button`, e
    // "concluiu" chegaria ao relatório como "apertou o botão de fechar".
    const output = popoverSource();
    const dentroDoClose = output.slice(
      output.indexOf('<PopoverClose>'),
      output.indexOf('</PopoverClose>'),
    );
    expect(dentroDoClose).toContain('Cancelar');
    expect(dentroDoClose).not.toContain('Salvar');
    expect(output).toContain('<Button size="sm" onclick={salvar}>Salvar</Button>');
  });

  it('`alignOffset` só sai quando difere de 0 (D14)', () => {
    expect(popoverSource()).not.toContain('alignOffset');
    expect(popoverSource('', { args: { alignOffset: 0 } })).not.toContain('alignOffset');
    expect(popoverSideTopSource()).toContain(
      '<PopoverContent side="top" sideOffset={12} alignOffset={8}>',
    );
  });

  it('o painel da Focused não tem descrição, nem a importa', () => {
    const output = popoverFocusedSource();
    expect(output).toContain('<PopoverTitle>Confirmar alteração</PopoverTitle>');
    expect(output).not.toContain('PopoverDescription');
  });

  it('o rótulo do gatilho acompanha o control', () => {
    expect(popoverSource('', { args: { triggerLabel: 'Ver atalhos' } })).toContain(
      '<Button variant="outline" {...props}>Ver atalhos</Button>',
    );
  });

  it('a composição sem título traz só o texto, e importa só as três peças', () => {
    const output = popoverSource('', {
      args: { variant: 'default', description: 'Use Ctrl+K para abrir a busca.' },
    });
    expect(output).toContain('<p>Use Ctrl+K para abrir a busca.</p>');
    expect(output).not.toContain('PopoverTitle');
  });

  it('a composição de formulário traz estado, campos rotulados e submit', () => {
    const output = popoverSource('', { args: { variant: 'form' } });
    expect(output).toContain('import { Input } from "@/components/ui/input";');
    expect(output).toContain('import { Label } from "@/components/ui/label";');
    expect(output).toContain('let nome = $state("Ana Ribeiro");');
    expect(output).toContain('<Label for="perfil-nome">Nome</Label>');
    expect(output).toContain('<Button type="submit" size="sm">Atualizar</Button>');
    // O fechamento vai no `submit`, depois do `preventDefault` — no `click` do
    // botão ele cancelaria o próprio submit.
    expect(output).toContain(`function salvar(evento: SubmitEvent) {`);
    expect(output).toMatch(/evento\.preventDefault\(\);\n\s*open = false;/);
  });

  it('a composição de filtro combina status e oferece Limpar / Aplicar', () => {
    const output = popoverSource('', { args: { variant: 'tableFilter' } });
    expect(output.match(/type="checkbox"/g)).toHaveLength(3);
    expect(output).toContain('<Button size="sm" onclick={aplicar}>Aplicar</Button>');
  });

  it('cada amostra da paleta carrega nome acessível próprio', () => {
    // A cor não é o nome: sem `aria-label` o botão fica sem nome nenhum.
    const output = popoverSource('', { args: { variant: 'colorPicker' } });
    expect(output.match(/aria-label="/g)).toHaveLength(6);
  });

  it('o painel de opções traz duas caixas rotuladas e nenhum botão de ação', () => {
    // É a composição da story do modo modal: os dois focáveis que o laço de
    // tabulação precisa são CAIXAS, e não um rodapé de Cancelar/Salvar que não
    // executaria ação nenhuma. Cada caixa vem ligada por `bind:checked` —
    // caixa sem estado ensinaria um controle inerte.
    const output = popoverSource('', { args: { variant: 'options' } });
    expect(output).toContain('import { Checkbox } from "@/components/ui/checkbox";');
    expect(output).toContain('import { Label } from "@/components/ui/label";');
    expect(output).toContain('<Label for="popover-option-remember">Lembrar minha escolha</Label>');
    expect(output).toContain('<Label for="popover-option-email">Receber aviso por e-mail</Label>');
    expect(output).toContain('<Checkbox id="popover-option-remember" bind:checked={remember} />');
    expect(output).toContain('let emailNotice = $state(false);');
    // Sem peça de fechar: com um `PopoverClose` registrado no painel, quem
    // prende o foco passa a ser o gerenciador da lib.
    expect(output).not.toContain('PopoverClose');
  });

  it('as preferências rápidas são independentes entre si', () => {
    const output = popoverSource('', { args: { variant: 'quickSettings' } });
    expect(output).toContain('<span>Notificações</span>');
    expect(output.match(/type="checkbox"/g)).toHaveLength(3);
  });
});

// ─── A tabela story × construtor, cobrada NOS DOIS SENTIDOS ───────────────────
//
// Um construtor por story é a regra; o que a torna verificável é esta tabela ser
// cobrada nas DUAS direções, e é isso que separa "declarado" de "medido":
//
//   · story sem entrada aqui volta a herdar o snippet do meta em silêncio — o
//     painel passa a mostrar o exemplo de OUTRA story e acerta por coincidência;
//   · entrada sem story é construtor órfão, que ninguém mais chama e ninguém
//     percebe. É a forma exata pela qual o `source-snippets.test.ts` encolheu
//     quando 28 exports saíram da varredura por uma mudança de nome: a contagem
//     caiu, nada reprovou, e a suíte seguiu verde medindo menos.

const BUILDERS: Record<string, () => string> = {
  Playground: popoverSource,
  Closed: popoverClosedSource,
  Open: popoverOpenSource,
  Controlled: popoverControlledSource,
  Modal: popoverModalSource,
  Focused: popoverFocusedSource,
  Default: popoverDefaultSource,
  WithTitle: popoverWithTitleSource,
  Form: popoverFormSource,
  EditProfile: popoverFormSource,
  TableFilter: popoverTableFilterSource,
  ColorPicker: popoverColorPickerSource,
  QuickSettings: popoverQuickSettingsSource,
  SideTop: popoverSideTopSource,
};

/**
 * Stories que DIVIDEM construtor — lista fechada, cada uma com a premissa.
 *
 * Markup idêntico pode dividir construtor; o que não pode é dividir em
 * silêncio. Cada entrada diz com QUEM divide, e o caso abaixo confere a
 * premissa: no dia em que as duas deixarem de renderizar a mesma composição, a
 * exceção reprova em vez de continuar quieta.
 */
const SHARED: Record<string, string> = {
  EditProfile: 'Form',
};

/**
 * Stories cujo snippet NASCE aberto — nas de estado, o estado É o assunto.
 *
 * O `Playground` fica de fora: os controls dele partem de `defaultOpen: false`,
 * e é o gesto de quem lê que abre o painel.
 */
const BORN_OPEN = new Set(['Open', 'Controlled', 'Modal']);

const storyFiles = import.meta.glob<string>('./popover*.stories.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Os nomes de story declarados num arquivo. */
function storyNames(raw: string): string[] {
  return [...raw.matchAll(/export const ([A-Z][A-Za-z0-9]*)\s*:\s*Story\b/g)].map((m) => m[1]!);
}

/** O trecho de uma story, da declaração dela até a próxima. */
function storyBlock(raw: string, name: string): string {
  const start = raw.indexOf(`export const ${name}:`);
  if (start === -1) return '';
  const next = raw.slice(start + 1).search(/\nexport const [A-Z]/);
  return next === -1 ? raw.slice(start) : raw.slice(start, start + 1 + next);
}

const DECLARED = Object.entries(storyFiles).flatMap(([file, raw]) =>
  storyNames(raw).map((name) => ({ file, name, block: storyBlock(raw, name) })),
);

describe('a tabela story × construtor do painel Code', () => {
  it('enxerga os quatro arquivos e as catorze stories — varredura vazia seria verde sem medir', () => {
    // Contagem declarada de propósito: é ela que impede a varredura de encolher
    // em silêncio. Arquivo que saia do glob derruba o total, e o caso reprova.
    expect(Object.keys(storyFiles)).toHaveLength(4);
    expect(DECLARED).toHaveLength(14);
    expect(Object.keys(BUILDERS)).toHaveLength(DECLARED.length);
  });

  it('toda story declarada tem construtor na tabela', () => {
    for (const { name, file } of DECLARED) {
      expect(BUILDERS[name], `${name} (${file}) não tem construtor na tabela`).toBeTypeOf(
        'function',
      );
    }
  });

  it('todo construtor da tabela pertence a uma story que existe', () => {
    const names = new Set(DECLARED.map((s) => s.name));
    for (const name of Object.keys(BUILDERS)) {
      expect(names.has(name), `${name} está na tabela e não é story de arquivo nenhum`).toBe(true);
    }
  });

  it('toda story declara a PRÓPRIA transform, e nenhuma herda a do meta', () => {
    for (const { name, block } of DECLARED) {
      expect(block, `${name} não declara transform própria`).toMatch(/source:\s*\{\s*transform:/);
    }
  });

  it('nenhum construtor devolve vazio, e nenhum ensina o andaime da story', () => {
    for (const [name, build] of Object.entries(BUILDERS)) {
      const output = build();
      expect(output.length, name).toBeGreaterThan(0);
      expect(output, name).toContain('from "@/components/ui/popover"');
      // `PopoverStory` é o invólucro que só existe no arquivo de story: ele não
      // é importável por quem copia o bloco do painel.
      expect(output, name).not.toContain('PopoverStory');
    }
  });

  it('só as stories de ESTADO nascem abertas — nas outras, isso é andaime da foto', () => {
    // As de variação e composição nascem abertas na tela para a captura do
    // Chromatic, e ensinar isso seria ensinar o oposto do que o componente
    // promete. O `bind:open` que sobra em três delas não é andaime: ali o botão
    // de confirmação fecha por CÓDIGO, e sem o estado o snippet ensinaria um
    // botão inerte.
    for (const [name, build] of Object.entries(BUILDERS)) {
      const output = build();
      expect(output.includes('$state(true)'), `${name} nasce aberto no snippet`).toBe(
        BORN_OPEN.has(name),
      );
    }
  });

  it('só a story do modo modal escreve `modal` no snippet', () => {
    // Sem a prop, o painel Code ensinaria o popover comum ao lado de uma página
    // que fala de foco preso e rolagem travada.
    for (const [name, build] of Object.entries(BUILDERS)) {
      expect(/<Popover[^>]*\smodal[\s>]/.test(build()), name).toBe(name === 'Modal');
    }
  });

  it('as stories que dividem construtor o fazem com a premissa CONFERIDA', () => {
    for (const [name, twin] of Object.entries(SHARED)) {
      expect(BUILDERS[name], `${name} deveria dividir o construtor com ${twin}`).toBe(
        BUILDERS[twin],
      );
      // A premissa é renderizarem a MESMA composição. No dia em que uma delas
      // trocar de variante, a exceção deixa de valer e este caso reprova.
      const variantOf = (block: string) => /variant:\s*'([a-zA-Z]+)'/.exec(block)?.[1];
      const mine = DECLARED.find((s) => s.name === name)!;
      const other = DECLARED.find((s) => s.name === twin)!;
      expect(variantOf(mine.block), `${name} x ${twin}`).toBe(variantOf(other.block));
      expect(variantOf(mine.block)).toBeTruthy();
    }
  });

  it('nenhuma outra story divide construtor sem estar declarada em SHARED', () => {
    const seen = new Map<() => string, string>();
    for (const [name, build] of Object.entries(BUILDERS)) {
      const owner = seen.get(build);
      if (owner === undefined) {
        seen.set(build, name);
        continue;
      }
      expect(SHARED[name], `${name} divide construtor com ${owner} sem declarar`).toBe(owner);
    }
  });
});
