import React, { useState } from 'react';
import { X } from 'lucide-react';

const GRADE_COLORS = [
    { name: 'Orange', hex: '#FF8C00' },
    { name: 'Rose', hex: '#FF00FF' },
    { name: 'Vert', hex: '#A4C639' },
    { name: 'Jaune', hex: '#FFD700' },
    { name: 'Bleu', hex: '#32A9D6' },
    { name: 'Rouge', hex: '#FF0000' },
    { name: 'Blanc', hex: '#ffffff' },
    { name: 'Projet', hex: '#a1a1aa' },
];

const STYLES = ['Dynamique', 'Physique', 'Technique', 'Résistance'];

export default function FilterModal({ isOpen, onClose, filters, onApplyFilters }) {
    const [localFilters, setLocalFilters] = useState(filters);

    if (!isOpen) return null;

    const toggleGrade = (grade) => {
        const newGrades = localFilters.grades.includes(grade)
            ? localFilters.grades.filter(g => g !== grade)
            : [...localFilters.grades, grade];
        setLocalFilters({ ...localFilters, grades: newGrades });
    };

    const toggleStyle = (style) => {
        const newStyles = localFilters.styles.includes(style)
            ? localFilters.styles.filter(s => s !== style)
            : [...localFilters.styles, style];
        setLocalFilters({ ...localFilters, styles: newStyles });
    };

    const resetFilters = () => {
        const emptyFilters = { grades: [], styles: [], author: '' };
        setLocalFilters(emptyFilters);
        onApplyFilters(emptyFilters);
        onClose();
    };

    const applyFilters = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end animate-in fade-in duration-200">
            <div className="bg-surface w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black">Filtres</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filter by Grade */}
                <div className="mb-6">
                    <label className="text-sm font-bold text-zinc-400 mb-3 block uppercase tracking-wide">
                        Difficulté
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {GRADE_COLORS.map(grade => (
                            <button
                                key={grade.name}
                                onClick={() => toggleGrade(grade.name)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${localFilters.grades.includes(grade.name)
                                        ? 'bg-white text-black scale-105 shadow-lg'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                                style={{
                                    color: localFilters.grades.includes(grade.name) ? 'black' : grade.hex
                                }}
                            >
                                {grade.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter by Style */}
                <div className="mb-6">
                    <label className="text-sm font-bold text-zinc-400 mb-3 block uppercase tracking-wide">
                        Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {STYLES.map(style => (
                            <button
                                key={style}
                                onClick={() => toggleStyle(style)}
                                className={`py-3 rounded-xl text-sm font-bold transition-all ${localFilters.styles.includes(style)
                                        ? 'bg-accent-pink text-white shadow-[0_0_15px_rgba(255,0,85,0.3)]'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter by Author */}
                <div className="mb-6">
                    <label className="text-sm font-bold text-zinc-400 mb-3 block uppercase tracking-wide">
                        Auteur
                    </label>
                    <input
                        type="text"
                        placeholder="Nom d'utilisateur..."
                        value={localFilters.author}
                        onChange={(e) => setLocalFilters({ ...localFilters, author: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-accent-pink transition-colors"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                    <button
                        onClick={resetFilters}
                        className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                    >
                        Réinitialiser
                    </button>
                    <button
                        onClick={applyFilters}
                        className="flex-1 py-3 bg-accent-pink text-white rounded-xl font-bold shadow-[0_0_20px_rgba(255,0,85,0.3)] hover:bg-accent-pink/90 transition-all"
                    >
                        Appliquer
                    </button>
                </div>

                {/* Active Filters Count */}
                {(localFilters.grades.length > 0 || localFilters.styles.length > 0 || localFilters.author) && (
                    <div className="mt-4 text-xs text-zinc-500 text-center">
                        {localFilters.grades.length + localFilters.styles.length + (localFilters.author ? 1 : 0)} filtre(s) actif(s)
                    </div>
                )}
            </div>
        </div>
    );
}
