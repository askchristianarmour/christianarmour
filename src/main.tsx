import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppSeo } from './components/AppSeo'
import { AuthProvider } from './contexts/AuthProvider'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/ToastContainer'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { ArticleDetail } from './pages/ArticleDetail'
import { Articles } from './pages/Articles'
import { TagArticles } from './pages/TagArticles'
import { Profile } from './pages/Profile'
import { Activity } from './pages/Activity'
import { Analytics } from './pages/Analytics'
import { Ask } from './pages/Ask'
import { About } from './pages/About'
import { WritePost } from './pages/WritePost'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
          <AppSeo />
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/tags/:tag" element={<TagArticles />} />
              <Route path="/articles/:postId" element={<ArticleDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/add-post" element={<WritePost />} />
              <Route path="/ask" element={<Ask />} />
            </Route>
          </Routes>
          </BrowserRouter>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)


