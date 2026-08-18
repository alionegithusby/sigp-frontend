// Cliente PocketBase (browser). pb.authStore persiste a sessão no localStorage.
import PocketBase from "pocketbase";
import { POCKETBASE_URL } from "../config";

export const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);
