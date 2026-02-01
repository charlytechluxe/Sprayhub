import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Search, FolderPlus, User, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { cn } from './lib/utils';

export function TrainingView() {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Fetch Users (Profiles)
    useEffect(() => {
        async function fetchUsers() {
            // Fetch profiles first
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true });

            if (!error && profiles) {
                setUsers(profiles);
            } else {
                console.error("Error fetching profiles:", error);
            }
            setLoading(false);
        }
        fetchUsers();
    }, []);

    // Fetch Plans when user selected
    useEffect(() => {
        if (!selectedUser) return;
        async function fetchPlans() {
            const { data } = await supabase
                .from('training_folders')
                .select('*')
                .eq('assigned_user_id', selectedUser.id)
                .order('created_at', { ascending: false });
            setPlans(data || []);
        }
        fetchPlans();
    }, [selectedUser]);

    const handleCreatePlan = async () => {
        const title = prompt("Nom du dossier (ex: Force Bloqueur):");
        if (!title) return;

        const { data: { user } } = await supabase.auth.getUser(); // Admin/Coach ID

        const { data, error } = await supabase
            .from('training_folders')
            .insert({
                title,
                assigned_user_id: selectedUser.id,
                coach_id: user?.id
            })
            .select()
            .single();

        if (data) setPlans([data, ...plans]);
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Supprimer ce dossier ?")) return;
        await supabase.from('training_folders').delete().eq('id', id);
        setPlans(plans.filter(p => p.id !== id));
    };

    return (
        <div className="flex h-full gap-6">
            {/* Left: User List */}
            <div className="w-1/3 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher un grimpeur..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-rose-500 transition-colors"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex-1 bg-zinc-900/30 rounded-3xl border border-zinc-800 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                        <h3 className="font-bold text-sm">Grimpeurs ({users.length})</h3>
                    </div>
                    <div className="overflow-y-auto h-full p-2 space-y-1">
                        {users.filter(u => (u.full_name || u.email || '').toLowerCase().includes(search.toLowerCase())).map(user => (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                                    selectedUser?.id === user.id ? "bg-rose-500 text-white shadow-lg" : "hover:bg-zinc-800 text-zinc-400"
                                )}
                            >
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs", selectedUser?.id === user.id ? "bg-white/20" : "bg-zinc-800")}>
                                    {user.full_name?.[0] || user.email?.[0] || <User size={14} />}
                                </div>
                                <div className="flex-1 truncate">
                                    <p className="text-sm font-bold truncate">{user.full_name || "Sans nom"}</p>
                                    <p className={cn("text-[10px] truncate", selectedUser?.id === user.id ? "text-white/70" : "text-zinc-600")}>{user.email}</p>
                                </div>
                                <ChevronRight size={16} className={cn("opacity-0 transition-opacity", selectedUser?.id === user.id && "opacity-100")} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Plans & Details */}
            <div className="flex-1 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-6 flex flex-col">
                {selectedUser ? (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-black italic">{selectedUser.full_name || selectedUser.email}</h2>
                                <p className="text-zinc-500 text-sm">Gestion des entraînements</p>
                            </div>
                            <button
                                onClick={handleCreatePlan}
                                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all"
                            >
                                <FolderPlus size={18} />
                                Nouveau Dossier
                            </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
                            {plans.map(plan => (
                                <PlanCard key={plan.id} plan={plan} onDelete={() => handleDeletePlan(plan.id)} />
                            ))}
                            {plans.length === 0 && (
                                <div className="col-span-full py-12 text-center text-zinc-600 italic border-2 border-dashed border-zinc-800 rounded-3xl">
                                    Aucun dossier pour ce grimpeur.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                        <User size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">Sélectionnez un grimpeur</p>
                        <p className="text-sm">pour gérer ses dossiers d'entraînement.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function PlanCard({ plan, onDelete }: { plan: any, onDelete: () => void }) {
    const [items, setItems] = useState<any[]>([]);
    const [isManaging, setIsManaging] = useState(false);
    const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Fetch items in this plan
    useEffect(() => {
        if (!plan.id) return;
        fetchItems();
    }, [plan.id]);

    async function fetchItems() {
        const { data } = await supabase
            .from('training_folder_items')
            .select('*, route:routes(*)')
            .eq('folder_id', plan.id)
            .order('added_at', { ascending: true });
        setItems(data || []);
    }

    async function openManager() {
        setIsManaging(true);
        setLoadingRoutes(true);
        // Fetch all routes to pick from
        const { data } = await supabase
            .from('routes')
            .select('*')
            .order('created_at', { ascending: false });
        setAvailableRoutes(data || []);
        setLoadingRoutes(false);
    }

    const handleAddRoute = async (routeId: string) => {
        // Check if already in plan
        if (items.find(i => i.route_id === routeId)) return;

        await supabase.from('training_folder_items').insert({
            folder_id: plan.id,
            route_id: routeId
        });
        fetchItems();
    };

    const handleRemoveRoute = async (itemId: string) => {
        await supabase.from('training_folder_items').delete().eq('id', itemId);
        setItems(items.filter(i => i.id !== itemId));
    };

    return (
        <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group relative flex flex-col h-48">
                <button
                    onClick={onDelete}
                    className="absolute top-2 right-2 p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                    <Trash2 size={14} />
                </button>
                <div className="mb-3 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/5 flex items-center justify-center text-rose-500">
                            <FolderPlus size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white truncate w-32" title={plan.title}>{plan.title}</h3>
                            <p className="text-xs text-zinc-500">{new Date(plan.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {items.slice(0, 3).map(item => (
                            <div key={item.id} className="w-6 h-6 rounded bg-zinc-800 text-[8px] flex items-center justify-center text-zinc-400 border border-zinc-700">
                                {item.route?.grade || "?"}
                            </div>
                        ))}
                        {items.length > 3 && (
                            <div className="w-6 h-6 rounded bg-zinc-800 text-[8px] flex items-center justify-center text-zinc-500 border border-zinc-700">
                                +{items.length - 3}
                            </div>
                        )}
                        {items.length === 0 && <span className="text-[10px] text-zinc-600 italic">Vide</span>}
                    </div>
                </div>

                <button
                    onClick={openManager}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 rounded-lg transition-colors flex items-center justify-center gap-2 mt-auto"
                >
                    <Plus size={14} /> Gérer les blocs ({items.length})
                </button>
            </div>

            {/* Modal Manager */}
            {isManaging && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                            <div>
                                <h3 className="text-xl font-black italic">Gérer le dossier "{plan.title}"</h3>
                                <p className="text-sm text-zinc-500">Ajoutez ou retirez des blocs pour ce grimpeur.</p>
                            </div>
                            <button onClick={() => setIsManaging(false)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Available Routes */}
                            <div className="flex-1 p-6 overflow-y-auto border-r border-zinc-800">
                                <h4 className="font-bold mb-4 sticky top-0 bg-zinc-900 py-2 z-10 flex items-center gap-2">
                                    <Search size={14} /> Bibliothèque de Blocs
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {availableRoutes.map(route => {
                                        const isAdded = items.find(i => i.route_id === route.id);
                                        return (
                                            <button
                                                key={route.id}
                                                onClick={() => !isAdded && handleAddRoute(route.id)}
                                                disabled={isAdded}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                                    isAdded
                                                        ? "bg-rose-500/10 border-rose-500/30 opacity-50 cursor-not-allowed"
                                                        : "bg-zinc-950 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900"
                                                )}
                                            >
                                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm", isAdded ? "bg-rose-500 text-white" : "bg-zinc-800 text-white")}>
                                                    {route.grade}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate text-white">{route.name}</p>
                                                    <p className="text-[10px] text-zinc-500">{new Date(route.created_at).toLocaleDateString()}</p>
                                                </div>
                                                {isAdded && <div className="text-rose-500 text-[10px] font-bold uppercase">Ajouté</div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Current Items */}
                            <div className="w-1/3 bg-zinc-950 p-6 overflow-y-auto flex flex-col">
                                <h4 className="font-bold mb-4 sticky top-0 bg-zinc-950 py-2 z-10 text-rose-500">
                                    Contenu du Dossier ({items.length})
                                </h4>
                                <div className="space-y-2 flex-1">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900 border border-zinc-800 group hover:border-red-500/30 transition-colors">
                                            <span className="text-xs font-mono text-zinc-600 w-4">{idx + 1}</span>
                                            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                                                {item.route?.grade}
                                            </div>
                                            <p className="flex-1 text-sm truncate text-zinc-300">{item.route?.name}</p>
                                            <button
                                                onClick={() => handleRemoveRoute(item.id)}
                                                className="text-zinc-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {items.length === 0 && (
                                        <p className="text-center text-zinc-600 text-sm italic mt-10">Glissez des blocs ici ou cliquez sur ceux de gauche.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
