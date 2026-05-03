import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Image as ImageIcon } from "lucide-react";

const Settings = () => {
  const { profile } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string>("");
  const [fallbackUploading, setFallbackUploading] = useState(false);

  useEffect(() => {
    const loadFallback = async () => {
      if (!profile?.company_id) return;
      const { data } = await supabase
        .from('companies')
        .select('offline_fallback_image_url')
        .eq('id', profile.company_id)
        .maybeSingle();
      setFallbackUrl(data?.offline_fallback_image_url || "");
    };
    loadFallback();
  }, [profile?.company_id]);

  const handleFallbackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.company_id) return;
    setFallbackUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `offline-fallback/${profile.company_id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('images').getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase
        .from('companies')
        .update({ offline_fallback_image_url: url })
        .eq('id', profile.company_id);
      if (updErr) throw updErr;
      setFallbackUrl(url);
      toast.success('Offline fallback image updated');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setFallbackUploading(false);
    }
  };

  const handleFallbackRemove = async () => {
    if (!profile?.company_id) return;
    const { error } = await supabase
      .from('companies')
      .update({ offline_fallback_image_url: null })
      .eq('id', profile.company_id);
    if (error) {
      toast.error('Failed to remove');
      return;
    }
    setFallbackUrl("");
    toast.success('Fallback image removed');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and view analytics
          </p>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Analytics</h2>
            <p className="text-sm text-muted-foreground">
              An overview of your devices, videos and content
            </p>
          </div>
          <DashboardAnalytics />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={profile?.role.replace("_", " ").toUpperCase() || ""}
                disabled
                className="capitalize"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5" /> Offline Fallback Image
            </CardTitle>
            <CardDescription>
              Shown on screens if they lose internet and have no cached content. Recommended: a branded image or "Back shortly" message (16:9 or 9:16, JPG/PNG).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fallbackUrl ? (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden border bg-muted/30 max-w-sm">
                  <img src={fallbackUrl} alt="Offline fallback" className="w-full h-auto object-contain" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleFallbackRemove}>
                    <X className="h-4 w-4 mr-2" /> Remove
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" /> Replace
                      <input type="file" accept="image/*" className="hidden" onChange={handleFallbackUpload} />
                    </label>
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild disabled={fallbackUploading}>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {fallbackUploading ? 'Uploading...' : 'Upload fallback image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFallbackUpload} />
                </label>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              If no image is uploaded, screens will show your company name on a clean black background while offline.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
