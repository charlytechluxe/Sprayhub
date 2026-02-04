-- Migration: Add voting system for route difficulty
-- Created: 2026-02-04

-- 1. Create grade_votes table
CREATE TABLE IF NOT EXISTS grade_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    suggested_grade TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(route_id, user_id) -- One vote per user per route
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_grade_votes_route ON grade_votes(route_id);
CREATE INDEX IF NOT EXISTS idx_grade_votes_user ON grade_votes(user_id);

-- 2. Add column to routes table
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS grade_adjusted_by_votes BOOLEAN DEFAULT FALSE;

-- 3. Function to calculate grade consensus (90% threshold)
CREATE OR REPLACE FUNCTION calculate_grade_consensus(p_route_id UUID)
RETURNS TEXT AS $$
DECLARE
    total_votes INTEGER;
    majority_grade TEXT;
    majority_count INTEGER;
    consensus_threshold DECIMAL := 0.9; -- 90%
BEGIN
    -- Count total votes for this route
    SELECT COUNT(*) INTO total_votes
    FROM grade_votes
    WHERE route_id = p_route_id;
    
    -- Need at least 3 votes for consensus
    IF total_votes < 3 THEN
        RETURN NULL;
    END IF;
    
    -- Find the most voted grade
    SELECT suggested_grade, COUNT(*) INTO majority_grade, majority_count
    FROM grade_votes
    WHERE route_id = p_route_id
    GROUP BY suggested_grade
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Check if consensus reached (90%)
    IF majority_count::DECIMAL / total_votes >= consensus_threshold THEN
        RETURN majority_grade;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger function to update route grade when consensus is reached
CREATE OR REPLACE FUNCTION update_route_grade_on_vote()
RETURNS TRIGGER AS $$
DECLARE
    new_grade TEXT;
BEGIN
    -- Calculate consensus
    new_grade := calculate_grade_consensus(NEW.route_id);
    
    -- If consensus reached, update the route grade
    IF new_grade IS NOT NULL THEN
        UPDATE routes
        SET 
            grade = new_grade,
            grade_adjusted_by_votes = TRUE,
            updated_at = NOW()
        WHERE id = NEW.route_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
DROP TRIGGER IF EXISTS trigger_update_grade_on_vote ON grade_votes;
CREATE TRIGGER trigger_update_grade_on_vote
AFTER INSERT OR UPDATE ON grade_votes
FOR EACH ROW
EXECUTE FUNCTION update_route_grade_on_vote();

-- 6. Enable RLS on grade_votes
ALTER TABLE grade_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all votes
CREATE POLICY "Anyone can view votes"
ON grade_votes FOR SELECT
USING (true);

-- Policy: Authenticated users can insert their own votes
CREATE POLICY "Users can insert their own votes"
ON grade_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own votes
CREATE POLICY "Users can update their own votes"
ON grade_votes FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
ON grade_votes FOR DELETE
USING (auth.uid() = user_id);
