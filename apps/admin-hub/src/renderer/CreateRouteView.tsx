import React from 'react';
import { ExternalLink } from 'lucide-react';

export function CreateRouteView() {
    const pwaUrl = 'https://sprayhub-coach.vercel.app/create';

    const handleOpenInBrowser = () => {
        window.open(pwaUrl, '_blank');
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold">Créer un Bloc</h3>
                    <p className="text-sm text-zinc-500 italic">
                        Interface de création de blocs (depuis la PWA)
                    </p>
                </div>
                <button
                    onClick={handleOpenInBrowser}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                >
                    <ExternalLink size={16} />
                    Ouvrir dans le navigateur
                </button>
            </div>

            <div className="flex-1 bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden">
                <iframe
                    src={pwaUrl}
                    className="w-full h-full"
                    title="Créer un bloc"
                    style={{
                        border: 'none',
                        backgroundColor: '#09090b'
                    }}
                />
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-400">
                    💡 <strong>Astuce :</strong> Vous pouvez créer des blocs directement depuis l'Admin Hub.
                    Les blocs créés apparaîtront immédiatement dans la PWA et dans la section Modération.
                </p>
            </div>
        </div>
    );
}
