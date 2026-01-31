import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Image as ImageIcon,
    Settings,
    ShieldCheck,
    Users,
    TrendingUp,
    FolderKanban,
    Award,
    RefreshCw,
    Check,
    X,
    Edit
} from 'lucide-react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';

export default function App() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800 flex flex-col pt-12">
                <div className="px-6 mb-8">
                    <h1 className="text-xl font-black tracking-tighter italic">
                        SPRAY<span className="text-rose-500">HUB</span> <span className="text-[10px] bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded ml-2 not-italic">ADMIN</span>
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Tableau de bord"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                    />
                    <NavItem
                        icon={<ShieldCheck size={20} />}
                        label="Modération / Blocs"
                        active={activeTab === 'moderation'}
                        onClick={() => setActiveTab('moderation')}
                    />
                    <NavItem
                        icon={<ImageIcon size={20} />}
                        label="Gestion du Mur"
                        active={activeTab === 'wall'}
                        onClick={() => setActiveTab('wall')}
                    />
                    <div className="pt-4 mt-4 border-t border-zinc-800">
                        <NavItem
                            icon={<Settings size={20} />}
                            label="Configuration"
                            active={activeTab === 'config'}
                            onClick={() => setActiveTab('config')}
                        />
                    </div>
                </nav>

                <div className="p-4 border-t border-zinc-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs">CP</div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold truncate">Coach Charly</p>
                        <p className="text-[10px] text-zinc-500 truncate">Administrateur</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md">
                    <h2 className="font-bold text-lg capitalize">{activeTab.replace('-', ' ')}</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            SUPABASE CONNECTED
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'dashboard' && <DashboardView />}
                    {activeTab === 'moderation' && <ModerationView />}
                    {activeTab === 'wall' && <WallView />}
                    {activeTab === 'config' && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                            <p className="text-sm italic">Coming soon</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
    badge?: string;
}

function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                    ? "bg-zinc-800 text-white shadow-lg"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
            )}
        >
            <span className={cn("transition-colors", active ? "text-rose-500" : "group-hover:text-rose-400")}>
                {icon}
            </span>
            <span className="flex-1 text-left">{label}</span>
            {badge && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );
}

