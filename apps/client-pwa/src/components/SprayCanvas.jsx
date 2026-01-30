import React, { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const TYPE_COLORS = {
    start: '#A4C639',    // Art de la Grimpe Lime Green
    handfoot: '#32A9D6', // Art de la Grimpe Blue
    foot: '#FFD700',     // Art de la Grimpe Yellow
    top: '#FB2056'       // Art de la Grimpe Pink
};

const TYPE_CYCLE = ['start', 'handfoot', 'foot', 'top', 'none'];

export default function SprayCanvas({ imageUrl, holds = [], onAddHold, onUpdateHold, onRemoveHold, isEditable = false }) {
    const [activeHoldId, setActiveHoldId] = useState(null);

    const handleCanvasClick = (e) => {
        if (!isEditable) return;

        // Get coordinates relative to the SVG container
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();

        // Calculate click position as percentage of width/height
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        if (onAddHold) {
            const newHold = {
                id: Math.random().toString(36).substr(2, 9),
                x,
                y,
                type: 'handfoot',
                note: ''
            };
            onAddHold(newHold);
        }
    };

    const handleHoldClick = (e, hold) => {
        e.stopPropagation();
        if (!isEditable) return;

        const currentIndex = TYPE_CYCLE.indexOf(hold.type);
        const nextIndex = (currentIndex + 1) % TYPE_CYCLE.length;
        const nextType = TYPE_CYCLE[nextIndex];

        if (nextType === 'none') {
            onRemoveHold(hold.id);
        } else {
            onUpdateHold(hold.id, { ...hold, type: nextType });
        }
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden rounded-3xl">
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={10}
                centerOnInit
                limitToBounds={false}
            >
                <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {imageUrl ? (
                            <div className="relative w-full aspect-[3/4]">
                                <img
                                    src={imageUrl}
                                    alt="Wall"
                                    className="w-full h-full object-cover select-none pointer-events-none"
                                />
                                <svg
                                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                                    onClick={handleCanvasClick}
                                >
                                    {holds.map((hold) => (
                                        <g
                                            key={hold.id}
                                            onClick={(e) => handleHoldClick(e, hold)}
                                            className="cursor-pointer transition-transform active:scale-125"
                                        >
                                            {/* Invisible bigger hit area for touch */}
                                            <circle
                                                cx={`${hold.x}%`}
                                                cy={`${hold.y}%`}
                                                r="24"
                                                fill="transparent"
                                                className="pointer-events-auto"
                                            />

                                            <circle
                                                cx={`${hold.x}%`}
                                                cy={`${hold.y}%`}
                                                r="12"
                                                fill="transparent"
                                                stroke={TYPE_COLORS[hold.type]}
                                                strokeWidth="3"
                                                className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                            />
                                            {hold.type === 'start' && (
                                                <circle cx={`${hold.x}%`} cy={`${hold.y}%`} r="16" fill="transparent" stroke={TYPE_COLORS.start} strokeWidth="1" strokeDasharray="4 2" />
                                            )}
                                            {hold.type === 'top' && (
                                                <circle cx={`${hold.x}%`} cy={`${hold.y}%`} r="16" fill="transparent" stroke={TYPE_COLORS.top} strokeWidth="1" strokeDasharray="4 2" />
                                            )}

                                            {/* Annotation/Note Display */}
                                            {hold.note && (
                                                <g transform={`translate(0, 20)`}>
                                                    <rect
                                                        x={`${hold.x}%`}
                                                        y={`${hold.y}%`}
                                                        width="auto"
                                                        height="14"
                                                        rx="4"
                                                        fill="rgba(0,0,0,0.6)"
                                                        className="backdrop-blur-sm"
                                                    />
                                                    <text
                                                        x={`${hold.x}%`}
                                                        y={`${hold.y + 3}%`}
                                                        className="fill-white text-[8px] font-bold"
                                                        textAnchor="middle"
                                                    >
                                                        {hold.note}
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    ))}
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
