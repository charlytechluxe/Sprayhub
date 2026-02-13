import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Check, X } from 'lucide-react';
import { supabase } from './lib/supabase';

interface GradeColor {
    id: string;
    name: string;
    hex: string;
    display_order: number;
    is_active: boolean;
}

export function ConfigView() {
    const [colors, setColors] = useState<GradeColor[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingColor, setEditingColor] = useState<GradeColor | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Default colors matching user request
    const defaultColors: GradeColor[] = [
        { id: '1', name: 'Orange', hex: '#f97316', display_order: 1, is_active: true }, // Très facile
        { id: '2', name: 'Rose', hex: '#ec4899', display_order: 2, is_active: true },   // Facile
        { id: '3', name: 'Vert', hex: '#22c55e', display_order: 3, is_active: true },   // Moyen
        { id: '4', name: 'Jaune', hex: '#eab308', display_order: 4, is_active: true },  // Assez difficile
        { id: '5', name: 'Bleu', hex: '#3b82f6', display_order: 5, is_active: true },   // Difficile
        { id: '6', name: 'Rouge', hex: '#ef4444', display_order: 6, is_active: true },  // Très Difficile
        { id: '7', name: 'Blanc', hex: '#ffffff', display_order: 7, is_active: true },  // Extreme
        { id: '8', name: 'Projet', hex: '#52525b', display_order: 8, is_active: true }, // Premier à faire
    ];

    useEffect(() => {
        fetchColors();

        // Real-time subscription to sync with PWA/Other admins
        const channel = supabase
            .channel('config_colors_realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'gym_config' },
                (payload) => {
                    console.log('Config change detected:', payload);
                    if (payload.new && (payload.new as any).key === 'grade_colors') {
                        setColors((payload.new as any).value);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchColors = async () => {
        try {
            const { data, error } = await supabase
                .from('gym_config')
                .select('value')
                .eq('key', 'grade_colors')
                .single();

            if (error || !data) {
                console.log('No config found or error, using defaults');
                setColors(defaultColors);
            } else {
                // If DB has data, check if it matches our new standard (8 items)
                if (data.value && Array.isArray(data.value) && data.value.length >= 8) {
                    setColors(data.value);
                } else {
                    // Soft migration: DB has old list (e.g. 5 items), force display of new defaults
                    console.log('Old config detected (< 8 colors), using new defaults');
                    setColors(defaultColors);
                }
            }
        } catch (err) {
            console.error('Error fetching colors:', err);
            setColors(defaultColors);
        } finally {
            setLoading(false);
        }
    };

    const saveToDb = async (newColors: GradeColor[]) => {
        try {
            // Check if row exists
            const { data } = await supabase.from('gym_config').select('id').eq('key', 'grade_colors').single();

            if (data) {
                await supabase
                    .from('gym_config')
                    .update({ value: newColors, updated_at: new Date() })
                    .eq('key', 'grade_colors');
            } else {
                await supabase
                    .from('gym_config')
                    .insert({ key: 'grade_colors', value: newColors });
            }
            // Update local state
            setColors(newColors);
        } catch (err) {
            console.error("Error saving to DB:", err);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    const handleSave = async (color: Partial<GradeColor>) => {
        let newColors = [...colors];

        if (color.id) {
            // Update
            newColors = newColors.map(c => c.id === color.id ? { ...c, ...color } as GradeColor : c);
        } else {
            // Create
            const newColor: GradeColor = {
                id: Math.random().toString(36).substr(2, 9),
                name: color.name || 'Nouveau',
                hex: color.hex || '#000000',
                display_order: colors.length + 1,
                is_active: true,
                ...color
            };
            newColors.push(newColor);
        }

        await saveToDb(newColors);
        setEditingColor(null);
        setIsCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette couleur ?')) return;
        const newColors = colors.filter(c => c.id !== id);
        await saveToDb(newColors);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-rose-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Configuration des Couleurs de Grade</h3>
                    <p className="text-sm text-zinc-500 italic">Personnalisez les couleurs de difficulté de votre salle</p>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setEditingColor({
                            id: '',
                            name: '',
                            hex: '#000000',
                            display_order: colors.length + 1,
                            is_active: true
                        });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                >
                    <Plus size={16} />
                    Ajouter une couleur
                </button>
            </div>

            <div className="grid gap-4">
                {colors.map((color, index) => (
                    <div
                        key={color.id}
                        className="bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4 hover:border-zinc-700 transition-colors"
                    >
                        <div className="cursor-move text-zinc-600 hover:text-zinc-400">
                            <GripVertical size={20} />
                        </div>

                        <div
                            className="w-16 h-16 rounded-xl border-2 border-zinc-700 flex-shrink-0 shadow-inner"
                            style={{ backgroundColor: color.hex }}
                        />

                        <div className="flex-1">
                            <p className="font-bold text-white text-lg">{color.name}</p>
                            <p className="text-xs text-zinc-500 font-mono">{color.hex}</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditingColor(color)}
                                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium text-sm"
                            >
                                <Edit size={14} className="inline mr-1" />
                                Modifier
                            </button>
                            <button
                                onClick={() => handleDelete(color.id)}
                                className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors font-medium text-sm"
                            >
                                <Trash2 size={14} className="inline mr-1" />
                                Supprimer
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {editingColor && (
                <ColorEditModal
                    color={editingColor}
                    onSave={handleSave}
                    onClose={() => {
                        setEditingColor(null);
                        setIsCreating(false);
                    }}
                />
            )}
        </div>
    );
}

interface ColorEditModalProps {
    color: Partial<GradeColor>;
    onSave: (color: Partial<GradeColor>) => void;
    onClose: () => void;
}

function ColorEditModal({ color, onSave, onClose }: ColorEditModalProps) {
    const [name, setName] = useState(color.name || '');
    const [hex, setHex] = useState(color.hex || '#000000');

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Le nom est requis');
            return;
        }
        onSave({ ...color, name: name.trim(), hex });
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800 shadow-2xl">
                <h3 className="text-xl font-bold mb-6">
                    {color.id ? 'Modifier la couleur' : 'Nouvelle couleur'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-zinc-400 mb-2 block">
                            Nom
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Orange, Rose, Vert..."
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-zinc-400 mb-2 block">
                            Couleur
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                value={hex}
                                onChange={(e) => setHex(e.target.value)}
                                className="w-20 h-12 rounded-xl border-2 border-zinc-700 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={hex}
                                onChange={(e) => setHex(e.target.value)}
                                placeholder="#000000"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-rose-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div
                        className="w-full h-24 rounded-xl border-2 border-zinc-700"
                        style={{ backgroundColor: hex }}
                    />
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                    >
                        <X size={16} className="inline mr-1" />
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                    >
                        <Check size={16} className="inline mr-1" />
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}
