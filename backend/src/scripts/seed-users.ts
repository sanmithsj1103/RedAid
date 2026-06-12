import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Starting Supabase Auth and Database Seeding...');

  // 1. Create/Ensure Hospital User
  const hospitalEmail = 'sanmith-hospital@gmail.com';
  const hospitalPassword = 'qwertyuiop';
  const hospitalPhone = '+919999999999';

  console.log(`Checking if hospital user ${hospitalEmail} exists...`);
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    process.exit(1);
  }

  let hospitalAuthUser = users.users.find(u => u.email === hospitalEmail);

  if (!hospitalAuthUser) {
    console.log(`Creating hospital auth user: ${hospitalEmail}`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: hospitalEmail,
      password: hospitalPassword,
      phone: hospitalPhone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { role: 'hospital' },
    });

    if (createError || !newUser.user) {
      console.error('Failed to create hospital user:', createError);
      process.exit(1);
    }
    hospitalAuthUser = newUser.user;
    console.log(`Hospital auth user created with ID: ${hospitalAuthUser.id}`);
  } else {
    console.log(`Hospital auth user already exists with ID: ${hospitalAuthUser.id}`);
  }

  // 2. Create/Ensure Hospital Profile
  console.log('Checking if hospital profile exists...');
  const { data: existingHospital, error: findHospError } = await supabase
    .from('hospitals')
    .select('id')
    .eq('auth_user_id', hospitalAuthUser.id)
    .maybeSingle();

  if (findHospError) {
    console.error('Error querying hospitals:', findHospError);
    process.exit(1);
  }

  let hospitalId: string;

  if (!existingHospital) {
    console.log('Inserting hospital profile into hospitals table...');
    const { data: hospitalRecord, error: insertError } = await supabase
      .from('hospitals')
      .insert({
        auth_user_id: hospitalAuthUser.id,
        name: 'Sanmith General Hospital',
        registration_number: 'KA-HOSP-2024-099',
        department: 'Blood Bank Services',
        phone: hospitalPhone,
        email: hospitalEmail,
        address: 'Jayanagar 4th Block, Near Metro Station',
        city: 'Bangalore',
        state: 'Karnataka',
        location: 'SRID=4326;POINT(77.5946 12.9716)',
        is_verified: true, // Auto-verified for test convenience
        is_active: true,
      })
      .select('id')
      .single();

    if (insertError || !hospitalRecord) {
      console.error('Failed to insert hospital profile:', insertError);
      process.exit(1);
    }
    hospitalId = hospitalRecord.id;
    console.log(`Hospital profile created with ID: ${hospitalId}`);

    // Insert 8 inventory rows
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const inventoryRows = bloodGroups.map((bg) => ({
      hospital_id: hospitalId,
      blood_group: bg,
      units_available: 10,
    }));

    console.log('Initializing blood inventory (10 units per group)...');
    const { error: invError } = await supabase.from('blood_inventory').insert(inventoryRows);
    if (invError) {
      console.error('Failed to seed blood inventory:', invError);
    } else {
      console.log('Blood inventory initialized successfully');
    }
  } else {
    hospitalId = existingHospital.id;
    console.log(`Hospital profile already exists with ID: ${hospitalId}`);
  }

  // Update user_metadata with entity_id if not present
  if (hospitalAuthUser.user_metadata?.entity_id !== hospitalId) {
    console.log(`Updating hospital user_metadata with entity_id: ${hospitalId}`);
    const { error: updateMetaError } = await supabase.auth.admin.updateUserById(hospitalAuthUser.id, {
      user_metadata: {
        role: 'hospital',
        entity_id: hospitalId,
      },
    });
    if (updateMetaError) {
      console.error('Failed to update hospital metadata:', updateMetaError);
    } else {
      console.log('Hospital metadata updated successfully');
    }
  }

  // 3. Create/Ensure Admin User
  const adminEmail = 'sanmith-admin@gmail.com';
  const adminPassword = 'qwertyuiop';

  console.log(`Checking if admin user ${adminEmail} exists...`);
  let adminAuthUser = users.users.find(u => u.email === adminEmail);

  if (!adminAuthUser) {
    console.log(`Creating admin auth user: ${adminEmail}`);
    const { data: newAdmin, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        entity_id: 'admin_1',
      },
    });

    if (adminError || !newAdmin.user) {
      console.error('Failed to create admin user:', adminError);
      process.exit(1);
    }
    adminAuthUser = newAdmin.user;
    console.log(`Admin auth user created with ID: ${adminAuthUser.id}`);
  } else {
    console.log(`Admin auth user already exists with ID: ${adminAuthUser.id}`);
    
    // Make sure role and entity_id are correct
    if (
      adminAuthUser.user_metadata?.role !== 'admin' ||
      adminAuthUser.user_metadata?.entity_id !== 'admin_1'
    ) {
      console.log('Updating admin metadata to role "admin"...');
      await supabase.auth.admin.updateUserById(adminAuthUser.id, {
        user_metadata: {
          role: 'admin',
          entity_id: 'admin_1',
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main().catch(err => {
  console.error('Unexpected seeding error:', err);
  process.exit(1);
});
