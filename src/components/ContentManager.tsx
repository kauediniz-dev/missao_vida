import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { contentDefaults, contentSections, toEmbedUrl } from "@/lib/siteContent";
import { Save, Image as ImageIcon, Film } from "lucide-react";

const ContentManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(contentSections[0].key);
  const [values, setValues] = useState<Record<string, Record<string, string>>>(contentDefaults);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleUpload = async (fieldKey: string, file: File) => {
    setUploading(fieldKey);
    const ext = file.name.split(".").pop();
    const path = `content/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("news-images").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("news-images").getPublicUrl(path);
      updateField(fieldKey, data.publicUrl);
      toast({ title: "Imagem enviada!", description: "Clique em salvar para aplicar." });
    }
    setUploading(null);
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_content" as any).select("content_key,value");
      const merged: Record<string, Record<string, string>> = JSON.parse(JSON.stringify(contentDefaults));
      (data as any[] | null)?.forEach((row) => {
        merged[row.content_key] = { ...(merged[row.content_key] || {}), ...(row.value || {}) };
      });
      setValues(merged);
      setLoading(false);
    };
    load();
  }, []);

  const section = contentSections.find((s) => s.key === activeSection)!;
  const sectionValues = values[activeSection] || {};

  const updateField = (fieldKey: string, val: string) => {
    setValues((prev) => ({
      ...prev,
      [activeSection]: { ...(prev[activeSection] || {}), [fieldKey]: val },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_content" as any).upsert(
      {
        content_key: activeSection,
        value: sectionValues,
        updated_by: user?.id ?? null,
      } as any,
      { onConflict: "content_key" },
    );
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conteúdo salvo!", description: "As alterações já estão visíveis no app." });
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground text-sm">Carregando conteúdo...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-3 border border-border">
        <p className="text-xs text-muted-foreground mb-2">Selecione uma seção para editar:</p>
        <div className="flex flex-wrap gap-1.5">
          {contentSections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === s.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">{section.label}</h3>
          {section.description && <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>}
        </div>

        {section.fields.map((field) => {
          const val = sectionValues[field.key] ?? "";
          return (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                {field.type === "image" && <ImageIcon className="h-3.5 w-3.5" />}
                {field.type === "video" && <Film className="h-3.5 w-3.5" />}
                {field.label}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={val}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  rows={3}
                  placeholder={field.placeholder}
                />
              ) : (
                <Input
                  type={field.type === "url" ? "url" : "text"}
                  value={val}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}

              {field.type === "image" && (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading === field.key}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(field.key, f);
                    }}
                  />
                  {uploading === field.key && <p className="text-xs text-muted-foreground">Enviando imagem...</p>}
                  {val && (
                    <img src={val} alt="Preview" className="max-h-40 rounded-lg border border-border object-contain bg-white p-2" />
                  )}
                </div>
              )}
              {field.type === "video" && val && (
                <div className="mt-2 relative w-full max-w-sm" style={{ paddingBottom: "32%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={toEmbedUrl(val)}
                    title="Preview"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          );
        })}

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
};

export default ContentManager;
