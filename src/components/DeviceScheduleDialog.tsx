import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  id?: string;
  label: string;
  playlist_id: string;
  start_time: string;
  end_time: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  device: any;
  playlists: any[];
}

const PRESETS = [
  { label: "Breakfast", start_time: "08:00", end_time: "11:00" },
  { label: "Lunch", start_time: "11:00", end_time: "14:00" },
  { label: "Afternoon", start_time: "14:00", end_time: "18:00" },
  { label: "Evening", start_time: "18:00", end_time: "23:00" },
];

export default function DeviceScheduleDialog({ open, onOpenChange, device, playlists }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !device) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("device_playlist_schedules")
        .select("id, label, playlist_id, start_time, end_time")
        .eq("device_id", device.id)
        .order("start_time", { ascending: true });
      if (error) toast.error("Failed to load schedules");
      setSchedules(
        (data || []).map((s: any) => ({
          id: s.id,
          label: s.label || "",
          playlist_id: s.playlist_id,
          start_time: String(s.start_time).slice(0, 5),
          end_time: String(s.end_time).slice(0, 5),
        }))
      );
      setLoading(false);
    })();
  }, [open, device]);

  const addRow = (preset?: typeof PRESETS[0]) => {
    setSchedules((prev) => [
      ...prev,
      {
        label: preset?.label || "",
        playlist_id: "",
        start_time: preset?.start_time || "09:00",
        end_time: preset?.end_time || "12:00",
      },
    ]);
  };

  const updateRow = (i: number, patch: Partial<Schedule>) => {
    setSchedules((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const removeRow = (i: number) => {
    setSchedules((prev) => prev.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    if (!device) return;
    for (const s of schedules) {
      if (!s.playlist_id) {
        toast.error("Pick a playlist for every time slot");
        return;
      }
      if (!s.start_time || !s.end_time) {
        toast.error("Set a start and end time for every slot");
        return;
      }
    }
    setLoading(true);
    // Replace all schedules for this device
    const { error: delError } = await supabase
      .from("device_playlist_schedules")
      .delete()
      .eq("device_id", device.id);
    if (delError) {
      toast.error("Failed to save schedules");
      setLoading(false);
      return;
    }
    if (schedules.length > 0) {
      const { error: insError } = await supabase
        .from("device_playlist_schedules")
        .insert(
          schedules.map((s) => ({
            device_id: device.id,
            playlist_id: s.playlist_id,
            label: s.label || null,
            start_time: s.start_time,
            end_time: s.end_time,
          }))
        );
      if (insError) {
        toast.error("Failed to save schedules");
        setLoading(false);
        return;
      }
    }
    toast.success("Schedule saved");
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Playlist schedule — {device?.name}</DialogTitle>
          <DialogDescription>
            Automatically switch playlists by time of day. e.g. Breakfast 8–11, Lunch 11–2, Evening 6–11.
            Outside any scheduled slot, the device falls back to its default playlist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Quick add:</span>
            {PRESETS.map((p) => (
              <Button key={p.label} variant="outline" size="sm" onClick={() => addRow(p)}>
                <Plus className="h-3 w-3 mr-1" />
                {p.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => addRow()}>
              <Plus className="h-3 w-3 mr-1" />
              Custom slot
            </Button>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">
                No scheduled slots — add one above to auto-switch playlists by time.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      placeholder="Lunch"
                      value={s.label}
                      onChange={(e) => updateRow(i, { label: e.target.value })}
                    />
                  </div>
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Playlist</Label>
                    <Select
                      value={s.playlist_id}
                      onValueChange={(v) => updateRow(i, { playlist_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select playlist" />
                      </SelectTrigger>
                      <SelectContent>
                        {playlists.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">From</Label>
                    <Input
                      type="time"
                      value={s.start_time}
                      onChange={(e) => updateRow(i, { start_time: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">To</Label>
                    <Input
                      type="time"
                      value={s.end_time}
                      onChange={(e) => updateRow(i, { end_time: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => removeRow(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={save} disabled={loading}>
              Save schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
