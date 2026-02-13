
-- Active le système d'envoi automatique des emails de feedback
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard > SQL Editor)

-- 1. Active les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Supprime l'ancien job s'il existe pour éviter les doublons
SELECT cron.unschedule('send-feedback-daily');

-- 3. Planifie la tâche tous les jours à 10h00
-- ⚠️ IMPORTANT : Remplacez 'VOTRE_CLE_SERVICE_ROLE' par votre vraie clé 'service_role' (Project Settings > API)
SELECT cron.schedule(
    'send-feedback-daily',
    '0 10 * * *',
    $$
    SELECT net.http_post(
        url:='https://lvijsqxgrboolsxxlyir.supabase.co/functions/v1/send-feedback',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_CLE_SERVICE_ROLE"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
    $$
);
