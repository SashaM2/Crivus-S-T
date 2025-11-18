-- Script para permitir leitura pública de quizzes (necessário para tracking externo)
-- Isso permite que a API de eventos verifique se um quiz existe usando a anon key

-- Adicionar política pública para leitura de quizzes
-- Isso é seguro porque quiz IDs são públicos por natureza (usados em URLs e tracking)
create policy "public select quizzes" on quizzes
for select
using (true);

-- Nota: Esta política permite que qualquer pessoa (incluindo usuários não autenticados)
-- possa verificar se um quiz existe. Isso é necessário para o sistema de tracking funcionar
-- com requisições externas que não têm autenticação.

