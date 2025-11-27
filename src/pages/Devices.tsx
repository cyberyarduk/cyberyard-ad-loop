import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Monitor, Copy, Edit, Trash2, QrCode, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";

const Devices = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [editDevice, setEditDevice] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's profile to check company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('devices')
      .select('*');

    // If not super_admin, filter by company_id
    if (profile?.role !== 'super_admin' && profile?.company_id) {
      query = query.eq('company_id', profile.company_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
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

    // Get user's company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('devices')
      .insert({
        name,
        user_id: user.id,
        company_id: profile?.company_id,
        venue_id: venueId && venueId !== 'none' ? venueId : null,
        playlist_id: playlistId && playlistId !== 'none' ? playlistId : null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create device");
      console.error(error);
    } else {
      toast.success("Device created successfully! Device code: " + data.device_code);
      fetchDevices();
      setOpen(false);
      setName("");
      setVenueId("");
      setPlaylistId("");
      setSelectedDevice(data);
    }
  };

  const showDeviceDetails = async (device: any) => {
    setSelectedDevice(device);
    // Generate QR code
    if (device.pairing_qr_token) {
      try {
        const qrDataUrl = await QRCode.toDataURL(device.pairing_qr_token);
        setQrCodeUrl(qrDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    }
  };

  const copyDeviceCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Device code copied!");
  };

  const updateDeviceStatus = async (deviceId: string, status: string) => {
    const { error } = await supabase
      .from('devices')
      .update({ status })
      .eq('id', deviceId);

    if (error) {
      toast.error("Failed to update device status");
      console.error(error);
    } else {
      toast.success(`Device ${status}`);
      fetchDevices();
    }
  };

  const unpairDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to unpair this device? You will need to pair it again to use it.')) return;

    // Generate new pairing token when unpairing so device can be re-paired
    const newPairingToken = crypto.randomUUID();
    
    const { error } = await supabase
      .from('devices')
      .update({ 
        status: 'unpaired',
        auth_token: null,
        pairing_qr_token: newPairingToken // Reset pairing token so device can pair again
      })
      .eq('id', deviceId);

    if (error) {
      toast.error("Failed to unpair device");
      console.error(error);
    } else {
      toast.success("Device unpaired successfully! You can now pair it again.");
      fetchDevices();
    }
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', deviceId);

    if (error) {
      toast.error("Failed to delete device");
      console.error(error);
    } else {
      toast.success("Device deleted");
      fetchDevices();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDevice) return;

    const { error } = await supabase
      .from('devices')
      .update({
        name: editDevice.name,
        playlist_id: editDevice.playlist_id && editDevice.playlist_id !== 'none' ? editDevice.playlist_id : null,
        venue_id: editDevice.venue_id && editDevice.venue_id !== 'none' ? editDevice.venue_id : null,
      })
      .eq('id', editDevice.id);

    if (error) {
      toast.error("Failed to update device");
      console.error(error);
    } else {
      toast.success("Device updated");
      fetchDevices();
      setEditOpen(false);
      setEditDevice(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'unpaired': return 'secondary';
      case 'suspended': return 'destructive';
      case 'retired': return 'outline';
      default: return 'secondary';
    }
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
                      <SelectItem value="none">No venue</SelectItem>
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
                      <SelectItem value="none">No playlist</SelectItem>
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
          <div className="space-y-4">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {device.name}
                        <Badge variant={getStatusBadgeVariant(device.status || 'unpaired')}>
                          {device.status || 'unpaired'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Last seen: {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditDevice(device);
                          setEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteDevice(device.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Device Code</p>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono bg-muted px-3 py-1 rounded">
                          {device.device_code || 'N/A'}
                        </code>
                        {device.device_code && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyDeviceCode(device.device_code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Admin PIN</p>
                      <code className="text-lg font-mono bg-muted px-3 py-1 rounded">
                        {device.admin_pin || '****'}
                      </code>
                    </div>
                  </div>
                  
                  {device.pairing_qr_token && device.status === 'unpaired' && (
                    <div>
                      <Button
                        variant="outline"
                        onClick={() => showDeviceDetails(device)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Show QR Code for Pairing
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Playlist:</span>{' '}
                      {device.playlist_id ? 
                        playlists.find(p => p.id === device.playlist_id)?.name || 'Unknown'
                        : 'Default'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Venue:</span>{' '}
                      {device.venue_id ?
                        venues.find(v => v.id === device.venue_id)?.name || 'Unknown'
                        : 'None'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {device.status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unpairDevice(device.id)}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Unpair Device
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateDeviceStatus(device.id, 'suspended')}
                        >
                          Suspend Device
                        </Button>
                      </>
                    )}
                    {device.status === 'suspended' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateDeviceStatus(device.id, 'active')}
                      >
                        Reactivate Device
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* QR Code Dialog */}
        <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pair Device: {selectedDevice?.name}</DialogTitle>
              <DialogDescription>
                Scan this QR code or enter the device code manually on the mobile app
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                )}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Or enter code manually:</p>
                  <code className="text-2xl font-mono bg-muted px-4 py-2 rounded">
                    {selectedDevice?.device_code}
                  </code>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Device Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Device</DialogTitle>
              <DialogDescription>Update device settings</DialogDescription>
            </DialogHeader>
            {editDevice && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Device Name</Label>
                  <Input
                    id="edit-name"
                    value={editDevice.name}
                    onChange={(e) => setEditDevice({...editDevice, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-playlist">Playlist</Label>
                  <Select 
                    value={editDevice.playlist_id || ""} 
                    onValueChange={(val) => setEditDevice({...editDevice, playlist_id: val || null})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Default playlist</SelectItem>
                      {playlists.map((playlist) => (
                        <SelectItem key={playlist.id} value={playlist.id}>
                          {playlist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Devices;