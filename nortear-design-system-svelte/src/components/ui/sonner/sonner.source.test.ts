import { describe, expect, it } from 'vitest';
import {
  sonnerAvisoSource,
  sonnerCarregandoSource,
  sonnerComAcaoSource,
  sonnerComDescricaoSource,
  sonnerEmpilhadoSource,
  sonnerErroSource,
  sonnerInfoSource,
  sonnerPadraoSource,
  sonnerPersistenteSource,
  sonnerPosicaoSource,
  sonnerPrazoSource,
  sonnerPromessaSource,
  sonnerSemRegiaoSource,
  sonnerSource,
  sonnerSucessoSource,
  sonnerTemaEscuroSource,
} from './sonner.source';

describe('sonnerSource', () => {
  it('sem args, entrega o par completo: o gatilho e a região montada uma vez', () => {
    expect(sonnerSource()).toBe(
      `<script lang="ts">
  import { toast } from "svelte-sonner";
  import { Toaster } from "@/components/ui/sonner";
  import { Button } from "@/components/ui/button";
</script>

<Button variant="outline" onclick={() => toast.success("Alterações salvas.")}>
  Disparar notificação
</Button>

<!-- Uma vez, na raiz da aplicação -->
<Toaster position="top-right" richColors />`,
    );
  });

  it('acompanha o control de tipo — o neutro é a função nua, sem sufixo', () => {
    expect(sonnerSource('', { args: { type: 'default' } })).toContain('toast("Alterações salvas.")');
    expect(sonnerSource('', { args: { type: 'error' } })).toContain('toast.error(');
    expect(sonnerSource('', { args: { type: 'loading' } })).toContain('toast.loading(');
  });

  it('acompanha o control de título', () => {
    expect(sonnerSource('', { args: { title: 'Item excluído.' } })).toContain('"Item excluído."');
  });

  it('descrição e ação viram objeto de opções numa função nomeada', () => {
    const comAmbos = sonnerSource('', {
      args: { description: 'Detalhes.', actionLabel: 'Desfazer' },
    });
    expect(comAmbos).toContain('function avisar()');
    expect(comAmbos).toContain('description: "Detalhes.",');
    expect(comAmbos).toContain('action: { label: "Desfazer", onClick: desfazer },');
    // Sem opções não há função: o gatilho é a própria chamada, em linha.
    expect(sonnerSource()).not.toContain('function avisar()');
  });

  it('a posição é sempre explícita, e closeButton só quando difere do padrão', () => {
    expect(sonnerSource('', { args: { position: 'bottom-center' } })).toContain(
      'position="bottom-center"',
    );
    expect(sonnerSource()).not.toContain('closeButton');
    expect(sonnerSource('', { args: { closeButton: true } })).toContain('closeButton');
  });

  it('richColors e duration só aparecem quando diferem do padrão', () => {
    expect(sonnerSource('', { args: { richColors: false } })).not.toContain('richColors');
    expect(sonnerSource('', { args: { duration: 4000 } })).not.toContain('duration');
    expect(sonnerSource('', { args: { duration: 8000 } })).toContain('duration={8000}');
  });
});

describe('transforms dos tipos', () => {
  it('o tipo neutro chama a função nua', () => {
    expect(sonnerPadraoSource()).toContain('toast("Código copiado.")');
  });

  it('cada tipo semântico chama o seu próprio método', () => {
    expect(sonnerSucessoSource()).toContain('toast.success("Alterações salvas.")');
    expect(sonnerErroSource()).toContain('toast.error(');
    expect(sonnerAvisoSource()).toContain('toast.warning(');
    expect(sonnerInfoSource()).toContain('toast.info(');
    expect(sonnerCarregandoSource()).toContain('toast.loading(');
  });

  it('o aviso não se disfarça de falha', () => {
    expect(sonnerAvisoSource()).not.toContain('toast.error(');
  });
});

describe('transforms dos estados', () => {
  it('o prazo é escrito na REGIÃO, e não na chamada', () => {
    const saida = sonnerPrazoSource();
    expect(saida).toContain('<Toaster position="top-right" richColors duration={4000} />');
    expect(saida).not.toContain('duration:');
  });

  it('a pilha aberta pede expand, com três chamadas na mesma função', () => {
    const saida = sonnerEmpilhadoSource();
    expect(saida).toContain('expand');
    expect(saida.match(/ {2}toast/g)).toHaveLength(3);
  });

  it('a posição escolhida chega à região', () => {
    expect(sonnerPosicaoSource()).toContain('position="bottom-center"');
  });

  it('o caso sem região não monta Toaster nenhum', () => {
    const saida = sonnerSemRegiaoSource();
    expect(saida).not.toContain('<Toaster');
    expect(saida).toContain('toast.success(');
  });

  it('o tema escuro põe os cinco tipos na tela, com a pilha aberta', () => {
    const saida = sonnerTemaEscuroSource();
    expect(saida).toContain('theme="dark"');
    expect(saida).toContain('expand');
    expect(saida.match(/ {2}toast/g)).toHaveLength(5);
  });
});

describe('transforms das composições', () => {
  it('a descrição entra como opção da chamada', () => {
    expect(sonnerComDescricaoSource()).toContain('description:');
  });

  it('a ação embutida carrega rótulo e callback', () => {
    expect(sonnerComAcaoSource()).toContain('action: { label: "Desfazer", onClick: desfazer },');
  });

  it('a promessa declara os três desfechos numa chamada só', () => {
    const saida = sonnerPromessaSource();
    expect(saida).toContain('toast.promise(');
    expect(saida).toContain('loading:');
    expect(saida).toContain('success:');
    expect(saida).toContain('error:');
  });

  it('a persistente junta prazo infinito e botão de fechar', () => {
    const saida = sonnerPersistenteSource();
    expect(saida).toContain('duration: Number.POSITIVE_INFINITY,');
    expect(saida).toContain('closeButton');
  });
});
