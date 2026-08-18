import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";
import { TriangleAlert } from "lucide-react";

const meta = {
  title: "UI/AlertDialog/Compositions",
  tags: ["overlay"],
  component: AlertDialog,
  parameters: {
    design: figmaDesign("alertDialog"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes canônicas: confirmação destrutiva, confirmação neutra, descrição longa e layout responsivo.",
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  parameters: {
    covers: ["visual.item6"],
    docs: {
      description: {
        story:
          "Bloco de mídia no topo do header. O CSS centraliza header e texto quando ele existe.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async () => {
    const dialog = await waitForPortal("alertdialog");
    await expect(dialog).toBeVisible();

    const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
    await expect(media).toHaveClass("nds-alert-dialog-media");

    // a mídia precisa ser o PRIMEIRO filho do header: o leitor de tela chega ao
    // título logo em seguida, e é dessa ordem que o :has() do CSS depende
    const header = dialog.querySelector('[data-slot="alert-dialog-header"]');
    await expect(header?.firstElementChild).toBe(media);
    await expect(media?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  },
};

// Mesmo exemplo da seção Variantes / destructive da docs page.
export const Destructive: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      description: {
        story:
          "Action e trigger usam a variante destructive do Button. Use para ações irreversíveis.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement, step }) => {
    await step("Diálogo abre com o conteúdo da variante destrutiva", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/Excluir conta/i);
    });

    await step("Trigger e Action compartilham a variante destructive", async () => {
      // Com o diálogo aberto o trigger fica sob aria-hidden/inert, fora das
      // queries por role — buscamos pelo slot.
      const trigger = canvasElement.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-trigger"]',
      );
      const action = await waitForPortal("button", { name: /^Excluir$/i });
      await expect(trigger).not.toBeNull();
      await expect(trigger).toHaveTextContent("Excluir conta");
      await expect(trigger).toHaveClass("nds-button-destructive");
      await expect(action).toHaveClass("nds-button-destructive");
    });

    await step("Cancel usa a variante outline (hierarquia secundária)", async () => {
      const cancel = await waitForPortal("button", { name: /^Cancelar$/i });
      await expect(cancel).toHaveClass("nds-button-outline");
    });
  },
};

// Mesmo exemplo da seção Variantes / default da docs page.
export const Neutral: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story:
          "Action com tokens padrão do Button. Use para confirmações que não são destrutivas (sair, publicar, arquivar).",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Sair da conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair da conta</AlertDialogTitle>
          <AlertDialogDescription>
            Você precisará entrar novamente para acessar seus dados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction>Sair</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ step }) => {
    await step("Diálogo abre com o conteúdo da variante neutra", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/Sair da conta/i);
    });

    await step("Action usa a variante default, sem severidade destrutiva", async () => {
      const action = await waitForPortal("button", { name: /^Sair$/i });
      await expect(action).toHaveClass("nds-button-default");
      await expect(action).not.toHaveClass("nds-button-destructive");
    });
  },
};

// testes.visual.item4 — descrição longa (mais de uma linha) sem quebrar o painel.
export const LongDescription: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      description: {
        story:
          "Descrição com duas frases completas. O painel cresce em altura e a descrição continua sendo a fonte do aria-describedby.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os seus dados, arquivos enviados, integrações ativas e o histórico
            completo de faturamento serão removidos permanentemente dos nossos
            servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança
            fica disponível depois da confirmação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ step }) => {
    await step("Descrição longa continua ligada por aria-describedby", async () => {
      const dialog = await waitForPortal("alertdialog");
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      );
      await expect(description).not.toBeNull();
      await expect(dialog).toHaveAttribute("aria-describedby", description!.id);
      await expect(dialog).toHaveAccessibleDescription(/nenhuma cópia de segurança/i);
    });

    await step("Descrição ocupa mais de uma linha sem estourar o painel", async () => {
      const dialog = await waitForPortal("alertdialog");
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      )!;
      const lineHeight = parseFloat(getComputedStyle(description).lineHeight);
      await expect(description.getBoundingClientRect().height).toBeGreaterThan(
        lineHeight * 1.5,
      );
      await expect(description.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    });
  },
};

