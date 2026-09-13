import { describe, expect, it } from 'vitest';
import {
  popoverAboveSource,
  popoverCloseSource,
  popoverContentLivreSource,
  popoverControlledSource,
  popoverEditarPerfilSource,
  popoverFilterSource,
  popoverFormSource,
  popoverModalSource,
  popoverOpenSource,
  popoverPaletteSource,
  popoverPreferenciasSource,
  popoverSource,
} from './popover.source';

/**
 * O `source-snippets.test.ts` varre TODOS os construtores e prova coerência de
 * IMPORT — que o snippet importa o que usa. O que ele não alcança é se o snippet
 * ensina o CERTO: omitir o valor padrão, bater com a story ao lado, não vazar
 * binding que só existe nela.
 *
 * A distância entre as duas camadas apareceu duas vezes nesta campanha, e as
 * duas em sobreposição: o preview mudou e o snippet ao lado continuou ensinando
 * a forma antiga, sem que nenhum portão visse. Quem lê copia o snippet, não o
 * preview.
 */

const ALL = [
  popoverSource,
  popoverContentLivreSource,
  popoverFormSource,
  popoverOpenSource,
  popoverControlledSource,
  popoverModalSource,
  popoverEditarPerfilSource,
  popoverFilterSource,
  popoverPaletteSource,
  popoverPreferenciasSource,
  popoverAboveSource,
  popoverCloseSource,
];

/**
 * O bloco de ações do rodapé — do cluster encostado à direita até o `</div>` que
 * o fecha. Recortar antes de afirmar é o que impede a asserção por substring de
 * casar noutro contexto: `variant=` existe no gatilho de todo snippet, e um
 * `toContain` solto não distinguiria os dois lugares.
 */
function footer(output: string): string {
  const start = output.indexOf('data-justify="end"');
  expect(start).toBeGreaterThan(-1);
  return output.slice(start, output.indexOf('</div>', start));
}

