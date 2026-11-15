import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/app/DemoContext";
import type { OrderView } from "@/app/useOrders";
import { DEMO_NOW } from "@/data/world";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useLocalized } from "@/lib/useLocalized";
import { pick } from "@/lib/names";

/** Ordered quantity of each line that was ordered (accepted / changed, > 0) */
export const orderedLines = (view: OrderView) => view.lines.filter((l) => (l.review?.qty ?? 0) > 0);

/**
 * "Did everything arrive?" — the manager confirms a delivery.
 * `startShort` opens straight on the list of lines to correct.
 */
export function ReceiveDialog({ view, open, startShort = false, onClose }: { view: OrderView; open: boolean; startShort?: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { setReceipt, snooze } = useDemo();
  const [short, setShort] = useState(startShort);
  const lines = orderedLines(view);
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(lines.map((l) => [l.product.id, l.review!.qty])));
  const supplier = pick(view.supplier.name);

  const close = () => {
    setShort(startShort);
    onClose();
  };
  const allArrived = () => {
    setReceipt(view.order.id, { on: DEMO_NOW, short: {} });
    close();
  };
  const saveShort = () => {
    const shortLines = Object.fromEntries(lines.filter((l) => qty[l.product.id] < l.review!.qty).map((l) => [l.product.id, qty[l.product.id]]));
    setReceipt(view.order.id, { on: DEMO_NOW, short: shortLines });
    close();
  };

  return (
    <Modal open={open} onClose={close} labelledBy="receive-title">
      <h2 id="receive-title" className="text-lg font-bold">
        {t("orders.receive.title", { supplier })}
      </h2>
      {!short ? (
        <>
          <p className="mt-1 text-muted">{t("orders.receive.text")}</p>
          <div className="mt-5 flex flex-col gap-2">
            <Button variant="primary" className="justify-center py-[11px]" onClick={allArrived}>
              {t("orders.receive.all")}
            </Button>
            <Button className="justify-center py-[11px]" onClick={() => setShort(true)}>
              {t("orders.receive.someShort")}
            </Button>
            {view.needsCheck && (
              <Button
                className="justify-center py-[11px]"
                onClick={() => {
                  snooze(view.order.id);
                  close();
                }}
              >
                {t("orders.receive.notYet")}
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-muted">{t("orders.receive.shortText")}</p>
          <ul className="mt-3 max-h-[46vh] divide-y divide-line overflow-y-auto rounded-ctl border border-line">
            {lines.map((l) => {
              const v = qty[l.product.id];
              const ordered = l.review!.qty;
              return (
                <li key={l.product.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0">
                    <span aria-hidden>{l.product.emoji}</span>&nbsp; {loc(l.product.name)}
                    <span className="block text-xs text-muted">{t("orders.receive.ordered", { qty: ordered })}</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={ordered}
                    value={v}
                    aria-label={t("orders.receive.receivedOf", { product: loc(l.product.name) })}
                    onChange={(e) => setQty((p) => ({ ...p, [l.product.id]: Math.max(0, Math.min(ordered, Number(e.target.value) || 0)) }))}
                    className={`w-20 rounded-ctl border px-2 py-1.5 text-right tabular-nums ${v < ordered ? "border-warn bg-warn-bg font-semibold" : "border-line"}`}
                  />
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex justify-end gap-2">
            <Button onClick={() => (startShort ? close() : setShort(false))}>{t("orders.receive.back")}</Button>
            <Button variant="primary" onClick={saveShort}>
              {t("orders.receive.save")}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
