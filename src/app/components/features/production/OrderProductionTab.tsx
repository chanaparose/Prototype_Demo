import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/stores/useAuthStore';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { usePostProductionUpdate } from '@/domain/production/queries/usePostProductionUpdate';
import { useRejectProductionUpdate } from '@/domain/production/queries/useRejectProductionUpdate';
import { useOrderDetail } from '@/pages/order-detail/OrderDetailContext';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { ProductionLockedState } from '@/components/features/order-detail/locked-states/ProductionLockedState';
import {
  mergeTemplateWithUpdates,
  type MergedProductionStep,
} from '@/components/features/production/types';
import { ProductionHeader } from '@/components/features/production/ProductionHeader';
import { ProductionTimeline } from '@/components/features/production/ProductionTimeline';
import { UpdateStepDrawer } from '@/components/features/production/UpdateStepDrawer';
import { RejectConfirmModal } from '@/components/features/production/RejectConfirmModal';
import {
  getProductionErrorMeta,
  productionErrorMessage,
} from '@/components/features/production/productionErrors';

function isFactoryRole(role: string | undefined): boolean {
  return role === 'FT' || role === 'FACTORY';
}

type Props = {
  orderId: string;
  onPhotoClick?: (url: string) => void;
  onRequestOverviewTab?: () => void;
  onPayDeposit?: () => void;
  onContactFactory?: () => void;
  hideHeader?: boolean;
};

export function OrderProductionTab({
  orderId,
  onPhotoClick,
  onRequestOverviewTab,
  onPayDeposit,
  onContactFactory,
  hideHeader = false,
}: Props) {
  const { user } = useAuth();
  const {
    effectiveProductionLocked,
    effectiveLockReason,
    lockContextMerged,
    production,
    isProductionLoading,
    isProductionError,
    productionError,
    uiMode,
  } = useOrderDetail();

  const isFactory = isFactoryRole(user?.role);
  const isCustomer = !isFactory;
  const productionInteractive = isFactory && !uiMode.readOnly && !effectiveProductionLocked;

  const postMutation = usePostProductionUpdate(orderId);
  const rejectMutation = useRejectProductionUpdate(orderId);

  const [drawerStep, setDrawerStep] = useState<MergedProductionStep | null>(null);
  const [rejectStep, setRejectStep] = useState<MergedProductionStep | null>(null);

  const drawerWide = useIsDesktop(768);

  // Template steps come bundled in the production-updates response — no separate API call needed.
  const templateSteps = production.template_preview ?? [];

  const merged = useMemo(() => {
    if (!templateSteps.length) return [];
    return mergeTemplateWithUpdates(templateSteps, production.updates);
  }, [templateSteps, production.updates]);

  const orderStatus = production.order_status ?? '';

  const templatePreview = templateSteps;

  const handlePhoto = useCallback(
    (url: string) => {
      onPhotoClick?.(url);
    },
    [onPhotoClick],
  );

  const onSubmit = useCallback(
    async (
      body: {
        step_id: number;
        status: 'IP' | 'CD';
        description?: string;
        image_urls: string[];
        confirm_payment_trigger?: boolean;
      },
      opts?: { confirmPaymentTriggerHeader?: boolean },
    ) => {
      await postMutation.mutateAsync({ body, confirmHeader: opts?.confirmPaymentTriggerHeader });
      toast.success('บันทึกแล้ว');
    },
    [postMutation],
  );

  const onRejectConfirm = useCallback(
    async (reason: string) => {
      const uid = rejectStep?.update.update_id;
      if (uid == null || !Number.isFinite(Number(uid))) {
        throw new Error('ไม่พบรหัสอัปเดตสำหรับขั้นนี้');
      }
      try {
        await rejectMutation.mutateAsync({
          updateId: uid,
          rejected_reason: reason,
        });
        toast.success('ส่งคำขอตรวจสอบแล้ว');
      } catch (e) {
        const { code } = getProductionErrorMeta(e);
        if (code === 'DOWNSTREAM_IN_FLIGHT') {
          toast.error(
            'ไม่สามารถปฏิเสธได้ เนื่องจากขั้นตอนถัดไปเริ่มไปแล้ว — กรุณาติดต่อฝ่ายสนับสนุน',
          );
          setRejectStep(null);
          return;
        }
        throw new Error(productionErrorMessage(e));
      }
    },
    [rejectMutation, rejectStep],
  );

  if (effectiveProductionLocked) {
    return (
      <ProductionLockedState
        reason={effectiveLockReason}
        lockContext={lockContextMerged}
        templatePreview={templatePreview}
        onBackToOverview={onRequestOverviewTab}
        onPayDeposit={onPayDeposit}
      />
    );
  }

  if (isProductionLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-3'>
        <div
          className='w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mb-3'
          style={{ borderColor: 'var(--brand-purple)', borderTopColor: 'transparent' }}
        />
        <p className='text-sm text-gray-500'>กำลังโหลดการผลิต…</p>
      </div>
    );
  }

  if (isProductionError) {
    return <ErrorAlert>{productionErrorMessage(productionError)}</ErrorAlert>;
  }

  if (!templateSteps.length) {
    return <p className='text-sm text-gray-500'>ยังไม่มีเทมเพลตขั้นตอนการผลิต</p>;
  }

  return (
    <div className='space-y-4'>
      {!hideHeader ? <ProductionHeader merged={merged} orderStatus={orderStatus} /> : null}
      <ProductionTimeline
        merged={merged}
        orderStatus={orderStatus}
        isFactory={productionInteractive}
        isCustomer={isCustomer && !uiMode.readOnly}
        onOpenDrawer={(m) => {
          if (!productionInteractive) return;
          setDrawerStep(m);
        }}
        onOpenReject={(m) => {
          if (uiMode.readOnly) return;
          setRejectStep(m);
        }}
        onContactFactory={onContactFactory}
        onPhotoClick={handlePhoto}
      />

      {productionInteractive ? (
        <UpdateStepDrawer
          open={drawerStep != null}
          placement={drawerWide ? 'right' : 'bottom'}
          step={drawerStep}
          onClose={() => setDrawerStep(null)}
          onSubmit={onSubmit}
        />
      ) : null}

      {!uiMode.readOnly ? (
        <RejectConfirmModal
          open={rejectStep != null}
          stepNameTh={rejectStep?.template.step_name_th ?? ''}
          onClose={() => setRejectStep(null)}
          onConfirm={onRejectConfirm}
        />
      ) : null}
    </div>
  );
}
