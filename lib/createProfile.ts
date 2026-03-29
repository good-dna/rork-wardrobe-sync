import { supabase } from './supabase';

export async function ensureProfileExists() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!existingProfile) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
    });

    if (insertError) {
      throw insertError;
    }
  }
}