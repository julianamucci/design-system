import { describe, expect, it } from 'vitest';
import {
  drawerOpenSource,
  drawerHeadingH3Source,
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
  drawerHeadingH3Source,
];

describe('drawerSource', () => {
  it('ensina a importação do design system, não a do primitivo', () => {
    const output = drawerSource();
    expect(output).toContain('} from "@/components/ui/drawer";');
    expect(output).toContain('import { Button } from "@/components/ui/button";');
  });

  it('o gatilho entrega o próprio botão por asChild', () => {
    expect(drawerSource()).toContain('<DrawerTrigger asChild>');
  });

  it('título e descrição estão sempre lá — é deles que sai o nome acessível', () => {
    // A abertura da tag é comparada por EXPRESSÃO, e não por texto: o título
    // aceita `asChild` para a página escolher o nível do cabeçalho, e um
    // `toContain('<DrawerTitle>')` deixaria de fora justamente o snippet que
    // exercita essa capacidade — passando a medir menos sem reprovar nada.
    for (const fn of ALL) {
      const output = fn();
      expect(output, `${fn.name}`).toMatch(/<DrawerTitle[\s>]/);
      expect(output).toContain('<DrawerDescription>');
    }
  });

  it('omite direction quando é bottom, o padrão do componente', () => {
    const output = drawerSource(undefined, { args: { direction: 'bottom' } });
    expect(output).toContain('<Drawer>');
    expect(output).not.toContain('direction=');
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
    const output = drawerSource(undefined, { args: { onOpenChange: spy } as never });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).not.toContain('onOpenChange');
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
    const output = drawerControlledSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('const [aberto, setAberto] = useState(false);');
    expect(output).toContain('<Drawer open={aberto} onOpenChange={setAberto}>');
    // Quem abre é o botão de fora: é isso que o modo controlado torna possível.
    expect(output).not.toContain('<DrawerTrigger');
  });

  it('o modo controlado ensina UM botão externo, e não um que ninguém clica', () => {
    // Com o painel modal aberto a lib põe `pointer-events: none` no `body`: um
    // "Fechar externamente" ao lado do "Abrir" fica inalcançável enquanto o
    // painel está na tela, e o snippet ensinaria um caminho que não existe.
    const output = drawerControlledSource();
    expect(output).not.toContain('Fechar externamente');
    expect(output).not.toContain('setAberto(false)');
    expect(output).toContain('onClick={() => setAberto(true)}');
  });

  it('sem dispensa por gesto, a saída explícita é obrigatória', () => {
    const output = drawerNotDispensavelSource();
    expect(output).toContain('<Drawer dismissible={false}>');
    // Escape e overlay deixam de fechar; sem o botão do rodapé quem navega por
    // teclado ficaria preso no painel.
    expect(output).toContain('<DrawerClose asChild>');
    expect(output).toContain('Confirmar e fechar');
  });
});

describe('composições', () => {
  it('o formulário casa htmlFor com id em cada campo', () => {
    const output = drawerWithFormSource();
    expect(output).toContain('import { Label } from "@/components/ui/label";');
    expect(output).toContain('<Label htmlFor="drawer-name">');
    expect(output).toContain('<Input id="drawer-name"');
    expect(output).toContain('<Label htmlFor="drawer-email">');
    expect(output).toContain('<Input id="drawer-email"');
  });

  it('religa a ação primária ao formulário, que é irmão do rodapé', () => {
    // `type="submit"` sem o `form` é botão INERTE: não envia pelo clique nem
    // pelo Enter num campo, e nada na tela denuncia. Com dois campos não há
    // submissão implícita para salvar o caso.
    const output = drawerWithFormSource();
    expect(output).toContain('id="drawer-form"');
    expect(output).toContain('<Button type="submit" form="drawer-form">');
    expect(output).not.toContain('<Button>Confirmar</Button>');
  });

  it('a confirmação põe a ação principal na variante destrutiva', () => {
    const output = drawerWithConfirmSource();
    expect(output).toContain('<Button variant="destructive">Remover</Button>');
    expect(output).toContain('<Button variant="outline">Cancelar</Button>');
  });

  it('a confirmação tem corpo, como a story e como a referência', () => {
    // As cinco stacks renderizam o MESMO painel de confirmação. O corpo existia
    // só em vanilla e svelte; sem esta guarda, o snippet do react podia voltar
    // a ensinar um painel que a página não mostra.
    const output = drawerWithConfirmSource();
    expect(output).toContain('<DrawerBody className="nds-text-body nds-text-muted-foreground">');
    expect(output).toContain('O anexo sai desta mensagem e continua na biblioteca.');
    expect(output).toContain('  DrawerBody,');
    expect(output.indexOf('<DrawerFooter>')).toBeGreaterThan(output.indexOf('</DrawerBody>'));
  });

  it('a rolagem mora no corpo, e o rodapé fica fora dele', () => {
    const output = drawerWithScrollSource();
    expect(output).toContain('<DrawerBody className="nds-text-body" aria-label="Lista de itens">');
    // O `tabIndex` da região rolável vem do próprio componente — escrevê-lo
    // aqui ensinaria a repetir à mão o que ele já faz. O `aria-label`, não: sem
    // ele o corpo fica sem papel, e é quem compõe que sabe o que há lá dentro.
    expect(output).not.toContain('tabIndex');
    expect(output.indexOf('<DrawerFooter>')).toBeGreaterThan(output.indexOf('</DrawerBody>'));
  });
});

describe('guardas do painel', () => {
  it('nenhum snippet carrega o andaime do canvas da story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      expect(output).not.toContain('minHeight');
      expect(output).not.toContain('wrapperStyle');
      // Nenhum valor de design em style inline.
      expect(output).not.toContain('style={{');
    }
  });
});

describe('nível do cabeçalho', () => {
  it('o título sai em h3 por asChild, e é a ÚNICA diferença para a composição padrão', () => {
    // O nível pertence à página: um painel aberto de dentro de uma seção já em
    // `h2` pede `h3` para não pôr dois irmãos onde há um pai e um filho.
    const output = drawerHeadingH3Source();
    expect(output).toContain('<DrawerTitle asChild>');
    expect(output).toContain('<h3>Editar perfil</h3>');
    expect(output).not.toContain('<DrawerTitle>Editar perfil</DrawerTitle>');
    // Descrição, gatilho e saída continuam os canônicos — trocar mais de uma
    // coisa ensinaria que o nível pede outra composição.
    expect(output).toContain('<DrawerDescription>Atualize seus dados.</DrawerDescription>');
    expect(output).toContain('<DrawerTrigger asChild>');
  });

  it('o snippet não ensina a mexer no aria-labelledby à mão', () => {
    // Quem nomeia o painel é o componente, pelo id do título; escrever o
    // atributo no exemplo ensinaria a duplicar o que já existe — e a errar.
    expect(drawerHeadingH3Source()).not.toContain('aria-labelledby');
  });
});
