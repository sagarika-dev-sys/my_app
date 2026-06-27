-- ==========================================
-- PART 1 — DATABASE FOUNDATION
-- ==========================================

-- PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('student', 'club', 'admin');
CREATE TYPE room_type AS ENUM ('private', 'group', 'automated');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'dismissed');

-- Profiles Table (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sub-Role: Students
CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    enrollment_number VARCHAR(50) NOT NULL UNIQUE,
    branch VARCHAR(100) NOT NULL,
    graduation_year INT NOT NULL,
    CONSTRAINT check_graduation_year CHECK (graduation_year >= 1956 AND graduation_year <= 2100),
    CONSTRAINT check_roll_format CHECK (roll_number ~* '^[0-9]+$|^[A-Z0-9/-]+$')
);

-- Sub-Role: Clubs / Committees
CREATE TABLE public.clubs (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    club_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sub-Role: Admins
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    department VARCHAR(150) NOT NULL
);

-- Utility Functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    found_role user_role;
BEGIN
    SELECT role INTO found_role FROM public.profiles WHERE id = user_id;
    RETURN found_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- PART 2 — STUDENT FEED
-- ==========================================

-- Posts Table
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_content_length CHECK (char_length(trim(content)) > 0)
);

-- Hashtags Table
CREATE TABLE public.hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_tag_format CHECK (tag ~* '^[a-z0-9_]+$')
);

-- Post Hashtags Junction Table
CREATE TABLE public.post_hashtags (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- ==========================================
-- PART 3 — ENGAGEMENT
-- ==========================================

-- Comments Table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_comment_content_length CHECK (char_length(trim(content)) > 0)
);

-- Likes Table
CREATE TABLE public.likes (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- ==========================================
-- PART 4 — CHAT SYSTEM
-- ==========================================

-- Chat Rooms Table
CREATE TABLE public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150),
    type room_type NOT NULL DEFAULT 'private',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_group_title CHECK (
        (type = 'private' AND title IS NULL) OR 
        (type IN ('group', 'automated') AND title IS NOT NULL AND char_length(trim(title)) > 0)
    )
);

-- Chat Room Members Junction Table
CREATE TABLE public.chat_room_members (
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (room_id, user_id)
);

-- Chat Messages Table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_message_empty CHECK (char_length(trim(message)) > 0)
);

-- ==========================================
-- PART 5 — CAMPUS ACTIVITIES
-- ==========================================

-- Events Table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    venue VARCHAR(200) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_event_timeline CHECK (end_time > start_time),
    CONSTRAINT check_positive_capacity CHECK (capacity > 0),
    CONSTRAINT check_title_length CHECK (char_length(trim(title)) > 0)
);

-- Event Requests Junction Table
CREATE TABLE public.event_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    status request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_student_event_registration UNIQUE (student_id, event_id)
);

-- Club Posts Table
CREATE TABLE public.club_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_club_post_title CHECK (char_length(trim(title)) > 0),
    CONSTRAINT check_club_post_content CHECK (char_length(trim(content)) > 0)
);

-- Complaints Table
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status complaint_status NOT NULL DEFAULT 'open',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_complaint_subject CHECK (char_length(trim(subject)) > 0),
    CONSTRAINT check_complaint_description CHECK (char_length(trim(description)) > 0)
);


-- ==========================================
-- PART 6 — PERFORMANCE INDEXES
-- ==========================================

