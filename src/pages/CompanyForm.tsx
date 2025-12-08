import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { addMonths, format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Company = Tables<'companies'>;

export default function CompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    billing_email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
    country: '',
    plan_type: 'wifi' as 'wifi' | 'anywhere',
    price_per_device: '',
    billing_cycle: 'monthly',
    device_limit: '',
    term_months: 12,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'active' as 'pending' | 'active' | 'expired' | 'suspended',
    connectivity_type: 'wifi' as 'wifi' | 'cyberyard_anywhere',
    notes: '',
    admin_email: '',
    admin_name: '',
    admin_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingCompany, setFetchingCompany] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      fetchCompany();
    }
  }, [id, isEditing]);

  const fetchCompany = async () => {
    setFetchingCompany(true);
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
      setFormData({
        name: data.name,
        slug: data.slug,
        primary_contact_name: data.primary_contact_name,
        primary_contact_email: data.primary_contact_email,
        primary_contact_phone: data.primary_contact_phone || '',
        billing_email: data.billing_email,
        address_line1: data.address_line1,
        address_line2: data.address_line2 || '',
        city: data.city,
        postcode: data.postcode,
        country: data.country,
        plan_type: data.plan_type,
        price_per_device: data.price_per_device.toString(),
        billing_cycle: data.billing_cycle,
        device_limit: data.device_limit?.toString() || '',
        term_months: data.term_months,
        start_date: data.start_date,
        status: data.status,
        connectivity_type: data.connectivity_type,
        notes: data.notes || '',
        admin_email: '',
        admin_name: '',
        admin_password: '',
      });
    }
    setFetchingCompany(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from company name (only when creating)
    if (name === 'name' && !isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateEndDate = (startDate: string, months: number) => {
    return format(addMonths(new Date(startDate), months), 'yyyy-MM-dd');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Calculate end date
      const endDate = calculateEndDate(formData.start_date, formData.term_months);

      const companyData = {
        name: formData.name,
        slug: formData.slug,
        primary_contact_name: formData.primary_contact_name,
        primary_contact_email: formData.primary_contact_email,
        primary_contact_phone: formData.primary_contact_phone || null,
        billing_email: formData.billing_email,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        city: formData.city,
        postcode: formData.postcode,
        country: formData.country,
        plan_type: formData.plan_type,
        price_per_device: parseFloat(formData.price_per_device),
        billing_cycle: formData.billing_cycle,
        device_limit: formData.device_limit ? parseInt(formData.device_limit) : null,
        term_months: formData.term_months,
        start_date: formData.start_date,
        end_date: endDate,
        status: formData.status,
        connectivity_type: formData.connectivity_type,
        notes: formData.notes || null,
      };

      if (isEditing) {
        // Update existing company
        const { error: updateError } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', id);

        if (updateError) throw updateError;

        toast.success('Company updated successfully!');
        navigate(`/companies/${id}`);
      } else {
        // Create new company
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            ...companyData,
            created_by_user_id: user.id,
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Create company admin user via edge function
        if (formData.admin_email && formData.admin_password) {
          const { data: adminResult, error: adminError } = await supabase.functions.invoke(
            'create-company-admin',
            {
              body: {
                company_id: company.id,
                admin_email: formData.admin_email,
                admin_name: formData.admin_name,
                admin_password: formData.admin_password,
              },
            }
          );

          if (adminError) {
            console.error('Error creating admin:', adminError);
            toast.warning('Company created but admin account failed. Please try adding the admin manually.');
          } else {
            toast.success('Company and admin account created successfully! The admin will receive an email to confirm their account.');
          }
        } else {
          toast.success('Company created successfully!');
        }

        navigate('/companies');
      }
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error(error.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCompany) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading company...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(isEditing ? `/companies/${id}` : '/companies')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Edit Company' : 'Create New Company'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditing ? 'Update company details' : 'Add a new customer company and create their admin account'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Details */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Company Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  disabled={isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_contact_name">Contact Name *</Label>
                <Input
                  id="primary_contact_name"
                  name="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_contact_email">Contact Email *</Label>
                <Input
                  id="primary_contact_email"
                  name="primary_contact_email"
                  type="email"
                  value={formData.primary_contact_email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_contact_phone">Contact Phone</Label>
                <Input
                  id="primary_contact_phone"
                  name="primary_contact_phone"
                  value={formData.primary_contact_phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_email">Billing Email *</Label>
              <Input
                id="billing_email"
                name="billing_email"
                type="email"
                value={formData.billing_email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Address</h2>
            
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Subscription Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan_type">Plan Type *</Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={(value) => handleSelectChange('plan_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wifi">WiFi</SelectItem>
                    <SelectItem value="anywhere">Anywhere</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connectivity_type">Connectivity Type *</Label>
                <Select
                  value={formData.connectivity_type}
                  onValueChange={(value) => handleSelectChange('connectivity_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wifi">WiFi</SelectItem>
                    <SelectItem value="cyberyard_anywhere">Cyberyard Anywhere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_per_device">Price per Device *</Label>
                <Input
                  id="price_per_device"
                  name="price_per_device"
                  type="number"
                  step="0.01"
                  value={formData.price_per_device}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="term_months">Term (months) *</Label>
                <Select
                  value={formData.term_months.toString()}
                  onValueChange={(value) => handleSelectChange('term_months', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_limit">Device Limit</Label>
                <Input
                  id="device_limit"
                  name="device_limit"
                  type="number"
                  value={formData.device_limit}
                  onChange={handleChange}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>End Date (Auto-calculated)</Label>
                <Input
                  type="text"
                  value={calculateEndDate(formData.start_date, formData.term_months)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          {/* Company Admin User - Only show when creating */}
          {!isEditing && (
            <div className="border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Company Admin Account</h2>
              <p className="text-sm text-muted-foreground">
                Create an admin account for this company. They will receive an email to confirm their account.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Admin Name *</Label>
                  <Input
                    id="admin_name"
                    name="admin_name"
                    value={formData.admin_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Admin Email *</Label>
                  <Input
                    id="admin_email"
                    name="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_password">Temporary Password *</Label>
                  <Input
                    id="admin_password"
                    name="admin_password"
                    type="password"
                    value={formData.admin_password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Company')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/companies/${id}` : '/companies')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
