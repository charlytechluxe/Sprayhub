import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Fallback colors if database is not available
const FALLBACK_COLORS = [
    { name: 'Orange', hex: '#FF8C00' },
    { name: 'Rose', hex: '#FF00FF' },
    { name: 'Vert', hex: '#A4C639' },
    { name: 'Jaune', hex: '#FFD700' },
    { name: 'Bleu', hex: '#32A9D6' },
    { name: 'Rouge', hex: '#FF0000' },
    { name: 'Blanc', hex: '#ffffff' },
    { name: 'Projet', hex: '#a1a1aa' },
];

export function useGradeColors() {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchColors() {
            try {
                // Try cache first
                const cached = localStorage.getItem('grade_colors');
                const cachedTime = localStorage.getItem('grade_colors_time');
                const now = Date.now();

                // Use cache if less than 1 hour old
                if (cached && cachedTime && (now - parseInt(cachedTime)) < 3600000) {
                    setColors(JSON.parse(cached));
                    setLoading(false);
                    return;
                }

                // Fetch from Supabase
                const { data, error } = await supabase
                    .from('grade_colors')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order');

                if (error) throw error;

                if (data && data.length > 0) {
                    setColors(data);
                    localStorage.setItem('grade_colors', JSON.stringify(data));
                    localStorage.setItem('grade_colors_time', now.toString());
                } else {
                    // Use fallback if no colors in database
                    setColors(FALLBACK_COLORS);
                }
            } catch (err) {
                console.error('Error fetching grade colors:', err);
                // Use fallback on error
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
                table: 'grade_colors'
            }, () => {
                // Invalidate cache and refetch
                localStorage.removeItem('grade_colors');
                localStorage.removeItem('grade_colors_time');
                fetchColors();
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
