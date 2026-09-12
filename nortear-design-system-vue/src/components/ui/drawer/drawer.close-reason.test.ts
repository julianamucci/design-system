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
