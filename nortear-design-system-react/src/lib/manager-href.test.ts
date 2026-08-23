/**
 * Guarda do link de componentes relacionados.
 *
 * As docs pages rodam dentro de `iframe.html`, e o href dos cards de
 * "Componentes Relacionados" era uma query solta: `?path=/docs/ui-tabs--docs`.
 * Query solta resolve contra o IFRAME, não contra o manager — o link ia para
 * `iframe.html?path=…`, o Storybook redirecionava, e a pessoa caía na docs page
 * CRUA: sem barra lateral, sem toolbar, sem seletor de tema nem de idioma.
 *
 * Ninguém pegou porque o link ABRIA o componente certo. O que sumia era a
 * moldura, e nenhum teste olhava a moldura — as 999 ocorrências em 237 arquivos
 * das cinco stacks tinham todas o mesmo defeito, e as suítes seguiam verdes.
 *
 * O teste vive no projeto `unit` porque `managerHref` é TS puro: não precisa de
 * DOM montado, só de um `location.pathname`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { managerHref } from '@shared/primitives/manager-href';

// O projeto `unit` roda em Node, sem DOM — e é justamente por isso que
// `managerHref` guarda `typeof window === 'undefined'`. Aqui o `window` é
// PLANTADO em vez de espiado: espiar exige que ele já exista.
function comPathname<T>(pathname: string, fn: () => T): T {
  vi.stubGlobal('window', { location: { pathname } });
  try {
    return fn();
  } finally {
    vi.unstubAllGlobals();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('managerHref', () => {
  it('sobe do iframe para o manager, que é a raiz', () => {
    const href = comPathname('/iframe.html', () => managerHref('?path=/docs/ui-tabs--docs'));
    expect(href).toBe('/?path=/docs/ui-tabs--docs');
    // O defeito original, dito na forma que ele tinha: o resultado NÃO pode
    // manter `iframe.html`, senão a moldura do Storybook não carrega.
    expect(href).not.toContain('iframe.html');
  });

  it('preserva o subcaminho quando o Storybook não é servido na raiz', () => {
    expect(comPathname('/design-system/iframe.html', () => managerHref('?path=/docs/ui-tabs--docs')))
      .toBe('/design-system/?path=/docs/ui-tabs--docs');
  });

  it('não mexe em caminho absoluto nem em URL completa', () => {
    // Quem escreveu um caminho já disse onde quer chegar; normalizar aqui
    // reescreveria destino externo.
    expect(comPathname('/iframe.html', () => managerHref('/?path=/docs/x--docs')))
      .toBe('/?path=/docs/x--docs');
    expect(comPathname('/iframe.html', () => managerHref('https://exemplo.com/x')))
      .toBe('https://exemplo.com/x');
  });
});
