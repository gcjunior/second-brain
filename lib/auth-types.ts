export type UserRole = "admin" | "user";

export type AccountStatus =
  | "pending_approval"
  | "approved"
  | "blocked"
  | "rejected";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  account_status: AccountStatus;
  failed_login_count: number;
  approved_at: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  last_login_at: string | null;
  last_login_provider: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthUser = {
  id: string;
  email: string;
  profile: Profile;
};
