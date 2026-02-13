import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (!RESEND_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'RESEND_API_KEY is missing' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        // 1. Get candidates via secure RPC
        const { data: candidates, error: candidateError } = await supabase.rpc('get_feedback_candidates')

        if (candidateError) throw candidateError

        console.log(`Found ${candidates?.length || 0} candidates for feedback email.`)

        const results = []

        if (candidates && candidates.length > 0) {
            for (const user of candidates) {
                // Send Email via Resend
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: 'SprayHub <team@sprayhub.app>', // Change this to your verify domain
                        to: [user.email],
                        subject: 'Votre avis compte pour nous ! 🧗‍♂️',
                        html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Salut ! 👋</h1>
                <p>Cela fait maintenant une semaine que vous avez rejoint SprayHub.</p>
                <p>Nous aimerions beaucoup avoir votre retour d'expérience pour améliorer l'application.</p>
                <p>Avez-vous rencontré des problèmes ? Avez-vous des suggestions ?</p>
                <p>Répondez simplement à cet email ou contactez-nous via l'application.</p>
                <br/>
                <p>À très vite sur le mur !</p>
                <p>L'équipe SprayHub</p>
              </div>
            `,
                    }),
                })

                const data = await res.json()

                if (res.ok) {
                    // Log successful send so we don't send again
                    await supabase.from('feedback_email_logs').insert({ user_id: user.id })
                    console.log(`Sent email to ${user.email}`)
                    results.push({ email: user.email, status: 'sent', id: data.id })
                } else {
                    console.error(`Failed to send to ${user.email}`, data)
                    results.push({ email: user.email, status: 'failed', error: data })
                }
            }
        }

        return new Response(
            JSON.stringify({ message: 'Process completed', results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
