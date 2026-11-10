import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftRight, ArrowRight, BadgePercent, CircleCheck, ClipboardList, Info, ListPlus, MoveUp, Phone, Tag, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { useTaskActions } from "@/app/useTaskActions";
import type { TaskState } from "@/app/useTasks";
import { getOrders } from "@/data/orders";
import type { NewTask, StockStep } from "@/data/stockouts";
import type { Tone } from "@/data/types";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { fmtDate } from "@/lib/format";
import { useTaskText } from "@/pages/today/taskText";
import { getProduct } from "@/data/products";
import { useLocalized } from "@/lib/useLocalized";
import { stepRef } from "./shared";
import { useDayLabel } from "@/pages/orders/shared";
import { supplierName } from "@/lib/names";

const asTaskState = (t: NewTask): TaskState => ({ ...t, id: "", action: "markDone", done: false });
const shortDay = (d: Date) => fmtDate(d, { weekday: "short", month: "short", day: "numeric" });

function iconFor(step: StockStep): [LucideIcon, Tone] {
  if (step.kind === "existing") return step.taskKind === "promoTags" ? [Tag, "good"] : [CircleCheck, "good"];
  if (step.kind === "call") return [Phone, "bad"];
  if (step.kind === "order") return [Truck, "primary"];
  if (step.kind === "orderLess" || step.kind === "orderExtra") return [ClipboardList, "primary"];
  if (step.kind === "note") return [Info, "good"];
  const k = step.task.kind;
  if (k === "promotion" || k === "markdown") return [BadgePercent, "warn"];
  if (k === "frontOfShelf" || k === "clearSpace") return [MoveUp, "info"];
  if (k === "moveToShelf" || k === "setAside") return [ClipboardList, "info"];
  return [ArrowLeftRight, "info"];
}

/** Steps that can still be added to today's tasks (calls are logged, not added). */
export function useAddableSteps(storeId: string, steps: StockStep[]) {
  const actions = useTaskActions(storeId);
  return steps.map(stepRef).filter((r): r is NonNullable<typeof r> => !!r && r.task.kind !== "callSupplier" && !actions.find(r));
}

/** "What you can do" list shared by the product panels. */
export function StepList({ steps }: { steps: StockStep[] }) {
  const { t } = useTranslation();
  return (
    <section>
      <h3 className="mb-0.5 font-semibold">{t("stockouts.drawer.whatToDo")}</h3>
      <ul>
        {steps.map((s, i) => (
          <StepRow key={i} step={s} />
        ))}
      </ul>
    </section>
  );
}

/** Footer: add every remaining step to today's tasks + close. */
export function StepsFooter({ steps, onClose }: { steps: StockStep[]; onClose: () => void }) {
  const { t } = useTranslation();
  const { store } = useDemo();
  const actions = useTaskActions(store.id);
  const addable = useAddableSteps(store.id, steps);
  return (
    <div className="grid grid-cols-[2fr_1fr] gap-2.5">
      <Button variant="primary" className="justify-center py-[11px] text-sm" disabled={!addable.length} onClick={() => addable.forEach((r) => actions.add(r))}>
        <ListPlus />
        {addable.length ? t("stockouts.drawer.addAll", { count: addable.length }) : t("stockouts.drawer.allAdded")}
      </Button>
      <Button className="justify-center py-[11px] text-sm" onClick={onClose}>
        {t("common.close")}
      </Button>
    </div>
  );
}

function StepRow({ step }: { step: StockStep }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store } = useDemo();
  const actions = useTaskActions(store.id);
  const taskText = useTaskText();
  const dayLabel = useDayLabel();
  const loc = useLocalized();
  const ref = stepRef(step);
  const task = ref ? actions.find(ref) : undefined;
  const [Icon, tone] = iconFor(step);

  if (step.kind === "note") {
    return <Li icon={Icon} tone={tone} title={t(`stockouts.note.${step.key}.title`)} meta={t(`stockouts.note.${step.key}.text`, step.params as Record<string, string>)} />;
  }

  if (step.kind === "orderExtra") {
    const order = getOrders(store.id).find((o) => o.supplierId === step.supplierId && o.status === "toPlace");
    return (
      <Li
        icon={Icon}
        tone={tone}
        title={t("stockouts.drawer.orderExtra", { qty: step.qty, product: loc(getProduct(step.productId).name), supplier: supplierName(step.supplierId) })}
        meta={t("stockouts.drawer.orderExtraMeta")}
      >
        {order ? (
          <Button onClick={() => navigate(`/orders/${order.id}`)}>
            {t("stockouts.drawer.viewOrder")}
            <ArrowRight />
          </Button>
        ) : (
          <Pill tone="good">{t("online.often.inOrderSuggestions")}</Pill>
        )}
      </Li>
    );
  }

  if (step.kind === "order" || step.kind === "orderLess") {
    const order = getOrders(store.id).find((o) => o.supplierId === step.supplierId && o.status === "toPlace");
    const title =
      step.kind === "order"
        ? t("stockouts.drawer.coveredBy", { supplier: supplierName(step.supplierId) })
        : t("stockouts.drawer.orderLess", { qty: step.qty, supplier: supplierName(step.supplierId) });
    const meta =
      step.kind === "order"
        ? order
          ? t("stockouts.drawer.coveredMeta", { delivery: shortDay(order.delivery) })
          : ""
        : [step.usual !== undefined ? t("stockouts.drawer.usually", { qty: step.usual }) : "", step.next ? t("stockouts.drawer.nextOrder", { date: shortDay(step.next) }) : order ? t("stockouts.drawer.orderBy", { when: dayLabel(order.deadline, undefined, true) }) : ""]
            .filter(Boolean)
            .join(" · ");
    return (
      <Li icon={Icon} tone={tone} title={title} meta={meta}>
        {order ? (
          <Button onClick={() => navigate(`/orders/${order.id}`)}>
            {t("stockouts.drawer.viewOrder")}
            <ArrowRight />
          </Button>
        ) : (
          step.kind === "orderLess" && <Pill tone="good">{t("online.often.inOrderSuggestions")}</Pill>
        )}
      </Li>
    );
  }

  const shown = task ?? (ref ? asTaskState(ref.task) : undefined);
  const title = shown ? taskText(shown).title : "";
  const meta =
    step.kind === "call"
      ? t("stockouts.drawer.callMeta", { due: shortDay(step.params.due as Date), qty: step.params.qty })
      : task
        ? task.done
          ? t("stockouts.drawer.doneMeta")
          : t("stockouts.drawer.onList")
        : ref
          ? taskText(asTaskState(ref.task)).detail
          : "";

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
