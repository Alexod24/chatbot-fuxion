-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store the knowledge base documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null, -- The SaaS client/user ID
  content text not null,
  embedding vector(768), -- Gemini text-embedding-004 uses 768 dimensions
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: You should execute this in your Supabase SQL Editor. 
-- In a real SaaS, you'd add Row Level Security (RLS) to this table as well.
