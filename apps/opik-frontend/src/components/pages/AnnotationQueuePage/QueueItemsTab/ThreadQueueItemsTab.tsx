import React, { useCallback, useMemo, useState } from "react";
import {
  JsonParam,
  NumberParam,
  StringParam,
  useQueryParam,
} from "use-query-params";
import { keepPreviousData } from "@tanstack/react-query";
import useLocalStorageState from "use-local-storage-state";
import {
  ColumnPinningState,
  ColumnSort,
  RowSelectionState,
} from "@tanstack/react-table";

import {
  COLUMN_ID_ID,
  COLUMN_SELECT_ID,
  COLUMN_TYPE,
  ColumnData,
  ROW_HEIGHT,
} from "@/types/shared";
import { Thread } from "@/types/traces";
import { AnnotationQueue } from "@/types/annotation-queues";
import {
  convertColumnDataToColumn,
  isColumnSortable,
  mapColumnDataFields,
} from "@/lib/table";
import useQueryParamAndLocalStorageState from "@/hooks/useQueryParamAndLocalStorageState";
import {
  generateActionsColumDef,
  generateSelectColumDef,
} from "@/components/shared/DataTable/utils";
import Loader from "@/components/shared/Loader/Loader";
import SearchInput from "@/components/shared/SearchInput/SearchInput";
import FiltersButton from "@/components/shared/FiltersButton/FiltersButton";
import { Separator } from "@/components/ui/separator";
import DataTableRowHeightSelector from "@/components/shared/DataTableRowHeightSelector/DataTableRowHeightSelector";
import ColumnsButton from "@/components/shared/ColumnsButton/ColumnsButton";
import DataTable from "@/components/shared/DataTable/DataTable";
import DataTableNoData from "@/components/shared/DataTableNoData/DataTableNoData";
import DataTablePagination from "@/components/shared/DataTablePagination/DataTablePagination";
import LinkCell from "@/components/shared/DataTableCells/LinkCell";
import PrettyCell from "@/components/shared/DataTableCells/PrettyCell";
import PageBodyStickyContainer from "@/components/layout/PageBodyStickyContainer/PageBodyStickyContainer";
import PageBodyStickyTableWrapper from "@/components/layout/PageBodyStickyTableWrapper/PageBodyStickyTableWrapper";
import CopySMELinkButton from "@/components/pages/AnnotationQueuePage/shared/CopySMELinkButton";
import EditAnnotationQueueButton from "@/components/pages/AnnotationQueuePage/shared/EditAnnotationQueueButton";
import QueueItemActionsPanel from "@/components/pages/AnnotationQueuePage/QueueItemsTab/QueueItemActionsPanel";
import QueueItemRowActionsCell from "@/components/pages/AnnotationQueuePage/QueueItemsTab/QueueItemRowActionsCell";
import useThreadsList from "@/api/traces/useThreadsList";

interface ThreadQueueItemsTabProps {
  annotationQueue: AnnotationQueue;
}

const getRowId = (thread: Thread) => thread.id;

const REFETCH_INTERVAL = 30000;

const THREAD_COLUMNS: ColumnData<Thread>[] = [
  {
    id: "first_message",
    label: "First message",
    size: 400,
    type: COLUMN_TYPE.string,
    cell: PrettyCell as never,
    customMeta: {
      fieldType: "input",
    },
  },
  {
    id: "last_message",
    label: "Last message",
    size: 400,
    type: COLUMN_TYPE.string,
    cell: PrettyCell as never,
    customMeta: {
      fieldType: "output",
    },
  },
];

const THREAD_FILTER_COLUMNS: ColumnData<Thread>[] = [
  {
    id: COLUMN_ID_ID,
    label: "ID",
    type: COLUMN_TYPE.string,
  },
  ...THREAD_COLUMNS,
];

const DEFAULT_COLUMN_PINNING: ColumnPinningState = {
  left: [COLUMN_SELECT_ID, COLUMN_ID_ID],
  right: ["actions"],
};

const DEFAULT_SELECTED_COLUMNS: string[] = ["first_message", "last_message"];

const ThreadQueueItemsTab: React.FunctionComponent<
  ThreadQueueItemsTabProps
