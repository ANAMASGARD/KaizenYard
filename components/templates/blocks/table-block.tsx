import type { TableSection } from "@/lib/templates/types";
import { BlockShell } from "@/components/templates/blocks/block-shell";
import { Table } from "@/components/retroui/Table";

export function TableBlock({ section }: { section: TableSection }) {
  return (
    <BlockShell title={section.title}>
      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              {section.columns.map((column) => (
                <Table.Head key={column}>{column}</Table.Head>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {section.rows.map((row, rowIndex) => (
              <Table.Row key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <Table.Cell key={`${rowIndex}-${cellIndex}`}>{cell}</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </BlockShell>
  );
}
