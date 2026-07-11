-- Search keyword mapping for articles (create/edit → site search)
alter table posts
  add column if not exists keywords text[] not null default '{}';

create index if not exists posts_keywords_gin_idx
  on posts using gin (keywords);
