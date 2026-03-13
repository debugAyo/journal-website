require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.editorialDecision.deleteMany();
  await prisma.article.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.volume.deleteMany();
  await prisma.user.deleteMany();

  // Create users with different roles
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@ijeccet.org",
      passwordHash: passwordHash,
      name: "Admin User",
      role: "ADMIN",
      affiliation: "IJECCET Editorial Office",
      isVerified: true,
    },
  });

  const editor = await prisma.user.create({
    data: {
      email: "editor@ijeccet.org",
      passwordHash: passwordHash,
      name: "Dr. Sarah Chen",
      role: "EDITOR",
      affiliation: "Department of Electronics Engineering",
      isVerified: true,
    },
  });

  const reviewer1 = await prisma.user.create({
    data: {
      email: "reviewer1@example.com",
      passwordHash: passwordHash,
      name: "Dr. John Smith",
      role: "REVIEWER",
      affiliation: "School of Computer Science and Embedded Systems",
      isVerified: true,
    },
  });

  const reviewer2 = await prisma.user.create({
    data: {
      email: "reviewer2@example.com",
      passwordHash: passwordHash,
      name: "Dr. Maria Garcia",
      role: "REVIEWER",
      affiliation: "Institute of Communications Engineering",
      isVerified: true,
    },
  });

  const author1 = await prisma.user.create({
    data: {
      email: "author1@example.com",
      passwordHash: passwordHash,
      name: "Dr. Michael Brown",
      role: "AUTHOR",
      affiliation: "Department of Information Technology",
      isVerified: true,
    },
  });

  const author2 = await prisma.user.create({
    data: {
      email: "author2@example.com",
      passwordHash: passwordHash,
      name: "Dr. Emily Johnson",
      role: "AUTHOR",
      affiliation: "Embedded Systems Research Center",
      isVerified: true,
    },
  });

  console.log("✅ Created 6 users");

  // Create volumes and issues
  console.log("Creating volumes and issues...");
  const currentYear = new Date().getFullYear();

  const volume1 = await prisma.volume.create({
    data: {
      volumeNumber: 1,
      year: currentYear - 1,
    },
  });

  const volume2 = await prisma.volume.create({
    data: {
      volumeNumber: 2,
      year: currentYear,
    },
  });

  const issue1 = await prisma.issue.create({
    data: {
      volumeId: volume1.id,
      issueNumber: 1,
      title: "Spring Issue",
      publishedAt: new Date(currentYear - 1, 2, 1),
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      volumeId: volume1.id,
      issueNumber: 2,
      title: "Summer Issue",
      publishedAt: new Date(currentYear - 1, 5, 1),
    },
  });

  const issue3 = await prisma.issue.create({
    data: {
      volumeId: volume2.id,
      issueNumber: 1,
      title: "Winter Issue",
      publishedAt: new Date(currentYear, 0, 15),
    },
  });

  console.log("✅ Created 2 volumes and 3 issues");

  // Create published articles
  console.log("Creating articles...");
  const publishedArticle1 = await prisma.article.create({
    data: {
      title: "Machine Learning Applications in Electronics Engineering, Computer Science, and Communications",
      abstract:
        "This review explores the current state of machine learning applications in Electronics Engineering, Computer Science, Communications Engineering, Information Technology, Embedded Systems, and Emerging Technologies. It covers network optimization, signal processing, embedded systems, and predictive maintenance. We analyze 150 studies published between 2020-2024 and identify key trends, challenges, and future directions for AI-assisted systems in these fields.",
      keywords: ["machine learning", "electronics engineering", "computer science", "communications engineering", "information technology", "embedded systems", "emerging technologies", "review"],
      status: "PUBLISHED",
      issueId: issue3.id,
      pageStart: 1,
      pageEnd: 15,
      doi: "10.xxxx/uj.2025.001",
      publishedAt: new Date(currentYear, 0, 15),
    },
  });

  const publishedArticle2 = await prisma.article.create({
    data: {
      title: "Emerging Technologies in Electronics and Computing",
      abstract:
        "This review highlights the latest advancements in electronics engineering, computer science, communications engineering, information technology, embedded systems, and emerging technologies. We analyze 120 studies published between 2020-2024 and discuss innovations, challenges, and future directions for these fields.",
      keywords: ["electronics engineering", "computer science", "communications engineering", "information technology", "embedded systems", "emerging technologies", "innovation", "review"],
      status: "PUBLISHED",
      issueId: issue3.id,
      pageStart: 16,
      pageEnd: 32,
      doi: "10.xxxx/uj.2025.002",
      publishedAt: new Date(currentYear, 0, 15),
    },
  });

  const publishedArticle3 = await prisma.article.create({
    data: {
      title: "Advances in Embedded Systems and IT Security",
      abstract:
        "We present a comprehensive analysis of embedded systems and information technology security trends across 25 research facilities over a 5-year period. Our findings reveal key developments in secure embedded platforms and highlight the urgent need for robust cybersecurity programs.",
      keywords: ["embedded systems", "information technology", "cybersecurity", "platform security", "review"],
      status: "PUBLISHED",
      issueId: issue2.id,
      pageStart: 1,
      pageEnd: 18,
      doi: "10.xxxx/uj.2024.015",
      publishedAt: new Date(currentYear - 1, 5, 1),
    },
  });

  // Create submissions for published articles
  await prisma.submission.create({
    data: {
      articleId: publishedArticle1.id,
      submittedBy: author1.id,
      revisionNumber: 1,
      notes: JSON.stringify({
        coAuthors: [
          { name: "Dr. James Wilson", affiliation: "School of Electronics Engineering" },
        ],
      }),
    },
  });

  await prisma.submission.create({
    data: {
      articleId: publishedArticle2.id,
      submittedBy: author2.id,
      revisionNumber: 1,
    },
  });

  await prisma.submission.create({
    data: {
      articleId: publishedArticle3.id,
      submittedBy: author1.id,
      revisionNumber: 1,
    },
  });

  // Create article in review
  const articleInReview = await prisma.article.create({
    data: {
      title: "Telemedicine Adoption During the Post-Pandemic Era",
      abstract:
        "This study evaluates the sustained adoption of telemedicine services following the COVID-19 pandemic. Through surveys of 2,000 patients and 300 healthcare providers, we assess satisfaction levels, barriers to adoption, and recommendations for improving virtual care delivery.",
      keywords: ["telemedicine", "telehealth", "pandemic", "patient satisfaction"],
      status: "UNDER_REVIEW",
    },
  });

  await prisma.submission.create({
    data: {
      articleId: articleInReview.id,
      submittedBy: author2.id,
      revisionNumber: 1,
    },
  });

  // Create reviews for article in review
  await prisma.review.create({
    data: {
      articleId: articleInReview.id,
      reviewerId: reviewer1.id,
      status: "INVITED",
    },
  });

  await prisma.review.create({
    data: {
      articleId: articleInReview.id,
      reviewerId: reviewer2.id,
      status: "INVITED",
    },
  });

  // Create submitted article (awaiting assignment)
  const submittedArticle = await prisma.article.create({
    data: {
      title: "Innovations in Embedded Systems for Emerging Technologies",
      abstract:
        "A systematic review and meta-analysis of embedded systems innovations aimed at advancing emerging technologies. We analyzed 45 research projects and identified key engineering factors associated with improved system performance and reliability.",
      keywords: ["embedded systems", "emerging technologies", "electronics engineering", "computing", "meta-analysis"],
      status: "SUBMITTED",
    },
  });

  await prisma.submission.create({
    data: {
      articleId: submittedArticle.id,
      submittedBy: author1.id,
      revisionNumber: 1,
    },
  });

  console.log("✅ Created 5 articles with submissions");

  // Create sample notifications
  console.log("Creating notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: author1.id,
        type: "PUBLICATION",
        message: `Your article "${publishedArticle1.title}" has been published in Volume 2, Issue 1.`,
        isRead: true,
      },
      {
        userId: author2.id,
        type: "ASSIGNMENT",
        message: `Your article "${articleInReview.title}" has been assigned to reviewers.`,
        isRead: false,
      },
      {
        userId: reviewer1.id,
        type: "REVIEW_ASSIGNED",
        message: "You have been assigned a new article to review.",
        isRead: false,
      },
      {
        userId: reviewer2.id,
        type: "REVIEW_ASSIGNED",
        message: "You have been assigned a new article to review.",
        isRead: false,
      },
    ],
  });

  console.log("✅ Created notifications");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("================================");
  console.log("Admin:     admin@ijeccet.org    / password123");
  console.log("Editor:    editor@ijeccet.org   / password123");
  console.log("Reviewer:  reviewer1@example.com    / password123");
  console.log("Reviewer:  reviewer2@example.com    / password123");
  console.log("Author:    author1@example.com      / password123");
  console.log("Author:    author2@example.com      / password123");
  console.log("================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
