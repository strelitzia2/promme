-- =========================================================
-- promme — 2단계: 최고 관리자 · 관리자 · 사용자 프롬프트 공유 · 뉴스 관리
-- supabase.sql(1단계)을 실행한 뒤, SQL Editor에서 이 파일 전체를 한 번 실행하세요.
-- 맨 아래 "최고 관리자 지정"의 이메일만 본인 것으로 바꿔서 실행합니다.
-- 여러 번 실행해도 안전합니다(이미 만든 표·데이터는 그대로 두고 빠진 것만 채움).
--
-- 역할
--   최고 관리자(owner): 관리자 권한을 주거나 뺏을 수 있음 + 관리자가 하는 모든 일
--   관리자(admin)     : 투고 승인·반려, 프롬프트 수정·숨김·삭제, 뉴스 숨김·수정
--   최고 관리자 지정·해제는 이 SQL Editor에서만 할 수 있습니다(화면에서는 불가).
-- =========================================================

-- ---------- 관리자 명단 ----------
-- 이 표는 화면(앱)에서 직접 고칠 수 없습니다.
-- 관리자 추가·해제는 아래 admin_grant / admin_revoke 함수(최고 관리자만 실행 가능)로만 합니다.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin' check (role in ('owner', 'admin')),
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
-- 예전 버전(역할 칸 없음)을 이미 실행했다면 칸만 추가
alter table public.admins add column if not exists role text not null default 'admin';
alter table public.admins add column if not exists granted_by uuid references auth.users (id) on delete set null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'admins_role_check' and conrelid = 'public.admins'::regclass) then
    alter table public.admins add constraint admins_role_check check (role in ('owner', 'admin'));
  end if;
end $$;
alter table public.admins enable row level security;
drop policy if exists "admins: read self" on public.admins;
create policy "admins: read self" on public.admins
  for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.admins to authenticated;

