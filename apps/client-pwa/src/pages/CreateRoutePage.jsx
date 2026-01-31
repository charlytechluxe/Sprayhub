import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import SprayCanvas from '../components/SprayCanvas';
import { supabase } from '../lib/supabase';

const GRADE_COLORS = [
    { name: 'Vert', hex: '#A4C639' },
    { name: 'Bleu', hex: '#32A9D6' },
    { name: 'Jaune', hex: '#FFD700' },
    { name: 'Rouge', hex: '#FB2056' },
    { name: 'Rose', hex: '#FB2056' },
    { name: 'Orange', hex: '#FF8C00' },
    { name: 'Blanc', hex: '#ffffff' },
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
                const { data, error } = await supabase.from('walls').select('*').limit(1).single();
                if (data) {
                    setCurrentWall(data);
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
        setHolds([...holds, hold]);
    };

    const handleUpdateHold = (id, updatedHold) => {
        setHolds(holds.map(h => h.id === id ? updatedHold : h));
    };

    const handleRemoveHold = (id) => {
        setHolds(holds.filter(h => h.id !== id));
    };

    const handleSave = async () => {
        if (!name) {
            alert("Donnez un nom au bloc !");
            return;
        }
        setIsSaving(true);

        try {
            if (!supabase) {
                console.log('Saving route (Demo):', { name, grade, holds });
                await new Promise(r => setTimeout(r, 800));
                alert("Mode Démo: Bloc pseudo-sauvegardé !");
                navigate('/routes');
                return;
            }

            const wallId = currentWall?.id;
            if (!wallId) throw new Error("Impossible de trouver le Mur principal.");

            const { error: insertError } = await supabase
                .from('routes')
                .insert({
                    name,
                    grade,
                    holds,
                    wall_id: wallId,
                });

            if (insertError) throw insertError;
            navigate('/routes');

        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
            alert(`Erreur de sauvegarde: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-4 border-b border-zinc-900">
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
                    <SprayCanvas
                        imageUrl={imageUrl}
                        holds={holds}
                        onAddHold={handleAddHold}
                        onUpdateHold={handleUpdateHold}
                        onRemoveHold={handleRemoveHold}
                        isEditable={true}
                        activeTool={selectionMode}
                    />
                )}
            </div>

            {/* Footer with Tools */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
                    {GRADE_COLORS.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => setGrade(c.name)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${grade === c.name
                                ? 'bg-white text-black border-white'
                                : 'bg-zinc-800 text-zinc-400 border-transparent'
                                }`}
                            style={{ color: grade === c.name ? 'black' : c.hex }}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: 'start', label: 'Start', color: 'bg-accent-green', border: 'border-accent-green' },
                        { id: 'handfoot', label: 'Main', color: 'bg-accent-blue', border: 'border-accent-blue' },
                        { id: 'foot', label: 'Pied', color: 'bg-accent-yellow', border: 'border-accent-yellow' },
                        { id: 'top', label: 'Top', color: 'bg-accent-red', border: 'border-accent-red' }
                    ].map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setSelectionMode(tool.id)}
                            className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${selectionMode === tool.id
                                ? `bg-zinc-800 ${tool.border} text-white`
                                : 'border-transparent text-zinc-500 hover:bg-zinc-800/50'
                                }`}
                        >
                            <span className={`w-3 h-3 rounded-full ${tool.color} mb-1 shadow-[0_0_8px_currentColor]`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
