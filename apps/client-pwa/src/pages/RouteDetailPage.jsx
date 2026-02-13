import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Heart, Download, Trash2, ArrowLeft, CheckCircle, Star, ChevronRight, Maximize2, Minimize2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SprayCanvas from '../components/SprayCanvas';

export default function RouteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isFullscreen, setIsFullscreen] = useState(false);

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

            // Fetch vote stats
            await fetchVoteStats();

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

    // Voting system
    const [voteStats, setVoteStats] = useState(null);
    const [userVote, setUserVote] = useState(null);

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

        // Check user's vote
        const { data: voteData } = await supabase.from('grade_votes').select('suggested_grade').eq('route_id', id).eq('user_id', user.id).single();
        if (voteData) setUserVote(voteData.suggested_grade);
    };

    const fetchVoteStats = async () => {
        try {
            const { data: votes, error } = await supabase
                .from('grade_votes')
                .select('suggested_grade')
                .eq('route_id', id);

            if (error) throw error;

            if (votes && votes.length > 0) {
                // Count votes by grade
                const voteCounts = {};
                votes.forEach(v => {
                    voteCounts[v.suggested_grade] = (voteCounts[v.suggested_grade] || 0) + 1;
                });

                // Find majority
                const sortedGrades = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
                const [majorityGrade, majorityCount] = sortedGrades[0];

                setVoteStats({
                    total: votes.length,
                    majority: majorityGrade,
                    majorityCount: majorityCount,
                    percentage: Math.round((majorityCount / votes.length) * 100)
                });
            }
        } catch (err) {
            console.error('Error fetching vote stats:', err);
        }
    };

    const handleVote = async (direction) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/auth'); return; }

        const GRADE_ORDER = ['Orange', 'Rose', 'Vert', 'Jaune', 'Bleu', 'Rouge', 'Blanc', 'Projet'];
        const currentIndex = GRADE_ORDER.indexOf(route.grade);

        let newGrade;
        if (direction === 'easier') {
            newGrade = GRADE_ORDER[Math.max(0, currentIndex - 1)];
        } else {
            newGrade = GRADE_ORDER[Math.min(GRADE_ORDER.length - 1, currentIndex + 1)];
        }

        try {
            // Upsert vote (insert or update)
            const { error } = await supabase
                .from('grade_votes')
                .upsert({
                    route_id: id,
                    user_id: user.id,
                    suggested_grade: newGrade
                }, {
                    onConflict: 'route_id,user_id'
                });

            if (error) throw error;

            setUserVote(newGrade);
            await fetchVoteStats();
            await fetchRoute(); // Refresh to see if grade was adjusted

            // Haptic feedback
            if (window.navigator.vibrate) window.navigator.vibrate(50);
        } catch (err) {
            console.error('Error voting:', err);
            alert('Erreur lors du vote');
        }
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

    const allHoldIds = Array.isArray(route.holds) ? route.holds.map(h => h.id) : [];
    const GRADE_ORDER = ['Orange', 'Rose', 'Vert', 'Jaune', 'Bleu', 'Rouge', 'Blanc', 'Projet'];

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            {/* Header / Canvas Area */}
            <div className="flex-1 relative">
                {/* Floating Top Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-touch w-11 h-11 bg-zinc-900/60 rounded-2xl flex items-center justify-center text-white backdrop-blur-xl border border-white/10 pointer-events-auto shadow-2xl hover:bg-zinc-800 transition-all active:scale-90"
                    >
                        <ArrowLeft size={22} strokeWidth={2.5} />
                    </button>

                    <div className="flex gap-2 pointer-events-auto">
                        {(isAdmin || currentUserId === route.user_id) && (
                            <>
                                <button
                                    onClick={handleDelete}
                                    className="btn-touch w-11 h-11 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 backdrop-blur-xl border border-red-500/20 shadow-lg hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button
                                    onClick={() => navigate('/create', { state: { routeToEdit: route } })}
                                    className="btn-touch w-11 h-11 bg-zinc-900/60 rounded-2xl flex items-center justify-center text-white backdrop-blur-xl border border-white/10 shadow-lg hover:bg-zinc-800 transition-all active:scale-90"
                                >
                                    <Edit size={20} />
                                </button>
                            </>
                        )}
                        <button className="btn-touch w-11 h-11 bg-zinc-900/60 rounded-2xl flex items-center justify-center text-white backdrop-blur-xl border border-white/10 shadow-lg hover:bg-zinc-800 transition-all active:scale-90">
                            <Share2 size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/poster', { state: { route } })}
                            className="btn-touch w-11 h-11 bg-accent-pink rounded-2xl flex items-center justify-center text-white shadow-[0_8px_20px_rgba(251,32,86,0.3)] border border-white/20 hover:scale-105 transition-all active:scale-90"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                <div className="w-full h-full bg-zinc-950">
                    <SprayCanvas
                        holds={route.holds || []}
                        wallId={route.wall_id}
                        imageUrl={route.wall?.image_url}
                        routeMode={true}
                        isEditable={false}
                    />
                </div>

                {/* Refined Canvas Info Overlay - Hidden in Fullscreen */}
                {!isFullscreen && (
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none">
                        <div className="flex items-center gap-4 py-2.5 px-6 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: route.grade === 'Bleu' ? '#32A9D6' : route.grade === 'Vert' ? '#A4C639' : route.grade === 'Rouge' ? '#FF0000' : '#ffffff' }} />
                                <span className="text-sm font-black uppercase tracking-tighter italic">{route.grade}</span>
                            </div>
                            <div className="w-px h-4 bg-white/10" />
                            <span className="text-sm font-bold text-white/90">{allHoldIds.length} <span className="text-[10px] text-white/50 uppercase tracking-widest ml-0.5">Prises</span></span>
                        </div>
                    </div>
                )}

                {/* Fullscreen Toggle */}
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="absolute bottom-6 right-6 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all z-20"
                >
                    {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>
            </div>

            {/* Premium Bottom Sheet */}
            {!isFullscreen && (
                <div className="bg-zinc-900/95 backdrop-blur-3xl border-t border-white/10 px-6 pt-2 pb-10 rounded-t-[40px] -mt-10 relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
                    {/* Content of bottom sheet */}
                    <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

                    <div className="flex justify-between items-center mb-10">
                        <div className="flex-1 min-w-0 pr-4">
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-white truncate drop-shadow-2xl">
                                {route.name || "SANS NOM"}
                            </h1>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                <span className="w-1 h-1 bg-accent-pink rounded-full" /> Créé par {route.author_username || route.author?.username || route.author?.[0]?.username || 'Inconnu'}
                            </p>
                        </div>

                        <button
                            onClick={handleSend}
                            className={`h-16 px-8 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-3 shadow-2xl border ${isSent
                                ? 'bg-green-500 text-white border-green-400/20'
                                : 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                }`}
                        >
                            {isSent ? (
                                <>
                                    <CheckCircle size={22} strokeWidth={3} />
                                    <span className="text-sm">FAIT</span>
                                </>
                            ) : (
                                <span className="text-sm">CROIX</span>
                            )}
                        </button>
                    </div>

                    {/* Voting & Stats Container */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                    RESSENTI DU GRADE
                                </h3>
                                {route.grade_adjusted_by_votes && (
                                    <div className="text-[9px] bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full font-black uppercase tracking-wider border border-yellow-500/20">
                                        Ajusté
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleVote('easier')}
                                    className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border ${userVote && GRADE_ORDER.indexOf(userVote) < GRADE_ORDER.indexOf(route.grade)
                                        ? 'bg-green-500 text-white border-green-400/50 shadow-[0_8px_20px_rgba(34,197,94,0.3)]'
                                        : 'bg-zinc-800/50 text-green-400 border-white/5 hover:bg-zinc-800'
                                        }`}
                                >
                                    SOFT
                                </button>
                                <button
                                    onClick={() => handleVote('harder')}
                                    className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border ${userVote && GRADE_ORDER.indexOf(userVote) > GRADE_ORDER.indexOf(route.grade)
                                        ? 'bg-red-500 text-white border-red-400/50 shadow-[0_8px_20px_rgba(239,68,68,0.3)]'
                                        : 'bg-zinc-800/50 text-red-500 border-white/5 hover:bg-zinc-800'
                                        }`}
                                >
                                    HARD
                                </button>
                            </div>

                            {voteStats && voteStats.total > 0 ? (
                                <div className="text-[10px] text-zinc-600 font-bold text-center uppercase tracking-widest bg-black/20 py-2 rounded-xl">
                                    {voteStats.total} VOTE{voteStats.total > 1 ? 'S' : ''} • MAJORITÉ {voteStats.majority} ({voteStats.percentage}%)
                                </div>
                            ) : (
                                <div className="text-[10px] text-zinc-700 font-bold text-center uppercase tracking-widest">
                                    Aucun vote pour le moment
                                </div>
                            )}
                        </div>

                        <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 flex items-center justify-between group active:bg-white/[0.06] transition-all">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue border border-accent-blue/20 shadow-inner">
                                    <Star size={24} fill="currentColor" strokeWidth={0} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">NOTE MOYENNE</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-white font-black text-3xl leading-none italic uppercase tracking-tighter">4.8</span>
                                        <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">/ 5</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-white/10 group-hover:text-white transition-all">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
