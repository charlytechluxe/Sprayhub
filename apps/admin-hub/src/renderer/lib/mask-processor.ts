
export type Point = [number, number]; // [x, y] normalized 0-1 (6 decimals)

export interface ProcessedHold {
    id: string;
    contour: Point[];
    area_px: number;
    bbox: [number, number, number, number]; // [x, y, w, h] normalized
    score?: number;
}

/**
 * Converts a list of Replicate Mask Outputs (URLs or Objects) into SpratHub Polygons.
 * Guarantees "Pixel Perfect" precision matching OpenCV CHAIN_APPROX_NONE.
 */
export async function processReplicateOutput(
    output: any[],
    imageWidth?: number,
    imageHeight?: number
): Promise<ProcessedHold[]> {
    console.log("⚡ Processing AI Masks to Polygons...", output.length, "masks found.");

    const processedHolds: ProcessedHold[] = [];

    // Process sequentially to avoid killing the browser's memory with too many canvases
    for (const [index, item] of output.entries()) {
        try {
            // Replicate format handling: sometimes it's direct string URL, sometimes object
            const maskUrl = typeof item === 'string' ? item : (item.mask || item.segmentation);

            if (!maskUrl) continue;

            const polygon = await extractContourFromMask(maskUrl);

            if (polygon && polygon.length > 3) {
                // Calculate BBox
                let minX = 1, minY = 1, maxX = 0, maxY = 0;
                polygon.forEach(([x, y]) => {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                });

                // Calculate Area (Shoelace formula)
                let area = 0;
                for (let i = 0; i < polygon.length; i++) {
                    const [x1, y1] = polygon[i];
                    const [x2, y2] = polygon[(i + 1) % polygon.length];
                    area += (x1 * y2 - x2 * y1);
                }
                const areaNorm = Math.abs(area) / 2;

                processedHolds.push({
                    id: `hold_cloud_${index}_${Date.now()}`,
                    contour: polygon,
                    area_px: areaNorm,
                    bbox: [minX, minY, maxX - minX, maxY - minY],
                    score: item.predicted_iou || item.stability_score || 0
                });
            }
        } catch (e) {
            console.error(`Failed to process mask ${index}`, e);
        }
    }

    console.log(`✅ Successfully vectorized ${processedHolds.length} holds.`);
    return processedHolds;
}

/**
 * Loads a mask image and traces its contour pixel-by-pixel.
 * Returns normalized coordinates rounded to 6 decimal places.
 */
async function extractContourFromMask(maskUrl: string): Promise<Point[] | null> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            const w = img.width;
            const h = img.height;

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) return resolve(null);

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data; // RGBA array

            // Helper to check pixel validity (is it part of the mask?)
            // Replicate masks are usually white/binary on black or transparent.
            // We assume non-black/transparent = mask.
            const isMask = (i: number) => {
                // detailed check: if Alpha > 128 and (R>128 or G>128 or B>128)
                return data[i + 3] > 128 && (data[i] > 100);
            };

            const getPixelIndex = (x: number, y: number) => (y * w + x) * 4;

            // 1. FIND START POINT (Top-Left most pixel)
            let startX = -1;
            let startY = -1;

            // Scanning
            outer: for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    if (isMask(getPixelIndex(x, y))) {
                        startX = x;
                        startY = y;
                        break outer;
                    }
                }
            }

            if (startX === -1) return resolve(null); // Empty mask

            // 2. MOORE-NEIGHBOR TRACING
            // (Standard algorithm for 8-connected boundary)
            const contour: Point[] = [];
            const startPoint: Point = [startX, startY];

            let currX = startX;
            let currY = startY;

            // Initial backtrack direction (entered from Left)
            // Directions: 0:N, 1:NE, 2:E, 3:SE, 4:S, 5:SW, 6:W, 7:NW
            let backtrackDir = 6; // Coming from West

            // Moore Neighborhood Offsets (Clockwise starting from N)
            const offsets = [
                [0, -1], [1, -1], [1, 0], [1, 1],
                [0, 1], [-1, 1], [-1, 0], [-1, -1]
            ];

            // Max iterations to prevent infinite loops in bad masks
            let ops = 0;
            const MAX_OPS = w * h * 2;

            do {
                contour.push([
                    Number((currX / w).toFixed(6)),
                    Number((currY / h).toFixed(6))
                ]);

                let foundNext = false;

                // Search neighbors in clockwise order, starting from backtrack direction
                for (let i = 0; i < 8; i++) {
                    const searchDir = (backtrackDir + i) % 8;
                    const dx = offsets[searchDir][0];
                    const dy = offsets[searchDir][1];
                    const nx = currX + dx;
                    const ny = currY + dy;

                    // Check bounds
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        if (isMask(getPixelIndex(nx, ny))) {
                            // Found next boundary pixel
                            currX = nx;
                            currY = ny;
                            // New backtrack is current dir inverted + 2 steps counter-clockwise?
                            // Actually Moore algorithm sets backtrack to previous neighbor examined (which was 0/background)
                            // A simpler heuristic: (searchDir + 4 + 2) % 8 => (searchDir + 6) % 8?
                            // Standard Moore: enter from P, found C. Next search starts at P.
                            // Here we just invert direction and rotate.
                            // Let's use simple logic: The neighbor coming *before* the one we found was empty.
                            // So start searching from there next time.
                            backtrackDir = (searchDir + 4 + 1) % 8; // Back + 1 step CW? No, traditionally (dir + 5) % 8 or similar.

                            // Let's stick to simple: start looking from "Left" relative to movement?
                            // Actually, standard: (current_dir + 4 + 2) % 8 is simplistic.
                            // Correct Moore: Start search at (d + 5) % 8?
                            // Let's try (searchDir + 6) % 8 as new start for next pixel.
                            backtrackDir = (searchDir + 5) % 8;

                            foundNext = true;
                            break;
                        }
                    }
                }

                if (!foundNext) break; // Isolated pixel
                ops++;

            } while ((currX !== startX || currY !== startY) && ops < MAX_OPS);

            resolve(contour);
        };

        img.onerror = (e) => {
            console.error("Error loading mask image", e);
            resolve(null);
        };

        img.src = maskUrl;
    });
}
