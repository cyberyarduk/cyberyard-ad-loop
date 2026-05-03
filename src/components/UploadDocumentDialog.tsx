import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  trigger?: React.ReactNode;
  onComplete?: () => void;
}

/**
 * Lets a customer upload a PDF / PPTX / DOCX. We send the file to the
 * `convert-document` edge function (CloudConvert) which returns one PNG per
 * page. Each page becomes its own image item in the media library so it can
 * be added to playlists like any other slide.
 */
export default function UploadDocumentDialog({ trigger, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [titleBase, setTitleBase] = useState("");
  const [duration, setDuration] = useState("10");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const reset = () => {
    setFile(null);
    setTitleBase("");
    setDuration("10");
    setProgress("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Choose a file first");
    const dur = parseInt(duration, 10);
    if (!dur || dur < 1 || dur > 600) return toast.error("1–600 seconds");

    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) throw new Error("No company linked");

      // 1. Upload original to images bucket so CloudConvert can fetch it.
      setProgress("Uploading file…");
      const stamp = Date.now();
      const path = `${profile.company_id}/source/${stamp}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("images").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const fileUrl = supabase.storage.from("images").getPublicUrl(path).data.publicUrl;

      // 2. Render a single looping video (portrait + landscape) of all pages.
      setProgress("Building your slide video… (this can take 30–90s)");
      const { data, error } = await supabase.functions.invoke("convert-document", {
        body: { fileUrl, fileName: file.name, companyId: profile.company_id, secondsPerPage: dur },
      });
      if (error) throw error;
      if (!data?.videoUrl) throw new Error("No video returned");

      // 3. Insert ONE video row covering the whole document.
      setProgress("Saving to your library…");
      const base = titleBase || file.name.replace(/\.[^.]+$/, "");
      const { error: insErr } = await supabase.from("videos").insert({
        title: data.totalPages > 1 ? `${base} (${data.totalPages} pages)` : base,
        user_id: user.id,
        company_id: profile.company_id,
        media_type: "video",
        video_url: data.videoUrl,
        video_url_landscape: data.videoUrlLandscape || null,
        image_url: data.posterUrl || null,
        image_url_landscape: data.posterUrl || null,
        source: "document_upload",
        player_overlay: "none",
      });
      if (insErr) throw insErr;

      toast.success(`Imported ${file.name} (${data.totalPages} page${data.totalPages > 1 ? "s" : ""})`);
      setOpen(false);
      reset();
      onComplete?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to import document");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Upload PDF / PPT
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>
            PDF, PowerPoint or Word. Each page becomes its own slide in your library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Title (optional)</Label>
            <Input
              id="doc-title"
              placeholder="Spring menu"
              value={titleBase}
              onChange={(e) => setTitleBase(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-file">File</Label>
            <Input
              id="doc-file"
              type="file"
              accept=".pdf,.pptx,.ppt,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-duration">Seconds per page</Label>
            <Input
              id="doc-duration"
              type="number" min={1} max={600}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          {progress && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> {progress}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Working…" : "Import"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
