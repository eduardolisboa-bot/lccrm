import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { onlyDigits } from "@/lib/documentValidation";

interface Props {
  telefone?: string | null;
  variant?: "icon" | "button";
  label?: string;
}

function buildWhatsAppURL(tel: string): string {
  const d = onlyDigits(tel);
  return `https://wa.me/${d.startsWith("55") ? d : "55" + d}`;
}

export function WhatsAppButton({ telefone, variant = "button", label = "WhatsApp" }: Props) {
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!telefone) {
      toast.warning("Telefone não cadastrado para este cliente");
      return;
    }
    window.open(buildWhatsAppURL(telefone), "_blank", "noopener");
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handle}
        title="Abrir WhatsApp"
        className="text-[#25D366] hover:opacity-80 transition-opacity"
      >
        <MessageCircle className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handle} className="gap-2">
      <MessageCircle className="h-4 w-4 text-[#25D366]" />
      {label}
    </Button>
  );
}
