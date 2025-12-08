-- Update all articles to assign them to your user account
UPDATE articles 
SET author_id = '176d178a-ed97-4751-9467-6144a7714d34' 
WHERE author_id IS NULL;

-- Show results
SELECT COUNT(*) as updated_articles 
FROM articles 
WHERE author_id = '176d178a-ed97-4751-9467-6144a7714d34';

-- Show a few sample articles
SELECT id, title, author_id, status 
FROM articles 
ORDER BY published_at DESC 
LIMIT 5;
