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

    // Social State
    const [isLiked, setIsLiked] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [ascentsCount, setAscentsCount] = useState(0);

    const imageUrl = "/wall_v1.jpg";

    useEffect(() => {
        if (id) {
            fetchRoute();
            checkUserInteractions();
        }
    }, [id]);

    const fetchRoute = async () => {
        try {
            // Fetch Route Data
            const { data, error } = await supabase
                .from('routes')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setRoute(data);

            // Fetch Counts (Simple approach for MVP, can be optimized with count(*))
            const { count: lCount } = await supabase.from('likes').select('user_id', { count: 'exact', head: true }).eq('route_id', id);
            const { count: aCount } = await supabase.from('ascents').select('user_id', { count: 'exact', head: true }).eq('route_id', id);

            setLikesCount(lCount || 0);
            setAscentsCount(aCount || 0);

        } catch (err) {
            console.error("Error fetching route:", err);
        } finally {
            setLoading(false);
        }
    };

    const checkUserInteractions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check Like
        const { data: likeData } = await supabase.from('likes').select('user_id').eq('route_id', id).eq('user_id', user.id).single();
        if (likeData) setIsLiked(true);

        // Check Ascent
        const { data: ascentData } = await supabase.from('ascents').select('id').eq('route_id', id).eq('user_id', user.id).single();
        if (ascentData) setIsSent(true);
    };

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/auth'); return; }

        if (isLiked) {
            // Unlike
            const { error } = await supabase.from('likes').delete().eq('route_id', id).eq('user_id', user.id);
            if (!error) {
                setIsLiked(false);
                setLikesCount(prev => Math.max(0, prev - 1));
            }
        } else {
            // Like
            const { error } = await supabase.from('likes').insert({ route_id: id, user_id: user.id });
            if (!error) {
                setIsLiked(true);
                setLikesCount(prev => prev + 1);
            }
        }
    };

    const handleSend = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/auth'); return; }

        if (isSent) {
            // Remove Ascent (Undo)
            if (!window.confirm("Retirer ce bloc de votre carnet de croix ?")) return;
            const { error } = await supabase.from('ascents').delete().eq('route_id', id).eq('user_id', user.id);
            if (!error) {
                setIsSent(false);
                setAscentsCount(prev => Math.max(0, prev - 1));
            }
        } else {
            // Log Ascent (Validate)
            // TODO: Open Modal for grading/commenting. For now, simple insert.
            const { error } = await supabase.from('ascents').insert({
                route_id: id,
                user_id: user.id,
                suggested_grade: route.grade // Default to route grade
            });
            if (!error) {
                setIsSent(true);
                setAscentsCount(prev => prev + 1);
                // Trigger confetti or animation here ideally
            }
        }
    };

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

                <div className="flex items-center gap-2">
                    <button className="btn-touch w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                        <Share2 size={20} />
                    </button>
                </div>
            </header>

            {/* Canvas Area - Full Screen */}
            <div className="flex-1 relative bg-black">
                <SprayCanvas
                    imageUrl={imageUrl}
                    holds={route.holds || []}
                    isEditable={false}
                />
            </div>

            {/* Footer / Action Bar */}
            <div className="absolute bottom-6 left-4 right-4 safe-bottom">

                {/* Stats Row */}
                <div className="flex items-center justify-center gap-6 mb-4 text-xs font-bold text-white/50 backdrop-blur-sm p-1 rounded-full bg-black/30 mx-auto w-fit px-4 border border-white/5">
                    <span>{ascentsCount} Réussites</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span>{likesCount} Likes</span>
                </div>

                <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Créateur</span>
                        <span className="text-sm font-bold text-white">Coach (Admin)</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLike}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${isLiked ? 'bg-red-500/10 text-red-500 border border-red-500/50' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                        >
                            <Heart className={isLiked ? "fill-current" : ""} size={24} />
                        </button>

                        <button
                            onClick={handleSend}
                            className={`h-12 px-6 rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-95 flex items-center gap-2 ${isSent
                                    ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                                    : 'bg-white text-black hover:scale-105'
                                }`}
                        >
                            {isSent ? "Validé !" : "Valider"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
