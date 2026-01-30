import React, { useState } from 'react';
import {
    LayoutDashboard,
    Image as ImageIcon,
    Settings,
    ShieldCheck,
    Users,
    TrendingUp,
    FolderKanban,
    Award
} from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
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
                        label="Modération"
                        active={activeTab === 'moderation'}
                        onClick={() => setActiveTab('moderation')}
                        badge="12"
                    />
                    <NavItem
                        icon={<ImageIcon size={20} />}
                        label="Gestion du Mur"
                        active={activeTab === 'wall'}
                        onClick={() => setActiveTab('wall')}
                    />
                    <NavItem
                        icon={<FolderKanban size={20} />}
                        label="Dossiers Training"
                        active={activeTab === 'training'}
                        onClick={() => setActiveTab('training')}
                    />
                    <NavItem
                        icon={<Award size={20} />}
                        label="Sponsoring"
                        active={activeTab === 'sponsoring'}
                        onClick={() => setActiveTab('sponsoring')}
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
                        <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors">
                            Nouveau Bloc
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'dashboard' && <DashboardView />}
                    {activeTab === 'moderation' && <ModerationView />}
                    {activeTab === 'wall' && <WallView />}
                    {activeTab !== 'dashboard' && activeTab !== 'moderation' && activeTab !== 'wall' && (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                            <p className="text-sm italic">Interface en cours de développement...</p>
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
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-4 gap-6">
                <StatsCard title="Total Grimpeurs" value="482" change="+12%" icon={<Users className="text-blue-500" />} />
                <StatsCard title="Blocs Actifs" value="124" change="+4" icon={<LayoutDashboard className="text-rose-500" />} />
                <StatsCard title="Passages (24h)" value="1,240" change="+82" icon={<TrendingUp className="text-green-500" />} />
                <StatsCard title="Temps Moyen / Bloc" value="4min" change="-30s" icon={<LayoutDashboard className="text-yellow-500" />} />
            </div>

            <div className="bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800">
                <h3 className="text-lg font-bold mb-6">Activité récente</h3>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-zinc-800 last:border-0">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold">GT</div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">Nouveau bloc créé : "Le Plafond"</p>
                                <p className="text-xs text-zinc-500">Par Gauthier • Il y a 10 minutes</p>
                            </div>
                            <button className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold transition-colors">
                                Voir
                            </button>
                        </div>
                    ))}
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
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Blocs en attente de validation</h3>
                <div className="flex gap-2">
                    <button className="text-xs bg-white text-black px-4 py-2 rounded-xl font-bold">Tout approuver</button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800 flex items-center gap-6">
                        <div className="w-24 aspect-[3/4] rounded-xl bg-zinc-800 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1522163182402-834f871fd851?w=200" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-lg">Dyno Power #4</h4>
                            <p className="text-sm text-zinc-500">Auteur: Marc • Cotation proposée: 6B</p>
                            <div className="flex gap-2 mt-4">
                                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Physique</span>
                                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Dynamique</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">Approuver</button>
                            <button className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">Modifier</button>
                            <button className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 text-xs font-bold px-4 py-2 rounded-xl transition-colors">Rejeter</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WallView() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Versions du Mur</h3>
                    <p className="text-sm text-zinc-500 italic">Gérez les photos 4K et l'historique des ouvertures.</p>
                </div>
                <button className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-xl shadow-xl active:scale-95 transition-all">
                    Nouvelle Version (Reset)
                </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="bg-zinc-900/30 rounded-3xl p-6 border-2 border-rose-500/50 flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase">Actif</div>
                    <div className="aspect-[4/3] rounded-2xl bg-zinc-800 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h4 className="font-bold">Version "Hiver 2026"</h4>
                        <p className="text-xs text-zinc-500">Mis à jour le 30/01/2026</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 bg-zinc-800 py-2 rounded-xl text-xs font-bold">Modifier photo</button>
                        <button className="flex-1 bg-zinc-800 py-2 rounded-xl text-xs font-bold hover:text-rose-500">Archiver</button>
                    </div>
                </div>

                <div className="bg-zinc-900/10 rounded-3xl p-6 border border-zinc-800 opacity-60 flex flex-col gap-4 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                    <div className="aspect-[4/3] rounded-2xl bg-zinc-800 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1516339901600-2e1a6298ed74?w=800" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h4 className="font-bold">Version "Automne 2025"</h4>
                        <p className="text-xs text-zinc-500">Archivé le 15/12/2025</p>
                    </div>
                    <button className="bg-zinc-800 py-2 rounded-xl text-xs font-bold">Consulter (342 blocs)</button>
                </div>
            </div>
        </div>
    );
}
