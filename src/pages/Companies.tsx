import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Companies() {
  const navigate = useNavigate();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'expired':
        return 'bg-red-500';
      case 'suspended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-muted-foreground mt-2">
              Manage customer accounts and subscriptions
            </p>
          </div>
          <Button onClick={() => navigate('/companies/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading companies...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Devices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies?.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/companies/${company.id}`)}
                  >
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{company.primary_contact_name}</div>
                        <div className="text-muted-foreground">
                          {company.primary_contact_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {company.plan_type} - {company.term_months} months
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(company.status)}>
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(company.start_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(company.end_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {company.device_limit || 'Unlimited'}
                    </TableCell>
                  </TableRow>
                ))}
                {companies?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No companies found. Create your first company to get
                      started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
