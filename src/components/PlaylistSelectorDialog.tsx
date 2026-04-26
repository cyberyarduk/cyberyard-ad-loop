import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, List, Plus } from "lucide-react";
import { toast } from "sonner";

interface PlaylistSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelected: (playlistId: string) => void;
  title?: string;
  description?: string;
}

export function PlaylistSelectorDialog({
  open,
  onOpenChange,
  onSelected,
  title = "Choose a playlist",
  description = "Pick the playlist your new video will be added to, or create a new one.",
}: PlaylistSelectorDialogProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);
  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open) return;
    const fetchPlaylists = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load playlists");
        setPlaylists([]);
      } else {
        setPlaylists(data || []);
        if (data && data.length > 0) {
          setMode("select");
          setSelectedId(data[0].id);
        } else {
          setMode("create");
        }
      }
      setLoading(false);
    };
    fetchPlaylists();
  }, [open]);

  const handleConfirm = async () => {
    if (mode === "select") {
      if (!selectedId) {
        toast.error("Please select a playlist");
        return;
      }
      onSelected(selectedId);
      onOpenChange(false);
      return;
    }

    // Create mode
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Please enter a playlist name");
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase
      .from("playlists")
      .insert({
        name: trimmed,
        user_id: user.id,
        company_id: profile?.company_id ?? null,
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error || !data) {
      toast.error("Failed to create playlist");
      return;
    }

    toast.success(`Playlist "${trimmed}" created`);
    onSelected(data.id);
    onOpenChange(false);
    setNewName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {playlists.length > 0 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "select" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("select")}
                  className="flex-1"
                >
                  <List className="mr-2 h-4 w-4" />
                  Use existing
                </Button>
                <Button
                  type="button"
                  variant={mode === "create" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("create")}
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new
                </Button>
              </div>
            )}

            {mode === "select" && playlists.length > 0 && (
              <div className="space-y-2">
                <Label>Playlist</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a playlist" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-background">
                    {playlists.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="new-playlist-name">New playlist name</Label>
                <Input
                  id="new-playlist-name"
                  placeholder="e.g. Daily Offers"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                {playlists.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    You don't have any playlists yet — let's create your first one.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : mode === "create" ? (
              "Create & Continue"
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
