import { describe, expect, it } from 'vitest';
import {
  claimSinglePanel,
  openPanelCount,
  releasePanel,
  type SheetOpenEntry,
} from './sheet.single-panel';

/**
 * Um painel de mentira: só o verbo que o registro precisa chamar, com a
 * contagem ao lado.
 *
 * Sem `vi.fn()` de propósito. O tipo do mock do vitest não é atribuível a
 * `() => void` sem conversão, e quem reprovava isso era o `vue-tsc` — não a
 * suíte, que passava verde com o arquivo que não compilava. Contagem à mão não
 * tem esse problema e mede exatamente o mesmo.
 */
function makeEntry(): { entry: SheetOpenEntry; closes: () => number } {
  let count = 0;
  return {
    entry: { close: () => { count += 1; } },
    closes: () => count,
  };
}

describe('registro de painel único', () => {
  it('abrir o segundo recolhe o primeiro, e o primeiro não se recolhe sozinho', () => {
    const first = makeEntry();
    const second = makeEntry();

    claimSinglePanel(first.entry);
    expect(first.closes()).toBe(0);

    claimSinglePanel(second.entry);
    expect(first.closes()).toBe(1);
    // Recolher a si mesmo fecharia o painel que acabou de abrir.
    expect(second.closes()).toBe(0);

    releasePanel(first.entry);
    releasePanel(second.entry);
  });

  it('o conjunto é do MÓDULO: duas chamadas independentes enxergam o mesmo', () => {
    // A regressão que este caso existe para pegar: com o conjunto no escopo de
    // INSTÂNCIA (dentro do `<script setup>`), cada painel tinha o seu próprio,
    // a contagem nunca passava de 1 e nenhum recolhia o outro.
    const first = makeEntry();
    const second = makeEntry();

    claimSinglePanel(first.entry);
    expect(openPanelCount()).toBe(1);

    claimSinglePanel(second.entry);
    expect(openPanelCount()).toBe(2);

    releasePanel(first.entry);
    releasePanel(second.entry);
    expect(openPanelCount()).toBe(0);
  });

  it('soltar tira do conjunto, e quem abre depois não fecha um painel morto', () => {
    const gone = makeEntry();
    const next = makeEntry();

    claimSinglePanel(gone.entry);
    // O nó saiu da página com o painel aberto (troca de rota, story que
    // desmonta): sem soltar, o conjunto guardaria um registro morto.
    releasePanel(gone.entry);

    claimSinglePanel(next.entry);
    expect(gone.closes()).toBe(0);
    expect(openPanelCount()).toBe(1);

    releasePanel(next.entry);
  });
});
