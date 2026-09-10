/**
 * O `label` dos eventos `docs_*` é id estável, nunca texto.
 *
 * Os cinco rastreadores de docs page liam `data-track-label ?? textContent`, e
 * nas demonstrações auto-instrumentadas `aria-label ?? textContent`: o mesmo
 * clique chegava ao GA4 como "Salvar", "Save" e "Guardar". A decisão de quem
 * vai para o payload saiu das stacks e virou `resolverRotulo`, e é ela que
 * este arquivo cobra — no projeto `unit`, porque a função é TS puro.
 *
 * Os casos de texto recusado são os valores que de fato estavam nos call sites
 * em 2026-09-10, não exemplos inventados.
 */
import { describe, expect, it } from 'vitest';
import { ehIdEstavel, resolverRotulo } from '@shared/primitives/rotulo-de-rastreio';

describe('ehIdEstavel', () => {
  it.each(['salvar', 'import-primary', 'delivery-desc', 'acceptTerms', 'darkMode', 'sonner:demo:default', 'h2', '42'])(
    'aceita %s',
    (valor) => {
      expect(ehIdEstavel(valor)).toBe(true);
    },
  );

  it.each(['Salvar', 'Copiar código', 'Copiar import', 'Ver variant destructive', 'Anatomia', 'Badge', ' salvar', 'salvar ', '', '-salvar'])(
    'recusa %j — é texto de tela, não id',
    (valor) => {
      expect(ehIdEstavel(valor)).toBe(false);
    },
  );

  it('recusa ausência', () => {
    expect(ehIdEstavel(null)).toBe(false);
    expect(ehIdEstavel(undefined)).toBe(false);
  });
});

describe('resolverRotulo', () => {
  it('usa o declarado quando ele tem forma de id', () => {
    expect(resolverRotulo('trigger-default', 'default')).toEqual({ label: 'trigger-default' });
  });

  it('sem declarado, cai no primeiro id de reserva', () => {
    expect(resolverRotulo(null, 'salvar')).toEqual({ label: 'salvar' });
    expect(resolverRotulo('', 'salvar')).toEqual({ label: 'salvar' });
  });

  it('declarado com TEXTO é recusado, e o payload recebe o id de reserva', () => {
    // O caso que esta função existe para impedir: o texto nunca chega ao GA4,
    // e o descarte volta para o console de debug avisar.
    expect(resolverRotulo('Copiar código', 'copy')).toEqual({ label: 'copy', descartado: 'Copiar código' });
  });

  it('pula reserva sem forma de id até achar uma que tenha', () => {
    // No modo contêiner a primeira reserva pode ser um id gerado por lib.
    expect(resolverRotulo(null, ':r3:', 'button')).toEqual({ label: 'button' });
  });

  it('sem nada estável, manda vazio — nunca texto', () => {
    expect(resolverRotulo('Salvar', 'Outro Texto', null)).toEqual({ label: '', descartado: 'Salvar' });
  });
});
