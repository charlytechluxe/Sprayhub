-- Insert a Test Route to verify Sync and new Features
insert into routes (
  name, 
  grade, 
  wall_id, 
  holds, 
  created_at
)
values (
  'Test Sync 3000 🤖', -- Name with emoji to test encoding
  'Bleu',              -- Grade
  (select id from walls limit 1), -- Automatically pick the main wall
  '[
    {
      "id": "test_hold_1",
      "x": 0.5, "y": 0.8,
      "type": "start",
      "note": "Départ Assis",
      "contour": [[0.48,0.78],[0.52,0.78],[0.52,0.82],[0.48,0.82]] 
    },
    {
      "id": "test_hold_2",
      "x": 0.5, "y": 0.5,
      "type": "handfoot",
      "note": "Le Crux !",
      "contour": [[0.48,0.48],[0.52,0.48],[0.52,0.52],[0.48,0.52]]
    },
    {
      "id": "test_hold_3",
      "x": 0.5, "y": 0.2,
      "type": "top",
      "note": "Jetez !",
      "contour": [[0.48,0.18],[0.52,0.18],[0.52,0.22],[0.48,0.22]]
    }
  ]'::jsonb,
  now()
);
