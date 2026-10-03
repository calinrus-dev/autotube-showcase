import type { ReactNode } from "react";
function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : part.startsWith("*") && part.endsWith("*") ? (
        <em key={i}>{part.slice(1, -1)}</em>
      ) : (
        part
      ),
    );
}
export default function ScriptDocument({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          const rows = block.split("\n");
          if (/^#{1,3}\s/.test(block))
            return <h3 key={i}>{inline(block.replace(/^#{1,3}\s+/, ""))}</h3>;
          if (rows.every((row) => /^\s*\d+\.\s/.test(row)))
            return (
              <ol key={i}>
                {rows.map((row, j) => (
                  <li key={j}>{inline(row.replace(/^\s*\d+\.\s+/, ""))}</li>
                ))}
              </ol>
            );
          if (rows.every((row) => /^\s*[-*]\s/.test(row)))
            return (
              <ul key={i}>
                {rows.map((row, j) => (
                  <li key={j}>{inline(row.replace(/^\s*[-*]\s+/, ""))}</li>
                ))}
              </ul>
            );
          return <p key={i}>{inline(block)}</p>;
        })}
    </>
  );
}