// testes.accessibility.item8 — a descrição é opcional (anatomy.item6), e o
// caminho sem ela precisa de uma story: enquanto nenhuma omitia, a única prova
// de que o componente aguenta era a assinatura. O que se mede aqui não é a
// ausência do parágrafo — é que o painel deixa de declarar `aria-describedby`
// em vez de apontar para um id que não existe, o que o axe reprova em
// `aria-valid-attr-value` e o leitor de tela anuncia como nada.
export const WithoutDescription: Story = {
  parameters: {
    covers: ["accessibility.item8"],
    docs: {
      description: {
        story:
          "Confirmação sem descrição: o título sozinho já diz o que se perde. O painel mantém o nome acessível e fica sem descrição acessível — sem referência pendurada.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Descartar rascunho</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar rascunho</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Descartar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ step }) => {
    await step("O painel abre sem descrição e mantém o nome acessível", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.querySelector('[data-slot="alert-dialog-description"]'),
      ).toBeNull();
      await expect(dialog).toHaveAccessibleName(/Descartar rascunho/i);
    });

    await step("Nenhum aria-describedby pendurado", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).not.toHaveAttribute("aria-describedby");
      await expect(dialog).toHaveAccessibleDescription("");
    });

    await step("As duas saídas continuam presentes e alcançáveis", async () => {
      const dialog = await waitForPortal("alertdialog");
      const cancel = await waitForPortal("button", { name: /^Cancelar$/i });
      const action = await waitForPortal("button", { name: /^Descartar$/i });
      await expect(dialog.contains(cancel)).toBe(true);
      await expect(dialog.contains(action)).toBe(true);
    });
  },
};

// testes.visual.item5 — layout responsivo. O empilhamento dos botões vem de
// `flex-direction: column-reverse` abaixo de 40rem (nds/alert-dialog.css), então
// a captura precisa acontecer numa viewport estreita: daí os viewports do
// Chromatic. A play verifica a ordem no DOM, que é o que produz o empilhamento
// (Cancel primeiro no DOM, visualmente abaixo do Action em mobile).
export const Responsive: Story = {
  globals: { viewport: { value: "mobile1" } },
  parameters: {
    // Os dois sub-componentes que o Figma usa para simular o mobile: o eixo
    // Layout de cada um cobre o que aqui é media query.
    design: [
      figmaDesign("alertDialogHeader", "Cabeçalho"),
      figmaDesign("alertDialogFooter", "Rodapé"),
    ],
    covers: ["visual.item5"],
    chromatic: { viewports: [375] },
    docs: {
      description: {
        story:
          "Abaixo de 40rem o footer empilha os botões em column-reverse e o header centraliza. Acima disso os botões ficam lado a lado, alinhados à direita.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ step }) => {
    await step("Footer segue a ordem Cancel → Action no DOM", async () => {
      const dialog = await waitForPortal("alertdialog");
      const footer = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-footer"]',
      );
      await expect(footer).not.toBeNull();
      await expect(footer).toHaveClass("nds-alert-dialog-footer");

    // A story fixa a viewport em 320px. Abaixo de 40rem o footer empilha em
    // column-reverse — sem medir isso, a story só DESCREVIA o responsivo.
    await expect(window.matchMedia("(min-width: 40rem)").matches).toBe(false);
    await expect(getComputedStyle(footer!).flexDirection).toBe("column-reverse");
      const labels = Array.from(footer!.querySelectorAll("button")).map((b) =>
        b.textContent?.trim(),
      );
      await expect(labels).toEqual(["Cancelar", "Excluir"]);
    });

    await step("Painel respeita a margem lateral em qualquer largura", async () => {
      const dialog = await waitForPortal("alertdialog");
      const rect = dialog.getBoundingClientRect();
      await expect(rect.width).toBeLessThanOrEqual(window.innerWidth);
      await expect(rect.left).toBeGreaterThanOrEqual(0);
    });
  },
};

// A extensibilidade por classe é documentada em props.extensibility, e esta é
// a story que a exercita: antes, a única prova de que a classe chega ao painel
// e ao bloco de mídia era a prosa da docs page.
export const ExtraClass: Story = {
  parameters: {
    docs: { description: { story: "Extensibilidade por classe: o painel recorta o conteúdo no próprio raio e o bloco de mídia deixa de encolher. É o caminho descrito em props.extensibility — o design system não expõe classe utilitária de cor, mas painel e blocos aceitam classes de layout." } },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="nds-overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogMedia className="nds-shrink-0">
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async () => {
    const dialog = await waitForPortal("alertdialog");
    // Propriedade que o componente NÃO declara: utilities.css é importado antes
    // do CSS do componente, então classe utilitária de mesma especificidade
    // perde para a regra do painel — max-width, padding e cor não são
    // extensíveis por classe. Medido: nds-max-w-sm deixava o painel em 512px.
    await expect(getComputedStyle(dialog).overflow).toBe("hidden");
    const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
    await expect(media).toHaveClass("nds-alert-dialog-media");
    await expect(getComputedStyle(media as HTMLElement).flexShrink).toBe("0");
  },
};
