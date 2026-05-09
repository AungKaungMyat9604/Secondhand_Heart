import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthToken } from '../auth/useAuthToken'
import { AuctionDetailPage } from './AuctionDetailPage'

export function MyAuctionDetailPage() {
  const navigate = useNavigate()
  const { token } = useAuthToken()
  const { auctionId } = useParams()

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  if (!token) return null

  return (
    <div>
      <div className="mb-3 d-flex gap-2">
        <Link to="/my/auctions" className="btn btn-outline-primary btn-sm">
          Back to my auctions
        </Link>
      </div>
      <AuctionDetailPage key={auctionId} />
    </div>
  )
}

