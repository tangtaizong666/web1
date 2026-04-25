import { motion } from 'motion/react';
import { Navigation2, ShieldCheck, X } from 'lucide-react';

type LocationPermissionDialogProps = {
  canRequestLocation: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LocationPermissionDialog({
  canRequestLocation,
  onCancel,
  onConfirm,
}: LocationPermissionDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-[#362A1F]/45 p-5 backdrop-blur-md"
      onClick={onCancel}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-permission-title"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#DECFBE] bg-[#FDFBF7] p-6 shadow-[0_22px_60px_rgba(54,42,31,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="关闭定位申请"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full border border-[#DECFBE] bg-[#F4F0E8] p-2 text-[#4A3D30] transition-colors hover:bg-[#EAE3D4]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#DECFBE] bg-[#F4F0E8] text-[#986E4B]">
          {canRequestLocation ? <Navigation2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </div>

        <h2 id="location-permission-title" className="font-serif text-2xl tracking-wide text-[#362A1F]">
          定位权限申请
        </h2>

        {canRequestLocation ? (
          <p className="mt-4 text-sm leading-7 text-[#6C5B49]">
            为了帮你查找附近的回收箱或自动填写上门地址，网站将向浏览器申请一次当前位置权限。你可以拒绝，并继续手动输入位置。
          </p>
        ) : (
          <p className="mt-4 text-sm leading-7 text-[#A25344]">
            当前页面不是 HTTPS 安全环境，浏览器通常不会开放定位权限。请先配置 HTTPS，或者暂时手动输入位置继续使用。
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#DECFBE] px-5 py-3 text-sm font-medium text-[#6C5B49] transition-colors hover:bg-[#F4F0E8]"
          >
            {canRequestLocation ? '取消' : '我知道了'}
          </button>
          {canRequestLocation ? (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-[#8E6545] px-5 py-3 text-sm font-semibold text-[#FDFBF7] shadow-[0_8px_20px_rgba(142,101,69,0.22)] transition-colors hover:bg-[#6C4B30]"
            >
              允许定位
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
