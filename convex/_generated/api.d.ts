/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as chats from "../chats.js";
import type * as emailProvider from "../emailProvider.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as myFunctions from "../myFunctions.js";
import type * as problems from "../problems.js";
import type * as round from "../round.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  chats: typeof chats;
  emailProvider: typeof emailProvider;
  games: typeof games;
  http: typeof http;
  myFunctions: typeof myFunctions;
  problems: typeof problems;
  round: typeof round;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
