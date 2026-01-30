
import os
import json
import cv2
import numpy as np
import argparse
import torch
# Assuming SAM 2 environment is set up
from sam2.build_sam import build_sam2
from sam2.automatic_mask_generator import SAM2AutomaticMaskGenerator

def segment_wall_pro(image_path, output_json, model_cfg, checkpoint_path):
    print(f"--- SprayHub AUTOMATIC PRO: Segmenting {image_path} with SAM 2 ---")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print("Error: Could not load image.")
        return
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    h, w = image.shape[:2]

    # Initialize SAM 2
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Using device: {device}")
    
    sam2 = build_sam2(model_cfg, checkpoint_path, device=device)
    
    # Paranoiac Configuration: Ultra-high density grid scan
    mask_generator = SAM2AutomaticMaskGenerator(
        model=sam2,
        points_per_side=80, # Massive grid scan to catch every tiny detail
        points_per_batch=64,
        pred_iou_thresh=0.5, # Drastically lowered to catch doubtful holds
        stability_score_thresh=0.85, # Increased sensitivity
        min_mask_region_area=5, # Detect even the smallest chips
    )

    print("SAM 2 ULTRA-SCAN in progress...")
    masks = mask_generator.generate(image_rgb)
    
    holds_data = []
    
    for i, mask in enumerate(masks):
        binary_mask = mask['segmentation'].astype(np.uint8) * 255
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            continue
            
        c = max(contours, key=cv2.contourArea)
        
        # Zero-simplification approach: keep high fidelity
        # 0.0001 epsilon is almost no simplification
        epsilon = 0.0001 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, epsilon, True)
        
        normalized_contour = [[round(pt[0][0] / w, 6) for pt in approx], [round(pt[0][1] / h, 6) for pt in approx]]
        # Note: I'll stick to the [[x,y], [x,y]] format as it's cleaner for the React loop
        normalized_contour = [[round(pt[0][0] / w, 6), round(pt[0][1] / h, 6)] for pt in approx]
            
        holds_data.append({
            "id": f"h_{i}",
            "contour": normalized_contour,
            "area_px": float(mask['area'])
        })

    with open(output_json, 'w') as f:
        json.dump(holds_data, f, indent=2)
        
    print(f"ULTRA-SCAN COMPLETE: {len(holds_data)} instances captured.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--output", default="holds_segmentation.json")
    parser.add_argument("--config", default="sam2_hiera_l.yaml")
    parser.add_argument("--weights", required=True)
    
    args = parser.parse_args()
    segment_wall_pro(args.image, args.output, args.config, args.weights)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="Path to spraywall photo")
    parser.add_argument("--output", default="holds_segmentation.json", help="Path to output JSON")
    parser.add_argument("--weights", required=True, help="Path to SAM weights (sam_vit_l_0b31ee.pth)")
    
    args = parser.parse_args()
    segment_wall(args.image, args.output, args.weights)
