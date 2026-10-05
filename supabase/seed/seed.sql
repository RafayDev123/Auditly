-- Development/demo seed only.
insert into technologies (slug, name, category)
values
  ('nextjs', 'Next.js', 'Framework'),
  ('react', 'React', 'Library'),
  ('wordpress', 'WordPress', 'CMS'),
  ('shopify', 'Shopify', 'E-commerce'),
  ('tailwindcss', 'Tailwind CSS', 'CSS')
on conflict do nothing;
