drop trigger if exists "call_web_trigger_api" on "public"."trigger";

revoke delete on table "public"."images_to_remove" from "anon";

revoke insert on table "public"."images_to_remove" from "anon";

revoke references on table "public"."images_to_remove" from "anon";

revoke select on table "public"."images_to_remove" from "anon";

revoke trigger on table "public"."images_to_remove" from "anon";

revoke truncate on table "public"."images_to_remove" from "anon";

revoke update on table "public"."images_to_remove" from "anon";

revoke delete on table "public"."images_to_remove" from "authenticated";

revoke insert on table "public"."images_to_remove" from "authenticated";

revoke references on table "public"."images_to_remove" from "authenticated";

revoke select on table "public"."images_to_remove" from "authenticated";

revoke trigger on table "public"."images_to_remove" from "authenticated";

revoke truncate on table "public"."images_to_remove" from "authenticated";

revoke update on table "public"."images_to_remove" from "authenticated";

revoke delete on table "public"."images_to_remove" from "service_role";

revoke insert on table "public"."images_to_remove" from "service_role";

revoke references on table "public"."images_to_remove" from "service_role";

revoke select on table "public"."images_to_remove" from "service_role";

revoke trigger on table "public"."images_to_remove" from "service_role";

revoke truncate on table "public"."images_to_remove" from "service_role";

revoke update on table "public"."images_to_remove" from "service_role";

revoke delete on table "public"."images_to_upload" from "anon";

revoke insert on table "public"."images_to_upload" from "anon";

revoke references on table "public"."images_to_upload" from "anon";

revoke select on table "public"."images_to_upload" from "anon";

revoke trigger on table "public"."images_to_upload" from "anon";

revoke truncate on table "public"."images_to_upload" from "anon";

revoke update on table "public"."images_to_upload" from "anon";

revoke delete on table "public"."images_to_upload" from "authenticated";

revoke insert on table "public"."images_to_upload" from "authenticated";

revoke references on table "public"."images_to_upload" from "authenticated";

revoke select on table "public"."images_to_upload" from "authenticated";

revoke trigger on table "public"."images_to_upload" from "authenticated";

revoke truncate on table "public"."images_to_upload" from "authenticated";

revoke update on table "public"."images_to_upload" from "authenticated";

revoke delete on table "public"."images_to_upload" from "service_role";

revoke insert on table "public"."images_to_upload" from "service_role";

revoke references on table "public"."images_to_upload" from "service_role";

revoke select on table "public"."images_to_upload" from "service_role";

revoke trigger on table "public"."images_to_upload" from "service_role";

revoke truncate on table "public"."images_to_upload" from "service_role";

revoke update on table "public"."images_to_upload" from "service_role";

revoke delete on table "public"."trigger" from "anon";

revoke insert on table "public"."trigger" from "anon";

revoke references on table "public"."trigger" from "anon";

revoke select on table "public"."trigger" from "anon";

revoke trigger on table "public"."trigger" from "anon";

revoke truncate on table "public"."trigger" from "anon";

revoke update on table "public"."trigger" from "anon";

revoke delete on table "public"."trigger" from "authenticated";

revoke insert on table "public"."trigger" from "authenticated";

revoke references on table "public"."trigger" from "authenticated";

revoke select on table "public"."trigger" from "authenticated";

revoke trigger on table "public"."trigger" from "authenticated";

revoke truncate on table "public"."trigger" from "authenticated";

revoke update on table "public"."trigger" from "authenticated";

revoke delete on table "public"."trigger" from "service_role";

revoke insert on table "public"."trigger" from "service_role";

revoke references on table "public"."trigger" from "service_role";

revoke select on table "public"."trigger" from "service_role";

revoke trigger on table "public"."trigger" from "service_role";

revoke truncate on table "public"."trigger" from "service_role";

revoke update on table "public"."trigger" from "service_role";

alter table "public"."images_to_remove" drop constraint "images_to_remove_pkey";

alter table "public"."images_to_upload" drop constraint "images_to_upload_pkey";

alter table "public"."trigger" drop constraint "trigger_pkey";

drop index if exists "public"."images_to_remove_pkey";

drop index if exists "public"."images_to_upload_pkey";

drop index if exists "public"."trigger_pkey";

drop table "public"."images_to_remove";

drop table "public"."images_to_upload";

drop table "public"."trigger";


