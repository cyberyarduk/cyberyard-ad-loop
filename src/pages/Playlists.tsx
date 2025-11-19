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
import { Plus, List, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Playlists = () => {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [venueId, setVenueId] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlaylist = {
      id: crypto.randomUUID(),
      name,
      venue_id: venueId || null,
      videos: [],
      created_at: new Date().toISOString(),
    };
    setPlaylists([...playlists, newPlaylist]);
    toast.success("Playlist created successfully");
    setOpen(false);
    setName("");
    setVenueId("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage video playlists
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
                <DialogDescription>
                  Create a playlist to organize your videos
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Playlist Name</Label>
                  <Input
                    id="name"
                    placeholder="Summer Promotions"
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
                <Button type="submit" className="w-full">
                  Create Playlist
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <List className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No playlists yet</h3>
            <p className="text-muted-foreground mt-2">
              Create your first playlist to organize videos
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="border border-border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{playlist.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {playlist.videos.length} videos
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {playlist.videos.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded">
                    <p className="text-muted-foreground">
                      No videos in this playlist yet
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add Videos
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Video</TableHead>
                        <TableHead className="text-right">Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {playlist.videos.map((video: any, index: number) => (
                        <TableRow key={video.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {video.title}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm">
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Playlists;