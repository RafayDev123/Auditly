create index if not exists auth_sessions_user_id_idx on auth_sessions(user_id);
create index if not exists password_reset_tokens_user_id_idx on password_reset_tokens(user_id);
create index if not exists websites_user_id_idx on websites(user_id);
create index if not exists websites_domain_idx on websites(domain);
create index if not exists audits_user_id_idx on audits(user_id);
create index if not exists audits_website_id_idx on audits(website_id);
create index if not exists audits_created_at_idx on audits(created_at);
create index if not exists audits_status_idx on audits(status);
create index if not exists audit_stages_audit_id_idx on audit_stages(audit_id);
create index if not exists audit_metrics_audit_id_idx on audit_metrics(audit_id);
create index if not exists audit_findings_audit_id_idx on audit_findings(audit_id);
create index if not exists audit_technologies_audit_id_idx on audit_technologies(audit_id);
create index if not exists recommendations_audit_id_idx on recommendations(audit_id);
create index if not exists notifications_user_id_idx on notifications(user_id);

-- Access is authorized by the application's cookie-session layer, not Supabase Auth.
-- The server connects directly to Postgres, so auth.uid() is not set for app queries.
alter table users disable row level security;
alter table auth_sessions disable row level security;
alter table password_reset_tokens disable row level security;
alter table websites disable row level security;
alter table audits disable row level security;
alter table audit_stages disable row level security;
alter table audit_metrics disable row level security;
alter table audit_findings disable row level security;
alter table audit_technologies disable row level security;
alter table recommendations disable row level security;
alter table audit_ai_summaries disable row level security;
alter table notifications disable row level security;
alter table subscriptions disable row level security;
