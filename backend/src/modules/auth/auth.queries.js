import supabase from "../../config/db.js";

export const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("support_users")
    .select("id, name, apat, amat, role, email, password, is_active")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const findUserById = async (id) => {
  const { data, error } = await supabase
    .from("support_users")
    .select("id, name, apat, amat, role, email, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createUser = async ({
  name,
  apat,
  amat,
  email,
  password,
  role,
}) => {
  const { data, error } = await supabase
    .from("support_users")
    .insert([
      {
        name,
        apat,
        amat,
        email,
        password,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ])
    .select("id, name, apat, amat, role, email, is_active, created_at")
    .single();

  if (error) throw error;
  return data;
};

export const updateLastLogin = async (id) => {
  const { error } = await supabase
    .from("support_users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
};

export const updatePassword = async (id, hashedPassword) => {
  const { error } = await supabase
    .from("support_users")
    .update({ password: hashedPassword })
    .eq("id", id);

  if (error) throw error;
};

export const updateUserData = async (id, fields) => {
  const { data, error } = await supabase
    .from("support_users")
    .update(fields)
    .eq("id", id)
    .select("id, name, apat, amat, email, role, is_active")
    .single();

  if (error) throw error;
  return data;
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from("support_users")
    .select(
      "id, name, apat, amat, email, role, is_active, created_at, last_login",
    )
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
};

export const getUserById = async (id) => {
  const { data, error } = await supabase
    .from("support_users")
    .select(
      "id, name, apat, amat, email, role, is_active, created_at, last_login",
    )
    .eq("id", Number(id))
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createResetToken = async (user_id, token, expires_at) => {
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .insert([{ user_id, token, expires_at }])
    .select("id")
    .single();

  if (error) throw error;
  return data;
};

export const findResetToken = async (token) => {
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used")
    .eq("token", token)
    .eq("used", false)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const markTokenUsed = async (id) => {
  const { error } = await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", id);

  if (error) throw error;
};
