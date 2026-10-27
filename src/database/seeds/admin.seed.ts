
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';

import dataSource from '../data-source';

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 12) {
    throw new Error('Invalid ADMIN_EMAIL or ADMIN_PASSWORD');
  }

  await dataSource.initialize();

  try {
    const existingUsers = await dataSource.query<Array<{ id: string }>>(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (existingUsers.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await dataSource.query(
      `
        INSERT INTO users (name, email, password, role, is_active)
        VALUES ($1, $2, $3, $4, $5)
      `,
      ['Admin User', email, passwordHash, 'admin', true],
    );

    console.log('Admin user created successfully');
  } finally {
    await dataSource.destroy();
  }
}

seedAdmin().catch((error) => {
  console.error('Failed to seed admin user', error);
  process.exit(1);
});
