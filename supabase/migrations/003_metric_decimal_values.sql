alter table audit_metrics
  alter column numeric_value type double precision
  using numeric_value::double precision;