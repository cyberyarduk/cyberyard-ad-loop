import { useState } from "react";
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

const Devices = () => {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [playlistId, setPlaylistId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDevice = {
      id: crypto.randomUUID(),
      name,
      venue_id: venueId || null,
      playlist_id: playlistId || null,
      last_seen_at: null,
      created_at: new Date().toISOString(),
    };
    setDevices([...devices, newDevice]);
    toast.success("Device created successfully");
    setOpen(false);
    setName("");
    setVenueId("");
    setPlaylistId("");
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
                      <SelectItem value="none">No venue</SelectItem>
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