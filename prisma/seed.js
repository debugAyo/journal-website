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
      affiliation: "University Medical Center",
      isVerified: true,
    },
  });

  const reviewer1 = await prisma.user.create({
    data: {
      email: "reviewer1@example.com",
      passwordHash: passwordHash,
      name: "Dr. John Smith",
      role: "REVIEWER",
      affiliation: "State University Hospital",
      isVerified: true,
    },
  });

  const reviewer2 = await prisma.user.create({
    data: {
      email: "reviewer2@example.com",
      passwordHash: passwordHash,
      name: "Dr. Maria Garcia",
      role: "REVIEWER",
      affiliation: "Research Institute of Medicine",
      isVerified: true,
    },
  });

  const author1 = await prisma.user.create({
    data: {
      email: "author1@example.com",
      passwordHash: passwordHash,
      name: "Dr. Michael Brown",
      role: "AUTHOR",
      affiliation: "City General Hospital",
      isVerified: true,
    },
  });

  const author2 = await prisma.user.create({
    data: {
      email: "author2@example.com",
      passwordHash: passwordHash,
      name: "Dr. Emily Johnson",
      role: "AUTHOR",
      affiliation: "National Health Institute",
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
      title: "Novel Approaches in Cardiovascular Disease Prevention",
      abstract:
        "This study examines innovative strategies for preventing cardiovascular disease in high-risk populations. We conducted a randomized controlled trial with 500 participants over 24 months, comparing traditional intervention methods with a new integrated approach combining lifestyle modifications and targeted pharmacotherapy. Results demonstrate a 35% reduction in cardiovascular events in the intervention group.",
      keywords: ["cardiovascular", "prevention", "clinical trial", "intervention"],
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
      title: "Machine Learning Applications in Medical Diagnostics",
      abstract:
        "This review explores the current state of machine learning applications in medical diagnostics, covering image analysis, predictive modeling, and clinical decision support systems. We analyze 150 studies published between 2020-2024 and identify key trends, challenges, and future directions for AI-assisted diagnosis.",
      keywords: ["machine learning", "diagnostics", "artificial intelligence", "review"],
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
      title: "Antibiotic Resistance Patterns in Hospital-Acquired Infections",
      abstract:
        "We present a comprehensive analysis of antibiotic resistance patterns in hospital-acquired infections across 25 healthcare facilities over a 5-year period. Our findings reveal alarming trends in multi-drug resistant organisms and highlight the urgent need for antimicrobial stewardship programs.",
      keywords: ["antibiotic resistance", "hospital infections", "epidemiology", "stewardship"],
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
          { name: "Dr. James Wilson", affiliation: "State Medical School" },
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
      title: "Nutritional Interventions for Cognitive Health in Aging Populations",
      abstract:
        "A systematic review and meta-analysis of dietary interventions aimed at preserving cognitive function in elderly populations. We analyzed 45 randomized controlled trials and identified key nutritional factors associated with reduced cognitive decline.",
      keywords: ["nutrition", "cognitive health", "aging", "meta-analysis"],
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
