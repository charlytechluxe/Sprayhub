import React, { useMemo, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { supabase } from '../lib/supabase';
import AI_DATA from '../data/holds_final_force.json'; // Reactivated for 'AI' data

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
    const [imageLoaded, setImageLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Fetch ecosystem holds from Supabase OR use local AI Data
    useEffect(() => {
        const fetchHolds = async () => {
            try {
                // Fetch Wall with detection_data
                const { data: walls, error } = await supabase
                    .from('walls')
                    .select('id, detection_data')
                    .limit(1);

                let detectionData = [];

                if (!error && walls && walls.length > 0 && walls[0].detection_data && walls[0].detection_data.length > 0) {
                    detectionData = walls[0].detection_data;
                    console.log(`✅ Loaded ${detectionData.length} holds from Supabase`);
                } else {
                    console.warn("⚠️ No wall found in DB or empty data. Fallback to AI_DATA (Local JSON).");
                    detectionData = AI_DATA;
                }

                setAllHolds(detectionData);

            } catch (err) {
                console.error("❌ Error fetching holds:", err);
                // Last ditch fallback
                setAllHolds(AI_DATA);
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

    // Interaction Logic
    const [longPressTimer, setLongPressTimer] = useState(null);
    const [isLongPress, setIsLongPress] = useState(false);

    // Color Cycle Order: Blue (Hand) -> Yellow (Foot) -> Green (Start) -> Red (Top)
    const CYCLE_ORDER = ['handfoot', 'foot', 'start', 'top'];

    const handleTouchStart = (e, polygon) => {
        setIsLongPress(false);
        const timer = setTimeout(() => {
            setIsLongPress(true);
            handleLongPress(polygon);
        }, 500); // 500ms for long press
        setLongPressTimer(timer);
    };

    const handleTouchEnd = (e, polygon) => {
        if (longPressTimer) clearTimeout(longPressTimer);
    };

    const handleLongPress = (polygon) => {
        if (selectedHoldsMap[polygon.id]) {
            // Vibro-tactile feedback
            if (window.navigator.vibrate) window.navigator.vibrate(50);
            onRemoveHold(polygon.id);
        }
    };

    const handlePolygonClick = (e, polygon) => {
        e.stopPropagation();
        if (!isEditable) return;
        if (isLongPress) return; // Ignore click if it was a long press

        const existingHold = selectedHoldsMap[polygon.id];

        if (!existingHold) {
            // New selection: Default to 'handfoot' (Blue)
            const newHold = {
                id: polygon.id,
                x: polygon.x || 0,
                y: polygon.y || 0,
                type: 'handfoot',
                note: '',
                contour: polygon.contour
            };
            onAddHold(newHold);
            // Notify parent to show inspector
            if (onUpdateHold) onUpdateHold(newHold.id, newHold, true); // true = focused
        } else {
            // Existing selection: Cycle Type
            const currentIndex = CYCLE_ORDER.indexOf(existingHold.type);
            const nextIndex = (currentIndex + 1) % CYCLE_ORDER.length;
            const nextType = CYCLE_ORDER[nextIndex];

            const updatedHold = { ...existingHold, type: nextType };
            onUpdateHold(existingHold.id, updatedHold, true); // true = focused
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
                                {!imageLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                        <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-accent-pink animate-spin" />
                                    </div>
                                )}
                                <img
                                    src={hasError ? "/wall_v1.jpg" : imageUrl}
                                    alt="Spray Wall"
                                    className="w-full h-full object-cover select-none pointer-events-none"
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => {
                                        if (!hasError) {
                                            setHasError(true);
                                            setImageLoaded(false); // Reset to show spinner while fallback loads, or keep true if fallback is instant. 
                                            // Actually, if we switch src, we should wait for onLoad again.
                                            // But safe to just setHasError and let the new src trigger onLoad.
                                        }
                                    }}
                                    loading="eager"
                                    style={{ opacity: imageLoaded ? 1 : 0 }}
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
                                                onTouchStart={(e) => handleTouchStart(e, poly)}
                                                onTouchEnd={(e) => handleTouchEnd(e, poly)}
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
