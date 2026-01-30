
import os
import json
import cv2
import numpy as np
import argparse
import torch
from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator

def segment_wall_pixel_perfect(image_path, output_json, checkpoint_path):
    print(f"--- SprayHub ULTRA-DETECTION: {image_path} ---")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not load image at {image_path}.")
        return
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    h, w = image.shape[:2]

    # Force CPU to avoid MPS float64/32 precision issues on Mac
    device = "cpu"
    print(f"Using device: {device} (Pixel-Perfect Accuracy Mode)")
    
    model_type = "vit_t" 
    sam = sam_model_registry[model_type](checkpoint=checkpoint_path)
    sam.to(device=device)
    
    # "Paranoiac Separation" AI Configuration
    # PROBLEM: Adjacent holds merging.
    # SOLUTION: Deep Cropping (Layers=2) + Stricter Quality (0.88)
    mask_generator = SamAutomaticMaskGenerator(
        model=sam,
        points_per_side=144, # Even higher density
        pred_iou_thresh=0.88, # Stricter to force separation
        stability_score_thresh=0.94, # Very stable masks only
        crop_n_layers=2, # DOUBLE ZOOM: Critical for separating close holds
        crop_n_points_downscale_factor=2,
        min_mask_region_area=15, # Ignore small noise
    )

    print("AI IS SCANNING WITH DEEP ZOOM LAYERS... (Separation Mode)")
    masks = mask_generator.generate(image_rgb)
    
    holds_data = []
    
    for i, mask in enumerate(masks):
        binary_mask = mask['segmentation'].astype(np.uint8) * 255
        
        # CHAIN_APPROX_NONE: EVERY pixel on the boundary is stored. NO simplification.
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        if not contours:
            continue
            
        # Get the largest contour for the hold
        c = max(contours, key=cv2.contourArea)
        
        # MISSION: ZERO SIMPLIFICATION. We do NOT use approxPolyDP here.
        # We take the contour as it is.
        
        # Normalize to % with 6 decimal places for sub-pixel precision
        normalized_contour = [[round(pt[0][0] / w, 6), round(pt[0][1] / h, 6)] for pt in c]
            
        holds_data.append({
            "id": f"hold_{i}",
            "contour": normalized_contour,
            "area_px": float(mask['area'])
        })

    # Ensure target directory exists
    os.makedirs(os.path.dirname(output_json), exist_ok=True)

    with open(output_json, 'w') as f:
        json.dump(holds_data, f, indent=2)
        
    print(f"MISSION SUCCESS: {len(holds_data)} pixel-perfect holds detected.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--output", default="apps/client-pwa/src/data/holds_final_force.json")
    parser.add_argument("--weights", required=True)
    
    args = parser.parse_args()
    segment_wall_pixel_perfect(args.image, args.output, args.weights)
