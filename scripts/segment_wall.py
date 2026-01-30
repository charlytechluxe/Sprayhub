
import os
import json
import cv2
import numpy as np
import argparse
import torch
from mobile_sam import sam_model_registry, SamAutomaticMaskGenerator

def segment_wall_pro(image_path, output_json, checkpoint_path):
    print(f"--- SprayHub AUTOMATIC PRO: Segmenting {image_path} with MobileSAM ---")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not load image at {image_path}.")
        return
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    h, w = image.shape[:2]

    # Initialize MobileSAM
    # Device: use 'cpu' by default for stability, or 'mps' for Mac Silicon
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Using device: {device}")
    
    model_type = "vit_t" # MobileSAM uses vit_t
    sam = sam_model_registry[model_type](checkpoint=checkpoint_path)
    sam.to(device=device)
    
    # Automatic Mask Generator Configuration
    mask_generator = SamAutomaticMaskGenerator(
        model=sam,
        points_per_side=64,
        pred_iou_thresh=0.8,
        stability_score_thresh=0.85,
        min_mask_region_area=10,
    )

    print("MobileSAM ULTRA-SCAN in progress...")
    masks = mask_generator.generate(image_rgb)
    
    holds_data = []
    
    for i, mask in enumerate(masks):
        binary_mask = mask['segmentation'].astype(np.uint8) * 255
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            continue
            
        c = max(contours, key=cv2.contourArea)
        
        # Zero-simplification for pixel-perfect contours
        epsilon = 0.0001 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, epsilon, True)
        
        # Normalize to %
        normalized_contour = [[round(pt[0][0] / w, 6), round(pt[0][1] / h, 6)] for pt in approx]
            
        holds_data.append({
            "id": f"h_{i}",
            "contour": normalized_contour,
            "area_px": float(mask['area'])
        })

    # Ensure target directory exists
    os.makedirs(os.path.dirname(output_json), exist_ok=True)

    with open(output_json, 'w') as f:
        json.dump(holds_data, f, indent=2)
        
    print(f"ULTRA-SCAN COMPLETE: {len(holds_data)} instances captured.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--output", default="apps/client-pwa/src/data/holds_segmentation.json")
    parser.add_argument("--weights", required=True)
    
    args = parser.parse_args()
    segment_wall_pro(args.image, args.output, args.weights)
