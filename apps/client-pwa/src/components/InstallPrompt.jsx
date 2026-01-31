import React, { useState, useEffect } from 'react';
import { X, Share, MoreVertical, PlusSquare, ArrowDown, ChevronRight } from 'lucide-react';

export default function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        // If already installed, don't show
        if (isStandalone) return;

        // Check if dismissed previously (optional - maybe show every time until installed for now?)
        // const dismissed = localStorage.getItem('pwa_prompt_dismissed');
        // if (dismissed) return;

        // Detect OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const android = /android/.test(userAgent);

        setIsIOS(ios);
        setIsAndroid(android);

        // Only show for mobile/tablet users for now to avoid desktop clutter
        if (ios || android) {
            // Delay slightly for smooth entrance
            setTimeout(() => setShowPrompt(true), 2000);
        }
    }, []);

    const dismiss = () => {
        setShowPrompt(false);
        // localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none p-4 pb-6">
            {/* Backdrop (Click to dismiss) */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity duration-500 animate-in fade-in"
                onClick={dismiss}
            />

            {/* Bottom Sheet */}
            <div className="relative w-full max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-3xl p-6 pointer-events-auto shadow-2xl transform transition-all duration-500 animate-in slide-in-from-bottom-10">

                {/* Close Button */}
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-start gap-4 mb-6">
                    {/* App Icon Glow */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-accent-pink/30 blur-xl rounded-full" />
                        <img
                            src="/pwa-192x192.png"
                            alt="App Icon"
                            className="relative w-16 h-16 rounded-2xl shadow-lg border border-white/10"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white leading-tight">Installer l'App</h3>
                        <p className="text-zinc-400 text-xs font-medium mt-1 leading-relaxed">
                            Pour une meilleure expérience plein écran, ajoutez SprayHub à votre accueil.
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-3">
                    {isIOS && (
                        <>
                            <div className="flex items-center gap-3 text-sm text-zinc-300">
                                <span className="flex items-center justify-center w-6 h-6 bg-zinc-800 rounded-lg text-blue-400">
                                    <Share size={14} />
                                </span>
                                <span>1. Appuyez sur <strong>Partager</strong></span>
                            </div>
                            <div className="w-[1px] h-3 bg-zinc-800 ml-3" />
                            <div className="flex items-center gap-3 text-sm text-zinc-300">
                                <span className="flex items-center justify-center w-6 h-6 bg-zinc-800 rounded-lg text-white">
                                    <PlusSquare size={14} />
                                </span>
                                <span>2. <strong>Sur l'écran d'accueil</strong></span>
                            </div>
                        </>
                    )}

                    {isAndroid && (
                        <>
                            <div className="flex items-center gap-3 text-sm text-zinc-300">
                                <span className="flex items-center justify-center w-6 h-6 bg-zinc-800 rounded-lg text-white">
                                    <MoreVertical size={14} />
                                </span>
                                <span>1. Appuyez sur le <strong>Menu</strong></span>
                            </div>
                            <div className="w-[1px] h-3 bg-zinc-800 ml-3" />
                            <div className="flex items-center gap-3 text-sm text-zinc-300">
                                <span className="flex items-center justify-center w-6 h-6 bg-zinc-800 rounded-lg text-white">
                                    <ArrowDown size={14} />
                                </span>
                                <span>2. <strong>Installer l'application</strong></span>
                            </div>
                        </>
                    )}
                </div>

                {/* Arrow pointing down (Animation) */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-80">
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded-full backdrop-blur-md mb-1">
                        C'est ici 👇
                    </span>
                    <ArrowDown size={24} className="text-accent-pink" />
                </div>
            </div>
        </div>
    );
}
