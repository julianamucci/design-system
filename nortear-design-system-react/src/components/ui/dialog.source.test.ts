import { describe, expect, it } from 'vitest';
import {
  dialogOpenSource,
  dialogHeadingH3Source,
  dialogWithActionDestructiveSource,
  dialogWithFormSource,
  dialogWithMidiaSource,
  dialogWithScrollSource,
  dialogControlledSource,
  footerDialogCloseSource,
  dialogPerfilSource,
  dialogNoButtonCloseSource,
  dialogNoFooterSource,
  dialogSource,
} from './dialog.source';

const ALL = [
  dialogSource,
  dialogOpenSource,
  dialogNoButtonCloseSource,
  footerDialogCloseSource,
  dialogNoFooterSource,
  dialogHeadingH3Source,
  dialogWithFormSource,
  dialogPerfilSource,
  dialogWithScrollSource,
  dialogWithActionDestructiveSource,
  dialogWithMidiaSource,
  dialogControlledSource,
];

describe('dialogSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(dialogSource()).toContain('} from "@/components/ui/dialog";');
  });

  it('nenhum snippet ensina o mecanismo de tradução das stories', () => {
    // O `render` chama `useTranslation`; o painel imprimia
    // `t("demonstration.labels.title")` como se fosse a API do componente.
    for (const fn of ALL) {
      expect(fn()).not.toContain('useTranslation');
      expect(fn()).not.toContain('demonstration.labels');
    }
  });

  it('o cabeçalho traz título E descrição, que são o nome e a descrição do painel', () => {
    const output = dialogSource();
    expect(output).toContain('<DialogTitle>Editar perfil</DialogTitle>');
    expect(output).toContain('<DialogDescription>');
  });

  it('a ação primária é a ÚLTIMA do rodapé', () => {
    // `column-reverse` a põe no topo no estreito e à direita no largo, mas a
    // ordem de leitura e de foco é a do markup.
    const output = dialogSource();
    const cancelar = output.indexOf('Cancelar');
    const primaria = output.indexOf('<Button>Salvar alterações</Button>');
    expect(cancelar).toBeGreaterThan(-1);
    expect(primaria).toBeGreaterThan(cancelar);
  });

  it('omite defaultOpen e modal quando são o padrão do componente', () => {
    const output = dialogSource(undefined, { args: { defaultOpen: false, modal: true } });
    expect(output).toContain('<Dialog>');
    expect(output).not.toContain('defaultOpen');
    expect(output).not.toContain('modal');
  });

  it('escreve as duas quando diferem do padrão', () => {
    const output = dialogSource(undefined, { args: { defaultOpen: true, modal: false } });
    expect(output).toContain('<Dialog defaultOpen modal={false}>');
  });

  it('não deixa o espião do onOpenChange virar código', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = dialogSource(undefined, { args: { defaultOpen: spy, modal: spy } });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('<Dialog>');
  });
});

