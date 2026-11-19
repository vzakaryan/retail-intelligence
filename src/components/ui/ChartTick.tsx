/**
 * X-axis tick that breaks a label onto two lines at the first space
 * ("This week" → "This / week", «Այս շաբաթ» → «Այս / շաբաթ»), so long labels
 * don't run into their neighbours.
 */
export function TwoLineTick(props: { x?: number | string; y?: number | string; payload?: { value?: string }; highlight?: string }) {
  const { x = 0, y = 0, payload, highlight } = props;
  const value = String(payload?.value ?? "");
  const i = value.indexOf(" ");
  const lines = i > 0 ? [value.slice(0, i), value.slice(i + 1)] : [value];
  const on = highlight !== undefined && value === highlight;
  return (
    <text x={Number(x)} y={Number(y) + 4} textAnchor="middle" fontSize={11} fill={on ? "#5b3fe0" : "#7a7f93"} fontWeight={on ? 600 : 400}>
      {lines.map((l, n) => (
        <tspan key={n} x={Number(x)} dy={n === 0 ? 8 : 13}>
          {l}
        </tspan>
      ))}
    </text>
  );
}