describe('popoverSource (transform do meta)', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const output = popoverSource();
    expect(output).toContain('} from "@/components/ui/popover";');
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    // O gatilho é o botão que JÁ existe na interface, recebendo as props de
    // openingTag por `asChild` — um só elemento focável, um só nome acessível.
    expect(output).toContain('<PopoverTrigger asChild>');
    expect(output).toContain('<Button variant="outline">Abrir popover</Button>');
    // O que o renderer imprimiria sozinho, e o andaime que a story monta em
    // volta do painel portalizado. Nada disso é do componente.
    expect(output).not.toContain('args.');
    expect(output).not.toContain('{...args}');
    expect(output).not.toContain('data-slot=');
    expect(output).not.toContain('minHeight');
    expect(output).not.toContain('style=');
  });

  it('omite side, align e sideOffset quando são o padrão do componente', () => {
    const output = popoverSource(undefined, {
      args: { side: 'bottom', align: 'center', sideOffset: 4 },
    });
    // Repetir valor padrão no snippet ensina ruído: quem copia passa a declarar
    // o que já vem de graça, e some a informação de que existe um padrão.
    //
    // A checagem é na TAG, não na substring: o rodapé traz `data-justify="end"`
    // e o cluster do filtro traz `data-spacing`, então um `not.toContain('align=')`
    // ou `not.toContain('side')` casaria fora do painel. Foi exatamente o que
    // reprovou por engano no hover-card.
    expect(output).toContain('<PopoverContent>');
    expect(output).not.toContain('<PopoverContent ');
  });

  it('imprime side, align e sideOffset quando diferem do padrão', () => {
    const output = popoverSource(undefined, {
      args: { side: 'top', align: 'start', sideOffset: 12 },
    });
    expect(output).toContain('<PopoverContent side="top" align="start" sideOffset={12}>');
  });

  it('não inventa posição fora da união quando o control é adulterado', () => {
    const output = popoverSource(undefined, {
      args: { side: 'diagonal' as never, align: 'meio' as never },
    });
    expect(output).toContain('<PopoverContent>');
  });

  it('o defaultOpen do control vira estado INICIAL, e nunca prop de uma raiz controlada', () => {
    // A raiz é controlada porque o Salvar do rodapé fecha por código. Numa raiz
    // controlada `defaultOpen` é prop morta — a lib lê `open` —, então o control
    // entra pelo único lugar em que ainda decide alguma coisa: o valor inicial
    // do estado. É a mesma forma da story ao lado, `useState(Boolean(defaultOpen))`.
    const closed = popoverSource(undefined, { args: { defaultOpen: false, modal: false } });
    expect(closed).toContain('const [open, setOpen] = useState(false);');
    expect(closed).toContain('<Popover open={open} onOpenChange={setOpen}>');

    const opened = popoverSource(undefined, { args: { defaultOpen: true } });
    expect(opened).toContain('const [open, setOpen] = useState(true);');
    expect(opened).toContain('<Popover open={open} onOpenChange={setOpen}>');
    // O par que dá dentes: `defaultOpen` de volta na raiz seria o controle morto.
    expect(opened).not.toContain('defaultOpen');
  });

  it('modal entra na raiz na forma abreviada, e some quando falso', () => {
    expect(popoverSource(undefined, { args: { modal: false } })).toContain(
      '<Popover open={open} onOpenChange={setOpen}>',
    );
    expect(popoverSource(undefined, { args: { defaultOpen: true, modal: true } })).toContain(
      '<Popover open={open} onOpenChange={setOpen} modal>',
    );
  });

  it('o espião de action não vaza o corpo do mock para o painel', () => {
    // O Storybook entrega `onOpenChange` como função; interpolada, ela
    // apareceria no painel como se fosse código do design system.
    const spy = () => 'CORPO_DO_MOCK';
    const output = popoverSource(undefined, {
      args: { onOpenChange: spy, sideOffset: spy } as never,
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    // O único `onOpenChange` impresso é o do estado. Antes de a raiz virar
    // controlada, este caso afirmava a AUSÊNCIA da prop; medir ausência deixou
    // de distinguir o espião do binding legítimo, então agora ele conta.
    expect(output.match(/onOpenChange/g)).toHaveLength(1);
    expect(output).toContain('onOpenChange={setOpen}');
    expect(output).toContain('<PopoverContent>');
  });
});

describe('a lição do painel sem título', () => {
  it('sem PopoverTitle o painel DECLARA o próprio nome, por aria-label', () => {
    // Decisão da dona nesta campanha, e é o motivo de a variante `default`
    // existir: ela é o conteúdo livre. `role="dialog"` anônimo reprova no axe
    // por `aria-dialog-name`, e um nome herdado do gatilho anunciaria a porta em
    // vez do que há atrás dela.
    const output = popoverContentLivreSource();
    expect(output).toContain('<PopoverContent aria-label="Informações adicionais">');
    expect(output).not.toContain('PopoverTitle');
    expect(output).not.toContain('PopoverHeader');
  });

  it('com PopoverTitle o painel NÃO carrega aria-label — seriam dois contratos de nome', () => {
    for (const fn of [
      popoverSource,
      popoverCloseSource,
      popoverFormSource,
      popoverOpenSource,
      popoverModalSource,
      popoverEditarPerfilSource,
      popoverFilterSource,
      popoverPreferenciasSource,
      popoverAboveSource,
    ]) {
      const output = fn();
      expect(output).toContain('<PopoverTitle>');
      // Recorte no painel: a paleta usa `aria-label` nas amostras de cor, e uma
      // asserção solta casaria lá dentro.
      const openingTag = output.slice(
        output.indexOf('<PopoverContent'),
        output.indexOf('>', output.indexOf('<PopoverContent')),
      );
      expect(openingTag).not.toContain('aria-label');
    }
  });
});

