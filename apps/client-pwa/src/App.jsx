import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, List, User, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import RoutesPage from './pages/RoutesPage';
import CreateRoutePage from './pages/CreateRoutePage';
import RouteDetailPage from './pages/RouteDetailPage';
import PosterPage from './pages/PosterPage';
import TrainingPlanDetailPage from './pages/TrainingPlanDetailPage';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';

import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage'; // New Import
import WallEditorPage from './pages/WallEditorPage';
import { useNavigate } from 'react-router-dom';

import TrainingPlanDetailPage from './pages/TrainingPlanDetailPage';

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
                // FORCE AUTH ON FIRST LAUNCH
                navigate('/auth');
            }
        };
        checkAuth();
    }, [navigate]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            // 1. Total Count
            const { count } = await supabase.from('routes').select('*', { count: 'exact', head: true });

            // 2. Featured Route (Most recent one for now)
            const { data: routes } = await supabase
                .from('routes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            setStats({ totalRoutes: count || 0 });
            if (routes && routes.length > 0) {
                setFeaturedRoute(routes[0]);
            }
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

    // Hide nav on create page to give more space for canvas, and on poster page for printing
    if (location.pathname === '/create' || location.pathname === '/poster') return null;

    // Hide nav on auth page
    if (location.pathname === '/auth') return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-24 bg-background/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-8 pb-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <NavLink icon={<Home size={24} />} label="Accueil" to="/" active={isActive('/')} />
            <NavLink icon={<List size={24} />} label="Explorer" to="/routes" active={isActive('/routes')} />
            <div className="relative w-16 h-16 flex items-center justify-center">
                <NavLink icon={<PlusSquare size={28} />} label="" to="/create" active={isActive('/create')} primary />
            </div>
            <NavLink icon={<PlusSquare size={24} className="opacity-0" />} label="Training" to="#" active={false} />
            <NavLink icon={<User size={24} />} label="Profil" to="/profile" active={isActive('/profile')} />
        </nav>
    );
};

const NavLink = ({ icon, label, to, active, primary = false }) => (
    <Link
        to={to}
        className={cn(
            "flex flex-col items-center justify-center transition-all duration-300 relative",
            active ? "text-white" : "text-zinc-600 hover:text-zinc-400",
            primary && "absolute -top-12 bg-accent-pink text-white rounded-full w-20 h-20 shadow-[0_0_30px_rgba(255,0,85,0.4)] active:scale-90 z-50 border-[6px] border-background flex items-center justify-center transition-all"
        )}
    >
        {active && !primary && <div className="absolute -top-3 w-1 h-1 bg-accent-pink rounded-full shadow-[0_0_10px_#FB2056]"></div>}
        <div className={cn("p-2 transition-all", active && !primary && "text-accent-pink drop-shadow-[0_0_8px_rgba(255,0,85,0.5)]")}>
            {icon}
        </div>
        {label && <span className={cn("text-[10px] mt-1 font-bold tracking-tight uppercase transition-colors", active ? "text-white" : "text-zinc-600")}>{label}</span>}
    </Link>
);

import InstallPrompt from './components/InstallPrompt';

export default function App() {
    return (
        <Router>
            <div className="min-h-screen bg-background text-foreground antialiased selection:bg-accent-pink selection:text-white">
                <InstallPrompt />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/routes" element={<RoutesPage />} />
                    <Route path="/route/:id" element={<RouteDetailPage />} />
                    <Route path="/create" element={<CreateRoutePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/poster" element={<PosterPage />} />
                    <Route path="/admin/editor" element={<WallEditorPage />} />
                    <Route path="/plan/:id" element={<TrainingPlanDetailPage />} />
                </Routes>
                <BottomNav />
            </div>
        </Router>
    );
}
