import { describe, expect, it } from 'vitest';
import {
  dialogAbertoSource,
  dialogWithActionDestructiveSource,
  dialogComFormularioSource,
  dialogWithMidiaSource,
  dialogComRolagemSource,
  dialogControladoSource,
  dialogFecharNoRodapeSource,
  dialogPerfilSource,
  dialogSemBotaoFecharSource,
  dialogSemRodapeSource,
  dialogSource,
} from './dialog.source';

const TODAS = [
  dialogSource,
  dialogAbertoSource,
  dialogSemBotaoFecharSource,
  dialogFecharNoRodapeSource,
  dialogSemRodapeSource,
  dialogComFormularioSource,
  dialogPerfilSource,
  dialogComRolagemSource,
  dialogWithActionDestructiveSource,
  dialogWithMidiaSource,
  dialogControladoSource,
];

describe('dialogSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(dialogSource()).toContain('} from "@/components/ui/dialog";');
  });

  it('nenhum snippet ensina o mecanismo de tradução das stories', () => {
    // O `render` chama `useTranslation`; o painel imprimia
    // `t("demonstration.labels.title")` como se fosse a API do componente.
    for (const fn of TODAS) {
      expect(fn()).not.toContain('useTranslation');
      expect(fn()).not.toContain('demonstration.labels');
    }
  });

  it('o cabeçalho traz título E descrição, que são o nome e a descrição do painel', () => {
    const saida = dialogSource();
    expect(saida).toContain('<DialogTitle>Editar perfil</DialogTitle>');
    expect(saida).toContain('<DialogDescription>');
  });

  it('a ação primária é a ÚLTIMA do rodapé', () => {
    // `column-reverse` a põe no topo no estreito e à direita no largo, mas a
    // ordem de leitura e de foco é a do markup.
    const saida = dialogSource();
    const cancelar = saida.indexOf('Cancelar');
    const primaria = saida.indexOf('<Button>Salvar alterações</Button>');
    expect(cancelar).toBeGreaterThan(-1);
    expect(primaria).toBeGreaterThan(cancelar);
  });

  it('omite defaultOpen e modal quando são o padrão do componente', () => {
    const saida = dialogSource(undefined, { args: { defaultOpen: false, modal: true } });
    expect(saida).toContain('<Dialog>');
    expect(saida).not.toContain('defaultOpen');
    expect(saida).not.toContain('modal');
  });

  it('escreve as duas quando diferem do padrão', () => {
    const saida = dialogSource(undefined, { args: { defaultOpen: true, modal: false } });
    expect(saida).toContain('<Dialog defaultOpen modal={false}>');
  });

  it('não deixa o espião do onOpenChange virar código', () => {
    const espiao = (() => 'CORPO_DO_MOCK') as never;
    const saida = dialogSource(undefined, { args: { defaultOpen: espiao, modal: espiao } });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).toContain('<Dialog>');
  });
});

describe('composições estruturais', () => {
  it('aberto na montagem é o caminho NÃO controlado', () => {
    const saida = dialogAbertoSource();
    expect(saida).toContain('<Dialog defaultOpen>');
    expect(saida).not.toContain('onOpenChange');
  });

  it('sem o X do canto, a prop mora no Content — e Escape continua fechando', () => {
    const saida = dialogSemBotaoFecharSource();
    expect(saida).toContain('<DialogContent showCloseButton={false}>');
    // O Cancelar do rodapé permanece: nunca se tira toda saída de uma vez.
    expect(saida).toContain('<DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>');
  });

  it('fechar no rodapé usa a prop dos DOIS lugares, com papéis diferentes', () => {
    const saida = dialogFecharNoRodapeSource();
    expect(saida).toContain('<DialogContent showCloseButton={false}>');
    expect(saida).toContain('<DialogFooter showCloseButton>');
  });

  it('sem rodapé, o snippet não importa as peças que não usa', () => {
    const saida = dialogSemRodapeSource();
    expect(saida).not.toContain('<DialogFooter');
    expect(saida).not.toContain('DialogClose');
  });

  it('no formulário o rodapé fica DENTRO do form, e o cancelar não submete', () => {
    for (const fn of [dialogComFormularioSource, dialogPerfilSource]) {
      const saida = fn();
      const form = saida.indexOf('<form');
      const rodape = saida.indexOf('<DialogFooter>');
      const endForm = saida.indexOf('</form>');
      expect(rodape).toBeGreaterThan(form);
      expect(rodape).toBeLessThan(endForm);
      expect(saida).toContain('<Button type="button" variant="outline" />');
      expect(saida).toContain('<Button type="submit">');
    }
  });

  it('cada campo do formulário fecha o par htmlFor/id', () => {
    const saida = dialogComFormularioSource();
    expect(saida).toContain('<Label htmlFor="dialog-name">Nome</Label>');
    expect(saida).toContain('<Input id="dialog-name" defaultValue="Maria Silva" />');
    expect(saida).toContain('<Label htmlFor="dialog-email">E-mail</Label>');
    expect(saida).toContain('type="email"');
  });

  it('o perfil traz os campos do próprio fluxo', () => {
    const saida = dialogPerfilSource();
    expect(saida).toContain('<Label htmlFor="profile-username">Nome de usuário</Label>');
    expect(saida).toContain('defaultValue="@mariasilva"');
  });

  it('a região rolável entra na ordem de tabulação e tem nome', () => {
    // Sem `tabindex` quem navega só por teclado não consegue rolar a caixa; sem
    // nome, `role="region"` não é anunciada como região nenhuma.
    const saida = dialogComRolagemSource();
    expect(saida).toContain('tabIndex={0}');
    expect(saida).toContain('role="region"');
    expect(saida).toContain('aria-label="Conteúdo rolável"');
    expect(saida).toContain('nds-dialog-body-scroll');
  });

  it('a ação destrutiva usa a variante do botão, e o painel segue sendo dialog', () => {
    const saida = dialogWithActionDestructiveSource();
    expect(saida).toContain('<Button variant="destructive">Remover item</Button>');
    expect(saida).not.toContain('alertdialog');
  });

  it('a mídia carrega nome acessível e classes reais do sistema', () => {
    const saida = dialogWithMidiaSource();
    expect(saida).toContain('role="img"');
    expect(saida).toContain('aria-label="Imagem ilustrativa de pôr-do-sol"');
    expect(saida).toContain('nds-bg-muted');
    // Sem rodapé: não há o que confirmar.
    expect(saida).not.toContain('<DialogFooter');
  });

  it('o controlado traz o par open/onOpenChange e dispensa o gatilho', () => {
    // Com `open` e sem o callback o diálogo abre e nunca mais fecha: Escape,
    // overlay e X passam todos pelo dono do estado.
    const saida = dialogControladoSource();
    expect(saida).toContain('<Dialog open={aberto} onOpenChange={setAberto}>');
    expect(saida).not.toContain('DialogTrigger');
  });
});
