import { UploadIcon, XIcon } from "lucide-react";
import type { UploadZoneProps } from "../types";

const UploadZone = ({ label, file, onClear, onChange }: UploadZoneProps) => {
  return (
    <div className="relative group">
      <div
        className={`relative h-74 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 
          ${file ? "border-accent-600/50 bg-accent-500/5" : "border-line hover:border-accent-500/30 hover:bg-surface"} `}
      >
        {file ? (
          <>
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60"
            />
            <div
              className="absolute inset-0 flex items-center justify-center 
            opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl backdrop-blur-sm"
            >
              <button
                type="button"
                onClick={onClear}
                className="p-2 rounded-full bg-surface-hover hover:bg-danger/20 text-foreground hover:text-danger transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md p-3 rounded-lg border border-line">
              <p className="text-sm font-medium truncate"> {file.name}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <UploadIcon className="w-8 h-8 text-muted group-hover:text-accent-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{label}</h3>
            <p className="text-sm text-muted text-center max-w-[200px]">
              Drag & drop or click to upload
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={onChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
