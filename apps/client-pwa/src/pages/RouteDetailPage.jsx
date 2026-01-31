import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SprayCanvas from '../components/SprayCanvas';

export default function RouteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);

    const imageUrl = "/wall_v1.jpg";

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                const { data, error } = await supabase
                    .from('routes')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setRoute(data);
            } catch (err) {
                console.error("Error fetching route:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRoute();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">Chargement...</div>;
    if (!route) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">Bloc introuvable.</div>;

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md absolute top-0 left-0 right-0 z-50">
                <button onClick={() => navigate(-1)} className="btn-touch w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                    <ChevronLeft size={24} />
                </button>

                <div className="text-center">
                    <h1 className="font-black text-lg text-white leading-none">{route.name}</h1>
                    <span className="text-xs font-bold text-accent-pink uppercase tracking-widest">{route.grade}</span>
                </div>

                <button className="btn-touch w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                    <Share2 size={20} />
                </button>
            </header>

            {/* Canvas Area - Full Screen */}
            <div className="flex-1 relative bg-black">
                <SprayCanvas
                    imageUrl={imageUrl}
                    holds={route.holds || []}
                    isEditable={false}
                // No handlers needed for read-only
                />
            </div>

            {/* Footer / Action Bar */}
            <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Créateur</span>
                        <span className="text-sm font-bold text-white">Coach (Admin)</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                            <Heart className="" size={24} />
                        </button>
                        <button className="h-12 px-6 rounded-xl bg-white text-black font-black uppercase tracking-wider text-sm hover:scale-105 transition-transform">
                            Valider
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
