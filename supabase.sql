-- =========================================================
-- promme — Supabase 테이블 설정
-- Supabase 대시보드 → SQL Editor → New query 에 전부 붙여넣고 Run
-- =========================================================

-- MY 아카이브 폴더
create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 30),
  emoji       text not null default '📁',
  created_at  timestamptz not null default now()
);

-- 폴더에 담은 프롬프트 (프롬프트 하나는 폴더 하나에만 들어감)
create table if not exists public.saves (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prompt_id   int  not null,
  folder_id   uuid not null references public.folders (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, prompt_id)
);

create index if not exists folders_user_idx on public.folders (user_id);
create index if not exists saves_folder_idx on public.saves (folder_id);

-- Data API 접근 권한 ("Automatically expose new tables"를 꺼둔 경우 필요)
grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.saves   to authenticated;

-- 행 단위 보안: 로그인한 본인 데이터만 읽고 쓸 수 있음
alter table public.folders enable row level security;
alter table public.saves   enable row level security;

drop policy if exists "folders: own rows" on public.folders;
create policy "folders: own rows" on public.folders
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "saves: own rows" on public.saves;
create policy "saves: own rows" on public.saves
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
