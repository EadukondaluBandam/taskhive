import { ApiResponse, apiClient } from "./client";

export interface ProjectDto {
  id: string;
  name: string;
  organizationId: string;
  description?: string;
  createdAt: string;
}

export const projectApi = {
  async listProjects() {
    const { data } = await apiClient.get<ApiResponse<ProjectDto[]>>("/projects");
    return data.data;
  },

  async createProject(input: { name: string; organizationId: string; description?: string }) {
    const { data } = await apiClient.post<ApiResponse<ProjectDto>>("/projects", input);
    return data.data;
  }
};
