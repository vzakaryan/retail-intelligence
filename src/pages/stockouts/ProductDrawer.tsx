import { useNavigate } from "react-router";
import { ArrowLeftRight, ArrowRight, CircleCheck, ClipboardList, ListPlus, Phone, TriangleAlert, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";
import { useDemo } from "@/app/DemoContext";
import { useTaskActions } from "@/app/useTaskActions";
import type { TaskState } from "@/app/useTasks";
import { getOnline } from "@/data/online";
import { getOrders } from "@/data/orders";
import { getProduct } from "@/data/products";
import type { NewTask, StockRow, StockStep } from "@/data/stockouts";
import type { Tone } from "@/data/types";
import { SUPPLIERS } from "@/data/world";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { TONE } from "@/components/ui/tone";
import { fmtDate, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useTaskText } from "@/pages/today/taskText";
import { stepRef, useRunsOutText } from "./shared";

const asTaskState = (t: NewTask): TaskState => ({ ...t, id: "", action: "markDone", done: false });
const supplierName = (id: string) => SUPPLIERS.find((s) => s.id === id)?.name ?? id;

/** Product panel — docs/design-references/approved/08-stockout-product-drawer.png */
export function ProductDrawer({ row, onClose }: { row?: StockRow; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const runsOut = useRunsOutText();
  const { store } = useDemo();
  const actions = useTaskActions(store.id);
  const addable = row ? row.steps.map(stepRef).filter((r): r is NonNullable<typeof r> => !!r && r.task.kind !== "callSupplier" && !actions.find(r)) : [];
  const product = row && getProduct(row.productId);

  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      closeLabel={t("common.close")}
      header={
        row &&
        product && (
          <div className="flex items-center gap-3.5">
            <ProductThumb emoji={product.emoji} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">{loc(product.name)}</div>
              <div className="text-xs text-muted">
                {product.sku} · {supplierName(product.supplierId)}
              </div>
            </div>
            <Pill tone={row.tone}>{runsOut(row)}</Pill>
          </div>
        )
      }
      footer={
        row && (
          <div className="grid grid-cols-[2fr_1fr] gap-2.5">
            <Button variant="primary" className="justify-center py-[11px] text-sm" disabled={!addable.length} onClick={() => addable.forEach((r) => actions.add(r))}>
              <ListPlus />
              {addable.length ? t("stockouts.drawer.addAll", { count: addable.length }) : t("stockouts.drawer.allAdded")}
            </Button>
            <Button className="justify-center py-[11px] text-sm" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        )
      }
    >
      {row && <Body row={row} />}
    </Drawer>
  );
}

function Body({ row }: { row: StockRow }) {
  const { t } = useTranslation();
  const runsOut = useRunsOutText();
  const { store } = useDemo();
  const perDay = Math.round(row.expected3 / 3);
  const today = "time" in row.runsOut;
  const online = getOnline(store.id).days.today.prep.find((p) => p.productId === row.productId);
  const dl = row.delivery;
  const when = (days: number) => (days === 0 ? t("orders.day.today").toLowerCase() : days === 1 ? t("orders.day.tomorrow").toLowerCase() : fmtDate(new Date(2026, 10, 10 + days), { weekday: "long" }));

  const sentences = [
    t("stockouts.drawer.sells", { count: perDay }),
    online ? t("stockouts.drawer.online", { count: online.inOrders }) : "",
    row.backroom ? t("stockouts.drawer.stock", { shelf: row.onShelf, backroom: row.backroom }) : t("stockouts.drawer.stockNoBackroom", { shelf: row.onShelf }),
    dl ? (dl.uncertain && dl.due ? t("stockouts.drawer.late", { supplier: supplierName(dl.supplierId), due: fmtDate(dl.due, { weekday: "long" }) }) : t("stockouts.drawer.next", { supplier: supplierName(dl.supplierId), when: when(dl.inDays) })) : "",
  ].filter(Boolean);

  // Stock projection: now, tonight, then the next 4 mornings
  const start = row.onShelf + row.backroom;
  const labels = [t("stockouts.drawer.now"), t("stockouts.drawer.tonight"), ...[1, 2, 3, 4].map((i) => fmtDate(new Date(2026, 10, 10 + i), { weekday: "short" }))];
  const project = (withDelivery: boolean) => {
    const pts: number[] = [start];
    let s = Math.max(0, start - row.expectedToday);
    if (withDelivery && dl && dl.inDays === 0) s += dl.qty;
    pts.push(s);
    for (let i = 1; i <= 4; i++) {
      s = Math.max(0, s - perDay) + (withDelivery && dl && dl.inDays === i ? dl.qty : 0);
      pts.push(s);
    }
    return pts;
  };
  const withD = project(true);
  const without = project(false);
  const twoLines = !!dl?.uncertain;
  const data = labels.map((label, i) => ({ label, a: withD[i], b: without[i] }));

  return (
    <div className="flex flex-col gap-5">
      <div className={`flex gap-3 rounded-xl px-4 py-3.5 ${TONE[row.tone === "bad" ? "bad" : "warn"]}`}>
        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-[15px] font-bold text-ink">
            {today ? t("stockouts.drawer.titleToday", { time: (row.runsOut as { time: string }).time }) : t("stockouts.drawer.titleLater", { when: runsOut(row) })}
          </div>
          <p className="mt-1 text-[13.5px] text-ink-2">{sentences.join(" ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          [t("stockouts.drawer.onShelf"), row.onShelf],
          [t("stockouts.drawer.backroom"), row.backroom],
          [t("stockouts.drawer.expectedToday"), row.expectedToday],
        ].map(([label, v]) => (
          <div key={label} className="rounded-xl border border-line px-3.5 py-3">
            <div className="text-[12.5px] text-muted">{label}</div>
            <div className="mt-0.5 text-xl font-bold">{fmtNumber(Number(v))}</div>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-1 font-semibold">{t("stockouts.drawer.chartTitle")}</h3>
        <div className="mb-1.5 flex flex-wrap gap-4 text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5">
            <i className="h-[3px] w-4 rounded bg-primary" />
            {twoLines && dl ? t("stockouts.drawer.ifDelivers", { supplier: supplierName(dl.supplierId) }) : t("stockouts.drawer.expectedStock")}
          </span>
          {twoLines && (
            <span className="flex items-center gap-1.5">
              <i className="h-[3px] w-4 rounded bg-bad" />
              {t("stockouts.drawer.ifLate")}
            </span>
          )}
        </div>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f0f0f5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} allowDecimals={false} />
              <Area type="monotone" dataKey="a" stroke="#5b3fe0" strokeWidth={2.5} fill="rgba(91,63,224,.08)" isAnimationActive={false} dot={false} />
              {twoLines && <Line type="monotone" dataKey="b" stroke="#d63b3b" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="mb-0.5 font-semibold">{t("stockouts.drawer.whatToDo")}</h3>
        <ul>
          {row.steps.map((s, i) => (
            <StepRow key={i} step={s} />
          ))}
        </ul>
      </section>
    </div>
  );
}

const STEP_ICON: Record<StockStep["kind"], [LucideIcon, Tone]> = {
  existing: [CircleCheck, "good"],
  add: [ArrowLeftRight, "info"],
  call: [Phone, "bad"],
  order: [Truck, "primary"],
};

function StepRow({ step }: { step: StockStep }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store } = useDemo();
  const actions = useTaskActions(store.id);
  const taskText = useTaskText();
  const ref = stepRef(step);
  const task = ref ? actions.find(ref) : undefined;

  let [Icon, tone] = STEP_ICON[step.kind];
  if (step.kind === "add" && (step.task.kind === "moveToShelf" || step.task.kind === "setAside")) [Icon, tone] = [ClipboardList, "info"];

  let title: string;
  let meta: string;
  if (step.kind === "order") {
    const order = getOrders(store.id).find((o) => o.supplierId === step.supplierId && o.status === "toPlace");
    title = t("stockouts.drawer.coveredBy", { supplier: supplierName(step.supplierId) });
    meta = order ? t("stockouts.drawer.coveredMeta", { delivery: fmtDate(order.delivery, { weekday: "short", month: "short", day: "numeric" }) }) : "";
    return (
      <Li icon={Icon} tone={tone} title={title} meta={meta}>
        {order && (
          <Button onClick={() => navigate(`/orders/${order.id}`)}>
            {t("stockouts.drawer.viewOrder")}
            <ArrowRight />
          </Button>
        )}
      </Li>
    );
  }

  const shown = task ?? (ref ? asTaskState(ref.task) : undefined);
  title = shown ? taskText(shown).title : "";
  if (step.kind === "call") meta = t("stockouts.drawer.callMeta", { due: fmtDate(step.params.due as Date, { weekday: "short", month: "short", day: "numeric" }), qty: step.params.qty });
  else meta = task ? (task.done ? t("stockouts.drawer.doneMeta") : t("stockouts.drawer.onList")) : ref ? taskText(asTaskState(ref.task)).detail : "";

  return (
    <Li icon={Icon} tone={tone} title={title} meta={meta}>
      {task?.done ? (
        <Pill tone="good">{step.kind === "call" ? t("orders.list.callLogged") : t("stockouts.drawer.done")}</Pill>
      ) : step.kind === "call" ? (
        <Button onClick={() => ref && actions.complete(ref, true, "call")}>
          <Phone />
          {t("today.tasks.logCall")}
        </Button>
      ) : task ? (
        <Pill tone="good">{t("stockouts.drawer.taskAdded")}</Pill>
      ) : (
        <Button onClick={() => ref && actions.add(ref)}>{t("stockouts.drawer.addTask")}</Button>
      )}
    </Li>
  );
}

function Li({ icon, tone, title, meta, children }: { icon: LucideIcon; tone: Tone; title: string; meta: string; children?: ReactNode }) {
  return (
    <li className="flex items-start gap-3 border-b border-line py-3 last:border-0">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        {meta && <div className="text-xs text-muted">{meta}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}
