-- ============================================================
-- 服药记录 PWA · 多端同步表
-- 用法：Supabase 项目 cszkekdciqgimsvfgons
--       Dashboard 左侧 → SQL Editor → New query → 粘贴全部内容 → Run
--       只需执行一次（重复执行安全，不会破坏已有数据）
-- ============================================================

-- 1. 同步表：一行 = 一个同步码对应的一份完整数据快照
create table if not exists public.pill_sync (
  code       text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2. 开启行级安全
alter table public.pill_sync enable row level security;

-- 3. 清理旧策略（保证重复执行幂等）
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'pill_sync' loop
    execute format('drop policy %I on public.pill_sync', p.policyname);
  end loop;
end $$;

-- 4. 同步码即凭证：请求头 X-Sync-Code 必须与行内 code 一致才能读写
--    前端使用 publishable(anon) key + 自定义请求头实现免登录同步
create policy "pill_sync by code" on public.pill_sync
  for all to anon
  using (
    code = nullif(current_setting('request.headers', true)::json->>'x-sync-code','')
  )
  with check (
    code = nullif(current_setting('request.headers', true)::json->>'x-sync-code','')
  );

-- 完成。回到页面：设置 → 多端同步 → 创建同步码（或输入已有码加入）。
