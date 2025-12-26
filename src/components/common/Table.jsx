import React, { useEffect, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function Table({
  columns,
  columnData,
  onSortingChange,
  sorting,
  setSorting,
  className,
  getDatas,
  setFilter,
  globalFilter,
  errorMessage,
  paramToRedirect,
  tdActionFn,
  enableRowSelection,
  rowSelection,
  setRowSelection,
  isPreview,
  tableName,
  noDataContent,
  tableHeight,
  loading,
  onScrollEnd,
  bgColor,
}) {
  const sortingAllowed = tableName !== "Order_list";
  const table = useReactTable({
    data: columnData,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setFilter,
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortingAllowed ? getSortedRowModel() : undefined,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableRowSelection ? enableRowSelection : false,
  });

  const setData = (e) => {
    getDatas(e);
  };

  /** USED TO TRIGGER SORTING OF TABLES */
  const toggleSorting = (columnId) => {
    const updatedSorting = sorting.map((sort) => {
      if (sort.id === columnId) {
        return {
          ...sort,
          desc: !sort.desc, // toggle the sort order
        };
      } else {
        return {
          ...sort,
          desc: false, // reset other columns to ascending
        };
      }
    });
    onSortingChange(columnId, updatedSorting);
  };

  /** HANDLE CLICK EVENT  */
  const handleClickEvent = (id, value) => {
    if (
      id
        .toString()
        .replace(/[0-9]_/, "")
        .replace(/[0-9]/, "") !== "edit"
    ) {
      setData(value);
    }
  };

  /** VIRTUAL TABLE */
  const { rows } = table.getRowModel();
  const parentRef = useRef();
  const hasCalledOnScrollEnd = useRef(false);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: React.useCallback(() => 50, []),
    overscan: 50,
  });

  useEffect(() => {
    const el = parentRef.current;
    if (!el || !onScrollEnd || rows.length === 0) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const reachedBottom = scrollTop + clientHeight >= scrollHeight - 10;

      if (reachedBottom && !hasCalledOnScrollEnd.current) {
        hasCalledOnScrollEnd.current = true;
        onScrollEnd();
      }

      if (!reachedBottom && hasCalledOnScrollEnd.current) {
        hasCalledOnScrollEnd.current = false;
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [rows.length, onScrollEnd]);

  return (
    <div className={className ? className : "main-table "}>
      <div
        className={`table-container position-relative  rounded`}
        ref={parentRef}
        style={{
          maxHeight: tableHeight ? tableHeight : "",
          pointerEvents: loading ? "none" : "auto",
          background: bgColor || "transparent",
        }}
        id={className.replaceAll(" ", "_").toLowerCase()}
      >
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup, i) => (
              <tr key={headerGroup.id + i}>
                {headerGroup?.headers.map((header, ind) => (
                  <th
                    key={header?.id + ind}
                    colSpan={header?.colSpan}
                    className={`${header?.id.toString().replace(/[0-9]_/, "")}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === " ") &&
                        header?.column?.getCanSort() &&
                        header.column?.columnDef.canSort
                      ) {
                        e.preventDefault();
                        toggleSorting(header?.id);
                      }
                    }}
                    style={{ minWidth: columnData?.length > 0 ? "" : "0px" }}
                  >
                    {header?.isPlaceholder ? null : (
                      <div
                        className={
                          header?.column.getCanSort()
                            ? "cursor-pointer select-none position-relative"
                            : ""
                        }
                        onClick={() => {
                          if (
                            header.column.getCanSort() &&
                            header.column?.columnDef.canSort
                          ) {
                            toggleSorting(header.id);
                          }
                        }}
                      >
                        <span className="position-relative">
                          {flexRender(
                            header?.column?.columnDef.header,
                            header?.getContext()
                          )}
                        </span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel()?.rows?.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="error-msg text-center"
                >
                  {errorMessage || noDataContent || "No Data Found"}
                </td>
              </tr>
            )}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isSelected = rowSelection?.includes(
                row?.original?.instrument_id
              );
              return (
                <tr
                  data-index={virtualRow.index}
                  ref={(node) => virtualizer.measureElement(node)}
                  key={row.id}
                  tabIndex={0}
                  onClick={() =>
                    !isPreview && enableRowSelection
                      ? setRowSelection(row)
                      : null
                  }
                  className={
                    isSelected || !enableRowSelection ? "selected-row" : ""
                  }
                >
                  {tdActionFn === false &&
                    row.getVisibleCells().map((cell, ind) => (
                      <td
                        key={cell.id}
                        id={cell.row.original[paramToRedirect]}
                        className={`${cell.id
                          .toString()
                          .replace(/[0-9]_/, "")
                          .replace(/[0-9]/, "")}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}

                  {(tdActionFn === true || tdActionFn === undefined) &&
                    row.getVisibleCells().map((cell, ind) => (
                      <td
                        key={cell.id}
                        onClick={() => {
                          if (row.original.is_active) {
                            handleClickEvent(
                              cell.id,
                              cell.row.original[paramToRedirect]
                            );
                          }
                        }}
                        id={cell.row.original[paramToRedirect]}
                        className={`${cell.id
                          .toString()
                          .replace(/[0-9]_/, "")
                          .replace(/[0-9]/, "")}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
