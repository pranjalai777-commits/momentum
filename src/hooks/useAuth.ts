import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

type AuthState = {
  user: User | null;
  session: Session | null;
  isAnonymous: boolean;
  isLoading: boolean;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("[auth] Failed to load session", error);
        }

        if (!cancelled) {
          setSession(data.session ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("[auth] getSession threw", error);
        if (!cancelled) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const isAnonymous = useMemo(() => {
    if (!user) return false;
    return user.is_anonymous || user.app_metadata?.provider === "anonymous";
  }, [user]);

  return { user, session, isAnonymous, isLoading };
}
