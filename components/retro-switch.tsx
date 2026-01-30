import clsx from "clsx";

interface RetroSwitchProps {
    id?: string;
    label?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

export function RetroSwitch({ id, label, checked, onChange, className }: RetroSwitchProps) {
    return (
        <div className={clsx("flex items-center gap-2 text-[0.7rem] uppercase font-bold", className)}>
            {label && <span className="text-gray-500 font-bold uppercase">{label}</span>}
            <div
                id={id}
                className={clsx(
                    "w-8 h-4 border-2 border-gray-400 relative cursor-pointer",
                    checked ? "bg-[var(--primary)]" : "bg-gray-200"
                )}
                onClick={() => onChange(!checked)}
            >
                <div className={clsx(
                    "absolute top-0 bottom-0 w-3 bg-white border border-gray-400 transition-all",
                    checked ? "right-0" : "left-0"
                )}></div>
            </div>
        </div>
    );
}
