import { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  label: string;
  accept: string;
  maxMB: number;
  value: File | null;
  onChange: (f: File | null) => void;
  hint?: string;
  required?: boolean;
}

export function FileUpload({ label, accept, maxMB, value, onChange, hint, required }: FileUploadProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (f: File) => {
    setError(null);
    if (f.size > maxMB * 1024 * 1024) {
      setError(`Ukuran file maksimum ${maxMB} MB.`);
      return false;
    }
    const acceptList = accept.split(",").map((a) => a.trim().toLowerCase());
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    const okType = acceptList.includes(ext) || acceptList.includes(f.type);
    if (!okType) {
      setError(`Format harus ${accept}.`);
      return false;
    }
    return true;
  };

  const handleFile = (f: File | undefined | null) => {
    if (!f) return;
    if (validate(f)) onChange(f);
  };

  const isImage = value && value.type.startsWith("image/");

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {!value ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
          onClick={() => ref.current?.click()}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition",
            drag ? "border-primary bg-accent/40" : "border-border hover:border-primary/40 hover:bg-surface-muted",
            error && "border-destructive bg-destructive/5"
          )}
        >
          <Upload className="h-7 w-7 mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Tarik file ke sini atau <span className="text-primary">klik untuk upload</span></p>
          <p className="text-xs text-muted-foreground mt-1">{accept} · maks {maxMB} MB</p>
          {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
          <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
            {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-medium truncate">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span className="truncate">{value.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(1)} KB</div>
          </div>
          <button type="button" onClick={() => onChange(null)} className="p-1.5 rounded hover:bg-surface-muted text-muted-foreground hover:text-destructive" aria-label="Hapus">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
}
