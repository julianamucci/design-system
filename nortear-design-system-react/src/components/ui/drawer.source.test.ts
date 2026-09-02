import { describe, expect, it } from 'vitest';
import {
  drawerOpenSource,
  drawerWithConfirmSource,
  drawerWithFormSource,
  drawerWithScrollSource,
  drawerControlledSource,
  drawerDireitaSource,
  drawerEsquerdaSource,
  drawerNotDispensavelSource,
  drawerSource,
  drawerTopoSource,
} from './drawer.source';

const ALL = [
  drawerSource,
  drawerTopoSource,
  drawerEsquerdaSource,
  drawerDireitaSource,
  drawerOpenSource,
  drawerControlledSource,
  drawerNotDispensavelSource,
  drawerWithFormSource,
  drawerWithConfirmSource,
  drawerWithScrollSource,
];

describe('drawerSource', () => {
  it('ensina a importação do design system, não a do primitivo', () => {
    const saida = drawerSource();
    expect(saida).toContain('} from "@/components/ui/drawer";');
    expect(saida).toContain('import { Button } from "@/components/ui/button";');
  });

  it('o gatilho entrega o próprio botão por asChild', () => {
    expect(drawerSource()).toContain('<DrawerTrigger asChild>');
  });

  it('título e descrição estão sempre lá — é deles que sai o nome acessível', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida).toContain('<DrawerTitle>');
      expect(saida).toContain('<DrawerDescription>');
    }
  });

  it('omite direction quando é bottom, o padrão do componente', () => {
    const saida = drawerSource(undefined, { args: { direction: 'bottom' } });
    expect(saida).toContain('<Drawer>');
    expect(saida).not.toContain('direction=');
  });

  it('escreve direction quando difere do padrão', () => {
    expect(drawerSource(undefined, { args: { direction: 'right' } })).toContain(
      '<Drawer direction="right">',
    );
  });

  it('não inventa direção fora da união', () => {
    expect(drawerSource(undefined, { args: { direction: 'diagonal' as never } })).toContain(
      '<Drawer>',
    );
  });

  it('dismissible e modal só aparecem quando a story os desliga', () => {
    const atDefaults = drawerSource(undefined, { args: { dismissible: true, modal: true } });
    expect(atDefaults).not.toContain('dismissible');
    expect(atDefaults).not.toContain('modal');

    const desligado = drawerSource(undefined, { args: { dismissible: false, modal: false } });
    expect(desligado).toContain('dismissible={false}');
    expect(desligado).toContain('modal={false}');
  });

  it('não deixa o espião de onOpenChange virar código', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = drawerSource(undefined, { args: { onOpenChange: spy } as never });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).not.toContain('onOpenChange');
  });
});

describe('direções', () => {
  it('cada uma diz a sua, porque o arquivo desliga os controls', () => {
    expect(drawerTopoSource()).toContain('<Drawer direction="top">');
    expect(drawerEsquerdaSource()).toContain('<Drawer direction="left">');
    expect(drawerDireitaSource()).toContain('<Drawer direction="right">');
  });

  it('nenhuma leva o defaultOpen que existe só para a captura visual', () => {
    for (const fn of [drawerTopoSource, drawerEsquerdaSource, drawerDireitaSource]) {
      expect(fn()).not.toContain('defaultOpen');
    }
  });
});

describe('estados', () => {
  it('abrir na montagem só é escrito onde É o assunto', () => {
    expect(drawerOpenSource()).toContain('<Drawer defaultOpen>');
  });

  it('o modo controlado ensina o par open + onOpenChange e dispensa o gatilho', () => {
    const saida = drawerControlledSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('const [aberto, setAberto] = useState(false);');
    expect(saida).toContain('<Drawer open={aberto} onOpenChange={setAberto}>');
    // Quem abre é o botão de fora: é isso que o modo controlado torna possível.
    expect(saida).not.toContain('<DrawerTrigger');
  });

  it('sem dispensa por gesto, a saída explícita é obrigatória', () => {
    const saida = drawerNotDispensavelSource();
    expect(saida).toContain('<Drawer dismissible={false}>');
    // Escape e overlay deixam de fechar; sem o botão do rodapé quem navega por
    // teclado ficaria preso no painel.
    expect(saida).toContain('<DrawerClose asChild>');
    expect(saida).toContain('Confirmar e fechar');
  });
});

describe('composições', () => {
  it('o formulário casa htmlFor com id em cada campo', () => {
    const saida = drawerWithFormSource();
    expect(saida).toContain('import { Label } from "@/components/ui/label";');
    expect(saida).toContain('<Label htmlFor="drawer-name">');
    expect(saida).toContain('<Input id="drawer-name"');
    expect(saida).toContain('<Label htmlFor="drawer-email">');
    expect(saida).toContain('<Input id="drawer-email"');
  });

  it('a confirmação põe a ação principal na variante destrutiva', () => {
    const saida = drawerWithConfirmSource();
    expect(saida).toContain('<Button variant="destructive">Remover</Button>');
    expect(saida).toContain('<Button variant="outline">Cancelar</Button>');
  });

  it('a rolagem mora no corpo, e o rodapé fica fora dele', () => {
    const saida = drawerWithScrollSource();
    expect(saida).toContain('<DrawerBody className="nds-text-body" aria-label="Lista de itens">');
    // O `tabIndex` da região rolável vem do próprio componente — escrevê-lo
    // aqui ensinaria a repetir à mão o que ele já faz. O `aria-label`, não: sem
    // ele o corpo fica sem papel, e é quem compõe que sabe o que há lá dentro.
    expect(saida).not.toContain('tabIndex');
    expect(saida.indexOf('<DrawerFooter>')).toBeGreaterThan(saida.indexOf('</DrawerBody>'));
  });
});

describe('guardas do painel', () => {
  it('nenhum snippet carrega o andaime do canvas da story', () => {
    for (const fn of ALL) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      expect(saida).not.toContain('minHeight');
      expect(saida).not.toContain('wrapperStyle');
      // Nenhum valor de design em style inline.
      expect(saida).not.toContain('style={{');
    }
  });
});
