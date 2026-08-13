import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSiteContent } from "@/hooks/useSiteContent";

/**
 * Mostra a chave/código PIX cadastrado pelo administrador (CMS → "PIX — QR Code")
 * com um botão de copiar. Renderiza abaixo da imagem do QR Code.
 */
const PixCopyKey = ({ className = "" }: { className?: string }) => {
  const { get } = useSiteContent();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const pixKey = (get("pix_qrcode", "pix_key") || "").trim();

  if (!pixKey) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      toast({ title: "PIX copiado!", description: "Cole no app do seu banco." });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="rounded-lg bg-muted p-2.5">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Chave PIX (copia e cola)</p>
        <p className="text-xs font-medium break-all text-foreground">{pixKey}</p>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
        {copied ? "PIX copiado!" : "Copiar PIX"}
      </Button>
    </div>
  );
};

export default PixCopyKey;
