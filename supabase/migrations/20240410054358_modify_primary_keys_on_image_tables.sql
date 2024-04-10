alter table "public"."images_to_remove" drop constraint "images_to_remove_pkey";

alter table "public"."images_to_upload" drop constraint "images_to_upload_pkey";

drop index if exists "public"."images_to_remove_pkey";

drop index if exists "public"."images_to_upload_pkey";

CREATE UNIQUE INDEX images_to_remove_pkey ON public.images_to_remove USING btree (full_storage_path, bucket_id, trigger_key);

CREATE UNIQUE INDEX images_to_upload_pkey ON public.images_to_upload USING btree (bucket_id, full_storage_path, trigger_key);

alter table "public"."images_to_remove" add constraint "images_to_remove_pkey" PRIMARY KEY using index "images_to_remove_pkey";

alter table "public"."images_to_upload" add constraint "images_to_upload_pkey" PRIMARY KEY using index "images_to_upload_pkey";


