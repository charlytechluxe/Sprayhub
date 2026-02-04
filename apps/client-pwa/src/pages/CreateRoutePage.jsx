import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, ChevronLeft, ChevronRight, Hash, HelpCircle } from 'lucide-react';
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

const STYLES = ['Dynamique', 'Physique', 'Technique', 'Résistance'];

export default function CreateRoutePage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('Projet');
    const [styles, setStyles] = useState([]);
    const [holds, setHolds] = useState([]);
    const [selectionMode, setSelectionMode] = useState('handfoot');
    const [isSaving, setIsSaving] = useState(false);
    const [currentWall, setCurrentWall] = useState(null);
    const [loadingWall, setLoadingWall] = useState(true);
    const [showLegend, setShowLegend] = useState(false);


    useEffect(() => {
        async function fetchWall() {
            setLoadingWall(true);
            try {
                // Try active first
                let { data, error } = await supabase
                    .from('walls')
                    .select('*')
                    .eq('is_active', true)
                    .maybeSingle();

                if (!data) {
                    // Fallback to latest
                    const { data: latest } = await supabase
                        .from('walls')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    data = latest;
                }

                if (data) {
                    setCurrentWall(data);
                } else {
                    console.log("No wall found in DB.");
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

    const handleSave = async () => {
        if (!name.trim()) {
            alert("Veuillez donner un nom au bloc !");
            return;
        }
        if (holds.length === 0) {
            alert("Veuillez sélectionner au moins une prise !");
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
                style: styles,
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
            console.error("Error saving route:", err);
            alert("Erreur lors de la sauvegarde : " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateHold = (id, updatedHold, shouldFocus = false) => {
        setHolds(holds.map(h => h.id === id ? updatedHold : h));
        if (shouldFocus) setActiveHoldId(id);
    };

    const handleRemoveHold = (id) => {
        setHolds(holds.filter(h => h.id !== id));
        if (activeHoldId === id) setActiveHoldId(null);
    };

    const toggleStyle = (style) => {
        if (styles.includes(style)) {
            setStyles(styles.filter(s => s !== style));
        } else {
            setStyles([...styles, style]);
        }
    };

    const activeHold = holds.find(h => h.id === activeHoldId);

    // Close inspector when clicking empty space (this needs canvas support, but for now back button works)
    // Or we can add a 'bg' click handler in the Inspector backdrop.


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
                    onClick={() => setShowLegend(true)}
                    className="btn-touch text-zinc-400 mr-2"
                >
                    <HelpCircle size={24} />
                </button>
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
                            wallId={currentWall?.id}
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
                    /* 2. GRADE & STYLE SELECTOR (Default) */
                    <div className="p-4 space-y-6">
                        {/* Difficulty Wheel */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Difficulté</span>
                                <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-md">{grade}</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                {GRADE_COLORS.map((g) => (
                                    <button
                                        key={g.name}
                                        onClick={() => setGrade(g.name)}
                                        className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all snap-center ${grade === g.name
                                            ? 'scale-110 shadow-[0_0_15px_currentColor]'
                                            : 'opacity-50 grayscale scale-90'
                                            }`}
                                        style={{
                                            borderColor: g.hex,
                                            backgroundColor: grade === g.name ? g.hex : 'transparent',
                                            color: grade === g.name ? (g.name === 'Blanc' ? 'black' : 'white') : g.hex,
                                            boxShadow: grade === g.name ? `0 0 15px ${g.hex}60` : 'none'
                                        }}
                                    >
                                        <span className="text-[10px] font-black uppercase">
                                            {g.name.substring(0, 2)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Style Tags */}
                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Style</span>
                                <span className="text-xs font-bold text-zinc-600">{styles.length}/2</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {STYLES.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => toggleStyle(style)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${styles.includes(style)
                                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                            : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                                            }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Legend Modal - Improved Clarity */}
            {showLegend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl space-y-5 relative">
                        <button
                            onClick={() => setShowLegend(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                                Mode d'emploi
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                Comment créer un bloc ?
                            </p>
                        </div>

                        <div className="space-y-4 bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white border border-white/10 shrink-0">1</div>
                                <p className="text-sm text-zinc-300 leading-tight pt-1">
                                    <strong className="text-white block mb-1">Sélectionner</strong>
                                    Appuie sur une prise pour l'ajouter au bloc.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white border border-white/10 shrink-0">2</div>
                                <p className="text-sm text-zinc-300 leading-tight pt-1">
                                    <strong className="text-white block mb-1">Changer la couleur</strong>
                                    Rappuie sur la même prise pour changer son rôle :
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 flex flex-col items-center text-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#32A9D6] shadow-[0_0_12px_#32A9D6]"></div>
                                <div>
                                    <p className="font-bold text-white text-sm">Bleu</p>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Main + Pied</p>
                                </div>
                            </div>
                            <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 flex flex-col items-center text-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#FFD700] shadow-[0_0_12px_#FFD700]"></div>
                                <div>
                                    <p className="font-bold text-white text-sm">Jaune</p>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Pied Seul</p>
                                </div>
                            </div>
                            <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 flex flex-col items-center text-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#00FF00] shadow-[0_0_12px_#00FF00]"></div>
                                <div>
                                    <p className="font-bold text-white text-sm">Vert</p>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Départ</p>
                                </div>
                            </div>
                            <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5 flex flex-col items-center text-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#FF0000] shadow-[0_0_12px_#FF0000]"></div>
                                <div>
                                    <p className="font-bold text-white text-sm">Rouge</p>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Top</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowLegend(false)}
                            className="w-full py-3.5 bg-accent-pink text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
                        >
                            Compris, on grimpe !
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
