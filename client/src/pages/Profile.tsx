import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Edit2,
  Mail,
  MapPin,
  Save,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ProfileForm = {
  username: string;
  bio: string;
  country: string;
  age: string;
};

const emptyForm: ProfileForm = {
  username: "",
  bio: "",
  country: "",
  age: "",
};

export default function Profile() {
  const { user, loading, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onError: () => toast.error("Your profile could not be saved"),
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!user || isEditing) return;
    setForm({
      username: user.username ?? "",
      bio: user.bio ?? "",
      country: user.country ?? "",
      age: user.age ? String(user.age) : "",
    });
  }, [isEditing, user]);

  if (loading || !user) return null;

  const initial =
    user.name?.trim().charAt(0) ||
    user.username?.trim().charAt(0) ||
    user.email?.trim().charAt(0) ||
    "U";

  const handleSave = async () => {
    const parsedAge = form.age ? Number.parseInt(form.age, 10) : undefined;
    if (
      parsedAge !== undefined &&
      (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 120)
    ) {
      toast.error("Age must be between 13 and 120");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username: form.username.trim(),
        bio: form.bio.trim(),
        country: form.country.trim(),
        age: parsedAge,
      });
      await refresh();
      setIsEditing(false);
      toast.success("Profile updated");
    } catch {
      // The mutation displays a safe user-facing error.
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-purple-300" />
            <span className="text-lg font-bold sm:text-xl">Your profile</span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="min-h-11 border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <Card className="border-white/10 bg-slate-900/70 p-5 shadow-2xl backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold uppercase sm:h-20 sm:w-20 sm:text-3xl">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-bold">
                    {user.name || user.username || "ConnectNow user"}
                  </h1>
                  {user.isVerified ? (
                    <BadgeCheck
                      className="h-5 w-5 shrink-0 text-blue-300"
                      aria-label="Verified account"
                    />
                  ) : null}
                </div>
                <p className="truncate text-slate-400">
                  @{user.username || "user"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setIsEditing(value => !value)}
              className="min-h-11 bg-purple-600 text-white hover:bg-purple-500"
            >
              {isEditing ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit profile
                </>
              )}
            </Button>
          </div>
        </Card>

        {isEditing ? (
          <Card className="mt-5 space-y-5 border-white/10 bg-slate-900/70 p-5 sm:p-8">
            <div>
              <label
                htmlFor="profile-username"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Username
              </label>
              <Input
                id="profile-username"
                value={form.username}
                maxLength={32}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                className="min-h-11 border-white/10 bg-slate-800 text-white"
              />
            </div>

            <div>
              <label
                htmlFor="profile-bio"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Bio
              </label>
              <Textarea
                id="profile-bio"
                value={form.bio}
                maxLength={500}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                placeholder="Tell people a little about yourself"
                className="min-h-28 border-white/10 bg-slate-800 text-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-country"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Country
                </label>
                <Input
                  id="profile-country"
                  value={form.country}
                  maxLength={64}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  className="min-h-11 border-white/10 bg-slate-800 text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-age"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Age
                </label>
                <Input
                  id="profile-age"
                  type="number"
                  min={13}
                  max={120}
                  value={form.age}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      age: event.target.value,
                    }))
                  }
                  className="min-h-11 border-white/10 bg-slate-800 text-white"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="min-h-12 w-full bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </Button>
          </Card>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/70 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {user.bio || "No bio added yet."}
              </p>
            </Card>

            <Card className="border-white/10 bg-slate-900/70 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Account details</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
                  <div className="min-w-0">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="break-all text-slate-200">
                      {user.email || "Not provided"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
                  <div>
                    <dt className="text-slate-500">Country</dt>
                    <dd className="text-slate-200">
                      {user.country || "Not specified"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />
                  <div>
                    <dt className="text-slate-500">Member since</dt>
                    <dd className="text-slate-200">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </div>
              </dl>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
