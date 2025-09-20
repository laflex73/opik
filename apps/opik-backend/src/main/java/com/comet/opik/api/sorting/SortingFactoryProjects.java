package com.comet.opik.api.sorting;

import java.util.List;

import static com.comet.opik.api.sorting.SortableFields.CREATED_AT;
import static com.comet.opik.api.sorting.SortableFields.DURATION_AGG;
import static com.comet.opik.api.sorting.SortableFields.ID;
import static com.comet.opik.api.sorting.SortableFields.LAST_UPDATED_AT;
import static com.comet.opik.api.sorting.SortableFields.LAST_UPDATED_TRACE_AT;
import static com.comet.opik.api.sorting.SortableFields.NAME;
import static com.comet.opik.api.sorting.SortableFields.TOTAL_ESTIMATED_COST_SUM;
import static java.util.Arrays.asList;

public class SortingFactoryProjects extends SortingFactory {
    @Override
    public List<String> getSortableFields() {
        return asList(
                ID,
                NAME,
                LAST_UPDATED_AT,
                CREATED_AT,
                LAST_UPDATED_TRACE_AT,
                DURATION_AGG,
                TOTAL_ESTIMATED_COST_SUM);
    }
}
