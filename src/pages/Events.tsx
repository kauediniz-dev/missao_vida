import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock, MapPin, XCircle, Users, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Events = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events" as any)
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["event_registrations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations" as any)
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const registeredIds = useMemo(
    () => new Set(registrations.map((r: any) => r.event_id)),
    [registrations]
  );

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("event_registrations" as any)
        .insert({ event_id: eventId, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_registrations"] });
      toast({ title: "Inscrição realizada!", description: "Você foi inscrito no evento." });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("event_registrations" as any)
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_registrations"] });
      toast({ title: "Inscrição cancelada" });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold text-primary-foreground">Eventos</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">
          Participe das ações e eventos da Missão Vida
        </p>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-3">
        {events.length === 0 ? (
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <PartyPopper className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground text-sm">Nenhum evento no momento</h3>
            <p className="text-xs text-muted-foreground mt-1">Volte em breve para conferir novidades</p>
          </div>
        ) : (
          events.map((ev: any) => {
            const isRegistered = registeredIds.has(ev.id);
            return (
              <div
                key={ev.id}
                className={`bg-card rounded-xl p-4 border shadow-sm transition-all ${
                  isRegistered ? "border-primary/40 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{ev.title}</h4>
                      {ev.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(`${ev.event_date}T00:00:00`).toLocaleDateString("pt-BR")}
                          {ev.time_slot ? ` • ${ev.time_slot}` : ""}
                        </span>
                      </div>
                      {ev.address && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{ev.address}</span>
                        </div>
                      )}
                      {ev.max_capacity && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{ev.max_capacity} vagas</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin ? (
                    <span className="text-xs text-muted-foreground italic whitespace-nowrap">
                      Admins não se inscrevem
                    </span>
                  ) : isRegistered ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5"
                      onClick={() => unregisterMutation.mutate(ev.id)}
                      disabled={unregisterMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => registerMutation.mutate(ev.id)}
                      disabled={registerMutation.isPending}
                    >
                      Inscrever-se
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Events;
