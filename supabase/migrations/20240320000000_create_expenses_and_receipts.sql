-- Create storage bucket for receipts
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false);

-- Create policy to allow authenticated users to upload receipts
create policy "Allow authenticated users to upload receipts"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow users to view their own receipts
create policy "Allow users to view their own receipts"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);

-- Create expenses table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  amount decimal(10,2) not null,
  description text not null,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.expenses enable row level security;

-- Create policy to allow users to view their own expenses
create policy "Users can view their own expenses"
on public.expenses for select
to authenticated
using (auth.uid() = user_id);

-- Create policy to allow users to insert their own expenses
create policy "Users can insert their own expenses"
on public.expenses for insert
to authenticated
with check (auth.uid() = user_id);

-- Create policy to allow users to update their own expenses
create policy "Users can update their own expenses"
on public.expenses for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at timestamp
create trigger handle_updated_at
  before update on public.expenses
  for each row
  execute function public.handle_updated_at(); 