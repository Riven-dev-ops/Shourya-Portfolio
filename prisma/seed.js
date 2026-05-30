import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Admin User
  const adminEmail = 'admin@inexa.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Alson Ori',
        role: 'ADMIN'
      }
    });
    console.log('Admin user created: admin@inexa.com / admin123');
  } else {
    console.log('Admin user already exists.');
  }

  // 2. Clear Existing Projects and FAQs
  await prisma.project.deleteMany({});
  await prisma.faq.deleteMany({});

  // 3. Create Projects
  const projects = [
    {
      title: 'PixelPush App',
      description: 'PixelPush is an app designed to simplify mobile interfaces.',
      category: 'ui-ux products development',
      client: 'Aetheria Studio',
      startDate: '01 May 2024',
      completeDate: '01 June 2024',
      services: 'UI/UX Design, Development',
      website: 'pixelpush.io',
      imageUrl: 'assets/imgs/background/img-portfolio-5.png',
      gallery: 'assets/imgs/background/img-portfolio-details-1.png,assets/imgs/background/img-portfolio-details-2.png,assets/imgs/background/img-portfolio-details-3.png',
      featured: true
    },
    {
      title: 'Designo Pro App',
      description: 'Designo Pro provides automated graphics layout assistance.',
      category: 'ui-ux graphics',
      client: 'Vortech Media',
      startDate: '10 Feb 2024',
      completeDate: '20 Mar 2024',
      services: 'UI/UX Design, Graphics',
      website: 'designopro.io',
      imageUrl: 'assets/imgs/background/img-portfolio-8.png',
      gallery: 'assets/imgs/background/img-portfolio-details-1.png',
      featured: true
    },
    {
      title: 'Elegant E-commerce',
      description: 'A responsive layout concept built for fashion templates.',
      category: 'ui-ux template',
      client: 'Moda Elegante',
      startDate: '15 Mar 2024',
      completeDate: '30 Apr 2024',
      services: 'Web Design, Template Crafting',
      website: 'elegantecommerce.com',
      imageUrl: 'assets/imgs/background/img-portfolio-6.png',
      gallery: 'assets/imgs/background/img-portfolio-details-2.png',
      featured: true
    },
    {
      title: 'Mobile App Development',
      description: 'React Native companion tracking application.',
      category: 'development ui-ux',
      client: 'Fushio Company',
      startDate: '01 May 2024',
      completeDate: '01 June 2024',
      services: 'UI/UX Design, React Native Development',
      website: 'fushion.wr',
      imageUrl: 'assets/imgs/background/img-portfolio-7.png',
      gallery: 'assets/imgs/background/img-portfolio-details-1.png,assets/imgs/background/img-portfolio-details-2.png,assets/imgs/background/img-portfolio-details-3.png',
      featured: true
    },
    {
      title: 'Fashion Forward',
      description: 'E-commerce listing platform with tailored filters.',
      category: 'template products',
      client: 'Hanger Corp',
      startDate: '01 Jan 2024',
      completeDate: '15 Feb 2024',
      services: 'Product Strategy, Front-End Dev',
      website: 'fashionforward.com',
      imageUrl: 'assets/imgs/background/img-portfolio-9.png',
      gallery: 'assets/imgs/background/img-portfolio-details-3.png',
      featured: false
    },
    {
      title: 'Fitness Tracker',
      description: 'Gamified UI dashboard concept.',
      category: 'graphics products',
      client: 'HealthTrack Inc',
      startDate: '12 Nov 2023',
      completeDate: '28 Dec 2023',
      services: 'Dashboard Design, Odometer Assets',
      website: 'fit-track.io',
      imageUrl: 'assets/imgs/background/img-portfolio-10.png',
      gallery: 'assets/imgs/background/img-portfolio-details-2.png',
      featured: false
    }
  ];

  for (const project of projects) {
    await prisma.project.create({ data: project });
  }
  console.log('Projects seeded successfully.');

  // 4. Create FAQs
  const faqs = [
    {
      question: 'What is the main focus of your portfolio?',
      answer: 'You may also realize cost savings from your energy efficient choices in your custom home. Federal tax credits for some green materials can allow you to deduct as much.',
      order: 1
    },
    {
      question: 'Will you include a blog or other written content?',
      answer: 'You may also realize cost savings from your energy efficient choices in your custom home. Federal tax credits for some green materials can allow you to deduct as much.',
      order: 2
    },
    {
      question: 'How frequently will you update your portfolio?',
      answer: 'You may also realize cost savings from your energy efficient choices in your custom home. Federal tax credits for some green materials can allow you to deduct as much.',
      order: 3
    },
    {
      question: 'Can I hire you for custom branding services?',
      answer: 'Yes, we provide branding identity designs, vector styles, typography palettes, and custom illustrations matching your product values.',
      order: 4
    }
  ];

  for (const faq of faqs) {
    await prisma.faq.create({ data: faq });
  }
  console.log('FAQs seeded successfully.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
