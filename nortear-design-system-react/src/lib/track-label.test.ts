/**
 * O `label` dos eventos `docs_*` é id estável, nunca texto.
 *
 * Os cinco rastreadores de docs page liam `data-track-label ?? textContent`, e
 * nas demonstrações auto-instrumentadas `aria-label ?? textContent`: o mesmo
 * clique chegava ao GA4 como "Salvar", "Save" e "Guardar". A decisão de quem
 * vai para o payload saiu das stacks e virou `resolveTrackLabel`, e é ela que
 * este arquivo cobra — no projeto `unit`, porque a função é TS puro.
 *
 * Os casos de texto recusado são os valores que de fato estavam nos call sites
 * em 2026-09-10, não exemplos inventados.
 */
import { describe, expect, it } from 'vitest';
import { isStableId, resolveTrackLabel } from '@shared/primitives/track-label';

describe('isStableId', () => {
  it.each(['salvar', 'import-primary', 'delivery-desc', 'acceptTerms', 'darkMode', 'sonner:demo:default', 'h2', '42'])(
    'accepts %s',
    (value) => {
      expect(isStableId(value)).toBe(true);
    },
  );

  // Texto de tela, não id: maiúscula inicial, espaço, acento, borda em branco.
  it.each(['Salvar', 'Copiar código', 'Copiar import', 'Ver variant destructive', 'Anatomia', 'Badge', ' salvar', 'salvar ', '', '-salvar'])(
    'rejects %j',
    (value) => {
      expect(isStableId(value)).toBe(false);
    },
  );

  it('rejects absence', () => {
    expect(isStableId(null)).toBe(false);
    expect(isStableId(undefined)).toBe(false);
  });
});

describe('resolveTrackLabel', () => {
  it('uses the declared value when it is id-shaped', () => {
    expect(resolveTrackLabel('trigger-default', 'default')).toEqual({ label: 'trigger-default' });
  });

  it('falls back to the first id when nothing is declared', () => {
    expect(resolveTrackLabel(null, 'salvar')).toEqual({ label: 'salvar' });
    expect(resolveTrackLabel('', 'salvar')).toEqual({ label: 'salvar' });
  });

  it('rejects a declared TEXT and sends the fallback id instead', () => {
    // O caso que esta função existe para impedir: o texto nunca chega ao GA4,
    // e a recusa volta para o console de debug avisar.
    expect(resolveTrackLabel('Copiar código', 'copy')).toEqual({ label: 'copy', rejected: 'Copiar código' });
  });

  it('skips fallbacks that are not id-shaped', () => {
    // No modo contêiner a primeira reserva pode ser um id gerado por lib.
    expect(resolveTrackLabel(null, ':r3:', 'button')).toEqual({ label: 'button' });
  });

  it('sends empty — never text — when nothing is stable', () => {
    expect(resolveTrackLabel('Salvar', 'Outro Texto', null)).toEqual({ label: '', rejected: 'Salvar' });
  });
});
