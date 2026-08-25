import { describe, expect, it } from 'vitest';
import {
  accordionWithBadgeSource,
  accordionWithIconSource,
  accordionControlledSource,
  accordionContentRichSource,
  accordionFaqSource,
  accordionClosedSource,
  accordionItemDisabledSource,
  accordionMultiploSource,
  accordionNoConfigSource,
  accordionSource,
} from './accordion.source';

describe('accordionSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = accordionSource();
    expect(saida).toContain('from "@/components/ui/accordion"');
    // As quatro peças juntas: sem o Item, o par gatilho/painel não tem dono.
    for (const part of ['Accordion,', 'AccordionContent,', 'AccordionItem,', 'AccordionTrigger,']) {
      expect(saida).toContain(part);
    }
  });

  it('o `value` do item aparece sempre — é ele que liga gatilho e painel', () => {
    expect(accordionSource()).toContain('<AccordionItem value="item-1">');
  });

  it('omite as props que são o padrão do componente', () => {
    const saida = accordionSource(undefined, {
      args: { multiple: false, disabled: false },
    });
    expect(saida).not.toContain('multiple');
    expect(saida).not.toContain('disabled');
  });

  it('escreve as props quando o control difere do padrão', () => {
    const saida = accordionSource(undefined, {
      args: { multiple: true, disabled: true },
    });
    expect(saida).toContain('multiple');
    expect(saida).toContain('disabled');
  });

  it('o espião de control não vira código no painel', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = accordionSource(undefined, {
      args: { multiple: spy as never, disabled: spy as never },
    });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).not.toContain('undefined');
  });
});

describe('modos', () => {
  it('sem configuração nenhuma: é a AUSÊNCIA de defaultValue que a story prova', () => {
    const saida = accordionNoConfigSource();
    expect(saida).toContain('<Accordion>');
    expect(saida).not.toContain('defaultValue');
    expect(saida).not.toContain('multiple');
  });

  it('múltiplo declara a prop que os args do arquivo não têm de onde ler', () => {
    expect(accordionMultiploSource()).toContain('<Accordion multiple');
  });

  it('controlado mostra o estado, que era o que o andaime da story escondia', () => {
    const saida = accordionControlledSource();
    expect(saida).toContain('import { useState } from "react";');
    // Array inclusive no modo único: sem isso quem lê tipa o useState errado.
    expect(saida).toContain('useState<string[]>(["item-1"])');
    expect(saida).toContain('value={abertos}');
    expect(saida).toContain('onValueChange={setAbertos}');
  });

  it('fechado não abre item nenhum', () => {
    expect(accordionClosedSource()).not.toContain('defaultValue');
  });

  it('desabilitado é do ITEM, ao lado de um item que funciona', () => {
    const saida = accordionItemDisabledSource();
    expect(saida).toContain('<AccordionItem value="item-2" disabled>');
    expect(saida).toContain('<AccordionItem value="item-1">');
    // A raiz continua habilitada: o recorte da story é a seção indisponível.
    expect(saida).toContain('<Accordion className="nds-max-w-lg">');
  });
});

describe('composições', () => {
  it('o ícone do gatilho sai da árvore de acessibilidade e o texto nomeia', () => {
    const saida = accordionWithIconSource();
    expect(saida).toContain('from "lucide-react"');
    expect(saida).toContain('aria-hidden="true"');
    // O respiro é do contêiner, nunca margem no ícone.
    expect(saida).toContain('className="nds-cluster" data-spacing="sm"');
    expect(saida).not.toContain('margin');
  });

  it('o badge no gatilho vem do design system, não de markup solto', () => {
    const saida = accordionWithBadgeSource();
    expect(saida).toContain('import { Badge } from "@/components/ui/badge";');
    expect(saida).toContain('<Badge variant="info">Beta</Badge>');
  });

  it('conteúdo rico usa tabela de verdade — o grid colapsa dentro do painel', () => {
    const saida = accordionContentRichSource();
    expect(saida).toContain('<table className="nds-w-full nds-text-body nds-border-collapse">');
    expect(saida).not.toContain('nds-grid');
  });

  it('o FAQ traz o array que o render itera, e o cabeçalho da seção', () => {
    const saida = accordionFaqSource();
    expect(saida).toContain('const perguntas = [');
    expect(saida).toContain('{perguntas.map(');
    expect(saida).toContain('<h2 className="nds-text-base nds-font-semibold">');
    expect(saida).toContain('key={value}');
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of [
      accordionSource,
      accordionNoConfigSource,
      accordionMultiploSource,
      accordionControlledSource,
      accordionClosedSource,
      accordionItemDisabledSource,
      accordionWithIconSource,
      accordionWithBadgeSource,
      accordionContentRichSource,
      accordionFaqSource,
    ]) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      // Nenhum valor de design em style inline: tudo por classe .nds-*.
      expect(saida).not.toContain('style={{');
    }
  });
});