function DashboardView() {
    const [stats, setStats] = useState({ routes: 0, users: 0 });
    const [recentRoutes, setRecentRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            // Count routes
            const { count: routesCount } = await supabase.from('routes').select('*', { count: 'exact', head: true });

            // Recent routes
            const { data: routes } = await supabase
                .from('routes')
                .select('id, name, grade, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                routes: routesCount || 0,
                users: 0 // Placeholder as we don't have users table yet
            });
            setRecentRoutes(routes || []);
            setLoading(false);
        }

        fetchStats();
    }, []);

    if (loading) return <div className="text-zinc-500">Chargement des données...</div>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-4 gap-6">
                <StatsCard title="Total Grimpeurs" value={stats.users.toString()} change="-" icon={<Users className="text-blue-500" />} />
                <StatsCard title="Blocs Créés" value={stats.routes.toString()} change="LIVE" icon={<LayoutDashboard className="text-rose-500" />} />
                <StatsCard title="Passages (24h)" value="0" change="-" icon={<TrendingUp className="text-green-500" />} />
                <StatsCard title="Volume Moyen" value="-" change="-" icon={<LayoutDashboard className="text-yellow-500" />} />
            </div>

            <div className="bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800">
                <h3 className="text-lg font-bold mb-6">Activité récente (Derniers ajouts)</h3>
                <div className="space-y-4">
                    {recentRoutes.length === 0 ? (
                        <p className="text-zinc-500 text-sm italic">Aucun bloc créé pour le moment.</p>
                    ) : (
                        recentRoutes.map(route => (
                            <div key={route.id} className="flex items-center gap-4 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50 transition-colors px-2 rounded-lg">
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                    {route.grade || "?"}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">{route.name}</p>
                                    <p className="text-xs text-zinc-500">
                                        Ajouté le {new Date(route.created_at).toLocaleDateString()} à {new Date(route.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className="text-xs text-zinc-600 font-mono">
                                    ID: {route.id}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, change, icon }) {
    return (
        <div className="bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-zinc-950 rounded-xl">{icon}</div>
                <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase">
                    {change}
                </span>
            </div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-black mt-1 tracking-tighter">{value}</p>
        </div>
    );
}

function ModerationView() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchRoutes() {
        setLoading(true);
        const { data } = await supabase
            .from('routes')
            .select('*')
            .order('created_at', { ascending: false });
        setRoutes(data || []);
        setLoading(false);
    }

    useEffect(() => {
        fetchRoutes();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Voulez-vous vraiment supprimer ce bloc ?")) return;
        await supabase.from('routes').delete().eq('id', id);
        fetchRoutes(); // Refresh
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Tous les Blocs ({routes.length})</h3>
                <button onClick={() => fetchRoutes()} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg transition-colors">
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <p className="text-zinc-500">Chargement...</p>
                ) : routes.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/30 rounded-3xl border border-zinc-800 border-dashed">
                        <p className="text-zinc-500">Aucun bloc dans la base de données.</p>
                    </div>
                ) : (
                    routes.map(route => (
                        <div key={route.id} className="bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800 flex items-center gap-6">
                            {/* Placeholder for Thumbnails since we store vectors, not images per route yet */}
                            <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 font-bold text-xl">
                                {route.grade}
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-lg text-white">{route.name}</h4>
                                <p className="text-sm text-zinc-500">Créé le {new Date(route.created_at).toLocaleDateString()}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                        {Array.isArray(route.holds) ? route.holds.length : 0} Prises
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button onClick={() => handleDelete(route.id)} className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                                    <X size={14} /> Supprimer
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ... imports
import { segmentWallImage } from './lib/replicate';

// ... existing code ...

function WallView() {
    const [wall, setWall] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);

    useEffect(() => {
        async function fetchWall() {
            const { data } = await supabase.from('walls').select('*').limit(1).single();
            if (data) {
                setWall(data);
            } else {
                setWall({
                    name: 'Mur Principal (PWA Default)',
                    image_url: 'http://localhost:5173/wall_v1.jpg',
                    id: 'local-default'
                });
            }
        }
        fetchWall();
    }, []);

    const handleScan = async () => {
        if (!wall?.image_url) return;

        setIsScanning(true);
        setScanResult(null);
        try {
            // 1. Trigger Cloud AI & Local Vectorization
            const polygons = await segmentWallImage(wall.image_url);

            if (!polygons || polygons.length === 0) {
                throw new Error("Aucune prise détectée par l'IA.");
            }

            // 2. Save to Supabase
            // First, clear existing holds for this wall (optional, depends on workflow)
            // For now we append or replace? Let's assume we replace for a fresh scan.
            const { error: deleteError } = await supabase.from('holds').delete().eq('wall_id', wall.id);

            if (deleteError) {
                console.warn("Could not clear old holds", deleteError);
            }

            // Transform for DB (snake_case)
            const dbHolds = polygons.map((p: any) => ({
                wall_id: wall.id,
                contour: p.contour, // JSONB
                area_px: p.area_px,
                x: p.bbox[0], // approximate center or box
                y: p.bbox[1]
            }));

            // Insert in chunks to avoid payload limits
            const chunkSize = 100;
            for (let i = 0; i < dbHolds.length; i += chunkSize) {
                const chunk = dbHolds.slice(i, i + chunkSize);
                const { error } = await supabase.from('holds').insert(chunk);
                if (error) throw error;
            }

            setScanResult(`✅ Succès ! ${polygons.length} prises détectées et sauvegardées.`);

        } catch (error) {
            console.error(error);
            setScanResult("❌ Erreur lors du scan Replicate (Vérifiez la console)");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Configuration du Mur</h3>
                    <p className="text-sm text-zinc-500 italic">Image de référence pour l'application.</p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={isScanning || !wall?.image_url}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        isScanning
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                    )}
                >
                    {isScanning ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Scan en cours...
                        </>
                    ) : (
                        <>
                            <Award size={16} /> {/* Using Award as a 'Magic' icon placeholder */}
                            Scanner avec l'IA (Cloud)
                        </>
                    )}
                </button>
            </div>

            {scanResult && (
                <div className={cn(
                    "p-4 rounded-xl text-sm font-bold border",
                    scanResult.includes('✅')
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                    {scanResult}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 rounded-3xl p-6 border-2 border-rose-500/50 flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase">Actif</div>
                    <div className="aspect-[3/4] rounded-2xl bg-black overflow-hidden flex items-center justify-center relative">
                        {wall ? (
                            <img src={wall.image_url} className="w-full h-full object-contain" alt="Mur" />
                        ) : (
                            <div className="text-zinc-600 flex flex-col items-center">
                                <ImageIcon size={32} className="mb-2 opacity-50" />
                                <span className="text-xs">Aucun mur configuré</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold">{wall ? wall.name : "Mur par défaut"}</h4>
                        <p className="text-xs text-zinc-500">ID: {wall?.id || "-"}</p>
                    </div>
                </div>

                <div className="flex flex-col justify-center gap-4 text-sm text-zinc-400">
                    <p>Pour changer l'image du mur, veuillez contacter le support technique ou utiliser l'outil de migration.</p>
                    <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-xl border border-yellow-500/20">
                        <strong>Note:</strong> La modification de l'image du mur nécessite de relancer la segmentation IA pour garantir la précision des blocs.
                    </div>
                </div>
            </div>
        </div>
    );
}
