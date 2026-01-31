import React, { useMemo, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { supabase } from '../lib/supabase';
// import AI_DATA from '../data/holds_final_force.json'; // DEPRECATED: Cloud First

const TYPE_COLORS = {
    start: '#00FF00',    // Neon Green
    handfoot: '#32A9D6', // Cyan Blue (Standard)
    foot: '#FFD700',     // Neon Yellow
    top: '#FF0000'       // Neon Red
};

/**
 * SprayCanvas: Cloud-Connected & Paint-Mode Ready
 */
export default function SprayCanvas({
    imageUrl,
    holds = [],
    onAddHold,
    onUpdateHold,
    onRemoveHold,
    isEditable = false,
    activeTool = 'handfoot' // Default tool
}) {

    const [allHolds, setAllHolds] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch ecosystem holds from Supabase
    useEffect(() => {
        const fetchHolds = async () => {
            try {
                // 1. Get Wall ID (assuming single wall for now or passed as prop)
                const { data: walls } = await supabase.from('walls').select('id').limit(1);
                if (!walls || walls.length === 0) {
                    setLoading(false);
                    return;
                }
                const wallId = walls[0].id;

                // 2. Fetch Holds
                const { data, error } = await supabase
                    .from('holds')
                    .select('id, contour, x, y')
                    .eq('wall_id', wallId);

                if (error) throw error;

                // Format for render
                setAllHolds(data || []);
            } catch (err) {
                console.error("Error loading holds from Cloud:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHolds();
    }, []);

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
            // New selection: Use current Active Tool
            onAddHold({
                id: polygon.id,
                x: polygon.x || 0, // Fallback if computed elsewhere
                y: polygon.y || 0,
                type: activeTool, // <--- MAGIC: Uses the selected tool
                note: '',
                contour: polygon.contour
            });
        } else {
            // Existing selection management
            if (existingHold.type !== activeTool) {
                // Repaint with new tool
                onUpdateHold(existingHold.id, { ...existingHold, type: activeTool });
            } else {
                // Toggle off if same tool
                onRemoveHold(existingHold.id);
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
                                    {!loading && allHolds.map((poly) => {
                                        const hold = selectedHoldsMap[poly.id];
                                        const isSelected = !!hold;

                                        // Standardize points string
                                        const points = poly.contour.map(p => `${p[0] * 1000},${p[1] * 1333.33}`).join(' ');

                                        return (
                                            <polygon
                                                key={poly.id}
                                                points={points}
                                                onClick={(e) => handlePolygonClick(e, poly)}
                                                className="transition-all duration-100 cursor-pointer"
                                                fill="transparent"
                                                pointerEvents="all"
                                                stroke={isSelected ? TYPE_COLORS[hold.type] : "rgba(255,255,255,0.15)"}
                                                strokeWidth={isSelected ? "2" : "1"}
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
