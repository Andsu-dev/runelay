import { Key01Icon } from "@hugeicons/core-free-icons";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/action/button";
import { EmptyState } from "@/components/ui/display/empty-state";

export function OverviewEmpty() {
  return (
    <EmptyState
      icon={Key01Icon}
      title="Nenhuma chamada ainda"
      description="Crie uma chave de API e conecte seu primeiro agente. As chamadas aparecem aqui."
      action={
        <Link to="/api-keys" className={buttonVariants({ size: "sm" })}>
          Criar chave de API
        </Link>
      }
    />
  );
}
