import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  displayName: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [displayName, setDisplayName] = useState<string>('Colaborador');
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to resolve display name
  const resolveDisplayName = async (currentUser: User | null): Promise<string> => {
    if (!currentUser) return 'Colaborador';

    // 1. Check user_metadata
    const metaName = currentUser.user_metadata?.display_name || currentUser.user_metadata?.full_name;
    if (metaName && typeof metaName === 'string') {
      return metaName;
    }

    // 2. Check profiles table
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (data?.display_name) {
          return data.display_name;
        }
      } catch (err) {
        console.warn('Could not query profiles table:', err);
      }
    }

    // 3. Infer from email
    const email = currentUser.email || '';
    if (email.toLowerCase().includes('rafael')) return 'Rafael';
    if (email.toLowerCase().includes('leonardo')) return 'Leonardo';

    const localPart = email.split('@')[0] || '';
    if (localPart) {
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }

    return 'Colaborador';
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const name = await resolveDisplayName(session.user);
        setDisplayName(name);
      }
      setLoading(false);
    });

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const name = await resolveDisplayName(session.user);
        setDisplayName(name);
      } else {
        setDisplayName('Colaborador');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const name = await resolveDisplayName(user);
      setDisplayName(name);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Configure o Supabase nas variáveis de ambiente primeiro.') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: new Error(error.message || 'Falha ao autenticar.') };
    }

    if (data.user) {
      const name = await resolveDisplayName(data.user);
      setDisplayName(name);
    }

    return { error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setDisplayName('Colaborador');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        displayName,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
