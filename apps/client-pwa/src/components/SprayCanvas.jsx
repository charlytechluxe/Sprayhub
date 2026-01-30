import React, { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import SEGMENTED_HOLDS from '../data/holds_segmentation.json';

const TYPE_COLORS = {
    start: '#A4C639',    // Art de la Grimpe Lime Green
    handfoot: '#32A9D6', // Art de la Grimpe Blue
    foot: '#FFD700',     // Art de la Grimpe Yellow
    top: '#FB2056'       // Art de la Grimpe Pink
};

const TYPE_CYCLE = ['start', 'handfoot', 'foot', 'top', 'none'];

export default function SprayCanvas({ imageUrl, holds = [], onAddHold, onUpdateHold, onRemoveHold, isEditable = false }) {

    // Find if a polygon is already selected in the route
    const getHoldForPolygon = (polygonId) => {
        return holds.find(h => h.id === polygonId);
    };

    const handlePolygonClick = (e, polygon) => {
        e.stopPropagation();
        if (!isEditable) return;

        const existingHold = getHoldForPolygon(polygon.id);

        if (!existingHold) {
            // Add new hold using polygon center approx
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
            // Cycle type
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
        <div className="relative w-full h-full bg-black overflow-hidden rounded-3xl">
            <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={10}
                centerOnInit
                limitToBounds={true}
            >
                <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {imageUrl ? (
                            <div className="relative w-full aspect-[3/4]">
                                <img
                                    src={imageUrl}
                                    alt="Wall"
                                    className="w-full h-full object-cover select-none pointer-events-none opacity-80"
                                />
                                <svg
                                    viewBox="0 0 100 133.33" // Coordinate system 0-100 on X, proportional on Y
                                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                                >
                                    {/* Render all detected polygons as interactive zones */}
                                    {SEGMENTED_HOLDS.map((poly) => {
                                        const hold = getHoldForPolygon(poly.id);
                                        const points = poly.contour.map(p => `${p[0] * 100},${p[1] * 133.33}`).join(' ');

                                        return (
                                            <g key={poly.id}>
                                                <polygon
                                                    points={points}
                                                    onClick={(e) => handlePolygonClick(e, poly)}
                                                    className={hold
                                                        ? `hold-neon-${hold.type} cursor-pointer`
                                                        : "hold-poly-base cursor-pointer opacity-20 hover:opacity-50"
                                                    }
                                                    fill={hold ? TYPE_COLORS[hold.type] : "rgba(255,255,255,0.2)"}
                                                    fillOpacity={hold ? 0.4 : 0.1}
                                                />

                                                {/* Start/Top Indicators */}
                                                {hold?.type === 'start' && (
                                                    <circle
                                                        cx={hold.x}
                                                        cy={hold.y * 1.3333}
                                                        r="2"
                                                        fill="none"
                                                        stroke={TYPE_COLORS.start}
                                                        strokeWidth="0.5"
                                                        strokeDasharray="1 0.5"
                                                    />
                                                )}
                                                {hold?.type === 'top' && (
                                                    <circle
                                                        cx={hold.x}
                                                        cy={hold.y * 1.3333}
                                                        r="2"
                                                        fill="none"
                                                        stroke={TYPE_COLORS.top}
                                                        strokeWidth="0.5"
                                                        strokeDasharray="1 0.5"
                                                    />
                                                )}

                                                {/* Note Display */}
                                                {hold?.note && (
                                                    <g transform={`translate(${hold.x}, ${hold.y * 1.3333 + 4})`}>
                                                        <rect
                                                            x="-5" y="-2" width="10" height="4" rx="1"
                                                            fill="rgba(0,0,0,0.8)"
                                                        />
                                                        <text
                                                            className="fill-white text-[2px] font-bold"
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            {hold.note}
                                                        </text>
                                                    </g>
                                                )}
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-zinc-600">
                                Pas de photo chargée
                            </div>
                        )}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
