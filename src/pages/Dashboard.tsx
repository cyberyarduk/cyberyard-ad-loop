import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Video, Zap, MapPin, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Cyberyard - Manage your wearable digital billboards
          </p>
        </div>

        <DashboardAnalytics />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Video Library</CardTitle>
                  <CardDescription>Upload and manage your video content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create and organize your promotional videos for display on wearable devices
              </p>
              <div className="flex gap-2">
                <Link to="/videos" className="flex-1">
                  <Button className="w-full" variant="default">
                    <Video className="mr-2 h-4 w-4" />
                    Manage Videos
                  </Button>
                </Link>
                <Link to="/videos/create-ai">
                  <Button variant="outline">
                    <Zap className="mr-2 h-4 w-4" />
                    AI Video
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common management tasks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/devices">
                <Button variant="outline" className="w-full justify-start">
                  <Monitor className="mr-2 h-4 w-4" />
                  Register New Device
                </Button>
              </Link>
              <Link to="/playlists">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Playlist
                </Button>
              </Link>
              <Link to="/venues">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="mr-2 h-4 w-4" />
                  Add Venue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
