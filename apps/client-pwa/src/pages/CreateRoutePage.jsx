import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import SprayCanvas from '../components/SprayCanvas';
import { supabase } from '../lib/supabase';
import ErrorBoundary from '../components/ErrorBoundary';

const GRADE_COLORS = [
    { name: 'Orange', hex: '#FF8C00' }, // Très Facile
    { name: 'Rose', hex: '#FF00FF' },   // Facile
    { name: 'Vert', hex: '#A4C639' },   // Moyen
    { name: 'Jaune', hex: '#FFD700' },  // Assez Difficile
    { name: 'Bleu', hex: '#32A9D6' },   // Difficile
    { name: 'Rouge', hex: '#FF0000' },  // Très Difficile
    { name: 'Blanc', hex: '#ffffff' },  // Extrême
    { name: 'Projet', hex: '#a1a1aa' },
];

export default function CreateRoutePage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('Projet');
    const [holds, setHolds] = useState([]);
    const [selectionMode, setSelectionMode] = useState('handfoot');
    const [isSaving, setIsSaving] = useState(false);
    const [currentWall, setCurrentWall] = useState(null);
    const [loadingWall, setLoadingWall] = useState(true);

    useEffect(() => {
        async function fetchWall() {
            setLoadingWall(true);
            try {
                const { data, error } = await supabase.from('walls').select('*').limit(1).maybeSingle();
                if (data) {
                    setCurrentWall(data);
                } else {
                    console.log("No wall found in DB, using default.");
                }
            } catch (err) {
                console.error("Error fetching wall:", err);
            }
            setLoadingWall(false);
        }
        fetchWall();
    }, []);

    const imageUrl = currentWall?.image_url || "/wall_v1.jpg";

    const handleAddHold = (hold) => {
        setHolds(prev => [...prev, hold]); // Use functional update for safety
        setActiveHoldId(hold.id);
    };

    const [activeHoldId, setActiveHoldId] = useState(null);

    // ... (rest of logic) ...

    const handleUpdateHold = (id, updatedHold, shouldFocus = false) => {
        setHolds(holds.map(h => h.id === id ? updatedHold : h));
        if (shouldFocus) setActiveHoldId(id);
    };

    const handleRemoveHold = (id) => {
        setHolds(holds.filter(h => h.id !== id));
        if (activeHoldId === id) setActiveHoldId(null);
    };

    const activeHold = holds.find(h => h.id === activeHoldId);

    // Close inspector when clicking empty space (this needs canvas support, but for now back button works)
    // Or we can add a 'bg' click handler in the Inspector backdrop.

    const handleSave = async () => {
        if (!name.trim()) {
            alert("Veuillez donner un nom au bloc.");
            return;
        }
        if (holds.length === 0) {
            alert("Veuillez sélectionner au moins une prise.");
            return;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Vous devez être connecté pour créer un bloc.");
                navigate('/auth');
                return;
            }

            const routeData = {
                name: name.trim(),
                grade: grade,
                holds: holds,
                wall_id: currentWall?.id, // Optional if wall_id is nullable, but recommended
                author_id: user.id
            };

            const { data, error } = await supabase
                .from('routes')
                .insert(routeData)
                .select()
                .single();

            if (error) throw error;

            console.log("Bloc créé !", data);
            navigate(`/route/${data.id}`);

        } catch (err) {
            console.error("Erreur lors de la sauvegarde :", err);
            alert("Erreur lors de la sauvegarde. Vérifiez la console.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-4 border-b border-zinc-900 bg-zinc-950 z-20">
                <button onClick={() => navigate(-1)} className="btn-touch text-zinc-400">
                    <X size={24} />
                </button>
                <input
                    type="text"
                    placeholder="Nom du bloc..."
                    className="bg-transparent text-center font-bold text-lg outline-none flex-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-touch text-accent-pink font-bold disabled:opacity-50"
                >
                    {isSaving ? '...' : <Save size={24} />}
                </button>
            </header>

            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden p-4">
                {loadingWall ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-10 h-10 rounded-full border border-zinc-900 border-t-accent-pink animate-spin" />
                    </div>
                ) : (
                    <ErrorBoundary>
                        <SprayCanvas
                            imageUrl={imageUrl}
                            holds={holds}
                            onAddHold={handleAddHold}
                            onUpdateHold={handleUpdateHold}
                            onRemoveHold={handleRemoveHold}
                            isEditable={true}
                            activeTool={selectionMode}
                        />
                    </ErrorBoundary>
                )}
            </div>

            {/* Bottom Bar: Grade Selector or Hold Inspector */}
            <div className="bg-surface/90 backdrop-blur-xl border-t border-white/10 z-30 transition-all duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">

                {/* 1. HOLD INSPECTOR (If hold selected) */}
                {activeHold ? (
                    <div className="p-4 space-y-4 animate-in slide-in-from-bottom-5">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-xs uppercase font-bold tracking-widest">
                                Prise #{activeHold.id.split('_').pop().slice(0, 4)}
                            </span>
                            <button
                                onClick={() => setActiveHoldId(null)}
                                className="text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex gap-4">
                            {/* Color/Type Indicator (Click to Cycle) */}
                            <button
                                onClick={() => {
                                    // Cycle Type Logic (Duplicate logic, ideally shared)
                                    const CYCLE_ORDER = ['handfoot', 'foot', 'start', 'top'];
                                    const currentIndex = CYCLE_ORDER.indexOf(activeHold.type);
                                    const nextType = CYCLE_ORDER[(currentIndex + 1) % 4];
                                    handleUpdateHold(activeHold.id, { ...activeHold, type: nextType }, true);
                                }}
                                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center bg-zinc-800 transition-colors ${activeHold.type === 'start' ? 'border-accent-green' :
                                    activeHold.type === 'handfoot' ? 'border-accent-blue' :
                                        activeHold.type === 'foot' ? 'border-accent-yellow' : 'border-accent-red'
                                    }`}
                            >
                                <span className={`w-4 h-4 rounded-full ${activeHold.type === 'start' ? 'bg-accent-green' :
                                    activeHold.type === 'handfoot' ? 'bg-accent-blue' :
                                        activeHold.type === 'foot' ? 'bg-accent-yellow' : 'bg-accent-red'
                                    } shadow-[0_0_10px_currentColor]`} />
                            </button>

                            {/* Comment Input */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Ajouter une note (ex: Main gauche)..."
                                    className="w-full h-14 bg-black/50 border border-zinc-700 rounded-2xl px-4 text-sm text-white outline-none focus:border-zinc-500 transition-colors"
                                    value={activeHold.note || ''}
                                    onChange={(e) => handleUpdateHold(activeHold.id, { ...activeHold, note: e.target.value }, true)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleRemoveHold(activeHold.id)}
                            className="w-full py-3 bg-red-500/10 text-red-500 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                            Supprimer la prise
                        </button>
                    </div>
                ) : (
                    /* 2. DEFAULT TOOLS (Grade Selector) */
                    <div className="p-4 space-y-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                            {GRADE_COLORS.map((c) => (
                                <button
                                    key={c.name}
                                    onClick={() => setGrade(c.name)}
                                    className={`flex-shrink-0 px-4 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${grade === c.name
                                        ? 'bg-white text-black border-white scale-105 shadow-lg'
                                        : 'bg-zinc-800 text-zinc-400 border-transparent'
                                        }`}
                                    style={{ color: grade === c.name ? 'black' : c.hex }}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-zinc-500 text-xs font-medium">
                            Touchez une prise pour modifier sa couleur ou ajouter une note.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
