export type ChecklistItemCategory = "packing" | "documents" | "booking" | "preparation";
export type ChecklistPriority = "low" | "medium" | "high";

export interface ChecklistItem {
  id: string;
  label: string;
  category: ChecklistItemCategory;
  completed: boolean;
  priority: ChecklistPriority;
}

export interface Checklist {
  id: string;
  tripId: string;
  items: ChecklistItem[];
}
