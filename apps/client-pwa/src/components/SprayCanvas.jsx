import React, { useMemo } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import AI_DATA from '../data/holds_final_force.json';

const TYPE_COLORS = {
    start: '#00FF00',    // Neon Green
    handfoot: '#00FFFF', // Cyan Blue
    foot: '#FFD700',     // Neon Yellow
    top: '#FF0000'       // Neon Red
};

const TYPE_CYCLE = ['start', 'handfoot', 'foot', 'top', 'none'];

/**
 * SprayCanvas: Professional Minimalist Rendering (Stōkt/Crux Style)
 * - Transparent Fill
 * - 1px Stroke with Dynamic Colors
 * - Neon Glow Filter on Selection
 */
export default function SprayCanvas({ imageUrl, holds = [], onAddHold, onUpdateHold, onRemoveHold, isEditable = false }) {

    // Quick lookup for selected holds
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
            // Find center for placement logic
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

                                <svg
                                    viewBox="0 0 1000 1333.33"
                                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none overflow-visible"
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
                                                className="transition-all duration-100 cursor-pointer"
                                                // Minimalist Pro Style: 1px wireframe
                                                fill="transparent" // Transparent but CLICKABLE
                                                pointerEvents="all" // Captures clicks everywhere inside
                                                stroke={isSelected ? TYPE_COLORS[hold.type] : "rgba(255,255,255,0.15)"}
                                                strokeWidth="1"
                                                // High-Visibility Neon Glow only when selected
                                                filter={isSelected ? `drop-shadow(0 0 8px ${TYPE_COLORS[hold.type]})` : "none"}
                                                strokeLinejoin="round"
                                                vectorEffect="non-scaling-stroke"
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
