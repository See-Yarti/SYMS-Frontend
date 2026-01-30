// src/components/Taxes/TaxDialog.tsx
import * as React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Props = {
    open: boolean;
    onClose: () => void;
    onSave: (payload: { title: string; description?: string; percentage?: string; amount?: string; taxType: 'PERCENTAGE' | 'FIXED' }) => Promise<void> | void;
    initialValues?: { title: string; description?: string; percentage?: string; amount?: string; taxType?: 'PERCENTAGE' | 'FIXED' };
    editing?: boolean;
    saving?: boolean;
};

// Accepts "", or 0–100 with up to 2 decimals (we'll enforce (0,100) in logic)
const SHAPE_REGEX = /^(?:100(?:\.0{1,2})?|(?:\d{1,2})(?:\.\d{0,2})?)$/;

function sanitizePercentInput(raw: string): string {
    // keep digits and at most one "."
    let s = raw.replace(/[^\d.]/g, '');
    const parts = s.split('.');
    if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');

    const [intp, decp = ''] = s.split('.');
    const dec2 = decp.slice(0, 2);
    let out = decp.length ? `${intp}.${dec2}` : intp;

    // normalize leading zeros (except "0.xx")
    if (out.startsWith('0') && !out.startsWith('0.') && out.length > 1) {
        out = String(Number(out)); // "007" -> "7"
    }

    // hard cap numeric part at 100 to avoid junk like 1000 -> 100
    const n = Number(out);
    if (!Number.isNaN(n) && n > 100) out = '100';

    return out;
}

function isValidShape(s: string): boolean {
    return s !== '' && SHAPE_REGEX.test(s);
}

// strictly between 0 and 100 (no 0, no 100)
function isWithinOpenInterval(s: string): boolean {
    if (!isValidShape(s)) return false;
    const n = Number(s);
    return n > 0 && n < 100;
}

