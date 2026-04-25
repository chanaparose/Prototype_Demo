import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFactoryEntityId } from '../utils/factoryUser';
import { daysUntilDeadline } from '../utils/rfqDeadline';
import { rfqsApi, factoriesApi, masterApi, categoriesApi, addressesApi } from '../services/api';
import type { RfqCardModel } from '../components/factory/RfqCard';

type QuoteRow = Record<string, unknown>;

function quoteFid(q: QuoteRow): number | null {
  const n = Number(q.factory_id ?? q.factoryId);
  return Number.isFinite(n) ? n : null;
}

function innerRfq(row: Record<string, unknown>): Record<string, unknown> {
  const r = row.rfq;
  if (r && typeof r === 'object') return r as Record<string, unknown>;
  return row;
}

export type FactoryBoardRow = RfqCardModel & {
  categoryId: number;
  shippingMethodId: number | null;
  createdAtMs: number;
  daysLeft: number | null;
};

export function useFactoryRfqBoard() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const [rows, setRows] = useState<FactoryBoardRow[]>([]);
  const [factoryCategoryIds, setFactoryCategoryIds] = useState<number[]>([]);
  const [shipNameById, setShipNameById] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rawMatch, ships] = await Promise.all([
        rfqsApi.matching(),
        masterApi.shippingMethods().catch(() => []),
      ]);
      const catRaw = await categoriesApi.list().catch(() => []);
      const cats = (Array.isArray(catRaw) ? catRaw : []) as Record<string, unknown>[];
      const catNameById = new Map<number, string>();
      for (const c of cats) {
        const id = Number(c.category_id ?? c.id);
        const name = String(c.category_name ?? c.name ?? '').trim();
        if (Number.isFinite(id) && id > 0 && name) catNameById.set(id, name);
      }
      const addrRaw = await addressesApi.list().catch(() => []);
      const addrRows = (Array.isArray(addrRaw) ? addrRaw : []) as Record<string, unknown>[];
      const addrById = new Map<number, string>();
      for (const a of addrRows) {
        const aid = Number(a.address_id ?? a.id);
        const detail = String(a.address_detail ?? '').trim();
        const zip = String(a.zip_code ?? '').trim();
        const text = [detail, zip].filter(Boolean).join(' ');
        if (Number.isFinite(aid) && aid > 0 && text) addrById.set(aid, text);
      }
      const shipArr = (Array.isArray(ships) ? ships : []) as Record<string, unknown>[];
      const sm = new Map<number, string>();
      for (const m of shipArr) {
        const id = Number(m.shipping_method_id ?? m.id);
        if (Number.isFinite(id) && id > 0) {
          sm.set(id, String(m.method_name ?? m.name ?? id).trim());
        }
      }
      setShipNameById(sm);

      let catIds: number[] = [];
      if (fid != null) {
        try {
          const fc = await factoriesApi.getCategories(fid);
          catIds = (Array.isArray(fc) ? fc : [])
            .map((r) => Number((r as Record<string, unknown>).category_id ?? (r as Record<string, unknown>).id))
            .filter((n) => Number.isFinite(n) && n > 0);
        } catch {
          catIds = [];
        }
      }
      setFactoryCategoryIds(catIds);

      const arr = (Array.isArray(rawMatch) ? rawMatch : []) as Record<string, unknown>[];
      const bases: FactoryBoardRow[] = [];
      const subNameByKey = new Map<string, string>();
      const requestedCats = new Set<number>();
      for (const row of arr) {
        const inner = innerRfq(row);
        const cid = Number(inner.category_id ?? 0);
        if (Number.isFinite(cid) && cid > 0) requestedCats.add(cid);
      }
      await Promise.all(
        [...requestedCats].map(async (cid) => {
          const subsRaw = await categoriesApi.subCategories(cid).catch(() => []);
          const subs = (Array.isArray(subsRaw) ? subsRaw : []) as Record<string, unknown>[];
          for (const s of subs) {
            const sid = Number(s.sub_category_id ?? s.id);
            const sName = String(s.name ?? '').trim();
            if (Number.isFinite(sid) && sid > 0 && sName) subNameByKey.set(`${cid}:${sid}`, sName);
          }
        }),
      );

      for (const row of arr) {
        const inner = innerRfq(row);
        const id = String(inner.rfq_id ?? inner.id ?? row.rfq_id ?? row.id ?? '');
        if (!id) continue;

        const title = String(inner.title ?? row.title ?? 'RFQ');
        const status = String(inner.status ?? row.status ?? '').toUpperCase();
        const quantity = inner.quantity != null ? Number(inner.quantity) : null;
        const totalBudgetRaw = Number(
          inner.target_unit_price ?? inner.budget_total ?? inner.total_budget ?? 0,
        );
        const legacyBudgetPerPiece =
          inner.budget_per_piece != null ? Number(inner.budget_per_piece) : null;
        const budgetPerPiece =
          Number.isFinite(totalBudgetRaw) &&
          totalBudgetRaw > 0 &&
          quantity != null &&
          Number.isFinite(quantity) &&
          quantity > 0
            ? totalBudgetRaw / quantity
            : legacyBudgetPerPiece;
        const revenueApprox =
          Number.isFinite(totalBudgetRaw) && totalBudgetRaw > 0
            ? totalBudgetRaw
            : budgetPerPiece != null &&
              quantity != null &&
              Number.isFinite(budgetPerPiece) &&
              Number.isFinite(quantity)
              ? budgetPerPiece * quantity
              : null;

        const categoryId = Number(inner.category_id ?? row.category_id ?? 0);
        const subCategoryId = Number(inner.sub_category_id ?? row.sub_category_id ?? 0);
        const categoryName = String(inner.category_name ?? row.category_name ?? '').trim() || catNameById.get(categoryId) || '';
        const subCategoryName =
          String(inner.sub_category_name ?? row.sub_category_name ?? '').trim() ||
          (Number.isFinite(subCategoryId) && subCategoryId > 0 ? subNameByKey.get(`${categoryId}:${subCategoryId}`) ?? '' : '');

        const deadlineRaw = String(inner.required_delivery_date ?? '').trim();
        const deadlineIso = deadlineRaw || null;
        const dLeft = daysUntilDeadline(deadlineIso);

        const shipIdRaw = inner.shipping_method_id ?? row.shipping_method_id;
        const shippingMethodId = shipIdRaw != null && Number(shipIdRaw) > 0 ? Number(shipIdRaw) : null;
        let shippingMethodName = String(inner.shipping_method_name ?? '').trim();
        if (!shippingMethodName && shippingMethodId != null) {
          shippingMethodName = sm.get(shippingMethodId) ?? '';
        }

        const urls = inner.reference_images ?? inner.image_urls;
        let thumbUrl: string | null = null;
        if (Array.isArray(urls) && urls.length > 0) {
          const u0 = urls[0];
          thumbUrl = typeof u0 === 'string' && u0.trim() ? u0.trim() : null;
        }

        const leadTargetDaysRaw = Number(
          inner.target_lead_time_days ?? 0,
        );
        const leadTargetDays =
          Number.isFinite(leadTargetDaysRaw) && leadTargetDaysRaw > 0 ? leadTargetDaysRaw : null;

        const created = String(inner.created_at ?? row.created_at ?? '').trim();
        const createdAtMs = created ? new Date(created).getTime() : 0;

        const addressId = Number(inner.address_id ?? 0);
        const addressSummary =
          String(inner.address_summary ?? '').trim() ||
          (Number.isFinite(addressId) && addressId > 0 ? addrById.get(addressId) ?? '' : '');

        bases.push({
          id,
          title,
          status,
          categoryName,
          subCategoryName,
          budgetPerPiece: Number.isFinite(budgetPerPiece!) ? budgetPerPiece : null,
          quantity: Number.isFinite(quantity!) ? quantity : null,
          revenueApprox: revenueApprox != null && Number.isFinite(revenueApprox) ? revenueApprox : null,
          leadTargetDays,
          deadlineIso,
          shippingMethodName,
          addressSummary,
          thumbUrl,
          myQuotedPrice: null,
          myQuoteStatus: null,
          hasMyQuote: false,
          categoryId: Number.isFinite(categoryId) && categoryId > 0 ? categoryId : 0,
          shippingMethodId,
          createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
          daysLeft: dLeft,
        });
      }

      if (fid != null && bases.length > 0) {
        const quoteLists = await Promise.all(
          bases.map((b) => rfqsApi.listQuotations(b.id).catch(() => [])),
        );
        for (let i = 0; i < bases.length; i++) {
          const qList = (Array.isArray(quoteLists[i]) ? quoteLists[i] : []) as QuoteRow[];
          const mine = qList.find((q) => quoteFid(q) === fid);
          if (mine) {
            bases[i].hasMyQuote = true;
            bases[i].myQuoteStatus = String(mine.status ?? 'PD').toUpperCase();
            const p = Number(mine.price_per_piece);
            bases[i].myQuotedPrice = Number.isFinite(p) ? p : null;
          }
        }
      }

      setRows(bases);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลด RFQ ไม่สำเร็จ');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    fid,
    rows,
    factoryCategoryIds,
    shipNameById,
    loading,
    error,
    reload: load,
  };
}
