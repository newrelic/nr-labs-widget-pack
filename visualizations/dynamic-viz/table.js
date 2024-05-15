import React, { useState, useContext, useEffect } from "react";
import {
  Spinner,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  MetricTableRowCell,
} from "nr1";
import { assessValue, isEmpty } from "./utils";
import { useInterval, useSetState } from "@mantine/hooks";

export default function DynamicTable(props) {
  const {
    chartData,
    cellConfigs = [],
    headerConfigs = [],
    columnSort,
    height,
    width,
    defaultSortNo,
    defaultSortDir,
    showKey,
  } = props;
  const [column, setColumn] = useState(parseInt(defaultSortNo || 0));
  const [cellConfigsOriginal, setCellConfigsOriginal] = useState(cellConfigs);
  const [sortedCellConfigs, setCellConfigs] = useState([]);
  const [sortingType, setSortingType] = useState(
    TableHeaderCell.SORTING_TYPE[
      defaultSortNo ? defaultSortDir || "NONE" : "NONE"
    ]
  );

  const onClickTableHeaderCell = (nextColumn, { nextSortingType }) => {
    if (nextColumn === column) {
      setSortingType(nextSortingType);
    } else {
      setSortingType(nextSortingType);
      setColumn(nextColumn);
    }
  };

  useEffect(() => {
    setCellConfigsOriginal(cellConfigs);
    const configs = (cellConfigs || []).sort((a, b) => {
      const aNo = !isEmpty(a.priority) ? a.priority : 99999;
      const bNo = !isEmpty(b.priority) ? b.priority : 99999;
      return parseInt(aNo) - parseInt(bNo);
    });
    setCellConfigs(configs);
  }, [cellConfigsOriginal]);

  const items = JSON.parse(JSON.stringify(chartData));
  const headers = Object.keys(items?.[0] || {});

  sortedCellConfigs.forEach((config) => {
    const { targetAttribute, highlightRow } = config;

    items.forEach((item) => {
      const assessment = assessValue(item[targetAttribute], config);

      if (assessment?.check) {
        if (!item.cellStyles) {
          item.cellStyles = { [targetAttribute]: assessment };
        } else {
          item.cellStyles[targetAttribute] = assessment;
        }

        if (highlightRow) {
          item.rowStyle = assessment;
        }
      }
    });
  });

  return (
    <>
      <Table
        items={items}
        style={{
          height: showKey ? height - 40 : height,
          width: width + 52,
        }}
      >
        <TableHeader>
          {(headers || [])
            .filter(
              (h) =>
                !headerConfigs.find((c) => c.targetAttribute === h)
                  ?.hideHeader === true
            )
            .map((h, i) => {
              const headerConfig = headerConfigs.find(
                (c) => c.targetAttribute === h
              );

              let headerWidth = headerConfig?.headerWidth || 0;
              if (headerWidth) {
                const parsedHw = parseFloat(headerWidth);
                if (!isNaN(parsedHw)) {
                  headerWidth = `${parsedHw}px`;
                } else {
                  headerWidth = 0;
                }
              }

              return (
                <TableHeaderCell
                  key={h}
                  value={({ item }) => item[h]}
                  alignmentType={
                    TableHeaderCell.ALIGNMENT_TYPE[
                      headerConfig?.alignmentType || "LEFT"
                    ]
                  }
                  width={headerWidth || "1fr"}
                  sortable
                  sortingType={
                    column === i
                      ? sortingType
                      : TableHeaderCell.SORTING_TYPE.NONE
                  }
                  onClick={(event, data) => onClickTableHeaderCell(i, data)}
                >
                  {headerConfig?.renameHeader || h}
                </TableHeaderCell>
              );
            })}
        </TableHeader>
        {({ item }) => {
          const { rowStyle, cellStyles } = item || {};

          return (
            <TableRow>
              {(headers || [])
                .filter(
                  (h) =>
                    !headerConfigs.find((c) => c.targetAttribute === h)
                      ?.hideHeader === true
                )
                .map((h) => {
                  const value =
                    item[h] !== undefined && item[h] !== null
                      ? item[h]
                      : (item?.groups || []).find((g) => g.name === h)?.value;

                  const headerConfig = headerConfigs.find(
                    (c) => c.targetAttribute === h
                  );

                  const cellConfig = cellConfigs.find(
                    (c) => c.targetAttribute === h
                  );

                  const style = {};
                  if (rowStyle) {
                    style.color = rowStyle?.fontColor;
                    style.backgroundColor = rowStyle?.bgColor;
                  }

                  if (Object.keys(cellStyles?.[h] || {}).length > 0) {
                    style.color = cellStyles[h]?.fontColor;
                    style.backgroundColor = cellStyles[h]?.bgColor;
                  }

                  if (headerConfig?.valueType) {
                    if (headerConfig?.valueType === "TIMESTAMP") {
                      return (
                        <TableRowCell
                          key={`${h}_${value}`}
                          alignmentType={
                            TableRowCell.ALIGNMENT_TYPE[
                              cellConfig?.alignmentType || "LEFT"
                            ]
                          }
                          style={style}
                        >
                          {new Date(value).toLocaleString()}
                        </TableRowCell>
                      );
                    } else {
                      return (
                        <MetricTableRowCell
                          key={`${h}_${value}`}
                          type={
                            MetricTableRowCell.TYPE[
                              headerConfig?.valueType || "UNKNOWN"
                            ]
                          }
                          value={value}
                          style={style}
                        />
                      );
                    }
                  }

                  return (
                    <TableRowCell
                      key={`${h}_${value}`}
                      alignmentType={
                        TableRowCell.ALIGNMENT_TYPE[
                          cellConfig?.alignmentType || "LEFT"
                        ]
                      }
                      style={style}
                    >
                      {value}
                    </TableRowCell>
                  );
                })}
            </TableRow>
          );
        }}
      </Table>
      {showKey && (
        <div
          style={{
            position: "sticky",
            bottom: "0px",
            textAlign: "center",
            padding: "10px",
            backgroundColor: "white",
          }}
        >
          {(cellConfigs || []).map((t) => {
            const value = {};
            const { bgColor, fontColor } = t;

            const headerConfig = headerConfigs.find(
              (c) => c.targetAttribute === t.targetAttribute
            );

            if (bgColor === "healthy" || bgColor === "green") {
              value.bgColor = "#3a845e";
              value.fontColor = "white";
            }

            if (fontColor === "healthy" || fontColor === "green") {
              value.fontColor = "#3a845e";
            }

            if (bgColor === "critical" || bgColor === "red") {
              value.bgColor = "#a1251a";
              value.fontColor = "white";
            }

            if (fontColor === "critical" || fontColor === "red") {
              value.fontColor = "#a1251a";
            }

            if (bgColor === "warning" || bgColor === "orange") {
              value.bgColor = "#f8d45c";
              value.fontColor = "black";
            }

            if (fontColor === "warning" || fontColor === "orange") {
              value.fontColor = "#f8d45c";
            }

            if (bgColor === "unknown" || bgColor === "grey") {
              value.bgColor = "#9fa5a5";
            }

            if (fontColor === "unknown" || fontColor === "grey") {
              value.fontColor = "#9fa5a5";
            }

            return (
              <>
                <div style={{ display: "inline" }}>
                  <span style={{ color: value.bgColor }}>&#9632;</span>
                  &nbsp;
                  {t?.keyLabel ||
                    headerConfig?.renameHeader ||
                    t.targetAttribute}
                </div>
                &nbsp;&nbsp;&nbsp;
              </>
            );
          })}
        </div>
      )}
    </>
  );
}