describe('a lição do rodapé', () => {
  it('o par de ações é Cancelar ghost + ação primária, nessa ordem', () => {
    // A ação de descarte é a discreta e vem primeiro; a que confirma é a única
    // com peso visual, e o peso vem da AUSÊNCIA de `variant` — a primária é o
    // padrão do Button. Escrever `variant="default"` ali ensinaria ruído.
    const actions = footer(popoverSource());
    expect(actions).toContain('<Button variant="ghost" size="sm">Cancelar</Button>');
    // O Salvar carrega o `onClick` porque ele fecha por CÓDIGO — e é a
    // ausência de `PopoverClose` em volta dele que separa concluiu de desistiu.
    expect(actions).toContain('onClick={() => { salvar(); setOpen(false); }}>Salvar</Button>');
    expect(actions).not.toMatch(/<PopoverClose[^>]*>\s*<Button size="sm">Salvar/);
    expect(actions.match(/variant=/g)).toHaveLength(1);
  });

  it('as outras composições com rodapé seguem a mesma forma', () => {
    // O modal saiu desta lista em 2026-09-13: ele deixou de ter rodapé de ações.
    // Os dois botões que havia ali não fechavam nem faziam nada — existiam só
    // para haver dois focáveis —, e viraram caixas de marcação. O que o snippet
    // do modal precisa provar agora está no caso dele, em "composições e
    // estados".
    for (const [fn, primary] of [
      [popoverEditarPerfilSource, '<Button type="submit" size="sm">Atualizar</Button>'],
      [popoverFilterSource, 'onClick={() => { aplicar(); setOpen(false); }}>Aplicar</Button>'],
    ] as const) {
      const actions = footer(fn());
      expect(actions).toContain('variant="ghost"');
      expect(actions).toContain(primary);
      expect(actions.match(/variant=/g)).toHaveLength(1);
    }
  });
});

