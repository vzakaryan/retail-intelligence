import { useState } from "react";
import { Check, Copy, Phone, Send, ShieldCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useDemo } from "@/app/DemoContext";
import { useTaskActions, type TaskRef } from "@/app/useTaskActions";
import { onTimePct, statusOf, type SupplierStats } from "@/data/suppliers";
import type { Tone } from "@/data/types";
import { SUPPLIERS } from "@/data/world";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { TONE } from "@/components/ui/tone";
import { fmtAmd, fmtDate, fmtNumber } from "@/lib/format";
import { useStoreLabel } from "@/lib/useStoreLabel";
import { useTaskText } from "@/pages/today/taskText";
import { STATUS_TONE, useDelayText } from "./shared";

/** Supplier panel — docs/design-references/approved/16-supplier-drawer.png */
export function SupplierDrawer({ stats, onClose }: { stats?: SupplierStats; onClose: () => void }) {
  const { t } = useTranslation();
  const sup = stats && SUPPLIERS.find((s) => s.id === stats.supplierId);
  return (
    <Drawer
      open={!!stats}
      onClose={onClose}
      closeLabel={t("common.close")}
      header={
        stats &&
        sup && (
          <div className="flex items-center gap-3.5">
            <div className={`grid size-12 shrink-0 place-items-center rounded-ctl text-[13px] font-bold ${TONE[sup.tone]}`}>{sup.initials}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">{sup.name}</div>
              <div className="text-xs text-muted">{t("suppliers.drawer.meta", { categories: sup.categories.en, days: t(`suppliers.days.${stats.deliveryDays.key}`), rep: stats.rep })}</div>
            </div>
            <Pill tone={STATUS_TONE[statusOf(stats)]}>{t(`suppliers.status.${statusOf(stats)}`)}</Pill>
          </div>
        )
      }
      footer={
        <Button className="w-full justify-center py-[11px] text-sm" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      {stats && <Body stats={stats} />}
    </Drawer>
  );
}

function Body({ stats }: { stats: SupplierStats }) {
  const { t } = useTranslation();
  const delay = useDelayText();
  const status = statusOf(stats);
  const sup = SUPPLIERS.find((s) => s.id === stats.supplierId)!;
  const data = stats.last8.map((x) => ({ label: fmtDate(x.date, { month: "short", day: "numeric" }), v: x.daysLate || 0.06, late: x.daysLate > 0 }));
  const lateUnits = stats.last8.some((x) => x.daysLate >= 0.5);

  return (
    <div className="flex flex-col gap-5">
      <div className={`flex gap-3 rounded-xl px-4 py-3.5 ${TONE[STATUS_TONE[status]]}`}>
        <Truck className="mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-[15px] font-bold text-ink">
            {stats.late ? t("suppliers.drawer.title", { late: stats.late, total: stats.deliveries }) : t("suppliers.drawer.titleGood", { total: stats.deliveries })}
          </div>
          <p className="mt-1 text-[13.5px] text-ink-2">
            {stats.late ? t("suppliers.drawer.lateText", { delay: delay(stats), missing: 100 - stats.inFull }) : t("suppliers.drawer.goodText", { inFull: stats.inFull })}{" "}
            {stats.stockouts > 0 && t("suppliers.drawer.cost", { count: stats.stockouts, value: fmtAmd(stats.lostSales, { thousands: true }) })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          [t("suppliers.table.onTime"), `${onTimePct(stats)}%`, status === "unreliable" ? "text-bad" : ""],
          [t("suppliers.table.inFull"), `${stats.inFull}%`, ""],
          [t("suppliers.table.delay"), delay(stats), ""],
        ].map(([label, v, cls]) => (
          <div key={label} className="rounded-xl border border-line px-3.5 py-3">
            <div className="text-[12.5px] text-muted">{label}</div>
            <div className={`mt-0.5 text-xl font-bold ${cls}`}>{v}</div>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-1 font-semibold">{t("suppliers.drawer.last8")}</h3>
        <div className="mb-1.5 flex gap-4 text-[12.5px] text-ink-2">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary-200" />{t("suppliers.drawer.onTime")}</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-bad" />{t("suppliers.drawer.late")}</span>
        </div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f0f0f5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#7a7f93" }}
                domain={[0, lateUnits ? 2.5 : 0.5]}
                ticks={lateUnits ? [0, 1, 2] : [0, 0.25, 0.5]}
                tickFormatter={(v: number) => (v === 0 ? "0" : lateUnits ? t("suppliers.drawer.daysShort", { v }) : t("suppliers.drawer.hoursShort", { v: v * 24 }))}
              />
              <Bar dataKey="v" radius={[5, 5, 0, 0]} isAnimationActive={false} maxBarSize={30}>
                {data.map((x, i) => (
                  <Cell key={i} fill={x.late ? "#d63b3b" : "#cfc4fb"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <Steps stats={stats} supplierName={sup.name} />
    </div>
  );
}

function Steps({ stats, supplierName }: { stats: SupplierStats; supplierName: string }) {
  const { t } = useTranslation();
  const { store, extraSafety, toggleExtraSafety } = useDemo();
  const label = useStoreLabel();
  const actions = useTaskActions(store.id);
  const taskText = useTaskText();
  const delay = useDelayText();
  const [copied, setCopied] = useState(false);
  const status = statusOf(stats);

  const a = stats.action;
  const ref: TaskRef | undefined = a
    ? a.kind === "call"
      ? { task: { kind: "callSupplier", supplierId: stats.supplierId, params: { due: a.due, days: 2 }, tag: "supplier" }, linked: { kind: "callSupplier", supplierId: stats.supplierId } }
      : { task: a.task }
    : undefined;
  const task = ref ? actions.find(ref) : undefined;
  const safetyOn = !!extraSafety[stats.supplierId];

  const copy = async () => {
    const text = t("suppliers.summary.text", {
      supplier: supplierName,
      store: label.full(store),
      late: stats.late,
      total: stats.deliveries,
      onTime: Math.round(((stats.deliveries - stats.late) / stats.deliveries) * 100),
      inFull: stats.inFull,
      delay: delay(stats),
      lost: fmtAmd(stats.lostSales, { thousands: true }),
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section>
      <h3 className="mb-0.5 font-semibold">{t("stockouts.drawer.whatToDo")}</h3>
      <ul>
        {ref && (
          <Li
            icon={a?.kind === "call" ? Phone : Send}
            tone={a?.kind === "call" ? "bad" : "info"}
            title={taskText(task ?? { ...ref.task, id: "", action: "markDone", done: false }).title}
            meta={
              a?.kind === "call"
                ? t("stockouts.drawer.callMeta", { due: fmtDate(a.due, { weekday: "short", month: "short", day: "numeric" }), qty: fmtNumber(a.qty) })
                : task
                  ? task.done
                    ? t("stockouts.drawer.doneMeta")
                    : t("stockouts.drawer.onList")
                  : t("suppliers.drawer.askMeta")
            }
          >
            {task?.done ? (
              <Pill tone="good">{a?.kind === "call" ? t("orders.list.callLogged") : t("stockouts.drawer.done")}</Pill>
            ) : a?.kind === "call" ? (
              <Button onClick={() => actions.complete(ref, true, "call")}>
                <Phone />
                {t("today.tasks.logCall")}
              </Button>
            ) : task ? (
              <Pill tone="good">{t("stockouts.drawer.taskAdded")}</Pill>
            ) : (
              <Button onClick={() => actions.add(ref)}>{t("stockouts.drawer.addTask")}</Button>
            )}
          </Li>
        )}
        {status !== "reliable" && (
          <Li icon={ShieldCheck} tone="primary" title={t("suppliers.drawer.safety", { supplier: supplierName })} meta={safetyOn ? t("suppliers.drawer.safetyOn") : t("suppliers.drawer.safetyMeta")}>
            {safetyOn ? (
              <Button onClick={() => toggleExtraSafety(stats.supplierId)}>
                <Check className="text-good" />
                {t("suppliers.drawer.applied")}
              </Button>
            ) : (
              <Button onClick={() => toggleExtraSafety(stats.supplierId)}>{t("suppliers.drawer.apply")}</Button>
            )}
          </Li>
        )}
        <Li icon={Send} tone="info" title={t("suppliers.drawer.share")} meta={t("suppliers.drawer.shareMeta", { supplier: supplierName })}>
          <Button onClick={copy}>
            {copied ? <Check className="text-good" /> : <Copy />}
            {copied ? t("orders.place.copied") : t("suppliers.drawer.copy")}
          </Button>
        </Li>
      </ul>
    </section>
  );
}

function Li({ icon, tone, title, meta, children }: { icon: LucideIcon; tone: Tone; title: string; meta: string; children?: ReactNode }) {
  return (
    <li className="flex items-start gap-3 border-b border-line py-3 last:border-0">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted">{meta}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}
