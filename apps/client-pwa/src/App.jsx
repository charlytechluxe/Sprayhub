import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, List, User, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import RoutesPage from './pages/RoutesPage';
import CreateRoutePage from './pages/CreateRoutePage';
import PosterPage from './pages/PosterPage';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';

const HomePage = () => {
    const [stats, setStats] = useState({ totalRoutes: 0 });
    const [featuredRoute, setFeaturedRoute] = useState(null);
    const [loading, setLoading] = useState(true);

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
        <div className="p-6">
            <h1 className="text-4xl font-black mb-8 tracking-tighter uppercase italic">SPRAY<span className="text-accent-pink">HUB</span></h1>

            {/* Featured Block */}
            <div className="relative overflow-hidden bg-zinc-900 rounded-[2rem] p-8 border border-zinc-800 mb-8 aspect-[4/3] flex flex-col justify-end group active:scale-[0.98] transition-transform">
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />

                {loading ? (
                    <div className="relative z-10 text-zinc-500 animate-pulse">Chargement...</div>
                ) : featuredRoute ? (
                    <div className="relative z-10">
                        <span className="bg-accent-pink text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                            Dernier Ajout
                        </span>
                        <h2 className="text-3xl font-black mb-1">{featuredRoute.name}</h2>
                        <p className="text-zinc-400 text-sm">
                            {featuredRoute.grade} • {Array.isArray(featuredRoute.holds) ? featuredRoute.holds.length : 0} Prises
                        </p>
                    </div>
                ) : (
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-1 text-zinc-600">Aucun bloc</h2>
                        <p className="text-zinc-500 text-sm">Créez le premier bloc maintenant !</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-900/50 backdrop-blur-md aspect-square rounded-[2rem] p-6 flex flex-col justify-between border border-zinc-800/50">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <List size={20} />
                    </div>
                    <div>
                        <span className="text-sm text-zinc-500 font-medium block">Total Blocs</span>
                        <span className="text-3xl font-black tracking-tighter">
                            {loading ? "-" : stats.totalRoutes}
                        </span>
                    </div>
                </div>
                <div className="bg-zinc-900/50 backdrop-blur-md aspect-square rounded-[2rem] p-6 flex flex-col justify-between border border-zinc-800/50">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <PlusSquare size={20} />
                    </div>
                    <div>
                        <span className="text-sm text-zinc-500 font-medium block">Mes Croix</span>
                        <span className="text-3xl font-black tracking-tighter">0</span>
                    </div>
                </div>
            </div>

            {/* Sponsoring Slot */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between mb-24">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Petzl_logo.svg" alt="Petzl" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Partenaire</p>
                        <p className="text-xs font-bold">Équipez-vous chez Petzl</p>
                    </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600" />
            </div>
        </div>
    );
};

const ProfilePage = () => <div className="p-6 font-bold text-2xl text-zinc-700">Profil Utilisateur</div>;

const BottomNav = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    // Hide nav on create page to give more space for canvas, and on poster page for printing
    if (location.pathname === '/create' || location.pathname === '/poster') return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/90 backdrop-blur-2xl border-t border-zinc-900/50 flex items-center justify-around px-8 pb-6 z-50">
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
            "flex flex-col items-center justify-center transition-all duration-300",
            active ? "text-white" : "text-zinc-600",
            primary && "absolute -top-12 bg-accent-pink text-white rounded-full w-20 h-20 shadow-[0_0_30px_rgba(251,32,86,0.4)] active:scale-90 z-50 border-4 border-black flex items-center justify-center transition-all"
        )}
    >
        <div className={cn("p-2", active && "bg-zinc-800 rounded-xl")}>
            {icon}
        </div>
        {label && <span className="text-[10px] mt-1 font-bold tracking-tight uppercase">{label}</span>}
    </Link>
);

export default function App() {
    return (
        <Router>
            <div className="min-h-screen bg-black text-white">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/routes" element={<RoutesPage />} />
                    <Route path="/create" element={<CreateRoutePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/poster" element={<PosterPage />} />
                </Routes>
                <BottomNav />
            </div>
        </Router>
    );
}
