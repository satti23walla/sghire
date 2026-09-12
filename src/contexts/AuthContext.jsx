import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  function emailExistsError() {
    const err = new Error('An account with this email already exists. Try signing in instead.')
    err.code = 'EMAIL_EXISTS'
    return err
  }

  async function signUp({ email, password, role, fullName, companyName }) {
    let data, error
    try {
      ;({ data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            company_name: role === 'employer' ? companyName : '',
          }
        }
      }))
    } catch (thrown) {
      error = thrown
    }

    if (error) {
      const msg = (error.message || '').toLowerCase()

      // Supabase returns this only when email confirmation is disabled
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        throw emailExistsError()
      }

      // A duplicate signup makes Supabase re-send the confirmation email. If that
      // SMTP call stalls, the browser gets an unreadable response and fetch fails,
      // so this message has to cover both causes.
      if (msg.includes('failed to fetch') || msg.includes('load failed') || msg.includes('network')) {
        throw new Error(
          'We could not complete signup. If you already have an account with this email, sign in instead — otherwise check your connection and try again.'
        )
      }

      if (msg.includes('rate limit') || msg.includes('too many')) {
        throw new Error('Too many attempts. Please wait a few minutes and try again.')
      }

      throw error
    }

    // With email confirmation on, Supabase does not error on a duplicate — it
    // returns a placeholder user with an empty identities array to avoid
    // revealing which emails are registered. That empty array is the signal.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw emailExistsError()
    }

    // Profile is created automatically by database trigger (handle_new_user)
    // No manual INSERT needed — trigger runs as SECURITY DEFINER, bypasses RLS
    return data
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
