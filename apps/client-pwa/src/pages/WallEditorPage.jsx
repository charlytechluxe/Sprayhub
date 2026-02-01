import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Save, Trash2, PenTool, AlertTriangle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WallEditorPage() {
    const navigate = useNavigate();
    const [wall, setWall] = useState(null);
    const [holds, setHolds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHoldId, setSelectedHoldId] = useState(null);
    const [mode, setMode] = useState('select'); // 'select', 'draw', 'delete'
    const [tempPoints, setTempPoints] = useState([]); // For drawing new polygon

    useEffect(() => {
        const fetchWall = async () => {
            const { data: walls } = await supabase.from('walls').select('*').limit(1);
            if (walls && walls.length > 0) {
                setWall(walls[0]);
                setHolds(walls[0].detection_data || []);
            }
            setLoading(false);
        };
        fetchWall();
    }, []);

    const handleSave = async () => {
        if (!wall) return;
        const confirm = window.confirm(`Sauvegarder les ${holds.length} prises ?`);
        if (!confirm) return;

        const { error } = await supabase
            .from('walls')
            .update({ detection_data: holds })
            .eq('id', wall.id);

        if (error) alert("Erreur sauvegarde: " + error.message);
        else alert("✅ Mur sauvegardé avec succès !");
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

    const handleCanvasClick = (e) => {
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

    const handleHoldClick = (e, holdId) => {
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
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-black z-50">
                <button onClick={() => navigate('/')} className="p-2 text-zinc-400">
                    <ArrowLeft />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-accent-pink uppercase tracking-widest">Éditeur Chirurgical</span>
                    <span className="text-xs text-zinc-500">{holds.length} prises</span>
                </div>
                <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                    <Save size={16} /> Sauver
                </button>
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
                            className={`px-4 py-1 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-2 ${mode === 'draw' ? 'bg-blue-500 text-white' : 'text-zinc-500 bg-zinc-800'}`}
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
                    <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full">
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
                                        {holds.map(h => {
                                            const points = (h.contour || h.geometry).map(p => `${p[0] * 1000},${p[1] * 1333.33}`).join(' ');
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
