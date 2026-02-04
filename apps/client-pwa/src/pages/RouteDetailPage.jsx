import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Heart, Download, Trash2, ArrowLeft, CheckCircle, Star, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SprayCanvas from '../components/SprayCanvas';

export default function RouteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        if (id) {
            fetchRoute();
            checkUserInteractions();
            checkUserRole();
        }
    }, [id]);

    const checkUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
            // Check profile role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile && (profile.role === 'admin' || profile.role === 'coach')) {
                setIsAdmin(true);
            }
        }
    };

    const fetchRoute = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('routes')
                .select('*, wall:walls(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setRoute(data);

            // Set stats counts (placeholders for now if needed, or query them)
            const { count: likes } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('route_id', id);
            const { count: ascents } = await supabase.from('ascents').select('*', { count: 'exact', head: true }).eq('route_id', id);
            setLikesCount(likes || 0);
            setAscentsCount(ascents || 0);

        } catch (err) {
            console.error("Error fetching route:", err);
        } finally {
            setLoading(false);
        }
    };

    const [isLiked, setIsLiked] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [ascentsCount, setAscentsCount] = useState(0);

    const handleDelete = async () => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce bloc ? Cette action est irréversible.")) return;

        try {
            const { error } = await supabase.from('routes').delete().eq('id', id);
            if (error) throw error;
            alert("Bloc supprimé.");
            navigate('/routes');
        } catch (err) {
            console.error("Error deleting route:", err);
            alert("Erreur lors de la suppression.");
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

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-zinc-500">Chargement...</div>;
    if (!route) return <div className="min-h-screen bg-background flex items-center justify-center text-red-500">Bloc introuvable.</div>;

    const allHoldIds = Array.isArray(route.holds) ? route.holds.map(h => h.hold_id) : [];

    return (
        <div className="flex flex-col h-screen bg-background text-white overflow-hidden">
            {/* Header / Canvas Area */}
            <div className="flex-1 relative bg-background">
                <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                    <button onClick={() => navigate(-1)} className="btn-touch w-10 h-10 bg-surface/50 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/10 pointer-events-auto shadow-lg hover:bg-surface/80 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex gap-2 pointer-events-auto">
                        {(isAdmin || currentUserId === route.user_id) && (
                            <button
                                onClick={handleDelete}
                                className="btn-touch w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 backdrop-blur-md border border-red-500/50 shadow-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button className="btn-touch w-10 h-10 bg-surface/50 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/10 shadow-lg hover:bg-surface/80 transition-all">
                            <Share2 size={18} />
                        </button>
                        {/* Poster Button */}
                        <button
                            onClick={() => navigate('/poster', { state: { route } })}
                            className="btn-touch w-10 h-10 bg-accent-pink rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,0,85,0.4)] border border-white/20 hover:scale-105 transition-all"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                <div className="w-full h-full">
                    <SprayCanvas
                        holds={route.holds || []}
                        wallId={route.wall_id}
                        imageUrl={route.wall?.image_url}
                        routeMode={true}
                        isEditable={false}
                    />
                </div>

                {/* Grade Badge Overlay */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="flex items-center justify-center gap-6 mb-4 text-xs font-bold text-white/80 backdrop-blur-md p-2 rounded-full bg-surface/40 mx-auto w-fit px-6 border border-white/10 shadow-xl">
                        <span>{route.grade}</span>
                        <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
                        <span>{allHoldIds.length} Prises</span>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet Details */}
            <div className="bg-surface border-t border-white/5 p-6 rounded-t-3xl -mt-6 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-1 text-white drop-shadow-md">{route.name || "Sans nom"}</h1>
                    </div>
                    {/* Tick Button */}
                    <button
                        onClick={handleSend}
                        className={`px-6 py-3 rounded-2xl font-black uppercase tracking-wider active:scale-95 transition-all flex items-center gap-2 border ${isSent
                            ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] border-green-400/20'
                            : 'bg-accent-pink text-white shadow-[0_0_20px_rgba(255,0,85,0.3)] border-white/10 hover:bg-accent-pink/90'
                            }`}
                    >
                        <CheckCircle size={18} />
                        {isSent ? 'Validé ✓' : 'Croix'}
                    </button>
                </div>

                <div className="bg-surface/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue border border-accent-blue/20">
                            <Star size={20} fill="currentColor" className="text-accent-blue" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Note Moyenne</p>
                            <div className="flex items-center gap-1">
                                <span className="text-white font-black text-lg">4.8</span>
                                <span className="text-zinc-600 text-xs">(12 votes)</span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="text-zinc-600" />
                </div>
            </div>
        </div >
    );
}
