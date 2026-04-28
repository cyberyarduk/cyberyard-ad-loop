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
      title: "Create Offer Video",
      description: "Generate a new offer video",
      to: "/videos/create-ai",
      tone: "bg-peach",
    },
    {
      icon: Monitor,
      title: "Add new device",
      description: "Pair a new screen to your account",
      to: "/devices",
      tone: "bg-lavender",
    },
    {
      icon: List,
      title: "Manage my playlists",
      description: "Organise what plays on your devices",
      to: "/playlists",
      tone: "bg-mint",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-5xl">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Welcome back{firstName ? (
              <>
                ,{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">{firstName}</span>
                  <span className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-4 bg-yellow-bright/60 -z-0 rounded-sm" />
                </span>
              </>
            ) : ""}
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            What would you like to do today?
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.to}>
                <div className="premium-card card-highlight hover-lift rounded-2xl p-6 h-full cursor-pointer">
                  <div className={`p-3 ${action.tone} rounded-xl w-fit mb-4`}>
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg tracking-tight">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
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
