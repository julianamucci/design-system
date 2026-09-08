import { describe, expect, it } from 'vitest';
import {
  sheetBottomPanelSource,
  sheetContentLongSource,
  sheetControlledSource,
  sheetFiltersSource,
  sheetNavigationSource,
  sheetNoButtonCloseSource,
  sheetOpenSource,
  sheetProfileEditSource,
  sheetSideBottomSource,
  sheetSideLeftSource,
  sheetSideRightSource,
  sheetSideTopSource,
  sheetSource,
} from './sheet.source';

/**
 * Todo transform exportado pelo módulo. A varredura genérica
 * (`source-snippets.test.ts`) prova que o snippet importa o que usa; o que ela
 * não alcança é se o snippet ensina o CERTO — e é o que os laços sobre esta
 * lista cobram de todos de uma vez.
 */
const ALL_SOURCES = [
  sheetSource,
  sheetSideRightSource,
  sheetSideLeftSource,
  sheetSideTopSource,
  sheetSideBottomSource,
  sheetOpenSource,
  sheetNoButtonCloseSource,
  sheetControlledSource,
  sheetFiltersSource,
  sheetNavigationSource,
  sheetProfileEditSource,
  sheetBottomPanelSource,
  sheetContentLongSource,
];

/** As quatro direções compartilham a mesma composição; só a borda muda. */
const SIDE_SOURCES = [
  sheetSideRightSource,
  sheetSideLeftSource,
  sheetSideTopSource,
  sheetSideBottomSource,
];

/**
 * Todos menos o controlado: lá quem abre é um botão que já existe no fluxo, e a
 * ausência do gatilho interno é o assunto da story.
 */
const WITH_TRIGGER = ALL_SOURCES.filter((fn) => fn !== sheetControlledSource);

const TRIGGER_TAG = '<SheetTrigger render={<Button variant="outline" />}>';

