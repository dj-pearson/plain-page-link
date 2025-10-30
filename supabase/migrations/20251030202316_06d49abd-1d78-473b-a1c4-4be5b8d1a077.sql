-- Allow anyone to insert analytics views (for tracking profile views from anonymous visitors)
CREATE POLICY "Anyone can insert analytics views"
ON analytics_views
FOR INSERT
WITH CHECK (true);

-- Allow anyone to increment link click counts
CREATE POLICY "Anyone can increment link clicks"
ON links
FOR UPDATE
USING (true)
WITH CHECK (true);