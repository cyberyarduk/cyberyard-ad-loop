import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Video, Monitor, MapPin, List } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: "Total Venues", value: "0", icon: MapPin, link: "/venues" },
    { label: "Active Devices", value: "0", icon: Monitor, link: "/devices" },
    { label: "Videos", value: "0", icon: Video, link: "/videos" },
    { label: "Playlists", value: "0", icon: List, link: "/playlists" },
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [venuesResult, devicesResult, videosResult, playlistsResult] = await Promise.all([
        supabase.from('venues').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('devices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('videos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('playlists').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setStats([
        { label: "Total Venues", value: String(venuesResult.count || 0), icon: MapPin, link: "/venues" },
        { label: "Active Devices", value: String(devicesResult.count || 0), icon: Monitor, link: "/devices" },
        { label: "Videos", value: String(videosResult.count || 0), icon: Video, link: "/videos" },
        { label: "Playlists", value: String(playlistsResult.count || 0), icon: List, link: "/playlists" },
      ]);
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your wearable digital billboard platform
            </p>
          </div>
          <Link to="/videos/create-ai">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create AI Video
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} to={stat.link}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with Cyberyard
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link to="/venues">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <MapPin className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Add Venue</div>
                  <div className="text-sm text-muted-foreground">Create your first location</div>
                </div>
              </Button>
            </Link>
            <Link to="/devices">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Monitor className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Register Device</div>
                  <div className="text-sm text-muted-foreground">Set up a wearable screen</div>
                </div>
              </Button>
            </Link>
            <Link to="/videos">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Video className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Upload Video</div>
                  <div className="text-sm text-muted-foreground">Add content to your library</div>
                </div>
              </Button>
            </Link>
            <Link to="/videos/create-ai">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Plus className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">AI Offer Video</div>
                  <div className="text-sm text-muted-foreground">Generate with AI quickly</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;