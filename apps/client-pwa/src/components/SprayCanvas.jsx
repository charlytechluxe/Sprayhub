import React, { useMemo } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import AI_DATA from '../data/holds_final_force.json';

const TYPE_COLORS = {
    start: '#00FF00',    // Vert Fluo
    handfoot: '#00FFFF', // Bleu Cyan
    foot: '#FFD700',     // Jaune
    top: '#FF0000'       // Rouge Fluo
};

const TYPE_CYCLE = ['start', 'handfoot', 'foot', 'top', 'none'];

export default function SprayCanvas({ imageUrl, holds = [], onAddHold, onUpdateHold, onRemoveHold, isEditable = false }) {

    // Create a map for quick lookup of selected holds
    const selectedHoldsMap = useMemo(() => {
        const map = {};
        holds.forEach(h => {
            map[h.id] = h;
        });
        return map;
    }, [holds]);

    const handlePolygonClick = (e, polygon) => {
        e.stopPropagation();
        if (!isEditable) return;

        const existingHold = selectedHoldsMap[polygon.id];

        if (!existingHold) {
            // Calculate center for meta-info
            const centerX = polygon.contour.reduce((sum, p) => sum + p[0], 0) / polygon.contour.length;
            const centerY = polygon.contour.reduce((sum, p) => sum + p[1], 0) / polygon.contour.length;

            onAddHold({
                id: polygon.id,
                x: centerX * 100,
                y: centerY * 100,
                type: 'handfoot',
                note: '',
                contour: polygon.contour
            });
        } else {
            const currentIndex = TYPE_CYCLE.indexOf(existingHold.type);
            const nextIndex = (currentIndex + 1) % TYPE_CYCLE.length;
            const nextType = TYPE_CYCLE[nextIndex];

            if (nextType === 'none') {
                onRemoveHold(existingHold.id);
            } else {
                onUpdateHold(existingHold.id, { ...existingHold, type: nextType });
            }
        }
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden rounded-3xl border border-zinc-900 shadow-2xl">
            <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={8}
                centerOnInit={true}
                limitToBounds={true}
            >
                <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {imageUrl ? (
                            <div className="relative w-full aspect-[3/4]">
                                <img
                                    src={imageUrl}
                                    alt="Spray Wall"
                                    className="w-full h-full object-cover select-none pointer-events-none"
                                />

                                {/* VERSION MARKER TO ENSURE USER IS NOT ON CACHED VERSION */}
                                <div className="absolute top-4 right-4 bg-accent-pink text-white text-[8px] font-black px-2 py-1 rounded italic tracking-widest uppercase z-50 shadow-lg">
                                    AI-CORE V3 ACTIVATED
                                </div>

                                <svg
                                    viewBox="0 0 1000 1333.33"
                                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                                >
                                    {AI_DATA.map((poly) => {
                                        const isSelected = !!selectedHoldsMap[poly.id];
                                        const hold = selectedHoldsMap[poly.id];
                                        const points = poly.contour.map(p => `${p[0] * 1000},${p[1] * 1333.33}`).join(' ');

                                        return (
                                            <polygon
                                                key={poly.id}
                                                points={points}
                                                onClick={(e) => handlePolygonClick(e, poly)}
                                                className="transition-all duration-150 cursor-pointer"
                                                // MODE FANTÔME : INVISIBLE SI NON SÉLECTIONNÉ
                                                fill={isSelected ? `${TYPE_COLORS[hold.type]}22` : "transparent"}
                                                stroke={isSelected ? TYPE_COLORS[hold.type] : "transparent"}
                                                strokeWidth={isSelected ? "2.5" : "0"}
                                                // EFFET NÉON RÉEL SUR LA FORME DE LA PRISE
                                                filter={isSelected ? `drop-shadow(0 0 10px ${TYPE_COLORS[hold.type]})` : "none"}
                                                strokeLinejoin="round"
                                            />
                                        );
                                    })}
                                </svg>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full text-zinc-800 gap-3">
                                <div className="w-10 h-10 rounded-full border border-zinc-900 border-t-accent-pink animate-spin" />
                                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">Initialisation IA...</span>
                            </div>
                        )}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
