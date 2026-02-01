import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Calendar, Filter, ChevronRight, TrendingUp, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrainingLogPage() {
    const [ascents, setAscents] = useState([]);
    const [folders, setFolders] = useState([]);
    const [stats, setStats] = useState({ maxGrade: '?', total: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let folderChannel;
        let ascentChannel;

        const loadAll = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            await Promise.all([fetchAscents(), fetchFolders()]);
            setLoading(false);

            // Subscribe to Folders
            folderChannel = supabase
                .channel('realtime_folders')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'training_folders',
                    filter: `assigned_user_id=eq.${user.id}`
                }, () => {
                    fetchFolders();
                })
                .subscribe();

            // Subscribe to Ascents
            ascentChannel = supabase
                .channel('realtime_ascents')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'ascents',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    fetchAscents();
                })
                .subscribe();
        };

        loadAll();

        return () => {
            if (folderChannel) supabase.removeChannel(folderChannel);
            if (ascentChannel) supabase.removeChannel(ascentChannel);
        };
    }, []);

    const fetchFolders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('training_folders')
            .select(`
                *,
                items:training_folder_items(count)
            `)
            .eq('assigned_user_id', user.id)
            .order('created_at', { ascending: false });

        setFolders(data || []);
    };

    const fetchAscents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch ascents with route details
            const { data, error } = await supabase
                .from('ascents')
                .select(`
                    *,
                    route:routes(id, name, grade, author)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setAscents(data || []);

            // Calculate stats
            if (data && data.length > 0) {
                // Simplistic max grade: just find the highest in the list
                // Grades are strings like "6a", "7b+", etc. 
                // A true sort would be better but let's take the first one after sorting if we knew the order
                // For now, let's just count total and find a "max" if we can compare them easily
                const grades = data.map(a => a.route?.grade).filter(Boolean);

                // Sort grades helper (simplistic)
                const sortedGrades = [...new Set(grades)].sort((a, b) => {
                    const gradeToNum = (g) => {
                        const base = parseInt(g) || 0;
                        const letter = g.match(/[a-c]/)?.[0] || 'a';
                        const plus = g.includes('+') ? 0.5 : 0;
                        return base * 10 + (letter.charCodeAt(0) - 97) + plus;
                    };
                    return gradeToNum(b) - gradeToNum(a);
                });

                setStats({
                    maxGrade: sortedGrades[0] || '?',
                    total: data.length
                });
            }
        } catch (err) {
            console.error("Error fetching ascents:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Chargement...</div>;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 pb-32">
            <header className="mb-8 pt-4">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Entraînement</h1>
                <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs">Ton évolution & tes croix</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <TrendingUp size={40} className="text-accent-pink" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Niveau Max</p>
                    <p className="text-4xl font-black italic text-white drop-shadow-[0_0_10px_rgba(251,32,86,0.5)]">
                        {stats.maxGrade}
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Trophy size={40} className="text-accent-blue" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Total Croix</p>
                    <p className="text-4xl font-black italic text-white">
                        {stats.total}
                    </p>
                </div>
            </div>

            {/* Training Folders Section */}
            {folders.length > 0 && (
                <section className="mb-8">
                    <div className="flex justify-between items-center px-2 mb-4">
                        <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">Tes Programmes</h3>
                        <span className="text-[10px] font-black bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full uppercase">Coach Assigned</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                onClick={() => navigate(`/plan/${folder.id}`)}
                                className="flex-shrink-0 w-48 bg-white/5 border border-white/10 rounded-[2rem] p-5 backdrop-blur-xl relative overflow-hidden group active:scale-95 transition-all"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <FolderKanban size={32} />
                                </div>
                                <h4 className="font-black text-white text-lg leading-tight mb-2 truncate" title={folder.title}>
                                    {folder.title}
                                </h4>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                                    <span className="text-zinc-300">{folder.items?.[0]?.count || 0}</span> Blocs assignés
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Ascent List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">Dernières réussites</h3>
                    <Filter size={16} className="text-zinc-600" />
                </div>

                {ascents.length === 0 ? (
                    <div className="bg-zinc-900/50 rounded-3xl p-12 text-center border border-white/5 border-dashed">
                        <p className="text-zinc-500 text-sm mb-4">Aucune croix pour le moment.</p>
                        <button
                            onClick={() => navigate('/routes')}
                            className="bg-accent-pink text-white px-6 py-3 rounded-full font-black uppercase text-xs tracking-widest"
                        >
                            Chasse ton premier bloc
                        </button>
                    </div>
                ) : (
                    ascents.map((ascent) => (
                        <div
                            key={ascent.id}
                            onClick={() => navigate(`/route/${ascent.route_id}`)}
                            className="bg-white/5 border border-white/5 rounded-3xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-white/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center font-black italic text-accent-pink border border-white/10 shadow-lg group-hover:shadow-accent-pink/20 transition-all">
                                    {ascent.route?.grade}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white uppercase tracking-tight">{ascent.route?.name || "Sans nom"}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                                        <Calendar size={10} />
                                        {new Date(ascent.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                        <span>Par {ascent.route?.author || "Inconnu"}</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-zinc-700 group-hover:text-white transition-colors" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
