import { supabase, isSupabaseConfigured } from './supabase';

export type NoticeType = 'info' | 'event' | 'warning';

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  pinned: boolean;
  active: boolean;
  startsAt: number;
  endsAt: number | null;
  createdAt: number;
}

type Row = {
  id: string;
  title: string;
  content: string;
  type: NoticeType;
  pinned: boolean;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

function toNotice(r: Row): Notice {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    type: r.type,
    pinned: r.pinned,
    active: r.active,
    startsAt: new Date(r.starts_at).getTime(),
    endsAt: r.ends_at ? new Date(r.ends_at).getTime() : null,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function listActiveNotices(): Promise<Notice[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toNotice);
}

export async function listAllNotices(): Promise<Notice[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(toNotice);
}

export async function getPinnedNotice(): Promise<Notice | null> {
  const notices = await listActiveNotices();
  return notices.find((n) => n.pinned) ?? null;
}

export async function createNotice(input: {
  title: string;
  content: string;
  type: NoticeType;
  pinned: boolean;
  endsAt?: string | null;
}) {
  const { error } = await supabase.from('notices').insert({
    title: input.title,
    content: input.content,
    type: input.type,
    pinned: input.pinned,
    ends_at: input.endsAt ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function updateNotice(id: string, patch: Partial<{ active: boolean; pinned: boolean }>) {
  const { error } = await supabase.from('notices').update(patch).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}

export async function deleteNotice(id: string) {
  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, error: null };
}
