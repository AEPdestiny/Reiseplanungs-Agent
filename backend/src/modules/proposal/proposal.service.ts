import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { ReplanningProposal, Trip } from "@travel-agent/shared";

@Injectable()
export class ProposalService {
  private readonly proposalsByTripId = new Map<string, ReplanningProposal[]>();

  savePendingProposal(tripId: string, proposal: ReplanningProposal): ReplanningProposal {
    const proposals = this.proposalsByTripId.get(tripId) ?? [];
    proposals.push(proposal);
    this.proposalsByTripId.set(tripId, proposals);
    return proposal;
  }

  findProposal(tripId: string, proposalId: string): ReplanningProposal | undefined {
    return this.proposalsByTripId.get(tripId)?.find((proposal) => proposal.id === proposalId);
  }

  acceptProposal(trip: Trip, proposalId: string): ReplanningProposal {
    const proposal = this.getPendingProposal(trip.id, proposalId);
    const now = new Date().toISOString();

    proposal.status = "accepted";
    proposal.proposedPlan.status = "active";
    proposal.proposedPlan.updatedAt = now;
    trip.activePlan = proposal.proposedPlan;
    trip.proposals = this.getTripProposals(trip.id);
    trip.updatedAt = now;

    return proposal;
  }

  rejectProposal(trip: Trip, proposalId: string): ReplanningProposal {
    const proposal = this.getPendingProposal(trip.id, proposalId);

    proposal.status = "rejected";
    trip.proposals = this.getTripProposals(trip.id);
    trip.updatedAt = new Date().toISOString();

    return proposal;
  }

  getTripProposals(tripId: string): ReplanningProposal[] {
    return [...(this.proposalsByTripId.get(tripId) ?? [])];
  }

  private getPendingProposal(tripId: string, proposalId: string): ReplanningProposal {
    const proposal = this.findProposal(tripId, proposalId);

    if (!proposal) {
      throw new NotFoundException({
        error: {
          code: "PROPOSAL_NOT_FOUND",
          message: "Vorschlag existiert nicht."
        }
      });
    }

    if (proposal.status !== "pending") {
      throw new BadRequestException({
        error: {
          code: "PROPOSAL_NOT_PENDING",
          message: "Vorschlag wurde bereits bearbeitet."
        }
      });
    }

    return proposal;
  }
}
