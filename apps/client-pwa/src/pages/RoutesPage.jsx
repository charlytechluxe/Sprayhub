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
                const { data, error } = await supabase
                    .from('routes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setRoutes(data || []);
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

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                    type="text"
                    placeholder="Rechercher un bloc..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-accent-pink transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-zinc-500 animate-pulse py-8">Chargement des blocs...</div>
                ) : filteredRoutes.length === 0 ? (
                    <div className="text-center text-zinc-500 py-8">Aucun bloc trouvé.</div>
                ) : (
                    filteredRoutes.map((route) => (
                        <div
                            key={route.id}
                            onClick={() => navigate(`/route/${route.id}`)}
                            className="group block bg-zinc-900/50 rounded-3xl p-4 border border-zinc-900 active:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-3 h-12 rounded-full relative"
                                    style={{ backgroundColor: GRADE_HEX[route.grade] || '#555' }}
                                >
                                    {/* Pulse for new/project if needed */}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-white">{route.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-zinc-500">
                                            {route.holds?.length || 0} prises
                                        </p>
                                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                        <span className="text-[10px] uppercase text-zinc-600 font-bold">
                                            {new Date(route.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1 text-zinc-400">
                                        <Heart size={14} className="fill-current" />
                                        <span className="text-xs font-bold">0</span>
                                        {/* Likes not yet in DB schema or join? Keeping static 0 for now */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
