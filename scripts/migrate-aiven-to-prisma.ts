/**
 * Database Migration Script: Aiven to Prisma PostgreSQL
 * 
 * This script migrates data from an Aiven PostgreSQL database to a Prisma PostgreSQL database.
 * 
 * Requirements:
 * - Set AIVEN_DATABASE_URL in your .env or .env.local file
 * - Set PRISMA_DATABASE_URL in your .env or .env.local file
 * - Both databases must have the same schema structure
 * 
 * Usage:
 *   npm run migrate:aiven
 * 
 * The script will:
 * 1. Count rows in each table from the Aiven database
 * 2. Display the counts for review
 * 3. Migrate all data using upsert operations (updates existing, creates new)
 * 4. Verify the migration by counting rows in the Prisma database
 * 
 * Migration order respects foreign key dependencies:
 * User → Course → Attachment/Chapter → ChapterAttachment → UserProgress → 
 * PurchaseCode → Purchase → BalanceTransaction → Quiz → Question → 
 * QuizResult → QuizAnswer
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const AIVEN_DATABASE_URL = process.env.AIVEN_DATABASE_URL;
const PRISMA_DATABASE_URL = process.env.PRISMA_DATABASE_URL;

if (!AIVEN_DATABASE_URL) {
  throw new Error("AIVEN_DATABASE_URL is not set in environment variables");
}

if (!PRISMA_DATABASE_URL) {
  throw new Error("PRISMA_DATABASE_URL is not set in environment variables");
}

// Create Prisma clients for both databases
const aivenClient = new PrismaClient({
  datasources: {
    db: {
      url: AIVEN_DATABASE_URL,
    },
  },
});

const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: PRISMA_DATABASE_URL,
    },
  },
});

// Define table names in migration order (respecting foreign key dependencies)
const tables = [
  "User",
  "Course",
  "Attachment",
  "Chapter",
  "ChapterAttachment",
  "UserProgress",
  "PurchaseCode",
  "Purchase",
  "BalanceTransaction",
  "Quiz",
  "Question",
  "QuizResult",
  "QuizAnswer",
] as const;

type TableName = (typeof tables)[number];

interface TableStats {
  tableName: string;
  rowCount: number;
}

/**
 * Count rows in a table from Aiven database
 */
async function countRowsInTable(tableName: string): Promise<number> {
  try {
    const result = await aivenClient.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return Number(result[0].count);
  } catch (error) {
    console.error(`Error counting rows in ${tableName}:`, error);
    return 0;
  }
}

/**
 * Get all row counts for all tables
 */
async function getAllTableCounts(): Promise<TableStats[]> {
  console.log("\n📊 Counting rows in Aiven database...\n");
  const stats: TableStats[] = [];

  for (const tableName of tables) {
    const count = await countRowsInTable(tableName);
    stats.push({ tableName, rowCount: count });
    console.log(`  ${tableName.padEnd(25)} ${count.toString().padStart(10)} rows`);
  }

  const totalRows = stats.reduce((sum, stat) => sum + stat.rowCount, 0);
  console.log(`\n  ${"TOTAL".padEnd(25)} ${totalRows.toString().padStart(10)} rows\n`);

  return stats;
}

/**
 * Migrate User table
 */
