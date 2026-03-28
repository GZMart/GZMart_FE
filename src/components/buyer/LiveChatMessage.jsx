// src/components/buyer/LiveChatMessage.jsx
export default function LiveChatMessage({ sender, content, isSupport = false, isOwn = false }) {
  return (
    <div className="flex gap-2 items-start">
      <div className={`px-3 py-2 rounded-2xl ${
        isSupport
          ? 'bg-[var(--color-primary)]/10 backdrop-blur-md border border-[var(--color-primary)]/15'
          : isOwn
            ? 'bg-[var(--color-primary)]/10 backdrop-blur-md border border-[var(--color-primary)]/15 rounded-tr-none'
            : 'bg-surface-container-low border border-outline/10 rounded-tl-none'
      }`}>
        <span className={`text-[10px] font-bold block mb-0.5 ${
          isSupport
            ? 'italic text-[var(--color-primary)]'
            : 'text-[var(--color-text-secondary,#575c60)]'
        }`}>
          {sender}
        </span>
        <p className="text-xs leading-snug" style={{
          color: isOwn || isSupport ? '#1c1b1b' : '#2a2f32'
        }}>{content}</p>
      </div>
    </div>
  );
}
