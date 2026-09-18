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
    const output = accordionSource();
    expect(output).toContain('from "@/components/ui/accordion"');
    // As quatro peças juntas: sem o Item, o par gatilho/painel não tem dono.
    for (const part of ['Accordion,', 'AccordionContent,', 'AccordionItem,', 'AccordionTrigger,']) {
      expect(output).toContain(part);
    }
  });

  it('o `value` do item aparece sempre — é ele que liga gatilho e painel', () => {
    expect(accordionSource()).toContain('<AccordionItem value="item-1">');
  });

  it('omite as props que são o padrão do componente', () => {
    const output = accordionSource(undefined, {
      args: { multiple: false, disabled: false },
    });
    expect(output).not.toContain('multiple');
    expect(output).not.toContain('disabled');
  });

  it('escreve as props quando o control difere do padrão', () => {
    const output = accordionSource(undefined, {
      args: { multiple: true, disabled: true },
    });
    expect(output).toContain('multiple');
    expect(output).toContain('disabled');
  });

  it('o espião de control não vira código no painel', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const output = accordionSource(undefined, {
      args: { multiple: spy as never, disabled: spy as never },
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).not.toContain('undefined');
  });
});

describe('modos', () => {
  it('sem configuração nenhuma: é a AUSÊNCIA de defaultValue que a story prova', () => {
    const output = accordionNoConfigSource();
    expect(output).toContain('<Accordion>');
    expect(output).not.toContain('defaultValue');
    expect(output).not.toContain('multiple');
  });

  it('múltiplo declara a prop que os args do arquivo não têm de onde ler', () => {
    expect(accordionMultiploSource()).toContain('<Accordion multiple');
  });

  it('controlado mostra o estado, que era o que o andaime da story escondia', () => {
    const output = accordionControlledSource();
    expect(output).toContain('import { useState } from "react";');
    // Array inclusive no modo único: sem isso quem lê tipa o useState errado.
    expect(output).toContain('useState<string[]>(["item-1"])');
    expect(output).toContain('value={abertos}');
    expect(output).toContain('onValueChange={setAbertos}');
  });

  it('fechado não abre item nenhum', () => {
    expect(accordionClosedSource()).not.toContain('defaultValue');
  });

  it('desabilitado é do ITEM, ao lado de um item que funciona', () => {
    const output = accordionItemDisabledSource();
    expect(output).toContain('<AccordionItem value="item-2" disabled>');
    expect(output).toContain('<AccordionItem value="item-1">');
    // A raiz continua habilitada: o recorte da story é a seção indisponível.
    expect(output).toContain('<Accordion className="nds-max-w-lg">');
  });
});

describe('composições', () => {
  it('o ícone do gatilho sai da árvore de acessibilidade e o texto nomeia', () => {
    const output = accordionWithIconSource();
    expect(output).toContain('from "lucide-react"');
    expect(output).toContain('aria-hidden="true"');
    // O respiro é do contêiner, nunca margem no ícone.
    expect(output).toContain('className="nds-cluster" data-spacing="sm"');
    expect(output).not.toContain('margin');
  });

  it('o badge no gatilho vem do design system, não de markup solto', () => {
    const output = accordionWithBadgeSource();
    expect(output).toContain('import { Badge } from "@/components/ui/badge";');
    expect(output).toContain('<Badge variant="info">Beta</Badge>');
  });

  it('conteúdo rico usa tabela de verdade — o grid colapsa dentro do painel', () => {
    const output = accordionContentRichSource();
    expect(output).toContain('<table className="nds-w-full nds-text-body nds-border-collapse">');
    expect(output).not.toContain('nds-grid');
  });

  it('o FAQ traz o array que o render itera, e o cabeçalho da seção', () => {
    const output = accordionFaqSource();
    expect(output).toContain('const perguntas = [');
    expect(output).toContain('{perguntas.map(');
    expect(output).toContain('<h2 className="nds-text-base nds-font-semibold">');
    expect(output).toContain('key={value}');
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
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      // Nenhum valor de design em style inline: tudo por classe .nds-*.
      expect(output).not.toContain('style={{');
    }
  });
});
