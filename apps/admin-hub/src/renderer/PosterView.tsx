import React, { useState } from 'react';
import { Printer, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { cn } from './lib/utils';

// Interfaces for Props
interface NeonHoldProps {
    color: string;
    className?: string;
    style?: React.CSSProperties;
    rotate?: number;
    isPrint: boolean;
}

const NeonHold = ({ color, className, style, rotate, isPrint }: NeonHoldProps) => {
    return (
        <div
            className={cn(
                `absolute ${className} neon-hold-print-fix`,
                // In print mode, we keep shadow for the effect but make it print-friendly if possible
                isPrint && "print:shadow-[0_0_10px_var(--neon-color)]"
            )}
            style={{
                "--neon-color": color,
                background: color,
                transform: `rotate(${rotate || 0}deg)`,
                // Intelligent Shadow: Dark mode gets glow + inset. Light mode gets colored shadow + inset for depth.
                boxShadow: isPrint ? `
                    inset 2px 2px 5px rgba(255,255,255,0.7), 
                    inset -2px -2px 5px rgba(0,0,0,0.1), 
                    0 4px 10px ${color}80
                ` : `
                    inset 2px 2px 5px rgba(255,255,255,0.4), 
                    inset -2px -2px 5px rgba(0,0,0,0.4), 
                    0 0 15px ${color}, 
                    0 0 40px ${color}
                `,
                ...style
            } as React.CSSProperties}
        >
            {/* Force print styles to include shadows if browser allows */}
            {/* Using a standard style tag for print media query, scoped to this component class */}
            <style>{`
                @media print {
                    .neon-hold-print-fix {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        box-shadow: inset 2px 2px 5px rgba(255,255,255,0.7), inset -2px -2px 5px rgba(0,0,0,0.1), 0 4px 10px var(--neon-color) !important;
                    }
                }
            `}</style>
        </div>
    );
};

function PosterView() {
    const [previewPrint, setPreviewPrint] = useState(false);

    React.useEffect(() => {
        const handleBeforePrint = () => {
            setPreviewPrint(true);
        };
        const handleAfterPrint = () => {
            setPreviewPrint(false);
        };

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    // Apply print styles if preview is active OR during actual print
    const isPrint = previewPrint;

    const handlePrint = () => {
        setPreviewPrint(true);
        setTimeout(() => {
            window.print();
        }, 500); // Give React time to render the light theme
    };

    return (
        <div className={cn(
            "h-full flex flex-col items-center justify-center p-4 md:p-8 transition-colors duration-500 overflow-y-auto",
            isPrint ? "bg-zinc-200" : "bg-transparent", // Adjusted bg for admin hub context
            "print:bg-white print:p-0 print:m-0 print:h-auto print:min-h-0 print:fixed print:inset-0 print:z-[9999]"
        )}>
            <style>{`
                @media print {
                    body, html, #root {
                        background-color: white !important;
                        background: white !important;
                        color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }
                    /* NUCLEAR OPTION: Force everything else to be white or transparent in print to kill dark bars */
                    *:not(.poster-container):not(.poster-container *) {
                        background-color: white !important;
                        color: black !important;
                    }
                    /* Hide everything else if not scoped, but since we are handling this component, we assume it takes full page */
                    @page {
                        margin: 0;
                    }
                    /* Force full width in print, overriding the inline max-width */
                    .poster-container {
                        max-width: none !important;
                        width: 100% !important;
                        height: 100% !important;
                        aspect-ratio: auto !important; /* Allow filling the page */
                    }
                }
            `}</style>
            {/* Global Print Styles for Neon Holds */}
            <style>{`
                @media print {
                    .neon-hold-print-fix {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        box-shadow: inset 2px 2px 5px rgba(255,255,255,0.7), inset -2px -2px 5px rgba(0,0,0,0.1), 0 4px 10px var(--neon-color) !important;
                    }
                }
            `}</style>

            {/* 
                A4 Poster Container 
                Standard A4 Ratio: 1 : 1.414 
                We use a fixed max-width for screen, and full width for print.
            */}
            <div
                className={cn(
                    "poster-container relative overflow-hidden shadow-2xl transition-colors duration-500 shrink-0",
                    isPrint ? "bg-zinc-100 text-zinc-900 shadow-xl border border-white/50" : "bg-zinc-900 text-white",
                    "print:shadow-none print:bg-zinc-100 print:text-zinc-900 print:overflow-visible print:border-none print:w-full print:h-full print:max-w-none"
                )}
                style={{
                    width: '100%',
                    maxWidth: '500px', // Slightly smaller for admin hub view
                    aspectRatio: '1 / 1.414', // Force A4 shape
                }}
            >
                {/* Background Grid & Vignette - Adjusted for Light Mode */}
                <div className={cn(
                    "absolute inset-0 bg-[size:40px_40px] opacity-20 print:opacity-10 transition-opacity",
                    isPrint
                        ? "bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)]"
                        : "bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]",
                    // FORCE PRINT STYLE: Always use the dark lines (for light background) when printing
                    "print:bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)]"
                )} />

                {/* Vignette: Dark for dark mode, subtle shadow for light mode */}
                <div className={cn(
                    "absolute inset-0 pointer-events-none transition-colors",
                    isPrint
                        ? "bg-radial-gradient from-transparent via-transparent to-black/5"
                        : "bg-radial-gradient from-transparent via-black/20 to-black/40",
                    // FORCE PRINT STYLE: Always use the light mode vignette (subtle)
                    "print:bg-radial-gradient print:from-transparent print:via-transparent print:to-black/5"
                )} />

                {/* 
                    NEON HOLDS - Absolute positioning in % to be perfectly scalable
                */}

                {/* Top Left - Green Jug */}
                <NeonHold
                    isPrint={isPrint}
                    color="#a3e635"
                    rotate={15}
                    className="w-[12%] h-[8%] top-[8%] left-[10%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%]"
                />

                {/* Top Right - Pink Sloper */}
                <NeonHold
                    isPrint={isPrint}
                    color="#ec4899"
                    rotate={-10}
                    className="w-[15%] h-[9%] top-[12%] right-[12%] rounded-[60%_40%_30%_70%/60%_30%_70%_40%]"
                />

                {/* Mid Left - Red Crimp */}
                <NeonHold
                    isPrint={isPrint}
                    color="#be185d"
                    rotate={0}
                    className="w-[8%] h-[6%] top-[35%] left-[8%] rounded-[50%_50%_30%_70%/50%_50%_60%_40%]"
                />

                {/* Mid Right - Green Pinch */}
                <NeonHold
                    isPrint={isPrint}
                    color="#a3e635"
                    rotate={45}
                    className="w-[10%] h-[7%] top-[40%] right-[8%] rounded-[30%_70%_70%_30%/30%_30%_70%_70%]"
                />

                {/* Bottom Left - Blue Pocket */}
                <NeonHold
                    isPrint={isPrint}
                    color="#06b6d4"
                    rotate={-5}
                    className="w-[12%] h-[8%] bottom-[25%] left-[15%] rounded-[70%_30%_30%_70%/60%_40%_60%_40%]"
                />

                {/* Bottom Right - Orange Ledge */}
                <NeonHold
                    isPrint={isPrint}
                    color="#f97316"
                    rotate={0}
                    className="w-[10%] h-[10%] bottom-[30%] right-[15%] rounded-[40%_60%_60%_40%/40%_60%_40%_60%]"
                />

                {/* Footer Center - Yellow Footer */}
                <NeonHold
                    isPrint={isPrint}
                    color="#f59e0b"
                    rotate={10}
                    className="w-[14%] h-[6%] bottom-[5%] right-[35%] rounded-[50%_50%_20%_80%/25%_75%_25%_75%]"
                />


                {/* CONTENT LAYER */}
                <div className="relative z-10 w-full h-full flex flex-col items-center pt-[15%]">

                    {/* Header Text */}
                    <h3 className={cn(
                        "tracking-[0.25em] font-black text-xs sm:text-sm md:text-base uppercase mb-2 transition-colors",
                        isPrint ? "text-rose-500 drop-shadow-none" : "text-rose-500 drop-shadow-[0_0_10px_rgba(251,32,86,0.6)]",
                        "print:text-rose-500 print:drop-shadow-none"
                    )}>
                        Les Arts de la Grimpe
                    </h3>

                    <div className={cn(
                        "flex items-center gap-4 text-[8px] sm:text-[10px] tracking-widest uppercase font-bold mb-10 opacity-90 transition-colors",
                        isPrint ? "text-cyan-600" : "text-cyan-400",
                        "print:text-cyan-600"
                    )}>
                        <div className={cn("h-[1px] w-8 sm:w-12 transition-colors", isPrint ? "bg-gradient-to-r from-transparent to-cyan-600" : "bg-gradient-to-r from-transparent to-cyan-400", "print:from-transparent print:to-cyan-600")} />
                        Présente
                        <div className={cn("h-[1px] w-8 sm:w-12 transition-colors", isPrint ? "bg-gradient-to-l from-transparent to-cyan-600" : "bg-gradient-to-l from-transparent to-cyan-400", "print:from-transparent print:to-cyan-600")} />
                    </div>

                    {/* MAIN TITLE WITH GLOW */}
                    <h1 className={cn(
                        "text-5xl sm:text-7xl font-black tracking-widest mb-4 text-center leading-tight mx-4 transition-colors",
                        isPrint ? "text-zinc-800 drop-shadow-sm" : "text-white drop-shadow-2xl",
                        "print:text-zinc-800 print:drop-shadow-sm"
                    )}
                        style={{ fontFamily: 'system-ui', textShadow: isPrint ? '0 2px 10px rgba(0,0,0,0.1)' : '0 0 30px rgba(255,255,255,0.2)' }}
                    >
                        SPRAY<span className={cn(
                            "transition-colors",
                            isPrint ? "text-zinc-500 bg-none" : "text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400",
                            "print:text-zinc-500 print:bg-none"
                        )}>HUB</span>
                    </h1>

                    <p className={cn(
                        "text-[10px] sm:text-xs tracking-[0.3em] font-bold uppercase mb-16 transition-colors",
                        isPrint ? "text-cyan-600 drop-shadow-none" : "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]",
                        "print:text-cyan-600 print:drop-shadow-none"
                    )}>
                        Scannez pour grimper • Débloquez le mur
                    </p>

                    {/* QR CODE CARD */}
                    <div className={cn("relative group transition-all", isPrint && "shadow-xl shadow-black/5")}>
                        {/* Glow Behind - Hidden in Print but visible in light mode preview */}
                        <div className={cn(
                            "absolute -inset-1 bg-gradient-to-tr from-cyan-500 via-white to-yellow-500 rounded-xl blur opacity-40 transition-opacity",
                            isPrint ? "opacity-30 print:hidden" : "opacity-40"
                        )}></div>

                        {/* Frame Corners - Darker in Print */}
                        <div className={cn("absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] rounded-tl-lg -translate-x-2 -translate-y-2 transition-colors", isPrint ? "border-cyan-500" : "border-cyan-400", "print:border-cyan-500")}></div>
                        <div className={cn("absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] rounded-tr-lg translate-x-2 -translate-y-2 transition-colors", isPrint ? "border-yellow-500" : "border-yellow-400", "print:border-yellow-500")}></div>
                        <div className={cn("absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] rounded-bl-lg -translate-x-2 translate-y-2 transition-colors", isPrint ? "border-cyan-500" : "border-cyan-400", "print:border-cyan-500")}></div>
                        <div className={cn("absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] rounded-br-lg translate-x-2 translate-y-2 transition-colors", isPrint ? "border-yellow-500" : "border-yellow-400", "print:border-yellow-500")}></div>

                        {/* White Card */}
                        <div className={cn(
                            "relative bg-white w-48 h-48 sm:w-64 sm:h-64 rounded-xl flex flex-col items-center justify-center p-2 overflow-hidden transition-all",
                            isPrint ? "shadow-inner border border-zinc-100" : "shadow-2xl",
                            "print:shadow-none print:border print:border-zinc-200"
                        )}>
                            {/* ACTUAL QR IMAGE */}
                            <img
                                src="/app-qrcode.png"
                                alt="Scan to Climb"
                                className="w-full h-full object-contain mix-blend-multiply"
                            />
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className={cn("mt-auto pb-[8%] flex flex-col items-center gap-3 text-center transition-colors", isPrint ? "text-zinc-800" : "text-white", "print:text-zinc-800")}>
                        <div className={cn("h-[1px] w-20 transition-colors", isPrint ? "bg-zinc-300" : "bg-zinc-800", "print:bg-zinc-300")} />
                        <p className={cn("text-[7px] font-bold uppercase tracking-widest transition-colors", isPrint ? "text-zinc-500" : "text-cyan-400", "print:text-zinc-500")}>
                            Product by Charly Tech & Luxe
                        </p>
                    </div>

                </div>
            </div>

            {/* Print Controls */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-3 print:hidden z-50">
                <button
                    onClick={() => setPreviewPrint(!previewPrint)}
                    className="bg-zinc-800 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 border border-white/10"
                >
                    {previewPrint ? <EyeOff size={18} /> : <Eye size={18} />}
                    {previewPrint ? "Mode Sombre (Écran)" : "Aperçu Impression (Gris Clair)"}
                </button>

                <button
                    onClick={() => window.open('https://sprayhub.vercel.app/poster', '_blank')}
                    className="bg-zinc-800 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 border border-white/10"
                >
                    <ExternalLink size={18} />
                    Ouvrir dans le navigateur
                </button>

                <button
                    onClick={handlePrint}
                    className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <Printer size={18} />
                    Imprimer l'Affiche
                </button>
            </div>
        </div>
    );
}

export { PosterView };
