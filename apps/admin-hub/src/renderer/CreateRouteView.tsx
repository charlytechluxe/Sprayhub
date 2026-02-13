
import React from 'react';
import { ExternalLink } from 'lucide-react';

export function CreateRouteView() {
    const pwaUrl = 'https://sprayhub.vercel.app/create';

    const [zoom, setZoom] = React.useState(0.85);

    const handleOpenInBrowser = () => {
        window.open(pwaUrl, '_blank');
    };

    return (
        <div className="h-full w-full relative bg-zinc-950 flex flex-col overflow-hidden">
            {/* Floating Action Bar */}
            <div className="absolute top-4 right-4 z-50 flex gap-2 items-center">
                <div className="flex bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-lg p-1 gap-1">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800 font-bold">-</button>
                    <span className="text-[10px] text-zinc-500 w-8 text-center flex items-center justify-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800 font-bold">+</button>
                </div>

                <button
                    onClick={handleOpenInBrowser}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/90 text-white rounded-lg font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 text-xs backdrop-blur-sm"
                >
                    <ExternalLink size={14} />
                    Ouvrir PWA
                </button>
            </div>

            <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-zinc-950/50">
                <div
                    style={{
                        width: `${100 / zoom}%`,
                        height: `${100 / zoom}%`,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center',
                    }}
                    className="transition-transform duration-200 ease-out"
                >
                    <iframe
                        src={pwaUrl}
                        className="w-full h-full border-none"
                        title="Créer un bloc"
                        style={{ backgroundColor: '#000' }}
                    />
                </div>
            </div>
        </div>
    );
}
