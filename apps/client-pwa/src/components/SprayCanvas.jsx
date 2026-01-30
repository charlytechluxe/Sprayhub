import React, { useMemo } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import SEGMENTED_HOLDS from '../data/holds_segmentation.json';

const TYPE_COLORS = {
    start: '#A4C639',    // Green
    handfoot: '#32A9D6', // Blue
    foot: '#FFD700',     // Yellow
    top: '#FB2056'       // Pink
};

const TYPE_CYCLE = ['start', 'handfoot', 'foot', 'top', 'none'];

export default function SprayCanvas({ imageUrl, holds = [], onAddHold, onUpdateHold, onRemoveHold, isEditable = false }) {

    // Create a map for quick lookup of selected holds by their polygon ID
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
            // Calculate center for meta-info (like where to show notes)
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
            // Cycle through types: Start -> Main -> Foot -> Top -> Remove
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
        <div className="relative w-full h-full bg-zinc-950 overflow-hidden rounded-3xl border border-zinc-900 shadow-2xl">
            <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={8}
                centerOnInit={true}
                limitToBounds={true}
                wheel={{ step: 0.2 }}
            >
                <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {imageUrl ? (
                            <div className="relative w-full aspect-[3/4]">
                                <img
                                    src={imageUrl}
                                    alt="Spray Wall"
                                    className="w-full h-full object-cover select-none pointer-events-none opacity-70"
                                />
                                <svg
                                    // Use a high-density coordinate system (0-1000) to avoid any jitter
                                    viewBox="0 0 1000 1333.33"
                                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                                >
                                    {SEGMENTED_HOLDS.map((poly) => {
                                        const hold = selectedHoldsMap[poly.id];
                                        // Formula: X_pixel = X_% * 1000, Y_pixel = Y_% * 1333.33
                                        const points = poly.contour.map(p => `${p[0] * 1000},${p[1] * 1333.33}`).join(' ');

                                        return (
                                            <polygon
                                                key={poly.id}
                                                points={points}
                                                onClick={(e) => handlePolygonClick(e, poly)}
                                                className={`
                                                    transition-all duration-200 cursor-pointer
                                                    ${hold ? `hold-neon-${hold.type}` : "fill-white/5 hover:fill-white/20"}
                                                `}
                                                fill={hold ? TYPE_COLORS[hold.type] : "transparent"}
                                                fillOpacity={hold ? 0.4 : 0.05}
                                                stroke={hold ? TYPE_COLORS[hold.type] : "rgba(255,255,255,0.1)"}
                                                strokeWidth={hold ? 4 : 0.5}
                                                strokeLinejoin="round"
                                            />
                                        );
                                    })}
                                </svg>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full text-zinc-700 gap-2">
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-800 animate-pulse" />
                                <span className="font-medium text-sm">Chargement du mur...</span>
                            </div>
                        )}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
