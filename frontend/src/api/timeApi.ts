import { ApiResponse, apiClient } from "./client";

export interface TimeEntryDto {
  id: string;
  userId: string;
  taskId: string;
  startedAt?: string;
  endedAt?: string | null;
  startTime?: string;
  endTime?: string | null;
  duration: number;
  notes?: string | null;
  createdAt: string;
}

export const timeApi = {
  async listTimeEntries() {
    const { data } = await apiClient.get<ApiResponse<TimeEntryDto[]>>("/time-entries");
    return data.data;
  },

  async createTimeEntry(input: {
    taskId: string;
    startedAt?: string;
    endedAt?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
  }) {
    const payload = {
      ...input,
      startedAt: input.startedAt || input.startTime,
      endedAt: input.endedAt || input.endTime
    };
    const { data } = await apiClient.post<ApiResponse<TimeEntryDto>>("/time-entries", payload);
    return data.data;
  }
};
