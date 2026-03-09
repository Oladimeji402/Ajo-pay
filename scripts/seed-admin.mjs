import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seedEmail = process.env.ADMIN_SEED_EMAIL;
const seedPassword = process.env.ADMIN_SEED_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!seedEmail || !seedPassword) {
  console.error('Missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  const pageSize = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) throw error;

    const found = data?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found;

    if (!data?.users || data.users.length < pageSize) break;
  }

  return null;
}

async function main() {
  let user = await findUserByEmail(seedEmail);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: seedEmail,
      password: seedPassword,
      email_confirm: true,
      user_metadata: { name: 'Admin User' },
    });

    if (error || !data.user) {
      throw error || new Error('Failed to create admin auth user.');
    }

    user = data.user;
    console.log(`Created auth user: ${seedEmail}`);
  } else {
    console.log(`Auth user already exists: ${seedEmail}`);

    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: seedPassword,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata ?? {}),
        name: user.user_metadata?.name || 'Admin User',
      },
    });

    if (updateError || !updated.user) {
      throw updateError || new Error('Failed to update existing admin auth user.');
    }

    user = updated.user;
    console.log('Updated existing auth user password and metadata.');
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: seedEmail,
      name: user.user_metadata?.name || 'Admin User',
      role: 'admin',
      status: 'active',
    },
    { onConflict: 'id' },
  );

  if (profileError) throw profileError;

  console.log('Admin profile is ready.');
  console.log(`Login email: ${seedEmail}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
