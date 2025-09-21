import { useMemo } from "react";
import { keepPreviousData, UseQueryOptions } from "@tanstack/react-query";
import { Sorting } from "@/types/sorting";
import { ProjectStatistic, ProjectWithStatistic } from "@/types/projects";
import useProjectsList from "@/api/projects/useProjectsList";
import useProjectStatisticsList from "@/api/projects/useProjectStatisticList";

type UseProjectWithStatisticsParams = {
  workspaceName: string;
  search?: string;
  sorting?: Sorting;
  page: number;
  size: number;
};

type UseProjectWithStatisticsResponse = {
  data: {
    content: ProjectWithStatistic[];
    total: number;
  };
  isPending: boolean;
};

export default function useProjectWithStatisticsList(
  params: UseProjectWithStatisticsParams,
  config: Omit<UseQueryOptions, "queryKey" | "queryFn">,
) {
  // Separate database fields from metrics fields for sorting
  const isMetricsSorting = params.sorting?.some(sort => {
    const field = sort.field || sort.id;
    const isDurationField = field?.startsWith('duration.') || field?.startsWith('duration_');
    const isCostField = field === 'total_estimated_cost_sum';
    return isDurationField || isCostField;
  });

  // For basic projects: when metrics sorting, fetch ALL projects (no pagination)
  // This ensures we have all project names available for merging with stats data
  const basicProjectsParams = {
    ...params,
    sorting: isMetricsSorting ? [{ id: "name", desc: false }] : params.sorting,
    // When sorting by metrics, fetch all projects to get all names
    size: isMetricsSorting ? 1000 : params.size,
    page: isMetricsSorting ? 1 : params.page,
  };

  // For stats: pass all sorting (stats endpoint will handle both)
  const statsParams = {
    ...params,
  };

  const { data: projectsData, isPending } = useProjectsList(basicProjectsParams, {
    ...config,
    placeholderData: keepPreviousData,
    enabled: true, // Always call basic projects API for project info
  } as never);

  const { data: projectsStatisticData } = useProjectStatisticsList(
    statsParams,
    {
      ...config,
      placeholderData: keepPreviousData,
      enabled: true, // Always call stats API
    } as never,
  );

  const data = useMemo(() => {
    if (projectsData) {
      let statisticMap: Record<string, ProjectStatistic> = {};
      let projectsMap: Record<string, any> = {};

      // Create maps for efficient lookup
      if (projectsStatisticData && projectsStatisticData.content?.length > 0) {
        statisticMap = projectsStatisticData.content.reduce<
          Record<string, ProjectStatistic>
        >((acc, statistic) => {
          acc[statistic.project_id!] = statistic;
          return acc;
        }, {});
      }

      projectsMap = projectsData.content?.reduce<Record<string, any>>(
        (acc, project) => {
          acc[project.id] = project;
          return acc;
        },
        {}
      ) || {};

      // If metrics sorting is involved, use stats data order and pagination
      if (isMetricsSorting && projectsStatisticData?.content) {
        // For metrics sorting, use the stats data order and pagination
        // but enrich with basic project info where available
        const orderedContent = projectsStatisticData.content
          .map((statistic) => {
            const basicProjectInfo = projectsMap[statistic.project_id!];
            return {
              ...statistic, // Stats data (this has project_id)
              ...basicProjectInfo, // Basic project info (this has id, name, etc.)
              // Fallback name from project_id if no basic project info available
              name: basicProjectInfo?.name || statistic.project_id || 'Unknown Project',
            };
          });

        return {
          content: orderedContent,
          total: projectsStatisticData.total,
          page: projectsStatisticData.page,
          size: projectsStatisticData.size,
        };
      }

      // For non-metrics sorting, use projects data order and merge with stats
      const orderedContent = projectsData.content?.map((project) => {
        return statisticMap[project.id]
          ? {
              ...project,
              ...statisticMap[project.id],
            }
          : project;
      }) || [];

      return {
        ...projectsData,
        content: orderedContent,
      };
    }

    return { content: [], total: 0 };
  }, [projectsData, projectsStatisticData, isMetricsSorting]);

  return {
    data,
    isPending,
  } as UseProjectWithStatisticsResponse;
}
