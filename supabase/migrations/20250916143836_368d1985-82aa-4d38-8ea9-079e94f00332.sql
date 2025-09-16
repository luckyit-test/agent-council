-- Временно создаем политику для тестового пользователя
-- Это позволит работать без аутентификации на этапе разработки

CREATE POLICY "Allow test user operations" 
ON public.user_api_keys 
FOR ALL 
USING (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);