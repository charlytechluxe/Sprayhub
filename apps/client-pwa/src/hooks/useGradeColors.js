import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Fallback colors matching user request
const FALLBACK_COLORS = [
    { id: '1', name: 'Orange', hex: '#f97316', display_order: 1 },
    { id: '2', name: 'Rose', hex: '#ec4899', display_order: 2 },
    { id: '3', name: 'Vert', hex: '#22c55e', display_order: 3 },
    { id: '4', name: 'Jaune', hex: '#eab308', display_order: 4 },
    { id: '5', name: 'Bleu', hex: '#3b82f6', display_order: 5 },
    { id: '6', name: 'Rouge', hex: '#ef4444', display_order: 6 },
    { id: '7', name: 'Blanc', hex: '#ffffff', display_order: 7 },
    { id: '8', name: 'Projet', hex: '#52525b', display_order: 8 },
];

export function useGradeColors() {
    const [colors, setColors] = useState(FALLBACK_COLORS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchColors() {
            try {
                // Fetch from Supabase gym_config
                const { data, error } = await supabase
                    .from('gym_config')
                    .select('value')
                    .eq('key', 'grade_colors')
                    .single();

                if (error) throw error;

                if (data && data.value && Array.isArray(data.value)) {
                    // Force use of fallback if DB has old/incomplete list (less than 8 items)
                    // This creates a "soft migration" to the new colors
                    if (data.value.length < 8) {
                        console.log("Old config detected, using new defaults");
                        setColors(FALLBACK_COLORS);
                    } else {
                        setColors(data.value);
                    }
                } else {
                    setColors(FALLBACK_COLORS);
                }
            } catch (err) {
                console.error('Error fetching grade colors:', err);
                setColors(FALLBACK_COLORS);
            } finally {
                setLoading(false);
            }
        }

        fetchColors();

        // Subscribe to changes
        const channel = supabase
            .channel('grade_colors_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'gym_config'
            }, (payload) => {
                if (payload.new && payload.new.key === 'grade_colors') {
                    const newColors = payload.new.value;
                    // Only accept if it looks like a full list
                    if (newColors && newColors.length >= 8) {
                        setColors(newColors);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { colors, loading };
}

// Helper to get hex color by name
export function getGradeHex(gradeName, colors) {
    const color = colors.find(c => c.name === gradeName);
    return color?.hex || '#a1a1aa'; // Default to grey if not found
}
