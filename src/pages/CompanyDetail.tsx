import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Users, Monitor, Trash2, Pause, Play, Edit } from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Company = Tables<'companies'>;

export default function CompanyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCompany();
      fetchCounts();
    }
  }, [id]);

  const fetchCompany = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company');
      navigate('/companies');
    } else {
      setCompany(data);
    }
    setLoading(false);
  };

  const fetchCounts = async () => {
    // Get device count
    const { count: devices } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id);
    
    setDeviceCount(devices || 0);

    // Get user count
    const { count: users } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id);
    
    setUserCount(users || 0);
  };

  const handleStatusChange = async (newStatus: 'active' | 'suspended') => {
    if (!company) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('companies')
      .update({ status: newStatus })
      .eq('id', company.id);

    if (error) {
      toast.error('Failed to update company status');
    } else {
      toast.success(`Company ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      setCompany({ ...company, status: newStatus });
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!company) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', company.id);

    if (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company. Make sure all associated data is removed first.');
    } else {
      toast.success('Company deleted successfully');
      navigate('/companies');
    }
    setActionLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading company...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Company not found</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/companies')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{company.name}</h1>
                <Badge className={getStatusColor(company.status)}>
                  {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">{company.slug}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/companies/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            
            {company.status === 'active' ? (
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange('suspended')}
                disabled={actionLoading}
              >
                <Pause className="mr-2 h-4 w-4" />
                Suspend
              </Button>
            ) : company.status === 'suspended' ? (
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange('active')}
                disabled={actionLoading}
              >
                <Play className="mr-2 h-4 w-4" />
                Reactivate
              </Button>
            ) : null}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={actionLoading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Company</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{company.name}"? This action cannot be undone.
                    All associated devices, playlists, and users will need to be deleted first.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deviceCount}</div>
              <p className="text-xs text-muted-foreground">
                {company.device_limit ? `of ${company.device_limit} limit` : 'Unlimited'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{company.plan_type}</div>
              <p className="text-xs text-muted-foreground">
                £{company.price_per_device}/device/{company.billing_cycle}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Company Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Primary Contact</div>
                <div className="text-sm">{company.primary_contact_name}</div>
                <div className="text-sm text-muted-foreground">{company.primary_contact_email}</div>
                {company.primary_contact_phone && (
                  <div className="text-sm text-muted-foreground">{company.primary_contact_phone}</div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Billing Email</div>
                <div className="text-sm">{company.billing_email}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-sm">{company.address_line1}</div>
              {company.address_line2 && <div className="text-sm">{company.address_line2}</div>}
              <div className="text-sm">{company.city}</div>
              <div className="text-sm">{company.postcode}</div>
              <div className="text-sm">{company.country}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Plan Type</div>
                  <div className="text-sm capitalize">{company.plan_type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Connectivity</div>
                  <div className="text-sm capitalize">{company.connectivity_type.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Term</div>
                  <div className="text-sm">{company.term_months} months</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Billing Cycle</div>
                  <div className="text-sm capitalize">{company.billing_cycle}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contract Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                  <div className="text-sm">{format(new Date(company.start_date), 'dd MMM yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">End Date</div>
                  <div className="text-sm">{format(new Date(company.end_date), 'dd MMM yyyy')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {company.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
