import { QueryFunctionContext, useQuery } from "@tanstack/react-query";
import api, {
  ANNOTATION_QUEUES_REST_ENDPOINT,
  ANNOTATION_QUEUE_KEY,
  QueryConfig,
} from "@/api/api";
import {
  AnnotationQueue,
  ANNOTATION_QUEUE_SCOPE,
} from "@/types/annotation-queues";

const getAnnotationQueueById = async (
  { signal }: QueryFunctionContext,
  { annotationQueueId }: UseAnnotationQueueByIdParams,
) => {
  const { data } = await api.get<AnnotationQueue>(
    ANNOTATION_QUEUES_REST_ENDPOINT + annotationQueueId,
    {
      signal,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404, // TODO lala
    },
  );

  // TODO lala: remove mock data when backend is ready
  const mockData: AnnotationQueue = {
    id: "ann_queue_7f3e4d2a-8b1c-4f6e-9a2d-5c8b7e4f1a3d",
    project_id: "0193da4f-16e9-75e5-a5af-39a609f63477",
    project_name: "playground",
    name: "Product Feedback Analysis Queue",
    description:
      "Queue for analyzing customer feedback traces related to product satisfaction and feature requests",
    scope: ANNOTATION_QUEUE_SCOPE.TRACE,
    instructions:
      "Please review each trace for sentiment, categorize the feedback type (bug report, feature request, compliment), and rate the urgency level. Focus on identifying actionable insights that can improve our product.",
    comments_enabled: true,
    feedback_definition_names: ["RandomReason", "User feedback", "Percentage"],
    reviewers: [
      {
        username: "sarah.johnson",
        status: 23,
      },
      {
        username: "alex.smith",
        status: 45,
      },
      {
        username: "mike.brown",
        status: 67,
      },
      {
        username: "emma.davis",
        status: 89,
      },
      {
        username: "james.wilson",
        status: 34,
      },
      {
        username: "lisa.taylor",
        status: 78,
      },
      {
        username: "david.miller",
        status: 92,
      },
      {
        username: "sophia.anderson",
        status: 56,
      },
      {
        username: "ryan.thomas",
        status: 12,
      },
      {
        username: "olivia.white",
        status: 144,
      },
    ],
    feedback_scores: [
      {
        name: "RandomReason",
        value: 0.72,
      },
      {
        name: "User feedback",
        value: 0.85,
      },
      {
        name: "Percentage",
        value: 0.64,
      },
      {
        name: "bug_severity",
        value: 0.45,
      },
      {
        name: "feature_priority",
        value: 0.93,
      },
      {
        name: "user_satisfaction",
        value: 0.78,
      },
      {
        name: "implementation_complexity",
        value: 0.66,
      },
      {
        name: "business_impact",
        value: 0.89,
      },
      {
        name: "technical_debt",
        value: 0.55,
      },
      {
        name: "performance_impact",
        value: 0.81,
      },
    ],
    items_count: 156,
    created_at: "2024-01-15T09:30:45.123Z",
    created_by: "admin@company.com",
    last_updated_at: "2024-01-18T14:22:17.456Z",
    last_updated_by: "sarah.johnson",
    last_scored_at: "2024-01-18T16:45:32.789Z",
  };

  return data?.name ? data : mockData;
};

type UseAnnotationQueueByIdParams = {
  annotationQueueId: string;
};

export default function useAnnotationQueueById(
  params: UseAnnotationQueueByIdParams,
  options?: QueryConfig<AnnotationQueue>,
) {
  return useQuery({
    queryKey: [
      ANNOTATION_QUEUE_KEY,
      { annotationQueueId: params.annotationQueueId },
    ],
    queryFn: (context) => getAnnotationQueueById(context, params),
    ...options,
  });
}
