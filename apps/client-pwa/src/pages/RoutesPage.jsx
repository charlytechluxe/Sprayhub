import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, ChevronRight, Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const GRADE_HEX = {
    'Vert': '#A4C639', // Art de la Grimpe Lime Green
    'Bleu': '#32A9D6', // Art de la Grimpe Blue
    'Jaune': '#FFD700', // Art de la Grimpe Yellow
    'Rouge': '#FB2056', // Art de la Grimpe Pink/Red
    'Rose': '#FB2056',
    'Orange': '#FF8C00',
    'Blanc': '#ffffff',
    'Projet': '#a1a1aa',
};

export default function RoutesPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

                // Fetch User Interactions (Likes & Ascents) so we can highlight them
                const { data: { user } } = await supabase.auth.getUser();
                let userAppreciations = [];
                let userAscents = [];

                if (user) {
                    const { data: likes } = await supabase.from('likes').select('route_id').eq('user_id', user.id);
                    userAppreciations = likes?.map(l => l.route_id) || [];

                    const { data: ascents } = await supabase.from('ascents').select('route_id').eq('user_id', user.id);
                    userAscents = ascents?.map(a => a.route_id) || [];
                }

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

        fetchRoutes();
    }, []);

    const filteredRoutes = routes.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Explorer</h1>
                <button className="btn-touch bg-zinc-900 border border-zinc-800 p-2">
                    <Filter size={20} />
                </button>
            </div>

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
