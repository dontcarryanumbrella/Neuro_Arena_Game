-- Neuro Arena online: run this once in your Supabase project's SQL editor.
-- Players sign in anonymously, pick a username, form parties of two and start matches.
-- Every fight runs on each player's own screen from the same seed, so the database only
-- carries usernames, party invites, the fighters themselves, and which match to play.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

-- each player's current fighter: its brain, abilities, talents, special and skin
create table if not exists public.fighters (
  owner uuid primary key references public.profiles on delete cascade,
  card jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  leader uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now()
);

-- a player belongs to at most one party
create table if not exists public.party_members (
  user_id uuid primary key references public.profiles on delete cascade,
  party_id uuid not null references public.parties on delete cascade,
  joined_at timestamptz not null default now()
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles on delete cascade,
  to_user uuid not null references public.profiles on delete cascade,
  party_id uuid not null references public.parties on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties on delete cascade,
  created_by uuid not null references public.profiles on delete cascade,
  mode text not null check (mode in ('duel', 'coop')),
  seed integer not null,
  foes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.fighters enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.invites enable row level security;
alter table public.matches enable row level security;

-- is the signed-in player in this party?
create or replace function public.in_party(p uuid) returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists (select 1 from party_members where party_id = p and user_id = auth.uid()) $$;

-- profiles: anyone signed in can find anyone; you edit only your own
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

-- fighters: readable by anyone signed in (an opponent needs yours); you write only your own
create policy "fighters readable" on public.fighters for select to authenticated using (true);
create policy "own fighter insert" on public.fighters for insert to authenticated with check (owner = auth.uid());
create policy "own fighter update" on public.fighters for update to authenticated using (owner = auth.uid());

-- parties: you lead your own
create policy "parties readable" on public.parties for select to authenticated using (true);
create policy "lead own party" on public.parties for insert to authenticated with check (leader = auth.uid());
create policy "disband own party" on public.parties for delete to authenticated using (leader = auth.uid());

-- members: you join your own party or one you were invited to; you leave on your own, and a leader can remove others
create policy "members readable" on public.party_members for select to authenticated using (true);
create policy "join party" on public.party_members for insert to authenticated with check (
  user_id = auth.uid() and (
    exists (select 1 from parties p where p.id = party_id and p.leader = auth.uid())
    or exists (select 1 from invites i where i.party_id = party_members.party_id and i.to_user = auth.uid() and i.status in ('pending', 'accepted'))
  ));
create policy "leave party" on public.party_members for delete to authenticated using (
  user_id = auth.uid() or exists (select 1 from parties p where p.id = party_id and p.leader = auth.uid()));

-- invites: only the two people involved see one; you invite into your own party; the invited one answers
create policy "own invites" on public.invites for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());
create policy "send invite" on public.invites for insert to authenticated with check (from_user = auth.uid() and public.in_party(party_id));
create policy "answer invite" on public.invites for update to authenticated using (to_user = auth.uid());
create policy "drop invite" on public.invites for delete to authenticated using (from_user = auth.uid() or to_user = auth.uid());

-- matches: only the party sees and starts them
create policy "party matches" on public.matches for select to authenticated using (public.in_party(party_id));
create policy "start match" on public.matches for insert to authenticated with check (created_by = auth.uid() and public.in_party(party_id));

-- live updates for invites, party changes and new matches
alter publication supabase_realtime add table public.invites, public.party_members, public.matches;
