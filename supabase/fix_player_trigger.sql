-- Fix: auto-criar perfil de player via trigger quando auth.users recebe novo usuário.
-- O trigger roda com SECURITY DEFINER, então bypassa a RLS corretamente.
-- Execute no SQL Editor do Supabase.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (auth_id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'Player_' || substring(NEW.id::text, 1, 8)
    )
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