-- Standard B-Tree Indexes for Foreign Keys
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_students_branch ON public.students(branch);
CREATE INDEX idx_students_graduation_year ON public.students(graduation_year);
CREATE INDEX idx_posts_student_id ON public.posts(student_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_chat_room_members_user_id ON public.chat_room_members(user_id);
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX idx_events_club_id ON public.events(club_id);
CREATE INDEX idx_event_requests_student_id ON public.event_requests(student_id);
CREATE INDEX idx_event_requests_event_id ON public.event_requests(event_id);
CREATE INDEX idx_club_posts_club_id ON public.club_posts(club_id);
CREATE INDEX idx_complaints_student_id ON public.complaints(student_id);

-- Composite Indexes
CREATE INDEX idx_posts_student_created ON public.posts(student_id, created_at DESC);
CREATE INDEX idx_chat_messages_room_created ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX idx_comments_post_created ON public.comments(post_id, created_at ASC);
CREATE INDEX idx_events_timeline ON public.events(start_time, end_time);

-- Partial Indexes
CREATE INDEX idx_complaints_open_status ON public.complaints(status) WHERE status = 'open';
CREATE INDEX idx_event_requests_pending ON public.event_requests(status) WHERE status = 'pending';

-- Full-Text Search Indexes (Trigram-based for PostgreSQL flexibility)
CREATE INDEX idx_posts_content_trgm ON public.posts USING gin (content gin_trgm_ops);
CREATE INDEX idx_events_search_trgm ON public.events USING gin (title gin_trgm_ops, description gin_trgm_ops);
CREATE INDEX idx_club_posts_search_trgm ON public.club_posts USING gin (title gin_trgm_ops, content gin_trgm_ops);

-- ==========================================
-- PART 7 — TRIGGER SYSTEM
-- ==========================================

-- Global Updated At Automation Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Identity Safeguard: Verify Sub-Role Mapping Consistency
CREATE OR REPLACE FUNCTION public.verify_profile_subrole_integrity()
RETURNS TRIGGER AS $$
DECLARE
    current_role user_role;
BEGIN
    SELECT role INTO current_role FROM public.profiles WHERE id = NEW.id;
    IF current_role IS NULL THEN
        RAISE EXCEPTION 'Parent core profile missing for the requested operational operation.';
    END IF;
    
    IF TG_TABLE_NAME = 'students' AND current_role != 'student' THEN
        RAISE EXCEPTION 'Role mapping violation: Targeted record is configured as % inside profiles.', current_role;
    ELSIF TG_TABLE_NAME = 'clubs' AND current_role != 'club' THEN
        RAISE EXCEPTION 'Role mapping violation: Targeted record is configured as % inside profiles.', current_role;
    ELSIF TG_TABLE_NAME = 'admins' AND current_role != 'admin' THEN
        RAISE EXCEPTION 'Role mapping violation: Targeted record is configured as % inside profiles.', current_role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Updated At Triggers
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_event_requests_updated_at BEFORE UPDATE ON public.event_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_club_posts_updated_at BEFORE UPDATE ON public.club_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attach Sub-Role Mapping Safeguard Triggers
CREATE TRIGGER check_student_subrole_integrity BEFORE INSERT OR UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.verify_profile_subrole_integrity();
CREATE TRIGGER check_club_subrole_integrity BEFORE INSERT OR UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.verify_profile_subrole_integrity();
CREATE TRIGGER check_admin_subrole_integrity BEFORE INSERT OR UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.verify_profile_subrole_integrity();

-- ==========================================
-- PART 8 — AUTOMATION
-- ==========================================

-- Core Automation Execution Routine
CREATE OR REPLACE FUNCTION public.initialize_automated_campus_channels()
RETURNS VOID AS $$
DECLARE
    food_split_id UUID;
    cab_split_id UUID;
    resell_id UUID;
BEGIN
    -- Check or provision #foodsplit
    SELECT id INTO food_split_id FROM public.chat_rooms WHERE title = '#foodsplit' AND type = 'automated';
    IF food_split_id IS NULL THEN
        INSERT INTO public.chat_rooms (title, type) VALUES ('#foodsplit', 'automated');
    END IF;

    -- Check or provision #cabsplit
    SELECT id INTO cab_split_id FROM public.chat_rooms WHERE title = '#cabsplit' AND type = 'automated';
    IF cab_split_id IS NULL THEN
        INSERT INTO public.chat_rooms (title, type) VALUES ('#cabsplit', 'automated');
    END IF;

    -- Check or provision #resell
    SELECT id INTO resell_id FROM public.chat_rooms WHERE title = '#resell' AND type = 'automated';
    IF resell_id IS NULL THEN
        INSERT INTO public.chat_rooms (title, type) VALUES ('#resell', 'automated');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function to auto-join new users to automated rooms
CREATE OR REPLACE FUNCTION public.auto_subscribe_user_to_campus_channels()
RETURNS TRIGGER AS $$
DECLARE
    room_record RECORD;
BEGIN
    FOR room_record IN SELECT id FROM public.chat_rooms WHERE type = 'automated' LOOP
        INSERT INTO public.chat_room_members (room_id, user_id)
        VALUES (room_record.id, NEW.id)
        ON CONFLICT (room_id, user_id) DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach subscription engine to profile creation
CREATE TRIGGER secure_auto_join_channels
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.auto_subscribe_user_to_campus_channels();

-- Execute provisioning structure safely
SELECT public.initialize_automated_campus_channels();

-- Post Expiry Cleanup Routine
CREATE OR REPLACE FUNCTION public.purge_expired_student_posts()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    -- Removes student posts older than 180 days (approx 6 months)
    DELETE FROM public.posts
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '180 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Register cleanup routine into pg_cron table structures
SELECT cron.schedule(
    'nightly-post-cleanup',
    '0 2 * * *',
    'SELECT public.purge_expired_student_posts();'
);

-- ==========================================
-- PART 9 — DATABASE FUNCTIONS
-- ==========================================

-- Secure Transactional API Wrapper for Registering Event RSVPs
CREATE OR REPLACE FUNCTION public.register_for_event(target_student_id UUID, target_event_id UUID)
RETURNS public.event_requests AS $$
DECLARE
    current_capacity INT;
    active_confirmations INT;
    result_record public.event_requests;
BEGIN
    -- Select capacity parameters cleanly enforcing rows lock
    SELECT capacity INTO current_capacity FROM public.events WHERE id = target_event_id FOR UPDATE;
    IF current_capacity IS NULL THEN
        RAISE EXCEPTION 'The requested target event structure does not exist.';
    END IF;

    -- Evaluate current approved slots
    SELECT COUNT(*) INTO active_confirmations 
    FROM public.event_requests 
    WHERE event_id = target_event_id AND status = 'approved';

    IF active_confirmations >= current_capacity THEN
        RAISE EXCEPTION 'Registration rejected: Operational capacities for this venue are full.';
    END IF;

    -- Upsert the target tracking operational payload
    INSERT INTO public.event_requests (student_id, event_id, status)
    VALUES (target_student_id, target_event_id, 'pending')
    ON CONFLICT (student_id, event_id) DO UPDATE 
    SET updated_at = CURRENT_TIMESTAMP
    RETURNING * INTO result_record;

    RETURN result_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Post Hashtag Parsing Pipeline Automation
CREATE OR REPLACE FUNCTION public.process_post_hashtags_stream()
RETURNS TRIGGER AS $$
DECLARE
    raw_tag TEXT;
    cleaned_tag TEXT;
    hashtag_uuid UUID;
BEGIN
    -- Extract all substrings matching # patterns sequentially
    FOR raw_tag IN SELECT unnest(regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g')) LOOP
        cleaned_tag := lower(trim(raw_tag));
        
        IF cleaned_tag ~* '^[a-z0-9_]+$' THEN
            -- Inject hashtag definition safely preserving unique rules
            INSERT INTO public.hashtags (tag)
            VALUES (cleaned_tag)
            ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag
            RETURNING id INTO hashtag_uuid;

            -- Associate post reference mapping
            INSERT INTO public.post_hashtags (post_id, hashtag_id)
            VALUES (NEW.id, hashtag_uuid)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach automation engine parsing directly onto posts table layer
CREATE TRIGGER process_post_content_hashtags
    AFTER INSERT OR UPDATE OF content ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.process_post_hashtags_stream();

-- ==========================================
-- CORRECTED PART 11 (RLS POLICIES)
-- ==========================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow posts read" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow comments read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow tags read" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "Allow chat read" ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY "Allow chat members read" ON public.chat_room_members FOR SELECT USING (true);
CREATE POLICY "Allow events read" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow complaints read" ON public.complaints FOR SELECT USING (true);

    -- ==========================================
-- PART 12 — SEED DATA AND DATABASE VALIDATION
-- ==========================================

-- ------------------------------------------
-- 1. SEED DATA GENERATION
-- ------------------------------------------

-- Note on RLS & Triggers: 
-- Seed profiles must be created first. The triggers automatically populate subrole verification dependencies.
-- Profiles must exist in auth.users mocked context or created directly for public schema references.

BEGIN;

-- Temporarily disable triggers to safely seed initial predictable relational data without auth schema friction
SET LOCAL session_replication_role = 'replica';

-- Seed Core Profiles
INSERT INTO public.profiles (id, role, full_name, avatar_url) VALUES
('018b31a8-9d21-729d-9c44-b0a1a5b82201', 'student', 'Aarav Sharma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav'),
('018b31a8-9d21-729d-9c44-b0a1a5b82202', 'student', 'Ananya Verma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya'),
('018b31a8-9d21-729d-9c44-b0a1a5b82203', 'student', 'Rohan Das', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan'),
('018b31a8-9d21-729d-9c44-b0a1a5b82204', 'club', '⚡ Turing Club NITRR', 'https://api.dicebear.com/7.x/initials/svg?seed=TC'),
('018b31a8-9d21-729d-9c44-b0a1a5b82205', 'club', '🎨 Shaurya Arts Committee', 'https://api.dicebear.com/7.x/initials/svg?seed=SA'),
('018b31a8-9d21-729d-9c44-b0a1a5b82206', 'admin', 'Dr. Rajesh Dean Academics', 'https://api.dicebear.com/7.x/identicon/svg?seed=Dean');

-- Seed Sub-Role: Students
INSERT INTO public.students (id, roll_number, enrollment_number, branch, graduation_year) VALUES
('018b31a8-9d21-729d-9c44-b0a1a5b82201', '22114001', 'NITRR220412', 'Computer Science and Engineering', 2026),
('018b31a8-9d21-729d-9c44-b0a1a5b82202', '22118045', 'NITRR220915', 'Information Technology', 2026),
('018b31a8-9d21-729d-9c44-b0a1a5b82203', '23115022', 'NITRR231102', 'Electronics and Communication Engineering', 2027);

-- Seed Sub-Role: Clubs
INSERT INTO public.clubs (id, club_name, description, category) VALUES
('018b31a8-9d21-729d-9c44-b0a1a5b82204', 'Turing Club', 'The official coding and open-source club of NIT Raipur.', 'Technical'),
('018b31a8-9d21-729d-9c44-b0a1a5b82205', 'Shaurya Arts', 'Promoting fine arts, street painting, and design culture within campus.', 'Cultural');

-- Seed Sub-Role: Admins
INSERT INTO public.admins (id, department) VALUES
('018b31a8-9d21-729d-9c44-b0a1a5b82206', 'Academic Affairs Bureau');

-- Seed Posts (Student Feed)
INSERT INTO public.posts (id, student_id, content, media_url) VALUES
('018b31c2-cbb3-789a-bf71-ef671239ab01', '018b31a8-9d21-729d-9c44-b0a1a5b82201', 'Cracked the summer internship interview process! Super excited for what is next! #placement #coding', NULL),
('018b31c2-cbb3-789a-bf71-ef671239ab02', '018b31a8-9d21-729d-9c44-b0a1a5b82202', 'Does anyone know if the central library stays open past 8 PM during end-sem exams? #help', NULL);

-- Seed Comments
INSERT INTO public.comments (id, post_id, author_id, parent_id, content) VALUES
('018b31c8-11a2-7104-af91-cfbb8212ee01', '018b31c2-cbb3-789a-bf71-ef671239ab01', '018b31a8-9d21-729d-9c44-b0a1a5b82202', NULL, 'Huge congratulations Aarav! Which company?'),
('018b31c8-11a2-7104-af91-cfbb8212ee02', '018b31c2-cbb3-789a-bf71-ef671239ab01', '018b31a8-9d21-729d-9c44-b0a1a5b82201', '018b31c8-11a2-7104-af91-cfbb8212ee01', 'Thanks Ananya! It is Uber India.');

-- Seed Likes
INSERT INTO public.likes (post_id, user_id) VALUES
('018b31c2-cbb3-789a-bf71-ef671239ab01', '018b31a8-9d21-729d-9c44-b0a1a5b82202'),
('018b31c2-cbb3-789a-bf71-ef671239ab01', '018b31a8-9d21-729d-9c44-b0a1a5b82203'),
('018b31c2-cbb3-789a-bf71-ef671239ab02', '018b31a8-9d21-729d-9c44-b0a1a5b82201');

-- Seed Chat Rooms (Non-automated, automated populated by Part 8 initialization)
INSERT INTO public.chat_rooms (id, title, type) VALUES
('018b31d1-eef1-723a-bf21-998caab21101', NULL, 'private'),
('018b31d1-eef1-723a-bf21-998caab21102', 'CSE Batch 2026 Core', 'group');

-- Seed Chat Room Members
INSERT INTO public.chat_room_members (room_id, user_id) VALUES
('018b31d1-eef1-723a-bf21-998caab21101', '018b31a8-9d21-729d-9c44-b0a1a5b82201'),
('018b31d1-eef1-723a-bf21-998caab21101', '018b31a8-9d21-729d-9c44-b0a1a5b82202'),
('018b31d1-eef1-723a-bf21-998caab21102', '018b31a8-9d21-729d-9c44-b0a1a5b82201'),
('018b31d1-eef1-723a-bf21-998caab21102', '018b31a8-9d21-729d-9c44-b0a1a5b82203');

-- Seed Chat Messages
INSERT INTO public.chat_messages (room_id, sender_id, message) VALUES
('018b31d1-eef1-723a-bf21-998caab21101', '018b31a8-9d21-729d-9c44-b0a1a5b82201', 'Hey Ananya, do you have the notes for Compiler Design?'),
('018b31d1-eef1-723a-bf21-998caab21101', '018b31a8-9d21-729d-9c44-b0a1a5b82202', 'Yeah, I will upload them to the drive and send the link here.');

-- Seed Events
INSERT INTO public.events (id, club_id, title, description, venue, start_time, end_time, capacity) VALUES
('018b31dd-1b15-7cb2-b432-ffcaab99bb01', '018b31a8-9d21-729d-9c44-b0a1a5b82204', 'CodeSprint 2026', 'Annual 12-hour algorithmic development hackathon hosted by Turing Club.', 'Amphi-Theatre / Main Computer Center', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '12 hours', 150);

-- Seed Event Requests
INSERT INTO public.event_requests (id, student_id, event_id, status) VALUES
('018b31e3-6a9b-7cc2-8ea1-aabbccddeeff', '018b31a8-9d21-729d-9c44-b0a1a5b82201', '018b31dd-1b15-7cb2-b432-ffcaab99bb01', 'approved'),
('018b31e3-6a9b-7cc2-8ea2-aabbccddeeff', '018b31a8-9d21-729d-9c44-b0a1a5b82202', '018b31dd-1b15-7cb2-b432-ffcaab99bb01', 'pending');

-- Seed Club Posts
INSERT INTO public.club_posts (id, club_id, title, content, category) VALUES
('018b31ea-cc91-7221-a1b1-ffccbb990011', '018b31a8-9d21-729d-9c44-b0a1a5b82204', 'CodeSprint Registrations Open!', 'Gear up for the biggest hackathon of the Spring semester. Register through the campus events dashboard now.', 'Announcement');

-- Seed Complaints
INSERT INTO public.complaints (id, student_id, category, subject, description, status, is_anonymous) VALUES
('018b31f2-1a42-7cf2-8bf1-001122334455', '018b31a8-9d21-729d-9c44-b0a1a5b82203', 'Hostel Maintenance', 'Water cooler breakdown in Hostel H', 'The water cooling machine on the second floor has broken down, causing major inconvenience in this heat.', 'open', false);

-- Re-enable triggers 
SET LOCAL session_replication_role = 'origin';

COMMIT;

-- ------------------------------------------
-- 2. VALIDATION, INTEGRITY ARCHITECTURE REPAIR & BEST PRACTICES
-- ------------------------------------------

BEGIN;

-- Issue A: View Definition Discrepancies
-- The views in Part 10 call non-existent columns (roll_no, enrollment_no, first_name, last_name, email, is_verified, deleted_at, status, organization_id, post_likes) 
-- because the schemas in Part 1-5 use explicit naming parameters (roll_number, enrollment_number, full_name, user_role logic).
-- We safely drop and remap the target view entities to conform with exact Part 1-5 schemas.

DROP VIEW IF EXISTS public.view_active_student_profiles CASCADE;
DROP VIEW IF EXISTS public.view_global_search_index CASCADE;
DROP VIEW IF EXISTS public.view_analytics_engagement_metrics CASCADE;
DROP VIEW IF EXISTS public.view_trending_hashtags_velocity CASCADE;
DROP VIEW IF EXISTS public.view_reporting_organization_compliance CASCADE;
DROP VIEW IF EXISTS public.view_moderation_audit_queue CASCADE;

-- Re-building View 1: Active Student Profiles Mapping correct structures
CREATE OR REPLACE VIEW public.view_active_student_profiles AS
SELECT 
    s.id AS student_id,
    s.roll_number,
    s.enrollment_number,
    prof.full_name,
    s.branch,
    s.graduation_year,
    COUNT(p.id) AS total_posts_created,
    COUNT(er.id) FILTER (WHERE er.status = 'approved') AS total_events_attended
FROM public.students s
JOIN public.profiles prof ON s.id = prof.id
LEFT JOIN public.posts p ON s.id = p.student_id
LEFT JOIN public.event_requests er ON s.id = er.student_id
GROUP BY s.id, prof.full_name;

-- Re-building View 2: Search Optimization View targeting explicit system tables
CREATE OR REPLACE VIEW public.view_global_search_index AS
SELECT 
    'post' AS entity_type,
    p.id AS entity_id,
    SUBSTRING(p.content FROM 1 FOR 50) AS primary_title,
    p.content AS searchable_body,
    p.created_at AS published_at,
    prof.full_name AS author_display_name
FROM public.posts p
JOIN public.profiles prof ON p.student_id = prof.id
UNION ALL
SELECT 
    'event' AS entity_type,
    e.id AS entity_id,
    e.title AS primary_title,
    e.description AS searchable_body,
    e.start_time AS published_at,
    c.club_name AS author_display_name
FROM public.events e
JOIN public.clubs c ON e.club_id = c.id
UNION ALL
SELECT 
    'club_post' AS entity_type,
    cp.id AS entity_id,
    cp.title AS primary_title,
    cp.content AS searchable_body,
    cp.created_at AS published_at,
    c.club_name AS author_display_name
FROM public.club_posts cp
JOIN public.clubs c ON cp.club_id = c.id;

-- Re-building View 3: Platform Analytics Dashboard View Engine
CREATE OR REPLACE VIEW public.view_analytics_engagement_metrics AS
SELECT 
    p.id AS post_id,
    SUBSTRING(p.content FROM 1 FOR 40) AS post_snippet,
    s.branch AS author_branch,
    COUNT(DISTINCT l.user_id) AS total_likes,
    COUNT(DISTINCT c.id) AS total_comments,
    COUNT(DISTINCT ph.hashtag_id) AS associated_hashtags_count,
    (COUNT(DISTINCT l.user_id) * 2 + COUNT(DISTINCT c.id) * 5) AS weighted_engagement_score
FROM public.posts p
JOIN public.students s ON p.student_id = s.id
LEFT JOIN public.likes l ON p.id = l.post_id
LEFT JOIN public.comments c ON p.id = c.post_id
LEFT JOIN public.post_hashtags ph ON p.id = ph.post_id
GROUP BY p.id, s.branch;

-- Re-building View 4: Trending Hashtags Tracker
CREATE OR REPLACE VIEW public.view_trending_hashtags_velocity AS
SELECT 
    h.id AS hashtag_id,
    h.tag AS hashtag_name,
    COUNT(ph.post_id) AS total_uses,
    COUNT(ph.post_id) FILTER (WHERE p.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days') AS uses_past_week,
    MAX(p.created_at) AS last_utilized_at
FROM public.hashtags h
JOIN public.post_hashtags ph ON h.id = ph.hashtag_id
JOIN public.posts p ON ph.post_id = p.id
GROUP BY h.id
ORDER BY uses_past_week DESC, total_uses DESC;

-- Re-building View 5: Comprehensive Club Operational Compliance reporting view
CREATE OR REPLACE VIEW public.view_reporting_organization_compliance AS
SELECT 
    c.id AS club_id,
    c.club_name,
    c.category AS club_category,
    COUNT(DISTINCT e.id) AS total_events_hosted,
    COUNT(DISTINCT e.id) FILTER (WHERE e.end_time < CURRENT_TIMESTAMP) AS past_events_count,
    COUNT(DISTINCT e.id) FILTER (WHERE e.end_time >= CURRENT_TIMESTAMP) AS upcoming_events_count,
    COALESCE(SUM(CASE WHEN e.end_time < CURRENT_TIMESTAMP THEN e.capacity ELSE 0 END), 0) AS cumulative_allocated_capacity,
    COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'approved') AS total_verified_rsvps,
    CASE 
        WHEN COALESCE(SUM(CASE WHEN e.end_time < CURRENT_TIMESTAMP THEN e.capacity ELSE 0 END), 0) = 0 THEN 0.00
        ELSE ROUND((COUNT(DISTINCT er.id) FILTER (WHERE er.status = 'approved')::NUMERIC / COALESCE(SUM(CASE WHEN e.end_time < CURRENT_TIMESTAMP THEN e.capacity ELSE 0 END), 1)::NUMERIC) * 100, 2)
    END AS average_occupancy_percentage
FROM public.clubs c
LEFT JOIN public.events e ON c.id = e.club_id
LEFT JOIN public.event_requests er ON e.id = er.event_id
GROUP BY c.id;

-- Re-building View 6: Audit Queue View Modifying Configuration Checks
CREATE OR REPLACE VIEW public.view_moderation_audit_queue AS
SELECT 
    p.id AS post_id,
    SUBSTRING(p.content FROM 1 FOR 50) AS post_snippet,
    s.id AS author_id,
    prof.full_name AS author_name,
    p.created_at AS submitted_at,
    COUNT(DISTINCT c.id) AS total_comments_count
FROM public.posts p
JOIN public.students s ON p.student_id = s.id
JOIN public.profiles prof ON s.id = prof.id
LEFT JOIN public.comments c ON p.id = c.post_id
GROUP BY p.id, s.id, prof.full_name;


-- Issue B: RLS Policy Discrepancies and Missing Tables
-- Part 11 references table targets "public.organizations", "public.post_likes", and "public.chat_members" which do not exist.
-- The unified setup in Parts 1-5 named these tables "public.clubs", "public.likes", and "public.chat_room_members".
-- Let us resolve all missing table hooks or incorrect mapping targets.

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;

-- Drop obsolete broken policy binds to clean layout state
DROP POLICY IF EXISTS "Allow anyone to view registered campus organizations" ON public.clubs;
DROP POLICY IF EXISTS "Allow admin to manage organization structural definitions" ON public.clubs;
DROP POLICY IF EXISTS "Allow transparent discovery over aggregated post liking matrices" ON public.likes;
DROP POLICY IF EXISTS "Allow toggle execution rules for liking records on feed posts" ON public.likes;
DROP POLICY IF EXISTS "Allow students to revoke personal connection likes signatures" ON public.likes;
DROP POLICY IF EXISTS "Allow participating room members to inspect peer manifest lists" ON public.chat_room_members;
DROP POLICY IF EXISTS "Allow room initialization join parameters logic tracking" ON public.chat_room_members;
DROP POLICY IF EXISTS "Allow registered club managers creation rules across club events" ON public.events;
DROP POLICY IF EXISTS "Allow organization leads complete mutations over event configurations" ON public.events;
DROP POLICY IF EXISTS "Allow applicants and hosts to filter single submission records" ON public.event_requests;
DROP POLICY IF EXISTS "Allow host controllers to update registration request states" ON public.event_requests;
DROP POLICY IF EXISTS "Allow matching club manager insertion into active streams" ON public.club_posts;
DROP POLICY IF EXISTS "Allow modifications tracking to club operational content posters" ON public.club_posts;

-- Re-map correct RLS Rules for clubs
CREATE POLICY "Allow anyone to view registered campus clubs"
    ON public.clubs FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage club structural definitions"
    ON public.clubs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Re-map correct RLS Rules for likes
CREATE POLICY "Allow open evaluation of likes matrix"
    ON public.likes FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to handle likes generation"
    ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to remove personal likes"
    ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Re-map correct RLS Rules for chat_room_members
CREATE POLICY "Allow members to inspect peer manifest lists"
    ON public.chat_room_members FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.chat_room_members AS internal 
        WHERE internal.room_id = room_id AND internal.user_id = auth.uid()
    ));

CREATE POLICY "Allow users to join chat rooms"
    ON public.chat_room_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Re-map correct RLS Rules for events (Clubs act as organizers)
CREATE POLICY "Allow club managers creation rules across club events"
    ON public.events FOR INSERT
    WITH CHECK (auth.uid() = club_id);

CREATE POLICY "Allow club managers mutations over event configurations"
    ON public.events FOR UPDATE
    USING (auth.uid() = club_id);

-- Re-map correct RLS Rules for event_requests
CREATE POLICY "Allow applicants and hosts to filter single submission records"
    ON public.event_requests FOR SELECT
    USING (auth.uid() = student_id OR auth.uid() = (SELECT club_id FROM public.events WHERE id = event_id));

CREATE POLICY "Allow host club controllers to update registration request states"
    ON public.event_requests FOR UPDATE
    USING (auth.uid() = (SELECT club_id FROM public.events WHERE id = event_id));

-- Re-map correct RLS Rules for club_posts
CREATE POLICY "Allow matching club manager insertion into active streams"
    ON public.club_posts FOR INSERT
    WITH CHECK (auth.uid() = club_id);

CREATE POLICY "Allow modifications tracking to club operational content posters"
    ON public.club_posts FOR UPDATE
    USING (auth.uid() = club_id);


-- Issue C: Performance & Architectural Improvements
-- Add a unique constraint to ensure a user cannot like a post multiple times (Implicitly handled by composite PK but explicit index protects index state).
-- Enforce explicit indexes on conditional checks to boost performance in high concurrency tracking.

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_chat_room_member_pair 
    ON public.chat_room_members(room_id, user_id);

-- Enforce optimization boundary for foreign keys mapping to guarantee index safety across 100% of joints
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON public.post_hashtags(hashtag_id);

COMMIT;

-- Final output state definition string trigger
SELECT 'Campus Buzz – NIT Raipur PostgreSQL Database Generation Completed Successfully.' AS status_report;

-- ==========================================
-- UPGRADE SCRIPT: CAMPUS BUZZ HASHTAG & CHAT ARCHITECTURE
-- ==========================================

BEGIN;

-- ------------------------------------------
-- 1. CLEANUP OF LEGACY AUTOMATION
-- ------------------------------------------

-- Remove global automated chat channel subscriptions[cite: 60, 62].
DROP TRIGGER IF EXISTS secure_auto_join_channels ON public.profiles;
DROP FUNCTION IF EXISTS public.auto_subscribe_user_to_campus_channels();

-- Remove legacy global chat room initialization[cite: 52, 63].
DROP FUNCTION IF EXISTS public.initialize_automated_campus_channels();

-- Remove legacy regex hashtag parsing pipeline[cite: 74, 78].
DROP TRIGGER IF EXISTS process_post_content_hashtags ON public.posts;
DROP FUNCTION IF EXISTS public.process_post_hashtags_stream();

-- Destroy existing global automated rooms (e.g., #foodsplit global)[cite: 54, 56, 58].
DELETE FROM public.chat_rooms WHERE type = 'automated';


-- ------------------------------------------
-- 2. HASHTAG SYSTEM RECONSTRUCTION
-- ------------------------------------------

-- Drop the old junction table since the relationship is now 1:1[cite: 13].
DROP TABLE IF EXISTS public.post_hashtags CASCADE;

-- Modify existing hashtags table structure[cite: 12].
ALTER TABLE public.hashtags DROP CONSTRAINT IF EXISTS check_tag_format;
ALTER TABLE public.hashtags RENAME COLUMN tag TO name;

ALTER TABLE public.hashtags 
    ADD COLUMN display_name VARCHAR(100),
    ADD COLUMN auto_create_chat BOOLEAN DEFAULT FALSE,
    ADD COLUMN expiry_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN default_expiry_minutes INT,
    ADD COLUMN min_expiry_minutes INT,
    ADD COLUMN max_expiry_minutes INT,
    ADD COLUMN contact_display BOOLEAN DEFAULT FALSE,
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Wipe existing free-form tags to enforce strictly controlled tags.
DELETE FROM public.hashtags;

-- Seed the 5 absolute system hashtags.
INSERT INTO public.hashtags (
    id, name, display_name, auto_create_chat, expiry_enabled, 
    default_expiry_minutes, min_expiry_minutes, max_expiry_minutes, contact_display
) VALUES 
(gen_random_uuid(), 'foodsplit', 'Food Split', true, true, 1440, 10, 2880, false),
(gen_random_uuid(), 'cabsplit', 'Cab Split', true, true, 1440, 10, 2880, false),
(gen_random_uuid(), 'resell', 'Resell', true, false, NULL, NULL, NULL, false),
(gen_random_uuid(), 'lost', 'Lost', false, false, NULL, NULL, NULL, true),
(gen_random_uuid(), 'found', 'Found', false, false, NULL, NULL, NULL, true);


-- ------------------------------------------
-- 3. POSTS TABLE ENHANCEMENTS
-- ------------------------------------------

-- Add necessary attributes for the new structure[cite: 11].
ALTER TABLE public.posts 
    ADD COLUMN title VARCHAR(255),
    ADD COLUMN description TEXT,
    ADD COLUMN image_url TEXT,
    ADD COLUMN hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE RESTRICT,
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Safely migrate existing posts to a default system tag to allow NOT NULL constraint.
UPDATE public.posts 
SET hashtag_id = (SELECT id FROM public.hashtags WHERE name = 'resell') 
WHERE hashtag_id IS NULL;

-- Lock down the schema to enforce exact 1:1 hashtag association.
ALTER TABLE public.posts ALTER COLUMN hashtag_id SET NOT NULL;


-- ------------------------------------------
-- 4. CHAT ROOMS & MESSAGES UPGRADE
-- ------------------------------------------

-- Attach chat rooms strictly to specific posts[cite: 16].
ALTER TABLE public.chat_rooms 
    ADD COLUMN post_id UUID UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
    ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD COLUMN status VARCHAR(20) DEFAULT 'open',
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Optional image functionality for messages[cite: 18].
ALTER TABLE public.chat_messages 
    ADD COLUMN image_url TEXT;


-- ------------------------------------------
-- 5. TRIGGERS & VALIDATION CONSTRAINTS
-- ------------------------------------------

-- Validates expiry windows and enforces hashtag behaviors before saving a post.
CREATE OR REPLACE FUNCTION public.validate_post_configuration()
RETURNS TRIGGER AS $$
DECLARE
    tag_config RECORD;
    requested_expiry_mins INT;
BEGIN
    SELECT * INTO tag_config FROM public.hashtags WHERE id = NEW.hashtag_id;
    
    IF tag_config.expiry_enabled THEN
        IF NEW.expires_at IS NULL THEN
            NEW.expires_at := CURRENT_TIMESTAMP + (tag_config.default_expiry_minutes || ' minutes')::INTERVAL;
        END IF;
        
        requested_expiry_mins := EXTRACT(EPOCH FROM (NEW.expires_at - CURRENT_TIMESTAMP)) / 60;
        
        IF requested_expiry_mins < tag_config.min_expiry_minutes OR requested_expiry_mins > tag_config.max_expiry_minutes THEN
            RAISE EXCEPTION 'Expiry for % must be strictly between % and % minutes', tag_config.name, tag_config.min_expiry_minutes, tag_config.max_expiry_minutes;
        END IF;
    ELSE
        -- Force NULL for Resell, Lost, Found
        NEW.expires_at := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_post_configurations
    BEFORE INSERT OR UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.validate_post_configuration();

-- Intercepts post creation and automatically spins up dedicated chat rooms based on the tag rules.
CREATE OR REPLACE FUNCTION public.trigger_create_chat_room_for_post()
RETURNS TRIGGER AS $$
DECLARE
    tag_config RECORD;
BEGIN
    SELECT * INTO tag_config FROM public.hashtags WHERE id = NEW.hashtag_id;
    
    IF tag_config.auto_create_chat THEN
        INSERT INTO public.chat_rooms (title, type, post_id, created_by, status)
        VALUES (COALESCE(NEW.title, 'Discussion Room'), 'group', NEW.id, NEW.student_id, 'open');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_post_insert_chat_creation
    AFTER INSERT ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.trigger_create_chat_room_for_post();


-- ------------------------------------------
-- 6. CORE FUNCTIONS (API WRAPPERS)
-- ------------------------------------------

CREATE OR REPLACE FUNCTION public.join_chat_room(target_room_id UUID, target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.chat_room_members(room_id, user_id)
    VALUES (target_room_id, target_user_id)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.leave_chat_room(target_room_id UUID, target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.chat_room_members WHERE room_id = target_room_id AND user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_chat_member(target_room_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = target_room_id AND user_id = target_user_id);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.close_chat_room(target_room_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.chat_rooms SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = target_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reopen_chat_room(target_room_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.chat_rooms SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = target_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_post_hashtag(target_post_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    found_tag VARCHAR;
BEGIN
    SELECT h.name INTO found_tag FROM public.hashtags h 
    JOIN public.posts p ON h.id = p.hashtag_id 
    WHERE p.id = target_post_id;
    RETURN found_tag;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.expire_post(target_post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = target_post_id;
    UPDATE public.chat_rooms SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE post_id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------
-- 7. PG_CRON EXPIRY AUTOMATION
-- ------------------------------------------

CREATE OR REPLACE FUNCTION public.process_automatic_post_expiries()
RETURNS VOID AS $$
BEGIN
    -- Only affects posts where expiry_enabled is true (via internal validation state)
    UPDATE public.posts 
    SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP AND is_active = TRUE;

    -- Close associated chat rooms for expired posts
    UPDATE public.chat_rooms cr
    SET status = 'closed', updated_at = CURRENT_TIMESTAMP
    FROM public.posts p
    WHERE cr.post_id = p.id AND p.is_active = FALSE AND cr.status = 'open';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cleanup job to run every 15 minutes[cite: 66].
SELECT cron.schedule('process_post_expiries', '*/15 * * * *', 'SELECT public.process_automatic_post_expiries();');


-- ------------------------------------------
-- 8. INDEXES & PERFORMANCE
-- ------------------------------------------

CREATE INDEX IF NOT EXISTS idx_posts_hashtag_id ON public.posts(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON public.posts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_is_active ON public.posts(is_active);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hashtags_name ON public.hashtags(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_rooms_post_id ON public.chat_rooms(post_id);

-- Composite optimizations
CREATE INDEX IF NOT EXISTS idx_posts_hashtag_active ON public.posts(hashtag_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON public.chat_messages(room_id, created_at DESC);

-- GIN Full Text Search [cite: 31]
CREATE INDEX IF NOT EXISTS idx_posts_search_trgm ON public.posts USING gin ((COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || content) gin_trgm_ops);


-- ------------------------------------------
-- 9. SPECIALIZED VIEWS
-- ------------------------------------------

CREATE OR REPLACE VIEW public.active_foodsplit_posts AS
SELECT p.* FROM public.posts p
JOIN public.hashtags h ON p.hashtag_id = h.id
WHERE h.name = 'foodsplit' AND p.is_active = TRUE;

CREATE OR REPLACE VIEW public.active_cabsplit_posts AS
SELECT p.* FROM public.posts p
JOIN public.hashtags h ON p.hashtag_id = h.id
WHERE h.name = 'cabsplit' AND p.is_active = TRUE;

CREATE OR REPLACE VIEW public.active_resell_posts AS
SELECT p.* FROM public.posts p
JOIN public.hashtags h ON p.hashtag_id = h.id
WHERE h.name = 'resell' AND p.is_active = TRUE;

CREATE OR REPLACE VIEW public.lost_posts AS
SELECT p.* FROM public.posts p
JOIN public.hashtags h ON p.hashtag_id = h.id
WHERE h.name = 'lost' AND p.is_active = TRUE;

CREATE OR REPLACE VIEW public.found_posts AS
SELECT p.* FROM public.posts p
JOIN public.hashtags h ON p.hashtag_id = h.id
WHERE h.name = 'found' AND p.is_active = TRUE;

CREATE OR REPLACE VIEW public.expired_posts AS
SELECT * FROM public.posts WHERE is_active = FALSE OR (expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP);

CREATE OR REPLACE VIEW public.active_chat_rooms AS
SELECT cr.* FROM public.chat_rooms cr
JOIN public.posts p ON cr.post_id = p.id
WHERE cr.status = 'open' AND p.is_active = TRUE;

CREATE OR REPLACE VIEW public.popular_foodsplit_posts AS
SELECT p.id, p.title, COUNT(crm.user_id) AS total_participants
FROM public.posts p
JOIN public.hashtags h ON p.hashtag_id = h.id
JOIN public.chat_rooms cr ON p.id = cr.post_id
LEFT JOIN public.chat_room_members crm ON cr.id = crm.room_id
WHERE h.name = 'foodsplit' AND p.is_active = TRUE
GROUP BY p.id, p.title
ORDER BY total_participants DESC;


-- ------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) OVERRIDES
-- ------------------------------------------

-- Cleanup outdated generic policies[cite: 90, 91].
DROP POLICY IF EXISTS "Allow chat read" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow chat members read" ON public.chat_room_members;
DROP POLICY IF EXISTS "Allow members to inspect peer manifest lists" ON public.chat_room_members;

-- Chat Rooms
CREATE POLICY "Allow members to view their specific chat rooms"
    ON public.chat_rooms FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = id AND user_id = auth.uid()));

CREATE POLICY "Allow post owners and admins to alter room states"
    ON public.chat_rooms FOR UPDATE
    USING (created_by = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Allow post owners and admins to terminate rooms"
    ON public.chat_rooms FOR DELETE
    USING (created_by = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Chat Room Members 
CREATE POLICY "Allow members to see other room participants"
    ON public.chat_room_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.chat_room_members AS crm WHERE crm.room_id = public.chat_room_members.room_id AND crm.user_id = auth.uid()));

-- Messages
CREATE POLICY "Allow chat members to read encrypted stream"
    ON public.chat_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.chat_room_members WHERE room_id = public.chat_messages.room_id AND user_id = auth.uid()));

CREATE POLICY "Allow active members to broadcast messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.chat_room_members crm 
        JOIN public.chat_rooms cr ON crm.room_id = cr.id 
        WHERE crm.room_id = chat_messages.room_id AND crm.user_id = auth.uid() AND cr.status = 'open'
    ));

COMMIT;