import { prisma } from "../../../../packages/prisma/index.js";

export const getPreviousScan = async (repoUrl) => {
  try {
    const previousScan = await prisma.scan.findFirst({
      where: {
        repoUrl,
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return previousScan;
  } catch (error) {
    console.error(
      "[Previous Scan Error]",
      error.message
    );

    return null;
  }
};