describe('a lição do controle de fechar', () => {
  /**
   * O mapa é declarado, e não inferido: construtor que ganha rodapé sem entrar
   * aqui reprova no caso de cobertura abaixo. É a forma que a lista de exclusão
   * do `source-snippets.test.ts` não tinha quando encolheu em silêncio.
   */
  // Quatro colunas, não duas. A terceira e a quarta são caminhos diferentes de
  // fechar por CÓDIGO, e a diferença entre eles e a peça é o que separa
  // desistiu de concluiu no relatório. Enquanto o teste media só "está dentro
  // de `PopoverClose`", um Salvar marcado como peça de fechar passava como
  // correto — e era o defeito.
  //
  // A quarta é do formulário, e é a que a rodada de 2026-09-13 acrescentou:
  // quem fecha ali é o `onSubmit`, DEPOIS do `preventDefault`, e nunca o
  // `onClick` do botão. Medir as duas com a mesma régua deixaria passar
  // justamente o defeito que o caso existe para cobrar — fechar no clique
  // desmonta o formulário antes do submit, e ignora o Enter num campo.
  const COM_FECHAR: Array<[() => string, string[], string[], string[], string[]]> = [
    // construtor, fecha pela PEÇA, fecha por CÓDIGO no clique, fecha no SUBMIT, não fecha
    [popoverSource, ['Cancelar'], ['Salvar'], [], []],
    [popoverCloseSource, ['Cancelar'], ['Salvar'], [], []],
    // O formulário da variante não tem rodapé: o submit é a única ação.
    [popoverFormSource, [], [], ['Atualizar'], []],
    [popoverEditarPerfilSource, ['Cancelar'], [], ['Atualizar'], []],
    // "Limpar" devolve a escolha a quem ainda está decidindo.
    [popoverFilterSource, [], ['Aplicar'], [], ['Limpar']],
    // O MODAL NÃO ENTRA AQUI, e a exclusão se declara em vez de acontecer por
    // omissão. Ele não tem mais ação nenhuma: os rótulos que a entrada listava
    // como "não fecham" — Cancelar e OK — deixaram de existir em 2026-09-13, e
    // uma entrada apontando para rótulo ausente PASSA calada (todas as sondas
    // abaixo devolvem `false` quando não acham o rótulo), que é portão sem
    // dentes. O invariante que sobrou é a AUSÊNCIA de controle de fechar, e ele
    // é cobrado com `not.toContain('PopoverClose')` no caso do modal, em
    // "composições e estados". A peneira de cobertura abaixo continua valendo:
    // se o modal voltar a ter rodapé de ações ou submit, ele volta a ser
    // exigido aqui.
  ];

  /** O bloco `<PopoverClose …>…</PopoverClose>` que envolve um rótulo, se houver. */
  function wrappedInClose(output: string, label: string): boolean {
    const i = output.indexOf(`>${label}<`);
    if (i === -1) return false;
    const openTag = output.lastIndexOf('<PopoverClose asChild>', i);
    if (openTag === -1) return false;
    const closeTag = output.indexOf('</PopoverClose>', openTag);
    return closeTag > i;
  }

  /** O rótulo cujo próprio botão fecha por código — `setOpen(false)` no clique. */
  function closesByCode(output: string, label: string): boolean {
    const i = output.indexOf(`>${label}<`);
    if (i === -1) return false;
    const start = output.lastIndexOf('<Button', i);
    if (start === -1) return false;
    return /onClick=\{[^}]*setOpen\(false\)/.test(output.slice(start, i));
  }

  /**
   * O rótulo que fecha pelo SUBMIT do formulário que o contém.
   *
   * Medição diferente da de cima porque o caminho é outro: o botão é
   * `type="submit"` e não carrega handler nenhum; quem fecha é o `<form>` em
   * volta, no `onSubmit`, e só DEPOIS do `preventDefault` — a ordem faz parte
   * da lição, porque fechar antes de barrar o envio recarregaria a página.
   */
  function closesBySubmit(output: string, label: string): boolean {
    const i = output.indexOf(`>${label}<`);
    if (i === -1) return false;
    const button = output.lastIndexOf('<Button', i);
    if (button === -1 || !output.slice(button, i).includes('type="submit"')) return false;
    const form = output.lastIndexOf('<form', i);
    if (form === -1) return false;
    return /onSubmit=\{[\s\S]*?preventDefault\(\)[\s\S]*?setOpen\(false\)/.test(
      output.slice(form, i),
    );
  }

  it.each(COM_FECHAR)('%# ensina quem fecha, por qual caminho, e quem não fecha', (fn, byPiece, byCode, bySubmit, neverClose) => {
    const output = fn();
    for (const label of byPiece) {
      expect(wrappedInClose(output, label), `"${label}" devia fechar PELA PEÇA`).toBe(true);
      expect(closesByCode(output, label), `"${label}" não devia fechar por código`).toBe(false);
    }
    for (const label of byCode) {
      expect(closesByCode(output, label), `"${label}" devia fechar POR CÓDIGO`).toBe(true);
      // O par que dá dentes: marcado como peça de fechar, ele reportaria
      // `close-button` e apagaria a distinção que o campo existe para carregar.
      expect(wrappedInClose(output, label), `"${label}" não devia ser peça de fechar`).toBe(false);
    }
    for (const label of bySubmit) {
      expect(closesBySubmit(output, label), `"${label}" devia fechar NO SUBMIT`).toBe(true);
      // Os dois pares que dão dentes a este caso. Fechar no clique é o defeito
      // que ele existe para pegar: desmonta o formulário antes do submit, e o
      // Enter num campo — metade dos envios — não fecharia nada.
      expect(closesByCode(output, label), `"${label}" não devia fechar no clique`).toBe(false);
      expect(wrappedInClose(output, label), `"${label}" não devia ser peça de fechar`).toBe(false);
    }
    for (const label of neverClose) {
      expect(wrappedInClose(output, label), `"${label}" não devia fechar`).toBe(false);
      expect(closesBySubmit(output, label), `"${label}" não devia fechar no submit`).toBe(false);
    }
    // Quem usa a peça importa a peça. O `source-snippets.test.ts` cobra que o
    // nome EXISTA no componente; aqui se cobra que ele seja importado quando o
    // snippet o escreve — e que não sobre import de peça que o snippet não usa.
    const importa = output.includes('  PopoverClose,');
    expect(importa).toBe(output.includes('<PopoverClose'));
  });

  it('todo construtor com rodapé de ações ou com submit está declarado no mapa acima', () => {
    // Cobertura, e não filtro: construtor novo com rodapé que ninguém declarar
    // reprova aqui, em vez de sair da varredura em silêncio.
    //
    // O `type="submit"` entrou na peneira junto com a coluna do submit: um
    // formulário sem rodapé — a variante Form é exatamente isso — não tem
    // `data-justify="end"` e escaparia da varredura calado, que é a forma como
    // o `source-snippets.test.ts` encolheu sem ninguém ver.
    const declared = new Set(COM_FECHAR.map(([fn]) => fn));
    for (const fn of ALL) {
      const output = fn();
      if (!output.includes('data-justify="end"') && !output.includes('type="submit"')) continue;
      expect(declared.has(fn), `${fn.name} tem ação de fechar e não está no mapa`).toBe(true);
    }
  });

  /**
   * O degrau que faltava, e o defeito que ele reprova é MUDO.
   *
   * Até 2026-09-13 três construtores — o transform do `meta`, o do fechar e o do
   * filtro — imprimiam a raiz NÃO controlada e um rodapé que chamava
   * `setOpen(false)`. Nada disso reprova: o snippet é string, o `tsc` não o
   * compila, e o preview ao lado fecha porque a STORY é controlada. Quem copiava
   * recebia um Salvar inerte — o mesmo defeito da campanha, agora no painel Code.
   *
   * Por isso a regra é do ARQUIVO e não dos três: construtor novo que feche por
   * código sem o par `open`/`onOpenChange` reprova aqui, em vez de esperar a
   * próxima revisão do componente.
   */
  it('quem fecha por CÓDIGO ensina a raiz controlada e o estado que a alimenta', () => {
    for (const fn of ALL) {
      const output = fn();
      if (!/\bset(?:Open|Aberto)\(false\)/.test(output)) continue;
      const root = output.match(/<Popover(?:\s[^>]*)?>/)?.[0];
      expect(root, `${fn.name}: snippet sem raiz <Popover>`).toBeTruthy();
      expect(root, `${fn.name}: fecha por código com a raiz NÃO controlada`).toMatch(/\sopen=\{/);
      expect(root, `${fn.name}: raiz controlada sem onOpenChange`).toMatch(/\sonOpenChange=\{/);
      // Raiz controlada com `defaultOpen` junto é controle morto: a lib lê
      // `open` e ignora o outro, e o snippet ensinaria uma prop que não faz nada.
      expect(root, `${fn.name}: defaultOpen numa raiz controlada`).not.toContain('defaultOpen');
      expect(output, `${fn.name}: fecha por código sem declarar o estado`).toMatch(
        /const \[\w+, set\w+\] = useState\(/,
      );
      expect(output, `${fn.name}: usa useState sem importar`).toContain(
        'import { useState } from "react";',
      );
    }
  });
});

describe('composições e estados', () => {
  it('o modo controlado ensina o par open + onOpenChange com estado de verdade', () => {
    const output = popoverControlledSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('const [aberto, setAberto] = useState(false);');
    expect(output).toContain('<Popover open={aberto} onOpenChange={setAberto}>');
    // Dois botões, e não um que alterna: o `pointerdown` do clique fora dispensa
    // o painel ANTES do `click`, e um alternador reabriria o que acabou de
    // fechar.
    expect(output).toContain('setAberto(true)');
    expect(output).toContain('setAberto(false)');
  });

  it('o modal declara os dois: a prisão de foco e a trava de rolagem vêm juntas', () => {
    const output = popoverModalSource();
    expect(output).toContain('<Popover defaultOpen modal>');

    // A AUSÊNCIA de controle de fechar é o assunto deste snippet, e é o que
    // sustenta a story ao lado: o gerenciador de foco da lib só trapeia com um
    // controle de fechar REGISTRADO no painel, então é a ausência que faz a
    // prisão vir do laço do `PopoverContent`. Com um `PopoverClose` aqui, o
    // exemplo ensinaria um painel cuja prisão vem da lib.
    expect(output).not.toContain('PopoverClose');

    // Os DOIS focáveis, e o motivo de serem dois: com um só, "o Tab do último
    // volta ao primeiro" seria verdade sem laço nenhum. São caixas de marcação
    // porque nada aqui pode fechar o painel — o par Cancelar/OK que este
    // snippet imprimiu até 2026-09-13 prometia ação que nenhum dos dois
    // entregava.
    expect(output.match(/<Checkbox /g)).toHaveLength(2);
    expect(output).toContain('Lembrar minha escolha');
    expect(output).toContain('Receber aviso por e-mail');
    expect(output).toContain('import { Checkbox } from "@/components/ui/checkbox";');
    expect(output).not.toContain('Cancelar');
    expect(output).not.toContain('>OK<');

    // Rótulo ligado por `htmlFor`/`id`, que é o par obrigatório do checkbox:
    // caixa sem rótulo associado é controle sem nome acessível.
    for (const id of ['lembrar-escolha', 'aviso-email']) {
      expect(output).toContain(`<Checkbox id="${id}" />`);
      expect(output).toContain(`<label htmlFor="${id}" className="nds-label">`);
    }
  });

  it('o aberto por estado inicial não escreve modal junto', () => {
    const output = popoverOpenSource();
    expect(output).toContain('<Popover defaultOpen>');
  });

  it('ancorado acima declara lado e distância, e cala o alinhamento padrão', () => {
    // A story ao lado escreve `align="center"` no `render` para deixar a
    // intenção explícita no canvas; o snippet não repete o padrão.
    expect(popoverAboveSource()).toContain('<PopoverContent side="top" sideOffset={12}>');
  });

  it('cada amostra de cor carrega o próprio rótulo — a cor não é o nome', () => {
    const output = popoverPaletteSource();
    for (const label of ['Primária', 'Secundária', 'Sucesso', 'Atenção', 'Informação', 'Destrutiva']) {
      expect(output).toContain(`aria-label="${label}"`);
    }
    // Botão sem texto nenhum reprova no axe por `button-name`.
    expect(output).not.toContain('aria-label=""');
  });

  it('as preferências são caixas independentes, não escolha única', () => {
    const output = popoverPreferenciasSource();
    expect(output).toContain('type="checkbox"');
    expect(output).not.toContain('type="radio"');
  });

  it('os formulários ligam rótulo e campo por id, e não por invólucro', () => {
    for (const fn of [popoverFormSource, popoverEditarPerfilSource]) {
      const output = fn();
      expect(output).toContain('import { Input } from "@/components/ui/input";');
      expect(output).toContain('import { Label } from "@/components/ui/label";');
      expect(output).toMatch(/<Label htmlFor="[^"]+"/);
    }
  });
});

describe('guardas transversais dos snippets', () => {
  it('nenhum snippet ensina a lib headless nem o andaime do arquivo de story', () => {
    for (const fn of ALL) {
      const output = fn();
      // O que se importa é o design system; a lib que o alimenta é detalhe de
      // implementação e trocá-la não pode mudar o que a doc ensina.
      expect(output).toContain('} from "@/components/ui/popover";');
      expect(output).not.toContain('@base-ui');
      // Andaime do canvas: quadro de posicionamento do painel portalizado e alvo
      // inerte da dispensa por clique fora.
      expect(output).not.toContain('minHeight');
      expect(output).not.toContain('contain:');
      expect(output).not.toContain('nds-min-h-');
      expect(output).not.toContain('Área externa');
      expect(output).not.toContain('data-slot=');
      expect(output).not.toContain('{...args}');
    }
  });

  it('todo painel nasce named — por título ou por aria-label, nunca por nada', () => {
    for (const fn of ALL) {
      const output = fn();
      const named = output.includes('<PopoverTitle>') || output.includes('aria-label="Informações');
      expect(named).toBe(true);
    }
  });
});
