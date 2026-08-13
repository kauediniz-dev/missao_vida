import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, Copy, Check, QrCode, CheckCircle2, X } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import PixCopyKey from "@/components/PixCopyKey";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Action {
  id: string;
  title: string;
  description: string | null;
  action_date: string;
  location: string | null;
  entry_fee: number;
  pix_key: string;
  image_url: string | null;
}

interface Registration {
  id: string;
  action_id: string;
  payment_status: string;
}

const Volunteer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { get } = useSiteContent();
  const pixQrImage = get("pix_qrcode", "image");

  const [actions, setActions] = useState<Action[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [openAction, setOpenAction] = useState<Action | null>(null);
  const [step, setStep] = useState<"form" | "pix">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("volunteer_actions" as any)
      .select("*")
      .order("action_date", { ascending: true });
    setActions((data as any) || []);

    if (user) {
      const { data: regs } = await supabase
        .from("volunteer_registrations" as any)
        .select("id, action_id, payment_status")
        .eq("user_id", user.id);
      setRegistrations((regs as any) || []);
    }

    const { data: allRegs } = await supabase
      .from("volunteer_registrations" as any)
      .select("action_id");
    const c: Record<string, number> = {};
    ((allRegs as any[]) || []).forEach((r: any) => {
      c[r.action_id] = (c[r.action_id] || 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const isRegistered = (actionId: string) => registrations.some((r) => r.action_id === actionId);

  const generatePixPayload = (key: string, amount: number) => {
    const amountStr = amount.toFixed(2);
    return `00020126360014BR.GOV.BCB.PIX0114${key}5204000053039865404${amountStr}5802BR5913Missao Vida6009SAO PAULO62070503***6304`;
  };

  const startRegistration = (action: Action) => {
    if (!user) {
      toast({ title: "Faça login", variant: "destructive" });
      return;
    }
    setOpenAction(action);
    setStep("form");
    setName("");
    setPhone("");
    setCopied(false);
  };

  const handleSubmit = async () => {
    if (!openAction || !user) return;
    if (!name.trim() || name.trim().length > 100) {
      toast({ title: "Informe seu nome completo", variant: "destructive" });
      return;
    }
    if (phone && phone.length > 20) {
      toast({ title: "Telefone inválido", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("volunteer_registrations" as any).insert({
      action_id: openAction.id,
      user_id: user.id,
      full_name: name.trim(),
      phone: phone.trim() || null,
      payment_status: "pending",
      amount_paid: 0,
    } as any);
    if (error) {
      toast({ title: "Erro ao inscrever", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Inscrição realizada!", description: "Pague o ingresso via PIX para confirmar." });
    setStep("pix");
    load();
  };

  const handleCopy = (action: Action) => {
    const payload = generatePixPayload(action.pix_key, Number(action.entry_fee));
    navigator.clipboard.writeText(payload);
    setCopied(true);
    toast({ title: "Código PIX copiado!" });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCancel = async (actionId: string) => {
    if (!user) return;
    if (!confirm("Cancelar sua inscrição?")) return;
    const { error } = await supabase
      .from("volunteer_registrations" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("action_id", actionId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Inscrição cancelada" });
    load();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-primary-foreground">Voluntários</h1>
            <p className="text-primary-foreground/70 text-xs">Inscreva-se nas ações da ONG</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : actions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            Nenhuma ação disponível no momento.
          </div>
        ) : (
          actions.map((a) => {
            const registered = isRegistered(a.id);
            return (
              <div key={a.id} className="bg-card rounded-xl border border-border overflow-hidden space-y-3">
                {a.image_url && (
                  <img src={a.image_url} alt={a.title} className="w-full h-40 object-cover" />
                )}
                <div className={a.image_url ? "px-4 pb-4 space-y-3" : "p-4 space-y-3"}>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{a.title}</h3>
                  {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(a.action_date).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
                  </div>
                  {a.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {a.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    {counts[a.id] || 0} inscritos
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ingresso</span>
                  <span className="font-bold text-primary">R$ {Number(a.entry_fee).toFixed(2).replace(".", ",")}</span>
                </div>
                {registered ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm bg-success/10 rounded-lg px-3 py-2 border border-success/30">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-foreground">Você está inscrito ❤️</span>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => handleCancel(a.id)}>
                      <X className="h-4 w-4 mr-2" /> Cancelar inscrição
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full gradient-primary text-primary-foreground" onClick={() => startRegistration(a)}>
                    Inscrever-se
                  </Button>
                )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!openAction} onOpenChange={(o) => !o && setOpenAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{step === "form" ? "Inscrição de voluntário" : "Pagamento via PIX"}</DialogTitle>
          </DialogHeader>
          {openAction && step === "form" && (
            <div className="space-y-3">
              <div>
                <Label>Nome completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label>Telefone (opcional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="(11) 99999-9999" />
              </div>
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">Valor do ingresso</p>
                <p className="font-bold text-primary text-lg">
                  R$ {Number(openAction.entry_fee).toFixed(2).replace(".", ",")}
                </p>
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                Confirmar inscrição
              </Button>
            </div>
          )}
          {openAction && step === "pix" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Valor a pagar</p>
                <p className="font-display text-2xl font-bold text-primary">
                  R$ {Number(openAction.entry_fee).toFixed(2).replace(".", ",")}
                </p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <img src={pixQrImage} alt="QR Code PIX" width={180} height={180} />
                </div>
                <p className="text-xs text-muted-foreground text-center">Escaneie o QR Code no app do seu banco</p>
                <PixCopyKey />
                <p className="text-xs text-center">
                  <span className="text-muted-foreground">Chave PIX: </span>
                  <span className="font-medium break-all">{openAction.pix_key}</span>
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => handleCopy(openAction)}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copiado!" : "Copiar código PIX"}
              </Button>
              <Button className="w-full" onClick={() => setOpenAction(null)}>
                Concluir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Volunteer;
