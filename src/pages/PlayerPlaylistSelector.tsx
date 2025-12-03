import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, List, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Playlist {
  id: string;
  name: string;
  created_at: string;
}

interface PlayerPlaylistSelectorProps {
  authToken: string;
  deviceInfo: any;
  onBack: () => void;
  onPlaylistChanged: () => void;
}

const PlayerPlaylistSelector = ({ authToken, deviceInfo, onBack, onPlaylistChanged }: PlayerPlaylistSelectorProps) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-playlists`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playlists');
      }

      setPlaylists(data.playlists || []);
      
      // Get current device playlist
      const { data: device } = await supabase
        .from('devices')
        .select('playlist_id')
        .eq('id', deviceInfo.device_id)
        .single();
      
      if (device?.playlist_id) {
        setCurrentPlaylistId(device.playlist_id);
      }
    } catch (error) {
      console.error('Fetch playlists error:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (playlistId === currentPlaylistId) return;
    
    setChanging(playlistId);
    try {
      const { error } = await supabase
        .from('devices')
        .update({ playlist_id: playlistId })
        .eq('id', deviceInfo.device_id);

      if (error) throw error;

      setCurrentPlaylistId(playlistId);
      toast.success('Playlist changed successfully!');
      
      // Trigger refresh
      setTimeout(() => {
        onPlaylistChanged();
      }, 500);
    } catch (error) {
      console.error('Change playlist error:', error);
      toast.error('Failed to change playlist');
    } finally {
      setChanging(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Select Playlist</h1>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {playlists.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <List className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No playlists available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ask your admin to create playlists
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {playlists.map((playlist) => (
              <Card 
                key={playlist.id}
                className={`cursor-pointer transition-all ${
                  currentPlaylistId === playlist.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-lg'
                }`}
                onClick={() => handleSelectPlaylist(playlist.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <List className="h-5 w-5" />
                      {playlist.name}
                    </span>
                    {changing === playlist.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : currentPlaylistId === playlist.id ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : null}
                  </CardTitle>
                  <CardDescription>
                    {currentPlaylistId === playlist.id ? 'Currently playing' : 'Tap to switch'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPlaylistSelector;
