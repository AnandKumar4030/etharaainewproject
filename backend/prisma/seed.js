const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create superadmin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'superadmin',
    },
  });

  // Create regular users
  const userPassword = await bcrypt.hash('password123', 10);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      passwordHash: userPassword,
      role: 'member',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      passwordHash: userPassword,
      role: 'member',
    },
  });

  // Create a project
  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Redesign the company website with modern UX/UI',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'admin' },
          { userId: bob.id, role: 'member' },
        ],
      },
    },
  });

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design wireframes',
        description: 'Create wireframes for all main pages',
        projectId: project.id,
        assigneeId: alice.id,
        createdById: alice.id,
        status: 'done',
        priority: 'high',
      },
      {
        title: 'Set up React project',
        description: 'Initialize Vite + React + Tailwind setup',
        projectId: project.id,
        assigneeId: bob.id,
        createdById: alice.id,
        status: 'in_progress',
        priority: 'high',
      },
      {
        title: 'Implement authentication',
        description: 'JWT-based login and signup flow',
        projectId: project.id,
        assigneeId: bob.id,
        createdById: alice.id,
        status: 'todo',
        priority: 'medium',
      },
      {
        title: 'Write unit tests',
        description: 'Cover core components with tests',
        projectId: project.id,
        assigneeId: null,
        createdById: alice.id,
        status: 'todo',
        priority: 'low',
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Alice: alice@example.com / password123');
  console.log('  Bob:   bob@example.com   / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
