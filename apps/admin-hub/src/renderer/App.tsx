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
    Edit,
    Upload,
    PenTool,
    FileImage,
    Plus,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';
import { segmentWallImage } from './lib/replicate';
import { TrainingView } from './TrainingView';
import { SurgicalEditor } from './SurgicalEditor';
import { PosterView } from './PosterView';
import { ConfigView } from './ConfigView';
import { CreateRouteView } from './CreateRouteView';

export default function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={cn(
                "bg-zinc-900/50 border-r border-zinc-800 flex flex-col pt-12 transition-all duration-300 ease-in-out relative group",
                sidebarCollapsed ? "w-20 items-center" : "w-64"
            )}>
                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="absolute -right-3 top-16 bg-zinc-800 border border-zinc-700 text-zinc-400 p-1 rounded-full shadow-lg hover:text-white transition-colors z-20 opacity-0 group-hover:opacity-100"
                    title={sidebarCollapsed ? "Déplier le menu" : "Replier le menu"}
                >
                    {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={cn("mb-8 transition-opacity duration-200", sidebarCollapsed ? "px-0 text-center" : "px-6")}>
                    {sidebarCollapsed ? (
                        <h1 className="text-xl font-black tracking-tighter italic text-rose-500">S<span className="text-white">H</span></h1>
                    ) : (
                        <h1 className="text-xl font-black tracking-tighter italic whitespace-nowrap overflow-hidden">
                            SPRAY<span className="text-rose-500">HUB</span> <span className="text-[10px] bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded ml-2 not-italic">ADMIN</span>
                        </h1>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Tableau de bord"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                        collapsed={sidebarCollapsed}
                    />
                    <NavItem
                        icon={<ShieldCheck size={20} />}
                        label="Modération / Blocs"
                        active={activeTab === 'moderation'}
                        onClick={() => setActiveTab('moderation')}
                        collapsed={sidebarCollapsed}
                    />
                    <NavItem
                        icon={<Plus size={20} />}
                        label="Créer un Bloc"
                        active={activeTab === 'create'}
                        onClick={() => setActiveTab('create')}
                        collapsed={sidebarCollapsed}
                    />
                    <NavItem
                        icon={<ImageIcon size={20} />}
                        label="Gestion du Mur"
                        active={activeTab === 'wall'}
                        onClick={() => setActiveTab('wall')}
                        collapsed={sidebarCollapsed}
                    />
                    <div className={cn(
                        "pt-4 mt-4 border-t border-zinc-800 transition-all duration-300",
                        sidebarCollapsed ? "w-12 mx-auto" : "w-full"
                    )}>
                        <NavItem
                            icon={<FolderKanban size={20} />}
                            label="Gestion Entraînement"
                            active={activeTab === 'training'}
                            onClick={() => setActiveTab('training')}
                            badge="NEW"
                            collapsed={sidebarCollapsed}
                        />
                        <NavItem
                            icon={<FileImage size={20} />}
                            label="Créer Affiche"
                            active={activeTab === 'poster'}
                            onClick={() => setActiveTab('poster')}
                            collapsed={sidebarCollapsed}
                        />
                        <NavItem
                            icon={<Settings size={20} />}
                            label="Configuration"
                            active={activeTab === 'config'}
                            onClick={() => setActiveTab('config')}
                            collapsed={sidebarCollapsed}
                        />
                    </div>
                </nav>

                <div className={cn("p-4 border-t border-zinc-800 flex items-center gap-3 transition-all", sidebarCollapsed ? "justify-center" : "")}>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">CA</div>
                    {!sidebarCollapsed && (
                        <div className="flex-1 overflow-hidden transition-opacity duration-300">
                            <p className="text-xs font-bold truncate">Coach Alexis</p>
                            <p className="text-[10px] text-zinc-500 truncate">Administrateur</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {activeTab !== 'create' && (
                    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md">
                        <h2 className="font-bold text-lg capitalize">{activeTab.replace('-', ' ')}</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                SUPABASE CONNECTED
                            </div>
                        </div>
                    </header>
                )}

                <div className={cn(
                    "flex-1 overflow-y-auto",
                    activeTab === 'create' ? "p-0 overflow-hidden" : "p-8"
                )}>
                    {activeTab === 'dashboard' && <DashboardView />}
                    {activeTab === 'moderation' && <ModerationView />}
                    {activeTab === 'create' && <CreateRouteView />}
                    {activeTab === 'wall' && <WallView />}
                    {activeTab === 'training' && <TrainingView />}
                    {activeTab === 'poster' && <PosterView />}
                    {activeTab === 'config' && <ConfigView />}
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
    collapsed?: boolean;
}

function NavItem({ icon, label, active, onClick, badge, collapsed }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                active
                    ? "bg-zinc-800 text-white shadow-lg"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/50",
                collapsed && "justify-center px-0 w-10 h-10 mx-auto"
            )}
            title={collapsed ? label : undefined}
        >
            <span className={cn("transition-colors flex-shrink-0", active ? "text-rose-500" : "group-hover:text-rose-400")}>
                {icon}
            </span>
            {!collapsed && <span className="flex-1 text-left whitespace-nowrap overflow-hidden transition-all duration-300">{label}</span>}
            {badge && (
                collapsed ? (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-zinc-900" />
                ) : (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 rounded-full">
                        {badge}
                    </span>
                )
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

            // Count users (profiles)
            const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // Recent routes
            const { data: routes } = await supabase
                .from('routes')
                .select('id, name, grade, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                routes: routesCount || 0,
                users: usersCount || 0
            });
            setRecentRoutes(routes || []);
            setLoading(false);
        }

        fetchStats();

        // Subscribe to real-time changes for routes and profiles
        const routesChannel = supabase
            .channel('admin_dashboard_routes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'routes' },
                () => fetchStats()
            )
            .subscribe();

        const profilesChannel = supabase
            .channel('admin_dashboard_profiles')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => fetchStats()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(routesChannel);
            supabase.removeChannel(profilesChannel);
        };
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

function StatsCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
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
    const [viewingRoute, setViewingRoute] = useState<any>(null);
    const [activeWall, setActiveWall] = useState<any>(null);
    const [wallHolds, setWallHolds] = useState<any[]>([]);

    async function fetchRoutes() {
        setLoading(true);
        const { data } = await supabase
            .from('routes')
            .select('*')
            .order('created_at', { ascending: false });
        setRoutes(data || []);
        setLoading(false);
    }

    async function fetchWallData() {
        // Fetch active wall
        const { data: walls } = await supabase.from('walls').select('*').eq('is_active', true).limit(1);
        if (walls && walls.length > 0) {
            const wall = walls[0];
            setActiveWall(wall);
            // Holds are now stored in the JSONB column 'detection_data' of the wall
            setWallHolds(wall.detection_data || []);
        }
    }

    useEffect(() => {
        fetchRoutes();
        fetchWallData();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('admin_routes_realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'routes' },
                (payload) => {
                    console.log('Route change detected:', payload);
                    fetchRoutes(); // Refresh the list
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Voulez-vous vraiment supprimer ce bloc ?")) return;
        await supabase.from('routes').delete().eq('id', id);
        fetchRoutes(); // Refresh
    }

    // Helper to get color for a hold in the current viewing route
    const getHoldStyle = (holdId: string) => {
        if (!viewingRoute) return null;
        // Check if route.holds is array of objects {id, type, color...}
        const matched = viewingRoute.holds?.find((h: any) => h.id === holdId || h.hold_id === holdId);

        if (!matched) return null;

        let color = '#3b82f6'; // Default Blue (Middle/Hand+Foot)

        // Map types to PWA colors
        if (matched.type === 'start') color = '#22c55e';      // Green
        else if (matched.type === 'top') color = '#ef4444';   // Red
        else if (matched.type === 'foot') color = '#eab308';  // Yellow
        // else if (matched.type === 'handfoot') color = '#3b82f6'; // Blue (Already default)

        // Override if explicit color is preserved
        if (matched.color) color = matched.color;

        return { fill: color, stroke: color, strokeWidth: 1.5 };
    };

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
                            {/* Visual Grade Badge */}
                            <div className={cn(
                                "w-16 h-16 rounded-xl flex items-center justify-center font-black text-xl border-2",
                                route.grade.includes('6') ? "bg-yellow-500/10 border-yellow-500 text-yellow-500" :
                                    route.grade.includes('7') ? "bg-orange-500/10 border-orange-500 text-orange-500" :
                                        route.grade.includes('8') ? "bg-red-500/10 border-red-500 text-red-500" :
                                            "bg-zinc-800 border-zinc-700 text-zinc-400"
                            )}>
                                {route.grade}
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-lg text-white">{route.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <span>Créé par {route.author || "Anonyme"}</span>
                                    <span>•</span>
                                    <span>{new Date(route.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                        {Array.isArray(route.holds) ? route.holds.length : 0} Prises
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[140px]">
                                <button
                                    onClick={() => setViewingRoute(route)}
                                    className="bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye size={14} /> Voir le bloc
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            if (!route.is_featured) {
                                                await supabase.from('routes').update({ is_featured: false }).eq('is_featured', true);
                                            }
                                            await supabase.from('routes').update({ is_featured: !route.is_featured }).eq('id', route.id);
                                            fetchRoutes();
                                        }}
                                        className={cn(
                                            "flex-1 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-2",
                                            route.is_featured
                                                ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                                        )}
                                        title={route.is_featured ? "En avant" : "Mettre en avant"}
                                    >
                                        <Award size={14} className={route.is_featured ? "fill-yellow-500" : ""} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(route.id)}
                                        className="flex-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center justify-center"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ROUTE PREVIEW MODAL */}
            {viewingRoute && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8" onClick={() => setViewingRoute(null)}>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
                            <div>
                                <h3 className="text-lg font-black italic text-white">{viewingRoute.name}</h3>
                                <p className="text-xs text-zinc-500 font-mono">ID: {viewingRoute.id}</p>
                            </div>
                            <div className={cn(
                                "px-3 py-1 rounded-lg font-black text-sm",
                                viewingRoute.grade.includes('6') ? "bg-yellow-500 text-black" :
                                    viewingRoute.grade.includes('7') ? "bg-orange-500 text-white" :
                                        "bg-red-500 text-white"
                            )}>
                                {viewingRoute.grade}
                            </div>
                        </div>

                        <div className="relative flex-1 bg-black aspect-[3/4] overflow-hidden">
                            {activeWall ? (
                                <>
                                    <img
                                        src={activeWall.image_url}
                                        className="absolute inset-0 w-full h-full object-contain opacity-50"
                                        alt="Wall"
                                    />
                                    {/* SVG Overlay for Holds */}
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                                        {wallHolds.map(hold => {
                                            const style = getHoldStyle(hold.id);
                                            if (!style) return null;

                                            if (hold.contour && Array.isArray(hold.contour)) {
                                                const points = hold.contour.map((p: any) => `${p[0] * 100},${p[1] * 100}`).join(' ');
                                                return (
                                                    <polygon
                                                        key={hold.id}
                                                        points={points}
                                                        fill="none"
                                                        stroke={style.stroke}
                                                        strokeWidth="0.3"
                                                        className="drop-shadow-md transition-all duration-300"
                                                        strokeLinejoin="round"
                                                    />
                                                );
                                            }

                                            // Fallback if no contour
                                            return (
                                                <circle
                                                    key={hold.id}
                                                    cx={hold.x * 100}
                                                    cy={hold.y * 100}
                                                    r="1.5"
                                                    fill="none"
                                                    stroke={style.stroke}
                                                    strokeWidth="0.3"
                                                    className="drop-shadow-md"
                                                />
                                            );
                                        })}
                                    </svg>

                                    {wallHolds.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 bg-black/50">
                                            <p className="text-center text-xs px-8">
                                                Aucune donnée de prises (scan) trouvée pour ce mur.<br />
                                                Impossible d'afficher les prises exactes.
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                                    Images du mur non trouvées.
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-zinc-800 bg-zinc-900 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setViewingRoute(null)}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Fermer
                            </button>
                            <button
                                onClick={() => {
                                    // Could open edit mode here later
                                    setViewingRoute(null);
                                }}
                                className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 font-bold rounded-xl transition-colors"
                            >
                                Éditer (Bientôt)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function OldModerationView() { // Kept just in case, but replaced above
    return <div />;
}




function WallView() {
    const [wall, setWall] = useState<any>(null);
    const [allWalls, setAllWalls] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSurgicalMode, setIsSurgicalMode] = useState(false);

    async function fetchWalls() {
        const { data } = await supabase.from('walls').select('*').order('created_at', { ascending: false });
        setAllWalls(data || []);

        // Find active wall
        const active = data?.find(w => w.is_active) || data?.[0];
        if (active) setWall(active);
    }


    const handleSetActive = async (id: string) => {
        // Reset all
        await supabase.from('walls').update({ is_active: false }).eq('is_active', true);
        // Set new active
        await supabase.from('walls').update({ is_active: true }).eq('id', id);
        fetchWalls();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setScanResult(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `walls/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('images') // Assumes a bucket named 'images' exists
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // 3. Update or Create Wall in DB
            let currentWallId = wall?.id;
            if (currentWallId === 'local-default' || !currentWallId) {
                const { data: newWall, error: insertError } = await supabase
                    .from('walls')
                    .insert({ name: 'Mur Principal', image_url: publicUrl })
                    .select()
                    .single();
                if (insertError) throw insertError;
                currentWallId = newWall.id;
                setWall(newWall);
            } else {
                const { error: updateError } = await supabase
                    .from('walls')
                    .update({ image_url: publicUrl })
                    .eq('id', currentWallId);
                if (updateError) throw updateError;
                setWall({ ...wall, image_url: publicUrl });
            }

            setScanResult("✅ Image téléchargée ! Lancement du scan IA...");

            // 4. Trigger Scan Auto (Needs wall state to be updated, so we pass publicUrl directly)
            await handleScanWithUrl(publicUrl, currentWallId);

        } catch (error: any) {
            console.error(error);
            setScanResult(`❌ Erreur d'upload: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleScanWithUrl = async (url: string, wallId: string) => {
        setIsScanning(true);
        try {
            const polygons = await segmentWallImage(url);
            if (!polygons || polygons.length === 0) throw new Error("Aucune prise détectée.");

            await supabase.from('holds').delete().eq('wall_id', wallId);
            const dbHolds = polygons.map((p: any) => ({
                wall_id: wallId,
                contour: p.contour,
                area_px: p.area_px,
                x: p.bbox[0],
                y: p.bbox[1]
            }));

            const chunkSize = 100;
            for (let i = 0; i < dbHolds.length; i += chunkSize) {
                const { error } = await supabase.from('holds').insert(dbHolds.slice(i, i + chunkSize));
                if (error) throw error;
            }
            setScanResult(`✅ Succès ! ${polygons.length} prises détectées.`);
        } catch (error: any) {
            setScanResult(`❌ Erreur scan: ${error.message}`);
        } finally {
            setIsScanning(false);
        }
    };

    const handleScan = async () => {
        if (!wall?.image_url) return;

        let urlToScan = wall.image_url;

        // If local image, we must upload it first because Replicate needs a public URL
        if (wall.image_url.startsWith('/') || wall.image_url.includes('localhost')) {
            console.log("📤 Image locale détectée, upload automatique vers le Cloud avant le scan IA...");
            setIsUploading(true);
            setScanResult("☁️ Hébergement temporaire pour l'IA...");

            try {
                // Fetch the local file as a blob
                const response = await fetch(wall.image_url);
                const blob = await response.blob();
                const file = new File([blob], "wall_auto_fix.jpg", { type: "image/jpeg" });

                const fileName = `wall_scanned_${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage.from('walls').upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('walls').getPublicUrl(fileName);
                urlToScan = publicUrl;

                // Update wall URL in DB
                await supabase.from('walls').update({ image_url: publicUrl }).eq('id', wall.id);
                setWall({ ...wall, image_url: publicUrl });
            } catch (err: any) {
                console.error("Auto-upload failed:", err);
                setScanResult(`❌ Erreur d'auto-upload: ${err.message}`);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        handleScanWithUrl(urlToScan, wall.id);
    };

    useEffect(() => {
        fetchWalls();
    }, []);

    if (isSurgicalMode) {
        return <SurgicalEditor onBack={() => setIsSurgicalMode(false)} />;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Configuration du Mur</h3>
                    <p className="text-sm text-zinc-500 italic">Gérez l'image de référence et l'analyse IA.</p>
                </div>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer transition-all border border-zinc-700">
                        <Upload size={16} />
                        {isUploading ? "Upload..." : "Changer la photo"}
                        <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                    </label>
                    <button
                        onClick={() => setIsSurgicalMode(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-600/20 transition-all"
                    >
                        <PenTool size={16} /> Mode Chirurgical
                    </button>
                    <button
                        onClick={handleScan}
                        disabled={isScanning || isUploading || !wall?.image_url}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                            (isScanning || isUploading || !wall?.image_url)
                                ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                : "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                        )}
                    >
                        {isScanning ? <RefreshCw size={16} className="animate-spin" /> : <Award size={16} />}
                        {isScanning ? (isUploading ? "Upload..." : "Scan IA...") : "Lancer Scan Correctif"}
                    </button>
                </div>
            </div>

            {scanResult && (
                <div className={cn(
                    "p-4 rounded-xl text-sm font-bold border flex items-center gap-3",
                    scanResult.includes('✅') ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        scanResult.includes('⚠️') ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                            "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                    {scanResult.includes('✅') ? <Check size={18} /> : <X size={18} />}
                    {scanResult}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800 relative overflow-hidden group">
                    <div className="aspect-[3/4] rounded-2xl bg-black overflow-hidden flex items-center justify-center relative border border-zinc-800">
                        {wall ? (
                            <img src={wall.image_url} className="w-full h-full object-contain" alt="Mur" />
                        ) : (
                            <ImageIcon size={32} className="text-zinc-800" />
                        )}
                        {(isScanning || isUploading) && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                                <p className="text-sm font-black tracking-widest uppercase text-white animate-pulse">
                                    {isUploading ? "Upload..." : "Analyse IA..."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                        <h4 className="font-bold mb-1 text-zinc-100 flex items-center gap-2">
                            {wall?.name || "Sans nom"}
                            {wall?.is_active && <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full uppercase font-black">Actif</span>}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-mono mb-4 break-all">ID: {wall?.id}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                                <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Source</p>
                                <p className="text-sm font-bold truncate">{wall?.image_url.includes('supabase') ? "Cloud" : "Local"}</p>
                            </div>
                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                                <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">IA Status</p>
                                <p className="text-sm font-bold text-green-500 truncate">Auto-Ready</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800">
                        <h4 className="text-sm font-bold mb-4 uppercase tracking-widest text-zinc-500">Historique des versions</h4>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {allWalls.map(w => (
                                <div
                                    key={w.id}
                                    onClick={() => setWall(w)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group",
                                        wall?.id === w.id ? "bg-zinc-800 border-zinc-700" : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-zinc-900 overflow-hidden border border-zinc-800">
                                        <img src={w.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">{w.name}</p>
                                        <p className="text-[10px] text-zinc-500">{new Date(w.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {w.is_active ? (
                                        <div className="text-green-500 bg-green-500/10 p-1.5 rounded-full">
                                            <Check size={14} />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSetActive(w.id); }}
                                            className="opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            Activer
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
