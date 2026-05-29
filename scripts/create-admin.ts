import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  const email = 'admin@kayaba.co.id';
  const password = 'Password123!';

  console.log('Creating admin user...');
  
  // Create user using Auth API
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/admin-login`,
      data: {
        full_name: 'Admin Kayaba',
      },
    },
  });

  if (error) {
    console.error('Error creating user:', error.message);
    // If user already exists, try to get the user
    if (error.message.includes('already registered')) {
      console.log('User already exists, assigning admin role...');
      const { data: { user } } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (user) {
        // Assign admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });
        
        if (roleError) {
          console.error('Error assigning role:', roleError.message);
        } else {
          console.log('Admin role assigned successfully!');
        }
      }
    }
    return;
  }

  if (data.user) {
    console.log('User created successfully!');
    console.log('User ID:', data.user.id);
    
    // Assign admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role: 'admin' });
    
    if (roleError) {
      console.error('Error assigning role:', roleError.message);
    } else {
      console.log('Admin role assigned successfully!');
    }
  }
}

createAdminUser();
