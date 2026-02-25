import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, ChevronRight, Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import FilterModal from '../components/FilterModal';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const GRADE_HEX = {
    'Orange': '#FF8C00',
    'Rose': '#FF00FF',
    'Vert': '#A4C639',
    'Jaune': '#FFD700',
    'Bleu': '#32A9D6',
    'Rouge': '#FF0000',
    'Blanc': '#ffffff',
    'Projet': '#a1a1aa',
};

export default function RoutesPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [routes, setRoutes] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        grades: [],
        styles: [],
        author: ''
    });
    const fetchRoutes = async () => {
        try {
            // Try fetching from the stats view first
            let { data, error } = await supabase
                .from('routes_with_stats')
                .select('*')
                .order('created_at', { ascending: false });

            // ENHANCEMENT: Always try to refresh author names from profiles table if possible
            // This fixes issues where the view might have stale or missing 'author_username'
            if (!error && data) {
                // Get all unique author IDs from the fetched routes
                const authorIds = [...new Set(data.map(r => r.author_id).filter(Boolean))];

                if (authorIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, username, full_name') // Added full_name
                        .in('id', authorIds);

                    if (profiles) {
                        const profileMap = {};
                        profiles.forEach(p => {
                            // Prioritize username, then full_name
                            profileMap[p.id] = p.username || p.full_name;
                        });

                        // Overwrite author_username with fresh data from profiles
                        data = data.map(r => ({
                            ...r,
                            author_username: profileMap[r.author_id] || r.author_username || 'Inconnu'
                        }));
                    }
                }
            }

            // Fallback if view doesn't exist yet
            if (error) {
                console.warn("View 'routes_with_stats' not found, falling back to basic table.");
                const { data: basicData, error: basicError } = await supabase
                    .from('routes')
                    .select('*, author:profiles!author_id(username)')
                    .order('created_at', { ascending: false });
                if (basicError) throw basicError;

                // Normalize data to prioritize profile username over stored username
                data = basicData.map(r => {
                    // Start with stored username
                    let finalUsername = r.author_username;

                    // If available, prefer the live profile username (handles updates)
                    if (r.author?.username) {
                        finalUsername = r.author.username;
                    }

                    // Fallbacks
                    if (!finalUsername || finalUsername === 'Inconnu') {
                        finalUsername = r.author?.[0]?.username || 'Inconnu';
                    }

                    return {
                        ...r,
                        author_username: finalUsername
                    };
                });
            }

            // Fetch User Interactions (Likes & Ascents)
            const { data: { user } } = await supabase.auth.getUser();
            let userAppreciations = [];
            let userAscents = [];
            let userPlans = [];

            if (user) {
                const { data: likes } = await supabase.from('likes').select('route_id').eq('user_id', user.id);
                userAppreciations = likes?.map(l => l.route_id) || [];

                const { data: ascents } = await supabase.from('ascents').select('route_id').eq('user_id', user.id);
                userAscents = ascents?.map(a => a.route_id) || [];

                // Fetch Assigned Plans
                const { data: plans } = await supabase
                    .from('training_folders')
                    .select('*')
                    .eq('assigned_user_id', user.id)
                    .order('created_at', { ascending: false });
                userPlans = plans || [];
            }

            setPlans(userPlans);

            // Merge data
            const enrichedRoutes = data?.map(r => ({
                ...r,
                isLiked: userAppreciations.includes(r.id),
                isSent: userAscents.includes(r.id)
            })) || [];

            setRoutes(enrichedRoutes);
        } catch (err) {
            console.error("Error loading routes:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFolders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: plansData } = await supabase
            .from('training_folders')
            .select('*')
            .eq('assigned_user_id', user.id);
        setPlans(plansData || []);
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            await Promise.all([fetchRoutes(), fetchFolders()]);
            setLoading(false);
        };

        fetchAll();

        const channel = supabase
            .channel('realtime_routes_list')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'routes'
            }, () => {
                fetchRoutes();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredRoutes = routes.filter(r => {
        // Filter by name (search)
        if (search && !(r.name || '').toLowerCase().includes(search.toLowerCase())) {
            return false;
        }

        // Filter by grade
        if (filters.grades.length > 0 && !filters.grades.includes(r.grade)) {
            return false;
        }

        // Filter by style
        if (filters.styles.length > 0) {
            const hasStyle = filters.styles.some(style =>
                r.style?.includes(style)
            );
            if (!hasStyle) return false;
        }

        // Filter by author (username)
        if (filters.author && r.author_username !== filters.author) {
            return false;
        }

        return true;
    });

    const activeFilterCount = filters.grades.length + filters.styles.length + (filters.author ? 1 : 0);

    return (
        <div className="p-6 pb-24 min-h-screen bg-black">
            <div className="flex items-center justify-between mb-10 pt-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                    EXPLORER <span className="text-accent-pink">.</span>
                </h1>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="btn-touch w-12 h-12 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-xl relative active:scale-95"
                >
                    <Filter size={20} />
                    {activeFilterCount > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-accent-pink rounded-full flex items-center justify-center text-[11px] font-black text-white border-2 border-black shadow-lg">
                            {activeFilterCount}
                        </div>
                    )}
                </button>
            </div>

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onApplyFilters={setFilters}
            />

            {/* Assigned Plans Section */}
            {plans.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-1">MES ENTRAÎNEMENTS</h2>
                    <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar -mx-6 px-6 snap-x">
                        {plans.map(plan => (
                            <Link
                                key={plan.id}
                                to={`/plan/${plan.id}`}
                                className="flex-shrink-0 w-72 bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[32px] relative overflow-hidden group hover:bg-zinc-800 transition-all shadow-2xl snap-center active:scale-95"
                            >
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent-pink/5 blur-3xl rounded-full" />
                                <div className="relative z-10">
                                    <h3 className="font-black text-2xl italic uppercase tracking-tighter text-white mb-2 group-hover:text-accent-pink transition-colors truncate">{plan.title}</h3>
                                    <p className="text-zinc-500 text-xs font-semibold line-clamp-2 h-8 leading-relaxed mb-4">{plan.description || "Entraînement personnalisé."}</p>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[9px] font-black text-accent-pink bg-accent-pink/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-accent-pink/20">COACH ALEXIS</span>
                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-accent-pink group-hover:text-white transition-all">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-10 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent-pink transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher par nom..."
                    className="w-full h-14 bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-6 outline-none focus:border-accent-pink/30 focus:bg-zinc-900 transition-all text-white font-bold placeholder:text-zinc-700 placeholder:font-normal shadow-inner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="space-y-4 pb-32">
                <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-1">Derniers Blocs</h2>
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-zinc-900/50 rounded-[28px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredRoutes.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="text-4xl mb-4">🧗</div>
                        <p className="text-zinc-500 italic font-medium">Aucun bloc dans cette voie...</p>
                    </div>
                ) : (
                    filteredRoutes.map(route => (
                        <Link
                            key={route.id}
                            to={`/route/${route.id}`}
                            className="group relative bg-zinc-900/30 backdrop-blur-sm rounded-[32px] p-5 border border-white/5 hover:bg-zinc-800/50 hover:border-white/10 active:scale-[0.98] transition-all cursor-pointer shadow-xl"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-5">
                                    <div
                                        className="w-16 h-16 rounded-[22px] flex flex-col items-center justify-center shadow-2xl relative border-2 border-black/20 overflow-hidden"
                                        style={{ backgroundColor: route.grade ? GRADE_HEX[route.grade] : '#333' }}
                                    >
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-tighter italic",
                                            route.grade && ['Blanc', 'Jaune', 'Orange', 'Rose'].includes(route.grade) ? 'text-black' : 'text-white'
                                        )}>
                                            {route.grade ? route.grade.substring(0, 2) : '??'}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

                                        {route.isSent && (
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-black flex items-center justify-center text-white text-[10px] font-black">✓</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-xl italic uppercase tracking-tighter text-white group-hover:text-accent-pink transition-colors truncate">
                                            {route.name || "SANS NOM"}
                                        </h3>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                                <span className="text-zinc-400">{route.holds?.length || 0} prises</span>
                                                <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                                                <span>{new Date(route.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1 h-1 bg-accent-pink rounded-full opacity-50" />
                                                Par {route.author_username || 'Inconnu'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider transition-all shadow-lg",
                                        route.isLiked ? 'bg-accent-pink text-white' : 'bg-white/5 text-zinc-500'
                                    )}>
                                        <Heart size={12} className={route.isLiked ? "fill-current" : ""} />
                                        <span>{route.likes_count || 0}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-zinc-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
