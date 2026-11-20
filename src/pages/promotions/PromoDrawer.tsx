import { BadgePercent, Receipt, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { PromoIdea, PastPromo } from "@/data/promotions";
import { paidOff } from "@/data/promotions";
import { getProduct } from "@/data/products";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { TONE } from "@/components/ui/tone";
import { fmtAmd, fmtDate, fmtNumber } from "@/lib/format";
import { useLocalized } from "@/lib/useLocalized";
import { StepList } from "@/pages/stockouts/StepList";
import { useDeal, type usePromoIdeas, type IdeaView } from "./usePromoIdeas";

const day = (x: Date) => fmtDate(x, { weekday: "short", month: "short", day: "numeric" });
const short = (x: Date) => fmtDate(x, { weekday: "short" });

/** A suggested promotion: why, the expected effect (with the math) and what to do. */
export function IdeaDrawer({ view, onClose, actions, onReject }: { view?: IdeaView; onClose: () => void; actions: ReturnType<typeof usePromoIdeas>; onReject: (idea: PromoIdea) => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const i = view?.idea;
  const name = i && loc(getProduct(i.productId).name);

  return (
    <Drawer
      open={!!view}
      onClose={onClose}
      closeLabel={t("common.close")}
      header={
        i && (
          <div className="flex items-center gap-3.5">
            <IconTile icon={BadgePercent} tone="primary" size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">{t("promotions.drawer.ideaTitle", { product: name, cut: i.cut })}</div>
              <div className="text-xs text-muted">
                {day(i.from)} – {day(i.to)}
                {i.productCount ? ` · ${t("promotions.drawer.products_count", { count: i.productCount })}` : ""}
              </div>
            </div>
            {view.status !== "suggested" && <Pill tone={view.status === "approved" ? "good" : view.status === "sent" ? "warn" : "neutral"}>{t(`promotions.status.${view.status}`)}</Pill>}
          </div>
        )
      }
      footer={
        view &&
        i &&
        (view.status === "suggested" ? (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Button variant="primary" className="justify-center py-[10px]" onClick={() => actions.send(i)}>
              {t("promotions.action.send")}
            </Button>
            <Button className="justify-center py-[10px]" onClick={() => actions.approve(i)}>
              {t("promotions.action.approve")}
            </Button>
            <Button className="justify-center py-[10px]" onClick={() => onReject(i)}>
              {t("promotions.action.reject")}
            </Button>
          </div>
        ) : view.status === "sent" ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" className="justify-center py-[10px]" onClick={() => actions.approve(i)}>
              {t("promotions.action.approved")}
            </Button>
            <Button className="justify-center py-[10px]" onClick={() => onReject(i)}>
              {t("promotions.action.rejected")}
            </Button>
          </div>
        ) : (
          <Button className="w-full justify-center py-[11px] text-sm" onClick={onClose}>
            {t("common.close")}
          </Button>
        ))
      }
    >
      {view && i && <IdeaBody view={view} name={name!} />}
    </Drawer>
  );
}

function IdeaBody({ view, name }: { view: IdeaView; name: string }) {
  const { t } = useTranslation();
  const i = view.idea;
  const extraUnits = i.promoUnits - i.normalUnits;
  const net = i.extraSales - i.discountCost;
  const days = i.daily.normal.map((_, n) => {
    const x = new Date(i.from);
    x.setDate(x.getDate() + n);
    return short(x);
  });
  const data = days.map((label, n) => ({ label, normal: i.daily.normal[n], promo: i.daily.promo[n] }));

  return (
    <div className="flex flex-col gap-5">
      <div className={`flex gap-3 rounded-xl px-4 py-3.5 ${TONE.primary}`}>
        <TrendingUp className="mt-0.5 size-5 shrink-0" />
        <div>
          <div className="text-[15px] font-bold text-ink">{t(`promotions.reason.${i.reason.key}`)}</div>
          <p className="mt-1 text-[13.5px] text-ink-2">{t(`promotions.why.${i.reason.detail}`, i.reason.params)}</p>
        </div>
      </div>

      {/* The math, like the "Why?" panel on order suggestions */}
      <section>
        <h3 className="mb-2 font-semibold">{t("promotions.drawer.mathTitle")}</h3>
        <dl className="divide-y divide-line rounded-xl border border-line text-[13.5px]">
          {[
            [t("promotions.drawer.normalUnits", { product: name }), fmtNumber(i.normalUnits)],
            [t("promotions.drawer.promoUnits", { cut: i.cut }), fmtNumber(i.promoUnits)],
            [t("promotions.drawer.extraUnits"), `+${fmtNumber(extraUnits)}`],
            ...(i.clears ? [[t("promotions.drawer.clears"), fmtAmd(i.clears, { thousands: true })]] : []),
            [t("promotions.drawer.extraSales"), `+${fmtAmd(i.extraSales, { thousands: true })}`],
            [t("promotions.drawer.discountCost"), `−${fmtAmd(i.discountCost, { thousands: true })}`],
          ].map(([label, v]) => (
            <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <dt className="text-ink-2">{label}</dt>
              <dd className="font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 bg-subtle px-4 py-2.5">
            <dt className="font-semibold">{t("promotions.drawer.net")}</dt>
            <dd className={`font-bold tabular-nums ${net >= 0 ? "text-good" : "text-bad"}`}>
              {net >= 0 ? "+" : "−"}
              {fmtAmd(Math.abs(net), { thousands: true })}
            </dd>
          </div>
        </dl>
      </section>

      <Chart title={t("promotions.drawer.chartTitleExpected", { product: name })} data={data} />

      {view.status === "approved" ? (
        <StepList steps={i.steps} />
      ) : (
        <div className="rounded-xl border border-line px-4 py-3 text-[13px] text-ink-2">{t("promotions.drawer.howItWorks")}</div>
      )}
    </div>
  );
}

/** A past promotion found in the till data: did it pay off? */
export function PastDrawer({ promo, onClose }: { promo?: PastPromo; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const deal = useDeal();
  const name = promo && loc(getProduct(promo.productId).name);
  const ok = promo && paidOff(promo);

  return (
    <Drawer
      open={!!promo}
      onClose={onClose}
      closeLabel={t("common.close")}
      header={
        promo && (
          <div className="flex items-center gap-3.5">
            <IconTile icon={Receipt} tone={ok ? "good" : "bad"} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">
                {name} · {deal(promo.deal)}
              </div>
              <div className="text-xs text-muted">
                {day(promo.from)} – {day(promo.to)} · {t("promotions.past.foundInTill")}
              </div>
            </div>
            <Pill tone={ok ? "good" : "bad"}>{t(ok ? "promotions.past.paid" : "promotions.past.notPaid")}</Pill>
          </div>
        )
      }
      footer={
        <Button className="w-full justify-center py-[11px] text-sm" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      {promo && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              [t("promotions.past.col.lift"), `+${promo.liftPct}%`],
              [t("promotions.past.col.extra"), fmtAmd(promo.extraSales, { thousands: true })],
              [t("promotions.past.col.cost"), fmtAmd(promo.discountCost, { thousands: true })],
            ].map(([label, v]) => (
              <div key={label} className="rounded-xl border border-line px-3.5 py-3">
                <div className="truncate text-[12.5px] text-muted">{label}</div>
                <div className="mt-0.5 text-xl font-bold">{v}</div>
              </div>
            ))}
          </div>
          <Chart
            title={t("promotions.drawer.chartTitlePast", { product: name })}
            data={promo.daily.normal.map((v, n) => {
              const x = new Date(promo.from);
              x.setDate(x.getDate() + n);
              return { label: short(x), normal: v, promo: promo.daily.promo[n] };
            })}
          />
          <div className={`rounded-xl px-4 py-3 text-[13.5px] ${ok ? TONE.good : TONE.bad}`}>
            {t(ok ? "promotions.past.paidText" : "promotions.past.notPaidText", {
              extra: fmtAmd(promo.extraSales, { thousands: true }),
              cost: fmtAmd(promo.discountCost, { thousands: true }),
            })}
            {promo.note && <span className="mt-1 block text-ink-2">{t(`promotions.past.note.${promo.note}`)}</span>}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Chart({ title, data }: { title: string; data: { label: string; normal: number; promo: number }[] }) {
  const { t } = useTranslation();
  return (
    <section>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <div className="mb-1.5 flex gap-4 text-[12.5px] text-ink-2">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-[#e4e5ec]" />{t("promotions.drawer.normal")}</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-[3px] bg-primary" />{t("promotions.drawer.withPromo")}</span>
      </div>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f0f0f5" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11, fill: "#7a7f93" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#7a7f93" }} allowDecimals={false} />
            <Bar dataKey="normal" fill="#e4e5ec" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={30} />
            <Bar dataKey="promo" fill="#5b3fe0" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
