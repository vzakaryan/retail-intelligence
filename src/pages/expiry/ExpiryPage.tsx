import { useState } from "react";
import { BadgePercent, CalendarClock, ChevronDown, ChevronRight, ChevronUp, Percent, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import { atRiskValue, getExpiry, stockValue, type ExpiryGroup, type ExpiryRow } from "@/data/expiry";
import { getProduct } from "@/data/products";
import { getStoreDay } from "@/data/today";
import { BeforeAfterChart } from "@/components/ui/BeforeAfterChart";
import { Card } from "@/components/ui/Card";
import { HBar } from "@/components/ui/HBar";
import { KpiCard, deltaTone } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { Segmented } from "@/components/ui/Segmented";
import { fmtAmd, fmtDeltaPct, fmtDeltaPp, fmtNumber, fmtPercent } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { useParamText } from "@/pages/stockouts/shared";
import { useStepStatus } from "@/pages/overstock/useStepStatus";
import { ExpiryDrawer } from "./ExpiryDrawer";
import { useExpiresText } from "./shared";
import { supplierName } from "@/lib/names";

type Horizon = "3d" | "7d";
const th = "whitespace-nowrap border-b border-line bg-subtle px-4 py-2.5 text-left text-xs font-semibold text-muted first:pl-5 last:pr-5";
const td = "border-b border-line px-4 py-3 align-middle first:pl-5 last:pr-5";
const REASON_COLOR = { expired: "#e09b2d", damaged: "#7a7f93", spoiled: "#d63b3b", other: "#b3b6c4" } as const;

/** docs/design-references/approved/13-expiry-writeoffs.png */
export function ExpiryPage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { store } = useDemo();
  const data = getExpiry(store.id);
  const week = getStoreDay(store.id).kpis.week.writeOffs;
  const [horizon, setHorizon] = useState<Horizon>("3d");
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState<string>();

  const inHorizon = data.rows.filter((r) => horizon === "7d" || r.group !== "later");
  const visible: ExpiryGroup[] = ["today", "tomorrow", "in2"];
  const hidden = inHorizon.filter((r) => !visible.includes(r.group));
  const shown = expanded ? inHorizon : inHorizon.filter((r) => visible.includes(r.group));
  const groups = (["today", "tomorrow", "in2", "in3", "later"] as ExpiryGroup[]).filter((g) => shown.some((r) => r.group === g));
  const expiring = inHorizon.filter((r) => !r.handled);
  const reasonsTotal = data.reasons.reduce((s, r) => s + r.value, 0);
  const trend = [...data.trend.values.slice(0, -1), week.value];

  return (
    <>
      <PageHeader
        title={t("pages.writeOffs.title")}
        subtitle={t("expiry.subtitle")}
        actions={
          <Segmented
            label={t("stockouts.horizon.label")}
            value={horizon}
            onChange={(h) => {
              setHorizon(h);
              setExpanded(false);
            }}
            options={[
              { value: "3d", label: t("stockouts.horizon.3d") },
              { value: "7d", label: t("stockouts.horizon.7d") },
            ]}
          />
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Trash2} iconTone="warn" label={t("expiry.kpi.week")} info={t("today.kpi.writeOffsInfo")} value={fmtAmd(week.value)} delta={{ text: fmtDeltaPct(week.delta), tone: deltaTone(week.delta, false) }} foot={t("today.vs.week")} />
        <KpiCard
          icon={CalendarClock}
          iconTone="bad"
          label={t(`expiry.kpi.expiring.${horizon}`)}
          value={
            <>
              {fmtNumber(expiring.length)} <small className="ml-0.5 text-base font-semibold text-ink-2">{t("expiry.kpi.products", { count: expiring.length })}</small>
            </>
          }
          foot={t("expiry.kpi.expiringFoot", { value: fmtAmd(expiring.reduce((s, r) => s + stockValue(r), 0)) })}
        />
        <KpiCard icon={Percent} iconTone="info" label={t("expiry.kpi.rate")} info={t("expiry.kpi.rateInfo")} value={fmtPercent(data.rate.value)} delta={{ text: fmtDeltaPp(data.rate.delta), tone: deltaTone(data.rate.delta, false) }} foot={t("expiry.kpi.rateFoot")} />
        <KpiCard icon={BadgePercent} iconTone="good" label={t("expiry.kpi.saved")} info={t("expiry.kpi.savedInfo")} value={fmtAmd(data.savedByMarkdowns)} foot={t("expiry.kpi.savedFoot")} />
      </section>

      <Card className="mb-6 overflow-hidden">
        <div className="px-5 pb-3.5 pt-[18px]">
          <div className="text-base font-semibold">{t("expiry.table.title")}</div>
          <div className="mt-0.5 text-[13px] text-muted">{t("expiry.table.subtitle")}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                <th className={th}>{t("expiry.table.product")}</th>
                <th className={th}>{t("expiry.table.expires")}</th>
                <th className={`${th} text-right`}>{t("expiry.table.expiring")}</th>
                <th className={`${th} text-right`}>{t("expiry.table.willSell")}</th>
                <th className={`${th} text-right`}>{t("expiry.table.atRisk")}</th>
                <th className={th}>{t("expiry.table.action")}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <GroupRows key={g} group={g} rows={shown.filter((r) => r.group === g)} openId={open} onOpen={setOpen} />
              ))}
            </tbody>
          </table>
        </div>
        {hidden.length > 0 && (
          <div className="border-t border-line px-5 py-3.5">
            <button className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary" onClick={() => setExpanded((e) => !e)}>
              {expanded ? t("stockouts.table.showLess") : t(`expiry.table.showMore.${horizon}`, { count: hidden.length })}
              {expanded ? <ChevronUp className="size-[15px]" /> : <ChevronDown className="size-[15px]" />}
            </button>
          </div>
        )}
      </Card>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <div className="px-5 pt-[18px]">
            <div className="text-base font-semibold">{t("expiry.reasons.title")}</div>
            <div className="mt-0.5 text-[13px] text-muted">{t("expiry.reasons.subtitle", { total: fmtAmd(reasonsTotal) })}</div>
          </div>
          <div className="px-5 pb-2 pt-2">
            {data.reasons.map((r) => (
              <HBar key={r.key} label={t(`expiry.reasons.${r.key}`)} value={r.value} max={reasonsTotal} color={REASON_COLOR[r.key]} right={fmtAmd(r.value)} />
            ))}
          </div>
          <div className="border-t border-line px-5 py-3 text-xs text-muted">
            {t("expiry.reasons.top", { names: data.topExpired.map((id) => loc(getProduct(id).name)).join(", ") })}
          </div>
        </Card>
        <BeforeAfterChart title={t("expiry.trend.title")} subtitle={t("expiry.trend.subtitle")} values={trend} before={data.trend.before} firstWeek={new Date(2026, 7, 17)} format={(v) => fmtNumber(v / 1e6, 2)} />
      </section>

      <ExpiryDrawer row={data.rows.find((r) => r.productId === open)} onClose={() => setOpen(undefined)} />
    </>
  );
}

