-- Add article tag column (Exegesis, Theology, History, Life)
alter table posts add column if not exists tag text;

alter table posts drop constraint if exists posts_tag_check;
alter table posts add constraint posts_tag_check
  check (tag is null or tag in ('exegesis', 'theology', 'history', 'life'));

create index if not exists posts_tag_idx on posts (tag);
