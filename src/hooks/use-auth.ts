import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      await supabase.auth.setSession(data.session);
      return data.session;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign up user:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Supabase signup error:", error);

        // Check if this is a user_already_exists error
        if (
          error.message?.includes("already registered") ||
          error.message?.includes("already exists")
        ) {
          // Try to see if we can sign in with the credentials
          try {
            console.log("User already exists, attempting to sign in instead");
            const signInResult = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInResult.error) {
              console.error(
                "Failed to sign in with existing credentials:",
                signInResult.error
              );
              return {
                success: false,
                user: null,
                session: null,
                error: {
                  message:
                    "User already exists but provided password doesn't match. Please use the sign-in page.",
                },
              };
            }

            // Successfully signed in with existing account
            if (signInResult.data?.session) {
              setSession(signInResult.data.session);
              setUser(signInResult.data.session.user);
              await supabase.auth.setSession(signInResult.data.session);

              return {
                success: true,
                user: signInResult.data.user,
                session: signInResult.data.session,
                error: null,
              };
            }
          } catch (signInError) {
            console.error("Error during fallback sign-in:", signInError);
          }
        }

        return {
          success: false,
          user: null,
          session: null,
          error: { message: error.message },
        };
      }

      if (data?.session) {
        console.log("User signed up successfully, setting session");
        setSession(data.session);
        setUser(data.session.user);
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        success: false,
        user: null,
        session: null,
        error: { message: "An unexpected error occurred" },
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    router.push("/");
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