function GroupRows({ group, rows, openId, onOpen }: { group: ExpiryGroup; rows: ExpiryRow[]; openId?: string; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <tr>
        <td colSpan={7} className="border-b border-line bg-subtle px-5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-muted">
          {t(`expiry.groups.${group}`)}
        </td>
      </tr>
      {rows.map((r) => (
        <Row key={r.productId} row={r} active={openId === r.productId} onOpen={() => onOpen(r.productId)} />
      ))}
    </>
  );
}

function Row({ row, active, onOpen }: { row: ExpiryRow; active: boolean; onOpen: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const params = useParamText();
  const expires = useExpiresText();
  const status = useStepStatus()(row.steps);
  const p = getProduct(row.productId);
  const done = !!row.handled || status.allDone;
  const meta = row.handled
    ? t("online.prep.doneAt", { time: row.handled.at })
    : status.allDone
      ? t("stockouts.table.stepsDone")
      : status.onList
        ? t("stockouts.table.onList")
        : "";

  return (
    <tr className={`cursor-pointer ${active ? "bg-primary-50" : done ? "bg-good-bg/40 hover:bg-good-bg/60" : "hover:bg-subtle"}`} onClick={onOpen}>
      <td className={td}>
        <div className="flex items-center gap-3">
          <ProductThumb emoji={p.emoji} />
          <div>
            <div className="whitespace-nowrap font-semibold">{loc(p.name)}</div>
            <div className="text-xs text-muted">{supplierName(p.supplierId)}</div>
          </div>
        </div>
      </td>
      <td className={td}>
        <Pill tone={row.tone}>{expires(row)}</Pill>
      </td>
      <td className={`${td} text-right tabular-nums`}>{fmtNumber(row.expiring)}</td>
      <td className={`${td} text-right tabular-nums`}>{fmtNumber(row.willSell)}</td>
      <td className={`${td} whitespace-nowrap text-right tabular-nums`}>{row.handled ? "—" : fmtAmd(atRiskValue(row), { thousands: true })}</td>
      <td className={td}>
        <div className={`font-medium ${done ? "text-good" : ""}`}>
          {done && "✓ "}
          {t(`expiry.action.${row.action.key}`, params(row.action.params))}
        </div>
        {meta && <div className={`text-xs ${done ? "text-good" : "text-muted"}`}>{meta}</div>}
      </td>
      <td className={`${td} w-8`}>
        <ChevronRight className="size-[18px] text-faint" />
      </td>
    </tr>
  );
}
