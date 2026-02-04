import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, ChevronRight, Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import FilterModal from '../components/FilterModal';

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

            // Fallback if view doesn't exist yet
            if (error) {
                console.warn("View 'routes_with_stats' not found, falling back to basic table.");
                const { data: basicData, error: basicError } = await supabase
                    .from('routes')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (basicError) throw basicError;
                data = basicData;
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
        <div className="p-6 pb-24">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Explorer</h1>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="btn-touch w-10 h-10 bg-surface/50 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface/80 transition-all shadow-lg relative"
                >
                    <Filter size={20} />
                    {activeFilterCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-pink rounded-full flex items-center justify-center text-[10px] font-bold text-white">
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
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Mes Entraînements</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                        {plans.map(plan => (
                            <Link
                                key={plan.id}
                                to={`/plan/${plan.id}`}
                                className="flex-shrink-0 w-64 bg-surface/80 border border-accent-pink/20 p-5 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-lg"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Bookmark className="text-accent-pink" size={40} />
                                </div>
                                <h3 className="font-black text-xl italic text-white mb-1 group-hover:text-accent-pink transition-colors">{plan.title}</h3>
                                <p className="text-zinc-400 text-xs font-medium line-clamp-2">{plan.description || "Aucune description"}</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[10px] bg-accent-pink/10 text-accent-pink px-2 py-1 rounded-md font-bold uppercase">Assigné par Coach</span>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <ChevronRight size={16} className="text-white" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                    type="text"
                    placeholder="Rechercher un bloc..."
                    className="w-full bg-surface/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-accent-pink/50 focus:ring-1 focus:ring-accent-pink/50 transition-all text-white placeholder:text-zinc-600 shadow-inner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="space-y-3 pb-32">
                {loading ? (
                    <div className="text-center text-zinc-500 animate-pulse py-8">Chargement des blocs...</div>
                ) : filteredRoutes.length === 0 ? (
                    <div className="text-center text-zinc-500 py-8">Aucun bloc trouvé.</div>
                ) : (
                    filteredRoutes.map(route => (
                        <Link
                            key={route.id}
                            to={`/route/${route.id}`}
                            className="group block bg-surface/50 rounded-3xl p-4 border border-white/5 hover:bg-surface/80 active:scale-[0.99] transition-all cursor-pointer shadow-lg hover:shadow-xl hover:border-white/10 mb-3"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center font-black text-accent-pink border border-white/5 shadow-inner relative">
                                        {route.grade}
                                        {route.isSent && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-surface flex items-center justify-center text-black text-[10px]">✓</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-accent-pink transition-colors">{route.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                            <span>{route.holds?.length || 0} prises</span>
                                            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                            <span>{new Date(route.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-1 ${route.isLiked ? 'text-accent-pink' : 'text-zinc-600'}`}>
                                    <Heart size={16} className={route.isLiked ? "fill-current" : ""} />
                                    <span className="text-xs font-bold">{route.likes_count || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div >
        </div >
    );
}
