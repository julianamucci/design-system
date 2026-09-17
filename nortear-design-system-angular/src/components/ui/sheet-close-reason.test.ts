import { describe, expect, it } from 'vitest';
import { sheetCloseReason, type SheetCloseReason } from './sheet-close-reason';

// A tabela INTEIRA do `RdxDialogOpenChangeReason` — as oito palavras da lib, e
// não um caso por categoria: quem ler este arquivo sabe o que cada motivo vira
// sem abrir a função. É a mesma tabela do `dialog-close-reason.test.ts` desta
// stack, e tem de continuar sendo: Dialog e Sheet alimentam o mesmo
// `dialog_close`, e as duas peças recebem o motivo pronto da MESMA lib.
describe('sheetCloseReason', () => {
  it.each([
    ['escape-key', 'escape'],
    ['outside-press', 'overlay'],
    ['focus-out', 'overlay'],
    ['close-press', 'close-button'],
    // Painel modal: o gatilho fica coberto pelo véu, e só código fecha por ele
    // — a diferença deliberada em relação ao popover, que o põe em `overlay`.
    ['trigger-press', 'api'],
    ['swipe', 'api'],
    // O caminho do `close()` público: a ação primária que confirma e sai, e o
    // recolhimento do painel anterior quando outro abre.
    ['imperative-action', 'api'],
    ['none', 'api'],
  ])('%s vira %s', (motivo, esperado) => {
    expect(sheetCloseReason(motivo)).toBe(esperado);
  });

  it('motivo desconhecido ou ausente cai em api, e nunca em close-button', () => {
    // Com `close-button` de padrão, o painel que confirmou e fechou chegaria ao
    // relatório como "apertou o botão de fechar" — o defeito que custou às
    // outras quatro stacks o arquivo equivalente a este.
    expect(sheetCloseReason(undefined)).toBe('api');
    expect(sheetCloseReason('qualquer-coisa-nova-da-lib')).toBe('api');
  });

  it('as quatro palavras da família, e só elas — todas alcançáveis', () => {
    const vocabulario: SheetCloseReason[] = ['escape', 'overlay', 'close-button', 'api'];
    const motivos = [
      'escape-key',
      'outside-press',
      'focus-out',
      'close-press',
      'trigger-press',
      'swipe',
      'imperative-action',
      'none',
    ];
    for (const motivo of motivos) {
      expect(vocabulario).toContain(sheetCloseReason(motivo));
    }
    // Vocabulário com palavra que nenhum caminho produz é dimensão morta no
    // GA4; palavra a mais é dimensão que a família não reconhece.
    expect(new Set(motivos.map(sheetCloseReason))).toEqual(new Set(vocabulario));
  });
});
