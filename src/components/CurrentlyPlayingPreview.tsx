import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Video as VideoIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface DeviceInfo {
  id: string;
  name: string;
  status: string | null;
  playlist_id: string | null;
  playlist_name: string | null;
  video_url: string | null;
  video_title: string | null;
  total_videos: number;
}

export function CurrentlyPlayingPreview() {
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
          .select("id, name, status, playlist_id, last_seen_at")
          .order("last_seen_at", { ascending: false, nullsFirst: false })
          .limit(1);

        if (profile?.role !== "super_admin" && profile?.company_id) {
          deviceQuery = deviceQuery.eq("company_id", profile.company_id);
        }

        const { data: devices } = await deviceQuery;
        const d = devices?.[0];
        if (!d) {
          setDevice(null);
          setLoading(false);
          return;
        }

        let playlistName: string | null = null;
        let videoUrl: string | null = null;
        let videoTitle: string | null = null;
        let total = 0;

        if (d.playlist_id) {
          const { data: pl } = await supabase
            .from("playlists")
            .select("name")
            .eq("id", d.playlist_id)
            .single();
          playlistName = pl?.name ?? null;

          const { data: items } = await supabase
            .from("playlist_videos")
            .select("video_id, order_index, videos(title, video_url)")
            .eq("playlist_id", d.playlist_id)
            .order("order_index", { ascending: true });

          total = items?.length ?? 0;
          const first = items?.[0]?.videos as { title?: string; video_url?: string } | null;
          videoUrl = first?.video_url ?? null;
          videoTitle = first?.title ?? null;
        }

        setDevice({
          id: d.id,
          name: d.name,
          status: d.status,
          playlist_id: d.playlist_id,
          playlist_name: playlistName,
          video_url: videoUrl,
          video_title: videoTitle,
          total_videos: total,
        });
      } catch (e) {
        console.error("CurrentlyPlayingPreview load error", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <div className="h-40 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!device) {
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
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Currently playing
            </p>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {device.name}
              <Badge variant={device.status === "active" ? "default" : "secondary"}>
                {device.status || "unpaired"}
              </Badge>
            </h3>
          </div>
          <Link to="/devices" className="text-sm font-medium text-primary hover:underline">
            Manage →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-[180px,1fr] items-center">
          <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {device.video_url ? (
              <video
                src={device.video_url}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <VideoIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            {device.playlist_name ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Playlist</p>
                  <p className="font-medium">{device.playlist_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Now showing</p>
                  <p className="font-medium">
                    {device.video_title || "No videos in playlist yet"}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {device.total_videos} video{device.total_videos === 1 ? "" : "s"} in rotation
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No playlist assigned to this device yet.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
