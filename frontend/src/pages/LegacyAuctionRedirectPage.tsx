import { Navigate, useParams } from 'react-router-dom'

export function LegacyAuctionRedirectPage() {
  const { auctionId } = useParams()
  return <Navigate to={`/browse/auctions/${auctionId ?? ''}`} replace />
}

