import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Save, Trash2, PenTool, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface SurgicalEditorProps {
    onBack?: () => void;
}

export function SurgicalEditor({ onBack }: SurgicalEditorProps) {
    const [wall, setWall] = useState<any>(null);
    const [holds, setHolds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedHoldId, setSelectedHoldId] = useState<string | null>(null);
    const [mode, setMode] = useState<'select' | 'draw' | 'delete'>('select');
    const [tempPoints, setTempPoints] = useState<any[]>([]); // For drawing new polygon

    useEffect(() => {
        const fetchWall = async () => {
            setLoading(true);
            const { data: activeWall } = await supabase.from('walls').select('*').eq('is_active', true).maybeSingle();
            if (activeWall) {
                setWall(activeWall);

                // Check for local draft first
                const savedDraft = localStorage.getItem(`draft_holds_${activeWall.id}`);
                if (savedDraft) {
                    const confirmRestore = window.confirm("J'ai trouvé une sauvegarde locale automatique. Voulez-vous la restaurer pour ne pas perdre votre travail ?");
                    if (confirmRestore) {
                        setHolds(JSON.parse(savedDraft));
                        setLoading(false);
                        return;
                    }
                }

                setHolds(activeWall.detection_data || []);
            }
            setLoading(false);
        };
        fetchWall();
    }, []);

    // Auto-save to localStorage on every change
    useEffect(() => {
        if (wall && holds.length > 0) {
            localStorage.setItem(`draft_holds_${wall.id}`, JSON.stringify(holds));
        }
    }, [holds, wall]);

    const handleSave = async () => {
        if (!wall) return;
        const confirm = window.confirm(`Sauvegarder les ${holds.length} prises ? (Cela écrasera la version en base)`);
        if (!confirm) return;

        const { error } = await supabase
            .from('walls')
            .update({ detection_data: holds })
            .eq('id', wall.id);

        if (error) alert("Erreur sauvegarde: " + error.message);
        else {
            alert("✅ Mur sauvegardé avec succès !");
            localStorage.removeItem(`draft_holds_${wall.id}`); // Clear draft after successful cloud save
        }
    };

    const handleClearAll = () => {
        if (window.confirm("Voulez-vous vraiment TOUT supprimer et recommencer de zéro ?")) {
            setHolds([]);
            setSelectedHoldId(null);
        }
    };

    const handleDelete = () => {
        if (!selectedHoldId) return;
        setHolds(prev => prev.filter(h => h.id !== selectedHoldId));
        setSelectedHoldId(null);
    };

    const finishDrawing = () => {
        if (tempPoints.length < 3) {
            alert("Il faut au moins 3 points pour faire une prise.");
            return;
        }
        const newHold = {
            id: `manual_${Date.now()}`,
            contour: tempPoints,
            type: 'handfoot' // default
        };
        setHolds(prev => [...prev, newHold]);
        setTempPoints([]);
        setMode('select');
    };

    const cancelDrawing = () => {
        setTempPoints([]);
        setMode('select');
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (mode === 'draw') {
            // Calculate coords relative to image
            const rect = e.currentTarget.getBoundingClientRect(); // use currentTarget for the wrapper
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            setTempPoints(prev => [...prev, [x, y]]);
        } else {
            setSelectedHoldId(null);
        }
    };

    const handleHoldClick = (e: React.MouseEvent, holdId: string) => {
        e.stopPropagation();
        if (mode === 'delete') {
            setHolds(prev => prev.filter(h => h.id !== holdId));
        } else if (mode === 'select') {
            setSelectedHoldId(holdId);
        }
    };

    if (loading) return <div className="p-10 text-white">Chargement...</div>;

    return (
        <div className="h-screen flex flex-col bg-zinc-950 text-white">
            {/* Header */}
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md z-50">
                <button onClick={onBack} className="p-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-accent-pink uppercase tracking-widest">Éditeur Chirurgical</span>
                    <span className="text-xs text-zinc-500">{holds.length} prises</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleClearAll} className="bg-zinc-800 text-red-500 px-3 py-2 rounded-full border border-red-500/20 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={16} />
                    </button>
                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-green-500 transition-all shadow-[0_0_15px_rgba(22,163,74,0.4)]">
                        <Save size={16} /> Sauver
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-center gap-4 relative">
                {mode === 'draw' ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
                        <span className="text-xs font-bold text-blue-400 mr-2">Points: {tempPoints.length}</span>
                        <button onClick={finishDrawing} className="bg-green-500 text-black px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <CheckCircle size={14} /> Valider
                        </button>
                        <button onClick={cancelDrawing} className="bg-zinc-700 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <XCircle size={14} /> Annuler
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => setMode('select')}
                            className={`px-4 py-1 rounded-full text-xs font-bold uppercase transition-all ${mode === 'select' ? 'bg-white text-black' : 'text-zinc-500'}`}
                        >
                            Sélection
                        </button>
                        <button
                            onClick={() => setMode('draw')}
                            className="px-4 py-1 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-2 text-zinc-500 bg-zinc-800"
                        >
                            <PenTool size={14} /> Détourer (Stylo)
                        </button>
                        <button
                            onClick={() => setMode('delete')}
                            className={`px-4 py-1 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-2 ${mode === 'delete' ? 'bg-red-500 text-white' : 'text-zinc-500 bg-zinc-800'}`}
                        >
                            <Trash2 size={14} /> Gomme
                        </button>
                    </>
                )}
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-hidden relative cursor-crosshair">
                <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={8}
                    disabled={mode === 'draw'} // Disable zoom/pan while drawing to avoid conflict
                >
                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {wall && (
                                <div className="relative w-full aspect-[3/4]" onClick={handleCanvasClick}>
                                    <img
                                        src={wall.image_url}
                                        className="w-full h-full object-cover pointer-events-none select-none"
                                        alt="Wall"
                                    />
                                    <svg viewBox="0 0 1000 1333.33" className="absolute inset-0 w-full h-full overflow-visible">
                                        {/* Existing Holds */}
                                        {holds.map((h: any) => {
                                            const pts = h.contour || h.geometry;
                                            if (!pts || !Array.isArray(pts)) return null;

                                            const points = pts.map((p: any) => `${p[0] * 1000},${p[1] * 1333.33}`).join(' ');
                                            const isSelected = selectedHoldId === h.id;
                                            return (
                                                <polygon
                                                    key={h.id}
                                                    points={points}
                                                    fill={isSelected ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 255, 0, 0.1)"}
                                                    stroke={isSelected ? "red" : "#00FF00"}
                                                    strokeWidth={isSelected ? 3 : 1}
                                                    onClick={(e) => handleHoldClick(e, h.id)}
                                                    className="transition-colors cursor-pointer hover:fill-blue-500/50"
                                                />
                                            );
                                        })}

                                        {/* Drawing Preview */}
                                        {tempPoints.length > 0 && (
                                            <>
                                                <polyline
                                                    points={tempPoints.map(p => `${p[0] * 1000},${p[1] * 1333.33}`).join(' ')}
                                                    fill="none"
                                                    stroke="#0099FF"
                                                    strokeWidth="2"
                                                    strokeDasharray="5,5"
                                                />
                                                {tempPoints.map((p, i) => (
                                                    <circle
                                                        key={i}
                                                        cx={p[0] * 1000}
                                                        cy={p[1] * 1333.33}
                                                        r={4}
                                                        fill="#0099FF"
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </svg>
                                </div>
                            )}
                        </div>
                    </TransformComponent>
                </TransformWrapper>

                {/* Info Overlay */}
                {mode === 'draw' && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur text-white px-6 py-3 rounded-2xl shadow-xl text-center z-10 pointer-events-none">
                        <p className="font-bold text-sm mb-1">Mode Stylo Actif 🖊️</p>
                        <p className="text-xs opacity-80">Clique point par point pour entourer la prise.<br />Clique "Valider" en haut quand c'est fini.</p>
                    </div>
                )}
                {mode === 'delete' && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full shadow-xl text-sm font-bold animate-pulse z-10 pointer-events-none">
                        Clique sur une prise pour la supprimer
                    </div>
                )}
            </div>
        </div>
    );
}
