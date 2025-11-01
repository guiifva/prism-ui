import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CampaignList from './pages/CampaignList'
import CampaignForm from './pages/CampaignForm'
import CampaignDetails from './pages/CampaignDetails'
import BannerList from './pages/BannerList'
import BannerForm from './pages/BannerForm'
import BannerDetails from './pages/BannerDetails'
import BannerEdit from './pages/BannerEdit'
import './index.css'
import { ThemeProvider } from './theme/ThemeProvider'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider } from './contexts/AuthContext'
import ToastContainer from './components/ToastContainer'
import AuthGuard from './components/AuthGuard'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthGuard>
              <Routes>
                <Route path="/" element={<CampaignList />} />
                <Route path="/campaigns/new" element={<CampaignForm />} />
                <Route path="/campaigns/:id" element={<CampaignDetails />} />
                <Route path="/campaigns/:id/edit" element={<CampaignForm />} />
                <Route path="/banners" element={<BannerList />} />
                <Route path="/banners/new" element={<BannerForm />} />
                <Route path="/banners/:id" element={<BannerDetails />} />
                <Route path="/banners/:id/edit" element={<BannerEdit />} />
              </Routes>
              <ToastContainer />
            </AuthGuard>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
