-- Schema para Reserva Roxou
-- Arquivo: supabase/schema.sql

-- 1. Tabela de Perfis de Usuários (profiles)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'passageiro' check (role in ('passageiro', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS em profiles
alter table public.profiles enable row level security;

-- Políticas de RLS para profiles
create policy "Qualquer usuário logado pode ler perfis"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Usuários podem atualizar o próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Permitir inserção do próprio perfil durante o login"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);


-- 2. Tabela de Status do Motorista (driver_status)
create table public.driver_status (
  id integer primary key check (id = 1), -- Apenas um registro global de status
  status text not null default 'offline' check (status in ('online', 'ocupado', 'offline')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references public.profiles(id)
);

-- Ativar RLS em driver_status
alter table public.driver_status enable row level security;

-- Políticas de RLS para driver_status
create policy "Qualquer pessoa pode visualizar o status do motorista"
  on public.driver_status for select
  using (true);

create policy "Apenas administradores podem atualizar o status"
  on public.driver_status for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Inserir o status offline padrão inicial
insert into public.driver_status (id, status) values (1, 'offline')
on conflict (id) do nothing;


-- 3. Tabela de Solicitações de Reserva (ride_requests)
create table public.ride_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  origin text not null,
  destination text not null,
  scheduled_date date not null,
  scheduled_time time not null,
  distance_km numeric not null,
  trip_type text not null check (trip_type in ('ida', 'ida_e_volta')),
  passenger_count integer not null check (passenger_count >= 1 and passenger_count <= 4),
  observation text,
  estimated_price numeric not null,
  final_price numeric,
  status text not null default 'pendente' check (status in (
    'pendente',             -- Aguardando admin aprovar orçamento
    'aprovado',             -- Orçamento aprovado, aguardando pagamento
    'recusado',             -- Recusado pelo admin com motivo
    'confirmado_pagamento',  -- Cliente enviou pagamento, aguardando admin confirmar reserva
    'confirmado_reserva',    -- Viagem agendada e confirmada de fato
    'em_viagem',            -- Viagem iniciada
    'concluido',            -- Viagem finalizada com sucesso
    'cancelado'             -- Cancelado por passageiro ou admin
  )),
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS em ride_requests
alter table public.ride_requests enable row level security;

-- Políticas de RLS para ride_requests
create policy "Passageiros podem visualizar as próprias solicitações"
  on public.ride_requests for select
  to authenticated
  using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Passageiros podem criar as próprias solicitações"
  on public.ride_requests for insert
  to authenticated
  with check (
    auth.uid() = user_id
  );

create policy "Apenas admin ou dono pode atualizar solicitações"
  on public.ride_requests for update
  to authenticated
  using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    auth.uid() = user_id or 
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


-- 4. Tabela de Mensagens do Chat (ride_messages)
create table public.ride_messages (
  id uuid default gen_random_uuid() primary key,
  ride_id uuid references public.ride_requests(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS em ride_messages
alter table public.ride_messages enable row level security;

-- Políticas de RLS para ride_messages
create policy "Membros da reserva podem visualizar mensagens"
  on public.ride_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.ride_requests r
      where r.id = ride_id and (r.user_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
      ))
    )
  );

create policy "Membros da reserva podem enviar mensagens"
  on public.ride_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.ride_requests r
      where r.id = ride_id and (r.user_id = auth.uid() or exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
      ))
    )
  );


-- 5. Trigger para sincronizar auth.users com profiles e definir o e-mail contato.fh3@gmail.com como admin automaticamente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Passageiro'),
    new.raw_user_meta_data->>'avatar_url',
    case when new.email = 'contato.fh3@gmail.com' then 'admin' else 'passageiro' end
  )
  on conflict (id) do update
  set 
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    role = case when excluded.email = 'contato.fh3@gmail.com' then 'admin' else profiles.role end;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger executada sempre que um cadastro no Auth é gerado
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 6. ÍNDICES DE PERFORMANCE (HARDENING DE PRODUÇÃO)
-- ==========================================
create index if not exists ride_requests_status_idx on public.ride_requests (status);
create index if not exists ride_requests_created_at_idx on public.ride_requests (created_at desc);
create index if not exists ride_requests_user_id_idx on public.ride_requests (user_id);
create index if not exists ride_messages_ride_id_idx on public.ride_messages (ride_id);
create index if not exists ride_messages_created_at_idx on public.ride_messages (created_at asc);


-- ==========================================
-- 7. TRIGGERS DE SEGURANÇA E INTEGRIDADE DE DADOS
-- ==========================================

-- Trigger para validar atualizações na tabela de Perfis (impedir escalabilidade de privilégios)
create or replace function public.validate_profile_update()
returns trigger as $$
begin
  -- Impedir alteração de id e email do usuário no banco pelo cliente
  if new.id <> old.id then
    raise exception 'Não é permitido alterar o identificador do perfil.';
  end if;

  -- Apenas o email contato.fh3@gmail.com pode ter role admin
  if new.role = 'admin' and new.email <> 'contato.fh3@gmail.com' then
    new.role := 'passageiro';
  end if;

  -- Impedir alteração de role de admin para usuários comuns
  if new.role is distinct from old.role and old.email <> 'contato.fh3@gmail.com' then
    new.role := old.role;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.validate_profile_update();


-- Trigger para validar atualizações nas solicitações de viagem (impedir fraude de preços e status)
create or replace function public.validate_ride_request_update()
returns trigger as $$
declare
  user_role text;
begin
  -- Obter a role do usuário atual que realiza a alteração
  select role into user_role from public.profiles where id = auth.uid();

  -- Administrador possui permissão plena para atualizar qualquer campo e transição
  if user_role = 'admin' then
    return new;
  end if;

  -- Validações para passageiros comuns:
  -- 1. Passageiros comuns só podem atualizar as próprias reservas
  if old.user_id <> auth.uid() then
    raise exception 'Você não tem permissão para alterar reservas de terceiros.';
  end if;

  -- 2. Não permitir alteração de campos financeiros e técnicos
  if new.final_price is distinct from old.final_price or
     new.estimated_price is distinct from old.estimated_price or
     new.distance_km is distinct from old.distance_km or
     new.user_id is distinct from old.user_id or
     new.origin is distinct from old.origin or
     new.destination is distinct from old.destination or
     new.scheduled_date is distinct from old.scheduled_date or
     new.scheduled_time is distinct from old.scheduled_time or
     new.trip_type is distinct from old.trip_type or
     new.passenger_count is distinct from old.passenger_count or
     new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'Não é permitido alterar campos financeiros ou logísticos da reserva.';
  end if;

  -- 3. Restringir transição de status para passageiros comuns:
  -- Só podem mudar para:
  -- 'confirmado_pagamento' (se o antigo era 'aprovado')
  -- 'cancelado' (se o antigo era 'pendente', 'aprovado' ou 'confirmado_pagamento')
  if new.status is distinct from old.status then
    if new.status = 'confirmado_pagamento' and old.status = 'aprovado' then
      -- OK: Cliente enviando comprovante de Pix
    elsif new.status = 'cancelado' and old.status in ('pendente', 'aprovado', 'confirmado_pagamento') then
      -- OK: Cliente cancelando a viagem antes da viagem ser oficialmente confirmada ou realizada
    else
      raise exception 'Transição de status não permitida para o seu tipo de usuário.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_ride_request_updated
  before update on public.ride_requests
  for each row execute procedure public.validate_ride_request_update();

