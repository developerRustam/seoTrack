import { baseApi } from "../../../shared/api/baseApi";
import type { Project, CheckFrequencyEnum, AdditionalPage } from "../../../shared/types/project";
import type {ActiveCheckRun, CheckRun } from "../../../shared/types/run";
import type {IncidentItem } from "../../../shared/types/run";

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjects: build.query<Project[], void>({
      query: () => "/projects",
      providesTags: (result) =>
        result
          ? [
              { type: "Projects", id: "LIST" },
              ...result.map((project) => ({ type: "Projects" as const, id: project.id })),
            ]
          : [{ type: "Projects", id: "LIST" }],
    }),
    getProject: build.query<Project, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Projects", id }],
    }),
    getCheckRuns: build.query<CheckRun[], string>({
      query: (projectId) => `/projects/${projectId}/check-runs`,
      providesTags: (result) =>
        result
          ? [
              { type: "CheckRuns", id: "LIST" },
              ...result.map((checkRun) => ({ type: "CheckRuns" as const, id: checkRun.id })),
            ]
          : [{ type: "CheckRuns", id: "LIST" }],
    }),
   
    getAdditionalPages: build.query<AdditionalPage[],  string>({
      query: (id) =>  `/projects/${id}/additional-pages`,
      providesTags: (_result, _error, id) => [{ type: "Projects", id }],
    }),
    addAdditionalPage: build.mutation<AdditionalPage[], { projectId: string; page: AdditionalPage }>({
    query: ({ projectId, page }) => ({
      url: `/projects/${projectId}/additional-pages`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page }),
    }),
    invalidatesTags: (_result, _error, arg) => [
      { type: "Projects", id: arg.projectId },
      "Projects",
    ],
  }),
    startCheckRun: build.mutation<{ ok: boolean; runId: string }, string>({
      query: (projectId) => ({
        url: `/projects/${projectId}/check-runs`,
        method: "POST",
      }),
      invalidatesTags: ["CheckRuns", "Projects"],
    }),
    updateProjectSettings: build.mutation<Project, { projectId: string, name: string,  url: string, checkFrequency: CheckFrequencyEnum}>({
        query: ({ projectId, ...body }) => ({
          url: `/projects/${projectId}/settings`,
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        invalidatesTags: (_r, _e, arg) => [{ type: "Projects", id: arg.projectId }, "Projects"],
    }),
    createProject: build.mutation<Project, { name: string; url: string }>({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      invalidatesTags: ["Projects"],
    }),
    fetchActiveCheckRun: build.query<ActiveCheckRun, void>({
      query: () => ({url: `/check-runs/active`}),
      providesTags: ["CheckRuns"],
    }),
    fetchIncidents: build.query<IncidentItem[], void>({
      query: () => ({url: '/incidents'}),
      providesTags: ["CheckRuns", "Projects"],
    })
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetCheckRunsQuery,
  useGetAdditionalPagesQuery,
  useUpdateProjectSettingsMutation,
  useAddAdditionalPageMutation,
  useStartCheckRunMutation,
  useCreateProjectMutation,
  useFetchIncidentsQuery,
  useFetchActiveCheckRunQuery
} = projectsApi;
