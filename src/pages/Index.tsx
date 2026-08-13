import { Heart, TrendingUp, Users, ExternalLink, HandHeart } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBanner from "@/assets/hero-banner.png";
import { useSiteContent } from "@/hooks/useSiteContent";
import { toEmbedUrl } from "@/lib/siteContent";
import { Button } from "@/components/ui/button";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  link_url: string | null;
  link_label: string | null;
  created_at: string;
};

const Index = () => {
  const { get } = useSiteContent();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("news" as any)
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setNews((data as any) || []);
    };
    load();
    const channel = supabase
      .channel("news_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "news" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = [
    { label: get("home_stats", "stat1_label"), value: get("home_stats", "stat1_value"), icon: Heart },
    { label: get("home_stats", "stat2_label"), value: get("home_stats", "stat2_value"), icon: Users },
    { label: get("home_stats", "stat3_label"), value: get("home_stats", "stat3_value"), icon: TrendingUp },
  ];

  const heroImage = get("home_hero", "image") || heroBanner;
  const videoUrl = toEmbedUrl(get("home_documentary", "video_url"));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img src={heroImage} alt="Voluntários em ação" className="h-full w-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-primary-foreground/80 text-xs font-medium tracking-wide uppercase mb-1">
            {get("home_hero", "eyebrow")}
          </p>
          <h1 className="font-display text-2xl font-bold text-primary-foreground leading-tight whitespace-pre-line">
            {get("home_hero", "title")}
          </h1>
        </div>
      </div>

      <div className="px-4 -mt-5 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card rounded-xl p-3 text-center shadow-sm border border-border animate-scale-in">
              <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="font-display text-lg font-bold text-foreground">{value}</p>
              <p className="text-[0.6rem] text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Notícias */}
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            {get("home_documentary", "section_title")}
          </h2>
          <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border">
            {videoUrl && (
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={videoUrl}
                  title="Documentário Institucional"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <div className="p-3">
              <p className="text-sm text-muted-foreground">{get("home_documentary", "description")}</p>
            </div>
          </div>
        </div>

        {/* Voluntários CTA */}
        <Link to="/voluntarios" className="block mb-6">
          <div className="bg-card rounded-xl p-4 border border-border flex items-center gap-3 hover:border-primary/40 transition-colors">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <HandHeart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-foreground">Seja voluntário</h3>
              <p className="text-xs text-muted-foreground">Inscreva-se nas próximas ações</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        {/* Notícias */}
        <div className="mb-3">
          <h2 className="font-display text-xl font-semibold text-foreground">Notícias</h2>
        </div>
        <div className="space-y-4">
          {news.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm bg-card rounded-xl border border-border">
              Nenhuma notícia publicada ainda
            </div>
          ) : (
            news.map((n) => (
              <article key={n.id} className="bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in">
                {n.cover_image && (
                  <img src={n.cover_image} alt={n.title} className="w-full aspect-video object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">
                    {new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-foreground leading-tight">{n.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{n.content}</p>
                  {n.link_url && (
                    <Button asChild className="w-full gap-2 mt-2">
                      <a href={n.link_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        {n.link_label || "Saiba mais"}
                      </a>
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
