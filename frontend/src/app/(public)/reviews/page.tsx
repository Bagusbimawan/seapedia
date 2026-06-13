'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/ListHelpers'
import { listReviews, createReview } from '@/lib/api/reviews'
import { formatDate } from '@/lib/format'

export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => (await listReviews({ limit: 20 })).data.data,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createReview({ reviewer_name: name, rating, comment })
      setName('')
      setComment('')
      setRating(5)
      await queryClient.invalidateQueries({ queryKey: ['reviews'] })
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal mengirim review')
    } finally { setLoading(false) }
  }

  return (
    <div className="container-page page-section">
      <PageHeader
        title="Ulasan Seapedia"
        subtitle="Bagikan pengalaman Anda menggunakan platform kami"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tulis Ulasan</CardTitle></CardHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} required />
            <div>
              <label className="text-sm font-medium text-slate-700">Rating</label>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} type="button" onClick={() => setRating(r)}>
                    <Star className={`h-6 w-6 transition-colors ${r <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Komentar</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" isLoading={loading}>Kirim Ulasan</Button>
          </form>
        </Card>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : !data?.items?.length ? (
            <EmptyState icon={Star} title="Belum ada ulasan" description="Jadilah yang pertama memberikan ulasan!" />
          ) : (
            data.items.map((r) => (
              <Card key={r.id} className="transition-all hover:shadow-card">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-100 text-sm font-bold text-ocean-700">
                    {r.reviewer_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{r.reviewer_name}</p>
                    <div className="flex">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{r.comment}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(r.created_at)}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
