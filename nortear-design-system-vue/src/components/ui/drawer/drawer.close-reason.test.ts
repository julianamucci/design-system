import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  createDrawerCloseWatch,
  createDrawerDragWatch,
  drawerCloseReason,
  type DrawerCloseGesture,
} from './drawer.close-reason';

// A tabela inteira, e não um caso por categoria: quem ler este arquivo sabe o
// que cada gesto vira sem abrir a função.
describe('drawerCloseReason', () => {
  it.each([
    ['escape-key-down', 'escape'],
    ['pointer-down-outside', 'overlay'],
    // Arrastar para fora é a mesma decisão do clique no véu: "saí sem decidir".
    ['drag-dismiss', 'overlay'],
    ['confirm', 'api'],
  ] as const)('%s vira %s', (gesture, expected) => {
    expect(drawerCloseReason(gesture)).toBe(expected);
  });

  it('gesto ausente cai em close-button, e NÃO em api', () => {
    // É o que separa esta família da do Dialog: aqui o botão de sair do rodapé é
    // o que sobra, porque a lib não o anuncia por evento próprio. Lá o controle
    // de fechar tem anúncio, e o que sobra é o fechamento por código.
    expect(drawerCloseReason()).toBe('close-button');
    expect(drawerCloseReason(null)).toBe('close-button');
    expect(drawerCloseReason('gesto-novo-da-lib' as DrawerCloseGesture)).toBe('close-button');
  });

  it('as quatro palavras da família, e só elas', () => {
    const words = new Set(
      (
        [
          'escape-key-down',
          'pointer-down-outside',
          'drag-dismiss',
          'confirm',
        ] as DrawerCloseGesture[]
      ).map((gesture) => drawerCloseReason(gesture)),
    );
    words.add(drawerCloseReason(null));
    expect([...words].sort()).toEqual(['api', 'close-button', 'escape', 'overlay']);
  });
});

/**
 * `confirm` é EXCEÇÃO DECLARADA, e esta é a premissa dela.
 *
 * O gesto traduz para `api`, e nenhum caminho desta stack o produz hoje: o
 * primitivo aqui não tem fechamento imperativo (quem tem é a fábrica do
 * vanilla, por `close()`/`toggle()`), e a ação primária das prévias da docs
 * page não fecha o painel. §7 #21 do PRD registra isso como palavra sem
 * comportamento atrás.
 *
 * A palavra FICA porque a família inteira a tem: sem ela, "confirmou e fechou"
 * sairia como "apertou o botão de sair", e `DrawerCloseReason` deixaria de ser
 * o mesmo vocabulário de quatro palavras do `dialog_close` e do
 * `popover_close` — que é o que três portões (`reason_entre_stacks_divergente`,
 * `reason_da_familia_divergente`, `motivo_sintetizado_na_docs_page`) leem.
 *
 * O que não pode é a exceção ficar implícita, como ficou o filtro do
 * `source-snippets.test.ts`: ausência em silêncio é a forma de dívida que
 * ninguém relê. Então ela se declara AQUI, e os dois casos abaixo conferem a
 * premissa. No dia em que alguém ligar um produtor, o segundo caso reprova —
 * e aí a exceção deixou de valer: `api` passa a ser alcançável, e o que tem de
 * nascer junto é a asserção de que o fechamento por confirmação sai com esse
 * motivo.
 */
describe('o gesto `confirm` não tem produtor nesta stack — exceção declarada', () => {
  it('os produtores do módulo emitem três gestos, e `confirm` não é um deles', () => {
    const emitted: (DrawerCloseGesture | null)[] = [];
    const note = (gesture: DrawerCloseGesture | null) => emitted.push(gesture);

    const contentWatch = createDrawerCloseWatch(note);
    const dragWatch = createDrawerDragWatch(note);
    contentWatch.onEscapeKeyDown();
    contentWatch.onPointerDownOutside();
    dragWatch.onDrag();
    dragWatch.onRelease(true);
    dragWatch.onRelease(false);

    expect([...new Set(emitted)].filter((g) => g !== null).sort()).toEqual([
      'drag-dismiss',
      'escape-key-down',
      'pointer-down-outside',
    ]);
    expect(emitted).not.toContain('confirm');
  });

  it('e nenhum ponto da stack anota o gesto à mão', () => {
    // A varredura é o que impede a exceção de envelhecer em silêncio: quem
    // anotasse o gesto fora deste módulo passaria `'confirm'` para a função de
    // anotação, e é esta a forma que o padrão casa — `note('confirm')`,
    // `anotarGesto('confirm')`, `drawerCloseReason('confirm')`.
    //
    // Chave de tradução (`demonstration.labels.confirm`) não casa: ali a
    // palavra vem depois de um ponto, dentro de um caminho.
    const src = fileURLToPath(new URL('../../..', import.meta.url));
    const notePattern = /\(\s*['"]confirm['"]/;
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|vue)$/.test(entry.name)) continue;
        // Este arquivo cita o literal para poder cobrá-lo.
        if (entry.name === 'drawer.close-reason.test.ts') continue;
        if (notePattern.test(readFileSync(full, 'utf8'))) {
          offenders.push(full.slice(src.length).replace(/\\/g, '/'));
        }
      }
    };
    walk(src);

    expect(offenders).toEqual([]);
  });
});

describe('createDrawerCloseWatch', () => {
  it('cada emit do conteúdo anota o próprio gesto', () => {
    const note = vi.fn();
    const watch = createDrawerCloseWatch(note);

    watch.onEscapeKeyDown();
    watch.onPointerDownOutside();

    expect(note.mock.calls.map((c) => c[0])).toEqual([
      'escape-key-down',
      'pointer-down-outside',
    ]);
  });
});

describe('createDrawerDragWatch', () => {
  it('o arraste anota no ARRASTE, não na soltura', () => {
    // A lib fecha antes de anunciar a soltura (`closeDrawer(); emit('release',
    // false)`): anotado na soltura, o `update:open` já teria passado e o
    // fechamento sairia como `close-button`.
    const note = vi.fn();
    const watch = createDrawerDragWatch(note);

    watch.onDrag();

    expect(note).toHaveBeenCalledWith('drag-dismiss');
    expect(drawerCloseReason(note.mock.calls[0][0] as DrawerCloseGesture)).toBe('overlay');
  });

  it('soltura que MANTÉM o painel aberto limpa a anotação', () => {
    // Arraste curto, que volta ao repouso. Sem a limpeza, o próximo fechamento
    // pelo botão de sair herdaria `overlay` — um motivo que não é o dele.
    const note = vi.fn();
    const watch = createDrawerDragWatch(note);

    watch.onDrag();
    watch.onRelease(true);

    expect(note).toHaveBeenLastCalledWith(null);
    expect(drawerCloseReason(null)).toBe('close-button');
  });

  it('soltura que FECHA não mexe na anotação do arraste', () => {
    const note = vi.fn();
    const watch = createDrawerDragWatch(note);

    watch.onDrag();
    note.mockClear();
    watch.onRelease(false);

    expect(note).not.toHaveBeenCalled();
  });
});
