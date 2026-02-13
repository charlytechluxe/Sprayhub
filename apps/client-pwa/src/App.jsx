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
        <div className="p-6 pb-32 bg-black min-h-screen">
            <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase italic bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                SPRAY<span className="text-accent-pink drop-shadow-[0_0_15px_rgba(251,32,86,0.6)]">HUB</span>
            </h1>

            {/* Featured Block */}
            <div
                onClick={() => featuredRoute && navigate(`/route/${featuredRoute.id}`)}
                className="relative overflow-hidden bg-zinc-900 rounded-[2.5rem] p-8 border border-white/10 mb-10 aspect-[4/3] flex flex-col justify-end group active:scale-[0.97] transition-all cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
            >
                {/* Image Overlay if we had images, but let's use a dynamic gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-pink/10 via-transparent to-zinc-950/90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                {/* Content */}
                <div className="relative z-10">
                    {loading ? (
                        <div className="h-20 flex items-center text-zinc-600 animate-pulse font-bold italic uppercase tracking-widest text-xs">Recherche du bloc...</div>
                    ) : featuredRoute ? (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-accent-pink text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-accent-pink/20 border border-white/10">
                                    Dernier Ajout
                                </span>
                            </div>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-white drop-shadow-2xl">{featuredRoute.name || "SANS NOM"}</h2>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-accent-pink shadow-[0_0_8px_#FB2056]" />
                                    <span className="text-xs font-black text-white/90 uppercase italic tracking-tighter">{featuredRoute.grade}</span>
                                </div>
                                <div className="w-px h-3 bg-white/20" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                                    {Array.isArray(featuredRoute.holds) ? featuredRoute.holds.length : 0} Prises
                                </span>
                            </div>
                        </>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-black mb-1 text-zinc-700 italic uppercase">Aucun bloc</h2>
                            <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest">Le mur attend son premier défi.</p>
                        </div>
                    )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/20 group-hover:scale-110 group-hover:text-white transition-all">
                    <Activity size={20} />
                </div>
            </div>

            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 px-1">Statistiques</h2>
            <div className="grid grid-cols-2 gap-5 mb-10">
                <Link to="/routes" className="bg-zinc-900/40 backdrop-blur-xl aspect-square rounded-[2.5rem] p-7 flex flex-col justify-between border border-white/5 hover:bg-zinc-800 transition-all group shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:bg-white/10 transition-all shadow-inner">
                        <List size={22} />
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-widest block mb-1">Total Blocs</span>
                        <span className="text-4xl font-black tracking-tighter text-white italic">
                            {loading ? "-" : stats.totalRoutes}
                        </span>
                    </div>
                </Link>
                <div className="bg-zinc-900/40 backdrop-blur-xl aspect-square rounded-[2.5rem] p-7 flex flex-col justify-between border border-white/5 hover:bg-zinc-800 transition-all group shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-accent-pink group-hover:bg-accent-pink/10 transition-all shadow-inner">
                        <PlusSquare size={22} />
                    </div>
                    <div>
                        <span className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-widest block mb-1">Mes Croix</span>
                        <span className="text-4xl font-black tracking-tighter text-white italic">0</span>
                    </div>
                </div>
            </div>

            {/* Developer Slot */}
            <a href="https://appleservice.fr" target="_blank" rel="noopener noreferrer" className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-6 flex items-center justify-between mb-24 transition-all hover:bg-zinc-900 hover:border-white/10 group shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-black rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl relative overflow-hidden">
                        <span className="font-black italic text-xs tracking-tighter relative z-10">CTL</span>
                        <div className="absolute inset-0 bg-gradient-to-tr from-accent-pink/20 to-transparent" />
                    </div>
                    <div>
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] group-hover:text-zinc-500 mb-0.5">Developed by</p>
                        <p className="text-sm font-black text-white group-hover:text-accent-pink transition-colors italic uppercase tracking-tight">Charly Tech & Luxe</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 group-hover:bg-accent-pink group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <ChevronRight size={16} />
                </div>
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
                    <Route path="/plan/:id" element={<TrainingPlanDetailPage />} />
                </Routes>
                <BottomNav />
            </div>
        </Router>
    );
}