export default function TaxDialog({
    open,
    onClose,
    onSave,
    initialValues,
    editing,
    saving,
}: Props) {
    const [title, setTitle] = React.useState(initialValues?.title ?? '');
    const [description, setDescription] = React.useState(initialValues?.description ?? '');
    const [percentage, setPercentage] = React.useState(initialValues?.percentage ?? '');
    const [amount, setAmount] = React.useState(initialValues?.amount ?? '');
    const [taxType, setTaxType] = React.useState<'PERCENTAGE' | 'FIXED'>(initialValues?.taxType ?? 'PERCENTAGE');

    // keep last accepted value so we can revert on invalid keystrokes
    const lastAcceptedRef = React.useRef<string>('');

    // prevent toast spam
    const lastToastAtRef = React.useRef<number>(0);
    const toastIfNeeded = (msg: string) => {
        const now = Date.now();
        if (now - lastToastAtRef.current > 800) {
            lastToastAtRef.current = now;
            toast.error(msg);
        }
    };

    React.useEffect(() => {
        if (open) {
            const p = initialValues?.percentage ?? '';
            const a = initialValues?.amount ?? '';
            setTitle(initialValues?.title ?? '');
            setDescription(initialValues?.description ?? '');
            setPercentage(p);
            setAmount(a);
            setTaxType(initialValues?.taxType ?? 'PERCENTAGE');
            // initialize last accepted
            lastAcceptedRef.current = p ?? '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Auto-format: when value is a whole number (no "."), wait a tick and turn "67" -> "67.00"
    React.useEffect(() => {
        if (!percentage) return;
        if (/^\d+$/.test(percentage)) {
            const t = setTimeout(() => {
                const n = Number(percentage);
                if (Number.isFinite(n)) {
                    const fixed = n.toFixed(2);
                    // do not auto-format to forbidden values
                    if (n === 0 || n === 100) return;
                    setPercentage(fixed);
                    lastAcceptedRef.current = fixed;
                }
            }, 400);
            return () => clearTimeout(t);
        }
    }, [percentage]);

    const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = sanitizePercentInput(e.target.value);

        // allow empty while typing
        if (next === '') {
            setPercentage('');
            return;
        }

        // shape check first (up to 2 decimals)
        if (!isValidShape(next)) {
            // reject keystroke, revert
            setPercentage(lastAcceptedRef.current);
            return;
        }

        // hard disallow 0 or 100
        const n = Number(next);
        if (n === 0 || n === 100) {
            toastIfNeeded('Percentage must be greater than 0 and less than 100');
            setPercentage(lastAcceptedRef.current);
            return;
        }

        // accept
        setPercentage(next);
        lastAcceptedRef.current = next;
    };

    const handlePercentBlur = () => {
        if (!percentage) return;
        // on blur: finalize as 2 decimals if valid and within (0,100)
        if (isWithinOpenInterval(percentage)) {
            const n = Number(percentage);
            const fixed = n.toFixed(2);
            setPercentage(fixed);
            lastAcceptedRef.current = fixed;
        } else {
            toastIfNeeded('Percentage must be greater than 0 and less than 100');
            // revert to last accepted good value or clear
            setPercentage(lastAcceptedRef.current || '');
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow only numbers, decimal point, and up to 2 decimal places
        const sanitized = raw.replace(/[^0-9.]/g, '').replace(/^\./, '0.').replace(/\.{2,}/g, '.');
        const parts = sanitized.split('.');
        if (parts.length > 2) {
            return; // Don't allow multiple decimal points
        }
        if (parts[1] && parts[1].length > 2) {
            return; // Don't allow more than 2 decimal places
        }
        setAmount(sanitized);
    };

    function validate(): string | null {
        if (!title.trim()) return 'Title is required';
        
        if (taxType === 'PERCENTAGE') {
            if (!isWithinOpenInterval(percentage)) {
                return 'Percentage must be greater than 0 and less than 100 (up to 2 decimals)';
            }
        } else if (taxType === 'FIXED') {
            if (!amount || Number(amount) <= 0) {
                return 'Amount must be a positive number with up to 2 decimals';
            }
        }
        
        return null;
    }

    const submit = async () => {
        const err = validate();
        if (err) {
            toast.error(err);
            return;
        }
        
        const payload: { title: string; description?: string; percentage?: string; amount?: string; taxType: 'PERCENTAGE' | 'FIXED' } = {
            title: title.trim(),
            description: (description || '').trim() || undefined,
            taxType: taxType,
        };
        
        if (taxType === 'PERCENTAGE') {
            const asFixed = Number(percentage).toFixed(2);
            payload.percentage = asFixed;
        } else if (taxType === 'FIXED') {
            const asFixed = Number(amount).toFixed(2);
            payload.amount = asFixed;
        }
        
        await onSave(payload);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editing ? 'Edit Tax' : 'Add Tax'}</DialogTitle>
                    <DialogDescription>
                        This tax will be saved for the current location you’re viewing.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Title *</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="VAT, Sales Tax, GST…"
                        />
                    </div>

                    <div>
                        <Label>Tax Type *</Label>
                        <Select value={taxType} onValueChange={(value: 'PERCENTAGE' | 'FIXED') => setTaxType(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select tax type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="FIXED">Fixed Amount</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {taxType === 'PERCENTAGE' ? (
                        <div>
                            <Label>Percentage *</Label>
                            <Input
                                inputMode="decimal"
                                step="0.01"
                                min={0}
                                max={100}
                                value={percentage}
                                onChange={handlePercentChange}
                                onBlur={handlePercentBlur}
                                placeholder="e.g., 5.00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Enter a value between 0 and 100 (exclusive), up to 2 decimals. Whole numbers auto-format to <code>.00</code>.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <Label>Amount *</Label>
                            <Input
                                inputMode="decimal"
                                step="0.01"
                                min={0}
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="e.g., 12.50"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Enter a positive amount with up to 2 decimals (e.g., 12.50).
                            </p>
                        </div>
                    )}

                    <div>
                        <Label>Description</Label>
                        <Textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} disabled={Boolean(saving) || !title.trim() || (taxType === 'PERCENTAGE' ? !isWithinOpenInterval(percentage) : !amount || Number(amount) <= 0)} className="bg-[#F56304] hover:bg-[#e05503] text-white">
                        {editing ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}