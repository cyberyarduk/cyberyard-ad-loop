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
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Venues = () => {
  const [open, setOpen] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement with Supabase once database is ready
    const newVenue = {
      id: crypto.randomUUID(),
      name,
      location,
      created_at: new Date().toISOString(),
    };
    setVenues([...venues, newVenue]);
    toast.success("Venue created successfully");
    setOpen(false);
    setName("");
    setLocation("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Venues</h1>
            <p className="text-muted-foreground mt-1">
              Manage your physical locations
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Venue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Venue</DialogTitle>
                <DialogDescription>
                  Create a new venue location for your devices
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name</Label>
                  <Input
                    id="name"
                    placeholder="Downtown Cafe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="123 Main Street"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Venue
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {venues.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No venues yet</h3>
            <p className="text-muted-foreground mt-2">
              Get started by creating your first venue
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell>{venue.location}</TableCell>
                  <TableCell>
                    {new Date(venue.created_at).toLocaleDateString()}
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

export default Venues;