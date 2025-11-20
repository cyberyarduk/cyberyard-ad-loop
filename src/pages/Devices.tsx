import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Monitor, Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const Devices = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [playlistId, setPlaylistId] = useState("");

  // Auth check
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

  // Fetch data
  useEffect(() => {
    fetchDevices();
    fetchVenues();
    fetchPlaylists();
  }, []);

  const fetchDevices = async () => {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch devices");
      console.error(error);
    } else {
      setDevices(data || []);
    }
  };

  const fetchVenues = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name');
    
    if (error) {
      console.error(error);
    } else {
      setVenues(data || []);
    }
  };

  const fetchPlaylists = async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .order('name');
    
    if (error) {
      console.error(error);
    } else {
      setPlaylists(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const { data, error } = await supabase
      .from('devices')
      .insert({
        name,
        user_id: user.id,
        venue_id: venueId || null,
        playlist_id: playlistId || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create device");
      console.error(error);
    } else {
      toast.success("Device created successfully");
      setDevices([data, ...devices]);
      setOpen(false);
      setName("");
      setVenueId("");
      setPlaylistId("");
    }
  };

  const copyPlayerUrl = (deviceId: string) => {
    const url = `${window.location.origin}/player/${deviceId}`;
    navigator.clipboard.writeText(url);
    toast.success("Player URL copied to clipboard");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Devices</h1>
            <p className="text-muted-foreground mt-1">
              Manage your wearable screen devices
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Device</DialogTitle>
                <DialogDescription>
                  Create a new wearable screen device
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Device Name</Label>
                  <Input
                    id="name"
                    placeholder="Counter 1 - Main Street"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue (Optional)</Label>
                  <Select value={venueId} onValueChange={setVenueId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a venue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No venue</SelectItem>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playlist">Playlist (Optional)</Label>
                  <Select value={playlistId} onValueChange={setPlaylistId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No playlist</SelectItem>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Register Device
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <Monitor className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No devices yet</h3>
            <p className="text-muted-foreground mt-2">
              Get started by registering your first device
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Playlist</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Player URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>
                    {device.venue_id ? (
                      <Badge variant="outline">Venue Name</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.playlist_id ? (
                      <Badge>Playlist Name</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.last_seen_at ? (
                      new Date(device.last_seen_at).toLocaleString()
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyPlayerUrl(device.id)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </Button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Devices;