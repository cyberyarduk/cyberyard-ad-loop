import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Video, Activity, TrendingUp, Clock, Zap, List, Calendar, Battery, BatteryWarning } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";

interface AnalyticsData {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  recentlyPairedDevices: number;
  lowBatteryDevices: number;
  totalPlaylists: number;
  totalVideos: number;
  aiGeneratedVideos: number;
  videosAddedThisWeek: number;
  mostUsedPlaylist: string;
  recentlyUpdatedPlaylist: string;
}

export function DashboardAnalytics() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDevices: 0,
    activeDevices: 0,
    offlineDevices: 0,
    recentlyPairedDevices: 0,
    lowBatteryDevices: 0,
    totalPlaylists: 0,
    totalVideos: 0,
    aiGeneratedVideos: 0,
    videosAddedThisWeek: 0,
    mostUsedPlaylist: "N/A",
    recentlyUpdatedPlaylist: "N/A",
  });

  useEffect(() => {
    fetchAnalytics();
  }, [profile]);

  const fetchAnalytics = async () => {
    if (!profile) return;

    const isSuper = profile.role === 'super_admin';
    const oneWeekAgo = subDays(new Date(), 7);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Fetch devices
    let devicesQuery = supabase.from('devices').select('*, playlist_id, last_seen_at, battery_level', { count: 'exact' });
    if (!isSuper && profile.company_id) {
      devicesQuery = devicesQuery.eq('company_id', profile.company_id);
    }
    const { data: devices, count: totalDevices } = await devicesQuery;

    const activeDevices = devices?.filter(d => 
      d.last_seen_at && new Date(d.last_seen_at) > fifteenMinutesAgo
    ).length || 0;

    const offlineDevices = (totalDevices || 0) - activeDevices;

    const recentlyPairedDevices = devices?.filter(d =>
      d.created_at && new Date(d.created_at) > oneWeekAgo
    ).length || 0;

    const lowBatteryDevices = devices?.filter(d =>
      d.battery_level !== null && d.battery_level !== undefined && d.battery_level < 20
    ).length || 0;

    // Most used playlist
    const playlistCounts: Record<string, number> = {};
    devices?.forEach(d => {
      if (d.playlist_id) {
        playlistCounts[d.playlist_id] = (playlistCounts[d.playlist_id] || 0) + 1;
      }
    });
    const mostUsedPlaylistId = Object.keys(playlistCounts).reduce((a, b) => 
      playlistCounts[a] > playlistCounts[b] ? a : b, ""
    );

    let mostUsedPlaylistName = "N/A";
    if (mostUsedPlaylistId) {
      const { data: playlist } = await supabase
        .from('playlists')
        .select('name')
        .eq('id', mostUsedPlaylistId)
        .single();
      mostUsedPlaylistName = playlist?.name || "N/A";
    }

    // Fetch videos
    let videosQuery = supabase.from('videos').select('id, created_at, source', { count: 'exact' });
    if (!isSuper && profile.company_id) {
      videosQuery = videosQuery.eq('company_id', profile.company_id);
    }
    const { data: videos, count: totalVideos } = await videosQuery;

    const aiGeneratedVideos = videos?.filter(v => v.source === 'ai').length || 0;
    const videosAddedThisWeek = videos?.filter(v =>
      v.created_at && new Date(v.created_at) > oneWeekAgo
    ).length || 0;

    // Fetch playlists
    const { data: { user } } = await supabase.auth.getUser();
    let playlistsQuery = supabase.from('playlists').select('id, name, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(1);
    if (user) {
      playlistsQuery = playlistsQuery.eq('user_id', user.id);
    }
    const { data: playlists, count: totalPlaylists } = await playlistsQuery;
    const recentlyUpdatedPlaylist = playlists?.[0]?.name || "N/A";

    setAnalytics({
      totalDevices: totalDevices || 0,
      activeDevices,
      offlineDevices,
      recentlyPairedDevices,
      lowBatteryDevices,
      totalPlaylists: totalPlaylists || 0,
      totalVideos: totalVideos || 0,
      aiGeneratedVideos,
      videosAddedThisWeek,
      mostUsedPlaylist: mostUsedPlaylistName,
      recentlyUpdatedPlaylist,
    });
  };

  const stats = [
    {
      title: "Total Devices",
      value: analytics.totalDevices,
      icon: Monitor,
      description: "Registered devices",
    },
    {
      title: "Active Devices",
      value: analytics.activeDevices,
      icon: Activity,
      description: "Online now",
      trend: analytics.totalDevices > 0 ? Math.round((analytics.activeDevices / analytics.totalDevices) * 100) + "%" : "0%",
    },
    {
      title: "Offline Devices",
      value: analytics.offlineDevices,
      icon: Clock,
      description: "Last seen > 15 min",
    },
    {
      title: "Recently Paired",
      value: analytics.recentlyPairedDevices,
      icon: TrendingUp,
      description: "Paired this week",
    },
    {
      title: "Low Battery Devices",
      value: analytics.lowBatteryDevices,
      icon: BatteryWarning,
      description: "Battery below 20%",
      alert: analytics.lowBatteryDevices > 0,
    },
    {
      title: "Total Videos",
      value: analytics.totalVideos,
      icon: Video,
      description: "In your library",
    },
    {
      title: "AI-Generated Videos",
      value: analytics.aiGeneratedVideos,
      icon: Zap,
      description: `${analytics.totalVideos > 0 ? Math.round((analytics.aiGeneratedVideos / analytics.totalVideos) * 100) : 0}% of total`,
    },
    {
      title: "Videos Added This Week",
      value: analytics.videosAddedThisWeek,
      icon: Calendar,
      description: "New content",
    },
    {
      title: "Total Playlists",
      value: analytics.totalPlaylists,
      icon: List,
      description: "Active playlists",
    },
  ];

  const engagementStats = [
    {
      title: "Most Used Playlist",
      value: analytics.mostUsedPlaylist,
      icon: List,
      description: "Assigned to most devices",
    },
    {
      title: "Recently Updated",
      value: analytics.recentlyUpdatedPlaylist,
      icon: Clock,
      description: "Latest playlist created",
    },
  ];

  return (
    <div className="space-y-6 mb-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Analytics Overview</h2>
        <p className="text-sm text-muted-foreground">Real-time insights into your digital advertising network</p>
      </div>

      {/* Device Analytics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Device Analytics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.slice(0, 5).map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`border shadow-sm hover:shadow-md transition-shadow ${(stat as any).alert ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-border'}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className={`text-sm font-medium ${(stat as any).alert ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${(stat as any).alert ? 'text-red-600 dark:text-red-400' : 'text-primary'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <p className={`text-xs ${(stat as any).alert ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    {stat.description}
                    {(stat as any).trend && <span className="ml-2 text-primary font-medium">{(stat as any).trend}</span>}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Content Analytics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Analytics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.slice(5, 9).map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {engagementStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold mb-1 truncate">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
