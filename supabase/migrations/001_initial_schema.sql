create extension if not exists "pgcrypto";

create type subscription_plan as enum ('free', 'pro', 'agency');
create type audit_status as enum ('queued', 'running', 'completed', 'failed', 'partial');
create type audit_stage_status as enum ('pending', 'running', 'completed', 'failed');
create type audit_category as enum ('performance', 'seo', 'accessibility', 'security', 'ux', 'technology');
create type severity as enum ('critical', 'high', 'medium', 'low', 'info');
create type finding_status as enum ('open', 'resolved', 'dismissed');
create type tech_confidence as enum ('high', 'medium', 'low');

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(320) unique not null,
  full_name varchar(140) not null,
  password_hash text not null,
  avatar_url text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text unique not null,
  user_agent text,
  ip_address varchar(64),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists websites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  domain varchar(255) not null,
  normalized_url text not null,
  latest_audit_id uuid,
  monitoring_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, domain)
);

create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  website_id uuid not null references websites(id) on delete cascade,
  target_url text not null,
  status audit_status not null default 'queued',
  score_version varchar(16) not null default '1.0',
  overall_score integer,
  performance_score integer,
  seo_score integer,
  accessibility_score integer,
  security_score integer,
  ux_score integer,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  scan_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_stages (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references audits(id) on delete cascade,
  stage_key varchar(64) not null,
  label varchar(120) not null,
  sort_order integer not null,
  status audit_stage_status not null default 'pending',
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(audit_id, stage_key)
);

create table if not exists audit_metrics (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references audits(id) on delete cascade,
  category audit_category not null,
  metric_key varchar(128) not null,
  metric_label varchar(140) not null,
  numeric_value bigint,
  unit varchar(32),
  status severity not null,
  source varchar(64) not null default 'lab',
  evidence jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_findings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references audits(id) on delete cascade,
  category audit_category not null,
  severity severity not null,
  status finding_status not null default 'open',
  title varchar(180) not null,
  summary text not null,
  why_it_matters text not null,
  recommended_fix text not null,
  technical_details text,
  ai_explanation text,
  affected_url text,
  evidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists technologies (
  id uuid primary key default gen_random_uuid(),
  slug varchar(80) unique not null,
  name varchar(120) unique not null,
  category varchar(80) not null,
  icon varchar(80),
  created_at timestamptz not null default now()
);

create table if not exists audit_technologies (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references audits(id) on delete cascade,
  technology_id uuid references technologies(id) on delete set null,
  name varchar(120) not null,
  category varchar(80) not null,
  confidence tech_confidence not null,
  evidence jsonb,
  created_at timestamptz not null default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references audits(id) on delete cascade,
  finding_id uuid references audit_findings(id) on delete set null,
  priority integer not null,
  title varchar(180) not null,
  description text not null,
  impact text not null,
  effort varchar(32) not null default 'medium',
  created_at timestamptz not null default now()
);

create table if not exists audit_ai_summaries (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null unique references audits(id) on delete cascade,
  model varchar(120),
  summary text not null,
  top_problems jsonb not null,
  quick_wins jsonb not null,
  recommended_order jsonb not null,
  business_impact text not null,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  plan subscription_plan not null default 'free',
  status varchar(40) not null default 'active',
  audits_per_month_limit integer not null default 10,
  websites_limit integer not null default 3,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title varchar(160) not null,
  body text not null,
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);
