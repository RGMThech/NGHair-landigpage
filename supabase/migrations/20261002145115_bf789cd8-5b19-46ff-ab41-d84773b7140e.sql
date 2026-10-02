create policy "Users can view their own avatar"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars' and (auth.uid())::text = (storage.foldername(name))[1]);