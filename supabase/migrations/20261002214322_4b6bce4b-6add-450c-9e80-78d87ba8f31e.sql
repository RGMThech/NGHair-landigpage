create or replace function public.eurofarma_dashboard_resumo(_month text default null, _from date default null, _to date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.can_access_eurofarma_dashboard(auth.uid()) then
    raise exception 'not allowed';
  end if;
  with base as (
    select month_ref, data, coalesce(valor,0) v,
      case when ltrim(trim(coalesce(rubrica,'')),'0') = '105' then coalesce(valor,0)*0.5 else coalesce(valor,0) end c,
      nullif(trim(servico),'') servico, nullif(trim(profissional),'') profissional,
      trim(re) re, public.normalize_re(re) nre, nullif(trim(cliente),'') cliente
    from public.eurofarma_entries
  ),
  f as (
    select * from base
    where (_month is null or month_ref = _month)
      and (_from is null or data >= _from)
      and (_to is null or data <= _to)
  ),
  nomes as (
    select distinct on (nre) nre, cliente from base where cliente is not null
    group by nre, cliente order by nre, count(*) desc
  )
  select jsonb_build_object(
    'total_geral', (select count(*) from base),
    'meses', (select coalesce(jsonb_agg(m order by m desc), '[]'::jsonb) from (select distinct month_ref m from base) x),
    'totais', (select jsonb_build_object('total', coalesce(sum(v),0), 'colab', coalesce(sum(c),0),
                 'atendimentos', count(*), 'colaboradoras', count(distinct nre)) from f),
    'por_mes', (select coalesce(jsonb_agg(jsonb_build_object('month_ref', month_ref, 'total', t, 'colaborador', cc) order by month_ref), '[]'::jsonb)
                from (select month_ref, sum(v) t, sum(c) cc from f group by month_ref) x),
    'por_servico', (select coalesce(jsonb_agg(jsonb_build_object('name', k, 'qtd', q, 'total', t) order by t desc), '[]'::jsonb)
                from (select coalesce(servico,'Não informado') k, count(*) q, sum(v) t from f group by 1) x),
    'por_profissional', (select coalesce(jsonb_agg(jsonb_build_object('name', k, 'qtd', q, 'total', t) order by t desc), '[]'::jsonb)
                from (select coalesce(profissional,'Não informado') k, count(*) q, sum(v) t from f group by 1) x),
    'por_re', (select coalesce(jsonb_agg(jsonb_build_object('name', x.re, 'nome', n.cliente, 'qtd', x.q, 'total', x.t) order by x.t desc), '[]'::jsonb)
                from (select nre, min(re) re, count(*) q, sum(v) t from f group by nre) x left join nomes n using (nre))
  ) into r;
  return r;
end $$;

revoke execute on function public.eurofarma_dashboard_resumo(text, date, date) from public, anon;
grant execute on function public.eurofarma_dashboard_resumo(text, date, date) to authenticated;