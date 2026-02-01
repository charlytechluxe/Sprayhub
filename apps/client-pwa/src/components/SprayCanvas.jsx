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
    imageUrl: manualImageUrl,
    wallId,
    holds = [],
    onAddHold,
    onUpdateHold,
    onRemoveHold,
    isEditable = false,
    activeTool = 'handfoot' // Default tool
}) {

    const [allHolds, setAllHolds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wallImageUrl, setWallImageUrl] = useState(manualImageUrl);

    // Fetch ecosystem holds from Supabase & Subscribe to changes
    useEffect(() => {
        let channel;

        const fetchHolds = async () => {
            try {
                setLoading(true);
                let query = supabase.from('walls').select('id, image_url, detection_data');

                if (wallId) {
                    query = query.eq('id', wallId);
                } else {
                    // Fallback to active wall
                    query = query.eq('is_active', true).limit(1);
                }

                const { data: walls, error } = await query;

                if (error) throw error;

                if (!walls || walls.length === 0) {
                    // If no active wall, try the latest one
                    const { data: latest } = await supabase.from('walls').select('*').order('created_at', { ascending: false }).limit(1);
                    if (latest && latest[0]) {
                        const targetWall = latest[0];
                        setAllHolds(targetWall.detection_data || []);
                        setWallImageUrl(manualImageUrl || targetWall.image_url);
                        setupSubscription(targetWall.id);
                    }
                    setLoading(false);
                    return;
                }

                const activeWall = walls[0];
                setAllHolds(activeWall.detection_data || []);
                setWallImageUrl(manualImageUrl || activeWall.image_url);
                console.log(`✅ Loaded ${activeWall.detection_data?.length} holds for wall ${activeWall.id}`);
                setupSubscription(activeWall.id);

            } catch (err) {
                console.error("❌ Error fetching wall data:", err);
            } finally {
                setLoading(false);
            }
        };

        const setupSubscription = (id) => {
            if (channel) supabase.removeChannel(channel);

            channel = supabase
                .channel(`wall_realtime_${id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'walls',
                    filter: `id=eq.${id}`
                }, (payload) => {
                    console.log("🔄 Wall updated in real-time:", payload.new.id);
                    if (payload.new.detection_data) {
                        setAllHolds(payload.new.detection_data);
                    }
                })
                .subscribe();
        };

        fetchHolds();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [wallId, manualImageUrl]);

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
            onAddHold(newHold);
            // DO NOT call onUpdateHold here. onAddHold in parent handles state and focus.
            // if (onUpdateHold) onUpdateHold(newHold.id, newHold, true);
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
                                <img
                                    src={wallImageUrl}
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

                                        // In route mode (not editable), only show selected holds
                                        if (!isEditable && !isSelected) return null;

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
