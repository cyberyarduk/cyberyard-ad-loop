import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-dark.png";
import { Monitor, Video, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src={logo} alt="Cyberyard" className="h-12" />
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Wearable Digital Billboards
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your staff into moving advertisements with Cyberyard's innovative wearable screen platform
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8">
              Start Managing Content
            </Button>
          </Link>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-card p-6 rounded-lg border border-border">
                <Monitor className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Wearable Screens</h3>
                <p className="text-muted-foreground">
                  Staff wear Android devices on lanyards displaying your content
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-card p-6 rounded-lg border border-border">
                <Video className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Video Playlists</h3>
                <p className="text-muted-foreground">
                  Create and manage playlists that loop continuously
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-card p-6 rounded-lg border border-border">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
                <p className="text-muted-foreground">
                  Generate quick offer videos instantly with AI
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Cyberyard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
