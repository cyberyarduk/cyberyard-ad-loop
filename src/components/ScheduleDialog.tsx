import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ItemSchedule {
  schedule_start_date?: string | null;
  schedule_end_date?: string | null;
  schedule_days_of_week?: number[] | null;
  schedule_start_time?: string | null;
  schedule_end_time?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  playlistVideoId: string | null;
  initial: ItemSchedule | null;
  onSaved: () => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ScheduleDialog = ({ open, onOpenChange, playlistVideoId, initial, onSaved }: Props) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStartDate(initial?.schedule_start_date ?? "");
    setEndDate(initial?.schedule_end_date ?? "");
    setDays(initial?.schedule_days_of_week ?? []);
    setStartTime(initial?.schedule_start_time ? String(initial.schedule_start_time).slice(0, 5) : "");
    setEndTime(initial?.schedule_end_time ? String(initial.schedule_end_time).slice(0, 5) : "");
  }, [initial, open]);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const handleSave = async () => {
    if (!playlistVideoId) return;
    setSaving(true);
    const { error } = await supabase
      .from("playlist_videos")
      .update({
        schedule_start_date: startDate || null,
        schedule_end_date: endDate || null,
        schedule_days_of_week: days.length ? days : null,
        schedule_start_time: startTime || null,
        schedule_end_time: endTime || null,
      } as any)
      .eq("id", playlistVideoId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save schedule");
      return;
    }
    toast.success("Schedule saved");
    onSaved();
    onOpenChange(false);
  };

  const handleClear = async () => {
    if (!playlistVideoId) return;
    setSaving(true);
    await supabase
      .from("playlist_videos")
      .update({
        schedule_start_date: null,
        schedule_end_date: null,
        schedule_days_of_week: null,
        schedule_start_time: null,
        schedule_end_time: null,
      } as any)
      .eq("id", playlistVideoId);
    setSaving(false);
    toast.success("Schedule cleared — plays always");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule rules</DialogTitle>
          <DialogDescription>
            Leave any field blank to ignore it. The item only plays when all set rules match.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Days of week</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <label key={i} className="flex items-center gap-1.5 text-sm border rounded-md px-2 py-1 cursor-pointer">
                  <Checkbox checked={days.includes(i)} onCheckedChange={() => toggleDay(i)} />
                  {d}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">No days ticked = every day.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClear} disabled={saving}>
            Clear
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
