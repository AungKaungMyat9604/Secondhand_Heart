import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProfilePage } from './pages/ProfilePage'
import { CreateListingPage } from './pages/CreateListingPage'
import { BrowsePage } from './pages/BrowsePage'
import { AuctionsPage } from './pages/AuctionsPage'
import { BrowseListingDetailPage } from './pages/BrowseListingDetailPage'
import { MyListingDetailPage } from './pages/MyListingDetailPage'
import { BrowseAuctionDetailPage } from './pages/BrowseAuctionDetailPage'
import { MyAuctionDetailPage } from './pages/MyAuctionDetailPage'
import { LegacyListingRedirectPage } from './pages/LegacyListingRedirectPage'
import { LegacyAuctionRedirectPage } from './pages/LegacyAuctionRedirectPage'
import { AdminListingsPage } from './pages/AdminListingsPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AdminAuctionsPage } from './pages/AdminAuctionsPage'
import { AdminReportsPage } from './pages/AdminReportsPage'
import { MyListingsPage } from './pages/MyListingsPage'
import { EditListingPage } from './pages/EditListingPage'
import { MyAuctionsPage } from './pages/MyAuctionsPage'
import { CreateAuctionPage } from './pages/CreateAuctionPage'
import { MyActivityPage } from './pages/MyActivityPage'
import { NotificationsPage } from './pages/NotificationsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/listings" element={<Navigate to="/browse" replace />} />
        <Route path="/listings/new" element={<CreateListingPage />} />
        <Route path="/browse/listings/:listingId" element={<BrowseListingDetailPage />} />
        <Route path="/my/listings" element={<MyListingsPage />} />
        <Route path="/my/listings/:listingId/edit" element={<EditListingPage />} />
        <Route path="/my/listings/:listingId" element={<MyListingDetailPage />} />
        <Route path="/my/auctions" element={<MyAuctionsPage />} />
        <Route path="/my/activity" element={<MyActivityPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/auctions/new" element={<CreateAuctionPage />} />
        <Route path="/auctions" element={<AuctionsPage />} />
        <Route path="/browse/auctions/:auctionId" element={<BrowseAuctionDetailPage />} />
        <Route path="/my/auctions/:auctionId" element={<MyAuctionDetailPage />} />
        <Route path="/listings/:listingId" element={<LegacyListingRedirectPage />} />
        <Route path="/auctions/:auctionId" element={<LegacyAuctionRedirectPage />} />
        <Route path="/admin/listings" element={<AdminListingsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/auctions" element={<AdminAuctionsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