-- 지금 로그인한 사람이 관리자인지 (서버에서 판단)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 지금 로그인한 사람이 최고 관리자인지
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()) and role = 'owner');
$$;
revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- ---------- 관리자 관리 (최고 관리자 전용) ----------
-- 관리자 명단: 이메일이 들어 있어서 최고 관리자만 볼 수 있음
create or replace function public.admin_list()
returns table (user_id uuid, email text, nickname text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  return query
    select a.user_id, u.email::text, p.nickname, a.role, a.created_at
    from public.admins a
    join auth.users u on u.id = a.user_id
    left join public.profiles p on p.id = a.user_id
    order by (a.role = 'owner') desc, a.created_at;
end $$;

-- 가입한 이메일로 관리자 추가 (항상 '관리자'로만 추가됨. 최고 관리자는 SQL에서만)
create or replace function public.admin_grant(target_email text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  target uuid;
begin
  if not public.is_owner() then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  select u.id into target from auth.users u where lower(u.email) = lower(trim(target_email)) limit 1;
  if target is null then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.admins a where a.user_id = target) then
    raise exception 'already_admin' using errcode = 'P0001';
  end if;
  insert into public.admins (user_id, role, granted_by) values (target, 'admin', (select auth.uid()));
  return target;
end $$;

-- 관리자 권한 해제 (최고 관리자는 해제할 수 없음 → 본인이나 다른 최고 관리자를 실수로 빼는 일 방지)
create or replace function public.admin_revoke(target uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_owner() then
    raise exception 'not_owner' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.admins a where a.user_id = target and a.role = 'owner') then
    raise exception 'cannot_revoke_owner' using errcode = 'P0001';
  end if;
  delete from public.admins a where a.user_id = target;
end $$;

revoke all on function public.admin_list() from public, anon;
revoke all on function public.admin_grant(text) from public, anon;
revoke all on function public.admin_revoke(uuid) from public, anon;
grant execute on function public.admin_list() to authenticated;
grant execute on function public.admin_grant(text) to authenticated;
grant execute on function public.admin_revoke(uuid) to authenticated;

-- ---------- 닉네임 ----------
create table if not exists public.profiles (
  id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nickname   text not null unique
             check (char_length(nickname) between 2 and 16 and nickname ~ '^[0-9A-Za-z가-힣_]+$'),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles: public read" on public.profiles;
create policy "profiles: public read" on public.profiles for select to anon, authenticated using (true);
drop policy if exists "profiles: insert self" on public.profiles;
create policy "profiles: insert self" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
drop policy if exists "profiles: update self" on public.profiles;
create policy "profiles: update self" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

-- ---------- 프롬프트 ----------
-- status: pending(승인 대기) / approved(공개) / rejected(반려) / hidden(관리자가 숨김)
create table if not exists public.prompts (
  id            bigint generated by default as identity primary key,
  title         text not null check (char_length(title) between 2 and 40),
  cat           text not null check (cat in ('sns', 'life', 'study', 'image')),
  tool          text not null check (char_length(tool) between 1 and 20),
  body          text not null check (char_length(body) between 10 and 2000),
  art           text not null default '✨'
                check (art in ('✨','🧸','📸','🌸','💭','🏃','🍱','📚','🎤','🎨','💡','🎬','🎧','💼','🗺️','🧪')),
  theme         smallint not null default 0 check (theme between 0 and 7),
  img           text check (img is null or img ~ '^images/[a-z0-9_-]+\.(webp|png|jpg)$'),
  saves_label   text check (char_length(saves_label) <= 10),
  author_id     uuid default auth.uid() references public.profiles (id) on delete set null,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  reject_reason text check (char_length(reject_reason) <= 200),
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);
create index if not exists prompts_status_idx on public.prompts (status, created_at desc);
create index if not exists prompts_author_idx on public.prompts (author_id);

-- 일반 사용자가 올릴 때는 항상 '승인 대기'로 고정하고, 대기 글은 1인 5개까지
create or replace function public.prompts_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() then   -- SQL Editor 또는 관리자
    return new;
  end if;
  new.author_id := auth.uid();
  new.status := 'pending';
  new.img := null;
  new.saves_label := null;
  new.reject_reason := null;
  new.reviewed_at := null;
  if (select count(*) from public.prompts where author_id = new.author_id and status = 'pending') >= 5 then
    raise exception 'too_many_pending' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists prompts_before_insert on public.prompts;
create trigger prompts_before_insert before insert on public.prompts
  for each row execute function public.prompts_before_insert();

-- 상태가 바뀌면 검토 시각 기록
create or replace function public.prompts_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_at := now();
    if new.status <> 'rejected' then new.reject_reason := null; end if;
  end if;
  return new;
end $$;
drop trigger if exists prompts_before_update on public.prompts;
create trigger prompts_before_update before update on public.prompts
  for each row execute function public.prompts_before_update();

alter table public.prompts enable row level security;
-- 공개 글은 누구나, 내 글은 상태와 상관없이 나만, 관리자는 전부
drop policy if exists "prompts: read" on public.prompts;
create policy "prompts: read" on public.prompts for select to anon, authenticated
  using (status = 'approved' or author_id = (select auth.uid()) or (select public.is_admin()));
-- 로그인한 사용자는 본인 이름으로만 올릴 수 있음 (상태는 트리거가 pending으로 고정)
drop policy if exists "prompts: insert" on public.prompts;
create policy "prompts: insert" on public.prompts for insert to authenticated
  with check (author_id = (select auth.uid()) or (select public.is_admin()));
-- 수정(승인·반려·숨김·내용 수정)은 관리자만
drop policy if exists "prompts: admin update" on public.prompts;
create policy "prompts: admin update" on public.prompts for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- 삭제: 관리자, 또는 작성자 본인
drop policy if exists "prompts: delete" on public.prompts;
create policy "prompts: delete" on public.prompts for delete to authenticated
  using ((select public.is_admin()) or author_id = (select auth.uid()));
grant select on public.prompts to anon, authenticated;
grant insert, update, delete on public.prompts to authenticated;

-- 기존 예시 프롬프트 8개 이관 (번호 유지 → 이미 아카이브에 담긴 항목도 그대로 연결)
insert into public.prompts (id, title, cat, tool, body, art, theme, img, saves_label, author_id, status) values
 (1, '셀카 + GPT로 피규어 만들기', 'image', 'ChatGPT', E'첨부한 사진 속 인물을 1/7 스케일의 수집용 피규어로 만들어줘.\n- 투명 아크릴 받침대 위에 서 있는 모습\n- 뒤쪽에 피규어 박스 패키지 디자인\n- 책상 위, 자연광, 실사 느낌', '🧸', 0, 'images/1.webp', '1.2k', null, 'approved'),
 (2, '인스타 프로필 소개글', 'sns', 'Claude', E'너는 20대 감성의 인스타그램 카피라이터야.\n내 정보: [전공/취미/요즘 빠진 것]\n이 정보로 프로필 소개글 5개를 만들어줘. 각 30자 이내, 이모지 1~2개, 말투는 담백하게.', '📸', 1, null, '860', null, 'approved'),
 (3, '캐릭캐릭 체인지', 'image', 'ChatGPT', E'첨부한 사진을 2000년대 일본 애니메이션 스타일 캐릭터로 바꿔줘.\n- 큰 눈, 선명한 셀 채색\n- 배경은 학교 운동장과 하늘\n- 원래 옷 색과 헤어스타일은 유지', '🌸', 2, null, '2.4k', null, 'approved'),
 (4, '요즘 유행 웹툰 한 컷', 'sns', 'ChatGPT', E'아래 상황을 한국 웹툰 한 컷으로 그려줘.\n상황: [내가 겪은 웃긴 일]\n- 말풍선 하나, 한국어 대사\n- 과장된 표정, 깔끔한 선화', '💭', 3, 'images/4.webp', '1.7k', null, 'approved'),
 (5, '주 3회 운동 루틴', 'life', 'Claude', E'너는 퍼스널 트레이너야.\n내 정보: 운동 경험 [없음/초급], 목표 [체력/근력], 가능한 시간 [하루 40분]\n주 3회, 4주짜리 루틴을 표로 만들어줘. 각 운동에 세트·횟수·쉬는 시간 포함.', '🏃', 4, null, '640', null, 'approved'),
 (6, '일주일 자취 식단표', 'life', 'Gemini', E'자취생용 7일 식단표를 만들어줘.\n조건: 한 끼 재료비 5천원 이내, 조리 15분 이내, 전자레인지 활용\n요일별 아침·점심·저녁을 표로, 마지막에 장보기 목록까지.', '🍱', 5, null, '520', null, 'approved'),
 (7, '시험 전날 요약 노트', 'study', 'Claude', E'첨부한 강의 자료를 시험 전날 30분 안에 볼 수 있게 요약해줘.\n- 핵심 개념 10개, 각 2줄\n- 자주 헷갈리는 비교 3개는 표로\n- 마지막에 예상 문제 5개와 정답', '📚', 6, null, '990', null, 'approved'),
 (8, '발표 슬라이드 뼈대', 'study', 'ChatGPT', E'주제: [발표 주제], 발표 시간: 10분, 청중: 같은 과 학생\n슬라이드 8장 구성으로 각 장의 제목, 핵심 문장 1개, 넣을 시각 자료를 제안해줘.', '🎤', 7, null, '710', null, 'approved')
on conflict (id) do nothing;
-- 새 글 번호는 100번부터
select setval(pg_get_serial_sequence('public.prompts', 'id'), greatest(100, (select max(id) from public.prompts)));

-- ---------- 뉴스 관리(숨기기·제목/분류 수정) ----------
-- 뉴스 파일은 GitHub Actions가 계속 새로 만들기 때문에, 관리자 수정 내용은 여기에 따로 저장해 화면에서 덮어씁니다.
create table if not exists public.news_overrides (
  news_id    text primary key check (news_id ~ '^[0-9a-f]{12}$'),
  hidden     boolean not null default false,
  title      text check (char_length(title) between 2 and 160),
  tag        text check (tag in ('출시', '보안', '할인', '소식')),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
alter table public.news_overrides enable row level security;
drop policy if exists "news_overrides: public read" on public.news_overrides;
create policy "news_overrides: public read" on public.news_overrides for select to anon, authenticated using (true);
drop policy if exists "news_overrides: admin write" on public.news_overrides;
create policy "news_overrides: admin write" on public.news_overrides for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
grant select on public.news_overrides to anon, authenticated;
grant insert, update, delete on public.news_overrides to authenticated;

-- ---------- 최고 관리자 지정 ----------
-- promme 사이트에서 회원가입을 마친 본인 이메일로 바꿔서 실행하세요.
-- 일반 관리자는 사이트의 '관리자 페이지 → 관리자' 탭에서 추가·해제하면 됩니다.
insert into public.admins (user_id, role)
select id, 'owner' from auth.users where lower(email) = lower('ADMIN_EMAIL_HERE')
on conflict (user_id) do update set role = 'owner';

-- (참고) 최고 관리자를 일반 관리자로 내리기:
--   update public.admins set role = 'admin' where user_id = (select id from auth.users where email = '이메일');
-- (참고) 지금 명단 보기:
--   select u.email, a.role, a.created_at from public.admins a join auth.users u on u.id = a.user_id;
