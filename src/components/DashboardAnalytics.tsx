import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Monitor, Video, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AnalyticsData {
  totalDevices: number;
  activeDevices: number;
  totalVideos: number;
  totalPlaylists: number;
}

export function DashboardAnalytics() {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDevices: 0,
    activeDevices: 0,
    totalVideos: 0,
    totalPlaylists: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [profile]);

  const fetchAnalytics = async () => {
    if (!profile) return;

    const isSuper = profile.role === 'super_admin';

    // Fetch devices
    let devicesQuery = supabase.from('devices').select('status', { count: 'exact' });
    if (!isSuper && profile.company_id) {
      devicesQuery = devicesQuery.eq('company_id', profile.company_id);
    }
    const { count: totalDevices } = await devicesQuery;

    let activeDevicesQuery = supabase.from('devices').select('status', { count: 'exact' }).eq('status', 'active');
    if (!isSuper && profile.company_id) {
      activeDevicesQuery = activeDevicesQuery.eq('company_id', profile.company_id);
    }
    const { count: activeDevices } = await activeDevicesQuery;

    // Fetch videos
    let videosQuery = supabase.from('videos').select('id', { count: 'exact' });
    if (!isSuper && profile.company_id) {
      videosQuery = videosQuery.eq('company_id', profile.company_id);
    }
    const { count: totalVideos } = await videosQuery;

    // Fetch playlists
    const { data: { user } } = await supabase.auth.getUser();
    let playlistsQuery = supabase.from('playlists').select('id', { count: 'exact' });
    if (user) {
      playlistsQuery = playlistsQuery.eq('user_id', user.id);
    }
    const { count: totalPlaylists } = await playlistsQuery;

    setAnalytics({
      totalDevices: totalDevices || 0,
      activeDevices: activeDevices || 0,
      totalVideos: totalVideos || 0,
      totalPlaylists: totalPlaylists || 0,
    });
  };

  const stats = [
    {
      title: "Total Devices",
      value: analytics.totalDevices,
      icon: Monitor,
      description: "Registered devices",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Devices",
      value: analytics.activeDevices,
      icon: Activity,
      description: "Currently online",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      percentage: analytics.totalDevices > 0 ? Math.round((analytics.activeDevices / analytics.totalDevices) * 100) : 0,
    },
    {
      title: "Total Videos",
      value: analytics.totalVideos,
      icon: Video,
      description: "In your library",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Playlists",
      value: analytics.totalPlaylists,
      icon: BarChart3,
      description: "Active playlists",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                {stat.description}
                {stat.percentage !== undefined && (
                  <span className="flex items-center text-green-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.percentage}%
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
