// src/services/proposalRankingService.ts
import "server-only";
import prisma from "../lib/prisma";
import {
    compareProposalsWithAi,
    ProposalForAi,
} from "./aiService";
import { Prisma } from "@prisma/client";

export async function rankProposalsForRfp(rfpId: string) {
    const [rfp, proposals] = await Promise.all([
        prisma.rfp.findUnique({
            where: { id: rfpId },
        }),
        prisma.proposal.findMany({
            where: { rfpId },
            include: {
                vendor: true,
            },
        }),
    ]);

    if (!rfp || proposals.length === 0) return [];

    const aiInput: ProposalForAi[] = proposals.map((p) => ({
        proposalId: p.id,
        vendorName: p.vendor?.name ?? null,
        totalPrice: p.totalPrice ? Number(p.totalPrice) : null,
        currency: p.currency ?? null,
        completeness: p.completeness ?? null,
        parsed: (p.parsed ?? {}) as any,
    }));

    const aiResult = await compareProposalsWithAi(aiInput, {
        rfpId,
        rfpTitle: rfp.title,
        rfpDescription: rfp.description,
        rfpStructured: rfp.structured ?? null,
    });

    await prisma.$transaction(async (tx) => {
        // reset existing AI fields
        await tx.proposal.updateMany({
            where: { rfpId },
            data: {
                aiScore: null,
                aiRank: null,
                isTopChoice: false,
                aiExplanation: Prisma.DbNull,
            },
        });

        for (const item of aiResult) {
            await tx.proposal.update({
                where: { id: item.proposalId },
                data: {
                    aiScore: item.score,
                    aiRank: item.rank,
                    isTopChoice: item.rank === 1,
                    aiExplanation: item.explanation ?? null,
                },
            });
        }
    });

    return aiResult;
}
