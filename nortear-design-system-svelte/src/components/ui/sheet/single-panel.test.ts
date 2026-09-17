import { describe, expect, it, vi } from 'vitest';
import { claimOpenSheet, releaseOpenSheet, type OpenSheetPanel } from './single-panel';

/**
 * O registro é TS puro e roda no projeto `unit` (node): a story de navegador
 * prova o painel recolhido na tela, e aqui se prova a regra que decide QUEM sai.
 *
 * Cada caso solta o que reivindicou — registro de módulo é estado compartilhado,
 * e um painel deixado na vez recolheria o primeiro painel do caso seguinte.
 */
function makePanel(): OpenSheetPanel & { dismiss: ReturnType<typeof vi.fn> } {
  const panel = { dismiss: vi.fn(() => releaseOpenSheet(panel)) };
  return panel;
}

describe('claimOpenSheet', () => {
  it('abrir o segundo recolhe o primeiro', () => {
    const first = makePanel();
    const second = makePanel();

    claimOpenSheet(first);
    expect(first.dismiss).not.toHaveBeenCalled();

    claimOpenSheet(second);
    expect(first.dismiss).toHaveBeenCalledTimes(1);
    expect(second.dismiss).not.toHaveBeenCalled();

    releaseOpenSheet(second);
  });

  it('o painel da vez não recolhe a si mesmo', () => {
    const only = makePanel();

    claimOpenSheet(only);
    claimOpenSheet(only);
    expect(only.dismiss).not.toHaveBeenCalled();

    releaseOpenSheet(only);
  });

  it('o recolhido solta a vez sem derrubar quem acabou de chegar', () => {
    // A ordem que este caso guarda: o `dismiss` do primeiro roda DEPOIS de o
    // segundo já estar no registro, e o `release` que ele dispara não pode
    // apagar o segundo — se apagasse, o terceiro painel não recolheria ninguém.
    const first = makePanel();
    const second = makePanel();
    const third = makePanel();

    claimOpenSheet(first);
    claimOpenSheet(second);
    claimOpenSheet(third);

    expect(second.dismiss).toHaveBeenCalledTimes(1);
    expect(third.dismiss).not.toHaveBeenCalled();

    releaseOpenSheet(third);
  });

  it('depois de todos soltos, o próximo a abrir não recolhe ninguém', () => {
    const first = makePanel();
    claimOpenSheet(first);
    releaseOpenSheet(first);

    const second = makePanel();
    claimOpenSheet(second);
    expect(first.dismiss).not.toHaveBeenCalled();

    releaseOpenSheet(second);
  });
});

describe('releaseOpenSheet', () => {
  it('soltura de quem já foi substituído não derruba o painel da vez', () => {
    const first = makePanel();
    const second = makePanel();

    claimOpenSheet(first);
    claimOpenSheet(second);
    // O primeiro já saiu; uma soltura atrasada dele (o desmonte do nó, que chega
    // depois) não pode esvaziar o registro.
    releaseOpenSheet(first);

    const third = makePanel();
    claimOpenSheet(third);
    expect(second.dismiss).toHaveBeenCalledTimes(1);

    releaseOpenSheet(third);
  });
});
