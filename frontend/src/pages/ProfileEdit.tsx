import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { avatarUrl, portfolioUrl } from '../lib/storage';
import { CATEGORIES, MAX_PORTFOLIO_IMAGES } from '../lib/constants';
import type { Profile, UploadResult } from '../types';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().min(7, 'Enter a valid phone number'),
  city: z.string().trim().min(2, 'Enter your city'),
  bio: z.string().trim().max(500, 'Bio must be 500 characters or fewer'),
  category: z.enum(CATEGORIES),
  skills: z.string(),
  hourlyRateNGN: z.string(),
  yearsExperience: z.string(),
});

export default function ProfileEdit() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    bio: '',
    category: CATEGORIES[0] as string,
    skills: '',
    hourlyRateNGN: '',
    yearsExperience: '',
  });
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const portfolioInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName,
      phone: user.phone,
      city: user.city,
      bio: user.bio ?? '',
      category: user.category ?? (CATEGORIES[0] as string),
      skills: (user.skills ?? []).join(', '),
      hourlyRateNGN: user.hourlyRateNGN ? String(user.hourlyRateNGN) : '',
      yearsExperience:
        user.yearsExperience != null && user.yearsExperience > 0
          ? String(user.yearsExperience)
          : '',
    });
  }, [user]);

  if (!user) return null;
  const isArtisan = user.role === 'artisan';
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    const values = parsed.data;
    setErrors([]);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        fullName: values.fullName,
        phone: values.phone,
        city: values.city,
        bio: values.bio,
      };
      if (isArtisan) {
        body.category = values.category;
        body.skills = values.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
          .slice(0, 10);
        if (values.hourlyRateNGN) body.hourlyRateNGN = Number(values.hourlyRateNGN);
        if (values.yearsExperience) body.yearsExperience = Number(values.yearsExperience);
      }
      const updated = await api.put<Profile>('/profile', body);
      setUser(updated);
      setMessage('Profile saved.');
    } catch (error) {
      setMessage(null);
      setErrors([error instanceof Error ? error.message : 'Save failed']);
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrors([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<UploadResult>('/profile/avatar', formData);
      if (result.profile) setUser(result.profile);
      setAvatarVersion((v) => v + 1);
      setMessage('Avatar updated.');
    } catch (error) {
      setMessage(null);
      setErrors([error instanceof Error ? error.message : 'Avatar upload failed']);
    } finally {
      setUploading(false);
      if (avatarInput.current) avatarInput.current.value = '';
    }
  };

  const uploadPortfolio = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrors([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<UploadResult>('/profile/portfolio', formData);
      setUser({ ...user, portfolioFileIds: result.portfolioFileIds ?? [] });
      setMessage('Portfolio image added.');
    } catch (error) {
      setMessage(null);
      setErrors([error instanceof Error ? error.message : 'Portfolio upload failed']);
    } finally {
      setUploading(false);
      if (portfolioInput.current) portfolioInput.current.value = '';
    }
  };

  const removePortfolio = async (fileId: string) => {
    setUploading(true);
    setErrors([]);
    try {
      const result = await api.delete<UploadResult>(`/profile/portfolio/${fileId}`);
      setUser({ ...user, portfolioFileIds: result.portfolioFileIds ?? [] });
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Delete failed']);
    } finally {
      setUploading(false);
    }
  };

  const avatar = avatarUrl(user.avatarFileId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Edit profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isArtisan
          ? 'A complete profile gets more bookings — add your trade, skills, rate and photos of your work.'
          : 'Keep your contact details up to date.'}
      </p>

      {message && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>
      )}
      {errors.length > 0 && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errors.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-5">
          {avatar ? (
            <img
              key={avatarVersion}
              src={avatar}
              alt=""
              className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-3xl font-bold text-amber-700">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <input
              ref={avatarInput}
              type="file"
              accept="image/jpeg,image/png"
              onChange={uploadAvatar}
              className="hidden"
            />
            <button
              onClick={() => avatarInput.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Change avatar'}
            </button>
            <p className="mt-1 text-xs text-slate-400">JPG or PNG, max 2MB</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-8 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input
                value={form.fullName}
                onChange={(event) => set({ fullName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => set({ phone: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">City</span>
              <input
                value={form.city}
                onChange={(event) => set({ city: event.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </label>
            {isArtisan && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Primary trade</span>
                <select
                  value={form.category}
                  onChange={(event) => set({ category: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Bio ({form.bio.length}/500)</span>
            <textarea
              value={form.bio}
              onChange={(event) => set({ bio: event.target.value })}
              rows={3}
              placeholder="Tell clients about your experience and how you work…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </label>

          {isArtisan && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <label className="block sm:col-span-3">
                <span className="text-sm font-medium text-slate-700">
                  Skills (comma-separated)
                </span>
                <input
                  value={form.skills}
                  onChange={(event) => set({ skills: event.target.value })}
                  placeholder="wiring, socket installation, fan mounting"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Rate (₦/hour)</span>
                <input
                  type="number"
                  min={0}
                  value={form.hourlyRateNGN}
                  onChange={(event) => set({ hourlyRateNGN: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Years of experience</span>
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={form.yearsExperience}
                  onChange={(event) => set({ yearsExperience: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      {isArtisan && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">Portfolio</h2>
              <p className="text-sm text-slate-500">
                {user.portfolioFileIds.length}/{MAX_PORTFOLIO_IMAGES} images · JPG or PNG, max 5MB
              </p>
            </div>
            <input
              ref={portfolioInput}
              type="file"
              accept="image/jpeg,image/png"
              onChange={uploadPortfolio}
              className="hidden"
            />
            <button
              onClick={() => portfolioInput.current?.click()}
              disabled={uploading || user.portfolioFileIds.length >= MAX_PORTFOLIO_IMAGES}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              {uploading ? 'Uploading…' : 'Add image'}
            </button>
          </div>

          {user.portfolioFileIds.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {user.portfolioFileIds.map((fileId) => (
                <div key={fileId} className="group relative">
                  <img
                    src={portfolioUrl(fileId)}
                    alt="Portfolio work"
                    className="aspect-square w-full rounded-xl border border-slate-200 object-cover"
                  />
                  <button
                    onClick={() => removePortfolio(fileId)}
                    disabled={uploading}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-red-600 opacity-0 shadow transition group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
