import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { AlertDocs } from "@/components/docs/AlertDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDocs) },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
      description: "Variante visual nativa do Alert",
    },
  },
  args: {
    variant: "default",
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Alert {...args}>
      <Info aria-hidden="true" className="h-4 w-4" />
      <AlertTitle>Atenção</AlertTitle>
      <AlertDescription>
        Suas alterações serão aplicadas na próxima sessão.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Elemento alert está presente no DOM", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert).toBeInTheDocument();
    });

    await step("Alert está visível", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert).toBeVisible();
    });

    await step("AlertTitle é renderizado corretamente", async () => {
      const title = canvas.getByText("Atenção");
      await expect(title).toBeVisible();
    });

    await step("AlertDescription é renderizado corretamente", async () => {
      const desc = canvas.getByText(/Suas alterações serão aplicadas/);
      await expect(desc).toBeVisible();
    });

    await step("Variante default aplica classes corretas", async () => {
      const alert = canvas.getByRole("alert");
      await expect(alert).toHaveClass("bg-background");
    });
  },
};
