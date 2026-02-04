import { FileImage } from 'lucide-react';

function PosterView() {
    const posterUrl = 'https://sprayhub-coach.vercel.app/poster';

    const handleOpenInBrowser = () => {
        window.open(posterUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Affiche SprayHub</h3>
                    <p className="text-sm text-zinc-500 italic">Créez et imprimez l'affiche promotionnelle avec QR code.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleOpenInBrowser}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-lg shadow-rose-500/20"
                    >
                        <FileImage size={16} />
                        Ouvrir dans le navigateur
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800">
                <div className="aspect-[1/1.414] bg-black rounded-2xl overflow-hidden border border-zinc-700">
                    <iframe
                        src={posterUrl}
                        className="w-full h-full"
                        title="SprayHub Poster"
                        style={{ border: 'none' }}
                    />
                </div>
                <div className="mt-4 text-center">
                    <p className="text-xs text-zinc-500">
                        💡 Cliquez sur "Ouvrir dans le navigateur" pour imprimer l'affiche en format A4
                    </p>
                </div>
            </div>
        </div>
    );
}

export { PosterView };
