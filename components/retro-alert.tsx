"use client";

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface RetroAlertProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
    onConfirm: () => void;
}

export function RetroAlert({ open, onOpenChange, title, message, onConfirm }: RetroAlertProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                aria-describedby={undefined}
                className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto sm:max-w-none [&>button]:hidden"
            >
                <VisuallyHidden>
                    <DialogTitle>{title}</DialogTitle>
                </VisuallyHidden>
                <div className="alert-box outer-border scale-down text-[1rem]" style={{ width: '30rem' }}>
                    <div className="inner-border">
                        <div className="alert-contents" style={{ paddingLeft: '30px', paddingRight: '20px' }}>
                            <section className="field-row" style={{ justifyContent: 'flex-start' }}>
                                <div className="square"></div>
                                <p className="alert-text" style={{ paddingLeft: '10px' }}>
                                    {message}
                                </p>
                            </section>
                            <section className="field-row" style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button className="btn" onClick={() => onOpenChange(false)}>Cancel</button>
                                <button className="btn" style={{ width: '95px' }} onClick={() => {
                                    onConfirm();
                                    onOpenChange(false);
                                }}>OK</button>
                            </section>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
