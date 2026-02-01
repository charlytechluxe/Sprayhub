import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, List, User, ChevronRight, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { supabase } from './lib/supabase';

import RoutesPage from './pages/RoutesPage';
import CreateRoutePage from './pages/CreateRoutePage';
import RouteDetailPage from './pages/RouteDetailPage';
import PosterPage from './pages/PosterPage';
import TrainingPlanDetailPage from './pages/TrainingPlanDetailPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import WallEditorPage from './pages/WallEditorPage';
import TrainingLogPage from './pages/TrainingLogPage';
import InstallPrompt from './components/InstallPrompt';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const HomePage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalRoutes: 0 });
    const [featuredRoute, setFeaturedRoute] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/auth');
            }
        };
        checkAuth();
    }, [navigate]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const { count } = await supabase.from('routes').select('*', { count: 'exact', head: true });

            // Try to fetch featured first
            const { data: featured } = await supabase
                .from('routes')
                .select('*')
                .eq('is_featured', true)
                .maybeSingle();

            if (featured) {
                setFeaturedRoute(featured);
            } else {
                // Fallback to latest
                const { data: latest } = await supabase
                    .from('routes')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (latest && latest.length > 0) {
                    setFeaturedRoute(latest[0]);
                }
            }

            setStats({ totalRoutes: count || 0 });
            setLoading(false);
        }
        fetchData();
    }, []);

    return (
        <div className="p-6 pb-32">
            <h1 className="text-4xl font-black mb-8 tracking-tighter uppercase italic bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                SPRAY<span className="text-accent-pink drop-shadow-[0_0_10px_rgba(255,0,85,0.5)]">HUB</span>
            </h1>

            {/* Featured Block */}
            <div className="relative overflow-hidden bg-surface rounded-[2rem] p-8 border border-white/5 mb-8 aspect-[4/3] flex flex-col justify-end group active:scale-[0.98] transition-transform shadow-2xl shadow-black/50 ring-1 ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="w-20 h-20 bg-accent-pink/20 blur-3xl rounded-full absolute -top-10 -right-10 pointer-events-none"></div>
                </div>

                {loading ? (
                    <div className="relative z-10 text-zinc-500 animate-pulse">Chargement...</div>
                ) : featuredRoute ? (
                    <div className="relative z-10">
                        <span className="bg-accent-pink text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block shadow-[0_0_15px_rgba(255,0,85,0.4)] border border-white/20">
                            Dernier Ajout
                        </span>
                        <h2 className="text-3xl font-black mb-1 text-white drop-shadow-md">{featuredRoute.name}</h2>
                        <p className="text-zinc-400 text-sm font-medium">
                            {featuredRoute.grade} • {Array.isArray(featuredRoute.holds) ? featuredRoute.holds.length : 0} Prises
                        </p>
                    </div>
                ) : (
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-1 text-zinc-500">Aucun bloc</h2>
                        <p className="text-zinc-600 text-sm">Créez le premier bloc maintenant !</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-surface/50 backdrop-blur-md aspect-square rounded-[2rem] p-6 flex flex-col justify-between border border-white/5 hover:bg-surface/80 transition-colors group">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all">
                        <List size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Total Blocs</span>
                        <span className="text-3xl font-black tracking-tighter text-white">
                            {loading ? "-" : stats.totalRoutes}
                        </span>
                    </div>
                </div>
                <div className="bg-surface/50 backdrop-blur-md aspect-square rounded-[2rem] p-6 flex flex-col justify-between border border-white/5 hover:bg-surface/80 transition-colors group">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-accent-pink group-hover:bg-accent-pink/10 transition-all">
                        <PlusSquare size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Mes Croix</span>
                        <span className="text-3xl font-black tracking-tighter text-white">0</span>
                    </div>
                </div>
            </div>

            {/* Developer Slot */}
            <a href="https://appleservice.fr" target="_blank" rel="noopener noreferrer" className="bg-surface/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between mb-24 transition-all hover:bg-surface/60 hover:border-white/10 group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-black rounded-xl flex items-center justify-center text-white border border-white/10 shadow-lg">
                        <span className="font-black italic text-xs tracking-tighter">CTL</span>
                    </div>
                    <div>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest group-hover:text-zinc-400">Développé par</p>
                        <p className="text-xs font-bold text-white group-hover:text-accent-pink transition-colors">Charly Tech & Luxe</p>
                    </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
            </a>
        </div>
    );
};

const BottomNav = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    // Hide nav on specific pages
    if (['/create', '/poster', '/auth'].includes(location.pathname)) return null;

    return (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] h-20 bg-white/5 backdrop-blur-[40px] rounded-[2.5rem] border border-white/10 flex items-center justify-between px-6 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10 overflow-hidden">
            {/* Liquid Glare Effect */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-80"></div>

            <NavLink icon={<Home size={22} />} to="/" active={isActive('/')} />
            <NavLink icon={<List size={22} />} to="/routes" active={isActive('/routes')} />

            {/* Central Engraved Button */}
            <div className="relative flex items-center justify-center">
                <Link to="/create" className="relative flex items-center justify-center w-14 h-14 rounded-full bg-black/20 border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group active:scale-95 transition-all duration-300">
                    <PlusSquare
                        size={28}
                        className="text-accent-pink filter drop-shadow-[0_0_8px_rgba(251,32,86,0.8)] drop-shadow-[0_0_15px_rgba(251,32,86,0.4)] transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110"
                    />
                    {/* Inner Engraving Shine */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                </Link>
            </div>

            <NavLink icon={<Activity size={22} />} to="/training" active={isActive('/training')} />
            <NavLink icon={<User size={22} />} to="/profile" active={isActive('/profile')} />
        </nav>
    );
};

const NavLink = ({ icon, to, active, disabled }) => (
    <Link
        to={to}
        className={cn(
            "relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-500 group",
            disabled ? "pointer-events-none text-transparent" : "",
            active
                ? "text-accent-pink scale-110"
                : "text-zinc-500 hover:text-zinc-300"
        )}
    >
        {active && (
            <>
                <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-full scale-150 animate-pulse"></div>
                <div className="absolute bottom-1 w-1.5 h-1.5 bg-accent-pink rounded-full shadow-[0_0_12px_#FB2056,0_0_20px_rgba(251,32,86,0.6)]"></div>
            </>
        )}
        <div className={cn("relative z-10 transition-all duration-500", active ? "-translate-y-1.5 drop-shadow-[0_0_8px_rgba(251,32,86,0.8)]" : "group-hover:scale-110")}>
            {icon}
        </div>
    </Link>
);

export default function App() {
    return (
        <Router>
            <div className="min-h-screen bg-zinc-950 text-white antialiased selection:bg-accent-pink selection:text-white pb-32">
                <InstallPrompt />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/routes" element={<RoutesPage />} />
                    <Route path="/route/:id" element={<RouteDetailPage />} />
                    <Route path="/create" element={<CreateRoutePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/poster" element={<PosterPage />} />
                    <Route path="/training" element={<TrainingLogPage />} />
                    <Route path="/admin/editor" element={<WallEditorPage />} />
                    <Route path="/plan/:id" element={<TrainingPlanDetailPage />} />
                </Routes>
                <BottomNav />
            </div>
        </Router>
    );
}
