/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_mutations from "../admin/mutations.js";
import type * as admin_queries from "../admin/queries.js";
import type * as auth from "../auth.js";
import type * as deviceAuthorization from "../deviceAuthorization.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as model_admin_index from "../model/admin/index.js";
import type * as model_admin_roles from "../model/admin/roles.js";
import type * as model_emails_rateLimits from "../model/emails/rateLimits.js";
import type * as model_emails_templates_baseEmail from "../model/emails/templates/baseEmail.js";
import type * as model_emails_templates_emailTemplates from "../model/emails/templates/emailTemplates.js";
import type * as model_emails_validateEmail from "../model/emails/validateEmail.js";
import type * as model_organizations_index from "../model/organizations/index.js";
import type * as organizations_invitations_queries from "../organizations/invitations/queries.js";
import type * as organizations_members_mutations from "../organizations/members/mutations.js";
import type * as organizations_mutations from "../organizations/mutations.js";
import type * as organizations_queries from "../organizations/queries.js";
import type * as otp_channels_console from "../otp/channels/console.js";
import type * as otp_channels_fast2sms from "../otp/channels/fast2sms.js";
import type * as otp_channels_index from "../otp/channels/index.js";
import type * as otp_channels_textbee from "../otp/channels/textbee.js";
import type * as otp_channels_whatsapp from "../otp/channels/whatsapp.js";
import type * as otp_config from "../otp/config.js";
import type * as otp_deliveries from "../otp/deliveries.js";
import type * as otp_phone from "../otp/phone.js";
import type * as otp_rateLimits from "../otp/rateLimits.js";
import type * as otp_send from "../otp/send.js";
import type * as otp_truecaller from "../otp/truecaller.js";
import type * as otp_types from "../otp/types.js";
import type * as storage from "../storage.js";
import type * as url from "../url.js";
import type * as users_actions from "../users/actions.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/mutations": typeof admin_mutations;
  "admin/queries": typeof admin_queries;
  auth: typeof auth;
  deviceAuthorization: typeof deviceAuthorization;
  email: typeof email;
  http: typeof http;
  migrations: typeof migrations;
  "model/admin/index": typeof model_admin_index;
  "model/admin/roles": typeof model_admin_roles;
  "model/emails/rateLimits": typeof model_emails_rateLimits;
  "model/emails/templates/baseEmail": typeof model_emails_templates_baseEmail;
  "model/emails/templates/emailTemplates": typeof model_emails_templates_emailTemplates;
  "model/emails/validateEmail": typeof model_emails_validateEmail;
  "model/organizations/index": typeof model_organizations_index;
  "organizations/invitations/queries": typeof organizations_invitations_queries;
  "organizations/members/mutations": typeof organizations_members_mutations;
  "organizations/mutations": typeof organizations_mutations;
  "organizations/queries": typeof organizations_queries;
  "otp/channels/console": typeof otp_channels_console;
  "otp/channels/fast2sms": typeof otp_channels_fast2sms;
  "otp/channels/index": typeof otp_channels_index;
  "otp/channels/textbee": typeof otp_channels_textbee;
  "otp/channels/whatsapp": typeof otp_channels_whatsapp;
  "otp/config": typeof otp_config;
  "otp/deliveries": typeof otp_deliveries;
  "otp/phone": typeof otp_phone;
  "otp/rateLimits": typeof otp_rateLimits;
  "otp/send": typeof otp_send;
  "otp/truecaller": typeof otp_truecaller;
  "otp/types": typeof otp_types;
  storage: typeof storage;
  url: typeof url;
  "users/actions": typeof users_actions;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
