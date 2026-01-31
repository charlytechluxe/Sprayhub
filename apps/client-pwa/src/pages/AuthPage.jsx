import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Apple, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function AuthPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSocialLogin = async (provider) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/profile`, // Mobile friendly redirect
                },
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                // Ideally show "Check email" message here
                alert('Vérifiez votre email pour confirmer votre compte !');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/profile');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-accent-pink/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 flex flex-col gap-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter italic uppercase">
                        SPRAY<span className="text-accent-pink">HUB</span>
                    </h1>
                    <p className="text-zinc-400 font-medium">Rejoignez la communauté</p>
                </div>

                {/* Social Login Buttons */}
                <div className="flex flex-col gap-3">
                    {/* Apple Login - Disabled (Requires Paid Account) */}
                    {/*
                    <button
                        onClick={() => handleSocialLogin('apple')}
                        disabled={loading}
                        className="h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-3 font-bold text-lg hover:bg-zinc-200 transition-colors active:scale-[0.98] disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.82 3.8-.73 2.07.13 3.44 1.18 4.29 2.53-1.45.89-2.02 2.67-1.43 4.45.9 2.72 3.63 3.33 3.63 3.33-.03.11-.53 1.73-1.37 3.05zm-4.48-15c.67-.84.97-1.99.78-3.11-1.29.07-2.61.88-3.3 2.01-.62.98-.81 2.16-.62 3.01 1.48.09 2.65-.83 3.14-1.91z" /></svg>
                        Continuer avec Apple
                    </button>
                    */}

                    <button
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="h-14 bg-zinc-900 border border-zinc-800 text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg hover:bg-zinc-800 transition-colors active:scale-[0.98] disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" /></svg>
                        Continuer avec Google
                    </button>
                </div>

                <div className="relative flex items-center justify-center my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
                    <span className="relative bg-black px-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">Ou email</span>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-12 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-pink/50 transition-all font-medium"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-12 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-pink/50 transition-all font-medium"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-accent-pink text-white rounded-2xl font-black text-lg hover:bg-accent-pink/90 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(251,32,86,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                {isSignUp ? "Créer un compte" : "Se connecter"}
                                <ArrowRight size={20} className="opacity-80" />
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div className="text-center">
                    <button
                        onClick={() => { setError(null); setIsSignUp(!isSignUp); }}
                        className="text-zinc-500 text-sm font-medium hover:text-white transition-colors"
                    >
                        {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
                    </button>
                </div>

                <div className="text-center mt-4">
                    <p className="text-[10px] text-zinc-700 max-w-[200px] mx-auto leading-tight">
                        En continuant, vous acceptez nos Conditions d'Utilisation et notre Politique de Confidentialité.
                    </p>
                </div>
            </div>
        </div>
    );
}
