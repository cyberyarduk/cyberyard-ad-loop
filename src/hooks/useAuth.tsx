import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type UserRole = 'super_admin' | 'company_admin' | 'company_user';

interface Profile {
  id: string;
  role: UserRole;
  company_id: string | null;
  is_active: boolean;
  email: string | null;
  full_name: string | null;
}

interface Company {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'expired' | 'suspended';
  start_date: string;
  end_date: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  checkAccess: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
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

  const checkAccess = () => {
    if (!profile) return false;
    
    // Super admins always have access
    if (profile.role === 'super_admin') return true;

    // Check if user is active
    if (!profile.is_active) {
      toast.error('Your account has been deactivated. Please contact support.');
      return false;
    }

    // Check company status and dates
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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Defer profile and company fetching
          setTimeout(async () => {
            const userProfile = await fetchProfile(currentSession.user.id);
            setProfile(userProfile);

            if (userProfile?.company_id) {
              const userCompany = await fetchCompany(userProfile.company_id);
              setCompany(userCompany);
            }
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setCompany(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        setTimeout(async () => {
          const userProfile = await fetchProfile(currentSession.user.id);
          setProfile(userProfile);

          if (userProfile?.company_id) {
            const userCompany = await fetchCompany(userProfile.company_id);
            setCompany(userCompany);
          }
          setLoading(false);
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
    navigate('/auth');
  };

  const isSuperAdmin = profile?.role === 'super_admin';
  const isCompanyAdmin = profile?.role === 'company_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        company,
        loading,
        signOut,
        isSuperAdmin,
        isCompanyAdmin,
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
