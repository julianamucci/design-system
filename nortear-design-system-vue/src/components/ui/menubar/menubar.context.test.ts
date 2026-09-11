import { describe, expect, it } from 'vitest';
import { closeReasonFor } from './menubar.context';

describe('closeReasonFor', () => {
  it('abrir um menu com a barra fechada não é fechamento', () => {
    expect(closeReasonFor('', 'file', null)).toBeUndefined();
    // Nem com anotação pendente: ela não tem fechamento a quem pertencer.
    expect(closeReasonFor('', 'file', 'overlay')).toBeUndefined();
  });

  it('o mesmo valor de novo não é fechamento', () => {
    expect(closeReasonFor('file', 'file', 'escape')).toBeUndefined();
  });

  it('fechar sem gesto anotado é a escolha de um item: api', () => {
    expect(closeReasonFor('file', '', null)).toBe('api');
  });

  it('fechar leva o motivo que o gesto anotou', () => {
    expect(closeReasonFor('file', '', 'escape')).toBe('escape');
    expect(closeReasonFor('file', '', 'overlay')).toBe('overlay');
  });

  it('passar ao menu vizinho é overlay, anotado ou não', () => {
    // A seta lateral não anota nada; o ponteiro no outro gatilho também não.
    // Uma anotação pendente, se houver, veio do gesto que abriu o vizinho.
    expect(closeReasonFor('file', 'edit', null)).toBe('overlay');
    expect(closeReasonFor('file', 'edit', 'escape')).toBe('overlay');
  });
});
