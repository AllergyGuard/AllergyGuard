-- US-09: change the primary emergency contact, and delete a contact, each in
-- one transaction.
--
-- Both functions are SECURITY INVOKER, so they run with the caller's rights and
-- RLS still applies: another user's contact is simply "not found". Each locks
-- the parent profile row first so two concurrent primary changes on the same
-- profile run one after the other instead of tripping the one-primary index.

create function public.set_primary_contact(contact_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_profile uuid;
begin
  select c.profile_id into target_profile
  from public.emergency_contacts c
  where c.id = contact_id;

  if target_profile is null then
    raise exception 'contact not found' using errcode = 'P0002';
  end if;

  perform 1 from public.profiles p where p.id = target_profile for update;

  -- Clear the old primary first so the partial unique index never sees two.
  update public.emergency_contacts c
    set is_primary = false
    where c.profile_id = target_profile and c.is_primary and c.id <> contact_id;

  update public.emergency_contacts c
    set is_primary = true
    where c.id = contact_id;
end;
$$;

-- Deletes a contact. If it was the primary and others remain, promotes the
-- oldest remaining contact and returns its id; otherwise returns null.
create function public.delete_contact(contact_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_profile uuid;
  was_primary boolean;
  promoted uuid;
begin
  select c.profile_id into target_profile
  from public.emergency_contacts c
  where c.id = contact_id;

  if target_profile is null then
    raise exception 'contact not found' using errcode = 'P0002';
  end if;

  perform 1 from public.profiles p where p.id = target_profile for update;

  delete from public.emergency_contacts c
    where c.id = contact_id
    returning c.is_primary into was_primary;

  if was_primary then
    select c.id into promoted
    from public.emergency_contacts c
    where c.profile_id = target_profile
    order by c.created_at, c.id
    limit 1;

    if promoted is not null then
      update public.emergency_contacts c set is_primary = true where c.id = promoted;
    end if;
  end if;

  return promoted;
end;
$$;

revoke execute on function public.set_primary_contact(uuid) from public, anon;
grant execute on function public.set_primary_contact(uuid) to authenticated;

revoke execute on function public.delete_contact(uuid) from public, anon;
grant execute on function public.delete_contact(uuid) to authenticated;
