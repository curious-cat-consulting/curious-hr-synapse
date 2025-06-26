-- Seed Expenses
-- User 1: curious@cat.com -> 11111111-1111-1111-1111-111111111111
-- User 2: curious+2@cat.com -> 22222222-2222-2222-2222-222222222222  
-- User 3: curious+3@cat.com -> 33333333-3333-3333-3333-333333333333
-- Team Curious account: 744dec03-c891-4663-a0b3-f9050473f173

-- Insert bulk expenses for all test users (mix of personal and team accounts)
WITH user_accounts AS (
  SELECT
    users.user_id,
    gs.expense_num,
    CASE 
        WHEN gs.expense_num % 3 = 0 THEN '744dec03-c891-4663-a0b3-f9050473f173'::uuid -- Team Curious account
        ELSE users.user_id -- Personal account
    END as account_id
  FROM (
    SELECT '11111111-1111-1111-1111-111111111111'::uuid as user_id
    UNION ALL SELECT '22222222-2222-2222-2222-222222222222'::uuid
    UNION ALL SELECT '33333333-3333-3333-3333-333333333333'::uuid
  ) users
  CROSS JOIN generate_series(1, 20) as gs(expense_num) -- Generate 20 expenses per user
),
expense_data AS (
  SELECT
    CASE 
        WHEN ua.user_id = '11111111-1111-1111-1111-111111111111'::uuid AND ua.expense_num = 1 
        THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid 
        ELSE gen_random_uuid() 
    END as id,
    ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY user_id, expense_num) as account_expense_id,
    user_id,
    account_id,
    expense_num,
    CASE 
        WHEN expense_num = 1 AND user_id = '11111111-1111-1111-1111-111111111111'::uuid THEN 'Line Items'
        WHEN expense_num % 50 = 1 THEN 'Office Supplies & Stationery'
        WHEN expense_num % 50 = 2 THEN 'Business Travel - Client Meeting'
        WHEN expense_num % 50 = 3 THEN 'Team Building Lunch'
        WHEN expense_num % 50 = 4 THEN 'Annual Conference Registration'
        WHEN expense_num % 50 = 5 THEN 'Adobe Creative Suite License'
        WHEN expense_num % 50 = 6 THEN 'Marketing Brochures & Flyers'
        WHEN expense_num % 50 = 7 THEN 'MacBook Pro Development Setup'
        WHEN expense_num % 50 = 8 THEN 'AWS Certification Training'
        WHEN expense_num % 50 = 9 THEN 'Uber to Client Presentation'
        WHEN expense_num % 50 = 10 THEN 'Coffee & Refreshments for Meeting'
        WHEN expense_num % 50 = 11 THEN 'Flight to Industry Summit'
        WHEN expense_num % 50 = 12 THEN 'Hotel Accommodation - Business Trip'
        WHEN expense_num % 50 = 13 THEN 'Restaurant Dinner - Client Entertainment'
        WHEN expense_num % 50 = 14 THEN 'Webinar Registration Fee'
        WHEN expense_num % 50 = 15 THEN 'Slack Premium Subscription'
        WHEN expense_num % 50 = 16 THEN 'Business Cards & Letterhead'
        WHEN expense_num % 50 = 17 THEN 'External Hard Drive Backup'
        WHEN expense_num % 50 = 18 THEN 'Project Management Course'
        WHEN expense_num % 50 = 19 THEN 'Parking at Convention Center'
        WHEN expense_num % 50 = 20 THEN 'Printer Ink & Toner Cartridges'
        WHEN expense_num % 50 = 21 THEN 'Train Ticket - Regional Meeting'
        WHEN expense_num % 50 = 22 THEN 'Pizza Lunch for Team Meeting'
        WHEN expense_num % 50 = 23 THEN 'Tech Conference Pass'
        WHEN expense_num % 50 = 24 THEN 'Figma Pro Team License'
        WHEN expense_num % 50 = 25 THEN 'Trade Show Booth Materials'
        WHEN expense_num % 50 = 26 THEN 'Wireless Mouse & Keyboard Set'
        WHEN expense_num % 50 = 27 THEN 'Leadership Development Workshop'
        WHEN expense_num % 50 = 28 THEN 'Taxi from Airport to Hotel'
        WHEN expense_num % 50 = 29 THEN 'Whiteboard Markers & Erasers'
        WHEN expense_num % 50 = 30 THEN 'Rental Car - Client Site Visit'
        WHEN expense_num % 50 = 31 THEN 'Sushi Dinner - Team Celebration'
        WHEN expense_num % 50 = 32 THEN 'Online Course - Data Analytics'
        WHEN expense_num % 50 = 33 THEN 'Notion Workspace Premium'
        WHEN expense_num % 50 = 34 THEN 'Banner & Signage for Event'
        WHEN expense_num % 50 = 35 THEN 'USB-C Hub for Laptop'
        WHEN expense_num % 50 = 36 THEN 'Public Speaking Workshop'
        WHEN expense_num % 50 = 37 THEN 'Valet Parking - Business Dinner'
        WHEN expense_num % 50 = 38 THEN 'Sticky Notes & Post-its'
        WHEN expense_num % 50 = 39 THEN 'Bus Fare - Downtown Meeting'
        WHEN expense_num % 50 = 40 THEN 'Sandwich Platter - Office Lunch'
        WHEN expense_num % 50 = 41 THEN 'Industry Magazine Subscription'
        WHEN expense_num % 50 = 42 THEN 'Zoom Pro Annual Plan'
        WHEN expense_num % 50 = 43 THEN 'Trade Show Display Stand'
        WHEN expense_num % 50 = 44 THEN 'Monitor Stand & Cable Management'
        WHEN expense_num % 50 = 45 THEN 'Conflict Resolution Training'
        WHEN expense_num % 50 = 46 THEN 'Shuttle Service - Conference'
        WHEN expense_num % 50 = 47 THEN 'Paper Shredder for Office'
        WHEN expense_num % 50 = 48 THEN 'Bike Share - Quick Meeting'
        WHEN expense_num % 50 = 49 THEN 'Catering for All-Hands Meeting'
        ELSE 'Miscellaneous Business Expense'
    END as title,
    CASE 
        WHEN expense_num = 1 AND user_id = '11111111-1111-1111-1111-111111111111'::uuid THEN 'Good Description'
        WHEN expense_num % 50 = 1 THEN 'Purchased office supplies including notebooks, pens, and desk organizers'
        WHEN expense_num % 50 = 2 THEN 'Travel expenses for client meeting in downtown office'
        WHEN expense_num % 50 = 3 THEN 'Team building lunch at local Italian restaurant'
        WHEN expense_num % 50 = 4 THEN 'Annual tech conference registration and early bird discount'
        WHEN expense_num % 50 = 5 THEN 'Adobe Creative Suite annual license for design team'
        WHEN expense_num % 50 = 6 THEN 'Marketing materials including brochures and promotional flyers'
        WHEN expense_num % 50 = 7 THEN 'New MacBook Pro for development work with upgraded specs'
        WHEN expense_num % 50 = 8 THEN 'AWS Solutions Architect certification training course'
        WHEN expense_num % 50 = 9 THEN 'Uber ride to client presentation across town'
        WHEN expense_num % 50 = 10 THEN 'Coffee and refreshments for quarterly team meeting'
        WHEN expense_num % 50 = 11 THEN 'Round-trip flight to industry summit in San Francisco'
        WHEN expense_num % 50 = 12 THEN 'Hotel accommodation for 3-day business conference'
        WHEN expense_num % 50 = 13 THEN 'Dinner at upscale restaurant for client entertainment'
        WHEN expense_num % 50 = 14 THEN 'Webinar registration for latest industry trends'
        WHEN expense_num % 50 = 15 THEN 'Slack Premium subscription for enhanced team communication'
        WHEN expense_num % 50 = 16 THEN 'Professional business cards and company letterhead'
        WHEN expense_num % 50 = 17 THEN 'External hard drive for secure data backup'
        WHEN expense_num % 50 = 18 THEN 'Project management certification course online'
        WHEN expense_num % 50 = 19 THEN 'Parking fees at convention center for trade show'
        WHEN expense_num % 50 = 20 THEN 'Printer ink and toner cartridges for office printers'
        WHEN expense_num % 50 = 21 THEN 'Train ticket for regional client meeting'
        WHEN expense_num % 50 = 22 THEN 'Pizza lunch for team brainstorming session'
        WHEN expense_num % 50 = 23 THEN 'Tech conference pass with workshop access'
        WHEN expense_num % 50 = 24 THEN 'Figma Pro team license for design collaboration'
        WHEN expense_num % 50 = 25 THEN 'Trade show booth materials and promotional items'
        WHEN expense_num % 50 = 26 THEN 'Wireless mouse and keyboard set for ergonomic setup'
        WHEN expense_num % 50 = 27 THEN 'Leadership development workshop for managers'
        WHEN expense_num % 50 = 28 THEN 'Taxi transportation from airport to hotel'
        WHEN expense_num % 50 = 29 THEN 'Whiteboard markers and erasers for meeting rooms'
        WHEN expense_num % 50 = 30 THEN 'Rental car for client site visit and presentations'
        WHEN expense_num % 50 = 31 THEN 'Sushi dinner for team celebration after project completion'
        WHEN expense_num % 50 = 32 THEN 'Online course for data analytics and visualization'
        WHEN expense_num % 50 = 33 THEN 'Notion workspace premium for team documentation'
        WHEN expense_num % 50 = 34 THEN 'Banner and signage for company event'
        WHEN expense_num % 50 = 35 THEN 'USB-C hub for laptop connectivity and peripherals'
        WHEN expense_num % 50 = 36 THEN 'Public speaking workshop for presentation skills'
        WHEN expense_num % 50 = 37 THEN 'Valet parking for business dinner with clients'
        WHEN expense_num % 50 = 38 THEN 'Sticky notes and post-its for office organization'
        WHEN expense_num % 50 = 39 THEN 'Bus fare for downtown business meeting'
        WHEN expense_num % 50 = 40 THEN 'Sandwich platter for office lunch meeting'
        WHEN expense_num % 50 = 41 THEN 'Industry magazine subscription for market insights'
        WHEN expense_num % 50 = 42 THEN 'Zoom Pro annual plan for video conferencing'
        WHEN expense_num % 50 = 43 THEN 'Trade show display stand and booth materials'
        WHEN expense_num % 50 = 44 THEN 'Monitor stand and cable management solutions'
        WHEN expense_num % 50 = 45 THEN 'Conflict resolution training for team leaders'
        WHEN expense_num % 50 = 46 THEN 'Shuttle service to and from conference venue'
        WHEN expense_num % 50 = 47 THEN 'Paper shredder for secure document disposal'
        WHEN expense_num % 50 = 48 THEN 'Bike share for quick meeting across campus'
        WHEN expense_num % 50 = 49 THEN 'Catering for all-hands meeting and company update'
        ELSE 'General business expense for operational needs'
    END as description,
    0 as amount,
    CASE 
        WHEN expense_num = 1 AND user_id = '11111111-1111-1111-1111-111111111111'::uuid THEN 'ANALYZED'::synapse.expense_status
        WHEN expense_num % 4 = 1 THEN 'NEW'::synapse.expense_status
        WHEN expense_num % 4 = 2 THEN 'PENDING'::synapse.expense_status
        WHEN expense_num % 4 = 3 THEN 'APPROVED'::synapse.expense_status
        ELSE 'REJECTED'::synapse.expense_status
    END as status,
    now() - (interval '1 day' * (random() * 30)::integer) as created_at,
    now() - (interval '1 day' * (random() * 30)::integer) as updated_at
  FROM user_accounts ua
)
INSERT INTO synapse.expenses (
  id,
  account_expense_id,
  user_id,
  account_id,
  title,
  description,
  amount,
  status,
  created_at,
  updated_at
)
SELECT 
  id,
  account_expense_id,
  user_id,
  account_id,
  title,
  description,
  amount,
  status,
  created_at,
  updated_at
FROM expense_data
ORDER BY account_id, account_expense_id;

-- Sync account_expense_counters with max account_expense_id for each account
-- This ensures the counters are properly initialized after seeding expenses
INSERT INTO synapse.account_expense_counters (account_id, last_expense_id, updated_at)
SELECT account_id, max(account_expense_id), now()
FROM synapse.expenses
GROUP BY account_id
ON CONFLICT (account_id) 
DO UPDATE SET 
  last_expense_id = excluded.last_expense_id, 
  updated_at = excluded.updated_at;