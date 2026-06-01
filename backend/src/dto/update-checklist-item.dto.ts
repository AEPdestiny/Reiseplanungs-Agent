import type { Checklist } from "@travel-agent/shared";

export class UpdateChecklistItemParamsDto {
  tripId!: string;
  itemId!: string;
}

export class UpdateChecklistItemRequestDto {
  completed!: boolean;
}

export class UpdateChecklistItemResponseDto {
  checklist?: Checklist;
}