> = ({ annotationQueue }) => {
  // Query params
  const [search = "", setSearch] = useQueryParam("thread_search", StringParam, {
    updateType: "replaceIn",
  });

  const [page = 1, setPage] = useQueryParam("thread_page", NumberParam, {
    updateType: "replaceIn",
  });

  const [size, setSize] = useQueryParamAndLocalStorageState<
    number | null | undefined
  >({
    localStorageKey: "queue-thread-pagination-size",
    queryKey: "size",
    defaultValue: 100,
    queryParamConfig: NumberParam,
    syncQueryWithLocalStorageOnInit: true,
  });

  const [height, setHeight] = useQueryParamAndLocalStorageState<
    string | null | undefined
  >({
    localStorageKey: "queue-thread-row-height",
    queryKey: "thread_height",
    defaultValue: ROW_HEIGHT.small,
    queryParamConfig: StringParam,
    syncQueryWithLocalStorageOnInit: true,
  });

  const [filters = [], setFilters] = useQueryParam(
    "thread_filters",
    JsonParam,
    {
      updateType: "replaceIn",
    },
  );

  const [sortedColumns, setSortedColumns] = useQueryParamAndLocalStorageState<
    ColumnSort[]
  >({
    localStorageKey: "queue-thread-columns-sort",
    queryKey: "thread_sorting",
    defaultValue: [],
    queryParamConfig: JsonParam,
  });

  // Local storage states
  const [selectedColumns, setSelectedColumns] = useLocalStorageState<string[]>(
    "queue-thread-selected-columns",
    {
      defaultValue: DEFAULT_SELECTED_COLUMNS,
    },
  );

  const [columnsOrder, setColumnsOrder] = useLocalStorageState<string[]>(
    "queue-thread-columns-order",
    {
      defaultValue: [],
    },
  );

  const [columnsWidth, setColumnsWidth] = useLocalStorageState<
    Record<string, number>
  >("queue-thread-columns-width", {
    defaultValue: {},
  });

  // Component state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Data fetching
  const { data, isPending } = useThreadsList(
    {
      projectId: annotationQueue.project_id,
      sorting: sortedColumns,
      filters,
      page: page as number,
      size: size as number,
      search: search as string,
      truncate: true,
    },
    {
      placeholderData: keepPreviousData,
      refetchInterval: REFETCH_INTERVAL,
    },
  );

  const noData = !search && filters.length === 0;
  const noDataText = noData
    ? "There are no items in this queue yet"
    : "No search results";

  const rows = data?.content ?? [];

  const sortableBy = data?.sortable_by ?? [];

  const selectedRows = useMemo(() => {
    return rows.filter((row) => rowSelection[row.id]);
  }, [rowSelection, rows]);

  const handleRowClick = useCallback((row?: Thread) => {
    if (!row) return;
    // TODO: Implement row selection/details view if needed
    console.log("Row clicked:", row.id);
  }, []);

  const columns = useMemo(() => {
    return [
      generateSelectColumDef<Thread>(),
      mapColumnDataFields<Thread, Thread>({
        id: COLUMN_ID_ID,
        label: "ID",
        type: COLUMN_TYPE.string,
        cell: LinkCell as never,
        customMeta: {
          callback: handleRowClick,
          asId: true,
        },
        sortable: isColumnSortable(COLUMN_ID_ID, sortableBy),
      }),
      ...convertColumnDataToColumn<Thread, Thread>(THREAD_COLUMNS, {
        columnsOrder,
        selectedColumns,
        sortableColumns: sortableBy,
      }),
      generateActionsColumDef({
        cell: QueueItemRowActionsCell,
        customMeta: {
          annotationQueueId: annotationQueue.id,
        },
      }),
    ];
  }, [
    handleRowClick,
    sortableBy,
    columnsOrder,
    selectedColumns,
    annotationQueue.id,
  ]);

  const sortConfig = useMemo(
    () => ({
      enabled: true,
      sorting: sortedColumns,
      setSorting: setSortedColumns,
    }),
    [setSortedColumns, sortedColumns],
  );

  const resizeConfig = useMemo(
    () => ({
      enabled: true,
      columnSizing: columnsWidth,
      onColumnResize: setColumnsWidth,
    }),
    [columnsWidth, setColumnsWidth],
  );

  if (isPending) {
    return <Loader />;
  }

  if (noData && rows.length === 0 && page === 1) {
    return (
      <div className="flex h-full items-center justify-center">
        <DataTableNoData title={noDataText} />
      </div>
    );
  }

  return (
    <>
      <PageBodyStickyContainer
        className="-mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-4"
        direction="bidirectional"
        limitWidth
      >
        <div className="flex items-center gap-2">
          <SearchInput
            searchText={search as string}
            setSearchText={setSearch}
            placeholder="Search by ID"
            className="w-[320px]"
            dimension="sm"
          />
          <FiltersButton
            columns={THREAD_FILTER_COLUMNS}
            filters={filters}
            onChange={setFilters}
          />
        </div>
        <div className="flex items-center gap-2">
          <CopySMELinkButton annotationQueue={annotationQueue} />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <QueueItemActionsPanel
            items={selectedRows}
            annotationQueueId={annotationQueue.id}
          />
          <DataTableRowHeightSelector
            type={height as ROW_HEIGHT}
            setType={setHeight}
          />
          <ColumnsButton
            columns={THREAD_COLUMNS}
            selectedColumns={selectedColumns}
            onSelectionChange={setSelectedColumns}
            order={columnsOrder}
            onOrderChange={setColumnsOrder}
          />
          <EditAnnotationQueueButton annotationQueue={annotationQueue} />
        </div>
      </PageBodyStickyContainer>
      <DataTable
        columns={columns}
        data={rows}
        onRowClick={handleRowClick}
        sortConfig={sortConfig}
        resizeConfig={resizeConfig}
        selectionConfig={{
          rowSelection,
          setRowSelection,
        }}
        getRowId={getRowId}
        rowHeight={height as ROW_HEIGHT}
        columnPinning={DEFAULT_COLUMN_PINNING}
        noData={<DataTableNoData title={noDataText} />}
        TableWrapper={PageBodyStickyTableWrapper}
        stickyHeader
      />
      <PageBodyStickyContainer
        className="py-4"
        direction="horizontal"
        limitWidth
      >
        <DataTablePagination
          page={page as number}
          pageChange={setPage}
          size={size as number}
          sizeChange={setSize}
          total={data?.total ?? 0}
        />
      </PageBodyStickyContainer>
    </>
  );
};

export default ThreadQueueItemsTab;
