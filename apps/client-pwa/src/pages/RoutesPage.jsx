import React, { useState } from 'react';
import { Search, Filter, Heart, ChevronRight, Bookmark } from 'lucide-react';

const MOCK_ROUTES = [
    { id: '1', name: 'La Traversée du Désert', grade: 'Bleu', author: 'Charly', likes: 12, sends: 5, created_at: '2h ago' },
    { id: '2', name: 'Dyno de la Mort', grade: 'Rouge', author: 'Alex', likes: 45, sends: 2, created_at: '1d ago' },
    { id: '3', name: 'Dalles de Plaisir', grade: 'Vert', author: 'Sarah', likes: 8, sends: 12, created_at: '2d ago' },
    { id: '4', name: 'Le Projet Impossible', grade: 'Projet', author: 'Marc', likes: 102, sends: 0, created_at: '1w ago' },
];

const GRADE_HEX = {
    'Vert': '#A4C639', // Art de la Grimpe Lime Green
    'Bleu': '#32A9D6', // Art de la Grimpe Blue
    'Jaune': '#FFD700', // Art de la Grimpe Yellow
    'Rouge': '#FB2056', // Art de la Grimpe Pink/Red
    'Rose': '#FB2056',
    'Orange': '#FF8C00',
    'Blanc': '#ffffff',
    'Projet': '#a1a1aa',
};

export default function RoutesPage() {
    const [search, setSearch] = useState('');

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Explorer</h1>
                <button className="btn-touch bg-zinc-900 border border-zinc-800 p-2">
                    <Filter size={20} />
                </button>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                    type="text"
                    placeholder="Rechercher un bloc..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-accent-pink transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {MOCK_ROUTES.map((route) => (
                    <div
                        key={route.id}
                        className="group block bg-zinc-900/50 rounded-3xl p-4 border border-zinc-900 active:bg-zinc-800 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className="w-3 h-12 rounded-full relative"
                                style={{ backgroundColor: GRADE_HEX[route.grade] }}
                            >
                                {route.id === '4' && (
                                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,32,86,0.8)]" title="En cours de re-cotation" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">{route.name}</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-zinc-500">par {route.author}</p>
                                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                    <button className="text-[10px] font-black uppercase text-accent-pink hover:underline">Voter Cotation</button>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <Heart size={14} className="fill-current" />
                                    <span className="text-xs font-bold">{route.likes}</span>
                                </div>
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <Bookmark size={14} />
                                    <span className="text-xs font-bold">{route.sends}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
