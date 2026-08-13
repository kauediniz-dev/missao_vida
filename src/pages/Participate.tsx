import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, HandCoins, Shirt, Copy, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import PixCopyKey from "@/components/PixCopyKey";
import { useToast } from "@/hooks/use-toast";
import campanhaAgasalho from "@/assets/campanha-agasalho.jpeg";
import heroBanner from "@/assets/hero-banner.png";

const actionsData: Record<string, { title: string; pixKey: string; pixName: string; image: string }> = {
  "campanha-do-agasalho": {
    title: "Campanha do Agasalho 2026",
    pixKey: "missaovida@pix.com",
    pixName: "Missão Vida",
    image: campanhaAgasalho,
  },
  "reforco-escolar-comunitario": {
    title: "Reforço Escolar Comunitário",
    pixKey: "missaovida@pix.com",
    pixName: "Missão Vida",
    image: heroBanner,
  },
  "mutirao-de-limpeza-do-rio": {
    title: "Mutirão de Limpeza do Rio",
    pixKey: "missaovida@pix.com",
    pixName: "Missão Vida",
    image: heroBanner,
  },
  "atendimento-medico-solidario": {
    title: "Atendimento Médico Solidário",
    pixKey: "missaovida@pix.com",
    pixName: "Missão Vida",
    image: heroBanner,
  },
};

const donationAmounts = [10, 25, 50, 100, 200, 500];

const Participate = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { get } = useSiteContent();
  const pixQrImage = get("pix_qrcode", "image");
  const action = slug ? actionsData[slug] : null;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showPix, setShowPix] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!action) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Ação não encontrada</h1>
          <Button variant="outline" onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const finalAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : 0);

  const generatePixPayload = (amount: number) => {
    // EMV PIX payload simplificado
    const key = action.pixKey;
    const name = action.pixName;
    const city = "SAO PAULO";
    const amountStr = amount.toFixed(2);

    // Simplified PIX copy-paste string
    return `00020126360014BR.GOV.BCB.PIX0114${key}5204000053039865404${amountStr}5802BR5913${name}6009${city}62070503***6304`;
  };

  const handleGeneratePix = () => {
    if (finalAmount <= 0) {
      toast({ title: "Selecione um valor", description: "Escolha ou digite um valor para doar." });
      return;
    }
    setShowPix(true);
  };

  const handleCopyPix = () => {
    const payload = generatePixPayload(finalAmount);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast({ title: "Código PIX copiado!", description: "Cole no app do seu banco para finalizar." });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative h-40 overflow-hidden">
        <img src={action.image} alt={action.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white rounded-full p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-primary-foreground/70 text-xs">Participar da ação</p>
          <h1 className="font-display text-lg font-bold text-white leading-tight">{action.title}</h1>
        </div>
      </div>

      <div className="px-4 py-5">
        <Tabs defaultValue="dinheiro" className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-12 rounded-xl">
            <TabsTrigger value="dinheiro" className="rounded-lg flex items-center gap-2 text-sm font-semibold">
              <HandCoins className="h-4 w-4" />
              Ajudar com Dinheiro
            </TabsTrigger>
            <TabsTrigger value="roupa" className="rounded-lg flex items-center gap-2 text-sm font-semibold">
              <Shirt className="h-4 w-4" />
              Doar Roupa
            </TabsTrigger>
          </TabsList>

          {/* === ABA DINHEIRO (PIX) === */}
          <TabsContent value="dinheiro" className="mt-5 space-y-5">
            {!showPix ? (
              <>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground mb-3">Escolha o valor da doação</h2>
                  <div className="grid grid-cols-3 gap-2.5">
                    {donationAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                        className={`py-3 rounded-xl border-2 text-center font-bold transition-all ${
                          selectedAmount === amount
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:border-primary/30"
                        }`}
                      >
                        R$ {amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-xl p-4 border border-border">
                  <label className="text-sm font-medium text-foreground mb-2 block">Outro valor</label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">R$</span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                      className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-foreground text-lg font-semibold placeholder:text-muted-foreground/50 border-0 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <Button className="w-full h-12" size="lg" onClick={handleGeneratePix}>
                  <QrCode className="h-5 w-5 mr-2" />
                  Gerar QR Code PIX
                </Button>
              </>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Valor da doação</p>
                  <p className="font-display text-3xl font-bold text-primary">
                    R$ {finalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl">
                    <img src={pixQrImage} alt="QR Code PIX" width={200} height={200} />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Escaneie o QR Code com o app do seu banco
                  </p>
                  <PixCopyKey />
                </div>

                <Button variant="outline" className="w-full h-12" onClick={handleCopyPix}>
                  {copied ? <Check className="h-5 w-5 mr-2" /> : <Copy className="h-5 w-5 mr-2" />}
                  {copied ? "Código copiado!" : "Copiar código PIX"}
                </Button>

                <Button variant="ghost" className="w-full" onClick={() => { setShowPix(false); setSelectedAmount(null); setCustomAmount(""); }}>
                  Alterar valor
                </Button>
              </div>
            )}
          </TabsContent>

          {/* === ABA DOAR ROUPA === */}
          <TabsContent value="roupa" className="mt-5 space-y-5">
            <div className="bg-card rounded-xl p-5 border border-border space-y-4">
              <h2 className="font-display text-base font-semibold text-foreground">📍 Pontos de coleta</h2>
              <div className="space-y-3">
                {[
                  { name: "Centro Comunitário Zona Sul", address: "Rua das Flores, 123 - Vila Nova", hours: "Seg a Sex, 9h - 17h" },
                  { name: "Igreja Missão Vida", address: "Av. Central, 456 - Centro", hours: "Seg a Sáb, 8h - 18h" },
                  { name: "Escola Municipal Dom Pedro II", address: "Rua Esperança, 789 - Jardim América", hours: "Seg a Sex, 10h - 16h" },
                ].map((point) => (
                  <div key={point.name} className="bg-muted/50 rounded-lg p-3">
                    <p className="font-semibold text-sm text-foreground">{point.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{point.address}</p>
                    <p className="text-xs text-primary font-medium mt-1">🕐 {point.hours}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 border border-border space-y-3">
              <h2 className="font-display text-base font-semibold text-foreground">👕 O que aceitamos</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Roupas em bom estado (limpas e sem rasgos)",
                  "Cobertores e agasalhos",
                  "Calçados em bom estado",
                  "Roupas infantis e adultas",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Button className="w-full h-12" size="lg" onClick={() => navigate("/mapa")}>
              Ver no mapa
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Participate;
