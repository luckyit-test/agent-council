-- Удаляем тестовый ключ OpenAI
DELETE FROM user_api_keys WHERE user_id = '00000000-0000-0000-0000-000000000000' AND provider = 'openai';

-- Удаляем RLS политику для тестового пользователя так как она больше не нужна
DROP POLICY IF EXISTS "Allow test user operations" ON user_api_keys;