describe('sheetSource', () => {
  it('sem args, entrega a forma canônica do painel', () => {
    // O transform do `meta` cascateia para as stories sem args, então a chamada
    // vazia é o que o painel Code mostra em quase todo o arquivo.
    expect(sheetSource()).toBe(
      `import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>
    Abrir filtros
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>
        Configure os filtros para refinar os resultados.
      </SheetDescription>
    </SheetHeader>
    <SheetBody>
      <p className="nds-text-body nds-text-muted-foreground">
        Conteúdo do painel: formulário, lista ou mensagem. É esta área que rola
        quando o conteúdo passa da altura da tela.
      </p>
    </SheetBody>
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
    );
  });

  it('o corpo do Playground entra no snippet, e importado', () => {
    // O painel Code do Playground ensinava cabeçalho + rodapé enquanto a story
    // ao lado renderizava o SheetBody — a peça que separa "conteúdo longo" de
    // "ação fora de alcance" sumia justamente do exemplo canônico.
    const output = sheetSource();
    expect(output).toContain('  SheetBody,\n');
    expect(output).toContain('<SheetBody>');
    expect(output).toContain('<p className="nds-text-body nds-text-muted-foreground">');
  });

  it('o lado mora no conteúdo, nunca na raiz', () => {
    // Trocar de lugar é o erro clássico de quem copia: `side` na raiz é aceito
    // pelo compilador e não faz nada.
    const output = sheetSource(undefined, { args: { side: 'left' } });
    expect(output).toContain('<SheetContent side="left">');
    expect(output).toContain('<Sheet>');
  });

  it('não repete o que já é padrão do componente', () => {
    // A asserção é sobre a TAG INTEIRA: procurar `side=` solto casaria com o
    // `data-side` do markup e reprovaria por atributo correto.
    const output = sheetSource(undefined, {
      args: { side: 'right', showCloseButton: true, modal: true, defaultOpen: false },
    });
    expect(output).toContain('<Sheet>');
    expect(output).toContain('<SheetContent>');
  });

  it('desliga o que nasce ligado e liga o que nasce desligado', () => {
    const output = sheetSource(undefined, {
      args: { defaultOpen: true, modal: false, showCloseButton: false },
    });
    expect(output).toContain('<Sheet defaultOpen modal={false}>');
    expect(output).toContain('<SheetContent showCloseButton={false}>');
  });

  it('não inventa borda fora da união de lados', () => {
    // Control adulterado não vira atributo: o painel do Storybook é copiável, e
    // um `side` inexistente compilaria e não deslizaria de lugar nenhum.
    const output = sheetSource(undefined, { args: { side: 'diagonal' as never } });
    expect(output).toContain('<SheetContent>');
    expect(output).not.toContain('diagonal');
  });

  it('o rótulo do gatilho acompanha o control', () => {
    expect(sheetSource(undefined, { args: { triggerLabel: 'Abrir preferências' } })).toContain(
      `${TRIGGER_TAG}\n    Abrir preferências\n  </SheetTrigger>`,
    );
  });

  it('o espião de onOpenChange nunca vira código no painel', () => {
    // O Storybook entrega o callback como espião: interpolado, o corpo do mock
    // apareceria como se fosse código do design system.
    const spy = () => 'CORPO_DO_MOCK';
    const output = sheetSource(undefined, {
      args: { onOpenChange: spy, triggerLabel: spy as never } as never,
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).not.toContain('onOpenChange');
    // O rótulo cai no padrão em vez de interpolar a função.
    expect(output).toContain(`${TRIGGER_TAG}\n    Abrir filtros\n  </SheetTrigger>`);
  });
});

describe('o painel se nomeia em todos os exemplos', () => {
  it('título e descrição andam sempre juntos — é deles que sai o nome acessível', () => {
    // Um diálogo modal sem nome chega ao leitor de tela como região anônima; o
    // par existe em cada snippet porque cada snippet é copiável isolado.
    for (const fn of ALL_SOURCES) {
      const output = fn();
      expect(output, `${fn.name} deve nomear o painel`).toContain('<SheetTitle>');
      expect(output, `${fn.name} deve descrever o painel`).toContain('<SheetDescription>');
    }
  });

  it('o gatilho empresta as props ao botão que já existe na interface', () => {
    // `render` é o que mantém um só elemento focável e um só nome acessível —
    // envolver o botão criaria dois.
    for (const fn of WITH_TRIGGER) {
      expect(fn(), `${fn.name} deve montar o gatilho por render`).toContain(TRIGGER_TAG);
    }
  });
});

describe('transforms das stories de direção', () => {
  it('cada direção escreve o próprio lado, e no conteúdo', () => {
    // A direita escreve `side="right"` mesmo sendo o padrão do componente: nesta
    // story a direção É o assunto, e é o que o `render` ao lado passa. Quem
    // omite o padrão é o transform do `meta`, que descreve os controls.
    expect(sheetSideRightSource()).toContain('<SheetContent side="right">');
    expect(sheetSideLeftSource()).toContain('<SheetContent side="left">');
    expect(sheetSideTopSource()).toContain('<SheetContent side="top">');
    expect(sheetSideBottomSource()).toContain('<SheetContent side="bottom">');
  });

  it('o título nomeia a direção, igual ao que a story renderiza ao lado', () => {
    // As quatro stories leem `rightLabel`/`leftLabel`/`topLabel`/`bottomLabel`
    // do conteúdo compartilhado; snippet e preview têm de dizer a mesma coisa.
    // Sem transform próprio, Right caía no do `meta` e publicava o título do
    // Playground — "Filtros avançados" — ao lado de um painel chamado
    // "Painel direito".
    expect(sheetSideRightSource()).toContain('<SheetTitle>Painel direito</SheetTitle>');
    expect(sheetSideRightSource()).not.toContain('<SheetTitle>Filtros avançados</SheetTitle>');
    expect(sheetSideLeftSource()).toContain('<SheetTitle>Painel esquerdo</SheetTitle>');
    expect(sheetSideTopSource()).toContain('<SheetTitle>Painel superior</SheetTitle>');
    expect(sheetSideBottomSource()).toContain('<SheetTitle>Painel inferior</SheetTitle>');
  });

  it('a direção não arrasta outra composição junto', () => {
    // Trocar o conteúdo de uma direção para a outra faria parecer que a borda
    // pede outro desenho — o que muda é só de onde o painel desliza.
    for (const fn of SIDE_SOURCES) {
      const output = fn();
      expect(output, `${fn.name}`).toContain(`${TRIGGER_TAG}\n    Abrir filtros\n  </SheetTrigger>`);
      expect(output).toContain('<SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>');
      expect(output).toContain('<Button>Aplicar filtros</Button>');
    }
  });

  it('o defaultOpen das stories de direção é andaime e não entra no snippet', () => {
    // As quatro nascem abertas porque a regressão visual e o axe precisam do
    // painel no DOM — a direção não depende disso, e ensinar `defaultOpen` aqui
    // faria a borda parecer amarrada à abertura inicial.
    for (const fn of SIDE_SOURCES) {
      expect(fn(), `${fn.name}`).toContain('<Sheet>');
      expect(fn()).not.toContain('defaultOpen');
    }
  });
});

describe('transforms das stories de estado', () => {
  it('aberto na montagem é a mesma composição com a prop ligada', () => {
    // Aqui a abertura inicial É o assunto, e por isso `defaultOpen` aparece.
    const output = sheetOpenSource();
    expect(output).toContain('<Sheet defaultOpen>');
    // A story renderiza `side="right"`, que é o padrão: repeti-lo ensinaria ruído.
    expect(output).toContain('<SheetContent>');
  });

  it('sem o botão do canto, quem oferece a saída é o rodapé', () => {
    // A ausência só se sustenta porque sobra outro caminho para o ponteiro;
    // a story ao lado mostra exatamente um botão no rodapé.
    const output = sheetNoButtonCloseSource();
    expect(output).toContain('<SheetContent showCloseButton={false}>');
    expect(output).toContain('<SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>');
    expect(output).not.toContain('<Button>Aplicar filtros</Button>');
  });

  it('o controlado ensina o par de estado, e não o invólucro da story', () => {
    const output = sheetControlledSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('const [aberto, setAberto] = useState(false);');
    expect(output).toContain('<Sheet open={aberto} onOpenChange={setAberto}>');
    // `ControlledDemo` é o componente que a story cria só para hospedar o
    // `useState`; colado, ele não existe do lado de quem lê.
    expect(output).not.toContain('ControlledDemo');
    // Controlado e não-controlado não convivem: `defaultOpen` seria ignorado.
    expect(output).not.toContain('defaultOpen');
    // Sem gatilho interno: quem abre é o botão que já está no fluxo.
    expect(output).not.toContain('SheetTrigger');
  });

  it('o corpo longo importa o SheetBody, que é quem rola', () => {
    const output = sheetContentLongSource();
    expect(output).toContain('  SheetBody,\n');
    expect(output).toContain('<SheetBody className="nds-stack" data-spacing="sm">');
    // Mesma contagem da story: 24 é o que faz o corpo passar da altura do painel.
    expect(output).toContain('const PARAGRAFOS = Array.from({ length: 24 }, (_, i) => i + 1);');
    // A ação primária da story é aceitar os termos, não aplicar filtros.
    expect(output).toContain('<SheetTitle>Termos de uso</SheetTitle>');
    expect(output).toContain('<Button>Aceitar termos</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('os filtros moram num form dentro do corpo rolável', () => {
    const output = sheetFiltersSource();
    expect(output).toContain('<SheetBody>');
    // A tag inteira, e não `className="nds-stack"` solto: a classe se repete
    // nos campos, e a asserção por pedaço passaria mesmo com o form errado.
    // `nds-stack` com `sm` fora e `xs` no par rótulo ↔ campo é o ritmo do
    // Vanilla, referência de markup da casa — e o mesmo que a story renderiza.
    expect(output).toContain(
      `<form
        className="nds-stack"
        data-spacing="sm"
        onSubmit={(evento) => evento.preventDefault()}
      >`,
    );
    expect(output).toContain('<div className="nds-stack" data-spacing="xs">');
    expect(output).not.toContain('nds-grid');
    // O rótulo se liga ao campo pelo id, e não por proximidade visual.
    expect(output).toContain('<Label htmlFor="filtro-categoria">Categoria</Label>');
    expect(output).toContain('<Input id="filtro-categoria" defaultValue="Eletrônicos" />');
    // Os DOIS campos que o conteúdo compartilhado define, e nada mais: o
    // terceiro campo do snippet não existia no conteúdo nem na docs page.
    expect(output).toContain('<Label htmlFor="filtro-minimo">Preço mínimo</Label>');
    expect(output).not.toContain('Preço máximo');
    // Onde há formulário, a saída diz `type="button"`: aqui o rodapé é irmão
    // do corpo e o botão fica inerte de todo jeito, mas quem copia e aninha o
    // rodapé no `form` -- a forma preferida da guideline -- herdaria um cancelar
    // que ENVIA, porque o padrão do HTML para `<button>` é `submit`.
    expect(output).toContain(
      '<SheetClose render={<Button type="button" variant="outline" />}>Cancelar</SheetClose>',
    );
    const rotulos = [...output.matchAll(/<Label htmlFor="[^"]*">([^<]*)<\/Label>/g)].map(
      (m) => m[1],
    );
    expect(rotulos).toEqual(['Categoria', 'Preço mínimo']);
    // Campo que o exemplo usa é campo que o exemplo importa.
    expect(output).toContain('import { Input } from "@/components/ui/input";');
    expect(output).toContain('import { Label } from "@/components/ui/label";');
  });

  it('a navegação secundária abre à esquerda e não tem rodapé', () => {
    const output = sheetNavigationSource();
    expect(output).toContain('<SheetContent side="left">');
    // A `<nav>` nomeada é o que separa uma lista de links de uma navegação.
    expect(output).toContain('aria-label="Navegação secundária"');
    // As CINCO seções do conteúdo compartilhado, e destinos que são LINKS:
    // quatro botões `ghost` documentavam uma composição que não existe.
    expect(output).toContain(
      'const SECOES = ["Dashboard", "Projetos", "Equipe", "Configurações", "Faturas"];',
    );
    expect(output).toContain('<a\n            key={secao}\n            href="#"');
    expect(output).not.toContain('<Button key={secao} variant="ghost">');
    // Escolher um destino já fecha o painel: não há decisão a confirmar.
    expect(output).not.toContain('SheetFooter');
    expect(output).toContain(`${TRIGGER_TAG}\n    Abrir menu\n  </SheetTrigger>`);
    // O painel se nomeia pelo conteúdo compartilhado, não por um título solto.
    expect(output).toContain('<SheetTitle>Menu</SheetTitle>');
  });

  it('quem confirma a edição de perfil é o envio do formulário', () => {
    const output = sheetProfileEditSource();
    // O rodapé mora FORA do corpo rolável, então o botão não está dentro do
    // `form`: só o par id ↔ `form` os liga, e sem ele o Enter num campo — como
    // a maioria envia formulário curto — não chega a lugar nenhum.
    expect(output).toContain('<form\n        id="profile-form"');
    expect(output).toContain('<Button type="submit" form="profile-form">Salvar alterações</Button>');
    // Rótulo ligado ao campo pelo id, e não por proximidade visual.
    expect(output).toContain('<Label htmlFor="profile-name">Nome</Label>');
    expect(output).toContain('<Input id="profile-name" defaultValue="Juliana Mucci" />');
    expect(output).toContain('<Label htmlFor="profile-handle">Nome de usuário</Label>');
    expect(output).toContain('<Input id="profile-handle" defaultValue="@julianamucci" />');
    expect(output).toContain('<Label htmlFor="profile-bio">Bio</Label>');
    // A ORDEM é a mesma nas cinco stacks — nome, nome de usuário, bio. Sem esta
    // asserção o campo do meio podia voltar em qualquer lugar do formulário.
    expect(output.indexOf('profile-name')).toBeLessThan(output.indexOf('profile-handle'));
    expect(output.indexOf('profile-handle')).toBeLessThan(output.indexOf('profile-bio'));
    // Campo que o exemplo usa é campo que o exemplo importa.
    expect(output).toContain('import { Input } from "@/components/ui/input";');
    expect(output).toContain('import { Label } from "@/components/ui/label";');
    // A saída sem compromisso vem primeiro no DOM; confirmar é a última parada
    // do foco, e o SheetClose é quem fecha sem salvar. `type="button"` explicita
    // a intenção onde há formulário: o padrão do HTML para `<button>` é
    // `submit`, e quem aninhasse este rodapé no `form` herdaria um cancelar que
    // envia em vez de descartar.
    expect(output).toContain(
      '<SheetClose render={<Button type="button" variant="outline" />}>Cancelar</SheetClose>',
    );
  });

  it('o painel inferior deixa a ação destrutiva por último e sozinha na variante', () => {
    const output = sheetBottomPanelSource();
    expect(output).toContain('<SheetContent side="bottom">');
    expect(output).toContain('<Button variant="outline">Compartilhar</Button>');
    expect(output).toContain('<Button variant="outline">Duplicar</Button>');
    // Três destrutivos lado a lado tirariam o peso justamente do que precisa dele.
    expect(output).toContain('<Button variant="destructive">Excluir</Button>');
    expect(output).toContain('<SheetClose render={<Button variant="outline" />}>Fechar</SheetClose>');
    expect(output).toContain(`${TRIGGER_TAG}\n    Abrir ações\n  </SheetTrigger>`);
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('não vaza arg, decorator, tradução nem atributo de teste', () => {
    for (const fn of ALL_SOURCES) {
      const output = fn();
      // `args.` só existe dentro do `render` da story.
      expect(output, `${fn.name}`).not.toContain('args.');
      // `useTranslation` resolve rótulo, que é conteúdo de quem consome; os
      // snippets trazem o texto já em português.
      expect(output).not.toContain('useTranslation');
      expect(output).not.toContain('t("demonstration');
      // `data-slot` é gancho de teste e de folha, não algo que se escreve.
      expect(output).not.toContain('data-slot=');
      // O quadro com altura e `contain: layout` existe porque o painel é
      // portalizado e o Storybook precisa de moldura para a foto.
      expect(output).not.toContain('nds-min-h-80');
      expect(output).not.toContain('contain:');
      expect(output).not.toContain('waitForPortal');
    }
  });
});