describe('composições estruturais', () => {
  it('aberto na montagem é o caminho NÃO controlado', () => {
    const output = dialogOpenSource();
    expect(output).toContain('<Dialog defaultOpen>');
    expect(output).not.toContain('onOpenChange');
  });

  it('sem o X do canto, a prop mora no Content — e Escape continua fechando', () => {
    const output = dialogNoButtonCloseSource();
    expect(output).toContain('<DialogContent showCloseButton={false}>');
    // O Cancelar do rodapé permanece: nunca se tira toda saída de uma vez.
    expect(output).toContain('<DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>');
  });

  it('fechar no rodapé: X do canto desligado e o fechar vindo da prop do Footer', () => {
    const output = footerDialogCloseSource();
    expect(output).toContain('<DialogContent showCloseButton={false}>');
    // Quem emite o fechar é o próprio rodapé, e não um `DialogClose` escrito à
    // mão: a prop o coloca ANTES dos filhos e em `ghost`, que é a variante da
    // ação terciária. Enquanto ela cravava `outline`, todo call site a
    // contornava — e a prop ficou documentada sem uma story que a exercitasse.
    expect(output).toContain('<DialogFooter showCloseButton>');
    expect(output).not.toContain('DialogClose');
    // Valor padrão não se escreve: `closeLabel` já vale "Fechar".
    expect(output).not.toContain('closeLabel');
    // O snippet ensina a MESMA ordem que a story renderiza: secundários antes,
    // primária por último. Snippet que ensinasse o oposto da prévia seria pior
    // que snippet nenhum — e é a folha (`column-reverse`) que inverte a leitura.
    const footerAt = output.indexOf('<DialogFooter showCloseButton>');
    const backAt = output.indexOf('<Button variant="outline">Voltar</Button>');
    const continueAt = output.indexOf('<Button>Continuar</Button>');
    expect(footerAt).toBeGreaterThan(-1);
    expect(backAt).toBeGreaterThan(footerAt);
    expect(continueAt).toBeGreaterThan(backAt);
  });

  it('o cenário do fechar no rodapé bate com o da story, letra por letra', () => {
    const output = footerDialogCloseSource();
    for (const snippetText of [
      'Abrir guia',
      '<DialogTitle>Próximos passos</DialogTitle>',
      'Continue o fluxo ou volte ao início.',
      'O guia continua disponível no menu de ajuda.',
    ]) {
      expect(output).toContain(snippetText);
    }
  });

  it('sem rodapé, o snippet não importa as peças que não usa', () => {
    const output = dialogNoFooterSource();
    expect(output).not.toContain('<DialogFooter');
    expect(output).not.toContain('DialogClose');
  });

  it('o cenário sem rodapé bate com o da story, letra por letra', () => {
    const output = dialogNoFooterSource();
    for (const snippetText of [
      '<DialogTitle>Sobre este recurso</DialogTitle>',
      'Detalhes técnicos exibidos para fins informativos. Sem ações.',
      'O fechamento ocorre via X, Escape ou clique no overlay.',
    ]) {
      expect(output).toContain(snippetText);
    }
    // O gatilho REPETE o título; o "Saiba mais" era o cenário anterior desta
    // stack, e é ele que o alinhamento tirou.
    expect(output).not.toContain('Saiba mais');
  });

  it('no formulário o rodapé fica DENTRO do form, e o cancelar não submete', () => {
    for (const fn of [dialogWithFormSource, dialogPerfilSource]) {
      const output = fn();
      const form = output.indexOf('<form');
      const footer = output.indexOf('<DialogFooter>');
      const endForm = output.indexOf('</form>');
      expect(footer).toBeGreaterThan(form);
      expect(footer).toBeLessThan(endForm);
      expect(output).toContain('<Button type="button" variant="outline" />');
      expect(output).toContain('<Button type="submit">');
    }
  });

  it('cada campo do formulário fecha o par htmlFor/id', () => {
    const output = dialogWithFormSource();
    expect(output).toContain('<Label htmlFor="dialog-name">Nome</Label>');
    expect(output).toContain('<Input id="dialog-name" defaultValue="Maria Silva" />');
    expect(output).toContain('<Label htmlFor="dialog-email">E-mail</Label>');
    expect(output).toContain('type="email"');
  });

  it('o perfil traz os campos do próprio fluxo', () => {
    const output = dialogPerfilSource();
    expect(output).toContain('<Label htmlFor="profile-username">Nome de usuário</Label>');
    expect(output).toContain('defaultValue="@mariasilva"');
  });

  it('a região rolável entra na ordem de tabulação e tem nome', () => {
    // Sem `tabindex` quem navega só por teclado não consegue rolar a caixa; sem
    // nome, o papel não é anunciado — e o papel é `group`, não `region`:
    // marco aninhado num diálogo já nomeado não acrescenta navegação.
    const output = dialogWithScrollSource();
    expect(output).toContain('tabIndex={0}');
    expect(output).toContain('role="group"');
    expect(output).toContain('aria-label="Termos de uso"');
    expect(output).toContain('nds-dialog-body-scroll');
  });

  it('a ação destrutiva usa a variante do botão, e o painel segue sendo dialog', () => {
    const output = dialogWithActionDestructiveSource();
    expect(output).toContain('<Button variant="destructive">Remover item</Button>');
    expect(output).not.toContain('alertdialog');
  });

  it('a mídia carrega nome acessível e classes reais do sistema', () => {
    const output = dialogWithMidiaSource();
    expect(output).toContain('role="img"');
    expect(output).toContain('aria-label="Imagem ilustrativa de pôr-do-sol"');
    expect(output).toContain('nds-bg-muted');
    // Sem rodapé: não há o que confirmar.
    expect(output).not.toContain('<DialogFooter');
  });

  it('o controlado traz o par open/onOpenChange e dispensa o gatilho', () => {
    // Com `open` e sem o callback o diálogo abre e nunca mais fecha: Escape,
    // overlay e X passam todos pelo dono do estado.
    const output = dialogControlledSource();
    expect(output).toContain('<Dialog open={aberto} onOpenChange={setAberto}>');
    expect(output).not.toContain('DialogTrigger');
  });
});

describe('nível do cabeçalho', () => {
  it('o título sai em h3, e é a ÚNICA diferença para a composição padrão', () => {
    // O nível pertence à página: um painel aberto de dentro de uma seção já em
    // `h2` pede `h3` para não pôr dois irmãos onde há um pai e um filho.
    const output = dialogHeadingH3Source();
    expect(output).toContain('<DialogTitle render={<h3 />}>Editar perfil</DialogTitle>');
    expect(output).not.toContain('<DialogTitle>Editar perfil</DialogTitle>');
    // A descrição e o rodapé continuam os canônicos — trocar mais de uma coisa
    // faria o snippet ensinar que o nível pede outra composição.
    expect(output).toContain('<DialogDescription>');
    expect(output).toContain('<Button>Salvar alterações</Button>');
  });

  it('o snippet não ensina a mexer no aria-labelledby à mão', () => {
    // Quem nomeia o painel é o componente, pelo id do título; escrever o
    // atributo no exemplo ensinaria a duplicar o que já existe — e a errar.
    expect(dialogHeadingH3Source()).not.toContain('aria-labelledby');
  });
});
