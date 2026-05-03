import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Monitor, Video as VideoIcon, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface PlaylistItem {
  title: string | null;
  media_type: 'video' | 'image';
  video_url: string | null;
  image_url: string | null;
  display_duration: number | null;
}

interface DeviceInfo {
  id: string;
  name: string;
  status: string | null;
  playlist_id: string | null;
  playlist_name: string | null;
  items: PlaylistItem[];
}

interface PlaylistOption {
  id: string;
  name: string;
}

// Rotating preview tile that mirrors what the device is actually playing.
function DevicePreviewTile({ items }: { items: PlaylistItem[] }) {
  const [idx, setIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset when playlist changes
  useEffect(() => {
    setIdx(0);
  }, [items]);

  // Auto-advance for images (videos advance via onEnded)
  useEffect(() => {
    if (items.length === 0) return;
    const current = items[idx % items.length];
    if (!current) return;
    if (current.media_type !== 'image') return;
    const seconds = Math.max(2, Math.min(120, current.display_duration ?? 8));
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % items.length);
    }, seconds * 1000);
    return () => clearTimeout(t);
  }, [idx, items]);

  if (items.length === 0) {
    return (
      <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        <VideoIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  const current = items[idx % items.length];
  const advance = () => setIdx((i) => (i + 1) % items.length);

  return (
    <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
      {current.media_type === 'image' && current.image_url ? (
        <img
          key={`${idx}-img`}
          src={current.image_url}
          alt={current.title ?? 'Currently playing'}
          className="w-full h-full object-cover"
        />
      ) : current.video_url ? (
        <video
          key={`${idx}-vid`}
          ref={videoRef}
          src={current.video_url}
          muted
          autoPlay
          playsInline
          onEnded={advance}
          onError={advance}
          className="w-full h-full object-cover"
        />
      ) : (
        <VideoIcon className="h-8 w-8 text-muted-foreground" />
      )}
      {items.length > 1 && (
        <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
          {(idx % items.length) + 1} / {items.length}
        </div>
      )}
    </div>
  );
}

export function CurrentlyPlayingPreview() {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [pendingPush, setPendingPush] = useState<{
    deviceId: string;
    deviceName: string;
    playlistId: string;
    playlistName: string;
  } | null>(null);
  const [pushing, setPushing] = useState(false);

  const load = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, role")
        .eq("id", user.id)
        .single();

      let deviceQuery = supabase
        .from("devices")
        .select("id, name, status, playlist_id, last_seen_at, company_id")
        .order("last_seen_at", { ascending: false, nullsFirst: false });

      if (profile?.role !== "super_admin" && profile?.company_id) {
        deviceQuery = deviceQuery.eq("company_id", profile.company_id);
      }

      const { data: rawDevices } = await deviceQuery;
      const list = rawDevices ?? [];

      const { data: pls } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setPlaylists(pls ?? []);

      const enriched: DeviceInfo[] = await Promise.all(
        list.map(async (d) => {
          let playlistName: string | null = null;
          let items: PlaylistItem[] = [];

          if (d.playlist_id) {
            const { data: pl } = await supabase
              .from("playlists")
              .select("name")
              .eq("id", d.playlist_id)
              .single();
            playlistName = pl?.name ?? null;

            const { data: rows } = await supabase
              .from("playlist_videos")
              .select(
                "order_index, videos(title, video_url, video_url_landscape, media_type, image_url, image_url_landscape, display_duration)",
              )
              .eq("playlist_id", d.playlist_id)
              .order("order_index", { ascending: true });

            items = (rows ?? [])
              .map((r: any) => {
                const v = r.videos;
                if (!v) return null;
                const mediaType = (v.media_type ?? 'video') as 'video' | 'image';
                if (mediaType === 'image') {
                  return {
                    title: v.title ?? null,
                    media_type: 'image' as const,
                    video_url: null,
                    image_url: v.image_url ?? v.image_url_landscape ?? null,
                    display_duration: v.display_duration ?? null,
                  };
                }
                return {
                  title: v.title ?? null,
                  media_type: 'video' as const,
                  video_url: v.video_url ?? v.video_url_landscape ?? null,
                  image_url: null,
                  display_duration: v.display_duration ?? null,
                };
              })
              .filter((x: PlaylistItem | null): x is PlaylistItem =>
                !!x && (!!x.video_url || !!x.image_url),
              );
          }

          return {
            id: d.id,
            name: d.name,
            status: d.status,
            playlist_id: d.playlist_id,
            playlist_name: playlistName,
            items,
          };
        }),
      );

      setDevices(enriched);
    } catch (e) {
      console.error("CurrentlyPlayingPreview load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Refresh playlist composition every 30s so newly added/removed videos appear
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handlePlaylistSelect = (device: DeviceInfo, playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    setPendingPush({
      deviceId: device.id,
      deviceName: device.name,
      playlistId,
      playlistName: playlist.name,
    });
  };

  const performPush = async (target: "device" | "all") => {
    if (!pendingPush) return;
    setPushing(true);
    try {
      let query = supabase
        .from("devices")
        .update({ playlist_id: pendingPush.playlistId });
      if (target === "device") {
        query = query.eq("id", pendingPush.deviceId);
      } else {
        query = query.in("id", devices.map((d) => d.id));
      }
      const { error } = await query;
      if (error) throw error;
      toast.success(
        target === "all"
          ? `Pushed "${pendingPush.playlistName}" to all devices`
          : `Pushed "${pendingPush.playlistName}" to ${pendingPush.deviceName}`,
      );
      setPendingPush(null);
      await load();
    } catch (e) {
      console.error("Push error", e);
      toast.error("Failed to push playlist");
    } finally {
      setPushing(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <div className="h-40 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-muted rounded-xl">
            <Monitor className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">No devices yet</h3>
            <p className="text-sm text-muted-foreground">
              Add your first device to see a live preview here.
            </p>
          </div>
          <Link to="/devices" className="text-sm font-medium text-primary hover:underline">
            Add device →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Currently playing
            </p>
            <h2 className="text-xl font-semibold">
              Your devices ({devices.length})
            </h2>
          </div>
          <Link to="/devices" className="text-sm font-medium text-primary hover:underline">
            Manage devices →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => {
            const currentTitle = device.items[0]?.title ?? null;
            return (
              <Card key={device.id} className="border border-border shadow-sm overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{device.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {device.playlist_name ?? "No playlist assigned"}
                      </p>
                    </div>
                    <Badge variant={device.status === "active" ? "default" : "secondary"}>
                      {device.status || "unpaired"}
                    </Badge>
                  </div>

                  <DevicePreviewTile items={device.items} />

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {device.items.length > 1
                        ? `Looping ${device.items.length} items`
                        : "Now showing"}
                    </p>
                    <p className="text-sm font-medium truncate">
                      {currentTitle ||
                        (device.playlist_id ? "No videos in playlist" : "No playlist")}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Send className="h-3 w-3" />
                      Push a playlist to this device
                    </div>
                    <Select value="" onValueChange={(v) => handlePlaylistSelect(device, v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select playlist…" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        {playlists.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No playlists yet
                          </SelectItem>
                        ) : (
                          playlists.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AlertDialog open={!!pendingPush} onOpenChange={(o) => !o && setPendingPush(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Push "{pendingPush?.playlistName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Where would you like to send this playlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Button
              variant="outline"
              disabled={pushing}
              onClick={() => performPush("device")}
              className="justify-start h-auto py-3"
            >
              <div className="text-left">
                <div className="font-medium">
                  Just this device — {pendingPush?.deviceName}
                </div>
                <div className="text-xs text-muted-foreground">
                  Only updates the selected display
                </div>
              </div>
            </Button>
            <Button
              disabled={pushing}
              onClick={() => performPush("all")}
              className="justify-start h-auto py-3"
            >
              <div className="text-left">
                <div className="font-medium">All devices ({devices.length})</div>
                <div className="text-xs opacity-80">
                  Updates every device in your account
                </div>
              </div>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pushing}>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <span className="hidden" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
