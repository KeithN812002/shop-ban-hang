import type { RowSelectionState } from '@tanstack/react-table'

/**
 * Rebuilds the selected rows after a DataTable selection change, keeping rows picked on other pages.
 * An empty selection (the "clear selection" action) clears every page.
 */
export const mergeSelectedRows = <TRow extends { id: string | number }>(
    selectedRows: TRow[],
    pageRows: TRow[],
    nextSelection: RowSelectionState,
): TRow[] => {
    const pageIds = new Set(pageRows.map(row => String(row.id)))
    const keptFromOtherPages = selectedRows.filter(row => !pageIds.has(String(row.id)) && nextSelection[String(row.id)])
    const selectedOnPage = pageRows.filter(row => nextSelection[String(row.id)])
    return [...keptFromOtherPages, ...selectedOnPage]
}
