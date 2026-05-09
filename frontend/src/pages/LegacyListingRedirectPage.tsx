import { Navigate, useParams } from 'react-router-dom'

export function LegacyListingRedirectPage() {
  const { listingId } = useParams()
  return <Navigate to={`/browse/listings/${listingId ?? ''}`} replace />
}

