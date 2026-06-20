create table projects (
  id text primary key,
  name text not null,
  client text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table locations (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table equipment (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  location_id text not null references locations(id) on delete cascade,
  team text not null,
  name text not null,
  type text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table points (
  id text primary key,
  equipment_id text not null references equipment(id) on delete cascade,
  name text not null,
  type text not null,
  reference text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inspection_records (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  location_id text not null references locations(id) on delete cascade,
  equipment_id text not null references equipment(id) on delete cascade,
  point_id text references points(id) on delete set null,
  team text not null,
  title text not null,
  result text not null default 'Pending',
  status text not null default 'pending',
  comments text,
  assignee text,
  due date,
  client_updated_at timestamptz,
  server_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table attachments (
  id text primary key,
  record_id text not null references inspection_records(id) on delete cascade,
  file_name text not null,
  mime_type text,
  storage_path text not null,
  source text not null check (source in ('camera', 'upload')),
  created_at timestamptz not null default now()
);

create table sync_conflicts (
  id bigserial primary key,
  record_id text not null,
  local_payload jsonb not null,
  server_payload jsonb not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_locations_project_id on locations(project_id);
create index idx_equipment_project_location on equipment(project_id, location_id);
create index idx_points_equipment_id on points(equipment_id);
create index idx_records_equipment_point on inspection_records(equipment_id, point_id);
create index idx_records_status on inspection_records(status);
