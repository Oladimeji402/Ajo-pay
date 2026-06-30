import Image from 'next/image';

export const SponsorBar = () => {
    return (
        <div
            className="fixed top-0 left-0 right-0 h-9 bg-white border-b border-slate-100"
            style={{ zIndex: 1001 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center gap-2.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                    Proudly sponsored by
                </span>
                <Image
                    src="/amk69-logo.svg"
                    alt="AMK 69 Project 1"
                    width={129}
                    height={30}
                    className="h-6 w-auto"
                    priority
                />
            </div>
        </div>
    );
};
