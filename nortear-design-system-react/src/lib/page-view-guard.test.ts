/**
 * Guarda do `page_view`.
 *
 * O contrato é curto e vale a pena travá-lo: um `page_view` por página VISTA,
 * não por efeito executado. Ele nasceu porque as docs pages do react passam
 * `breadcrumb` como array LITERAL, a identidade muda a cada render, e o efeito
 * de SEO re-rodava sempre — saía um `page_view` por seção rolada, colado em
 * cada `docs_section_viewed`. Quatro renders, quatro `page_view`, medido.
 *
 * A causa foi corrigida no `useSeoEffect`, mas a guarda ficou: cada stack tem
 * seu próprio sistema de reatividade, e qualquer outro motivo de re-execução
 * voltaria a inflar a métrica sem aviso nenhum.
 *
 * O teste vive no projeto `unit` porque a guarda é TS puro — estado de módulo e
 * comparação de string, sem DOM.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { esquecerUltimoPageView, pageViewInedito } from '@shared/primitives/page-view-guard';

beforeEach(() => {
  esquecerUltimoPageView();
});

describe('pageViewInedito', () => {
  it('a primeira vez de uma página dispara', () => {
    expect(pageViewInedito('a')).toBe(true);
  });

  it('a MESMA página não dispara de novo — é o defeito que a guarda existe para impedir', () => {
    expect(pageViewInedito('a')).toBe(true);
    expect(pageViewInedito('a')).toBe(false);
    expect(pageViewInedito('a')).toBe(false);
  });

  it('outra página dispara', () => {
    pageViewInedito('a');
    expect(pageViewInedito('b')).toBe(true);
  });

  it('voltar para uma página já vista dispara de novo, e deve — foi outra visita', () => {
    pageViewInedito('a');
    pageViewInedito('b');
    expect(pageViewInedito('a')).toBe(true);
  });

  it('a chave carrega URL, título, componente e idioma — trocar o idioma é outra página', () => {
    const base = ['http://x/?path=/docs/tooltip--docs', 'Tooltip · Design System', 'tooltip'];
    expect(pageViewInedito([...base, 'pt-BR'].join('|'))).toBe(true);
    expect(pageViewInedito([...base, 'pt-BR'].join('|'))).toBe(false);
    expect(pageViewInedito([...base, 'en'].join('|'))).toBe(true);
  });
});
