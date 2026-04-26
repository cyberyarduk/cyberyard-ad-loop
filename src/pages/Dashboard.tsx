import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Monitor, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CurrentlyPlayingPreview } from "@/components/CurrentlyPlayingPreview";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const firstName = profile?.full_name?.split(" ")[0] || profile?.email?.split("@")[0] || "";


  const actions = [
    {
      icon: Video,
      title: "Create your video",
      description: "Generate a new AI-powered offer video",
      to: "/videos/create-ai",
    },
    {
      icon: Monitor,
      title: "Add new device",
      description: "Pair a new wearable display",
      to: "/devices",
    },
    {
      icon: List,
      title: "Manage my playlists",
      description: "Organise what plays on your devices",
      to: "/playlists",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-4xl">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-muted-foreground mt-2">
            What would you like to do today?
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.to}>
                <Card className="border border-border shadow-sm hover:shadow-md hover:border-primary/40 transition-all h-full cursor-pointer">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-3 bg-primary/10 rounded-xl w-fit">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <CurrentlyPlayingPreview />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
