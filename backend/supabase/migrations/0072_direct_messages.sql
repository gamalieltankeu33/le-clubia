-- =============================================================================
-- Migration 0072: Messagerie Privée Directe (DMs - 1-on-1 Messenger)
-- =============================================================================

-- 1. Table des conversations
CREATE TABLE IF NOT EXISTS public.direct_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_text TEXT NOT NULL DEFAULT '',
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_conversation_pair UNIQUE (user1_id, user2_id)
);

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_direct_conv_user1 ON public.direct_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_direct_conv_user2 ON public.direct_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_direct_conv_last_at ON public.direct_conversations(last_message_at DESC);

-- 2. Table des messages directs
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    deleted_by_sender BOOLEAN NOT NULL DEFAULT false,
    deleted_by_receiver BOOLEAN NOT NULL DEFAULT false
);

-- Index pour filtrage des messages par discussion
CREATE INDEX IF NOT EXISTS idx_direct_messages_conv ON public.direct_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON public.direct_messages(receiver_id, is_read);

-- 3. Row Level Security (RLS)
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Polices pour direct_conversations
CREATE POLICY "Users can view their conversations"
    ON public.direct_conversations FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert conversations they belong to"
    ON public.direct_conversations FOR INSERT
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations"
    ON public.direct_conversations FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their conversations"
    ON public.direct_conversations FOR DELETE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Polices pour direct_messages
CREATE POLICY "Users can view messages in their conversations"
    ON public.direct_messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages in their conversations"
    ON public.direct_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
    ON public.direct_messages FOR UPDATE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete messages"
    ON public.direct_messages FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 4. Publication Realtime Supabase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversations;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already added
END $$;