async function migrateUsers(): Promise<void> {
  console.log("🔄 Migrating Users...");
  const users = await aivenClient.user.findMany();

  for (const user of users) {
    await prismaClient.user.upsert({
      where: { id: user.id },
      update: {
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        parentPhoneNumber: user.parentPhoneNumber,
        hashedPassword: user.hashedPassword,
        image: user.image,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      create: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        parentPhoneNumber: user.parentPhoneNumber,
        hashedPassword: user.hashedPassword,
        image: user.image,
        role: user.role,
        balance: user.balance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${users.length} users`);
}

/**
 * Migrate Course table
 */
async function migrateCourses(): Promise<void> {
  console.log("🔄 Migrating Courses...");
  const courses = await aivenClient.course.findMany();

  for (const course of courses) {
    await prismaClient.course.upsert({
      where: { id: course.id },
      update: {
        userId: course.userId,
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        price: course.price,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
      create: {
        id: course.id,
        userId: course.userId,
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        price: course.price,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${courses.length} courses`);
}

/**
 * Migrate Attachment table
 */
async function migrateAttachments(): Promise<void> {
  console.log("🔄 Migrating Attachments...");
  const attachments = await aivenClient.attachment.findMany();

  for (const attachment of attachments) {
    await prismaClient.attachment.upsert({
      where: { id: attachment.id },
      update: {
        name: attachment.name,
        url: attachment.url,
        courseId: attachment.courseId,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      },
      create: {
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        courseId: attachment.courseId,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${attachments.length} attachments`);
}

/**
 * Migrate Chapter table
 */
async function migrateChapters(): Promise<void> {
  console.log("🔄 Migrating Chapters...");
  const chapters = await aivenClient.chapter.findMany();

  for (const chapter of chapters) {
    await prismaClient.chapter.upsert({
      where: { id: chapter.id },
      update: {
        title: chapter.title,
        description: chapter.description,
        videoUrl: chapter.videoUrl,
        videoType: chapter.videoType || "UPLOAD",
        youtubeVideoId: chapter.youtubeVideoId,
        documentUrl: chapter.documentUrl,
        documentName: chapter.documentName,
        position: chapter.position,
        isPublished: chapter.isPublished,
        isFree: chapter.isFree,
        courseId: chapter.courseId,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      },
      create: {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        videoUrl: chapter.videoUrl,
        videoType: chapter.videoType || "UPLOAD",
        youtubeVideoId: chapter.youtubeVideoId,
        documentUrl: chapter.documentUrl,
        documentName: chapter.documentName,
        position: chapter.position,
        isPublished: chapter.isPublished,
        isFree: chapter.isFree,
        courseId: chapter.courseId,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${chapters.length} chapters`);
}

/**
 * Migrate ChapterAttachment table
 */
async function migrateChapterAttachments(): Promise<void> {
  console.log("🔄 Migrating ChapterAttachments...");
  const chapterAttachments = await aivenClient.chapterAttachment.findMany();

  for (const attachment of chapterAttachments) {
    await prismaClient.chapterAttachment.upsert({
      where: { id: attachment.id },
      update: {
        name: attachment.name,
        url: attachment.url,
        position: attachment.position,
        chapterId: attachment.chapterId,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      },
      create: {
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        position: attachment.position,
        chapterId: attachment.chapterId,
        createdAt: attachment.createdAt,
        updatedAt: attachment.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${chapterAttachments.length} chapter attachments`);
}

/**
 * Migrate UserProgress table
 */
async function migrateUserProgress(): Promise<void> {
  console.log("🔄 Migrating UserProgress...");
  const userProgress = await aivenClient.userProgress.findMany();

  for (const progress of userProgress) {
    await prismaClient.userProgress.upsert({
      where: {
        userId_chapterId: {
          userId: progress.userId,
          chapterId: progress.chapterId,
        },
      },
      update: {
        isCompleted: progress.isCompleted,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      },
      create: {
        id: progress.id,
        userId: progress.userId,
        chapterId: progress.chapterId,
        isCompleted: progress.isCompleted,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${userProgress.length} user progress records`);
}

/**
 * Migrate PurchaseCode table
 */
async function migratePurchaseCodes(): Promise<void> {
  console.log("🔄 Migrating PurchaseCodes...");
  const purchaseCodes = await aivenClient.purchaseCode.findMany();

  for (const code of purchaseCodes) {
    await prismaClient.purchaseCode.upsert({
      where: { id: code.id },
      update: {
        code: code.code,
        courseId: code.courseId,
        createdBy: code.createdBy,
        usedBy: code.usedBy,
        usedAt: code.usedAt,
        isUsed: code.isUsed,
        createdAt: code.createdAt,
        updatedAt: code.updatedAt,
      },
      create: {
        id: code.id,
        code: code.code,
        courseId: code.courseId,
        createdBy: code.createdBy,
        usedBy: code.usedBy,
        usedAt: code.usedAt,
        isUsed: code.isUsed,
        createdAt: code.createdAt,
        updatedAt: code.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${purchaseCodes.length} purchase codes`);
}

/**
 * Migrate Purchase table
 */
async function migratePurchases(): Promise<void> {
  console.log("🔄 Migrating Purchases...");
  const purchases = await aivenClient.purchase.findMany();

  for (const purchase of purchases) {
    await prismaClient.purchase.upsert({
      where: {
        userId_courseId: {
          userId: purchase.userId,
          courseId: purchase.courseId,
        },
      },
      update: {
        status: purchase.status,
        purchaseCodeId: purchase.purchaseCodeId,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
      },
      create: {
        id: purchase.id,
        userId: purchase.userId,
        courseId: purchase.courseId,
        status: purchase.status,
        purchaseCodeId: purchase.purchaseCodeId,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${purchases.length} purchases`);
}

/**
 * Migrate BalanceTransaction table
 */
async function migrateBalanceTransactions(): Promise<void> {
  console.log("🔄 Migrating BalanceTransactions...");
  const transactions = await aivenClient.balanceTransaction.findMany();

  for (const transaction of transactions) {
    await prismaClient.balanceTransaction.upsert({
      where: { id: transaction.id },
      update: {
        userId: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
      create: {
        id: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${transactions.length} balance transactions`);
}

/**
 * Migrate Quiz table
 */
async function migrateQuizzes(): Promise<void> {
  console.log("🔄 Migrating Quizzes...");
  const quizzes = await aivenClient.quiz.findMany();

  for (const quiz of quizzes) {
    await prismaClient.quiz.upsert({
      where: { id: quiz.id },
      update: {
        title: quiz.title,
        description: quiz.description,
        position: quiz.position,
        isPublished: quiz.isPublished,
        timer: quiz.timer,
        maxAttempts: quiz.maxAttempts,
        courseId: quiz.courseId,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      },
      create: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        position: quiz.position,
        isPublished: quiz.isPublished,
        timer: quiz.timer,
        maxAttempts: quiz.maxAttempts,
        courseId: quiz.courseId,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${quizzes.length} quizzes`);
}

/**
 * Migrate Question table
 */
async function migrateQuestions(): Promise<void> {
  console.log("🔄 Migrating Questions...");
  const questions = await aivenClient.question.findMany();

  for (const question of questions) {
    await prismaClient.question.upsert({
      where: { id: question.id },
      update: {
        text: question.text,
        type: question.type,
        options: question.options,
        correctAnswer: question.correctAnswer,
        points: question.points,
        imageUrl: question.imageUrl,
        position: question.position,
        quizId: question.quizId,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
      create: {
        id: question.id,
        text: question.text,
        type: question.type,
        options: question.options,
        correctAnswer: question.correctAnswer,
        points: question.points,
        imageUrl: question.imageUrl,
        position: question.position,
        quizId: question.quizId,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${questions.length} questions`);
}

/**
 * Migrate QuizResult table
 */
async function migrateQuizResults(): Promise<void> {
  console.log("🔄 Migrating QuizResults...");
  const quizResults = await aivenClient.quizResult.findMany();

  for (const result of quizResults) {
    await prismaClient.quizResult.upsert({
      where: { id: result.id },
      update: {
        studentId: result.studentId,
        quizId: result.quizId,
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        attemptNumber: result.attemptNumber,
        submittedAt: result.submittedAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      create: {
        id: result.id,
        studentId: result.studentId,
        quizId: result.quizId,
        score: result.score,
        totalPoints: result.totalPoints,
        percentage: result.percentage,
        attemptNumber: result.attemptNumber,
        submittedAt: result.submittedAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${quizResults.length} quiz results`);
}

/**
 * Migrate QuizAnswer table
 */
async function migrateQuizAnswers(): Promise<void> {
  console.log("🔄 Migrating QuizAnswers...");
  const quizAnswers = await aivenClient.quizAnswer.findMany();

  for (const answer of quizAnswers) {
    await prismaClient.quizAnswer.upsert({
      where: { id: answer.id },
      update: {
        questionId: answer.questionId,
        quizResultId: answer.quizResultId,
        studentAnswer: answer.studentAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
      },
      create: {
        id: answer.id,
        questionId: answer.questionId,
        quizResultId: answer.quizResultId,
        studentAnswer: answer.studentAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
      },
    });
  }
  console.log(`  ✅ Migrated ${quizAnswers.length} quiz answers`);
}

/**
 * Create Prisma database schema if it doesn't exist
 */
async function ensurePrismaSchema(): Promise<void> {
  try {
    // Try to query the User table to verify schema exists
    await prismaClient.$queryRawUnsafe(`SELECT 1 FROM "User" LIMIT 1`);
    return; // Schema exists, nothing to do
  } catch (error: any) {
    if (error.code === "P2021" || error.message?.includes("does not exist")) {
      console.log("  ⚠️  Schema not found. Creating schema from schema.prisma...\n");
      
      // Save original DATABASE_URL
      const originalDatabaseUrl = process.env.DATABASE_URL;
      
      try {
        // Temporarily set DATABASE_URL to PRISMA_DATABASE_URL for prisma db push
        process.env.DATABASE_URL = PRISMA_DATABASE_URL;
        
        console.log("  🔄 Running: npx prisma db push --skip-generate\n");
        execSync("npx prisma db push --skip-generate --accept-data-loss", {
          stdio: "inherit",
          env: { ...process.env, DATABASE_URL: PRISMA_DATABASE_URL },
        });
        
        console.log("\n  ✅ Schema created successfully!\n");
        
        // Verify it was created
        await prismaClient.$queryRawUnsafe(`SELECT 1 FROM "User" LIMIT 1`);
      } catch (pushError: any) {
        console.error("\n  ❌ Failed to create schema automatically.\n");
        console.error("   Please run manually:");
        console.error(`   $env:DATABASE_URL="${PRISMA_DATABASE_URL}"; npx prisma db push\n`);
        throw new Error(
          "Failed to create Prisma database schema. Please run 'npx prisma db push' manually with DATABASE_URL set to PRISMA_DATABASE_URL."
        );
      } finally {
        // Restore original DATABASE_URL
        if (originalDatabaseUrl) {
          process.env.DATABASE_URL = originalDatabaseUrl;
        } else {
          delete process.env.DATABASE_URL;
        }
      }
    } else {
      throw error;
    }
  }
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  try {
    console.log("🚀 Starting database migration from Aiven to Prisma PostgreSQL\n");
    console.log(`📡 Aiven DB: ${AIVEN_DATABASE_URL?.replace(/:[^:@]+@/, ":****@")}`);
    console.log(`📡 Prisma DB: ${PRISMA_DATABASE_URL?.replace(/:[^:@]+@/, ":****@")}\n`);

    // Test connections
    console.log("🔌 Testing connections...");
    await aivenClient.$connect();
    await prismaClient.$connect();
    console.log("  ✅ Both connections successful\n");

    // Ensure Prisma schema exists (create if needed)
    console.log("🔍 Checking Prisma database schema...");
    await ensurePrismaSchema();
    console.log("  ✅ Schema ready\n");

    // Count rows before migration
    const stats = await getAllTableCounts();

    // Confirm before proceeding
    console.log("⚠️  Ready to migrate data. This will use upsert operations.");
    console.log("   Existing records will be updated if they exist.\n");

    // Perform migration in correct order
    await migrateUsers();
    await migrateCourses();
    await migrateAttachments();
    await migrateChapters();
    await migrateChapterAttachments();
    await migrateUserProgress();
    await migratePurchaseCodes();
    await migratePurchases();
    await migrateBalanceTransactions();
    await migrateQuizzes();
    await migrateQuestions();
    await migrateQuizResults();
    await migrateQuizAnswers();

    console.log("\n✅ Migration completed successfully!\n");

    // Count rows after migration in Prisma database
    console.log("📊 Verifying migrated data in Prisma database...\n");
    for (const stat of stats) {
      const count = await prismaClient.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${stat.tableName}"`
      );
      const prismaCount = Number(count[0].count);
      const match = prismaCount === stat.rowCount ? "✅" : "⚠️";
      console.log(
        `  ${match} ${stat.tableName.padEnd(25)} Aiven: ${stat.rowCount.toString().padStart(6)} → Prisma: ${prismaCount.toString().padStart(6)}`
      );
    }

    console.log("\n🎉 All done!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await aivenClient.$disconnect();
    await prismaClient.$disconnect();
  }
}

// Run migration
migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

