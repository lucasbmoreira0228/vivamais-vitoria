CREATE TABLE public.cadastros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL CHECK (tipo IN ('aprender','ensinar')),
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 120),
  email text CHECK (email IS NULL OR char_length(email) <= 255),
  telefone text NOT NULL CHECK (char_length(telefone) BETWEEN 8 AND 30),
  bairro text CHECK (bairro IS NULL OR char_length(bairro) <= 100),
  area text NOT NULL CHECK (char_length(area) BETWEEN 2 AND 120),
  mensagem text CHECK (mensagem IS NULL OR char_length(mensagem) <= 1000)
);
GRANT INSERT ON public.cadastros TO anon, authenticated;
GRANT ALL ON public.cadastros TO service_role;
ALTER TABLE public.cadastros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer pessoa pode se cadastrar" ON public.cadastros FOR INSERT TO anon, authenticated WITH CHECK (true);