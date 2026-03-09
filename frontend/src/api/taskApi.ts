import { ApiResponse, apiClient } from "./client";

export interface TaskDto {
  id: string;
  title?: string;
  name?: string;
  projectId: string;
  status: string;
  assignedToId?: string | null;
  createdAt: string;
}

export const taskApi = {
  async listTasks() {
    const { data } = await apiClient.get<ApiResponse<TaskDto[]>>("/tasks");
    return data.data;
  },

  async createTask(input: {
    title?: string;
    name?: string;
    projectId: string;
    assignedToId?: string;
    status?: string;
    description?: string;
  }) {
    const payload = {
      ...input,
      title: input.title || input.name,
      name: input.name || input.title
    };
    const { data } = await apiClient.post<ApiResponse<TaskDto>>("/tasks", payload);
    return data.data;
  }
};
