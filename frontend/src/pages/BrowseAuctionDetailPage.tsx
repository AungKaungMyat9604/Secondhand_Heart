import { Link, useParams } from 'react-router-dom'
import { AuctionDetailPage } from './AuctionDetailPage'

export function BrowseAuctionDetailPage() {
  const { auctionId } = useParams()
  return (
    <div>
      <div className="mb-3">
        <Link to="/browse" className="btn btn-outline-primary btn-sm">
          Back to browse
        </Link>
      </div>
      {/* AuctionDetailPage reads auctionId from params */}
      <AuctionDetailPage key={auctionId} />
    </div>
  )
}

