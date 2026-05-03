import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type UserRole = 'super_admin' | 'company_admin' | 'company_user' | 'salesperson';

interface Profile {
  id: string;
  role: UserRole;
  company_id: string | null;
  is_active: boolean;
  email: string | null;
  full_name: string | null;
  must_change_password: boolean;
}

interface Company {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'expired' | 'suspended';
  start_date: string;
  end_date: string;
}

interface Salesperson {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  email: string;
  area: string | null;
  monthly_target: number;
  start_date: string;
  active: boolean;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  salesperson: Salesperson | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isSalesperson: boolean;
  checkAccess: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [salesperson, setSalesperson] = useState<Salesperson | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  };

  const fetchCompany = async (companyId: string) => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, status, start_date, end_date')
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      return null;
    }

    return data as Company;
  };

  const fetchSalesperson = async (userId: string) => {
    const { data, error } = await supabase
      .from('salespeople')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching salesperson:', error);
      return null;
    }
    return data as Salesperson | null;
  };

  const checkAccess = () => {
    if (!profile) return false;
    if (profile.role === 'super_admin') return true;
    if (profile.role === 'salesperson') return !!salesperson?.active;

    if (!profile.is_active) {
      toast.error('Your account has been deactivated. Please contact support.');
      return false;
    }

    if (company) {
      const today = new Date();
      const startDate = new Date(company.start_date);
      const endDate = new Date(company.end_date);

      if (company.status !== 'active' || today < startDate || today > endDate) {
        return false;
      }
    }

    return true;
  };

  const loadAll = async (uid: string) => {
    const userProfile = await fetchProfile(uid);
    setProfile(userProfile);

    if (userProfile?.company_id) {
      const userCompany = await fetchCompany(userProfile.company_id);
      setCompany(userCompany);
    } else {
      setCompany(null);
    }

    if (userProfile?.role === 'salesperson') {
      const sp = await fetchSalesperson(uid);
      setSalesperson(sp);
    } else {
      setSalesperson(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setLoading(true);
          setTimeout(() => {
            loadAll(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setCompany(null);
          setSalesperson(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        setLoading(true);
        setTimeout(() => {
          loadAll(currentSession.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
    setSalesperson(null);
    navigate('/auth');
  };

  const isSuperAdmin = profile?.role === 'super_admin';
  const isCompanyAdmin = profile?.role === 'company_admin';
  const isSalesperson = profile?.role === 'salesperson';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        company,
        salesperson,
        loading,
        signOut,
        isSuperAdmin,
        isCompanyAdmin,
        isSalesperson,
        checkAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
