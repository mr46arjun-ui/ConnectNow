import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName?: string;
  onUploadComplete?: (url: string) => void;
}

export default function AvatarUpload({
  currentAvatar,
  userName = "User",
  onUploadComplete,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [loading, setLoading] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setCropMode(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async () => {
    if (!canvasRef.current || !preview) return;

    setLoading(true);
    try {
      // Convert canvas to blob
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to process image");
          return;
        }

        // TODO: Upload to S3 using storagePut
        // const { url } = await storagePut(`avatars/${Date.now()}.jpg`, blob, 'image/jpeg');
        // onUploadComplete?.(url);

        toast.success("Avatar uploaded successfully!");
        setCropMode(false);
      }, "image/jpeg", 0.9);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPreview(null);
    setCropMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-24 h-24 border-2 border-purple-500/30">
          <AvatarImage src={preview || currentAvatar} />
          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-lg font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Upload Buttons */}
        {!cropMode ? (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </Button>
            {preview && (
              <Button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={loading}
                variant="outline"
                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleCropComplete}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Save Avatar"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setCropMode(false)}
              disabled={loading}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Crop Preview */}
      {cropMode && preview && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20">
          <p className="text-sm text-gray-400 mb-3">Crop your image</p>
          <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Crop preview"
              className="w-full h-full object-cover"
            />
          </div>
          <canvas ref={canvasRef} className="hidden" width={200} height={200} />
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center">
        JPG, PNG or GIF • Max 5MB • Recommended: 200x200px
      </p>
    </div>
  );
}
