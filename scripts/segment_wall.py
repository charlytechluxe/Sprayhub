
import os
import json
import cv2
import numpy as np
import argparse
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator

def segment_wall(image_path, output_json, weight_path):
    print(f"--- SprayHub CV Expert: Processing {image_path} ---")
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print("Error: Could not load image.")
        return
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    h, w = image.shape[:2]

    # Initialize SAM (Segment Anything Model)
    # Using ViT-L for high precision on dense spraywalls
    sam_type = "vit_l" 
    sam = sam_model_registry[sam_type](checkpoint=weight_path)
    
    # Move to GPU if available (Metal for Mac M1/M2/M3)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    sam.to(device=device)

    mask_generator = SamAutomaticMaskGenerator(
        model=sam,
        points_per_side=48, # Increased density for micro-holds
        pred_iou_thresh=0.80, # Lowered from 0.88 to capture more "doubtful" holds
        stability_score_thresh=0.90, # Lowered from 0.95
        crop_n_layers=1,
        crop_n_points_downscale_factor=2,
        min_mask_region_area=20,  # Lowered to capture tiny feet
    )

    print("Generation des masques (Deep Learning in progress)...")
    masks = mask_generator.generate(image_rgb)
    
    holds_data = []
    
    for i, mask in enumerate(masks):
        # Convert segmentation mask to contours
        binary_mask = mask['segmentation'].astype(np.uint8) * 255
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            continue
            
        # Take the largest contour for this instance
        c = max(contours, key=cv2.contourArea)
        
        # Simplify polygon (Douglas-Peucker) - precision 0.5px (TIGHTER FIT)
        epsilon = 0.0008 * cv2.arcLength(c, True) # Reduced from 0.002
        approx = cv2.approxPolyDP(c, epsilon, True)
        
        # Normalize coordinates to %
        normalized_contour = []
        for pt in approx:
            px, py = pt[0]
            normalized_contour.append([round(px / w, 4), round(py / h, 4)])
            
        holds_data.append({
            "id": f"hold_{i}",
            "area": float(mask['area']),
            "bbox": [float(x) for x in mask['bbox']],
            "contour": normalized_contour
        })

    # Save to JSON
    with open(output_json, 'w') as f:
        json.dump(holds_data, f, indent=2)
        
    print(f"Succès ! {len(holds_data)} prises détectées et exportées vers {output_json}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="Path to spraywall photo")
    parser.add_argument("--output", default="holds_segmentation.json", help="Path to output JSON")
    parser.add_argument("--weights", required=True, help="Path to SAM weights (sam_vit_l_0b31ee.pth)")
    
    args = parser.parse_args()
    segment_wall(args.image, args.output, args.weights)
