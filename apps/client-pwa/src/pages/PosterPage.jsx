import React from 'react';
import { ScanLine } from 'lucide-react';

const NeonHold = ({ color, className, style, rotate }) => {
    return (
        <div
            className={`absolute ${className}`}
            style={{
                background: color,
                transform: `rotate(${rotate || 0}deg)`,
                boxShadow: `
                    inset 2px 2px 5px rgba(255,255,255,0.4), 
                    inset -2px -2px 5px rgba(0,0,0,0.4), 
                    0 0 15px ${color}, 
                    0 0 40px ${color}
                `,
                ...style // Allow overriding
            }}
        />
    );
};

export default function PosterPage() {
    return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 md:p-8 print:p-0 print:bg-white">

            {/* 
                A4 Poster Container 
                Standard A4 Ratio: 1 : 1.414 
                We use a fixed max-width for screen, and full width for print.
            */}
            <div
                className="relative bg-[#050505] text-white overflow-hidden shadow-2xl print:shadow-none"
                style={{
                    width: '100%',
                    maxWidth: '600px', // Screen view width
                    aspectRatio: '1 / 1.414', // Force A4 shape
                    printColorAdjust: 'exact', // Force background colors in print
                    WebkitPrintColorAdjust: 'exact'
                }}
            >
                {/* Background Grid & Vignette */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black pointer-events-none" />

                {/* 
                    NEON HOLDS - Absolute positioning in % to be perfectly scalable
                */}

                {/* Top Left - Green Jug */}
                <NeonHold
                    color="#a3e635"
                    rotate={15}
                    className="w-[12%] h-[8%] top-[8%] left-[10%] rounded-[40%_60%_70%_30%/40%_50%_60%_50%]"
                />

                {/* Top Right - Pink Sloper */}
                <NeonHold
                    color="#ec4899"
                    rotate={-10}
                    className="w-[15%] h-[9%] top-[12%] right-[12%] rounded-[60%_40%_30%_70%/60%_30%_70%_40%]"
                />

                {/* Mid Left - Red Crimp */}
                <NeonHold
                    color="#be185d"
                    rotate={0}
                    className="w-[8%] h-[6%] top-[35%] left-[8%] rounded-[50%_50%_30%_70%/50%_50%_60%_40%]"
                />

                {/* Mid Right - Green Pinch */}
                <NeonHold
                    color="#a3e635"
                    rotate={45}
                    className="w-[10%] h-[7%] top-[40%] right-[8%] rounded-[30%_70%_70%_30%/30%_30%_70%_70%]"
                />

                {/* Bottom Left - Blue Pocket */}
                <NeonHold
                    color="#06b6d4"
                    rotate={-5}
                    className="w-[12%] h-[8%] bottom-[25%] left-[15%] rounded-[70%_30%_30%_70%/60%_40%_60%_40%]"
                />

                {/* Bottom Right - Orange Ledge */}
                <NeonHold
                    color="#f97316"
                    rotate={0}
                    className="w-[10%] h-[10%] bottom-[30%] right-[15%] rounded-[40%_60%_60%_40%/40%_60%_40%_60%]"
                />

                {/* Footer Center - Yellow Footer */}
                <NeonHold
                    color="#f59e0b"
                    rotate={10}
                    className="w-[14%] h-[6%] bottom-[5%] right-[35%] rounded-[50%_50%_20%_80%/25%_75%_25%_75%]"
                />


                {/* CONTENT LAYER */}
                <div className="relative z-10 w-full h-full flex flex-col items-center pt-[15%]">

                    {/* Header Text */}
                    <h3 className="text-accent-pink tracking-[0.25em] font-black text-xs sm:text-sm md:text-base uppercase mb-2 drop-shadow-[0_0_10px_rgba(251,32,86,0.6)]">
                        Les Arts de la Grimpe
                    </h3>

                    <div className="flex items-center gap-4 text-cyan-400 text-[8px] sm:text-[10px] tracking-widest uppercase font-bold mb-10 opacity-90">
                        <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-cyan-400" />
                        Présente
                        <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-cyan-400" />
                    </div>

                    {/* MAIN TITLE WITH GLOW */}
                    <h1 className="text-5xl sm:text-7xl font-black text-white tracking-widest mb-4 drop-shadow-2xl text-center leading-tight mx-4"
                        style={{ fontFamily: 'system-ui', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}
                    >
                        SPRAY<span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">HUB</span>
                    </h1>

                    <p className="text-cyan-300 text-[10px] sm:text-xs tracking-[0.3em] font-bold uppercase mb-16 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                        Scannez pour grimper • Débloquez le mur
                    </p>

                    {/* QR CODE CARD */}
                    <div className="relative group">
                        {/* Glow Behind */}
                        <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500 via-white to-yellow-500 rounded-xl blur opacity-40"></div>

                        {/* Frame Corners */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-lg -translate-x-2 -translate-y-2"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-yellow-400 rounded-tr-lg translate-x-2 -translate-y-2"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-lg -translate-x-2 translate-y-2"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-yellow-400 rounded-br-lg translate-x-2 translate-y-2"></div>

                        {/* White Card */}
                        <div className="relative bg-white w-48 h-48 sm:w-64 sm:h-64 rounded-xl flex flex-col items-center justify-center p-4 shadow-2xl">
                            {/* FAKE QR PATTERN */}
                            <div className="w-full h-full border-2 border-dashed border-zinc-200 rounded flex flex-col items-center justify-center bg-zinc-50">
                                <ScanLine size={40} className="text-zinc-300 mb-2" />
                                <span className="text-2xl font-light text-zinc-900 tracking-[0.2em] uppercase">Qr</span>
                                <span className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Scanner ici</span>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-auto pb-[8%] flex flex-col items-center gap-3 text-center">
                        <p className="text-[8px] text-zinc-500 tracking-[0.4em] font-medium uppercase font-mono">
                            Precision AI • Route Recognition • Community
                        </p>
                        <div className="h-[1px] w-20 bg-zinc-800" />
                        <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">
                            Product by Charly Tech & Luxe
                        </p>
                    </div>

                </div>
            </div>

            {/* Print Button only visible on screen */}
            <button
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform print:hidden z-50 flex items-center gap-2"
            >
                🖨️ Imprimer l'Affiche
            </button>
        </div>
    );
}
