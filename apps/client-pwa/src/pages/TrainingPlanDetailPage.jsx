import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Share2, MoreVertical, Heart, Bookmark, ChevronRight } from 'lucide-react';

export default function TrainingPlanDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                // 1. Fetch Plan Details
                const { data: planData, error: planError } = await supabase
                    .from('training_folders')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (planError) throw planError;
                setPlan(planData);

                // 2. Fetch Items (Routes)
                fetchItems();

            } catch (err) {
                console.error("Error loading plan:", err);
                setLoading(false);
            }
        };

        const fetchItems = async () => {
            const { data: folderItems, error: itemsError } = await supabase
                .from('training_folder_items')
                .select('*, route:routes(*)')
                .eq('folder_id', id)
                .order('added_at', { ascending: true }); // Use added_at instead of order_index if it doesn't exist

            if (!itemsError) {
                setItems(folderItems || []);
            }
            setLoading(false);
        };

        fetchPlan();

        // Real-time subscription for items
        const channel = supabase
            .channel(`folder_items_${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'training_folder_items',
                filter: `folder_id=eq.${id}`
            }, () => {
                fetchItems();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-zinc-500">Chargement...</div>;
    if (!plan) return <div className="min-h-screen bg-background flex items-center justify-center text-red-500">Dossier introuvable.</div>;

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Header */}
            <div className="relative h-64 bg-surface overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />

                {/* Abstract Background Decoration */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-pink/20 blur-[100px] rounded-full" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-blue/20 blur-[100px] rounded-full" />

                <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="btn-touch w-10 h-10 bg-surface/50 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/10 hover:bg-surface/80 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <button className="btn-touch w-10 h-10 bg-surface/50 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/10 hover:bg-surface/80 transition-all">
                        <MoreVertical size={20} />
                    </button>
                </div>

                <div className="absolute bottom-6 left-6 right-6 z-20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-accent-pink/10 text-accent-pink text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-accent-pink/20">
                            Entraînement Assigné
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter mb-2 drop-shadow-lg">{plan.title}</h1>
                    <p className="text-zinc-400 text-sm font-medium line-clamp-2">{plan.description}</p>
                </div>
            </div>

            {/* List */}
            <div className="p-6 space-y-4">
                {items.length === 0 ? (
                    <div className="text-center text-zinc-500 py-12 bg-surface/30 rounded-3xl border border-white/5 border-dashed">
                        <Bookmark size={40} className="mx-auto mb-4 opacity-50" />
                        <p>Ce dossier est vide.</p>
                    </div>
                ) : (
                    items.map((item, index) => {
                        const route = item.route;
                        if (!route) return null; // Skip if route deleted

                        return (
                            <Link
                                key={item.id}
                                to={`/route/${route.id}`}
                                className="group block bg-surface/50 rounded-3xl p-4 border border-white/5 hover:bg-surface/80 active:scale-[0.99] transition-all cursor-pointer shadow-lg hover:shadow-xl hover:border-white/10 relative overflow-hidden"
                            >
                                <div className="absolute -left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-pink to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs font-black text-zinc-500 shadow-inner">
                                            {index + 1}
                                        </div>
                                        <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center font-black text-accent-pink border border-white/5 shadow-inner">
                                            {route.grade}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-accent-pink transition-colors">{route.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                                <span>{route.holds?.length || 0} prises</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" size={20} />
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
