import { supabase } from './supabase'
import { fetchPublicProfile } from './public-profile'

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
  is_edited?: boolean
}

export interface DirectConversation {
  id: string
  user1_id: string
  user2_id: string
  last_message_text: string
  last_message_at: string
  other_user: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    is_verified: boolean
  }
  unread_count?: number
}

const LOCAL_STORAGE_KEY_CONVS = 'clubia_direct_conversations_v1'
const LOCAL_STORAGE_KEY_MSGS = 'clubia_direct_messages_v1'

function getLocalConversations(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CONVS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalConversations(convs: any[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_CONVS, JSON.stringify(convs))
  } catch (e) {
    console.error(e)
  }
}

function getLocalMessages(): DirectMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_MSGS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalMessages(msgs: DirectMessage[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_MSGS, JSON.stringify(msgs))
  } catch (e) {
    console.error(e)
  }
}

/**
 * Get or create a conversation between 2 users
 */
export async function getOrCreateConversation(
  currentUserId: string,
  targetUserId: string,
): Promise<string> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    throw new Error('Utilisateurs invalides pour la discussion')
  }

  // 1. Try Supabase
  try {
    const { data: existing, error } = await supabase
      .from('direct_conversations' as any)
      .select('id')
      .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUserId})`)
      .maybeSingle()

    if (!error && existing) {
      return (existing as any).id
    }

    if (!error) {
      const { data: created, error: createErr } = await supabase
        .from('direct_conversations' as any)
        .insert({
          user1_id: currentUserId,
          user2_id: targetUserId,
          last_message_text: '',
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (!createErr && created) {
        return (created as any).id
      }
    }
  } catch (e) {
    console.warn('Supabase DB not available, using local fallback:', e)
  }

  // 2. Local Storage Fallback
  const localConvs = getLocalConversations()
  let found = localConvs.find(
    (c) =>
      (c.user1_id === currentUserId && c.user2_id === targetUserId) ||
      (c.user1_id === targetUserId && c.user2_id === currentUserId),
  )

  if (!found) {
    const newId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    found = {
      id: newId,
      user1_id: currentUserId,
      user2_id: targetUserId,
      last_message_text: '',
      last_message_at: new Date().toISOString(),
    }
    localConvs.unshift(found)
    saveLocalConversations(localConvs)
  }

  return found.id
}

/**
 * Fetch all conversations for current user with unread counts
 */
export async function fetchUserConversations(
  currentUserId: string,
): Promise<DirectConversation[]> {
  if (!currentUserId) return []

  const results: DirectConversation[] = []
  let rawConvs: any[] = []

  try {
    const { data, error } = await supabase
      .from('direct_conversations' as any)
      .select('*')
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .order('last_message_at', { ascending: false })

    if (!error && data) {
      rawConvs = data
    }
  } catch (e) {
    console.warn('Supabase convs error:', e)
  }

  if (rawConvs.length === 0) {
    const localConvs = getLocalConversations()
    rawConvs = localConvs.filter(
      (c) => c.user1_id === currentUserId || c.user2_id === currentUserId,
    )
  }

  // Populate profile info & unread message count
  const allMsgs = getLocalMessages()

  for (const c of rawConvs) {
    const otherId = c.user1_id === currentUserId ? c.user2_id : c.user1_id
    const otherProfile = await fetchPublicProfile(otherId)

    // Calculate unread count
    const unreadCount = allMsgs.filter(
      (m) => m.conversation_id === c.id && m.receiver_id === currentUserId && !m.is_read,
    ).length

    results.push({
      id: c.id,
      user1_id: c.user1_id,
      user2_id: c.user2_id,
      last_message_text: c.last_message_text || 'Nouvelle discussion',
      last_message_at: c.last_message_at || c.created_at || new Date().toISOString(),
      unread_count: unreadCount,
      other_user: {
        id: otherId,
        first_name: otherProfile?.first_name || 'Membre',
        last_name: otherProfile?.last_name || '',
        avatar_url: otherProfile?.avatar_url || null,
        is_verified: otherProfile?.is_verified || false,
      },
    })
  }

  return results.sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
  )
}

/**
 * Fetch messages for a conversation
 */
export async function fetchConversationMessages(
  conversationId: string,
): Promise<DirectMessage[]> {
  if (!conversationId) return []

  try {
    const { data, error } = await supabase
      .from('direct_messages' as any)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      return data as DirectMessage[]
    }
  } catch (e) {
    console.warn('Supabase msgs error:', e)
  }

  const allLocalMsgs = getLocalMessages()
  return allLocalMsgs
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

/**
 * Send a new message
 */
export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
): Promise<DirectMessage> {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Le message ne peut pas être vide')

  const now = new Date().toISOString()
  const newMsg: DirectMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    conversation_id: conversationId,
    sender_id: senderId,
    receiver_id: receiverId,
    content: trimmed,
    created_at: now,
    is_read: false,
  }

  try {
    const { data, error } = await supabase
      .from('direct_messages' as any)
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: trimmed,
      })
      .select('*')
      .single()

    if (!error && data) {
      await supabase
        .from('direct_conversations' as any)
        .update({
          last_message_text: trimmed,
          last_message_at: now,
        })
        .eq('id', conversationId)

      return data as DirectMessage
    }
  } catch (e) {
    console.warn('Supabase insert message error, using local fallback:', e)
  }

  const localMsgs = getLocalMessages()
  localMsgs.push(newMsg)
  saveLocalMessages(localMsgs)

  const localConvs = getLocalConversations()
  const convIndex = localConvs.findIndex((c) => c.id === conversationId)
  if (convIndex !== -1) {
    localConvs[convIndex].last_message_text = trimmed
    localConvs[convIndex].last_message_at = now
    saveLocalConversations(localConvs)
  }

  return newMsg
}

/**
 * Edit an existing message
 */
export async function updateDirectMessage(
  messageId: string,
  newContent: string,
): Promise<void> {
  const trimmed = newContent.trim()
  if (!trimmed) return

  try {
    await supabase
      .from('direct_messages' as any)
      .update({
        content: trimmed,
        is_edited: true,
      })
      .eq('id', messageId)
  } catch (e) {
    console.warn(e)
  }

  const localMsgs = getLocalMessages()
  const msgIndex = localMsgs.findIndex((m) => m.id === messageId)
  if (msgIndex !== -1) {
    localMsgs[msgIndex].content = trimmed
    localMsgs[msgIndex].is_edited = true
    saveLocalMessages(localMsgs)
  }
}

/**
 * Delete a message
 */
export async function deleteDirectMessage(messageId: string): Promise<void> {
  try {
    await supabase
      .from('direct_messages' as any)
      .delete()
      .eq('id', messageId)
  } catch (e) {
    console.warn(e)
  }

  const localMsgs = getLocalMessages()
  const filtered = localMsgs.filter((m) => m.id !== messageId)
  saveLocalMessages(filtered)
}

/**
 * Delete an entire conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    await supabase
      .from('direct_messages' as any)
      .delete()
      .eq('conversation_id', conversationId)

    await supabase
      .from('direct_conversations' as any)
      .delete()
      .eq('id', conversationId)
  } catch (e) {
    console.warn(e)
  }

  const localMsgs = getLocalMessages().filter((m) => m.conversation_id !== conversationId)
  saveLocalMessages(localMsgs)

  const localConvs = getLocalConversations().filter((c) => c.id !== conversationId)
  saveLocalConversations(localConvs)
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(
  conversationId: string,
  currentUserId: string,
): Promise<void> {
  try {
    await supabase
      .from('direct_messages' as any)
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', currentUserId)
  } catch (e) {
    console.warn(e)
  }

  const localMsgs = getLocalMessages()
  let changed = false
  localMsgs.forEach((m) => {
    if (m.conversation_id === conversationId && m.receiver_id === currentUserId && !m.is_read) {
      m.is_read = true
      changed = true
    }
  })
  if (changed) {
    saveLocalMessages(localMsgs)
  }
}
