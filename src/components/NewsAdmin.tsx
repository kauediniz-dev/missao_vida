import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, ExternalLink, Save, X, Upload, Loader2 } from "lucide-react";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  link_url: string | null;
  link_label: string | null;
  published: boolean;
  created_at: string;
};

const empty = { title: "", content: "", cover_image: "", link_url: "", link_label: "", published: true };

const NewsAdmin = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("news" as any).select("*").order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(empty); setEditing(null); setShowForm(false); };

  const handleSave = async () => {
    if (!form.title || !form.content) {
      toast({ title: "Preencha título e texto", variant: "destructive" });
      return;
    }
    const payload: any = {
      title: form.title,
      content: form.content,
      cover_image: form.cover_image || null,
      link_url: form.link_url || null,
      link_label: form.link_label || null,
      published: form.published,
    };
    const { error } = editing
      ? await supabase.from("news" as any).update(payload).eq("id", editing)
      : await supabase.from("news" as any).insert({ ...payload, created_by: user?.id });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Notícia atualizada!" : "Notícia publicada!" });
      reset();
      load();
    }
  };

  const handleEdit = (n: NewsItem) => {
    setEditing(n.id);
    setForm({
      title: n.title,
      content: n.content,
      cover_image: n.cover_image || "",
      link_url: n.link_url || "",
      link_label: n.link_label || "",
      published: n.published,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta notícia?")) return;
    const { error } = await supabase.from("news" as any).delete().eq("id", id);
    if (error) toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    else { toast({ title: "Notícia excluída" }); load(); }
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("news-images").upload(path, file, { upsert: false });
    if (error) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      setForm((f) => ({ ...f, cover_image: data.publicUrl }));
      toast({ title: "Imagem enviada!" });
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Notícias</h3>
        {!showForm && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Nova notícia
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-foreground">{editing ? "Editar notícia" : "Nova notícia"}</h4>
            <Button variant="ghost" size="icon" onClick={reset}><X className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Texto</Label>
            <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Imagem de capa</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <div className="flex items-center justify-center gap-2 h-10 rounded-md border border-dashed border-input bg-background text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Enviando..." : form.cover_image ? "Trocar imagem" : "Selecionar imagem"}
                </div>
              </label>
              {form.cover_image && (
                <Button variant="ghost" size="icon" type="button" onClick={() => setForm({ ...form, cover_image: "" })}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {form.cover_image && <img src={form.cover_image} alt="Preview" className="mt-2 w-full aspect-video rounded-lg border border-border object-cover" />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Link (pagamento ou site)</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Texto do botão</Label>
              <Input value={form.link_label} onChange={(e) => setForm({ ...form, link_label: e.target.value })} placeholder="Ex: Doar agora" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Publicada</Label>
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
          </div>
          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="h-4 w-4" /> {editing ? "Salvar alterações" : "Publicar"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma notícia cadastrada</div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {n.cover_image && <img src={n.cover_image} alt={n.title} className="w-full aspect-video object-cover" />}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">{n.title}</h4>
                    <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge variant={n.published ? "default" : "secondary"} className="text-[10px]">
                    {n.published ? "Publicada" : "Rascunho"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>
                {n.link_url && (
                  <a href={n.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary">
                    <ExternalLink className="h-3 w-3" /> {n.link_label || n.link_url}
                  </a>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => handleEdit(n)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(n.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsAdmin;
