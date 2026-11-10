import { CircleCheck, Lightbulb, ListPlus, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import type { OnlineDay, Slot } from "@/data/online";
import { getProduct } from "@/data/products";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { TONE } from "@/components/ui/tone";
import { useLocalized } from "@/lib/useLocalized";
import { usePrepText } from "./prepText";
import { prepRef, useOnlineState } from "./useOnlineState";

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Delivery slot panel — docs/design-references/approved/10-online-orders-slot-drawer.png */
export function SlotDrawer({ slot, day, onClose }: { slot?: Slot; day: OnlineDay; onClose: () => void }) {
  const { t } = useTranslation();
  const { store } = useDemo();
  const st = useOnlineState(store.id, day);
  const open = slot ? st.openOrders(slot) : [];
  // Fixes that are not on today's list yet
  const fixIds = new Set(open.flatMap((o) => o.lines.map((l) => l.fixedBy).filter((x): x is string => !!x)));
  const toAdd = [...fixIds].map((id) => st.prepById[id]).filter((p) => p && !st.prepDone(p) && !st.actions.find(prepRef(p)));

  return (
    <Drawer
      open={!!slot}
      onClose={onClose}
      closeLabel={t("common.close")}
      header={
        slot && (
          <div className="flex items-center gap-3.5">
            <IconTile icon={Truck} tone="info" size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold">{t("online.slot.title", { from: slot.from, to: slot.to })}</div>
              <div className="text-xs text-muted">{t("online.slot.meta", { count: slot.orders, time: slot.pickingAt })}</div>
              <div className="mt-1.5">
                {open.length ? <Pill tone="bad">{t("online.slot.mayBeIncomplete", { count: open.length })}</Pill> : <Pill tone="good">{t("online.slot.ready")}</Pill>}
              </div>
            </div>
          </div>
        )
      }
      footer={
        slot && (
          <div className="grid grid-cols-[2fr_1fr] gap-2.5">
            <Button variant="primary" className="justify-center py-[11px] text-sm" disabled={!toAdd.length} onClick={() => toAdd.forEach((p) => st.actions.add(prepRef(p)))}>
              <ListPlus />
              {toAdd.length ? t("online.slot.addFixes", { count: toAdd.length }) : t("online.slot.fixesAdded")}
            </Button>
            <Button className="justify-center py-[11px] text-sm" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        )
      }
    >
      {slot && <Body slot={slot} day={day} />}
    </Drawer>
  );
}

function Body({ slot, day }: { slot: Slot; day: OnlineDay }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { store, toggleContacted } = useDemo();
  const st = useOnlineState(store.id, day);
  const prepText = usePrepText();
  const open = st.openOrders(slot);

  // The one fix that resolves the most open orders
  const counts = new Map<string, number>();
  open.forEach((o) => new Set(o.lines.filter((l, i) => l.fixedBy && !st.lineResolved(o, i)).map((l) => l.fixedBy!)).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const subOrder = open.find((o) => o.lines.some((l, i) => l.substitute && !st.lineResolved(o, i)));
  const subLine = subOrder?.lines.find((l) => l.substitute);

  return (
    <div className="flex flex-col gap-3.5">
      {open.length ? (
        <div className={`flex gap-3 rounded-xl px-4 py-3.5 ${TONE.primary}`}>
          <Lightbulb className="mt-0.5 size-5 shrink-0" />
          <div>
            {best && (
              <div className="text-[15px] font-bold text-ink">
                {t("online.slot.bestFix", {
                  product: loc(getProduct(st.prepById[best[0]].productId).name),
                  action: lowerFirst(prepText(st.prepById[best[0]])),
                  count: best[1],
                  total: open.length,
                })}
              </div>
            )}
            {subOrder && subLine?.substitute && (
              <p className={`text-[13.5px] text-ink-2 ${best ? "mt-1" : "text-[15px] font-bold text-ink"}`}>
                {t("online.slot.substituteHint", {
                  id: subOrder.id,
                  product: loc(getProduct(subLine.productId).name),
                  sub: `${loc(getProduct(subLine.substitute.productId).name)} ×${subLine.substitute.qty}`,
                })}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold ${TONE.good}`}>
          <CircleCheck className="size-5" />
          {t("online.slot.allReady")}
        </div>
      )}

      {slot.atRisk.map((o) => {
        const resolved = st.orderResolved(o);
        const contacted = st.orderKey(o);
        const hasSub = o.lines.some((l) => l.substitute);
        return (
          <div key={o.id} className={`rounded-xl border px-3.5 py-3 ${resolved ? "border-good/30 bg-good-bg/40" : "border-line"}`}>
            <div className="flex items-center justify-between gap-2.5">
              <div>
                <b>{t("online.slot.order", { id: o.id })}</b> <span className="text-xs text-muted">· {t("online.slot.items", { count: o.items })}</span>
              </div>
              {hasSub && (
                <Button className="px-2.5 py-1.5" onClick={() => toggleContacted(contacted)}>
                  {resolved ? <CircleCheck className="text-good" /> : null}
                  {resolved ? t("online.slot.contacted") : t("online.slot.markContacted")}
                </Button>
              )}
            </div>
            {o.lines.map((l, i) => {
              const p = getProduct(l.productId);
              const ok = st.lineResolved(o, i);
              const fix = l.fixedBy ? st.prepById[l.fixedBy] : undefined;
              return (
                <div key={i} className="flex items-center justify-between gap-2.5 pt-2 text-[13px]">
                  <span>
                    <span aria-hidden>{p.emoji}</span> {loc(p.name)} ×{l.qty}
                  </span>
                  {ok ? (
                    <Pill tone="good">{l.substitute ? t("online.slot.substituteAgreed") : t("online.slot.fixed")}</Pill>
                  ) : fix ? (
                    <Pill tone="warn">{t("online.slot.fixWith", { action: lowerFirst(prepText(fix)) })}</Pill>
                  ) : (
                    <Pill tone="bad">{t("online.slot.notEnough")}</Pill>
                  )}
                </div>
              );
            })}
            {o.lines.map(
              (l, i) =>
                l.substitute &&
                !st.lineResolved(o, i) && (
                  <div key={`s${i}`} className="pt-2 text-xs text-muted">
                    {t("online.slot.suggestion", { sub: `${loc(getProduct(l.substitute.productId).name)} ×${l.substitute.qty}` })}
                  </div>
                )
            )}
          </div>
        );
      })}
      <div className="text-xs text-muted">{t("online.slot.others", { count: slot.orders - slot.atRisk.length })}</div>
    </div>
  );
}
