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
  const isMetricsSorting = params.sorting?.some(sort =>
    sort.id === 'duration_p50' || sort.id === 'total_estimated_cost_sum'
  );

  // For basic projects: only pass non-metrics sorting
  const basicProjectsParams = {
    ...params,
    sorting: isMetricsSorting ? [] : params.sorting, // Remove sorting for metrics fields
  };

  // For stats: pass all sorting (stats endpoint will handle both)
  const statsParams = {
    ...params,
  };

  const { data: projectsData, isPending } = useProjectsList(basicProjectsParams, {
    ...config,
    placeholderData: keepPreviousData,
  } as never);

  const { data: projectsStatisticData } = useProjectStatisticsList(
    statsParams,
    {
      ...config,
      placeholderData: keepPreviousData,
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

      // If metrics sorting is involved, use stats data order, otherwise use projects data order
      const orderedContent = isMetricsSorting && projectsStatisticData?.content
        ? projectsStatisticData.content.map((statistic) => {
            const project = projectsMap[statistic.project_id!];
            return project
              ? {
                  ...project,
                  ...statistic,
                }
              : statistic;
          })
        : projectsData.content?.map((project) => {
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
